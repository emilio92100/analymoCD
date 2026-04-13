import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DiagDetailParserExport } from './DiagnosticCard';

// Couleurs hardcodées (pas de CSS vars — compatibilité RapportPage)
const C = {
  bg: '#ffffff',
  bgSecondary: '#f8fafc',
  border: '#e2e8f0',
  text: '#0f172a',
  textSec: '#64748b',
  green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#16a34a' },
  red: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#dc2626' },
  orange: { bg: '#fff7ed', border: '#fed7aa', text: '#92400e', dot: '#f97316' },
  blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' },
  gray: { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', dot: '#94a3b8' },
  dark: '#0f2d3d',
};

function formatEtage(etage: string | null | undefined): string | null {
  if (!etage) return null;
  const s = String(etage).trim();
  if (/^-?\d+$/.test(s)) {
    const n = parseInt(s);
    if (n === 0) return 'Rez-de-chaussée';
    if (n < 0) return `${Math.abs(n)}${Math.abs(n) === 1 ? 'er' : 'ème'} sous-sol`;
    return `${n}${n === 1 ? 'er' : 'ème'} étage`;
  }
  return s;
}


function formatDate(val: string | null | undefined): string | null {
  if (!val) return null;
  const s = String(val).trim();
  // YYYY-MM-DD
  const full = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) {
    const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    return `${parseInt(full[3])} ${mois[parseInt(full[2]) - 1]} ${full[1]}`;
  }
  // YYYY-MM
  const partial = s.match(/^(\d{4})-(\d{2})$/);
  if (partial) {
    const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    return `${mois[parseInt(partial[2]) - 1]} ${partial[1]}`;
  }
  // DD/MM/YYYY ou DD/MM/YY
  const dmy = s.match(/^(\d{1,2})\/(\d{2})\/(\d{2,4})$/);
  if (dmy) {
    const mois = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${parseInt(dmy[1])} ${mois[parseInt(dmy[2]) - 1]} ${year}`;
  }
  // Déjà lisible — retourner tel quel
  return s;
}

const DPE_COLORS: Record<string, string> = {
  A: '#16a34a', B: '#22c55e', C: '#84cc16', D: '#eab308', E: '#f97316', F: '#ef4444', G: '#991b1b'
};

// ── Composants communs ──────────────────────────────────────

function Header({ type, titre, sub }: { type: string; titre: string; sub?: string }) {
  return (
    <div style={{ background: C.dark, borderRadius: 14, padding: '22px 28px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' as const }}>{type}</div>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: sub ? 6 : 0, lineHeight: 1.3 }}>{titre}</div>
      {sub && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{sub}</div>}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ label, color }: { label: string; color: string }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10, background: C.bgSecondary }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{label}</div>
    </div>
  );
}

function Resume({ text }: { text: string }) {
  return (
    <Card>
      <div style={{ padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' as const }}>Résumé</div>
        <div style={{ fontSize: 15, color: C.text, lineHeight: 1.8 }}>{text}</div>
      </div>
    </Card>
  );
}

function KpiGrid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>{children}</div>;
}

function TooltipIcon({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <span
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible(v => !v)}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: '#334155', fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'help', flexShrink: 0, userSelect: 'none' as const }}
      >ℹ</span>
      {visible && (
        <span style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#f1f5f9', fontSize: 12, lineHeight: 1.6, padding: '10px 14px', borderRadius: 10, width: 260, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', whiteSpace: 'normal' as const, pointerEvents: 'none' as const }}>
          {text}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: 6, borderStyle: 'solid', borderColor: '#0f172a transparent transparent transparent' }} />
        </span>
      )}
    </span>
  );
}

function Kpi({ label, value, sub, color, tooltip }: { label: string; value: string; sub?: string; color?: string; tooltip?: string }) {
  return (
    <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ fontSize: 12, color: C.textSec, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
        {label}
        {tooltip && <TooltipIcon text={tooltip} />}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: color || C.text, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function InfoRow({ label, value, alt, valueColor }: { label: string; value: string; alt?: boolean; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: `0.5px solid ${C.border}`, background: alt ? C.bgSecondary : C.bg }}>
      <span style={{ fontSize: 14, color: C.textSec }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: valueColor || C.text }}>{value}</span>
    </div>
  );
}

function TableHeader({ cols }: { cols: { label: string; align?: 'left' | 'right' | 'center' }[] }) {
  return (
    <tr style={{ background: C.bgSecondary }}>
      {cols.map((c, i) => (
        <th key={i} style={{ padding: '10px 20px', textAlign: c.align || 'left', fontSize: 12, fontWeight: 600, color: C.textSec, borderBottom: `0.5px solid ${C.border}` }}>{c.label}</th>
      ))}
    </tr>
  );
}

function stripLeadingEmoji(text: string): string {
  return text.replace(/^[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FEFF}⚠️ℹ️✓✅❌🔴🟠🟡🟢⚠ℹ]+\s*/u, '').trim();
}

function PointsFortsVigilances({ forts, vigilances }: { forts: string[]; vigilances: string[] }) {
  if (!forts?.length && !vigilances?.length) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      {forts?.length > 0 && (
        <div style={{ background: '#f0fdf4', border: `0.5px solid #bbf7d0`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: `0.5px solid #bbf7d0`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, letterSpacing: '0.05em' }}>POINTS POSITIFS</div>
          </div>
          {forts.map((p, i) => (
            <div key={i} style={{ padding: '12px 20px', borderBottom: i < forts.length - 1 ? `0.5px solid #bbf7d0` : 'none', background: i % 2 === 0 ? '#f0fdf4' : '#f7fef9', fontSize: 14, color: C.text, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span>{stripLeadingEmoji(p)}</span>
            </div>
          ))}
        </div>
      )}
      {vigilances?.length > 0 && (
        <div style={{ background: '#fef2f2', border: `0.5px solid #fecaca`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: `0.5px solid #fecaca`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }} />
            <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, letterSpacing: '0.05em' }}>POINTS DE VIGILANCE</div>
          </div>
          {vigilances.map((p, i) => (
            <div key={i} style={{ padding: '12px 20px', borderBottom: i < vigilances.length - 1 ? `0.5px solid #fecaca` : 'none', background: i % 2 === 0 ? '#fef2f2' : '#fff5f5', fontSize: 14, color: C.text, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ color: '#dc2626', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>⚠</span>
              <span>{stripLeadingEmoji(p)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AvisVerimo({ text }: { text: string }) {
  return (
    <div style={{ background: C.dark, borderRadius: 12, padding: '22px 28px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 12, textTransform: 'uppercase' as const }}>Avis Verimo</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', lineHeight: 1.8 }}>{text}</div>
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
        Pour une vision complète de votre futur bien, lancez une{' '}
        <Link to="/dashboard/nouvelle-analyse" style={{ color: '#7dd3fc', textDecoration: 'none', fontWeight: 600 }}>Analyse Complète</Link>.
      </div>
    </div>
  );
}

function DpeJauge({ classe, label, valeur }: { classe: string; label: string; valeur?: string }) {
  const classes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  return (
    <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '20px', flex: 1 }}>
      <div style={{ fontSize: 13, color: C.textSec, marginBottom: 16, fontWeight: 500 }}>{label}</div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 56, marginBottom: 12 }}>
        {classes.map((c, i) => {
          const active = c === classe;
          const h = 28 + i * 4;
          return (
            <div key={c} style={{ flex: 1, height: active ? 56 : h, borderRadius: 5, background: active ? DPE_COLORS[c] : `${DPE_COLORS[c]}28`, border: active ? `2px solid ${DPE_COLORS[c]}` : `1px solid ${DPE_COLORS[c]}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: active ? 14 : 11, fontWeight: 600, color: active ? '#fff' : DPE_COLORS[c] }}>{c}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: C.textSec }}>{valeur}</span>
        {classe && (
          <span style={{ fontSize: 13, fontWeight: 600, color: DPE_COLORS[classe], background: `${DPE_COLORS[classe]}18`, padding: '3px 12px', borderRadius: 100, border: `1px solid ${DPE_COLORS[classe]}44` }}>
            Classe {classe}
          </span>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CarrezAccordeon({ pieces, piecesHorsCarrez, annexes }: { pieces: any[]; piecesHorsCarrez?: any[]; annexes?: any[] }) {
  const [open, setOpen] = useState(false);
  const hasExtras = (piecesHorsCarrez?.length || 0) > 0 || (annexes?.length || 0) > 0;
  const annexeIcon = (type: string) => type === 'balcon' ? '🌿' : type === 'terrasse' ? '☀️' : type === 'jardin' ? '🌳' : type === 'cave' ? '🔒' : type === 'parking' ? '🚗' : '📐';
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: '100%', background: C.bgSecondary, border: 'none', padding: '12px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2a7d9c', fontFamily: 'inherit', textAlign: 'left' as const, fontWeight: 500 }}
      >
        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', fontSize: 10 }}>▶</span>
        {open ? 'Masquer le détail' : 'Voir le détail par pièce'}
      </button>
      {open && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {pieces.map((p: any, i: number) => (
              <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                <td style={{ padding: '10px 20px', fontSize: 14, color: C.text }}>{p.piece}</td>
                <td style={{ padding: '10px 20px', fontSize: 14, fontWeight: 500, color: C.text, textAlign: 'right' as const }}>{p.surface} m²</td>
              </tr>
            ))}
            {hasExtras && (
              <tr style={{ background: C.bgSecondary }}>
                <td colSpan={2} style={{ padding: '8px 20px', fontSize: 11, fontWeight: 600, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Surfaces non comptabilisées dans la surface {pieces.length > 0 ? 'Carrez' : ''}</td>
              </tr>
            )}
            {piecesHorsCarrez?.map((p: any, i: number) => (
              <tr key={`hc-${i}`} style={{ borderBottom: `0.5px solid ${C.border}`, background: C.bgSecondary }}>
                <td style={{ padding: '10px 20px', fontSize: 14, color: C.textSec, fontStyle: 'italic' as const }}>{p.piece} <span style={{ fontSize: 11 }}>(hors surface légale)</span></td>
                <td style={{ padding: '10px 20px', fontSize: 14, color: C.textSec, textAlign: 'right' as const, fontStyle: 'italic' as const }}>{p.surface} m²</td>
              </tr>
            ))}
            {annexes?.map((a: any, i: number) => (
              <tr key={`ann-${i}`} style={{ borderBottom: i < (annexes.length - 1) ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bgSecondary : C.bg }}>
                <td style={{ padding: '10px 20px', fontSize: 14, color: C.textSec }}>{annexeIcon(a.type)} {a.type.charAt(0).toUpperCase() + a.type.slice(1)}</td>
                <td style={{ padding: '10px 20px', fontSize: 14, color: C.textSec, textAlign: 'right' as const }}>{a.surface ? `${a.surface} m²` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SeparateurSynthese() {
  return (
    <div style={{ margin: '24px 0 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec, letterSpacing: '0.1em', whiteSpace: 'nowrap' as const }}>SYNTHÈSE</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}



// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagnosticCardRow({ d }: { d: any }) {
  const [open, setOpen] = useState(false);
  const isOk = d.presence === 'conforme' || d.presence === 'non_detecte' || d.presence === 'non_applicable';
  const isAnomalie = d.presence === 'anomalie';
  const rowBg = isOk ? C.green.bg : isAnomalie ? C.red.bg : C.bg;
  const rowBorder = isOk ? C.green.border : isAnomalie ? C.red.border : C.border;
  const badgeColor = isOk ? C.green.text : isAnomalie ? C.red.text : C.gray.text;
  const badgeBg = isOk ? C.green.bg : isAnomalie ? C.red.bg : C.gray.bg;
  const badgeBorder = isOk ? C.green.border : isAnomalie ? C.red.border : C.gray.border;
  const badgeLabel = isOk
    ? (d.presence === 'conforme' ? '✓ Conforme' : d.presence === 'non_applicable' ? 'Non applicable' : '✓ Non détecté')
    : isAnomalie ? '⚠ Anomalie détectée'
    : 'Informatif';

  return (
    <div style={{ border: `0.5px solid ${rowBorder}`, borderRadius: 12, overflow: 'hidden', marginBottom: 8, background: rowBg }}>
      {/* Ligne principale */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</div>
          {d.alerte && <div style={{ fontSize: 13, color: C.red.dot, marginTop: 4, fontWeight: 500 }}>⚠ {d.alerte}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: badgeColor, background: badgeBg, border: `0.5px solid ${badgeBorder}`, padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap' as const }}>{badgeLabel}</span>
          {d.detail && (
            <button onClick={() => setOpen(!open)} style={{ background: 'none', border: `0.5px solid ${C.border}`, borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 12, color: '#2a7d9c', fontFamily: 'inherit', fontWeight: 500, whiteSpace: 'nowrap' as const, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', fontSize: 9 }}>▶</span>
              {open ? 'Masquer' : 'Voir le détail'}
            </button>
          )}
        </div>
      </div>
      {/* Détail pleine largeur */}
      {open && d.detail && (
        <div style={{ borderTop: `0.5px solid ${rowBorder}`, padding: '16px 20px', background: C.bg }}>
          <DiagnosticCardDetail d={d} />
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagnosticCardDetail({ d }: { d: any }) {
  const type = (d.type || '').toUpperCase() as 'DPE' | 'AMIANTE' | 'TERMITES' | 'PLOMB' | 'ELECTRICITE' | 'GAZ' | 'ERP' | 'CARREZ' | 'AUTRE';
  return <DiagDetailParserExport text={d.detail} type={type} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererDDT({ r }: { r: any }) {
  const diags = r.diagnostics || [];
  const lotsIdf = r.lots_identifies || [];
  const sub = [r.diagnostiqueur?.nom ? `Diagnostiqueur : ${r.diagnostiqueur.nom}` : null, r.diagnostiqueur?.date ? `le ${formatDate(r.diagnostiqueur.date)}` : null].filter(Boolean).join(' · ');

  // Trier diagnostics
  const diagsOk = diags.filter((d: any) => d.presence === 'conforme' || d.presence === 'non_detecte' || d.presence === 'non_applicable');
  const diagsBad = diags.filter((d: any) => d.presence === 'anomalie');
  const diagsInfo = diags.filter((d: any) => !['conforme','non_detecte','non_applicable','anomalie'].includes(d.presence));

  // Récap statut pour encart
  const diagStatut = (d: any) => {
    if (d.presence === 'anomalie') return { icon: '🔴', color: C.red.text };
    if (d.presence === 'conforme' || d.presence === 'non_detecte') return { icon: '✅', color: C.green.text };
    if (d.presence === 'non_applicable') return { icon: '➖', color: C.gray.text };
    return { icon: 'ℹ️', color: C.gray.text };
  };

  const lotIcon = (type: string) => type === 'cave' ? '🔒' : type === 'parking' || type === 'garage' ? '🚗' : type === 'grenier' || type === 'combles' ? '📦' : '🏠';

  return (
    <div>
      <Header type="Dossier de Diagnostic Technique" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      {/* 3 encarts d'info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>

        {/* Encart 1 — Diagnostiqueur */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🔬 Diagnostiqueur</div>
          {r.diagnostiqueur?.nom && <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{r.diagnostiqueur.nom}</div>}
          {r.diagnostiqueur?.date && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 3 }}>📅 Réalisé le {formatDate(r.diagnostiqueur.date)}</div>}
          {r.diagnostiqueur?.certification && <div style={{ fontSize: 12, color: C.textSec, marginBottom: 3 }}>🎖 {r.diagnostiqueur.certification}</div>}
        </div>

        {/* Encart 2 — Lots visités */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🏘 Lots visités</div>
          {lotsIdf.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {lotsIdf.map((lot: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{lotIcon(lot.type)}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                      {lot.type.charAt(0).toUpperCase() + lot.type.slice(1)}{lot.numero ? ` n°${lot.numero}` : ''}
                    </div>
                    {(lot.etage || lot.description) && <div style={{ fontSize: 12, color: C.textSec }}>{formatEtage(lot.etage) || lot.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            r.carrez?.surface_totale && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🏠</span>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Appartement — {r.carrez.surface_totale} m²</div>
              </div>
            )
          )}
        </div>

        {/* Encart 3 — Récap diagnostics */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>📋 Diagnostics réalisés</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            {diags.map((d: any, i: number) => {
              const s = diagStatut(d);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.text, flex: 1, lineHeight: 1.4 }}>{d.label}</span>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{s.icon}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DPE + GES */}
      {r.dpe?.classe && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
          <DpeJauge classe={r.dpe.classe} label="Énergie primaire (DPE)" valeur={r.dpe.kwh_m2 ? `${r.dpe.kwh_m2} kWh/m²/an` : ''} />
          {r.dpe.ges_classe && <DpeJauge classe={r.dpe.ges_classe} label="Émissions GES" valeur={r.dpe.ges_kg_m2 ? `${r.dpe.ges_kg_m2} kg CO₂/m²/an` : ''} />}
        </div>
      )}

      {/* Surface Carrez */}
      {r.carrez?.surface_totale && (() => {
        const label = r.carrez.surface_type === 'boutin' ? 'Surface habitable (Loi Boutin)'
          : r.carrez.surface_type === 'autre' ? 'Surface mesurée'
          : 'Surface loi Carrez';
        const piecesCarrez = (r.carrez.pieces || []).filter((p: any) => !p.hors_carrez);
        const piecesHorsCarrez = (r.carrez.pieces || []).filter((p: any) => p.hors_carrez);
        const annexes = r.carrez.annexes || [];
        return (
          <Card>
            <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.textSec }}>{label}</span>
              <span style={{ fontSize: 24, fontWeight: 600, color: C.text }}>{r.carrez.surface_totale} m²</span>
            </div>
            {(piecesCarrez.length > 0 || piecesHorsCarrez.length > 0 || annexes.length > 0) && (
              <CarrezAccordeon pieces={piecesCarrez} piecesHorsCarrez={piecesHorsCarrez} annexes={annexes} />
            )}
          </Card>
        );
      })()}

      {/* Diagnostics — ligne par ligne, verts puis rouges puis informatifs */}
      {diags.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {diagsOk.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.green.text, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green.dot }} />
                Conformes / Non détectés
              </div>
              {diagsOk.map((d: any, i: number) => <DiagnosticCardRow key={i} d={d} />)}
            </div>
          )}
          {diagsBad.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.red.text, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.red.dot }} />
                Anomalies détectées
              </div>
              {diagsBad.map((d: any, i: number) => <DiagnosticCardRow key={i} d={d} />)}
            </div>
          )}
          {diagsInfo.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.gray.text, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.gray.dot }} />
                Informatifs
              </div>
              {diagsInfo.map((d: any, i: number) => <DiagnosticCardRow key={i} d={d} />)}
            </div>
          )}
        </div>
      )}

      {/* Travaux préconisés — uniquement si DPE présent */}
      {r.travaux_preconises?.length > 0 && r.dpe?.classe && (
        <Card>
          <CardHeader label="TRAVAUX RECOMMANDÉS PAR LE DPE" color="#d97706" />
          {r.travaux_preconises.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < r.travaux_preconises.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
              <div>
                <div style={{ fontSize: 14, color: C.text }}>{t.label}</div>
                <div style={{ fontSize: 12, color: t.priorite === 'prioritaire' ? '#dc2626' : '#d97706', marginTop: 4 }}>{t.priorite === 'prioritaire' ? 'Prioritaire' : 'Recommandé'}</div>
              </div>
              {(t.cout_min || t.cout_max) && (
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' as const, marginLeft: 20 }}>
                  {t.cout_min && t.cout_max ? `${Number(t.cout_min).toLocaleString('fr-FR')} – ${Number(t.cout_max).toLocaleString('fr-FR')} €` : `${Number(t.cout_min || t.cout_max).toLocaleString('fr-FR')} €`}
                </div>
              )}
            </div>
          ))}
          {r.gain_energetique && (
            <div style={{ padding: '12px 20px', background: '#f0f9ff', borderTop: `0.5px solid #bae6fd`, fontSize: 13, color: '#0369a1' }}>
              {r.gain_energetique}
            </div>
          )}
        </Card>
      )}

      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererPVAG({ r }: { r: any }) {
  const sub = [r.date_ag, r.quorum?.presents && r.quorum?.total ? `${r.quorum.presents}/${r.quorum.total} copropriétaires · ${r.quorum.tantiemes_pct}` : null].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="Procès-Verbal d'Assemblée Générale" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      <KpiGrid>
        {r.budget_vote?.montant && <Kpi label={r.budget_vote.annee ? `Budget voté pour ${r.budget_vote.annee}` : 'Budget voté'} value={`${Number(r.budget_vote.montant).toLocaleString('fr-FR')} €`} sub={r.budget_precedent?.montant && r.budget_precedent?.annee ? `vs ${Number(r.budget_precedent.montant).toLocaleString('fr-FR')} € en ${r.budget_precedent.annee}` : undefined} />}
        {r.syndic && <Kpi label="Syndic" value={r.syndic} />}
        {r.quorum?.tantiemes_pct && <Kpi label="Quorum (% tantièmes)" value={String(r.quorum.tantiemes_pct).replace('%','').trim() + ' %'} color="#16a34a" sub={r.quorum.presents && r.quorum.total ? `${r.quorum.presents}/${r.quorum.total} copropriétaires présents` : undefined} tooltip="Le quorum est le pourcentage de tantièmes représentés à l'assemblée générale. Il détermine si les décisions votées sont valides. Un quorum faible peut fragiliser certains votes." />}
      </KpiGrid>

      {r.travaux_votes?.length > 0 && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="TRAVAUX VOTÉS" color={C.blue.dot} />
          <div style={{ padding: '10px 20px', background: C.blue.bg, borderBottom: `0.5px solid ${C.blue.border}`, fontSize: 13, color: C.blue.text }}>
            ℹ Votés avant compromis = à la charge du vendeur. À vérifier avec votre notaire.
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {r.travaux_votes.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < r.travaux_votes.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
              <div>
                <div style={{ fontSize: 14, color: C.text }}>{t.label}</div>
                {t.echeance && <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{t.echeance}</div>}
              </div>
              {t.montant && <div style={{ fontSize: 15, fontWeight: 600, color: C.blue.dot, whiteSpace: 'nowrap' as const, marginLeft: 20 }}>{Number(t.montant).toLocaleString('fr-FR')} €</div>}
            </div>
          ))}
        </div>
      )}

      {(() => { const travCopro = (r.travaux_evoques || []).filter((t: any) => !t.concerne_lot_prive); return travCopro.length > 0 && (
        <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="TRAVAUX ÉVOQUÉS — NON ENCORE VOTÉS" color={C.orange.dot} />
          <div style={{ padding: '10px 20px', background: '#fff7ed', borderBottom: `0.5px solid ${C.orange.border}`, fontSize: 13, color: C.orange.text }}>
            ⚠ Mentionnés sans vote. S'ils sont votés après votre achat, vous en supporterez la charge en tant que nouveau copropriétaire.
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {travCopro.map((t: any, i: number) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < travCopro.length - 1 ? `0.5px solid ${C.orange.border}` : 'none', background: i % 2 === 0 ? C.orange.bg : '#fffbf5' }}>
              <div style={{ fontSize: 14, color: C.text }}>{t.label}</div>
              {t.precision && <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{t.precision}</div>}
            </div>
          ))}
        </div>
      ); })()}

      {r.questions_diverses?.length > 0 && (
        <Card>
          <CardHeader label="QUESTIONS DIVERSES NOTABLES" color={C.gray.dot} />
          {r.questions_diverses.map((q: any, i: number) => (
            <div key={i} style={{ padding: '12px 20px', borderBottom: i < r.questions_diverses.length - 1 ? `0.5px solid ${C.border}` : 'none', fontSize: 14, color: C.text, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>{typeof q === 'string' ? q : q.label || q.detail || JSON.stringify(q)}</div>
          ))}
        </Card>
      )}

      {r.procedures?.length > 0 && (
        <div style={{ background: C.red.bg, border: `0.5px solid ${C.red.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="PROCÉDURES / LITIGES MENTIONNÉS" color={C.red.dot} />
          {r.procedures.map((p: any, i: number) => (
            <div key={i} style={{ padding: '12px 20px', fontSize: 14, color: C.text, borderBottom: i < r.procedures.length - 1 ? `0.5px solid ${C.red.border}` : 'none' }}>{typeof p === 'string' ? p : p.label || p.message || p.detail || JSON.stringify(p)}</div>
          ))}
        </div>
      )}

      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererAppelCharges({ r }: { r: any }) {
  const lots = r.lots || [];
  const lotIcon = (type: string) => type === 'cave' ? '🔒' : type === 'parking' || type === 'garage' ? '🚗' : type === 'grenier' || type === 'combles' ? '📦' : '🏠';

  return (
    <div>
      {/* Header avec lots en badges */}
      <div style={{ background: C.dark, borderRadius: 14, padding: '22px 28px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' as const }}>Appel de Charges / Appel de Fonds</div>
        <div style={{ fontSize: 19, fontWeight: 600, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{r.titre}</div>
        {r.periode && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: lots.length > 0 ? 10 : 0 }}>{r.periode}</div>}
        {lots.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', alignSelf: 'center', marginRight: 2 }}>Lots concernés :</span>
            {lots.map((lot: any, i: number) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                {lotIcon(lot.type)} {lot.type.charAt(0).toUpperCase() + lot.type.slice(1)}{lot.numero ? ` n°${lot.numero}` : ''}{lot.etage ? ` · ${formatEtage(lot.etage)}` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      <Resume text={r.resume} />

      {/* Alerte impayé si présente */}
      {r.alerte_impaye && (
        <div style={{ background: C.red.bg, border: `0.5px solid ${C.red.border}`, borderRadius: 12, padding: '14px 18px', marginBottom: 14, fontSize: 13, color: C.red.text, lineHeight: 1.6 }}>
          ⚠ {r.alerte_impaye}
        </div>
      )}

      {/* Encart syndic */}
      <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🏢 Syndic</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 16 }}>
          {r.syndic && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>👤</span><span style={{ fontWeight: 600 }}>{r.syndic}</span></div>}
          {r.syndic_adresse && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📍</span><span>{r.syndic_adresse}</span></div>}
          {r.syndic_gestionnaire && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>👩‍💼</span><span>Gestionnaire : {r.syndic_gestionnaire}</span></div>}
          {r.reference_dossier && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📋</span><span>Réf. : {r.reference_dossier}</span></div>}
          {r.echeance && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📅</span><span>Échéance : {r.echeance}</span></div>}
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid>
        {r.montant_trimestre && <Kpi label="Appel pour ce trimestre" value={`${Number(r.montant_trimestre).toLocaleString('fr-FR')} €`} />}
        {r.montant_mensuel && <Kpi label="Charges mensuelles" value={`${Number(r.montant_mensuel).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="/ mois" />}
        {r.montant_annuel && <Kpi label="Charges annuelles estimées" value={`${Number(r.montant_annuel).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="× 4 trimestres" />}
      </KpiGrid>

      {/* Décomposition par lot */}
      {lots.length > 0 && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="DÉCOMPOSITION PAR LOT" color={C.blue.dot} />
          {[...lots].sort((a: any, b: any) => {
              const order = (t: string) => t === 'appartement' ? 0 : t === 'grenier' || t === 'combles' ? 1 : t === 'cave' ? 2 : t === 'parking' || t === 'garage' ? 3 : 4;
              return order(a.type) - order(b.type);
            }).map((lot: any, li: number) => (
            <div key={li} style={{ borderBottom: li < lots.length - 1 ? `0.5px solid ${C.border}` : 'none' }}>
              {/* En-tête du lot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', background: C.bgSecondary }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{lotIcon(lot.type)}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                      {lot.type.charAt(0).toUpperCase() + lot.type.slice(1)}{lot.numero ? ` n°${lot.numero}` : ''}
                    </div>
                    <div style={{ fontSize: 12, color: C.textSec }}>
                      {[lot.escalier ? `Escalier ${lot.escalier}` : null, formatEtage(lot.etage)].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </div>
                {lot.total_trimestre && (
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: C.blue.dot, whiteSpace: 'nowrap' as const }}>{Number(lot.total_trimestre).toLocaleString('fr-FR')} €</div>
                    <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>ce trimestre</div>
                  </div>
                )}
              </div>
              {/* Postes du lot */}
              {lot.postes?.map((p: any, pi: number) => (
                <div key={pi} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 10px 50px', borderTop: `0.5px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, color: C.text }}>{p.label}</div>
                    {p.tantiemes && p.base_tantiemes && (
                      <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>{p.tantiemes} tantièmes / {p.base_tantiemes}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' as const, flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.trimestre ? `${Number(p.trimestre).toLocaleString('fr-FR')} €` : '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Fallback si pas de lots structurés — ancienne décomposition plate */}
      {lots.length === 0 && r.decomposition?.length > 0 && (
        <Card>
          <CardHeader label="DÉCOMPOSITION DE L'APPEL" color={C.blue.dot} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Poste' }, { label: 'Trimestre', align: 'right' }, { label: 'Annuel estimé', align: 'right' }]} /></thead>
            <tbody>
              {r.decomposition.map((d: any, i: number) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{d.poste}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: C.text, textAlign: 'right' as const }}>{d.trimestre ? `${Number(d.trimestre).toLocaleString('fr-FR')} €` : '—'}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.textSec, textAlign: 'right' as const }}>{d.annuel ? `${Number(d.annuel).toLocaleString('fr-FR')} €` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererRCP({ r }: { r: any }) {
  const sub = [r.date_reglement ? `Établi en ${r.date_reglement}` : null, r.modificatifs?.length ? `${r.modificatifs.length} modificatif(s)` : null].filter(Boolean).join(' · ');
  const usageLabel = r.usage === 'habitation' ? 'Habitation' : r.usage === 'mixte' ? 'Mixte' : r.usage === 'commercial' ? 'Commercial' : null;
  const totalAnnexes = (r.lots_caves || 0) + (r.lots_parkings || 0) + (r.lots_commerces || 0);
  const annexesDetail = [r.lots_caves ? `${r.lots_caves} cave${r.lots_caves > 1 ? 's' : ''}` : null, r.lots_parkings ? `${r.lots_parkings} parking${r.lots_parkings > 1 ? 's' : ''}` : null, r.lots_commerces ? `${r.lots_commerces} commerce${r.lots_commerces > 1 ? 's' : ''}` : null].filter(Boolean).join(', ');

  const statutColor = (s: string) => s === 'autorise' ? '#16a34a' : s === 'interdit' ? '#dc2626' : '#d97706';
  const statutLabel = (s: string) => s === 'autorise' ? '✓ Autorisé' : s === 'interdit' ? '✗ Interdit' : '◎ Sous conditions';
  const statutBg = (s: string) => s === 'autorise' ? '#f0fdf4' : s === 'interdit' ? '#fef2f2' : '#fff7ed';

  return (
    <div>
      <Header type="Règlement de Copropriété" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      {/* KPIs */}
      <KpiGrid>
        {r.date_reglement && <Kpi label="Date du règlement" value={String(r.date_reglement)} />}
        {r.total_lots != null && (
          <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: C.textSec, marginBottom: 8 }}>Total lots</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: C.text, lineHeight: 1.2 }}>{r.total_lots} lots</div>
            {totalAnnexes > 0 && <div style={{ fontSize: 11, color: C.textSec, marginTop: 4 }}>dont {annexesDetail}</div>}
          </div>
        )}
        {usageLabel && <Kpi label="Usage" value={usageLabel} />}
      </KpiGrid>

      {/* Parties communes par catégorie */}
      {r.parties_communes_categories?.filter((cat: any) => cat.elements?.length > 0).length > 0 && (
        <Card>
          <CardHeader label="PARTIES COMMUNES" color={C.gray.dot} />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
            {r.parties_communes_categories.filter((cat: any) => cat.elements?.length > 0).map((cat: any, i: number) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{cat.icone}</span>
                  <span style={{ textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{cat.categorie}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                  {cat.elements.map((el: string, j: number) => (
                    <span key={j} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 100, background: C.bgSecondary, border: `0.5px solid ${C.border}`, color: C.text }}>{el}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Règles d'usage — triées par statut : autorisé > sous_conditions > interdit, invest en tête si profil invest */}
      {r.regles_usage?.length > 0 && (() => {
        const ordre = (s: string) => s === 'autorise' ? 0 : s === 'sous_conditions' ? 1 : 2;
        const isInvestProfil = r._profil === 'invest';
        const sorted = [...r.regles_usage].sort((a: any, b: any) => {
          const sa = typeof a === 'string' ? 'sous_conditions' : a.statut;
          const sb = typeof b === 'string' ? 'sous_conditions' : b.statut;
          if (isInvestProfil) {
            const ia = typeof a !== 'string' && a.impact_invest ? -1 : 0;
            const ib = typeof b !== 'string' && b.impact_invest ? -1 : 0;
            if (ia !== ib) return ia - ib;
          }
          return ordre(sa) - ordre(sb);
        });
        return (
          <Card>
            <CardHeader label="RÈGLES CLÉS POUR L'ACHETEUR" color={C.blue.dot} />
            <div style={{ padding: '8px 0' }}>
              {sorted.map((rule: any, i: number) => {
                const label = typeof rule === 'string' ? rule : rule.label;
                const statut = typeof rule === 'string' ? 'sous_conditions' : rule.statut;
                const showInvestBadge = isInvestProfil && typeof rule !== 'string' && rule.impact_invest;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < sorted.length - 1 ? `0.5px solid ${C.border}` : 'none', background: statutBg(statut), gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: 14, color: C.text }}>{label}</span>
                      {showInvestBadge && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#ede9fe', color: '#5b21b6', whiteSpace: 'nowrap' as const }}>⚡ Clé investissement</span>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: statutColor(statut), whiteSpace: 'nowrap' as const }}>{statutLabel(statut)}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {/* Restrictions importantes */}
      {r.restrictions_importantes?.length > 0 && (
        <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="RESTRICTIONS À CONNAÎTRE" color={C.orange.dot} />
          {r.restrictions_importantes.map((rest: any, i: number) => {
            const label = typeof rest === 'string' ? rest : rest.label;
            const detail = typeof rest !== 'string' ? rest.detail : null;
            const bloquant = typeof rest !== 'string' && rest.bloquant;
            return (
              <div key={i} style={{ padding: '14px 20px', borderBottom: i < r.restrictions_importantes.length - 1 ? `0.5px solid ${C.orange.border}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: detail ? 4 : 0 }}>
                  {bloquant && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', whiteSpace: 'nowrap' as const }}>⚠ Bloquant</span>}
                  <span style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{label}</span>
                </div>
                {detail && <div style={{ fontSize: 13, color: C.textSec, marginTop: 4 }}>{detail}</div>}
              </div>
            );
          })}
        </div>
      )}

      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererDTGPPT({ r }: { r: any }) {
  const sub = [r.date ? `Réalisé en ${r.date}` : null, r.cabinet].filter(Boolean).join(' · ');
  const etatColor = r.etat_general === 'bon' ? '#16a34a' : r.etat_general === 'moyen' ? '#d97706' : '#dc2626';
  return (
    <div>
      <Header type="Diagnostic Technique Global · Plan Pluriannuel de Travaux" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />
      <KpiGrid>
        {r.budget_total_10ans && <Kpi label="Budget travaux 10 ans" value={`${Number(r.budget_total_10ans).toLocaleString('fr-FR')} €`} color="#dc2626" />}
        {r.budget_urgent_3ans && <Kpi label="Travaux urgents 0-3 ans" value={`${Number(r.budget_urgent_3ans).toLocaleString('fr-FR')} €`} color="#f97316" />}
        {r.etat_general && <Kpi label="État général" value={r.etat_general === 'bon' ? 'Bon' : r.etat_general === 'moyen' ? 'Moyen' : 'Dégradé'} color={etatColor} />}
      </KpiGrid>
      {r.planning?.length > 0 && (
        <Card>
          <CardHeader label="PLANNING DES TRAVAUX PRÉCONISÉS" color="#dc2626" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Travaux' }, { label: 'Horizon', align: 'center' }, { label: 'Budget', align: 'right' }, { label: 'Priorité', align: 'center' }]} /></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {r.planning.map((t: any, i: number) => {
                const pc = t.priorite === 'urgent' ? { bg: C.red.bg, text: '#dc2626', border: C.red.border, label: 'Urgent' } : t.priorite === 'prioritaire' ? { bg: C.orange.bg, text: '#c2410c', border: C.orange.border, label: 'Prioritaire' } : { bg: C.green.bg, text: '#166534', border: C.green.border, label: 'Planifié' };
                return (
                  <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                    <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{t.label}</td>
                    <td style={{ padding: '11px 20px', fontSize: 13, color: C.textSec, textAlign: 'center' }}>{t.horizon || '—'}</td>
                    <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: C.text, textAlign: 'right' }}>{t.montant ? `${Number(t.montant).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '11px 20px', textAlign: 'center' }}><span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: pc.bg, color: pc.text, border: `0.5px solid ${pc.border}` }}>{pc.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {r.etat_elements?.length > 0 && (
        <Card>
          <CardHeader label="ÉTAT PAR ÉLÉMENT" color={C.gray.dot} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {r.etat_elements.map((e: any, i: number) => {
            const ec = e.etat === 'bon' ? { color: '#16a34a', bg: C.green.bg, border: C.green.border, label: 'Bon état' } : e.etat === 'a_surveiller' ? { color: '#d97706', bg: C.orange.bg, border: C.orange.border, label: 'À surveiller' } : e.etat === 'vieillissant' ? { color: '#d97706', bg: C.orange.bg, border: C.orange.border, label: 'Vieillissant' } : { color: '#dc2626', bg: C.red.bg, border: C.red.border, label: 'Dégradé' };
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < r.etat_elements.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                <span style={{ fontSize: 14, color: C.text }}>{e.element}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: ec.color, background: ec.bg, padding: '3px 12px', borderRadius: 100, border: `0.5px solid ${ec.border}` }}>{ec.label}</span>
              </div>
            );
          })}
        </Card>
      )}
      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererCarnetEntretien({ r }: { r: any }) {
  const sub = [r.syndic, r.date_maj ? `Mis à jour le ${formatDate(r.date_maj)}` : null, r.annee_construction ? `Construit en ${r.annee_construction}` : null].filter(Boolean).join(' · ');
  const nbLotsTotal = r.nb_lots_total ?? r.nb_lots_principaux ?? (r.nb_lots_detail ? Object.values(r.nb_lots_detail).reduce((a: number, b: any) => a + (Number(b) || 0), 0) : null);
  const diagColor = (res: string) => res === 'negatif' ? C.green : res === 'positif' ? C.red : C.orange;
  const diagLabel = (res: string) => res === 'negatif' ? '✓ Négatif' : res === 'positif' ? '⚠ Positif' : '✗ Non effectué';

  return (
    <div>
      <Header type="Carnet d'Entretien de l'Immeuble" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      {/* Procédures — affiché en rouge en priorité si présentes */}
      {r.procedures?.length > 0 && (
        <div style={{ background: C.red.bg, border: `0.5px solid ${C.red.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="⚠ PROCÉDURES JUDICIAIRES EN COURS" color={C.red.dot} />
          {r.procedures.map((p: any, i: number) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < r.procedures.length - 1 ? `0.5px solid ${C.red.border}` : 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.red.text, marginBottom: 4 }}>{p.label}</div>
              {p.date_debut && <div style={{ fontSize: 12, color: C.red.text, marginBottom: 3 }}>Depuis le {formatDate(p.date_debut)}{p.date_fin ? ` → ${formatDate(p.date_fin)}` : ''}</div>}
              {p.commentaire && <div style={{ fontSize: 13, color: C.red.text, marginTop: 4 }}>{p.commentaire}</div>}
              <div style={{ fontSize: 12, color: C.red.text, marginTop: 6, fontStyle: 'italic' as const }}>⚠ Une procédure judiciaire active peut impacter la vente et générer des coûts collectifs futurs.</div>
            </div>
          ))}
        </div>
      )}

      {/* 3 encarts fixes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>

        {/* Encart Syndic */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🏢 Syndic</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {r.syndic && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>👤</span><span style={{ fontWeight: 600 }}>{r.syndic}</span></div>}
            {r.syndic_adresse && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📍</span><span>{r.syndic_adresse}</span></div>}
            {r.syndic_responsable && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>👨‍💼</span><span>Principal : {r.syndic_responsable}</span></div>}
            {r.syndic_gestionnaire && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>👩‍💼</span><span>Gestionnaire : {r.syndic_gestionnaire}</span></div>}
            {r.syndic_comptable && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>🧾</span><span>Comptable : {r.syndic_comptable}</span></div>}
            {r.syndic_email && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>✉️</span><span>{r.syndic_email}</span></div>}
            {r.syndic_date_designation && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📅</span><span>Désigné le {formatDate(r.syndic_date_designation)}</span></div>}
            {r.syndic_garantie && <div style={{ display: 'flex', gap: 8, fontSize: 12, color: C.textSec }}><span>🛡</span><span>Garantie : {r.syndic_garantie}</span></div>}
            {r.syndic_carte_pro && <div style={{ display: 'flex', gap: 8, fontSize: 12, color: C.textSec }}><span>🏛</span><span>Carte pro : {r.syndic_carte_pro}</span></div>}
          </div>
        </div>

        {/* Encart Copropriété */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🏗 Infos copropriété</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {r.annee_construction && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📅</span><span>Construit en {r.annee_construction}</span></div>}
            {r.nb_batiments && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>🏢</span><span>{r.nb_batiments} bâtiment{r.nb_batiments > 1 ? 's' : ''}</span></div>}
            {nbLotsTotal && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>🏘</span><span>{nbLotsTotal} lots au total{r.nb_lots_secondaires ? ` (${r.nb_lots_principaux} principaux · ${r.nb_lots_secondaires} secondaires)` : ''}</span></div>}
            {r.nb_lots_detail?.logements && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>🏠</span><span>{r.nb_lots_detail.logements} logements{r.nb_lots_detail.caves ? ` · ${r.nb_lots_detail.caves} caves` : ''}{r.nb_lots_detail.parkings ? ` · ${r.nb_lots_detail.parkings} parkings` : ''}</span></div>}
            {r.immatriculation_registre && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📋</span><span>Immat. : {r.immatriculation_registre}</span></div>}

            {r.fibre_optique != null && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>💾</span><span>Fibre optique : {r.fibre_optique ? 'Oui' : 'Non'}</span></div>}
            {r.rcp_info?.date_origine && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📜</span><span>RCP de {formatDate(r.rcp_info.date_origine)}{r.rcp_info.modificatifs?.length > 0 ? ` · ${r.rcp_info.modificatifs.length} modificatif(s)` : ''}</span></div>}
            {r.assurance?.compagnie && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>🛡</span><span>Assurance : {r.assurance.compagnie}{r.assurance.police ? ` — Police n°${r.assurance.police}` : ''}{r.assurance.echeance ? ` · Éch. ${formatDate(r.assurance.echeance)}` : ''}</span></div>}
          </div>
        </div>

        {/* Encart Energie & Eau */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>⚡ Énergie & Eau</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {/* Chauffage — uniquement si renseigné */}
            {r.chauffage_collectif !== null && r.chauffage_collectif !== undefined && (
              <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text, alignItems: 'center' }}>
                <span>🔥</span>
                <span>Chauffage · {r.chauffage_collectif ? 'Collectif' : 'Individuel'}{r.type_chauffage ? ` ${r.type_chauffage.charAt(0).toUpperCase() + r.type_chauffage.slice(1).toLowerCase()}` : ''}</span>
                {!r.chauffage_collectif && <TooltipIcon text="Non inclus dans les charges de copropriété. Demandez les dernières factures au vendeur pour estimer votre budget chauffage." />}
              </div>
            )}
            {/* Eau chaude — uniquement si renseigné */}
            {r.eau_chaude_collective !== null && r.eau_chaude_collective !== undefined && (
              <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text, alignItems: 'center' }}>
                <span>🚿</span>
                <span>Eau chaude · {r.eau_chaude_collective ? 'Collective' : 'Individuelle'}{r.type_chauffage && !r.eau_chaude_collective ? ` ${r.type_chauffage.charAt(0).toUpperCase() + r.type_chauffage.slice(1).toLowerCase()}` : ''}</span>
                {!r.eau_chaude_collective && <TooltipIcon text="Non incluse dans les charges. Demandez les factures au vendeur pour estimer le coût annuel." />}
              </div>
            )}
            {/* Eau froide — uniquement si renseigné */}
            {r.eau_froide_collective !== null && r.eau_froide_collective !== undefined && (
              <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text, alignItems: 'center' }}>
                <span>💧</span>
                <span>Eau froide · {r.eau_froide_collective ? 'Collective' : 'Individuelle'}</span>
                {!r.eau_froide_collective && <TooltipIcon text="Chaque lot a son propre compteur — vous payez à la consommation réelle." />}
              </div>
            )}
            {/* Gardien si présent */}
            {r.gardien?.nom && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>👷</span><span>Gardien(ne) : {r.gardien.nom}</span></div>}
          </div>
        </div>
      </div>

      {/* Diagnostics parties communes */}
      {r.diagnostics_parties_communes?.length > 0 && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="🔬 DIAGNOSTICS PARTIES COMMUNES" color={C.orange.dot} />
          {r.diagnostics_parties_communes.map((d: any, i: number) => {
            const dc = diagColor(d.resultat || 'non_effectue');
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: i < r.diagnostics_parties_communes.length - 1 ? `0.5px solid ${C.border}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, color: C.text }}>{d.label || d.type}</div>
                  {(d.entreprise || d.date) && <div style={{ fontSize: 12, color: C.textSec, marginTop: 3 }}>{[d.entreprise, formatDate(d.date)].filter(Boolean).join(' · ')}</div>}
                  {d.commentaire && <div style={{ fontSize: 12, color: C.textSec, marginTop: 2, fontStyle: 'italic' as const }}>{d.commentaire}</div>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: dc.bg, color: dc.text, border: `0.5px solid ${dc.border}`, whiteSpace: 'nowrap' as const, marginLeft: 16 }}>
                  {diagLabel(d.resultat || 'non_effectue')}
                </span>
              </div>
            );
          })}
          {/* Mesures administratives */}
          {r.mesures_administratives && (
            <div style={{ padding: '12px 20px', borderTop: `0.5px solid ${C.border}`, background: C.bgSecondary, display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
              {!r.mesures_administratives.arrete_peril && !r.mesures_administratives.insalubrite && !r.mesures_administratives.injonction_travaux && !r.mesures_administratives.administration_provisoire && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: C.green.bg, color: C.green.text, border: `0.5px solid ${C.green.border}` }}>✓ Aucune mesure administrative en cours</span>
              )}
              {(r.mesures_administratives.arrete_peril || r.mesures_administratives.insalubrite || r.mesures_administratives.injonction_travaux || r.mesures_administratives.administration_provisoire) && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}` }}>⚠ Mesure(s) administrative(s) en cours</span>
              )}
              {!r.risques_sanitaires?.legionella && !r.risques_sanitaires?.radon && !r.risques_sanitaires?.merule && (
                <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: C.green.bg, color: C.green.text, border: `0.5px solid ${C.green.border}` }}>✓ Aucun risque Légionella / Radon / Mérule</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contrats */}
      {r.contrats?.length > 0 && (
        <Card>
          <CardHeader label="CONTRATS DE MAINTENANCE EN COURS" color="#16a34a" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Équipement' }, { label: 'Prestataire' }, { label: 'Référence' }]} /></thead>
            <tbody>
              {r.contrats.map((c: any, i: number) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{c.equipement}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.textSec }}>{c.prestataire || '—'}</td>
                  <td style={{ padding: '11px 20px', fontSize: 13, color: C.textSec }}>{c.reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Travaux votés en cours */}
      {r.travaux_en_cours?.length > 0 && (
        <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="TRAVAUX VOTÉS EN COURS (NON ENCORE RÉALISÉS)" color={C.orange.dot} />
          <div style={{ padding: '10px 20px', background: '#fffbf5', borderBottom: `0.5px solid ${C.orange.border}`, fontSize: 13, color: C.orange.text }}>
            ℹ Travaux votés en AG — leur charge revient en principe au vendeur si votés avant le compromis. À confirmer avec votre notaire.
          </div>
          {r.travaux_en_cours.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < r.travaux_en_cours.length - 1 ? `0.5px solid ${C.orange.border}` : 'none', background: i % 2 === 0 ? C.orange.bg : '#fffbf5' }}>
              <div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{t.label}</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  {t.date_ag && <span style={{ fontSize: 12, color: C.textSec }}>📅 Voté le {formatDate(t.date_ag)}</span>}
                  {t.entreprise && <span style={{ fontSize: 12, color: C.textSec }}>🏢 {t.entreprise}</span>}
                </div>
              </div>
              {t.montant && (
                <div style={{ textAlign: 'right' as const, flexShrink: 0, marginLeft: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f97316' }}>{Number(t.montant).toLocaleString('fr-FR')} €</div>
                  <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>budget voté</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Travaux réalisés */}
      {r.travaux_realises?.length > 0 && (
        <Card>
          <CardHeader label="HISTORIQUE DES TRAVAUX RÉALISÉS" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Année', align: 'left' }, { label: 'Travaux' }, { label: 'Montant', align: 'right' }]} /></thead>
            <tbody>
              {r.travaux_realises.map((t: any, i: number) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}` }}>
                  <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' as const }}>{t.annee}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>
                    <div>{t.label}</div>
                    {t.entreprise && <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{t.entreprise}{t.assurance_do ? ` · DO : ${t.assurance_do}` : ''}</div>}
                    {t.financement === 'en_cours' && <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, padding: '2px 8px', borderRadius: 100, display: 'inline-block', background: C.orange.bg, color: C.orange.text, border: `0.5px solid ${C.orange.border}` }}>⏳ Financement en cours</div>}
                  </td>
                  <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: C.text, textAlign: 'right' as const, whiteSpace: 'nowrap' as const }}>{t.montant ? `${Number(t.montant).toLocaleString('fr-FR')} €` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Infos complémentaires */}
      {r.infos_complementaires?.length > 0 && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="INFORMATIONS COMPLÉMENTAIRES" color={C.gray.dot} />
          {r.infos_complementaires.map((info: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < r.infos_complementaires.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary, gap: 16 }}>
              <span style={{ fontSize: 13, color: C.textSec }}>{info.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' as const, flexShrink: 0, maxWidth: '55%' }}>{info.valeur}</span>
            </div>
          ))}
        </div>
      )}

      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererPreEtatDate({ r }: { r: any }) {
  const sub = [r.date ? `Établi le ${r.date}` : null, r.syndic ? `Syndic : ${r.syndic}` : null].filter(Boolean).join(' · ');
  const lotIcon = (type: string) => type === 'cave' ? '🔒' : type === 'parking' || type === 'garage' ? '🚗' : type === 'grenier' || type === 'combles' ? '📦' : '🏠';
  const totalAnnuel = r.charges_futures?.montant_annuel || ((Number(r.charges_futures?.montant_trimestriel || 0) + Number(r.charges_futures?.fonds_travaux_trimestriel || 0)) * 4);

  return (
    <div>
      <div style={{ background: C.dark, borderRadius: 14, padding: '22px 28px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' as const }}>Pré-État Daté</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: sub ? 6 : 0, lineHeight: 1.3 }}>{r.titre}</div>
        {sub && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: r.lots_vente?.length > 0 ? 12 : 0 }}>{sub}</div>}
        {r.lots_vente?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', alignSelf: 'center', marginRight: 2 }}>Document portant sur :</span>
            {r.lots_vente.map((lot: any, i: number) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                {lotIcon(lot.type)} {lot.type.charAt(0).toUpperCase() + lot.type.slice(1)}{lot.numero ? ` n°${lot.numero}` : ''}{lot.batiment ? ` — Bât. ${lot.batiment}` : ''}{lot.etage ? ` · ${formatEtage(lot.etage)}` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      <Resume text={r.resume} />

      {/* 3 encarts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* Syndic */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🏢 Syndic</div>
          {r.syndic && <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{r.syndic}</div>}
          {r.syndic_adresse && <div style={{ fontSize: 12, color: C.textSec, marginBottom: 4 }}>📍 {r.syndic_adresse}</div>}
          {r.date && <div style={{ fontSize: 12, color: C.textSec, marginBottom: 4 }}>📅 Document établi le {formatDate(r.date)}</div>}
          {r.nb_lots_copro && <div style={{ fontSize: 12, color: C.textSec, marginBottom: 4 }}>🏘 Copropriété de {r.nb_lots_copro} lots</div>}
          {r.immatriculation_registre && <div style={{ fontSize: 11, color: C.textSec, marginTop: 6, padding: '4px 8px', background: C.bgSecondary, borderRadius: 6 }}>Immat. {r.immatriculation_registre}</div>}
        </div>

        {/* Situation vendeur */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>👤 Situation vendeur</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span>{Number(r.impayes_vendeur) === 0 ? '✅' : '🔴'}</span>
              <span style={{ color: C.text }}>{Number(r.impayes_vendeur) === 0 ? 'Aucun impayé de charges' : `${Number(r.impayes_vendeur).toLocaleString('fr-FR')} € impayés`}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span>{r.procedures_contre_vendeur?.length === 0 || !r.procedures_contre_vendeur ? '✅' : '⚠️'}</span>
              <span style={{ color: C.text }}>{r.procedures_contre_vendeur?.length === 0 || !r.procedures_contre_vendeur ? 'Aucune procédure judiciaire' : 'Procédures en cours'}</span>
            </div>
            {r.honoraires_syndic && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <span>📄</span>
                <span style={{ color: C.text }}>Frais d'établissement du document : {Number(r.honoraires_syndic).toLocaleString('fr-FR')} € à sa charge</span>
              </div>
            )}
            {r.fonds_travaux_alur && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span>💰</span>
                <span style={{ color: C.text }}>Fonds ALUR : {Number(r.fonds_travaux_alur).toLocaleString('fr-FR')} € à verser au vendeur</span>
              </div>
            )}
          </div>
        </div>

        {/* Situation copro */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🏢 Copropriété</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {r.impayes_copro_global != null && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <span>{Number(r.impayes_copro_global) > 0 ? '⚠️' : '✅'}</span>
                <span style={{ color: C.text }}>Impayés globaux : {Number(r.impayes_copro_global).toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {r.dette_fournisseurs != null && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <span>{Number(r.dette_fournisseurs) > 0 ? '⚠️' : '✅'}</span>
                <span style={{ color: C.text }}>Dette fournisseurs : {Number(r.dette_fournisseurs).toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {r.fonds_travaux_copro_global != null && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <span>🔧</span>
                <span style={{ color: C.text }}>Fonds travaux copro : {Number(r.fonds_travaux_copro_global).toLocaleString('fr-FR')} €</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span>{r.procedures_copro === 'neant' || !r.procedures_copro ? '✅' : '⚠️'}</span>
              <span style={{ color: C.text }}>{r.procedures_copro === 'neant' || !r.procedures_copro ? 'Aucune procédure copro' : 'Procédures copro en cours'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs acheteur */}
      <KpiGrid>
        <div style={{ background: Number(r.impayes_vendeur) === 0 ? C.green.bg : C.red.bg, border: `0.5px solid ${Number(r.impayes_vendeur) === 0 ? C.green.border : C.red.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: C.textSec, marginBottom: 8 }}>Impayés vendeur</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: Number(r.impayes_vendeur) === 0 ? '#16a34a' : '#dc2626' }}>{r.impayes_vendeur !== undefined ? `${Number(r.impayes_vendeur).toLocaleString('fr-FR')} €` : '—'}</div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{Number(r.impayes_vendeur) === 0 ? 'Vendeur à jour' : 'Attention'}</div>
        </div>
        {r.fonds_travaux_alur && <Kpi label="Fonds travaux ALUR" value={`${Number(r.fonds_travaux_alur).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="À verser au vendeur à la signature" />}
        {r.fonds_roulement_acheteur && <Kpi label="Fonds de roulement" value={`${Number(r.fonds_roulement_acheteur).toLocaleString('fr-FR')} €`} color="#d97706" sub="À verser au vendeur à la signature" />}
      </KpiGrid>

      {/* Charges futures */}
      {(r.charges_futures?.montant_trimestriel || r.charges_futures?.fonds_travaux_trimestriel) && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="💸 CHARGES FUTURES ACHETEUR" color={C.blue.dot} />
          <div style={{ padding: '10px 20px', background: C.blue.bg, borderBottom: `0.5px solid ${C.blue.border}`, fontSize: 13, color: C.blue.text }}>
            ℹ Ces montants seront à régler dès votre entrée dans la copropriété, chaque trimestre.
          </div>
          {r.charges_futures?.montant_trimestriel && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: `0.5px solid ${C.border}` }}>
              <span style={{ fontSize: 14, color: C.text }}>Charges courantes (budget prévisionnel)</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.blue.dot }}>{Number(r.charges_futures.montant_trimestriel).toLocaleString('fr-FR')} € / trimestre</span>
            </div>
          )}
          {r.charges_futures?.fonds_travaux_trimestriel && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: `0.5px solid ${C.border}` }}>
              <span style={{ fontSize: 14, color: C.text }}>Cotisation fonds de travaux ALUR</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.blue.dot }}>{Number(r.charges_futures.fonds_travaux_trimestriel).toLocaleString('fr-FR')} € / trimestre</span>
            </div>
          )}
          {totalAnnuel > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', background: C.bgSecondary }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Total annuel estimé</span>
              <span style={{ fontSize: 17, fontWeight: 600, color: C.blue.dot }}>{Number(totalAnnuel).toLocaleString('fr-FR')} € / an</span>
            </div>
          )}
        </div>
      )}

      {/* Santé financière copro */}
      {(r.impayes_copro_global != null || r.dette_fournisseurs != null) && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="🏢 SANTÉ FINANCIÈRE DE LA COPROPRIÉTÉ" color={C.orange.dot} />
          {r.impayes_copro_global != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '13px 20px', borderBottom: `0.5px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 14, color: C.text }}>Impayés globaux copropriété</div>
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 3 }}>Charges en attente de régularisation à la date d'édition</div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#d97706', whiteSpace: 'nowrap' as const, marginLeft: 16 }}>{Number(r.impayes_copro_global).toLocaleString('fr-FR')} €</span>
            </div>
          )}
          {r.dette_fournisseurs != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '13px 20px', borderBottom: `0.5px solid ${C.border}` }}>
              <div>
                <div style={{ fontSize: 14, color: C.text }}>Dette fournisseurs syndicat</div>
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 3 }}>Factures non réglées à la date du document</div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#d97706', whiteSpace: 'nowrap' as const, marginLeft: 16 }}>{Number(r.dette_fournisseurs).toLocaleString('fr-FR')} €</span>
            </div>
          )}
          {r.fonds_travaux_copro_global != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: `0.5px solid ${C.border}` }}>
              <span style={{ fontSize: 14, color: C.text }}>Fonds de travaux total copropriété</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' as const, marginLeft: 16 }}>{Number(r.fonds_travaux_copro_global).toLocaleString('fr-FR')} €</span>
            </div>
          )}
          <div style={{ padding: '16px 20px', background: '#fff7ed', borderTop: `0.5px solid #fed7aa` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>ℹ À savoir sur les impayés de copropriété</div>
            <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>Les impayés globaux sont <strong>normaux dans toute copropriété</strong> — chaque copropriétaire règle ses charges à des échéances différentes. Ils deviennent préoccupants uniquement s'ils dépassent significativement un trimestre de budget collectif, ou s'ils sont en hausse répétée d'année en année.</div>
          </div>
        </div>
      )}

      {/* Travaux charge vendeur */}
      {r.travaux_charge_vendeur?.length > 0 && (
        <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="TRAVAUX VOTÉS À LA CHARGE DU VENDEUR" color={C.orange.dot} />
          <div style={{ padding: '10px 20px', background: C.blue.bg, borderBottom: `0.5px solid ${C.blue.border}`, fontSize: 13, color: C.blue.text }}>
            ℹ Ces travaux ont été votés avant le compromis — ils restent à la charge du vendeur, sans impact pour l'acheteur.
          </div>
          {r.travaux_charge_vendeur.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < r.travaux_charge_vendeur.length - 1 ? `0.5px solid ${C.orange.border}` : 'none', background: i % 2 === 0 ? C.orange.bg : '#fffbf5' }}>
              <div style={{ fontSize: 14, color: C.text }}>{t.label}</div>
              {t.montant && <div style={{ fontSize: 15, fontWeight: 600, color: '#f97316', whiteSpace: 'nowrap' as const, marginLeft: 20 }}>{Number(t.montant).toLocaleString('fr-FR')} €</div>}
            </div>
          ))}
        </div>
      )}

      {/* Historique charges */}
      {r.historique_charges?.length > 0 && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="📊 HISTORIQUE DES CHARGES DU LOT" color={C.gray.dot} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bgSecondary }}>
                {['Exercice', 'Budget appelé', 'Charges réelles', 'Écart'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 20px', textAlign: i === 0 ? 'left' : 'right' as const, fontSize: 12, fontWeight: 600, color: C.textSec, borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.historique_charges.map((h: any, i: number) => {
                const ecart = h.charges_reelles && h.budget_appele ? Number(h.charges_reelles) - Number(h.budget_appele) : null;
                return (
                  <tr key={i} style={{ borderBottom: i < r.historique_charges.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                    <td style={{ padding: '12px 20px', fontSize: 14, color: C.text }}>{h.exercice}{h.annee ? ` (${h.annee})` : ''}</td>
                    <td style={{ padding: '12px 20px', fontSize: 14, color: C.textSec, textAlign: 'right' as const }}>{h.budget_appele ? `${Number(h.budget_appele).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: C.text, textAlign: 'right' as const }}>{h.charges_reelles ? `${Number(h.charges_reelles).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' as const }}>
                      {ecart !== null && (
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: ecart > 0 ? C.red.bg : C.green.bg, color: ecart > 0 ? C.red.text : C.green.text }}>
                          {ecart > 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} €
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '16px 20px', background: C.bgSecondary, borderTop: `0.5px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 6 }}>💡 Comment lire ce tableau ?</div>
            <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>Le <strong>budget appelé</strong> est ce que la copropriété a prévu de dépenser sur l'exercice. Les <strong>charges réelles</strong> sont ce qui a été effectivement dépensé après clôture de l'exercice. Un petit écart est tout à fait normal — personne ne peut prévoir les dépenses à l'euro près. C'est seulement un écart important et répété sur plusieurs exercices qui mérite attention.</div>
          </div>
        </div>
      )}

      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererEtatDate({ r }: { r: any }) {
  const sub = [r.date ? `Établi le ${r.date}` : null, r.syndic ? `Syndic : ${r.syndic}` : null].filter(Boolean).join(' · ');
  const soldeColor = r.solde_sens === 'acheteur' ? '#16a34a' : '#dc2626';
  const soldeLabel = r.solde_sens === 'acheteur' ? "En faveur de l'acheteur" : 'En faveur du vendeur';
  const lotIcon = (type: string) => type === 'cave' ? '🔒' : type === 'parking' || type === 'garage' ? '🚗' : '🏠';
  const totalAnnuel = r.charges_futures?.montant_annuel || ((Number(r.charges_futures?.montant_trimestriel || 0) + Number(r.charges_futures?.fonds_travaux_trimestriel || 0)) * 4);

  return (
    <div>
      <div style={{ background: C.dark, borderRadius: 14, padding: '22px 28px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' as const }}>État Daté</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: sub ? 6 : 0, lineHeight: 1.3 }}>{r.titre}</div>
        {sub && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: r.lots_vente?.length > 0 ? 12 : 0 }}>{sub}</div>}
        {r.lots_vente?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', alignSelf: 'center', marginRight: 2 }}>Document portant sur :</span>
            {r.lots_vente.map((lot: any, i: number) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 100, padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                {lotIcon(lot.type)} {lot.type.charAt(0).toUpperCase() + lot.type.slice(1)}{lot.numero ? ` n°${lot.numero}` : ''}{lot.batiment ? ` — Bât. ${lot.batiment}` : ''}{lot.etage ? ` · ${formatEtage(lot.etage)}` : ''}
              </span>
            ))}
          </div>
        )}
      </div>

      <Resume text={r.resume} />

      {/* 3 encarts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🏢 Syndic</div>
          {r.syndic && <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>{r.syndic}</div>}
          {r.syndic_adresse && <div style={{ fontSize: 12, color: C.textSec, marginBottom: 4 }}>📍 {r.syndic_adresse}</div>}
          {r.date && <div style={{ fontSize: 12, color: C.textSec, marginBottom: 4 }}>📅 Document établi le {formatDate(r.date)}</div>}
          {r.nb_lots_copro && <div style={{ fontSize: 12, color: C.textSec }}>🏘 {r.nb_lots_copro} lots dans la copropriété</div>}
          {r.immatriculation_registre && <div style={{ fontSize: 11, color: C.textSec, marginTop: 6, padding: '4px 8px', background: C.bgSecondary, borderRadius: 6 }}>Immat. {r.immatriculation_registre}</div>}
        </div>
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>👤 Situation vendeur</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <span>{Number(r.impayes_vendeur) === 0 ? '✅' : '🔴'}</span>
              <span style={{ color: C.text }}>{Number(r.impayes_vendeur) === 0 ? 'Aucun impayé' : `${Number(r.impayes_vendeur).toLocaleString('fr-FR')} € impayés`}</span>
            </div>
            {r.honoraires_syndic && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
                <span>📄</span>
                <span style={{ color: C.text }}>Frais d'établissement : {Number(r.honoraires_syndic).toLocaleString('fr-FR')} € à sa charge</span>
              </div>
            )}
            {r.fonds_travaux_alur && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span>💚</span>
                <span style={{ color: C.text }}>Fonds ALUR transféré : {Number(r.fonds_travaux_alur).toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {r.solde_net !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span>{r.solde_sens === 'acheteur' ? '✅' : '⚠️'}</span>
                <span style={{ color: C.text }}>Solde net : {r.solde_sens === 'acheteur' ? '+' : '-'}{Number(Math.abs(r.solde_net)).toLocaleString('fr-FR')} € ({soldeLabel})</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🏢 Copropriété</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {r.impayes_copro_global != null && <div style={{ display: 'flex', gap: 8, fontSize: 13 }}><span>{Number(r.impayes_copro_global) > 0 ? '⚠️' : '✅'}</span><span style={{ color: C.text }}>Impayés : {Number(r.impayes_copro_global).toLocaleString('fr-FR')} €</span></div>}
            {r.dette_fournisseurs != null && <div style={{ display: 'flex', gap: 8, fontSize: 13 }}><span>{Number(r.dette_fournisseurs) > 0 ? '⚠️' : '✅'}</span><span style={{ color: C.text }}>Dette fournisseurs : {Number(r.dette_fournisseurs).toLocaleString('fr-FR')} €</span></div>}
            <div style={{ display: 'flex', gap: 8, fontSize: 13 }}><span>{r.procedures_copro === 'neant' || !r.procedures_copro ? '✅' : '⚠️'}</span><span style={{ color: C.text }}>{r.procedures_copro === 'neant' || !r.procedures_copro ? 'Aucune procédure copro' : 'Procédures en cours'}</span></div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid>
        {r.solde_net !== undefined && <Kpi label="Solde net définitif" value={`${r.solde_sens === 'acheteur' ? '+' : '-'} ${Number(Math.abs(r.solde_net)).toLocaleString('fr-FR')} €`} color={soldeColor} sub={soldeLabel} />}
        {r.fonds_travaux_alur && <Kpi label="Fonds travaux ALUR" value={`${Number(r.fonds_travaux_alur).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="Transféré à l'acheteur" />}
        {r.fonds_roulement && <Kpi label="Fonds de roulement" value={`${Number(r.fonds_roulement).toLocaleString('fr-FR')} €`} color="#d97706" sub="À reconstituer" />}
      </KpiGrid>

      {/* Charges futures */}
      {(r.charges_futures?.montant_trimestriel || r.charges_futures?.fonds_travaux_trimestriel) && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="💸 CHARGES FUTURES ACHETEUR" color={C.blue.dot} />
          <div style={{ padding: '10px 20px', background: C.blue.bg, borderBottom: `0.5px solid ${C.blue.border}`, fontSize: 13, color: C.blue.text }}>ℹ Ces montants seront à régler dès votre entrée dans la copropriété, chaque trimestre.</div>
          {r.charges_futures?.montant_trimestriel && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 20px', borderBottom: `0.5px solid ${C.border}` }}><span style={{ fontSize: 14, color: C.text }}>Charges courantes</span><span style={{ fontSize: 15, fontWeight: 600, color: C.blue.dot }}>{Number(r.charges_futures.montant_trimestriel).toLocaleString('fr-FR')} € / trimestre</span></div>}
          {r.charges_futures?.fonds_travaux_trimestriel && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 20px', borderBottom: `0.5px solid ${C.border}` }}><span style={{ fontSize: 14, color: C.text }}>Fonds de travaux ALUR</span><span style={{ fontSize: 15, fontWeight: 600, color: C.blue.dot }}>{Number(r.charges_futures.fonds_travaux_trimestriel).toLocaleString('fr-FR')} € / trimestre</span></div>}
          {totalAnnuel > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 20px', background: C.bgSecondary }}><span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Total annuel estimé</span><span style={{ fontSize: 17, fontWeight: 600, color: C.blue.dot }}>{Number(totalAnnuel).toLocaleString('fr-FR')} € / an</span></div>}
        </div>
      )}

      {/* Décompte définitif */}
      {r.decomposition?.length > 0 && (
        <Card>
          <CardHeader label="DÉCOMPTE DÉFINITIF" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Poste' }, { label: 'Montant', align: 'center' }, { label: 'Sens', align: 'center' }]} /></thead>
            <tbody>
              {r.decomposition.map((d: any, i: number) => {
                const dc = d.sens === 'acheteur_recoit' ? { bg: C.green.bg, text: '#166534', border: C.green.border, label: 'Acheteur reçoit' } : { bg: C.red.bg, text: '#991b1b', border: C.red.border, label: 'Vendeur doit' };
                return (
                  <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                    <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{d.poste}</td>
                    <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: C.text, textAlign: 'center' as const }}>{d.montant ? `${Number(d.montant).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '11px 20px', textAlign: 'center' as const }}><span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: dc.bg, color: dc.text, border: `0.5px solid ${dc.border}` }}>{dc.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Travaux consignés */}
      {r.travaux_consignes?.length > 0 && (
        <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="TRAVAUX CONSIGNÉS VENDEUR" color={C.orange.dot} />
          {r.travaux_consignes.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 20px', borderBottom: i < r.travaux_consignes.length - 1 ? `0.5px solid ${C.orange.border}` : 'none' }}>
              <span style={{ fontSize: 14, color: C.text }}>{t.label}</span>
              {t.montant && <span style={{ fontSize: 15, fontWeight: 600, color: '#f97316' }}>{Number(t.montant).toLocaleString('fr-FR')} €</span>}
            </div>
          ))}
        </div>
      )}

      {/* Historique charges */}
      {r.historique_charges?.length > 0 && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="📊 HISTORIQUE DES CHARGES DU LOT" color={C.gray.dot} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: C.bgSecondary }}>
                {['Exercice', 'Budget appelé', 'Charges réelles', 'Écart'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 20px', textAlign: i === 0 ? 'left' : 'right' as const, fontSize: 12, fontWeight: 600, color: C.textSec, borderBottom: `0.5px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.historique_charges.map((h: any, i: number) => {
                const ecart = h.charges_reelles && h.budget_appele ? Number(h.charges_reelles) - Number(h.budget_appele) : null;
                return (
                  <tr key={i} style={{ borderBottom: i < r.historique_charges.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                    <td style={{ padding: '12px 20px', fontSize: 14, color: C.text }}>{h.exercice}{h.annee ? ` (${h.annee})` : ''}</td>
                    <td style={{ padding: '12px 20px', fontSize: 14, color: C.textSec, textAlign: 'right' as const }}>{h.budget_appele ? `${Number(h.budget_appele).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: C.text, textAlign: 'right' as const }}>{h.charges_reelles ? `${Number(h.charges_reelles).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '12px 20px', textAlign: 'right' as const }}>
                      {ecart !== null && <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: ecart > 0 ? C.red.bg : C.green.bg, color: ecart > 0 ? C.red.text : C.green.text }}>{ecart > 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} €</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '16px 20px', background: C.bgSecondary, borderTop: `0.5px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSec, marginBottom: 6 }}>💡 Comment lire ce tableau ?</div>
            <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.7 }}>Le <strong>budget appelé</strong> est ce que la copropriété a prévu de dépenser sur l'exercice. Les <strong>charges réelles</strong> sont ce qui a été effectivement dépensé après clôture de l'exercice. Un petit écart est tout à fait normal — personne ne peut prévoir les dépenses à l'euro près. C'est seulement un écart important et répété sur plusieurs exercices qui mérite attention.</div>
          </div>
        </div>
      )}

      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererTaxeFonciere({ r }: { r: any }) {
  const sub = [r.annee ? `Année ${r.annee}` : null, r.reference_cadastrale].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="Avis de Taxe Foncière" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />
      <KpiGrid>
        {r.montant_total && <Kpi label={`Taxe foncière ${r.annee || ''}`} value={`${Number(r.montant_total).toLocaleString('fr-FR')} €`} sub={r.montant_mensuel ? `${Number(r.montant_mensuel).toLocaleString('fr-FR')} €/mois` : undefined} />}
        {r.evolution_pct != null && <Kpi label="Évolution" value={`${r.evolution_pct > 0 ? '+' : ''}${r.evolution_pct}%`} color={r.evolution_pct > 5 ? '#dc2626' : '#d97706'} sub={r.montant_precedent ? `vs ${Number(r.montant_precedent).toLocaleString('fr-FR')} €` : undefined} />}
        {r.valeur_locative && <Kpi label="Valeur locative cadastrale" value={`${Number(r.valeur_locative).toLocaleString('fr-FR')} €`} sub="Base de calcul" />}
      </KpiGrid>
      {r.decomposition?.length > 0 && (
        <Card>
          <CardHeader label="DÉCOMPOSITION PAR COLLECTIVITÉ" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Collectivité' }, { label: 'Taux', align: 'center' }, { label: 'Montant', align: 'right' }]} /></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {r.decomposition.map((d: any, i: number) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{d.collectivite}</td>
                  <td style={{ padding: '11px 20px', fontSize: 13, color: C.textSec, textAlign: 'center' }}>{d.taux ? `${d.taux}%` : '—'}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: C.text, textAlign: 'right' }}>{d.montant ? `${Number(d.montant).toLocaleString('fr-FR')} €` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Card>
        <CardHeader label="INFORMATIONS DU BIEN" color={C.gray.dot} />
        {r.reference_cadastrale && <InfoRow label="Référence cadastrale" value={r.reference_cadastrale} />}
        {r.surface_cadastrale && <InfoRow label="Surface pondérée" value={`${r.surface_cadastrale} m² (base cadastrale)`} alt />}
      </Card>
      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererCompromis({ r }: { r: any }) {
  const sub = [r.date_signature ? `Signé le ${formatDate(r.date_signature)}` : null, r.agence, r.notaire_acheteur ? `Notaire acheteur : ${r.notaire_acheteur}` : null].filter(Boolean).join(' · ');
  const statutStyle = (s: string) => s === 'levee' || s === 'purge' ? { bg: C.green.bg, text: '#166534', border: C.green.border, label: s === 'levee' ? 'Levée' : 'Purgée' } : { bg: C.orange.bg, text: '#92400e', border: C.orange.border, label: 'En cours' };
  return (
    <div>
      <Header type="Compromis de Vente" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
        {r.prix_net_vendeur && <Kpi label="Prix net vendeur" value={`${Number(r.prix_net_vendeur).toLocaleString('fr-FR')} €`} />}
        {r.honoraires_agence && <Kpi label="Honoraires agence" value={`${Number(r.honoraires_agence).toLocaleString('fr-FR')} €`} sub={`Charge ${r.honoraires_charge === 'acheteur' ? 'acheteur' : 'vendeur'}`} />}
        {r.depot_garantie && <Kpi label="Dépôt de garantie" value={`${Number(r.depot_garantie).toLocaleString('fr-FR')} €`} />}
        {r.prix_total && <Kpi label="Prix total acheteur" value={`${Number(r.prix_total).toLocaleString('fr-FR')} €`} sub="Hors frais notaire" />}
      </div>
      {r.bien && (
        <Card>
          <CardHeader label="DÉSIGNATION DU BIEN" color="#2a7d9c" />
          {r.bien.type && <InfoRow label="Nature" value={r.bien.type} />}
          {r.bien.lot_principal && <InfoRow label="Lot principal" value={r.bien.lot_principal} alt />}
          {r.bien.annexes?.map((a: string, i: number) => <InfoRow key={i} label="Annexe" value={a} />)}
          {r.bien.surface_carrez && <InfoRow label="Surface Carrez" value={`${r.bien.surface_carrez} m²`} alt />}
          {r.bien.tantiemes && <InfoRow label="Tantièmes" value={r.bien.tantiemes} />}
        </Card>
      )}
      {r.conditions_suspensives?.length > 0 && (
        <Card>
          <CardHeader label="CONDITIONS SUSPENSIVES" color="#d97706" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Condition' }, { label: 'Détail' }, { label: 'Date limite', align: 'center' }, { label: 'Statut', align: 'center' }]} /></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {r.conditions_suspensives.map((c: any, i: number) => {
                const sc = statutStyle(c.statut);
                return (
                  <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                    <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{c.label}</td>
                    <td style={{ padding: '11px 20px', fontSize: 13, color: C.textSec }}>{c.detail || '—'}</td>
                    <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: '#dc2626', textAlign: 'center' }}>{formatDate(c.date_limite) || '—'}</td>
                    <td style={{ padding: '11px 20px', textAlign: 'center' }}><span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: sc.bg, color: sc.text, border: `0.5px solid ${sc.border}` }}>{sc.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      {r.financement && (r.financement.apport || r.financement.montant_pret) && (
        <Card>
          <CardHeader label="PLAN DE FINANCEMENT DÉCLARÉ" color={C.gray.dot} />
          {r.financement.apport && <InfoRow label="Apport personnel" value={`${Number(r.financement.apport).toLocaleString('fr-FR')} €`} />}
          {r.financement.montant_pret && <InfoRow label="Montant emprunté" value={`${Number(r.financement.montant_pret).toLocaleString('fr-FR')} €`} alt />}
          {r.financement.etablissement && <InfoRow label="Établissement pressenti" value={r.financement.etablissement} />}
        </Card>
      )}
      {r.dates_cles?.length > 0 && (
        <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="DATES CLÉS À RETENIR" color={C.orange.dot} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {r.dates_cles.map((d: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < r.dates_cles.length - 1 ? `0.5px solid ${C.orange.border}` : 'none', background: i % 2 === 0 ? C.orange.bg : '#fffbf5' }}>
              <span style={{ fontSize: 14, color: C.text }}>{d.label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: d.important ? '#dc2626' : '#d97706' }}>{formatDate(d.date)}</span>
            </div>
          ))}
        </div>
      )}
      {r.clauses_particulieres?.length > 0 && (
        <Card>
          <CardHeader label="CLAUSES PARTICULIÈRES" color={C.gray.dot} />
          {r.clauses_particulieres.map((c: string, i: number) => (
            <div key={i} style={{ padding: '12px 20px', fontSize: 14, color: C.text, borderBottom: i < r.clauses_particulieres.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary }}>{c}</div>
          ))}
        </Card>
      )}
      {r.servitudes?.length > 0 && (
        <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="SERVITUDES DÉTECTÉES" color={C.orange.dot} />
          {r.servitudes.map((s: string, i: number) => (
            <div key={i} style={{ padding: '12px 20px', fontSize: 14, color: C.text }}>{s}</div>
          ))}
        </div>
      )}
      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererDiagCommunes({ r }: { r: any }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  const isOpen = (key: string) => key in openSections ? openSections[key] : true;

  const typeLabel = r.type_diagnostic === 'DTA' ? 'Dossier Technique Amiante'
    : r.type_diagnostic === 'PLOMB' ? "Constat de Risque d'Exposition au Plomb"
    : r.type_diagnostic === 'TERMITES' ? 'État Parasitaire — Termites'
    : 'Diagnostic Parties Communes';

  const nbRapports = r.rapports?.length || 1;
  const nbDetectes = r.zones_par_localisation?.reduce((acc: number, g: any) => acc + (g.zones?.length || 0), 0) || 0;
  const nbAC1 = r.zones_par_localisation?.reduce((acc: number, g: any) => acc + (g.zones?.filter((z: any) => z.action === 'AC1').length || 0), 0) || 0;
  const nbEP = r.zones_par_localisation?.reduce((acc: number, g: any) => acc + (g.zones?.filter((z: any) => z.action === 'EP').length || 0), 0) || 0;
  const nbSaines = r.zones_saines?.length || 0;
  const nonDetecte = r.resultat_global === 'non_detecte';

  const actionColor = (action: string) => action === 'AC1' ? C.red : action === 'EP' ? C.green : action === 'surveillance' ? C.blue : C.gray;
  const actionLabel = (action: string) => action === 'AC1' ? 'AC1 — Action corrective' : action === 'EP' ? 'EP — Éval. périodique' : action === 'surveillance' ? 'Surveillance régulière' : action || '—';

  // Badges header
  const headerBadges: { label: string; color: string }[] = [];
  if (nonDetecte) headerBadges.push({ label: 'Aucun amiante détecté', color: C.green.dot });
  else headerBadges.push({ label: 'Amiante détecté', color: C.red.dot });
  if (nbAC1 > 0) headerBadges.push({ label: `${nbAC1} action corrective requise`, color: C.orange.dot });
  if (nbRapports > 1) headerBadges.push({ label: `${nbRapports} rapports`, color: C.gray.dot });

  return (
    <div>
      {/* ── HEADER ── */}
      <div style={{ background: C.dark, borderRadius: 14, padding: '22px 28px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: 8, textTransform: 'uppercase' as const }}>{typeLabel}</div>
        <div style={{ fontSize: 19, fontWeight: 600, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>{r.titre}</div>
        {r.commanditaire && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{r.commanditaire}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 10 }}>
          {headerBadges.map((b, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', border: '0.5px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }}>{b.label}</span>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      {!nonDetecte ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
          <Kpi label="Matériaux amiantés" value={String(nbDetectes)} color={nbDetectes > 0 ? C.red.dot : C.green.dot} />
          <Kpi label="Action corrective (AC1)" value={String(nbAC1)} color={nbAC1 > 0 ? '#d97706' : C.green.dot} />
          <Kpi label="Surveillance périodique" value={String(nbEP)} color={C.blue.dot} />
          <Kpi label="Zones sans amiante" value={String(nbSaines)} color={C.green.dot} />
        </div>
      ) : (
        <div style={{ background: C.green.bg, border: `0.5px solid ${C.green.border}`, borderRadius: 12, padding: '16px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.green.dot, flexShrink: 0 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: C.green.text }}>Aucun matériau contenant de l'amiante n'a été détecté dans les parties communes visitées.</div>
        </div>
      )}

      {/* ── ZONES NON ACCESSIBLES ── */}
      {r.zones_non_accessibles?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {r.zones_non_accessibles.map((z: any, i: number) => {
            const isReglementaire = z.niveau === 'reglementaire';
            const col = isReglementaire ? C.orange : C.blue;
            return (
              <div key={i} style={{ background: col.bg, border: `0.5px solid ${col.border}`, borderRadius: 12, padding: '13px 18px', marginBottom: 8, fontSize: 13, color: col.text, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 600, marginBottom: 3 }}>{isReglementaire ? '⚠ Zone non inspectée — obligation réglementaire non remplie' : 'ℹ Zone non visitée lors de la visite'}</div>
                <div>{z.detail}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── RÉSUMÉ ── */}
      {r.resume && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase' as const }}>Résumé</div>
          <div style={{ fontSize: 15, color: C.text, lineHeight: 1.8 }}>{r.resume}</div>
        </div>
      )}

      {/* ── DIAGNOSTIQUEUR ── */}
      {(r.rapports?.length > 0 || r.cabinet || r.operateur || r.date) && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase' as const }}>Informations du diagnostiqueur</div>
          {r.rapports?.length > 1 ? (
            // Plusieurs rapports — grille 2 colonnes
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {r.rapports.map((rap: any, i: number) => (
                <div key={i} style={{ background: C.bgSecondary, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 8 }}>{i === 0 ? 'Rapport initial' : 'Rapport complémentaire'} · {rap.annee || ''}</div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    {rap.cabinet && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>🏢</span><span style={{ fontWeight: 600 }}>{rap.cabinet}</span></div>}
                    {rap.operateur && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>👤</span><span>{rap.operateur}</span></div>}
                    {rap.date && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📅</span><span>{formatDate(rap.date)}</span></div>}
                    {rap.perimetre && <div style={{ display: 'flex', gap: 8, fontSize: 12, color: C.textSec }}><span>📍</span><span>{rap.perimetre}</span></div>}
                    {rap.certification && <div style={{ display: 'flex', gap: 8, fontSize: 12, color: C.textSec }}><span>🏅</span><span>{rap.certification}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Un seul rapport — grille 2x2
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(r.cabinet || r.rapports?.[0]?.cabinet) && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>🏢</span>
                  <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>Entreprise</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.cabinet || r.rapports?.[0]?.cabinet}</div></div>
                </div>
              )}
              {(r.operateur || r.rapports?.[0]?.operateur) && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>👤</span>
                  <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>Opérateur</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.operateur || r.rapports?.[0]?.operateur}</div></div>
                </div>
              )}
              {(r.date || r.rapports?.[0]?.date) && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>📅</span>
                  <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>Date de réalisation</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{formatDate(r.date || r.rapports?.[0]?.date)}</div></div>
                </div>
              )}
              {(r.certification || r.rapports?.[0]?.certification) && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16 }}>🏅</span>
                  <div><div style={{ fontSize: 11, color: C.textSec, marginBottom: 2 }}>Certification</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.certification || r.rapports?.[0]?.certification}</div></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── LOCALISATIONS DU RAPPORT ── */}
      {r.zones_par_localisation?.length > 0 && (
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '14px 20px', borderBottom: `0.5px solid ${C.border}`, background: C.bgSecondary, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: nonDetecte ? C.green.dot : C.red.dot, flexShrink: 0 }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Localisations du rapport</div>
            <div style={{ fontSize: 12, color: C.textSec }}>— {r.zones_par_localisation.length} zone{r.zones_par_localisation.length > 1 ? 's' : ''}</div>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {r.zones_par_localisation.map((groupe: any, gi: number) => {
            const key = `loc-${gi}`;
            const open = isOpen(key);
            const hasAC1 = groupe.zones?.some((z: any) => z.action === 'AC1');
            return (
              <div key={gi} style={{ borderBottom: gi < r.zones_par_localisation.length - 1 ? `0.5px solid ${C.border}` : 'none' }}>
                {/* En-tête de groupe */}
                <div
                  onClick={() => toggleSection(key)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', cursor: 'pointer', background: C.bg }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 15 }}>{groupe.emoji || '📍'}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{groupe.localisation}</span>
                    <span style={{ fontSize: 12, color: C.textSec }}>{groupe.zones?.length || 0} matériau{(groupe.zones?.length || 0) > 1 ? 'x' : ''}</span>
                    {groupe.rapport_annee && <span style={{ fontSize: 11, color: C.textSec }}>· {groupe.cabinet || ''} {groupe.rapport_annee}</span>}
                    {hasAC1 && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: C.red.bg, color: C.red.text, border: `0.5px solid ${C.red.border}` }}>AC1</span>}
                  </div>
                  <span style={{ fontSize: 11, color: C.textSec, transform: open ? 'none' : 'rotate(-90deg)', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
                </div>
                {/* Lignes de zones */}
                {open && groupe.zones?.length > 0 && (
                  <div style={{ background: C.bgSecondary, borderTop: `0.5px solid ${C.border}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr', gap: 8, padding: '8px 20px', fontSize: 10, fontWeight: 700, color: C.textSec, letterSpacing: '0.07em', textTransform: 'uppercase' as const, borderBottom: `0.5px solid ${C.border}` }}>
                      <span>Localisation précise</span><span>Matériau</span><span>Action</span>
                    </div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {groupe.zones.map((z: any, zi: number) => {
                      const ac = actionColor(z.action);
                      const isAC1 = z.action === 'AC1';
                      return (
                        <div key={zi} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1.5fr', gap: 8, padding: '10px 20px', borderBottom: zi < groupe.zones.length - 1 ? `0.5px solid ${C.border}` : 'none', alignItems: 'center', background: isAC1 ? C.red.bg : zi % 2 === 0 ? C.bg : C.bgSecondary }}>
                          <span style={{ fontSize: 13, color: C.text }}>{z.localisation_detail || z.identifiant || '—'}</span>
                          <span style={{ fontSize: 13, color: C.textSec }}>{z.materiau || '—'}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: ac.bg, color: ac.text, border: `0.5px solid ${ac.border}`, display: 'inline-block', whiteSpace: 'nowrap' as const }}>{actionLabel(z.action)}</span>
                        </div>
                      );
                    })}
                    {groupe.plus && (
                      <div style={{ padding: '9px 20px', fontSize: 12, color: C.textSec, fontStyle: 'italic' as const }}>{groupe.plus}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── ZONES NON CONCERNÉES ── */}
      {r.zones_saines?.length > 0 && (
        <div style={{ background: C.green.bg, border: `0.5px solid ${C.green.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '12px 20px', borderBottom: `0.5px solid ${C.green.border}`, background: C.green.bg, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green.dot }} />
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green.text, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>Zones non concernées</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, padding: '14px 20px' }}>
            {r.zones_saines.map((z: string, i: number) => (
              <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, background: C.bg, border: `0.5px solid ${C.green.border}`, color: C.green.text }}>{z}</span>
            ))}
          </div>
        </div>
      )}

      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererModificatifRCP({ r }: { r: any }) {
  const typeLabel: Record<string, string> = {
    creation_lot: 'Création de lot',
    suppression_lot: 'Suppression de lot',
    changement_usage: "Changement d'usage",
    mise_a_jour_tantiemes: 'Mise à jour des tantièmes',
    servitude: 'Servitude',
    fusion_lots: 'Fusion de lots',
    autre: 'Modification diverse',
  };
  const sub = [
    r.notaire?.nom ? `Me ${r.notaire.nom}` : null,
    r.notaire?.ville || null,
    r.date_acte ? formatDate(r.date_acte) : null,
  ].filter(Boolean).join(' · ');

  const roleLabel = (role: string) =>
    role === 'beneficiaire' ? 'Bénéficiaire' :
    role === 'vendeur' ? 'Vendeur' :
    role === 'syndicat' ? 'Syndicat des copropriétaires' : 'Autre partie';

  return (
    <div>
      <Header type="Modificatif de Règlement de Copropriété" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />

      {/* Encarts infos acte */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>

        {/* Notaire */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>⚖️ Notaire</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {r.notaire?.nom && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>👤</span><span style={{ fontWeight: 600 }}>Me {r.notaire.nom}</span></div>}
            {r.notaire?.etude && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>🏢</span><span>{r.notaire.etude}</span></div>}
            {r.notaire?.ville && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📍</span><span>{r.notaire.ville}</span></div>}
          </div>
        </div>

        {/* Acte */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>📋 Acte</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {r.type_modification && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>🏷</span><span style={{ fontWeight: 600 }}>{typeLabel[r.type_modification] || r.type_modification}</span></div>}
            {r.date_acte && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📅</span><span>Acte du {formatDate(r.date_acte)}</span></div>}
            {r.date_acte_rectificatif && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.orange.text }}><span>⚠</span><span>Acte rectificatif du {formatDate(r.date_acte_rectificatif)}</span></div>}
            {r.copropriete && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>🏘</span><span>{r.copropriete}</span></div>}
          </div>
        </div>

        {/* Publication */}
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 12 }}>🏛 Publication foncière</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {r.publication_fonciere?.service && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📍</span><span>{r.publication_fonciere.service}</span></div>}
            {r.publication_fonciere?.date && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text }}><span>📅</span><span>Publié le {formatDate(r.publication_fonciere.date)}</span></div>}
            {!r.publication_fonciere?.service && !r.publication_fonciere?.date && (
              <div style={{ fontSize: 13, color: C.textSec, fontStyle: 'italic' as const }}>À vérifier auprès du service de publicité foncière</div>
            )}
          </div>
        </div>
      </div>

      {/* Sur quoi porte ce modificatif */}
      {r.sur_quoi_porte?.length > 0 && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="SUR QUOI PORTE CE MODIFICATIF" color={C.blue.dot} />
          {r.sur_quoi_porte.map((item: any, i: number) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < r.sur_quoi_porte.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.aspect}</div>
              {item.detail && <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>{item.detail}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Parties impliquées */}
      {r.parties_impliquees?.length > 0 && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="PARTIES IMPLIQUÉES" color={C.gray.dot} />
          {r.parties_impliquees.map((p: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < r.parties_impliquees.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary, gap: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.textSec, flexShrink: 0, minWidth: 140 }}>{roleLabel(p.role)}</span>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{p.nom}</div>
                {p.precision && <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{p.precision}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Impact sur la copropriété */}
      {r.impact_copropriete && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="IMPACT SUR LA COPROPRIÉTÉ" color={C.blue.dot} />
          <div style={{ padding: '16px 20px' }}>
            {/* Lots concernés */}
            {r.impact_copropriete.lots_concernes?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8, letterSpacing: '0.05em' }}>LOTS CONCERNÉS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                  {r.impact_copropriete.lots_concernes.map((lot: any, i: number) => (
                    <div key={i} style={{ background: C.bgSecondary, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: '8px 14px' }}>
                      {lot.numero && <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Lot n°{lot.numero}</span>}
                      {lot.type && <span style={{ fontSize: 13, color: C.textSec }}> — {lot.type}</span>}
                      {lot.description && <div style={{ fontSize: 12, color: C.textSec, marginTop: 3 }}>{lot.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Tantièmes */}
            {(r.impact_copropriete.tantiemes_avant || r.impact_copropriete.tantiemes_apres) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <div style={{ background: C.bgSecondary, border: `0.5px solid ${C.border}`, borderRadius: 10, padding: '10px 18px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>Tantièmes avant</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: C.text }}>{r.impact_copropriete.tantiemes_avant}</div>
                </div>
                <span style={{ fontSize: 20, color: C.textSec }}>→</span>
                <div style={{ background: C.blue.bg, border: `0.5px solid ${C.blue.border}`, borderRadius: 10, padding: '10px 18px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: 11, color: C.blue.text, marginBottom: 4 }}>Tantièmes après</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: C.blue.text }}>{r.impact_copropriete.tantiemes_apres}</div>
                </div>
              </div>
            )}
            {/* Impact acheteur */}
            {r.impact_copropriete.impact_acheteur && (
              <div style={{ background: C.blue.bg, border: `0.5px solid ${C.blue.border}`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: C.blue.text, lineHeight: 1.6 }}>
                💡 {r.impact_copropriete.impact_acheteur}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Points d'attention acheteur */}
      {r.points_attention?.length > 0 && (
        <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="POINTS D'ATTENTION ACHETEUR" color={C.orange.dot} />
          {r.points_attention.map((p: any, i: number) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < r.points_attention.length - 1 ? `0.5px solid ${C.orange.border}` : 'none', background: i % 2 === 0 ? C.orange.bg : '#fffbf5' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>{p.label}</div>
              {p.detail && <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>{p.detail}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Informations complémentaires */}
      {r.infos_complementaires?.length > 0 && (
        <div style={{ background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="INFORMATIONS COMPLÉMENTAIRES" color={C.gray.dot} />
          {r.infos_complementaires.map((info: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: i < r.infos_complementaires.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary, gap: 16 }}>
              <span style={{ fontSize: 13, color: C.textSec }}>{info.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text, textAlign: 'right' as const, flexShrink: 0, maxWidth: '60%' }}>{info.valeur}</span>
            </div>
          ))}
        </div>
      )}

      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RendererAutre({ r }: { r: any }) {
  return (
    <div>
      <Header type="Analyse de Document" titre={r.titre} />
      <Resume text={r.resume} />
      {r.infos_cles?.length > 0 && (
        <Card>
          <CardHeader label="INFORMATIONS CLÉS" color="#2a7d9c" />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {r.infos_cles.map((info: any, i: number) => <InfoRow key={i} label={info.label} value={info.valeur} alt={i % 2 !== 0} />)}
        </Card>
      )}
      {r.contenu?.length > 0 && (
        <Card>
          <CardHeader label="ÉLÉMENTS EXTRAITS DU DOCUMENT" color={C.gray.dot} />
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {r.contenu.map((c: any, i: number) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: i < r.contenu.length - 1 ? `0.5px solid ${C.border}` : 'none', background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
              {c.section && <div style={{ fontSize: 12, color: C.textSec, marginBottom: 4, fontWeight: 500 }}>{c.section}</div>}
              <div style={{ fontSize: 14, color: C.text }}>{c.detail}</div>
            </div>
          ))}
        </Card>
      )}
      <SeparateurSynthese />
      <PointsFortsVigilances forts={r.points_forts} vigilances={r.points_vigilance} />
      <AvisVerimo text={r.avis_verimo} />
    </div>
  );
}

// ── Export principal ────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SafeRenderer({ result }: { result: any }) {
  const type = result?.document_type || 'AUTRE';
  try {
    switch (type) {
      case 'DDT': return <RendererDDT r={result} />;
      case 'PV_AG': return <RendererPVAG r={result} />;
      case 'APPEL_CHARGES': return <RendererAppelCharges r={result} />;
      case 'RCP': return <RendererRCP r={result} />;
      case 'DTG_PPT': return <RendererDTGPPT r={result} />;
      case 'CARNET_ENTRETIEN': return <RendererCarnetEntretien r={result} />;
      case 'PRE_ETAT_DATE': return <RendererPreEtatDate r={result} />;
      case 'ETAT_DATE': return <RendererEtatDate r={result} />;
      case 'TAXE_FONCIERE': return <RendererTaxeFonciere r={result} />;
      case 'COMPROMIS': return <RendererCompromis r={result} />;
      case 'DIAGNOSTIC_PARTIES_COMMUNES': return <RendererDiagCommunes r={result} />;
      case 'MODIFICATIF_RCP': return <RendererModificatifRCP r={result} />;
      default: return <RendererAutre r={result} />;
    }
  } catch {
    return <RendererAutre r={result} />;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DocumentRenderer({ result }: { result: any }) {
  return <SafeRenderer result={result} />;
}
