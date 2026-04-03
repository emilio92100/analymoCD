# VERIMO — Contexte Projet
> **Colle ce fichier en début de conversation Claude pour reprendre le contexte.**
> Dernière mise à jour : 3 avril 2026

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
**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges). Rapport clair avec note /20, risques, recommandations en 30 secondes*.

**Slogan :** *Vos documents décryptés, votre décision éclairée.*

**Cible :** Acheteurs particuliers (principal), notaires, agents, syndics, marchands de biens.

**Logique crédits / prix :**
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de note /20
- 19,90€ → 1 crédit analyse complète
- 29,90€ → 2 crédits analyse complète (Pack 2 biens — comparaison côte à côte incluse)
- 39,90€ → 3 crédits analyse complète (Pack 3 biens — comparaison + classement final inclus)
- Les crédits n'expirent jamais et s'accumulent
- **MOCK_CREDITS = { document: 0, complete: 0 }** — tous les nouveaux comptes arrivent à 0

**Fonctionnement :**
1. Client arrive → voit son analyse offerte gratuite (aperçu)
2. Upload ses documents → prompt allégé → aperçu du rapport (sans note, sans détail)
3. Avant upload → question profil : 🏠 Résidence principale ou 💰 Investissement locatif
4. Paie → re-uploade ses documents (RGPD : docs supprimés après chaque traitement)
5. Rapport complet généré via API
6. Rapport sauvegardé dans Supabase, visible dans le dashboard
7. Rapport téléchargeable en PDF
8. Option D : pendant 7 jours après génération, peut ajouter des docs gratuitement (régénération)
9. Comparaison disponible uniquement pour analyses complètes (pack2 / pack3)

**Règles absolues :**
- Ne jamais écrire "IA", "Claude", "Anthropic" → "notre outil", "notre moteur", "traitement"
- Prix correct partout : **4,90€** (jamais 4,99€)
- Analyse simple → jamais de note /20
- "Traitement en cours" (jamais "Analyse en cours") dans les écrans de chargement
- Ne jamais donner de directive → informer sans décider
- Toujours orienter vers vendeur ou agent immobilier (jamais le syndic pour un non-propriétaire)

---

## 🛠 Stack technique
| Technologie | Usage |
|---|---|
| React 19 + Vite + TypeScript | Frontend |
| Tailwind CSS v3 | Styles |
| Framer Motion | Animations |
| React Router DOM v7 | Navigation |
| Supabase | Auth + Base de données |
| API IA (claude-sonnet-4-20250514) | Analyse des documents — abstractable vers Gemini |
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
│   ├── analyses.ts          ← CRUD + aperçu + localStorage sync ✅ MAJ 3/04
│   └── prompts.ts           ← 5 prompts ✅ MAJ 3/04 (note /20, 3 grilles)
├── pages/
│   ├── HomePage.tsx         ← CTAs → /start (redirection intelligente) ✅
│   ├── StartPage.tsx        ← /start : connecté→/dashboard/nouvelle-analyse, sinon→/inscription ✅
│   ├── TarifsPage.tsx       ← tarifs publique, pack2/pack3 enrichis ✅
│   ├── ExemplePage.tsx      ← 4,90€ corrigé ✅
│   ├── ContactPage.tsx      ← formulaire contact
│   ├── LoginPage.tsx        ← login + sync localStorage ✅
│   ├── SignupPage.tsx        ← inscription email vérifié
│   ├── DashboardPage.tsx    ← dashboard ✅ MAJ 3/04 (note /20)
│   ├── RapportPage.tsx      ← rapport ✅ MAJ 3/04 (refonte complète /20)
│   ├── AuthCallbackPage.tsx ← callback iOS Safari (4 cas) + sync localStorage ✅
│   ├── ForgotPasswordPage.tsx
│   └── ResetPasswordPage.tsx
├── types/index.ts           ← types + PRICING_PLANS ✅ MAJ 3/04
```

---

## 🗺 Routes (App.tsx)
```
/start                      → StartPage
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

## 🎁 Système aperçu gratuit

### Principe
- 1 aperçu gratuit par compte (inscrits + email vérifié)
- Stocké dans `profiles.free_preview_used` + `localStorage.verimo_free_preview_used`
- Sync au login (LoginPage + AuthCallbackPage) → zéro flash UI
- Badge disparaît définitivement après utilisation (pas de badge grisé)

### Flow complet
1. Badge "1 analyse offerte 🎁" visible (navy, animation pulseGlow)
2. Upload → prompt allégé → docs supprimés immédiatement (RGPD)
3. Aperçu : titre + recommandation courte + 2-3 vigilances (pas de note)
4. Sauvegardé avec badge "Aperçu gratuit" dans Mes analyses
5. Paiement → re-upload → message RGPD sympa → rapport complet remplace aperçu

### Message RGPD au re-upload (après paiement)
> "Bonne nouvelle ! Conformément au RGPD, vos documents ont été supprimés 🔒. Re-uploadez vos documents pour générer votre rapport complet... et profitez-en pour ajouter ceux que vous aviez oubliés ! 😉"

### Option D — Compléter le dossier (7 jours)
- Bouton "Compléter mon dossier" dans RapportPage pendant 7 jours après génération
- Compteur couleur urgence (orange J-2, rouge J-1), grisé après expiration
- Gratuit — moteur reçoit nouveaux docs + JSON rapport existant → régénération
- Stocké dans `analyses.regeneration_deadline`
- Message CTA appel de charges : "Pour affiner votre estimation, ajoutez votre dernier appel de charges dans les 7 jours suivant ce rapport."

---

## 🤖 Prompts (lib/prompts.ts) — MAJ 3/04

| Prompt | Usage | Note |
|---|---|---|
| PROMPT_ANALYSE_COMPLETE | 19,90€+ payant complet | ✅ /20 |
| PROMPT_ANALYSE_SIMPLE | 4,90€ payant simple | ❌ Non |
| PROMPT_APERCU_COMPLET | Aperçu gratuit complète | ❌ Non |
| PROMPT_APERCU_SIMPLE | Aperçu gratuit simple | ❌ Non |
| PROMPT_REGENERATION | Option D ajout docs | ✅ Recalcul |

### Système de notation /20

**ÉTAPE 1 — Détection automatique du type de bien :**
- PV d'AG présents → Appartement en copropriété
- Mentions maison/terrain/fosse septique → Maison individuelle
- Les deux → Maison en copropriété
- Impossible → Type indéterminé

**ÉTAPE 2 — Profil d'achat (demandé avant upload) :**
- `rp` = Résidence principale
- `invest` = Investissement locatif
- ⚠️ Actuellement mis en dur `'rp'` dans DashboardPage lignes 831 et 887 — À BRANCHER sur vraie question UX

**GRILLE APPARTEMENT EN COPROPRIÉTÉ (20pts) :**
- Travaux (5pts) : évoqués non votés -2 à -3 / votés +0,5 à +1 bonus
- Procédures juridiques (4pts) : vs syndic -2 à -4 / vs copropriétaire -0,5 à -1
- Finances copropriété (4pts) : écart budget >30% → -3 / fonds travaux nul → -2 / conforme → +0,5 / au-dessus → +1
- Diagnostics privatifs (4pts) : DPE F(RP) -2 / DPE G(RP) -3 / DPE F(invest) -4 / DPE G(invest) -6
- Diagnostics communs (3pts) : amiante/termites selon état

**GRILLE MAISON INDIVIDUELLE (20pts) :**
- Diagnostics (6pts) : mêmes règles DPE + assainissement non conforme -3
- Assainissement (4pts)
- Travaux et conformité (4pts) : message préventif systématique sur permis/déclarations
- Terrain et dépendances (3pts)

**NIVEAUX DE NOTE :**
- 0-6 🔴 Risqué
- 7-9 🟠 Vigilance requise
- 10-13 🟡 Correct avec réserves
- 14-16 🟢 Bon profil
- 17-20 💚 Excellent

**RÈGLES CLÉS :**
- Travaux votés → toujours bonus (vendeur supporte via notaire)
- Travaux évoqués non votés → pénalité + recommander de vérifier avec vendeur/agent immo
- Documents manquants → signaler sans pénaliser
- Idées de négociation uniquement si note entre 0 et 13
- Calcul quote-part travaux via tantièmes si disponibles
- Arrondi au 0,5 près
- Jamais mentionner "IA", "Claude", "Anthropic"

---

## 🗄 Supabase

**Project ID :** `veszrayromldfgetqaxb`
**URL :** `https://veszrayromldfgetqaxb.supabase.co`

### Schéma complet (MAJ 3/04)
```sql
profiles:
  id, full_name, created_at
  email, nom, prenom, email_verified
  can_delete_account
  free_preview_used BOOLEAN DEFAULT FALSE

analyses:
  id, user_id, type, status, title, address
  score NUMERIC                  -- note /20 ← AJOUTÉ 3/04
  score_couleur TEXT             -- rouge/orange/jaune/vert/vert_fonce ← AJOUTÉ 3/04
  profil TEXT                    -- rp | invest ← AJOUTÉ 3/04
  type_bien TEXT                 -- appartement | maison | maison_copro ← AJOUTÉ 3/04
  result JSONB                   -- rapport complet
  apercu JSONB                   -- aperçu gratuit
  is_preview BOOLEAN             -- true = aperçu non payé
  paid BOOLEAN                   -- true = paiement confirmé
  document_names TEXT[]          -- noms fichiers conservés
  regeneration_deadline          -- date limite 7j
  avis_verimo TEXT
  stripe_payment_id, document_urls, created_at
```

### Auth configuré ✅
- Email/password ✅ + Google OAuth ✅
- SMTP Mailjet : notification@verimo.fr ✅
- Redirect URLs : verimo.fr ✅
- AuthCallbackPage gère 4 cas (hash token, code iOS Safari, session existante, compte activé sans session)

### localStorage (côté client)
- `verimo_free_preview_used` → sync Supabase au login
- `verimo_user_name` → prénom pour affichage instantané
- `verimo_user_email` → email
- `verimo_login_time` → session 1h (SessionManager App.tsx)

---

## 📧 Mailjet / DNS (état 3/04) ✅ TOUT CONFIGURÉ
- SPF ✅ / DKIM ✅ / DMARC ✅ sur verimo.fr
- Domaine verimo.fr validé dans Mailjet ✅
- Adresses notification@verimo.fr et hello@verimo.fr ajoutées ✅
- CNAME bnc3 → bnc3.mailjet.com ajouté dans OVH ✅
- Supabase SMTP → notification@verimo.fr ✅
- Supabase Redirect URLs → verimo.fr ✅
- Google OAuth → URLs verimo.fr ajoutées ✅
- Templates emails Supabase → tous mis à jour en Verimo ✅

---

## 🌐 Vercel / Domaine (état 3/04) ✅
- verimo.fr → connecté à Vercel ✅
- www.verimo.fr → Valid Configuration ✅
- DNS OVH configuré (A + CNAME) ✅

---

## 📊 Dashboard (DashboardPage.tsx) — état 3/04

### Section "Comment on calcule la note"
- Note sur **20 points** (plus /10) ✅
- 5 niveaux : 0-6 / 7-9 / 10-13 / 14-16 / 17-20
- Pénalités et bonus mis à jour avec nouvelles règles

### RapportPage — état 3/04 (refonte complète)
- Note /20 avec jauge circulaire adaptée
- Badge type de bien (appartement/maison) + profil (RP/investissement)
- Bouton "Détail de la note" avec barres par catégorie
- 5 onglets : Synthèse / Travaux / Finances / Procédures / Documents
- Onglet Documents : explication de chaque document détecté
- Travaux votés → message rassurant notaire
- Travaux évoqués non votés → message d'alerte
- Pistes de négociation si note < 14
- CTA appel de charges dans les 7 jours
- Documents manquants signalés

---

## ⚠️ Points importants à retenir

1. **Stripe PAS branché** → MOCK_CREDITS = {0,0} partout
2. **Aperçu gratuit = seule vraie fonctionnalité opérationnelle sans Stripe**
3. **API IA côté client** → appel direct navigateur → à sécuriser (edge function Vercel)
4. **vercel.json** → rewrites SPA → NE PAS supprimer
5. **StartPage.tsx** → NE PAS supprimer
6. **HowItWorksSection** dans HomePage → refs mobile/desktop séparés → NE PAS fusionner
7. **TarifsPage** définit ses propres plans localement → ne pas toucher à PRICING_PLANS pour elle
8. **Profil 'rp' mis en dur** → DashboardPage lignes 831 et 887 → À BRANCHER sur vraie question UX
9. **Suppression compte** → déconnecte + redirige vers / mais ne supprime PAS réellement dans Supabase
10. **Historique achats** dans Mon compte = mock → à remplacer par vraies données Stripe
11. **"Traitement en cours"** → jamais "Analyse en cours"
12. **Mise à jour profil** → met à jour auth metadata ET table profiles simultanément
13. **Abstraction IA** → possible de switcher Claude → Gemini en changeant 1 variable Vercel (lib/ai-provider.js à créer)
14. **Nom repo GitHub** → s'appelle encore `analymoCD` (cosmétique, n'affecte pas le fonctionnement)

---

## 🔜 Prochaines étapes

### 🔴 Priorité 1 — Fonctionnel
- [ ] Ajouter `VITE_ANTHROPIC_API_KEY` dans Vercel → analyses fonctionnelles
- [ ] Brancher vraie question profil RP/Investissement dans NouvelleAnalyse (remplacer `'rp'` en dur lignes 831 et 887)
- [ ] Sécuriser appel IA (edge function Vercel) + abstraction ai-provider.js

### 🔴 Priorité 2 — Stripe
- [ ] Connecter Stripe (4 produits : 4,90 / 19,90 / 29,90 / 39,90)
- [ ] Webhook → crédite compte + marque free_preview_used si encore dispo
- [ ] Bannière post-paiement (message serrure/clés)
- [ ] Remplacer MOCK_CREDITS par vraies données Supabase
- [ ] Remplacer historique achats mock par vraies données Stripe

### 🟠 Technique
- [ ] Email Mailjet quand rapport prêt
- [ ] Améliorer PDF (html2pdf ou Puppeteer)
- [ ] Implémenter régénération Option D (appel IA avec rapport existant + nouveaux docs)
- [ ] Implémenter suppression réelle compte Supabase
- [ ] Adapter RapportPage pour maison individuelle (onglets différents si pas de copro)

### 🟡 UX à implémenter
- [ ] Question profil RP/Investissement avant upload dans NouvelleAnalyse
- [ ] Affichage score /20 coloré dans liste Mes analyses
- [ ] Mettre à jour supabase-schema.sql dans le repo avec toutes les colonnes
- [ ] Corriger bug `nom = NULL` dans SignupPage.tsx → les 6 utilisateurs existants ont leur nom vide dans Supabase, le prénom ne se sauvegarde pas à l'inscription

### 🟡 Stripe — messages à implémenter
Bannière post-paiement si aperçu gratuit encore dispo au moment du paiement (une seule fois sur dashboard, pas popup) :
> "Petite info de notre côté 👋 Votre analyse découverte non utilisée a été remplacée par votre achat. Après tout, pourquoi regarder par le trou de la serrure quand on peut ouvrir la porte en grand ? 🚪 Maintenant vous avez toutes les clés en main 🔑 Bonne analyse avec Verimo !"
- Flag localStorage : `show_upgrade_banner`
- Déclenché par webhook Stripe si `free_preview_used = false` au moment du paiement

### ⚪ Plus tard
- [ ] Google OAuth branding (publier app Google Cloud)
- [ ] Page admin (voir tous les clients/analyses)
- [ ] Vrais témoignages utilisateurs pour HomePage
- [ ] Renommer repo GitHub de `analymoCD` en `verimoCD`
