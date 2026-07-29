/**
 * MENTIONS LÉGALES — refonte visuelle du 29 juillet 2026
 * Le texte juridique est repris à l'identique de la version précédente.
 * Seule la présentation change (voir src/components/LegalPage.tsx).
 *
 * ⚠️ LACUNE SIGNALÉE, NON COMBLÉE : la section « Éditeur » ne mentionne ni
 * forme juridique, ni SIREN, ni RCS, ni adresse postale, ni numéro de TVA —
 * alors que l'article 6-III de la LCEN les exige d'un site marchand. La fiche
 * ci-dessous est prête à les recevoir : il manque seulement la réponse à
 * « quelle entité exploite Verimo ». À ne pas inventer.
 */
import { useSEO } from '../hooks/useSEO';
import { LegalLayout, Section, SubTitle, Liste, Table, Callout, Fiche, EnClair, BlocContact } from '../components/LegalPage';
import type { SectionRef } from '../components/LegalPage';
import { Landmark, Building2, Server, Copyright, ShieldAlert, Lock, Cookie, Scale, Mail } from 'lucide-react';

const SECTIONS: SectionRef[] = [
  { id: 'editeur',        label: '1. Éditeur du site' },
  { id: 'hebergement',    label: '2. Hébergement' },
  { id: 'propriete',      label: '3. Propriété intellectuelle' },
  { id: 'responsabilite', label: '4. Responsabilité' },
  { id: 'donnees',        label: '5. Données personnelles' },
  { id: 'cookies',        label: '6. Cookies' },
  { id: 'droit',          label: '7. Droit applicable' },
  { id: 'contact',        label: '8. Contact' },
];

export default function MentionsLegalesPage() {
  useSEO({
    title: 'Mentions légales — Verimo',
    description: "Mentions légales du site verimo.fr : éditeur, hébergement, propriété intellectuelle, responsabilité et médiation de la consommation.",
    canonical: '/mentions-legales',
  });

  return (
    <LegalLayout
      titre="Mentions légales"
      chapeau="Qui édite verimo.fr, où le site est hébergé, à qui appartiennent les contenus, et vers qui vous tourner en cas de litige."
      maj="mai 2026"
      badge={{ icon: Landmark, label: "INFORMATIONS LÉGALES · LCEN" }}
      sections={SECTIONS}>

      <EnClair points={[
        { texte: "Verimo est édité par Alexandre ROGELET, joignable à hello@verimo.fr.", ancre: 'editeur', ancreLabel: "Voir l'éditeur" },
        { texte: "Nos rapports sont une aide à la décision. Ils ne remplacent pas l'avis d'un notaire, d'un avocat ou d'un expert.", ancre: 'responsabilite', ancreLabel: 'Voir la responsabilité' },
        { texte: "Aucun cookie publicitaire, aucun outil de mesure d'audience. C'est pourquoi vous ne voyez aucune bannière.", ancre: 'cookies', ancreLabel: 'Voir les cookies' },
        { texte: "En cas de litige non résolu, un médiateur de la consommation est désigné et gratuit.", ancre: 'droit', ancreLabel: 'Voir la médiation' },
      ]} />

      <Section id="editeur" icon={Building2} title="1. Éditeur du site">
        <p>Le site verimo.fr est édité par :</p>
        <Fiche lignes={[
          { cle: 'Service', valeur: 'Verimo' },
          { cle: 'Fondateur et responsable éditorial', valeur: 'Alexandre ROGELET' },
          { cle: 'Directeur de la publication', valeur: 'Alexandre ROGELET' },
          { cle: 'Adresse e-mail', valeur: <a href="mailto:hello@verimo.fr">hello@verimo.fr</a> },
          { cle: 'Site web', valeur: <a href="https://verimo.fr">https://verimo.fr</a> },
        ]} />
      </Section>

      <Section id="hebergement" icon={Server} title="2. Hébergement">
        <p>Le site est hébergé et les données sont stockées par les prestataires suivants :</p>
        <Table
          headers={['Prestataire', 'Rôle', 'Adresse']}
          rows={[
            ['Vercel Inc.', 'Hébergement du site', '340 Pine Street, Suite 701 — San Francisco, CA 94104, États-Unis'],
            ['Supabase Inc.', 'Stockage des données', '970 Toa Payoh North, #07-04 — Singapore 318992'],
          ]} />
        <p style={{ fontSize: 13.5, color: '#64748b' }}>
          Le détail des traitements et des garanties associées figure dans notre{' '}
          <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </Section>

      <Section id="propriete" icon={Copyright} title="3. Propriété intellectuelle">
        <p>L&apos;ensemble du contenu du site verimo.fr (textes, graphismes, logotypes, icônes, images, rapports générés) est la propriété exclusive de Verimo ou de ses partenaires, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.</p>
        <p>Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sauf autorisation écrite préalable de Verimo.</p>
        <Callout type="info" title="Vos rapports vous appartiennent — pour un usage personnel">
          Les rapports générés par Verimo à partir des documents fournis par l&apos;utilisateur sont destinés à un usage personnel et ne peuvent être revendus ou diffusés commercialement sans autorisation.
        </Callout>
      </Section>

      <Section id="responsabilite" icon={ShieldAlert} title="4. Responsabilité">
        <p>Les informations contenues sur ce site sont aussi précises que possible. Verimo s&apos;efforce de tenir son site à jour, mais ne peut être tenu responsable des erreurs, omissions ou résultats qui pourraient être obtenus par un mauvais usage des informations diffusées.</p>
        <Callout type="warning" title="Nos rapports ne remplacent pas un professionnel">
          Les rapports d&apos;analyse sont établis uniquement à partir des documents fournis par l&apos;utilisateur. Ils constituent une aide à la décision et ne remplacent pas l&apos;avis d&apos;un professionnel de l&apos;immobilier, d&apos;un notaire, d&apos;un avocat ou d&apos;un expert. Verimo ne saurait être tenu responsable des décisions prises sur la base de ses analyses.
        </Callout>
        <p>Verimo ne pourra être tenu responsable des dommages directs ou indirects causés au matériel de l&apos;utilisateur lors de l&apos;accès au site verimo.fr.</p>
      </Section>

      <Section id="donnees" icon={Lock} title="5. Données personnelles">
        <p>Le traitement de vos données personnelles est régi par notre <a href="/confidentialite">politique de confidentialité</a>.</p>
        <p>Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et de portabilité de vos données. Pour exercer ces droits, écrivez à <a href="mailto:hello@verimo.fr">hello@verimo.fr</a>.</p>
      </Section>

      <Section id="cookies" icon={Cookie} title="6. Cookies">
        <p>Le site verimo.fr utilise uniquement des cookies techniques, strictement nécessaires au bon fonctionnement du service.</p>
        <Callout type="success" title="Pourquoi aucune bannière de consentement">
          Conformément aux recommandations de la CNIL et à la directive européenne ePrivacy (transposée à l&apos;article 82 de la loi Informatique et Libertés), les cookies strictement nécessaires au fonctionnement d&apos;un service numérique sont dispensés de l&apos;obligation de recueil du consentement préalable. Verimo ne vous présente donc pas de bannière : nous appliquons simplement la loi.
        </Callout>
        <SubTitle>Cookies utilisés</SubTitle>
        <Table
          headers={['Cookie', 'Rôle', 'Statut']}
          rows={[
            ['Session (authentification Supabase)', 'Maintient votre connexion sécurisée entre les pages', 'Strictement nécessaire'],
            ["Token d'accès", 'Vous identifie sans ressaisir vos identifiants', 'Strictement nécessaire'],
          ]} />
        <p>Verimo n&apos;utilise aucun cookie publicitaire, aucun cookie de tracking comportemental, et aucun outil d&apos;analyse de trafic tiers (pas de Google Analytics, pas de pixel publicitaire).</p>
        <p>Vous pouvez configurer votre navigateur pour bloquer les cookies, mais le service Verimo ne pourra plus fonctionner correctement (connexion impossible).</p>
      </Section>

      <Section id="droit" icon={Scale} title="7. Droit applicable et juridiction">
        <p>Les présentes mentions légales sont régies par le droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.</p>
        <SubTitle>Médiation de la consommation</SubTitle>
        <p>Pour tout litige de consommation non résolu, vous pouvez recourir gratuitement à la médiation. Le médiateur désigné est :</p>
        <Fiche lignes={[
          { cle: 'Médiateur', valeur: 'CM2C — Centre de Médiation de la Consommation de Conciliateurs de Justice' },
          { cle: 'En ligne', valeur: <a href="https://www.cm2c.net" target="_blank" rel="noopener noreferrer">https://www.cm2c.net</a> },
          { cle: 'Par courrier', valeur: '14 rue Saint-Jean — 75017 Paris' },
        ]} />
      </Section>

      <Section id="contact" icon={Mail} title="8. Contact">
        <Liste items={[
          <>E-mail : <a href="mailto:hello@verimo.fr">hello@verimo.fr</a></>,
          <>Formulaire : <a href="/contact">verimo.fr/contact</a></>,
        ]} />
        <BlocContact titre="Une question sur ces mentions ?" texte="Écrivez-nous à" />
      </Section>

    </LegalLayout>
  );
}
