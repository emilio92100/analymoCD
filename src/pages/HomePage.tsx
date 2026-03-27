import { useEffect, useRef, useState } from "react";
import type { Variants } from "framer-motion";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, CheckCircle, AlertTriangle, FileText,
  Zap, Shield, BarChart3, Upload, Sparkles, ChevronRight,
  TrendingUp, Home, Clock, Star, Check, X,
} from "lucide-react";

/* ─── fade-up variant ─── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] } }),
};

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section ref={ref} initial="hidden" animate={inView ? "show" : "hidden"} className={className}>
      {children}
    </motion.section>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased overflow-x-hidden">
      <HeroSection />
      <ProblemsSection />
      <SolutionSection />
      <HowItWorksSection />
      <ProductSection />
      <AvantApresSection />
      <TestimonialsSection />
      <LaunchSection />
      <FooterSection />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO
═══════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f0f8fc] via-white to-white" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[#2a7d9c]/5 blur-[100px] pointer-events-none" />

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(42,125,156,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(42,125,156,0.04) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto w-full">
        {/* Badge */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/20 bg-white/80 backdrop-blur-sm text-[#1a5e78] text-sm font-semibold mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
          Analyse documentaire immobilière · Dès 4,99€
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
          className="text-[clamp(36px,6.5vw,80px)] font-black leading-[1.05] tracking-tight text-[#0f172a] mb-6">
          Comprenez un bien<br />
          <span className="relative inline-block">
            <span className="relative z-10 text-[#2a7d9c]">immobilier</span>
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
              className="absolute bottom-1 left-0 right-0 h-[5px] bg-[#2a7d9c]/20 rounded-full origin-left" />
          </span>{" "}
          en quelques secondes.
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
          className="text-[clamp(16px,1.8vw,20px)] text-slate-500 leading-relaxed max-w-xl mb-10 font-normal">
          Analymo analyse vos documents immobiliers et vous révèle les informations
          essentielles avant d'acheter — sans jargon, sans effort.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
          className="flex flex-col sm:flex-row gap-3 mb-12 w-full sm:w-auto">
          <Link to="/tarifs"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#0f2d3d] text-white text-base font-bold shadow-lg shadow-[#0f2d3d]/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#0f2d3d]/25 transition-all duration-200">
            Lancer mon analyse <ArrowRight size={18} />
          </Link>
          <Link to="/exemple"
            className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl border border-slate-200 text-[#0f172a] text-base font-semibold bg-white hover:border-[#2a7d9c]/40 hover:bg-[#f0f8fc] transition-all duration-200">
            Voir un exemple
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
          className="flex items-center gap-3 mb-16">
          <div className="flex -space-x-2">
            {["#2a7d9c", "#0f2d3d", "#0f6e56", "#7c3aed", "#c2410c"].map((bg, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white"
                style={{ background: bg }}>
                {["ML", "TR", "SD", "CB", "PG"][i]}
              </div>
            ))}
          </div>
          <div className="text-left">
            <div className="flex gap-0.5 mb-0.5">
              {[0,1,2,3,4].map(j => <Star key={j} size={12} fill="#f59e0b" color="#f59e0b" />)}
            </div>
            <p className="text-sm text-slate-500"><strong className="text-[#0f172a] font-bold">+200 acheteurs</strong> font confiance à Analymo</p>
          </div>
        </motion.div>

        {/* Phone mockup */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5} className="w-full flex justify-center">
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Phone ─── */
function PhoneMockup() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 2000);
    const t2 = setTimeout(() => setStep(2), 4000);
    const t3 = setTimeout(() => { setStep(0); }, 8500);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [step]);

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute inset-0 blur-3xl bg-[#2a7d9c]/10 rounded-full scale-75 pointer-events-none" />

      {/* Floating pills */}
      <motion.div animate={{ y: [0, -8, 0], x: [0, 4, 0] }} transition={{ duration: 4, repeat: Infinity }}
        className="absolute -left-4 sm:-left-16 top-1/4 bg-white rounded-2xl px-3 py-2.5 shadow-xl border border-slate-100 flex items-center gap-2.5 z-20 whitespace-nowrap">
        <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
          <TrendingUp size={15} className="text-green-500" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-800 leading-tight">Score global</p>
          <p className="text-lg font-black text-green-500 leading-tight">78<span className="text-xs text-slate-400 font-normal">/100</span></p>
        </div>
      </motion.div>

      <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        className="absolute -right-4 sm:-right-16 bottom-1/3 bg-white rounded-2xl px-3 py-2.5 shadow-xl border border-slate-100 flex items-center gap-2.5 z-20 whitespace-nowrap">
        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
          <AlertTriangle size={15} className="text-amber-500" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-800 leading-tight">Vigilance</p>
          <p className="text-xs text-slate-500 leading-tight">Ravalement 2026</p>
        </div>
      </motion.div>

      <motion.div animate={{ y: [0,-6,0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 2 }}
        className="absolute -right-2 sm:-right-12 top-1/5 bg-white rounded-xl px-3 py-2 shadow-lg border border-slate-100 flex items-center gap-2 z-20">
        <span className="text-sm">⚡</span>
        <span className="text-xs font-bold text-amber-500">1 min 47s</span>
      </motion.div>

      {/* Phone shell */}
      <motion.div
        animate={{ rotateY: [3, -3, 3], rotateX: [-1, 1, -1], y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative z-10"
      >
        <div className="w-[230px] sm:w-[260px] h-[480px] sm:h-[540px] bg-[#0f172a] rounded-[44px] p-[5px] shadow-[0_32px_80px_rgba(15,23,42,0.35)] ring-1 ring-white/10">
          <div className="w-full h-full bg-slate-50 rounded-[40px] overflow-hidden relative">
            {/* Dynamic island */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#0f172a] rounded-full z-10" />

            {/* Status */}
            <div className="pt-2 px-5 flex justify-between text-[9px] font-bold text-slate-400">
              <span>9:41</span><span>5G ▪▪▪</span>
            </div>

            {/* Content */}
            <div className="px-3.5 pt-7 pb-4 h-full overflow-hidden">
              <AnimatePresence mode="wait">
                {step === 0 && <PhaseUpload key="upload" />}
                {step === 1 && <PhaseScan key="scan" />}
                {step === 2 && <PhaseResult key="result" />}
              </AnimatePresence>
            </div>

            {/* Home bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-slate-300" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PhaseUpload() {
  const [prog, setProg] = useState(0);
  useEffect(() => { const t = setInterval(() => setProg(p => Math.min(p + 4, 92)), 65); return () => clearInterval(t); }, []);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <p className="text-[10px] font-black text-slate-800 mb-3">ANALYMO</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chargement documents</p>
      {["PV AG 2024.pdf", "Règlement copro.pdf", "Diagnostics.pdf"].map((f, i) => (
        <motion.div key={f} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.3 }}
          className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-100 mb-2 shadow-sm">
          <FileText size={10} className="text-[#2a7d9c] shrink-0" />
          <span className="text-[10px] text-slate-700 font-semibold flex-1 truncate">{f}</span>
          <CheckCircle size={10} className="text-green-500" />
        </motion.div>
      ))}
      <div className="mt-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-[9px] text-slate-400">Préparation...</span>
          <span className="text-[9px] font-bold text-[#2a7d9c]">{prog}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-[#2a7d9c] to-[#0f2d3d] transition-all" style={{ width: `${prog}%` }} />
        </div>
      </div>
    </motion.div>
  );
}

function PhaseScan() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#2a7d9c]/70 to-transparent animate-scan z-10" style={{ top: 0 }} />
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] font-black text-slate-800">Analyse en cours</p>
        <div className="w-3.5 h-3.5 border-2 border-[#2a7d9c] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-[9px] text-slate-400 mb-3">104 pages en lecture</p>
      {["Détection travaux votés...", "Analyse financière...", "Vérification juridique...", "Calcul du score..."].map((t, i) => (
        <motion.div key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4 }}
          className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
          <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            className="w-1.5 h-1.5 rounded-full bg-[#2a7d9c] shrink-0" />
          <span className="text-[10px] text-slate-600">{t}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function PhaseResult() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex justify-between items-center mb-2.5">
        <p className="text-[10px] font-black text-slate-800">Rapport Analymo</p>
        <span className="text-[8px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✓ Terminé</span>
      </div>
      {/* Score */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0f2d3d] to-[#1a4a60] p-4 text-center mb-2.5">
        <p className="text-[8px] font-bold text-white/40 uppercase tracking-wider mb-1">Score global</p>
        <motion.p initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="text-5xl font-black text-[#f0a500] leading-none">78</motion.p>
        <p className="text-[9px] text-white/40 mt-1">sur 100 · Négocier le prix</p>
      </div>
      {/* Bars */}
      {[{ l: "Financier", v: 68, c: "#f0a500" }, { l: "Travaux", v: 62, c: "#fb923c" }, { l: "Juridique", v: 88, c: "#22c55e" }].map((s, i) => (
        <div key={s.l} className="mb-2">
          <div className="flex justify-between mb-1"><span className="text-[9px] text-slate-500">{s.l}</span><span className="text-[9px] font-bold" style={{ color: s.c }}>{s.v}</span></div>
          <div className="h-1 rounded-full bg-slate-200">
            <motion.div initial={{ width: 0 }} animate={{ width: `${s.v}%` }} transition={{ delay: i * 0.1 + 0.2, duration: 0.7 }}
              className="h-full rounded-full" style={{ background: s.c }} />
          </div>
        </div>
      ))}
      {/* Alert */}
      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="mt-2.5 flex gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200">
        <AlertTriangle size={10} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-800 leading-tight">Ravalement façade voté — prévoir ~2 400€ en 2026</p>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROBLEMS
═══════════════════════════════════════════════════════ */
function ProblemsSection() {
  const problems = [
    { icon: FileText, title: "Documents incompréhensibles", desc: "Des PV de 40 pages remplis de jargon juridique que personne ne lit vraiment.", color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
    { icon: AlertTriangle, title: "Travaux cachés", desc: "Des ravalement, toitures ou ascenseurs votés que vous découvrez après la signature.", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    { icon: TrendingUp, title: "Charges sous-estimées", desc: "Des charges bien plus élevées que prévu qui plombent la rentabilité de votre achat.", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
    { icon: Clock, title: "Décisions prises trop vite", desc: "Sous la pression du marché, vous signez sans avoir eu le temps de vraiment analyser.", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  ];

  return (
    <Section className="py-24 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <p className="text-[#2a7d9c] font-bold text-sm uppercase tracking-widest mb-4">Le problème</p>
          <h2 className="text-[clamp(28px,4vw,48px)] font-black tracking-tight text-[#0f172a] mb-4 leading-tight">
            Acheter un bien aujourd'hui,<br className="hidden sm:block" /> c'est risqué.
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            L'immobilier est l'investissement d'une vie. Pourtant, la plupart des acheteurs signent sans avoir lu ni compris les documents essentiels.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {problems.map((p, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className={`p-6 rounded-2xl bg-white border ${p.border} shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200`}>
              <div className={`w-10 h-10 rounded-xl ${p.bg} flex items-center justify-center mb-4`}>
                <p.icon size={20} className={p.color} />
              </div>
              <h3 className="text-base font-bold text-[#0f172a] mb-2">{p.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   SOLUTION
═══════════════════════════════════════════════════════ */
function SolutionSection() {
  const features = [
    { icon: Zap, title: "Analyse automatique", desc: "Déposez vos documents — PV d'AG, diagnostics, règlement. Notre moteur fait tout le travail en quelques secondes.", c: "#2a7d9c", bg: "from-[#2a7d9c]/8 to-transparent" },
    { icon: Shield, title: "Détection des risques", desc: "Travaux votés, impayés, procédures judiciaires, charges futures — rien ne passe à travers les mailles.", c: "#ef4444", bg: "from-red-500/8 to-transparent" },
    { icon: BarChart3, title: "Synthèse ultra-claire", desc: "Un score global, des points de vigilance classés, une recommandation. Tout ce qu'il faut pour décider.", c: "#22c55e", bg: "from-green-500/8 to-transparent" },
  ];

  return (
    <Section className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <p className="text-[#2a7d9c] font-bold text-sm uppercase tracking-widest mb-4">La solution</p>
          <h2 className="text-[clamp(28px,4vw,48px)] font-black tracking-tight text-[#0f172a] mb-4 leading-tight">
            Analymo vous simplifie tout.
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            En moins de 2 minutes, vous savez exactement dans quoi vous mettez les pieds.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}
              className="relative p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:-translate-y-1.5 hover:shadow-lg transition-all duration-200 overflow-hidden group">
              <div className={`absolute inset-0 bg-gradient-to-br ${f.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-slate-50 border border-slate-100">
                  <f.icon size={22} style={{ color: f.c }} />
                </div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOW IT WORKS
═══════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    { n: "01", I: Upload, title: "Uploadez vos documents", desc: "PV d'AG, règlement de copropriété, diagnostics, appels de charges. PDF ou image.", c: "#2a7d9c" },
    { n: "02", I: Sparkles, title: "Analyse automatique", desc: "Notre moteur lit, extrait et analyse chaque information pertinente en quelques secondes.", c: "#0f2d3d" },
    { n: "03", I: CheckCircle, title: "Décidez en confiance", desc: "Score global, alertes prioritaires, recommandation. Vous savez exactement quoi faire.", c: "#22c55e" },
  ];

  return (
    <Section className="py-24 px-4 bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <p className="text-[#2a7d9c] font-bold text-sm uppercase tracking-widest mb-4">Comment ça marche</p>
          <h2 className="text-[clamp(28px,4vw,48px)] font-black tracking-tight text-[#0f172a] mb-4 leading-tight">
            Trois étapes. Deux minutes.
          </h2>
          <p className="text-lg text-slate-500 max-w-lg mx-auto">
            Pas de formation, pas de jargon. Vous déposez — Analymo fait tout le reste.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[17%] right-[17%] h-px bg-gradient-to-r from-[#2a7d9c]/30 via-[#2a7d9c]/60 to-[#22c55e]/30" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="flex flex-col items-center text-center">
                {/* Circle with number */}
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center relative z-10">
                    <s.I size={28} style={{ color: s.c }} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0f172a] flex items-center justify-center">
                    <span className="text-white text-[9px] font-black">{s.n}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#0f172a] mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[220px]">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div variants={fadeUp} className="text-center mt-12">
          <Link to="/tarifs"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#0f172a] text-white text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            Essayer maintenant — dès 4,99€ <ChevronRight size={16} />
          </Link>
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   PRODUCT SECTION
═══════════════════════════════════════════════════════ */
function ProductSection() {
  const items = [
    { icon: CheckCircle, label: "DPE classe C — conforme", type: "ok" },
    { icon: CheckCircle, label: "Finances copro saines", type: "ok" },
    { icon: AlertTriangle, label: "Ravalement voté — ~2 400€ (2026)", type: "warn" },
    { icon: AlertTriangle, label: "Fonds travaux insuffisants", type: "warn" },
  ];

  return (
    <Section className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeUp}>
            <p className="text-[#2a7d9c] font-bold text-sm uppercase tracking-widest mb-4">Visuel produit</p>
            <h2 className="text-[clamp(26px,3.5vw,44px)] font-black tracking-tight text-[#0f172a] mb-5 leading-tight">
              Un rapport limpide,<br />
              <span className="text-[#2a7d9c]">actionnable immédiatement.</span>
            </h2>
            <p className="text-base text-slate-500 leading-relaxed mb-8">
              Fini les documents incompréhensibles. Analymo vous livre une synthèse structurée avec les points positifs, les alertes prioritaires et une recommandation claire.
            </p>
            <div className="flex flex-col gap-3">
              {["Score global sur 100 avec recommandation", "Alertes classées par niveau de risque", "Estimation financière des travaux à prévoir", "Rapport PDF téléchargeable"].map((f, i) => (
                <motion.div key={i} variants={fadeUp} custom={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2a7d9c]/10 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-[#2a7d9c]" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Dashboard card */}
          <motion.div variants={fadeUp} custom={1}
            className="rounded-3xl border border-slate-100 shadow-2xl shadow-slate-200/60 overflow-hidden bg-white">
            {/* Header */}
            <div className="bg-[#0f172a] px-6 py-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-1">ANALYMO · RAPPORT</p>
                  <p className="text-sm font-bold text-white">24 rue des Lilas, Lyon 6e</p>
                </div>
                <span className="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full">✓ Terminé</span>
              </div>
              {/* Score */}
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Score global</p>
                  <p className="text-6xl font-black text-[#f0a500] leading-none">78</p>
                  <p className="text-[10px] text-white/30 mt-0.5">sur 100</p>
                </div>
                <div className="flex-1 pb-1.5">
                  <div className="inline-block px-3 py-1.5 rounded-xl bg-[#f0a500]/15 border border-[#f0a500]/25 mb-2">
                    <p className="text-[11px] font-bold text-[#f0a500]">→ Négocier le prix</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[{ l: "Financier", v: 68, c: "#f0a500" }, { l: "Travaux", v: 62, c: "#fb923c" }, { l: "Juridique", v: 88, c: "#4ade80" }, { l: "Charges", v: 80, c: "#60a5fa" }].map(s => (
                      <div key={s.l}>
                        <div className="flex justify-between text-[8px] mb-0.5">
                          <span className="text-white/30">{s.l}</span>
                          <span className="font-bold" style={{ color: s.c }}>{s.v}</span>
                        </div>
                        <div className="h-1 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${s.v}%`, background: s.c }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Points de vigilance</p>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium ${it.type === "ok" ? "bg-green-50 text-green-800 border border-green-100" : "bg-amber-50 text-amber-800 border border-amber-100"}`}>
                    <it.icon size={13} className={it.type === "ok" ? "text-green-500 shrink-0" : "text-amber-500 shrink-0"} />
                    {it.label}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   AVANT / APRÈS
═══════════════════════════════════════════════════════ */
function AvantApresSection() {
  const before = ["40 pages de PV à lire seul", "Jargon juridique incompréhensible", "Travaux découverts après signature", "Décision prise dans l'incertitude", "Mauvaises surprises financières"];
  const after = ["Rapport structuré en 2 minutes", "Informations clés sans jargon", "Tous les risques détectés en amont", "Décision éclairée et sereine", "Économies avant la signature"];

  return (
    <Section className="py-24 px-4 bg-slate-50">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <p className="text-[#2a7d9c] font-bold text-sm uppercase tracking-widest mb-4">Avant / Après</p>
          <h2 className="text-[clamp(28px,4vw,48px)] font-black tracking-tight text-[#0f172a] leading-tight">
            Deux façons d'acheter.<br />Une seule bonne.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <motion.div variants={fadeUp} custom={0} className="p-7 rounded-3xl bg-white border border-red-100 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold mb-6">
              <X size={12} /> Sans Analymo
            </div>
            <div className="space-y-0">
              {before.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-red-50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <X size={11} className="text-red-400" />
                  </div>
                  <span className="text-sm text-slate-500">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} custom={1} className="p-7 rounded-3xl bg-white border border-green-100 shadow-sm">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold mb-6">
              <Check size={12} /> Avec Analymo
            </div>
            <div className="space-y-0">
              {after.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-green-50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-green-500" />
                  </div>
                  <span className="text-sm text-[#0f172a] font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS
═══════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const t = [
    { name: "Marie L.", role: "Primo-accédante · Lyon", i: "ML", c: "#2a7d9c", text: "Analymo m'a signalé un ravalement prévu à 12 000€. J'ai renégocié le prix. Inestimable avant une signature." },
    { name: "Thomas R.", role: "Investisseur · Paris", i: "TR", c: "#0f2d3d", text: "De 3h par dossier à 15 minutes. Quand j'analyse 10 biens par mois, le gain est immédiat et le ROI évident." },
    { name: "Sophie D.", role: "Acheteuse · Bordeaux", i: "SD", c: "#0f6e56", text: "Rapport clair, scores détaillés. Mon notaire a été impressionné. Je recommande à tous les acheteurs." },
  ];
  return (
    <Section className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-14">
          <p className="text-[#2a7d9c] font-bold text-sm uppercase tracking-widest mb-4">Témoignages</p>
          <h2 className="text-[clamp(28px,4vw,44px)] font-black tracking-tight text-[#0f172a] leading-tight">Ils ont acheté avec Analymo.</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.map((item, idx) => (
            <motion.div key={idx} variants={fadeUp} custom={idx}
              className="p-7 rounded-2xl bg-slate-50 border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-200">
              <div className="text-4xl text-slate-200 font-serif leading-none mb-2">"</div>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">{item.text}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-black text-white" style={{ background: item.c }}>{item.i}</div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">{[0,1,2,3,4].map(j=><Star key={j} size={11} fill="#f59e0b" color="#f59e0b"/>)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   LAUNCH / CTA
═══════════════════════════════════════════════════════ */
function LaunchSection() {
  const [prog] = useState(65);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <Section className="py-24 px-4 bg-slate-50">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div variants={fadeUp}
          className="p-10 sm:p-16 rounded-3xl bg-[#0f172a] shadow-2xl shadow-slate-900/30 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#2a7d9c]/15 blur-3xl rounded-full pointer-events-none" />

          <div className="relative">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2a7d9c]/30 bg-[#2a7d9c]/10 text-[#7dd3ed] text-xs font-bold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
              Ouverture prochaine
            </span>

            <h2 className="text-[clamp(24px,4vw,44px)] font-black text-white mb-4 leading-tight tracking-tight">
              Votre prochain bien mérite une analyse complète.
            </h2>
            <p className="text-slate-400 mb-8 text-base leading-relaxed">
              Rejoignez les premiers utilisateurs. Dès 4,99€, résultats en moins de 2 minutes.
            </p>

            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Places réservées</span>
                <span className="font-bold text-[#7dd3ed]">{prog}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${prog}%` }} viewport={{ once: true }} transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#2a7d9c] to-[#22c55e]" />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="flex-1 px-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#2a7d9c]/60 transition-colors"
                  />
                  <button onClick={() => { if (email) setSent(true); }}
                    className="px-6 py-3.5 rounded-xl bg-white text-[#0f172a] text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 whitespace-nowrap flex items-center gap-2 justify-center">
                    Accès anticipé <ArrowRight size={16} />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="thanks" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500/15 border border-green-500/25">
                  <CheckCircle size={18} className="text-green-400" />
                  <p className="text-green-300 font-semibold text-sm">Parfait ! Nous vous contacterons en priorité.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-slate-600 text-xs mt-4">En attendant → <Link to="/tarifs" className="text-[#7dd3ed] hover:underline font-medium">Voir les tarifs</Link> · <Link to="/exemple" className="text-[#7dd3ed] hover:underline font-medium">Voir un exemple</Link></p>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════ */
function FooterSection() {
  return (
    <footer className="py-8 px-4 border-t border-slate-100 bg-white">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Home size={16} className="text-[#2a7d9c]" />
          <span className="text-sm font-black text-[#0f172a]">Analymo</span>
        </div>
        <p className="text-xs text-slate-400">© 2025 Analymo. Tous droits réservés.</p>
        <div className="flex gap-5 text-xs text-slate-400">
          <a href="#" className="hover:text-[#2a7d9c] transition-colors">Mentions légales</a>
          <a href="#" className="hover:text-[#2a7d9c] transition-colors">Confidentialité</a>
          <Link to="/contact" className="hover:text-[#2a7d9c] transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
