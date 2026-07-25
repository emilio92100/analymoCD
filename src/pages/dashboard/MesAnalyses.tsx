import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Copy, Mail, Share2, CheckSquare, Square, X, ExternalLink, FileText, ChevronDown, Info } from 'lucide-react';
import { getOrCreateShareToken } from '../../lib/analyses';
import { supabase } from '../../lib/supabase';
import { useAnalyses, titreAnalyse, type Analyse } from '../../hooks/useAnalyses';
import DashboardLoader from '../../components/DashboardLoader';

const C = {
  green: '#16a34a', greenBg: '#f0fdf4', greenBorder: '#bbf7d0',
  amber: '#d97706', amberBg: '#fffbeb', amberBorder: '#fde68a',
  red: '#dc2626', redBg: '#fef2f2', redBorder: '#fecaca',
  teal: '#2a7d9c', navy: '#0f2d3d',
  simple: '#4b7a8f', simpleBg: '#eef4f7', simpleBorder: '#ccdde5',
};

function scoreColor(s: number) { return s >= 14 ? C.green : s >= 10 ? C.amber : C.red; }
function recoStyle(r?: string) {
  if (r === 'Acheter') return { bg: C.greenBg, color: '#166534', border: C.greenBorder };
  if (r === 'Négocier') return { bg: C.amberBg, color: '#92400e', border: C.amberBorder };
  if (r === 'Bien à éviter') return { bg: C.redBg, color: '#991b1b', border: C.redBorder };
  return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
}

/* ═══ ERROR BADGE — "Non généré" + ℹ️ avec popup ═══ */
function ErrorBadge({ message }: { message?: string }) {
  const [open, setOpen] = useState(false);
  const defaultMsg = "Une erreur est survenue lors de la génération. Si votre crédit n'a pas été restitué, contactez le support.";
  const finalMsg = message || defaultMsg;
  return (
    <>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 7, background: C.redBg, color: C.red, border: `1px solid ${C.redBorder}`, whiteSpace: 'nowrap' }}>
        ✕ Non généré
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
          aria-label="Voir le détail de l'erreur"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#fee2e2', color: C.red, border: 'none', cursor: 'pointer', padding: 0 }}>
          <Info size={10} />
        </button>
      </span>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 18, padding: '28px 26px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', position: 'relative' }}>
              <button onClick={() => setOpen(false)}
                style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <X size={16} />
              </button>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: C.redBg, border: `2px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Info size={24} color={C.red} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f2d3d', textAlign: 'center', marginBottom: 10 }}>
                Analyse non générée
              </div>
              <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.55, textAlign: 'center', marginBottom: 18 }}>
                {finalMsg}
              </div>
              <button onClick={() => setOpen(false)}
                style={{ width: '100%', padding: '11px 16px', borderRadius: 10, background: C.teal, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                J'ai compris
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 6) / 2; const circ = 2 * Math.PI * r; const off = circ * (1 - score / 20); const col = scoreColor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8f0f4" strokeWidth={2.5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={2.5} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 50 ? 15 : 12, fontWeight: 800, color: '#0f2d3d', lineHeight: 1 }}>{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

/* ═══ SHARE MODAL ═══ */
function ShareModal({ analyseId, titre, onClose }: { analyseId: string; titre: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = await getOrCreateShareToken(analyseId);
      if (token) setShareUrl(`${window.location.origin}/rapport/partage/${token}`);
      setLoading(false);
    })();
  }, [analyseId]);

  const handleCopy = async () => { if (!shareUrl) return; await navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 4000); };
  const handleEmail = () => {
    if (!shareUrl) return;
    const subject = encodeURIComponent('Rapport Verimo partagé avec vous');
    const body = encodeURIComponent(`Bonjour,\n\nJe vous partage un rapport d'analyse immobilière Verimo pour le bien : ${titre}.\n\nConsultez-le ici :\n${shareUrl}\n\nBonne lecture,`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,45,61,0.45)', padding: 20, backdropFilter: 'blur(3px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 14 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{ background: '#fff', borderRadius: 18, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Partager ce rapport</h3>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} style={{ color: '#94a3b8' }} /></button>
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.5 }}>{titre}</p>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center' }}><div style={{ width: 24, height: 24, borderRadius: '50%', border: '2.5px solid #edf2f7', borderTopColor: '#2a7d9c', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} /></div>
        ) : copied ? (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ padding: 20, borderRadius: 14, background: C.greenBg, border: `1px solid ${C.greenBorder}`, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#166534', margin: '0 0 6px' }}>Lien copié !</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.6 }}>Partagez-le avec votre entourage — aucun compte n'est nécessaire pour consulter le rapport.</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={handleCopy} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12, border: '1.5px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', width: '100%' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; (e.currentTarget as HTMLElement).style.background = '#f0f7fb'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#edf2f7'; (e.currentTarget as HTMLElement).style.background = '#fff'; }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Copy size={18} style={{ color: '#2a7d9c' }} /></div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Copier le lien</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Lien accessible sans compte</div></div>
            </button>
            <button onClick={handleEmail} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 12, border: '1.5px solid #edf2f7', background: '#fff', cursor: 'pointer', textAlign: 'left' as const, transition: 'all 0.15s', width: '100%' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2a7d9c'; (e.currentTarget as HTMLElement).style.background = '#f0f7fb'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = '#edf2f7'; (e.currentTarget as HTMLElement).style.background = '#fff'; }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Mail size={18} style={{ color: '#2a7d9c' }} /></div>
              <div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Envoyer par e-mail</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Ouvre votre messagerie avec le lien</div></div>
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ═══ COMPLETE ROW ═══ */
function CompleteRow({ a, onDelete, isLast, selectionMode, selected, onToggleSelect, onShare }: { a: Analyse; onDelete: (id: string) => void; isLast: boolean; selectionMode: boolean; selected: boolean; onToggleSelect: (id: string) => void; onShare: (id: string, title: string) => void; }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const title = titreAnalyse(a);
  const rs = recoStyle(a.recommandation);
  const docCount = a.document_names?.length || 0;
  // 🆕 Une analyse est "en cours" tant qu'elle traverse les status pré-final (pending/files_ready/processing/queued)
  const isInProgress = a.status === 'pending' || a.status === 'files_ready' || a.status === 'processing' || a.status === 'queued';
  return (
    <>
      <style>{`@media (max-width: 640px) { .cpl-desktop { display: none !important; } .cpl-mobile { display: flex !important; } } @media (min-width: 641px) { .cpl-mobile { display: none !important; } }`}</style>
      <div className="cpl-desktop" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: isLast ? 'none' : '0.5px solid #f0f4f7', background: selected ? '#f0f7fb' : 'transparent', cursor: selectionMode ? 'pointer' : 'default', transition: 'background 0.15s' }}
        onClick={() => { if (selectionMode) onToggleSelect(a.id); }}
        onMouseOver={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.background = '#fafcfd'; }}
        onMouseOut={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.background = selected ? '#f0f7fb' : 'transparent'; }}>
        {selectionMode && <div onClick={e => { e.stopPropagation(); onToggleSelect(a.id); }} style={{ cursor: 'pointer' }}>{selected ? <CheckSquare size={17} color={C.teal} /> : <Square size={17} color="#cbd5e1" />}</div>}
        {isInProgress ? <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid #edf2f7', borderTopColor: C.teal, animation: 'spin 0.9s linear infinite', flexShrink: 0 }} /> : a.score != null ? <ScoreRing score={a.score} size={44} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f2d3d', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {isInProgress ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.teal }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, animation: 'pulse 1.5s ease-in-out infinite' }} />{(a as Analyse & { progress_message?: string }).progress_message || 'Analyse en cours…'}</span> : <>
              {a.recommandation && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 7, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{a.recommandation}</span>}
              {docCount > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>{docCount} doc{docCount > 1 ? 's' : ''}</span>}
              <span style={{ fontSize: 11, color: '#b0bec5' }}>· {a.date}</span>
            </>}
          </div>
        </div>
        {!selectionMode && !isInProgress && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {!a.is_preview && !!a.result && a.status === 'completed' && <button onClick={() => onShare(a.id, title)} style={{ padding: '6px 13px', borderRadius: 7, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}><Share2 size={11} /> Partager</button>}
            {!!a.result ? <Link to={`/dashboard/rapport?id=${a.id}`} style={{ padding: '6px 13px', borderRadius: 7, background: '#2a7d9c', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}><ExternalLink size={11} /> Rapport</Link> : a.status === 'error' ? <ErrorBadge message={a.progress_message} /> : <span style={{ padding: '6px 13px', borderRadius: 7, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>⚠️ Rapport indisponible</span>}
            {!confirmDelete ? <button onClick={() => setConfirmDelete(true)} style={{ width: 28, height: 28, borderRadius: 6, background: C.redBg, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={11} color={C.red} /></button>
            : <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 7, background: C.redBg, border: `1px solid ${C.redBorder}` }}><span style={{ fontSize: 11, fontWeight: 700, color: C.red }}>Supprimer ?</span><button onClick={() => onDelete(a.id)} style={{ padding: '2px 8px', borderRadius: 5, background: C.red, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button><button onClick={() => setConfirmDelete(false)} style={{ padding: '2px 6px', borderRadius: 5, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button></div>}
          </div>
        )}
      </div>
      <div className="cpl-mobile" style={{ display: 'none', flexDirection: 'column', padding: 14, borderBottom: isLast ? 'none' : '0.5px solid #f0f4f7' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          {isInProgress ? <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2.5px solid #edf2f7', borderTopColor: C.teal, animation: 'spin 0.9s linear infinite', flexShrink: 0 }} /> : a.score != null ? <ScoreRing score={a.score} size={40} /> : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2d3d', lineHeight: 1.3, marginBottom: 3 }}>{title}</div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>{a.recommandation && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: rs.bg, color: rs.color }}>{a.recommandation}</span>}<span style={{ fontSize: 11, color: '#94a3b8' }}>{a.date}</span></div>
          </div>
        </div>
        {!isInProgress && <div style={{ display: 'flex', gap: 6 }}>
          {!a.is_preview && !!a.result && a.status === 'completed' && <button onClick={() => onShare(a.id, title)} style={{ padding: '7px 12px', borderRadius: 7, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Share2 size={11} /> Partager</button>}
          {!!a.result ? <Link to={`/dashboard/rapport?id=${a.id}`} style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: '#2a7d9c', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}><ExternalLink size={11} /> Rapport</Link> : a.status === 'error' ? <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}><ErrorBadge message={a.progress_message} /></div> : <span style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>⚠️ Rapport indisponible</span>}
          <button onClick={() => { if (confirmDelete) onDelete(a.id); else setConfirmDelete(true); }} style={{ width: 34, height: 34, borderRadius: 7, background: confirmDelete ? C.red : C.redBg, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={12} color={confirmDelete ? '#fff' : C.red} /></button>
        </div>}
      </div>
    </>
  );
}

/* ═══ SIMPLE ROW ═══ */
function SimpleRow({ a, onDelete, isLast, selectionMode, selected, onToggleSelect, onShare }: { a: Analyse; onDelete: (id: string) => void; isLast: boolean; selectionMode: boolean; selected: boolean; onToggleSelect: (id: string) => void; onShare: (id: string, title: string) => void; }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const title = titreAnalyse(a);
  // 🆕 Idem CompleteRow : on couvre tous les status de progression, pas juste 'processing'
  const isInProgress = a.status === 'pending' || a.status === 'files_ready' || a.status === 'processing' || a.status === 'queued';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: isLast ? 'none' : '0.5px solid #f0f4f7', background: selected ? '#f0f7fb' : 'transparent', cursor: selectionMode ? 'pointer' : 'default', transition: 'background 0.15s' }}
      onClick={() => { if (selectionMode) onToggleSelect(a.id); }}
      onMouseOver={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.background = '#fafcfd'; }}
      onMouseOut={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.background = selected ? '#f0f7fb' : 'transparent'; }}>
      {selectionMode && <div onClick={e => { e.stopPropagation(); onToggleSelect(a.id); }} style={{ cursor: 'pointer' }}>{selected ? <CheckSquare size={17} color={C.teal} /> : <Square size={17} color="#cbd5e1" />}</div>}
      <div style={{ width: 30, height: 30, borderRadius: 7, background: C.simpleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={13} style={{ color: C.simple }} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f2d3d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>1 document · {a.date}</div>
      </div>
      {isInProgress ? <span style={{ fontSize: 11, fontWeight: 700, color: C.teal, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, animation: 'pulse 1.5s ease-in-out infinite' }} /> En cours…</span>
      : <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {!a.is_preview && !!a.result && a.status === 'completed' && <button onClick={() => onShare(a.id, title)} style={{ padding: '5px 11px', borderRadius: 7, background: '#f8fafc', border: '1px solid #edf2f7', color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}><Share2 size={10} /> Partager</button>}
          {!!a.result ? <Link to={`/rapport?id=${a.id}`} style={{ padding: '5px 11px', borderRadius: 7, background: C.simple, color: '#fff', fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}><ExternalLink size={10} /> Rapport</Link> : a.status === 'error' ? <ErrorBadge message={a.progress_message} /> : <span style={{ padding: '5px 11px', borderRadius: 7, background: '#fef3c7', color: '#92400e', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>⚠️ Indisponible</span>}
          {!selectionMode && !confirmDelete && <button onClick={() => setConfirmDelete(true)} style={{ width: 26, height: 26, borderRadius: 6, background: C.redBg, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={10} color={C.red} /></button>}
          {!selectionMode && confirmDelete && <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 6, background: C.redBg, border: `1px solid ${C.redBorder}` }}><button onClick={() => onDelete(a.id)} style={{ padding: '2px 7px', borderRadius: 4, background: C.red, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button><button onClick={() => setConfirmDelete(false)} style={{ padding: '2px 5px', borderRadius: 4, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button></div>}
        </div>}
    </div>
  );
}

/* ═══ PAGE PRINCIPALE ═══ */
export default function MesAnalyses() {
  const { analyses, loading, refetch } = useAnalyses();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [completesOpen, setCompletesOpen] = useState(true);
  const [simplesOpen, setSimplesOpen] = useState(true);
  const [shareModal, setShareModal] = useState<{ id: string; title: string } | null>(null);

  // 🧹 Supprimer une analyse doit AUSSI supprimer ses notifications : sinon la
  // cloche continue d'afficher "Votre analyse est prête" et le clic mène à un
  // rapport effacé (roue qui tourne, aucune sortie).
  const deleteAnalyse = async (id: string) => {
    await supabase.from('analyses').delete().eq('id', id);
    try { await supabase.from('user_notifications').delete().eq('analysis_id', id); } catch { /* non bloquant */ }
    refetch();
  };
  const deleteSelected = async () => { if (selectedIds.size === 0) return; setDeleting(true); const ids = Array.from(selectedIds); await supabase.from('analyses').delete().in('id', ids); try { await supabase.from('user_notifications').delete().in('analysis_id', ids); } catch { /* non bloquant */ } setSelectedIds(new Set()); setSelectionMode(false); setConfirmBulkDelete(false); setDeleting(false); refetch(); };
  const toggleSelect = (id: string) => { setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()); setConfirmBulkDelete(false); };

  useEffect(() => {
    // 🆕 Polling actif tant qu'au moins une analyse est dans un status de progression
    const hasProc = analyses.some(a => a.status === 'pending' || a.status === 'files_ready' || a.status === 'processing' || a.status === 'queued');
    if (hasProc) { pollingRef.current = setInterval(() => refetch(), 4000); }
    else { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [analyses, refetch]);

  const filtered = analyses.filter(a => (a.adresse_bien || a.nom_document || '').toLowerCase().includes(search.toLowerCase()));
  const completes = filtered.filter(a => a.type === 'complete');
  const simples = filtered.filter(a => a.type === 'document');
  const all = [...completes, ...simples];
  const allSelected = all.length > 0 && selectedIds.size === all.length;
  const toggleAll = () => { if (allSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(all.map(a => a.id))); };

  if (loading) return <DashboardLoader message="Chargement de vos analyses…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={20} style={{ color: '#2a7d9c' }} /></div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Mes analyses</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{analyses.length === 0 ? 'Lancez votre première analyse' : `${analyses.length} analyse${analyses.length > 1 ? 's' : ''} · ${completes.length} complète${completes.length > 1 ? 's' : ''} · ${simples.length} simple${simples.length > 1 ? 's' : ''}`}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!selectionMode ? <>
            {all.length > 1 && <button onClick={() => setSelectionMode(true)} style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><CheckSquare size={14} /> Sélectionner</button>}
            <Link to="/dashboard/nouvelle-analyse" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(15,45,61,0.15)' }}><Plus size={14} /> Nouvelle</Link>
          </> : <>
            <button onClick={toggleAll} style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}</button>
            {selectedIds.size > 0 && !confirmBulkDelete && <button onClick={() => setConfirmBulkDelete(true)} style={{ padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Trash2 size={14} /> Supprimer ({selectedIds.size})</button>}
            {confirmBulkDelete && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: C.redBg, border: `1.5px solid ${C.redBorder}` }}><span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>Supprimer {selectedIds.size} analyse{selectedIds.size > 1 ? 's' : ''} ?</span><button onClick={deleteSelected} disabled={deleting} style={{ padding: '4px 12px', borderRadius: 7, background: C.red, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{deleting ? '…' : 'Confirmer'}</button><button onClick={() => setConfirmBulkDelete(false)} style={{ padding: '4px 10px', borderRadius: 7, background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Non</button></div>}
            <button onClick={exitSelectionMode} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
          </>}
        </div>
      </div>

      {/* RECHERCHE */}
      {!selectionMode && <div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une adresse ou un document…" style={{ width: '100%', padding: '10px 14px 10px 37px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' as const, color: '#0f172a' }} /></div>}

      {/* ANALYSES COMPLÈTES */}
      {completes.length > 0 && (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #d0e8f0' }}>
          <button onClick={() => setCompletesOpen(!completesOpen)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#e8f4f8', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Search size={14} style={{ color: '#fff' }} /></div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0c447c' }}>Analyses complètes</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: '#2a7d9c', padding: '2px 8px', borderRadius: 6 }}>{completes.length}</span>
            </div>
            <ChevronDown size={16} style={{ color: '#2a7d9c', transition: 'transform 0.2s', transform: completesOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
          </button>
          <AnimatePresence initial={false}>
            {completesOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden', background: '#fff' }}>
              {completes.map((a, i) => <CompleteRow key={a.id} a={a} onDelete={deleteAnalyse} isLast={i === completes.length - 1} selectionMode={selectionMode} selected={selectedIds.has(a.id)} onToggleSelect={toggleSelect} onShare={(id, title) => setShareModal({ id, title })} />)}
            </motion.div>}
          </AnimatePresence>
        </div>
      )}

      {/* ANALYSES SIMPLES */}
      {simples.length > 0 && (
        <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${C.simpleBorder}` }}>
          <button onClick={() => setSimplesOpen(!simplesOpen)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: C.simpleBg, border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: C.simple, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} style={{ color: '#fff' }} /></div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#2d4a56' }}>Analyses simples</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: C.simple, padding: '2px 8px', borderRadius: 6 }}>{simples.length}</span>
            </div>
            <ChevronDown size={16} style={{ color: C.simple, transition: 'transform 0.2s', transform: simplesOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
          </button>
          <AnimatePresence initial={false}>
            {simplesOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden', background: '#fff' }}>
              {simples.map((a, i) => <SimpleRow key={a.id} a={a} onDelete={deleteAnalyse} isLast={i === simples.length - 1} selectionMode={selectionMode} selected={selectedIds.has(a.id)} onToggleSelect={toggleSelect} onShare={(id, title) => setShareModal({ id, title })} />)}
            </motion.div>}
          </AnimatePresence>
        </div>
      )}

      {/* EMPTY */}
      {all.length === 0 && <div style={{ background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0', padding: '48px 32px', textAlign: 'center' }}><p style={{ fontSize: 14, color: '#94a3b8' }}>{search ? 'Aucune analyse ne correspond à votre recherche.' : 'Vous n\'avez pas encore d\'analyse. Lancez-en une !'}</p>{!search && <Link to="/dashboard/nouvelle-analyse" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}><Plus size={14} /> Nouvelle analyse</Link>}</div>}

      {/* SHARE MODAL */}
      <AnimatePresence>{shareModal && <ShareModal analyseId={shareModal.id} titre={shareModal.title} onClose={() => setShareModal(null)} />}</AnimatePresence>
    </div>
  );
}
