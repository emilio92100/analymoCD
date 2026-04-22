# VERIMO — Contexte projet complet — 22 avril 2026 (session 7)

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
- **Ne jamais mentionner Tonton Immo ou Emilio Immo sur Verimo** — focus produit strict
- **Mot "AI" banni** des pages publiques Verimo — utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte"

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
/                           → HomePage
/pro                        → ProPage (landing page offre professionnelle — 4 profils)
/contact-pro                → ContactProPage (formulaire qualifié pros — 5 profils)
/tarifs                     → TarifsPage
/contact                    → ContactPage
/exemple                    → ExemplePage (toggle Simple/Complète, rapport interactif)
/methode                    → MethodePage
/confidentialite            → ConfidentialitePage
/cgu                        → CGUPage
/mentions-legales           → MentionsLegalesPage
/connexion                  → LoginPage
/inscription                → SignupPage
/start                      → StartPage
/admin                      → AdminPage
/dashboard                  → HomeView (tableau de bord)
/dashboard/nouvelle-analyse → NouvelleAnalyse
/dashboard/analyses         → MesAnalyses
/dashboard/compare          → Compare (comparaison de biens — FAIT)
/dashboard/rapport?id=XXX   → Aperçus gratuits
/rapport?id=XXX             → RapportPage standalone (rapports payants)
```

---

## 🆕 Modifications session 22 avril 2026 — session 6 (audit complet rapport Edelweiss + scoring déterministe)

### 🎯 Résumé de la session
Session majeure sur la fiabilité du rapport et la qualité d'analyse. Partie d'un audit utilisateur sur un dossier réel (résidence Edelweiss Châtillon, 13 docs) qui a révélé 9 bugs/manques. Tout a été traité via 3 chantiers + 2 fixes :

- **Chantier C** — Fix 3 systèmes de tooltips concurrents (RapportPage)
- **Chantier A** — Règles prompt : scoring intelligent, retrait ALUR/état daté des vigilances, cascade sources finances
- **Chantier B** — Enrichissement schéma + UI : carnet d'entretien, années budget, N-1/N-2 pré-état daté, modificatifs RCP, fiche synthétique
- **Fix countdown** — Compte à rebours permanent à côté du bouton "Compléter mon dossier"
- **Scoring déterministe** — Recalcul algorithmique des 5 catégories côté edge function (ne dépend plus du LLM)

---

### Chantier C — Refonte des tooltips (DÉPLOYÉ ✅)

**Problème** : 3 systèmes de tooltips concurrents dans `RapportPage.tsx` :
1. Tooltip manuel dans `AccordionSection` (dupliqué avec `TooltipBtn`)
2. Tooltip manuel dans les catégories scoring (`position: absolute` → clipping)
3. `TooltipBubble` dans l'upload de compléments (`position: absolute`)

**Solution** : **Un seul `TooltipBtn` global** avec :
- `createPortal(document.body)` → échappe tout clipping parent (overflow:hidden)
- `z-index: 2147483647` (max int32)
- Recalcul auto au scroll/resize
- Repositionnement intelligent (au-dessus si pas assez de place en bas)
- Jamais hors écran (décalage auto au bord droit)

**Impact** : tooltips des blocs bleus (Composition copropriété, Appels de fonds exceptionnels, Identité du lot, Règles d'usage RCP, Performance énergétique, Classement énergétique) désormais bien positionnés à côté du `?`.

---

### Chantier A — Règles produit dans le prompt (DÉPLOYÉ ✅)

Fichiers modifiés : `supabase/functions/analyser-run/index.ts` + `src/pages/RapportPage.tsx`.

#### A1 — Scoring intelligent des diagnostics privatifs
Ajout d'un gros bloc "REGLES DE CALCUL DES NOTES PAR CATEGORIE" (5 catégories). **Intelligence réglementaire complète** :
- DPE : toujours requis
- Électricité : requis si installation > 15 ans
- Gaz : requis si > 15 ans ET présence de gaz
- Amiante privatif : permis avant 01/07/1997
- Plomb (CREP) : construction avant 01/01/1949
- Termites : communes avec arrêté préfectoral
- ERP : zones PPR/sismicité
- Carrez : lot en copro uniquement ≥ 8 m²

**Règle clé** : un DDT + son actualisation (ERP/termites/etc.) = **dossier unifié**. Ne jamais noter 0 parce que 2 fichiers se complémentent.

**Garde-fou UI** : si malgré tout `diags_privatifs.note === 0` mais qu'il y a des diagnostics privatifs extraits → afficher **"Non évalué"** en italique gris (au lieu de "0 pt sur 4" trompeur), couleur neutre, tooltip explicatif.

#### A2 — Retrait ALUR/état daté de `points_vigilance`
Les frais normaux de signature ne sont plus des risques :
- Fonds travaux ALUR à rembourser au vendeur
- Honoraires syndic pour pré-état daté (150-300€)
- Fonds de roulement à reconstituer

**Exception** : si anormalement élevé (honoraires syndic > 500€, fonds roulement > 3 mois), alors OK dans vigilances avec motif précis.

#### A3 — Cascade sources finances du lot
Priorités :
1. Pré-état daté / État daté (meilleure source)
2. Appel de charges du lot
3. PV d'AG + tantièmes (calcul auto)
4. PV d'AG seul → message "Uploadez un appel de charges ou un pré-état daté..."

UI : retrait des mentions "taxe foncière" trompeuses. Sous-titre "Charges · impayés · historique" (ex "Charges · taxe foncière · impayés").

---

### Chantier B — Schéma + UI enrichis (DÉPLOYÉ ✅)

#### B1 — Carnet d'entretien visible dans l'onglet Copropriété
Nouveau schéma `vie_copropriete.carnet_entretien{}` avec date_maj, immatriculation_registre, équipements copro, contrats d'entretien, travaux réalisés, travaux votés en AG mentionnés dans le carnet, diagnostics parties communes, conseil syndical.

UI : nouveau bloc AccordionSection "📓 Carnet d'entretien" (tags équipements, liste contrats avec prestataire + date reconduction, travaux votés en jaune/warning, travaux réalisés en vert, diagnostics avec codes couleur).

#### B2 — Années sur budget et fonds travaux
Nouveaux champs : `budget_total_copro_annee`, `fonds_travaux_annee`, `charges_annuelles_lot_source`.

UI : "Budget annuel copropriété — 2024" sur KPI et bloc finance. Fonds travaux avec année entre parenthèses.

#### B3 — N-1/N-2 pré-état daté
Template `historique_charges` forcé avec 2 entrées. Règle "Ne JAMAIS omettre ce tableau".

UI : fallback jaune doux si le tableau est vide malgré un pré-état daté présent.

#### B4 — Modificatifs RCP
Nouveau schéma `vie_copropriete.modificatifs_rcp[]` avec date_acte, notaire, type_modification, sur_quoi_porte, impact_acheteur, points_attention.

UI : nouveau bloc AccordionSection "📜 Modificatifs du règlement" avec carte par modificatif (titre du type, date, notaire, "CE QUI CHANGE", encart bleu "Impact pour vous", points d'attention en jaune).

#### B5 — Fiche synthétique de copropriété
Nouveau type de document `FICHE_SYNTHETIQUE` dans la liste détectée, schéma d'extraction complet.

**Règle clé** : priorité aux PV d'AG plus récents. La fiche synthétique n'est utile que pour les données stables (immatriculation registre, équipements, présence DTG). Données financières et syndic ignorées si PV récent disponible.

UI : nouveau bloc AccordionSection "📋 Fiche synthétique" avec alerte visuelle si > 12 mois.

---

### Fix — Compte à rebours permanent "Compléter mon dossier" (DÉPLOYÉ ✅)

**Avant** : "Encore 7 jours pour compléter ce dossier" (texte statique). Compte à rebours hh/mm/ss uniquement le dernier jour (J-1).

**Après** : compte à rebours **permanent** à droite du bouton, format `6j 23h 14min 08s` (secondes qui défilent en live), couleurs selon urgence :
- J-7 à J-3 : gris neutre
- J-2 : orange (`#ea580c`)
- J-1 : rouge (`#dc2626`)
- Expiré : bouton grisé (déjà en place)

Texte remplacé : "Ajoutez des documents oubliés — le rapport sera recalculé gratuitement."

Layout : suppression de `justify-content: space-between` pour que le bouton soit collé naturellement après le texte (plus de gros vide au milieu).

---

### Fix majeur — Scoring déterministe côté edge function (DÉPLOYÉ ✅)

**Problème persistant** : le LLM continuait à mettre `diags_privatifs.note = 0` même avec toutes les règles ajoutées au prompt. Notes imprévisibles d'une analyse à l'autre.

**Solution** : fonction `recalculerCategories(rapport, profil)` dans `supabase/functions/analyser-run/index.ts`. Le LLM extrait toujours les données (diagnostics, travaux, procédures, finances) mais **ce n'est plus lui qui calcule les notes**. Un algorithme déterministe recalcule les 5 catégories juste avant la sauvegarde en base.

**Garanties** :
- Mêmes données = toujours la même note (reproductible)
- Plancher anti-zéro sur `diags_privatifs` : si ≥ 1 diag privatif extrait, la note ne peut pas descendre sous 1/4
- Règle `try/catch` : si l'algo bug, le rapport du LLM passe quand même (non bloquant)
- Logs explicites dans la console Edge Functions : `[analyser-run] Categories recalculees: {...}`

**Logique de calcul `diags_privatifs`** :
1. Si 0 diag extrait → 0/4 (légitime)
2. Sinon : départ 4/4, on détermine les diagnostics requis selon année de construction, on pénalise pour chaque requis manquant (-0.75), puis pour chaque anomalie (DPE F/G, élec majeure, gaz A1/A2, amiante dégradé, plomb dégradé, termites présence), plancher à 1/4.

**Appliqué aussi** : travaux (évoqués lourds/légers, votes charge vendeur), procédures (gravité élevée/modérée/faible + quitus refusé), finances (statut fonds travaux + impayés + vendeur à jour), diags communs (DTG état général + alertes).

---

### Fichiers modifiés session 6

**Frontend (à pousser sur GitHub)** :
```
1. src/pages/RapportPage.tsx  → refonte TooltipBtn + règles A3 UI (texte taxe foncière, cascade) + garde-fou scoring "Non évalué" + blocs UI carnet/modificatifs/fiche synthétique + années budget + fallback N-1/N-2 + countdown permanent avec couleurs urgence
```

**Backend (à déployer sur Dashboard Supabase)** :
```
2. supabase/functions/analyser-run/index.ts  → règles A1/A2/A3 + B1 à B5 dans prompt + schéma enrichi (carnet_entretien, modificatifs_rcp, fiche_synthetique, années) + fonction recalculerCategories déterministe
```

Les 2 fichiers ont été poussés et buildés avec succès sur Vercel. Scoring déterministe pas encore testé en conditions réelles (dernière modification livrée).

---

## Modifications session 21 avril 2026 — session 5 (refonte visuelle + responsive)

### 🎯 Résumé de la session
Refonte visuelle et responsivité mobile :
- Refonte ExemplePage (Option B "vraie vitrine" — réutilisation composants RapportPage)
- Animations accordéons fluides (CSS pur, grid-template-rows 0fr→1fr)
- Refonte KPI Synthèse en style hybride A+B (blancs sobres + teintés sémantiquement sur alertes)
- Fix mobile responsive sur toute l'app (Toggle, KPI, SyndicBand, padding rapport)
- Refonte section HomePage "Ce que vous recevez" pour cohérence avec /exemple
- Onglets rapport : style coloré actif
- Enrichissement prompt IA : détection rigoureuse du gestionnaire de copropriété

### ExemplePage.tsx — Refonte complète (Option B "vraie vitrine")
Architecture réutilisation composants RapportPage. Exports : `RapportData`, `TabId`, `RapportViewExemple`, `buildRapportExemple`.

Fonctionnalités : mode simple par défaut, toggle animé, DemoPopup premium 2 CTAs, mock Lyon 6e (score 14.8/20, fonds travaux 12 000€ corrigé).

### RapportPage.tsx — Refonte KPI Synthèse (style hybride A+B)
Système `KpiSeverity = 'neutral' | 'info' | 'ok' | 'warn' | 'danger'` + helper `getKpiCardStyle(severity)`. Cartes blanches sobres par défaut, teinte sémantique uniquement sur alertes (DPE A/B/C vert, D/E orange, F/G rouge, etc.).

### RapportPage.tsx — Onglets rapport en style coloré actif
Onglet actif = fond plein de sa couleur + texte blanc bold. Onglet inactif = hover `#f1f5f9`. Classes `rapport-tab-btn` / `rapport-tab-btn-active`.

### Animations accordéons CSS pur
Pattern `grid-template-rows: 0fr → 1fr` + opacity + translateY, cubic-bezier(0.4, 0, 0.2, 1), 0.35s. Appliqué à AccordionSection, CarrezAccordeon, DiagnosticCardRow, RendererDiagCommunes.

### Responsive mobile — 4 corrections critiques
Media queries dans `src/index.css` :
1. Toggle Simple/Complète → cards empilées propres
2. KPI bascule desktop-hidden → mobile-flex
3. SyndicBand en grille 2×2
4. Padding latéral rapport → 6px sur mobile

### analyser-run/index.ts — Règles strictes gestionnaire
Priorité : gestionnaire principal → gestionnaire associé → null. Interdictions : JAMAIS président conseil syndical, JAMAIS secrétaire de séance, JAMAIS PDG sauf explicite. `gestionnaire_fonction` uniquement si écrit dans le document.

---

## Modifications session 20 avril 2026 — session 4 partie 1

### Sélecteur "Type de bien" dans NouvelleAnalyse
Entre `choice` et `profil`, nouvelle étape : appartement, maison, maison copro, indéterminé.

Nouveau parcours : choice → type_bien → profil → upload → analyse → result.

### Infrastructure type_bien
Colonne SQL `type_bien_declare`, type `TypeBien`, propagation dans toute la chaîne frontend → edge functions. Prompt IA respecte cette valeur avec fallback si contradictoire.

### Fiabilisation statut syndic (simple ET complète)
Champs enrichis : `statut`, `sortant`, `entrant`, `annee_changement`, `nb_ags_analysees`, `historique_changements`.

Valeurs : stable / reconduit / nouveau_elu / rotation_frequente / recherche / carence. Anti-alarmisme : changement unique = normal.

---

## Modifications session 20 avril 2026 — session 3

### Enrichissement prompt IA (règles juridiques)
- Loi Climat & Résilience (DPE G 2025, F 2028, E 2034, gel loyers F/G)
- DPE petites surfaces (arrêté 25 mars 2024)
- Audit énergétique obligatoire maisons/monopropriétés E/F/G

### Compléter le dossier (7 jours) — implémenté
Mode `complement` dans analyser + analyser-run, colonnes `complement_date` et `complement_doc_names`, stockage `regeneration_deadline`. Popup ComplementModal drag & drop 5 docs max.

---

## Modifications session 19 avril 2026 — session 2

HomePage (section "Pour Qui" + timeline "Comment ça marche"), ProPage/ContactProPage (profil Marchand de bien), TarifsPage, Compare.tsx (radar + financier + verdict IA + historique), edge `comparer`, table `comparaisons`.

---

## Pages existantes (session 1 — 19 avril 2026)

ProPage, ContactProPage, table `contact_pro`, optimisations iOS testées, navbar badge "Offre Pro", AdminPage onglet "Demandes Pro".

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

**⚠️ IMPORTANT (session 6)** — Les notes des 5 catégories sont maintenant **calculées côté code** dans `recalculerCategories()` au lieu d'être fournies par le LLM. Reproductibilité garantie.

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
- Gravité élevée : **-2**
- Gravité modérée : **-1**
- Gravité faible : **-0.5**
- Quitus refusé : **-0.5**

### Finances (-/+ 4pts) — départ 2/4 (neutre)
- Fonds travaux excellent (≥10%) : **+1.5**
- Fonds travaux bien (6-9%) : **+1**
- Fonds travaux conforme (5%) : **+0.5**
- Fonds travaux insuffisant (<5%) : **-0.5**
- Fonds travaux absent : **-1**
- Impayés > 15% budget : **-0.5**
- Vendeur à jour (pré-état daté) : **+0.5**

### Diagnostics privatifs (-/+ 4pts) — intelligence réglementaire
- Si 0 diag extrait → **0/4**
- Sinon : départ 4/4
- **Diagnostics requis manquants** (selon année construction) : -0.75 chacun
  - DPE toujours requis
  - Électricité si construction > 15 ans
  - Amiante si avant 1997
  - Plomb si avant 1949
  - Gaz si détecté
  - Carrez si copro
- **Anomalies** :
  - DPE G : -1.5 (RP) / -2 (invest)
  - DPE F : -1 (RP) / -1.5 (invest)
  - Électricité anomalies majeures : -1
  - Gaz A1 : -1 / A2 : -0.5
  - Amiante dégradé : -1 / suspect : -0.3
  - Plomb dégradé : -1
  - Termites présence : -2
- **Plancher à 1/4** si ≥ 1 diag extrait (anti-faux-zéro)

### Diagnostics communs (-/+ 3pts) — départ 2/3 (neutre)
- DTG bon : +1 / moyen : +0.5 / dégradé : -1
- DTG budget urgent > 50k€ : -0.5
- Amiante PC AC1 : -1
- Termites PC présence : -1

---

## Règles métier critiques

1. **Fonds ALUR** — L'acheteur hérite ces montants MAIS DOIT LES REMBOURSER AU VENDEUR à la signature en sus du prix. NE JAMAIS les mettre dans `points_vigilance` (sauf si anormalement élevés).
2. **Honoraires syndic pré-état daté** — Toujours à la charge du vendeur. NE JAMAIS mettre dans `points_vigilance`.
3. **Votes deux tours** — Art. 25 insuffisant + ≥ 1/3 voix → 2ème tour art. 24. Si adopté → ADOPTÉE.
4. **DPE D** = bonne performance, jamais dans vigilances.
5. **Carrez** — ne pas afficher dans les diags si section Surface Carrez dédiée.
6. **Travaux votés avant la vente** = charge vendeur, même si pas encore réalisés. NE PAS compter comme risque pour l'acheteur.
7. **Travaux évoqués non votés** = vrai risque pour l'acheteur.
8. **Loi Climat & Résilience** — DPE G interdit location depuis 2025, F en 2028, E en 2034. Gel loyers F/G depuis 2022.
9. **DPE petites surfaces** — Seuils ajustés pour < 40 m² depuis juillet 2024.
10. **Audit énergétique** — Obligatoire pour vente maisons/monopropriétés E/F/G. Pas les appartements en copro.
11. **Gestionnaire de copropriété** — JAMAIS confondre avec président du conseil syndical ou PDG.
12. **DDT + actualisation** (session 6) — Forment un dossier unifié, ne JAMAIS noter 0 car 2 fichiers séparés.
13. **Fiche synthétique de copro** (session 6) — Priorité PV d'AG plus récent. Utile surtout pour immatriculation registre et équipements, pas pour données financières si PV récent disponible.
14. **Cascade sources finances du lot** (session 6) — Pré-état daté > appel de charges > PV+tantièmes > PV seul. NE PAS mentionner "taxe foncière" dans les labels finances copro.

---

## Flux technique — Comment fonctionne une analyse

1. L'utilisateur uploade ses PDFs dans Supabase Storage (bucket `analyse-temp`)
2. Le frontend appelle la edge function `analyser` avec les paths Storage + l'ID analyse
3. `analyser` télécharge les PDFs depuis Storage, les uploade vers l'API Anthropic Files
4. `analyser` supprime les PDFs de Supabase Storage
5. `analyser` passe le status à `files_ready` et appelle `analyser-run` via `EdgeRuntime.waitUntil`
6. `analyser-run` appelle Claude Sonnet avec les `file_ids` et le prompt système
7. Claude analyse les documents et retourne un JSON structuré
8. **(Session 6)** `recalculerCategories(report, profil)` recalcule les 5 notes à partir des données extraites
9. `analyser-run` supprime les `file_ids` de l'API Anthropic Files (RGPD)
10. Le rapport JSON est stocké dans `analyses.result` dans Supabase
11. `analyser-run` stocke `regeneration_deadline` = now + 7 jours (analyses complètes uniquement)

### Flux complément
1. L'utilisateur clique "Compléter mon dossier" (dans les 7 jours)
2. Upload 1-5 PDFs
3. `analyser` mode `complement` : vérifie deadline, lit rapport existant
4. `analyser-run` mode `complement` : fusion JSON + nouveaux docs
5. Recalcul déterministe des catégories
6. PDFs supprimés (RGPD)
7. Nouveau rapport remplace l'ancien

### Vérification Supabase si analyse bloquée
Dashboard Supabase → Table Editor → `analyses` → trier par `created_at` → ouvrir la ligne :
- `status` : completed / processing / files_ready / failed
- `progress_message` : évolue si vivant
- `updated_at` : change si en cours
- `complement_date` + `complement_doc_names` : remplis si complément appliqué
- `result` (JSON) : contient `categories`, `diagnostics[]`, etc.

### Estimation coûts / stockage
- **Stockage Supabase DB** : ~100 ko par rapport → Pro 25$ (8 Go) = ~80 000 analyses
- **Coût API Claude** : ~0,80€ à 1,50€ par analyse complète

---

## Architecture fichiers clés

```
src/pages/
  HomePage.tsx              ← Page d'accueil
  ProPage.tsx               ← Landing page offre pro
  TarifsPage.tsx            ← Tarifs + FAQ
  MethodePage.tsx           ← Notre méthode
  ContactPage.tsx           ← Formulaire contact général
  ContactProPage.tsx        ← Formulaire contact pro
  RapportPage.tsx           ← Rapport standalone (~4210 lignes en session 6)
                              + TooltipBtn (createPortal)
                              + blocs UI carnet d'entretien / modificatifs RCP / fiche synthétique
                              + garde-fou scoring "Non évalué"
                              + countdown permanent avec couleurs urgence
                              + années sur budget / fonds travaux
                              + fallback N-1/N-2 pré-état daté
  ExemplePage.tsx           ← Exemple interactif Simple/Complète
  DashboardPage.tsx         ← Shell dashboard
  AdminPage.tsx             ← Admin
  dashboard/
    MesAnalyses.tsx         ← Listing analyses
    HomeView.tsx            ← Tableau de bord
    NouvelleAnalyse.tsx     ← Upload + barre progression
    DocumentRenderer.tsx    ← Rendu analyse simple
    Compare.tsx             ← Comparaison de biens

src/components/layout/
  Navbar.tsx
  Footer.tsx

src/lib/
  supabase.ts
  analyse-client.ts         ← Upload PDFs + polling (⚠️ fallback hardcodé 55% quand progress_current null, ligne 214)
  analyses.ts               ← Types AnalyseDB + CRUD Supabase

src/index.css               ← Media queries responsive mobile

supabase/functions/
  analyser/index.ts         ← Upload PDFs → Files API → déclenche analyser-run
  analyser-run/index.ts     ← Appel Claude → rapport JSON → recalculerCategories → suppression RGPD (~1120 lignes en session 6)
  comparer/index.ts         ← Comparaison IA : lit rapports JSON → Claude → verdict
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

### Palette urgence countdown (session 6)
- **J-7 à J-3** : gris `#64748b`, normal weight
- **J-2** : orange `#ea580c`, bold
- **J-1** : rouge `#dc2626`, bold

---

## 🗂️ Backlog

### 🔴 Priorité haute — Session 8 : Continuer refonte Comparaison de biens

**Contexte** : en session 7, on a fait une grosse refonte technique + UX de la page `/dashboard/compare`. Plusieurs points restent à finir :

- [ ] **Refonte présentation du verdict comparatif** — Actuellement le texte est "trop brut, moche, pavé". Options à explorer :
  - Scinder la synthèse en 3 blocs distincts (Bien 1 / Bien 2 / Comparatif) avec encarts colorés
  - Passer Forces et Points d'attention en 2 colonnes côte à côte (comme RapportPage)
  - Tagger chaque force et chaque point d'attention avec un badge "Bien 1" ou "Bien 2"
  - Mix des 3 approches = meilleur résultat probable
- [ ] **Bug UX doublon detection** — malgré le fix session 7 (détection "déjà comparé" au niveau de la sélection des biens), il reste encore un problème d'affichage à valider avec tests approfondis. Tester les scénarios : 2 biens, 3 biens, réouverture depuis historique, nouvelle sélection après Retour.
- [ ] **Retirer la version DEBUG de l'edge function `comparer`** — on avait ajouté `debug_upsert_error` dans la réponse pour diagnostiquer le bug de sauvegarde. Le bug est résolu (contrainte unique ajoutée). Remplacer la version actuellement déployée par une version propre sans `debug_upsert_error`. Fichier propre à régénérer côté Claude, à redéployer manuellement dans Dashboard Supabase → Edge Functions → `comparer`.
- [ ] **Reformuler "Notre conseil"** en "Points à approfondir" (cohérent avec l'Avis Verimo du rapport individuel) — plus du conseil impératif, mais de l'aide à la décision.
- [ ] **Edge function `comparer` prompt** — le verdict Claude fait encore trop de longues synthèses unifiées alors qu'il devrait scinder par bien. Possible amélioration du system prompt pour forcer des blocs distincts.

### 🔴 Priorité haute — À tester après session 6

- [ ] **Tester le scoring déterministe en prod** — relancer analyse Edelweiss + complément. Vérifier que `diags_privatifs.note` est maintenant non-nulle (devrait être ~2-2.5/4 vu les anomalies élec/gaz).
- [ ] **Tester carnet d'entretien** — vérifier que le nouveau bloc UI "📓 Carnet d'entretien" apparaît avec contrats SEDEP/SICRE/SOMAP/SIL, travaux votés peinture grilles 13000€ du 13/05/2019, diagnostics amiante DTA 13/03/2006, etc.
- [ ] **Tester modificatifs RCP** — uploader les modificatifs Edelweiss (1969, 1980, 2004) et vérifier le bloc "📜 Modificatifs du règlement".
- [ ] **Tester fiche synthétique** — uploader une fiche synthétique et vérifier le bloc dédié avec alerte si > 12 mois.
- [ ] **Tester countdown permanent** — vérifier que le format complet `6j 23h 14min 08s` s'affiche en permanence à droite du bouton, que les couleurs changent à J-2 (orange) et J-1 (rouge).
- [ ] **Tester années budget/fonds travaux** — vérifier que les années apparaissent dans les KPI et le bloc Finances.

### 🟡 Priorité normale — UX progression "Compléter mon dossier"

- [x] ~~**Fix progression bloquée à 55%**~~ → Résolu en session 7 : `analyse-client.ts` ligne `pollAnalyseStatus` refactorée avec progression temporelle simulée 60→90% sur 180s max quand `progress_current` est null (phase analyse Claude).
- [ ] **Améliorer UX modale "Compléter le dossier"** — ne pas mettre "Oublié" en haut (mot négatif). Granularité des étapes à améliorer (actuellement `step: 'extracting'|'analysing'|'reducing'|'done'|'error'`, mais pas reflété visuellement).

### 🔴 Priorité haute — Restant session 6 non traité

- [ ] **RapportPage.tsx — rendu adaptatif maison** :
  - Onglet "Logement" → **"Votre futur chez-vous"** quand `type_bien = maison`
  - Onglet "Procédures" → **"Litiges"** quand `type_bien = maison`
  - Fallback onglet Litiges maison avec exemples (servitudes, bornage, urbanisme, malfaçons)
- [ ] **Fix règle pistes de négociation** — `applicable=true UNIQUEMENT si score < 14` → `applicable` sans gate au score
- [ ] **ExemplePage — mock maison** — Villeurbanne, 4P 95m², score 12,5/20, DPE E

### 🟡 Priorité normale

- [ ] Tester le sélecteur type_bien en production
- [ ] Tester syndic multi-PV (stable / nouveau_elu / rotation_frequente)
- [ ] Tester détection rigoureuse du gestionnaire
- [ ] Tester rendu mobile (responsive session 5)
- [ ] Tester onglets colorés /exemple vs rapport payant
- [ ] Tester RapportPage sur iPhone (performances)
- [ ] Tester retour accueil iPhone après préchargement App.tsx
- [ ] HomeView : retravailler présentation générale
- [ ] Stripe TEST → production
- [ ] Analyses bloquées > 20 min → badge "Échoué"
- [ ] Système dossiers par bien
- [ ] App.css : vestige Vite, peut être supprimé
- [ ] Optimisation coût API Claude : prompt caching (réduire 90% input tokens répétés)

### ✅ Fait (session 7 — 22 avril 2026)

**A. Refonte UX Résumé et Avis Verimo**
- [x] **analyser-run** — Schéma `resume` devenu objet 5 sections à icônes (le_bien, la_copropriete, performance_energetique, diagnostics_privatifs, gouvernance_finances). String OU null pour chaque.
- [x] **analyser-run** — Schéma `avis_verimo` devenu objet structuré `{verdict, verdict_highlight, contexte, demarches[]}`
- [x] **analyser-run** — Règles strictes résumé factuel uniquement (adjectifs évaluatifs interdits), avis_verimo interprétatif avec ton adapté au score (tranché si ≤6), anti-doublon résumé/avis
- [x] **analyser-run** — Positionnement "aide à la décision" (jamais d'impératif type "nous recommandons")
- [x] **analyser-run** — Démarches 2-4 comme "points à approfondir" (pas des "actions à faire")
- [x] **analyser-run** — Protection DB : extrait verdict pour colonne string legacy avis_verimo
- [x] **RapportPage** — Types `ResumeStructured` + `AvisVerimoStructured`
- [x] **RapportPage** — Cast `buildRapport` permissif (string OU objet) pour rétrocompatibilité
- [x] **RapportPage** — Nouveau composant `ResumeBlock` : 5 sections icônes (🏠🏢⚡🔍📋) avec masquage si vide + fallback legacy
- [x] **RapportPage** — Nouveau composant `AvisVerimoBlock` : verdict avec surlignage auto via `verdict_highlight` + contexte + démarches numérotées 1,2,3 + disclaimer + fallback legacy
- [x] **RapportPage** — Libellés : "Notre lecture du dossier" / "En contexte" / "Points à approfondir avant de signer"
- [x] **RapportPrintPage** — Helpers `flattenResume` + `flattenAvisVerimo` pour convertir format objet → texte dans le PDF généré
- [x] **ExemplePage** — Mock MOCK_COMPLETE_PAYLOAD converti au nouveau format (resume objet, avis_verimo structuré avec verdict + highlight + contexte + 3 démarches)

**B. Countdown + état "dossier complété"**
- [x] **RapportPage** — Countdown passé de column → row (à droite du bouton, pas en dessous)
- [x] **RapportPage** — État "complété" : bouton grisé + icône verte + "Dossier complété le [date]" quand `complementDate` rempli
- [x] **RapportPage** — Remplacement "oubliés" → "manquants" (3 endroits : onglet Documents, modale ComplementModal, sous-texte countdown)
- [x] **RapportPage** — Tooltip "Dossier déjà complété" sur bouton grisé

**C. Fix barre de progression**
- [x] **analyse-client.ts** — Fonction `pollAnalyseStatus` refactorée : détection phase analyse IA via progress_message ou status=files_ready, progression temporelle simulée 60→90% étalée sur 180s max quand progress_current null, fallback 55% uniquement avant phase analyse. Fix bug original où la barre était figée à 55% pendant tout l'appel Claude.

**D. Fix SEO Tarifs**
- [x] **TarifsPage** — Title SEO : "dès 9€" → "dès 4,90€" (corrigé pour refléter le vrai prix d'appel)
- [x] **TarifsPage** — Description SEO : retrait du "pack comparatif" ambigu, reformulation plus claire

**E. Fix bugs critiques Comparaison de biens (DB + code)**

BUGS DB RÉSOLUS (via SQL Editor Supabase) :
- [x] Renommage colonne `avis_final` → `verdict` sur table `comparaisons`
- [x] Changement de type : `analyse_ids` passée de `jsonb` à `text`
- [x] Ajout contrainte unique `(user_id, analyse_ids)` requise pour le `ON CONFLICT` de l'upsert

FIX CÔTÉ CODE :
- [x] **useAnalyses.ts** — Ajout champ `result?: unknown` dans type `Analyse` + mapping depuis `a.result` (fix tableau comparatif vide : DPE, travaux, procédures, etc. étaient tous à "—")
- [x] **Compare.tsx** — Parsing défensif du verdict à la réouverture : gère `verdict` en string JSON OU en objet (fix verdict vide à réouverture depuis historique)

**F. Refonte UX page /dashboard/compare**
- [x] **Compare.tsx** — Nouveau composant `CompareWaitingScreen` : écran d'attente plein écran avec 2-3 bâtiments animés (pulsation), ligne de connexion animée, titre dynamique "Verimo compare vos N biens", liste des biens affichés (staggered), 3 étapes qui s'enchaînent (Lecture des rapports / Comparaison forces-faiblesses / Rédaction verdict), message bas "L'analyse prend généralement moins d'une minute"
- [x] **Compare.tsx** — Nouveau composant `CompareCacheLoader` : mini loader 1.8s pour réouverture depuis historique ("Patientez / Votre rapport se charge")
- [x] **Compare.tsx** — Synchronisation : le rapport (tableau + verdict) n'apparaît QUE quand Claude a terminé. Avant, tout s'affichait direct puis le verdict en bas apparaissait après — UX bizarre. Désormais l'écran d'attente puis tout s'affiche d'un coup.
- [x] **Compare.tsx** — Détection "déjà comparé" au moment de la sélection des biens : si l'utilisateur resélectionne une combinaison déjà faite, à la place du bouton "Lancer la comparaison" → encart bleu avec 📋 "Comparaison déjà effectuée le [date]" + bouton unique "Voir le rapport" (appelle viewComparaison direct, pas de nouvel appel Claude, pas de coût inutile)
- [x] **Compare.tsx** — Suppression du bandeau "déjà comparé" à l'intérieur du rapport (devenu inutile avec la détection amont)
- [x] **Compare.tsx** — Augmentation des tailles de texte verdict et tableau : titre 16→18, synthèse 13.5→15, forces/points 13→14.5, notre conseil 13→14.5, tableau valeurs 12-13→13.5-14, en-têtes tableau 11-12→12-13.5

**G. Version DEBUG temporaire edge function comparer (à retirer en session 8)**
- [x] **comparer/index.ts** — Ajout logique `debug_upsert_error` dans la réponse quand upsert échoue (a servi à diagnostiquer le bug 42P10 sur la contrainte unique). TOUJOURS DÉPLOYÉE EN PROD SUPABASE. À remplacer par une version propre sans debug_upsert_error une fois tous les tests comparaison validés.

### ✅ Fait (session 6 — 22 avril 2026)

- [x] **RapportPage** — Refonte TooltipBtn avec createPortal (z-index 2147483647, recalcul auto)
- [x] **RapportPage** — Suppression des 3 tooltips manuels concurrents
- [x] **analyser-run** — Bloc "REGLES DE CALCUL DES NOTES PAR CATEGORIE" avec intelligence réglementaire
- [x] **analyser-run** — Règle DDT + actualisation = dossier unifié
- [x] **RapportPage** — Garde-fou UI "Non évalué" quand diags_privatifs = 0 avec diagnostics présents
- [x] **analyser-run** — Règle exclusion ALUR/honoraires état daté de points_vigilance
- [x] **analyser-run** — Règle cascade sources finances du lot
- [x] **RapportPage** — Retrait mentions "taxe foncière" trompeuses
- [x] **analyser-run** — Schéma vie_copropriete.carnet_entretien{} + règles extraction
- [x] **RapportPage** — Bloc UI "📓 Carnet d'entretien" complet
- [x] **analyser-run** — Champs années : budget_total_copro_annee, fonds_travaux_annee, charges_annuelles_lot_source
- [x] **RapportPage** — Affichage années sur KPI et bloc Finances
- [x] **analyser-run** — Template historique_charges forcé N-1 ET N-2
- [x] **RapportPage** — Fallback jaune doux si historique vide
- [x] **analyser-run** — Schéma vie_copropriete.modificatifs_rcp[]
- [x] **RapportPage** — Bloc UI "📜 Modificatifs du règlement"
- [x] **analyser-run** — Type FICHE_SYNTHETIQUE + schéma extraction + règle priorité
- [x] **RapportPage** — Bloc UI "📋 Fiche synthétique"
- [x] **RapportPage** — CountdownTimer permanent (format complet 6j 23h 14min 08s)
- [x] **RapportPage** — Couleurs urgence countdown (J-2 orange, J-1 rouge)
- [x] **RapportPage** — Layout bouton compacté (plus de gros vide au milieu)
- [x] **analyser-run** — Fonction `recalculerCategories()` déterministe (5 catégories)
- [x] **analyser-run** — Injection recalcul avant sauvegarde DB (2 emplacements)

### ✅ Fait (session 5 — 21 avril 2026)

- [x] ExemplePage refonte Option B
- [x] RapportPage exports RapportViewExemple + buildRapportExemple
- [x] KPI Synthèse hybride A+B
- [x] Onglets colorés actifs
- [x] Accordéons fluides CSS pur
- [x] SyndicBand simplifié dans accordéon "Vie de la copropriété"
- [x] HomePage section "Ce que vous recevez" pixel-perfect /exemple
- [x] Responsive mobile (Toggle, KPI, SyndicBand, padding)
- [x] Navbar : lien Contact retiré
- [x] Footer : bouton "Envoyer un message"
- [x] analyser-run : règle stricte gestionnaire + gestionnaire_fonction

### ✅ Fait (session 4 partie 1 — 20 avril 2026)

- [x] Étape "Type de bien" dans NouvelleAnalyse (4 options)
- [x] Colonne `type_bien_declare` SQL
- [x] Propagation TypeBien frontend → edge functions
- [x] Fiabilisation statut syndic simple + complète multi-PV
- [x] Anti-alarmisme changement syndic

### ✅ Fait (session 3 — 20 avril 2026)

- [x] Prompt IA enrichi (loi Climat, DPE petites surfaces, audit énergétique)
- [x] Compléter le dossier — backend + frontend complet
- [x] regeneration_deadline stockée dans analyser-run
- [x] MethodePage textes corrigés
- [x] App.tsx préchargement HomePage iOS

### ✅ Fait (session 2 — 19 avril 2026)

- [x] HomePage sections Pour Qui + timeline
- [x] ProPage/ContactProPage profil Marchand de bien
- [x] TarifsPage (tableau, bandeau Pro, FAQ)
- [x] Compare.tsx complet (radar, financier, travaux, verdict IA, historique)
- [x] Edge function `comparer` + table `comparaisons`
- [x] Optimisations iOS

---

## SEO / Google (contexte hors projet code)

- Domaine `verimo.fr` (OVH)
- Search Console : propriété validée, sitemap soumis, 5 pages clés en indexation prioritaire
- OAuth Google : nouveau logo wordmark validé
- Suivre sur Search Console → Sitemaps → statut "Succès"
- Pour sitelinks : chercher souvent "verimo" depuis différents appareils + partager sur LinkedIn
