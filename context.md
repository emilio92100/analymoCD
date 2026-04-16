# VERIMO — Contexte projet complet — 16 avril 2026

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

## Règles de notation (IMPORTANTES)

### Score /20 — principes
- On **part de 20**, chaque risque détecté déduit des points
- Les bons éléments ajoutent des points (bonus), plafonné à 20
- Chaque catégorie a un **note_max** — si pas de risque dans cette catégorie, on obtient le max
- Note haute = bien sain, note basse = risques importants

### Catégories et points max
| Catégorie | Max |
|-----------|-----|
| Travaux | 5 pts |
| Procédures | 4 pts |
| Finances | 4 pts |
| Diagnostics privatifs | 4 pts |
| Diagnostics communs | 3 pts |
| **TOTAL** | **20 pts** |

### Déductions
- Travaux urgents non anticipés : -3 à -4
- Gros travaux évoqués non votés : -2 à -3
- Fonds travaux nul : -2
- DPE F (résidence principale) : -2 / G : -3
- DPE F ou G (investissement) : -4 à -6
- Procédures judiciaires : -2 à -4
- DPE A : +1 / B-C : +0,5
- Fonds travaux conforme 5% : +0,5 / bon (6-9%) : +1 / excellent (≥10%) : +1,5

### Niveaux de score
| Plage | Niveau |
|-------|--------|
| 17–20 | Bien irréprochable |
| 14–16 | Bien sain |
| 10–13 | Bien correct avec réserves |
| 7–9 | Bien risqué |
| 0–6 | Bien à éviter |

---

## Règles métier critiques (prompt analyser-run)

1. **Score /20** — note haute = bien, note basse = risque. On part de 20 et on déduit.

2. **Fonds ALUR / fonds de roulement** — Ces montants sont attachés au lot. L'acheteur les hérite MAIS DOIT LES REMBOURSER AU VENDEUR à la signature de l'acte authentique, en sus du prix de vente. Formuler : "X € de fonds travaux ALUR à rembourser au vendeur à la signature." **JAMAIS** "récupérable par l'acheteur".

3. **Votes en deux tours (art. 25 → art. 24)** — Si une résolution ne recueille pas la majorité art. 25 au 1er tour mais obtient au moins 1/3 des voix, un 2ème tour à la majorité art. 24 est organisé immédiatement. Si adopté au 2ème tour → résolution **ADOPTÉE**. Ne jamais marquer comme refusée. Vrai refus = résolution rejetée sans 2ème tour ou 2ème tour également rejeté. S'applique à TOUTES les résolutions.

4. **Honoraires syndic pré-état daté** — Frais d'établissement du document, **toujours à la charge du vendeur**.

5. **DPE D** = bonne performance, jamais dans vigilances.

6. **Quitus refusé** — expliquer clairement : les copropriétaires ont voté contre la validation de la gestion financière du syndic, traduit désaccord ou méfiance.

7. **Carrez** — ne pas afficher dans les diags si section Surface Carrez dédiée (éviter les doublons).

8. **Anomalies diagnostics** — toujours triées en premier, ERP informatif en dernier.

9. **`pre_etat_date.present = true`** — extraire TOUS les champs : impayes_vendeur, fonds_travaux_alur, fonds_roulement_acheteur, honoraires_syndic, charges_futures, historique_charges N-1/N-2, travaux_charge_vendeur, procedures_contre_vendeur, impayes_copro_global, dette_fournisseurs.

---

## Architecture fichiers clés

```
src/pages/
  RapportPage.tsx          ← Page rapport standalone (PRINCIPALE — très longue)
  DashboardPage.tsx        ← Shell dashboard + sidebar + topbar
  TarifsPage.tsx           ← Page tarifs publique
  MethodePage.tsx          ← Page Notre méthode
  dashboard/
    Compte.tsx             ← Mon compte
    MesAnalyses.tsx        ← Listing analyses
    Support.tsx            ← Support / Aide
    DocumentRenderer.tsx   ← Rendu analyse simple (par type de document)
    HomeView.tsx           ← Tableau de bord
    Tarifs.tsx             ← Tarifs internes dashboard

supabase/functions/
  analyser-run/index.ts    ← Edge function principale (prompt Claude + JSON)
```

---

## RapportPage.tsx — Architecture interne

### Composants transversaux
- **`TooltipBtn`** — composant `?` universel : `position: fixed`, `zIndex: 9999`, instantané au survol. `white={true}` pour fond bleu, `white={false}` pour fond gris. **Remplace tous les anciens Tooltip, TooltipWhite et `title=` natifs**.
- **`Tooltip`** — wrapper léger autour de `TooltipBtn` (avec texte enfant)
- **`KpiBand`** — grille de KPIs bleu Verimo dégradé `['#2a7d9c','#236b87','#1e5f77','#185166','#133d50']`, emoji 26px, label blanc 65%, valeur blanche 22px
- **`SectionTitle`** — barre bleue `#2a7d9c` avec emoji + texte blanc + `TooltipBtn` optionnel
- **`AccordionSection`** — accordéon avec `useEffect(() => setOpen(defaultOpen), [defaultOpen])` pour réagir au bouton "Tout déplier"

### Onglets (analyse complète)
- **Synthèse** — score, KPIs globaux (bleu Verimo dégradé), points forts/vigilances, avis Verimo, catégories /20
- **Copropriété** — bandeau syndic, KPIs copro, vie copro (participation AG + quitus), règles RCP, DTG, travaux, finances (budget + fonds ALUR + historique AG)
- **Votre logement** — KPIs logement (DPE, charges, surface Carrez, fonds ALUR), bloc "Votre lot" unifié avec pré-état daté intégré, DPE, diagnostics privatifs, finances
- **Procédures** — headers foncés par gravité : rouge `#7f1d1d` / marron `#78350f` / vert `#14532d`, titre blanc, badge semi-transparent
- **Documents** — liste docs analysés + docs manquants avec `TooltipBtn`

### Bloc "Votre lot" (TabLogement) — Structure unifiée
1. **Identité du lot** — lots parsés proprement (plus de JSON brut), tantièmes
2. **Situation du vendeur** (si `pre_etat_date.present`) — impayés ✓/✗, procédures ✓/✗, honoraires syndic rassurant
3. **Sommes à verser au vendeur** — fonds ALUR + fonds de roulement en orange avec tooltip
4. **Historique N-1/N-2** — tableau Budget appelé / Charges réelles / Écart coloré + encart "💡 Comment lire ce tableau ?"
5. **Règles RCP** + rappel travaux évoqués avec lien → onglet Copropriété (`onSwitchTab`)

---

## analyser-run/index.ts — JSON complete

### Champs JSON complets
Le JSON `complete` contient notamment :
- `vie_copropriete.syndic` : nom, type (professionnel/bénévole), gestionnaire, fin_mandat, tensions
- `vie_copropriete.participation_ag[].quitus` : {soumis, approuve, detail}
- `vie_copropriete.dtg` : present, etat_general, budget_urgent_3ans, budget_total_10ans, travaux_prioritaires
- `vie_copropriete.regles_copro` : règles RCP avec statut autorisé/interdit/sous_conditions
- `pre_etat_date` : bloc complet (impayes_vendeur, fonds_travaux_alur, fonds_roulement_acheteur, honoraires_syndic, charges_futures, historique_charges N-1/N-2, travaux_charge_vendeur, procedures_contre_vendeur, impayes_copro_global, dette_fournisseurs, fonds_travaux_copro_global)
- `lot_achete.compromis` : vendeur, acheteur, notaires, agence, prix, dates, conditions_suspensives, clauses
- `categories` : {travaux, procedures, finances, diags_privatifs, diags_communs} × {note, note_max}

---

## Sessions de travail — 16 avril 2026

### Ce qui a été fait dans cette session

#### 1. TabProcédures — Design headers foncés
- Headers colorés par gravité : rouge `#7f1d1d` (élevée) / marron `#78350f` (modérée) / vert `#14532d` (faible)
- Titre blanc, badge semi-transparent `rgba(255,255,255,0.15)`, icône emoji

#### 2. Badge gaz "Détecté" → "✓ Conforme"
- Quand `presence === 'detecte'` sans alerte → badge vert "✓ Conforme" au lieu d'orange "Détecté"
- `isConforme` calculé dans `DiagRow`

#### 3. Carrez en double — filtré
- `autresDiags` filtre désormais `d.type !== 'CARREZ'` (section dédiée existe)

#### 4. Tri diagnostics
- Anomalies toujours en premier (score 3), détectés sans alerte (1), ERP informatif (0), absences (-1)

#### 5. "Tout déplier" Copropriété — corrigé
- `useEffect(() => setOpen(defaultOpen), [defaultOpen])` dans `AccordionSection`
- `defaultOpen={allOpen}` passé à toutes les `AccordionSection` de `TabCopropriete`

#### 6. Parties privatives — parser JSON brut
- `{"numero":"17","description":"..."}` → affiché proprement comme "Lot 17 — Appartement dit porte n°2..."

#### 7. KpiBand — Design bleu Verimo dégradé option B
- Bleu dégradé `#2a7d9c → #236b87 → #1e5f77 → #185166 → #133d50` de gauche à droite
- Emoji 26px, label blanc 65%, valeur blanche 22px

#### 8. KPIs Synthèse — même design bleu Verimo
- Même palette dégradée que Copro et Logement

#### 9. TooltipBtn universel — position:fixed, instantané
- Remplace tous les anciens tooltips (`Tooltip`, `TooltipWhite`, `title=` natif, accordéon, `SectionTitle`, conditions suspensives, `TabDocuments`)
- `position: fixed` + `zIndex: 9999` → jamais rogné par les parents
- `white={true}` pour fond bleu, `white={false}` pour fond gris
- Tous les `?` en `fontWeight: 700` pour cohérence

#### 10. Bloc "Votre lot" — refonte complète + pré-état daté intégré
- L'accordéon "Pré-état daté" séparé est supprimé
- Tout est dans "Votre lot" : identité, situation vendeur, sommes à verser, historique N-1/N-2, règles RCP
- Tableau N-1/N-2 avec encart "💡 Comment lire ce tableau ?" identique à l'analyse simple

#### 11. KPIs Logement — option A (Cards colorées fondées)
- Tantièmes retirés des KPIs (trop long) → remplacés par Surface Carrez
- Fonds ALUR avec `sub: 'À rembourser au vendeur'`

#### 12. KPIs Logement — redesign final option B bleu Verimo
- Même palette bleu dégradé que les autres onglets
- Emoji 26px sur fond bleu

#### 13. Règle vote en deux tours — prompt analyser-run
- Ajoutée dans `buildDocumentPrompt` (mode simple) ET prompt `complete`
- Couvre toutes les résolutions, pas seulement fonds de travaux
- Indices : "second tour", "art. 24", "adoptée à la majorité art. 24"

#### 14. Règle fonds ALUR — prompt analyser-run corrigé
- "SERONT REMBOURSÉS AU VENDEUR par l'acheteur à la signature de l'acte authentique, en sus du prix de vente"
- "Ne jamais dire que ce montant est 'récupérable' ou 'restitué à l'acheteur'"

#### 15. Compromis dans JSON complete
- `lot_achete.compromis` : vendeur, acheteur, notaires, prix, dates, conditions suspensives, clauses

#### 16. pre_etat_date dans JSON complete
- Nouveau bloc avec tous les champs du pré-état daté
- Règle d'extraction explicite dans le prompt

#### 17. Lien "Voir travaux évoqués" — corrigé
- `button` avec `onSwitchTab?.('copropriete' as TabId)` — navigue réellement vers l'onglet Copropriété
- `setActiveTab` passé depuis `RapportPage` via prop `onSwitchTab`

#### 18. Finances logement — bloc "Charges de copro" conditionnel
- S'affiche uniquement si pas de taxe foncière (évite doublon avec KPI charges)

#### 19. MethodePage.tsx — mise à jour complète
- **Documents reclassifiés** :
  - ✓ Indispensables (4) : PV AG (3 derniers), DDT complet, Appels de charges, RCP
  - + Complémentaires (3) : Pré-état daté / État daté, DTG / PPT, Taxe foncière
  - ★ Recommandés (2) : Compromis de vente, Carnet d'entretien
- **Score /20** — nouveau bloc explicatif "Comment lire la note par catégorie ?" avec 4 exemples
- **Textes agrandis** : 25+ occurrences, 13→14px, 13.5→16px, 12→13px

#### 20. Doublons titres dashboard — corrigés
- `Compte.tsx` : `<h1>Mon compte</h1>` supprimé
- `MesAnalyses.tsx` : `<h1>Mes analyses</h1>` supprimé
- `Support.tsx` : `<h1>Support / Aide</h1>` supprimé
- Le topbar `DashboardPage` affiche déjà le titre actif

#### 21. TarifsPage.tsx — fix mobile
- `whiteSpace: 'nowrap'` supprimé sur le slogan sous-titre
- `maxWidth: 520` + `padding: '0 16px'` → le texte se coupe proprement sur mobile

#### 22. RapportPage — première passe responsive mobile
- Container principal : `padding: 20px 28px` → `8px 6px` sur mobile (`< 640px`)
- KPI band : 5 colonnes → 2 colonnes sur mobile, valeur `16px`
- Onglets : scrollables horizontalement (`overflow-x: auto`, `nowrap`, sans scrollbar visible)
- Accordéons : padding réduit sur mobile
- Tables : `font-size: 12px`, `padding: 7px 9px` sur mobile
- Header dark : `border-radius: 8px`, topnav compact, hero compact
- Cercle score : `88px` → `72px` sur mobile
- Tooltips : `max-width: calc(100vw - 24px)`, `left: 12px` → jamais hors écran
- DashboardPage topbar : `font-size: 14px` + `ellipsis` sur mobile

---

## ⚠️ PRIORITÉ ABSOLUE — À FAIRE EN PROCHAINE SESSION

### Responsive mobile RapportPage — chantier à terminer
Le responsive a été amorcé mais **n'est pas terminé**. Il faut une refonte profonde pour une expérience premium sur mobile :

**Ce qui reste à faire :**
1. **Header** — réduire davantage, mettre le bouton PDF en icône seule, les tags en scroll horizontal
2. **KPIs** — les valeurs longues ("2 mentionnés", "Classe D") débordent encore sur petits écrans — réduire fontSize dynamiquement
3. **Blocs de texte** — les descriptions de travaux, procédures, diagnostics sont trop longues sur mobile → ajouter `line-clamp` avec "Lire plus"
4. **Tableaux N-1/N-2** — les colonnes se tassent trop → transformer en cards empilées sur mobile
5. **DiagRow** — le layout badge + texte déborde → passer en colonne sur mobile
6. **RCP règles** — le layout `flex justify-between` avec badge déborde → empiler
7. **SyndicBand** — les séparateurs verticaux cassent le layout → passer en grille 2×2
8. **Finances graphique** — les barres horizontales ne s'adaptent pas bien
9. **Bottom sheet navigation** — idéalement remplacer les onglets par une navigation bottom sheet native mobile
10. **Test sur vrai mobile** — faire une session dédiée avec screenshots depuis iPhone

**Approche recommandée pour la prochaine session :**
- Utiliser `className` + CSS media queries (déjà en place)
- Ou ajouter un hook `useIsMobile()` et conditionner le rendu JSX directement
- Tester avec Chrome DevTools mobile (iPhone SE = 375px, iPhone 14 = 390px)

---

## Ce qui reste à faire (backlog général)

- [ ] **Responsive mobile RapportPage** — PRIORITÉ ABSOLUE (voir section ci-dessus)
- [ ] **Dashboard navigation** — redesign proposé (3 options A/B/C montrées), utilisateur n'a pas aimé → à reproposer
- [ ] **Listing analyses MesAnalyses** — redesign à faire (options A/B/C montrées, utilisateur n'a pas aimé → à reproposer)
- [ ] **Stripe TEST → production** — changer les Price IDs
- [ ] **Timeout analyses bloquées > 20 min** — afficher badge "Échoué"
- [ ] **Compare.tsx** — présent mais non testé
- [ ] **context.md** — ce fichier (fait ✓)

---

## Décisions de design définitives

### Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Bleu dégradé KPIs** : `['#2a7d9c', '#236b87', '#1e5f77', '#185166', '#133d50']`
- **Header dark** : `linear-gradient(135deg, #0f2d3d, #1a4a5e)`
- **Procédures** : rouge `#7f1d1d` / marron `#78350f` / vert `#14532d`

### Composants UI
- **`TooltipBtn`** — seul composant `?` à utiliser partout (position:fixed, instantané)
- **`KpiBand`** — bleu dégradé, toujours avec emoji
- **`SectionTitle`** — fond `#2a7d9c`, emoji + texte blanc + `TooltipBtn` optionnel
- **`AccordionSection`** — `useEffect` pour réagir à `defaultOpen`
- **Parties privatives** — toujours parsées (pas de JSON brut affiché)
- **Badge gaz conforme** — "✓ Conforme" (vert) si pas d'alerte, pas "Détecté" (orange)

### Règles d'affichage
- **Tantièmes** — dans bloc "Votre lot", pas dans les KPIs (trop long)
- **Surface Carrez** — dans les KPIs Logement (remplace tantièmes)
- **Charges de copro** — uniquement dans l'onglet Logement, pas dans Copro
- **Carrez** — filtré des `autresDiags` (section dédiée)
- **Pré-état daté** — intégré dans "Votre lot", pas d'accordéon séparé
