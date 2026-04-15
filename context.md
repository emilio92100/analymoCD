# VERIMO — Contexte projet complet — 15 avril 2026

> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## Profil développeur
- Débutant en développement
- Modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- Pour créer un nouveau fichier : GitHub → dossier cible → "Add file" → "Create new file"
- Vercel redéploie automatiquement après chaque push GitHub
- Claude peut cloner le repo : `https://github.com/emilio92100/analymoCD.git`
- Claude doit **toujours re-cloner** avant de modifier : `git clone https://github.com/emilio92100/analymoCD.git`
- Claude livre les fichiers via `present_files` depuis `/mnt/user-data/outputs/`
- L'utilisateur push manuellement sur GitHub
- **Ne jamais coder sans accord préalable** — toujours échanger et valider avant de toucher au code

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
- JSON `DIAGNOSTIC_PARTIES_COMMUNES` inclut `syndic` et `adresse_bien` ✅ (15 avril)

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
| `src/pages/dashboard/DocumentRenderer.tsx` | Renderers par type de document pour analyse simple |
| `src/pages/dashboard/DiagnosticCard.tsx` | Renderer intelligent par type de diagnostic DDT |
| `src/pages/dashboard/MesAnalyses.tsx` | Liste analyses |
| `src/pages/dashboard/HomeView.tsx` | Tableau de bord |
| `src/pages/dashboard/Compte.tsx` | 3 encarts : crédits complets, crédits simples, analyses réalisées |

---

## Analyse Simple Document — mode=document

### Types de documents détectés et leurs renderers

| Type JSON | Renderer | Sections affichées |
|---|---|---|
| `DDT` | `RendererDDT` | Header, Résumé, Jauges DPE+GES, Surface (accordéon), Diagnostics triés (verts→rouges→info), Travaux DPE, SYNTHÈSE, Points+/vigilances, Avis Verimo |
| `PV_AG` | `RendererPVAG` | Header, Résumé, SectionKpi (L'assemblée / Participation / Chiffres clés), Travaux votés, Travaux évoqués, Questions diverses, Procédures, SYNTHÈSE, Avis |
| `APPEL_CHARGES` | `RendererAppelCharges` | Header, Résumé, SectionKpi charges, KPIs (trimestre/annuel/mensuel), Décomposition tableau, Infos lot, SYNTHÈSE, Avis |
| `RCP` | `RendererRCP` | Header, Résumé, KPIs, Parties communes (pills), Règles usage, Restrictions, SYNTHÈSE, Avis |
| `DTG_PPT` | `RendererDTGPPT` | Header, Résumé, KPIs, Planning travaux tableau, État éléments, SYNTHÈSE, Avis |
| `CARNET_ENTRETIEN` | `RendererCarnetEntretien` | Header, Résumé, SectionKpi (Syndic / Infos copro / Énergie & Eau), Contrats maintenance, Historique travaux, SYNTHÈSE, Avis |
| `PRE_ETAT_DATE` | `RendererPreEtatDate` | Header, Résumé, SectionKpi (Syndic / Situation vendeur / Copropriété), Travaux charge vendeur, Procédures vendeur, SYNTHÈSE, Avis |
| `ETAT_DATE` | `RendererEtatDate` | Header, Résumé, SectionKpi (Syndic / Situation vendeur / Copropriété), Décompte définitif, Travaux consignés, SYNTHÈSE, Avis |
| `TAXE_FONCIERE` | `RendererTaxeFonciere` | Header, Résumé, KPIs, Décomposition collectivités, Infos cadastrales, SYNTHÈSE, Avis |
| `COMPROMIS` | `RendererCompromis` | Header, Résumé, 4 KPIs, Désignation bien, Conditions suspensives+dates, Financement, Dates clés, Clauses, Servitudes, SYNTHÈSE, Avis |
| `DIAGNOSTIC_PARTIES_COMMUNES` | `RendererDiagCommunes` | Header dark + adresse_bien, Résumé, Bloc vert impactant (non détecté) ou KPIs 4 chiffres, SectionKpi Diagnostiqueur(s), Zones non accessibles, Accordéon zones (AC1/EP visibles, non_detecte masqués), Zones saines, SYNTHÈSE, Avis |
| `MODIFICATIF_RCP` | `RendererModificatifRCP` | Header, Résumé, SectionKpi (Notaire / Acte / Publication foncière), Sur quoi porte, Parties impliquées, Impact copro, Points attention, SYNTHÈSE, Avis |
| `AUTRE` | `RendererAutre` | Header, Résumé, Infos clés, Contenu structuré, SYNTHÈSE, Avis |

### Composants communs DocumentRenderer (état au 15 avril 2026)

#### Composants UI (design system)
- **`Kpi`** — header bleu `#2a7d9c` + label blanc, valeur + sub en dessous
- **`KpiGrid`** — intelligent : 1 KPI → centré max 400px, 2 → 2 col, 3+ → 3 col
- **`SectionKpi`** — header bleu `#2a7d9c` + emoji + label blanc, corps blanc. Appliqué sur 18 blocs dans DDT, PV AG, Carnet entretien, Pré-état daté, État daté, Modificatif RCP, Appel de charges
- `Resume` — bloc résumé standard
- `InfoRow`, `TableHeader`
- `DpeJauge` — jauge A→G avec barre active surlignée
- `CarrezAccordeon` — surface totale visible, détail pièces en accordéon fermé
- `PointsFortsVigilances` — 2 colonnes côte à côte (vert/rouge)
- `SeparateurSynthese` — ligne horizontale avec titre "SYNTHÈSE" — présent dans TOUS les renderers
- `AvisVerimo` — fond sombre + lien "Analyse Complète"
- `SafeRenderer` — try/catch global, fallback sur RendererAutre si crash
- `TooltipIcon` — bulle `?` au survol
- `formatDate` — formatage dates FR

#### RendererDiagCommunes — détail (refonte 15 avril)
- **Bloc vert impactant** si `resultat_global === 'non_detecte'` : cercle vert checkmark SVG 56px + titre 18px bold + sous-texte
- **KPIs 4 colonnes** si amiante détecté : matériaux amiantés / AC1 / EP / zones saines
- Résumé positionné juste après le header
- SectionKpi header bleu 🔬 sur le bloc Diagnostiqueur
- `syndic` affiché dans le bloc diagnostiqueur, `adresse_bien` dans le header
- Zones non accessibles : alertes orange (réglementaire) ou bleues (informatif)
- Accordéon : AC1/EP toujours visibles, `non_detecte` masqués → bouton vert toggle
- Badge `⚠ AC1` dans les en-têtes d'accordéon
- `nbDetectes` filtré : `action !== 'non_detecte'`

### Design system (couleurs hardcodées — pas CSS vars)
```
Bg: #ffffff | BgSec: #f8fafc | Border: #e2e8f0 | Text: #0f172a | TextSec: #64748b
Vert:   bg=#f0fdf4 / border=#bbf7d0 / text=#166534 / dot=#16a34a
Rouge:  bg=#fef2f2 / border=#fecaca / text=#991b1b / dot=#dc2626
Orange: bg=#fff7ed / border=#fed7aa / text=#92400e / dot=#d97706
Bleu:   bg=#eff6ff / border=#bfdbfe / text=#1e40af / dot=#2563eb
Gris:   bg=#f8fafc / border=#e2e8f0 / text=#64748b / dot=#94a3b8
Header dark: #0f2d3d (conservé — décision finale)
Bleu Verimo (SectionKpi / accents): #2a7d9c
DPE: A=#16a34a B=#22c55e C=#84cc16 D=#eab308 E=#f97316 F=#ef4444 G=#991b1b
```

### DiagnosticCard — renderers par type
- `DiagAmiante`, `DiagTermites`, `DiagElectricite`, `DiagGaz`, `DiagPlomb`, `DiagERP`, `DiagCarrez`, `DiagDPE`, `DiagGenerique`
- `DetailTexte` — formate texte brut en liste de phrases avec bullets
- `Accordion` — bouton bleu "Voir le détail complet", bordure gauche bleue
- **Tri DDT :** Conformes/Non détectés → Anomalies → Informatifs

### Règles prompt mode=document importantes
- `carrez.surface_type` : "carrez|boutin|autre" → label dynamique dans renderer
- DPE D/E jamais dans points_vigilance — seulement F et G
- `diagnostics.detail` = texte complet pour accordéon
- `diagnostics.alerte` = 1 phrase courte pour points critiques
- `avis_verimo` se termine par : "Cette analyse porte sur un seul document. Pour une vision complète de votre futur bien, lancez une Analyse Complète."
- `DIAGNOSTIC_PARTIES_COMMUNES` inclut `syndic` et `adresse_bien` dans le JSON

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
- Score /20 — **note haute = bien** (4/4 procédures = aucune procédure = parfait)
- Score part de 20, points déduits selon les risques détectés
- Négociation `applicable=true` UNIQUEMENT si score < 14
- `negociation.elements` : objets avec champs `motif`, `argument`, `levier`
- DPE F ou G uniquement dans vigilances et négociation (pas D ou E)
- Plomb parties communes : NE PAS inclure si annee_construction >= 1949
- Amiante parties communes : NE PAS inclure si annee_construction >= 1997
- `charges_annuelles_lot` à extraire depuis appels de fonds provisionnels aussi
- `budgets_historique` depuis chaque PV AG disponible
- `lot_achete.parties_privatives` : lister TOUS les éléments privatifs avec numéros et tantièmes
- DPE "resultat" : classe énergie ET classe GES ex: "Classe E - 281 kWh/m2/an. GES: Classe D - 61 kg CO2/m2/an."

---

## RapportPage.tsx — Onglets analyse complète (état au 15 avril 2026)

```
TabId = 'synthese' | 'copropriete' | 'logement' | 'procedures' | 'documents'
```

### Onglet Synthèse — ✅ Terminé (15 avril)
- **Header** (`#0f2d3d`) : titre, badges lisibles (`rgba(255,255,255,0.85)`), bouton "Détail de la note" supprimé
- **Bloc Résumé + Note fusionnés** : résumé → séparateur → barres B1 par catégorie → footer score coloré
- **KPIs** : toujours sur 1 ligne (max 4 col), emoji 24px, label 12px, valeur 18px. Taxe foncière depuis plusieurs champs
- **"Synthèse de l'analyse"** variante 5 : 17px, centré, lignes dégradées bleues `#2a7d9c`
- **Catégories renommées** : "État des travaux", "Risques juridiques", "Santé financière"
- **Tooltip `?`** animé sur catégories à note 0
- **Pistes de négociation** corrigées (champs `motif`/`argument`/`levier`)
- **SafeTabBoundary** sur chaque onglet

### Onglet Analyse complète (KPIs) — ✅ Terminé (15 avril)
- Cartes KPI avec header bleu `#2a7d9c`

### Onglet Copropriété — ❌ À faire (ligne ~821)
- Actuellement cassé (erreur React au clic)
- Contenu prévu : syndic, participation AG, travaux copro, finances

### Onglet Votre logement — ❌ À faire (ligne ~1126)
- Actuellement cassé (erreur React au clic)
- Contenu prévu : DPE jauge A→G, diagnostics privatifs par type, lot acheté

### Onglet Procédures — 🔲 À confirmer (ligne ~1299)
- Fonctionnel mais texte trop petit sur PC

### Onglet Documents — 🔲 Partiel (ligne ~1353)
- **Docs essentiels** : 3 derniers PV d'AG, RCP + modificatifs, Carnet d'entretien, DDT privatifs (selon année construction), Appels de charges/fonds récents
- **Docs secondaires** : Diagnostics parties communes, DTG/PPT, Pré-état daté, État daté, Taxe foncière, Compromis
- Bannière "7 jours" + bouton "Compléter" → `/dashboard/rapport?id=XXX&action=complement`

---

## Feature "Compléter mon dossier" — À coder (session dédiée)

**Principe** : uploader des documents supplémentaires après une analyse complète pour enrichir le rapport. Utilisable une seule fois.

### Flow prévu
1. Bouton dans onglet Documents → même URL que bannière : `/dashboard/rapport?id=XXX&action=complement`
2. Redirection vers NouvelleAnalyse avec l'ID du rapport existant
3. Fusion des résultats avec le rapport existant
4. Header rapport "Analyse mise à jour le [date]"
5. Bouton grisé après usage

### Modifications nécessaires
- Colonne `complement_used BOOLEAN` à ajouter en base Supabase
- `analyser-run/index.ts` + `analyser/index.ts` : logique fusion
- `NouvelleAnalyse.tsx` : accepter un ID rapport existant
- `RapportPage.tsx` : header "mis à jour le" + bouton grisé

---

## UX Progression (NouvelleAnalyse)

Layout 2 colonnes sur PC — 4 étapes :
1. Envoi des documents (0→45%)
2. Analyse en cours (45→85%)
3. Synthèse croisée (85→95%)
4. Génération du rapport (95→100%)

---

## Base de données Supabase

### Table `analyses`
```
id UUID | user_id UUID → profiles | type TEXT | status TEXT | mode TEXT
file_ids JSONB | title TEXT | score NUMERIC | avis_verimo TEXT
profil TEXT (rp | invest) | type_bien TEXT | result JSONB | apercu JSONB
is_preview BOOLEAN | paid BOOLEAN | progress_current INTEGER | progress_total INTEGER
progress_message TEXT | document_names TEXT[] | regeneration_deadline TIMESTAMPTZ
stripe_payment_id TEXT | created_at TIMESTAMPTZ
```
**À ajouter** : `complement_used BOOLEAN`

### Table `profiles`
```
id UUID → auth.users | full_name TEXT | free_preview_used BOOLEAN | created_at TIMESTAMPTZ
```

---

## Flux paiement

### Achat depuis page Tarifs
Stripe → `success_url=/dashboard/tarifs?success=true` → webhook → crédits

### Déblocage aperçu gratuit
Stripe → `success_url=/dashboard/rapport?id=APERCU_ID&action=reupload` → webhook → crédits → re-upload → `/rapport?id=NEW_ID`

---

## Décisions produit

- **Score /20** — note haute = bien, note basse = risque. 4/4 procédures = parfait (aucun risque)
- Score part de 20, points déduits selon dangers détectés (expliqué dans onglet "Notre méthode")
- **Analyse simple** : 1 doc, pas de score, rapport personnalisé par type
- **Analyse complète** : docs illimités, score /20, titre = adresse du bien
- **Aperçu gratuit** : résumé + vigilances + score flouté + CTA débloquer
- **RGPD** : documents supprimés après traitement (<1 min)
- **Header fond foncé `#0f2d3d`** — décision finale conservée
- **Bleu Verimo** = `#2a7d9c` (SectionKpi, accents, titres)
- **DPE D** = bonne performance, jamais dans vigilances

---

## Points en attente / À faire

| Priorité | Sujet | Statut |
|---|---|---|
| 🔴 | TabCopropriete — onglet cassé | **Prochaine session** |
| 🔴 | TabLogement — onglet cassé | **Prochaine session** |
| 🟡 | TabProcedures — texte trop petit PC | À confirmer |
| 🟡 | TabDocuments — finaliser visuellement | Partiel |
| 🟡 | Feature "Compléter mon dossier" | Session dédiée |
| 🟡 | Renderers non refondus (RCP, DTG, TaxeFonciere, Compromis, Autre) | Aligner avec charte UI |
| 🟠 | Stripe TEST → production | Price IDs à changer |
| 🟠 | PDF téléchargeable optimisé | `window.print()` non optimisé |
| 🟠 | Mobile responsive | 2 colonnes non adaptées |
| 🟠 | Timeout analyses bloquées > 20 min | Badge "Échoué" |
| 🔵 | Compare.tsx | Présent, non testé |
| 🔵 | Régénération rapport 7 jours | Non testée |

---

## Sessions de développement

### Session 11 avril 2026 — Architecture majeure
- Files API Anthropic, Single-call Claude, 2 Edge Functions, race condition résolue, max 64K tokens, claude-sonnet-4-6

### Session 12 avril 2026 — Analyse simple + DocumentRenderer
- `buildDocumentPrompt` (12 types), `DocumentRenderer.tsx` (12 renderers), `DiagnosticCard.tsx`
- Tri diagnostics, `SeparateurSynthese`, `PointsFortsVigilances`, `SafeRenderer`, `CarrezAccordeon`

### Session 15 avril 2026 — RapportPage Synthèse + Design system + DiagCommunes

#### RapportPage.tsx — Synthèse
- `SafeTabBoundary` sur chaque onglet
- Header : badges lisibles, bouton "Détail de la note" supprimé
- Résumé + Note fusionnés (barres B1, footer coloré)
- KPIs 1 ligne, texte agrandi, taxe foncière multi-champs
- "Synthèse de l'analyse" variante 5 + lignes dégradées bleues
- Catégories renommées ("État des travaux", "Risques juridiques", "Santé financière")
- Tooltip `?` animé sur catégories à note 0
- Bug négociation corrigé (`motif`/`argument`/`levier`)
- Interprétation score clarifiée (note haute = bien, part de 20)

#### RapportPage.tsx — KPIs Analyse complète
- Header bleu `#2a7d9c` sur les cartes KPI

#### DocumentRenderer.tsx — Nouveau design system
- `Kpi` : header bleu + label blanc + valeur en dessous
- `KpiGrid` intelligent (1/2/3+ colonnes)
- `SectionKpi` : header bleu + emoji + label blanc — appliqué sur 18 blocs
- `import React, { useState }` ajouté

#### DocumentRenderer.tsx — RendererDiagCommunes (refonte)
- Bloc vert impactant (checkmark SVG 56px) si non détecté
- KPIs 4 colonnes si amiante détecté
- Résumé après header, SectionKpi 🔬 diagnostiqueur
- `syndic` dans diagnostiqueur, `adresse_bien` dans header
- Zones non accessibles orange/bleues
- Accordéon AC1/EP visibles, non_detecte masqués, bouton vert toggle
- Badge `⚠ AC1`, `nbDetectes` corrigé

#### analyser-run/index.ts
- `syndic` et `adresse_bien` ajoutés au JSON `DIAGNOSTIC_PARTIES_COMMUNES`
