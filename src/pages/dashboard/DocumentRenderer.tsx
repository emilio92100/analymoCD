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
            <div key={i} style={{ padding: '12px 20px', borderBottom: i < forts.length - 1 ? `0.5px solid #bbf7d0` : 'none', background: i % 2 === 0 ? '#f0fdf4' : '#f7fef9', fontSize: 14, color: C.text }}>
              {p}
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
            <div key={i} style={{ padding: '12px 20px', borderBottom: i < vigilances.length - 1 ? `0.5px solid #fecaca` : 'none', background: i % 2 === 0 ? '#fef2f2' : '#fff5f5', fontSize: 14, color: C.text }}>
              {p}
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
  const sub = [r.diagnostiqueur?.nom ? `Diagnostiqueur : ${r.diagnostiqueur.nom}` : null, r.diagnostiqueur?.date ? `le ${r.diagnostiqueur.date}` : null].filter(Boolean).join(' · ');

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

  const lotIcon = (type: string) => type === 'cave' ? '🔒' : type === 'parking' || type === 'garage' ? '🚗' : type === 'grenier' ? '📦' : '🏠';

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
          {r.diagnostiqueur?.date && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 3 }}>📅 Réalisé le {r.diagnostiqueur.date}</div>}
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
                    {(lot.etage || lot.description) && <div style={{ fontSize: 12, color: C.textSec }}>{lot.etage || lot.description}</div>}
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
              const shortLabel = d.label?.length > 28 ? d.label.substring(0, 26) + '…' : d.label;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{shortLabel}</span>
                  <span style={{ fontSize: 13 }}>{s.icon}</span>
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

      {/* Travaux préconisés */}
      {r.travaux_preconises?.length > 0 && (
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
        {r.quorum?.tantiemes_pct && <Kpi label="Quorum" value={r.quorum.tantiemes_pct} color="#16a34a" sub={r.quorum.presents && r.quorum.total ? `${r.quorum.presents}/${r.quorum.total} copropriétaires présents` : undefined} tooltip="Le quorum est le pourcentage de tantièmes représentés à l'assemblée générale. Il détermine si les décisions votées sont valides. Un quorum faible peut fragiliser certains votes." />}
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
  const sub = [r.periode, r.lot ? `Lot ${r.lot}` : null, r.syndic ? `Syndic : ${r.syndic}` : null].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="Appel de Charges / Appel de Fonds" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />
      <KpiGrid>
        {r.montant_trimestre && <Kpi label="Appel ce trimestre" value={`${Number(r.montant_trimestre).toLocaleString('fr-FR')} €`} />}
        {r.montant_annuel && <Kpi label="Charges annuelles" value={`${Number(r.montant_annuel).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="× 4 trimestres" />}
        {r.montant_mensuel && <Kpi label="Charges mensuelles" value={`${Number(r.montant_mensuel).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="/ mois" />}
      </KpiGrid>
      {r.decomposition?.length > 0 && (
        <Card>
          <CardHeader label="DÉCOMPOSITION DE L'APPEL" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Poste' }, { label: 'Trimestre', align: 'right' }, { label: 'Annuel estimé', align: 'right' }]} /></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {r.decomposition.map((d: any, i: number) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{d.poste}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: C.text, textAlign: 'right' }}>{d.trimestre ? `${Number(d.trimestre).toLocaleString('fr-FR')} €` : '—'}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.textSec, textAlign: 'right' }}>{d.annuel ? `${Number(d.annuel).toLocaleString('fr-FR')} €` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Card>
        <CardHeader label="INFORMATIONS LOT" color={C.gray.dot} />
        {r.lot && <InfoRow label="Lot concerné" value={r.lot} />}
        {r.echeance && <InfoRow label="Date d'échéance" value={r.echeance} alt />}
        {r.solde_precedent !== null && r.solde_precedent !== undefined && <InfoRow label="Solde précédent" value={`${Number(r.solde_precedent).toLocaleString('fr-FR')} €`} valueColor={Number(r.solde_precedent) === 0 ? '#16a34a' : '#dc2626'} />}
        <InfoRow label="Impayés détectés" value={r.impayes ? 'Oui' : 'Aucun'} alt valueColor={r.impayes ? '#dc2626' : '#16a34a'} />
      </Card>
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
  const sub = [r.syndic, r.date_maj ? `Mis à jour le ${r.date_maj}` : null].filter(Boolean).join(' · ');
  return (
    <div>
      <Header type="Carnet d'Entretien de l'Immeuble" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />
      {r.contrats?.length > 0 && (
        <Card>
          <CardHeader label="CONTRATS DE MAINTENANCE EN COURS" color="#16a34a" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Équipement' }, { label: 'Prestataire' }, { label: 'Échéance', align: 'right' }]} /></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {r.contrats.map((c: any, i: number) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{c.equipement}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.textSec }}>{c.prestataire || '—'}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text, textAlign: 'right' }}>{c.echeance || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {r.travaux_realises?.length > 0 && (
        <Card>
          <CardHeader label="HISTORIQUE DES TRAVAUX RÉALISÉS" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Année' }, { label: 'Travaux' }, { label: 'Montant', align: 'right' }]} /></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {r.travaux_realises.map((t: any, i: number) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                  <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: C.text }}>{t.annee}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{t.label}</td>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text, textAlign: 'right' }}>{t.montant ? `${Number(t.montant).toLocaleString('fr-FR')} €` : '—'}</td>
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
function RendererPreEtatDate({ r }: { r: any }) {
  const sub = [r.date ? `Établi le ${r.date}` : null, r.lot ? `Lot ${r.lot}` : null, r.syndic ? `Syndic : ${r.syndic}` : null].filter(Boolean).join(' · ');
  const totalCharge = r.travaux_charge_vendeur?.reduce((s: number, t: { montant?: number }) => s + (Number(t.montant) || 0), 0) || 0;
  return (
    <div>
      <Header type="Pré-État Daté" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />
      <KpiGrid>
        <div style={{ background: Number(r.impayes_vendeur) === 0 ? C.green.bg : C.red.bg, border: `0.5px solid ${Number(r.impayes_vendeur) === 0 ? C.green.border : C.red.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: C.textSec, marginBottom: 8 }}>Impayés vendeur</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: Number(r.impayes_vendeur) === 0 ? '#16a34a' : '#dc2626' }}>{r.impayes_vendeur !== undefined ? `${Number(r.impayes_vendeur).toLocaleString('fr-FR')} €` : '—'}</div>
          <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{Number(r.impayes_vendeur) === 0 ? 'Vendeur à jour' : 'Attention'}</div>
        </div>
        {r.fonds_travaux_alur && <Kpi label="Fonds travaux ALUR récupérable" value={`${Number(r.fonds_travaux_alur).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="Versé à l'acheteur à la signature" />}
        {totalCharge > 0 && <Kpi label="Travaux charge vendeur" value={`${totalCharge.toLocaleString('fr-FR')} €`} color="#f97316" sub="Votés avant compromis" />}
      </KpiGrid>
      {r.travaux_charge_vendeur?.length > 0 && (
        <div style={{ background: C.orange.bg, border: `0.5px solid ${C.orange.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="TRAVAUX VOTÉS À LA CHARGE DU VENDEUR" color={C.orange.dot} />
          <div style={{ padding: '10px 20px', background: C.blue.bg, borderBottom: `0.5px solid ${C.blue.border}`, fontSize: 13, color: C.blue.text }}>
            ℹ Ces travaux ont été votés avant le compromis — ils restent à la charge du vendeur.
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {r.travaux_charge_vendeur.map((t: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: i < r.travaux_charge_vendeur.length - 1 ? `0.5px solid ${C.orange.border}` : 'none', background: i % 2 === 0 ? C.orange.bg : '#fffbf5' }}>
              <div style={{ fontSize: 14, color: C.text }}>{t.label}</div>
              {t.montant && <div style={{ fontSize: 15, fontWeight: 600, color: '#f97316', whiteSpace: 'nowrap' as const, marginLeft: 20 }}>{Number(t.montant).toLocaleString('fr-FR')} €</div>}
            </div>
          ))}
        </div>
      )}
      {r.procedures_contre_vendeur?.length > 0 && (
        <div style={{ background: C.red.bg, border: `0.5px solid ${C.red.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="PROCÉDURES CONTRE LE VENDEUR" color={C.red.dot} />
          {r.procedures_contre_vendeur.map((p: string, i: number) => (
            <div key={i} style={{ padding: '12px 20px', fontSize: 14, color: C.text }}>{p}</div>
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
function RendererEtatDate({ r }: { r: any }) {
  const sub = [r.date ? `Établi le ${r.date}` : null, r.lot ? `Lot ${r.lot}` : null, r.syndic].filter(Boolean).join(' · ');
  const soldeColor = r.solde_sens === 'acheteur' ? '#16a34a' : '#dc2626';
  return (
    <div>
      <Header type="État Daté" titre={r.titre} sub={sub} />
      <Resume text={r.resume} />
      <KpiGrid>
        {r.solde_net !== undefined && <Kpi label="Solde net" value={`${r.solde_sens === 'acheteur' ? '+' : '-'} ${Number(Math.abs(r.solde_net)).toLocaleString('fr-FR')} €`} color={soldeColor} sub={r.solde_sens === 'acheteur' ? "En faveur de l'acheteur" : 'En faveur du vendeur'} />}
        {r.fonds_travaux_alur && <Kpi label="Fonds travaux ALUR" value={`${Number(r.fonds_travaux_alur).toLocaleString('fr-FR')} €`} color="#2a7d9c" sub="Transféré à l'acheteur" />}
        {r.travaux_consignes?.length > 0 && <Kpi label="Travaux consignés vendeur" value={`${r.travaux_consignes.reduce((s: number, t: { montant?: number }) => s + (Number(t.montant) || 0), 0).toLocaleString('fr-FR')} €`} color="#f97316" />}
      </KpiGrid>
      {r.decomposition?.length > 0 && (
        <Card>
          <CardHeader label="DÉCOMPTE DÉFINITIF" color="#2a7d9c" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Poste' }, { label: 'Montant', align: 'center' }, { label: 'Sens', align: 'center' }]} /></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {r.decomposition.map((d: any, i: number) => {
                const dc = d.sens === 'acheteur_recoit' ? { bg: C.green.bg, text: '#166534', border: C.green.border, label: 'Acheteur reçoit' } : { bg: C.red.bg, text: '#991b1b', border: C.red.border, label: 'Vendeur doit' };
                return (
                  <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                    <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{d.poste}</td>
                    <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: C.text, textAlign: 'center' }}>{d.montant ? `${Number(d.montant).toLocaleString('fr-FR')} €` : '—'}</td>
                    <td style={{ padding: '11px 20px', textAlign: 'center' }}><span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: dc.bg, color: dc.text, border: `0.5px solid ${dc.border}` }}>{dc.label}</span></td>
                  </tr>
                );
              })}
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
  const sub = [r.date_signature ? `Signé le ${r.date_signature}` : null, r.agence, r.notaire_acheteur ? `Notaire acheteur : ${r.notaire_acheteur}` : null].filter(Boolean).join(' · ');
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
                    <td style={{ padding: '11px 20px', fontSize: 14, fontWeight: 500, color: '#dc2626', textAlign: 'center' }}>{c.date_limite || '—'}</td>
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
              <span style={{ fontSize: 14, fontWeight: 600, color: d.important ? '#dc2626' : '#d97706' }}>{d.date}</span>
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
  const typeLabel = r.type_diagnostic === 'DTA' ? 'Dossier Technique Amiante' : r.type_diagnostic === 'PLOMB' ? "Constat de Risque d'Exposition au Plomb" : r.type_diagnostic === 'TERMITES' ? 'État Parasitaire — Termites' : 'Diagnostic Parties Communes';
  const sub = [r.date ? `Réalisé le ${r.date}` : null, r.cabinet, r.certification].filter(Boolean).join(' · ');
  const resStyle = r.resultat_global === 'non_detecte' ? { ...C.green, label: 'Non détecté' } : r.resultat_global === 'surveillance' ? { ...C.orange, label: 'Surveillance requise' } : { ...C.red, label: 'Détecté' };
  return (
    <div>
      <Header type={typeLabel} titre={r.titre} sub={sub} />
      <Resume text={r.resume} />
      <KpiGrid>
        <div style={{ background: resStyle.bg, border: `0.5px solid ${resStyle.border}`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: C.textSec, marginBottom: 8 }}>Résultat global</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: resStyle.text }}>{resStyle.label}</div>
        </div>
        {r.action_requise && <Kpi label="Action requise" value={r.action_requise === 'retrait' ? 'Retrait obligatoire' : r.action_requise === 'surveillance' ? 'Surveillance périodique' : r.action_requise === 'conservation' ? 'Conservation en état' : 'Aucune'} color={r.action_requise === 'retrait' ? '#dc2626' : r.action_requise === 'surveillance' ? '#d97706' : '#16a34a'} />}
        {r.prochaine_visite && <Kpi label="Prochaine visite" value={r.prochaine_visite} />}
      </KpiGrid>
      {r.zones_detectees?.length > 0 && (
        <Card>
          <CardHeader label="ZONES / MATÉRIAUX CONCERNÉS" color={C.orange.dot} />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><TableHeader cols={[{ label: 'Localisation' }, { label: 'Matériau' }, { label: 'Liste' }, { label: 'Action' }]} /></thead>
            <tbody>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {r.zones_detectees.map((z: any, i: number) => (
                <tr key={i} style={{ borderBottom: `0.5px solid ${C.border}`, background: i % 2 === 0 ? C.bg : C.bgSecondary }}>
                  <td style={{ padding: '11px 20px', fontSize: 14, color: C.text }}>{z.localisation}</td>
                  <td style={{ padding: '11px 20px', fontSize: 13, color: C.textSec }}>{z.materiau || '—'}</td>
                  <td style={{ padding: '11px 20px', fontSize: 13, color: C.textSec }}>{z.liste || '—'}</td>
                  <td style={{ padding: '11px 20px', fontSize: 13, color: z.action === 'retrait' ? '#dc2626' : z.action === 'surveillance' ? '#d97706' : C.textSec }}>{z.action || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {r.zones_saines?.length > 0 && (
        <div style={{ background: C.green.bg, border: `0.5px solid ${C.green.border}`, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <CardHeader label="ZONES NON CONCERNÉES" color={C.green.dot} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '16px 20px' }}>
            {r.zones_saines.map((z: string, i: number) => (
              <span key={i} style={{ fontSize: 13, padding: '5px 14px', borderRadius: 100, background: C.bg, border: `0.5px solid ${C.green.border}`, color: '#166534' }}>{z}</span>
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
