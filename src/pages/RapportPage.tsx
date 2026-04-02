import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchAnalyseById } from '../lib/analyses';
import {
  ChevronLeft, Download, Building2, TrendingUp, Wrench,
  AlertTriangle, CheckCircle, Shield, BarChart2, FileText,
  Clock, Euro, HardHat, Gavel, Info, Star, Paperclip, RefreshCw, Lock
} from 'lucide-react';

/* ══════════════════════════════════════════
   MOCK RAPPORT — sera remplacé par Supabase
══════════════════════════════════════════ */
const MOCK_RAPPORT = {
  id: '1',
  type: 'complete' as const,
  adresse: '12 rue de la Paix, 75002 Paris',
  date: '24 mars 2026',
  score: 8.2,
  recommandation: 'Acheter' as 'Acheter' | 'Négocier' | 'Risqué' | 'Déconseillé',

  // Vue d'ensemble
  resume: "Appartement en bon état général situé dans une copropriété bien gérée. Le PV d'AG 2025 montre une gestion saine avec un fonds de travaux bien provisionné. Les charges sont raisonnables pour le secteur. Quelques points de vigilance à prendre en compte avant l'achat.",
  points_forts: [
    "Fonds de travaux bien provisionné (42 000€ disponibles)",
    "Charges mensuelles raisonnables pour Paris 2e (180€/mois)",
    "Copropriété bien gérée, syndic réactif",
    "DPE classé C — bon pour la valeur future",
    "Aucun impayé de charges sur les 2 dernières années",
  ],
  points_vigilance: [
    "Ravalement de façade voté en AG 2025 — appel de charges estimé à ~8 000€",
    "2 lots en situation d'impayés (inférieurs à 6 mois)",
    "Ascenseur à remettre aux normes avant fin 2027",
  ],
  avis_verimo: "Ce bien présente un excellent profil d'investissement. La copropriété est saine et bien gérée. Notre recommandation est d'acheter en intégrant le coût du ravalement dans votre négociation — une demande de réduction de 5 000 à 8 000€ est justifiée et argumentable.",

  // Financier
  charges_mensuelles: 180,
  charges_annuelles: 2160,
  fonds_travaux: 42000,
  appels_charges_votes: [
    { label: 'Ravalement façade (voté AG 2025)', montant: 8000, echeance: '2026' },
    { label: 'Remplacement chaudière collective', montant: 1200, echeance: '2025' },
  ],
  impact_financier: "Sur 10 ans, les charges prévisionnelles représentent environ 29 600€ (charges courantes + travaux votés). À intégrer dans votre plan de financement.",
  risques_financiers: "Risque modéré. Le ravalement de 8 000€ est le principal poste à anticiper. Les impayés en copropriété restent faibles et ne compromettent pas la trésorerie.",

  // Travaux
  travaux_realises: [
    { label: 'Réfection toiture', annee: '2021', montant: 35000 },
    { label: 'Mise aux normes électriques parties communes', annee: '2022', montant: 12000 },
    { label: 'Ravalement cour intérieure', annee: '2023', montant: 18000 },
  ],
  travaux_votes: [
    { label: 'Ravalement façade principale', annee: '2026', montant: 8000, statut: 'Voté' },
    { label: 'Ascenseur mise aux normes', annee: '2027', montant: 4500, statut: 'Voté' },
  ],
  travaux_a_prevoir: [
    { label: 'Remplacement boîtes aux lettres', annee: '2028', montant: 800, statut: 'Estimé' },
    { label: 'Réfection hall d\'entrée', annee: '2029', montant: 6000, statut: 'Estimé' },
  ],

  // Procédures
  document_names: [] as string[],
  regeneration_deadline: null as string | null,
  is_preview: false,
  procedures_en_cours: true,
  procedures: [
    {
      type: 'Impayés de charges',
      statut: 'En cours',
      severite: 'faible' as 'faible' | 'moyenne' | 'elevee',
      detail: "2 copropriétaires en situation d'impayés. Montants inférieurs à 3 mois de charges. Recouvrement amiable en cours par le syndic.",
      impact: "Impact limité sur la trésorerie. Surveillance recommandée.",
    },
  ],
};

/* ══════════════════════════════════════════
   COMPOSANTS UTILITAIRES
══════════════════════════════════════════ */
function ScoreGauge({ score }: { score: number }) {
  const color = score >= 7.5 ? '#16a34a' : score >= 5 ? '#d97706' : '#dc2626';
  const r = 54, circ = 2 * Math.PI * r;
  const dash = (score / 10) * circ;
  const label = score >= 7.5 ? 'Excellent' : score >= 6 ? 'Bon' : score >= 5 ? 'Moyen' : 'Risqué';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="140" height="140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 1s ease' }}/>
        <text x="70" y="62" textAnchor="middle" fontSize="30" fontWeight="900" fill={color}>{score.toFixed(1)}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="13" fill="#94a3b8" fontWeight="600">/10</text>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}25`, padding: '3px 12px', borderRadius: 100 }}>
        {label}
      </span>
    </div>
  );
}

function RecoBadge({ reco }: { reco: string }) {
  const map: Record<string, { color: string; bg: string; border: string; icon: string }> = {
    'Acheter':     { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', icon: '✓' },
    'Négocier':    { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '↔' },
    'Risqué':      { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '⚠' },
    'Déconseillé': { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: '✕' },
  };
  const s = map[reco] || map['Négocier'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: s.bg, border: `3px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: s.color, fontWeight: 900 }}>
        {s.icon}
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{reco}</div>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>RECOMMANDATION</div>
    </div>
  );
}

function SectionCard({ title, icon, color = '#2a7d9c', children }: { title: string; icon: React.ReactNode; color?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf2f7', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, background: `${color}06` }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</span>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function StatBox({ label, value, sub, color = '#0f172a' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #edf2f7', textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 900, color, letterSpacing: '-0.02em', marginBottom: 3 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Bullet({ text, color = '#16a34a', icon }: { text: string; color?: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${color}12`, border: `1.5px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, color }}>
        {icon}
      </div>
      <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.55 }}>{text}</span>
    </div>
  );
}

function SeveriteBadge({ sev }: { sev: 'faible' | 'moyenne' | 'elevee' }) {
  const map = {
    faible:  { label: 'Faible',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    moyenne: { label: 'Moyenne', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    elevee:  { label: 'Élevée',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  };
  const s = map[sev];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: 100 }}>
      {s.label}
    </span>
  );
}

/* ══════════════════════════════════════════
   ONGLETS
══════════════════════════════════════════ */
type TabId = 'overview' | 'financier' | 'travaux' | 'procedures';

const TABS: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'overview',   label: 'Vue d\'ensemble', icon: <BarChart2 size={15}/>,   color: '#2a7d9c' },
  { id: 'financier',  label: 'Financier',        icon: <Euro size={15}/>,        color: '#16a34a' },
  { id: 'travaux',    label: 'Travaux',           icon: <HardHat size={15}/>,     color: '#d97706' },
  { id: 'procedures', label: 'Procédures',        icon: <Gavel size={15}/>,       color: '#dc2626' },
];

/* ══════════════════════════════════════════
   PAGE RAPPORT
══════════════════════════════════════════ */
export default function RapportPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [rapport, setRapport] = useState<(typeof MOCK_RAPPORT & { type: 'complete' | 'document' }) | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!id) { setRapport(MOCK_RAPPORT); setLoading(false); return; }
      const data = await fetchAnalyseById(id);
      if (!data || !data.result) { setRapport(MOCK_RAPPORT); setLoading(false); return; }
      const r = data.result as Record<string, unknown>;
      // Mapper les données Supabase vers le format rapport
      const mappedType = (data.type === 'pack2' || data.type === 'pack3' ? 'complete' : data.type) as 'document' | 'complete';
      setRapport({
        id: data.id,
        type: mappedType as 'complete',
        adresse: (r.titre as string) || data.title,
        date: new Date(data.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }),
        score: (r.score as number) || 0,
        recommandation: (r.recommandation as 'Acheter'|'Négocier'|'Risqué'|'Déconseillé') || 'Négocier',
        resume: (r.resume as string) || '',
        points_forts: (r.points_forts as string[]) || [],
        points_vigilance: (r.points_vigilance as string[]) || [],
        avis_verimo: (r.avis_verimo as string) || '',
        charges_mensuelles: (r.charges_mensuelles as number) || 0,
        charges_annuelles: ((r.charges_mensuelles as number) || 0) * 12,
        fonds_travaux: (r.fonds_travaux as number) || 0,
        appels_charges_votes: (r.appels_charges_votes as typeof MOCK_RAPPORT.appels_charges_votes) || [],
        impact_financier: (r.impact_financier as string) || '',
        risques_financiers: (r.risques_financiers as string) || '',
        travaux_realises: (r.travaux_realises as typeof MOCK_RAPPORT.travaux_realises) || [],
        travaux_votes: (r.travaux_votes as typeof MOCK_RAPPORT.travaux_votes) || [],
        travaux_a_prevoir: (r.travaux_a_prevoir as typeof MOCK_RAPPORT.travaux_a_prevoir) || [],
        procedures_en_cours: (r.procedures_en_cours as boolean) || false,
        procedures: (r.procedures as typeof MOCK_RAPPORT.procedures) || [],
        document_names: (data.document_names as string[]) || [],
        regeneration_deadline: data.regeneration_deadline || null,
        is_preview: data.is_preview ?? false,
      });
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f9fb', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:56, height:56, borderRadius:'50%', border:'3px solid #edf2f7', borderTopColor:'#2a7d9c', animation:'spin 0.9s linear infinite', margin:'0 auto 16px' }}/>
        <p style={{ fontSize:14, color:'#94a3b8', fontWeight:600 }}>Chargement du rapport…</p>
      </div>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  if (!rapport) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f9fb' }}>
      <p style={{ fontSize:14, color:'#94a3b8' }}>Rapport introuvable.</p>
    </div>
  );

  const isComplete = rapport.type === 'complete';
  const scoreColor = rapport.score >= 7.5 ? '#16a34a' : rapport.score >= 5 ? '#d97706' : '#dc2626';

  const handlePDF = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Topbar rapport */}
      <header style={{ background: '#fff', borderBottom: '1px solid #edf2f7', position: 'sticky', top: 0, zIndex: 40, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link to="/dashboard/analyses" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b', textDecoration: 'none', flexShrink: 0 }}
          onMouseOver={e => (e.currentTarget.style.color = '#0f172a')}
          onMouseOut={e => (e.currentTarget.style.color = '#64748b')}>
          <ChevronLeft size={16}/> Mes analyses
        </Link>

        <div style={{ width: 1, height: 20, background: '#edf2f7', flexShrink: 0 }}/>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={14} style={{ color: '#94a3b8', flexShrink: 0 }}/>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rapport.adresse}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Analysé le {rapport.date}</div>
        </div>

        {/* Score mini dans topbar */}
        {isComplete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, background: `${scoreColor}0d`, border: `1.5px solid ${scoreColor}22`, flexShrink: 0 }}>
            <Star size={13} style={{ color: scoreColor }}/>
            <span style={{ fontSize: 15, fontWeight: 900, color: scoreColor }}>{rapport.score}/10</span>
          </div>
        )}

        <button onClick={handlePDF}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,45,61,0.2)', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Download size={14}/> Télécharger PDF
        </button>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── Hero rapport */}
        {isComplete && (
          <div style={{ background: 'linear-gradient(135deg, #0f2d3d 0%, #1a5068 100%)', borderRadius: 22, padding: '32px 36px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }}/>
            <div style={{ position: 'absolute', bottom: -30, left: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }}/>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
              <ScoreGauge score={rapport.score}/>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em', marginBottom: 8 }}>RAPPORT ANALYMO — ANALYSE COMPLÈTE</div>
                <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.25 }}>{rapport.adresse}</h1>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 18 }}>Analysé le {rapport.date}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <RecoBadge reco={rapport.recommandation}/>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rapport simple (document) — pas de hero */}
        {!isComplete && (
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf2f7', padding: '24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={24} style={{ color: '#2a7d9c' }}/>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 4 }}>ANALYSE DOCUMENT</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{rapport.adresse}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Analysé le {rapport.date}</div>
            </div>
          </div>
        )}

        {/* ── Onglets */}
        {isComplete && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#fff', padding: '6px', borderRadius: 14, border: '1px solid #edf2f7', flexWrap: 'wrap' }}>
            {TABS.map(tab => {
              // Masquer procédures si aucune
              if (tab.id === 'procedures' && !rapport.procedures_en_cours) return null;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, minWidth: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 16px', borderRadius: 10, border: 'none', background: active ? `${tab.color}0e` : 'transparent', color: active ? tab.color : '#64748b', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', borderBottom: active ? `2px solid ${tab.color}` : '2px solid transparent' }}>
                  {tab.icon} {tab.label}
                  {tab.id === 'procedures' && rapport.procedures_en_cours && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }}/>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ══ VUE D'ENSEMBLE ══ */}
        {(activeTab === 'overview' || !isComplete) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Résumé */}
            <SectionCard title="Résumé" icon={<Info size={16}/>} color="#2a7d9c">
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{rapport.resume}</p>
            </SectionCard>

            {/* Points forts + vigilance */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <SectionCard title="Points forts" icon={<CheckCircle size={16}/>} color="#16a34a">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rapport.points_forts.map((p, i) => (
                    <Bullet key={i} text={p} color="#16a34a" icon={<CheckCircle size={10}/>}/>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Points de vigilance" icon={<AlertTriangle size={16}/>} color="#d97706">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rapport.points_vigilance.map((p, i) => (
                    <Bullet key={i} text={p} color="#d97706" icon={<AlertTriangle size={10}/>}/>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Avis Analymo */}
            <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius: 18, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Shield size={16} style={{ color: '#5bb8d4' }}/>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>AVIS ANALYMO</span>
                </div>
                <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.8, fontWeight: 500 }}>{rapport.avis_verimo}</p>
              </div>
            </div>
          </div>
        )}

        {/* ══ FINANCIER ══ */}
        {activeTab === 'financier' && isComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Stats charges */}
            <SectionCard title="Charges de copropriété" icon={<Euro size={16}/>} color="#16a34a">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                <StatBox label="Mensuel" value={`${rapport.charges_mensuelles}€`} color="#16a34a"/>
                <StatBox label="Annuel" value={`${rapport.charges_annuelles.toLocaleString()}€`} color="#0f172a"/>
                <StatBox label="Fonds travaux" value={`${(rapport.fonds_travaux/1000).toFixed(0)}k€`} sub="Disponibles" color="#2a7d9c"/>
              </div>
              <div style={{ padding: '14px 16px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #dcfce7' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.08em', marginBottom: 6 }}>ANALYSE ANALYMO</div>
                <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>{rapport.impact_financier}</p>
              </div>
            </SectionCard>

            {/* Appels de charges votés */}
            <SectionCard title="Appels de charges votés" icon={<Clock size={16}/>} color="#d97706">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rapport.appels_charges_votes.map((ac, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0 }}/>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>{ac.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>Échéance {ac.echeance}</span>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#d97706' }}>~{ac.montant.toLocaleString()}€</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Risques financiers */}
            <SectionCard title="Risques financiers" icon={<TrendingUp size={16}/>} color="#dc2626">
              <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7 }}>{rapport.risques_financiers}</p>
            </SectionCard>
          </div>
        )}

        {/* ══ TRAVAUX ══ */}
        {activeTab === 'travaux' && isComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Travaux réalisés */}
            <SectionCard title="Travaux réalisés" icon={<CheckCircle size={16}/>} color="#16a34a">
              {rapport.travaux_realises.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rapport.travaux_realises.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #dcfce7', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle size={14} style={{ color: '#16a34a', flexShrink: 0 }}/>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Réalisé en {t.annee}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{t.montant.toLocaleString()}€</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun travaux réalisé détecté dans les documents.</p>
              )}
            </SectionCard>

            {/* Travaux votés */}
            <SectionCard title="Travaux votés à venir" icon={<Wrench size={16}/>} color="#d97706">
              {rapport.travaux_votes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rapport.travaux_votes.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0 }}/>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>{t.label}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Prévu en {t.annee}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a', padding: '1px 7px', borderRadius: 100 }}>{t.statut}</span>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#d97706' }}>~{t.montant.toLocaleString()}€</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun travaux voté détecté dans les documents.</p>
              )}
            </SectionCard>

            {/* Travaux à prévoir */}
            <SectionCard title="Travaux estimés (non votés)" icon={<HardHat size={16}/>} color="#64748b">
              {rapport.travaux_a_prevoir.length > 0 ? (
                <>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Info size={13} style={{ color: '#94a3b8', flexShrink: 0 }}/>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Ces travaux sont estimés par Analymo sur la base des documents analysés. Ils ne sont pas encore votés en AG.</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rapport.travaux_a_prevoir.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <HardHat size={14} style={{ color: '#64748b', flexShrink: 0 }}/>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t.label}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>Horizon {t.annee}</span>
                              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '1px 7px', borderRadius: 100 }}>{t.statut}</span>
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#64748b' }}>~{t.montant.toLocaleString()}€</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun travaux supplémentaire estimé.</p>
              )}
            </SectionCard>
          </div>
        )}

        {/* ══ PROCÉDURES ══ */}
        {activeTab === 'procedures' && isComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {rapport.procedures_en_cours ? (
              <>
                <div style={{ padding: '14px 18px', background: '#fef2f2', borderRadius: 13, border: '1.5px solid #fecaca', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }}/>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
                    {rapport.procedures.length} procédure{rapport.procedures.length > 1 ? 's' : ''} en cours détectée{rapport.procedures.length > 1 ? 's' : ''} dans les documents.
                  </span>
                </div>

                {rapport.procedures.map((proc, i) => (
                  <SectionCard key={i} title={proc.type} icon={<Gavel size={16}/>} color="#dc2626">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Statut :</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '2px 10px', borderRadius: 100 }}>{proc.statut}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginLeft: 8 }}>Sévérité :</span>
                      <SeveriteBadge sev={proc.severite}/>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 6 }}>DÉTAIL</div>
                      <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7 }}>{proc.detail}</p>
                    </div>
                    <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', letterSpacing: '0.08em', marginBottom: 5 }}>IMPACT SUR VOTRE ACQUISITION</div>
                      <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>{proc.impact}</p>
                    </div>
                  </SectionCard>
                ))}
              </>
            ) : (
              <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf2f7', padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={28} style={{ color: '#16a34a' }}/>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Aucune procédure en cours</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>Aucune procédure judiciaire ou litige n'a été détecté dans les documents analysés.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Bannière 7 jours (rapport complet non preview) */}
        {isComplete && !rapport.is_preview && rapport.regeneration_deadline && (() => {
          const deadline = new Date(rapport.regeneration_deadline);
          const now = new Date();
          const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const expired = diffDays <= 0;
          const urgent = diffDays <= 2 && !expired;
          return (
            <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 14, background: expired ? '#f8fafc' : urgent ? '#fffbeb' : '#f0fdf4', border: `1.5px solid ${expired ? '#e2e8f0' : urgent ? '#fde68a' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <RefreshCw size={16} style={{ color: expired ? '#94a3b8' : urgent ? '#d97706' : '#16a34a', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: expired ? '#94a3b8' : urgent ? '#92400e' : '#166534', marginBottom: 2 }}>
                  {expired ? 'Délai de complétion expiré' : `Vous pouvez compléter ce dossier — encore ${diffDays} jour${diffDays > 1 ? 's' : ''}`}
                </div>
                <div style={{ fontSize: 12, color: expired ? '#cbd5e1' : '#64748b' }}>
                  {expired ? 'Le délai de 7 jours pour ajouter des documents est dépassé.' : 'Ajoutez des documents oubliés et obtenez un rapport mis à jour — gratuitement.'}
                </div>
              </div>
              {!expired ? (
                <button
                  onClick={() => window.location.href = `/dashboard/rapport?id=${id}&action=complement`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: urgent ? '#d97706' : '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <RefreshCw size={13} /> Compléter le dossier
                </button>
              ) : (
                <button disabled style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Lock size={13} /> Délai expiré
                </button>
              )}
            </div>
          );
        })()}

        {/* ── Section documents analysés */}
        {rapport.document_names && rapport.document_names.length > 0 && (
          <div style={{ marginTop: 16, padding: '16px 20px', background: '#fff', borderRadius: 14, border: '1px solid #edf2f7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Paperclip size={14} style={{ color: '#94a3b8' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>DOCUMENTS ANALYSÉS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rapport.document_names.map((name: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                  <FileText size={12} style={{ color: '#2a7d9c', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{name}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Shield size={11} /> Ces documents ne sont plus stockés sur nos serveurs, conformément à notre politique RGPD.
            </p>
          </div>
        )}

        {/* Footer rapport */}
        <div style={{ marginTop: 16, padding: '16px 20px', background: '#fff', borderRadius: 13, border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Shield size={14} style={{ color: '#94a3b8', flexShrink: 0 }}/>
          <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
            Ce rapport est fourni à titre informatif par Analymo. Il ne constitue pas un conseil juridique ou financier et ne remplace pas l'avis d'un notaire ou d'un expert immobilier.
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#cbd5e1', flexShrink: 0 }}>Rapport #{id}</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          header { display: none !important; }
          body { background: white !important; }
          button { display: none !important; }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
