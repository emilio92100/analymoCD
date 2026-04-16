import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Building2, ExternalLink, Trash2, Copy, Check, Mail, Share2, CheckSquare, Square, X } from 'lucide-react';
import { getOrCreateShareToken } from '../../lib/analyses';
import { supabase } from '../../lib/supabase';
import { useAnalyses, type Analyse } from '../../hooks/useAnalyses';

function ScoreBadge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 14 ? '#16a34a' : score >= 10 ? '#d97706' : '#dc2626';
  const bg = score >= 14 ? '#f0fdf4' : score >= 10 ? '#fffbeb' : '#fef2f2';
  const bord = score >= 14 ? '#bbf7d0' : score >= 10 ? '#fde68a' : '#fecaca';
  const fs = size === 'lg' ? 52 : size === 'md' ? 18 : 14;
  const pad = size === 'lg' ? '12px 28px' : size === 'md' ? '5px 12px' : '3px 9px';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, padding: pad, borderRadius: 10, background: bg, border: `1.5px solid ${bord}`, fontSize: fs, fontWeight: 900, color, letterSpacing: '-0.01em', flexShrink: 0 }}>
      {score.toFixed(1)}<span style={{ fontSize: fs * 0.55, fontWeight: 600, opacity: 0.65 }}>/20</span>
    </span>
  );
}

function ShareBadge({ analyseId, titre }: { analyseId: string; titre: string }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const getUrl = async (): Promise<string | null> => {
    setLoading(true);
    const token = await getOrCreateShareToken(analyseId);
    setLoading(false);
    if (!token) return null;
    return `${window.location.origin}/rapport/partage/${token}`;
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(v => !v);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = await getUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setShowMenu(false);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmail = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = await getUrl();
    if (!url) return;
    setShowMenu(false);
    const subject = encodeURIComponent('Rapport Verimo partagé avec vous');
    const body = encodeURIComponent(`Bonjour,\n\nJe vous partage un rapport d'analyse immobilière Verimo pour le bien : ${titre}.\n\nConsultez-le ici :\n${url}\n\nBonne lecture,`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    // isolation: isolate crée un nouveau stacking context indépendant du transform parent
    <div style={{ position: 'relative', isolation: 'isolate' }} ref={menuRef}>
      <button onClick={handleToggle} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, background: copied ? '#f0fdf4' : showMenu ? '#edf2f7' : '#f8fafc', border: `1px solid ${copied ? '#bbf7d0' : '#edf2f7'}`, fontSize: 11, fontWeight: 700, color: copied ? '#16a34a' : '#64748b', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {copied ? <Check size={11} /> : <Share2 size={11} />}
        {copied ? 'Copié !' : loading ? '…' : 'Partager'}
      </button>
      {showMenu && (
        <div style={{ position: 'fixed', zIndex: 9999, background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.15)', overflow: 'hidden', minWidth: 210 }}
          ref={el => {
            if (el && menuRef.current) {
              const btn = menuRef.current.querySelector('button');
              if (btn) {
                const rect = btn.getBoundingClientRect();
                el.style.top = `${rect.bottom + 6}px`;
                el.style.right = `${window.innerWidth - rect.right}px`;
              }
            }
          }}>
          <button onClick={handleCopy}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0f172a', textAlign: 'left' as const }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <Copy size={13} style={{ color: '#64748b', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Copier le lien</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>Accessible sans compte</div>
            </div>
          </button>
          <div style={{ height: 1, background: '#f1f5f9' }} />
          <button onClick={handleEmail}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0f172a', textAlign: 'left' as const }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <Mail size={13} style={{ color: '#64748b', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Envoyer par e-mail</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>Ouvre votre messagerie</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

function AnalyseRow({ a, onDelete, selected, onToggleSelect, selectionMode }: {
  a: Analyse; onDelete: (id: string) => void;
  selected: boolean; onToggleSelect: (id: string) => void; selectionMode: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isComplete = a.type === 'complete';
  const displayTitle = isComplete ? (a.adresse_bien || 'Adresse en cours de détection…') : (a.nom_document || 'Document sans nom');
  // Version courte pour mobile — on extrait juste le type de doc
  const shortTitle = (() => {
    if (isComplete) return displayTitle;
    const t = (a.nom_document || '').toLowerCase();
    if (t.includes('amiante') || t.includes('dta') || t.includes('dossier technique')) return 'Dossier Technique Amiante';
    if (t.includes('procès-verbal') || t.includes('pv ag') || t.includes('assemblée générale') || t.includes('proces verbal')) return 'PV Assemblée Générale';
    if (t.includes('règlement de copropriété') || t.includes('reglement de copropriete') || t.includes('rcp')) return 'Règlement de Copropriété';
    if (t.includes('modificatif') && (t.includes('règlement') || t.includes('copro'))) return 'Modificatif RCP';
    if (t.includes('appel de charges') || t.includes('appel de fonds')) return 'Appel de Charges';
    if (t.includes('diagnostic') && t.includes('parties communes')) return 'Diagnostic Parties Communes';
    if (t.includes('carnet d') && t.includes('entretien')) return "Carnet d'Entretien";
    if (t.includes('pré-état daté') || t.includes('pre-etat date') || t.includes('pré état daté')) return 'Pré-état Daté';
    if (t.includes('état daté') || t.includes('etat date')) return 'État Daté';
    if (t.includes('taxe foncière') || t.includes('taxe fonciere')) return 'Taxe Foncière';
    if (t.includes('compromis') || t.includes('promesse de vente')) return 'Compromis de Vente';
    if (t.includes('dtg') || t.includes('plan pluriannuel') || t.includes('ppt')) return 'DTG / PPT';
    if (t.includes('dpe') || t.includes('diagnostic de performance')) return 'DPE';
    // Fallback: prendre avant le premier "—" ou les 40 premiers caractères
    const dash = displayTitle.indexOf('—');
    if (dash > 0 && dash < 50) return displayTitle.substring(0, dash).trim();
    return displayTitle.length > 42 ? displayTitle.substring(0, 40) + '…' : displayTitle;
  })();
  const isPreview = a.is_preview ?? false;
  const typeLabel = isPreview ? 'Aperçu gratuit' : isComplete ? 'Analyse Complète' : 'Analyse Document';
  const typeBg = isPreview ? 'rgba(22,163,74,0.07)' : isComplete ? 'rgba(15,45,61,0.07)' : 'rgba(42,125,156,0.07)';
  const typeColor = isPreview ? '#16a34a' : isComplete ? '#0f2d3d' : '#2a7d9c';

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .ma-card-desktop { display: none !important; }
          .ma-card-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .ma-card-mobile { display: none !important; }
        }
      `}</style>

      {/* ── DESKTOP — layout horizontal ── */}
      <div className="ma-card-desktop" style={{ background: selected ? '#f0f7fb' : '#fff', borderRadius: 13, border: `1px solid ${selected ? '#2a7d9c' : '#edf2f7'}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: selected ? '0 0 0 2px rgba(42,125,156,0.12)' : '0 1px 3px rgba(0,0,0,0.03)', transition: 'all 0.18s', cursor: selectionMode ? 'pointer' : 'default' }}
        onClick={() => { if (selectionMode) onToggleSelect(a.id); }}
        onMouseOver={e => { if (!selectionMode) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 4px 18px rgba(42,125,156,0.08)'; el.style.borderColor = '#dbeafe'; } }}
        onMouseOut={e => { if (!selectionMode) { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; el.style.borderColor = '#edf2f7'; } }}>
        {selectionMode && <div onClick={e => { e.stopPropagation(); onToggleSelect(a.id); }} style={{ flexShrink: 0, cursor: 'pointer' }}>{selected ? <CheckSquare size={18} color="#2a7d9c" /> : <Square size={18} color="#cbd5e1" />}</div>}
        <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: `${isComplete ? '#0f2d3d' : '#2a7d9c'}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isComplete ? <Building2 size={16} style={{ color: '#0f2d3d' }} /> : <FileText size={16} style={{ color: '#2a7d9c' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayTitle}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ background: typeBg, borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: typeColor }}>{typeLabel}</span>
            <span>·</span><span>{a.date}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {a.status === 'processing' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#2a7d9c', background: 'rgba(42,125,156,0.07)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(42,125,156,0.15)', whiteSpace: 'nowrap' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', animation: 'pulse 1.5s ease-in-out infinite' }} />
              {(a as Analyse & { progress_message?: string }).progress_message || 'Analyse en cours…'}
            </div>
          ) : (
            <>
              {isComplete && a.score != null && <ScoreBadge score={a.score} size="sm" />}
              {!selectionMode && <Link to={`/dashboard/rapport?id=${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', fontSize: 12, fontWeight: 700, color: '#2a7d9c', textDecoration: 'none', whiteSpace: 'nowrap' }}><ExternalLink size={11} /> Rapport</Link>}
              {!selectionMode && !a.is_preview && a.status === 'completed' && <ShareBadge analyseId={a.id} titre={displayTitle} />}
            </>
          )}
          {!selectionMode && (!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ width: 30, height: 30, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Trash2 size={12} color="#dc2626" /></button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>Supprimer ?</span>
              <button onClick={() => onDelete(a.id)} style={{ padding: '3px 10px', borderRadius: 6, background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '3px 8px', borderRadius: 6, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── MOBILE — layout 3 lignes ── */}
      <div className="ma-card-mobile" style={{ background: selected ? '#f0f7fb' : '#fff', borderRadius: 13, border: `1px solid ${selected ? '#2a7d9c' : '#edf2f7'}`, padding: '12px 14px', flexDirection: 'column', gap: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        {/* Ligne 1 — Icône + Titre (centré) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${isComplete ? '#0f2d3d' : '#2a7d9c'}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {a.status === 'processing'
              ? <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid #2a7d9c', borderTopColor: 'transparent', animation: 'spin 0.85s linear infinite' }} />
              : isComplete ? <Building2 size={16} style={{ color: '#0f2d3d' }} /> : <FileText size={16} style={{ color: '#2a7d9c' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{shortTitle}</div>
            {/* Adresse du bien si analyse complète et différente du shortTitle */}
            {isComplete && a.adresse_bien && (
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>📍 {a.adresse_bien}</div>
            )}
            {/* Pour doc simple : nom court déjà affiché, pas besoin d'adresse */}
          </div>
        </div>
        {/* Ligne 2 — Actions */}
        {!selectionMode && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }} onClick={e => e.stopPropagation()}>
            {a.status === 'processing' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#2a7d9c', background: 'rgba(42,125,156,0.07)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(42,125,156,0.15)' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2a7d9c', animation: 'pulse 1.5s ease-in-out infinite' }} />
                {(a as Analyse & { progress_message?: string }).progress_message || 'Analyse en cours…'}
              </div>
            ) : (
              <>
                <Link to={`/dashboard/rapport?id=${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, background: '#f0f7fb', border: '1px solid #bfdbfe', fontSize: 13, fontWeight: 700, color: '#2a7d9c', textDecoration: 'none' }}><ExternalLink size={12} /> Rapport</Link>
                {!a.is_preview && a.status === 'completed' && <ShareBadge analyseId={a.id} titre={displayTitle} />}
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} style={{ width: 34, height: 34, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginLeft: 'auto' }}><Trash2 size={13} color="#dc2626" /></button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', marginLeft: 'auto' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>Supprimer ?</span>
                    <button onClick={() => onDelete(a.id)} style={{ padding: '3px 8px', borderRadius: 5, background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button>
                    <button onClick={() => setConfirmDelete(false)} style={{ padding: '3px 6px', borderRadius: 5, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {/* Ligne 3 — Type + Date + Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
          <span style={{ background: typeBg, borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: typeColor }}>{typeLabel}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>· {a.date}</span>
          {isComplete && a.score != null && (
            <span style={{ fontSize: 12, fontWeight: 800, color: a.score >= 14 ? '#16a34a' : a.score >= 10 ? '#d97706' : '#dc2626', marginLeft: 'auto' }}>{a.score.toFixed(1)}/20</span>
          )}
        </div>
      </div>
    </>
  );
}

export default function MesAnalyses() {
  const { analyses, loading, refetch } = useAnalyses();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'complete' | 'document'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const deleteAnalyse = async (id: string) => {
    await supabase.from('analyses').delete().eq('id', id);
    refetch();
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    await supabase.from('analyses').delete().in('id', Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectionMode(false);
    setConfirmBulkDelete(false);
    setDeleting(false);
    refetch();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setConfirmBulkDelete(false);
  };

  useEffect(() => {
    const hasProcessing = analyses.some(a => a.status === 'processing');
    if (hasProcessing) {
      pollingRef.current = setInterval(() => { refetch(); }, 4000);
    } else {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [analyses, refetch]);

  const filtered = analyses.filter(a => {
    const matchSearch = (a.adresse_bien || a.nom_document || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.type === filter;
    return matchSearch && matchFilter;
  });

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{analyses.length} analyse{analyses.length > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!selectionMode ? (
            <>
              {filtered.length > 1 && (
                <button onClick={() => setSelectionMode(true)}
                  style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckSquare size={14} /> Sélectionner
                </button>
              )}
              <Link to="/dashboard/nouvelle-analyse" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Nouvelle
              </Link>
            </>
          ) : (
            <>
              <button onClick={toggleAll}
                style={{ padding: '9px 14px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              {selectedIds.size > 0 && !confirmBulkDelete && (
                <button onClick={() => setConfirmBulkDelete(true)}
                  style={{ padding: '9px 16px', borderRadius: 10, border: '1.5px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={14} /> Supprimer ({selectedIds.size})
                </button>
              )}
              {confirmBulkDelete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>Supprimer {selectedIds.size} analyse{selectedIds.size > 1 ? 's' : ''} ?</span>
                  <button onClick={deleteSelected} disabled={deleting}
                    style={{ padding: '4px 12px', borderRadius: 7, background: '#dc2626', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {deleting ? '…' : 'Confirmer'}
                  </button>
                  <button onClick={() => setConfirmBulkDelete(false)} style={{ padding: '4px 10px', borderRadius: 7, background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Non</button>
                </div>
              )}
              <button onClick={exitSelectionMode}
                style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtres */}
      {!selectionMode && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
              style={{ width: '100%', padding: '10px 14px 10px 37px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' as const, color: '#0f172a' }} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([['all', 'Tout'], ['complete', 'Complètes'], ['document', 'Documents']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)}
                style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${filter === val ? '#2a7d9c' : '#edf2f7'}`, background: filter === val ? 'rgba(42,125,156,0.07)' : '#fff', fontSize: 12, fontWeight: 700, color: filter === val ? '#2a7d9c' : '#64748b', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 }}>Chargement de vos analyses…</div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(a => (
            <AnalyseRow key={a.id} a={a} onDelete={deleteAnalyse}
              selected={selectedIds.has(a.id)}
              onToggleSelect={toggleSelect}
              selectionMode={selectionMode} />
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 18, border: '2px dashed #e2e8f0', padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Aucune analyse ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
}
