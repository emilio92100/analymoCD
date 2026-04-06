import { Link } from 'react-router-dom';

export default function MentionsLegalesPage() {
  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 80 }}>
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '52px 24px 88px' }}>

        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#2a7d9c', textDecoration: 'none', fontWeight: 600, marginBottom: 32 }}>
          ← Retour à l'accueil
        </Link>

        <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 8, letterSpacing: '-0.025em' }}>
          Mentions légales
        </h1>
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 48 }}>Dernière mise à jour : avril 2026</p>

        {[
          {
            title: '1. Éditeur du site',
            content: `Le site verimo.fr est édité par :

Verimo
Adresse e-mail : hello@verimo.fr
Site web : https://verimo.fr

Directeur de la publication : Verimo`
          },
          {
            title: '2. Hébergement',
            content: `Le site est hébergé par :

Vercel Inc.
340 Pine Street, Suite 701
San Francisco, CA 94104, États-Unis
https://vercel.com

Les données sont stockées via :

Supabase Inc.
970 Toa Payoh North, #07-04
Singapore 318992
https://supabase.com`
          },
          {
            title: '3. Propriété intellectuelle',
            content: `L'ensemble du contenu du site verimo.fr (textes, graphismes, logotypes, icônes, images, rapports générés) est la propriété exclusive de Verimo ou de ses partenaires, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sauf autorisation écrite préalable de Verimo.

Les rapports générés par Verimo à partir des documents fournis par l'utilisateur sont destinés à un usage personnel et ne peuvent être revendus ou diffusés commercialement sans autorisation.`
          },
          {
            title: '4. Responsabilité',
            content: `Les informations contenues sur ce site sont aussi précises que possible. Verimo s'efforce de tenir son site à jour, mais ne peut être tenu responsable des erreurs, omissions ou résultats qui pourraient être obtenus par un mauvais usage des informations diffusées.

Les rapports d'analyse générés par Verimo sont établis uniquement à partir des documents fournis par l'utilisateur. Ils constituent une aide à la décision et ne remplacent pas l'avis d'un professionnel de l'immobilier, d'un notaire, d'un avocat ou d'un expert. Verimo ne saurait être tenu responsable des décisions prises sur la base de ses analyses.

Verimo ne pourra être tenu responsable des dommages directs ou indirects causés au matériel de l'utilisateur lors de l'accès au site verimo.fr.`
          },
          {
            title: '5. Données personnelles',
            content: `Le traitement de vos données personnelles est régi par notre Politique de confidentialité, accessible à l'adresse https://verimo.fr/confidentialite.

Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour exercer ces droits, contactez-nous à : hello@verimo.fr.`
          },
          {
            title: '6. Cookies',
            content: `Le site verimo.fr utilise des cookies techniques nécessaires au fonctionnement du service (authentification, session). Ces cookies ne collectent pas de données à des fins publicitaires.

En utilisant le site, vous acceptez l'utilisation de ces cookies techniques. Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités du site pourraient ne plus fonctionner correctement.`
          },
          {
            title: '7. Droit applicable et juridiction',
            content: `Les présentes mentions légales sont régies par le droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.

Pour tout litige de consommation non résolu, vous pouvez recourir à la médiation de la consommation. Le médiateur désigné est : CM2C (Centre de Médiation de la Consommation de Conciliateurs de Justice), accessible sur https://www.cm2c.net ou par courrier au 14 rue Saint-Jean 75017 Paris.`
          },
          {
            title: '8. Contact',
            content: `Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à :

E-mail : hello@verimo.fr
Site : https://verimo.fr/contact`
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f2d3d', marginBottom: 14, paddingBottom: 10, borderBottom: '1.5px solid #e2e8f0' }}>
              {section.title}
            </h2>
            <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {section.content}
            </div>
          </div>
        ))}

      </section>
    </main>
  );
}
