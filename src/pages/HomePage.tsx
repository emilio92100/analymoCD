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

const up: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div ref={ref} variants={up} initial="hidden" animate={inView ? "show" : "hidden"} custom={delay} className={className}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ label, title, accent, sub }: { label: string; title: string; accent: string; sub?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <div ref={ref} className="text-center mb-16">
      <motion.p initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-5">{label}</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.07 }}
        className="text-[clamp(40px,5.5vw,72px)] font-black tracking-[-0.035em] leading-[1.06] text-[#0f172a] mb-5">
        {title}{' '}
        <span className="relative inline-block">
          <span className="text-[#2a7d9c]">{accent}</span>
          <motion.span initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 0.7, delay: 0.55, ease: [0.22,1,0.36,1] }}
            className="absolute -bottom-1 left-0 right-0 h-[4px] bg-[#2a7d9c]/25 rounded-full origin-left block" />
        </span>
      </motion.h2>
      {sub && (
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">{sub}</motion.p>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-white text-[#0f172a] antialiased overflow-x-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <HeroSection />
      <StatsBar />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <AvantApresSection />
      <ForWhoSection />
      <TestimonialsSection />
      <CtaFinal />
    </div>
  );
}

/* ═══ HERO ═══════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#f4f7f9] px-6 sm:px-10 lg:px-20 pt-24 pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-[#2a7d9c]/7 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#2a7d9c]/4 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-center">

        {/* LEFT */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.div variants={up} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/25 bg-white text-[#1a5e78] text-sm font-semibold mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0" style={{ animation: "pulse 2s ease-in-out infinite" }} />
            Analyse immobilière intelligente
          </motion.div>

          <motion.h1 variants={up} initial="hidden" animate="show" custom={1}
            className="text-[clamp(40px,5vw,72px)] font-black leading-[1.0] tracking-[-0.04em] text-[#0f172a] mb-6">
            Analysez vos documents<br />
            <span className="relative inline-block">
              <span className="text-[#2a7d9c]">immobiliers</span>
              <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.9, duration: 0.6 }}
                className="absolute -bottom-1 left-0 right-0 h-[4px] bg-[#2a7d9c]/25 rounded-full origin-left block" />
            </span>
          </motion.h1>

          <motion.p variants={up} initial="hidden" animate="show" custom={2}
            className="text-xl text-slate-500 leading-relaxed max-w-[500px] mb-10 mx-auto lg:mx-0">
            Score global, risques cachés, impact financier — tout ce qu'il faut savoir avant de signer, expliqué simplement en moins de 2 minutes.
          </motion.p>

          <motion.div variants={up} initial="hidden" animate="show" custom={3}
            className="flex flex-col sm:flex-row gap-3 mb-10 w-full sm:w-auto">
            <Link to="/tarifs"
              className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#0f2d3d] text-white text-base font-bold shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
              <ShieldCheck size={18} /> Lancer l'analyse
            </Link>
            <Link to="/exemple"
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl border border-slate-200 bg-white text-[#0f172a] text-base font-semibold hover:border-[#2a7d9c]/40 hover:bg-[#f0f8fc] transition-all duration-200">
              Voir un exemple <ChevronRight size={16} className="text-slate-400" />
            </Link>
          </motion.div>

          <motion.div variants={up} initial="hidden" animate="show" custom={4}
            className="flex flex-wrap gap-6 justify-center lg:justify-start">
            {[{ I: ShieldCheck, l: "Documents chiffrés" }, { I: Trash2, l: "Suppression auto" }, { I: Clock, l: "Sans engagement" }].map(({ I, l }) => (
              <div key={l} className="flex items-center gap-2 text-sm text-slate-400 font-medium">
                <I size={14} className="text-slate-400 shrink-0" /> {l}
              </div>
            ))}
          </motion.div>
        </div>

        {/* RIGHT */}
        <motion.div variants={up} initial="hidden" animate="show" custom={2} className="flex justify-center lg:justify-center mt-8 lg:mt-0">
          <PhoneMockup />
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes scanAnim { 0%{top:0%;opacity:0} 3%{opacity:1} 47%{opacity:1} 50%{top:100%;opacity:0} 51%{top:0%;opacity:0} }
        .animate-scan-phone { animation: scanAnim 3s linear infinite; }
        .animate-spin-slow { animation: spin 1s linear infinite; }
        @keyframes floatA { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-8px) translateX(3px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(9px) translateX(-3px)} }
        @keyframes floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>
    </section>
  );
}

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
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
        style={{ animation: "floatA 4s ease-in-out 1.2s infinite" }}
        className="hidden sm:flex absolute -left-32 top-[20%] z-20 bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100 items-center gap-3 min-w-[155px]">
        <div className="w-9 h-9 rounded-xl bg-[#2a7d9c]/8 flex items-center justify-center shrink-0">
          <ShieldCheck size={17} className="text-[#2a7d9c]" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#0f172a]">100% sécurisé</p>
          <p className="text-[11px] text-slate-400">Chiffré & supprimé</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.0 }}
        style={{ animation: "floatB 5s ease-in-out 2s infinite" }}
        className="hidden sm:flex absolute -right-32 bottom-[32%] z-20 bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100 items-center gap-3 min-w-[150px]">
        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <TrendingUp size={17} className="text-green-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#0f172a]">Score : 7/10</p>
          <p className="text-[11px] text-slate-400">Bien recommandé</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.8 }}
        style={{ animation: "floatC 3.5s ease-in-out 2.8s infinite" }}
        className="hidden sm:flex absolute -right-28 top-[12%] z-20 bg-white rounded-xl px-3.5 py-2.5 shadow-lg border border-slate-100 items-center gap-2">
        <FileText size={14} className="text-[#2a7d9c] shrink-0" />
        <span className="text-xs font-semibold text-[#0f172a]">PV scanné ✓</span>
      </motion.div>

      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <div className="w-[200px] sm:w-[270px] h-[420px] sm:h-[550px] bg-[#0f172a] rounded-[46px] p-[5px] shadow-[0_32px_72px_rgba(15,23,42,0.25)]">
          <div className="w-full h-full bg-white rounded-[42px] overflow-hidden relative">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[76px] h-[22px] bg-[#0f172a] rounded-full z-10" />
            <div className="pt-2 px-4 flex justify-between text-[8px] font-bold text-slate-400">
              <span>9:41</span><span>5G ▪▪▪</span>
            </div>
            <div className="px-4 pt-6 pb-4">
              <AnimatePresence mode="wait">
                {step === 0 && <PhaseUpload key="u" />}
                {step === 1 && <PhaseScan key="s" />}
                {step === 2 && <PhaseResult key="r" />}
              </AnimatePresence>
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-slate-200" />
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
      <p className="text-[11px] font-black text-slate-800 mb-3">ANALYMO</p>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Chargement documents</p>
      {["PV AG 2024.pdf","Règlement copro.pdf","Diagnostics.pdf"].map((f,i)=>(
        <motion.div key={f} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.3}}
          className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 mb-2">
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
        <p className="text-[10px] font-black text-slate-800">Résultat d'analyse</p>
        <span className="text-[8px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Terminé</span>
      </div>
      <div className="flex justify-center mb-3">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="6" />
            <motion.circle cx="40" cy="40" r="32" fill="none" stroke="#2a7d9c" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={201} initial={{ strokeDashoffset: 201 }}
              animate={{ strokeDashoffset: 201 - 201 * 0.7 }} transition={{ duration: 1.5, delay: 0.3 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-[#0f172a]">7</span>
            <span className="text-[8px] text-slate-400">/10</span>
          </div>
        </div>
      </div>
      <div className="flex items-end gap-1 justify-center h-10 mb-3">
        {[60,85,45,70,90,55,75].map((h,i)=>(
          <motion.div key={i} className="w-3.5 rounded-t-sm bg-[#2a7d9c]/70"
            initial={{height:0}} animate={{height:`${h}%`}} transition={{delay:1+i*0.08,duration:0.5}} />
        ))}
      </div>
      {[{icon:CheckCircle,c:"text-green-500",bg:"bg-green-50",border:"border-green-100",t:"3 points positifs",s:"Finances saines, entretien ok"},
        {icon:AlertTriangle,c:"text-amber-500",bg:"bg-amber-50",border:"border-amber-100",t:"2 vigilances",s:"Toiture prévue 2026"},
        {icon:TrendingUp,c:"text-[#2a7d9c]",bg:"bg-blue-50",border:"border-blue-100",t:"Impact financier",s:"~12 000 € de charges"}
      ].map((it,i)=>(
        <motion.div key={i} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:1.5+i*0.15}}
          className={`flex items-center gap-2 p-2 rounded-xl ${it.bg} border ${it.border} mb-1.5`}>
          <it.icon size={11} className={`${it.c} shrink-0`} />
          <div>
            <p className="text-[9px] font-bold text-[#0f172a]">{it.t}</p>
            <p className="text-[8px] text-slate-400">{it.s}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ═══ STATS BAR ═══════════════════════════════════════════ */
function StatsBar() {
  const stats = [
    { v: "200+", l: "analyses réalisées" },
    { v: "2 min", l: "temps moyen" },
    { v: "98%", l: "satisfaction client" },
    { v: "~8 000€", l: "économisés en moyenne" },
  ];
  return (
    <Reveal className="border-y border-slate-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
        {stats.map((s, i) => (
          <div key={i} className="py-8 px-8 text-center">
            <div className="text-[clamp(26px,3vw,38px)] font-black text-[#0f172a] tracking-tight">{s.v}</div>
            <div className="text-sm text-slate-500 mt-1 font-medium">{s.l}</div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

/* ═══ PROBLEM ══════════════════════════════════════════════ */
function ProblemSection() {
  const problems = [
    { icon: FileText, title: "Documents illisibles", desc: "Des PV de 40 pages remplis de jargon juridique que personne ne lit vraiment.", c: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
    { icon: AlertTriangle, title: "Travaux cachés", desc: "Ravalement, toiture, ascenseur : des travaux votés découverts après la signature.", c: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
    { icon: TrendingUp, title: "Charges sous-estimées", desc: "Des charges bien plus élevées que prévu qui plombent la rentabilité de votre achat.", c: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
    { icon: Clock, title: "Décisions précipitées", desc: "Sous la pression du marché, vous signez sans avoir eu le temps d'analyser.", c: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
  ];
  return (
    <section className="py-28 px-6 bg-[#f4f7f9]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Le problème" title="Acheter un bien," accent="c'est risqué."
          sub="La plupart des acheteurs signent sans avoir lu ni compris les documents essentiels. Analymo change ça." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {problems.map((p, i) => (
            <Reveal key={i} delay={i}
              className={`group p-8 rounded-3xl border ${p.border} bg-white hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 cursor-default`}>
              <div className={`w-12 h-12 rounded-2xl ${p.bg} flex items-center justify-center mb-6`}>
                <p.icon size={22} className={p.c} />
              </div>
              <h3 className="text-xl font-bold text-[#0f172a] mb-3">{p.title}</h3>
              <p className="text-base text-slate-500 leading-relaxed">{p.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ SOLUTION ═════════════════════════════════════════════ */
function SolutionSection() {
  const feats = [
    { icon: Zap, title: "Analyse automatique", desc: "Déposez vos documents — notre moteur extrait et analyse chaque information en quelques secondes.", c: "#2a7d9c", light: "rgba(42,125,156,0.08)" },
    { icon: Shield, title: "Détection des risques", desc: "Travaux votés, impayés, procédures judiciaires — rien ne passe à travers les mailles.", c: "#ef4444", light: "rgba(239,68,68,0.06)" },
    { icon: BarChart3, title: "Synthèse ultra-claire", desc: "Score global, alertes par priorité, recommandation finale. Vous savez exactement quoi faire.", c: "#22c55e", light: "rgba(34,197,94,0.06)" },
  ];
  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="La solution" title="Analymo vous" accent="simplifie tout."
          sub="En moins de 2 minutes, vous savez exactement dans quoi vous mettez les pieds." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {feats.map((f, i) => (
            <Reveal key={i} delay={i}
              className="relative p-9 rounded-3xl bg-white border border-slate-100 shadow-sm hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 group overflow-hidden cursor-default">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"
                style={{ background: `radial-gradient(ellipse at 20% 20%, ${f.light} 0%, transparent 65%)` }} />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-7" style={{ background: f.light }}>
                  <f.icon size={26} style={{ color: f.c }} />
                </div>
                <div className="text-3xl font-black text-slate-100 mb-1">0{i+1}</div>
                <h3 className="text-xl font-bold text-[#0f172a] mb-3">{f.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ HOW IT WORKS ══════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    { n: "01", I: Upload, title: "Importez vos documents", desc: "PV d'AG, règlement de copropriété, diagnostics, appels de charges. PDF, Word ou image.", c: "#2a7d9c" },
    { n: "02", I: Sparkles, title: "Notre moteur analyse tout", desc: "Chaque ligne lue, chaque risque pesé, chaque charge estimée — en quelques secondes.", c: "#0f2d3d" },
    { n: "03", I: CheckCircle, title: "Rapport clair & actionnable", desc: "Score, alertes classées, recommandation. Vous savez quoi faire — et quoi dire.", c: "#22c55e" },
  ];
  return (
    <section className="py-28 px-6 bg-[#f4f7f9]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Comment ça marche" title="Trois étapes." accent="Une décision éclairée."
          sub="Pas de formation, pas de jargon. Vous déposez vos fichiers — on fait le reste." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 relative">
          <div className="hidden md:block absolute top-14 left-[22%] right-[22%] h-px bg-gradient-to-r from-[#2a7d9c]/30 via-[#2a7d9c]/60 to-[#22c55e]/30 z-0" />
          {steps.map((s, i) => (
            <Reveal key={i} delay={i} className="relative z-10">
              <div className="bg-white border border-slate-100 rounded-3xl p-9 hover:-translate-y-2 hover:shadow-xl transition-all duration-300 cursor-default">
                <div className="relative inline-block mb-8">
                  <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                    <s.I size={30} style={{ color: s.c }} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#0f172a] flex items-center justify-center shadow">
                    <span className="text-white text-[10px] font-black">{s.n}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-[#0f172a] mb-3">{s.title}</h3>
                <p className="text-base text-slate-500 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-14 z-20 w-8 h-8 rounded-full bg-white border border-slate-200 shadow items-center justify-center">
                    <ChevronRight size={15} className="text-slate-400" />
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="text-center mt-14">
          <Link to="/tarifs"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-[#0f2d3d] text-white text-base font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            Essayer maintenant — dès 4,99€ <ArrowRight size={18} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ AVANT / APRÈS ════════════════════════════════════════ */
function AvantApresSection() {
  const rows = [
    { before: "40 pages de PV illisibles à parcourir seul", after: "Rapport structuré clair en 2 minutes" },
    { before: "Jargon juridique incompréhensible", after: "Informations clés expliquées simplement" },
    { before: "Travaux découverts après la signature", after: "Risques et travaux détectés en amont" },
    { before: "Décision prise dans l'incertitude totale", after: "Décision éclairée, offre négociée" },
    { before: "Mauvaises surprises financières", after: "Économies réalisées avant la signature" },
  ];
  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <SectionTitle label="Avant / Après" title="Deux façons d'acheter." accent="Une seule bonne." />
        <div className="grid grid-cols-2 gap-4 mb-5 px-1">
          <div className="flex items-center gap-2 px-4">
            <div className="w-7 h-7 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <X size={12} className="text-red-500" />
            </div>
            <span className="text-base font-bold text-red-500">Sans Analymo</span>
          </div>
          <div className="flex items-center gap-2 px-4">
            <div className="w-7 h-7 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
              <Check size={12} className="text-green-500" />
            </div>
            <span className="text-base font-bold text-green-600">Avec Analymo</span>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white border border-red-100 flex items-center justify-center shrink-0 shadow-sm">
                  <X size={13} className="text-red-400" />
                </div>
                <span className="text-base text-slate-600 leading-snug">{row.before}</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 + 0.08 }}
                className="flex items-center gap-4 p-5 rounded-2xl bg-green-50/50 border border-green-100 hover:bg-green-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-white border border-green-100 flex items-center justify-center shrink-0 shadow-sm">
                  <Check size={13} className="text-green-500" />
                </div>
                <span className="text-base text-[#0f172a] font-semibold leading-snug">{row.after}</span>
              </motion.div>
            </div>
          ))}
        </div>
        <Reveal className="text-center mt-12">
          <Link to="/tarifs"
            className="inline-flex items-center gap-2 px-9 py-4 rounded-2xl bg-[#0f2d3d] text-white text-base font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            Lancer mon analyse <ArrowRight size={17} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ FOR WHO ══════════════════════════════════════════════ */
function ForWhoSection() {
  const pros = [
    { title: "Notaires", desc: "Dossiers préparés plus vite. Clients mieux informés.", I: Shield },
    { title: "Agents immobiliers", desc: "Un rapport de transparence qui valorise votre conseil.", I: UserCheck },
    { title: "Syndics", desc: "Transmissions d'info fluides lors des ventes.", I: Building2 },
    { title: "Marchands de biens", desc: "Risques et potentiel identifiés instantanément.", I: BadgeCheck },
  ];
  return (
    <section className="py-28 px-6 bg-[#f4f7f9]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Pour qui" title="Une solution pour" accent="chaque acteur."
          sub="Particulier ou professionnel, Analymo s'adapte à votre besoin." />
        <Reveal className="mb-6">
          <div className="rounded-3xl overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2">
            <div className="bg-[#0f2d3d] p-12 lg:p-16">
              <span className="inline-block px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-bold uppercase tracking-widest mb-7">Acheteurs Particuliers</span>
              <h3 className="text-[clamp(26px,3.5vw,42px)] font-black text-white mb-5 leading-tight">
                Ne signez plus<br />les yeux fermés.
              </h3>
              <p className="text-slate-400 text-base leading-relaxed mb-10 max-w-sm">
                Analymo décrypte la santé financière de la copropriété, les travaux à venir et les risques juridiques — avant votre offre.
              </p>
              <Link to="/tarifs" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-[#0f2d3d] text-base font-bold hover:bg-slate-100 transition-colors">
                Commencer <ArrowRight size={16} />
              </Link>
            </div>
            <div className="bg-white p-12 lg:p-16">
              <h4 className="text-base font-bold text-[#0f172a] mb-7">Ce qu'Analymo détecte pour vous :</h4>
              {["Travaux votés et leur coût estimé par lot","Santé financière réelle de la copropriété","Procédures judiciaires ou impayés en cours","Conformité des diagnostics obligatoires","Points de vigilance avant de faire une offre"].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3.5 border-b border-slate-50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-[#2a7d9c]/10 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-[#2a7d9c]" />
                  </div>
                  <span className="text-base text-[#0f172a] font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {pros.map((p, i) => (
            <Reveal key={i} delay={i}
              className="p-7 rounded-2xl bg-white border border-slate-100 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-200 cursor-default">
              <div className="w-12 h-12 rounded-2xl bg-[#2a7d9c]/8 flex items-center justify-center mb-5">
                <p.I size={22} className="text-[#2a7d9c]" />
              </div>
              <h4 className="text-base font-bold text-[#0f172a] mb-2">{p.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ TESTIMONIALS ══════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    { name:"Marie L.", role:"Primo-accédante · Lyon", i:"ML", c:"#2a7d9c", text:"Analymo m'a signalé un ravalement à 12 000€. J'ai renégocié le prix à la baisse. Inestimable avant une signature." },
    { name:"Thomas R.", role:"Investisseur · Paris", i:"TR", c:"#0f2d3d", text:"De 3h par dossier à 15 minutes. Quand j'analyse 10 biens par mois, le gain est immédiat." },
    { name:"Sophie D.", role:"Acheteuse · Bordeaux", i:"SD", c:"#0f6e56", text:"Rapport clair, scores par catégorie. Mon notaire a été impressionné. Je recommande à tous." },
  ];
  return (
    <section className="py-28 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Témoignages" title="Ils ont acheté" accent="avec Analymo." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {testimonials.map((t,i)=>(
            <Reveal key={i} delay={i}
              className="p-9 rounded-3xl bg-[#f4f7f9] border border-slate-100 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-200 cursor-default">
              <div className="text-5xl text-slate-200 font-serif leading-none mb-3">"</div>
              <p className="text-base text-slate-600 leading-relaxed mb-8">{t.text}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{background:t.c}} className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-black text-white">{t.i}</div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a]">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">{[0,1,2,3,4].map(j=><Star key={j} size={13} fill="#f59e0b" color="#f59e0b"/>)}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ CTA FINAL ═════════════════════════════════════════════ */
function CtaFinal() {
  return (
    <section className="py-28 px-6 bg-[#f4f7f9]">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="relative p-14 sm:p-20 rounded-3xl bg-[#0f2d3d] text-center overflow-hidden shadow-2xl">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#2a7d9c]/15 blur-[80px] rounded-full" />
            </div>
            <div className="relative">
              <h2 className="text-[clamp(28px,4.5vw,52px)] font-black text-white mb-5 leading-tight tracking-tight">
                Votre prochain bien mérite<br />une analyse complète.
              </h2>
              <p className="text-lg text-slate-400 mb-10">Dès 4,99€ · Sans abonnement · Résultats en 2 minutes.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/tarifs" className="flex items-center justify-center gap-2 px-10 py-4 rounded-2xl bg-white text-[#0f2d3d] text-base font-bold hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
                  Lancer mon analyse <ArrowRight size={18} />
                </Link>
                <Link to="/exemple" className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/15 text-white/75 text-base font-semibold hover:bg-white/8 transition-all duration-200">
                  Voir un exemple
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
