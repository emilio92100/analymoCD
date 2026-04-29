# VERIMO — Contexte projet complet — 28 avril 2026 (après sessions 1 à 16)

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

### Tarification — Professionnels (session 16)

**Abonnements mensuels HT :**
| Plan | Prix/mois HT | Complètes | Simples | Marge min |
|------|-------------|-----------|---------|-----------|
| Starter | 49,90€ | 5 | 15 | 61% |
| Power | 89,90€ | 10 | 30 | 57% |

**Achats unitaires pro (hors quota) :** Complète 14,90€ HT · Simple 3,90€ HT

**Règles abonnements :**
- Reset à zéro chaque mois, pas de report
- Upgrade immédiat : nouveau cycle démarre au jour de l'upgrade (annule l'ancien, pas de prorata)
- Agences : sur-mesure via formulaire `/contact-pro`
- Coût API estimé : ~3€ max par analyse complète, ~0,30€ par simple

### Stripe Price IDs (mode TEST — à passer en live)
```
document : price_1TIb1LBO4ekMbwz0020eqcR0
complete : price_1TIb3XBO4ekMbwz0a7m7E7gD
pack2    : price_1TIb4KBO4ekMbwz0gGF2gI1S
pack3    : price_1TIb51BO4ekMbwz0mmEez47o
```
**⚠️ Stripe abonnements pro (Starter/Power) pas encore créés** — à configurer dans Stripe + webhook recharge crédits.

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
/setup-account?token=XXX      → 🆕 SetupAccountPage (finalisation compte pro — mot de passe)
/admin                        → AdminPage
/dashboard                    → SmartDashboard (détecte role → DashboardPage ou DashboardProPage)
/dashboard/nouvelle-analyse   → NouvelleAnalyse (partagé pro/particulier)
/dashboard/analyses           → MesAnalyses (particulier)
/dashboard/dossiers           → 🆕 MesDossiersPro (pro — vue portefeuille)
/dashboard/dossier/:id        → 🆕 DossierDetail (pro — détail + historique envois)
/dashboard/compare            → Compare (partagé pro/particulier)
/dashboard/abonnement         → 🆕 MonAbonnement (pro — plans Starter/Power)
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

## 🆕 Session 16 — 28 avril 2026 — Verimo Pro (fondations)

### 🎯 Résumé global
Gros chantier : création de l'offre professionnelle complète. Dashboard pro dédié avec sidebar sombre, vue portefeuille, envoi de rapports aux clients, page abonnement (Starter/Power), page Mon Compte avec champs verrouillables. Côté admin : nouvel onglet Clients Pro, création de comptes pro, envoi mail de connexion via Mailjet, fiche client détaillée avec abonnement. Config DNS pro.verimo.fr (OVH + Vercel + Supabase Auth). Fix SEO footer avec `data-nosnippet`.

### A. Base de données — Migration pro
- Nouveaux champs `profiles` : `telephone`, `pro_profile_type`, `pro_company_name`, `pro_company_address`, `pro_siret`, `pro_ville`, `pro_network`, `pro_logo_url`, `pro_contact_email`, `pro_contact_phone`, `pro_notes_admin`, `pro_created_at`, `pro_created_by`, `pro_contact_pro_id`, `pro_recommended_plan`, `pro_onboarding_done`
- Table `pro_subscriptions` : plan (starter/power), status, crédits total/utilisés, cycle
- Table `report_shares` : envois de rapports aux clients (token, ouverture trackée)
- Table `pro_invitations` : liens de connexion permanents (token, sent_at, accepted_at)
- Table `pro_unit_purchases` : achats unitaires pro hors quota
- Bucket Storage `pro-logos` : logos uploadés par les pros
- Champs `converted_profile_id` + `converted_at` sur `contact_pro`
- Fonctions `is_pro()` + `get_shared_report()` + RLS complètes

### B. Edge function admin-user-management — 8 actions
- `create` — créer un compte particulier (existant)
- `create_pro` — créer un compte pro complet (mot de passe temp aléatoire)
- `send_pro_invitation` — envoyer mail de connexion via Mailjet (template HTML avec logo Verimo)
- `resend_pro_invitation` — renvoyer avec nouveau token
- `verify_pro_token` — vérifier un token (sans auth, public)
- `setup_pro_account` — finaliser le compte pro (nouveau mot de passe + connexion auto)
- `send_report` — envoyer un rapport au client du pro (mail avec reply-to vers le pro)
- `invite` / `delete` — existants inchangés

**Architecture auth** : les actions `verify_pro_token` et `setup_pro_account` sont traitées AVANT le check admin (le pro n'est pas connecté à ce moment-là).

**Mailjet** : clés API dans Edge Function Secrets (`MJ_API_KEY`, `MJ_SECRET_KEY`)

### C. Dashboard Pro — DashboardProPage.tsx (~1180 lignes)
- **Sidebar** : fond `#0a1f2d` (plus foncé que le teal particulier), badge "ACCÈS PRO" bleu ciel, accent `#7dd3fc`
- **Onglets** : Tableau de bord, Mes dossiers, Comparer, Mon abonnement, Mon compte, Aide & Méthode, Support
- **SmartDashboard** dans App.tsx : détecte `role='pro'` → affiche DashboardProPage, sinon DashboardPage
- **HomeViewPro** : stats (dossiers analysés, ce mois, crédits restants, rapports envoyés), derniers dossiers, derniers envois
- **MesDossiersPro** : vue portefeuille avec recherche, filtres (type, score), score ring, DPE badge, compteur envois, boutons Envoyer/Voir
- **DossierDetail** : fiche détaillée d'un dossier + historique des envois
- **SendReportModal** : modal envoi rapport (nom, prénom, email client, message pré-rempli modifiable, envoi via edge function)
- **MonAbonnement** : plans Starter/Power + achats unitaires + bandeau "Agence ? Contactez-nous"
- **ComptePro** : infos personnelles (toujours modifiable) + identité pro (verrouillable après première sauvegarde) + logo + coordonnées client (reply-to)
- **Verrouillage champs pro** : `pro_onboarding_done = true` après première sauvegarde → nom commercial, réseau, SIRET, ville, adresse deviennent read-only. Bouton "Demander une modification" → modal → message envoyé dans `contact_messages` avec tag [PRO]
- **Bandeau "analyse offerte"** masqué pour les pros (check role dans NouvelleAnalyse.tsx)
- **Responsive mobile** : grilles 1 colonne, sidebar mobile, topbar adaptée

### D. AdminPage — Onglet "Clients Pro"
- Liste des clients pro avec badge type (Agent/Investisseur/Marchand/Notaire/Autre)
- Bouton "Créer un client pro" → modal large (640px) avec tous les champs + plan recommandé + crédits offerts
- Fiche client détaillée : infos, stats rapides, abonnement en cours, invitations, historique analyses, historique envois, notes admin
- Bouton "Envoyer mail de connexion" → badge "Compte activé" quand accepté
- Depuis Demandes Pro : bouton "Créer un compte pro" pré-remplit la modal + badge "Compte créé" après conversion

### E. SetupAccountPage.tsx
- Page `/setup-account?token=XXX` : vérification token via edge function (public, sans auth)
- Email affiché (non modifiable) + champs mot de passe + confirmer
- Après validation : connexion auto + redirection vers dashboard pro

### F. Config pro.verimo.fr
- DNS OVH : CNAME `pro` → `381689491debb974.vercel-dns-017.com.`
- Vercel : domaine `pro.verimo.fr` ajouté en Production
- Supabase Auth : `https://pro.verimo.fr/**` dans Redirect URLs
- Edge function : setupUrl pointe vers `https://pro.verimo.fr/setup-account`

### G. SEO — Fix snippet Google
- `data-nosnippet` ajouté sur le disclaimer footer pour empêcher Google de l'utiliser comme description
- Réindexation demandée via Search Console sur les 5 pages principales

### Fichiers créés/modifiés session 16

**Frontend (GitHub) :**
```
src/App.tsx                             → SmartDashboard + routes pro + setup-account
src/pages/DashboardProPage.tsx          → NOUVEAU (~1180 lignes)
src/pages/SetupAccountPage.tsx          → NOUVEAU
src/pages/AdminPage.tsx                 → Onglet Clients Pro + bouton créer pro dans Demandes Pro (~3580 lignes)
src/pages/ContactProPage.tsx            → Téléphone obligatoire
src/pages/dashboard/NouvelleAnalyse.tsx → Bandeau "analyse offerte" masqué pour les pros
src/components/layout/Footer.tsx        → data-nosnippet sur disclaimer
```

**Backend (Supabase Dashboard) :**
```
supabase/functions/admin-user-management/index.ts → 8 actions + templates mail Mailjet
supabase-migration-pro.sql                         → Tables + champs + RLS + fonctions
```

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
13. Fonds travaux lot ≠ copro (session 14)
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

### Envoi rapport pro (session 16)
1. Pro clique "Envoyer" → modal nom/email/message → edge function `send_report`
2. Mail Mailjet avec reply-to vers le pro → lien token `/rapport-partage?token=XXX`
3. Tracking ouverture dans `report_shares.opened_at`

### Coûts
- Stockage DB : ~100 ko/rapport → 80 000 analyses possibles
- API Claude : ~0,80-1,50€/analyse complète, ~0,15-0,30€/comparaison
- Plafond Niveau 2 : 500$/mois

---

## Architecture fichiers clés

```
src/pages/
  HomePage.tsx
  ProPage.tsx · TarifsPage.tsx · MethodePage.tsx · ExemplePage.tsx
  ContactPage.tsx · ContactProPage.tsx
  RapportPage.tsx                    ← ~4600 lignes
  RapportComparaisonPage.tsx         ← ~1270 lignes
  DashboardPage.tsx                  ← Shell dashboard particulier + sidebar teal
  DashboardProPage.tsx               ← 🆕 Shell dashboard pro + sidebar sombre (~1180 lignes)
  SetupAccountPage.tsx               ← 🆕 Finalisation compte pro
  AdminPage.tsx                      ← ~3580 lignes (onglet Clients Pro ajouté session 16)
  dashboard/
    HomeView.tsx · MesAnalyses.tsx · NouvelleAnalyse.tsx
    Compare.tsx · Compte.tsx · Tarifs.tsx
    Support.tsx · Aide.tsx · DocumentRenderer.tsx

src/components/
  DashboardLoader.tsx
  layout/ Navbar.tsx · Footer.tsx

src/lib/ supabase.ts · analyse-client.ts · analyses.ts
src/hooks/ useAnalyses.ts · useCredits.ts · useUser.ts

supabase/functions/
  analyser/index.ts · analyser-run/index.ts (~1260 lignes)
  comparer/index.ts (~270 lignes)
  admin-user-management/index.ts     ← 🆕 8 actions + templates Mailjet
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

---

## SEO
- Domaine `verimo.fr` + `pro.verimo.fr` (OVH)
- Search Console : propriété validée, sitemap soumis
- `data-nosnippet` sur disclaimer footer (session 16)
- DNS racine corrigé : A record `216.198.79.1` (Vercel) au lieu de `213.186.33.5` (OVH)

---

## 🗂️ Backlog

### 🔴 Priorité haute

- [ ] **UX dashboard pro — layout** — Contenu trop centré/étroit sur certaines pages. Appliquer le même responsive que le dashboard particulier. Page tarifs mobile : plans en 1 colonne (déjà corrigé via classe plans-grid, à vérifier).
- [ ] **Admin — fiche client pro enrichie** — Lien "Voir fiche pro" depuis onglet Utilisateurs si role=pro. Boutons reset/suspendre/supprimer sur la fiche client pro. Historique centralisé (analyses + envois + messages + abonnement).
- [ ] **Admin — messages pro tagués** — Quand un pro envoie une demande de modification, le message arrive tagué [PRO] dans Messages. Ajouter un lien vers la fiche client pro dans le message.
- [ ] **Supprimer le flow aperçu gratuit** — Retirer complètement le mode aperçu (~12 fichiers impactés). La page Exemple suffit comme démo, le produit d'appel à 4,90€ remplace l'aperçu.
- [ ] **Veille réglementaire — prompt analyser-run** — DPE collectif copros <50 lots (jan 2026), PPT obligatoire (jan 2026), décret emprunt collectif (déc 2025), mise à jour RCP (loi ÉLAN).
- [ ] **Prompt caching API Anthropic** — 700+ lignes identiques à chaque appel, ~90% d'économie possible. Critique vu plafond 500$/mois.
- [ ] **Bug IA recommandation incorrecte** — Durcir prompt + validation auto côté edge function comparer.
- [ ] **Passer API Anthropic Niveau 3** — 400$ cumulés requis.

### 🟡 Priorité normale

- [ ] **Page rapport partagé** — Adapter RapportPartagePage pour accès via token sans auth. Bandeau "Partagé par [Pro] — [Société]" avec logo. Tracking ouverture.
- [ ] **Template mail pro** — Le template fonctionne mais peut être amélioré (mobile un peu serré selon Alex).
- [ ] **Barre de progression NouvelleAnalyse** — Monte trop vite à 87-88% puis stagne.
- [ ] **Bouton SOS / Signaler un problème** — Remplacer la cloche dans le topbar.
- [ ] **RapportPage — rendu adaptatif maison** — Onglets adaptés au type de bien.
- [ ] **ExemplePage — mock maison** — Villeurbanne, 4P 95m², score 12,5/20, DPE E.
- [ ] **Stripe TEST → production** — Passer les Price IDs en mode live.
- [ ] **Synchro last_sign_in_at** auth.users → profiles.

### ✅ Fait (session 16 — 28 avril 2026)

- [x] Migration SQL pro (5 tables + champs + RLS + fonctions)
- [x] Edge function admin-user-management (8 actions + templates Mailjet)
- [x] DashboardProPage complet (sidebar, HomeView, MesDossiers, DossierDetail, SendReportModal, MonAbonnement, ComptePro)
- [x] SetupAccountPage (finalisation compte pro via token)
- [x] SmartDashboard (détection role pro/user dans App.tsx)
- [x] Onglet Clients Pro dans AdminPage (liste, création, fiche détaillée, abonnement)
- [x] Bouton "Créer compte pro" depuis Demandes Pro (pré-remplit modal)
- [x] Bouton "Compte activé" au lieu de "Renvoyer le mail" quand invitation acceptée
- [x] Champs identité pro verrouillables après première sauvegarde + bouton "Demander une modification"
- [x] ContactProPage : téléphone rendu obligatoire
- [x] Bandeau "analyse offerte" masqué pour les pros
- [x] Config pro.verimo.fr (DNS OVH + Vercel + Supabase Auth)
- [x] SEO : data-nosnippet sur footer + réindexation Search Console
- [x] Responsive mobile dashboard pro (plans-grid, compte-grid en 1 colonne)


### ✅ Fait (session 17 — 28 avril 2026 soir : Stripe Pro)

- [x] **Stripe TEST configuré** — 5 produits créés avec Price IDs :
  - DECOUVERTE 19,90€/1+3 → `price_1TRKJMBO4ekMbwz0mOh2hUxI`
  - STARTER 49,90€/5+15 (Populaire) → `price_1TRKOZBO4ekMbwz0cAzSz8P8`
  - POWER 89,90€/10+30 → `price_1TRKPaBO4ekMbwz01mAualMR`
  - UNIT_COMPLETE 9,90€ → `price_1TRKQtBO4ekMbwz0Tqi4GeKK`
  - UNIT_SIMPLE 2,90€ → `price_1TRKRmBO4ekMbwz0ynLNDwn4`
- [x] **Migration SQL Stripe Pro** (`migration-stripe-pro.sql`) — extension `pro_subscriptions` + `pro_unit_purchases`, 4 fonctions PG (`get_pro_credits_balance`, `consume_pro_credit`, `reset_pro_subscription_credits`, `upgrade_pro_subscription_credits`), RLS
- [x] **Edge function `stripe-webhook-pro`** déployée à `https://veszrayromldfgetqaxb.supabase.co/functions/v1/stripe-webhook-pro` avec secret `STRIPE_WEBHOOK_SECRET_PRO`
- [x] **Edge function `stripe-checkout-create-pro`** pour générer les sessions Checkout
- [x] **MonAbonnement (Pro)** — boutons "Choisir ce plan" fonctionnels (DECOUVERTE/STARTER/POWER), achats unitaires (Complète/Simple), upgrade Option B = cumul de crédits


### ✅ Fait (session 18 — 29 avril 2026 : Dossiers Pro + Nouvelle Analyse)

#### Système de dossiers (Livrable 2)
- [x] **Migration `migration-pro-folders.sql`** appliquée :
  - Tables `pro_folders`, `pro_folder_sellers`, `pro_folder_buyers`
  - Champ `analyses.folder_id` ON DELETE CASCADE
  - Fonction `get_folder_stats()` créée mais DÉPRÉCIÉE (RLS issue avec SECURITY DEFINER) → remplacée par 3 counts directs côté frontend
- [x] **DashboardProPage.tsx — Mes Dossiers** (~3273 lignes) :
  - Liste dossiers + popup création (autocomplete adresse Etalab + CP→ville geo.api.gouv.fr)
  - Suppression sécurisée "tape SUPPRIMER"
  - **Vendeurs** (2B-1) : ajout/édition/suppression, couleur violet, animations motion layout, toast notifications
  - **Acheteurs** (2B-2) : même pattern, couleur vert, + champ status (candidat/sérieux/compromis/abandonné) avec badges colorés
  - Layout 2 colonnes vendeurs|acheteurs sur desktop (responsive)
  - **Tooltips custom** instantanés (composant `InfoTooltip` Verimo dark blue popover, animation fade+scale, flèche)
  - **Modifier infos dossier** (2B-4) : bouton ✏️ dans header → ModalEditFolder
  - Composant `Field` avec support : required, optional, hint, tooltip, icon

#### Nouvelle Analyse refonte (Livrable 3)
- [x] **`src/lib/analyses.ts`** : `createAnalyse` accepte param `folderId` (6e arg)
- [x] **`NouvelleAnalyse.tsx`** (1725 lignes) :
  - Nouvelle étape `folder_select` entre `choice` et `type_bien`
  - Capture `?folder=ID` depuis URL → skip folder_select si pré-sélectionné
  - Composant `FolderBanner` visible toutes étapes (type_bien, profil, upload) : "Analyse pour le dossier — [name]"
  - `FolderSelectStep` : autocomplete Etalab, liste dossiers existants, "+ Créer nouveau dossier" inline modal
  - Flow particulier inchangé
  - `analyses.folder_id` rempli automatiquement


### ✅ Fait (session 19 — 29 avril 2026 soir : Crédits offerts par admin)

- [x] **Migration `migration-credit-grants.sql`** appliquée :
  - Table `credit_grants` (audit log : user_id, granted_by, credit_type, quantity, reason, created_at)
  - Trigger PG `apply_credit_grant` qui détecte le rôle et route le crédit :
    - Pro → INSERT dans `pro_unit_purchases`
    - Particulier → UPDATE `profiles.credits_*`
  - RLS : user voit ses grants, admin gère tout
- [x] **AdminPage.tsx** :
  - Refonte modale "Modifier crédits" → "Ajouter des crédits" (les DEUX modales : liste + détail)
  - Form : Type chips Complète/Simple, Quantity stepper +/− (max 100), Raison textarea obligatoire (max 500 chars)
  - Bouton renommé avec icon `Plus`
  - Badge "⚡ pro" (bleu Verimo `#2a7d9c`/bg `#f0f7fb`) ajouté en liste users + fiche détail
- [x] **Hotfix `hotfix-pro-unit-purchases-v2.sql` à appliquer** — corrige le trigger qui utilisait `credit_type` au lieu de `type` (vraie colonne BDD), idem `amount` au lieu de `amount_paid_ht`


---

## 🗂️ TO DO — au reveil (priorité demain)

### 🔴 ÉTAPE 1 — Finir le système crédits offerts (30 min)

1. **Appliquer le hotfix SQL** (~/mnt/user-data/outputs/hotfix-pro-unit-purchases-v2.sql)
   - Supabase → SQL Editor → coller → Run
   - Doit afficher "Success. No rows returned"

2. **Vérifier les fonctions PG existantes** — `get_pro_credits_balance` et `consume_pro_credit` ont été écrites avec `credit_type` (qui n'existe pas) en session 17. Lancer dans SQL Editor :
   ```sql
   SELECT pg_get_functiondef('public.get_pro_credits_balance'::regproc);
   SELECT pg_get_functiondef('public.consume_pro_credit'::regproc);
   ```
   Si elles utilisent `credit_type`, il faut un **3e hotfix** qui les recrée avec `type`.

3. **Pusher AdminPage.tsx** sur GitHub (déjà livré, type-check OK)

4. **Tester le flow complet** :
   - Admin → ajoute 5 crédits Complète à compte test pro avec raison "test trigger"
   - Vérif sidebar pro : doit afficher 5 ✅
   - Vérif page Nouvelle analyse : doit afficher 5 crédits dispos ✅
   - Lancer une vraie analyse → vérif décrémentation à 4

### 🟠 ÉTAPE 2 — Historique côté client (Livrable 3 bis, ~45 min)

Section "Historique des crédits" dans **MonAbonnement** (côté Pro), affichant par ordre antichronologique :
- Achats Stripe (lus depuis `pro_unit_purchases` où `amount > 0`)
- Crédits offerts (lus depuis `credit_grants`) avec icône 🎁 + raison

Idem côté Particulier (à voir où exactement, peut-être dans Compte ou Tarifs).

### 🟡 ÉTAPE 3 — Livrable 2B-3 : Liste analyses dans DossierDetail (~30 min)

Maintenant que les nouvelles analyses ont `folder_id`, afficher dans la fiche dossier :
- Section "Analyses du dossier"
- Pour chaque analyse : score /20, DPE, date, type (Simple/Complète), bouton "Voir le rapport"
- Query : `analyses.folder_id = currentFolder.id`

### 🟡 ÉTAPE 4 — Livrable 4 : Compare.tsx avec regroupement par dossier (~1h)

Dans la page Comparer (dashboard pro), regrouper visuellement les analyses par dossier :
- Section pliable par dossier
- Visualisation des biens d'un même dossier côte à côte
- Possibilité de comparer entre dossiers ou au sein d'un dossier

### 🟢 ÉTAPE 5 — Bonus / améliorations à voir

- Page admin : voir l'historique des crédits attribués sur la fiche d'un user (qui a reçu, quand, combien, pourquoi)
- Améliorer le verdict en sortie de comparaison (refonte présentation rapport)
- Validation UX duplicate detection dossiers


---

## 🔑 État au coucher 29 avril (à reprendre demain)

**Bug en cours** : Admin a ajouté 5 crédits Complète à un compte pro test, mais :
- Tableau de bord pro : voit 5 ✅ (fallback `proProfile.credits_*`)
- Sidebar pro : voit 0 ❌ (lit `pro_subscriptions` uniquement, pas d'abo actif)
- Nouvelle analyse pro : voit 0 ❌ (lit `get_pro_credits_balance` qui pointe sur `credit_type` inexistant)

**Cause** : ma session 17 a créé les fonctions PG en supposant que la colonne s'appelait `credit_type`, alors qu'en BDD c'est `type`. La table `pro_unit_purchases` a aussi `amount` (pas `amount_paid_ht`).

**Solution en cours** : hotfix v2 corrige le trigger d'insertion. Reste à vérifier si `get_pro_credits_balance` et `consume_pro_credit` ont besoin du même fix.


---

## 📁 Fichiers livrés en attente de push GitHub

- ✅ `src/pages/AdminPage.tsx` (3713 lignes) — Ajouter crédits + badge pro — type-check OK
- ✅ `src/pages/dashboard/NouvelleAnalyse.tsx` (1725 lignes) — flow folder_select — type-check OK, déjà pushé
- ✅ `src/lib/analyses.ts` — createAnalyse avec folderId — type-check OK, déjà pushé
- ✅ `src/pages/DashboardProPage.tsx` (3273 lignes) — système dossiers complet — déjà pushé

## 📁 SQL à exécuter

- ✅ `migration-pro-folders.sql` — appliquée
- ✅ `migration-credit-grants.sql` — appliquée
- ⏳ `hotfix-pro-unit-purchases-v2.sql` — **À APPLIQUER demain matin en priorité**


---

## 📊 Architecture crédits pro (récap pour ne plus se perdre)

**Sources de crédits pro** (lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance`) :

1. **Abonnement** → `pro_subscriptions` (colonnes `credits_complete_total/used` et `credits_simple_total/used`) — recharge mensuelle via webhook Stripe
2. **Achats unitaires** → `pro_unit_purchases` (colonne `type` = 'complete'|'simple', `quantity`, `credits_remaining`, `amount` en centimes) — jamais expirés
3. **Crédits offerts** → table `credit_grants` (audit log) + trigger qui crée auto un `pro_unit_purchases` avec `amount=0`

**Sources de crédits particulier** :
- `profiles.credits_document` et `profiles.credits_complete` (système legacy unique)
- `credit_grants` met à jour ces colonnes via trigger
