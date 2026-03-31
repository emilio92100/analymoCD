# ANALYMO — Contexte Projet
> **Colle ce fichier en début de conversation Claude pour reprendre le contexte.**
> Dernière mise à jour : 31 mars 2026

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

**Cible :** Acheteurs particuliers (principal), notaires, agents, syndics, marchands de biens.

**Logique crédits / prix :**
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de score /10
- 19,90€ → 1 crédit analyse complète
- 29,90€ → 2 crédits analyse complète (Pack 2 biens — comparaison côte à côte incluse)
- 39,90€ → 3 crédits analyse complète (Pack 3 biens — comparaison + classement final inclus)
- Les crédits n'expirent jamais et s'accumulent
- **MOCK_CREDITS = { document: 0, complete: 0 }** — tous les nouveaux comptes arrivent à 0

**Fonctionnement :**
1. Client arrive → voit son analyse offerte gratuite (aperçu)
2. Upload ses documents → prompt allégé → aperçu du rapport (sans score, sans détail)
3. Paie → re-uploade ses documents (RGPD : docs supprimés après chaque traitement)
4. Rapport complet généré via API Claude
5. Rapport sauvegardé dans Supabase, visible dans le dashboard
6. Rapport téléchargeable en PDF
7. Option D : pendant 7 jours après génération, peut ajouter des docs gratuitement (régénération)
8. Comparaison disponible uniquement pour analyses complètes (pack2 / pack3)

**Règles absolues :**
- Ne jamais écrire "IA" → "notre outil", "notre moteur", "traitement"
- Prix correct partout : **4,90€** (jamais 4,99€)
- Analyse simple → jamais de score /10
- "Traitement en cours" (jamais "Analyse en cours") dans les écrans de chargement

---

## 🛠 Stack technique
| Technologie | Usage |
|---|---|
| React 19 + Vite + TypeScript | Frontend |
| Tailwind CSS v3 | Styles |
| Framer Motion | Animations |
| React Router DOM v7 | Navigation |
| Supabase | Auth + Base de données |
| Claude API (claude-sonnet-4-20250514) | Analyse des documents |
| Stripe | Paiements — **pas encore configuré** |
| Vercel | Déploiement auto depuis GitHub |
| Mailjet | SMTP emails (SPF ✅ + DKIM ✅ + DMARC ✅) |

**Police :** DM Sans
**Couleurs :** `#2a7d9c` (teal) / `#0f2d3d` (navy) / `#f0a500` (gold)
**Fond général :** `#f4f7f9` / **Fond dashboard :** `#f5f9fb`
**Style :** moderne SaaS, cartes blanches, fond bleuté, pas de dark mode

---

## 📁 Structure du projet
```
src/
├── App.tsx                  ← routing + SessionManager 1h + ScrollToTop + route /start ✅
├── lib/
│   ├── supabase.ts          ← client Supabase
│   ├── analyses.ts          ← CRUD + aperçu + localStorage sync ✅ MAJ 31/03
│   └── prompts.ts           ← 5 prompts Claude ✅ MAJ 31/03
├── pages/
│   ├── HomePage.tsx         ← CTAs → /start (redirection intelligente) ✅
│   ├── StartPage.tsx        ← /start : connecté→/dashboard/nouvelle-analyse, sinon→/inscription ✅ NOUVEAU
│   ├── TarifsPage.tsx       ← tarifs publique, pack2/pack3 enrichis ✅
│   ├── ExemplePage.tsx      ← 4,90€ corrigé (était 4,99€) ✅
│   ├── ContactPage.tsx      ← formulaire contact
│   ├── LoginPage.tsx        ← login + sync localStorage (nom + free_preview_used) ✅
│   ├── SignupPage.tsx       ← inscription email vérifié
│   ├── DashboardPage.tsx    ← dashboard REFAIT 31/03 ✅
│   ├── RapportPage.tsx      ← rapport + docs analysés + bannière 7j ✅
│   ├── AuthCallbackPage.tsx ← callback iOS Safari (4 cas) + sync localStorage ✅
│   ├── ForgotPasswordPage.tsx
│   └── ResetPasswordPage.tsx
├── types/index.ts           ← types + PRICING_PLANS (price: 4.90 ✅)
```

---

## 🗺 Routes (App.tsx)
```
/start                      → StartPage ← NOUVEAU
/                           → HomePage
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
/dashboard/rapport?id=XXX   → RapportPage
```

---

## 🎁 Système aperçu gratuit (Option 3 — décidé 31/03)

### Principe
- 1 aperçu gratuit par compte (inscrits + email vérifié)
- Stocké dans `profiles.free_preview_used` + `localStorage.analymo_free_preview_used`
- Sync au login (LoginPage + AuthCallbackPage) → zéro flash UI
- Badge disparaît définitivement après utilisation (pas de badge grisé)

### Flow complet
1. Badge "1 analyse offerte 🎁" visible (navy, animation pulseGlow)
2. Upload → prompt allégé → docs supprimés immédiatement (RGPD)
3. Aperçu : titre + recommandation courte + 2-3 vigilances + score grisé (complète seulement)
4. Sauvegardé avec badge "Aperçu gratuit" dans Mes analyses
5. Paiement → re-upload → message RGPD sympa → rapport complet remplace aperçu

### Comportement badges/prix sur NouvelleAnalyse
- Offre dispo → badge "1 analyse offerte" visible, **prix cachés** sur les cartes
- Offre utilisée → badge disparaît, prix réapparaissent, crédits affichés

### Message RGPD au re-upload (après paiement)
> "Bonne nouvelle ! Conformément au RGPD, vos documents ont été supprimés 🔒. Re-uploadez vos documents pour générer votre rapport complet... et profitez-en pour ajouter ceux que vous aviez oubliés ! 😉"

### Message post-paiement si offre encore dispo (à implémenter avec Stripe)
Bannière une seule fois sur dashboard (pas popup) :
> "Petite info de notre côté 👋 Votre analyse découverte non utilisée a été remplacée par votre achat. Après tout, pourquoi regarder par le trou de la serrure quand on peut ouvrir la porte en grand ? 🚪 Maintenant vous avez toutes les clés en main 🔑 Bonne analyse avec Analymo !"
- Flag localStorage : `show_upgrade_banner`
- Déclenché par webhook Stripe si `free_preview_used = false` au moment du paiement

### Option D — Compléter le dossier (7 jours)
- Bouton "Compléter mon dossier" dans RapportPage pendant 7 jours après génération
- Compteur couleur urgence (orange J-2, rouge J-1), grisé après expiration
- Gratuit — Claude reçoit nouveaux docs + JSON rapport existant → régénération
- Stocké dans `analyses.regeneration_deadline`

---

## 🤖 Prompts (lib/prompts.ts)

| Prompt | Usage | Score |
|---|---|---|
| PROMPT_ANALYSE_COMPLETE | 19,90€+ payant complet | ✅ Oui (base 10 - pénalités + bonus) |
| PROMPT_ANALYSE_SIMPLE | 4,90€ payant simple | ❌ Non |
| PROMPT_APERCU_COMPLET | Aperçu gratuit complète | ❌ Non |
| PROMPT_APERCU_SIMPLE | Aperçu gratuit simple | ❌ Non |
| PROMPT_REGENERATION | Option D ajout docs | ✅ Recalcul |

**Calcul note /10 (actuel — à revoir) :**
- Départ : 10/10
- Pénalités : Copropriété (-1 à -3), Procédures (-2 à -4), Finances (-1 à -2), Diagnostics (DPE E:-0,5 / F:-1,5 / G:-2 à -3 / Amiante:-1 à -2), Juridique (-0,5 à -1,5)
- Bonus : Travaux réalisés, bonne gestion, diagnostics rassurants, charges maîtrisées (+0,5 à +1 chacun)
- Arrondi au 0,5 près
- ⚠️ Méthode à revoir lors d'une prochaine session

---

## 🗄 Supabase

**Project ID :** `veszrayromldfgetqaxb`
**URL :** `https://veszrayromldfgetqaxb.supabase.co`

### Schéma (MAJ 31/03 — colonnes ajoutées via SQL Editor)
```sql
profiles:
  id, full_name, created_at
  free_preview_used BOOLEAN DEFAULT FALSE ← AJOUTÉ 31/03

analyses:
  id, user_id, type, status, title, address
  result JSONB               -- rapport complet
  apercu JSONB               -- aperçu gratuit ← AJOUTÉ 31/03
  is_preview BOOLEAN         -- true = aperçu non payé ← AJOUTÉ 31/03
  paid BOOLEAN               -- true = paiement confirmé ← AJOUTÉ 31/03
  document_names TEXT[]      -- noms fichiers conservés ← AJOUTÉ 31/03
  regeneration_deadline      -- date limite 7j ← AJOUTÉ 31/03
  stripe_payment_id, document_urls, created_at
```

### Auth configuré
- Email/password ✅ + Google OAuth ✅
- SMTP Mailjet : notification@analymo.fr
- Redirect URLs : appdemo.analymo.fr + analymo.fr
- AuthCallbackPage gère 4 cas (hash token, code iOS Safari, session existante, compte activé sans session)

### localStorage (côté client)
- `analymo_free_preview_used` → sync Supabase au login, mis à jour après aperçu
- `analymo_user_name` → prénom pour affichage instantané (zéro flash)
- `analymo_user_email` → email
- `analymo_login_time` → session 1h (SessionManager App.tsx)

---

## 📧 Mailjet (état 31/03)
- SPF ✅ / DKIM ✅ / DMARC ✅ (ajouté 30/03)
- CNAME `bnc3.analymo.fr → bnc3.mailjet.com` ✅ (corrigé : était DNAME → remplacé par CNAME)
- Ticket Mailjet Custom Return-Path : **en attente réponse support**
- Objectif : "envoyé par" affichera `bnc3.analymo.fr` au lieu de `bnc3.mailjet.com`

---

## 📊 Dashboard (DashboardPage.tsx) — état 31/03

### Topbar
- Titre page + cloche uniquement
- **Crédits supprimés de la topbar** (restent dans sidebar)

### Sidebar
- Logo + bouton "Nouvelle analyse" navy
- Mini-widget crédits : Document / Complète + lien "Acheter"
- Navigation + infos utilisateur + déconnexion

### HomeView — layout 2 colonnes
**Colonne gauche (flex) :**
- Badge "1 analyse offerte 🎁" navy + pulseGlow (si non utilisé)
- Stats 3 blocs (si analyses existantes) : totales / dernière / crédits
- Analyses récentes (vraies données Supabase)
- Guide "Comment ça marche" (card navy + timeline 4 étapes numérotées)
- Conseils & astuces (4 tips avec bordure colorée à gauche)

**Colonne droite (320px) :**
- "Conseil important Analymo" (card amber)
- Glossaire immobilier (accordéon 6 termes : PV AG, DPE, Fonds travaux, Charges copro, Règlement copro, Appel de charges)

**Pleine largeur sous le grid :**
- "Découvrez comment nous calculons la note /10" — onglets : Bonus (défaut) / Pénalités / Échelle de lecture

### NouvelleAnalyse
- Badge offerte grand + visible (si non utilisé), prix cachés
- 2 cartes : "Analyse d'un seul document" / "Analyse complète d'un logement"
  - Textes enrichis avec exemples de documents
  - Prix réapparaissent + crédits affichés après utilisation offre
- Packs 2 et 3 biens **supprimés** de cette page (disponibles dans /tarifs)
- Step aperçu : titre + vigilances + score grisé + sections grisées + CTA débloquer

### Mes analyses
- Vraies données Supabase
- Badge "Aperçu gratuit" si `is_preview = true`
- Analyse simple → nom fichier (PAS de score)
- Analyse complète → adresse + score /10 coloré

### Mon compte
- Modification nom → met à jour auth metadata ET table profiles ✅
- Section changement mot de passe (validation longueur + correspondance)
- Historique achats (mock — à remplacer par Stripe)
- Zone de danger avec confirmation avant déconnexion (suppression réelle pas encore implémentée)

### Support
- FAQ accordéon 4 questions
- Formulaire contact (envoi simulé)

### RapportPage
- Section "Documents analysés" avec noms fichiers + mention RGPD
- Bannière 7 jours avec compteur (orange J-2, rouge J-1, grisé expiré)

---

## 💰 TarifsPage.tsx — état 31/03
- Pack 2 biens : "Vous hésitez entre deux biens ? Uploadez les documents des deux et laissez Analymo les comparer côte à côte"
- Pack 3 biens : "Comparez-les tous en un seul achat... classement final pour vous aider à faire le meilleur choix" + badge "Meilleure valeur"
- Définit ses propres `plans` localement (n'importe plus PRICING_PLANS de types/index.ts)
- Prix corrects : 4,90 / 19,90 / 29,90 / 39,90

---

## ⚠️ Points importants à retenir

1. **Stripe PAS branché** → MOCK_CREDITS = {0,0} partout
2. **Aperçu gratuit = seule vraie fonctionnalité opérationnelle sans Stripe**
3. **API Claude côté client** → appel direct navigateur → à sécuriser (edge function Vercel)
4. **vercel.json** → rewrites SPA → NE PAS supprimer
5. **StartPage.tsx** → nouveau fichier créé 31/03 → NE PAS supprimer
6. **HowItWorksSection** dans HomePage → refs mobile/desktop séparés → NE PAS fusionner (sinon blanc sur mobile)
7. **TarifsPage** définit ses propres plans localement → ne pas toucher à PRICING_PLANS pour elle
8. **Calcul note /10** → méthode actuelle base 10 - pénalités + bonus → À REVOIR
9. **Suppression compte** → déconnecte + redirige vers / mais ne supprime PAS réellement dans Supabase
10. **Historique achats** dans Mon compte = mock → à remplacer par vraies données Stripe
11. **"Traitement en cours"** → jamais "Analyse en cours" dans les écrans de chargement
12. **Mise à jour profil** → met à jour auth metadata ET table profiles simultanément

---

## 🔜 Prochaines étapes

### 🔴 Stripe (priorité 1)
- [ ] Connecter Stripe (4 produits : 4,90 / 19,90 / 29,90 / 39,90)
- [ ] Webhook → crédite compte + marque free_preview_used si encore dispo
- [ ] Bannière post-paiement (message serrure/clés — voir section aperçu gratuit)
- [ ] Remplacer MOCK_CREDITS par vraies données Supabase
- [ ] Remplacer historique achats mock par vraies données Stripe

### 🟠 Technique
- [ ] Sécuriser appel Claude (edge function Vercel)
- [ ] Email Mailjet quand rapport prêt
- [ ] Améliorer PDF (html2pdf ou Puppeteer)
- [ ] Implémenter régénération Option D (appel Claude avec rapport existant + nouveaux docs)
- [ ] Implémenter suppression réelle compte Supabase (actuellement juste déconnexion)
- [ ] **Revoir méthode calcul note /10** (méthode actuelle à affiner)

### 🟡 Mailjet
- [ ] Attendre réponse ticket Custom Return-Path (CNAME déjà créé ✅)

### ⚪ Plus tard
- [ ] Google OAuth branding (publier app Google Cloud)
- [ ] Page admin (voir tous les clients/analyses)
- [ ] Vrais témoignages utilisateurs pour HomePage
