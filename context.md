# VERIMO — Contexte projet — 25 juillet 2026

> Colle ce fichier en début de conversation Claude pour reprendre le contexte.

---

## 🛠️ Méthode de travail avec Alex

- **Profil** : débutant développement, modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- **Repo** : `github.com/emilio92100/analymoCD`
- Claude clone `https://github.com/emilio92100/analymoCD.git` et livre les fichiers **complets** via `present_files` depuis `/mnt/user-data/outputs/`
- Alex push manuellement sur GitHub
- **Vercel redéploie auto** le frontend après chaque push GitHub
- ⚠️ **Edge Functions Supabase NE sont PAS déployées par push GitHub** — il faut aller manuellement dans Supabase → Edge Functions → coller le code → Deploy. Bug récurrent : Alex push, l'erreur persiste, c'est parce que l'edge function n'est pas redéployée
- **SQL avant frontend** : toujours faire les UPDATE de schéma Supabase avant de pusher le code qui s'en sert
- **Ne jamais coder sans accord préalable** — toujours échanger et valider avant de toucher au code
- **Une étape à la fois** — pas 10 actions d'un coup
- **Réponses courtes et concises** — pas de pavés sauf question technique précise
- **Pas de QCM cascade** — quand Alex demande un choix, lui en proposer 2-4 max
- **Challenger les sur-ingénieries** — Alex préfère faire simple
- **Mots bannis des pages publiques Verimo** :
  - "IA" / "AI" → utiliser "technologie Verimo", "moteur d'analyse", "nos algorithmes", "analyse experte". AI uniquement autorisé dans admin, edge functions, prompts, logs, context.md.
  - "co-brandé" / "co-branding" → utiliser "à votre image" (banni progressivement sur tout le site)
- **Tests live avec vraie carte CB d'Alex** (pas Visa 4242)
- **Builds Vercel COMPLETS avant toute livraison front** : `npm install` puis `npx tsc -b && npx vite build` (le pipeline exact de Vercel). Leçon du 25/07 : une vérif esbuild seule (= syntaxe) a laissé passer un TS2367 → build Vercel cassé. Les edge functions Deno se vérifient à l'esbuild (pas de tsc applicable).

---

## 🆕 DERNIÈRE SESSION — 25 juillet 2026 ⭐⭐⭐

> Grosse session fiabilisation : 6 chantiers livrés (2 signalés par Alex en test réel), tous buildés au pipeline Vercel complet. ⚠️ Les fichiers du jour sont **CUMULATIFS** : `analyser-run` livré en fin de session = v4 du jour (cumule les 4 chantiers serveur), `RapportPage.tsx` et `RapportComparaisonPage.tsx` cumulent aussi — toujours déployer la DERNIÈRE version livrée de chaque fichier.

### ✅ Chantiers livrés

**1. Composition de la copropriété — 7 catégories + auto-contrôle (cas réel : RCP 49 lots, 24-26 rue Chauveau Neuilly)**
- Bug : le rapport affichait 13 appartements + 13 parkings + 13 caves = 39/49 — **10 lots invisibles** (7 chambres de service + 3 lots « une pièce »). Causes : schéma `nb_lots_detail` limité à 4 clés + règle prompt « logements = appartements + maisons uniquement ».
- Fix `analyser-run` : schéma étendu à **7 clés** `{logements (=apparts+studios), maisons, chambres_service, parkings, caves, commerces, autres}` + **AUTO-CONTRÔLE** : quand un doc liste tous les lots (RCP, état descriptif), la somme des catégories DOIT = `nb_lots_total` (exemple Chauveau dans le prompt).
- Fix `RapportPage` : 7 lignes affichées (🏡 Maisons, 🛏️ Chambres de service, 🧩 Autres lots), label 110→140px, **filet rétrocompatible** : le résidu (total − somme) bascule automatiquement dans « Autres lots » → les anciens rapports redeviennent cohérents sans régénération.

**2. « Compléter mon dossier » — BLINDAGE COMPLET (audit + 5 chemins d'échec corrigés) 🔴**
- Audit du circuit complet. Déjà sain : rapport existant lu **en base** (pas falsifiable), deadline 7 j vérifiée serveur, cap 5 docs, gratuit, **toujours single-call** (l'aiguillage MAP-REDUCE exclut le mode complement).
- **5 anomalies trouvées et corrigées** :
  - (A1) Échec de complément → `status='failed'` masquait le rapport d'origine (le front testait failed AVANT result).
  - (A2) Échec → remboursement d'un crédit **jamais consommé** (le complément est gratuit) → +1 crédit offert, l'analyse d'origine devenait gratuite.
  - (A3) 🎯 **Le watchdog tuait ~25 % des compléments SAINS** : il se base sur `created_at` (ancien pour un complément) → matché « processing > 1h » au tick suivant du cron 15 min → tué en plein vol.
  - (A4) One-shot vérifié uniquement côté front (rejouable en API directe).
  - (A5) `analyser-retry` avait un **5ᵉ chemin d'échec oublié** : vieux `refundCredit` direct (refund_pro_credit + UPDATE profiles) **contournant le verrou idempotent** de juillet, + fallback `mode || 'normal'` qui aurait raté l'aiguillage MAP-REDUCE d'un dossier requeued.
- **Fix racine (miroir 4 fichiers)** : tout échec en `mode='complement'` → **AUCUN remboursement** + **restauration `status='completed'`** (rapport d'origine intact) + `progress_message = COMPLEMENT_FAILED_MSG` (constante MIROIR EXACT dans `analyser`, `analyser-run`, `watchdog-stuck-analyses`, `analyser-retry` ; préfixe détecté par `analyse-client.ts` et `RapportPage.tsx`). Appliqué dans `handleAnalyseFailure` (×2), `cleanupAnalyse` (watchdog) et `abandonAnalysis` (retry).
- **Anti-watchdog** : `analyser` tamponne `last_retry_at = now()` au passage en processing ; la requête « stuck » du watchdog exige désormais created_at **ET** last_retry_at (si présent) au-delà du seuil, sur les 3 branches. Protège compléments ET analyses requeued.
- **Garde one-shot serveur** (400 `already_complemented`) + refund d'`analyser-retry` aligné sur `refund_analyse_credit` + fallback `'complete'`.
- **UX** : le popup détecte l'échec via le marqueur (fini le faux « Rapport prêt ! ») et propose Réessayer ; sur le rapport, bandeau bleu « Mise à jour en cours » + polling 8 s auto-refresh, bandeau ambre échec avec bouton **Réessayer** (le one-shot ne bloque pas : `complement_date` n'est posé qu'en succès) ; filet front : failed+result → le rapport s'affiche quand même ; mapping des erreurs 400 (deadline/one-shot/5 docs max).
- Changement d'onglet pendant un complément : OK dès ~40 % (tout serveur, cloche+email) ; seule phase sensible = l'upload initial. Micro-cas résiduel en backlog : coupure réseau pile entre fin d'upload et appel serveur → faux « Rapport prêt ! » (rien lancé, bouton actif, refaire suffit).

**3. Comparaison — tableau « Résumé financier » : 4 sources ratées + double comptage (signalé par Alex en test)**
- Taxe foncière jamais affichée (lisait `fin.taxe_fonciere` au lieu du canonique `finances.taxe_fonciere_annuelle`) ; cotisation fonds travaux ratait `cotisation_fonds_travaux_lot_annuelle` (appel de charges) ; fonds à rembourser ratait `fonds_travaux_ancien` + `fonds_rattaches_lot` ; fonds de roulement ratait `avance_tresorerie` ; **double comptage** : la cotisation est déjà incluse dans `charges_annuelles_lot` mais était re-additionnée au total.
- Fix `RapportComparaisonPage` (`getResultData`) : bons chemins + fallbacks complets, annotation « (déjà incluse dans les charges) » non recomptée, les DEUX fonds pré-état daté additionnés, taxe dans le total et `has_data`, label « Cotisation annuelle ». Tableau calculé **côté client** → simple refresh suffit après push, pas de relance de comparaison.

**4. Comparaison — barre compacte sticky (UX desktop demandée par Alex)**
- Au scroll > 280 px (desktop ≥ 900 px uniquement), barre fixe sous le header : par bien « BIEN N ⭐ · pastille score colorée · adresse ellipsis », **même grille** que les cartes → mapping colonnes ↔ biens permanent en lisant le détail. `createPortal(document.body)` + framer-motion (leçon overflow du 24/07 réappliquée). Mobile désactivé.

**5. Compteur « Document X sur Y » — l'anomalie du 24/07 enfin corrigée**
- `analyser-run` : suppression du `+1` fantôme (`progress_total = files.length` en MAP ; REDUCE et final = nbDocs/nbDocs).
- `NouvelleAnalyse` : titre « Document {current+1} sur {total} » **borné à la lecture** (fix off-by-one inclus) ; ensuite « Synthèse du rapport en cours… » (≥ 6 docs) ou « Analyse approfondie en cours… » (< 6). 9 docs n'affichent plus jamais « sur 10 ».

**6. Fonds de travaux — MILLÉSIME-AWARE + « la résolution adoptée fait foi » (cas réel : PV AG 2023, 31 Bd d'Auteuil Boulogne) 🔴**
- Bug : recalcul déterministe (serveur ET front) divisait la cotisation **2023** (4 500 €) par le budget **2024** (95 000 €) → 4,7 % → faux « insuffisant » + pénalité −0,5 finances, alors que la 18ᵉ résolution fixe « 5 % du budget prévisionnel de l'exercice **2023** » = 4 500/90 000 = **5,0 % pile conforme**. Piège vérifié au PDF intégral : l'ODJ annonçait 100 720 € (projet syndic), les résolutions adoptées arrêtent 90 000 € (2023) et 95 000 € (2024) — le moteur avait raison, Alex s'était fait avoir 2× en relisant. 😄
- **Règle validée par Alex** : la résolution ADOPTÉE fait foi (5 % voté = conforme PAR DÉFINITION, jamais pénalisé) ; montant € absent → **reconstituer** = % voté × budget voté du MÊME exercice ; **jamais croiser deux exercices** (millésimes différents sans budget correspondant → on n'écrase plus le statut IA).
- `analyser-run` : 4 nouveaux champs (`fonds_travaux_pct_vote`, `fonds_travaux_resolution_adoptee`, `fonds_travaux_total_constitue`, `fonds_travaux_total_constitue_date`) + 2 RÈGLES prompt (RESOLUTION FONDS TRAVAUX avec l'exemple réel Auteuil ; FONDS TRAVAUX CONSTITUE = **3ᵉ notion distincte** cotisation copro / capital total copro / part rattachée au lot) + `recalculerCategories` réécrit (priorité % voté → ratio même exercice via `budgets_historique` → sinon pas d'écrasement) + filet de reconstitution du montant.
- `RapportPage` : miroir front (même cascade), carte renommée « **Cotisation fonds travaux votée** » + tooltip 3-notions + ligne « **Fonds constitué à ce jour : X €** (au date) » (le PV mentionnait 13 201,12 € — capté par les nouvelles analyses), barre avec exercice + « X € requis » sur le bon budget, KPI mis à jour.

### 📦 Déploiement du jour (versions FINALES cumulatives)
- **GitHub (Vercel auto)** : `RapportPage.tsx` · `RapportComparaisonPage.tsx` · `NouvelleAnalyse.tsx` · `src/lib/analyse-client.ts`
- **Supabase Studio — redéploiement MANUEL ×4** : `analyser-run` (v4 du jour : compo lots + complément + compteur + fonds travaux) · `analyser` · `watchdog-stuck-analyses` · `analyser-retry`
- **Aucun SQL** (`last_retry_at` existe depuis la queue v9).
- ⚠️ Piège vécu : Alex cherchait `analyse-client.ts` dans les edge functions — c'est un fichier **front** (`src/lib/`). Rappel : edge function = dossier `supabase/functions/<nom>/index.ts`.

### 🧪 Tests à faire par Alex (post-déploiement)
- Complément happy path sur une analyse **> 1h** : solde crédits inchangé, bandeau bleu si retour sur le rapport, cloche, complement_date posé, bouton grisé.
- Nouvelle analyse 9 docs : « Document 1 sur 9 » → « Synthèse du rapport en cours… ».
- Comparaison (refresh) : taxe foncière 1 124 € visible Bien 2, total ~6 220 €, barre sticky au scroll.
- Nouvelle analyse du dossier Auteuil : 5,0 % conforme + « Fonds constitué : 13 201 € » (l'ancien rapport de test affiche déjà 5,0 % via le lookup front, mais statut/score stockés et fonds constitué nécessitent une régénération).

---

## 📌 SESSION — 24 juillet 2026 ⭐⭐⭐

> Session UX/affichage + fiabilisation comparaison. Beaucoup de frontend, un prompt, une migration SQL. Tout compile, plusieurs points confirmés en live par Alex.

### ✅ Chantiers livrés

**1. Temps estimé d'analyse — FIGÉ (NouvelleAnalyse.tsx)**
- Avant : le « temps restant » affiché en haut dépendait du `pct` de progression → il s'effondrait (ex : « ~10-15 min » → « ~1 min » en quelques secondes) parce que l'upload et le MAP parallèle font bondir le pourcentage, puis restait figé pendant la synthèse (phase la plus longue). UX trompeuse.
- Fix : `tempsRestant` calculé **une seule fois** sur le nombre de docs (≤3 → 2 min, ≤8 → 4 min, ≤12 → 7 min, sinon 10 à 15 min), ne bouge plus. Affiché « Environ X ». Le vrai chrono « Temps écoulé » (déjà présent) reste la valeur qui évolue en direct, désormais visible dès **30 s** (au lieu de 60 s).
- ⚠️ Limites connues NON traitées (à voir plus tard) : estimation basée sur le **nombre de docs** seulement (un PDF de 200 p compte comme un de 3 p) ; table plafonnée à 13 docs (un dossier de 25 est estimé comme 13).

**2. Compteur « Document X sur Y » en MAP-REDUCE — anomalie identifiée (NON corrigée)**
- En mode MAP-REDUCE (seuil réel = **`SEUIL_MAP_REDUCE = 6`** dans analyser-run, pas 8/9), `progress_total = files.length + 1` (le +1 = étape de synthèse). Donc « Document 12 sur 16 » pour 15 docs. Incohérence : le message serveur dit « (12/15) » mais `progress_total` vaut 16. Affichage OK sur < 6 docs (total = files.length exact). ~~Signalé à Alex, pas corrigé cette session~~ → ✅ **CORRIGÉ le 25/07** (le +1 retiré côté serveur + libellé « Synthèse » côté front — voir dernière session).

**3. Carnet d'entretien — refonte affichage (RapportPage.tsx, onglet Copro)**
- Contrats d'entretien : chaque card a maintenant une **icône dédiée par équipement** (helper `contratIcon` : 🛗 ascenseur, 🧯 extincteurs, 🐀 dératisation, 🪳 désinsectisation, 🚪 porte garage, 🌳 jardin, 🔥 chaudière, 💧 compteurs…). Avant : 🏢 générique identique partout → tout se ressemblait.
- Diagnostics parties communes : **statut (Positif/Négatif/Non effectué) en bandeau centré en bas** de chaque card (avant : collé à droite), carte teintée selon résultat (rouge/vert/gris), icône propre par diagnostic (helpers `diagStatut` + `diagEmoji`). Mapping basé sur le **texte du libellé** → marche pour tout carnet, sans champ structuré dédié.

**4. Points forts / vigilance — harmonisation analyse SIMPLE = COMPLÈTE (DocumentRenderer.tsx)**
- Avant : l'analyse simple (`PointsFortsVigilances` dans DocumentRenderer) affichait les points sur une seule ligne, sans titre gras. L'analyse complète (RapportPage) découpait « Titre — détail ». Incohérence.
- Fix : `PointsFortsVigilances` reprend **exactement** le rendu de la complète (bandeaux foncés vert #2f6b3f / brun #9a4a2c + compteur + `splitPoint` titre gras/détail léger). Une seule modif de la définition → les ~18 usages en profitent. Grille responsive (1 col mobile déjà géré).

**5. Format « Titre — détail » des points PAR DOCUMENT — PROMPT (analyser-run/index.ts) ⚠️ REDÉPLOIEMENT MANUEL**
- Cause racine du point 4 : la règle « Titre court (2-5 mots) — détail » existait déjà mais UNIQUEMENT pour la synthèse finale (racine du JSON). Les `points_forts`/`points_vigilance` **internes à chaque document** (PV_AG, DDT…) n'avaient aucune consigne de format → phrases sans séparateur exploitable → pas de titre gras côté affichage simple.
- Fix : règle de format ajoutée dans `buildDocumentPrompt` (s'applique à TOUS les documents, titre < 60 caractères pour matcher la limite du `splitPoint` frontend). N'affecte que les **nouvelles** analyses. Le `splitPoint` reste le filet (pas de séparateur → détail simple, jamais cassé).

**6. Popup « Besoin d'aide » — refonte UX (DashboardPage.tsx + DashboardProPage.tsx)**
- ⚠️ Popup **DUPLIQUÉ dans 2 fichiers** (particulier + pro) — toujours modifier les deux.
- Motifs : chaque bouton a une **icône colorée en pastille** (analyse=bleu FileText, abonnement=violet CreditCard, bug=rouge Wrench, crédits=vert, autre=gris HelpCircle ; +ambre Users « Volume important » côté pro). Sélection nette (bordure 2px + fond teinté + ombre). Import lucide : ajout `Wrench, HelpCircle` (pro aussi).
- Popup **élargi 520 → 600 px** + padding 32/34 (plus aéré, libellés sur une ligne).

**7. Comparaison de biens — FIABILISATION COMPLÈTE (le gros chantier) ⭐**
- ⚠️ Composant `Compare` **partagé** entre dashboard particulier (DashboardPage L529) ET pro (DashboardProPage L7952) — une seule correction couvre les deux.
- **a) Ordre des biens figé (RapportComparaisonPage.tsx)** : avant, le bien recommandé était déplacé en 1ʳᵉ position (gauche) → « Bien 2 » pouvait apparaître à gauche, déroutant. Fix : `displayOrder` = ordre d'origine (**Bien 1 toujours à gauche, Bien 2 à droite**). Le badge « ⭐ RECOMMANDÉ » suit le bon bien via `bestIdx`, quelle que soit sa position.
- **b) Suivi « en cours » via BASE (comme une analyse classique)** — 3 pièces coordonnées :
  - **SQL** : `ALTER TABLE comparaisons ADD COLUMN status` (processing/completed/failed) + `updated_at` + index `(user_id, status)`. Migration = `01-migration-comparaisons-status.sql`. Table `comparaisons` avait 5 colonnes (id, user_id, analyse_ids, verdict **text**, created_at) — pas de status avant.
  - **Edge Function `comparer`** ⚠️ REDÉPLOIEMENT MANUEL : crée la ligne `status='processing'` (verdict null) **dès le début**, passe à `completed` à la fin (upsert onConflict `user_id,analyse_ids`), `failed` sur erreur API ou parse. Cache inchangé (lit `verdict`, donc ne matche jamais une ligne processing).
  - **Frontend `Compare.tsx`** : lit les comparaisons `status='processing'` en base, affiche un **spinner « Comparaison en cours… » tout en haut de la page**, polling 4 s jusqu'à résolution. Historique filtré `.not('verdict','is',null)` (les processing ne polluent pas). Robuste multi-appareils/refresh (source de vérité = base). ⚠️ Une 1ʳᵉ version localStorage a été écrite puis **remplacée** par cette version base — ne garder que la version base.
- **c) Barre flottante « Lancer la comparaison »** : apparaît dès 2-3 biens sélectionnés, **suit le scroll en permanence**. ⚠️ Piège vécu : `position:fixed` NE MARCHE PAS car le `<main>` du dashboard a `overflowX:hidden` (piège classique qui neutralise `fixed`). **Solution = `createPortal` sur `document.body`** → la barre échappe à tous les overflow/transform parents. **CONFIRMÉ LIVE par Alex après le portail.**
- **d) Bouton « Annuler » retiré** (écran d'attente) : il ne faisait que `setLaunched(false)` côté client, l'Edge Function tournait quand même → trompeur. Retiré (bouton + prop `onCancel` + fonction `handleCancel`).

### 📦 Déployé ✅ (récap de la session, pour mémoire)
1. **SQL Editor D'ABORD** : `01-migration-comparaisons-status.sql` (sinon le frontend cherche `status` inexistant + l'Edge Function plante)
2. **GitHub** (Vercel auto) : `NouvelleAnalyse.tsx`, `RapportPage.tsx`, `DocumentRenderer.tsx`, `DashboardPage.tsx`, `DashboardProPage.tsx`, `Compare.tsx`, `RapportComparaisonPage.tsx`
3. **Supabase Studio — redéploiement MANUEL** : `analyser-run` (format points par doc) ET `comparer` (statut processing)
- ⚠️ Faire SQL + Edge Functions AVANT le frontend idéalement (sinon erreur silencieuse le temps du décalage, pas de casse).

### 🔎 SEO / indexation — POINT D'ÉTAPE (24 juillet)
- **Constat** : un client a trouvé Verimo **via Claude** (recherche web) et a payé. Preuve que le SEO alimente déjà l'acquisition via assistants IA. Aucun système de pub — seule la recherche web fait remonter Verimo.
- **Indexation réelle mesurée (Search Console + repo)** : **24 guides indexés sur 47**. 34 pages indexées au total (24 guides + 10 pages site). Les 47 fichiers existent bien dans `src/guides/` et dans le sitemap (aucun écart).
- ⚠️ **Les mauvais 23 manquent** : sur les 5 articles piliers, **4 ne sont PAS indexés** (`analyser-pv-ag-avant-achat`, `dpe-comment-lire-avant-achat`, `charges-copropriete-trop-elevees`, `10-documents-avant-offre-achat` ; seul `compromis-vente-clauses-lire` est indexé). Explique pourquoi une recherche « PV d'AG » ne remonte pas Verimo.
- **Cause** : soumission jamais reprise (quota sauté en mai). Action = **soumettre les 23 manquants** dans Search Console (~10/jour). Alex a commencé cette session.
- **Autres anomalies vues** : désindexation mi-juin (~40 → 34 pages, jamais remontée) ; `/dashboard/nouvelle-analyse` indexée à tort (robots.txt `Disallow` bloque l'exploration mais PAS l'indexation → il faut un `noindex`, pas un Disallow) ; `/cgu` et `/contact-pro` dans le sitemap jamais indexées ; `lastmod` du sitemap figés au 6 mai.
- **Prerendering (SSG)** : discuté, **NON prioritaire**. Le site est une SPA React/Vite → les robots sans JS (IA, réseaux sociaux) ne lisent que la coquille `index.html` (meta générique). Google exécute le JS donc indexe. Impact réel = les IA/LinkedIn ne lisent pas le corps des articles, seulement les citent via résultats de recherche. Chantier à risque (peut casser le build), à faire plus tard sur branche de test si besoin de visibilité IA/sociale. Options notées : `vite-react-ssg` (propre, refonte routes), `react-snap` (léger). Items backlog liés : images OG absentes, FAQ dans les articles (format que Google/IA aiment extraire).

---

## 📌 SESSION — 2-3 juillet 2026 ⭐⭐⭐

### ✅ Chantiers livrés (à déployer — voir « À DÉPLOYER » plus bas)

**1. Charge des travaux votés (acheteur/vendeur) — CORRECTION LÉGALE**
- L'app disait à tort « travaux votés = à la charge du vendeur ». Faux : par défaut (art. 6-2 décret 67-223), les appels de fonds exigibles APRÈS la vente sont à la charge de l'**ACHETEUR** ; l'usage notarial les remet au vendeur via une **clause du compromis**.
- Wording corrigé partout (RapportPage, DocumentRenderer, RapportPrintPage, MethodePage, Aide) : « en principe loi = acheteur, mais en pratique repris par le vendeur via clause — vérifiez la clause ». Bannière rouge → bleue. Bonus scoring +2/+3 gardé (défendable sous « usage »). Prompt : règle « QUI PAIE LES TRAVAUX VOTES » ajoutée dans analyser-run.

**2. Double-comptage tantièmes — CORRECTION PROMPT**
- Le modèle sommait le tantième du lot + celui de la cave alors que la base « charges communes générales » les incluait déjà → double compte. Règle anti-doublon (lire le tantième PROPRE de chaque ligne, jamais la base « charges communes ») + auto-contrôle (total = base). Front (somme déterministe) inchangé.

**3. Finances du lot : cotisation ALUR + fonds rattachés**
- Affiche « dont ~X €/an cotisation fonds travaux (ALUR) » sous la charge annuelle + bloc « Fonds rattachés à votre lot » (avance trésorerie + fonds ALUR, à rembourser au vendeur, indicatif). Affiché seulement si présent ET pas de pré-état daté. Complète (RapportPage) + simple (DocumentRenderer fiche appel de charges). Champs ajoutés au prompt.

**4. Badges règles d'usage RCP — CORRECTION FRONT**
- Ancien : détection naïve (« interdit » seulement) → « Pas d'antenne » passait en vert « ✓ Autorisé » à tort. Nouveau : 4 états (Interdit / Sous conditions / Autorisé / À noter) via négations (« pas de / ne peut pas / aucun »). Plus de faux vert. Front-only.

**5. Redesign points positifs/vigilance — STYLE 1 (validé par Alex)**
- Design « bandeaux pleins » (vert #2f6b3f / brun #9a4a2c) + **titre gras + détail léger**. Format « **Titre — détail** » : le moteur écrit ce format (règle prompt), le front `RapportPage` le découpe (splitPoint, sépare sur le 1er « — » si titre court, sinon « : », sinon ligne simple). Repli propre anciens rapports. Diagnostics manquants injectés serveur reformatés au même format (« DPE manquant — … »). Backward-compatible.

**6. Timeout analyse 350 → 385 s (PANSEMENT, pas le fix)**
- `analyser-run` timeoutMs 350000 → 385000. Gain ~1 doc. ⚠️ Marge tombée à ~15 s avant le kill plateforme (~400 s) → sur latence, échec « sale » possible (watchdog au lieu de remboursement propre).

**7. 🔴 Fix crédits : double remboursement + affichage live — VALIDÉ EN LIVE**
- **Bug A (affichage nav)** : le compteur ne baissait pas au lancement (chaque `useCredits()` = état séparé, nav ≠ page d'analyse). ✅ Fixé via **bus d'événement `verimo:credits-changed`** → nav particulier (`useCredits`) ET pro (`DashboardProPage`) se rafraîchissent en direct. **CONFIRMÉ LIVE : le chiffre baisse au lancement.**
- **Bug B (double remboursement)** : **3 rembourseurs** (client `NouvelleAnalyse` + `analyser-run` + `watchdog-stuck-analyses`) remboursaient tous → **net +1 crédit gagné à chaque échec**. Particulier ET pro. ✅ Fixé via **verrou idempotent** : SQL `refund_analyse_credit(p_analyse_id)` + colonne `analyses.credit_refunded` (FOR UPDATE + flag → rembourse UNE fois, jamais sur une analyse `completed`). Les 3 rembourseurs appellent cette fonction. Client garde un remboursement direct UNIQUEMENT en pré-lancement (createAnalyse null, aucune analyse créée). **CONFIRMÉ LIVE : +1 exactement, plus de double.**

### 📦 Déployé ✅ (récap de la session, pour mémoire)
1. **SQL Editor D'ABORD** : `refund_idempotent.sql` (colonne `credit_refunded` + fonction `refund_analyse_credit` + grants authenticated/service_role)
2. **GitHub** (Vercel auto) : `RapportPage.tsx`, `useCredits.ts`, `NouvelleAnalyse.tsx`, `DashboardProPage.tsx`
3. **Supabase Studio — redéploiement MANUEL** : `analyser-run` (contient chantiers 1-6 + fix crédit) ET `watchdog-stuck-analyses` (fix crédit)

### 🔬 Diagnostic timeout gros dossiers — CONFIRMÉ (exemple réel : **Dossier Benoist Lucy**)
- Test **11 docs** (Dossier Benoist Lucy) → timeout à **386 s** (avec 385 s) et **351 s** (avec 350 s). Confirmé aux deux valeurs, à la seconde.
- Logs shutdown : `reason: EarlyDrop`, **mémoire ~13 Mo**, **CPU ~44** → NI mémoire NI CPU. 100 % du temps = **génération IA en single-call**.
- **Plafond single-call ≈ 10 docs** (~35 s/doc). 11+ docs = mur, quoi qu'on fasse sur le timeout (collé à la limite plateforme ~400 s).
- **Mort brutale** (11 docs) : invocation tuée sans passer par `handleAnalyseFailure` → analyse coincée en `processing`, PAS de remboursement propre → seul le **watchdog (1h)** rattrape. Une analyse fantôme (`078a6ff0`) débloquée à la main (SQL `failed` + crédit +1). ⚠️ Piège vécu : mes modifs n'avaient RIEN cassé — un test 2-3 docs marchait ; seuls les gros dossiers meurent. Attention aussi au **fuseau UTC** dans les logs (heure BDD = UTC = heure FR −2).

### 🎯 PROCHAINES SESSIONS (par priorité)

**A. 🔴 Gros dossiers = MAP-REDUCE v2 — ✅ FAIT (en prod, hybride seuil 6 — voir section « ⚙️ Architecture analyse »).** Cadrage d'époque conservé ci-dessous pour mémoire :
- **Archi = HYBRIDE À SEUIL** : dossiers **≤ ~8 docs** → single-call (rapide, précision max, inchangé) ; **≥ 9 docs** → découpage. Seuil affinable au **nb de pages** plus tard (ex : > 60-70 p).
- **Le découpage = ressusciter le MAP-REDUCE**, en corrigeant SON SEUL défaut : les fiches MAP étaient trop grosses (« compte rendu exhaustif » jusqu'à 64K tokens → aussi lent que single-call).
- **Préférence Alex (tranchée)** : fiche par doc = **RÉSUMÉ LIBRE CONCIS** (PAS de grille JSON rigide) — cadré « garde tout ce qui compte pour un acheteur (montants, dates, votes, risques, procédures) mais va à l'essentiel, max ~1 page ». Alex refuse la grille structurée (trop rigide, peur de rater un cas hors-case). ⚠️ Tension assumée : résumé libre court = risque de rater un détail fin ; l'hybride protège (single-call garde la précision max sur les dossiers normaux).
- **Orchestration** : **self-invoke** pour enchaîner vite (Alex préfère la vitesse à la queue 5 min) + **queue `analyser-retry` en filet** si un maillon casse. ⚠️ POINT CRITIQUE : **sauvegarder la fiche de chaque doc EN BASE avant de supprimer le PDF** (RGPD) — sinon l'invocation suivante cherche un doc déjà supprimé.
- **Précision** : MAP-REDUCE bien fait ≈ single-call sur l'essentiel, petit risque résiduel sur les recoupements fins entre docs (prix du découpage, acceptable car réservé aux gros dossiers → mieux qu'un timeout à 0 %).

**B. 🟠 Watchdog — PARTIELLEMENT TRAITÉ le 25/07** (tampon `last_retry_at` : ne tue plus les compléments/relances saines). Reste : réduire les seuils —
- Actuel : `processing > 1h`, `files_ready > 30 min`, `queued > 1h30`. Trop long (fantôme « en cours » jusqu'à 1h → mauvaise UX, vécu cette session).
- **Plan** : `processing` 1h → **~10-15 min** (sûr : avec timeout 385 s, aucune analyse vivante ne dépasse ~7 min) + cron watchdog plus fréquent + filet front (« échec » si « en cours » > ~8 min sans réponse).

**C. 🔴 Régénérer la clé service_role** (compromise 11 mai) — TOUJOURS EN ATTENTE, dernier verrou avant onboarding vraies agences.

---

## 📦 Le produit

**Verimo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges, DPE, compromis, carnet d'entretien, DTG, pré-état daté, état daté, taxe foncière, modificatifs RCP, fiche synthétique...). Rapport clair avec score /20, risques, recommandations. Fonctionne pour appartements et maisons.

**Slogan** : *Vos documents décryptés, votre décision éclairée.*
**H1 HomePage** : *Analysez vos documents immobiliers avant de signer.*
**Cible** : Acheteurs particuliers (primo-accédants, RP) et professionnels (agents immo, mandataires, investisseurs, marchands de bien, notaires).

---

## 💰 Tarification

### Particuliers
- 4,90€ → 1 crédit analyse simple (1 doc) — PAS de score /20
- 19,90€ → 1 crédit analyse complète (jusqu'à 15 docs)
- 29,90€ → 2 crédits (Pack 2 biens)
- 39,90€ → 3 crédits (Pack 3 biens)
- Crédits jamais expirés

### Pros — Abonnements mensuels HT
| Plan | Prix HT/mois | Complètes | Simples | Agents max |
|------|-------------|-----------|---------|------------|
| Découverte | 19,90€ | 1 | 3 | 1 |
| Starter | 49,90€ | 5 | 15 | 1 |
| Power | 89,90€ | 10 | 30 | 1 |
| **🏛 Agence** | **149,90€** | **15** | **30** | **3 (multi-utilisateurs)** |

**Achats unitaires pro (réservés aux abonnés)** : Complète 9,90€ HT · Simple 2,90€ HT

**Argumentaire commercial Découverte** : 1,30€ "surcoût" vs achat unitaire (19,90€ vs 18,60€) défendable via dashboard pro, support dédié, tarif préférentiel à 9,90€ (vs 19,90€ particulier). Rentable dès 2 analyses supplémentaires dans l'année.

**🏛 Plan Agence — V2 multi-utilisateurs implémentée le 28 mai 2026** :
- Cible : structures multi-collaborateurs (3 utilisateurs max en V2, login séparé par agent)
- 1 responsable invite jusqu'à 2 agents via mail d'invitation (lien magique 7j)
- Pool de crédits **partagé** entre tous les membres
- Facturation centralisée (responsable paie tout)
- Tous les dossiers sont **visibles par tous les membres** (lecture libre)
- Activation sur invitation admin : workflow inchangé depuis V1
- Cumul de crédits identique aux plans solo (plafond 2× = 30 complètes / 60 simples max)
- Sans engagement, résiliable depuis Stripe Customer Portal
- Article 4.5 ✅ **mis à jour le 23 juin** pour V2 multi-utilisateurs (fin du « login partagé », fonctionnement détaillé, au-delà de 3 = sur devis). Version CGV gardée à **v2.3**.

**Coûts réels Claude API** : ~0,50€/analyse complète (médiane), ~0,15€/analyse simple. Marges saines à 55-90%.

⚠️ **Tarifs pros JAMAIS affichés publiquement** — ni sur `/pro`, ni sur `/tarifs`, ni sur `/pro/agents-mandataires`. Validation manuelle des comptes + démo perso.

### Stripe Price IDs (PRODUCTION)

```
# Particuliers
document : price_1TTtd1BesXB76oWECAGA9ywf
complete : price_1TTtd2BesXB76oWEsZ9LsLS9
pack2    : price_1TTtcxBesXB76oWETkokxLgB
pack3    : price_1TTtczBesXB76oWEloTMvEZF

# Pro — abonnements mensuels
DECOUVERTE 19,90€ → price_1TTtd1BesXB76oWEZuILxjwe
STARTER 49,90€    → price_1TTtczBesXB76oWEcKaNR2BW
POWER 89,90€      → price_1TTtcxBesXB76oWEPyVYZjCj
AGENCE 149,90€    → price_1TbnpDBesXB76oWEdOjLZRh3   # 🏛 prod_UazolFHs7gghhx

# Pro — achats unitaires (réservés aux abonnés)
UNIT_COMPLETE 9,90€ → price_1TTtcyBesXB76oWEBF1TLHYz
UNIT_SIMPLE 2,90€   → price_1TTtd2BesXB76oWEVM0p27GS

# TVA France 20% (mode exclusif HT)
TVA Tax Rate ID : txr_1TUAxVBesXB76oWESXBnGdIZ
```

**Secret Supabase Edge Functions** : `STRIPE_PRICE_AGENCE` = `price_1TbnpDBesXB76oWEdOjLZRh3` (lu dynamiquement par `pro-checkout-create` et `stripe-webhook-pro`).

---

## 🏗️ Stack technique

- **Frontend** : React + Vite + TypeScript + Tailwind
- **Backend** : Supabase Pro (auth + DB + Edge Functions Deno + Storage)
- **IA** : Claude Sonnet 4.6 via API Anthropic + Files API (modèle `claude-sonnet-4-6`)
- **Paiement** : Stripe (PRODUCTION)
- **Email** : Mailjet (`notification@verimo.fr` particuliers, `pro@verimo.fr` pro)
- **Déploiement** : Vercel (frontend auto via GitHub) + Supabase (edge functions **manuelles**)
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`
- **Site** : `https://www.verimo.fr` + `pro.verimo.fr` (CNAME → Vercel)

---

## 🏢 Identité légale Verimo

- **Éditeur** : VERIMO APP
- **Responsable** : Alexandre ROGELET
- **Emails** :
  - `hello@verimo.fr` → email général grand public (CGU, mentions légales, contact)
  - `pro@verimo.fr` → email B2B (UNIQUEMENT relations pros, CGV Pro, demandes de rappel) — ✅ mailbox configurée et fonctionnelle
  - `notification@verimo.fr` → Mailjet particuliers
  - `contact@verimo.fr` → emails sortants pros (avec nom agent dans body)

---

## ⚙️ Edge Functions Supabase (production)

| Nom | Rôle | Version |
|-----|------|---------|
| `analyser` | Étape 1 : upload Storage→Files API, queue v9 si surcharge (metadata_queue), checks complément (rapport existant en base, deadline 7 j, cap 5 docs, 🆕 one-shot serveur 25/07), tampon `last_retry_at`, handleAnalyseFailure mode-aware complément | **v9 + garde complément** (25 juil) |
| `analyser-run` | Worker background. **PROD = HYBRIDE À SEUIL** : `SEUIL_MAP_REDUCE = 6` — **< 6 docs = single-call v7** (précision max, modes `document` et `complement` TOUJOURS single-call) ; **≥ 6 docs = MAP-REDUCE v2** (MAP parallèle → résumés libres sauvés en base `map_resultats` AVANT suppression des PDFs (RGPD) → self-invoke REDUCE avec le prompt complet). Post-traitement déterministe : retryDpeCarrez, recalculerCategories/Maison, validateDiagsManquants. Cumule : ASL (25/06), scoring maison (26/06), format points (24/07), 🆕 25/07 : composition lots 7 catégories, échec complément mode-aware (restaure completed, 0 refund), compteur sans +1, fonds travaux millésime-aware + fonds constitué. | **v7 hybride + fixes 25 juil** |
| `comparer` | Compare 2 ou 3 rapports. 🆕 Écrit `status='processing'` dès le début puis `completed`/`failed` (24 juil) — permet au frontend d'afficher un spinner « en cours » comme une analyse classique. ⚠️ Nécessite la colonne `comparaisons.status` (migration SQL 24 juil). | **v2** (24 juil) |
| `analyser-retry` | Cron pg_cron 5 min — retraite les analyses queued (12 retries max, relance analyser-run avec mode+existingReport). 🆕 25/07 : refund aligné sur le verrou idempotent `refund_analyse_credit` (le 4ᵉ rembourseur oublié contournait le verrou), abandon de complément mode-aware, fallback mode `'complete'` | **v2** (25 juil) |
| `watchdog-stuck-analyses` | Cron 15 min — nettoie les analyses bloquées (processing > 1h, files_ready > 30 min, queued > 1h30) → failed + refund + notif ; comparaisons > 5 min → failed. 🆕 25/07 : garde `last_retry_at` (ne tue plus une (re)lance saine sur ligne ancienne) + branche complément (restaure completed, 0 refund) | **v3** (25 juil) |
| `admin-user-management` | Actions admin (create, invite, delete, reset password, create_pro_demo enrichi, activate_pro_demo, unlock_agence_subscription, grant_agence_credits, 🆕 **set_agence_users_max** 23 juin) — **modifié 28 mai pour création auto entité agence** | **v4** (23 juin) |
| `pro-checkout-create` | Stripe pro : subscribe / preview_upgrade / buy_unit / cancel / cancel_scheduled_change / reactivate / billing_portal / list_invoices | V3 |
| `stripe-webhook-pro` | Webhook Stripe pro (5 events) + mail résiliation + auto-conversion démo→actif + recharge pool agence quand plan=agence + 🆕 **préserve `nb_users_max` custom au renouvellement** (`Math.max(3, valeur_actuelle)`, 23 juin) | **V10** (23 juin) |
| `stripe-webhook` | Webhook Stripe particuliers (checkout.session.completed) | **V3.1** |
| `create-checkout-session` | Stripe particuliers (checkout) + audience promo | **V3** |
| `send-pro-request-confirmation` | Mail confirmation prospect + notif interne `pro@verimo.fr` | — |
| `notify-callback` | Notification demande de rappel pro (cloche admin + email pro@verimo.fr) | **v1** (25 mai) |
| `send-agence-invitation` | 🆕 Envoi mail HTML Mailjet "Vous avez été invité" à rejoindre une agence | **v1** (28 mai) |
| `accept-agence-invitation` | 🆕 Verify token + accept invitation (crée membre + pro_invitations pour badge "Compte activé") | **v1** (28 mai) |
| `sync-stripe-payments` | Filet de sécurité — sync Stripe → table `payments` toutes les 5 min via pg_cron | **V2** — ⚠️ **DÉSACTIVÉ temporairement** |

⚠️ **Rappel critique** : push GitHub ne déploie pas les edge functions → toujours redéployer manuellement dans Supabase Studio.

### Webhooks Stripe configurés

- **Verimo - Pro** → `stripe-webhook-pro` : 4 events (checkout.session.completed, customer.subscription.deleted, customer.subscription.updated, invoice.paid) + `charge.refunded`
- **Verimo - Particuliers** → `stripe-webhook` : checkout.session.completed + `charge.refunded`

### Cron Supabase pg_cron

- `analyser-retry-5min` → actif (essentiel)
- `sync-stripe-payments-every-5min` → DÉSACTIVÉ temporairement (à réactiver quand vieux paiements problématiques expirés)

⚠️ **Service_role key compromise** durant la session du 11 mai (partagée dans screenshots). À régénérer + recréer le cron avec la nouvelle clé.

---

## 🗺️ Routes principales

```
/                              → HomePage
/pro                           → ProPage (4 onglets profils : Agent/Mandataire, Investisseur, Marchand, Notaire)
/pro/agents-mandataires        → MandatairesPage (landing dédiée agents/mandataires)
/pro/rejoindre                 → Page multi-step prospects pros
/tarifs                        → TarifsPage (particuliers uniquement, pas de tarifs pros publics)
/exemple                       → ExemplePage
/methode                       → MethodePage
/guides                        → GuidesPage
/cgv-pro                       → CGVProPage (B2B, scroll spy, 14 sections)
/connexion, /inscription       → Auth
/accept-invitation?token=xxx   → 🆕 AcceptInvitationPage (création de compte agent via invitation responsable)
/admin                         → AdminPage (paramètre URL ?tab=callbacks pour ouvrir direct un onglet)
/dashboard                     → SmartDashboard (détecte role)
/dashboard/nouvelle-analyse    → NouvelleAnalyse
/dashboard/analyses            → MesAnalyses (particulier)
/dashboard/dossiers            → MesDossiersPro (pro) — renommé "Dossiers de l'agence" pour membres agence
/dashboard/dossier/:id         → DossierDetail (pro)
/dashboard/equipe              → 🆕 MonEquipePage (responsable + co-resp + agent — visible uniquement membres agence)
/dashboard/abonnement          → MonAbonnement (pro) — bloqué pour agents agence
/dashboard/compte              → Compte ou ComptePro (champs entreprise verrouillés pour agents agence)
/dashboard/support             → Support
/rapport?id=XXX                → RapportPage
/rapport/partage/:token        → RapportPartagePage (lien public sans compte)
```

---

## 💳 Système d'abonnement Pro Stripe — État actuel (✅ stable)

**Le système Stripe pro est entièrement opérationnel et testé en live**.

### Flow d'upgrade (paiement immédiat)
- `proration_behavior: 'none'` + `billing_cycle_anchor: 'now'` → cycle redémarre, plein tarif facturé immédiatement
- `payment_behavior: 'default_incomplete'` → permet de gérer 3DS, carte refusée, etc.
- 4 cas gérés côté backend : paiement direct OK, 3DS demandé, Carte refusée, Paiement en cours
- **Sécurité backend** : webhook `customer.subscription.updated` vérifie `latest_invoice.status === 'paid'` AVANT de cumuler les crédits

### Flow de downgrade (Stripe Subscription Schedule)
- Création d'un `subscription_schedule` via `from_subscription` → bascule programmée à `current_period_end`
- Mode `cancel_scheduled_change` permet d'annuler une bascule programmée
- Stockage BDD dans colonnes `pro_subscriptions.scheduled_plan_change` + `scheduled_change_date`

### Auto-conversion démo → actif (V8)
- Quand un pro `pro_status='demo'` souscrit un abonnement Stripe → passage auto à `pro_status='active'` + `pro_demo_converted_at`
- Bandeaux démo (orange + bleu) disparaissent automatiquement

### 🆕 Sync agence dans le webhook (V9 — 28 mai)
- Quand un responsable d'agence paie le plan Agence (149,90€) → webhook met `agences.nb_users_max=3` et `agences.status='active'`
- Recharge le pool de crédits agence : `agences.credits_complete=15`, `agences.credits_document=30`
- Le bloc "En attente de souscription" disparaît automatiquement dans le dashboard
- Permet aux 2 agents d'être invités par le responsable

### ⚠️ Bug paiement Stripe (NON résolu, workaround manuel)

**Symptôme** : `stripe_payment_id = NULL` dans `payments` pour les paiements d'upgrade (Starter, Power) → webhook `charge.refunded` ne peut pas matcher.

**Décision Alex** : ne pas refondre maintenant. Workflow manuel : SQL UPDATE quand remboursement fait dans Stripe.

---

## 🏛 Plan Agence V2 multi-utilisateurs — LIVRÉ (28 mai 2026) ⭐

**Modèle V2** : 1 responsable invite jusqu'à 2 agents (3 utilisateurs max) avec **logins séparés**, pool de crédits **partagé**, dossiers **visibles par tous** en lecture libre, facturation centralisée.

### Structure BDD

**Tables créées** :
- `agences` (id, raison_sociale, siret, adresse, plan, nb_users_max, status, credits_complete, credits_document, **credits_complete_bonus**, **credits_document_bonus**, email_contact, telephone, created_at, updated_at) — les `*_bonus` (ajoutées 22 juin) = crédits offerts durables, hors quota mensuel, jamais effacés au renouvellement
- `agence_members` (id, agence_id, user_id, role, joined_at, removed_at, last_active_at, color_hex)
- `agence_invitations` (id, agence_id, email, token, status, invited_by, invited_by_name, created_at, expires_at, accepted_at, cancelled_at, resend_count)
- `agence_credit_grants` (id, agence_id, granted_by, credit_type, quantity, reason, created_at) — **log des crédits offerts** au pool bonus (ajoutée 22 juin). RLS : membres voient leur agence, admin via `is_admin()`. Écriture via service_role (edge function)
- `envois_rapports` (id, agence_id, sent_by, analysis_id, recipient_email, sent_at)
- `dossier_notes` (id, agence_id, folder_id, user_id, content, deleted_at, created_at)

**Colonnes ajoutées** :
- `analyses` : `agence_id`, `created_by_user_id`, `deleted_at`, `deleted_by`, `last_viewed_by`
- `profiles` : `agence_id`, `agence_role` ('responsable' | 'co_responsable' | 'agent')
- `pro_folders` : `agence_id` (avec trigger auto-fill `set_folder_agence_id` à création)

### Rôles & permissions

| Action | Responsable 👑 | Co-resp 🤝 | Agent 👤 |
|---|---|---|---|
| Inviter / retirer / promouvoir des membres | ✅ | ✅ | ❌ |
| Voir & gérer facturation | ✅ | ✅ | ❌ |
| Modifier infos entreprise (raison sociale, SIRET) | ✅ | ✅ | ❌ |
| Voir tous dossiers agence (lecture libre) | ✅ | ✅ | ✅ |
| Créer ses propres dossiers | ✅ | ✅ | ✅ |
| Ajouter acheteur sur tout dossier | ✅ | ✅ | ✅ |
| Envoyer rapport au client | ✅ | ✅ | ✅ |
| Ajouter vendeur / nouvelle analyse / modif dossier autre | ✅ | ✅ | ❌ (étape C2 à faire) |
| Supprimer dossier | ✅ | ✅ | ❌ |

**Règle** : au moins 1 responsable toujours présent (trigger SQL `protect_last_responsable`). Soft delete pour ancien membre (snapshot du nom préservé). Invitation expire en 7 jours, valable une fois.

### Fonctions SQL clés
- `my_agence_id()` — SECURITY DEFINER pour casser la boucle RLS infinie. Toutes les policies basées sur cette fonction
- 🆕 `set_analyse_agence_fields()` (23 juin) — **trigger BEFORE INSERT sur `analyses`** : pose auto `created_by_user_id = user_id` + `agence_id` (agence du créateur via `agence_members`). Indispensable pour que la fiche « Mon équipe » remonte les analyses par membre. Miroir de `set_folder_agence_id`.
- ⚠️ **Crédits agence (réalité depuis 22 juin)** : les fonctions LIVE sont les **v1 sans suffixe** `get_pro_credits_balance` / `consume_pro_credit` / `refund_pro_credit`, **rendues agence-aware via `agence_members`**. Les variantes `_v2` existent mais **ne sont appelées NULLE PART**. Ordre conso agence : pool → bonus (`credits_*_bonus`) → unitaires perso du membre. Voir section « Architecture crédits » + session 22 juin.
- `get_visible_analyses()` — retourne analyses agence + perso
- `create_agence_invitation()` — crée une invitation token
- `accept_agence_invitation()` — accepte (crée membre + pro_invitations pour badge "Compte activé")
- `remove_agence_member()` — soft delete avec snapshot

### Edge Functions livrées

- `send-agence-invitation` : envoie mail Mailjet HTML responsive avec lien `/accept-invitation?token=xxx`
- `accept-agence-invitation` : 2 actions (`verify` au chargement + `accept` création compte)
- `stripe-webhook-pro` V9 : recharge pool agence si plan=agence
- `admin-user-management` v3 : création auto entité agence si `pro_profile_type=agence`

### Frontend Dashboard Pro (DashboardProPage.tsx)

- **Sidebar dynamique** via `getProNavGroups(agenceRole)` :
  - "Mes dossiers" devient **"Dossiers de l'agence"** pour membres
  - Onglet **"Mon équipe"** visible pour membres (icône Users bleue)
  - Onglet **"Mon abonnement"** masqué pour agents
- **Vue dossiers** : badge "Créé par 👑/🤝/👤 X" sur cartes (grid + liste) et dans le header du détail dossier
- Filtre par auteur (Tous / Mes dossiers / Par membre) + recherche cross-membres
- **Agents bloqués** sur : page abonnement (redirige vers "Géré par votre agence"), modif entreprise, bouton "Demander une modification"
- Bandeau bleu "Informations gérées par votre agence" dans Mon compte
- Inputs verrouillés affichent `—` au lieu de placeholders fantômes
- ComptePro `isLocked = pro_onboarding_done || isAgent`
- Route `/dashboard/equipe` + `/accept-invitation` ajoutées dans App.tsx

### Page Mon équipe (MonEquipePage.tsx — nouveau fichier ~983 lignes)

- Liste membres + invitations en cours + bouton inviter (responsable uniquement)
- Bandeau bleu foncé avec rôle + places restantes + crédits agence
- Clic sur membre → **fiche détail** avec :
  - Header dégradé avec nom, rôle, dates
  - 4 KPIs : Analyses créées · dont complètes · Dossiers créés · Rapports envoyés
  - Graphique d'activité 8 semaines (bars dégradées)
  - Liste des 10 dernières analyses cliquables (ouvre `/rapport?id=...`)
  - Actions admin en bas (Promouvoir / Rétrograder / Retirer)
  - Bouton "Retour à mon équipe"

### Frontend Admin (AdminPage.tsx)

- `agenceInfoByUser` (Map) chargée dans `loadClients`
- Badges 👑/🤝/👤 à côté du nom + "Agence X · Rôle" sous email dans cartes
- Fiche client : bandeau bleu agence avec liste cliquable des autres membres
- Filtre "Agence" inclut tous les membres (responsable + co-resp + agents)
- Filtre "Autre" exclut les membres d'agence
- ✅ **Regroupement visuel par agence (header doré dépliable + membres indentés)** — RÉSOLU le 22 juin. Le code était bon ; cause = RLS (`agences` / `agence_members` sans policy admin). Fix = policies SELECT `is_admin()` sur les deux tables. + Vue détail agence complète, analyses cliquables paginées, filtre « Agences (N · M comptes) », bouton « Voir l'agence ». Voir session 22 juin.

### CGV Pro

Article 4.5 ✅ **mis à jour le 23 juin** pour V2 multi-utilisateurs (la V1 mentionnait à tort "login partagé" — corrigé en "chacun son propre accès" + fonctionnement détaillé + au-delà de 3 sur devis).

### UUIDs de test

| Élément | UUID / Email |
|---|---|
| Agence Julio (test) | `43ac0ae5-2dfc-4f0e-9ce9-647335a84cb2` |
| Julio (responsable) | `202c9334-3c92-4707-9f98-c6d75beecf0e` · `publicite92320@gmail.com` |
| Julia Guery (agent) | `bba54a94-a405-4c88-9fac-e429b9d099db` · `verimo75000@gmail.com` |

---

## 📜 Système CGV Pro popup obligatoire (✅ DÉPLOYÉ)

**Concept** : popup obligatoire de consentement aux CGV Pro avant le 1er paiement pro. Une fois acceptée → jamais redemandée.

### Fichiers
- `src/lib/cgv-version.ts` — constante `CURRENT_CGV_PRO_VERSION = "v2.3"`
- `src/components/CgvProConsentDialog.tsx`
- `src/pages/DashboardProPage.tsx` — Helper `requireCgvThen(actionLabel, paymentAction)`

---

## 🆕 Système de demande de rappel pro (✅ DÉPLOYÉ)

**Concept** : Bouton "Je souhaite être rappelé" pour les pros qui hésitent à s'abonner ou veulent un devis agence. Notification admin + email instantané.

**Composants** :
- `src/components/CallbackRequestModal.tsx`
- `supabase/functions/notify-callback/index.ts`
- Table `callback_requests` + onglet admin "Rappels Pro" + bloc dans fiche client

---

## 📊 Architecture crédits

### Sources de crédits pro
Lues par sidebar et NouvelleAnalyse via `get_pro_credits_balance(p_user_id)` qui agrège :
1. **Abonnement** → `pro_subscriptions` (ou, si membre d'une agence, le **pool partagé** `agences.credits_complete/document` + le **bonus** `credits_*_bonus`). Agence-aware via `agence_members` (réécriture 22 juin — voir session). Ordre de conso agence : pool → bonus → unitaires perso.
2. **Achats unitaires** → `pro_unit_purchases`
3. **Crédits offerts (solo)** → `credit_grants` + trigger `apply_credit_grant`
4. **Crédits offerts (agence)** → pool bonus `agences.credits_*_bonus`, tracés dans `agence_credit_grants` (écrits par l'edge function `admin-user-management` action `grant_agence_credits`, service_role)

### Sources de crédits particulier
Stockés directement dans `profiles.credits_document` et `profiles.credits_complete`.

### Fonctions SQL crédits
- **Consommation pro** : `consume_pro_credit(p_user_id, p_credit_type)` — agence-aware (pool → bonus → perso)
- **Consommation particulier** : `consume_particulier_credit(p_user_id, p_credit_type)`
- **Remboursement crédit interne pro** : `refund_pro_credit(p_user_id, p_credit_type)` — agence-aware (rembourse au pool)
- **🔒 Remboursement idempotent (3 juillet)** : `refund_analyse_credit(p_analyse_id)` — SECURITY DEFINER. Lock `FOR UPDATE` + flag `analyses.credit_refunded` → rembourse **une seule fois**, jamais sur `completed`, route pro (`refund_pro_credit`) vs particulier (`profiles +1`). Appelée par le **client** (NouvelleAnalyse, post-lancement), **analyser-run** et le **watchdog**. Grants : authenticated + service_role.
- **Reset cycle abo** : `reset_pro_subscription_credits(p_subscription_id)` — gère le plan `agence` (recharge pool, cumul plafonné 2× = 30/60, bonus intact) depuis le 22 juin
- **Cumul upgrade** : `upgrade_pro_subscription_credits(p_subscription_id, p_new_plan)`
- **Incrément promo** : `increment_promo_uses(code_id)`

### 🔄 Affichage crédits en direct (bus d'événement — 3 juillet)
- Problème : chaque appel `useCredits()` crée un état SÉPARÉ → la nav (DashboardPage) ne voyait pas le débit fait par la page d'analyse (NouvelleAnalyse). Le compteur ne baissait qu'au refresh.
- Fix : événement global **`window 'verimo:credits-changed'`**. Émis à chaque conso/remboursement (useCredits.deductCredit, conso pro dans NouvelleAnalyse, remboursements). Écouté par `useCredits` (nav particulier) ET `DashboardProPage` (nav pro, refetch `get_pro_credits_balance`) → **rafraîchissement live sans refresh**. Confirmé en prod.

### Contraintes BDD importantes
- `analyses.credit_refunded` : BOOLEAN default false — verrou de remboursement idempotent (ajouté 3 juillet)
- `pro_unit_purchases.type` : CHECK `('document', 'complete')`
- `credit_grants.credit_type` : CHECK `('complete', 'document')`
- `pro_unit_purchases` avec `amount=0` = crédits offerts admin → exclus du CA
- `analyses.status` : CHECK autorise `pending, processing, queued, completed, failed`
- `profiles.pro_status` : TEXT nullable (`'demo'` | `'active'` | `null`)
- `profiles.agence_id` : UUID nullable, FK vers `agences(id)` ON DELETE SET NULL
- `profiles.agence_role` : TEXT (`'responsable'` | `'co_responsable'` | `'agent'`)
- `callback_requests.status` : TEXT default 'pending' (`'pending' | 'called' | 'converted' | 'declined'`)

---

## 📐 Règles de notation — Score /20

**Appartement / Copropriété** (`recalculerCategories`, inchangé) :

| Catégorie | Max |
|-----------|-----|
| Travaux | 5 pts |
| Procédures | 4 pts |
| Finances | 4 pts |
| Diagnostics privatifs | 4 pts |
| Diagnostics communs | 3 pts |
| **TOTAL** | **20 pts** |

**Maison hors copro / ASL** (`recalculerCategoriesMaison`, ajouté 26 juin) :

| Catégorie | Max |
|-----------|-----|
| Performance énergétique | 5 pts |
| Diagnostics & sécurité | 5 pts |
| Assainissement & risques | 4 pts |
| Travaux & bâti | 3 pts |
| Juridique (ou « ASL & lotissement » si en ASL) | 3 pts |
| **TOTAL** | **20 pts** |

> 🆕 25/07 — **Statut fonds travaux (copro)** : recalcul déterministe MILLÉSIME-AWARE. Priorité : % voté en AG (résolution adoptée = conforme dès 5 %, jamais pénalisée) → ratio cotisation/budget du MÊME exercice (`budgets_historique`) → millésimes différents sans correspondance = statut IA conservé. Montant absent + % voté → reconstitué. Impact score : excellent +1,5 / bien +1 / conforme +0,5 / insuffisant −0,5 / absent −1 (inchangé).

> Branche `if (!isCopro) return recalculerCategoriesMaison(...)` en tête de `recalculerCategories`. Le chemin copro est **strictement inchangé**. Différence clé : pour la maison, le **score global est recalculé** = somme des 5 catégories (la copro, elle, conserve le score du LLM). Détail complet dans la section dédiée plus bas.

---

## ⚙️ Architecture ANALYSE — ÉTAT ACTUEL (vérifié dans le code le 25 juillet) ⭐⭐⭐

> Source de vérité = le code du repo, relu intégralement le 25/07. Remplace les anciennes sections « MAP-REDUCE 03 juin » et « CHANTIER 400 SECONDES » (résolu — historique condensé en bas de section).

### Pipeline
1. **`analyser` (étape 1)** : télécharge les PDFs du bucket `analyse-temp`, upload Files API. Surcharge Anthropic à l'upload → **queue v9** (`tryEnqueueOrFail` : `status='queued'` + `metadata_queue` {storagePaths, mode, profil, existingReport} + fichiers CONSERVÉS en Storage) ; sinon `files_ready` puis fire-and-forget vers analyser-run. Mode complément : rapport existant lu en base, deadline 7 j serveur, cap 5 docs, one-shot serveur, gratuit. Tamponne `last_retry_at` (anti-watchdog).
2. **`analyser-run` (étape 2)** — aiguillage : `mode='complete'` **ET ≥ 6 docs** (`SEUIL_MAP_REDUCE = 6`) → **MAP-REDUCE v2** ; sinon (dont `document` et `complement`, toujours) → **single-call v7**.
   - **MAP** : lecture parallèle de tous les docs, résumé **texte libre concis** par doc (préférence Alex, pas de grille JSON), suppression du PDF Files API au fil de l'eau (RGPD) APRÈS sauvegarde du résumé en base (`map_resultats` jsonb), progression `done/total`.
   - **REDUCE** (self-invoke, service-role) : empile les résumés, 1 appel avec `buildSystemPrompt('complete')`, post-traitement déterministe, écrit `result`, nettoie `map_resultats`, notifie (cloche + email particulier).
   - **Post-traitement déterministe** (tous modes complets) : `retryDpeCarrez` (mini-appel ciblé si DPE E-G sans recos ou Carrez sans détail pièces), `recalculerCategories` (copro — score = somme des 5 catégories) / `recalculerCategoriesMaison` (maison/ASL), `validateDiagsManquants`.
3. **Échec** : `handleAnalyseFailure` — analyse classique → refund idempotent (`refund_analyse_credit`, verrou `credit_refunded`) + `failed` + notif ; **complément → 0 refund + `completed` restauré + marqueur** (25/07).
4. **Filets** : cron `analyser-retry` (5 min, 12 tentatives ≈ 1h, réupload depuis Storage, relance analyser-run avec mode+existingReport, abandon propre) ; cron `watchdog-stuck-analyses` (15 min, seuils 60/30/90 min sur created_at **ET** last_retry_at).

### Points de vigilance connus (backlog)
- **Doc en échec après 3 retries = sauté silencieusement** du REDUCE (aucun signalement client). Décision A/B/C toujours en attente (Alex penche C : reprise par queue au bon endroit).
- **Mort brutale d'invocation** (kill plateforme ~400 s) : rien n'attrape → coincée en processing jusqu'au watchdog (1h max). Plan heartbeat (colonne `last_heartbeat` + cron 3 min) validé, non codé. Le tampon `last_retry_at` (25/07) protège du faux-positif inverse (tuer une saine), pas de la lenteur de détection.
- **Complément = single-call toujours** : rapport JSON (gros si dossier MAP-REDUCE) + 5 PDFs max. Le cap 5 protège ; très gros dossier + 5 gros PDFs peut frôler le timeout 385 s → mais l'échec est désormais PROPRE (rapport restauré + invitation à réessayer).
- **Estimation de durée** basée sur le nb de docs seulement (un PDF de 200 p compte comme un de 3 p) — inchangé du 24/07.

### Historique condensé (pour mémoire)
- **03/06** : MAP-REDUCE v18 (tranches de 3 docs, résumés « exhaustifs » 64K) livré → **04/06 : retour single-call** (v18 plus LENT : les résumés dilataient l'info). **25/06** : v18 retiré du repo.
- **02-03/07** : mesure du mur single-call (11 docs = timeout 386 s, EarlyDrop, CPU/mémoire bas → goulot = génération). Plafond ≈ 10 docs. Timeout 350→385 s (pansement).
- **Session suivante** : **MAP-REDUCE v2 hybride à seuil** construit et déployé — la version décrite ci-dessus, avec le défaut v18 corrigé (résumés libres CONCIS ~1 page, pas exhaustifs). C'est l'architecture en prod aujourd'hui.

---

## 🏘️ Support ASL / AFUL / Union d'ASL — LIVRÉ (25 juin 2026) ⭐⭐

> Structures de gestion d'ensemble **hors copropriété** (ordonnance de 2004, et non la loi de 1965) : ASL (Association Syndicale Libre), AFUL (Association Foncière Urbaine Libre), Union d'ASL. Présentes dans les lotissements (maisons) et grands ensembles. Un bien peut être : **copro seule**, **ASL seule** (maison de lotissement), ou **copro + ASL**. Gouvernance propre (président + syndicat collégial, gestion bénévole OU professionnelle), répartition en **quotes-parts** (pas tantièmes), **PAS de fonds ALUR**. Vocabulaire à ne jamais confondre avec la copro. AFUL/Union détectées et ventilées comme l'ASL, mais avec leur **libellé EXACT** (ne jamais écrire « ASL » pour une AFUL).

### Modélisation (zéro SQL — tout vit dans le JSON résultat)
- **Mode `document` (analyse simple)** : 2 nouveaux types détectables — `ASL_CHIFFRES` (PV d'AG ASL, cotisations, budget, état des cotisations) et `ASL_REGLES` (statuts, cahier des charges, règlement de lotissement). Schémas JSON + règles d'extraction ajoutés dans `buildDocumentPrompt`.
- **Mode `complete` (analyse complète)** : 2 champs ajoutés au JSON — `vie_asl { present, structures[] }` (une structure par association, forme fusionnée chiffres + règles) et `asl_mentionnee { detectee, statut: en_place|en_creation, source }` (cas d'une ASL citée dans un doc copro sans qu'aucun document ASL ne soit fourni).
- Champs clés extraits : **conformité 2004** (statuts publiés O/N — fragilise le recouvrement des cotisations si non), **voirie/rétrocession** (coût caché à vie si non rétrocédée à la commune), **contraintes d'urbanisme** du cahier des charges (s'imposent au-delà du PLU : clôtures, extensions…), **équipements lourds**, gestion bénévole/pro, **cotisation annuelle** (= charge réelle EN PLUS de la copro). Le score copro (`recalculerCategories`) reste **inchangé** — aucune régression.

### Les 3 Lots
- **Lot 1 — `analyser-run/index.ts`** (Edge Function) : 5 ajouts **additifs** au prompt single-call v7 (taxonomie + 2 schémas ASL en mode document ; enum `documents_analyses` + blocs `vie_asl`/`asl_mentionnee` + bloc de règles ASL en mode complete). 2089 → 2100 lignes, 100 % additif. ✅ poussé GitHub — ⚠️ **redéploiement Supabase Studio requis (manuel)**.
- **Lot 2 — `DocumentRenderer.tsx`** (frontend) : 2 fiches riches `RendererAslChiffres` + `RendererAslRegles` (KPI cotisation/budget/fonds, gouvernance, bloc conformité 2004 vert/rouge, alertes voirie & solde vendeur, contraintes, servitudes, équipements) + 2 cas dans le `switch`. Sert l'analyse simple + la visionneuse admin. Badge au type EXACT (ASL/AFUL/Union). ✅ poussé.
- **Lot 3 — `RapportPage.tsx`** (frontend) : onglet **ASL** conditionnel (icône `Landmark`) — n'apparaît QUE si `vie_asl.present` (avec structures) OU `asl_mentionnee.detectee` ; sinon le rapport est **identique à avant**. Composant `TabAsl` (une carte riche par structure, helpers `KpiBand`/`SectionTitle`) + **mode dégradé** « documents ASL manquants » (bandeau orange + liste à réclamer au vendeur). Ajouté dans les **2 vues** (`RapportViewExemple` + vue principale). 100 % additif. ✅ **LIVRÉ — à pousser sur GitHub.**

### 3 configurations d'affichage (analyse complète)
- **Copro seule** → onglet Copropriété, pas d'onglet ASL.
- **Copro + ASL** → les deux onglets.
- **Maison/lotissement en ASL seule** → onglet ASL, pas d'onglet Copropriété.
- ⚠️ **Indépendance** : l'onglet Copropriété reste piloté par `type_bien` (via `isCoproType`), pas par la présence de docs → un appartement avec ASL mais peu de docs copro **garde** son onglet Copropriété (mode dégradé « docs manquants »). L'onglet ASL est calculé séparément (`hasAsl`), jamais lié à `hasCopro`.

### Reste à faire
- **Pousser `RapportPage.tsx`** sur GitHub (Lot 3) + **redéployer `analyser-run`** dans Supabase (Lot 1).
- **Test E2E** : analyse simple sur doc ASL → fiche remplie (pas « AUTRE ») ; analyse complète avec doc ASL → onglet ASL ; analyse complète SANS ASL → rapport **identique** à avant (aucun onglet ASL).
- Optionnel plus tard : scoring fin de l'ASL sur le volet Finances (différé, non codé).

---


## 🏡 Scoring MAISON hors copro / ASL — LIVRÉ (26 juin 2026) ⭐⭐⭐

> Une maison ne se note plus comme un appartement. Avant, le score /20 était 100 % copro-centré : une maison hors copro plafonnait ~17/20 (Finances copro 2/4 + Diags communs 2/3 par défaut), et l'ASL n'était pas notée. Désormais une **grille dédiée maison** s'applique dès que `type_bien` ≠ copro (`type_bien` ∉ {appartement, maison_copro}). **La copro est 100 % inchangée** (branche `if (!isCopro)` en tête de `recalculerCategories`). Livré en 3 étapes.

### Grille maison — 5 catégories /20 (toutes pénalités finales, jamais de 0,3)
- **1. Performance énergétique (5)** : note directe de la classe DPE — A/B→5, C→4,5, D→4, E→3, F→2, G→1. Audit énergétique absent si E/F/G → −1. Aucun DPE → 0.
- **2. Diagnostics & sécurité (5)** : élec/gaz/amiante/plomb/termites. Part de 5. Diag obligatoire manquant −0,75 (selon l'année). Anomalie mineure −0,5, grave −2 (élec dangereuse, gaz A2, amiante/plomb dégradé), **termites −3**. Plancher 1 si ≥1 diag, 0 si aucun. (Garde-fou : « aucune anomalie » sur l'élec ne pénalise pas — guard `electroOk`.)
- **3. Assainissement & risques (4)** : non collectif non conforme −1,5 ; non collectif sans contrôle SPANC −0,5 ; ERP travaux prescrits −0,5. Collectif (tout-à-l'égout) = aucun malus. Aucune donnée = neutre 2/4.
- **4. Travaux & bâti (3)** : base neutre 2. Travaux majeurs récents documentés +1 (toiture/chauffage/isolation…), autres +0,5. Garantie décennale possible +0,5 (« à confirmer »). État dégradé déclaré −1. Aucun doc → reste 2 + encart d'invitation.
- **5. Juridique (3)** — devient **« ASL & lotissement »** si en ASL. Hors ASL : servitude contraignante −0,5 (max −1,5), urbanisme fort (ABF/zone protégée) −0,5, procédure −1 à −2. En ASL : statuts non publiés (conformité 2004) −1, voirie non rétrocédée −1, contraintes cahier des charges −0,5. Cotisation ASL affichée mais **jamais pénalisée** par son montant.
- **Score global maison = somme des 5 catégories** (arrondi 0,5). ⚠️ C'est la **différence avec la copro**, où le score reste celui du LLM et seules les catégories sont recalculées. Pour la maison, score ET catégories sont recalculés → cohérence garantie.

### Étape 1 — `analyser-run/index.ts` (Edge Function), 100 % additif
- Nouveau type de doc **`HISTORIQUE_TRAVAUX`** (devis / facture / attestation d'entreprise) : taxonomie de détection + schéma JSON + règles en **mode document** ; ajouté à l'enum `documents_analyses` en **mode complete**.
- Nouveaux champs au JSON complet : **`historique_travaux { present, entreprise{nom,siret,contact,assurance_decennale}, travaux[], montant_total, date_plus_recente, garantie_decennale_possible }`** et **`assainissement { present, type_reseau:collectif|non_collectif, conforme, date_controle, observations }`** + règles d'extraction maison (assainissement, servitudes du compromis, garantie décennale < 10 ans « à confirmer »).
- Fonction **`recalculerCategoriesMaison(rapport, _profil, anneeNum)`** insérée avant `recalculerCategories` + branche `if (!isCopro) return …`. Audit détecté via `documents_analyses` (AUDIT_ENERGETIQUE) ; ASSAINISSEMENT/AUDIT déjà dans l'enum docs (pas touché à l'enum `diagnostics[]`).
- Validé : typecheck full-file 0 erreur (Deno stubbé), scénarios — maison parfaite→20, problèmes→5, ASL→16, mince→15,5.
- ⚠️ **Redéploiement Supabase Studio manuel requis** (le push GitHub ne déploie pas les Edge Functions).

### Étape 2 — Frontend rapport
- **`RapportPage.tsx`** : libellés + icônes des 5 catégories maison dans la Synthèse (juridique → « ASL & lotissement » + icône 🏘 si `vie_asl.present`) ; garde-fou faux-zéro étendu à `diags_securite` ; tooltip « i » sur l'audit énergétique (texte E/F/G) ; **3 sections dans l'onglet « Ma maison »** — Assainissement (gated `type_bien==='maison'` + present), Servitudes & urbanisme (gated `compromis.servitudes.length>0`), Travaux réalisés (fiche entreprise + liste + montant total + bloc garantie décennale ; encart d'invitation si vide).
- **`DocumentRenderer.tsx`** : fiche **`RendererHistoriqueTravaux`** (entreprise, SIRET, assurance décennale, travaux, garantie) + `case 'HISTORIQUE_TRAVAUX'` dans le switch. Sert l'analyse simple + la visionneuse admin (qui ouvre `/dashboard/rapport?id=…`).
- **`RapportPrintPage.tsx`** : libellés catégories maison dans le PDF/print.

### Étape 3 — Pédagogie
- **`MethodePage.tsx`** (public, mot « IA » banni — respecté) : nav restructurée en 2 groupes — **Appartement · Copropriété** (contenu existant intact) et **Maison hors copro · ASL** (8 documents, 5 catégories avec pénalités, exemple concret pavillon→18,5). Bannières de groupe, en-têtes dans la nav latérale, scroll-spy adapté (ignore les en-têtes). 2 FAQ maison ajoutées.
- **`Aide.tsx`** (dashboard, **partagé pro + particulier**) : bloc Notation — **bascule 🏢 Copropriété / 🏡 Maison · ASL** sur les onglets Bonus & Pénalités (données `penaltiesMaison`/`bonusesMaison`). L'onglet Échelle reste commun. Les 3 onglets existants (Échelle/Bonus/Pénalités) sont inchangés.

### ⚠️ Ordre de déploiement (IMPÉRATIF)
1. **Front d'abord** : pousser `RapportPage.tsx`, `DocumentRenderer.tsx`, `RapportPrintPage.tsx`, `MethodePage.tsx`, `Aide.tsx` sur GitHub → Vercel auto-deploy.
2. **Ensuite seulement** : redéployer `analyser-run` dans Supabase Studio.
- Ne JAMAIS déployer l'Edge Function avant le front : sinon une analyse maison produirait des clés de catégories (`perf_energetique`…) que le front ne saurait pas libeller (dégradation gracieuse, mais moche).

### Reste à faire
- Pousser les 5 fichiers front + redéployer `analyser-run`.
- **Test E2E maison** : analyse complète d'une maison hors copro → 5 catégories maison + score = somme ; devis seul → fiche `HISTORIQUE_TRAVAUX` (pas « AUTRE ») ; maison en ASL → catégorie « ASL & lotissement » + onglet ASL.
- Revue éditoriale du contenu public maison sur la page Méthode (formulations).

---


## ⏳ Backlog — En attente

### 🔥 Priorité haute (avant lancement public Pro)

1. **🔴 Régénérer service_role key** (compromise screenshots 11 mai) + recréer le cron avec la nouvelle clé — **SEUL must-do certain avant onboarding de vraies agences** (audit 23 juin). Toujours ouvert.
2. **⚠️ Doc sauté silencieusement (MAP-REDUCE)** — un doc en échec après 3 tentatives est retiré du REDUCE sans signalement client. Décision A (échec global) / B (partiel signalé) / C (reprise par queue — préférence Alex) en attente.
3. **🟠 Watchdog : réduire les seuils** (processing 1h → ~10-15 min + cron plus fréquent) et/ou heartbeat. Le tampon `last_retry_at` (25/07) a réglé les faux positifs ; reste la lenteur de détection des vraies morts brutales.
4. **Étape C2 — Permissions fines DossierDetail** : bloquer ajout vendeur / nouvelle analyse / modif titre pour non-créateurs ; garder ajout acheteur + envoi rapport pour tous.
5. **🟠 Durcir l'auth `analyser` / `analyser-run`** (audit 23 juin) : getUser() + contrôle de propriété dans `analyser`, secret interne pour `analyser-run`. Le code est dans le repo (single-call v7 hybride) → durcir directement.
6. **🟠 CORS wildcard (`Access-Control-Allow-Origin: *`) sur les edge functions** — vérifié dans le code le 25/07 (watchdog, retry, analyser…). À restreindre à verimo.fr quand on durcit l'auth. (+ audit de juillet : remplacer `Math.random()` par `crypto.getRandomValues()` pour les jetons — à confirmer/localiser.)
7. **Tests E2E** : cycle pro complet (souscription → upgrades → downgrade → unitaire → remboursement) + agence complet (création → invitation 2 agents → dossiers partagés → analyse agent → rapport envoyé).
8. **Custom text Stripe Dashboard** (mention CGV Pro au checkout) + liens CGV Pro footer/dashboard + validation CGV Pro par avocat (300-500 €) + test résiliation immédiate.

### Court terme
11. **SEO : soumettre les 23 guides manquants** dans Search Console (~10/jour — 24 indexés / 47, les 4 piliers non indexés en tête ; Alex a repris le 24/07). + `noindex` sur `/dashboard/nouvelle-analyse` (Disallow ne suffit pas), lastmod sitemap figés au 6 mai
12. **Réactiver le cron `sync-stripe-payments`** quand vieux paiements problématiques expirés
13. **Fix bug racine webhook** : remplacer `if (existing) update else insert` dans `upsertProSubscription` par `.upsert({ onConflict: 'stripe_subscription_id' })` atomique
14. **Fix bug `stripe_payment_id = NULL`** sur upgrades
15. **Fix bug scope `supabase`** dans webhook particulier (ligne 142)
16. **Code promo lancement** "1 analyse offerte" pour campagnes marketing
17. **DPA / Annexe RGPD article 28** (obligatoire dès qu'une agence sérieuse réclame)
18. **Section 11.4 Force majeure** à ajouter dans CGV Pro
19. **Article 7.4 usages interdits explicites** dans CGV Pro
20. **Branding Stripe Checkout** : logo + couleurs + domaine `pay.verimo.fr`
21. **Rate limiting** (faille #7 audit sécurité) avant 1ère grosse campagne pub
22. **Bannir le mot "co-brandé/co-branding" du site** progressivement
23. **Animation fluide transitions onglets dashboard PRO**
23b. 🆕 **Type `AnalyseDB.status` incomplet** (`src/lib/analyses.ts`) : ajouter `'files_ready' | 'queued'` (statuts réels depuis la queue v9) — a cassé un build Vercel le 25/07 (TS2367), contourné par String() dans RapportPage

### Moyen terme
24. **Session lifecycle pro complète** (suspendre / résilier / past_due / suppression user / badges admin)
25. **Personnalisation rapports Power "à votre image"** (logo pro + nom agence sur RapportPage et RapportPartagePage — 2-3h dev, infra à 70%)
26. **Bug "Erreur d'affichage" sur l'onglet Compromis** dans RapportPage
27. ~~UX "Compléter mon dossier"~~ ✅ pédagogie traitée le 23/06 + **blindage complet le 25/07** (voir dernière session). Reste seulement le micro-cas coupure réseau entre upload et lancement (faux « Rapport prêt ! », sans gravité — refaire suffit)
28. **Popup bienvenue pro 1ère connexion** (onboarding)
29. **Veille réglementaire** prompt analyser-run
30. **Compare Verimo redesign verdict**
31. **Mailjet tracking erreurs**
32. **Admin support inbox redesign** (split-view dans AdminPage.tsx)
33. **Mode clair/sombre toggle global**

### Pages métier
34. **`/pro/investisseurs`** : landing dédiée
35. **`/pro/marchands`** : landing dédiée
36. **`/pro/notaires`** : landing dédiée

### Stratégique pro
37. ~~**Compte Agence V1 (login partagé, 149,90€)**~~ ✅ **LIVRÉ le 27 mai 2026**
38. ~~**Compte Agence V2 multi-utilisateurs**~~ ✅ **LIVRÉ le 28 mai 2026**
39. **B2B targeting mandataires indépendants** (IAD, Capifrance, SAFTI)
40. **Speak to 10 real pro prospects** avant de coder pro-specific features
41. **Projections honnêtes** : 25k€ MRR sur 18-24 mois, mix solo + agences

### Infra
42. **Vérifier upgrade Supabase Compute NANO → MICRO** (gratuit avec plan Pro)
43. **SIRET sur factures unitaires**
44. **Toggles Stripe Checkout** : Politique remboursement / CGV / Coordonnées support

### Démarchage / funnel pro
45. **Créer un exemple de rapport Verimo anonymisé** en PDF
46. **Rédiger 3 email templates** de démarchage
47. **Argumentaire / objections-réponses** pour préparer les démos

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai-juillet 2026)

- **Session 25 juillet 2026 ⭐⭐⭐ : Fiabilisation — composition lots, blindage complément, comparaison financière, sticky bar, compteur, fonds travaux millésime** — voir « 🆕 DERNIÈRE SESSION » en tête de fichier.
- **Session 24 juillet 2026 ⭐⭐⭐ : UX/affichage + fiabilisation comparaison** (temps estimé figé, carnet d'entretien, points forts harmonisés, popup aide, ordre des biens figé + statut processing en base + barre flottante createPortal) + point SEO (24/47 indexés, 1 client venu via Claude) — voir section dédiée.

- **Session 26 juin 2026 ⭐⭐⭐ : Scoring MAISON hors copro / ASL (étapes 1-3)**
  - **Feature complète** — voir la section dédiée « 🏡 Scoring MAISON hors copro / ASL ». Grille maison à 5 catégories /20 (perf énergétique, diagnostics & sécurité, assainissement & risques, travaux & bâti, juridique/ASL), appliquée dès que `type_bien` ≠ copro. **Copro 100 % inchangée** (branche `if (!isCopro)`). Nouveauté vs copro : pour la maison, le **score global est recalculé** (= somme des 5 catégories), pas seulement les catégories.
  - **Étape 1** (`analyser-run`) : nouveau type doc `HISTORIQUE_TRAVAUX` (devis/facture), champs `historique_travaux` + `assainissement`, fonction `recalculerCategoriesMaison`. 100 % additif, typecheck 0 erreur, scénarios validés (parfaite→20, problèmes→5, ASL→16). **À redéployer Supabase.**
  - **Étape 2** (front rapport) : `RapportPage` (libellés catégories maison, 3 sections « Ma maison » : assainissement / servitudes / travaux+garantie décennale), `DocumentRenderer` (fiche `RendererHistoriqueTravaux`), `RapportPrintPage` (libellés PDF). **À pousser.**
  - **Étape 3** (pédagogie) : `MethodePage` (nav en 2 groupes copro/maison + contenu maison complet, « IA » banni respecté), `Aide` (bascule 🏢 Copro / 🏡 Maison sur Bonus & Pénalités). **À pousser.**
  - **Bug repéré & corrigé en cours de route** : faux positif « aucune anomalie » sur l'électricité (regex `/anomali/`) → guard `electroOk`. Décision : maison hors ASL → catégorie « Juridique » ; maison en ASL → « ASL & lotissement » (même clé `juridique`, libellé dynamique).
  - ⚠️ **Ordre de déploiement impératif** : front d'abord (Vercel), PUIS `analyser-run` (Supabase). Jamais l'inverse.

- **Session 25 juin 2026 ⭐⭐ : Support ASL / AFUL / Union d'ASL (Lots 1-3) + constat repo single-call**
  - **Feature ASL complète** — voir la section dédiée « 🏘️ Support ASL / AFUL / Union d'ASL ». Lot 1 (`analyser-run` : détection + extraction en modes document & complete, 5 ajouts additifs au prompt v7) ✅ poussé GitHub, **à redéployer Supabase** ; Lot 2 (`DocumentRenderer` : 2 fiches riches ASL_CHIFFRES/ASL_REGLES + 2 cas switch) ✅ poussé ; Lot 3 (`RapportPage` : onglet ASL conditionnel + `TabAsl` + mode dégradé, dans les 2 vues) ✅ livré, **à pousser**. **100 % additif** : un rapport sans ASL reste strictement identique à avant (aucun onglet ASL, aucun champ visible).
  - **Décisions de conception** : types dédiés (pas un flag perimetre) pour auto-exclure l'ASL du comptage/scoring copro ; AFUL & Union via le même cadre mais **libellé exact** ; onglet ASL indépendant de l'onglet Copropriété (3 configs : copro seule / copro+ASL / ASL seule) ; tout dans le JSON (zéro SQL).
  - **Constat repo** : le `analyser-run` du repo est bien le **single-call v7** (2100 lignes avec ASL) — le **MAP-REDUCE v18 n'est plus dans le repo**. Le tableau Edge Functions, la section MAP-REDUCE et le backlog ont été mis à jour en conséquence.

- **Session 23 juin 2026 ⭐⭐ : Fiche membre agence RÉPARÉE (SQL) + AUDIT SÉCURITÉ COMPLET + CGV Pro 4.5 + UX complément + fix layout Mon équipe**
  - **🔒 FICHE MEMBRE « Mon équipe » — RÉPARÉE (100 % SQL, zéro frontend).** Symptôme : depuis le compte responsable, cliquer sur un membre affichait « 0 analyse » pour tout le monde (KPIs + liste vides). **Diagnostic vérifié par requêtes prod** : la fiche filtre sur `analyses.agence_id` + `created_by_user_id`, or `agence_id` était rempli sur **0 / 38** analyses (et `created_by_user_id` sur 16 = vieux backfill historique, **aucun trigger actif**). `createAnalyse` ne posait ni l'un ni l'autre. **Fix livré et testé OK en prod :**
    - **BLOC 1 (trigger)** : `set_analyse_agence_fields()` (BEFORE INSERT on `analyses`, SECURITY DEFINER) → pose auto `created_by_user_id = user_id` + `agence_id` = agence dont le créateur est membre actif (`agence_members`, `removed_at is null`). Miroir du trigger `set_folder_agence_id` des dossiers. Particulier / pro solo → `agence_id` reste null (normal).
    - **BLOC 2 (backfill)** : `update analyses set created_by_user_id = user_id where null` + `update analyses a set agence_id = am.agence_id from agence_members am where am.user_id = a.created_by_user_id and removed_at is null`. Résultat vérifié : **38/38** creator, **1** agence.
    - **BLOC 3 (policy RLS agence) — JUGÉ INUTILE, NON FAIT.** Raison vérifiée dans le code : un pro est **obligé** de choisir un dossier avant de lancer (`NouvelleAnalyse` : `setStep(selectedFolder ? 'type_bien' : 'folder_select')`) → **aucune analyse pro n'existe hors dossier** → la policy folder-based du 22 juin (« Membres agence lecture analyses dossiers ») couvre déjà 100 % des lectures. Le `agence_id` manquant était le seul vrai chaînon cassé (pour le **filtre** d'affichage), pas la lecture. **Ne pas re-créer le bloc 3.**
    - **Cloisonnement confirmé** : le responsable voit uniquement les analyses de **SON** agence (`agence_id` = son agence + créateur membre), jamais celles d'autres agences/particuliers. Sain.
  - **🛡️ AUDIT SÉCURITÉ COMPLET (avant démarchage pro). Résultats :**
    - ✅ **Secrets** : aucune clé sensible dans le code. Seule clé en dur = clé `anon` (publique par design, OK). Aucun `service_role` / `sk_live` côté front. `.gitignore` + `.env.example` propres.
    - ✅ **Webhooks Stripe** (`stripe-webhook-pro` + `stripe-webhook`) : signature vérifiée (`constructEventAsync`) → paiements/remboursements infalsifiables.
    - ✅ **`admin-user-management`** : valide le vrai token (`auth.getUser()`) + rôle admin + propriété (401/403). Bon pattern.
    - ✅ **Prix 100 % cohérents** (frontend + edge functions) : particuliers 4,90/19,90/29,90/39,90 ; pro 19,90/49,90/89,90/149,90 ; unitaires 9,90/2,90 ; quotas Découverte 1+3 / Starter 5+15 / Power 10+30 / Agence 15+30 ; Price IDs Stripe alignés ; TVA appliquée. **Aucun tarif pro sur pages publiques.** Mot « IA » absent du public.
    - ✅ **RLS activée sur les 34 tables** (vérifié `pg_tables`).
    - 🔴 **2 TROUS RLS TROUVÉS ET CORRIGÉS (SQL, déployé)** : policies mal créées sur `{public}` avec `qual = true` (combinaison OR → ouvre à tous, anon inclus).
      - `contact_pro` : les 3 policies « admin » SELECT/UPDATE/DELETE étaient ouvertes au public → n'importe qui pouvait lire/modifier/supprimer les messages de prospects pros. **Fix** : recréées `for ... to authenticated using (is_admin())`. Insertion publique (formulaire) conservée.
      - `comparaisons` : policy « Service role full access comparaisons » sur `{public}` true → accès total ouvert à tous. **Fix** : `drop policy` (le service_role bypass déjà la RLS). Les policies `auth.uid() = user_id` suffisent.
    - ⚠️ **`analyser` / `analyser-run` : auth faible/absente** (constaté dans le repo). `analyser` vérifie seulement que le header `Authorization` existe (pas de `getUser()`, pas de contrôle de propriété de l'analyseId). `analyser-run` (v18 repo) : **aucun** contrôle. Risque réel **étroit** (il faut des `fileIds` Anthropic valides ; un abus consommerait les crédits de l'attaquant ; `verify_jwt` Supabase peut filtrer en amont — non visible dans le repo). **À durcir (non bloquant pour démarchage)** : valider le token + propriété dans `analyser`, secret interne partagé pour `analyser-run`. ⚠️ Prod = single-call v7 recollé à la main, **pas dans le repo** → me faire coller le vrai `analyser-run` prod avant de le durcir.
    - 🔴 **RESTE LE SEUL MUST-DO CERTAIN : régénérer la clé `service_role`** (compromise 11 mai, screenshots). Tant que non fait → contournement possible de toute la RLS.
  - **Verdict audit** : **démarchage + démos = GO maintenant.** **Onboarding de vraies agences (vraies données RGPD) = GO dès que la clé service_role est régénérée.**
  - **📜 CGV Pro — article 4.5 réécrit (LIVRÉ, `CGVProPage.tsx`).** Fin du « login partagé » → « chacun son propre compte/identifiants ». Ajout bloc « Fonctionnement multi-utilisateurs » (invitation mail lien 7j, 3 rôles, pool partagé, dossiers partagés, facturation centralisée) + encadré « Au-delà de 3 utilisateurs → sur devis ». **Version CGV GARDÉE à v2.3** (aucun pro actif → pas de re-consentement à déclencher). Frontend only.
  - **🔔 UX « Compléter mon dossier » (LIVRÉ, `RapportPage.tsx`).** Constat : l'écran était déjà bon (pédagogie + recalcul score annoncé + message rassurant cloche + bouton retour). Seul ajout : **message rassurant personnalisé avec le nom du dossier** (« Votre dossier « {adresse} » est en cours de mise à jour… prévenu dans la cloche 🔔 dès que le dossier sera mis à jour ») + titre « Mise à jour de votre dossier en cours… ». Variable `nomDossier = safeStr(rapport.adresse) || 'votre bien'`. Vérifié : la note /20 **se recalcule bien** en mode complément (déterministe `recalculerCategories` + somme des 5 catégories) ; la notif cloche backend fire bien pour complément avec le nom du dossier (particulier = cloche + email, pro = cloche seule). Frontend only.
  - **🎨 Fix layout « Mon équipe » (LIVRÉ, `MonEquipePage.tsx`).** Bande blanche à gauche = double padding (le `<main>` pose déjà 24px + la page reposait 28px). Fix : conteneur racine passé de `padding: '24px 28px 60px', maxWidth: 1080` à `paddingBottom: 60, maxWidth: 1100` (aligné sur les autres pages). Appliqué aux 2 conteneurs (liste + fiche membre). Frontend only.
  - **Nettoyage** : fichier parasite `supabase/functions/a` (1 octet) à supprimer sur GitHub.
  - **👥 OFFRE AGENCE > 3 UTILISATEURS — rendue gérable depuis l'admin (LIVRÉ).** Avant : la limite agence était bloquée à 3 et un changement manuel sautait au renouvellement. **Faits vérifiés en prod** : la limite est pilotée **partout par `agences.nb_users_max`** (pas de « 3 » codé en dur) — le frontend invitation (`canInviteMore = nb_users_max - membres`) ET la fonction SQL `create_agence_invitation()` (`IF (v_current + v_pending) >= v_max_users`) lisent cette colonne. La fonction SQL `reset_pro_subscription_credits()` (vérifiée ligne par ligne) **ne touche PAS** `nb_users_max` (que les crédits). Le **seul** endroit qui forçait `3` était le webhook. **3 corrections livrées :**
    - `stripe-webhook-pro` (edge) : `nb_users_max: 3` → `Math.max(3, valeur_actuelle)` (lit l'agence avant l'update). Le renouvellement ne redescend plus un custom > 3.
    - `admin-user-management` (edge) : nouvelle action **`set_agence_users_max`** (admin-only via garde l.818, service_role) — garde-fou : refuse de descendre sous le nb de membres actifs ; bornes 1–50.
    - `AdminPage.tsx` (front) : bloc « 👥 Utilisateurs max » sur la fiche détail agence (champ + bouton « Enregistrer », pré-rempli avec la valeur actuelle, appelle l'action).
    - **Modèle de droits** : l'**admin** fixe le plafond (décision commerciale/sur-devis) ; le **responsable** invite jusqu'à ce plafond depuis son dashboard (il n'augmente jamais son propre plafond). Au-delà de 3 → tout reste synchronisé (pool + dossiers via `agence_members`) ; ajuster le pool de crédits à la main si besoin (action `grant_agence_credits`).
    - ⚠️ **Ordre de déploiement** : déployer les 2 edge functions (`stripe-webhook-pro`, `admin-user-management`) à la main dans Supabase **AVANT** de pousser `AdminPage.tsx` et **avant** de monter une agence > 3 (sinon l'ancien webhook reset à 3 au renouvellement).
  - **⚠️ À DÉPLOYER (récap session 23 juin) :**
    - **GitHub (Vercel auto)** : `CGVProPage.tsx`, `RapportPage.tsx`, `MonEquipePage.tsx`, `AdminPage.tsx` (+ supprimer `supabase/functions/a`)
    - **Supabase Edge Functions (manuel)** : `stripe-webhook-pro`, `admin-user-management`
    - **SQL déjà passé en prod en direct** : trigger `set_analyse_agence_fields` + backfill analyses + 2 fixes RLS (`contact_pro` + `comparaisons`).
- **Session 22 juin 2026 ⭐⭐ : Système crédits AGENCE finalisé (consommation + recharge + crédits offerts) + partage dossiers entre collègues + gros polish admin agence**
  - **Diagnostic clé** : le pool agence (`agences.credits_complete/document`) était AFFICHÉ mais jamais réellement CONSOMMÉ. Les fonctions live partout sont les **v1 sans suffixe** (`get_pro_credits_balance`, `consume_pro_credit`, `refund_pro_credit`) ; les variantes `_v2` ne sont appelées NULLE PART. Seul `get_pro_credits_balance` était agence-aware → l'agent (sans abo perso) était bloqué « plus de crédit ». Source de vérité = **`agence_members`** (et non `profiles.agence_id`, pas toujours rempli).
  - **2a (SQL, déployé + testé OK)** : ajout colonnes `agences.credits_complete_bonus` / `credits_document_bonus` (crédits offerts durables). Réécriture de `consume_pro_credit`, `refund_pro_credit`, `get_pro_credits_balance` pour être agence-aware via `agence_members`. Ordre de consommation agence : **pool mensuel → bonus → achats unitaires perso du membre**. Remboursement → pool. Solde = pool + bonus + unitaires perso. Branches SOLO strictement inchangées.
  - **2b (SQL, déployé)** : `reset_pro_subscription_credits` plantait sur le plan `agence` (CASE solo only) → pool jamais rechargé au renouvellement. Ajout branche `agence` : recharge mensuelle **cumul plafonné 2×** (pool += 15 complètes max 30 / += 30 simples max 60 ; bonus jamais touché). Résout l'agence à sec après le 1er mois.
  - **2c (SQL + edge function + frontend, déployé)** : bouton « Offrir des crédits au pool » réellement branché. Nouvelle table **`agence_credit_grants`** (log id/agence_id/granted_by/credit_type/quantity/reason/created_at + RLS membres & admin). Nouvelle action **`grant_agence_credits`** dans `admin-user-management` (service_role : UPDATE pool bonus + INSERT log ; protégée par la garde admin l.815). Frontend : modal admin (complètes/simples/**motif interne admin uniquement**) + bloc « 🎁 Crédits offerts » sur la fiche agence + section « Crédits offerts » côté **dashboard responsable/membres** (charge `agence_credit_grants` de son agence via `agence_members` et l'affiche comme un pro solo). **Pourquoi edge function pour l'agence et pas solo/particulier** : le pool partagé n'a pas de `user_id` → RLS bloque l'écriture frontend → service_role requis ; le solo/particulier passe par `credit_grants` (trigger, keyé `user_id`).
  - **Affichage admin pool corrigé** : la carte « Pool de crédits partagés » lisait `credits_complete` seul → n'augmentait pas quand on offrait du bonus. Affiche désormais **base + bonus** (« 6 · 4 mensuels + 2 offerts 🎁 »).
  - **Partage des dossiers entre collègues (SQL, déployé + testé OK)** : un membre voyait « 0 analyse » dans le dossier d'un collègue. Cause = RLS `analyses` limitée à `user_id = auth.uid()` (createAnalyse ne pose PAS `agence_id` sur l'analyse). Fix = policy SELECT « Membres agence lecture analyses dossiers » : un membre peut lire une analyse si son `folder_id` pointe vers un `pro_folders` dont l'`agence_id` est une agence où il est membre (`agence_members`, `removed_at IS NULL`). C'est ce qui rend la « lecture libre des dossiers » réellement effective.
  - **BUG REGROUPEMENT AGENCE ADMIN — ✅ RÉSOLU** : le code était bon, c'était un RLS. Les tables `agences` et `agence_members` n'avaient qu'une policy SELECT membre (`my_agence_id()`), pas de policy admin → l'admin (non-membre) lisait vide → pas de regroupement. Fix = policies SELECT `is_admin()` sur les deux tables.
  - **Polish admin AdminPage.tsx (livré, frontend)** : (1) **Vue détail agence complète** (clic bandeau doré) : identité/plan, pool (base+bonus), stats globales, liste membres cliquable, facturation (factures Stripe du responsable = payeur), bloc crédits offerts, **liste « 📋 Analyses de l'agence »** tous membres confondus, cliquables vers le rapport, **paginée « Voir plus » 10 par 10** (range serveur, jamais tout chargé) avec nom membre + date + horaire. (2) **Analyses cliquables sur la fiche client** (complétées → `/dashboard/rapport?id=`). (3) Filtre profil « 🏛 Agence (4) » → **« 🏛 Agences (1 · 4 comptes) »** (agences distinctes · comptes rattachés). (4) Bouton **« Voir l'agence → »** sur la fiche membre (saut direct vers la fiche agence). (5) Barre de recherche Clients Pro + badge « 🏛 Membre d'agence ».
  - **Méthode** : tout buildé + `tsc`/`npm run build` clean avant chaque livraison. Déploiement : SQL dans SQL Editor, edge function redeploy manuel Supabase Studio, frontend push GitHub (Vercel auto-deploy).
- **Session 04 juin 2026 ⭐ : Fix titre analyses (nom de fichier) + grosse investigation timeout 400 s**
  - **Fix affichage titre des analyses (LIVRÉ, frontend, 4 fichiers).** Une analyse complète en cours/échec affichait le **nom du 1er fichier uploadé** (ex « 7089_PV_AG_05.06.2019.pdf ») au lieu d'un libellé propre. **Cause racine** : `useAnalyses.ts` l.49 `adresse_bien = a.address || a.title` — le `|| a.title` (= nom du fichier) remontait quand l'adresse n'était pas encore extraite. **Fix** : fonction partagée **`titreAnalyse()`** ajoutée dans `useAnalyses.ts` (document → nom du doc ; complète + adresse → l'adresse ; complète sans adresse + en cours → « Analyse complète en cours… » ; en échec → « Analyse complète ») + suppression du `|| a.title`. Appliquée côté **particulier** (`MesAnalyses.tsx` CompleteRow + SimpleRow, `HomeView.tsx`) et côté **pro** (`DashboardProPage.tsx`, 4 endroits de **liste** : l.1139 / 5404 getDocName / 5657 / 6503). **Épargnés** (vérifié) : titre de la page rapport (l.2887, 5934) et notif `completed` (l.7789) — l'adresse y est toujours présente. Fichiers livrés : `useAnalyses.ts`, `MesAnalyses.tsx`, `HomeView.tsx`, `DashboardProPage.tsx`. **Frontend only → Vercel auto-deploy, AUCUN SQL ni edge function à redéployer.** ⚠️ Pousser `useAnalyses.ts` en premier (il définit la fonction importée par les autres).
  - **Notif cloche d'échec : déjà bien gérée** (vérifié dans `watchdog-stuck-analyses`) — pour une analyse complète sans adresse, le sujet est « complète » (jamais le nom du fichier), commentaire explicite dans le code. Rien à corriger.
  - **Watchdog vérifié** : couvre `processing` > 1h, `files_ready` > 30 min, `queued` > 1h30 → `failed` + refund + notif. **Cron actif** (confirmé par Alex). Le seuil 30 min est trop lent pour l'UX → à réduire (voir chantier 400 s).
  - **Retour au SINGLE CALL en prod** (voir note en tête section MAP-REDUCE). Le single call gère bien les dossiers normaux ; le MAP-REDUCE était plus lent.
  - **Grosse investigation du timeout 400 s** (hypothèses sortie vs entrée, faits vérifiés sur les limites Supabase/Anthropic, pistes de solution). Tout consigné dans la section « ⏱️ CHANTIER 400 SECONDES » ci-dessous (à continuer la prochaine fois).
- **Session 03 juin 2026 ⭐⭐⭐ : MAP-REDUCE analyse complète RÉALISÉ + déployé + polish rapport**
  - **MAP-REDUCE multi-invocations livré** (`analyser-run` v18) — voir section dédiée « 🎯 MAP-REDUCE » plus haut. Architecture finale ≠ plan initial : le bloquant réel était le **WallClockTime Supabase** (~6-7 min/invocation), pas la qualité de lecture. Solution : découper MAP en tranches de 3 docs + self-invoke (`fetch` sur sa propre URL) entre chaque tranche puis vers le REDUCE. MAP = résumé **texte libre** (pas JSON par type) ; REDUCE = prompt complet original + post-traitement déterministe. Colonne BDD `map_resultats` (jsonb) ajoutée. **Validé en prod à 12 docs.**
  - **Scoring corrigé** : score total = somme des 5 catégories recalculées (`recalculerCategories`), n'utilise plus le score inventé par l'IA.
  - **Bug `anneeStr.match`** corrigé (`annee_construction` en nombre → `String()`), débloque `validateDiagsManquants`.
  - **Règle cohérence travaux** (prompt) : jamais le même travaux en point fort ET vigilance ; point fort = réalisé uniquement ; voté/suspendu/bloqué = vigilance.
  - **Règle gravité procédures** (prompt) : jugée selon l'impact concret sur l'acheteur (coût/risque/blocage, long terme inclus). Élevée −2 / modérée −1 / faible −0,5 sur le score. Doute → niveau le plus élevé.
  - **RapportPage.tsx** : Carrez (bug d'affichage, pas d'extraction — propagation `dpe_recommandations` + recherche dans `diagsPriv` + déplacé dans « Votre lot » en tableau avec emojis par pièce) ; DPE recos affichées + bloc « passer d'une lettre à l'autre » redesigné (pastilles + kWh, flèches visibles, packs en avant) ; procédures triées par gravité + **bloc dépliable explicatif des gravités** (3 cartes colorées avec impact points).
  - **analyse-client.ts** : fix faux « Non généré » (le front ne décide plus l'échec, reflète le status base ; stagnation → « queued » rassurant) ; message rassurant à 3 min ; timeout front 10 → 20 min.
  - **Discussions archi (non codé)** : gestion pannes (retry 3× / doc, doc sauté silencieusement = à traiter, mort brutale = watchdog lent), charge simultanée (pas de file globale, OK 5-10, à revoir 20-30+), plan heartbeat watchdog, plan reprise par queue après surcharge (reprise au bon endroit, abandon 6 tentatives/30 min), garde-fou concurrence. Tout reporté → backlog.
- **Session 02 juin 2026 ⭐ : Polish rapport COMPROMIS + fix lien partage + cadrage chantier MAP-REDUCE**
  - `DocumentRenderer.tsx` (frontend, livré) : suppression du bloc rouge « Points d'attention détectés » en haut du compromis (c'était un **doublon** avec la section « Clauses & particularités » plus bas). Fix bulle d'aide « i » (le `overflow:hidden` de la carte la coupait → passée en `position:fixed`, premier plan). Badge « En cours » des conditions suspensives forcé sur **une seule ligne**. Textes **agrandis** (parties vendeur/acheteur + conditions suspensives). **Lots cédés** refaits en **cartes lisibles** (au lieu d'un tableau serré). Bloc **Vendeur/Acheteur remonté** au-dessus de « Le bien ».
  - `analyser-run` prompt COMPROMIS (livré, ⚠️ **à redéployer manuellement dans Supabase**) : ajout règle **« point de vue ACHETEUR »** → ne jamais mentionner la fiscalité du vendeur (plus-value/moins-value), ne jamais ranger un élément favorable à l'acheteur (ex exonération droits d'enregistrement) en alerte/clause critique ; fourre-tout `"autre"` des `clauses_critiques` resserré (uniquement vrai risque/obligation acheteur).
  - **Fix bug lien de partage particulier** (livré) : « Rapport introuvable » au 1er affichage (marchait après refresh). Cause = `RapportPartagePage` bricolait l'URL avec `history.replaceState` → React Router ne voyait pas le token au 1er rendu. Fix = passer le token en **prop `shareTokenOverride`** à `RapportPage` (fichiers `RapportPartagePage.tsx` + `RapportPage.tsx`). **Frontend only, AUCUN impact** sur dashboard pro/particulier (la prop est optionnelle, repli sur l'ancien comportement). Confirmé OK par Alex.
  - **Cadrage complet du chantier MAP-REDUCE** pour fiabiliser l'analyse complète (réalisé depuis le 03 juin — voir la section dédiée « 🎯 MAP-REDUCE analyse complète — ✅ RÉALISÉ » plus haut). Le plan cadré ce jour-là a évolué à l'implémentation (texte libre + multi-invocations à cause du WallClockTime).
- **Session 28 mai 2026 ⭐ : Plan Agence V2 multi-utilisateurs LIVRÉ**
  - 5 tables BDD créées : agences, agence_members, agence_invitations, envois_rapports, dossier_notes
  - Colonnes ajoutées : analyses (agence_id, created_by_user_id, deleted_at), profiles (agence_id, agence_role), pro_folders (agence_id avec trigger auto-fill)
  - Rôles : responsable (👑), co_responsable (🤝), agent (👤)
  - Fonction `my_agence_id()` SECURITY DEFINER pour casser boucle RLS infinie
  - 2 nouvelles edge functions : `send-agence-invitation`, `accept-agence-invitation`
  - 2 edge functions modifiées : `stripe-webhook-pro` V9 (recharge pool agence), `admin-user-management` v3 (création auto entité agence)
  - Page MonEquipePage.tsx créée (~983 lignes) avec fiche détail membre (KPIs, graph activité 8 semaines, analyses cliquables)
  - DashboardProPage.tsx : sidebar dynamique via `getProNavGroups(agenceRole)`, "Dossiers de l'agence" pour membres, badge "Créé par X" partout, filtre par auteur, agents bloqués sur abonnement/modif entreprise
  - AdminPage.tsx : badges 👑/🤝/👤, bandeau agence sur fiche, filtre "Agence" inclut tous les membres
  - Inputs verrouillés affichent — au lieu de placeholders fantômes
  - Backfill SQL pour membres d'agence existants (pro_invitations créés pour badge "Compte activé")
  - ⚠️ Bug en cours : regroupement visuel des comptes d'agence dans AdminPage ne s'affiche pas en prod
- **Session 27 mai 2026 ⭐ : Plan Agence V1 LIVRÉ + Plaquette PDF Mandataires V8**
  - Produit Stripe créé en LIVE : `prod_UazolFHs7gghhx` / `price_1TbnpDBesXB76oWEdOjLZRh3` (149,90€ HT/mois)
  - 2 colonnes ajoutées à `profiles` (`pro_agence_subscription_unlocked`, `pro_agence_proposition_sent_at`)
  - 3 Edge Functions modifiées + 3 fichiers front modifiés
- **Session 25-26 mai 2026 ⭐ : Système rappels pro + Auto-conversion démo + UX polish**
  - Table `callback_requests` + composant CallbackRequestModal + edge function notify-callback
  - Auto-conversion démo→actif via webhook Stripe (V8)
  - Création compte démo enrichie (tous les champs comme création pro classique)
  - Bouton "Activer le compte" manuel
  - Refonte filtres ClientsProTab admin (2 lignes statut + type)
  - Marque blanche rapports envoyés par pros
  - Retry IA ciblé DPE/Carrez + Validation diags manquants (analyser-run v12)
  - Fix règle frais notaire fiscalement correct (analyser-run v13 — défaut 7,5% ancien, 3% uniquement VEFA)
- **Session 19 mai 2026 ⭐ : Sidebar clair/sombre + refonte Admin Messages**
- **Session 17 mai 2026 ⭐ : Feature DPE Travaux préconisés**
- **Session 16 mai 2026 ⭐ : CGV Pro popup + refonte /pro/rejoindre + MandatairesPage**
- **Session 15 mai 2026 ⭐ : Notifications cliquables + Refonte ProPage**
- **Session 14 mai 2026 ⭐ : Plaquette PDF démarchage Pro V7**
- **Session 13 mai 2026 : Page `/rejoindre` multi-step + Mailjet configuré**
- **Session 12 mai 2026 : Refonte UI compte pro + refonte analyse COMPROMIS**
- **Session 11-12 mai 2026 ⭐ : Mail résiliation pro V7, bannières dashboard, codes promo**
- **Session 11 mai 2026 ⭐ : Bug paiements résolu + filet de sécurité `sync-stripe-payments`**
- **Session 10-11 mai 2026 : CGV Pro V2.3 + admin alerts**
- **Session 10 mai 2026 : Audit sécurité paiements + refonte CA admin V2**

### Sessions plus anciennes
- **Avril 2026** : Stripe production, admin support inbox, pages légales, SEO, dossiers pro, credit_grants, popups succès, page Guides
- **Antérieurement** : Conception initiale, prompt enrichi, scoring déterministe /20, AdminPage, dashboard pro, edge functions, DNS pro.verimo.fr

---

## 🎯 Prochaine session — Actions prioritaires

### 🧪 D'abord : valider les déploiements du 25 juillet
1. **Tester le complément de bout en bout** sur une analyse > 1h (le cas qui plantait) : solde crédits STRICTEMENT inchangé, bandeau bleu au retour sur le rapport, cloche, bouton grisé après succès. Puis un échec simulé si possible → bandeau ambre + Réessayer, rapport d'origine visible.
2. **Compteur** : analyse 9 docs → « Document 1 sur 9 » … « Synthèse du rapport en cours… ».
3. **Comparaison** (simple refresh) : taxe foncière visible, totaux justes, cotisation « déjà incluse », barre sticky desktop.
4. **Fonds travaux** : NOUVELLE analyse du dossier Auteuil → 5,0 % conforme + « Fonds constitué : 13 201 € » + score sans la pénalité −0,5.

### 🔒 Sécurité (état au 23 juin, inchangé)
**Solide** : RLS 34 tables · webhooks signés · admin verrouillé · aucun secret front · prix cohérents · tarifs pro non publics. **🔴 Reste LE must-do : régénérer la clé `service_role`** (dernier verrou avant vraies agences ; démarchage/démos = OK). Puis durcir auth analyser/analyser-run + restreindre CORS.

### 📋 Rappels transverses
- Gap renderer : fiche dédiée **FICHE_SYNTHETIQUE** à créer (tombe sur RendererAutre).
- Session lifecycle pro (suspendre/résilier/past_due/badges) — session dédiée.
- Funnel pro : rapport exemple anonymisé PDF, 3 templates emails, argumentaire objections.
- Réactiver cron `sync-stripe-payments` quand possible ; fix `stripe_payment_id = NULL` upgrades ; upsert atomique webhook.

**Méthode** :
1. Coller ce context.md en début de conversation
2. Valider chaque chantier avant de coder
3. Une étape à la fois, fichiers COMPLETS livrés via `present_files` depuis `/mnt/user-data/outputs/`
4. Builds Vercel complets (`tsc -b && vite build`) avant toute livraison front
5. Tester sur compte pro démo / agence test après chaque étape
