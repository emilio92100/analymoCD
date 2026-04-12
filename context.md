# VERIMO — Contexte projet complet — 12 avril 2026

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
   - Reçoit les `fileIds` directement dans le payload
   - Single-call Claude avec tous les `file_ids` — 64 000 tokens output max
   - Suppression immédiate de tous les fichiers Anthropic (RGPD)
   - Sauvegarde le rapport dans Supabase → `status = completed`
4. Frontend poll Supabase toutes les 3s → détecte `completed` → redirection rapport

### Paramètres techniques
- **Files API beta header** : `files-api-2025-04-14`
- **Max output tokens** : 64 000 (limite max Sonnet 4.6)
- **Modèle** : `claude-sonnet-4-6`
- `analyser-run` doit avoir **"Verify JWT" = OFF** dans ses Settings Supabase

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

### Processing bloqué — causes connues
- Redéploiement d'`analyser-run` pendant une analyse en cours → shutdown coupe le `waitUntil`
- Analyses simultanées sans redéploiement : OK, chaque invocation est indépendante
- Solution : supprimer l'analyse bloquée et relancer

---

## Edge Functions

### `analyser` (v5 — rapide)
- Download Storage → Upload Files API → stocke file_ids → appelle analyser-run → répond

### `analyser-run` (v8+ — longue durée)
- Contient `buildDocumentPrompt(p)` — prompt pour mode=document (analyse simple)
- Contient `buildSystemPrompt(mode, profil)` — prompt pour mode=complete et aperçus
- Reçoit `{ analyseId, fileIds, mode, profil }` dans le payload
- Lance `runAnalyseWithData()` via `EdgeRuntime.waitUntil()`
- Update progress_message toutes les 60s
- Single-call Claude avec file_ids
- Suppression RGPD immédiate après analyse
- Verify JWT = **OFF** (obligatoire)

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
| `supabase/functions/analyser-run/index.ts` | Edge Function — Single-call Claude, buildDocumentPrompt, RGPD, 64K tokens |
| `src/lib/analyse-client.ts` | Upload Storage, déclenchement analyser, polling 15 min, détection stagnation |
| `src/lib/analyses.ts` | CRUD Supabase — createAnalyse, createApercu, fetchAnalyses, deductCredit, refundCredit |
| `src/pages/RapportPage.tsx` | Affichage rapport standalone — onglets analyse complète + DocumentRenderer pour analyse simple |
| `src/pages/dashboard/NouvelleAnalyse.tsx` | UX progression 2 colonnes, 4 étapes visuelles, logique crédits/aperçu + DocumentRenderer |
| `src/pages/dashboard/DocumentRenderer.tsx` | **NOUVEAU** — Renderers par type de document pour analyse simple |
| `src/pages/dashboard/DiagnosticCard.tsx` | **NOUVEAU** — Renderer intelligent par type de diagnostic DDT |
| `src/pages/dashboard/MesAnalyses.tsx` | Liste analyses |
| `src/pages/dashboard/HomeView.tsx` | Tableau de bord |
| `src/pages/dashboard/Compte.tsx` | 3 encarts : crédits complets, crédits simples, analyses réalisées |

---

## Analyse Simple Document — mode=document (NEW session 12 avril)

### Principe
L'analyse simple (1 document, 4,90€) utilise un prompt spécifique `buildDocumentPrompt` qui détecte le type de document et retourne un JSON structuré adapté. Rendu via `DocumentRenderer.tsx` + `DiagnosticCard.tsx`.

### Types de documents détectés et leurs renderers

| Type JSON | Renderer | Sections affichées |
|---|---|---|
| `DDT` | `RendererDDT` | Header, Résumé, Jauges DPE+GES, Surface (accordéon), Diagnostics triés (verts→rouges→info), Travaux DPE, SYNTHÈSE, Points+/vigilances côte à côte, Avis Verimo |
| `PV_AG` | `RendererPVAG` | Header, Résumé, KPIs (budget/fonds/quorum), Travaux votés, Travaux évoqués, Questions diverses, Procédures, SYNTHÈSE, Avis |
| `APPEL_CHARGES` | `RendererAppelCharges` | Header, Résumé, KPIs (trimestre/annuel/mensuel), Décomposition tableau, Infos lot, SYNTHÈSE, Avis |
| `RCP` | `RendererRCP` | Header, Résumé, KPIs, Parties communes (pills), Règles usage, Restrictions, SYNTHÈSE, Avis |
| `DTG_PPT` | `RendererDTGPPT` | Header, Résumé, KPIs, Planning travaux tableau, État éléments, SYNTHÈSE, Avis |
| `CARNET_ENTRETIEN` | `RendererCarnetEntretien` | Header, Résumé, Contrats maintenance, Historique travaux, Diagnostics mentionnés, SYNTHÈSE, Avis |
| `PRE_ETAT_DATE` | `RendererPreEtatDate` | Header, Résumé, KPIs, Travaux charge vendeur, Procédures vendeur, SYNTHÈSE, Avis |
| `ETAT_DATE` | `RendererEtatDate` | Header, Résumé, KPIs, Décompte définitif, Travaux consignés, SYNTHÈSE, Avis |
| `TAXE_FONCIERE` | `RendererTaxeFonciere` | Header, Résumé, KPIs, Décomposition collectivités, Infos cadastrales, SYNTHÈSE, Avis |
| `COMPROMIS` | `RendererCompromis` | Header, Résumé, 4 KPIs, Désignation bien, Conditions suspensives+dates, Financement, Dates clés, Clauses, Servitudes, SYNTHÈSE, Avis |
| `DIAGNOSTIC_PARTIES_COMMUNES` | `RendererDiagCommunes` | Header, Résumé, KPIs, Zones détectées tableau, Zones saines pills, SYNTHÈSE, Avis |
| `AUTRE` | `RendererAutre` | Header, Résumé, Infos clés, Contenu structuré, SYNTHÈSE, Avis |

### Composants communs DocumentRenderer
- `Header` — fond `#0f2d3d`, titre + sous-titre diagnostiqueur/syndic
- `Card` — bordure 1px, borderRadius 14, shadow légère, marginBottom 20
- `CardHeader` — fond grisé, dot coloré, texte uppercase gras
- `Resume`, `KpiGrid`, `Kpi`, `InfoRow`, `TableHeader`
- `DpeJauge` — jauge A→G avec barre active surlignée
- `CarrezAccordeon` — surface totale visible, détail pièces en accordéon fermé, label dynamique (carrez|boutin|autre)
- `PointsFortsVigilances` — 2 colonnes côte à côte (vert/rouge)
- `SeparateurSynthese` — ligne horizontale avec titre "SYNTHÈSE" — présent dans TOUS les renderers
- `AvisVerimo` — fond sombre + lien "Analyse Complète"
- `SafeRenderer` — try/catch global, fallback sur RendererAutre si crash

### DiagnosticCard — renderers par type
- `DiagAmiante` — badge Non détecté/Présence + résumé 1 ligne + accordéon DetailTexte
- `DiagTermites` — badge + zone + accordéon
- `DiagElectricite` — badge conforme/anomalie + alerte + accordéon
- `DiagGaz` — badge + localisation + accordéon
- `DiagPlomb` — badge + non applicable si >= 1949 + accordéon
- `DiagERP` — badge Informatif + pills (sismique/radon/argile/inondation/PPR/BASIAS) + accordéon
- `DiagCarrez` — badge + résultat + accordéon
- `DiagDPE` — badge Informatif + résumé + accordéon
- `DiagGenerique` — fallback
- `DetailTexte` — formate le texte brut en liste de phrases avec bullets
- `Accordion` — bouton bleu "Voir le détail complet", bordure gauche bleue

**Tri diagnostics DDT :** Conformes/Non détectés → Anomalies → Informatifs

### Design system DocumentRenderer (couleurs hardcodées — pas CSS vars)
- Bg: `#ffffff`, BgSec: `#f8fafc`, Border: `#e2e8f0`, Text: `#0f172a`, TextSec: `#64748b`
- Vert: `#f0fdf4/#bbf7d0/#166534`, Rouge: `#fef2f2/#fecaca/#991b1b`
- Orange: `#fff7ed/#fed7aa/#92400e`, Bleu: `#eff6ff/#bfdbfe/#1e40af`
- Header dark: `#0f2d3d`
- DPE: A=#16a34a B=#22c55e C=#84cc16 D=#eab308 E=#f97316 F=#ef4444 G=#991b1b

### Règles prompt mode=document importantes
- `carrez.surface_type` : "carrez|boutin|autre" → label dynamique dans renderer
- DPE D/E ne doit JAMAIS être dans points_vigilance — seulement F et G
- `diagnostics.detail` = texte complet pour accordéon
- `diagnostics.alerte` = 1 phrase courte uniquement pour points critiques
- `avis_verimo` se termine par : "Cette analyse porte sur un seul document. Pour une vision complète de votre futur bien, lancez une Analyse Complète."

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
    "type_chauffage": null,
    "budgets_historique": [{"annee": "2023", "budget_total": 180000, "fonds_travaux": 9000, "charges_lot": 3200}]
  },
  "procedures": [{"label": "", "type": "copro_vs_syndic|impayes|contentieux|autre", "gravite": "faible|moderee|elevee", "message": ""}],
  "diagnostics_resume": "texte libre",
  "diagnostics": [
    {
      "type": "DPE|ELECTRICITE|GAZ|AMIANTE|PLOMB|TERMITES|ERP|CARREZ|AUTRE",
      "label": "",
      "perimetre": "lot_privatif | parties_communes",
      "localisation": "",
      "resultat": "",
      "presence": "detectee | absence | non_realise",
      "alerte": null,
      "pieces_detail": null
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

### Règles prompt mode=complete importantes
- Score /20, négociation applicable=true UNIQUEMENT si score < 14
- DPE F ou G uniquement dans vigilances et négociation (pas D ou E)
- Plomb parties communes : NE PAS inclure si annee_construction >= 1949
- Amiante parties communes : NE PAS inclure si annee_construction >= 1997
- `charges_annuelles_lot` à extraire depuis appels de fonds provisionnels aussi
- `budgets_historique` depuis chaque PV AG disponible
- `lot_achete.parties_privatives` : lister TOUS les éléments privatifs avec numéros et tantièmes
- DPE "resultat" doit contenir classe énergie ET classe GES : "Classe E - 281 kWh/m2/an. GES: Classe D - 61 kg CO2/m2/an."

---

## Onglets RapportPage (analyse complète)

1. **Synthèse** — résumé, points forts/vigilance, avis Verimo
2. **Copropriété** — syndic, participation AG, travaux copro, finances
3. **Votre logement** — DPE avec gauge visuelle A→G, diagnostics privatifs par type, lot
4. **Procédures** — label + type + gravité + détail
5. **Documents** — docs analysés avec emoji par type

---

## UX Progression (NouvelleAnalyse)

Layout 2 colonnes sur PC — 4 étapes :
1. Envoi des documents (0→45%) — upload Files API
2. Analyse en cours (45→85%) — Claude analyse
3. Synthèse croisée (85→95%)
4. Génération du rapport (95→100%)

---

## Base de données Supabase

### Table `analyses`
```
id UUID
user_id UUID → profiles
type TEXT (document | complete | pack2 | pack3 | apercu_complete | apercu_document)
status TEXT (pending | processing | files_ready | completed | failed)
mode TEXT
file_ids JSONB (stocke [{id, name}] temporairement, vidé après analyse)
title TEXT
score NUMERIC
avis_verimo TEXT
profil TEXT (rp | invest)
type_bien TEXT
result JSONB
apercu JSONB
is_preview BOOLEAN
paid BOOLEAN
progress_current INTEGER
progress_total INTEGER
progress_message TEXT
document_names TEXT[]
regeneration_deadline TIMESTAMPTZ
stripe_payment_id TEXT
created_at TIMESTAMPTZ
```

### Table `profiles`
```
id UUID → auth.users
full_name TEXT
free_preview_used BOOLEAN
created_at TIMESTAMPTZ
```

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
- **Analyse simple** : 1 doc, pas de score, rapport personnalisé par type de document
- **Analyse complète** : docs illimités pour un bien, score /20, titre = adresse du bien
- **Aperçu gratuit** : résumé + points de vigilance + score flouté + CTA débloquer
- **RGPD** : documents supprimés après traitement (Supabase Storage immédiatement, Files API Anthropic < 1 min)
- **Comparaison biens** : se débloque avec 2+ analyses complètes
- **DPE D** = bonne performance, jamais dans les points de vigilance

---

## Points connus non résolus / à faire

| Problème | Statut |
|---|---|
| Timeout frontend sur analyses bloquées en `processing` | **À FAIRE** — afficher erreur après 20 min |
| Badge "Échoué" dans MesAnalyses pour analyses bloquées | **À FAIRE** |
| Message d'erreur visible si processing > 20 min | **À FAIRE** |
| PDF rapport analyse simple | **À FAIRE** |
| Boutons Partager/PDF sur RapportPage pour analyses document | **À FAIRE** |
| Stripe mode TEST | À passer en production |
| Mobile responsive progression | 2 colonnes non adaptées mobile |
| Compare.tsx | Présent, non testé |
| Régénération rapport (7 jours) | Logique non testée |
| PDF téléchargeable | `window.print()` — non optimisé |

---

## Sessions de développement

### Session 11 avril 2026 — Architecture majeure
- Files API Anthropic implémentée
- Single-call Claude — cohérence maximale
- 2 Edge Functions séparées (analyser + analyser-run)
- Race condition résolue
- Max tokens 64 000
- Modèle claude-sonnet-4-6

### Session 12 avril 2026 — Analyse simple + DocumentRenderer
- `buildDocumentPrompt` dans analyser-run — 12 types de documents
- `DocumentRenderer.tsx` — renderer principal avec 12 sous-renderers
- `DiagnosticCard.tsx` — renderer intelligent par type de diagnostic DDT
- `carrez.surface_type` — label dynamique Carrez/Boutin/autre
- Diagnostics triés (verts → rouges → informatifs)
- `SeparateurSynthese` dans tous les renderers
- `PointsFortsVigilances` côte à côte (2 colonnes)
- `DetailTexte` — formatage accordéon en liste de phrases
- `CarrezAccordeon` — détail pièces en accordéon fermé
- Lien retour rapport → `/dashboard/analyses` (corrigé)
- `SafeRenderer` — try/catch global sur tous les renderers
