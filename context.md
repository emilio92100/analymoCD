# ANALYMO — Contexte Projet
> **Colle ce fichier en début de conversation Claude pour reprendre le contexte.**

---

## 🧑 Profil développeur
- Débutant en développement
- Modifie les fichiers directement sur **GitHub.com** (crayon ✏️ → Ctrl+A → colle → Commit)
- Vercel redéploie automatiquement après chaque push GitHub
- Claude peut cloner le repo directement : `https://github.com/emilio92100/analymoCD.git`
- **Important** : toujours cibler uniquement la ligne concernée, ne jamais réécrire tout un fichier
- Toujours re-cloner le repo avant de chercher une ligne (git clone est gratuit en tokens)

---

## 🏠 Le produit
**Analymo** — SaaS d'analyse de documents immobiliers (PV d'AG, règlements copro, diagnostics, appels de charges). Rapport clair avec scores, risques, recommandations en moins de 2 minutes.

**Cible :** Acheteurs particuliers (principal), notaires, agents, syndics, marchands de biens.

**Prix :**
- 4,99€ — Analyse Document (1 seul document, rapport détaillé)
- 19,90€ — Analyse Complète ⭐ (multi-documents illimités, score /10, risques, travaux, impact financier, avis Analymo)
- 29,90€ — Pack 2 Biens (2 analyses complètes + comparaison côte à côte + avis "quel bien choisir")
- 39,90€ — Pack 3 Biens (3 analyses complètes + comparaison + classement + recommandation finale)

**Fonctionnement :**
1. Client paie d'abord
2. Upload ses documents (illimités pour analyse complète, 1 seul pour 4,99€)
3. L'IA détecte automatiquement le nom du doc (4,99€) ou l'adresse du bien (19,90€+)
4. Rapport généré en moins de 2 minutes
5. Documents supprimés après analyse, rapport conservé dans le dashboard
6. Rapport visible en ligne + téléchargeable en PDF
7. Comparaison uniquement disponible pour analyses complètes (pack 2 et 3)

---

## 🛠 Stack technique
| Technologie | Usage |
|---|---|
| React 18 + Vite + TypeScript | Frontend |
| Tailwind CSS v3 | Styles responsive (sm: md: lg:) |
| Framer Motion | Animations (layoutId pill navbar, animations scroll) |
| React Router DOM | Navigation |
| Supabase | Auth + Base de données + Storage |
| Stripe | Paiements — pas encore configuré |
| Vercel | Déploiement auto depuis GitHub |
| Mailjet | SMTP emails (notification@analymo.fr → reply: hello@analymo.fr) |

**Police :** DM Sans

---

## 📁 Structure du projet
```
src/
├── App.tsx                          ← routing + SessionManager (gestion session 1h)
├── index.css                        ← variables CSS globales
├── components/layout/
│   ├── Navbar.tsx                   ← navbar dynamique (Mon espace si connecté)
│   └── Footer.tsx                   ← footer dark navy responsive
├── pages/
│   ├── HomePage.tsx                 ← landing page principale
│   ├── TarifsPage.tsx               ← page tarifs (carte 19,90€ animée)
│   ├── ExemplePage.tsx              ← exemple rapport interactif
│   ├── ContactPage.tsx              ← formulaire contact
│   ├── LoginPage.tsx                ← connexion email/password + Google
│   ├── SignupPage.tsx               ← inscription avec vérification email
│   ├── DashboardPage.tsx            ← dashboard utilisateur (données fictives pour l'instant)
│   ├── AuthCallbackPage.tsx         ← /auth/callback (confirmation email avec animation)
│   ├── ForgotPasswordPage.tsx       ← /mot-de-passe-oublie
│   └── ResetPasswordPage.tsx        ← /auth/reset-password
├── lib/supabase.ts                  ← client Supabase (vraies clés dans Vercel)
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
- Pill glissante avec `layoutId="nav-pill"` Framer Motion
- Si connecté → bouton **"Mon espace"** avec dropdown (Mon dashboard + Se déconnecter)
- Si non connecté → Connexion + S'inscrire
- Mobile : menu overlay animé avec même logique connecté/non connecté
- Détecte la session via `supabase.auth.getSession()` + `onAuthStateChange`

### App.tsx
- **SessionManager** intégré : gère la session 1h via localStorage (`analymo_login_time`)
- Vérifie toutes les 60 secondes si la session a expiré (> 3600000ms)
- À la connexion → stocke timestamp. À la déconnexion → supprime timestamp
- Routes : `/`, `/tarifs`, `/contact`, `/exemple`, `/connexion`, `/inscription`, `/dashboard`, `/auth/callback`, `/mot-de-passe-oublie`, `/auth/reset-password`

### SignupPage.tsx
- Formulaire nom + email + mot de passe
- Connexion Google disponible
- Détecte email déjà existant via `identities.length === 0` → message clair
- Page verify : logo 56px centré, icône Mail 40px, titre 32px, texte spams ajouté
- Bouton "J'ai validé, me connecter" → `/connexion`
- Bouton "Renvoyer le mail" → `supabase.auth.resend({ type: 'signup', email })` + message si trop tôt (60s)
- Bouton "Modifier l'email" → remet sur formulaire + reset `loading` à false

### LoginPage.tsx
- Connexion email/password + Google
- Détecte email non confirmé → `error.message.includes('Email not confirmed')` → message pour se réinscrire
- Lien "Mot de passe oublié" → `/mot-de-passe-oublie`

### AuthCallbackPage.tsx (`/auth/callback`)
- Animation barre de progression ~6 secondes (`p + 5` toutes les 300ms)
- 3 états : loading (spinner + barre) → success (check vert + bouton Se connecter) → error (croix rouge + bouton Se réinscrire)
- Pas de redirection automatique après succès → bouton manuel "Se connecter"
- Lien expiré après 24h → message + bouton "Se réinscrire"

### ForgotPasswordPage.tsx (`/mot-de-passe-oublie`)
- Formulaire email
- Message honnête après envoi : "Si un compte existe avec cet email..." en `fontSize: 16, fontWeight: 600`
- Supabase ne révèle pas si l'email existe (sécurité) → message volontairement ambigu
- Même design que autres pages auth (panel gauche + formulaire droite)

### ResetPasswordPage.tsx (`/auth/reset-password`)
- Détecte token via `onAuthStateChange` (event `PASSWORD_RECOVERY`)
- Si token invalide/expiré → page erreur avec bouton "Nouvelle demande"
- Formulaire : nouveau mot de passe + confirmation + icône œil show/hide
- Après succès → page confirmation verte + redirection auto vers `/connexion`

### HomePage.tsx
- Titre Hero : `clamp(40px,5vw,72px)` (réduit depuis 96px)
- "Analysez vos documents" sur une seule ligne (br supprimé)
- Téléphone : `lg:justify-center` + `w-[200px] h-[420px]` sur mobile + `mt-8 lg:mt-0`
- Trait teal SectionTitle : `duration: 2.5, delay: 0.2, ease: [0.22,1,0.36,1]`
- Trait Hero : `duration: 1.4`
- SectionTitle accent : `inline-block max-w-fit` pour éviter trait pleine largeur sur mobile
- HowItWorks : title="Trois étapes. Une décision" accent="éclairée." (séparé pour mobile)
- Sections dans l'ordre : Hero → StatsBar → Problem → Solution → HowItWorks → AvantApres → ForWho → Testimonials → CtaFinal

### TarifsPage.tsx
- Max-width `max-w-6xl`
- Carte 19,90€ : animation flottante + ombre pulsante
- Badge étoile "Le plus populaire"
- Zéro emoji dans les cartes
- FAQ 3 questions

### Footer.tsx
- Dark navy `#0f2d3d`
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`

---

## 🗄 Supabase — Configuration complète

**Project ID :** `veszrayromldfgetqaxb`
**Project URL :** `https://veszrayromldfgetqaxb.supabase.co`

### Tables créées :
- `profiles` — id, email, nom, prenom, email_verified, created_at + trigger auto à l'inscription
- `analyses` — type, status, title, address, score, avis_analymo, avis_color, risques (jsonb), travaux_estimes, impact_financier, detail_documents (jsonb), rapport_pdf_url, price
- `documents` — analyse_id, nom_detecte, type_document, storage_path, supprime
- `payments` — analyse_id, stripe_session_id, amount, status, facture_url
- `comparaisons` — analyse_ids (jsonb), avis_final
- `emails_log` — type (confirmation_inscription/recu_paiement/analyse_prete)
- RLS activé sur toutes les tables (chaque user voit uniquement ses données)
- Trigger `handle_new_user` → crée automatiquement un profil à chaque inscription

### Auth configuré :
- Email/password ✅
- Google OAuth ✅
- Confirm email activé ✅
- SMTP Mailjet : `in-v3.mailjet.com` port 587
- Sender : `notification@analymo.fr` / Reply-to : `hello@analymo.fr`
- Minimum interval entre emails : 60 secondes
- Templates emails personnalisés : Confirm sign up ✅ + Reset password ✅
- Logo dans les mails : `https://appdemo.analymo.fr/logo.png` hauteur 72px
- Confirm sign up redirige vers `/auth/callback`
- Reset password redirige vers `/auth/reset-password`

### URL Configuration Supabase :
- Site URL : `https://appdemo.analymo.fr` (à changer en `https://analymo.fr` lors de la migration)
- Redirect URLs : `/auth/callback` et `/auth/reset-password` pour appdemo + analymo.fr + www.analymo.fr

### Vercel Environment Variables :
- `VITE_SUPABASE_URL` = `https://veszrayromldfgetqaxb.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = publishable key Supabase

### Mailjet :
- Compte : alexandre.rt25@gmail.com
- Domaine vérifié : analymo.fr
- Adresses actives : notification@analymo.fr + hello@analymo.fr
- 6000 emails/mois gratuits

### Google Cloud Console :
- Projet : "Analymo Auth" (analymo75000@gmail.com)
- Client OAuth : "Analymo web"
- Origines JS autorisées : supabase.co + analymo.fr + www.analymo.fr + appdemo.analymo.fr
- Redirect URIs : toutes les variantes /auth/callback + /auth/reset-password
- Branding : nom "ANALYMO" + logo uploadé mais pas encore validé → affiche URL Supabase dans popup Google

---

## ⚠️ Points importants
1. **Pas de FooterSection dans les pages** — le Footer est dans le layout `App.tsx`
2. **vercel.json** — rewrites SPA (ne pas supprimer)
3. Le logo dans la Navbar fait `h-14`
4. Pour supprimer un compte test → toujours **Authentication → Users** (pas Table Editor)
5. Table Editor = données supplémentaires seulement. Supprimer là sans supprimer dans Auth → Supabase croit que le compte existe encore
6. Session 1h gérée via localStorage dans SessionManager (plan Supabase gratuit ne permet pas config sessions)
7. Google OAuth branding pas encore validé → à régler en publiant l'app Google (Centre de validation)

---

## 🔜 Prochaines étapes
- [ ] Centrage mobile homepage (icônes et textes des sections)
- [ ] Connecter Dashboard à Supabase (données réelles)
- [ ] Coder l'API `/api/analyse` (appel Claude API)
- [ ] Créer compte Stripe + 4 produits
- [ ] Coder l'API `/api/checkout` (Stripe)
- [ ] Google OAuth branding (publier app Google)
- [ ] Page admin (voir tous les clients/analyses) — prévu plus tard
- [ ] Vérifier page Exemple à jour
