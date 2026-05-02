# VERIMO — Contexte projet complet — 2 mai 2026 (après sessions 1 à 21)

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
  - `notification@verimo.fr` → mails transactionnels particuliers (Supabase Auth)
  - `pro@verimo.fr` → mails pro (invitations, rapports partagés via edge function)
  - Nom expéditeur rapports : "[Prénom] vous a partagé un rapport"
- **Déploiement** : Vercel (frontend auto depuis GitHub) + Supabase (edge functions manuelles)
- **Repo** : `github.com/emilio92100/analymoCD`
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`
- **Domaine** : verimo.fr (OVH registrar)
- **Domaine pro** : pro.verimo.fr (CNAME → Vercel)
- **Logo blanc** : `/public/logo-blanc.png` (fond transparent, utilisé dans sidebars + emails)

---

## Routes
```
/                             → HomePage
/pro                          → ProPage
/contact-pro                  → ContactProPage
/tarifs                       → TarifsPage
/contact                      → ContactPage
/exemple                      → ExemplePage
/methode                      → MethodePage
/confidentialite              → ConfidentialitePage
/cgu                          → CGUPage
/mentions-legales             → MentionsLegalesPage
/connexion                    → LoginPage
/inscription                  → SignupPage
/mot-de-passe-oublie          → ForgotPasswordPage
/auth/reset-password          → ResetPasswordPage
/start                        → StartPage
/setup-account?token=XXX      → SetupAccountPage (pro)
/admin                        → AdminPage
/dashboard                    → SmartDashboard (détecte role)
/dashboard/nouvelle-analyse   → NouvelleAnalyse
/dashboard/analyses           → MesAnalyses (particulier)
/dashboard/dossiers           → MesDossiersPro (pro)
/dashboard/dossier/:id        → DossierDetail (pro)
/dashboard/compare            → Compare
/dashboard/abonnement         → MonAbonnement (pro)
/dashboard/compte             → Compte ou ComptePro
/dashboard/tarifs             → Tarifs (particulier)
/dashboard/aide               → Aide
/dashboard/support            → Support
/rapport?id=XXX               → RapportPage
/rapport-partage?token=XXX    → RapportPartagePage
/rapport-comparaison?ids=X,Y  → RapportComparaisonPage
```

---

## ✅ Session 21 — 2 mai 2026 — Admin refonte, emails pro, envoi rapports, abonnements

### Résumé
Session massive : refonte complète admin (stats, CA, transactions), gestion abonnements pro (annulation/réactivation/factures), templates emails pro, système d'envoi de rapports depuis les dossiers, fix rapport partagé, fix reset password, édition identité pro admin, suppression compte pro.

### A. Admin — Refonte dashboard

**Onglets renommés :**
- "Vue d'ensemble" → "Tableau de bord"
- "Statistiques" → "Analyse / CA"
- "Paiements" → "Relevé des transactions"

**Tableau de bord (mois en cours) :**
- CA total = Particuliers + Pro (subscriptions + unit purchases)
- Répartition "Particuliers: X€ · Pro: Y€"
- CA par catégorie : split Particuliers (Simple, Complète, Pack 2, Pack 3) + Pro (Abo Découverte/Starter/Power, Unit Complète/Simple)
- 4 KPIs compacts sur une ligne : Nouveaux clients | Nb de pro abonnés (fond sombre) | Analyses lancées | Ticket moyen
- `pro_unit_purchases` filtré avec `.gt('amount', 0)` pour exclure crédits offerts

**Analyse / CA :**
- Filtre source : Tout / Particuliers / Pro — affichage contextuel
- Pro : masque inscriptions graph, affiche "Nouveaux abonnés pro"
- Particulier : masque KPIs pro
- **Évolutions ↑/↓ %** vs période précédente pour CA, clients, analyses
- Graphique CA par semaine : montants exacts au centime
- Crédits offerts intégrés inline (plus de section pleine largeur)

**Relevé des transactions :**
- Inclut transactions pro (subscriptions + unit purchases)
- Badge PRO/PART. sur chaque ligne
- Filtre source Tout/Particuliers/Pro

**Clients Pro — Liste :**
- Filtres "Tous / 🟢 Actifs / Inscrits" avec compteurs
- Badge "Actif" (vert) ou "Inscrit" (gris) par client
- Charge les abonnements pour déterminer le statut

**Clients Pro — Fiche détaillée :**
- Section "Identité professionnelle" : nom commercial, réseau, SIRET, ville, adresse pro — mode lecture / mode édition
- Bouton "✏️ Modifier" → inputs éditables → "✅ Enregistrer" avec log des changements
- Section "Factures" avec PDF Stripe (via `list_invoices` + `target_user_id`)
- Bouton "🗑️ Supprimer" avec confirmation (cascade BDD)
- Bouton "🔑 Reset MDP" → envoie email de réinitialisation au client
- Bouton "✉️ Modifier email" → change email Auth + profiles
- Statut abonnement : Actif (vert) / Résiliation en cours (orange) / Résilié (rouge) + raison

### B. Dashboard Pro — MonAbonnement

- Suppression header redondant + badge "Votre plan actuel · Renouvellement JJ/MM/AA"
- Section "Mes factures" : table Stripe invoices (Date, Description FR, Type, Amount, PDF)
- **Annulation 3 étapes** : popup émotionnel → raison de départ (6 options) → confirmation
- **Réactivation** : bouton vert sur plan card quand `cancel_at_period_end`
- Section "Crédits offerts" séparée
- Logo blanc dans sidebar (`/logo-blanc.png`)
- Bouton suppression logo sur page Mon Compte

### C. Emails Pro

**Expéditeur :** `pro@verimo.fr` — Nom : "Verimo Pro" (invitations) / "[Prénom] vous a partagé un rapport" (rapports)

**Templates refaits :**
- Invitation pro : 🎉 titre, emojis (📊🏆📧🎨), plan pré-sélectionné ✨, logo blanc header
- Renvoi lien : 🔑 template court séparé
- Rapport partagé : bloc "Ce rapport vous est présenté par [Nom] — [Réseau] ([Société])" en haut, logo pro dans zone blanche, chaque rapport en card avec "Consulter le rapport →", téléphone pro, footer Verimo discret

**Sujets :**
- Invitation : `🏢 Bienvenue sur Verimo Pro — Activez votre compte`
- Renvoi : `🔑 Verimo Pro — Nouveau lien de connexion`
- Rapport : `Votre rapport d'analyse — [adresse]`

### D. Envoi rapports depuis dossier

**4 boutons d'action** dans vue dossier : Vendeur (blanc) | Acheteur potentiel (blanc) | Lancer analyse (bleu) | Envoyer analyse (vert)

**Wizard 3 étapes avec animations :**
1. Sélection destinataires (vendeurs + acheteurs avec badges, multi-select)
2. Sélection analyses (multi-select, score affiché)
3. Message personnalisé pré-rempli (adaptatif selon docs sélectionnés) + preview

**Fonctionnalités :**
- Message adaptatif : utilise adresse du dossier, noms des docs nettoyés
- Envoi groupé : `send_report_batch` — un seul mail par destinataire avec tous les rapports
- Animation d'envoi : spinner + barre de progression + "✅ Rapports envoyés !"
- Popup bloqué (pas de fermeture au clic extérieur)
- Conseil logo si pas uploadé ("💡 ajoutez-le dans Mon compte")

**Historique envois dans dossier :**
- Regroupé par destinataire
- Statut "✓ Ouvert le JJ/MM/AA" / "En attente" **par document** (pas par bloc)
- Nom du doc nettoyé (première partie avant " — ")

### E. Fix rapport partagé (introuvable)

- `fetchAnalyseByShareToken` (analyses.ts) : cherche d'abord dans `report_shares`, fallback `analyses.share_token`
- Marque `opened_at` automatiquement quand le client ouvre le lien
- Policies RLS ajoutées sur `report_shares` : SELECT public + UPDATE pour marquer ouvert

### F. Fix reset mot de passe

- **Cause** : `window.location.origin` retournait `https://www.verimo.fr` → redirection www → non-www perdait le hash token
- **Fix ForgotPasswordPage** : `redirectTo` forcé en dur à `https://verimo.fr/auth/reset-password`
- **Fix ResetPasswordPage** : détection token recovery dans URL hash + spinner "Vérification en cours…" au lieu de flash "lien invalide"

### G. Autocomplétion adresse dossier

- Fix ville vide : flags `skipAddressAutoRef` et `skipPostalAutoRef` pour empêcher les useEffect de se redéclencher après sélection
- Extraction adresse propre : retire code postal et ville du champ adresse
- Alignement code postal / ville : grille `1fr 2fr`
- Tooltip sur "Note interne" : infos privées

### H. Edge functions mises à jour

**`admin-user-management`** (12 actions) :
- `verify_pro_token`, `setup_pro_account` (publiques)
- `send_report` (pro ou admin, vérifie ownership)
- `send_report_batch` (pro ou admin, envoi groupé)
- `create`, `create_pro`, `send_pro_invitation`, `resend_pro_invitation` (admin)
- `invite`, `delete`, `reset_password`, `update_email` (admin)

**`pro-checkout-create`** :
- Mode `cancel` : `cancel_at_period_end` + `cancellation_reason`
- Mode `reactivate` : reverse cancellation
- Mode `list_invoices` : supporte `target_user_id` pour admin
- Gestion erreurs paiement en français (card_declined, expired_card, etc.)

### Fichiers modifiés session 21
```
src/pages/AdminPage.tsx            → ~4400 lignes (refonte stats, CA pro, filtres, identité pro, suppression, reset mdp, modifier email)
src/pages/DashboardProPage.tsx     → ~4400 lignes (MonAbonnement, envoi rapports wizard, historique, logo, autocomplétion)
src/pages/DashboardPage.tsx        → ~590 lignes (logo blanc sidebar)
src/pages/ForgotPasswordPage.tsx   → fix redirectTo sans www
src/pages/ResetPasswordPage.tsx    → fix détection token + spinner
src/lib/analyses.ts                → fix fetchAnalyseByShareToken (report_shares + opened_at)

Edge functions :
- admin-user-management (12 actions, templates emails refaits, pro@verimo.fr)
- pro-checkout-create (cancel, reactivate, list_invoices avec target_user_id)

SQL exécutés :
- ALTER TABLE pro_subscriptions ADD COLUMN cancellation_reason text
- Policies RLS report_shares (SELECT public, UPDATE marquer ouvert)

Assets :
- /public/logo-blanc.png (logo blanc fond transparent)
```

### SQL à vérifier session 21
- `pro_subscriptions.cancellation_reason` existe
- RLS `report_shares` : "Accès public lecture report_shares" (SELECT) + "Marquer rapport ouvert" (UPDATE)

---

## Sessions 1 à 20 (résumé condensé)

- **Sessions 1-2** (19/04) — ProPage, ContactProPage, HomePage, TarifsPage, AdminPage, Compare v1
- **Sessions 3-5** (20-21/04) — Prompt enrichi, type de bien, ExemplePage, MethodePage
- **Session 6** (22/04) — Scoring déterministe `recalculerCategories()`
- **Session 7** (22/04) — Refonte résumé/avis Verimo, countdown
- **Sessions 8-12** (22-23/04) — Architecture comparaison, verdict V2, DashboardLoader
- **Session 13** (23/04) — Refonte AdminPage, responsive mobile, RLS admin, webhook Stripe, recherche ⌘K
- **Session 14** (24/04) — Redesign sidebar, MesAnalyses, Compare C3, corrections prompt
- **Session 15** (27/04) — Messaging harmonisé, remboursement auto, alertes système
- **Session 16** (28/04) — Dashboard pro complet, edge functions pro, config DNS pro.verimo.fr
- **Sessions 17-19** (28-29/04) — Stripe Pro, dossiers complet, credit_grants + trigger
- **Session 20** (30/04) — Crédits pro fonctionnels, notifications, historique, code promo, popups succès

---

## 📊 Architecture crédits (récap définitif)

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions`
2. **Achats unitaires** → `pro_unit_purchases`
3. **Crédits offerts** → `credit_grants` + trigger `apply_credit_grant`

**Consommation** : `consume_pro_credit(p_user_id, p_credit_type)`
**Remboursement** : `refund_pro_credit(p_user_id, p_credit_type)`

### Contraintes BDD
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA

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

---

## Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Teal sidebar particulier** : `#0e3a4a`
- **Sidebar pro** : `#0a1f2d`
- **Accent pro** : `#7dd3fc`
- **Header dark** : `#0f2d3d`
- **Header email** : `#1a3a4a` → `#2a5a6e` (plus clair)

---

## 🗂️ Backlog

### 🔴 Priorité haute

- [ ] **Veille réglementaire — prompt analyser-run** — DPE collectif copros <50 lots (jan 2026), PPT obligatoire (jan 2026)
- [ ] **Prompt caching API Anthropic** — ~90% d'économie possible
- [ ] **Stripe TEST → production** — Passer les Price IDs en mode live

### 🟡 Priorité normale

- [ ] **Page connexion** : agrandir logo mobile, bouton retour vers site
- [ ] **Page inscription** : ajouter champ "Répéter votre mot de passe"
- [ ] **Page mdp oublié** : agrandir logo mobile, bouton retour
- [ ] **Refonte page Mon Compte Pro** : fusionner sections identité perso + identité pro + coordonnées visibles. Email de contact = email de connexion (bloquer). Tooltips sur champs visibles dans les mails.
- [ ] **Template email prospection** : 3 versions prêtes (V1 court, V2 visuel, V3 relance). Configurer dans Mailjet avec sous-domaine `outreach.verimo.fr`.
- [ ] **Supprimer le flow aperçu gratuit**
- [ ] **Barre de progression NouvelleAnalyse** — Monte trop vite puis stagne
- [ ] **Refonte verdict comparaison**
- [ ] **ExemplePage — mock maison**

### ✅ Résolu session 21

- [x] Admin dashboard refonte complète (CA pro, stats, filtres, évolutions ↑/↓)
- [x] Filtres Actifs/Inscrits dans Clients Pro
- [x] Identité pro éditable depuis admin + sync dashboard client
- [x] Suppression compte pro avec cascade
- [x] Reset MDP via email depuis admin
- [x] Modifier email depuis admin
- [x] Factures Stripe dans fiche client pro
- [x] Abonnement pro : annulation 3 étapes, réactivation, raison de départ
- [x] Templates emails pro refaits (emojis, logo blanc, pro@verimo.fr)
- [x] Envoi rapports depuis dossier (wizard 3 étapes, multi-analyses, vendeurs + acheteurs)
- [x] Envoi groupé (un mail par destinataire avec tous les rapports)
- [x] Historique envois groupé par destinataire avec statut par document
- [x] Fix rapport partagé introuvable (report_shares + opened_at + RLS)
- [x] Fix reset mot de passe (www → non-www perdait le token)
- [x] Logo blanc dans sidebars (particulier + pro)
- [x] Autocomplétion adresse dossier (ville vide corrigée)
- [x] Tooltip note interne
- [x] Bouton suppression logo pro
- [x] Edge function analyser confirmée clean en production
