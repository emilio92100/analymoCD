import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight, CheckCircle, AlertTriangle, FileText,
  TrendingUp, Clock, Check, X, ChevronRight,
  ShieldCheck, Trash2,
  Download, Lock, Eye, ChevronDown, Briefcase,
} from "lucide-react";

// Détection iOS Safari — animations 3D et boucles infinies désactivées
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

// Sur mobile/iOS : animation CSS native (GPU) au lieu de framer-motion (JS/CPU)
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  if (_lowPerf) {
    // Version CSS pure — un seul IntersectionObserver natif, animation GPU
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
      <div
        ref={ref}
        className={className}
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: `opacity 0.25s ease ${delay * 0.02}s, transform 0.25s ease ${delay * 0.02}s`,
          willChange: visible ? 'auto' : 'opacity, transform',
        }}>
        {children}
      </div>
    );
  }

  // Desktop : framer-motion classique
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} variants={up} initial="hidden" animate={inView ? "show" : "hidden"} custom={delay} className={className}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ label, title, accent, sub }: { label: string; title: string; accent: string; sub?: string }) {
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
    const base: React.CSSProperties = {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    };
    return (
      <div ref={ref} className="text-center mb-8 md:mb-12 px-2">
        <p style={base} className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">{label}</p>
        <h2 style={{ ...base, transitionDelay: '0.05s' }} className="text-[clamp(26px,4vw,52px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
          {title}{' '}
          <span className="relative inline-block max-w-fit">
            <span className="text-[#2a7d9c]">{accent}</span>
            <span style={{ ...base, transitionDelay: '0.15s', position: 'absolute', bottom: -1, left: 0, right: 0, height: 4, background: 'rgba(42,125,156,0.25)', borderRadius: 9999, transformOrigin: 'left', transform: visible ? 'scaleX(1)' : 'scaleX(0)' }}
              className="block" />
          </span>
        </h2>
        {sub && <p style={{ ...base, transitionDelay: '0.1s' }} className="text-base md:text-lg text-slate-500 max-w-sm md:max-w-3xl mx-auto leading-relaxed">{sub}</p>}
      </div>
    );
  }

  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <div ref={ref} className="text-center mb-8 md:mb-12 px-2">
      <motion.p initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">{label}</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.07 }}
        className="text-[clamp(26px,4vw,52px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
        {title}{' '}
        <span className="relative inline-block max-w-fit">
          <span className="text-[#2a7d9c]">{accent}</span>
          <motion.span initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 2.5, delay: 0.2, ease: [0.22,1,0.36,1] }}
            className="absolute -bottom-1 left-0 right-0 h-[4px] bg-[#2a7d9c]/25 rounded-full origin-left block" />
        </span>
      </motion.h2>
      {sub && (
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          className="text-base md:text-lg text-slate-500 max-w-sm md:max-w-3xl mx-auto leading-relaxed">{sub}</motion.p>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-white text-[#0f172a] antialiased overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <HeroSection />
      <ProblemSolutionSection />
      <ApercuRapportSection />
      <AvantApresSection />
      <ForWhoSection />
      <ScoreSection />
      <HowItWorksSection />
      <AvisSection />
      <SecuriteSection />
      <FaqSection />
    </div>
  );
}

/* ═══ HERO ═══════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#f4f7f9] px-5 sm:px-10 lg:px-20 pt-16 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-[#2a7d9c]/7 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#2a7d9c]/4 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">

        {/* MOBILE */}
        <div className="flex flex-col items-center lg:hidden pt-14 pb-4">
          <motion.h1 variants={up} initial="hidden" animate="show" custom={0.5}
            className="font-black leading-[1.08] tracking-[-0.03em] text-[#0f172a] mb-4 text-center w-full px-2"
            style={{ fontSize: "clamp(26px, 6.5vw, 34px)" }}>
            Comprenez l'essentiel<br />de votre achat immobilier<br />
            <span className="relative inline-block whitespace-nowrap">
              <span className="text-[#2a7d9c]">avant de signer.</span>
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.0, duration: 1.4 }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#2a7d9c]/30 rounded-full origin-left block" />
            </span>
          </motion.h1>

          <motion.p variants={up} initial="hidden" animate="show" custom={0.8}
            className="text-[17px] text-slate-500 leading-relaxed text-center w-full px-4 mb-7">
            PV d'AG, règlement de copropriété, diagnostics, appels de charges…<br />
            <span className="font-semibold text-[#0f172a]">Comprenez l'essentiel en 30 secondes*</span><br />
            avant de faire une offre.
          </motion.p>

          {/* Téléphone à droite + badges empilés serrés à gauche — centré sur 390px */}
          <motion.div variants={up} initial="hidden" animate="show" custom={1}
            className="relative w-full mb-7" style={{ height: 310 }}>

            {/* Conteneur centré : badges (≈140px) + gap (8px) + téléphone (150px) = ~298px → centré sur 390px → ~46px de marge chaque côté */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2">

                {/* Colonne de badges */}
                <div className="flex flex-col gap-3">
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                    style={_lowPerf ? {} : { animation: "floatA 4.5s ease-in-out 0.8s infinite" }}
                    className="bg-white rounded-xl px-3 py-2.5 shadow-md border border-slate-100 flex items-center gap-2 w-[138px]">
                    <div className="w-6 h-6 rounded-lg bg-[#2a7d9c]/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={12} className="text-[#2a7d9c]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#0f172a]">100% sécurisé</p>
                      <p className="text-[9px] text-slate-400">Chiffré & supprimé</p>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.3 }}
                    style={_lowPerf ? {} : { animation: "floatB 5s ease-in-out 1.3s infinite" }}
                    className="bg-white rounded-xl px-3 py-2.5 shadow-md border border-slate-100 flex items-center gap-2 w-[138px]">
                    <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                      <TrendingUp size={12} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#0f172a]">Score 15/20</p>
                      <p className="text-[9px] text-slate-400">Bien sain ✓</p>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.8 }}
                    style={_lowPerf ? {} : { animation: "floatC 4s ease-in-out 1.8s infinite" }}
                    className="bg-white rounded-xl px-3 py-2.5 shadow-md border border-slate-100 flex items-center gap-2 w-[138px]">
                    <div className="w-6 h-6 rounded-lg bg-[#f0a500]/10 flex items-center justify-center shrink-0">
                      <FileText size={12} className="text-[#f0a500]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#0f172a]">3 docs analysés</p>
                      <p className="text-[9px] text-slate-400">PV, règlement, diag.</p>
                    </div>
                  </motion.div>
                </div>

                {/* Téléphone */}
                <PhoneMockupMini />

              </div>
            </div>

          </motion.div>

          <motion.div variants={up} initial="hidden" animate="show" custom={2}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-sm px-4">
            <Link to="/start"
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-[#0f2d3d] text-white text-base font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 flex-1">
              <ShieldCheck size={18} /> Lancer mon analyse
            </Link>
            <Link to="/exemple"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-slate-200 bg-white text-[#0f172a] text-base font-semibold hover:border-[#2a7d9c]/40 hover:bg-[#f0f8fc] transition-all duration-200 flex-1">
              Voir un exemple <ChevronRight size={16} className="text-slate-400" />
            </Link>
          </motion.div>
          <motion.p variants={up} initial="hidden" animate="show" custom={2.5}
            className="text-xs text-slate-400 mt-4 text-center max-w-[340px] italic leading-relaxed">
            * Pour les documents nativement numériques (PDF texte).
          </motion.p>
        </div>

        {/* DESKTOP */}
        <div className="hidden lg:grid grid-cols-2 gap-6 items-center">
          <div className="flex flex-col items-start text-left">
            <motion.div variants={up} initial="hidden" animate="show" custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/25 bg-white text-[#1a5e78] text-sm font-semibold mb-5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0" style={{ animation: "pulse 2s ease-in-out infinite" }} />
              Analyse immobilière intelligente
            </motion.div>

            <motion.h1 variants={up} initial="hidden" animate="show" custom={1}
              className="text-[clamp(28px,3.2vw,44px)] font-black leading-[1.1] tracking-[-0.03em] text-[#0f172a] mb-5">
              Comprenez l'essentiel{' '}<br />de votre achat immobilier{' '}
              <span className="relative inline-block">
                <span className="text-[#2a7d9c]">avant de signer.</span>
                <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 1.4 }}
                  className="absolute -bottom-1 left-0 right-0 h-[4px] bg-[#2a7d9c]/25 rounded-full origin-left block" />
              </span>
            </motion.h1>

            <motion.p variants={up} initial="hidden" animate="show" custom={1.5}
              className="text-lg font-semibold text-[#0f172a] max-w-[500px] mb-2">
              Votre futur logement analysé en{' '}
              <span className="text-[#2a7d9c]">30 secondes*</span>
            </motion.p>

            <motion.p variants={up} initial="hidden" animate="show" custom={2}
              className="text-base text-slate-500 leading-relaxed max-w-[500px] mb-8">
              Diagnostics, PV d'AG, Règlement de copropriété, Appels de fonds, Compromis de vente… Notre outil vous aide à comprendre rapidement les informations essentielles avant de signer.
            </motion.p>

            <motion.div variants={up} initial="hidden" animate="show" custom={3}
              className="flex flex-row gap-3 mb-5">
              <Link to="/start"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#0f2d3d] text-white text-base font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
                <ShieldCheck size={18} /> Lancer mon analyse
              </Link>
              <Link to="/exemple"
                className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl border border-slate-200 bg-white text-[#0f172a] text-base font-semibold hover:border-[#2a7d9c]/40 hover:bg-[#f0f8fc] transition-all duration-200">
                Voir un exemple <ChevronRight size={16} className="text-slate-400" />
              </Link>
            </motion.div>

            <motion.p variants={up} initial="hidden" animate="show" custom={3}
              className="text-xs text-slate-400 mb-7 max-w-[420px] italic leading-relaxed">
              * Pour les documents nativement numériques (PDF texte). Les documents scannés peuvent nécessiter un délai supplémentaire.
            </motion.p>

            <motion.div variants={up} initial="hidden" animate="show" custom={4}
              className="flex flex-wrap gap-5">
              {[{ I: ShieldCheck, l: "Documents chiffrés" }, { I: Trash2, l: "Suppression auto" }, { I: Clock, l: "Sans engagement" }].map(({ I, l }) => (
                <div key={l} className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                  <I size={14} className="text-slate-400 shrink-0" /> {l}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div variants={up} initial="hidden" animate="show" custom={2} className="flex justify-center">
            <PhoneMockup />
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes scanAnim { 0%{top:0%;opacity:0} 3%{opacity:1} 47%{opacity:1} 50%{top:100%;opacity:0} 51%{top:0%;opacity:0} }
        .animate-scan-phone { animation: scanAnim 3s linear infinite; }
        .animate-spin-slow { animation: spin 1s linear infinite; }
        @keyframes floatA { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-5px) translateX(2px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(6px) translateX(-2px)} }
        @keyframes floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @media (prefers-reduced-motion: reduce), (-webkit-min-device-pixel-ratio: 2) and (max-width: 768px) {
          .animate-scan-phone { animation-duration: 4s; }
          .animate-spin-slow { animation-duration: 1.5s; }
        }
      `}</style>
    </section>
  );
}

/* ═══ PHONE — état partagé ══════════════════════════════════ */
type PhoneStep = 0 | 1 | 2;

function usePhoneSteps() {
  const [step, setStep] = useState<PhoneStep>(0);
  useEffect(() => {
    if (_lowPerf) {
      // Sur mobile : un seul cycle, pas de boucle infinie
      const t1 = setTimeout(() => setStep(1), 3200);
      const t2 = setTimeout(() => setStep(2), 6800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    const t1 = setTimeout(() => setStep(1), 3200);
    const t2 = setTimeout(() => setStep(2), 6800);
    const t3 = setTimeout(() => setStep(0), 13000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, _lowPerf ? [] : [step]);
  return step;
}

const flyingDocs = [
  { label: "PV AG 2024.pdf", color: "#2a7d9c", icon: "📋", startX: -120, startY: -60, delay: 0 },
  { label: "Règlement copro.pdf", color: "#7c3aed", icon: "📑", startX: -140, startY: 20, delay: 0.4 },
  { label: "Diagnostics.pdf", color: "#f0a500", icon: "⚡", startX: -130, startY: 100, delay: 0.8 },
];

function PhoneMockup() {
  const step = usePhoneSteps();
  return (
    <div className="relative flex items-center justify-center" style={{ width: 340, height: 580 }}>

      {/* Documents qui volent (phase 0) */}
      <AnimatePresence>
        {step === 0 && flyingDocs.map((doc, i) => (
          <motion.div key={doc.label}
            initial={{ x: doc.startX, y: doc.startY, opacity: 0, scale: 0.7, rotateZ: -8 }}
            animate={{ x: 0, y: 0, opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 0.4], rotateZ: [doc.startX > 0 ? 8 : -8, 0, 0, 0] }}
            transition={{ delay: doc.delay + 1.6, duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 20 + i }}
            className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 shadow-xl border border-slate-100 min-w-[148px]">
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${doc.color}15`, border: `1px solid ${doc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
              {doc.icon}
            </div>
            <span className="text-[11px] font-semibold text-slate-700 truncate">{doc.label}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Badge sécurité */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
        style={{ animation: "floatA 4.5s ease-in-out 1.2s infinite", position: 'absolute', left: -130, top: '18%', zIndex: 30 }}
        className="hidden sm:flex bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100 items-center gap-3 min-w-[148px]">
        <div className="w-9 h-9 rounded-xl bg-[#2a7d9c]/8 flex items-center justify-center shrink-0">
          <ShieldCheck size={17} className="text-[#2a7d9c]" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#0f172a]">100% sécurisé</p>
          <p className="text-[11px] text-slate-400">Chiffré & supprimé</p>
        </div>
      </motion.div>

      {/* Badge score */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.0 }}
        style={{ animation: "floatB 5s ease-in-out 2s infinite", position: 'absolute', right: -130, bottom: '26%', zIndex: 30 }}
        className="hidden sm:flex bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100 items-center gap-3 min-w-[148px]">
        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <TrendingUp size={17} className="text-green-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#0f172a]">Score : 15/20</p>
          <p className="text-[11px] text-slate-400">Bien sain ✓</p>
        </div>
      </motion.div>

      {/* Badge docs */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.8 }}
        style={{ animation: "floatC 3.5s ease-in-out 2.8s infinite", position: 'absolute', right: -120, top: '8%', zIndex: 30 }}
        className="hidden sm:flex bg-white rounded-xl px-3.5 py-2.5 shadow-lg border border-slate-100 items-center gap-2">
        <FileText size={14} className="text-[#2a7d9c] shrink-0" />
        <span className="text-xs font-semibold text-[#0f172a]">3 docs chargés ✓</span>
      </motion.div>

      {/* Téléphone 3D */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: isIOS() ? 0.5 : 1.2, delay: isIOS() ? 0.2 : 0.4, ease: [0.22, 1, 0.36, 1] }}>
        <motion.div
          animate={isIOS()
            ? { y: [0, -6, 0] }
            : { y: [0, -10, 0], rotateY: [0, 2, 0], rotateX: [0, 1, 0] }}
          transition={isIOS()
            ? { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }
            : { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={isIOS() ? {} : { perspective: 1000, transformStyle: 'preserve-3d' }}>
        <div style={{
          width: 275, height: 580,
          background: 'linear-gradient(145deg, #1a1a2e 0%, #0f172a 100%)',
          borderRadius: 46,
          padding: 5,
          boxShadow: '0 40px 80px rgba(15,23,42,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset, 2px 2px 0 rgba(255,255,255,0.04) inset',
        }}>
          <div style={{ width: '100%', height: '100%', background: '#f8fafc', borderRadius: 42, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Status bar */}
            <div style={{ background: '#fff', padding: '10px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 64, height: 18, background: '#0f172a', borderRadius: 9 }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#cbd5e1' }}>9:41</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#cbd5e1' }}>5G ▪▪▪</span>
            </div>
            {/* App header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#0f2d3d', letterSpacing: '0.06em' }}>VERIMO</span>
              <span style={{ fontSize: 9, fontWeight: 700, background: 'rgba(42,125,156,0.1)', color: '#2a7d9c', padding: '2px 8px', borderRadius: 100 }}>Mon espace</span>
            </div>
            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <AnimatePresence mode="wait">
                {step === 0 && <PhaseUpload key="u" />}
                {step === 1 && <PhaseScan key="s" />}
                {step === 2 && <PhaseResult key="r" />}
              </AnimatePresence>
            </div>
            {/* Home indicator */}
            <div style={{ background: '#fff', padding: 8, display: 'flex', justifyContent: 'center', borderTop: '1px solid #f8fafc', flexShrink: 0 }}>
              <div style={{ width: 56, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
            </div>
          </div>
        </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Téléphone mini (mobile homepage) ─── */
function PhoneMockupMini() {
  const step = usePhoneSteps();
  return (
    <motion.div
      animate={{ y: [0, isIOS() ? -4 : -8, 0] }}
      transition={{ duration: isIOS() ? 3 : 5, repeat: Infinity, ease: "easeInOut" }}
      style={isIOS() ? {} : { perspective: 800 }}>
      <div style={{
        width: 150, height: 300,
        background: 'linear-gradient(145deg, #1a1a2e, #0f172a)',
        borderRadius: 32, padding: 4,
        boxShadow: '0 24px 56px rgba(15,23,42,0.32), 0 0 0 1px rgba(255,255,255,0.06) inset',
      }}>
        <div style={{ width: '100%', height: '100%', background: '#f8fafc', borderRadius: 29, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#fff', padding: '8px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 40, height: 13, background: '#0f172a', borderRadius: 7 }} />
            <span style={{ fontSize: 7, fontWeight: 700, color: '#cbd5e1' }}>9:41</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: '#cbd5e1' }}>5G</span>
          </div>
          <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '5px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 8, fontWeight: 900, color: '#0f2d3d', letterSpacing: '0.06em' }}>VERIMO</span>
            <span style={{ fontSize: 7, fontWeight: 700, background: 'rgba(42,125,156,0.1)', color: '#2a7d9c', padding: '1px 6px', borderRadius: 100 }}>Mon espace</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <AnimatePresence mode="wait">
              {step === 0 && <PhaseUploadMini key="u" />}
              {step === 1 && <PhaseScanMini key="s" />}
              {step === 2 && <PhaseResultMini key="r" />}
            </AnimatePresence>
          </div>
          <div style={{ background: '#fff', padding: 6, display: 'flex', justifyContent: 'center', borderTop: '1px solid #f8fafc', flexShrink: 0 }}>
            <div style={{ width: 40, height: 3, borderRadius: 2, background: '#e2e8f0' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Phase 1 : Upload avec docs qui arrivent ─── */
function PhaseUpload() {
  const docs = ["PV AG 2024.pdf", "Règlement copro.pdf", "Diagnostics.pdf"];
  const colors = ["#2a7d9c", "#7c3aed", "#f0a500"];
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProg(p => Math.min(p + 1.8, 95)), 55);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="flex-1 flex flex-col px-4 py-4">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Documents chargés</p>
      <div className="flex flex-col gap-2 mb-auto">
        {docs.map((f, i) => (
          <motion.div key={f}
            initial={{ opacity: 0, x: -30, rotateZ: -4 }}
            animate={{ opacity: 1, x: 0, rotateZ: 0 }}
            transition={{ delay: i * 0.28, type: 'spring', stiffness: 200, damping: 18 }}
            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
            <div style={{ width: 24, height: 24, borderRadius: 7, background: `${colors[i]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={11} style={{ color: colors[i] }} />
            </div>
            <span className="text-[10px] text-slate-700 font-semibold flex-1 truncate">{f}</span>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.28 + 0.4, type: 'spring' }}>
              <CheckCircle size={11} className="text-green-500 shrink-0" />
            </motion.div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-[9px] text-slate-400 font-medium">Préparation...</span>
          <span className="text-[9px] font-bold text-[#2a7d9c]">{Math.round(prog)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #2a7d9c, #7c3aed)' }}
            animate={{ width: `${prog}%` }} transition={{ duration: 0.3 }} />
        </div>
        <p className="text-[8px] text-slate-400 mt-2 text-center italic">Lancement du traitement...</p>
      </div>
    </motion.div>
  );
}

function PhaseUploadMini() {
  const docs = ["PV AG 2024.pdf", "Règlement.pdf", "Diagnostics.pdf"];
  const colors = ["#2a7d9c", "#7c3aed", "#f0a500"];
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProg(p => Math.min(p + 1.8, 95)), 55);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-3 py-3">
      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-2">Documents chargés</p>
      <div className="flex flex-col gap-1.5 mb-auto">
        {docs.map((f, i) => (
          <motion.div key={f}
            initial={{ opacity: 0, x: -20, rotateZ: -4 }}
            animate={{ opacity: 1, x: 0, rotateZ: 0 }}
            transition={{ delay: i * 0.25, type: 'spring', stiffness: 200, damping: 18 }}
            className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
            <div style={{ width: 18, height: 18, borderRadius: 5, background: `${colors[i]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={8} style={{ color: colors[i] }} />
            </div>
            <span className="text-[8px] text-slate-700 font-semibold flex-1 truncate">{f}</span>
            <CheckCircle size={8} className="text-green-500 shrink-0" />
          </motion.div>
        ))}
      </div>
      <div className="mt-3">
        <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#2a7d9c,#7c3aed)' }}
            animate={{ width: `${prog}%` }} transition={{ duration: 0.3 }} />
        </div>
        <p className="text-[7px] text-slate-400 mt-1 text-center italic">Lancement...</p>
      </div>
    </motion.div>
  );
}

/* ─── Phase 2 : Traitement ─── */
function PhaseScan() {
  const tasks = ["Lecture des pages...", "Détection des travaux votés...", "Analyse financière...", "Vérification juridique...", "Calcul du score /20..."];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone(d => Math.min(d + 1, tasks.length)), 580);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="flex-1 flex flex-col px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-[#0f172a]">Traitement en cours</p>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid #2a7d9c', borderTopColor: 'transparent' }} />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {tasks.map((t, i) => (
          <motion.div key={t} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.14 }}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-500 ${i < done ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
            {i < done
              ? <CheckCircle size={11} className="text-green-500 shrink-0" />
              : <motion.div animate={i === done ? { opacity: [1, 0.2, 1] } : { opacity: 0.25 }} transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', flexShrink: 0 }} />}
            <span className={`text-[10px] font-medium ${i < done ? 'text-green-700' : 'text-slate-500'}`}>{t}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function PhaseScanMini() {
  const tasks = ["Lecture...", "Travaux...", "Finances...", "Juridique...", "Score..."];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone(d => Math.min(d + 1, tasks.length)), 580);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-3 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[8px] font-black text-[#0f172a]">Traitement en cours</p>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #2a7d9c', borderTopColor: 'transparent' }} />
      </div>
      <div className="flex flex-col gap-1.5">
        {tasks.map((t, i) => (
          <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}
            className={`flex items-center gap-2 p-1.5 rounded-lg border ${i < done ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
            {i < done
              ? <CheckCircle size={8} className="text-green-500 shrink-0" />
              : <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2a7d9c', flexShrink: 0, opacity: 0.35 }} />}
            <span className={`text-[8px] font-medium ${i < done ? 'text-green-700' : 'text-slate-500'}`}>{t}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Phase 3 : Résultat avec score animé ─── */
function PhaseResult() {
  const r = 22, circ = 2 * Math.PI * r;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="flex-1 flex flex-col px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-[#0f172a]">Rapport Verimo</p>
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
          className="text-[8px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✓ Terminé</motion.span>
      </div>

      {/* Score card avec jauge SVG */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}
        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm mb-3">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth="5" />
            <motion.circle cx="28" cy="28" r={r} fill="none" stroke="url(#scoreGrad)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - circ * 0.74 }}
              transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }} />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2a7d9c" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>15</motion.span>
            <span style={{ fontSize: 7, color: '#94a3b8' }}>/20</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-black text-[#0f172a] mb-0.5">Bien sain ✓</p>
          <span className="text-[8px] font-bold bg-[#2a7d9c]/10 text-[#2a7d9c] px-1.5 py-0.5 rounded-full">Recommandé</span>
          <p className="text-[8px] text-slate-400 mt-1">12 rue des Lilas, Lyon</p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-1.5 flex-1">
        {[
          { icon: CheckCircle, c: "text-green-500", bg: "bg-green-50", border: "border-green-100", t: "Finances saines", s: "Fonds travaux bien dotés" },
          { icon: AlertTriangle, c: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", t: "Toiture prévue 2026", s: "~4 200€/lot" },
          { icon: CheckCircle, c: "text-green-500", bg: "bg-green-50", border: "border-green-100", t: "Aucun impayé", s: "Copro bien gérée" },
          { icon: TrendingUp, c: "text-[#2a7d9c]", bg: "bg-white", border: "border-slate-100", t: "Charges : 180€/mois", s: "Dans la moyenne" },
        ].map((it, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}
            className={`flex items-center gap-2 p-2 rounded-lg ${it.bg} border ${it.border}`}>
            <it.icon size={10} className={`${it.c} shrink-0`} />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-[#0f172a] truncate">{it.t}</p>
              <p className="text-[8px] text-slate-400 truncate">{it.s}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        className="mt-3 w-full py-2.5 rounded-xl bg-[#0f2d3d] text-white text-[9px] font-bold text-center flex items-center justify-center gap-1.5">
        <Download size={9} /> Télécharger le rapport PDF
      </motion.div>
    </motion.div>
  );
}

function PhaseResultMini() {
  const r = 15, circ = 2 * Math.PI * r;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex-1 flex flex-col px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[8px] font-black text-[#0f172a]">Rapport Verimo</p>
        <span className="text-[6px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">✓ OK</span>
      </div>
      <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 shadow-sm mb-2">
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <svg width="38" height="38" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="19" cy="19" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
            <motion.circle cx="19" cy="19" r={r} fill="none" stroke="url(#scoreGrad2)" strokeWidth="3.5" strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - circ * 0.74 }}
              transition={{ duration: 1.2, delay: 0.3 }} />
            <defs>
              <linearGradient id="scoreGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2a7d9c" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>15</span>
            <span style={{ fontSize: 6, color: '#94a3b8' }}>/20</span>
          </div>
        </div>
        <div>
          <p className="text-[8px] font-black text-[#0f172a] mb-0.5">Bien sain ✓</p>
          <span className="text-[6px] font-bold bg-[#2a7d9c]/10 text-[#2a7d9c] px-1 py-0.5 rounded-full">Recommandé</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {[
          { icon: CheckCircle, c: "text-green-500", bg: "bg-green-50", t: "Finances saines" },
          { icon: AlertTriangle, c: "text-amber-500", bg: "bg-amber-50", t: "Toiture 2026 ~4 200€" },
          { icon: CheckCircle, c: "text-green-500", bg: "bg-green-50", t: "Aucun impayé" },
        ].map((it, i) => (
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
            className={`flex items-center gap-1.5 p-1.5 rounded-lg ${it.bg}`}>
            <it.icon size={8} className={`${it.c} shrink-0`} />
            <p className="text-[8px] font-semibold text-[#0f172a] truncate">{it.t}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
        className="mt-2 w-full py-2 rounded-lg bg-[#0f2d3d] text-white text-[7px] font-bold text-center flex items-center justify-center gap-1">
        <Download size={7} /> Télécharger PDF
      </motion.div>
    </motion.div>
  );
}


/* ═══ AVANT / APRÈS ════════════════════════════════════════ */
function AvantApresSection() {

  const items = [
    { icon: '📄', before: "40 pages de PV illisibles à parcourir seul", after: "Rapport structuré et clair en 30 secondes*" },
    { icon: '⚖️', before: "Jargon juridique incompréhensible", after: "Informations clés expliquées simplement" },
    { icon: '🏗️', before: "Travaux découverts après la signature", after: "Risques et travaux détectés en amont" },
    { icon: '💰', before: "Mauvaises surprises financières", after: "Charges, fonds travaux et impayés chiffrés" },
    { icon: '🎯', before: "Décision prise dans l'incertitude totale", after: "Décision éclairée, offre négociée en confiance" },
  ];

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <SectionTitle label="Avant / Après" title="Deux façons d'acheter." accent="Une seule bonne." />

        {/* Tableau comparatif côte à côte */}
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

            {/* Colonne AVEC VERIMO — à gauche */}
            <div className="rounded-2xl overflow-hidden border border-green-100 shadow-sm">
              <div className="bg-[#0f2d3d] px-5 py-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-white font-black text-base">Avec Verimo</span>
              </div>
              <div className="bg-[#f0fdf4] p-4 flex flex-col gap-2.5">
                {items.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-green-100 shadow-sm">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 bg-green-50 border border-green-100">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#15803d] leading-snug">{item.after}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={11} className="text-white" strokeWidth={3} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Colonne SANS VERIMO — à droite */}
            <div className="rounded-2xl overflow-hidden border border-red-200 shadow-sm">
              <div className="bg-red-50 px-5 py-4 flex items-center gap-3 border-b border-red-100">
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <X size={14} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-red-700 font-black text-base">Sans Verimo</span>
              </div>
              <div className="bg-[#fff5f5] p-4 flex flex-col gap-2.5">
                {items.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.35 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-red-100">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 bg-red-50 border border-red-100">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-red-500 font-medium leading-snug line-through decoration-red-400">{item.before}</p>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                      <X size={11} className="text-white" strokeWidth={3} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </Reveal>

        <Reveal className="text-center mt-10 md:mt-12">
          <Link to="/start"
            className="inline-flex items-center gap-2 px-7 md:px-9 py-3.5 md:py-4 rounded-2xl bg-[#0f2d3d] text-white text-sm md:text-base font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            Lancer mon analyse <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ PROBLÈME + SOLUTION (fusionnées) ══════════════════════ */
function ProblemSolutionSection() {
  const items = [
    {
      emoji: '📄',
      title: "Des documents difficiles à déchiffrer",
      text: "PV d'AG, diagnostics, règlement de copropriété… Ces documents contiennent des informations cruciales, mais leur lecture demande du temps et de l'expérience. Verimo les décrypte pour vous.",
      tag: "Lisibilité",
      tagColor: '#2a7d9c',
      tagBg: 'rgba(42,125,156,0.1)',
    },
    {
      emoji: '🔧',
      title: "Des travaux déjà votés, pas toujours visibles",
      text: "Toiture, ravalement, ascenseur… Des travaux votés en assemblée générale avant votre arrivée. Verimo les détecte et vous indique ce que ça représente pour votre budget.",
      tag: "Travaux",
      tagColor: '#d97706',
      tagBg: 'rgba(217,119,6,0.1)',
    },
    {
      emoji: '💶',
      title: "Des charges à bien anticiper",
      text: "Charges mensuelles, fonds de travaux, impayés éventuels… Ces chiffres ont un impact direct sur votre budget. Verimo les ressort clairement pour que vous n'ayez pas de surprise.",
      tag: "Budget",
      tagColor: '#dc2626',
      tagBg: 'rgba(220,38,38,0.1)',
    },
    {
      emoji: '✅',
      title: "Une décision prise en toute sérénité",
      text: "Avec Verimo, vous recevez un rapport clair sur le bien qui vous intéresse. Vous savez exactement ce que vous achetez — et vous pouvez décider ou négocier en confiance.",
      tag: "Sérénité",
      tagColor: '#16a34a',
      tagBg: 'rgba(22,163,74,0.1)',
    },
  ];

  return (
    <section className="py-12 md:py-20 px-4 md:px-6" style={{ background: 'linear-gradient(180deg, #eef7f9 0%, #f4f9fb 100%)' }}>
      <div className="max-w-6xl mx-auto">

        <div style={{ fontSize: 0 }} className="[&_h2]:text-[clamp(20px,3.8vw,46px)]">
          <SectionTitle
            label="Pourquoi Verimo"
            title="Vous avez visité. Vous avez aimé."
            accent="Mais avez-vous vraiment lu ?"
            sub="Un achat immobilier, c'est des centaines de pages à parcourir. Verimo vous donne une vision complète et claire — pour décider sans stress."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {items.map((item, i) => (
            <Reveal key={i} delay={i}>
              <div className="bg-white rounded-2xl p-6 md:p-7 border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full" style={{ color: item.tagColor, background: item.tagBg }}>
                    {item.tag}
                  </span>
                </div>
                <h3 className="text-sm md:text-base font-bold text-[#0f2d3d] mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}

/* ═══ SÉCURITÉ ══════════════════════════════════════════════ */
function SecuriteSection() {
  const garanties = [
    {
      icon: Lock,
      title: "Chiffrement bout en bout",
      desc: "Vos documents sont chiffrés dès l'upload. Personne — pas même nous — ne peut accéder à leur contenu brut.",
      color: "#2a7d9c",
      bg: "rgba(42,125,156,0.08)",
    },
    {
      icon: Trash2,
      title: "Suppression automatique",
      desc: "Vos fichiers sont automatiquement supprimés de nos serveurs après traitement. Aucun stockage permanent.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.07)",
    },
    {
      icon: Eye,
      title: "Aucun partage de données",
      desc: "Vos documents ne sont jamais partagés, revendus ou utilisés à des fins commerciales. Vos données vous appartiennent.",
      color: "#0f6e56",
      bg: "rgba(15,110,86,0.08)",
    },
  ];

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          label="Sécurité & Confidentialité"
          title="Vos documents,"
          accent="protégés."
          sub="Vos documents sont sensibles. Voici exactement comment nous les protégeons."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10">
          {garanties.map((g, i) => (
            <Reveal key={i} delay={i}
              className="group p-6 md:p-7 rounded-2xl border border-slate-100 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: g.bg }}>
                <g.icon size={22} style={{ color: g.color }} />
              </div>
              <h3 className="text-sm md:text-base font-bold text-[#0f172a] mb-2">{g.title}</h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">{g.desc}</p>
            </Reveal>
          ))}
        </div>

        {/* Bandeau rassurant */}
        <Reveal>
          <div className="rounded-2xl bg-[#f4f7f9] border border-slate-100 px-6 md:px-10 py-5 md:py-6 flex flex-col md:flex-row items-center gap-4 md:gap-8 text-center md:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#2a7d9c]/10 flex items-center justify-center shrink-0 mx-auto md:mx-0">
              <ShieldCheck size={22} className="text-[#2a7d9c]" />
            </div>
            <div>
              <p className="text-base font-bold text-[#0f172a] mb-1">Conforme RGPD — Hébergement en France</p>
              <p className="text-sm text-slate-500">Vos documents immobiliers sont traités de façon sécurisée et automatiquement supprimés après génération du rapport. Aucun humain ne les consulte.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ FOR WHO ══════════════════════════════════════════════ */
function ForWhoSection() {
  return (
    <section className="py-14 md:py-24 px-4 md:px-6 bg-[#f4f7f9]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Pour qui" title="Fait pour" accent="vous." />

        {/* ─── DEUX PROFILS ACHETEURS ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* PRIMO-ACCÉDANT */}
          <Reveal>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
              {/* Header */}
              <div className="px-7 pt-7 pb-5" style={{ background: 'linear-gradient(135deg, #f0f7fb 0%, #e4f2f8 100%)' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#2a7d9c]/15 shadow-sm mb-4">
                  <span className="text-base">🏠</span>
                  <span className="text-xs font-bold text-[#2a7d9c] uppercase tracking-wide">Primo-accédant</span>
                </div>
                <h3 className="text-xl md:text-[22px] font-black text-[#0f172a] leading-tight">
                  Vous achetez pour la première fois ?<br />
                  <span className="text-[#2a7d9c]">On simplifie tout pour vous.</span>
                </h3>
              </div>

              {/* Contenu */}
              <div className="px-7 py-6 flex-1 flex flex-col">
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  PV d'assemblée générale, règlement de copropriété, diagnostics techniques… Ces documents sont complexes et vous ne les avez jamais lus. C'est normal. Verimo les analyse à votre place et vous explique l'essentiel en langage clair.
                </p>
                <div className="flex flex-col gap-3 mb-6 flex-1">
                  {[
                    { emoji: '📋', text: 'PV d\'AG traduits en français simple — fini le jargon juridique' },
                    { emoji: '🔍', text: 'Travaux votés, procédures, impayés — tout est détecté pour vous' },
                    { emoji: '⚡', text: 'DPE, amiante, électricité — chaque diagnostic expliqué clairement' },
                    { emoji: '🎯', text: 'Un score /20 pour savoir si le bien est sain ou risqué' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-base shrink-0 mt-0.5">{item.emoji}</span>
                      <span className="text-sm text-slate-600 leading-snug">{item.text}</span>
                    </div>
                  ))}
                </div>
                <Link to="/start"
                  className="inline-flex self-start items-center gap-2 px-6 py-3 rounded-xl bg-[#0f2d3d] text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                  Lancer mon analyse <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* ACHETEUR EXPÉRIMENTÉ */}
          <Reveal delay={1}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
              {/* Header */}
              <div className="px-7 pt-7 pb-5" style={{ background: 'linear-gradient(135deg, #f4f7f9 0%, #edf2f7 100%)' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm mb-4">
                  <span className="text-base">🔑</span>
                  <span className="text-xs font-bold text-[#0f2d3d] uppercase tracking-wide">Acheteur expérimenté</span>
                </div>
                <h3 className="text-xl md:text-[22px] font-black text-[#0f172a] leading-tight">
                  Vous avez déjà acheté ?<br />
                  <span className="text-[#2a7d9c]">Allez plus loin cette fois.</span>
                </h3>
              </div>

              {/* Contenu */}
              <div className="px-7 py-6 flex-1 flex flex-col">
                <p className="text-sm text-slate-500 leading-relaxed mb-5">
                  Vous connaissez le process, mais vous savez aussi que chaque bien cache des surprises. Travaux non anticipés, charges sous-estimées, DPE trompeur… Verimo vous donne les chiffres réels et les risques concrets pour négocier en position de force.
                </p>
                <div className="flex flex-col gap-3 mb-6 flex-1">
                  {[
                    { emoji: '💰', text: 'Charges réelles, fonds travaux, appels de fonds — votre vrai budget' },
                    { emoji: '🏗️', text: 'Travaux votés non encore réalisés — anticipez l\'impact financier' },
                    { emoji: '⚖️', text: 'Procédures judiciaires en cours — sachez avant de signer' },
                    { emoji: '📤', text: 'Rapport partageable avec votre notaire pour négocier le prix' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-base shrink-0 mt-0.5">{item.emoji}</span>
                      <span className="text-sm text-slate-600 leading-snug">{item.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <Link to="/start"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0f2d3d] text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                    Lancer mon analyse <ArrowRight size={14} />
                  </Link>
                  <Link to="/exemple"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#2a7d9c] hover:underline">
                    Voir un exemple <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* ─── PRO — bandeau compact ─── */}
        <Reveal className="mt-2">
          <div className="rounded-2xl overflow-hidden flex flex-col md:flex-row items-center gap-6 px-7 py-6 md:px-10 md:py-7"
            style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a4a5e)' }}>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Briefcase size={18} className="text-white/80" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Offre Professionnelle</h4>
                <p className="text-xs text-white/50">Agents, investisseurs, notaires</p>
              </div>
            </div>
            <p className="text-sm text-white/50 leading-relaxed flex-1 text-center md:text-left">
              Tarifs volume, rapport co-brandable, accompagnement dédié — une offre adaptée à votre métier.
            </p>
            <Link to="/pro"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shrink-0 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              style={{ background: '#fff', color: '#0f2d3d' }}>
              Découvrir <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ HOW IT WORKS ══════════════════════════════════════════ */
function HowItWorksSection() {
  const refMobile = useRef(null);
  const refDesktop = useRef(null);
  const inViewMobile = useInView(refMobile, { once: true, margin: "-40px" });
  const inViewDesktop = useInView(refDesktop, { once: true, margin: "-60px" });

  const steps = [
    {
      n: "01", color: "#2a7d9c", bg: "rgba(42,125,156,0.08)", border: "rgba(42,125,156,0.18)",
      title: "Déposez vos documents",
      desc: "Tout document lié à votre futur logement : PV d'AG, diagnostics, règlement, DPE, compromis… en quelques clics.",
      icon: (<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3M6.5 20h11A2.5 2.5 0 0 0 20 17.5v-11A2.5 2.5 0 0 0 17.5 4h-7L6 8.5V17.5A2.5 2.5 0 0 0 8.5 20Z" /></svg>),
    },
    {
      n: "02", color: "#2a7d9c", bg: "rgba(42,125,156,0.08)", border: "rgba(42,125,156,0.18)",
      title: "Notre outil traite tout",
      desc: "Chaque page lue, chaque risque détecté, chaque charge estimée. Rapide et automatique.",
      icon: (<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>),
    },
    {
      n: "03", color: "#2a7d9c", bg: "rgba(42,125,156,0.08)", border: "rgba(42,125,156,0.18)",
      title: "Rapport clair & actionnable",
      desc: "Score /20, points de vigilance, travaux votés, impact financier. Disponible dans votre espace.",
      icon: (<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>),
    },
    {
      n: "04", color: "#2a7d9c", bg: "rgba(42,125,156,0.08)", border: "rgba(42,125,156,0.18)",
      title: "Téléchargez en PDF",
      desc: "Exportez votre rapport complet et partagez-le avec votre agent, notaire ou banque.",
      icon: (<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.7" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>),
    },
  ];

  return (
    <section className="py-12 md:py-18 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Comment ça marche" title="Quatre étapes," accent="c'est tout."
          sub="Pas de formation, pas de jargon. Vous déposez vos fichiers — on fait le reste." />

        <div className="flex flex-col md:hidden" ref={refMobile}>
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={inViewMobile ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.12, duration: 0.45 }}
              className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
                  style={{ background: s.bg, borderColor: s.border }}>
                  <span className="text-sm font-black" style={{ color: s.color }}>{s.n}</span>
                </div>
                {i < steps.length - 1 && (
                  <motion.div className="w-px min-h-[36px] flex-1 mt-1.5 mb-1.5 rounded-full"
                    style={{ background: "linear-gradient(to bottom, rgba(42,125,156,0.3), rgba(42,125,156,0.05))" }}
                    initial={{ scaleY: 0, transformOrigin: "top" }}
                    animate={inViewMobile ? { scaleY: 1 } : {}}
                    transition={{ delay: i * 0.12 + 0.2, duration: 0.35 }} />
                )}
              </div>
              <div className="pb-6 pt-1 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div style={{ color: s.color }}>{s.icon}</div>
                  <h3 className="text-base font-bold text-[#0f172a]">{s.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="hidden md:block" ref={refDesktop}>
          <div className="relative flex items-center justify-between mb-8 px-[56px]">
            <div className="absolute inset-x-[56px] top-1/2 -translate-y-1/2 h-px bg-slate-200" />
            <motion.div
              className="absolute left-[56px] top-1/2 -translate-y-1/2 h-[2px] rounded-full bg-[#2a7d9c]/40"
              initial={{ width: 0 }}
              animate={inViewDesktop ? { width: "calc(100% - 112px)" } : {}}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} />
            {steps.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={inViewDesktop ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.15 + 0.15, duration: 0.35, ease: "backOut" }}
                className="relative z-10 flex flex-col items-center gap-2.5">
                <div className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center bg-white shadow-md"
                  style={{ borderColor: s.border, color: s.color }}>
                  {s.icon}
                </div>
                <span className="text-xs font-black text-[#2a7d9c] bg-[#2a7d9c]/8 px-2.5 py-0.5 rounded-full">{s.n}</span>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={inViewDesktop ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12 + 0.4, duration: 0.45 }}
                className="rounded-2xl p-6 bg-[#f4f7f9] border border-slate-100 hover:border-[#2a7d9c]/20 hover:bg-[#eef6fb] hover:-translate-y-1 transition-all duration-200 cursor-default">
                <div className="flex items-center gap-2 mb-3" style={{ color: s.color }}>
                  {s.icon}
                  <span className="text-xs font-black text-[#2a7d9c]">{s.n}</span>
                </div>
                <h3 className="text-base font-bold text-[#0f172a] mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <Reveal className="text-center mt-10 md:mt-12">
          <Link to="/start"
            className="inline-flex items-center gap-2 px-7 md:px-10 py-3.5 md:py-4 rounded-2xl bg-[#0f2d3d] text-white text-sm md:text-base font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            Essayer maintenant — dès 4,90€ <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ APERÇU DU RAPPORT ═════════════════════════════════════ */
function ApercuRapportSection() {
  const points = [
    { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "Finances saines", detail: "Fonds travaux bien dotés — 85 000€" },
    { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "Syndic réactif — mandat renouvelé", detail: "Aucune tension détectée sur 3 ans" },
    { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", label: "Ravalement voté 2025 — charge vendeur", detail: "Voté avant le compromis → à la charge du vendeur" },
    { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "Participation AG : 68% des tantièmes", detail: "Tendance stable sur 3 ans" },
    { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "DPE classé C — valide depuis 2022", detail: "Chauffage individuel gaz — maîtrise des charges" },
    { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "Aucune procédure judiciaire", detail: "Situation juridique nette" },
    { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "Fonds travaux ALUR : 3 200€ récupérables", detail: "Cette somme vous revient à l'acte authentique" },
    { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", label: "Location Airbnb interdite", detail: "Restriction détectée dans le règlement de copropriété" },
  ];

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-[#f4f7f9]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Exemple de rapport" title="Ce que vous" accent="recevez."
          sub="Voici ce que Verimo vous fournit en moins de 30 secondes*." />

        <Reveal>
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

            {/* Header rapport */}
            <div className="bg-[#0f2d3d] px-6 md:px-10 py-5 md:py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Rapport Verimo — Analyse complète</p>
                <p className="text-white font-black text-lg md:text-xl">12 rue des Lilas, 69003 Lyon</p>
                <p className="text-white/40 text-sm mt-0.5">Analysé le 28 mars 2026 · 3 documents</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                    <motion.circle cx="40" cy="40" r="32" fill="none" stroke="#2a7d9c" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={201} initial={{ strokeDashoffset: 201 }}
                      whileInView={{ strokeDashoffset: 201 - 201 * 0.75 }} viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: 0.3 }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl md:text-2xl font-black text-white leading-none">15</span>
                    <span className="text-[10px] text-white/40">/20</span>
                  </div>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-bold mb-1">✓ Recommandé</span>
                  <p className="text-white/60 text-xs">Bien sain ✓</p>
                </div>
              </div>
            </div>

            {/* Corps du rapport */}
            <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">

              {/* Points clés */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Points détectés</h4>
                <div className="flex flex-col gap-2.5">
                  {points.map((p, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border ${p.bg} ${p.border}`}>
                      <p.icon size={15} className={`${p.color} shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#0f172a] truncate">{p.label}</p>
                        <p className="text-xs text-slate-500 truncate">{p.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Données financières + recommandation */}
              <div className="flex flex-col gap-5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Données financières</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Charges mensuelles", val: "180 €/mois" },
                      { label: "Fonds travaux ALUR", val: "85 000 €" },
                      { label: "Travaux votés", val: "~7 000 €/lot" },
                      { label: "Honoraires syndic", val: "8 400 €/an" },
                      { label: "Type chauffage", val: "Individuel gaz" },
                      { label: "Quote-part lot", val: "312/10 000" },
                    ].map((d, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-[#f4f7f9] border border-slate-100">
                        <p className="text-[11px] text-slate-400 font-medium mb-1">{d.label}</p>
                        <p className="text-base font-black text-[#0f172a]">{d.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#0f2d3d]/5 border border-[#0f2d3d]/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#2a7d9c] mb-2">Avis Verimo</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Ce bien présente une copropriété globalement saine. Les travaux de toiture votés représentent une charge à anticiper. Le ratio charges/fonds travaux est satisfaisant. <span className="font-semibold text-[#0f172a]">Recommandé à l'achat avec négociation possible.</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-[#f4f7f9] border border-slate-100">
                  <Download size={16} className="text-[#2a7d9c] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">Rapport PDF complet</p>
                    <p className="text-xs text-slate-400">Téléchargeable · Partageable avec votre notaire</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="text-center mt-8">
          <Link to="/exemple"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-slate-200 bg-white text-[#0f172a] text-sm font-bold hover:border-[#2a7d9c]/40 hover:bg-[#f0f8fc] transition-all duration-200">
            Voir un exemple complet interactif <ChevronRight size={16} className="text-slate-400" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ SCORE /20 ══════════════════════════════════════════════ */
function AvisSection() {
  const avis = [
    {
      nom: 'Sophie M.',
      ville: 'Paris 11e',
      note: 5,
      texte: "J'ai uploadé le PV d'AG et le règlement de copropriété avant de faire mon offre. Verimo m'a signalé un ravalement voté non réalisé et des impayés sur 2 lots. J'ai pu négocier 8 000€ de moins. Indispensable.",
      profil: 'Acheteuse — appartement 3 pièces',
      initiale: 'S',
      color: '#2a7d9c',
    },
    {
      nom: 'Thomas R.',
      ville: 'Lyon 6e',
      note: 5,
      texte: "Le DPE de l'appartement que je visitais datait de 2019 — Verimo m'a alerté qu'il était invalide et qu'un nouveau diagnostic était obligatoire. Le vendeur ne le savait même pas. Ça m'a évité une mauvaise surprise.",
      profil: 'Acheteur — primo-accédant',
      initiale: 'T',
      color: '#7c3aed',
    },
    {
      nom: 'Camille D.',
      ville: 'Bordeaux',
      note: 5,
      texte: "En 30 secondes j'avais un rapport complet sur la copropriété. La participation aux AG, le syndic, les travaux votés, les charges… tout était là. J'ai partagé le rapport avec mon notaire qui a été bluffé.",
      profil: 'Acheteuse — investissement locatif',
      initiale: 'C',
      color: '#16a34a',
    },
    {
      nom: 'Marc L.',
      ville: 'Nantes',
      note: 5,
      texte: "J'étais stressé à l'idée de rater quelque chose dans les documents. Verimo m'a donné une vision claire et structurée. Le score /20 et l'avis Verimo m'ont vraiment aidé à prendre ma décision sereinement.",
      profil: 'Acheteur — résidence principale',
      initiale: 'M',
      color: '#d97706',
    },
  ];

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-[#f4f7f9]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Ils ont utilisé Verimo" title="Ce qu'ils en" accent="pensent." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {avis.map((a, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-4 h-full">
                {/* Étoiles */}
                <div className="flex gap-1">
                  {Array.from({ length: a.note }).map((_, j) => (
                    <span key={j} className="text-amber-400 text-base">★</span>
                  ))}
                </div>
                {/* Texte */}
                <p className="text-sm md:text-base text-slate-600 leading-relaxed flex-1">"{a.texte}"</p>
                {/* Auteur */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-base shrink-0"
                    style={{ background: a.color }}>
                    {a.initiale}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0f172a]">{a.nom} <span className="text-slate-400 font-normal">· {a.ville}</span></div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.profil}</div>
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

function ScoreSection() {
  const levels = [
    { r: '17 – 20', l: 'Bien irréprochable', c: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
    { r: '14 – 16', l: 'Bien sain', c: '#16a34a', bg: '#f0fdf4', border: '#d1fae5' },
    { r: '10 – 13', l: 'Bien correct avec réserves', c: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { r: '7 – 9',   l: 'Bien risqué', c: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    { r: '0 – 6',   l: 'Bien à éviter', c: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  ];
  const cats = [
    { emoji: '🏗️', label: 'Travaux', pts: 5 },
    { emoji: '⚖️', label: 'Procédures', pts: 4 },
    { emoji: '💰', label: 'Finances', pts: 4 },
    { emoji: '🏠', label: 'Diagnostics privatifs', pts: 4 },
    { emoji: '🏢', label: 'Diagnostics communs', pts: 3 },
  ];
  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-[#f4f7f9]">
      <div className="max-w-5xl mx-auto">
        <SectionTitle label="Notre méthode" title="Un score objectif" accent="sur 20 points." sub="Chaque bien reçoit une note calculée à partir de 5 catégories analysées dans vos documents. Transparent, reproductible, actionnable." />

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">

          {/* Gauche — catégories */}
          <Reveal>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <p className="text-xs font-bold text-[#2a7d9c] uppercase tracking-widest">5 catégories analysées</p>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {cats.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-sm font-700 text-[#0f172a] font-semibold">{cat.label}</span>
                    </div>
                    <span className="text-sm font-black text-[#2a7d9c]">{cat.pts} pts</span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-5 pt-2">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#0f2d3d] text-white">
                  <span className="text-sm font-bold">Total</span>
                  <span className="text-base font-black">20 pts</span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Droite — échelle */}
          <Reveal delay={1}>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <p className="text-xs font-bold text-[#2a7d9c] uppercase tracking-widest">L'échelle des notes</p>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {levels.map((level, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: level.bg, border: `1px solid ${level.border}` }}>
                    <span className="text-base font-black min-w-[70px]" style={{ color: level.c }}>{level.r}</span>
                    <span className="text-sm font-semibold" style={{ color: level.c }}>{level.l}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-5 pt-2">
                <Link to="/methode"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-[#2a7d9c] border border-[#2a7d9c]/20 bg-[#2a7d9c]/5 hover:bg-[#2a7d9c]/10 transition-colors">
                  Voir la méthode complète <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ═══ FAQ ════════════════════════════════════════════════════ */
function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "Mes documents sont-ils supprimés après traitement ?",
      emoji: "🔒",
      a: "Oui, automatiquement et immédiatement. Vos fichiers sont chiffrés dès l'upload et supprimés de nos serveurs dès que votre rapport est généré. Aucun stockage permanent — seul le rapport final est conservé dans votre espace personnel. Aucun humain ne consulte vos documents.",
    },
    {
      q: "Ça fonctionne avec tous les types de documents ?",
      emoji: "📄",
      a: "Verimo traite les PDF nativement numériques (fichiers texte exportés depuis Word, Adobe, etc.) en moins de 30 secondes*. Les documents scannés ou photographiés peuvent nécessiter un délai supplémentaire selon la qualité. Les formats Word, JPEG ou PNG ne sont pas pris en charge — convertissez-les d'abord en PDF.",
    },
    {
      q: "Et si je n'ai qu'un seul document ?",
      emoji: "📋",
      a: "L'analyse simple à 4,90€ est faite exactement pour ça. Elle analyse un seul document (PV d'AG, DPE, règlement de copropriété…) et vous donne les informations clés, les points forts et les vigilances détectés — sans score /20. L'analyse complète à 19,90€ accepte plusieurs documents et génère un score global du bien.",
    },
    {
      q: "Le rapport est-il garanti exact ?",
      emoji: "⚖️",
      a: "Notre outil analyse les informations présentes dans vos documents avec soin, mais il reste un outil d'aide à la décision. Il travaille sur ce que vous lui transmettez — si un document est manquant, l'analyse sera partielle. Nous recommandons de confirmer les éléments importants avec un professionnel (notaire, avocat) avant toute signature.",
    },
    {
      q: "Puis-je partager le rapport avec mon notaire ou mon banquier ?",
      emoji: "📤",
      a: "Absolument. Le rapport est téléchargeable en PDF et peut être partagé librement avec qui vous le souhaitez. De nombreux utilisateurs l'envoient à leur notaire avant la signature, ou l'utilisent pour justifier une demande de baisse de prix auprès du vendeur ou de son agent.",
    },
    {
      q: "Comment fonctionne la comparaison de biens ?",
      emoji: "⚖️",
      a: "La comparaison se débloque automatiquement dès que votre compte contient au minimum 2 analyses complètes — que vous les ayez achetées via un Pack ou séparément. Dans votre tableau de bord, l'onglet 'Comparer mes biens' s'active et vous pouvez sélectionner les biens à comparer côte à côte. Le Pack 3 biens permet en plus un classement automatique des 3 biens.",
    },
    {
      q: "Mes crédits ont-ils une date d'expiration ?",
      emoji: "♾️",
      a: "Non, jamais. Vos crédits sont valables indéfiniment. Vous pouvez acheter un Pack aujourd'hui et l'utiliser dans 6 mois — ils vous attendent. Il n'y a aucune pression temporelle.",
    },
  ];

  return (
    <section className="py-12 md:py-20 px-4 md:px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <SectionTitle label="Questions fréquentes" title="Vos questions," accent="nos réponses." />

        <div className="flex flex-col gap-2.5">
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <div className={`rounded-2xl border bg-white overflow-hidden transition-all duration-200 ${open === i ? 'border-[#2a7d9c]/40 shadow-md' : 'border-slate-100 shadow-sm'}`}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center gap-4 px-5 md:px-6 py-4 md:py-5 text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base transition-colors"
                    style={{ background: open === i ? 'rgba(42,125,156,0.1)' : '#f8fafc', border: open === i ? '1px solid rgba(42,125,156,0.2)' : '1px solid #edf2f7' }}>
                    {faq.emoji}
                  </div>
                  <span className="text-sm md:text-base font-bold text-[#0f172a] flex-1">{faq.q}</span>
                  <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                    <ChevronDown size={18} className={open === i ? 'text-[#2a7d9c]' : 'text-slate-300'} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <div className="px-5 md:px-6 pb-5 pt-1 text-sm md:text-base text-slate-500 leading-relaxed border-t border-slate-50 pl-[72px]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center mt-10">
          <p className="text-sm text-slate-400 mb-4">Vous avez une autre question ?</p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-[#0f172a] text-sm font-semibold hover:border-[#2a7d9c]/40 hover:bg-[#f0f8fc] transition-all duration-200">
            Contactez-nous <ArrowRight size={15} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
