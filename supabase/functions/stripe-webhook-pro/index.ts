// ══════════════════════════════════════════════════════════════════════
// VERIMO — Edge Function : stripe-webhook-pro V7
//
// Gère les événements Stripe pour les ABONNEMENTS PRO uniquement
// (Découverte, Starter, Power) + les achats unitaires pro.
//
// V7 (11 mai 2026) :
//   - Email de confirmation de résiliation envoyé au client quand
//     cancel_at_period_end passe de false à true (peu importe qui
//     a déclenché : client depuis dashboard OU admin depuis Stripe)
//   - Date de fin d'accès affichée dans le mail
//
// V6 (10 mai 2026) :
//   - Handler charge.refunded ajouté
//   - Sync automatique des remboursements Stripe → table payments
//   - Match via stripe_payment_id (= payment_intent_id)
//   - Ne touche PAS aux crédits / abos (décision produit)
//   - recordProPayment remplit désormais customer_type='pro' + amount_ht
//
// V5 (10 mai 2026) :
//   - Helper safeDate() : protection contre les timestamps Stripe null/undefined
//     qui faisaient planter handleSubscriptionUpdated avec "Invalid time value"
//     (typiquement sur customer.subscription.updated lié à un schedule)
//   - Filtre paiements particuliers : si metadata.userId (U majuscule) présent,
//     on skip silencieusement — plus d'alerte critique inutile sur la page admin
//
// V4 :
//   - Idempotence via la table processed_stripe_events
//     → empêche le double-traitement d'un même event Stripe (retry, doublon)
//
// V3 :
//   - Gestion d'erreur après chaque appel Supabase critique
//   - Insertion alertes dans system_alerts (page admin)
//   - Logs structurés
//
// Vocabulaire base de données :
// - 'document' = analyse simple (vocabulaire interne BDD)
// - 'complete' = analyse complète
//
// Events gérés :
// - checkout.session.completed       → Activation abo OU crédit unitaire
// - invoice.payment_succeeded        → Cumul crédits + plafond au début nouveau cycle
// - invoice.payment_failed           → Notification paiement échoué
// - customer.subscription.updated    → Upgrade/downgrade entre plans
// - customer.subscription.deleted    → Désactivation propre de l'abo
// - charge.refunded                  → Sync remboursement vers table payments
//
// Variables d'environnement requises :
// - STRIPE_SECRET_KEY
// - STRIPE_WEBHOOK_SECRET_PRO
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// ══════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

type SupabaseClient = ReturnType<typeof createClient>;

// ─────────────────────────────────────────────────────────────────────
// Configuration : Mapping Price ID Stripe → plan / type (PRODUCTION)
// ─────────────────────────────────────────────────────────────────────

// Type unifié pour les plans pro
type ProPlan = 'decouverte' | 'starter' | 'power' | 'agence';

// 🏛 NOUVEAU plan agence — price_id lu depuis variable d'environnement
const STRIPE_PRICE_AGENCE = Deno.env.get('STRIPE_PRICE_AGENCE') ?? '';

const PRICE_TO_PLAN: Record<string, ProPlan> = {
  'price_1TTtd1BesXB76oWEZuILxjwe': 'decouverte',
  'price_1TTtczBesXB76oWEcKaNR2BW': 'starter',
  'price_1TTtcxBesXB76oWEPyVYZjCj': 'power',
};
// Ajout dynamique du plan agence si la variable est définie (évite crash au boot)
if (STRIPE_PRICE_AGENCE) {
  PRICE_TO_PLAN[STRIPE_PRICE_AGENCE] = 'agence';
}

const PRICE_TO_UNIT: Record<string, { type: 'complete' | 'document'; amount_ht: number }> = {
  'price_1TTtcyBesXB76oWEBF1TLHYz': { type: 'complete', amount_ht: 990 },
  'price_1TTtd2BesXB76oWEVM0p27GS': { type: 'document', amount_ht: 290 },
};

const PLAN_QUOTAS: Record<ProPlan, { complete: number; simple: number }> = {
  decouverte: { complete: 1, simple: 3 },
  starter: { complete: 5, simple: 15 },
  power: { complete: 10, simple: 30 },
  agence: { complete: 15, simple: 30 }, // 🏛 Plan agence : 15 complètes + 30 simples / mois
};

// ─────────────────────────────────────────────────────────────────────
// Init Stripe + Supabase clients
// ─────────────────────────────────────────────────────────────────────

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET_PRO') ?? '';

// ─────────────────────────────────────────────────────────────────────
// MAILJET — envoi d'email transactionnel (expéditeur pro@verimo.fr)
// ─────────────────────────────────────────────────────────────────────
async function sendMailjet(to: string, subject: string, htmlBody: string) {
  const MJ_API_KEY = Deno.env.get('MJ_API_KEY') ?? '';
  const MJ_SECRET_KEY = Deno.env.get('MJ_SECRET_KEY') ?? '';

  if (!MJ_API_KEY || !MJ_SECRET_KEY) {
    console.error('[mailjet] Keys not configured, skip');
    return { success: false, error: 'Mailjet non configuré' };
  }

  try {
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
        }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[mailjet] Send failed:', JSON.stringify(data));
      return { success: false, error: JSON.stringify(data) };
    }
    return { success: true };
  } catch (e) {
    console.error('[mailjet] Exception:', e);
    return { success: false, error: String(e) };
  }
}

// ─────────────────────────────────────────────────────────────────────
// TEMPLATE MAIL — Confirmation de résiliation programmée
// ─────────────────────────────────────────────────────────────────────
function buildCancellationEmail(prenom: string, planLabel: string, endDateFr: string) {
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
          <h2 style="color:#0f2d3d;font-size:22px;font-weight:800;margin:0 0 16px;text-align:center;">✅ Résiliation prise en compte</h2>
          <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 20px;text-align:center;">
            Bonjour ${prenom},<br>
            Nous avons bien pris en compte votre demande de résiliation de l'abonnement <strong>Verimo Pro ${planLabel}</strong>.
          </p>
        </td></tr>

        <tr><td style="padding:0 28px 24px;">
          <div style="background:linear-gradient(135deg,#f0f7fb,#e8f4f8);border-radius:12px;padding:18px 22px;border:1px solid #d0e8f0;text-align:center;">
            <p style="color:#2a7d9c;font-size:13px;font-weight:600;margin:0 0 6px;letter-spacing:0.05em;">📅 VOTRE ACCÈS RESTE ACTIF</p>
            <p style="color:#0f2d3d;font-size:17px;font-weight:800;margin:0;">jusqu'au ${endDateFr}</p>
          </div>
        </td></tr>

        <tr><td style="padding:0 28px 24px;">
          <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;text-align:center;">
            Vous pouvez continuer à utiliser vos crédits et générer des analyses jusqu'à cette date.<br>
            Aucun nouveau prélèvement ne sera effectué.
          </p>
        </td></tr>

        <tr><td style="padding:0 28px 24px;">
          <div style="background:#fffbeb;border-radius:10px;padding:14px 18px;border:1px solid #fde68a;">
            <p style="color:#92400e;font-size:13px;line-height:1.7;margin:0;text-align:center;">
              💡 <strong>Vous changez d'avis ?</strong><br>
              Vous pouvez réactiver votre abonnement à tout moment depuis votre dashboard avant le ${endDateFr}.
            </p>
          </div>
        </td></tr>

        <tr><td style="padding:0 28px 32px;text-align:center;">
          <a href="https://pro.verimo.fr/dashboard/abonnement" style="display:inline-block;background:linear-gradient(135deg,#2a7d9c,#0f2d3d);color:#fff;font-size:16px;font-weight:700;padding:15px 36px;border-radius:14px;text-decoration:none;box-shadow:0 8px 24px rgba(15,45,61,0.2);">
            🔐 Accéder à mon dashboard
          </a>
        </td></tr>

        <tr><td style="background:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #f1f5f9;">
          <p style="color:#94a3b8;font-size:11px;margin:0 0 6px;line-height:1.6;">
            Une question ? Écrivez-nous à <a href="mailto:pro@verimo.fr" style="color:#2a7d9c;text-decoration:none;">pro@verimo.fr</a>
          </p>
          <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.6;">
            <strong style="color:#64748b;">Verimo</strong> — Vos documents décryptés, votre décision éclairée.<br>
            <a href="https://verimo.fr" style="color:#2a7d9c;text-decoration:none;">verimo.fr</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────
// Format date FR (ex: "11 juin 2026")
// ─────────────────────────────────────────────────────────────────────
function formatDateFr(date: Date): string {
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}


// ─────────────────────────────────────────────────────────────────────
// INSERTION D'UNE ALERTE SYSTÈME POUR L'ADMIN
// ─────────────────────────────────────────────────────────────────────
async function insertSystemAlert(
  supabaseAdmin: SupabaseClient,
  params: {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('system_alerts').insert({
      type: params.type,
      severity: params.severity,
      title: params.title,
      message: params.message,
      analyse_id: null,
      user_id: params.userId || null,
      metadata: params.metadata || {},
    });
    if (error) {
      console.error('[stripe-webhook-pro] Erreur insertion alerte:', error.message);
    } else {
      console.log(`[stripe-webhook-pro] 🔔 Alerte système: ${params.type} — ${params.title}`);
    }
  } catch (err) {
    console.error('[stripe-webhook-pro] Erreur insertion alerte:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────
// IDEMPOTENCE — empêche le double-traitement d'un même event Stripe
// (Stripe peut renvoyer le même webhook plusieurs fois en cas de retry)
// ─────────────────────────────────────────────────────────────────────

async function isEventAlreadyProcessed(eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('processed_stripe_events')
    .select('event_id')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) {
    console.error('[idempotence] Erreur lecture processed_stripe_events:', error);
    // En cas d'erreur de lecture, on traite quand même l'event
    // (mieux vaut un doublon potentiel qu'un event ignoré)
    return false;
  }

  return !!data;
}

async function markEventAsProcessed(
  eventId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('processed_stripe_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      webhook_source: 'stripe-webhook-pro',
      metadata: metadata ?? null,
    });

  if (error) {
    // Erreur 23505 = duplicate key violation = race condition (2 webhooks en parallèle)
    // C'est le comportement attendu : on log et on continue
    console.error('[idempotence] Erreur insertion processed_stripe_events:', error);
  }
}

// ─────────────────────────────────────────────────────────────────────
// HELPER : conversion sécurisée timestamp Stripe → ISO string
// (V5 fix : Stripe envoie parfois current_period_start/end à null sur
// certains events transitoires — ex: customer.subscription.updated lié
// à un schedule. new Date(null * 1000).toISOString() plante avec
// "RangeError: Invalid time value". On retourne null si invalide.)
// ─────────────────────────────────────────────────────────────────────
function safeDate(ts: number | null | undefined): string | null {
  if (!ts || typeof ts !== 'number' || !Number.isFinite(ts)) return null;
  const d = new Date(ts * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

// ─────────────────────────────────────────────────────────────────────
// HELPER : récupère les vraies dates current_period_start/end
// Si les timestamps reçus dans l'event sont null/invalides (ce qui arrive
// sur certains events Stripe lors d'upgrades), on va chercher la sub
// fraîche via l'API Stripe qui aura toujours les bonnes dates.
// ─────────────────────────────────────────────────────────────────────
async function getValidPeriods(sub: Stripe.Subscription): Promise<{ start: string | null; end: string | null }> {
  let start = safeDate(sub.current_period_start);
  let end = safeDate(sub.current_period_end);

  // Si l'un des deux est null, on retente via Stripe API
  if (!start || !end) {
    try {
      console.log(`[getValidPeriods] Timestamps null sur sub ${sub.id}, fetch fresh from Stripe`);
      const fresh = await stripe.subscriptions.retrieve(sub.id);
      start = start || safeDate(fresh.current_period_start);
      end = end || safeDate(fresh.current_period_end);

      // Si toujours null, on essaie de lire depuis items.data[0] (parfois Stripe les y met)
      if (!start || !end) {
        const item = fresh.items.data[0] as any;
        if (item) {
          start = start || safeDate(item.current_period_start);
          end = end || safeDate(item.current_period_end);
        }
      }
    } catch (e) {
      console.warn('[getValidPeriods] Stripe fetch failed:', e);
    }
  }

  return { start, end };
}

// ─────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook-pro] Signature error:', err);
    await insertSystemAlert(supabase, {
      type: 'unexpected_error',
      severity: 'critical',
      title: 'Webhook Stripe Pro — signature invalide',
      message: 'Une requête Stripe Pro a été reçue avec une signature invalide.',
      metadata: { stage: 'signature', error: String(err) },
    });
    return new Response(`Webhook signature error: ${(err as Error).message}`, { status: 400 });
  }

  console.log(`[stripe-webhook-pro] Event received: ${event.type} (id=${event.id})`);

  // ─────────────────────────────────────────────────────────────────────
  // IDEMPOTENCE : vérifier si l'event a déjà été traité
  // ─────────────────────────────────────────────────────────────────────
  if (await isEventAlreadyProcessed(event.id)) {
    console.log(`[stripe-webhook-pro] Event ${event.id} déjà traité, skip (idempotence)`);
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.payment_succeeded':
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[stripe-webhook-pro] Event ignored: ${event.type}`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Event traité avec succès → on le marque pour éviter doublons futurs
    // ─────────────────────────────────────────────────────────────────────
    await markEventAsProcessed(event.id, event.type);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(`[stripe-webhook-pro] Handler error for ${event.type}:`, err);

    // ─── Tentative d'extraction du user_id et des infos client à partir de l'événement ───
    let extractedUserId: string | undefined;
    let userInfo: string | null = null;
    try {
      const obj = event.data.object as Record<string, unknown>;
      // Selon le type d'event, le customer Stripe est à des endroits différents
      const customerRef = (obj.customer as string | { id: string } | undefined)
        || ((obj as { subscription?: { customer?: string } }).subscription as string | { customer?: string } | undefined);
      const customerId = typeof customerRef === 'string' ? customerRef : customerRef?.id;

      if (customerId) {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted) {
          extractedUserId = (customer as Stripe.Customer).metadata?.user_id;
          const email = (customer as Stripe.Customer).email;
          const name = (customer as Stripe.Customer).name;
          userInfo = [name, email].filter(Boolean).join(' · ') || customerId;
        }
      }
    } catch (extractErr) {
      console.warn('[stripe-webhook-pro] Impossible d\'extraire user_id de l\'event:', extractErr);
    }

    await insertSystemAlert(supabase, {
      type: 'unexpected_error',
      severity: 'critical',
      title: `Webhook Stripe Pro — erreur ${event.type}`,
      message: userInfo
        ? `Une erreur inattendue est survenue dans le traitement de l'event ${event.type}. Client concerné : ${userInfo}.`
        : `Une erreur inattendue est survenue dans le traitement de l'event ${event.type}.`,
      userId: extractedUserId,
      metadata: { stage: 'handler', eventType: event.type, eventId: event.id, error: (err as Error).message, customerInfo: userInfo },
    });
    // En cas d'erreur, on NE marque PAS l'event comme traité
    // → Stripe va retry, et au prochain essai si ça réussit, on le marquera
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ═════════════════════════════════════════════════════════════════════
// HANDLERS
// ═════════════════════════════════════════════════════════════════════

// 🆕 Si le compte est en démo, le passer en actif après paiement réussi.
// Action ciblée : touche UNIQUEMENT si pro_status = 'demo'. Aucun effet sur les autres comptes.
async function convertDemoToActiveIfNeeded(userId: string): Promise<void> {
  try {
    const { data: prof, error: fetchErr } = await supabase
      .from('profiles')
      .select('pro_status')
      .eq('id', userId)
      .single();

    if (fetchErr) {
      console.warn('[stripe-webhook-pro] convertDemoToActive: fetch error (non bloquant):', fetchErr.message);
      return;
    }

    if (prof?.pro_status !== 'demo') {
      // Compte pas en démo, on ne touche à rien
      return;
    }

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        pro_status: 'active',
        pro_demo_converted_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) {
      console.warn('[stripe-webhook-pro] convertDemoToActive: update error (non bloquant):', updateErr.message);
      return;
    }

    console.log(`[stripe-webhook-pro] ✅ Compte démo converti en actif : ${userId}`);
  } catch (err) {
    console.warn('[stripe-webhook-pro] convertDemoToActive: exception (non bloquant):', err);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // ─────────────────────────────────────────────────────────────────
  // FILTRE V5 : si la session est destinée au webhook particulier
  // (metadata.userId avec U majuscule = paiement particulier),
  // on skip silencieusement — pas d'alerte critique inutile.
  // Le webhook particulier (stripe-webhook) va gérer ce paiement.
  // ─────────────────────────────────────────────────────────────────
  if (session.metadata?.userId && !session.metadata?.user_id) {
    console.log(`[checkout.completed] Session ${session.id} = paiement particulier (metadata.userId présent), skip côté pro`);
    return;
  }

  const userId = session.metadata?.user_id;
  if (!userId) {
    console.warn('[checkout.completed] Missing user_id in metadata, skip');

    // Tente de récupérer email/nom du customer Stripe pour enrichir l'alerte
    let customerInfo: string | null = null;
    try {
      const custRef = session.customer;
      const custId = typeof custRef === 'string' ? custRef : custRef?.id;
      if (custId) {
        const customer = await stripe.customers.retrieve(custId);
        if (customer && !customer.deleted) {
          const email = (customer as Stripe.Customer).email;
          const name = (customer as Stripe.Customer).name;
          customerInfo = [name, email].filter(Boolean).join(' · ') || custId;
        }
      }
      // Fallback sur les coordonnées du checkout si dispo
      if (!customerInfo) {
        const email = session.customer_details?.email;
        const name = session.customer_details?.name;
        customerInfo = [name, email].filter(Boolean).join(' · ') || null;
      }
    } catch (extractErr) {
      console.warn('[checkout.completed] Impossible d\'extraire infos customer:', extractErr);
    }

    await insertSystemAlert(supabase, {
      type: 'unexpected_error',
      severity: 'critical',
      title: 'Paiement Pro reçu sans user_id',
      message: customerInfo
        ? `Un paiement Pro Stripe a été reçu mais ne contient pas de user_id dans les metadata. Client : ${customerInfo}. Le crédit n'a pas été attribué.`
        : 'Un paiement Pro Stripe a été reçu mais ne contient pas de user_id dans les metadata. Le crédit n\'a pas été attribué.',
      metadata: { stage: 'no_user_id', sessionId: session.id, mode: session.mode, customerInfo },
    });
    return;
  }

  if (session.mode === 'subscription' && session.subscription) {
    const subId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;

    const sub = await stripe.subscriptions.retrieve(subId);
    await upsertProSubscription(userId, sub);

    // 🆕 Si le compte était en démo, on le bascule en actif (les bandeaux démo disparaissent)
    await convertDemoToActiveIfNeeded(userId);

    // Ajouter le SIRET en custom_fields sur la subscription pour qu'il apparaisse
    // sur toutes les futures factures PDF (et la 1ère qui vient d'être générée si possible).
    // On le fait ici car Stripe ne permet pas de passer custom_fields dans subscription_data
    // au moment du Checkout.
    await applySiretCustomFieldToSubscription(userId, subId);

    // ⭐ Enregistrer la souscription initiale dans `payments` pour les stats admin
    const planFromPrice = PRICE_TO_PLAN[sub.items.data[0]?.price.id] || 'inconnu';
    const latestInv = sub.latest_invoice;
    let invoiceId: string | undefined;
    let amountPaid = 0;
    if (latestInv) {
      if (typeof latestInv === 'string') {
        const inv = await stripe.invoices.retrieve(latestInv);
        invoiceId = inv.id;
        amountPaid = inv.amount_paid || 0;
      } else {
        invoiceId = latestInv.id;
        amountPaid = latestInv.amount_paid || 0;
      }
    }
    if (amountPaid > 0) {
      await recordProPayment({
        userId,
        amountTtcCents: amountPaid,
        description: `Abonnement ${planLabel(planFromPrice)} (souscription)`,
        stripeInvoiceId: invoiceId,
        stripeSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      });
    }

    console.log(`[checkout.completed] Subscription created for user ${userId}`);
    return;
  }

  if (session.mode === 'payment') {
    await handleUnitPurchase(userId, session);

    // 🆕 Si le compte était en démo, le passer en actif après tout paiement (abo OU unitaire)
    await convertDemoToActiveIfNeeded(userId);

    // Pour les achats unitaires, ajouter le SIRET sur la facture générée
    if (session.invoice) {
      const invId = typeof session.invoice === 'string' ? session.invoice : session.invoice.id;
      await applySiretCustomFieldToInvoice(userId, invId);
    }

    // ⭐ Enregistrer l'achat unitaire dans `payments` pour les stats admin
    // Le montant TTC est dans session.amount_total (ou amount_subtotal en HT, mais TTC = total)
    const amountTtc = session.amount_total || 0;
    if (amountTtc > 0) {
      // Récupérer le détail des line items pour le label
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      const labels: string[] = [];
      for (const item of lineItems.data) {
        const priceId = item.price?.id;
        const unit = priceId ? PRICE_TO_UNIT[priceId] : null;
        if (unit) {
          const qty = item.quantity ?? 1;
          const unitLabel = unit.type === 'complete' ? 'analyse complète d\'un bien' : 'analyse simple d\'un document';
          labels.push(qty > 1 ? `${qty} × ${unitLabel}s` : unitLabel);
        }
      }
      const description = labels.length > 0
        ? `Achat unitaire — ${labels.join(', ')}`
        : 'Achat unitaire';
      const invId = session.invoice ? (typeof session.invoice === 'string' ? session.invoice : session.invoice.id) : null;
      await recordProPayment({
        userId,
        amountTtcCents: amountTtc,
        description,
        stripeInvoiceId: invId,
        stripeSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id,
      });
    }

    console.log(`[checkout.completed] Unit purchase recorded for user ${userId}`);
    return;
  }

  console.warn(`[checkout.completed] Unhandled mode: ${session.mode}`);
}

// Helper : récupère le SIRET du pro depuis profiles
async function getProSiret(userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('pro_siret')
    .eq('id', userId)
    .maybeSingle();
  if (!profile?.pro_siret) return null;
  const cleanSiret = (profile.pro_siret as string).replace(/\s/g, '');
  return cleanSiret || null;
}

// Helper : applique le SIRET en custom_fields sur une subscription Stripe
// (apparaîtra en haut des PDF des factures de cette subscription, présentes et futures)
async function applySiretCustomFieldToSubscription(userId: string, subscriptionId: string) {
  try {
    const siret = await getProSiret(userId);
    if (!siret) return;
    await stripe.subscriptions.update(subscriptionId, {
      invoice_settings: {
        custom_fields: [{ name: 'SIRET', value: siret }],
      },
    });
    console.log(`[siret] Applied to subscription ${subscriptionId}`);
  } catch (err) {
    console.warn(`[siret] Failed to apply on subscription ${subscriptionId} (non-critique):`, err);
  }
}

// Helper : applique le SIRET en custom_fields sur une facture Stripe (achat unitaire)
async function applySiretCustomFieldToInvoice(userId: string, invoiceId: string) {
  try {
    const siret = await getProSiret(userId);
    if (!siret) return;
    // Une facture finalisée ne peut plus être modifiée. On vérifie le status d'abord.
    const invoice = await stripe.invoices.retrieve(invoiceId);
    if (invoice.status === 'draft' || invoice.status === 'open') {
      await stripe.invoices.update(invoiceId, {
        custom_fields: [{ name: 'SIRET', value: siret }],
      });
      console.log(`[siret] Applied to invoice ${invoiceId}`);
    } else {
      console.log(`[siret] Invoice ${invoiceId} already finalized (status ${invoice.status}), skip`);
    }
  } catch (err) {
    console.warn(`[siret] Failed to apply on invoice ${invoiceId} (non-critique):`, err);
  }
}

// ─────────────────────────────────────────────────────────────────────
// Helper : enregistre un paiement pro dans la table `payments`
// (alimente les statistiques admin — CA pro, tableau de bord, analyse CA)
// Idempotent : si un paiement avec le même stripe_invoice_id ou
// stripe_session_id existe déjà, on skip pour éviter les doublons.
// ─────────────────────────────────────────────────────────────────────
async function recordProPayment(params: {
  userId: string;
  amountTtcCents: number;
  description: string;
  stripeInvoiceId?: string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
}) {
  if (!params.userId) {
    console.warn('[recordProPayment] No userId, skip');
    return;
  }
  if (!params.amountTtcCents || params.amountTtcCents <= 0) {
    console.warn('[recordProPayment] amount is 0 or negative, skip');
    return;
  }

  // Anti-doublon : vérifier si on a déjà inséré ce paiement
  if (params.stripeInvoiceId) {
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_invoice_id', params.stripeInvoiceId)
      .maybeSingle();
    if (existing) {
      console.log(`[recordProPayment] Invoice ${params.stripeInvoiceId} déjà enregistrée, skip`);
      return;
    }
  } else if (params.stripeSessionId) {
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('stripe_session_id', params.stripeSessionId)
      .maybeSingle();
    if (existing) {
      console.log(`[recordProPayment] Session ${params.stripeSessionId} déjà enregistrée, skip`);
      return;
    }
  }

  const amountEur = params.amountTtcCents / 100;
  // TVA 20% côté pro → HT = TTC / 1.20 (arrondi 2 décimales)
  const amountHt = Math.round((amountEur / 1.20) * 100) / 100;

  // Récupérer email/nom du user pour les stocker dans payments (historique RGPD/comptable)
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', params.userId)
    .maybeSingle();

  const { error } = await supabase.from('payments').insert({
    user_id: params.userId,
    amount: amountEur,
    amount_ht: amountHt,
    customer_type: 'pro',
    customer_email: profile?.email || null,
    customer_name: profile?.full_name || null,
    currency: 'eur',
    description: params.description,
    stripe_session_id: params.stripeSessionId || null,
    stripe_payment_id: params.stripePaymentIntentId || null,
    stripe_invoice_id: params.stripeInvoiceId || null,
    status: 'completed',
  });

  if (error) {
    console.error('[recordProPayment] Insert failed:', error.message);
    await insertSystemAlert(supabase, {
      type: 'save_error',
      severity: 'critical',
      title: 'Enregistrement paiement Pro échoué',
      message: `Un paiement Pro de ${amountEur.toFixed(2)}€ TTC a été reçu mais l'enregistrement dans la table payments a échoué (impacte les statistiques admin).`,
      userId: params.userId,
      metadata: { stage: 'pro_payment_insert', error: error.message, ...params },
    });
  } else {
    console.log(`[recordProPayment] Paiement Pro enregistré: ${amountEur.toFixed(2)}€ TTC pour user ${params.userId}`);
  }
}

// Helper : génère un label lisible pour la description du paiement
function planLabel(plan: string): string {
  if (plan === 'decouverte') return 'Découverte';
  if (plan === 'starter') return 'Starter';
  if (plan === 'power') return 'Power';
  if (plan === 'agence') return 'Agence';
  return plan;
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) {
    console.log('[invoice.paid] No subscription, skip');
    return;
  }

  const subId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription.id;

  // ⭐ Helper : enregistre le paiement dans `payments` à partir de l'invoice
  // Récupère le user_id via le customer Stripe
  const recordFromInvoice = async (description: string, fallbackUserId?: string | null) => {
    if ((invoice.amount_paid || 0) <= 0) return;
    let userId = fallbackUserId || null;
    if (!userId) {
      // Récupérer user_id depuis le customer Stripe
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !customer.deleted) {
            userId = (customer as Stripe.Customer).metadata?.user_id || null;
          }
        } catch (e) {
          console.warn('[invoice.paid] Impossible de récupérer le customer:', e);
        }
      }
    }
    if (!userId) {
      console.warn('[invoice.paid] Pas de user_id trouvé, skip recordProPayment');
      return;
    }
    await recordProPayment({
      userId,
      amountTtcCents: invoice.amount_paid || 0,
      description,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id,
    });
  };

  if (invoice.billing_reason === 'subscription_create') {
    // Première invoice (souscription initiale) — checkout.session.completed s'en charge en principe
    // Mais on enregistre ici aussi par sécurité (l'anti-doublon par stripe_invoice_id empêche le double insert)
    console.log('[invoice.paid] First invoice (subscription_create) — enregistrement de sécurité');
    const stripePriceId = (invoice.lines?.data?.[0] as any)?.price?.id;
    const planFromPrice = stripePriceId ? PRICE_TO_PLAN[stripePriceId] : null;
    await recordFromInvoice(`Abonnement ${planFromPrice ? planLabel(planFromPrice) : 'Pro'} (souscription)`);
    return;
  }

  const sub = await stripe.subscriptions.retrieve(subId);

  const { data: existing, error } = await supabase
    .from('pro_subscriptions')
    .select('id, plan, user_id')
    .eq('stripe_subscription_id', subId)
    .maybeSingle();

  if (error || !existing) {
    console.error(`[invoice.paid] Subscription ${subId} not found in DB — enregistrement payment quand même`);
    // ⭐ Le paiement a quand même eu lieu côté Stripe → on l'enregistre
    const stripePriceId = sub.items.data[0]?.price.id;
    const planFromPrice = stripePriceId ? PRICE_TO_PLAN[stripePriceId] : null;
    await recordFromInvoice(`Abonnement ${planFromPrice ? planLabel(planFromPrice) : 'Pro'} (paiement orphelin)`);
    await insertSystemAlert(supabase, {
      type: 'save_error',
      severity: 'warning',
      title: 'Renouvellement Pro — abonnement introuvable',
      message: 'Un renouvellement de paiement Pro est arrivé mais l\'abonnement correspondant est introuvable en base. Le paiement a été enregistré dans `payments` mais les crédits ne peuvent pas être attribués.',
      metadata: { stage: 'invoice_paid_lookup', subscriptionId: subId, error: error?.message },
    });
    return;
  }

  // ⭐ Détection upgrade en attente : si la subscription Stripe a un plan
  // différent de celui en BDD, c'est qu'on avait skippé le changement
  // dans subscription.updated (paiement pas encore confirmé). Maintenant
  // que la facture est payée, on applique le changement.
  const stripePriceId = sub.items.data[0]?.price.id;
  const stripePlan = PRICE_TO_PLAN[stripePriceId];

  if (stripePlan && stripePlan !== existing.plan) {
    console.log(`[invoice.paid] Upgrade en attente détecté : ${existing.plan} → ${stripePlan}, application maintenant`);
    const { error: upErr } = await supabase.rpc('upgrade_pro_subscription_credits', {
      p_subscription_id: existing.id,
      p_new_plan: stripePlan,
    });

    if (upErr) {
      console.error('[invoice.paid] Upgrade credits failed:', upErr);
      await insertSystemAlert(supabase, {
        type: 'save_error',
        severity: 'critical',
        title: 'Upgrade Pro post-paiement — échec cumul crédits',
        message: `Le paiement de l'upgrade ${existing.plan} → ${stripePlan} a réussi mais le cumul de crédits a échoué.`,
        userId: existing.user_id,
        metadata: { stage: 'invoice_paid_upgrade_credits', subscriptionId: subId, oldPlan: existing.plan, newPlan: stripePlan, error: upErr.message },
      });
      return;
    }

    // Met à jour le price_id et les dates de cycle (on ne met PAS le plan ici, c'est fait dans la RPC upgrade_pro_subscription_credits)
    const periods = await getValidPeriods(sub);
    const { error: updErr } = await supabase
      .from('pro_subscriptions')
      .update({
        stripe_price_id: stripePriceId,
        current_period_start: periods.start,
        current_period_end: periods.end,
        status: sub.status === 'active' ? 'active' : sub.status,
        // Si un downgrade était programmé, l'upgrade le supprime (l'upgrade prime)
        scheduled_plan_change: null,
        scheduled_change_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updErr) {
      console.error('[invoice.paid] Update sub after upgrade failed:', updErr);
    }

    // ⭐ Enregistrer le paiement upgrade dans `payments` pour les stats admin
    await recordProPayment({
      userId: existing.user_id,
      amountTtcCents: invoice.amount_paid || 0,
      description: `Abonnement ${planLabel(stripePlan)} (upgrade depuis ${planLabel(existing.plan)})`,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id,
    });

    console.log(`[invoice.paid] Upgrade ${existing.plan} → ${stripePlan} appliqué après paiement confirmé`);
    return;
  }

  // ─── Sinon : simple renouvellement mensuel du même plan ───
  // Cumul des crédits + plafond 2× appliqué dans la fonction SQL
  const { error: rpcErr } = await supabase.rpc('reset_pro_subscription_credits', {
    p_subscription_id: existing.id,
  });

  if (rpcErr) {
    console.error('[invoice.paid] Reset credits failed:', rpcErr);
    await insertSystemAlert(supabase, {
      type: 'save_error',
      severity: 'critical',
      title: 'Renouvellement Pro — échec cumul crédits',
      message: 'Le renouvellement Pro a été facturé mais le cumul des crédits du nouveau cycle a échoué.',
      userId: existing.user_id,
      metadata: { stage: 'reset_credits', subscriptionId: subId, error: rpcErr.message },
    });
    return;
  }

  const periodsRenew = await getValidPeriods(sub);
  const { error: updateError } = await supabase
    .from('pro_subscriptions')
    .update({
      current_period_start: periodsRenew.start,
      current_period_end: periodsRenew.end,
      status: sub.status === 'active' ? 'active' : sub.status,
      // Au renouvellement, on nettoie un éventuel scheduled_plan_change qui aurait été release
      scheduled_plan_change: null,
      scheduled_change_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (updateError) {
    console.error('[invoice.paid] Update period failed:', updateError);
  }

  // ⭐ Enregistrer le renouvellement dans `payments` pour les stats admin
  await recordProPayment({
    userId: existing.user_id,
    amountTtcCents: invoice.amount_paid || 0,
    description: `Abonnement ${planLabel(existing.plan)} (renouvellement)`,
    stripeInvoiceId: invoice.id,
    stripePaymentIntentId: typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id,
  });

  console.log(`[invoice.paid] Crédits cumulés (plafond 2×) pour sub ${existing.id} (plan ${existing.plan})`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) {
    console.log('[invoice.payment_failed] No subscription, skip');
    return;
  }

  const subId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription.id;

  const { data: existing } = await supabase
    .from('pro_subscriptions')
    .select('user_id, plan')
    .eq('stripe_subscription_id', subId)
    .maybeSingle();

  if (!existing?.user_id) {
    console.warn(`[invoice.payment_failed] No user found for subscription ${subId}`);
    return;
  }

  // Anti-spam : n'envoie la notif cloche QUE lors de la 1ère tentative ratée
  // (attempt_count = 1 chez Stripe). Les retries suivants déclenchent aussi cet event,
  // mais on ne re-notifie pas le pro pour éviter le spam.
  // Une notif finale sera envoyée par handleSubscriptionDeleted si tous les retries échouent.
  const isFirstAttempt = invoice.attempt_count === 1;

  if (isFirstAttempt) {
    const { error: notifError } = await supabase.from('user_notifications').insert({
      user_id: existing.user_id,
      title: '⚠️ Échec de paiement',
      message: 'Le renouvellement de votre abonnement a échoué. Votre accès reste actif pour quelques jours. Mettez à jour votre moyen de paiement pour éviter la suspension de votre abonnement.',
      read: false,
    });

    if (notifError) {
      console.error('[invoice.payment_failed] Notif insert error:', notifError);
    } else {
      console.log(`[invoice.payment_failed] Initial notification sent to user ${existing.user_id}`);
    }
  } else {
    console.log(`[invoice.payment_failed] Retry attempt ${invoice.attempt_count} for user ${existing.user_id} — no notif (anti-spam)`);
  }

  // Alerte admin créée à CHAQUE échec (utile pour suivi côté admin)
  await insertSystemAlert(supabase, {
    type: 'unexpected_error',
    severity: 'warning',
    title: `Paiement Pro échoué (tentative ${invoice.attempt_count || 1})`,
    message: `Le renouvellement d'un abonnement Pro a échoué (plan ${existing.plan}, tentative ${invoice.attempt_count || 1}). ${isFirstAttempt ? 'Le client a été notifié.' : 'Pas de re-notification client (anti-spam).'}`,
    userId: existing.user_id,
    metadata: { stage: 'invoice_payment_failed', subscriptionId: subId, plan: existing.plan, attemptCount: invoice.attempt_count },
  });
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const newPriceId = sub.items.data[0]?.price.id;
  const newPlan = PRICE_TO_PLAN[newPriceId];

  if (!newPlan) {
    console.warn(`[sub.updated] Unknown price ${newPriceId}, skip`);
    await insertSystemAlert(supabase, {
      type: 'unexpected_error',
      severity: 'warning',
      title: 'Abonnement Pro — price ID inconnu',
      message: `Une mise à jour d'abonnement Pro contient un price ID non mappé (${newPriceId}).`,
      metadata: { stage: 'sub_updated', subscriptionId: sub.id, priceId: newPriceId },
    });
    return;
  }

  const { data: existing, error } = await supabase
    .from('pro_subscriptions')
    .select('id, plan, user_id, cancel_at_period_end')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();

  if (error || !existing) {
    console.warn(`[sub.updated] Subscription ${sub.id} not found, will create`);
    const customer = await stripe.customers.retrieve(sub.customer as string);
    const userId = (customer as Stripe.Customer).metadata?.user_id;
    if (!userId) {
      console.error('[sub.updated] Missing user_id in customer metadata');
      await insertSystemAlert(supabase, {
        type: 'unexpected_error',
        severity: 'critical',
        title: 'Mise à jour abo Pro sans user_id',
        message: 'Une mise à jour d\'abonnement Pro est arrivée pour un customer sans user_id en metadata.',
        metadata: { stage: 'sub_updated_no_user', subscriptionId: sub.id, customerId: sub.customer },
      });
      return;
    }
    await upsertProSubscription(userId, sub);
    return;
  }

  if (existing.plan !== newPlan) {
    // ⚠️ FIX FAILLE : avant d'appliquer le changement de plan,
    // on s'assure que la facture associée a bien été PAYÉE.
    // Sinon (3DS échoué, carte refusée, etc.), Stripe peut envoyer
    // ce webhook AVANT que le paiement soit finalisé. Dans ce cas
    // on skip — le changement de plan sera appliqué plus tard via
    // 'invoice.payment_succeeded' quand le paiement aboutira vraiment.
    const latestInvoice = sub.latest_invoice;
    let invoicePaid = false;
    if (latestInvoice) {
      if (typeof latestInvoice === 'string') {
        const inv = await stripe.invoices.retrieve(latestInvoice);
        invoicePaid = inv.status === 'paid';
      } else {
        invoicePaid = latestInvoice.status === 'paid';
      }
    }

    if (!invoicePaid) {
      console.log(`[sub.updated] Plan change ${existing.plan} → ${newPlan} en attente paiement, skip cumul crédits`);
      // On ne touche PAS au plan ni aux crédits.
      // On peut toutefois mettre à jour les autres champs (period, status, cancel_at_period_end).
    } else {
      const { error: upErr } = await supabase.rpc('upgrade_pro_subscription_credits', {
        p_subscription_id: existing.id,
        p_new_plan: newPlan,
      });

      if (upErr) {
        console.error('[sub.updated] Upgrade credits failed:', upErr);
        await insertSystemAlert(supabase, {
          type: 'save_error',
          severity: 'critical',
          title: 'Upgrade Pro — échec cumul crédits',
          message: `Le client a changé de plan (${existing.plan} → ${newPlan}) mais le cumul de crédits a échoué.`,
          userId: existing.user_id,
          metadata: { stage: 'upgrade_credits', subscriptionId: sub.id, oldPlan: existing.plan, newPlan, error: upErr.message },
        });
      } else {
        console.log(`[sub.updated] Plan changed ${existing.plan} → ${newPlan} (cumul appliqué, paiement confirmé)`);

        // ⭐ FIX UPGRADE : enregistrer le paiement dans `payments`
        // Aligné avec la souscription initiale (handleCheckoutCompleted) :
        // on récupère le montant payé depuis latest_invoice et on appelle recordProPayment.
        // L'anti-doublon par stripe_invoice_id empêchera un éventuel double-insert
        // si invoice.paid arrive aussi de son côté.
        try {
          let invoiceId: string | undefined;
          let amountPaid = 0;
          if (latestInvoice) {
            if (typeof latestInvoice === 'string') {
              const inv = await stripe.invoices.retrieve(latestInvoice);
              invoiceId = inv.id;
              amountPaid = inv.amount_paid || 0;
            } else {
              invoiceId = latestInvoice.id;
              amountPaid = latestInvoice.amount_paid || 0;
            }
          }
          if (amountPaid > 0) {
            await recordProPayment({
              userId: existing.user_id,
              amountTtcCents: amountPaid,
              description: `Abonnement ${planLabel(newPlan)} (upgrade depuis ${planLabel(existing.plan)})`,
              stripeInvoiceId: invoiceId,
            });
          } else {
            console.warn(`[sub.updated] Upgrade ${existing.plan} → ${newPlan} : amount_paid=0, pas d'insertion dans payments`);
          }
        } catch (recordErr) {
          console.error('[sub.updated] recordProPayment failed:', recordErr);
        }
      }
    }
  }

  // Ne mettre à jour stripe_price_id QUE si le changement de plan a été confirmé (paiement OK).
  // Sinon on garde l'ancien price_id pour rester cohérent avec le plan actuel en BDD.
  const periodsUpd = await getValidPeriods(sub);
  const updateFields: Record<string, unknown> = {
    current_period_start: periodsUpd.start,
    current_period_end: periodsUpd.end,
    cancel_at_period_end: sub.cancel_at_period_end,
    status: sub.status === 'active' ? 'active' : sub.status,
    updated_at: new Date().toISOString(),
  };

  // On vérifie à nouveau si la facture est payée (factorisation TODO mais OK)
  const latestInv = sub.latest_invoice;
  let isPaid = false;
  if (latestInv) {
    if (typeof latestInv === 'string') {
      const i = await stripe.invoices.retrieve(latestInv);
      isPaid = i.status === 'paid';
    } else {
      isPaid = latestInv.status === 'paid';
    }
  }

  // Si on est sur le même plan que celui en BDD, pas de souci (renouvellement, cancel toggle…)
  // Si on est sur un nouveau plan ET payé, on met à jour le price_id
  // Si on est sur un nouveau plan mais pas payé, on ne change PAS le price_id
  if (existing.plan === newPlan || isPaid) {
    updateFields.stripe_price_id = newPriceId;
  }

  const { error: updateError } = await supabase
    .from('pro_subscriptions')
    .update(updateFields)
    .eq('id', existing.id);

  if (updateError) {
    console.error('[sub.updated] Update failed:', updateError);
  }

  // ─────────────────────────────────────────────────────────────────
  // ⭐ V7 — Email de confirmation de résiliation programmée
  // On envoie SEULEMENT quand cancel_at_period_end passe de false à true
  // (1ère fois). Évite les doublons sur les events ultérieurs.
  // Couvre les 2 cas : client résilie depuis dashboard OU admin annule
  // depuis Stripe Dashboard ("Cancel at end of period").
  // ─────────────────────────────────────────────────────────────────
  const wasNotCancelling = !existing.cancel_at_period_end;
  const isNowCancelling = sub.cancel_at_period_end === true;

  if (wasNotCancelling && isNowCancelling) {
    try {
      // Récupérer email + prénom du client
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', existing.user_id)
        .maybeSingle();

      if (!profile?.email) {
        console.warn('[sub.updated] Résiliation détectée mais email user introuvable, skip mail');
      } else {
        const prenom = profile.full_name?.split(' ')[0] || 'Bonjour';
        const endDate = periodsUpd.end ? new Date(periodsUpd.end) : null;
        const endDateFr = endDate ? formatDateFr(endDate) : 'la fin de votre cycle en cours';
        const planLabelFr = planLabel(existing.plan);

        const html = buildCancellationEmail(prenom, planLabelFr, endDateFr);
        const mailResult = await sendMailjet(
          profile.email,
          '✅ Verimo Pro — Résiliation prise en compte',
          html,
        );

        if (mailResult.success) {
          console.log(`[sub.updated] Mail résiliation envoyé à ${profile.email} (fin: ${endDateFr})`);
        } else {
          console.error(`[sub.updated] Échec envoi mail résiliation: ${mailResult.error}`);
        }
      }
    } catch (mailErr) {
      // On ne fait pas échouer le webhook si le mail plante — c'est secondaire
      console.error('[sub.updated] Exception envoi mail résiliation:', mailErr);
    }
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  // Récupérer user_id avant le update pour pouvoir lui envoyer la notif finale
  const { data: existing } = await supabase
    .from('pro_subscriptions')
    .select('user_id, plan')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();

  const { error } = await supabase
    .from('pro_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      credits_complete_total: 0,
      credits_simple_total: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', sub.id);

  if (error) {
    console.error('[sub.deleted] Update failed:', error);
    await insertSystemAlert(supabase, {
      type: 'save_error',
      severity: 'warning',
      title: 'Annulation Pro — échec mise à jour',
      message: 'Un abonnement Pro a été annulé côté Stripe mais la mise à jour en base a échoué.',
      metadata: { stage: 'sub_deleted', subscriptionId: sub.id, error: error.message },
    });
    return;
  }

  // Si on connaît le user_id, envoyer la notif finale
  // (cas d'annulation suite à des échecs de paiement répétés)
  if (existing?.user_id) {
    // On vérifie le motif d'annulation : si c'est lié à des paiements échoués,
    // on envoie une notif spécifique. Sinon (annulation volontaire fin de cycle),
    // on n'envoie rien (déjà géré par le flux de résiliation).
    // Stripe expose cancellation_details.reason pour cela.
    const cancelReason = (sub as any).cancellation_details?.reason;
    const isPaymentFailure = cancelReason === 'payment_failed' || cancelReason === 'payment_disputed';

    if (isPaymentFailure) {
      const { error: notifError } = await supabase.from('user_notifications').insert({
        user_id: existing.user_id,
        title: '❌ Abonnement suspendu',
        message: 'Votre abonnement a été suspendu suite à plusieurs échecs de paiement. Vos crédits abonnement ont été retirés. Vous pouvez vous réabonner à tout moment depuis votre tableau de bord.',
        read: false,
      });

      if (notifError) {
        console.error('[sub.deleted] Final notif insert error:', notifError);
      } else {
        console.log(`[sub.deleted] Final cancellation notification sent to user ${existing.user_id}`);
      }
    }
  }

  console.log(`[sub.deleted] Subscription ${sub.id} canceled`);
}

// ═════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════

async function upsertProSubscription(userId: string, sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price.id;
  const plan = PRICE_TO_PLAN[priceId];

  if (!plan) {
    throw new Error(`Unknown price ID: ${priceId}`);
  }

  const quotas = PLAN_QUOTAS[plan];

  const { data: existing } = await supabase
    .from('pro_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', sub.id)
    .maybeSingle();

  const periodsUpsert = await getValidPeriods(sub);
  const subData = {
    user_id: userId,
    plan,
    status: sub.status === 'active' ? 'active' : sub.status,
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer as string,
    stripe_price_id: priceId,
    current_period_start: periodsUpsert.start,
    current_period_end: periodsUpsert.end,
    cancel_at_period_end: sub.cancel_at_period_end,
    credits_complete_total: quotas.complete,
    credits_complete_used: 0,
    credits_simple_total: quotas.simple,
    credits_simple_used: 0,
    updated_at: new Date().toISOString(),
  };

  let writeError: { message: string } | null = null;

  if (existing) {
    const { error } = await supabase
      .from('pro_subscriptions')
      .update(subData)
      .eq('id', existing.id);
    writeError = error;
  } else {
    const { error } = await supabase.from('pro_subscriptions').insert(subData);
    writeError = error;
  }

  if (writeError) {
    console.error('[upsertProSubscription] Write failed:', writeError);
    await insertSystemAlert(supabase, {
      type: 'save_error',
      severity: 'critical',
      title: 'Création/MAJ abonnement Pro échouée',
      message: `Un abonnement Pro (plan ${plan}) a été reçu de Stripe mais l'enregistrement en base a échoué.`,
      userId,
      metadata: { stage: 'upsert_pro_sub', subscriptionId: sub.id, plan, error: writeError.message },
    });
    throw new Error(`pro_subscriptions write failed: ${writeError.message}`);
  }

  // Met à jour le rôle profil → 'pro' (sauf si admin)
  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'pro' })
    .eq('id', userId)
    .neq('role', 'admin');

  if (roleError) {
    console.error('[upsertProSubscription] Role update failed:', roleError);
  }

  console.log(`[upsertProSubscription] Pro subscription ${existing ? 'updated' : 'created'} for user ${userId}, plan ${plan}`);
}

async function handleUnitPurchase(userId: string, session: Stripe.Checkout.Session) {
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ['data.price'],
    limit: 100,
  });

  for (const item of lineItems.data) {
    const priceId = item.price?.id;
    if (!priceId) continue;

    const unit = PRICE_TO_UNIT[priceId];
    if (!unit) {
      console.warn(`[unit.purchase] Unknown unit price ${priceId}, skip`);
      await insertSystemAlert(supabase, {
        type: 'unexpected_error',
        severity: 'warning',
        title: 'Achat unitaire Pro — price ID inconnu',
        message: `Un achat unitaire Pro a été reçu avec un price ID non mappé (${priceId}).`,
        userId,
        metadata: { stage: 'unit_purchase_unknown_price', priceId, sessionId: session.id },
      });
      continue;
    }

    const quantity = item.quantity ?? 1;

    const { error: insertError } = await supabase.from('pro_unit_purchases').insert({
      user_id: userId,
      type: unit.type,
      quantity,
      credits_remaining: quantity,
      amount: unit.amount_ht * quantity,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      stripe_payment_id: session.payment_intent as string,
      purchased_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('[unit.purchase] Insert failed:', insertError);
      await insertSystemAlert(supabase, {
        type: 'save_error',
        severity: 'critical',
        title: 'Achat unitaire Pro — enregistrement échoué',
        message: `Un achat unitaire Pro (${quantity} ${unit.type}) a été reçu de Stripe mais l'enregistrement a échoué.`,
        userId,
        metadata: { stage: 'unit_purchase_insert', sessionId: session.id, type: unit.type, quantity, error: insertError.message },
      });
    } else {
      console.log(`[unit.purchase] Added ${quantity} ${unit.type} credits for user ${userId}`);
    }
  }
}

// ══════════════════════════════════════════════════════════════════════
// HANDLER charge.refunded — V6 (10 mai 2026)
// Synchronise les remboursements Stripe vers la table payments
// Match via stripe_payment_id (= payment_intent) — le plus fiable
// Ne touche PAS aux crédits / abos (décision produit)
// ══════════════════════════════════════════════════════════════════════
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.warn('[charge.refunded] Pas de payment_intent sur le charge, skip');
    return;
  }

  // Match sur stripe_payment_id (= payment_intent_id stocké à l'insert)
  const { data: payment, error: findError } = await supabase
    .from('payments')
    .select('id, amount, status, customer_type')
    .eq('stripe_payment_id', paymentIntentId)
    .maybeSingle();

  if (findError) {
    console.error('[charge.refunded] Erreur lookup payments:', findError.message);
    return;
  }

  if (!payment) {
    // Pas dans cette table → c'est probablement un paiement géré par l'autre webhook (particulier)
    // Skip silencieux : l'autre webhook s'en occupera.
    console.log(`[charge.refunded] Payment intent ${paymentIntentId} non trouvé dans payments — skip (probablement géré par webhook particulier)`);
    return;
  }

  // Stripe envoie les montants en cents
  const amountTotalCents = charge.amount;
  const amountRefundedCents = charge.amount_refunded;
  const amountTotal = amountTotalCents / 100;
  const amountRefunded = amountRefundedCents / 100;

  const isFullRefund = amountRefundedCents >= amountTotalCents;
  const newStatus = isFullRefund ? 'refunded' : 'partially_refunded';

  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: newStatus,
      refunded_amount: amountRefunded,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', payment.id);

  if (updateError) {
    console.error('[charge.refunded] Update payment failed:', updateError.message);
    await insertSystemAlert(supabase, {
      type: 'save_error',
      severity: 'critical',
      title: 'Remboursement Stripe Pro — sync BDD échouée',
      message: `Un remboursement de ${amountRefunded.toFixed(2)}€ TTC a été reçu de Stripe (payment_intent: ${paymentIntentId}) mais la mise à jour de la table payments a échoué.`,
      metadata: { stage: 'refund_update', paymentIntentId, amountRefunded, error: updateError.message },
    });
    return;
  }

  console.log(
    `[charge.refunded] Payment Pro ${payment.id} mis à jour: ${newStatus}, refunded=${amountRefunded.toFixed(2)}€ / ${amountTotal.toFixed(2)}€ TTC`
  );
}
