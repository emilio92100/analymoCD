/**
 * POLITIQUE DE CONFIDENTIALITÉ — refonte visuelle du 29 juillet 2026
 * Texte juridique repris à l'identique. Seule la présentation change.
 *
 * ⚠️ Seule page publique où l'IA et Anthropic sont nommés explicitement :
 * c'est une obligation de transparence RGPD sur le sous-traitant, pas un
 * oubli de la règle « ne jamais écrire IA sur les pages publiques ».
 */
import { useSEO } from '../hooks/useSEO';
import { LegalLayout, Section, SubTitle, Liste, Table, Callout, EnClair, BlocContact } from '../components/LegalPage';
import type { SectionRef } from '../components/LegalPage';
import { Building2, Database, Target, FileSearch, Server, Clock, UserCheck, Cookie, Lock, Mail } from 'lucide-react';

const SECTIONS: SectionRef[] = [
  { id: 'qui',           label: '1. Qui sommes-nous ?' },
  { id: 'donnees',       label: '2. Données collectées' },
  { id: 'finalite',      label: '3. Finalité du traitement' },
  { id: 'traitement',    label: '4. Traitement de vos documents' },
  { id: 'soustraitants', label: '5. Sous-traitants' },
  { id: 'conservation',  label: '6. Durée de conservation' },
  { id: 'droits',        label: '7. Vos droits' },
  { id: 'cookies',       label: '8. Cookies' },
  { id: 'securite',      label: '9. Sécurité' },
  { id: 'contact',       label: '10. Contact' },
];

export default function ConfidentialitePage() {
  useSEO({
    title: 'Politique de confidentialité — Verimo',
    description: "Comment Verimo traite vos documents et vos données : durées de conservation, sous-traitants, droits RGPD et cookies.",
    canonical: '/confidentialite',
  });

  return (
    <LegalLayout
      titre="Politique de confidentialité"
      chapeau="Quelles données nous collectons, ce que deviennent vos documents après l'analyse, qui y a accès, et comment exercer vos droits."
      maj="mai 2026"
      sections={SECTIONS}>

      <EnClair points={[
        { texte: "Vos documents PDF sont supprimés automatiquement dès le rapport généré. Seul le rapport est conservé.", ancre: 'conservation', ancreLabel: 'Voir les durées' },
        { texte: "Le traitement est entièrement automatisé : aucun employé de Verimo ne consulte vos documents ni vos rapports.", ancre: 'traitement', ancreLabel: 'Voir le traitement' },
        { texte: "Aucun cookie publicitaire, aucune mesure d'audience, aucune revente de données.", ancre: 'cookies', ancreLabel: 'Voir les cookies' },
        { texte: "Vous pouvez accéder à vos données, les corriger, les récupérer ou tout supprimer, sur simple demande.", ancre: 'droits', ancreLabel: 'Voir vos droits' },
      ]} />

      <Section id="qui" icon={Building2} title="1. Qui sommes-nous ?">
        <p>Verimo est un service en ligne d&apos;analyse de documents immobiliers, fondé et exploité par Alexandre ROGELET (<a href="mailto:hello@verimo.fr">hello@verimo.fr</a>). Notre site est accessible à l&apos;adresse <a href="https://verimo.fr">https://verimo.fr</a>.</p>
        <p>Nous nous engageons à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.</p>
      </Section>

      <Section id="donnees" icon={Database} title="2. Données collectées">
        <Table
          headers={['Catégorie', 'Ce que ça comprend']}
          rows={[
            ['Données de compte', "Adresse e-mail, nom (lors de l'inscription)"],
            ['Documents déposés', 'Les fichiers PDF que vous soumettez pour analyse : PV d\u2019AG, diagnostics, règlement de copropriété, appels de charges, etc.'],
            ['Données de navigation', 'Logs techniques, adresse IP, type de navigateur'],
            ['Données de paiement', <>Gérées directement par Stripe — <strong>Verimo ne stocke aucune coordonnée bancaire</strong></>],
          ]} />
      </Section>

      <Section id="finalite" icon={Target} title="3. Finalité du traitement">
        <p>Vos données sont utilisées pour :</p>
        <Liste items={[
          'Créer et gérer votre compte utilisateur',
          'Analyser les documents que vous soumettez et générer un rapport',
          'Vous envoyer les communications liées à votre compte (confirmation, rapport prêt)',
          'Améliorer le service et détecter les anomalies techniques',
          'Respecter nos obligations légales',
        ]} />
      </Section>

      <Section id="traitement" icon={FileSearch} title="4. Traitement de vos documents">
        <p>Verimo utilise une technologie d&apos;analyse documentaire avancée pour extraire, croiser et synthétiser les informations clés de vos documents immobiliers (PV d&apos;assemblée générale, diagnostics, règlement de copropriété, appels de charges, etc.).</p>

        <SubTitle>Fonctionnement technique</SubTitle>
        <p>Vos documents PDF sont transmis de manière sécurisée au modèle d&apos;intelligence artificielle Claude Sonnet 4 (développé par Anthropic). Ce modèle analyse le contenu de chaque document, croise les données entre eux (charges, travaux votés, diagnostics, procédures, finances de la copropriété), et produit un rapport structuré comprenant un score sur 20, des bonus et pénalités détaillés, des risques identifiés et une recommandation.</p>

        <SubTitle>Pourquoi Claude d&apos;Anthropic</SubTitle>
        <Table
          headers={['Critère', 'Ce que cela garantit']}
          rows={[
            ['Fiabilité et précision', "Claude est reconnu comme l'un des modèles les plus performants pour l'analyse de documents longs et complexes, avec un taux d'erreur très faible sur l'extraction d'informations factuelles."],
            ['Sécurité des données', "Anthropic garantit contractuellement que les données envoyées via son API professionnelle ne sont ni stockées durablement, ni utilisées pour entraîner ou améliorer ses modèles. Vos documents restent vos documents."],
            ['Transparence', "Anthropic est une entreprise spécialisée dans la sécurité de l'intelligence artificielle, fondée sur des principes de responsabilité et de transparence. Elle est soumise à des audits réguliers et publie ses pratiques de confidentialité."],
            ['Conformité européenne', 'Le traitement est encadré par des clauses contractuelles types (CCT) conformes aux exigences du RGPD pour les transferts de données hors Union européenne.'],
          ]} />

        <Callout type="success" title="Personne ne lit vos documents">
          Ce traitement est <strong>entièrement automatisé</strong> — aucun employé de Verimo ne consulte vos documents ni vos rapports. Vos documents sont automatiquement supprimés après génération du rapport. Ils ne sont ni conservés, ni revendus, ni partagés à des tiers à des fins commerciales. Seul le rapport d&apos;analyse est conservé dans votre espace personnel.
        </Callout>
      </Section>

      <Section id="soustraitants" icon={Server} title="5. Hébergement et sous-traitants">
        <Table
          headers={['Sous-traitant', 'Rôle', 'Localisation', 'Encadrement']}
          rows={[
            ['Supabase', 'Hébergement base de données', 'France / Europe', '—'],
            ['Vercel', 'Hébergement du site', 'Europe', '—'],
            ['Stripe', 'Paiement', '—', 'Conforme PCI-DSS'],
            ['Anthropic', 'Analyse documentaire (modèle Claude Sonnet 4)', 'États-Unis', 'Clauses contractuelles types. Les données transmises via l\u2019API ne sont pas utilisées pour l\u2019entraînement des modèles.'],
          ]} />
        <p>Tous nos sous-traitants offrent des garanties suffisantes en matière de protection des données.</p>
      </Section>

      <Section id="conservation" icon={Clock} title="6. Durée de conservation">
        <Table
          headers={['Donnée', 'Durée de conservation']}
          rows={[
            ['Données de compte', 'Tant que votre compte est actif, puis supprimées 30 jours après suppression du compte'],
            ['Documents déposés', <strong>Supprimés immédiatement après génération du rapport</strong>],
            ['Rapports générés', 'Conservés dans votre espace personnel tant que votre compte est actif'],
            ['Données de facturation', '10 ans, conformément aux obligations comptables'],
          ]} />
      </Section>

      <Section id="droits" icon={UserCheck} title="7. Vos droits">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <Table
          headers={['Droit', 'Ce que vous pouvez demander']}
          rows={[
            ['Accès', 'Obtenir une copie de vos données'],
            ['Rectification', 'Corriger des données inexactes'],
            ['Effacement', 'Supprimer votre compte et vos données'],
            ['Portabilité', 'Recevoir vos données dans un format structuré'],
            ['Opposition', "Vous opposer à certains traitements"],
            ['Limitation', 'Limiter le traitement de vos données'],
          ]} />
        <p>Pour exercer ces droits, écrivez à <a href="mailto:hello@verimo.fr">hello@verimo.fr</a>.</p>
        <Callout type="info" title="Vous pouvez aussi saisir la CNIL">
          Si notre réponse ne vous satisfait pas, vous pouvez introduire une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés — <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
        </Callout>
      </Section>

      <Section id="cookies" icon={Cookie} title="8. Cookies">
        <p>Verimo utilise uniquement des cookies techniques, strictement nécessaires au bon fonctionnement du service.</p>
        <Callout type="success" title="Pourquoi aucune bannière de consentement">
          Conformément aux recommandations de la CNIL (délibération n°2013-378 du 5 décembre 2013) et à la directive ePrivacy, les cookies strictement nécessaires au fonctionnement d&apos;un service sont exemptés de l&apos;obligation de recueil du consentement préalable. Nous n&apos;en avons donc pas l&apos;obligation légale.
        </Callout>
        <SubTitle>Cookies utilisés</SubTitle>
        <Table
          headers={['Cookie', 'Rôle']}
          rows={[
            ['Session Supabase', 'Maintient votre connexion active et sécurise l\u2019accès à votre compte. Sans ce cookie, vous seriez déconnecté à chaque page.'],
            ["Authentification", "Stocke votre token d'accès de manière sécurisée pour vous éviter de vous reconnecter à chaque visite."],
          ]} />
        <p>Ces cookies ne collectent aucune donnée à des fins publicitaires, de profilage ou de suivi comportemental. Ils ne sont jamais partagés avec des tiers.</p>
        <p>Verimo n&apos;utilise <strong>aucun</strong> cookie de tracking, analytics ou publicitaire — pas de Google Analytics, pas de Facebook Pixel, pas de publicité ciblée.</p>
        <p>Si vous souhaitez bloquer ces cookies via les paramètres de votre navigateur, vous pouvez le faire, mais le service Verimo ne pourra plus fonctionner correctement (connexion impossible).</p>
      </Section>

      <Section id="securite" icon={Lock} title="9. Sécurité">
        <p>Vos données sont protégées par des mesures techniques et organisationnelles adaptées :</p>
        <Liste items={[
          'Chiffrement des communications (HTTPS)',
          'Accès restreint aux données',
          'Authentification sécurisée',
        ]} />
      </Section>

      <Section id="contact" icon={Mail} title="10. Contact">
        <Liste items={[
          <>E-mail : <a href="mailto:hello@verimo.fr">hello@verimo.fr</a></>,
          <>Site : <a href="https://verimo.fr">https://verimo.fr</a></>,
        ]} />
        <BlocContact titre="Une question sur vos données ?" texte="Écrivez-nous à" />
      </Section>

    </LegalLayout>
  );
}
