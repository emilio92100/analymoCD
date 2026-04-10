# VERIMO — Contexte projet complet — 10 avril 2026

> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## Profil développeur
- Débutant en développement
- Modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- Pour créer un nouveau fichier : GitHub → dossier cible → "Add file" → "Create new file"
- Vercel redéploie automatiquement après chaque push GitHub
- Claude peut cloner le repo : `https://github.com/emilio92100/analymoCD.git`
- Claude doit toujours re-cloner avant de modifier, puis donner le fichier COMPLET à coller

---

## Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE...). Rapport clair avec score /20, risques, recommandations.

**Slogan :** *Vos documents décryptés, votre décision éclairée.*

**Cible :** Acheteurs particuliers (primo-accédants et investisseurs, avant offre et après compromis), notaires, agents, syndics, marchands de biens.

### Logique crédits / prix
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de score /20
- 19,90€ → 1 crédit analyse complète
- 29,90€ → 2 crédits analyse complète (Pack 2 biens — comparaison incluse)
- 39,90€ → 3 crédits analyse complète (Pack 3 biens — comparaison + classement)
- Les crédits n'expirent jamais et s'accumulent
- Nouveaux comptes arrivent à 0 crédit

### Stripe Price IDs (mode TEST — à passer en live)
```
document : price_1TIb1LBO4ekMbwz0020eqcR0  (4,90€)
complete : price_1TIb3XBO4ekMbwz0a7m7E7gD  (19,90€)
pack2    : price_1TIb4KBO4ekMbwz0gGF2gI1S  (29,90€)
pack3    : price_1TIb51BO4ekMbwz0mmEez47o  (39,90€)
```

---

## Stack technique
- **Frontend** : React + Vite + TypeScript + Tailwind
- **Backend** : Supabase Pro (auth + DB + Edge Functions Deno + Storage)
- **IA** : Claude Sonnet 4.5 (`claude-sonnet-4-5`) via API Anthropic
- **Paiement** : Stripe (mode TEST actuellement)
- **Déploiement** : Vercel (auto depuis GitHub)
- **Repo** : `github.com/emilio92100/analymoCD`
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`

---

## Routes
```
/                           → HomePage
/notre-methode              → MethodePage
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
/dashboard/rapport?id=XXX   → DashboardPage (RapportDashboard) ← APERÇUS GRATUITS
/rapport?id=XXX             → RapportPage standalone ← RAPPORTS COMPLETS PAYANTS
```

---

## Système aperçu gratuit

- 1 aperçu gratuit par compte
- Stocké dans `profiles.free_preview_used` + `localStorage.verimo_free_preview_used`
- Sync au login → zéro flash UI
- `markFreePreviewUsed()` appelé **dès le lancement** (pas après)
- `unmarkFreePreviewUsed()` appelée si analyse échoue → offre restaurée

### Flow complet
1. Badge "1 analyse offerte 🎁" visible
2. Clic → upload → `lancerApercu()` → `markFreePreviewUsed()` immédiat
3. Si échec → `unmarkFreePreviewUsed()` → offre restaurée
4. Aperçu sauvegardé dans Supabase : `is_preview=true`, `apercu={}`, `result=null`
5. Badge "Aperçu gratuit" dans Mes analyses
6. Clic "Rapport" → `/dashboard/rapport?id=XXX` → `RapportDashboard` (avec sidebar)
7. Bouton "Débloquer" → Stripe avec `successUrl=/dashboard/rapport?id=XXX&action=reupload`
8. Après paiement → message RGPD + invitation re-upload

### Logique bouton Analyser
```
Si offre pas utilisée ET 0 crédit du bon type → lancerApercu()
Sinon → lancer() (analyse payante)
Si 0 crédit ET offre utilisée → redirection /dashboard/tarifs
```

### Message re-upload après paiement
> "Bonne nouvelle ! Conformément au RGPD, vos documents ont été supprimés 🔒. Re-uploadez vos documents pour générer votre rapport complet..."

---

## Architecture pipeline d'analyse

### Flux complet
1. Frontend uploade les PDFs → Storage Supabase (`analyse-temp`)
2. Frontend envoie `storagePaths` + `fileNames` + `analyseId` à l'Edge Function
3. Edge Function télécharge les fichiers depuis Storage, les supprime immédiatement après lecture
4. `EdgeRuntime.waitUntil()` → répond immédiatement au frontend, traite en arrière-plan sans limite de temps
5. Frontend poll Supabase toutes les 3 secondes jusqu'à `status = completed` (timeout 12 min)
6. Redirection vers RapportPage

### Stratégie automatique
- **Single-call** : ≤4 docs ET ≤80 pages estimées → tous les docs en un seul appel Claude
- **Map-Reduce** : >4 docs OU >80 pages → prompt MAP par doc (2500 tokens) puis REDUCE final (8000 tokens)

### Tokens
- MAP par doc : 2500 tokens
- REDUCE / Single-call mode complete : 8000 tokens
- Single-call mode document : 2000 tokens

### Modèle
- `claude-sonnet-4-5` (string exact — NE PAS utiliser claude-sonnet-4-6 qui n'existe pas)

---

## Edge Function `analyser` (v3)

### Secrets Supabase
- `ANTHROPIC_API_KEY` : clé API Anthropic
- `STRIPE_SECRET_KEY` : clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` : secret webhook Stripe
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` : auto-injectés

### Autres Edge Functions
- `create-checkout-session` : création session Stripe
- `stripe-webhook` : traitement paiements → ajout crédits

### Types de documents détectés
`PV_AG | REGLEMENT_COPRO | APPEL_CHARGES | DPE | DIAGNOSTIC | DDT | COMPROMIS | ETAT_DATE | TAXE_FONCIERE | AUTRE`

### PROMPT_MAP — extraction intelligente par type
- **PV_AG** : participation (présents/représentés/tantièmes), travaux votés + statut réalisation, appels fonds exceptionnels (charge vendeur si avant compromis), honoraires syndic, questions diverses, résolutions refusées, tensions syndic
- **REGLEMENT_COPRO** : tantièmes du lot, restrictions usage, parties privatives (cave, parking), clauses travaux
- **DPE** : date diagnostic (ALERTE si avant 01/07/2021 — invalide depuis 01/01/2025), étiquette énergie/GES, type chauffage individuel/collectif, préconisations travaux avec coûts
- **APPEL_CHARGES** : quote-part tantièmes, charges courantes vs exceptionnelles, budget prévisionnel vs réalisé, fonds travaux ALUR
- **COMPROMIS** : conditions suspensives, date jouissance, répartition travaux vendeur/acheteur (votés avant compromis = charge vendeur), pénalités
- **ETAT_DATE** : impayés du lot, provisions non soldées, quote-part fonds travaux ALUR (revient à l'acheteur à l'acte)
- **DIAGNOSTIC** : nature, résultats, préconisations travaux avec urgence et coûts
- **TAXE_FONCIERE** : montant annuel, année, adresse

### ⚠️ Table `reglementation` non réinjectée
La table `reglementation` (15 règles législatives DPE/copropriété/vente/diagnostics) existait dans l'ancienne version mais n'est plus injectée dans les prompts depuis la réécriture v3. À réintégrer si besoin.

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `supabase/functions/analyser/index.ts` | Edge Function v3 — Storage download, Map-Reduce intelligent, EdgeRuntime.waitUntil |
| `src/lib/analyse-client.ts` | Upload Storage, déclenchement Edge Function, polling 12 min |
| `src/lib/analyses.ts` | CRUD Supabase — createAnalyse, createApercu, fetchAnalyses, deductCredit, refundCredit, unmarkFreePreviewUsed |
| `src/pages/RapportPage.tsx` | Affichage rapport standalone — 7 onglets + mapping JSON Claude → composants |
| `src/pages/DashboardPage.tsx` | RapportDashboard pour aperçus, route /dashboard/rapport |
| `src/pages/dashboard/NouvelleAnalyse.tsx` | UX progression 2 colonnes, étapes visuelles, logique crédits/aperçu |
| `src/pages/dashboard/MesAnalyses.tsx` | Liste analyses — note + rapport + suppression uniquement |
| `src/pages/dashboard/HomeView.tsx` | Tableau de bord — sans badge recommandation |
| `src/pages/dashboard/Compare.tsx` | Comparaison analyses — présent mais non testé |
| `src/pages/dashboard/Tarifs.tsx` | Page tarifs dashboard avec codes promo |
| `src/pages/dashboard/Compte.tsx` | 3 encarts : crédits complets, crédits simples, analyses réalisées |
| `src/pages/ExemplePage.tsx` | Rapport de démo avec MOCK_RAPPORT |
| `src/pages/AdminPage.tsx` | Espace admin — gestion codes promo |

---

## Base de données Supabase

### Table `analyses`
```
id UUID
user_id UUID → profiles
type TEXT (document | complete | pack2 | pack3 | apercu_complete | apercu_document)
status TEXT (pending | processing | completed | failed)
title TEXT
score NUMERIC (décimal ex: 11.5 — migré de INTEGER)
avis_verimo TEXT
profil TEXT (rp | invest)
type_bien TEXT (appartement | maison | maison_copro | indetermine)
score_couleur TEXT
result JSONB
apercu JSONB
is_preview BOOLEAN
paid BOOLEAN
progress_current INTEGER
progress_total INTEGER
progress_message TEXT
document_names TEXT[]
regeneration_deadline TIMESTAMPTZ (created_at + 7 jours)
stripe_payment_id TEXT
address TEXT
document_urls TEXT[]
created_at TIMESTAMPTZ
```

### Table `profiles`
```
id UUID → auth.users
full_name TEXT
free_preview_used BOOLEAN
created_at TIMESTAMPTZ
```

### Table `reglementation`
```
categorie TEXT (DPE | COPROPRIETE | VENTE | DIAGNOSTICS | GENERAL)
titre TEXT
contenu TEXT
actif BOOLEAN
date_entree_vigueur DATE
date_expiration DATE
```

### RLS
- `service_role` bypass RLS (utilisé par l'Edge Function)
- Policies UPDATE/SELECT/INSERT pour `auth.uid() = user_id`

---

## Structure JSON retourné par Claude (mode complete)

```json
{
  "titre": "adresse du bien",
  "type_bien": "appartement | maison | maison_copro | indetermine",
  "score": 14.5,
  "score_niveau": "Bien sain",
  "recommandation": "Acheter | Négocier | Risqué",
  "resume": "4-5 phrases",
  "points_forts": [],
  "points_vigilance": [],
  "travaux": {
    "votes": [{"description": "", "montant": 0, "statut": "", "date_vote": ""}],
    "evoques": [],
    "estimation_totale": null
  },
  "finances": {
    "charges_annuelles": null,
    "fonds_travaux": null,
    "fonds_travaux_statut": "conforme | insuffisant | absent | non_mentionne",
    "impayes": null
  },
  "procedures": [{"label": "", "type": "", "gravite": "faible|moderee|elevee", "message": ""}],
  "diagnostics_resume": "texte libre",
  "diagnostics": [
    {
      "type": "DPE",
      "label": "",
      "perimetre": "lot_privatif | parties_communes | immeuble",
      "resultat": "",
      "details": "",
      "date_diagnostic": null,
      "date_validite": null,
      "alerte": null,
      "travaux_preconises": []
    }
  ],
  "documents_manquants": [],
  "negociation": {
    "applicable": false,
    "elements": [{"motif": "", "impact": 0, "levier": "", "estimation": ""}]
  },
  "risques_financiers": "",
  "vie_copropriete": {
    "syndic": {"nom": null, "fin_mandat": null, "tensions_detectees": false, "tensions_detail": null},
    "participation_ag": [{"date": "", "taux": "", "presents_representes": ""}],
    "tendance_participation": "",
    "analyse_participation": "",
    "travaux_votes_non_realises": [],
    "appels_fonds_exceptionnels": [],
    "questions_diverses_notables": []
  },
  "lot_achete": {
    "quote_part_tantiemes": null,
    "parties_privatives": [],
    "impayes_detectes": null,
    "fonds_travaux_alur": null,
    "travaux_votes_charge_vendeur": [],
    "restrictions_usage": [],
    "points_specifiques": []
  },
  "avis_verimo": "..."
}
```

---

## Onglets RapportPage (ordre actuel)

1. **Synthèse** — résumé, points forts/vigilance, avis Verimo (paragraphes ou étapes numérotées), pistes de négociation (cards avec motif/impact€/levier), documents manquants (badges ⚠️)
2. **Copropriété** — syndic, participation AG, votre lot (tantièmes/fonds ALUR/parties privatives/restrictions), travaux non réalisés, appels de fonds exceptionnels, questions diverses
3. **Travaux** — réalisés, votés, évoqués non votés, estimation totale
4. **Finances** — budget copro ou lot selon docs détectés (label contextuel), fonds travaux + explication légale ALUR 5%
5. **Diagnostics** — séparé parties privatives / parties communes, alertes visuelles par type
6. **Procédures** — label + type + gravité + détail + conseil
7. **Documents** — fichiers analysés listés

### Règles d'affichage
- Section "Charges de copropriété" masquée pour maisons individuelles (`type_bien === 'maison'`)
- Budget : label "Charges annuelles du lot / Détecté sur appel de charges" si pas de PV AG détecté
- Fonds travaux insuffisant : explication légale ALUR (minimum 5% budget annuel)
- Diagnostics : couleurs par type (DPE bleu, amiante rouge, plomb violet, électricité orange, gaz orange-rouge)

---

## UX Progression (NouvelleAnalyse)

Layout 2 colonnes sur PC :
- **Colonne gauche** : header sombre avec % et barre shimmer, 5 étapes visuelles avec timeline
- **Colonne droite** : état par document (⏳→📤→📖→✅), temps estimé

5 étapes : Envoi documents → Lecture documents → Analyse approfondie → Synthèse croisée → Génération rapport

Après détection `completed` : attente 1.5s pour que la barre atteigne 100% avant redirection

---

## Flux paiement complet

### Achat depuis page Tarifs
1. Clic "Acheter" → `CheckoutModal` → Stripe
2. `success_url` → `/dashboard/tarifs?success=true`
3. Webhook Stripe → `stripe-webhook` → ajoute crédits dans `profiles`

### Déblocage depuis aperçu gratuit
1. Clic "Débloquer" → `lancerPaiementApercu(isComplete, apercuId)`
2. `success_url` → `/dashboard/rapport?id=APERCU_ID&action=reupload`
3. Webhook Stripe → ajoute crédits
4. `RapportDashboard` détecte `action=reupload` → message RGPD
5. Utilisateur re-uploade → analyse complète → `/rapport?id=NEW_ID`

---

## Système re-génération (7 jours)

- `regeneration_deadline` = `created_at + 7 jours`
- Bannière visible sur rapport complet pendant 7 jours
- Permet d'ajouter des docs et régénérer gratuitement

---

## Décisions produit

- **Score** : /20 (pas /10)
- **Analyse simple** : 1 doc, pas de score, titre = nature du document
- **Analyse complète** : docs illimités pour un bien, score /20, titre = adresse du bien
- **Aperçu gratuit** : résumé + points de vigilance + score flouté + CTA débloquer
- **RGPD** : documents supprimés après traitement → re-upload nécessaire après paiement aperçu
- **Comparaison biens** : se débloque avec 2+ analyses complètes

---

## Points connus non résolus / à surveiller

| Problème | Statut |
|---|---|
| Diagnostics vides sur DDT en Map-Reduce | Fallback sur `diagnostics_detectes` ajouté, à vérifier |
| Votre lot — affichage désordonné | Mentionné, pas encore revu |
| Table `reglementation` non utilisée | Présente en base, non injectée depuis v3 Edge Function |
| `feature_collector.js:23` warning | SDK tiers, inoffensif |
| WebSocket `ws://127.0.0.1:30580` | Erreur dev locale apparaissant en prod, inoffensive |
| Régénération rapport (7 jours) | Colonne présente, logique non testée |
| PDF téléchargeable | `window.print()` — non optimisé |
| Compare.tsx | Présent, non testé |
| Stripe mode TEST | À passer en production |
| Mobile responsive progression | 2 colonnes non adaptées mobile |
| Réglementation non injectée | Table existante mais non utilisée dans v3 |

---

## Bugs résolus dans cette session (10 avril 2026)

- `output_config: { effort: 'medium' }` → supprimé (paramètre invalide API Anthropic)
- Modèle `claude-sonnet-4-6` → corrigé en `claude-sonnet-4-5`
- Colonne `score` INTEGER → migrée en NUMERIC (score décimal ex: 11.5)
- Colonnes manquantes en base → migration SQL appliquée (score, avis_verimo, profil, apercu, is_preview, paid, progress_*, document_names)
- `nettoyerStorage` côté client → supprimé (supprimait les fichiers avant que l'Edge Function les lise)
- Edge Function ne lisait pas `storagePaths` → corrigé
- JSON tronqué (max_tokens 4000 insuffisant) → 8000 tokens
- `parseJson` ne gérait pas les backticks → extraction entre `{` et `}`
- `EarlyDrop` Supabase → `EdgeRuntime.waitUntil()` + plan Pro + spend cap désactivé
- Limite 100 pages API Anthropic → Map-Reduce automatique
- Check constraint sur `type` → étendu à `apercu_complete | apercu_document`
- Badge recommandation → supprimé de MesAnalyses et HomeView
- Avis Verimo vide en mode document → utilise `conclusion` comme fallback
- Budget copro vs lot → label contextuel selon docs détectés
- Fonds travaux insuffisant → explication légale ALUR ajoutée
- Travaux `[object Object]` → mapping toTravaux robuste avec filtre null
- Négociation JSON brut → cards structurées motif/impact/levier
- Documents manquants texte brut → badges avec ⚠️ obligatoire
