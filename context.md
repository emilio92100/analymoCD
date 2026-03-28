# ANALYMO — Contexte Projet
> **Colle ce fichier en début de conversation Claude pour reprendre le contexte.**
> Dernière mise à jour : 28 mars 2026

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
| Mailjet | SMTP emails (SPF + DKIM validés ✅) |

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
├── App.tsx                        ← routing complet + SessionManager 1h
├── index.css                      ← variables CSS globales
├── components/layout/
│   ├── Navbar.tsx                 ← navbar dynamique (Mon espace si connecté)
│   └── Footer.tsx                 ← footer dark navy + disclaimer outil
├── lib/
│   ├── supabase.ts                ← client Supabase
│   ├── analyses.ts                ← fonctions CRUD analyses Supabase
│   └── prompts.ts                 ← prompts Claude
├── pages/
│   ├── HomePage.tsx               ← landing page principale ✅ REFAITE ENTIÈREMENT
│   ├── TarifsPage.tsx             ← page tarifs PUBLIQUE ✅ REFAITE ENTIÈREMENT
│   ├── ExemplePage.tsx            ← exemple rapport interactif
│   ├── ContactPage.tsx            ← formulaire contact
│   ├── LoginPage.tsx              ← connexion email/password + Google
│   ├── SignupPage.tsx             ← inscription avec vérification email
│   ├── DashboardPage.tsx          ← dashboard complet
│   ├── RapportPage.tsx            ← page rapport avec 4 onglets
│   ├── AuthCallbackPage.tsx       ← /auth/callback
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

## 🏠 HomePage.tsx — état actuel détaillé

### Ordre des sections (important — ne pas changer sans le noter ici)
1. `HeroSection` — hero avec animation téléphone
2. `StatsBar` — 4 chiffres clés
3. `AvantApresSection` — "Deux façons d'acheter" (rouge/vert)
4. `ProblemSection` — "Le problème"
5. `SolutionSection` — "La solution"
6. `ForWhoSection` — "Pour qui" avec onglets Particuliers/Professionnels
7. `HowItWorksSection` — "Comment ça marche" 4 étapes
8. `TestimonialsSection` — témoignages
9. `CtaFinal` — bloc final avec fond vert sobre

### Composants réutilisables (en haut du fichier)
- **`Reveal`** : wrapper `motion.div` avec `useInView` (once: true, margin: -50px), animation slide-up. Props : `children`, `delay`, `className`
- **`SectionTitle`** : label teal uppercase + h2 `clamp(28px,5.5vw,72px)` avec accent coloré + trait `scaleX` animé + sous-titre optionnel. Props : `label`, `title`, `accent`, `sub`

### Règles responsive globales
- Padding : `px-4 md:px-6`, `py-16 md:py-28`
- Textes : `text-sm md:text-base`, `text-xs md:text-sm`
- Arrondis : `rounded-2xl md:rounded-3xl`
- Grilles : toujours `grid-cols-1` en mobile avant md/lg

### StatsBar
- 4 stats : "200+" / "30s*" / "98%" / "~8 000€"
- `grid-cols-2 md:grid-cols-4` avec `divide-x divide-slate-100`
- Fond blanc, bordures top/bottom `border-slate-100`

### HeroSection
- Section fond `#f4f7f9`, `pt-16 pb-12`, `min-h-screen`
- **Mobile** (`lg:hidden`) : `pt-8` pour espacer de la navbar → badge → titre 2 lignes → description courte → téléphone → 2 boutons pleine largeur → astérisque
- Titre mobile : "Vérifiez les éléments" + saut de ligne + "avant de signer." avec trait `scaleX` animé en teal
- **Desktop** (`hidden lg:grid`) : `grid-cols-2 gap-6`, texte à gauche, téléphone à droite
- Titre desktop : "Vérifiez les éléments / essentiels avant de signer."
- Sous-titre : "Votre futur logement analysé en 30 secondes*" (bold)
- Description : "Diagnostics, PV d'AG, Règlement de copropriété, Appels de fonds, Compromis de vente…"
- Boutons : "Lancer mon analyse" (navy `#0f2d3d`) + "Voir un exemple" (blanc, bordure slate)
- Garanties desktop uniquement : Documents chiffrés / Suppression auto / Sans engagement
- Keyframes dans `<style>` : pulse, spin, scanAnim, floatA, floatB, floatC

### PhoneMockup
- Timings : 0→3.5s PhaseUpload, 3.5→7s PhaseScan, 7→14s PhaseResult, cycle infini
- Structure : barre status grise (9:41/5G) + header blanc "ANALYMO / Mon espace" + `flex-1` contenu + home indicator
- Fond interne `#f8fafc`, `rounded-[36px] sm:rounded-[42px]`
- **Mobile** : `w-[175px] h-[370px] rounded-[40px]`
- **Desktop** : `w-[275px] h-[580px] rounded-[46px]`
- Bulles flottantes (`hidden sm:flex`) : "100% sécurisé" gauche + "Score 7,5/10" droite bas + "3 docs chargés" droite haut
- `PhaseScan` : titre "Traitement en cours" (jamais "Analyse en cours")
- `PhaseResult` : jauge SVG, badge "Recommandé ✓", 4 points, bouton "Télécharger le rapport PDF"

### AvantApresSection
- Titre : "Deux façons d'acheter. Une seule bonne."
- 2 colonnes `grid-cols-2` : rouge (Sans Analymo) / vert (Avec Analymo)
- En-têtes avec fond `bg-red-50` / `bg-green-50` et icônes X/Check
- 5 lignes de comparaison, `grid-cols-2 gap-2 md:gap-3`
- Mobile : `text-xs p-3 w-5 h-5` / Desktop : `text-sm p-5 w-7 h-7`

### ProblemSection
- Fond `#f4f7f9`
- Titre : "Acheter un bien, c'est risqué."
- 4 cartes `grid-cols-1 sm:grid-cols-2`, layout `flex items-start gap-4`
- Icônes : FileText rouge / AlertTriangle amber / TrendingUp orange / Clock bleu

### SolutionSection
- Fond blanc
- Titre : "Analymo vous simplifie tout."
- 3 cartes `grid-cols-1 md:grid-cols-3`
- Mobile : horizontal `flex items-start gap-4` / Desktop : vertical avec numéro géant gris `text-3xl text-slate-100`
- Hover : radial gradient coloré par feature
- Features : Zap teal / Shield rouge / BarChart3 vert

### ForWhoSection
- Fond `#f4f7f9`
- Titre : "Fait pour vous."
- Onglets : "Acheteurs particuliers" / "Professionnels" avec `AnimatePresence mode="wait"`
- Onglet actif : `bg-[#0f2d3d] text-white`
- **Particuliers** : grille 2 colonnes — gauche navy (titre "Ne signez plus les yeux fermés." + CTA) / droite blanc (5 détections listées)
- **Professionnels** : `grid-cols-1 sm:grid-cols-2`, 4 cartes (Notaires / Agents immo / Syndics / Marchands de biens)

### HowItWorksSection
- Fond **blanc** `bg-white` — NE PAS remettre de fond sombre
- Titre : "Quatre étapes, c'est tout."
- Icônes SVG custom teal uniformes, numéros 01/02/03/04
- **CRITIQUE — deux refs séparés** :
  - `refMobile` + `inViewMobile` pour `div.flex.flex-col.md:hidden`
  - `refDesktop` + `inViewDesktop` pour `div.hidden.md:block`
  - Si on fusionne, le mobile affiche blanc (bug connu et corrigé)
- **Mobile** : stepper vertical, cercles numérotés, trait `scaleY` animé entre étapes
- **Desktop** : trait horizontal `bg-[#2a7d9c]/40` animé `width`, icônes au-dessus, cartes `bg-[#f4f7f9]` en dessous avec hover
- CTA : bouton navy "Essayer maintenant — dès 4,90€"

### TestimonialsSection
- Fond blanc
- 3 témoignages `grid-cols-1 md:grid-cols-3`
- Marie L. (teal `#2a7d9c`) / Thomas R. (navy `#0f2d3d`) / Sophie D. (vert `#0f6e56`)
- Cartes `bg-[#f4f7f9]`, guillemet serif géant gris, 5 étoiles `#f59e0b`

### CtaFinal
- Section fond `bg-white`, carte interne `bg-[#0f2d3d]` avec dégradé
- Bande top : `linear-gradient(90deg, #4ade80, #2a7d9c)` — 1px de hauteur
- Titre : "Prenez votre décision en toute clarté."
- Prix : "À partir de 19,90€ · Sans abonnement"
- Grille 2 colonnes (`grid-cols-1 sm:grid-cols-2`), 6 features avec checkmarks verts `#2a7d9c`
- Bouton principal : `linear-gradient(135deg, #22c55e, #16a34a)` texte navy
- Bouton secondaire : "Voir un exemple" bordure `white/15`
- Barre prix bottom : 4,90€ Simple / 19,90€ Complète / 29,90€ Pack 2
- Astérisque bas : "Pour documents PDF nativement numériques"

### Footer (src/components/layout/Footer.tsx)
- Fond navy `#0f2d3d`
- 4 colonnes : logo + desc / Produit (liens) / Légal / Contact (mail + pays)
- Bottom bar : copyright + disclaimer complet
- Disclaimer : "Analymo est un outil d'aide à la lecture et à la compréhension de documents immobiliers. Les rapports générés sont fournis à titre informatif uniquement... nous recommandons de consulter un professionnel qualifié"
- Couleur disclaimer : `text-white/25` (très discret)

---

## 💰 TarifsPage.tsx — état actuel détaillé

### Structure desktop
- `max-w-[1400px]` + `px-4 md:px-10 lg:px-20` → pleine largeur, pas d'espace vide
- Grille `grid-cols-4 items-stretch` → cartes égales en hauteur, boutons alignés en bas
- Prix grand : `text-[52px] font-black`
- Bloc "Idéal pour" mis en avant avec fond coloré `bg-[#f4f7f9]` (ou teal léger si highlighted)
- Carte highlighted (19,90€) : barre teal en haut, ring teal, bouton teal `#2a7d9c`
- Badge : `whitespace-nowrap` + `pr-24` sur le nom → badge ne chevauche pas le texte

### Structure mobile
- Cartes empilées `flex-col gap-4`
- Prix + badge sur la même ligne (`justify-between`)
- Badge : `whitespace-nowrap` → tient sur une seule ligne
- Bloc "Idéal pour" sur fond `#f4f7f9`
- Features en liste verticale propre
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
- SMTP Mailjet : notification@analymo.fr / SPF ✅ + DKIM ✅
- Redirect URLs configurées pour appdemo.analymo.fr + analymo.fr

### Vercel env vars
- `VITE_SUPABASE_URL` = `https://veszrayromldfgetqaxb.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = clé publique Supabase

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

---

## 🔜 Prochaines étapes (dans l'ordre)
- [ ] **Connecter Stripe** — paiement réel (4 produits : 4,90 / 19,90 / 29,90 / 39,90)
- [ ] **Créer table `credits`** dans Supabase + webhook Stripe qui crédite
- [ ] **Remplacer `MOCK_CREDITS`** par vraies données Supabase dans DashboardPage.tsx
- [ ] Mettre à jour `PRICING_PLANS` dans types/index.ts (prix 4,90 au lieu de 4,99)
- [ ] Envoyer email Mailjet quand rapport prêt
- [ ] Améliorer le PDF (html2pdf ou Puppeteer)
- [ ] Google OAuth branding (publier app Google Cloud)
- [ ] Page admin (voir tous les clients/analyses)
- [ ] Sécuriser l'appel API Claude (edge function Vercel)
