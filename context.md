# VERIMO — Contexte projet complet — 19 avril 2026

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

**Cible :** Acheteurs particuliers (primo-accédants et résidence principale), et professionnels (agents immobiliers, investisseurs, notaires).

### Logique crédits / prix
- 4,90€ → 1 crédit analyse simple (1 seul document) — PAS de score /20
- 19,90€ → 1 crédit analyse complète
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
- **Déploiement** : Vercel (auto depuis GitHub)
- **Repo** : `github.com/emilio92100/analymoCD`
- **URL Supabase** : `veszrayromldfgetqaxb.supabase.co`

---

## Routes
```
/                           → HomePage
/pro                        → ProPage (landing page offre professionnelle)
/contact-pro                → ContactProPage (formulaire qualifié pros)
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
/dashboard/compare          → Compare (non travaillé)
/dashboard/rapport?id=XXX   → Aperçus gratuits
/rapport?id=XXX             → RapportPage standalone (rapports payants)
```

---

## Pages ajoutées (session 19 avril 2026)

### ProPage.tsx (`/pro`)
Landing page offre professionnelle. Hero sombre avec 3 cartes profils (agent, investisseur, notaire), ruban de stats, section profils avec sélecteur à onglets + layout gauche/droite, "Comment ça marche" en 3 étapes, témoignages, sécurité, FAQ (8 questions en grille 2 colonnes), CTA final.
- Navbar forcée en blanc opaque via `useEffect` (fond sombre du hero)
- Sélecteur de profils : grille 3 colonnes sur mobile, inline sur desktop
- Tous les CTA renvoient vers `/contact-pro` avec `?type=agent|investisseur|notaire` pré-sélectionné
- Soulignement animé (`AccentUnderline`) sur chaque mot bleu accent

### ContactProPage.tsx (`/contact-pro`)
Formulaire qualifié en 4 étapes :
1. Choix du profil (4 cartes : Agent, Investisseur, Notaire, Autre)
2. Coordonnées communes (nom, prénom, email, téléphone, ville)
3. Champs spécifiques au profil sélectionné :
   - **Agent** : agence, adresse, réseau, taille, transactions/mois, RSAC, service existant, intérêts
   - **Investisseur** : société, SIRET, statut, acquisitions/an, type biens, stratégie, courtier, intérêts
   - **Notaire** : étude, adresse, fonction, taille, transactions/mois, outils existants, intérêts
   - **Autre** : profession, structure
4. Volume estimé + message libre + consentement RGPD
- Pré-sélection via `?type=agent` dans l'URL
- Soumission → table Supabase `contact_pro` (JSONB `profile_data`)
- Formulaire élargi à 920px sur desktop

### Table Supabase `contact_pro`
```sql
contact_pro (
  id UUID, profile_type TEXT, nom, prenom, email, telephone, ville, volume, message,
  profile_data JSONB, rgpd_consent BOOLEAN, read BOOLEAN, notes_admin TEXT, created_at
)
```
Policies RLS : INSERT public, SELECT/UPDATE/DELETE ouvertes.

---

## Optimisations iOS (session 19 avril 2026) — À TESTER SUR IPHONE

### Corrections appliquées
- **Navbar** : `backdrop-blur` → fond opaque sur mobile, scroll listener `passive + rAF`
- **HomePage** : `Reveal` et `SectionTitle` → CSS natif sur mobile (IntersectionObserver + transitions GPU)
- **HomePage** : badges float infinite désactivés, `usePhoneSteps` un seul cycle
- **MethodePage, ExemplePage, TarifsPage** : Reveal CSS natif sur mobile
- **DashboardPage** : overlay sidebar sans backdrop-blur
- **index.css** : `@supports (-webkit-touch-callout: none)` pour iOS Safari

---

## HomePage — Section "Fait pour vous"

Deux cartes côte à côte :
- **Primo-accédant 🏠** : "On simplifie tout pour vous"
- **Acheteur expérimenté 🔑** : "Allez plus loin cette fois"
- **Bandeau pro compact** en dessous avec CTA vers `/pro`

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

---

## Architecture fichiers clés

```
src/pages/
  HomePage.tsx              ← Page d'accueil (optimisée iOS)
  ProPage.tsx               ← Landing page offre pro
  ContactProPage.tsx        ← Formulaire contact pro qualifié
  RapportPage.tsx           ← Rapport standalone (3200 lignes)
  ExemplePage.tsx           ← Exemple de rapport (À REFAIRE)
  DashboardPage.tsx         ← Shell dashboard + sidebar + topbar
  AdminPage.tsx             ← Admin (users, analyses, messages, demandes pro, promos, logs)
  dashboard/
    MesAnalyses.tsx         ← Listing analyses
    HomeView.tsx            ← Tableau de bord
    NouvelleAnalyse.tsx     ← Upload + barre progression
    DocumentRenderer.tsx    ← Rendu analyse simple (par type de doc)

src/components/layout/
  Navbar.tsx                ← Navbar + badge "Offre Pro" + optim iOS
  Footer.tsx

src/lib/
  supabase.ts
  analyse-client.ts

supabase/functions/
  analyser/index.ts
  analyser-run/index.ts
```

---

## Palette couleurs
- **Bleu Verimo** : `#2a7d9c`
- **Header dark** : `#0f2d3d`
- **Accent bleu ciel (Pro)** : `#7dd3fc`
- **Investisseur violet** : `#7c3aed`

---

## Backlog

### 🔴 Priorité haute
- [ ] **ExemplePage** — refaire complètement pour matcher le vrai RapportPage
- [ ] Vérifier optimisations iOS sur un vrai iPhone
- [ ] Vérifier affichage mobile tous types docs simples
- [ ] Corriger texte NouvelleAnalyse : supprimer "Word ou images" → PDF uniquement
- [ ] Onglet **Comparaison de biens** : à construire
- [ ] Bouton PDF → message "service non disponible"
- [ ] HomeView : retravailler présentation générale

### 🟡 Priorité normale
- [ ] Stripe TEST → production
- [ ] Analyses bloquées > 20 min → badge "Échoué"
- [ ] Système dossiers par bien
- [ ] Compare.tsx : à construire
- [ ] App.css : vestige Vite, peut être supprimé
