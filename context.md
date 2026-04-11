# VERIMO — Contexte projet complet — 11 avril 2026

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
- **IA** : Claude Sonnet 4.6 (`claude-sonnet-4-6`) via API Anthropic + Files API
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

---

## Architecture pipeline d'analyse — v4 (Files API + 2 Edge Functions)

### Pourquoi cette architecture
L'ancienne architecture (v3) utilisait le Map-Reduce : chaque doc était analysé séparément puis synthétisé. Problèmes :
- Perte de cohérence entre les documents (Claude ne voyait pas tout en même temps)
- Timeout Supabase (400s max) avec beaucoup de docs

### Nouvelle architecture — Files API + Single-call
- **Files API Anthropic** : chaque PDF est uploadé séparément → `file_id` léger
- **Single-call** : Claude reçoit tous les `file_id` en une seule requête → cohérence totale
- **Identique au chat Claude** : Claude voit tous les documents ensemble simultanément
- **RGPD** : suppression immédiate des fichiers après analyse (< 1 minute sur serveurs Anthropic)
- **Pas de limite de taille de requête** : les file_ids sont légers, plus d'erreur 413
- **Modèle** : `claude-sonnet-4-6` — 600 pages PDF par requête, 1M tokens contexte, 64K tokens output

### Flux complet
1. Client uploade PDFs → Supabase Storage (`analyse-temp`)
2. **Edge Function `analyser`** (rapide, <30s) :
   - Télécharge les PDFs depuis Storage
   - Uploade chaque PDF vers **Files API Anthropic** → `file_id`
   - Stocke les `file_ids` dans `analyses.file_ids` (jsonb)
   - Met `status = files_ready`
   - Appelle directement `analyser-run` via HTTP avec `{ analyseId, fileIds, mode, profil }`
   - Répond immédiatement au frontend
3. **Edge Function `analyser-run`** (peut durer 10+ min, pas de limite HTTP) :
   - Reçoit les `fileIds` directement dans le payload (pas de lecture Supabase pour le status)
   - Construit le contenu avec les `file_id` (requête légère)
   - Met à jour `progress_message` toutes les 60s pour rassurer le frontend
   - Single-call Claude avec tous les `file_ids` — 64 000 tokens output max
   - Suppression immédiate de tous les fichiers Anthropic (RGPD)
   - Sauvegarde le rapport dans Supabase → `status = completed`
4. Frontend poll Supabase toutes les 3s → détecte `completed` → redirection rapport

### Pourquoi 2 Edge Functions séparées
- Supabase coupe les Edge Functions après 400s (WallClockTime)
- `analyser` répond en <30s → pas de timeout
- `analyser-run` est appelée directement par `analyser` (pas via webhook) → pas de limite HTTP
- Le webhook Database existait mais a été supprimé car causait des race conditions

### Paramètres techniques
- **Files API beta header** : `files-api-2025-04-14`
- **Max output tokens** : 64 000 (limite max Sonnet 4.6)
- **Taille max par fichier** : 100 MB (Files API Anthropic)
- **Stagnation frontend** : 15 minutes avant de marquer failed

### Appel HTTP interne analyser → analyser-run
```typescript
fetch(`${supabaseUrl}/functions/v1/analyser-run`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'apikey': supabaseServiceKey,
  },
  body: JSON.stringify({ analyseId, fileIds, mode, profil }),
})
```
⚠️ `analyser-run` doit avoir **"Verify JWT" = OFF** dans ses Settings Supabase

---

## Edge Functions

### `analyser` (v5 — rapide)
- Download Storage → Upload Files API → stocke file_ids → appelle analyser-run → répond
- Pas de `waitUntil` — répond normalement après avoir lancé analyser-run

### `analyser-run` (v8+ — longue durée)
- Reçoit `{ analyseId, fileIds, mode, profil }` dans le payload
- Lance `runAnalyseWithData()` via `EdgeRuntime.waitUntil()`
- Update progress_message toutes les 60s
- Single-call Claude avec file_ids
- Suppression RGPD immédiate après analyse
- Verify JWT = **OFF** (obligatoire pour appel interne)

### Secrets Supabase
- `ANTHROPIC_API_KEY` : clé API Anthropic
- `STRIPE_SECRET_KEY` : clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` : secret webhook Stripe
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` : auto-injectés

### Autres Edge Functions
- `create-checkout-session` : création session Stripe
- `stripe-webhook` : traitement paiements → ajout crédits

---

## Fichiers clés

| Fichier | Rôle |
|---|---|
| `supabase/functions/analyser/index.ts` | Edge Function v5 — Upload Files API, appel direct analyser-run |
| `supabase/functions/analyser-run/index.ts` | Edge Function v8 — Single-call Claude, RGPD, 64K tokens |
| `src/lib/analyse-client.ts` | Upload Storage, déclenchement analyser, polling 15 min, détection stagnation |
| `src/lib/analyses.ts` | CRUD Supabase — createAnalyse, createApercu, fetchAnalyses, deductCredit, refundCredit |
| `src/pages/RapportPage.tsx` | Affichage rapport standalone — onglets + mapping JSON Claude → composants |
| `src/pages/dashboard/NouvelleAnalyse.tsx` | UX progression 2 colonnes, 4 étapes visuelles, logique crédits/aperçu |
| `src/pages/dashboard/MesAnalyses.tsx` | Liste analyses |
| `src/pages/dashboard/HomeView.tsx` | Tableau de bord |
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
status TEXT (pending | processing | files_ready | completed | failed)
mode TEXT (ajouté session 11 avril)
file_ids JSONB (ajouté session 11 avril — stocke [{id, name}] temporairement)
title TEXT
score NUMERIC (décimal ex: 11.5)
avis_verimo TEXT
profil TEXT (rp | invest)
type_bien TEXT (appartement | maison | maison_copro | indetermine)
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
created_at TIMESTAMPTZ
```

⚠️ `status = 'files_ready'` est un status intermédiaire — les file_ids sont stockés, analyser-run est en train de lancer Claude. `file_ids` est vidé après analyse.

### Table `profiles`
```
id UUID → auth.users
full_name TEXT
free_preview_used BOOLEAN
created_at TIMESTAMPTZ
```

### RLS
- `service_role` bypass RLS (utilisé par l'Edge Function)
- Policies UPDATE/SELECT/INSERT pour `auth.uid() = user_id`

---

## Structure JSON retourné par Claude (mode complete)

```json
{
  "titre": "adresse du bien",
  "type_bien": "appartement | maison | maison_copro",
  "annee_construction": "1985 ou null",
  "score": 14.5,
  "score_niveau": "Bien sain",
  "resume": "4-5 phrases",
  "points_forts": [],
  "points_vigilance": [],
  "travaux": {
    "realises": [{"label": "", "annee": "", "montant_estime": 0, "justificatif": true}],
    "votes": [{"label": "", "annee": "", "montant_estime": 0, "charge_vendeur": false}],
    "evoques": [{"label": "", "annee": null, "montant_estime": null, "precision": ""}],
    "estimation_totale": null
  },
  "finances": {
    "budget_total_copro": null,
    "charges_annuelles_lot": null,
    "fonds_travaux": null,
    "fonds_travaux_statut": "conforme | insuffisant | absent | non_mentionne",
    "impayes": null,
    "type_chauffage": null
  },
  "procedures": [{"label": "", "type": "copro_vs_syndic|impayes|contentieux|autre", "gravite": "faible|moderee|elevee", "message": ""}],
  "diagnostics_resume": "texte libre",
  "diagnostics": [
    {
      "type": "DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|AUTRE",
      "label": "",
      "perimetre": "lot_privatif | parties_communes",
      "localisation": "",
      "resultat": "",
      "presence": "detectee | absence | non_realise",
      "alerte": null
    }
  ],
  "documents_analyses": [{"type": "PV_AG|REGLEMENT_COPRO|...", "annee": null, "nom": ""}],
  "documents_manquants": [],
  "negociation": {"applicable": false, "elements": []},
  "vie_copropriete": {
    "syndic": {"nom": null, "fin_mandat": null, "tensions_detectees": false, "tensions_detail": null},
    "participation_ag": [{"annee": "", "copropietaires_presents_representes": "", "taux_tantiemes_pct": "", "quorum_note": null}],
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
  "categories": {
    "travaux": {"note": 4, "note_max": 5},
    "procedures": {"note": 4, "note_max": 4},
    "finances": {"note": 3, "note_max": 4},
    "diags_privatifs": {"note": 2, "note_max": 4},
    "diags_communs": {"note": 1.5, "note_max": 3}
  },
  "avis_verimo": "..."
}
```

---

## Onglets RapportPage

1. **Synthèse** — résumé, points forts/vigilance (cards colorées avec compteur), avis Verimo
2. **Copropriété** — syndic, participation AG, travaux copro (filtrés — pas les diags privatifs), finances
3. **Votre logement** — DPE avec gauge visuelle A→G, diagnostics privatifs par type, lot
4. **Procédures** — label + type + gravité + détail
5. **Documents** — docs analysés avec emoji par type (sans doublon "fichiers uploadés")

### Règles d'affichage importantes
- Travaux évoqués dans Copropriété : filtrés pour exclure ceux issus des diags privatifs (DPE, isolation, fenêtres...)
- DiagRow : couleur par type (bleu=DPE, rouge=amiante, violet=plomb, orange=élec/gaz)
- Présence "absence" = badge vert "Non détecté"
- DPE : tableau visuel A→B→C→D→E→F→G avec classe mise en évidence
- Bloc "Fichiers uploadés" supprimé (doublon avec Documents analysés)

---

## UX Progression (NouvelleAnalyse)

Layout 2 colonnes sur PC :
- **Colonne gauche** : header sombre avec % et barre shimmer, 4 étapes visuelles
- **Colonne droite** : état par document

4 étapes (nouvelle architecture) :
1. Envoi des documents (0→45%) — upload Files API
2. Analyse en cours (45→85%) — Claude analyse
3. Synthèse croisée (85→95%)
4. Génération du rapport (95→100%)

Animation barre :
- Suit le vrai progress rapidement
- Continue lentement entre les checkpoints (0.08%/150ms en phase analyse)
- Cap à 98% avant confirmation serveur
- Jamais de redirection avant `completed` (stagnation = 15 min)

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

## Décisions produit

- **Score** : /20 (pas /10)
- **Analyse simple** : 1 doc, pas de score, titre = nature du document
- **Analyse complète** : docs illimités pour un bien, score /20, titre = adresse du bien
- **Aperçu gratuit** : résumé + points de vigilance + score flouté + CTA débloquer
- **RGPD** : documents supprimés après traitement (Supabase Storage immédiatement, Files API Anthropic < 1 min)
- **Comparaison biens** : se débloque avec 2+ analyses complètes

---

## Points connus non résolus / à surveiller

| Problème | Statut |
|---|---|
| Message UX quand frontend redirige avant rapport | Résolu — stagnation 15 min, progress_message toutes les 60s |
| Stripe mode TEST | À passer en production |
| Mobile responsive progression | 2 colonnes non adaptées mobile |
| Compare.tsx | Présent, non testé |
| Régénération rapport (7 jours) | Colonne présente, logique non testée |
| Table `reglementation` non utilisée | Présente en base, non injectée |
| PDF téléchargeable | `window.print()` — non optimisé |

---

## Bugs résolus — session 11 avril 2026

### Architecture majeure — Files API + 2 Edge Functions
- **Ancien système Map-Reduce supprimé** : perte de cohérence, Claude ne voyait pas tous les docs ensemble
- **Files API Anthropic** implémentée : upload séparé → file_id → requête légère → plus d'erreur 413
- **Single-call pur** : Claude voit tous les documents simultanément = qualité maximale
- **Timeout Supabase résolu** : 2 Edge Functions séparées (analyser <30s + analyser-run sans limite)
- **Race condition résolue** : analyser envoie les fileIds directement dans le payload HTTP à analyser-run
- **401 résolu** : ajout header `apikey` + Verify JWT OFF sur analyser-run
- **JSON tronqué résolu** : max_tokens passé de 8192 à 64 000 (limite max Sonnet 4.6)
- **Modèle mis à jour** : `claude-sonnet-4-5` → `claude-sonnet-4-6` (600 pages PDF, 1M tokens contexte)
- **Stagnation frontend** : délai étendu à 15 minutes, progress_message mis à jour toutes les 60s

### UX / Rapport
- Bloc "Fichiers uploadés" supprimé (doublon)
- DiagRow redesigné : couleurs par type, badge présence, gauge DPE A→G
- Travaux évoqués copro filtrés : exclut ceux issus des diags privatifs
- Synthèse améliorée : points en cards colorées avec compteur
- Barre de progression : animation fluide 4 étapes, cap à 98% avant confirmation
- Messages d'erreur clairs (413, rate limit, timeout) au lieu de redirections silencieuses
