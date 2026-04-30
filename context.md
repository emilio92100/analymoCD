# VERIMO — Contexte projet complet — 30 avril 2026 (après sessions 1 à 20)

> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## Profil développeur
- Débutant en développement
- Modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- Pour créer un nouveau fichier : GitHub → dossier cible → "Add file" → "Create new file"
- Vercel redéploie automatiquement après chaque push GitHub
- Edge Functions Supabase : modifiées aussi directement dans le dashboard Supabase (en plus de GitHub)
- Claude peut cloner le repo : `https://github.com/emilio92100/analymoCD.git`
- Claude doit **toujours re-cloner** avant de modifier : `git clone https://github.com/emilio92100/analymoCD.git`
- Claude livre les fichiers **complets** via `present_files` depuis `/mnt/user-data/outputs/`
- L'utilisateur push manuellement sur GitHub
- **Pour chaque fichier modifié, Claude doit le générer à nouveau dans sa totalité** — l'utilisateur remplace le fichier entier sur GitHub (pas de modification ligne par ligne)
- **Ne jamais coder sans accord préalable** — toujours échanger et valider avant de toucher au code
- **Réponses courtes et concises avec Alex** — il préfère aller à l'essentiel, pas de pavés explicatifs sauf si question technique précise.
- **Ne jamais mentionner Tonton Immo ou Emilio Immo sur Verimo** — focus produit strict
- **Mot "IA" / "AI" banni** des pages publiques Verimo — utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte"

---

## Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière, modificatifs RCP, fiche synthétique...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour **appartements et maisons**.

**Slogan :** *Vos documents décryptés, votre décision éclairée.*

**Cible :** Acheteurs particuliers (primo-accédants et résidence principale), et professionnels (agents immobiliers, investisseurs, marchands de bien, notaires).

### Tarification — Particuliers
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de score /20
- 19,90€ → 1 crédit analyse complète (jusqu'à 15 documents)
- 29,90€ → 2 crédits (Pack 2 biens)
- 39,90€ → 3 crédits (Pack 3 biens)
- Les crédits n'expirent jamais

### Tarification — Professionnels

**Abonnements mensuels HT :**
| Plan | Prix/mois HT | Complètes | Simples |
|------|-------------|-----------|---------|
| Découverte | 19,90€ | 1 | 3 |
| Starter | 49,90€ | 5 | 15 |
| Power | 89,90€ | 10 | 30 |

**Achats unitaires pro (réservés aux abonnés) :** Complète 9,90€ HT · Simple 2,90€ HT

**Règles abonnements :**
- Reset à zéro chaque mois, pas de report
- Upgrade immédiat via API Stripe (sans repasser par Checkout) : nouveau cycle démarre au jour de l'upgrade, pas de prorata
- Agences : sur-mesure via formulaire `/contact-pro`

### Stripe Price IDs
```
# Particuliers (mode TEST)
document : price_1TIb1LBO4ekMbwz0020eqcR0
complete : price_1TIb3XBO4ekMbwz0a7m7E7gD
pack2    : price_1TIb4KBO4ekMbwz0gGF2gI1S
pack3    : price_1TIb51BO4ekMbwz0mmEez47o

# Pro (mode TEST)
DECOUVERTE 19,90€ → price_1TRKJMBO4ekMbwz0mOh2hUxI
STARTER 49,90€    → price_1TRKOZBO4ekMbwz0cAzSz8P8
POWER 89,90€      → price_1TRKPaBO4ekMbwz01mAualMR
UNIT_COMPLETE 9,90€ → price_1TRKQtBO4ekMbwz0Tqi4GeKK
UNIT_SIMPLE 2,90€   → price_1TRKRmBO4ekMbwz0ynLNDwn4
```

---

## Stack technique
- **Frontend** : React + Vite + TypeScript + Tailwind
- **Backend** : Supabase Pro (auth + DB + Edge Functions Deno + Storage)
- **IA** : Claude Sonnet 4.6 via API Anthropic + Files API
- **Paiement** : Stripe (mode TEST)
- **Email** : Mailjet (SMTP Supabase + API directe via edge functions)
- **Déploiement** : Vercel (frontend auto depuis GitHub) + Supabase (edge functions manuelles)
- **Repo** : `github.com/emilio92100/analymoCD`
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`
- **Domaine** : verimo.fr (OVH registrar)
- **Domaine pro** : pro.verimo.fr (CNAME → Vercel, configuré session 16)

---

## Routes
```
/                             → HomePage
/pro                          → ProPage (landing page offre professionnelle — 4 profils)
/contact-pro                  → ContactProPage (formulaire qualifié pros — 5 profils, tel obligatoire)
/tarifs                       → TarifsPage
/contact                      → ContactPage
/exemple                      → ExemplePage (toggle Simple/Complète, rapport interactif)
/methode                      → MethodePage
/confidentialite              → ConfidentialitePage
/cgu                          → CGUPage
/mentions-legales             → MentionsLegalesPage
/connexion                    → LoginPage
/inscription                  → SignupPage
/start                        → StartPage
/setup-account?token=XXX      → SetupAccountPage (finalisation compte pro — mot de passe)
/admin                        → AdminPage
/dashboard                    → SmartDashboard (détecte role → DashboardPage ou DashboardProPage)
/dashboard/nouvelle-analyse   → NouvelleAnalyse (partagé pro/particulier)
/dashboard/analyses           → MesAnalyses (particulier)
/dashboard/dossiers           → MesDossiersPro (pro — vue portefeuille)
/dashboard/dossier/:id        → DossierDetail (pro — détail + analyses + vendeurs + acheteurs)
/dashboard/compare            → Compare (partagé pro/particulier)
/dashboard/abonnement         → MonAbonnement (pro — plans + achats unitaires + code promo + historique crédits)
/dashboard/compte             → Compte (particulier) ou ComptePro (pro — identité verrouillable)
/dashboard/tarifs             → Tarifs (côté app particulier)
/dashboard/aide               → Aide (partagé)
/dashboard/support            → Support (partagé)
/dashboard/rapport?id=XXX     → Aperçus gratuits
/rapport?id=XXX               → RapportPage standalone (rapports payants)
/rapport-partage?token=XXX    → RapportPartagePage (accès via token sans auth)
/rapport-comparaison?ids=X,Y  → RapportComparaisonPage
```

---

## 📊 Architecture crédits (récap définitif)

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :

1. **Abonnement** → `pro_subscriptions` (colonnes `credits_complete_total/used` et `credits_simple_total/used`) — recharge mensuelle via webhook Stripe
2. **Achats unitaires** → `pro_unit_purchases` (colonne `type` = 'complete'|'document', `quantity`, `credits_remaining`, `amount`) — jamais expirés
3. **Crédits offerts** → table `credit_grants` (audit log) + trigger `apply_credit_grant` qui crée auto un `pro_unit_purchases` avec `amount=0`

**Consommation** : `consume_pro_credit(p_user_id, p_credit_type)` — priorité abo puis unitaires FIFO
**Remboursement** (si analyse échoue) : `refund_pro_credit(p_user_id, p_credit_type)`

### Sources de crédits particulier
- `profiles.credits_document` et `profiles.credits_complete` (système legacy)
- `credit_grants` met à jour ces colonnes via trigger pour les particuliers
- Hook `useCredits` lit/décrémente `profiles.credits_*`

### Historique visible partout
| Source | Admin fiche user | Mon compte particulier | Mon abonnement pro |
|--------|-----------------|----------------------|-------------------|
| Paiement Stripe | ✅ `payments` | ✅ `payments` | ✅ `pro_unit_purchases` |
| Code promo | ✅ `payments` | ✅ `payments` | ✅ `credit_grants` (reason contient "Code promo") |
| Crédits admin | ✅ `credit_grants` 🎁 | ✅ `credit_grants` 🎁 | ✅ `credit_grants` 🎁 |

### Contraintes BDD
- `pro_unit_purchases.type` : CHECK `('document', 'complete')` — NE PAS envoyer `'simple'`
- `credit_grants.credit_type` : CHECK `('complete', 'document')` — le frontend convertit `'simple'` → `'document'` avant insert

---

## 🔔 Système de notifications

**Polling toutes les 15s** dans DashboardProPage et DashboardPage :
- Détecte les analyses qui passent de `pending/processing` → `completed`
- Ajoute une notification dans la cloche (TopbarPro / Topbar) avec badge rouge
- Affiche un toast vert "Votre analyse est prête !" pendant 5 secondes
- Clic sur notification → ouvre le rapport

**Protection redirection brutale** (`isMountedRef`) :
- Si le user reste sur la page de progression → redirection normale vers `/rapport?id=...`
- Si le user navigue ailleurs → `isMountedRef.current = false` → pas de redirection, le polling du dashboard prend le relais

---

## 🎉 Popups de succès paiement (MonAbonnement pro)

L'edge function `pro-checkout-create` retourne des URLs distinctes :
- Souscription → `?checkout=success&type=subscribe` → popup *"Abonnement activé !"*
- Upgrade → `?checkout=success&type=upgrade` (ou `data.upgraded=true` direct) → popup *"Plan mis à jour !"*
- Achat unitaire → `?checkout=success&type=unit` → popup *"Crédits ajoutés !"*

Chaque popup : cercle vert + check + titre + sous-texte + bouton "Lancer une analyse" + bouton "Fermer" (reload)

---

## Sessions 1 à 15 (résumé condensé)

- **Sessions 1-2** (19/04) — ProPage, ContactProPage, HomePage, TarifsPage, AdminPage, Compare v1
- **Sessions 3-5** (20-21/04) — Prompt enrichi (loi Climat, DPE), type de bien, ExemplePage vitrine, MethodePage
- **Session 6** (22/04) — Scoring déterministe `recalculerCategories()`, tooltips portal, règles prompt avancées
- **Session 7** (22/04) — Refonte résumé/avis Verimo (5 sections icônes + verdict structuré), countdown, fix barre de progression
- **Sessions 8-12** (22-23/04) — Architecture comparaison (RapportComparaisonPage plein écran), verdict V2, DashboardLoader, fix bugs cache/flash
- **Session 13** (23/04) — Refonte AdminPage (3 onglets principaux), responsive mobile dashboard, RLS admin, webhook Stripe, recherche ⌘K
- **Session 14** (24/04) — Redesign sidebar teal, MesAnalyses tableau enrichi, Compare C3, fusion pré-état daté, 6 corrections prompt (fonds travaux, Boutin, vigilance, PV AG)
- **Session 15** (27/04) — Messaging temps d'analyse harmonisé, textes page Pro, remboursement auto backend, popup erreur, alertes système admin

---

## Session 16 — 28 avril 2026 — Verimo Pro (fondations)

### Résumé
Gros chantier : création de l'offre professionnelle complète. Dashboard pro dédié avec sidebar sombre, vue portefeuille, envoi de rapports aux clients, page abonnement, page Mon Compte avec champs verrouillables. Côté admin : nouvel onglet Clients Pro, création de comptes pro, envoi mail de connexion via Mailjet, fiche client détaillée avec abonnement. Config DNS pro.verimo.fr.

### Dashboard Pro — DashboardProPage.tsx
- **Sidebar** : fond `#0a1f2d`, badge "ACCÈS PRO" bleu ciel, accent `#7dd3fc`, crédits restants via `get_pro_credits_balance`
- **Onglets** : Tableau de bord, Mes dossiers, Comparer, Mon abonnement, Mon compte, Aide & Méthode, Support
- **TopbarPro** : cloche notifications avec badge + dropdown, avatar + dropdown profil/déconnexion
- **HomeViewPro** : stats (dossiers analysés, ce mois, crédits restants via RPC, rapports envoyés)
- **MonAbonnement** : section abonnement actif (bandeau sombre), plans 3 colonnes, achats unitaires + code promo sur une ligne, section agences, historique des crédits
- **ComptePro** : infos personnelles + identité pro verrouillable + logo
- **DossierDetail** : header + vendeurs + acheteurs + **section Analyses** (score, type, statut, bouton voir rapport)

### Edge functions
- `admin-user-management` : 8 actions (create, create_pro, send_pro_invitation, etc.)
- `pro-checkout-create` : souscription / upgrade / achat unitaire, URLs de retour distinctes par type
- `stripe-webhook-pro` : gestion abonnements + achats unitaires côté Stripe

---

## Sessions 17-19 — 28-29 avril 2026

- **Session 17** : Stripe Pro configuré (5 Price IDs), migration SQL, `stripe-webhook-pro`, `pro-checkout-create`
- **Session 18** : Système dossiers complet (pro_folders, vendeurs, acheteurs), refonte NouvelleAnalyse avec `folder_select`
- **Session 19** : Table `credit_grants` + trigger `apply_credit_grant`, AdminPage refonte modale crédits

---

## ✅ Session 20 — 30 avril 2026 — Crédits, notifications, historique, UX

### Résumé
Gros chantier de consolidation : système crédits pro entièrement fonctionnel (lecture, consommation, remboursement, affichage), système de notifications par polling, historique crédits complet sur toutes les interfaces, code promo pro, refonte UX Mon abonnement, popups de succès paiement, fix redirection brutale.

### A. Système crédits pro — Fix complet
- **Hotfix SQL `apply_credit_grant`** : trigger corrigé (`type` au lieu de `credit_type`, `amount` au lieu de `amount_paid_ht`)
- **Fonctions PG vérifiées** : `get_pro_credits_balance` et `consume_pro_credit` utilisaient déjà les bons noms de colonnes
- **Fonction PG `refund_pro_credit`** créée : rembourse un crédit en incrémentant `credits_remaining` de la ligne la plus récente
- **Fix contrainte `pro_unit_purchases_type_check`** : accepte `('document', 'complete')` — le frontend convertit `'simple'` → `'document'` dans AdminPage
- **Sidebar pro** : lit maintenant `get_pro_credits_balance` (RPC) au lieu de `pro_subscriptions` seul
- **HomeViewPro** : utilise `proCredits` (RPC) pour le total crédits restants
- **NouvelleAnalyse** : consommation via `consume_pro_credit` (RPC) pour les pros, `deductCredit` (profiles) pour les particuliers. Remboursement via `refund_pro_credit` si analyse échoue.

### B. Notifications (cloche) — Pro + Particulier
- **TopbarPro** et **Topbar** : icône Bell avec badge rouge (unreadCount), dropdown notifications
- **Polling 15s** dans DashboardProPage et DashboardPage : détecte `pending→completed`
- **Toast vert** "Votre analyse est prête !" pendant 5 secondes
- **`isMountedRef`** dans NouvelleAnalyse : empêche `window.location.href` si le composant est démonté (user a navigué ailleurs)

### C. Historique crédits — Toutes interfaces
- **AdminPage fiche utilisateur** : historique fusionne `payments` + `credit_grants` (badge 🎁 "Offert par Admin"), trié par date. Crédits pro affichés via `get_pro_credits_balance` (RPC). Rafraîchissement après ajout.
- **AdminPage fiche client pro** : idem, crédits via `proClientCredits` (RPC)
- **Compte.tsx (particulier)** : historique fusionne `payments` + `credit_grants` (source "Crédits offerts 🎁" / "Code promo" / "Paiement sécurisé Stripe")
- **MonAbonnement (pro)** : historique charge `pro_unit_purchases` (amount>0) + `credit_grants`, distingue "Achat unitaire" / "Code promo" / "Crédits offerts 🎁"

### D. Code promo pro
- Champ code promo dans MonAbonnement (bloc violet distinct, toujours actif)
- Vérifie `promo_codes` (validité, expiration, usage unique, email restreint)
- Seul type `credits` supporté (pas % ou fixe)
- Crédits ajoutés via `credit_grants` (trigger crée `pro_unit_purchases`)
- Enregistré dans `promo_uses` + `payments` pour historique

### E. Analyses dans DossierDetail
- Section "Analyses" remplace le placeholder "La gestion arrive bientôt"
- Liste des analyses du dossier avec : ScoreRing, type (Complète/Simple), date, statut (spinner/échoué/terminé)
- Clic sur analyse terminée → ouvre le rapport
- Bouton "+ Nouvelle" en haut

### F. Bouton retour rapport intelligent
- **RapportPage.tsx** : détecte `folder_id` + `role` du user
- Pro avec dossier → "Mon dossier" (retour au dossier d'origine)
- Pro sans dossier ou particulier → "Mes analyses"

### G. Compare.tsx — Mention dossier
- `useAnalyses` et `AnalyseDB` : ajout `folder_id`
- Compare charge les noms de dossiers via `pro_folders`
- Chaque analyse affiche "📁 Dossier [nom]" sous l'adresse (pros uniquement)

### H. Refonte UX MonAbonnement
- **Section 1** : Abonnement actif (bandeau sombre gradient avec crédits restants en gros)
- **Section 2** : "Choisissez votre plan" / "Changer de plan" — titre dans bandeau bleu clair connecté aux cartes plans
- **Section 3** : "Crédits supplémentaires" — titre dans bandeau vert (abonné) ou orange (non abonné), 3 blocs sur une ligne (Complète + Simple + Code promo violet)
- **Section 4** : Agences (bandeau contact)
- **Section 5** : Historique des crédits
- Message "Abonnement requis" sous boutons grisés (12px orange bold)

### I. Popups succès paiement
- Popup animé (scale + fade) avec cercle vert + check
- 3 messages distincts selon `?type=` dans URL retour Stripe :
  - `subscribe` → "Abonnement activé !"
  - `upgrade` → "Plan mis à jour !" (aussi via `data.upgraded=true`)
  - `unit` → "Crédits ajoutés !"
- Bouton "Lancer une analyse" + "Fermer"
- Edge function `pro-checkout-create` mise à jour avec URLs distinctes

### Fichiers modifiés session 20
```
src/pages/DashboardProPage.tsx     → ~3750 lignes (sidebar RPC, notifications, MonAbonnement refonte, DossierDetail analyses, popups)
src/pages/DashboardPage.tsx        → ~580 lignes (notifications cloche + toast particulier)
src/pages/dashboard/NouvelleAnalyse.tsx → ~1745 lignes (consume_pro_credit, refund_pro_credit, isMountedRef)
src/pages/dashboard/Compare.tsx    → ~610 lignes (folder_id + nom dossier)
src/pages/dashboard/Compte.tsx     → ~260 lignes (historique credit_grants)
src/pages/AdminPage.tsx            → ~3810 lignes (proCreditsBalance RPC, historique credit_grants, type AdminPayment._source)
src/pages/RapportPage.tsx          → ~4665 lignes (backUrl intelligent, folder_id detection)
src/hooks/useAnalyses.ts           → ajout folder_id
src/lib/analyses.ts                → ajout folder_id à AnalyseDB

SQL exécutés :
- hotfix-pro-unit-purchases-v2.sql (trigger apply_credit_grant corrigé)
- create-refund-pro-credit.sql (fonction refund_pro_credit)

Edge function mise à jour :
- pro-checkout-create (SUCCESS_URL distinctes par type)
```

---

## Règles de notation — Score /20

| Catégorie | Max |
|-----------|-----|
| Travaux | 5 pts |
| Procédures | 4 pts |
| Finances | 4 pts |
| Diagnostics privatifs | 4 pts |
| Diagnostics communs | 3 pts |
| **TOTAL** | **20 pts** |

**⚠️ IMPORTANT** — Notes calculées côté code dans `recalculerCategories()` — plus le LLM.

### Niveaux
| Plage | Niveau |
|-------|--------|
| 17–20 | Bien irréprochable |
| 14–16 | Bien sain |
| 10–13 | Bien correct avec réserves |
| 7–9 | Bien risqué |
| 0–6 | Bien à éviter |

### Barème détaillé
- **Travaux** : lourds -1.5/sujet (max -3), légers -0.5/sujet (max -1.5), votes vendeur +0.5 (max +2), plancher 1
- **Procédures** : élevée -2, modérée -1, faible -0.5, quitus refusé -0.5
- **Finances** (départ 2/4) : fonds excellent ≥10% +1.5, bien 6-9% +1, conforme 5% +0.5, insuffisant -0.5, absent -1, impayés >15% -0.5, vendeur à jour +0.5
- **Diags privatifs** : 0 diag → 0/4, sinon départ 4/4, manquants -0.75 chacun, anomalies variables, plancher 1/4
- **Diags communs** (départ 2/3) : DTG bon +1/moyen +0.5/dégradé -1, amiante/termites PC -1

---

## Règles métier critiques

1. Fonds ALUR : rembourser au vendeur, PAS dans vigilances sauf anormal
2. Honoraires syndic pré-état daté : charge vendeur
3. Votes deux tours : art. 25 → art. 24 si ≥ 1/3 voix
4. DPE D = bonne performance
5. Travaux votés avant vente = charge vendeur, pas risque acheteur
6. Travaux évoqués non votés = vrai risque acheteur
7. Loi Climat : G interdit location 2025, F 2028, E 2034
8. DPE petites surfaces : seuils ajustés < 40 m²
9. Audit énergétique : obligatoire vente maisons E/F/G, pas copros
10. Gestionnaire ≠ président conseil syndical
11. DDT + actualisation : dossier unifié, jamais noter 0
12. Cascade sources finances : pré-état daté > appel charges > PV+tantièmes > PV seul
13. Fonds travaux lot ≠ copro
14. fonds_travaux_statut "non_mentionne" = pas de pénalité
15. Surface Boutin : vigilance auto si détectée
16. Seuils vigilance dynamiques : 5k€ si budget >80k, sinon 3k€
17. PV AG manquants : si <3, ajouter dans documents_manquants
18. Recommandation comparaison : meilleur score par défaut, exception si facteur bloquant réel

---

## Flux technique

### Analyse
1. Upload PDFs → Supabase Storage → edge function `analyser` → API Anthropic Files → supprime Storage
2. `analyser-run` (background) → Claude Sonnet → JSON → `recalculerCategories()` → supprime Files API (RGPD)
3. Rapport stocké dans `analyses.result`, deadline complément 7 jours

### Comparaison
1. Sélection 2-3 biens → edge function `comparer` → cache BDD ou génération Claude → verdict V2
2. Frontend redirige vers `/rapport-comparaison?ids=...`

### Envoi rapport pro
1. Pro clique "Envoyer" → modal nom/email/message → edge function `send_report`
2. Mail Mailjet avec reply-to vers le pro → lien token `/rapport-partage?token=XXX`
3. Tracking ouverture dans `report_shares.opened_at`

### Paiement pro
1. Frontend → `pro-checkout-create` (mode subscribe/buy_unit)
2. Souscription : Stripe Checkout → `stripe-webhook-pro` crée `pro_subscriptions` + crédits
3. Upgrade : API Stripe directe (pas de Checkout) → webhook met à jour
4. Achat unitaire : Stripe Checkout → webhook crée `pro_unit_purchases`
5. Retour frontend avec `?checkout=success&type=subscribe|upgrade|unit` → popup adapté

---

## Architecture fichiers clés

```
src/pages/
  HomePage.tsx
  ProPage.tsx · TarifsPage.tsx · MethodePage.tsx · ExemplePage.tsx
  ContactPage.tsx · ContactProPage.tsx
  RapportPage.tsx                    ← ~4665 lignes (backUrl intelligent)
  RapportComparaisonPage.tsx         ← ~1270 lignes
  DashboardPage.tsx                  ← ~580 lignes (notifications cloche)
  DashboardProPage.tsx               ← ~3750 lignes (crédits RPC, notifications, MonAbonnement refonte)
  SetupAccountPage.tsx               ← Finalisation compte pro
  AdminPage.tsx                      ← ~3810 lignes (historique complet, crédits RPC)
  dashboard/
    HomeView.tsx · MesAnalyses.tsx · NouvelleAnalyse.tsx (~1745 lignes)
    Compare.tsx (~610 lignes) · Compte.tsx (~260 lignes) · Tarifs.tsx
    Support.tsx · Aide.tsx · DocumentRenderer.tsx

src/components/
  DashboardLoader.tsx
  layout/ Navbar.tsx · Footer.tsx

src/lib/ supabase.ts · analyse-client.ts · analyses.ts
src/hooks/ useAnalyses.ts · useCredits.ts · useUser.ts

supabase/functions/
  analyser/index.ts · analyser-run/index.ts (~1260 lignes)
  comparer/index.ts (~270 lignes)
  admin-user-management/index.ts     ← 8 actions + templates Mailjet
  pro-checkout-create/index.ts       ← subscribe/upgrade/buy_unit + URLs distinctes
  stripe-webhook-pro/index.ts        ← gestion abonnements + achats
  create-checkout-session/index.ts   ← checkout particulier
  stripe-webhook/index.ts            ← webhook particulier
```

---

## Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Teal sidebar particulier** : `#0e3a4a`
- **Sidebar pro** : `#0a1f2d`
- **Accent pro** : `#7dd3fc`
- **Header dark** : `#0f2d3d`
- **Investisseur violet** : `#7c3aed`
- **Marchand ambre** : `#d97706`
- **Code promo violet** : `#7c3aed` / bg `#f5f3ff` / border `#c4b5fd`

---

## SEO
- Domaine `verimo.fr` + `pro.verimo.fr` (OVH)
- Search Console : propriété validée, sitemap soumis
- `data-nosnippet` sur disclaimer footer
- DNS racine corrigé : A record `216.198.79.1` (Vercel)

---

## 🗂️ Backlog

### 🔴 Priorité haute

- [ ] **Remplacer l'edge function debug `analyser`** en production par la version clean (mentionné context.md session 19)
- [ ] **Veille réglementaire — prompt analyser-run** — DPE collectif copros <50 lots (jan 2026), PPT obligatoire (jan 2026), décret emprunt collectif (déc 2025), mise à jour RCP (loi ÉLAN)
- [ ] **Prompt caching API Anthropic** — 700+ lignes identiques à chaque appel, ~90% d'économie possible. Critique vu plafond 500$/mois
- [ ] **Bug IA recommandation incorrecte** — Durcir prompt + validation auto côté edge function comparer
- [ ] **Passer API Anthropic Niveau 3** — 400$ cumulés requis

### 🟡 Priorité normale

- [ ] **Supprimer le flow aperçu gratuit** — Retirer complètement le mode aperçu (~12 fichiers impactés). La page Exemple suffit comme démo.
- [ ] **Page rapport partagé** — Adapter RapportPartagePage pour accès via token sans auth. Bandeau "Partagé par [Pro] — [Société]" avec logo. Tracking ouverture.
- [ ] **Barre de progression NouvelleAnalyse** — Monte trop vite à 87-88% puis stagne
- [ ] **RapportPage — rendu adaptatif maison** — Onglets adaptés au type de bien
- [ ] **ExemplePage — mock maison** — Villeurbanne, 4P 95m², score 12,5/20, DPE E
- [ ] **Stripe TEST → production** — Passer les Price IDs en mode live
- [ ] **Refonte verdict comparaison** — Améliorer la présentation du rapport de comparaison
- [ ] **Validation UX duplicate detection dossiers**

### ✅ Résolu session 20

- [x] Système crédits pro entièrement fonctionnel (lecture, consommation, remboursement, affichage)
- [x] Notifications cloche pro + particulier avec polling + toast
- [x] Fix redirection brutale (isMountedRef)
- [x] Historique crédits sur toutes les interfaces (admin, particulier, pro)
- [x] Code promo pro
- [x] Analyses dans DossierDetail
- [x] Bouton retour rapport intelligent
- [x] Compare avec mention dossier
- [x] Refonte UX MonAbonnement (sections connectées, titres visibles, bloc promo violet)
- [x] Popups succès paiement (3 messages distincts)
- [x] AdminPage crédits pro via RPC + historique fusionné
