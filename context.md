# VERIMO — Context de développement
> Dernière mise à jour : 9 avril 2026
> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## 🧑 Profil développeur
- Débutant en développement
- Modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- Pour créer un nouveau fichier : GitHub → dossier cible → "Add file" → "Create new file"
- Vercel redéploie automatiquement après chaque push GitHub
- Claude peut cloner le repo directement : `https://github.com/emilio92100/analymoCD.git`
- **Important** : Claude doit toujours re-cloner avant de modifier, puis donner le fichier COMPLET à coller

---

## 🏠 Le produit
**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges). Rapport clair avec score /20, risques, recommandations en 30 secondes*.

**Slogan :** *Vos documents décryptés, votre décision éclairée.*

**Cible :** Acheteurs particuliers (principal — appartements en copropriété majoritairement, mix primo-accédants et investisseurs, les deux stades avant offre et après compromis), notaires, agents, syndics, marchands de biens.

**Logique crédits / prix :**
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de score /10
- 19,90€ → 1 crédit analyse complète
- 29,90€ → 2 crédits analyse complète (Pack 2 biens — comparaison côte à côte incluse)
- 39,90€ → 3 crédits analyse complète (Pack 3 biens — comparaison + classement final inclus)
- Les crédits n'expirent jamais et s'accumulent
- Nouveaux comptes arrivent à 0 crédit

---

## 🏗️ Stack technique
- **Frontend** : React + Vite + TypeScript + Tailwind
- **Backend** : Supabase (auth + DB + Edge Functions Deno)
- **IA** : Claude API via Edge Function (`claude-sonnet-4-6`, effort: medium)
- **Paiement** : Stripe (mode test actuellement, à passer en live)
- **Déploiement** : Vercel (auto depuis GitHub)
- **Repo** : github.com/emilio92100/analymoCD

---

## 🗺️ Routes
```
/                           → HomePage
/notre-methode              → MethodePage
/tarifs                     → TarifsPage
/contact / /exemple         → pages publiques
/connexion                  → LoginPage
/inscription                → SignupPage
/auth/callback              → AuthCallbackPage
/mot-de-passe-oublie        → ForgotPasswordPage
/auth/reset-password        → ResetPasswordPage
/dashboard                  → DashboardPage (HomeView)
/dashboard/nouvelle-analyse → DashboardPage (NouvelleAnalyse)
/dashboard/analyses         → DashboardPage (MesAnalyses)
/dashboard/compare          → DashboardPage (Compare)
/dashboard/compte           → DashboardPage (Compte)
/dashboard/support          → DashboardPage (Support)
/dashboard/tarifs           → DashboardPage (Tarifs interne)
/dashboard/rapport?id=XXX   → DashboardPage (RapportDashboard) ← APERÇUS GRATUITS
/rapport?id=XXX             → RapportPage standalone ← RAPPORTS COMPLETS PAYANTS
```

---

## 🎁 Système aperçu gratuit

### Principe
- 1 aperçu gratuit par compte
- Stocké dans `profiles.free_preview_used` + `localStorage.verimo_free_preview_used`
- Sync au login → zéro flash UI
- `markFreePreviewUsed()` appelé **dès le lancement** (pas après) → badge disparaît immédiatement
- `unmarkFreePreviewUsed()` appelée si analyse échoue → offre restaurée

### Flow complet
1. Badge "1 analyse offerte 🎁" visible (navy, animation pulseGlow)
2. Clic → upload → `lancerApercu()` → `markFreePreviewUsed()` immédiat
3. Si échec → `unmarkFreePreviewUsed()` → offre restaurée
4. Aperçu sauvegardé dans Supabase : `is_preview=true`, `apercu={}`, `result=null`
5. Badge "Aperçu gratuit" dans Mes analyses
6. Clic "Rapport" sur aperçu → `/dashboard/rapport?id=XXX` → `RapportDashboard` (avec sidebar)
7. Bouton "Débloquer" → Stripe directement avec `successUrl=/dashboard/rapport?id=XXX&action=reupload`
8. Après paiement → message RGPD sympa + invitation re-upload

### Logique bouton Analyser (NouvelleAnalyse)
```
Si offre pas utilisée ET 0 crédit du bon type → lancerApercu()
Sinon → lancer() (analyse payante)
Si 0 crédit ET offre utilisée → redirection /dashboard/tarifs
```

### Messages
**Re-upload après paiement :**
> "Bonne nouvelle ! Conformément au RGPD, vos documents ont été supprimés 🔒. Re-uploadez vos documents pour générer votre rapport complet... et profitez-en pour ajouter ceux que vous aviez oubliés ! 😉"

**Post-paiement si offre encore disponible (bannière dashboard) :**
> "Petite info de notre côté 👋 Votre analyse découverte non utilisée a été remplacée par votre achat. Après tout, pourquoi regarder par le trou de la serrure quand on peut ouvrir la porte en grand ? 🚪 Maintenant vous avez toutes les clés en main 🔑 Bonne analyse avec Verimo !"

---

## 🤖 Architecture IA — Edge Function `analyser`

### Modèle
- `claude-sonnet-4-6`, effort: `medium`
- Seuil Map-Reduce : `TOKEN_THRESHOLD = 300_000` ou `files.length > 6`

### Stratégies
- **Smart Stuffing** : tous les docs dans un seul appel (< 300k tokens)
- **Map-Reduce** : extraction parallèle par doc (MAP) → synthèse (REDUCE)
  - Phase MAP : `claude-haiku-4-5-20251001`, `maxTokens: 2500`
  - Phase REDUCE : `claude-sonnet-4-6`, `maxTokens: 6000`

### Types de documents détectés
`PV_AG`, `REGLEMENT_COPRO`, `APPEL_CHARGES`, `DPE`, `DIAGNOSTIC`, `DDT`, `COMPROMIS`, `ETAT_DATE`, `AUTRE`

### PROMPT_MAP — informations extraites par document
Instructions spécifiques par type :
- **PV_AG** : participation (présents/représentés/tantièmes), travaux votés + statut réalisation, appels fonds exceptionnels (charge vendeur si avant compromis), honoraires syndic, questions diverses, résolutions refusées, tensions sur renouvellement syndic
- **REGLEMENT_COPRO** : tantièmes du lot, restrictions d'usage, parties privatives du lot, clauses travaux (fenêtres/balcons/compteurs)
- **DPE** : date diagnostic (ALERTE si antérieur 01/07/2021 — invalide depuis 01/01/2025), étiquette énergie/GES, type chauffage (individuel ou collectif), préconisations travaux avec coûts
- **APPEL_CHARGES** : quote-part tantièmes, charges courantes vs exceptionnelles, budget prévisionnel vs réalisé, fonds travaux ALUR
- **COMPROMIS** : conditions suspensives, date jouissance, répartition travaux vendeur/acheteur (règle : votés avant compromis = charge vendeur), pénalités
- **ETAT_DATE** : impayés du lot sur 3 ans, provisions non soldées, quote-part fonds travaux ALUR du lot (revient à l'acheteur à l'acte)
- **DIAGNOSTIC** : nature, résultats, préconisations travaux avec urgence et coûts

### PROMPT_REDUCE — règles importantes
- Frais d'agence à charge vendeur → **jamais** mentionner comme point positif (intégrés dans le prix)
- Fonds travaux / charges copro → **uniquement pour biens en copropriété**
- Maison individuelle hors copro → `fonds_travaux_statut: "non_applicable"`, `vie_copropriete: null`
- Ne jamais inventer des infos absentes

### summariesText (phase REDUCE)
Transmet **toutes** les données structurées au REDUCE : syndic, participation AG avec tantièmes, honoraires, appels fonds exceptionnels, questions diverses, parties privatives, impayés du lot. (Fix majeur session 09/04 — avant ces données étaient perdues entre MAP et REDUCE)

### Table `reglementation` Supabase
15 règles législatives chargées dynamiquement : DPE, copropriété, vente, location, diagnostics

---

## 🔑 Clés et secrets

### Supabase Secrets (Edge Function `analyser`)
- `ANTHROPIC_API_KEY` : clé API Anthropic (sk-ant-...)
- `STRIPE_SECRET_KEY` : clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` : secret webhook Stripe
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` : auto-injectés

### Edge Functions Supabase
- `analyser` : analyse IA des documents
- `create-checkout-session` : création session Stripe — accepte `successUrl` personnalisée en paramètre
- `stripe-webhook` : traitement paiements Stripe → ajout crédits

### Stripe Price IDs (mode TEST)
```
document : price_1TIb1LBO4ekMbwz0020eqcR0  (4,90€)
complete : price_1TIb3XBO4ekMbwz0a7m7E7gD  (19,90€)
pack2    : price_1TIb4KBO4ekMbwz0gGF2gI1S  (29,90€)
pack3    : price_1TIb51BO4ekMbwz0mmEez47o  (39,90€)
```

---

## 🗄️ Supabase — État

### Tables principales
- `analyses` : toutes les analyses (aperçus + complètes)
  - Colonnes clés : `id`, `user_id`, `type`, `status`, `result` (jsonb), `apercu` (jsonb), `is_preview`, `paid`, `title`, `score`, `profil`, `document_names`, `regeneration_deadline`, `progress_current`, `progress_total`, `progress_message`
- `profiles` : profils utilisateurs
  - Colonnes clés : `credits_document`, `credits_complete`, `free_preview_used`
- `payments` : historique paiements
- `reglementation` : règles législatives
- `promo_codes`, `promo_uses` : codes promo
- `banners` : bannières dashboard

### Timeout Edge Functions
- **Plan FREE** : timeout réel ~80-150s instable (EarlyDrop aléatoire)
  - 2 docs (~270k tokens) : ~80s → parfois EarlyDrop
  - 3 docs (~670k tokens) : ~110s → parfois OK
  - 6 docs (~1.1M tokens) : ~128s → EarlyDrop systématique
- **Plan Pro (25$/mois)** : timeout 400s → résout tous les cas normaux
- **⚠️ Action requise** : upgrade Supabase Pro pour analyses complètes fiables

---

## 📁 Fichiers modifiés — État final session 09/04/2026

### `supabase/functions/analyser/index.ts`
- Modèle `claude-sonnet-4-6`, effort medium, TOKEN_THRESHOLD=300_000
- PROMPT_MAP enrichi : tous types de documents avec instructions spécifiques
- PROMPT_REDUCE enrichi : vie_copropriete (syndic, participation AG tableau, tendance, travaux non réalisés, honoraires), lot_achete (tantièmes, fonds ALUR, parties privatives, restrictions, charge vendeur)
- `apercu_document` et `apercu_complete` séparés : titre = nature du doc pour simple, adresse pour complète
- summariesText enrichi : transmet TOUTES les données structurées au REDUCE
- Règles maison individuelle vs copropriété ajoutées
- Vérification d'erreur sur sauvegarde Supabase avec fallback minimal
- maxTokens REDUCE : 6000

### `src/pages/RapportPage.tsx`
- `vie_copropriete`, `lot_achete`, `finances`, `diagnostics_resume` ajoutés dans le mapping `setRapport()` **(fix majeur)**
- Ces champs ajoutés dans `MOCK_RAPPORT` avec types corrects
- `DetailNote` filtre catégories copro (finances, diagnostics communs) selon `type_bien`
- Section "Charges de copropriété" masquée pour maisons individuelles
- Affichage inline des aperçus gratuits (`apercuData`) sans redirection
- Bouton "Débloquer" dans aperçu inline lance Stripe directement
- Import `supabase` ajouté
- maxWidth: 1200
- Bandeau re-upload après paiement (`action=reupload`)

### `src/pages/DashboardPage.tsx`
- Composant `RapportDashboard` ajouté : gère `/dashboard/rapport?id=XXX`
  - Si aperçu → affiche aperçu avec CTA débloquer (dans dashboard avec sidebar)
  - Si rapport complet → redirige vers `/rapport?id=XXX`
  - Si `action=reupload` → message RGPD sympa + bouton re-upload
- Route `/dashboard/rapport` ajoutée dans `DashboardContent`
- Imports : `useSearchParams`, `AlertTriangle`, `Lock`, `Sparkles`, `CheckCircle`

### `src/pages/dashboard/NouvelleAnalyse.tsx`
- `lancerPaiementApercu()` : lance Stripe directement depuis l'aperçu avec successUrl personnalisée
- `unmarkFreePreviewUsed` importé et appelé si analyse échoue
- `markFreePreviewUsed` appelé **dès le lancement** (pas après)
- Logique bouton Analyser corrigée : vérifie crédits du bon type
- Si 0 crédit ET offre utilisée → redirection `/dashboard/tarifs`
- Redirection après analyse complète : `/rapport?id=...`
- `useSearchParams` importé pour charger aperçu depuis URL `?apercu_id=`
- **⚠️ Alert DEBUG à supprimer** : chercher `alert('DEBUG type=')` et supprimer la ligne

### `src/lib/analyses.ts`
- `unmarkFreePreviewUsed()` ajoutée : remet `free_preview_used=false` dans Supabase + supprime localStorage

### `src/App.tsx`
- Route `/rapport` ajoutée (RapportPage standalone pour rapports complets)
- Route `/dashboard/rapport` → DashboardPage

### `src/pages/HomePage.tsx`
- Titre 3 lignes : "Comprenez l'essentiel / de votre achat immobilier / avant de signer."
- Police titre mobile : `clamp(26px, 6.5vw, 34px)` / desktop : `clamp(28px, 3.2vw, 44px)`
- Sous-titre : "PV d'AG, règlement de copropriété, diagnostics, appels de charges…"
- "2 minutes" → "30 secondes*" partout
- Bloc Avant/Après : colonne "Sans Verimo" moins grisée, texte rouge visible
- Ordre sections : Hero → Problème → Aperçu → Avant/Après → Pour qui → Score → Comment ça marche → Avis → Sécurité → FAQ
- Avis clients : 4 avis en grille 2 colonnes

### `src/pages/TarifsPage.tsx`
- Titre sur une ligne, sous-titre `whiteSpace: nowrap`
- Badges comparaison/offre pro/FAQ plus grands
- "30 secondes*" partout

### `src/pages/ContactPage.tsx`
- Animation soulignement sur "pour vous." ajoutée
- Sous-titre `whiteSpace: nowrap` (une ligne PC)

### `src/pages/MethodePage.tsx`, `src/pages/SignupPage.tsx`, `src/pages/ExemplePage.tsx`
- "30 secondes*" partout

### `src/pages/dashboard/HomeView.tsx`
- "Aucune analyse complète" supprimé
- Media queries mobile : stats 2 colonnes

### `src/pages/dashboard/Tarifs.tsx`
- Bouton code promo : message personnalisé selon type et quantité

### `src/pages/AdminPage.tsx`
- Liste codes promo responsive mobile

### `src/pages/dashboard/Compte.tsx`
- 3 encarts : crédits complets, crédits simples, analyses réalisées

---

## 🔄 Flux paiement complet

### Achat depuis page Tarifs (crédit standard)
1. Clic "Acheter" → `CheckoutModal` → Stripe
2. `success_url` → `/dashboard/tarifs?success=true`
3. Webhook Stripe → `stripe-webhook` → ajoute crédits dans `profiles`

### Déblocage depuis aperçu gratuit
1. Clic "Débloquer" dans aperçu → `lancerPaiementApercu(isComplete, apercuId)`
2. `success_url` → `/dashboard/rapport?id=APERCU_ID&action=reupload`
3. Webhook Stripe → ajoute crédits
4. `RapportDashboard` détecte `action=reupload` → message RGPD sympa
5. Utilisateur re-uploade → analyse complète → `/rapport?id=NEW_ID`

---

## 🎨 Affichage rapport complet

### Onglets
`Synthèse | Copropriété | Travaux | Finances | Procédures | Documents`

### Onglet Copropriété (données depuis `vie_copropriete`)
- Syndic : nom, fin mandat, tensions détectées
- Tableau participation AG par année (tantièmes, présents/représentés, quorum)
- Tendance participation + analyse
- Votre lot : tantièmes, fonds ALUR récupérable, parties privatives, restrictions
- Questions diverses notables
- Appels de fonds exceptionnels
- Travaux votés non réalisés

### Onglet Finances (conditionné au type de bien)
- "Charges de copropriété" masqué pour maisons individuelles (`type_bien === 'maison'`)
- Fonds travaux statut : conditionné à la copropriété

### DetailNote (détail de la note /20)
- Catégories "Finances copropriété" et "Diagnostics communs" filtrées pour maisons individuelles

### Système 7 jours (re-génération gratuite)
- `regeneration_deadline` = `created_at + 7 jours`
- Bannière visible sur rapport complet pendant 7 jours
- Permet d'ajouter des docs et régénérer gratuitement

---

## ❌ Bugs connus / À faire

### 🔴 CRITIQUE
1. **Supabase timeout** : analyses complètes échouent avec EarlyDrop sur plan FREE → **upgrade Pro 25$/mois**
2. **Alert DEBUG** à supprimer dans `NouvelleAnalyse.tsx` : chercher `alert('DEBUG type=')` et supprimer la ligne

### 🟡 IMPORTANT
3. **Titre rapport complet** : affiche "Analyse complète" au lieu de l'adresse du bien — le prompt REDUCE retourne parfois un titre générique
4. **Stripe mode live** : toujours en mode TEST → passer en production
5. **Onglet Copropriété** : à valider visuellement après le fix mapping `vie_copropriete`

### 🟢 AMÉLIORATIONS
6. **UX chargement** : barre bloquée à 30% et label "Lecture des documents" figé — à rendre plus dynamique et progressif
7. **Rapport plus riche** : ajouter graphiques (participation AG chart, évolution charges), mieux exploiter les données diagnostics
8. **Onglet Travaux** : travaux évoqués non votés mentionnés en synthèse mais absents de l'onglet Travaux
9. **Diagnostics** : données DIAGNOSTIC/DDT pas toujours remontées dans le rapport

---

## 💡 Décisions produit

- **Score** : /20 (pas /10)
- **"30 secondes*"** partout — astérisque précise "PDF nativement numériques, scannés peuvent nécessiter plus"
- **Analyse simple** : 1 doc, pas de score, titre = nature du document
- **Analyse complète** : docs illimités pour un bien, score /20, titre = adresse du bien
- **Aperçu gratuit** : résumé + points de vigilance + score flouté (complète) + liste floutée → CTA débloquer
- **RGPD** : documents supprimés après traitement → re-upload nécessaire après paiement aperçu
- **Comparaison biens** : se débloque avec 2+ analyses complètes
