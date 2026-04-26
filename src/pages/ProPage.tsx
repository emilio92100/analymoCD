import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowRight, Building2, TrendingUp, Scale, Key,
  ShieldCheck, Clock, FileText, BarChart3, Users,
  Zap, Eye, Lock, ChevronDown, Star, Target,
  PieChart, BadgeCheck, Handshake,
  Sparkles,
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
const isLowPerf = () => isIOS() || isMobile();
const _lowPerf = isLowPerf();

const up: Variants = {
  hidden: { opacity: 0, y: _lowPerf ? 6 : 20 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: _lowPerf ? 0.18 : 0.45, delay: _lowPerf ? Math.min(i * 0.02, 0.06) : i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  if (_lowPerf) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
      obs.observe(el);
      return () => obs.disconnect();
    }, []);
    return (<div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(6px)', transition: `opacity 0.25s ease ${delay * 0.02}s, transform 0.25s ease ${delay * 0.02}s` }}>{children}</div>);
  }
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (<motion.div ref={ref} variants={up} initial="hidden" animate={inView ? 'show' : 'hidden'} custom={delay} className={className}>{children}</motion.div>);
}

function AccentUnderline() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  return (<motion.span ref={ref} initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 2.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} className="absolute -bottom-1 left-0 right-0 h-[4px] bg-[#2a7d9c]/25 rounded-full origin-left block" />);
}

/* ═══ DATA ═══════════════════════════════════════════════════ */

const profiles = [
  {
    id: 'agent', icon: Building2, emoji: '🏢', label: 'Agent immobilier',
    tagline: 'Différenciez-vous. Rassurez vos acquéreurs.',
    headline: 'Un service premium qui vous différencie de la concurrence.',
    description: 'Intégrez Verimo à votre process de vente. Lorsqu\'un acquéreur montre un intérêt sérieux, envoyez-lui un rapport clair sur l\'état de la copropriété pour le rassurer et accélérer sa prise de décision. Résultat : moins de rétractations, des signatures plus rapides, et des clients qui vous recommandent.',
    benefits: [
      { icon: Handshake, title: 'Prise de mandat', text: 'Un argument différenciant face à vos concurrents lors de la prise de mandat.' },
      { icon: Zap, title: 'Signatures accélérées', text: 'Vos acquéreurs comprennent le bien dès le départ. Moins de doutes, moins de rétractations.' },
      { icon: Star, title: 'Bouche-à-oreille', text: 'Un service premium que vos clients recommandent autour d\'eux.' },
      { icon: BarChart3, title: 'Rapport co-brandable', text: 'Partagez le rapport Verimo avec votre identité visuelle.' },
    ],
    stats: [{ value: '-40%', label: 'rétractations' }, { value: '30s*', label: 'par analyse' }, { value: '100%', label: 'objectif' }],
    color: '#2a7d9c', lightBg: '#f0f7fb',
  },
  {
    id: 'investor', icon: TrendingUp, emoji: '📈', label: 'Investisseur',
    tagline: 'Analysez plus vite. Investissez mieux.',
    headline: 'Chaque bien est une opportunité — ou un gouffre financier.',
    description: 'Vous analysez des dizaines de biens. Verimo extrait automatiquement charges, travaux votés, impayés et risques cachés. Le score /20 vous permet de comparer objectivement vos opportunités.',
    benefits: [
      { icon: Target, title: 'Comparaison objective', text: 'Score /20 par bien pour identifier les meilleures opportunités en un coup d\'œil.' },
      { icon: PieChart, title: 'Impact chiffré', text: 'Charges, fonds travaux, impayés — tout est chiffré pour calculer votre vraie rentabilité.' },
      { icon: Clock, title: 'Gain de temps', text: '30 secondes* au lieu de 2 heures par dossier. Multipliez vos acquisitions.' },
      { icon: Eye, title: 'Risques détectés', text: 'Procédures judiciaires, travaux lourds, DPE F/G — repérez ce que le vendeur ne dit pas.' },
    ],
    stats: [{ value: '10x', label: 'plus rapide' }, { value: '/20', label: 'score objectif' }, { value: '∞', label: 'sans expiration' }],
    color: '#7c3aed', lightBg: '#f5f3ff',
  },
  {
    id: 'marchand', icon: Key, emoji: '🔑', label: 'Marchand de bien',
    tagline: 'Achetez, transformez, revendez — sans surprises.',
    headline: 'Chaque lot caché, chaque risque non détecté, c\'est de la marge perdue.',
    description: 'Division, rénovation, revente en bloc — votre rentabilité dépend de la précision de votre analyse documentaire. Verimo extrait en 30 secondes* les travaux votés, les restrictions du règlement de copropriété, les procédures en cours et les charges réelles.',
    benefits: [
      { icon: Target, title: 'Due diligence express', text: 'Travaux votés, impayés, procédures, DPE — tout ce qui impacte votre prix de revient en un rapport.' },
      { icon: PieChart, title: 'Marge chiffrée', text: 'Charges réelles, fonds travaux, appels de fonds exceptionnels — calculez votre rentabilité nette.' },
      { icon: Eye, title: 'Restrictions détectées', text: 'Interdiction de division, usage commercial limité, servitudes — repéré avant la signature.' },
      { icon: Zap, title: 'Volume & rapidité', text: 'Analysez 10 dossiers par jour. 30 secondes* par bien, zéro page lue.' },
    ],
    stats: [{ value: '30s*', label: 'par dossier' }, { value: '/20', label: 'score objectif' }, { value: '10+', label: 'biens / jour' }],
    color: '#d97706', lightBg: '#fffbeb',
  },
  {
    id: 'notaire', icon: Scale, emoji: '⚖️', label: 'Notaire',
    tagline: 'Sécurisez vos transactions. Gagnez du temps.',
    headline: 'Un pré-screening intelligent, en complément de votre expertise.',
    description: 'Verimo ne remplace pas votre analyse — il l\'accélère. En quelques secondes, obtenez une synthèse structurée des PV d\'AG, diagnostics et documents financiers.',
    benefits: [
      { icon: FileText, title: 'Synthèse immédiate', text: 'Plus besoin de lire 80 pages de PV pour identifier les travaux et procédures.' },
      { icon: ShieldCheck, title: 'Devoir de conseil', text: 'Un outil complémentaire pour ne rien laisser passer et alerter vos clients.' },
      { icon: Users, title: 'Satisfaction client', text: 'Vos clients reçoivent un rapport clair en complément de votre accompagnement.' },
      { icon: BadgeCheck, title: 'Conforme & sécurisé', text: 'Documents chiffrés, supprimés automatiquement, hébergés en Europe.' },
    ],
    stats: [{ value: '-70%', label: 'temps de lecture' }, { value: '0', label: 'données conservées' }, { value: 'RGPD', label: 'conforme' }],
    color: '#0f2d3d', lightBg: '#f4f7f9',
  },
];

const faqPro = [
  { icon: Users, q: 'Verimo remplace-t-il le travail d\'un notaire ou d\'un agent ?', a: 'Non. Verimo est un outil complémentaire qui accélère la lecture et l\'analyse des documents immobiliers. Il ne fournit ni conseil juridique, ni avis de valeur. Il structure et synthétise les informations pour que le professionnel puisse se concentrer sur son expertise.' },
  { icon: Lock, q: 'Les documents de mes clients sont-ils en sécurité ?', a: 'Absolument. Tous les documents sont chiffrés en transit et au repos, hébergés en Europe, et supprimés automatiquement après traitement. Aucun document n\'est conservé ni utilisé à d\'autres fins.' },
  { icon: BarChart3, q: 'Existe-t-il des tarifs volume pour les professionnels ?', a: 'Oui, nous proposons des offres adaptées au volume et aux besoins spécifiques de chaque professionnel. Contactez-nous via le formulaire pour recevoir une proposition personnalisée.' },
  { icon: Eye, q: 'Puis-je partager les rapports avec mes clients ?', a: 'Oui. Chaque rapport peut être partagé via un lien sécurisé ou exporté en PDF. Pour les agents immobiliers, nous travaillons sur une option co-branding avec votre identité visuelle.' },
  { icon: FileText, q: 'Quels types de documents peut-on analyser ?', a: 'PV d\'assemblée générale, règlements de copropriété, diagnostics techniques (DPE, amiante, électricité, gaz…), appels de charges, compromis de vente, états datés, DTG, carnets d\'entretien, et bien d\'autres.' },
  { icon: Zap, q: 'Combien de temps prend une analyse ?', a: 'En moyenne 30 secondes pour les documents nativement numériques (PDF texte). Les documents scannés peuvent nécessiter un délai supplémentaire de quelques minutes pour la reconnaissance optique.' },
  { icon: ShieldCheck, q: 'Verimo est-il conforme au RGPD ?', a: 'Oui. Hébergement européen, chiffrement AES-256 au repos, TLS en transit, suppression automatique après traitement, politique de confidentialité transparente et droit à l\'effacement garanti.' },
  { icon: Clock, q: 'Combien de temps pour mettre en place l\'offre pro ?', a: '48 heures maximum. Après votre premier échange avec notre équipe, nous configurons votre espace et vous pouvez commencer à analyser immédiatement. Aucune intégration technique nécessaire.' },
];


/* ═══ PAGE ═══════════════════════════════════════════════════ */
export default function ProPage() {
  const [activeProfileIdx, setActiveProfileIdx] = useState(0);

  useSEO({
    title: 'Verimo Pro — Outil d’analyse pour professionnels de l’immobilier',
    description: "Verimo Pro pour agents, investisseurs, marchands de biens et notaires : analyse de documents en volume, tableaux de bord, gains de temps et sécurisation des dossiers.",
    canonical: '/pro',
  });

  return (
    <div className="bg-white text-[#0f172a] antialiased overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <HeroSection setActiveProfileIdx={setActiveProfileIdx} />
      <StatsRibbon />
      <ProfilesSection activeIdx={activeProfileIdx} setActiveIdx={setActiveProfileIdx} />
      <HowItWorksProSection />
      <TestimonialsSection />
      <SecuritySection />
      <FaqProSection />
      <CtaFinalSection />
    </div>
  );
}


/* ═══ HERO ═══════════════════════════════════════════════════ */
function HeroSection({ setActiveProfileIdx }: { setActiveProfileIdx: (i: number) => void }) {
  /* Forcer la navbar en blanc opaque sur cette page (fond sombre) */
  useEffect(() => {
    const nav = document.querySelector('header nav') as HTMLElement | null;
    if (nav) {
      nav.style.backgroundColor = 'rgba(255,255,255,0.97)';
      nav.style.backdropFilter = 'none';
      (nav.style as any).webkitBackdropFilter = 'none';
    }
    return () => {
      if (nav) {
        nav.style.backgroundColor = '';
        nav.style.backdropFilter = '';
        (nav.style as any).webkitBackdropFilter = '';
      }
    };
  }, []);

  return (
    <section className="relative overflow-hidden px-5 sm:px-10 lg:px-20 pt-32 pb-20 md:pt-44 md:pb-28">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, #0a1f2d 0%, #0f2d3d 30%, #1a4a5e 65%, #2a7d9c 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.4 }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>
      <div className="absolute top-[-10%] left-[50%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(42,125,156,0.15) 0%, transparent 65%)', transform: 'translateX(-50%)' }} />
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(125,211,252,0.06) 0%, transparent 65%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.div variants={up} initial="hidden" animate="show" custom={0}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-8"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <Sparkles size={14} style={{ color: '#7dd3fc' }} />
          <span className="text-white/80 text-sm font-semibold tracking-wide">Offre Professionnelle</span>
        </motion.div>

        <motion.h1 variants={up} initial="hidden" animate="show" custom={1}
          className="text-[clamp(28px,5vw,56px)] font-black leading-[1.08] tracking-[-0.035em] text-white mb-7">
          L'analyse immobilière qui fait la différence{' '}
          <span className="relative inline-block whitespace-nowrap">
            <span style={{ color: '#7dd3fc' }}>pour les pros.</span>
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 1.0, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -bottom-2 left-0 right-0 h-[3px] md:h-[4px] rounded-full origin-left block"
              style={{ background: 'rgba(125,211,252,0.35)' }} />
          </span>
        </motion.h1>

        <motion.p variants={up} initial="hidden" animate="show" custom={2}
          className="text-base md:text-xl text-white/55 leading-relaxed max-w-5xl mx-auto mb-10">
          Agents immobiliers, investisseurs, marchands de bien, notaires — intégrez un outil d'analyse documentaire intelligent à votre activité. Score /20, risques chiffrés, rapport en 30 secondes*.
        </motion.p>

        {/* 3 profils en cartes */}
        <motion.div variants={up} initial="hidden" animate="show" custom={2.5}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto mb-10">
          {[
            { emoji: '🏢', label: 'Agents immobiliers', desc: 'Rassurez vos acquéreurs' },
            { emoji: '📈', label: 'Investisseurs', desc: 'Comparez vos opportunités' },
            { emoji: '🔑', label: 'Marchands de bien', desc: 'Sécurisez vos opérations' },
            { emoji: '⚖️', label: 'Notaires', desc: 'Accélérez vos dossiers' },
          ].map((p, i) => (
            <button key={i} className="rounded-2xl px-5 py-4 text-center cursor-pointer transition-all duration-200 hover:scale-[1.03]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => { setActiveProfileIdx(i); setTimeout(() => { document.getElementById('profils')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 50); }}>
              <span className="text-2xl block mb-2">{p.emoji}</span>
              <div className="text-sm font-bold text-white mb-1">{p.label}</div>
              <div className="text-xs text-white/40">{p.desc}</div>
            </button>
          ))}
        </motion.div>

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
    { value: '30s*', label: 'Analyse complète', icon: Zap },
    { value: '/20', label: 'Score objectif par bien', icon: BarChart3 },
    { value: '0', label: 'Documents conservés', icon: Lock },
    { value: '100%', label: 'Conforme RGPD', icon: ShieldCheck },
  ];
  return (
    <section className="relative -mt-1 z-20">
      <div className="max-w-5xl mx-auto px-4">
        <Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden shadow-xl border border-slate-100" style={{ background: '#e2e8f0' }}>
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


/* ═══ PROFILS ════════════════════════════════════════════════ */
function ProfilesSection({ activeIdx, setActiveIdx }: { activeIdx: number; setActiveIdx: (i: number) => void }) {
  const active = profiles[activeIdx];

  return (
    <section id="profils" className="py-20 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-5">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Solutions par métier</p>
          <h2 className="text-[clamp(26px,4vw,48px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
            Une offre adaptée à{' '}
            <span className="relative inline-block">
              <span className="text-[#2a7d9c]">votre réalité.</span>
              <AccentUnderline />
            </span>
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-5xl mx-auto leading-relaxed">
            Chaque professionnel a des besoins différents. Découvrez ce que Verimo peut faire pour vous.
          </p>
        </Reveal>

        <Reveal delay={1} className="flex justify-center mb-14">
          <div className="grid grid-cols-4 sm:inline-flex bg-[#f4f7f9] rounded-2xl p-1.5 gap-1.5 sm:gap-1 border border-slate-100/80 w-full sm:w-auto max-w-lg sm:max-w-none mx-auto">
            {profiles.map((p, i) => (
              <button key={p.id} onClick={() => setActiveIdx(i)}
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-5 py-3 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-250"
                style={{ background: activeIdx === i ? '#0f2d3d' : 'transparent', color: activeIdx === i ? '#fff' : '#64748b', boxShadow: activeIdx === i ? '0 4px 16px rgba(15,45,61,0.2)' : 'none' }}>
                <span className="text-lg sm:text-base">{p.emoji}</span>
                <span className="leading-tight text-center sm:text-left">{p.label}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div key={active.id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
            <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-lg">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Gauche */}
                <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center" style={{ background: active.lightBg }}>
                  <div className="inline-flex self-start items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: '#fff', border: `1px solid ${active.color}20` }}>
                    <active.icon size={14} style={{ color: active.color }} />
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: active.color }}>{active.tagline}</span>
                  </div>
                  <h3 className="text-[clamp(22px,2.8vw,34px)] font-black text-[#0f172a] leading-tight mb-4">{active.headline}</h3>
                  <p className="text-base text-slate-500 leading-relaxed mb-8">{active.description}</p>
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {active.stats.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 + 0.15 }}
                        className="text-center rounded-2xl py-4 px-3 bg-white shadow-sm" style={{ border: `1px solid ${active.color}12` }}>
                        <div className="text-xl md:text-2xl font-black mb-0.5" style={{ color: active.color }}>{s.value}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{s.label}</div>
                      </motion.div>
                    ))}
                  </div>
                  <Link to={`/contact-pro?type=${active.id === 'investor' ? 'investisseur' : active.id === 'marchand' ? 'marchand' : active.id}`}
                    className="inline-flex self-start items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: active.color, color: '#fff' }}>
                    Être recontacté <ArrowRight size={15} />
                  </Link>
                </div>
                {/* Droite */}
                <div className="p-8 md:p-10 lg:p-12 bg-white flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-7">
                    <div className="w-2 h-2 rounded-full" style={{ background: active.color }} />
                    <span className="text-sm font-bold text-[#0f172a]">Ce que Verimo fait pour vous</span>
                  </div>
                  <div className="flex flex-col gap-4">
                    {active.benefits.map((b, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 + 0.15 }}
                        className="flex items-start gap-4 p-4 rounded-2xl hover:shadow-md transition-all duration-200" style={{ background: active.lightBg }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${active.color}15`, border: `1.5px solid ${active.color}22` }}>
                          <b.icon size={18} style={{ color: active.color }} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-[#0f172a] mb-1">{b.title}</h4>
                          <p className="text-sm text-slate-400 leading-relaxed">{b.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
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
    { n: '03', title: 'Analysez & partagez', desc: 'Déposez vos documents, recevez vos rapports en 30 secondes*. Partagez-les avec vos clients en un clic.', icon: Zap, color: '#0f2d3d' },
  ];
  return (
    <section className="py-20 md:py-28 px-4 md:px-6" style={{ background: '#f8fafc' }}>
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Mise en route</p>
          <h2 className="text-[clamp(26px,4vw,44px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
            Opérationnel en{' '}<span className="relative inline-block"><span className="text-[#2a7d9c]">48 heures.</span><AccentUnderline /></span>
          </h2>
          <p className="text-base text-slate-400 max-w-3xl mx-auto leading-relaxed">Pas d'intégration technique, pas de formation. Vous créez votre compte et vous commencez.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i}>
              <div className="relative text-center bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: step.color }}>
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
    { quote: 'Verimo a changé notre façon de préparer les dossiers acquéreurs. On gagne un temps fou et nos clients sont rassurés dès la première visite.', name: 'Sophie M.', role: 'Directrice d\'agence', city: 'Lyon', type: '🏢 Agent' },
    { quote: 'J\'analyse 8 à 10 biens par mois. Avant, je passais 2h par dossier. Avec Verimo, c\'est 30 secondes et je ne rate rien.', name: 'Thomas R.', role: 'Investisseur', city: 'Paris', type: '📈 Investisseur' },
    { quote: 'Sur mes opérations de division, Verimo m\'a évité deux mauvaises surprises : une interdiction de diviser dans le RCP et des travaux votés non réalisés. Indispensable pour sécuriser mes marges.', name: 'Karim B.', role: 'Marchand de bien', city: 'Marseille', type: '🔑 Marchand' },
    { quote: 'Un excellent complément à notre analyse. Le rapport synthétise les PV d\'AG de manière remarquable. Mes clercs adorent.', name: 'Maître L.', role: 'Notaire associé', city: 'Bordeaux', type: '⚖️ Notaire' },
  ];
  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Témoignages</p>
          <h2 className="text-[clamp(26px,4vw,44px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a]">
            Ils font confiance à{' '}<span className="relative inline-block"><span className="text-[#2a7d9c]">Verimo.</span><AccentUnderline /></span>
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <Reveal key={i} delay={i}>
              <div className="relative bg-[#f8fafc] rounded-2xl p-7 border border-slate-100 h-full flex flex-col">
                <div className="inline-flex self-start items-center px-3 py-1 rounded-full bg-white border border-slate-100 text-xs font-semibold text-slate-500 mb-5">{t.type}</div>
                <p className="text-[15px] text-[#0f172a] leading-relaxed flex-1 mb-6">« {t.quote} »</p>
                <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' }}>{t.name.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-bold text-[#0f172a]">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role} · {t.city}</div>
                  </div>
                </div>
                <div className="flex gap-0.5 mt-4">{[...Array(5)].map((_, j) => (<Star key={j} size={12} fill="#f0a500" stroke="#f0a500" />))}</div>
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
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-12">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Sécurité & conformité</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
            Vos données sont{' '}<span className="relative inline-block"><span className="text-[#2a7d9c]">en sécurité.</span><AccentUnderline /></span>
          </h2>
          <p className="text-base text-slate-400 max-w-3xl mx-auto leading-relaxed">La confiance de vos clients commence par la sécurité de leurs documents.</p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <Reveal key={i} delay={i}>
              <div className="text-center bg-white rounded-2xl p-7 border border-slate-100 shadow-sm h-full">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: '#0f2d3d' }}>
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


/* ═══ FAQ — "fréquentes" en bleu, icônes, 8 questions ═══════ */
function FaqProSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">FAQ</p>
          <h2 className="text-[clamp(24px,3.5vw,40px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a]">
            Questions{' '}
            <span className="relative inline-block">
              <span className="text-[#2a7d9c]">fréquentes</span>
              <AccentUnderline />
            </span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqPro.map((faq, i) => (
            <Reveal key={i} delay={i * 0.3}>
              <div className={`bg-[#f8fafc] rounded-2xl border overflow-hidden transition-all duration-200 h-full ${openIdx === i ? 'border-[#2a7d9c]/20 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}>
                <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
                  className="w-full flex items-center gap-4 p-5 md:p-6 text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: openIdx === i ? '#2a7d9c' : '#e8f4f8' }}>
                    <faq.icon size={16} style={{ color: openIdx === i ? '#fff' : '#2a7d9c' }} />
                  </div>
                  <span className="text-sm md:text-[15px] font-bold text-[#0f172a] leading-snug flex-1">{faq.q}</span>
                  <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform duration-200 ${openIdx === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openIdx === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                      <div className="px-5 md:px-6 pb-5 md:pb-6 pl-[76px] md:pl-[84px]">
                        <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
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


/* ═══ CTA FINAL — 1 ligne, large ════════════════════════════ */
function CtaFinalSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 px-4 md:px-6">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(170deg, #0a1f2d 0%, #0f2d3d 35%, #1a4a5e 70%, #2a7d9c 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.3 }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>
      <div className="absolute top-[50%] left-[50%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(125,211,252,0.08) 0%, transparent 65%)', transform: 'translate(-50%,-50%)' }} />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Zap size={14} style={{ color: '#7dd3fc' }} />
            <span className="text-white/80 text-sm font-semibold">Prêt à passer à l'action ?</span>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="text-[clamp(26px,4.5vw,50px)] font-black text-white leading-[1.08] tracking-[-0.03em] mb-6">
            Rejoignez les pros qui font confiance à{' '}
            <span className="relative inline-block">
              <span style={{ color: '#7dd3fc' }}>Verimo.</span>
              <motion.span initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-1 left-0 right-0 h-[4px] rounded-full origin-left block"
                style={{ background: 'rgba(125,211,252,0.3)' }} />
            </span>
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="text-lg text-white/45 leading-relaxed max-w-4xl mx-auto mb-10">
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
            {[{ icon: ShieldCheck, label: 'Données chiffrées' }, { icon: Lock, label: 'Conforme RGPD' }, { icon: Clock, label: 'Réponse sous 24h' }].map(({ icon: I, label }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-white/30 font-medium"><I size={14} /> {label}</div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={5}>
          <p className="text-sm text-white/50 mt-10">* 30 secondes en moyenne pour les PDF nativement numériques. Les documents scannés peuvent nécessiter un délai supplémentaire.</p>
        </Reveal>
      </div>
    </section>
  );
}
