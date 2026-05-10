// ══════════════════════════════════════════════════════════════════════
// VERIMO — Edge Function : create-checkout-session V2
//
// Crée une session Stripe Checkout pour les PARTICULIERS.
// (Achats unitaires : Document 4,90€ / Complète 19,90€ / Pack2 / Pack3)
//
// V2 (sécurité — 10 mai 2026) :
//   - JWT obligatoire : l'utilisateur doit être connecté
//   - userId pris du JWT (plus depuis le body, qui était falsifiable)
//   - Vérification serveur : promo expiré / max_uses / restricted_email / déjà utilisé
//   - successUrl / cancelUrl hardcodés serveur (plus de phishing possible)
//   - Méthodes de paiement gérées via dashboard Stripe (cartes + Apple Pay /
//     Google Pay / Link si activés dans Settings → Payment methods)
//   - Le compteur uses_count + l'insert promo_uses sont DÉPLACÉS dans
//     le webhook stripe-webhook (après confirmation paiement)
//     → un code promo n'est plus consommé tant que le client n'a pas payé
//
// Variables d'environnement requises :
//   - STRIPE_SECRET_KEY
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
// ══════════════════════════════════════════════════════════════════════

import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Whitelist serveur des price IDs autorisés pour les particuliers
// (empêche un attaquant de faire passer un autre price ID via le body)
const ALLOWED_PRICE_IDS = new Set([
  'price_1TTtd1BesXB76oWECAGA9ywf', // Document 4,90€
  'price_1TTtd2BesXB76oWEsZ9LsLS9', // Complète 19,90€
  'price_1TTtcxBesXB76oWETkokxLgB', // Pack 2 — 29,90€
  'price_1TTtczBesXB76oWEloTMvEZF', // Pack 3 — 39,90€
]);

// URLs hardcodées serveur (plus de redirection arbitraire)
const SUCCESS_URL = "https://verimo.fr/dashboard/tarifs?success=true";
const CANCEL_URL = "https://verimo.fr/dashboard/tarifs?cancelled=true";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ─────────────────────────────────────────────────────────────────
    // 1. Authentification obligatoire (JWT)
    // ─────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Authentification requise." }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return jsonResponse({ error: "Session invalide ou expirée." }, 401);
    }

    // user.id est SOURCE DE VÉRITÉ — on ignore tout userId envoyé dans le body
    const userId = user.id;

    // ─────────────────────────────────────────────────────────────────
    // 2. Lecture & validation du body
    // ─────────────────────────────────────────────────────────────────
    const { priceId, promoCodeId, retractationWaiverAt } = await req.json();

    // Garde-fou juridique : sans consentement exprès, on refuse le paiement
    if (!retractationWaiverAt) {
      return jsonResponse(
        { error: "Consentement au démarrage immédiat du service requis." },
        400
      );
    }

    // Validation du priceId contre la whitelist
    if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
      return jsonResponse({ error: "Produit invalide." }, 400);
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. Construction de la session Checkout
    // ─────────────────────────────────────────────────────────────────
    // Note : pas de payment_method_types ni d'automatic_payment_methods.
    // Stripe utilise alors les méthodes de paiement activées dans le dashboard
    // Stripe (Settings → Payment methods) — cartes par défaut, + Apple Pay /
    // Google Pay / Link automatiquement si activés.
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      // Pré-remplit l'email du client connecté (modifiable par l'utilisateur
      // s'il veut une autre adresse de facturation). Pas de Customer Stripe
      // créé — pertinent pour les achats ponctuels particuliers.
      customer_email: user.email,
      // metadata : transmises au webhook après paiement
      metadata: {
        userId,
        promoCodeId: promoCodeId ?? "",
        retractationWaiverAt,
      },
      locale: "fr",
    };

    // ─────────────────────────────────────────────────────────────────
    // 4. Validation serveur du code promo (si fourni)
    // ─────────────────────────────────────────────────────────────────
    if (promoCodeId) {
      const { data: promo, error: promoErr } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("id", promoCodeId)
        .eq("active", true)
        .maybeSingle();

      if (promoErr || !promo) {
        return jsonResponse({ error: "Code promo invalide ou désactivé." }, 400);
      }

      // Expiration
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return jsonResponse({ error: "Ce code promo a expiré." }, 400);
      }

      // Quota global
      if (promo.max_uses && promo.uses_count >= promo.max_uses) {
        return jsonResponse({ error: "Ce code promo a atteint sa limite d'utilisation." }, 400);
      }

      // Email restreint
      if (promo.restricted_email && promo.restricted_email !== user.email) {
        return jsonResponse({ error: "Ce code promo n'est pas disponible pour votre compte." }, 400);
      }

      // Déjà utilisé par ce user
      const { data: alreadyUsed } = await supabase
        .from("promo_uses")
        .select("id")
        .eq("code_id", promoCodeId)
        .eq("user_id", userId)
        .maybeSingle();

      if (alreadyUsed) {
        return jsonResponse({ error: "Vous avez déjà utilisé ce code promo." }, 400);
      }

      // Application de la réduction
      // ⚠️ Les codes de type "credits" ne passent pas par cette edge function
      // (gérés côté Tarifs.tsx via handleApplyCredits — pas de paiement Stripe)
      if (promo.type === "percent") {
        const coupon = await stripe.coupons.create({
          percent_off: promo.value,
          duration: "once",
        });
        sessionParams.discounts = [{ coupon: coupon.id }];
      } else if (promo.type === "fixed") {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(promo.value * 100),
          currency: "eur",
          duration: "once",
        });
        sessionParams.discounts = [{ coupon: coupon.id }];
      }
      // type === "credits" : ne devrait pas arriver ici, mais on laisse passer
      // sans réduction par sécurité (l'attribution se fait côté front sans Stripe)

      // ⚠️ NE PAS insérer dans promo_uses ni incrémenter uses_count ici.
      // Ces opérations sont déplacées dans le webhook stripe-webhook,
      // pour qu'un code promo ne soit consommé que SI le paiement aboutit.
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. Création de la session Stripe
    // ─────────────────────────────────────────────────────────────────
    const session = await stripe.checkout.sessions.create(sessionParams);

    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error("[create-checkout-session] Error:", err);
    return jsonResponse({ error: (err as Error).message }, 400);
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
