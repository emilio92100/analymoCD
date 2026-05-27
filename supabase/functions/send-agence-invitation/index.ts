import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ── Mailjet ─────────────────────────────────────────── */
async function sendMailjet(to: string, subject: string, htmlBody: string, replyTo?: string) {
  const MJ_API_KEY = Deno.env.get('MJ_API_KEY') ?? ''
  const MJ_SECRET_KEY = Deno.env.get('MJ_SECRET_KEY') ?? ''

  if (!MJ_API_KEY || !MJ_SECRET_KEY) {
    console.error('Mailjet keys not configured')
    return { success: false, error: 'Mailjet non configuré' }
  }

  const message: Record<string, unknown> = {
    From: { Email: 'pro@verimo.fr', Name: 'Verimo Pro' },
    To: [{ Email: to }],
    Subject: subject,
    HTMLPart: htmlBody,
  }
  if (replyTo) {
    message.ReplyTo = { Email: replyTo }
  }

  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${MJ_API_KEY}:${MJ_SECRET_KEY}`),
    },
    body: JSON.stringify({ Messages: [message] })
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('Mailjet error:', data)
    return { success: false, error: JSON.stringify(data) }
  }
  return { success: true }
}

/* ── Template mail invitation à l'agent ──────────────── */
function buildInvitationEmail(params: {
  inviter_name: string;
  agence_name: string;
  invitation_url: string;
  expires_in_days: number;
}): string {
  const { inviter_name, agence_name, invitation_url, expires_in_days } = params;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:20px 12px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);width:100%;max-width:640px;">

        <tr><td style="background:linear-gradient(135deg,#0a1f2d,#1a4a5e);padding:36px 24px 28px;text-align:center;">
          <img src="https://www.verimo.fr/logo-blanc.png" alt="Verimo" width="180" style="display:block;margin:0 auto 14px;max-width:180px;height:auto;" />
          <span style="display:inline-block;background:linear-gradient(135deg,#7dd3fc,#38bdf8);color:#0a1f2d;font-size:11px;font-weight:800;padding:5px 16px;border-radius:100px;letter-spacing:0.1em;">INVITATION ÉQUIPE</span>
        </td></tr>

        <tr><td style="padding:36px 28px 12px;">
          <h2 style="color:#0f2d3d;font-size:22px;font-weight:800;margin:0 0 16px;text-align:center;">Vous avez été invité(e)</h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;text-align:center;">
            <strong style="color:#0f2d3d;">${inviter_name}</strong> vous invite à rejoindre
          </p>
          <p style="color:#2a7d9c;font-size:20px;font-weight:800;margin:0 0 24px;text-align:center;">
            ${agence_name}
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;text-align:center;">
            sur Verimo, votre plateforme d'analyse de documents immobiliers.
          </p>
        </td></tr>

        <tr><td style="padding:0 28px 24px;">
          <div style="background:linear-gradient(180deg,#f8fafc 0%,#f0f7fb 100%);border-radius:14px;padding:22px 24px;border:1px solid rgba(42,125,156,0.1);">
            <p style="color:#2a7d9c;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">Ce que vous pourrez faire</p>

            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:0 0 12px;width:36px;vertical-align:top;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#fff;border:1.5px solid #c7dde8;text-align:center;line-height:25px;font-size:14px;color:#2a7d9c;">📁</div>
                </td>
                <td style="padding:0 0 12px 4px;">
                  <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 3px;">Consulter les dossiers de l'équipe</p>
                  <p style="color:#64748b;font-size:12.5px;margin:0;line-height:1.5;">Accès en lecture à toutes les analyses de votre agence</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0;"><hr style="border:none;border-top:0.5px solid rgba(42,125,156,0.15);margin:0;"></td>
              </tr>
              <tr>
                <td style="padding:12px 0;width:36px;vertical-align:top;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#fff;border:1.5px solid #c7dde8;text-align:center;line-height:25px;font-size:14px;color:#2a7d9c;">✨</div>
                </td>
                <td style="padding:12px 0 12px 4px;">
                  <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 3px;">Créer vos propres analyses</p>
                  <p style="color:#64748b;font-size:12.5px;margin:0;line-height:1.5;">Lancez des analyses sur vos propres mandats</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0;"><hr style="border:none;border-top:0.5px solid rgba(42,125,156,0.15);margin:0;"></td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;width:36px;vertical-align:top;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#fff;border:1.5px solid #c7dde8;text-align:center;line-height:25px;font-size:14px;color:#2a7d9c;">📤</div>
                </td>
                <td style="padding:12px 0 0 4px;">
                  <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 3px;">Envoyer les rapports aux clients</p>
                  <p style="color:#64748b;font-size:12.5px;margin:0;line-height:1.5;">Partagez les analyses directement depuis votre espace</p>
                </td>
              </tr>
            </table>
          </div>
        </td></tr>

        <tr><td style="padding:8px 28px 28px;text-align:center;">
          <a href="${invitation_url}" style="display:inline-block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;font-size:15px;font-weight:700;padding:16px 36px;border-radius:12px;text-decoration:none;box-shadow:0 4px 14px rgba(42,125,156,0.3);">
            Rejoindre l'agence →
          </a>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;line-height:1.5;">
            Cette invitation est valable <strong style="color:#64748b;">${expires_in_days} jours</strong>.<br>
            Passé ce délai, demandez à ${inviter_name} de vous renvoyer une invitation.
          </p>
        </td></tr>

        <tr><td style="padding:0 28px 24px;">
          <div style="background:#fef9c3;border-radius:10px;padding:14px 18px;border-left:3px solid #ca8a04;">
            <p style="color:#713f12;font-size:12.5px;line-height:1.5;margin:0;">
              <strong>💡 Astuce :</strong> si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :<br>
              <span style="word-break:break-all;color:#a16207;font-size:11px;">${invitation_url}</span>
            </p>
          </div>
        </td></tr>

        <tr><td style="padding:0 28px 28px;text-align:center;">
          <p style="color:#475569;font-size:13px;line-height:1.6;margin:0 0 4px;">Une question ?</p>
          <p style="color:#0f2d3d;font-size:13px;font-weight:700;margin:0;">
            <a href="mailto:hello@verimo.fr" style="color:#2a7d9c;text-decoration:none;">hello@verimo.fr</a>
          </p>
        </td></tr>

        <tr><td style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #f1f5f9;">
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">
            <strong style="color:#64748b;">Verimo</strong> — Vos documents décryptés, votre décision éclairée.<br>
            <a href="https://verimo.fr" style="color:#2a7d9c;text-decoration:none;">verimo.fr</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/* ── Edge Function principale ─────────────────────────── */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { agence_id, email, invited_by } = body

    if (!agence_id || !email || !invited_by) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Champs manquants : agence_id, email et invited_by sont requis.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Format d\'email invalide.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Client Supabase avec service role pour bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Créer l'invitation via la fonction SQL (avec tous les contrôles)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.rpc('create_agence_invitation', {
      p_agence_id: agence_id,
      p_email: email,
      p_invited_by: invited_by
    })

    if (inviteError) {
      console.error('Erreur create_agence_invitation:', inviteError)
      return new Response(JSON.stringify({
        success: false,
        error: inviteError.message
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const invitation = Array.isArray(inviteData) ? inviteData[0] : inviteData
    if (!invitation || !invitation.token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Impossible de générer le token d\'invitation.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 2. Récupérer les infos pour le mail (nom inviteur + nom agence)
    const { data: agence } = await supabaseAdmin
      .from('agences')
      .select('raison_sociale')
      .eq('id', agence_id)
      .single()

    const { data: inviter } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', invited_by)
      .single()

    const inviter_name = inviter?.full_name || 'Le responsable'
    const agence_name = agence?.raison_sociale || 'votre nouvelle agence'

    // 3. Construire l'URL d'invitation
    const invitation_url = `https://verimo.fr/accept-invitation?token=${invitation.token}`

    // 4. Envoyer le mail
    const mailResult = await sendMailjet(
      email,
      `${inviter_name} vous invite à rejoindre ${agence_name} sur Verimo`,
      buildInvitationEmail({
        inviter_name,
        agence_name,
        invitation_url,
        expires_in_days: 7
      })
    )

    if (!mailResult.success) {
      console.error('Erreur envoi mail Mailjet:', mailResult.error)
      // On garde l'invitation en base mais on remonte l'erreur
      return new Response(JSON.stringify({
        success: false,
        error: 'Invitation créée mais erreur lors de l\'envoi du mail. Vous pouvez la renvoyer.',
        invitation_id: invitation.invitation_id
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      invitation_id: invitation.invitation_id,
      message: `Invitation envoyée à ${email}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({
      success: false,
      error: String(err)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
