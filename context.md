# VERIMO — Contexte projet — 26 mai 2026

> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## 🛠️ Méthode de travail avec Alex

- **Profil** : débutant développement, modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- **Repo** : `github.com/emilio92100/analymoCD`
- Claude clone `https://github.com/emilio92100/analymoCD.git` et livre les fichiers **complets** via `present_files` depuis `/mnt/user-data/outputs/`
- Alex push manuellement sur GitHub
- **Vercel redéploie auto** le frontend après chaque push GitHub
- ⚠️ **Edge Functions Supabase NE sont PAS déployées par push GitHub** — il faut aller manuellement dans Supabase → Edge Functions → coller le code → Deploy. Bug récurrent : Alex push, l'erreur persiste, c'est parce que l'edge function n'est pas redéployée
- **SQL avant frontend** : toujours faire les UPDATE de schéma Supabase avant de pusher le code qui s'en sert
- **Ne jamais coder sans accord préalable** — toujours échanger et valider avant de toucher au code
- **Une étape à la fois** — pas 10 actions d'un coup
- **Réponses courtes et concises** — pas de pavés sauf question technique précise
- **Pas de QCM cascade** — quand Alex demande un choix, lui en proposer 2-4 max
- **Challenger les sur-ingénieries** — Alex préfère faire simple
- **Mots bannis des pages publiques Verimo** :
  - "IA" / "AI" → utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte". AI uniquement autorisé dans admin, edge functions, prompts, logs, context.md.
  - "co-brandé" / "co-branding" → utiliser "à votre image" (banni progressivement sur tout le site)
- **Tests live avec vraie carte CB d'Alex** (pas Visa 4242)

---

## 📦 Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière, modificatifs RCP, fiche synthétique...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour appartements et maisons.

**Slogan** : *Vos documents décryptés, votre décision éclairée.*
**H1 HomePage** : *Analysez vos documents immobiliers avant de signer.*
**Cible** : Acheteurs particuliers (primo-accédants, RP) et professionnels (agents immo, mandataires, investisseurs, marchands de bien, notaires).

---

## 💰 Tarification

### Particuliers
- 4,90€ → 1 crédit analyse simple (1 doc) — PAS de score /20
- 19,90€ → 1 crédit analyse complète (jusqu'à 15 docs)
- 29,90€ → 2 crédits (Pack 2 biens)
- 39,90€ → 3 crédits (Pack 3 biens)
- Crédits jamais expirés

### Pros — Abonnements mensuels HT
| Plan | Prix HT/mois | Complètes | Simples | Agents max |
|------|-------------|-----------|---------|------------|
| Découverte | 19,90€ | 1 | 3 | 1 |
| Starter | 49,90€ | 5 | 15 | 1 |
| Power | 89,90€ | 10 | 30 | 1 |
| **🏛 Agence** | **149,90€** | **15** | **30** | **3 (login partagé)** |

**Achats unitaires pro (réservés aux abonnés)** : Complète 9,90€ HT · Simple 2,90€ HT

**Argumentaire commercial Découverte** : 1,30€ "surcoût" vs achat unitaire (19,90€ vs 18,60€) défendable via dashboard pro, support dédié, tarif préférentiel à 9,90€ (vs 19,90€ particulier). Rentable dès 2 analyses supplémentaires dans l'année.

**🏛 Plan Agence — activé le 27 mai 2026** :
- Cible : structures multi-collaborateurs (3 agents max en V1, login partagé)
- Activation sur invitation : admin clique "🏛 Envoyer la proposition agence" sur la fiche → mail HTML envoyé + flag `pro_agence_subscription_unlocked` passe à true → l'agence voit le bouton Stripe Checkout dans son dashboard
- Cumul de crédits identique aux plans solo (plafond 2× = 30 complètes / 60 simples max)
- Sans engagement, résiliable depuis Stripe Customer Portal
- Article 4.5 ajouté aux CGV Pro

**Coûts réels Claude API** : ~0,50€/analyse complète (médiane), ~0,15€/analyse simple. Marges saines à 55-90%.

⚠️ **Tarifs pros JAMAIS affichés publiquement** — ni sur `/pro`, ni sur `/tarifs`, ni sur `/pro/agents-mandataires`. Validation manuelle des comptes + démo perso.

### Stripe Price IDs (PRODUCTION)

```
# Particuliers
document : price_1TTtd1BesXB76oWECAGA9ywf
complete : price_1TTtd2BesXB76oWEsZ9LsLS9
pack2    : price_1TTtcxBesXB76oWETkokxLgB
pack3    : price_1TTtczBesXB76oWEloTMvEZF

# Pro — abonnements mensuels
DECOUVERTE 19,90€ → price_1TTtd1BesXB76oWEZuILxjwe
STARTER 49,90€    → price_1TTtczBesXB76oWEcKaNR2BW
POWER 89,90€      → price_1TTtcxBesXB76oWEPyVYZjCj
AGENCE 149,90€    → price_1TbnpDBesXB76oWEdOjLZRh3   # 🏛 Ajouté le 27 mai 2026 (prod_UazolFHs7gghhx)

# Pro — achats unitaires (réservés aux abonnés)
UNIT_COMPLETE 9,90€ → price_1TTtcyBesXB76oWEBF1TLHYz
UNIT_SIMPLE 2,90€   → price_1TTtd2BesXB76oWEVM0p27GS

# TVA France 20% (mode exclusif HT)
TVA Tax Rate ID : txr_1TUAxVBesXB76oWESXBnGdIZ
```

**Secret Supabase Edge Functions** : `STRIPE_PRICE_AGENCE` = `price_1TbnpDBesXB76oWEdOjLZRh3` (lu dynamiquement par `pro-checkout-create` et `stripe-webhook-pro`).

---

## 🏗️ Stack technique

- **Frontend** : React + Vite + TypeScript + Tailwind
- **Backend** : Supabase Pro (auth + DB + Edge Functions Deno + Storage)
- **IA** : Claude Sonnet 4.6 via API Anthropic + Files API (modèle `claude-sonnet-4-6`)
- **Paiement** : Stripe (PRODUCTION)
- **Email** : Mailjet (`notification@verimo.fr` particuliers, `pro@verimo.fr` pro)
- **Déploiement** : Vercel (frontend auto via GitHub) + Supabase (edge functions **manuelles**)
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`
- **Site** : `https://www.verimo.fr` + `pro.verimo.fr` (CNAME → Vercel)

---

## 🏢 Identité légale Verimo

- **Éditeur** : VERIMO APP
- **Responsable** : Alexandre ROGELET
- **Emails** :
  - `hello@verimo.fr` → email général grand public (CGU, mentions légales, contact)
  - `pro@verimo.fr` → email B2B (UNIQUEMENT relations pros, CGV Pro, demandes de rappel) — ✅ mailbox configurée et fonctionnelle
  - `notification@verimo.fr` → Mailjet particuliers
  - `contact@verimo.fr` → emails sortants pros (avec nom agent dans body)

---

## ⚙️ Edge Functions Supabase (production)

| Nom | Rôle | Version |
|-----|------|---------|
| `analyser` | Lance une analyse — gère la queue Anthropic 503 | v8 |
| `analyser-run` | Worker qui traite l'analyse en background | **v13** (26 mai — règle fiscale frais notaire corrigée) |
| `analyser-retry` | Cron pg_cron 5 min — retraite les analyses queued (12 retries max) | — |
| `comparer` | Compare 2 ou 3 rapports | — |
| `admin-user-management` | Actions admin (create, invite, delete, reset password, **create_pro_demo enrichi**, **activate_pro_demo**) | **v2** (25 mai) |
| `pro-checkout-create` | Stripe pro : subscribe / preview_upgrade / buy_unit / cancel / cancel_scheduled_change / reactivate / billing_portal / list_invoices | V3 |
| `stripe-webhook-pro` | Webhook Stripe pro (5 events) + mail résiliation + **auto-conversion démo→actif** | **V8** (25 mai) |
| `stripe-webhook` | Webhook Stripe particuliers (checkout.session.completed) | **V3.1** |
| `create-checkout-session` | Stripe particuliers (checkout) + audience promo | **V3** |
| `send-pro-request-confirmation` | Mail confirmation prospect + notif interne `pro@verimo.fr` | — |
| `notify-callback` | 🆕 Notification demande de rappel pro (cloche admin + email pro@verimo.fr) | **v1** (25 mai) |
| `sync-stripe-payments` | Filet de sécurité — sync Stripe → table `payments` toutes les 5 min via pg_cron | **V2** — ⚠️ **DÉSACTIVÉ temporairement** |

⚠️ **Rappel critique** : push GitHub ne déploie pas les edge functions → toujours redéployer manuellement dans Supabase Studio.

### Webhooks Stripe configurés

- **Verimo - Pro** → `stripe-webhook-pro` : 4 events (checkout.session.completed, customer.subscription.deleted, customer.subscription.updated, invoice.paid) + `charge.refunded`
- **Verimo - Particuliers** → `stripe-webhook` : checkout.session.completed + `charge.refunded`

> Note : `checkout.session.completed` est envoyé aux 2 webhooks. V7/V3.1 contiennent un filtre qui fait skip silencieux si le paiement n'est pas pour ce webhook.

### Cron Supabase pg_cron

- `analyser-retry-5min` → actif (essentiel)
- `sync-stripe-payments-every-5min` → DÉSACTIVÉ temporairement (à réactiver quand vieux paiements problématiques expirés)

⚠️ **Service_role key compromise** durant la session du 11 mai (partagée dans screenshots). À régénérer + recréer le cron avec la nouvelle clé.

---

## 🗺️ Routes principales

```
/                              → HomePage
/pro                           → ProPage (4 onglets profils : Agent/Mandataire, Investisseur, Marchand, Notaire)
/pro/agents-mandataires        → MandatairesPage (landing dédiée agents/mandataires)
/pro/rejoindre                 → Page multi-step prospects pros
/tarifs                        → TarifsPage (particuliers uniquement, pas de tarifs pros publics)
/exemple                       → ExemplePage
/methode                       → MethodePage
/guides                        → GuidesPage
/cgv-pro                       → CGVProPage (B2B, scroll spy, 14 sections)
/connexion, /inscription       → Auth
/admin                         → AdminPage (paramètre URL ?tab=callbacks pour ouvrir direct un onglet)
/dashboard                     → SmartDashboard (détecte role)
/dashboard/nouvelle-analyse    → NouvelleAnalyse
/dashboard/analyses            → MesAnalyses (particulier)
/dashboard/dossiers            → MesDossiersPro (pro)
/dashboard/dossier/:id         → DossierDetail (pro)
/dashboard/abonnement          → MonAbonnement (pro)
/dashboard/compte              → Compte ou ComptePro
/dashboard/support             → Support
/rapport?id=XXX                → RapportPage
/rapport/partage/:token        → RapportPartagePage (lien public sans compte)
```

---

## 💳 Système d'abonnement Pro Stripe — État actuel (✅ stable)

**Le système Stripe pro est entièrement opérationnel et testé en live**.

### Flow d'upgrade (paiement immédiat)
- `proration_behavior: 'none'` + `billing_cycle_anchor: 'now'` → cycle redémarre, plein tarif facturé immédiatement
- `payment_behavior: 'default_incomplete'` → permet de gérer 3DS, carte refusée, etc.
- 4 cas gérés côté backend : paiement direct OK, 3DS demandé, Carte refusée, Paiement en cours
- **Sécurité backend** : webhook `customer.subscription.updated` vérifie `latest_invoice.status === 'paid'` AVANT de cumuler les crédits
- **Pas de retry automatique** sur upgrade échoué

### Flow de downgrade (Stripe Subscription Schedule)
- Création d'un `subscription_schedule` via `from_subscription` → bascule programmée à `current_period_end`
- Mode `cancel_scheduled_change` permet d'annuler une bascule programmée
- Stockage BDD dans colonnes `pro_subscriptions.scheduled_plan_change` + `scheduled_change_date`

### 🆕 Auto-conversion démo → actif (V8 — 25 mai)
- Quand un pro `pro_status='demo'` souscrit un abonnement Stripe → passage auto à `pro_status='active'` + `pro_demo_converted_at`
- Touche **uniquement** si `pro_status === 'demo'` (aucun impact sur les autres comptes)
- Bandeaux démo (orange + bleu) disparaissent automatiquement
- Non bloquant : si la conversion échoue, le paiement est traité normalement

### ⚠️ Bug paiement Stripe (NON résolu, workaround manuel)

**Symptôme** : `stripe_payment_id = NULL` dans `payments` pour les paiements d'upgrade (Starter, Power) → webhook `charge.refunded` ne peut pas matcher → CA admin pas mis à jour quand remboursement fait dans Stripe.

**Cause racine** : `invoice.payment_intent` est parfois vide/undefined au moment où le webhook `invoice.paid` arrive (notamment avec `payment_behavior: 'default_incomplete'`). Le code `recordProPayment` stocke alors `stripe_payment_id = NULL`.

**Décision Alex** : ne pas refondre maintenant. Workflow manuel : SQL UPDATE quand remboursement fait dans Stripe.

**Bug secondaire** : webhook particulier `stripe-webhook/index.ts` ligne 142 → `const supabase` déclaré DANS `serve()` → `ReferenceError` quand `handleChargeRefunded` (déclaré hors serve) est appelé. À fixer plus tard.

### Bandeau past_due
- Confirmé actif sur Dashboard Pro (DashboardProPage.tsx)
- Rouge, sur toutes pages, bouton "Mettre à jour ma carte" → `openBillingPortal` Stripe
- Bloque changement plan si past_due
- Stripe Smart Retries actif (4 tentatives sur 3 semaines), emails auto Stripe activés

---

## 📜 Système CGV Pro popup obligatoire (✅ DÉPLOYÉ)

**Concept** : popup obligatoire de consentement aux CGV Pro avant le 1er paiement pro. Une fois acceptée → jamais redemandée. Si changement de version CGV future, Alex envoie mail manuel aux pros existants (continuation d'usage = acceptation tacite jurisprudence FR).

### Fichiers
- `src/lib/cgv-version.ts` — constante `CURRENT_CGV_PRO_VERSION = "v2.3"`
- `src/components/CgvProConsentDialog.tsx` — popup avec backdrop blur, checkbox, lien vers `/cgv-pro`
- `src/pages/DashboardProPage.tsx` — Helper `requireCgvThen(actionLabel, paymentAction)` intercepte 3 actions paiement
- `src/pages/AdminPage.tsx` — bloc visible sur fiche client pro : ✅ vert ou ⚠️ orange

---

## 🆕 Session 25-26 mai 2026 ⭐ — Système rappels pro + Auto-conversion démo + UX polish

### 1. Système de demande de rappel pro (✅ DÉPLOYÉ)

**Concept** : Bouton "Je souhaite être rappelé" pour les pros qui hésitent à s'abonner ou veulent un devis agence. Notification admin + email instantané.

**SQL exécuté** :
```sql
create table public.callback_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  phone text not null,
  preferred_slots text[] default '{}',
  message text,
  context text default 'demo_expired',  -- 'demo_expired' | 'abonnement_agence' | 'other'
  status text default 'pending' not null,  -- 'pending' | 'called' | 'converted' | 'declined'
  created_at timestamptz default now() not null,
  handled_at timestamptz,
  handled_by uuid references auth.users(id),
  admin_notes text
);
-- + RLS : user insère/select own, admin all (via profiles.role='admin')
-- + index sur (status, created_at desc) et (user_id)
```

**Composants livrés** :
- `src/components/CallbackRequestModal.tsx` (NEW) — modal réutilisable avec :
  - Téléphone obligatoire (min 8 chiffres)
  - 4 créneaux à cocher (matinée / déjeuner / après-midi / soirée)
  - Message libre optionnel
  - Pré-remplissage auto du téléphone depuis `profiles.telephone` + mention bleue "Nous vous rappellerons sur ce numéro"
  - Animation fluide AnimatePresence + motion.div (fade + scale, courbe cubic-bezier [0.16, 1, 0.3, 1])
- `supabase/functions/notify-callback/index.ts` (NEW) — edge function qui :
  - Insère `system_alerts` (cloche admin avec type='callback_request')
  - Envoie email à `pro@verimo.fr` avec toutes infos + bouton "Voir dans l'admin" → `verimo.fr/admin?tab=callbacks`

**Intégration côté pro** :
- `DashboardProPage.tsx` — bandeau démo épuisée refait : titre "Vous avez testé Verimo, qu'en pensez-vous ?" + 2 boutons "Je souhaite être rappelé" + "Voir les forfaits"
- Page abonnement : bandeau bleu "🏢 Vous gérez une agence ou une équipe ?" + bouton "Demander un devis agence"
- Modal ouverte avec `context` adapté ('demo_expired' ou 'abonnement_agence')

**Intégration côté admin** :
- Nouvel onglet **"Rappels Pro"** dans la sidebar (groupe UTILISATEURS) avec badge compteur `pending`
- Composant `AdminCallbacksTab` : layout 2 colonnes (liste / détail), 5 filtres (En attente / Rappelés / Convertis / Pas intéressés / Tous)
- Actions par callback : Marquer rappelé / Converti / Pas intéressé / Repasser en attente, notes internes
- Boutons "Voir l'utilisateur →" et "Voir fiche Pro →" pour navigation rapide
- Bloc "Demandes de rappel" dans la fiche client (affiche toutes les demandes de ce client avec statut)
- Lecture URL `?tab=callbacks` pour ouvrir direct depuis l'email
- ⚠️ Limitation connue : si la jointure `profiles` retourne null (RLS), l'admin voit "Inconnu" mais le bouton "Voir l'utilisateur →" permet d'accéder à la fiche complète

### 2. Auto-conversion démo → actif via Stripe (✅ DÉPLOYÉ — V8)

**Modification** `supabase/functions/stripe-webhook-pro/index.ts` :
- Nouvelle fonction `convertDemoToActiveIfNeeded(userId)` appelée après `upsertProSubscription`
- Si `pro_status === 'demo'` → bascule auto à `'active'` + `pro_demo_converted_at = NOW()`
- Aucun effet sur les autres statuts
- Non bloquant (try/catch silencieux)
- ⚠️ Appel **uniquement** dans la branche `session.mode === 'subscription'` (les paiements unitaires sont impossibles sans abo)

### 3. Création compte démo enrichie (✅ DÉPLOYÉ)

**Avant** : formulaire avec seulement nom + email + raison sociale + custom_message.

**Maintenant** : formulaire complet aligné sur création pro classique, tous les champs optionnels sauf nom et email :
- Téléphone
- Type de profil (sélecteur agent/investisseur/notaire/autre, défaut 'agent')
- Raison sociale + Réseau
- SIRET
- Adresse + Code postal + Ville
- Notes internes admin
- Message du mail (conservé)

**Edge function `admin-user-management` action `create_pro_demo`** modifiée pour accepter et enregistrer les 8 nouveaux champs dans `profiles`.

**Conséquence positive** : pour la modal "Être rappelé", si le pro a un téléphone enregistré (parce qu'Alex l'a saisi à la création), le champ tel se pré-remplit auto. Mention bleue informative sous le champ.

### 4. Bouton "Activer le compte" manuel (✅ DÉPLOYÉ)

**Cas d'usage** : Pro démo qui signe un contrat sur mesure (virement, paiement par facture, partenariat bizdev, etc.) sans passer par Stripe → bouton pour le sortir de démo manuellement.

**Implémentation** :
- Bouton vert "✓ Activer le compte" dans le header de la fiche client admin
- **Visible uniquement** si `pro_status === 'demo'`
- Clic → mini-modal avec 2 inputs optionnels : crédits simples / crédits complètes à offrir (défaut 0)
- Submit → appel edge function `admin-user-management` action `activate_pro_demo`
- Mise à jour profile : `pro_status = 'active'` + `pro_demo_converted_at = NOW()`
- Si crédits > 0 → insertion dans `credit_grants` avec raison "Crédit offert — activation compte (sortie démo)"
- Les bandeaux démo (orange + bleu) disparaissent côté client à son refresh

### 5. Refonte filtres ClientsProTab admin (✅ DÉPLOYÉ)

**Nouveau bloc filtres encadré sur 2 lignes** :
- **Ligne 1 — STATUT** (couleur bleu marine `#0f2d3d`) : Tous / 🎁 Compte démo (NEW) / 🟢 Abo / 🟡 Résiliation programmée / ✓ Activé / Inscrits non activés / 🔴 Résilié
- **Ligne 2 — TYPE DE PROFIL** (couleur violet `#7c3aed`) : Tous / 🏢 Agent / 📈 Investisseur / ⚖️ Notaire / 💼 Autre
- Lien "Réinitialiser" sur la ligne Type quand un filtre est actif
- **Filtres cumulatifs** : statut + type combinés (ex: "démo" + "investisseur")
- Chips avec animation : translateY(-1px) au clic, box-shadow colorée, hover gris pâle

### 6. Modification du type de profil depuis la fiche (✅ DÉPLOYÉ)

Badge type en haut de la fiche client admin devient **cliquable** :
- Clic → dropdown apparaît avec les 4 options (agent/investisseur/notaire/autre)
- Coche ✓ sur l'option actuelle
- Sélection → update direct en base + toast + refresh fiche
- Animation framer-motion fade+scale, overlay pour fermer en cliquant ailleurs

### 7. Marque blanche rapports envoyés par pros (✅ DÉPLOYÉ)

Quand un pro envoie un rapport à un client via "Envoyer une analyse" (table `report_shares`), le client voit maintenant :
- "Avis du professionnel" au lieu de "Avis Verimo"
- Disclaimer reformulé : *"Votre professionnel s'appuie sur un outil d'analyse de documents immobiliers pour préparer cette synthèse. Pour toute question sur le bien, n'hésitez pas à le contacter directement."*
- Section "Points relevés par votre professionnel" (au lieu de "Points à approfondir avant de signer") + sous-titre explicatif "Voici les vérifications et démarches que votre professionnel a identifiées..."
- Onglet Documents : masquage du bandeau orange "score précis", section "Pour améliorer votre score", bouton "Compléter mon dossier", mention RGPD, badge "2"
- Pistes négociation masquées

**Détection robuste** dans `src/lib/analyses.ts` : si on trouve le rapport via `report_shares` (= envoi pro), on force `_ownerIsPro = true` sans relire `profiles` (la RLS bloque la lecture côté client non-loggé).

### 8. Retry IA ciblé DPE/Carrez + Validation diags manquants (✅ DÉPLOYÉ — analyser-run v12)

**Problème résolu** : le prompt système (~2000 lignes) faisait parfois "oublier" à l'IA certaines extractions (recommandations DPE pour classe D/E/F/G, détail pièces Carrez).

**Solution implémentée dans `analyser-run/index.ts`** :

**Fonction `retryDpeCarrez`** (1 seul retry max, timeout 30s) :
- Détecte si DPE D/E/F/G sans `dpe_recommandations` OU CARREZ sans `pieces_detail`
- Si oui → relance UN appel IA ciblé avec mini-prompt court + les mêmes PDF
- Coût additionnel : ~0,02-0,05€ par retry, déclenché uniquement si besoin
- Si échec/timeout → on garde le rapport tel quel, pas de boucle, pas de crash

**Fonction `validateDiagsManquants`** (déterministe, pure logic) :
- Ajoute automatiquement dans `documents_manquants` + `points_vigilance` les diags absents :
  - DPE / ERP → "obligatoire pour la vente"
  - Carrez (appartement/copro) → "obligatoire en copropriété"
  - Électrique (année < 2011) → "obligatoire installations > 15 ans"
  - Amiante privatif (année < 1997) → "obligatoire biens avant 1997"
  - Plomb (année < 1949) → "obligatoire biens avant 1949"
  - Audit énergétique (maison + DPE E/F/G) → "obligatoire maisons E/F/G"
  - Assainissement (maison) → "si non raccordé tout-à-l'égout"
  - Termites → juste vigilance (dépend arrêté préfectoral, on ne sait pas)
- Anti-doublon : compare sur 30/50 premiers caractères

### 9. Animation fluide transitions onglets dashboard particulier (✅ DÉPLOYÉ)

`DashboardPage.tsx` : remplacement du simple `motion.div` par `AnimatePresence mode="wait"` avec sortie + entrée + courbe cubic-bezier naturelle. Transitions désormais comparables à Notion/Linear.
(Côté pro non modifié, à voir si besoin)

### 10. Décisions stratégiques importantes

- **Pas de blocage technique partage de compte solo** : on cadre uniquement par CGV + bandeau dissuasif "Vous gérez une équipe ?" sur page abonnement
- **Suppression user pro reste dangereuse** : ne résilie PAS l'abo Stripe → à régler dans session lifecycle pro
- **Bouton Suspendre / Lever suspension** : reporté à session lifecycle pro dédiée
- **Anti-doublon création démo** : Supabase Auth bloque déjà nativement les doublons d'email, suffisant pour l'instant

### 11. Fix règle frais de notaire — calcul fiscal correct (✅ DÉPLOYÉ)

**Problème identifié** : la règle dans le prompt utilisait `> 5 ans` comme critère unique pour distinguer neuf (3%) vs ancien (7,5%). Or fiscalement, un bien achevé < 5 ans **mais déjà revendu une fois** bascule en "ancien" (7,5%). Sur 350k€, l'erreur faisait ~15k€ de différence dans le calcul.

**Solution** : règle dans `analyser-run/index.ts` ligne 1100 réécrite avec logique correcte :
- **DÉFAUT 7,5%** (règle générale ancien)
- **3% uniquement** si TOUTES ces conditions réunies :
  - Compromis VEFA explicite (mention "vente en l'état futur", "VEFA", "GFA", vendeur = promoteur/société commerciale)
  - ET `origine_propriete.mode_acquisition` = null/non_precise/absent (1ère mutation)
  - ET `annee_construction` < 5 ans
- Cas pièges explicites : bien construit récemment mais revendu par particulier → ancien ; donation/succession → ancien

**Affichage côté `DocumentRenderer.tsx`** (KPI dans analyse simple compromis) :
- Sous-titre KPI changé : "Indicatif — calculé par votre notaire" (au lieu de "~3% · Estimation Verimo" qui pouvait tromper)
- Ajout de **tooltips pédagogiques** (icône ⓘ) :
  - Frais notaire : *"Les frais réels sont calculés par votre notaire le jour de l'acte : droits d'enregistrement (5,09% à 5,80% selon département) + émoluments dégressifs + débours."*
  - Coût total : *"À affiner avec votre notaire pour votre plan de financement définitif."*
- Variable `fraisNotairePct` retirée (non affichée volontairement pour éviter contestations)
- Bandeau bas "Coût total estimé acheteur" : ajout mention italique *"Indicatif — à valider avec votre notaire"*

**Affichage côté `RapportPage.tsx` (analyse complète)** : les frais ne sont PAS affichés dans le rapport complet, donc rien à modifier pour ça.

### 12. Test de l'onglet Compromis dans analyse complète — bug découvert ⚠️

**Découverte de session** : l'onglet **"📝 Compromis"** existe déjà dans `RapportPage.tsx` (composant `TabCompromis` ligne 760, routing ligne 4729, `hasCompromis` ligne 4653, label "Compromis" avec icône `FileSignature`). Il se déclenche conditionnellement si compromis détecté.

**Mais bug visuel constaté lors du test** : sur un rapport réel (12,5/20 puis 11,5/20 après ajout compromis), l'onglet affiche **"Erreur d'affichage — Un problème est survenu sur cet onglet"** via le `SafeTabBoundary`.

**Cause probable** : `TabCompromis` reconstruit une structure pour passer à `RendererCompromis` (depuis DocumentRenderer.tsx) :
```ts
const r = {
  titre: rapport.adresse || compromisData.bien?.adresse_complete,
  resume: compromisData.resume || null,
  ...compromisData,
};
```
Mais `RendererCompromis` attend une forme précise (le `finances`, `bien`, `vendeurs`, etc. doivent être au bon format). Quand on lui passe `lot_achete.compromis` enrichi, un champ doit planter au runtime.

**À investiguer en début de prochaine session** : ouvrir une analyse complète avec compromis, regarder la console DevTools pour identifier l'erreur précise, et adapter `TabCompromis` ou créer un wrapper qui valide/normalise la structure avant de passer à `RendererCompromis`.

### 13. UX "Compléter mon dossier" — 3 frictions identifiées ⚠️

**Test réel effectué** : ajout d'un compromis sur une analyse complète déjà faite. Plusieurs problèmes UX remontés :

**(a) Faux progress bar** : la barre monte rapidement à 90% puis se fige. Le user attend 4-5 minutes sans aucun feedback de progression. Impression de bug.

**(b) Message anxiogène faux** : "Ne fermez pas cette fenêtre" affiché. L'analyse tourne pourtant côté edge function en background → fermer la page ne devrait pas l'arrêter. À reformuler en rassurant + indiquer durée estimée.

**(c) Pas de pédagogie sur ce que fait "Compléter"** : le user pense qu'on ajoute juste l'onglet Compromis, alors qu'en fait on **réanalyse tout le dossier** (anciens docs + nouveaux). Conséquences : score recalculé, nouveaux points de vigilance ajoutés (ex: moins-value vendeur -90k€ depuis 2019, travaux privatifs non autorisés, DTG obsolète), nouvelles pistes de négo. C'est le bon comportement mais perçu comme suspect car non annoncé.

**Comportement technique correct confirmé** : "Compléter" et "Analyse complète directe avec tous les docs" produisent le **même résultat final**. La différence est juste un appel IA en plus côté Verimo (~0,30-0,50€ de coût interne). Le user ne paie qu'une fois.

---

## 🔮 Session "lifecycle pro" — À PRÉVOIR DANS UNE SESSION DÉDIÉE

Trop transversal pour être fait en bout de session. Quand prêt, traiter ensemble :

1. **Bouton Suspendre** (bloque accès) + **Lever suspension** dans fiche client admin
   - Marquer `profiles.suspended = true`, redirection vers page "Compte suspendu"
   - Blocage analyses, partages, etc. ; abo Stripe continue séparément
2. **Bouton Résilier manuellement** (différent de suspendre — annule l'abonnement Stripe)
3. **Webhook Stripe résiliation** : auto-marquer comme résilié quand le pro annule depuis Customer Portal
4. **Gestion des `past_due`** : bandeau de relance proactif pour le pro
5. **Bug suppression compte** : si pro avec abo Stripe → résilier auto Stripe avant `auth.admin.deleteUser`
6. **Affichage clair du statut** dans fiche admin : badge coloré (Démo / Actif / Suspendu / Résilié / Past due)
7. **Comptes démo non convertis** : relance auto après X jours ? Archivage ?
8. **Modification email** : le `pro_profile_type` est maintenant modifiable, mais pas encore d'historique/audit log de qui a changé quoi

---

## 🔐 Sécurité paiements (✅ TERMINÉ)

8 failles identifiées et corrigées. Tous fixés et déployés en prod.

**Reste dans l'audit (non bloquant)** : Rate limiting (faille #7) à activer avant la 1ère grosse campagne pub.

---

## ✅ CA admin V2 + remboursements + sync auto (TERMINÉ)

- Schéma `payments` enrichi : `customer_type`, `amount_ht`, `refunded_amount`, statuts (`completed`, `refunded`, `partially_refunded`)
- Webhook `charge.refunded` ajouté sur les 2 webhooks
- Calcul CA admin réécrit pour lire uniquement `payments`, filtrer status refunded, déduire `refunded_amount`
- Affichage HT/TTC universel sur AdminPage (Pros : HT en premier, Particuliers : TTC)

---

## 🏛 Plan Agence V1 — LIVRÉ (27 mai 2026)

**Modèle** : 1 compte agence = login partagé entre jusqu'à 3 agents collaborateurs (pas de multi-comptes en V1).

### Activation côté admin (workflow)

**Cas 1 — Création directe (négo déjà faite)** :
1. Admin → Clients Pro → "Créer un compte pro"
2. Sélectionner `🏛 Agence` dans le dropdown profil → champs crédits offerts masqués, plan recommandé auto-set à "Agence — 149,90€"
3. Bouton final renommé "🏛 Créer le compte et envoyer la proposition" → 2 actions enchaînées : `create_pro` + `unlock_agence_subscription` → mail HTML envoyé

**Cas 2 — Conversion démo → agence** :
1. Admin → fiche du compte démo de type 'agence'
2. Bloc doré "🏛 Compte Agence" → bouton "🏛 Envoyer la proposition agence"
3. Modal de confirmation → débloque `pro_agence_subscription_unlocked = true` + envoi mail HTML
4. Le bouton change d'état : "✅ Proposition envoyée le DD/MM" + liens [🔄 Renvoyer] [🚫 Annuler]

### Activation côté agence (3 états visuels du bloc 🏛 Mon Abonnement)

- **État 1 (`!unlocked`)** : "Votre formule agence se construit avec nous" + bouton "Demander mon devis personnalisé"
- **État 2 (`unlocked && !subscription`)** : "Votre formule agence est prête" + récap 15/30/3 + gros bouton "💳 Finaliser ma souscription" (Stripe Checkout)
- **État 3 (`subscription === agence`)** : "Verimo Pro · Agence — ACTIF" + compteurs (X/15, X/30, 3 agents max, 149,90€) + boutons [⚙️ Gérer mon abonnement] [📞 Demander un rappel] [💬 Ouvrir un ticket]

**Bandeau démo épuisée — version agence** : 1 seul bouton "📞 Je souhaite être rappelé" (pas de "Voir les forfaits" qui enverrait l'agence dans le funnel solo).

**Forfaits solo masqués** pour les profils agence sur `/dashboard/abonnement` (l'agence ne voit que son bloc dédié).

### Tables BDD — colonnes ajoutées

```sql
ALTER TABLE profiles ADD COLUMN pro_agence_subscription_unlocked BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN pro_agence_proposition_sent_at TIMESTAMPTZ;
```

### Edge functions Supabase — actions ajoutées

- `admin-user-management` : `unlock_agence_subscription` (débloque + mail HTML) + `cancel_agence_proposition` (suppression silencieuse, sans mail)
- `pro-checkout-create` : double guard sur le plan agence (vérif `pro_profile_type === 'agence'` + `pro_agence_subscription_unlocked === true` avant création session Checkout)
- `stripe-webhook-pro` : reconnaît `STRIPE_PRICE_AGENCE` et crédite 15 complètes + 30 simples (réutilise plomberie générique cumul plafond 2× + relance échec paiement 7j)

### Template mail HTML proposition

- Sujet : `Verimo Pro · Votre formule agence est prête à activer`
- Header bleu nuit + logo + badge doré "🏛 AGENCE"
- Encart prix 149,90 € HT + mention 179,88 € TTC
- Récap 6 features (📊 📄 👥 🎨 ⏰ ✅)
- CTA "Activer ma formule →" vers `pro.verimo.fr/dashboard/abonnement`
- Signature : L'équipe Verimo / Alexandre Rogelet — Fondateur / pro@verimo.fr (sans téléphone)
- Mobile responsive (@media 680px)

### CGV Pro

Article 4.5 ajouté : tarif, crédits, limite 3 agents, cumul 2 mois, sans engagement, activation sur invitation.

---

## 🔮 Plan Agence V2 multi-utilisateurs (TOUJOURS PRÉVUE PLUS TARD)

⚠️ **À développer quand 2-3 vraies agences clientes V1 confirmeront le besoin** — pas avant. Estimation : **5-15 jours de dev** selon scope.

**Limitation V1** : 1 compte = 1 login partagé entre les 3 agents. Pas de séparation des activités par agent, pas de hiérarchie owner/agent, pas d'invitation autonome de nouveaux agents par l'admin agence.

**V2 — Tables BDD à créer** :
- `agencies` : nom, adresse, SIRET, logo, plan_actif
- `agency_members` : agency_id, user_id, role ('owner' / 'admin' / 'agent'), invited_at, status

**V2 — Modifs tables existantes** :
- `pro_subscriptions` : lier à `agency_id` plutôt qu'à user unique
- `credit_grants` + consommation : pool partagé au niveau agence
- `analyses` : ajouter `agency_id` pour tracking

**V2 — Plans tarifaires hypothétiques (à valider commercialement)** :
| Plan agence | Prix HT | Users | Complètes | Simples |
|------|---------|-------|-----------|---------|
| Agence Starter | 149€ | 3 | 15 | 30 | (= V1 actuelle)
| Agence Pro | 249€ | 5 | 40 | 100 |
| Agence Premium | 499€ | 10+ | 100 | 250 |

---

## 🔮 Feature personnalisation rapports Pro "à votre image" (PRÉVUE PLUS TARD)

✅ **Infra à 70%** : `pro_logo_url` et `pro_company_name` existent en BDD, bucket `pro-logos` configuré, UI upload fonctionnelle dans dashboard pro.

❌ **Manque** : affichage du logo + nom d'agence sur :
- Page `RapportPage` (vue propriétaire)
- Page `RapportPartagePage` (lien public partagé aux clients)
- Pied de page "Analyse propulsée par Verimo"

**Effort réel restant** : 2-3h dev.

**Décision** : à activer uniquement pour Power (différenciateur Starter → Power).

✅ **Architecture déjà en place côté rapport** :
- `RapportPage.tsx` flag `hideVerimoBranding` (default `false`)
- Si user pro consulte son propre rapport OU si envoi via `report_shares` → `hideVerimoBranding = true`
- Titre bloc verdict bascule en *"Avis du professionnel"* (au lieu d'*"Avis Verimo"*) quand pro
- Bouton "Partager" masqué
- ⚠️ Manque l'affichage **du logo pro** + **nom d'agence** dans l'en-tête

---

## 📊 Architecture crédits

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions`
2. **Achats unitaires** → `pro_unit_purchases`
3. **Crédits offerts** → `credit_grants` + trigger `apply_credit_grant`

### Sources de crédits particulier
Stockés directement dans `profiles.credits_document` et `profiles.credits_complete`.

### Fonctions SQL crédits
- **Consommation pro** : `consume_pro_credit(p_user_id, p_credit_type)`
- **Consommation particulier** : `consume_particulier_credit(p_user_id, p_credit_type)`
- **Remboursement crédit interne pro** : `refund_pro_credit(p_user_id, p_credit_type)`
- **Reset cycle abo** : `reset_pro_subscription_credits(p_subscription_id)`
- **Cumul upgrade** : `upgrade_pro_subscription_credits(p_subscription_id, p_new_plan)`
- **Incrément promo** : `increment_promo_uses(code_id)`

### Contraintes BDD
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA
- `analyses.status` : CHECK autorise `pending, processing, queued, completed, failed`
- `user_notifications.analysis_id` : UUID nullable, FK vers `analyses(id)` ON DELETE SET NULL
- `profiles.cgv_pro_accepted_at` : TIMESTAMPTZ nullable
- `profiles.cgv_pro_version` : TEXT nullable
- `profiles.pro_status` : TEXT nullable (`'demo'` | `'active'` | `null`)
- `profiles.pro_demo_started_at` / `pro_demo_converted_at` : TIMESTAMPTZ
- `callback_requests.status` : TEXT default 'pending' (`'pending' | 'called' | 'converted' | 'declined'`)

---

## 📐 Règles de notation — Score /20

| Catégorie | Max |
|-----------|-----|
| Travaux | 5 pts |
| Procédures | 4 pts |
| Finances | 4 pts |
| Diagnostics privatifs | 4 pts |
| Diagnostics communs | 3 pts |
| **TOTAL** | **20 pts** |

---

## ⏳ Backlog — En attente

### 🔥 Priorité haute (avant lancement public Pro)

1. **Régénérer service_role key** (compromise dans screenshots session 11 mai) + recréer le cron avec nouvelle clé
2. **Test E2E pro complet** : souscription Découverte → upgrade Starter → upgrade Power → downgrade → achat unitaire → remboursement
3. **Custom text Stripe Dashboard** → Settings → Branding (mention CGV Pro au checkout)
4. **Liens CGV Pro** dans footer principal + Dashboard Pro → Mon compte → Documents légaux
5. **Validation CGV Pro par avocat** spécialisé (budget 300-500€)
6. **Test résiliation immédiate** sur compte test pro via Stripe Dashboard pour valider le mail V7
7. **Test système callbacks end-to-end** : pro démo épuisée clique "Être rappelé" → admin reçoit cloche + email → marque rappelé → converti, et vérif que le filtre admin se met à jour

### Court terme
8. **Soumission 47 URLs guides** Google Search Console (quota dépassé le 5 mai)
9. **Réactiver le cron `sync-stripe-payments`** quand vieux paiements problématiques expirés
10. **Fix bug racine webhook** : remplacer `if (existing) update else insert` dans `upsertProSubscription` par `.upsert({ onConflict: 'stripe_subscription_id' })` atomique
11. **Fix bug `stripe_payment_id = NULL`** sur upgrades
12. **Fix bug scope `supabase`** dans webhook particulier (ligne 142)
13. **Code promo lancement** "1 analyse offerte" pour campagnes marketing (audience = Pros, quota limité)
14. **Badge dynamique fiche client admin** — Upgrade en cours / Bascule programmée
15. **DPA / Annexe RGPD article 28** (obligatoire dès qu'une agence sérieuse réclame)
16. **Section 11.4 Force majeure** à ajouter dans CGV Pro
17. **Article 7.4 usages interdits explicites** dans CGV Pro
18. **Branding Stripe Checkout** : logo + couleurs + domaine `pay.verimo.fr`
19. **Auto-envoi factures par email Stripe** : activer toggles "Paiements réussis" + "Remboursements"
20. **Rate limiting** (faille #7 audit sécurité) avant 1ère grosse campagne pub
21. **Bannir le mot "co-brandé/co-branding" du site** progressivement
22. **Animation fluide transitions onglets dashboard PRO** (déjà fait côté particulier, à étendre si besoin)

### Moyen terme
23. **Session lifecycle pro complète** (cf section dédiée plus haut)
24. **Personnalisation rapports Power "à votre image"** (2-3h dev, infra à 70%)
25. **Bannière persistante "Paiement à régulariser"** sur dashboard si une facture upgrade plante
26. **Popup bienvenue pro 1ère connexion** (onboarding)
27. **Veille réglementaire** prompt analyser-run
28. **Compare Verimo redesign verdict** (split par bien, "Bien 1"/"Bien 2", forces/issues 2 colonnes)
29. **SLA pour clients grands comptes**
30. **Mailjet tracking erreurs**
31. **Admin support inbox redesign** (split-view dans AdminPage.tsx)
32. **Mode clair/sombre toggle global** (chantier quand 10+ clients pros)

### Pages métier — créer plus tard
33. **`/pro/investisseurs`** : landing dédiée investisseurs immobiliers
34. **`/pro/marchands`** : landing dédiée marchands de bien
35. **`/pro/notaires`** : landing dédiée notaires
36. Une fois les 4 landings existantes, simplifier `/pro` en hub court

### Stratégique pro
37. ~~**Compte Agence V1 (login partagé, 149,90€)**~~ ✅ **LIVRÉ le 27 mai 2026** — V2 multi-utilisateurs (5-15j dev) prévue quand 2-3 agences V1 valideront le besoin
38. **B2B targeting mandataires indépendants** (IAD, Capifrance, SAFTI)
39. **Speak to 10 real pro prospects** avant de coder pro-specific features
40. **Projections honnêtes** : 25k€ MRR sur 18-24 mois, mix solo + agences

### Infra
41. **Vérifier upgrade Supabase Compute NANO → MICRO** (gratuit avec plan Pro)
42. **SIRET sur factures unitaires** : option B `customer.invoice_settings.custom_fields`
43. **Toggles Stripe Checkout** : Politique remboursement / CGV / Coordonnées support

### Démarchage / funnel pro
44. **Créer un exemple de rapport Verimo anonymisé** en PDF — doc le plus puissant en conversion B2B
45. **Rédiger 3 email templates** de démarchage : cold mail / follow-up sans réponse / post-démo
46. **Argumentaire / objections-réponses** pour préparer les démos (RGPD, données client, résiliation, etc.)

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai 2026)

- **Session 27 mai 2026 ⭐ : Plan Agence V1 LIVRÉ + Plaquette PDF Mandataires V8**
  - Produit Stripe créé en LIVE : `prod_UazolFHs7gghhx` / price_id `price_1TbnpDBesXB76oWEdOjLZRh3` (149,90€ HT/mois)
  - Secret Supabase `STRIPE_PRICE_AGENCE` configuré
  - SQL : 2 colonnes ajoutées à `profiles` (`pro_agence_subscription_unlocked`, `pro_agence_proposition_sent_at`)
  - 3 Edge Functions modifiées : `stripe-webhook-pro` (reconnaît plan agence, crédite 15+30), `pro-checkout-create` (double guard avant Checkout), `admin-user-management` (actions `unlock_agence_subscription` + `cancel_agence_proposition` + mail HTML responsive)
  - 3 fichiers front modifiés : `AdminPage.tsx` (bouton 🏛 + 3 états + formulaire création adapté + dropdowns), `DashboardProPage.tsx` (bloc 🏛 avec 3 états + bandeau démo adaptatif + popup succès agence), `CGVProPage.tsx` (article 4.5)
  - Plaquette PDF mandataires V8+ finalisée (13 slides A4 paysage, 3 plans tarifaires solo Découverte/Starter/Power + encart unitaires)
- **Session 25-26 mai 2026 ⭐ : Système rappels pro + Auto-conversion démo + UX polish** (détail section dédiée plus haut)
- **Session 19 mai 2026 ⭐ : Sidebar clair/sombre + refonte Admin Messages + framework priorisation**
  - Système toggle clair/sombre sidebar pro + particulier (localStorage `verimo_sidebar_theme`)
  - Fix tooltips "?" (position fixed + z-index 99999)
  - Refonte visuelle onglet Messages admin (4 filtres, détection auto via préfixe `[PRO —`)
  - Framework de priorisation 4 catégories ajouté
- **Session 17 mai 2026 ⭐ : Feature DPE Travaux préconisés** (validé en prod)
  - Extraction et affichage des 2 packs de travaux DPE + évolution étiquette projetée
  - Architecture sans SQL : enrichissement du JSONB existant uniquement
  - 3 fichiers modifiés : `analyser-run/index.ts` (v10→v11), `RapportPage.tsx`, `DocumentRenderer.tsx`
  - Découverte clé : l'analyse simple utilise `DocumentRenderer.tsx`, pas `TabLogement`
- **Session 16 mai 2026 ⭐ : CGV Pro popup + refonte /pro/rejoindre + refonte profonde MandatairesPage**
  - Popup CGV Pro obligatoire avant 1er paiement pro (SQL `profiles.cgv_pro_accepted_at` + version)
  - Refonte `/pro/rejoindre` avec SiretLookup API gouv recherche-entreprises
  - Renommage URLs : `/rejoindre` → `/pro/rejoindre`, `/pro/mandataires` → `/pro/agents-mandataires`
  - MandatairesPage v6 refonte profonde (1066 lignes)
  - Décision UX : "co-brandé" banni → "à votre image"
- **Session 15 mai 2026 ⭐ : Système notifications cliquables + Refonte ProPage et MandatairesPage v1**
  - SQL `user_notifications.analysis_id` + edge function `analyser-run` v10
  - Notifications cloche cliquables systématiques en fin d'analyse réussie
  - Fonction SQL `consume_particulier_credit` atomique
- **Session 14 mai 2026 ⭐ : Plaquette PDF démarchage Pro V7 finalisée** (6 slides)
- **Session 13 mai 2026 : Page `/rejoindre` multi-step 4 étapes + Mailjet configuré**
- **Session 12 mai 2026 : Refonte UI compte pro Dashboard + refonte analyse COMPROMIS**
- **Session 11-12 mai 2026 ⭐ : Mail résiliation pro V7, bannières dashboard, codes promo ciblage**
- **Session 11 mai 2026 ⭐ : Bug paiements résolu + filet de sécurité `sync-stripe-payments` V2**
- **Session 10-11 mai 2026 : 📜 CGV Pro V2.3 + admin alerts**
- **Session 10 mai 2026 : 🔐 Audit sécurité complet du système de paiement + refonte CA admin V2**

### Sessions plus anciennes
- **Avril 2026** : Stripe production, admin support inbox split-view, pages légales, SEO complet, dossiers pro complets, credit_grants + trigger, popups succès, page Guides
- **Antérieurement** : Conception initiale, prompt enrichi, scoring déterministe /20, comparaison v1, AdminPage, dashboard pro, edge functions, config DNS pro.verimo.fr

---

## 🎯 Prochaine session — Actions prioritaires

### 🔥 BUGS BLOQUANTS à fixer en priorité absolue

1. **Bug "Erreur d'affichage" sur l'onglet Compromis** (RapportPage.tsx → TabCompromis)
   - Symptôme : sur une analyse complète avec compromis, l'onglet affiche le fallback `SafeTabBoundary` au lieu du contenu
   - Investigation : ouvrir DevTools console, identifier l'erreur runtime précise dans `RendererCompromis`
   - Fix probable : adapter la reconstruction de structure dans `TabCompromis` ou normaliser avant de passer à `RendererCompromis`
   - **Impact** : bloque toute la valeur ajoutée de l'analyse compromis enrichie

2. **UX "Compléter mon dossier" — 3 frictions** (à traiter ensemble dans une mini-session UX)
   - **(a)** Faux progress bar qui se bloque à 90% sans feedback pendant 4-5 min → remplacer par une vraie indication d'étape (`Téléversement…` → `Lecture par notre moteur…` → `Synthèse en cours…`) ou un spinner avec messages tournants
   - **(b)** Reformuler "Ne fermez pas cette fenêtre" en rassurant : *"Vous pouvez fermer cette fenêtre, l'analyse continue en arrière-plan. Vous recevrez une notification quand elle est prête."* (ce qui est techniquement vrai vu que ça tourne en edge function)
   - **(c)** Ajouter un mini-écran pédagogique AVANT le lancement de Compléter : *"L'ajout de nouveaux documents va réanalyser l'intégralité de votre dossier pour croiser les informations. Votre rapport sera enrichi, et certains points (score, négociation, vigilances) peuvent être actualisés. Cela prend ~5 minutes selon le volume."*
   - **Impact** : actuellement le user croit à un bug et/ou ne comprend pas pourquoi son rapport change

### Côté push immédiat (en attente d'Alex)
3. **Tester système callbacks end-to-end** : pro démo épuisée clique "Être rappelé" → admin reçoit cloche + email → marque "Rappelé" → "Converti" → vérif que le filtre admin se met à jour
4. **Tester auto-conversion démo→actif** : compte démo souscrit un abo Stripe → vérif que `pro_status` passe à `'active'` + bandeaux démo disparaissent
5. **Tester bouton "Activer le compte" manuel** : compte démo → clic bouton → modal → activer avec/sans crédits → vérif que les bandeaux disparaissent
6. **Tester création démo enrichie** : créer un compte démo avec téléphone + SIRET + adresse → vérif que ces infos remontent bien dans la fiche admin + pré-remplissage tel dans modal "Être rappelé"
7. **Tester modification type profil** depuis fiche admin (clic badge → dropdown → changer → vérif filtre)
8. **Tester filtres combinés** dans ClientsProTab (ex: "🎁 Démo" + "📈 Investisseur")
9. **Tester nouvelle UX transitions onglets** dashboard particulier (entre Tarifs / Comparaison / Mon compte)
10. **Tester fix frais notaire** : analyse simple d'un compromis → vérifier que les frais affichent ~7,5% (au lieu de 3% pour bien <5 ans) + tooltip ⓘ visible et explicatif

### Côté technique/produit (en attente)
11. **Régénérer service_role key** + recréer le cron Supabase
12. **Test E2E complet du cycle pro** : souscription / upgrade / downgrade / unitaire / remboursement
13. **Soumettre les 47 URLs guides** Google Search Console
14. **Réactiver le cron sync-stripe-payments** quand vieux paiements expirés

### Côté funnel pro / démarchage
15. **Créer un exemple de rapport Verimo anonymisé** en PDF
16. **Rédiger 3 email templates** de démarchage : cold mail / follow-up / post-démo
17. **Argumentaire / objections-réponses** pour préparer les démos (inclure objection *"Verimo peut faire des erreurs ?"* avec comparaisons MeilleursAgents/PERVAL/simulateurs DPE)

### Session dédiée à prévoir
18. **Session lifecycle pro** : Suspendre / Lever / Résilier / Webhook Stripe résiliation / past_due / suppression user sans casser Stripe / badges statuts admin

**Méthode** :
1. Coller ce context.md en début de conversation
2. Valider chaque chantier avant de coder
3. Une étape à la fois, fichiers livrés via `present_files` depuis `/mnt/user-data/outputs/`
4. Pas de code sans accord
5. Tester sur compte pro démo après chaque étape
