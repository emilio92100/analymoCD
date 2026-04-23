import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Copy, Check, Mail, Share2, CheckSquare, Square, X, ExternalLink, Building2, FileText, Eye } from 'lucide-react';
import { getOrCreateShareToken } from '../../lib/analyses';
import { supabase } from '../../lib/supabase';
import { useAnalyses, type Analyse } from '../../hooks/useAnalyses';
import DashboardLoader from '../../components/DashboardLoader';

/* ═══════════════════════════════════════════
   COULEURS & HELPERS
═══════════════════════════════════════════ */
const COLORS = {
  green: '#16a34a', greenBg: '#f0fdf4', greenBorder: '#bbf7d0',
  amber: '#d97706', amberBg: '#fffbeb', amberBorder: '#fde68a',
  red: '#dc2626', redBg: '#fef2f2', redBorder: '#fecaca',
  purple: '#7c3aed', purpleBg: '#f5f3ff', purpleBorder: '#ddd6fe',
  teal: '#2a7d9c', navy: '#0f2d3d',
};

function getScoreColor(score: number) {
  if (score >= 14) return COLORS.green;
  if (score >= 10) return COLORS.amber;
  return COLORS.red;
}

function getRecoStyle(reco?: string): { bg: string; color: string; border: string } {
  if (reco === 'Acheter') return { bg: COLORS.greenBg, color: '#166534', border: COLORS.greenBorder };
  if (reco === 'Négocier') return { bg: COLORS.amberBg, color: '#92400e', border: COLORS.amberBorder };
  if (reco === 'Bien à éviter') return { bg: COLORS.redBg, color: '#991b1b', border: COLORS.redBorder };
  return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
}

function getCatColor(pct: number) {
  if (pct >= 70) return COLORS.green;
  if (pct >= 50) return COLORS.amber;
  return COLORS.red;
}

const catLabelsShort: Record<string, string> = {
  travaux: 'Travaux', procedures: 'Juridique', finances: 'Finances',
  diags_privatifs: 'Diag. priv.', diags_communs: 'Diag. comm.',
};

/* ═══════════════════════════════════════════
   SCORE RING SVG
═══════════════════════════════════════════ */
function ScoreRing({ score, size = 68 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 20);
  const color = getScoreColor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#edf2f7" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3.5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 60 ? 18 : 14, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{score.toFixed(1)}</span>
        <span style={{ fontSize: size > 60 ? 11 : 9, fontWeight: 500, color: '#94a3b8' }}>/20</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CATEGORY BARS (mini sous-scores)
═══════════════════════════════════════════ */
function CategoryBars({ categories }: { categories: Record<string, { note: number; note_max: number }> }) {
  const entries = Object.entries(categories).filter(([, c]) => c.note_max > 0);
  if (entries.length === 0) return null;
  const shown = entries.slice(0, 3);
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      {shown.map(([key, cat]) => {
        const pct = Math.round((cat.note / cat.note_max) * 100);
        const color = cat.note === 0 ? '#cbd5e1' : getCatColor(pct);
        return (
          <div key={key} style={{ minWidth: 80 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{catLabelsShort[key] || key}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color }}>{cat.note}</span>
            </div>
            <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2 }}>
              <div style={{ height: 3, background: color, borderRadius: 2, width: `${pct}%`, transition: 'width 0.8s ease' }} />
            </div>
          </div>
        );
      })}
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

  const handleToggle = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setShowMenu(v => !v); };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = await getUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true); setShowMenu(false);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmail = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = await getUrl();
    if (!url) return;
    setShowMenu(false);
    const subject = encodeURIComponent('Rapport Verimo partagé avec vous');
    const body = encodeURIComponent(`Bonjour,\n\nJe vous partage un rapport d'analyse immobilière Verimo pour le bien : ${titre}.\n\nConsultez-le ici :\n${url}\n\nBonne lecture,`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div style={{ position: 'relative', isolation: 'isolate' }} ref={menuRef}>
      <button onClick={handleToggle} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: copied ? COLORS.greenBg : '#f8fafc', border: `1px solid ${copied ? COLORS.greenBorder : '#edf2f7'}`, fontSize: 12, fontWeight: 700, color: copied ? COLORS.green : '#64748b', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
        {copied ? <Check size={12} /> : <Share2 size={12} />}
        {copied ? 'Copié !' : loading ? '…' : 'Partager'}
      </button>
      {showMenu && (
        <div style={{ position: 'fixed', zIndex: 9999, background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.15)', overflow: 'hidden', minWidth: 210 }}
          ref={el => {
            if (el && menuRef.current) {
              const btn = menuRef.current.querySelector('button');
              if (btn) { const rect = btn.getBoundingClientRect(); el.style.top = `${rect.bottom + 6}px`; el.style.right = `${window.innerWidth - rect.right}px`; }
            }
          }}>
          <button onClick={handleCopy}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0f172a', textAlign: 'left' as const }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <Copy size={13} style={{ color: '#64748b', flexShrink: 0 }} />
            <div><div style={{ fontWeight: 700 }}>Copier le lien</div><div style={{ fontSize: 10, color: '#94a3b8' }}>Accessible sans compte</div></div>
          </button>
          <div style={{ height: 1, background: '#f1f5f9' }} />
          <button onClick={handleEmail}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#0f172a', textAlign: 'left' as const }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <Mail size={13} style={{ color: '#64748b', flexShrink: 0 }} />
            <div><div style={{ fontWeight: 700 }}>Envoyer par e-mail</div><div style={{ fontSize: 10, color: '#94a3b8' }}>Ouvre votre messagerie</div></div>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '2px 9px', borderRadius: 10 }}>{count}</span>
      <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
    </div>
  );
}

/* ═══════════════════════════════════════════
   CARTE — ANALYSE COMPLÈTE (desktop)
═══════════════════════════════════════════ */
function CompleteCardDesktop({ a, onDelete, selected, onToggleSelect, selectionMode }: {
  a: Analyse; onDelete: (id: string) => void; selected: boolean; onToggleSelect: (id: string) => void; selectionMode: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const displayTitle = a.adresse_bien || 'Adresse en cours de détection…';
  const recoStyle = getRecoStyle(a.recommandation);
  const scoreColor = a.score != null ? getScoreColor(a.score) : '#cbd5e1';
  const result = a.result as Record<string, unknown> | null;
  const categories = (result?.categories as Record<string, { note: number; note_max: number }>) || {};
  const docCount = a.document_names?.length || 0;

  return (
    <div
      style={{
        background: selected ? '#f0f7fb' : '#fff', borderRadius: 14, border: `1.5px solid ${selected ? COLORS.teal : '#edf2f7'}`,
        overflow: 'hidden', transition: 'all 0.22s', cursor: selectionMode ? 'pointer' : 'default',
        boxShadow: selected ? '0 0 0 3px rgba(42,125,156,0.1)' : '0 1px 4px rgba(0,0,0,0.03)',
      }}
      onClick={() => { if (selectionMode) onToggleSelect(a.id); }}
      onMouseOver={e => { if (!selectionMode) { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(42,125,156,0.09)'; (e.currentTarget as HTMLElement).style.borderColor = '#d0e6ef'; } }}
      onMouseOut={e => { if (!selectionMode) { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = selected ? COLORS.teal : '#edf2f7'; } }}
    >
      <div style={{ display: 'flex' }}>
        <div style={{ width: 5, background: a.status === 'processing' ? COLORS.teal : scoreColor, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: '16px 18px', display: 'flex', gap: 16, alignItems: 'center' }}>
          {selectionMode && (
            <div onClick={e => { e.stopPropagation(); onToggleSelect(a.id); }} style={{ flexShrink: 0, cursor: 'pointer' }}>
              {selected ? <CheckSquare size={18} color={COLORS.teal} /> : <Square size={18} color="#cbd5e1" />}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
              {a.status === 'processing' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: COLORS.teal, background: 'rgba(42,125,156,0.07)', padding: '3px 10px', borderRadius: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: COLORS.teal, display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  {(a as Analyse & { progress_message?: string }).progress_message || 'Analyse en cours…'}
                </span>
              ) : (
                <>
                  {a.recommandation && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: recoStyle.bg, color: recoStyle.color, border: `1px solid ${recoStyle.border}` }}>
                      {a.recommandation}
                    </span>
                  )}
                </>
              )}
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{a.date}</span>
              {docCount > 0 && <span style={{ fontSize: 11, color: '#b0bec5' }}>· {docCount} document{docCount > 1 ? 's' : ''}</span>}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayTitle}
            </div>
            {a.status !== 'processing' && Object.keys(categories).length > 0 && (
              <div style={{ marginBottom: 12 }}><CategoryBars categories={categories} /></div>
            )}
            {!selectionMode && a.status !== 'processing' && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                <Link to={`/dashboard/rapport?id=${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.15)', fontSize: 12, fontWeight: 700, color: COLORS.teal, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  <ExternalLink size={12} /> Rapport
                </Link>
                {!a.is_preview && a.status === 'completed' && <ShareBadge analyseId={a.id} titre={displayTitle} />}
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)} style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.redBg, border: `1px solid ${COLORS.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' }}>
                    <Trash2 size={12} color={COLORS.red} />
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: COLORS.redBg, border: `1px solid ${COLORS.redBorder}`, marginLeft: 'auto' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.red }}>Supprimer ?</span>
                    <button onClick={() => onDelete(a.id)} style={{ padding: '3px 10px', borderRadius: 6, background: COLORS.red, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button>
                    <button onClick={() => setConfirmDelete(false)} style={{ padding: '3px 8px', borderRadius: 6, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button>
                  </div>
                )}
              </div>
            )}
          </div>
          {a.status !== 'processing' && a.score != null && <ScoreRing score={a.score} size={68} />}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CARTE — ANALYSE COMPLÈTE (mobile)
═══════════════════════════════════════════ */
function CompleteCardMobile({ a, onDelete }: { a: Analyse; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const displayTitle = a.adresse_bien || 'Adresse en cours de détection…';
  const recoStyle = getRecoStyle(a.recommandation);
  const result = a.result as Record<string, unknown> | null;
  const categories = (result?.categories as Record<string, { note: number; note_max: number }>) || {};
  const catEntries = Object.entries(categories).filter(([, c]) => c.note_max > 0).slice(0, 3);

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1.5px solid #edf2f7', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
      <div style={{ padding: '16px 14px', textAlign: 'center' }}>
        {a.status === 'processing' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0 8px', fontSize: 12, fontWeight: 700, color: COLORS.teal }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.teal, display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
            {(a as Analyse & { progress_message?: string }).progress_message || 'Analyse en cours…'}
          </div>
        ) : (
          <>
            {a.score != null && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}><ScoreRing score={a.score} size={60} /></div>
            )}
            {a.recommandation && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: recoStyle.bg, color: recoStyle.color, border: `1px solid ${recoStyle.border}`, display: 'inline-block', marginBottom: 8 }}>
                {a.recommandation}
              </span>
            )}
          </>
        )}
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, marginBottom: 4 }}>{displayTitle}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>{a.date}</div>
        {a.status !== 'processing' && catEntries.length > 0 && (
          <div style={{ display: 'flex', gap: 3, marginBottom: 10 }}>
            {catEntries.map(([key, cat]) => {
              const pct = Math.round((cat.note / cat.note_max) * 100);
              const color = cat.note === 0 ? '#e2e8f0' : getCatColor(pct);
              const bg = cat.note === 0 ? '#f1f5f9' : (pct >= 70 ? COLORS.greenBg : pct >= 50 ? COLORS.amberBg : COLORS.redBg);
              return <div key={key} style={{ flex: 1, height: 4, background: bg, borderRadius: 2 }}><div style={{ height: 4, background: color, borderRadius: 2, width: `${pct}%`, transition: 'width 0.8s ease' }} /></div>;
            })}
          </div>
        )}
        {a.status !== 'processing' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Link to={`/dashboard/rapport?id=${a.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '8px 0', borderRadius: 9, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.15)', fontSize: 12, fontWeight: 700, color: COLORS.teal, textDecoration: 'none' }}>
              <ExternalLink size={11} /> Rapport
            </Link>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{ width: 34, height: 34, borderRadius: 8, background: COLORS.redBg, border: `1px solid ${COLORS.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trash2 size={12} color={COLORS.red} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, background: COLORS.redBg, border: `1px solid ${COLORS.redBorder}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.red }}>?</span>
                <button onClick={() => onDelete(a.id)} style={{ padding: '3px 8px', borderRadius: 5, background: COLORS.red, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: '3px 6px', borderRadius: 5, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LIGNE — ANALYSE SIMPLE / APERÇU
═══════════════════════════════════════════ */
function SimpleRow({ a, onDelete, isPreview, selectionMode, selected, onToggleSelect }: {
  a: Analyse; onDelete: (id: string) => void; isPreview?: boolean;
  selectionMode: boolean; selected: boolean; onToggleSelect: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const displayTitle = a.type === 'complete' ? (a.adresse_bien || 'Adresse…') : (a.nom_document || 'Document sans nom');

  const shortTitle = (() => {
    if (a.type === 'complete') return displayTitle;
    const t = (a.nom_document || '').toLowerCase();
    if (t.includes('pré-état daté') || t.includes('pre-etat date') || t.includes('pré état daté')) return 'Pré-état Daté';
    if (t.includes('état daté') || t.includes('etat date')) return 'État Daté';
    if (t.includes('amiante') || t.includes('dta')) return 'Dossier Technique Amiante';
    if (t.includes('procès-verbal') || t.includes('pv ag') || t.includes('assemblée générale')) return 'PV Assemblée Générale';
    if (t.includes('règlement de copropriété') || t.includes('reglement de copropriete') || t.includes('rcp')) return 'Règlement de Copropriété';
    if (t.includes('appel de charges') || t.includes('appel de fonds')) return 'Appel de Charges';
    if (t.includes('dpe') || t.includes('diagnostic de performance')) return 'DPE';
    if (t.includes('taxe foncière') || t.includes('taxe fonciere')) return 'Taxe Foncière';
    if (t.includes('compromis') || t.includes('promesse de vente')) return 'Compromis de Vente';
    if (t.includes('dtg') || t.includes('plan pluriannuel') || t.includes('ppt')) return 'DTG / PPT';
    const dash = displayTitle.indexOf('—');
    if (dash > 0 && dash < 50) return displayTitle.substring(0, dash).trim();
    return displayTitle.length > 42 ? displayTitle.substring(0, 40) + '…' : displayTitle;
  })();

  const iconBg = isPreview ? COLORS.amberBg : '#e8f5f0';
  const iconStroke = isPreview ? '#92400e' : '#0f6e56';
  const btnBg = isPreview ? COLORS.purpleBg : '#e8f5f0';
  const btnColor = isPreview ? '#6d28d9' : '#0f6e56';
  const btnLabel = isPreview ? 'Débloquer' : 'Rapport';

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .simple-desktop { display: none !important; }
          .simple-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .simple-mobile { display: none !important; }
        }
      `}</style>

      {/* Desktop */}
      <div className="simple-desktop"
        style={{
          display: 'flex', alignItems: 'center', gap: 12, background: selected ? '#f0f7fb' : '#fff',
          borderRadius: 11, border: `1.5px solid ${selected ? COLORS.teal : '#edf2f7'}`, padding: '12px 14px',
          opacity: isPreview ? 0.65 : 1, transition: 'all 0.18s', cursor: selectionMode ? 'pointer' : 'default',
          boxShadow: selected ? '0 0 0 2px rgba(42,125,156,0.1)' : 'none',
        }}
        onClick={() => { if (selectionMode) onToggleSelect(a.id); }}
        onMouseOver={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.borderColor = '#d0e6ef'; }}
        onMouseOut={e => { if (!selectionMode) (e.currentTarget as HTMLElement).style.borderColor = selected ? COLORS.teal : '#edf2f7'; }}
      >
        {selectionMode && (
          <div onClick={e => { e.stopPropagation(); onToggleSelect(a.id); }} style={{ flexShrink: 0, cursor: 'pointer' }}>
            {selected ? <CheckSquare size={18} color={COLORS.teal} /> : <Square size={18} color="#cbd5e1" />}
          </div>
        )}
        <div style={{ width: 34, height: 34, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isPreview ? <Eye size={14} style={{ color: iconStroke }} /> : <FileText size={14} style={{ color: iconStroke }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayTitle}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{isPreview ? 'Aperçu' : '1 document'} · {a.date}</div>
        </div>
        {a.status === 'processing' ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: COLORS.teal, background: 'rgba(42,125,156,0.07)', padding: '5px 11px', borderRadius: 8, whiteSpace: 'nowrap' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.teal, display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
            En cours…
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            {isPreview && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: COLORS.amberBg, color: '#92400e', border: `1px solid ${COLORS.amberBorder}` }}>Aperçu</span>}
            <Link to={`/dashboard/rapport?id=${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 13px', borderRadius: 8, background: btnBg, fontSize: 12, fontWeight: 700, color: btnColor, textDecoration: 'none', whiteSpace: 'nowrap', border: 'none' }}>
              {isPreview ? <Eye size={11} /> : <ExternalLink size={11} />} {btnLabel}
            </Link>
            {!selectionMode && !confirmDelete && (
              <button onClick={() => setConfirmDelete(true)} style={{ width: 30, height: 30, borderRadius: 7, background: COLORS.redBg, border: `1px solid ${COLORS.redBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Trash2 size={11} color={COLORS.red} />
              </button>
            )}
            {!selectionMode && confirmDelete && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 8, background: COLORS.redBg, border: `1px solid ${COLORS.redBorder}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.red }}>Supprimer ?</span>
                <button onClick={() => onDelete(a.id)} style={{ padding: '3px 8px', borderRadius: 5, background: COLORS.red, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Oui</button>
                <button onClick={() => setConfirmDelete(false)} style={{ padding: '3px 6px', borderRadius: 5, background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Non</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="simple-mobile"
        style={{ display: 'none', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 11, border: '1.5px solid #edf2f7', padding: '11px 12px', opacity: isPreview ? 0.65 : 1 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isPreview ? <Eye size={13} style={{ color: iconStroke }} /> : <FileText size={13} style={{ color: iconStroke }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shortTitle}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{isPreview ? 'Aperçu' : '1 doc'} · {a.date}</div>
        </div>
        {a.status !== 'processing' && (
          <Link to={`/dashboard/rapport?id=${a.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, background: btnBg, textDecoration: 'none' }}>
            <ExternalLink size={12} style={{ color: btnColor }} />
          </Link>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   PAGE PRINCIPALE — MES ANALYSES
═══════════════════════════════════════════ */
export default function MesAnalyses() {
  const { analyses, loading, refetch } = useAnalyses();
  const [search, setSearch] = useState('');
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
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const exitSelectionMode = () => { setSelectionMode(false); setSelectedIds(new Set()); setConfirmBulkDelete(false); };

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
    const text = (a.adresse_bien || a.nom_document || '').toLowerCase();
    return text.includes(search.toLowerCase());
  });

  // 3 sections séparées
  const completes = filtered.filter(a => a.type === 'complete' && !a.is_preview);
  const simples = filtered.filter(a => a.type === 'document' && !a.is_preview);
  const apercus = filtered.filter(a => a.is_preview === true);

  const allFiltered = [...completes, ...simples, ...apercus];
  const allSelected = allFiltered.length > 0 && selectedIds.size === allFiltered.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(allFiltered.map(a => a.id)));
  };

  if (loading) return <DashboardLoader message="Chargement de vos analyses…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .complete-desktop { display: none !important; }
          .complete-mobile { display: flex !important; }
        }
        @media (min-width: 641px) {
          .complete-mobile { display: none !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>{analyses.length} analyse{analyses.length > 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {!selectionMode ? (
            <>
              {allFiltered.length > 1 && (
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
                  style={{ padding: '9px 16px', borderRadius: 10, border: `1.5px solid ${COLORS.redBorder}`, background: COLORS.redBg, color: COLORS.red, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Trash2 size={14} /> Supprimer ({selectedIds.size})
                </button>
              )}
              {confirmBulkDelete && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: COLORS.redBg, border: `1.5px solid ${COLORS.redBorder}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.red }}>Supprimer {selectedIds.size} analyse{selectedIds.size > 1 ? 's' : ''} ?</span>
                  <button onClick={deleteSelected} disabled={deleting} style={{ padding: '4px 12px', borderRadius: 7, background: COLORS.red, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{deleting ? '…' : 'Confirmer'}</button>
                  <button onClick={() => setConfirmBulkDelete(false)} style={{ padding: '4px 10px', borderRadius: 7, background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Non</button>
                </div>
              )}
              <button onClick={exitSelectionMode} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #edf2f7', background: '#f8fafc', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── RECHERCHE ── */}
      {!selectionMode && (
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une adresse ou un document…"
            style={{ width: '100%', padding: '10px 14px 10px 37px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' as const, color: '#0f172a' }} />
        </div>
      )}

      {/* ═══ SECTION 1 — ANALYSES COMPLÈTES ═══ */}
      {completes.length > 0 && (
        <div>
          <SectionHeader label="Analyses complètes" count={completes.length} color={COLORS.navy} />
          <div className="complete-desktop" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 10 }}>
            {completes.map(a => (
              <CompleteCardDesktop key={a.id} a={a} onDelete={deleteAnalyse} selected={selectedIds.has(a.id)} onToggleSelect={toggleSelect} selectionMode={selectionMode} />
            ))}
          </div>
          <div className="complete-mobile" style={{ display: 'none', flexDirection: 'column', gap: 10 }}>
            {completes.map(a => (
              <CompleteCardMobile key={a.id} a={a} onDelete={deleteAnalyse} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ SECTION 2 — ANALYSES SIMPLES ═══ */}
      {simples.length > 0 && (
        <div>
          {completes.length > 0 && <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0 18px' }} />}
          <SectionHeader label="Analyses simples" count={simples.length} color={COLORS.teal} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {simples.map(a => (
              <SimpleRow key={a.id} a={a} onDelete={deleteAnalyse} selectionMode={selectionMode} selected={selectedIds.has(a.id)} onToggleSelect={toggleSelect} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ SECTION 3 — APERÇUS ═══ */}
      {apercus.length > 0 && (
        <div>
          {(completes.length > 0 || simples.length > 0) && <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0 18px' }} />}
          <SectionHeader label="Aperçus" count={apercus.length} color="#d97706" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {apercus.map(a => (
              <SimpleRow key={a.id} a={a} onDelete={deleteAnalyse} isPreview selectionMode={selectionMode} selected={selectedIds.has(a.id)} onToggleSelect={toggleSelect} />
            ))}
          </div>
        </div>
      )}

      {/* ── EMPTY STATE ── */}
      {allFiltered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 18, border: '2px dashed #e2e8f0', padding: '48px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>
            {search ? 'Aucune analyse ne correspond à votre recherche.' : 'Vous n\'avez pas encore d\'analyse. Lancez-en une !'}
          </p>
          {!search && (
            <Link to="/dashboard/nouvelle-analyse" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              <Plus size={14} /> Nouvelle analyse
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
