import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowRight, Building2, TrendingUp, Scale,
  ShieldCheck, Clock, FileText, BarChart3, Users,
  Zap, Eye, Lock, ChevronDown, Star, Target,
  Briefcase, PieChart, BadgeCheck, Handshake,
} from 'lucide-react';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
const isLowPerf = () => isIOS() || isMobile();
const _lowPerf = isLowPerf();

const up: Variants = {
  hidden: { opacity: 0, y: _lowPerf ? 6 : 20 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: {
      duration: _lowPerf ? 0.18 : 0.45,
      delay: _lowPerf ? Math.min(i * 0.02, 0.06) : i * 0.09,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  if (_lowPerf) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
      }, { threshold: 0.1 });
      obs.observe(el);
      return () => obs.disconnect();
    }, []);
    return (
      <div ref={ref} className={className} style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: `opacity 0.25s ease ${delay * 0.02}s, transform 0.25s ease ${delay * 0.02}s`,
      }}>
        {children}
      </div>
    );
  }
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div ref={ref} variants={up} initial="hidden" animate={inView ? 'show' : 'hidden'} custom={delay} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */

const profiles = [
  {
    id: 'agent',
    icon: Building2,
    emoji: '🏢',
    label: 'Agent immobilier',
    tagline: 'Différenciez-vous. Rassurez vos acquéreurs.',
    headline: 'Offrez à vos clients un niveau de transparence que vos concurrents n\'ont pas.',
    description: 'Intégrez le rapport Verimo à votre process de vente. Vos acquéreurs reçoivent une analyse claire des documents — PV, diagnostics, charges — avant même la visite. Résultat : des décisions plus rapides, moins de rétractations, et un service que vos clients recommandent.',
    benefits: [
      { icon: Handshake, title: 'Argument de prise de mandat', text: 'Proposez un rapport d\'analyse à vos vendeurs pour valoriser votre accompagnement face à la concurrence.' },
      { icon: Zap, title: 'Accélérez les signatures', text: 'Vos acquéreurs comprennent le bien dès le départ. Moins de questions, moins de doutes, moins de rétractations.' },
      { icon: Star, title: 'Fidélisez vos clients', text: 'Un service premium qui crée du bouche-à-oreille. Vos clients recommandent une agence qui va plus loin.' },
      { icon: BarChart3, title: 'Rapport co-brandable', text: 'Partagez le rapport Verimo avec votre logo et vos couleurs. Vos clients associent la qualité à votre marque.' },
    ],
    stats: [
      { value: '-40%', label: 'de rétractations' },
      { value: '30s', label: 'd\'analyse' },
      { value: '100%', label: 'objectif & factuel' },
    ],
    color: '#2a7d9c',
    bg: '#f0f7fb',
    gradient: 'linear-gradient(135deg, #2a7d9c, #1a5e78)',
  },
  {
    id: 'investor',
    icon: TrendingUp,
    emoji: '📈',
    label: 'Investisseur immobilier',
    tagline: 'Analysez plus vite. Investissez mieux.',
    headline: 'Chaque bien est une opportunité — ou un gouffre. Sachez-le avant de signer.',
    description: 'En tant qu\'investisseur, vous analysez des dizaines de biens. Verimo vous fait gagner des heures en extrayant automatiquement les charges, travaux votés, impayés et risques cachés. Le score /20 vous permet de comparer objectivement vos opportunités.',
    benefits: [
      { icon: Target, title: 'Comparez objectivement', text: 'Score /20 par bien pour identifier les meilleures opportunités et écarter les pièges en un coup d\'œil.' },
      { icon: PieChart, title: 'Impact financier chiffré', text: 'Charges, fonds travaux, impayés, travaux votés — tout est chiffré pour calculer votre vraie rentabilité.' },
      { icon: Clock, title: 'Industrialisez votre process', text: 'Analysez un bien en 30 secondes au lieu de 2 heures. Multipliez vos acquisitions sans multiplier votre temps.' },
      { icon: Eye, title: 'Détectez les risques cachés', text: 'Procédures judiciaires, travaux lourds non votés, DPE F/G — repérez ce que le vendeur ne dit pas.' },
    ],
    stats: [
      { value: '10x', label: 'plus rapide' },
      { value: '/20', label: 'score objectif' },
      { value: '∞', label: 'crédits sans expiration' },
    ],
    color: '#7c3aed',
    bg: '#f5f3ff',
    gradient: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
  },
  {
    id: 'notaire',
    icon: Scale,
    emoji: '⚖️',
    label: 'Notaire',
    tagline: 'Sécurisez vos transactions. Gagnez du temps.',
    headline: 'Un pré-screening intelligent de vos dossiers, en complément de votre expertise.',
    description: 'Verimo ne remplace pas votre analyse — il l\'accélère. En quelques secondes, vous obtenez une synthèse structurée des PV d\'AG, diagnostics et documents financiers. Vous identifiez immédiatement les points d\'attention à approfondir.',
    benefits: [
      { icon: FileText, title: 'Synthèse immédiate', text: 'Plus besoin de lire 80 pages de PV pour identifier les travaux votés et les procédures. Verimo extrait l\'essentiel.' },
      { icon: ShieldCheck, title: 'Devoir de conseil renforcé', text: 'Un outil complémentaire qui vous aide à ne rien laisser passer et à alerter vos clients sur les points critiques.' },
      { icon: Users, title: 'Satisfaction client', text: 'Vos clients reçoivent un rapport clair en plus de votre accompagnement. Un service différenciant pour votre étude.' },
      { icon: BadgeCheck, title: 'Conforme & sécurisé', text: 'Documents chiffrés, supprimés automatiquement, hébergés en Europe. Conforme RGPD.' },
    ],
    stats: [
      { value: '-70%', label: 'temps de lecture' },
      { value: '0', label: 'données conservées' },
      { value: 'RGPD', label: 'conforme' },
    ],
    color: '#0f2d3d',
    bg: '#f4f7f9',
    gradient: 'linear-gradient(135deg, #0f2d3d, #1a4a5e)',
  },
];

const trustedBy = [
  'Analyse automatisée par IA',
  'Score objectif /20',
  'Rapport en 30 secondes',
  'Documents chiffrés & supprimés',
  'Conforme RGPD',
  'Hébergé en Europe',
];

const faqPro = [
  {
    q: 'Verimo remplace-t-il le travail d\'un notaire ou d\'un agent ?',
    a: 'Non. Verimo est un outil complémentaire qui accélère la lecture et l\'analyse des documents immobiliers. Il ne fournit ni conseil juridique, ni avis de valeur. Il structure et synthétise les informations pour que le professionnel puisse se concentrer sur son expertise.',
  },
  {
    q: 'Les documents de mes clients sont-ils en sécurité ?',
    a: 'Absolument. Tous les documents sont chiffrés en transit et au repos, hébergés en Europe, et supprimés automatiquement après traitement. Aucun document n\'est conservé ni utilisé à d\'autres fins. Verimo est conforme RGPD.',
  },
  {
    q: 'Existe-t-il des tarifs volume pour les professionnels ?',
    a: 'Oui, nous proposons des offres adaptées au volume et aux besoins spécifiques de chaque professionnel. Contactez-nous via le formulaire pour recevoir une proposition sur mesure.',
  },
  {
    q: 'Puis-je partager les rapports avec mes clients ?',
    a: 'Oui. Chaque rapport peut être partagé via un lien sécurisé ou exporté en PDF. Pour les agents immobiliers, nous travaillons sur une option de co-branding avec votre logo.',
  },
  {
    q: 'Quels types de documents Verimo peut-il analyser ?',
    a: 'PV d\'assemblée générale, règlements de copropriété, diagnostics techniques (DPE, amiante, électricité, gaz…), appels de charges, compromis de vente, états datés, DTG, carnets d\'entretien, et plus encore.',
  },
];

/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function ProPage() {
  return (
    <div className="bg-white text-[#0f172a] antialiased overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <HeroSection />
      <TrustBand />
      <ProfilesSection />
      <HowItWorksProSection />
      <TestimonialsSection />
      <FaqProSection />
      <CtaFinalSection />
    </div>
  );
}

/* ═══ HERO ═══════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden px-5 sm:px-10 lg:px-20 pt-24 pb-16"
      style={{ background: 'linear-gradient(160deg, #0f2d3d 0%, #1a4a5e 40%, #2a7d9c 100%)' }}>

      {/* Éléments décoratifs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] right-[-150px] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(42,125,156,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }} />
        {/* Grid pattern subtil */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <div className="max-w-3xl">
          <motion.div variants={up} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Briefcase size={14} className="text-white/80" />
            <span className="text-white/90 text-sm font-semibold">Offre Professionnelle</span>
          </motion.div>

          <motion.h1 variants={up} initial="hidden" animate="show" custom={1}
            className="text-[clamp(28px,5vw,56px)] font-black leading-[1.08] tracking-[-0.03em] text-white mb-6">
            Automatisez l'analyse,<br />
            <span className="relative inline-block">
              <span style={{ color: '#7dd3fc' }}>sécurisez vos transactions.</span>
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 1.0, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-1 left-0 right-0 h-[4px] rounded-full origin-left block"
                style={{ background: 'rgba(125,211,252,0.3)' }} />
            </span>
          </motion.h1>

          <motion.p variants={up} initial="hidden" animate="show" custom={2}
            className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mb-10">
            Agents immobiliers, investisseurs, notaires — Verimo analyse vos documents de copropriété en{' '}
            <span className="text-white font-semibold">30 secondes</span>. Score /20, risques détectés, rapport structuré.
            Intégrez un outil d'aide à la décision dans votre process.
          </motion.p>

          <motion.div variants={up} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row gap-3">
            <Link to="/contact-pro"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
              style={{ background: '#fff', color: '#0f2d3d' }}>
              Demander une démo <ArrowRight size={16} />
            </Link>
            <a href="#profils"
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              Découvrir l'offre
            </a>
          </motion.div>
        </div>

        {/* Stats hero — desktop seulement */}
        <motion.div variants={up} initial="hidden" animate="show" custom={4}
          className="hidden lg:flex gap-12 mt-16 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { value: '30s', label: 'Analyse complète' },
            { value: '/20', label: 'Score objectif' },
            { value: '0', label: 'Documents conservés' },
            { value: '100%', label: 'RGPD conforme' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-sm text-white/50 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══ BANDE DE CONFIANCE ═════════════════════════════════════ */
function TrustBand() {
  return (
    <section className="py-6 border-b border-slate-100" style={{ background: '#f8fafc' }}>
      <div className="max-w-6xl mx-auto px-5 flex flex-wrap justify-center gap-x-8 gap-y-3">
        {trustedBy.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2a7d9c]" />
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══ PROFILS ═════════════════════════════════════════════════ */
function ProfilesSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = profiles[activeIdx];

  return (
    <section id="profils" className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto">

        <Reveal className="text-center mb-6">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Solutions par métier</p>
          <h2 className="text-[clamp(26px,4vw,48px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
            Un outil adapté à{' '}
            <span className="text-[#2a7d9c]">votre métier.</span>
          </h2>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Chaque professionnel a des besoins différents. Verimo s'adapte à votre réalité.
          </p>
        </Reveal>

        {/* Sélecteur de profil */}
        <Reveal delay={1} className="flex justify-center mb-12">
          <div className="inline-flex bg-[#f4f7f9] rounded-2xl p-1.5 gap-1 flex-wrap justify-center border border-slate-100">
            {profiles.map((p, i) => (
              <button key={p.id} onClick={() => setActiveIdx(i)}
                className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-200"
                style={{
                  background: activeIdx === i ? active.gradient : 'transparent',
                  color: activeIdx === i ? '#fff' : '#64748b',
                  boxShadow: activeIdx === i ? '0 4px 14px rgba(0,0,0,0.15)' : 'none',
                }}>
                <span className="text-lg">{p.emoji}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            ))}
          </div>
        </Reveal>

        {/* Contenu du profil actif */}
        <AnimatePresence mode="wait">
          <motion.div key={active.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}>

            {/* Header du profil */}
            <div className="rounded-3xl overflow-hidden shadow-xl mb-10" style={{ background: active.gradient }}>
              <div className="grid grid-cols-1 lg:grid-cols-2">

                {/* Gauche — texte */}
                <div className="p-8 md:p-12">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <active.icon size={14} className="text-white/80" />
                    <span className="text-white/90 text-xs font-bold tracking-wide uppercase">{active.label}</span>
                  </div>
                  <h3 className="text-[clamp(22px,3vw,34px)] font-black text-white mb-4 leading-tight">
                    {active.headline}
                  </h3>
                  <p className="text-white/70 text-base leading-relaxed mb-8">
                    {active.description}
                  </p>
                  <Link to="/contact-pro"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: '#fff', color: active.color }}>
                    Être recontacté <ArrowRight size={15} />
                  </Link>
                </div>

                {/* Droite — stats */}
                <div className="flex items-center justify-center p-8 md:p-12"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
                    {active.stats.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 + 0.2 }}
                        className="text-center">
                        <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
                        <div className="text-xs text-white/50 font-medium">{s.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bénéfices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {active.benefits.map((b, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 + 0.15 }}
                  className="rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-200"
                  style={{ background: active.bg }}>
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${active.color}15`, border: `1.5px solid ${active.color}25` }}>
                      <b.icon size={20} style={{ color: active.color }} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#0f172a] mb-1.5">{b.title}</h4>
                      <p className="text-sm text-slate-500 leading-relaxed">{b.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>
        </AnimatePresence>

        {/* CTA central */}
        <Reveal delay={2} className="text-center mt-14">
          <Link to="/contact-pro"
            className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl text-base font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #0f2d3d, #2a7d9c)', color: '#fff' }}>
            Demander une démo personnalisée <ArrowRight size={16} />
          </Link>
          <p className="text-sm text-slate-400 mt-4">Sans engagement — réponse sous 24h</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ COMMENT ÇA MARCHE (PRO) ════════════════════════════════ */
function HowItWorksProSection() {
  const steps = [
    {
      n: '01',
      title: 'Contactez-nous',
      desc: 'Remplissez le formulaire avec vos besoins. Un conseiller vous recontacte sous 24h pour comprendre votre activité.',
      icon: Users,
    },
    {
      n: '02',
      title: 'Offre sur mesure',
      desc: 'Nous configurons votre espace avec un volume de crédits adapté et des options spécifiques à votre métier.',
      icon: Target,
    },
    {
      n: '03',
      title: 'Analysez vos biens',
      desc: 'Déposez vos documents, recevez des rapports en 30 secondes. Partagez-les avec vos clients en un clic.',
      icon: Zap,
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#f4f7f9' }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Mise en route</p>
          <h2 className="text-[clamp(26px,4vw,44px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
            Opérationnel en{' '}
            <span className="text-[#2a7d9c]">48 heures.</span>
          </h2>
          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Pas d'intégration complexe, pas de formation. Vous créez votre compte et vous commencez.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i}>
              <div className="relative bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                {/* Numéro */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' }}>
                    <span className="text-white text-sm font-black">{step.n}</span>
                  </div>
                  <step.icon size={20} className="text-[#2a7d9c]" />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>

                {/* Connecteur */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 text-center text-slate-300">
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ TÉMOIGNAGES / SOCIAL PROOF ═════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      quote: 'Verimo a changé notre façon de préparer les dossiers acquéreurs. On gagne un temps fou et nos clients sont rassurés dès la première visite.',
      name: 'Sophie M.',
      role: 'Directrice d\'agence — Lyon',
      type: 'Agent immobilier',
      color: '#2a7d9c',
    },
    {
      quote: 'J\'analyse 8 à 10 biens par mois. Avant, je passais 2h par dossier. Avec Verimo, c\'est 30 secondes et je ne rate rien.',
      name: 'Thomas R.',
      role: 'Investisseur — Paris',
      type: 'Investisseur',
      color: '#7c3aed',
    },
    {
      quote: 'Un excellent complément à notre analyse. Le rapport synthétise les PV d\'AG de manière remarquable. Mes clercs adorent.',
      name: 'Maître L.',
      role: 'Notaire associé — Bordeaux',
      type: 'Notaire',
      color: '#0f2d3d',
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Témoignages</p>
          <h2 className="text-[clamp(26px,4vw,44px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a]">
            Ils utilisent Verimo au{' '}
            <span className="text-[#2a7d9c]">quotidien.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i}>
              <div className="bg-[#f8fafc] rounded-2xl p-7 border border-slate-100 h-full flex flex-col">
                {/* Étoiles */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill="#f0a500" stroke="#f0a500" />
                  ))}
                </div>
                <p className="text-sm text-[#0f172a] leading-relaxed flex-1 mb-6 italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: t.color }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0f172a]">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ FAQ PRO ════════════════════════════════════════════════ */
function FaqProSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#f4f7f9' }}>
      <div className="max-w-3xl mx-auto">
        <Reveal className="text-center mb-12">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">FAQ</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a]">
            Questions fréquentes
          </h2>
        </Reveal>

        <div className="flex flex-col gap-3">
          {faqPro.map((faq, i) => (
            <Reveal key={i} delay={i * 0.5}>
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left">
                  <span className="text-sm md:text-base font-bold text-[#0f172a] pr-4">{faq.q}</span>
                  <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openIdx === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openIdx === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed" style={{ borderTop: '1px solid #f1f5f9' }}>
                        <div className="pt-4">{faq.a}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ CTA FINAL ══════════════════════════════════════════════ */
function CtaFinalSection() {
  return (
    <section className="py-20 md:py-28 px-4 md:px-6"
      style={{ background: 'linear-gradient(160deg, #0f2d3d 0%, #1a4a5e 40%, #2a7d9c 100%)' }}>
      <div className="max-w-3xl mx-auto text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Zap size={14} className="text-white/80" />
            <span className="text-white/90 text-sm font-semibold">Prêt à passer à l'action ?</span>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <h2 className="text-[clamp(26px,4.5vw,48px)] font-black text-white leading-tight tracking-[-0.03em] mb-5">
            Rejoignez les professionnels<br />
            qui font <span style={{ color: '#7dd3fc' }}>confiance à Verimo.</span>
          </h2>
        </Reveal>

        <Reveal delay={2}>
          <p className="text-lg text-white/60 leading-relaxed max-w-xl mx-auto mb-10">
            Demandez une démo personnalisée et découvrez comment Verimo peut s'intégrer dans votre activité. Réponse garantie sous 24h.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/contact-pro"
              className="flex items-center justify-center gap-2 px-9 py-4 rounded-2xl text-base font-bold shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-200"
              style={{ background: '#fff', color: '#0f2d3d' }}>
              Demander une démo <ArrowRight size={16} />
            </Link>
            <Link to="/exemple"
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              Voir un exemple de rapport
            </Link>
          </div>
        </Reveal>

        <Reveal delay={4}>
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            {[
              { icon: ShieldCheck, label: 'Données chiffrées' },
              { icon: Lock, label: 'Conforme RGPD' },
              { icon: Clock, label: 'Réponse sous 24h' },
            ].map(({ icon: I, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-white/40 font-medium">
                <I size={14} className="text-white/40 shrink-0" /> {label}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
