# VERIMO — Contexte projet — 10 mai 2026 (soir)

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

⚠️ **Rappel critique** : push GitHub ne déploie pas les edge functions → toujours redéployer manuellement dans Supabase Studio.

### Webhooks Stripe configurés (Stripe Dashboard)

- **Verimo - Pro** → `stripe-webhook-pro` : 4 events (checkout.session.completed, customer.subscription.deleted, customer.subscription.updated, invoice.paid)
- **Verimo - Particuliers** → `stripe-webhook` : 1 event (checkout.session.completed)

> Note : `checkout.session.completed` est envoyé aux 2 webhooks (config Stripe). Mes V5/V3.1 contiennent un filtre qui fait skip silencieux si le paiement n'est pas pour ce webhook (basé sur `metadata.userId` vs `metadata.user_id`).

---

## 🗺️ Routes principales

```
/                              → HomePage
/pro                           → ProPage
/tarifs                        → TarifsPage
/exemple                       → ExemplePage
/methode                       → MethodePage
/guides                        → GuidesPage
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

**Le système Stripe pro est entièrement opérationnel et testé en live**. Tous les bugs critiques identifiés en mai 2026 ont été résolus.

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

---

## 🔐 Audit sécurité paiements — Session 10 mai 2026 (✅ TERMINÉ)

8 failles identifiées et corrigées sur le système de paiement particulier + bugs annexes pro.

### Failles corrigées (déployées en prod)

| # | Faille | Fix |
|---|---|-----|
| 1 | `userId` non vérifié côté serveur (create-checkout-session) | JWT obligatoire, userId pris du JWT |
| 2 | Code promo consommé avant paiement | Insert promo_uses + RPC increment_promo_uses déplacés dans webhook |
| 3 | Promo "déjà utilisée" non vérifiée serveur | Check serveur ajouté |
| 4 | Pas d'idempotence webhook particulier | Table `processed_stripe_events` partagée avec webhook pro |
| 5 | `successUrl` modifiable (phishing) | URL hardcodée serveur |
| 6 | Anon key hardcodée dans le bundle JS | Migration vers `supabase.functions.invoke()` |
| 8 | Cartes uniquement (perte conversion mobile) | Méthodes gérées via Stripe Dashboard (Apple Pay/Google Pay/Link) |

### Bonus session

- ✅ Email pré-rempli sur Stripe Checkout particulier (`customer_email: user.email`)
- ✅ **Bug A** : 500 ERR sur `customer.subscription.updated` (timestamps null) → helper `safeDate()` ajouté dans webhook pro V5
- ✅ **Bug B** : Pollution alertes admin entre webhooks → filtres skip silencieux dans V5 et V3.1
- ✅ Popup paiement premium (côté particulier Tarifs.tsx) — animation spring, design calqué sur le pro

### Reste dans l'audit (non bloquant)

- **#7 Rate limiting** : à activer avant la 1ère grosse campagne pub. Soit Supabase rate limiter natif, soit compteur applicatif (max 10 sessions Checkout / heure / user).

---

## ⚠️ Dette technique identifiée — Refonte CA admin V2 (PROCHAINE SESSION)

**Découverte session 10 mai (soir)** : le calcul du CA admin n'est pas cohérent et ne gère pas les remboursements.

### Constats

1. **Sources multiples pour le CA admin :**
   - CA Particulier → lit `payments`
   - CA Pro abos → lit `pro_subscriptions` (calculé via `PLAN_PRICES[plan]`, pas via les vrais montants payés)
   - CA Pro unitaires → lit `pro_unit_purchases`
   - **Conséquence** : un abo pro peut être compté dans le CA même si la ligne `payments` n'existe pas (cas vu cette nuit où le webhook plantait avant `recordProPayment`)

2. **Remboursements Stripe non synchronisés :**
   - Aucun webhook ne gère les events `charge.refunded` / `charge.refund.updated`
   - Quand admin rembourse sur Stripe → la BDD ne le sait pas
   - Fiche client n'affiche pas "Remboursé"
   - CA admin continue de compter les paiements remboursés (sauf effet de bord constaté : `customer.subscription.updated` met `current_period_start` à NULL → exclut l'abo du calcul, mais c'est un coup de bol pas une logique)

3. **HT vs TTC mélangés :**
   - Particulier 4,90€ = HT (pas de TVA)
   - Pro 107,88€ = TTC (89,90€ HT + TVA)
   - Le total affiché mélange les deux → faux comptablement

4. **Distinction pro/particulier dans `payments`** : pas de colonne `customer_type`, faut JOIN avec `profiles`.

### Plan de refonte CA V2 (à valider en début de prochaine session)

**Étape 1 — Schéma BDD `payments`**
- Ajouter colonne `customer_type` (`'pro'` ou `'particulier'`)
- Ajouter colonne `amount_ht` (calculé : `amount / 1.20` si pro, `= amount` si particulier)
- Ajouter colonne `refunded_amount` (cents) pour remboursements partiels
- Statuts : `completed`, `refunded`, `partially_refunded`
- Backfill l'historique existant (UPDATE basé sur `description`)

**Étape 2 — Webhook `charge.refunded`**
- Ajouter event sur les 2 webhooks Stripe (Pro + Particuliers) côté Stripe Dashboard
- Code dans `stripe-webhook-pro` et `stripe-webhook` :
  - Trouver la ligne `payments` via `stripe_payment_id`
  - Si remboursement total → `status = 'refunded'`
  - Si remboursement partiel → `status = 'partially_refunded'`, `refunded_amount = X`
- **Décisions produit déjà actées :**
  - Q1 (remboursement partiel) : option **B** — afficher "Remboursé partiellement : X€ sur Y€"
  - Q2 (crédits si annulation totale) : tout retirer
  - Q3 (CA affiché) : montrer **CA net uniquement** (pas brut+net)

**Étape 3 — Réécrire calcul CA dans AdminPage.tsx**
- Lire **uniquement** `payments` partout
- Filtrer `status NOT IN ('refunded')` et déduire `refunded_amount` pour partiels
- Afficher **HT et TTC** côte à côte sur chaque KPI
- Filtres pro/particulier via la nouvelle colonne `customer_type`

**Étape 4 — Affichage fiche client (Historique financier)**
- Ligne remboursée : prix barré + badge "Remboursé" (ou "Remboursé partiellement")
- KPI fiche client cohérent avec le CA admin

### Estimation : 1h30 de code + tests, à faire dans une session dédiée avec esprit clair.

---

## 🆕 Autre demande UX prochaine session — Badge dynamique fiche client

**Sujet** : sur la page client admin, le badge "Actif · Renouvellement le X" reste figé même quand le client a fait un upgrade ou un downgrade.

**Comportement actuel :**
- ✅ Si client a résilié → badge affiche bien "Résilié le X" + raison
- ❌ Si client a fait un upgrade en cours → badge reste "Actif · Renouvellement le X"
- ❌ Si client a un downgrade programmé → badge reste "Actif · Renouvellement le X"

**Comportement souhaité :**
- Upgrade en cours → badge "Upgrade en cours vers [plan]"
- Downgrade programmé → badge "Bascule programmée vers [plan] le [date]"
- Garder la logique actuelle pour résiliation et actif normal

**Effort** : ~15 min de code (lecture `pro_subscriptions.scheduled_plan_change` + adaptation du composant badge).

À faire dans la même session que la refonte CA V2 (touche les mêmes pages admin).

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

### 🔥 Priorité haute (prochaine session)
1. **Refonte CA admin V2** — détaillée plus haut (1h30, session dédiée)
2. **Badge dynamique fiche client** — upgrade/downgrade en cours (15 min, dans la même session)
3. **Test E2E pro complet** post-fix safeDate() — souscription / upgrade / downgrade / résiliation / réactivation (à faire avant pub)

### Court terme
4. **Soumission 47 URLs guides** Google Search Console
5. **Branding Stripe Checkout** : logo + couleurs + domaine `pay.verimo.fr`
6. **Auto-envoi factures par email Stripe** : activer toggles "Paiements réussis" + "Remboursements" dans Stripe Settings → Customer emails
7. **Rate limiting** (faille #7 audit sécurité) avant 1ère grosse campagne pub

### Moyen terme
8. **Bannière persistante "Paiement à régulariser"** sur dashboard si une facture upgrade plante
9. **Popup bienvenue pro 1ère connexion** (onboarding)
10. **Veille réglementaire** prompt analyser-run
11. **Compare Verimo redesign verdict** (split par bien, "Bien 1"/"Bien 2", forces/issues 2 colonnes)
12. **Mention CGV discrète** dans popup TVA upgrade (sans checkbox bloquante)

### Stratégique pro
13. **Pro dashboard architecture B2B** : Option B (`/dashboard` + `/dashboard/pro` même domaine)
14. **B2B targeting mandataires indépendants** (IAD, Capifrance, SAFTI) — tiers 29/59/129€/mois proposés
15. **Speak to real pro prospects** avant de coder pro-specific features
16. **White-label PDFs** : soft co-branding recommandé (vs full white-label)

### Infra
17. **Vérifier upgrade Supabase Compute NANO → MICRO** (gratuit avec plan Pro, double RAM + Disk IO Budget)
18. **SIRET sur factures unitaires** : option B `customer.invoice_settings.custom_fields`
19. **Toggles Stripe Checkout** : Politique remboursement / CGV / Coordonnées support

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai 2026)

- **Session 10 mai (soir, cette session)** : 🔐 **Audit sécurité complet du système de paiement** :
  - 7 failles corrigées + déployées (JWT, idempotence, promo, successUrl, anon key, payment methods, email pré-rempli)
  - **Bug A corrigé** : helper `safeDate()` dans webhook pro V5 → plus de 500 ERR sur `customer.subscription.updated` quand timestamps Stripe null
  - **Bug B corrigé** : filtres skip silencieux dans V5 et V3.1 → fini les fausses alertes admin "Paiement reçu sans user_id" entre webhooks
  - Popup paiement premium côté particulier (animation spring, design calqué sur le pro)
  - **Découverte dette technique** : refonte CA admin V2 + badge dynamique fiche client = chantier suivant
- **Session 10 mai (matin)** : Suite fix Stripe pro, refonte UX downgrade complet (popups confirmation/remplacement/annulation, bouton "Annuler ce changement", sidebar BASCULE PROGRAMMÉE), bouton "Passage programmé" désactivé, popup erreur contextuelle, agrandissement typo popups, message facture remplacé "📁 Retrouvez votre facture dans Mon abonnement", filtre Mes factures payées côté pro, redesign cartes plans (Direction 3 + Power anthracite + theme dynamique selon plan actif + couleurs claires + suppression badges nom plan + alignement boutons + boutons unitaires bleu Verimo)
- **Sessions précédentes mai 2026** : Stripe pro complet (proration_behavior, schedule downgrade, payment_behavior 3DS), facturation B2B (adresse, SIRET), faille sécurité upgrade non payé (vérif latest_invoice.status), table payments pour stats admin, refonte UX page abonnement pro (badges sans engagement, tooltips, sidebar états colorés)
- **Session 30 (7 mai 2026)** : RapportPage logique RCP, KPI dashboard, archivage dossiers pro, badges "⏳ En queue", mobile UX

### Sessions plus anciennes (avril 2026)
- **Sessions 25-29** : Stripe production, admin support inbox split-view, pages légales, SEO complet (canonical, GuidesPage), redesign admin sidebar catégorisée
- **Sessions 21-24** : Dossiers pro complets, credit_grants + trigger, code promo, popups succès, page Guides, optimisation SEO mots-clés
- **Sessions 1-20** : Conception initiale, prompt enrichi, scoring déterministe /20, comparaison v1, AdminPage, dashboard pro, edge functions, config DNS pro.verimo.fr

---

## 🎯 Prochaine session — Action prioritaire

**Refonte CA admin V2 + Badge dynamique fiche client**

**Méthode** :
1. Coller ce context.md en début de conversation
2. Valider le plan détaillé de refonte (Étapes 1 à 4 ci-dessus) avant de coder
3. Une étape à la fois, fichiers livrés via `present_files` depuis `/mnt/user-data/outputs/`
4. Pas de code sans accord
5. Tester sur compte pro `publicite92320@gmail.com` après chaque étape
