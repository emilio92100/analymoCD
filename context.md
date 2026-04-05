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
result jsonb | apercu jsonb | is_preview boolean | paid boolean
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
```sql
-- incrémente uses_count sur promo_codes
```

### RLS
- `profiles` : lecture pour tous les authentifiés, modification par soi-même ou admin
- `banners` : lecture pour tous les authentifiés, écriture admin uniquement
- `contact_messages`, `promo_codes`, `promo_uses`, `admin_logs` : policies standard

### URL Configuration Supabase
- **Site URL :** `https://verimo.fr`
- **Redirect URLs :** `https://verimo.fr/auth/callback`, `https://verimo.fr/dashboard`, `https://verimo.fr/auth/reset-password` (+ variantes www)

---

## STRIPE — État

### Edge Functions déployées
1. **`create-checkout-session`** — Crée une session Stripe et retourne l'URL de paiement
   - `success_url` → `https://verimo.fr/dashboard/tarifs?success=true`
   - `cancel_url` → `https://verimo.fr/dashboard/tarifs?cancelled=true`
   - Headers CORS : `authorization, x-client-info, apikey, content-type`
   - JWT legacy désactivé

2. **`stripe-webhook`** — Reçoit les événements Stripe après paiement confirmé
   - Event : `checkout.session.completed`
   - Ajoute les crédits dans `profiles` selon le `priceId`
   - JWT legacy désactivé

3. **`admin-user-management`** — Gestion des comptes depuis l'admin
   - Actions : `create` / `invite` / `delete`
   - Vérifie `role = 'admin'` avant d'agir

### Secrets Supabase configurés
- `STRIPE_SECRET_KEY` ✅
- `STRIPE_WEBHOOK_SECRET` ✅

### Variables Vercel configurées
- `VITE_STRIPE_PUBLIC_KEY` ✅
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅

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
1. Clic "Se déconnecter" dans dropdown topbar
2. `localStorage.clear()` + `supabase.auth.signOut()` + `window.location.replace('/')`

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
- Après retour Stripe (`?success=true`) :
- Message : *"🎉 Vous aviez une analyse gratuite disponible, mais pourquoi regarder par le trou de la serrure quand on peut ouvrir la porte en grand ? En payant directement, votre offre gratuite a été remplacée par l'analyse que vous venez d'acheter. Bonne analyse !"*
- `free_preview_used` → `true` automatiquement

### Si le client paie APRÈS avoir utilisé l'offre gratuite
- Après retour Stripe (`?success=true`) :
- Message : *"✅ Paiement confirmé ! Vos crédits ont été ajoutés. 🔒 P.S. : vos documents ont été supprimés de nos serveurs après votre analyse simplifiée (RGPD nous y oblige !). Re-uploadez-les sur votre analyse pour générer le rapport complet — promis, c'est rapide !"*

### Si le client revient sans payer (`?cancelled=true`)
- Badge offre gratuite préservé, rien ne change

### Sync `free_preview_used`
- Au montage de `HomeView` : chargement direct depuis Supabase
- À la connexion (`onAuthStateChange`) : sync localStorage depuis Supabase

---

## DASHBOARD CLIENT — État détaillé

### Layout
- **Sidebar** (desktop, 260px) : logo, crédits restants, navigation, pas de bloc user en bas
- **Topbar** : titre page, cloche notif, bouton "Espace Admin" (admin only), dropdown profil
- **Dropdown profil** (topbar droite) : nom + email, "Mon profil", "Se déconnecter"
- **Bannière** : s'affiche sous la topbar si une bannière est active (fermable par session)

### Pages du dashboard
- `/dashboard` → HomeView (accueil, badge offre gratuite, stats)
- `/dashboard/nouvelle-analyse` → NouvelleAnalyse
- `/dashboard/analyses` → MesAnalyses
- `/dashboard/compare` → Compare
- `/dashboard/tarifs` → Tarifs + modale checkout Stripe
- `/dashboard/compte` → Compte
- `/dashboard/support` → Support
- `/dashboard/rapport` → RapportPage (page dédiée)

### Crédits sidebar
- "X crédit(s) document(s) restant(s)"
- "X crédit(s) complet(s) restant(s)"
- Lien "+ Recharger" ou "+ Acheter une analyse" si crédits = 0

---

## ADMIN PAGE — État détaillé

### Accès
- URL : `verimo.fr/admin`
- Vérification `role = 'admin'` côté client
- Responsive mobile : sidebar cachée, navigation en pills fixée en bas

### 8 onglets

**1. Vue d'ensemble**
KPIs animés (utilisateurs, analyses, messages non lus, CA estimé), actions rapides

**2. Statistiques**
Filtres période (7j/30j/3m/12m/personnalisé), KPIs, graphique CA barres

**3. Utilisateurs**
- Badges : `✓ via Google` / `✓ via Email` / `⚠ non vérifié` / `admin` / `suspendu`
- Provider lu depuis `profiles.provider` (rempli par trigger depuis `auth.users`)
- Fiche détail : infos + analyses de l'utilisateur
- Actions : créer, inviter, modifier crédits, reset mdp, suspendre, supprimer
- Quand crédits remis à 0 → **ne remet PAS** `free_preview_used` à false (règle absolue)

**4. Analyses**
Liste, recherche, filtre statut, export CSV

**5. Messages**
Liste + détail, marquer lu, répondre, supprimer

**6. Codes promo**
Créer (type/valeur/restrictions), activer/désactiver, supprimer

**7. Bannière**
Créer/modifier/supprimer un message affiché sur tous les dashboards clients
Types : info (bleu) / warning (orange) / success (vert)
Fermeture client : par session (réapparaît à la prochaine connexion)

**8. Historique**
100 dernières actions admin avec timestamps

---

## EMAILS SUPABASE — Templates configurés

### Confirm signup
- Subject : "Activez votre compte Verimo"
- Bouton : `{{ .ConfirmationURL }}` (lien natif Supabase)
- Design : gradient navy, logo GitHub raw, liste des features, expiration 24h

### Invite user
- Subject : "Vous êtes invité à rejoindre Verimo"
- Bouton : `{{ .ConfirmationURL }}`
- Design : même charte, texte d'invitation

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
- Messages popup après paiement Stripe (2 cas)
- Paiement Stripe (mode test) avec rafraîchissement session automatique
- Webhook Stripe → ajout crédits automatique
- Codes promo (validation, usage unique, restrictions)
- Suspension / suppression comptes depuis admin
- Bannière admin → dashboard clients
- Badges ✓ via Google / ✓ via Email dans admin
- Provider rempli automatiquement par trigger SQL
- Admin responsive mobile (pills nav en bas)
- Email d'invitation depuis admin (en français)

## PENDING / À FAIRE

1. **Passer Stripe en production** (mode live)
2. **Graphique inscriptions** semaine/semaine dans les stats admin
3. Mettre à jour context.md après chaque session de dev

---

## PALIERS DE NOTATION (/20)

| Score | Label |
|-------|-------|
| 17–20 | Bien irréprochable |
| 14–16 | Bien sain |
| 10–13 | Bien correct avec réserves |
| 7–9   | Bien risqué |
| 0–6   | Bien à éviter |

---

## CODES PROMO — Logique complète

- **Types :** `credits` (ajoute des crédits) / `percent` (% de réduction) / `fixed` (€ de réduction)
- **Restrictions combinables :** email restreint, date d'expiration, max_uses
- **Usage unique par compte** (table `promo_uses` avec UNIQUE constraint)
- **Validation côté client** : vérifie active, expiration, max_uses, email restreint, déjà utilisé
- **Enregistrement** : dans `promo_uses` au moment de la confirmation paiement Stripe
- **Générateur auto** dans l'admin (code aléatoire)

---

## HANDLELOGOUT — Implémentation exacte

```typescript
const handleLogout = () => {
  localStorage.clear();
  supabase.auth.signOut(); // non-bloquant
  window.location.replace('/');
};
```
Appelé depuis le dropdown topbar (useRef + mousedown listener pour fermer).
**Important** : synchrone, pas de `await` — évite les conflits avec `onAuthStateChange`.

---

## HANDLEPAY — Implémentation exacte

```typescript
// Rafraîchit le token avant d'appeler Stripe
const { data: refreshData } = await supabase.auth.refreshSession();
const finalSession = refreshData.session || (await supabase.auth.getSession()).data.session;

fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/create-checkout-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${finalSession.access_token}`,
    'apikey': '<ANON_KEY>',
  },
  body: JSON.stringify({ priceId, userId, promoCodeId }),
});
```

---

## AUTHCALLBACKPAGE — Logique de détection session

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
Durée minimum : 3 secondes.
Bouton "Accéder à mon tableau de bord" : apparaît après 3 secondes sur l'écran succès.
**Pas de redirection automatique** — le client clique quand il est prêt.

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

## STRUCTURE DES FICHIERS

```
src/
├── App.tsx                    — SessionManager + Routes
├── lib/
│   ├── supabase.ts            — Client Supabase
│   ├── analyses.ts            — CRUD analyses + syncFreePreviewUsed
│   └── prompts.ts             — Prompts système IA
├── components/layout/
│   ├── Navbar.tsx
│   └── Footer.tsx
└── pages/
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
    ├── AuthCallbackPage.tsx   — Animation confirmation + détection session
    ├── DashboardPage.tsx      — Dashboard complet (~2700 lignes)
    ├── RapportPage.tsx        — Page rapport détaillé
    └── AdminPage.tsx          — Page admin complète
```

---

## STRIPE — Configuration complète (mode TEST)

### Compte Stripe
- Mode **TEST** actif — pas encore en production
- Dashboard : https://dashboard.stripe.com

### Produits créés dans Stripe (mode test)
| Produit | Price ID | Prix |
|---------|----------|------|
| Analyse Simple | `price_1TIb1LBO4ekMbwz0020eqcR0` | 4,90€ |
| Analyse Complète | `price_1TIb3XBO4ekMbwz0a7m7E7gD` | 19,90€ |
| Pack 2 biens | `price_1TIb4KBO4ekMbwz0gGF2gI1S` | 29,90€ |
| Pack 3 biens | `price_1TIb51BO4ekMbwz0mmEez47o` | 39,90€ |

### Webhook Stripe configuré
- **URL :** `https://veszrayromldfgetqaxb.supabase.co/functions/v1/stripe-webhook`
- **Événement écouté :** `checkout.session.completed`
- **Secret webhook :** configuré dans les secrets Supabase (`STRIPE_WEBHOOK_SECRET`)

### Ce que fait le webhook après paiement confirmé
1. Reçoit l'événement `checkout.session.completed`
2. Lit `metadata.userId` et `metadata.priceId`
3. Selon le `priceId` → ajoute les crédits correspondants dans `profiles`
4. Logique crédits ajoutés :
   - `price_1TIb1LBO4ekMbwz0020eqcR0` → +1 `credits_document`
   - `price_1TIb3XBO4ekMbwz0a7m7E7gD` → +1 `credits_complete`
   - `price_1TIb4KBO4ekMbwz0gGF2gI1S` → +2 `credits_complete`
   - `price_1TIb51BO4ekMbwz0mmEez47o` → +3 `credits_complete`

### Clés configurées
- `STRIPE_SECRET_KEY` → secret Supabase Edge Functions ✅
- `STRIPE_WEBHOOK_SECRET` → secret Supabase Edge Functions ✅
- `VITE_STRIPE_PUBLIC_KEY` → variable Vercel ✅

### Carte de test Stripe
- **Numéro :** `4242 4242 4242 4242`
- **Expiration :** n'importe quelle date future
- **CVC :** n'importe quel 3 chiffres

### Pour passer en production
1. Basculer Stripe en mode live
2. Recréer les 4 produits en mode live
3. Mettre à jour les Price IDs dans `DashboardPage.tsx`
4. Mettre à jour `STRIPE_SECRET_KEY` (clé live) dans Supabase secrets
5. Reconfigurer le webhook avec l'URL live et mettre à jour `STRIPE_WEBHOOK_SECRET`
6. Mettre à jour `VITE_STRIPE_PUBLIC_KEY` (clé publique live) dans Vercel

---

## CE QUI A ÉTÉ FAIT PENDANT LA SESSION DU 05/04/2026

### Auth & Redirections
- Connexion Google : `redirectTo` → `/auth/callback` (plus `/dashboard` directement)
- `AuthCallbackPage` : animation 3s minimum, bouton apparaît après 3s, pas de redirection auto
- Email confirmation : template Supabase avec `{{ .ConfirmationURL }}` (plus `token_hash` custom)
- `verifyOtp` pour gérer le flow email dans AuthCallbackPage
- Redirection vers `/dashboard` uniquement si on est sur une page publique (géré dans `onAuthStateChange`)

### Déconnexion
- Bouton "Se déconnecter" dans dropdown topbar (plus en bas de sidebar)
- Fix : `useRef` + `document.addEventListener('mousedown')` pour fermer le dropdown sans overlay
- `handleLogout` synchrone : `localStorage.clear()` + `signOut()` + `window.location.replace('/')`

### Offre gratuite
- Badge affiché dans `HomeView` : chargement depuis Supabase au montage (état `null` → `false`/`true`)
- Plus de dépendance au localStorage seul pour l'affichage du badge
- `freePreviewUsedHome === false` (strict) pour afficher le badge
- Règle absolue confirmée : `free_preview_used` ne revient jamais à `false` automatiquement

### Admin
- Sidebar supprimée sur mobile → pills nav fixée en bas
- Badge `✓ via Google` / `✓ via Email` dans liste et fiche détail utilisateur
- Colonne `provider` ajoutée à `profiles` + trigger mis à jour + rétroactivement rempli via SQL
- Onglet "Bannière" ajouté (créer/modifier/supprimer message global)
- Grille utilisateurs responsive (header caché sur mobile, actions visibles)
- Fiche détail utilisateur : grid 1 colonne sur mobile

### Bannière dashboard
- Table `banners` créée dans Supabase avec RLS
- Affichée sous la topbar sur toutes les pages du dashboard
- Fermeture via sessionStorage (clé unique par bannière + par user)
- Réapparaît à chaque nouvelle connexion

### Stripe
- `handlePay` : `refreshSession()` avant chaque appel pour éviter token expiré
- Edge Function `create-checkout-session` : headers CORS ajoutés (`apikey` inclus)
- `apikey` (anon key hardcodée) dans les headers du fetch

### Emails
- Template "Invite user" créé en français dans le style Verimo
- Template "Confirm signup" mis à jour avec `{{ .ConfirmationURL }}`

### Messages post-paiement
- **Si offre gratuite non utilisée + paiement** : message serrure/porte → `free_preview_used = true`
- **Si offre gratuite déjà utilisée + paiement** : message confirmation + RGPD re-upload docs
- Message RGPD précise "analyse simplifiée" pour être exact
