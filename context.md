# VERIMO — Contexte projet — 17 mai 2026

> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## 🛠️ Méthode de travail avec Alex

- **Profil** : débutant développement, modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- **Repo** : `github.com/emilio92100/analymoCD`
- Claude clone `https://github.com/emilio92100/analymoCD.git` et livre les fichiers **complets** via `present_files` depuis `/mnt/user-data/outputs/`
- Alex push manuellement sur GitHub
- **Vercel redéploie auto** le frontend après chaque push GitHub
- ⚠️ **Edge Functions Supabase NE sont PAS déployées par push GitHub** — il faut aller manuellement dans Supabase → Edge Functions → coller le code → Deploy. Bug récurrent : Alex push, l'erreur persiste, c'est parce que l'edge function n'est pas redéployée
- **SQL avant frontend** : toujours faire les UPDATE de schéma Supabase avant de pusher le code qui s'en sert
- **Ne jamais coder sans accord préalable** — toujours échanger et valider avant de toucher au code
- **Une étape à la fois** — pas 10 actions d'un coup
- **Réponses courtes et concises** — pas de pavés sauf question technique précise
- **Pas de QCM cascade** — quand Alex demande un choix, lui en proposer 2-4 max
- **Challenger les sur-ingénieries** — Alex préfère faire simple
- **Mots bannis des pages publiques Verimo** :
  - "IA" / "AI" → utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte". AI uniquement autorisé dans admin, edge functions, prompts, logs, context.md.
  - "co-brandé" / "co-branding" → utiliser "à votre image" (banni progressivement sur tout le site)
- **Tests live avec vraie carte CB d'Alex** (pas Visa 4242)
- Compte test live actuel : Jean DUMONT / ARTY CONSEIL (acct_1TIateBesXB76oWE)
- User test pro : `publicite92320@gmail.com` (ID `217468f6-0f2b-4487-865e-a277cc600e45`) — ⚠️ **À nettoyer** : compte supprimé en BDD mais abo Stripe encore actif, génère des events FK qui plantent
- Nouveau compte test 11 mai : `alexandre.rt25@gmail.com` (customer Stripe `cus_UUgPam3KYnmpzC`)

---

## 📦 Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière, modificatifs RCP, fiche synthétique...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour appartements et maisons.

**Slogan** : *Vos documents décryptés, votre décision éclairée.*
**H1 HomePage** : *Analysez vos documents immobiliers avant de signer.*
**Cible** : Acheteurs particuliers (primo-accédants, RP) et professionnels (agents immo, mandataires, investisseurs, marchands de bien, notaires).

---

## 💰 Tarification

### Particuliers
- 4,90€ → 1 crédit analyse simple (1 doc) — PAS de score /20
- 19,90€ → 1 crédit analyse complète (jusqu'à 15 docs)
- 29,90€ → 2 crédits (Pack 2 biens)
- 39,90€ → 3 crédits (Pack 3 biens)
- Crédits jamais expirés

### Pros — Abonnements mensuels HT
| Plan | Prix HT/mois | Complètes | Simples |
|------|-------------|-----------|---------|
| Découverte | 19,90€ | 1 | 3 |
| Starter | 49,90€ | 5 | 15 |
| Power | 89,90€ | 10 | 30 |

**Achats unitaires pro (réservés aux abonnés)** : Complète 9,90€ HT · Simple 2,90€ HT

**Argumentaire commercial Découverte** : 1,30€ "surcoût" vs achat unitaire (19,90€ vs 18,60€) défendable via dashboard pro, support dédié, tarif préférentiel à 9,90€ (vs 19,90€ particulier). Rentable dès 2 analyses supplémentaires dans l'année.

**Coûts réels Claude API** : ~0,50€/analyse complète (médiane), ~0,15€/analyse simple. Marges saines à 55-90%.

⚠️ **Tarifs pros JAMAIS affichés publiquement** — ni sur `/pro`, ni sur `/tarifs`, ni sur `/pro/agents-mandataires`. Validation manuelle des comptes + démo perso.

### Stripe Price IDs (PRODUCTION)

```
# Particuliers
document : price_1TTtd1BesXB76oWECAGA9ywf
complete : price_1TTtd2BesXB76oWEsZ9LsLS9
pack2    : price_1TTtcxBesXB76oWETkokxLgB
pack3    : price_1TTtczBesXB76oWEloTMvEZF

# Pro
DECOUVERTE 19,90€ → price_1TTtd1BesXB76oWEZuILxjwe
STARTER 49,90€    → price_1TTtczBesXB76oWEcKaNR2BW
POWER 89,90€      → price_1TTtcxBesXB76oWEPyVYZjCj
UNIT_COMPLETE 9,90€ → price_1TTtcyBesXB76oWEBF1TLHYz
UNIT_SIMPLE 2,90€   → price_1TTtd2BesXB76oWEVM0p27GS

# TVA France 20% (mode exclusif HT)
TVA Tax Rate ID : txr_1TUAxVBesXB76oWESXBnGdIZ
```

---

## 🏗️ Stack technique

- **Frontend** : React + Vite + TypeScript + Tailwind
- **Backend** : Supabase Pro (auth + DB + Edge Functions Deno + Storage)
- **IA** : Claude Sonnet 4.6 via API Anthropic + Files API (modèle `claude-sonnet-4-6`)
- **Paiement** : Stripe (PRODUCTION)
- **Email** : Mailjet (`notification@verimo.fr` particuliers, `pro@verimo.fr` pro)
- **Déploiement** : Vercel (frontend auto via GitHub) + Supabase (edge functions **manuelles**)
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`
- **Site** : `https://www.verimo.fr` + `pro.verimo.fr` (CNAME → Vercel)

---

## 🏢 Identité légale Verimo

- **Éditeur** : VERIMO APP
- **Responsable** : Alexandre ROGELET
- **Emails** :
  - `hello@verimo.fr` → email général grand public (CGU, mentions légales, contact)
  - `pro@verimo.fr` → email B2B (UNIQUEMENT relations pros et CGV Pro) — ✅ mailbox configurée et fonctionnelle
  - `notification@verimo.fr` → Mailjet particuliers
  - `contact@verimo.fr` → emails sortants pros (avec nom agent dans body)

---

## ⚙️ Edge Functions Supabase (production)

| Nom | Rôle | Version |
|-----|------|---------|
| `analyser` | Lance une analyse — gère la queue Anthropic 503 | v8 |
| `analyser-run` | Worker qui traite l'analyse en background | **v11** (17 mai — feature DPE travaux préconisés) |
| `analyser-retry` | Cron pg_cron 5 min — retraite les analyses queued (12 retries max) | — |
| `comparer` | Compare 2 ou 3 rapports | — |
| `admin-user-management` | Actions admin (create, invite, delete, reset password) | — |
| `pro-checkout-create` | Stripe pro : subscribe / preview_upgrade / buy_unit / cancel / cancel_scheduled_change / reactivate / billing_portal / list_invoices | V3 |
| `stripe-webhook-pro` | Webhook Stripe pro (5 events) + mail résiliation | **V7** |
| `stripe-webhook` | Webhook Stripe particuliers (checkout.session.completed) | **V3.1** |
| `create-checkout-session` | Stripe particuliers (checkout) + audience promo | **V3** |
| `send-pro-request-confirmation` | Mail confirmation prospect + notif interne `pro@verimo.fr` | — |
| `sync-stripe-payments` | Filet de sécurité — sync Stripe → table `payments` toutes les 5 min via pg_cron | **V2** — ⚠️ **DÉSACTIVÉ temporairement** |

⚠️ **Rappel critique** : push GitHub ne déploie pas les edge functions → toujours redéployer manuellement dans Supabase Studio.

### Webhooks Stripe configurés

- **Verimo - Pro** → `stripe-webhook-pro` : 4 events (checkout.session.completed, customer.subscription.deleted, customer.subscription.updated, invoice.paid) + `charge.refunded`
- **Verimo - Particuliers** → `stripe-webhook` : checkout.session.completed + `charge.refunded`

> Note : `checkout.session.completed` est envoyé aux 2 webhooks. V7/V3.1 contiennent un filtre qui fait skip silencieux si le paiement n'est pas pour ce webhook.

### Cron Supabase pg_cron

- `analyser-retry-5min` → actif (essentiel)
- `sync-stripe-payments-every-5min` → DÉSACTIVÉ temporairement (à réactiver quand vieux paiements problématiques expirés)

⚠️ **Service_role key compromise** durant la session du 11 mai (partagée dans screenshots). À régénérer + recréer le cron avec la nouvelle clé.

---

## 🗺️ Routes principales

```
/                              → HomePage
/pro                           → ProPage (4 onglets profils : Agent/Mandataire, Investisseur, Marchand, Notaire)
/pro/agents-mandataires        → MandatairesPage (landing dédiée agents/mandataires — ⚠️ renommée 16 mai)
/pro/rejoindre                 → Page multi-step prospects pros (⚠️ renommée 16 mai — anciennement /rejoindre)
/tarifs                        → TarifsPage (particuliers uniquement, pas de tarifs pros publics)
/exemple                       → ExemplePage
/methode                       → MethodePage
/guides                        → GuidesPage
/cgv-pro                       → CGVProPage (B2B, scroll spy, 14 sections)
/connexion, /inscription       → Auth
/admin                         → AdminPage
/dashboard                     → SmartDashboard (détecte role)
/dashboard/nouvelle-analyse    → NouvelleAnalyse
/dashboard/analyses            → MesAnalyses (particulier)
/dashboard/dossiers            → MesDossiersPro (pro)
/dashboard/dossier/:id         → DossierDetail (pro)
/dashboard/abonnement          → MonAbonnement (pro)
/dashboard/compte              → Compte ou ComptePro
/dashboard/support             → Support
/rapport?id=XXX                → RapportPage
/rapport/partage/:token        → RapportPartagePage (lien public sans compte)
```

---

## 💳 Système d'abonnement Pro Stripe — État actuel (✅ stable)

**Le système Stripe pro est entièrement opérationnel et testé en live**.

### Flow d'upgrade (paiement immédiat)
- `proration_behavior: 'none'` + `billing_cycle_anchor: 'now'` → cycle redémarre, plein tarif facturé immédiatement
- `payment_behavior: 'default_incomplete'` → permet de gérer 3DS, carte refusée, etc.
- 4 cas gérés côté backend :
  - ✅ Paiement direct OK → popup vert "Plan activé !" + crédits cumulés
  - 🔐 3DS demandé → popup Stripe inline → si validé OK
  - ❌ Carte refusée → popup rouge contextuelle "Mettez à jour votre moyen de paiement"
  - ⏳ Paiement en cours → popup "Patientez, rafraîchissez"
- **Sécurité backend** : webhook `customer.subscription.updated` vérifie `latest_invoice.status === 'paid'` AVANT de cumuler les crédits
- **Pas de retry automatique** sur upgrade échoué

### Flow de downgrade (Stripe Subscription Schedule)
- Création d'un `subscription_schedule` via `from_subscription` → bascule programmée à `current_period_end`
- Mode `cancel_scheduled_change` permet d'annuler une bascule programmée
- Stockage BDD dans colonnes `pro_subscriptions.scheduled_plan_change` + `scheduled_change_date`

### ⚠️ Bug paiement Stripe (NON résolu, workaround manuel)

**Symptôme** : `stripe_payment_id = NULL` dans `payments` pour les paiements d'upgrade (Starter, Power) → webhook `charge.refunded` ne peut pas matcher → CA admin pas mis à jour quand remboursement fait dans Stripe.

**Cause racine** : `invoice.payment_intent` est parfois vide/undefined au moment où le webhook `invoice.paid` arrive (notamment avec `payment_behavior: 'default_incomplete'`). Le code `recordProPayment` stocke alors `stripe_payment_id = NULL`.

**Décision Alex** : ne pas refondre maintenant. Workflow manuel : SQL UPDATE quand remboursement fait dans Stripe.
```sql
UPDATE payments SET status='refunded', refunded_amount=amount, refunded_at=NOW()
WHERE id IN ('xxx');
```

**Bug secondaire** : webhook particulier `stripe-webhook/index.ts` ligne 142 → `const supabase` déclaré DANS `serve()` → `ReferenceError` quand `handleChargeRefunded` (déclaré hors serve) est appelé. À fixer plus tard.

### Bandeau past_due
- Confirmé actif sur Dashboard Pro (DashboardProPage.tsx)
- Rouge, sur toutes pages, bouton "Mettre à jour ma carte" → `openBillingPortal` Stripe
- Bloque changement plan si past_due
- Stripe Smart Retries actif (4 tentatives sur 3 semaines), emails auto Stripe activés

---

## 📜 Système CGV Pro popup obligatoire (✅ DÉPLOYÉ 16 mai)

**Concept** : popup obligatoire de consentement aux CGV Pro avant le 1er paiement pro. Une fois acceptée → jamais redemandée. Si changement de version CGV future, Alex envoie mail manuel aux pros existants (continuation d'usage = acceptation tacite jurisprudence FR).

### SQL exécuté

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cgv_pro_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cgv_pro_version TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_cgv_pro_accepted_at
  ON public.profiles (cgv_pro_accepted_at)
  WHERE cgv_pro_accepted_at IS NOT NULL;
```

### Fichiers livrés

- `src/lib/cgv-version.ts` (NEW) — constante `CURRENT_CGV_PRO_VERSION = "v2.3"`
- `src/components/CgvProConsentDialog.tsx` (NEW) — popup avec backdrop blur, checkbox, texte "Je confirme avoir lu et accepté les Conditions Générales de Vente Pro de Verimo", récap action ("Souscription au plan Starter — 49,90 € HT/mois"), lien vers `/cgv-pro` nouvel onglet, UPDATE BDD puis exécute callback paiement
- `src/pages/DashboardProPage.tsx` — étendu type ProProfile avec `cgv_pro_accepted_at` + `cgv_pro_version`. Helper `requireCgvThen(actionLabel, paymentAction)` intercepte 3 actions : `handleSubscribe`, `handleBuyUnit`, `openUpgradeFlow` (renommées en `_Internal` avec wrappers). State `cgvAcceptedLocal` cache local pour éviter relecture BDD
- `src/pages/AdminPage.tsx` — type `ProClient` étendu, bloc visible sur fiche client pro : ✅ vert "CGV Pro acceptées — Version v2.3 · [date]" ou ⚠️ orange "CGV Pro non acceptées"

---

## 🔐 Sécurité paiements (✅ TERMINÉ)

8 failles identifiées et corrigées. Tous fixés et déployés en prod.

**Reste dans l'audit (non bloquant)** : Rate limiting (faille #7) à activer avant la 1ère grosse campagne pub.

---

## ✅ CA admin V2 + remboursements + sync auto (TERMINÉ)

- Schéma `payments` enrichi : `customer_type`, `amount_ht`, `refunded_amount`, statuts (`completed`, `refunded`, `partially_refunded`)
- Webhook `charge.refunded` ajouté sur les 2 webhooks
- Calcul CA admin réécrit pour lire uniquement `payments`, filtrer status refunded, déduire `refunded_amount`
- Affichage HT/TTC universel sur AdminPage (Pros : HT en premier, Particuliers : TTC)

### Suppression user pro
- `auth.admin.signOut(user_id, 'global')` AVANT `deleteUser`
- ⚠️ **Risque** : code actuel `admin-user-management/index.ts` ligne 668-679 NE touche PAS à Stripe → si user supprimé sans annulation abo Stripe préalable, l'abo continue → events FK plantent en boucle
- ALTER NULL sur user_id de payments / pro_unit_purchases, FK SET NULL, backfill customer_email/name

---

## 🆕 Session 16 mai 2026 (~6h) ⭐ — CGV Pro popup + refonte /pro/rejoindre + refonte profonde MandatairesPage

### 1. CGV Pro popup obligatoire (✅ DÉPLOYÉ — détail section dédiée ci-dessus)

### 2. Refonte page `/pro/rejoindre` (✅ DÉPLOYÉ)

**Fichier** : `src/pages/RejoindrePage.tsx` (770 → 1054 lignes)

**Changements** :
- ✅ Placeholders génériques partout : "Votre prénom" / "Votre nom" / "vous@exemple.fr" / "Nom de votre agence" / "Nom de votre société" / "Nom de votre étude" (suppression des "Alexandre", "alexandre@agence.fr", "Emilio Immo", "SCI Patrimoine 75", etc.)
- ✅ Composant `SectionBlock(icon, title, subtitle, children)` ajouté pour structurer l'étape 3 (Activité) en sous-blocs visuels distincts par profil (agent : "Identité professionnelle" / "Réseau et structure" / "Volume d'activité", etc.)
- ✅ Composant `SiretLookup` avec API gouv `recherche-entreprises.api.gouv.fr` (gratuit, sans clé). Workflow 2 temps : tape 14 chiffres → carte GRISE "Société trouvée" + bouton "Valider la société" → clic → carte VERTE "✓ Informations confirmées". Si modif SIRET après → repasse en gris. Si non trouvé → orange neutre, demande envoyée quand même
- ✅ Composant `GridSelectResponsive` (remplace `GridSelect`) — réseaux : 4 colonnes desktop, 2 colonnes mobile
- ✅ CSS responsive complet : classes `.hero-split`, `.scenario-grid`, `.step2-row`, `.step3-row`, `.reseaux-grid`, `.interets-grid`. Breakpoint à 700px

### 3. Renommages URLs (✅ DÉPLOYÉ)

- `/rejoindre` → `/pro/rejoindre` (non indexé Google → switch direct sans redirection)
- `/pro/mandataires` → `/pro/agents-mandataires` (trop restrictif, couvre aussi agences et agents commerciaux)
- Fichier `MandatairesPage.tsx` conservé en interne (juste le path qui change)
- Fichiers modifiés : `src/App.tsx` (routes), `src/pages/ProPage.tsx` (3 liens), `src/pages/MandatairesPage.tsx` (2 liens internes), `src/pages/TarifsPage.tsx` (1 lien)

### 4. Refonte profonde MandatairesPage v6 (✅ FICHIER LIVRÉ, à pusher)

**Fichier final** : `src/pages/MandatairesPage.tsx` (1066 lignes)

**Structure (8 sections)** :
1. **Hero** split 50/50 — titre "Soyez l'agent qui répond à tout" avec trait bleu surligné animé sur "répond à tout" + 2 iPhone arrondis inclinés (-8° et +8°) + 6 confettis sur les côtés (les 2 du milieu retirés)
2. **Ruban stats** 4 chiffres en grid auto-fit (grille 2×2 sur mobile)
3. **Scénario 1 — Post-visite acheteur** : iPhone avec conversation SMS Sophie
4. **Scénario 2 — Prise de mandat** : 2 cartes flottantes (synthèse + Avis Verimo)
5. **Scénario 3 — Pendant la visite** : onglets empilés 3D StackedTabs
6. **Scénario BONUS — L'envoi en 1 clic** (NEW) : 2 mockups superposés (popup envoi côté pro + email reçu côté client, structure identique aux 3 autres scénarios — texte gauche / visuel droite)
7. **C'est tout simple — 3 ÉTAPES · ~5 MIN** : badge pilule pleine dégradé bleu Verimo + 3 cartes (Glissez vos PDF / Rapport en ~3 min / Partagez en 1 clic) avec gros titre, sous-titre coloré, flèches → entre cartes desktop
8. **CTA final** : fond identique au CTA bas ProPage (`linear-gradient(170deg, #0a1f2d 0%, #0f2d3d 35%, #1a4a5e 70%, #2a7d9c 100%)`) avec trait bleu surligné animé sur "recommande"

**Palette confettis Verimo** (à réutiliser autres pages) :
```ts
const VERIMO_CONFETTI_COLORS = {
  green: '#10b981',   // bon
  orange: '#f97316',  // vigilance
  red: '#ef4444',     // alerte
  blue: '#2a7d9c',    // signature Verimo
};
```

**Nouveaux composants mockups** :
- `MockupSendPopup` — Popup "Envoyer une analyse" étape 3/3 fidèle à l'app (header icône mail violette, stepper 3 cercles avec ✓✓3, zone message, bandeau jaune "💡 Pour afficher votre logo dans les rapports, ajoutez-le dans Mon compte", boutons Retour + Envoyer vert gradient)
- `MockupClientEmail` — Email reçu côté client (header gradient bleu Verimo `0f2d3d→1d5e7a`, logo Laforêt stylisé carré 32×32 bleu `#003478` avec petit arbre SVG blanc + texte "laforêt" Georgia serif font-weight 900, signature "Pierre Martin / Laforêt — Lyon")

**Décisions UX importantes** :
- Mot "co-brandé" banni → remplacé par "à votre image" (`100% à votre image` dans le ruban stats)
- "15+ docs analysés" → "24h/24 · analyse à tout moment"
- Phrase tagline section 3 étapes : *"Aussi simple que ces 3 étapes. Aussi rapide qu'un café."* (forcée sur 1 ligne desktop)
- Scénario 2 reformulé : "Vous arrivez en RDV mandat avec son dossier déjà analysé... vous ne survendrez pas son bien : vous le vendrez au juste prix, plus vite" — Bénéfice 2 : "Prix appuyé sur les vrais chiffres du bien"
- Badge "3 ÉTAPES · ~5 MIN" version pilule pleine dégradé bleu (16px, gros, bien visible)
- **Bandeau Avant/Après Verimo testé puis SUPPRIMÉ** (Alex préfère ne pas l'avoir)

**Optimisations mobile profondes** :
- 2 breakpoints : 900px (tablette) + 640px (mobile pur)
- Téléphones Hero : scale 0.65 (tablette) / 0.55 (mobile pur), hauteur 300→240px
- CTA hero forcés centrés mobile (`justify-content: center` sur les 2 groupes)
- Scénarios : `.scenario-grid` utilise `:has()` pour ordonner texte-puis-visuel peu importe l'ordre markup
- Stats grille **2×2 mobile** (au lieu de 1×4), chiffres 22px, labels 11px
- Scénario Envoi mobile : les 2 mockups sortent du mode absolute, stack vertical normal, sans rotation, max-width 320px/280px
- Steps row passe en 1 colonne mobile, flèches cachées

**Transitions entre sections** :
- Décision finale : **fond UNIFORME `#fafbfd`** sur toutes sections du milieu (stats, scénarios 1-2-3-envoi), aucun dégradé intermédiaire (élimine les lignes nettes horizontales)
- Hero termine sur `#fafbfd`
- "3 étapes" fait transition vers CTA via `linear-gradient(180deg, #fafbfd 0%, #fafbfd 60%, #eef3f6 100%)`
- CTA reprend gradient ProPage avec léger fondu 60px en haut

**SEO** :
- Title : *"Verimo Pro pour agents & mandataires immobiliers — Analysez vos documents en 3 minutes"*
- Description : *"Agents immobiliers et mandataires : analysez les PV d'AG, diagnostics et règlements de vos biens en quelques minutes. Envoyez à vos clients un rapport pro en 1 clic."*

---

## 🆕 Session 17 mai 2026 ⭐ — Feature DPE Travaux préconisés (analyse simple + complète)

### Objectif
Extraire et afficher proprement les recommandations de travaux issues du DPE (méthode 3CL-DPE 2021) : 2 packs (essentiels + à envisager) avec montants estimés et évolution projetée de l'étiquette DPE après travaux.

### Architecture décisionnelle
- **JSONB unique** : pas de SQL/migration. Le résultat d'analyse est déjà stocké dans une colonne JSONB → on enrichit le JSON existant avec un nouveau sous-objet, pas de nouvelle table ni colonne nécessaire. Cette règle s'applique pour toutes futures features d'enrichissement d'analyse.
- **Couvre 2 cas** : DPE seul uploadé (analyse simple) ET DDT complet contenant un DPE (analyse complète)
- **Affichage** : particulier ET pro (même composant)

### Modifications

#### 1. Edge function `analyser-run/index.ts` (v10 → v11, 1767 → 1780 lignes)

⚠️ **Déploiement manuel sur Supabase Dashboard requis**

- **Schéma DDT enrichi** (ligne 722) : ajout dans `dpe` de `version_methode` (3CL_2021/3CL_2012/factures/inconnue) + sous-objet `recommandations` contenant :
  - `format` : "standard" | "ancien" | "aucune"
  - `evolution_etiquette` : 3 étiquettes projetées (actuelle, apres_pack_1, apres_pack_1_et_2) avec classe + kwh_m2 + ges_kg_m2
  - `pack_1` (essentiels) et `pack_2` (à envisager), chacun avec cout_min/cout_max + travaux[] où chaque travail a : poste (mur/toiture/plancher_bas/fenetres/porte/chauffage/eau_chaude/ventilation/autre), description, performance_cible, decision_copropriete (bool), autorisation_urbanisme (bool)
- **10 règles d'extraction ajoutées** (lignes 733-742) :
  - Règle DPE seul uploadé → le classer comme DDT
  - Règle DDT complet → extraire normalement
  - Détection version méthode
  - Détection format (standard si 3CL_2021 avec packs, ancien si 3CL_2012, aucune si A/B sans recos)
  - Extraction détaillée pack_1 (label, montants, travaux avec posture + description + performance_cible + décision copro + urbanisme)
  - Extraction pack_2 (idem)
  - Extraction evolution_etiquette (page 6 du DPE)
  - Si format="ancien" → fallback sur travaux_preconises legacy
  - Si format="aucune" → packs vides
  - Ne JAMAIS inventer un montant ou une étiquette projetée
- **Schéma synthèse finale enrichi** (ligne 1390) : ajout au niveau racine de `dpe_recommandations` (recopie depuis le DDT)
- **Règle synthèse** (ligne 1159) : "si DDT contient un DPE avec sa section Recommandations, recopier vers rapport.dpe_recommandations"

#### 2. `RapportPage.tsx` (4734 → 4896 lignes) — Analyse COMPLÈTE

Localisation : composant `TabLogement` (function ligne 2546) → accordéon "Performance énergétique" → nouveau bloc juste après le coût énergétique annuel.

Nouveau bloc remplace l'ancienne sous-section "Travaux préconisés" legacy :
- Titre dynamique : **🎯 "Pour passer de X à Y"** (si évolution disponible) ou **🔨 "Pour améliorer votre note DPE"** (fallback)
- Bandeau "Évolution projetée de l'étiquette" : 3 cercles colorés (D → C → A) avec flèches →, utilise `DPE_COLORS` existant
- Card Pack 1 — fond blanc, badge bleu `#2a7d9c`, sous-titre dynamique en gras ("Pour passer de E à C")
- Card Pack 2 — badge gris `#64748b`, sous-titre dynamique
- Label **"MONTANT ESTIMÉ"** (uppercase 10px, fontWeight 700, letterSpacing 0.05em) au-dessus du chiffre 17px à droite
- Liste travaux avec emoji par poste (🧱 mur, 🏠 toiture, ⬇️ plancher_bas, 🪟 fenetres, 🚪 porte, 🔥 chauffage, 💧 eau_chaude, 💨 ventilation, 🔧 autre)
- Description + performance cible en italique
- Badges contextuels : "Décision copropriété" (orange `#fef3c7`/`#92400e`) et "Autorisation d'urbanisme" (bleu `#dbeafe`/`#1e40af`)
- Footer info bleu ℹ️ "Estimations issues du DPE — à valider avec un professionnel. Des aides existent (MaPrimeRénov', éco-PTZ)."
- **Fallback legacy** : si pas de `dpe_recommandations` au nouveau format mais `travaux_preconises` rempli → ancien affichage simple (puces 🔴 Prioritaire / 🟡 Recommandé)

#### 3. `DocumentRenderer.tsx` (3175 → 3325 lignes) — Analyse SIMPLE ⚠️ Découverte importante

**L'analyse simple n'utilise PAS `TabLogement`** mais a son propre rendu dans `DocumentRenderer.tsx` → `RendererDDT` (ligne 455).

Avant : ancien bloc "TRAVAUX RECOMMANDÉS PAR LE DPE" (gradient orange, puces 🔴/🟡) — non touché par la modif TabLogement.

Après : remplacé par le **même nouveau bloc complet** que TabLogement, accessible via `r.dpe.recommandations` (depuis le DDT direct) au lieu de `rapport.dpe_recommandations`. Header coloré gardé (gradient orange `#d97706→#b45309`) mais avec titre dynamique injecté (🎯/🔨 + texte). POSTE_ICONS recréé localement. Fallback legacy gardé identique à l'original.

### Fichiers livrés
- `supabase/functions/analyser-run/index.ts` (1780 lignes) — edge function, déploiement manuel
- `src/pages/RapportPage.tsx` (4896 lignes) — push GitHub, Vercel auto-déploie
- `src/pages/dashboard/DocumentRenderer.tsx` (3325 lignes) — push GitHub, Vercel auto-déploie

0 erreur TypeScript validée (`npx tsc --noEmit` complet).

### Cas gérés
- **DPE 3CL-DPE 2021** (récent) → format="standard" → bloc complet avec packs et évolution
- **DPE seul uploadé** → classé comme DDT, recommandations extraites
- **DDT complet avec DPE inclus** → recommandations remontées au niveau racine via `dpe_recommandations`
- **DPE ancien format (3CL_2012)** → format="ancien" → fallback `travaux_preconises` legacy
- **DPE classe A/B sans recos** → format="aucune" → bloc non affiché
- **Pas de DPE** → bloc non affiché

### Status déploiement
✅ Fichiers pushés sur GitHub par Alex (commit `7a42280`)
✅ Edge function `analyser-run` redéployée manuellement sur Supabase Dashboard
⏳ Test en attente : 1 analyse simple sur DPE Bouyges + 1 analyse complète sur diagnostics Benoist-Lucy pour validation rendu final

---


## 🔮 Feature Compte Agence multi-utilisateurs (PRÉVUE PLUS TARD)

⚠️ **À développer quand 2-3 vraies agences clientes seront acquises** — pas avant. Estimation : **5-15 jours de dev** selon scope.

### Spec technique

**Tables BDD à créer** :
- `agencies` : nom, adresse, SIRET, logo, plan_actif
- `agency_members` : agency_id, user_id, role ('owner' / 'admin' / 'agent'), invited_at, status

**Modifs tables existantes** :
- `pro_subscriptions` : lier à `agency_id` plutôt qu'à user unique
- `credit_grants` + consommation : pool partagé au niveau agence
- `analyses` : ajouter `agency_id` pour tracking

**Backend (edge functions)** :
- Système d'invitation (email + token)
- Vérif rôle à chaque action
- Allocation crédits : pool partagé OU sous-quotas par agent
- Facturation centralisée (1 facture par agence)
- Refonte webhook Stripe pour gérer agency_id

**Frontend** :
- Onglet "Mon équipe" dans dashboard
- UI invitation (email, rôle)
- Vue admin agence : qui a fait quoi, conso par agent
- Filtre analyses : mes analyses vs toutes les analyses de l'agence
- Toggle "Partager cette analyse avec mon agence" à la création
- Bibliothèque agence des biens analysés

**Tarifs visés** :
| Plan agence | Prix HT | Users | Complètes | Simples |
|------|---------|-------|-----------|---------|
| Agence Starter | 149€ | 3 | 20 | 60 |
| Agence Pro | 249€ | 5 | 40 | 100 |
| Agence Premium | 499€ | 10+ | 100 | 250 |

**Argument commercial clé** : "Avec Verimo Agence, vos agents ne refont pas le travail deux fois. Une analyse créée = disponible pour toute l'agence."

### Workaround immédiat si agence intéressée

Vendre **3 comptes Power séparés** (ou plus) avec **code promo "AGENCE3" = -30%** sur Power → 189€/mois pour 3 agents (vs 269,70€ tarif plein). Migration auto vers Agence Starter dès que la feature sera développée.

---

## 🔮 Feature personnalisation rapports Pro "à votre image" (PRÉVUE PLUS TARD)

✅ **Infra à 70%** : `pro_logo_url` et `pro_company_name` existent en BDD, bucket `pro-logos` configuré, UI upload fonctionnelle dans dashboard pro.

❌ **Manque** : affichage du logo + nom d'agence sur :
- Page `RapportPage` (vue propriétaire)
- Page `RapportPartagePage` (lien public partagé aux clients)
- Pied de page "Analyse propulsée par Verimo"

**Effort réel restant** : 2-3h dev.

**Décision** : à activer uniquement pour Power (différenciateur Starter → Power).

✅ **Architecture déjà en place côté rapport** :
- `RapportPage.tsx` ligne 4326 : flag `hideVerimoBranding` (default `false`)
- Ligne 4336 : si `_ownerIsPro = true` sur lien partagé → `hideVerimoBranding = true`
- Ligne 4354-4355 : si user pro consulte son propre rapport → `hideVerimoBranding = true`
- Titre bloc verdict bascule en *"Synthèse de l'analyse"* (au lieu d'*"Avis Verimo"*) quand pro
- Bouton "Partager" masqué
- ⚠️ Manque l'affichage **du logo pro** + **nom d'agence** dans l'en-tête

---

## 📊 Architecture crédits

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions` (`credits_complete_total/used`, `credits_simple_total/used`)
2. **Achats unitaires** → `pro_unit_purchases` (avec `credits_remaining`)
3. **Crédits offerts** → `credit_grants` + trigger `apply_credit_grant`

### Sources de crédits particulier
Stockés directement dans `profiles.credits_document` et `profiles.credits_complete`.

### Fonctions SQL crédits
- **Consommation pro** : `consume_pro_credit(p_user_id, p_credit_type)`
- **Consommation particulier** : `consume_particulier_credit(p_user_id, p_credit_type)` (atomique, contre race condition multi-onglets)
- **Remboursement crédit interne pro** : `refund_pro_credit(p_user_id, p_credit_type)` (analyse plantée)
- **Reset cycle abo** : `reset_pro_subscription_credits(p_subscription_id)`
- **Cumul upgrade** : `upgrade_pro_subscription_credits(p_subscription_id, p_new_plan)`
- **Incrément promo** : `increment_promo_uses(code_id)` (réutilisée par webhook particulier V3.1)

### Contraintes BDD
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA
- `analyses.status` : CHECK autorise `pending, processing, queued, completed, failed`
- `user_notifications.analysis_id` : UUID nullable, FK vers `analyses(id)` ON DELETE SET NULL
- `profiles.cgv_pro_accepted_at` : TIMESTAMPTZ nullable (date d'acceptation CGV Pro)
- `profiles.cgv_pro_version` : TEXT nullable (version CGV acceptée, ex: "v2.3")

---

## 📐 Règles de notation — Score /20

| Catégorie | Max |
|-----------|-----|
| Travaux | 5 pts |
| Procédures | 4 pts |
| Finances | 4 pts |
| Diagnostics privatifs | 4 pts |
| Diagnostics communs | 3 pts |
| **TOTAL** | **20 pts** |

---

## ⏳ Backlog — En attente

### 🔥 Priorité haute (avant lancement public Pro)

1. **Push MandatairesPage.tsx v6** (1066 lignes) sur GitHub + test visuel desktop ET mobile
2. **Régénérer service_role key** (compromise dans screenshots session 11 mai) + recréer le cron avec nouvelle clé
3. **Annuler abo Stripe du compte test fantôme** `cus_UUgPam3KYnmpzC` (Alexandre) pour stopper events FK qui plantent
4. **Annuler abo Stripe** de `publicite92320@gmail.com` (compte supprimé en BDD mais abo encore actif → events FK)
5. **Test E2E pro complet** : souscription Découverte → upgrade Starter → upgrade Power → downgrade → achat unitaire → remboursement → confirmer remontée admin pour chaque étape
6. **Custom text Stripe Dashboard** → Settings → Branding (mention CGV Pro au checkout)
7. **Liens CGV Pro** dans footer principal + Dashboard Pro → Mon compte → Documents légaux
8. **Validation CGV Pro par avocat** spécialisé (budget 300-500€)
9. **Test résiliation immédiate** sur `alexandre.rt25@gmail.com` via Stripe Dashboard pour valider le mail V7
10. **Test cycle complet de notifications** : analyse réussie particulier → cloche cliquable + mail avec CTA partage / analyse réussie pro → cloche cliquable + PAS de mail / analyse échouée particulier → cloche + mail orange / analyse échouée pro → cloche seule
11. **Test popup consentement CGV Pro** : 1er paiement pro doit déclencher popup → cocher case → paiement passe → 2e paiement = pas de popup. Vérifier badge admin (vert vs orange) sur fiche client

### Court terme
12. **Soumission 47 URLs guides** Google Search Console (quota dépassé le 5 mai)
13. **Réactiver le cron `sync-stripe-payments`** quand vieux paiements problématiques expirés
14. **Fix bug racine webhook** : remplacer `if (existing) update else insert` dans `upsertProSubscription` par `.upsert({ onConflict: 'stripe_subscription_id' })` atomique
15. **Fix bug `stripe_payment_id = NULL`** sur upgrades : forcer récupération `payment_intent` même quand `default_incomplete`
16. **Fix bug scope `supabase`** dans webhook particulier (ligne 142 — déclaré dans serve() mais utilisé hors)
17. **Code promo lancement** "1 analyse offerte" pour campagnes marketing (audience = Pros, quota limité)
18. **Badge dynamique fiche client admin** — Upgrade en cours / Bascule programmée (15 min, lecture `pro_subscriptions.scheduled_plan_change`)
19. **DPA / Annexe RGPD article 28** (obligatoire dès qu'une agence sérieuse réclame)
20. **Section 11.4 Force majeure** à ajouter dans CGV Pro
21. **Article 7.4 usages interdits explicites** dans CGV Pro
22. **Branding Stripe Checkout** : logo + couleurs + domaine `pay.verimo.fr`
23. **Auto-envoi factures par email Stripe** : activer toggles "Paiements réussis" + "Remboursements" dans Stripe Settings → Customer emails
24. **Rate limiting** (faille #7 audit sécurité) avant 1ère grosse campagne pub
25. **Bannir le mot "co-brandé/co-branding" du site** progressivement (HomePage, ExemplePage, ProPage, TarifsPage si présent) — remplacer par "à votre image"

### Moyen terme
26. **Personnalisation rapports Power "à votre image"** (2-3h dev, infra à 70%) — affichage logo + nom agence sur RapportPage + RapportPartagePage
27. **Bannière persistante "Paiement à régulariser"** sur dashboard si une facture upgrade plante
28. **Popup bienvenue pro 1ère connexion** (onboarding)
29. **Veille réglementaire** prompt analyser-run
30. **Compare Verimo redesign verdict** (split par bien, "Bien 1"/"Bien 2", forces/issues 2 colonnes)
31. **Mention CGV discrète** dans popup TVA upgrade (sans checkbox bloquante)
32. **SLA pour clients grands comptes**
33. **Investiguer erreurs Deno.core.runMicrotasks** dans logs edge functions (faux positif a priori)
34. **Mailjet tracking erreurs**
35. **Admin support inbox redesign** (split-view dans AdminPage.tsx : liste clients gauche, conversation droite, grouping par user, actions Résoudre/Archiver/Supprimer, onglet Archivés)
36. **Mode clair/sombre toggle global** (chantier quand 10+ clients pros)
37. **Bug race condition redirect post-checkout** (cache navigateur garde ancien rôle, F5 résout)

### Pages métier — créer plus tard
38. **`/pro/investisseurs`** : landing dédiée investisseurs immobiliers (locatif, patrimoine, rendement)
39. **`/pro/marchands`** : landing dédiée marchands de bien (achat-revente, division, marge)
40. **`/pro/notaires`** : landing dédiée notaires (étude, clerc, négociateur)
41. Une fois les 4 landings existantes, possibilité de simplifier `/pro` en hub court avec grille 2x2

### Stratégique pro
42. **Compte Agence multi-utilisateurs** (5-15j dev) — quand 2-3 agences clientes
43. **B2B targeting mandataires indépendants** (IAD, Capifrance, SAFTI)
44. **Speak to 10 real pro prospects** avant de coder pro-specific features
45. **Projections honnêtes** : 25k€ MRR sur 18-24 mois, mix solo + agences

### Infra
46. **Vérifier upgrade Supabase Compute NANO → MICRO** (gratuit avec plan Pro, double RAM + Disk IO Budget)
47. **SIRET sur factures unitaires** : option B `customer.invoice_settings.custom_fields`
48. **Toggles Stripe Checkout** : Politique remboursement / CGV / Coordonnées support

### Démarchage / funnel pro
49. **Créer un exemple de rapport Verimo anonymisé** en PDF — doc le plus puissant en conversion B2B
50. **Rédiger 3 email templates** de démarchage : cold mail / follow-up sans réponse / post-démo
51. **Argumentaire / objections-réponses** pour préparer les démos (RGPD, données client, résiliation, etc.)

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai 2026)

- **Session 17 mai 2026 ⭐ : Feature DPE Travaux préconisés** (détail section dédiée plus haut)
  - Extraction et affichage des 2 packs de travaux DPE (essentiels + à envisager) + évolution étiquette projetée
  - 3 fichiers modifiés : `analyser-run/index.ts` (v10→v11), `RapportPage.tsx` (TabLogement), `DocumentRenderer.tsx` (RendererDDT)
  - Découverte clé : l'analyse simple utilise `DocumentRenderer.tsx`, pas `TabLogement` — il fallait modifier les 2 endroits
  - Architecture sans SQL : enrichissement du JSONB existant uniquement
- **Session 16 mai 2026 (~6h)** ⭐ : **CGV Pro popup + refonte /pro/rejoindre + refonte profonde MandatairesPage**
  - SQL `profiles.cgv_pro_accepted_at` + `cgv_pro_version` + index
  - Popup CGV Pro obligatoire avant 1er paiement pro (3 actions interceptées : subscribe, buyUnit, openUpgradeFlow). Bloc admin affichage ✅ vert ou ⚠️ orange sur fiche client
  - Refonte `/pro/rejoindre` (770→1054 lignes) : placeholders génériques, SectionBlock par profil, SiretLookup via API gouv recherche-entreprises (workflow gris → valider → vert), GridSelectResponsive
  - Renommage URLs : `/rejoindre` → `/pro/rejoindre`, `/pro/mandataires` → `/pro/agents-mandataires`
  - MandatairesPage v6 refonte profonde (676→1066 lignes) :
    - Hero split 50/50, trait surligné animé sur "répond à tout", retrait 2 confettis du milieu
    - Ruban stats : "24h/24" remplace "15+ docs", "100% à votre image" remplace "100% co-brandé"
    - Palette confettis Verimo unifiée
    - Scénario 2 reformulé (mandat) + bénéfice "Prix appuyé sur les vrais chiffres du bien"
    - Nouveau scénario BONUS "L'envoi en 1 clic" avec 2 mockups (MockupSendPopup + MockupClientEmail logo Laforêt stylisé)
    - Section "3 étapes" entièrement refondue : badge pilule pleine dégradé bleu (16px), gros titres style scénarios, flèches → entre cartes, tagline "Aussi simple que ces 3 étapes. Aussi rapide qu'un café."
    - CTA final reprend gradient identique au CTA bas ProPage + trait bleu animé sur "recommande"
    - Fond unifié `#fafbfd` partout au milieu (élimine les coupures horizontales nettes)
    - Mobile : 2 breakpoints, téléphones Hero scale 0.55, stats grille 2×2, scénarios texte d'abord + téléphone après via `:has()`, scénario envoi en stack vertical mobile
  - Décision UX : mot "co-brandé" banni progressivement → "à votre image"
  - Décision UX : bandeau Avant/Après Verimo testé puis retiré
- **Session 15 mai 2026 (~6h)** ⭐ : **Système notifications cliquables + Refonte ProPage et MandatairesPage v1**
  - 3 livraisons techniques : SQL `user_notifications.analysis_id` + edge function `analyser-run` v10 + fonction SQL `consume_particulier_credit` atomique
  - Notifications cloche cliquables systématiques en fin d'analyse réussie
  - Mail particulier "Analyse prête" avec CTA "Partager Verimo" — pas de mail pour pros
  - Fix race condition deductCredit particulier
  - Fix bug refundCredit pro (branche pro correcte dans `analyser-run`)
  - Message timeout 10 min honnête + `notifyAnalysisFailure`
  - ProPage : suppression témoignages + fausses stats, hero adouci, cartes profils + flottement
  - MandatairesPage v1 : refonte from scratch style Jinka (2097→676 lignes) — base de la v6 actuelle
- **Session 14 mai 2026 (nuit, ~3h)** ⭐ : **Plaquette PDF démarchage Pro V7 finalisée** (6 slides, mockups iPhone + MacBook, QR code)
- **Session 13 mai 2026 (~5h)** : Page `/rejoindre` multi-step 4 étapes + Mailjet configuré, Edge Function `send-pro-request-confirmation`
- **Session 12 mai 2026 (~5h)** : Refonte UI compte pro Dashboard + refonte massive analyse COMPROMIS, schéma JSON enrichi, 30 règles métier prompt
- **Session 11-12 mai 2026 (nuit, ~6h)** ⭐ : Mail résiliation pro (V7), bannières dashboard, codes promo ciblage audience, popup "Besoin d'aide", UX "Compléter mon dossier" queued, objectif 25k€ MRR défini, spec Feature Agence + Co-branding
- **Session 11 mai 2026 (nuit, ~3h30)** ⭐ : Bug paiements résolu + filet de sécurité `sync-stripe-payments` V2 + cron pg_cron
- **Session 10-11 mai 2026 (nuit)** : 📜 CGV Pro V2.3 + admin alerts + recherche juridique
- **Session 10 mai 2026 (soir)** : 🔐 Audit sécurité complet du système de paiement + refonte CA admin V2
- **Sessions précédentes mai 2026** : Stripe pro complet, facturation B2B, table payments

### Sessions plus anciennes
- **Avril 2026** : Stripe production, admin support inbox split-view, pages légales, SEO complet, dossiers pro complets, credit_grants + trigger, popups succès, page Guides
- **Antérieurement** : Conception initiale, prompt enrichi, scoring déterministe /20, comparaison v1, AdminPage, dashboard pro, edge functions, config DNS pro.verimo.fr

---

## 🎯 Prochaine session — Actions prioritaires

### Côté push immédiat (en attente d'Alex)
1. **Tester feature DPE Travaux préconisés** : 1 analyse simple sur DPE Bouyges + 1 analyse complète sur diagnostics Benoist-Lucy. Vérifier rendu : titre dynamique 🎯 "Pour passer de X à Y", évolution étiquette (3 cercles), cards Pack 1 + Pack 2 avec sous-titres "Pour passer de X à Y", label "MONTANT ESTIMÉ", emojis par poste, badges copro/urbanisme, footer aides
2. **Push MandatairesPage.tsx v6** (1066 lignes) sur GitHub + test visuel desktop ET mobile
3. **Test popup CGV Pro** sur compte test pro (1er paiement → popup → coche → paiement passe → 2e paiement plus de popup, badge admin OK)
4. **Tester URLs renommées** : `/pro/rejoindre` et `/pro/agents-mandataires` fonctionnent partout

### Côté technique/produit (en attente)
4. **Annuler abos Stripe fantômes** (`cus_UUgPam3KYnmpzC` + `publicite92320@gmail.com`)
5. **Test mail résiliation** sur `alexandre.rt25@gmail.com` via Stripe Dashboard
6. **Régénérer service_role key** + recréer le cron Supabase
7. **Test E2E complet du cycle pro** : souscription / upgrade / downgrade / unitaire / remboursement
8. **Test cycle complet notifications** : particulier réussi (cloche + mail CTA partage) + pro réussi (cloche seule) + particulier échec (cloche + mail orange) + pro échec (cloche seule)
9. **Soumettre les 47 URLs guides** Google Search Console
10. **Réactiver le cron sync-stripe-payments** quand vieux paiements expirés

### Côté funnel pro / démarchage
11. **Créer un exemple de rapport Verimo anonymisé** en PDF — doc le plus puissant en conversion B2B
12. **Rédiger 3 email templates** de démarchage : cold mail / follow-up sans réponse / post-démo
13. **Argumentaire / objections-réponses** pour préparer les démos (RGPD, données client, résiliation, etc.)
14. **Pages dédiées investisseur/marchand/notaire** quand vraies acquisitions clients dans ces segments

**Méthode** :
1. Coller ce context.md en début de conversation
2. Valider chaque chantier avant de coder
3. Une étape à la fois, fichiers livrés via `present_files` depuis `/mnt/user-data/outputs/`
4. Pas de code sans accord
5. Tester sur compte pro `alexandre.rt25@gmail.com` après chaque étape
