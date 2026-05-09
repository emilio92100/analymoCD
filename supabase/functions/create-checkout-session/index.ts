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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { priceId, userId, promoCodeId, successUrl, retractationWaiverAt } = await req.json();

    // Garde-fou juridique : sans consentement exprès, on refuse le paiement
    if (!retractationWaiverAt) {
      return new Response(
        JSON.stringify({ error: "Consentement au démarrage immédiat du service requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: successUrl || "https://verimo.fr/dashboard/tarifs?success=true",
      cancel_url: "https://verimo.fr/dashboard/tarifs?cancelled=true",
      metadata: {
        userId,
        promoCodeId: promoCodeId ?? "",
        retractationWaiverAt,
      },
    };

    // Si un code promo est fourni, on récupère ses détails et on applique la réduction
    if (promoCodeId) {
      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("id", promoCodeId)
        .single();

      if (promo) {
        if (promo.type === "percent") {
          // Réduction en pourcentage via coupon Stripe
          const coupon = await stripe.coupons.create({
            percent_off: promo.value,
            duration: "once",
          });
          sessionParams.discounts = [{ coupon: coupon.id }];

        } else if (promo.type === "fixed") {
          // Réduction fixe en centimes
          const coupon = await stripe.coupons.create({
            amount_off: Math.round(promo.value * 100),
            currency: "eur",
            duration: "once",
          });
          sessionParams.discounts = [{ coupon: coupon.id }];

        } else if (promo.type === "credits") {
          // Crédits bonus → pas de réduction sur le prix, on laisse passer normalement
          // Les crédits bonus sont gérés dans le webhook après paiement
        }

        // Enregistrer l'utilisation du code promo
        await supabase.from("promo_uses").insert({
          code_id: promoCodeId,
          user_id: userId,
        });

        // Incrémenter le compteur d'utilisations
        await supabase
          .from("promo_codes")
          .update({ uses_count: (promo.uses_count ?? 0) + 1 })
          .eq("id", promoCodeId);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
