import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FileText, Building2, ExternalLink, Trash2 } from 'lucide-react';
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

function AnalyseRow({ a, onDelete }: { a: Analyse; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isComplete = a.type === 'complete';
  const displayTitle = isComplete ? (a.adresse_bien || 'Adresse en cours de détection…') : (a.nom_document || 'Document sans nom');
  const isPreview = a.is_preview ?? false;
  const typeLabel = isPreview ? 'Aperçu gratuit' : isComplete ? 'Analyse Complète' : 'Analyse Document';
  const typeBg = isPreview ? 'rgba(22,163,74,0.07)' : isComplete ? 'rgba(15,45,61,0.07)' : 'rgba(42,125,156,0.07)';
  const typeColor = isPreview ? '#16a34a' : isComplete ? '#0f2d3d' : '#2a7d9c';

  return (
    <div style={{ background: '#fff', borderRadius: 13, border: '1px solid #edf2f7', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', transition: 'all 0.18s' }}
      onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 4px 18px rgba(42,125,156,0.08)'; el.style.transform = 'translateY(-1px)'; el.style.borderColor = '#dbeafe'; }}
      onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; el.style.transform = 'translateY(0)'; el.style.borderColor = '#edf2f7'; }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: a.status === 'processing' ? 'rgba(42,125,156,0.07)' : `${isComplete ? '#0f2d3d' : '#2a7d9c'}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {a.status === 'processing'
          ? <div style={{ width: 17, height: 17, borderRadius: '50%', border: '2.5px solid #2a7d9c', borderTopColor: 'transparent', animation: 'spin 0.85s linear infinite' }} />
          : isComplete ? <Building2 size={17} style={{ color: '#0f2d3d' }} /> : <FileText size={17} style={{ color: '#2a7d9c' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayTitle}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ background: typeBg, borderRadius: 5, padding: '2px 7px', fontSize: 10, fontWeight: 700, color: typeColor }}>{typeLabel}</span>
          <span>·</span><span>{a.date}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {a.status === 'processing' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#2a7d9c', background: 'rgba(42,125,156,0.07)', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(42,125,156,0.15)', whiteSpace: 'nowrap' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', animation: 'pulse 1.5s ease-in-out infinite' }} />
              {(a as Analyse & { progress_message?: string }).progress_message || 'Analyse en cours…'}
            </div>
          </div>
        ) : (
          <>
            {isComplete && a.score != null && <ScoreBadge score={a.score} size="sm" />}

            <Link to={`/dashboard/rapport?id=${a.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', fontSize: 12, fontWeight: 700, color: '#2a7d9c', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#e8f4f8'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}>
              <ExternalLink size={11} /> Rapport
            </Link>
          </>
        )}
        {/* Bouton supprimer */}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)}
            style={{ width: 30, height: 30, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; }}
            onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; }}
            title="Supprimer cette analyse">
            <Trash2 size={12} color="#dc2626" />
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626' }}>Supprimer ?</span>
            <button onClick={() => onDelete(a.id)}
              style={{ padding: '3px 10px', borderRadius: 6, background: '#dc2626', border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button>
            <button onClick={() => setConfirmDelete(false)}
              style={{ padding: '3px 8px', borderRadius: 6, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

export default function MesAnalyses() {
  const { analyses, loading, refetch } = useAnalyses();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'complete' | 'document'>('all');

  const deleteAnalyse = async (id: string) => {
    await supabase.from('analyses').delete().eq('id', id);
    refetch();
  };
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling automatique si une analyse est en cours
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 4 }}>Mes analyses</h1>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{analyses.length} analyse{analyses.length > 1 ? 's' : ''}</p>
        </div>
        <Link to="/dashboard/nouvelle-analyse" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Nouvelle
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ width: '100%', padding: '10px 14px 10px 37px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' as const, color: '#0f172a' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {([['all', 'Tout'], ['complete', 'Complètes'], ['document', 'Documents']] as const).map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${filter === val ? '#2a7d9c' : '#edf2f7'}`, background: filter === val ? 'rgba(42,125,156,0.07)' : '#fff', fontSize: 12, fontWeight: 700, color: filter === val ? '#2a7d9c' : '#64748b', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 }}>Chargement de vos analyses…</div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{filtered.map(a => <AnalyseRow key={a.id} a={a} onDelete={deleteAnalyse} />)}</div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 18, border: '2px dashed #e2e8f0', padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>Aucune analyse ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
}
