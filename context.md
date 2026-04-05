# VERIMO — Contexte complet du projet au 05/04/2026

---

## QU'EST-CE QUE VERIMO ?

**Verimo** est un SaaS d'analyse de documents immobiliers destiné aux acheteurs particuliers et professionnels. Il permet de comprendre en quelques minutes les informations essentielles d'un bien avant de faire une offre ou de signer.

### Ce que fait Verimo concrètement
L'utilisateur dépose ses documents immobiliers (PDF) — PV d'AG, règlement de copropriété, diagnostics, appels de charges, compromis de vente, DPE, etc. — et reçoit en retour un rapport structuré avec :
- Une **note /20** calculée sur 5 catégories (analyse complète uniquement)
- Les **travaux votés et à prévoir** avec estimation financière par lot
- La **santé financière de la copropriété** (fonds travaux, impayés, charges)
- Les **procédures judiciaires** en cours
- Les **diagnostics** (DPE, amiante, plomb, électricité, gaz...)
- Des **pistes de négociation** et un **avis Verimo personnalisé**
- Un **rapport PDF téléchargeable** et partageable

### Ce que Verimo n'est PAS
- Pas un conseiller juridique ou financier
- Pas un service d'audit professionnel
- Un outil d'aide à la décision — il informe, n'oriente pas
- Il se base **uniquement** sur les documents fournis par l'utilisateur

### Types de biens analysés
- Appartement en copropriété
- Maison individuelle
- Maison en copropriété
- Type indéterminé (signalé dans le rapport)

### Profils d'achat
- `rp` — Résidence principale
- `invest` — Investissement locatif (impact sur la notation)

### Documents reconnus
PV d'AG, Règlement de copropriété, Appel de charges, DDT/Diagnostics, DPE, PPT, DTG, État daté, Carnet d'entretien, Compromis/Promesse de vente, Permis de construire, Garantie décennale, ERRIAL, Bail emphytéotique

---

## INFORMATIONS TECHNIQUES

- **Repo GitHub :** https://github.com/emilio92100/analymoCD.git
- **Stack :** React 19 + Vite + TypeScript + Tailwind + Framer Motion + Supabase + Vercel
- **Domaine :** verimo.fr
- **Supabase Project ID :** `veszrayromldfgetqaxb`
- **Modèle IA :** `claude-sonnet-4-20250514`
- **SMTP :** Mailjet — in-v3.mailjet.com port 587 — Sender : notification@verimo.fr

### Design system
- **Couleurs :** `#2a7d9c` (teal) / `#0f2d3d` (navy) / `#f0a500` (gold) / `#22c55e` (green)
- **Police :** DM Sans
- **Border radius standard :** 12–20px
- **Animations :** Framer Motion avec `ease: [0.22, 1, 0.36, 1]`

---

## RÈGLES ABSOLUES DU PROJET

- Jamais "IA", "Claude", "Anthropic" → toujours **"notre outil"** ou **"notre moteur"**
- Prix : **4,90€ / 19,90€ / 29,90€ / 39,90€**
- Analyse simple (4,90€) → **jamais de note /20**, jamais de score
- `free_preview_used` ne passe **JAMAIS** de `true` à `false` automatiquement (sauf action manuelle SQL)
- Stripe en **mode test** (pas encore en production)
- Comparaison de biens débloquée dès **2 analyses complètes**

---

## OFFRES ET TARIFS

| Plan | Prix | Price ID Stripe (test) | Crédits |
|------|------|----------------------|---------|
| Analyse Simple | 4,90€ | `price_1TIb1LBO4ekMbwz0020eqcR0` | 1 crédit document |
| Analyse Complète | 19,90€ | `price_1TIb3XBO4ekMbwz0a7m7E7gD` | 1 crédit complete |
| Pack 2 biens | 29,90€ | `price_1TIb4KBO4ekMbwz0gGF2gI1S` | 2 crédits complete |
| Pack 3 biens | 39,90€ | `price_1TIb51BO4ekMbwz0mmEez47o` | 3 crédits complete |

---

## STRUCTURE DES FICHIERS (après refactoring session 05/04/2026)

```
src/
├── App.tsx                        — SessionManager + Routes
├── hooks/                         — NOUVEAU (créé cette session)
│   ├── useCredits.ts              — crédits Supabase + déduction
│   ├── useUser.ts                 — nom/email avec cache localStorage
│   └── useAnalyses.ts             — fetch + mapping des analyses
├── lib/
│   ├── supabase.ts                — Client Supabase
│   ├── analyses.ts                — CRUD analyses + syncFreePreviewUsed
│   └── prompts.ts                 — Prompts système IA
├── components/layout/
│   ├── Navbar.tsx
│   └── Footer.tsx
├── types/
│   └── index.ts
└── pages/
    ├── DashboardPage.tsx          — Layout + routing (261 lignes, allégé depuis 2736)
    ├── dashboard/                 — NOUVEAU (créé cette session)
    │   ├── HomeView.tsx           — Accueil dashboard
    │   ├── MesAnalyses.tsx        — Liste + recherche des analyses
    │   ├── NouvelleAnalyse.tsx    — Flow upload + analyse + aperçu
    │   ├── Compare.tsx            — Comparaison 2-3 biens
    │   ├── Compte.tsx             — Profil, mot de passe, historique, suppression
    │   ├── Support.tsx            — FAQ + formulaire contact
    │   └── Tarifs.tsx             — Plans + modale checkout + codes promo
    ├── RapportPage.tsx            — Page rapport détaillé (/dashboard/rapport?id=...)
    ├── AdminPage.tsx              — Page admin complète
    ├── HomePage.tsx
    ├── MethodePage.tsx
    ├── ExemplePage.tsx
    ├── TarifsPage.tsx
    ├── ContactPage.tsx
    ├── LoginPage.tsx
    ├── SignupPage.tsx
    ├── StartPage.tsx
    ├── ForgotPasswordPage.tsx
    ├── ResetPasswordPage.tsx
    ├── ConfidentialitePage.tsx    — Politique de confidentialité RGPD (/confidentialite)
    ├── CGUPage.tsx                — CGU droit français (/cgu)
    └── AuthCallbackPage.tsx       — Animation confirmation + détection session
```

---

## REFACTORING DASHBOARDPAGE (session 05/04/2026) ✅

**Avant :** `DashboardPage.tsx` = 2736 lignes (God Component)
**Après :** `DashboardPage.tsx` = 261 lignes (layout + routing uniquement)

Logique extraite dans `src/hooks/` (3 hooks) et `src/pages/dashboard/` (7 vues).

**Problèmes rencontrés lors du déploiement Vercel :**
- Fichiers créés sans extension `.tsx`/`.ts` sur GitHub → corrigé
- Casse des noms (Linux est sensible) : `Homeview` → `HomeView`, `Mesanalyses` → `MesAnalyses`, `Nouvelleanalyse` → `NouvelleAnalyse`, `Useuser` → `useUser`, `Usecredits` → `useCredits`, `Useanalyses` → `useAnalyses` → corrigés
- Imports inutilisés (`AlertTriangle`, `CheckCircle` dans `HomeView.tsx`, `Link` dans `Tarifs.tsx`) → corrigés
- Build Vercel opérationnel ✅

---

## SUPABASE — État complet

### Compte admin
- **Email :** `hello@verimo.fr`
- **Role :** `admin`
- **Accès :** `verimo.fr/admin`

### Tables

#### `profiles`
```
id uuid PK | email text | full_name text | role text DEFAULT 'user'
email_verified boolean DEFAULT false | provider text DEFAULT 'email'
credits_document integer DEFAULT 0 | credits_complete integer DEFAULT 0
suspended boolean DEFAULT false | free_preview_used boolean DEFAULT false
created_at timestamptz
```

#### `analyses`
```
id uuid PK | user_id uuid FK | type (document|complete|pack2|pack3)
status (pending|processing|completed|failed) | title text
score numeric | profil (rp|invest) | type_bien
result jsonb | apercu jsonb | avis_verimo text | is_preview boolean | paid boolean
document_names text[] | regeneration_deadline text | created_at timestamptz
```

#### `contact_messages`
```
id uuid PK | name text | email text | subject text | message text
created_at timestamptz | read boolean DEFAULT false
```

#### `promo_codes`
```
id uuid PK | code text UNIQUE | type (credits|percent|fixed) | value numeric
credit_type (document|complete|both) | expires_at timestamptz | max_uses integer
uses_count integer DEFAULT 0 | restricted_email text | active boolean DEFAULT true
```

#### `promo_uses`
```
id uuid PK | code_id uuid FK | user_id uuid FK | used_at timestamptz
UNIQUE(code_id, user_id)
```

#### `banners`
```
id uuid PK | message text | type (info|warning|success) | active boolean DEFAULT true
created_at timestamptz | updated_at timestamptz
```

#### `admin_logs`
```
id uuid PK | admin_email text | action text | target text | created_at timestamptz
```

### Trigger `handle_new_user` (version finale)
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, provider)
  VALUES (
    NEW.id, NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'user',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE SET
    provider = COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger `on_email_confirmed`
Met à jour `email_verified = true` dans profiles quand l'email est confirmé dans auth.users.

### Fonction SQL `increment_promo_uses`
Incrémente `uses_count` sur `promo_codes`.

### RLS
- `profiles` : lecture pour tous les authentifiés, modification par soi-même ou admin
- `banners` : lecture pour tous les authentifiés, écriture admin uniquement
- `contact_messages`, `promo_codes`, `promo_uses`, `admin_logs` : policies standard

### URL Configuration Supabase
- **Site URL :** `https://verimo.fr`
- **Redirect URLs :** `https://verimo.fr/auth/callback`, `https://verimo.fr/dashboard`, `https://verimo.fr/auth/reset-password` (+ variantes www)

---

## STRIPE — État complet

### Edge Functions déployées

**1. `create-checkout-session`** ✅ (mise à jour session 05/04/2026)
- Crée une session Stripe et retourne l'URL de paiement
- `success_url` → `https://verimo.fr/dashboard/tarifs?success=true`
- `cancel_url` → `https://verimo.fr/dashboard/tarifs?cancelled=true`
- Headers CORS : `authorization, x-client-info, apikey, content-type`
- JWT legacy désactivé
- Applique les codes promo via coupon Stripe à la volée :
  - `percent` → `stripe.coupons.create({ percent_off: value })`
  - `fixed` → `stripe.coupons.create({ amount_off: value * 100, currency: 'eur' })`
  - `credits` → pas de réduction prix, crédits bonus à gérer séparément
- Enregistre l'utilisation dans `promo_uses` et incrémente `uses_count`

**2. `stripe-webhook`** ✅ (mis à jour session 05/04/2026)
- Écoute `checkout.session.completed`
- Récupère le `priceId` via `stripe.checkout.sessions.listLineItems`
- Attribue les crédits dans `profiles` selon le price ID (indépendant du code promo)
- JWT legacy désactivé
- Doublon supprimé : n'enregistre plus le code promo (géré dans `create-checkout-session`)

**3. `admin-user-management`**
- Actions : `create` / `invite` / `delete`
- Vérifie `role = 'admin'` avant d'agir

### Crédits attribués par price ID
```
price_1TIb1LBO4ekMbwz0020eqcR0  →  +1 credits_document
price_1TIb3XBO4ekMbwz0a7m7E7gD  →  +1 credits_complete
price_1TIb4KBO4ekMbwz0gGF2gI1S  →  +2 credits_complete
price_1TIb51BO4ekMbwz0mmEez47o  →  +3 credits_complete
```

### Secrets Supabase configurés
- `STRIPE_SECRET_KEY` ✅
- `STRIPE_WEBHOOK_SECRET` ✅

### Variables Vercel configurées
- `VITE_STRIPE_PUBLIC_KEY` ✅
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅

### Webhook Stripe
- **URL :** `https://veszrayromldfgetqaxb.supabase.co/functions/v1/stripe-webhook`
- **Événement écouté :** `checkout.session.completed`

### Carte de test Stripe
- **Numéro :** `4242 4242 4242 4242`
- **Expiration :** n'importe quelle date future
- **CVC :** n'importe quel 3 chiffres

### Pour passer en production
1. Basculer Stripe en mode live
2. Recréer les 4 produits en mode live
3. Mettre à jour les Price IDs dans `Tarifs.tsx`
4. Mettre à jour `STRIPE_SECRET_KEY` (clé live) dans Supabase secrets
5. Reconfigurer le webhook avec l'URL live et mettre à jour `STRIPE_WEBHOOK_SECRET`
6. Mettre à jour `VITE_STRIPE_PUBLIC_KEY` (clé publique live) dans Vercel

---

## CODES PROMO — Logique complète ✅

### Types
- `percent` — % de réduction sur le prix
- `fixed` — montant fixe de réduction en €
- `credits` — crédits bonus offerts (pas de réduction sur le prix)

### Restrictions combinables
- Email restreint (`restricted_email`)
- Date d'expiration (`expires_at`)
- Nombre max d'utilisations (`max_uses`)
- Usage unique par compte (table `promo_uses` avec UNIQUE constraint)

### Vérifications frontend (`Tarifs.tsx`) au moment de la saisie
| Cas | Message affiché |
|---|---|
| Code inexistant ou inactif | "Code invalide ou expiré" |
| Date d'expiration dépassée | "Ce code a expiré" |
| Max utilisations atteint | "Ce code a atteint sa limite d'utilisation" |
| Email restreint | "Ce code n'est pas disponible pour votre compte" |
| Déjà utilisé par ce compte | "Vous avez déjà utilisé ce code" |

### Flow complet
1. Utilisateur saisit le code → vérification frontend immédiate
2. Code valide → nouveau prix affiché dans la modale
3. Clic "Payer" → `create-checkout-session` recrée la vérification + crée coupon Stripe + enregistre usage
4. Redirect Stripe → paiement avec réduction appliquée
5. Retour `?success=true` → webhook attribue les crédits selon le price ID

### Générateur auto
Code aléatoire disponible dans l'onglet "Codes promo" de l'admin.

---

## AUTH — Flows complets

### Connexion Google
1. Clic "Continuer avec Google" → `signInWithOAuth` avec `redirectTo: /auth/callback`
2. Google redirige vers `/auth/callback`
3. `AuthCallbackPage` détecte la session existante (PKCE auto)
4. Animation 3 secondes → écran succès → bouton "Accéder au tableau de bord" (après 3s)
5. Clic → `/dashboard`

### Inscription email
1. Formulaire inscription → `supabase.auth.signUp`
2. Email de confirmation envoyé (template Supabase personnalisé en français)
3. Clic sur le lien → `/auth/callback?token_hash=...&type=signup`
4. `AuthCallbackPage` appelle `verifyOtp({ token_hash, type })`
5. Animation 3 secondes → écran "Bienvenue, Prénom ! 🎉" → bouton apparaît après 3s
6. Clic → `/dashboard`

### Connexion email classique
1. Formulaire connexion → `signInWithPassword`
2. Vérification suspension → sync localStorage → `navigate('/dashboard')`

### Déconnexion
```typescript
const handleLogout = () => {
  localStorage.clear();
  supabase.auth.signOut(); // non-bloquant
  window.location.replace('/');
};
```
Synchrone, pas de `await` — évite les conflits avec `onAuthStateChange`.

### AUTHCALLBACKPAGE — Logique de détection session
```
1. getSession() → session déjà établie (Google PKCE) ?
2. token_hash dans URL → verifyOtp({ token_hash, type }) (confirmation email)
3. code dans URL → exchangeCodeForSession(code) (PKCE fallback)
4. access_token dans hash → setSession({ access_token, refresh_token }) (implicit flow)
5. getSession() final → dernière vérification
→ Si sessionOk : syncFreePreviewUsed() + cacheUserInfo() → status 'success'
→ Sinon : status 'already_confirmed'
```
Animation : cercle SVG progressif, icône email pulsante, texte rotatif (4 étapes), points animés.
Durée minimum : 3 secondes. Pas de redirection automatique — le client clique quand il est prêt.

---

## OFFRE GRATUITE — Logique complète

### Règle fondamentale
`free_preview_used` ne passe **JAMAIS** de `true` à `false` automatiquement.
Seul moyen de la réinitialiser : SQL manuel dans Supabase.

### Flow offre gratuite
1. Nouveau compte → `free_preview_used = false` dans Supabase
2. Dashboard → badge "1 analyse offerte 🎁" affiché si :
   - `free_preview_used === false` (lu depuis Supabase au montage)
   - ET crédits document = 0 ET crédits complete = 0
3. Client clique "En profiter" → page "Nouvelle Analyse"
4. Client upload docs → aperçu succinct généré (gratuit)
5. Rapport partiel affiché avec partie grisée → invite à payer

### Si le client paie SANS avoir utilisé l'offre gratuite
Message : *"🎉 Vous aviez une analyse gratuite disponible, mais pourquoi regarder par le trou de la serrure quand on peut ouvrir la porte en grand ? En payant directement, votre offre gratuite a été remplacée par l'analyse que vous venez d'acheter. Bonne analyse !"*
→ `free_preview_used` → `true` automatiquement

### Si le client paie APRÈS avoir utilisé l'offre gratuite
Message : *"✅ Paiement confirmé ! Vos crédits ont été ajoutés. 🔒 P.S. : vos documents ont été supprimés de nos serveurs après votre analyse simplifiée (RGPD nous y oblige !). Re-uploadez-les sur votre analyse pour générer le rapport complet — promis, c'est rapide !"*

### Si le client revient sans payer (`?cancelled=true`)
Badge offre gratuite préservé, rien ne change.

### Sync `free_preview_used`
- Au montage de `HomeView` : chargement direct depuis Supabase
- À la connexion (`onAuthStateChange`) : sync localStorage depuis Supabase

---

## DASHBOARD CLIENT — État détaillé

### Layout
- **Sidebar** (desktop, 260px) : logo, crédits restants, navigation
- **Topbar** : titre page, cloche notif, bouton "Espace Admin" (admin only), dropdown profil
- **Dropdown profil** : nom + email, "Mon profil", "Se déconnecter"
- **Bannière** : s'affiche sous la topbar si active (fermable par session, réapparaît à la prochaine connexion)

### Pages du dashboard
- `/dashboard` → HomeView (accueil, badge offre gratuite, stats, guide, glossaire, note /20)
- `/dashboard/nouvelle-analyse` → NouvelleAnalyse (choice → upload → analyse → aperçu/result)
- `/dashboard/analyses` → MesAnalyses (liste filtrée + recherche)
- `/dashboard/compare` → Compare (jauges SVG animées, tableau, verdict Verimo)
- `/dashboard/tarifs` → Tarifs + modale checkout Stripe + codes promo
- `/dashboard/compte` → Compte (infos perso, mot de passe, historique achats, zone danger)
- `/dashboard/support` → Support (FAQ accordion + formulaire contact)
- `/dashboard/rapport?id=...` → RapportPage (page dédiée, non refactorisée)

### Crédits sidebar
- "X crédit(s) document(s) restant(s)"
- "X crédit(s) complet(s) restant(s)"
- Lien "+ Recharger" ou "+ Acheter une analyse" si crédits = 0

---

## ADMIN PAGE — État détaillé

### Accès
- URL : `verimo.fr/admin`
- Vérification `role = 'admin'` côté client
- Bouton "Espace Admin" visible dans la topbar dashboard pour les admins
- Responsive mobile : sidebar cachée, navigation en pills fixée en bas

### 8 onglets
1. **Vue d'ensemble** — KPIs animés (utilisateurs, analyses, messages non lus, CA estimé), actions rapides
2. **Statistiques** — Filtres période (7j/30j/3m/12m/personnalisé), KPIs, graphique CA barres
3. **Utilisateurs** — Badges provider, fiche détail, actions (créer/inviter/modifier crédits/reset mdp/suspendre/supprimer)
4. **Analyses** — Liste, recherche, filtre statut, export CSV
5. **Messages** — Liste + détail, marquer lu, répondre, supprimer
6. **Codes promo** — Créer (type/valeur/restrictions), activer/désactiver, supprimer, générateur auto
7. **Bannière** — Créer/modifier/supprimer un message global (info/warning/success)
8. **Historique** — 100 dernières actions admin avec timestamps

### Badges utilisateurs
- `✓ via Google` / `✓ via Email` / `⚠ non vérifié` / `admin` / `suspendu`
- Provider lu depuis `profiles.provider` (rempli par trigger depuis `auth.users`)
- Quand crédits remis à 0 → **ne remet PAS** `free_preview_used` à false (règle absolue)

---

## EMAILS SUPABASE — Templates configurés

### Confirm signup
- Subject : "Activez votre compte Verimo"
- Bouton : `{{ .ConfirmationURL }}` (lien natif Supabase)
- Design : gradient navy, logo GitHub raw, liste des features, expiration 24h

### Invite user
- Subject : "Vous êtes invité à rejoindre Verimo"
- Bouton : `{{ .ConfirmationURL }}`
- Design : même charte, texte d'invitation en français

### Reset password
- Configuré et fonctionnel

---

## App.tsx — SessionManager

```
onAuthStateChange :
  SIGNED_OUT → clear localStorage complet
  TOKEN_REFRESHED → (géré automatiquement par Supabase)

checkSuspension (toutes les 60s) :
  → lit profiles.suspended
  → si suspendu : signOut + redirect /connexion?suspended=true
  → si profil introuvable : signOut + redirect /connexion
```

---

## VARIABLES IMPORTANTES localStorage

| Clé | Valeur | Quand |
|-----|--------|-------|
| `verimo_user_name` | prénom | à la connexion |
| `verimo_user_email` | email | à la connexion |
| `verimo_free_preview_used` | `'true'` | si offre utilisée/payé |
| `verimo_login_time` | timestamp | à la connexion |

Tout effacé via `localStorage.clear()` à la déconnexion.

---

## PALIERS DE NOTATION (/20)

| Score | Label |
|-------|-------|
| 17–20 | Bien irréprochable |
| 14–16 | Bien sain |
| 10–13 | Bien correct avec réserves |
| 7–9 | Bien risqué |
| 0–6 | Bien à éviter |

### Bonus principaux
- Travaux votés à charge vendeur : +0,5 à +1
- Garantie décennale sur travaux récents : +0,5 à +1
- Fonds travaux conforme minimum légal : +0,5
- Fonds travaux au-dessus minimum légal : +1
- Certificat entretien chaudière/ramonage : +0,5
- Immeuble bien entretenu : +0,5
- DPE A : +1 / DPE B ou C : +0,5

### Pénalités principales
- Gros travaux évoqués non votés : -2 à -3
- Travaux urgents non anticipés : -3 à -4
- Copro vs syndic : -2 à -4
- Écart budget >30% : -3
- Fonds travaux nul : -2
- DPE F (résidence principale) : -2 / DPE G : -3
- DPE F (investissement) : -4 / DPE G : -6

---

## POUR DONNER LE RÔLE ADMIN

```sql
UPDATE profiles SET role = 'admin'
WHERE email = 'email@exemple.com';
```

---

## ÉTAT ACTUEL — Ce qui fonctionne ✅

- Inscription email + confirmation mail + animation AuthCallback
- Connexion Google + animation AuthCallback
- Connexion email classique
- Déconnexion (dropdown topbar)
- Badge offre gratuite pour nouveaux comptes
- Aperçu gratuit (1 par compte)
- Analyse simple et complète via Claude API
- Validation upload : format PDF uniquement, taille max 20Mo, détection PDF protégé par mot de passe
- Remboursement automatique crédit si analyse échoue
- Blocage multi-fichiers sur analyse simple (1 seul PDF accepté)
- Comparaison de biens (dès 2 analyses complètes)
- Messages popup après paiement Stripe (2 cas)
- Paiement Stripe (mode test) avec rafraîchissement session automatique
- Webhook Stripe → ajout crédits automatique
- Codes promo (validation, réduction Stripe, usage unique, restrictions) ✅ corrigé session 05/04
- Suppression doublon promo_uses entre create-checkout-session et webhook ✅ corrigé session 05/04
- Suspension / suppression comptes depuis admin
- Bannière admin → dashboard clients
- Badges ✓ via Google / ✓ via Email dans admin
- Provider rempli automatiquement par trigger SQL
- Admin responsive mobile (pills nav en bas)
- Email d'invitation depuis admin (en français)
- Refactoring DashboardPage : 2736 → 261 lignes ✅ session 05/04
- Build Vercel opérationnel ✅ après refactoring

---

## PENDING / À FAIRE

1. **Passer Stripe en production** (mode live) — priorité principale
2. **Historique achats réel** dans `Compte.tsx` — actuellement `mockAchats` hardcodé (2 lignes fictives), à remplacer par une vraie requête sur les paiements Stripe
3. **Crédits bonus** (codes promo type `credits`) — affichés frontend, enregistrés dans `promo_uses`, mais pas encore attribués automatiquement dans le webhook après paiement
4. **Graphique inscriptions** semaine/semaine dans les stats admin
5. Mettre à jour `context.md` dans le repo GitHub après chaque session de dev

---

## SESSION 06/04/2026 — Travaux effectués

### UX / Design HomePage ✅

**Optimisations performances iOS (session 05/04/2026) :**
- Favicon : 159Ko → 335 octets (bouclier teal SVG)
- `src/App.tsx` : lazy loading toutes les routes avec `React.lazy + Suspense`
- `src/pages/HomePage.tsx` : détection iOS, suppression `rotateY`/`rotateX`/`perspective` sur iPhone, animations réduites (y: 6px, duration: 0.18s)
- `TarifsPage`, `MethodePage`, `ExemplePage`, `ContactPage` : Reveal optimisé iOS
- **Statut : à tester sur iPhone réel — résultat non encore confirmé**

**Favicon :** Nouveau favicon bouclier teal avec V blanc (option I) — 335 octets vs 159Ko avant

**Navbar mobile :** Refonte complète — fond blanc, compact, lien actif fond `#f0f7fb` + texte teal + point teal, bouton S'inscrire teal `#2a7d9c`, menu s'accroche sous la navbar sans espace, coins ronds en bas uniquement

**Navbar desktop :** Lien actif harmonisé avec mobile (fond `#f0f7fb` + texte teal), bouton S'inscrire teal au lieu de navy

**Logos connexion/inscription :** Mobile `100px` centré, desktop `90px` — LoginPage.tsx + SignupPage.tsx

**Hero mobile :** `pt-14` (espace sous navbar), sous-titre reformulé sur 3 lignes propres : "Diagnostics, PV d'AG, copropriété…" / "Comprenez l'essentiel en 30 secondes*" / "avant de faire une offre."

**Ordre sections HomePage (nouveau) :**
1. Hero → 2. Pourquoi Verimo → 3. Comment ça marche → 4. Aperçu rapport → 5. Avant/Après → 6. Pour qui → 7. Score → 8. Sécurité → 9. FAQ

**Section "Pourquoi Verimo" :** Refonte complète — fond teal très subtil `#eef7f9`, titre "Vous avez visité. Vous avez aimé. Mais avez-vous vraiment lu ?", 4 cartes blanches modernes avec badge coloré, textes simples et accessibles, utilise `SectionTitle` (trait animé inclus)

**Section "Pour qui" :** "Premier achat" → "Acheteur particulier", "Déjà propriétaire" → "Vendeur" (nouveau texte orienté vente et réassurance acheteur)

**Section Sécurité :** Carte "Hébergement en France" supprimée (doublon avec bandeau), grille corrigée `sm:grid-cols-3`

**Section "Comment ça marche" :** Étape 01 reformulée "Déposez vos documents — Tout document lié à votre futur logement"

**Avant/Après :** Onglet "Avec Verimo" par défaut (`useState(true)`)

**SectionTitle :** Taille réduite `clamp(26px,4vw,52px)`, sous-titre `max-w-xs md:max-w-2xl`, marges réduites

**Espacement sections :** Réduit partout `py-16 md:py-28` → `py-12 md:py-20`

**FAQ :** Titre reformulé "Vos questions, nos réponses."

---

### Pages légales créées ✅

- `src/pages/ConfidentialitePage.tsx` — politique RGPD complète (10 sections), route `/confidentialite`
- `src/pages/CGUPage.tsx` — CGU droit français complet (14 sections, art. L.221-28, art. 1218 Code civil, médiation consommation), route `/cgu`
- Footer mis à jour : liens réels vers `/confidentialite` et `/cgu`

---

### Google OAuth — Nouveau projet ✅

**Ancien projet :** Analymo Auth (compte analymo75000@gmail.com) — abandonné
**Nouveau projet :** VERIMO (verimo-492420) depuis `hello@verimo.fr`

**Nouveau Client OAuth :**
- ID : `220743216898-6kic0d4hn80odnbelmsn1sfqpv0behr2.apps.googleusercontent.com`
- Redirect URI : `https://veszrayromldfgetqaxb.supabase.co/auth/v1/callback`
- Origines JS : `https://verimo.fr`

**Supabase → Authentication → Providers → Google** mis à jour avec les nouvelles clés

**Branding Google :**
- Nom : `Verimo`
- Logo uploadé (120×120px fond blanc)
- Page d'accueil : `https://verimo.fr`
- Confidentialité : `https://verimo.fr/confidentialite`
- CGU : `https://verimo.fr/cgu`
- **Statut : en cours d'examen humain Google** (quelques jours)
- En attendant : URL Supabase affichée dans la popup Google (fonctionnel mais non brandé)

---

### NouvelleAnalyse.tsx — Validations robustes ✅

**Validations ajoutées :**
- ❌ Fichier non PDF (Word, JPEG, PNG) → bloqué avec message adapté au format
- ❌ Fichier > 20Mo → bloqué avec conseil de compression
- ❌ PDF protégé par mot de passe → détecté via lecture des premiers octets (`/Encrypt`), bloqué
- ❌ Analyse simple + plusieurs fichiers → bloqué, 1 fichier max
- ⚠️ PDF scanné illisible → warning pendant chargement, analyse continue
- 🔄 Erreur à mi-parcours → reset complet, retour upload vierge
- 💰 Erreur après débit crédit → **remboursement automatique** via Supabase
- Zone de dépôt : `accept=".pdf"` uniquement
- Encart informatif : formats acceptés / non supportés / PDF protégés
- `max_tokens` extraction augmenté à 4000

---

### Architecture traitement documents — À FAIRE (priorité haute)

**Problème critique identifié :** Le `.slice(0, 8000)` actuel ignore silencieusement les documents au-delà des 8000 premiers caractères. Sur une analyse complète avec 10 PDFs × 40 pages, seuls les premiers documents sont vraiment analysés.

**Solution décidée : Edge Function Supabase + Map-Reduce**

**Pourquoi Edge Function :**
- Pas de timeout navigateur (tourne 150s indépendamment du client)
- Client peut fermer l'onglet → traitement continue → résultat disponible au retour
- Clé API jamais exposée côté client (Supabase Secrets)
- Remboursement automatique si échec côté serveur
- Conforme RGPD : PDFs traités en mémoire uniquement, aucun stockage

**Architecture Map-Reduce :**
```
Phase 1 MAP — par document :
  PDF (40p, ~40 000 tokens) → extraction structurée JSON → ~2000 tokens
  {
    resolutions: [{ num, intitule, montant, vote, annee_prevue }],
    charges_annuelles, fonds_travaux,
    procedures, impayes, travaux, diagnostics
  }

Phase 2 REDUCE — synthèse globale :
  10 × 2000 tokens = 20 000 tokens → rapport final complet
  → Zéro perte d'information sur les résolutions/montants
```

**Couche abstraction IA (`src/lib/ai-provider.ts`) :**
- 1 seul fichier à modifier pour changer de modèle (Claude → GPT-4o → Gemini)
- Clé API dans Supabase Secrets (`ANTHROPIC_API_KEY`)
- Edge Function lit `Deno.env.get('ANTHROPIC_API_KEY')`

**Expérience client si fermeture onglet :**
- Dashboard → Mes analyses → animation "En cours..." avec polling toutes 5s
- Dès completed → "Rapport prêt ! Voir le rapport →"

**Fichiers à créer :**
| Fichier | Rôle |
|---------|------|
| `supabase/functions/analyser/index.ts` | Edge Function — Map-Reduce |
| `src/lib/ai-provider.ts` | Abstraction IA |
| `src/lib/analyse-client.ts` | Appel Edge Function + polling |

**Fichiers à modifier :**
| Fichier | Modification |
|---------|-------------|
| `src/pages/dashboard/NouvelleAnalyse.tsx` | Utiliser Edge Function |
| `src/pages/dashboard/MesAnalyses.tsx` | Polling + animation "en cours" |

**Prérequis pour implémenter :**
1. Ouvrir GitHub Codespaces sur le repo (terminal dans navigateur)
2. `supabase init` puis `supabase link --project-ref veszrayromldfgetqaxb`
3. Supabase Dashboard → Settings → Edge Functions → Secrets → ajouter `ANTHROPIC_API_KEY`
4. Déployer la Edge Function via `supabase functions deploy analyser`

---

### PENDING mis à jour

1. **Passer Stripe en production** (mode live)
2. **Historique achats réel** dans `Compte.tsx` (mockAchats → vraie requête Stripe)
3. **Crédits bonus** codes promo type `credits` — pas encore attribués dans webhook
4. **Graphique inscriptions** semaine/semaine dans stats admin
5. **Edge Function + Map-Reduce** — traitement documents robuste (voir section ci-dessus)
6. **Polling MesAnalyses.tsx** — animation "en cours" pour analyses en attente
7. **Mentions légales** — page `/mentions-legales` à créer
8. **Branding Google** — en cours d'examen, vérifier dans 3-7 jours
9. **Tests iOS** — fluidité à tester après déploiement des optimisations
10. Mettre à jour `context.md` dans le repo GitHub après chaque session
