# VERIMO — Contexte projet complet — 27 avril 2026 (après sessions 8 à 15)

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

## 🆕 Session 14 — 24 avril 2026 — Redesign dashboard + corrections prompt analyse + comparaison

### 🎯 Résumé global
Gros chantier UX/UI : redesign sidebar teal, page Mes Analyses style tableau enrichi, page Compare style premium C3, fusion pré-état daté dans Finances du lot, corrections majeures du prompt d'analyse (fonds travaux lot vs copro, surface Boutin, points de vigilance dynamiques, PV AG manquants).

---

### A. Sidebar — Redesign teal Verimo

- **Fond** : `#0e3a4a` (teal foncé Verimo)
- **Logo** : texte "verimo" en blanc (pas d'image), fontSize 20, fontWeight 800
- **Items nav** : opacité 0.75 pour inactifs (avant 0.5), fontWeight 500 (avant 400). Actif = blanc pur, fontWeight 700, barre latérale teal vif `#5dbfe0` à gauche
- **Crédits** : sous le CTA "Nouvelle analyse" comme avant, mais sur fond teal
- **CTA** : bouton "Nouvelle analyse" en `#2a7d9c`

### B. Page Mes Analyses — Style tableau enrichi

- **3 sections séparées** : "Analyses complètes" (pastille navy) / "Analyses simples" (pastille teal) / "Aperçus" (pastille amber)
- **Section header** : pastille colorée + label + compteur + ligne séparatrice
- **Blocs blancs** avec bordures fines entre les lignes
- **Score ring SVG** inline (44px) à gauche de chaque analyse complète
- **Pill recommandation** (Acheter/Négocier/Éviter) + nombre de docs + date
- **Boutons** : Rapport + Partager + Supprimer à droite
- **Mode sélection** : checkboxes pour suppression groupée
- **Responsive mobile** : score ring + texte horizontal, boutons pleine largeur en dessous

### C. Page Compare — Redesign style C3 premium

- **Stepper dots** en haut à droite : ● ● ○ avec compteur "2/3" dynamique
- **Cards biens** avec bande latérale 76px : gradient teal foncé quand sélectionné (score blanc 24px + check teal), fond gris quand non sélectionné (score coloré)
- **Badge recommandation** inline sur chaque card
- **Historique** avec cercles de scores chevauchants (style avatar group) : bordure colorée selon note, cercle pointillé + "?" pour biens supprimés, opacity réduite
- **Bouton "Consulter"** en gradient teal pour l'historique
- **Titres courts** dans l'historique (coupés au premier segment d'adresse)
- **Historique visible même avec 0 ou 1 analyse complète** (avant : bloqué par return immédiat)

### D. RapportPage — Fusion pré-état daté + couleurs onglets

- **Onglet Logement** : couleur par défaut teal (`#2a7d9c`) au lieu de vert, rouge uniquement si alerte diagnostic
- **Section "Pré-état daté" supprimée** en tant qu'AccordionSection séparé
- **Tout fusionné dans "Finances de votre lot"** avec mention `(source : pré-état daté)` en italique sur chaque bloc
- **Bandeau source** bleu en haut quand pré-état daté détecté
- **Badge** affiche "Pré-état daté du XX/XX/XXXX" quand détecté
- **Contenu fusionné** : charges futures, fonds travaux à verser au vendeur, situation vendeur, santé financière copro, historique N-1/N-2 — tout dans un seul accordion
- **Tooltip charges mensuelles** enrichi : "peut inclure des provisions hors budget (appels exceptionnels pour travaux votés)"

### E. RapportComparaisonPage — Améliorations

- **KPI année 1** : label "dépenses estimées année 1 :" au lieu de "année 1 :"
- **Résumé financier + Travaux évoqués** : ouverts par défaut sur PC (`desktopOpen` prop sur Accordion)
- **Travaux évoqués** : texte passé de 12.5px à 14px sur desktop
- **Padding mobile** : réduit à 8px sur les côtés (classe `rcp-body`)

### F. Edge function analyser-run — Corrections majeures du prompt

#### F1. Fonds travaux lot vs copro (RÈGLE CRITIQUE)
- `finances.fonds_travaux` = cotisation annuelle copro (source PV AG)
- `pre_etat_date.fonds_travaux_alur` = capital lot à rembourser au vendeur (source pré-état daté)
- Si SEUL un pré-état daté fourni : `finances.fonds_travaux` reste null, `fonds_travaux_statut = "non_mentionne"` (PAS "insuffisant", PAS de pénalité scoring)

#### F2. pre_etat_date.present obligatoire
- Si un doc PRE_ETAT_DATE est dans `documents_analyses`, `pre_etat_date.present` DOIT être `true`
- Sans ce flag toute la section finances du lot (fonds travaux, historique N-1/N-2, charges futures) est INVISIBLE

#### F3. Historique N-1/N-2 obligatoire
- Si `present=true`, toujours remplir `historique_charges` depuis l'annexe du pré-état daté
- `budget_appele` = quote-part appelée budget prévisionnel
- `charges_reelles` = quote-part réelle (après clôture)
- `provisions_hors_budget` = quote-part appelée hors budget prévisionnel

#### F4. Surface Boutin
- Si `carrez.surface_type = "boutin"` : point de vigilance auto dans DDT ET synthèse
- Message : "Surface loi Boutin détectée (location), pas de surface Carrez (vente). Exigez un mesurage Carrez."

#### F5. Points de vigilance — seuils dynamiques
- Budget copro > 80 000€ → seuil 5 000€
- Budget copro ≤ 80 000€ → seuil 3 000€
- Les éléments sous le seuil restent dans les sections détaillées, pas remontés en synthèse
- **Exclusions explicites** : boîtes aux lettres, peinture, interphones, digicodes, nettoyage, VMC individuelle, serrurerie, moquette, éclairage couloirs

#### F6. PV AG manquants
- Si < 3 PV fournis : ajout dans `documents_manquants` ("Il manque X PV d'AG sur les 3 obligatoires")
- 0 PV → "PV des 3 dernières AG (obligatoires)"
- 1 PV → "Il manque 2 PV d'AG sur les 3 obligatoires"
- 2 PV → "Il manque 1 PV d'AG sur les 3 obligatoires"

### G. Edge function comparer — Correction verdict

- **Règle titre_verdict** : interdit d'utiliser "malgré un écart de X points" quand le bien recommandé a le meilleur score
- Formulations imposées : "avec X points d'avance", "se distingue avec un score supérieur"
- "malgré" réservé UNIQUEMENT au cas d'exception (bien recommandé avec score inférieur)

---

### Fichiers modifiés session 14

**Frontend (à pousser sur GitHub)** :
```
src/pages/DashboardPage.tsx             → Sidebar teal + logo texte + nav visible
src/pages/dashboard/MesAnalyses.tsx     → Style tableau enrichi, 3 sections, score ring
src/pages/dashboard/Compare.tsx         → Redesign C3 premium + historique accessible 0/1 analyse
src/pages/RapportPage.tsx               → Fusion pré-état daté dans Finances lot + onglet Logement teal + tooltip charges
src/pages/RapportComparaisonPage.tsx    → KPI label + desktopOpen + texte travaux + padding mobile
```

**Backend (à déployer sur Dashboard Supabase)** :
```
supabase/functions/analyser-run/index.ts → 6 corrections prompt (fonds travaux, Boutin, vigilance, PV AG, pre_etat_date.present, historique)
supabase/functions/comparer/index.ts     → Règle titre_verdict anti-"malgré"
```

---

## 🆕 Session 13 — 23 avril 2026 (soir) — Refonte complète AdminPage + responsive mobile dashboard

### 🎯 Résumé global
Grosse session sur l'espace admin : refonte des 3 onglets principaux (Vue d'ensemble, Statistiques, Journal des paiements) avec clarification UX, distinction claire entre CA encaissé et analyses lancées, ajout d'un bloc "CA par catégorie" dédié aux Packs. En parallèle, refonte du responsive mobile sur le dashboard client (HomeView, Support, Aide) pour que tout prenne la largeur disponible.

---

### A. AdminPage — Refonte des 3 onglets principaux

**Principe directeur** : séparer clairement trois concepts qui étaient mélangés :
- **CA encaissé** (argent Stripe réel, basé sur la table `payments`)
- **Analyses lancées** (travail fourni, basé sur la table `analyses`, payantes + gratuites)
- **Crédits offerts** (acquisition via codes promo, indicateur distinct)

#### 🏠 Onglet "Vue d'ensemble" — photo du mois en cours

Filtre non modifiable : toujours sur **le mois courant** (titre dynamique "Activité de ce mois-ci — avril 2026").

Structure finale :
1. **Bloc hero** : CA de {mois courant} en gros + comparaison mois dernier ("↑ +X€ vs mois dernier (Y€)" ou "Premier mois de CA" si pas de CA avant).
2. **3 cartes "Ce mois"** :
   - NOUVEAUX CLIENTS : X inscrits ce mois
   - **ANALYSES LANCÉES PAR LES UTILISATEURS** : X ce mois, avec détail **Simple : X · Complète : X** uniquement (PAS de Pack 2/3 car les analyses individuelles ont toujours `type='document'` ou `'complete'`, jamais `'pack2'` ou `'pack3'`)
   - TICKET MOYEN : X€ par paiement payant
3. **Bloc "💰 CA par catégorie ce mois"** (NOUVEAU) : 4 cartes avec le CA ventilé par produit Stripe :
   - Analyse Simple · Analyse Complète · Pack 2 Biens · Pack 3 Biens
   - Chaque carte affiche le montant et le nombre de ventes
   - Classification basée sur le parsing de la description du paiement (`desc.includes('pack 3')`, etc.)
4. **Bloc "À lire"** : messages + demandes pro non lus (orange si > 0, vert "Tout est à jour ✓" sinon), avec boutons d'action directs
5. **Actions rapides** : grille de boutons (avec "Paiements" renommé en "Journal des paiements")

#### 📊 Onglet "Statistiques" — analyse historique filtrable

Filtres période : **7j / 30j / 3m / 12m / Depuis le début / Personnalisé** (ajout "Depuis le début" en plus des filtres existants). Titre dynamique "Analyse de l'activité sur les 30 derniers jours" / "depuis le début" / etc.

Structure finale :
1. **Bloc "💰 Chiffre d'affaires"** : CA encaissé (gros bloc vert dégradé) + Ticket moyen (paiements payants uniquement)
2. **Bloc "👥 Nouveaux clients et analyses lancées"** :
   - NOUVEAUX CLIENTS
   - **ANALYSES LANCÉES PAR LES UTILISATEURS** avec uniquement Simple + Complète, mention "dont X gratuites" si applicable (analyses sans `stripe_payment_id`)
3. **Bloc "💰 CA par catégorie"** (NOUVEAU) : même logique que Vue d'ensemble mais filtrable par période, 4 cartes (Simple / Complète / Pack 2 / Pack 3)
4. **Bloc "🎁 Crédits offerts"** (conditionnel — affiché seulement si > 0) : crédits Simple + Complète offerts via codes promo, indicateur d'acquisition
5. **Graphique CA hebdo** — 8 dernières semaines (barres dégradé bleu)
6. **Graphique inscriptions hebdo** — 8 dernières semaines (barres dégradé violet) + total sur 8 semaines

#### 💰 Onglet "Journal des paiements" (anciennement "Paiements")

**Renommé** pour clarifier son rôle : liste détaillée de toutes les transactions, pas de doublons avec Stats.

Changements :
- Titre : "Journal des paiements"
- Sous-titre : "Historique détaillé de toutes les transactions Stripe et crédits offerts"
- **Suppression des 4 KPIs en haut** (Total période / Paiements / Crédits gratuits / Éligibles remboursement) — doublon avec Stats désormais
- Filtre "⚠ Éligibles remboursement" renommé en "⏱ Remboursables (< 14j)"
- Liste détaillée inchangée : filtres période/type, recherche, export CSV, lien Stripe direct

---

### B. Fix RLS admin — Admin voit toutes les données

**Problème** : l'admin (hello@verimo.fr) ne voyait que ses propres analyses/paiements depuis l'interface via Supabase JS car les policies RLS étaient strictement `auth.uid() = user_id`.

**Fix** : création d'une fonction `public.is_admin()` SECURITY DEFINER qui check `role='admin'` sur la table `profiles`, puis ajout de policies additives pour admin :
- SELECT / UPDATE / DELETE sur `analyses`
- SELECT / UPDATE sur `profiles`
- SELECT sur `payments` (+ activation RLS `payments` qui ne l'était pas)

**Migration SQL** appliquée : `supabase-migration-admin-policies.sql` (exécutée par Alex dans le SQL editor Supabase).

**Sécurité vérifiée** : un user normal (non-admin) voit toujours uniquement ses propres données. Les policies additives ne s'activent que si `is_admin() = true`.

---

### C. Fix webhook Stripe — lien direct vers le paiement

**Problème** : dans AdminPage, le bouton "Ouvrir dans Stripe" sur un paiement ouvrait la liste filtrée Stripe au lieu du paiement spécifique, car le champ `stripe_payment_id` n'était pas rempli.

**Fix** : modification de la edge function `stripe-webhook` directement dans le dashboard Supabase. Extraction du `paymentIntentId` depuis `session.payment_intent` (gestion `typeof string ? : .id`) et insertion dans `payments.stripe_payment_id`.

⚠️ **Les anciens paiements** n'ont pas ce champ rempli (antérieurs au fix), ils continuent d'ouvrir la liste Stripe. Seuls les nouveaux paiements auront le lien direct.

---

### D. Fix recherche globale ⌘K admin

**Problème** : la recherche globale (Cmd+K) échouait silencieusement et renvoyait toujours vide, même pour des adresses qui existaient clairement en base.

**Cause** : la requête utilisait `.or('address.ilike.%q%,adresse_bien.ilike.%q%,title.ilike.%q%')` mais la colonne `adresse_bien` **n'existe pas** dans la table `analyses` (le vrai nom c'est `address`). Supabase remontait une erreur silencieuse sur le champ inexistant et toute la requête échouait.

**Fix** : retrait de `adresse_bien` de la requête `.or()`. Requête finale : `.or('address.ilike.%q%,title.ilike.%q%')`.

**Fix secondaire** : le clic sur un résultat "analyse" ouvre désormais la fiche détail de l'analyse (via `focusAnalysisId` passé à AnalysesTab) au lieu de la fiche user.

---

### E. Responsive mobile — Dashboard client

**Problème identifié sur plusieurs pages** : sur mobile, le contenu n'utilisait pas toute la largeur de l'écran. Gros espace vide à gauche, cartes écrasées, texte coupé.

**Cause racine** : dans `DashboardPage.tsx`, le `<main>` avait un padding fixe de `28px 24px`. Sur un écran de 375px, 48px bouffés par les marges = ~13% d'écran perdu. Et les composants internes avaient leur propre padding en plus.

#### DashboardPage.tsx — Fix structurel global

Ajout de la classe `dashboard-main` sur le `<main>` et règles CSS mobile :
```css
@media (max-width: 767px) {
  .dashboard-main { padding: 16px 12px !important; }
  /* Force tous les conteneurs enfants à prendre 100% */
  .dashboard-main > div,
  .dashboard-main > section {
    max-width: 100% !important;
    width: 100% !important;
  }
  /* Réduire le padding interne des grosses cards */
  .dashboard-main [style*="padding: '28px'"],
  .dashboard-main [style*="padding:28px"] {
    padding: 18px !important;
  }
}
```

**Topbar mobile agrandie** de 54px → **62px** pour meilleure ergonomie au pouce :
- Icône menu ☰ : 20px → **24px**
- Titre page : 14px → **15px gras**
- Padding : 12px → 14px

#### HomeView.tsx — Stats en 1 colonne sur mobile

Les 3 cartes (Total analyses / Dernière analyse / Crédits) étaient en 2 colonnes sur mobile, ce qui écrasait "Dernière analyse" avec l'adresse coupée `...`.

Fix :
- `@media (max-width: 640px)` → `.stats-grid { grid-template-columns: 1fr !important }` (1 seule colonne)
- Adresse : retrait de `whiteSpace: nowrap` + `textOverflow: ellipsis`, remplacé par `wordBreak: break-word` → l'adresse wrappe sur 2 lignes au lieu d'être coupée

#### Support.tsx — FAQ + formulaire contact

Problème : le bloc "Comment pouvons-nous vous aider ?" avait icône à gauche + texte à droite (flex horizontal), ce qui écrasait le texte sur mobile. Les réponses FAQ dépliées avaient un `padding-left: 61px` (pour aligner le texte sous le titre, pas sous l'icône), ce qui donnait l'impression que le texte commençait au milieu.

Fix :
- Ajout classe `support-header` sur le bloc flex : `flex-direction: column !important` sur mobile + padding réduit (18px/18px au lieu de 22px/26px)
- Ajout classe `faq-answer` sur les réponses dépliées : `padding: 0 14px 14px 14px !important` sur mobile (au lieu de `0 15px 14px 61px`)

#### Aide.tsx — Page "Aide & Méthode"

Plusieurs corrections sur 3 blocs distincts :

1. **Bloc "💡 Conseil important Verimo"** : restructuré en 2 zones
   - Ligne 1 : icône 💡 + titre "💡 Conseil important Verimo" côte à côte (classe `conseil-title-row`)
   - Ligne 2 : description pleine largeur en dessous (classe `conseil-desc`)
   - Padding card réduit 24/28px → 18/16px sur mobile (classe `aide-card-padding`)

2. **Bloc "Comment nous calculons la note /20"** — sous-bloc bleu "On démarre toujours de la note maximale" :
   - Icône 20 réduite sur mobile : 48×48 → **38×38** (classe `demarre-20`)
   - Titre reste à côté du 20
   - Description pleine largeur en dessous via `flex-wrap: wrap` + `flexBasis: 100%` sur la description (classes `demarre-block`, `demarre-text`, `demarre-desc`)

3. **Blocs "Échelle de notation"** (17-20, 14-16, etc.) :
   - Restructuration en 3 enfants flex directs : `scale-range`, `scale-label`, `scale-desc`
   - Le parent a `flex-wrap: wrap`, donc la description (avec `flex-basis: 100%`) passe toujours sur une nouvelle ligne
   - Ligne 1 : `[17-20]` + `[Bien irréprochable]` côte à côte
   - Ligne 2 : description pleine largeur
   - Fonctionne sur desktop ET mobile avec le même markup

---

### Fichiers modifiés session 13

**Frontend (à pousser sur GitHub)** :
```
src/pages/AdminPage.tsx                 → Refonte DashboardTab + StatsTab + PaymentsTab, retrait KpiCard / PLAN_PRICES / TrendingUp inutilisés
src/pages/DashboardPage.tsx             → Classe .dashboard-main + règles CSS mobile responsive + topbar agrandie (62px)
src/pages/dashboard/HomeView.tsx        → Stats en 1 colonne mobile + adresse wrap
src/pages/dashboard/Support.tsx         → Classes support-header + faq-answer + règles CSS mobile
src/pages/dashboard/Aide.tsx            → Refonte 3 blocs (conseil, démarre, scale) + règles CSS mobile
```

**Backend (déjà appliqué en prod)** :
```
supabase-migration-admin-policies.sql   → Fonction is_admin() + policies admin sur analyses/profiles/payments
supabase/functions/stripe-webhook       → Extraction paymentIntentId dans payments.stripe_payment_id
```

---

### Règles UX apprises cette session

1. **"CA encaissé" ≠ "Analyses lancées"** : l'argent Stripe et le travail fourni sont 2 métriques distinctes, ne JAMAIS les mélanger dans un même bloc.
2. **Pack 2 / Pack 3 ne sont pas des types d'analyses** : ce sont des produits de paiement qui donnent des crédits Complète. Les analyses individuelles ont toujours `type='document'` ou `'complete'`. Les Packs n'apparaissent donc QUE dans les blocs "CA par catégorie" (vente), jamais dans les blocs "Analyses lancées" (consommation).
3. **Analyses gratuites** : analyses sans `stripe_payment_id` lié = faites via code promo ou crédit offert. Les compter dans "Analyses lancées" avec mention "dont X gratuites", mais pas dans le CA.
4. **Mobile : force 100% de largeur** : le pattern `flex horizontal avec icône + texte` écrase toujours le texte sur mobile. Règle simple : sur mobile, icône AU-DESSUS du titre (classe avec `flex-direction: column`), ou alors icône + titre côte à côte MAIS description pleine largeur en dessous via `flex-wrap`.

---



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
18. **Fonds travaux lot ≠ copro** (session 14) — `finances.fonds_travaux` = cotisation annuelle copro (PV AG). `pre_etat_date.fonds_travaux_alur` = capital lot à rembourser au vendeur. NE JAMAIS confondre. Si seul pré-état daté fourni, `finances.fonds_travaux` reste null.
19. **fonds_travaux_statut "non_mentionne"** (session 14) — Si aucune info sur le fonds travaux copro, `fonds_travaux_statut = "non_mentionne"` et AUCUNE pénalité de scoring. Pénalité uniquement si "insuffisant" ou "absent" (document dit explicitement 0€ ou pas de fonds).
20. **Surface Boutin** (session 14) — Si `carrez.surface_type = "boutin"`, point de vigilance auto : "Surface loi Boutin détectée, exigez un mesurage Carrez". Verimo est focus achat, pas location.
21. **Points de vigilance — seuils dynamiques** (session 14) — Budget copro > 80k€ → seuil 5 000€. Budget ≤ 80k€ → seuil 3 000€. Éléments sous le seuil = sections détaillées uniquement, pas en synthèse. Exclusions : boîtes aux lettres, peinture, interphones, etc.
22. **PV AG manquants** (session 14) — Si < 3 PV fournis, ajouter dans `documents_manquants` le nombre manquant. La loi oblige 3 PV.

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
  RapportPage.tsx                    ← ~4600 lignes (session 14 : fusion pré-état daté)
  RapportComparaisonPage.tsx         ← ~1270 lignes (session 14 : desktopOpen + padding mobile)
  ExemplePage.tsx
  DashboardPage.tsx                  ← Shell dashboard + sidebar teal (session 14)
  AdminPage.tsx
  dashboard/
    HomeView.tsx                     ← + DashboardLoader
    MesAnalyses.tsx                  ← Style tableau enrichi, 3 sections, score ring (session 14)
    NouvelleAnalyse.tsx
    DocumentRenderer.tsx
    Compare.tsx                      ← Redesign C3 premium + historique accessible 0/1 analyse (session 14)
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
  analyser-run/index.ts              ← Claude → JSON → recalculerCategories → RGPD (~1260 lignes, session 14 : 6 corrections prompt)
  comparer/index.ts                  ← Schéma V2 + analyse_croisee + règle titre_verdict (~270 lignes)
```

---

## Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Teal sidebar** : `#0e3a4a` (session 14)
- **Teal accent sidebar** : `#5dbfe0` (session 14)
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


---

## 🆕 Session 15 — 27 avril 2026 — Messaging temps d'analyse, page Pro, remboursement backend, alertes admin

### 🎯 Résumé global
Harmonisation du messaging "30 secondes" vs "quelques minutes" sur tout le site (7 fichiers), refonte des textes de la page Pro (4 onglets métier), remboursement automatique des crédits côté backend en cas d'échec, popup modal d'erreur frontend, nouvel onglet "Alertes système" dans l'admin.

---

### A. Messaging temps d'analyse — harmonisation complète

**Règle établie :**
- **Analyse simple** (1 document, 4,90€) → "30 secondes*" — c'est vrai pour un PDF natif
- **Analyse complète** (multi-documents, 19,90€) → "quelques minutes*" — prend 1 à 5 min selon le nombre de docs
- **Disclaimers unifiés** sur toutes les pages : "Analyse simple : résultat en ~30 secondes (1 document PDF natif). Analyse complète : généralement prête en quelques minutes selon le nombre de documents."
- **Témoignages** : non touchés (restent tels quels)

**Fichiers modifiés (7) :**
- `HomePage.tsx` — 2 disclaimers mis à jour, FAQ réécrite, "Voici ce que Verimo vous fournit en quelques minutes*"
- `ProPage.tsx` — hero "rapport en quelques minutes*", investisseur/marchand/HowItWorks modifiés, StatsRibbon label "par document", FAQ réécrite, disclaimer en bas
- `ExemplePage.tsx` — CTA final "en quelques minutes*", toggle agrandi (padding 20px/42px, minWidth 290), prix retirés du toggle (garde "Un document"/"Dossier complet"), sous-texte sur 2 lignes avec `<br />`
- `TarifsPage.tsx` — disclaimer mis à jour
- `MethodePage.tsx` — "Score /20 en quelques minutes*" (×2)
- `dashboard/Aide.tsx` — "Rapport prêt en quelques minutes*"
- `dashboard/HomeView.tsx` — "rapport complet en quelques minutes*"

**Pages non modifiées (accroches "30s" gardées volontairement) :**
- SignupPage.tsx — "Créez votre compte en 30 secondes" (parle du compte, pas de l'analyse)
- dashboard/Tarifs.tsx — "Résultat en 30 secondes*" sur la carte Analyse Simple (contexte correct)

### B. Page Pro — refonte textes et UX

- **Boutons KPI hero cliquables** : les 4 cartes (Agent, Investisseur, Marchand, Notaire) scrollent vers la section #profils et activent le bon onglet. State `activeProfileIdx` remonté dans ProPage, passé en props à HeroSection et ProfilesSection.
- **Agent immo** : description reformulée — "partagez-lui un rapport complet sur le bien" (plus de mention copropriété)
- **Marchand de bien** : benefit "Passez à l'échelle" — "Screenez des dizaines de biens par semaine. Verimo fait la lecture pour vous, vous ne gardez que les bonnes affaires."
- **Notaire** — tout revu :
  - Headline : "Des dizaines de documents par dossier. Verimo les synthétise pour vous."
  - Description : accent sur le gain de temps concret pour préparer les dossiers
  - Benefits : "Lecture accélérée", "Rien ne passe entre les mailles", "Un service en plus pour vos clients", "Conforme & sécurisé"
- **3 badges CTA final supprimés** (Données chiffrées / Conforme RGPD / Réponse sous 24h) — redondant avec le sous-texte

### C. Remboursement automatique backend — analyser-run

**Problème résolu :** le crédit était débité avant l'analyse (côté frontend) et remboursé côté frontend uniquement. Si l'utilisateur ferme son navigateur pendant l'analyse et que l'analyse échoue, le crédit était perdu.

**Solution :** 3 nouvelles fonctions dans `analyser-run` :
- `refundCredit(analyseId, supabaseAdmin)` — recrédite le bon type (simple/complète) en lisant `analyses.user_id` et `analyses.type`
- `insertSystemAlert(supabaseAdmin, params)` — insère une alerte dans la table `system_alerts`
- `handleAnalyseFailure(supabaseAdmin, analyseId, errorType, userMessage, alertTitle, alertSeverity)` — centralise : rembourser + alerter + marquer failed

**7 points de "failed"** dans analyser-run utilisent maintenant `handleAnalyseFailure` (les deux fonctions runAnalyseWithData et runAnalyse legacy).

**Gestion 401/403 ajoutée :** si le solde API Anthropic est à 0, pas de retry (inutile), alerte "critical" pour l'admin, message utilisateur neutre sans mention d'IA.

**Suppression RGPD améliorée :** vérification du statut HTTP du DELETE (avant : silencieux en cas d'échec).

### D. Popup modal erreur — NouvelleAnalyse.tsx

**Avant :** bandeau rouge "Fichier non accepté" pour toutes les erreurs (même rate limit).
**Après :** popup modal centré avec :
- Icône warning orange
- Titre "Analyse interrompue"
- Message d'erreur adapté au type de problème
- Badge vert "Votre crédit analyse [simple/complète] a été remboursé automatiquement"
- Bouton "Compris" + croix pour fermer
- Le bandeau rouge reste pour les erreurs de validation fichier (mauvais format, etc.)

### E. Onglet "Alertes système" — AdminPage.tsx

Nouvel onglet dans l'admin avec icône AlertTriangle :
- Filtres : Non résolues / Critiques / Toutes
- Chaque alerte : sévérité (🔴🟡🔵), titre, message, date, analyse concernée, type crédit, remboursement effectué
- Boutons "Résoudre" par alerte et "Tout résoudre"
- Alerte critique rouge pour solde API épuisé
- Table Supabase `system_alerts` (migration SQL fournie)

### F. Architecture — analyse des performances

**Constat (via logs Supabase) :**
- Uploads 11 docs : ~9 secondes (séquentiel, déjà rapide) → pas besoin de paralléliser
- Appel Claude 11 docs : ~5 minutes → c'est le vrai goulot, incompressible
- Paralléliser les uploads ne gagnerait que ~6-7 secondes sur 5 minutes → pas pertinent

**Rate limits (Niveau 2 API Anthropic) :**
- 1000 requêtes/minute, 450K tokens d'entrée/minute → très large, pas de risque
- Queue / jitter non nécessaires pour la concurrence
- **Limite réelle : 500$/mois de dépenses** — plafond du Niveau 2, non modifiable sans passer au Niveau 3 (400$ de dépôt cumulé requis)

**Architecture analyser / analyser-run :** bien pensée — analyser fait les uploads et répond immédiatement au frontend, analyser-run tourne en background via EdgeRuntime.waitUntil. Pas de timeout HTTP.

---

### Fichiers modifiés session 15

**Frontend (à pousser sur GitHub) :**
```
src/pages/HomePage.tsx              → Disclaimers + FAQ temps d'analyse
src/pages/ProPage.tsx               → Textes onglets métier + boutons KPI cliquables + messaging temps
src/pages/ExemplePage.tsx           → Toggle agrandi sans prix + CTA 2 lignes + messaging temps
src/pages/TarifsPage.tsx            → Disclaimer temps d'analyse
src/pages/MethodePage.tsx           → "quelques minutes" au lieu de "30 secondes"
src/pages/dashboard/Aide.tsx        → "quelques minutes"
src/pages/dashboard/HomeView.tsx    → "quelques minutes"
src/pages/dashboard/NouvelleAnalyse.tsx → Popup modal erreur + state analyseError
src/pages/AdminPage.tsx             → Onglet "Alertes système" + suppression alertsCount inutilisé
```

**Backend (à déployer sur Dashboard Supabase) :**
```
supabase/functions/analyser-run/index.ts → refundCredit + insertSystemAlert + handleAnalyseFailure + gestion 401/403
```

**Migration SQL (à exécuter dans Supabase SQL Editor) :**
```
supabase-migration-system-alerts.sql → Table system_alerts + RLS + index
```


## 🗂️ Backlog

### 🔴 Priorité haute

- [ ] **Supprimer le flow aperçu gratuit** — Retirer complètement le mode aperçu (step apercu, lancerApercu, bandeau offre gratuite, createApercu, markFreePreviewUsed, modes apercu_complete/apercu_document). Impacte ~12 fichiers : NouvelleAnalyse.tsx, analyses.ts, analyse-client.ts, MesAnalyses.tsx, HomeView.tsx, DashboardPage.tsx, AdminPage.tsx, App.tsx, useAnalyses.ts, types/index.ts, Tarifs.tsx, analyser-run. La page Exemple suffit comme démo. Le produit d'appel à 4,90€ remplace l'aperçu.
- [ ] **Veille réglementaire — mise à jour prompt analyser-run** — Claude connaît les lois jusqu'à mai 2025. Vérifier sur Légifrance et ajouter au prompt : DPE collectif obligatoire toutes copros (<50 lots depuis jan 2026), PPT obligatoire transmis à l'acquéreur dès compromis (jan 2026), décret n°2025-1292 du 22/12/2025 (emprunt collectif dans état daté, travaux isolation parties communes par copropriétaire), mise à jour obligatoire RCP (loi ÉLAN). Vérifier chaque point sur sources officielles avant d'ajouter.
- [ ] **Prompt caching API Anthropic** — Le prompt système fait 700+ lignes, identique à chaque appel. Avec le caching, ~90% d'économie sur ces tokens. Critique vu le plafond de 500$/mois (Niveau 2). Implémenter en même temps que la mise à jour réglementaire du prompt.
- [ ] **Barre de progression NouvelleAnalyse.tsx** — Monte trop vite à 87-88% puis stagne. La logique simulée (lignes 222-226) rattrape le `progress` réel trop rapidement. Revoir les paliers pour montée progressive.
- [ ] **Bouton SOS / Signaler un problème** dans le topbar — Remplacer la cloche (inutile) par un bouton d'assistance rapide. Format à définir : formulaire email, WhatsApp, ou les deux.
- [ ] **Bug IA recommandation incorrecte** — Claude recommande parfois un bien avec score inférieur sans facteur bloquant réel. Fix en 2 temps (Option 3 validée) :
  1. Durcir le prompt backend : forcer Claude à expliciter les scores avant la décision
  2. Validation automatique côté edge function `comparer` : si `bien_recommande_idx` ≠ meilleur score ET aucun facteur bloquant détectable, forcer correction
- [ ] **Passer API Anthropic au Niveau 3** — Déposer 400$ cumulés pour débloquer un plafond mensuel plus élevé. Configurer alerte à 80% dans la console Anthropic.

### 🟡 Priorité normale

- [ ] **UX suppression mobile MesAnalyses** — Tap accidentel possible, bouton trop petit ? À investiguer et améliorer.
- [ ] **Analyse croisée comparaison — meilleur rendu visuel** — Structurer le bloc analyse croisée en sous-sections visuelles (forces/faiblesses par bien, barres comparatives) au lieu d'un bloc de texte.
- [ ] **Corriger manuellement le bien 2 (167 Vaugirard) en base Supabase** — Déplacer fonds travaux 146,80€ de `finances.fonds_travaux` vers `pre_etat_date.fonds_travaux_alur` + mettre `pre_etat_date.present = true`. Ou relancer l'analyse.
- [ ] **RapportPage — rendu adaptatif maison** : onglet "Logement" → "Votre futur chez-vous" / onglet "Procédures" → "Litiges"
- [ ] **Nouveau champ à l'upload** : prix de vente + surface Carrez (saisis manuellement)
- [ ] **Fix règle pistes de négociation** — `applicable=true` sans gate au score
- [ ] **ExemplePage — mock maison** — Villeurbanne, 4P 95m², score 12,5/20, DPE E
- [ ] **Pour l'offre Pro** : export PDF blanc label, annotations perso, marge négociation, comparatif marché, export Excel, partage sécurisé

### 🟡 Priorité normale — Tests

- [ ] Tester les nouvelles règles prompt en relançant une analyse avec pré-état daté
- [ ] Tester la page Compare redesign sur mobile
- [ ] Tester la fusion pré-état daté dans Finances du lot (données N-1/N-2 visibles)
- [ ] Stripe TEST → production
- [ ] **Bouton "Marquer comme remboursée"** dans admin
- [ ] **Synchro `last_sign_in_at`** auth.users → profiles

### ✅ Fait récemment (session 14 — 24 avril 2026)

- [x] **Sidebar teal Verimo** : fond #0e3a4a, texte blanc, logo texte "verimo", nav plus visible (opacité 0.75, fontWeight 500)
- [x] **MesAnalyses redesign** : style tableau enrichi, 3 sections (Complètes/Simples/Aperçus), score ring inline, mode sélection groupée
- [x] **Compare redesign C3** : bande latérale gradient, stepper dots, cercles scores chevauchants, historique accessible avec 0/1 analyse
- [x] **Fusion pré-état daté dans Finances du lot** : suppression AccordionSection séparé, tout dans "Finances de votre lot" avec mention source
- [x] **Onglet Logement teal** : couleur par défaut #2a7d9c au lieu de vert
- [x] **Tooltip charges mensuelles** enrichi (provisions hors budget)
- [x] **Prompt : fonds travaux lot vs copro** : règle critique pour ne pas confondre, pas de pénalité scoring si non_mentionne
- [x] **Prompt : pre_etat_date.present obligatoire** quand doc PRE_ETAT_DATE détecté
- [x] **Prompt : historique N-1/N-2 obligatoire** si pré-état daté présent
- [x] **Prompt : surface Boutin** : point de vigilance auto si surface_type = "boutin"
- [x] **Prompt : seuils vigilance dynamiques** : 5000€ si budget >80k, sinon 3000€, exclusions explicites (boîtes aux lettres, peinture, etc.)
- [x] **Prompt : PV AG manquants** : si <3 PV fournis, ajout dans documents_manquants
- [x] **Comparer : titre_verdict** : interdit "malgré" quand bien recommandé a le meilleur score
- [x] **RapportComparaisonPage** : KPI label "dépenses estimées année 1", blocs ouverts desktop, texte travaux plus grand, padding mobile réduit

- [x] **AdminPage** : refonte Vue d'ensemble axée mois courant (CA, nouveaux clients, analyses lancées Simple/Complète, ticket moyen, CA par catégorie, à lire, actions rapides)
- [x] **AdminPage** : refonte Statistiques avec filtre "Depuis le début" + bloc CA par catégorie filtrable + bloc crédits offerts conditionnel
- [x] **AdminPage** : Paiements → "Journal des paiements" (suppression des 4 KPIs redondants)
- [x] **Distinction claire** : CA encaissé (payments) vs Analyses lancées (analyses, Simple/Complète uniquement) vs Crédits offerts (acquisition)
- [x] **RLS admin** : fonction `is_admin()` + policies additives sur analyses/profiles/payments (migration SQL appliquée)
- [x] **Webhook Stripe** : extraction `paymentIntentId` dans `payments.stripe_payment_id` pour lien direct vers le paiement
- [x] **Recherche globale ⌘K** : fix colonne `adresse_bien` inexistante (remplacée par `address`) + clic analyse ouvre fiche détail
- [x] **Responsive mobile dashboard** : DashboardPage.tsx avec padding réduit sur mobile + force 100% largeur + topbar agrandie 62px
- [x] **HomeView mobile** : stats en 1 colonne, adresse wrap au lieu de coupée
- [x] **Support mobile** : icône au-dessus du titre + padding réduit + réponses FAQ pleine largeur
- [x] **Aide mobile** : bloc Conseil restructuré, bloc "20" compact, échelle notation avec description pleine largeur en wrap

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
