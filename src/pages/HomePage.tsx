import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight, CheckCircle, AlertTriangle, FileText,
  Zap, Shield, BarChart3, Upload, Sparkles,
  TrendingUp, Clock, Star, Check, X, ChevronRight,
  Building2, UserCheck, BadgeCheck, ShieldCheck, Trash2,
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

/* ── animated underline section title ── */
function SectionTitle({ label, title, accent, sub }: { label: string; title: string; accent: string; sub?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <div ref={ref} className="text-center mb-14">
      <motion.p initial={{ opacity: 0, y: 12 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.45 }}
        className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.2em] mb-5">{label}</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.06 }}
        className="text-[clamp(32px,5vw,60px)] font-black tracking-[-0.03em] leading-[1.1] text-[#0f172a] mb-4">
        {title}{' '}
        <span className="relative inline-block">
          <span className="text-[#2a7d9c]">{accent}</span>
          <motion.span initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 0.7, delay: 0.5, ease: [0.22,1,0.36,1] }}
            className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#2a7d9c]/35 rounded-full origin-left block" />
        </span>
      </motion.h2>
      {sub && (
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.18 }}
          className="text-[17px] text-slate-500 max-w-xl mx-auto leading-relaxed">{sub}</motion.p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   HERO — texte à gauche, téléphone à droite
══════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#f4f7f9] px-6 sm:px-10 lg:px-16 pt-24 pb-16">
      {/* Fond doux */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#2a7d9c]/8 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#2a7d9c]/5 blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* ── GAUCHE : texte sobre ── */}
        <div className="flex flex-col items-start">

          {/* Badge */}
          <motion.div variants={up} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#2a7d9c]/25 bg-white text-[#1a5e78] text-xs font-semibold mb-7 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shrink-0" style={{ animation: "pulse 2s ease-in-out infinite" }} />
            Analyse immobilière intelligente
          </motion.div>

          {/* Titre — sobre, pas trop gros */}
          <motion.h1 variants={up} initial="hidden" animate="show" custom={1}
            className="text-[clamp(32px,4vw,52px)] font-black leading-[1.1] tracking-[-0.025em] text-[#0f172a] mb-5">
            Analysez vos documents<br />
            <span className="relative inline-block">
              <span className="text-[#2a7d9c]">immobiliers</span>
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.6, ease:[0.22,1,0.36,1] }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#2a7d9c]/25 rounded-full origin-left block" />
            </span>
          </motion.h1>

          {/* Sous-titre */}
          <motion.p variants={up} initial="hidden" animate="show" custom={2}
            className="text-[15px] text-slate-500 leading-relaxed max-w-[400px] mb-8">
            Score global, risques cachés, impact financier — tout ce qu'il faut savoir avant de signer, expliqué simplement en moins de 2 minutes.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={up} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row gap-3 mb-10 w-full sm:w-auto">
            <Link to="/tarifs"
              className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-[#0f2d3d] text-white text-sm font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <ShieldCheck size={16} /> Lancer l'analyse
            </Link>
            <Link to="/exemple"
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200 bg-white text-[#0f172a] text-sm font-semibold hover:border-[#2a7d9c]/40 hover:bg-white transition-all duration-200">
              Voir un exemple <ChevronRight size={15} className="text-slate-400" />
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={up} initial="hidden" animate="show" custom={4}
            className="flex flex-wrap gap-5">
            {[
              { I: ShieldCheck, l: "Documents chiffrés" },
              { I: Trash2, l: "Suppression auto" },
              { I: Clock, l: "Sans engagement" },
            ].map(({ I, l }) => (
              <div key={l} className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <I size={13} className="text-slate-400 shrink-0" /> {l}
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── DROITE : téléphone ── */}
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

      {/* ── Badges flottants — apparaissent progressivement ── */}

      {/* 100% sécurisé — gauche */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        style={{ animation: "floatA 4s ease-in-out 1.2s infinite" }}
        className="hidden sm:flex absolute -left-28 top-[20%] z-20 bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100 items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2a7d9c]/8 flex items-center justify-center shrink-0">
          <ShieldCheck size={17} className="text-[#2a7d9c]" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#0f172a] leading-none mb-0.5">100% sécurisé</p>
          <p className="text-[10px] text-slate-400">Chiffré & supprimé</p>
        </div>
      </motion.div>

      {/* Score 7/10 — droite */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.0, duration: 0.5 }}
        style={{ animation: "floatB 5s ease-in-out 2s infinite" }}
        className="hidden sm:flex absolute -right-28 bottom-[32%] z-20 bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100 items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <TrendingUp size={17} className="text-green-500" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-[#0f172a] leading-none mb-0.5">Score : 7/10</p>
          <p className="text-[10px] text-slate-400">Bien recommandé</p>
        </div>
      </motion.div>

      {/* PV scanné — droite bas */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2.8, duration: 0.5 }}
        style={{ animation: "floatC 3.5s ease-in-out 2.8s infinite" }}
        className="hidden sm:flex absolute -right-24 top-[14%] z-20 bg-white rounded-xl px-3.5 py-2.5 shadow-lg border border-slate-100 items-center gap-2">
        <FileText size={14} className="text-[#2a7d9c] shrink-0" />
        <span className="text-[11px] font-semibold text-[#0f172a]">PV scanné ✓</span>
      </motion.div>

      {/* Téléphone shell */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-[230px] sm:w-[260px] h-[480px] sm:h-[530px] bg-[#0f172a] rounded-[44px] p-[5px] shadow-[0_32px_72px_rgba(15,23,42,0.25),0_0_0_1px_rgba(255,255,255,0.06)_inset]">
          <div className="w-full h-full bg-white rounded-[40px] overflow-hidden relative">
            {/* Dynamic island */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[76px] h-[22px] bg-[#0f172a] rounded-full z-10" />
            {/* Status bar */}
            <div className="pt-2 px-5 flex justify-between text-[8px] font-bold text-slate-400">
              <span>9:41</span><span>5G ▪▪▪</span>
            </div>
            {/* Screen content */}
            <div className="px-3.5 pt-6 pb-4">
              <AnimatePresence mode="wait">
                {step === 0 && <PhaseUpload key="u" />}
                {step === 1 && <PhaseScan key="s" />}
                {step === 2 && <PhaseResult key="r" />}
              </AnimatePresence>
            </div>
            {/* Home bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-slate-200" />
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-8px) translateX(3px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(9px) translateX(-3px)} }
        @keyframes floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>
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
          <SectionTitle label="Le problème" title="Acheter un bien, c'est risqué" accent="sans les bons outils." sub="La plupart des acheteurs signent sans avoir lu ni compris les documents essentiels. Analymo change ça." />
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {problems.map((p, i) => (
            <Reveal key={i} delay={i} className={`group p-7 rounded-2xl border ${p.border} bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default`}>
              <div className={`w-11 h-11 rounded-2xl ${p.bg} flex items-center justify-center mb-5`}>
                <p.icon size={20} className={p.c} />
              </div>
              <h3 className="text-[15px] font-bold text-[#0f172a] mb-2">{p.title}</h3>
              <p className="text-[15px] text-slate-500 leading-relaxed">{p.desc}</p>
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
          <SectionTitle label="La solution" title="Analymo vous" accent="simplifie tout." sub="En moins de 2 minutes, vous savez exactement dans quoi vous mettez les pieds." />
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
          <SectionTitle label="Comment ça marche" title="Trois étapes." accent="Une décision éclairée." sub="Pas de formation, pas de jargon. Vous déposez vos fichiers — on fait le reste." />
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
          <SectionTitle label="Pour qui" title="Une solution pour" accent="chaque acteur." sub="Particulier ou professionnel, Analymo s'adapte à votre besoin." />
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
          <SectionTitle label="Avant / Après" title="Deux façons d'acheter." accent="Une seule bonne." />
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
          <SectionTitle label="Témoignages" title="Ils ont acheté" accent="avec Analymo." />
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
  return (
    <section className="py-28 px-6 bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
      {/* background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2a7d9c]/5 blur-[80px] rounded-full" />
      </div>
      <div className="max-w-5xl mx-auto relative">
        <Reveal className="text-center mb-14">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.2em] mb-5">Commencer</p>
          <h2 className="text-[clamp(34px,5.5vw,68px)] font-black tracking-[-0.03em] leading-[1.08] text-[#0f172a] mb-5">
            Votre prochain bien mérite<br />
            <span className="relative inline-block">
              <span className="text-[#2a7d9c]">une analyse complète.</span>
            </span>
          </h2>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            Dès 4,99€ · Sans abonnement · Résultats en 2 minutes.
          </p>
        </Reveal>

        {/* 3 option cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {[
            { icon: "📄", label: "Analyse document", price: "4,99€", desc: "1 document analysé en détail.", cta: "Choisir", href: "/inscription?plan=document" },
            { icon: "📦", label: "Analyse complète", price: "19,90€", desc: "Tous vos documents, rapport complet.", cta: "Choisir", href: "/inscription?plan=complete", highlight: true },
            { icon: "🏘️", label: "Pack 2 biens", price: "29,90€", desc: "Comparez 2 biens avant de décider.", cta: "Choisir", href: "/inscription?plan=pack2" },
          ].map((opt, i) => (
            <Reveal key={i} delay={i}>
              <div className={`relative p-7 rounded-3xl border transition-all duration-200 hover:-translate-y-1 ${
                opt.highlight
                  ? "bg-[#0f2d3d] border-[#0f2d3d] shadow-xl shadow-[#0f2d3d]/20"
                  : "bg-white border-slate-200 shadow-sm hover:shadow-md"
              }`}>
                {opt.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#2a7d9c] text-white text-xs font-bold whitespace-nowrap shadow">
                    Le plus populaire
                  </div>
                )}
                <div className="text-3xl mb-4">{opt.icon}</div>
                <div className={`text-sm font-semibold mb-1 ${opt.highlight ? "text-[#7dd3ed]" : "text-slate-500"}`}>{opt.label}</div>
                <div className={`text-4xl font-black mb-2 ${opt.highlight ? "text-white" : "text-[#0f172a]"}`}>{opt.price}</div>
                <p className={`text-sm mb-6 leading-relaxed ${opt.highlight ? "text-slate-400" : "text-slate-500"}`}>{opt.desc}</p>
                <Link to={opt.href}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                    opt.highlight
                      ? "bg-white text-[#0f2d3d] hover:bg-slate-100"
                      : "bg-[#0f2d3d] text-white hover:bg-[#0f2d3d]/90"
                  }`}>
                  {opt.cta} <ArrowRight size={15} />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom trust line */}
        <Reveal className="text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            {["🔒 Paiement sécurisé Stripe", "🗑️ Documents supprimés après analyse", "✅ Sans abonnement"].map(t => (
              <span key={t} className="flex items-center gap-1.5">{t}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
