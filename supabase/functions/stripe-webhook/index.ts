// ══════════════════════════════════════════════════════════════
// STRIPE WEBHOOK — Verimo Particuliers (V3.2)
// Écoute checkout.session.completed + charge.refunded
// Attribue les crédits + enregistre le paiement dans payments
// Synchronise les remboursements Stripe → payments
//
// V3.2 (10 mai 2026) :
//   - Handler charge.refunded ajouté
//   - Sync automatique des remboursements vers la table payments
//   - Match via stripe_payment_id (= payment_intent_id)
//   - Ne touche PAS aux crédits / analyses (décision produit)
//   - Skip silencieux si le paiement n'est pas dans cette table
//     (= géré par le webhook pro)
//
// V3.1 (10 mai 2026) :
//   - Filtre paiements pro : si metadata.user_id (underscore) présent,
//     on skip silencieusement — plus d'alerte critique inutile sur
//     la page admin (le webhook pro gère ce paiement)
//
// V3 (sécurité — 10 mai 2026) :
//   - Idempotence via processed_stripe_events (empêche le double-crédit
//     en cas de retry Stripe — même mécanique que stripe-webhook-pro V4)
//   - Insert promo_uses + RPC increment_promo_uses APRÈS paiement confirmé
//     (avant V3 c'était fait au moment du checkout → un code promo pouvait
//     être consommé sans paiement effectif)
//   - Lecture du code promo via session.metadata.promoCodeId (fiable)
//     plutôt que via la dernière ligne de promo_uses (race condition)
//
// V2 :
//   - Gestion d'erreur après chaque appel Supabase (plus de bug silencieux)
//   - Logs structurés à chaque étape
//   - Insertion alertes dans system_alerts si problème (page admin)
// ══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

type SupabaseClient = ReturnType<typeof createClient>;

const PRICE_CREDITS: Record<string, { credits_document?: number; credits_complete?: number; label: string; amount: number }> = {
  'price_1TTtd1BesXB76oWECAGA9ywf': { credits_document: 1, label: 'Analyse Document — 1 crédit simple', amount: 4.90 },
  'price_1TTtd2BesXB76oWEsZ9LsLS9': { credits_complete: 1, label: 'Analyse Complète — 1 crédit complet', amount: 19.90 },
  'price_1TTtcxBesXB76oWETkokxLgB': { credits_complete: 2, label: 'Pack 2 Biens — 2 crédits complets', amount: 29.90 },
  'price_1TTtczBesXB76oWEloTMvEZF': { credits_complete: 3, label: 'Pack 3 Biens — 3 crédits complets', amount: 39.90 },
};

// ══════════════════════════════════════════════════════════════
// INSERTION D'UNE ALERTE SYSTÈME POUR L'ADMIN
// ══════════════════════════════════════════════════════════════
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
      console.error('[stripe-webhook] Erreur insertion alerte:', error.message);
    } else {
      console.log(`[stripe-webhook] 🔔 Alerte système: ${params.type} — ${params.title}`);
    }
  } catch (err) {
    console.error('[stripe-webhook] Erreur insertion alerte:', err);
  }
}

// ══════════════════════════════════════════════════════════════
// IDEMPOTENCE — empêche le double-traitement d'un même event Stripe
// (Stripe retry jusqu'à 16 fois sur 3 jours en cas de timeout/erreur)
// Réutilise la table processed_stripe_events partagée avec le webhook pro.
// ══════════════════════════════════════════════════════════════
async function isEventAlreadyProcessed(
  supabaseAdmin: SupabaseClient,
  eventId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
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
  supabaseAdmin: SupabaseClient,
  eventId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('processed_stripe_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      webhook_source: 'stripe-webhook',
      metadata: metadata ?? null,
    });

  if (error) {
    // Erreur 23505 = duplicate key violation = race condition (2 webhooks en parallèle)
    // C'est le comportement attendu : on log et on continue
    console.error('[idempotence] Erreur insertion processed_stripe_events:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!;
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' });
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let eventTypeForCatch: string | undefined;
  let sessionIdForCatch: string | undefined;
  let userIdForCatch: string | undefined;

  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature')!;

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      console.error('[stripe-webhook] Webhook signature error:', err);
      await insertSystemAlert(supabase, {
        type: 'unexpected_error',
        severity: 'critical',
        title: 'Webhook Stripe — signature invalide',
        message: 'Une requête Stripe a été reçue avec une signature invalide. Vérification du secret webhook recommandée.',
        metadata: { stage: 'signature', error: String(err) },
      });
      return new Response('Invalid signature', { status: 400, headers: CORS });
    }

    eventTypeForCatch = event.type;
    console.log(`[stripe-webhook] Event reçu: ${event.type} (id=${event.id})`);

    // ─────────────────────────────────────────────────────────────────
    // IDEMPOTENCE : si l'event a déjà été traité, on skip
    // ─────────────────────────────────────────────────────────────────
    if (await isEventAlreadyProcessed(supabase, event.id)) {
      console.log(`[stripe-webhook] Event ${event.id} déjà traité, skip (idempotence)`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      sessionIdForCatch = session.id;

      // ─────────────────────────────────────────────────────────────────
      // FILTRE V3.1 : si la session est destinée au webhook pro
      // (metadata.user_id avec underscore = paiement pro), on skip
      // silencieusement — pas d'alerte critique inutile.
      // Le webhook pro (stripe-webhook-pro) va gérer ce paiement.
      // ─────────────────────────────────────────────────────────────────
      if (session.metadata?.user_id && !session.metadata?.userId) {
        console.log(`[stripe-webhook] Session ${session.id} = paiement pro (metadata.user_id présent), skip côté particulier`);
        await markEventAsProcessed(supabase, event.id, event.type, { skipped: 'pro_payment' });
        return new Response(JSON.stringify({ received: true, skipped: 'pro_payment' }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      const userId = session.metadata?.userId || session.client_reference_id;
      if (!userId) {
        console.error('[stripe-webhook] No userId in session', session.id);
        await insertSystemAlert(supabase, {
          type: 'unexpected_error',
          severity: 'critical',
          title: 'Paiement reçu sans user_id',
          message: 'Un paiement Stripe a été reçu mais ne contient pas de user_id dans les metadata. Le crédit n\'a pas été attribué.',
          metadata: { stage: 'no_user_id', sessionId: session.id, customerEmail: session.customer_details?.email },
        });
        return new Response('No userId', { status: 400, headers: CORS });
      }

      userIdForCatch = userId;

      // Récupérer le consentement au droit de rétractation
      const retractationWaiverAt = session.metadata?.retractationWaiverAt || null;

      // Récupérer l'ID du payment_intent
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || null;

      // Récupérer le price ID
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;
      const creditInfo = priceId ? PRICE_CREDITS[priceId] : null;

      if (!creditInfo) {
        console.warn('[stripe-webhook] Price ID inconnu', priceId);
        await insertSystemAlert(supabase, {
          type: 'unexpected_error',
          severity: 'warning',
          title: 'Paiement reçu — price ID inconnu',
          message: `Un paiement a été reçu avec un price ID non mappé (${priceId}). Le crédit n'a pas pu être attribué automatiquement.`,
          userId,
          metadata: { stage: 'unknown_price', sessionId: session.id, priceId },
        });
        // On marque quand même l'event comme traité (alerte créée, action manuelle requise)
        await markEventAsProcessed(supabase, event.id, event.type, { skipped: 'unknown_price' });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      console.log('[stripe-webhook] CreditInfo trouvé:', creditInfo);

      // ─────────────────────────────────────────────────────────────────
      // 1. Attribution des crédits sur le profil
      // ─────────────────────────────────────────────────────────────────
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits_document, credits_complete, free_preview_used')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[stripe-webhook] Erreur récupération profile:', profileError.message);
        await insertSystemAlert(supabase, {
          type: 'save_error',
          severity: 'critical',
          title: 'Profil introuvable lors d\'un paiement',
          message: 'Un paiement a été reçu mais le profil utilisateur est introuvable. Le crédit n\'a pas été attribué.',
          userId,
          metadata: { stage: 'profile_fetch', error: profileError.message, sessionId: session.id },
        });
        // On NE marque PAS l'event comme traité → Stripe va retry
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      if (profile) {
        const updates: Record<string, number | boolean> = {};
        if (creditInfo.credits_document) {
          updates.credits_document = (profile.credits_document || 0) + creditInfo.credits_document;
        }
        if (creditInfo.credits_complete) {
          updates.credits_complete = (profile.credits_complete || 0) + creditInfo.credits_complete;
        }
        if (!profile.free_preview_used) {
          updates.free_preview_used = true;
        }

        const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', userId);
        if (updateError) {
          console.error('[stripe-webhook] Erreur update profile:', updateError.message);
          await insertSystemAlert(supabase, {
            type: 'save_error',
            severity: 'critical',
            title: 'Échec attribution crédit après paiement',
            message: 'Le paiement a été reçu mais l\'attribution du crédit a échoué. Une action manuelle est requise.',
            userId,
            metadata: { stage: 'profile_update', error: updateError.message, sessionId: session.id, updates },
          });
          // On NE marque PAS l'event comme traité → Stripe va retry
          return new Response(JSON.stringify({ received: true }), {
            headers: { ...CORS, 'Content-Type': 'application/json' },
          });
        } else {
          console.log('[stripe-webhook] Crédits attribués:', updates);
        }
      }

      const amountPaid = (session.amount_total || 0) / 100;

      // ─────────────────────────────────────────────────────────────────
      // 2. Consommation du code promo APRÈS paiement confirmé (V3)
      //    - Lit promoCodeId depuis les metadata Stripe (fiable)
      //    - Insert dans promo_uses
      //    - Incrémente uses_count via RPC atomique
      //    - Tout est idempotent grâce à la garde processed_stripe_events
      // ─────────────────────────────────────────────────────────────────
      let promoCode: string | null = null;
      const promoCodeId = session.metadata?.promoCodeId || null;

      if (promoCodeId) {
        // Récupérer le code lisible pour la description
        const { data: promo } = await supabase
          .from('promo_codes')
          .select('code')
          .eq('id', promoCodeId)
          .maybeSingle();

        promoCode = promo?.code || null;

        // Anti-doublon : vérifier que ce user n'a pas déjà ce code en promo_uses
        // (cas théorique : 2 webhooks reçus en parallèle juste avant le mark)
        const { data: alreadyUsed } = await supabase
          .from('promo_uses')
          .select('id')
          .eq('code_id', promoCodeId)
          .eq('user_id', userId)
          .maybeSingle();

        if (!alreadyUsed) {
          const { error: promoUseErr } = await supabase
            .from('promo_uses')
            .insert({ code_id: promoCodeId, user_id: userId });

          if (promoUseErr) {
            console.error('[stripe-webhook] Erreur insert promo_uses:', promoUseErr.message);
            await insertSystemAlert(supabase, {
              type: 'save_error',
              severity: 'warning',
              title: 'Code promo : enregistrement utilisation échoué',
              message: 'Le paiement avec code promo a abouti mais l\'enregistrement de l\'utilisation a échoué.',
              userId,
              metadata: { stage: 'promo_use_insert', error: promoUseErr.message, promoCodeId, sessionId: session.id },
            });
          } else {
            // Incrément atomique du compteur (RPC déjà existante côté front)
            const { error: rpcErr } = await supabase.rpc('increment_promo_uses', {
              code_id: promoCodeId,
            });
            if (rpcErr) {
              console.error('[stripe-webhook] Erreur RPC increment_promo_uses:', rpcErr.message);
              await insertSystemAlert(supabase, {
                type: 'save_error',
                severity: 'warning',
                title: 'Code promo : incrément compteur échoué',
                message: 'L\'utilisation du code promo a été enregistrée mais le compteur uses_count n\'a pas été incrémenté.',
                userId,
                metadata: { stage: 'promo_increment', error: rpcErr.message, promoCodeId },
              });
            } else {
              console.log(`[stripe-webhook] Promo ${promoCode} consommé pour user ${userId}`);
            }
          }
        } else {
          console.log(`[stripe-webhook] Promo ${promoCode} déjà enregistré pour user ${userId}, skip`);
        }
      }

      // ─────────────────────────────────────────────────────────────────
      // 3. Construction de la description + enregistrement dans payments
      // ─────────────────────────────────────────────────────────────────
      let description = creditInfo.label;
      if (promoCode && amountPaid < creditInfo.amount) {
        const reduction = ((creditInfo.amount - amountPaid) / creditInfo.amount * 100).toFixed(0);
        description += ` · Code ${promoCode} (−${reduction}%)`;
      }

      // Anti-doublon payments : si une ligne existe déjà pour ce stripe_session_id
      // (filet de sécurité — l'idempotence event_id devrait déjà avoir bloqué)
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (existingPayment) {
        console.log(`[stripe-webhook] Paiement ${session.id} déjà enregistré, skip insert`);
      } else {
        const { data: paymentInserted, error: paymentError } = await supabase.from('payments').insert({
          user_id: userId,
          amount: amountPaid,
          amount_ht: amountPaid, // Particulier = pas de TVA → HT = TTC
          customer_type: 'particulier',
          currency: 'eur',
          description,
          stripe_session_id: session.id,
          stripe_payment_id: paymentIntentId,
          promo_code: promoCode,
          credits_added: creditInfo.credits_document || creditInfo.credits_complete || 0,
          credit_type: creditInfo.credits_document ? 'document' : 'complete',
          status: 'completed',
          retractation_waiver_at: retractationWaiverAt,
        }).select().single();

        if (paymentError) {
          console.error('[stripe-webhook] Erreur insert payment:', paymentError.message);
          await insertSystemAlert(supabase, {
            type: 'save_error',
            severity: 'critical',
            title: 'Échec enregistrement paiement Stripe',
            message: `Le paiement de ${amountPaid.toFixed(2)}€ a été reçu de Stripe et le crédit a été attribué, mais l'enregistrement en base a échoué. Vérification manuelle requise.`,
            userId,
            metadata: {
              stage: 'payment_insert',
              error: paymentError.message,
              sessionId: session.id,
              paymentIntentId,
              amount: amountPaid,
              description,
            },
          });
        } else {
          console.log('[stripe-webhook] Paiement enregistré:', paymentInserted?.id);
        }
      }
    }

    // ═════════════════════════════════════════════════════════════════
    // V3.2 — Handler charge.refunded
    // Synchronise les remboursements Stripe → table payments
    // Ne touche pas aux crédits / analyses (décision produit)
    // ═════════════════════════════════════════════════════════════════
    else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      await handleChargeRefunded(charge);
    }

    // ─────────────────────────────────────────────────────────────────
    // Event traité avec succès → on le marque pour idempotence future
    // ─────────────────────────────────────────────────────────────────
    await markEventAsProcessed(supabase, event.id, event.type);

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[stripe-webhook] Erreur globale:', err);
    await insertSystemAlert(supabase, {
      type: 'unexpected_error',
      severity: 'critical',
      title: 'Webhook Stripe — erreur inattendue',
      message: 'Une erreur inattendue est survenue dans le traitement d\'un webhook Stripe.',
      userId: userIdForCatch,
      metadata: {
        stage: 'global_catch',
        error: String(err),
        eventType: eventTypeForCatch,
        sessionId: sessionIdForCatch,
      },
    });
    // En cas d'erreur, on NE marque PAS l'event comme traité
    // → Stripe va retry, et au prochain essai si ça réussit, on le marquera
    return new Response('Server error', { status: 500, headers: CORS });
  }
});

// ══════════════════════════════════════════════════════════════
// HANDLER charge.refunded — V3.2 (10 mai 2026)
// Synchronise les remboursements Stripe vers la table payments
// Match via stripe_payment_id (= payment_intent) — le plus fiable
// ══════════════════════════════════════════════════════════════
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
    // Pas dans cette table → c'est probablement un paiement géré par l'autre webhook (pro)
    // Skip silencieux : l'autre webhook s'en occupera.
    console.log(`[charge.refunded] Payment intent ${paymentIntentId} non trouvé dans payments — skip (probablement géré par webhook pro)`);
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
      title: 'Remboursement Stripe — sync BDD échouée',
      message: `Un remboursement de ${amountRefunded.toFixed(2)}€ a été reçu de Stripe (payment_intent: ${paymentIntentId}) mais la mise à jour de la table payments a échoué.`,
      metadata: { stage: 'refund_update', paymentIntentId, amountRefunded, error: updateError.message },
    });
    return;
  }

  console.log(
    `[charge.refunded] Payment ${payment.id} mis à jour: ${newStatus}, refunded=${amountRefunded.toFixed(2)}€ / ${amountTotal.toFixed(2)}€`
  );
}
