import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight, CheckCircle, AlertTriangle, FileText,
  Zap, Shield, BarChart3, Upload, Sparkles,
  TrendingUp, Clock, Star, Check, X, ChevronRight,
  Building2, UserCheck, BadgeCheck,
} from "lucide-react";

/* ── animation variant ── */
const up: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref} variants={up} initial="hidden" animate={inView ? "show" : "hidden"} custom={delay} className={className}>
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="bg-white text-[#0f172a] antialiased overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <HeroSection />
      <StatsBar />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <ForWhoSection />
      <AvantApresSection />
      <TestimonialsSection />
      <CtaSection />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HERO — texte à gauche, téléphone à droite
══════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden px-6 lg:px-16 pt-20 pb-12">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f0f8fc] via-white to-white pointer-events-none" />
      <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-[#2a7d9c]/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgba(42,125,156,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* ── LEFT: texte ── */}
        <div className="flex flex-col items-start">
          <motion.div variants={up} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/20 bg-white text-[#1a5e78] text-sm font-semibold mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0" style={{ animation: "pulse 2s ease-in-out infinite" }} />
            Analyse documentaire immobilière · Dès 4,99€
          </motion.div>

          <motion.h1 variants={up} initial="hidden" animate="show" custom={1}
            className="text-[clamp(36px,5vw,68px)] font-black leading-[1.05] tracking-[-0.03em] text-[#0f172a] mb-6">
            Comprenez vos<br />
            documents immo<br />
            <span className="relative inline-block">
              <span className="text-[#2a7d9c]">en 2 minutes.</span>
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1, duration: 0.5 }}
                className="absolute -bottom-1 left-0 right-0 h-[4px] bg-[#2a7d9c]/25 rounded-full origin-left block" />
            </span>
          </motion.h1>

          <motion.p variants={up} initial="hidden" animate="show" custom={2}
            className="text-[clamp(16px,1.5vw,19px)] text-slate-500 leading-[1.75] max-w-[480px] mb-10">
            Analymo analyse vos PV d'AG, règlements de copropriété et diagnostics —
            et vous révèle les risques, les coûts et les décisions à prendre{" "}
            <strong className="text-[#0f172a] font-semibold">avant que vous signiez.</strong>
          </motion.p>

          <motion.div variants={up} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row gap-3 mb-12 w-full sm:w-auto">
            <Link to="/tarifs"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#0f2d3d] text-white text-base font-bold shadow-lg shadow-[#0f2d3d]/20 hover:bg-[#0f2d3d]/90 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              Lancer mon analyse <ArrowRight size={18} />
            </Link>
            <Link to="/exemple"
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl border border-slate-200 bg-white text-[#0f172a] text-base font-semibold hover:border-[#2a7d9c]/40 hover:bg-[#f0f8fc] transition-all duration-200">
              Voir un exemple <ChevronRight size={16} className="text-slate-400" />
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div variants={up} initial="hidden" animate="show" custom={4}
            className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {["#2a7d9c", "#0f2d3d", "#0f6e56", "#7c3aed", "#c2410c"].map((bg, i) => (
                <div key={i} style={{ background: bg }}
                  className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                  {["ML", "TR", "SD", "CB", "PG"][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {[0,1,2,3,4].map(j => <Star key={j} size={13} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p className="text-sm text-slate-500">
                <strong className="text-[#0f172a] font-bold">+200 acheteurs</strong> satisfaits
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT: phone ── */}
        <motion.div variants={up} initial="hidden" animate="show" custom={2}
          className="flex justify-center lg:justify-end">
          <PhoneMockup />
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes scanAnim {
          0%{top:0%;opacity:0} 3%{opacity:1} 47%{opacity:1} 50%{top:100%;opacity:0} 51%{top:0%;opacity:0}
        }
        .animate-scan-phone { animation: scanAnim 3s linear infinite; }
        .animate-spin-slow { animation: spin 1s linear infinite; }
      `}</style>
    </section>
  );
}

/* ── Phone ── */
function PhoneMockup() {
  const [step, setStep] = useState<0|1|2>(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 2200);
    const t2 = setTimeout(() => setStep(2), 4600);
    const t3 = setTimeout(() => setStep(0), 9200);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [step]);

  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute inset-0 bg-[#2a7d9c]/10 blur-3xl rounded-full scale-90 pointer-events-none" />

      {/* Floating badge — score */}
      <motion.div animate={{ y: [0,-9,0], x:[0,4,0] }} transition={{ duration: 4.5, repeat: Infinity }}
        className="absolute -left-8 sm:-left-20 top-[22%] z-20 bg-white rounded-2xl px-3.5 py-2.5 shadow-xl border border-slate-100 flex items-center gap-2.5 min-w-[140px]">
        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <TrendingUp size={16} className="text-green-500" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-600 leading-none mb-0.5">Score global</p>
          <p className="text-xl font-black text-green-500 leading-none">78<span className="text-xs text-slate-300 font-normal">/100</span></p>
        </div>
      </motion.div>

      {/* Floating badge — alert */}
      <motion.div animate={{ y:[0,10,0], x:[0,-3,0] }} transition={{ duration: 5, repeat: Infinity, delay: 1.2 }}
        className="absolute -right-6 sm:-right-20 bottom-[30%] z-20 bg-white rounded-2xl px-3.5 py-2.5 shadow-xl border border-slate-100 flex items-center gap-2.5 min-w-[136px]">
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <AlertTriangle size={16} className="text-amber-500" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-600 leading-none mb-0.5">Vigilance</p>
          <p className="text-xs text-slate-500">Ravalement 2026</p>
        </div>
      </motion.div>

      {/* Floating badge — speed */}
      <motion.div animate={{ y:[0,-5,0] }} transition={{ duration: 3.5, repeat: Infinity, delay: 2 }}
        className="absolute -right-4 sm:-right-14 top-[10%] z-20 bg-white rounded-xl px-3 py-2 shadow-lg border border-slate-100 flex items-center gap-2">
        <span className="text-base">⚡</span>
        <span className="text-xs font-bold text-amber-500">1 min 47s</span>
      </motion.div>

      {/* Phone shell */}
      <motion.div
        animate={{ rotateY:[3,-3,3], rotateX:[-1,1,-1], y:[0,-12,0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="w-[240px] sm:w-[270px] h-[500px] sm:h-[560px] bg-[#0f172a] rounded-[48px] p-[5px] shadow-[0_36px_80px_rgba(15,23,42,0.32)] ring-1 ring-white/8">
          <div className="w-full h-full bg-slate-50 rounded-[44px] overflow-hidden relative">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[82px] h-[24px] bg-[#0f172a] rounded-full z-10" />
            <div className="pt-2 px-5 flex justify-between text-[8.5px] font-bold text-slate-400">
              <span>9:41</span><span>5G ▪▪▪</span>
            </div>
            <div className="px-3.5 pt-7 pb-4">
              <AnimatePresence mode="wait">
                {step === 0 && <PhaseUpload key="u" />}
                {step === 1 && <PhaseScan key="s" />}
                {step === 2 && <PhaseResult key="r" />}
              </AnimatePresence>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-slate-300" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PhaseUpload() {
  const [prog, setProg] = useState(0);
  useEffect(() => { const t = setInterval(() => setProg(p => Math.min(p+4,92)), 65); return () => clearInterval(t); }, []);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <p className="text-[11px] font-black text-slate-800 mb-3 tracking-wide">ANALYMO</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Chargement documents</p>
      {["PV AG 2024.pdf","Règlement copro.pdf","Diagnostics.pdf"].map((f,i)=>(
        <motion.div key={f} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.3}}
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
          <div className="h-full rounded-full bg-gradient-to-r from-[#2a7d9c] to-[#0f2d3d] transition-all" style={{width:`${prog}%`}} />
        </div>
      </div>
    </motion.div>
  );
}

function PhaseScan() {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="relative">
      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#2a7d9c]/70 to-transparent z-10 animate-scan-phone" />
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] font-black text-slate-800">Analyse en cours</p>
        <div className="w-3.5 h-3.5 border-2 border-[#2a7d9c] border-t-transparent rounded-full animate-spin-slow" />
      </div>
      <p className="text-[9px] text-slate-400 mb-3">104 pages en cours de lecture</p>
      {["Détection travaux votés...","Analyse financière...","Vérification juridique...","Calcul du score..."].map((t,i)=>(
        <motion.div key={t} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.4}}
          className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
          <motion.div animate={{opacity:[1,0.2,1]}} transition={{duration:1,repeat:Infinity,delay:i*0.2}}
            className="w-1.5 h-1.5 rounded-full bg-[#2a7d9c] shrink-0" />
          <span className="text-[10px] text-slate-600">{t}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function PhaseResult() {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <div className="flex justify-between items-center mb-2.5">
        <p className="text-[10px] font-black text-slate-800">Rapport Analymo</p>
        <span className="text-[8px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✓ Terminé</span>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-[#0f2d3d] to-[#1a4a60] p-4 text-center mb-3">
        <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mb-1">Score global</p>
        <motion.p initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",stiffness:200,delay:0.1}}
          className="text-[52px] font-black text-[#f0a500] leading-none">78</motion.p>
        <p className="text-[9px] text-white/35 mt-1">sur 100 · Négocier le prix</p>
      </div>
      {[{l:"Financier",v:68,c:"#f0a500"},{l:"Travaux",v:62,c:"#fb923c"},{l:"Juridique",v:88,c:"#22c55e"}].map((s,i)=>(
        <div key={s.l} className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-[9px] text-slate-500">{s.l}</span>
            <span className="text-[9px] font-bold" style={{color:s.c}}>{s.v}</span>
          </div>
          <div className="h-1 rounded-full bg-slate-200">
            <motion.div initial={{width:0}} animate={{width:`${s.v}%`}} transition={{delay:i*0.1+0.2,duration:0.7}}
              className="h-full rounded-full" style={{background:s.c}} />
          </div>
        </div>
      ))}
      <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:0.6}}
        className="mt-2.5 flex gap-1.5 p-2 rounded-xl bg-amber-50 border border-amber-200">
        <AlertTriangle size={10} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-amber-800 leading-tight">Ravalement voté — ~2 400€ en 2026</p>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   STATS BAR
══════════════════════════════════════════════════ */
function StatsBar() {
  const stats = [
    { v: "200+", l: "analyses réalisées" },
    { v: "2 min", l: "temps moyen" },
    { v: "98%", l: "satisfaction client" },
    { v: "~8 000€", l: "économisés en moyenne" },
  ];
  return (
    <Reveal className="border-y border-slate-100 bg-slate-50/60">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
        {stats.map((s, i) => (
          <div key={i} className="py-6 px-8 text-center">
            <div className="text-[clamp(22px,3vw,32px)] font-black text-[#0f172a] tracking-tight">{s.v}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{s.l}</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/* ══════════════════════════════════════════════════
   PROBLEM
══════════════════════════════════════════════════ */
function ProblemSection() {
  const problems = [
    { icon: FileText, title: "Documents illisibles", desc: "Des PV de 40 pages remplis de jargon juridique que personne ne lit vraiment.", c: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
    { icon: AlertTriangle, title: "Travaux cachés", desc: "Ravalement, toiture, ascenseur : des travaux votés que vous découvrez après la signature.", c: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    { icon: TrendingUp, title: "Charges sous-estimées", desc: "Des charges bien plus élevées que prévu qui plombent la rentabilité de votre achat.", c: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
    { icon: Clock, title: "Décisions précipitées", desc: "Sous la pression du marché, vous signez sans avoir eu le temps d'analyser.", c: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  ];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-[#2a7d9c] text-sm font-bold uppercase tracking-[0.15em] mb-4">Le problème</p>
          <h2 className="text-[clamp(28px,4vw,50px)] font-black tracking-tight leading-tight mb-5">
            Acheter un bien, c'est risqué<br className="hidden sm:block" />
            <span className="text-slate-400"> sans les bons outils.</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
            La plupart des acheteurs signent sans avoir lu ni compris les documents essentiels. Analymo change ça.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {problems.map((p, i) => (
            <Reveal key={i} delay={i} className={`group p-7 rounded-2xl border ${p.border} bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default`}>
              <div className={`w-11 h-11 rounded-2xl ${p.bg} flex items-center justify-center mb-5`}>
                <p.icon size={20} className={p.c} />
              </div>
              <h3 className="text-[15px] font-bold text-[#0f172a] mb-2">{p.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   SOLUTION
══════════════════════════════════════════════════ */
function SolutionSection() {
  const feats = [
    { icon: Zap, title: "Analyse automatique", desc: "Déposez vos documents — notre moteur extrait et analyse chaque information en quelques secondes, sans effort de votre part.", c: "#2a7d9c", light: "#eaf4f8" },
    { icon: Shield, title: "Détection des risques", desc: "Travaux votés, impayés, procédures judiciaires, charges futures — rien ne passe à travers les mailles du filet.", c: "#ef4444", light: "#fef2f2" },
    { icon: BarChart3, title: "Synthèse ultra-claire", desc: "Score global, alertes par niveau de priorité, recommandation finale. Vous savez exactement quoi faire.", c: "#22c55e", light: "#f0fdf4" },
  ];
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-[#2a7d9c] text-sm font-bold uppercase tracking-[0.15em] mb-4">La solution</p>
          <h2 className="text-[clamp(28px,4vw,50px)] font-black tracking-tight leading-tight mb-5">
            Analymo vous simplifie tout.
          </h2>
          <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
            En moins de 2 minutes, vous savez exactement dans quoi vous mettez les pieds.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feats.map((f, i) => (
            <Reveal key={i} delay={i}
              className="relative p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:-translate-y-2 hover:shadow-xl transition-all duration-250 group overflow-hidden cursor-default">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 20% 20%, ${f.light} 0%, transparent 60%)` }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ background: f.light }}>
                  <f.icon size={22} style={{ color: f.c }} />
                </div>
                <div className="text-2xl font-black text-[#0f172a] mb-1" style={{ fontVariantNumeric: "tabular-nums" }}>0{i+1}</div>
                <h3 className="text-lg font-bold text-[#0f172a] mb-3">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Arrow linking */}
        <div className="hidden md:flex items-center justify-center gap-2 mt-8 text-slate-300">
          {[0,1].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-24 h-px bg-slate-200" />
              <ArrowRight size={16} className="text-slate-300" />
              <div className="w-24 h-px bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    { n: "01", I: Upload, title: "Importez vos documents", desc: "PV d'AG, règlement de copropriété, diagnostics, appels de charges. PDF, Word ou image.", c: "#2a7d9c" },
    { n: "02", I: Sparkles, title: "Notre moteur analyse tout", desc: "Chaque ligne lue, chaque risque pesé, chaque charge estimée. En quelques secondes.", c: "#0f2d3d" },
    { n: "03", I: CheckCircle, title: "Rapport clair & actionnable", desc: "Score, alertes classées, recommandation. Vous savez exactement quoi faire — et quoi dire.", c: "#22c55e" },
  ];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-[#2a7d9c] text-sm font-bold uppercase tracking-[0.15em] mb-4">Comment ça marche</p>
          <h2 className="text-[clamp(28px,4vw,50px)] font-black tracking-tight leading-tight mb-5">
            Trois étapes.<br className="hidden sm:block" />
            <span className="text-slate-400">Une décision éclairée.</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            Pas de formation, pas de jargon. Vous déposez vos fichiers — on fait le reste.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector */}
          <div className="hidden md:block absolute top-12 left-[22%] right-[22%] h-px bg-gradient-to-r from-[#2a7d9c]/30 via-[#2a7d9c]/60 to-[#22c55e]/30 z-0" />

          {steps.map((s, i) => (
            <Reveal key={i} delay={i} className="relative z-10">
              <div className="bg-white border border-slate-100 rounded-3xl p-8 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-200 cursor-default">
                {/* Icon + number */}
                <div className="relative inline-block mb-7">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                    <s.I size={26} style={{ color: s.c }} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#0f172a] flex items-center justify-center shadow">
                    <span className="text-white text-[9px] font-black">{s.n}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-[#0f172a] mb-2.5">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>

                {/* Arrow to next */}
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-12 z-20 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm items-center justify-center">
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="text-center mt-12">
          <Link to="/tarifs"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#0f2d3d] text-white font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            Essayer maintenant — dès 4,99€ <ArrowRight size={17} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   FOR WHO
══════════════════════════════════════════════════ */
function ForWhoSection() {
  const pros = [
    { title: "Notaires", desc: "Dossiers préparés plus vite. Clients mieux informés.", I: Shield },
    { title: "Agents immobiliers", desc: "Un rapport de transparence qui valorise votre conseil.", I: UserCheck },
    { title: "Syndics", desc: "Transmissions d'info fluides lors des ventes.", I: Building2 },
    { title: "Marchands de biens", desc: "Risques et potentiel identifiés instantanément.", I: BadgeCheck },
  ];
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <p className="text-[#2a7d9c] text-sm font-bold uppercase tracking-[0.15em] mb-4">Pour qui</p>
          <h2 className="text-[clamp(28px,4vw,50px)] font-black tracking-tight leading-tight mb-4">
            Une solution pour chaque acteur.
          </h2>
          <p className="text-lg text-slate-500 max-w-md mx-auto">Particulier ou professionnel, Analymo s'adapte à votre besoin.</p>
        </Reveal>

        {/* Main buyers card */}
        <Reveal className="mb-5">
          <div className="rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-2">
            <div className="bg-[#0f2d3d] p-10 lg:p-14">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-bold uppercase tracking-widest mb-6">⭐ Acheteurs Particuliers</span>
              <h3 className="text-[clamp(22px,3vw,36px)] font-black text-white mb-4 leading-tight">
                Ne signez plus<br />les yeux fermés.
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                Analymo décrypte la santé financière de la copropriété, les travaux à venir et les risques juridiques — avant votre offre.
              </p>
              <Link to="/tarifs" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0f2d3d] text-sm font-bold hover:bg-slate-100 transition-colors">
                Commencer <ArrowRight size={15} />
              </Link>
            </div>
            <div className="bg-white p-10 lg:p-14">
              <h4 className="text-sm font-bold text-[#0f172a] mb-6">Ce qu'Analymo détecte pour vous :</h4>
              {[
                "Travaux votés et leur coût estimé par lot",
                "Santé financière réelle de la copropriété",
                "Procédures judiciaires ou impayés en cours",
                "Conformité des diagnostics obligatoires",
                "Points de vigilance avant de faire une offre",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                  <div className="w-5 h-5 rounded-full bg-[#2a7d9c]/10 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-[#2a7d9c]" />
                  </div>
                  <span className="text-sm text-[#0f172a] font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Pro cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {pros.map((p, i) => (
            <Reveal key={i} delay={i}
              className="p-6 rounded-2xl bg-white border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-default">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                <p.I size={18} className="text-[#2a7d9c]" />
              </div>
              <h4 className="text-sm font-bold text-[#0f172a] mb-2">{p.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   AVANT / APRÈS
══════════════════════════════════════════════════ */
function AvantApresSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const before = ["40 pages de PV à lire seul", "Jargon juridique incompréhensible", "Travaux découverts après signature", "Décision dans l'incertitude totale", "Mauvaises surprises financières"];
  const after  = ["Rapport structuré en 2 minutes", "Informations clés sans jargon", "Risques détectés en amont", "Décision éclairée et sereine", "Économies avant la signature"];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#2a7d9c] text-sm font-bold uppercase tracking-[0.15em] mb-4">Avant / Après</p>
          <h2 className="text-[clamp(28px,4vw,50px)] font-black tracking-tight leading-tight">
            Deux façons d'acheter.<br />
            <span className="text-slate-400">Une seule bonne.</span>
          </h2>
        </Reveal>

        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Sans */}
          <motion.div initial={{opacity:0,x:-20}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:0.6}}
            className="p-8 rounded-3xl bg-white border border-red-100 shadow-sm">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-bold mb-7">
              <X size={12} /> Sans Analymo
            </div>
            <div>
              {before.map((item,i)=>(
                <motion.div key={i} initial={{opacity:0,x:-12}} animate={inView?{opacity:1,x:0}:{}} transition={{delay:i*0.07+0.15}}
                  className="flex items-center gap-3 py-3 border-b border-red-50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                    <X size={11} className="text-red-400" />
                  </div>
                  <span className="text-sm text-slate-500">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Avec */}
          <motion.div initial={{opacity:0,x:20}} animate={inView?{opacity:1,x:0}:{}} transition={{duration:0.6,delay:0.1}}
            className="p-8 rounded-3xl bg-white border border-green-100 shadow-sm">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold mb-7">
              <Check size={12} /> Avec Analymo
            </div>
            <div>
              {after.map((item,i)=>(
                <motion.div key={i} initial={{opacity:0,x:12}} animate={inView?{opacity:1,x:0}:{}} transition={{delay:i*0.07+0.25}}
                  className="flex items-center gap-3 py-3 border-b border-green-50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                    <Check size={11} className="text-green-500" />
                  </div>
                  <span className="text-sm text-[#0f172a] font-medium">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    { name:"Marie L.", role:"Primo-accédante · Lyon", i:"ML", c:"#2a7d9c", text:"Analymo m'a signalé un ravalement à 12 000€. J'ai renégocié. Inestimable avant une signature." },
    { name:"Thomas R.", role:"Investisseur · Paris", i:"TR", c:"#0f2d3d", text:"De 3h par dossier à 15 minutes. Quand j'analyse 10 biens par mois, le gain est immédiat." },
    { name:"Sophie D.", role:"Acheteuse · Bordeaux", i:"SD", c:"#0f6e56", text:"Rapport clair, scores par catégorie. Mon notaire a été impressionné. Je recommande à tous." },
  ];
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-14">
          <p className="text-[#2a7d9c] text-sm font-bold uppercase tracking-[0.15em] mb-4">Témoignages</p>
          <h2 className="text-[clamp(28px,4vw,46px)] font-black tracking-tight leading-tight">
            Ils ont acheté avec Analymo.
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t,i)=>(
            <Reveal key={i} delay={i}
              className="p-8 rounded-2xl bg-white border border-slate-100 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-default">
              <div className="text-4xl text-slate-200 font-serif leading-none mb-2">"</div>
              <p className="text-sm text-slate-600 leading-relaxed mb-7">{t.text}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{background:t.c}} className="w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-black text-white">{t.i}</div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">{[0,1,2,3,4].map(j=><Star key={j} size={12} fill="#f59e0b" color="#f59e0b"/>)}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   CTA FINAL
══════════════════════════════════════════════════ */
function CtaSection() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-2xl mx-auto">
        <Reveal>
          <div className="relative p-12 sm:p-16 rounded-3xl bg-[#0f172a] text-center overflow-hidden shadow-2xl shadow-slate-900/20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-[#2a7d9c]/15 blur-3xl rounded-full" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#f0a500]/5 blur-3xl rounded-full" />
            </div>
            <div className="relative">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2a7d9c]/30 bg-[#2a7d9c]/10 text-[#7dd3ed] text-xs font-bold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" style={{animation:"pulse 2s ease-in-out infinite"}} />
                Votre prochaine acquisition
              </span>
              <h2 className="text-[clamp(24px,4vw,44px)] font-black text-white mb-4 leading-tight tracking-tight">
                Votre prochain bien mérite<br />une analyse complète.
              </h2>
              <p className="text-slate-400 mb-8 text-base leading-relaxed">
                Dès 4,99€ · Sans abonnement · Résultats en moins de 2 minutes.
              </p>

              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Places réservées</span>
                  <span className="font-bold text-[#7dd3ed]">65%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <motion.div initial={{width:0}} whileInView={{width:"65%"}} viewport={{once:true}} transition={{duration:1.2,ease:"easeOut"}}
                    className="h-full rounded-full bg-gradient-to-r from-[#2a7d9c] to-[#22c55e]" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!sent ? (
                  <motion.div key="form" exit={{opacity:0}} className="flex gap-3 flex-col sm:flex-row">
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="votre@email.com"
                      className="flex-1 px-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#2a7d9c]/60 transition-colors" />
                    <button onClick={()=>{if(email)setSent(true);}}
                      className="px-6 py-3.5 rounded-xl bg-white text-[#0f172a] text-sm font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 whitespace-nowrap flex items-center gap-2 justify-center">
                      Accès anticipé <ArrowRight size={16}/>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="ok" initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl bg-green-500/15 border border-green-500/25">
                    <CheckCircle size={18} className="text-green-400"/>
                    <p className="text-green-300 font-semibold text-sm">Parfait ! Nous vous contacterons en priorité.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-slate-600 text-xs mt-5">
                Ou → <Link to="/tarifs" className="text-[#7dd3ed] hover:underline font-medium">Voir les tarifs</Link>
                {" · "}
                <Link to="/exemple" className="text-[#7dd3ed] hover:underline font-medium">Voir un exemple</Link>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
