# ANALYMO — Contexte Projet
> **Colle ce fichier en début de conversation Claude pour reprendre le contexte.**
> Dernière mise à jour : 30 mars 2026

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
**Analymo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges). Rapport clair avec score /10, risques, recommandations en 30 secondes*.

*Pour les documents PDF nativement numériques. Les documents scannés peuvent nécessiter un délai supplémentaire.

**Cible :** Acheteurs particuliers (principal), notaires, agents, syndics, marchands de biens.

**Logique crédits / prix :**
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de score /10
- 19,90€ → 1 crédit analyse complète
- 29,90€ → 2 crédits analyse complète
- 39,90€ → 3 crédits analyse complète
- Les crédits n'expirent jamais et s'accumulent

**Fonctionnement :**
1. Client paie (Stripe — pas encore branché)
2. Upload ses documents (1 pour simple, illimités pour complète)
3. Notre outil détecte le nom du doc (4,90€) ou l'adresse complète du bien (19,90€+)
4. Rapport généré en 30 secondes* via API Claude
5. Rapport sauvegardé dans Supabase, visible dans le dashboard
6. Rapport téléchargeable en PDF
7. Comparaison uniquement disponible pour les analyses complètes

**⚠️ Règle absolue : ne jamais écrire "IA" dans les textes visibles par l'utilisateur.** Utiliser "notre outil", "notre moteur", "traitement", etc.

---

## 🛠 Stack technique
| Technologie | Usage |
|---|---|
| React 18 + Vite + TypeScript | Frontend |
| Tailwind CSS v3 | Styles |
| Framer Motion | Animations |
| React Router DOM | Navigation |
| Supabase | Auth + Base de données |
| Claude API (claude-sonnet-4-20250514) | Analyse des documents |
| Stripe | Paiements — **pas encore configuré** |
| Vercel | Déploiement auto depuis GitHub |
| Mailjet | SMTP emails (SPF ✅ + DKIM ✅ + DMARC ✅) |

**Police :** DM Sans
**Couleurs :** `#2a7d9c` (teal) / `#0f2d3d` (navy) / `#f0a500` (gold)
**Fond général :** `#f4f7f9` (bleuté clair)
**Fond dashboard :** `#f5f9fb`
**Sidebar dashboard :** blanche `#fff` avec bordure légère `#edf2f7`
**Style général :** moderne SaaS, cartes blanches, fond bleuté, pas de dark mode

---

## 📁 Structure du projet
```
src/
├── App.tsx                        ← routing complet + SessionManager 1h + ScrollToTop ✅
├── index.css                      ← variables CSS globales
├── components/layout/
│   ├── Navbar.tsx                 ← navbar dynamique (Mon espace si connecté)
│   └── Footer.tsx                 ← footer dark navy + disclaimer outil
├── lib/
│   ├── supabase.ts                ← client Supabase
│   ├── analyses.ts                ← fonctions CRUD analyses Supabase
│   └── prompts.ts                 ← prompts Claude
├── pages/
│   ├── HomePage.tsx               ← landing page principale ✅ REFAITE ENTIÈREMENT (session 30/03)
│   ├── TarifsPage.tsx             ← page tarifs PUBLIQUE ✅ REFAITE ENTIÈREMENT
│   ├── ExemplePage.tsx            ← exemple rapport interactif
│   ├── ContactPage.tsx            ← formulaire contact
│   ├── LoginPage.tsx              ← connexion email/password + Google
│   ├── SignupPage.tsx             ← inscription avec vérification email
│   ├── DashboardPage.tsx          ← dashboard complet
│   ├── RapportPage.tsx            ← page rapport avec 4 onglets
│   ├── AuthCallbackPage.tsx       ← /auth/callback ✅ CORRIGÉ iOS Safari (session 30/03)
│   ├── ForgotPasswordPage.tsx     ← /mot-de-passe-oublie
│   └── ResetPasswordPage.tsx      ← /auth/reset-password
├── types/
│   └── index.ts                   ← types + PRICING_PLANS (NE PAS toucher TarifsPage l'importe plus)
```

---

## 🗺 Routes (App.tsx)
```
/                           → HomePage (public)
/tarifs                     → TarifsPage (public)
/contact                    → ContactPage (public)
/exemple                    → ExemplePage (public)
/connexion                  → LoginPage
/inscription                → SignupPage
/auth/callback              → AuthCallbackPage
/mot-de-passe-oublie        → ForgotPasswordPage
/auth/reset-password        → ResetPasswordPage
/dashboard                  → DashboardPage
/dashboard/nouvelle-analyse → DashboardPage
/dashboard/analyses         → DashboardPage
/dashboard/compare          → DashboardPage
/dashboard/compte           → DashboardPage
/dashboard/support          → DashboardPage
/dashboard/tarifs           → DashboardPage ← INTERNE, ne redirige PAS vers /tarifs
/dashboard/rapport?id=XXX   → RapportPage
```

---

## 🏠 HomePage.tsx — état actuel détaillé (refaite le 30/03/2026)

### Ordre des sections (NOUVEAU — remplace l'ancienne structure)
1. `HeroSection` — hero avec animation téléphone (desktop + mobile différents)
2. `AvantApresSection` — "Deux façons d'acheter" (rouge/vert)
3. `ProblemSolutionSection` — "Pourquoi Analymo" (problème + solution fusionnés, 4 cartes)
4. `SecuriteSection` — "Vos documents, protégés." (4 garanties + bandeau RGPD) ← NOUVEAU
5. `ForWhoSection` — "Fait pour vous." avec onglets Particuliers/Professionnels
6. `HowItWorksSection` — "Comment ça marche" 4 étapes
7. `ApercuRapportSection` — "Ce que vous recevez." mockup rapport complet ← NOUVEAU
8. `FaqSection` — FAQ accordéon 6 questions ← NOUVEAU
9. `CtaFinal` — bloc final fond navy

### ⚠️ Sections SUPPRIMÉES par rapport à l'ancienne version
- `StatsBar` — supprimée (chiffres non réels)
- `TestimonialsSection` — supprimée (pas de vrais témoignages)
- `ProblemSection` et `SolutionSection` — fusionnées en `ProblemSolutionSection`

### Composants réutilisables
- **`Reveal`** : wrapper `motion.div` avec `useInView` (once: true, margin: -50px)
- **`SectionTitle`** : label teal + h2 clamp + accent coloré + trait animé

### HeroSection — Mobile (lg:hidden)
- Titre : `clamp(28px, 7.5vw, 36px)` + `whitespace-nowrap` sur "avant de signer." → forcé sur 2 lignes
- Sous-texte : `text-[15px]` pleine largeur `w-full px-3`
- Animation : `PhoneMockupMini` (150×300px) collé côté droit + 3 badges en colonne à gauche
- Badges : largeur fixe `w-[138px]`, `gap-3`, centrés via `flex items-center justify-center`
- **NE PAS remettre PhoneMockup plein format sur mobile** — utiliser uniquement PhoneMockupMini

### HeroSection — Desktop (hidden lg:grid)
- `grid-cols-2 gap-6`, texte à gauche, `PhoneMockup` (275×580px) à droite
- Bulles flottantes : left-36 top 20% / right-36 bottom 28% / right-28 top 10%

### PhoneMockup (desktop uniquement)
- Timings : 0→3.5s PhaseUpload, 3.5→7s PhaseScan, 7→14s PhaseResult, cycle infini
- `PhaseScan` : titre "Traitement en cours" (jamais "Analyse en cours")

### PhoneMockupMini (mobile uniquement)
- 150×300px, `rounded-[32px]`
- Mêmes 3 phases que PhoneMockup mais versions Mini : PhaseUploadMini / PhaseScanMini / PhaseResultMini

### HowItWorksSection
- **CRITIQUE — deux refs séparés** :
  - `refMobile` + `inViewMobile` pour `div.flex.flex-col.md:hidden`
  - `refDesktop` + `inViewDesktop` pour `div.hidden.md:block`
  - Si on fusionne, le mobile affiche blanc (bug connu et corrigé)

### ProblemSolutionSection
- 4 cartes `grid-cols-1 sm:grid-cols-2`
- Sur mobile : centré (`text-center md:text-left`, icône `mx-auto md:mx-0`)
- Chaque carte : problème en gris + solution en teal avec checkmark

---

## 💰 TarifsPage.tsx — état actuel détaillé

### Structure desktop
- `max-w-[1400px]` + `px-4 md:px-10 lg:px-20` → pleine largeur, pas d'espace vide
- Grille `grid-cols-4 items-stretch` → cartes égales en hauteur, boutons alignés en bas
- Prix grand : `text-[52px] font-black`
- Carte highlighted (19,90€) : barre teal en haut, ring teal, bouton teal `#2a7d9c`
- Badge : `whitespace-nowrap` + `pr-24` sur le nom → badge ne chevauche pas le texte

### Structure mobile
- Cartes empilées `flex-col gap-4`
- Prix + badge sur la même ligne (`justify-between`)
- Bouton pleine largeur en bas

### Ordre des blocs sous les cartes
1. Offre Professionnelle (pleine largeur, horizontal)
2. Garanties (4 blocs)
3. FAQ (3 colonnes desktop, 1 mobile)

### IMPORTANT : TarifsPage définit ses propres plans
TarifsPage.tsx définit `const plans = [...]` localement — elle **n'importe plus** `PRICING_PLANS` depuis types/index.ts. Les prix corrects sont : 4,90 / 19,90 / 29,90 / 39,90.

---

## 📊 Dashboard (DashboardPage.tsx)

### Sidebar blanche
- Logo Analymo cliquable → /
- Bouton "Nouvelle analyse" teal gradient en haut
- Navigation : Tableau de bord / Mes analyses / Comparer mes biens / Tarifs / Mon compte / Support / Aide
- Mini-widget crédits : 2 cases (SIMPLE / COMPLÈTE) avec quantité
- Infos utilisateur + bouton déconnexion en bas

### Logique crédits (MOCK — à remplacer après Stripe)
```ts
const MOCK_CREDITS = { document: 1, complete: 2 }
```

### Nouvelle analyse
- Étape 1 : Choix du type (simple / complète / pack2 / pack3) avec badge crédits
- Étape 2 : Upload fichiers (drag & drop) — 1 fichier max pour simple, 20 pour complète
- Étape 3 : Barre de progression pendant le traitement
- Résultat : redirection automatique vers /dashboard/rapport?id=XXX

### Mes analyses
- Charge depuis Supabase (vraies données utilisateur)
- Analyse simple → affiche nom du fichier (PAS de score)
- Analyse complète → affiche adresse du bien + score /10 coloré
- Bouton "Rapport" → /dashboard/rapport?id=XXX

---

## 📄 Page Rapport (RapportPage.tsx)

**Route :** `/dashboard/rapport?id=XXX`
**Chargement :** `fetchAnalyseById(id)` depuis Supabase
**PDF :** `window.print()` avec styles @media print

### 4 onglets (analyse complète uniquement)
1. Vue d'ensemble — jauge score, recommandation, points forts/vigilance, avis
2. Financier — charges, fonds travaux, appels de charges votés
3. Travaux — réalisés / votés / à prévoir
4. Procédures — masqué si `procedures_en_cours: false`

**Analyse simple (4,90€) :** pas d'onglets, affichage simplifié

---

## 🤖 Prompts (lib/prompts.ts)

### PROMPT_ANALYSE_COMPLETE (19,90€ / 29,90€ / 39,90€)
- Note UNIQUEMENT si PV d'AG + diagnostics présents
- Base 10/10 → pénalités → bonus, arrondi à 0,5 près
- Si docs insuffisants → `score: null` + `raison_absence_score`
- Retourne JSON : titre, score, score_niveau, recommandation, resume, points_forts, points_vigilance, travaux_*, charges_mensuelles, fonds_travaux, appels_charges_votes, risques_financiers, impact_financier, procedures_en_cours, procedures, avis_analymo

### PROMPT_ANALYSE_SIMPLE (4,90€)
- **Jamais de note sur 10** (règle absolue)
- Retourne JSON simple : titre / résumé / points_forts / points_vigilance / conclusion

---

## 🗄 Supabase

**Project ID :** `veszrayromldfgetqaxb`
**Project URL :** `https://veszrayromldfgetqaxb.supabase.co`

### Tables
- `profiles` — id, full_name, created_at + trigger auto à l'inscription
- `analyses` — id, user_id, type, status, title, address, result (JSONB), created_at

### Auth configuré
- Email/password ✅ + Google OAuth ✅
- SMTP Mailjet : notification@analymo.fr / SPF ✅ + DKIM ✅ + DMARC ✅
- Redirect URLs configurées pour appdemo.analymo.fr + analymo.fr

### Vercel env vars
- `VITE_SUPABASE_URL` = `https://veszrayromldfgetqaxb.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = clé publique Supabase

---

## 📧 Configuration email (Mailjet)

**Expéditeur :** notification@analymo.fr
**Statut authentification :**
- SPF ✅ (`v=spf1 include:mx.ovh.com include:spf.mailjet.com -all`)
- DKIM ✅ (2048 bits, mailjet._domainkey.analymo.fr)
- DMARC ✅ ajouté le 30/03/2026 (`_dmarc.analymo.fr` → `v=DMARC1; p=none; rua=mailto:notification@analymo.fr`)

**Problème connu :** L'email affiche "envoyé par : bnc3.mailjet.com" au lieu de "analymo.fr" dans certains clients (Hotmail/Outlook). Cela peut déclencher des filtres spam.

**Solution à appliquer (Custom Return-Path) :**
1. Dans OVH DNS : ajouter un enregistrement CNAME → `bnc3` pointant vers `bnc3.mailjet.com`
2. Faire une capture d'écran du CNAME créé
3. Ouvrir un ticket support Mailjet avec la capture + clé API pour activation
4. Résultat : "envoyé par" affichera `bnc3.analymo.fr` au lieu de `bnc3.mailjet.com`
- **Disponible sur tous les plans Mailjet (y compris gratuit)** — nécessite intervention manuelle du support

---

## ⚠️ Points importants à retenir

1. **Stripe PAS branché** → crédits simulés via `MOCK_CREDITS` dans DashboardPage.tsx
2. **Table `credits` PAS créée** dans Supabase → à faire après Stripe
3. **API Claude côté client** → appel direct depuis le navigateur (à sécuriser avec une edge function plus tard)
4. **Tarifs = 2 pages différentes** :
   - `/tarifs` → TarifsPage.tsx (publique, définit ses propres `plans`)
   - `/dashboard/tarifs` → onglet interne dashboard (dans DashboardPage.tsx)
5. **vercel.json** → rewrites SPA → NE PAS supprimer
6. **Session 1h** gérée via localStorage (`analymo_login_time`) dans SessionManager (App.tsx)
7. **PRICING_PLANS dans types/index.ts** → encore utilisé par DashboardPage, mais PAS par TarifsPage
8. **Prix correct** : 4,90€ (pas 4,99€) partout dans les textes visibles
9. **Mot "IA" interdit** dans tous les textes visibles utilisateur
10. **HowItWorksSection** : utilise `refMobile`/`inViewMobile` et `refDesktop`/`inViewDesktop` séparés — NE PAS fusionner sinon le mobile affiche blanc
11. **ScrollToTop** ajouté dans App.tsx → scroll automatique en haut à chaque changement de page
12. **AuthCallbackPage** corrigée pour iOS Safari → gère 4 cas : hash token, query code, session existante, compte activé sans session

---

## 🔜 Prochaines étapes (dans l'ordre)

### Email / Délivrabilité
- [ ] **Custom Return-Path Mailjet** — ajouter CNAME `bnc3` dans OVH + ticket support Mailjet (voir section 📧 ci-dessus)

### Paiements
- [ ] **Connecter Stripe** — paiement réel (4 produits : 4,90 / 19,90 / 29,90 / 39,90)
- [ ] **Créer table `credits`** dans Supabase + webhook Stripe qui crédite
- [ ] **Remplacer `MOCK_CREDITS`** par vraies données Supabase dans DashboardPage.tsx

### Technique
- [ ] Mettre à jour `PRICING_PLANS` dans types/index.ts (prix 4,90 au lieu de 4,99)
- [ ] Envoyer email Mailjet quand rapport prêt
- [ ] Améliorer le PDF (html2pdf ou Puppeteer)
- [ ] Sécuriser l'appel API Claude (edge function Vercel)

### Growth / Marketing
- [ ] Google OAuth branding (publier app Google Cloud)
- [ ] Page admin (voir tous les clients/analyses)
- [ ] Récupérer de vrais témoignages utilisateurs pour les remettre sur la HomePage
