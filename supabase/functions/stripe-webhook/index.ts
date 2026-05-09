// ══════════════════════════════════════════════════════════════
// STRIPE WEBHOOK — Verimo Particuliers (v2)
// Écoute checkout.session.completed
// Attribue les crédits + enregistre le paiement dans payments
//
// v2 :
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

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      sessionIdForCatch = session.id;

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
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      console.log('[stripe-webhook] CreditInfo trouvé:', creditInfo);

      // Récupérer les crédits actuels
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
        } else {
          console.log('[stripe-webhook] Crédits attribués:', updates);
        }
      }

      const amountPaid = (session.amount_total || 0) / 100;

      // Récupérer le code promo utilisé
      let promoCode: string | null = null;
      if (session.discounts && session.discounts.length > 0) {
        const discount = session.discounts[0];
        if (discount.coupon) {
          const { data: promoUse } = await supabase
            .from('promo_uses')
            .select('code_id, promo_codes(code)')
            .eq('user_id', userId)
            .order('used_at', { ascending: false })
            .limit(1)
            .single();
          promoCode = (promoUse?.promo_codes as { code: string } | null)?.code || null;
        }
      }

      // Construire la description
      let description = creditInfo.label;
      if (promoCode && amountPaid < creditInfo.amount) {
        const reduction = ((creditInfo.amount - amountPaid) / creditInfo.amount * 100).toFixed(0);
        description += ` · Code ${promoCode} (−${reduction}%)`;
      }

      // Enregistrer dans payments
      const { data: paymentInserted, error: paymentError } = await supabase.from('payments').insert({
        user_id: userId,
        amount: amountPaid,
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
    return new Response('Server error', { status: 500, headers: CORS });
  }
});
