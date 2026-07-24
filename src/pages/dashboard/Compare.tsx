import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GitCompare, ShieldCheck, Building2, CheckCircle, ArrowRight, Trash2, Clock, Eye } from 'lucide-react';
import { useAnalyses, type Analyse } from '../../hooks/useAnalyses';
import { supabase } from '../../lib/supabase';
import DashboardLoader from '../../components/DashboardLoader';

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

const COMPARER_URL = 'https://veszrayromldfgetqaxb.supabase.co/functions/v1/comparer';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk';

/* ══════════════════════════════════════════
   ÉCRAN D'ATTENTE — analyse comparative en cours
   ══════════════════════════════════════════ */
function CompareWaitingScreen({ biens, fromCache }: { biens: string[]; fromCache: boolean }) {
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
        style={{ padding: '48px 32px', borderRadius: 20, background: 'linear-gradient(135deg, #f0f7fb, #e8f4fa)', border: '1.5px solid #bae3f5', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, minHeight: 280, justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ width: 44, height: 44, borderRadius: '50%', border: '4px solid #2a7d9c', borderTopColor: 'transparent' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Patientez…</p>
          <p style={{ fontSize: 13, color: '#64748b' }}>Nous ouvrons votre comparaison.</p>
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

      {/* Rappel des biens comparés */}
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

      {/* Progression */}
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
   TYPES — verdict sauvegardé (titre_verdict utilisé dans l'historique)
   ══════════════════════════════════════════ */
type ComparaisonSaved = {
  id: string;
  analyse_ids: string;
  verdict: { titre_verdict?: string } & Record<string, unknown>;
  created_at: string;
};

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL
   - Sélection des biens dans le dashboard
   - Écran d'attente in-dashboard pendant la génération du verdict
   - Au retour depuis l'historique : redirection directe vers /rapport-comparaison
   - Navigation vers /rapport-comparaison une fois le verdict prêt
   ══════════════════════════════════════════ */
export default function Compare() {
  const navigate = useNavigate();
  const { analyses, loading: analysesLoading } = useAnalyses();
  const completedAnalyses = analyses.filter((a: Analyse) => a.type === 'complete' && a.status === 'completed');
  const [selected, setSelected] = useState<string[]>([]);

  // Noms des dossiers pour les analyses pro
  const [folderNames, setFolderNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (analysesLoading) return;
    const folderIds = [...new Set(completedAnalyses.map(a => a.folder_id).filter(Boolean))] as string[];
    if (folderIds.length === 0) return;
    supabase.from('pro_folders').select('id, name').in('id', folderIds).then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((f: { id: string; name: string }) => { map[f.id] = f.name; });
        setFolderNames(map);
      }
    });
  }, [analysesLoading, completedAnalyses.length]);

  // Génération du verdict
  const [launched, setLaunched] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Historique
  const [historique, setHistorique] = useState<ComparaisonSaved[]>([]);
  const [historiqueLoading, setHistoriqueLoading] = useState(true);

  const loadHistorique = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('comparaisons')
        .select('id, analyse_ids, verdict, created_at')
        .not('verdict', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) setHistorique(data as ComparaisonSaved[]);
    } catch { /* ignore */ }
    setHistoriqueLoading(false);
  }, []);

  useEffect(() => { loadHistorique(); }, [loadHistorique]);

  // ─── Comparaisons EN COURS ou EN ÉCHEC (source de vérité : la base) ───────
  // La edge function "comparer" crée une ligne 'processing' au lancement puis la
  // passe à 'completed' ou 'failed'. Au retour sur l'onglet (ou depuis un autre
  // appareil), on lit ces lignes : spinner + polling pour 'processing', et
  // bouton "Relancer" pour 'failed'. Au-delà de 2 min de processing, le front
  // bascule lui-même la ligne en 'failed' (le watchdog serveur est le filet
  // de sécurité si l'onglet est fermé).
  const [processingCompares, setProcessingCompares] = useState<{ id: string; analyse_ids: string; status: string; updated_at: string }[]>([]);

  const loadProcessing = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('comparaisons')
      .select('id, analyse_ids, status, updated_at')
      .eq('user_id', user.id)
      .in('status', ['processing', 'failed']);
    setProcessingCompares(data || []);
  }, []);

  useEffect(() => { loadProcessing(); }, [loadProcessing]);

  // Polling toutes les 4s tant qu'au moins une comparaison est réellement en cours
  const nbProcessing = processingCompares.filter(pc => pc.status === 'processing').length;
  useEffect(() => {
    if (nbProcessing === 0) return;
    const poll = setInterval(async () => {
      await loadProcessing();
      await loadHistorique();
    }, 4000);
    return () => clearInterval(poll);
  }, [nbProcessing, loadProcessing, loadHistorique]);

  // ─── TIMEOUT 2 MIN : si une ligne est en 'processing' depuis plus de
  // 2 minutes, le front la bascule en 'failed' en base (le backend a
  // probablement crashé/timeout) → le bouton "Relancer" apparaît.
  useEffect(() => {
    const stuck = processingCompares.filter(pc =>
      pc.status === 'processing' &&
      pc.updated_at &&
      Date.now() - new Date(pc.updated_at).getTime() > 120000
    );
    if (stuck.length === 0) return;
    (async () => {
      for (const pc of stuck) {
        await supabase.from('comparaisons')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', pc.id)
          .eq('status', 'processing'); // idempotent : ne touche pas si la fonction a fini entre-temps
      }
      loadProcessing();
    })();
  }, [processingCompares, loadProcessing]);

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
    if (launched) return;
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 3 ? [...prev, id] : prev);
  };

  const selectedAnalyses = completedAnalyses.filter(a => selected.includes(a.id));
  const canLaunch = selected.length >= 2;

  // ─── LANCEMENT / RELANCE ──────────────────────────────────────────────────
  // Ordre canonique : les IDs sont TOUJOURS triés avant l'appel (le backend
  // trie aussi de son côté). Utilisé par le bouton "Lancer" ET par "Relancer".
  const launchCompare = async (ids: string[]) => {
    const idsTries = [...ids].sort();
    setLaunched(true);
    setLaunchError(null);
    // Rafraîchit l'affichage "en cours" (la ligne processing est créée côté serveur)
    setTimeout(loadProcessing, 1200);

    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) { setLaunchError('Session expirée, reconnectez-vous.'); setLaunched(false); return; }

      const res = await fetch(COMPARER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ analyseIds: idsTries }),
      });

      // 409 = cette comparaison est DÉJÀ en cours (anti-doublon serveur).
      // Ce n'est pas une erreur : on affiche l'attente, le polling fera le reste.
      if (res.status === 409) {
        setLaunched(false);
        loadProcessing();
        return;
      }

      if (!res.ok) {
        setLaunchError('La génération du verdict a échoué. Réessayez dans un instant.');
        setLaunched(false);
        loadProcessing();
        return;
      }

      const data = await res.json();
      if (data.success && data.verdict) {
        loadProcessing();
        // Rafraîchir l'historique en arrière-plan puis rediriger vers le rapport
        loadHistorique();
        // Redirection vers la page rapport plein écran (IDs triés = ordre canonique)
        navigate(`/rapport-comparaison?ids=${idsTries.join(',')}`);
      } else {
        setLaunchError('Réponse inattendue du serveur. Réessayez.');
        setLaunched(false);
      }
    } catch (e) {
      console.error('[Compare] launchCompare error', e);
      setLaunchError('Erreur réseau. Vérifiez votre connexion et réessayez.');
      setLaunched(false);
    }
  };

  const handleLaunch = () => {
    if (!canLaunch) return;
    launchCompare(selected);
  };

  // Relance depuis une ligne en échec : reprend automatiquement les 2 ou 3
  // biens de la ligne (analyse_ids est déjà la clé triée).
  const [relaunchingIds, setRelaunchingIds] = useState<string | null>(null);
  const relancerComparaison = async (analyseIdsStr: string) => {
    setRelaunchingIds(analyseIdsStr);
    await launchCompare(analyseIdsStr.split(','));
    setRelaunchingIds(null);
  };

  const supprimerLigneEchec = async (id: string) => {
    await supabase.from('comparaisons').delete().eq('id', id);
    loadProcessing();
  };

  /* ─── Loader initial pendant le chargement des analyses ─── */
  if (analysesLoading) return <DashboardLoader message="Chargement de vos biens analysés…" />;

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
      {/* Historique même quand 0 analyse — pour accéder aux anciennes comparaisons */}
      {historique.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={15} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Comparaisons précédentes</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f4f7f9', padding: '2px 8px', borderRadius: 6 }}>{historique.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {historique.map((comp) => {
              const ids = comp.analyse_ids.split(',');
              const biens = ids.map(id => {
                const a = analyses.find(an => an.id === id);
                return a ? { titre: a.adresse_bien || a.nom_document || 'Bien sans titre', score: a.score } : { titre: 'Bien supprimé', score: null };
              });
              const date = new Date(comp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <motion.div key={comp.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(42,125,156,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><GitCompare size={18} style={{ color: '#2a7d9c' }} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{biens.map(b => b.titre).join(' vs ')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{date}</span>
                      {comp.verdict?.titre_verdict && <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{comp.verdict.titre_verdict}</span>}
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
      {/* Historique même quand 1 seule analyse — pour consulter les anciennes comparaisons */}
      {historique.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={15} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Comparaisons précédentes</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f4f7f9', padding: '2px 8px', borderRadius: 6 }}>{historique.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {historique.map((comp) => {
              const ids = comp.analyse_ids.split(',');
              const biens = ids.map(id => {
                const a = analyses.find(an => an.id === id);
                return a ? { titre: a.adresse_bien || a.nom_document || 'Bien sans titre', score: a.score } : { titre: 'Bien supprimé', score: null };
              });
              const date = new Date(comp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
              return (
                <motion.div key={comp.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(42,125,156,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><GitCompare size={18} style={{ color: '#2a7d9c' }} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{biens.map(b => b.titre).join(' vs ')}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{date}</span>
                      {comp.verdict?.titre_verdict && <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{comp.verdict.titre_verdict}</span>}
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
    </div>
  );

  const maxSelect = completedAnalyses.length >= 3 ? 3 : 2;

  /* ─── Pendant la génération : on masque la sélection, on affiche l'écran d'attente in-dashboard ─── */
  if (launched) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 6 }}>Comparer mes biens</h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            Comparaison de {selectedAnalyses.length} biens
          </p>
        </div>
        <CompareWaitingScreen
          biens={selectedAnalyses.map(a => a.adresse_bien || a.nom_document || 'Bien sans titre')}
          fromCache={false}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ═══ COMPARAISON(S) EN COURS OU EN ÉCHEC — tout en haut de la page ═══ */}
      {processingCompares.map((pc) => {
        const biensLigne = pc.analyse_ids.split(',').map(id => {
          const a = completedAnalyses.find(an => an.id === id);
          return a ? (a.adresse_bien || a.nom_document || 'Bien sans titre').split(',')[0] : 'Bien supprimé';
        });
        const bienSupprime = biensLigne.includes('Bien supprimé');

        if (pc.status === 'failed') {
          return (
            <motion.div key={pc.analyse_ids} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #fecaca', overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: '#991b1b', marginBottom: 2 }}>
                    Comparaison non aboutie
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {biensLigne.join(' vs ')} — un incident technique a interrompu la génération.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!bienSupprime && (
                    <button onClick={() => relancerComparaison(pc.analyse_ids)} disabled={relaunchingIds === pc.analyse_ids || launched}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: relaunchingIds === pc.analyse_ids ? 'default' : 'pointer', opacity: relaunchingIds === pc.analyse_ids ? 0.7 : 1, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      {relaunchingIds === pc.analyse_ids ? (
                        <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'vr-compare-spin 0.8s linear infinite' }} /> Relance…</>
                      ) : (
                        <><GitCompare size={14} /> Relancer</>
                      )}
                    </button>
                  )}
                  <button onClick={() => supprimerLigneEchec(pc.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 10, background: '#fff', border: '1px solid #fecaca', color: '#dc2626', cursor: 'pointer' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <style>{`@keyframes vr-compare-spin { to { transform: rotate(360deg); } }`}</style>
            </motion.div>
          );
        }

        return (
          <motion.div key={pc.analyse_ids} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #bae3f5', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, flexShrink: 0 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', border: '3px solid #e6f1fb', borderTopColor: '#2a7d9c', animation: 'vr-compare-spin 0.8s linear infinite' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f2d3d', marginBottom: 2 }}>
                  Comparaison en cours…
                </div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                  Votre verdict comparatif se génère en arrière-plan. Il apparaîtra ici automatiquement, sans rien faire de votre part.
                </div>
              </div>
            </div>
            <style>{`@keyframes vr-compare-spin { to { transform: rotate(360deg); } }`}</style>
          </motion.div>
        );
      })}

      {/* ═══ BARRE FLOTTANTE — via portail sur body (insensible aux overflow parents) ═══ */}
      {canLaunch && !processingCompares.some(pc => pc.status === 'processing' && pc.analyse_ids === [...selected].sort().join(',')) && createPortal(
        (() => {
          const sortedSel = [...selected].sort().join(',');
          const existing = historique.find(c => c.analyse_ids === sortedSel);
          return (
            <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 2147483000, width: 'calc(100% - 32px)', maxWidth: 560, pointerEvents: 'none' }}>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px 12px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', boxShadow: '0 12px 32px rgba(15,45,61,0.35)', pointerEvents: 'auto' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selected.length} bien{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
                    {existing ? 'Comparaison déjà disponible' : 'Prêt à comparer'}
                  </div>
                </div>
                <button onClick={() => existing ? openComparaison(selected) : handleLaunch()} disabled={launched}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 11, background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 800, border: 'none', cursor: launched ? 'default' : 'pointer', flexShrink: 0, opacity: launched ? 0.7 : 1 }}>
                  {existing ? <><Eye size={16} /> Voir le rapport</> : <><GitCompare size={16} /> Lancer la comparaison <ArrowRight size={15} /></>}
                </button>
              </motion.div>
            </div>
          );
        })(),
        document.body
      )}

      {launchError && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#991b1b' }}>
          ⚠ {launchError}
        </div>
      )}

      {/* ═══ BLOC SÉLECTION ═══ */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <GitCompare size={18} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Sélectionnez vos biens</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Choisissez 2 ou 3 biens pour lancer une comparaison</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: maxSelect }).map((_, i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: i < selected.length ? '#5dbfe0' : 'transparent', border: i < selected.length ? '2px solid #5dbfe0' : '2px solid rgba(255,255,255,0.25)', transition: 'all 0.2s' }} />
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{selected.length}/{maxSelect}</span>
          </div>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {completedAnalyses.map((a, idx) => {
          const isSel = selected.includes(a.id);
          const score = a.score ?? 0;
          const sc = getScoreColor(score);
          const reco = (a as Analyse & { recommandation?: string }).recommandation;
          return (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              onClick={() => toggleSelect(a.id)}
              style={{ borderRadius: 16, overflow: 'hidden', cursor: launched ? 'default' : 'pointer', display: 'flex', alignItems: 'stretch', border: isSel ? '2px solid #2a7d9c' : '1.5px solid #edf2f7', transition: 'all 0.18s', boxShadow: isSel ? '0 0 0 3px rgba(42,125,156,0.08)' : '0 1px 4px rgba(0,0,0,0.03)' }}>
              {/* Score band */}
              <div style={{ width: 76, background: isSel ? 'linear-gradient(180deg, #0e3a4a, #174558)' : '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '14px 0', flexShrink: 0, borderRight: isSel ? 'none' : '1px solid #edf2f7', position: 'relative', transition: 'all 0.2s' }}>
                {isSel && (
                  <div style={{ position: 'absolute', top: 6, left: 6, width: 18, height: 18, borderRadius: 5, background: 'rgba(93,191,224,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={11} color="#5dbfe0" />
                  </div>
                )}
                <span style={{ fontSize: 24, fontWeight: 900, color: isSel ? '#fff' : sc, lineHeight: 1 }}>{score.toFixed(1)}</span>
                <span style={{ fontSize: 10, color: isSel ? 'rgba(255,255,255,0.3)' : '#94a3b8', marginTop: 2 }}>/20</span>
                <div style={{ width: 20, height: 1, background: isSel ? 'rgba(255,255,255,0.08)' : '#edf2f7', margin: '8px 0 4px' }} />
                <span style={{ fontSize: 8, color: isSel ? 'rgba(255,255,255,0.35)' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Bien {idx + 1}</span>
              </div>
              {/* Contenu */}
              <div style={{ flex: 1, padding: '14px 16px', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="compare-addr" style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.adresse_bien || 'Adresse en cours…'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: a.folder_id ? 4 : 0 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{a.date}</span>
                  {reco && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 5, background: reco === 'Acheter' ? '#f0fdf4' : reco === 'Négocier' ? '#fffbeb' : '#fef2f2', color: reco === 'Acheter' ? '#166534' : reco === 'Négocier' ? '#92400e' : '#991b1b', fontWeight: 700 }}>{reco}</span>}
                </div>
                {a.folder_id && folderNames[a.folder_id] && (
                  <div style={{ fontSize: 11, color: '#2a7d9c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, opacity: 0.6 }}>📁</span> Dossier {folderNames[a.folder_id]}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        </div>

        {/* Info sélection */}
        {selected.length === 1 && (
          <div style={{ padding: '0 16px 16px' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(42,125,156,0.04)', border: '1px solid rgba(42,125,156,0.12)', fontSize: 12, color: '#2a7d9c', fontWeight: 600 }}>
              ✓ 1 bien sélectionné — cliquez sur un {maxSelect === 3 ? '2e ou 3e bien' : '2e bien'} pour continuer
            </motion.div>
          </div>
        )}

        {/* Comparaison existante ou bouton lancer */}
        {canLaunch && (() => {
          const sortedSelected = [...selected].sort().join(',');
          // Si ces biens sont déjà en cours de comparaison, on affiche le spinner
          // plutôt que le bouton "Lancer" (évite un double lancement).
          if (processingCompares.some(pc => pc.status === 'processing' && pc.analyse_ids === sortedSelected)) {
            return (
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ padding: '16px 18px', borderRadius: 14, background: '#f0f7fb', border: '1.5px solid #bae3f5', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid #e6f1fb', borderTopColor: '#2a7d9c', animation: 'vr-compare-spin 0.8s linear infinite', flexShrink: 0 }} />
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f2d3d' }}>Comparaison de ces biens en cours…</div>
                </div>
                <style>{`@keyframes vr-compare-spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            );
          }
          const existingComp = historique.find(c => c.analyse_ids === sortedSelected);
          if (existingComp) {
            const dateExist = new Date(existingComp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
            return (
              <div style={{ padding: '0 16px 16px' }}>
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
              </div>
            );
          }
          return (
            <div style={{ padding: '0 16px 16px' }}>
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={handleLaunch}
                  style={{ width: '100%', padding: '15px', borderRadius: 13, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 16px rgba(15,45,61,0.2)' }}>
                  <GitCompare size={18} />
                  Lancer la comparaison — {selected.length} bien{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
                  <ArrowRight size={16} />
                </button>
              </motion.div>
            </div>
          );
        })()}
      </div>

      {/* ═══ HISTORIQUE — Bloc séparé ═══ */}
      {historique.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', background: '#f0f7fb', borderBottom: '1px solid #d0e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={15} style={{ color: '#2a7d9c' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d' }}>Comparaisons précédentes</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: '#fff', border: '1px solid #d0e8f0', padding: '2px 10px', borderRadius: 20 }}>{historique.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {historique.map((comp) => {
              const ids = comp.analyse_ids.split(',');
              const biens = ids.map(id => {
                const a = completedAnalyses.find(an => an.id === id);
                return a ? { titre: a.adresse_bien || a.nom_document || 'Bien sans titre', score: a.score } : { titre: 'Bien supprimé', score: null };
              });
              const date = new Date(comp.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
              const titresCourts = biens.map(b => {
                const t = b.titre;
                const parts = t.split(',');
                if (parts[0].length > 30) return parts[0].substring(0, 28) + '…';
                return parts[0];
              });

              return (
                <motion.div key={comp.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: biens.some(b => b.titre === 'Bien supprimé') ? 0.55 : 1 }}>

                  {/* Cercles scores chevauchants */}
                  <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {biens.map((b, bi) => (
                      <div key={bi} style={{ width: 36, height: 36, borderRadius: '50%', border: b.score != null ? `2px solid ${getScoreColor(b.score)}` : '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: bi > 0 ? -6 : 0, background: '#fff', zIndex: biens.length - bi }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: b.score != null ? getScoreColor(b.score) : '#94a3b8' }}>{b.score != null ? b.score.toFixed(1) : '?'}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {titresCourts.join(' vs ')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{date}</span>
                      {comp.verdict?.titre_verdict && (
                        <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                          {comp.verdict.titre_verdict}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <button onClick={() => openComparaison(ids)}
                      style={{ padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg, #0e3a4a, #1a5068)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      Consulter
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
