# VERIMO — Contexte projet complet — 21 avril 2026 (session 5)

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

---

## Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour **appartements et maisons**.

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

---

## Routes
```
/                           → HomePage
/pro                        → ProPage (landing page offre professionnelle — 4 profils)
/contact-pro                → ContactProPage (formulaire qualifié pros — 5 profils)
/tarifs                     → TarifsPage
/contact                    → ContactPage
/exemple                    → ExemplePage (refaite ✅ — toggle Simple/Complète, rapport interactif)
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

## 🆕 Modifications session 21 avril 2026 — session 5 (refonte visuelle + responsive)

### 🎯 Résumé de la session
Session longue dédiée à la refonte visuelle du projet et à la responsivité mobile :
- Refonte ExemplePage (Option B "vraie vitrine" — réutilisation composants RapportPage)
- Animations accordéons fluides (CSS pur, pattern grid-template-rows 0fr→1fr)
- Refonte KPI Synthèse en style hybride A+B (blancs sobres + teintés sémantiquement sur alertes)
- Fix mobile responsive sur toute l'app (Toggle, KPI, SyndicBand, padding rapport)
- Refonte section HomePage "Ce que vous recevez" pour cohérence parfaite avec /exemple
- Onglets rapport : style coloré actif pour clarifier la navigation UX
- Enrichissement prompt IA : détection rigoureuse du gestionnaire de copropriété
- Corrections diverses (Navbar, Footer, ContactPage, mock ExemplePage)

---

### ExemplePage.tsx — Refonte complète (Option B "vraie vitrine")

**Architecture choisie :** réutilisation des composants de `RapportPage` (et non duplication). Toute future modification du vrai rapport se propage automatiquement à l'exemple.

**Exports ajoutés dans RapportPage.tsx** :
- `type RapportData` et `type TabId` (types partagés)
- `RapportViewExemple({ rapport, defaultTab, onComplement })` : composant qui réutilise `TabSynthese/TabCopropriete/TabLogement/TabProcedures/TabDocuments`
- `buildRapportExemple(data, dbData)` : wrapper sur `buildRapport`

**Fonctionnalités finales /exemple** :
- Mode par défaut = **simple** (URL `?mode=complete` pour forcer la complète)
- Toggle animé Simple/Complète avec `layoutId="seg-toggle-pill"` framer-motion (simple en 1er)
- Hero : badge "RAPPORT EXEMPLE" supprimé, sous-titre maxWidth 920px (1 ligne desktop), ligne "Données anonymisées" agrandie en pill bleu (14px + Lock icon)
- Rapport avec ombre douce (cadres laptop/iPhone supprimés)
- **DemoPopup premium** : Sparkles icon, badge "VERSION DÉMO", 2 CTAs (Lancer ma vraie analyse / Continuer à explorer), backdrop blur 8px, scale+fade. Branchée via prop `onComplement` passée à `RapportViewExemple`
- CTAFinal : maxWidth 1100px, "30 secondes*" (pas 2 minutes), mention astérisque discrète
- BlocEngagement supprimé (redondant)

**Mocks de démo** :
- `MOCK_COMPLETE_PAYLOAD` (Lyon 6e, 24 rue des Lilas, score 14.8/20) :
  - `finances.budget_total_copro: 45000`, `charges_annuelles_lot: 2160`, `fonds_travaux: 12000` (corrigé de 42000 qui était incohérent), `impayes: 8400`, `nombre_lots: 42`, `taxe_fonciere: 1180`
  - `vie_copropriete.syndic` : Cabinet Immo Lyon Gestion, gestionnaire Marie Dupont, statut "stable", 3 AGs analysées
- `MOCK_PVAG_SIMPLE` : PV AG Résidence Les Lilas, 22 rue Mozart Lyon 2e (pour mode simple)

---

### RapportPage.tsx — Refonte KPI Synthèse (style hybride A+B)

**Problème initial** : KPI Synthèse sur fond sombre bleu-teal cassaient le flux visuel avec le score vert du haut et la synthèse blanche du bas.

**Nouveau système de severity** :
```ts
type KpiSeverity = 'neutral' | 'info' | 'ok' | 'warn' | 'danger';
```

**Helper `getKpiCardStyle(severity)`** : retourne 5 palettes (background, border, iconBg, iconColor, labelColor, valueColor).

**Logique hybride A+B** :
- **Cartes blanches sobres par défaut** (severity `neutral`) : Lots, Construction, Charges, Taxe foncière
- **Teinte sémantique uniquement si alerte** :
  - `ok` (vert clair) : DPE A/B/C, Aucune procédure
  - `warn` (orange clair) : DPE D/E, Travaux votés, Travaux évoqués
  - `danger` (rouge clair) : DPE F/G, Procédures > 0

**Design cards** : icône dans carré coloré 38px à gauche, label 10.5px majuscule, valeur 17px bold.

---

### RapportPage.tsx — Onglets rapport en style coloré actif

**Avant** : Onglet actif = fond `#f8fafc` gris quasi invisible + ligne orange fine dessous. Onglet inactif = texte gris sans signal de cliquabilité.

**Après** :
- **Onglet actif** : fond plein de sa couleur (vert Synthèse, orange Copropriété, rouge Logement, etc.) + texte blanc bold + ombre douce colorée
- **Onglet inactif** : texte gris, **effet hover CSS** → fond `#f1f5f9` + texte plus foncé → signale clairement la cliquabilité
- Pastille devient blanche (rgba 0.85) sur l'onglet actif (cohérent avec fond coloré)
- className `rapport-tab-btn` / `rapport-tab-btn-active` pour pilotage CSS
- **Appliqué aux 2 composants** : `RapportViewExemple` ET `RapportView` principal → cohérence partout

---

### RapportPage.tsx — Animations accordéons fluides (CSS pur)

**Pattern utilisé** : `grid-template-rows: 0fr → 1fr` + opacity + translateY, cubic-bezier(0.4, 0, 0.2, 1), 0.35s. Chevron rotation 0→180deg. Import `ChevronUp` retiré.

**Appliqué à** :
- `AccordionSection` (RapportPage ligne ~99) — tous les accordéons du rapport
- `CarrezAccordeon` (DocumentRenderer ligne 304)
- `DiagnosticCardRow` (DocumentRenderer ligne 373)
- `RendererDiagCommunes` (DocumentRenderer ligne 1987) avec flèche `▾` rotation 0↔-90deg

---

### RapportPage.tsx — Améliorations onglets

**TabCopropriete** :
- SyndicBand déplacé DANS l'accordéon "Vie de la copropriété" (plus en haut)
- KPI en position 1 juste après bandeau VUE D'ENSEMBLE
- KPI "Charges mensuelles lot" → remplacé par **"Budget annuel copro"** (évite doublon avec TabLogement qui affiche les charges perso)
- Tooltip ajouté sur Budget annuel pour expliquer la différence avec charges du lot

**TabLogement** :
- Ajout `const [allOpen, setAllOpen] = useState(false)` + bouton "Tout déplier/replier"
- 6 AccordionSection avec `defaultOpen={allOpen}` (plus `true` par défaut)

**SyndicBand simplifié** :
- Retiré la grille Lots/Bâtiments/Fin mandat/Tensions + alerte échéance
- Garde : identité + statut + gestionnaire
- Affiche `gestionnaire_fonction` si présent : `👤 Gestionnaire de copropriété : Patrick Desserteau`
- Props `nbLots`/`nbBatiments` retirées

---

### HomePage.tsx — Section "Ce que vous recevez" refondue (cohérence parfaite avec /exemple)

**Objectif** : quand un visiteur clique de la HomePage vers /exemple, **zéro rupture visuelle**. Le design doit être identique.

**Avant** : mini-maquette avec 8 points détectés + données financières + Avis Verimo + PDF → redondant et désynchronisé du vrai rapport.

**Après** : section réplique **pixel-perfect** le design du vrai `/exemple` :
- Bandeau header dégradé `#0f2d3d → #1a5e78 → #2a7d9c`
- Badge "RAPPORT VERIMO · ANALYSE COMPLÈTE"
- Adresse "24 rue des Lilas, Lyon 6e" (cohérent avec le mock)
- Score circulaire animé **14.8/20** + badge "✓ Bien sain"
- Barre d'onglets (Synthèse active / Copropriété / Logement / Procédures / Documents) avec pastilles colorées de statut
- Bandeau "🏢 VUE D'ENSEMBLE"
- Grille 6 KPI en style hybride A+B cohérent avec vrai rapport
- Synthèse avec Points Positifs (verts) et Points de Vigilance (orange)
- CTA final gros dégradé `#2a7d9c → #1a5e78` "Voir un exemple complet interactif"

---

### Responsive mobile — 4 corrections critiques

**Problème** : sur mobile, 4 zones étaient cassées (toggle débordant, KPI écrasés en bandes verticales, labels tronqués, padding latéral excessif).

**Solution centralisée dans `src/index.css`** (media queries `@media (max-width: 768px)`) :

1. **Toggle Simple/Complète** → cards empilées propres :
   - Container pill gris parent devient transparent
   - Chaque card devient un bouton indépendant (fond blanc + bordure grise 1.5px)
   - Card active : fond bleu `#2a7d9c` + bordure bleue + ombre douce
   - `.seg-toggle-pill-anim` (framer-motion) caché sur mobile
   - Classes ajoutées : `seg-toggle-btn`, `seg-toggle-btn-active`, `seg-toggle-pill-anim`

2. **KPI Synthèse et KpiBand (Copro/Logement)** : bascule `desktop-hidden → mobile-flex` :
   - `.kpi-desktop` et `.kpi-synth-desktop` → `display: none`
   - `.kpi-mobile` et `.kpi-synth-mobile` → `display: flex`
   - Les versions mobiles (liste empilée compacte) existaient déjà dans le code mais n'étaient pas activées faute de CSS
   - Fix labels tronqués "ANNÉE DE CON..." : plus de truncate en mode liste

3. **SyndicBand** : `.syndic-stats` passe en grille 2×2 sur mobile

4. **Rapport ExemplePage** : padding latéral réduit sur mobile :
   - Classes ajoutées : `.exemple-rapport-wrap` et `.exemple-rapport-card`
   - `padding: 0 16px 8px` → **`6px`** sur mobile (supprime l'espace blanc à gauche/droite)
   - Le rapport prend presque toute la largeur de l'écran

---

### analyser-run/index.ts — Enrichissement prompt (gestionnaire de copropriété)

**Contexte** : le gestionnaire de copropriété (ex: Patrick Desserteau) était souvent confondu avec le président du conseil syndical ou le PDG du cabinet. Règle durcie dans le prompt.

**Règles de priorité stricte pour `gestionnaire` et `gestionnaire_fonction`** :
- **Priorité gestionnaire** :
  1. Gestionnaire principal de la copro (signataire régulier des documents syndic)
  2. Gestionnaire associé/adjoint
  3. `null`
- **Interdictions explicites** :
  - JAMAIS président du conseil syndical (= copropriétaire élu, pas un pro du syndic)
  - JAMAIS secrétaire de séance
  - JAMAIS PDG du cabinet sauf s'il est explicitement désigné gestionnaire
  - JAMAIS inventer
- **Fonction** : `gestionnaire_fonction` stocké UNIQUEMENT si explicitement écrite ("Gestionnaire de copropriété", "Chargée de clientèle", etc.), sinon `null`

**À déployer côté Supabase Dashboard** (pas GitHub) : `supabase/functions/analyser-run/index.ts`

---

### Navbar / Footer / ContactPage — Ajustements

**Navbar.tsx** :
- Lien "Contact" retiré du menu principal (déjà présent dans Footer)
- Navbar finale : Accueil, Notre méthode, Exemple, Tarifs

**Footer.tsx** :
- Import ajouté : `ArrowRight` de `lucide-react`
- Bouton "Envoyer un message" ajouté dans la colonne Contact (pill blanc transparent avec flèche, linkTo `/contact`)

**ContactPage.tsx** :
- Texte bloc Offre Professionnelle corrigé : "Agent immobilier, investisseur, marchand de bien, notaire ? Découvrez notre offre pro avec accès dédié." (retiré "et volumes illimités", ordre métiers respecté)

---

### Fichiers modifiés session 5

**Frontend (à pousser sur GitHub)** :
```
1. src/pages/RapportPage.tsx                 → exports Exemple + KPI Synthèse hybride A+B + onglets colorés + accordéons fluides + SyndicBand simplifié + KPI Copropriété (Budget annuel)
2. src/pages/ExemplePage.tsx                 → refonte complète (toggle, DemoPopup, mocks, ombre douce)
3. src/pages/dashboard/DocumentRenderer.tsx  → 3 accordéons animés (Carrez, DiagnosticCardRow, RendererDiagCommunes)
4. src/pages/HomePage.tsx                    → section "Ce que vous recevez" refondue (cohérence /exemple)
5. src/pages/ContactPage.tsx                 → texte Offre Pro corrigé
6. src/components/layout/Navbar.tsx          → lien Contact retiré
7. src/components/layout/Footer.tsx          → bouton "Envoyer un message" ajouté
8. src/index.css                             → media queries responsive + hover onglets rapport
```

**Backend (à déployer sur Dashboard Supabase)** :
```
9. supabase/functions/analyser-run/index.ts  → prompt enrichi gestionnaire + gestionnaire_fonction
```

---

## Modifications session 20 avril 2026 — session 4 partie 1

### Sélecteur "Type de bien" dans NouvelleAnalyse (NOUVELLE ÉTAPE)
Entre `choice` et `profil`, nouvelle étape où l'utilisateur déclare le type de bien :
- Appartement en copropriété (bleu)
- Maison individuelle (vert)
- Maison en copropriété / lotissement / ASL (ambre)
- Je ne suis pas sûr → Verimo détermine (violet)

Nouveau parcours complet :
```
1. choice       → Simple (4,90€) / Complète (19,90€)
2. type_bien ⭐  → 4 options
3. profil       → Résidence principale / Investissement
4. upload       → PDFs + bouton "Lancer l'analyse"
5. analyse      → Progression
6. result       → Rapport
```

### Infrastructure type_bien
- Nouvelle colonne `type_bien_declare` dans la table `analyses` (SQL migration idempotente)
- Type `TypeBien = 'appartement' | 'maison' | 'maison_copro' | 'indetermine'` dans `analyses.ts`
- Passage du `typeBienDeclare` de NouvelleAnalyse → analyses.ts → analyse-client.ts → edge `analyser` → edge `analyser-run`
- Règle prompt IA : si `typeBienDeclare` fourni et cohérent avec les docs → utilise cette valeur ; si contradiction flagrante → warning dans `points_vigilance`
- Fallback détection IA si `indetermine` ou non fourni (rétrocompatible avec les analyses antérieures)

### Fiabilisation du statut syndic (analyse simple ET complète)
**Problème résolu** : avant, un changement de syndic affichait "❌ Syndic non reconduit" en rouge alarmiste alors que c'est une situation normale et courante.

**Schéma enrichi PV_AG (analyse simple)** : nouveaux champs `syndic_statut`, `syndic_sortant`, `syndic_entrant`, `syndic_fin_mandat`.

**Schéma enrichi `vie_copropriete.syndic` (analyse complète multi-PV)** : nouveaux champs `statut`, `sortant`, `entrant`, `annee_changement`, `nb_ags_analysees`, `historique_changements`.

**Règles de détection (prompt IA)** :
- `stable` : même syndic sur 2+ AGs → ✅ "Syndic stable" (vert)
- `reconduit` : reconduction explicite → ✅ "Syndic reconduit" (vert)
- `nouveau_elu` : 1 changement unique → 🔄 "Nouveau syndic élu en XXXX — a remplacé YYY" (bleu, neutre/positif)
- `rotation_frequente` : 2+ changements sur 3 AGs → ⚠️ "Rotation fréquente des syndics" (orange) + historique déplié
- `recherche` : mandat à terme sans désignation → 🔄 orange
- `carence` : absence/administration provisoire explicite → ⚠️ rouge (rare)

**Règle prompt anti-alarmisme** : un changement de syndic unique est NORMAL, ne JAMAIS le mettre dans `points_vigilance` sauf si combiné avec quitus refusé OU procédure contre le syndic sortant.

### Page NouvelleAnalyse — améliorations UX
- **Largeur 900px centrée** sur les 4 étapes
- **Bouton "Lancer l'analyse"** renommé et remonté juste sous la zone d'upload

### Fichiers modifiés session 4 partie 1
```
1. supabase-schema.sql                       → ajout type_bien_declare + index + contrainte CHECK
2. src/lib/analyses.ts                       → type TypeBien, params createAnalyse/createApercu
3. src/lib/analyse-client.ts                 → param typeBienDeclare dans lancerAnalyseEdge
4. supabase/functions/analyser/index.ts      → v7 (reçoit + transmet typeBienDeclare)
5. supabase/functions/analyser-run/index.ts  → v7 (prompt type_bien + syndic multi-PV)
6. src/pages/dashboard/NouvelleAnalyse.tsx   → étape type_bien + maxWidth 900 + bouton remonté
7. src/pages/dashboard/DocumentRenderer.tsx  → affichage syndic intelligent (analyse simple)
8. src/pages/RapportPage.tsx                 → SyndicBand enrichi (analyse complète multi-PV)
```

---

## Modifications session 20 avril 2026 — session 3

### Enrichissement du prompt IA (règles juridiques)
**Loi Climat & Résilience :**
- DPE G : interdit location depuis 1er janvier 2025
- DPE F : interdit location au 1er janvier 2028
- DPE E : interdit location au 1er janvier 2034
- Gel loyers F et G depuis 24 août 2022
- Profil investisseur : mention vigilance + impact rentabilité
- Profil résidence principale : mention dans avis_verimo uniquement

**DPE petites surfaces (arrêté 25 mars 2024) :**
- Seuils ajustés pour logements < 40 m² depuis juillet 2024
- Si DPE F/G + < 40 m² + DPE avant juillet 2024 → mention dans points_forts

**Audit énergétique obligatoire à la vente :**
- Maisons individuelles et monopropriétés E/F/G → audit obligatoire
- NE concerne PAS les appartements en copropriété

### Compléter le dossier (7 jours) — IMPLÉMENTÉ
Après une analyse complète, l'utilisateur a 7 jours pour ajouter jusqu'à 5 documents oubliés. L'IA fusionne le rapport existant avec les nouveaux PDFs.

**Backend** : mode `complement` dans analyser + analyser-run, colonnes `complement_date` et `complement_doc_names` dans `analyses`, stockage `regeneration_deadline`.

**Frontend** : popup ComplementModal (drag & drop 5 docs max, suggestions + déjà analysés, progression, succès auto-fermeture 10s), bouton grisé après 7 jours, CountdownTimer, badges.

**Flux RGPD** : nouveaux PDFs supprimés après traitement.

### Autres
- MethodePage — textes corrigés (15 docs, DDT, score)
- App.tsx — préchargement HomePage (2s après load) pour iOS

---

## Modifications session 19 avril 2026 — session 2

### HomePage — Section "Pour Qui" interactive
4 boutons (Premier achat, Coup de cœur, J'hésite, Je négocie) + messages personnalisés + bandeau Pro en dessous.

### HomePage — Section "Comment ça marche" en timeline
Desktop : horizontale. Mobile : vertical.

### ProPage / ContactProPage — Profil "Marchand de bien"
4ème onglet pro ProPage, 5ème profil ContactProPage, témoignage ajouté.

### TarifsPage
- "Selon le doc" en ambre pour analyse simple (tableau comparatif)
- Bandeau Pro, sous-titre, FAQ

### Compare.tsx — Comparaison de biens complète
Radar 5 catégories, résumé financier année 1, travaux évoqués, documents analysés, verdict IA (edge function `comparer`), historique.

### Edge function `comparer` + table `comparaisons`
Déployées, RLS OK.

---

## Pages existantes (session 1 — 19 avril 2026)

### ProPage, ContactProPage, Table `contact_pro`
Pages pros et formulaire qualifié. Table avec champs profile_data JSONB, notes_admin, etc.

### Optimisations iOS TESTÉES
Navbar backdrop-blur conditionnel, Reveal CSS natif mobile, badges float désactivés, préchargement HomePage, `-webkit-touch-callout` iOS Safari.

### Navbar badge "Offre Pro"
Desktop avant séparateur auth, Mobile pleine largeur dans hamburger.

### AdminPage onglet "Demandes Pro"
Badge compteur non lues, Realtime, actions complètes.

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

1. **Fonds ALUR** — L'acheteur hérite ces montants MAIS DOIT LES REMBOURSER AU VENDEUR à la signature en sus du prix.
2. **Votes deux tours** — Art. 25 insuffisant + ≥ 1/3 voix → 2ème tour art. 24. Si adopté → ADOPTÉE.
3. **Honoraires syndic pré-état daté** — Toujours à la charge du vendeur.
4. **DPE D** = bonne performance, jamais dans vigilances.
5. **Carrez** — ne pas afficher dans les diags si section Surface Carrez dédiée.
6. **Travaux votés avant la vente** = charge vendeur, même si pas encore réalisés. NE PAS compter comme risque pour l'acheteur.
7. **Travaux évoqués non votés** = vrai risque pour l'acheteur (il paiera si voté après la signature).
8. **Loi Climat & Résilience** — DPE G interdit location depuis 2025, F en 2028, E en 2034. Gel loyers F/G depuis 2022.
9. **DPE petites surfaces** — Seuils ajustés pour < 40 m² depuis juillet 2024 (arrêté 25 mars 2024).
10. **Audit énergétique** — Obligatoire pour vente maisons/monopropriétés E/F/G. Pas les appartements en copro.
11. **Gestionnaire de copropriété** — JAMAIS confondre avec président du conseil syndical ou PDG du cabinet. Stocker `gestionnaire_fonction` uniquement si explicite dans le document.

---

## Flux technique — Comment fonctionne une analyse

1. L'utilisateur uploade ses PDFs dans Supabase Storage (bucket `analyse-temp`)
2. Le frontend appelle la edge function `analyser` avec les paths Storage + l'ID analyse
3. `analyser` télécharge les PDFs depuis Storage, les uploade vers l'API Anthropic Files, obtient des `file_ids`
4. `analyser` **supprime les PDFs de Supabase Storage** (ligne 151 de analyser/index.ts)
5. `analyser` passe le status à `files_ready` et appelle `analyser-run` via `EdgeRuntime.waitUntil`
6. `analyser-run` appelle Claude Sonnet avec les `file_ids` et le prompt système
7. Claude analyse tous les documents et retourne un JSON structuré (rapport complet ou analyse simple)
8. `analyser-run` supprime les `file_ids` de l'API Anthropic Files (RGPD)
9. Le rapport JSON est stocké dans `analyses.result` dans Supabase
10. `analyser-run` stocke `regeneration_deadline` = now + 7 jours (analyses complètes uniquement)
11. **IMPORTANT** : après le rapport, les documents originaux n'existent plus nulle part (ni Storage, ni Files API). Seul le JSON résultat est conservé.

### Flux complément (session 3)
1. L'utilisateur clique "Compléter mon dossier" (dans les 7 jours)
2. Upload 1-5 PDFs
3. `analyser` mode `complement` : vérifie deadline, lit rapport existant
4. `analyser-run` mode `complement` : fusion JSON + nouveaux docs
5. PDFs supprimés (RGPD)
6. Nouveau rapport remplace l'ancien

### Estimation coûts / stockage (session 5)
- **Stockage Supabase DB** : ~100 ko par rapport (JSON)
  - Free (500 Mo) : ~5 000 analyses possibles
  - Pro 25$ (8 Go) : ~80 000 analyses
  - Team 599$ (50 Go) : ~500 000 analyses
- **Stockage PDF** : quasi nul (PDF supprimés après analyse)
- **Coût API Claude** (vrai coût scalable) : ~0,80€ à 1,50€ par analyse complète
- **Conclusion** : le stockage n'est pas un problème court/moyen terme. Se concentrer sur coût API + acquisition clients.

---

## Architecture fichiers clés

```
src/pages/
  HomePage.tsx              ← Page d'accueil (section "Pour Qui" interactive + timeline + "Ce que vous recevez" cohérent avec /exemple ✅)
  ProPage.tsx               ← Landing page offre pro (4 profils dont marchand de bien)
  TarifsPage.tsx            ← Tarifs + FAQ + comparatif
  MethodePage.tsx           ← Notre méthode (score /20, types de docs)
  ContactPage.tsx           ← Formulaire contact général
  ContactProPage.tsx        ← Formulaire contact pro (5 profils dont marchand de bien)
  RapportPage.tsx           ← Rapport standalone (~3760 lignes) + exports RapportViewExemple/buildRapportExemple + KPI hybride A+B + onglets colorés + accordéons fluides
  ExemplePage.tsx           ← Exemple interactif Simple/Complète (refondu session 5 ✅)
  DashboardPage.tsx         ← Shell dashboard + sidebar + topbar
  AdminPage.tsx             ← Admin (users, analyses, messages, demandes pro, promos, logs)
  dashboard/
    MesAnalyses.tsx         ← Listing analyses
    HomeView.tsx            ← Tableau de bord
    NouvelleAnalyse.tsx     ← Upload + barre progression
    DocumentRenderer.tsx    ← Rendu analyse simple + accordéons fluides (session 5 ✅)
    Compare.tsx             ← Comparaison de biens (radar, financier, verdict IA, historique)

src/components/layout/
  Navbar.tsx                ← Navbar (Contact retiré du menu principal — session 5)
  Footer.tsx                ← Footer (bouton "Envoyer un message" ajouté — session 5)

src/lib/
  supabase.ts
  analyse-client.ts         ← Upload PDFs + polling (modes: complete, document, apercu, complement)
  analyses.ts               ← Types AnalyseDB + CRUD Supabase

src/index.css               ← Media queries responsive mobile (Toggle + KPI + SyndicBand + padding rapport) — session 5 ✅

supabase/functions/
  analyser/index.ts         ← Upload PDFs → Files API → déclenche analyser-run (+ mode complement)
  analyser-run/index.ts     ← Appel Claude → rapport JSON → suppression RGPD (+ prompt complement + règles juridiques + gestionnaire strict — session 5)
  comparer/index.ts         ← Comparaison IA : lit rapports JSON → appel Claude → verdict
```

---

## Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Header dark** : `#0f2d3d`
- **Accent bleu ciel (Pro)** : `#7dd3fc`
- **Investisseur violet** : `#7c3aed`
- **Marchand de bien ambre** : `#d97706`

### Palette KPI sémantique (session 5)
- **neutral** : fond blanc, bordure `#e2edf3`, icône gris `#475569`
- **ok** (vert clair) : fond `#f0fdf4`, bordure `#bbf7d0`, icône `#15803d`
- **warn** (orange clair) : fond `#fff7ed`, bordure `#fed7aa`, icône `#9a3412`
- **danger** (rouge clair) : fond `#fef2f2`, bordure `#fecaca`, icône `#991b1b`
- **info** (bleu clair) : fond `#eff6ff`, bordure `#bfdbfe`, icône `#1e40af`

---

## 🗂️ Backlog

### 🔴 Priorité haute — Prochaine session (session 6)

- [ ] **RapportPage.tsx — rendu adaptatif maison** :
  - Onglet "Logement" → renommer en **"Votre futur chez-vous"** quand `type_bien = maison`
  - Onglet "Procédures" → renommer en **"Litiges"** quand `type_bien = maison`
  - Fallback onglet Litiges maison : si aucun litige détecté → afficher liste d'exemples (servitudes mitoyenneté/passage/vue, bornage voisins, urbanisme/permis, malfaçons) avec mention "Rien détecté selon les documents fournis"
  - Enrichir prompt IA pour chercher activement ces litiges spécifiques maison dans compromis/acte
- [ ] **Fix règle pistes de négociation** : changer `applicable=true UNIQUEMENT si score < 14` → `applicable` seul (sans gate au score). L'IA décide déjà si `applicable` en fonction d'éléments chiffrables (travaux évoqués non votés, DPE E/F/G, impayés, fonds travaux insuffisant). Travaux votés = charge vendeur → PAS dans les pistes de négo.
- [ ] **ExemplePage — mock maison à ajouter** :
  - Actuellement seul un mock appartement (Lyon 6e) existe
  - Toggle appart (5 onglets) / maison (4 onglets) pour démontrer les 2 rendus
  - Cas maison : **Villeurbanne, 4P 95m², score 12,5/20** (avec DPE E, audit énergétique obligatoire)

### 🔴 Priorité haute — hors session 6

- [ ] **Tester compléter le dossier** — flux complet en vrai (upload → edge function → Claude fusionne → rapport mis à jour). Non testé en conditions réelles.
- [ ] **Tester le sélecteur type_bien en production** — vérifier que les 4 options fonctionnent, que l'IA respecte bien `typeBienDeclare`
- [ ] **Tester le syndic multi-PV** — lancer une analyse complète avec 2-3 PV d'AG successifs pour vérifier les cas stable / nouveau_elu / rotation_frequente
- [ ] **Tester la détection rigoureuse du gestionnaire** — vérifier qu'il ne confond plus avec président conseil syndical ou PDG
- [ ] **Tester rendu mobile** — vérifier que les 4 corrections responsive (Toggle, KPI, SyndicBand, padding) fonctionnent sur iPhone et Android
- [ ] **Tester onglets colorés** sur /exemple et sur un vrai rapport payant — vérifier la clarté UX

### 🟡 Priorité normale

- [ ] Tester RapportPage sur iPhone (performances)
- [ ] Tester retour accueil sur iPhone après préchargement App.tsx
- [ ] Vérifier affichage mobile tous types docs simples
- [ ] HomeView : retravailler présentation générale
- [ ] Stripe TEST → production
- [ ] Analyses bloquées > 20 min → badge "Échoué"
- [ ] Système dossiers par bien
- [ ] App.css : vestige Vite, peut être supprimé
- [ ] Optimisation coût API Claude : étudier prompt caching (réduire de 90% input tokens répétés)

### ✅ Fait (session 5 — 21 avril 2026)

- [x] **ExemplePage** — refonte complète architecture Option B (réutilisation composants RapportPage)
- [x] **ExemplePage** — mode par défaut simple, toggle animé Simple/Complète
- [x] **ExemplePage** — DemoPopup premium branché sur RapportViewExemple
- [x] **ExemplePage** — mock Lyon 6e (score 14.8/20) avec données cohérentes
- [x] **ExemplePage** — fix fonds travaux 42 000€ → 12 000€ (réaliste pour 42 lots)
- [x] **RapportPage** — exports `RapportViewExemple`, `buildRapportExemple`, `type RapportData`, `type TabId`
- [x] **RapportPage** — KPI Synthèse refondus en style hybride A+B (blancs + teintés sémantiquement)
- [x] **RapportPage** — helper `getKpiCardStyle(severity)` centralisant les 5 palettes
- [x] **RapportPage** — onglets en style coloré actif (fond plein + hover inactif) avec classes CSS dédiées
- [x] **RapportPage** — animations accordéons fluides CSS pur (grid-template-rows 0fr→1fr)
- [x] **RapportPage** — SyndicBand simplifié + affichage `gestionnaire_fonction`
- [x] **RapportPage** — SyndicBand déplacé dans accordéon "Vie de la copropriété"
- [x] **RapportPage** — KPI Copropriété : "Charges mensuelles lot" → "Budget annuel copro" (élimine doublon avec TabLogement)
- [x] **RapportPage** — TabLogement : bouton "Tout déplier/replier"
- [x] **DocumentRenderer** — 3 accordéons animés (Carrez, DiagnosticCardRow, RendererDiagCommunes)
- [x] **HomePage** — section "Ce que vous recevez" refondue pixel-perfect pour cohérence avec /exemple
- [x] **index.css** — media queries responsive mobile (Toggle → cards empilées, KPI → bascule desktop/mobile, SyndicBand → 2×2, padding rapport → 6px)
- [x] **index.css** — effet hover onglets inactifs
- [x] **Navbar** — lien Contact retiré du menu principal (dans Footer)
- [x] **Footer** — bouton "Envoyer un message" ajouté dans colonne Contact
- [x] **ContactPage** — texte Offre Pro corrigé
- [x] **analyser-run** — prompt enrichi règle stricte `gestionnaire` + `gestionnaire_fonction` (à déployer Supabase Dashboard)

### ✅ Fait (session 4 partie 1 — 20 avril 2026)

- [x] Nouvelle étape "Type de bien" dans NouvelleAnalyse (4 options)
- [x] Colonne `type_bien_declare` dans table analyses (SQL migration)
- [x] Type `TypeBien` + propagation param dans toute la chaîne frontend → edge functions
- [x] Prompt IA enrichi pour respecter `typeBienDeclare` (avec fallback si contradictoire)
- [x] Fiabilisation statut syndic — analyse simple (DocumentRenderer + prompt PV_AG)
- [x] Fiabilisation statut syndic — analyse complète multi-PV (RapportPage SyndicBand + prompt rapport complet)
- [x] Règles anti-alarmisme : changement de syndic = neutre/positif sauf rotation fréquente
- [x] NouvelleAnalyse — largeur 900px centrée sur toutes les étapes
- [x] NouvelleAnalyse — bouton "Lancer l'analyse" renommé + remonté sous zone upload

### ✅ Fait (session 3 — 20 avril 2026)

- [x] Prompt IA enrichi : loi Climat & Résilience, DPE petites surfaces, audit énergétique
- [x] Compléter le dossier — backend complet (analyser + analyser-run + SQL)
- [x] Compléter le dossier — frontend complet (popup, timer, badges, bouton grisé)
- [x] regeneration_deadline stockée dans analyser-run
- [x] MethodePage — textes corrigés (15 docs, DDT, score)
- [x] App.tsx — préchargement HomePage pour iOS

### ✅ Fait (session 2 — 19 avril 2026)

- [x] HomePage — Section "Pour Qui" interactive (4 boutons + messages personnalisés)
- [x] HomePage — Section "Comment ça marche" refaite en timeline
- [x] ProPage — Ajout profil "Marchand de bien" (4ème onglet)
- [x] ContactProPage — Ajout profil "Marchand de bien" (5ème carte)
- [x] TarifsPage — Tableau comparatif : "Selon le doc" en ambre pour analyse simple
- [x] TarifsPage — Bandeau Pro mis à jour (4 profils, supprimé "volumes illimités")
- [x] TarifsPage — Sous-titre simplifié
- [x] TarifsPage — FAQ élargie (appartements + maisons)
- [x] Compare.tsx — Radar des 5 catégories
- [x] Compare.tsx — Résumé financier année 1
- [x] Compare.tsx — Travaux évoqués non votés
- [x] Compare.tsx — Documents analysés par bien
- [x] Compare.tsx — Verdict IA via edge function comparer
- [x] Compare.tsx — Historique des comparaisons + suppression
- [x] Edge function `comparer` déployée sur Supabase
- [x] Table `comparaisons` créée dans Supabase
- [x] Optimisations iOS déployées et testées
