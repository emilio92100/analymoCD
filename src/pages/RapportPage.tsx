import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchAnalyseById } from '../lib/analyses';
import { supabase } from '../lib/supabase';
import {
  ChevronLeft, Download, Building2, TrendingUp, Wrench,
  AlertTriangle, CheckCircle, Shield, BarChart2, FileText,
  Euro, HardHat, Gavel, Info, Star, Paperclip, RefreshCw, Lock,
  ChevronDown, ChevronUp, TrendingDown
} from 'lucide-react';

/* ══════════════════════════════════════════
   MOCK RAPPORT — sera remplacé par Supabase
══════════════════════════════════════════ */
const MOCK_RAPPORT = {
  id: '1',
  type: 'complete' as const,
  adresse: '12 rue de la Paix, 75002 Paris',
  date: '24 mars 2026',
  score: 14.5,
  score_couleur: 'vert' as string,
  score_niveau: 'Bien sain' as string,
  type_bien: 'appartement' as string,
  profil: 'rp' as string,
  resume: "Appartement en bon état général situé dans une copropriété bien gérée. Le PV d'AG 2025 montre une gestion saine avec un fonds de travaux bien provisionné. Les charges sont raisonnables pour le secteur. Quelques points de vigilance à prendre en compte avant l'achat.",
  synthese_points_positifs: [
    "Fonds de travaux bien provisionné (42 000€ disponibles)",
    "Charges mensuelles raisonnables pour Paris 2e (180€/mois)",
    "Copropriété bien gérée, syndic réactif",
    "DPE classé C — bon pour la valeur future",
    "Aucun impayé de charges sur les 2 dernières années",
  ],
  synthese_points_vigilance: [
    "Ravalement de façade évoqué en AG 2025 mais non encore voté",
    "2 lots en situation d'impayés (inférieurs à 6 mois)",
  ],
  avis_verimo: "Ce bien présente un profil globalement satisfaisant. La copropriété est saine et bien gérée. Avant de vous engager, nous vous recommandons de vérifier l'avancement du ravalement évoqué en AG avec votre agent immobilier. Ce rapport est établi uniquement à partir des documents analysés et ne remplace pas l'avis d'un professionnel de l'immobilier.",
  categories: {
    travaux: { note: 4, note_max: 5, details: [{ label: 'Ravalement évoqué non voté', impact: 'negatif', message: 'Un ravalement a été évoqué sans avoir été voté. Si le vote intervient après votre acquisition, vous en supporterez une partie du coût.' }] },
    procedures: { note: 4, note_max: 4, details: [] },
    finances: { note: 3, note_max: 4, details: [{ label: 'Fonds travaux conforme', impact: 'positif', message: 'Le fonds travaux est conforme au minimum légal.' }] },
    diags_privatifs: { note: 2, note_max: 4, details: [{ label: 'DPE C', impact: 'positif', message: 'Bonne performance énergétique.' }] },
    diags_communs: { note: 1.5, note_max: 3, details: [] },
  },
  charges_mensuelles: 180,
  fonds_travaux: 42000,
  fonds_travaux_statut: 'conforme' as string,
  travaux_realises: [
    { label: 'Réfection toiture', annee: '2021', montant_estime: 35000, justificatif: true },
    { label: 'Mise aux normes électriques parties communes', annee: '2022', montant_estime: 12000, justificatif: true },
  ],
  travaux_votes: [
    { label: 'Ascenseur mise aux normes', annee: '2027', montant_estime: 4500, statut: 'Voté — à la charge du vendeur' },
  ],
  travaux_a_prevoir: [
    { label: 'Ravalement façade principale', annee: '2026', montant_estime: null, statut: 'Évoqué non voté' },
  ],
  quote_part_travaux: "Pour calculer précisément votre part de ces travaux, ajoutez votre dernier appel de charges dans les 7 jours suivant ce rapport.",
  procedures_en_cours: false,
  procedures: [] as Array<{ label: string; type: string; gravite: 'faible' | 'moderee' | 'elevee'; message?: string }>,
  documents_detectes: [
    { nom: "PV d'Assemblée Générale 2024", explication: "Le procès-verbal d'Assemblée Générale est le compte-rendu officiel de la réunion annuelle des copropriétaires.", infos_cles: ["Budget voté : 45 000€", "Aucune procédure en cours"] },
  ],
  documents_manquants: ["Appels de charges", "Diagnostics parties communes"],
  negociation: { applicable: false, elements: [] as string[] },
  document_names: [] as string[],
  regeneration_deadline: null as string | null,
  is_preview: false,
  vie_copropriete: null as Record<string, unknown> | null,
  lot_achete: null as Record<string, unknown> | null,
  finances: null as Record<string, unknown> | null,
  diagnostics_resume: '' as string,
};

/* ══════════════════════════════════════════
   UTILITAIRES NOTE /20
══════════════════════════════════════════ */
function getScoreColor(score: number): string {
  if (score >= 17) return '#15803d';
  if (score >= 14) return '#16a34a';
  if (score >= 10) return '#d97706';
  if (score >= 7)  return '#ea580c';
  return '#dc2626';
}

function getScoreLabel(score: number): string {
  if (score >= 17) return 'Bien irréprochable';
  if (score >= 14) return 'Bien sain';
  if (score >= 10) return 'Bien correct avec réserves';
  if (score >= 7)  return 'Bien risqué';
  return 'Bien à éviter';
}

function getTypeBienLabel(type: string): string {
  if (type === 'maison') return 'Maison individuelle';
  if (type === 'maison_copro') return 'Maison en copropriété';
  return 'Appartement en copropriété';
}

function getProfilLabel(profil: string): string {
  return profil === 'invest' ? 'Investissement locatif' : 'Résidence principale';
}

/* ══════════════════════════════════════════
   COMPOSANTS UTILITAIRES
══════════════════════════════════════════ */
function ScoreGauge({ score }: { score: number }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const r = 54, circ = 2 * Math.PI * r;
  const dash = (score / 20) * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width="140" height="140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dasharray 1s ease' }}/>
        <text x="70" y="62" textAnchor="middle" fontSize="28" fontWeight="900" fill={color}>{score.toFixed(1)}</text>
        <text x="70" y="82" textAnchor="middle" fontSize="13" fill="#94a3b8" fontWeight="600">/20</text>
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color, background: `${color}12`, border: `1px solid ${color}25`, padding: '3px 12px', borderRadius: 100 }}>
        {label}
      </span>
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

function SeveriteBadge({ sev }: { sev: 'faible' | 'moderee' | 'elevee' }) {
  const map = {
    faible:   { label: 'Faible',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    moderee:  { label: 'Modérée', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    elevee:   { label: 'Élevée',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  };
  const s = map[sev] || map['moderee'];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: 100 }}>
      {s.label}
    </span>
  );
}

/* ── Détail de la note par catégorie ── */
function DetailNote({ categories, typeBien }: { categories: typeof MOCK_RAPPORT.categories; typeBien?: string }) {
  const [open, setOpen] = useState(false);
  const isCopro = !typeBien || typeBien === 'appartement' || typeBien === 'maison_copro';
  const cats = [
    { key: 'travaux',         label: 'Travaux',                icon: '🔨', always: true },
    { key: 'procedures',      label: 'Procédures juridiques',  icon: '⚖️', always: true },
    { key: 'finances',        label: 'Finances copropriété',   icon: '💰', always: false },
    { key: 'diags_privatifs', label: 'Diagnostics',            icon: '🏠', always: true },
    { key: 'diags_communs',   label: 'Diagnostics communs',    icon: '🏢', always: false },
  ].filter(c => c.always || isCopro);

  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
        {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
        {open ? 'Masquer' : 'Détail de la note'}
      </button>
      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cats.map(cat => {
            const c = categories[cat.key as keyof typeof categories];
            if (!c) return null;
            const pct = (c.note / c.note_max) * 100;
            const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#dc2626';
            return (
              <div key={cat.key} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{cat.icon} {cat.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color }}>{c.note}/{c.note_max}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLETS
══════════════════════════════════════════ */
type TabId = 'overview' | 'copropriete' | 'travaux' | 'finances' | 'procedures' | 'documents';

const TABS: { id: TabId; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'overview',     label: 'Synthèse',      icon: <BarChart2 size={15}/>,    color: '#2a7d9c' },
  { id: 'copropriete',  label: 'Copropriété',   icon: <Building2 size={15}/>,    color: '#7c3aed' },
  { id: 'travaux',      label: 'Travaux',        icon: <HardHat size={15}/>,      color: '#d97706' },
  { id: 'finances',     label: 'Finances',       icon: <Euro size={15}/>,         color: '#16a34a' },
  { id: 'procedures',   label: 'Procédures',     icon: <Gavel size={15}/>,        color: '#dc2626' },
  { id: 'documents',    label: 'Documents',      icon: <FileText size={15}/>,     color: '#475569' },
];

/* ══════════════════════════════════════════
   PAGE RAPPORT
══════════════════════════════════════════ */
export default function RapportPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const action = searchParams.get('action') || '';
  const [showReupload, setShowReupload] = useState(action === 'reupload');
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [rapport, setRapport] = useState<typeof MOCK_RAPPORT | null>(null);
  const [apercuData, setApercuData] = useState<{ apercu: Record<string, unknown>; type: string; id: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (!id) { setRapport(MOCK_RAPPORT); setLoading(false); return; }

      // Polling : on attend jusqu'à 3 minutes que le résultat soit écrit en base
      // (l'Edge Function peut répondre success avant d'avoir fini l'écriture Supabase)
      const MAX_ATTEMPTS = 36; // 36 × 5s = 3 minutes
      const POLL_INTERVAL = 5000;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const data = await fetchAnalyseById(id);

        // Analyse échouée → sortir immédiatement
        if (data?.status === 'failed') {
          setLoading(false);
          return;
        }

        // Aperçu gratuit → afficher l'aperçu
        if (data?.is_preview && data?.apercu && !data?.result) {
          setApercuData({ apercu: data.apercu as Record<string, unknown>, type: data.type, id: data.id });
          setLoading(false);
          return;
        }

        // Résultat disponible → afficher le rapport
        if (data?.result) {
          const r = data.result as Record<string, unknown>;
          const mappedType = (data.type === 'pack2' || data.type === 'pack3' ? 'complete' : data.type) as 'document' | 'complete';

          // Adapter le JSON de Claude vers la structure attendue par RapportPage
          // Claude retourne travaux.votes/evoques, finances.charges_annuelles, procedures en strings
          const travauxObj = (r.travaux as Record<string, unknown>) || {};
          const financesObj = (r.finances as Record<string, unknown>) || {};

          // Convertir travaux (strings ou objets) → format attendu par RapportPage
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toTravaux = (arr: unknown[]): any[] => arr.map(t => {
            if (typeof t === 'string') {
              return { label: t, annee: '', montant_estime: null, statut: '', justificatif: false };
            }
            const obj = t as Record<string, unknown>;
            const montant = obj.montant ?? obj.montant_estime;
            return {
              label: (obj.label as string) || (obj.description as string) || String(t),
              annee: (obj.annee as string) || (obj.annee_vote as string) || (obj.echeance as string) || (obj.date_vote as string) || '',
              montant_estime: typeof montant === 'number' ? montant : null,
              statut: (obj.statut as string) || (obj.statut_realisation as string) || '',
              justificatif: (obj.justificatif as boolean) ?? false,
            };
          });

          // Convertir negociation.elements (objets ou strings) → strings
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toNegociationElements = (arr: unknown[]): string[] => arr.map(e => {
            if (typeof e === 'string') return e;
            const obj = e as Record<string, unknown>;
            return (obj.argument as string) || (obj.label as string) || JSON.stringify(e);
          });

          // Convertir procedures (strings) → format { label, type, gravite, message }
          const rawProcedures = (r.procedures as unknown[]) || [];
          const proceduresFormatted = rawProcedures.map(p =>
            typeof p === 'string'
              ? { label: p, type: 'autre', gravite: 'moderee' as const, message: p }
              : p as { label: string; type: string; gravite: 'faible' | 'moderee' | 'elevee'; message?: string }
          );

          // Charges mensuelles depuis finances.charges_annuelles
          const chargesAnnuelles = financesObj.charges_annuelles;
          const chargesMensuelles = typeof chargesAnnuelles === 'number'
            ? Math.round(chargesAnnuelles / 12)
            : typeof chargesAnnuelles === 'string'
              ? Math.round(parseFloat(chargesAnnuelles.replace(/[^0-9.]/g, '')) / 12) || 0
              : 0;

          // Fonds travaux
          const fondsTravaux = financesObj.fonds_travaux;
          const fondsTrvauxNum = typeof fondsTravaux === 'number'
            ? fondsTravaux
            : typeof fondsTravaux === 'string'
              ? parseFloat(fondsTravaux.replace(/[^0-9.]/g, '')) || 0
              : 0;

          setRapport({
            id: data.id,
            type: mappedType as 'complete',
            adresse: (r.titre as string) || data.title,
            date: new Date(data.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }),
            score: typeof r.score === 'number' ? r.score : 0,
            score_couleur: (r.score_couleur as string) || 'jaune',
            score_niveau: (r.score_niveau as string) || '',
            type_bien: (r.type_bien as string) || 'appartement',
            profil: (data.profil as string) || 'rp',
            resume: (r.resume as string) || '',
            synthese_points_positifs: (r.points_forts as string[]) || (r.synthese_points_positifs as string[]) || [],
            synthese_points_vigilance: (r.points_vigilance as string[]) || (r.synthese_points_vigilance as string[]) || [],
            avis_verimo: (r.avis_verimo as string) || '',
            categories: (r.categories as typeof MOCK_RAPPORT.categories) || MOCK_RAPPORT.categories,
            charges_mensuelles: chargesMensuelles,
            fonds_travaux: fondsTrvauxNum,
            fonds_travaux_statut: (() => {
              const raw = (financesObj.fonds_travaux_statut as string) || (r.fonds_travaux_statut as string) || 'non_mentionne';
              // Normaliser les variantes retournées par Claude
              if (raw.includes('conforme') || raw === 'au_dessus') return 'conforme';
              if (raw === 'insuffisant') return 'insuffisant';
              if (raw === 'absent') return 'absent';
              return raw;
            })(),
            travaux_realises: toTravaux((travauxObj.realises as unknown[]) || (r.travaux_realises as unknown[]) || []),
            travaux_votes: toTravaux((travauxObj.votes as unknown[]) || (r.travaux_votes as unknown[]) || []),
            travaux_a_prevoir: toTravaux((travauxObj.evoques as unknown[]) || (r.travaux_a_prevoir as unknown[]) || []),
            quote_part_travaux: (() => {
              if (r.quote_part_travaux) return r.quote_part_travaux as string;
              const est = travauxObj.estimation_totale;
              if (typeof est === 'number') return `Estimation totale des travaux votés : ${est.toLocaleString('fr-FR')}€ (total copropriété)`;
              if (typeof est === 'string' && est) return `Estimation totale des travaux votés : ${est}`;
              return '';
            })(),
            procedures_en_cours: proceduresFormatted.length > 0,
            procedures: proceduresFormatted,
            documents_detectes: (r.documents_detectes as typeof MOCK_RAPPORT.documents_detectes) || [],
            documents_manquants: (r.documents_manquants as string[]) || [],
            negociation: {
              applicable: ((r.negociation as Record<string, unknown>)?.applicable as boolean) ?? false,
              elements: toNegociationElements(((r.negociation as Record<string, unknown>)?.elements as unknown[]) || []),
            },
            document_names: (data.document_names as string[]) || [],
            regeneration_deadline: data.regeneration_deadline || null,
            is_preview: data.is_preview ?? false,
            vie_copropriete: (() => {
              const vie = r.vie_copropriete as Record<string, unknown> | null;
              if (!vie) return null;
              // Normaliser participation_ag : Claude retourne {date, taux, presents_representes}
              // mais la page attend {annee, taux_tantiemes_pct, copropietaires_presents_representes}
              const rawParticipation = (vie.participation_ag as Record<string, unknown>[]) || [];
              const normalizedParticipation = rawParticipation.map(p => ({
                annee: (p.annee as string) || (p.date as string)?.slice(0, 4) || '',
                copropietaires_presents_representes: (p.copropietaires_presents_representes as string) || (p.presents_representes as string) || '—',
                tantiemes_representes: (p.tantiemes_representes as string) || '',
                taux_tantiemes_pct: (p.taux_tantiemes_pct as string) || (p.taux as string) || '',
                quorum_note: (p.quorum_note as string) || null,
                resolutions_refusees: (p.resolutions_refusees as string[]) || [],
              }));
              return { ...vie, participation_ag: normalizedParticipation };
            })(),
            lot_achete: (r.lot_achete as Record<string, unknown>) ?? null,
            finances: financesObj ?? null,
            diagnostics_resume: (r.diagnostics_resume as string) || '',
          });
          setLoading(false);
          return; // résultat trouvé → sortir du polling
        }

        // Résultat pas encore disponible → attendre avant de réessayer
        if (attempt < MAX_ATTEMPTS - 1) {
          await new Promise(r => setTimeout(r, POLL_INTERVAL));
        }
      }

      // Timeout dépassé sans résultat → afficher "introuvable"
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f9fb', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <div style={{ textAlign:'center', maxWidth: 340, padding: '0 24px' }}>
        <div style={{ width:56, height:56, borderRadius:'50%', border:'3px solid #edf2f7', borderTopColor:'#2a7d9c', animation:'spin 0.9s linear infinite', margin:'0 auto 16px' }}/>
        <p style={{ fontSize:15, fontWeight: 700, color:'#0f172a', marginBottom: 8 }}>Génération du rapport en cours…</p>
        <p style={{ fontSize:13, color:'#94a3b8', lineHeight: 1.6 }}>Votre rapport est en cours de finalisation. Cette page se mettra à jour automatiquement, ne la quittez pas.</p>
      </div>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  if (apercuData) {
    const ap = apercuData.apercu;
    const isComplete = apercuData.type === 'complete' || apercuData.type === 'apercu_complete';
    return (
      <div style={{ minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #edf2f7', position: 'sticky', top: 0, zIndex: 40, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/dashboard/analyses" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748b', textDecoration: 'none' }}><ChevronLeft size={16}/> Mes analyses</Link>
          <div style={{ width: 1, height: 20, background: '#edf2f7' }}/>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: 100 }}>APERÇU GRATUIT</span>
        </header>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }} className="apercu-page-grid">
          <style>{`@media (max-width: 860px) { .apercu-page-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{ap.titre as string}</h1>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Voici un aperçu de votre analyse. Débloquez le rapport complet pour accéder à tous les détails.</p>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '20px 22px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 8 }}>RÉSUMÉ</div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{ap.recommandation_courte as string}</p>
            </div>
            {(ap.points_vigilance as string[])?.length > 0 && (
              <div style={{ background: '#fffbeb', borderRadius: 16, border: '1px solid #fde68a', padding: '20px 22px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: '0.1em', marginBottom: 12 }}>⚠ POINTS DE VIGILANCE</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {(ap.points_vigilance as string[]).map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isComplete && (
              <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 8 }}>SCORE GLOBAL</div>
                  <div style={{ fontSize: 52, fontWeight: 900, color: '#94a3b8' }}>?.?</div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>/20</div>
                </div>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <Lock size={22} style={{ color: '#64748b' }}/><span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Score disponible après paiement</span>
                </div>
              </div>
            )}
            <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 12 }}>ANALYSE COMPLÈTE</div>
                {['Rapport financier détaillé', 'Liste des travaux votés et à prévoir', 'Analyse des charges et fonds travaux', 'Procédures en cours', 'Avis Verimo personnalisé'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#cbd5e1' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
                <Lock size={20} style={{ color: '#64748b' }}/><span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Contenu réservé aux analyses payantes</span>
              </div>
            </div>
          </div>
          {/* Colonne droite CTA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>
            <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius: 18, padding: '24px', overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em', marginBottom: 8 }}>DÉBLOQUER LE RAPPORT</div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{isComplete ? 'Rapport complet' : 'Analyse du document'}</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 16 }}>{isComplete ? 'Score /20, travaux, charges, procédures et avis Verimo.' : 'Analyse approfondie et recommandations.'} Rapport PDF inclus.</p>
              <button onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { window.location.href = '/connexion'; return; }
                const priceId = isComplete ? 'price_1TIb3XBO4ekMbwz0a7m7E7gD' : 'price_1TIb1LBO4ekMbwz0020eqcR0';
                const successUrl = `https://verimo.fr/dashboard/rapport?id=${apercuData.id}&action=reupload`;
                const res = await fetch('https://veszrayromldfgetqaxb.supabase.co/functions/v1/create-checkout-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}`, 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlc3pyYXlyb21sZGZnZXRxYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MzI5NTUsImV4cCI6MjA2MTAwODk1NX0.XsqzBPDMfHRFKgMhJxoLhgVWZMdV5YnFKM3VCBe9hOk' },
                  body: JSON.stringify({ priceId, userId: session.user.id, successUrl }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
                style={{ width: '100%', padding: '14px', borderRadius: 12, background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', marginBottom: 10 }}>
                Débloquer — {isComplete ? '19,90€' : '4,90€'}
              </button>
              <Link to="/dashboard/analyses" style={{ display: 'block', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>← Mes analyses</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!rapport) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f9fb' }}>
      <p style={{ fontSize:14, color:'#94a3b8' }}>Rapport introuvable.</p>
    </div>
  );

  const isComplete = rapport.type === 'complete';
  const scoreColor = getScoreColor(rapport.score);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* ── Topbar */}
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
        {isComplete && rapport.score > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, background: `${scoreColor}0d`, border: `1.5px solid ${scoreColor}22`, flexShrink: 0 }}>
            <Star size={13} style={{ color: scoreColor }}/>
            <span style={{ fontSize: 15, fontWeight: 900, color: scoreColor }}>{rapport.score}/20</span>
          </div>
        )}
        <button onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Download size={14}/> Télécharger PDF
        </button>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── Hero rapport complet */}
        {isComplete && (
          <div style={{ background: 'linear-gradient(135deg, #0f2d3d 0%, #1a5068 100%)', borderRadius: 22, padding: '32px 36px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }}/>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
              <ScoreGauge score={rapport.score}/>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.14em', marginBottom: 8 }}>RAPPORT VERIMO — ANALYSE COMPLÈTE</div>
                <h1 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.25 }}>{rapport.adresse}</h1>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 100 }}>
                    {getTypeBienLabel(rapport.type_bien)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: 100 }}>
                    {getProfilLabel(rapport.profil)}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>Analysé le {rapport.date}</div>
                <DetailNote categories={rapport.categories} typeBien={rapport.type_bien}/>
              </div>
            </div>
          </div>
        )}

        {/* ── Header rapport simple */}
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

        {/* ── Bandeau re-upload après paiement depuis aperçu */}
        {showReupload && (
          <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius: 18, padding: '24px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', marginBottom: 8 }}>Paiement confirmé !</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 16 }}>
                Bonne nouvelle ! Conformément au RGPD, vos documents ont été supprimés 🔒<br />
                Re-uploadez vos documents pour générer votre rapport complet...<br />
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>et profitez-en pour ajouter ceux que vous aviez oubliés ! 😉</span>
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/dashboard/nouvelle-analyse"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 800, textDecoration: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                  Re-uploader mes documents →
                </Link>
                <button onClick={() => setShowReupload(false)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Voir l'aperçu d'abord
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Onglets */}
        {isComplete && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: '#fff', padding: '6px', borderRadius: 14, border: '1px solid #edf2f7', flexWrap: 'wrap' }}>
            {TABS.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 14px', borderRadius: 10, border: 'none', background: active ? `${tab.color}0e` : 'transparent', color: active ? tab.color : '#64748b', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s', borderBottom: active ? `2px solid ${tab.color}` : '2px solid transparent' }}>
                  {tab.icon} {tab.label}
                  {tab.id === 'procedures' && rapport.procedures_en_cours && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }}/>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ══ SYNTHÈSE ══ */}
        {(activeTab === 'overview' || !isComplete) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Résumé */}
            <SectionCard title="Résumé" icon={<Info size={16}/>} color="#2a7d9c">
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{rapport.resume}</p>
            </SectionCard>

            {/* Points positifs + vigilance */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <SectionCard title="Points positifs" icon={<CheckCircle size={16}/>} color="#16a34a">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rapport.synthese_points_positifs.length > 0
                    ? rapport.synthese_points_positifs.map((p, i) => <Bullet key={i} text={p} color="#16a34a" icon={<CheckCircle size={10}/>}/>)
                    : <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun point positif identifié dans les documents transmis.</p>}
                </div>
              </SectionCard>

              <SectionCard title="Points de vigilance" icon={<AlertTriangle size={16}/>} color="#d97706">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rapport.synthese_points_vigilance.length > 0
                    ? rapport.synthese_points_vigilance.map((p, i) => <Bullet key={i} text={p} color="#d97706" icon={<AlertTriangle size={10}/>}/>)
                    : <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun point de vigilance identifié dans les documents transmis.</p>}
                </div>
              </SectionCard>
            </div>

            {/* Avis Verimo */}
            <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a5068)', borderRadius: 18, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }}/>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Shield size={16} style={{ color: '#5bb8d4' }}/>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>AVIS VERIMO</span>
                </div>
                <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.88)', lineHeight: 1.8, fontWeight: 500 }}>{rapport.avis_verimo}</p>
              </div>
            </div>

            {/* Pistes de négociation */}
            {rapport.negociation?.applicable && rapport.negociation.elements.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 16, padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <TrendingDown size={16} style={{ color: '#d97706' }}/>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#92400e' }}>Pistes de négociation</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rapport.negociation.elements.map((el, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', flexShrink: 0, marginTop: 7 }}/>
                      <span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>{el}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerte DPE invalide */}
            {(() => {
              const r3 = rapport as unknown as Record<string, unknown>;
              const diag = r3.diagnostics_resume as string | undefined;
              const showAlerte = diag && diag.toLowerCase().includes('invalide') || diag?.toLowerCase().includes('avant 2021') || diag?.toLowerCase().includes('2018') || diag?.toLowerCase().includes('2019') || diag?.toLowerCase().includes('2020');
              if (!showAlerte) return null;
              return (
                <div style={{ padding: '14px 18px', background: '#fef2f2', borderRadius: 13, border: '1.5px solid #fecaca', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }}/>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 2 }}>DPE potentiellement invalide</div>
                    <div style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.5 }}>Un DPE réalisé avant le 01/07/2021 est invalide depuis le 01/01/2025. Un nouveau diagnostic est obligatoire pour toute vente ou location. Vérifiez la date du DPE avec le vendeur.</div>
                  </div>
                </div>
              );
            })()}

            {/* Documents manquants */}
            {rapport.documents_manquants && rapport.documents_manquants.length > 0 && (
              <div style={{ padding: '14px 18px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Info size={14} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 2 }}/>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Documents non fournis — note basée sur les documents disponibles</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {rapport.documents_manquants.join(', ')} — Nous vous recommandons de demander ces documents au vendeur ou à votre agent immobilier pour affiner l'analyse.
                  </div>
                </div>
              </div>
            )}
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
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                            {t.annee && <span style={{ fontSize: 11, color: '#94a3b8' }}>Réalisé en {t.annee}</span>}
                            {t.justificatif && <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 7px', borderRadius: 100 }}>Justificatif</span>}
                          </div>
                        </div>
                      </div>
                      {t.montant_estime && <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>{(t.montant_estime as number).toLocaleString()}€</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun travaux réalisé détecté dans les documents.</p>
              )}
            </SectionCard>

            {/* Travaux votés */}
            <SectionCard title="Travaux votés" icon={<Wrench size={16}/>} color="#16a34a">
              {rapport.travaux_votes.length > 0 ? (
                <>
                  <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <Info size={13} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }}/>
                    <span style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>Les travaux votés avant la signature du compromis sont à la charge du vendeur, même si les appels de fonds n'ont pas encore commencé. Vérifiez ce point avec votre notaire.</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rapport.travaux_votes.map((t, i) => {
                      const tv = t as unknown as Record<string, unknown>;
                      const statut_real = tv.statut_realisation as string | undefined;
                      const charge_vendeur = tv.charge_vendeur as boolean | undefined;
                      const statutColor = statut_real === 'réalisé' ? '#16a34a' : statut_real === 'en cours' ? '#d97706' : statut_real === 'non réalisé' ? '#dc2626' : '#94a3b8';
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <CheckCircle size={14} style={{ color: '#16a34a', flexShrink: 0 }}/>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>{t.label}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                                {t.annee && <span style={{ fontSize: 11, color: '#94a3b8' }}>Prévu en {t.annee}</span>}
                                {statut_real && statut_real !== 'non précisé' && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: statutColor, background: `${statutColor}12`, border: `1px solid ${statutColor}30`, padding: '1px 7px', borderRadius: 100 }}>
                                    {statut_real}
                                  </span>
                                )}
                                {charge_vendeur && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '1px 7px', borderRadius: 100 }}>
                                    Charge vendeur
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {t.montant_estime && <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>~{(t.montant_estime as number).toLocaleString()}€</span>}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun travaux voté détecté dans les documents. Aucun élément préoccupant identifié concernant ce point.</p>
              )}
            </SectionCard>

            {/* Travaux évoqués non votés */}
            <SectionCard title="Travaux évoqués (non votés)" icon={<HardHat size={16}/>} color="#d97706">
              {rapport.travaux_a_prevoir.length > 0 ? (
                <>
                  <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <AlertTriangle size={13} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }}/>
                    <span style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>Ces travaux ont été évoqués mais pas encore votés. Si le vote intervient après votre acquisition, vous en supporterez une partie du coût. Nous vous recommandons d'en parler avec le vendeur ou votre agent immobilier.</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rapport.travaux_a_prevoir.map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <AlertTriangle size={14} style={{ color: '#d97706', flexShrink: 0 }}/>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>{t.label}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                              {t.annee && <span style={{ fontSize: 11, color: '#94a3b8' }}>Horizon {t.annee}</span>}
                              {t.statut && <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a', padding: '1px 7px', borderRadius: 100 }}>{t.statut}</span>}
                            </div>
                          </div>
                        </div>
                        {t.montant_estime
                          ? <span style={{ fontSize: 14, fontWeight: 800, color: '#d97706' }}>~{(t.montant_estime as number).toLocaleString()}€</span>
                          : <span style={{ fontSize: 12, color: '#94a3b8' }}>Montant non précisé</span>}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun travaux évoqué sans vote détecté dans les documents. Aucun élément préoccupant identifié concernant ce point.</p>
              )}
            </SectionCard>

            {/* Quote-part travaux */}
            {rapport.quote_part_travaux && (
              <div style={{ padding: '14px 18px', background: '#f0f9ff', borderRadius: 12, border: '1px solid #bae6fd', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Info size={14} style={{ color: '#0284c7', flexShrink: 0, marginTop: 2 }}/>
                <span style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.6 }}>{rapport.quote_part_travaux}</span>
              </div>
            )}
          </div>
        )}

        {/* ══ FINANCES ══ */}
        {activeTab === 'finances' && isComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {(rapport.type_bien === 'appartement' || rapport.type_bien === 'maison_copro' || !rapport.type_bien) && (
            <SectionCard title="Budget de la copropriété" icon={<Euro size={16}/>} color="#16a34a">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                {rapport.charges_mensuelles > 0 && <StatBox label="Budget annuel copro" value={`${(rapport.charges_mensuelles * 12).toLocaleString('fr-FR')}€`} sub="Total copropriété" color="#0f172a"/>}
                {rapport.fonds_travaux > 0 && <StatBox label="Fonds travaux" value={`${rapport.fonds_travaux.toLocaleString('fr-FR')}€`} sub="Total copropriété" color="#2a7d9c"/>}
              </div>

              {/* Statut fonds travaux */}
              {rapport.fonds_travaux_statut && rapport.fonds_travaux_statut !== 'non_mentionne' && (
                <div style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid', marginTop: 8,
                  background: rapport.fonds_travaux_statut === 'conforme' || rapport.fonds_travaux_statut === 'au_dessus' ? '#f0fdf4' : '#fef2f2',
                  borderColor: rapport.fonds_travaux_statut === 'conforme' || rapport.fonds_travaux_statut === 'au_dessus' ? '#bbf7d0' : '#fecaca' }}>
                  <span style={{ fontSize: 12, color: rapport.fonds_travaux_statut === 'conforme' || rapport.fonds_travaux_statut === 'au_dessus' ? '#166534' : '#991b1b', fontWeight: 600 }}>
                    Fonds travaux : {rapport.fonds_travaux_statut === 'conforme' ? 'conforme au minimum légal' : rapport.fonds_travaux_statut === 'insuffisant' ? 'insuffisant' : 'absent'}
                  </span>
                </div>
              )}
            </SectionCard>
            )} {/* fin condition copro charges */}

            {/* Détail catégorie finances */}
            {rapport.categories.finances.details.length > 0 && (
              <SectionCard title="Détail finances" icon={<TrendingUp size={16}/>} color="#d97706">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rapport.categories.finances.details.map((d, i) => (
                    <div key={i} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid', background: d.impact === 'positif' ? '#f0fdf4' : d.impact === 'negatif' ? '#fef2f2' : '#f8fafc', borderColor: d.impact === 'positif' ? '#bbf7d0' : d.impact === 'negatif' ? '#fecaca' : '#e2e8f0' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{d.label}</div>
                      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{d.message}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {rapport.categories.finances.details.length === 0 && (
              <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf2f7', padding: '32px', textAlign: 'center' }}>
                <CheckCircle size={28} style={{ color: '#16a34a', margin: '0 auto 12px' }}/>
                <p style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>Aucun élément préoccupant identifié</p>
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>La situation financière de la copropriété semble saine selon les documents analysés.</p>
              </div>
            )}

            {/* Type de chauffage + honoraires syndic */}
            {(() => {
              const r2 = rapport as unknown as Record<string, unknown>;
              const finances = r2.finances as Record<string, unknown> | undefined;
              const vie2 = r2.vie_copropriete as Record<string, unknown> | undefined;
              const chauffage = finances?.type_chauffage as string | undefined;
              const honoraires = vie2?.honoraires_syndic_evolution as string | undefined;
              if (!chauffage && !honoraires) return null;
              return (
                <SectionCard title="Informations complémentaires" icon={<Info size={16}/>} color="#2a7d9c">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {chauffage && (
                      <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 2 }}>Type de chauffage</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>{chauffage}</div>
                        {chauffage.toLowerCase().includes('collectif') && (
                          <div style={{ fontSize: 11, color: '#d97706', marginTop: 4 }}>⚠ Chauffage collectif : charges potentiellement plus élevées, moins de maîtrise individuelle.</div>
                        )}
                      </div>
                    )}
                    {honoraires && (
                      <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 2 }}>Honoraires du syndic</div>
                        <div style={{ fontSize: 13, color: '#64748b' }}>{honoraires}</div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              );
            })()}
          </div>
        )}

        {/* ══ PROCÉDURES ══ */}
        {activeTab === 'procedures' && isComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {rapport.procedures_en_cours && rapport.procedures.length > 0 ? (
              <>
                <div style={{ padding: '14px 18px', background: '#fef2f2', borderRadius: 13, border: '1.5px solid #fecaca', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <AlertTriangle size={16} style={{ color: '#dc2626', flexShrink: 0 }}/>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#991b1b' }}>
                    {rapport.procedures.length} procédure{rapport.procedures.length > 1 ? 's' : ''} détectée{rapport.procedures.length > 1 ? 's' : ''} dans les documents.
                  </span>
                </div>
                {rapport.procedures.map((proc, i) => (
                  <SectionCard key={i} title={proc.type} icon={<Gavel size={16}/>} color="#dc2626">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <SeveriteBadge sev={proc.gravite}/>
                    </div>
                    {proc.message && <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7 }}>{proc.message}</p>}
                    <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', marginTop: 12 }}>
                      <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>Nous vous recommandons de demander des précisions au vendeur ou à votre agent immobilier sur cette procédure avant de vous engager.</p>
                    </div>
                  </SectionCard>
                ))}
              </>
            ) : (
              <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf2f7', padding: '48px 32px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={28} style={{ color: '#16a34a' }}/>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Aucune procédure identifiée</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>Aucune procédure judiciaire ou litige n'a été détecté dans les documents analysés.</p>
              </div>
            )}
          </div>
        )}

        {/* ══ COPROPRIÉTÉ ══ */}
        {activeTab === 'copropriete' && isComplete && (() => {
          const r = rapport as unknown as Record<string, unknown>;
          type SyndicType = { nom?: string; fin_mandat?: string; tensions_detectees?: boolean; tensions_detail?: string; changement_recent?: boolean };
          type ParticipationType = { annee?: string; copropietaires_presents_representes?: string; tantiemes_representes?: string; taux_tantiemes_pct?: string; quorum_note?: string; resolutions_refusees?: string[] };
          type LotType = { quote_part_tantiemes?: string; fonds_travaux_alur?: string; parties_privatives?: string[]; restrictions_usage?: string[]; travaux_votes_charge_vendeur?: string[]; impayes_detectes?: string; points_specifiques?: string[] };
          type VieType = { syndic?: SyndicType; participation_ag?: ParticipationType[]; tendance_participation?: string; analyse_participation?: string; travaux_votes_non_realises?: string[]; questions_diverses_notables?: string[]; appels_fonds_exceptionnels?: string[]; honoraires_syndic_evolution?: string };

          const vie = r.vie_copropriete as VieType | undefined;
          const lot = r.lot_achete as LotType | undefined;
          const syndic = vie?.syndic;
          const participation = vie?.participation_ag;
          const tendance = vie?.tendance_participation;
          const analyse = vie?.analyse_participation;
          const travaux_nr = vie?.travaux_votes_non_realises;
          const questions = vie?.questions_diverses_notables;
          const appels = vie?.appels_fonds_exceptionnels;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Syndic */}
              {syndic?.nom && (
                <SectionCard title="Syndic" icon={<Building2 size={16}/>} color="#7c3aed">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}>
                      <Building2 size={14} style={{ color: '#7c3aed', flexShrink: 0 }}/>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{syndic.nom}</div>
                        {syndic.fin_mandat && (
                          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                            Mandat jusqu'au {syndic.fin_mandat} — renouvellement habituel en AG
                          </div>
                        )}
                      </div>
                    </div>
                    {syndic.tensions_detectees && syndic.tensions_detail && (
                      <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <Info size={13} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }}/>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>Points notables en AG</div>
                          <div style={{ fontSize: 12, color: '#92400e' }}>{syndic.tensions_detail}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Participation AG */}
              {participation && participation.length > 0 && (
                <SectionCard title="Participation aux assemblées générales" icon={<BarChart2 size={16}/>} color="#7c3aed">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Tendance */}
                    {tendance && tendance !== 'Non déterminable' && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid', marginBottom: 6,
                        background: tendance === 'En hausse' ? '#f0fdf4' : tendance === 'En baisse' ? '#fef2f2' : '#f8fafc',
                        borderColor: tendance === 'En hausse' ? '#bbf7d0' : tendance === 'En baisse' ? '#fecaca' : '#e2e8f0' }}>
                        <div style={{ fontSize: 12, fontWeight: 700,
                          color: tendance === 'En hausse' ? '#166534' : tendance === 'En baisse' ? '#991b1b' : '#64748b' }}>
                          Tendance : {tendance}
                        </div>
                        {analyse && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{analyse}</div>}
                      </div>
                    )}

                    {/* Tableau par année */}
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7' }}>Année</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7' }}>Participation</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7' }}>Taux</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7' }}>Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {participation.map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{p.annee}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>{p.copropietaires_presents_representes ?? '—'}</td>
                              <td style={{ padding: '10px 12px', color: '#374151' }}>
                                {p.taux_tantiemes_pct ?? '—'}
                                {p.tantiemes_representes && <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8' }}>({p.tantiemes_representes})</span>}
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                {p.quorum_note && (
                                  <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 100 }}>
                                    {p.quorum_note}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Résolutions refusées */}
                    {participation.some(p => (p.resolutions_refusees as string[])?.length > 0) && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Résolutions refusées détectées :</div>
                        {participation.map((p, i) =>
                          (p.resolutions_refusees as string[])?.map((r, j) => (
                            <div key={`${i}-${j}`} style={{ fontSize: 12, color: '#991b1b', padding: '6px 10px', background: '#fef2f2', borderRadius: 8, marginBottom: 4 }}>
                              {p.annee} — {r}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Votre lot */}
              {lot && (lot.quote_part_tantiemes || lot.fonds_travaux_alur || (lot.restrictions_usage as string[])?.length > 0 || (lot.parties_privatives as string[])?.length > 0) && (
                <SectionCard title="Votre lot" icon={<Info size={16}/>} color="#2a7d9c">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {lot.quote_part_tantiemes && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}>
                        <span style={{ fontSize: 13, color: '#64748b' }}>Quote-part en tantièmes</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{lot.quote_part_tantiemes}</span>
                      </div>
                    )}
                    {lot.fonds_travaux_alur && (
                      <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 2 }}>Fonds travaux ALUR récupérable</div>
                        <div style={{ fontSize: 12, color: '#166534' }}>{lot.fonds_travaux_alur} — cette somme vous revient à la signature de l'acte authentique.</div>
                      </div>
                    )}
                    {(lot.parties_privatives as string[])?.length > 0 && (
                      <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Parties privatives identifiées</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(lot.parties_privatives as string[]).map((p, i) => (
                            <span key={i} style={{ fontSize: 11, fontWeight: 600, color: '#2a7d9c', background: '#e0f2fe', border: '1px solid #bae6fd', padding: '2px 10px', borderRadius: 100 }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(lot.restrictions_usage as string[])?.length > 0 && (
                      <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>Restrictions d'usage détectées</div>
                        {(lot.restrictions_usage as string[]).map((r, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#92400e', marginBottom: 3 }}>• {r}</div>
                        ))}
                      </div>
                    )}
                    {(lot.travaux_votes_charge_vendeur as string[])?.length > 0 && (
                      <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>Travaux votés — charge vendeur</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Votés avant le compromis → à la charge du vendeur. Vérifiez ce point avec votre notaire.</div>
                        {(lot.travaux_votes_charge_vendeur as string[]).map((t, i) => (
                          <div key={i} style={{ fontSize: 12, color: '#166534', marginBottom: 3 }}>• {t}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Travaux votés non réalisés */}
              {travaux_nr && travaux_nr.length > 0 && (
                <SectionCard title="Travaux votés non réalisés" icon={<AlertTriangle size={16}/>} color="#d97706">
                  <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
                    Ces travaux ont été votés mais leur réalisation n'est pas confirmée dans les PV suivants. Demandez une mise à jour au vendeur.
                  </div>
                  {travaux_nr.map((t, i) => {
                    const label = typeof t === 'string' ? t : (t as Record<string,unknown>).description as string || JSON.stringify(t);
                    const obs = typeof t !== 'string' ? (t as Record<string,unknown>).observations as string : null;
                    return (
                      <div key={i} style={{ fontSize: 13, color: '#92400e', padding: '8px 12px', background: '#fffbeb', borderRadius: 8, marginBottom: 6 }}>
                        <div>• {label}</div>
                        {obs && <div style={{ fontSize: 11, color: '#b45309', marginTop: 4, fontStyle: 'italic' }}>{obs}</div>}
                      </div>
                    );
                  })}
                </SectionCard>
              )}

              {/* Appels de fonds exceptionnels */}
              {appels && appels.length > 0 && (
                <SectionCard title="Appels de fonds exceptionnels" icon={<Euro size={16}/>} color="#d97706">
                  <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', marginBottom: 10, fontSize: 12, color: '#92400e' }}>
                    Appels de fonds hors budget ordinaire votés en AG. Si votés avant le compromis, c'est la charge du vendeur.
                  </div>
                  {appels.map((a, i) => {
                    if (typeof a === 'string') return <div key={i} style={{ fontSize: 13, color: '#92400e', padding: '8px 12px', background: '#fffbeb', borderRadius: 8, marginBottom: 6 }}>• {a}</div>;
                    const obj = a as Record<string,unknown>;
                    const montant = obj.montant as number;
                    const motif = obj.motif as string || obj.description as string || '';
                    const echelon = obj.echelonnement as string;
                    return (
                      <div key={i} style={{ fontSize: 13, color: '#92400e', padding: '8px 12px', background: '#fffbeb', borderRadius: 8, marginBottom: 6 }}>
                        <div>• {motif}{montant ? ` — ${montant.toLocaleString('fr-FR')}€` : ''}</div>
                        {echelon && <div style={{ fontSize: 11, color: '#b45309', marginTop: 4, fontStyle: 'italic' }}>{echelon}</div>}
                      </div>
                    );
                  })}
                </SectionCard>
              )}

              {/* Questions diverses */}
              {questions && questions.length > 0 && (
                <SectionCard title="Questions diverses notables" icon={<Info size={16}/>} color="#64748b">
                  {questions.map((q, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#374151', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, marginBottom: 6, border: '1px solid #edf2f7' }}>• {q}</div>
                  ))}
                </SectionCard>
              )}

              {/* Aucune donnée */}
              {!vie && !lot && (
                <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf2f7', padding: '48px 32px', textAlign: 'center' }}>
                  <Info size={28} style={{ color: '#94a3b8', margin: '0 auto 12px' }}/>
                  <p style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>Données copropriété non disponibles</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Uploadez les PV d'AG et le règlement de copropriété pour obtenir cette analyse.</p>
                </div>
              )}

            </div>
          );
        })()}

        {/* ══ DOCUMENTS ══ */}
        {activeTab === 'documents' && isComplete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {rapport.documents_detectes && rapport.documents_detectes.length > 0 ? (
              rapport.documents_detectes.map((doc, i) => (
                <SectionCard key={i} title={doc.nom} icon={<FileText size={16}/>} color="#7c3aed">
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 14, fontStyle: 'italic' }}>{doc.explication}</p>
                  {doc.infos_cles && doc.infos_cles.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {doc.infos_cles.map((info, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #edf2f7' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }}/>
                          <span style={{ fontSize: 13, color: '#374151' }}>{info}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              ))
            ) : (
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun document détecté.</p>
            )}
          </div>
        )}

        {/* ── Bannière 7 jours */}
        {isComplete && !rapport.is_preview && rapport.regeneration_deadline && (() => {
          const deadline = new Date(rapport.regeneration_deadline);
          const now = new Date();
          const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const expired = diffDays <= 0;
          const urgent = diffDays <= 2 && !expired;
          return (
            <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 14, background: expired ? '#f8fafc' : urgent ? '#fffbeb' : '#f0fdf4', border: `1.5px solid ${expired ? '#e2e8f0' : urgent ? '#fde68a' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <RefreshCw size={16} style={{ color: expired ? '#94a3b8' : urgent ? '#d97706' : '#16a34a', flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: expired ? '#94a3b8' : urgent ? '#92400e' : '#166534', marginBottom: 2 }}>
                  {expired ? 'Délai de complétion expiré' : `Vous pouvez compléter ce dossier — encore ${diffDays} jour${diffDays > 1 ? 's' : ''}`}
                </div>
                <div style={{ fontSize: 12, color: expired ? '#cbd5e1' : '#64748b' }}>
                  {expired ? 'Le délai de 7 jours pour ajouter des documents est dépassé.' : 'Ajoutez votre appel de charges ou tout autre document oubliés et obtenez un rapport mis à jour — gratuitement.'}
                </div>
              </div>
              {!expired ? (
                <button onClick={() => window.location.href = `/dashboard/rapport?id=${id}&action=complement`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', background: urgent ? '#d97706' : '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <RefreshCw size={13}/> Compléter le dossier
                </button>
              ) : (
                <button disabled style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'not-allowed', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Lock size={13}/> Délai expiré
                </button>
              )}
            </div>
          );
        })()}

        {/* ── Documents analysés */}
        {rapport.document_names && rapport.document_names.length > 0 && (
          <div style={{ marginTop: 16, padding: '16px 20px', background: '#fff', borderRadius: 14, border: '1px solid #edf2f7' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Paperclip size={14} style={{ color: '#94a3b8' }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>FICHIERS ANALYSÉS</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rapport.document_names.map((name: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7' }}>
                  <FileText size={12} style={{ color: '#2a7d9c', flexShrink: 0 }}/>
                  <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>{name}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Shield size={11}/> Ces documents ne sont plus stockés sur nos serveurs, conformément à notre politique RGPD.
            </p>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 16, padding: '16px 20px', background: '#fff', borderRadius: 13, border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Shield size={14} style={{ color: '#94a3b8', flexShrink: 0 }}/>
          <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
            Ce rapport est fourni à titre informatif par Verimo. Il ne constitue pas un conseil juridique ou financier et ne remplace pas l'avis d'un notaire ou d'un expert immobilier.
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#cbd5e1', flexShrink: 0 }}>Rapport #{id}</span>
        </div>
      </div>

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
