import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight, CheckCircle, AlertTriangle, FileText,
  Zap, Shield, BarChart3,
  TrendingUp, Clock, Star, Check, X, ChevronRight,
  Building2, UserCheck, BadgeCheck, ShieldCheck, Trash2,
  Download,
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
    <div ref={ref} className="text-center mb-10 md:mb-16 px-2">
      <motion.p initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">{label}</motion.p>
      <motion.h2 initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.07 }}
        className="text-[clamp(28px,5.5vw,72px)] font-black tracking-[-0.03em] leading-[1.08] text-[#0f172a] mb-4">
        {title}{' '}
        <span className="relative inline-block max-w-fit">
          <span className="text-[#2a7d9c]">{accent}</span>
          <motion.span initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : {}} transition={{ duration: 2.5, delay: 0.2, ease: [0.22,1,0.36,1] }}
            className="absolute -bottom-1 left-0 right-0 h-[4px] bg-[#2a7d9c]/25 rounded-full origin-left block" />
        </span>
      </motion.h2>
      {sub && (
        <motion.p initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 0.2 }}
          className="text-base md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">{sub}</motion.p>
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
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#f4f7f9] px-5 sm:px-10 lg:px-20 pt-16 pb-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-[#2a7d9c]/7 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[#2a7d9c]/4 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">

        {/* MOBILE : titre + téléphone + boutons */}
        <div className="flex flex-col items-center lg:hidden pt-2 pb-4">
          <motion.div variants={up} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/25 bg-white text-[#1a5e78] text-sm font-semibold mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0" style={{ animation: "pulse 2s ease-in-out infinite" }} />
            Analyse immobilière intelligente
          </motion.div>

          <motion.h1 variants={up} initial="hidden" animate="show" custom={0.5}
            className="text-[clamp(26px,7vw,40px)] font-black leading-[1.06] tracking-[-0.03em] text-[#0f172a] mb-2 text-center px-2">
            Vérifiez les éléments essentiels<br />
            <span className="text-[#2a7d9c]">avant de signer.</span>
          </motion.h1>

          <motion.p variants={up} initial="hidden" animate="show" custom={0.8}
            className="text-sm text-slate-500 leading-relaxed text-center px-4 mb-6 max-w-[340px]">
            Diagnostics, PV d'AG, Règlement de copropriété… Notre outil vous aide à comprendre les informations essentielles en <span className="font-semibold text-[#0f172a]">30 secondes*</span>.
          </motion.p>

          <motion.div variants={up} initial="hidden" animate="show" custom={1} className="mb-6">
            <PhoneMockup />
          </motion.div>
          <motion.div variants={up} initial="hidden" animate="show" custom={2}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <Link to="/tarifs"
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

        {/* DESKTOP : grille 2 colonnes */}
        <div className="hidden lg:grid grid-cols-2 gap-6 items-center">

          {/* LEFT */}
          <div className="flex flex-col items-start text-left">
            <motion.div variants={up} initial="hidden" animate="show" custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/25 bg-white text-[#1a5e78] text-sm font-semibold mb-5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0" style={{ animation: "pulse 2s ease-in-out infinite" }} />
              Analyse immobilière intelligente
            </motion.div>

            <motion.h1 variants={up} initial="hidden" animate="show" custom={1}
              className="text-[clamp(28px,4vw,56px)] font-black leading-[1.06] tracking-[-0.03em] text-[#0f172a] mb-5">
              Vérifiez les éléments<br />essentiels{' '}
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
              <Link to="/tarifs"
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

          {/* RIGHT */}
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
    const t1 = setTimeout(() => setStep(1), 3500);
    const t2 = setTimeout(() => setStep(2), 7000);
    // Reste sur le résultat 7 secondes avant de repartir
    const t3 = setTimeout(() => setStep(0), 14000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [step]);

  return (
    <div className="relative">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
        style={{ animation: "floatA 4s ease-in-out 1.2s infinite" }}
        className="hidden sm:flex absolute -left-36 top-[20%] z-20 bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100 items-center gap-3 min-w-[155px]">
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
        className="hidden sm:flex absolute -right-36 bottom-[28%] z-20 bg-white rounded-2xl px-4 py-3 shadow-xl border border-slate-100 items-center gap-3 min-w-[150px]">
        <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
          <TrendingUp size={17} className="text-green-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#0f172a]">Score : 7,5/10</p>
          <p className="text-[11px] text-slate-400">Bien recommandé</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.8 }}
        style={{ animation: "floatC 3.5s ease-in-out 2.8s infinite" }}
        className="hidden sm:flex absolute -right-28 top-[10%] z-20 bg-white rounded-xl px-3.5 py-2.5 shadow-lg border border-slate-100 items-center gap-2">
        <FileText size={14} className="text-[#2a7d9c] shrink-0" />
        <span className="text-xs font-semibold text-[#0f172a]">3 docs chargés ✓</span>
      </motion.div>

      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <div className="w-[175px] sm:w-[275px] h-[370px] sm:h-[580px] bg-[#0f172a] rounded-[40px] sm:rounded-[46px] p-[5px] shadow-[0_32px_72px_rgba(15,23,42,0.25)]">
          <div className="w-full h-full bg-[#f8fafc] rounded-[36px] sm:rounded-[42px] overflow-hidden flex flex-col">

            {/* Status bar */}
            <div className="bg-white shrink-0 px-4 pt-3 pb-1 flex items-center justify-between relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[60px] h-[18px] bg-[#0f172a] rounded-full z-10" />
              <span className="text-[8px] font-bold text-slate-300">9:41</span>
              <span className="text-[8px] font-bold text-slate-300">5G ▪▪▪</span>
            </div>

            {/* App header */}
            <div className="bg-white border-b border-slate-100 px-4 py-2 shrink-0 flex items-center justify-between">
              <span className="text-[10px] font-black text-[#0f2d3d] tracking-wide">ANALYMO</span>
              <span className="text-[8px] font-bold bg-[#2a7d9c]/10 text-[#2a7d9c] px-2 py-0.5 rounded-full">Mon espace</span>
            </div>

            {/* Content — flex-1 remplit tout l'espace restant */}
            <div className="flex-1 flex flex-col min-h-0">
              <AnimatePresence mode="wait">
                {step === 0 && <PhaseUpload key="u" />}
                {step === 1 && <PhaseScan key="s" />}
                {step === 2 && <PhaseResult key="r" />}
              </AnimatePresence>
            </div>

            {/* Home indicator */}
            <div className="bg-white shrink-0 py-2 flex justify-center border-t border-slate-50">
              <div className="w-14 h-1 rounded-full bg-slate-200" />
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PhaseUpload() {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProg(p => Math.min(p + 2, 95)), 60);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="flex-1 flex flex-col px-4 py-4">
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Documents chargés</p>
      <div className="flex flex-col gap-2 mb-auto">
        {["PV AG 2024.pdf","Règlement copro.pdf","Diagnostics.pdf"].map((f,i)=>(
          <motion.div key={f} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.25}}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
            <FileText size={11} className="text-[#2a7d9c] shrink-0" />
            <span className="text-[10px] text-slate-700 font-semibold flex-1 truncate">{f}</span>
            <CheckCircle size={11} className="text-green-500 shrink-0" />
          </motion.div>
        ))}
      </div>
      <div className="mt-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-[9px] text-slate-400 font-medium">Préparation...</span>
          <span className="text-[9px] font-bold text-[#2a7d9c]">{prog}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-[#2a7d9c] to-[#0f2d3d]"
            animate={{ width: `${prog}%` }} transition={{ duration: 0.3 }} />
        </div>
        <p className="text-[8px] text-slate-400 mt-2 text-center italic">Lancement du traitement...</p>
      </div>
    </motion.div>
  );
}

function PhaseScan() {
  const tasks = ["Lecture des pages...","Détection des travaux votés...","Analyse financière...","Vérification juridique...","Calcul du score..."];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone(d => Math.min(d + 1, tasks.length)), 600);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="flex-1 flex flex-col px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-black text-[#0f172a]">Traitement en cours</p>
        <div className="w-3.5 h-3.5 border-2 border-[#2a7d9c] border-t-transparent rounded-full animate-spin-slow" />
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {tasks.map((t,i)=>(
          <motion.div key={t} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.15}}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-500 ${i < done ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
            {i < done
              ? <CheckCircle size={11} className="text-green-500 shrink-0" />
              : <motion.div animate={i === done ? {opacity:[1,0.2,1]} : {opacity:0.25}} transition={{duration:0.8,repeat:Infinity}}
                  className="w-2 h-2 rounded-full bg-[#2a7d9c] shrink-0" />
            }
            <span className={`text-[10px] font-medium ${i < done ? 'text-green-700' : 'text-slate-500'}`}>{t}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function PhaseResult() {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="flex-1 flex flex-col px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-[#0f172a]">Rapport Analymo</p>
        <span className="text-[8px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">✓ Terminé</span>
      </div>
      {/* Score + adresse */}
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm mb-3">
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="22" fill="none" stroke="#f1f5f9" strokeWidth="4" />
            <motion.circle cx="28" cy="28" r="22" fill="none" stroke="#2a7d9c" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={138} initial={{ strokeDashoffset: 138 }}
              animate={{ strokeDashoffset: 138 - 138 * 0.75 }} transition={{ duration: 1.2, delay: 0.3 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-[#0f172a] leading-none">7,5</span>
            <span className="text-[7px] text-slate-400">/10</span>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-black text-[#0f172a] mb-0.5">Globalement sain</p>
          <span className="text-[8px] font-bold bg-[#2a7d9c]/10 text-[#2a7d9c] px-1.5 py-0.5 rounded-full">Recommandé ✓</span>
          <p className="text-[8px] text-slate-400 mt-1">12 rue des Lilas, Lyon</p>
        </div>
      </div>
      {/* Points clés */}
      <div className="flex flex-col gap-1.5 flex-1">
        {[
          {icon:CheckCircle,c:"text-green-500",bg:"bg-green-50",border:"border-green-100",t:"Finances saines",s:"Fonds travaux bien dotés"},
          {icon:AlertTriangle,c:"text-amber-500",bg:"bg-amber-50",border:"border-amber-100",t:"Toiture prévue 2026",s:"Estimé ~4 200€/lot"},
          {icon:CheckCircle,c:"text-green-500",bg:"bg-green-50",border:"border-green-100",t:"Aucun impayé",s:"Copro bien gérée"},
          {icon:TrendingUp,c:"text-[#2a7d9c]",bg:"bg-white",border:"border-slate-100",t:"Charges : 180€/mois",s:"Dans la moyenne"},
        ].map((it,i)=>(
          <motion.div key={i} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:0.7+i*0.12}}
            className={`flex items-center gap-2 p-2 rounded-lg ${it.bg} border ${it.border}`}>
            <it.icon size={10} className={`${it.c} shrink-0`} />
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-[#0f172a] truncate">{it.t}</p>
              <p className="text-[8px] text-slate-400 truncate">{it.s}</p>
            </div>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.5}}
        className="mt-3 w-full py-2.5 rounded-xl bg-[#0f2d3d] text-white text-[9px] font-bold text-center flex items-center justify-center gap-1.5">
        <Download size={9} /> Télécharger le rapport PDF
      </motion.div>
    </motion.div>
  );
}

/* ═══ STATS BAR ═══════════════════════════════════════════ */
function StatsBar() {
  const stats = [
    { v: "200+", l: "analyses réalisées" },
    { v: "30s*", l: "temps moyen" },
    { v: "98%", l: "satisfaction client" },
    { v: "~8 000€", l: "économisés en moyenne" },
  ];
  return (
    <Reveal className="border-y border-slate-100 bg-white">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
        {stats.map((s, i) => (
          <div key={i} className="py-5 md:py-8 px-3 md:px-8 text-center">
            <div className="text-[clamp(20px,3vw,38px)] font-black text-[#0f172a] tracking-tight">{s.v}</div>
            <div className="text-xs md:text-sm text-slate-500 mt-1 font-medium leading-tight">{s.l}</div>
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
    <section className="py-16 md:py-28 px-4 md:px-6 bg-[#f4f7f9]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Le problème" title="Acheter un bien," accent="c'est risqué."
          sub="La plupart des acheteurs signent sans avoir lu ni compris les documents essentiels. Analymo change ça." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
          {problems.map((p, i) => (
            <Reveal key={i} delay={i}
              className={`group flex items-start gap-4 p-5 md:p-8 rounded-2xl md:rounded-3xl border ${p.border} bg-white hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${p.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                <p.icon size={18} className={p.c} />
              </div>
              <div>
                <h3 className="text-base md:text-xl font-bold text-[#0f172a] mb-1 md:mb-3">{p.title}</h3>
                <p className="text-sm md:text-base text-slate-500 leading-relaxed">{p.desc}</p>
              </div>
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
    <section className="py-16 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="La solution" title="Analymo vous" accent="simplifie tout."
          sub="En moins de 30 secondes*, vous savez exactement dans quoi vous mettez les pieds." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-7">
          {feats.map((f, i) => (
            <Reveal key={i} delay={i}
              className="relative flex md:block items-start gap-4 md:gap-0 p-5 md:p-9 rounded-2xl md:rounded-3xl bg-white border border-slate-100 shadow-sm hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-xl transition-all duration-300 group overflow-hidden cursor-default">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl md:rounded-3xl"
                style={{ background: `radial-gradient(ellipse at 20% 20%, ${f.light} 0%, transparent 65%)` }} />
              <div className="relative flex md:block items-start gap-4 w-full">
                <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 md:mb-7" style={{ background: f.light }}>
                  <f.icon size={20} style={{ color: f.c }} />
                </div>
                <div className="flex-1">
                  <div className="hidden md:block text-3xl font-black text-slate-100 mb-1">0{i+1}</div>
                  <h3 className="text-base md:text-xl font-bold text-[#0f172a] mb-1 md:mb-3">{f.title}</h3>
                  <p className="text-sm md:text-base text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
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
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const steps = [
    {
      n: "1",
      color: "#2a7d9c",
      colorLight: "rgba(42,125,156,0.10)",
      colorBorder: "rgba(42,125,156,0.20)",
      tag: "Étape 1",
      title: "Déposez vos fichiers",
      desc: "PV d'AG, règlement de copropriété, diagnostics, appels de charges. Glissez-déposez vos PDF en quelques secondes.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0-3 3m3-3 3 3M6.5 20h11A2.5 2.5 0 0 0 20 17.5v-11A2.5 2.5 0 0 0 17.5 4h-7L6 8.5V17.5A2.5 2.5 0 0 0 8.5 20Z" />
        </svg>
      ),
    },
    {
      n: "2",
      color: "#0f2d3d",
      colorLight: "rgba(15,45,61,0.08)",
      colorBorder: "rgba(15,45,61,0.15)",
      tag: "Étape 2",
      title: "Notre outil analyse tout",
      desc: "Chaque page est lue, chaque risque détecté, chaque charge estimée. Automatique, rapide, sans jargon.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5m-9.25 0 5.25 1.5M5 14.5l5.25 1.5m0 0v4.5m0-4.5 5.25-1.5" />
        </svg>
      ),
    },
    {
      n: "3",
      color: "#7c3aed",
      colorLight: "rgba(124,58,237,0.08)",
      colorBorder: "rgba(124,58,237,0.18)",
      tag: "Étape 3",
      title: "Rapport clair & complet",
      desc: "Score /10, points forts, vigilances, impact financier, travaux votés. Tout ce qu'il faut savoir avant de signer.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
        </svg>
      ),
    },
    {
      n: "4",
      color: "#16a34a",
      colorLight: "rgba(22,163,74,0.08)",
      colorBorder: "rgba(22,163,74,0.20)",
      tag: "Étape 4",
      title: "Téléchargez & partagez",
      desc: "Exportez votre rapport en PDF. Partagez-le avec votre agent, votre notaire ou votre banque en un clic.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-16 md:py-28 px-4 md:px-6 bg-[#0f2d3d] overflow-hidden">
      <div className="max-w-6xl mx-auto">

        {/* Titre */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[#2a7d9c] text-xs font-bold uppercase tracking-[0.22em] mb-4">Comment ça marche</p>
          <h2 className="text-[clamp(26px,5vw,56px)] font-black tracking-[-0.03em] leading-[1.08] text-white mb-4">
            De vos documents à{' '}
            <span className="text-[#4ade80]">votre décision.</span>
          </h2>
          <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto">
            Quatre étapes simples. Aucune formation nécessaire.
          </p>
        </div>

        {/* ── MOBILE : timeline verticale ── */}
        <div className="flex flex-col md:hidden" ref={ref}>
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="flex gap-4">
              {/* Trait + cercle */}
              <div className="flex flex-col items-center shrink-0">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border"
                  style={{ background: s.colorLight, borderColor: s.colorBorder, color: s.color }}>
                  {s.icon}
                </div>
                {i < steps.length - 1 && (
                  <motion.div className="w-px flex-1 min-h-[40px] my-2"
                    style={{ background: `linear-gradient(to bottom, ${s.color}60, ${steps[i+1].color}30)` }}
                    initial={{ scaleY: 0, originY: 0 }}
                    animate={inView ? { scaleY: 1 } : {}}
                    transition={{ delay: i * 0.15 + 0.3, duration: 0.4 }} />
                )}
              </div>
              {/* Texte */}
              <div className="pb-8 pt-1 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest mb-1 block" style={{ color: s.color }}>{s.tag}</span>
                <h3 className="text-base font-bold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── DESKTOP : timeline horizontale ── */}
        <div className="hidden md:block" ref={ref}>
          {/* Numéros + trait de connexion */}
          <div className="relative flex justify-between items-center mb-8 px-8">
            {/* Trait animé de fond */}
            <div className="absolute left-[60px] right-[60px] top-1/2 -translate-y-1/2 h-px bg-white/8" />
            <motion.div
              className="absolute left-[60px] top-1/2 -translate-y-1/2 h-[2px] rounded-full"
              style={{ background: "linear-gradient(90deg, #2a7d9c, #7c3aed, #16a34a)" }}
              initial={{ width: 0 }}
              animate={inView ? { width: "calc(100% - 120px)" } : {}}
              transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} />

            {steps.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.18 + 0.2, duration: 0.4, ease: "backOut" }}
                className="relative z-10 flex flex-col items-center gap-2">
                {/* Cercle numéroté */}
                <div className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center shadow-lg"
                  style={{ background: s.colorLight, borderColor: s.colorBorder, color: s.color }}>
                  {s.icon}
                </div>
                {/* Numéro sous le cercle */}
                <span className="text-xs font-black" style={{ color: s.color }}>{s.tag}</span>
              </motion.div>
            ))}
          </div>

          {/* Cartes de texte en dessous */}
          <div className="grid grid-cols-4 gap-5">
            {steps.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.15 + 0.5, duration: 0.5 }}
                className="rounded-2xl p-6 border border-white/6 bg-white/4 hover:bg-white/8 transition-colors duration-300">
                <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <Reveal className="text-center mt-10 md:mt-12">
          <Link to="/tarifs"
            className="inline-flex items-center gap-2 px-7 md:px-10 py-3.5 md:py-4 rounded-2xl bg-white text-[#0f2d3d] text-sm md:text-base font-bold hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
            Essayer maintenant — dès 4,90€ <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ AVANT / APRÈS ════════════════════════════════════════ */
function AvantApresSection() {
  const rows = [
    { before: "40 pages de PV illisibles à parcourir seul", after: "Rapport structuré clair en 30 secondes*" },
    { before: "Jargon juridique incompréhensible", after: "Informations clés expliquées simplement" },
    { before: "Travaux découverts après la signature", after: "Risques et travaux détectés en amont" },
    { before: "Décision prise dans l'incertitude totale", after: "Décision éclairée, offre négociée" },
    { before: "Mauvaises surprises financières", after: "Économies réalisées avant la signature" },
  ];
  return (
    <section className="py-16 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <SectionTitle label="Avant / Après" title="Deux façons d'acheter." accent="Une seule bonne." />

        {/* En-têtes colonnes */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3">
          <div className="flex items-center gap-2 px-3 md:px-5 py-2.5 rounded-xl bg-red-50 border border-red-100">
            <div className="w-6 h-6 rounded-full bg-white border border-red-200 flex items-center justify-center shrink-0">
              <X size={11} className="text-red-500" />
            </div>
            <span className="text-sm md:text-base font-bold text-red-500">Sans Analymo</span>
          </div>
          <div className="flex items-center gap-2 px-3 md:px-5 py-2.5 rounded-xl bg-green-50 border border-green-100">
            <div className="w-6 h-6 rounded-full bg-white border border-green-200 flex items-center justify-center shrink-0">
              <Check size={11} className="text-green-500" />
            </div>
            <span className="text-sm md:text-base font-bold text-green-600">Avec Analymo</span>
          </div>
        </div>

        {/* Lignes */}
        <div className="flex flex-col gap-2 md:gap-2.5">
          {rows.map((row, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="flex items-start gap-2 md:gap-3 p-3 md:p-5 rounded-xl md:rounded-2xl bg-red-50/50 border border-red-100 hover:bg-red-50 transition-colors">
                <div className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-white border border-red-100 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <X size={10} className="text-red-400" />
                </div>
                <span className="text-xs md:text-sm text-slate-500 leading-snug">{row.before}</span>
              </div>
              <div className="flex items-start gap-2 md:gap-3 p-3 md:p-5 rounded-xl md:rounded-2xl bg-green-50/50 border border-green-100 hover:bg-green-50 transition-colors">
                <div className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-white border border-green-100 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Check size={10} className="text-green-500" />
                </div>
                <span className="text-xs md:text-sm text-[#0f172a] font-semibold leading-snug">{row.after}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <Reveal className="text-center mt-8 md:mt-12">
          <Link to="/tarifs"
            className="inline-flex items-center gap-2 px-7 md:px-9 py-3.5 md:py-4 rounded-2xl bg-[#0f2d3d] text-white text-sm md:text-base font-bold hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
            Lancer mon analyse <ArrowRight size={16} />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══ FOR WHO ══════════════════════════════════════════════ */
function ForWhoSection() {
  const [activeTab, setActiveTab] = useState(0);
  const detected = [
    "Travaux votés et leur coût estimé par lot",
    "Santé financière réelle de la copropriété",
    "Procédures judiciaires ou impayés en cours",
    "Conformité des diagnostics obligatoires",
    "Points de vigilance avant de faire une offre",
  ];
  const pros = [
    { title: "Notaires", desc: "Dossiers préparés plus vite. Clients mieux informés avant la signature.", I: Shield },
    { title: "Agents immobiliers", desc: "Un rapport de transparence qui valorise votre conseil et rassure l'acheteur.", I: UserCheck },
    { title: "Syndics", desc: "Transmissions d'info fluides et complètes lors des ventes en copropriété.", I: Building2 },
    { title: "Marchands de biens", desc: "Risques et potentiel identifiés instantanément sur chaque bien du portefeuille.", I: BadgeCheck },
  ];
  const tabs = ["Acheteurs particuliers", "Professionnels"];

  return (
    <section className="py-16 md:py-28 px-4 md:px-6 bg-[#f4f7f9]">
      <div className="max-w-5xl mx-auto">
        <SectionTitle label="Pour qui" title="Fait pour" accent="vous." />

        {/* Tabs */}
        <Reveal className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100 gap-1">
            {tabs.map((t, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${activeTab === i ? 'bg-[#0f2d3d] text-white shadow-sm' : 'text-slate-500 hover:text-[#0f172a]'}`}>
                {t}
              </button>
            ))}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          {activeTab === 0 && (
            <motion.div key="buyers" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:0.28}}>
              <div className="rounded-2xl md:rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-2">
                <div className="bg-[#0f2d3d] p-8 md:p-12">
                  <span className="inline-block px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-bold uppercase tracking-widest mb-5">Pour les particuliers</span>
                  <h3 className="text-[clamp(22px,3vw,38px)] font-black text-white mb-4 leading-tight">
                    Ne signez plus<br />les yeux fermés.
                  </h3>
                  <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-8 max-w-sm">
                    Analymo décrypte la santé financière de la copropriété, les travaux à venir et les risques juridiques — avant votre offre.
                  </p>
                  <Link to="/tarifs" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0f2d3d] text-sm md:text-base font-bold hover:bg-slate-50 transition-colors">
                    Commencer — dès 4,90€ <ArrowRight size={15} />
                  </Link>
                </div>
                <div className="bg-white p-8 md:p-12">
                  <h4 className="text-sm md:text-base font-bold text-[#0f172a] mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2a7d9c] shrink-0" />
                    Ce qu'Analymo détecte pour vous
                  </h4>
                  {detected.map((item, i) => (
                    <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}}
                      className="flex items-center gap-3 py-2.5 md:py-3 border-b border-slate-50 last:border-0">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#2a7d9c]/10 flex items-center justify-center shrink-0">
                        <Check size={11} className="text-[#2a7d9c]" />
                      </div>
                      <span className="text-sm md:text-base text-[#0f172a] font-medium">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 1 && (
            <motion.div key="pros" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-12}} transition={{duration:0.28}}>
              <div className="mb-6 text-center">
                <p className="text-slate-500 text-sm md:text-lg max-w-2xl mx-auto">
                  Analymo s'intègre naturellement dans votre quotidien professionnel pour vous faire gagner du temps et de la crédibilité.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-5">
                {pros.map((p, i) => (
                  <motion.div key={i} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}}
                    className="flex items-start gap-4 p-5 md:p-7 rounded-2xl bg-white border border-slate-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default">
                    <div className="w-12 h-12 rounded-2xl bg-[#2a7d9c]/8 flex items-center justify-center shrink-0">
                      <p.I size={22} className="text-[#2a7d9c]" />
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-bold text-[#0f172a] mb-1">{p.title}</h4>
                      <p className="text-sm md:text-base text-slate-500 leading-relaxed">{p.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
    <section className="py-16 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Témoignages" title="Ils ont acheté" accent="avec Analymo." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-7">
          {testimonials.map((t,i)=>(
            <Reveal key={i} delay={i}
              className="p-6 md:p-9 rounded-2xl md:rounded-3xl bg-[#f4f7f9] border border-slate-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-default">
              <div className="text-4xl md:text-5xl text-slate-200 font-serif leading-none mb-2 md:mb-3">"</div>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed mb-6 md:mb-8">{t.text}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{background:t.c}} className="w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0">{t.i}</div>
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

/* ═══ CTA FINAL ═════════════════════════════════════════════ */
function CtaFinal() {
  const included = [
    "Score global /10 avec recommandation",
    "Travaux votés + estimation financière",
    "Santé financière de la copropriété",
    "Procédures judiciaires & impayés",
    "Rapport PDF téléchargeable",
    "Crédits sans date d'expiration",
  ];
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <Reveal>
          <div className="rounded-2xl md:rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0f2d3d 0%, #1a4a5e 100%)" }}>

            {/* Bande verte discrète en haut */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #4ade80 0%, #2a7d9c 100%)" }} />

            <div className="p-8 md:p-12 lg:p-14">
              {/* Haut : titre centré */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 mb-5">
                  <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                  <span className="text-white/70 text-xs font-semibold tracking-wide">Analyse complète</span>
                </div>
                <h2 className="text-[clamp(22px,4vw,42px)] font-black text-white mb-3 leading-tight">
                  Prenez votre décision<br />en toute clarté.
                </h2>
                <p className="text-white/50 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
                  Notre outil lit vos documents immobiliers et vous donne un rapport complet avant de signer. À partir de <span className="text-white font-bold">19,90€</span>, sans abonnement.
                </p>
              </div>

              {/* Milieu : grille de features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-10">
                {included.map((item, i) => (
                  <motion.div key={i} initial={{opacity:0,y:8}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.07}}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/6 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(74,222,128,0.15)" }}>
                      <Check size={11} className="text-[#4ade80]" />
                    </div>
                    <span className="text-sm text-white/80 font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>

              {/* Bas : boutons + tarifs */}
              <div className="flex flex-col items-center gap-6">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link to="/tarifs"
                    className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm md:text-base font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                    style={{ background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)", color: "#0f2d3d" }}>
                    Lancer mon analyse <ArrowRight size={16} />
                  </Link>
                  <Link to="/exemple"
                    className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/15 text-white/70 text-sm md:text-base font-semibold hover:bg-white/8 hover:text-white transition-all duration-200">
                    Voir un exemple
                  </Link>
                </div>
                <div className="flex flex-wrap justify-center gap-6 md:gap-10">
                  {[
                    { label: "Simple", price: "4,90€", sub: "1 document" },
                    { label: "Complète", price: "19,90€", sub: "Docs illimités" },
                    { label: "Pack 2 biens", price: "29,90€", sub: "2 crédits" },
                  ].map((p, i) => (
                    <div key={i} className="text-center">
                      <p className="text-white/35 text-[10px] font-bold uppercase tracking-wider mb-0.5">{p.label}</p>
                      <p className="text-white font-black text-lg leading-tight">{p.price}</p>
                      <p className="text-white/30 text-[10px]">{p.sub}</p>
                    </div>
                  ))}
                </div>
                <p className="text-white/25 text-xs italic text-center">* Pour documents PDF nativement numériques</p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
