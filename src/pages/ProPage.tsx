import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowRight, Building2, TrendingUp, Scale,
  ShieldCheck, Clock, FileText, BarChart3, Users,
  Zap, Eye, Lock, ChevronDown, Star, Target,
  PieChart, BadgeCheck, Handshake,
  Sparkles,
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
    headline: 'Un service premium qui vous différencie de la concurrence.',
    description: 'Intégrez Verimo à votre process de vente. Vos acquéreurs reçoivent une analyse claire des documents avant même la visite. Résultat : décisions plus rapides, moins de rétractations, et des clients qui vous recommandent.',
    benefits: [
      { icon: Handshake, text: 'Argument différenciant en prise de mandat' },
      { icon: Zap, text: 'Moins de rétractations, signatures accélérées' },
      { icon: Star, text: 'Service premium qui génère du bouche-à-oreille' },
      { icon: BarChart3, text: 'Rapport partageable avec votre branding' },
    ],
    stats: [
      { value: '-40%', label: 'rétractations' },
      { value: '30s', label: 'par analyse' },
      { value: '100%', label: 'objectif' },
    ],
    color: '#2a7d9c',
    lightBg: '#f0f7fb',
  },
  {
    id: 'investor',
    icon: TrendingUp,
    emoji: '📈',
    label: 'Investisseur',
    tagline: 'Analysez plus vite. Investissez mieux.',
    headline: 'Chaque bien est une opportunité — ou un gouffre financier.',
    description: 'Vous analysez des dizaines de biens. Verimo extrait automatiquement charges, travaux votés, impayés et risques cachés. Le score /20 vous permet de comparer objectivement vos opportunités.',
    benefits: [
      { icon: Target, text: 'Score /20 pour comparer vos opportunités' },
      { icon: PieChart, text: 'Charges, travaux et impayés chiffrés' },
      { icon: Clock, text: '30 secondes au lieu de 2 heures par dossier' },
      { icon: Eye, text: 'Risques cachés détectés automatiquement' },
    ],
    stats: [
      { value: '10x', label: 'plus rapide' },
      { value: '/20', label: 'score objectif' },
      { value: '∞', label: 'sans expiration' },
    ],
    color: '#7c3aed',
    lightBg: '#f5f3ff',
  },
  {
    id: 'notaire',
    icon: Scale,
    emoji: '⚖️',
    label: 'Notaire',
    tagline: 'Sécurisez vos transactions. Gagnez du temps.',
    headline: 'Un pré-screening intelligent, en complément de votre expertise.',
    description: 'Verimo ne remplace pas votre analyse — il l\'accélère. En quelques secondes, obtenez une synthèse structurée des PV d\'AG, diagnostics et documents financiers. Identifiez immédiatement les points à approfondir.',
    benefits: [
      { icon: FileText, text: 'Synthèse immédiate de 80+ pages de PV' },
      { icon: ShieldCheck, text: 'Devoir de conseil renforcé, rien ne passe entre les mailles' },
      { icon: Users, text: 'Vos clients reçoivent un rapport clair en complément' },
      { icon: BadgeCheck, text: 'Conforme RGPD, chiffré, suppression automatique' },
    ],
    stats: [
      { value: '-70%', label: 'temps de lecture' },
      { value: '0', label: 'données conservées' },
      { value: 'RGPD', label: 'conforme' },
    ],
    color: '#0f2d3d',
    lightBg: '#f4f7f9',
  },
];

const faqPro = [
  {
    q: 'Verimo remplace-t-il le travail d\'un notaire ou d\'un agent ?',
    a: 'Non. Verimo est un outil complémentaire qui accélère la lecture et l\'analyse des documents immobiliers. Il ne fournit ni conseil juridique, ni avis de valeur. Il structure et synthétise les informations pour que le professionnel puisse se concentrer sur son expertise.',
  },
  {
    q: 'Les documents de mes clients sont-ils en sécurité ?',
    a: 'Absolument. Tous les documents sont chiffrés en transit et au repos, hébergés en Europe, et supprimés automatiquement après traitement. Aucun document n\'est conservé ni utilisé à d\'autres fins.',
  },
  {
    q: 'Existe-t-il des tarifs volume pour les professionnels ?',
    a: 'Oui, nous proposons des offres adaptées au volume et aux besoins spécifiques de chaque professionnel. Contactez-nous via le formulaire pour recevoir une proposition personnalisée.',
  },
  {
    q: 'Puis-je partager les rapports avec mes clients ?',
    a: 'Oui. Chaque rapport peut être partagé via un lien sécurisé ou exporté en PDF. Pour les agents immobiliers, nous travaillons sur une option co-branding avec votre identité visuelle.',
  },
  {
    q: 'Quels types de documents peut-on analyser ?',
    a: 'PV d\'assemblée générale, règlements de copropriété, diagnostics techniques (DPE, amiante, électricité, gaz…), appels de charges, compromis de vente, états datés, DTG, carnets d\'entretien, et bien d\'autres.',
  },
];


/* ═══════════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════════ */
export default function ProPage() {
  return (
    <div className="bg-white text-[#0f172a] antialiased overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <HeroSection />
      <StatsRibbon />
      <ProfilesSection />
      <HowItWorksProSection />
      <TestimonialsSection />
      <SecuritySection />
      <FaqProSection />
      <CtaFinalSection />
    </div>
  );
}


/* ═══ HERO ═══════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative overflow-hidden px-5 pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, #0a1f2d 0%, #0f2d3d 30%, #1a4a5e 65%, #2a7d9c 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.4 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
      </div>
      <div className="absolute top-[-10%] left-[50%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(42,125,156,0.15) 0%, transparent 65%)', transform: 'translateX(-50%)' }} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div variants={up} initial="hidden" animate="show" custom={0}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <Sparkles size={14} style={{ color: '#7dd3fc' }} />
          <span className="text-white/80 text-sm font-semibold tracking-wide">Offre Professionnelle</span>
        </motion.div>

        <motion.h1 variants={up} initial="hidden" animate="show" custom={1}
          className="text-[clamp(30px,5.5vw,60px)] font-black leading-[1.06] tracking-[-0.035em] text-white mb-7">
          L'analyse immobilière<br />
          qui fait la différence<br />
          <span className="relative inline-block">
            <span style={{ color: '#7dd3fc' }}>pour les pros.</span>
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 1.0, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-2 left-0 right-0 h-[3px] md:h-[4px] rounded-full origin-left block"
              style={{ background: 'rgba(125,211,252,0.35)' }} />
          </span>
        </motion.h1>

        <motion.p variants={up} initial="hidden" animate="show" custom={2}
          className="text-base md:text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-10">
          Agents immobiliers, investisseurs, notaires — intégrez un outil d'analyse documentaire intelligent à votre activité.
          Score /20, risques chiffrés, rapport en 30 secondes.
        </motion.p>

        <motion.div variants={up} initial="hidden" animate="show" custom={3}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link to="/contact-pro"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
            style={{ background: '#fff', color: '#0f2d3d' }}>
            Demander une démo <ArrowRight size={16} />
          </Link>
          <a href="#profils"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold transition-all duration-200 hover:bg-white/[0.08]"
            style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
            Voir les solutions métier
          </a>
        </motion.div>

        <motion.p variants={up} initial="hidden" animate="show" custom={4}
          className="text-sm text-white/30 font-medium">
          Sans engagement · Réponse sous 24h
        </motion.p>
      </div>
    </section>
  );
}


/* ═══ RUBAN DE STATS ═════════════════════════════════════════ */
function StatsRibbon() {
  const stats = [
    { value: '30s', label: 'Analyse complète', icon: Zap },
    { value: '/20', label: 'Score objectif par bien', icon: BarChart3 },
    { value: '0', label: 'Documents conservés', icon: Lock },
    { value: '100%', label: 'Conforme RGPD', icon: ShieldCheck },
  ];

  return (
    <section className="relative -mt-1 z-20">
      <div className="max-w-5xl mx-auto px-4">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden shadow-xl border border-slate-100"
            style={{ background: '#e2e8f0' }}>
            {stats.map((s, i) => (
              <div key={i} className="bg-white px-5 py-6 md:py-7 text-center">
                <s.icon size={18} className="mx-auto mb-3 text-[#2a7d9c]" />
                <div className="text-2xl md:text-3xl font-black text-[#0f172a] mb-1">{s.value}</div>
                <div className="text-xs text-slate-400 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}


/* ═══ PROFILS MÉTIERS ════════════════════════════════════════ */
function ProfilesSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = profiles[activeIdx];

  return (
    <section id="profils" className="py-20 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-5xl mx-auto">

        <Reveal className="text-center mb-5">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Solutions par métier</p>
          <h2 className="text-[clamp(26px,4vw,48px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
            Une offre adaptée à{' '}
            <span className="relative inline-block">
              <span className="text-[#2a7d9c]">votre réalité.</span>
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#2a7d9c]/20 rounded-full block" />
            </span>
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Chaque professionnel a des besoins différents. Découvrez ce que Verimo peut faire pour vous.
          </p>
        </Reveal>

        <Reveal delay={1} className="flex justify-center mb-14">
          <div className="inline-flex bg-[#f4f7f9] rounded-2xl p-1.5 gap-1 flex-wrap justify-center border border-slate-100/80">
            {profiles.map((p, i) => (
              <button key={p.id} onClick={() => setActiveIdx(i)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all duration-250"
                style={{
                  background: activeIdx === i ? '#0f2d3d' : 'transparent',
                  color: activeIdx === i ? '#fff' : '#64748b',
                  boxShadow: activeIdx === i ? '0 4px 16px rgba(15,45,61,0.2)' : 'none',
                }}>
                <span className="text-base">{p.emoji}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div key={active.id}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>

            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
                style={{ background: active.lightBg, border: `1px solid ${active.color}20` }}>
                <active.icon size={14} style={{ color: active.color }} />
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: active.color }}>{active.tagline}</span>
              </div>
              <h3 className="text-[clamp(22px,3vw,36px)] font-black text-[#0f172a] leading-tight max-w-2xl mx-auto mb-4">
                {active.headline}
              </h3>
              <p className="text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
                {active.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10 max-w-lg mx-auto">
              {active.stats.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 + 0.15 }}
                  className="text-center rounded-2xl py-5 px-3"
                  style={{ background: active.lightBg, border: `1px solid ${active.color}12` }}>
                  <div className="text-2xl md:text-3xl font-black mb-0.5" style={{ color: active.color }}>{s.value}</div>
                  <div className="text-[11px] text-slate-400 font-semibold">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {active.benefits.map((b, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 + 0.2 }}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 border border-slate-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${active.color}10`, border: `1.5px solid ${active.color}18` }}>
                    <b.icon size={18} style={{ color: active.color }} />
                  </div>
                  <span className="text-sm font-semibold text-[#0f172a] leading-snug">{b.text}</span>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link to="/contact-pro"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: active.color, color: '#fff' }}>
                Être recontacté <ArrowRight size={15} />
              </Link>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}


/* ═══ COMMENT ÇA MARCHE ══════════════════════════════════════ */
function HowItWorksProSection() {
  const steps = [
    { n: '01', title: 'Contactez-nous', desc: 'Remplissez le formulaire. Un conseiller vous recontacte sous 24h pour comprendre votre activité et vos besoins.', icon: Users, color: '#2a7d9c' },
    { n: '02', title: 'Offre sur mesure', desc: 'Nous configurons votre espace avec un volume de crédits adapté et des options spécifiques à votre métier.', icon: Target, color: '#1a5e78' },
    { n: '03', title: 'Analysez & partagez', desc: 'Déposez vos documents, recevez vos rapports en 30 secondes. Partagez-les avec vos clients en un clic.', icon: Zap, color: '#0f2d3d' },
  ];

  return (
    <section className="py-20 md:py-28 px-4 md:px-6" style={{ background: '#f8fafc' }}>
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Mise en route</p>
          <h2 className="text-[clamp(26px,4vw,44px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
            Opérationnel en{' '}
            <span className="text-[#2a7d9c]">48 heures.</span>
          </h2>
          <p className="text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            Pas d'intégration technique, pas de formation. Vous créez votre compte et vous commencez.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i}>
              <div className="relative text-center bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: step.color }}>
                  <step.icon size={24} className="text-white" />
                </div>
                <div className="text-xs font-black text-slate-300 mb-2 tracking-widest">ÉTAPE {step.n}</div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">{step.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#f8fafc] border border-slate-100 items-center justify-center z-10">
                    <ArrowRight size={14} className="text-slate-300" />
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


/* ═══ TÉMOIGNAGES ════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      quote: 'Verimo a changé notre façon de préparer les dossiers acquéreurs. On gagne un temps fou et nos clients sont rassurés dès la première visite.',
      name: 'Sophie M.',
      role: 'Directrice d\'agence',
      city: 'Lyon',
      type: '🏢 Agent',
    },
    {
      quote: 'J\'analyse 8 à 10 biens par mois. Avant, je passais 2h par dossier. Avec Verimo, c\'est 30 secondes et je ne rate rien.',
      name: 'Thomas R.',
      role: 'Investisseur',
      city: 'Paris',
      type: '📈 Investisseur',
    },
    {
      quote: 'Un excellent complément à notre analyse. Le rapport synthétise les PV d\'AG de manière remarquable. Mes clercs adorent.',
      name: 'Maître L.',
      role: 'Notaire associé',
      city: 'Bordeaux',
      type: '⚖️ Notaire',
    },
  ];

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Témoignages</p>
          <h2 className="text-[clamp(26px,4vw,44px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a]">
            Ils font confiance à{' '}
            <span className="text-[#2a7d9c]">Verimo.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i}>
              <div className="relative bg-[#f8fafc] rounded-2xl p-7 border border-slate-100 h-full flex flex-col">
                <div className="inline-flex self-start items-center px-3 py-1 rounded-full bg-white border border-slate-100 text-xs font-semibold text-slate-500 mb-5">
                  {t.type}
                </div>
                <p className="text-[15px] text-[#0f172a] leading-relaxed flex-1 mb-6">
                  « {t.quote} »
                </p>
                <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0f172a]">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role} · {t.city}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={12} fill="#f0a500" stroke="#f0a500" />
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ═══ SÉCURITÉ ═══════════════════════════════════════════════ */
function SecuritySection() {
  const items = [
    { icon: Lock, title: 'Chiffrement bout en bout', desc: 'Vos documents sont chiffrés en transit (TLS) et au repos (AES-256). Personne ne peut y accéder.' },
    { icon: ShieldCheck, title: 'Suppression automatique', desc: 'Les fichiers sont supprimés automatiquement après traitement. Aucune conservation, aucun réemploi.' },
    { icon: BadgeCheck, title: 'Conforme RGPD', desc: 'Hébergement européen, politique de confidentialité transparente, droit à l\'effacement garanti.' },
  ];

  return (
    <section className="py-16 md:py-24 px-4 md:px-6" style={{ background: '#f8fafc' }}>
      <div className="max-w-4xl mx-auto">
        <Reveal className="text-center mb-12">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Sécurité & conformité</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
            Vos données sont{' '}
            <span className="text-[#2a7d9c]">en sécurité.</span>
          </h2>
          <p className="text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
            La confiance de vos clients commence par la sécurité de leurs documents.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <Reveal key={i} delay={i}>
              <div className="text-center bg-white rounded-2xl p-7 border border-slate-100 shadow-sm h-full">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: '#0f2d3d' }}>
                  <item.icon size={22} className="text-white" />
                </div>
                <h3 className="text-base font-bold text-[#0f172a] mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
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
    <section className="py-20 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <Reveal className="text-center mb-12">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">FAQ</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a]">
            Questions fréquentes
          </h2>
        </Reveal>

        <div className="flex flex-col gap-3">
          {faqPro.map((faq, i) => (
            <Reveal key={i} delay={i * 0.5}>
              <div className="bg-[#f8fafc] rounded-2xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-colors">
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 md:p-6 text-left gap-4">
                  <span className="text-sm md:text-[15px] font-bold text-[#0f172a] leading-snug">{faq.q}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-slate-200 bg-white">
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${openIdx === i ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {openIdx === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div className="px-5 md:px-6 pb-5 md:pb-6">
                        <div className="text-sm text-slate-400 leading-relaxed pt-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                          <p className="pt-4">{faq.a}</p>
                        </div>
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
    <section className="relative overflow-hidden py-24 md:py-32 px-4 md:px-6">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, #0a1f2d 0%, #0f2d3d 35%, #1a4a5e 70%, #2a7d9c 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.3 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>
      <div className="absolute top-[50%] left-[50%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(125,211,252,0.08) 0%, transparent 65%)', transform: 'translate(-50%,-50%)' }} />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Zap size={14} style={{ color: '#7dd3fc' }} />
            <span className="text-white/80 text-sm font-semibold">Prêt à passer à l'action ?</span>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <h2 className="text-[clamp(26px,4.5vw,50px)] font-black text-white leading-[1.08] tracking-[-0.03em] mb-6">
            Rejoignez les pros qui<br />
            font confiance à <span style={{ color: '#7dd3fc' }}>Verimo.</span>
          </h2>
        </Reveal>

        <Reveal delay={2}>
          <p className="text-lg text-white/45 leading-relaxed max-w-xl mx-auto mb-10">
            Démo personnalisée, offre sur mesure, accompagnement dédié. Réponse garantie sous 24 heures.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Link to="/contact-pro"
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl text-base font-bold shadow-xl hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-200"
              style={{ background: '#fff', color: '#0f2d3d' }}>
              Demander une démo <ArrowRight size={16} />
            </Link>
            <Link to="/exemple"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-semibold transition-all duration-200 hover:bg-white/[0.08]"
              style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
              Voir un exemple de rapport
            </Link>
          </div>
        </Reveal>

        <Reveal delay={4}>
          <div className="flex flex-wrap justify-center gap-6">
            {[
              { icon: ShieldCheck, label: 'Données chiffrées' },
              { icon: Lock, label: 'Conforme RGPD' },
              { icon: Clock, label: 'Réponse sous 24h' },
            ].map(({ icon: I, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-white/30 font-medium">
                <I size={14} /> {label}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
