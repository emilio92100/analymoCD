import { Link } from 'react-router-dom';

export default function ConfidentialitePage() {
  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 80 }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '52px 24px 88px' }}>

        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2a7d9c', textDecoration: 'none', fontWeight: 600, marginBottom: 32 }}>
          ← Retour à l'accueil
        </Link>

        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 8, letterSpacing: '-0.025em' }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 48 }}>Dernière mise à jour : avril 2026</p>

        {[
          {
            title: '1. Qui sommes-nous ?',
            content: `Verimo est un service en ligne d'analyse de documents immobiliers, exploité par Verimo (hello@verimo.fr). Notre site est accessible à l'adresse https://verimo.fr.

Nous nous engageons à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.`
          },
          {
            title: '2. Données collectées',
            content: `Nous collectons les données suivantes :

• Données de compte : adresse e-mail, nom (lors de l'inscription)
• Documents uploadés : les fichiers PDF que vous déposez pour analyse (PV d'AG, diagnostics, règlement de copropriété, etc.)
• Données de navigation : logs techniques, adresse IP, type de navigateur
• Données de paiement : gérées directement par Stripe — Verimo ne stocke pas vos coordonnées bancaires`
          },
          {
            title: '3. Finalité du traitement',
            content: `Vos données sont utilisées pour :

• Créer et gérer votre compte utilisateur
• Analyser les documents que vous soumettez et générer un rapport
• Vous envoyer des communications liées à votre compte (confirmation, rapport prêt)
• Améliorer le service et détecter les anomalies techniques
• Respecter nos obligations légales`
          },
          {
            title: '4. Traitement de vos documents',
            content: `Les documents que vous uploadez sont transmis à notre moteur d'analyse (Claude, développé par Anthropic) pour en extraire les informations clés. Ces documents sont traités de façon automatisée — aucun humain ne consulte vos fichiers.

Vos documents sont automatiquement supprimés après génération du rapport. Ils ne sont ni conservés, ni revendus, ni partagés à des tiers à des fins commerciales.`
          },
          {
            title: '5. Hébergement et sous-traitants',
            content: `Verimo fait appel aux sous-traitants suivants :

• Supabase (hébergement base de données) — serveurs localisés en France/Europe
• Vercel (hébergement du site) — serveurs en Europe
• Stripe (paiement) — conforme PCI-DSS
• Anthropic (analyse IA des documents) — traitement aux États-Unis, encadré par des clauses contractuelles types

Tous nos sous-traitants offrent des garanties suffisantes en matière de protection des données.`
          },
          {
            title: '6. Durée de conservation',
            content: `• Données de compte : conservées tant que votre compte est actif, puis supprimées 30 jours après suppression du compte
• Documents uploadés : supprimés immédiatement après génération du rapport
• Rapports générés : conservés dans votre espace personnel tant que votre compte est actif
• Données de facturation : conservées 10 ans conformément aux obligations comptables`
          },
          {
            title: '7. Vos droits',
            content: `Conformément au RGPD, vous disposez des droits suivants :

• Droit d'accès : obtenir une copie de vos données
• Droit de rectification : corriger des données inexactes
• Droit à l'effacement : supprimer votre compte et vos données
• Droit à la portabilité : recevoir vos données dans un format structuré
• Droit d'opposition : vous opposer à certains traitements
• Droit à la limitation : limiter le traitement de vos données

Pour exercer ces droits, contactez-nous à : hello@verimo.fr

Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).`
          },
          {
            title: '8. Cookies',
            content: `Verimo utilise uniquement des cookies techniques, strictement nécessaires au bon fonctionnement du service.

Conformément aux recommandations de la CNIL (délibération n°2013-378 du 5 décembre 2013) et à la directive ePrivacy, les cookies strictement nécessaires au fonctionnement d'un service sont exemptés de l'obligation de recueil du consentement préalable. C'est pourquoi Verimo ne vous affiche pas de bannière de consentement aux cookies : nous n'en avons pas l'obligation légale.

Les cookies que nous utilisons sont les suivants :

— Cookie de session Supabase : permet de maintenir votre connexion active et de sécuriser l'accès à votre compte. Sans ce cookie, vous seriez déconnecté à chaque page.
— Cookie d'authentification : stocke votre token d'accès de manière sécurisée pour vous éviter de vous reconnecter à chaque visite.

Ces cookies ne collectent aucune donnée à des fins publicitaires, de profilage ou de suivi comportemental. Ils ne sont jamais partagés avec des tiers.

Verimo n'utilise aucun cookie de tracking, analytics ou publicitaire (pas de Google Analytics, pas de Facebook Pixel, pas de publicité ciblée).

Si vous souhaitez bloquer ces cookies via les paramètres de votre navigateur, vous pouvez le faire, mais sachez que le service Verimo ne pourra plus fonctionner correctement (connexion impossible).`
          },
          {
            title: '9. Sécurité',
            content: `Vos données sont protégées par des mesures techniques et organisationnelles adaptées : chiffrement des communications (HTTPS), accès restreint aux données, authentification sécurisée.`
          },
          {
            title: '10. Contact',
            content: `Pour toute question relative à cette politique ou à vos données personnelles :

E-mail : hello@verimo.fr
Site : https://verimo.fr`
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f2d3d', marginBottom: 12 }}>{section.title}</h2>
            <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        <div style={{ marginTop: 48, padding: 24, background: '#f0f7fb', borderRadius: 16, border: '1px solid rgba(42,125,156,0.15)' }}>
          <p style={{ fontSize: 14, color: '#2a7d9c', fontWeight: 600, marginBottom: 4 }}>Une question sur vos données ?</p>
          <p style={{ fontSize: 14, color: '#64748b' }}>Contactez-nous à <a href="mailto:hello@verimo.fr" style={{ color: '#2a7d9c', fontWeight: 600 }}>hello@verimo.fr</a> — nous répondons sous 48h.</p>
        </div>

      </section>
    </main>
  );
}
