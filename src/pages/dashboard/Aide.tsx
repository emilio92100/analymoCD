import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Star, Lightbulb, CheckCircle2,
  AlertTriangle, Sparkles, LifeBuoy, ChevronDown,
  TrendingUp, Info, ArrowRight,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════════════

const etapes = [
  { num: '1', title: 'Rassemblez vos documents', desc: "Rassemblez les documents disponibles sur votre bien : diagnostics, DPE, compromis, et selon votre cas — PV d'AG et règlement de copropriété pour un bien en copro, documents d'urbanisme et justificatifs de travaux pour une maison individuelle." },
  { num: '2', title: 'Choisissez votre analyse', desc: "Analyse Simple (4,90€) pour un seul document, ou Analyse Complète (19,90€) pour un rapport global avec note /20." },
  { num: '3', title: 'Uploadez en quelques secondes', desc: "Glissez-déposez vos fichiers PDF, Word ou images directement dans l'espace prévu." },
  { num: '4', title: 'Rapport prêt en 30 secondes*', desc: "Note /20, risques détectés, travaux à prévoir et recommandation personnalisée. Téléchargeable en PDF à tout moment." },
];

const penalties = [
  { cat: 'Travaux', items: [
    { l: 'Travaux lourds évoqués non votés (toiture, ravalement, chaudière, ascenseur)', v: '-3' },
    { l: 'Travaux légers évoqués non votés', v: '-1' },
  ]},
  { cat: 'Procédures', items: [
    { l: 'Procédure significative (litige bloquant, administration provisoire)', v: '-3' },
    { l: 'Procédure mineure (petit litige, mise en demeure)', v: '-1,5' },
  ]},
  { cat: 'Finances', items: [
    { l: 'Fonds travaux nul ou absent', v: '-1' },
    { l: 'Impayés anormaux (> 15% du budget)', v: '-1' },
  ]},
  { cat: 'Diagnostics privatifs', items: [
    { l: 'DPE F (résidence principale)', v: '-2' },
    { l: 'DPE G (résidence principale)', v: '-3' },
    { l: 'DPE F (investissement)', v: '-4' },
    { l: 'DPE G (investissement)', v: '-6' },
    { l: 'Électricité : anomalies majeures', v: '-2' },
  ]},
  { cat: 'Diagnostics communs', items: [
    { l: 'Amiante parties communes dégradé', v: '-2' },
    { l: 'Termites parties communes', v: '-2' },
    { l: 'DTG état dégradé', v: '-2' },
    { l: 'DTG budget urgent > 50 000 €', v: '-2' },
    { l: 'DTG budget urgent < 50 000 €', v: '-1' },
  ]},
];

const bonuses = [
  { l: 'Travaux votés à charge du vendeur (petits/moyens)', v: '+2' },
  { l: 'Gros travaux votés à charge du vendeur', v: '+3' },
  { l: 'Garantie décennale récente', v: '+2' },
  { l: 'Aucune procédure détectée', v: '+1' },
  { l: 'Fonds travaux conforme légal (5%)', v: '+0,5' },
  { l: 'Fonds travaux bien (6–9%)', v: '+1' },
  { l: 'Fonds travaux excellent (≥ 10%)', v: '+1,5' },
  { l: 'Entretien chaudière certifié', v: '+0,5' },
  { l: 'Immeuble bien entretenu', v: '+0,5' },
  { l: 'DTG état bon', v: '+1' },
  { l: 'DPE A, B ou C', v: '+1,5' },
  { l: 'DPE D', v: '+1' },
  { l: 'Diagnostics complets sans anomalie (hors ERP) + DPE ≤ D', v: '+2' },
];

const scale = [
  { r: '17 – 20', l: 'Bien irréprochable', desc: "Aucun point de vigilance majeur détecté.", c: '#15803d', bg: '#f0fdf4', bord: '#bbf7d0' },
  { r: '14 – 16', l: 'Bien sain', desc: "Très peu de risques, le bien est en bon état global.", c: '#16a34a', bg: '#f0fdf4', bord: '#bbf7d0' },
  { r: '10 – 13', l: 'Bien correct avec réserves', desc: "Quelques points à surveiller avant de se positionner.", c: '#d97706', bg: '#fffbeb', bord: '#fde68a' },
  { r: '7 – 9', l: 'Bien risqué', desc: "Plusieurs signaux d'alerte, prudence fortement recommandée.", c: '#ea580c', bg: '#fff7ed', bord: '#fed7aa' },
  { r: '0 – 6', l: 'Bien à éviter', desc: "Risques majeurs identifiés, il est préférable de renoncer.", c: '#dc2626', bg: '#fef2f2', bord: '#fecaca' },
];

type GlossEntry = { t: string; d: string };
type GlossCategory = { cat: string; color: string; bg: string; items: GlossEntry[] };

const glossaire: GlossCategory[] = [
  {
    cat: 'Copropriété & vie de l\'immeuble',
    color: '#2a7d9c',
    bg: '#f0f7fb',
    items: [
      { t: "Copropriété", d: "Immeuble divisé en lots appartenant à plusieurs propriétaires. Chaque copropriétaire possède son lot privatif (son appartement) et une quote-part des parties communes (couloirs, toit, ascenseur…)." },
      { t: "Syndic", d: "Professionnel ou bénévole qui gère la copropriété au quotidien : il encaisse les charges, fait exécuter les travaux votés, tient les comptes et organise les assemblées générales." },
      { t: "Règlement de copropriété", d: "Document juridique officiel qui définit les règles de vie dans la copropriété, la répartition des charges et l'usage des parties communes et privatives. Il s'impose à tous les copropriétaires." },
      { t: "PV d'AG", d: "Procès-Verbal d'Assemblée Générale. Compte-rendu officiel des décisions votées par les copropriétaires lors de leur réunion annuelle : travaux, charges, litiges, élection du syndic." },
      { t: "Quote-part", d: "Pourcentage que chaque copropriétaire détient dans l'immeuble. Elle détermine le montant des charges qu'il paie et son nombre de voix lors des votes en AG." },
    ],
  },
  {
    cat: 'Charges & finances',
    color: '#7c3aed',
    bg: '#f5f3ff',
    items: [
      { t: "Charges de copropriété", d: "Frais mensuels ou trimestriels payés par chaque copropriétaire pour l'entretien des parties communes (ascenseur, gardien, jardinage, chauffage collectif, assurance de l'immeuble…)." },
      { t: "Appel de charges", d: "Document envoyé par le syndic qui demande le paiement des charges. Il permet de vérifier le montant réel des charges courantes que vous aurez à payer chaque trimestre." },
      { t: "Fonds de travaux", d: "Somme obligatoire mise de côté chaque année par la copropriété pour financer les futurs travaux importants. Un fonds bien provisionné rassure l'acheteur : pas de mauvaise surprise." },
      { t: "Fonds de roulement", d: "Réserve de trésorerie de la copropriété pour couvrir les dépenses courantes entre deux appels de charges. Exigé lors de l'achat, il équivaut à environ 2 mois de charges." },
      { t: "Impayés de copropriété", d: "Sommes dues par des copropriétaires qui ne paient pas leurs charges. Au-delà de 15% du budget, c'est un signal de mauvaise santé financière de la copropriété." },
    ],
  },
  {
    cat: 'Diagnostics obligatoires',
    color: '#0f2d3d',
    bg: '#f0f7fb',
    items: [
      { t: "DPE", d: "Diagnostic de Performance Énergétique. Note de A (très économe) à G (très énergivore) qui évalue la consommation d'énergie du logement. Un DPE F ou G peut fortement impacter la valeur et la revente du bien." },
      { t: "Diagnostic électricité", d: "Contrôle obligatoire pour les installations de plus de 15 ans. Repère les anomalies dangereuses. Des anomalies majeures peuvent entraîner des travaux coûteux à prévoir." },
      { t: "Diagnostic amiante", d: "Obligatoire pour les logements construits avant juillet 1997. Identifie la présence d'amiante dans le bâtiment. Un état dégradé en parties communes est un signal de risque." },
      { t: "Diagnostic termites", d: "Obligatoire dans les zones concernées. Détecte la présence de termites qui peuvent endommager la structure du bâtiment." },
      { t: "ERP", d: "État des Risques et Pollutions. Informe l'acheteur sur les risques naturels (inondations, séismes), technologiques (usines à proximité) et de pollution des sols du secteur." },
    ],
  },
  {
    cat: 'Documents techniques & entretien',
    color: '#d97706',
    bg: '#fffbeb',
    items: [
      { t: "DTG", d: "Diagnostic Technique Global. Bilan complet de l'état de l'immeuble et des travaux à prévoir sur 10 ans. Obligatoire dans certains cas, il donne une vision claire de la santé du bâtiment." },
      { t: "Carnet d'entretien", d: "Registre tenu par le syndic qui liste tous les travaux et interventions réalisés sur l'immeuble. Un carnet bien rempli témoigne d'une copropriété bien gérée." },
      { t: "Garantie décennale", d: "Assurance obligatoire que doivent souscrire les entrepreneurs pour les gros travaux. Elle couvre pendant 10 ans les malfaçons qui compromettent la solidité du bâtiment." },
    ],
  },
  {
    cat: 'Documents de vente',
    color: '#16a34a',
    bg: '#f0fdf4',
    items: [
      { t: "Compromis de vente", d: "Premier contrat signé entre vendeur et acheteur. Il engage les deux parties sous certaines conditions (obtention du prêt, par exemple). Après signature, 10 jours de rétractation pour l'acheteur." },
      { t: "Pré-état daté", d: "Document préparé par le syndic avant la vente qui informe l'acheteur sur les charges, les travaux votés et les procédures en cours dans la copropriété." },
      { t: "État daté", d: "Version officielle du pré-état daté, fournie au notaire le jour de la signature. Il fige la situation financière du lot vendu à la date de la transaction." },
      { t: "Fiche synthétique", d: "Document court qui résume les informations financières et techniques essentielles de la copropriété. Utile pour avoir une vision rapide avant d'entrer dans le détail." },
    ],
  },
];

const tips = [
  { color: '#d97706', bg: '#fffbeb', bord: '#fde68a', title: 'Points de vigilance', desc: "Un DPE classé F ou G peut impacter la valeur du bien. Les travaux votés en AG mais non réalisés sont à surveiller de près." },
  { color: '#16a34a', bg: '#f0fdf4', bord: '#bbf7d0', title: 'Documents à prioriser', desc: "PV d'AG, règlement de copropriété, DPE, diagnostic électricité et gaz, appels de charges — ce sont les documents les plus riches en informations." },
  { color: '#7c3aed', bg: '#f5f3ff', bord: '#ddd6fe', title: 'Vos rapports sont permanents', desc: 'Chaque rapport est sauvegardé définitivement dans votre espace. Consultez-le et téléchargez-le en PDF à tout moment.' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function SectionAnchor({ id }: { id: string }) {
  return <div id={id} style={{ position: 'relative', top: -20 }} />;
}

function GlossaireBlock() {
  const [openCat, setOpenCat] = useState<number | null>(0);
  const [openTerm, setOpenTerm] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {glossaire.map((cat, ci) => {
        const isOpen = openCat === ci;
        return (
          <div key={ci} style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 14, overflow: 'hidden' }}>
            <button
              onClick={() => { setOpenCat(isOpen ? null : ci); setOpenTerm(null); }}
              style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, background: isOpen ? cat.bg : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.25s ease' }}
            >
              <div style={{ width: 38, height: 38, borderRadius: 10, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BookOpen size={17} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{cat.cat}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{cat.items.length} termes expliqués simplement</div>
              </div>
              <ChevronDown size={18} style={{ color: cat.color, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', flexShrink: 0 }} />
            </button>

            {/* Conteneur animé : grid 0fr → 1fr pour animer la hauteur sans la connaître */}
            <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s ease' }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ padding: '4px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cat.items.map((item, ti) => {
                    const key = `${ci}-${ti}`;
                    const termOpen = openTerm === key;
                    return (
                      <div key={ti} style={{ background: termOpen ? cat.bg : '#f8fafc', borderRadius: 10, border: `1px solid ${termOpen ? cat.color + '40' : '#edf2f7'}`, overflow: 'hidden', transition: 'background 0.25s ease, border-color 0.25s ease' }}>
                        <button
                          onClick={() => setOpenTerm(termOpen ? null : key)}
                          style={{ width: '100%', padding: '11px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: termOpen ? cat.color : '#0f172a', transition: 'color 0.25s ease' }}>{item.t}</span>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', background: termOpen ? cat.color : '#e2e8f0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0, transition: 'background 0.25s ease, transform 0.3s ease', transform: termOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            {termOpen ? '−' : '+'}
                          </span>
                        </button>
                        {/* Animation fluide de la définition */}
                        <div style={{ display: 'grid', gridTemplateRows: termOpen ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }}>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ padding: '0 15px 14px', fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{item.d}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotationBlock() {
  const [activeTab, setActiveTab] = useState<'echelle' | 'bonus' | 'penalites'>('echelle');
  const tabs = [
    { id: 'echelle' as const, label: 'Échelle de notation', icon: TrendingUp },
    { id: 'bonus' as const, label: 'Bonus', icon: CheckCircle2 },
    { id: 'penalites' as const, label: 'Pénalités', icon: AlertTriangle },
  ];

  return (
    <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '22px 24px', background: 'linear-gradient(135deg, #0f2d3d, #1a4a60)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Star size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 3 }}>Comment nous calculons la note /20</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Transparence totale sur notre méthode</div>
        </div>
      </div>

      <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: '#f0f7fb', borderRadius: 12, border: '1px solid #bae3f5' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#2a7d9c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900, flexShrink: 0 }}>20</div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>On démarre toujours de la note maximale</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>Notre moteur d'analyse retire des points selon les risques détectés dans vos documents, et en ajoute pour les points positifs identifiés.</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, padding: '5px', background: '#f8fafc', borderRadius: 12, border: '1px solid #edf2f7' }} className="notation-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ flex: 1, padding: '11px 8px', borderRadius: 9, border: 'none', background: active ? '#fff' : 'transparent', color: active ? '#0f172a' : '#94a3b8', fontSize: 13, fontWeight: active ? 700 : 600, cursor: 'pointer', boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Icon size={14} />{tab.label}
              </button>
            );
          })}
        </div>

        <div key={activeTab} style={{ animation: 'tabFade 0.35s ease' }}>
          {activeTab === 'echelle' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 2 }}>Comment interpréter votre note :</div>
              {scale.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: s.bg, border: `1.5px solid ${s.bord}` }}>
                  <div style={{ minWidth: 90, fontSize: 17, fontWeight: 900, color: s.c }}>{s.r}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: s.c, marginBottom: 3 }}>{s.l}</div>
                    <div style={{ fontSize: 12.5, color: s.c, opacity: 0.85, lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'bonus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 4 }}>Ces éléments <strong>ajoutent</strong> des points à la note finale :</div>
              <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, overflow: 'hidden' }}>
                {bonuses.map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid #f0f5f9' : 'none' }}>
                    <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.4 }}>{b.l}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 11px', borderRadius: 7, flexShrink: 0, whiteSpace: 'nowrap' }}>{b.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'penalites' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 2 }}>Ces éléments <strong>retirent</strong> des points à la note finale :</div>
              {penalties.map((p, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '9px 16px', background: '#fef2f2', fontSize: 11.5, fontWeight: 800, color: '#dc2626', letterSpacing: '0.04em', borderBottom: '1px solid #fecaca' }}>{p.cat.toUpperCase()}</div>
                  {p.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '11px 16px', borderTop: j > 0 ? '1px solid #f0f5f9' : 'none' }}>
                      <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.4 }}>{item.l}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '4px 11px', borderRadius: 7, flexShrink: 0, whiteSpace: 'nowrap' }}>{item.v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: '13px 17px', background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 10, fontSize: 12.5, color: '#64748b', lineHeight: 1.6, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={15} style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }} />
          <span>La note est arrondie au 0,5 près et établie uniquement à partir des documents fournis. Elle ne remplace pas une visite du bien ni l'avis d'un professionnel.</span>
        </div>
      </div>
    </div>
  );
}

function EtapesBlock() {
  return (
    <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 3 }}>Comment ça marche</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>4 étapes simples pour analyser votre bien</div>
        </div>
      </div>
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {etapes.map((step, i) => (
          <div key={i} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, boxShadow: '0 4px 12px rgba(42,125,156,0.3)' }}>{step.num}</div>
              {i < etapes.length - 1 && <div style={{ width: 2, height: 28, background: 'linear-gradient(to bottom, #2a7d9c40, #e2e8f0)', margin: '4px 0' }} />}
            </div>
            <div style={{ paddingBottom: i < etapes.length - 1 ? 16 : 0, flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 5 }}>{step.title}</div>
              <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.65 }}>{step.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipsBlock() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
      {tips.map((tip, i) => (
        <div key={i} style={{ background: tip.bg, border: `1.5px solid ${tip.bord}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: tip.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lightbulb size={15} style={{ color: '#fff' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: tip.color }}>{tip.title}</div>
          </div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.65 }}>{tip.desc}</div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

export default function Aide() {
  const sections = [
    { id: 'comment', label: 'Comment ça marche', icon: Sparkles, color: '#2a7d9c' },
    { id: 'notation', label: 'Notation /20', icon: Star, color: '#0f2d3d' },
    { id: 'glossaire', label: 'Le jargon immo, traduit', icon: BookOpen, color: '#7c3aed' },
    { id: 'conseils', label: 'Conseils & astuces', icon: Lightbulb, color: '#d97706' },
  ];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.35s ease both' }}>
      <style>{`
        @keyframes tabFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 860px) {
          .docs-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .aide-sommaire-grid { grid-template-columns: 1fr 1fr !important; }
          .notation-tabs { flex-direction: column !important; }
        }
      `}</style>

      {/* INTRO */}
      <p style={{ fontSize: 14, color: '#64748b', margin: '0', lineHeight: 1.5 }}>Tout comprendre sur Verimo et notre méthode d'analyse</p>

      {/* CONSEIL VERIMO EN HAUT */}
      <div style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1.5px solid #fed7aa', borderRadius: 16, padding: '24px 28px', boxShadow: '0 4px 16px rgba(217,119,6,0.08)' }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(217,119,6,0.3)' }}>
            <Lightbulb size={22} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#92400e', marginBottom: 6 }}>💡 Conseil important Verimo</div>
            <div style={{ fontSize: 14, color: '#78350f', lineHeight: 1.65 }}>
              <strong>Plus vous fournissez de documents, plus la note /20 sera précise et le rapport détaillé.</strong> Voici les documents qui permettent à notre moteur d'analyse de couvrir tous les aspects d'un bien, selon votre cas :
            </div>
          </div>
        </div>

        <div className="docs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* COLONNE COPRO */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #fed7aa', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #fef3c7' }}>
              <span style={{ fontSize: 22 }}>🏢</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Appartement ou maison en copropriété</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Bien régi par un syndic et une AG</div>
              </div>
            </div>

            {/* Indispensables copro */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d', letterSpacing: '0.04em' }}>INDISPENSABLES</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  'Les 3 derniers PV d\'AG',
                  'Le règlement de copropriété (et ses modificatifs)',
                  'Le DPE',
                  'Les diagnostics obligatoires selon l\'âge du bien',
                ].map((t, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 8, width: 4, height: 4, borderRadius: '50%', background: '#16a34a' }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommandés copro */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={11} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.04em' }}>POUR ENRICHIR L'ANALYSE</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  'Les appels de charges récents',
                  'Le pré-état daté ou l\'état daté',
                  'La fiche synthétique de copropriété',
                  'Le carnet d\'entretien',
                  'Le DTG (Diagnostic Technique Global)',
                  'Le compromis de vente (si l\'achat est engagé)',
                ].map((t, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 8, width: 4, height: 4, borderRadius: '50%', background: '#2a7d9c' }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* COLONNE MAISON */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #fed7aa', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #fef3c7' }}>
              <span style={{ fontSize: 22 }}>🏠</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Maison individuelle</div>
                <div style={{ fontSize: 11.5, color: '#94a3b8' }}>Bien en pleine propriété, hors copropriété</div>
              </div>
            </div>

            {/* Indispensables maison */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d', letterSpacing: '0.04em' }}>INDISPENSABLES</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {([
                  'Le DPE',
                  { main: 'L\'audit énergétique', note: ' (obligatoire si DPE classé E, F ou G*)' },
                  'Les diagnostics obligatoires selon l\'âge du bien (électricité, gaz, amiante, plomb, termites, ERP)',
                ] as (string | { main: string; note: string })[]).map((t, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 8, width: 4, height: 4, borderRadius: '50%', background: '#16a34a' }} />
                    {typeof t === 'string' ? t : <><strong style={{ color: '#374151' }}>{t.main}</strong><span style={{ color: '#64748b', fontStyle: 'italic' }}>{t.note}</span></>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommandés maison */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkles size={11} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.04em' }}>POUR ENRICHIR L'ANALYSE</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  'Les justificatifs de travaux récents (toiture, chauffage, isolation…)',
                  'Les garanties décennales en cours',
                  'Les documents d\'urbanisme (cadastre, PLU, servitudes éventuelles)',
                  'La taxe foncière',
                  'Le compromis de vente (si l\'achat est engagé)',
                ].map((t, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, paddingLeft: 14, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, top: 8, width: 4, height: 4, borderRadius: '50%', background: '#2a7d9c' }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Note audit énergétique */}
        <div style={{ marginTop: 16, padding: '14px 18px', background: 'rgba(255,255,255,0.6)', border: '1px solid #fed7aa', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Info size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.6 }}>
            <strong>*À propos de l'audit énergétique :</strong> depuis la <strong>loi Climat et Résilience</strong>, il est obligatoire pour la vente d'une maison individuelle (ou monopropriété) classée <strong>E, F ou G</strong> au DPE. Ce document complète le DPE avec un scénario chiffré de travaux à réaliser pour améliorer la performance énergétique du bien. Les appartements en copropriété ne sont pas concernés.
          </div>
        </div>
      </div>

      {/* SOMMAIRE */}
      <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 16, padding: '20px 22px' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.12em', marginBottom: 14 }}>SOMMAIRE</div>
        <div className="aide-sommaire-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.id} onClick={() => scrollTo(s.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: '14px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' as const }}
                onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0f7fb'; el.style.borderColor = '#bae3f5'; el.style.transform = 'translateY(-1px)'; }}
                onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f8fafc'; el.style.borderColor = '#edf2f7'; el.style.transform = 'translateY(0)'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={15} style={{ color: '#fff' }} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION : COMMENT ÇA MARCHE */}
      <SectionAnchor id="comment" />
      <EtapesBlock />

      {/* SECTION : NOTATION */}
      <SectionAnchor id="notation" />
      <NotationBlock />

      {/* SECTION : GLOSSAIRE */}
      <SectionAnchor id="glossaire" />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={17} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Le jargon immo, traduit</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>22 termes essentiels, expliqués simplement</div>
          </div>
        </div>
        <GlossaireBlock />
      </div>

      {/* SECTION : CONSEILS */}
      <SectionAnchor id="conseils" />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Lightbulb size={17} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Conseils & astuces</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Pour tirer le meilleur de Verimo</div>
          </div>
        </div>
        <TipsBlock />
      </div>

      {/* CTA SUPPORT */}
      <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 16, padding: '24px 26px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f0f7fb', border: '1px solid #bae3f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LifeBuoy size={22} style={{ color: '#2a7d9c' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>Une question ?</div>
          <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>Notre équipe est là pour vous accompagner à chaque étape.</div>
        </div>
        <Link to="/dashboard/support" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 11, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 13.5, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 12px rgba(42,125,156,0.25)', whiteSpace: 'nowrap' }}>
          Contacter le support <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
