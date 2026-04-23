import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Download, Building2, CheckCircle, AlertTriangle,
  Shield, FileText, GitCompare, ArrowLeftRight, Sparkles, ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchAnalyseById } from '../lib/analyses';

/* ══════════════════════════════════════════
   TYPES
   ══════════════════════════════════════════ */

type VerdictLegacy = {
  bien_recommande_idx: number;
  titre_verdict: string;
  synthese?: string;
  forces_bien_recommande?: string[];
  points_attention?: string[];
  conseil?: string;
  alerte_documents: string | null;
};

type VerdictItem = { titre: string; detail: string; impact?: 'majeur' | 'modere' | 'mineur' | null };
type VerdictProfil = {
  bien_idx: number;
  profil: string;
  forces: VerdictItem[];
  points_faibles: VerdictItem[];
};
type VerdictEcart = {
  bien_1: number | string | null;
  bien_2: number | string | null;
  bien_3: number | string | null;
  delta_label: string;
};
type KpiValeur = {
  bien_idx: number;
  valeur_brute: number | string | null;
  valeur_affichee: string;
  rang: 'favorable' | 'defavorable' | 'neutre';
};
type KpiDifferenciant = {
  label: string;
  unite?: string | null;
  valeurs: KpiValeur[];
  ecart_label: string;
  pourquoi_differenciant?: string;
};

type VerdictV2 = {
  bien_recommande_idx: number;
  titre_verdict: string;
  ecarts_cles: {
    score: VerdictEcart;
    cout_annee_1: VerdictEcart;
    dpe: VerdictEcart;
  };
  kpis_differenciants?: KpiDifferenciant[];
  analyse_croisee?: string | null;
  profils: VerdictProfil[];
  comparatif: string;
  points_a_approfondir: { bien: string; action: string }[];
  alerte_documents: string | null;
};

type VerdictAny = VerdictLegacy | VerdictV2;

function isVerdictV2(v: VerdictAny | null): v is VerdictV2 {
  if (!v) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(v && typeof v === 'object' && Array.isArray((v as any).profils) && (v as any).ecarts_cles);
}

type AnalyseLite = {
  id: string;
  title: string;
  adresse_bien: string;
  score: number | null;
  date: string;
  result: Record<string, unknown> | null;
};

/* ══════════════════════════════════════════
   UTILS
   ══════════════════════════════════════════ */

function getScoreColor(s: number) {
  if (s >= 17) return '#15803d'; if (s >= 14) return '#16a34a'; if (s >= 10) return '#d97706'; if (s >= 7) return '#ea580c'; return '#dc2626';
}
function getScoreLabel(s: number) {
  if (s >= 17) return 'Bien irréprochable'; if (s >= 14) return 'Bien sain'; if (s >= 10) return 'Bien correct avec réserves'; if (s >= 7) return 'Bien risqué'; return 'Bien à éviter';
}

function parseTantiemes(raw: unknown): { num: number; den: number } | null {
  if (typeof raw !== 'string') return null;
  const m = raw.replace(/\s/g, '').match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  const den = parseInt(m[2], 10);
  if (!num || !den || den < num) return null;
  return { num, den };
}

function parseNum(v: unknown): number | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = parseFloat(v.replace(/[^0-9.,-]/g, '').replace(',', '.')); return isNaN(n) ? null : n; }
  return null;
}

function getResultData(a: AnalyseLite) {
  const r = a.result;
  if (!r) return null;

  const cats = r.categories as Record<string, { note: number; note_max: number }> | null;
  const fin = r.finances as Record<string, unknown> | null;
  const preEtat = r.pre_etat_date as Record<string, unknown> | null;
  const lotAchete = r.lot_achete as Record<string, unknown> | null;
  const chargesFutures = preEtat?.charges_futures as Record<string, unknown> | null;

  let chargesAnnuelles: number | null = null;
  let chargesIsEstimation = false;

  chargesAnnuelles = parseNum(fin?.charges_annuelles_lot);
  if (!chargesAnnuelles) {
    const trim = parseNum(chargesFutures?.montant_trimestriel);
    if (trim) chargesAnnuelles = trim * 4;
  }
  if (!chargesAnnuelles) chargesAnnuelles = parseNum(chargesFutures?.montant_annuel);
  if (!chargesAnnuelles) {
    const budgetTotal = parseNum(fin?.budget_total_copro);
    const tt = parseTantiemes(lotAchete?.quote_part_tantiemes);
    if (budgetTotal && tt) {
      chargesAnnuelles = Math.round(budgetTotal * tt.num / tt.den);
      chargesIsEstimation = true;
    }
  }

  const fondsTravTrimestriel = parseNum(chargesFutures?.fonds_travaux_trimestriel);
  const fondsTravAnnuel = fondsTravTrimestriel ? fondsTravTrimestriel * 4 : null;
  const fondsAlurSignature = parseNum(preEtat?.fonds_travaux_alur) || parseNum(lotAchete?.fonds_travaux_alur);
  const fondsRoulementSignature = parseNum(preEtat?.fonds_roulement_acheteur);
  const taxeFonciere = parseNum(r.taxe_fonciere) || parseNum((r as Record<string, unknown>).taxe_fonciere_annuelle) || parseNum(fin?.taxe_fonciere);

  return {
    titre: (r.titre as string) || a.adresse_bien || '',
    travaux_votes: ((r.travaux as Record<string, unknown>)?.votes as unknown[] || []).length,
    travaux_evoques: ((r.travaux as Record<string, unknown>)?.evoques as unknown[] || []).length,
    travaux_evoques_list: ((r.travaux as Record<string, unknown>)?.evoques as Array<{ label: string; montant_estime?: number | null }> || []),
    procedures: (r.procedures as unknown[] || []).length,
    dpe: (() => {
      const diags = r.diagnostics as Array<Record<string, unknown>> || [];
      const dpe = diags.find(d => d.type === 'DPE' && d.perimetre === 'lot_privatif');
      if (!dpe) return null;
      return (dpe.resultat as string)?.match(/Classe ([A-G])/i)?.[1]?.toUpperCase() || null;
    })(),
    fonds_travaux_statut: (r.finances as Record<string, unknown>)?.fonds_travaux_statut as string || 'non_mentionne',
    charges_annuelles: chargesAnnuelles,
    charges_is_estimation: chargesIsEstimation,
    impayes: !!((r.lot_achete as Record<string, unknown>)?.impayes_detectes),
    points_forts: (r.points_forts as string[] || []).slice(0, 3),
    points_vigilance: (r.points_vigilance as string[] || []).slice(0, 3),
    categories: cats ? {
      travaux: cats.travaux || { note: 0, note_max: 5 },
      procedures: cats.procedures || { note: 0, note_max: 4 },
      finances: cats.finances || { note: 0, note_max: 4 },
      diags_privatifs: cats.diags_privatifs || { note: 0, note_max: 4 },
      diags_communs: cats.diags_communs || { note: 0, note_max: 3 },
    } : null,
    documents_analyses: (r.documents_analyses as Array<{ type: string; nom: string; annee?: string | null }> || []),
    financier: {
      charges_annuelles: chargesAnnuelles,
      charges_is_estimation: chargesIsEstimation,
      fonds_travaux_annuel: fondsTravAnnuel,
      taxe_fonciere: taxeFonciere,
      fonds_alur_signature: fondsAlurSignature,
      fonds_roulement_signature: fondsRoulementSignature,
      total_annee_1: (chargesAnnuelles || 0) + (fondsTravAnnuel || 0) + (fondsAlurSignature || 0) + (fondsRoulementSignature || 0) + (taxeFonciere || 0),
      has_data: !!(chargesAnnuelles || fondsTravAnnuel || fondsAlurSignature || fondsRoulementSignature),
    },
  };
}

/* ══════════════════════════════════════════
   COMPOSANTS PRIMITIFS
   ══════════════════════════════════════════ */

function DpeCell({ classe }: { classe: string | null }) {
  if (!classe) return <span style={{ color: '#94a3b8', fontSize: 12.5 }}>—</span>;
  const colors: Record<string, { bg: string; color: string }> = {
    A: { bg: '#f0fdf4', color: '#16a34a' }, B: { bg: '#f0fdf4', color: '#22c55e' }, C: { bg: '#f7fee7', color: '#84cc16' },
    D: { bg: '#fef9c3', color: '#a16207' }, E: { bg: '#ffedd5', color: '#c2410c' }, F: { bg: '#fef2f2', color: '#dc2626' }, G: { bg: '#fef2f2', color: '#991b1b' },
  };
  const s = colors[classe] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 5, background: s.bg, color: s.color, fontSize: 12.5, fontWeight: 800, letterSpacing: '0.02em' }}>
      Classe {classe}
    </span>
  );
}

function Accordion({ title, icon, defaultOpen = false, children, subtitle }: { title: string; icon?: string; defaultOpen?: boolean; children: React.ReactNode; subtitle?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '14px 18px', background: open ? '#fafbfc' : '#fff', border: 'none', borderBottom: open ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit', textAlign: 'left' }}>
        {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{title}</span>
          {subtitle && <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{subtitle}</span>}
        </div>
        <ChevronDown size={16} style={{ color: '#94a3b8', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }} />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <div style={{ overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PDF BUTTON — popup "bientôt disponible"
   ══════════════════════════════════════════ */

function PdfButton() {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button onClick={() => setShowModal(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: '#fff', color: '#0f2d3d', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
        <Download size={14} /> <span>PDF</span>
      </button>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: '#fff', borderRadius: 22, padding: '36px 32px 28px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(15,45,61,0.25)', animation: 'rcp-fadeUp 0.25s ease both' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>×</button>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Download size={28} style={{ color: '#2a7d9c' }} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Export PDF bientôt disponible</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
              Nous travaillons activement sur cette fonctionnalité pour vous permettre de télécharger votre rapport de comparaison au format PDF.
            </p>
            <div style={{ padding: '12px 16px', borderRadius: 12, background: '#f0f9ff', border: '1px solid #e0f2fe', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', animation: 'rcp-pulse 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c' }}>En cours de développement</span>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,45,61,0.18)' }}>
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════
   ÉCRAN D'ATTENTE
   ══════════════════════════════════════════ */

function WaitingScreen({ biens, fromCache }: { biens: string[]; fromCache: boolean }) {
  const [currentStep, setCurrentStep] = useState(0);
  const n = biens.length;

  useEffect(() => {
    if (fromCache) return;
    const t1 = setTimeout(() => setCurrentStep(1), 8000);
    const t2 = setTimeout(() => setCurrentStep(2), 18000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [fromCache]);

  if (fromCache) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ padding: '60px 32px', borderRadius: 20, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, minHeight: 280, justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid #2a7d9c', borderTopColor: 'transparent' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Chargement du rapport</p>
          <p style={{ fontSize: 13, color: '#64748b' }}>Récupération de votre comparaison sauvegardée…</p>
        </div>
      </motion.div>
    );
  }

  const steps = [
    { label: `Lecture des ${n} rapports`, icon: '📄' },
    { label: 'Comparaison des forces et faiblesses', icon: '⚖️' },
    { label: 'Rédaction du verdict comparatif', icon: '✍️' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      style={{ padding: '48px 32px', borderRadius: 20, background: 'linear-gradient(135deg, #f0f7fb 0%, #e8f4fa 100%)', border: '1.5px solid #bae3f5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, minHeight: 520, justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 200, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        {biens.slice(0, 3).map((_, i) => (
          <motion.div key={i}
            animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
            style={{ width: 52, height: 68, borderRadius: 10, background: 'linear-gradient(180deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(15,45,61,0.2)' }}>
            <Building2 size={28} color="#fff" />
          </motion.div>
        ))}
      </div>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Analyse comparative en cours
        </h2>
        <p style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.6 }}>
          Verimo compare vos {n === 2 ? '2' : '3'} biens en profondeur
        </p>
      </div>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {steps.map((step, i) => {
          const isDone = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isDone ? '#16a34a' : isActive ? 'rgba(42,125,156,0.12)' : '#f1f5f9',
                border: isActive ? '2px solid #2a7d9c' : 'none',
              }}>
                {isDone ? <CheckCircle size={16} color="#fff" /> : isActive ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 14, height: 14, borderRadius: '50%', border: '2.5px solid #2a7d9c', borderTopColor: 'transparent' }} />
                ) : <span style={{ fontSize: 13 }}>{step.icon}</span>}
              </div>
              <span style={{
                fontSize: 14, lineHeight: 1.5,
                color: isDone ? '#16a34a' : isActive ? '#0f172a' : '#94a3b8',
                fontWeight: isDone || isActive ? 700 : 500,
              }}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   VERDICT PREMIUM — 5 blocs
   ══════════════════════════════════════════ */

function VerdictPremium({ verdict, analyses }: { verdict: VerdictV2; analyses: AnalyseLite[] }) {
  const nbBiens = analyses.length;
  let bestIdx = typeof verdict.bien_recommande_idx === 'number' ? verdict.bien_recommande_idx : 0;
  if (bestIdx < 0 || bestIdx >= nbBiens) bestIdx = 0;
  const bestBien = analyses[bestIdx];
  const bestScore = bestBien?.score ?? 0;
  const bestColor = getScoreColor(bestScore);

  const kpis = verdict.kpis_differenciants || [];
  const hasKpis = kpis.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ─── BLOC 1 — Hero recommandation ─── */}
      <div style={{
        position: 'relative',
        padding: '28px 28px 26px',
        borderRadius: 20,
        background: 'linear-gradient(135deg, #0f2d3d 0%, #1a4a5e 100%)',
        color: '#fff',
        overflow: 'hidden',
      }}>
        {/* Décor */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.4), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.18), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Shield size={12} />
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em' }}>VERDICT VERIMO</span>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, background: 'rgba(34,197,94,0.22)', border: '1px solid rgba(34,197,94,0.4)' }}>
              <span style={{ fontSize: 13 }}>⭐</span>
              <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', color: '#bbf7d0' }}>BIEN RECOMMANDÉ</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>
                BIEN {bestIdx + 1}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.25, marginBottom: 14, letterSpacing: '-0.02em' }}>
                {bestBien?.adresse_bien || 'Bien sans titre'}
              </h2>
              <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.55, fontWeight: 500 }}>
                {verdict.titre_verdict}
              </p>
            </div>

            {/* Score circulaire */}
            {bestBien?.score != null && (
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="6" />
                  <motion.circle cx="44" cy="44" r="38" fill="none" stroke={bestColor} strokeWidth="6" strokeLinecap="round"
                    transform="rotate(-90 44 44)"
                    strokeDasharray={2 * Math.PI * 38}
                    initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                    animate={{ strokeDashoffset: (2 * Math.PI * 38) - (2 * Math.PI * 38) * (bestScore / 20) }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} />
                  <text x="44" y="42" textAnchor="middle" fontSize="22" fontWeight="900" fill="#fff">{bestScore.toFixed(1)}</text>
                  <text x="44" y="58" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.6)">/20</text>
                </svg>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: bestColor, marginBottom: 2 }}>
                    {getScoreLabel(bestScore)}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                    Score Verimo
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BLOC 2 — 3 KPIs différenciants ─── */}
      {hasKpis && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingLeft: 2 }}>
            <ArrowLeftRight size={14} style={{ color: '#2a7d9c' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.12em' }}>
              CE QUI LES DIFFÉRENCIE LE PLUS
            </span>
          </div>
          <div className="rcp-kpi-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${kpis.length}, 1fr)`, gap: 12 }}>
            {kpis.slice(0, 3).map((kpi, ki) => (
              <KpiCard key={ki} kpi={kpi} analyses={analyses} />
            ))}
          </div>
        </div>
      )}

      {/* ─── BLOC 3 — Analyse croisée Verimo ─── */}
      {verdict.analyse_croisee && (
        <div style={{
          position: 'relative',
          padding: '20px 22px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #fff 0%, #f0f7fb 100%)',
          border: '1.5px solid #bae3f5',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d', letterSpacing: '0.12em' }}>
              ANALYSE CROISÉE VERIMO
            </span>
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.65, color: '#0f172a', margin: 0, fontWeight: 500 }}>
            {verdict.analyse_croisee}
          </p>
        </div>
      )}

      {/* ─── BLOC 4 — Vigilance documentaire (si présente) ─── */}
      {verdict.alerte_documents && (
        <div style={{
          padding: '16px 18px',
          borderRadius: 14,
          background: '#fff7ed',
          border: '1.5px solid #fed7aa',
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={15} color="#9a3412" />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#9a3412', letterSpacing: '0.1em', marginBottom: 4 }}>
              VIGILANCE DOCUMENTAIRE
            </div>
            <p style={{ fontSize: 13.5, color: '#7c2d12', lineHeight: 1.6, margin: 0 }}>
              {verdict.alerte_documents}
            </p>
          </div>
        </div>
      )}

      {/* ─── BLOC 5 — Plan avant signature ─── */}
      {verdict.points_a_approfondir && verdict.points_a_approfondir.length > 0 && (
        <div style={{ background: '#fff', border: '1.5px solid #edf2f7', borderRadius: 16, padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 15 }}>📋</div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d', letterSpacing: '0.12em' }}>
              À VÉRIFIER AVANT DE SIGNER
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {verdict.points_a_approfondir.map((pt, pti) => (
              <div key={pti} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10, background: '#fafbfc', border: '1px solid #f1f5f9' }}>
                <span style={{
                  fontSize: 10, padding: '3px 9px', borderRadius: 5, background: '#2a7d9c', color: '#fff', fontWeight: 800, letterSpacing: '0.04em', flexShrink: 0, marginTop: 1, whiteSpace: 'nowrap',
                }}>
                  {pt.bien.toUpperCase()}
                </span>
                <span style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.55, fontWeight: 500 }}>{pt.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.55, textAlign: 'center', marginTop: 4 }}>
        Ce verdict est établi uniquement à partir des documents fournis et ne remplace pas l'avis d'un professionnel.
      </p>
    </motion.div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({ kpi, analyses }: { kpi: KpiDifferenciant; analyses: AnalyseLite[] }) {
  const nbBiens = analyses.length;
  return (
    <div style={{ background: '#fff', border: '1.5px solid #edf2f7', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.12em', marginBottom: 4 }}>
          {kpi.label.toUpperCase()}
        </div>
        {kpi.ecart_label && (
          <div style={{ fontSize: 12, color: '#2a7d9c', fontWeight: 700 }}>
            {kpi.ecart_label}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Array.from({ length: nbBiens }).map((_, i) => {
          const v = kpi.valeurs?.find(x => x.bien_idx === i);
          if (!v) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: '#fafbfc' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Bien {i + 1}</span>
                <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>—</span>
              </div>
            );
          }
          const color = v.rang === 'favorable' ? '#16a34a' : v.rang === 'defavorable' ? '#dc2626' : '#64748b';
          const bg = v.rang === 'favorable' ? '#f0fdf4' : v.rang === 'defavorable' ? '#fef2f2' : '#fafbfc';
          const border = v.rang === 'favorable' ? '#bbf7d0' : v.rang === 'defavorable' ? '#fecaca' : '#f1f5f9';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: bg, border: `1px solid ${border}` }}>
              <span style={{ fontSize: 11, color: '#0f172a', fontWeight: 700 }}>Bien {i + 1}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color }}>{v.valeur_affichee}</span>
            </div>
          );
        })}
      </div>

      {kpi.pourquoi_differenciant && (
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, paddingTop: 10, borderTop: '1px dashed #e2e8f0', fontStyle: 'italic' }}>
          {kpi.pourquoi_differenciant}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   VERDICT LEGACY — fallback
   ══════════════════════════════════════════ */

function VerdictLegacyRender({ verdict }: { verdict: VerdictLegacy }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: '22px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Shield size={16} color="#2a7d9c" />
        <div style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verdict Verimo</div>
      </div>
      <p style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 12, lineHeight: 1.5 }}>
        {verdict.titre_verdict}
      </p>
      {verdict.synthese && <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.65, marginBottom: 12 }}>{verdict.synthese}</p>}
      {verdict.conseil && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fff', border: '1px solid rgba(42,125,156,0.15)', fontSize: 13, color: '#0f172a', lineHeight: 1.55 }}>
          💡 {verdict.conseil}
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   SECTIONS COMPLÉMENTAIRES (accordéons)
   ══════════════════════════════════════════ */

function ComparaisonDetaillee({ analyses, resultsData, bestIdx }: { analyses: AnalyseLite[]; resultsData: (ReturnType<typeof getResultData>)[]; bestIdx: number }) {
  const cols = analyses.length;
  const rows = [
    {
      label: 'Score global', render: (a: AnalyseLite) => {
        const s = a.score ?? 0; const sc = getScoreColor(s);
        return <span style={{ fontSize: 17, fontWeight: 900, color: sc }}>{s.toFixed(1)}<span style={{ fontSize: 11, opacity: 0.6 }}>/20</span></span>;
      }
    },
    { label: 'Niveau', render: (a: AnalyseLite) => <span style={{ fontSize: 13.5, color: getScoreColor(a.score ?? 0), fontWeight: 700 }}>{getScoreLabel(a.score ?? 0)}</span> },
    { label: 'DPE', render: (_a: AnalyseLite, i: number) => { const d = resultsData[i]; return d ? <DpeCell classe={d.dpe} /> : <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>; } },
    {
      label: 'Travaux votés', render: (_a: AnalyseLite, i: number) => {
        const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
        const n = d.travaux_votes;
        return <span style={{ fontSize: 13.5, fontWeight: 600, color: n === 0 ? '#64748b' : n >= 3 ? '#d97706' : '#0f172a' }}>{n} travaux</span>;
      }
    },
    {
      label: 'Travaux évoqués', render: (_a: AnalyseLite, i: number) => {
        const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
        const n = d.travaux_evoques;
        return <span style={{ fontSize: 13.5, fontWeight: 600, color: n === 0 ? '#64748b' : '#d97706' }}>{n} évoqués</span>;
      }
    },
    {
      label: 'Procédures', render: (_a: AnalyseLite, i: number) => {
        const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
        return <span style={{ fontSize: 13.5, fontWeight: 600, color: d.procedures === 0 ? '#64748b' : '#dc2626' }}>{d.procedures === 0 ? 'Aucune' : `⚠ ${d.procedures} détectée${d.procedures > 1 ? 's' : ''}`}</span>;
      }
    },
    {
      label: 'Fonds travaux', render: (_a: AnalyseLite, i: number) => {
        const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
        const s = d.fonds_travaux_statut;
        return <span style={{ fontSize: 13.5, fontWeight: 600, color: s === 'insuffisant' || s === 'absent' ? '#dc2626' : '#64748b' }}>
          {s === 'conforme' ? 'Conforme' : s === 'bien' ? 'Bien' : s === 'excellent' ? 'Excellent' : s === 'insuffisant' ? '⚠ Insuffisant' : s === 'absent' ? '⚠ Absent' : '—'}
        </span>;
      }
    },
    {
      label: 'Impayés vendeur', render: (_a: AnalyseLite, i: number) => {
        const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
        return <span style={{ fontSize: 13.5, fontWeight: 600, color: d.impayes ? '#dc2626' : '#64748b' }}>{d.impayes ? '⚠ Détectés' : 'Aucun'}</span>;
      }
    },
    {
      label: 'Charges/an lot', render: (_a: AnalyseLite, i: number) => {
        const d = resultsData[i]; if (!d || !d.charges_annuelles) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              {d.charges_is_estimation ? '~ ' : ''}{d.charges_annuelles.toLocaleString('fr-FR')} €
            </span>
            {d.charges_is_estimation && <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>estimation</span>}
          </div>
        );
      }
    },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cols}, 1fr)`, borderBottom: '2px solid #f1f5f9', background: '#fafbfc' }}>
        <div style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Critère</div>
        {analyses.map((_, i) => (
          <div key={i} style={{ padding: '12px 18px', borderLeft: '1px solid #f1f5f9', fontSize: 13.5, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Bien {i + 1} {i === bestIdx ? '⭐' : ''}
          </div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cols}, 1fr)`, borderBottom: ri < rows.length - 1 ? '1px solid #f8fafc' : 'none' }}>
          <div style={{ padding: '14px 18px', fontSize: 13.5, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center' }}>{row.label}</div>
          {analyses.map((a, j) => (
            <div key={j} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', borderLeft: '1px solid #f1f5f9' }}>
              {row.render(a, j)}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function ResumeFinancier({ analyses, resultsData, bestIdx }: { analyses: AnalyseLite[]; resultsData: (ReturnType<typeof getResultData>)[]; bestIdx: number }) {
  const cols = analyses.length;
  const rows = [
    { label: 'Charges annuelles', get: (d: NonNullable<ReturnType<typeof getResultData>>) => ({ val: d.financier.charges_annuelles, est: d.financier.charges_is_estimation }) },
    { label: 'Cotisation trimestrielle fonds travaux', get: (d: NonNullable<ReturnType<typeof getResultData>>) => ({ val: d.financier.fonds_travaux_annuel, est: false }) },
    { label: 'Taxe foncière annuelle', get: (d: NonNullable<ReturnType<typeof getResultData>>) => ({ val: d.financier.taxe_fonciere, est: false }) },
    { label: 'Fonds de travaux du lot à rembourser au vendeur', get: (d: NonNullable<ReturnType<typeof getResultData>>) => ({ val: d.financier.fonds_alur_signature, est: false }) },
    { label: 'Fonds de roulement à rembourser au vendeur', get: (d: NonNullable<ReturnType<typeof getResultData>>) => ({ val: d.financier.fonds_roulement_signature, est: false }) },
  ];

  return (
    <>
      <div style={{ padding: '10px 16px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>💡</span>
        <span style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.55 }}>
          <strong>À ne pas oublier</strong> — si le chauffage ou l'eau chaude sont <strong>individuels</strong> (non collectifs), ces consommations ne sont pas incluses dans les charges ci-dessous. Rapprochez-vous du vendeur pour connaître les montants annuels exacts avant signature.
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `240px repeat(${cols}, 1fr)`, minWidth: cols === 3 ? 720 : 480 }}>
          <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#fafbfc' }}>Poste</div>
          {analyses.map((_, i) => (
            <div key={i} style={{ padding: '10px 16px', borderLeft: '1px solid #f1f5f9', borderBottom: '2px solid #f1f5f9', background: '#fafbfc', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
              Bien {i + 1} {i === bestIdx ? '⭐' : ''}
            </div>
          ))}

          {rows.map((row, ri) => (
            <React.Fragment key={ri}>
              <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f8fafc' }}>{row.label}</div>
              {resultsData.map((d, j) => {
                const cell = d ? row.get(d) : { val: null, est: false };
                return (
                  <div key={j} style={{ padding: '10px 16px', borderLeft: '1px solid #f1f5f9', borderBottom: '1px solid #f8fafc', fontSize: 13, fontWeight: 600, color: cell.val ? '#0f172a' : '#94a3b8' }}>
                    {cell.val ? (
                      <span>
                        {cell.est ? '~ ' : ''}{Math.round(cell.val).toLocaleString('fr-FR')} €
                        {cell.est && <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginLeft: 4 }}>estimation</span>}
                      </span>
                    ) : <span style={{ fontSize: 11, fontStyle: 'italic' }}>Non renseigné / non détecté</span>}
                  </div>
                );
              })}
            </React.Fragment>
          ))}

          <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#0f172a', borderTop: '2px solid #2a7d9c', background: '#f0f7fb' }}>Total estimé année 1</div>
          {resultsData.map((d, j) => {
            const total = d?.financier?.total_annee_1 || 0;
            const allTotals = resultsData.filter(r => r?.financier?.has_data).map(r => r!.financier.total_annee_1);
            const isBestFinancier = total > 0 && total === Math.min(...allTotals.filter(t => t > 0));
            return (
              <div key={j} style={{ padding: '12px 16px', borderLeft: '1px solid #f1f5f9', borderTop: '2px solid #2a7d9c', background: isBestFinancier ? '#f0fdf4' : '#f0f7fb', fontSize: 15, fontWeight: 900, color: isBestFinancier ? '#16a34a' : '#0f172a' }}>
                {total > 0 ? `${Math.round(total).toLocaleString('fr-FR')} €` : '—'}
                {isBestFinancier && <span style={{ fontSize: 10, marginLeft: 6 }}>✓ le moins cher</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '12px 20px', background: '#fafbfc', borderTop: '1px solid #f1f5f9' }}>
        <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
          * Estimation basée sur les éléments présents dans vos documents. Les travaux évoqués non votés et les éventuels appels de fonds exceptionnels ne sont pas inclus. Les montants précédés de « ~ » sont calculés via le budget global × tantièmes du lot.
        </p>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
   ══════════════════════════════════════════ */

const COMPARER_URL = 'https://veszrayromldfgetqaxb.supabase.co/functions/v1/comparer';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk';

export default function RapportComparaisonPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idsParam = searchParams.get('ids') || '';
  const ids = useMemo(() => idsParam.split(',').map(s => s.trim()).filter(Boolean), [idsParam]);

  const [analyses, setAnalyses] = useState<AnalyseLite[]>([]);
  const [verdict, setVerdict] = useState<VerdictAny | null>(null);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [verdictError, setVerdictError] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [notFound, setNotFound] = useState(false);

  /* ─── Charger les analyses dans l'ordre des ids ─── */
  const loadAnalyses = useCallback(async () => {
    if (ids.length < 2 || ids.length > 3) {
      setNotFound(true);
      setLoadingAnalyses(false);
      return;
    }
    setLoadingAnalyses(true);
    try {
      const loaded = await Promise.all(ids.map(async id => {
        const data = await fetchAnalyseById(id);
        if (!data) return null;
        const resultObj = (data.result as Record<string, unknown> | null) || null;
        const titreFromResult = resultObj ? (resultObj.titre as string | undefined) : undefined;
        return {
          id: data.id,
          title: data.title || '',
          adresse_bien: titreFromResult || data.address || data.title || 'Bien sans titre',
          score: data.score,
          date: data.created_at ? new Date(data.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          result: resultObj,
        } as AnalyseLite;
      }));
      const valid = loaded.filter((a): a is AnalyseLite => a !== null);
      if (valid.length !== ids.length) {
        setNotFound(true);
      } else {
        setAnalyses(valid);
      }
    } catch (e) {
      console.error('[RapportComparaisonPage] load error', e);
      setNotFound(true);
    }
    setLoadingAnalyses(false);
  }, [ids]);

  /* ─── Appeler l'edge function comparer ─── */
  const loadVerdict = useCallback(async () => {
    if (ids.length < 2) return;
    // Check cache
    setVerdictLoading(true);
    setVerdictError(false);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) { setVerdictLoading(false); setVerdictError(true); return; }

      // Vérifier le cache côté DB pour savoir si c'est une réouverture
      const sortedIds = [...ids].sort().join(',');
      const { data: existing } = await supabase
        .from('comparaisons')
        .select('verdict')
        .eq('user_id', session.user.id)
        .eq('analyse_ids', sortedIds)
        .maybeSingle();
      if (existing?.verdict) {
        setFromCache(true);
        // petit délai pour que l'écran de cache s'affiche proprement
        setTimeout(() => {
          setVerdict(existing.verdict as VerdictAny);
          setVerdictLoading(false);
        }, 1200);
        return;
      }

      // Sinon, lancer l'appel edge
      const res = await fetch(COMPARER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ analyseIds: ids }),
      });

      if (!res.ok) { setVerdictLoading(false); setVerdictError(true); return; }
      const data = await res.json();
      if (data.success && data.verdict) {
        setVerdict(data.verdict as VerdictAny);
        if (data.cached) setFromCache(true);
      } else {
        setVerdictError(true);
      }
    } catch (e) {
      console.error('[RapportComparaisonPage] verdict error', e);
      setVerdictError(true);
    }
    setVerdictLoading(false);
  }, [ids]);

  useEffect(() => { loadAnalyses(); }, [loadAnalyses]);
  useEffect(() => {
    if (!loadingAnalyses && !notFound && analyses.length >= 2) loadVerdict();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAnalyses, notFound, analyses.length]);

  /* ─── States d'erreur / not found ─── */
  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif", padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
            <AlertTriangle size={28} color="#dc2626" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>Rapport introuvable</h1>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
            Les analyses demandées sont introuvables ou ne vous appartiennent pas.
          </p>
          <button onClick={() => navigate('/dashboard/compare')}
            style={{ padding: '12px 22px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            Retour à la comparaison
          </button>
        </div>
      </div>
    );
  }

  /* ─── Chargement initial ─── */
  if (loadingAnalyses) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center', maxWidth: 320, padding: '0 24px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', animation: 'rcp-spin 0.9s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Chargement du rapport…</p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Récupération de vos analyses.</p>
        </div>
        <style>{`@keyframes rcp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const resultsData = analyses.map(a => getResultData(a));
  const cols = analyses.length;
  const gridCols = cols === 2 ? '1fr 1fr' : '1fr 1fr 1fr';

  // bestIdx : d'abord from verdict si dispo, sinon fallback best score
  let bestIdx = 0;
  if (verdict && typeof (verdict as VerdictV2).bien_recommande_idx === 'number') {
    bestIdx = (verdict as VerdictV2).bien_recommande_idx;
    if (bestIdx < 0 || bestIdx >= analyses.length) bestIdx = 0;
  } else {
    let bestScore = -Infinity;
    analyses.forEach((a, i) => { if ((a.score ?? 0) > bestScore) { bestScore = a.score ?? 0; bestIdx = i; } });
  }

  const adresses = analyses.map(a => a.adresse_bien || '');

  return (
    <div style={{ minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* ─── Header dark ─── */}
      <div style={{ background: 'linear-gradient(135deg, #0f2d3d 0%, #1a4a5e 100%)', padding: '14px 20px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 2px 12px rgba(15,45,61,0.15)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/dashboard/compare"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '8px 14px', borderRadius: 9, background: '#2a7d9c', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <ChevronLeft size={14} /> Retour
          </Link>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitCompare size={15} color="#fff" style={{ flexShrink: 0, opacity: 0.7 }} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Comparaison de {cols} biens
            </span>
          </div>
          <PdfButton />
        </div>
      </div>

      {/* ─── Body ─── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 48px' }}>
        {/* Écran d'attente ou résultat */}
        {verdictLoading && (
          <WaitingScreen biens={adresses} fromCache={fromCache} />
        )}

        {!verdictLoading && (
          <AnimatePresence mode="wait">
            <motion.div key="content" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* ─── Cards mini biens comparés (petit rappel en haut) ─── */}
              <div className="rcp-biens-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 10 }}>
                {analyses.map((a, i) => {
                  const score = a.score ?? 0;
                  const sc = getScoreColor(score);
                  const isBest = i === bestIdx;
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: '#fff', borderRadius: 12, border: `2px solid ${isBest ? sc : '#edf2f7'}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'relative', boxShadow: isBest ? `0 4px 14px ${sc}18` : '0 1px 4px rgba(0,0,0,0.04)' }}>
                      {isBest && (
                        <div style={{ position: 'absolute', top: -9, left: 12, padding: '2px 8px', borderRadius: 99, background: sc, color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em' }}>
                          ⭐ RECOMMANDÉ
                        </div>
                      )}
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building2 size={14} color="#2a7d9c" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em' }}>BIEN {i + 1}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.adresse_bien}</div>
                      </div>
                      {a.score != null && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 900, color: sc, lineHeight: 1 }}>{score.toFixed(1)}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>/20</div>
                        </div>
                      )}
                      <Link to={`/rapport?id=${a.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, background: '#f4f7f9', border: '1px solid #edf2f7', color: '#0f172a', fontSize: 11, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>
                        <FileText size={11} />
                        <span className="rcp-btn-detail-label">Détail</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* ─── VERDICT (Premium si V2, Legacy sinon, fallback basique si erreur) ─── */}
              {verdictError && !verdict && (
                <div style={{ padding: '20px 22px', borderRadius: 16, background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <AlertTriangle size={16} color="#d97706" />
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: '#9a3412' }}>Verdict indisponible</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#7c2d12', lineHeight: 1.6, margin: 0 }}>
                    Le verdict comparatif n'a pas pu être généré. Les sections ci-dessous restent consultables.
                  </p>
                </div>
              )}

              {verdict && isVerdictV2(verdict) && (
                <VerdictPremium verdict={verdict} analyses={analyses} />
              )}
              {verdict && !isVerdictV2(verdict) && (
                <VerdictLegacyRender verdict={verdict as VerdictLegacy} />
              )}

              {/* ─── Sections complémentaires (accordéons) ─── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Accordion title="Comparaison détaillée" icon="📊" defaultOpen>
                  <ComparaisonDetaillee analyses={analyses} resultsData={resultsData} bestIdx={bestIdx} />
                </Accordion>

                {resultsData.some(d => d?.financier?.has_data) && (
                  <Accordion title="Résumé financier — 1ère année" icon="💶">
                    <ResumeFinancier analyses={analyses} resultsData={resultsData} bestIdx={bestIdx} />
                  </Accordion>
                )}

                {resultsData.some(d => d && d.travaux_evoques_list.length > 0) && (
                  <Accordion title="Travaux évoqués non votés" icon="⚠️" subtitle="à anticiper dans votre budget">
                    <div className="rcp-section-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                      {analyses.map((a, i) => {
                        const d = resultsData[i];
                        return (
                          <div key={a.id} style={{ padding: '14px 18px', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 10 }}>BIEN {i + 1}</div>
                            {d && d.travaux_evoques_list.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {d.travaux_evoques_list.map((t, ti) => (
                                  <div key={ti} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.5, alignItems: 'flex-start' }}>
                                    <span style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }}>▸</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ color: '#0f172a' }}>{t.label}</span>
                                      {t.montant_estime ? (
                                        <span style={{ color: '#94a3b8', marginLeft: 6 }}>~ {Math.round(t.montant_estime).toLocaleString('fr-FR')} €</span>
                                      ) : (
                                        <span style={{ color: '#cbd5e1', marginLeft: 6, fontSize: 11, fontStyle: 'italic' }}>montant non déterminé</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Aucun travaux évoqué.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Accordion>
                )}

                <Accordion title="Documents analysés par bien" icon="📁"
                  subtitle={analyses.map((_, i) => {
                    const n = resultsData[i]?.documents_analyses?.length || 0;
                    return `Bien ${i + 1} : ${n} doc${n > 1 ? 's' : ''}`;
                  }).join(' • ')}>
                  <div className="rcp-section-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                    {analyses.map((a, i) => {
                      const d = resultsData[i];
                      const docs = d?.documents_analyses || [];
                      return (
                        <div key={a.id} style={{ padding: '16px 18px', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>BIEN {i + 1}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: 'rgba(42,125,156,0.08)', padding: '2px 8px', borderRadius: 6 }}>{docs.length} doc{docs.length > 1 ? 's' : ''}</span>
                          </div>
                          {docs.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {docs.map((doc, di) => {
                                const parts = doc.nom.split(/\s[-–]\s/);
                                const filename = parts[0].trim();
                                const description = parts.slice(1).join(' – ').trim();
                                return (
                                  <div key={di} style={{ padding: '8px 10px', borderRadius: 8, background: '#fafbfc', border: '1px solid #f1f5f9', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <FileText size={12} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1.4, wordBreak: 'break-word' }}>{filename}</div>
                                      {description && <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, marginTop: 2, wordBreak: 'break-word' }}>{description}</div>}
                                      {doc.annee && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{doc.annee}</div>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : <p style={{ fontSize: 12, color: '#94a3b8' }}>Non disponible</p>}
                        </div>
                      );
                    })}
                  </div>
                </Accordion>
              </div>

            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <style>{`
        @keyframes rcp-spin { to { transform: rotate(360deg); } }
        @keyframes rcp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes rcp-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 720px) {
          .rcp-kpi-grid { grid-template-columns: 1fr !important; }
          .rcp-biens-grid { grid-template-columns: 1fr !important; }
          .rcp-section-grid { grid-template-columns: 1fr !important; }
          .rcp-btn-detail-label { display: none; }
        }
      `}</style>
    </div>
  );
}
