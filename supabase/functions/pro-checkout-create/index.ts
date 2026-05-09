// ══════════════════════════════════════════════════════════════════════
// VERIMO — Edge Function : pro-checkout-create V2
//
// Crée une session Stripe Checkout pour les pros.
// Appelée par le frontend depuis le dashboard pro (MonAbonnement).
//
// V2 :
//   - Fix bug upgrade : plein tarif facturé immédiatement (au lieu de gratuit)
//   - Support 3DS inline : retourne le client_secret au frontend si requis
//   - Préparation downgrade différé : nouveau mode "schedule_downgrade"
//   - Mode "preview_upgrade" : récap pour le popup avant validation
//
// Modes supportés :
//
// 1. "subscribe" — S'abonner à un plan (Découverte / Starter / Power)
//    Body : { mode: "subscribe", plan: "decouverte" | "starter" | "power" }
//
// 2. "preview_upgrade" — Récap d'upgrade avant validation (pour popup)
//    Body : { mode: "preview_upgrade", plan: "starter" | "power" }
//    Renvoie : { current_plan, new_plan, amount_ht, amount_tva, amount_ttc,
//               next_billing_date, current_credits, new_credits }
//
// 3. "buy_unit" — Acheter une analyse à l'unité (réservé aux abonnés actifs)
//    Body : { mode: "buy_unit", unit_type: "complete" | "document", quantity: number }
//
// 4. "cancel" — Annuler l'abonnement (cancel_at_period_end)
//    Body : { mode: "cancel", reason: string }
//
// 5. "reactivate" — Annuler la résiliation
//    Body : { mode: "reactivate" }
//
// 6. "billing_portal" — Ouvrir le portail Stripe (modifier carte)
//    Body : { mode: "billing_portal" }
//
// 7. "list_invoices" — Lister les factures Stripe du client
//    Body : { mode: "list_invoices", target_user_id?: string }
//
// Sécurité :
// - JWT vérifié (le pro doit être connecté)
// - "buy_unit" refusé si pas d'abonnement pro actif (HTTP 403)
//
// Variables d'environnement requises :
// - STRIPE_SECRET_KEY
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - SUPABASE_ANON_KEY (pour vérifier le JWT du user)
// ══════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

// ─────────────────────────────────────────────────────────────────────
// Configuration : Mapping plan/unit → Price ID Stripe (PRODUCTION)
// ─────────────────────────────────────────────────────────────────────

const PLAN_TO_PRICE: Record<'decouverte' | 'starter' | 'power', string> = {
  decouverte: 'price_1TTtd1BesXB76oWEZuILxjwe',
  starter: 'price_1TTtczBesXB76oWEcKaNR2BW',
  power: 'price_1TTtcxBesXB76oWEPyVYZjCj',
};

const PLAN_HT_PRICE: Record<'decouverte' | 'starter' | 'power', number> = {
  decouverte: 1990,  // 19,90€ HT en centimes
  starter: 4990,     // 49,90€ HT
  power: 8990,       // 89,90€ HT
};

const PLAN_LABEL: Record<'decouverte' | 'starter' | 'power', string> = {
  decouverte: 'Découverte',
  starter: 'Starter',
  power: 'Power',
};

const PLAN_QUOTAS: Record<'decouverte' | 'starter' | 'power', { complete: number; simple: number }> = {
  decouverte: { complete: 1, simple: 3 },
  starter: { complete: 5, simple: 15 },
  power: { complete: 10, simple: 30 },
};

const UNIT_TO_PRICE: Record<'complete' | 'document', string> = {
  complete: 'price_1TTtcyBesXB76oWEBF1TLHYz',
  document: 'price_1TTtd2BesXB76oWEVM0p27GS',
};

// ─────────────────────────────────────────────────────────────────────
// TVA France 20% — Tax Rate Stripe (exclusif = ajouté en sus du HT)
// ─────────────────────────────────────────────────────────────────────
const TVA_TAX_RATE_ID = 'txr_1TUAxVBesXB76oWESXBnGdIZ';
const TVA_RATE = 0.20; // 20%

// URL de redirection après succès/annulation
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://www.verimo.fr';
const SUCCESS_URL_SUBSCRIBE = `${SITE_URL}/dashboard/abonnement?checkout=success&type=subscribe`;
const SUCCESS_URL_UPGRADE = `${SITE_URL}/dashboard/abonnement?checkout=success&type=upgrade`;
const SUCCESS_URL_UNIT = `${SITE_URL}/dashboard/abonnement?checkout=success&type=unit`;
const CANCEL_URL = `${SITE_URL}/dashboard/abonnement?checkout=cancel`;

// ─────────────────────────────────────────────────────────────────────
// Init Stripe + Supabase clients
// ─────────────────────────────────────────────────────────────────────

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// ─────────────────────────────────────────────────────────────────────
// CORS headers
// ─────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═════════════════════════════════════════════════════════════════════

serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // 1. Récupérer le user via le JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);

    if (authErr || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // 2. Parser la requête
    const body = await req.json();
    const { mode } = body;

    if (mode === 'subscribe') {
      return await handleSubscribe(user.id, body);
    } else if (mode === 'preview_upgrade') {
      return await handlePreviewUpgrade(user.id, body);
    } else if (mode === 'buy_unit') {
      return await handleBuyUnit(user.id, body);
    } else if (mode === 'cancel') {
      return await handleCancel(user.id, body);
    } else if (mode === 'reactivate') {
      return await handleReactivate(user.id);
    } else if (mode === 'billing_portal') {
      return await handleBillingPortal(user.id);
    } else if (mode === 'list_invoices') {
      // Admin can request another user's invoices
      const targetUserId = body.target_user_id || null;
      if (targetUserId && targetUserId !== user.id) {
        // Verify caller is admin
        const { data: callerProfile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (!callerProfile || callerProfile.role !== 'admin') {
          return jsonResponse({ error: 'Accès non autorisé' }, 403);
        }
        return await handleListInvoices(targetUserId);
      }
      return await handleListInvoices(user.id);
    } else {
      return jsonResponse({ error: 'Invalid mode' }, 400);
    }
  } catch (err) {
    console.error('[pro-checkout-create] Error:', err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

// ═════════════════════════════════════════════════════════════════════
// HANDLERS
// ═════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// MODE "subscribe" — S'abonner à un plan OU upgrade/downgrade
// ─────────────────────────────────────────────────────────────────────

async function handleSubscribe(userId: string, body: any) {
  const { plan } = body;

  if (!plan || !['decouverte', 'starter', 'power'].includes(plan)) {
    return jsonResponse({ error: 'Invalid plan' }, 400);
  }

  const priceId = PLAN_TO_PRICE[plan as keyof typeof PLAN_TO_PRICE];

  // Récupérer ou créer le customer Stripe
  const customerId = await getOrCreateStripeCustomer(userId);

  // Vérifier s'il y a déjà un abo actif → upgrade au lieu de créer un nouveau
  const { data: existingSub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('stripe_subscription_id, plan')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingSub?.stripe_subscription_id) {
    // Cas upgrade/downgrade : on met à jour la subscription existante
    if (existingSub.plan === plan) {
      return jsonResponse({ error: 'Vous êtes déjà sur ce plan' }, 400);
    }

    return await handleUpgradeOrDowngrade(
      existingSub.stripe_subscription_id,
      existingSub.plan,
      plan,
      priceId,
    );
  }

  // Pas d'abo actif → création via Checkout
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: SUCCESS_URL_SUBSCRIBE,
    cancel_url: CANCEL_URL,
    metadata: {
      user_id: userId,
      plan,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
        plan,
      },
      default_tax_rates: [TVA_TAX_RATE_ID],
    },
    automatic_tax: { enabled: false },
    locale: 'fr',
  });

  return jsonResponse({ url: session.url });
}

// ─────────────────────────────────────────────────────────────────────
// UPGRADE / DOWNGRADE — Logique métier
// ─────────────────────────────────────────────────────────────────────
// UPGRADE : plein tarif facturé immédiatement, cycle reset à aujourd'hui
//           Si 3DS requis, retourne client_secret au frontend (Stripe.js)
// DOWNGRADE : différé en fin de cycle (cancel current + schedule new plan)
// ─────────────────────────────────────────────────────────────────────

async function handleUpgradeOrDowngrade(
  stripeSubscriptionId: string,
  currentPlan: string,
  newPlan: string,
  newPriceId: string,
) {
  // Déterminer si c'est un upgrade ou downgrade
  const planOrder = { decouverte: 1, starter: 2, power: 3 };
  const isUpgrade = planOrder[newPlan as keyof typeof planOrder] >
                    planOrder[currentPlan as keyof typeof planOrder];

  if (isUpgrade) {
    return await handleUpgrade(stripeSubscriptionId, newPriceId, newPlan);
  } else {
    return await handleDowngradeScheduled(stripeSubscriptionId, newPriceId, newPlan);
  }
}

// ─────────────────────────────────────────────────────────────────────
// UPGRADE — Plein tarif immédiat avec support 3DS inline
// ─────────────────────────────────────────────────────────────────────

async function handleUpgrade(
  stripeSubscriptionId: string,
  newPriceId: string,
  newPlan: string,
) {
  try {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // Mise à jour : reset cycle + force génération facture immédiate
    // payment_behavior: 'default_incomplete' permet à Stripe de retourner
    // un PaymentIntent en status 'requires_action' si 3DS est requis
    const updated = await stripe.subscriptions.update(stripeSubscriptionId, {
      items: [{
        id: sub.items.data[0].id,
        price: newPriceId,
        tax_rates: [TVA_TAX_RATE_ID],
      }],
      proration_behavior: 'none',           // Pas de prorata, plein tarif
      billing_cycle_anchor: 'now',           // Reset cycle à aujourd'hui
      payment_behavior: 'default_incomplete', // Permet 3DS inline
      expand: ['latest_invoice.payment_intent'],
    });

    // Récupérer le PaymentIntent de la facture générée
    const latestInvoice = updated.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;

    // Cas 1 : pas de PaymentIntent (pas de paiement requis, montant 0 ou crédit suffisant)
    if (!paymentIntent) {
      console.log(`[upgrade] Plan changé sans paiement requis: ${newPlan}`);
      return jsonResponse({
        success: true,
        upgraded: true,
        message: `Plan changé en ${PLAN_LABEL[newPlan as keyof typeof PLAN_LABEL]}.`,
      });
    }

    // Cas 2 : 3DS requis → frontend doit appeler Stripe.confirmCardPayment
    if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_confirmation') {
      console.log(`[upgrade] 3DS requis pour sub ${stripeSubscriptionId}`);
      return jsonResponse({
        requires_action: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        message: 'Validation 3D Secure requise',
      });
    }

    // Cas 3 : paiement en cours mais pas finalisé (rare)
    if (paymentIntent.status === 'requires_payment_method') {
      return jsonResponse({
        error: 'Votre carte bancaire a été refusée. Veuillez la mettre à jour via le bouton "Modifier mon moyen de paiement".',
      }, 402);
    }

    // Cas 4 : paiement réussi direct (pas de 3DS, paiement instantané)
    if (paymentIntent.status === 'succeeded') {
      console.log(`[upgrade] Paiement direct réussi pour sub ${stripeSubscriptionId}, plan ${newPlan}`);
      return jsonResponse({
        success: true,
        upgraded: true,
        message: `Plan changé en ${PLAN_LABEL[newPlan as keyof typeof PLAN_LABEL]}. Vos crédits sont disponibles.`,
      });
    }

    // Cas 5 : statut inattendu
    console.error(`[upgrade] Status PaymentIntent inattendu: ${paymentIntent.status}`);
    return jsonResponse({
      error: 'Le paiement est en cours de traitement. Veuillez patienter quelques instants puis rafraîchir la page.',
    }, 202);

  } catch (stripeErr: any) {
    console.error('[upgrade] Stripe error:', stripeErr);

    const code = stripeErr?.code || stripeErr?.raw?.code || '';
    let userMessage = 'Le changement de plan n\'a pas pu être effectué. Veuillez vérifier votre moyen de paiement ou nous contacter via la page Support.';

    if (code === 'card_declined' || code === 'insufficient_funds') {
      userMessage = 'Votre carte bancaire a été refusée. Veuillez mettre à jour votre moyen de paiement via le bouton dédié.';
    } else if (code === 'expired_card') {
      userMessage = 'Votre carte bancaire a expiré. Veuillez mettre à jour votre moyen de paiement.';
    } else if (code === 'authentication_required') {
      userMessage = 'Votre banque demande une validation supplémentaire. Veuillez réessayer.';
    } else if (code === 'processing_error') {
      userMessage = 'Une erreur est survenue lors du traitement du paiement. Veuillez réessayer dans quelques minutes.';
    }

    return jsonResponse({ error: userMessage }, 402);
  }
}

// ─────────────────────────────────────────────────────────────────────
// DOWNGRADE — Différé en fin de cycle via Subscription Schedule
// ─────────────────────────────────────────────────────────────────────

async function handleDowngradeScheduled(
  stripeSubscriptionId: string,
  newPriceId: string,
  newPlan: string,
) {
  try {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    // On crée un schedule pour appliquer le downgrade en fin de cycle
    // Phase 1 : plan actuel jusqu'à fin de cycle (current_period_end)
    // Phase 2 : nouveau plan à partir de fin de cycle, en cycle infini

    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: stripeSubscriptionId,
    });

    // Mettre à jour le schedule avec les phases
    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: 'release',
      phases: [
        // Phase 1 : plan actuel jusqu'à fin de cycle
        {
          items: [{
            price: sub.items.data[0].price.id,
            quantity: 1,
            tax_rates: [TVA_TAX_RATE_ID],
          }],
          start_date: sub.current_period_start,
          end_date: sub.current_period_end,
          proration_behavior: 'none',
        },
        // Phase 2 : nouveau plan
        {
          items: [{
            price: newPriceId,
            quantity: 1,
            tax_rates: [TVA_TAX_RATE_ID],
          }],
          proration_behavior: 'none',
        },
      ],
      metadata: {
        scheduled_downgrade: 'true',
        scheduled_to_plan: newPlan,
      },
    });

    const switchDate = new Date(sub.current_period_end * 1000).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    console.log(`[downgrade] Schedule créé pour sub ${stripeSubscriptionId}, switch le ${switchDate} vers ${newPlan}`);

    return jsonResponse({
      success: true,
      scheduled: true,
      switch_date: switchDate,
      switch_date_iso: new Date(sub.current_period_end * 1000).toISOString(),
      new_plan: newPlan,
      message: `Votre passage en ${PLAN_LABEL[newPlan as keyof typeof PLAN_LABEL]} sera effectif le ${switchDate}. D'ici là, vous gardez votre plan actuel et vos crédits.`,
    });

  } catch (stripeErr: any) {
    console.error('[downgrade] Stripe error:', stripeErr);
    return jsonResponse({
      error: 'Le changement de plan n\'a pas pu être programmé. Veuillez nous contacter via la page Support.',
    }, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────
// MODE "preview_upgrade" — Récap avant validation pour le popup
// ─────────────────────────────────────────────────────────────────────

async function handlePreviewUpgrade(userId: string, body: any) {
  const { plan } = body;

  if (!plan || !['decouverte', 'starter', 'power'].includes(plan)) {
    return jsonResponse({ error: 'Invalid plan' }, 400);
  }

  // Récupérer l'abo actif
  const { data: existingSub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('id, plan, stripe_subscription_id, current_period_end, credits_complete_total, credits_complete_used, credits_simple_total, credits_simple_used')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!existingSub) {
    return jsonResponse({ error: 'Aucun abonnement actif trouvé' }, 404);
  }

  const planOrder = { decouverte: 1, starter: 2, power: 3 };
  const isUpgrade = planOrder[plan as keyof typeof planOrder] >
                    planOrder[existingSub.plan as keyof typeof planOrder];

  // Crédits actuels (restant)
  const currentRemainingComplete = Math.max(0, (existingSub.credits_complete_total || 0) - (existingSub.credits_complete_used || 0));
  const currentRemainingSimple = Math.max(0, (existingSub.credits_simple_total || 0) - (existingSub.credits_simple_used || 0));

  // Quotas du nouveau plan
  const newQuotas = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS];

  // Crédits après bascule (cumul, sauf downgrade qui garde aussi cumul jusqu'au prochain renouvellement)
  const newComplete = currentRemainingComplete + newQuotas.complete;
  const newSimple = currentRemainingSimple + newQuotas.simple;

  // Calcul prix
  const amountHt = PLAN_HT_PRICE[plan as keyof typeof PLAN_HT_PRICE]; // en centimes
  const amountTva = Math.round(amountHt * TVA_RATE);
  const amountTtc = amountHt + amountTva;

  // Date prochain prélèvement
  let nextBillingDate: string;
  let nextBillingDateIso: string;

  if (isUpgrade) {
    // Upgrade : cycle reset à aujourd'hui, prochain prélèvement dans 1 mois
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextBillingDate = nextDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    nextBillingDateIso = nextDate.toISOString();
  } else {
    // Downgrade : bascule en fin de cycle actuel, prochain prélèvement = fin du cycle actuel
    const cycleEnd = new Date(existingSub.current_period_end);
    nextBillingDate = cycleEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    nextBillingDateIso = cycleEnd.toISOString();
  }

  return jsonResponse({
    is_upgrade: isUpgrade,
    is_downgrade: !isUpgrade,
    current_plan: existingSub.plan,
    current_plan_label: PLAN_LABEL[existingSub.plan as keyof typeof PLAN_LABEL],
    new_plan: plan,
    new_plan_label: PLAN_LABEL[plan as keyof typeof PLAN_LABEL],
    amount_ht: amountHt,        // en centimes
    amount_tva: amountTva,
    amount_ttc: amountTtc,
    amount_ht_str: formatEur(amountHt),
    amount_tva_str: formatEur(amountTva),
    amount_ttc_str: formatEur(amountTtc),
    next_billing_date: nextBillingDate,
    next_billing_date_iso: nextBillingDateIso,
    current_credits: {
      complete: currentRemainingComplete,
      simple: currentRemainingSimple,
    },
    new_credits: {
      complete: newComplete,
      simple: newSimple,
    },
    immediate_payment: isUpgrade,  // L'upgrade fait un paiement immédiat, pas le downgrade
  });
}

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + '€';
}

// ─────────────────────────────────────────────────────────────────────
// MODE "buy_unit" — Acheter à l'unité (réservé aux abonnés)
// ─────────────────────────────────────────────────────────────────────

async function handleBuyUnit(userId: string, body: any) {
  const { unit_type, quantity = 1 } = body;

  if (!unit_type || !['complete', 'document'].includes(unit_type)) {
    return jsonResponse({ error: 'Invalid unit_type (expected "complete" or "document")' }, 400);
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    return jsonResponse({ error: 'Quantity must be between 1 and 50' }, 400);
  }

  // SÉCURITÉ : vérifier que le user a un abonnement actif
  const { data: sub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('id, plan, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!sub) {
    return jsonResponse({
      error: 'subscription_required',
      message: 'Les tarifs unitaires sont réservés aux abonnés Verimo Pro. Choisissez un abonnement pour en bénéficier.',
    }, 403);
  }

  const priceId = UNIT_TO_PRICE[unit_type as keyof typeof UNIT_TO_PRICE];
  const customerId = await getOrCreateStripeCustomer(userId);

  // Créer la session Checkout en mode payment (one-shot)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [{ price: priceId, quantity, tax_rates: [TVA_TAX_RATE_ID] }],
    success_url: SUCCESS_URL_UNIT,
    cancel_url: CANCEL_URL,
    metadata: {
      user_id: userId,
      purchase_type: 'unit',
      unit_type,
      quantity: String(quantity),
    },
    payment_intent_data: {
      metadata: {
        user_id: userId,
        unit_type,
        quantity: String(quantity),
      },
    },
    automatic_tax: { enabled: false },
    locale: 'fr',
    invoice_creation: { enabled: true },
  });

  return jsonResponse({ url: session.url });
}

// ─────────────────────────────────────────────────────────────────────
// MODE "billing_portal" — Ouvrir le portail Stripe pour modifier la carte
// ─────────────────────────────────────────────────────────────────────

async function handleBillingPortal(userId: string) {
  const customerId = await getOrCreateStripeCustomer(userId);

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${SITE_URL}/dashboard/abonnement`,
  });

  return jsonResponse({ url: portalSession.url });
}

// ─────────────────────────────────────────────────────────────────────
// MODE "cancel" — Annuler l'abonnement à la fin de la période
// + Annule le schedule downgrade éventuellement programmé
// ─────────────────────────────────────────────────────────────────────

async function handleCancel(userId: string, body: any) {
  const { reason } = body;

  // Récupérer l'abo actif
  const { data: existingSub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('id, stripe_subscription_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!existingSub?.stripe_subscription_id) {
    return jsonResponse({ error: 'Aucun abonnement actif à résilier.' }, 400);
  }

  try {
    // 1. Récupérer la sub pour voir si elle a un schedule (downgrade prévu)
    const sub = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id);

    // 2. Si un schedule de downgrade existe, l'annuler
    //    (la résiliation prime sur le downgrade prévu)
    if (sub.schedule) {
      const scheduleId = typeof sub.schedule === 'string' ? sub.schedule : sub.schedule.id;
      try {
        await stripe.subscriptionSchedules.release(scheduleId);
        console.log(`[cancel] Schedule downgrade annulé pour sub ${existingSub.stripe_subscription_id}`);
      } catch (releaseErr) {
        console.warn('[cancel] Impossible de release le schedule:', releaseErr);
      }
    }

    // 3. Annuler à la fin de la période sur Stripe
    await stripe.subscriptions.update(existingSub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  } catch (stripeErr: any) {
    console.error('[pro-checkout-create] Cancel error:', stripeErr);
    return jsonResponse({ error: 'La résiliation n\'a pas pu être effectuée. Veuillez nous contacter via la page Support.' }, 500);
  }

  // Sauvegarder immédiatement en BDD (sans attendre le webhook)
  const updateFields: Record<string, unknown> = {
    cancel_at_period_end: true,
    updated_at: new Date().toISOString(),
  };
  if (reason) updateFields.cancellation_reason = reason;

  await supabaseAdmin
    .from('pro_subscriptions')
    .update(updateFields)
    .eq('id', existingSub.id);

  console.log(`[pro-checkout-create] Subscription ${existingSub.stripe_subscription_id} scheduled for cancellation. Reason: ${reason || 'none'}`);

  return jsonResponse({ success: true, message: 'Abonnement résilié avec succès.' });
}

// ─────────────────────────────────────────────────────────────────────
// MODE "reactivate" — Annuler la résiliation
// ─────────────────────────────────────────────────────────────────────

async function handleReactivate(userId: string) {
  const { data: existingSub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('id, stripe_subscription_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (!existingSub?.stripe_subscription_id) {
    return jsonResponse({ error: 'Aucun abonnement à réactiver.' }, 400);
  }

  try {
    await stripe.subscriptions.update(existingSub.stripe_subscription_id, {
      cancel_at_period_end: false,
    });
  } catch (stripeErr: any) {
    console.error('[pro-checkout-create] Reactivate error:', stripeErr);
    return jsonResponse({ error: 'La réactivation n\'a pas pu être effectuée. Veuillez nous contacter via la page Support.' }, 500);
  }

  // Mettre à jour en BDD immédiatement
  await supabaseAdmin
    .from('pro_subscriptions')
    .update({
      cancel_at_period_end: false,
      cancellation_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingSub.id);

  console.log(`[pro-checkout-create] Subscription ${existingSub.stripe_subscription_id} reactivated`);

  return jsonResponse({ success: true, message: 'Abonnement réactivé avec succès.' });
}

// ─────────────────────────────────────────────────────────────────────
// MODE "list_invoices" — Lister les factures Stripe du client
// ─────────────────────────────────────────────────────────────────────

async function handleListInvoices(userId: string) {
  // Trouver le customer Stripe
  const { data: existingSub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!existingSub?.stripe_customer_id) {
    // Pas de customer Stripe → retourner aussi les credit_grants comme "factures" gratuites
    return jsonResponse({ invoices: await getGrantInvoices(userId) });
  }

  const customerId = existingSub.stripe_customer_id;

  // Récupérer les factures Stripe
  const stripeInvoices = await stripe.invoices.list({
    customer: customerId,
    limit: 50,
    status: 'paid',
  });

  const fmtDate = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const fmtAmount = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',') + '€';
  };

  // Mapping Price ID → description française (PRODUCTION)
  const PRICE_TO_DESCRIPTION: Record<string, string> = {
    'price_1TTtd1BesXB76oWEZuILxjwe': 'Abonnement Découverte — 19,90€ HT/mois',
    'price_1TTtczBesXB76oWEcKaNR2BW': 'Abonnement Starter — 49,90€ HT/mois',
    'price_1TTtcxBesXB76oWEPyVYZjCj': 'Abonnement Power — 89,90€ HT/mois',
    'price_1TTtcyBesXB76oWEBF1TLHYz': 'Analyse complète (unitaire)',
    'price_1TTtd2BesXB76oWEVM0p27GS': 'Analyse simple (unitaire)',
  };

  const invoiceItems = stripeInvoices.data.map((inv) => {
    const isSubscription = !!inv.subscription;
    const lines = inv.lines?.data || [];
    const firstLine = lines[0];
    const priceId = firstLine?.price?.id || '';

    // Utiliser notre description française si disponible, sinon fallback
    const description = PRICE_TO_DESCRIPTION[priceId]
      || (isSubscription ? 'Abonnement Verimo Pro' : 'Achat unitaire');

    return {
      id: inv.id,
      date: fmtDate(inv.created),
      description,
      amount: fmtAmount(inv.amount_paid || 0),
      amount_ht: fmtAmount(inv.subtotal || 0),
      amount_tva: fmtAmount(inv.tax || 0),
      pdf_url: inv.invoice_pdf || null,
      type: isSubscription ? 'subscription' as const : 'unit' as const,
      _ts: inv.created,
    };
  });

  // Ajouter les credit_grants (offerts / code promo) sans PDF
  const grantItems = await getGrantInvoices(userId);

  // Fusionner et trier par date desc
  const allSorted = [...invoiceItems, ...grantItems].sort((a, b) => (b._ts || 0) - (a._ts || 0));

  return jsonResponse({ invoices: allSorted });
}

async function getGrantInvoices(userId: string) {
  const { data: grants } = await supabaseAdmin
    .from('credit_grants')
    .select('id, credit_type, quantity, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  return (grants || []).map((g: any) => {
    const isPromo = (g.reason || '').includes('Code promo');
    return {
      id: `grant-${g.id}`,
      date: new Date(g.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      description: `+${g.quantity} crédit${g.quantity > 1 ? 's' : ''} ${g.credit_type === 'complete' ? 'Complète' : 'Simple'}${g.reason ? ` — ${g.reason}` : ''}`,
      amount: '0,00€',
      amount_ht: '0,00€',
      amount_tva: '0,00€',
      pdf_url: null,
      type: isPromo ? 'promo' as const : 'grant' as const,
      _ts: Math.floor(new Date(g.created_at).getTime() / 1000),
    };
  });
}

// ═════════════════════════════════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════════════════════════════════

async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const { data: existingSub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (existingSub?.stripe_customer_id) {
    return existingSub.stripe_customer_id;
  }

  const { data: existingPurchase } = await supabaseAdmin
    .from('pro_unit_purchases')
    .select('stripe_session_id')
    .eq('user_id', userId)
    .not('stripe_session_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (existingPurchase?.stripe_session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(existingPurchase.stripe_session_id);
      if (session.customer) {
        return session.customer as string;
      }
    } catch {
      // Session expirée ou introuvable, on crée un nouveau customer
    }
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, pro_company_name, telephone, pro_contact_email')
    .eq('id', userId)
    .maybeSingle();

  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);

  const customer = await stripe.customers.create({
    email: user?.email,
    name: profile?.pro_company_name || profile?.full_name || undefined,
    phone: profile?.telephone || undefined,
    metadata: {
      user_id: userId,
    },
  });

  return customer.id;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
    },
  });
}
