import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ── Mailjet ─────────────────────────────────────────── */
async function sendMailjet(to: string, subject: string, htmlBody: string) {
  const MJ_API_KEY = Deno.env.get('MJ_API_KEY') ?? ''
  const MJ_SECRET_KEY = Deno.env.get('MJ_SECRET_KEY') ?? ''

  if (!MJ_API_KEY || !MJ_SECRET_KEY) {
    console.error('Mailjet keys not configured')
    return { success: false, error: 'Mailjet non configuré' }
  }

  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${MJ_API_KEY}:${MJ_SECRET_KEY}`),
    },
    body: JSON.stringify({
      Messages: [{
        From: { Email: 'pro@verimo.fr', Name: 'Verimo Pro' },
        To: [{ Email: to }],
        Subject: subject,
        HTMLPart: htmlBody,
      }]
    })
  })

  const data = await res.json()
  if (!res.ok) return { success: false, error: JSON.stringify(data) }
  return { success: true }
}

/* ── Template mail invitation pro ────────────────────── */
function buildInvitationEmail(prenom: string, token: string, plan?: string) {
  const setupUrl = `https://pro.verimo.fr/setup-account?token=${token}`
  const planLabel = plan === 'starter' ? 'Starter' : plan === 'power' ? 'Power' : plan === 'decouverte' ? 'Découverte' : null

  const planBlock = planLabel
    ? `<tr><td style="padding:0 28px 24px;">
        <div style="background:linear-gradient(135deg,#f0f7fb,#e8f4f8);border-radius:12px;padding:14px 18px;border:1px solid #d0e8f0;">
          <p style="color:#2a7d9c;font-size:14px;font-weight:600;margin:0;text-align:center;">
            ✨ L'offre <strong>${planLabel}</strong> a été pré-sélectionnée pour vous.
          </p>
        </div>
      </td></tr>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:20px 12px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);width:100%;max-width:560px;">
        
        <tr><td style="background:linear-gradient(135deg,#0a1f2d,#1a4a5e);padding:36px 24px 28px;text-align:center;">
          <img src="https://www.verimo.fr/logo-blanc.png" alt="Verimo" width="180" style="display:block;margin:0 auto 14px;max-width:180px;height:auto;" />
          <span style="display:inline-block;background:linear-gradient(135deg,#7dd3fc,#38bdf8);color:#0a1f2d;font-size:11px;font-weight:800;padding:5px 16px;border-radius:100px;letter-spacing:0.1em;">PRO</span>
        </td></tr>

        <tr><td style="padding:32px 28px 12px;">
          <h2 style="color:#0f2d3d;font-size:22px;font-weight:800;margin:0 0 16px;text-align:center;">🎉 Bienvenue ${prenom} !</h2>
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;text-align:center;">
            Votre espace professionnel Verimo est prêt.<br>
            Définissez votre mot de passe pour commencer.
          </p>
        </td></tr>

        <tr><td style="padding:0 28px 28px;text-align:center;">
          <a href="${setupUrl}" style="display:inline-block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;font-size:16px;font-weight:700;padding:15px 44px;border-radius:14px;text-decoration:none;box-shadow:0 8px 24px rgba(15,45,61,0.2);">
            🔐 Activer mon compte
          </a>
        </td></tr>

        ${planBlock}

        <tr><td style="padding:0 28px;"><hr style="border:none;border-top:1px solid #f1f5f9;margin:0;"></td></tr>

        <tr><td style="padding:24px 28px 28px;">
          <p style="color:#0f2d3d;font-size:15px;font-weight:800;margin:0 0 16px;">💼 Votre espace vous permettra de :</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:28px;"><span style="font-size:16px;">📊</span></td>
              <td style="padding:8px 0 8px 8px;color:#374151;font-size:14px;line-height:1.6;">Analyser les dossiers immobiliers en quelques minutes</td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:28px;"><span style="font-size:16px;">🏆</span></td>
              <td style="padding:8px 0 8px 8px;color:#374151;font-size:14px;line-height:1.6;">Obtenir un score /20 et des points de vigilance détaillés</td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:28px;"><span style="font-size:16px;">📧</span></td>
              <td style="padding:8px 0 8px 8px;color:#374151;font-size:14px;line-height:1.6;">Envoyer les rapports à vos clients par email</td>
            </tr>
            <tr>
              <td style="padding:8px 0;vertical-align:top;width:28px;"><span style="font-size:16px;">🎨</span></td>
              <td style="padding:8px 0 8px 8px;color:#374151;font-size:14px;line-height:1.6;">Personnaliser votre dashboard avec votre branding</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 28px 24px;">
          <p style="color:#94a3b8;font-size:11px;line-height:1.6;margin:0;text-align:center;">
            🔗 Ce lien est personnel et n'expire pas.
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

/* ── Template mail renvoi lien pro ───────────────────── */
function buildResendEmail(prenom: string, token: string) {
  const setupUrl = `https://pro.verimo.fr/setup-account?token=${token}`

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:20px 12px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);width:100%;max-width:560px;">
        
        <tr><td style="background:linear-gradient(135deg,#0a1f2d,#1a4a5e);padding:36px 24px 28px;text-align:center;">
          <img src="https://www.verimo.fr/logo-blanc.png" alt="Verimo" width="180" style="display:block;margin:0 auto 14px;max-width:180px;height:auto;" />
          <span style="display:inline-block;background:linear-gradient(135deg,#7dd3fc,#38bdf8);color:#0a1f2d;font-size:11px;font-weight:800;padding:5px 16px;border-radius:100px;letter-spacing:0.1em;">PRO</span>
        </td></tr>

        <tr><td style="padding:32px 28px 12px;">
          <h2 style="color:#0f2d3d;font-size:22px;font-weight:800;margin:0 0 16px;text-align:center;">🔑 Nouveau lien de connexion</h2>
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;text-align:center;">
            Bonjour ${prenom},<br>
            Voici votre nouveau lien pour accéder à votre espace Verimo Pro.
          </p>
        </td></tr>

        <tr><td style="padding:0 28px 28px;text-align:center;">
          <a href="${setupUrl}" style="display:inline-block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;font-size:16px;font-weight:700;padding:15px 44px;border-radius:14px;text-decoration:none;box-shadow:0 8px 24px rgba(15,45,61,0.2);">
            🔐 Accéder à mon espace
          </a>
        </td></tr>

        <tr><td style="padding:0 28px 24px;">
          <p style="color:#94a3b8;font-size:11px;line-height:1.6;margin:0;text-align:center;">
            🔗 Ce lien est personnel et n'expire pas.
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

/* ── Template mail envoi rapport au client — Option B ── */
function buildReportShareEmail(
  recipientFirstname: string,
  message: string,
  reports: { title: string; shareUrl: string }[],
  senderName: string,
  senderCompany: string | null,
  address: string,
  proLogoUrl?: string | null,
  senderNetwork?: string | null,
  senderPhone?: string | null
) {
  const messageHtml = message.replace(/\n/g, '<br>')
  const senderLabel = senderNetwork && senderCompany 
    ? `${senderName} — ${senderNetwork} (${senderCompany})`
    : senderNetwork ? `${senderName} — ${senderNetwork}` 
    : senderCompany ? `${senderName} — ${senderCompany}` 
    : senderName

  const phoneHtml = senderPhone ? `<br><span style="font-weight:400;color:#64748b;">📞 ${senderPhone}</span>` : ''

  const logoBlock = proLogoUrl
    ? `<div style="text-align:center;padding:24px 36px 4px;">
        <img src="${proLogoUrl}" alt="${senderCompany || senderName}" width="160" style="display:block;margin:0 auto;max-width:160px;max-height:70px;height:auto;object-fit:contain;" />
      </div>`
    : ''

  const senderBlock = `<div style="text-align:center;padding:${proLogoUrl ? '8px' : '24px'} 36px 8px;">
    <p style="color:#0f2d3d;font-size:14px;font-weight:700;margin:0;">
      Ce rapport vous est présenté par <strong>${senderLabel}</strong>${phoneHtml}
    </p>
  </div>
  <div style="padding:0 36px;"><hr style="border:none;border-top:1px solid #f1f5f9;margin:12px 0;"></div>`

  const reportsBlock = reports.map(r => {
    const parts = r.title.includes(' — ') ? r.title.split(' — ') : [r.title]
    const docName = parts[0]
    const docAddress = parts.length > 1 ? parts.slice(1).join(' — ') : null

    return `
    <tr><td style="padding:6px 0;">
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#fff;border-radius:12px;border:1px solid #edf2f7;">
        <tr><td style="padding:18px 20px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:36px;height:36px;border-radius:9px;background:#f0f7fb;text-align:center;line-height:36px;flex-shrink:0;">
              <span style="font-size:16px;">🔍</span>
            </div>
            <div style="font-size:14px;font-weight:700;color:#0f172a;line-height:1.4;">${docName}</div>
          </div>
          ${docAddress ? `<div style="font-size:13px;color:#64748b;margin-bottom:12px;padding-left:46px;">${docAddress}</div>` : '<div style="margin-bottom:12px;"></div>'}
          <div style="padding-left:46px;">
            <a href="${r.shareUrl}" style="display:inline-block;background:#2a7d9c;color:#fff;font-size:13px;font-weight:700;padding:9px 20px;border-radius:8px;text-decoration:none;">Consulter →</a>
          </div>
        </td></tr>
      </table>
    </td></tr>`
  }).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    
    <div style="background:linear-gradient(135deg,#1a3a4a,#2a5a6e);padding:24px 36px;text-align:center;">
      <h1 style="color:#fff;font-size:18px;font-weight:800;margin:0 0 6px;">${reports.length === 1 ? 'Analyse immobilière' : `${reports.length} analyses immobilières`}</h1>
      <p style="color:rgba(255,255,255,0.7);font-size:13px;font-weight:600;margin:0;">${address}</p>
    </div>

    ${logoBlock}
    ${senderBlock}

    <div style="padding:0 36px 24px;">
      <div style="color:#374151;font-size:15px;line-height:1.7;white-space:pre-line;">
        ${messageHtml}
      </div>
    </div>

    <div style="padding:0 36px 24px;">
      <table cellpadding="0" cellspacing="0" width="100%">
        ${reportsBlock}
      </table>
    </div>

    <div style="padding:0 36px 20px;text-align:center;">
      <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:0;">
        🔒 ${reports.length > 1 ? 'Ces liens sont personnels et sécurisés.' : 'Ce lien est personnel et sécurisé.'} Aucun compte n'est nécessaire.
      </p>
    </div>

    <div style="background:#f8fafc;padding:14px 36px;border-top:1px solid #f1f5f9;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">
        Rapport généré par <a href="https://verimo.fr" style="color:#2a7d9c;text-decoration:none;">Verimo</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

/* ── Génération token ────────────────────────────────── */
function generateToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  return Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/* ══════════════════════════════════════════════════════════
   MAIN HANDLER
══════════════════════════════════════════════════════════ */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { action } = body

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    /* ══ Actions PUBLIQUES (pas besoin d'auth) ══════════ */

    /* ── Vérifier un token d'invitation (sans auth) ────── */
    if (action === 'verify_pro_token') {
      const { token } = body

      const { data: invitation, error: invErr } = await adminClient.from('pro_invitations')
        .select('*, profiles(full_name, pro_recommended_plan)')
        .eq('token', token)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (invErr || !invitation) {
        return new Response(JSON.stringify({ valid: false, error: 'Token invalide ou déjà utilisé' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({
        valid: true,
        email: invitation.email,
        profile_id: invitation.profile_id,
        full_name: invitation.profiles?.full_name || null,
        pro_recommended_plan: invitation.profiles?.pro_recommended_plan || null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── Finaliser le compte pro (setup password) ──────── */
    if (action === 'setup_pro_account') {
      const { token, password } = body

      const { data: invitation } = await adminClient.from('pro_invitations')
        .select('*, profiles(*)')
        .eq('token', token)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!invitation) {
        return new Response(JSON.stringify({ error: 'Lien invalide ou déjà utilisé' }), { status: 400, headers: corsHeaders })
      }

      const { error: pwError } = await adminClient.auth.admin.updateUserById(invitation.profile_id, {
        password
      })
      if (pwError) return new Response(JSON.stringify({ error: pwError.message }), { status: 400, headers: corsHeaders })

      await adminClient.from('pro_invitations').update({
        accepted_at: new Date().toISOString()
      }).eq('id', invitation.id)

      await adminClient.from('profiles').update({
        pro_onboarding_done: true
      }).eq('id', invitation.profile_id)

      const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
        email: invitation.email,
        password
      })

      if (signInError) {
        return new Response(JSON.stringify({ error: signInError.message }), { status: 400, headers: corsHeaders })
      }

      return new Response(JSON.stringify({
        success: true,
        session: signInData.session,
        user: signInData.user
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ══ Actions AUTHENTIFIÉES (pro ou admin) ═════════════ */

    const authHeader = req.headers.get('Authorization')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: corsHeaders })

    /* ── Envoyer rapport au client (pro ou admin) — single ── */
    if (action === 'send_report') {
      const { analysis_id, recipient_name, recipient_firstname, recipient_email, message } = body

      const { data: analysis } = await adminClient.from('analyses')
        .select('*').eq('id', analysis_id).single()
      if (!analysis) return new Response(JSON.stringify({ error: 'Analyse introuvable' }), { status: 404, headers: corsHeaders })

      const { data: callerProfile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single()
      if (analysis.user_id !== user.id && callerProfile?.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Vous ne pouvez envoyer que vos propres analyses.' }), { status: 403, headers: corsHeaders })
      }

      const senderId = analysis.user_id
      const { data: senderProfile } = await adminClient.from('profiles').select('*').eq('id', senderId).single()

      const shareToken = generateToken()
      await adminClient.from('report_shares').insert({
        analysis_id, sender_id: senderId, recipient_name, recipient_firstname: recipient_firstname || null,
        recipient_email, message, share_token: shareToken,
      })

      const shareUrl = `https://verimo.fr/rapport-partage?token=${shareToken}`
      const senderName = senderProfile?.full_name || 'Un professionnel'
      const senderCompany = senderProfile?.pro_company_name || null
      const senderNetwork = senderProfile?.pro_network || null
      const rawAddress = analysis.address || analysis.title || 'Bien immobilier'
      const address = rawAddress.includes(' — ') ? rawAddress.split(' — ').slice(1).join(' — ') : rawAddress
      const replyTo = senderProfile?.pro_contact_email || senderProfile?.email
      const proLogoUrl = senderProfile?.pro_logo_url || null
      const fromName = `${senderName.split(' ')[0]} vous a partagé un rapport`

      const html = buildReportShareEmail(recipient_firstname || recipient_name, message, [{ title: rawAddress, shareUrl }], senderName, senderCompany, address, proLogoUrl, senderNetwork, senderProfile?.pro_contact_phone || senderProfile?.telephone || null)

      const MJ_API_KEY = Deno.env.get('MJ_API_KEY') ?? ''
      const MJ_SECRET_KEY = Deno.env.get('MJ_SECRET_KEY') ?? ''
      await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(`${MJ_API_KEY}:${MJ_SECRET_KEY}`) },
        body: JSON.stringify({ Messages: [{ From: { Email: 'pro@verimo.fr', Name: fromName }, ReplyTo: { Email: replyTo, Name: senderName },
          To: [{ Email: recipient_email, Name: `${recipient_firstname || ''} ${recipient_name}`.trim() }],
          Subject: `🔍 Votre analyse immobilière est prête`, HTMLPart: html }] })
      })

      return new Response(JSON.stringify({ success: true, share_token: shareToken }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── Envoyer plusieurs rapports groupés (pro ou admin) ── */
    if (action === 'send_report_batch') {
      const { analysis_ids, recipient_name, recipient_firstname, recipient_email, message, attachments } = body

      if (!analysis_ids || !Array.isArray(analysis_ids) || analysis_ids.length === 0) {
        return new Response(JSON.stringify({ error: 'Aucune analyse sélectionnée' }), { status: 400, headers: corsHeaders })
      }

      // 🆕 Validation des pièces jointes (optionnelles)
      // Format attendu : [{ filename: string, contentType: string, base64Content: string }]
      // Limite Mailjet : 15 MB pour l'ensemble du message. On se garde une marge de sécurité à 13 MB
      // pour le HTML du mail + overhead réseau. Tout dépassement est refusé proprement ici.
      const SAFE_LIMIT_BYTES = 13 * 1024 * 1024
      let attachmentsPayload: Array<{ ContentType: string; Filename: string; Base64Content: string }> = []
      if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        let totalBytes = 0
        for (const att of attachments) {
          if (!att?.filename || !att?.base64Content || !att?.contentType) {
            return new Response(JSON.stringify({ error: 'Pièce jointe invalide (champs manquants)' }), { status: 400, headers: corsHeaders })
          }
          // Taille réelle du payload base64 (chaque caractère = 1 octet dans le body HTTP)
          totalBytes += att.base64Content.length
        }
        if (totalBytes > SAFE_LIMIT_BYTES) {
          const totalMb = (totalBytes / 1024 / 1024).toFixed(1)
          return new Response(JSON.stringify({
            error: `Taille totale des pièces jointes (${totalMb} MB) trop importante. La limite est de 13 MB. Sélectionnez moins de fichiers ou des fichiers plus légers.`
          }), { status: 413, headers: corsHeaders })
        }
        attachmentsPayload = attachments.map((att: { filename: string; contentType: string; base64Content: string }) => ({
          ContentType: att.contentType,
          Filename: att.filename,
          Base64Content: att.base64Content,
        }))
      }

      const { data: analysesData } = await adminClient.from('analyses').select('*').in('id', analysis_ids)
      if (!analysesData || analysesData.length === 0) {
        return new Response(JSON.stringify({ error: 'Analyses introuvables' }), { status: 404, headers: corsHeaders })
      }

      const { data: callerProfile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single()
      for (const a of analysesData) {
        if (a.user_id !== user.id && callerProfile?.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Vous ne pouvez envoyer que vos propres analyses.' }), { status: 403, headers: corsHeaders })
        }
      }

      const senderId = analysesData[0].user_id
      const { data: senderProfile } = await adminClient.from('profiles').select('*').eq('id', senderId).single()

      const senderName = senderProfile?.full_name || 'Un professionnel'
      const senderCompany = senderProfile?.pro_company_name || null
      const senderNetwork = senderProfile?.pro_network || null
      const replyTo = senderProfile?.pro_contact_email || senderProfile?.email
      const proLogoUrl = senderProfile?.pro_logo_url || null
      const fromName = analysesData.length === 1
        ? `${senderName.split(' ')[0]} vous a partagé un rapport`
        : `${senderName.split(' ')[0]} vous a partagé ${analysesData.length} rapports`

      const reports: { title: string; shareUrl: string }[] = []
      for (const analysis of analysesData) {
        const shareToken = generateToken()
        await adminClient.from('report_shares').insert({
          analysis_id: analysis.id, sender_id: senderId, recipient_name,
          recipient_firstname: recipient_firstname || null, recipient_email, message, share_token: shareToken,
        })
        reports.push({
          title: analysis.address || analysis.title || 'Analyse',
          shareUrl: `https://verimo.fr/rapport-partage?token=${shareToken}`,
        })
      }

      const rawAddress = analysesData[0].address || analysesData[0].title || 'Bien immobilier'
      const address = rawAddress.includes(' — ') ? rawAddress.split(' — ').slice(1).join(' — ') : rawAddress

      const subject = analysesData.length === 1
        ? `🔍 Votre analyse immobilière est prête`
        : `🔍 Vos ${analysesData.length} analyses immobilières sont prêtes`

      const html = buildReportShareEmail(recipient_firstname || recipient_name, message, reports, senderName, senderCompany, address, proLogoUrl, senderNetwork, senderProfile?.pro_contact_phone || senderProfile?.telephone || null)

      const MJ_API_KEY = Deno.env.get('MJ_API_KEY') ?? ''
      const MJ_SECRET_KEY = Deno.env.get('MJ_SECRET_KEY') ?? ''
      // 🆕 Construction du payload Mailjet avec pièces jointes optionnelles
      const mjMessage: Record<string, unknown> = {
        From: { Email: 'pro@verimo.fr', Name: fromName },
        ReplyTo: { Email: replyTo, Name: senderName },
        To: [{ Email: recipient_email, Name: `${recipient_firstname || ''} ${recipient_name}`.trim() }],
        Subject: subject,
        HTMLPart: html,
      }
      if (attachmentsPayload.length > 0) {
        mjMessage.Attachments = attachmentsPayload
      }
      const mailRes = await fetch('https://api.mailjet.com/v3.1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(`${MJ_API_KEY}:${MJ_SECRET_KEY}`) },
        body: JSON.stringify({ Messages: [mjMessage] })
      })

      if (!mailRes.ok) {
        const errData = await mailRes.json()
        return new Response(JSON.stringify({ error: 'Erreur envoi: ' + JSON.stringify(errData) }), { status: 500, headers: corsHeaders })
      }

      return new Response(JSON.stringify({ success: true, reports_sent: reports.length, attachments_sent: attachmentsPayload.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ══ Actions ADMIN UNIQUEMENT ═══════════════════════ */

    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return new Response(JSON.stringify({ error: 'Admin requis' }), { status: 403, headers: corsHeaders })

    /* ── Créer un compte (particulier ou pro) ──────────── */
    if (action === 'create') {
      const { email, password, full_name } = body
      const { data, error } = await adminClient.auth.admin.createUser({
        email, password, user_metadata: { full_name }, email_confirm: true
      })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
      return new Response(JSON.stringify({ user: data.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── Créer un compte pro complet ───────────────────── */
    if (action === 'create_pro') {
      const {
        email, full_name, telephone,
        pro_profile_type, pro_company_name, pro_company_address,
        pro_postal_code, pro_siret, pro_ville, pro_network,
        pro_notes_admin, pro_recommended_plan,
        credits_document, credits_complete,
        contact_pro_id
      } = body

      const tempPassword = generateToken()
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        user_metadata: { full_name },
        email_confirm: true
      })
      if (authError) return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders })

      const userId = authData.user.id

      const { error: profileError } = await adminClient.from('profiles').upsert({
        id: userId,
        full_name: full_name || null,
        email,
        role: 'pro',
        telephone: telephone || null,
        pro_profile_type: pro_profile_type || null,
        pro_company_name: pro_company_name || null,
        pro_company_address: pro_company_address || null,
        pro_postal_code: pro_postal_code || null,
        pro_siret: pro_siret || null,
        pro_ville: pro_ville || null,
        pro_network: pro_network || null,
        pro_notes_admin: pro_notes_admin || null,
        pro_recommended_plan: pro_recommended_plan || null,
        pro_created_at: new Date().toISOString(),
        pro_created_by: user.email,
        pro_contact_pro_id: contact_pro_id || null,
        credits_document: parseInt(credits_document) || 0,
        credits_complete: parseInt(credits_complete) || 0,
        pro_onboarding_done: false,
      }, { onConflict: 'id' })
      if (profileError) return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: corsHeaders })

      const inviteToken = generateToken()
      const { error: inviteError } = await adminClient.from('pro_invitations').insert({
        profile_id: userId,
        email,
        token: inviteToken,
      })
      if (inviteError) console.error('Erreur création invitation:', inviteError)

      if (contact_pro_id) {
        await adminClient.from('contact_pro').update({
          converted_profile_id: userId,
          converted_at: new Date().toISOString(),
        }).eq('id', contact_pro_id)
      }

      return new Response(JSON.stringify({
        user: authData.user,
        invite_token: inviteToken,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── Envoyer mail de connexion pro ──────────────────── */
    if (action === 'send_pro_invitation') {
      const { profile_id } = body

      const { data: proProfile } = await adminClient.from('profiles')
        .select('*').eq('id', profile_id).single()
      if (!proProfile) return new Response(JSON.stringify({ error: 'Profil introuvable' }), { status: 404, headers: corsHeaders })

      let { data: invitation } = await adminClient.from('pro_invitations')
        .select('*').eq('profile_id', profile_id).order('created_at', { ascending: false }).limit(1).single()

      if (!invitation) {
        const newToken = generateToken()
        const { data: newInvite, error: invErr } = await adminClient.from('pro_invitations').insert({
          profile_id,
          email: proProfile.email,
          token: newToken,
        }).select().single()
        if (invErr) return new Response(JSON.stringify({ error: invErr.message }), { status: 400, headers: corsHeaders })
        invitation = newInvite
      }

      const prenom = proProfile.full_name?.split(' ')[0] || 'Bonjour'
      const html = buildInvitationEmail(prenom, invitation.token, proProfile.pro_recommended_plan)
      const mailResult = await sendMailjet(
        proProfile.email,
        '🏢 Bienvenue sur Verimo Pro — Activez votre compte',
        html
      )

      if (!mailResult.success) {
        return new Response(JSON.stringify({ error: 'Erreur envoi mail: ' + mailResult.error }), { status: 500, headers: corsHeaders })
      }

      await adminClient.from('pro_invitations').update({
        sent_at: new Date().toISOString()
      }).eq('id', invitation.id)

      return new Response(JSON.stringify({ success: true, sent_to: proProfile.email }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── Renvoyer mail de connexion (nouveau token) ────── */
    if (action === 'resend_pro_invitation') {
      const { profile_id } = body

      const { data: proProfile } = await adminClient.from('profiles')
        .select('*').eq('id', profile_id).single()
      if (!proProfile) return new Response(JSON.stringify({ error: 'Profil introuvable' }), { status: 404, headers: corsHeaders })

      const newToken = generateToken()
      const { data: newInvite, error: invErr } = await adminClient.from('pro_invitations').insert({
        profile_id,
        email: proProfile.email,
        token: newToken,
      }).select().single()
      if (invErr) return new Response(JSON.stringify({ error: invErr.message }), { status: 400, headers: corsHeaders })

      const prenom = proProfile.full_name?.split(' ')[0] || 'Bonjour'
      const html = buildResendEmail(prenom, newInvite.token)
      const mailResult = await sendMailjet(proProfile.email, '🔑 Verimo Pro — Nouveau lien de connexion', html)

      if (!mailResult.success) {
        return new Response(JSON.stringify({ error: 'Erreur envoi mail: ' + mailResult.error }), { status: 500, headers: corsHeaders })
      }

      await adminClient.from('pro_invitations').update({
        sent_at: new Date().toISOString()
      }).eq('id', newInvite.id)

      return new Response(JSON.stringify({ success: true, sent_to: proProfile.email }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── Inviter par email (existant) ──────────────────── */
    if (action === 'invite') {
      const { email } = body
      const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
      return new Response(JSON.stringify({ user: data.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── Supprimer un compte (existant) ────────────────── */
    if (action === 'delete') {
      const { user_id } = body
      // Forcer la déconnexion de toutes les sessions actives du user
      // (sinon le user supprimé continue à naviguer ~1h tant que son JWT est valide)
      try {
        await adminClient.auth.admin.signOut(user_id, 'global')
      } catch (e) {
        console.warn('[delete] signOut failed (continuing):', e)
      }
      const { error } = await adminClient.auth.admin.deleteUser(user_id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── Reset mot de passe ────────────────────────────── */
    if (action === 'reset_password') {
      const { user_id, new_password } = body
      if (!new_password || new_password.length < 6) {
        return new Response(JSON.stringify({ error: 'Le mot de passe doit contenir au moins 6 caractères.' }), { status: 400, headers: corsHeaders })
      }
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { password: new_password })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── Modifier l'email ──────────────────────────────── */
    if (action === 'update_email') {
      const { user_id, new_email } = body
      if (!new_email || !new_email.includes('@')) {
        return new Response(JSON.stringify({ error: 'Email invalide.' }), { status: 400, headers: corsHeaders })
      }
      const { error } = await adminClient.auth.admin.updateUserById(user_id, { email: new_email })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
      await adminClient.from('profiles').update({ email: new_email }).eq('id', user_id)
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Action inconnue' }), { status: 400, headers: corsHeaders })

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
