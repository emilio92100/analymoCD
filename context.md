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
**Analymo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges). Rapport clair avec score /10, risques, recommandations en moins de 2 minutes.

**Cible :** Acheteurs particuliers (principal), notaires, agents, syndics, marchands de biens.

**Logique crédits / prix :**
- 4,99€ → 1 crédit analyse simple (1 seul document)
- 19,90€ → 1 crédit analyse complète
- 29,90€ → 2 crédits analyse complète
- 39,90€ → 3 crédits analyse complète
- Les crédits ne expirent jamais et s'accumulent

**Fonctionnement :**
1. Client paie (Stripe — pas encore branché)
2. Upload ses documents (1 pour simple, illimités pour complète)
3. L'IA détecte le nom du doc (4,99€) ou l'adresse complète du bien (19,90€+)
4. Rapport généré en moins de 2 minutes via API Claude
5. Rapport sauvegardé dans Supabase, visible dans le dashboard
6. Rapport téléchargeable en PDF
7. Comparaison uniquement disponible pour les analyses complètes

---

## 🛠 Stack technique
| Technologie | Usage |
|---|---|
| React 18 + Vite + TypeScript | Frontend |
| Tailwind CSS v3 | Styles |
| Framer Motion | Animations |
| React Router DOM | Navigation |
| Supabase | Auth + Base de données |
| Claude API (claude-sonnet-4-20250514) | Analyse IA des documents |
| Stripe | Paiements — **pas encore configuré** |
| Vercel | Déploiement auto depuis GitHub |
| Mailjet | SMTP emails (SPF + DKIM validés ✅) |

**Police :** DM Sans
**Couleurs :** `--brand-teal: #2a7d9c` / `--brand-navy: #0f2d3d` / `--brand-gold: #f0a500`
**Fond dashboard :** `#f5f9fb` (bleuté clair)
**Sidebar dashboard :** blanche `#fff` avec bordure légère `#edf2f7`
**Style général dashboard :** moderne startup, cartes blanches, fond bleuté, pas de dark mode

---

## 📁 Structure du projet
```
src/
├── App.tsx                        ← routing complet + SessionManager 1h
├── index.css                      ← variables CSS globales
├── components/layout/
│   ├── Navbar.tsx                 ← navbar dynamique (Mon espace si connecté)
│   └── Footer.tsx                 ← footer dark navy
├── lib/
│   ├── supabase.ts                ← client Supabase
│   ├── analyses.ts                ← fonctions CRUD analyses Supabase ✅ NOUVEAU
│   └── prompts.ts                 ← prompts IA Claude ✅ NOUVEAU
├── pages/
│   ├── HomePage.tsx               ← landing page principale
│   ├── TarifsPage.tsx             ← page tarifs PUBLIQUE (accessible sans login)
│   ├── ExemplePage.tsx            ← exemple rapport interactif
│   ├── ContactPage.tsx            ← formulaire contact
│   ├── LoginPage.tsx              ← connexion email/password + Google
│   ├── SignupPage.tsx             ← inscription avec vérification email
│   ├── DashboardPage.tsx          ← dashboard complet ✅ ENTIÈREMENT REFAIT
│   ├── RapportPage.tsx            ← page rapport avec 4 onglets ✅ NOUVEAU
│   ├── AuthCallbackPage.tsx       ← /auth/callback
│   ├── ForgotPasswordPage.tsx     ← /mot-de-passe-oublie
│   └── ResetPasswordPage.tsx      ← /auth/reset-password
```

---

## 🗺 Routes (App.tsx) — toutes les routes existantes
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
/dashboard/rapport?id=XXX   → RapportPage ✅ NOUVEAU
```

---

## 📊 Dashboard (DashboardPage.tsx) — détail complet

### Sidebar blanche
- Logo Analymo cliquable → /
- Bouton "Nouvelle analyse" teal gradient en haut
- Navigation : Tableau de bord / Mes analyses / Comparer mes biens / Tarifs / Mon compte / Support / Aide
- Mini-widget crédits : 2 cases (SIMPLE / COMPLÈTE) avec quantité
- Infos utilisateur + bouton déconnexion en bas

### Accueil (HomeView) — adaptatif selon nb d'analyses
**Si 0 analyse (nouvel utilisateur) :**
- Page onboarding avec hero banner navy
- CTA "Lancer ma première analyse"
- 3 étapes expliquées (Déposer → IA analyse → Rapport)
- Garanties (SSL, suppression auto, < 2 min)

**Si analyses existantes :**
- 3 blocs stats : Analyses totales (+ score moyen si analyses complètes) / Dernière analyse (date + nom/adresse) / Crédits restants (bloc navy avec détail simple 4,99€ + complet 19,90€)
- Info-bulle crédits : explication du système 4,99€/19,90€/29,90€/39,90€
- 2 cartes "Analyser un document" :
  - Carte blanche → Analyse simple 4,99€ (badge crédits dispo vert/rouge)
  - Carte navy → Analyse complète 19,90€ "RECOMMANDÉ" (badge crédits dispo)
  - Si 0 crédit → redirige vers /dashboard/tarifs
- Packs 2 biens (29,90€) et 3 biens (39,90€) en lignes compactes
- Analyses récentes : données réelles depuis Supabase

### Logique crédits (MOCK — à remplacer après Stripe)
```ts
const MOCK_CREDITS = { document: 1, complete: 2 }
```

### Nouvelle analyse (/dashboard/nouvelle-analyse)
- Étape 1 : Choix du type (simple / complète / pack2 / pack3) avec badge crédits
- Étape 2 : Upload fichiers (drag & drop) — 1 fichier max pour simple, 20 pour complète
- Étape 3 : Barre de progression pendant l'analyse IA
- Résultat : redirection automatique vers /dashboard/rapport?id=XXX

### Mes analyses (/dashboard/analyses)
- Charge depuis Supabase (vraies données utilisateur)
- **Analyse simple** → affiche nom du fichier (PAS de score)
- **Analyse complète** → affiche adresse du bien détectée par l'IA + score /10 coloré
- Score uniquement sur analyses complètes (jamais sur analyse simple 4,99€)
- Bouton "Rapport" → /dashboard/rapport?id=XXX
- Filtre : Tout / Complètes / Documents
- Recherche par nom/adresse

### Comparer mes biens (/dashboard/compare)
- 0 analyse complète → page bloquée avec message explicatif + CTA vers nouvelle analyse complète
- Analyses complètes disponibles → sélection interactive (min 2 requis)
- 2 sélectionnées → comparaison côte à côte avec scores, barres, points forts/vigilance
- Verdict Analymo automatique (bien avec le meilleur score recommandé)

### Tarifs internes (/dashboard/tarifs)
- NE PAS confondre avec /tarifs (page publique avec Navbar/Footer)
- 4 cartes HORIZONTALES (pas de colonnes serrées)
- Tooltip ⓘ au survol → liste des features incluses dans le pack
- Badge crédits dispo sur chaque carte
- Barre verte en bas si crédits disponibles
- Bouton "Acheter" → TODO Stripe
- Garanties en bas (4 blocs compacts)

### Mon compte (/dashboard/compte)
- Formulaire nom + email (email disabled)
- Sauvegarde via supabase.auth.updateUser

### Support (/dashboard/support)
- FAQ accordéon (4 questions dont une sur les crédits)
- Formulaire de contact → TODO envoyer email via Mailjet

---

## 📄 Page Rapport (RapportPage.tsx)

**Route :** `/dashboard/rapport?id=XXX`
**Chargement :** `fetchAnalyseById(id)` depuis Supabase → mappe le JSON result
**Topbar :** lien retour "Mes analyses" + adresse du bien + score mini + bouton PDF
**PDF :** `window.print()` avec styles @media print

### 4 onglets (analyse complète uniquement)
1. **Vue d'ensemble**
   - Jauge SVG circulaire score /10 avec couleur (vert/orange/rouge)
   - Badge recommandation (Acheter / Négocier / Risqué / Déconseillé)
   - Résumé du bien
   - Points forts (fond vert) + Points de vigilance (fond orange)
   - Avis Analymo (bloc navy)

2. **Financier**
   - Charges mensuelles / annuelles / fonds travaux (3 stat boxes)
   - Appels de charges votés (liste avec montant + échéance)
   - Impact financier + Risques financiers

3. **Travaux**
   - Travaux réalisés ✅ (fond vert)
   - Travaux votés ⚠️ (fond orange, avec année + statut "Voté")
   - Travaux estimés non votés 🔧 (fond gris, avec note "estimé par Analymo")

4. **Procédures**
   - Onglet masqué si `procedures_en_cours: false`
   - Si procédures → badge sévérité (faible/moyenne/élevée) + détail + impact sur acquisition
   - Si aucune → message rassurant avec icône ✓

**Analyse simple (4,99€) :** pas d'onglets, affichage simplifié (résumé + points forts + vigilance + conclusion)

---

## 🤖 Prompts IA (lib/prompts.ts)

### PROMPT_ANALYSE_COMPLETE
Utilisé pour **19,90€ / 29,90€ / 39,90€ uniquement**

Règles de notation :
- Note UNIQUEMENT si PV d'AG + diagnostics présents
- Base : 10/10 → pénalités → bonus
- Pénalités : léger (-0,5 à -1) / modéré (-1 à -2) / important (-2 à -3) / grave (-3 à -4)
- Bonus : travaux faits (+0,5/+1) / bonne gestion (+0,5/+1) / diagnostics rassurants (+0,5/+1)
- Arrondi à 0,5 près UNIQUEMENT (ex: 7.5, 8.0 — jamais 6.83)
- Échelle : 9-10 Très rassurant / 7-8,5 Sain / 5-6,5 Moyen / 3-4,5 Risqué / 0-2,5 Très risqué
- Si docs insuffisants → `score: null` + `raison_absence_score` explicite
- Mention obligatoire dans avis_analymo : "Cette note est établie uniquement à partir des documents analysés..."

Retourne JSON complet :
```json
{
  "titre": "adresse complète du bien",
  "score": 7.5,
  "score_niveau": "Globalement sain",
  "recommandation": "Acheter",
  "resume": "...",
  "points_forts": [...],
  "points_vigilance": [...],
  "travaux_realises": [...],
  "travaux_votes": [...],
  "travaux_a_prevoir": [...],
  "charges_mensuelles": 180,
  "fonds_travaux": 42000,
  "appels_charges_votes": [...],
  "risques_financiers": "...",
  "impact_financier": "...",
  "procedures_en_cours": false,
  "procedures": [],
  "avis_analymo": "..."
}
```

### PROMPT_ANALYSE_SIMPLE
Utilisé pour **4,99€ uniquement**
- **Jamais de note sur 10** (règle absolue)
- Retourne JSON simple : titre / résumé / points_forts / points_vigilance / conclusion

---

## 🗄 Supabase

**Project ID :** `veszrayromldfgetqaxb`
**Project URL :** `https://veszrayromldfgetqaxb.supabase.co`

### Tables
- `profiles` — id, full_name, created_at + trigger auto à l'inscription
- `analyses` — id, user_id, type, status, title, address, result (JSONB), created_at
  - `type` : document | complete | pack2 | pack3
  - `status` : pending | processing | completed | failed
  - `result` : JSON complet du rapport généré par Claude
  - RLS activé — chaque user voit uniquement ses propres analyses

### Fonctions Supabase (lib/analyses.ts)
- `fetchAnalyses()` — toutes les analyses de l'user connecté (ordre: plus récent en premier)
- `fetchAnalyseById(id)` — une analyse par id
- `createAnalyse(type, title)` — crée une entrée (status: processing)
- `updateAnalyseResult(id, result, title, address)` — sauvegarde le rapport IA (status: completed)
- `markAnalyseFailed(id)` — marque en erreur (status: failed)

### Auth configuré
- Email/password ✅
- Google OAuth ✅ (branding pas encore validé côté Google Cloud Console)
- Confirm email activé ✅
- SMTP Mailjet : notification@analymo.fr / reply: hello@analymo.fr
- SPF ✅ + DKIM ✅ validés sur analymo.fr
- "Envoyé par mailjet.com" visible dans Gmail → limitation plan gratuit Mailjet (cosmétique, délivrabilité OK)
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
   - `/tarifs` → page publique avec Navbar + Footer (TarifsPage.tsx)
   - `/dashboard/tarifs` → onglet interne dashboard (dans DashboardPage.tsx)
5. **vercel.json** → rewrites SPA → NE PAS supprimer
6. **Session 1h** gérée via localStorage (`analymo_login_time`) dans SessionManager (App.tsx)
7. Pour supprimer un compte test → Supabase → Authentication → Users (PAS Table Editor)
8. Google OAuth branding → affiche encore URL Supabase dans popup → à régler en publiant l'app Google
9. **Mailjet SPF/DKIM OK** mais "Envoyé par mailjet.com" reste → limitation plan gratuit, pas bloquant

---

## 🔜 Prochaines étapes (dans l'ordre)
- [ ] **Connecter Stripe** — paiement réel (4 produits : 4,99 / 19,90 / 29,90 / 39,90)
- [ ] **Créer table `credits`** dans Supabase + webhook Stripe qui crédite
- [ ] **Remplacer `MOCK_CREDITS`** par vraies données Supabase dans DashboardPage.tsx
- [ ] Envoyer email Mailjet quand rapport prêt
- [ ] Améliorer le PDF (html2pdf ou Puppeteer)
- [ ] Google OAuth branding (publier app Google Cloud)
- [ ] Page admin (voir tous les clients/analyses)
- [ ] Sécuriser l'appel API Claude (edge function Vercel)
