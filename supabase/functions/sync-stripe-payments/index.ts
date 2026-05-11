// ══════════════════════════════════════════════════════════════════════
// VERIMO — Edge Function : sync-stripe-payments V2
//
// FILET DE SÉCURITÉ qui rattrape les paiements manqués par les webhooks
// et qui synchronise les statuts (remboursements, annulations).
//
// V2 (11 mai 2026) :
//   - Récupération des charges (expand) pour vrais montants remboursés
//   - Identification du plan d'abonnement via price_id
//   - Identification du type d'achat unitaire (pro & particulier) via price_id
//   - Descriptions exactes (alignées sur celles du webhook officiel)
//   - Correction rétroactive : si une ligne payments a une description générique
//     ("Paiement Pro (sync auto)" ou "Subscription creation"), on la remplace
//     par la vraie description si on a réussi à l'identifier
//
// Tourne en arrière-plan (pg_cron toutes les 5 min) :
//   1. Récupère les payment_intents Stripe des dernières 3 jours (avec charges)
//   2. Pour chacun, vérifie s'il est dans la table `payments`
//   3. Si absent → l'insère avec la bonne description et le bon type
//   4. Si présent : met à jour le statut (refunded) et la description si mal renseignée
//
// Variables d'environnement requises :
// - STRIPE_SECRET_KEY
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// ══════════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// ─────────────────────────────────────────────────────────────────────
// MAPPING Price ID Stripe → infos produit (PRODUCTION)
// (extraits du webhook officiel pour rester en cohérence)
// ─────────────────────────────────────────────────────────────────────

// Plans Pro
const PRICE_TO_PLAN: Record<string, 'decouverte' | 'starter' | 'power'> = {
  'price_1TTtd1BesXB76oWEZuILxjwe': 'decouverte',
  'price_1TTtczBesXB76oWEcKaNR2BW': 'starter',
  'price_1TTtcxBesXB76oWEPyVYZjCj': 'power',
};

// Unitaires Pro
const PRICE_TO_UNIT_PRO: Record<string, { type: 'complete' | 'document' }> = {
  'price_1TTtcyBesXB76oWEBF1TLHYz': { type: 'complete' },
  'price_1TTtd2BesXB76oWEVM0p27GS': { type: 'document' },
};

// Unitaires Particulier
const PRICE_TO_UNIT_PART: Record<string, { label: string }> = {
  'price_1TTtd1BesXB76oWECAGA9ywf': { label: 'Achat unitaire — analyse simple' },
  'price_1TTtd2BesXB76oWEsZ9LsLS9': { label: 'Achat unitaire — analyse complète' },
  'price_1TTtcxBesXB76oWETkokxLgB': { label: 'Pack 2 Biens — 2 crédits complets' },
  'price_1TTtczBesXB76oWEloTMvEZF': { label: 'Pack 3 Biens — 3 crédits complets' },
};

const LOOKBACK_DAYS = 3;

interface SyncStats {
  scanned: number;
  inserted: number;
  updated_status: number;
  updated_description: number;
  skipped: number;
  errors: number;
}

function planLabel(plan: string): string {
  if (plan === 'decouverte') return 'Découverte';
  if (plan === 'starter') return 'Starter';
  if (plan === 'power') return 'Power';
  return plan;
}

serve(async () => {
  const stats: SyncStats = { scanned: 0, inserted: 0, updated_status: 0, updated_description: 0, skipped: 0, errors: 0 };
  const startTime = Date.now();

  try {
    const lookbackTimestamp = Math.floor((Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000) / 1000);

    console.log(`[sync] Démarrage sync des paiements depuis ${new Date(lookbackTimestamp * 1000).toISOString()}`);

    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 20;

    while (hasMore && pageCount < maxPages) {
      pageCount++;

      const params: Stripe.PaymentIntentListParams = {
        limit: 100,
        created: { gte: lookbackTimestamp },
        expand: ['data.latest_charge', 'data.invoice'],
      };
      if (startingAfter) params.starting_after = startingAfter;

      const result = await stripe.paymentIntents.list(params);

      for (const pi of result.data) {
        stats.scanned++;
        try {
          await syncOnePaymentIntent(pi, stats);
        } catch (err) {
          stats.errors++;
          console.error(`[sync] Erreur sur PI ${pi.id}:`, err);
        }
      }

      hasMore = result.has_more;
      if (hasMore && result.data.length > 0) {
        startingAfter = result.data[result.data.length - 1].id;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[sync] Terminé en ${duration}ms — ${JSON.stringify(stats)}`);

    // Alerte info uniquement si quelque chose a vraiment été fait
    if (stats.inserted > 0 || stats.updated_status > 0 || stats.updated_description > 0) {
      await supabase.from('system_alerts').insert({
        type: 'info',
        severity: 'info',
        title: `Sync Stripe — ${stats.inserted} insert / ${stats.updated_status} statut(s) / ${stats.updated_description} desc.`,
        message: `Sync auto a corrigé la table payments. Détail dans metadata.`,
        metadata: { stage: 'sync_stripe_payments', stats, duration_ms: duration },
      });
    }

    return new Response(JSON.stringify({ ok: true, stats, duration_ms: duration }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[sync] Erreur globale:', err);

    await supabase.from('system_alerts').insert({
      type: 'unexpected_error',
      severity: 'critical',
      title: 'Sync Stripe — erreur globale',
      message: 'La sync automatique des paiements Stripe a échoué.',
      metadata: { stage: 'sync_stripe_payments', error: String(err), stats },
    });

    return new Response(JSON.stringify({ ok: false, error: String(err), stats }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// ════════════════════════════════════════════════════════════════════
// Sync un PaymentIntent : insert / update status / fix description
// ════════════════════════════════════════════════════════════════════
async function syncOnePaymentIntent(pi: Stripe.PaymentIntent, stats: SyncStats): Promise<void> {
  // On ne traite que les paiements aboutis
  if (pi.status !== 'succeeded') {
    stats.skipped++;
    return;
  }

  // ─── Calculer le montant remboursé via la charge associée ───
  const charge = pi.latest_charge && typeof pi.latest_charge !== 'string'
    ? pi.latest_charge as Stripe.Charge
    : null;

  const totalRefundedCents = charge?.amount_refunded || 0;
  const amountTotalCents = pi.amount;
  const isFullRefund = totalRefundedCents > 0 && totalRefundedCents >= amountTotalCents;
  const isPartialRefund = totalRefundedCents > 0 && totalRefundedCents < amountTotalCents;
  const stripeStatus = isFullRefund ? 'refunded' : isPartialRefund ? 'partially_refunded' : 'completed';
  const stripeRefunded = totalRefundedCents / 100;

  // ─── Identifier le type de paiement via les line items ───
  const productInfo = await identifyProduct(pi);

  // ─── Chercher si déjà en BDD ───
  const { data: existing, error: findErr } = await supabase
    .from('payments')
    .select('id, status, refunded_amount, description, customer_type')
    .eq('stripe_payment_id', pi.id)
    .maybeSingle();

  if (findErr) {
    console.error(`[sync] Erreur lookup payment ${pi.id}:`, findErr.message);
    stats.errors++;
    return;
  }

  // ────────────────────────────────────────────────────────────────
  // CAS 1 : la ligne existe → on update statut et/ou description si nécessaire
  // ────────────────────────────────────────────────────────────────
  if (existing) {
    const updates: Record<string, unknown> = {};

    // Statut différent ? (refunded / partially_refunded)
    if (existing.status !== stripeStatus) {
      updates.status = stripeStatus;
      updates.refunded_amount = stripeRefunded;
      updates.refunded_at = totalRefundedCents > 0 ? new Date().toISOString() : null;
    } else if ((existing.refunded_amount || 0) !== stripeRefunded) {
      updates.refunded_amount = stripeRefunded;
    }

    // Description générique → on remplace par la vraie si on l'a identifiée
    const isGenericDescription = !existing.description
      || existing.description === 'Subscription creation'
      || existing.description === 'Paiement Pro (sync auto)'
      || existing.description === 'Paiement (sync auto)'
      || existing.description.toLowerCase().includes('sync auto');

    if (productInfo && isGenericDescription && productInfo.description !== existing.description) {
      updates.description = productInfo.description;
    }

    if (Object.keys(updates).length === 0) {
      stats.skipped++;
      return;
    }

    const { error: updateErr } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', existing.id);

    if (updateErr) {
      console.error(`[sync] Update failed pour PI ${pi.id}:`, updateErr.message);
      stats.errors++;
      return;
    }

    if (updates.status) {
      stats.updated_status++;
      console.log(`[sync] Statut mis à jour pour payment ${existing.id} (${existing.status} → ${stripeStatus})`);
    }
    if (updates.description) {
      stats.updated_description++;
      console.log(`[sync] Description corrigée pour payment ${existing.id}: "${updates.description}"`);
    }
    return;
  }

  // ────────────────────────────────────────────────────────────────
  // CAS 2 : la ligne n'existe pas → on l'insère
  // ────────────────────────────────────────────────────────────────

  const customerRef = pi.customer;
  const customerId = typeof customerRef === 'string' ? customerRef : customerRef?.id;

  if (!customerId) {
    console.log(`[sync] PI ${pi.id} sans customer, skip`);
    stats.skipped++;
    return;
  }

  let userId: string | null = null;
  let customerEmail: string | null = null;
  let customerName: string | null = null;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted) {
      const c = customer as Stripe.Customer;
      userId = c.metadata?.user_id || null;
      customerEmail = c.email || null;
      customerName = c.name || null;
    }
  } catch (e) {
    console.warn(`[sync] Impossible de récupérer customer ${customerId}:`, e);
  }

  if (!userId) {
    console.log(`[sync] PI ${pi.id} sans user_id en metadata customer, skip`);
    stats.skipped++;
    return;
  }

  const customerType = productInfo?.customerType || 'particulier';
  const description = productInfo?.description || (customerType === 'pro' ? 'Paiement Pro' : 'Paiement');
  const amountTtc = pi.amount / 100;
  const amountHt = customerType === 'pro'
    ? Math.round((amountTtc / 1.20) * 100) / 100
    : amountTtc;

  let stripeInvoiceId: string | null = null;
  if (charge?.invoice) {
    stripeInvoiceId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice.id;
  } else if (pi.invoice) {
    stripeInvoiceId = typeof pi.invoice === 'string' ? pi.invoice : (pi.invoice as Stripe.Invoice).id;
  }

  const { error: insertErr } = await supabase.from('payments').insert({
    user_id: userId,
    customer_email: customerEmail,
    customer_name: customerName,
    customer_type: customerType,
    amount: amountTtc,
    amount_ht: amountHt,
    currency: pi.currency || 'eur',
    description,
    stripe_session_id: null,
    stripe_payment_id: pi.id,
    stripe_invoice_id: stripeInvoiceId,
    status: stripeStatus,
    refunded_amount: stripeRefunded,
    refunded_at: totalRefundedCents > 0 ? new Date().toISOString() : null,
    created_at: new Date(pi.created * 1000).toISOString(),
  });

  if (insertErr) {
    console.error(`[sync] Insert failed pour PI ${pi.id}:`, insertErr.message);
    stats.errors++;
    return;
  }

  console.log(`[sync] Payment rattrapé : PI ${pi.id} (${customerType}, ${amountTtc}€, "${description}")`);
  stats.inserted++;
}

// ════════════════════════════════════════════════════════════════════
// Identifie le produit via les line items / subscription du PI
// Retourne { customerType, description } ou null si non identifiable
// ════════════════════════════════════════════════════════════════════
async function identifyProduct(pi: Stripe.PaymentIntent): Promise<{
  customerType: 'pro' | 'particulier';
  description: string;
} | null> {
  try {
    let invoice: Stripe.Invoice | null = null;
    if (pi.invoice) {
      invoice = typeof pi.invoice === 'string'
        ? await stripe.invoices.retrieve(pi.invoice, { expand: ['subscription'] })
        : pi.invoice as Stripe.Invoice;
    } else {
      const charge = pi.latest_charge && typeof pi.latest_charge !== 'string'
        ? pi.latest_charge as Stripe.Charge
        : null;
      if (charge?.invoice) {
        const invId = typeof charge.invoice === 'string' ? charge.invoice : charge.invoice.id;
        invoice = await stripe.invoices.retrieve(invId, { expand: ['subscription'] });
      }
    }

    if (invoice) {
      const firstLine = invoice.lines?.data?.[0] as any;
      const priceId = firstLine?.price?.id;
      const billingReason = invoice.billing_reason;

      // Cas abonnement Pro
      if (priceId && PRICE_TO_PLAN[priceId]) {
        const plan = PRICE_TO_PLAN[priceId];
        const planName = planLabel(plan);

        if (billingReason === 'subscription_create') {
          return { customerType: 'pro', description: `Abonnement ${planName} (souscription)` };
        }
        if (billingReason === 'subscription_cycle') {
          return { customerType: 'pro', description: `Abonnement ${planName} (renouvellement)` };
        }
        if (billingReason === 'subscription_update') {
          return { customerType: 'pro', description: `Abonnement ${planName} (upgrade)` };
        }
        return { customerType: 'pro', description: `Abonnement ${planName}` };
      }

      // Cas achat unitaire Pro
      if (priceId && PRICE_TO_UNIT_PRO[priceId]) {
        const unit = PRICE_TO_UNIT_PRO[priceId];
        const unitLabel = unit.type === 'complete' ? "analyse complète d'un bien" : "analyse simple d'un document";
        return { customerType: 'pro', description: `Achat unitaire — ${unitLabel}` };
      }

      // Cas achat unitaire Particulier
      if (priceId && PRICE_TO_UNIT_PART[priceId]) {
        return { customerType: 'particulier', description: PRICE_TO_UNIT_PART[priceId].label };
      }
    }

    // ─── Fallback par montant (si on n'a pas pu identifier via les prix) ───
    const amount = pi.amount;
    // Particulier (en cents TTC)
    if (amount === 490) return { customerType: 'particulier', description: 'Achat unitaire — analyse simple' };
    if (amount === 1990) return { customerType: 'particulier', description: 'Achat unitaire — analyse complète' };
    if (amount === 2990) return { customerType: 'particulier', description: 'Pack 2 Biens — 2 crédits complets' };
    if (amount === 3990) return { customerType: 'particulier', description: 'Pack 3 Biens — 3 crédits complets' };
    // Pro (TTC = HT × 1.20)
    if (amount === 348) return { customerType: 'pro', description: "Achat unitaire — analyse simple d'un document" };
    if (amount === 1188) return { customerType: 'pro', description: "Achat unitaire — analyse complète d'un bien" };
    if (amount === 2388) return { customerType: 'pro', description: 'Abonnement Découverte (souscription)' };
    if (amount === 5988) return { customerType: 'pro', description: 'Abonnement Starter (souscription)' };
    if (amount === 10788) return { customerType: 'pro', description: 'Abonnement Power (souscription)' };

    return null;
  } catch (e) {
    console.warn(`[identifyProduct] Erreur pour PI ${pi.id}:`, e);
    return null;
  }
}
