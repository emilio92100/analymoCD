# VERIMO — Contexte complet du projet au 04/04/2026

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
- **Modèle IA :** `claude-sonnet-4-20250514` (appelé côté client via API Anthropic)
- **SMTP :** Mailjet — in-v3.mailjet.com port 587 — Sender : notification@verimo.fr
- **Redirect URL auth :** `https://verimo.fr/auth/reset-password`

### Design system
- **Couleurs :** `#2a7d9c` (teal) / `#0f2d3d` (navy) / `#f0a500` (gold) / `#22c55e` (green)
- **Police :** DM Sans
- **Border radius standard :** 12–20px
- **Animations :** Framer Motion avec `ease: [0.22, 1, 0.36, 1]` pour les entrées

---

## RÈGLES ABSOLUES DU PROJET

- Jamais "IA", "Claude", "Anthropic" → toujours **"notre outil"** ou **"notre moteur"**
- Prix : **4,90€ / 19,90€ / 29,90€ / 39,90€**
- Analyse simple (4,90€) → **jamais de note /20**, jamais de score
- Toujours **"Traitement en cours"** (jamais "Analyse en cours")
- Stripe **PAS encore branché** → crédits gérés manuellement depuis l'admin
- Comparaison de biens débloquée dès **2 analyses complètes** dans le compte
- Pack 3 biens = rapport comparatif + classement final + verdict automatique
- Codes promo : **usage unique par compte**, 3 types (crédits / % / €), restrictions combinables

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

## OFFRES ET TARIFS

| Plan | Prix | Crédits | Contenu |
|------|------|---------|---------|
| Analyse Simple | 4,90€ | 1 crédit document | 1 document, points clés, pas de score /20 |
| Analyse Complète | 19,90€ | 1 crédit complete | Docs illimités, score /20, rapport PDF |
| Pack 2 biens | 29,90€ | 2 crédits complete | 2 analyses + rapport comparatif |
| Pack 3 biens | 39,90€ | 3 crédits complete | 3 analyses + comparatif + classement + verdict |

- Crédits **sans date d'expiration**
- Paiement unique, sans abonnement
- Résultats en moins de 2 minutes pour les PDF nativement numériques

---

## STRUCTURE DES FICHIERS

```
src/
├── App.tsx
├── lib/
│   ├── supabase.ts         — Client Supabase
│   ├── analyses.ts         — CRUD analyses
│   └── prompts.ts          — Prompts système IA
├── components/layout/
│   ├── Navbar.tsx          — Navigation publique (avec "Notre méthode")
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
    ├── AuthCallbackPage.tsx
    ├── DashboardPage.tsx
    ├── RapportPage.tsx
    └── AdminPage.tsx       — NOUVEAU
```

---

## PAGES — ÉTAT DÉTAILLÉ

### `src/App.tsx`
- SessionManager : déconnexion auto après 1h
- Route `/admin` → `AdminPage`
- Routes dashboard : `/dashboard`, `/dashboard/analyses`, `/dashboard/compare`, `/dashboard/compte`, `/dashboard/support`, `/dashboard/tarifs`, `/dashboard/nouvelle-analyse`
- Route `/dashboard/rapport` → `RapportPage`

### `src/pages/HomePage.tsx`
- Badge mobile supprimé
- Sous-titre mobile reformaté avec sauts de ligne lisibles
- **Téléphone animé 3D** :
  - Apparition en fondu lent (1.4s, ease custom) depuis le bas
  - Docs volants avec spring physics (teal / violet / or) après 1.6s
  - `usePhoneSteps()` hook partagé desktop/mini — 3 phases : Upload → Traitement → Résultat
  - Phase Upload : barre de progression dégradé teal→violet, docs qui arrivent avec rotation
  - Phase Traitement : spinner Framer Motion, tâches en cascade avec pulse
  - Phase Résultat : jauge SVG dégradé teal→vert, score animé, items depuis la droite
  - Flottaison 3D douce avec `rotateY` et `rotateX`
- **Section Avant/Après** : toggle "Sans Verimo / Avec Verimo", slide animé, stagger 5 items, couleurs rouge/vert
- **Section Pour Qui** : 4 profils avec onglets (Premier achat 🏠 / Déjà propriétaire 🔑 / Investisseur 📈 / Professionnel 💼), texte et CTA personnalisés par profil
- **FAQ** : 7 questions avec emoji, réponses détaillées, icône colorée à l'ouverture
- Bloc "Prenez votre décision" supprimé, `CtaFinal` supprimé

### `src/pages/TarifsPage.tsx`
- Titre "sans surprise." avec underline animé
- Prix centrés dans chaque carte
- Tableau desktop + accordéon mobile (< 640px)

### `src/pages/MethodePage.tsx`
- Hero centré avec underline animé
- Sidebar lisible et structurée
- Tableau mobile accordéon, fully responsive

### `src/pages/ExemplePage.tsx`
- 5 onglets : Synthèse, Finances, Travaux, Procédures, Documents
- Jauge SVG animée, données réalistes (Lyon, score 15/20)

### `src/pages/RapportPage.tsx`
- Score /20 uniformisé partout

### `src/pages/ContactPage.tsx`
- Badge "Contact" supprimé
- Formulaire → Supabase `contact_messages` (plus de mock)
- État `sending` pendant l'envoi

### `src/pages/DashboardPage.tsx`

**Hook `useCredits()`** :
- Lit `credits_document` et `credits_complete` depuis `profiles` en temps réel
- `deductCredit('document'|'complete')` → déduit 1 crédit, retourne `true/false`
- `MOCK_CREDITS` entièrement supprimé de Sidebar, HomeView, NouvelleAnalyse, Tarifs
- `useCallback` importé

**Topbar** : bouton "Espace Admin" visible uniquement si `role = 'admin'`

**Nouvelle Analyse** :
- Vérifie crédits → déduit 1 → lance l'analyse
- Si 0 crédit → message d'erreur clair

**Comparer mes biens** :
- État 0 analyse → message + CTA + lien packs
- État 1 analyse → bien existant affiché, invite à analyser un 2e
- État 2-3 analyses → sélection numérotée (1, 2, 3), rapport complet :
  - Jauge SVG par bien + badge "⭐ Recommandé"
  - Tableau 5 catégories côte à côte
  - Points clés / vigilances par bien
  - Verdict Verimo avec explication détaillée
  - Liens vers rapports individuels

### `src/pages/AdminPage.tsx` *(nouveau)*

**Sécurité** : vérification `role = 'admin'` → redirect si non admin. Tout nouveau compte = `user` par défaut.

**7 onglets** :

**1. Vue d'ensemble**
KPIs animés (users, analyses, messages non lus, CA), actions rapides cliquables, bloc CA

**2. Statistiques**
Filtres période (7j / 30j / 3m / 12m / personnalisé), KPIs, graphique CA barres animées (8 semaines), répartition par plan avec revenus

**3. Utilisateurs**
- Onglets : Tous / ✓ Vérifiés / ⚠ Non vérifiés (vérifiés en premier)
- Badges : ✓ vérifié (vert) / ⚠ non vérifié (orange) / admin (violet) / suspendu (rouge) / Google (bleu)
- Recherche, export CSV
- Créer compte via Edge Function (email + mdp + nom)
- Inviter par email via Edge Function
- Détail utilisateur : fiche complète + toutes ses analyses
- Modifier crédits (synchro Supabase immédiate)
- Reset mot de passe (email vers verimo.fr/auth/reset-password)
- Suspendre / Réactiver / Supprimer
- Modal de confirmation sur toutes les actions critiques

**4. Analyses**
Liste (200 max), recherche par adresse, filtre statut, export CSV

**5. Messages**
Liste + détail côte à côte, "Marquer tout lu", répondre par mailto, supprimer

**6. Codes promo**
Créer (type crédits/% /€, restrictions combinables), générateur auto, copier 1 clic, activer/désactiver, supprimer

**7. Historique**
100 dernières actions admin, icônes colorées, timestamps

Toast après chaque action. Modal de confirmation sur les actions critiques.

---

## SUPABASE — État complet

### Compte admin
- **Email :** `hello@verimo.fr`
- **ID :** `67b0ce02-b247-4d49-aadf-76dcb29b630a`
- **Role :** `admin` ✅
- **Accès :** `verimo.fr/admin`

### Tables

#### `profiles`
```
id uuid PK | email text | nom text | prenom text | full_name text
email_verified boolean | can_delete_account boolean | created_at timestamptz
role text DEFAULT 'user'
credits_document integer DEFAULT 0
credits_complete integer DEFAULT 0
suspended boolean DEFAULT false
```

#### `analyses`
```
id uuid PK | user_id uuid FK | type (document|complete|pack2|pack3)
status (pending|processing|completed|failed) | title text | address text
score numeric | profil (rp|invest) | type_bien (appartement|maison|maison_copro|indetermine)
result jsonb | apercu jsonb | is_preview boolean | paid boolean
document_names text[] | regeneration_deadline text | avis_verimo text | created_at timestamptz
```

#### `contact_messages`
```
id uuid PK | name text | email text | subject text | message text
created_at timestamptz DEFAULT now() | read boolean DEFAULT false
```

#### `promo_codes`
```
id uuid PK | code text UNIQUE | type (credits|percent|fixed) | value numeric
credit_type (document|complete|both) | expires_at timestamptz | max_uses integer
uses_count integer DEFAULT 0 | restricted_email text | active boolean DEFAULT true
created_at timestamptz
```

#### `promo_uses`
```
id uuid PK | code_id uuid FK promo_codes CASCADE | user_id uuid FK auth.users CASCADE
used_at timestamptz DEFAULT now() | UNIQUE(code_id, user_id)
```

#### `admin_logs`
```
id uuid PK | admin_email text | action text | target text | created_at timestamptz
```

### RLS

```sql
-- profiles : lecture pour tous les authentifiés
CREATE POLICY "authenticated_read_profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- profiles : modification par soi-même ou par un admin
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
-- contact_messages, promo_codes, promo_uses, admin_logs : policies similaires
```

### Trigger `handle_new_user`
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Edge Function `admin-user-management`
- **URL :** `https://veszrayromldfgetqaxb.supabase.co/functions/v1/admin-user-management`
- **Pourquoi :** `supabase.auth.admin.*` nécessite `service_role_key` — impossible côté client
- **Actions :** `create` (email+password+full_name) / `invite` (email) / `delete` (user_id)
- **Sécurité :** vérifie `role = 'admin'` avant d'agir
- Appelée depuis `AdminPage.tsx` via `callEdgeFunction()`

---

## LOGIQUE CRÉDITS

```
Admin (AdminPage) → UPDATE profiles SET credits_X = N
                           ↓
Client (Dashboard) → useCredits() lit credits_X en temps réel
                           ↓
Client lance analyse → deductCredit() vérifie > 0
                           ↓ ok                    ↓ 0 crédit
                    UPDATE credits_X - 1     Erreur : "Plus de crédit"
                           ↓
                    Lance l'analyse IA
```

---

## POUR DONNER LE RÔLE ADMIN

```sql
UPDATE profiles SET role = 'admin'
WHERE email = 'email@exemple.com';
```
Seul un accès Supabase SQL peut élever un compte. Impossible depuis le site.

---

## PENDING / À FAIRE

### Prioritaire
1. **Brancher Stripe** → webhook Supabase → ajout automatique de crédits après paiement
2. **Valider codes promo côté client** → dans le flow d'achat/analyse
3. **Tester emails invitation** → vérifier SMTP Mailjet dans Supabase → Project Settings → Auth → SMTP (Host: in-v3.mailjet.com, Port: 587, User: clé publique Mailjet, Pass: clé secrète Mailjet)

### Optionnel
4. Tester création compte depuis admin → trigger crée bien le profil
5. Bannière admin → message à tous les utilisateurs
6. Graphique inscriptions → courbe semaine/semaine dans les stats
7. Admin responsive mobile
