// ══════════════════════════════════════════════════════════════════════
// VERIMO — Edge Function : stripe-webhook-pro V4
//
// Gère les événements Stripe pour les ABONNEMENTS PRO uniquement
// (Découverte, Starter, Power) + les achats unitaires pro.
//
// V4 :
//   - Idempotence via la table processed_stripe_events
//     → empêche le double-traitement d'un même event Stripe (retry, doublon)
//   - Conservation de toute la logique V3 (alertes admin, gestion erreurs)
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

const PRICE_TO_PLAN: Record<string, 'decouverte' | 'starter' | 'power'> = {
  'price_1TTtd1BesXB76oWEZuILxjwe': 'decouverte',
  'price_1TTtczBesXB76oWEcKaNR2BW': 'starter',
  'price_1TTtcxBesXB76oWEPyVYZjCj': 'power',
};

const PRICE_TO_UNIT: Record<string, { type: 'complete' | 'document'; amount_ht: number }> = {
  'price_1TTtcyBesXB76oWEBF1TLHYz': { type: 'complete', amount_ht: 990 },
  'price_1TTtd2BesXB76oWEVM0p27GS': { type: 'document', amount_ht: 290 },
};

const PLAN_QUOTAS: Record<'decouverte' | 'starter' | 'power', { complete: number; simple: number }> = {
  decouverte: { complete: 1, simple: 3 },
  starter: { complete: 5, simple: 15 },
  power: { complete: 10, simple: 30 },
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
    await insertSystemAlert(supabase, {
      type: 'unexpected_error',
      severity: 'critical',
      title: `Webhook Stripe Pro — erreur ${event.type}`,
      message: `Une erreur inattendue est survenue dans le traitement de l'event ${event.type}.`,
      metadata: { stage: 'handler', eventType: event.type, eventId: event.id, error: (err as Error).message },
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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.warn('[checkout.completed] Missing user_id in metadata, skip');
    await insertSystemAlert(supabase, {
      type: 'unexpected_error',
      severity: 'critical',
      title: 'Paiement Pro reçu sans user_id',
      message: 'Un paiement Pro Stripe a été reçu mais ne contient pas de user_id dans les metadata.',
      metadata: { stage: 'no_user_id', sessionId: session.id, mode: session.mode },
    });
    return;
  }

  if (session.mode === 'subscription' && session.subscription) {
    const subId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription.id;

    const sub = await stripe.subscriptions.retrieve(subId);
    await upsertProSubscription(userId, sub);

    // Ajouter le SIRET en custom_fields sur la subscription pour qu'il apparaisse
    // sur toutes les futures factures PDF (et la 1ère qui vient d'être générée si possible).
    // On le fait ici car Stripe ne permet pas de passer custom_fields dans subscription_data
    // au moment du Checkout.
    await applySiretCustomFieldToSubscription(userId, subId);

    console.log(`[checkout.completed] Subscription created for user ${userId}`);
    return;
  }

  if (session.mode === 'payment') {
    await handleUnitPurchase(userId, session);

    // Pour les achats unitaires, ajouter le SIRET sur la facture générée
    if (session.invoice) {
      const invId = typeof session.invoice === 'string' ? session.invoice : session.invoice.id;
      await applySiretCustomFieldToInvoice(userId, invId);
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

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) {
    console.log('[invoice.paid] No subscription, skip');
    return;
  }

  const subId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription.id;

  if (invoice.billing_reason === 'subscription_create') {
    console.log('[invoice.paid] First invoice, skip');
    return;
  }

  const sub = await stripe.subscriptions.retrieve(subId);

  const { data: existing, error } = await supabase
    .from('pro_subscriptions')
    .select('id, plan, user_id')
    .eq('stripe_subscription_id', subId)
    .maybeSingle();

  if (error || !existing) {
    console.error(`[invoice.paid] Subscription ${subId} not found in DB`);
    await insertSystemAlert(supabase, {
      type: 'save_error',
      severity: 'warning',
      title: 'Renouvellement Pro — abonnement introuvable',
      message: 'Un renouvellement de paiement Pro est arrivé mais l\'abonnement correspondant est introuvable en base.',
      metadata: { stage: 'invoice_paid_lookup', subscriptionId: subId, error: error?.message },
    });
    return;
  }

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

  const { error: updateError } = await supabase
    .from('pro_subscriptions')
    .update({
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      status: sub.status === 'active' ? 'active' : sub.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (updateError) {
    console.error('[invoice.paid] Update period failed:', updateError);
  }

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
    .select('id, plan, user_id')
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
      console.log(`[sub.updated] Plan changed ${existing.plan} → ${newPlan} (cumul appliqué)`);
    }
  }

  const { error: updateError } = await supabase
    .from('pro_subscriptions')
    .update({
      stripe_price_id: newPriceId,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      status: sub.status === 'active' ? 'active' : sub.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (updateError) {
    console.error('[sub.updated] Update failed:', updateError);
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

  const subData = {
    user_id: userId,
    plan,
    status: sub.status === 'active' ? 'active' : sub.status,
    stripe_subscription_id: sub.id,
    stripe_customer_id: sub.customer as string,
    stripe_price_id: priceId,
    current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
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
