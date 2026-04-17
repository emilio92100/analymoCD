# VERIMO — Contexte projet complet — 17 avril 2026

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

**Cible :** Acheteurs particuliers (primo-accédants et investisseurs), notaires, agents, syndics, marchands de biens.

### Logique crédits / prix
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de score /20
- 19,90€ → 1 crédit analyse complète
- 29,90€ → 2 crédits (Pack 2 biens)
- 39,90€ → 3 crédits (Pack 3 biens)
- Les crédits n'expirent jamais

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
- **Déploiement** : Vercel (auto depuis GitHub)
- **Repo** : `github.com/emilio92100/analymoCD`
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`

---

## Routes
```
/dashboard                  → HomeView (tableau de bord)
/dashboard/nouvelle-analyse → NouvelleAnalyse
/dashboard/analyses         → MesAnalyses
/dashboard/compare          → Compare (non travaillé)
/dashboard/rapport?id=XXX   → Aperçus gratuits
/rapport?id=XXX             → RapportPage standalone (rapports payants)
```

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

**Base 20/20** — on déduit les risques, on ajoute les éléments positifs.

### Niveaux
| Plage | Niveau |
|-------|--------|
| 17–20 | Bien irréprochable |
| 14–16 | Bien sain |
| 10–13 | Bien correct avec réserves |
| 7–9 | Bien risqué |
| 0–6 | Bien à éviter |

### Travaux (-/+ 5pts)
- Travaux lourds évoqués non votés : **-3**
- Travaux légers évoqués non votés : **-1**
- Travaux votés charge vendeur petits/moyens : **+2**
- Gros travaux votés charge vendeur : **+3**
- Garantie décennale récente : **+2**

### Procédures (-/+ 4pts)
- Procédure significative : **-3**
- Procédure mineure : **-1,5**
- Aucune procédure : **+1**

### Finances (-/+ 4pts)
- Fonds travaux nul/absent : **-1**
- Impayés > 15% budget : **-1**
- Fonds travaux 5% : **+0,5** / 6-9% : **+1** / ≥10% : **+1,5**

### Diagnostics privatifs (-/+ 4pts)
- DPE F (RP) **-2** / G (RP) **-3** / F (invest) **-4** / G (invest) **-6**
- Électricité anomalies majeures : **-2**
- DPE A/B/C : **+1,5** / DPE D : **+1**
- Diagnostics complets sans anomalie + DPE ≤ D : **+2**

### Diagnostics communs (-/+ 3pts)
- Amiante PC dégradé **-2** / Termites PC **-2** / DTG dégradé **-2**
- DTG budget urgent < 50k€ **-1** / > 50k€ **-2**
- Immeuble bien entretenu **+0,5** / Chaudière certifiée **+0,5** / DTG bon **+1**

---

## Règles métier critiques

1. **Fonds ALUR** — L'acheteur hérite ces montants MAIS DOIT LES REMBOURSER AU VENDEUR à la signature en sus du prix. JAMAIS "récupérable par l'acheteur".

2. **Votes deux tours** — Art. 25 insuffisant + ≥ 1/3 voix → 2ème tour art. 24. Si adopté → ADOPTÉE. Vrai refus = rejeté sans 2ème tour.

3. **Honoraires syndic pré-état daté** — Toujours à la charge du vendeur.

4. **DPE D** = bonne performance, jamais dans vigilances.

5. **Carrez** — ne pas afficher dans les diags si section Surface Carrez dédiée.

---

## Architecture fichiers clés

```
src/pages/
  RapportPage.tsx           ← Rapport standalone (analyse complète + simple)
  DashboardPage.tsx         ← Shell dashboard + sidebar + topbar
  dashboard/
    MesAnalyses.tsx         ← Listing analyses
    HomeView.tsx            ← Tableau de bord
    NouvelleAnalyse.tsx     ← Upload + barre progression
    DocumentRenderer.tsx    ← Rendu analyse simple (par type de doc)

src/lib/
  supabase.ts               ← Client Supabase
  analyse-client.ts         ← Upload Storage + polling

supabase/functions/
  analyser/index.ts         ← Étape 1 : upload fichiers → Files API
  analyser-run/index.ts     ← Étape 2 : Claude + JSON rapport
```

---

## RapportPage.tsx — Composants clés

- **`TooltipBtn`** — composant `?` universel. Mobile : overlay sombre centré (tap dehors ferme). Desktop : `position: fixed`. `white={true}` pour fond bleu.
- **`SectionTitle`** — fond `#2a7d9c` + emoji + `TooltipBtn`. Pas de tooltip custom.
- **`KpiBand`** — bleu dégradé. Desktop : blocs. Mobile : liste compacte.
- **`AccordionSection`** — `e.preventDefault()` sur click (évite scroll). `useEffect` sur `defaultOpen`.
- **`ResumeBlock`** — clamp 5 lignes mobile + "Lire la suite".
- **`PdfButton`** — desktop : `window.open`. Mobile : toast "disponible sur PC".

### Bottom tab bar mobile
Option A : fond blanc, icônes 26px colorées/grayscale, pill actif `flex: 1.7`, `safe-area-inset-bottom`.

### Labels visuels validés
- Résumé : badge pill `#0f2d3d` + 📋
- Vue d'ensemble : badge pill `#0f2d3d` + 🏢
- Règles copro : icône thème auto (🐾🔑🔨🪟🚗🏠…) + badge statut inline
- Questions diverses RapportPage : numéros cerclés bleu Verimo
- Fonds ALUR : montant bold + encart ℹ️ orange (pas de SectionTitle redondant)

---

## DocumentRenderer.tsx — Analyse simple

### Composants communs (responsive)
- **`Kpi`** : `dr-kpi-block` (desktop) / `dr-kpi-row` (mobile ligne)
- **`KpiGrid`** : `dr-kpi-grid` (caché mobile) / `dr-kpi-list` (mobile card liste)
- **`SectionKpi`** : grille `dr-sectionkpi-grid` (1 col mobile)
- **`DiagnosticCardRow`** : 2 lignes (nom / badge + bouton)
- **`Header`** : `borderRadius: 14` conservé sur mobile, `padding: 14px 16px`
- **`Resume`** : badge 📋 RÉSUMÉ, clamp 4 lignes + "Lire la suite"

### CSS mobile (règles toutes dans @media max-width:640px)
```css
.dr-kpi-grid { display: none }        /* remplacé par dr-kpi-list */
.dr-kpi-list { display: block }
.dr-kpi-block { display: none }       /* remplacé par dr-kpi-row */
.dr-kpi-row { display: flex }
.dr-sectionkpi-grid { grid-template-columns: 1fr }
.dr-ddt-desktop { display: none }     /* DDT 3 cols → blocs empilés */
.dr-ddt-mobile { display: flex }
.dr-dpe-desktop { display: none }     /* DPE côte à côte → empilé */
.dr-dpe-mobile { display: flex }
.dr-diag-kpi-desktop { display: none } /* Amiante ligne PC → liste mobile */
.dr-diag-kpi-mobile { display: block }
.dr-zone-row-desktop { display: none }
.dr-zone-row-mobile { display: flex }
.dr-syndic-mobile { display: block }  /* PV AG syndic après résumé */
.dr-diag-meta { display: none }       /* Commanditaire masqué header */
```

### Spécificités par type
- **DDT** : desktop 3 cols (Diagnostiqueur/Lots/Diagnostics), mobile blocs. DPE+GES côte à côte PC (séparateur), empilés mobile. Travaux DPE : gradient orange 🏗️ + emoji type + prix.
- **PV_AG** : 3 encarts desktop. Syndic mobile KPI après résumé. Questions diverses numéros cerclés. Montants `whiteSpace: nowrap`.
- **DIAGNOSTIC_PARTIES_COMMUNES** : PC — diagnostiqueur gauche + 4 KPIs droite sur une ligne. Zones : nuances bleu Verimo par zone, cards mobile empilées.

---

## MesAnalyses.tsx

### Mobile — 3 lignes distinctes
1. Icône + titre court intelligent
2. Boutons Rapport / Partager / Poubelle
3. Badge type + date + score à droite

### Titre court (analyse simple)
Détecté par mots-clés : "amiante" → "Dossier Technique Amiante", "procès-verbal" → "PV Assemblée Générale", etc. Fallback : avant le premier "—".

---

## NouvelleAnalyse.tsx — Progression

### 6 étapes Option B (validées)
```
📤 Envoi des fichiers        0→16%
🔐 Traitement sécurisé       16→30%
📖 Lecture approfondie       30→50%
🔍 Analyse des éléments clés 50→70%
✍️ Rédaction du rapport      70→88%
✅ Dernières vérifications   88→100%
```

### Upload mobile
- `<label htmlFor>` natif (Safari iOS fix)
- `arrayBuffer()` forcé avant upload (iCloud/Google Drive fix)
- Texte "Appuyez pour sélectionner" sur mobile

---

## analyser-run/index.ts

### Messages progression (10 messages, toutes les 40s, progressifs — pas de boucle)
```
'Traitement sécurisé de vos documents...'
'Lecture approfondie en cours...' ×2
'Analyse des éléments clés...' ×3
'Rédaction du rapport en cours...' ×2
'Dernières vérifications...'
'Finalisation en cours...'
```

---

## supabase.ts
```ts
createClient(url, key, {
  auth: { persistSession: true, storageKey: 'verimo-auth', autoRefreshToken: true, detectSessionInUrl: true }
})
```

---

## DashboardPage.tsx
- Main : `padding: 28px 24px`, **pas de maxWidth ni margin auto** → collé à gauche
- Sidebar : `width: 260px`, fixed

---

## Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Bleu dégradé KPIs** : `['#2a7d9c', '#236b87', '#1e5f77', '#185166', '#133d50']`
- **Header dark** : `#0f2d3d`
- **Procédures** : rouge `#7f1d1d` / marron `#78350f` / vert `#14532d`

---

## Backlog

### 🔴 Priorité haute
- [ ] Vérifier affichage mobile tous types docs simples (RCP, Appel charges, Taxe foncière, Compromis, DTG, Carnet entretien)
- [ ] Corriger texte NouvelleAnalyse : supprimer "Word ou images" → PDF uniquement
- [ ] Conseil Verimo HomeView : déplacer en haut sous forme de bandeau
- [ ] Onglet **Comparaison de biens** : à construire
- [ ] Bouton PDF → message "service non disponible" (au lieu d'erreur)
- [ ] Page Support : agrandir le texte
- [ ] HomeView : retravailler présentation générale

### 🟡 Priorité normale
- [ ] Stripe TEST → production (changer Price IDs)
- [ ] Analyses bloquées > 20 min → badge "Échoué"
- [ ] Système dossiers par bien (table `biens` + FK `bien_id`)
- [ ] Compare.tsx : présent mais non travaillé
