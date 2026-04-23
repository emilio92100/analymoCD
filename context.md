# VERIMO — Contexte projet complet — 23 avril 2026 (après sessions 8 à 12)

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
- **Réponses courtes et concises avec Alex** — il préfère aller à l'essentiel, pas de pavés explicatifs sauf si question technique précise. Utiliser des analogies simples pour les concepts techniques (ex : JSON = colis ouvert/fermé).
- **Ne jamais mentionner Tonton Immo ou Emilio Immo sur Verimo** — focus produit strict
- **Mot "IA" / "AI" banni** des pages publiques Verimo — utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte"

---

## Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière, modificatifs RCP, fiche synthétique...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour **appartements et maisons**.

**Slogan :** *Vos documents décryptés, votre décision éclairée.*

**Cible :** Acheteurs particuliers (primo-accédants et résidence principale), et professionnels (agents immobiliers, investisseurs, marchands de bien, notaires).

### Logique crédits / prix
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de score /20
- 19,90€ → 1 crédit analyse complète (jusqu'à 15 documents)
- 29,90€ → 2 crédits (Pack 2 biens)
- 39,90€ → 3 crédits (Pack 3 biens)
- Les crédits n'expirent jamais
- **Offre Pro** : tarifs sur mesure via formulaire `/contact-pro` (pas de prix affichés)

### Stripe Price IDs (mode TEST — à passer en live)
```
document : price_1TIb1LBO4ekMbwz0020eqcR0
complete : price_1TIb3XBO4ekMbwz0a7m7E7gD
pack2    : price_1TIb4KBO4ekMbwz0gGF2gI1S
pack3    : price_1TIb51BO4ekMbwz0mmEez47o
```

---

## Stack technique
- **Frontend** : React + Vite + TypeScript + Tailwind
- **Backend** : Supabase Pro (auth + DB + Edge Functions Deno + Storage)
- **IA** : Claude Sonnet 4.6 via API Anthropic + Files API
- **Paiement** : Stripe (mode TEST)
- **Déploiement** : Vercel (frontend auto depuis GitHub) + Supabase (edge functions manuelles)
- **Repo** : `github.com/emilio92100/analymoCD`
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`
- **Domaine** : verimo.fr (OVH registrar)

---

## Routes
```
/                             → HomePage
/pro                          → ProPage (landing page offre professionnelle — 4 profils)
/contact-pro                  → ContactProPage (formulaire qualifié pros — 5 profils)
/tarifs                       → TarifsPage
/contact                      → ContactPage
/exemple                      → ExemplePage (toggle Simple/Complète, rapport interactif)
/methode                      → MethodePage
/confidentialite              → ConfidentialitePage
/cgu                          → CGUPage
/mentions-legales             → MentionsLegalesPage
/connexion                    → LoginPage
/inscription                  → SignupPage
/start                        → StartPage
/admin                        → AdminPage
/dashboard                    → HomeView (tableau de bord)
/dashboard/nouvelle-analyse   → NouvelleAnalyse
/dashboard/analyses           → MesAnalyses
/dashboard/compare            → Compare (sélection de biens + historique uniquement)
/dashboard/compte             → Compte
/dashboard/tarifs             → Tarifs (côté app)
/dashboard/rapport?id=XXX     → Aperçus gratuits
/rapport?id=XXX               → RapportPage standalone (rapports payants)
/rapport-comparaison?ids=X,Y  → 🆕 RapportComparaisonPage (rapport plein écran 2-3 biens)
```

---

## 🆕 Sessions 8 à 12 — 22/23 avril 2026 — Refonte complète page Comparaison

### 🎯 Résumé global
Gros chantier sur la comparaison de biens : refonte UX, passage en page dédiée plein écran, ajout d'un verdict premium enrichi, harmonisation des écrans de chargement dans tout le dashboard, fix de plusieurs bugs critiques.

---

### Architecture nouvelle — Page de rapport dédiée

**Avant** : la page `/dashboard/compare` affichait la sélection des biens **ET** le rapport comparatif dans la même vue (sous le bouton "Lancer").

**Après** : 
- **Compare.tsx** = sélection de biens + historique uniquement. Plus de rendu du rapport à l'intérieur.
- **RapportComparaisonPage.tsx** (NOUVEAU, ~1250 lignes) = page plein écran dédiée au rapport comparatif, accessible via `/rapport-comparaison?ids=id1,id2`.
- Route ajoutée dans `App.tsx` avec lazy loading.
- Depuis Compare.tsx, l'utilisateur clique "Lancer" → écran d'attente **in-dashboard** (sidebar visible) → redirection vers la page rapport quand le verdict est prêt.
- Depuis l'historique : clic "Voir" → navigation directe vers `/rapport-comparaison?ids=...`.

---

### Ordre des sections de la page rapport comparaison (final)

1. **Header dark sticky** (Retour + titre + PDF)
2. **Cards biens en haut** (grosses cards : score circulaire + niveau + DPE + coût année 1 + bouton "Voir le rapport détaillé")
3. **Comparaison détaillée** (tableau, déplié par défaut) — SANS la ligne "Travaux votés" (retiré car à charge vendeur)
4. **Résumé financier — 1ère année** (accordéon, si données dispo)
5. **Travaux évoqués non votés** (accordéon, si présents)
6. **Verdict Verimo** (3 blocs : Hero dark + Analyse croisée + Plan "À vérifier avant de signer")
7. **Documents analysés par bien** (accordéon replié par défaut)

**Badge ⭐ RECOMMANDÉ toujours à gauche** : le bien recommandé est réorganisé en première position visuellement (via `displayOrder`), peu importe son ordre de sélection d'origine. Les labels "Bien 1" / "Bien 2" restent cohérents avec l'ordre d'origine (important pour la cohérence avec le verdict qui référence ces numéros).

---

### Verdict Verimo — Schéma V2 enrichi

Schéma backend passé de `titre_verdict + synthese + conseil` (v1) à structure complète V2 :
- `titre_verdict` (string)
- `bien_recommande_idx` (number)
- `ecarts_cles` {score, cout_annee_1, dpe} avec delta_label
- `analyse_croisee` (2-3 phrases qui RELIENT des faits entre biens — valeur ajoutée Verimo)
- `profils` [{bien_idx, profil, forces[], points_faibles[]}]
- `comparatif` (string)
- `points_a_approfondir` [{bien, action}]
- `alerte_documents` (string | null)

**Règles strictes analyse_croisee** (prompt backend) :
- 2-3 phrases max, factuelles
- AUTORISÉ : relier DPE + fonds travaux, procédure + impayés, ancienneté + travaux
- INTERDIT : projection chiffrée de risques futurs, estimation de perte de valeur, pronostic
- Ton : analyste froid, constat factuel

**Tooltip "?"** sur "Analyse croisée Verimo" avec hover expliquant à l'acheteur ce que c'est et pourquoi c'est utile.

**Vigilance documentaire** : bloc orange explicite quand un bien manque de documents clés pour la comparaison.

---

### Écrans de chargement harmonisés (5 pages)

Nouveau composant réutilisable `src/components/DashboardLoader.tsx` avec message personnalisable.

Filet de sécurité 600ms déjà présent dans `useAnalyses.ts` (garantit que le loader reste affiché au moins 600ms pour éviter un flash si Supabase répond trop vite).

Messages finaux :

| Page | Message |
|---|---|
| Tableau de bord (HomeView) | *"Chargement de votre espace…"* |
| Mes Analyses | *"Chargement de vos analyses…"* |
| Comparer | *"Chargement de vos biens analysés…"* |
| Mon Compte | *"Chargement de votre compte…"* |
| Tarifs | *"Chargement des tarifs…"* |

**Sur la page `/rapport-comparaison`** : 
- `WaitingScreen` gère désormais intelligemment cache vs génération. Il affiche l'UX sobre *"Préparation de votre rapport…"* pendant les 3 premières secondes, puis bascule sur l'UX détaillée avec étapes (📄 Lecture des rapports → ⚖️ Comparaison → ✍️ Rédaction verdict) uniquement si la génération Claude prend vraiment plus de 3s. **Évite le flash "Analyse en cours" quand on ouvre une compa depuis le cache.**

---

### Bugs critiques résolus

**🐛 Bug #1 — Verdict affiché vide depuis le cache BDD**

Symptôme : rapport normal à la première génération, mais page blanche (juste le label "VERDICT VERIMO") quand on ré-ouvrait depuis l'historique.

Cause : Supabase renvoyait le champ `verdict` comme **string JSON** et non comme objet parsé. Mon code faisait `data.verdict.titre_verdict` sur une string → undefined → rien ne s'affichait.

Fix : parsing défensif côté client dans `loadVerdict()` :
```ts
if (typeof data.verdict === 'string') {
  parsedVerdict = JSON.parse(data.verdict) as VerdictAny;
} else {
  parsedVerdict = data.verdict as VerdictAny;
}
```

Cette protection existait dans l'ancien Compare.tsx mais avait été perdue en refondant le code — leçon : toujours lire l'ancien code avant de le remplacer.

**🐛 Bug #2 — Écran "Analyse en cours" flashait 1 seconde depuis historique**

Symptôme : en ouvrant une compa depuis l'historique, flash 1s de l'UX "Analyse en cours" (étapes détaillées) avant l'affichage du rapport. Illogique puisque c'est du cache.

Cause : `WaitingScreen` s'affichait avec `fromCache={false}` par défaut car on ne savait pas encore si c'était du cache tant que l'edge function n'avait pas répondu.

Fix : ajout d'un state `showGenerationUI` qui ne bascule sur l'UX détaillée qu'après 3s d'attente (donc jamais pour un cache qui répond en <2s).

**🐛 Bug #3 — Debug obsolète dans edge function**

Le bloc `debug_upsert_error` ajouté en session 7 pour diagnostiquer le bug 42P10 (contrainte unique manquante) est retiré. Le bug étant résolu, plus besoin du debug.

---

### Bug IA non résolu — à traiter

**Symptôme** : Claude recommande parfois un bien avec score **inférieur** au lieu du meilleur score, sans facteur bloquant évident.

**Exemple réel** : Bien 1 (13.5/20, 5 travaux évoqués, 1 procédure) recommandé vs Bien 2 (14.0/20, 0 travaux, 0 procédure). Claude invoque "conflictualité interne", "fonds ALUR de seulement 443 €" — interprétations discutables qui contournent la règle "meilleur score par défaut".

**Fix proposé (Option 3 validée conceptuellement mais non implémentée)** :
- Durcir le prompt pour forcer Claude à expliciter les scores avant de décider
- Ajouter une validation automatique côté backend : si `bien_recommande_idx` ≠ meilleur score ET qu'aucun facteur bloquant réel n'est présent, forcer la correction de l'index

---

### Fichiers modifiés/créés sessions 8-12

**Frontend (à pousser sur GitHub)** :
```
src/components/DashboardLoader.tsx      → NOUVEAU, loader réutilisable
src/pages/RapportComparaisonPage.tsx    → NOUVEAU, page rapport plein écran (~1250 lignes)
src/App.tsx                             → Route /rapport-comparaison ajoutée (lazy)
src/pages/dashboard/Compare.tsx         → Sélection + historique uniquement, redirige vers RapportComparaisonPage
src/pages/dashboard/HomeView.tsx        → DashboardLoader ajouté
src/pages/dashboard/MesAnalyses.tsx     → DashboardLoader ajouté
src/pages/dashboard/Compte.tsx          → DashboardLoader ajouté
src/pages/dashboard/Tarifs.tsx          → DashboardLoader ajouté
```

**Backend (à déployer sur Dashboard Supabase)** :
```
supabase/functions/comparer/index.ts    → Schéma V2 + analyse_croisee + retrait debug_upsert_error + retrait kpis_differenciants (plus affichés côté front)
```

Tous poussés en prod à date (sauf le fix IA qui reste à faire).

---

## Modifications session 22 avril 2026 — session 7 (refonte UX Résumé + Avis Verimo + fix bugs comparaison)

### A. Refonte UX Résumé et Avis Verimo
- **analyser-run** — Schéma `resume` devenu objet 5 sections à icônes (le_bien, la_copropriete, performance_energetique, diagnostics_privatifs, gouvernance_finances)
- **analyser-run** — Schéma `avis_verimo` devenu objet structuré `{verdict, verdict_highlight, contexte, demarches[]}`
- **analyser-run** — Règles strictes résumé factuel uniquement (adjectifs évaluatifs interdits), avis_verimo interprétatif avec ton adapté au score
- **analyser-run** — Positionnement "aide à la décision" (jamais d'impératif type "nous recommandons")
- **RapportPage** — Nouveaux composants `ResumeBlock` (5 sections icônes 🏠🏢⚡🔍📋) et `AvisVerimoBlock` (verdict + highlight + contexte + démarches numérotées + fallback legacy)
- **RapportPage** — Libellés : "Notre lecture du dossier" / "En contexte" / "Points à approfondir avant de signer"
- **RapportPrintPage** — Helpers `flattenResume` + `flattenAvisVerimo` pour le PDF
- **ExemplePage** — Mock converti au nouveau format

### B. Countdown + état "dossier complété"
- **RapportPage** — Countdown row (à droite du bouton)
- **RapportPage** — État "complété" : bouton grisé + icône verte + "Dossier complété le [date]"
- **RapportPage** — "oubliés" → "manquants"
- **RapportPage** — Tooltip "Dossier déjà complété"

### C. Fix barre de progression (55% bloqué)
- **analyse-client.ts** — `pollAnalyseStatus` refactorée : progression temporelle simulée 60→90% sur 180s max quand `progress_current` null

### D. Fix SEO Tarifs
- "dès 9€" → "dès 4,90€"
- Retrait "pack comparatif" ambigu

### E. Fix DB Comparaison de biens
- Renommage colonne `avis_final` → `verdict` sur table `comparaisons`
- Type `analyse_ids` passée de `jsonb` à `text`
- Ajout contrainte unique `(user_id, analyse_ids)` pour le `ON CONFLICT`
- **useAnalyses.ts** — Ajout champ `result?: unknown`

---

## Modifications session 22 avril 2026 — session 6 (audit Edelweiss + scoring déterministe)

### Chantier C — Refonte tooltips (RapportPage)
Un seul `TooltipBtn` global avec `createPortal(document.body)`, z-index 2147483647, recalcul auto. Plus de clipping parent.

### Chantier A — Règles prompt
- **A1** — Scoring intelligent diagnostics privatifs (intelligence réglementaire : DPE, élec, gaz, amiante, plomb, termites, ERP, Carrez selon année/type)
- **A2** — Retrait ALUR/état daté de `points_vigilance` (sauf si anormalement élevés)
- **A3** — Cascade sources finances : Pré-état daté > appel de charges > PV+tantièmes > PV seul

### Chantier B — Schéma + UI enrichis
- **B1** — Carnet d'entretien (`vie_copropriete.carnet_entretien{}`) + bloc UI
- **B2** — Années sur budget et fonds travaux
- **B3** — N-1/N-2 pré-état daté forcé
- **B4** — Modificatifs RCP (`vie_copropriete.modificatifs_rcp[]`) + bloc UI
- **B5** — Fiche synthétique (nouveau type de document) + règle priorité PV d'AG plus récent

### Fix countdown permanent
Format complet `6j 23h 14min 08s` en permanence, couleurs J-2 orange / J-1 rouge.

### Scoring déterministe (majeur)
Fonction `recalculerCategories(rapport, profil)` dans `analyser-run/index.ts`. **Les 5 notes ne sont plus fournies par le LLM** mais recalculées côté code à partir des données extraites. Garanties : reproductibilité, plancher anti-zéro, try/catch non bloquant.

---

## Sessions 2 à 5 (résumé rapide)

- **Session 5** (21/04) — Refonte ExemplePage "vraie vitrine", KPI hybride A+B, onglets colorés, accordéons CSS pur, responsive mobile, règle gestionnaire copropriété
- **Session 4** (20/04) — Étape "Type de bien" (appartement/maison/maison copro/indéterminé), propagation type_bien, fiabilisation statut syndic multi-PV
- **Session 3** (20/04) — Prompt enrichi (loi Climat, DPE petites surfaces, audit énergétique), Compléter le dossier (7 jours), MethodePage, préchargement iOS
- **Session 2** (19/04) — HomePage sections + timeline, ProPage/ContactProPage profil Marchand de bien, TarifsPage, Compare.tsx (v1 radar), edge comparer, table comparaisons
- **Session 1** (19/04) — ProPage, ContactProPage, table contact_pro, optimisations iOS, navbar badge, AdminPage

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

**⚠️ IMPORTANT (session 6)** — Notes calculées côté code dans `recalculerCategories()` — plus le LLM.

### Niveaux
| Plage | Niveau |
|-------|--------|
| 17–20 | Bien irréprochable |
| 14–16 | Bien sain |
| 10–13 | Bien correct avec réserves |
| 7–9 | Bien risqué |
| 0–6 | Bien à éviter |

### Travaux (-/+ 5pts)
- Travaux lourds évoqués non votés : **-1.5 par sujet**, plafonné à -3
- Travaux légers évoqués non votés : **-0.5 par sujet**, plafonné à -1.5
- Votes charge vendeur : **+0.5 par item**, plafonné à +2
- Plancher 1 si au moins un document travaux analysé

### Procédures (-/+ 4pts)
- Gravité élevée : **-2** / modérée : **-1** / faible : **-0.5**
- Quitus refusé : **-0.5**

### Finances (-/+ 4pts) — départ 2/4
- Fonds travaux excellent (≥10%) : **+1.5** / bien (6-9%) : **+1** / conforme (5%) : **+0.5** / insuffisant (<5%) : **-0.5** / absent : **-1**
- Impayés > 15% budget : **-0.5**
- Vendeur à jour (pré-état daté) : **+0.5**

### Diagnostics privatifs (-/+ 4pts)
- 0 diag → 0/4, sinon départ 4/4
- Diags requis manquants : **-0.75 chacun** (DPE, élec si >15 ans, amiante si <1997, plomb si <1949, gaz si détecté, Carrez si copro)
- Anomalies : DPE G -1.5/-2, F -1/-1.5, élec maj -1, gaz A1 -1/A2 -0.5, amiante dégradé -1/suspect -0.3, plomb dégradé -1, termites -2
- **Plancher 1/4** si ≥ 1 diag extrait

### Diagnostics communs (-/+ 3pts) — départ 2/3
- DTG bon +1 / moyen +0.5 / dégradé -1, budget urgent >50k€ -0.5
- Amiante PC AC1 -1, termites PC présence -1

---

## Règles métier critiques

1. **Fonds ALUR** — L'acheteur hérite les montants MAIS DOIT LES REMBOURSER AU VENDEUR à la signature. NE JAMAIS dans `points_vigilance` sauf anormalement élevés.
2. **Honoraires syndic pré-état daté** — À charge vendeur. NE JAMAIS dans `points_vigilance`.
3. **Votes deux tours** — Art. 25 insuffisant + ≥ 1/3 voix → 2ème tour art. 24. Si adopté → ADOPTÉE.
4. **DPE D** = bonne performance, jamais dans vigilances.
5. **Carrez** — ne pas afficher dans les diags si section Surface Carrez dédiée.
6. **Travaux votés avant vente** = charge vendeur. NE PAS compter comme risque acheteur. **Ne pas afficher dans la page comparaison** (session 9).
7. **Travaux évoqués non votés** = vrai risque acheteur. À afficher dans la comparaison.
8. **Loi Climat & Résilience** — DPE G interdit location depuis 2025, F en 2028, E en 2034. Gel loyers F/G depuis 2022.
9. **DPE petites surfaces** — Seuils ajustés pour < 40 m² depuis juillet 2024.
10. **Audit énergétique** — Obligatoire vente maisons/monopropriétés E/F/G. Pas les appartements en copro.
11. **Gestionnaire de copropriété** — JAMAIS confondre avec président du conseil syndical ou PDG.
12. **DDT + actualisation** — Dossier unifié, ne JAMAIS noter 0 car 2 fichiers séparés.
13. **Fiche synthétique de copro** — Priorité PV d'AG plus récent.
14. **Cascade sources finances du lot** — Pré-état daté > appel de charges > PV+tantièmes > PV seul. Pas de "taxe foncière" dans les labels finances copro.
15. **Chauffage/ECS individuels** (session 9) — Bandeau bleu info : ces consos ne sont pas dans les charges collectives.
16. **Taxe foncière dans comparaison** — Si renseignée pour les 2 biens, incluse dans `cout_annee_1`. Si seulement 1 bien → signaler asymétrie dans `alerte_documents`.
17. **Règle de recommandation bien** (comparaison) — PAR DÉFAUT : le bien avec le meilleur score /20. Exception UNIQUEMENT si facteur bloquant réel (travaux >20k€, procédure grave, DPE F/G, impayés >15%, asymétrie doc majeure). Si exception : expliciter POURQUOI dans `titre_verdict` + `comparatif`.

---

## Flux technique — Comment fonctionne une analyse

1. L'utilisateur uploade ses PDFs dans Supabase Storage (bucket `analyse-temp`)
2. Le frontend appelle la edge function `analyser` avec les paths Storage + l'ID analyse
3. `analyser` télécharge les PDFs depuis Storage, les uploade vers l'API Anthropic Files
4. `analyser` supprime les PDFs de Supabase Storage
5. `analyser` passe le status à `files_ready` et appelle `analyser-run` via `EdgeRuntime.waitUntil`
6. `analyser-run` appelle Claude Sonnet avec les `file_ids` et le prompt système
7. Claude analyse les documents et retourne un JSON structuré
8. `recalculerCategories(report, profil)` recalcule les 5 notes à partir des données extraites
9. `analyser-run` supprime les `file_ids` de l'API Anthropic Files (RGPD)
10. Le rapport JSON est stocké dans `analyses.result`
11. `analyser-run` stocke `regeneration_deadline` = now + 7 jours (analyses complètes uniquement)

### Flux comparaison (nouvelle architecture sessions 8-12)
1. L'utilisateur sélectionne 2-3 analyses complètes dans `/dashboard/compare`
2. Clic "Lancer" → écran d'attente in-dashboard (sidebar visible) + appel à edge function `comparer`
3. `comparer` vérifie le cache BDD via contrainte unique `(user_id, analyse_ids)` (ids triés)
4. Si cache hit → renvoie `{verdict, cached: true}` direct
5. Si cache miss → Claude génère le verdict V2, sauve en BDD, renvoie `{verdict, cached: false}`
6. Frontend redirige vers `/rapport-comparaison?ids=...` dès succès
7. `RapportComparaisonPage` fetche les analyses + appelle à nouveau `comparer` (qui renvoie le cache)
8. Parsing défensif : si `verdict` est string JSON, `JSON.parse()`
9. Affichage avec réorganisation visuelle : bien recommandé toujours en première position

### Flux complément
1. L'utilisateur clique "Compléter mon dossier" (dans les 7 jours)
2. Upload 1-5 PDFs
3. `analyser` mode `complement` + `analyser-run` mode `complement` → fusion JSON + recalcul déterministe
4. PDFs supprimés (RGPD), nouveau rapport remplace l'ancien

### Vérification Supabase si analyse bloquée
Dashboard Supabase → Table Editor → `analyses` → trier par `created_at` :
- `status` : completed / processing / files_ready / failed
- `progress_message` : évolue si vivant
- `updated_at` : change si en cours
- `complement_date` + `complement_doc_names` : remplis si complément appliqué

### Estimation coûts / stockage
- **Stockage Supabase DB** : ~100 ko par rapport → Pro 25$ (8 Go) = ~80 000 analyses
- **Coût API Claude** : ~0,80€ à 1,50€ par analyse complète
- **Coût API Claude** : ~0,15€ à 0,30€ par comparaison

---

## Architecture fichiers clés

```
src/pages/
  HomePage.tsx
  ProPage.tsx
  TarifsPage.tsx
  MethodePage.tsx
  ContactPage.tsx
  ContactProPage.tsx
  RapportPage.tsx                    ← ~4210 lignes (session 6+)
  RapportComparaisonPage.tsx         ← 🆕 ~1250 lignes (sessions 8-12), page plein écran compa
  ExemplePage.tsx
  DashboardPage.tsx                  ← Shell dashboard
  AdminPage.tsx
  dashboard/
    HomeView.tsx                     ← + DashboardLoader
    MesAnalyses.tsx                  ← + DashboardLoader
    NouvelleAnalyse.tsx
    DocumentRenderer.tsx
    Compare.tsx                      ← Sélection + historique uniquement
    Compte.tsx                       ← + DashboardLoader
    Tarifs.tsx                       ← + DashboardLoader

src/components/
  DashboardLoader.tsx                ← 🆕 Loader réutilisable (avec filet 600ms côté hook)
  layout/
    Navbar.tsx
    Footer.tsx

src/lib/
  supabase.ts
  analyse-client.ts                  ← Upload PDFs + polling
  analyses.ts                        ← Types AnalyseDB + CRUD Supabase

src/hooks/
  useAnalyses.ts                     ← Avec filet 600ms minimum loader
  useCredits.ts                      ← Expose loadingCredits
  useUser.ts

src/index.css                        ← Media queries responsive

supabase/functions/
  analyser/index.ts                  ← Upload PDFs → Files API → déclenche analyser-run
  analyser-run/index.ts              ← Claude → JSON → recalculerCategories → RGPD (~1120 lignes)
  comparer/index.ts                  ← 🆕 Schéma V2 + analyse_croisee, sans debug obsolète (~267 lignes)
```

---

## Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Header dark** : `#0f2d3d`
- **Accent bleu ciel (Pro)** : `#7dd3fc`
- **Investisseur violet** : `#7c3aed`
- **Marchand de bien ambre** : `#d97706`

### Palette KPI sémantique
- **neutral** : blanc + bordure `#e2edf3`
- **ok** (vert) : fond `#f0fdf4`, bordure `#bbf7d0`
- **warn** (orange) : fond `#fff7ed`, bordure `#fed7aa`
- **danger** (rouge) : fond `#fef2f2`, bordure `#fecaca`
- **info** (bleu) : fond `#eff6ff`, bordure `#bfdbfe`

### Palette urgence countdown
- **J-7 à J-3** : gris `#64748b`, normal weight
- **J-2** : orange `#ea580c`, bold
- **J-1** : rouge `#dc2626`, bold

---

## 🗂️ Backlog

### 🔴 Priorité haute — Prochaine session : fix bug IA comparaison

- [ ] **Bug IA recommandation incorrecte** — Claude recommande parfois un bien avec score inférieur sans facteur bloquant réel. Fix en 2 temps (Option 3 validée) :
  1. Durcir le prompt backend : forcer Claude à expliciter les scores avant la décision, reformuler la règle "meilleur score par défaut" plus fermement
  2. Ajouter validation automatique côté edge function `comparer` : si `bien_recommande_idx` ≠ meilleur score ET aucun facteur bloquant détectable dans les données, forcer la correction de l'index vers le meilleur score.

### 🟡 Priorité normale — Page comparaison (évolutions possibles après validation offre Pro)

- [ ] **Nouveau champ à l'upload** : prix de vente + surface Carrez (saisis manuellement par l'acheteur à l'upload). Permettrait d'afficher prix/m² et de muscler la comparaison. **Bloqué** tant qu'on ne modifie pas le formulaire d'upload.
- [ ] **Pour l'offre Pro** :
  - Export PDF blanc label (logo/signature agent)
  - Annotations perso par bien
  - Marge de négociation suggérée (basée sur travaux évoqués + fonds insuffisants + procédures)
  - Comparatif marché local (nécessite data externe type DVF)
  - Export Excel du tableau comparatif
  - Partage sécurisé par lien avec expiration

### 🟡 Priorité normale — Restant des sessions précédentes

- [ ] **RapportPage — rendu adaptatif maison** :
  - Onglet "Logement" → **"Votre futur chez-vous"** quand `type_bien = maison`
  - Onglet "Procédures" → **"Litiges"** quand `type_bien = maison`
  - Fallback onglet Litiges maison avec exemples (servitudes, bornage, urbanisme, malfaçons)
- [ ] **Fix règle pistes de négociation** — `applicable=true` sans gate au score (actuellement gated à <14)
- [ ] **ExemplePage — mock maison** — Villeurbanne, 4P 95m², score 12,5/20, DPE E
- [ ] **Améliorer UX modale "Compléter le dossier"** — ne pas mettre "Oublié" en haut, granularité des étapes à améliorer visuellement
- [ ] Tester le scoring déterministe en prod sur dossier Edelweiss (diags privatifs, etc.)
- [ ] Tester carnet d'entretien, modificatifs RCP, fiche synthétique en conditions réelles
- [ ] Tester countdown permanent et couleurs urgence

### 🟡 Priorité normale — Tests

- [ ] Tester sélecteur type_bien en production
- [ ] Tester syndic multi-PV (stable / nouveau_elu / rotation_frequente)
- [ ] Tester détection rigoureuse du gestionnaire
- [ ] Tester rendu mobile
- [ ] Tester onglets colorés
- [ ] Tester RapportPage sur iPhone
- [ ] Tester retour accueil iPhone après préchargement App.tsx
- [ ] HomeView : retravailler présentation générale
- [ ] Stripe TEST → production
- [ ] Analyses bloquées > 20 min → badge "Échoué"
- [ ] Système dossiers par bien
- [ ] App.css : vestige Vite, peut être supprimé
- [ ] Optimisation coût API Claude : prompt caching (réduire 90% input tokens répétés)

### ✅ Fait récemment (sessions 8-12 — 22/23 avril 2026)

- [x] Refonte architecture : Compare.tsx = sélection + historique, RapportComparaisonPage.tsx = page rapport plein écran
- [x] Route `/rapport-comparaison?ids=X,Y` ajoutée dans App.tsx (lazy)
- [x] Nouveau schéma verdict V2 backend + `analyse_croisee`
- [x] Retrait `debug_upsert_error` obsolète du backend
- [x] Retrait `kpis_differenciants` (doublon avec tableau comparatif)
- [x] Retrait ligne "Travaux votés" du tableau (charge vendeur, pas pertinent pour acheteur)
- [x] Tooltip "?" sur Analyse croisée Verimo
- [x] Verdict placé en fin de page juste avant Documents analysés
- [x] Écran d'attente in-dashboard avec noms des biens + bouton Annuler
- [x] Grosses cards biens (score circulaire + niveau + DPE + coût année 1 + bouton "Voir le rapport détaillé")
- [x] Badge ⭐ RECOMMANDÉ toujours à gauche (displayOrder visuel, labels "Bien 1/2" inchangés)
- [x] Nouveau composant `DashboardLoader.tsx` + intégration sur HomeView, MesAnalyses, Compare, Compte, Tarifs
- [x] Filet de sécurité 600ms minimum sur loader (useAnalyses.ts)
- [x] Fix bug verdict vide depuis cache (string JSON non parsée côté client)
- [x] Fix bug flash "Analyse en cours" 1s depuis historique (bascule UI seulement après 3s)
- [x] Messages loader différenciés par page

---

## SEO / Google (contexte hors projet code)

- Domaine `verimo.fr` (OVH)
- Search Console : propriété validée, sitemap soumis, 5 pages clés en indexation prioritaire
- OAuth Google : nouveau logo wordmark validé
- Suivre sur Search Console → Sitemaps → statut "Succès"
- Pour sitelinks : chercher souvent "verimo" depuis différents appareils + partager sur LinkedIn
