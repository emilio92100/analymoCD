import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitCompare, ShieldCheck, Building2, CheckCircle, ArrowRight, Trash2, Clock, Eye } from 'lucide-react';
import { useAnalyses, type Analyse } from '../../hooks/useAnalyses';
import { supabase } from '../../lib/supabase';

/* ══════════════════════════════════════════
   UTILS — score colors / badges
   ══════════════════════════════════════════ */
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
function getScoreBg(s: number) {
  if (s >= 14) return '#f0fdf4'; if (s >= 10) return '#fffbeb'; if (s >= 7) return '#fff7ed'; return '#fef2f2';
}
function getScoreBorder(s: number) {
  if (s >= 17) return '#bbf7d0'; if (s >= 14) return '#d1fae5'; if (s >= 10) return '#fde68a'; if (s >= 7) return '#fed7aa'; return '#fecaca';
}

/* ══════════════════════════════════════════
   TYPES — verdict sauvegardé (titre_verdict utilisé dans l'historique)
   ══════════════════════════════════════════ */
type ComparaisonSaved = {
  id: string;
  analyse_ids: string;
  verdict: { titre_verdict?: string } & Record<string, unknown>;
  created_at: string;
};

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL — sélection + redirection + historique
   La visualisation du rapport est désormais gérée par /rapport-comparaison
   ══════════════════════════════════════════ */
export default function Compare() {
  const navigate = useNavigate();
  const { analyses } = useAnalyses();
  const completedAnalyses = analyses.filter((a: Analyse) => a.type === 'complete' && a.status === 'completed');
  const [selected, setSelected] = useState<string[]>([]);

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
  };

  const openComparaison = (ids: string[]) => {
    if (ids.length < 2) return;
    navigate(`/rapport-comparaison?ids=${ids.join(',')}`);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const canLaunch = selected.length >= 2;

  const handleLaunch = () => {
    if (!canLaunch) return;
    openComparaison(selected);
  };

  /* ─── États vides ─── */
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
      <div>
        <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 6 }}>Comparer mes biens</h1>
        <p style={{ fontSize: 14, color: '#64748b' }}>
          Sélectionnez 2{maxSelect === 3 ? ' ou 3' : ''} biens à comparer, puis lancez la comparaison
        </p>
      </div>

      {/* Sélection */}
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
                <button onClick={() => openComparaison(selected)}
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

      {/* ─── Historique ─── */}
      {historique.length > 0 && (
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
                    <button onClick={() => openComparaison(ids)}
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

      {!historiqueLoading && historique.length === 0 && completedAnalyses.length >= 2 && (
        <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: 13 }}>
          Aucune comparaison précédente — sélectionnez des biens ci-dessus pour commencer.
        </div>
      )}
    </div>
  );
}
