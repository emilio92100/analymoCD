# VERIMO — Contexte projet — 10 mai 2026

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

| Nom | Rôle |
|-----|------|
| `analyser` | Lance une analyse — gère la queue Anthropic 503 |
| `analyser-run` | Worker qui traite l'analyse en background |
| `analyser-retry` | Cron pg_cron 5 min — retraite les analyses queued (12 retries max) |
| `comparer` | Compare 2 ou 3 rapports |
| `admin-user-management` | Actions admin (create, invite, delete, reset password) |
| `pro-checkout-create` | Stripe pro : subscribe / preview_upgrade / buy_unit / cancel / cancel_scheduled_change / reactivate / billing_portal / list_invoices |
| `stripe-webhook-pro` | Webhook Stripe pro (5 events : checkout, invoice paid/failed, sub updated/deleted) |
| `stripe-webhook` | Webhook Stripe particuliers (checkout.session.completed) |
| `create-checkout-session` | Stripe particuliers (checkout) |

⚠️ **Rappel critique** : push GitHub ne déploie pas les edge functions → toujours redéployer manuellement dans Supabase Studio.

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

### Popups UX abonnement (DashboardProPage.tsx)
- **Popup confirmation upgrade** (avant Checkout) : récap HT/TVA/TTC + crédits
- **Popup succès upgrade** (vert) : récap montant + crédits + "📁 Retrouvez votre facture dans Mon abonnement"
- **Popup succès downgrade** (vert) : "Vous passerez en X le DATE" — pas de message facture (cohérent : pas de paiement immédiat)
- **Popup erreur contextuelle** (downgrade ambre / upgrade rouge / generic) avec bouton adapté
- **Popup confirmation remplacement schedule** (ambre)
- **Popup confirmation annulation schedule** (bleu) + popup succès vert
- **Popup résiliation 3 étapes** : "Vous souhaitez nous quitter ?" → "Pourquoi résiliez-vous ?" → "Abonnement résilié"
- Tailles typo agrandies (titres 22→24, textes 13-14→14-16)

### Sidebar SidebarPro (états abonnement)
Priorité d'affichage :
1. 🔴 Past due / paiement échoué (rouge)
2. 🔴 Cancel at period end (rouge "Actif jusqu'au DATE")
3. 🟡 **BASCULE PROGRAMMÉE** (ambre) : "Plan X · Bascule vers Y le DATE"
4. 🟢 Actif normal (vert "Renouvellement DATE")

### Bandeau "Votre plan actuel" (carte plan actif)
- Si `cancel_at_period_end` → "Actif jusqu'au DATE" (orange)
- Si `scheduled_plan_change` → "Bascule vers X le DATE" (orange)
- Sinon → "Renouvellement DATE" (vert)

### Mes factures (côté pro vs admin)
- **Pro** : affiche **uniquement les factures payées** (`status === 'paid'` ou status absent). Les factures `open` (en attente) et `uncollectible` (échec) sont cachées
- **Admin** : affiche TOUTES les factures avec statut visible (En attente jaune / Échec rouge / Réussi vert) — utile pour le suivi technique

### Facturation B2B Stripe
- Customer Stripe enrichi : email, name, phone, address (pro_company_address, pro_postal_code, pro_ville, country FR), metadata.user_id + metadata.siret
- SIRET stocké en metadata + affiché en custom_field sur factures (Stripe ne supporte pas SIRET comme Tax ID officiel)
- Toutes les factures pro avec TVA 20% via `txr_1TUAxVBesXB76oWESXBnGdIZ` (mode exclusif)

### Stats admin via table `payments`
- Helper `recordProPayment` dans webhook insère paiements pro dans `payments` (anti-doublon par stripeInvoiceId puis stripeSessionId)
- Appelé 4 endroits : souscription initiale, upgrade payé, renouvellement, achat unitaire
- ⏳ **Pending** : refonte AdminPage.tsx pour utiliser cette table pour les stats CA Pro/Particulier (estimé ~300 lignes)

### Schéma BDD pro_subscriptions (colonnes clés)
```sql
- user_id, plan, status, stripe_subscription_id, stripe_customer_id
- credits_complete_total/used, credits_simple_total/used
- current_period_start, current_period_end
- cancel_at_period_end, cancellation_reason
- scheduled_plan_change, scheduled_change_date  -- ⭐ ajouté pour downgrade UX
```

---

## 🎨 Design System — Page abonnement pro (refonte 10 mai 2026)

### Cartes plans Découverte / Starter / Power

**Direction Premium hiérarchie** avec theme dynamique par plan actif.

**Logique commerciale du plan qui ressort (fond bleu nuit dégradé) :**
- Pas d'abo / Découverte / Starter actif → **Starter** ressort (recommandé sans push agressif)
- Power actif → **Power** ressort (on valorise le plan max)

**Theme "standout"** (plan qui ressort) :
- Fond : `linear-gradient(180deg, #0f2d3d 0%, #2a7d9c 100%)`
- Texte blanc, prix blanc
- Badge ambre "★ RECOMMANDÉ" si Starter en standout sans abo / Découverte
- Bouton blanc avec texte bleu nuit

**Theme "secondaire"** (plans non standout, fond clair pastel) :
- Découverte : `linear-gradient(180deg, #f0f7fb 0%, #fff 70%)` + bordure `#d0e8f0`
- Power : `linear-gradient(180deg, #f1f5f9 0%, #fff 70%)` + bordure `#e2e8f0`
- Starter (si Power actif) : `linear-gradient(180deg, #e0f2fe 0%, #f0f7fb 70%)` + bordure `#bae6fd`
- Boutons : Découverte/Starter bleu Verimo (`#2a7d9c`), Power anthracite (`#0f172a`)

**Structure carte** (display flex column pour aligner boutons) :
1. Titre nom du plan (24px gras, pas de badge en majuscules)
2. Tagline (13px)
3. Prix + suffix HT/mois + badge "Sans engagement"
4. Liste features avec CheckCircle (flex:1 pour pousser bouton en bas)
5. Bouton "Passer à ce plan" / "Annuler mon abonnement" / état spécial

**Boutons spéciaux selon état** :
- Plan actif normal → "Annuler mon abonnement" (rouge)
- Plan actif + cancel_at_period_end → "Réactiver mon abonnement" (vert)
- Plan actif + scheduled_plan_change → "Annuler ce changement" (ambre) + "Annuler mon abonnement" (rouge)
- Plan = scheduled_plan_change cible → bouton désactivé "Passage programmé le DATE" (ambre clair)
- past_due → bouton désactivé "Paiement à régulariser" (rouge clair)

### Boutons unitaires + Nous contacter
- **"Acheter" (analyse complète/simple)** : `#2a7d9c` (bleu Verimo)
- **"Nous contacter"** (volumes importants) : `#2a7d9c` avec hover `#1e6783`
- ⚠️ Anciens boutons noirs (`#0f172a` / `#0f2d3d`) corrigés le 10 mai 2026

### Palette couleurs Verimo
- **Bleu Verimo** : `#2a7d9c`
- **Bleu nuit Verimo** : `#0f2d3d`
- **Sidebar pro + particulier** : `#0e3a4a`
- **Accent pro** : `#7dd3fc`
- **Header dark** : `#0f2d3d`
- **Bouton aide / badge support** : `#f59e0b`
- **Anthracite (Power, premium)** : `#0f172a`
- **Ambre (warning, scheduled)** : `#d97706` / `#fde68a` / `#fffbeb`
- **Rouge (cancel, danger)** : `#dc2626` / `#fecaca`
- **Vert (success)** : `#16a34a` / `#bbf7d0` / `#f0fdf4`

---

## 📊 Architecture crédits

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions` (`credits_complete_total/used`, `credits_simple_total/used`)
2. **Achats unitaires** → `pro_unit_purchases` (avec `credits_remaining`)
3. **Crédits offerts** → `credit_grants` + trigger `apply_credit_grant`

### Fonctions SQL crédits
- **Consommation** : `consume_pro_credit(p_user_id, p_credit_type)`
- **Remboursement** : `refund_pro_credit(p_user_id, p_credit_type)`
- **Reset cycle abo** : `reset_pro_subscription_credits(p_subscription_id)`
- **Cumul upgrade** : `upgrade_pro_subscription_credits(p_subscription_id, p_new_plan)`

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

### Court terme
1. **Refonte AdminPage.tsx CA Pro/Particulier** basée sur table `payments` (~300 lignes, session dédiée)
2. **47 URLs guides** à soumettre Google Search Console
3. **Test E2E complet** abonnement pro avant pub
4. **Branding Stripe Checkout** : logo + couleurs + domaine `pay.verimo.fr`
5. **Auto-envoi factures par email Stripe** : activer toggles "Paiements réussis" + "Remboursements" dans Stripe Settings → Customer emails

### Moyen terme
6. **Bannière persistante "Paiement à régulariser"** sur dashboard si une facture upgrade plante
7. **Popup bienvenue pro 1ère connexion** (onboarding)
8. **Veille réglementaire** prompt analyser-run
9. **Compare Verimo redesign verdict** (split par bien, "Bien 1"/"Bien 2", forces/issues 2 colonnes)
10. **Mention CGV discrète** dans popup TVA upgrade (sans checkbox bloquante)

### Stratégique pro
11. **Pro dashboard architecture B2B** : Option B (`/dashboard` + `/dashboard/pro` même domaine)
12. **B2B targeting mandataires indépendants** (IAD, Capifrance, SAFTI) — tiers 29/59/129€/mois proposés
13. **Speak to real pro prospects** avant de coder pro-specific features
14. **White-label PDFs** : soft co-branding recommandé (vs full white-label)

### Infra
15. **Vérifier upgrade Supabase Compute NANO → MICRO** (gratuit avec plan Pro, double RAM + Disk IO Budget)
16. **SIRET sur factures unitaires** : option B `customer.invoice_settings.custom_fields`
17. **Toggles Stripe Checkout** : Politique remboursement / CGV / Coordonnées support

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai 2026)
- **Session 10 mai (cette session)** : Suite fix Stripe pro, refonte UX downgrade complet (popups confirmation/remplacement/annulation, bouton "Annuler ce changement", sidebar BASCULE PROGRAMMÉE), bouton "Passage programmé" désactivé, popup erreur contextuelle, agrandissement typo popups, message facture remplacé "📁 Retrouvez votre facture dans Mon abonnement", filtre Mes factures payées côté pro, redesign cartes plans (Direction 3 + Power anthracite + theme dynamique selon plan actif + couleurs claires + suppression badges nom plan + alignement boutons + boutons unitaires bleu Verimo)
- **Sessions précédentes mai 2026** : Stripe pro complet (proration_behavior, schedule downgrade, payment_behavior 3DS), facturation B2B (adresse, SIRET), faille sécurité upgrade non payé (vérif latest_invoice.status), table payments pour stats admin, refonte UX page abonnement pro (badges sans engagement, tooltips, sidebar états colorés)
- **Session 30 (7 mai 2026)** : RapportPage logique RCP, KPI dashboard, archivage dossiers pro, badges "⏳ En queue", mobile UX

### Sessions plus anciennes (avril 2026)
- **Sessions 25-29** : Stripe production, admin support inbox split-view, pages légales, SEO complet (canonical, GuidesPage), redesign admin sidebar catégorisée
- **Sessions 21-24** : Dossiers pro complets, credit_grants + trigger, code promo, popups succès, page Guides, optimisation SEO mots-clés
- **Sessions 1-20** : Conception initiale, prompt enrichi, scoring déterministe /20, comparaison v1, AdminPage, dashboard pro, edge functions, config DNS pro.verimo.fr

---

## 🎯 Prochaine session — Action prioritaire

Le système Stripe pro est **stable et déployé en prod**. Les chantiers à reprendre :

1. **Refonte stats admin CA** basée sur table `payments` (~300 lignes)
2. **Soumission 47 URLs guides** Google Search Console
3. **Test E2E pré-pub** abonnement pro complet (souscription / upgrade / downgrade / résiliation / réactivation)

**Méthode** : une étape à la fois, fichiers livrés via `present_files` depuis `/mnt/user-data/outputs/`, pas de code sans accord.
