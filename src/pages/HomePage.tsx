import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  ArrowRight, CheckCircle, AlertTriangle, FileText,
  Shield,
  TrendingUp, Clock, Check, X, ChevronRight,
  Building2, UserCheck, BadgeCheck, ShieldCheck, Trash2,
  Download, Lock, Eye, ChevronDown,
} from "lucide-react";
import { useEffect } from "react";

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
      <AvantApresSection />
      <ProblemSolutionSection />
      <SecuriteSection />
      <ForWhoSection />
      <HowItWorksSection />
      <ApercuRapportSection />
      <FaqSection />
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

        {/* MOBILE */}
        <div className="flex flex-col items-center lg:hidden pt-8 pb-4">
          <motion.div variants={up} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a7d9c]/25 bg-white text-[#1a5e78] text-sm font-semibold mb-5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0" style={{ animation: "pulse 2s ease-in-out infinite" }} />
            Analyse immobilière intelligente
          </motion.div>

          <motion.h1 variants={up} initial="hidden" animate="show" custom={0.5}
            className="text-[clamp(36px,10vw,52px)] font-black leading-[1.06] tracking-[-0.03em] text-[#0f172a] mb-3 text-center w-full px-0">
            Vérifiez les éléments<br />
            <span className="relative inline-block">
              <span className="text-[#2a7d9c]">avant de signer.</span>
              <motion.span
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.0, duration: 1.4 }}
                className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#2a7d9c]/30 rounded-full origin-left block" />
            </span>
          </motion.h1>

          <motion.p variants={up} initial="hidden" animate="show" custom={0.8}
            className="text-[15px] text-slate-500 leading-relaxed text-center w-full px-3 mb-7">
            Diagnostics, PV d'AG, règlement de copropriété, diagnostics… <span className="font-semibold text-[#0f172a]">Comprenez l'essentiel en 30 secondes*</span> avant de faire une offre.
          </motion.p>

          {/* Téléphone à droite + infos à gauche collées */}
          <motion.div variants={up} initial="hidden" animate="show" custom={1}
            className="relative w-full mb-7" style={{ height: 360 }}>

            {/* Téléphone collé à droite, centré verticalement */}
            <div className="absolute right-0 top-0 bottom-0 flex items-center">
              <PhoneMockupMini />
            </div>

            {/* Bloc infos à gauche, collé au téléphone, espacé verticalement */}
            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}
              style={{ animation: "floatA 4.5s ease-in-out 1s infinite", maxWidth: 168 }}
              className="absolute left-0 top-[8%] z-20 bg-white rounded-2xl px-3.5 py-3 shadow-lg border border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#2a7d9c]/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} className="text-[#2a7d9c]" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#0f172a]">100% sécurisé</p>
                <p className="text-[10px] text-slate-400">Chiffré & supprimé</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 }}
              style={{ animation: "floatB 5s ease-in-out 1.6s infinite", maxWidth: 160 }}
              className="absolute left-0 top-[38%] z-20 bg-white rounded-2xl px-3.5 py-3 shadow-lg border border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#0f172a]">Score 7,5/10</p>
                <p className="text-[10px] text-slate-400">Bien recommandé</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.2 }}
              style={{ animation: "floatC 4s ease-in-out 2.2s infinite", maxWidth: 162 }}
              className="absolute left-0 top-[68%] z-20 bg-white rounded-2xl px-3.5 py-3 shadow-lg border border-slate-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#f0a500]/10 flex items-center justify-center shrink-0">
                <FileText size={14} className="text-[#f0a500]" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-[#0f172a]">3 docs analysés</p>
                <p className="text-[10px] text-slate-400">PV, règlement, diag.</p>
              </div>
            </motion.div>

          </motion.div>

          <motion.div variants={up} initial="hidden" animate="show" custom={2}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-sm px-4">
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

        {/* DESKTOP */}
        <div className="hidden lg:grid grid-cols-2 gap-6 items-center">
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
            <div className="bg-white shrink-0 px-4 pt-3 pb-1 flex items-center justify-between relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[60px] h-[18px] bg-[#0f172a] rounded-full z-10" />
              <span className="text-[8px] font-bold text-slate-300">9:41</span>
              <span className="text-[8px] font-bold text-slate-300">5G ▪▪▪</span>
            </div>
            <div className="bg-white border-b border-slate-100 px-4 py-2 shrink-0 flex items-center justify-between">
              <span className="text-[10px] font-black text-[#0f2d3d] tracking-wide">ANALYMO</span>
              <span className="text-[8px] font-bold bg-[#2a7d9c]/10 text-[#2a7d9c] px-2 py-0.5 rounded-full">Mon espace</span>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <AnimatePresence mode="wait">
                {step === 0 && <PhaseUpload key="u" />}
                {step === 1 && <PhaseScan key="s" />}
                {step === 2 && <PhaseResult key="r" />}
              </AnimatePresence>
            </div>
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

/* ═══ PHONE MOCKUP MINI (mobile uniquement) ══════════════════ */
function PhoneMockupMini() {
  const [step, setStep] = useState<0|1|2>(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 3500);
    const t2 = setTimeout(() => setStep(2), 7000);
    const t3 = setTimeout(() => setStep(0), 14000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [step]);

  return (
    <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
      <div className="w-[150px] h-[300px] bg-[#0f172a] rounded-[32px] p-[4px] shadow-[0_24px_56px_rgba(15,23,42,0.28)]">
        <div className="w-full h-full bg-[#f8fafc] rounded-[29px] overflow-hidden flex flex-col">
          <div className="bg-white shrink-0 px-3 pt-2.5 pb-1 flex items-center justify-between relative">
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[40px] h-[14px] bg-[#0f172a] rounded-full z-10" />
            <span className="text-[7px] font-bold text-slate-300">9:41</span>
            <span className="text-[7px] font-bold text-slate-300">5G</span>
          </div>
          <div className="bg-white border-b border-slate-100 px-3 py-1.5 shrink-0 flex items-center justify-between">
            <span className="text-[8px] font-black text-[#0f2d3d] tracking-wide">ANALYMO</span>
            <span className="text-[7px] font-bold bg-[#2a7d9c]/10 text-[#2a7d9c] px-1.5 py-0.5 rounded-full">Mon espace</span>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              {step === 0 && <PhaseUploadMini key="u" />}
              {step === 1 && <PhaseScanMini key="s" />}
              {step === 2 && <PhaseResultMini key="r" />}
            </AnimatePresence>
          </div>
          <div className="bg-white shrink-0 py-1.5 flex justify-center border-t border-slate-50">
            <div className="w-10 h-[3px] rounded-full bg-slate-200" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function PhaseUploadMini() {
  const [prog, setProg] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setProg(p => Math.min(p + 2, 95)), 60);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 flex flex-col px-3 py-3">
      <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-2">Documents chargés</p>
      <div className="flex flex-col gap-1.5 mb-auto">
        {["PV AG 2024.pdf","Règlement.pdf","Diagnostics.pdf"].map((f,i)=>(
          <motion.div key={f} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.2}}
            className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
            <FileText size={8} className="text-[#2a7d9c] shrink-0" />
            <span className="text-[8px] text-slate-700 font-semibold flex-1 truncate">{f}</span>
            <CheckCircle size={8} className="text-green-500 shrink-0" />
          </motion.div>
        ))}
      </div>
      <div className="mt-3">
        <div className="h-1 rounded-full bg-slate-200">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-[#2a7d9c] to-[#0f2d3d]"
            animate={{ width: `${prog}%` }} transition={{ duration: 0.3 }} />
        </div>
        <p className="text-[7px] text-slate-400 mt-1 text-center italic">Lancement...</p>
      </div>
    </motion.div>
  );
}

function PhaseScanMini() {
  const tasks = ["Lecture...","Travaux...","Finances...","Juridique...","Score..."];
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone(d => Math.min(d + 1, tasks.length)), 600);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 flex flex-col px-3 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[8px] font-black text-[#0f172a]">Traitement en cours</p>
        <div className="w-2.5 h-2.5 border-[1.5px] border-[#2a7d9c] border-t-transparent rounded-full animate-spin-slow" />
      </div>
      <div className="flex flex-col gap-1.5">
        {tasks.map((t,i)=>(
          <motion.div key={t} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.12}}
            className={`flex items-center gap-2 p-1.5 rounded-lg border ${i < done ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
            {i < done
              ? <CheckCircle size={8} className="text-green-500 shrink-0" />
              : <div className="w-1.5 h-1.5 rounded-full bg-[#2a7d9c] shrink-0 opacity-40" />
            }
            <span className={`text-[8px] font-medium ${i < done ? 'text-green-700' : 'text-slate-500'}`}>{t}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function PhaseResultMini() {
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 flex flex-col px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[8px] font-black text-[#0f172a]">Rapport Analymo</p>
        <span className="text-[6px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full">✓ OK</span>
      </div>
      <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 shadow-sm mb-2">
        <div className="relative w-10 h-10 shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
            <motion.circle cx="20" cy="20" r="15" fill="none" stroke="#2a7d9c" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={94} initial={{ strokeDashoffset: 94 }}
              animate={{ strokeDashoffset: 94 - 94 * 0.75 }} transition={{ duration: 1.2, delay: 0.3 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-black text-[#0f172a] leading-none">7,5</span>
            <span className="text-[6px] text-slate-400">/10</span>
          </div>
        </div>
        <div>
          <p className="text-[8px] font-black text-[#0f172a] mb-0.5">Sain</p>
          <span className="text-[6px] font-bold bg-[#2a7d9c]/10 text-[#2a7d9c] px-1 py-0.5 rounded-full">Recommandé ✓</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {[
          {icon:CheckCircle,c:"text-green-500",bg:"bg-green-50",t:"Finances saines"},
          {icon:AlertTriangle,c:"text-amber-500",bg:"bg-amber-50",t:"Toiture 2026 ~4 200€"},
          {icon:CheckCircle,c:"text-green-500",bg:"bg-green-50",t:"Aucun impayé"},
        ].map((it,i)=>(
          <motion.div key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5+i*0.1}}
            className={`flex items-center gap-1.5 p-1.5 rounded-lg ${it.bg}`}>
            <it.icon size={8} className={`${it.c} shrink-0`} />
            <p className="text-[8px] font-semibold text-[#0f172a] truncate">{it.t}</p>
          </motion.div>
        ))}
      </div>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2}}
        className="mt-2 w-full py-2 rounded-lg bg-[#0f2d3d] text-white text-[7px] font-bold text-center flex items-center justify-center gap-1">
        <Download size={7} /> Télécharger PDF
      </motion.div>
    </motion.div>
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

/* ═══ PROBLÈME + SOLUTION (fusionnées) ══════════════════════ */
function ProblemSolutionSection() {
  const items = [
    {
      icon: FileText,
      title: "Documents illisibles",
      problem: "PV d'AG, règlements de copropriété, diagnostics, appels de charges… Des dizaines de pages de jargon que personne ne lit vraiment.",
      solution: "Notre outil lit tout à votre place et vous présente ce qui compte vraiment, en clair.",
      pc: "text-red-500", pb: "bg-red-50", pBorder: "border-red-100",
    },
    {
      icon: AlertTriangle,
      title: "Travaux cachés",
      problem: "Ravalement, toiture, ascenseur, mise aux normes… Des travaux déjà votés en AG que vous découvrez seulement après avoir signé.",
      solution: "Chaque travail voté est détecté et son coût estimé pour votre lot, avant votre offre.",
      pc: "text-amber-500", pb: "bg-amber-50", pBorder: "border-amber-100",
    },
    {
      icon: TrendingUp,
      title: "Charges sous-estimées",
      problem: "Les charges réelles sont souvent bien plus élevées que ce qu'on vous annonce — une mauvaise surprise qui pèse chaque mois.",
      solution: "Charges mensuelles, fonds travaux, appels de fonds votés — tout est chiffré clairement.",
      pc: "text-orange-500", pb: "bg-orange-50", pBorder: "border-orange-100",
    },
    {
      icon: Clock,
      title: "Décisions précipitées",
      problem: "Sous la pression du marché, vous signez sans avoir eu le temps d'analyser.",
      solution: "En 30 secondes*, vous avez une recommandation claire : acheter ou négocier.",
      pc: "text-blue-500", pb: "bg-blue-50", pBorder: "border-blue-100",
    },
  ];

  return (
    <section className="py-16 md:py-28 px-4 md:px-6 bg-[#f4f7f9]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Pourquoi Analymo" title="Un problème réel," accent="une réponse claire."
          sub="Chaque achat immobilier cache des risques que les documents ne rendent pas évidents. Voici comment on les résout." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {items.map((item, i) => (
            <Reveal key={i} delay={i}
              className="group p-5 md:p-8 rounded-2xl md:rounded-3xl bg-white border border-slate-100 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-default text-center md:text-left">
              <div className={`w-11 h-11 rounded-xl ${item.pb} border ${item.pBorder} flex items-center justify-center mb-4 mx-auto md:mx-0`}>
                <item.icon size={18} className={item.pc} />
              </div>
              <h3 className="text-base md:text-lg font-bold text-[#0f172a] mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">{item.problem}</p>
              <div className="flex items-start gap-2 pt-3 border-t border-slate-100">
                <div className="w-5 h-5 rounded-full bg-[#2a7d9c]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={10} className="text-[#2a7d9c]" />
                </div>
                <p className="text-sm text-[#2a7d9c] font-semibold leading-relaxed">{item.solution}</p>
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
    {
      icon: Shield,
      title: "Hébergement en Europe",
      desc: "Toutes vos données sont hébergées sur des serveurs européens, conformément au RGPD.",
      color: "#f0a500",
      bg: "rgba(240,165,0,0.08)",
    },
  ];

  return (
    <section className="py-16 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          label="Sécurité & Confidentialité"
          title="Vos documents,"
          accent="protégés."
          sub="Vous allez uploader des documents sensibles. Voici exactement comment nous les protégeons."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
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

/* ═══ HOW IT WORKS ══════════════════════════════════════════ */
function HowItWorksSection() {
  const refMobile = useRef(null);
  const refDesktop = useRef(null);
  const inViewMobile = useInView(refMobile, { once: true, margin: "-40px" });
  const inViewDesktop = useInView(refDesktop, { once: true, margin: "-60px" });

  const steps = [
    {
      n: "01", color: "#2a7d9c", bg: "rgba(42,125,156,0.08)", border: "rgba(42,125,156,0.18)",
      title: "Déposez vos fichiers",
      desc: "PV d'AG, règlement de copropriété, diagnostics, appels de charges — glissez-déposez vos PDF.",
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
      desc: "Score /10, points de vigilance, travaux votés, impact financier. Disponible dans votre espace.",
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
    <section className="py-16 md:py-24 px-4 md:px-6 bg-white">
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
          <Link to="/tarifs"
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
    { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", label: "Toiture à prévoir (2026)", detail: "Estimé ~4 200€ / lot" },
    { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "Aucun impayé en cours", detail: "Copropriété bien gérée" },
    { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100", label: "Ravalement voté 2025", detail: "Quote-part : 2 800€ / lot" },
    { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "Diagnostics conformes", detail: "DPE, amiante, plomb — OK" },
    { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", border: "border-green-100", label: "Aucune procédure judiciaire", detail: "Situation juridique nette" },
  ];

  return (
    <section className="py-16 md:py-28 px-4 md:px-6 bg-[#f4f7f9]">
      <div className="max-w-6xl mx-auto">
        <SectionTitle label="Exemple de rapport" title="Ce que vous" accent="recevez."
          sub="Voici exactement ce qu'Analymo vous fournit en moins de 30 secondes*." />

        <Reveal>
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

            {/* Header rapport */}
            <div className="bg-[#0f2d3d] px-6 md:px-10 py-5 md:py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Rapport Analymo — Analyse complète</p>
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
                    <span className="text-xl md:text-2xl font-black text-white leading-none">7,5</span>
                    <span className="text-[10px] text-white/40">/10</span>
                  </div>
                </div>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full bg-green-500/15 text-green-400 text-xs font-bold mb-1">✓ Recommandé</span>
                  <p className="text-white/60 text-xs">Bien globalement sain</p>
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
                      { label: "Fonds travaux", val: "85 000 €" },
                      { label: "Travaux votés", val: "~7 000 €/lot" },
                      { label: "Impayés copro", val: "Aucun" },
                    ].map((d, i) => (
                      <div key={i} className="p-3.5 rounded-xl bg-[#f4f7f9] border border-slate-100">
                        <p className="text-[11px] text-slate-400 font-medium mb-1">{d.label}</p>
                        <p className="text-base font-black text-[#0f172a]">{d.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[#0f2d3d]/5 border border-[#0f2d3d]/10 p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#2a7d9c] mb-2">Avis Analymo</p>
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

/* ═══ FAQ ════════════════════════════════════════════════════ */
function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "Mes documents sont-ils supprimés après traitement ?",
      a: "Oui, automatiquement. Vos fichiers sont supprimés de nos serveurs dès que votre rapport est généré. Aucun stockage permanent — seul le rapport final est conservé dans votre espace.",
    },
    {
      q: "Ça fonctionne avec tous les types de documents ?",
      a: "Analymo traite les PDF nativement numériques (PDF texte) en 30 secondes. Les documents scannés ou photographiés peuvent nécessiter un délai supplémentaire. Les formats Word, images JPEG ou PNG ne sont pas pris en charge.",
    },
    {
      q: "Et si je n'ai qu'un seul document ?",
      a: "L'analyse simple à 4,90€ est faite pour ça — elle analyse un seul document et vous donne les informations clés sans score /10. L'analyse complète à 19,90€ accepte plusieurs documents et génère un score global.",
    },
    {
      q: "Le rapport est-il garanti exact ?",
      a: "Notre outil traite vos documents avec soin, mais il reste un outil d'aide à la décision. Nous recommandons de confirmer les éléments importants avec un professionnel (notaire, avocat) avant toute signature.",
    },
    {
      q: "Puis-je partager le rapport avec mon notaire ou mon banquier ?",
      a: "Absolument. Le rapport est téléchargeable en PDF et peut être partagé librement. De nombreux utilisateurs l'envoient à leur notaire ou l'utilisent pour justifier une négociation de prix.",
    },
    {
      q: "Mes crédits ont-ils une date d'expiration ?",
      a: "Non, jamais. Vos crédits sont valables indéfiniment. Vous pouvez acheter un pack aujourd'hui et l'utiliser dans 6 mois — ils vous attendent.",
    },
  ];

  return (
    <section className="py-16 md:py-28 px-4 md:px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <SectionTitle label="Questions fréquentes" title="Tout ce que vous" accent="voulez savoir." />

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 md:px-7 py-4 md:py-5 text-left hover:bg-[#f4f7f9] transition-colors">
                  <span className="text-sm md:text-base font-bold text-[#0f172a]">{faq.q}</span>
                  <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                    <ChevronDown size={18} className="text-slate-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}>
                      <div className="px-5 md:px-7 pb-5 text-sm md:text-base text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
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
          <p className="text-sm text-slate-400 mb-3">Vous avez une autre question ?</p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-[#0f172a] text-sm font-semibold hover:border-[#2a7d9c]/40 hover:bg-[#f0f8fc] transition-all duration-200">
            Contactez-nous <ArrowRight size={15} />
          </Link>
        </Reveal>
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
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #4ade80 0%, #2a7d9c 100%)" }} />
            <div className="p-8 md:p-12 lg:p-14">
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
