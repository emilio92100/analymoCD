import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, Plus, Sparkles, ExternalLink, Building2, BookOpen, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../hooks/useUser';
import { useAnalyses, type Analyse } from '../../hooks/useAnalyses';
import { useCredits } from '../../hooks/useCredits';
import DashboardLoader from '../../components/DashboardLoader';

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

function AnalyseRow({ a }: { a: Analyse }) {
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
        {a.status === 'processing' ? <div style={{ width: 17, height: 17, borderRadius: '50%', border: '2.5px solid #2a7d9c', borderTopColor: 'transparent', animation: 'spin 0.85s linear infinite' }} /> : isComplete ? <Building2 size={17} style={{ color: '#0f2d3d' }} /> : <FileText size={17} style={{ color: '#2a7d9c' }} />}
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
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: 'rgba(42,125,156,0.07)', padding: '4px 10px', borderRadius: 7 }}>En cours…</span>
        ) : (
          <>
            {isComplete && a.score != null && <ScoreBadge score={a.score} />}
            <Link to={`/dashboard/rapport?id=${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', fontSize: 12, fontWeight: 700, color: '#2a7d9c', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s' }} onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#e8f4f8'} onMouseOut={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}>
              <ExternalLink size={11} /> Rapport
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function HomeView() {
  const { name } = useUser();
  const { analyses, loading: analysesLoading } = useAnalyses();
  const { credits } = useCredits();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const hasAnalyses = analyses.length > 0;
  const [freePreviewUsedHome, setFreePreviewUsedHome] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setFreePreviewUsedHome(true); return; }
      const { data } = await supabase.from('profiles').select('free_preview_used').eq('id', user.id).single();
      const used = data?.free_preview_used === true;
      if (used) localStorage.setItem('verimo_free_preview_used', 'true');
      else localStorage.removeItem('verimo_free_preview_used');
      setFreePreviewUsedHome(used);
    };
    sync();
  }, []);

  const totalAnalyses = analyses.length;
  const lastAnalyse = [...analyses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (analysesLoading) return <DashboardLoader message="Chargement de votre espace…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.35s ease both' }}>
      <style>{`
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .stats-grid > div:last-child { grid-column: auto !important; }
          .aide-banner { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }
          .aide-banner-cta { width: 100% !important; justify-content: center !important; }
        }
      `}</style>

      {/* SALUTATION */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{greeting}{name ? `, ${name}` : ''} 👋</h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0' }}>Bienvenue sur votre espace Verimo.</p>
      </div>

      {/* STATS */}
      {freePreviewUsedHome !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }} className="stats-grid">
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>TOTAL ANALYSES</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{totalAnalyses}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{totalAnalyses > 1 ? 'analyses réalisées' : 'analyse réalisée'}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>DERNIÈRE ANALYSE</div>
            {lastAnalyse ? (
              <>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{lastAnalyse.date}</div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4, wordBreak: 'break-word' as const }}>{lastAnalyse.type === 'complete' ? lastAnalyse.adresse_bien : lastAnalyse.nom_document}</div>
              </>
            ) : <div style={{ fontSize: 14, color: '#94a3b8' }}>Aucune encore</div>}
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>CRÉDITS</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: credits.document > 0 ? '#2a7d9c' : '#94a3b8' }}>{credits.document}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>SIMPLE</div>
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: credits.complete > 0 ? '#0f2d3d' : '#94a3b8' }}>{credits.complete}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8' }}>COMPLÈTE</div>
              </div>
            </div>
            <Link to="/dashboard/tarifs" style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', textDecoration: 'none', display: 'block', marginTop: 8 }}>+ Acheter des crédits</Link>
          </div>
        </div>
      )}

      {/* ANALYSES RÉCENTES */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Analyses récentes</h2>
          {hasAnalyses && <Link to="/dashboard/analyses" style={{ fontSize: 13, color: '#2a7d9c', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>Tout voir <ChevronRight size={14} /></Link>}
        </div>
        {!hasAnalyses ? (
          <div style={{ background: '#fff', borderRadius: 18, border: '2px dashed #e2e8f0', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(42,125,156,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Sparkles size={28} style={{ color: '#2a7d9c' }} /></div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Aucune analyse pour le moment</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>Déposez vos documents immobiliers et obtenez un rapport complet en quelques minutes*.</p>
            <Link to="/dashboard/nouvelle-analyse" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(15,45,61,0.2)' }}>
              <Plus size={15} /> Lancer ma première analyse
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{analyses.slice(0, 3).map(a => <AnalyseRow key={a.id} a={a} />)}</div>
        )}
      </div>

      {/* BANDE VERS AIDE & MÉTHODE — bien visible */}
      <Link to="/dashboard/aide" style={{ textDecoration: 'none' }}>
        <div className="aide-banner"
          style={{ background: 'linear-gradient(135deg, #f0f7fb 0%, #e0eef5 100%)', border: '1.5px solid #bae3f5', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 18, transition: 'all 0.2s', cursor: 'pointer' }}
          onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 24px rgba(42,125,156,0.15)'; el.style.borderColor = '#7cc4de'; }}
          onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; el.style.borderColor = '#bae3f5'; }}>
          <div style={{ width: 52, height: 52, borderRadius: 13, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(42,125,156,0.3)' }}>
            <BookOpen size={24} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Découvrez notre méthode d'analyse</div>
            <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.55 }}>Comprendre la notation /20, consulter le glossaire immobilier, et apprendre à utiliser Verimo au mieux.</div>
          </div>
          <div className="aide-banner-cta" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 11, background: '#fff', border: '1.5px solid #2a7d9c', color: '#2a7d9c', fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
            Aide & Méthode <ArrowRight size={15} />
          </div>
        </div>
      </Link>
    </div>
  );
}
