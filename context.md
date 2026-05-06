# VERIMO — Contexte projet complet — 6 mai 2026 (après sessions 1 à 28)

> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## Profil développeur
- Débutant en développement
- Modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- Pour créer un nouveau fichier : GitHub → dossier cible → "Add file" → "Create new file"
- Vercel redéploie automatiquement après chaque push GitHub
- Edge Functions Supabase : modifiées aussi directement dans le dashboard Supabase (en plus de GitHub)
- Claude peut cloner le repo : `https://github.com/emilio92100/analymoCD.git`
- Claude doit **toujours re-cloner** avant de modifier : `git clone https://github.com/emilio92100/analymoCD.git`
- Claude livre les fichiers **complets** via `present_files` depuis `/mnt/user-data/outputs/`
- L'utilisateur push manuellement sur GitHub
- **Pour chaque fichier modifié, Claude doit le générer à nouveau dans sa totalité** — l'utilisateur remplace le fichier entier sur GitHub (pas de modification ligne par ligne)
- **Ne jamais coder sans accord préalable** — toujours échanger et valider avant de toucher au code
- **Réponses courtes et concises avec Alex** — il préfère aller à l'essentiel, pas de pavés explicatifs sauf si question technique précise.
- **Ne jamais mentionner Tonton Immo ou Emilio Immo sur Verimo** — focus produit strict
- **Mot "IA" / "AI" banni** des pages publiques Verimo — utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte"

---

## Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière, modificatifs RCP, fiche synthétique...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour **appartements et maisons**.

**Slogan :** *Vos documents décryptés, votre décision éclairée.*

**H1 HomePage :** *Analysez vos documents immobiliers avant de signer.* (optimisé SEO — session 24)

**Cible :** Acheteurs particuliers (primo-accédants et résidence principale), et professionnels (agents immobiliers, investisseurs, marchands de bien, notaires).

### Tarification — Particuliers
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de score /20
- 19,90€ → 1 crédit analyse complète (jusqu'à 15 documents)
- 29,90€ → 2 crédits (Pack 2 biens)
- 39,90€ → 3 crédits (Pack 3 biens)
- Les crédits n'expirent jamais

### Tarification — Professionnels

**Abonnements mensuels HT :**
| Plan | Prix/mois HT | Complètes | Simples |
|------|-------------|-----------|---------|
| Découverte | 19,90€ | 1 | 3 |
| Starter | 49,90€ | 5 | 15 |
| Power | 89,90€ | 10 | 30 |

**Achats unitaires pro (réservés aux abonnés) :** Complète 9,90€ HT · Simple 2,90€ HT

### Stripe Price IDs
```
# Particuliers (PRODUCTION)
document : price_1TTtd1BesXB76oWECAGA9ywf
complete : price_1TTtd2BesXB76oWEsZ9LsLS9
pack2    : price_1TTtcxBesXB76oWETkokxLgB
pack3    : price_1TTtczBesXB76oWEloTMvEZF

# Pro (PRODUCTION)
DECOUVERTE 19,90€ → price_1TTtd1BesXB76oWEZuILxjwe
STARTER 49,90€    → price_1TTtczBesXB76oWEcKaNR2BW
POWER 89,90€      → price_1TTtcxBesXB76oWEPyVYZjCj
UNIT_COMPLETE 9,90€ → price_1TTtcyBesXB76oWEBF1TLHYz
UNIT_SIMPLE 2,90€   → price_1TTtd2BesXB76oWEVM0p27GS
```

---

## Stack technique
- **Frontend** : React + Vite + TypeScript + Tailwind
- **Backend** : Supabase Pro (auth + DB + Edge Functions Deno + Storage)
- **IA** : Claude Sonnet 4.6 via API Anthropic + Files API
- **Paiement** : Stripe (PRODUCTION — basculé le 6 mai 2026)
- **Email** : Mailjet (SMTP Supabase + API directe via edge functions)
  - `notification@verimo.fr` → mails transactionnels particuliers (Supabase Auth)
  - `pro@verimo.fr` → mails pro (invitations, rapports partagés via edge function)
  - Nom expéditeur rapports : "[Prénom] vous a partagé un rapport" (1) / "[Prénom] vous a partagé X rapports" (multi)
  - Sujet rapport : `🔍 Votre analyse immobilière est prête` (1) / `🔍 Vos X analyses immobilières sont prêtes` (multi)
- **Déploiement** : Vercel (frontend auto depuis GitHub) + Supabase (edge functions manuelles)
- **Repo** : `github.com/emilio92100/analymoCD`
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`
- **Domaine** : verimo.fr (OVH registrar)
- **Domaine pro** : pro.verimo.fr (CNAME → Vercel)
- **Logo blanc** : `/public/logo-blanc.png` (fond transparent, utilisé dans sidebars + emails)

---

## Routes
```
/                             → HomePage
/pro                          → ProPage
/contact-pro                  → ContactProPage
/tarifs                       → TarifsPage
/contact                      → ContactPage
/exemple                      → ExemplePage
/methode                      → MethodePage
/confidentialite              → ConfidentialitePage
/cgu                          → CGUPage
/mentions-legales             → MentionsLegalesPage
/guides                       → GuidesPage (listing catégorisé)
/guides/:slug                 → GuidesPage (article individuel — à implémenter)
/connexion                    → LoginPage
/inscription                  → SignupPage
/mot-de-passe-oublie          → ForgotPasswordPage
/auth/reset-password          → ResetPasswordPage
/start                        → StartPage
/setup-account?token=XXX      → SetupAccountPage (pro)
/admin                        → AdminPage
/dashboard                    → SmartDashboard (détecte role)
/dashboard/nouvelle-analyse   → NouvelleAnalyse
/dashboard/analyses           → MesAnalyses (particulier)
/dashboard/dossiers           → MesDossiersPro (pro)
/dashboard/dossier/:id        → DossierDetail (pro)
/dashboard/compare            → Compare
/dashboard/abonnement         → MonAbonnement (pro)
/dashboard/compte             → Compte ou ComptePro
/dashboard/tarifs             → Tarifs (particulier)
/dashboard/aide               → Aide
/dashboard/support            → Support
/rapport?id=XXX               → RapportPage
/rapport-partage?token=XXX    → RapportPartagePage
/rapport-comparaison?ids=X,Y  → RapportComparaisonPage
```

---

## 🗂️ Backlog

### 🔴 Priorité haute

- [ ] **Stripe TVA Pro** — Activer Stripe Tax dans le dashboard + pousser `pro-checkout-create` avec `automatic_tax: true` (fichier prêt mais non pushé, en attente config Stripe Tax)
- [ ] **Bouton "Modifier mon moyen de paiement"** — Ajouter dans DashboardProPage (MonAbonnement) un bouton qui appelle `billing_portal` mode de `pro-checkout-create` (mode déjà codé dans l'edge function, frontend à faire)
- [ ] **Guides — Rédaction des premiers articles** : commencer par les 5 articles les plus stratégiques SEO (analyser PV AG, DPE, 10 documents avant offre, charges copropriété, compromis de vente). Chaque article = une page `/guides/slug` avec useSEO dédié, contenu riche, encart 💡, CTA vers `/start`
- [ ] **Guides — Articles individuels** : créer le système de rendu d'article (route `/guides/:slug` → charge le contenu correspondant)
- [ ] **Veille réglementaire — prompt analyser-run** — DPE collectif copros <50 lots (jan 2026), PPT obligatoire (jan 2026)
- [ ] **Prompt caching API Anthropic** — ~90% d'économie possible
- [ ] **SEO URLs guides** — 40 URLs restent à soumettre dans Google Search Console (quota dépassé)

### 🟡 Priorité normale

- [ ] **Branding Stripe Checkout** — Logo + couleurs Verimo sur la page de paiement Stripe (dashboard Stripe → Adaptation à votre marque)
- [ ] **Domaine custom Stripe** — `pay.verimo.fr` au lieu de `checkout.stripe.com` (config DNS)
- [ ] **Reçus email Stripe** — Activer l'envoi automatique de reçus après paiement
- [ ] **Remboursement depuis l'admin** — Bouton dans le relevé des transactions qui appelle l'API Stripe refund
- [ ] **Page Pro animation hero** — Animation subtile dans le hero existant (pas encore validé)
- [ ] **Différence analyse simple vs complète** : mieux expliquer la distinction sur les pages Méthode et/ou Tarifs
- [ ] **SEO — Blog/contenu continu** : après les 5 premiers articles, continuer à publier 2-3 articles/semaine
- [ ] **SEO — Image OG** : créer une image Open Graph pour chaque page publique
- [ ] **Compare : redesign verdict** — split synthèse par bien, layout two-column forces/issues, tags "Bien 1"/"Bien 2"
- [ ] **Compare : remplacer edge function debug `comparer`** par version propre en production

---

## ✅ Session 28 — 6 mai 2026 — Stripe Production, Admin Support Inbox, Pages Légales, UX

### Résumé
Session majeure : passage Stripe en production (9 produits, webhooks, Price IDs, clés), redesign admin support (inbox split par utilisateur), pages légales mises à jour (Alexandre ROGELET, Claude Sonnet 4), protection CA (FK SET NULL), nombreuses améliorations UX (support, rapports pliables, fiche client).

### A. Stripe — Passage en production

**Basculement complet test → production :**
- 9 produits copiés en production (4 particuliers + 5 pro)
- Price IDs mis à jour dans : `Tarifs.tsx`, `pro-checkout-create`, `stripe-webhook`, `stripe-webhook-pro`
- `STRIPE_SECRET_KEY` → clé production dans Supabase Secrets
- 2 webhooks configurés :
  - `Verimo - Particuliers` → `stripe-webhook` (checkout.session.completed)
  - `Verimo - Pro` → `stripe-webhook-pro` (checkout.session.completed, invoice.paid, customer.subscription.updated, customer.subscription.deleted)
- `STRIPE_WEBHOOK_SECRET` et `STRIPE_WEBHOOK_SECRET_PRO` → mis à jour
- Données test nettoyées (payments, pro_unit_purchases, pro_subscriptions)
- `create-checkout-session` : aucun changement nécessaire (reçoit priceId du frontend)

**Protection CA historique :**
- FK `payments.user_id` → changée de `ON DELETE CASCADE` à `ON DELETE SET NULL`
- FK `pro_unit_purchases.user_id` → idem `ON DELETE SET NULL`
- Supprimer un client ne supprime plus ses paiements → CA intact

**En attente (prochaine session) :**
- `pro-checkout-create` avec `automatic_tax: { enabled: true }` → fichier prêt mais NON pushé (attendre activation Stripe Tax dans le dashboard)
- Mode `billing_portal` ajouté dans `pro-checkout-create` → prêt, frontend à faire

### B. Admin Support — Redesign Inbox Split par Utilisateur

**Remplacement total de `AdminSupportTab` dans AdminPage.tsx :**
- Vue inbox split : liste clients à gauche, conversation à droite
- **Regroupement par utilisateur** (pas par ticket) : Nathan apparaît UNE seule fois même avec 6 tickets
- Client qui envoie un message remonte en tête (tri `updated_at desc`)
- Preview du dernier message + dates relatives ("il y a 2min")
- Badge PRO/PART, point non-lu, compteur dans le header
- Filtres : **En cours** (défaut) → Résolus → Tous + recherche par nom/email
- Panneau droit : header avec avatar/nom/email/badge, lien "Voir la fiche client" → onglet Users
- Sélecteur de ticket si le client a plusieurs tickets
- Boutons : Résoudre (sync client), Archiver (📦), Supprimer (✕ rouge + modale confirmation)
- Barre réponse pill avec champ prénom + envoi rond + Enter pour envoyer
- Transitions fluides : `AnimatePresence mode="wait"` + `motion.div` fade-in/slide au changement de client/ticket
- Auto-refresh toutes les 15s
- Hauteur : `calc(100vh - 110px)` pour coller au bas de l'écran
- `useMemo` ajouté aux imports
- "Messages" (formulaire contact) déplacé de catégorie "Contenu" vers "Support"

### C. Pages Légales — Alexandre ROGELET + largeur 960px

**MentionsLegalesPage.tsx :**
- "Alexandre ROGELET" comme fondateur et directeur de la publication
- maxWidth 760→960px, date mai 2026

**ConfidentialitePage.tsx :**
- Section 1 : "fondé et exploité par Alexandre ROGELET"
- Section 4 enrichie : Verimo utilise Claude Sonnet 4 d'Anthropic, explication fonctionnement (documents analysés, données croisées, rapport structuré score /20), pourquoi Claude (fiabilité, sécurité API, transparence, conformité RGPD/CCT), 100% automatisé, documents supprimés après analyse
- Section 5 : "Claude Sonnet 4" précisé + API ne réentraîne pas
- maxWidth 760→960px, date mai 2026

**CGUPage.tsx :**
- Section 1 : "fondé et exploité par Alexandre ROGELET"
- maxWidth 760→960px, date mai 2026

### D. LoadingScreen + DashboardLoader — Logo Verimo

- `App.tsx` LoadingScreen : ancien SVG bouclier remplacé par `<img src="/logo.png">` centré (width 240, maxWidth 70%)
- Conteneur `width: 100%` + `display: flex` + `justifyContent: center` pour centrage

### E. Admin — Fiche Client Pro : section "Informations personnelles"

- Nouvelle section avant "Identité professionnelle" : Nom complet, Téléphone mobile, Email (lecture seule)
- Mode édition avec bouton "Modifier" : champs nom/téléphone éditables
- Enregistrement dans `profiles` Supabase + log admin
- Synchronisation immédiate côté client

### F. Admin — Historique Financier Client Pro

- Section "Factures" renommée "Historique financier"
- 3 KPI en haut : CA total généré (vert), Paiements abo (teal), Paiements unitaires (gris)
- Calcul automatique depuis les factures Stripe

### G. DashboardProPage — Mon Compte simplifié

- Email : lecture seule (grisé, disabled) avec tooltip "Les réponses de vos clients aux rapports envoyés arrivent sur cet email..."
- Téléphone : un seul champ au lieu de deux (supprimé "Téléphone de contact" redondant)
- Email de contact supprimé (confus)
- Tooltip repositionné `left: 0` au lieu de centré (fix débordement gauche)

### H. DashboardProPage — Rapports envoyés pliables/dépliables

- Composant `BuyerGroupCollapsible` extrait (rules of hooks)
- Chaque bloc acheteur fermé par défaut avec badge "X rapports"
- Clic → déploie avec `AnimatePresence` + `motion.div` (height 0→auto + fade, 0.25s ease)
- Repli sans saut de scroll (`scrollIntoView smooth nearest` si bloc hors viewport)
- Feedback visuel : fond change quand ouvert + bordure teal
- Chevron rotation fluide 0.25s

### I. Support Client — Améliorations UX

- Badge "Nouvelle réponse du service client" : badge vert à droite du titre du ticket quand `unread_by_user === true`
- Barre de saisie plus visible : fond blanc, bordure teal 2px, bouton envoi 46px + contraste amélioré
- Section "Tickets en cours" : header sombre (dégradé teal → navy), texte blanc, badge blanc — section prioritaire
- Section "Questions fréquentes" : header clair (dégradé light teal) — secondaire
- Texte notification corrigé : "Une pastille apparaîtra sur l'onglet Support dès qu'une réponse sera disponible."

### Fichiers modifiés session 28
```
src/App.tsx                         → LoadingScreen avec logo.png centré
src/pages/AdminPage.tsx             → Admin support inbox split, fiche client infos personnelles, historique financier, Messages déplacé dans Support, useMemo import
src/pages/MentionsLegalesPage.tsx   → Alexandre ROGELET, 960px, mai 2026
src/pages/ConfidentialitePage.tsx   → Alexandre ROGELET, Claude Sonnet 4 détaillé, 960px, mai 2026
src/pages/CGUPage.tsx               → Alexandre ROGELET, 960px, mai 2026
src/pages/DashboardProPage.tsx      → Compte simplifié (email readonly, 1 téléphone), rapports pliables, tooltip fix
src/pages/dashboard/Support.tsx     → Badge nouvelle réponse, barre saisie visible, headers inversés, texte notification
src/pages/dashboard/Tarifs.tsx      → Price IDs production

Edge functions (Supabase — mises à jour directement) :
- stripe-webhook/index.ts           → Price IDs production (4 particuliers)
- stripe-webhook-pro/index.ts       → Price IDs production (5 pro)
- pro-checkout-create/index.ts      → Price IDs production + mode billing_portal + automatic_tax: true (NON PUSHÉ — attendre Stripe Tax)

Supabase Secrets mis à jour :
- STRIPE_SECRET_KEY → clé production
- STRIPE_WEBHOOK_SECRET → webhook production particuliers
- STRIPE_WEBHOOK_SECRET_PRO → webhook production pro

SQL exécutés :
- ALTER TABLE payments → FK ON DELETE SET NULL (protection CA)
- ALTER TABLE pro_unit_purchases → FK ON DELETE SET NULL (protection CA)
- DELETE FROM payments (nettoyage données test)
- DELETE FROM pro_unit_purchases (nettoyage données test)
- DELETE FROM pro_subscriptions (nettoyage données test)
```

---

## ✅ Session 27 — 5-6 mai 2026 — UI/UX Support, Admin, Legal, Loader

(Voir transcript: /mnt/transcripts/2026-05-05-22-59-28-verimo-session27-ui-support-admin-legal.txt)

Topbar agrandie (pro+particulier), Support redesign complet (loader, welcome banner, FAQ 12 questions, chat redesigné, badge nouvelle réponse), DashboardLoader + LoadingScreen avec logo Verimo, pages légales initiales.

---

## ✅ Session 25 — 4 mai 2026 — Fix SEO canonical + GuidesPage redesign + headers dégradés

### Résumé
Session SEO et design : diagnostic Search Console des canonicals, fix du canonical statique dans index.html, redesign complet de la GuidesPage (nouveau layout cards + grille), et harmonisation des headers de toutes les pages publiques avec un dégradé subtil et des transitions fluides.

### A. Fix SEO — Canonical et og:url

- **Problème identifié** : `index.html` contenait `<link rel="canonical" href="https://www.verimo.fr/" />` et `<meta property="og:url" content="https://www.verimo.fr/" />` en dur → toutes les pages SPA déclaraient la homepage comme canonical
- **Impact** : Google Search Console montrait `/methode` avec canonical = `/` au lieu de `/methode`
- **Fix** : suppression des deux lignes statiques de `index.html` — le `useSEO` de chaque page gère déjà le canonical et og:url dynamiquement en JS
- **Sitemap** : déjà soumis dans Search Console, demande de re-indexation envoyée sur `/methode`
- **Middleware Edge** : déplacé en backlog nice-to-have (le fix canonical règle le problème principal)

### B. GuidesPage — Redesign complet

**Nouveau layout (remplacement total du fichier) :**
- Header clair avec dégradé subtil (blanc → bleu clair) + cercles décoratifs
- Badge **"GUIDES VERIMO"** en bloc visible (fond teinté, bordure, lignes décoratives)
- **H1 SEO** : "Analysez vos documents immobiliers avant de signer"
- Animation du trait sous "avant de signer" ralentie (3s au lieu de 1.2s)
- Sous-titre plus visible (15px, couleur plus foncée, texte raccourci pour une seule ligne)
- Barre de recherche + quick filters (PV d'AG, DPE, Charges, Compromis)
- **Catégories en 5 cards horizontales** avec flèche sous la card active, animations Framer Motion (spring scale, layoutId sur la flèche, whileHover/whileTap)
- **Sous-catégories supprimées** (jugées inutiles UX)
- **Articles en grille 3 colonnes** avec cards blanches, badges doc ou badges catégorie
- **Icônes modifiées** : Acheteurs 🧑‍💼, Vendeurs 🤝
- **Blocs sans docInfo** : badge catégorie ajouté (icône + label de la catégorie) pour habiller tous les blocs
- **CTA redesigné** : "Votre futur achat mérite mieux qu'une lecture en diagonale." + surtitre "Prêt à passer à l'action ?" + cercle décoratif + bouton "Analyser mon bien →"
- **Transition entre catégories** : fade-in + slide-up sur les articles via `motion.div key={activeCat}`
- Responsive mobile : grille 3→2→1 colonnes, catégories en grille 3→2 colonnes

### C. Headers dégradés — 4 pages publiques

**Dégradé appliqué** : `linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)` + cercles décoratifs radial-gradient

| Page | Avant | Après |
|------|-------|-------|
| HomePage | `bg-[#f4f7f9]` + blur circles | Dégradé + cercles + fondu bas 80px |
| TarifsPage | `background: '#fff'` | Dégradé + cercles + fondu bas 80px |
| MethodePage | `background: '#f8fafc'` | Dégradé + cercles + fondu bas 80px |
| ExemplePage | `linear-gradient(150deg, #eef7fb...)` + borderBottom | Dégradé + cercles + section toggle avec fond dégradé continu |

**Transitions fluides** : fondu interne en bas du hero (80px, transparent → blanc) intégré en position absolute pour éviter les traits visibles. ExemplePage : fond dégradé étendu à la section toggle pour continuité naturelle.

### Fichiers modifiés session 25
```
index.html                          → supprimé canonical statique + og:url statique
src/pages/GuidesPage.tsx            → redesign complet (nouveau layout, animations, CTA)
src/pages/HomePage.tsx              → header dégradé + cercles + fondu
src/pages/TarifsPage.tsx            → header dégradé + cercles + fondu
src/pages/MethodePage.tsx           → header dégradé + cercles + fondu
src/pages/ExemplePage.tsx           → header dégradé + cercles + transition toggle
```

---

## ✅ Session 24 — 4 mai 2026 — SEO complet + page Guides

### Résumé
Session référencement : diagnostic Search Console, optimisation SEO on-page (titles, descriptions, H1) sur toutes les pages publiques, analyse concurrentielle (Naveen, Prilow, Keyzia), création de la page Guides avec structure catégorisée, ajout dans le footer et le sitemap.

### A. Diagnostic SEO — Search Console

- **6 pages indexées** correctement (www.verimo.fr/) : /, /methode, /tarifs, /pro, /confidentialite, /mentions-legales
- **Page /exemple** : statut "Explorée, actuellement non indexée" — demande d'indexation envoyée
- **8 pages non indexées** : 4 erreurs de redirection (URLs sans www : verimo.fr/exemple, /methode, /pro, /tarifs) + 3 redirections normales (http→https, sans www→www) + 1 explorée non indexée
- **Cause des erreurs** : les URLs sans `www` redirigent vers `www.verimo.fr` — fonctionnement normal, Google avait détecté un hoquet temporaire le 28/04
- **Disclaimer obsolète** : les pages /methode et /tarifs affichaient encore "⚠️ Verimo est un outil d'aide…" dans Google (crawlées avant le retrait du footer) → re-indexation forcée
- **Action** : demande d'indexation envoyée sur les 6 pages principales (deux fois : avant et après le push SEO)

### B. Optimisation SEO on-page — Mots-clés

**Analyse concurrentielle :** Naveen, Prilow et Keyzia dominent "analyse documents immobiliers" grâce à des pages riches en contenu + blogs avec articles ciblés. Verimo absent sur cette requête car le vocabulaire utilisé ("décrypter", "comprendre l'essentiel") ne correspond pas aux termes recherchés.

**Mot-clé principal ciblé :** "analyse documents immobiliers" — l'expression exacte tapée par les utilisateurs.

**Modifications appliquées (8 fichiers) :**

| Page | Ancien title | Nouveau title |
|------|-------------|---------------|
| Home | Verimo — Vos documents décryptés, votre décision éclairée | Verimo — Analyse de documents immobiliers avant achat \| Risques, score et négociation |
| Tarifs | Tarifs Verimo — Analyse immobilière dès 4,90€ | Tarifs Verimo — Analyse de documents immobiliers dès 4,90€ |
| Méthode | Méthode Verimo — Comment nous analysons vos documents immobiliers | Comment analyser vos documents immobiliers avant un achat — Méthode Verimo |
| Exemple | Exemple de rapport Verimo — Appartement Lyon 6e analysé | Exemple d'analyse de documents immobiliers — Rapport Verimo complet |
| Pro | Verimo Pro — Outil d'analyse pour professionnels de l'immobilier | Analyse de documents immobiliers pour professionnels — Verimo Pro |
| Contact | Contact — Verimo | Contact Verimo — Analyse de documents immobiliers |

**H1 HomePage changé :** "Comprenez l'essentiel de votre achat immobilier avant de signer" → "Analysez vos documents immobiliers avant de signer" (mobile + desktop)

**Fichiers modifiés :**
- `index.html` — title, description, OG, Twitter, Schema.org mis à jour
- `src/hooks/useSEO.ts` — valeurs par défaut mises à jour
- `src/pages/HomePage.tsx` — H1 mobile + desktop + useSEO
- `src/pages/TarifsPage.tsx` — useSEO
- `src/pages/MethodePage.tsx` — useSEO
- `src/pages/ExemplePage.tsx` — useSEO
- `src/pages/ProPage.tsx` — useSEO
- `src/pages/ContactPage.tsx` — useSEO

### C. Page Guides — Structure et route

**Route :** `/guides` (listing) + `/guides/:slug` (articles individuels — à implémenter)

**Lien "Guides"** ajouté dans le Footer (colonne Produit), entre "Tarifs" et "Contact".

**Sitemap :** `/guides` ajouté avec `changefreq: weekly` et `priority: 0.8`.

**useSEO Guides :** title = "Guides immobiliers — Comprendre vos documents avant d'acheter | Verimo"

**Structure des catégories (5) :**
1. **Copropriété** (10 articles) — sous-catégories : Documents de copropriété (5) + Finances & Charges (5)
2. **Diagnostics** (8 articles) — sous-catégories : Performance énergétique (4) + Sécurité & Conformité (4)
3. **Acheteurs** (7 articles) — sous-catégories : Avant de signer (4) + Négociation (3)
4. **Vendeurs** (5 articles) — sous-catégories : Préparer sa vente (3) + Valoriser son bien (2)
5. **Professionnels** (11 articles) — sous-catégories : Agents & Mandataires (5) + Investisseurs & Marchands de biens (6)

**Total : 41 articles planifiés** — chaque article a un titre SEO, un slug, une description, et optionnellement un encart 💡 "Ce document en bref" (emoji + label centré + définition).

**Design en cours :** choix validé pour header H2 clair (fond blanc/gris, titre SEO, barre de recherche, compteur sous la recherche) + body style A2 (articles en lignes horizontales avec accent coloré à gauche, sidebar blanche). Design final à coder dans la prochaine session.

### D. Points à noter pour les FAQ Schema

- Google a restreint les FAQ rich snippets aux sites gouvernementaux et de santé (septembre 2023) → les JSON-LD FAQPage ne génèrent plus de rich snippets pour Verimo
- Les schémas FAQ restent utiles pour aider les algorithmes à comprendre le contenu mais ne sont plus prioritaires

### Fichiers modifiés session 24
```
index.html                          → SEO titles, descriptions, OG, Twitter, Schema.org
src/hooks/useSEO.ts                 → valeurs par défaut SEO
src/pages/HomePage.tsx              → H1 + useSEO
src/pages/TarifsPage.tsx            → useSEO
src/pages/MethodePage.tsx           → useSEO
src/pages/ExemplePage.tsx           → useSEO
src/pages/ProPage.tsx               → useSEO
src/pages/ContactPage.tsx           → useSEO
src/pages/GuidesPage.tsx            → NOUVEAU — page listing guides (design en cours)
src/App.tsx                         → routes /guides et /guides/:slug ajoutées
src/components/layout/Footer.tsx    → lien "Guides" ajouté
public/sitemap.xml                  → /guides ajouté
```

---

## ✅ Session 23 — 3 mai 2026 — UI/UX overhaul, admin catégorisé, transitions, emails

### Résumé
Session dense de redesign UI/UX : sidebar admin catégorisée, dashboards pro/particulier harmonisés, transitions fluides partout, support amélioré (badge, refresh, clôture), page Mon compte nettoyée, emails rapport redesignés, template inscription corrigé.

### A. Admin — Sidebar catégorisée (Option B)

Sidebar admin restructurée en 6 catégories avec barres latérales colorées et headers icône + label :
- **ACTIVITÉ** (teal `#2a7d9c`) : Tableau de bord, Analyse/CA, Transactions
- **UTILISATEURS** (violet `#7c3aed`) : Particuliers, Clients Pro, Demandes Pro
- **CONTENU** (vert `#16a34a`) : Analyses, Messages
- **OUTILS** (orange `#d97706`) : Codes promo, Bannière
- **SUPPORT** (ambre `#f59e0b`) : Besoin d'aide, Suggestions
- **SYSTÈME** (gris `#94a3b8`) : Alertes système, Historique

Fonds actifs foncés par catégorie : `#d0e8f0`, `#ddd6fe`, `#bbf7d0`, `#fde68a`, `#fcd34d`, `#cbd5e1`.
Sidebar passée de 220px à 240px. Navigation mobile pills inchangée.

### B. Admin — Transitions fluides

- Fiche utilisateur particulier → `motion.div` fade-in + slide up (0.22s)
- Fiche ticket support → `motion.div` fade-in + slide up (0.22s)
- Fiche client pro → `motion.div` fade-in + slide up (0.22s)
- Boutons filtres → `transition: 'all 0.2s'` sur tous les filtres admin
- Liste tickets → animation CSS `admin-fade-in` + hover bordure teal
- `@keyframes adminFadeIn` ajouté globalement

### C. Dashboard Pro — Harmonisation

- **Sidebar** : couleur harmonisée `#0e3a4a` (même que particulier, au lieu de `#0a1f2d`), MUTED 0.45 (texte "CRÉDITS RESTANTS" visible), plan abonnement redesigné avec fond subtil
- **Header Bonjour** : card blanche avec avatar initiale + "Bonjour Nathan 👋" + société·réseau·ville + date du jour
- **MesDossiersPro redesign complet** : banner header (icône FolderOpen + compteur + bouton Créer), filtres pills (Tous/Ce mois/Avec analyses/Sans analyse avec compteurs), tri (Plus récent/Plus ancien/Nom A→Z/Plus d'analyses), toggle grille/liste (LayoutGrid/LayoutList), vue liste tableau compact avec hover
- Imports ajoutés : `LayoutGrid, LayoutList, ArrowUpDown`

### D. Dashboard Particulier — Améliorations

- **Sidebar** : MUTED 0.45 (harmonisé), label "Support / Aide" → "Support"
- **Bouton "Besoin d'aide"** : passé en orange gradient `#f59e0b` → `#d97706` (comme le pro)
- **Badge notification support** : ajouté (n'existait pas) — polling 30s sur `support_tickets.unread_by_user`, prop `unreadTickets` passée au Sidebar
- **Couleur badge** : orange `#f59e0b` (au lieu de rouge `#dc2626`) sur les DEUX dashboards
- **Badge position** : collé au texte (supprimé `flex: 1` sur le label, `marginLeft: 4`)

### E. Transitions fluides (pro + particulier)

- Cloche notifications → `motion.div` opacity+y+scale (0.18s ease) + `AnimatePresence`
- Menu compte dropdown → même animation
- Navigation onglets → `motion.div key={path}` fade + slide up (0.2s)

### F. Support — Améliorations

- **Fix refresh** : `onBack` appelle `loadTickets()` avant `setView('list')` → ticket fraîchement créé visible immédiatement
- **Popup "Autre"** : label bold "Précisez le sujet de votre message" au-dessus de l'input (les deux dashboards), placeholder explicite, bouton "Envoyer" gris tant que `customSubject` vide (condition corrigée dans background du bouton)

### G. Page Mon Compte particulier — Redesign

- **Supprimé** : bloc crédits redondant (71/86/3) + bloc connexion/membre/recharger (info déjà dans sidebar)
- **Ajouté** : en-tête card (avatar initiale + nom + email + "Membre depuis" + "X analyses réalisées")
- **Supprimé** : imports `Link`, `useCredits`, state `provider` (unused)
- Le reste inchangé : infos personnelles, mot de passe, historique achats, zone danger

### H. MesAnalyses + Compare — Headers redesignés

- **MesAnalyses** : banner card (icône FileText + "Mes analyses" + compteur "9 analyses · 2 complètes · 7 simples") avec boutons Sélectionner/Nouvelle intégrés
- **Compare** : banner card (icône GitCompare + "Comparer mes biens" + sous-titre descriptif + stepper dots dans pill avec fond)

### I. Edge function — Emails rapport redesignés

- **Sujet** : `🔍 Votre analyse immobilière est prête` (1 rapport) / `🔍 Vos X analyses immobilières sont prêtes` (multi)
- **Nom expéditeur dynamique** : `Nathan vous a partagé un rapport` (1) / `Nathan vous a partagé 3 rapports` (multi)
- **Bloc rapport redesigné (Option B)** : layout vertical mobile-friendly — icône 🔍 + titre du document (bold), adresse en gris en dessous, bouton "Consulter →" teal en dessous
- **Header mail adapté** : "Analyse immobilière" vs "3 analyses immobilières"

### J. Template inscription Supabase

- ~~"1 analyse offerte dès votre inscription"~~ → `📊 Score /20, risques et recommandations`
- ~~"Résultats en moins de 2 minutes"~~ → `⚡ Votre rapport complet en quelques minutes`
- Ajout accroche italique : *"Vous êtes à un clic de transformer 200 pages de documents en un rapport clair."*

### Fichiers modifiés session 23
```
src/pages/AdminPage.tsx              → sidebar catégorisée Option B, transitions fluides fiches
src/pages/DashboardProPage.tsx       → sidebar harmonisée, header Bonjour, MesDossiersPro complet, transitions
src/pages/DashboardPage.tsx          → transitions, badge support, bouton aide orange, label "Support"
src/pages/dashboard/Support.tsx      → fix refresh onBack
src/pages/dashboard/Compte.tsx       → suppression bloc crédits, header propre
src/pages/dashboard/MesAnalyses.tsx  → header banner redesigné
src/pages/dashboard/Compare.tsx      → header banner redesigné

Edge function :
- admin-user-management/index.ts     → emoji sujet, nom expéditeur dynamique, bloc rapport Option B vertical

Template Supabase :
- template-inscription-supabase.html → suppression offre gratuite, nouvelle accroche
```

---

## ✅ Session 22 — 3 mai 2026 — Support/tickets, suppression aperçu gratuit, UI fixes

### Résumé
Session majeure : suppression complète du système d'aperçu gratuit (frontend + edge function), mise en place d'un système de support/tickets avec chat admin, popup suggestions pro avec catégories, notifications persistantes en BDD, nombreux fixes UI mobile et desktop.

### A. Suppression complète aperçu gratuit

**11 fichiers frontend nettoyés :**
- `analyses.ts` — Supprimé : createApercu, updateApercuResult, debloquerApercu, markFreePreviewUsed, unmarkFreePreviewUsed, checkFreePreviewUsed, syncFreePreviewUsed
- `analyse-client.ts` — AnalyseMode : retiré apercu_complete/apercu_document
- `App.tsx`, `LoginPage.tsx`, `AuthCallbackPage.tsx` — Supprimé localStorage + sync free preview
- `AdminPage.tsx` — "Aperçu gratuit" → "Analyse non payée"
- `DashboardPage.tsx` — RapportDashboard remplacé par redirection simple
- `RapportPage.tsx` — Supprimé détection/rendu aperçu
- `HomeView.tsx`, `NouvelleAnalyse.tsx`, `MesAnalyses.tsx` — Supprimé tout le flow aperçu

**Edge function `analyser-run` nettoyée :**
- Supprimé bloc `if (mode === 'apercu_complete' || 'apercu_document')` dans buildSystemPrompt
- Supprimé `isApercu` dans runAnalyseWithData et runAnalyse — result+paid=true directement
- Commentaire "aperçus (gratuits)" → "types inconnus"

**Note :** champs `is_preview`/`apercu` restent dans types TS (colonnes BDD existantes, toujours false)

### B. Système de support/tickets

**Tables SQL créées :**
- `support_tickets` (id, user_id, subject, status open/resolved, created_at, updated_at, resolved_at, unread_by_user, unread_by_admin)
- `support_messages` (id, ticket_id, sender_type user/admin, sender_name, message, created_at)
- `pro_suggestions` (id, user_id, message, category, acknowledged, archived, created_at)
- `user_notifications` (id, user_id, title, message, read, created_at)
- RLS policies, index, trigger update_ticket_timestamp

**Côté client (pro + particulier) :**
- Bouton "Besoin d'aide" topbar → popup création ticket (objets prédéfinis : Problème analyse, Question abonnement, Bug technique, Question crédits, Autre)
- Confirmation après envoi → "Voir la discussion" redirige vers Support
- Page Support : liste tickets ouverts/résolus dans cards, fil de chat (bulles user/admin), polling 10s, badge unread sidebar
- FAQ en rubriques avec icône "Questions fréquentes"

**Bouton "Suggestion" (pro uniquement) :**
- Popup avec catégories (🔧 Fonctionnalité manquante, ✨ Amélioration existante, 📊 Nouveau type de rapport, 💡 Autre idée)
- Placeholder adaptatif selon catégorie
- Historique "Mes suggestions précédentes" avec statut (En attente / Prise en compte)

**Côté admin :**
- Onglet "Besoin d'aide" : liste tickets, filtres (Tous/En cours/Résolus), chat admin, champ "Répondre en tant que" (prénom), bouton "Voir la fiche client", bouton "Clôturer"
- Onglet "Suggestions" : filtres (En attente/Prises en compte/Archivées), bouton "Pris en compte" → notification cloche client, bouton "Archiver", bouton "Supprimer", bouton "Fiche client", badge catégorie
- Historique tickets dans fiche utilisateur admin

### C. Notifications persistantes (table user_notifications)

- Cloche pro + particulier : charge les notifications BDD en plus des analyses terminées (mémoire)
- Notifications analyse : "Rapport prêt" + titre, icône check verte, cliquable → rapport
- Notifications BDD : titre + message complet affiché, icône cloche orange, non cliquable
- "Tout marquer lu" met à jour la BDD
- Admin "Pris en compte" sur suggestion → insère notification BDD → visible dans cloche client

### D. Autres modifications

- Confirmation mot de passe inscription (SignupPage)
- "Verdict d'achat" → "Recommandation Verimo" (TarifsPage + Tarifs dashboard)
- Barre de progression NouvelleAnalyse : courbe logarithmique basée sur temps réel
- InfoTooltip fix : séparation hover PC / clic mobile, z-index 99999
- Logo sidebar 60px + container 78px
- Fixes mobile : tables en cards, tooltips, grilles 2x2, body scroll lock modales

### Fichiers modifiés session 22
```
src/pages/DashboardProPage.tsx     → popup aide + suggestion + notifications BDD + InfoTooltip fix + logo
src/pages/DashboardPage.tsx        → popup aide + notifications BDD + logo
src/pages/AdminPage.tsx            → onglets support + suggestions + historique tickets fiche user
src/pages/dashboard/Support.tsx    → refait entièrement (tickets + chat + FAQ)
src/pages/dashboard/NouvelleAnalyse.tsx → barre progression recalibrée
src/pages/SignupPage.tsx           → confirmation mot de passe
src/pages/TarifsPage.tsx           → verdict → recommandation
src/pages/dashboard/Tarifs.tsx     → verdict → recommandation
src/pages/dashboard/MesAnalyses.tsx → supprimé aperçu
src/pages/dashboard/HomeView.tsx   → supprimé aperçu
src/pages/RapportPage.tsx          → supprimé aperçu
src/lib/analyses.ts                → supprimé fonctions aperçu
src/lib/analyse-client.ts          → supprimé modes aperçu

Edge function :
- analyser-run/index.ts            → supprimé code aperçu

SQL exécutés :
- CREATE TABLE support_tickets (+ RLS + index)
- CREATE TABLE support_messages (+ RLS + trigger)
- CREATE TABLE pro_suggestions (+ RLS)
- CREATE TABLE user_notifications (+ RLS + index)
- ALTER TABLE support_messages ADD COLUMN sender_name text
- ALTER TABLE pro_suggestions ADD COLUMN acknowledged boolean DEFAULT false
- ALTER TABLE pro_suggestions ADD COLUMN archived boolean DEFAULT false
- ALTER TABLE pro_suggestions ADD COLUMN category text
```

## ✅ Session 21 — 2 mai 2026 — Admin refonte, emails pro, envoi rapports, abonnements

### Résumé
Session massive : refonte complète admin (stats, CA, transactions), gestion abonnements pro (annulation/réactivation/factures), templates emails pro, système d'envoi de rapports depuis les dossiers, fix rapport partagé, fix reset password, édition identité pro admin, suppression compte pro.

### A. Admin — Refonte dashboard

**Onglets renommés :**
- "Vue d'ensemble" → "Tableau de bord"
- "Statistiques" → "Analyse / CA"
- "Paiements" → "Relevé des transactions"

**Tableau de bord (mois en cours) :**
- CA total = Particuliers + Pro (subscriptions + unit purchases)
- Répartition "Particuliers: X€ · Pro: Y€"
- CA par catégorie : split Particuliers (Simple, Complète, Pack 2, Pack 3) + Pro (Abo Découverte/Starter/Power, Unit Complète/Simple)
- 4 KPIs compacts sur une ligne : Nouveaux clients | Nb de pro abonnés (fond sombre) | Analyses lancées | Ticket moyen
- `pro_unit_purchases` filtré avec `.gt('amount', 0)` pour exclure crédits offerts

**Analyse / CA :**
- Filtre source : Tout / Particuliers / Pro — affichage contextuel
- Pro : masque inscriptions graph, affiche "Nouveaux abonnés pro"
- Particulier : masque KPIs pro
- **Évolutions ↑/↓ %** vs période précédente pour CA, clients, analyses
- Graphique CA par semaine : montants exacts au centime
- Crédits offerts intégrés inline (plus de section pleine largeur)

**Relevé des transactions :**
- Inclut transactions pro (subscriptions + unit purchases)
- Badge PRO/PART. sur chaque ligne
- Filtre source Tout/Particuliers/Pro

**Clients Pro — Liste :**
- Filtres "Tous / 🟢 Actifs / Inscrits" avec compteurs
- Badge "Actif" (vert) ou "Inscrit" (gris) par client
- Charge les abonnements pour déterminer le statut

**Clients Pro — Fiche détaillée :**
- Section "Identité professionnelle" : nom commercial, réseau, SIRET, ville, adresse pro — mode lecture / mode édition
- Bouton "✏️ Modifier" → inputs éditables → "✅ Enregistrer" avec log des changements
- Section "Factures" avec PDF Stripe (via `list_invoices` + `target_user_id`)
- Bouton "🗑️ Supprimer" avec confirmation (cascade BDD)
- Bouton "🔑 Reset MDP" → envoie email de réinitialisation au client
- Bouton "✉️ Modifier email" → change email Auth + profiles
- Statut abonnement : Actif (vert) / Résiliation en cours (orange) / Résilié (rouge) + raison

### B. Dashboard Pro — MonAbonnement

- Suppression header redondant + badge "Votre plan actuel · Renouvellement JJ/MM/AA"
- Section "Mes factures" : table Stripe invoices (Date, Description FR, Type, Amount, PDF)
- **Annulation 3 étapes** : popup émotionnel → raison de départ (6 options) → confirmation
- **Réactivation** : bouton vert sur plan card quand `cancel_at_period_end`
- Section "Crédits offerts" séparée
- Logo blanc dans sidebar (`/logo-blanc.png`)
- Bouton suppression logo sur page Mon Compte

### C. Emails Pro

**Expéditeur :** `pro@verimo.fr` — Nom : "Verimo Pro" (invitations) / "[Prénom] vous a partagé un rapport" (rapports)

**Templates refaits :**
- Invitation pro : 🎉 titre, emojis (📊🏆📧🎨), plan pré-sélectionné ✨, logo blanc header
- Renvoi lien : 🔑 template court séparé
- Rapport partagé : bloc "Ce rapport vous est présenté par [Nom] — [Réseau] ([Société])" en haut, logo pro dans zone blanche, chaque rapport en card avec "Consulter le rapport →", téléphone pro, footer Verimo discret

**Sujets :**
- Invitation : `🏢 Bienvenue sur Verimo Pro — Activez votre compte`
- Renvoi : `🔑 Verimo Pro — Nouveau lien de connexion`
- Rapport : `Votre rapport d'analyse — [adresse]`

### D. Envoi rapports depuis dossier

**4 boutons d'action** dans vue dossier : Vendeur (blanc) | Acheteur potentiel (blanc) | Lancer analyse (bleu) | Envoyer analyse (vert)

**Wizard 3 étapes avec animations :**
1. Sélection destinataires (vendeurs + acheteurs avec badges, multi-select)
2. Sélection analyses (multi-select, score affiché)
3. Message personnalisé pré-rempli (adaptatif selon docs sélectionnés) + preview

**Fonctionnalités :**
- Message adaptatif : utilise adresse du dossier, noms des docs nettoyés
- Envoi groupé : `send_report_batch` — un seul mail par destinataire avec tous les rapports
- Animation d'envoi : spinner + barre de progression + "✅ Rapports envoyés !"
- Popup bloqué (pas de fermeture au clic extérieur)
- Conseil logo si pas uploadé ("💡 ajoutez-le dans Mon compte")

**Historique envois dans dossier :**
- Regroupé par destinataire
- Statut "✓ Ouvert le JJ/MM/AA" / "En attente" **par document** (pas par bloc)
- Nom du doc nettoyé (première partie avant " — ")

### E. Fix rapport partagé (introuvable)

- `fetchAnalyseByShareToken` (analyses.ts) : cherche d'abord dans `report_shares`, fallback `analyses.share_token`
- Marque `opened_at` automatiquement quand le client ouvre le lien
- Policies RLS ajoutées sur `report_shares` : SELECT public + UPDATE pour marquer ouvert

### F. Fix reset mot de passe

- **Cause** : `window.location.origin` retournait `https://www.verimo.fr` → redirection www → non-www perdait le hash token
- **Fix ForgotPasswordPage** : `redirectTo` forcé en dur à `https://verimo.fr/auth/reset-password`
- **Fix ResetPasswordPage** : détection token recovery dans URL hash + spinner "Vérification en cours…" au lieu de flash "lien invalide"

### G. Autocomplétion adresse dossier

- Fix ville vide : flags `skipAddressAutoRef` et `skipPostalAutoRef` pour empêcher les useEffect de se redéclencher après sélection
- Extraction adresse propre : retire code postal et ville du champ adresse
- Alignement code postal / ville : grille `1fr 2fr`
- Tooltip sur "Note interne" : infos privées

### H. Edge functions mises à jour

**`admin-user-management`** (12 actions) :
- `verify_pro_token`, `setup_pro_account` (publiques)
- `send_report` (pro ou admin, vérifie ownership)
- `send_report_batch` (pro ou admin, envoi groupé)
- `create`, `create_pro`, `send_pro_invitation`, `resend_pro_invitation` (admin)
- `invite`, `delete`, `reset_password`, `update_email` (admin)

**`pro-checkout-create`** :
- Mode `cancel` : `cancel_at_period_end` + `cancellation_reason`
- Mode `reactivate` : reverse cancellation
- Mode `list_invoices` : supporte `target_user_id` pour admin
- Gestion erreurs paiement en français (card_declined, expired_card, etc.)

### Fichiers modifiés session 21
```
src/pages/AdminPage.tsx            → ~4400 lignes (refonte stats, CA pro, filtres, identité pro, suppression, reset mdp, modifier email)
src/pages/DashboardProPage.tsx     → ~4400 lignes (MonAbonnement, envoi rapports wizard, historique, logo, autocomplétion)
src/pages/DashboardPage.tsx        → ~590 lignes (logo blanc sidebar)
src/pages/ForgotPasswordPage.tsx   → fix redirectTo sans www
src/pages/ResetPasswordPage.tsx    → fix détection token + spinner
src/lib/analyses.ts                → fix fetchAnalyseByShareToken (report_shares + opened_at)

Edge functions :
- admin-user-management (12 actions, templates emails refaits, pro@verimo.fr)
- pro-checkout-create (cancel, reactivate, list_invoices avec target_user_id)

SQL exécutés :
- ALTER TABLE pro_subscriptions ADD COLUMN cancellation_reason text
- Policies RLS report_shares (SELECT public, UPDATE marquer ouvert)

Assets :
- /public/logo-blanc.png (logo blanc fond transparent)
```

### SQL à vérifier session 21
- `pro_subscriptions.cancellation_reason` existe
- RLS `report_shares` : "Accès public lecture report_shares" (SELECT) + "Marquer rapport ouvert" (UPDATE)

---

## Sessions 1 à 20 (résumé condensé)

- **Sessions 1-2** (19/04) — ProPage, ContactProPage, HomePage, TarifsPage, AdminPage, Compare v1
- **Sessions 3-5** (20-21/04) — Prompt enrichi, type de bien, ExemplePage, MethodePage
- **Session 6** (22/04) — Scoring déterministe `recalculerCategories()`
- **Session 7** (22/04) — Refonte résumé/avis Verimo, countdown
- **Sessions 8-12** (22-23/04) — Architecture comparaison, verdict V2, DashboardLoader
- **Session 13** (23/04) — Refonte AdminPage, responsive mobile, RLS admin, webhook Stripe, recherche ⌘K
- **Session 14** (24/04) — Redesign sidebar, MesAnalyses, Compare C3, corrections prompt
- **Session 15** (27/04) — Messaging harmonisé, remboursement auto, alertes système
- **Session 16** (28/04) — Dashboard pro complet, edge functions pro, config DNS pro.verimo.fr
- **Sessions 17-19** (28-29/04) — Stripe Pro, dossiers complet, credit_grants + trigger
- **Session 20** (30/04) — Crédits pro fonctionnels, notifications, historique, code promo, popups succès

---

## 📊 Architecture crédits (récap définitif)

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions`
2. **Achats unitaires** → `pro_unit_purchases`
3. **Crédits offerts** → `credit_grants` + trigger `apply_credit_grant`

**Consommation** : `consume_pro_credit(p_user_id, p_credit_type)`
**Remboursement** : `refund_pro_credit(p_user_id, p_credit_type)`

### Contraintes BDD
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA

---

## Règles de notation — Score /20

| Catégorie | Max |
|-----------|-----|
| Travaux | 5 pts |
| Procédures | 4 pts |
| Finances | 4 pts |
| Diagnostics privatifs | 4 pts |
| Diagnostics communs | 3 pts |
| **TOTAL** | **20 pts** |

---

## Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Sidebar pro + particulier** : `#0e3a4a` (harmonisé)
- **Accent pro** : `#7dd3fc`
- **Accent particulier** : `#5dbfe0`
- **Header dark** : `#0f2d3d`
- **Header email** : `#1a3a4a` → `#2a5a6e` (plus clair)
- **Bouton aide / badge support** : `#f59e0b` (orange)
- **Admin sidebar catégories** : Activité `#2a7d9c`, Utilisateurs `#7c3aed`, Contenu `#16a34a`, Outils `#d97706`, Support `#f59e0b`, Système `#94a3b8`

---
