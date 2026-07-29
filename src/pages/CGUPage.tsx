/**
 * CGU — refonte visuelle du 29 juillet 2026
 * Texte juridique repris à l'identique. Seule la présentation change.
 *
 * ⚠️ L'ancre #retractation est CONSERVÉE (section 6) : elle est utilisée par
 * le tunnel de paiement, qui renvoie l'utilisateur vers /cgu#retractation.
 * Ne pas la renommer sans vérifier les liens sortants.
 *
 * ⚠️ Ce texte nomme « l'intelligence artificielle », contrairement à la règle
 * qui l'interdit sur les pages publiques. C'est probablement volontaire : la
 * nature automatisée du service fonde la clause de limitation de
 * responsabilité. Formulation laissée telle quelle — décision à trancher.
 */
import { useSEO } from '../hooks/useSEO';
import { LegalLayout, Section, SubTitle, Liste, Table, Callout, EnClair, BlocContact } from '../components/LegalPage';
import type { SectionRef } from '../components/LegalPage';
import { FileText, KeyRound, UserPlus, AlertTriangle, ClipboardCheck, CreditCard, Copyright, ShieldAlert, Activity, Lock, RefreshCw, X, Scale, Mail } from 'lucide-react';

const SECTIONS: SectionRef[] = [
  { id: 'presentation',   label: '1. Présentation' },
  { id: 'acces',          label: '2. Accès au service' },
  { id: 'compte',         label: '3. Création de compte' },
  { id: 'limites',        label: '4. Nature et limites' },
  { id: 'obligations',    label: '5. Vos obligations' },
  { id: 'retractation',   label: '6. Tarifs et paiement' },
  { id: 'propriete',      label: '7. Propriété intellectuelle' },
  { id: 'responsabilite', label: '8. Responsabilité' },
  { id: 'disponibilite',  label: '9. Disponibilité' },
  { id: 'donnees',        label: '10. Données personnelles' },
  { id: 'modif',          label: '11. Modification des CGU' },
  { id: 'resiliation',    label: '12. Résiliation' },
  { id: 'droit',          label: '13. Droit applicable' },
  { id: 'contact',        label: '14. Contact' },
];

export default function CGUPage() {
  useSEO({
    title: "Conditions Générales d'Utilisation — Verimo",
    description: "Conditions générales d'utilisation du service Verimo : règles d'usage, tarifs, rétractation, responsabilités et résiliation.",
    canonical: '/cgu',
  });

  return (
    <LegalLayout
      titre="Conditions Générales d'Utilisation"
      chapeau="Ce que Verimo fait, ce qu'il ne fait pas, vos droits et les nôtres. À lire avant de créer un compte."
      maj="mai 2026"
      sections={SECTIONS}>

      <EnClair points={[
        { texte: "Verimo est une aide à la décision, pas un conseil juridique, financier ou technique. Consultez un professionnel avant d'acheter.", ancre: 'limites', ancreLabel: 'Voir les limites' },
        { texte: "Un crédit non utilisé est remboursable pendant 14 jours. Une analyse lancée ne l'est plus.", ancre: 'retractation', ancreLabel: 'Voir la rétractation' },
        { texte: "Vous ne déposez que des documents dont vous avez légalement la possession.", ancre: 'obligations', ancreLabel: 'Voir vos obligations' },
        { texte: "Vous supprimez votre compte quand vous voulez, depuis votre espace personnel.", ancre: 'resiliation', ancreLabel: 'Voir la résiliation' },
      ]} />

      <Section id="presentation" icon={FileText} title="1. Présentation du service">
        <p>Verimo est un service en ligne d&apos;aide à la lecture et à la compréhension de documents immobiliers, fondé et exploité par Alexandre ROGELET (ci-après « Verimo », « nous » ou « le Prestataire »), joignable à l&apos;adresse <a href="mailto:hello@verimo.fr">hello@verimo.fr</a>.</p>
        <p>Le service est accessible à l&apos;adresse <a href="https://verimo.fr">https://verimo.fr</a> et permet à l&apos;utilisateur de soumettre des documents immobiliers (procès-verbaux d&apos;assemblée générale, règlements de copropriété, diagnostics techniques, appels de charges, compromis de vente, etc.) afin d&apos;en obtenir une analyse structurée générée par intelligence artificielle.</p>
        <p>Les présentes Conditions Générales d&apos;Utilisation (CGU) régissent l&apos;accès et l&apos;utilisation du service Verimo. En créant un compte ou en utilisant le service, l&apos;utilisateur accepte sans réserve les présentes CGU.</p>
      </Section>

      <Section id="acces" icon={KeyRound} title="2. Accès au service">
        <p>Le service Verimo est accessible à toute personne physique majeure ou personne morale disposant d&apos;un accès à Internet et ayant créé un compte utilisateur.</p>
        <p>L&apos;inscription est gratuite. Certaines fonctionnalités sont soumises à un paiement selon les tarifs en vigueur sur <a href="/tarifs">verimo.fr/tarifs</a>.</p>
        <p>Verimo se réserve le droit de refuser l&apos;accès au service, de suspendre ou de supprimer un compte en cas de violation des présentes CGU, sans préavis ni indemnité.</p>
      </Section>

      <Section id="compte" icon={UserPlus} title="3. Création de compte">
        <p>L&apos;utilisateur s&apos;engage à fournir des informations exactes, complètes et à jour lors de la création de son compte. Il est seul responsable de la confidentialité de ses identifiants de connexion.</p>
        <p>Toute utilisation du service avec ses identifiants est réputée effectuée par l&apos;utilisateur lui-même. En cas de perte, de vol ou d&apos;utilisation non autorisée de ses identifiants, l&apos;utilisateur doit en informer Verimo sans délai à l&apos;adresse <a href="mailto:hello@verimo.fr">hello@verimo.fr</a>.</p>
      </Section>

      <Section id="limites" icon={AlertTriangle} title="4. Nature et limites du service">
        <p>Verimo est un outil d&apos;aide à la décision. Les rapports générés sont produits automatiquement par un système d&apos;intelligence artificielle à partir des documents fournis par l&apos;utilisateur.</p>
        <Callout type="warning" title="Ce que les analyses Verimo ne sont pas">
          Les analyses sont données à titre purement informatif. Elles ne constituent en aucun cas un conseil juridique ou une consultation juridique, un conseil financier ou une expertise comptable, un diagnostic technique certifié, ni une garantie sur l&apos;état du bien immobilier analysé.
        </Callout>
        <p>Verimo n&apos;est pas un cabinet d&apos;expertise, de notaires, d&apos;avocats ou de conseillers financiers. L&apos;utilisateur est seul responsable des décisions qu&apos;il prend sur la base des rapports fournis par le service.</p>
        <p>Verimo recommande à l&apos;utilisateur de consulter un professionnel qualifié (notaire, avocat, expert immobilier) avant toute décision d&apos;achat immobilier.</p>
      </Section>

      <Section id="obligations" icon={ClipboardCheck} title="5. Obligations de l'utilisateur">
        <p>L&apos;utilisateur s&apos;engage à :</p>
        <Liste items={[
          'Utiliser le service conformément à sa destination et aux présentes CGU',
          <>Ne soumettre que des documents dont il est <strong>légalement en possession</strong></>,
          'Ne pas tenter de contourner les mécanismes de sécurité du service',
          "Ne pas utiliser le service à des fins illicites, frauduleuses ou contraires à l'ordre public",
          'Ne pas reproduire, revendre ou exploiter commercialement les rapports générés sans autorisation écrite préalable de Verimo',
          'Respecter les droits de propriété intellectuelle de Verimo',
        ]} />
        <p>L&apos;utilisateur garantit qu&apos;il dispose des droits nécessaires sur les documents qu&apos;il soumet à l&apos;analyse.</p>
      </Section>

      <Section id="retractation" icon={CreditCard} title="6. Tarifs et paiement">
        <p>Les tarifs du service sont indiqués en euros toutes taxes comprises (TTC) sur la page <a href="/tarifs">verimo.fr/tarifs</a>.</p>
        <p>Le paiement est effectué en ligne via Stripe, prestataire de paiement sécurisé. Verimo ne stocke aucune donnée bancaire.</p>

        <SubTitle>Droit de rétractation</SubTitle>
        <p>Conformément à l&apos;article L221-28, 13° du Code de la consommation, les contenus numériques fournis sur support immatériel dont l&apos;exécution commence avec l&apos;accord exprès du consommateur et après son renoncement exprès à son droit de rétractation ne peuvent faire l&apos;objet d&apos;une rétractation.</p>
        <p>Au moment du paiement, une case à cocher est présentée à l&apos;utilisateur pour qu&apos;il donne son accord exprès au démarrage immédiat du service et reconnaisse perdre son droit de rétractation une fois l&apos;analyse lancée. Cette validation est obligatoire pour finaliser l&apos;achat.</p>

        <SubTitle>En pratique</SubTitle>
        <Table
          headers={['Situation', 'Remboursement']}
          rows={[
            ['Crédit non utilisé — aucune analyse lancée', <><strong>Oui</strong>, dans les 14 jours suivant l&apos;achat, sur simple demande à <a href="mailto:hello@verimo.fr">hello@verimo.fr</a></>],
            ['Crédit utilisé — analyse lancée, rapport généré', <><strong>Non</strong> — le service est considéré comme exécuté</>],
          ]} />
        <Callout type="info" title="Anomalie de facturation">
          Vous disposez de <strong>30 jours</strong> pour nous signaler une anomalie, à <a href="mailto:hello@verimo.fr">hello@verimo.fr</a>.
        </Callout>
      </Section>

      <Section id="propriete" icon={Copyright} title="7. Propriété intellectuelle">
        <p>L&apos;ensemble des éléments constituant le service Verimo (interface, logo, textes, rapports générés, algorithmes) est protégé par les dispositions du Code de la propriété intellectuelle.</p>
        <p>Toute reproduction, représentation, modification ou exploitation non autorisée de ces éléments est interdite et constitue une contrefaçon sanctionnée par la loi.</p>
        <p>Les rapports générés par Verimo à partir des documents de l&apos;utilisateur sont mis à sa disposition pour un usage personnel et non commercial. Ils ne peuvent être revendus ou utilisés à des fins commerciales sans autorisation préalable.</p>
      </Section>

      <Section id="responsabilite" icon={ShieldAlert} title="8. Responsabilité">
        <p>Verimo s&apos;engage à mettre en œuvre tous les moyens raisonnables pour assurer la disponibilité et la qualité du service. Toutefois, Verimo ne peut garantir :</p>
        <Liste items={[
          "L'exactitude, l'exhaustivité ou la pertinence des analyses générées",
          'La disponibilité continue et ininterrompue du service',
          "L'absence d'erreurs dans les rapports produits par intelligence artificielle",
        ]} />
        <SubTitle>Cas d&apos;exclusion</SubTitle>
        <p>La responsabilité de Verimo ne saurait être engagée en cas de :</p>
        <Liste items={[
          "Décision prise par l'utilisateur sur la base d'un rapport Verimo",
          "Erreur ou omission dans l'analyse d'un document",
          'Interruption temporaire du service pour maintenance',
          'Force majeure au sens de l\u2019article 1218 du Code civil',
        ]} />
        <Callout type="warning" title="Plafond de responsabilité">
          En tout état de cause, la responsabilité de Verimo est limitée au montant des sommes effectivement payées par l&apos;utilisateur au cours des <strong>12 derniers mois</strong>.
        </Callout>
      </Section>

      <Section id="disponibilite" icon={Activity} title="9. Disponibilité et maintenance">
        <p>Verimo s&apos;efforce d&apos;assurer la disponibilité du service 24 h/24 et 7 j/7. Des interruptions pour maintenance peuvent survenir et seront, dans la mesure du possible, communiquées à l&apos;avance.</p>
        <p>Verimo se réserve le droit de faire évoluer, modifier ou interrompre tout ou partie du service à tout moment, sans obligation d&apos;en informer préalablement les utilisateurs.</p>
      </Section>

      <Section id="donnees" icon={Lock} title="10. Données personnelles">
        <p>Le traitement des données personnelles des utilisateurs est régi par notre <a href="/confidentialite">politique de confidentialité</a>.</p>
        <p>Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n°78-17 du 6 janvier 1978 modifiée, l&apos;utilisateur dispose de droits d&apos;accès, de rectification, d&apos;effacement et de portabilité sur ses données, exerçables à l&apos;adresse <a href="mailto:hello@verimo.fr">hello@verimo.fr</a>.</p>
      </Section>

      <Section id="modif" icon={RefreshCw} title="11. Modification des CGU">
        <p>Verimo se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet dès leur publication sur le site.</p>
        <p>L&apos;utilisateur sera informé des modifications substantielles par e-mail ou par notification dans l&apos;application. La poursuite de l&apos;utilisation du service après notification vaut acceptation des nouvelles CGU.</p>
      </Section>

      <Section id="resiliation" icon={X} title="12. Résiliation">
        <p>L&apos;utilisateur peut supprimer son compte à tout moment depuis les paramètres de son espace personnel.</p>
        <Callout type="warning" title="La suppression est définitive">
          Supprimer votre compte entraîne la <strong>perte définitive</strong> des analyses et rapports stockés.
        </Callout>
        <p>Verimo peut suspendre ou résilier un compte en cas de violation des présentes CGU, de comportement frauduleux ou d&apos;utilisation abusive du service, sans préavis ni remboursement des crédits non utilisés en cas de faute grave.</p>
      </Section>

      <Section id="droit" icon={Scale} title="13. Droit applicable et juridiction">
        <p>Les présentes CGU sont soumises au droit français.</p>
        <p>En cas de litige relatif à l&apos;interprétation ou à l&apos;exécution des présentes CGU, les parties s&apos;engagent à rechercher une solution amiable avant tout recours judiciaire.</p>
        <p>Conformément aux articles L.612-1 et suivants du Code de la consommation, l&apos;utilisateur consommateur peut recourir <strong>gratuitement</strong> à un médiateur de la consommation — coordonnées dans nos <a href="/mentions-legales#droit">mentions légales</a>.</p>
        <p>À défaut de résolution amiable, tout litige sera soumis à la compétence exclusive des tribunaux français compétents.</p>
      </Section>

      <Section id="contact" icon={Mail} title="14. Contact">
        <Liste items={[
          <>E-mail : <a href="mailto:hello@verimo.fr">hello@verimo.fr</a></>,
          <>Site : <a href="https://verimo.fr">https://verimo.fr</a></>,
        ]} />
        <BlocContact titre="Une question sur nos conditions ?" texte="Écrivez-nous à" />
      </Section>

    </LegalLayout>
  );
}
