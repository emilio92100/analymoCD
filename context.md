# VERIMO — Contexte projet — 15 mai 2026

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
**Cible** : Acheteurs particuliers (primo-accédants, RP) et professionnels (agents immo, mandataires, investisseurs, marchands de bien, notaires).

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

⚠️ **Tarifs pros JAMAIS affichés publiquement** — ni sur /pro, ni sur /tarifs, ni sur /pro/mandataires. Validation manuelle des comptes + démo perso. Décision confirmée session 15 mai.

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
| `analyser-run` | Worker qui traite l'analyse en background | **v10** (15 mai) |
| `analyser-retry` | Cron pg_cron 5 min — retraite les analyses queued (12 retries max) | — |
| `comparer` | Compare 2 ou 3 rapports | — |
| `admin-user-management` | Actions admin (create, invite, delete, reset password) | — |
| `pro-checkout-create` | Stripe pro : subscribe / preview_upgrade / buy_unit / cancel / cancel_scheduled_change / reactivate / billing_portal / list_invoices | V3 |
| `stripe-webhook-pro` | Webhook Stripe pro (5 events) + mail résiliation | **V7** |
| `stripe-webhook` | Webhook Stripe particuliers (checkout.session.completed) | **V3.1** |
| `create-checkout-session` | Stripe particuliers (checkout) + audience promo | **V3** |
| `send-pro-request-confirmation` | Mail confirmation prospect + notif interne `pro@verimo.fr` | — |
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
/pro                           → ProPage (4 onglets profils : Agent/Mandataire, Investisseur, Marchand, Notaire)
/pro/mandataires               → MandatairesPage (landing dédiée agents/mandataires, refonte 15 mai)
/tarifs                        → TarifsPage (particuliers uniquement, pas de tarifs pros publics)
/exemple                       → ExemplePage
/methode                       → MethodePage
/guides                        → GuidesPage
/cgv-pro                       → CGVProPage (B2B, scroll spy, 14 sections)
/rejoindre                     → page multi-step prospects pros (4 étapes)
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

## 🆕 Session 15 mai 2026 (~6h) ⭐ — Système de notifications + Refontes ProPage et MandatairesPage

### 1. Audit complet du système nouvelle analyse (✅ FAIT)

3 bugs réels identifiés dans le tunnel d'analyse :
- 🚨 **Race condition `deductCredit` particulier** (useCredits.ts) : SELECT puis UPDATE non atomique → exploitable via multi-onglets pour avoir 2 analyses pour 1 crédit
- 🚨 **Bug refundCredit pro dans `analyser-run`** : la fonction `refundCredit` traite tout le monde comme particulier (UPDATE direct sur `profiles.credits_complete`) au lieu d'appeler `refund_pro_credit` pour les pros. Pro qui plante à l'étape 2 → crédit perdu, support manuel obligatoire
- ⚠️ **Message timeout 10 min mensonger** : disait "réessayez avec 8 documents max" + "crédit remboursé" alors que l'analyse continue en background et qu'aucun remboursement n'est déclenché côté front

### 2. Livraison 1 — Notifications cloche cliquables (✅ DÉPLOYÉ)

**SQL Supabase** :
```sql
ALTER TABLE user_notifications 
ADD COLUMN IF NOT EXISTS analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL;
```

**Edge function `analyser-run` v10** :
- `insertNotification(userId, title, message, analysisId?)` — param optionnel
- Si fourni → stocké en BDD ; sinon → null (backward compat avec notifs existantes queue/stripe-webhook-pro)
- `notifyAnalysisReady` passe désormais `analyseId` à `insertNotification` → notif cliquable

**Frontend** : `DashboardPage.tsx` + `DashboardProPage.tsx`
- Type `dbNotifications` étendu avec `analysis_id: string | null`
- `dbNotifications.map(n => ({..., analysisId: n.analysis_id || ''}))` → passé à la cloche
- Si `analysisId` non vide → notif cliquable avec icône verte ✓, redirige vers `/rapport?id=XXX`
- Si `analysisId` vide (queue overload, échec, stripe past_due) → notif non-cliquable avec icône orange 🔔

### 3. Livraison 2 — Notification cloche systématique + mail particulier (✅ DÉPLOYÉ)

**Avant** : `notifyAnalysisReady` appelée seulement si `fromRetry === true` (analyse passée par queue). Donc 99% des analyses réussies n'envoyaient AUCUNE notification.

**Maintenant** : `notifyAnalysisReady` appelée systématiquement en fin d'analyse réussie (dans `runAnalyseWithData` + dans `runAnalyse` legacy pour cohérence).

**Différenciation Pro vs Particulier dans `notifyAnalysisReady`** :
- Tous reçoivent la notif cloche cliquable
- Particuliers reçoivent en plus un mail Mailjet avec template `buildSuccessEmail`
- **Pros : `if (isPro) return` avant `sendMailjet`** — pas de mail pour éviter le spam (un pro fait potentiellement 30 analyses/mois)

**Bloc CTA "Partager Verimo" dans le mail particulier** :
- Inséré entre le bouton "Consulter mon rapport" et le footer
- Conditionnel `${opts.isPro ? '' : ...}` (sécurité supplémentaire au cas où la fonction serait appelée avec un pro)
- Texte : *"✨ Verimo vous a aidé ? Partagez Verimo à un proche qui s'apprête à acheter — il économisera des heures d'analyse et évitera peut-être un mauvais investissement."*
- Bouton secondaire "Partager Verimo" → https://verimo.fr

**Expéditeurs Mailjet préservés** : `notification@verimo.fr` (particulier) / `pro@verimo.fr` (pro)
**Badge bleu mail** : `✓ ANALYSE PRÊTE` (particulier) vs `PRO · ANALYSE PRÊTE` (pro)

### 4. Livraison 3 — UX timeout + notif échec + race condition (✅ DÉPLOYÉ)

**SQL — Fonction atomique** :
```sql
CREATE OR REPLACE FUNCTION public.consume_particulier_credit(
  p_user_id UUID, p_credit_type TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_updated_count INTEGER;
BEGIN
  IF p_credit_type NOT IN ('document', 'complete') THEN
    RAISE EXCEPTION 'p_credit_type doit être "document" ou "complete"';
  END IF;
  IF p_credit_type = 'document' THEN
    UPDATE public.profiles SET credits_document = credits_document - 1
    WHERE id = p_user_id AND credits_document > 0;
  ELSE
    UPDATE public.profiles SET credits_complete = credits_complete - 1
    WHERE id = p_user_id AND credits_complete > 0;
  END IF;
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count > 0;
END; $$;
GRANT EXECUTE ON FUNCTION public.consume_particulier_credit(UUID, TEXT) TO authenticated;
```

**`useCredits.ts`** :
- `deductCredit` réécrit pour utiliser RPC `consume_particulier_credit` (atomique côté Postgres)
- Plus de race condition multi-onglets : si 2 onglets décrémentent en même temps, un seul réussit grâce à la condition `WHERE credits > 0` qui n'est vraie qu'une fois

**`analyse-client.ts`** :
- Bascule message à 4 min sur la page de progression (au-delà de `240_000ms`) : *"Votre analyse prend un peu plus de temps que d'habitude. Tout est en ordre — vous pouvez fermer cette page si vous voulez, nous vous prévenons dans votre cloche 🔔 dès qu'elle est prête."*
- Timeout 10 min ne retourne plus une `error` mais `queued: true` avec message honnête : *"⏳ Votre analyse prend plus de temps que prévu. Pas d'inquiétude, elle continue en arrière-plan."* → déclenche le `QueuedDialogPopup` existant côté NouvelleAnalyse au lieu du popup d'erreur mensonger

**Edge function `analyser-run` v10 — refundCredit pour pros** :
- Lecture du profil avec `role`
- Si `role === 'pro'` → RPC `refund_pro_credit` (gère abos / unitaires / grants correctement)
- Sinon → UPDATE classique sur `profiles.credits_document/complete`
- Avant : le bug crédait `profiles.credits_complete` pour tout le monde → pro perdait son crédit d'abo, support manuel obligatoire

**Edge function `analyser-run` v10 — notifyAnalysisFailure** :
- Nouvelle fonction `notifyAnalysisFailure(supabaseAdmin, analyseId)` :
  - Insert notif cloche non-cliquable pour tous (titre "Analyse interrompue")
  - Particulier : mail Mailjet via nouveau template `buildFailureEmail` (orange clair, ton rassurant, badge "⚠ ANALYSE INTERROMPUE", bouton "🔄 Relancer mon analyse" vers `/dashboard/nouvelle-analyse`)
  - Pro : cloche seulement, pas de mail
- Appelée depuis `handleAnalyseFailure` après l'UPDATE BDD

### 5. Décisions UX écartées dans la session

- ❌ **Bascule UX à 4-5 min** sur page progression (changement d'écran complet) : abandonnée, finalement un simple changement de message à 4 min suffit
- ❌ **Notifs cliquables pour analyses queued ou en échec** : décidé que `analysis_id = null` car le rapport n'existe pas encore (queue) ou n'existera pas (échec). Le clic ne fait rien — comportement attendu, le visuel le signale (icône orange vs verte)

### 6. Refonte ProPage (✅ DÉPLOYÉ)

**Retraits importants** :
- 🚫 **Section témoignages** (faux clients Sophie M./Thomas R./Karim B./Maître L.) — risque légal publicité mensongère
- 🚫 **Fausses stats** : `-40% rétractations`, `-70% temps de lecture`, `∞ sans expiration` — risque légal idem

**Ajouts visuels** :
- Hero dégradé adouci : `#0d3045 → #1f6d8e → #2a7d9c` (au lieu de `#0a1f2d → #2a7d9c` quasi-noir)
- Sous-titre Hero passé de `text-white/55` à `text-white/85` + `font-medium`
- Badge "Offre Professionnelle" plus visible (background 0.12, bordure 0.2, backdrop-blur)
- 4 cartes profils dans le Hero :
  - Background `0.13` au lieu de `0.06` + backdrop-blur
  - Emojis passés de `text-2xl` à `text-4xl md:text-5xl`
  - Flottement subtil (±4px sur 4s, décalé entre les cartes)
  - Sous-textes `text-white/75` au lieu de `text-white/40`
- Pills "Sans engagement" / "Réponse sous 24h" avec icônes `BadgeCheck` et `Clock`, bien visibles
- Stats onglets profils plus grosses + `whiteSpace: nowrap` (évite saut de ligne moche)

**Labels mis à jour** :
- "Agent / Mandataire immobilier" (au lieu de "Agents immobiliers")
- Sous-textes : "Agence, indépendant, négociateur", "Locatif, patrimoine, rendement", "Achat-revente, division, marge", "Étude, clerc, négociateur"

**Cartes Hero** :
- 🏢 Agent / Mandataire → redirige direct vers `/pro/mandataires` (au lieu d'ouvrir l'onglet)
- 📈 Investisseur → ouvre onglet
- 🔑 Marchand → ouvre onglet
- ⚖️ Notaire → ouvre onglet

**Onglet Agent uniquement** : bouton "En savoir plus" à côté de "Rejoindre Verimo Pro" → `/pro/mandataires`

**Stats vraies uniquement** par profil :
- Agent : `~3 min*` / `/20` / `RGPD`
- Investisseur : `10x` plus rapide / `/20` / `Multi` biens en parallèle
- Marchand : `~3 min*` / `/20` / `10+` biens/jour
- Notaire : `~3 min*` / `0` données conservées / `RGPD`

**Architecture validée** :
- `/pro` reste un hub avec 4 onglets profils + contenu détaillé pour chaque
- `/pro/mandataires` = landing dédiée pour agents/mandataires
- Les autres profils (investisseur/marchand/notaire) restent dans les onglets `/pro` tant que leurs landings dédiées n'existent pas → pas de grille 2x2 qui mènerait vers du vide

### 7. Refonte complète MandatairesPage (✅ FICHIER LIVRÉ, à pusher)

**Ancien fichier** : 2 097 lignes avec curseur custom, blobs animés complexes, mockups SMS/Dashboard/iPhone, scènes cinématiques. Bonne base mais difficile à maintenir et certains éléments visuels datés.

**Nouveau fichier** : 676 lignes, **from scratch** dans le style Jinka.fr (référence visuelle validée par Alex).

**Structure validée (7 sections)** :
1. **Hero** : phrase choc *"Soyez l'agent qui répond à tout, pas celui qui dit « je vais me renseigner »"* + 2 téléphones iPhone arrondis inclinés (-8° et +8°) avec contenu réel (rapport 14.8/20 + dashboard pro) + confettis colorés (jaune, rose, vert, bleu, orange) + halos doux + pills sécurité
2. **Ruban stats** : 4 chiffres en dégradés multicolores (`~3 min` bleu, `15+ docs` rose-orange, `/20` vert, `100% co-brandé` violet)
3. **Scénario 1 — Post-visite acheteur** : iPhone avec vraie conversation SMS Sophie (bulles bleues/grises, statut "Vu", aperçu rapport partagé) sur fond rose/jaune
4. **Scénario 2 — Prise de mandat vendeur** : 2 cartes flottantes (synthèse PV AG + Avis Verimo) sur fond bleu/violet
5. **Scénario 3 — Pendant la visite** : onglets empilés 3D (Synthèse / Copro / Logement / Procédures / Docs) avec score 14.8/20 et catégories de notation sur fond vert/turquoise
6. **Comment ça marche** : 3 cartes colorées rose/bleu/vert
7. **CTA final** : bleu profond avec confettis, *"Devenez l'agent qu'on recommande."*

**Composants créés from scratch** :
- `PhoneFrame` : iPhone arrondi 260x540, padding 7px, Dynamic Island réaliste, borderRadius 44px, ombre 3 couches
- `Confetti` : carrés/cercles animés (rotation, oscillation Y)
- `PhoneContentRapport` : rapport Verimo dans iPhone (score, notation barre, KPI, points positifs, Avis Verimo)
- `PhoneContentDashboard` : dashboard pro dans iPhone (Bonjour Alexandre, crédits Power, liste analyses récentes, CTA partage)
- `PhoneContentSMS` : conversation iMessage réaliste (bulles, statut "Vu", aperçu rapport partagé, timestamps)
- `FloatingReport` : 2 cartes flottantes du scénario 2 (synthèse + avis Verimo)
- `StackedTabs` : onglets empilés 3D du scénario 3 (3 niveaux de profondeur)

**Retraits** :
- 🚫 Curseur custom (le petit cercle violet qui suivait la souris)
- 🚫 Calendly (CTA pointent désormais vers `/rejoindre`)
- 🚫 Blobs animés complexes (remplacés par halos statiques)
- 🚫 MockupRapport, MockupSMS, MockupDashboardSimple, MockupIPhoneSimple, CinematicScene, MomentClientSection, SituationsCouvertesSection
- 🚫 Tarifs (décision validée : pas de tarifs publics)
- 🚫 Section types de documents (jugée non essentielle pour la page mandataires)

**SEO** :
- Title : *"Verimo Pro pour agents & mandataires immobiliers — Analysez vos documents en 3 minutes"*
- Description : *"Agents immobiliers et mandataires : analysez les PV d'AG, diagnostics et règlements de vos biens en quelques minutes. Envoyez à vos clients un rapport pro en 1 clic."*
- Cible élargie agent + mandataire (au lieu de mandataires indépendants uniquement)

**Imports utilisés** : `useRef`, `motion`, `useInView`, `Variants`, `Sparkles`, `ArrowRight`, `Check`, `ShieldCheck`, `Clock`, `Award`, `FileText`, `Eye`, `Star`, `Zap`, `useSEO`. Tous vérifiés utilisés (pas de warning TS).

### 8. Clarification Stripe (info pour Alex)

Discussion pédagogique sur le fonctionnement Stripe :
- Période "en attente" 7 jours après paiement réussi avant disponibilité virement
- Frais Stripe France ≈ 1,5% + 0,25€ par transaction
- Sur tests live : 14,70€ encaissés mais 12,55€ de frais (16 transactions cumulées dont 555,68€ de remboursements) → solde net 2,15€ — normal, pas un bug
- Frais sur remboursements **non récupérables** → prudence pendant les tests live
- Une fois en prod réelle (peu de remboursements), ratio frais/recettes redescend à ~2%

### 9. Sujets stratégie discutés mais non livrés

- **Stratégie pub** : 4 canaux possibles (démarchage LinkedIn cold, Google Ads ciblés, Tonton Immo, SEO long terme). Reco : commencer par démarchage LinkedIn (100 messages/mois) + Google Ads 500€/mois test. Tonton Immo reste pour acheteurs particuliers, pas pour pros.
- **Page Pro stratégie d'architecture** : longue discussion sur grille 2x2 vs onglets. Décision finale : garder onglets sur `/pro` tant que les landings investisseur/marchand/notaire n'existent pas, sinon clic mène vers du vide = ridicule.
- **Tarifs Pro publics** : décision NON. Garder validation manuelle + démo perso pour flexibilité commerciale tant que les 10 premiers pros payants ne sont pas validés.

### 10. Bugs page Pro fixés en cours de session

- **TypeScript build error** : `analysis_id` n'existait pas dans le type `dbNotifications` → ajout `analysis_id: string | null` dans la déclaration `useState` des deux fichiers
- **Hero ProPage trop foncé** : ajusté `#143d54 → #2a7d9c` puis re-ajusté `#0d3045 → #2a7d9c` selon feedback Alex
- **KPI onglets profils sautaient de ligne** ("~3" / "min*" sur 2 lignes) → ajout `whiteSpace: nowrap` + taille réduite à `text-2xl md:text-3xl`

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

✅ **Architecture déjà en place côté rapport** (vérifié session 15 mai) :
- `RapportPage.tsx` ligne 4326 : flag `hideVerimoBranding` (default `false`)
- Ligne 4336 : si `_ownerIsPro = true` sur lien partagé → `hideVerimoBranding = true`
- Ligne 4354-4355 : si user pro consulte son propre rapport → `hideVerimoBranding = true`
- Titre bloc verdict bascule en *"Synthèse de l'analyse"* (au lieu d'*"Avis Verimo"*) quand pro
- Bouton "Partager" masqué
- ⚠️ Manque l'affichage **du logo pro** + **nom d'agence** dans l'en-tête (soft co-branding non finalisé)

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
- 🆕 **Consommation particulier** : `consume_particulier_credit(p_user_id, p_credit_type)` (atomique, créée 15 mai contre race condition multi-onglets)
- **Remboursement crédit interne pro** : `refund_pro_credit(p_user_id, p_credit_type)` (analyse plantée)
- **Reset cycle abo** : `reset_pro_subscription_credits(p_subscription_id)`
- **Cumul upgrade** : `upgrade_pro_subscription_credits(p_subscription_id, p_new_plan)`
- **Incrément promo** : `increment_promo_uses(code_id)` (réutilisée par webhook particulier V3.1)

### Contraintes BDD
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA
- `analyses.status` : CHECK autorise `pending, processing, queued, completed, failed`
- 🆕 `user_notifications.analysis_id` : UUID nullable, FK vers `analyses(id)` ON DELETE SET NULL

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

1. **Push MandatairesPage.tsx refonte** (676 lignes) sur GitHub
2. **Régénérer service_role key** (compromise dans screenshots session 11 mai) + recréer le cron avec nouvelle clé
3. **Annuler abo Stripe du compte test fantôme** `cus_UUgPam3KYnmpzC` (Alexandre) pour stopper events FK qui plantent
4. **Annuler abo Stripe** de `publicite92320@gmail.com` (compte supprimé en BDD mais abo encore actif → events FK)
5. **Test E2E pro complet** : souscription Découverte → upgrade Starter → upgrade Power → downgrade → achat unitaire → remboursement → confirmer remontée admin pour chaque étape
6. **Implémenter case à cocher OBLIGATOIRE** "J'accepte les CGV Pro" avant paiement pro (stockage BDD : `cgv_pro_accepted_at` + `cgv_version` dans `pro_subscriptions`)
7. **Custom text Stripe Dashboard** → Settings → Branding (mention CGV Pro au checkout)
8. **Liens CGV Pro** dans footer principal + Dashboard Pro → Mon compte → Documents légaux
9. **Validation CGV Pro par avocat** spécialisé (budget 300-500€)
10. **Test résiliation immédiate** sur `alexandre.rt25@gmail.com` via Stripe Dashboard pour valider le mail V7
11. **Test cycle complet de notifications** : analyse réussie particulier → cloche cliquable + mail avec CTA partage / analyse réussie pro → cloche cliquable + PAS de mail / analyse échouée particulier → cloche + mail orange / analyse échouée pro → cloche seule

### Court terme
12. **Soumission 47 URLs guides** Google Search Console (quota dépassé le 5 mai)
13. **Réactiver le cron `sync-stripe-payments`** dans 3 jours (vieux paiements problématiques expirés)
14. **Fix bug racine webhook** : remplacer `if (existing) update else insert` dans `upsertProSubscription` par `.upsert({ onConflict: 'stripe_subscription_id' })` atomique
15. **Fix bug `stripe_payment_id = NULL`** sur upgrades : forcer récupération `payment_intent` même quand `default_incomplete`
16. **Fix bug scope `supabase`** dans webhook particulier (ligne 142 — déclaré dans serve() mais utilisé hors)
17. **Création compte pro avec validation SIRET** : workflow "demande → vérif annuaire-entreprises.data.gouv.fr → validation manuelle Alex"
18. **Code promo lancement** "1 analyse offerte" pour campagnes marketing (audience = Pros, quota limité)
19. **Badge dynamique fiche client admin** — Upgrade en cours / Bascule programmée (15 min, lecture `pro_subscriptions.scheduled_plan_change`)
20. **DPA / Annexe RGPD article 28** (obligatoire dès qu'une agence sérieuse réclame)
21. **Section 11.4 Force majeure** à ajouter dans CGV Pro
22. **Article 7.4 usages interdits explicites** dans CGV Pro
23. **Branding Stripe Checkout** : logo + couleurs + domaine `pay.verimo.fr`
24. **Auto-envoi factures par email Stripe** : activer toggles "Paiements réussis" + "Remboursements" dans Stripe Settings → Customer emails
25. **Rate limiting** (faille #7 audit sécurité) avant 1ère grosse campagne pub

### Moyen terme
26. **Co-branding rapports Power** (2-3h dev, infra à 70%) — affichage logo + nom agence sur RapportPage + RapportPartagePage
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

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai 2026)

- **Session 15 mai 2026 (~6h)** ⭐ : **Système notifications cliquables + Refonte ProPage et MandatairesPage**
  - 3 livraisons techniques : SQL `user_notifications.analysis_id` + edge function `analyser-run` v10 + fonction SQL `consume_particulier_credit` atomique
  - Notifications cloche cliquables systématiques en fin d'analyse réussie (avant : seulement si fromRetry=true)
  - Mail particulier "Analyse prête" avec CTA "Partager Verimo" — pas de mail pour pros (anti-spam)
  - Fix race condition deductCredit particulier (multi-onglets ne peut plus avoir 2 analyses pour 1 crédit)
  - Fix bug refundCredit pro (branche pro correcte dans `analyser-run`)
  - Message timeout 10 min honnête (`queued: true` au lieu de fake `error`)
  - Bascule message à 4 min sur page progression
  - Nouveau template mail `buildFailureEmail` + fonction `notifyAnalysisFailure` (notif + mail si particulier)
  - ProPage : suppression témoignages + fausses stats, hero adouci, cartes profils + flottement, pills sécurité, KPI nowrap, bouton "En savoir plus" onglet Agent → `/pro/mandataires`, labels "Agent / Mandataire immobilier"
  - MandatairesPage : refonte complète from scratch style Jinka (676 lignes au lieu de 2 097) avec phrase choc "Soyez l'agent qui répond à tout", 2 iPhone arrondis inclinés, confettis, 3 scénarios alternés (post-visite/prise de mandat/pendant visite), retrait curseur custom + Calendly
  - Décisions stratégie : pas de tarifs publics pros, validation manuelle conservée, architecture `/pro` hub + `/pro/mandataires` landing
- **Session 14 mai 2026 (nuit, ~3h)** ⭐ : **Plaquette PDF démarchage Pro V7 finalisée**
  - Travail méthodologique : définition objectif du doc (accroche froide → réservation démo 15 min), cible (tous pros immo), ton (pro et institutionnel), angles (rapport structuré + maîtrise visite)
  - 7 itérations PDF avant version finale propre : `Verimo Pro - Plaquette demarchage.pdf` (6 slides : Couverture → Situation → Avec Verimo → Avant la visite → Avant/Après → CTA)
  - Mockups téléphones complets (Dynamic Island + barre statut + écran complet)
  - Notifications flottantes "Jinka-style" qui touchent les téléphones
  - Mockup MacBook avec dashboard Pro
  - Vrai QR code généré vers verimo.fr/rejoindre
  - MandatairesPage.tsx : inversion ordre features 3 packs Pro
- **Session 13 mai 2026 (~5h)** : **Page /rejoindre + sections MandatairesPage**
  - Page `/rejoindre` multi-step 4 étapes pour prospects pros (validation email/téléphone, dégradé hero continu)
  - Mailjet configuré, Edge Function `send-pro-request-confirmation` déployée
  - ProPage.tsx : retrait "ou demander une démo (15 min)", CTA pointent vers /rejoindre
  - MandatairesPage : 2 sections ajoutées (MomentClientSection avec timeline scroll, SituationsCouvertesSection grille 3×2) — ⚠️ **retirées dans la refonte du 15 mai**
- **Session 12 mai 2026 (soir/nuit, ~5h)** : **Refonte Compromis + UI compte pro + audit système analyse**
  - Refonte UI compte pro Dashboard : 2 sections différenciées (Infos perso bleu / Identité pro ambre verrouillée)
  - Refonte massive analyse simple/complète COMPROMIS : schéma JSON enrichi, 30 règles métier prompt
  - Nouvel onglet "Compromis" dans rapport complet (TabLogement)
  - Audit complet du système d'analyse Verimo (1578 lignes prompt, 14 types docs)
- **Session 11-12 mai 2026 (soir/nuit, ~6h)** ⭐ : **Session marathon bannières + codes promo + UX + pricing pro**
  - Mail résiliation pro (stripe-webhook-pro V7)
  - Bannières dashboard refondues avec couleurs vives + ciblage audience + ProDashboardBanner créé
  - Codes promo avec ciblage audience (3 niveaux)
  - Fix bug `credit_type='both'` (Les deux)
  - Popup "Besoin d'aide" fluidifié, Support.tsx bouton "Nouveau ticket" supprimé
  - UX "Compléter mon dossier" : gestion `queued: true`
  - Analyse pricing pro validée inchangée
  - Objectif business défini : 25k€ MRR sur 18-24 mois
  - Spec Feature Agence + Co-branding définies
  - Cron `sync-stripe-payments` DÉSACTIVÉ temporairement
- **Session 11 mai 2026 (nuit, ~3h30)** : ⭐ **Bug paiements résolu + filet de sécurité opérationnel**
  - Identification race condition entre webhooks Stripe parallèles
  - Création edge function `sync-stripe-payments` V2
  - Configuration cron pg_cron `*/5 * * * *`
  - Tests validés sur refunds
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

### Côté push immédiat
1. **Push MandatairesPage.tsx refonte** (676 lignes) sur GitHub
2. **Tester visuellement** la refonte MandatairesPage sur desktop ET mobile

### Côté technique/produit (en attente)
3. **Annuler abos Stripe fantômes** (`cus_UUgPam3KYnmpzC` + `publicite92320@gmail.com`)
4. **Test mail résiliation** sur `alexandre.rt25@gmail.com` via Stripe Dashboard
5. **Régénérer service_role key** + recréer le cron Supabase
6. **Test E2E complet du cycle pro** : souscription / upgrade / downgrade / unitaire / remboursement
7. **Test cycle complet notifications** : particulier réussi (cloche + mail CTA partage) + pro réussi (cloche seule) + particulier échec (cloche + mail orange) + pro échec (cloche seule)
8. **Case à cocher CGV Pro obligatoire** avant paiement pro (cgv_pro_accepted_at + cgv_version)
9. **Workflow validation compte pro** : formulaire avec SIRET + vérif annuaire-entreprises.data.gouv.fr
10. **Soumettre les 47 URLs guides** Google Search Console
11. **Réactiver le cron sync-stripe-payments** quand vieux paiements expirés

### Côté funnel pro / démarchage
12. **Créer un exemple de rapport Verimo anonymisé** en PDF — doc le plus puissant en conversion B2B
13. **Rédiger 3 email templates** de démarchage : cold mail / follow-up sans réponse / post-démo
14. **Argumentaire / objections-réponses** pour préparer les démos (RGPD, données client, résiliation, etc.)
15. **Pages dédiées investisseur/marchand/notaire** quand vraies acquisitions clients dans ces segments

**Méthode** :
1. Coller ce context.md en début de conversation
2. Valider chaque chantier avant de coder
3. Une étape à la fois, fichiers livrés via `present_files` depuis `/mnt/user-data/outputs/`
4. Pas de code sans accord
5. Tester sur compte pro `alexandre.rt25@gmail.com` après chaque étape
