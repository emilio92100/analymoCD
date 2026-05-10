import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import { Building2, FileText, CreditCard, RefreshCw, X, Repeat, Shield, Mail, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';

// Sections du sommaire (utilisées pour le scroll spy + rendu)
const SECTIONS = [
  { id: 'objet', label: '1. Objet' },
  { id: 'definitions', label: '2. Définitions' },
  { id: 'inscription', label: '3. Inscription' },
  { id: 'tarifs', label: '4. Tarifs et facturation' },
  { id: 'credits', label: '5. Crédits et cumul' },
  { id: 'upgrade', label: '6. Upgrade / Downgrade' },
  { id: 'resiliation', label: '7. Résiliation' },
  { id: 'retractation', label: '8. Rétractation' },
  { id: 'donnees', label: '9. Données' },
  { id: 'ip', label: '10. Propriété intellectuelle' },
  { id: 'responsabilite', label: '11. Responsabilité' },
  { id: 'modif', label: '12. Modification CGV' },
  { id: 'litige', label: '13. Litiges' },
  { id: 'contact', label: '14. Contact' },
];

export default function CGVProPage() {
  useSEO({
    title: 'CGV Pro — Verimo',
    description: "Conditions générales de vente Verimo Pro : abonnements, achats unitaires, résiliation, données et obligations.",
    canonical: '/cgv-pro',
  });

  // ─── Scroll spy : track la section visible pour le sommaire ───
  const [activeSection, setActiveSection] = useState<string>('objet');

  useEffect(() => {
    const handleScroll = () => {
      // Décalage = offset du sticky topbar + un peu de marge pour activer
      // la section dès qu'elle approche du haut du viewport
      const triggerY = 180;
      // On parcourt les sections du bas vers le haut et on prend la première
      // dont le top est passé sous triggerY
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(SECTIONS[i].id);
        if (el && el.getBoundingClientRect().top <= triggerY) {
          setActiveSection(SECTIONS[i].id);
          return;
        }
      }
      setActiveSection(SECTIONS[0].id);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Palette pro distincte ───
  const PRO_DARK = '#0f2d3d';
  const PRO_ACCENT = '#2a7d9c';
  const PRO_LIGHT = '#7dd3fc';
  const PRO_BG = '#f0f7fb';

  // ─── Données réelles depuis le code Verimo ───
  const PLANS = [
    { id: 'decouverte', name: 'Découverte', priceHt: '19,90', priceTtc: '23,88', completes: 1, simples: 3, tagline: 'Pour démarrer' },
    { id: 'starter', name: 'Starter', priceHt: '49,90', priceTtc: '59,88', completes: 5, simples: 15, tagline: 'Pour un usage régulier', popular: true },
    { id: 'power', name: 'Power', priceHt: '89,90', priceTtc: '107,88', completes: 10, simples: 30, tagline: 'Pour un usage soutenu' },
  ];

  const UNITS_PRO = [
    { label: "Analyse complète d'un bien", priceHt: '9,90', priceTtc: '11,88' },
    { label: "Analyse simple d'un document", priceHt: '2,90', priceTtc: '3,48' },
  ];

  const UNITS_PARTICULIER = [
    { label: 'Analyse simple', price: '4,90' },
    { label: 'Analyse complète', price: '19,90' },
    { label: 'Pack 2 biens', price: '29,90' },
    { label: 'Pack 3 biens', price: '39,90' },
  ];

  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 80, minHeight: '100vh' }}>
      {/* ─── Hero avec badge B2B distinct ─── */}
      <section style={{ background: `linear-gradient(135deg, ${PRO_DARK} 0%, ${PRO_ACCENT} 100%)`, padding: '64px 24px 80px', borderBottom: `4px solid ${PRO_LIGHT}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.85)', textDecoration: 'none', fontWeight: 600 }}>
              ← Retour à l'accueil
            </Link>
          </div>

          {/* Badge B2B */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(125,211,250,0.18)', border: '1.5px solid rgba(125,211,250,0.4)', marginBottom: 18 }}>
            <Building2 size={14} style={{ color: PRO_LIGHT }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: PRO_LIGHT, letterSpacing: '0.12em' }}>DOCUMENT PROFESSIONNEL · B2B</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: '#fff', marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            Conditions Générales de Vente — Pro
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', maxWidth: 760, lineHeight: 1.6 }}>
            Document applicable aux agents immobiliers, mandataires, agences, cabinets et autres professionnels du secteur immobilier souscrivant à l'offre Verimo Pro.
          </p>
          <div style={{ marginTop: 22, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
            <span>Dernière mise à jour : mai 2026</span>
            <span>·</span>
            <span>Version 2.3</span>
          </div>
        </div>
      </section>

      {/* ─── Sommaire + Contenu ─── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 88px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 260px) 1fr', gap: 48, alignItems: 'start' }}>

          {/* Sommaire sticky */}
          <aside style={{ position: 'sticky', top: 100 }} className="cgv-pro-sidebar">
            <div style={{ padding: 18, borderRadius: 14, background: '#fff', border: `1.5px solid ${PRO_BG}`, boxShadow: '0 1px 4px rgba(15,45,61,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: PRO_ACCENT, letterSpacing: '0.12em', marginBottom: 14 }}>SOMMAIRE</div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SECTIONS.map(s => {
                  const isActive = activeSection === s.id;
                  return (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      style={{
                        padding: '8px 10px',
                        paddingLeft: isActive ? 12 : 10,
                        fontSize: 13,
                        color: isActive ? PRO_DARK : '#475569',
                        textDecoration: 'none',
                        borderRadius: 7,
                        borderLeft: isActive ? `3px solid ${PRO_ACCENT}` : '3px solid transparent',
                        background: isActive ? PRO_BG : 'transparent',
                        fontWeight: isActive ? 800 : 500,
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = PRO_BG;
                          (e.currentTarget as HTMLElement).style.color = PRO_DARK;
                        }
                      }}
                      onMouseOut={e => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = '#475569';
                        }
                      }}>
                      {s.label}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Doc lié */}
            <div style={{ marginTop: 14, padding: 16, borderRadius: 12, background: PRO_BG, border: `1px solid ${PRO_LIGHT}50` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: PRO_ACCENT, letterSpacing: '0.1em', marginBottom: 6 }}>VOIR AUSSI</div>
              <Link to="/cgu" style={{ fontSize: 13, color: PRO_DARK, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                CGU générales (particuliers) <ChevronRight size={14} />
              </Link>
              <Link to="/confidentialite" style={{ fontSize: 13, color: PRO_DARK, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                Politique de confidentialité <ChevronRight size={14} />
              </Link>
              <Link to="/mentions-legales" style={{ fontSize: 13, color: PRO_DARK, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                Mentions légales <ChevronRight size={14} />
              </Link>
            </div>
          </aside>

          {/* Contenu principal */}
          <div>

            {/* ─── Section 1 : Objet ─── */}
            <Section id="objet" icon={FileText} title="1. Objet du contrat">
              <p>Les présentes Conditions Générales de Vente Pro (ci-après « <strong>CGV Pro</strong> ») régissent l'utilisation du service Verimo Pro par tout professionnel du secteur immobilier (agent immobilier, mandataire indépendant, agence, cabinet, conseiller, expert, etc.) souscrivant à l'offre dédiée aux professionnels.</p>
              <p>Verimo Pro est un service en ligne (SaaS) d'analyse automatisée de documents immobiliers (procès-verbaux d'assemblée générale, règlements de copropriété, diagnostics, etc.) générant des rapports synthétiques et scorés à destination des professionnels et de leurs clients.</p>
              <p>L'acceptation des présentes CGV est obligatoire lors de la souscription. Cette acceptation est tracée et conservée à des fins probatoires.</p>
            </Section>

            {/* ─── Section 2 : Définitions ─── */}
            <Section id="definitions" icon={FileText} title="2. Définitions">
              <Table headers={['Terme', 'Définition']} rows={[
                ['Verimo', 'Le service édité par VERIMO APP, accessible sur verimo.fr. Responsable : Alexandre ROGELET.'],
                ['Pro / Client Pro', 'Toute personne morale ou physique exerçant une activité professionnelle dans l\'immobilier et ayant souscrit à un abonnement Verimo Pro.'],
                ['Abonnement', 'Forfait mensuel permettant l\'accès au service avec un volume de crédits inclus.'],
                ['Crédit complet', 'Permet de lancer une analyse complète d\'un bien (jusqu\'à 15 documents).'],
                ['Crédit simple', 'Permet de lancer une analyse simple d\'un document immobilier (1 PDF).'],
                ['Achat unitaire', 'Achat ponctuel de crédits supplémentaires en dehors du forfait mensuel, réservé aux abonnés Pro.'],
                ['Cycle de facturation', 'Période d\'un mois calendaire entre deux dates de prélèvement.'],
              ]} />
            </Section>

            {/* ─── Section 3 : Inscription ─── */}
            <Section id="inscription" icon={Building2} title="3. Inscription et accès au service">
              <p>L'inscription au service Verimo Pro s'effectue exclusivement en ligne via le site verimo.fr, dans la section dédiée aux professionnels.</p>
              <p>Lors de l'inscription, le Pro fournit les informations professionnelles suivantes :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Nom, prénom et email professionnel</li>
                <li>Type de profil (agent immobilier, mandataire indépendant, agence, etc.)</li>
                <li>Numéro SIRET (recommandé pour la facturation)</li>
                <li>Raison sociale et adresse de facturation</li>
                <li>Numéro de TVA intracommunautaire (si applicable)</li>
              </ul>
              <p>Le Pro garantit l'exactitude des informations fournies et s'engage à les mettre à jour en cas de changement (rubrique « Mon compte » du dashboard).</p>
              <p>L'accès au service est immédiat dès validation du paiement.</p>
            </Section>

            {/* ─── Section 4 : Tarifs ─── */}
            <Section id="tarifs" icon={CreditCard} title="4. Tarifs et facturation">
              <SubTitle>4.1 — Abonnements mensuels</SubTitle>
              <p>Trois formules d'abonnement sont proposées. Les prix sont indiqués <strong>hors taxes (HT)</strong>, la TVA française au taux normal (20%) s'applique en sus.</p>

              <PlansTable plans={PLANS} accent={PRO_ACCENT} dark={PRO_DARK} light={PRO_LIGHT} />

              <SubTitle>4.2 — Achats unitaires (réservés aux abonnés Pro)</SubTitle>
              <p>Tout Pro disposant d'un abonnement actif peut acheter des crédits supplémentaires à l'unité, à un <strong>tarif privilégié</strong> :</p>

              <UnitsTableCompare unitsPro={UNITS_PRO} unitsPart={UNITS_PARTICULIER} accent={PRO_ACCENT} />

              <Callout type="info" title="Tarif privilégié pour les Pros">
                Les tarifs unitaires Pro sont sensiblement inférieurs aux tarifs particuliers. Cet avantage est réservé exclusivement aux titulaires d'un abonnement Verimo Pro actif. Si l'abonnement est résilié, le Pro ne peut plus accéder aux tarifs unitaires.
              </Callout>

              <SubTitle>4.3 — Modalités de paiement</SubTitle>
              <p>Le paiement s'effectue en ligne par carte bancaire via notre prestataire de paiement Stripe (sécurisé PCI-DSS). Verimo ne stocke aucune donnée bancaire.</p>
              <p>L'abonnement est prélevé automatiquement chaque mois à la date d'anniversaire de la souscription. Une facture PDF est générée et accessible dans le dashboard pro après chaque paiement.</p>

              <SubTitle>4.4 — Échec de paiement</SubTitle>
              <p>En cas d'échec de paiement (carte expirée, fonds insuffisants, etc.) :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Stripe tente automatiquement de relancer le paiement à plusieurs reprises pendant 7 jours</li>
                <li>Le Pro reçoit une notification immédiate dans son dashboard et par email</li>
                <li>L'accès au service est maintenu pendant cette période de relance</li>
                <li>Sans régularisation au terme de cette période, l'abonnement est suspendu automatiquement</li>
              </ul>
            </Section>

            {/* ─── Section 5 : Crédits ─── */}
            <Section id="credits" icon={Repeat} title="5. Crédits et cumul">
              <SubTitle>5.1 — Attribution des crédits</SubTitle>
              <p>Les crédits inclus dans l'abonnement sont attribués au début de chaque cycle de facturation. Ils se composent de deux types distincts :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li><strong>Crédits complets</strong> : pour analyser un bien (jusqu'à 15 documents simultanés)</li>
                <li><strong>Crédits simples</strong> : pour analyser un document immobilier (1 PDF)</li>
              </ul>
              <p>Les deux types de crédits sont indépendants et ne sont pas convertibles entre eux.</p>

              <SubTitle>5.2 — Règle de cumul</SubTitle>
              <Callout type="success" title="Vos crédits non utilisés sont reportés">
                Les crédits non consommés en fin de cycle sont automatiquement reportés sur le cycle suivant, dans la limite d'un cumul maximal de <strong>2 mois consécutifs (plafond 2×)</strong>.
              </Callout>

              <p>Exemple concret avec un abonnement Starter (5 complets / 15 simples par mois) :</p>
              <Table headers={['Cycle', 'Crédits utilisés', 'Crédits reportés', 'Solde cumulé']} rows={[
                ['Mois 1', '0', '5 complets / 15 simples', '5 / 15'],
                ['Mois 2', '0', '5 complets / 15 simples', '10 / 30 (plafond atteint)'],
                ['Mois 3', '0', 'Plafond 2× — pas de cumul supplémentaire', '10 / 30 (inchangé)'],
                ['Mois 4', '3 complets / 5 simples', 'Cumul reprend', '12 / 40'],
              ]} />

              <SubTitle>5.3 — Ordre de consommation</SubTitle>
              <p>Lors d'une analyse, les crédits sont consommés dans l'ordre suivant :</p>
              <ol style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Crédits du forfait mensuel (en priorité)</li>
                <li>Crédits achetés à l'unité (en complément)</li>
              </ol>
              <p>Cette logique permet de profiter pleinement du forfait avant d'entamer les crédits unitaires.</p>

              <SubTitle>5.4 — Crédits achetés à l'unité</SubTitle>
              <p>Les crédits achetés à l'unité <strong>n'ont pas de date d'expiration tant que l'abonnement reste actif</strong>. Ils restent disponibles indépendamment du cycle de facturation.</p>
              <p>En cas de résiliation de l'abonnement, les crédits unitaires restants sont conservés jusqu'à la fin du cycle en cours, puis perdus.</p>
            </Section>

            {/* ─── Section 6 : Upgrade / Downgrade ─── */}
            <Section id="upgrade" icon={RefreshCw} title="6. Upgrade et Downgrade">
              <SubTitle>6.1 — Upgrade (passage à un plan supérieur)</SubTitle>
              <p>L'upgrade vers un plan supérieur (ex : Découverte → Starter, Starter → Power) est <strong>immédiat</strong>. Il prend effet dès la validation du paiement :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Le Pro est facturé immédiatement de la différence au prorata du temps restant dans le cycle</li>
                <li>Les crédits supplémentaires du nouveau plan sont ajoutés et cumulés aux crédits déjà disponibles</li>
                <li>Le cycle de facturation est recalibré sur la nouvelle date d'upgrade</li>
              </ul>

              <SubTitle>6.2 — Downgrade (passage à un plan inférieur)</SubTitle>
              <p>Le downgrade vers un plan inférieur (ex : Power → Starter, Starter → Découverte) prend effet <strong>à la fin du cycle de facturation en cours</strong>, jamais immédiatement.</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Un bandeau « Bascule programmée » est affiché dans le dashboard avec la date de prise d'effet</li>
                <li>Aucun remboursement au prorata n'est effectué</li>
                <li>Le Pro conserve l'accès complet à son plan actuel jusqu'à la date de bascule</li>
                <li>Les crédits non utilisés sont reportés sur le nouveau plan (dans la limite du plafond 2×)</li>
                <li>Le downgrade programmé peut être annulé à tout moment avant la date de bascule</li>
              </ul>

              <Callout type="warning" title="Asymétrie volontaire">
                L'upgrade est immédiat (vous bénéficiez tout de suite des nouveaux avantages), le downgrade est différé (vous ne perdez rien avant la fin du cycle déjà payé). Cette logique garantit une transparence totale sur ce que vous payez.
              </Callout>
            </Section>

            {/* ─── Section 7 : Résiliation ─── */}
            <Section id="resiliation" icon={X} title="7. Résiliation">
              <SubTitle>7.1 — Résiliation à l'initiative du Pro</SubTitle>
              <p>Le Pro peut résilier son abonnement à tout moment depuis son dashboard, sans préavis ni pénalité, via la rubrique « Mon abonnement ».</p>
              <p>La résiliation prend effet <strong>à la fin du cycle de facturation en cours</strong> :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>L'accès au service est maintenu jusqu'à la date de fin du cycle</li>
                <li>Aucun remboursement au prorata n'est effectué pour la période non utilisée</li>
                <li>Les crédits non utilisés sont perdus à l'issue du cycle</li>
                <li>La résiliation peut être annulée à tout moment avant la date de fin (réactivation)</li>
              </ul>

              <SubTitle>7.2 — Suspension pour défaut de paiement</SubTitle>
              <p>En cas de non-paiement après les 4 tentatives automatiques de relance (sur 7 jours), l'abonnement est suspendu :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>L'accès au service est immédiatement coupé</li>
                <li>Les données et l'historique sont conservés pendant 30 jours</li>
                <li>Au-delà, le compte peut être supprimé après notification</li>
              </ul>

              <SubTitle>7.3 — Résiliation pour faute</SubTitle>
              <p>Verimo se réserve le droit de suspendre ou résilier sans préavis ni remboursement tout compte en cas de :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Utilisation frauduleuse ou abusive du service</li>
                <li>Tentative de contournement des limitations techniques</li>
                <li>Partage non autorisé des identifiants avec des tiers</li>
                <li>Diffusion ou revente non autorisée des rapports générés</li>
                <li>Tout comportement portant atteinte à Verimo ou à d'autres utilisateurs</li>
              </ul>
            </Section>

            {/* ─── Section 8 : Rétractation ─── */}
            <Section id="retractation" icon={AlertTriangle} title="8. Droit de rétractation">
              <Callout type="warning" title="Pas de droit de rétractation pour les Pros">
                Conformément au droit français, le droit de rétractation de 14 jours prévu aux articles L221-18 et suivants du Code de la consommation <strong>ne s'applique pas</strong> aux contrats conclus à distance entre professionnels.
              </Callout>

              <p>L'article L221-3 du Code de la consommation, qui étend certaines protections du Code de la consommation aux petits professionnels (moins de 5 salariés), s'applique <strong>uniquement aux contrats conclus hors établissement</strong> (démarchage à domicile, foires, salons), et non aux contrats conclus à distance via internet.</p>
              <p>Verimo Pro étant un service souscrit en ligne sur verimo.fr (contrat à distance B2B), aucun droit de rétractation légal ne s'applique à la souscription, aux renouvellements, aux upgrades ou aux achats unitaires.</p>
              <p>Le Pro peut néanmoins résilier son abonnement à tout moment, dans les conditions prévues à l'article 7 des présentes CGV.</p>

              <SubTitle>8.1 — Geste commercial</SubTitle>
              <p>Verimo se réserve la possibilité d'accorder, au cas par cas et sans obligation, un remboursement à titre commercial en cas d'erreur manifeste, de problème technique imputable au service ou de demande justifiée formulée dans les premiers jours suivant la souscription. Toute demande doit être adressée à <strong>pro@verimo.fr</strong>.</p>
            </Section>

            {/* ─── Section 9 : Données ─── */}
            <Section id="donnees" icon={Shield} title="9. Données personnelles et confidentialité">
              <p>Le traitement des données personnelles est régi par notre <Link to="/confidentialite" style={{ color: PRO_ACCENT, textDecoration: 'underline', fontWeight: 600 }}>Politique de confidentialité</Link> et par le Règlement Général sur la Protection des Données (RGPD).</p>

              <SubTitle>9.1 — Données traitées</SubTitle>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li><strong>Données du Pro</strong> : nom, prénom, email professionnel, raison sociale, SIRET, adresse de facturation</li>
                <li><strong>Données des analyses</strong> : documents PDF uploadés et rapports générés</li>
                <li><strong>Données des destinataires de rapports</strong> : nom et email des acheteurs / vendeurs renseignés par le Pro lors d'un envoi de rapport</li>
              </ul>

              <SubTitle>9.2 — Confidentialité des documents</SubTitle>
              <p>Les documents uploadés par le Pro et les rapports générés sont strictement confidentiels. Verimo s'engage à :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Ne pas accéder au contenu des documents en dehors du traitement automatisé d'analyse</li>
                <li>Ne pas partager les données avec des tiers (hors prestataires techniques nécessaires)</li>
                <li>Conserver les données pendant la durée de l'abonnement + 30 jours après résiliation</li>
                <li>Permettre l'export et la suppression des données sur simple demande à pro@verimo.fr</li>
              </ul>

              <SubTitle>9.3 — Sous-traitants</SubTitle>
              <p>Verimo s'appuie sur les prestataires suivants, soumis à des engagements de confidentialité :</p>
              <Table headers={['Prestataire', 'Rôle', 'Localisation']} rows={[
                ['Supabase', 'Hébergement base de données et stockage fichiers', 'Singapour / UE'],
                ['Vercel', 'Hébergement frontend', 'États-Unis'],
                ['Stripe', 'Traitement des paiements', 'Irlande / UE'],
                ['Anthropic', 'Moteur d\'analyse', 'États-Unis'],
                ['Mailjet', 'Envoi d\'emails transactionnels', 'France'],
              ]} />
            </Section>

            {/* ─── Section 10 : Propriété intellectuelle ─── */}
            <Section id="ip" icon={FileText} title="10. Propriété intellectuelle">
              <SubTitle>10.1 — Sur les éléments Verimo</SubTitle>
              <p>L'ensemble des éléments du service Verimo (interface, logo, textes, algorithmes, méthodologie d'analyse, format des rapports) est la propriété exclusive de Verimo et est protégé par les dispositions du Code de la propriété intellectuelle.</p>
              <p>Toute reproduction, modification, exploitation ou diffusion non autorisée constitue une contrefaçon sanctionnée par la loi.</p>

              <SubTitle>10.2 — Sur les rapports générés</SubTitle>
              <p>Les rapports d'analyse générés à partir des documents du Pro lui sont concédés pour :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Un usage professionnel dans le cadre de son activité (conseil client, dossier de vente, etc.)</li>
                <li>Une transmission aux clients du Pro (acheteurs, vendeurs) via la fonctionnalité d'envoi intégrée</li>
                <li>Un usage interne au sein de l'agence ou cabinet du Pro</li>
              </ul>
              <p>Les rapports ne peuvent en revanche pas :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Être revendus en tant que tels à des tiers en dehors du contexte d'une transaction immobilière</li>
                <li>Être utilisés pour créer un service concurrent à Verimo</li>
                <li>Être diffusés publiquement sans le branding Verimo</li>
              </ul>

              <SubTitle>10.3 — Sur les documents fournis par le Pro</SubTitle>
              <p>Le Pro garantit qu'il dispose des autorisations nécessaires pour soumettre les documents à analyse. Verimo ne saurait être tenu responsable d'une utilisation non conforme de documents par le Pro.</p>
            </Section>

            {/* ─── Section 11 : Responsabilité ─── */}
            <Section id="responsabilite" icon={Shield} title="11. Responsabilité">
              <SubTitle>11.1 — Engagement Verimo</SubTitle>
              <p>Verimo met tout en œuvre pour fournir un service fiable, sécurisé et disponible 24/7. Néanmoins, en raison de la nature de l'activité, certaines garanties ne peuvent être données.</p>

              <SubTitle>11.2 — Nature des analyses</SubTitle>
              <Callout type="warning" title="Aide à la décision, non avis d'expert">
                Les rapports Verimo sont une <strong>aide à la décision</strong> automatisée. Ils ne remplacent en aucun cas l'avis d'un notaire, d'un avocat, d'un diagnostiqueur immobilier ou de tout autre professionnel certifié. Le Pro reste seul responsable de l'usage qu'il fait des rapports dans le cadre de son activité.
              </Callout>

              <SubTitle>11.3 — Limitation de responsabilité</SubTitle>
              <p>Verimo ne pourra être tenu responsable :</p>
              <ul style={{ paddingLeft: 22, lineHeight: 2 }}>
                <li>Des décisions prises par le Pro ou ses clients sur la base d'un rapport Verimo</li>
                <li>D'erreurs ou omissions présentes dans les documents fournis par le Pro</li>
                <li>D'une indisponibilité temporaire du service due à une maintenance ou à un cas de force majeure</li>
                <li>Des dommages indirects (perte de chiffre d'affaires, perte de clientèle, etc.)</li>
              </ul>
              <p>En tout état de cause, la responsabilité de Verimo est limitée au montant des sommes effectivement payées par le Pro sur les 12 derniers mois.</p>
            </Section>

            {/* ─── Section 12 : Modification CGV ─── */}
            <Section id="modif" icon={RefreshCw} title="12. Modification des CGV">
              <p>Verimo se réserve le droit de modifier les présentes CGV à tout moment. Toute modification substantielle (tarifs, conditions d'engagement, droits du Pro) fait l'objet d'une notification par email au moins 30 jours avant son entrée en vigueur.</p>
              <p>Le Pro qui n'accepte pas les nouvelles conditions peut résilier son abonnement sans pénalité avant leur entrée en vigueur. La poursuite de l'utilisation du service après la date d'effet vaut acceptation des nouvelles conditions.</p>
              <p>Les modifications mineures (clarifications rédactionnelles, ajout d'exemples) prennent effet à la publication sans notification spécifique.</p>
            </Section>

            {/* ─── Section 13 : Litiges ─── */}
            <Section id="litige" icon={Shield} title="13. Loi applicable et litiges">
              <p>Les présentes CGV sont régies par le droit français.</p>
              <p>Toute difficulté d'application ou d'interprétation des présentes fera l'objet d'une tentative de résolution amiable préalable entre les parties.</p>
              <p>À défaut d'accord amiable dans un délai de 30 jours à compter de la notification écrite du différend, le litige sera porté devant les tribunaux compétents du ressort du siège social de Verimo, conformément au droit commun des relations B2B.</p>
              <p>Pour les Pros bénéficiant du statut de TPE (moins de 5 salariés), le recours à la médiation est ouvert via la plateforme européenne de règlement des litiges en ligne : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" style={{ color: PRO_ACCENT, textDecoration: 'underline' }}>ec.europa.eu/consumers/odr</a>.</p>
            </Section>

            {/* ─── Section 14 : Contact ─── */}
            <Section id="contact" icon={Mail} title="14. Contact">
              <p>Pour toute question relative aux présentes CGV Pro ou au service Verimo Pro :</p>
              <div style={{ padding: 20, borderRadius: 12, background: PRO_BG, border: `1.5px solid ${PRO_LIGHT}60`, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Mail size={18} style={{ color: PRO_ACCENT }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: PRO_DARK }}>pro@verimo.fr</span>
                </div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>
                  Verimo — Édité par <strong>VERIMO APP</strong><br />
                  Responsable : Alexandre ROGELET<br />
                  Site : <a href="https://verimo.fr" style={{ color: PRO_ACCENT, textDecoration: 'underline' }}>verimo.fr</a><br />
                  Formulaire de contact : <Link to="/contact" style={{ color: PRO_ACCENT, textDecoration: 'underline' }}>verimo.fr/contact</Link>
                </div>
              </div>
            </Section>

            {/* Footer de page */}
            <div style={{ marginTop: 60, padding: 24, borderRadius: 14, background: `linear-gradient(135deg, ${PRO_DARK} 0%, ${PRO_ACCENT} 100%)`, color: '#fff', textAlign: 'center' }}>
              <CheckCircle size={32} style={{ color: PRO_LIGHT, margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Document Verimo Pro · Version 2.3 · Mai 2026</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>En souscrivant à Verimo Pro, vous reconnaissez avoir lu, compris et accepté les présentes CGV.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile : sidebar passe en haut */}
      <style>{`
        @media (max-width: 900px) {
          .cgv-pro-sidebar { position: static !important; margin-bottom: 32px; }
          section > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </main>
  );
}

/* ════════════════════════════════════════════════════
   COMPOSANTS UTILITAIRES
════════════════════════════════════════════════════ */

function Section({ id, icon: Icon, title, children }: { id: string; icon: any; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 56, scrollMarginTop: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #0f2d3d, #2a7d9c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color: '#fff' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2d3d', letterSpacing: '-0.01em' }}>{title}</h2>
      </div>
      <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2d3d', marginTop: 12, marginBottom: 4 }}>{children}</h3>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflow: 'auto', borderRadius: 12, border: '1.5px solid #e2e8f0', margin: '8px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f0f7fb' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#0f2d3d', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1.5px solid #d0e8f0' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '12px 14px', color: '#475569', borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none', fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlansTable({ plans, accent, dark, light }: { plans: any[]; accent: string; dark: string; light: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, margin: '12px 0' }}>
      {plans.map(p => (
        <div key={p.id} style={{
          padding: '18px 18px 20px',
          borderRadius: 14,
          background: p.popular ? `linear-gradient(135deg, ${dark}, ${accent})` : '#fff',
          border: p.popular ? 'none' : `1.5px solid #e2e8f0`,
          color: p.popular ? '#fff' : '#0f2d3d',
          position: 'relative' as const,
        }}>
          {p.popular && (
            <div style={{ position: 'absolute' as const, top: -10, left: '50%', transform: 'translateX(-50%)', padding: '3px 10px', borderRadius: 100, background: light, color: dark, fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>
              POPULAIRE
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: p.popular ? 'rgba(255,255,255,0.7)' : '#94a3b8', letterSpacing: '0.08em', marginBottom: 4 }}>PLAN</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 2 }}>{p.name}</div>
          <div style={{ fontSize: 11, color: p.popular ? 'rgba(255,255,255,0.8)' : '#64748b', marginBottom: 12 }}>{p.tagline}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 12 }}>
            <span style={{ fontSize: 28, fontWeight: 900 }}>{p.priceHt}€</span>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.7 }}>HT</span>
            <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 4 }}>/ mois</span>
          </div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 12 }}>({p.priceTtc}€ TTC)</div>
          <div style={{ paddingTop: 12, borderTop: `1px solid ${p.popular ? 'rgba(255,255,255,0.2)' : '#e2e8f0'}`, fontSize: 13, lineHeight: 1.8 }}>
            <div>✓ <strong>{p.completes}</strong> analyse{p.completes > 1 ? 's' : ''} complète{p.completes > 1 ? 's' : ''}</div>
            <div>✓ <strong>{p.simples}</strong> analyse{p.simples > 1 ? 's' : ''} simple{p.simples > 1 ? 's' : ''}</div>
            <div>✓ Cumul jusqu'à 2 mois</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UnitsTableCompare({ unitsPro, unitsPart, accent }: { unitsPro: any[]; unitsPart: any[]; accent: string }) {
  return (
    <div style={{ overflow: 'auto', borderRadius: 12, border: '1.5px solid #e2e8f0', margin: '8px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#f0f7fb' }}>
            <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 12, fontWeight: 800, color: '#0f2d3d', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1.5px solid #d0e8f0' }}>Type d'analyse</th>
            <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, fontWeight: 800, color: accent, letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1.5px solid #d0e8f0' }}>Tarif Pro (HT)</th>
            <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: 12, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '1.5px solid #d0e8f0' }}>Tarif particulier (TTC)</th>
          </tr>
        </thead>
        <tbody>
          {unitsPro.map((u, i) => {
            const part = unitsPart.find(p => p.label.toLowerCase().includes(u.label.toLowerCase().includes('simple') ? 'simple' : 'complète'));
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                <td style={{ padding: '12px 14px', color: '#0f2d3d', fontWeight: 600, borderBottom: '1px solid #f1f5f9' }}>{u.label}</td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: accent, fontWeight: 800, borderBottom: '1px solid #f1f5f9' }}>
                  {u.priceHt}€ <span style={{ fontSize: 11, opacity: 0.7 }}>({u.priceTtc}€ TTC)</span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>
                  {part ? `${part.price}€` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Callout({ type, title, children }: { type: 'info' | 'success' | 'warning'; title: string; children: React.ReactNode }) {
  const styles = {
    info: { bg: '#f0f7fb', border: '#7dd3fc', icon: '💡', iconColor: '#2a7d9c', titleColor: '#0c4a6e' },
    success: { bg: '#f0fdf4', border: '#86efac', icon: '✓', iconColor: '#16a34a', titleColor: '#14532d' },
    warning: { bg: '#fffbeb', border: '#fcd34d', icon: '⚠', iconColor: '#d97706', titleColor: '#78350f' },
  };
  const s = styles[type];
  return (
    <div style={{ padding: '14px 18px', borderRadius: 12, background: s.bg, border: `1.5px solid ${s.border}80`, margin: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{s.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: s.titleColor, letterSpacing: '0.02em' }}>{title}</span>
      </div>
      <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, paddingLeft: 26 }}>{children}</div>
    </div>
  );
}
