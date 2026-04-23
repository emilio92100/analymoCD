import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Copy, Check, Mail, Share2, CheckSquare, Square, X, ExternalLink, FileText, Eye } from 'lucide-react';
import { getOrCreateShareToken } from '../../lib/analyses';
import { supabase } from '../../lib/supabase';
import { useAnalyses, type Analyse } from '../../hooks/useAnalyses';
import DashboardLoader from '../../components/DashboardLoader';

/* ═══════════════════════════════════════════
   COULEURS
═══════════════════════════════════════════ */
const C = {
  green: '#16a34a', greenBg: '#f0fdf4', greenBorder: '#bbf7d0',
  amber: '#d97706', amberBg: '#fffbeb', amberBorder: '#fde68a',
  red: '#dc2626', redBg: '#fef2f2', redBorder: '#fecaca',
  purple: '#7c3aed', purpleBg: '#f5f3ff',
  teal: '#2a7d9c', navy: '#0f2d3d',
};

function scoreColor(s: number) { return s >= 14 ? C.green : s >= 10 ? C.amber : C.red; }

function recoStyle(r?: string) {
  if (r === 'Acheter') return { bg: C.greenBg, color: '#166534', border: C.greenBorder };
  if (r === 'Négocier') return { bg: C.amberBg, color: '#92400e', border: C.amberBorder };
  if (r === 'Bien à éviter') return { bg: C.redBg, color: '#991b1b', border: C.redBorder };
  return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
}

/* ═══════════════════════════════════════════
   SCORE RING
═══════════════════════════════════════════ */
function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - score / 20);
  const col = scoreColor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8f0f4" strokeWidth={2.5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={2.5}
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 50 ? 15 : 12, fontWeight: 800, color: '#0f2d3d', lineHeight: 1 }}>{score.toFixed(1)}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SHARE BADGE
═══════════════════════════════════════════ */
function ShareBadge({ analyseId, titre }: { analyseId: string; titre: string }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
    if (showMenu) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMenu]);

  const getUrl = async (): Promise<string | null> => {
    setLoading(true);
    const token = await getOrCreateShareToken(analyseId);
    setLoading(false);
    if (!token) return null;
    return `${window.location.origin}/rapport/partage/${token}`;
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = await getUrl(); if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true); setShowMenu(false);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmail = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = await getUrl(); if (!url) return;
    setShowMenu(false);
    const subject = encodeURIComponent('Rapport Verimo partagé avec vous');
    const body = encodeURIComponent(`Bonjour,\n\nJe vous partage un rapport d'analyse immobilière Verimo pour le bien : ${titre}.\n\nConsultez-le ici :\n${url}\n\nBonne lecture,`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div style={{ position: 'relative', isolation: 'isolate' }} ref={menuRef}>
      <button onClick={e => { e.preventDefault(); e.stopPropagation(); setShowMenu(v => !v); }} disabled={loading}
        style={{ padding: '5px 11px', borderRadius: 7, background: copied ? C.greenBg : '#f8fafc', border: `1px solid ${copied ? C.greenBorder : '#edf2f7'}`, fontSize: 11, fontWeight: 700, color: copied ? C.green : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
        {copied ? <Check size={11} /> : <Share2 size={11} />}{copied ? 'Copié !' : loading ? '…' : 'Partager'}
      </button>
      {showMenu && (
        <div style={{ position: 'fixed', zIndex: 9999, background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.15)', overflow: 'hidden', minWidth: 200 }}
          ref={el => { if (el && menuRef.current) { const btn = menuRef.current.querySelector('button'); if (btn) { const rect = btn.getBoundingClientRect(); el.style.top = `${rect.bottom + 6}px`; el.style.right = `${window.innerWidth - rect.right}px`; } } }}>
          <button onClick={handleCopy} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0f172a', textAlign: 'left' as const }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'} onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <Copy size={12} style={{ color: '#64748b' }} /><div><div style={{ fontWeight: 700 }}>Copier le lien</div><div style={{ fontSize: 10, color: '#94a3b8' }}>Accessible sans compte</div></div>
          </button>
          <div style={{ height: 1, background: '#f1f5f9' }} />
          <button onClick={handleEmail} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0f172a', textAlign: 'left' as const }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'} onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <Mail size={12} style={{ color: '#64748b' }} /><div><div style={{ fontWeight: 700 }}>Envoyer par e-mail</div><div style={{ fontSize: 10, color: '#94a3b8' }}>Ouvre votre messagerie</div></div>
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTION HEADER
═══════════════════════════════════════════ */
function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 8 }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   LIGNE ANALYSE COMPLÈTE
═══════════════════════════════════════════ */
function CompleteRow({ a, onDelete, isLast, selectionMode, selected, onToggleSelect }: {
  a: Analyse; onDelete: (id: string) => void; isLast: boolean;
  selectionMode: boolean; selected: boolean; onToggleSelect: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const title = a.adresse_bien || 'Adresse en cours de détection…';
  const rs = recoStyle(a.recommandation);
  const docCount = a.document_names?.length || 0;

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .cpl-desktop { display: none !important; }
          .cpl-mobile { display: flex !important; }
        }
        @media (min-width: 641px) { .cpl-mobile { display: none !important; } }
      `}</style>

      {/* DESKTOP */}
      <div className="cpl-desktop"
        style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
          borderBottom: isLast ? 'none' : '0.5px solid #f0f4f7',
          background: selected ? '#f0f7fb' : 'transparent',
          cursor: selectionMode ? 'pointer' : 'default', transition: 'background 0.15s',
        }}
        onClick={() => { if (selectionMode) onToggleSelect(a.id); }}
        onMouseOver={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.background = '#fafcfd'; }}
        onMouseOut={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.background = selected ? '#f0f7fb' : 'transparent'; }}
      >
        {selectionMode && <div onClick={e => { e.stopPropagation(); onToggleSelect(a.id); }} style={{ cursor: 'pointer' }}>{selected ? <CheckSquare size={17} color={C.teal} /> : <Square size={17} color="#cbd5e1" />}</div>}

        {a.status === 'processing' ? (
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2.5px solid #edf2f7', borderTopColor: C.teal, animation: 'spin 0.9s linear infinite', flexShrink: 0 }} />
        ) : a.score != null ? (
          <ScoreRing score={a.score} size={44} />
        ) : null}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f2d3d', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {a.status === 'processing' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: C.teal }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, animation: 'pulse 1.5s ease-in-out infinite' }} />
                {(a as Analyse & { progress_message?: string }).progress_message || 'Analyse en cours…'}
              </span>
            ) : (
              <>
                {a.recommandation && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 7, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>{a.recommandation}</span>}
                {docCount > 0 && <span style={{ fontSize: 11, color: '#94a3b8' }}>{docCount} doc{docCount > 1 ? 's' : ''}</span>}
                <span style={{ fontSize: 11, color: '#b0bec5' }}>· {a.date}</span>
              </>
            )}
          </div>
        </div>

        {!selectionMode && a.status !== 'processing' && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <Link to={`/dashboard/rapport?id=${a.id}`} style={{ padding: '6px 13px', borderRadius: 7, background: '#e8f4f8', color: '#0e3a4a', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              <ExternalLink size={11} /> Rapport
            </Link>
            {!a.is_preview && a.status === 'completed' && <ShareBadge analyseId={a.id} titre={title} />}
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{ width: 28, height: 28, borderRadius: 6, background: C.redBg, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={11} color={C.red} /></button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 7, background: C.redBg, border: `1px solid ${C.redBorder}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.red }}>Supprimer ?</span>
                <button onClick={() => onDelete(a.id)} style={{ padding: '2px 8px', borderRadius: 5, background: C.red, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: '2px 6px', borderRadius: 5, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBILE */}
      <div className="cpl-mobile" style={{ display: 'none', flexDirection: 'column', padding: '14px', borderBottom: isLast ? 'none' : '0.5px solid #f0f4f7' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          {a.status === 'processing' ? (
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2.5px solid #edf2f7', borderTopColor: C.teal, animation: 'spin 0.9s linear infinite', flexShrink: 0 }} />
          ) : a.score != null ? (
            <ScoreRing score={a.score} size={40} />
          ) : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2d3d', lineHeight: 1.3, marginBottom: 3 }}>{title}</div>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
              {a.recommandation && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: rs.bg, color: rs.color }}>{a.recommandation}</span>}
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{a.date}</span>
            </div>
          </div>
        </div>
        {a.status !== 'processing' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Link to={`/dashboard/rapport?id=${a.id}`} style={{ flex: 1, padding: '7px 0', borderRadius: 7, background: '#e8f4f8', color: '#0e3a4a', fontSize: 12, fontWeight: 700, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <ExternalLink size={11} /> Rapport
            </Link>
            <button onClick={() => { if (confirmDelete) onDelete(a.id); else setConfirmDelete(true); }}
              style={{ width: 34, height: 34, borderRadius: 7, background: confirmDelete ? C.red : C.redBg, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Trash2 size={12} color={confirmDelete ? '#fff' : C.red} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   LIGNE SIMPLE / APERÇU
═══════════════════════════════════════════ */
function SimpleRow({ a, onDelete, isPreview, isLast, selectionMode, selected, onToggleSelect }: {
  a: Analyse; onDelete: (id: string) => void; isPreview?: boolean; isLast: boolean;
  selectionMode: boolean; selected: boolean; onToggleSelect: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const title = a.type === 'complete' ? (a.adresse_bien || 'Adresse…') : (a.nom_document || 'Document sans nom');
  const iconBg = isPreview ? C.amberBg : '#e1f5ee';
  const iconColor = isPreview ? '#854F0B' : '#0F6E56';
  const btnBg = isPreview ? C.purpleBg : '#e1f5ee';
  const btnColor = isPreview ? '#6d28d9' : '#085041';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
        borderBottom: isLast ? 'none' : '0.5px solid #f0f4f7',
        background: selected ? '#f0f7fb' : 'transparent',
        opacity: isPreview ? 0.6 : 1,
        cursor: selectionMode ? 'pointer' : 'default', transition: 'background 0.15s',
      }}
      onClick={() => { if (selectionMode) onToggleSelect(a.id); }}
      onMouseOver={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.background = '#fafcfd'; }}
      onMouseOut={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.background = selected ? '#f0f7fb' : 'transparent'; }}
    >
      {selectionMode && <div onClick={e => { e.stopPropagation(); onToggleSelect(a.id); }} style={{ cursor: 'pointer' }}>{selected ? <CheckSquare size={17} color={C.teal} /> : <Square size={17} color="#cbd5e1" />}</div>}

      <div style={{ width: 30, height: 30, borderRadius: 7, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isPreview ? <Eye size={13} style={{ color: iconColor }} /> : <FileText size={13} style={{ color: iconColor }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f2d3d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{isPreview ? 'Aperçu' : '1 document'} · {a.date}</div>
      </div>
      {a.status === 'processing' ? (
        <span style={{ fontSize: 11, fontWeight: 700, color: C.teal, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.teal, animation: 'pulse 1.5s ease-in-out infinite' }} /> En cours…
        </span>
      ) : (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {isPreview && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: C.amberBg, color: '#92400e', border: `1px solid ${C.amberBorder}` }}>Aperçu</span>}
          <Link to={`/dashboard/rapport?id=${a.id}`} style={{ padding: '5px 11px', borderRadius: 7, background: btnBg, color: btnColor, fontSize: 11, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
            {isPreview ? <><Eye size={10} /> Débloquer</> : <><ExternalLink size={10} /> Rapport</>}
          </Link>
          {!selectionMode && !confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} style={{ width: 26, height: 26, borderRadius: 6, background: C.redBg, border: `1px solid ${C.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={10} color={C.red} /></button>
          )}
          {!selectionMode && confirmDelete && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 6, background: C.redBg, border: `1px solid ${C.redBorder}` }}>
              <button onClick={() => onDelete(a.id)} style={{ padding: '2px 7px', borderRadius: 4, background: C.red, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '2px 5px', borderRadius: 4, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════ */
export default function MesAnalyses() {
  const { analyses, loading, refetch } = useAnalyses();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const deleteAnalyse = async (id: string) => { await supabase.from('analyses').delete().eq('id', id); refetch(); };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    await supabase.from('analyses').delete().in('id', Array.from(selectedIds));
    setSelectedIds(new Set()); setSelectionMode(false); setConfirmBulkDelete(false); setDeleting(false); refetch();
  };

  const toggleSelect = (id: string) => { setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()); setConfirmBulkDelete(false); };

  useEffect(() => {
    const hasProc = analyses.some(a => a.status === 'processing');
    if (hasProc) { pollingRef.current = setInterval(() => refetch(), 4000); }
    else { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [analyses, refetch]);

  const filtered = analyses.filter(a => (a.adresse_bien || a.nom_document || '').toLowerCase().includes(search.toLowerCase()));
  const completes = filtered.filter(a => a.type === 'complete' && !a.is_preview);
  const simples = filtered.filter(a => a.type === 'document' && !a.is_preview);
  const apercus = filtered.filter(a => a.is_preview === true);
  const all = [...completes, ...simples, ...apercus];
  const allSelected = all.length > 0 && selectedIds.size === all.length;
  const toggleAll = () => { if (allSelected) setSelectedIds(new Set()); else setSelectedIds(new Set(all.map(a => a.id))); };

  if (loading) return <DashboardLoader message="Chargement de vos analyses…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>{analyses.length} analyse{analyses.length > 1 ? 's' : ''}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {!selectionMode ? (
            <>
              {all.length > 1 && <button onClick={() => setSelectionMode(true)} style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><CheckSquare size={14} /> Sélectionner</button>}
              <Link to="/dashboard/nouvelle-analyse" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={14} /> Nouvelle</Link>
            </>
          ) : (
            <>
              <button onClick={toggleAll} style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}</button>
              {selectedIds.size > 0 && !confirmBulkDelete && <button onClick={() => setConfirmBulkDelete(true)} style={{ padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${C.redBorder}`, background: C.redBg, color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Trash2 size={14} /> Supprimer ({selectedIds.size})</button>}
              {confirmBulkDelete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: C.redBg, border: `1.5px solid ${C.redBorder}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.red }}>Supprimer {selectedIds.size} analyse{selectedIds.size > 1 ? 's' : ''} ?</span>
                  <button onClick={deleteSelected} disabled={deleting} style={{ padding: '4px 12px', borderRadius: 7, background: C.red, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{deleting ? '…' : 'Confirmer'}</button>
                  <button onClick={() => setConfirmBulkDelete(false)} style={{ padding: '4px 10px', borderRadius: 7, background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Non</button>
                </div>
              )}
              <button onClick={exitSelectionMode} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={15} /></button>
            </>
          )}
        </div>
      </div>

      {/* RECHERCHE */}
      {!selectionMode && (
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une adresse ou un document…"
            style={{ width: '100%', padding: '10px 14px 10px 37px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' as const, color: '#0f172a' }} />
        </div>
      )}

      {/* ═══ ANALYSES COMPLÈTES ═══ */}
      {completes.length > 0 && (
        <div>
          <SectionHeader label="Analyses complètes" count={completes.length} color={C.navy} />
          <div style={{ background: '#fff', border: '1px solid #e8eff4', borderRadius: 12, overflow: 'hidden' }}>
            {completes.map((a, i) => (
              <CompleteRow key={a.id} a={a} onDelete={deleteAnalyse} isLast={i === completes.length - 1} selectionMode={selectionMode} selected={selectedIds.has(a.id)} onToggleSelect={toggleSelect} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ ANALYSES SIMPLES ═══ */}
      {simples.length > 0 && (
        <div>
          <SectionHeader label="Analyses simples" count={simples.length} color={C.teal} />
          <div style={{ background: '#fff', border: '1px solid #e8eff4', borderRadius: 12, overflow: 'hidden' }}>
            {simples.map((a, i) => (
              <SimpleRow key={a.id} a={a} onDelete={deleteAnalyse} isLast={i === simples.length - 1} selectionMode={selectionMode} selected={selectedIds.has(a.id)} onToggleSelect={toggleSelect} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ APERÇUS ═══ */}
      {apercus.length > 0 && (
        <div>
          <SectionHeader label="Aperçus" count={apercus.length} color="#d97706" />
          <div style={{ background: '#fff', border: '1px solid #e8eff4', borderRadius: 12, overflow: 'hidden' }}>
            {apercus.map((a, i) => (
              <SimpleRow key={a.id} a={a} onDelete={deleteAnalyse} isPreview isLast={i === apercus.length - 1} selectionMode={selectionMode} selected={selectedIds.has(a.id)} onToggleSelect={toggleSelect} />
            ))}
          </div>
        </div>
      )}

      {/* EMPTY */}
      {all.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0', padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>{search ? 'Aucune analyse ne correspond à votre recherche.' : 'Vous n\'avez pas encore d\'analyse. Lancez-en une !'}</p>
          {!search && <Link to="/dashboard/nouvelle-analyse" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}><Plus size={14} /> Nouvelle analyse</Link>}
        </div>
      )}
    </div>
  );
}
