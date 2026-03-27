# ANALYMO — Contexte Projet
> **Colle ce fichier en début de conversation Claude pour reprendre le contexte.**

---

## 🧑 Profil développeur
- Débutant en développement
- Modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- Vercel redéploie automatiquement après chaque push GitHub
- Claude peut cloner le repo directement : `https://github.com/emilio92100/analymoCD.git`

---

## 🏠 Le produit
**Analymo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges). Rapport clair avec scores, risques, recommandations en moins de 2 minutes.

**Cible :** Acheteurs particuliers (principal), notaires, agents, syndics, marchands de biens.

**Prix :**
- 4,99€ — Analyse Document
- 19,90€ — Analyse Complète ⭐ (badge "Le plus populaire", carte animée)
- 29,90€ — Pack 2 Biens
- 39,90€ — Pack 3 Biens

---

## 🛠 Stack technique
| Technologie | Usage |
|---|---|
| React 18 + Vite + TypeScript | Frontend |
| Tailwind CSS v3 | Styles responsive (sm: md: lg:) |
| Framer Motion | Animations (layoutId pill navbar, animations scroll) |
| React Router DOM | Navigation |
| Supabase | Auth — pas encore configuré |
| Stripe | Paiements — pas encore configuré |
| Vercel | Déploiement auto depuis GitHub |

**Police :** DM Sans

---

## 📁 Structure du projet
```
src/
├── App.tsx                          ← routing
├── index.css                        ← variables CSS globales
├── components/layout/
│   ├── Navbar.tsx                   ← navigation pill glissante (Framer layoutId)
│   └── Footer.tsx                   ← footer dark navy responsive
├── pages/
│   ├── HomePage.tsx                 ← landing page principale
│   ├── TarifsPage.tsx               ← page tarifs (carte 19,90€ animée)
│   ├── ExemplePage.tsx              ← exemple rapport interactif
│   ├── ContactPage.tsx              ← formulaire contact
│   ├── LoginPage.tsx                ← connexion
│   ├── SignupPage.tsx               ← inscription
│   └── DashboardPage.tsx            ← dashboard utilisateur
├── lib/supabase.ts                  ← client Supabase (fallback placeholder)
└── types/index.ts                   ← types + PRICING_PLANS
```

---

## 🎨 Design system
**Style :** Modern SaaS premium — Stripe / Linear / Vercel  
**Fond :** `#f4f7f9` (gris très clair) + sections blanches alternées  
**Pas de dark mode**

**Couleurs :**
```
--brand-teal: #2a7d9c
--brand-navy: #0f2d3d
--brand-gold: #f0a500
```

---

## ✅ État actuel des fichiers

### Navbar.tsx
- Pill **glissante** avec `layoutId="nav-pill"` Framer Motion — transition fluide entre onglets
- Onglet actif = fond dark navy `#0f2d3d` texte blanc
- Liens : Accueil · Exemple · Tarifs · Contact
- Boutons auth : Connexion (outline) + S'inscrire (dark)
- Mobile : menu overlay animé

### HomePage.tsx — sections dans cet ordre :
1. **Hero** — texte gauche (titre 96px), téléphone animé droite (3 phases : Upload→Scan→Résultats), badges flottants
2. **StatsBar** — 4 stats : 200+ analyses, 2 min, 98%, ~8000€
3. **ProblemSection** — 4 cartes problèmes
4. **SolutionSection** — 3 features avec hover glow
5. **HowItWorksSection** — 3 étapes avec flèches
6. **AvantApresSection** — lignes côte à côte Sans/Avec, apparition au scroll
7. **ForWhoSection** — grande carte Acheteurs + 4 cartes pros
8. **TestimonialsSection** — 3 avis
9. **CtaFinal** — dark card centré
- **Pas de section Tarifs** dans la homepage
- Titres sections : `clamp(40px,5.5vw,72px)`
- `SectionTitle` = composant avec animation trait teal sous le dernier mot

### TarifsPage.tsx
- Max-width `max-w-6xl` — large sur desktop
- Carte 19,90€ : **animation flottante** `y:[0,-8,0]` + ombre pulsante en boucle
- Ligne teal en haut de la carte mise en avant
- Badge étoile "Le plus populaire"
- Zéro emoji dans les cartes
- Offre Pro banner en bas
- FAQ 3 questions

### Footer.tsx
- Dark navy `#0f2d3d`
- Logo au-dessus du texte descriptif dans col 1 (conteneur `w-40` fixe)
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- Responsive mobile parfait

---

## ⚠️ Points importants
1. **Pas de FooterSection dans les pages** — le Footer est dans le layout `App.tsx`
2. **Supabase placeholder** dans `supabase.ts` pour éviter crash sans clés
3. **vercel.json** — rewrites SPA (ne pas supprimer)
4. Le logo dans la Navbar fait `h-14`

---

## 🔜 Prochaines étapes
- [ ] Configurer Supabase (créer compte, exécuter `supabase-schema.sql`)
- [ ] Activer Google OAuth dans Supabase
- [ ] Créer compte Stripe + 4 produits
- [ ] Ajouter les vraies clés dans Vercel Environment Variables
- [ ] Coder l'API `/api/analyse` (appel Claude API)
- [ ] Coder l'API `/api/checkout` (Stripe)
- [ ] Connecter Dashboard à Supabase
