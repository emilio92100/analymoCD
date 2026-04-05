import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompare, ShieldCheck, Building2, CheckCircle, FileText, Shield } from 'lucide-react';
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
  if (bestScore >= 14) raisons.push('score solide (bien sain ou irréprochable)');
  if (diff >= 3) raisons.push(`écart significatif de ${diff.toFixed(1)} points avec le bien le moins bien noté`);
  if (bestScore >= 14 && worstScore < 10) raisons.push("l'autre bien présente des risques financiers ou juridiques identifiés");
  if (raisons.length === 0) raisons.push('meilleure note globale sur les 5 catégories analysées');
  return { best, raisons };
}

export default function Compare() {
  const { analyses } = useAnalyses();
  const completedAnalyses = analyses.filter((a: Analyse) => a.type === 'complete' && a.status === 'completed');
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const selectedAnalyses = completedAnalyses.filter(a => selected.includes(a.id));
  const canCompare = selected.length >= 2;

  if (completedAnalyses.length === 0) return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 24 }}>Comparer mes biens</h1>
      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #edf2f7', padding: '52px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(42,125,156,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><GitCompare size={30} style={{ color: '#94a3b8' }} /></div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Il vous faut au minimum 2 analyses complètes</h2>
        <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>La comparaison de biens s'active automatiquement dès que votre compte contient <strong style={{ color: '#0f172a' }}>2 analyses complètes ou plus</strong>.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320, margin: '0 auto' }}>
          <Link to="/dashboard/nouvelle-analyse?type=complete" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(15,45,61,0.2)' }}>
            <ShieldCheck size={16} /> Lancer une analyse complète
          </Link>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 24px', borderRadius: 12, background: '#f4f7f9', border: '1.5px solid #edf2f7', color: '#64748b', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Voir les packs (Pack 2 et 3 biens)
          </Link>
        </div>
      </div>
    </div>
  );

  if (completedAnalyses.length === 1) return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 24 }}>Comparer mes biens</h1>
      <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #edf2f7', padding: '40px 32px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>🏠 + ?</div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>Plus qu'une analyse pour comparer</h2>
        <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75, marginBottom: 8, maxWidth: 380, margin: '0 auto 8px' }}>Vous avez 1 analyse complète. La comparaison se débloque automatiquement dès que vous en avez <strong style={{ color: '#0f172a' }}>une deuxième</strong>.</p>
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 4 }}>Comparer mes biens</h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>
            {canCompare ? `${selectedAnalyses.length} bien${selectedAnalyses.length > 1 ? 's' : ''} sélectionné${selectedAnalyses.length > 1 ? 's' : ''} — rapport de comparaison ci-dessous` : `Sélectionnez 2${maxSelect === 3 ? ' ou 3' : ''} biens à comparer`}
          </p>
        </div>
        {canCompare && (
          <button onClick={() => setSelected([])} style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', background: '#f4f7f9', border: '1px solid #edf2f7', borderRadius: 9, padding: '7px 14px', cursor: 'pointer' }}>← Changer la sélection</button>
        )}
      </div>

      {!canCompare && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            {completedAnalyses.length} analyse{completedAnalyses.length > 1 ? 's' : ''} disponible{completedAnalyses.length > 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completedAnalyses.map((a, idx) => {
              const isSel = selected.includes(a.id);
              const selIdx = selected.indexOf(a.id);
              const score = a.score ?? 0;
              const sc = getScoreColor(score);
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  onClick={() => toggleSelect(a.id)}
                  style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${isSel ? '#2a7d9c' : '#edf2f7'}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.18s', boxShadow: isSel ? '0 0 0 3px rgba(42,125,156,0.1)' : '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSel ? '#2a7d9c' : '#f4f7f9', border: `1px solid ${isSel ? '#2a7d9c' : '#edf2f7'}`, transition: 'all 0.18s' }}>
                    {isSel ? <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{selIdx + 1}</span> : <Building2 size={15} style={{ color: '#94a3b8' }} />}
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
          </div>
          {selected.length === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 12, padding: '11px 16px', borderRadius: 11, background: 'rgba(42,125,156,0.05)', border: '1px solid rgba(42,125,156,0.15)', fontSize: 13, color: '#2a7d9c', fontWeight: 600 }}>
              ✓ 1 bien sélectionné — choisissez {maxSelect === 3 ? 'un 2e ou un 3e bien' : 'un 2e bien'} pour comparer
            </motion.div>
          )}
        </div>
      )}

      {canCompare && selectedAnalyses.length >= 2 && (() => {
        const { best, raisons } = buildVerdict(selectedAnalyses);
        const cols = selectedAnalyses.length;
        const gridCols = cols === 2 ? '1fr 1fr' : '1fr 1fr 1fr';
        return (
          <AnimatePresence mode="wait">
            <motion.div key="rapport" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

              {/* Tableau comparatif */}
              {[{ label: 'Score par catégorie', icon: '📊', rows: [{ label: 'Travaux', key: 'travaux', max: 5 }, { label: 'Procédures', key: 'procedures', max: 4 }, { label: 'Finances copropriété', key: 'finances', max: 4 }, { label: 'Diagnostics privatifs', key: 'diags_privatifs', max: 4 }, { label: 'Diagnostics communs', key: 'diags_communs', max: 3 }] }].map((section) => (
                <div key={section.label} style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>{section.icon}</span><span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{section.label}</span></div>
                  {section.rows.map((row, ri) => (
                    <div key={ri} style={{ display: 'grid', gridTemplateColumns: `200px repeat(${cols}, 1fr)`, borderBottom: ri < section.rows.length - 1 ? '1px solid #f8fafc' : 'none', background: ri % 2 === 0 ? '#fff' : '#fafbfc' }}>
                      <div style={{ padding: '12px 20px', fontSize: 13, color: '#374151', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{row.label}</div>
                      {selectedAnalyses.map((a, j) => {
                        const catScore = Math.round(((a.score ?? 10) / 20) * row.max * 10) / 10;
                        const catColor = catScore >= row.max * 0.8 ? '#16a34a' : catScore >= row.max * 0.5 ? '#d97706' : '#dc2626';
                        return (
                          <div key={j} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #f1f5f9', background: a.id === best.id ? 'rgba(42,125,156,0.03)' : 'transparent' }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 15, fontWeight: 900, color: catColor }}>{catScore}</div>
                              <div style={{ fontSize: 10, color: '#cbd5e1' }}>/{row.max}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}

              {/* Points clés */}
              <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>🔍</span><span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Points clés par bien</span></div>
                <div className="compare-grid" style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 0 }}>
                  {selectedAnalyses.map((a, i) => (
                    <div key={a.id} style={{ padding: '16px 18px', borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 10 }}>BIEN {i + 1}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ Points forts</div>
                        {[a.score != null && a.score >= 14 ? 'Score solide — bien globalement sain' : null, a.recommandation ? `${a.recommandation}` : null, 'Voir le rapport complet pour le détail'].filter(Boolean).map((p, pi) => (
                          <div key={pi} style={{ fontSize: 12, color: '#374151', padding: '6px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #d1fae5' }}>{p}</div>
                        ))}
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#f0a500', marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>⚠ Vigilances</div>
                        {[a.score != null && a.score < 14 ? 'Score inférieur à 14/20 — points à vérifier' : null, a.score != null && a.score < 10 ? 'Risques identifiés — rapport complet conseillé' : null, 'Consultez le rapport pour le détail complet'].filter(Boolean).map((p, pi) => (
                          <div key={pi} style={{ fontSize: 12, color: '#374151', padding: '6px 10px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fde68a' }}>{p}</div>
                        ))}
                      </div>
                    </div>
                  ))}
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
                      <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, textTransform: 'capitalize' }}>{r}</span>
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
    </div>
  );
}
