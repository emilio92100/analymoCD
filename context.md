# VERIMO — Contexte projet — 9 mai 2026 (après sessions 1 à 30)

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
- **Une étape à la fois** — Alex préfère qu'on avance étape par étape, pas en lui balançant 10 actions à faire d'un coup
- **Réponses courtes et concises avec Alex** — il préfère aller à l'essentiel, pas de pavés explicatifs sauf si question technique précise
- **Ne jamais mentionner Tonton Immo ou Emilio Immo sur Verimo** — focus produit strict
- **Mot "IA" / "AI" banni** des pages publiques Verimo — utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte"

---

## Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière, modificatifs RCP, fiche synthétique...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour **appartements et maisons**.

**Slogan :** *Vos documents décryptés, votre décision éclairée.*

**H1 HomePage :** *Analysez vos documents immobiliers avant de signer.*

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

TVA Tax Rate ID (Stripe, exclusif HT) : txr_1TUAxVBesXB76oWESXBnGdIZ
```

---

## Stack technique
- **Frontend** : React + Vite + TypeScript + Tailwind
- **Backend** : Supabase Pro (auth + DB + Edge Functions Deno + Storage)
- **IA** : Claude Sonnet 4.6 via API Anthropic + Files API
- **Paiement** : Stripe (PRODUCTION)
- **Email** : Mailjet (`notification@verimo.fr` particuliers, `pro@verimo.fr` pro)
- **Déploiement** : Vercel (frontend auto depuis GitHub) + Supabase (edge functions manuelles)
- **Repo** : `github.com/emilio92100/analymoCD`
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`
- **Domaine** : verimo.fr (OVH registrar) + pro.verimo.fr (CNAME → Vercel)

---

## Edge Functions Supabase (production)

| Nom | Rôle |
|-----|------|
| `analyser` | Lance une analyse — gère la queue Anthropic 503 |
| `analyser-run` | Worker qui traite l'analyse en background |
| `analyser-retry` | Cron qui retraite les analyses en queue (12 retries max) |
| `comparer` | Compare 2 ou 3 rapports |
| `admin-user-management` | Actions admin (create, invite, delete, reset password, etc.) |
| `pro-checkout-create` | Stripe : subscribe / buy_unit / cancel / reactivate / billing_portal / list_invoices |
| `stripe-webhook` | Webhook Stripe particuliers (checkout.session.completed) |
| `stripe-webhook-pro` | Webhook Stripe pro (5 events : checkout, invoice paid/failed, sub updated/deleted) |
| `create-checkout-session` | Stripe particuliers (checkout) |

---

## Routes principales
```
/                             → HomePage
/pro                          → ProPage
/tarifs                       → TarifsPage
/exemple                      → ExemplePage
/methode                      → MethodePage
/guides                       → GuidesPage
/connexion, /inscription      → Auth
/admin                        → AdminPage
/dashboard                    → SmartDashboard (détecte role)
/dashboard/nouvelle-analyse   → NouvelleAnalyse
/dashboard/analyses           → MesAnalyses (particulier)
/dashboard/dossiers           → MesDossiersPro (pro)
/dashboard/dossier/:id        → DossierDetail (pro)
/dashboard/abonnement         → MonAbonnement (pro)
/dashboard/compte             → Compte ou ComptePro
/dashboard/support            → Support
/rapport?id=XXX               → RapportPage
```

---

## 🔥 BACKLOG PRIORITÉ HAUTE (à faire prochaines sessions)

### 🔴 1. Système d'abonnement Pro — Bug Stripe prorata + Popup de récap

**Bug critique identifié (8 mai 2026) — non corrigé :**

Dans `pro-checkout-create.ts`, fonction `handleSubscribe`, en cas d'upgrade :
```ts
proration_behavior: 'none',        // ❌ BUG : Stripe ne facture pas la différence
billing_cycle_anchor: 'now',        // ❌ BUG : reset cycle à maintenant
```

**Conséquence :** un client qui upgrade Découverte → Power en milieu de mois ne paie **rien immédiatement** alors qu'il devrait payer (89,90 - 19,90) × jours_restants/30 = ~58€. Manque à gagner ~70€ par client malin par mois.

**Fix prévu :**
```ts
proration_behavior: 'create_prorations',  // ✅ Stripe facture la différence
// (supprimer billing_cycle_anchor)
```

**Politique de crédits sur upgrade — choix à valider :**
- **Option A (MAX, recommandée)** : le client reçoit les crédits du nouveau plan complet (ex: Découverte → Power = solde devient 10 complètes + 30 simples, peu importe le solde précédent)
- **Option B (CUMUL)** : on ajoute uniquement la différence entre plans (déjà ce que fait `upgrade_pro_subscription_credits` actuellement, à confirmer)
- Alex doit trancher A ou B avant de coder

**Popup de confirmation à créer (validé par Alex) :**
- S'affiche AVANT que le client confirme l'upgrade
- Récapitule : plan actuel, nouveau plan, crédits ajoutés, montant à payer aujourd'hui (prorata depuis Stripe `invoices.upcoming`), date du prochain prélèvement complet
- Détail HT/TVA/TTC

**Ordre d'action prévu pour la session :**
1. Lancer SQL pour voir le code actuel de `upgrade_pro_subscription_credits` et `reset_pro_subscription_credits` :
   ```sql
   SELECT prosrc FROM pg_proc 
   WHERE proname IN ('upgrade_pro_subscription_credits', 'reset_pro_subscription_credits');
   ```
2. Décider option A ou B (probablement adapter la fonction SQL)
3. Coder la nouvelle route "preview prorata" dans `pro-checkout-create` (utilise `stripe.invoices.upcoming`)
4. Coder le popup de confirmation dans `DashboardProPage.tsx`
5. Modifier `proration_behavior` + retirer `billing_cycle_anchor`
6. Tester avec carte test Stripe avant de pousser en prod

**Fichiers concernés :**
- `supabase/functions/pro-checkout-create/index.ts`
- `src/pages/DashboardProPage.tsx` (composant `MonAbonnement` autour de `setUpgradeConfirm`)
- Fonction SQL `upgrade_pro_subscription_credits` (peut-être à modifier selon option choisie)

**Vérifications complémentaires à faire :**
- ⚠️ Vérifier que la fonction SQL `upgrade_pro_subscription_credits` ne génère pas de crédits négatifs sur un downgrade Power → Découverte
- ⚠️ Vérifier que l'ordre des webhooks (`subscription.updated` vs `invoice.payment_succeeded`) ne crée pas de race condition entre cumul et reset

### 🔴 2. Tester en prod le système de queue Anthropic

Le système de queue est déployé et fonctionne en environnement test, MAIS pas encore testé en conditions réelles.

**Action :**
1. Vérifier que `FORCE_OVERLOAD = false` dans Supabase Secrets (CRITIQUE pour la prod)
2. Mettre temporairement `FORCE_OVERLOAD = true`
3. Lancer une analyse depuis verimo.fr
4. Vérifier popup queue + email + notification cloche + entrée DB
5. Remettre `FORCE_OVERLOAD = false`
6. Déclencher retry manuellement
7. Vérifier que l'analyse passe + email reçu + lien rapport fonctionne

### 🔴 3. Edge function `comparer` — remplacer version debug par version propre prod

Mentionné dans backlog depuis longtemps, toujours pas fait.

### 🔴 4. SEO — soumettre les ~40 URLs guides restantes dans Google Search Console

Quota dépassé lors de la dernière soumission, reprendre.

---

## 🟡 BACKLOG PRIORITÉ NORMALE

- [ ] **Stripe Tax — automatic_tax: true** dans `pro-checkout-create` (fichier prêt mais non pushé, attendre activation Stripe Tax)
- [ ] **Bouton "Modifier mon moyen de paiement"** dans MonAbonnement (mode `billing_portal` déjà codé dans edge function, frontend à faire)
- [ ] **Branding Stripe Checkout** — Logo + couleurs Verimo
- [ ] **Domaine custom Stripe** — `pay.verimo.fr` au lieu de `checkout.stripe.com`
- [ ] **Reçus email Stripe** — Activer envoi auto
- [ ] **Remboursement depuis l'admin** — Bouton qui appelle Stripe refund
- [ ] **Guides — articles individuels** : route `/guides/:slug` + rendu d'article
- [ ] **Guides — rédaction** : 5 articles stratégiques SEO (PV AG, DPE, 10 docs avant offre, charges copro, compromis)
- [ ] **Veille réglementaire — prompt analyser-run** : DPE collectif copros <50 lots (jan 2026), PPT obligatoire (jan 2026)
- [ ] **Prompt caching API Anthropic** — ~90% d'économie possible
- [ ] **Compare : redesign verdict** — split synthèse par bien, layout two-column
- [ ] **Différence analyse simple vs complète** : mieux expliquer sur Méthode et/ou Tarifs

---

## ✅ Session 30 — 8-9 mai 2026 — Système de queue Anthropic + Archivage dossiers pro + UX mobile

### Résumé
Très grosse session technique : système de queue complet pour gérer les surcharges Anthropic 503, multiple bugs RLS corrigés, archivage de dossiers pro avec popup de confirmation et UX mobile, fix logique RCP, KPI dashboard pro, popups de complétion dossier améliorés.

### A. Système de queue Anthropic 503 — déployé

**Backend complet :**
- Status `'queued'` ajouté au CHECK constraint de la table `analyses`
- Colonnes `queue_attempts`, `progress_message` ajoutées
- Edge function `analyser` : retourne HTTP 202 avec `{ queued: true }` quand Anthropic répond 503 (overload)
- Edge function `analyser-retry` : cron Supabase, retraite les `queued` toutes les 30 min
- Après 12 retries échoués → status `failed` + email + notification cloche + remboursement crédit auto
- Texte queue user message : *"...nous vous prévenons par email ET par notification dans la cloche 🔔 dès que c'est terminé."*

**Frontend (NouvelleAnalyse.tsx) :**
- `QueuedDialogPopup` qui s'affiche quand HTTP 202 reçu
- **Bug critique fixé** : `step === 'analyse'` empêchait le rendu du popup. Fix par `setStep('upload')` + `resetUpload()` dans le branche `result.queued`
- Console logs `[VERIMO-DEBUG]` ajoutés à 4 points dans `analyse-client.ts` pour diagnostiquer les problèmes futurs

**Variable Supabase Secrets** : `FORCE_OVERLOAD` (true/false) pour forcer le mode queue en test. **DOIT ÊTRE À FALSE EN PROD.**

### B. Bugs RLS corrigés (codes promo pro)

- `credit_grants` : ajout policy `INSERT` `credit_grants_insert_own` avec `auth.uid()=user_id`
- `promo_uses` : `with_check NULL` corrigé sur `user_own_promo_uses` (DROP + CREATE avec USING + WITH CHECK)
- `promo_codes` : `with_check NULL` corrigé sur `admin_all_promo_codes`
- Fonction `increment_promo_uses` : param `code_id` corrigé (était `promo_id`), ajout `SECURITY DEFINER`

### C. Fix route email rapport

**Bug :** `analyser-run` construisait `https://verimo.fr/dashboard/pro/rapport?id=...` (pro) ou `/dashboard/rapport?id=...` (particulier) → 404. La vraie route est `/rapport?id=...`.

**Fix :** unique URL `https://verimo.fr/rapport?id=${analyseId}` quel que soit le rôle.

### D. KPI Dashboard Pro — "Ce mois / Total + dont X échouées"

`HomeViewPro` : remplacement de la tile "Ce mois" par une carte custom avec toggle Mois/Total + sub-text *"⏳ X en cours · ✕ X échouées"* (affiché seulement si pertinent).

### E. Page dossier pro — Badge en cours + ℹ️ Échouée

- `'queued'` ajouté à `isPending`
- Renommage "Analyses" → "Analyses effectuées"
- Icône Info + ErrorPopup pour analyses échouées (mirroir du comportement particulier dans `MesAnalyses`)

### F. Mobile UX — barre de progression analyse

CSS media query @max-width:640px ajouté dans `index.css` pour les classes `na-progress-*` (header padding, title font 20→16, pct 48→36, etc).

### G. Admin — Badge "⏳ En queue"

`AdminPage.tsx` : 4 endroits modifiés pour afficher correctement le statut `queued` (counts, filter, badge, detail badge, isInProgress) au lieu du fallback "✗ Échouée".

### H. Popup "Compléter mon dossier" — UX premium

- Animations Framer Motion (initial/animate/exit avec spring)
- Wrap dans `AnimatePresence`
- `useEffect` lock body `overflow: hidden` (prévient scroll background)
- Badge orange avec count sur tab Documents (desktop + mobile) si docs essentiels manquants
- Alert banner orange en haut de TabDocuments si missing essentials AND not completed AND not expired

### I. Popup code promo — bouton "Voir mes crédits"

Après application d'un code promo réussi, popup avec bouton qui fait `window.location.reload()`.

### J. Logique RCP corrigée

**Problème :** `MODIFICATIF_RCP` était considéré comme équivalent à `REGLEMENT_COPRO` (`hasDoc(['REGLEMENT_COPRO', 'MODIFICATIF_RCP'])`).

**Règle métier (validée par Alex) :**
- Si juste un Modificatif → demander RCP en essentiel
- Si juste le RCP → Modificatif en **secondaire** (peut ne pas exister)
- Si les 2 → tout va bien
- Si aucun → RCP en essentiel + Modificatif PAS listé (on ne sait pas s'il en existe)

**Fix dans `RapportPage.tsx`** : 3 endroits modifiés (TabDocuments, ComplementModal, calcul badge missingEssentielsCount).

### K. Système d'archivage dossiers pro — complet

**Migration SQL exécutée :**
```sql
ALTER TABLE pro_folders ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX idx_pro_folders_archived_at ON pro_folders (archived_at) WHERE archived_at IS NULL;
```

**UI Mes dossiers :**
- Toggle **"📂 Actifs / 📦 Archivés"** en haut de la page (avec compteurs)
- Bouton 📦 archive sur chaque carte de dossier (au hover, à côté de supprimer)
- Badge **"📦 ARCHIVÉ"** dans le flux au-dessus du titre (pas en absolute pour éviter chevauchement)
- Carte légèrement grisée si archivée (background #fafafa, opacity 0.85)
- **Transitions fluides** : `AnimatePresence mode="wait"` + `motion.div` avec stagger en cascade (30ms entre cartes) au switch Actifs/Archivés
- Vue liste : mini badge ARCHIVÉ à côté du nom + opacity 0.75

**UI Page détail dossier :**
- Bouton "📦 Archiver" / "📂 Restaurer" dans le header (à côté de "Modifier")
- Bandeau orange "Dossier archivé le X" en haut si archivé
- **Tous les boutons grisés** sur dossier archivé : Modifier, Ajouter vendeur, Ajouter acheteur, Lancer analyse, Envoyer analyse, boutons éditer/supprimer dans les cartes vendeur/acheteur
- Sous-texte "🔒 Dossier archivé" sur les boutons grisés
- Tooltips "Restaurez le dossier pour [action]"

**Popup `ModalArchiveFolder` (composant créé) :**
- Pattern basé sur `ModalDeleteFolder` mais en orange (archive) ou vert (restore) au lieu de rouge
- Mode `archive` : header orange, icône 📦 animée (spring physics)
- Mode `restore` : header vert, icône 📂 animée
- **Texte d'archivage validé par Alex (proposition narrative) :**
  > Au fil du temps, votre liste de dossiers s'agrandit. **L'archivage vous aide à garder une vue claire sur ceux qui sont vraiment en cours**, sans perdre l'historique des autres.
  > 
  > **Archivez par exemple :**
  > 🎉 Les ventes abouties
  > 🤝 Les mandats terminés
  > ⏸️ Les dossiers en pause
  > 🚫 Les projets abandonnés
  > 🔄 Les mandats partis chez un confrère
  > 
  > *Tout reste consultable dans l'onglet 📦 Archivés, et la restauration se fait en un clic.*
- **Mention "irréversible" / "réversible" supprimée** (Alex a fait la remarque que c'était trompeur)
- Boutons : Annuler / 📦 Archiver le dossier (orange) | Annuler / 📂 Restaurer (vert)
- AnimatePresence + scroll lock + click hors modal pour fermer

**Mobile UX du popup :**
- Largeur max 360px (vs 460 desktop)
- Padding réduit, icône 44×44 (vs 56), titre 15.5 (vs 18)
- Boutons en pleine largeur 50/50 (flex: 1)

**Mobile UX du header dossier (archivé) :**
- Boutons "Restaurer" + "Modifier" empilés en colonne pleine largeur (au lieu de côte à côte qui débordait)
- Class `dossier-header-actions` ajoutée

**Mobile UX de la liste analyses dans dossier détail :**
- Score retiré de la meta (était dupliqué)
- Voir le rapport + score empilés verticalement à droite (au lieu de wrap horizontal cassé)

### Fichiers modifiés session 30
```
src/pages/RapportPage.tsx           → Fix logique RCP (3 endroits) + popup compléter premium
src/pages/DashboardProPage.tsx      → KPI ce mois/total, page dossier (badge queued, ℹ️ échoué, "Analyses effectuées"), système archivage complet (toggle, modal, badges, boutons grisés), mobile UX header + analyses
src/pages/AdminPage.tsx             → Badge "⏳ En queue" (4 endroits)
src/pages/NouvelleAnalyse.tsx       → Fix render popup queue (setStep upload + resetUpload), texte popup, mobile UX
src/lib/analyse-client.ts           → Console logs [VERIMO-DEBUG] 4 points
src/index.css                       → Mobile media @640px barre progression

Edge functions :
- analyser/index.ts                 → Texte queue user message avec mention email + cloche
- analyser-run/index.ts             → Fix reportUrl (single route /rapport?id=)

SQL exécutés (Supabase SQL Editor) :
- ALTER TABLE analyses CHECK constraint pour autoriser status='queued'
- ALTER TABLE pro_folders ADD COLUMN archived_at TIMESTAMPTZ
- CREATE INDEX idx_pro_folders_archived_at
- 6+ corrections RLS (credit_grants, promo_uses, promo_codes)
- DROP + CREATE function increment_promo_uses (SECURITY DEFINER)
```

### Découverte importante session 30 — Admin Support Inbox
La refonte admin support inbox (split-view, regroupement par utilisateur, filtres archivés) **est déjà implémentée** dans `AdminSupportTab` (AdminPage.tsx ligne ~787). Anciennes notes mémoire indiquaient à tort qu'elle restait à faire.

### Diagnostic système d'abonnement Pro (en fin de session)
Lecture complète du code de `pro-checkout-create` et `stripe-webhook-pro V3`. Diagnostic = 80% du système est bien fait MAIS :
- 🔴 Bug `proration_behavior: 'none'` + `billing_cycle_anchor: 'now'` = upgrade gratuit pour le client (perte ~70€/abus)
- 🟡 Risque sur downgrade : la fonction `upgrade_pro_subscription_credits` est appelée pour TOUT changement, peut générer crédits négatifs sur Power→Découverte (à vérifier)
- 🟡 Race condition possible entre `subscription.updated` (cumul) et `invoice.payment_succeeded` (reset)

**Voir Backlog Priorité Haute #1 pour le plan de fix.**

---

## ✅ Sessions précédentes (résumé condensé)

### Session 29 — 7 mai 2026 — UI/UX support, Admin, Legal, Loader, Stripe production
- Stripe production complet (9 produits, webhooks Pro/Particuliers, FK ON DELETE SET NULL pour protéger CA)
- Admin Support Inbox split-view par utilisateur (vu dans cette session que c'était DÉJÀ fait)
- Pages légales : Alexandre ROGELET fondateur, Claude Sonnet 4 mentionné, 960px width
- DashboardProPage : Mon Compte simplifié (email readonly, 1 téléphone), rapports envoyés pliables
- Support : badge nouvelle réponse, barre saisie visible, headers inversés

### Session 28 — 6 mai 2026
Voir précédentes sessions stockées (résumé : Stripe production basculé, redesign admin support, pages légales, UX support).

### Sessions 25-27 (4-5 mai 2026)
SEO complet (canonical fix, GuidesPage, headers dégradés), redesign admin sidebar catégorisée, dashboards pro/particulier harmonisés.

### Sessions 21-24 (28 avril - 4 mai 2026)
Stripe pro complet, dossiers pro complets, credit_grants + trigger, code promo, popups succès, page Guides, optimisation SEO mots-clés.

### Sessions 1-20 (19-30 avril 2026)
Conception initiale, prompt enrichi, scoring déterministe /20, comparaison v1, AdminPage, dashboard pro, edge functions, config DNS pro.verimo.fr.

---

## 📊 Architecture crédits (récap)

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions` (colonnes `credits_complete_total/used`, `credits_simple_total/used`)
2. **Achats unitaires** → `pro_unit_purchases` (avec `credits_remaining`)
3. **Crédits offerts** → `credit_grants` + trigger `apply_credit_grant`

**Consommation** : `consume_pro_credit(p_user_id, p_credit_type)`
**Remboursement** : `refund_pro_credit(p_user_id, p_credit_type)`
**Reset cycle abonnement** : `reset_pro_subscription_credits(p_subscription_id)`
**Cumul upgrade** : `upgrade_pro_subscription_credits(p_subscription_id, p_new_plan)`

### Contraintes BDD
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA
- `analyses.status` : CHECK autorise `pending, processing, queued, completed, failed`

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
- **Header email** : `#1a3a4a` → `#2a5a6e`
- **Bouton aide / badge support** : `#f59e0b` (orange)
- **Archive (orange)** : `#9a3412` text, `#fed7aa` bg, `#ea580c` button
- **Restore (vert)** : `#15803d` text, `#bbf7d0` bg, `#16a34a` button
- **Admin sidebar catégories** : Activité `#2a7d9c`, Utilisateurs `#7c3aed`, Contenu `#16a34a`, Outils `#d97706`, Support `#f59e0b`, Système `#94a3b8`

---

## 🎯 PROCHAINE SESSION — Action prioritaire

**Le sujet du système d'abonnement pro est resté en plan en fin de session 30.**

Pour reprendre proprement :

1. **Décider option A ou B** pour les crédits sur upgrade (Alex doit trancher)
2. **Lancer le SQL** pour voir le code de `upgrade_pro_subscription_credits` :
   ```sql
   SELECT prosrc FROM pg_proc 
   WHERE proname IN ('upgrade_pro_subscription_credits', 'reset_pro_subscription_credits');
   ```
3. **Coder la route preview prorata** dans `pro-checkout-create` (utilise `stripe.invoices.upcoming`)
4. **Coder le popup confirmation upgrade** dans `DashboardProPage.tsx` avec récap HT/TVA/TTC
5. **Modifier** `proration_behavior` → `'create_prorations'` + supprimer `billing_cycle_anchor`
6. **Tester** avec carte test Stripe AVANT push prod
7. **Adapter** `upgrade_pro_subscription_credits` selon option choisie

**Méthode :** une étape à la fois, comme demandé par Alex. Pas de pavé à 10 actions.
