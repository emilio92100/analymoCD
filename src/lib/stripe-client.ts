// ══════════════════════════════════════════════════════════════════════
// VERIMO — Stripe.js client (frontend)
// 
// Initialise Stripe.js une seule fois pour toute l'app.
// Utilisé pour gérer les confirmations 3D Secure inline lors des upgrades.
// 
// Variable d'environnement requise (Vercel) :
// - VITE_STRIPE_PUBLISHABLE_KEY = pk_live_xxx (clé publique Stripe PRODUCTION)
// ══════════════════════════════════════════════════════════════════════

import { loadStripe, Stripe } from '@stripe/stripe-js';

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PK);
  }
  return stripePromise;
}
