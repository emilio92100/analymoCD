# VERIMO — Contexte projet — 23 juin 2026

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
| Plan | Prix HT/mois | Complètes | Simples | Agents max |
|------|-------------|-----------|---------|------------|
| Découverte | 19,90€ | 1 | 3 | 1 |
| Starter | 49,90€ | 5 | 15 | 1 |
| Power | 89,90€ | 10 | 30 | 1 |
| **🏛 Agence** | **149,90€** | **15** | **30** | **3 (multi-utilisateurs)** |

**Achats unitaires pro (réservés aux abonnés)** : Complète 9,90€ HT · Simple 2,90€ HT

**Argumentaire commercial Découverte** : 1,30€ "surcoût" vs achat unitaire (19,90€ vs 18,60€) défendable via dashboard pro, support dédié, tarif préférentiel à 9,90€ (vs 19,90€ particulier). Rentable dès 2 analyses supplémentaires dans l'année.

**🏛 Plan Agence — V2 multi-utilisateurs implémentée le 28 mai 2026** :
- Cible : structures multi-collaborateurs (3 utilisateurs max en V2, login séparé par agent)
- 1 responsable invite jusqu'à 2 agents via mail d'invitation (lien magique 7j)
- Pool de crédits **partagé** entre tous les membres
- Facturation centralisée (responsable paie tout)
- Tous les dossiers sont **visibles par tous les membres** (lecture libre)
- Activation sur invitation admin : workflow inchangé depuis V1
- Cumul de crédits identique aux plans solo (plafond 2× = 30 complètes / 60 simples max)
- Sans engagement, résiliable depuis Stripe Customer Portal
- Article 4.5 ✅ **mis à jour le 23 juin** pour V2 multi-utilisateurs (fin du « login partagé », fonctionnement détaillé, au-delà de 3 = sur devis). Version CGV gardée à **v2.3**.

**Coûts réels Claude API** : ~0,50€/analyse complète (médiane), ~0,15€/analyse simple. Marges saines à 55-90%.

⚠️ **Tarifs pros JAMAIS affichés publiquement** — ni sur `/pro`, ni sur `/tarifs`, ni sur `/pro/agents-mandataires`. Validation manuelle des comptes + démo perso.

### Stripe Price IDs (PRODUCTION)

```
# Particuliers
document : price_1TTtd1BesXB76oWECAGA9ywf
complete : price_1TTtd2BesXB76oWEsZ9LsLS9
pack2    : price_1TTtcxBesXB76oWETkokxLgB
pack3    : price_1TTtczBesXB76oWEloTMvEZF

# Pro — abonnements mensuels
DECOUVERTE 19,90€ → price_1TTtd1BesXB76oWEZuILxjwe
STARTER 49,90€    → price_1TTtczBesXB76oWEcKaNR2BW
POWER 89,90€      → price_1TTtcxBesXB76oWEPyVYZjCj
AGENCE 149,90€    → price_1TbnpDBesXB76oWEdOjLZRh3   # 🏛 prod_UazolFHs7gghhx

# Pro — achats unitaires (réservés aux abonnés)
UNIT_COMPLETE 9,90€ → price_1TTtcyBesXB76oWEBF1TLHYz
UNIT_SIMPLE 2,90€   → price_1TTtd2BesXB76oWEVM0p27GS

# TVA France 20% (mode exclusif HT)
TVA Tax Rate ID : txr_1TUAxVBesXB76oWESXBnGdIZ
```

**Secret Supabase Edge Functions** : `STRIPE_PRICE_AGENCE` = `price_1TbnpDBesXB76oWEdOjLZRh3` (lu dynamiquement par `pro-checkout-create` et `stripe-webhook-pro`).

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
  - `pro@verimo.fr` → email B2B (UNIQUEMENT relations pros, CGV Pro, demandes de rappel) — ✅ mailbox configurée et fonctionnelle
  - `notification@verimo.fr` → Mailjet particuliers
  - `contact@verimo.fr` → emails sortants pros (avec nom agent dans body)

---

## ⚙️ Edge Functions Supabase (production)

| Nom | Rôle | Version |
|-----|------|---------|
| `analyser` | Lance une analyse — gère la queue Anthropic 503 | v8 |
| `analyser-run` | Worker qui traite l'analyse en background. **Mode complet refondu en MAP-REDUCE multi-invocations (03 juin)** — voir section dédiée. Modes `document` (simple) et `complement` inchangés (single appel). | **v18** (03 juin — MAP-REDUCE découpé) |
| `analyser-retry` | Cron pg_cron 5 min — retraite les analyses queued (12 retries max) | — |
| `comparer` | Compare 2 ou 3 rapports | — |
| `admin-user-management` | Actions admin (create, invite, delete, reset password, create_pro_demo enrichi, activate_pro_demo, unlock_agence_subscription, grant_agence_credits, 🆕 **set_agence_users_max** 23 juin) — **modifié 28 mai pour création auto entité agence** | **v4** (23 juin) |
| `pro-checkout-create` | Stripe pro : subscribe / preview_upgrade / buy_unit / cancel / cancel_scheduled_change / reactivate / billing_portal / list_invoices | V3 |
| `stripe-webhook-pro` | Webhook Stripe pro (5 events) + mail résiliation + auto-conversion démo→actif + recharge pool agence quand plan=agence + 🆕 **préserve `nb_users_max` custom au renouvellement** (`Math.max(3, valeur_actuelle)`, 23 juin) | **V10** (23 juin) |
| `stripe-webhook` | Webhook Stripe particuliers (checkout.session.completed) | **V3.1** |
| `create-checkout-session` | Stripe particuliers (checkout) + audience promo | **V3** |
| `send-pro-request-confirmation` | Mail confirmation prospect + notif interne `pro@verimo.fr` | — |
| `notify-callback` | Notification demande de rappel pro (cloche admin + email pro@verimo.fr) | **v1** (25 mai) |
| `send-agence-invitation` | 🆕 Envoi mail HTML Mailjet "Vous avez été invité" à rejoindre une agence | **v1** (28 mai) |
| `accept-agence-invitation` | 🆕 Verify token + accept invitation (crée membre + pro_invitations pour badge "Compte activé") | **v1** (28 mai) |
| `sync-stripe-payments` | Filet de sécurité — sync Stripe → table `payments` toutes les 5 min via pg_cron | **V2** — ⚠️ **DÉSACTIVÉ temporairement** |

⚠️ **Rappel critique** : push GitHub ne déploie pas les edge functions → toujours redéployer manuellement dans Supabase Studio.

### Webhooks Stripe configurés

- **Verimo - Pro** → `stripe-webhook-pro` : 4 events (checkout.session.completed, customer.subscription.deleted, customer.subscription.updated, invoice.paid) + `charge.refunded`
- **Verimo - Particuliers** → `stripe-webhook` : checkout.session.completed + `charge.refunded`

### Cron Supabase pg_cron

- `analyser-retry-5min` → actif (essentiel)
- `sync-stripe-payments-every-5min` → DÉSACTIVÉ temporairement (à réactiver quand vieux paiements problématiques expirés)

⚠️ **Service_role key compromise** durant la session du 11 mai (partagée dans screenshots). À régénérer + recréer le cron avec la nouvelle clé.

---

## 🗺️ Routes principales

```
/                              → HomePage
/pro                           → ProPage (4 onglets profils : Agent/Mandataire, Investisseur, Marchand, Notaire)
/pro/agents-mandataires        → MandatairesPage (landing dédiée agents/mandataires)
/pro/rejoindre                 → Page multi-step prospects pros
/tarifs                        → TarifsPage (particuliers uniquement, pas de tarifs pros publics)
/exemple                       → ExemplePage
/methode                       → MethodePage
/guides                        → GuidesPage
/cgv-pro                       → CGVProPage (B2B, scroll spy, 14 sections)
/connexion, /inscription       → Auth
/accept-invitation?token=xxx   → 🆕 AcceptInvitationPage (création de compte agent via invitation responsable)
/admin                         → AdminPage (paramètre URL ?tab=callbacks pour ouvrir direct un onglet)
/dashboard                     → SmartDashboard (détecte role)
/dashboard/nouvelle-analyse    → NouvelleAnalyse
/dashboard/analyses            → MesAnalyses (particulier)
/dashboard/dossiers            → MesDossiersPro (pro) — renommé "Dossiers de l'agence" pour membres agence
/dashboard/dossier/:id         → DossierDetail (pro)
/dashboard/equipe              → 🆕 MonEquipePage (responsable + co-resp + agent — visible uniquement membres agence)
/dashboard/abonnement          → MonAbonnement (pro) — bloqué pour agents agence
/dashboard/compte              → Compte ou ComptePro (champs entreprise verrouillés pour agents agence)
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
- 4 cas gérés côté backend : paiement direct OK, 3DS demandé, Carte refusée, Paiement en cours
- **Sécurité backend** : webhook `customer.subscription.updated` vérifie `latest_invoice.status === 'paid'` AVANT de cumuler les crédits

### Flow de downgrade (Stripe Subscription Schedule)
- Création d'un `subscription_schedule` via `from_subscription` → bascule programmée à `current_period_end`
- Mode `cancel_scheduled_change` permet d'annuler une bascule programmée
- Stockage BDD dans colonnes `pro_subscriptions.scheduled_plan_change` + `scheduled_change_date`

### Auto-conversion démo → actif (V8)
- Quand un pro `pro_status='demo'` souscrit un abonnement Stripe → passage auto à `pro_status='active'` + `pro_demo_converted_at`
- Bandeaux démo (orange + bleu) disparaissent automatiquement

### 🆕 Sync agence dans le webhook (V9 — 28 mai)
- Quand un responsable d'agence paie le plan Agence (149,90€) → webhook met `agences.nb_users_max=3` et `agences.status='active'`
- Recharge le pool de crédits agence : `agences.credits_complete=15`, `agences.credits_document=30`
- Le bloc "En attente de souscription" disparaît automatiquement dans le dashboard
- Permet aux 2 agents d'être invités par le responsable

### ⚠️ Bug paiement Stripe (NON résolu, workaround manuel)

**Symptôme** : `stripe_payment_id = NULL` dans `payments` pour les paiements d'upgrade (Starter, Power) → webhook `charge.refunded` ne peut pas matcher.

**Décision Alex** : ne pas refondre maintenant. Workflow manuel : SQL UPDATE quand remboursement fait dans Stripe.

---

## 🏛 Plan Agence V2 multi-utilisateurs — LIVRÉ (28 mai 2026) ⭐

**Modèle V2** : 1 responsable invite jusqu'à 2 agents (3 utilisateurs max) avec **logins séparés**, pool de crédits **partagé**, dossiers **visibles par tous** en lecture libre, facturation centralisée.

### Structure BDD

**Tables créées** :
- `agences` (id, raison_sociale, siret, adresse, plan, nb_users_max, status, credits_complete, credits_document, **credits_complete_bonus**, **credits_document_bonus**, email_contact, telephone, created_at, updated_at) — les `*_bonus` (ajoutées 22 juin) = crédits offerts durables, hors quota mensuel, jamais effacés au renouvellement
- `agence_members` (id, agence_id, user_id, role, joined_at, removed_at, last_active_at, color_hex)
- `agence_invitations` (id, agence_id, email, token, status, invited_by, invited_by_name, created_at, expires_at, accepted_at, cancelled_at, resend_count)
- `agence_credit_grants` (id, agence_id, granted_by, credit_type, quantity, reason, created_at) — **log des crédits offerts** au pool bonus (ajoutée 22 juin). RLS : membres voient leur agence, admin via `is_admin()`. Écriture via service_role (edge function)
- `envois_rapports` (id, agence_id, sent_by, analysis_id, recipient_email, sent_at)
- `dossier_notes` (id, agence_id, folder_id, user_id, content, deleted_at, created_at)

**Colonnes ajoutées** :
- `analyses` : `agence_id`, `created_by_user_id`, `deleted_at`, `deleted_by`, `last_viewed_by`
- `profiles` : `agence_id`, `agence_role` ('responsable' | 'co_responsable' | 'agent')
- `pro_folders` : `agence_id` (avec trigger auto-fill `set_folder_agence_id` à création)

### Rôles & permissions

| Action | Responsable 👑 | Co-resp 🤝 | Agent 👤 |
|---|---|---|---|
| Inviter / retirer / promouvoir des membres | ✅ | ✅ | ❌ |
| Voir & gérer facturation | ✅ | ✅ | ❌ |
| Modifier infos entreprise (raison sociale, SIRET) | ✅ | ✅ | ❌ |
| Voir tous dossiers agence (lecture libre) | ✅ | ✅ | ✅ |
| Créer ses propres dossiers | ✅ | ✅ | ✅ |
| Ajouter acheteur sur tout dossier | ✅ | ✅ | ✅ |
| Envoyer rapport au client | ✅ | ✅ | ✅ |
| Ajouter vendeur / nouvelle analyse / modif dossier autre | ✅ | ✅ | ❌ (étape C2 à faire) |
| Supprimer dossier | ✅ | ✅ | ❌ |

**Règle** : au moins 1 responsable toujours présent (trigger SQL `protect_last_responsable`). Soft delete pour ancien membre (snapshot du nom préservé). Invitation expire en 7 jours, valable une fois.

### Fonctions SQL clés
- `my_agence_id()` — SECURITY DEFINER pour casser la boucle RLS infinie. Toutes les policies basées sur cette fonction
- 🆕 `set_analyse_agence_fields()` (23 juin) — **trigger BEFORE INSERT sur `analyses`** : pose auto `created_by_user_id = user_id` + `agence_id` (agence du créateur via `agence_members`). Indispensable pour que la fiche « Mon équipe » remonte les analyses par membre. Miroir de `set_folder_agence_id`.
- ⚠️ **Crédits agence (réalité depuis 22 juin)** : les fonctions LIVE sont les **v1 sans suffixe** `get_pro_credits_balance` / `consume_pro_credit` / `refund_pro_credit`, **rendues agence-aware via `agence_members`**. Les variantes `_v2` existent mais **ne sont appelées NULLE PART**. Ordre conso agence : pool → bonus (`credits_*_bonus`) → unitaires perso du membre. Voir section « Architecture crédits » + session 22 juin.
- `get_visible_analyses()` — retourne analyses agence + perso
- `create_agence_invitation()` — crée une invitation token
- `accept_agence_invitation()` — accepte (crée membre + pro_invitations pour badge "Compte activé")
- `remove_agence_member()` — soft delete avec snapshot

### Edge Functions livrées

- `send-agence-invitation` : envoie mail Mailjet HTML responsive avec lien `/accept-invitation?token=xxx`
- `accept-agence-invitation` : 2 actions (`verify` au chargement + `accept` création compte)
- `stripe-webhook-pro` V9 : recharge pool agence si plan=agence
- `admin-user-management` v3 : création auto entité agence si `pro_profile_type=agence`

### Frontend Dashboard Pro (DashboardProPage.tsx)

- **Sidebar dynamique** via `getProNavGroups(agenceRole)` :
  - "Mes dossiers" devient **"Dossiers de l'agence"** pour membres
  - Onglet **"Mon équipe"** visible pour membres (icône Users bleue)
  - Onglet **"Mon abonnement"** masqué pour agents
- **Vue dossiers** : badge "Créé par 👑/🤝/👤 X" sur cartes (grid + liste) et dans le header du détail dossier
- Filtre par auteur (Tous / Mes dossiers / Par membre) + recherche cross-membres
- **Agents bloqués** sur : page abonnement (redirige vers "Géré par votre agence"), modif entreprise, bouton "Demander une modification"
- Bandeau bleu "Informations gérées par votre agence" dans Mon compte
- Inputs verrouillés affichent `—` au lieu de placeholders fantômes
- ComptePro `isLocked = pro_onboarding_done || isAgent`
- Route `/dashboard/equipe` + `/accept-invitation` ajoutées dans App.tsx

### Page Mon équipe (MonEquipePage.tsx — nouveau fichier ~983 lignes)

- Liste membres + invitations en cours + bouton inviter (responsable uniquement)
- Bandeau bleu foncé avec rôle + places restantes + crédits agence
- Clic sur membre → **fiche détail** avec :
  - Header dégradé avec nom, rôle, dates
  - 4 KPIs : Analyses créées · dont complètes · Dossiers créés · Rapports envoyés
  - Graphique d'activité 8 semaines (bars dégradées)
  - Liste des 10 dernières analyses cliquables (ouvre `/rapport?id=...`)
  - Actions admin en bas (Promouvoir / Rétrograder / Retirer)
  - Bouton "Retour à mon équipe"

### Frontend Admin (AdminPage.tsx)

- `agenceInfoByUser` (Map) chargée dans `loadClients`
- Badges 👑/🤝/👤 à côté du nom + "Agence X · Rôle" sous email dans cartes
- Fiche client : bandeau bleu agence avec liste cliquable des autres membres
- Filtre "Agence" inclut tous les membres (responsable + co-resp + agents)
- Filtre "Autre" exclut les membres d'agence
- ✅ **Regroupement visuel par agence (header doré dépliable + membres indentés)** — RÉSOLU le 22 juin. Le code était bon ; cause = RLS (`agences` / `agence_members` sans policy admin). Fix = policies SELECT `is_admin()` sur les deux tables. + Vue détail agence complète, analyses cliquables paginées, filtre « Agences (N · M comptes) », bouton « Voir l'agence ». Voir session 22 juin.

### CGV Pro

Article 4.5 ✅ **mis à jour le 23 juin** pour V2 multi-utilisateurs (la V1 mentionnait à tort "login partagé" — corrigé en "chacun son propre accès" + fonctionnement détaillé + au-delà de 3 sur devis).

### UUIDs de test

| Élément | UUID / Email |
|---|---|
| Agence Julio (test) | `43ac0ae5-2dfc-4f0e-9ce9-647335a84cb2` |
| Julio (responsable) | `202c9334-3c92-4707-9f98-c6d75beecf0e` · `publicite92320@gmail.com` |
| Julia Guery (agent) | `bba54a94-a405-4c88-9fac-e429b9d099db` · `verimo75000@gmail.com` |

---

## 📜 Système CGV Pro popup obligatoire (✅ DÉPLOYÉ)

**Concept** : popup obligatoire de consentement aux CGV Pro avant le 1er paiement pro. Une fois acceptée → jamais redemandée.

### Fichiers
- `src/lib/cgv-version.ts` — constante `CURRENT_CGV_PRO_VERSION = "v2.3"`
- `src/components/CgvProConsentDialog.tsx`
- `src/pages/DashboardProPage.tsx` — Helper `requireCgvThen(actionLabel, paymentAction)`

---

## 🆕 Système de demande de rappel pro (✅ DÉPLOYÉ)

**Concept** : Bouton "Je souhaite être rappelé" pour les pros qui hésitent à s'abonner ou veulent un devis agence. Notification admin + email instantané.

**Composants** :
- `src/components/CallbackRequestModal.tsx`
- `supabase/functions/notify-callback/index.ts`
- Table `callback_requests` + onglet admin "Rappels Pro" + bloc dans fiche client

---

## 📊 Architecture crédits

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions` (ou, si membre d'une agence, le **pool partagé** `agences.credits_complete/document` + le **bonus** `credits_*_bonus`). Agence-aware via `agence_members` (réécriture 22 juin — voir session). Ordre de conso agence : pool → bonus → unitaires perso.
2. **Achats unitaires** → `pro_unit_purchases`
3. **Crédits offerts (solo)** → `credit_grants` + trigger `apply_credit_grant`
4. **Crédits offerts (agence)** → pool bonus `agences.credits_*_bonus`, tracés dans `agence_credit_grants` (écrits par l'edge function `admin-user-management` action `grant_agence_credits`, service_role)

### Sources de crédits particulier
Stockés directement dans `profiles.credits_document` et `profiles.credits_complete`.

### Fonctions SQL crédits
- **Consommation pro** : `consume_pro_credit(p_user_id, p_credit_type)` — agence-aware (pool → bonus → perso)
- **Consommation particulier** : `consume_particulier_credit(p_user_id, p_credit_type)`
- **Remboursement crédit interne pro** : `refund_pro_credit(p_user_id, p_credit_type)` — agence-aware (rembourse au pool)
- **Reset cycle abo** : `reset_pro_subscription_credits(p_subscription_id)` — gère le plan `agence` (recharge pool, cumul plafonné 2× = 30/60, bonus intact) depuis le 22 juin
- **Cumul upgrade** : `upgrade_pro_subscription_credits(p_subscription_id, p_new_plan)`
- **Incrément promo** : `increment_promo_uses(code_id)`

### Contraintes BDD importantes
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA
- `analyses.status` : CHECK autorise `pending, processing, queued, completed, failed`
- `profiles.pro_status` : TEXT nullable (`'demo'` | `'active'` | `null`)
- `profiles.agence_id` : UUID nullable, FK vers `agences(id)` ON DELETE SET NULL
- `profiles.agence_role` : TEXT (`'responsable'` | `'co_responsable'` | `'agent'`)
- `callback_requests.status` : TEXT default 'pending' (`'pending' | 'called' | 'converted' | 'declined'`)

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

## 🎯 MAP-REDUCE analyse complète — ✅ RÉALISÉ ET DÉPLOYÉ (03 juin 2026) ⭐⭐⭐

> ⚠️ **MISE À JOUR 04 juin 2026 — RETOUR AU SINGLE CALL.** Le MAP-REDUCE reste dans le repo (`analyser-run` ~2575 lignes) mais **n'est plus le mode actif en prod** : Alex a recollé manuellement l'ancien `analyser-run` **SINGLE CALL (v7)** dans Supabase. Raison : sur de vrais dossiers, le MAP-REDUCE s'est révélé **plus lent** que le single call. Le REDUCE empile des résumés MAP « exhaustifs » (jusqu'à 64000 tokens/doc, prompt « compte rendu fidèle et exhaustif ») souvent **plus lourds que les docs d'origine** → il **dilate** l'info au lieu de la compresser, et la génération du rapport final reste de toute façon aussi longue. Le single call suffit pour les dossiers normaux (contexte Sonnet 4.6 = **1M tokens**). Le vrai problème de fond (**timeout 400 s** sur très gros dossiers) est traité dans la section dédiée « ⏱️ CHANTIER 400 SECONDES » (prochaine session). La section ci-dessous décrit le MAP-REDUCE tel qu'il est codé dans le repo — conservée comme **référence / historique**.

> Le chantier cadré le 02 juin a été réalisé le 03 juin, **mais avec une architecture différente de celle initialement prévue** (raison ci-dessous). Le mode complet fonctionne désormais en MAP-REDUCE découpé en plusieurs invocations. Modes `document` (analyse simple 1 doc) et `complement` (compléter dossier) **strictement inchangés** (toujours single appel).

### Pourquoi l'architecture finale diffère du plan initial
- **Le plan prévoyait** : MAP = JSON par type (réutiliser les prompts de l'analyse simple) + REDUCE hybride code/IA, le tout dans une seule fonction.
- **Le vrai bloquant rencontré** : la limite **WallClockTime de Supabase** (~6-7 min par invocation). Faire MAP + REDUCE de 6-12 docs dans UNE invocation dépassait cette limite (CPU quasi nul, c'est l'attente des appels IA qui consomme le temps). Découper le code en sous-fonctions n'y change RIEN : seule une **nouvelle invocation** remet le chrono à zéro.
- **Décision** : MAP-REDUCE découpé en **plusieurs invocations** qui se ré-invoquent via `fetch` self-invoke (sur la propre URL de la fonction, avec service-role key).
- **MAP = résumé TEXTE LIBRE cadré** (et non JSON par type) : chaque doc lu seul → compte rendu textuel exhaustif. Validé en prod : le texte libre capte parfaitement le structuré (détail Carrez 7 pièces + packs DPE D→B présents dans le JSON final).
- **REDUCE = prompt complet original** (`buildSystemPrompt('complete')`) qui consolide les résumés texte + post-traitement déterministe (`recalculerCategories` + `validateDiagsManquants`).

### Flux v18 effectivement déployé
- Handler route selon `body.phase` : pas de phase → chemin normal (mode complet branche vers `runPhaseMap`) ; `phase:'map'` + `mapOffset` → relance MAP à l'offset ; `phase:'reduce'` → `runPhaseReduce`. **Frontend inchangé** (appelle sans phase).
- **MAP découpé en TRANCHES de 3 docs/invocation** (`MAP_TRANCHE = 3`). Chaque invocation lit 3 docs (en parallèle), supprime chaque PDF de l'API au fil de l'eau (RGPD), accumule les résumés dans la colonne `map_resultats` (jsonb), met à jour la progression, puis : s'il reste des docs → self-invoke `{phase:'map', mapOffset:+3}` ; sinon → self-invoke `{phase:'reduce'}`. Borne le temps quel que soit le nb de docs (testé OK à 12 docs : 4 invocations MAP 1-3/4-6/7-9/10-12 puis REDUCE).
- **REDUCE** : relit `map_resultats`, empile les résumés, 1 appel `callAI` avec le prompt complet, post-traitement déterministe, écrit le rapport final dans `result`, puis **efface `map_resultats`** (nettoyage), notifie (cloche + email).
- **Pourquoi 3 docs et pas 1** : 3 = meilleur compromis (moins de self-invoke = maillon le moins éprouvé, plus rapide, 99 % de la sécurité du 1).

### SQL prérequis (déjà passé par Alex)
```sql
alter table analyses add column if not exists map_resultats jsonb;
```

### Corrections livrées dans la foulée (03 juin)
- **Scoring** : le score total = **somme des 5 catégories recalculées** (`recalculerCategories`), plus le score inventé par l'IA. Corrige l'incohérence vue (18 affiché vs 10,5 de catégories).
- **Bug `anneeStr.match`** : `annee_construction` arrivait parfois en nombre → `String(...)` forcé. `validateDiagsManquants` (détection diags obligatoires manquants par règles légales : DPE/ERP/Carrez toujours, électrique <2011, amiante <1997, plomb <1949) ne plantait plus silencieusement.
- **Règle cohérence travaux** (prompt) : un même travaux jamais à la fois en point fort ET en vigilance. Point fort = uniquement travaux **réalisés** (même pas tout payé, solde à charge vendeur). Travaux **voté mais suspendu/bloqué/annulé** = uniquement vigilance (coût peut retomber sur l'acheteur).
- **Règle gravité des procédures** (prompt) : gravité jugée selon l'**impact concret sur l'acheteur** (coût/risque/blocage, y compris long terme). Élevée = impact direct lourd ; modérée = réel mais incertain/indirect ; faible = pas d'impact identifié ou résolu. Doute → niveau le plus élevé. (Rappel : gravité pèse sur le score — élevée −2, modérée −1, faible −0,5.)

### Corrections frontend livrées (RapportPage.tsx, 03 juin)
- **Carrez** : c'était un **bug d'affichage**, pas d'extraction (données parfaites dans `result`). 3 fix : `buildRapport` ne propageait pas `dpe_recommandations` (ajouté) ; le Carrez était cherché dans `autresDiags` (liste d'où il est exclu) → corrigé ; Carrez déplacé **dans la section « Votre lot »** (après « Identité du lot »), rendu en tableau soigné avec emojis par pièce + ligne « Total mesuré ».
- **DPE recommandations** : s'affichent maintenant (la propagation `dpe_recommandations` était la vraie cause). Bloc « passer d'une lettre à l'autre » redesigné : pastilles plus grandes avec ombre + kWh, flèches dans des pastilles blanches visibles, fond dégradé turquoise, packs mis en avant (bordure latérale colorée + montant encadré).
- **Procédures** : triées par gravité décroissante + **bloc dépliable « Comment lire les niveaux de gravité ? »** (3 cartes colorées avec impact points sur la note).

### UX faux-échec corrigé (analyse-client.ts, 03 juin)
- **Bug** : le frontend marquait `status:'failed'` de lui-même après stagnation → ligne « Non généré » en rouge alors que le backend tournait encore (MAP-REDUCE plus long qu'avant). 
- **Fix** : le front ne décide JAMAIS d'un échec ; il **reflète** le `status` de la base (seule source de vérité, écrite par le backend/watchdog). Stagnation longue → bascule en « queued » rassurant, pas en échec.
- Message rassurant déclenché dès **3 min** (« analyse prend plus de temps, vous serez prévenu par cloche 🔔 + email »). Timeout global front allongé **10 → 20 min**.

### Gestion des pannes (état vérifié dans le code)
- **Panne passagère** (429 rate-limit, 529/503 surcharge, réseau) : `callAI` retente **3 fois** (429 : pauses 10s/20s ; 529/503 : 15s ; réseau : 3s). Absorbe les pics courts → l'analyse continue.
- **Panne persistante sur 1 doc** : après 3 tentatives, le doc est abandonné. ⚠️ **Comportement actuel : le REDUCE ne garde que les docs `ok` → le doc raté est SAUTÉ SILENCIEUSEMENT, aucun signalement au client.** (À traiter — voir backlog.)
- **Échec total** (aucun doc lu, ou self-invoke échoue) : `handleAnalyseFailure` → remboursement crédit + status `failed` + message client + alerte admin + notif. MAIS ne se déclenche QUE si le code attrape l'erreur — une mort brutale (shutdown WallClockTime) coupe net sans l'exécuter → analyse bloquée en `processing` jusqu'au watchdog (seuil actuel 60 min). ⚠️ Maillon faible restant.

### Charge simultanée (état vérifié)
- **PAS de file d'attente globale** régulant la concurrence. 5 clients simultanés → 5 analyses en parallèle, indépendantes.
- File d'attente **réactive** existante (`tryEnqueueOrFail` dans `analyser` + cron `analyser-retry`) : se déclenche si surcharge **au démarrage** (upload), met en `queued`, reprise par cron. Pas de régulation préventive.
- **5-10 clients simultanés** : bien géré (parallèle + retry + queue de secours). **20-30+** : nécessiterait une vraie file globale. Plafond réel = limites de débit Anthropic du compte (à vérifier).

### Mode debug (désactivé en fin de session)
- Pendant le debug, le nettoyage `map_resultats = null` était commenté pour inspecter les résumés MAP en base. **Réactivé en fin de session.** Inspection pendant une analyse en cours : `select map_resultats from analyses order by created_at desc limit 1;`

### État des renderers (inchangé)
- **14 types détectés** ; **12 fiches dédiées** dans `DocumentRenderer.tsx` + 1 générique (AUTRE). ⚠️ **GAP : FICHE_SYNTHETIQUE** détectée + JSON mais pas de fiche dédiée (tombe sur RendererAutre) → à créer.

### À fiabiliser plus tard (discuté, plan validé, NON codé)
- **Heartbeat watchdog** (pour rattraper vite une mort brutale d'invocation) : (1) SQL `alter table analyses add column if not exists last_heartbeat timestamptz;` (2) `analyser-run` écrit `last_heartbeat=now()` à chaque progression (3) watchdog détecte les `processing` dont `last_heartbeat` > ~7-8 min (mort) au lieu de `created_at` > 60 min (4) passer le cron watchdog à ~3 min. Objectif : annulation en ~10 min max sans tuer une analyse vivante.
- **Reprise par queue après surcharge d'un doc** (au lieu de sauter le doc) : si un doc échoue pour surcharge persistante → mettre l'analyse en `queued`, le cron `analyser-retry` la reprend ; **reprise au bon endroit** (garde les docs déjà résumés dans `map_resultats`, ré-upload depuis le bucket `analyse-temp` des docs non lus) ; abandon + remboursement après **6 tentatives / 30 min**. Chantier le plus lourd (touche analyser-run + analyser-retry + RGPD) → session dédiée.
- **Garde-fou de concurrence** (demi-pas avant vraie file globale) : avant de lancer, compter les analyses en `processing` ; si > seuil (~10) → mettre en `queued` direct. Quelques lignes, réutilise la queue existante. À faire le jour où la charge le justifie.

---



## ⏳ Backlog — En attente

### 🔥 Priorité haute (avant lancement public Pro)

1. ~~**🚨 BUG REGROUPEMENT AGENCE ADMIN**~~ ✅ **RÉSOLU 22 juin** (RLS : policies `is_admin()` ajoutées sur `agences` + `agence_members`). + système crédits agence finalisé, partage dossiers entre collègues, polish admin (détail agence, analyses cliquables paginées, filtre « Agences », bouton « Voir l'agence »). Voir session 22 juin.
2. **⚠️ Doc sauté silencieusement (MAP-REDUCE)** — un doc en échec après 3 tentatives est retiré du REDUCE sans signalement client. Risque : un rapport « complet » qui a ignoré un doc pouvant contenir une info critique. Décision en attente (A échec global / B partiel signalé / C reprise par queue — Alex penche C). Voir section MAP-REDUCE.
3. **⚠️ Mort brutale d'invocation = watchdog lent (MAP-REDUCE)** — si une invocation est tuée (WallClockTime), l'analyse reste en `processing` jusqu'au watchdog (60 min). Plan heartbeat validé (NON codé) pour ramener à ~10 min.
2. **Étape C2 — Permissions fines DossierDetail** : bloquer ajout vendeur / nouvelle analyse / modif titre pour non-créateurs ; garder ajout acheteur + envoi rapport accessibles à tous
3. **🔴 Régénérer service_role key** (compromise screenshots 11 mai) + recréer le cron avec nouvelle clé — **SEUL must-do certain restant avant onboarding de vraies agences** (confirmé par l'audit sécu du 23 juin). Reste ouvert.
4. ~~**Mettre à jour CGV Pro article 4.5** pour V2 multi-utilisateurs~~ ✅ **FAIT 23 juin** (`CGVProPage.tsx`, version gardée v2.3)
4b. **🟠 Durcir l'auth `analyser` / `analyser-run`** (audit 23 juin) — `analyser` : ajouter `getUser()` + contrôle de propriété de l'analyseId ; `analyser-run` : secret interne partagé. Non bloquant pour démarchage. ⚠️ Prod = single-call v7 hors repo → récupérer le vrai code prod avant.
5. **Test E2E pro complet** : souscription Découverte → upgrade Starter → upgrade Power → downgrade → achat unitaire → remboursement
6. **Test E2E agence complet** : Création responsable → activation → souscription Stripe → invitation 2 agents → acceptation → dossiers partagés → analyse créée par agent → rapport envoyé
7. **Custom text Stripe Dashboard** → Settings → Branding (mention CGV Pro au checkout)
8. **Liens CGV Pro** dans footer principal + Dashboard Pro
9. **Validation CGV Pro par avocat** spécialisé (budget 300-500€)
10. **Test résiliation immédiate** sur compte test pro

### Court terme
11. **Soumission 47 URLs guides** Google Search Console (quota dépassé le 5 mai)
12. **Réactiver le cron `sync-stripe-payments`** quand vieux paiements problématiques expirés
13. **Fix bug racine webhook** : remplacer `if (existing) update else insert` dans `upsertProSubscription` par `.upsert({ onConflict: 'stripe_subscription_id' })` atomique
14. **Fix bug `stripe_payment_id = NULL`** sur upgrades
15. **Fix bug scope `supabase`** dans webhook particulier (ligne 142)
16. **Code promo lancement** "1 analyse offerte" pour campagnes marketing
17. **DPA / Annexe RGPD article 28** (obligatoire dès qu'une agence sérieuse réclame)
18. **Section 11.4 Force majeure** à ajouter dans CGV Pro
19. **Article 7.4 usages interdits explicites** dans CGV Pro
20. **Branding Stripe Checkout** : logo + couleurs + domaine `pay.verimo.fr`
21. **Rate limiting** (faille #7 audit sécurité) avant 1ère grosse campagne pub
22. **Bannir le mot "co-brandé/co-branding" du site** progressivement
23. **Animation fluide transitions onglets dashboard PRO**

### Moyen terme
24. **Session lifecycle pro complète** (suspendre / résilier / past_due / suppression user / badges admin)
25. **Personnalisation rapports Power "à votre image"** (logo pro + nom agence sur RapportPage et RapportPartagePage — 2-3h dev, infra à 70%)
26. **Bug "Erreur d'affichage" sur l'onglet Compromis** dans RapportPage
27. **UX "Compléter mon dossier"** — 3 frictions à régler (progress bar, message anxiogène, pédagogie)
28. **Popup bienvenue pro 1ère connexion** (onboarding)
29. **Veille réglementaire** prompt analyser-run
30. **Compare Verimo redesign verdict**
31. **Mailjet tracking erreurs**
32. **Admin support inbox redesign** (split-view dans AdminPage.tsx)
33. **Mode clair/sombre toggle global**

### Pages métier
34. **`/pro/investisseurs`** : landing dédiée
35. **`/pro/marchands`** : landing dédiée
36. **`/pro/notaires`** : landing dédiée

### Stratégique pro
37. ~~**Compte Agence V1 (login partagé, 149,90€)**~~ ✅ **LIVRÉ le 27 mai 2026**
38. ~~**Compte Agence V2 multi-utilisateurs**~~ ✅ **LIVRÉ le 28 mai 2026**
39. **B2B targeting mandataires indépendants** (IAD, Capifrance, SAFTI)
40. **Speak to 10 real pro prospects** avant de coder pro-specific features
41. **Projections honnêtes** : 25k€ MRR sur 18-24 mois, mix solo + agences

### Infra
42. **Vérifier upgrade Supabase Compute NANO → MICRO** (gratuit avec plan Pro)
43. **SIRET sur factures unitaires**
44. **Toggles Stripe Checkout** : Politique remboursement / CGV / Coordonnées support

### Démarchage / funnel pro
45. **Créer un exemple de rapport Verimo anonymisé** en PDF
46. **Rédiger 3 email templates** de démarchage
47. **Argumentaire / objections-réponses** pour préparer les démos

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai-juin 2026)

- **Session 23 juin 2026 ⭐⭐ : Fiche membre agence RÉPARÉE (SQL) + AUDIT SÉCURITÉ COMPLET + CGV Pro 4.5 + UX complément + fix layout Mon équipe**
  - **🔒 FICHE MEMBRE « Mon équipe » — RÉPARÉE (100 % SQL, zéro frontend).** Symptôme : depuis le compte responsable, cliquer sur un membre affichait « 0 analyse » pour tout le monde (KPIs + liste vides). **Diagnostic vérifié par requêtes prod** : la fiche filtre sur `analyses.agence_id` + `created_by_user_id`, or `agence_id` était rempli sur **0 / 38** analyses (et `created_by_user_id` sur 16 = vieux backfill historique, **aucun trigger actif**). `createAnalyse` ne posait ni l'un ni l'autre. **Fix livré et testé OK en prod :**
    - **BLOC 1 (trigger)** : `set_analyse_agence_fields()` (BEFORE INSERT on `analyses`, SECURITY DEFINER) → pose auto `created_by_user_id = user_id` + `agence_id` = agence dont le créateur est membre actif (`agence_members`, `removed_at is null`). Miroir du trigger `set_folder_agence_id` des dossiers. Particulier / pro solo → `agence_id` reste null (normal).
    - **BLOC 2 (backfill)** : `update analyses set created_by_user_id = user_id where null` + `update analyses a set agence_id = am.agence_id from agence_members am where am.user_id = a.created_by_user_id and removed_at is null`. Résultat vérifié : **38/38** creator, **1** agence.
    - **BLOC 3 (policy RLS agence) — JUGÉ INUTILE, NON FAIT.** Raison vérifiée dans le code : un pro est **obligé** de choisir un dossier avant de lancer (`NouvelleAnalyse` : `setStep(selectedFolder ? 'type_bien' : 'folder_select')`) → **aucune analyse pro n'existe hors dossier** → la policy folder-based du 22 juin (« Membres agence lecture analyses dossiers ») couvre déjà 100 % des lectures. Le `agence_id` manquant était le seul vrai chaînon cassé (pour le **filtre** d'affichage), pas la lecture. **Ne pas re-créer le bloc 3.**
    - **Cloisonnement confirmé** : le responsable voit uniquement les analyses de **SON** agence (`agence_id` = son agence + créateur membre), jamais celles d'autres agences/particuliers. Sain.
  - **🛡️ AUDIT SÉCURITÉ COMPLET (avant démarchage pro). Résultats :**
    - ✅ **Secrets** : aucune clé sensible dans le code. Seule clé en dur = clé `anon` (publique par design, OK). Aucun `service_role` / `sk_live` côté front. `.gitignore` + `.env.example` propres.
    - ✅ **Webhooks Stripe** (`stripe-webhook-pro` + `stripe-webhook`) : signature vérifiée (`constructEventAsync`) → paiements/remboursements infalsifiables.
    - ✅ **`admin-user-management`** : valide le vrai token (`auth.getUser()`) + rôle admin + propriété (401/403). Bon pattern.
    - ✅ **Prix 100 % cohérents** (frontend + edge functions) : particuliers 4,90/19,90/29,90/39,90 ; pro 19,90/49,90/89,90/149,90 ; unitaires 9,90/2,90 ; quotas Découverte 1+3 / Starter 5+15 / Power 10+30 / Agence 15+30 ; Price IDs Stripe alignés ; TVA appliquée. **Aucun tarif pro sur pages publiques.** Mot « IA » absent du public.
    - ✅ **RLS activée sur les 34 tables** (vérifié `pg_tables`).
    - 🔴 **2 TROUS RLS TROUVÉS ET CORRIGÉS (SQL, déployé)** : policies mal créées sur `{public}` avec `qual = true` (combinaison OR → ouvre à tous, anon inclus).
      - `contact_pro` : les 3 policies « admin » SELECT/UPDATE/DELETE étaient ouvertes au public → n'importe qui pouvait lire/modifier/supprimer les messages de prospects pros. **Fix** : recréées `for ... to authenticated using (is_admin())`. Insertion publique (formulaire) conservée.
      - `comparaisons` : policy « Service role full access comparaisons » sur `{public}` true → accès total ouvert à tous. **Fix** : `drop policy` (le service_role bypass déjà la RLS). Les policies `auth.uid() = user_id` suffisent.
    - ⚠️ **`analyser` / `analyser-run` : auth faible/absente** (constaté dans le repo). `analyser` vérifie seulement que le header `Authorization` existe (pas de `getUser()`, pas de contrôle de propriété de l'analyseId). `analyser-run` (v18 repo) : **aucun** contrôle. Risque réel **étroit** (il faut des `fileIds` Anthropic valides ; un abus consommerait les crédits de l'attaquant ; `verify_jwt` Supabase peut filtrer en amont — non visible dans le repo). **À durcir (non bloquant pour démarchage)** : valider le token + propriété dans `analyser`, secret interne partagé pour `analyser-run`. ⚠️ Prod = single-call v7 recollé à la main, **pas dans le repo** → me faire coller le vrai `analyser-run` prod avant de le durcir.
    - 🔴 **RESTE LE SEUL MUST-DO CERTAIN : régénérer la clé `service_role`** (compromise 11 mai, screenshots). Tant que non fait → contournement possible de toute la RLS.
  - **Verdict audit** : **démarchage + démos = GO maintenant.** **Onboarding de vraies agences (vraies données RGPD) = GO dès que la clé service_role est régénérée.**
  - **📜 CGV Pro — article 4.5 réécrit (LIVRÉ, `CGVProPage.tsx`).** Fin du « login partagé » → « chacun son propre compte/identifiants ». Ajout bloc « Fonctionnement multi-utilisateurs » (invitation mail lien 7j, 3 rôles, pool partagé, dossiers partagés, facturation centralisée) + encadré « Au-delà de 3 utilisateurs → sur devis ». **Version CGV GARDÉE à v2.3** (aucun pro actif → pas de re-consentement à déclencher). Frontend only.
  - **🔔 UX « Compléter mon dossier » (LIVRÉ, `RapportPage.tsx`).** Constat : l'écran était déjà bon (pédagogie + recalcul score annoncé + message rassurant cloche + bouton retour). Seul ajout : **message rassurant personnalisé avec le nom du dossier** (« Votre dossier « {adresse} » est en cours de mise à jour… prévenu dans la cloche 🔔 dès que le dossier sera mis à jour ») + titre « Mise à jour de votre dossier en cours… ». Variable `nomDossier = safeStr(rapport.adresse) || 'votre bien'`. Vérifié : la note /20 **se recalcule bien** en mode complément (déterministe `recalculerCategories` + somme des 5 catégories) ; la notif cloche backend fire bien pour complément avec le nom du dossier (particulier = cloche + email, pro = cloche seule). Frontend only.
  - **🎨 Fix layout « Mon équipe » (LIVRÉ, `MonEquipePage.tsx`).** Bande blanche à gauche = double padding (le `<main>` pose déjà 24px + la page reposait 28px). Fix : conteneur racine passé de `padding: '24px 28px 60px', maxWidth: 1080` à `paddingBottom: 60, maxWidth: 1100` (aligné sur les autres pages). Appliqué aux 2 conteneurs (liste + fiche membre). Frontend only.
  - **Nettoyage** : fichier parasite `supabase/functions/a` (1 octet) à supprimer sur GitHub.
  - **👥 OFFRE AGENCE > 3 UTILISATEURS — rendue gérable depuis l'admin (LIVRÉ).** Avant : la limite agence était bloquée à 3 et un changement manuel sautait au renouvellement. **Faits vérifiés en prod** : la limite est pilotée **partout par `agences.nb_users_max`** (pas de « 3 » codé en dur) — le frontend invitation (`canInviteMore = nb_users_max - membres`) ET la fonction SQL `create_agence_invitation()` (`IF (v_current + v_pending) >= v_max_users`) lisent cette colonne. La fonction SQL `reset_pro_subscription_credits()` (vérifiée ligne par ligne) **ne touche PAS** `nb_users_max` (que les crédits). Le **seul** endroit qui forçait `3` était le webhook. **3 corrections livrées :**
    - `stripe-webhook-pro` (edge) : `nb_users_max: 3` → `Math.max(3, valeur_actuelle)` (lit l'agence avant l'update). Le renouvellement ne redescend plus un custom > 3.
    - `admin-user-management` (edge) : nouvelle action **`set_agence_users_max`** (admin-only via garde l.818, service_role) — garde-fou : refuse de descendre sous le nb de membres actifs ; bornes 1–50.
    - `AdminPage.tsx` (front) : bloc « 👥 Utilisateurs max » sur la fiche détail agence (champ + bouton « Enregistrer », pré-rempli avec la valeur actuelle, appelle l'action).
    - **Modèle de droits** : l'**admin** fixe le plafond (décision commerciale/sur-devis) ; le **responsable** invite jusqu'à ce plafond depuis son dashboard (il n'augmente jamais son propre plafond). Au-delà de 3 → tout reste synchronisé (pool + dossiers via `agence_members`) ; ajuster le pool de crédits à la main si besoin (action `grant_agence_credits`).
    - ⚠️ **Ordre de déploiement** : déployer les 2 edge functions (`stripe-webhook-pro`, `admin-user-management`) à la main dans Supabase **AVANT** de pousser `AdminPage.tsx` et **avant** de monter une agence > 3 (sinon l'ancien webhook reset à 3 au renouvellement).
  - **⚠️ À DÉPLOYER (récap session 23 juin) :**
    - **GitHub (Vercel auto)** : `CGVProPage.tsx`, `RapportPage.tsx`, `MonEquipePage.tsx`, `AdminPage.tsx` (+ supprimer `supabase/functions/a`)
    - **Supabase Edge Functions (manuel)** : `stripe-webhook-pro`, `admin-user-management`
    - **SQL déjà passé en prod en direct** : trigger `set_analyse_agence_fields` + backfill analyses + 2 fixes RLS (`contact_pro` + `comparaisons`).
- **Session 22 juin 2026 ⭐⭐ : Système crédits AGENCE finalisé (consommation + recharge + crédits offerts) + partage dossiers entre collègues + gros polish admin agence**
  - **Diagnostic clé** : le pool agence (`agences.credits_complete/document`) était AFFICHÉ mais jamais réellement CONSOMMÉ. Les fonctions live partout sont les **v1 sans suffixe** (`get_pro_credits_balance`, `consume_pro_credit`, `refund_pro_credit`) ; les variantes `_v2` ne sont appelées NULLE PART. Seul `get_pro_credits_balance` était agence-aware → l'agent (sans abo perso) était bloqué « plus de crédit ». Source de vérité = **`agence_members`** (et non `profiles.agence_id`, pas toujours rempli).
  - **2a (SQL, déployé + testé OK)** : ajout colonnes `agences.credits_complete_bonus` / `credits_document_bonus` (crédits offerts durables). Réécriture de `consume_pro_credit`, `refund_pro_credit`, `get_pro_credits_balance` pour être agence-aware via `agence_members`. Ordre de consommation agence : **pool mensuel → bonus → achats unitaires perso du membre**. Remboursement → pool. Solde = pool + bonus + unitaires perso. Branches SOLO strictement inchangées.
  - **2b (SQL, déployé)** : `reset_pro_subscription_credits` plantait sur le plan `agence` (CASE solo only) → pool jamais rechargé au renouvellement. Ajout branche `agence` : recharge mensuelle **cumul plafonné 2×** (pool += 15 complètes max 30 / += 30 simples max 60 ; bonus jamais touché). Résout l'agence à sec après le 1er mois.
  - **2c (SQL + edge function + frontend, déployé)** : bouton « Offrir des crédits au pool » réellement branché. Nouvelle table **`agence_credit_grants`** (log id/agence_id/granted_by/credit_type/quantity/reason/created_at + RLS membres & admin). Nouvelle action **`grant_agence_credits`** dans `admin-user-management` (service_role : UPDATE pool bonus + INSERT log ; protégée par la garde admin l.815). Frontend : modal admin (complètes/simples/**motif interne admin uniquement**) + bloc « 🎁 Crédits offerts » sur la fiche agence + section « Crédits offerts » côté **dashboard responsable/membres** (charge `agence_credit_grants` de son agence via `agence_members` et l'affiche comme un pro solo). **Pourquoi edge function pour l'agence et pas solo/particulier** : le pool partagé n'a pas de `user_id` → RLS bloque l'écriture frontend → service_role requis ; le solo/particulier passe par `credit_grants` (trigger, keyé `user_id`).
  - **Affichage admin pool corrigé** : la carte « Pool de crédits partagés » lisait `credits_complete` seul → n'augmentait pas quand on offrait du bonus. Affiche désormais **base + bonus** (« 6 · 4 mensuels + 2 offerts 🎁 »).
  - **Partage des dossiers entre collègues (SQL, déployé + testé OK)** : un membre voyait « 0 analyse » dans le dossier d'un collègue. Cause = RLS `analyses` limitée à `user_id = auth.uid()` (createAnalyse ne pose PAS `agence_id` sur l'analyse). Fix = policy SELECT « Membres agence lecture analyses dossiers » : un membre peut lire une analyse si son `folder_id` pointe vers un `pro_folders` dont l'`agence_id` est une agence où il est membre (`agence_members`, `removed_at IS NULL`). C'est ce qui rend la « lecture libre des dossiers » réellement effective.
  - **BUG REGROUPEMENT AGENCE ADMIN — ✅ RÉSOLU** : le code était bon, c'était un RLS. Les tables `agences` et `agence_members` n'avaient qu'une policy SELECT membre (`my_agence_id()`), pas de policy admin → l'admin (non-membre) lisait vide → pas de regroupement. Fix = policies SELECT `is_admin()` sur les deux tables.
  - **Polish admin AdminPage.tsx (livré, frontend)** : (1) **Vue détail agence complète** (clic bandeau doré) : identité/plan, pool (base+bonus), stats globales, liste membres cliquable, facturation (factures Stripe du responsable = payeur), bloc crédits offerts, **liste « 📋 Analyses de l'agence »** tous membres confondus, cliquables vers le rapport, **paginée « Voir plus » 10 par 10** (range serveur, jamais tout chargé) avec nom membre + date + horaire. (2) **Analyses cliquables sur la fiche client** (complétées → `/dashboard/rapport?id=`). (3) Filtre profil « 🏛 Agence (4) » → **« 🏛 Agences (1 · 4 comptes) »** (agences distinctes · comptes rattachés). (4) Bouton **« Voir l'agence → »** sur la fiche membre (saut direct vers la fiche agence). (5) Barre de recherche Clients Pro + badge « 🏛 Membre d'agence ».
  - **Méthode** : tout buildé + `tsc`/`npm run build` clean avant chaque livraison. Déploiement : SQL dans SQL Editor, edge function redeploy manuel Supabase Studio, frontend push GitHub (Vercel auto-deploy).
- **Session 04 juin 2026 ⭐ : Fix titre analyses (nom de fichier) + grosse investigation timeout 400 s**
  - **Fix affichage titre des analyses (LIVRÉ, frontend, 4 fichiers).** Une analyse complète en cours/échec affichait le **nom du 1er fichier uploadé** (ex « 7089_PV_AG_05.06.2019.pdf ») au lieu d'un libellé propre. **Cause racine** : `useAnalyses.ts` l.49 `adresse_bien = a.address || a.title` — le `|| a.title` (= nom du fichier) remontait quand l'adresse n'était pas encore extraite. **Fix** : fonction partagée **`titreAnalyse()`** ajoutée dans `useAnalyses.ts` (document → nom du doc ; complète + adresse → l'adresse ; complète sans adresse + en cours → « Analyse complète en cours… » ; en échec → « Analyse complète ») + suppression du `|| a.title`. Appliquée côté **particulier** (`MesAnalyses.tsx` CompleteRow + SimpleRow, `HomeView.tsx`) et côté **pro** (`DashboardProPage.tsx`, 4 endroits de **liste** : l.1139 / 5404 getDocName / 5657 / 6503). **Épargnés** (vérifié) : titre de la page rapport (l.2887, 5934) et notif `completed` (l.7789) — l'adresse y est toujours présente. Fichiers livrés : `useAnalyses.ts`, `MesAnalyses.tsx`, `HomeView.tsx`, `DashboardProPage.tsx`. **Frontend only → Vercel auto-deploy, AUCUN SQL ni edge function à redéployer.** ⚠️ Pousser `useAnalyses.ts` en premier (il définit la fonction importée par les autres).
  - **Notif cloche d'échec : déjà bien gérée** (vérifié dans `watchdog-stuck-analyses`) — pour une analyse complète sans adresse, le sujet est « complète » (jamais le nom du fichier), commentaire explicite dans le code. Rien à corriger.
  - **Watchdog vérifié** : couvre `processing` > 1h, `files_ready` > 30 min, `queued` > 1h30 → `failed` + refund + notif. **Cron actif** (confirmé par Alex). Le seuil 30 min est trop lent pour l'UX → à réduire (voir chantier 400 s).
  - **Retour au SINGLE CALL en prod** (voir note en tête section MAP-REDUCE). Le single call gère bien les dossiers normaux ; le MAP-REDUCE était plus lent.
  - **Grosse investigation du timeout 400 s** (hypothèses sortie vs entrée, faits vérifiés sur les limites Supabase/Anthropic, pistes de solution). Tout consigné dans la section « ⏱️ CHANTIER 400 SECONDES » ci-dessous (à continuer la prochaine fois).
- **Session 03 juin 2026 ⭐⭐⭐ : MAP-REDUCE analyse complète RÉALISÉ + déployé + polish rapport**
  - **MAP-REDUCE multi-invocations livré** (`analyser-run` v18) — voir section dédiée « 🎯 MAP-REDUCE » plus haut. Architecture finale ≠ plan initial : le bloquant réel était le **WallClockTime Supabase** (~6-7 min/invocation), pas la qualité de lecture. Solution : découper MAP en tranches de 3 docs + self-invoke (`fetch` sur sa propre URL) entre chaque tranche puis vers le REDUCE. MAP = résumé **texte libre** (pas JSON par type) ; REDUCE = prompt complet original + post-traitement déterministe. Colonne BDD `map_resultats` (jsonb) ajoutée. **Validé en prod à 12 docs.**
  - **Scoring corrigé** : score total = somme des 5 catégories recalculées (`recalculerCategories`), n'utilise plus le score inventé par l'IA.
  - **Bug `anneeStr.match`** corrigé (`annee_construction` en nombre → `String()`), débloque `validateDiagsManquants`.
  - **Règle cohérence travaux** (prompt) : jamais le même travaux en point fort ET vigilance ; point fort = réalisé uniquement ; voté/suspendu/bloqué = vigilance.
  - **Règle gravité procédures** (prompt) : jugée selon l'impact concret sur l'acheteur (coût/risque/blocage, long terme inclus). Élevée −2 / modérée −1 / faible −0,5 sur le score. Doute → niveau le plus élevé.
  - **RapportPage.tsx** : Carrez (bug d'affichage, pas d'extraction — propagation `dpe_recommandations` + recherche dans `diagsPriv` + déplacé dans « Votre lot » en tableau avec emojis par pièce) ; DPE recos affichées + bloc « passer d'une lettre à l'autre » redesigné (pastilles + kWh, flèches visibles, packs en avant) ; procédures triées par gravité + **bloc dépliable explicatif des gravités** (3 cartes colorées avec impact points).
  - **analyse-client.ts** : fix faux « Non généré » (le front ne décide plus l'échec, reflète le status base ; stagnation → « queued » rassurant) ; message rassurant à 3 min ; timeout front 10 → 20 min.
  - **Discussions archi (non codé)** : gestion pannes (retry 3× / doc, doc sauté silencieusement = à traiter, mort brutale = watchdog lent), charge simultanée (pas de file globale, OK 5-10, à revoir 20-30+), plan heartbeat watchdog, plan reprise par queue après surcharge (reprise au bon endroit, abandon 6 tentatives/30 min), garde-fou concurrence. Tout reporté → backlog.
- **Session 02 juin 2026 ⭐ : Polish rapport COMPROMIS + fix lien partage + cadrage chantier MAP-REDUCE**
  - `DocumentRenderer.tsx` (frontend, livré) : suppression du bloc rouge « Points d'attention détectés » en haut du compromis (c'était un **doublon** avec la section « Clauses & particularités » plus bas). Fix bulle d'aide « i » (le `overflow:hidden` de la carte la coupait → passée en `position:fixed`, premier plan). Badge « En cours » des conditions suspensives forcé sur **une seule ligne**. Textes **agrandis** (parties vendeur/acheteur + conditions suspensives). **Lots cédés** refaits en **cartes lisibles** (au lieu d'un tableau serré). Bloc **Vendeur/Acheteur remonté** au-dessus de « Le bien ».
  - `analyser-run` prompt COMPROMIS (livré, ⚠️ **à redéployer manuellement dans Supabase**) : ajout règle **« point de vue ACHETEUR »** → ne jamais mentionner la fiscalité du vendeur (plus-value/moins-value), ne jamais ranger un élément favorable à l'acheteur (ex exonération droits d'enregistrement) en alerte/clause critique ; fourre-tout `"autre"` des `clauses_critiques` resserré (uniquement vrai risque/obligation acheteur).
  - **Fix bug lien de partage particulier** (livré) : « Rapport introuvable » au 1er affichage (marchait après refresh). Cause = `RapportPartagePage` bricolait l'URL avec `history.replaceState` → React Router ne voyait pas le token au 1er rendu. Fix = passer le token en **prop `shareTokenOverride`** à `RapportPage` (fichiers `RapportPartagePage.tsx` + `RapportPage.tsx`). **Frontend only, AUCUN impact** sur dashboard pro/particulier (la prop est optionnelle, repli sur l'ancien comportement). Confirmé OK par Alex.
  - **Cadrage complet du chantier MAP-REDUCE** pour fiabiliser l'analyse complète (réalisé depuis le 03 juin — voir la section dédiée « 🎯 MAP-REDUCE analyse complète — ✅ RÉALISÉ » plus haut). Le plan cadré ce jour-là a évolué à l'implémentation (texte libre + multi-invocations à cause du WallClockTime).
- **Session 28 mai 2026 ⭐ : Plan Agence V2 multi-utilisateurs LIVRÉ**
  - 5 tables BDD créées : agences, agence_members, agence_invitations, envois_rapports, dossier_notes
  - Colonnes ajoutées : analyses (agence_id, created_by_user_id, deleted_at), profiles (agence_id, agence_role), pro_folders (agence_id avec trigger auto-fill)
  - Rôles : responsable (👑), co_responsable (🤝), agent (👤)
  - Fonction `my_agence_id()` SECURITY DEFINER pour casser boucle RLS infinie
  - 2 nouvelles edge functions : `send-agence-invitation`, `accept-agence-invitation`
  - 2 edge functions modifiées : `stripe-webhook-pro` V9 (recharge pool agence), `admin-user-management` v3 (création auto entité agence)
  - Page MonEquipePage.tsx créée (~983 lignes) avec fiche détail membre (KPIs, graph activité 8 semaines, analyses cliquables)
  - DashboardProPage.tsx : sidebar dynamique via `getProNavGroups(agenceRole)`, "Dossiers de l'agence" pour membres, badge "Créé par X" partout, filtre par auteur, agents bloqués sur abonnement/modif entreprise
  - AdminPage.tsx : badges 👑/🤝/👤, bandeau agence sur fiche, filtre "Agence" inclut tous les membres
  - Inputs verrouillés affichent — au lieu de placeholders fantômes
  - Backfill SQL pour membres d'agence existants (pro_invitations créés pour badge "Compte activé")
  - ⚠️ Bug en cours : regroupement visuel des comptes d'agence dans AdminPage ne s'affiche pas en prod
- **Session 27 mai 2026 ⭐ : Plan Agence V1 LIVRÉ + Plaquette PDF Mandataires V8**
  - Produit Stripe créé en LIVE : `prod_UazolFHs7gghhx` / `price_1TbnpDBesXB76oWEdOjLZRh3` (149,90€ HT/mois)
  - 2 colonnes ajoutées à `profiles` (`pro_agence_subscription_unlocked`, `pro_agence_proposition_sent_at`)
  - 3 Edge Functions modifiées + 3 fichiers front modifiés
- **Session 25-26 mai 2026 ⭐ : Système rappels pro + Auto-conversion démo + UX polish**
  - Table `callback_requests` + composant CallbackRequestModal + edge function notify-callback
  - Auto-conversion démo→actif via webhook Stripe (V8)
  - Création compte démo enrichie (tous les champs comme création pro classique)
  - Bouton "Activer le compte" manuel
  - Refonte filtres ClientsProTab admin (2 lignes statut + type)
  - Marque blanche rapports envoyés par pros
  - Retry IA ciblé DPE/Carrez + Validation diags manquants (analyser-run v12)
  - Fix règle frais notaire fiscalement correct (analyser-run v13 — défaut 7,5% ancien, 3% uniquement VEFA)
- **Session 19 mai 2026 ⭐ : Sidebar clair/sombre + refonte Admin Messages**
- **Session 17 mai 2026 ⭐ : Feature DPE Travaux préconisés**
- **Session 16 mai 2026 ⭐ : CGV Pro popup + refonte /pro/rejoindre + MandatairesPage**
- **Session 15 mai 2026 ⭐ : Notifications cliquables + Refonte ProPage**
- **Session 14 mai 2026 ⭐ : Plaquette PDF démarchage Pro V7**
- **Session 13 mai 2026 : Page `/rejoindre` multi-step + Mailjet configuré**
- **Session 12 mai 2026 : Refonte UI compte pro + refonte analyse COMPROMIS**
- **Session 11-12 mai 2026 ⭐ : Mail résiliation pro V7, bannières dashboard, codes promo**
- **Session 11 mai 2026 ⭐ : Bug paiements résolu + filet de sécurité `sync-stripe-payments`**
- **Session 10-11 mai 2026 : CGV Pro V2.3 + admin alerts**
- **Session 10 mai 2026 : Audit sécurité paiements + refonte CA admin V2**

### Sessions plus anciennes
- **Avril 2026** : Stripe production, admin support inbox, pages légales, SEO, dossiers pro, credit_grants, popups succès, page Guides
- **Antérieurement** : Conception initiale, prompt enrichi, scoring déterministe /20, AdminPage, dashboard pro, edge functions, DNS pro.verimo.fr

---

## 🎯 Prochaine session — Actions prioritaires

### 🔒 ÉTAT SÉCURITÉ (audit complet du 23 juin) ⭐⭐⭐
**Solide :** RLS activée sur les 34 tables · webhooks Stripe signés · admin verrouillé (token+rôle) · aucun secret exposé (seule clé anon en dur = publique OK) · prix cohérents partout · tarifs pro non publics.
**Corrigé le 23 juin :** 2 trous RLS (`contact_pro` + `comparaisons`, policies `{public} true` → réservées `is_admin()` / supprimées).
**🔴 RESTE 1 MUST-DO : régénérer la clé `service_role`** (compromise 11 mai) + remettre la nouvelle clé dans les secrets edge functions + recréer le cron. **C'est le dernier verrou avant d'onboarder de vraies agences.** Démarchage/démos = OK dès maintenant.
**🟠 Ensuite (non bloquant) : durcir auth `analyser`/`analyser-run`** (cf. session 23 juin — récupérer le vrai `analyser-run` prod hors repo avant).


### ⏱️ CHANTIER 400 SECONDES — timeout analyse complète (À CONTINUER) ⭐⭐⭐ NOUVEAU 04 juin

**Le problème.** En SINGLE CALL, sur un gros dossier (testé : 4 docs dont un **RCP de 150 pages**), l'appel Claude dépasse les **400 s de wall-clock Supabase** → shutdown brutal du worker → l'analyse reste figée en statut intermédiaire (`files_ready`), pas de rapport, rattrapée seulement par le watchdog 30 min plus tard. **Confirmé par les logs** : « Appel Claude » à 18:18:14 → « shutdown » à 18:24:53 = **exactement 6 min 40 = 400 s**, et **aucun log intermédiaire** (l'appel n'a jamais rendu sa réponse).

**Faits établis et vérifiés cette session (sources officielles) :**
- **Supabase edge functions** : wall-clock = **400 s** (dur, NON augmentable sauf self-hosting). CPU = 2 s mais ne compte QUE le calcul, **pas l'attente réseau** → l'appel Claude est borné par le wall-clock, pas le CPU. Free/Pro : 150 s pour la requête initiale, 400 s pour les **background tasks** (Alex est en background via self-invoke → a bien droit aux 400 s).
- **Self-hosting** des edge functions lèverait le 400 s (réglage `workerTimeoutMs`) MAIS = beta + gérer un serveur Docker → **écarté** (disproportionné, et ça irait CONTRE l'UX : autoriser une attente de 10-15 min n'est pas une bonne UX).
- **Limite PDF Anthropic** : la doc annonce 100 pages/PDF + 32 Mo/requête, MAIS en pratique le **RCP de 150 pages EST passé** (Sonnet 4.6 + Files API) → **la limite de pages n'est PAS le souci**.
- **Context window Sonnet 4.6 = 1M tokens** (API standard, sans surcoût ; sortie plafonnée à 64K). PDF ≈ **1500-3000 tokens/page** (chaque page = image). Dossier moyen ~210 p ≈ 420K ; grosse copro ~340 p ≈ 510K-1M → **rentrent dans 1M**. Le dépassement de contexte est rare.
- **Single call** : passe sur dossiers normaux/moyens, timeout sur les très gros.
- **AbortController** (350 s en single / 240 s en reduce) **ne coupe PAS de façon fiable** l'appel fetch en cours → le worker traîne jusqu'au kill 400 s. Défaut connu.

**Hypothèses sur l'origine du timeout (À TRANCHER PAR LA MESURE) :**
- **Hyp. A — la SORTIE** (génération du rapport, écrite token par token = lent) : probablement le facteur dominant, mais **non prouvé**.
- **Hyp. B — l'ENTRÉE** (lecture de gros volumes : RCP 150 p ≈ 300K tokens) : peut aussi peser lourd.
- Impossible de trancher avec les logs actuels (rien entre « Appel Claude » et le shutdown).

**➡️ PROCHAINE ÉTAPE N°1 (avant de coder une solution) : LOG DE MESURE.** Ajouter dans `analyser-run`, juste après l'appel `callAI`, un log affichant le **temps écoulé** + la **taille du rapport généré** (nb de caractères/tokens). Lancer une analyse petite / moyenne / grosse → voir si le temps suit la **taille du rapport** (= sortie) ou le **nb de pages** (= entrée). Sans ça, risque de coder la mauvaise solution.

**Solutions selon le résultat :**
- **Voie simple (à privilégier d'abord)** : garder le single call (suffit pour la grande majorité). Sur les rares dossiers trop lourds → bascule propre en échec + message clair (« dossier volumineux, réessayez »). + filet UX ci-dessous.
- **Si la SORTIE est le goulot → découper la GÉNÉRATION par onglet.** Générer le rapport en plusieurs self-invocations, **un onglet par invocation** (copro, logement, procédure, doc, puis **synthèse + score en dernier**). Chaque invocation : génère 1 onglet → **sauvegarde** (colonne jsonb, type `map_resultats`) → **relance la suivante en fire-and-forget** (sans `await` bloquant) → se termine. Chaque morceau finit largement sous 400 s ; la barre de progression avance onglet par onglet (bonne UX). Mécanisme = le **self-invoke déjà présent dans le map-reduce**. **Avantage vs map-reduce** : chaque onglet voit les **vrais docs** (via cache), pas un résumé → **pas de perte d'info en cascade**.
- **Si l'ENTRÉE est le goulot → prompt caching de l'entrée** : ne lire les docs qu'une fois.

**Prompt caching (utile dans les deux cas, INDISPENSABLE si on découpe la sortie) :**
- Marqueur **`cache_control: { type: 'ephemeral' }`** sur le **dernier** bloc `document` de la liste → tout ce qui est au-dessus (docs + system prompt) est mis en cache d'un coup.
- Files API ≠ cache : le `file_id` évite de renvoyer le PDF sur le réseau, mais SANS cache le modèle **relit** le doc à chaque appel. Le cache garde le **travail de lecture** (~5 min, réallongé à chaque appel qui le touche → les onglets s'enchaînent dans la fenêtre).
- Coût : 1ère écriture ~1,25× input, puis chaque lecture cache = **10 % du prix**. Sur 5 appels → largement gagnant.
- **Les lectures cache ne comptent PAS dans l'ITPM** (limite de débit) → bonus rate limit.
- ⚠️ Sans cache, le découpage par onglet RELIT les docs à chaque onglet → si l'entrée est le goulot, ça l'**aggrave**.

**Filet UX (sous-chantier lié, à faire dans tous les cas) :**
- **Front** : afficher « échec » dès qu'une analyse non-terminale dépasse **~8 min** (une réussie ne dépasse jamais ~7 min), sans attendre le watchdog (qui continue le remboursement en arrière-plan).
- **Watchdog** : réduire le seuil `files_ready` de **30 min → ~10-12 min** (plus réactif, sans risque de tuer une analyse vivante puisque < 400 s).
- `beforeunload` Supabase = **pas fiable** (Supabase dit de ne pas s'y reposer) → ne pas compter dessus pour basculer en échec.

**État repo vs prod sur ce point :** le repo contient encore le MAP-REDUCE (`analyser-run` ~2575 lignes) ; la PROD tourne sur le **SINGLE CALL v7** recollé manuellement. Repartir du single call pour ce chantier.

---

### ⭐⭐⭐ MAP-REDUCE : FAIT — reste à valider en conditions réelles
Le MAP-REDUCE a été livré et déployé le 03 juin (voir section dédiée « 🎯 MAP-REDUCE analyse complète — ✅ RÉALISÉ »). Il reste à :
- **Vérifier la qualité sur de vrais dossiers** : ouvrir une analyse + les docs sources en parallèle, contrôler 4-5 chiffres clés (surface Carrez, montant appel de fonds, classe DPE, date AG). Comparer si possible avec l'ancien système sur le même dossier — jamais fait formellement.
- **Vérifier l'affichage** des fix livrés une fois déployés : Carrez dans « Votre lot », bloc DPE redesigné, tri + bloc explicatif des gravités, plus de faux « Non généré ».

### ⭐⭐ Robustesse MAP-REDUCE (plans validés, NON codés — voir section dédiée pour le détail)
- **Doc sauté silencieusement** : aujourd'hui un doc en échec après 3 tentatives est retiré du REDUCE sans aucun signalement client. Décision en attente : (A) échec global + remboursement / (B) rapport partiel signalé / (C) reprise par queue au bon endroit. Alex penche vers **C** (reprise au bon endroit + abandon 6 tentatives/30 min) — chantier lourd, session dédiée.
- **Heartbeat watchdog** : colonne `last_heartbeat` + watchdog basé sur inactivité ~7-8 min + cron à ~3 min, pour rattraper une mort brutale d'invocation en ~10 min au lieu de 60.
- **Garde-fou concurrence** (optionnel, demi-pas avant vraie file globale) : si > ~10 analyses en `processing` → mettre en `queued` direct.

### Rappels rapides issus de la session 03 juin
- ⚠️ **Redéployer `analyser-run` (v18) à la main** dans Supabase (push GitHub ne déploie pas les edge functions). Contient tout le MAP-REDUCE + scoring + anneeStr + règles travaux/gravité.
- ⚠️ **SQL déjà passé** : `alter table analyses add column if not exists map_resultats jsonb;` (vérifier que c'est bien le cas en prod).
- Pousser sur GitHub les fichiers frontend livrés : `RapportPage.tsx`, `analyse-client.ts`.
- Gap renderer à traiter quand l'occasion se présente : créer la fiche dédiée **FICHE_SYNTHETIQUE**.

### Rappels rapides issus de la session 02 juin
- Vérifier que les fichiers frontend livrés le 02 juin (`DocumentRenderer.tsx`, `RapportPartagePage.tsx`) sont bien poussés sur GitHub.

### 🔥 BUGS BLOQUANTS à fixer en priorité absolue

1. **🚨 BUG REGROUPEMENT VISUEL AGENCE ADMIN** — Le code de regroupement (header doré dépliable avec chevron + membres indentés + séparateur "Comptes individuels (N)" + solos en dessous) est livré mais ne s'affiche pas en prod. Hypothèses à investiguer :
   - Vérifier sur GitHub que `sortedAgences` est bien présent dans le AdminPage.tsx push (Ctrl+F → 4-5 occurrences attendues)
   - Si manquant → repush. Si présent → console F12 pour identifier le bug runtime
   - Tester sur filtre "Tous" ET "Agence" pour isoler

2. **Bug "Erreur d'affichage" sur l'onglet Compromis** (RapportPage.tsx → TabCompromis)

3. **UX "Compléter mon dossier" — 3 frictions** :
   - Faux progress bar qui se bloque à 90%
   - Message anxiogène "Ne fermez pas cette fenêtre"
   - Pas de pédagogie sur ce que fait "Compléter"

### Étapes Agence restantes

4. **C2 — Permissions fines DossierDetail** : bloquer ajout vendeur / nouvelle analyse / modif titre pour non-créateurs ; garder ajout acheteur + envoi rapport accessibles à tous ; badge visuel "Lecture seule sur ce dossier"

5. **Mettre à jour article 4.5 CGV Pro** pour V2 multi-utilisateurs

### Tests à effectuer
6. **Test E2E agence complet** : Création responsable → activation → souscription Stripe → invitation 2 agents → acceptation → dossiers partagés → analyse par agent → rapport envoyé
7. **Test système callbacks end-to-end**
8. **Test auto-conversion démo→actif**
9. **Test bouton "Activer le compte" manuel**

### Technique
10. **Régénérer service_role key** + recréer le cron
11. **Test E2E complet du cycle pro** (souscription/upgrade/downgrade/unitaire/remboursement)
12. **Soumettre les 47 URLs guides** Google Search Console
13. **Réactiver le cron sync-stripe-payments**

### Funnel pro / démarchage
14. **Créer un exemple de rapport Verimo anonymisé** en PDF
15. **Rédiger 3 email templates** de démarchage
16. **Argumentaire / objections-réponses** pour les démos

### Session dédiée à prévoir
17. **Session lifecycle pro** : Suspendre / Lever / Résilier / Webhook Stripe résiliation / past_due / suppression user / badges statuts admin

**Méthode** :
1. Coller ce context.md en début de conversation
2. Valider chaque chantier avant de coder
3. Une étape à la fois, fichiers livrés via `present_files` depuis `/mnt/user-data/outputs/`
4. Pas de code sans accord
5. Tester sur compte pro démo / agence test après chaque étape
