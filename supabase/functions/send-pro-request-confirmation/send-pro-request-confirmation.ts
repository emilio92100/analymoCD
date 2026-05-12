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

/* ── Template mail confirmation au prospect ──────────── */
function buildProspectConfirmationEmail(prenom: string): string {
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
          <span style="display:inline-block;background:linear-gradient(135deg,#7dd3fc,#38bdf8);color:#0a1f2d;font-size:11px;font-weight:800;padding:5px 16px;border-radius:100px;letter-spacing:0.1em;">ACCÈS PRO</span>
        </td></tr>

        <tr><td style="padding:36px 28px 12px;">
          <h2 style="color:#0f2d3d;font-size:22px;font-weight:800;margin:0 0 16px;text-align:center;">Bonjour ${prenom},</h2>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;text-align:center;">
            Merci d'avoir choisi <strong style="color:#2a7d9c;">Verimo Pro</strong>. Votre demande nous est bien parvenue et nous l'étudions avec attention.
          </p>
          <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;text-align:center;">
            Notre équipe va prendre contact avec vous <strong style="color:#0f2d3d;">dans les meilleurs délais</strong> pour un échange personnalisé adapté à votre activité.
          </p>
        </td></tr>

        <tr><td style="padding:0 28px 24px;">
          <div style="background:linear-gradient(180deg,#f8fafc 0%,#f0f7fb 100%);border-radius:14px;padding:22px 24px;border:1px solid rgba(42,125,156,0.1);">
            <p style="color:#2a7d9c;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 16px;">Voici ce qui se passe maintenant</p>

            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:0 0 12px;width:36px;vertical-align:top;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#fff;border:1.5px solid #c7dde8;text-align:center;line-height:25px;font-size:12px;font-weight:800;color:#2a7d9c;">1</div>
                </td>
                <td style="padding:0 0 12px 4px;">
                  <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 3px;">🔍 Vérification de votre dossier</p>
                  <p style="color:#64748b;font-size:12.5px;margin:0;line-height:1.5;">Étape rapide</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0;"><hr style="border:none;border-top:0.5px solid rgba(42,125,156,0.15);margin:0;"></td>
              </tr>
              <tr>
                <td style="padding:12px 0;width:36px;vertical-align:top;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#fff;border:1.5px solid #c7dde8;text-align:center;line-height:25px;font-size:12px;font-weight:800;color:#2a7d9c;">2</div>
                </td>
                <td style="padding:12px 0 12px 4px;">
                  <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 3px;">📞 Appel découverte (15 min)</p>
                  <p style="color:#64748b;font-size:12.5px;margin:0;line-height:1.5;">Pour comprendre vos besoins et vous présenter Verimo Pro</p>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0;"><hr style="border:none;border-top:0.5px solid rgba(42,125,156,0.15);margin:0;"></td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;width:36px;vertical-align:top;">
                  <div style="width:28px;height:28px;border-radius:50%;background:#fff;border:1.5px solid #c7dde8;text-align:center;line-height:25px;font-size:12px;font-weight:800;color:#2a7d9c;">3</div>
                </td>
                <td style="padding:12px 0 0 4px;">
                  <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 3px;">🎁 Création de votre accès professionnel</p>
                  <p style="color:#64748b;font-size:12.5px;margin:0;line-height:1.5;">Votre compte est créé après notre échange</p>
                </td>
              </tr>
            </table>
          </div>
        </td></tr>

        <tr><td style="padding:0 28px 28px;">
          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 8px;text-align:center;">
            Si vous avez des questions urgentes, vous pouvez répondre directement à cet email.
          </p>
        </td></tr>

        <tr><td style="padding:0 28px 28px;text-align:center;">
          <p style="color:#475569;font-size:14px;margin:0 0 4px;">À très vite,</p>
          <p style="color:#0f2d3d;font-size:14px;font-weight:800;margin:0;">L'équipe Verimo</p>
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

/* ── Template notification interne pour l'équipe Verimo ─ */
function buildInternalNotificationEmail(data: Record<string, unknown>): string {
  const profileLabels: Record<string, string> = {
    agent: '🏢 Agent immobilier',
    investisseur: '📈 Investisseur',
    marchand: '🔑 Marchand de bien',
    notaire: '⚖️ Notaire',
    autre: '💼 Autre professionnel',
  }

  const profileType = String(data.profile_type || '')
  const profileLabel = profileLabels[profileType] || profileType
  const profileData = (data.profile_data || {}) as Record<string, unknown>

  // Construction d'une liste de paires clé/valeur depuis profile_data
  const profileFields: string[] = []
  for (const [key, value] of Object.entries(profileData)) {
    if (value === null || value === '' || value === undefined) continue
    if (Array.isArray(value) && value.length === 0) continue
    const displayValue = Array.isArray(value) ? value.join(', ') : String(value)
    const labelMap: Record<string, string> = {
      nomAgence: "Nom de l'agence",
      nomSociete: 'Nom société',
      nomSocieteMarchand: 'Nom société',
      nomEtude: "Nom de l'étude",
      nomStructure: 'Structure',
      reseau: 'Réseau',
      tailleAgence: 'Taille agence',
      siret: 'SIRET',
      siretMarchand: 'SIRET',
      rsac: 'N° RSAC',
      typeBien: 'Type de biens',
      zoneGeographique: 'Zone géographique',
      fonction: 'Fonction',
      profession: 'Profession',
      volume: 'Volume',
      interets: 'Intérêts cochés',
    }
    const label = labelMap[key] || key
    profileFields.push(`
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;width:140px;vertical-align:top;">${label}</td>
        <td style="padding:8px 0;color:#0f172a;font-size:13px;font-weight:600;">${displayValue}</td>
      </tr>`)
  }

  const messageBlock = data.message
    ? `<tr><td style="padding:18px 24px;background:#fff7ed;border-left:3px solid #d97706;margin:0;">
         <p style="color:#92400e;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 6px;">Message du prospect</p>
         <p style="color:#0f172a;font-size:14px;line-height:1.6;margin:0;font-style:italic;">"${String(data.message).replace(/"/g, '&quot;')}"</p>
       </td></tr>`
    : ''

  const phone = String(data.telephone || '').replace(/\s/g, '')
  const phoneClean = phone.startsWith('0') ? '+33' + phone.slice(1) : phone

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f7f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f9;padding:20px 12px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);width:100%;max-width:640px;">

        <tr><td style="background:linear-gradient(135deg,#0a1f2d,#1a4a5e);padding:24px 28px;">
          <p style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px;">🔔 Nouvelle demande Verimo Pro</p>
          <h2 style="color:#fff;font-size:18px;font-weight:800;margin:0;">${data.prenom} ${data.nom} — ${profileLabel}</h2>
        </td></tr>

        <tr><td style="padding:24px 28px 12px;">
          <p style="color:#2a7d9c;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">Contact</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;width:100px;">Email</td>
              <td style="padding:6px 0;"><a href="mailto:${data.email}" style="color:#2a7d9c;font-size:13px;font-weight:600;text-decoration:none;">${data.email}</a></td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#64748b;font-size:13px;">Téléphone</td>
              <td style="padding:6px 0;"><a href="tel:${phoneClean}" style="color:#2a7d9c;font-size:13px;font-weight:600;text-decoration:none;">${data.telephone}</a></td>
            </tr>
            ${data.ville ? `<tr><td style="padding:6px 0;color:#64748b;font-size:13px;">Ville</td><td style="padding:6px 0;color:#0f172a;font-size:13px;font-weight:600;">${data.ville}</td></tr>` : ''}
          </table>
        </td></tr>

        ${profileFields.length > 0 ? `
        <tr><td style="padding:8px 28px 0;"><hr style="border:none;border-top:0.5px solid #edf2f7;margin:0;"></td></tr>
        <tr><td style="padding:20px 28px 12px;">
          <p style="color:#2a7d9c;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 8px;">Profil & activité</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            ${profileFields.join('')}
          </table>
        </td></tr>` : ''}

        ${messageBlock}

        <tr><td style="padding:20px 28px 24px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-right:6px;width:50%;">
                <a href="tel:${phoneClean}" style="display:block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;font-size:13px;font-weight:700;padding:12px 16px;border-radius:11px;text-decoration:none;text-align:center;">📞 Rappeler</a>
              </td>
              <td style="padding-left:6px;width:50%;">
                <a href="https://verimo.fr/admin" style="display:block;background:#fff;color:#64748b;font-size:13px;font-weight:700;padding:12px 16px;border-radius:11px;text-decoration:none;border:1.5px solid #edf2f7;text-align:center;">📋 Voir admin</a>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="background:#f8fafc;padding:14px 28px;text-align:center;border-top:1px solid #f1f5f9;">
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">
            Notification automatique · <a href="https://verimo.fr/admin" style="color:#2a7d9c;text-decoration:none;">verimo.fr/admin</a>
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
    const { prenom, nom, email, telephone, ville, profile_type, profile_data, message } = body

    if (!email || !prenom || !nom) {
      return new Response(JSON.stringify({ success: false, error: 'Champs manquants' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    /* Envoi email 1 — confirmation au prospect */
    const prospectEmail = await sendMailjet(
      email,
      'Votre demande Verimo Pro est bien arrivée',
      buildProspectConfirmationEmail(prenom)
    )

    /* Envoi email 2 — notification interne */
    const internalEmail = await sendMailjet(
      'pro@verimo.fr',
      `🔔 Nouvelle demande Pro — ${prenom} ${nom}`,
      buildInternalNotificationEmail({ prenom, nom, email, telephone, ville, profile_type, profile_data, message }),
      email
    )

    return new Response(JSON.stringify({
      success: true,
      prospect_sent: prospectEmail.success,
      internal_sent: internalEmail.success,
    }), {
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
