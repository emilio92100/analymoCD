# VERIMO — Contexte projet complet — 20 avril 2026 (session 3)

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
/exemple                    → ExemplePage (À REFAIRE — désynchronisée du vrai rapport)
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

## Modifications session 20 avril 2026 — session 3

### Enrichissement du prompt IA (analyser-run/index.ts)
Ajout de règles juridiques à jour dans le prompt d'analyse (simple + complète) :

**Loi Climat & Résilience :**
- DPE G : interdit à la location depuis le 1er janvier 2025
- DPE F : interdit à la location au 1er janvier 2028
- DPE E : interdit à la location au 1er janvier 2034
- Gel des loyers F et G depuis le 24 août 2022
- Profil investisseur : mention dans points_vigilance + avis_verimo avec impact rentabilité
- Profil résidence principale : mention dans avis_verimo uniquement ("en cas de revente ou location future")

**DPE petites surfaces (arrêté du 25 mars 2024) :**
- Seuils ajustés pour logements < 40 m² depuis juillet 2024
- Si DPE F/G + surface < 40 m² + DPE avant juillet 2024 → mention dans points_forts qu'un nouveau DPE pourrait améliorer la classe

**Audit énergétique obligatoire à la vente :**
- Maisons individuelles et monopropriétés classées E/F/G → audit obligatoire
- Ajouté dans documents_manquants si type_bien = "maison" et DPE E/F/G sans audit fourni
- Ne concerne PAS les appartements en copropriété

### Compléter le dossier (7 jours) — IMPLÉMENTÉ

**Fonctionnement :**
Après une analyse complète, l'utilisateur a 7 jours pour ajouter jusqu'à 5 documents oubliés. L'IA fusionne le rapport existant (JSON) avec les nouveaux PDFs et produit un rapport mis à jour.

**Backend déployé :**
- `analyser/index.ts` (v6) : mode `complement` avec vérification deadline, limite 5 docs, lecture rapport existant, passage à analyser-run
- `analyser-run/index.ts` (v6) : prompt `buildComplementPrompt` pour fusion JSON + nouveaux docs, stockage `complement_date` + `complement_doc_names`, stockage `regeneration_deadline` (now + 7 jours) à la fin de chaque analyse complète
- SQL : colonnes `complement_date` (TIMESTAMPTZ) et `complement_doc_names` (TEXT[]) ajoutées à la table `analyses`

**Frontend déployé :**
- `RapportPage.tsx` : popup ComplementModal (680px large, layout 2 colonnes)
  - Haut : zone drag & drop PDF (max 5 docs) + fichiers sélectionnés + bouton "Mettre à jour l'analyse"
  - Bas : 2 colonnes — documents suggérés (essentiels en bleu, secondaires en gris, avec tooltips identiques à l'onglet Documents) + documents déjà analysés (noms lisibles avec emojis)
  - Barre de progression circulaire + linéaire pendant l'analyse ("Croisement avec le rapport existant…")
  - Écran succès "Rapport mis à jour" + bouton "Voir le rapport mis à jour" + auto-fermeture 10s
- Bouton "Compléter mon dossier" dans l'onglet Documents : actif dans les 7 jours, grisé après avec tooltip "Le délai de 7 jours pour ajouter des documents est dépassé"
- CountdownTimer : compte à rebours live (heures/minutes/secondes) le dernier jour
- Badge "📎 Dossier mis à jour le XX — X documents ajoutés" en haut de l'onglet Documents
- Badges "📎 Ajouté le XX" à côté des documents ajoutés en complément dans la liste Documents Analysés
- `analyses.ts` : type AnalyseDB mis à jour avec `complement_date` et `complement_doc_names`
- `analyse-client.ts` : type AnalyseMode mis à jour avec `'complement'`

**Flux RGPD identique :** les nouveaux PDFs sont supprimés de Storage et de l'API Files après traitement.

### MethodePage.tsx — Corrections textuelles
- "autant de documents que vous voulez" → "jusqu'à 15 documents"
- DDT : "impacte directement le score" → "un dossier sans anomalie renforce votre score"
- Section score : "Contrairement à votre prof de maths..." → "Votre bien démarre avec la note maximale. Chaque risque détecté dans vos documents fait baisser le curseur. Mais chaque point positif le remonte. L'objectif : une note juste, pas une note pessimiste."

### App.tsx — Préchargement HomePage
- Préchargement en arrière-plan de HomePage 2 secondes après le chargement initial de n'importe quelle page
- Résout le problème de lenteur au retour vers l'accueil sur iOS/iPhone

---

## Modifications session 19 avril 2026 — session 2

### HomePage.tsx — Section "Pour Qui" (refaite intégralement)
- **Bloc interactif** : 4 boutons cliquables (Premier achat 🔑, Coup de cœur ❤️, J'hésite 🤔, Je négocie 💪)
- Au clic, un message personnalisé apparaît avec animation (AnimatePresence) + des pills badges
- Textes spécifiques et concrets pour chaque situation (pas de blabla générique)
- Sous-titre sur 2 lignes forcées (`whitespace-nowrap` sur la 1ère ligne)
- Pas de bouton CTA dans cette section
- **Bandeau Pro** en dessous : 4 profils **non cliquables** (Agent immobilier, Investisseur, Marchand de bien, Notaire) + seul le bouton "Découvrir l'offre Pro" est interactif
- "Cliquez sur votre situation" = badge pill blanc avec bordure bleue + point vert animé
- Message d'invitation en bas = encadré blanc avec icône flèche

### HomePage.tsx — Section "Comment ça marche" (refaite — timeline)
- Remplace l'ancienne section "Quatre étapes, c'est tout"
- Titre : "Votre parcours simplifié."
- 4 étapes : Vous visitez → Vous uploadez → Vous comprenez → Vous décidez
- **Desktop** : timeline horizontale avec ligne animée, emojis dans des carrés, texte directement sous chaque icône (lié visuellement)
- **Mobile** : vertical avec connecteurs
- Texte "Vous visitez" : "Vous ne comprenez pas tout — c'est normal" (pas "vous n'y comprenez rien")
- "30 secondes" sur la 2ème ligne dans "Vous uploadez"

### ProPage.tsx — Ajout profil "Marchand de bien"
- 4ème onglet dans la section Profils (couleur ambre `#d97706`, emoji 🔑, icône Key)
- Hero : 4 cartes au lieu de 3, texte mis à jour avec "marchands de bien"
- Sélecteur d'onglets : grille 4 colonnes
- Contenu marchand : tagline, headline, description, 4 bénéfices, 3 stats
- Témoignage ajouté : Karim B., Marchand de bien, Marseille
- Grille témoignages : 2×2 au lieu de 3 colonnes

### ContactProPage.tsx — Ajout profil "Marchand de bien"
- 5ème profil dans le sélecteur (emoji 🔑, icône Key, couleur `#d97706`, bg `#fffbeb`)
- Formulaire spécifique : société, SIRET, opérations/an, type de biens, stratégie (achat-revente/division/rénovation/transformation/mixte), zone géographique
- 4 intérêts spécifiques : restrictions RCP, travaux à prévoir, gain de temps sourcing, sécuriser les marges
- Options : `strategiesMarchand`, `operationsAn`
- Données envoyées dans `contact_pro` avec `profile_type: 'marchand'`

### TarifsPage.tsx — Corrections
- **Tableau comparatif** : "Travaux votés" et "Santé financière copro" affichent **"Selon le doc"** en ambre (`#d97706`) pour l'analyse simple (au lieu d'une croix). Dans les cartes, cercle ambre avec tiret + astérisque
- **Bandeau Pro** : "Agents immobiliers, investisseurs, marchands de bien, notaires — tarif dédié."
- **Sous-titre** : "Sans abonnement. Sans engagement." (supprimé "Vos crédits n'expirent jamais")
- **FAQ** : "Quels documents puis-je analyser" → réponse élargie : "appartements comme maisons", ajout compromis, carnet d'entretien, DTG, pré-état daté

### Compare.tsx — Comparaison de biens (refait intégralement)
Fonctionnalités ajoutées :
- **Radar des 5 catégories** : barres horizontales animées (travaux /5, procédures /4, finances /4, diag. privatifs /4, diag. communs /3). Winner en vert avec ✓
- **Résumé financier année 1** : tableau charges annuelles + cotisation fonds travaux + fonds ALUR signature + fonds roulement signature = total. Bien le moins cher en vert. Astérisque disclaimer
- **Travaux évoqués non votés** : bloc alerte ambre listant les travaux évoqués par bien, avec montant si disponible
- **Documents analysés par bien** : liste des docs fournis avec compteur
- **Verdict IA** : appel à la edge function `comparer` (Claude Sonnet). Verdict structuré : titre, synthèse, forces, points d'attention, conseil nuancé. Ton factuel et bienveillant — Verimo ne dit jamais "n'achetez pas"
- **Historique des comparaisons** : liste des comparaisons précédentes avec bouton "Voir" (recharge instantanée sans appel API) et bouton "Supprimer" (corbeille rouge avec confirmation)
- **Fallback local** : si l'appel API échoue, verdict simplifié basé sur les scores

### Edge Function `comparer/index.ts` (NOUVELLE)
- Reçoit 2-3 IDs d'analyses complètes
- Vérifie l'auth et que les analyses appartiennent à l'utilisateur
- Lit les rapports JSON depuis Supabase
- Vérifie si un verdict existe déjà en cache (table `comparaisons`)
- Appelle Claude Sonnet avec un prompt calibré pour un ton nuancé
- Stocke le verdict dans la table `comparaisons` (upsert sur user_id + analyse_ids)
- Coût : ~0.02-0.05€ par comparaison
- JWT verification désactivée dans les settings (auth gérée dans le code)

### Table Supabase `comparaisons` (NOUVELLE)
```sql
comparaisons (
  id UUID, user_id UUID, analyse_ids TEXT, verdict JSONB, created_at TIMESTAMPTZ,
  UNIQUE(user_id, analyse_ids)
)
```
Policies RLS : SELECT/INSERT/DELETE pour l'utilisateur + full access service role.

---

## Pages existantes (session 19 avril 2026 — session 1)

### ProPage.tsx (`/pro`)
Landing page offre professionnelle. Hero sombre avec 4 cartes profils (agent, investisseur, marchand de bien, notaire), ruban de stats, section profils avec sélecteur à 4 onglets + layout gauche/droite, "Comment ça marche" en 3 étapes, témoignages (4, grille 2×2), sécurité, FAQ (8 questions en grille 2 colonnes), CTA final.

### ContactProPage.tsx (`/contact-pro`)
Formulaire qualifié en 4 étapes avec 5 profils : Agent, Investisseur, Marchand de bien, Notaire, Autre.

### Table Supabase `contact_pro`
```sql
contact_pro (
  id UUID, profile_type TEXT, nom, prenom, email, telephone, ville, volume, message,
  profile_data JSONB, rgpd_consent BOOLEAN, read BOOLEAN, notes_admin TEXT, created_at
)
```

---

## Optimisations iOS (session 19 avril 2026) — TESTÉ SUR IPHONE
- **Navbar** : `backdrop-blur` → fond opaque sur mobile, scroll listener `passive + rAF`
- **HomePage** : `Reveal` et `SectionTitle` → CSS natif sur mobile (IntersectionObserver + transitions GPU)
- **HomePage** : badges float infinite désactivés, `usePhoneSteps` un seul cycle
- **MethodePage, ExemplePage, TarifsPage** : Reveal CSS natif sur mobile
- **DashboardPage** : overlay sidebar sans backdrop-blur
- **index.css** : `@supports (-webkit-touch-callout: none)` pour iOS Safari
- **App.tsx** : préchargement HomePage en arrière-plan (2s après load) pour retour instantané
- **Retour utilisateur (session 3)** : nette amélioration, pages fluides, menu sans scintillement. Seul le retour vers l'accueil avait un petit chargement → résolu par le préchargement

---

## Navbar — Badge "Offre Pro"
- **Desktop** : bouton dégradé avant le séparateur auth → `/pro`
- **Mobile** : bouton pleine largeur dans le menu hamburger

---

## AdminPage — Onglet "Demandes Pro"
- Onglet `demandes_pro` avec badge compteur non lues
- Liste avec badge par type, détail complet, actions (répondre, appeler, supprimer)
- Temps réel Supabase Realtime
- KPI "Demandes Pro" dans Vue d'ensemble + action rapide

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

---

## Flux technique — Comment fonctionne une analyse

1. L'utilisateur uploade ses PDFs dans Supabase Storage (bucket `analyse-temp`)
2. Le frontend appelle la edge function `analyser` avec les paths Storage + l'ID analyse
3. `analyser` télécharge les PDFs depuis Storage, les uploade vers l'API Anthropic Files, obtient des `file_ids`
4. `analyser` supprime les PDFs de Supabase Storage
5. `analyser` passe le status à `files_ready` et appelle `analyser-run` via `EdgeRuntime.waitUntil`
6. `analyser-run` appelle Claude Sonnet avec les `file_ids` et le prompt système
7. Claude analyse tous les documents et retourne un JSON structuré (rapport complet ou analyse simple)
8. `analyser-run` supprime les `file_ids` de l'API Anthropic Files (RGPD)
9. Le rapport JSON est stocké dans `analyses.result` dans Supabase
10. `analyser-run` stocke `regeneration_deadline` = now + 7 jours (analyses complètes uniquement)
11. **IMPORTANT** : après le rapport, les documents originaux n'existent plus nulle part (ni Storage, ni Files API). Seul le JSON résultat est conservé.

### Flux complément (nouveau — session 3)
1. L'utilisateur clique "Compléter mon dossier" dans l'onglet Documents (dans les 7 jours)
2. Popup : upload de 1 à 5 PDFs
3. `analyser` en mode `complement` : vérifie deadline, limite 5 docs, lit le rapport existant, uploade les nouveaux PDFs
4. `analyser-run` en mode `complement` : reçoit le rapport JSON existant + les nouveaux file_ids, prompt de fusion
5. Claude fusionne les données et produit un nouveau rapport complet au même format
6. Les nouveaux PDFs sont supprimés (RGPD identique)
7. Le nouveau rapport remplace l'ancien, `complement_date` et `complement_doc_names` sont stockés
8. La `regeneration_deadline` n'est PAS remise à zéro

---

## Architecture fichiers clés

```
src/pages/
  HomePage.tsx              ← Page d'accueil (section "Pour Qui" interactive + timeline)
  ProPage.tsx               ← Landing page offre pro (4 profils dont marchand de bien)
  TarifsPage.tsx            ← Tarifs + FAQ + comparatif
  MethodePage.tsx           ← Notre méthode (score /20, types de docs)
  ContactPage.tsx           ← Formulaire contact général
  ContactProPage.tsx        ← Formulaire contact pro (5 profils dont marchand de bien)
  RapportPage.tsx           ← Rapport standalone (~3580 lignes) + popup Compléter le dossier
  ExemplePage.tsx           ← Exemple de rapport (À REFAIRE)
  DashboardPage.tsx         ← Shell dashboard + sidebar + topbar
  AdminPage.tsx             ← Admin (users, analyses, messages, demandes pro, promos, logs)
  dashboard/
    MesAnalyses.tsx         ← Listing analyses
    HomeView.tsx            ← Tableau de bord
    NouvelleAnalyse.tsx     ← Upload + barre progression
    DocumentRenderer.tsx    ← Rendu analyse simple (par type de doc)
    Compare.tsx             ← Comparaison de biens (radar, financier, verdict IA, historique)

src/components/layout/
  Navbar.tsx                ← Navbar + badge "Offre Pro" + optim iOS
  Footer.tsx

src/lib/
  supabase.ts
  analyse-client.ts         ← Upload PDFs + polling (modes: complete, document, apercu, complement)
  analyses.ts               ← Types AnalyseDB + CRUD Supabase (complement_date, complement_doc_names)

supabase/functions/
  analyser/index.ts         ← Upload PDFs → Files API → déclenche analyser-run (+ mode complement)
  analyser-run/index.ts     ← Appel Claude → rapport JSON → suppression RGPD (+ prompt complement + règles juridiques)
  comparer/index.ts         ← Comparaison IA : lit rapports JSON → appel Claude → verdict
```

---

## Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Header dark** : `#0f2d3d`
- **Accent bleu ciel (Pro)** : `#7dd3fc`
- **Investisseur violet** : `#7c3aed`
- **Marchand de bien ambre** : `#d97706`

---

## Backlog

### 🔴 Priorité haute
- [ ] **Tester compléter le dossier** — flux complet en vrai (upload → edge function → Claude fusionne → rapport mis à jour). Non testé en conditions réelles.
- [ ] **Pistes de négociation** — changer la règle `applicable=true UNIQUEMENT si score < 14` → applicable dès qu'un élément chiffrable est détecté (travaux évoqués non votés, DPE E/F/G, impayés, fonds travaux insuffisant). Travaux votés = charge vendeur, donc PAS dans les pistes de négo.
- [ ] **ExemplePage** — refaire complètement pour matcher le vrai RapportPage

### 🟡 Priorité normale
- [ ] Tester RapportPage sur iPhone (performances)
- [ ] Tester retour accueil sur iPhone après préchargement App.tsx
- [ ] Vérifier affichage mobile tous types docs simples
- [ ] HomeView : retravailler présentation générale
- [ ] Stripe TEST → production
- [ ] Analyses bloquées > 20 min → badge "Échoué"
- [ ] Système dossiers par bien
- [ ] App.css : vestige Vite, peut être supprimé

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
