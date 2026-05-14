# VERIMO — Contexte projet — 14 mai 2026

> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## 🛠️ Méthode de travail avec Alex

- **Profil** : débutant développement, modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- **Repo** : `github.com/emilio92100/analymoCD`
- Claude clone `https://github.com/emilio92100/analymoCD.git` et livre les fichiers **complets** via `present_files` depuis `/mnt/user-data/outputs/`
- Alex push manuellement sur GitHub
- **Vercel redéploie auto** le frontend après chaque push GitHub
- ⚠️ **Edge Functions Supabase NE sont PAS déployées par push GitHub** — il faut aller manuellement dans Supabase → Edge Functions → coller le code → Deploy. Bug récurrent : Alex push, l'erreur persiste, c'est parce que l'edge function n'est pas redéployée
- **Ne jamais coder sans accord préalable** — toujours échanger et valider avant de toucher au code
- **Une étape à la fois** — pas 10 actions d'un coup
- **Réponses courtes et concises** — pas de pavés sauf question technique précise
- **Pas de QCM cascade** — quand Alex demande un choix, lui en proposer 2-4 max
- **Challenger les sur-ingénieries** — Alex préfère faire simple
- **Mot "IA" / "AI" banni** des pages publiques Verimo (HomePage, ExemplePage, TarifsPage, MethodePage, ContactPage, ProPage, ContactProPage, RapportPage, Navbar, Footer) — utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte". AI uniquement autorisé dans admin, edge functions, prompts, logs, context.md.
- **Tests live avec vraie carte CB d'Alex** (pas Visa 4242)
- Compte test live actuel : Jean DUMONT / ARTY CONSEIL (acct_1TIateBesXB76oWE)
- User test pro : `publicite92320@gmail.com` (ID `217468f6-0f2b-4487-865e-a277cc600e45`) — ⚠️ **À nettoyer** : compte supprimé en BDD mais abo Stripe encore actif, génère des events FK qui plantent
- Nouveau compte test 11 mai : `alexandre.rt25@gmail.com` (customer Stripe `cus_UUgPam3KYnmpzC`)

---

## 📦 Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière, modificatifs RCP, fiche synthétique...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour appartements et maisons.

**Slogan** : *Vos documents décryptés, votre décision éclairée.*
**H1 HomePage** : *Analysez vos documents immobiliers avant de signer.*
**Cible** : Acheteurs particuliers (primo-accédants, RP) et professionnels (agents immo, investisseurs, marchands de bien, notaires, mandataires indépendants).

---

## 💰 Tarification

### Particuliers
- 4,90€ → 1 crédit analyse simple (1 doc) — PAS de score /20
- 19,90€ → 1 crédit analyse complète (jusqu'à 15 docs)
- 29,90€ → 2 crédits (Pack 2 biens)
- 39,90€ → 3 crédits (Pack 3 biens)
- Crédits jamais expirés

### Pros — Abonnements mensuels HT (✅ validé session 12 mai)
| Plan | Prix HT/mois | Complètes | Simples |
|------|-------------|-----------|---------|
| Découverte | 19,90€ | 1 | 3 |
| Starter | 49,90€ | 5 | 15 |
| Power | 89,90€ | 10 | 30 |

**Achats unitaires pro (réservés aux abonnés)** : Complète 9,90€ HT · Simple 2,90€ HT

**Argumentaire commercial Découverte** : 1,30€ "surcoût" vs achat unitaire (19,90€ vs 18,60€) défendable via dashboard pro, support dédié, tarif préférentiel à 9,90€ (vs 19,90€ particulier). Rentable dès 2 analyses supplémentaires dans l'année.

**Coûts réels Claude API** : ~0,50€/analyse complète (médiane), ~0,15€/analyse simple. Mais Alex estime à **2,50€/complète** et **0,40€/simple** en sécurité (marges saines à 55-90%).

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
  - `pro@verimo.fr` → email B2B (UNIQUEMENT relations pros et CGV Pro) — ✅ mailbox configurée et fonctionnelle (info confirmée 12 mai)
  - `notification@verimo.fr` → Mailjet particuliers
  - `contact@verimo.fr` → emails sortants pros (avec nom agent dans body)

---

## ⚙️ Edge Functions Supabase (production)

| Nom | Rôle | Version |
|-----|------|---------|
| `analyser` | Lance une analyse — gère la queue Anthropic 503 | v8 |
| `analyser-run` | Worker qui traite l'analyse en background | v9 |
| `analyser-retry` | Cron pg_cron 5 min — retraite les analyses queued (12 retries max) | — |
| `comparer` | Compare 2 ou 3 rapports | — |
| `admin-user-management` | Actions admin (create, invite, delete, reset password) | — |
| `pro-checkout-create` | Stripe pro : subscribe / preview_upgrade / buy_unit / cancel / cancel_scheduled_change / reactivate / billing_portal / list_invoices | V3 |
| `stripe-webhook-pro` | Webhook Stripe pro (5 events) + mail résiliation | **V7** |
| `stripe-webhook` | Webhook Stripe particuliers (checkout.session.completed) | **V3.1** |
| `create-checkout-session` | Stripe particuliers (checkout) + audience promo | **V3** |
| `sync-stripe-payments` | Filet de sécurité — sync Stripe → table `payments` toutes les 5 min via pg_cron | **V2** — ⚠️ **DÉSACTIVÉ temporairement** (cf section bug paiements ci-dessous) |

⚠️ **Rappel critique** : push GitHub ne déploie pas les edge functions → toujours redéployer manuellement dans Supabase Studio.

### Webhooks Stripe configurés (Stripe Dashboard)

- **Verimo - Pro** → `stripe-webhook-pro` : 4 events (checkout.session.completed, customer.subscription.deleted, customer.subscription.updated, invoice.paid) + `charge.refunded`
- **Verimo - Particuliers** → `stripe-webhook` : checkout.session.completed + `charge.refunded`

> Note : `checkout.session.completed` est envoyé aux 2 webhooks (config Stripe). V7/V3.1 contiennent un filtre qui fait skip silencieux si le paiement n'est pas pour ce webhook.

### Cron Supabase pg_cron actif

```
jobname = 'sync-stripe-payments-every-5min'
schedule = '*/5 * * * *'
id = 2 dans cron.job
```

⚠️ **Service_role key compromise** durant la session du 11 mai (partagée dans screenshots). À régénérer + recréer le cron avec la nouvelle clé.

### ⚠️ Cron `sync-stripe-payments` DÉSACTIVÉ temporairement (session 11 mai 2026 nuit)

Pendant les tests, le cron polluait les logs avec 9 erreurs/tour sur des paiements problématiques.
SQL pour désactiver : `SELECT cron.unschedule('sync-stripe-payments-every-5min');`
Le cron `analyser-retry-5min` reste actif (essentiel pour analyses queued).
**À réactiver dans 3 jours** quand les vieux paiements problématiques sortiront de la fenêtre LOOKBACK_DAYS=3.

---

## 🗺️ Routes principales

```
/                              → HomePage
/pro                           → ProPage
/tarifs                        → TarifsPage
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
- Bouton "Annuler ce changement" sur la carte du plan actif si scheduled_plan_change rempli

### ⚠️ Bug paiement Stripe identifié 11 mai (NON résolu, workaround manuel)

**Symptôme** : `stripe_payment_id = NULL` dans `payments` pour les paiements d'upgrade (Starter, Power) → webhook `charge.refunded` ne peut pas matcher → CA admin pas mis à jour quand remboursement fait dans Stripe.

**Cause racine** : `invoice.payment_intent` est parfois vide/undefined au moment où le webhook `invoice.paid` arrive (notamment avec `payment_behavior: 'default_incomplete'` utilisé sur les upgrades). Le code `recordProPayment` stocke alors `stripe_payment_id = NULL`.

**Décision Alex (11 mai)** : ne pas refondre maintenant. Workflow manuel : SQL UPDATE quand remboursement fait dans Stripe.
```sql
UPDATE payments SET status='refunded', refunded_amount=amount, refunded_at=NOW()
WHERE id IN ('xxx');
```
Le bug NULL n'affecte pas les renouvellements ni l'expérience client (factures Stripe accessibles via API directe).

**Bug secondaire** : webhook particulier `stripe-webhook/index.ts` ligne 142 → `const supabase` déclaré DANS `serve()` (scope local) → `ReferenceError` quand `handleChargeRefunded` (déclaré hors serve) est appelé. À fixer plus tard.

### Bandeau past_due
- Confirmé actif sur Dashboard Pro (lignes 6438-6489 DashboardProPage.tsx)
- Rouge, sur toutes pages, bouton "Mettre à jour ma carte" → `openBillingPortal` Stripe
- Bloque changement plan si past_due
- Stripe Smart Retries actif (4 tentatives sur 3 semaines), emails auto Stripe activés

---

## 🔐 Sécurité paiements (✅ TERMINÉ)

8 failles identifiées et corrigées. Tous fixés et déployés en prod.

### Reste dans l'audit (non bloquant)

- **#7 Rate limiting** : à activer avant la 1ère grosse campagne pub.

---

## ✅ CA admin V2 + remboursements + sync auto (TERMINÉ)

- Schéma `payments` enrichi : `customer_type`, `amount_ht`, `refunded_amount`, statuts (`completed`, `refunded`, `partially_refunded`)
- Webhook `charge.refunded` ajouté sur les 2 webhooks
- Calcul CA admin réécrit pour lire uniquement `payments`, filtrer status refunded, déduire `refunded_amount`
- Affichage HT/TTC universel sur AdminPage (Pros : HT en premier, Particuliers : TTC)
- Décisions appliquées : Q1 "Remboursé partiellement : X€ sur Y€", Q2 retirer crédits si annulation totale, Q3 CA net uniquement

### Suppression user pro
- `auth.admin.signOut(user_id, 'global')` AVANT `deleteUser`
- ⚠️ **Risque** : code actuel `admin-user-management/index.ts` ligne 668-679 NE touche PAS à Stripe → si user supprimé sans annulation abo Stripe préalable, l'abo continue → events FK plantent en boucle (cf compte test `publicite92320@gmail.com`)
- ALTER NULL sur user_id de payments / pro_unit_purchases, FK SET NULL, backfill customer_email/name

---

## 🆕 Sessions 11-12 mai 2026 (session marathon ~6h) ⭐

### 1. Mail de résiliation pro (✅ DÉPLOYÉ - stripe-webhook-pro V7)

Mail automatique envoyé quand `cancel_at_period_end` passe de `false` à `true` (résiliation programmée). Couvre :
- Client résilie depuis dashboard pro
- Admin annule via Stripe Dashboard "Cancel at end of period"

**Fichier** : `supabase/functions/stripe-webhook-pro/index.ts` V7
- Fonction `sendMailjet()` (expéditeur `pro@verimo.fr`, vars env `MJ_API_KEY` + `MJ_SECRET_KEY`)
- Template HTML `buildCancellationEmail(prenom, planLabel, endDateFr)` — style identique aux autres mails (gradient `#0a1f2d → #1a4a5e`)
- Helper `formatDateFr(date)` — affiche "11 juin 2026"
- Modif `handleSubscriptionUpdated` : `select` étendu à `cancel_at_period_end`, comparaison avant/après, mail envoyé une seule fois

### 2. Bannières dashboard refondues (✅ DÉPLOYÉ)

**SQL migration** : `ALTER TABLE banners ADD COLUMN audience TEXT DEFAULT 'all' CHECK IN ('all','pro','particulier','specific')` + `target_user_id UUID REFERENCES profiles(id)` + index.

**Admin (BannerTab dans AdminPage.tsx)** :
- Liste des bannières actives en haut (avec audience, date, boutons modifier/supprimer)
- Formulaire en bas : Type (info/warning/success) + Audience (4 boutons : Tous/Pro/Particulier/Client spécifique) + recherche client si "spécifique" (debounce 250ms par email ou full_name) + textarea + aperçu live
- Édition possible (clic ✏️ → form pré-rempli, scroll auto)

**Client (DashboardBanner + ProDashboardBanner)** :
- Filtre selon role : `all` = tous, `pro` = pros, `particulier` = non-pros, `specific` = target_user_id match
- Dismiss journalier via `sessionStorage.setItem('verimo_banner_dismiss_{bannerId}_{userId}', 'YYYY-MM-DD')`
- ⚠️ `ProDashboardBanner` était inexistant côté pro → créé dans cette session

**Design final couleurs vives** :
```js
info:    { bg: '#0284c7', borderLeft: '#075985', iconBg: '#fff' }
warning: { bg: '#f97316', borderLeft: '#c2410c', iconBg: '#fff' }
success: { bg: '#16a34a', borderLeft: '#15803d', iconBg: '#fff' }
```
Carré icône blanc pur, bordure gauche 5px, texte blanc, emoji ℹ️ ⚠️ ✅

### 3. Codes promo avec ciblage audience (✅ DÉPLOYÉ)

**SQL migration** : `ALTER TABLE promo_codes ADD COLUMN audience TEXT DEFAULT 'all' CHECK IN ('all','pro','particulier')` + index.

**3 endroits de validation modifiés** :
- `AdminPage.tsx` : 3 boutons audience (Tous / Pros / Particuliers) dans formulaire création
- `Tarifs.tsx` (particulier) : check `audience === 'pro'` → erreur "Ce code est réservé aux comptes Pro."
- `DashboardProPage.tsx` (pro) : check `audience === 'particulier'` → erreur "Ce code est réservé aux comptes Particuliers."
- `create-checkout-session/index.ts` (backend) : double sécurité audience

**Notes importantes** :
- Codes type `credits` (1 analyse offerte) : PAS de Stripe — appliqués direct côté front (`handleApplyCredits` particulier, `handlePromoApply` pro). `create-checkout-session` PAS appelé pour ce type
- Codes type `percent`/`fixed` : Stripe coupon créé, passe par checkout session
- Quota global `max_uses` configurable, **1 fois max par compte** hardcodé (vérif anti-doublon table `promo_uses`)
- Popup succès pro déjà très joli (animation spring, emoji 🎉, "Code promo appliqué !")
- Particulier : toast en haut, plus discret

### 4. Fix bug crédit_type='both' "Les deux" (✅ DÉPLOYÉ)

**Bug** : option "Les deux" existait dans admin mais code ligne `const creditType = promo.credit_type === 'document' ? 'document' : 'complete';` traitait `'both'` comme `complete`. Donc user recevait 1 complète au lieu de 1 simple + 1 complète.

**Fix sans modif BDD** :
- `DashboardProPage.tsx` : 2 inserts `credit_grants` séparés ('complete' + 'document') quand `isBoth`. Popup : "🎉 +1 crédit Complète + 1 crédit Simple ajoutés"
- `Tarifs.tsx` : UPDATE simultané de `credits_complete` ET `credits_document`. Toast : "🎉 1 crédit complet + 1 crédit simple ajoutés"
- Compatibilité : codes existants 'both' fonctionneront correctement à la prochaine utilisation

### 5. Refonte UX popup "Besoin d'aide" (✅ DÉPLOYÉ)

**Cause** : popup affichait un spinner pendant requête Supabase (vérif si ticket ouvert), puis changeait de contenu en pleine animation → effet saccadé.

**Fix** : vérification BDD AVANT d'ouvrir le popup. Popup s'ouvre avec contenu déjà prêt.

Fichiers modifiés : `DashboardProPage.tsx` (refactor `__openHelp`, suppression state `helpCheckingTicket`), `DashboardPage.tsx` (idem).

### 6. Support.tsx — bouton "Nouveau ticket" supprimé (✅ DÉPLOYÉ)

Bouton "Nouveau ticket" en haut à gauche supprimé (redondant avec "Ouvrir un ticket" empty state + CTA en bas FAQ + "Besoin d'aide" en topbar).

### 7. UX queued "Compléter mon dossier" (✅ DÉPLOYÉ - RapportPage.tsx)

**Bug** : Le `ComplementModal` ne gérait PAS le cas `queued: true` retourné par `lancerAnalyseEdge`. Quand Claude était saturé, le modal affichait "Une erreur est survenue. Réessayez." au lieu du joli message d'attente.

**Fix** :
- Nouveau state `queued: string | null`
- Si `result.queued === true` → setQueued(message) au lieu de setError
- Nouvel écran orange "Dossier en file d'attente" avec icône Clock, message clair, encart info "Vous pouvez fermer cette fenêtre, vous serez notifié(e) par email et dans dashboard"

### 8. Fonction "Compléter mon dossier" — règles confirmées

- Délai : **7 jours** après analyse initiale (`regeneration_deadline`)
- Limite : **1 fois max** par analyse (bouton désactivé après usage via `complement_date` rempli)
- Coût : **gratuit pour le client**, ~0,50€ d'API Claude pour Alex
- Bandeau bleu "📎 Dossier mis à jour le X — N documents ajoutés"
- Code : `supabase/functions/analyser-run/index.ts` ligne 1378
- Mail envoyé si `fromRetry === true` (passage par queue), pas en flow rapide normal

### 9. Discussion pricing pro (✅ aucun changement décidé)

**Analyse approfondie** avec coûts réels Claude API (Sonnet 4.6 : $3/Mtok input, $15/Mtok output → ~0,40-0,50€ par analyse complète médiane). Coûts conservateurs retenus par Alex : **2,50€/complète, 0,40€/simple**.

| Plan | Prix HT | Crédits | Ratio | Coût API max | Marge € | Marge % |
|------|---------|---------|-------|-------------|---------|---------|
| Découverte | 19,90€ | 1C + 3S | 0,93x | 3,70€ | 16,20€ | 81% |
| Starter | 49,90€ | 5C + 15S | 1,86x | 18,50€ | 31,40€ | 63% |
| Power | 89,90€ | 10C + 30S | 2,07x | 37€ | 52,90€ | 59% |
| Unitaire C | 9,90€ | 1 | — | 2,50€ | 7,40€ | 75% |
| Unitaire S | 2,90€ | 1 | — | 0,40€ | 2,50€ | 86% |

**Conclusion** : pricing actuel cohérent globalement. Découverte légèrement faible mathématiquement (ratio 0,93x) MAIS défendable commercialement par "frais de service inclus" (dashboard, support, tarif préférentiel pour analyses supp). Rentable dès 2 analyses supplémentaires/an.

**Aucun changement appliqué.** Décision : observer les retours pros réels sur 2-3 mois avant d'ajuster.

### 10. Stratégie business définie (session 12 mai)

**Objectif business** : 25 000€ HT MRR/mois sur 18-24 mois. Mix réaliste :
- **Pros solos (240 clients)** : 80 Découverte + 100 Starter + 60 Power = ~12k€ MRR
- **Agences (65 clients)** : 40 Ag. Starter + 20 Ag. Pro + 5 Ag. Premium = ~13,5k€ MRR

**Phase 1 (maintenant → 20 pros)** : validation manuelle des comptes pro, pas de feature agence, parler aux 10 premiers pros pour valider proposition.

**Validation compte pro** : demander SIRET minimum + vérif activité immobilière via `annuaire-entreprises.data.gouv.fr` (1-2 min par demande).

**Marketing** : prévoir code promo "1 analyse offerte" pour campagnes (audience = Pros, quota limité).

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
- Toggle "Partager cette analyse avec mon agence" à la création (visibilité personnelle vs partagée)
- Bibliothèque agence des biens analysés (intelligence collective)

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

## 🔮 Feature Co-branding rapports Power (PRÉVUE PLUS TARD)

✅ **Infra à 70%** : `pro_logo_url` et `pro_company_name` existent en BDD, bucket `pro-logos` configuré, UI upload fonctionnelle dans dashboard pro.

❌ **Manque** : affichage du logo + nom d'agence sur :
- Page `RapportPage` (vue propriétaire)
- Page `RapportPartagePage` (lien public partagé aux clients)
- Pied de page "Analyse propulsée par Verimo" (soft co-branding)

**Effort réel restant** : 2-3h dev.

**Décision** : à activer uniquement pour Power (différenciateur Starter → Power).

**Argument commercial** : "Power, c'est le plan agence qui valorise votre marque auprès de vos clients."

---

## 📊 Architecture crédits (inchangée)

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions` (`credits_complete_total/used`, `credits_simple_total/used`)
2. **Achats unitaires** → `pro_unit_purchases` (avec `credits_remaining`)
3. **Crédits offerts** → `credit_grants` + trigger `apply_credit_grant`

### Fonctions SQL crédits
- **Consommation** : `consume_pro_credit(p_user_id, p_credit_type)`
- **Remboursement crédit interne** : `refund_pro_credit(p_user_id, p_credit_type)` (analyse plantée)
- **Reset cycle abo** : `reset_pro_subscription_credits(p_subscription_id)`
- **Cumul upgrade** : `upgrade_pro_subscription_credits(p_subscription_id, p_new_plan)`
- **Incrément promo** : `increment_promo_uses(code_id)` (réutilisée par webhook particulier V3.1)

### Contraintes BDD
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA
- `analyses.status` : CHECK autorise `pending, processing, queued, completed, failed`

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

1. **Régénérer service_role key** (compromise dans screenshots session 11 mai) + recréer le cron avec nouvelle clé
2. **Annuler abo Stripe du compte test fantôme** `cus_UUgPam3KYnmpzC` (Alexandre) pour stopper events FK qui plantent
3. **Annuler abo Stripe** de `publicite92320@gmail.com` (compte supprimé en BDD mais abo encore actif → events FK)
4. **Test E2E pro complet** : souscription Découverte → upgrade Starter → upgrade Power → downgrade → achat unitaire → remboursement → confirmer remontée admin pour chaque étape
5. **Implémenter case à cocher OBLIGATOIRE** "J'accepte les CGV Pro" avant paiement pro (stockage BDD : `cgv_pro_accepted_at` + `cgv_version` dans `pro_subscriptions`)
6. **Custom text Stripe Dashboard** → Settings → Branding (mention CGV Pro au checkout)
7. **Liens CGV Pro** dans footer principal + Dashboard Pro → Mon compte → Documents légaux
8. **Validation CGV Pro par avocat** spécialisé (budget 300-500€)
9. **Test résiliation immédiate** sur `alexandre.rt25@gmail.com` via Stripe Dashboard pour valider le nouveau mail (V7)

### Court terme
10. **Soumission 47 URLs guides** Google Search Console (quota dépassé le 5 mai)
11. **Réactiver le cron `sync-stripe-payments`** dans 3 jours (vieux paiements problématiques expirés)
12. **Fix bug racine webhook** : remplacer `if (existing) update else insert` dans `upsertProSubscription` par `.upsert({ onConflict: 'stripe_subscription_id' })` atomique
13. **Fix bug `stripe_payment_id = NULL`** sur upgrades : forcer récupération `payment_intent` même quand `default_incomplete`
14. **Fix bug scope `supabase`** dans webhook particulier (ligne 142 — déclaré dans serve() mais utilisé hors)
15. **Création compte pro avec validation SIRET** : workflow "demande → vérif annuaire-entreprises.data.gouv.fr → validation manuelle Alex"
16. **Code promo lancement** "1 analyse offerte" pour campagnes marketing (audience = Pros, quota limité)
17. **Badge dynamique fiche client admin** — Upgrade en cours / Bascule programmée (15 min, lecture `pro_subscriptions.scheduled_plan_change`)
18. **DPA / Annexe RGPD article 28** (obligatoire dès qu'une agence sérieuse réclame)
19. **Section 11.4 Force majeure** à ajouter dans CGV Pro
20. **Article 7.4 usages interdits explicites** dans CGV Pro
21. **Branding Stripe Checkout** : logo + couleurs + domaine `pay.verimo.fr`
22. **Auto-envoi factures par email Stripe** : activer toggles "Paiements réussis" + "Remboursements" dans Stripe Settings → Customer emails
23. **Rate limiting** (faille #7 audit sécurité) avant 1ère grosse campagne pub

### Moyen terme
24. **Co-branding rapports Power** (2-3h dev, infra à 70%) — affichage logo + nom agence sur RapportPage + RapportPartagePage
25. **Bannière persistante "Paiement à régulariser"** sur dashboard si une facture upgrade plante
26. **Popup bienvenue pro 1ère connexion** (onboarding)
27. **Veille réglementaire** prompt analyser-run
28. **Compare Verimo redesign verdict** (split par bien, "Bien 1"/"Bien 2", forces/issues 2 colonnes)
29. **Mention CGV discrète** dans popup TVA upgrade (sans checkbox bloquante)
30. **SLA pour clients grands comptes**
31. **Investiguer erreurs Deno.core.runMicrotasks** dans logs edge functions (faux positif a priori)
32. **Mailjet tracking erreurs**
33. **Admin support inbox redesign** (split-view dans AdminPage.tsx : liste clients gauche, conversation droite, grouping par user, actions Résoudre/Archiver/Supprimer, onglet Archivés)
34. **Mode clair/sombre toggle global** (chantier quand 10+ clients pros)
35. **Bug race condition redirect post-checkout** (cache navigateur garde ancien rôle, F5 résout)

### Stratégique pro
36. **Compte Agence multi-utilisateurs** (5-15j dev) — quand 2-3 agences clientes
37. **B2B targeting mandataires indépendants** (IAD, Capifrance, SAFTI)
38. **Speak to 10 real pro prospects** avant de coder pro-specific features
39. **Projections honnêtes** : 25k€ MRR sur 18-24 mois, mix solo + agences

### Infra
40. **Vérifier upgrade Supabase Compute NANO → MICRO** (gratuit avec plan Pro, double RAM + Disk IO Budget)
41. **SIRET sur factures unitaires** : option B `customer.invoice_settings.custom_fields`
42. **Toggles Stripe Checkout** : Politique remboursement / CGV / Coordonnées support

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai 2026)

- **Session 14 mai 2026 (nuit, ~3h)** ⭐ : **Plaquette PDF démarchage Pro V7 finalisée**
  - Travail méthodologique : définition objectif du doc (accroche froide → réservation démo 15 min), cible (tous pros immo), ton (pro et institutionnel), angles (rapport structuré + maîtrise visite)
  - 7 itérations PDF avant version finale propre : `Verimo Pro - Plaquette demarchage.pdf` (6 slides : Couverture → Situation → Avec Verimo → Avant la visite → Avant/Après → CTA)
  - Mockups téléphones complets (Dynamic Island + barre statut + écran complet, plus de troncature)
  - Notifications flottantes "Jinka-style" qui touchent les téléphones (Analyse terminée, 3h45 à prévoir, Reçu par votre client)
  - Mockup MacBook avec dashboard Pro (sidebar Verimo dark + KPIs + tableau biens)
  - Vrai QR code généré vers verimo.fr/rejoindre
  - Dégradé `/rejoindre` reproduit (couverture + CTA)
  - Logos Verimo transparents (RGBA) depuis repo, taille 50px sur fond clair, blanc sur fond sombre
  - MandatairesPage.tsx : **inversion ordre features 3 packs Pro** → simples affichées en premier (15, 30) puis complètes (5, 10) — plus vendeur visuellement
  - Liste docs à créer plus tard pour funnel pro : exemple rapport Verimo anonymisé, email templates démarchage, doc post-démo, argumentaire/objections
- **Session 13 mai 2026 (~5h)** : **Page /rejoindre + sections MandatairesPage**
  - Page `/rejoindre` multi-step 4 étapes pour prospects pros (validation email/téléphone, dégradé hero continu `#061826 → #f5f9fb`)
  - Mailjet configuré, Edge Function `send-pro-request-confirmation` déployée, emails fonctionnels (CONFIRMÉ par Alex)
  - ProPage.tsx : retrait "ou demander une démo (15 min)", CTA pointent vers /rejoindre
  - MandatairesPage : 2 sections ajoutées (MomentClientSection avec timeline scroll, SituationsCouvertesSection grille 3×2)
- **Session 12 mai 2026 (soir/nuit, ~5h)** : **Refonte Compromis + UI compte pro + audit système analyse**
  - Refonte UI compte pro Dashboard : 2 sections différenciées (Infos perso bleu / Identité pro ambre verrouillée)
  - Refonte massive analyse simple/complète COMPROMIS : schéma JSON enrichi, 30 règles métier prompt, refonte RendererCompromis en 10 sections UX
  - Nouvel onglet "Compromis" dans rapport complet (TabLogement)
  - Audit complet du système d'analyse Verimo (1578 lignes prompt, 14 types docs)
- **Session 11-12 mai 2026 (soir/nuit, ~6h)** ⭐ : **Session marathon bannières + codes promo + UX + pricing pro**
  - Mail résiliation pro (stripe-webhook-pro V7)
  - Bannières dashboard refondues avec couleurs vives (info bleu, warning orange, success vert) + ciblage audience (all/pro/particulier/specific) + ProDashboardBanner créé
  - Codes promo avec ciblage audience (Tous/Pros/Particuliers) sur 3 niveaux (admin + frontend pro + frontend particulier + backend create-checkout-session)
  - Fix bug `credit_type='both'` (Les deux) côté pro ET particulier
  - Popup "Besoin d'aide" fluidifié (vérif BDD AVANT ouverture)
  - Support.tsx bouton "Nouveau ticket" supprimé (redondant)
  - UX "Compléter mon dossier" : gestion `queued: true` ajoutée dans ComplementModal (écran orange "En file d'attente")
  - Analyse pricing pro complète : pricing actuel validé inchangé (Découverte 19,90€/Starter 49,90€/Power 89,90€), argumentaire commercial Découverte construit
  - Objectif business défini : 25k€ MRR sur 18-24 mois, mix pros solos + agences
  - Spec Feature Agence définie (à dev plus tard, 5-15j)
  - Spec Co-branding définie (infra à 70%, 2-3h restantes)
  - Discussion stratégie validation manuelle comptes pro avec SIRET (annuaire-entreprises.data.gouv.fr)
  - Cron `sync-stripe-payments` DÉSACTIVÉ temporairement (polluait logs)
- **Session 11 mai 2026 (nuit, ~3h30)** : ⭐ **Bug paiements résolu + filet de sécurité opérationnel**
  - Identification race condition entre webhooks Stripe parallèles
  - Création edge function `sync-stripe-payments` V2 (411 lignes)
  - Configuration cron pg_cron `*/5 * * * *` (id=2)
  - Tests validés sur 23,88€, 3,48€, 4,90€ refunds
- **Session 10-11 mai 2026 (nuit)** : 📜 **CGV Pro V2.3 + admin alerts + recherche juridique**
- **Session 10 mai 2026 (soir)** : 🔐 **Audit sécurité complet du système de paiement** + refonte CA admin V2
- **Session 10 mai (matin)** : Suite fix Stripe pro, refonte UX downgrade complet
- **Sessions précédentes mai 2026** : Stripe pro complet, facturation B2B, table payments
- **Session 30 (7 mai 2026)** : RapportPage logique RCP, KPI dashboard, archivage dossiers pro

### Sessions plus anciennes (avril 2026)
- **Sessions 25-29** : Stripe production, admin support inbox split-view, pages légales, SEO complet
- **Sessions 21-24** : Dossiers pro complets, credit_grants + trigger, code promo, popups succès, page Guides
- **Sessions 1-20** : Conception initiale, prompt enrichi, scoring déterministe /20, comparaison v1, AdminPage, dashboard pro, edge functions, config DNS pro.verimo.fr

---

## 🎯 Prochaine session — Actions prioritaires

### Côté funnel pro / démarchage (suite session 14 mai)
1. **Pousser sur GitHub** : `MandatairesPage.tsx` (inversion simples/complètes), `App.tsx` (sans pitch-mandataires)
2. **Créer un exemple de rapport Verimo anonymisé** en PDF — doc le plus puissant en conversion B2B
3. **Rédiger 3 email templates** de démarchage : cold mail / follow-up sans réponse / post-démo
4. **Argumentaire / objections-réponses** pour préparer les démos (RGPD, données client, résiliation, etc.)

### Côté technique/produit (en attente)
5. **Annuler abos Stripe fantômes** (`cus_UUgPam3KYnmpzC` + `publicite92320@gmail.com`)
6. **Test mail résiliation** sur `alexandre.rt25@gmail.com` via Stripe Dashboard
7. **Régénérer service_role key** + recréer le cron Supabase
8. **Test E2E complet du cycle pro** : souscription / upgrade / downgrade / unitaire / remboursement
9. **Case à cocher CGV Pro obligatoire** avant paiement pro (cgv_pro_accepted_at + cgv_version)
10. **Workflow validation compte pro** : formulaire avec SIRET + vérif annuaire-entreprises.data.gouv.fr
11. **Soumettre les 47 URLs guides** Google Search Console
12. **Réactiver le cron sync-stripe-payments** quand vieux paiements expirés

**Méthode** :
1. Coller ce context.md en début de conversation
2. Valider chaque chantier avant de coder
3. Une étape à la fois, fichiers livrés via `present_files` depuis `/mnt/user-data/outputs/`
4. Pas de code sans accord
5. Tester sur compte pro `alexandre.rt25@gmail.com` après chaque étape
