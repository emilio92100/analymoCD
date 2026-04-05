import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight, Plus, Sparkles, ArrowRight, Building2, ExternalLink, Info, Star, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../hooks/useUser';
import { useAnalyses, type Analyse } from '../../hooks/useAnalyses';
import { useCredits } from '../../hooks/useCredits';

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
          <span>·</span><span>{a.date}</span><span>·</span><span style={{ fontWeight: 700, color: '#64748b' }}>{a.price}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {a.status === 'processing' ? (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', background: 'rgba(42,125,156,0.07)', padding: '4px 10px', borderRadius: 7 }}>En cours…</span>
        ) : (
          <>
            {isComplete && a.score != null && <ScoreBadge score={a.score} />}
            {a.recommandation && <span style={{ fontSize: 11, fontWeight: 700, color: a.recommandationColor, background: `${a.recommandationColor}10`, border: `1px solid ${a.recommandationColor}22`, padding: '4px 9px', borderRadius: 7, whiteSpace: 'nowrap' }}>{a.recommandation}</span>}
            <Link to={`/dashboard/rapport?id=${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', fontSize: 12, fontWeight: 700, color: '#2a7d9c', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s' }} onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#e8f4f8'} onMouseOut={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}>
              <ExternalLink size={11} /> Rapport
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function GlossaireBlock() {
  const [open, setOpen] = useState<number | null>(null);
  const termes = [
    { t: "PV d'AG", d: "Procès-verbal d'Assemblée Générale — compte-rendu officiel des décisions votées par les copropriétaires lors de leur réunion annuelle. Contient les travaux votés, les charges, les litiges." },
    { t: "DPE", d: "Diagnostic de Performance Énergétique — note de A (très économe) à G (très énergivore) évaluant la consommation d'énergie du logement. Un DPE F ou G peut impacter la valeur et la revente." },
    { t: "Fonds de travaux", d: "Somme mise de côté chaque année par la copropriété pour financer les futurs travaux importants. Un fonds bien provisionné est rassurant pour l'acheteur." },
    { t: "Charges de copropriété", d: "Frais mensuels ou trimestriels payés par chaque copropriétaire pour l'entretien des parties communes (ascenseur, jardins, gardien, etc.)." },
    { t: "Règlement de copropriété", d: "Document juridique définissant les règles de vie dans la copropriété, la répartition des charges et l'usage des parties communes et privatives." },
    { t: "Appel de charges", d: "Document envoyé par le syndic demandant le paiement des charges de copropriété. Permet de vérifier le montant réel des charges courantes." },
  ];
  return (
    <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Info size={14} style={{ color: '#fff' }} /></div>
        <div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Glossaire immobilier</div><div style={{ fontSize: 11, color: '#94a3b8' }}>6 termes clés expliqués simplement</div></div>
      </div>
      {termes.map((terme, i) => (
        <div key={i} style={{ borderBottom: i < termes.length - 1 ? '0.5px solid #edf2f7' : 'none' }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{terme.t}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ color: '#94a3b8', flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
          </button>
          {open === i && <div style={{ padding: '0 18px 14px', fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{terme.d}</div>}
        </div>
      ))}
    </div>
  );
}

function NoteExplicativeBlock({ penalties, bonuses, scale }: {
  penalties: { cat: string; items: { l: string; v: string }[] }[];
  bonuses: { l: string; v: string }[];
  scale: { r: string; l: string; c: string; bg: string }[];
}) {
  const [activeTab, setActiveTab] = useState<'bonus' | 'penalites' | 'echelle'>('bonus');
  const tabs = [{ id: 'bonus' as const, label: '✓ Bonus' }, { id: 'penalites' as const, label: '− Pénalités' }, { id: 'echelle' as const, label: '📊 Échelle' }];
  return (
    <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#0f2d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Star size={18} style={{ color: '#fff' }} /></div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>Découvrez comment nous calculons la note /20</div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>Transparence totale sur notre méthode de calcul</div>
        </div>
      </div>
      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#f0f7fb', borderRadius: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#2a7d9c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, flexShrink: 0 }}>20</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>Note sur 20 points</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>On démarre toujours de la note maximale. Notre outil retire des points selon les risques détectés dans vos documents, et en ajoute pour les points positifs.</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, padding: '4px', background: '#f8fafc', borderRadius: 12 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: 'none', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#0f172a' : '#94a3b8', fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500, cursor: 'pointer', boxShadow: activeTab === tab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>{tab.label}</button>
          ))}
        </div>
        {activeTab === 'bonus' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Ces éléments <strong>ajoutent</strong> des points à la note finale :</div>
            <div style={{ background: '#fff', border: '0.5px solid #edf2f7', borderRadius: 10, overflow: 'hidden' }}>
              {bonuses.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: i > 0 ? '0.5px solid #edf2f7' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#374151' }}>{b.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '3px 10px', borderRadius: 6 }}>{b.v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'penalites' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Ces éléments <strong>retirent</strong> des points à la note finale :</div>
            {penalties.map((p, i) => (
              <div key={i} style={{ background: '#fff', border: '0.5px solid #edf2f7', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '7px 14px', background: '#fef2f2', fontSize: 11, fontWeight: 700, color: '#dc2626', letterSpacing: '0.04em' }}>{p.cat.toUpperCase()}</div>
                {p.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderTop: '0.5px solid #edf2f7' }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{item.l}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '3px 10px', borderRadius: 6 }}>{item.v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {activeTab === 'echelle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Comment interpréter votre note :</div>
            {scale.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, background: s.bg }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: s.c }}>{s.r}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.c }}>{s.l}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 10, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
          La note est arrondie au 0,5 près et établie uniquement à partir des documents fournis. Elle ne remplace pas une visite du bien ni l&apos;avis d&apos;un professionnel.
        </div>
      </div>
    </div>
  );
}

export default function HomeView() {
  const { name } = useUser();
  const { analyses } = useAnalyses();
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
  const completedComplete = analyses.filter(a => a.type === 'complete' && a.status === 'completed' && a.score != null);
  const avgScore = completedComplete.length > 0 ? (completedComplete.reduce((s, a) => s + (a.score || 0), 0) / completedComplete.length).toFixed(1) : null;

  const penalties = [
    { cat: 'Travaux', items: [{ l: 'Gros travaux évoqués non votés', v: '-2 à -3' }, { l: 'Travaux urgents non anticipés', v: '-3 à -4' }] },
    { cat: 'Procédures', items: [{ l: 'Copro vs syndic', v: '-2 à -4' }, { l: 'Copro vs copropriétaire', v: '-0,5 à -1' }, { l: 'Copropriété en difficulté', v: '-3 à -4' }] },
    { cat: 'Finances', items: [{ l: 'Écart budget >30%', v: '-3' }, { l: 'Écart budget 15-30%', v: '-2' }, { l: 'Fonds travaux nul', v: '-2' }, { l: 'Impayés charges', v: '-1 à -2' }] },
    { cat: 'Diagnostics privatifs', items: [{ l: 'DPE F (résidence principale)', v: '-2' }, { l: 'DPE G (résidence principale)', v: '-3' }, { l: 'DPE F (investissement)', v: '-4' }, { l: 'DPE G (investissement)', v: '-6' }, { l: 'Électricité anomalies majeures', v: '-2' }, { l: 'Amiante accessible dégradé', v: '-2' }, { l: 'Termites non traités', v: '-2' }] },
    { cat: 'Diagnostics communs', items: [{ l: 'Amiante parties communes dégradé', v: '-2' }, { l: 'Termites parties communes non traités', v: '-2' }] },
  ];
  const bonuses = [
    { l: 'Travaux votés (à la charge du vendeur)', v: '+0,5 à +1' }, { l: 'Garantie décennale sur travaux récents', v: '+0,5 à +1' },
    { l: 'Fonds travaux conforme au minimum légal', v: '+0,5' }, { l: 'Fonds travaux au-dessus du minimum légal', v: '+1' },
    { l: 'Certificat entretien chaudière/ramonage', v: '+0,5' }, { l: 'Immeuble bien entretenu', v: '+0,5' },
    { l: 'DPE A', v: '+1' }, { l: 'DPE B ou C', v: '+0,5' },
  ];
  const scale = [
    { r: '17 – 20', l: 'Bien irréprochable', c: '#15803d', bg: '#f0fdf4' }, { r: '14 – 16', l: 'Bien sain', c: '#16a34a', bg: '#f0fdf4' },
    { r: '10 – 13', l: 'Bien correct avec réserves', c: '#d97706', bg: '#fffbeb' }, { r: '7 – 9', l: 'Bien risqué', c: '#ea580c', bg: '#fff7ed' },
    { r: '0 – 6', l: 'Bien à éviter', c: '#dc2626', bg: '#fef2f2' },
  ];
  const tips = [
    { color: '#d97706', title: 'Points de vigilance', desc: "Un DPE classé F ou G peut impacter la valeur du bien. Les travaux votés en AG mais non réalisés sont à surveiller de près." },
    { color: '#16a34a', title: 'Documents à prioriser', desc: "PV d'AG, règlement de copropriété, DPE, diagnostic électricité et gaz, appels de charges — ce sont les docs les plus riches en informations." },
    { color: '#7c3aed', title: 'Vos rapports sont permanents', desc: 'Chaque rapport est sauvegardé définitivement dans votre espace. Consultez-le et téléchargez-le en PDF à tout moment.' },
    { color: '#dc2626', title: "Besoin d'aide ?", desc: "Notre équipe est disponible depuis la page Support pour toute question sur votre rapport ou l'utilisation de Verimo." },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.35s ease both' }}>
      <div>
        <h1 style={{ fontSize: 'clamp(26px,3vw,34px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 4 }}>{greeting}{name ? `, ${name}` : ''} 👋</h1>
        <p style={{ fontSize: 15, color: '#94a3b8' }}>{hasAnalyses ? 'Bienvenue sur votre espace Verimo.' : 'Bienvenue sur Verimo — lancez votre première analyse.'}</p>
      </div>

      {freePreviewUsedHome === false && credits.document === 0 && credits.complete === 0 && (
        <div style={{ background: '#0f2d3d', borderRadius: 16, padding: '22px 28px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(42,125,156,0.18)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'pulseGlow 2.5s ease-in-out infinite' }}><Sparkles size={24} style={{ color: '#fff' }} /></div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 4 }}>1 analyse offerte 🎁</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>Profitez d&apos;une analyse gratuite pour visualiser un aperçu du rapport et découvrir notre outil.</div>
            </div>
            <Link to="/dashboard/nouvelle-analyse" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 10, background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 800, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <ArrowRight size={14} /> En profiter
            </Link>
          </div>
        </div>
      )}

      {hasAnalyses && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }} className="stats-grid">
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>ANALYSES TOTALES</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 4 }}>{totalAnalyses}</div>
            {avgScore ? <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Note moyenne : {avgScore}/20</div> : <div style={{ fontSize: 12, color: '#94a3b8' }}>Aucune analyse complète</div>}
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '18px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 8 }}>DERNIÈRE ANALYSE</div>
            {lastAnalyse ? (<><div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{lastAnalyse.date}</div><div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastAnalyse.type === 'complete' ? lastAnalyse.adresse_bien : lastAnalyse.nom_document}</div></>) : <div style={{ fontSize: 14, color: '#94a3b8' }}>Aucune encore</div>}
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

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Analyses récentes</h2>
          {hasAnalyses && <Link to="/dashboard/analyses" style={{ fontSize: 13, color: '#2a7d9c', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>Tout voir <ChevronRight size={14} /></Link>}
        </div>
        {!hasAnalyses ? (
          <div style={{ background: '#fff', borderRadius: 18, border: '2px dashed #e2e8f0', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(42,125,156,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Sparkles size={28} style={{ color: '#2a7d9c' }} /></div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Aucune analyse pour le moment</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>Déposez vos documents immobiliers et obtenez un rapport complet en moins de 2 minutes.</p>
            <Link to="/dashboard/nouvelle-analyse" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(15,45,61,0.2)' }}>
              <Plus size={15} /> Lancer ma première analyse
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{analyses.slice(0, 3).map(a => <AnalyseRow key={a.id} a={a} />)}</div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }} className="compare-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', overflow: 'hidden' }}>
            <div style={{ background: '#0f2d3d', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={14} style={{ color: '#fff' }} /></div>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Comment ça marche</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>4 étapes pour analyser votre bien</div></div>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { num: '1', title: 'Rassemblez vos documents', desc: "PV d'AG, règlement de copropriété, diagnostics, appels de charges — tout au même endroit." },
                { num: '2', title: 'Choisissez votre analyse', desc: 'Simple (4,90€) pour un document. Complète (19,90€) pour un rapport global avec note /20.' },
                { num: '3', title: 'Uploadez en quelques secondes', desc: 'Glissez-déposez vos fichiers PDF, Word ou images directement.' },
                { num: '4', title: 'Rapport prêt en 30 secondes', desc: 'Note /20, risques, travaux et recommandation personnalisée. Téléchargeable en PDF.' },
              ].map((step, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0f2d3d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800 }}>{step.num}</div>
                    {i < arr.length - 1 && <div style={{ width: 2, height: 20, background: '#e2e8f0', margin: '3px 0' }} />}
                  </div>
                  <div style={{ paddingBottom: i < arr.length - 1 ? 8 : 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{step.title}</div>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Conseils & astuces</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((tip, i) => (
                <div key={i} style={{ background: '#fff', borderLeft: `4px solid ${tip.color}`, borderTop: '0.5px solid #edf2f7', borderRight: '0.5px solid #edf2f7', borderBottom: '0.5px solid #edf2f7', borderRadius: '0 10px 10px 0', padding: '14px 18px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{tip.title}</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><span style={{ fontSize: 18 }}>💡</span><span style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>Conseil important Verimo</span></div>
            <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.7 }}>Plus vous fournissez de documents pour une analyse complète, plus la note /20 sera précise et le rapport détaillé.<br /><br />Idéalement : 3 derniers PV d&apos;AG + DPE + règlement de copropriété + appels de charges.</div>
          </div>
          <GlossaireBlock />
        </div>
      </div>

      <NoteExplicativeBlock penalties={penalties} bonuses={bonuses} scale={scale} />
    </div>
  );
}
