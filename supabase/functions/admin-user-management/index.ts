import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* ── Mailjet ─────────────────────────────────────────── */
async function sendMailjet(
  to: string,
  subject: string,
  htmlBody: string,
  attachments?: Array<{ Filename: string; ContentType: string; Base64Content: string }>
) {
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

  if (attachments && attachments.length > 0) {
    message.Attachments = attachments
  }

  const res = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa(`${MJ_API_KEY}:${MJ_SECRET_KEY}`),
    },
    body: JSON.stringify({
      Messages: [message]
    })
  })

  const data = await res.json()
  if (!res.ok) return { success: false, error: JSON.stringify(data) }
  return { success: true }
}

/* ── Template mail invitation pro ────────────────────── */
function buildInvitationEmail(prenom: string, token: string, plan?: string, estAgence?: boolean) {
  const setupUrl = `https://pro.verimo.fr/setup-account?token=${token}`
  const planLabel = plan === 'starter' ? 'Starter' : plan === 'power' ? 'Power' : plan === 'decouverte' ? 'Découverte' : null

  // 🆕 Récap de l'offre Agence directement dans le mail d'activation.
  // Avant, cette information partait dans un SECOND mail dont le bouton menait
  // au dashboard — donc à une page de connexion, sans mot de passe. Un seul mail
  // désormais : il informe ET mène au bon endroit.
  const agenceBlock = estAgence
    ? `<tr><td style="padding:0 28px 24px;">
        <div style="background:#fffbeb;border-radius:12px;padding:18px 20px;border:1px solid #fde68a;">
          <p style="color:#78350f;font-size:14px;font-weight:800;margin:0 0 10px;text-align:center;">
            🏛 Votre formule Agence vous attend
          </p>
          <p style="color:#92400e;font-size:13px;line-height:1.7;margin:0 0 10px;text-align:center;">
            <strong>149,90 € HT/mois</strong> — 15 analyses complètes + 30 analyses simples,
            jusqu'à 3 agents, pool de crédits partagé, rapports en marque blanche.
          </p>
          <p style="color:#92400e;font-size:12.5px;line-height:1.6;margin:0;text-align:center;">
            Activez votre compte ci-dessus : la formule vous sera proposée dans votre espace,
            et vous pourrez y inviter votre équipe.
          </p>
        </div>
      </td></tr>`
    : ''

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
        ${agenceBlock}

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

/* ── 🏛 Template mail proposition agence ─────────────────
   Envoyé quand l'admin clique "Envoyer la proposition agence"
   sur la fiche d'un compte pro_profile_type='agence'.
   Mobile responsive, signature L'équipe Verimo + Alexandre Rogelet.
─────────────────────────────────────────────────────── */
function buildAgenceProposalEmail(prenom: string) {
  const dashboardUrl = 'https://pro.verimo.fr/dashboard/abonnement'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Verimo Pro · Votre formule agence est prête</title>
  <style>
    body, table, td, p, a, h1, h2 { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    @media only screen and (max-width:680px) {
      .ag-container { width:100% !important; max-width:100% !important; border-radius:0 !important; }
      .ag-padding { padding-left:20px !important; padding-right:20px !important; }
      .ag-header-pad { padding:36px 20px 30px !important; }
      .ag-h1 { font-size:22px !important; line-height:1.3 !important; }
      .ag-cta { display:block !important; width:100% !important; box-sizing:border-box !important; padding:16px 20px !important; }
      .ag-feature-row td { display:block !important; width:100% !important; padding:8px 0 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Texte fallback pour les clients qui ne rendent pas le HTML -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    Bonjour ${prenom}, suite à notre échange votre formule Verimo Pro · Agence est prête à activer. 149,90 € HT/mois — 15 analyses complètes + 30 analyses simples par mois, jusqu'à 3 agents. Activez votre formule sur ${dashboardUrl}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f9fb;padding:30px 0;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="640" class="ag-container" style="max-width:640px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,45,61,0.08);">

        <!-- ═════ Header dégradé bleu nuit + logo + badge AGENCE ═════ -->
        <tr><td class="ag-header-pad" style="background:linear-gradient(135deg,#0e3a4a 0%,#134454 50%,#1a526a 100%);padding:42px 32px 36px;text-align:center;">
          <img src="https://www.verimo.fr/logo-blanc.png" alt="Verimo" width="180" style="display:block;margin:0 auto 18px;max-width:180px;height:auto;" />
          <span style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#0e3a4a;font-size:11px;font-weight:800;padding:6px 18px;border-radius:100px;letter-spacing:0.12em;">🏛 AGENCE</span>
        </td></tr>

        <!-- ═════ Titre + accroche ═════ -->
        <tr><td class="ag-padding" style="padding:36px 36px 8px;">
          <h1 class="ag-h1" style="color:#0f2d3d;font-size:26px;font-weight:900;margin:0 0 14px;text-align:center;letter-spacing:-0.5px;line-height:1.25;">
            Votre formule agence est prête à activer
          </h1>
          <p style="color:#475569;font-size:15px;line-height:1.7;margin:0;text-align:center;">
            Bonjour ${prenom},<br>
            Suite à notre échange, voici votre formule <strong>Verimo Pro · Agence</strong>.
          </p>
        </td></tr>

        <!-- ═════ Prix mis en avant ═════ -->
        <tr><td class="ag-padding" style="padding:24px 36px 8px;text-align:center;">
          <div style="display:inline-block;background:linear-gradient(135deg,#f0f7fb,#e8f4f8);border-radius:14px;padding:18px 32px;border:1px solid #d0e8f0;">
            <div style="color:#2a7d9c;font-size:11px;font-weight:700;letter-spacing:0.12em;margin-bottom:6px;">TARIF MENSUEL</div>
            <div style="color:#0f2d3d;font-size:34px;font-weight:900;line-height:1;letter-spacing:-1px;">
              149,90 € <span style="font-size:16px;font-weight:600;color:#64748b;">HT</span>
            </div>
            <div style="color:#64748b;font-size:12px;margin-top:6px;">soit 179,88 € TTC / mois (TVA 20 %)</div>
          </div>
        </td></tr>

        <!-- ═════ Récap features avec emojis ═════ -->
        <tr><td class="ag-padding" style="padding:28px 36px 8px;">
          <div style="background:#f8fafc;border-radius:14px;padding:22px 24px;border:1px solid #e2e8f0;">
            <div style="color:#0f2d3d;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px;text-align:center;">
              Inclus dans votre formule
            </div>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td style="padding:7px 0;font-size:14.5px;color:#334155;line-height:1.5;">
                <span style="font-size:18px;margin-right:8px;">📊</span> <strong>15 analyses complètes</strong> par mois (jusqu'à 15 documents par bien)
              </td></tr>
              <tr><td style="padding:7px 0;font-size:14.5px;color:#334155;line-height:1.5;">
                <span style="font-size:18px;margin-right:8px;">📄</span> <strong>30 analyses simples</strong> par mois (1 document)
              </td></tr>
              <tr><td style="padding:7px 0;font-size:14.5px;color:#334155;line-height:1.5;">
                <span style="font-size:18px;margin-right:8px;">👥</span> Jusqu'à <strong>3 agents</strong> par compte agence
              </td></tr>
              <tr><td style="padding:7px 0;font-size:14.5px;color:#334155;line-height:1.5;">
                <span style="font-size:18px;margin-right:8px;">🎨</span> Rapports en <strong>marque blanche</strong> à vos couleurs
              </td></tr>
              <tr><td style="padding:7px 0;font-size:14.5px;color:#334155;line-height:1.5;">
                <span style="font-size:18px;margin-right:8px;">⏰</span> Crédits <strong>cumulables jusqu'à 2 mois</strong>
              </td></tr>
              <tr><td style="padding:7px 0;font-size:14.5px;color:#334155;line-height:1.5;">
                <span style="font-size:18px;margin-right:8px;">✅</span> <strong>Sans engagement</strong>, résiliable à tout moment
              </td></tr>
            </table>
          </div>
        </td></tr>

        <!-- ═════ CTA principal ═════ -->
        <tr><td style="padding:32px 36px 8px;text-align:center;">
          <a href="${dashboardUrl}" class="ag-cta" style="display:inline-block;background:linear-gradient(135deg,#0e3a4a,#2a7d9c);color:#fff;font-size:16px;font-weight:800;padding:16px 44px;border-radius:14px;text-decoration:none;box-shadow:0 8px 24px rgba(15,45,61,0.22);letter-spacing:0.02em;">
            Activer ma formule →
          </a>
          <p style="color:#94a3b8;font-size:12.5px;line-height:1.6;margin:14px 0 0;">
            Paiement sécurisé via Stripe · Facture PDF envoyée automatiquement chaque mois
          </p>
        </td></tr>

        <!-- ═════ Note finale ═════ -->
        <tr><td class="ag-padding" style="padding:24px 36px 28px;">
          <p style="color:#64748b;font-size:13.5px;line-height:1.7;margin:0;text-align:center;font-style:italic;">
            Si vous avez la moindre question avant de finaliser, n'hésitez pas à nous répondre directement à ce mail.
          </p>
        </td></tr>

        <!-- ═════ Signature ═════ -->
        <tr><td class="ag-padding" style="padding:0 36px 32px;">
          <div style="border-top:1px solid #f1f5f9;padding-top:22px;">
            <p style="color:#475569;font-size:14px;line-height:1.7;margin:0;">
              À très vite,<br>
              <strong style="color:#0f2d3d;">L'équipe Verimo</strong><br>
              <span style="color:#64748b;font-size:13px;">Alexandre Rogelet — Fondateur</span><br>
              <a href="mailto:pro@verimo.fr" style="color:#2a7d9c;font-size:13px;text-decoration:none;">pro@verimo.fr</a>
            </p>
          </div>
        </td></tr>

        <!-- ═════ Footer ═════ -->
        <tr><td style="background:#f8fafc;padding:22px 36px;text-align:center;border-top:1px solid #f1f5f9;">
          <p style="color:#94a3b8;font-size:11.5px;margin:0;line-height:1.6;">
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

/* ── Template mail invitation découverte (DEMO) ────────── */
function buildDemoInvitationEmail(prenom: string, token: string, customMessage?: string | null, hasAttachment?: boolean) {
  const setupUrl = `https://pro.verimo.fr/setup-account?token=${token}`

  // Texte personnalisable par l'admin avant envoi (fallback : texte par défaut)
  const introHtml = customMessage && customMessage.trim().length > 0
    ? customMessage.trim().split('\n').map(line => `<p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 12px;">${line.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('')
    : `
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">Bonjour ${prenom},</p>
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Suite à notre échange, je suis ravi de vous offrir un accès découverte à <strong>Verimo Pro</strong>.
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
        Pendant votre période d'essai, vous bénéficiez de <strong>1 analyse simple</strong> et <strong>1 analyse complète</strong> offertes pour tester notre service.
        Je suis convaincu que ce sera convaincant pour vos clients acheteurs — vous gagnez du temps, vous renforcez votre crédibilité, et vos clients signent plus sereinement.
      </p>
      <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 0;">
        À très vite,<br/>
        <strong>L'équipe Verimo</strong>
      </p>
    `

  const attachmentNote = hasAttachment
    ? `<tr><td style="padding:0 36px 18px;">
        <div style="background:#fef9e7;border-radius:10px;padding:14px 18px;border:1px solid #fde68a;">
          <p style="color:#92400e;font-size:13.5px;margin:0;line-height:1.5;">📎 <strong>Vous trouverez en pièce jointe notre plaquette de présentation</strong> qui récapitule l'ensemble de notre offre et nos cas d'usage concrets pour vous accompagner au quotidien.</p>
        </div>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <style>
    /* Reset & responsive */
    body, table, td, p, a, h1, h2 { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    @media only screen and (max-width:680px) {
      .email-container { width:100% !important; max-width:100% !important; border-radius:0 !important; }
      .email-padding { padding-left:20px !important; padding-right:20px !important; }
      .email-padding-header { padding:32px 20px !important; }
      .email-h1 { font-size:22px !important; }
      .email-cta { display:block !important; width:100% !important; box-sizing:border-box !important; }
      .email-credits-grid { display:block !important; }
      .email-credit-card { display:block !important; width:auto !important; margin-bottom:10px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f5f9fb;padding:30px 0;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="700" class="email-container" style="max-width:700px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(15,45,61,0.08);">

        <!-- Header avec logo et gradient Verimo -->
        <tr><td class="email-padding-header" style="background:linear-gradient(135deg,#0f2d3d,#2a7d9c);padding:40px 36px;text-align:center;">
          <img src="https://www.verimo.fr/logo-blanc.png" alt="Verimo" width="180" style="display:block;margin:0 auto 18px;max-width:180px;height:auto;" />
          <div style="display:inline-block;background:rgba(255,255,255,0.15);padding:7px 16px;border-radius:99px;margin-bottom:14px;">
            <span style="color:#fff;font-size:11.5px;font-weight:700;letter-spacing:0.1em;">🎁 INVITATION DÉCOUVERTE</span>
          </div>
          <h1 class="email-h1" style="color:#fff;font-size:28px;font-weight:800;margin:0 0 8px;letter-spacing:-0.02em;line-height:1.2;">Bienvenue sur Verimo Pro</h1>
          <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">Votre accès découverte est prêt</p>
        </td></tr>

        <!-- Corps -->
        <tr><td class="email-padding" style="padding:36px 36px 18px;">
          ${introHtml}
        </td></tr>

        ${attachmentNote}

        <!-- Bloc bénéfices démo -->
        <tr><td class="email-padding" style="padding:0 36px 28px;">
          <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:14px;padding:22px;border:1px solid #bbf7d0;">
            <p style="color:#14532d;font-size:14.5px;font-weight:700;margin:0 0 16px;">🎁 Vos crédits offerts pour tester</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" class="email-credits-grid">
              <tr>
                <td class="email-credit-card" width="48%" valign="top" style="padding-right:8px;">
                  <div style="background:#fff;border-radius:11px;padding:16px;border:1px solid #bbf7d0;">
                    <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 5px;">📄 1 Analyse simple</p>
                    <p style="color:#475569;font-size:12.5px;margin:0;line-height:1.5;">Analyse rapide d'un document (DPE, compromis, PV d'AG…)</p>
                  </div>
                </td>
                <td class="email-credit-card" width="48%" valign="top" style="padding-left:8px;">
                  <div style="background:#fff;border-radius:11px;padding:16px;border:1px solid #bbf7d0;">
                    <p style="color:#0f172a;font-size:14px;font-weight:700;margin:0 0 5px;">📊 1 Analyse complète</p>
                    <p style="color:#475569;font-size:12.5px;margin:0;line-height:1.5;">Dossier complet noté sur 20, prêt à partager avec vos clients</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td></tr>

        <!-- CTA -->
        <tr><td class="email-padding" style="padding:8px 36px 36px;text-align:center;">
          <a href="${setupUrl}" class="email-cta" style="display:inline-block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;text-decoration:none;font-size:15.5px;font-weight:700;padding:15px 36px;border-radius:12px;box-shadow:0 4px 14px rgba(42,125,156,0.3);">
            Activer mon compte et tester →
          </a>
          <p style="color:#94a3b8;font-size:12px;margin:16px 0 0;">Lien personnel, sans limite de temps. Aucun engagement, aucune carte bancaire requise.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:22px 36px;text-align:center;border-top:1px solid #edf2f7;">
          <p style="color:#94a3b8;font-size:12.5px;margin:0 0 4px;"><strong style="color:#64748b;">Verimo</strong> — Analyse intelligente de documents immobiliers</p>
          <p style="color:#cbd5e1;font-size:11px;margin:0;">Si vous n'attendiez pas ce message, vous pouvez l'ignorer.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}


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
        .select('*, profiles(full_name, pro_recommended_plan, pro_onboarding_done)')
        .eq('token', token)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (invErr || !invitation) {
        return new Response(JSON.stringify({ valid: false, error: 'Token invalide ou déjà utilisé' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // 🆕 Compte déjà activé via un autre lien (ex : le client a reçu 2 invitations et
      // en a déjà utilisé une). On NE réaffiche PAS l'écran de choix de mot de passe,
      // sinon il réinitialiserait silencieusement son mot de passe. On signale
      // "compte déjà actif" → le front propose de se connecter.
      if (invitation.profiles?.pro_onboarding_done === true) {
        return new Response(JSON.stringify({
          valid: false,
          already_active: true,
          email: invitation.email,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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

      // 🆕 Garde-fou : compte déjà activé (via un autre lien) → ne PAS réinitialiser le
      // mot de passe. Le front affiche déjà l'écran "compte actif" ; ceci protège contre
      // un appel direct qui contournerait le front.
      if ((invitation.profiles as { pro_onboarding_done?: boolean } | null)?.pro_onboarding_done === true) {
        return new Response(JSON.stringify({ error: 'Ce compte est déjà actif. Connectez-vous avec votre mot de passe.', already_active: true }), { status: 400, headers: corsHeaders })
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
      const { analysis_ids, recipient_name, recipient_firstname, recipient_email, message, attachments, template_type } = body

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
      // 🆕 Préparer les métadonnées des pièces jointes pour l'historique
      const attachmentFilenames = attachmentsPayload.map(a => a.Filename)
      for (const analysis of analysesData) {
        const shareToken = generateToken()
        await adminClient.from('report_shares').insert({
          analysis_id: analysis.id, sender_id: senderId, recipient_name,
          recipient_firstname: recipient_firstname || null, recipient_email, message, share_token: shareToken,
          // 🆕 Nouvelles colonnes pour traçabilité complète des envois
          attachments_count: attachmentsPayload.length,
          attachment_filenames: attachmentFilenames.length > 0 ? attachmentFilenames : null,
          template_type: template_type || 'rapport_seul',
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

      // ════════════════════════════════════════════════════════════════
      // 📧 ENVOI AUTO du mail d'activation (création de mot de passe)
      // Évite à l'admin de devoir cliquer "Envoyer mail de connexion" après
      // ════════════════════════════════════════════════════════════════
      try {
        const prenom = (full_name as string)?.split(' ')[0] || 'Bonjour'
        const estAgence = pro_profile_type === 'agence'
        const htmlActivation = buildInvitationEmail(prenom, inviteToken, pro_recommended_plan, estAgence)
        const mailActivationResult = await sendMailjet(
          email,
          estAgence
            ? '🏛 Bienvenue sur Verimo Pro — Activez votre compte Agence'
            : '🏢 Bienvenue sur Verimo Pro — Activez votre compte',
          htmlActivation
        )
        if (mailActivationResult.success) {
          await adminClient.from('pro_invitations').update({
            sent_at: new Date().toISOString()
          }).eq('token', inviteToken)
          console.log(`[create_pro] ✅ Mail d'activation envoyé à ${email}`)
        } else {
          console.error(`[create_pro] ⚠️ Mail d'activation échoué: ${mailActivationResult.error}`)
        }
      } catch (e) {
        console.error('[create_pro] Exception non-critique envoi mail activation:', e)
      }

      // ════════════════════════════════════════════════════════════════
      // 🏛 SI compte agence → créer l'entité agences + rattacher le pro comme responsable
      // L'agence est créée avec nb_users_max=1 (le responsable uniquement).
      // Quand il paiera son abonnement Stripe, le webhook passera à nb_users_max=3.
      // Cela permet à l'admin de pré-configurer l'agence avant même le paiement.
      // ════════════════════════════════════════════════════════════════
      if (pro_profile_type === 'agence') {
        try {
          const raisonSociale = pro_company_name || full_name || 'Agence sans nom'

          const { data: newAgence, error: agenceErr } = await adminClient
            .from('agences')
            .insert({
              raison_sociale: raisonSociale,
              siret: pro_siret || null,
              adresse: pro_company_address || null,
              email_contact: email,
              telephone: telephone || null,
              plan: 'agence_3',
              nb_users_max: 1, // 1 user max tant que pas d'abonnement Stripe actif
              status: 'active',
              credits_complete: 0,
              credits_document: 0,
              activated_by_admin: user.id,
              admin_notes: pro_notes_admin || null,
            })
            .select('id')
            .single()

          if (agenceErr || !newAgence) {
            console.error('[create_pro/agence] Erreur création agence:', agenceErr)
            // On laisse passer : compte créé même si l'entité agence échoue
          } else {
            const { error: memberErr } = await adminClient
              .from('agence_members')
              .insert({
                agence_id: newAgence.id,
                user_id: userId,
                role: 'responsable',
              })
            if (memberErr) {
              console.error('[create_pro/agence] Erreur rattachement responsable:', memberErr)
            } else {
              console.log(`[create_pro/agence] Agence ${newAgence.id} créée + ${email} rattaché comme responsable`)
            }
          }
        } catch (e) {
          console.error('[create_pro/agence] Exception non-critique:', e)
        }
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

    /* ── 🏛 Envoyer la proposition agence ──────────────────
       Débloque la souscription Stripe agence pour ce compte +
       envoie un mail HTML avec récap tarifaire + CTA d'activation.
       Action déclenchée par le bouton admin "🏛 Envoyer la proposition agence".
    ───────────────────────────────────────────────────────────── */
    if (action === 'unlock_agence_subscription') {
      // 🆕 skip_email : débloque la souscription SANS envoyer la proposition.
      // Utilisé à la création d'un compte agence, où le mail d'activation part déjà.
      // Sans ça, le prospect recevait 2 mails à la même minute.
      const { profile_id, skip_email } = body

      const { data: proProfile, error: profileErr } = await adminClient
        .from('profiles')
        .select('id, email, full_name, pro_profile_type, pro_agence_subscription_unlocked')
        .eq('id', profile_id)
        .single()

      if (profileErr || !proProfile) {
        return new Response(JSON.stringify({ error: 'Profil introuvable' }), { status: 404, headers: corsHeaders })
      }

      if (proProfile.pro_profile_type !== 'agence') {
        return new Response(JSON.stringify({ error: 'Ce compte n\'est pas de type Agence. Modifiez son profil avant d\'envoyer la proposition.' }), { status: 400, headers: corsHeaders })
      }

      // UPDATE flag + timestamp
      const { error: updErr } = await adminClient
        .from('profiles')
        .update({
          pro_agence_subscription_unlocked: true,
          pro_agence_proposition_sent_at: new Date().toISOString(),
        })
        .eq('id', profile_id)

      if (updErr) {
        return new Response(JSON.stringify({ error: 'Erreur DB: ' + updErr.message }), { status: 500, headers: corsHeaders })
      }

      // Déblocage seul (création de compte) : on s'arrête ici, sans mail.
      if (skip_email) {
        return new Response(JSON.stringify({
          success: true, mail_sent: false, skipped: true,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Envoi du mail HTML
      const prenom = proProfile.full_name?.split(' ')[0] || 'Bonjour'
      const html = buildAgenceProposalEmail(prenom)
      const mailResult = await sendMailjet(
        proProfile.email,
        'Verimo Pro · Votre formule agence est prête à activer',
        html,
      )

      if (!mailResult.success) {
        // Le flag a été mis à true en DB mais le mail a échoué : on retourne quand même OK
        // pour ne pas bloquer l'admin, mais on signale l'erreur mail.
        console.error('[unlock_agence_subscription] Mail Mailjet échoué:', mailResult.error)
        return new Response(JSON.stringify({
          success: true,
          mail_sent: false,
          mail_error: mailResult.error,
          message: 'Souscription débloquée mais erreur d\'envoi du mail. Vérifiez Mailjet.',
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({
        success: true,
        mail_sent: true,
        sent_to: proProfile.email,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── 🚫 Annuler la proposition agence ─────────────────
       Remet le flag à false (suppression silencieuse côté client,
       sans mail). Utile si l'admin a cliqué par erreur ou si la
       négo est annulée.
    ───────────────────────────────────────────────────────────── */
    if (action === 'cancel_agence_proposition') {
      const { profile_id } = body

      const { data: proProfile, error: profileErr } = await adminClient
        .from('profiles')
        .select('id, pro_profile_type, pro_agence_subscription_unlocked')
        .eq('id', profile_id)
        .single()

      if (profileErr || !proProfile) {
        return new Response(JSON.stringify({ error: 'Profil introuvable' }), { status: 404, headers: corsHeaders })
      }

      // UPDATE flag à false + reset timestamp
      const { error: updErr } = await adminClient
        .from('profiles')
        .update({
          pro_agence_subscription_unlocked: false,
          pro_agence_proposition_sent_at: null,
        })
        .eq('id', profile_id)

      if (updErr) {
        return new Response(JSON.stringify({ error: 'Erreur DB: ' + updErr.message }), { status: 500, headers: corsHeaders })
      }

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── 🎁 Offrir des crédits au POOL BONUS d'une agence ──────────
       Geste commercial : ajoute des crédits durables (hors quota mensuel)
       au pool partagé de l'agence + trace dans agence_credit_grants.
       Visible immédiatement par tous les membres (get_pro_credits_balance
       additionne déjà credits_*_bonus).
    ───────────────────────────────────────────────────────────── */
    if (action === 'grant_agence_credits') {
      const { agence_id, reason } = body
      const addComplete = parseInt(body.credits_complete_add) || 0
      const addDocument = parseInt(body.credits_document_add) || 0

      if (!agence_id) {
        return new Response(JSON.stringify({ error: 'agence_id requis' }), { status: 400, headers: corsHeaders })
      }
      if (addComplete <= 0 && addDocument <= 0) {
        return new Response(JSON.stringify({ error: 'Indiquez au moins 1 crédit à offrir.' }), { status: 400, headers: corsHeaders })
      }

      // Lire le bonus actuel
      const { data: ag, error: agErr } = await adminClient
        .from('agences')
        .select('credits_complete_bonus, credits_document_bonus')
        .eq('id', agence_id)
        .single()

      if (agErr || !ag) {
        return new Response(JSON.stringify({ error: 'Agence introuvable' }), { status: 404, headers: corsHeaders })
      }

      // Incrémenter le pool bonus (durable, hors quota mensuel)
      const { error: updErr } = await adminClient
        .from('agences')
        .update({
          credits_complete_bonus: (ag.credits_complete_bonus || 0) + addComplete,
          credits_document_bonus: (ag.credits_document_bonus || 0) + addDocument,
        })
        .eq('id', agence_id)

      if (updErr) {
        return new Response(JSON.stringify({ error: 'Erreur DB: ' + updErr.message }), { status: 500, headers: corsHeaders })
      }

      // Tracer (1 ligne par type de crédit offert)
      const grantRows: Record<string, unknown>[] = []
      if (addComplete > 0) grantRows.push({ agence_id, granted_by: user.id, credit_type: 'complete', quantity: addComplete, reason: reason || null })
      if (addDocument > 0) grantRows.push({ agence_id, granted_by: user.id, credit_type: 'document', quantity: addDocument, reason: reason || null })
      if (grantRows.length > 0) {
        const { error: logErr } = await adminClient.from('agence_credit_grants').insert(grantRows)
        if (logErr) console.error('[grant_agence_credits] Log échoué (crédits ajoutés quand même):', logErr.message)
      }

      return new Response(JSON.stringify({
        success: true,
        added_complete: addComplete,
        added_document: addDocument,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── 🆕 23 juin — Modifier le nb max d'utilisateurs d'une agence ──
       Offre sur-mesure (> 3 places). L'admin fixe le plafond ;
       le webhook Stripe ne le redescend plus (max(3, valeur)).
       Garde-fou : jamais en dessous du nombre de membres actifs.
    ───────────────────────────────────────────────────────────── */
    if (action === 'set_agence_users_max') {
      const { agence_id } = body
      const newMax = parseInt(body.nb_users_max)

      if (!agence_id) {
        return new Response(JSON.stringify({ error: 'agence_id requis' }), { status: 400, headers: corsHeaders })
      }
      if (!Number.isFinite(newMax) || newMax < 1 || newMax > 50) {
        return new Response(JSON.stringify({ error: "Nombre d'utilisateurs invalide (1 à 50)." }), { status: 400, headers: corsHeaders })
      }

      // Garde-fou : ne pas descendre sous le nombre de membres actifs déjà présents
      const { count: activeMembers } = await adminClient
        .from('agence_members')
        .select('id', { count: 'exact', head: true })
        .eq('agence_id', agence_id)
        .is('removed_at', null)

      if (typeof activeMembers === 'number' && newMax < activeMembers) {
        return new Response(JSON.stringify({ error: `Impossible : l'agence compte déjà ${activeMembers} membre(s) actif(s).` }), { status: 400, headers: corsHeaders })
      }

      const { error: updErr } = await adminClient
        .from('agences')
        .update({ nb_users_max: newMax })
        .eq('id', agence_id)

      if (updErr) {
        return new Response(JSON.stringify({ error: 'Erreur DB: ' + updErr.message }), { status: 500, headers: corsHeaders })
      }

      return new Response(JSON.stringify({ success: true, nb_users_max: newMax }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── 🗑 SUPPRIMER UNE AGENCE (suppression totale en cascade) ──────
       Quand une agence quitte Verimo, tout part : l'entité, ses membres,
       leurs comptes utilisateurs et leurs analyses. Un ex-agent qui veut
       revenir repasse par la demande pro classique depuis le site.

       ⚠️ CE QUI EST CONSERVÉ (vérifié sur les contraintes de la base) :
       `payments.user_id` et `pro_unit_purchases.user_id` sont en SET NULL →
       les lignes de CA survivent, rattachées à customer_email / customer_name.
       L'historique comptable reste donc intact (obligation de conservation).

       CE QUI PART :
       - via suppression du user : analyses, documents, comparaisons,
         pro_folders, pro_subscriptions, credit_grants, report_shares,
         pro_invitations, emails_log, banners ciblées (tous en CASCADE)
       - via suppression de l'agence : agence_members, agence_invitations,
         agence_credit_grants, dossier_notes (tous en CASCADE)

       ORDRE : on supprime les users AVANT l'agence. Si une suppression
       échoue à mi-parcours, l'agence existe encore et l'état reste lisible
       depuis l'admin (l'inverse laisserait des comptes orphelins).
    ───────────────────────────────────────────────────────────── */
    if (action === 'delete_agence') {
      const { agence_id, confirm_nom } = body

      if (!agence_id) {
        return new Response(JSON.stringify({ error: 'agence_id requis' }), { status: 400, headers: corsHeaders })
      }

      // 1. Charger l'agence et vérifier la confirmation par saisie du nom
      const { data: agence, error: agErr } = await adminClient
        .from('agences')
        .select('id, raison_sociale')
        .eq('id', agence_id)
        .maybeSingle()

      if (agErr || !agence) {
        return new Response(JSON.stringify({ error: 'Agence introuvable' }), { status: 404, headers: corsHeaders })
      }
      if ((confirm_nom || '').trim() !== (agence.raison_sociale || '').trim()) {
        return new Response(JSON.stringify({
          error: "Le nom saisi ne correspond pas à la raison sociale de l'agence."
        }), { status: 400, headers: corsHeaders })
      }

      // 2. Lister les membres (y compris retirés : leurs comptes existent toujours)
      const { data: membres } = await adminClient
        .from('agence_members')
        .select('user_id')
        .eq('agence_id', agence_id)

      const userIds = [...new Set((membres || []).map((m: { user_id: string }) => m.user_id))]

      // Garde-fou : ne jamais supprimer un compte admin par ce chemin
      const { data: profilsMembres } = userIds.length > 0
        ? await adminClient.from('profiles').select('id, email, full_name, role').in('id', userIds)
        : { data: [] as Array<{ id: string; email: string; full_name: string; role: string }> }

      const aSupprimer = (profilsMembres || []).filter(p => p.role !== 'admin')
      const adminsIgnores = (profilsMembres || []).filter(p => p.role === 'admin')

      // 3. Supprimer les comptes utilisateurs un par un
      const supprimes: string[] = []
      const echecs: Array<{ email: string; erreur: string }> = []

      for (const p of aSupprimer) {
        try {
          // Couper les sessions actives : sans ça le JWT reste valide ~1h
          try { await adminClient.auth.admin.signOut(p.id, 'global') } catch (_e) { /* non bloquant */ }
          const { error: delErr } = await adminClient.auth.admin.deleteUser(p.id)
          if (delErr) {
            echecs.push({ email: p.email, erreur: delErr.message })
          } else {
            supprimes.push(p.email)
          }
        } catch (e) {
          echecs.push({ email: p.email, erreur: String(e) })
        }
      }

      // Si AUCUN compte n'a pu être supprimé alors qu'il y en avait,
      // on n'efface pas l'agence : mieux vaut un état cohérent qu'un demi-ménage.
      if (aSupprimer.length > 0 && supprimes.length === 0) {
        return new Response(JSON.stringify({
          error: "Aucun compte n'a pu être supprimé, l'agence a été conservée. Détail : "
            + echecs.map(e => `${e.email} (${e.erreur})`).join(' · ')
        }), { status: 500, headers: corsHeaders })
      }

      // 4. Supprimer l'entité agence (cascade : membres, invitations, grants, notes)
      const { error: delAgErr } = await adminClient.from('agences').delete().eq('id', agence_id)
      if (delAgErr) {
        return new Response(JSON.stringify({
          error: `Comptes supprimés (${supprimes.length}) mais l'agence n'a pas pu être effacée : ${delAgErr.message}`
        }), { status: 500, headers: corsHeaders })
      }

      console.log(`[delete_agence] Agence "${agence.raison_sociale}" supprimée par ${user.email} — ${supprimes.length} compte(s)`)

      return new Response(JSON.stringify({
        success: true,
        raison_sociale: agence.raison_sociale,
        comptes_supprimes: supprimes.length,
        emails_supprimes: supprimes,
        echecs,
        admins_ignores: adminsIgnores.map(a => a.email),
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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

    /* ── DEMO : Créer un compte pro en mode démo + envoi mail ─ */
    if (action === 'create_pro_demo') {
      const {
        email, full_name, pro_company_name,
        telephone,             // 🆕 Téléphone du pro
        pro_profile_type,      // 🆕 Type de profil (agent, investisseur, notaire, autre)
        pro_network,           // 🆕 Réseau (IAD, Safti, etc.)
        pro_siret,             // 🆕 SIRET
        pro_company_address,   // 🆕 Adresse
        pro_postal_code,       // 🆕 Code postal
        pro_ville,             // 🆕 Ville
        pro_notes_admin,       // 🆕 Notes internes admin
        pro_recommended_plan,  // 🆕 Plan affiché au prospect à la fin de sa démo
        custom_message,        // Texte personnalisé pour le mail (optionnel)
        attachment,            // PDF en base64 (optionnel) : { filename, contentType, base64Content }
      } = body

      if (!email || !full_name) {
        return new Response(JSON.stringify({ error: 'Email et nom complet obligatoires.' }), { status: 400, headers: corsHeaders })
      }

      // 1. Création du compte auth
      const tempPassword = generateToken()
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password: tempPassword,
        user_metadata: { full_name },
        email_confirm: true
      })
      if (authError) return new Response(JSON.stringify({ error: authError.message }), { status: 400, headers: corsHeaders })

      const userId = authData.user.id

      // 2. Création du profil pro en mode démo (avec tous les champs enrichis)
      const nowIso = new Date().toISOString()
      const { error: profileError } = await adminClient.from('profiles').upsert({
        id: userId,
        full_name,
        email,
        role: 'pro',
        telephone: telephone || null,
        pro_profile_type: pro_profile_type || 'autre',
        pro_company_name: pro_company_name || null,
        pro_network: pro_network || null,
        pro_siret: pro_siret || null,
        pro_company_address: pro_company_address || null,
        pro_postal_code: pro_postal_code || null,
        pro_ville: pro_ville || null,
        pro_notes_admin: pro_notes_admin || null,
        pro_recommended_plan: pro_recommended_plan || null,
        pro_status: 'demo',
        pro_demo_started_at: nowIso,
        pro_created_at: nowIso,
        pro_created_by: user.email,
        pro_onboarding_done: false,
      }, { onConflict: 'id' })
      if (profileError) {
        // Rollback : supprimer le user auth si le profil a échoué
        await adminClient.auth.admin.deleteUser(userId)
        return new Response(JSON.stringify({ error: profileError.message }), { status: 400, headers: corsHeaders })
      }

      // 2bis. Insertion des crédits offerts dans credit_grants (1 simple + 1 complète)
      const { error: grantsError } = await adminClient.from('credit_grants').insert([
        {
          user_id: userId,
          granted_by: user.id,
          credit_type: 'document',
          quantity: 1,
          reason: 'Crédit offert — invitation démo',
        },
        {
          user_id: userId,
          granted_by: user.id,
          credit_type: 'complete',
          quantity: 1,
          reason: 'Crédit offert — invitation démo',
        },
      ])
      if (grantsError) {
        console.error('[create_pro_demo] Erreur création credit_grants:', grantsError)
        // Rollback profil + user auth
        await adminClient.from('profiles').delete().eq('id', userId)
        await adminClient.auth.admin.deleteUser(userId)
        return new Response(JSON.stringify({ error: 'Erreur attribution crédits: ' + grantsError.message }), { status: 400, headers: corsHeaders })
      }

      // 3. Création du token d'invitation
      const inviteToken = generateToken()
      const { error: inviteError } = await adminClient.from('pro_invitations').insert({
        profile_id: userId,
        email,
        token: inviteToken,
      })
      if (inviteError) console.error('[create_pro_demo] Erreur création invitation:', inviteError)

      // 4. Validation de la pièce jointe (max 12 Mo en base64 pour rester < 15 Mo Mailjet)
      let attachmentsPayload: Array<{ Filename: string; ContentType: string; Base64Content: string }> | undefined
      if (attachment && attachment.base64Content) {
        const sizeBytes = Math.floor(attachment.base64Content.length * 0.75)
        if (sizeBytes > 12 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: 'Pièce jointe trop volumineuse (max 12 Mo).' }), { status: 400, headers: corsHeaders })
        }
        attachmentsPayload = [{
          Filename: attachment.filename || 'plaquette-verimo.pdf',
          ContentType: attachment.contentType || 'application/pdf',
          Base64Content: attachment.base64Content,
        }]
      }

      // 5. Envoi du mail
      const prenom = full_name.split(' ')[0]
      const html = buildDemoInvitationEmail(prenom, inviteToken, custom_message || null, !!attachmentsPayload)
      const mailResult = await sendMailjet(
        email,
        'Verimo Pro — Votre accès découverte',
        html,
        attachmentsPayload
      )

      if (!mailResult.success) {
        return new Response(JSON.stringify({
          error: 'Compte créé mais envoi mail échoué : ' + mailResult.error,
          user_id: userId,
          invite_token: inviteToken,
        }), { status: 500, headers: corsHeaders })
      }

      // 6. Marquer l'invitation comme envoyée
      await adminClient.from('pro_invitations').update({
        sent_at: nowIso
      }).eq('token', inviteToken)

      // ════════════════════════════════════════════════════════════════
      // 🏛 SI compte démo type agence → créer l'entité agences + responsable
      // ════════════════════════════════════════════════════════════════
      if (pro_profile_type === 'agence') {
        try {
          const raisonSociale = pro_company_name || full_name || 'Agence sans nom'
          const { data: newAgence, error: agenceErr } = await adminClient
            .from('agences')
            .insert({
              raison_sociale: raisonSociale,
              siret: pro_siret || null,
              adresse: pro_company_address || null,
              email_contact: email,
              telephone: telephone || null,
              plan: 'agence_3',
              nb_users_max: 1, // 1 user max tant que pas d'abonnement actif
              status: 'active',
              credits_complete: 0,
              credits_document: 0,
              activated_by_admin: user.id,
              admin_notes: pro_notes_admin || null,
            })
            .select('id')
            .single()

          if (agenceErr || !newAgence) {
            console.error('[create_pro_demo/agence] Erreur création agence:', agenceErr)
          } else {
            const { error: memberErr } = await adminClient
              .from('agence_members')
              .insert({
                agence_id: newAgence.id,
                user_id: userId,
                role: 'responsable',
              })
            if (memberErr) {
              console.error('[create_pro_demo/agence] Erreur rattachement responsable:', memberErr)
            } else {
              console.log(`[create_pro_demo/agence] Agence ${newAgence.id} créée + ${email} rattaché responsable (mode démo)`)
            }
          }
        } catch (e) {
          console.error('[create_pro_demo/agence] Exception non-critique:', e)
        }
      }

      return new Response(JSON.stringify({
        success: true,
        user_id: userId,
        sent_to: email,
        attachment_sent: !!attachmentsPayload,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    /* ── DEMO : Activer un compte pro en démo (sortie de démo) ─ */
    if (action === 'activate_pro_demo') {
      const { profile_id, credits_document_add, credits_complete_add } = body

      if (!profile_id) {
        return new Response(JSON.stringify({ error: 'profile_id requis.' }), { status: 400, headers: corsHeaders })
      }

      // Vérifier que le profil existe
      const { data: currentProfile, error: fetchError } = await adminClient.from('profiles')
        .select('id, pro_status')
        .eq('id', profile_id).single()
      if (fetchError || !currentProfile) {
        return new Response(JSON.stringify({ error: 'Profil introuvable.' }), { status: 404, headers: corsHeaders })
      }

      const addDoc = parseInt(credits_document_add) || 0
      const addComplete = parseInt(credits_complete_add) || 0

      // Insérer les crédits supplémentaires dans credit_grants
      const grantsToInsert: Array<Record<string, unknown>> = []
      if (addDoc > 0) {
        grantsToInsert.push({
          user_id: profile_id,
          granted_by: user.id,
          credit_type: 'document',
          quantity: addDoc,
          reason: 'Crédit offert — activation compte (sortie démo)',
        })
      }
      if (addComplete > 0) {
        grantsToInsert.push({
          user_id: profile_id,
          granted_by: user.id,
          credit_type: 'complete',
          quantity: addComplete,
          reason: 'Crédit offert — activation compte (sortie démo)',
        })
      }
      if (grantsToInsert.length > 0) {
        const { error: grantsError } = await adminClient.from('credit_grants').insert(grantsToInsert)
        if (grantsError) {
          return new Response(JSON.stringify({ error: 'Erreur ajout crédits: ' + grantsError.message }), { status: 400, headers: corsHeaders })
        }
      }

      // Mettre à jour le statut du profil
      const { error: updateError } = await adminClient.from('profiles').update({
        pro_status: 'active',
        pro_demo_converted_at: new Date().toISOString(),
      }).eq('id', profile_id)
      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), { status: 400, headers: corsHeaders })
      }

      return new Response(JSON.stringify({
        success: true,
        credits_added: { document: addDoc, complete: addComplete }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Action inconnue' }), { status: 400, headers: corsHeaders })

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: corsHeaders })
  }
})
