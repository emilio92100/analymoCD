import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, ShieldCheck, Building2, CheckCircle, FileText, Shield, ArrowRight, AlertTriangle, Trash2, Clock, Eye, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { useAnalyses, type Analyse } from '../../hooks/useAnalyses';
import { supabase } from '../../lib/supabase';

/* ══════════════════════════════════════════
   ÉCRAN D'ATTENTE — analyse comparative en cours
   ══════════════════════════════════════════ */
function CompareWaitingScreen({ biens }: { biens: string[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const n = biens.length;

  useEffect(() => {
    const t1 = setTimeout(() => setCurrentStep(1), 8000);
    const t2 = setTimeout(() => setCurrentStep(2), 18000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

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
        <motion.div
          animate={{ scaleX: [0.7, 1, 0.7], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '50%', left: 50, right: 50, height: 2, background: 'linear-gradient(90deg, transparent, #2a7d9c, transparent)', transformOrigin: 'center' }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Analyse comparative en cours
        </h2>
        <p style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.6 }}>
          Verimo compare vos {n === 2 ? '2' : '3'} biens en profondeur
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {biens.map((adr, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
            style={{ padding: '10px 14px', background: '#fff', borderRadius: 10, border: '1px solid #e0ecf3', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(42,125,156,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Building2 size={14} color="#2a7d9c" />
            </div>
            <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              Bien {i + 1} — {adr}
            </span>
          </motion.div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
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
                transition: 'all 0.3s',
              }}>
                {isDone ? (
                  <CheckCircle size={16} color="#fff" />
                ) : isActive ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 14, height: 14, borderRadius: '50%', border: '2.5px solid #2a7d9c', borderTopColor: 'transparent' }} />
                ) : (
                  <span style={{ fontSize: 13 }}>{step.icon}</span>
                )}
              </div>
              <span style={{
                fontSize: 14, lineHeight: 1.5,
                color: isDone ? '#16a34a' : isActive ? '#0f172a' : '#94a3b8',
                fontWeight: isDone || isActive ? 700 : 500,
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>
        L'analyse prend généralement moins d'une minute
      </p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MINI LOADER — réouverture depuis historique
   ══════════════════════════════════════════ */
function CompareCacheLoader() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ padding: '60px 32px', borderRadius: 20, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, minHeight: 280, justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid #2a7d9c', borderTopColor: 'transparent' }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Patientez</p>
        <p style={{ fontSize: 14, color: '#64748b' }}>Votre rapport se charge…</p>
      </div>
    </motion.div>
  );
}

function ScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' }) {
  const color = score >= 14 ? '#16a34a' : score >= 10 ? '#d97706' : '#dc2626';
  const bg = score >= 14 ? '#f0fdf4' : score >= 10 ? '#fffbeb' : '#fef2f2';
  const bord = score >= 14 ? '#bbf7d0' : score >= 10 ? '#fde68a' : '#fecaca';
  const fs = size === 'md' ? 18 : 14;
  const pad = size === 'md' ? '5px 12px' : '3px 9px';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, padding: pad, borderRadius: 10, background: bg, border: `1.5px solid ${bord}`, fontSize: fs, fontWeight: 900, color, letterSpacing: '-0.01em', flexShrink: 0 }}>
      {score.toFixed(1)}<span style={{ fontSize: fs * 0.55, fontWeight: 600, opacity: 0.65 }}>/20</span>
    </span>
  );
}

function getScoreColor(s: number) {
  if (s >= 17) return '#15803d'; if (s >= 14) return '#16a34a'; if (s >= 10) return '#d97706'; if (s >= 7) return '#ea580c'; return '#dc2626';
}
function getScoreLabel(s: number) {
  if (s >= 17) return 'Bien irréprochable'; if (s >= 14) return 'Bien sain'; if (s >= 10) return 'Bien correct avec réserves'; if (s >= 7) return 'Bien risqué'; return 'Bien à éviter';
}
function getScoreBg(s: number) {
  if (s >= 14) return '#f0fdf4'; if (s >= 10) return '#fffbeb'; if (s >= 7) return '#fff7ed'; return '#fef2f2';
}
function getScoreBorder(s: number) {
  if (s >= 17) return '#bbf7d0'; if (s >= 14) return '#d1fae5'; if (s >= 10) return '#fde68a'; if (s >= 7) return '#fed7aa'; return '#fecaca';
}

function buildVerdict(analyses: Analyse[], resultsData: (ReturnType<typeof getResultData>)[]) {
  const sorted = [...analyses].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const best = sorted[0];
  const bestIdx = analyses.findIndex(a => a.id === best.id);
  const bestData = resultsData[bestIdx];
  const bestScore = best.score ?? 0;

  const raisons: string[] = [];
  if (bestScore >= 14) raisons.push('Score solide — bien globalement sain selon les documents analysés');
  else if (bestScore >= 10) raisons.push('Score correct — quelques réserves identifiées');
  else raisons.push('Attention — des risques significatifs ont été identifiés');

  const diff = (sorted[0].score ?? 0) - (sorted[sorted.length - 1].score ?? 0);
  if (diff >= 3) raisons.push(`Écart de ${diff.toFixed(1)} points avec le bien le moins bien noté`);
  if (bestData?.categories) {
    const cats = bestData.categories;
    const forces: string[] = [];
    if (cats.travaux.note >= 4) forces.push('travaux');
    if (cats.finances.note >= 3.5) forces.push('finances');
    if (forces.length > 0) raisons.push(`Points forts : ${forces.join(', ')}`);
  }

  return { best, raisons };
}

const COMPARER_URL = 'https://veszrayromldfgetqaxb.supabase.co/functions/v1/comparer';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk';

/* ══════════════════════════════════════════
   TYPES verdict — compatibles ancien ET nouveau schéma
   ══════════════════════════════════════════ */

// Ancien format (sessions précédentes, verdicts déjà en BDD)
type VerdictLegacy = {
  bien_recommande_idx: number;
  titre_verdict: string;
  synthese: string;
  forces_bien_recommande: string[];
  points_attention: string[];
  conseil: string;
  alerte_documents: string | null;
};

// Nouveau format session 8
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
type VerdictV2 = {
  bien_recommande_idx: number;
  titre_verdict: string;
  ecarts_cles: {
    score: VerdictEcart;
    cout_annee_1: VerdictEcart;
    dpe: VerdictEcart;
  };
  profils: VerdictProfil[];
  comparatif: string;
  points_a_approfondir: { bien: string; action: string }[];
  alerte_documents: string | null;
};

type VerdictAny = VerdictLegacy | VerdictV2;

// Détecter format
function isVerdictV2(v: VerdictAny): v is VerdictV2 {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(v && typeof v === 'object' && Array.isArray((v as any).profils) && (v as any).ecarts_cles);
}

type ComparaisonSaved = {
  id: string;
  analyse_ids: string;
  verdict: VerdictAny;
  created_at: string;
};

/* ══════════════════════════════════════════
   PARSER tantièmes : "171/9865emes" → { num: 171, den: 9865 }
   ══════════════════════════════════════════ */
function parseTantiemes(raw: unknown): { num: number; den: number } | null {
  if (typeof raw !== 'string') return null;
  const m = raw.replace(/\s/g, '').match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  const den = parseInt(m[2], 10);
  if (!num || !den || den < num) return null;
  return { num, den };
}

// Données enrichies depuis le résultat JSON de Claude
function getResultData(a: Analyse) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = (a as any).result as Record<string, unknown> | null;
  if (!r) return null;

  const cats = r.categories as Record<string, { note: number; note_max: number }> | null;
  const fin = r.finances as Record<string, unknown> | null;
  const preEtat = r.pre_etat_date as Record<string, unknown> | null;
  const lotAchete = r.lot_achete as Record<string, unknown> | null;
  const chargesFutures = preEtat?.charges_futures as Record<string, unknown> | null;

  const parseNum = (v: unknown): number | null => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') { const n = parseFloat(v.replace(/[^0-9.,-]/g, '').replace(',', '.')); return isNaN(n) ? null : n; }
    return null;
  };

  // Cascade charges annuelles
  let chargesAnnuelles: number | null = null;
  let chargesIsEstimation = false;

  chargesAnnuelles = parseNum(fin?.charges_annuelles_lot);
  if (!chargesAnnuelles) {
    const trim = parseNum(chargesFutures?.montant_trimestriel);
    if (trim) chargesAnnuelles = trim * 4;
  }
  if (!chargesAnnuelles) {
    chargesAnnuelles = parseNum(chargesFutures?.montant_annuel);
  }
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
      fonds_alur_signature: fondsAlurSignature,
      fonds_roulement_signature: fondsRoulementSignature,
      total_annee_1: (chargesAnnuelles || 0) + (fondsTravAnnuel || 0) + (fondsAlurSignature || 0) + (fondsRoulementSignature || 0),
      has_data: !!(chargesAnnuelles || fondsTravAnnuel || fondsAlurSignature || fondsRoulementSignature),
    },
  };
}

function DpeCell({ classe }: { classe: string | null }) {
  if (!classe) return <span style={{ fontSize: 12, color: '#94a3b8' }}>—</span>;
  const colors: Record<string, string> = { A: '#16a34a', B: '#22c55e', C: '#84cc16', D: '#eab308', E: '#f97316', F: '#ef4444', G: '#991b1b' };
  const c = colors[classe] || '#94a3b8';
  return <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 10px', borderRadius: 6, background: `${c}18`, color: c, border: `1px solid ${c}40` }}>Classe {classe}</span>;
}

/* ══════════════════════════════════════════
   ACCORDION — bloc repliable réutilisable
   ══════════════════════════════════════════ */
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
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   BADGE IMPACT — majeur / modéré / mineur
   ══════════════════════════════════════════ */
function ImpactBadge({ impact, kind }: { impact?: 'majeur' | 'modere' | 'mineur' | null; kind: 'force' | 'faible' }) {
  if (!impact || impact === 'mineur') return null;
  if (impact !== 'majeur') return null; // on n'affiche que les "majeur" pour ne pas surcharger
  const color = kind === 'force' ? '#16a34a' : '#dc2626';
  const bg = kind === 'force' ? '#f0fdf4' : '#fef2f2';
  return (
    <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: bg, color, marginLeft: 6, verticalAlign: 'middle', letterSpacing: '0.02em' }}>
      majeur
    </span>
  );
}

/* ══════════════════════════════════════════
   ÉCARTS CLÉS — Style C : barres visuelles
   ══════════════════════════════════════════ */
function EcartsCles({ ecarts, nbBiens, bestIdx }: { ecarts: VerdictV2['ecarts_cles']; nbBiens: number; bestIdx: number }) {
  const biens: Array<{ label: string; score: number | null; cout: number | null; dpe: string | null; isBest: boolean }> = [];
  const scoreMax = 20;
  const dpeColors: Record<string, { bg: string; color: string }> = {
    A: { bg: '#f0fdf4', color: '#16a34a' }, B: { bg: '#f0fdf4', color: '#22c55e' }, C: { bg: '#f7fee7', color: '#84cc16' },
    D: { bg: '#fef9c3', color: '#a16207' }, E: { bg: '#ffedd5', color: '#c2410c' }, F: { bg: '#fef2f2', color: '#dc2626' }, G: { bg: '#fef2f2', color: '#991b1b' },
  };

  const getVal = (e: VerdictEcart, idx: number): number | string | null => {
    if (idx === 0) return e.bien_1;
    if (idx === 1) return e.bien_2;
    if (idx === 2) return e.bien_3;
    return null;
  };

  for (let i = 0; i < nbBiens; i++) {
    const s = getVal(ecarts.score, i);
    const c = getVal(ecarts.cout_annee_1, i);
    const d = getVal(ecarts.dpe, i);
    biens.push({
      label: `Bien ${i + 1}`,
      score: typeof s === 'number' ? s : (typeof s === 'string' ? parseFloat(s) : null),
      cout: typeof c === 'number' ? c : (typeof c === 'string' ? parseFloat(c) : null),
      dpe: typeof d === 'string' ? d.toUpperCase() : null,
      isBest: i === bestIdx,
    });
  }

  // Max cout pour barres
  const maxCout = Math.max(...biens.map(b => b.cout || 0), 1);

  return (
    <div style={{ background: '#fff', border: '1px solid #e0ecf3', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <ArrowLeftRight size={12} color="#2a7d9c" />
        <span style={{ fontSize: 10.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.1em' }}>ÉCARTS CLÉS</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Score global */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Score global</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{ecarts.score.delta_label}</span>
          </div>
          {biens.map((b, i) => b.score != null && (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 50px', gap: 10, alignItems: 'center', fontSize: 12, marginBottom: i < biens.length - 1 ? 4 : 0 }}>
              <span style={{ color: '#64748b' }}>Bien {i + 1}</span>
              <div style={{ background: '#f1f5f9', borderRadius: 2, height: 5, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(b.score / scoreMax) * 100}%` }}
                  transition={{ duration: 0.9, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', background: b.isBest ? '#16a34a' : '#94a3b8', borderRadius: 2 }} />
              </div>
              <span style={{ textAlign: 'right', fontWeight: b.isBest ? 700 : 500, color: b.isBest ? '#16a34a' : '#0f172a' }}>{b.score.toFixed(1)}</span>
            </div>
          ))}
        </div>

        {/* Coût année 1 */}
        {biens.some(b => b.cout != null) && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Coût année 1</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{ecarts.cout_annee_1.delta_label}</span>
            </div>
            {biens.map((b, i) => {
              if (b.cout == null) return null;
              // Moins c'est cher, mieux c'est — le "best cout" est le min
              const minCout = Math.min(...biens.filter(x => x.cout != null).map(x => x.cout!));
              const isBestCout = b.cout === minCout;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 70px', gap: 10, alignItems: 'center', fontSize: 12, marginBottom: i < biens.length - 1 ? 4 : 0 }}>
                  <span style={{ color: '#64748b' }}>Bien {i + 1}</span>
                  <div style={{ background: '#f1f5f9', borderRadius: 2, height: 5, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(b.cout / maxCout) * 100}%` }}
                      transition={{ duration: 0.9, delay: i * 0.1 + 0.1, ease: [0.22, 1, 0.36, 1] }}
                      style={{ height: '100%', background: isBestCout ? '#16a34a' : '#94a3b8', borderRadius: 2 }} />
                  </div>
                  <span style={{ textAlign: 'right', fontWeight: isBestCout ? 700 : 500, color: isBestCout ? '#16a34a' : '#0f172a' }}>{Math.round(b.cout).toLocaleString('fr-FR')} €</span>
                </div>
              );
            })}
          </div>
        )}

        {/* DPE */}
        {biens.some(b => b.dpe) && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>DPE</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{ecarts.dpe.delta_label}</span>
            </div>
            {biens.map((b, i) => b.dpe && (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px auto 1fr', gap: 10, alignItems: 'center', fontSize: 12, marginBottom: i < biens.length - 1 ? 4 : 0 }}>
                <span style={{ color: '#64748b' }}>Bien {i + 1}</span>
                <span style={{ padding: '2px 8px', borderRadius: 4, background: dpeColors[b.dpe]?.bg || '#f1f5f9', color: dpeColors[b.dpe]?.color || '#64748b', fontWeight: 700, fontSize: 11.5 }}>Classe {b.dpe}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   VERDICT V2 — nouveau rendu structuré
   ══════════════════════════════════════════ */
function VerdictV2Render({ verdict, adresses, bestId, selectedAnalyses }: { verdict: VerdictV2; adresses: string[]; bestId: string; selectedAnalyses: Analyse[] }) {
  const nbBiens = adresses.length;
  // bien_recommande_idx selon claude, fallback sur best id
  let bestIdx = typeof verdict.bien_recommande_idx === 'number' ? verdict.bien_recommande_idx : -1;
  if (bestIdx < 0 || bestIdx >= nbBiens) {
    bestIdx = selectedAnalyses.findIndex(a => a.id === bestId);
    if (bestIdx < 0) bestIdx = 0;
  }
  const gridCols = nbBiens === 2 ? '1fr 1fr' : '1fr 1fr 1fr';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{ padding: '22px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5', boxShadow: '0 4px 16px rgba(42,125,156,0.08)' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Shield size={16} color="#2a7d9c" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verdict Verimo</div>
      </div>

      {/* Titre */}
      <p style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 16, lineHeight: 1.5 }}>
        {verdict.titre_verdict}
      </p>

      {/* Écarts clés — style barres */}
      {verdict.ecarts_cles && (
        <div style={{ marginBottom: 18 }}>
          <EcartsCles ecarts={verdict.ecarts_cles} nbBiens={nbBiens} bestIdx={bestIdx} />
        </div>
      )}

      {/* Profils par bien — 1 colonne = 1 bien (forces + points faibles par bien) */}
      {verdict.profils && verdict.profils.length > 0 && (
        <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, marginBottom: 14 }}>
          {verdict.profils.slice(0, nbBiens).map((p, idx) => {
            const isBest = idx === bestIdx;
            const adresse = adresses[idx] || '';
            return (
              <div key={idx} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: isBest ? '2px solid #16a34a' : '1px solid #e0ecf3', position: 'relative' }}>
                {isBest && (
                  <div style={{ position: 'absolute', top: -11, left: 14, padding: '3px 12px', background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', borderRadius: 99, whiteSpace: 'nowrap' }}>
                    ⭐ RECOMMANDÉ
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4, marginTop: isBest ? 6 : 0 }}>
                  <span style={{ fontSize: 10.5, color: '#94a3b8', letterSpacing: '0.1em', fontWeight: 700 }}>BIEN {idx + 1}</span>
                </div>
                {adresse && <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12, lineHeight: 1.35 }}>{adresse}</div>}

                {/* Forces */}
                {p.forces && p.forces.length > 0 && (
                  <>
                    <div style={{ fontSize: 10.5, color: '#16a34a', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={11} /> FORCES
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {p.forces.map((f, fi) => (
                        <div key={fi} style={{ fontSize: 13, lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{f.titre}</span>
                          <ImpactBadge impact={f.impact} kind="force" />
                          {f.detail && <div style={{ color: '#64748b', marginTop: 2 }}>{f.detail}</div>}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Points faibles */}
                {p.points_faibles && p.points_faibles.length > 0 && (
                  <>
                    <div style={{ fontSize: 10.5, color: '#d97706', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={11} /> À SURVEILLER
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {p.points_faibles.map((pf, pfi) => (
                        <div key={pfi} style={{ fontSize: 13, lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>{pf.titre}</span>
                          <ImpactBadge impact={pf.impact} kind="faible" />
                          {pf.detail && <div style={{ color: '#64748b', marginTop: 2 }}>{pf.detail}</div>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Comparatif — ce qui diffère */}
      {verdict.comparatif && (
        <div style={{ background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.25)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <GitCompare size={11} /> CE QUI DIFFÈRE
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: '#0f2d3d' }}>{verdict.comparatif}</div>
        </div>
      )}

      {/* Alerte documents */}
      {verdict.alerte_documents && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', marginBottom: 12, fontSize: 12.5, color: '#9a3412', lineHeight: 1.55 }}>
          📁 {verdict.alerte_documents}
        </div>
      )}

      {/* Points à approfondir */}
      {verdict.points_a_approfondir && verdict.points_a_approfondir.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid rgba(42,125,156,0.15)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            💡 POINTS À APPROFONDIR AVANT DE SIGNER
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {verdict.points_a_approfondir.map((pt, pti) => (
              <div key={pti} style={{ fontSize: 13, lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 9.5, padding: '2px 7px', borderRadius: 4, background: '#f1f5f9', color: '#475569', fontWeight: 700, letterSpacing: '0.04em', flexShrink: 0, marginTop: 2 }}>
                  {pt.bien.toUpperCase()}
                </span>
                <span style={{ color: '#0f172a' }}>{pt.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.55, marginTop: 12 }}>
        Ce verdict est établi uniquement à partir des données disponibles dans vos rapports et ne remplace pas l'avis d'un professionnel de l'immobilier.
      </p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   VERDICT LEGACY — fallback pour anciennes comparaisons sauvegardées
   ══════════════════════════════════════════ */
function VerdictLegacyRender({ verdict }: { verdict: VerdictLegacy }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{ padding: '22px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5', boxShadow: '0 4px 16px rgba(42,125,156,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Shield size={16} color="#2a7d9c" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verdict Verimo</div>
      </div>

      <p style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 14, lineHeight: 1.5 }}>
        {verdict.titre_verdict}
      </p>

      {verdict.synthese && (
        <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>
          {verdict.synthese}
        </p>
      )}

      {verdict.forces_bien_recommande?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', letterSpacing: '0.08em', marginBottom: 8 }}>✓ FORCES IDENTIFIÉES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {verdict.forces_bien_recommande.map((f, i) => (
              <div key={i} style={{ fontSize: 13.5, color: '#166534', lineHeight: 1.55 }}>• {f}</div>
            ))}
          </div>
        </div>
      )}

      {verdict.points_attention?.length > 0 && (
        <div style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706', letterSpacing: '0.08em', marginBottom: 8 }}>⚠ POINTS D'ATTENTION</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {verdict.points_attention.map((p, i) => (
              <div key={i} style={{ fontSize: 13.5, color: '#92400e', lineHeight: 1.55 }}>• {p}</div>
            ))}
          </div>
        </div>
      )}

      {verdict.alerte_documents && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', marginBottom: 14, fontSize: 12.5, color: '#9a3412', lineHeight: 1.55 }}>
          📁 {verdict.alerte_documents}
        </div>
      )}

      {verdict.conseil && (
        <div style={{ background: '#fff', border: '1px solid rgba(42,125,156,0.15)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 6 }}>💡 POINTS À APPROFONDIR AVANT DE SIGNER</div>
          <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.65, margin: 0 }}>{verdict.conseil}</p>
        </div>
      )}

      <p style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.55, marginTop: 10 }}>
        Ce verdict est établi uniquement à partir des données disponibles dans vos rapports et ne remplace pas l'avis d'un professionnel de l'immobilier.
      </p>
    </motion.div>
  );
}

export default function Compare() {
  const { analyses } = useAnalyses();
  const completedAnalyses = analyses.filter((a: Analyse) => a.type === 'complete' && a.status === 'completed');
  const [selected, setSelected] = useState<string[]>([]);
  const [launched, setLaunched] = useState(false);
  const [verdictIA, setVerdictIA] = useState<VerdictAny | null>(null);
  const [verdictLoading, setVerdictLoading] = useState(false);
  const [verdictError, setVerdictError] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Historique
  const [historique, setHistorique] = useState<ComparaisonSaved[]>([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(true);

  const loadHistorique = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('comparaisons')
        .select('id, analyse_ids, verdict, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setHistorique(data as ComparaisonSaved[]);
    } catch { /* ignore */ }
    setHistoriqueLoading(false);
  }, []);

  useEffect(() => { loadHistorique(); }, [loadHistorique]);

  const deleteComparaison = async (id: string) => {
    if (!confirm('Supprimer cette comparaison ?')) return;
    await supabase.from('comparaisons').delete().eq('id', id);
    setHistorique(prev => prev.filter(c => c.id !== id));
    if (launched && verdictIA) {
      const currentSorted = [...selected].sort().join(',');
      const deleted = historique.find(c => c.id === id);
      if (deleted && deleted.analyse_ids === currentSorted) {
        setLaunched(false); setVerdictIA(null);
      }
    }
  };

  const viewComparaison = (comp: ComparaisonSaved) => {
    const ids = comp.analyse_ids.split(',');
    setSelected(ids);
    let v: VerdictAny | null = null;
    try {
      if (typeof comp.verdict === 'string') {
        v = JSON.parse(comp.verdict) as VerdictAny;
      } else if (comp.verdict && typeof comp.verdict === 'object') {
        v = comp.verdict as VerdictAny;
      }
    } catch (e) {
      console.error('[Compare] Impossible de parser le verdict sauvegardé:', e);
      v = null;
    }
    setIsCached(true);
    setLaunched(true);
    setVerdictError(false);
    setVerdictLoading(true);
    setVerdictIA(null);
    setTimeout(() => {
      setVerdictIA(v);
      setVerdictError(!v);
      setVerdictLoading(false);
    }, 1800);
  };

  const toggleSelect = (id: string) => {
    if (launched) return;
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const selectedAnalyses = completedAnalyses.filter(a => selected.includes(a.id));
  const canLaunch = selected.length >= 2;

  const handleReset = () => {
    setSelected([]);
    setLaunched(false);
    setVerdictIA(null);
    setVerdictError(false);
    setIsCached(false);
  };

  const handleLaunch = async () => {
    if (!canLaunch) return;
    setLaunched(true);
    setVerdictLoading(true);
    setVerdictError(false);
    setVerdictIA(null);
    setIsCached(false);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) { setVerdictLoading(false); setVerdictError(true); return; }

      const res = await fetch(COMPARER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ analyseIds: selected }),
      });

      if (!res.ok) { setVerdictLoading(false); setVerdictError(true); return; }

      const data = await res.json();
      if (data.success && data.verdict) {
        setVerdictIA(data.verdict as VerdictAny);
        if (data.cached) {
          setIsCached(true);
        }
        loadHistorique();
      } else {
        setVerdictError(true);
      }
    } catch {
      setVerdictError(true);
    }
    setVerdictLoading(false);
  };

  if (completedAnalyses.length === 0) return (
    <div>
      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 24 }}>Comparer mes biens</h1>
      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #edf2f7', padding: '52px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(42,125,156,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><GitCompare size={30} style={{ color: '#94a3b8' }} /></div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Il vous faut au minimum 2 analyses complètes</h2>
        <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>La comparaison de biens s'active automatiquement dès que votre compte contient <strong style={{ color: '#0f172a' }}>2 analyses complètes ou plus</strong>.</p>
        <Link to="/dashboard/nouvelle-analyse?type=complete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          <ShieldCheck size={16} /> Lancer une analyse complète
        </Link>
      </div>
    </div>
  );

  if (completedAnalyses.length === 1) return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 24 }}>Comparer mes biens</h1>
      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #edf2f7', padding: '40px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🏠 + ?</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Plus qu'une analyse pour comparer</h2>
        <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75, marginBottom: 8, maxWidth: 380, margin: '0 auto 8px' }}>Vous avez 1 analyse complète. La comparaison se débloque dès que vous en avez <strong style={{ color: '#0f172a' }}>une deuxième</strong>.</p>
        <div style={{ margin: '20px auto', maxWidth: 360, padding: '14px 18px', borderRadius: 13, background: '#f8fafc', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,125,156,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckCircle size={17} color="#2a7d9c" /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{completedAnalyses[0].adresse_bien}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Analysé le {completedAnalyses[0].date}</div>
          </div>
          {completedAnalyses[0].score != null && <ScoreBadge score={completedAnalyses[0].score} />}
        </div>
        <Link to="/dashboard/nouvelle-analyse?type=complete" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          <ShieldCheck size={15} /> Analyser un 2e bien
        </Link>
      </div>
    </div>
  );

  const maxSelect = completedAnalyses.length >= 3 ? 3 : 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 6 }}>Comparer mes biens</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            {launched
              ? `Comparaison de ${selectedAnalyses.length} bien${selectedAnalyses.length > 1 ? 's' : ''}`
              : `Sélectionnez 2${maxSelect === 3 ? ' ou 3' : ''} biens à comparer, puis lancez la comparaison`}
          </p>
        </div>
        {launched && (
          <button onClick={handleReset} style={{ fontSize: 13, fontWeight: 600, color: '#64748b', background: '#f4f7f9', border: '1px solid #edf2f7', borderRadius: 9, padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Nouvelle sélection
          </button>
        )}
      </div>

      {/* Sélection */}
      {!launched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '14px 18px', background: 'rgba(42,125,156,0.05)', borderRadius: 12, border: '1px solid rgba(42,125,156,0.15)', fontSize: 13, color: '#2a7d9c', fontWeight: 500 }}>
            <strong>{completedAnalyses.length} analyse{completedAnalyses.length > 1 ? 's' : ''} disponible{completedAnalyses.length > 1 ? 's' : ''}</strong> — Cliquez sur les biens à comparer ci-dessous
          </div>

          {completedAnalyses.map((a, idx) => {
            const isSel = selected.includes(a.id);
            const selIdx = selected.indexOf(a.id);
            const score = a.score ?? 0;
            const sc = getScoreColor(score);
            return (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                onClick={() => toggleSelect(a.id)}
                style={{ background: '#fff', borderRadius: 14, border: `2px solid ${isSel ? '#2a7d9c' : '#edf2f7'}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.18s', boxShadow: isSel ? '0 0 0 3px rgba(42,125,156,0.1)' : '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSel ? '#2a7d9c' : '#f4f7f9', border: `1px solid ${isSel ? '#2a7d9c' : '#edf2f7'}`, transition: 'all 0.18s' }}>
                  {isSel ? <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{selIdx + 1}</span> : <Building2 size={15} style={{ color: '#94a3b8' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.adresse_bien}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Analysé le {a.date}</div>
                </div>
                {a.score != null && (
                  <div style={{ padding: '4px 10px', borderRadius: 8, background: getScoreBg(score), border: `1px solid ${getScoreBorder(score)}` }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: sc }}>{score.toFixed(1)}</span>
                    <span style={{ fontSize: 10, color: sc, opacity: 0.7 }}>/20</span>
                  </div>
                )}
              </motion.div>
            );
          })}

          {selected.length === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '11px 16px', borderRadius: 11, background: 'rgba(42,125,156,0.05)', border: '1px solid rgba(42,125,156,0.15)', fontSize: 13, color: '#2a7d9c', fontWeight: 600 }}>
              ✓ 1 bien sélectionné — choisissez {maxSelect === 3 ? 'un 2e ou un 3e bien' : 'un 2e bien'} pour continuer
            </motion.div>
          )}

          {canLaunch && (() => {
            const sortedSelected = [...selected].sort().join(',');
            const existingComp = historique.find(c => c.analyse_ids === sortedSelected);
            if (existingComp) {
              const dateExist = new Date(existingComp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
              return (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ padding: '16px 18px', borderRadius: 14, background: '#f0f7fb', border: '1.5px solid #bae3f5', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>📋</span>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f2d3d', marginBottom: 2 }}>
                        Comparaison déjà effectuée
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                        Vous avez déjà comparé ces {selected.length} biens le {dateExist}.
                      </div>
                    </div>
                  </div>
                  <button onClick={() => viewComparaison(existingComp)}
                    style={{ width: '100%', padding: '13px', borderRadius: 11, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14.5, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,45,61,0.15)' }}>
                    <Eye size={17} />
                    Voir le rapport
                  </button>
                </motion.div>
              );
            }
            return (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={handleLaunch}
                  style={{ width: '100%', padding: '15px', borderRadius: 13, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 16px rgba(15,45,61,0.2)' }}>
                  <GitCompare size={18} />
                  Lancer la comparaison — {selected.length} bien{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            );
          })()}
        </div>
      )}

      {/* Écran d'attente */}
      {launched && verdictLoading && !isCached && (
        <CompareWaitingScreen
          biens={selectedAnalyses.map(a => a.adresse_bien || a.nom_document || 'Bien sans titre')}
        />
      )}

      {launched && verdictLoading && isCached && (
        <CompareCacheLoader />
      )}

      {/* Résultat comparaison */}
      {launched && !verdictLoading && selectedAnalyses.length >= 2 && (() => {
        const resultsData = selectedAnalyses.map(a => getResultData(a));
        const { best } = buildVerdict(selectedAnalyses, resultsData);
        const cols = selectedAnalyses.length;
        const gridCols = cols === 2 ? '1fr 1fr' : '1fr 1fr 1fr';
        const adresses = selectedAnalyses.map(a => a.adresse_bien || '');

        return (
          <AnimatePresence mode="wait">
            <motion.div key="rapport" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ══════════════════════════════════════════════════════════════
                  PHASE 1 — Cards score avec bouton "Voir rapport détaillé" intégré
                  ══════════════════════════════════════════════════════════════ */}
              <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12 }}>
                {selectedAnalyses.map((a, i) => {
                  const score = a.score ?? 0;
                  const sc = getScoreColor(score);
                  const d = resultsData[i];
                  const isBest = a.id === best.id;
                  const circ = 2 * Math.PI * 22;
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      style={{ background: '#fff', borderRadius: 18, border: `2px solid ${isBest ? sc : '#edf2f7'}`, padding: '20px', position: 'relative', boxShadow: isBest ? `0 6px 24px ${sc}18` : '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {isBest && <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 100, background: sc, color: '#fff', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>⭐ Recommandé</div>}

                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 6 }}>BIEN {i + 1}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, minHeight: 36 }}>{a.adresse_bien}</div>
                      </div>

                      {a.score != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <svg width="52" height="52" style={{ flexShrink: 0 }}>
                            <circle cx="26" cy="26" r="22" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                            <motion.circle cx="26" cy="26" r="22" fill="none" stroke={sc} strokeWidth="5" strokeLinecap="round" transform="rotate(-90 26 26)" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - circ * (score / 20) }} transition={{ duration: 1.2, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }} />
                            <text x="26" y="22" textAnchor="middle" fontSize="11" fontWeight="900" fill={sc}>{score.toFixed(1)}</text>
                            <text x="26" y="33" textAnchor="middle" fontSize="8" fill="#94a3b8">/20</text>
                          </svg>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: sc }}>{getScoreLabel(score)}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Analysé le {a.date}</div>
                          </div>
                        </div>
                      )}

                      {/* Mini infos : DPE + total année 1 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 0', borderTop: '1px dashed #f1f5f9', borderBottom: '1px dashed #f1f5f9' }}>
                        {d?.dpe && <DpeCell classe={d.dpe} />}
                        {d?.financier?.has_data && (
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>année 1 :</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                              {d.financier.total_annee_1 > 0 ? `${Math.round(d.financier.total_annee_1).toLocaleString('fr-FR')} €` : '—'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bouton "Voir rapport détaillé" intégré dans la card */}
                      <Link to={`/rapport?id=${a.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: '#f4f7f9', border: '1px solid #edf2f7', color: '#0f172a', fontSize: 12.5, fontWeight: 600, textDecoration: 'none', transition: 'all 0.18s' }}>
                        <FileText size={13} />
                        Voir le rapport détaillé
                        <ArrowRight size={12} />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  PHASE 2 — Verdict Verimo
                  ══════════════════════════════════════════════════════════════ */}

              {/* Verdict fallback si erreur API */}
              {verdictError && !verdictIA && (() => {
                const { best, raisons } = buildVerdict(selectedAnalyses, resultsData);
                return (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '22px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <Shield size={16} color="#2a7d9c" style={{ flexShrink: 0 }} />
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verdict Verimo</div>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>
                      D'après les scores : <span style={{ color: getScoreColor(best.score ?? 0) }}>"{best.adresse_bien}"</span> présente le profil le plus équilibré
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                      {raisons.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <CheckCircle size={14} color="#2a7d9c" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{r}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: '#d97706', fontStyle: 'italic' }}>Le verdict détaillé n'a pas pu être généré. Voici une analyse simplifiée basée sur les scores.</p>
                  </motion.div>
                );
              })()}

              {/* Verdict IA — déplacé en bas de page après les accordéons */}

              {/* ══════════════════════════════════════════════════════════════
                  PHASE 3 — Détails en accordéons
                  ══════════════════════════════════════════════════════════════ */}

              {/* Tableau comparatif — OUVERT par défaut */}
              <Accordion title="Comparaison détaillée" icon="📊" defaultOpen>
                <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cols}, 1fr)`, borderBottom: '2px solid #f1f5f9', background: '#fafbfc' }}>
                  <div style={{ padding: '12px 18px', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Critère</div>
                  {selectedAnalyses.map((a, i) => (
                    <div key={i} style={{ padding: '12px 18px', borderLeft: '1px solid #f1f5f9', fontSize: 13.5, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Bien {i + 1} {a.id === best.id ? '⭐' : ''}
                    </div>
                  ))}
                </div>

                {[
                  {
                    label: 'Score global', render: (a: Analyse) => {
                      const s = a.score ?? 0; const sc = getScoreColor(s);
                      return <span style={{ fontSize: 17, fontWeight: 900, color: sc }}>{s.toFixed(1)}<span style={{ fontSize: 11, opacity: 0.6 }}>/20</span></span>;
                    }
                  },
                  { label: 'Niveau', render: (a: Analyse) => <span style={{ fontSize: 13.5, color: getScoreColor(a.score ?? 0), fontWeight: 700 }}>{getScoreLabel(a.score ?? 0)}</span> },
                  {
                    label: 'DPE', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; return d ? <DpeCell classe={d.dpe} /> : <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
                    }
                  },
                  {
                    label: 'Travaux votés', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
                      const n = d.travaux_votes;
                      return <span style={{ fontSize: 13.5, fontWeight: 600, color: n === 0 ? '#64748b' : n >= 3 ? '#d97706' : '#0f172a' }}>{n} travaux</span>;
                    }
                  },
                  {
                    label: 'Travaux évoqués', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
                      const n = d.travaux_evoques;
                      return <span style={{ fontSize: 13.5, fontWeight: 600, color: n === 0 ? '#64748b' : '#d97706' }}>{n} évoqués</span>;
                    }
                  },
                  {
                    label: 'Procédures', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
                      return <span style={{ fontSize: 13.5, fontWeight: 600, color: d.procedures === 0 ? '#64748b' : '#dc2626' }}>{d.procedures === 0 ? 'Aucune' : `⚠ ${d.procedures} détectée${d.procedures > 1 ? 's' : ''}`}</span>;
                    }
                  },
                  {
                    label: 'Fonds travaux', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
                      const s = d.fonds_travaux_statut;
                      return <span style={{ fontSize: 13.5, fontWeight: 600, color: s === 'insuffisant' || s === 'absent' ? '#dc2626' : '#64748b' }}>
                        {s === 'conforme' ? 'Conforme' : s === 'bien' ? 'Bien' : s === 'excellent' ? 'Excellent' : s === 'insuffisant' ? '⚠ Insuffisant' : s === 'absent' ? '⚠ Absent' : '—'}
                      </span>;
                    }
                  },
                  {
                    label: 'Impayés vendeur', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
                      return <span style={{ fontSize: 13.5, fontWeight: 600, color: d.impayes ? '#dc2626' : '#64748b' }}>{d.impayes ? '⚠ Détectés' : 'Aucun'}</span>;
                    }
                  },
                  {
                    label: 'Charges/an lot', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d || !d.charges_annuelles) return <span style={{ color: '#94a3b8', fontSize: 13 }}>—</span>;
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                            {d.charges_is_estimation ? '~ ' : ''}{d.charges_annuelles.toLocaleString('fr-FR')} €
                          </span>
                          {d.charges_is_estimation && (
                            <span style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic' }}>estimation</span>
                          )}
                        </div>
                      );
                    }
                  },
                ].map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cols}, 1fr)`, borderBottom: ri < 8 ? '1px solid #f8fafc' : 'none' }}>
                    <div style={{ padding: '14px 18px', fontSize: 13.5, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center' }}>{row.label}</div>
                    {selectedAnalyses.map((a, j) => (
                      <div key={j} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', borderLeft: '1px solid #f1f5f9' }}>
                        {row.render(a, j)}
                      </div>
                    ))}
                  </div>
                ))}
              </Accordion>

              {/* Scores par catégorie — OUVERT par défaut */}
              {resultsData.some(d => d?.categories) && (
                <Accordion title="Scores par catégorie" icon="📊" defaultOpen>
                  <div style={{ padding: '16px 20px' }}>
                    {[
                      { key: 'travaux', label: 'Travaux', emoji: '🏗️', max: 5 },
                      { key: 'procedures', label: 'Procédures', emoji: '⚖️', max: 4 },
                      { key: 'finances', label: 'Finances', emoji: '💰', max: 4 },
                      { key: 'diags_privatifs', label: 'Diag. privatifs', emoji: '🏠', max: 4 },
                      { key: 'diags_communs', label: 'Diag. communs', emoji: '🏢', max: 3 },
                    ].map((cat) => {
                      const scores = resultsData.map(d => d?.categories?.[cat.key as keyof NonNullable<NonNullable<ReturnType<typeof getResultData>>['categories']>]?.note ?? 0);
                      const bestScore = Math.max(...scores);
                      const bienColors = ['#2a7d9c', '#7c3aed', '#d97706'];
                      return (
                        <div key={cat.key} style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{cat.label}</span>
                            </div>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>/{cat.max}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {selectedAnalyses.map((a, i) => {
                              const score = scores[i];
                              const pct = (score / cat.max) * 100;
                              const isWinner = score === bestScore && scores.filter(s => s === bestScore).length === 1;
                              return (
                                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', minWidth: 50 }}>Bien {i + 1}</span>
                                  <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 1, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                      style={{ height: '100%', borderRadius: 99, background: isWinner ? '#16a34a' : bienColors[i] || '#2a7d9c' }} />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: isWinner ? '#16a34a' : '#0f172a', minWidth: 32, textAlign: 'right' }}>
                                    {score.toFixed(1)}
                                  </span>
                                  {isWinner && <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 700 }}>✓</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Accordion>
              )}

              {/* Résumé financier — REPLIÉ */}
              {resultsData.some(d => d?.financier?.has_data) && (
                <Accordion title="Résumé financier — 1ère année" icon="💶">
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cols}, 1fr)`, minWidth: cols === 3 ? 640 : 400 }}>
                      <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#fafbfc' }}>Poste</div>
                      {selectedAnalyses.map((a, i) => (
                        <div key={i} style={{ padding: '10px 16px', borderLeft: '1px solid #f1f5f9', borderBottom: '2px solid #f1f5f9', background: '#fafbfc', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                          Bien {i + 1} {a.id === best.id ? '⭐' : ''}
                        </div>
                      ))}

                      {[
                        { label: 'Charges annuelles', get: (d: NonNullable<ReturnType<typeof getResultData>>) => ({ val: d.financier.charges_annuelles, est: d.financier.charges_is_estimation }) },
                        { label: 'Cotisation trimestrielle fonds travaux', get: (d: NonNullable<ReturnType<typeof getResultData>>) => ({ val: d.financier.fonds_travaux_annuel, est: false }) },
                        { label: 'Fonds de travaux du lot à rembourser au vendeur', get: (d: NonNullable<ReturnType<typeof getResultData>>) => ({ val: d.financier.fonds_alur_signature, est: false }) },
                        { label: 'Fonds de roulement à rembourser au vendeur', get: (d: NonNullable<ReturnType<typeof getResultData>>) => ({ val: d.financier.fonds_roulement_signature, est: false }) },
                      ].map((row, ri) => (
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
                                ) : <span style={{ fontSize: 11, fontStyle: 'italic' }}>Non renseigné</span>}
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
                </Accordion>
              )}

              {/* Travaux évoqués non votés — REPLIÉ, nouveau design lignes fines */}
              {resultsData.some(d => d && d.travaux_evoques_list.length > 0) && (
                <Accordion title="Travaux évoqués non votés" icon="⚠️" subtitle="à anticiper dans votre budget">
                  <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                    {selectedAnalyses.map((a, i) => {
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

              {/* Points clés par bien — REPLIÉ (simplifié, redondance avec verdict assumée pour qui veut le détail) */}
              <Accordion title="Points clés extraits de chaque rapport" icon="🔍" subtitle="détail complet par bien">
                <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                  {selectedAnalyses.map((a, i) => {
                    const d = resultsData[i];
                    return (
                      <div key={a.id} style={{ padding: '16px 18px', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>BIEN {i + 1}{a.id === best.id ? ' ⭐' : ''}</div>
                        {d?.points_forts && d.points_forts.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#16a34a', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle size={11} /> POINTS FORTS
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {d.points_forts.map((p, pi) => (
                                <div key={pi} style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                                  <span style={{ color: '#16a34a', flexShrink: 0 }}>▸</span>
                                  <span>{p}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {d?.points_vigilance && d.points_vigilance.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#d97706', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <AlertTriangle size={11} /> VIGILANCES
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {d.points_vigilance.map((p, pi) => (
                                <div key={pi} style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.5, display: 'flex', gap: 6 }}>
                                  <span style={{ color: '#d97706', flexShrink: 0 }}>▸</span>
                                  <span>{p}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!d && <p style={{ fontSize: 12, color: '#94a3b8' }}>Données détaillées non disponibles.</p>}
                      </div>
                    );
                  })}
                </div>
              </Accordion>

              {/* Documents analysés — REPLIÉ */}
              <Accordion
                title="Documents analysés par bien"
                icon="📁"
                subtitle={selectedAnalyses.map((_, i) => {
                  const n = resultsData[i]?.documents_analyses?.length || 0;
                  return `Bien ${i + 1} : ${n} doc${n > 1 ? 's' : ''}`;
                }).join(' • ')}
              >
                <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                  {selectedAnalyses.map((a, i) => {
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

              {/* ══════════════════════════════════════════════════════════════
                  VERDICT VERIMO — placé en fin de page pour la synthèse
                  ══════════════════════════════════════════════════════════════ */}
              {verdictIA && (
                isVerdictV2(verdictIA)
                  ? <VerdictV2Render verdict={verdictIA} adresses={adresses} bestId={best.id} selectedAnalyses={selectedAnalyses} />
                  : <VerdictLegacyRender verdict={verdictIA as VerdictLegacy} />
              )}

            </motion.div>
          </AnimatePresence>
        );
      })()}

      {/* ─── Historique ─── */}
      {!launched && historique.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={15} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Comparaisons précédentes</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f4f7f9', padding: '2px 8px', borderRadius: 6 }}>{historique.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {historique.map((comp) => {
              const ids = comp.analyse_ids.split(',');
              const biens = ids.map(id => {
                const a = completedAnalyses.find(an => an.id === id);
                return a ? { titre: a.adresse_bien || a.nom_document || 'Bien sans titre', score: a.score } : { titre: 'Bien supprimé', score: null };
              });
              const date = new Date(comp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

              return (
                <motion.div key={comp.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>

                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(42,125,156,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <GitCompare size={18} style={{ color: '#2a7d9c' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {biens.map(b => b.titre).join(' vs ')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{date}</span>
                      {biens.map((b, bi) => b.score != null && (
                        <span key={bi} style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: b.score >= 14 ? '#f0fdf4' : b.score >= 10 ? '#fffbeb' : '#fef2f2', color: getScoreColor(b.score), border: `1px solid ${b.score >= 14 ? '#bbf7d0' : b.score >= 10 ? '#fde68a' : '#fecaca'}` }}>
                          {b.score.toFixed(1)}/20
                        </span>
                      ))}
                      {comp.verdict?.titre_verdict && (
                        <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 250 }}>
                          {comp.verdict.titre_verdict}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => viewComparaison(comp)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.15)', color: '#2a7d9c', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      <Eye size={12} /> Voir
                    </button>
                    <button onClick={() => deleteComparaison(comp.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {!launched && !historiqueLoading && historique.length === 0 && completedAnalyses.length >= 2 && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: 13 }}>
          Aucune comparaison précédente — sélectionnez des biens ci-dessus pour commencer.
        </div>
      )}

      <style>{`
        @media (max-width: 640px) { .compare-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
