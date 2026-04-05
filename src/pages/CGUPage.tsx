import { Link } from 'react-router-dom';

export default function CGUPage() {
  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 80 }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '52px 24px 88px' }}>

        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2a7d9c', textDecoration: 'none', fontWeight: 600, marginBottom: 32 }}>
          ← Retour à l'accueil
        </Link>

        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 8, letterSpacing: '-0.025em' }}>
          Conditions Générales d'Utilisation
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 48 }}>Dernière mise à jour : avril 2026</p>

        {[
          {
            title: '1. Présentation du service',
            content: `Verimo est un service en ligne d'aide à la lecture et à la compréhension de documents immobiliers, exploité par Verimo (ci-après "Verimo", "nous" ou "le Prestataire"), joignable à l'adresse hello@verimo.fr.

Le service est accessible à l'adresse https://verimo.fr et permet à l'utilisateur de soumettre des documents immobiliers (procès-verbaux d'assemblée générale, règlements de copropriété, diagnostics techniques, appels de charges, compromis de vente, etc.) afin d'en obtenir une analyse structurée générée par intelligence artificielle.

Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du service Verimo. En créant un compte ou en utilisant le service, l'utilisateur accepte sans réserve les présentes CGU.`
          },
          {
            title: '2. Accès au service',
            content: `Le service Verimo est accessible à toute personne physique majeure ou personne morale disposant d'un accès à Internet et ayant créé un compte utilisateur.

L'inscription est gratuite. Certaines fonctionnalités sont soumises à un paiement selon les tarifs en vigueur sur https://verimo.fr/tarifs.

Verimo se réserve le droit de refuser l'accès au service, de suspendre ou de supprimer un compte en cas de violation des présentes CGU, sans préavis ni indemnité.`
          },
          {
            title: '3. Création de compte',
            content: `L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de la création de son compte. Il est seul responsable de la confidentialité de ses identifiants de connexion.

Toute utilisation du service avec ses identifiants est réputée effectuée par l'utilisateur lui-même. En cas de perte, de vol ou d'utilisation non autorisée de ses identifiants, l'utilisateur doit en informer Verimo sans délai à l'adresse hello@verimo.fr.`
          },
          {
            title: '4. Nature et limites du service',
            content: `Verimo est un outil d'aide à la décision. Les rapports générés sont produits automatiquement par un système d'intelligence artificielle à partir des documents fournis par l'utilisateur.

⚠️ Les analyses fournies par Verimo sont données à titre purement informatif. Elles ne constituent en aucun cas :
• Un conseil juridique ou une consultation juridique
• Un conseil financier ou une expertise comptable
• Un diagnostic technique certifié
• Une garantie sur l'état du bien immobilier analysé

Verimo n'est pas un cabinet d'expertise, de notaires, d'avocats ou de conseillers financiers. L'utilisateur est seul responsable des décisions qu'il prend sur la base des rapports fournis par le service.

Verimo recommande à l'utilisateur de consulter un professionnel qualifié (notaire, avocat, expert immobilier) avant toute décision d'achat immobilier.`
          },
          {
            title: '5. Obligations de l\'utilisateur',
            content: `L'utilisateur s'engage à :

• Utiliser le service conformément à sa destination et aux présentes CGU
• Ne soumettre que des documents dont il est légalement en possession
• Ne pas tenter de contourner les mécanismes de sécurité du service
• Ne pas utiliser le service à des fins illicites, frauduleuses ou contraires à l'ordre public
• Ne pas reproduire, revendre ou exploiter commercialement les rapports générés sans autorisation écrite préalable de Verimo
• Respecter les droits de propriété intellectuelle de Verimo

L'utilisateur garantit qu'il dispose des droits nécessaires sur les documents qu'il soumet à l'analyse.`
          },
          {
            title: '6. Tarifs et paiement',
            content: `Les tarifs du service sont indiqués en euros toutes taxes comprises (TTC) sur la page https://verimo.fr/tarifs.

Le paiement est effectué en ligne via Stripe, prestataire de paiement sécurisé. Verimo ne stocke aucune donnée bancaire.

Les achats de crédits d'analyse sont fermes et définitifs. Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation de 14 jours ne s'applique pas aux contenus numériques dont l'exécution a commencé avec l'accord exprès de l'utilisateur.

En cas d'anomalie de facturation, l'utilisateur peut contacter hello@verimo.fr dans un délai de 30 jours.`
          },
          {
            title: '7. Propriété intellectuelle',
            content: `L'ensemble des éléments constituant le service Verimo (interface, logo, textes, rapports générés, algorithmes) est protégé par les dispositions du Code de la propriété intellectuelle.

Toute reproduction, représentation, modification ou exploitation non autorisée de ces éléments est interdite et constitue une contrefaçon sanctionnée par la loi.

Les rapports générés par Verimo à partir des documents de l'utilisateur sont mis à la disposition de l'utilisateur pour un usage personnel et non commercial. Ils ne peuvent être revendus ou utilisés à des fins commerciales sans autorisation préalable.`
          },
          {
            title: '8. Responsabilité',
            content: `Verimo s'engage à mettre en œuvre tous les moyens raisonnables pour assurer la disponibilité et la qualité du service. Toutefois, Verimo ne peut garantir :

• L'exactitude, l'exhaustivité ou la pertinence des analyses générées
• La disponibilité continue et ininterrompue du service
• L'absence d'erreurs dans les rapports produits par intelligence artificielle

La responsabilité de Verimo ne saurait être engagée en cas de :
• Décision prise par l'utilisateur sur la base d'un rapport Verimo
• Erreur ou omission dans l'analyse d'un document
• Interruption temporaire du service pour maintenance
• Force majeure au sens de l'article 1218 du Code civil

En tout état de cause, la responsabilité de Verimo est limitée au montant des sommes effectivement payées par l'utilisateur au cours des 12 derniers mois.`
          },
          {
            title: '9. Disponibilité et maintenance',
            content: `Verimo s'efforce d'assurer la disponibilité du service 24h/24 et 7j/7. Des interruptions pour maintenance peuvent survenir et seront, dans la mesure du possible, communiquées à l'avance.

Verimo se réserve le droit de faire évoluer, modifier ou interrompre tout ou partie du service à tout moment, sans obligation d'en informer préalablement les utilisateurs.`
          },
          {
            title: '10. Données personnelles',
            content: `Le traitement des données personnelles des utilisateurs est régi par la Politique de Confidentialité de Verimo, disponible à l'adresse https://verimo.fr/confidentialite.

Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n°78-17 du 6 janvier 1978 modifiée, l'utilisateur dispose de droits d'accès, de rectification, d'effacement et de portabilité sur ses données, exercisables à l'adresse hello@verimo.fr.`
          },
          {
            title: '11. Modification des CGU',
            content: `Verimo se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet dès leur publication sur le site.

L'utilisateur sera informé des modifications substantielles par e-mail ou par notification dans l'application. La poursuite de l'utilisation du service après notification vaut acceptation des nouvelles CGU.`
          },
          {
            title: '12. Résiliation',
            content: `L'utilisateur peut supprimer son compte à tout moment depuis les paramètres de son espace personnel. La suppression entraîne la perte définitive des analyses et rapports stockés.

Verimo peut suspendre ou résilier un compte en cas de violation des présentes CGU, de comportement frauduleux ou d'utilisation abusive du service, sans préavis ni remboursement des crédits non utilisés en cas de faute grave.`
          },
          {
            title: '13. Droit applicable et juridiction',
            content: `Les présentes CGU sont soumises au droit français.

En cas de litige relatif à l'interprétation ou à l'exécution des présentes CGU, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire.

Conformément aux articles L.612-1 et suivants du Code de la consommation, l'utilisateur consommateur peut recourir gratuitement à un médiateur de la consommation.

À défaut de résolution amiable, tout litige sera soumis à la compétence exclusive des tribunaux français compétents.`
          },
          {
            title: '14. Contact',
            content: `Pour toute question relative aux présentes CGU :

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
          <p style={{ fontSize: 14, color: '#2a7d9c', fontWeight: 600, marginBottom: 4 }}>Une question sur nos conditions ?</p>
          <p style={{ fontSize: 14, color: '#64748b' }}>Contactez-nous à <a href="mailto:hello@verimo.fr" style={{ color: '#2a7d9c', fontWeight: 600 }}>hello@verimo.fr</a> — nous répondons sous 48h.</p>
        </div>

      </section>
    </main>
  );
}
