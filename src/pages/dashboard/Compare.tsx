import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, ShieldCheck, Building2, CheckCircle, FileText, Shield, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAnalyses, type Analyse } from '../../hooks/useAnalyses';

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

function buildVerdict(analyses: Analyse[]) {
  const sorted = [...analyses].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const diff = (best.score ?? 0) - (worst.score ?? 0);
  const raisons: string[] = [];
  const bestScore = best.score ?? 0;
  const worstScore = worst.score ?? 0;
  if (bestScore >= 14) raisons.push('Score solide — bien globalement sain selon les documents analysés');
  if (diff >= 3) raisons.push(`Écart significatif de ${diff.toFixed(1)} points avec le bien le moins bien noté`);
  if (bestScore >= 14 && worstScore < 10) raisons.push("L'autre bien présente des risques financiers ou juridiques identifiés");
  if (raisons.length === 0) raisons.push('Meilleure note globale sur les 5 catégories analysées');
  return { best, raisons };
}

// Données enrichies depuis le résultat JSON de Claude (stocké dans result)
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

  const chargesAnnuelles = parseNum(fin?.charges_annuelles_lot) || (parseNum(chargesFutures?.montant_trimestriel) ? parseNum(chargesFutures?.montant_trimestriel)! * 4 : null) || (parseNum(chargesFutures?.montant_annuel));
  const fondsTravTrimestriel = parseNum(chargesFutures?.fonds_travaux_trimestriel);
  const fondsTravAnnuel = fondsTravTrimestriel ? fondsTravTrimestriel * 4 : null;
  const fondsAlurSignature = parseNum(preEtat?.fonds_travaux_alur) || parseNum(lotAchete?.fonds_travaux_alur);
  const fondsRoulementSignature = parseNum(preEtat?.fonds_roulement_acheteur);

  return {
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

function TendanceIcon({ val, best }: { val: number; best: number }) {
  if (val === best) return <TrendingUp size={13} color="#16a34a" />;
  if (val < best * 0.7) return <TrendingDown size={13} color="#dc2626" />;
  return <Minus size={13} color="#d97706" />;
}

export default function Compare() {
  const { analyses } = useAnalyses();
  const completedAnalyses = analyses.filter((a: Analyse) => a.type === 'complete' && a.status === 'completed');
  const [selected, setSelected] = useState<string[]>([]);
  const [launched, setLaunched] = useState(false);

  const toggleSelect = (id: string) => {
    if (launched) return;
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const selectedAnalyses = completedAnalyses.filter(a => selected.includes(a.id));
  const canLaunch = selected.length >= 2;

  const handleReset = () => { setSelected([]); setLaunched(false); };
  const handleLaunch = () => { if (canLaunch) setLaunched(true); };

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
          {/* Instruction */}
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

          {/* Message sélection partielle */}
          {selected.length === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '11px 16px', borderRadius: 11, background: 'rgba(42,125,156,0.05)', border: '1px solid rgba(42,125,156,0.15)', fontSize: 13, color: '#2a7d9c', fontWeight: 600 }}>
              ✓ 1 bien sélectionné — choisissez {maxSelect === 3 ? 'un 2e ou un 3e bien' : 'un 2e bien'} pour continuer
            </motion.div>
          )}

          {/* Bouton Lancer */}
          {canLaunch && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={handleLaunch}
                style={{ width: '100%', padding: '15px', borderRadius: 13, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 16px rgba(15,45,61,0.2)' }}>
                <GitCompare size={18} />
                Lancer la comparaison — {selected.length} bien{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Résultat comparaison */}
      {launched && selectedAnalyses.length >= 2 && (() => {
        const { best, raisons } = buildVerdict(selectedAnalyses);
        const cols = selectedAnalyses.length;
        const gridCols = cols === 2 ? '1fr 1fr' : '1fr 1fr 1fr';
        const resultsData = selectedAnalyses.map(a => getResultData(a));

        return (
          <AnimatePresence mode="wait">
            <motion.div key="rapport" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Cartes scores */}
              <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12 }}>
                {selectedAnalyses.map((a, i) => {
                  const score = a.score ?? 0;
                  const sc = getScoreColor(score);
                  const isBest = a.id === best.id;
                  const circ = 2 * Math.PI * 22;
                  return (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      style={{ background: '#fff', borderRadius: 18, border: `2px solid ${isBest ? sc : '#edf2f7'}`, padding: '20px', position: 'relative', boxShadow: isBest ? `0 6px 24px ${sc}18` : '0 1px 4px rgba(0,0,0,0.04)' }}>
                      {isBest && <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', padding: '3px 12px', borderRadius: 100, background: sc, color: '#fff', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>⭐ Recommandé</div>}
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 6 }}>BIEN {i + 1}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.4, marginBottom: 16, minHeight: 36 }}>{a.adresse_bien}</div>
                      {a.score != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
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
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${((a.score ?? 0) / 20) * 100}%` }} transition={{ duration: 1.2, delay: i * 0.15 + 0.2 }} style={{ height: '100%', background: sc, borderRadius: 99 }} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Tableau comparatif enrichi */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📊</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Comparaison détaillée</span>
                </div>

                {/* En-têtes biens */}
                <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cols}, 1fr)`, borderBottom: '2px solid #f1f5f9', background: '#fafbfc' }}>
                  <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Critère</div>
                  {selectedAnalyses.map((a, i) => (
                    <div key={i} style={{ padding: '10px 16px', borderLeft: '1px solid #f1f5f9', fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Bien {i + 1} {a.id === best.id ? '⭐' : ''}
                    </div>
                  ))}
                </div>

                {/* Score global */}
                {[
                  {
                    label: 'Score global', render: (a: Analyse) => {
                      const s = a.score ?? 0; const sc = getScoreColor(s);
                      return <span style={{ fontSize: 15, fontWeight: 900, color: sc }}>{s.toFixed(1)}<span style={{ fontSize: 10, opacity: 0.6 }}>/20</span></span>;
                    }
                  },
                  { label: 'Niveau', render: (a: Analyse) => <span style={{ fontSize: 12, color: getScoreColor(a.score ?? 0), fontWeight: 700 }}>{getScoreLabel(a.score ?? 0)}</span> },
                  {
                    label: 'DPE', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; return d ? <DpeCell classe={d.dpe} /> : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
                    }
                  },
                  {
                    label: 'Travaux votés', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
                      const bestVal = Math.min(...resultsData.filter(Boolean).map(r => r!.travaux_votes));
                      return <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TendanceIcon val={d.travaux_votes} best={bestVal} /><span style={{ fontSize: 13, fontWeight: 600, color: d.travaux_votes === 0 ? '#16a34a' : '#d97706' }}>{d.travaux_votes} travaux</span></div>;
                    }
                  },
                  {
                    label: 'Travaux évoqués', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
                      const bestVal = Math.min(...resultsData.filter(Boolean).map(r => r!.travaux_evoques));
                      return <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TendanceIcon val={d.travaux_evoques} best={bestVal} /><span style={{ fontSize: 13, fontWeight: 600, color: d.travaux_evoques === 0 ? '#16a34a' : '#f97316' }}>{d.travaux_evoques} évoqués</span></div>;
                    }
                  },
                  {
                    label: 'Procédures', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
                      return <span style={{ fontSize: 13, fontWeight: 600, color: d.procedures === 0 ? '#16a34a' : '#dc2626' }}>{d.procedures === 0 ? '✓ Aucune' : `⚠ ${d.procedures} détectée${d.procedures > 1 ? 's' : ''}`}</span>;
                    }
                  },
                  {
                    label: 'Fonds travaux', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
                      const s = d.fonds_travaux_statut;
                      return <span style={{ fontSize: 12, fontWeight: 600, color: s === 'conforme' ? '#16a34a' : s === 'insuffisant' ? '#dc2626' : '#94a3b8' }}>
                        {s === 'conforme' ? '✓ Conforme' : s === 'insuffisant' ? '⚠ Insuffisant' : s === 'absent' ? '✗ Absent' : '—'}
                      </span>;
                    }
                  },
                  {
                    label: 'Impayés vendeur', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
                      return <span style={{ fontSize: 12, fontWeight: 600, color: d.impayes ? '#dc2626' : '#16a34a' }}>{d.impayes ? '⚠ Détectés' : '✓ Aucun'}</span>;
                    }
                  },
                  {
                    label: 'Charges/an lot', render: (_a: Analyse, i: number) => {
                      const d = resultsData[i]; if (!d || !d.charges_annuelles) return <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>;
                      const bestVal = Math.min(...resultsData.filter(r => r?.charges_annuelles).map(r => r!.charges_annuelles!));
                      return <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TendanceIcon val={d.charges_annuelles} best={bestVal} /><span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{d.charges_annuelles.toLocaleString('fr-FR')}€</span></div>;
                    }
                  },
                ].map((row, ri) => {
                  // Déterminer le winner pour cette ligne
                  const vals = selectedAnalyses.map((a, j) => row.render(a, j));
                  void vals; // utilisé pour le rendu
                  return (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cols}, 1fr)`, borderBottom: ri < 8 ? '1px solid #f8fafc' : 'none', background: ri % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <div style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center' }}>{row.label}</div>
                    {selectedAnalyses.map((a, j) => (
                      <div key={j} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', borderLeft: '1px solid #f1f5f9', background: a.id === best.id ? 'rgba(42,125,156,0.02)' : 'transparent' }}>
                        {row.render(a, j)}
                      </div>
                    ))}
                  </div>
                  );
                })}
              </div>

              {/* Radar des 5 catégories */}
              {resultsData.some(d => d?.categories) && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📊</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Scores par catégorie</span>
                  </div>
                  <div style={{ padding: '20px' }}>
                    {/* Barres horizontales comparatives */}
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
                </div>
              )}

              {/* Résumé financier année 1 */}
              {resultsData.some(d => d?.financier?.has_data) && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>💶</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Résumé financier — 1ère année</span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${cols}, 1fr)`, minWidth: cols === 3 ? 640 : 400 }}>
                      {/* En-têtes */}
                      <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', background: '#fafbfc' }}>Poste</div>
                      {selectedAnalyses.map((a, i) => (
                        <div key={i} style={{ padding: '10px 16px', borderLeft: '1px solid #f1f5f9', borderBottom: '2px solid #f1f5f9', background: '#fafbfc', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                          Bien {i + 1} {a.id === best.id ? '⭐' : ''}
                        </div>
                      ))}

                      {/* Lignes */}
                      {[
                        { label: 'Charges annuelles', get: (d: NonNullable<ReturnType<typeof getResultData>>) => d.financier.charges_annuelles },
                        { label: 'Cotisation fonds travaux', get: (d: NonNullable<ReturnType<typeof getResultData>>) => d.financier.fonds_travaux_annuel },
                        { label: 'Fonds ALUR (signature)', get: (d: NonNullable<ReturnType<typeof getResultData>>) => d.financier.fonds_alur_signature },
                        { label: 'Fonds roulement (signature)', get: (d: NonNullable<ReturnType<typeof getResultData>>) => d.financier.fonds_roulement_signature },
                      ].map((row, ri) => (
                        <React.Fragment key={ri}>
                          <div style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', fontWeight: 600, borderBottom: '1px solid #f8fafc', background: ri % 2 === 0 ? '#fff' : '#fafbfc' }}>{row.label}</div>
                          {resultsData.map((d, j) => {
                            const val = d ? row.get(d) : null;
                            return (
                              <div key={j} style={{ padding: '10px 16px', borderLeft: '1px solid #f1f5f9', borderBottom: '1px solid #f8fafc', background: ri % 2 === 0 ? '#fff' : '#fafbfc', fontSize: 13, fontWeight: 600, color: val ? '#0f172a' : '#94a3b8' }}>
                                {val ? `${Math.round(val).toLocaleString('fr-FR')}€` : '—'}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}

                      {/* Total année 1 */}
                      <div style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: '#0f172a', borderTop: '2px solid #2a7d9c', background: '#f0f7fb' }}>Total estimé année 1</div>
                      {resultsData.map((d, j) => {
                        const total = d?.financier?.total_annee_1 || 0;
                        const allTotals = resultsData.filter(r => r?.financier?.has_data).map(r => r!.financier.total_annee_1);
                        const isBestFinancier = total > 0 && total === Math.min(...allTotals.filter(t => t > 0));
                        return (
                          <div key={j} style={{ padding: '12px 16px', borderLeft: '1px solid #f1f5f9', borderTop: '2px solid #2a7d9c', background: isBestFinancier ? '#f0fdf4' : '#f0f7fb', fontSize: 15, fontWeight: 900, color: isBestFinancier ? '#16a34a' : '#0f172a' }}>
                            {total > 0 ? `${Math.round(total).toLocaleString('fr-FR')}€` : '—'}
                            {isBestFinancier && <span style={{ fontSize: 10, marginLeft: 6 }}>✓ le moins cher</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ padding: '12px 20px', background: '#fafbfc', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                      * Estimation basée sur les éléments présents dans vos documents. Les travaux évoqués non votés et les éventuels appels de fonds exceptionnels ne sont pas inclus dans ce calcul.
                    </p>
                  </div>
                </div>
              )}

              {/* Travaux évoqués non votés — alertes qualitatives */}
              {resultsData.some(d => d && d.travaux_evoques_list.length > 0) && (
                <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #fde68a', overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #fde68a', background: '#fffbeb', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Travaux évoqués non votés — à anticiper</span>
                  </div>
                  <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                    {selectedAnalyses.map((a, i) => {
                      const d = resultsData[i];
                      return (
                        <div key={a.id} style={{ padding: '14px 18px', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>BIEN {i + 1}</div>
                          {d && d.travaux_evoques_list.length > 0 ? d.travaux_evoques_list.map((t, ti) => (
                            <div key={ti} style={{ fontSize: 12, color: '#92400e', padding: '6px 10px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 4, lineHeight: 1.4 }}>
                              {t.label}{t.montant_estime ? ` — ~${Math.round(t.montant_estime).toLocaleString('fr-FR')}€` : ' — montant non déterminé'}
                            </div>
                          )) : <p style={{ fontSize: 12, color: '#16a34a' }}>✓ Aucun travaux évoqué</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Documents analysés par bien */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📁</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Documents analysés par bien</span>
                </div>
                <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                  {selectedAnalyses.map((a, i) => {
                    const d = resultsData[i];
                    const docs = d?.documents_analyses || [];
                    return (
                      <div key={a.id} style={{ padding: '14px 18px', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>BIEN {i + 1}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: 'rgba(42,125,156,0.08)', padding: '2px 8px', borderRadius: 6 }}>{docs.length} doc{docs.length > 1 ? 's' : ''}</span>
                        </div>
                        {docs.length > 0 ? docs.map((doc, di) => (
                          <div key={di} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: di < docs.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                            <FileText size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                            <span style={{ fontSize: 11.5, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</span>
                            {doc.annee && <span style={{ fontSize: 10, color: '#94a3b8' }}>{doc.annee}</span>}
                          </div>
                        )) : <p style={{ fontSize: 12, color: '#94a3b8' }}>Non disponible</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Points forts / vigilances par bien */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🔍</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Points clés par bien</span>
                </div>
                <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                  {selectedAnalyses.map((a, i) => {
                    const d = resultsData[i];
                    return (
                      <div key={a.id} style={{ padding: '16px 18px', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12 }}>BIEN {i + 1}{a.id === best.id ? ' ⭐' : ''}</div>
                        {d?.points_forts && d.points_forts.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>✓ Points forts</div>
                            {d.points_forts.map((p, pi) => (
                              <div key={pi} style={{ fontSize: 12, color: '#166534', padding: '6px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #d1fae5', marginBottom: 4, lineHeight: 1.4 }}>{p}</div>
                            ))}
                          </div>
                        )}
                        {d?.points_vigilance && d.points_vigilance.length > 0 && (
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>⚠ Vigilances</div>
                            {d.points_vigilance.map((p, pi) => (
                              <div key={pi} style={{ fontSize: 12, color: '#92400e', padding: '6px 10px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 4, lineHeight: 1.4 }}>{p}</div>
                            ))}
                          </div>
                        )}
                        {!d && <p style={{ fontSize: 12, color: '#94a3b8' }}>Données détaillées non disponibles.</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Verdict */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ padding: '22px 24px', borderRadius: 16, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5', boxShadow: '0 4px 16px rgba(42,125,156,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Shield size={16} color="#2a7d9c" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Verdict Verimo</div>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 10, lineHeight: 1.5 }}>
                  Notre recommandation : <span style={{ color: getScoreColor(best.score ?? 0) }}>"{best.adresse_bien}"</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  {raisons.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(42,125,156,0.12)', border: '1px solid rgba(42,125,156,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}><CheckCircle size={10} color="#2a7d9c" /></div>
                      <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{r}</span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.6 }}>Ce verdict est établi uniquement à partir des données disponibles dans vos rapports et ne remplace pas l'avis d'un professionnel de l'immobilier.</p>
              </motion.div>

              {/* Liens rapports */}
              <div style={{ padding: '16px 20px', borderRadius: 14, background: '#fff', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Consulter les rapports individuels</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Pour le détail complet de chaque bien</div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedAnalyses.map((a, i) => (
                    <Link key={a.id} to={`/rapport?id=${a.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#f4f7f9', border: '1px solid #edf2f7', color: '#0f172a', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                      <FileText size={12} /> Bien {i + 1}
                    </Link>
                  ))}
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        );
      })()}

      <style>{`
        @media (max-width: 640px) { .compare-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
