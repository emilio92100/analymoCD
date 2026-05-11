# VERIMO — Contexte projet — 11 mai 2026

> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## 🛠️ Méthode de travail avec Alex

- **Profil** : débutant développement, modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- **Repo** : `github.com/emilio92100/analymoCD`
- Claude clone `https://github.com/emilio92100/analymoCD.git` et livre les fichiers **complets** via `present_files` depuis `/mnt/user-data/outputs/`
- Alex push manuellement sur GitHub
- **Vercel redéploie auto** le frontend après chaque push GitHub
- ⚠️ **Edge Functions Supabase NE sont PAS déployées par push GitHub** — il faut aller manuellement dans Supabase → Edge Functions → coller le code → Deploy. Bug récurrent : Alex push, l'erreur persiste, c'est parce que l'edge function n'est pas redéployée
- **Ne jamais coder sans accord préalable** — toujours échanger et valider avant de toucher au code
- **Une étape à la fois** — pas 10 actions d'un coup
- **Réponses courtes et concises** — pas de pavés sauf question technique précise
- **Pas de QCM cascade** — quand Alex demande un choix, lui en proposer 2-4 max
- **Challenger les sur-ingénieries** — Alex préfère faire simple
- **Mot "IA" / "AI" banni** des pages publiques Verimo (HomePage, ExemplePage, TarifsPage, MethodePage, ContactPage, ProPage, ContactProPage, RapportPage, Navbar, Footer) — utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte". AI uniquement autorisé dans admin, edge functions, prompts, logs, context.md.
- **Tests live avec vraie carte CB d'Alex** (pas Visa 4242)
- Compte test live actuel : Jean DUMONT / ARTY CONSEIL (acct_1TIateBesXB76oWE)
- User test pro : `publicite92320@gmail.com` (ID `217468f6-0f2b-4487-865e-a277cc600e45`)
- Nouveau compte test 11 mai : `alexandre.rt25@gmail.com` (customer Stripe `cus_UUgPam3KYnmpzC`)

---

## 📦 Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière, modificatifs RCP, fiche synthétique...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour appartements et maisons.

**Slogan** : *Vos documents décryptés, votre décision éclairée.*
**H1 HomePage** : *Analysez vos documents immobiliers avant de signer.*
**Cible** : Acheteurs particuliers (primo-accédants, RP) et professionnels (agents immo, investisseurs, marchands de bien, notaires).

---

## 💰 Tarification

### Particuliers
- 4,90€ → 1 crédit analyse simple (1 doc) — PAS de score /20
- 19,90€ → 1 crédit analyse complète (jusqu'à 15 docs)
- 29,90€ → 2 crédits (Pack 2 biens)
- 39,90€ → 3 crédits (Pack 3 biens)
- Crédits jamais expirés

### Pros — Abonnements mensuels HT
| Plan | Prix HT/mois | Complètes | Simples |
|------|-------------|-----------|---------|
| Découverte | 19,90€ | 1 | 3 |
| Starter | 49,90€ | 5 | 15 |
| Power | 89,90€ | 10 | 30 |

**Achats unitaires pro (réservés aux abonnés)** : Complète 9,90€ HT · Simple 2,90€ HT

### Stripe Price IDs (PRODUCTION)

```
# Particuliers
document : price_1TTtd1BesXB76oWECAGA9ywf
complete : price_1TTtd2BesXB76oWEsZ9LsLS9
pack2    : price_1TTtcxBesXB76oWETkokxLgB
pack3    : price_1TTtczBesXB76oWEloTMvEZF

# Pro
DECOUVERTE 19,90€ → price_1TTtd1BesXB76oWEZuILxjwe
STARTER 49,90€    → price_1TTtczBesXB76oWEcKaNR2BW
POWER 89,90€      → price_1TTtcxBesXB76oWEPyVYZjCj
UNIT_COMPLETE 9,90€ → price_1TTtcyBesXB76oWEBF1TLHYz
UNIT_SIMPLE 2,90€   → price_1TTtd2BesXB76oWEVM0p27GS

# TVA France 20% (mode exclusif HT)
TVA Tax Rate ID : txr_1TUAxVBesXB76oWESXBnGdIZ
```

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
  - `pro@verimo.fr` → email B2B (UNIQUEMENT relations pros et CGV Pro)
  - `notification@verimo.fr` → Mailjet particuliers
  - `contact@verimo.fr` → emails sortants pros (avec nom agent dans body)

---

## ⚙️ Edge Functions Supabase (production)

| Nom | Rôle | Version |
|-----|------|---------|
| `analyser` | Lance une analyse — gère la queue Anthropic 503 | v8 |
| `analyser-run` | Worker qui traite l'analyse en background | — |
| `analyser-retry` | Cron pg_cron 5 min — retraite les analyses queued (12 retries max) | — |
| `comparer` | Compare 2 ou 3 rapports | — |
| `admin-user-management` | Actions admin (create, invite, delete, reset password) | — |
| `pro-checkout-create` | Stripe pro : subscribe / preview_upgrade / buy_unit / cancel / cancel_scheduled_change / reactivate / billing_portal / list_invoices | V3 |
| `stripe-webhook-pro` | Webhook Stripe pro (5 events) | **V5** |
| `stripe-webhook` | Webhook Stripe particuliers (checkout.session.completed) | **V3.1** |
| `create-checkout-session` | Stripe particuliers (checkout) | **V2** |
| `sync-stripe-payments` | **NOUVEAU** filet de sécurité — sync Stripe → table `payments` toutes les 5 min via pg_cron | **V2** |

⚠️ **Rappel critique** : push GitHub ne déploie pas les edge functions → toujours redéployer manuellement dans Supabase Studio.

### Webhooks Stripe configurés (Stripe Dashboard)

- **Verimo - Pro** → `stripe-webhook-pro` : 4 events (checkout.session.completed, customer.subscription.deleted, customer.subscription.updated, invoice.paid) + `charge.refunded`
- **Verimo - Particuliers** → `stripe-webhook` : checkout.session.completed + `charge.refunded`

> Note : `checkout.session.completed` est envoyé aux 2 webhooks (config Stripe). Mes V5/V3.1 contiennent un filtre qui fait skip silencieux si le paiement n'est pas pour ce webhook (basé sur `metadata.userId` vs `metadata.user_id`).

### Cron Supabase pg_cron actif

```
jobname = 'sync-stripe-payments-every-5min'
schedule = '*/5 * * * *'
id = 2 dans cron.job
```

⚠️ **Service_role key compromise** durant la session du 11 mai (partagée dans screenshots). À régénérer + recréer le cron avec la nouvelle clé.

---

## 🗺️ Routes principales

```
/                              → HomePage
/pro                           → ProPage
/tarifs                        → TarifsPage
/exemple                       → ExemplePage
/methode                       → MethodePage
/guides                        → GuidesPage
/cgv-pro                       → CGVProPage (B2B, scroll spy, 14 sections)
/connexion, /inscription       → Auth
/admin                         → AdminPage
/dashboard                     → SmartDashboard (détecte role)
/dashboard/nouvelle-analyse    → NouvelleAnalyse
/dashboard/analyses            → MesAnalyses (particulier)
/dashboard/dossiers            → MesDossiersPro (pro)
/dashboard/dossier/:id         → DossierDetail (pro)
/dashboard/abonnement          → MonAbonnement (pro)
/dashboard/compte              → Compte ou ComptePro
/dashboard/support             → Support
/rapport?id=XXX                → RapportPage
```

---

## 💳 Système d'abonnement Pro Stripe — État actuel (✅ stable)

**Le système Stripe pro est entièrement opérationnel et testé en live**. Tous les bugs critiques identifiés en mai 2026 ont été résolus, et un filet de sécurité (sync auto) a été ajouté le 11 mai pour rattraper les paiements manqués par le webhook (cf. section dédiée plus bas).

### Flow d'upgrade (paiement immédiat)
- `proration_behavior: 'none'` + `billing_cycle_anchor: 'now'` → cycle redémarre, plein tarif facturé immédiatement
- `payment_behavior: 'default_incomplete'` → permet de gérer 3DS, carte refusée, etc.
- 4 cas gérés côté backend :
  - ✅ Paiement direct OK → popup vert "Plan activé !" + crédits cumulés
  - 🔐 3DS demandé → popup Stripe inline → si validé OK
  - ❌ Carte refusée → popup rouge contextuelle "Mettez à jour votre moyen de paiement"
  - ⏳ Paiement en cours → popup "Patientez, rafraîchissez"
- **Sécurité backend** : webhook `customer.subscription.updated` vérifie `latest_invoice.status === 'paid'` AVANT de cumuler les crédits → impossible de bénéficier d'un upgrade sans paiement effectif
- **Pas de retry automatique** sur upgrade échoué (contrairement aux renouvellements de cycle où Stripe retente 3 fois)

### Flow de downgrade (Stripe Subscription Schedule)
- Création d'un `subscription_schedule` via `from_subscription` → bascule programmée à `current_period_end`
- Mode `cancel_scheduled_change` permet d'annuler une bascule programmée
- Stockage BDD dans colonnes `pro_subscriptions.scheduled_plan_change` + `scheduled_change_date` pour affichage UX
- Si schedule existe déjà et pro demande **même plan** : refus propre `same_plan_already_scheduled`
- Si schedule existe déjà et pro demande **autre plan** : popup ambre "Voulez-vous remplacer le changement programmé ?"
- Bouton "Passer à ce plan" **désactivé** sur le plan déjà programmé (affiche "Passage programmé le DATE")
- Bouton "Annuler ce changement" sur la carte du plan actif si scheduled_plan_change rempli
- Webhook nettoie scheduled_* aux moments clés (upgrade payé, renouvellement, résiliation)

### Schéma BDD pro_subscriptions (colonnes clés)
```sql
- user_id, plan, status, stripe_subscription_id, stripe_customer_id
- credits_complete_total/used, credits_simple_total/used
- current_period_start, current_period_end
- cancel_at_period_end, cancellation_reason
- scheduled_plan_change, scheduled_change_date
```

### Bandeau past_due
- Confirmé actif sur Dashboard Pro (lignes 6438-6489 DashboardProPage.tsx)
- Rouge, sur toutes pages, bouton "Mettre à jour ma carte" → `openBillingPortal` Stripe
- Bloque changement plan si past_due
- Stripe Smart Retries actif (4 tentatives sur 3 semaines), emails auto Stripe activés

---

## 🔐 Sécurité paiements (✅ TERMINÉ)

8 failles identifiées et corrigées sur le système de paiement particulier + bugs annexes pro. Tous fixés et déployés en prod.

### Reste dans l'audit (non bloquant)

- **#7 Rate limiting** : à activer avant la 1ère grosse campagne pub. Soit Supabase rate limiter natif, soit compteur applicatif (max 10 sessions Checkout / heure / user).

---

## ✅ CA admin V2 + remboursements + sync auto (TERMINÉ)

### Refonte effectuée
- Schéma `payments` enrichi : `customer_type`, `amount_ht`, `refunded_amount`, statuts (`completed`, `refunded`, `partially_refunded`)
- Backfill historique fait
- Webhook `charge.refunded` ajouté sur les 2 webhooks → sync remboursements totaux + partiels
- Calcul CA admin réécrit pour lire uniquement `payments`, filtrer status refunded, déduire `refunded_amount` pour partiels
- Affichage HT/TTC universel sur AdminPage (Pros : HT en premier, Particuliers : TTC)
- Filtres pro/particulier via `customer_type`

### Décisions produit appliquées
- Q1 (remboursement partiel) : "Remboursé partiellement : X€ sur Y€"
- Q2 (crédits si annulation totale) : tout retirer
- Q3 (CA affiché) : CA net uniquement

### Suppression user pro
- `auth.admin.signOut(user_id, 'global')` AVANT `deleteUser`
- ALTER NULL sur user_id de payments / pro_unit_purchases, FK SET NULL, backfill customer_email/name

---

## 🆕 Sync auto Stripe → payments (Session 11 mai 2026) ⭐

**Mis en place suite à un bug paiement persistant** : race condition entre webhooks Stripe parallèles (`invoice.paid` + `checkout.session.completed` + `subscription.updated`) qui tentaient tous d'insérer dans `pro_subscriptions` → conflit sur `idx_pro_subscriptions_active_user` → l'un plante, `recordProPayment` jamais appelé → paiement absent du CA admin.

**Solution adoptée** : edge function `sync-stripe-payments` V2 (411 lignes) qui :
- Tourne toutes les 5 min via pg_cron
- Récupère les `paymentIntents` Stripe des 3 derniers jours (avec `expand: ['data.latest_charge', 'data.invoice']`)
- Pour chaque paiement :
  - Si absent de `payments` → l'insère avec description identifiée via `price_id`
  - Si présent avec statut différent → met à jour (`refunded`, `partially_refunded`)
  - Si présent avec description générique → corrige rétroactivement
- Mappings hardcodés (cohérents avec webhook) : `PRICE_TO_PLAN`, `PRICE_TO_UNIT_PRO`, `PRICE_TO_UNIT_PART`
- Fallback par montant en cents si identification échoue : 490, 1990, 2990, 3990, 348, 1188, 2388, 5988, 10788
- Génère alerte info dans `system_alerts` UNIQUEMENT si quelque chose a vraiment été corrigé

**Sécurité** :
- Toggle **"Verify JWT with legacy secret" ON** dans Settings de la fonction (pas de check d'auth interne)
- pg_cron passe la service_role key dans Authorization header

**SQL cron** :
```sql
SELECT cron.schedule(
  'sync-stripe-payments-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://veszrayromldfgetqaxb.supabase.co/functions/v1/sync-stripe-payments',
    headers:=jsonb_build_object(
      'Authorization', 'Bearer <service_role_key>',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

**Tests validés** :
- Paiement 23,88€ inséré + description corrigée en "Abonnement Découverte (souscription)"
- Statut 3,48€ remboursé passé en `refunded`
- 2× 4,90€ particuliers remboursés passés en `refunded`
- Test live upgrade Découverte → Starter : webhook a marché direct (59,88€ inséré avec "Abonnement Starter (upgrade depuis Découverte)")

**Le webhook reste source de vérité** pour les actions immédiates (crédits, activation abo). La sync NE rattrape PAS les crédits/abos en cas de panne webhook — uniquement la table `payments`. À ce jour, le webhook plante seulement sur `pro_subscriptions` (race condition), pas sur les crédits.

---

## 🆕 Fix catégorisation AdminPage (Session 11 mai 2026) ⭐

**Bug découvert pendant les tests** : description "Abonnement Starter (upgrade depuis Découverte)" était catégorisée dans **Abo Découverte** au lieu de **Abo Starter**, car le code admin testait `desc.includes('découverte')` AVANT `desc.includes('starter')` → le mot "Découverte" dans "(upgrade depuis Découverte)" matchait en premier.

**Fix appliqué** dans `AdminPage.tsx` (2 blocs lignes ~1818 et ~2260) :
```js
const isAbo = desc.startsWith('abonnement');
if (isAbo && desc.includes('abonnement starter')) → Starter
else if (isAbo && desc.includes('abonnement power')) → Power
else if (isAbo && desc.includes('abonnement découverte')) → Découverte
```

**Vérifié que les autres catégories n'ont PAS le bug** :
- Pack 2/3 particulier : test `pack 3` avant `pack 2` avant `complète` avant `simple` ✅
- Unitaires pro/particulier : test `complète` avant `simple` ✅

---

## 📜 CGV Pro publiée (Session 10-11 mai 2026)

**Page `/cgv-pro` créée** — 552 lignes, V2.3, design B2B distinct, scroll spy, 14 sections.

### Conclusions juridiques B2B (recherche approfondie)
- Loi Hamon (17 mars 2014) = article **L221-3** étend protection aux pros UNIQUEMENT pour contrats HORS ÉTABLISSEMENT (démarchage physique, foires, salons), PAS contrats à distance
- 3 conditions cumulatives L221-3 : hors établissement + objet hors activité principale + ≤5 salariés
- **Verimo = contrat à distance B2B → L221-3 NE S'APPLIQUE PAS**
- **Conclusion : aucun droit de rétractation pour les pros sur Verimo** (souscription, renouvellement, upgrade, achat unitaire)
- Pour particuliers : 14j L221-18 OUI mais neutralisable via case L221-28 13° "consentement exécution immédiate" — déjà à chaque achat dans `Tarifs.tsx` ligne 110 (correct juridiquement)
- Jurisprudence : arrêt Cour d'appel Versailles 28/10/2021 (chariot élévateur), arrêt Cass 12-09-2018 (architecte site web)

### Modifications associées
- Badge "Remboursable 14j" retiré pour pros dans admin (AdminPage.tsx lignes ~2913, ~5480, ~5583)
- Mention "En souscrivant à Verimo Pro, vous acceptez nos CGV Pro" sous CTA final ProPage
- FAQ ProPage 2 colonnes indépendantes (pairs gauche / impairs droite, flexbox manuel)
- pro@verimo.fr utilisé UNIQUEMENT dans CGV Pro (3 occurrences)
- Éditeur VERIMO APP + Responsable Alexandre ROGELET dans bloc contact

---

## 📊 Architecture crédits (inchangée)

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions` (`credits_complete_total/used`, `credits_simple_total/used`)
2. **Achats unitaires** → `pro_unit_purchases` (avec `credits_remaining`)
3. **Crédits offerts** → `credit_grants` + trigger `apply_credit_grant`

### Fonctions SQL crédits
- **Consommation** : `consume_pro_credit(p_user_id, p_credit_type)`
- **Remboursement crédit interne** : `refund_pro_credit(p_user_id, p_credit_type)` (analyse plantée)
- **Reset cycle abo** : `reset_pro_subscription_credits(p_subscription_id)`
- **Cumul upgrade** : `upgrade_pro_subscription_credits(p_subscription_id, p_new_plan)`
- **Incrément promo** : `increment_promo_uses(code_id)` (réutilisée par webhook particulier V3.1)

### Contraintes BDD
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA
- `analyses.status` : CHECK autorise `pending, processing, queued, completed, failed`

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
2. **Configurer mailbox `pro@verimo.fr`** chez OVH/Google Workspace (reception fonctionnelle) — mentionnée dans CGV Pro
3. **Test E2E pro complet** : souscription Découverte → upgrade Starter → upgrade Power → downgrade → achat unitaire → remboursement → confirmer remontée admin pour chaque étape
4. **Implémenter case à cocher OBLIGATOIRE** "J'accepte les CGV Pro" avant paiement pro (stockage BDD : `cgv_pro_accepted_at` + `cgv_version` dans `pro_subscriptions`)
5. **Custom text Stripe Dashboard** → Settings → Branding (mention CGV Pro au checkout)
6. **Liens CGV Pro** dans footer principal + Dashboard Pro → Mon compte → Documents légaux
7. **Validation CGV Pro par avocat** spécialisé (budget 300-500€)

### Court terme
8. **Fix bug racine webhook** : remplacer `if (existing) update else insert` dans `upsertProSubscription` par `.upsert({ onConflict: 'stripe_subscription_id' })` atomique (la sync compense, mais le fix propre est plus sain)
9. **Badge dynamique fiche client admin** — Upgrade en cours / Bascule programmée (15 min, lecture `pro_subscriptions.scheduled_plan_change`)
10. **DPA / Annexe RGPD article 28** (obligatoire dès qu'une agence sérieuse réclame)
11. **Section 11.4 Force majeure** à ajouter dans CGV Pro
12. **Article 7.4 usages interdits explicites** dans CGV Pro
13. **Soumission 47 URLs guides** Google Search Console (quota dépassé le 5 mai)
14. **Branding Stripe Checkout** : logo + couleurs + domaine `pay.verimo.fr`
15. **Auto-envoi factures par email Stripe** : activer toggles "Paiements réussis" + "Remboursements" dans Stripe Settings → Customer emails
16. **Rate limiting** (faille #7 audit sécurité) avant 1ère grosse campagne pub

### Moyen terme
17. **Bannière persistante "Paiement à régulariser"** sur dashboard si une facture upgrade plante
18. **Popup bienvenue pro 1ère connexion** (onboarding)
19. **Veille réglementaire** prompt analyser-run
20. **Compare Verimo redesign verdict** (split par bien, "Bien 1"/"Bien 2", forces/issues 2 colonnes)
21. **Mention CGV discrète** dans popup TVA upgrade (sans checkbox bloquante)
22. **SLA pour clients grands comptes**
23. **Investiguer erreurs Deno.core.runMicrotasks** dans logs edge functions (faux positif a priori)
24. **Mailjet tracking erreurs**
25. **Admin support inbox redesign** (split-view dans AdminPage.tsx)
26. **Mode clair/sombre toggle global** (chantier quand 10+ clients pros)
27. **Bug race condition redirect post-checkout** (cache navigateur garde ancien rôle, F5 résout)

### Stratégique pro
28. **Pro dashboard architecture B2B** : Option B (`/dashboard` + `/dashboard/pro` même domaine)
29. **B2B targeting mandataires indépendants** (IAD, Capifrance, SAFTI) — tiers 29/59/129€/mois proposés
30. **Speak to real pro prospects** avant de coder pro-specific features
31. **White-label PDFs** : soft co-branding recommandé (vs full white-label)
32. **Projections honnêtes** : 150-500k€ ARR en 3 ans avec bonne exécution

### Infra
33. **Vérifier upgrade Supabase Compute NANO → MICRO** (gratuit avec plan Pro, double RAM + Disk IO Budget)
34. **SIRET sur factures unitaires** : option B `customer.invoice_settings.custom_fields`
35. **Toggles Stripe Checkout** : Politique remboursement / CGV / Coordonnées support

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai 2026)

- **Session 11 mai 2026 (nuit, ~3h30)** : ⭐ **Bug paiements résolu + filet de sécurité opérationnel**
  - Identification race condition entre webhooks Stripe parallèles (`invoice.paid` + `checkout.session.completed` + `subscription.updated`) sur index unique `idx_pro_subscriptions_active_user`
  - Création edge function `sync-stripe-payments` V2 (411 lignes) avec récupération charges expand, identification produit via price_id, fallback par montant, descriptions exactes alignées webhook, correction rétroactive
  - Déploiement Supabase + activation toggle "Verify JWT with legacy secret"
  - Configuration cron pg_cron `*/5 * * * *` (id=2)
  - Tests validés : 23,88€ inséré + corrigé, 3,48€ remboursé synchronisé, 2× 4,90€ particuliers refunded, upgrade Découverte→Starter (59,88€) inséré direct par webhook
  - Découverte + fix bug AdminPage : description "Abonnement Starter (upgrade depuis Découverte)" était mal catégorisée → fix logique `desc.startsWith('abonnement')` + `desc.includes('abonnement starter')` en 1er
- **Session 10-11 mai 2026 (nuit)** : 📜 **CGV Pro V2.3 + admin alerts + recherche juridique**
  - Création complète page CGV Pro (552 lignes, design B2B distinct, scroll spy, 14 sections, route `/cgv-pro`)
  - Recherche juridique L221-3 / L221-1 / loi Hamon → pas de rétractation pour pros (contrat à distance)
  - Retrait badge "Remboursable 14j" pour pros dans admin
  - Fix FAQ ProPage 2 colonnes indépendantes (cartes Pinterest-style)
  - Mention CGV Pro sous CTA ProPage (Option A)
  - Refonte System Alerts admin (catégories + grouping + explanations)
  - Filtre Clients Pro élargi (états résiliation)
- **Session 10 mai 2026 (soir)** : 🔐 **Audit sécurité complet du système de paiement** + refonte CA admin V2
  - 7 failles corrigées + déployées (JWT, idempotence, promo, successUrl, anon key, payment methods, email pré-rempli)
  - Bug A corrigé : helper `safeDate()` dans webhook pro V5 → plus de 500 ERR sur `customer.subscription.updated` quand timestamps Stripe null
  - Bug B corrigé : filtres skip silencieux dans V5 et V3.1 → fini les fausses alertes admin "Paiement reçu sans user_id" entre webhooks
  - Popup paiement premium côté particulier (animation spring)
  - Refonte CA admin V2 : `customer_type`, `amount_ht`, `refunded_amount`, statuts refunded/partially_refunded, HT/TTC universel
  - Webhook `charge.refunded` ajouté sur les 2 webhooks
  - Sidebar pro refonte : BG `#16475a`, menu 3 groupes (Pilotage/Mon espace/Assistance), pastilles crédits 44×30px
- **Session 10 mai (matin)** : Suite fix Stripe pro, refonte UX downgrade complet (popups confirmation/remplacement/annulation, bouton "Annuler ce changement", sidebar BASCULE PROGRAMMÉE), bouton "Passage programmé" désactivé, popup erreur contextuelle, agrandissement typo popups, message facture remplacé "📁 Retrouvez votre facture dans Mon abonnement", filtre Mes factures payées côté pro, redesign cartes plans (Direction 3 + Power anthracite + theme dynamique selon plan actif + couleurs claires + suppression badges nom plan + alignement boutons + boutons unitaires bleu Verimo)
- **Sessions précédentes mai 2026** : Stripe pro complet (proration_behavior, schedule downgrade, payment_behavior 3DS), facturation B2B (adresse, SIRET), faille sécurité upgrade non payé (vérif latest_invoice.status), table payments pour stats admin, refonte UX page abonnement pro (badges sans engagement, tooltips, sidebar états colorés)
- **Session 30 (7 mai 2026)** : RapportPage logique RCP, KPI dashboard, archivage dossiers pro, badges "⏳ En queue", mobile UX

### Sessions plus anciennes (avril 2026)
- **Sessions 25-29** : Stripe production, admin support inbox split-view, pages légales, SEO complet (canonical, GuidesPage), redesign admin sidebar catégorisée
- **Sessions 21-24** : Dossiers pro complets, credit_grants + trigger, code promo, popups succès, page Guides, optimisation SEO mots-clés
- **Sessions 1-20** : Conception initiale, prompt enrichi, scoring déterministe /20, comparaison v1, AdminPage, dashboard pro, edge functions, config DNS pro.verimo.fr

---

## 🎯 Prochaine session — Actions prioritaires

1. **Push GitHub** : `supabase/functions/sync-stripe-payments/index.ts` (pour traçabilité versionnée) + `AdminPage.tsx` (fix catégorisation upgrade)
2. **Régénérer service_role key** + recréer le cron Supabase avec la nouvelle clé
3. **Configurer mailbox `pro@verimo.fr`** avant publication CGV Pro
4. **Test E2E complet du cycle pro** : souscription / upgrade / downgrade / unitaire / remboursement
5. **Case à cocher CGV Pro obligatoire** avant paiement pro (cgv_pro_accepted_at + cgv_version)
6. **Fix bug racine webhook** : `.upsert({ onConflict: 'stripe_subscription_id' })` dans `upsertProSubscription`

**Méthode** :
1. Coller ce context.md en début de conversation
2. Valider chaque chantier avant de coder
3. Une étape à la fois, fichiers livrés via `present_files` depuis `/mnt/user-data/outputs/`
4. Pas de code sans accord
5. Tester sur compte pro `publicite92320@gmail.com` ou `alexandre.rt25@gmail.com` après chaque étape
