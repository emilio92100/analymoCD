# PROJET VERIMO — Contexte complet au 04/04/2026

## Informations générales
- **Repo GitHub :** https://github.com/emilio92100/analymoCD.git
- **Stack :** React 19 + Vite + TypeScript + Tailwind + Framer Motion + Supabase + Vercel
- **Domaine :** verimo.fr
- **Couleurs :** `#2a7d9c` (teal) / `#0f2d3d` (navy) / `#f0a500` (gold)
- **Police :** DM Sans
- **Supabase Project ID :** `veszrayromldfgetqaxb`
- **SMTP :** Mailjet in-v3.mailjet.com port 587 — Sender : notification@verimo.fr
- **Redirect URL auth :** `https://verimo.fr/auth/reset-password`

---

## RÈGLES PROJET
- Jamais "IA", "Claude", "Anthropic" → toujours "notre outil", "notre moteur"
- Prix : 4,90€ / 19,90€ / 29,90€ / 39,90€
- Analyse simple → jamais de note /20
- Toujours "Traitement en cours" (jamais "Analyse en cours")
- Stripe PAS encore branché → crédits gérés manuellement depuis l'admin
- Comparaison débloquée dès 2 analyses complètes dans le compte
- Pack 3 = rapport comparatif + classement final + verdict automatique
- Codes promo : usage unique par compte, 3 types (crédits / % / €), restrictions combinables

---

## PALIERS DE NOTATION
- 17–20 → Bien irréprochable
- 14–16 → Bien sain
- 10–13 → Bien correct avec réserves
- 7–9 → Bien risqué
- 0–6 → Bien à éviter

---

## FICHIERS MODIFIÉS

### `src/App.tsx`
- Route `/admin` ajoutée → `AdminPage`

### `src/components/layout/Navbar.tsx` / `Footer.tsx`
- "Notre méthode" ajouté dans la navigation

### `src/pages/HomePage.tsx`
- Badge "Analyse immobilière intelligente" supprimé sur mobile
- Sous-titre mobile reformaté avec sauts de ligne propres
- Téléphone animé : fondu lent (1.4s) puis docs volants avec spring physics
- `usePhoneSteps()` hook partagé desktop/mini
- Docs volants colorés (teal / violet / or)
- Jauge SVG score avec dégradé teal→vert animé
- Section **Avant/Après** : toggle interactif "Sans Verimo / Avec Verimo" avec slide animé et stagger sur 5 items
- Section **Pour Qui** : 4 profils avec onglets (Premier achat 🏠, Déjà propriétaire 🔑, Investisseur 📈, Professionnel 💼), texte personnalisé par profil, CTA coloré par profil
- **FAQ** : 7 questions avec emoji, réponses détaillées, icône colorée quand ouverte
- Bloc "Prenez votre décision en toute clarté" supprimé
- `CtaFinal` supprimé

### `src/pages/TarifsPage.tsx`
- Titre "sans surprise." avec underline animé
- Prix centrés dans chaque carte (nom plan, prix, TTC)
- Tableau desktop + accordéon mobile (< 640px)

### `src/pages/MethodePage.tsx`
- Hero centré avec underline animé
- Sidebar lisible
- Section analyses simplifiée sans prix
- Tableau mobile accordéon
- Responsive complet

### `src/pages/ExemplePage.tsx`
- Rapport complet 5 onglets : Synthèse, Finances, Travaux, Procédures, Documents
- Jauge SVG animée
- Données réalistes

### `src/pages/RapportPage.tsx`
- Score /20 uniformisé partout

### `src/pages/ContactPage.tsx`
- Badge "Contact" supprimé du hero
- Formulaire stocke dans Supabase `contact_messages` (plus de mock)
- État `sending` avec "Envoi..." sur le bouton
- Import `supabase` ajouté

### `src/pages/DashboardPage.tsx`
- **Bouton "Espace Admin"** dans la Topbar (visible uniquement si `role = 'admin'`)
- **Hook `useCredits()`** : lit les vrais crédits depuis `profiles.credits_document` et `profiles.credits_complete`
- **`deductCredit()`** : déduit 1 crédit au lancement d'une analyse
- `MOCK_CREDITS` supprimé partout (Sidebar, HomeView, NouvelleAnalyse, Tarifs)
- Import `useCallback` ajouté
- **Section Compare** : 3 états (0 / 1 / 2+ analyses), sélection 2 ou 3 biens, colonnes adaptatives (1fr 1fr ou 1fr 1fr 1fr), jauge SVG animée par bien, tableau 5 catégories côte à côte, points clés par bien, verdict Verimo avec explication détaillée

### `src/pages/AdminPage.tsx` *(nouveau fichier)*
**Sécurité :** vérification `role = 'admin'` au chargement → redirect `/dashboard` si non admin. Seul `hello@verimo.fr` a le rôle admin. Tout nouveau compte = `role = 'user'` par défaut.

**7 onglets :**
1. **Vue d'ensemble** — KPIs animés (users, analyses, messages non lus, CA), actions rapides cliquables navigant vers les onglets, bloc CA
2. **Statistiques** — filtres période (7j / 30j / 3m / 12m / personnalisé), KPIs, graphique CA barres animées semaine/semaine, répartition par plan avec revenus et barres animées
3. **Utilisateurs** — onglets Tous / ✓ Vérifiés / ⚠ Non vérifiés, vérifiés triés en premier, badges (✓ vérifié / ⚠ non vérifié / admin / suspendu / Google), recherche, export CSV, créer compte via Edge Function, inviter par email via Edge Function, détail utilisateur (fiche complète + toutes ses analyses), modifier crédits (synchro Supabase), reset mot de passe, suspendre/réactiver, supprimer — tout avec confirmation popup
4. **Analyses** — liste avec recherche par adresse, filtre statut (toutes / complétées / en cours / erreurs), export CSV
5. **Messages** — vue liste + détail côte à côte, badge non lus dans sidebar, marquer tout lu en 1 clic, répondre par mailto, supprimer avec confirmation
6. **Codes promo** — créer (type : crédits / % / €, restrictions : expiration / max uses / email spécifique), générateur de code automatique, copier en 1 clic, activer/désactiver, supprimer
7. **Historique** — log de toutes les actions admin avec icônes colorées (100 dernières)

**Toast** de confirmation après chaque action.
**Modal de confirmation** sur toutes les actions critiques.
**`callEdgeFunction()`** pour créer/inviter/supprimer des comptes via Edge Function Supabase.

---

## SUPABASE — État complet

### Compte admin
- **Email :** `hello@verimo.fr`
- **ID :** `67b0ce02-b247-4d49-aadf-76dcb29b630a`
- **Role :** `admin` ✅
- **Accès :** `verimo.fr/admin` après connexion avec hello@verimo.fr

### Tables créées / modifiées

#### `profiles` — colonnes
```
id, email, nom, prenom, email_verified, can_delete_account, created_at, full_name,
role (text DEFAULT 'user'),
credits_document (integer DEFAULT 0),
credits_complete (integer DEFAULT 0),
suspended (boolean DEFAULT false)
```

#### `contact_messages`
```
id, name, email, subject, message, created_at, read (boolean DEFAULT false)
```

#### `promo_codes`
```
id, code (UNIQUE), type (credits|percent|fixed), value, credit_type (document|complete|both),
expires_at, max_uses, uses_count (DEFAULT 0), restricted_email, active (DEFAULT true), created_at
```

#### `promo_uses`
```
id, code_id (FK promo_codes), user_id (FK auth.users), used_at
UNIQUE(code_id, user_id) — usage unique par compte
```

#### `admin_logs`
```
id, admin_email, action, target, created_at
```

### RLS configurée

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

-- contact_messages : admin peut tout faire, public peut insérer
-- promo_codes : admin peut tout faire, utilisateurs peuvent lire les actifs
-- promo_uses : admin peut tout faire, utilisateurs gèrent les leurs
-- admin_logs : admin seulement
```

### Trigger `handle_new_user`
Crée automatiquement une ligne dans `profiles` à chaque nouvelle inscription avec `role = 'user'`.
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
- **Actions :** `create` (email + password + full_name), `invite` (email), `delete` (user_id)
- Utilise `SUPABASE_SERVICE_ROLE_KEY` côté serveur — impossible d'appeler ces APIs depuis le frontend
- Appelée depuis `AdminPage.tsx` via `callEdgeFunction()`

### SQL de synchronisation exécuté
```sql
-- Synchroniser les emails manquants dans profiles
UPDATE profiles SET email = auth.users.email
FROM auth.users WHERE profiles.id = auth.users.id
AND (profiles.email IS NULL OR profiles.email = '');

-- Synchroniser email_verified
UPDATE profiles SET email_verified = true
FROM auth.users WHERE profiles.id = auth.users.id
AND auth.users.email_confirmed_at IS NOT NULL;

-- Rafraîchir le cache schéma
NOTIFY pgrst, 'reload schema';
```

---

## LOGIQUE CRÉDITS

### Flux complet
1. Admin donne des crédits depuis `/admin` → `profiles.credits_document` ou `credits_complete` mis à jour
2. Client voit ses crédits en temps réel dans son dashboard (hook `useCredits()`)
3. Client lance une analyse → `deductCredit()` vérifie et déduit 1 crédit → analyse lancée
4. Si 0 crédit → message d'erreur "Vous n'avez plus de crédit disponible"

### Types de crédits
- `credits_document` → Analyse Simple (4,90€) — 1 document, pas de score /20
- `credits_complete` → Analyse Complète (19,90€) — docs illimités, score /20

---

## PENDING / À FAIRE

1. **[PRIORITAIRE] Brancher Stripe** → paiement automatique + webhook Supabase pour ajout crédits
2. **[PRIORITAIRE] Valider codes promo côté client** → dans le flow d'analyse/achat
3. **[À TESTER] Emails d'invitation** → vérifier config SMTP Mailjet dans Supabase → Project Settings → Auth → SMTP
4. **[À TESTER] Création compte depuis admin** → vérifier que le trigger crée bien le profil dans `profiles`
5. **[OPTIONNEL] Bannière utilisateurs** → envoyer un message à tous les utilisateurs depuis l'admin
6. **[OPTIONNEL] Graphique inscriptions** → courbe des nouveaux inscrits semaine/semaine dans les stats
