# VERIMO — Contexte projet — 7 août 2026 (mis à jour après la session agences + métriques admin + fin de démo)

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

## 🆕 DERNIÈRE SESSION — 7 août 2026 ⭐⭐⭐

> Point de départ : « ma liste Clients Pro mélange les pros et les agences, c'est mal organisé ». La session a dérivé sur **quatre chantiers** — refonte agences, correction en profondeur des métriques admin, suppression d'agence en cascade, automatisation de la fin de démo — plus la découverte que **six compteurs du back-office mesuraient la mauvaise chose depuis le début**.
>
> 🧭 **Leçon n°1 — quand deux objets métier partagent une liste, l'un des deux est toujours mal servi.** La liste « Clients Pro » était construite à 100 % depuis `profiles`. L'agence n'était qu'un bandeau doré calculé, jamais une ligne à part entière. Conséquences en cascade : agences sans membre invisibles, compteurs faux dès qu'on filtrait, statut d'agence illisible sans cliquer. **Le correctif n'était pas cosmétique : il fallait faire de l'agence une entité de premier plan, lue depuis `agences`.**
>
> 🧭 **Leçon n°2 — un compteur qui n'a jamais été remis en question depuis sa création est probablement faux.** `email_verified` servait de preuve d'activation dans 6 endroits. Or `admin-user-management` crée tous les comptes avec `email_confirm: true` → **le drapeau est vrai à la seconde où l'admin crée le compte, avant toute action du prospect**. Le tableau de bord affichait donc « 7 nouveaux clients » pour 7 prospects qui n'avaient jamais ouvert leur lien.
>
> 🧭 **Leçon n°3 — Alex a tranché contre ma recommandation, et il avait raison.** J'ai proposé un entonnoir de prospection volontairement **non filtré** par le sélecteur de période (argument : une démo met des semaines à convertir). Alex : « si on met 7 jours, il faut voir les 7 jours, c'est aussi simple que ça ». **Un filtre qui ne filtre pas est un bug, quelle que soit la justification métier.** Corrigé en cohortes : le filtre porte sur la date d'envoi, le suivi reste complet ensuite.
>
> 🧭 **Leçon n°4 — vérifier les règles de suppression AVANT de coder un bouton destructeur.** Avant d'écrire la suppression d'agence, deux requêtes sur `information_schema` ont listé les 8 + 15 clés étrangères concernées. Résultat décisif : `payments.user_id` est en `SET NULL` → **le CA survit à la suppression des comptes**. Si ça avait été `CASCADE`, le bouton aurait effacé l'historique comptable (obligation légale de conservation 10 ans). **Ne jamais coder une cascade sans avoir lu les contraintes.**

### ✅ Chantiers livrés

**1. 🏛 CLIENTS PRO — l'agence devient une entité, pas un bandeau**

- **Trois sous-onglets** en tête de page : `👤 Comptes individuels` · `🏛 Agences` · `Tous`. État `proScope`, défaut `individuels`.
- **L'onglet Agences lit `agences` directement** (plus de dérivation depuis `profiles`) → une agence sans membre actif est enfin visible. Chaque ligne : nom, badge de statut, sièges `N/max`, pool de crédits (base + bonus), responsable, date de renouvellement.
- ⚠️ **`agences.status` est INUTILISABLE comme signal démo/payant** : il vaut `'active'` dès la création dans les deux branches de `admin-user-management`. Le badge se base donc sur **l'abonnement réel des membres** (`pro_subscriptions`) + `nb_users_max <= 1`. Ne pas re-brancher sur `status`.
- **Bandes repliées par défaut** (sémantique inversée : `expandedAgences` contient les agences OUVERTES, plus `collapsedAgences`).
- **Bug corrigé** : la bande affichait `agenceMembers.length`, c'est-à-dire les membres **filtrés**. Une agence de 3 membres affichait « 1 membre » sous le filtre « Inscrits non activés ». Recalculé sur `clients` complet + mention « X masqués par le filtre ».
- **En-tête honnête** : « 18 comptes individuels · 4 agences (2 sièges) » au lieu de « 20 clients pro ». Une agence = 1 contrat, ses membres sont des **sièges**.
- **Compteurs de pastilles bornés à la portée active** (bug introduit puis corrigé le jour même : « Agences (1 · 4 comptes) » affichait 4 alors que 2 lignes seulement s'affichaient en mode Individuels).
- **Pastille « 🏛 Agences » remplacée par « 🏛 Agence à structurer »** : ne fait plus doublon avec l'onglet, isole les profils `pro_profile_type='agence'` **sans entité agence** — ce sont des prospects à 149,90 €. Alex en avait 2 (Isabelle RIBARD / Maison Rouge, Julien DOMINGO).
- **Animations** : pastille active glissante (`layoutId` framer-motion), fondu croisé au changement d'onglet, dépliement à hauteur animée (260 ms) sur les deux listes.

**2. 🏛 AGENCE — création, renommage, mode démo, suppression**

- **Bloc de rappel à la création** (`AgenceRecapCallout`, composant module-level) : s'affiche dès que « Agence » est sélectionné dans **les deux** formulaires. Carte à en-tête doré, points sur 2 colonnes. Rappelle : la personne devient Responsable · la raison sociale **devient le nom de l'agence** (affiché en direct pendant la saisie, en rouge si vide) · c'est le responsable qui invite son équipe · **1 place jusqu'au premier paiement** · aucun crédit offert à la création (les champs sont masqués pour ce profil).
- **Raison sociale rendue obligatoire** pour un profil agence, dans les deux formulaires (champ rouge + bouton bloqué). C'est ce qui a produit « Agence Julio » : le champ était vide, le code retombe sur `full_name`.
- **Renommage possible** (bouton ✏️ sur la fiche agence, Entrée pour valider, Échap pour annuler). Avant, `raison_sociale` n'était modifiable **nulle part** — il fallait passer par Supabase Studio. ⚠️ **Nécessite la policy RLS UPDATE admin sur `agences`** (SQL passé le 07/08, voir plus bas).
- **Bouton « 🎬 Mode démo agence »** (visible seulement si `nb_users_max <= 1`) : ouvre 3 places + crédite le pool de 2 complètes / 5 simples en un clic. Sans ça, une démo agence reste à 1 place avec pool vide → le prospect ne peut pas tester le multi-utilisateurs, qui est pourtant ce qu'il achète.
- **Alerte sur la fiche d'un membre** : encart orange rappelant que des crédits offerts **depuis cette fiche seront personnels**. Deux portes existent et rien ne les distinguait : fiche membre → `credit_grants` (perso) · fiche agence → `agences.credits_*_bonus` (pool partagé).
- **🗑 Suppression d'agence en cascade totale** — nouvelle action `delete_agence` dans `admin-user-management` :
  - Supprime les comptes auth des membres **puis** l'entité agence (dans cet ordre : si une suppression échoue à mi-parcours, l'agence existe encore et l'état reste lisible).
  - Confirmation par **saisie du nom exact** de l'agence + décompte réel affiché avant (comptes / analyses / dossiers) + liste nominative.
  - Garde-fous : un compte `role='admin'` n'est jamais supprimé ; si **aucun** compte n'a pu être effacé, l'agence est conservée.
  - **Décision produit d'Alex** : suppression totale assumée. Un ex-agent qui veut revenir refait une demande pro depuis le site. Pas de case optionnelle, pas de détachement en pro solo.

**3. 📊 MÉTRIQUES ADMIN — 6 compteurs corrigés + entonnoir**

- **Cause racine unique** : `email_verified` ne mesure pas l'activation (voir Leçon n°2). Remplacé partout par `last_sign_in_at`, exposé par la fonction SQL `get_users_last_sign_in()` — **déjà utilisée par Clients Pro, qui était le seul onglet juste.**
- **Onglet Utilisateurs** : badge « ✓ via Email » → **« ✓ Compte activé »** / « ⚠ Jamais connecté ». Filtres « Vérifiés / Non vérifiés » → **« Activés / Jamais connectés »**. Tri, fiche détail et `loadUsers` (qui ne chargeait pas les connexions) alignés.
- **Tableau de bord** : « Nouveaux clients » → **« Nouveaux clients actifs »** + mention « X en attente ». « Nb de pro abonnés » précisé « En cours aujourd'hui » (c'est un **état**, pas un flux mensuel).
- **Analyse/CA** : « Nouveaux abonnés pro » → **« Nouveaux comptes pro »** (le compteur lisait `profiles.role='pro'`, jamais les abonnements — le libellé était simplement faux). « Nouveaux inscrits » → « Nouveaux inscrits actifs ». Graphique hebdo → « Inscriptions activées par semaine ».
- **🎁 Bloc OFFERTS réparé** : lisait `payments` avec `amount=0`, or les crédits offerts s'écrivent dans **`credit_grants`** puis `pro_unit_purchases` — **jamais dans `payments`**. Il affichait donc structurellement 0. Rebranché sur `credit_grants` + `agence_credit_grants`.
- **`prevActiveProCount` : n'est plus codé en dur à 0.** `pro_subscriptions` ne stocke que l'état courant (un abonnement résilié ne laisse que `canceled`, sans trace de sa période d'activité). Reconstitution par les dates : *actif à la date D = souscrit avant D ET pas encore résilié à D* (`created_at`, `canceled_at`, repli `current_period_end`). **L'évolution est aussi AFFICHÉE** — elle était calculée mais n'apparaissait nulle part. ⚠️ Limite assumée : un abonnement résilié puis repris écrase la ligne, il compte comme un seul.
- **🎯 Entonnoir de prospection** (Analyse/CA) : Démos envoyées → Activées → Ont testé → Payées, avec pourcentages + encart « démos en sommeil » (> 30 j sans conversion).
  - **Filtré sur la période sélectionnée** (date d'envoi de la démo). Les 3 étapes suivantes suivent la cohorte **sans borne de date** — sinon une démo envoyée en fin de période et testée après serait invisible et les taux sous-évalués. Requête `analyses` dédiée pour cette cohorte, ne PAS réutiliser la liste `analyses` bornée à la période.
  - ⚠️ **« Payées » croise `pro_demo_converted_at` AVEC un abonnement actif.** Le bouton admin pose `pro_demo_converted_at` sans paiement : sans ce croisement, chaque prolongation d'essai gonflerait le taux de conversion.
- **Ruban démos sur le tableau de bord** : `X envoyées ce mois · Y activées (%)` (bornés au mois, cohérent avec le titre de la page) **puis, après un séparateur visuel**, `N en cours au total` + badge `⏰ à relancer`. Ces deux derniers sont volontairement hors période : une démo de juin qui dort est précisément celle à rappeler.
- **Règle établie** : *Tableau de bord = le mois en cours, tout chiffre d'état doit le dire explicitement. Analyse/CA = tout suit le sélecteur, sans exception.*

**4. 🎁 FIN DE DÉMO — automatisée**

- **Diagnostic** : `pro_status='demo'` n'est lu qu'à **un seul endroit** dans tout le code client (`DashboardProPage`). Il ne bloque rien — il affiche le bandeau orange et **masque la carte de plan recommandé**. L'onglet « Mon abonnement » reste accessible en permanence : un client en démo a toujours pu payer.
- **Le trou** : la bascule `demo → active` n'était déclenchée que par un paiement **ou un clic admin**. Un prospect ayant consommé ses 2 crédits restait étiqueté démo indéfiniment et **ne voyait jamais l'offre payante mise en avant**. Cas réel constaté sur Alain CADIER (2 analyses faites, 0 crédit restant, toujours en démo).
- **Bascule automatique livrée** (`HomeViewPro`) : dès que le solde tombe à 0, `pro_status='active'` + `pro_demo_converted_at`. Garde-fou `.eq('pro_status','demo')` pour ne jamais écraser un compte passé actif entre-temps. État local `demoAutoConvertie` pour un affichage immédiat sans rechargement.
- **Le bandeau bleu « Vous avez testé Verimo » est CONSERVÉ après la bascule** (`demoCreditsUsed` ne dépend plus de `isDemo`). Le prospect voit donc deux chemins : « je souhaite être rappelé » **et** la carte du plan recommandé.
- **Champ « Plan recommandé » ajouté au formulaire « Inviter en démo »** — il n'existait que dans « Créer un client pro ». C'est précisément le formulaire qui sert à prospecter : les 17 démos existantes n'ont donc aucun plan recommandé et tomberont sur le bandeau générique. ⚠️ Nécessite le redéploiement de `admin-user-management` (`pro_recommended_plan` ajouté à `create_pro_demo`).
- **Bouton admin renommé « Passer en compte actif »** (ex-« Activer le compte », puis « Terminer la démo »). Il ne sert plus que pour une démo qui traîne **sans avoir été consommée**. La modale explique les 4 effets réels et précise que la bascule est automatique dans les autres cas.
- **Lien discret « Déjà convaincu ? Voir les forfaits »** dans le bandeau orange, dès qu'**un seul** des deux crédits est consommé. Angle mort corrigé : un pro qui teste une analyse et garde l'autre ne voyait aucune proposition.

**5. 🪟 MODALES — verrou de défilement global**

- `useScrollLock(actif)` (hook module-level) : fige `body.overflow` et compense la largeur de la barre de scroll (sinon la page saute latéralement à l'ouverture).
- Branché sur le composant `Modal` **et** sur les 7 modales écrites à la main (fiche client pro, onglet Analyses).
- Ajouts sur `Modal` uniquement : **fermeture par Échap** et **clic sur le fond**. Volontairement pas sur les modales manuelles — certaines bloquent la fermeture pendant un envoi en cours.

### ⚠️ Découvertes NON corrigées

**A. 🟠 Les liens d'invitation pro ne s'invalident jamais**
- `resend_pro_invitation` crée un nouveau token **sans annuler les précédents**. Trois mails = trois liens valides, **sans date d'expiration** (contrairement aux invitations d'agence, expirées à 7 j).
- ✅ **Mais le trou est refermé côté consommation** : `setup_pro_account` vérifie `profiles.pro_onboarding_done === true` et refuse (« Ce compte est déjà actif »). Contrôle **côté serveur**, un appel API direct est aussi bloqué.
- Le risque résiduel ne concerne donc **que les comptes jamais activés** : un lien de mai fonctionne toujours. **Alex a tranché : on laisse tel quel.** Ne pas relancer le sujet.

**B. 🟡 `profiles.agence_role` n'est jamais nettoyé**
- `profiles.agence_id` est en `ON DELETE SET NULL`, mais `agence_role` est une simple colonne TEXT sans FK → elle survit à la suppression de l'agence.
- Sans importance depuis que la suppression d'agence efface aussi les comptes. **Redeviendrait un bug** si un détachement en pro solo était implémenté un jour : un ex-agent garderait « Abonnement géré par votre agence » et ne pourrait plus jamais souscrire.

**C. 🟡 `dossier_notes` part en CASCADE avec l'agence**
- Contenu écrit par les clients (notes sur dossiers), détruit sans avertissement. Cohérent avec la décision de suppression totale, mais à savoir si la politique change.

**D. 🟢 Délai d'activation non mesurable**
- `last_sign_in_at` ne garde que la **dernière** connexion, pas la première. On sait « il s'est connecté », pas « il a mis 3 jours à ouvrir le lien ». Il faudrait une colonne dédiée — inutile au volume actuel.

### 📁 Fichiers livrés (4)

| Fichier | Contenu | Déploiement |
|---|---|---|
| `supabase/functions/admin-user-management/index.ts` | 🆕 action `delete_agence` · `pro_recommended_plan` dans `create_pro_demo` | ⚠️ **Supabase Studio → Edge Functions → Deploy** (le push GitHub ne suffit PAS) |
| `src/pages/AdminPage.tsx` | onglets agences · métriques · entonnoir · suppression · `useScrollLock` | GitHub → Vercel |
| `src/pages/DashboardProPage.tsx` | bascule auto fin de démo · lien forfaits dans le bandeau orange | GitHub → Vercel |
| `src/pages/MonEquipePage.tsx` | 2 messages distincts selon abonnement jamais activé / places pleines | GitHub → Vercel |

> **Ordre imposé** : SQL → edge function → frontend. Le bouton « Renommer » échoue **silencieusement** (0 ligne modifiée, aucune erreur) sans la policy RLS. `delete_agence` renvoie « Action inconnue » si l'edge function n'est pas redéployée.
> `tsc --noEmit -p tsconfig.app.json` + `vite build` OK à chaque étape.

### 🗄️ SQL de la session

```sql
-- Policy RLS : autoriser l'admin à MODIFIER une agence (renommage).
-- Les policies du 22 juin ne donnaient que le SELECT.
DROP POLICY IF EXISTS "Admin peut modifier les agences" ON public.agences;
CREATE POLICY "Admin peut modifier les agences"
  ON public.agences FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
```

### 🔑 Règles de suppression vérifiées en prod (07/08) — À NE PAS REDÉCOUVRIR

**Suppression d'une `agences`** :
- `CASCADE` (lignes détruites) : `agence_members`, `agence_invitations`, `agence_credit_grants`, `dossier_notes`
- `SET NULL` (données conservées) : `analyses`, `pro_folders`, `envois_rapports`, `profiles`

**Suppression d'un compte (`profiles` / `auth.users`)** :
- `CASCADE` : `analyses`, `documents`, `comparaisons`, `pro_folders`, `pro_subscriptions`, `credit_grants`, `report_shares`, `pro_invitations`, `emails_log`, `banners`
- ✅ **`SET NULL` : `payments`, `pro_unit_purchases`, `credit_grants.granted_by`, `contact_pro.converted_profile_id`** → **le CA et l'historique de facturation survivent** (les paiements gardent `customer_email` / `customer_name`, et `PaymentsTab` sait déjà les afficher comme `_orphan`)
- `NO ACTION` : `agence_credit_grants.granted_by` (ne concerne que les admins, jamais bloquant en pratique)

### 🧾 Points annexes établis

- **Découverte sur les données d'Alex** : 4 agences en base, dont **3 coquilles vides** (Boris, Kerlio Aga, Robin GEMOZ) créées la nuit du 28 mai entre 00h29 et 01h02 — soit pendant le développement de la fonction agence, avant que le rattachement du responsable ne marche. `membres_total = 0` sur les trois. Julio (23h02, la dernière) est la seule qui ait fonctionné. Elles étaient **invisibles dans l'admin** avant cette session.
- **`agences.status` vaut `'active'` sur les 4**, y compris les démos → confirme qu'il ne sert à rien comme signal.
- **Julio est à `nb_users_max = 5`** (réglage manuel d'Alex en test) avec 9 complètes / 5 simples au pool, sans abonnement. Le bouton « Mode démo agence » n'apparaît donc pas sur sa fiche (normal, il ne cible que `<= 1`).
- **Les modales de création sont passées de 620/640 px à 880 px**, ce qui a permis de passer le bloc de rappel agence sur 2 colonnes.
- **`pro_status` n'est lu qu'une seule fois côté client** (`DashboardProPage` l.~932). Toute évolution de la logique démo passe par là.
- **Le formulaire « Créer un client pro » masque volontairement les champs de crédits pour un profil agence** (commentaire d'origine : « pas de geste commercial sur ce plan, la souscription gère les crédits »). Une agence créée par ce formulaire démarre donc à **0 crédit**, sans moyen d'en donner à la création → passer par le pool ensuite. C'est désormais écrit dans le bloc de rappel.

---

## 📌 SESSION — 3 août 2026 ⭐⭐⭐

> Point de départ : Alex trouve que le site « fait un peu trop intelligence artificielle », et soupçonne la typographie. La session a dérivé sur trois chantiers — identité visuelle, garde-fous de pages à l'upload, refonte de l'affichage des fichiers déposés — plus un audit des limites d'analyse et **une découverte de coût API majeure non corrigée**.
>
> 🧭 **Leçon de méthode n°1 — répondre à la question posée, pas à celle qu'on préfère.** Alex a demandé un avis sur la typo ; j'ai livré un redesign complet du hero (nouveau visuel, palette repondérée, copy réécrite). Il n'a même pas pu juger la typo, tout avait bougé en même temps. **Isoler une variable à la fois quand on soumet un choix esthétique.**
>
> 🧭 **Leçon de méthode n°2 — le périmètre montré est le périmètre à modifier.** Alex envoie 2 captures de sections mal coupées ; j'ai modifié le composant partagé `SectionTitle`, donc les 8 sections. Correction : une prop optionnelle `saut`, activée sur les 2 sections concernées uniquement. **Un composant partagé se modifie par option, pas par changement global.**
>
> 🧭 **Leçon de méthode n°3 — trois refus d'affilée = l'hypothèse est fausse, pas le goût du client.** 3 polices proposées → refus. 8 polices → refus. C'est en montrant les polices **sur du vrai contenu Verimo** (score /20, catégories, montants) et en sortant de Google Fonts que 3 candidates ont accroché. **Une police se juge sur ce qu'elle porte, pas sur un titre isolé.**
>
> 🧭 **Leçon de méthode n°4 — Alex a rattrapé DEUX fois la même erreur de conception.** J'ai proposé de détecter les PDF fusionnés en comptant les **types** de documents → il signale que 2 PV d'AG donnent 1 seul type. J'ai corrigé en comptant les **exemplaires (type + date)** → il signale qu'un DDT contient des diagnostics de **dates et diagnostiqueurs différents**. **Conclusion établie : il n'existe aucun critère automatique séparant un document composite légitime d'un dossier fusionné. La distinction est une convention métier, elle doit être écrite cas par cas.** Chantier abandonné au profit d'un simple plafond de pages.

### ✅ Chantiers livrés

**1. 🎨 IDENTITÉ TYPOGRAPHIQUE — Gabarito sur les titres des pages publiques**

- **Diagnostic** : le site n'utilisait que **DM Sans**, display et body confondus. La hiérarchie ne reposait que sur taille + graisse (`font-black tracking-[-0.03em]`, 27 occurrences). DM Sans est dans le top 5 des Google Fonts des templates SaaS → d'où l'impression « généré ».
- **Choix retenu par Alex** : **Gabarito** (Google Fonts, graisses 700/800/900), en **`font-extrabold` (800)** — le 900 est trop lourd sur des formes rondes. Écartées : Space Grotesk (police de prédilection des startups IA/crypto — ramènerait exactement au problème de départ) et Instrument Serif (pas de graisse grasse, display uniquement).
- **Portée : `h1` et `h2` des pages publiques UNIQUEMENT.** Ni le texte courant, ni les `h3`, ni le dashboard, ni les rapports, ni l'admin. **C'est le contraste avec DM Sans qui fait exister la police de titre** — l'appliquer partout la rendrait invisible.
- **Deux mécanismes différents, pour une raison précise** :
  - **HomePage** utilise les classes Tailwind → `fontFamily.display` déclaré dans `tailwind.config.js` (**qui était vide, `theme: { extend: {} }` — c'est la première entrée du fichier**), puis `font-display font-extrabold` sur les 4 titres (h1 hero mobile + desktop, `SectionTitle` mobile + desktop).
  - **Les 15 autres pages publiques** ont leurs titres en **style inline** (`fontWeight: 900`, aucun `className`) → ~20 modifications éparpillées dans 8 fichiers auraient été nécessaires. À la place : une règle CSS ancrée sur `PublicLayout`.
- **Pourquoi la règle CSS fonctionne malgré les styles inline** : ces titres imposent `fontSize`, `fontWeight`, `color`… mais **aucun ne définit `fontFamily`**. Sans conflit, la règle s'applique. ⚠️ Si un titre reçoit un jour `fontFamily` en dur, la règle sera ignorée pour lui.
- ⚠️ **Deux points de réglage à connaître** pour changer de police plus tard : `fontFamily.display` dans `tailwind.config.js` (homepage) **et** la règle `.verimo-public h1, h2` dans `index.css` (le reste). Le `<link>` de `index.html` est commun.
- ⚠️ **À vérifier sur petit écran** : le h1 mobile porte `whitespace-nowrap` sur « avant de signer. » à `clamp(26px, 6.5vw, 34px)`. Gabarito est plus large que DM Sans. Si ça déborde sur iPhone SE → descendre le clamp à 24px.

**2. 🧹 HOMEPAGE — dégraissage du motif répété**

- **Badge « Analyse immobilière intelligente » supprimé** du hero desktop (il n'existait pas sur mobile, bloc `hidden lg:grid`). Motif : le mot « intelligente » contourne l'interdiction du mot « IA » sans rien dire au client.
- **Animation du trait retirée des 8 `SectionTitle`**, conservée dans le hero. Le **trait statique est gardé partout** (mêmes valeurs : `-bottom-1`, `h-[4px]`, `bg-[#2a7d9c]/25`). Raison : un trait fixe répété 8 fois est une règle graphique ; une animation répétée 8 fois est du bruit. Bonus : 7 animations au scroll en moins sur mobile.
- **Prop `saut` ajoutée à `SectionTitle`** : insère un `<br />` avant l'accent bleu. Activée sur 2 sections seulement (« Mais avez-vous vraiment lu ? » et « en un seul rapport. »). L'accent reste en `inline-block` — nécessaire pour que le trait se cale sur la largeur du mot et non du conteneur. Pour un futur titre trop long : ajouter `saut` sous son `accent=`, sans toucher au composant.

**3. 🔒 GARDE-FOUS DE PAGES À L'UPLOAD — `NouvelleAnalyse.tsx`**

- **Diagnostic** : **aucune limite de pages n'existait**, ni en simple, ni en complète, ni par document, ni au total. Seules limites : 20 Mo/fichier, 1 fichier en simple, 15 en complète.
- **Le comptage de pages arrivait trop tard** : il se faisait dans la boucle d'upload de `lancerAnalyseEdge` (`analyse-client.ts` l.~107), donc **après** la consommation du crédit (`NouvelleAnalyse` l.~464). Impossible d'avertir avant lancement. → **Comptage déplacé au dépôt du fichier**, dans `handleFiles`, où le PDF est déjà lu en mémoire pour le test de mot de passe (aucune lecture supplémentaire). Le comptage de `analyse-client.ts` reste en place, il alimente `filePages` pour le découpage serveur.
- **Seuils retenus** (calibrés sur les chiffres terrain d'Alex : RCP courants 60-70 p, gros RCP 150-200 p, PV d'AG 20-30 p, DDT 60-70 p) :

| Mode | Seuil | Comportement |
|---|---|---|
| Simple | 81 → 150 p | **Modale de confirmation** : « Continuer en analyse simple » / « Passer à l'analyse complète — 19,90 € » |
| Simple | > 150 p | **Refus**, message orientant vers l'analyse complète |
| Complète | > 200 p / doc | **Refus sec**, proposition de scinder le fichier en deux (15 fichiers autorisés, ça ne coûte rien au client) |

- **Bascule fonctionnelle** : le bouton de la modale fait `setType('complete')`, **conserve le fichier déjà déposé** et renvoie à l'étape `type_bien` → le client ne re-uploade pas.
- ⚠️ **Pas d'avertissement en analyse complète, volontairement** : le client a déjà l'offre supérieure, il n'a nulle part où monter. Le refus sec suffit.
- **Repli sûr** : `compterPages` renvoie 0 si `pdf-lib` échoue → le fichier passe sans contrôle. Mieux vaut laisser passer un PDF exotique valide que bloquer un client à tort.
- **Consigne ajoutée au bloc « Avant de déposer vos documents »**, adaptée au mode : « 150 pages maximum » / « 200 pages maximum par document ».

**4. 🔐 DÉTECTION DES PDF PROTÉGÉS — corrigée**

- `isPdfPasswordProtected` ne lisait que les **2048 premiers octets** à la recherche de `/Encrypt`. Or **le dictionnaire de chiffrement est référencé depuis le trailer, en FIN de fichier** → la majorité des PDF protégés passaient à travers.
- Conséquence : upload, crédit consommé, appel API, échec, remboursement automatique. Le client perdait plusieurs minutes pour une erreur incompréhensible ; Verimo payait l'appel.
- **Corrigé** : lecture de la tête (2048 o) **et** de la queue (4096 o). Aucune dépendance ajoutée.
- ⚠️ **Toujours aucun contrôle serveur** sur les PDF protégés (ni dans `analyser`, ni dans `analyser-run`). `compterPagesPdf` utilise `ignoreEncryption: true` et ne sert donc pas de filet.

**5. 📄 AFFICHAGE DES FICHIERS DÉPOSÉS — remonté et refondu**

- Les fichiers s'affichaient **tout en bas de la page**, après le bouton et le bloc de conditions → invisibles sans scroller. **Déplacés juste après le bandeau d'erreur, avant la zone de dépôt.**
- **Analyse simple** : carte large centrée, bordure teal 2px, icône 62px, nom en 17px, et **deux blocs chiffrés en 19px** (pages / Mo) au lieu du gris 11px.
- **Analyse complète** : ligne de récapitulatif avec totaux (« 4 documents prêts · 187 pages · 12,3 Mo ») + grille de cartes avec badges lisibles 12,5px.
- Badge « PDF ✓ » retiré (tous les fichiers sont des PDF, il ne disait rien). Clé React `key={i}` remplacée par `nom_taille_index` — avec un index seul, supprimer un fichier au milieu décalait l'affichage des suivants.

### ⚠️ Découvertes NON corrigées — par ordre de valeur

**A. 🔴 AUCUN PROMPT CACHING + le découpage renvoie le PDF ENTIER à chaque tranche — probablement le premier poste de coût API**
- Vérifié : **zéro `cache_control`** dans tout `analyser-run`.
- Dans `extraireParTranches`, les N tranches envoient **chacune le même `file.id` complet** — seule la consigne de plage de pages change (`Extrais les faits des pages X à Y`).
- **Conséquence : les tokens d'entrée d'un document sont facturés autant de fois qu'il a de tranches.** Un document de 160 pages = 8 tranches = **8 × son coût d'entrée**. Sur un dossier de 15 gros documents, la facture API peut dépasser les 19,90 € encaissés.
- Ça n'arrive pas sur des cas malveillants : **c'est le fonctionnement normal sur tout dossier volumineux**.
- **Correctif** : activer le prompt caching sur les appels de découpage (le document n'est facturé plein tarif qu'une fois, les tranches suivantes le relisent à tarif réduit). Modification dans `callAI`, **sans effet sur les résultats**.

**B. 🟠 Le mode `document` ne passe PAS par le découpage**
- Routage vérifié : `complement` → `runComplementMap` · `complete` **et** ≥ 6 docs → `runPhaseMap` · **sinon → `runAnalyseWithData` (appel unique)**.
- Donc en analyse simple, un PDF de 300 pages part **en une seule requête**, sans découpage. Au-delà de ~350 pages on approche la limite de contexte et le timeout de 385 s → échec franc.
- Le plafond à 150 pages livré aujourd'hui **couvre le cas en pratique**, mais la cause reste.

**C. 🟠 Aucun contrôle serveur du nombre de fichiers hors mode `complement`**
- `analyser/index.ts` l.~584 : le contrôle `storagePaths.length > 5` est **à l'intérieur du bloc `if (mode === 'complement')`**. Pour `mode: 'document'`, le serveur n'en fait aucun.
- Le `mode` vient du body de la requête et **n'est jamais recoupé avec le crédit consommé**. Un appel `fetch` direct avec `mode: 'document'` et 15 `storagePaths` passe.
- Même famille que la faille `consume_pro_credit` (backlog sécurité n°2) : **la logique métier vit dans le front**.
- ✅ **Ce qui EST bien vérifié côté serveur** (à ne pas re-signaler comme trou) : identité de l'appelant, propriété de l'analyse (403 sinon), et conformité des `storagePaths` au préfixe de l'analyse + absence de `..` (400 sinon). **La sécurité des données est bonne** ; c'est la logique commerciale qui manque.

**D. 🟡 Découpage : au-delà de 160 pages, les tranches s'épaississent silencieusement**
- `nbTranches = min(8, ceil(pages/20))` puis `taille = ceil(pages/nbTranches)`. Jusqu'à 160 p → 20 p/tranche. À 300 p → **38 p/tranche**. À 500 p → **63 p/tranche**.
- **Aucune page n'est ignorée**, tout est lu. Mais chaque tranche doit résumer 63 pages dans 32 000 tokens → **troncature silencieuse** de la sortie sur un document dense.
- C'est un problème de **qualité**, pas d'échec visible. Le plafond à 200 p/doc livré aujourd'hui limite l'exposition.

**E. 🟢 Détection des dossiers fusionnés — chantier ABANDONNÉ, ne pas le relancer tel quel**
- Objectif : repérer un client qui fusionne 8 documents en un seul PDF et paie l'analyse simple (4,90 €).
- **Trois pistes successives, toutes invalidées par Alex** : (1) compter les pages → un RCP de 90 p est légitime ; (2) compter les **types** de documents → 2 PV d'AG donnent 1 seul type ; (3) compter les **exemplaires par type + date** → un DDT contient des diagnostics de dates et de diagnostiqueurs différents et serait découpé en 8.
- **Conclusion établie** : structurellement, « un DDT » et « deux PV d'AG collés » sont identiques. Ce qui les sépare est une **convention du métier immobilier**, pas une propriété du fichier. Toute règle générale produira des faux positifs sur le DDT — **le cas le plus fréquent en analyse simple**.
- Si le chantier est repris un jour, il faudra **nommer explicitement les regroupements légitimes** (DDT entier quoi qu'il arrive, PV d'AG avec ses annexes, RCP avec ses modificatifs — liste à établir par Alex), et **commencer par une phase d'observation pure** : un champ `documents_ignores` rempli par le moteur **sans changer le comportement d'analyse**, observé 2 semaines en production avant d'activer quoi que ce soit.
- Alternative légère jamais testée : une phrase dans `buildDocumentPrompt` demandant au moteur de **signaler dans `avis_verimo`** que le fichier contient plusieurs documents et de préciser sur lequel porte l'analyse. Aucun champ nouveau, aucun blocage, retour arrière immédiat.

### 📁 Fichiers livrés (6)

| Fichier | Contenu | Déploiement |
|---|---|---|
| `index.html` | Gabarito ajoutée au `<link>` Google Fonts | GitHub → Vercel — **AVANT** `HomePage.tsx` |
| `tailwind.config.js` | `fontFamily.display` (première entrée du fichier) | GitHub → Vercel — **AVANT** `HomePage.tsx` |
| `src/index.css` | règle `.verimo-public h1, h2` | GitHub → Vercel |
| `src/App.tsx` | conteneur `.verimo-public` dans `PublicLayout` | GitHub → Vercel |
| `src/pages/HomePage.tsx` | badge retiré · trait statique · prop `saut` · `font-display` ×4 | GitHub → Vercel |
| `src/pages/dashboard/NouvelleAnalyse.tsx` | seuils de pages · modale · fix PDF protégé · affichage refondu | GitHub → Vercel |

> **Aucun SQL. Aucun redéploiement Supabase.** Tout est frontend.
> ⚠️ **Ordre imposé** : `index.html` + `tailwind.config.js` **avant** `HomePage.tsx` (sinon les titres restent en DM Sans le temps que la config arrive).
> Typecheck `tsc --noEmit -p tsconfig.app.json` et `vite build` OK sur chaque fichier. Vérifié dans le CSS compilé : `.font-display{font-family:Gabarito,...}` et `.verimo-public h1,.verimo-public h2{font-family:Gabarito,...}` sont bien générés.

### 🧾 Points annexes établis

- **`pdf-lib` est déjà une dépendance** (`^1.17.1`, ajoutée le 29/07) — réutilisée pour le comptage au dépôt, aucun ajout.
- **Modèle en production : `claude-sonnet-4-6`** (constante `AI_MODEL` dans `analyser-run`).
- **Tarif Haiku 4.5 vérifié le 03/08** (page officielle Anthropic) : **1 $ / M tokens en entrée, 5 $ / M en sortie**. Utile si un pré-scan est envisagé un jour : en envoyant **du texte extrait côté client** (200 premiers caractères de chaque page via pdf-lib) plutôt que le PDF, un scan de 50 pages revient à ~0,3 centime. Envoyer le PDF entier coûterait plusieurs centimes.
- **`PublicLayout` (`App.tsx` l.~169) enveloppe 16 pages** : Home, Tarifs, Contact, ContactPro, Exemple, Méthode, Confidentialité, CGU, CGV Pro, Mentions légales, Pro, Mandataires, Guides, GuideArticle, Rejoindre, NotFound. C'est le point d'ancrage propre pour toute règle CSS visant « les pages publiques ».
- ⚠️ **Le `#2a7d9c` est écrit en dur 876 fois dans `src/`.** Maintenant que `tailwind.config.js` est ouvert, déclarer les couleurs de marque y devient possible — un changement de teal passerait de 876 modifications à une seule.

---

## 📌 SESSION — 29 juillet 2026 ⭐⭐⭐

> Point de départ : un ticket support d'Alain CADIER (PRO) — « Compléter mon dossier » a rejeté un **PV d'AG de 58 pages**. A dérivé sur la refonte de la lecture des gros documents, plus deux correctifs et quatre découvertes non traitées.
> 🧭 **Leçon de méthode n°1 — j'ai conclu trois fois trop vite, et trois fois à tort.** (a) J'ai affirmé qu'un document en échec entrait dans `documents_analyses` en lisant `for (const e of extraits)` **sans remonter 99 lignes plus haut**, où `extraits` est déjà filtré sur `statut === 'ok'`. (b) J'ai décrit l'ordre du schéma MAP en citant celui de `buildDocumentPrompt` (analyse simple) — deux schémas différents. (c) J'ai annoncé que la composition de la copropriété était faussée en confondant `lots_enumeres` (liste énumérée) et `nb_lots_detail` (répartition affichée). **Règle : tracer une variable jusqu'à sa construction avant d'affirmer quoi que ce soit. Un `grep` sur une ligne n'est pas une lecture.**
> 🧭 **Leçon de méthode n°2 — la bonne solution vient d'Alex.** Mes quatre propositions successives étaient soit du sauvetage (récupérer le JSON tronqué), soit dépendantes d'un chiffre jamais mesuré (retirer `citation`, passer le MAP sur Haiku), soit mal découpées (séparer par champ, alors que `chiffres_cles` fait ~80 % du volume). Le découpage **par plages de pages** s'auto-dimensionne et ne dépend d'aucune mesure préalable.
> 🧭 **Leçon de méthode n°3 — le nombre de pages ne prédit PAS le volume à écrire.** Un RCP de 70 pages (texte juridique) écrit moins qu'un PV d'AG de 40 pages dense en résolutions. C'est le nombre de FAITS à retranscrire qui compte. D'où l'invisibilité du problème : certains gros documents passaient, d'autres non, sans règle apparente.

### ✅ Chantiers livrés

**1. 🔴 DÉCOUPAGE DES GROS DOCUMENTS EN PLAGES DE PAGES — le chantier de la session**

- **Diagnostic** : `MAP_MAX_TOKENS = 32000` et `MAP_TIMEOUT_MS = 350000` sont **mathématiquement incompatibles**. 32 000 tokens ÷ 60-90 tok/s = **355 à 533 s**. Le plafond n'est jamais atteignable. Preuve dans les logs : l'erreur est `timeout`, **jamais** `truncated` — le modèle écrivait encore quand on l'a coupé.
- **Pourquoi ça passait hors complément** : une analyse complète ≤ 5 docs part en **single-call**, où le modèle écrit *le rapport* (borné par le schéma). Le MAP lui demande de *tout retranscrire* (borné par la richesse du document). Le complément passe **toujours** par le MAP, même pour 1 seul document. ⚠️ Une analyse complète **≥ 6 docs** aurait planté à l'identique.
- **Solution** : au-delà de `DECOUPAGE_SEUIL_PAGES` (25 pages), **N appels PARALLÈLES sur le MÊME `file_id`**, chacun portant une plage de pages. Chacun **LIT le document entier** (contexte, renvois et abréviations préservés), chacun **ÉCRIT 3-4× moins**.
- **Règle d'appartenance** (dans le prompt) : un élément appartient à la tranche **où il COMMENCE**. Il commence avant → pas extrait. Il commence dedans et déborde → extrait EN ENTIER. Plages contiguës, **aucun chevauchement**, aucune troncature d'élément.
- **Recollage `fusionnerTranches()` — 100 % en code, jamais par le modèle.** Concaténation des 3 listes dans l'ordre des pages + dédoublonnage **par contenu** (le champ `page` est exclu de la clé : le même fait vu par deux tranches peut porter une page différente). Métadonnées (`type_detecte`, `titre_document`, `date_document`) = première tranche qui les fournit. **Aucune suppression sur un critère de page** — un modèle qui se tromperait de numéro ferait sinon disparaître de la donnée réelle.
- **Échec partiel** : les tranches réussies sont conservées, `extraction_partielle {tranches_total, tranches_reussies, pages_non_couvertes[]}` est écrit dans l'extrait, et un log ⚠️ **nomme** les pages manquantes. Toutes les tranches en échec → échec franc, comme avant.
- **Nombre de pages compté côté FRONT** (`pdf-lib`, sur le PDF déjà lu en mémoire), transmis via `filePages[]` → `analyser` → `fileIds[].pages`. **Absent, 0 ou illisible → aucun découpage**, comportement strictement inchangé. Un PDF corrompu ou protégé ne bloque jamais l'upload.
- 🔌 **Interrupteur d'urgence** : `DECOUPAGE_SEUIL_PAGES = 9999` → retour à 100 % du comportement précédent.
- Couvre le **COMPLÉMENT** et l'**analyse complète ≥ 6 docs** — même `extractOneDoc`, une seule correction.
- ✅ **VALIDÉ EN PRODUCTION** le 29/07 (analyse 11 docs, `5709058a`) :

| Document | Pages | Tranches | Durée | Éléments |
|---|---|---|---|---|
| C0278 RCP P1 PARTIE 1 | 104 | 6 | 159 s | 375 |
| C0278 RCP P1 PARTIE 2 | 70 | 4 | **210 s** | 471 |
| DDT BENOIST-LUCY | 66 | 4 | 111 s | 283 |
| C0281 PV AG 25/06/24 | 41 | 3 | 138 s | 328 |

  `MAP Terminé — 11 OK, 0 échec` · REDUCE 11/11 · dédoublonnage actif (4 doublons retirés sur le DDT, 1 sur un RCP, 1 alerte).
- ⚠️ **Marge réelle plus courte qu'annoncé** : 210 s sur 350 pour le pire cas, pas ~120 s. Si un document plus dense se tend, **descendre `DECOUPAGE_PAGES_PAR_TRANCHE` à 15**.
- ⚠️ **Plafond `DECOUPAGE_MAX_TRANCHES = 8`** (garde-fou rate limit) : au-delà de ~200 pages les tranches s'élargissent (un RCP de 284 p → 8 × 36 p).
- ⚠️ **`analyser-retry`** (reprise après surcharge) ne transporte pas `filePages` → repli sur l'ancien comportement. Sans danger, non traité.

**2. 🔴 `purgerDocsManquants` — la 3ᵉ copie de `diagPresent`, oubliée le 28/07**

- Le correctif du 28/07 sur `presence: 'absence'` avait été appliqué à **2 endroits sur 3**. La copie de `purgerDocsManquants` gardait `pres !== 'absence'`.
- Conséquence : un **amiante / plomb / termites** revenu « réalisé, substance non détectée » — le meilleur résultat possible — restait réclamé dans `documents_manquants`.
- Cas réel `#602a51fa` : DDT fourni, amiante `presence: 'absence'` + `perimetre: 'lot_privatif'`. La checklist serveur disait correctement `diag_amiante: statut "ok"`, et le rapport affichait quand même « Diagnostic amiante privatif » en essentiel.
- Corrigé, avec un commentaire renvoyant explicitement aux 2 autres copies (`validateDiagsManquants` l.~1090, `construireChecklist` l.~1340).
- ⚠️ **Ne concerne QUE amiante / plomb / termites** — seuls types où `absence` est un résultat normal. DPE, Carrez, électricité et ERP reviennent en `detectee` et étaient déjà purgés correctement (log du cas réel : *6 documents retirés*).
- 🩹 **Rapport client corrigé à la main** en SQL (`documents_manquants` moins l'entrée amiante) : un rapport déjà généré ne se recorrige pas tout seul, la liste est figée dans `result`.

**3. 🔴 AdminPage — barre de réponse support inaccessible**

- Le `motion.div` de la conversation n'avait pas `minHeight: 0`. En flexbox, `min-height: auto` empêche un enfant de rétrécir sous sa taille naturelle : il grandissait avec le nombre de messages, débordait du conteneur `height: calc(100vh - 110px)` + `overflow: hidden`, et la **barre de réponse passait sous le bord**, inaccessible — le scroll ne servant à rien puisque le cadre est figé.
- Symptôme trompeur : **dézoomer la page la faisait réapparaître** (plus de place dans les 100 % de hauteur).
- La zone des messages portait déjà `minHeight: 0`, mais la chaîne doit être **ininterrompue de haut en bas**.
- ✅ **Côté client jamais touché** — `dashboard/Support.tsx` n'a pas cette couche intermédiaire, sa zone de messages est enfant direct du conteneur.

### ⚠️ Découvertes NON corrigées — à traiter en priorité

**A. 🔴 `parseJson` fragile — `identite_bien` échoue en prod depuis sa livraison**
- `parseJson` découpe du premier `{` au **dernier** `}`. Si le modèle écrit quoi que ce soit **après** son objet (commentaire, second bloc), le slice ramasse tout et `JSON.parse` casse.
- Cas réel : `SyntaxError: Unexpected non-whitespace character after JSON at position 166`. La donnée était **BONNE** (`{"annee_construction":1958,"annee_construction_source":"dpe_ddt",...}`) — c'est l'emballage qui a tué la section.
- **Aucun retry sur `json_invalide`** dans `regenererSection`. Échec en **12 s** sur une fenêtre de 400 s : le budget était largement là. (Le MAP a sa fenêtre `MAP_RETRY_WINDOW_MS`, pas le complément.)
- **Impact** : la section créée le 28/07 pour casser le cercle vicieux de l'année de construction **n'a jamais fonctionné en production**. Et le risque vaut pour **toutes** les sections — le jour où ça tombe sur `finances`, tout le bloc financier du complément saute en silence.
- `console.error(..., 'raw:', raw.slice(0, 100))` : **100 caractères** rendent cette famille de bugs quasi indiagnosticable. → monter à ~600.
- **Correctif** : extraction du premier objet JSON **équilibré** (comptage d'accolades, en respectant les chaînes) + retry une fois sur échec rapide.

**B. Garde de fiabilité de l'année neutralisée sur les rapports d'avant le 28/07**
- `const rangActuel = RANG[String(rapportRec.annee_construction_precision ?? '')] ?? 0;`
- Sur un rapport antérieur au 28/07, le champ `annee_construction_precision` **n'existe pas** → `rangActuel = 0` → `rangNouveau < 0` est toujours faux → **n'importe quelle source écrase le RCP**, y compris une fourchette de DPE.
- **Correctif** : traiter « année présente sans `precision` » comme au moins `borne_superieure` (rang 2).
- 🧭 **Point métier tranché avec Alex** : un RCP est une **borne supérieure**, pas une année exacte — il prouve que l'immeuble existait à cette date, pas qu'il a été construit cette année-là. Un carnet d'entretien donnant une année exacte est donc **plus** fiable, et ne le contredit pas. La hiérarchie **par précision** (exacte > borne_superieure > fourchette) est plus juste qu'une hiérarchie par type de document.

**C. Tentative de complément décomptée AVANT de connaître le résultat**
- `analyser/index.ts` l.~569 : `complement_attempts` est incrémenté **au lancement**. Un timeout technique coûte une tentative sur 3 au client.
- Cas réel : Alain CADIER passé à 2/3 pour un mur mathématique qu'aucune relance n'aurait franchi.
- **Correctif** : ne décompter qu'en cas de succès, ou rembourser sur échec technique (`timeout`, `overload`, `rate_limit`).

**D. `extraireLotsRCP` absent du chemin MAP-REDUCE — impact FAIBLE, ne pas dramatiser**
- Le rattrapage dédié d'énumération des lots existe dans `runAnalyseWithData`, `runAnalyse` et le complément. **Pas** dans `runPhaseReduce` — et il **ne peut pas** y être : les PDF sont supprimés à la fin du MAP. Il devrait se déclencher **pendant** la lecture (comme le complément, qui diffère la suppression pour ça).
- Cas réel 29/07 : `📋 Lots — lecture: 73 | synthèse: 0 | annoncé: 305`. Le modèle a énuméré 73 lots sur 305 puis s'est arrêté (comportement connu sur les listes très longues).
- ✅ **LE RAPPORT AFFICHÉ ÉTAIT JUSTE** : `nb_lots_detail` (77 appartements + 151 parkings + 77 caves = 305) vient du **récapitulatif du document**, pas de la liste énumérée. Le garde-fou `recomptageRate` a correctement **refusé** d'écraser la répartition avec une liste incomplète, et `nb_lots_detail_verifie` est passé à `false`.
- Seul manque : le détail lot par lot. Sur une copro de 305 lots dont le client en achète un, **intérêt quasi nul**. À classer tout en bas.

### 📁 Fichiers livrés (5)

| Fichier | Contenu | Déploiement |
|---|---|---|
| `package.json` | ajout `pdf-lib` ^1.17.1 | GitHub → Vercel — **AVANT** `analyse-client.ts` |
| `src/lib/analyse-client.ts` | `compterPagesPdf()` + `filePages[]` dans le payload | GitHub → Vercel |
| `supabase/functions/analyser/index.ts` | `filePages` dans le body → `fileIds[].pages` | GitHub **+ Supabase MANUEL** |
| `supabase/functions/analyser-run/index.ts` | découpage, `fusionnerTranches`, prompt de plage, fix `diagPresent` | GitHub **+ Supabase MANUEL** |
| `src/pages/AdminPage.tsx` | `minHeight: 0` sur le conteneur de conversation | GitHub → Vercel |

> ✅ **DÉPLOYÉ ET VALIDÉ EN PRODUCTION** le 29/07 — logs : `🏷️ BUILD 2026-07-29-decoupage-pages`.
> **Aucun SQL.** Ordre imposé : `package.json` avant `analyse-client.ts` (sinon build Vercel cassé sur import introuvable).

### 🗄️ SQL manuel de la session

```sql
-- Retrait de l'entrée amiante périmée sur le rapport d'Alain CADIER
update analyses
set result = jsonb_set(result, '{documents_manquants}',
      (result->'documents_manquants')
        - 'Diagnostic amiante privatif (obligatoire pour les biens construits avant 1997)')
where id = '602a51fa-cf04-4fb3-876a-1a442df248fb';
```

### 🧾 Points annexes établis

- **Files API** : un `file_id` supprimé est **définitivement perdu**. Vérifié sur le PV du client via Postman Web (`GET /v1/files/{id}` → `404 not_found_error`). Le log `Supprimé:` est fiable (écrit uniquement si `res.ok`).
- **Il n'existe AUCUNE colonne `storage_paths`** dans `analyses` : les chemins transitent dans le payload HTTP et ne sont jamais persistés. Le PDF du bucket `analyse-temp` est supprimé (`analyser/index.ts` l.~639) dès l'upload Files API réussi — sauf en cas d'`overload`, où il est conservé pour le cron `analyser-retry` via `metadata_queue`. **Le cron de 3 h ne conserve rien, il nettoie les orphelins.**
- **Postman Web** est l'outil de vérification Files API (Alex est sur Windows, pas de terminal). En-têtes : `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-beta: files-api-2025-04-14`.
- ⚠️ **Le mapper de `RapportPage.tsx` est une LISTE BLANCHE** (l.~5678, champ par champ, aucun spread). `checklist`, `annee_construction_precision` et `annee_construction_fourchette` **y sont absents** → `lireChecklist()` renvoie `null` et tout le chantier checklist du 28/07 est **invisible en production** (repli silencieux sur l'ancienne logique). **Non corrigé** : le basculement change les libellés, fait apparaître les badges `INCOMPLET` et le bloc « DÉJÀ AU DOSSIER » sur tous les rapports — chemin d'affichage jamais éprouvé en prod. À faire à froid, après avoir inspecté `result->'checklist'->'items'` sur plusieurs dossiers réels. **Tout nouveau champ serveur destiné au rapport doit recevoir sa ligne dans ce mapper, sinon il est silencieusement jeté.**

---

## 📌 SESSION — 28 juillet 2026 ⭐⭐⭐

> Point de départ : une question d'Alex sur la concurrence (« si 2 clients lancent une analyse en même temps ? »). A dérivé sur un audit complet du système de notation et des documents manquants, où **une famille entière de bugs** a été trouvée : le code confondait *« pas exigible »* et *« absent »*.
> 🧭 **Leçon de méthode n°1** : la même règle métier était écrite **6 fois** (1 serveur + 3 dans `RapportPage.tsx` + `Aide.tsx` + `MethodePage.tsx`). Elles avaient dérivé. Le rapport affichait « Aucun matériau contenant de l'amiante repéré » et, trois écrans plus bas, « Diagnostic amiante manquant ». **Une règle = un endroit, côté serveur.**
> 🧭 **Leçon de méthode n°2** : la page « Notre méthode » publiait des valeurs de barème qui **ne correspondaient plus au code** (amiante −2 publié vs −1 réel, bonus DPE publiés qui n'existent pas). Un argument de transparence qui ne résiste pas à une vérification est pire que pas de page du tout.
> 🧭 **Leçon de méthode n°3** : **trois bugs de cette session ont été trouvés par les questions d'Alex, pas par relecture.** « Et un immeuble récent ? », « comment tu définis l'année ? », « et si un RCP est ajouté en complément ? ». Poser le cas limite est plus efficace que relire le code.
> ⚠️ **Incident process** : un script de modification a planté AVANT d'écrire le fichier → une livraison annoncée « faite » ne l'était pas, Alex a déployé dans le vide. → **`BUILD_VERSION` ajoutée**, loguée à chaque invocation.

### ✅ Chantiers livrés

**1. 🔴 Le bug `presence: 'absence'` — amiante, plomb, termites**
- `validateDiagsManquants` excluait `presence !== 'absence'`. Or dans le schéma, `absence` = **diagnostic réalisé, substance non détectée** — le meilleur résultat possible. Le code le comptait comme « diagnostic non fait ».
- Cas réel `#e01a8e89` : le rapport écrivait « Aucun matériau de la liste A et B contenant de l'amiante repéré » ET réclamait le diagnostic amiante. Idem CREP plomb. Idem la vigilance « État termites à vérifier » alors que le diagnostic disait qu'aucun arrêté préfectoral ne s'applique dans les Hauts-de-Seine.
- **Aucun impact score** : `recalculerCategories` compte les diagnostics par leur `type` sans filtrer sur `presence`. Seules la liste des manquants et les vigilances étaient polluées.
- Corrigé aux 2 endroits (helper `diagPresent` + branche AMIANTE).

**2. 🔴 CHECKLIST DÉTERMINISTE — `construireChecklist()`, source unique**
- Le front recalculait la liste des documents manquants avec `hasDoc(type)` — un simple test de présence de type, **aveugle à la date, à la complétude et à la pertinence**. Le moteur produisait 7 items précis dans `documents_manquants`, le front n'en affichait que **2 — les 2 faux**, et jetait les 5 justes.
- Cas réel : « 3 AG analysées » en vert, pendant que le moteur écrivait que le PV le plus récent datait de 2021 et que tout ce qui a été décidé depuis sur la toiture était inconnu.
- **Nouveau : 3 états**, `ok` / `insuffisant` / `manquant`. `insuffisant` = un document a été fourni mais ne couvre pas l'obligation (modificatif sans le RCP, PV périmés, appel de charges de 2022).
- Écrit dans `rapport.checklist` (jsonb dans `result`, **aucun SQL**). Appelée aux **4 points** de post-traitement : single-call ×2, REDUCE, complement-merge.
- Front : `lireChecklist()` en lecture seule, badge `INCOMPLET`, phrase explicative du moteur sous le libellé, bloc **« DÉJÀ AU DOSSIER »** (pastilles vertes) — c'est ce bloc qui évite au client de croire à un bug quand un document qu'il a envoyé n'apparaît nulle part.
- Repli intégré : les rapports antérieurs (sans `checklist`) gardent l'ancien affichage.

**3. 🔴 APPLICABILITÉ — « sans objet » ≠ « manquant »**
- **Diagnostics communs** partaient de `2/3` quoi qu'il arrive. Un immeuble de 2015, où **rien n'est exigible** (amiante < 1997, plomb < 1949), perdait 1 point sur 20 sans raison — et un immeuble de 1948 **sans aucun diagnostic commun** (vrai trou de dossier) obtenait la même note.
- Nouvelle grille de départ : `3/3` si rien n'est exigible (badge **SANS OBJET** au front) · `2/3` si exigible et fourni · `1,5/3` si exigible et absent.
- **Fonds de travaux** : `−1` si `absent`, sans regarder l'âge. Or il n'est obligatoire qu'au-delà de **10 ans** (art. 14-2). Une copro de 2018 était pénalisée pour un fonds que la loi ne lui demande pas. Malus neutralisé sous 10 ans, bonus conservés.
- **SPANC** : réclamé sur **toute** maison, même raccordée au tout-à-l'égout. Garde ajoutée sur `assainissement.type_reseau === 'collectif'`.
- **Année inconnue** : `if (!anneeNum || anneeNum < 2010)` rendait le diagnostic électrique obligatoire **par défaut** → `−0,75` sur une hypothèse. Supprimé. Et le seuil était **2010 dans le scoring vs 2011 dans la checklist** — aligné et rendu **glissant** (`année courante − 15`).

**4. 🔴 ANNÉE DE CONSTRUCTION — bornes et franchissement de seuil**
- **Aucune consigne d'extraction n'existait** : le champ était dans le schéma, plusieurs règles le consommaient, personne ne disait où le chercher. Il tombait juste parce que le DPE le mentionne souvent.
- **Hiérarchie des sources fixée par Alex** (métier) : ① **règlement de copropriété d'origine** — acte notarié, fait foi, JAMAIS la date d'un modificatif ② carnet d'entretien ③ fiche synthétique ④ DPE/DDT **en dernier recours**, car ils donnent une **fourchette**.
- **Le vrai problème : une fourchette ne peut pas trancher un seuil qu'elle chevauche.** « 1989-2000 » ne dit pas si le bâti est antérieur à 1997. Et une date d'acte est une **borne supérieure** : un RCP de 1951 garantit que l'immeuble est antérieur à 1951, pas qu'il est postérieur à 1949.
- → helpers `bornesConstruction()` + `positionSeuil()` renvoyant **3 réponses** : `avant` / `apres` / **`indetermine`**. Sur indéterminé, on s'abstient et on le DIT (vigilance nommant les seuils concernés).
- Nouveaux champs : `annee_construction_source`, `annee_construction_precision` (`exacte|fourchette|borne_superieure`), `annee_construction_fourchette {min,max}`.
- Front : `libelleAnneeConstruction()` → « Construit **entre 1949 et 1974** » ou « Construit **avant 1951** » au lieu d'une fausse année exacte.
- 🐛 **Bug que j'ai introduit puis corrigé** : `anneeNum !== null && anneeNum < 1997` → quand l'année est nulle, la condition est fausse → le code concluait « rien n'est exigible » → **3/3 avec le badge SANS OBJET**. Un immeuble de 1900 dont l'année n'a pas été extraite recevait un point cadeau ET une affirmation fausse. Corrigé : 3 états, `inconnu` → socle neutre 2/3, pas de badge.

**5. 🔴 CADRE RÉGLEMENTAIRE 2026 — constantes `REGLES` + vigilances**
- Bloc `REGLES` en tête de `recalculerCategories` : source unique de tous les seuils. Toute évolution législative se corrige **là**.
- **Réforme du DPE au 01/01/2026** : coefficient de conversion électricité 2,3 → 1,9, ~850 000 logements sortis de F/G **sans travaux**, aucune classe ne se dégrade. → vigilance si DPE E/F/G établi **avant 2026** : un DPE refait peut donner une meilleure classe. Information de négociation majeure, elle n'existait nulle part.
- **Fonds de travaux — DOUBLE PLANCHER** (le plus important) : sans PPT adopté ≥ 5 % du budget ; **avec PPT adopté ≥ 5 % du budget ET ≥ 2,5 % du montant des travaux du plan**, le plus élevé s'appliquant. Une copro à 5 % pile avec un PPT de 600 000 € cotise 4 000 €/an là où la loi en exige 15 000 — le code disait « conforme ». → malus `−0,5` + vigilance chiffrée. **Prudence assumée** : l'adoption formelle en AG n'est pas détectable, on n'écrase pas `fonds_travaux_statut`.
- **PPT** obligatoire depuis le 01/01/2025 pour toutes les copros **> 15 ans** · **DPE collectif** depuis le 01/01/2026 pour les mêmes, y compris ≤ 50 lots → vigilances + items de checklist conditionnés à l'âge.
- **Audit énergétique** : maisons individuelles et **monopropriétés** uniquement (F/G depuis 04/2023, E depuis 01/2025). Un appartement en copro en est dispensé quelle que soit sa classe — le code était déjà correct, c'est maintenant documenté.
- **Immeuble récent** : 3 vigilances qui n'existaient pas — décennale des parties communes en cours (< 10 ans, avec l'année d'échéance) ou **échue** (10-12 ans) ; réserves non levées / litiges promoteur à chercher dans les PV ; charges des premières années calées sur un budget promoteur optimiste. Ne se déclenchent **pas** sur une fourchette.

**6. 🔴 RÈGLEMENT DE COPROPRIÉTÉ — `vie_copropriete.reglement_copropriete`**
- **L'analyse simple capturait tout** (`notaire {nom, etude, ville}`, `date_acte`, `publication_fonciere {service, date}`), **l'analyse complète presque rien** : `notaire` en simple chaîne, aucune publicité foncière, **aucun champ pour le RCP d'origine**.
- Pire : le prompt MAP demande explicitement « nom du notaire et de son étude », « service de publicité foncière ». Le moteur **extrayait et jetait**. Vérifié en SQL : *« Acte reçu par Me Emile MICHELEZ et Me Marcel BARON, tous deux notaires à PARIS, 128 Boulevard de Courcelles »*, *« Enregistré à Paris, 4e bureau des notaires, le 2 avril 1962 »* — présent dans `map_resultats`, absent du rapport. Le modèle casait les références SPF dans le **texte libre** faute de champ.
- Nouveau bloc + `modificatifs_rcp[].notaire` devient un **objet**. Consigne clé : remplir **dès qu'un modificatif rappelle les références de l'acte d'origine** (c'est presque toujours le cas), et JAMAIS confondre la date du modificatif avec celle de l'origine.
- Front : encadré parchemin « Règlement de copropriété d'origine » (📅 date · ⚖️ notaire · 📐 état descriptif · 🏛️ publication SPF). **Rétrocompatible** : lit `notaire` en chaîne OU en objet.
- 🐛 **Bug que j'ai introduit puis corrigé** : le bloc était placé après `if (modifs.length === 0) return null` → un dossier avec un RCP mais **sans modificatif** n'affichait rien. C'est pourtant le cas le plus fréquent.

**7. COMPLÉMENT — section `identite_bien` (trou trouvé par la question d'Alex)**
- `annee_construction` n'appartenait à **aucune** section régénérable → cercle vicieux : le rapport disait « ajoutez le carnet d'entretien pour identifier l'année », le client l'ajoutait, **rien ne changeait**. Et il brûlait une de ses 3 tentatives.
- Nouvelle section `identite_bien` (4 champs), routée depuis `REGLEMENT_COPRO`, `RCP`, `MODIFICATIF_RCP`, `CARNET_ENTRETIEN`, `FICHE_SYNTHETIQUE`, `DPE`, `DDT`, `DTG_PPT`.
- **Garde de fiabilité dans la fusion** : `exacte` > `borne_superieure` > `fourchette`. Un DPE ajouté après coup n'écrase pas une année exacte déjà lue dans le carnet. Aucune valeur → on conserve. Chaque décision est loguée.

**8. LOI CARREZ — texte juridiquement faux corrigé**
- Ancien tooltip : « Si la surface réelle est inférieure de plus de 5 % à celle **du compromis**, vous pouvez demander une réduction du prix. » **Trois erreurs** :
  - la référence est l'**acte authentique**, pas le compromis ;
  - il faut **agir en justice dans l'année** — délai de **forclusion** qui ne se suspend ni ne s'interrompt. Un client qui négocie à l'amiable 13 mois a perdu son droit ;
  - **la réduction porte sur la TOTALITÉ de l'écart**, pas sur la part au-delà de 5 %. 100 m² annoncés / 93 m² réels = **7 %** de réduction, pas 2 %. Sur un bien à 600 000 €, 42 000 € au lieu de 12 000.
- Bulles raccourcies (KPI + titre de section). Le détail passe dans un **bloc dédié sous le tableau des surfaces** : 3 cartes colorées (💶 tout l'écart · ⏳ un an à compter de l'acte authentique · 🛡️ risque à sens unique) + marche à suivre en 3 étapes.

**9. PAGES PUBLIQUES — barème remis en accord avec le code**
- `MethodePage.tsx` publiait une grille **presque entièrement fausse** sur Diagnostics communs (1 ligne juste sur 10) et Diagnostics privatifs (DPE G annoncé −3 / code −1,5 ; DPE G invest annoncé −6 / code −2 ; 3 bonus publiés **inexistants**).
- Cause structurelle : la page décrivait un modèle **additif** (part de 0, on ajoute) alors que le code part du **maximum et retranche**.
- → nouveau bloc **« Point de départ »** par catégorie. Le bloc Bonus disparaît quand la catégorie n'en a pas.
- **FAQ « Pourquoi partir de 20 ? » réécrite** : on ne part PAS de 20. Finances démarre à 2/4, Diags communs à 2/3 → un dossier vierge démarre à **17-18**. 4 nouvelles questions sur le cadre 2026.
- `Aide.tsx` : mêmes chiffres + tableau des points de départ.
- `ExemplePage.tsx` : affichait `score: 14.8` avec des catégories qui somment à **13** — et 14,8 n'est même pas produisible (le moteur arrondit au demi-point). Corrigé en 15/20 cohérent.

### 📁 Fichiers livrés (6)

| Fichier | Contenu | Déploiement |
|---|---|---|
| `analyser-run/index.ts` | tout le moteur : fix `absence`, `construireChecklist`, `REGLES` 2026, bornes/seuils, `identite_bien`, bloc RCP, `BUILD_VERSION` | GitHub **+ Supabase Studio MANUEL** |
| `RapportPage.tsx` | checklist, badge SANS OBJET, fourchettes d'année, bloc RCP d'origine, bloc Carrez, onglet Propriété redesigné | GitHub → Vercel |
| `MethodePage.tsx` | barème corrigé, points de départ, FAQ 2026, Carrez | GitHub → Vercel |
| `Aide.tsx` | barème corrigé | GitHub → Vercel |
| `ExemplePage.tsx` | score cohérent | GitHub → Vercel |
| `DocumentRenderer.tsx` | onglet Propriété aligné (cosmétique) | GitHub → Vercel |

> ✅ **DÉPLOYÉ** (confirmé le 29/07 : `BUILD 2026-07-28-rcp-origine` vu dans les logs).
> ⚠️ **ORDRE OBLIGATOIRE** (pour mémoire) : `RapportPage.tsx` **AVANT** `index.ts`. Le nouveau moteur écrit `modificatifs_rcp[].notaire` en **objet** ; l'ancien front fait `{m.notaire}` en JSX brut et **React refuse de rendre un objet** → onglet Copropriété en erreur.
> ✅ **Vérifier le déploiement** : logs Supabase → `[analyser-run] 🏷️ BUILD 2026-07-28-rcp-origine`.
> **Aucun SQL** — `checklist` et les nouveaux champs vivent dans `analyses.result` (jsonb).

### 🧠 Concurrence — réponse à la question initiale

- **Isolation parfaite** : chaque appel = une invocation Edge isolée, `analyseId` unique, `storagePaths` bornés à `${analyseId}/`, polling sur sa propre ligne. Aucun lock, aucun blocage mutuel.
- **Tier Anthropic = Scale** : Sonnet 4.x → 10K req/min, 10M tokens d'entrée/min, **2M tokens de sortie/min**. L'OTPM est réservé sur `max_tokens` au **démarrage** de la requête.
- 1 analyse de 15 docs = 15 × 32 000 = **480 000 tokens de sortie réservés d'un coup** → ~4 analyses max de 15 docs dans la même minute. **2-3 clients simultanés : aucun souci.**
- ⚠️ **Le seul scénario réaliste de dépassement** : `analyser-retry` relance **20 analyses** dans une même exécution → 20 × 12 × 32 000 = **7,7M**, soit ~4× le plafond. → mettre `.limit(5)` et virer `blobToBase64` (CPU pur, alors qu'il a été retiré de `analyser` pour cette raison exacte).
- ⚠️ **Limites Supabase, plus contraignantes qu'Anthropic** : CPU **2 s par requête** ; les 400 s sont la durée de vie du **worker**, qui peut servir **plusieurs requêtes** — un `analyser-run` qui atterrit sur un worker vivant depuis 300 s n'a plus que 100 s, alors que `MAP_TIMEOUT_MS = 350000` suppose les 400 s pleines. Symptôme : analyse figée en `processing`, watchdog à 1h. **À vérifier dans les logs : shutdowns `WallClockTime` sur des invocations courtes.**
- Autres pistes non faites : lire le header `retry-after` sur les 429 (le backoff fixe 10s/20s l'ignore) ; traiter `rate_limit` comme `overload` dans `analyser` (mise en queue au lieu du remboursement) ; ne pas facturer plein tarif un rapport amputé par une erreur transitoire.

### ⏭️ Reste ouvert

- **Grille MAISON non auditée** — `categoriesMaison` / `penaltiesMaison` n'ont pas été confrontés au code, le même décalage y est probable. Et deux socles subsistent : `travaux_bati` plafonné à **2/3** sur une maison neuve (rien à rénover), `assainissement_risques` à **2/4** sans données.
- **Refonte recommandée, non livrée** : séparer le **score** (le risque constaté) de la **complétude** (ce qui manque). Aujourd'hui un 13/20 peut vouloir dire « ce bien a des problèmes » OU « on n'a pas vu grand-chose », et le client ne peut pas faire la différence. Toute la famille de bugs de cette session vient de là. Coût : +3 à 4 points sur les notes → **recalibrage des 5 paliers sur ~10 dossiers réels**.
- `annee_construction` utilise l'année de construction là où le texte amiante vise la **date du permis de construire**. Immeuble achevé en 1998 avec permis de 1996 = obligation ratée. Cas rare, approximation assumée.
- Le malus PPT s'appuie sur `dtg.budget_total_10ans`, qui peut venir d'un DTG et non d'un plan **adopté en AG**.

---

## 📌 SESSION — 27 juillet 2026 (soir) ⭐⭐⭐

> Point de départ : le complément timeoutait EN PRODUCTION chez un client (2 lancements, 385 s chacun) **et la facture Anthropic était débitée pour rien**. Session de refonte du complément + fiabilisation facturation + UX support/notifications.
> 🧭 **Leçon de méthode n°1** : le diagnostic du matin (« le prompt de 22 000 tokens fait timeouter ») était **incomplet**. Le vrai coupable était le **cumul dans un seul appel** : référentiel + rapport entier à réécrire + PDFs joints. Distinguer ce qui est LU (prefill, rapide) de ce qui est ÉCRIT (génération, ~60-90 tokens/s = le seul mur).
> 🧭 **Leçon de méthode n°2** : 4 défauts corrigés dans la session, **3 trouvés par Alex** en regardant le résultat, pas par relecture de code. Les erreurs de *consigne* (le moteur range mal) sont intermittentes et ne se valident pas par un test réussi. **Chaque fois qu'une consigne peut être remplacée par un contrôle en code, le faire.**

### ✅ Chantiers livrés

**1. 🔴 COMPLÉMENT v2 — refonte complète (fusion par sections)**
- **Cause du timeout identifiée dans le code** : `runAnalyseWithData` en mode complément empilait dans UN appel le référentiel (~22 000 tk) + le rapport existant en JSON (~12 000 tk, mesuré en SQL) + **les PDFs eux-mêmes** + la consigne de **réécrire tout le rapport** (`maxTokens: 64000`). ≈ 25-35 000 tokens à écrire → 400-700 s. Mur à 385 s (`timeoutMs`).
- **Contre-preuve qui a fait avancer** : le REDUCE écrit lui aussi le rapport entier et n'échoue pas — parce qu'il reçoit des **extraits texte**, jamais de PDF. C'est l'accumulation, pas l'écriture seule.
- **Nouvelle architecture, 2 invocations** :
  - `phase complement-map` : chaque nouveau doc lu dans **son propre appel, en parallèle** (`extractOneDoc`), extraits sauvés dans `complement_extraits`, self-invoke.
  - `phase complement-merge` : budget neuf de 400 s. **16 sections** régénérables ; une table `ROUTAGE_SECTIONS` associe `type_detecte` → sections. Appels courts en parallèle (150 s max, 16 000 tk chacun). **Toute section non concernée est RECOPIÉE à l'octet près.**
- **Le référentiel complet EST de retour** : `referentielMetier()` = `buildSystemPrompt('complete')` **privé de son schéma global** (~19 700 tk), injecté dans chaque appel de section. Chaque section porte en plus **son fragment de schéma littéral**. Parité avec l'analyse complète garantie *par construction* : plus de règles réécrites à la main, donc plus de type de document oublié.
  - 🔌 Interrupteur `COMPLEMENT_REFERENTIEL_COMPLET = true` (repli sur règles résumées si les durées dérapent).
- **Ordre déterministe** : sections fusionnées → extras ciblés → `recalculerCategories` → **puis** conclusion (elle voit le score final).
- **Budget borné par construction** : MAP ≤ 350 s + extractions ciblées bornées au temps restant avant 340 s ; MERGE ≤ 150 s (sections //) + 150 s (conclusion) = 300 s.
- **Coût** : ~0,30 €/complément (5 sections × 20 000 tk d'entrée) contre ~1 € par **échec** avant.

**2. 🔴 FACTURATION — `callAI` réécrite (impacte TOUTES les analyses)**
- **`stream: false`** était la cause des débits pour rien : `controller.abort()` ferme la socket, mais Anthropic **finit de générer et facture tout**. → `stream: true` + parsing SSE. Couper le flux arrête les frais où on coupe.
- **`stop_reason` jamais lu** : une réponse tronquée à `max_tokens` produit un JSON invalide → l'appelant relançait **à l'identique** → même troncature, facture doublée. Nouvelle erreur dédiée `truncated`, jamais relancée.
- **Fenêtre de temps sur le retry JSON** (`MAP_RETRY_WINDOW_MS`) portée sur `runAnalyseWithData` + `runAnalyse` — l'item « garde-fou manquant l.~2082 » du backlog est **fait**.

**3. Qualité de fusion — 4 défauts trouvés PAR ALEX sur le résultat**
- **Noms de champs inventés** (le plus grave). SQL de contrôle : les données étaient **présentes et exactes** mais sous `surface_carrez` au lieu de `surface`, `date`/`objet` au lieu de `date_acte`/`impact_acheteur`. Cause : mes prompts de section donnaient les règles métier **sans le schéma**, et disaient « garde la même forme que la valeur actuelle » — or **quand la valeur actuelle est vide, il n'y a aucune forme à imiter**. Cercle vicieux : le complément était le plus faible là où il était le plus utile. → schéma littéral injecté + `normaliserAliasComplement()` en filet (et en **capteur** : si elle se déclenche, le log `🔧 N champ(s) remappé(s)` le dit).
- **Extractions ciblées absentes** : `retryDpeCarrez` (packs DPE + Carrez pièce par pièce) et `extraireLotsRCP` ne tournaient pas en complément — ce sont exactement les 2 champs vides constatés. Rapatriées en **phase MAP** (les PDFs n'existent plus en MERGE) → `extractOneDoc` a reçu un paramètre `deleteAfter` (défaut `true` : MAP-REDUCE inchangé). Résultats appliqués **après** la fusion, en dur : aucune section ne peut les écraser.
  - ⚠️ Ces 2 fonctions n'imposent **aucun `timeoutMs`** et héritent du défaut de 385 s → helper `avecDelai()` qui les borne au temps réellement restant.
- **Section fourre-tout** : `vie_copropriete.lots` contenait lots + règles + modificatifs, avec des règles pour les seuls lots. Scindée en 2 sections ; `modificatifs_rcp` a désormais son bloc de règles complet et le prompt de LECTURE réclame explicitement date d'acte, notaire, nature, lots concernés, tantièmes avant/après.
- **Doublon de reclassement** (trouvé par Alex sur le scénario « PV 1 et 2 + PV 3 en complément ») : ma règle « les listes historiques s'enrichissent » pouvait laisser un ravalement **dans `evoques` ET dans `votes`** → **score faussé silencieusement**. → règle **5bis RECLASSEMENT** (prioritaire) + **principe général AJOUT / ÉVOLUTION / REMPLACEMENT** décliné sur 6 sections (diagnostics : un nouveau DPE écrase l'ancien · finances : le chiffre récent fait foi avec son année, jamais de moyenne · syndic : un changement remplace + alimente l'historique · lots : un lot divisé disparaît · pré-état daté : un impayé soldé repasse à 0 · compromis : un avenant remplace en bloc).
- **`documents_manquants` jamais purgé** : `validateDiagsManquants` ne fait qu'**AJOUTER** (helper `ajouter`, pas d'équivalent pour retirer). En analyse complète le moteur reconstruit la liste ; en complément **personne** ne la reconstruisait → le client redéposait son DDT et l'onglet Documents continuait de le réclamer. → `purgerDocsManquants()` déterministe (croise diagnostics détectés + types de documents analysés, DDT traité comme un ensemble).

**4. Plafond de tentatives + signalement support + déblocage admin**
- `analyser` : `complement_attempts` **serveur** (le compteur front est contournable), refus `complement_blocked` au-delà de 3. Le compteur compte les **lancements**, pas les échecs — c'est le lancement qui coûte.
- ⚠️ Le contrôle devait être dans `analyser` : `analyser-run` répond `success` immédiatement puis travaille en `waitUntil`, il ne peut **pas** renvoyer d'erreur exploitable au navigateur.
- `analyser` n'envoie plus `existingReport` dans le corps HTTP (12 000 tk de JSON) — `analyser-run` relit en base.
- **Front** : bandeau à **3 états** (échec ponctuel / bloqué / signalé), lisibilité renforcée au 3ᵉ, phrase « vous pouvez relancer » retirée, **croix supprimée** quand bloquant. Bouton « Compléter mon dossier » grisé. `SignalementComplementModal` → ticket `support_tickets` + rapport technique pré-rempli, popup verte, bouton « Voir ma demande ».
- ⚠️ **L'état bloqué est lu au CHARGEMENT** (`complement_attempts` + existence d'un ticket ouvert) : avant, un simple F5 redonnait un bouton actif voué au refus.
- **Admin** : bouton « 🔓 Débloquer le complément » sur le ticket → `complement_attempts = 0` **ET** `regeneration_deadline + 7 j` (sinon le client se heurte au délai expiré juste après) + message dans le fil + notification.

**5. Documents non traités — visibilité CLIENT (3 points de fuite)**
- Un document pouvait disparaître **silencieusement** à l'upload (PDF protégé/corrompu → alerte admin seulement), à la lecture MAP-REDUCE (cas réel constaté par Alex), ou en complément. Le rapport se générait, personne ne prévenait l'acheteur.
- Colonne `documents_non_traites` jsonb `{vu, items[{nom, raison, phase}]}`, alimentée aux **3 endroits**. `DocumentsNonTraitesModal` à l'ouverture du rapport (une seule fois, drapeau `vu`), nom réel du fichier + explication en français, bouton « Redéposer » **uniquement si le complément est encore possible**.
- ⚠️ Non couvert : un document lu **partiellement** (le champ `elements_illisibles` du prompt MAP existe mais n'est pas exploité).

**6. Titre de propriété — nouveau type `TITRE_PROPRIETE`**
- Couvre **attestation de propriété, acte de vente authentique, attestation de succession, donation** via un champ `nature` (le libellé affiché s'y adapte). ⚠️ **L'acte de vente n'était pas traité** : il tombait en `COMPROMIS` et se voyait appliquer un schéma d'**avant-contrat** (conditions suspensives, rétractation) qui n'a aucun sens sur un acte définitif.
- Bloc `lot_achete.titre_propriete` : nature, date d'acte, notaire, propriétaires avec **citation exacte de la situation matrimoniale** + `peut_vendre_seul`, lots détenus un par un, références cadastrales, date de l'état descriptif d'origine.
- **Croisements en CODE avec le compromis** (`croiserTitrePropriete`) : vendeur (normalisation accents/civilités, rapprochement sur patronyme), lots cédés vs détenus, tantièmes. Plus : EDD antérieur à 1980, indivision, conjoint requis.
- 🎯 **Décision produit assumée : AUCUN impact sur la note.** Un mandat, une succession ou une procuration expliquent parfaitement un écart. Tout part en `points_vigilance`.
- Rendu dédié en analyse simple (`RendererTitrePropriete`) + bloc « Propriété » dans l'onglet Votre logement.

**7. Admin — 2 bugs d'affichage**
- **Statut « ✗ Échouée » pendant tout le traitement** : le pipeline a **5 statuts** (`processing`, `files_ready`, `queued`, `completed`, `failed`), l'admin n'en testait que 4 — `files_ready` tombait dans la branche par défaut. Or c'est l'état posé pendant toute la durée du travail. Corrigé aux 3 endroits (badge liste, badge détail, compteur du filtre).
- **Badge « Compte activé » absent** (cas réel CADIER) : il s'appuyait sur `pro_invitations.accepted_at`, écrit **uniquement** par `setup_pro_account`. Le client s'était connecté par **« Mot de passe oublié »** — possible dès la création puisque `createUser` pose `email_confirm: true`. → nouvelle source de vérité = **la connexion réelle** (`auth.users.last_sign_in_at`), exposée par la fonction SQL `get_users_last_sign_in()` (`security definer`, filtre admin **dans** la fonction). 1 seul compte concerné en base.
- 💡 **À retenir** : `email_confirmed_at` porte l'horodatage de la création du compte par l'admin — **elle ne prouve jamais une action du client**.

**8. Notifications & support — canal admin → client**
- Composeur « ✉️ Écrire » dans l'en-tête du support + bouton **« Écrire au client »** sur la fiche utilisateur **et** sur la fiche client pro (2 composants distincts — l'oubli du second a dû être signalé par Alex).
- Colonne `user_notifications.link` : le système ne savait pointer que vers un rapport via `analysis_id`, une notif sans ce champ affichait « rapport supprimé ». Notification « Le support Verimo vous a écrit » → `/dashboard/support`. **Uniquement à l'ouverture d'une discussion**, pas sur les réponses.
- **Doublon de notification** à la fin d'une analyse : le sondage navigateur ET l'insertion serveur produisaient la même → déduplication par `analysisId`, la version en base fait foi.
- **Rafraîchissement** : badge support + cloche toutes les **10 s** + au retour sur l'onglet. Avant : 30 s côté particulier, et **rien du tout** côté pro après le chargement initial.
- Panneau de la cloche élargi (320 → 440 px), pied « Consulter toutes les notifications » → **nouvelle page `/dashboard/notifications`** (groupée par période, icône par nature, suppression unitaire, commune aux 2 profils via `SmartDashboard`).
- En-tête de ticket admin : boutons pleins et non compressibles (`minWidth: 0` sur les conteneurs flex — sans ça un enfant refuse de se compresser et pousse les boutons hors écran).

**9. UX dépôt de documents**
- Bloc des 3 conditions (formats, Word refusé, PDF protégé) refondu en carte titrée avec pastilles colorées — c'étaient les 3 causes n°1 de rejet, présentées comme un pied de page gris.
- ℹ️ **Limites réellement contrôlées** (`validateFile`, côté navigateur) : PDF uniquement, 20 Mo/fichier, détection `/Encrypt`, nombre de fichiers selon le plan. Messages nominatifs par fichier. **Aucun contrôle du nombre de pages ni du nombre de documents dans un même PDF.**

### 🗄️ SQL de la session

```sql
alter table analyses add column if not exists complement_extraits jsonb;
alter table analyses add column if not exists complement_attempts int not null default 0;
alter table analyses add column if not exists documents_non_traites jsonb;
alter table support_tickets add column if not exists analyse_id uuid references analyses(id) on delete set null;
alter table user_notifications add column if not exists link text;

create or replace function public.get_users_last_sign_in()
returns table (id uuid, last_sign_in_at timestamptz)
language sql security definer set search_path = public, auth as $$
  select u.id, u.last_sign_in_at from auth.users u
  where exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;
grant execute on function public.get_users_last_sign_in() to authenticated;
```

### 📦 Déploiement du 27/07 (soir)
- **SQL D'ABORD** (bloc ci-dessus).
- **Supabase Studio — redéploiement MANUEL ×2** : `analyser-run` · `analyser`.
- **GitHub (Vercel auto)** : `RapportPage.tsx` · `AdminPage.tsx` · `DashboardPage.tsx` · `DashboardProPage.tsx` · `DocumentRenderer.tsx` · `App.tsx` · `dashboard/NouvelleAnalyse.tsx` · `dashboard/Notifications.tsx` **(nouveau)** · `lib/analyse-client.ts` · `lib/complement-support.ts` **(nouveau)** · `components/SignalementComplementModal.tsx` **(nouveau)** · `components/DocumentsNonTraitesModal.tsx` **(nouveau)**

### 🧪 Tests à faire par Alex (post-déploiement)
- **🔴 Complément avec 2-3 docs variés** — logs attendus : `→ COMPLEMENT V2`, **2 × `booted`** (preuve du découpage), `Referentiel metier chargé (~19700 tokens)`, `Section "..." OK (Xs, N -> M feuilles)`, `Score recalcule`.
- **Durées par section** : 10-60 s normal. **> 100 s → me le dire.**
- **Absence de `🔧 champ(s) remappé(s)`** = le schéma est respecté. Sa présence = un prompt de section à resserrer.
- **Absence de `Sections non appliquees`**.
- **🔴 Doublon travaux (le risque le plus vicieux — fausse le score sans rien casser à l'écran)** :
```sql
with cible as (select result from analyses where complement_date is not null order by complement_date desc limit 1)
select v->>'label' as chantier_en_double
from cible, jsonb_array_elements(result->'travaux'->'votes') v
where exists (select 1 from jsonb_array_elements(result->'travaux'->'evoques') e
              where lower(e->>'label') = lower(v->>'label'));
```
- Blocage : `update analyses set complement_attempts = 3, complement_date = null where id = '…';` → bouton « Signaler au support ».
- Popup « documents non traités » : la fermer, **recharger** — si elle revient, une RLS bloque l'écriture du drapeau `vu` (écriture faite depuis le navigateur).
- Titre de propriété en analyse simple **et** en complément.

---

## 📌 SESSION — 27 juillet 2026 (matin) ⭐⭐⭐

> Session longue : audit sécurité + fiabilisation lots + UX. ⚠️ Fichiers **CUMULATIFS** — toujours déployer la DERNIÈRE version livrée.
> 🧭 **Leçon de méthode n°1** : plusieurs faux diagnostics posés sur captures d'écran avant d'interroger la base. **Requêter `analyses.result` en SQL AVANT de corriger.**
> 🧭 **Leçon de méthode n°2** : une régression a été introduite EN PRODUCTION pendant la session (prompt de complément gonflé → timeout client). **Mesurer l'impact TEMPS d'un ajout de prompt avant de livrer.**

### ✅ Chantiers livrés

**1. SÉCURITÉ — 3 failles fermées 🔴🔴**
- `analyser` : le header `Authorization` était testé en **présence seulement** (`Bearer nimportequoi` passait). Ajout `supabaseAdmin.auth.getUser(jwt)` réel + contrôle de **propriété** de l'analyse (client service_role = RLS bypassée) étendu aux **collègues de la même agence** (`agence_members`, `removed_at is null`) + validation des `storagePaths` (préfixe `analyseId/` imposé, `..` refusé) : le body pouvait désigner les PDF d'une autre analyse → download **et `.remove()`** en service_role.
- `analyser-run` : aucune auth → URL ouverte à tout Internet (analyses gratuites sur la facture Anthropic + écrasement de rapport via `mode:'complement'`). Ajout d'un contrôle `Authorization === SERVICE_ROLE_KEY`. Les 3 appelants (`analyser`, `analyser-retry`, self-invoke REDUCE) l'envoient déjà → **aucun autre fichier à modifier**.
- `admin-user-management` : `generateToken()` utilisait `Math.random()` (xorshift128+, prédictible) pour les **share_token de rapports**, les **tokens d'invitation pro** ET les **mots de passe temporaires** (8 appels). Remplacé par `crypto.getRandomValues()` avec rejet des octets ≥ 228 (anti-biais modulo). Testé 20 000 tirages : 48 car., 100 % uniques, 57/57 caractères, écart max 2,15 %.
- ⚠️ Le verrou d'`analyser-run` s'appuie sur la clé service_role **toujours pas tournée** (item de mai). Poser le verrou reste utile, mais **la rotation devient prioritaire**.

**2. Composition des lots — chaîne complète (cas réels : Floralies d'Auteuil 39→38, Solférino 38 vs 40)**
- Le moteur **lisait bien** l'état descriptif ; il **comptait mal**. Principe appliqué (identique au recalcul de score) : **le moteur transcrit, le code compte**.
- `analyser-run` : nouveau champ `vie_copropriete.lots_enumeres[]` `{numero, designation, categorie, tantiemes}` (idem `lots_detail` en mode document) + `recompterLots()` déterministe.
- **Filtres** : entrée sans numéro = artefact de saut de page (bloc orphelin type « Jouissance de la partie du jardin… 1.211/10.000èmes » = fin du lot précédent) · numéro déjà vu = report de page · numéro hors plage `1..nb_lots_total`.
- **♻️ Lots remplacés par modificatif** (découverte majeure) : quand un modificatif divise un lot (duplex → 2 apparts, cave → « 7 » et « 7 bis »), les nouveaux lots sont numérotés **à la suite** et l'original coexiste dans l'acte → double comptage. **Détection par les tantièmes** : la somme doit valoir le dénominateur ; l'excédent identifie exactement les lots remplacés. Cas réel Solférino : 42 lots / **120 023 sur 100 000** → excédent 20 023 = duplex (19 973) + cave (50) → **40 lots, 100 000/100 000**, chiffre confirmé par le pré-état daté du syndic.
- **🛡️ Garde-fou anti-écrasement** (bug introduit puis corrigé le jour même) : si > 50 % des lots n'ont ni `categorie` ni `designation`, le recomptage les mettait tous dans « autres » et **écrasait une bonne répartition du moteur** (observé en complément : 12/14/12 écrasé par 38 « autres »). On ne remplace que si le recomptage est **meilleur**.
- `RapportPage` : mention « **Répartition indicative** » quand `nb_lots_detail_verifie === false`. Le total reste présenté comme fiable, la ventilation comme à vérifier.

**3. ⚠️ Prompt de COMPLÉMENT — modif faite PUIS ANNULÉE le même jour (régression prod) 🔴**
- Constat de départ (juste) : `buildComplementPrompt` faisait **617 tokens** contre 22 173 pour l'analyse complète, et disait *« applique les mêmes règles de notation »* **sans les fournir**. D'où lots dans « autres » et blocs à moitié vides.
- Correction tentée : injecter `buildSystemPrompt('complete_ref')` → **~21 900 tokens**.
- 💥 **RÉSULTAT EN PRODUCTION : 2 TIMEOUTS sur un dossier client** (602a51fa, 15h21 et 15h45). Le complément est **single-call** et reçoit déjà le rapport existant en JSON (énorme pour un dossier MAP-REDUCE) + jusqu'à 5 PDFs. +21 000 tokens de consignes ET demande de régénérer la structure complète → temps de génération explosé, seul facteur qui compte face au mur des ~400 s.
- ✅ **ÉTAT FINAL : prompt court restauré (~1 060 tokens)** = version d'origine + **uniquement la règle des 7 catégories de lots** (celle qui manquait vraiment) + consigne de conserver `lots_enumeres` existant.
- **Compromis assumé** : le complément reste moins complet qu'une analyse complète sur les documents complexes, mais **il aboutit**.
- ✅ Confirmé par les logs : le complément passe bien par `recalculerCategories` + `validateDiagsManquants` (garde `mode !== 'document'`) — score recalculé, catégories, diags manquants fonctionnent déjà.
- 🎯 **Piste pour plus tard** : le complément a besoin des règles métier mais ne peut pas absorber 22 000 tokens. Solution possible = n'injecter que les blocs concernés par les documents ajoutés (détectés à l'upload).
- ✅ **RÉSOLU LE SOIR MÊME** — voir la session du 27/07 (soir). Le diagnostic « 22 000 tokens = timeout » était **incomplet** : le vrai coupable était le cumul (référentiel + rapport entier à réécrire + PDFs dans le même appel). Le référentiel complet est de retour, mais chaque appel n'écrit plus qu'UNE section.

**4. Prompt de LECTURE (MAP) — 6 → 13 types de documents couverts**
- ⚠️ **Nuance importante** : le prompt MAP a une règle générale d'**extraction exhaustive** — les documents non listés SONT lus (taxe foncière, appels de charges… remontent correctement). La liste « PRÉCISIONS PAR TYPE » ne fait qu'**orienter** la recherche.
- Le manque se voit sur les documents **complexes et très structurés** : `compromis` et `bien` restaient `null` sur un dossier réel (14 docs, MAP-REDUCE) alors que le compromis était détecté et non en échec. Les faits libres ne se mappaient pas sur les ~20 champs du bloc.
- Ajout de 7 types : **COMPROMIS** (vendeur, acheteur, 2 notaires, agence + honoraires, prix, dépôt de garantie, dates signature/réitération, rétractation, **chaque condition suspensive avec sa date butoir**, désignation du bien, mobilier, clauses), **CARNET D'ENTRETIEN**, **DTG/PPT**, **FICHE SYNTHÉTIQUE**, **TAXE FONCIÈRE**, **ASL/AFUL**, **ASSURANCE**, **TITRE DE PROPRIÉTÉ**. Prompt MAP : ~1 200 → ~1 860 tokens.
- ✅ **Sans risque de timeout** : ce prompt est utilisé par doc, en parallèle, avec son propre budget de 350 s.

**5. Fonds de travaux — part du VENDEUR ≠ chiffre COPRO 🔴 (cas réel : pré-état daté SUSINI, 438,30 €)**
- Le rapport affichait « Cotisation fonds travaux **votée** : 438,30 € » pour une copro dont 5 % de 38 000 € = **1 900 €/an**. 438,30 € = la part rattachée **aux lots vendus** (Partie III du PED).
- **Piège de la Partie III** nommé dans le prompt : elle enchaîne des lignes de **portées différentes** sans le signaler — « impayés au sein de la copropriété » (copro), « dette du Syndicat » (copro), puis « Fonds de travaux » (**vendeur**) et « cotisation appelée au cédant » (**vendeur**).
- Interdiction rendue **inconditionnelle** (elle était conditionnée à « si SEUL un PED est fourni », donc inactive dès qu'un PV d'AG existait) + contrôle de vraisemblance + **garde-fou code** : si `finances.fonds_travaux` == `pre_etat_date.fonds_travaux_alur`, le champ copro est vidé.
- ⚠️ **Origine du 438 € identifiée** : ce n'est PAS le moteur — c'est le code (`analyser-run` ~l.452, commentaire « demande Alex : afficher le montant attendu ») qui reconstitue montant = % × budget. Le défaut était en amont (« 5 % » n'était pas voté, c'était le **rappel légal**) et en aval (affiché comme « votée »). Le montant reconstitué est marqué `fonds_travaux_estime = true`.
- `RapportPage` — 3 états : **votée** (montant écrit) · **estimée** (reconstitué, tooltip explicite) · **Non renseigné** (encadré pointillé + « le rappel du minimum légal n'est pas un vote, à demander au syndic »).

**6. Budgets — budget VOTÉ vs charges RÉELLES**
- Le rapport affichait 4 lignes identiques à 38 000 € (dont 2021 **inventée**) avec « 0,0 % » partout, alors que les PV disent : budget 2022 = 37 000 €, comptes 2022 = 35 801,42 €, budget 2024 = 38 000 €.
- Prompt : `budgets_historique` = un objet par année **réellement documentée**, avec `budget_total` (prévisionnel **voté**) ET `charges_reelles` (comptes **approuvés**) séparés. Règle **N/N+1** : les comptes de N sont approuvés au PV de N+1 → ligne de l'année N. **Interdiction d'inventer une année.** Détection du budget voté 2× pour le même exercice (37 000 en mars 2023 puis 38 000 en février 2024) → point de vigilance.
- ⚠️ Exemple du prompt corrigé : `fonds_travaux: 9000` valait pile 5 % de `budget_total: 180000` → le moteur en déduisait une règle inexistante. **Ne jamais mettre de nombres en rapport rond dans les exemples de prompt.**
- `RapportPage` : 2 colonnes **BUDGET VOTÉ** / **DÉPENSÉ**, écart calculé sur le **même exercice** (2022 : −3,2 % en vert), barre verte sous la bleue, note explicative.

**7. `validateDiagsManquants` réparé — bug silencieux 🔴**
- `const anneeStr = (r.annee_construction as string) || ''` : `as string` est un **cast**, pas une conversion. Le schéma autorise un nombre → `.match()` inexistant → `TypeError` rattrapé (« non bloquant ») mais **la fonction ne tournait jamais**. Conséquence : **aucun diagnostic obligatoire manquant n'était signalé**, silencieusement. Fix `String(… ?? '')`.

**8. `DocumentRenderer` — crash de page entière + KPI blancs**
- 🔴 `TypeError: e.replace is not a function` → **toute la page rapport** tombait (Error Boundary). Cause : `points_forts`/`points_vigilance` déclarés `[]` sans forme → le moteur renvoyait des **objets** ; `stripLeadingEmoji` appelait `.replace()` dessus. **7 types exposés** (RCP, DTG_PPT, CARNET_ENTRETIEN, PRE_ETAT_DATE, ETAT_DATE, MODIFICATIF_RCP, AUTRE) : tous ont un tableau d'objets juste **avant** `points_forts` → effet d'entraînement. Fix : `safeStr()` + `splitPoint` acceptant les objets (portage de `RapportPage` l.1053, déjà blindé en juin) → protège les **17 renderers**. 2ᵉ `.replace()` non protégé corrigé (l.853).
- 🐛 **KPI blancs** : `React.Children.count()` compte **aussi** les enfants absents (`{cond && <Kpi/>}` valant `false`) → 1 KPI réel dessiné sur 3 colonnes. Fix `React.Children.toArray()`. **Touche tous les types de documents.**
- Modificatif RCP : `KpiCard` (disparaît si vide) + bloc « **Ce qui change** » remonté en tête (tantièmes avant barrés → après) ; parties communes du RCP en liste 2 colonnes au lieu de pastilles (les éléments sont des phrases entières).
- **Compromis détecté mais bloc `null`** : la section s'ouvrait sur du vide (titre + en-têtes, rien dedans). Nouveau test `compromisDataUtile` (contenu réel, pas simple présence) → encart « Ce document a été identifié mais ses données n'ont pas pu être extraites ».

**9. UX — notifications de rapports supprimés**
- Cliquer une notif d'analyse supprimée : la boucle de polling ne testait que `failed` et `result` → `null` ne matchait rien → **36 tentatives = 3 min de roue** puis « Rapport introuvable. » sans bouton. Fix : sortie immédiate + écran avec explication et 2 sorties.
- Cause racine : `deleteAnalyse` ne supprimait pas `user_notifications` → la cloche continuait d'annoncer « Votre analyse est prête ». Fix unitaire **et** en lot.
- 2ᵉ passe : `if (isAnalysis && onClickNotification)` bloquait le clic quand `analysis_id` était vide → **aucune réaction du tout**. Fix : handler appelé dans tous les cas, **pop-up** « Ce rapport n'est plus disponible » (fond flouté, Échap, clic dehors) + suppression de la notif orpheline en base. Monté sur les 2 dashboards.

**10. Infobulle du 0/20 — message inversé 🔴**
- `{isZero && …}` affichait toujours « aucun document pertinent n'a été détecté », y compris quand le 0 venait de **risques trouvés**. Sur « Risques juridiques 0/4 » avec procédures détectées, le rapport disait **l'inverse de la réalité** — et laissait croire qu'ajouter des documents ferait remonter la note.
- Fix `zeroParRisque` : message distinct pour `procedures` (si `nbProcedures > 0`), `travaux`/`travaux_bati` (si `travaux_votes`), `finances` (si bloc présent).

### 📦 Déploiement du 27/07
- **GitHub (Vercel auto)** : `RapportPage.tsx` · `DocumentRenderer.tsx` · `MesAnalyses.tsx` · `DashboardPage.tsx` · `DashboardProPage.tsx`
- **Supabase Studio — redéploiement MANUEL ×3** : `analyser-run` (cumule les 8 chantiers serveur, **version finale = prompt de complément COURT**) · `analyser` · `admin-user-management`
- **Aucun SQL.**
- Nettoyage optionnel des notifs orphelines :
  `delete from user_notifications where analysis_id is not null and analysis_id not in (select id from analyses);`

### 🧪 Tests à faire par Alex (post-déploiement)
- **🔴 En priorité — complément sur le dossier client 602a51fa** : doit ABOUTIR (2 timeouts en v151, corrigé en version finale).
- Analyse complète + analyse simple : rien de cassé côté sécurité (le front envoie déjà le vrai JWT).
- Dossier Solférino relancé : chercher `♻️ Modificatif détecté — 120023/100000` et `40 lots` dans les logs.
- Complément avec carnet d'entretien : lots ventilés (ou `🛡️ Recomptage non concluant` = garde-fou actif).
- Dossier avec compromis en **analyse complète ≥ 6 docs** : bloc compromis rempli (avant : `null`).
- Notif d'un rapport supprimé : pop-up immédiate, notif disparue ensuite.
- Rapport avec procédures : infobulle « des risques ont été identifiés » et non « aucun document ».

---
## 📌 SESSIONS 2-3, 24 et 25 juillet 2026 — condensé

> Le détail complet de ces trois sessions a été retiré le 03/08 pour alléger le fichier. Les acquis techniques qui restent vrais sont déjà décrits dans les sections thématiques ci-dessous (architecture analyse, notation, crédits, Stripe) et dans « 📜 Historique condensé des sessions ».

- **25 juillet** : composition des lots (double comptage corrigé), blindage du complément, comparaison financière, sticky bar, compteur, fonds travaux au millésime. Leçon conservée : une vérification esbuild seule ne remplace pas `tsc -b` — un TS2367 était passé jusqu'au build Vercel.
- **24 juillet** : temps estimé figé au démarrage, carnet d'entretien, points forts harmonisés, popup d'aide, ordre des biens figé + statut `processing` en base + barre flottante via `createPortal`. Point SEO : 24/47 guides indexés.
- **2-3 juillet** : socle MAP-REDUCE et calibration (`MAP_MAX_TOKENS`, `MAP_TIMEOUT_MS`), correction du bug de score (`recalculerCategories` mettait à jour les catégories sans sommer dans `rapport.score`).

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
| `admin-user-management` | Actions admin (create, invite, delete, reset password, setup_pro_account, send/resend_pro_invitation, create_pro_demo, activate_pro_demo, unlock_agence_subscription, grant_agence_credits, set_agence_users_max, 🆕 **`delete_agence`** 07/08) — création auto entité agence si `pro_profile_type='agence'` · 🆕 `pro_recommended_plan` accepté dans `create_pro_demo` (07/08) | **v5** (7 août) |
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
/dashboard/notifications       → Historique des notifications  🆕 27/07 soir (commun particulier + pro)
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

### Auto-conversion démo → actif (V8, étendue le 07/08)
**Trois déclencheurs**, tous posent `pro_status='active'` + `pro_demo_converted_at` :
1. **Paiement Stripe** (abonnement OU achat unitaire) → `convertDemoToActiveIfNeeded` dans `stripe-webhook-pro`
2. 🆕 **Crédits démo épuisés** (07/08) → bascule côté client dans `HomeViewPro` (`DashboardProPage`), garde-fou `.eq('pro_status','demo')`
3. **Clic admin** « Passer en compte actif » → action `activate_pro_demo`

⚠️ Le déclencheur 3 pose `pro_demo_converted_at` **sans aucun paiement** : toute mesure de conversion doit croiser avec `pro_subscriptions` (voir l'entonnoir d'Analyse/CA).

**Effet réel de `pro_status='demo'`** : lu à **un seul endroit** du code client (`DashboardProPage` l.~932). Il n'a **aucun pouvoir de blocage** — l'onglet « Mon abonnement » reste accessible en démo. Il affiche le bandeau orange et **masque la carte de plan recommandé**. C'est tout.
- Le bandeau bleu « Vous avez testé Verimo » (avec « je souhaite être rappelé ») est **conservé après la bascule** — il ne dépend plus de `isDemo`.

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
- ✅ **Regroupement visuel par agence (header doré dépliable + membres indentés)** — RÉSOLU le 22 juin. Le code était bon ; cause = RLS (`agences` / `agence_members` sans policy admin). Fix = policies SELECT `is_admin()` sur les deux tables. + Vue détail agence complète, analyses cliquables paginées, bouton « Voir l'agence ».
- 🆕 **REFONTE DU 07/08 — l'agence est devenue une entité de premier plan.** Voir la session du 7 août pour le détail. En résumé :
  - **3 sous-onglets** `proScope` : Comptes individuels / Agences / Tous. L'onglet Agences lit **`agences` directement** → une agence sans membre est enfin visible.
  - Bandes **repliées par défaut** (`expandedAgences`, sémantique inversée).
  - Bandes enrichies : statut réel, sièges `N/max`, pool de crédits, responsable, renouvellement.
  - **Renommage de l'agence** (nécessite la policy RLS UPDATE admin, SQL du 07/08).
  - **Bouton « Mode démo agence »** (3 places + pool en un clic, si `nb_users_max <= 1`).
  - **Suppression totale en cascade** (`delete_agence`), confirmation par saisie du nom.
  - Filtre profil « 🏛 Agences » → **« 🏛 Agence à structurer »** : isole les `pro_profile_type='agence'` SANS entité agence (= prospects à convertir), ne fait plus doublon avec l'onglet.
- ⚠️ **`agences.status` est inutilisable comme signal démo/payant** : il vaut `'active'` dès la création. Se baser sur `pro_subscriptions` + `nb_users_max`.

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
- `profiles.agence_role` : TEXT (`'responsable'` | `'co_responsable'` | `'agent'`) — ⚠️ **aucune FK, jamais nettoyée** à la suppression d'une agence
- 🆕 **Règles ON DELETE complètes (relevées en prod le 07/08)** : voir la section « Règles de suppression vérifiées en prod » dans la session du 7 août. Point clé : **`payments.user_id` est en SET NULL** → le CA survit à la suppression d'un compte.
- ⚠️ **`email_verified` ne prouve PAS l'activation** : `admin-user-management` crée tous les comptes avec `email_confirm: true`, donc le drapeau est vrai dès la création. **Le seul signal fiable est `last_sign_in_at`** via la fonction SQL `get_users_last_sign_in()`. Corrigé partout le 07/08 — ne pas re-brancher un compteur dessus.
- `callback_requests.status` : TEXT default 'pending' (`'pending' | 'called' | 'converted' | 'declined'`)

---

## 📐 Règles de notation — Score /20

**Appartement / Copropriété** (`recalculerCategories`) :

| Catégorie | Max | **Point de départ** | Modèle |
|-----------|-----|---------------------|--------|
| Travaux | 5 pts | **5** | soustractif |
| Procédures | 4 pts | **4** | soustractif |
| Finances | 4 pts | **2** | socle, monte et descend |
| Diagnostics privatifs | 4 pts | **4** (0 si aucun diag) | soustractif |
| Diagnostics communs | 3 pts | **3 / 2 / 1,5** (voir ci-dessous) | variable |
| **TOTAL** | **20 pts** | **17-18 sur un dossier vierge** | |

> ⚠️ **On ne part PAS de 20.** 3 catégories sur 5 démarrent au maximum, 2 sur un socle. Un dossier sans aucun signal démarre à 17 ou 18. Le 20/20 s'atteint via les bonus (fonds travaux ≥ 10 %, pré-état daté sans impayé, DTG bon). La FAQ de `MethodePage` a été réécrite en conséquence le 28/07 — l'ancienne version affirmait le contraire.

> 🆕 28/07 — **Diagnostics communs, 3 points de départ** : `3/3` si **rien n'est exigible** (bâti ≥ 1997 → badge `SANS OBJET` au front) · `2/3` si exigible ET fourni, ou **année inconnue** (socle neutre) · `1,5/3` si exigible ET rien fourni. Avant : `2/3` dans tous les cas — le neuf conforme perdait 1 point, l'ancien lacunaire ne perdait rien.

> 🆕 28/07 — **Applicabilité systématique.** Une obligation n'est réclamée QUE si elle est **certainement** due : amiante < 1997 · plomb < 1949 · électricité installation > 15 ans (**seuil glissant** `année − 15`) · Carrez copro seulement · fonds de travaux immeuble > 10 ans · PPT et DPE collectif copro > 15 ans · audit énergétique maison/monopropriété E-F-G · SPANC seulement si `type_reseau !== 'collectif'`. **Année inconnue = on ne réclame rien** (avant, `!anneeNum ||` rendait le diag électrique obligatoire par défaut = −0,75 sur une hypothèse).

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

> ⚠️ 28/07 — La grille MAISON n'a **pas** été auditée : `categoriesMaison`/`penaltiesMaison` (valeurs publiées) n'ont pas été confrontés au code, et 2 socles subsistent (`travaux_bati` plafonné à 2/3 sur une maison neuve, `assainissement_risques` à 2/4 sans données). Chantier ouvert.

> Branche `if (!isCopro) return recalculerCategoriesMaison(...)` en tête de `recalculerCategories`. Différence clé : pour la maison, le **score global est recalculé** = somme des 5 catégories (la copro, elle, conserve le score du LLM). Détail complet dans la section dédiée plus bas.

---

## ⚙️ Architecture ANALYSE — ÉTAT ACTUEL (vérifié dans le code le **29 juillet**) ⭐⭐⭐

> Source de vérité = le code du repo. Remplace les anciennes sections « MAP-REDUCE 03 juin » et « CHANTIER 400 SECONDES ».

### Pipeline
1. **`analyser` (étape 1)** : télécharge les PDFs du bucket `analyse-temp`, upload Files API. Surcharge Anthropic à l'upload → **queue v9** (`tryEnqueueOrFail`) ; sinon `files_ready` puis fire-and-forget vers analyser-run. Mode complément : rapport existant lu en base, deadline 7 j serveur, cap 5 docs, one-shot serveur, gratuit. Tamponne `last_retry_at` (anti-watchdog). **🔒 27/07 : JWT réellement vérifié + propriété de l'analyse (self OU même agence) + storagePaths bornés à `analyseId/`.**
2. **`analyser-run` (étape 2)** — **🔒 27/07 : fonction INTERNE**, exige `Authorization === SERVICE_ROLE_KEY`. Aiguillage (ordre exact) : `mode='complement'` → **COMPLÉMENT v2** (nouveau, 27/07 soir) ; sinon `mode='complete'` **ET ≥ 6 docs** (`SEUIL_MAP_REDUCE = 6`) → **MAP-REDUCE v2** ; sinon (dont `document`) → **single-call v7**.
   - **⚠️ `callAI` est en `stream: true` depuis le 27/07 soir** (parsing SSE) + lecture du `stop_reason` (erreur `truncated`, jamais relancée). Sans streaming, un `abort()` était **facturé en entier**.
   - **MAP** (`MAP_TIMEOUT_MS = 350000`, ne pas dépasser 370000) : lecture parallèle, **faits en texte libre** + `chiffres_cles` + `alertes` par doc, suppression du PDF Files API APRÈS sauvegarde en base (`map_resultats` jsonb). Prompt ~1 860 tokens, **13 types de documents** précisés (27/07). Retry uniquement si l'échec a été **rapide** (`MAP_RETRY_WINDOW_MS`).
   - **🆕 29/07 — DÉCOUPAGE PAR PLAGES DE PAGES** : au-delà de `DECOUPAGE_SEUIL_PAGES = 25`, `extractOneDoc` bascule sur `extraireParTranches()` → `Math.ceil(pages / 20)` appels **parallèles sur le même `file_id`**, plafonnés à `DECOUPAGE_MAX_TRANCHES = 8`. Chacun lit le PDF entier, n'écrit que sa plage (`buildMapPrompt(plage)`), et les extraits sont recollés **en code** par `fusionnerTranches()` (dédoublonnage par contenu, `page` exclu de la clé). Le nombre de pages vient du **front** (`pdf-lib`) via `filePages[]` → `fileIds[].pages` ; absent ou 0 → **aucun découpage**. Le `finally` de suppression RGPD couvre les deux chemins. 🔌 `DECOUPAGE_SEUIL_PAGES = 9999` = interrupteur.
   - **REDUCE** (self-invoke, service-role) : empile les extraits, 1 appel `buildSystemPrompt('complete')`, post-traitement déterministe, écrit `result`, nettoie `map_resultats`, notifie.
   - **Post-traitement déterministe** (tous modes ≠ `document`) : `retryDpeCarrez` · `recalculerCategories` / `recalculerCategoriesMaison` (score = somme des catégories) · **`recompterLots` + `retirerLotsRemplaces`** (27/07) · `validateDiagsManquants` (**réparé** 27/07) · **`croiserTitrePropriete`** (27/07 soir, **sans impact sur la note**) · **extraction dédiée EDD** si la liste des lots est douteuse (appel court ~500 tokens, avant suppression RGPD).
   - **COMPLÉMENT v2** (2 invocations, budget neuf pour chacune) :
     - `phase complement-map` : 1 appel **par document, en parallèle** (`extractOneDoc(f, apiKey, false)` — suppression RGPD différée) → `complement_extraits`. Puis **extractions ciblées** (`retryDpeCarrez`, `extraireLotsRCP`) bornées par `avecDelai()` au temps restant avant 340 s, **sautées** si la lecture a dépassé ce budget. Suppression RGPD, puis self-invoke.
     - `phase complement-merge` : `referentielMetier()` (= `buildSystemPrompt('complete')` **sans le schéma global**, ~19 700 tk) injecté dans chaque appel de section. **16 sections**, `ROUTAGE_SECTIONS` (`type_detecte` → sections), appels **parallèles** 150 s / 16 000 tk. Sections non concernées **recopiées telles quelles**.
     - Puis, dans l'ordre : extras ciblés en dur → `purgerDocsManquants` → `normaliserAliasComplement` → `recalculerCategories` → `validateDiagsManquants` → `croiserTitrePropriete` → **conclusion en dernier** (elle voit le score final).
     - 🔌 `COMPLEMENT_REFERENTIEL_COMPLET = true` — interrupteur de repli.
3. **Échec** : `handleAnalyseFailure` — analyse classique → refund idempotent + `failed` + notif ; **complément → 0 refund + `completed` restauré + marqueur** (25/07). ✅ Validé en conditions réelles le 27/07 : 2 compléments en timeout, rapport d'origine intact, aucun crédit débité.
4. **Filets** : cron `analyser-retry` (5 min, 12 tentatives ≈ 1h) ; cron `watchdog-stuck-analyses` (15 min, seuils sur created_at **ET** last_retry_at).

### 📏 Tailles de prompt (mesurées le 27/07) — ⚠️ LE TEMPS DE GÉNÉRATION EST LE SEUL MUR
| Prompt | Tokens | Usage |
|---|---|---|
| `buildSystemPrompt('complete')` | ~22 000 | analyse complète + REDUCE |
| `buildDocumentPrompt` | ~16 400 | analyse simple — **schémas structurés par type** |
| `buildComplementPrompt` | **INUTILISÉ depuis le 27/07 soir** | remplacé par `referentielMetier()` par section |
| `referentielMetier()` | **~19 700** | complément — par SECTION, sortie ≤ 3 000 tk |
| `buildMapPrompt()` | ~1 950 | lecture d'un doc — **faits en texte libre** |
| `buildMapPrompt(plage)` | ~2 250 | 🆕 29/07 — idem + en-tête de plage de pages (gros documents) |

> 🔴 **RÈGLE CORRIGÉE LE 27/07 (soir)** — la version du matin (« ne jamais gonfler le prompt de complément ») était **incomplète et trompeuse**. Le mur n'est pas l'entrée, c'est la **sortie** :
> - **Entrée = prefill**, plusieurs milliers de tokens/seconde. 20 000 tokens de consignes coûtent quelques secondes.
> - **Sortie = génération**, ~60-90 tokens/seconde. **12 000 tokens à écrire = 150-200 s minimum.**
> - **Les PDFs joints** sont le poste le plus cher : décodage page par page, bien plus lent que du texte. Le REDUCE écrit le rapport entier **sans jamais recevoir de PDF** — c'est pour ça qu'il tient.
> ➡️ **Règle utile** : plafonner ce que chaque appel doit ÉCRIRE, et ne jamais mettre PDFs + gros contexte + grosse sortie dans le même appel.
> 🆕 **Corollaire établi le 29/07** : le nombre de PAGES ne prédit pas le volume à écrire. Un RCP de 70 p (texte juridique) écrit moins qu'un PV d'AG de 40 p dense en résolutions. C'est le nombre de FAITS à retranscrire qui compte — d'où l'impossibilité de prédire quels documents passeront, et donc le choix de **découper systématiquement au-delà de 25 pages** plutôt que de chercher un seuil de densité.

### Points de vigilance connus (backlog)
- **🎯 IDÉE ALEX (27/07) — schémas par type en phase MAP.** Différence de fond : l'analyse simple donne au moteur un **formulaire à cases** par type de document ; MAP lui donne une **feuille blanche** (faits libres + page). D'où l'écart : documents simples (taxe foncière, appels de charges) → OK avec l'extraction générique ; documents complexes (compromis ~20 champs, carnet d'entretien, DTG) → les faits libres ne se mappent pas sur les blocs. **Faisabilité vérifiée : 49 noms de champs identiques** entre le schéma COMPROMIS de `buildDocumentPrompt` et le bloc `compromis` du rapport final → reprise quasi mécanique. Obstacles : (a) le type est détecté *pendant* la lecture, or il faudrait le connaître *avant* pour n'injecter que le bon schéma (~1 500 tokens/doc au lieu de 16 400) ; (b) REDUCE est écrit pour consommer du vrac, à réécrire ; (c) ~15 champs de `buildDocumentPrompt` n'ont pas d'équivalent dans le rapport → à verser dans un champ de **texte libre** conservé à côté du structuré. **Décision : à faire à froid, avec un dossier de référence pour comparer avant/après.**
- ~~**Complément moins complet que l'analyse complète**~~ → ✅ **RÉSOLU 27/07 soir** : le complément reçoit le référentiel **complet** par section. Parité garantie par construction.
- **⚠️ `DTG_PPT` absent de la liste `type_detecte` du prompt MAP** — un DTG tombe en `AUTRE` sur les analyses **≥ 6 docs** et en complément. Le renderer `RendererDTGPPT` et le schéma `buildDocumentPrompt` existent déjà (analyse simple OK). **1 ligne à ajouter, reporté à la demande d'Alex.**
- **`retryDpeCarrez` / `extraireLotsRCP` sans `timeoutMs` propre** (héritent de 385 s). Bornées en complément (`avecDelai`), **pas** dans `runAnalyseWithData` : un appel principal long + une extraction de lots longue peut théoriquement dépasser 400 s. Rare (RCP uniquement).
- **Document lu PARTIELLEMENT non détecté** : le prompt MAP demande `elements_illisibles` mais le champ n'est **pas exploité**. Un PV illisible à partir de la page 30 passe pour intégralement traité. Piste : le remonter dans `DocumentsNonTraitesModal`.
- **Écriture du drapeau `documents_non_traites.vu` faite depuis le navigateur** : si une RLS l'interdit, la popup revient à chaque ouverture du rapport (gênant, pas bloquant).
- ~~**Doc en échec après retries = sauté** du REDUCE — le timeout est déjà au plafond, seule piste : repasser le doc seul~~ → ✅ **RÉSOLU 29/07** par le **découpage en plages de pages**. La piste envisagée (repasser le doc raté seul) était mauvaise : elle aurait retimeouté à l'identique. Un doc en échec reste injecté dans `documents_non_analyses` (REDUCE) et `documents_non_traites` (colonne BDD → `DocumentsNonTraitesModal`) — **deux champs distincts, ne pas les confondre**.
- **Mort brutale d'invocation** (~400 s) : rien n'attrape → processing jusqu'au watchdog (1h). Plan heartbeat validé, non codé.
- **Estimation de durée** basée sur le nb de docs seulement.
- **`MAX_TOKENS_OUTPUT = 64000` inatteignable** : le mur des ~400 s coupe bien avant (~20 000 mots max). Le vrai plafond est le **temps**, pas le réglage.
- ~~**Garde-fou manquant l.~2082**~~ → ✅ **FAIT 27/07 soir** (fenêtre `MAP_RETRY_WINDOW_MS` portée sur `runAnalyseWithData` + `runAnalyse`).

### Historique condensé (pour mémoire)
- **03/06** : MAP-REDUCE v18 (tranches de 3, résumés exhaustifs 64K) → **04/06 retour single-call** (plus lent). **25/06** : v18 retiré.
- **02-03/07** : mur single-call mesuré (11 docs = timeout 386 s). Plafond ≈ 10 docs.
- **Puis** : MAP-REDUCE v2 hybride à seuil, résumés libres CONCIS. Architecture en prod aujourd'hui.

---

## 🔴 BACKLOG PRIORISÉ (revu le **3 août 2026**)

### Sécurité — par ordre
1. **🔴 Rotation de la clé service_role** (exposée en mai, jamais tournée). Devenue **plus** critique : le verrou d'`analyser-run` s'appuie dessus.
2. **Consommation du crédit encore côté client** (`NouvelleAnalyse` ~l.464) : `consume_pro_credit` appelé avant l'edge function, jamais vérifié serveur. Après le 27/07, il faut être **inscrit + connecté + savoir ouvrir les outils dev** — plus « n'importe qui sur internet ». À déplacer côté serveur.
3. **CORS `*` sur les 16 edge functions.**
4. **`supabase-schema.sql` obsolète** : 2 tables décrites, ~34 en prod. Aucune migration, aucun historique des fonctions SQL qui manipulent de l'argent (`consume_pro_credit`, `refund_analyse_credit`, `my_agence_id`), pas de staging possible. → `supabase db dump --schema public` committé après chaque session SQL.
5. **🆕 Onboarding pro contournable (constaté 27/07 soir)** : `createUser` pose `email_confirm: true`, donc **« Mot de passe oublié » fonctionne dès la création**. Un client peut se connecter **sans jamais passer par le lien d'invitation** → `pro_onboarding_done` reste `false` ET **les CGV Pro ne sont jamais acceptées** (bandeau « CGV Pro non acceptées » sur des comptes actifs qui consomment des analyses). Correction : écrire `pro_onboarding_done` à la **première connexion**, quel que soit le chemin, et déclencher `CgvProConsentDialog` à ce moment (le composant existe déjà, il se base sur `cgv_pro_accepted_at`).
6. **README** : documente `VITE_ANTHROPIC_API_KEY=sk-ant-…` — le préfixe `VITE_` **bundle la variable côté client**. Personne ne l'utilise (`.env.example` est propre) mais l'instruction est dangereuse. À supprimer. Fichier vide `supabase/functions/a` à supprimer aussi.

### Qualité de code (chiffres remesurés le 29/07)
- `AdminPage` **9 158** lignes · `DashboardProPage` **8 634** · `RapportPage` **6 494** · `analyser-run` **5 262** — pour **6 composants partagés**. *(mesuré le 29/07)*
- **8 763 `style={{}}` inline contre 869 `className`** : Tailwind installé, quasi inutilisé. Changer une couleur de marque = 8 763 endroits.
- **253 `any`**, dont dans `stripe-webhook-pro`. `tsconfig.app.json` n'inclut que `src` → **les edge functions ne sont typecheckées par personne**.
- 47 guides importés statiquement → `GuideArticlePage` pèse **101 kB gzip** pour lire un article (pages purement SEO). `import.meta.glob` lazy → < 15 kB.
- **Piste de refactoring utile** : `supabase/functions/_shared/prompts.ts` (module partagé). Les Edge Functions ne partagent pas leur code → dupliquer un prompt entre 2 fonctions recréerait exactement le bug du complément. **Une edge function séparée pour le complément serait contre-productive.**
  - ✅ **Position confirmée le 27/07 soir**, question posée par Alex. Le complément utilise `recalculerCategories`, `validateDiagsManquants`, `buildSystemPrompt`, `callAI`, `extractOneDoc`, `retryDpeCarrez`, `extraireLotsRCP`, `handleAnalyseFailure` — soit l'essentiel du fichier. Une fonction séparée imposerait **2 redéploiements manuels** par correction et ouvrirait la porte à **2 barèmes de score divergents**. Ce qui donne le budget neuf de 400 s, c'est le **self-invoke**, pas le fichier. `analyser-run` fait désormais **~5 260 lignes** : si découpage un jour, sortir ce qui est **stable et non métier** (notation, helpers JSON, appels API), pas une fonctionnalité.

### Produit
- **Récupération des documents** (idée retenue) : le mandataire envoie un lien au vendeur, checklist ✅/❌, relances auto, analyse lancée quand complet. Se place **avant** l'analyse dans la chaîne → attrape le client plus tôt. Validation terrain proposée : appeler 5 mandataires, une seule question — *« le plus pénible, obtenir les documents ou les comprendre ? »*
- **✅/⚠️ Dossier fusionné en un seul PDF — PARTIELLEMENT TRAITÉ le 03/08.** Livré : plafond de **150 pages en analyse simple** (avertissement dès 81 p avec bascule vers la complète) et **200 pages par document en analyse complète**. Non résolu : un client qui fusionne 3 documents courts (40 p au total) passe toujours, et le rapport sera bancal. La détection automatique du contenu fusionné a été **étudiée puis abandonnée** — voir « Découverte E » de la session du 03/08 : aucun critère automatique ne sépare un DDT légitime de documents collés. Reste vrai : en complément, **un seul `type_detecte` par fichier** → un PDF contenant PV + DPE + pré-état daté n'active qu'une seule section.
- Concurrence identifiée : **Naveen** (analyse IA du dossier acheteur, même positionnement, gros SEO) et **Keyzia** (côté syndic). « Analyser des documents » ne différenciera plus dans 12 mois.

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
> ✅ **Le suivi chiffré du funnel est livré (07/08)** : entonnoir 4 étapes dans Analyse/CA + ruban démos sur le tableau de bord + signal « démos en sommeil ». Les items ci-dessus restent du contenu commercial à produire, plus de l'outillage.

---

## 📜 Historique condensé des sessions

### Sessions récentes (mai-juillet 2026)

- **Session 25 juillet 2026 ⭐⭐⭐ : Fiabilisation — composition lots, blindage complément, comparaison financière, sticky bar, compteur, fonds travaux millésime** — voir la section « 📌 SESSION — 25 juillet 2026 » plus haut.
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

### 💸 D'abord : le coût API (découvert le 03/08, jamais chiffré)
1. **🔴 Activer le prompt caching sur le découpage.** Aucun `cache_control` dans `analyser-run`, et les N tranches de `extraireParTranches` renvoient **chacune le PDF entier** (même `file.id`) — les tokens d'entrée sont donc facturés une fois par tranche. Un document de 160 pages coûte 8× son entrée. **Premier poste de dépense probable, sur des dossiers parfaitement normaux.** Modification dans `callAI`, sans effet sur les résultats. *Mesurer avant/après sur un dossier réel pour chiffrer le gain.*

### 🔴 Ensuite : les 3 découvertes du 29/07 toujours ouvertes
Toutes dans `analyser-run/index.ts` sauf la n°3 — **un seul redéploiement Supabase** pour 1 et 2.
1. **`parseJson` robuste + retry sur `json_invalide`** — la section `identite_bien` n'a jamais fonctionné en prod, et le risque vaut pour les 16 sections. Monter aussi `raw.slice(0, 100)` à ~600.
2. **Garde `annee_construction`** : « année présente sans `precision` » doit valoir au moins `borne_superieure`, sinon n'importe quelle source écrase le RCP sur les rapports d'avant le 28/07.
3. **`complement_attempts`** (`analyser/index.ts` l.~569) : ne pas décompter une tentative sur un échec technique.

### 🎨 Suites possibles de la session du 03/08
- **Vérifier le h1 mobile sur petit écran** (iPhone SE) : `whitespace-nowrap` sur « avant de signer. » en Gabarito, plus large que DM Sans. Si ça déborde → clamp de 26px à 24px.
- **Regarder les pages Tarifs et Méthode** après déploiement : la règle CSS s'applique à **tous** les `h1`/`h2` publics. Si un titre ne devait pas être concerné, l'exclure.
- **Chiffres en police mono** (`IBM Plex Mono`) sur le score /20, les notes de catégories et les montants — proposé et montré, **non tranché par Alex**. C'est la piste la plus différenciante restante : Verimo est un produit de chiffres extraits, et personne en proptech française ne les traite comme des données.
- **Déclarer les couleurs de marque dans `tailwind.config.js`**, maintenant que le fichier est ouvert. `#2a7d9c` est en dur **876 fois** dans `src/`.
- **Contrôle serveur du `mode`** (`analyser/index.ts`) : si `mode === 'document'` et `storagePaths.length > 1` → 400. Même chantier que la faille `consume_pro_credit`.

### 🧹 Suites de la session du 07/08 (après déploiement)
- **Supprimer les 3 agences fantômes** (Boris, Kerlio Aga, Robin GEMOZ) — 0 membre, 0 analyse. Tester le bouton de suppression dessus en premier, aucun risque. Vérifier avant que les 5 colonnes liées sont bien à 0.
- **Repasser Isabelle RIBARD et Julien DOMINGO** en « Agent solo », ou les traiter comme prospects Agence : ils sont typés `agence` sans entité (filtre « Agence à structurer »). Isabelle est chez Maison Rouge — probable vraie agence à 149,90 €.
- **Renseigner un plan recommandé** sur les 17 démos existantes (fiche client → bloc identité). Aucune n'en a, elles tomberont toutes sur le bandeau générique à la fin de leur démo.
- **Relancer les 9 démos en sommeil** (> 30 j) signalées sur le tableau de bord.
- **Vérifier l'entonnoir** en « Depuis le début » : le 2ᵉ chiffre (taux d'activation) est le plus parlant. S'il reste très bas, le problème est le mail d'invitation ou le moment d'envoi, pas le produit.
- **Non fait volontairement** : invalidation des anciens liens d'invitation (Alex a tranché, voir découverte A du 07/08).

### 🧪 À surveiller sur les prochains gros dossiers
- Durée de la tranche la plus lente : **210 s constatées** sur 350. Si ça se tend → `DECOUPAGE_PAGES_PAR_TRANCHE` à 15.
- Durée du REDUCE : il reçoit beaucoup plus de matière (471 éléments pour un seul RCP). 385 s, jamais atteint à ce jour.
- **Effet des nouveaux plafonds** : plus aucun document > 200 pages ne devrait entrer. Les tranches épaissies (38-63 p) ne devraient donc plus se produire.
- Répondre à Alain CADIER : lui redemander son PV par mail, le tester sur compte démo, **puis** relancer son complément.

### 🔒 Sécurité (état au 23 juin, inchangé)
**Solide** : RLS 34 tables · webhooks signés · admin verrouillé · aucun secret front · prix cohérents · tarifs pro non publics. **🔴 Reste LE must-do : régénérer la clé `service_role`** (dernier verrou avant vraies agences ; démarchage/démos = OK). Puis durcir auth analyser/analyser-run + restreindre CORS.

### 📋 Rappels transverses
- ⚠️ **Mapper `RapportPage.tsx` = liste blanche** (l.~5678) : `checklist` et les champs `annee_construction_*` y manquent → le chantier checklist du 28/07 est invisible en prod. **Tout nouveau champ serveur destiné au rapport doit y recevoir sa ligne, sinon il est silencieusement jeté.**
- ⚠️ **Deux points de réglage pour la typo** : `fontFamily.display` dans `tailwind.config.js` (homepage) **et** `.verimo-public h1, h2` dans `index.css` (les 15 autres pages publiques).
- Aucun contrôle serveur des PDF protégés par mot de passe (détection front uniquement, corrigée le 03/08).
- `extraireLotsRCP` absent du chemin MAP-REDUCE (impact faible, tout en bas de liste).
- `DTG_PPT` absent de la liste `type_detecte` du prompt MAP — 1 ligne à ajouter.
- `elements_illisibles` extrait par le prompt MAP mais **jamais exploité** côté front.
- Gap renderer : fiche dédiée **FICHE_SYNTHETIQUE** à créer (tombe sur RendererAutre).
- Fichier vide `supabase/functions/a` à supprimer · `README` documente `VITE_ANTHROPIC_API_KEY` (dangereux, à retirer).
- Session lifecycle pro (suspendre/résilier/past_due/badges) — session dédiée.
- Funnel pro : rapport exemple anonymisé PDF, 3 templates emails, argumentaire objections.
- Réactiver cron `sync-stripe-payments` quand possible ; fix `stripe_payment_id = NULL` upgrades ; upsert atomique webhook.

**Méthode** :
1. Coller ce context.md en début de conversation
2. Valider chaque chantier avant de coder
3. Une étape à la fois, fichiers COMPLETS livrés via `present_files` depuis `/mnt/user-data/outputs/`
4. Builds Vercel complets (`npm install` puis `tsc -b && vite build`) avant toute livraison front ; esbuild sur les edge functions
5. **Tracer une variable jusqu'à sa construction avant d'affirmer un bug** (leçon du 29/07)
6. **Répondre à la question posée, pas à une plus large** — et sur un choix esthétique, **ne faire varier qu'une chose à la fois** (leçon du 03/08)
7. **Le périmètre montré est le périmètre à modifier** : un composant partagé se modifie par option, pas par changement global (leçon du 03/08)
8. Tester sur compte pro démo / agence test après chaque étape
