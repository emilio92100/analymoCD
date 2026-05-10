// ══════════════════════════════════════════════════════════════════════
// VERIMO — Edge Function : pro-checkout-create V3
//
// V3 : ajout adresse postale + SIRET sur le customer Stripe
//      → factures conformes B2B (SIRET, adresse, raison sociale)
//
// Crée une session Stripe Checkout pour les pros.
// Appelée par le frontend depuis le dashboard pro (MonAbonnement).
//
// Modes supportés :
// 1. "subscribe" — S'abonner à un plan (Découverte / Starter / Power)
// 2. "preview_upgrade" — Récap d'upgrade avant validation (pour popup)
// 3. "buy_unit" — Acheter une analyse à l'unité (réservé aux abonnés)
// 4. "cancel" — Annuler l'abonnement
// 5. "reactivate" — Annuler la résiliation
// 6. "billing_portal" — Ouvrir le portail Stripe (modifier carte)
// 7. "list_invoices" — Lister les factures Stripe du client
//
// Sécurité :
// - JWT vérifié (le pro doit être connecté)
// - "buy_unit" refusé si pas d'abonnement pro actif (HTTP 403)
//
// Variables d'environnement requises :
// - STRIPE_SECRET_KEY
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - SUPABASE_ANON_KEY
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
  decouverte: 1990,
  starter: 4990,
  power: 8990,
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

// TVA France 20%
const TVA_TAX_RATE_ID = 'txr_1TUAxVBesXB76oWESXBnGdIZ';
const TVA_RATE = 0.20;

// URL de redirection
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://www.verimo.fr';
const SUCCESS_URL_SUBSCRIBE = `${SITE_URL}/dashboard/abonnement?checkout=success&type=subscribe`;
const SUCCESS_URL_UPGRADE = `${SITE_URL}/dashboard/abonnement?checkout=success&type=upgrade`;
const SUCCESS_URL_UNIT = `${SITE_URL}/dashboard/abonnement?checkout=success&type=unit`;
const CANCEL_URL = `${SITE_URL}/dashboard/abonnement?checkout=cancel`;

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═════════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);

    if (authErr || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

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
      const targetUserId = body.target_user_id || null;
      if (targetUserId && targetUserId !== user.id) {
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

async function handleSubscribe(userId: string, body: any) {
  const { plan } = body;

  if (!plan || !['decouverte', 'starter', 'power'].includes(plan)) {
    return jsonResponse({ error: 'Invalid plan' }, 400);
  }

  const priceId = PLAN_TO_PRICE[plan as keyof typeof PLAN_TO_PRICE];

  // Récupérer ou créer le customer Stripe (avec adresse + SIRET en V3)
  const customerId = await getOrCreateStripeCustomer(userId);

  // Vérifier s'il y a déjà un abo actif → upgrade
  const { data: existingSub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('stripe_subscription_id, plan')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingSub?.stripe_subscription_id) {
    if (existingSub.plan === plan) {
      return jsonResponse({ error: 'Vous êtes déjà sur ce plan' }, 400);
    }

    return await handleUpgradeOrDowngrade(
      userId,
      existingSub.stripe_subscription_id,
      existingSub.plan,
      plan,
      priceId,
    );
  }

  // Pas d'abo actif → création via Checkout
  // Note : on ne peut PAS passer custom_fields ici dans subscription_data.invoice_settings
  // (Stripe rejette ce paramètre au moment du Checkout). On les ajoute via le webhook
  // customer.subscription.created après coup, sur la subscription elle-même.
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

async function handleUpgradeOrDowngrade(
  userId: string,
  stripeSubscriptionId: string,
  currentPlan: string,
  newPlan: string,
  newPriceId: string,
) {
  const planOrder = { decouverte: 1, starter: 2, power: 3 };
  const isUpgrade = planOrder[newPlan as keyof typeof planOrder] >
                    planOrder[currentPlan as keyof typeof planOrder];

  if (isUpgrade) {
    return await handleUpgrade(userId, stripeSubscriptionId, newPriceId, newPlan);
  } else {
    return await handleDowngradeScheduled(stripeSubscriptionId, newPriceId, newPlan);
  }
}

async function handleUpgrade(
  userId: string,
  stripeSubscriptionId: string,
  newPriceId: string,
  newPlan: string,
) {
  try {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [{
        id: sub.items.data[0].id,
        price: newPriceId,
        tax_rates: [TVA_TAX_RATE_ID],
      }],
      proration_behavior: 'none',
      billing_cycle_anchor: 'now',
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    };

    // Note : Stripe rejette invoice_settings.custom_fields sur subscriptions.update()
    // Le SIRET sera posé sur la subscription via le webhook customer.subscription.updated
    // (helper applySiretCustomFieldToSubscription) après le succès du paiement.

    const updated = await stripe.subscriptions.update(stripeSubscriptionId, updateParams);

    const latestInvoice = updated.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent | null;

    if (!paymentIntent) {
      console.log(`[upgrade] Plan changé sans paiement requis: ${newPlan}`);
      return jsonResponse({
        success: true,
        upgraded: true,
        message: `Plan changé en ${PLAN_LABEL[newPlan as keyof typeof PLAN_LABEL]}.`,
      });
    }

    if (paymentIntent.status === 'requires_action' || paymentIntent.status === 'requires_confirmation') {
      console.log(`[upgrade] 3DS requis pour sub ${stripeSubscriptionId}`);
      return jsonResponse({
        requires_action: true,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        message: 'Validation 3D Secure requise',
      });
    }

    if (paymentIntent.status === 'requires_payment_method') {
      return jsonResponse({
        error: 'Votre carte bancaire a été refusée. Veuillez la mettre à jour via le bouton "Modifier mon moyen de paiement".',
      }, 402);
    }

    if (paymentIntent.status === 'succeeded') {
      console.log(`[upgrade] Paiement direct réussi pour sub ${stripeSubscriptionId}, plan ${newPlan}`);
      return jsonResponse({
        success: true,
        upgraded: true,
        message: `Plan changé en ${PLAN_LABEL[newPlan as keyof typeof PLAN_LABEL]}. Vos crédits sont disponibles.`,
      });
    }

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

async function handleDowngradeScheduled(
  stripeSubscriptionId: string,
  newPriceId: string,
  newPlan: string,
) {
  try {
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: stripeSubscriptionId,
    });

    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: 'release',
      phases: [
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

async function handlePreviewUpgrade(userId: string, body: any) {
  const { plan } = body;

  if (!plan || !['decouverte', 'starter', 'power'].includes(plan)) {
    return jsonResponse({ error: 'Invalid plan' }, 400);
  }

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

  const currentRemainingComplete = Math.max(0, (existingSub.credits_complete_total || 0) - (existingSub.credits_complete_used || 0));
  const currentRemainingSimple = Math.max(0, (existingSub.credits_simple_total || 0) - (existingSub.credits_simple_used || 0));

  const newQuotas = PLAN_QUOTAS[plan as keyof typeof PLAN_QUOTAS];

  const newComplete = currentRemainingComplete + newQuotas.complete;
  const newSimple = currentRemainingSimple + newQuotas.simple;

  const amountHt = PLAN_HT_PRICE[plan as keyof typeof PLAN_HT_PRICE];
  const amountTva = Math.round(amountHt * TVA_RATE);
  const amountTtc = amountHt + amountTva;

  let nextBillingDate: string;
  let nextBillingDateIso: string;

  if (isUpgrade) {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextBillingDate = nextDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    nextBillingDateIso = nextDate.toISOString();
  } else {
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
    amount_ht: amountHt,
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
    immediate_payment: isUpgrade,
  });
}

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + '€';
}

async function handleBuyUnit(userId: string, body: any) {
  const { unit_type, quantity = 1 } = body;

  if (!unit_type || !['complete', 'document'].includes(unit_type)) {
    return jsonResponse({ error: 'Invalid unit_type (expected "complete" or "document")' }, 400);
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    return jsonResponse({ error: 'Quantity must be between 1 and 50' }, 400);
  }

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

async function handleBillingPortal(userId: string) {
  const customerId = await getOrCreateStripeCustomer(userId);

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${SITE_URL}/dashboard/abonnement`,
  });

  return jsonResponse({ url: portalSession.url });
}

async function handleCancel(userId: string, body: any) {
  const { reason } = body;

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
    const sub = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id);

    if (sub.schedule) {
      const scheduleId = typeof sub.schedule === 'string' ? sub.schedule : sub.schedule.id;
      try {
        await stripe.subscriptionSchedules.release(scheduleId);
        console.log(`[cancel] Schedule downgrade annulé pour sub ${existingSub.stripe_subscription_id}`);
      } catch (releaseErr) {
        console.warn('[cancel] Impossible de release le schedule:', releaseErr);
      }
    }

    await stripe.subscriptions.update(existingSub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });
  } catch (stripeErr: any) {
    console.error('[pro-checkout-create] Cancel error:', stripeErr);
    return jsonResponse({ error: 'La résiliation n\'a pas pu être effectuée. Veuillez nous contacter via la page Support.' }, 500);
  }

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

async function handleListInvoices(userId: string) {
  const { data: existingSub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!existingSub?.stripe_customer_id) {
    return jsonResponse({ invoices: await getGrantInvoices(userId) });
  }

  const customerId = existingSub.stripe_customer_id;

  // On récupère TOUTES les factures (pas que paid) pour pouvoir afficher les échecs aussi.
  // Stripe statuses possibles : draft, open, paid, uncollectible, void
  const stripeInvoices = await stripe.invoices.list({
    customer: customerId,
    limit: 50,
    expand: ['data.payment_intent'], // pour récupérer last_payment_error
  });

  const fmtDate = (ts: number) => {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const fmtAmount = (cents: number) => {
    return (cents / 100).toFixed(2).replace('.', ',') + '€';
  };

  const PRICE_TO_DESCRIPTION: Record<string, string> = {
    'price_1TTtd1BesXB76oWEZuILxjwe': 'Abonnement Découverte — 19,90€ HT/mois',
    'price_1TTtczBesXB76oWEcKaNR2BW': 'Abonnement Starter — 49,90€ HT/mois',
    'price_1TTtcxBesXB76oWEPyVYZjCj': 'Abonnement Power — 89,90€ HT/mois',
    'price_1TTtcyBesXB76oWEBF1TLHYz': 'Analyse complète (unitaire)',
    'price_1TTtd2BesXB76oWEVM0p27GS': 'Analyse simple (unitaire)',
  };

  // Mapping codes Stripe → message FR clair pour motif d'échec
  const FAIL_CODE_TO_FR: Record<string, string> = {
    card_declined: 'Carte refusée',
    insufficient_funds: 'Fonds insuffisants',
    expired_card: 'Carte expirée',
    incorrect_cvc: 'CVC incorrect',
    processing_error: 'Erreur de traitement',
    authentication_required: 'Authentification 3DS requise',
    do_not_honor: 'Refus banque',
    generic_decline: 'Refus banque (motif générique)',
    lost_card: 'Carte déclarée perdue',
    stolen_card: 'Carte déclarée volée',
    incorrect_number: 'Numéro de carte invalide',
    invalid_expiry_month: 'Mois d\'expiration invalide',
    invalid_expiry_year: 'Année d\'expiration invalide',
    fraudulent: 'Suspicion de fraude',
  };

  const invoiceItems = stripeInvoices.data
    // On ne garde pas les drafts (factures non finalisées) — pas pertinent pour l'historique
    .filter((inv) => inv.status !== 'draft')
    .map((inv) => {
      const isSubscription = !!inv.subscription;
      const lines = inv.lines?.data || [];
      const firstLine = lines[0];
      const priceId = firstLine?.price?.id || '';

      const description = PRICE_TO_DESCRIPTION[priceId]
        || (isSubscription ? 'Abonnement Verimo Pro' : 'Achat unitaire');

      // Mapping statut Stripe → statut FR + variante UI
      // - paid : facture payée ✅
      // - open : facture émise, en attente de paiement (peut être past_due si retries en cours)
      // - uncollectible : marquée irrécouvrable (après échecs définitifs)
      // - void : annulée
      const stripeStatus = inv.status || 'unknown';
      let statusLabel = '';
      let statusVariant: 'success' | 'pending' | 'failed' | 'void' = 'success';

      if (stripeStatus === 'paid') {
        statusLabel = 'Réussi';
        statusVariant = 'success';
      } else if (stripeStatus === 'open') {
        // Si la facture a déjà été tentée au moins 1 fois → échec
        if ((inv.attempt_count || 0) > 0) {
          statusLabel = `Échec (${inv.attempt_count} tentative${(inv.attempt_count || 0) > 1 ? 's' : ''})`;
          statusVariant = 'failed';
        } else {
          statusLabel = 'En attente';
          statusVariant = 'pending';
        }
      } else if (stripeStatus === 'uncollectible') {
        statusLabel = 'Irrécouvrable';
        statusVariant = 'failed';
      } else if (stripeStatus === 'void') {
        statusLabel = 'Annulée';
        statusVariant = 'void';
      } else {
        statusLabel = stripeStatus;
        statusVariant = 'pending';
      }

      // Récupération du motif d'échec si applicable
      let failureReason: string | null = null;
      const paymentIntent = inv.payment_intent as Stripe.PaymentIntent | null;
      if (paymentIntent && typeof paymentIntent === 'object' && paymentIntent.last_payment_error) {
        const errCode = paymentIntent.last_payment_error.decline_code
          || paymentIntent.last_payment_error.code
          || '';
        failureReason = FAIL_CODE_TO_FR[errCode]
          || paymentIntent.last_payment_error.message
          || 'Échec de paiement';
      }

      // Montant à afficher : amount_paid si payé, sinon amount_due
      const displayAmount = inv.status === 'paid' ? (inv.amount_paid || 0) : (inv.amount_due || 0);

      return {
        id: inv.id,
        date: fmtDate(inv.created),
        description,
        amount: fmtAmount(displayAmount),
        amount_ht: fmtAmount(inv.subtotal || 0),
        amount_tva: fmtAmount(inv.tax || 0),
        pdf_url: inv.invoice_pdf || null,
        type: isSubscription ? 'subscription' as const : 'unit' as const,
        status: stripeStatus,
        status_label: statusLabel,
        status_variant: statusVariant,
        failure_reason: failureReason,
        attempt_count: inv.attempt_count || 0,
        _ts: inv.created,
      };
    });

  const grantItems = await getGrantInvoices(userId);

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

// Récupère le SIRET du pro et le formate comme custom_field Stripe
// pour qu'il apparaisse en en-tête de la facture PDF générée par Stripe.
// Stripe ne supporte pas le SIRET comme Tax ID officiel, donc on l'affiche via custom_fields.
async function getInvoiceCustomFields(userId: string): Promise<Array<{ name: string; value: string }> | undefined> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('pro_siret')
    .eq('id', userId)
    .maybeSingle();

  if (!profile?.pro_siret) return undefined;

  const cleanSiret = profile.pro_siret.replace(/\s/g, '');
  if (!cleanSiret) return undefined;

  return [{ name: 'SIRET', value: cleanSiret }];
}

// V3 : Création/MAJ du customer Stripe avec adresse + SIRET
//      Si le customer existe déjà, on update ses infos pour que les
//      futures factures soient à jour (utile si le pro modifie son adresse)
async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  // 1. Charger le profil pour avoir toutes les infos de facturation
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, pro_company_name, telephone, pro_contact_email, pro_company_address, pro_postal_code, pro_ville, pro_siret')
    .eq('id', userId)
    .maybeSingle();

  const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);

  // Construire les paramètres customer (nom, email, adresse)
  const customerName = profile?.pro_company_name || profile?.full_name || undefined;
  const customerAddress: Stripe.AddressParam | undefined =
    (profile?.pro_company_address || profile?.pro_postal_code || profile?.pro_ville)
      ? {
          line1: profile?.pro_company_address || undefined,
          postal_code: profile?.pro_postal_code || undefined,
          city: profile?.pro_ville || undefined,
          country: 'FR',
        }
      : undefined;

  // 2. Chercher un customer existant
  const { data: existingSub } = await supabaseAdmin
    .from('pro_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle();

  let customerId: string | null = existingSub?.stripe_customer_id || null;

  if (!customerId) {
    // Chercher dans pro_unit_purchases si pas trouvé
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
          customerId = session.customer as string;
        }
      } catch {
        // Session expirée ou introuvable
      }
    }
  }

  // 3a. Customer existe → on met à jour ses infos (cas pro qui change d'adresse)
  if (customerId) {
    try {
      await stripe.customers.update(customerId, {
        email: user?.email,
        name: customerName,
        phone: profile?.telephone || undefined,
        address: customerAddress,
        metadata: {
          user_id: userId,
          siret: profile?.pro_siret ? profile.pro_siret.replace(/\s/g, '') : '',
        },
      });
    } catch (err) {
      console.warn('[customer] Update failed (non-critique):', err);
    }
    return customerId;
  }

  // 3b. Pas de customer → on en crée un nouveau avec toutes les infos
  // Note : le SIRET est stocké en metadata (pas en tax_id_data, car Stripe ne supporte
  // pas le SIRET comme type de Tax ID officiel — seulement TVA intracom, EU VAT, etc.).
  // Le SIRET sera affiché sur la facture via custom_fields au moment du checkout.
  const customerParams: Stripe.CustomerCreateParams = {
    email: user?.email,
    name: customerName,
    phone: profile?.telephone || undefined,
    address: customerAddress,
    metadata: {
      user_id: userId,
      siret: profile?.pro_siret ? profile.pro_siret.replace(/\s/g, '') : '',
    },
  };

  const customer = await stripe.customers.create(customerParams);
  return customer.id;
}

// Sync SIRET sur un customer existant (ajoute le tax_id si pas déjà présent)
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
    },
  });
}
