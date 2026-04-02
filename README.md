# Verimo

**Vos documents décryptés, votre décision éclairée.**

SaaS d'analyse de documents immobiliers (PV d'AG, règlements de copropriété, diagnostics, appels de charges). Rapport clair avec score /10, risques et recommandations en 30 secondes*.

## Stack technique

- React 19 + Vite + TypeScript
- Tailwind CSS v3
- Framer Motion
- React Router DOM v7
- Supabase (Auth + Base de données)
- Claude API (analyse des documents)
- Stripe (paiements)
- Vercel (déploiement)
- Mailjet (emails)

## Variables d'environnement

Créez un fichier `.env.local` à la racine :
```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

## Lancer le projet
```bash
npm install
npm run dev
```

---

*Temps indicatif pour les PDF natifs numériques.
