/**
 * Version actuelle des CGV Pro.
 *
 * Cette valeur est stockée en BDD (profiles.cgv_pro_version) au moment où un pro
 * accepte les CGV via la popup de consentement avant son premier paiement.
 *
 * 👉 Quand tu publies une nouvelle version des CGV Pro :
 *   1. Mets à jour ce numéro (ex: "v2.4")
 *   2. Envoie un mail manuel aux pros existants pour les informer de l'évolution
 *   3. Aucun impact sur les abonnements en cours — pas de re-consentement forcé
 *
 * Les nouveaux pros qui s'abonneront après le changement verront leur consentement
 * tracé avec la nouvelle version. Les anciens pros gardent la version qu'ils ont
 * acceptée (preuve juridique de quelle version ils ont validée).
 */
export const CURRENT_CGV_PRO_VERSION = "v2.3";
