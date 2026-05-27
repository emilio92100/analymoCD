import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, token, password, full_name } = body

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Token manquant.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // ───────────────────────────────────────────────────────────
    // ACTION 1 : VÉRIFIER LE TOKEN (au chargement de la page)
    // ───────────────────────────────────────────────────────────
    if (action === 'verify') {
      const { data: invitation, error } = await supabaseAdmin
        .from('agence_invitations')
        .select(`
          id,
          agence_id,
          email,
          status,
          expires_at,
          invited_by_name,
          agences ( raison_sociale )
        `)
        .eq('token', token)
        .single()

      if (error || !invitation) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invitation introuvable ou lien invalide.'
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (invitation.status === 'accepted') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Cette invitation a déjà été acceptée.',
          already_accepted: true
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (invitation.status === 'cancelled') {
        return new Response(JSON.stringify({
          success: false,
          error: 'Cette invitation a été annulée.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (new Date(invitation.expires_at) < new Date()) {
        // Marquer comme expirée
        await supabaseAdmin
          .from('agence_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id)

        return new Response(JSON.stringify({
          success: false,
          error: 'Cette invitation a expiré. Demandez à votre responsable de vous en renvoyer une.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Vérifier si l'email a déjà un compte (cas où la personne est déjà cliente Verimo solo)
      const { data: existingUser } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('id', (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email?.toLowerCase() === invitation.email.toLowerCase())?.id || '00000000-0000-0000-0000-000000000000')
        .maybeSingle()

      // @ts-ignore — supabase typings sont chiantes sur les jointures
      const agence_name = invitation.agences?.raison_sociale || 'votre agence'

      return new Response(JSON.stringify({
        success: true,
        email: invitation.email,
        agence_name,
        inviter_name: invitation.invited_by_name || 'Le responsable',
        expires_at: invitation.expires_at,
        existing_account: !!existingUser,
        existing_full_name: existingUser?.full_name || null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ───────────────────────────────────────────────────────────
    // ACTION 2 : ACCEPTER L'INVITATION (créer compte + rattacher)
    // ───────────────────────────────────────────────────────────
    if (action === 'accept') {
      if (!password || password.length < 8) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Le mot de passe doit contenir au moins 8 caractères.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!full_name || full_name.trim().length < 2) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Veuillez renseigner votre nom complet.'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // 1. Récupérer l'invitation
      const { data: invitation, error: invErr } = await supabaseAdmin
        .from('agence_invitations')
        .select('*')
        .eq('token', token)
        .single()

      if (invErr || !invitation) {
        return new Response(JSON.stringify({ success: false, error: 'Invitation introuvable.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (invitation.status !== 'pending') {
        return new Response(JSON.stringify({
          success: false,
          error: `Cette invitation est ${invitation.status === 'accepted' ? 'déjà acceptée' : 'plus valide'}.`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return new Response(JSON.stringify({ success: false, error: 'Cette invitation a expiré.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // 2. Vérifier si l'utilisateur existe déjà (compte solo existant)
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers()
      const existingUser = usersList.users.find(
        u => u.email?.toLowerCase() === invitation.email.toLowerCase()
      )

      let user_id: string

      if (existingUser) {
        // Cas 1 : compte existant → on ne crée pas de nouveau compte
        // On rattache simplement à l'agence (l'utilisateur garde son mdp actuel)
        user_id = existingUser.id

        // Mettre à jour son full_name si fourni
        if (full_name) {
          await supabaseAdmin
            .from('profiles')
            .update({ full_name: full_name.trim() })
            .eq('id', user_id)
        }
      } else {
        // Cas 2 : nouveau compte → on le crée
        const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email: invitation.email,
          password,
          email_confirm: true, // pas de confirmation par mail nécessaire (l'invitation valide déjà l'email)
          user_metadata: { full_name: full_name.trim() }
        })

        if (createErr || !newUser.user) {
          console.error('Erreur création user:', createErr)
          return new Response(JSON.stringify({
            success: false,
            error: createErr?.message || 'Impossible de créer le compte.'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        user_id = newUser.user.id

        // S'assurer que le profil est bien créé avec le full_name
        await supabaseAdmin
          .from('profiles')
          .upsert({ id: user_id, full_name: full_name.trim() })
      }

      // 3. Appeler la fonction SQL pour rattacher à l'agence
      const { error: acceptErr } = await supabaseAdmin.rpc('accept_agence_invitation', {
        p_token: token,
        p_user_id: user_id
      })

      if (acceptErr) {
        console.error('Erreur accept_agence_invitation:', acceptErr)
        return new Response(JSON.stringify({
          success: false,
          error: acceptErr.message || 'Impossible de rattacher à l\'agence.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // 4. Générer une session pour connecter l'utilisateur immédiatement
      const { data: sessionData, error: sessionErr } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: invitation.email,
      })

      // Note : generateLink ne crée pas de vraie session.
      // Pour une UX fluide, on retourne un succès et le frontend reconnecte via signInWithPassword
      // (seulement pour les NOUVEAUX comptes — pour les comptes existants, redirection vers /connexion)

      return new Response(JSON.stringify({
        success: true,
        agence_id: invitation.agence_id,
        is_new_account: !existingUser,
        email: invitation.email,
        message: 'Bienvenue dans l\'équipe !'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: false, error: 'Action inconnue.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
