import { useState } from 'react';

const C = {
  bg: '#ffffff', bgSec: '#f8fafc', border: '#e2e8f0',
  text: '#0f172a', textSec: '#64748b',
  green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', dot: '#16a34a' },
  red: { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', dot: '#dc2626' },
  orange: { bg: '#fff7ed', border: '#fed7aa', text: '#92400e', dot: '#f97316' },
  blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af', dot: '#3b82f6' },
  gray: { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', dot: '#94a3b8' },
  yellow: { bg: '#fefce8', border: '#fde047', text: '#854d0e', dot: '#eab308' },
};

// Formate le texte brut en liste de phrases lisibles
function DetailTexte({ text }: { text: string }) {
  if (!text) return null;
  const phrases = text
    .split(/\.\s+(?=[A-ZÀ-Ü])|;\s+/)
    .map((s: string) => s.trim().replace(/\.$/, ''))
    .filter((s: string) => s.length > 10);
  if (phrases.length <= 1) {
    return <p style={{ margin: 0, fontSize: 13, color: C.textSec, lineHeight: 1.65 }}>{text}</p>;
  }
  return (
    <ul style={{ margin: 0, padding: '0 0 0 16px', listStyle: 'none' }}>
      {phrases.map((p: string, i: number) => (
        <li key={i} style={{ fontSize: 13, color: C.textSec, lineHeight: 1.65, marginBottom: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ color: C.border, marginTop: 6, flexShrink: 0, fontSize: 6 }}>\u25CF</span>
          <span>{p}.</span>
        </li>
      ))}
    </ul>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Accordion({ label, children }: { label?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textSec, fontFamily: 'inherit' }}
      >
        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', fontSize: 10 }}>▶</span>
        {label || (open ? 'Masquer le détail' : 'Voir le détail complet')}
      </button>
      {open && (
        <div style={{ marginTop: 8, fontSize: 13, color: C.textSec, lineHeight: 1.65, paddingLeft: 16, borderLeft: `2px solid ${C.border}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color, background: bg, border: `0.5px solid ${border}`, padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap' as const }}>
      {label}
    </span>
  );
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ fontSize: 12, color, background: bg, padding: '2px 10px', borderRadius: 100, border: `0.5px solid ${color}30` }}>
      {label}
    </span>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CardShell({ children, presence }: { children: React.ReactNode; presence: string }) {
  const s = presence === 'anomalie' ? { bg: C.red.bg, border: C.red.border }
    : presence === 'conforme' || presence === 'non_detecte' ? { bg: C.green.bg, border: C.green.border }
    : presence === 'non_applicable' ? { bg: C.gray.bg, border: C.gray.border }
    : { bg: C.bg, border: C.border };
  return (
    <div style={{ background: s.bg, border: `0.5px solid ${s.border}`, borderRadius: 12, padding: '16px 18px' }}>
      {children}
    </div>
  );
}

// ── Renderers spécifiques par type de diagnostic ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagAmiante({ d }: { d: any }) {
  const ok = d.presence === 'non_detecte' || d.presence === 'absence';
  return (
    <CardShell presence={d.presence}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</span>
        <Badge label={ok ? '✓ Non détecté' : d.presence === 'anomalie' ? 'Présence détectée' : 'Non réalisé'} color={ok ? C.green.text : C.red.text} bg={ok ? C.green.bg : C.red.bg} border={ok ? C.green.border : C.red.border} />
      </div>
      <div style={{ fontSize: 13, color: C.textSec }}>
        {ok ? 'Aucun matériau amianté détecté sur listes A et B.' : 'Présence de matériaux amiantés détectée.'}
        {d.localisation && ` Zones visitées : ${d.localisation}.`}
      </div>
      {d.alerte && <div style={{ fontSize: 13, color: C.red.dot, marginTop: 8, fontWeight: 500 }}>⚠ {d.alerte}</div>}
      {d.detail && <Accordion><DetailTexte text={d.detail} /></Accordion>}
    </CardShell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagTermites({ d }: { d: any }) {
  const ok = d.presence === 'non_detecte' || d.presence === 'absence';
  return (
    <CardShell presence={d.presence}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</span>
        <Badge label={ok ? '✓ Non détecté' : 'Présence détectée'} color={ok ? C.green.text : C.red.text} bg={ok ? C.green.bg : C.red.bg} border={ok ? C.green.border : C.red.border} />
      </div>
      <div style={{ fontSize: 13, color: C.textSec }}>
        {ok ? 'Aucun indice d\'infestation détecté.' : 'Présence de termites détectée.'}
        {d.localisation && ` Zone : ${d.localisation}.`}
      </div>
      {d.alerte && <div style={{ fontSize: 13, color: C.red.dot, marginTop: 8, fontWeight: 500 }}>⚠ {d.alerte}</div>}
      {d.detail && <Accordion><DetailTexte text={d.detail} /></Accordion>}
    </CardShell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagElectricite({ d }: { d: any }) {
  const ok = d.presence === 'conforme';
  const anomalie = d.presence === 'anomalie';
  return (
    <CardShell presence={d.presence}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</span>
        <Badge
          label={ok ? '✓ Conforme' : anomalie ? '⚠ Anomalies' : 'À vérifier'}
          color={ok ? C.green.text : anomalie ? C.red.text : C.orange.text}
          bg={ok ? C.green.bg : anomalie ? C.red.bg : C.orange.bg}
          border={ok ? C.green.border : anomalie ? C.red.border : C.orange.border}
        />
      </div>
      <div style={{ fontSize: 13, color: C.textSec }}>
        {ok ? 'Installation conforme, protections différentielles présentes.' : 'Des points non conformes ont été relevés.'}
      </div>
      {d.alerte && (
        <div style={{ marginTop: 8 }}>
          {d.alerte.split(/\(\d+\)/).filter(Boolean).map((a: string, i: number) => (
            <div key={i} style={{ fontSize: 13, color: C.red.dot, marginTop: 4, fontWeight: 500 }}>⚠ {a.trim()}</div>
          ))}
        </div>
      )}
      {d.detail && <Accordion><DetailTexte text={d.detail} /></Accordion>}
    </CardShell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagGaz({ d }: { d: any }) {
  const na = d.presence === 'non_applicable';
  return (
    <CardShell presence={d.presence}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</span>
        <Badge label={na ? 'Non applicable' : d.presence === 'conforme' ? '✓ Conforme' : '⚠ Anomalies'} color={na ? C.gray.text : d.presence === 'conforme' ? C.green.text : C.red.text} bg={na ? C.gray.bg : d.presence === 'conforme' ? C.green.bg : C.red.bg} border={na ? C.gray.border : d.presence === 'conforme' ? C.green.border : C.red.border} />
      </div>
      {d.localisation && <div style={{ fontSize: 13, color: C.textSec }}>{d.localisation}</div>}
      {d.alerte && <div style={{ fontSize: 13, color: C.red.dot, marginTop: 8, fontWeight: 500 }}>⚠ {d.alerte}</div>}
      {d.detail && <Accordion><DetailTexte text={d.detail} /></Accordion>}
    </CardShell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagPlomb({ d }: { d: any }) {
  const na = d.presence === 'non_applicable';
  const ok = d.presence === 'non_detecte' || d.presence === 'absence';
  return (
    <CardShell presence={d.presence}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</span>
        <Badge label={na ? 'Non applicable' : ok ? '✓ Non détecté' : '⚠ Détecté'} color={na ? C.gray.text : ok ? C.green.text : C.red.text} bg={na ? C.gray.bg : ok ? C.green.bg : C.red.bg} border={na ? C.gray.border : ok ? C.green.border : C.red.border} />
      </div>
      <div style={{ fontSize: 13, color: C.textSec }}>
        {na ? 'Immeuble construit après 1949 — diagnostic non requis.' : ok ? 'Aucune concentration en plomb détectée.' : 'Présence de plomb détectée.'}
      </div>
      {d.alerte && <div style={{ fontSize: 13, color: C.red.dot, marginTop: 8, fontWeight: 500 }}>⚠ {d.alerte}</div>}
      {d.detail && <Accordion><DetailTexte text={d.detail} /></Accordion>}
    </CardShell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagERP({ d }: { d: any }) {
  // Extraire les risques du détail pour les afficher en pills
  const risques: { label: string; level: 'info' | 'warn' | 'ok' }[] = [];
  const detail = d.detail || d.resultat || '';

  // Détection simple des risques dans le texte
  if (/sismique.*zone\s*1|zone\s*1.*sismique/i.test(detail)) risques.push({ label: 'Sismique zone 1', level: 'ok' });
  else if (/sismique.*zone\s*[234]/i.test(detail)) risques.push({ label: 'Sismique zone 2+', level: 'warn' });
  if (/radon.*zone\s*1|zone\s*1.*radon/i.test(detail)) risques.push({ label: 'Radon zone 1', level: 'ok' });
  else if (/radon.*zone\s*[23]/i.test(detail)) risques.push({ label: 'Radon zone 2+', level: 'warn' });
  if (/argile.*moyen|moyen.*argile/i.test(detail)) risques.push({ label: 'Argile aléa moyen', level: 'warn' });
  else if (/argile.*faible|faible.*argile/i.test(detail)) risques.push({ label: 'Argile aléa faible', level: 'ok' });
  if (/inondation|nappe|CATNAT/i.test(detail)) risques.push({ label: 'Risque inondation', level: 'warn' });
  if (/PPRn|PPRm|PPRt/i.test(detail) && /non concern|pas concern/i.test(detail)) risques.push({ label: 'PPR non concerné', level: 'ok' });
  if (/BASIAS|BASOL|ICPE/i.test(detail)) risques.push({ label: 'Sites industriels proches', level: 'info' });

  const pillColor = (level: string) => level === 'ok' ? { color: C.green.text, bg: C.green.bg } : level === 'warn' ? { color: C.orange.text, bg: C.orange.bg } : { color: C.blue.text, bg: C.blue.bg };

  return (
    <CardShell presence="informatif">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</span>
        <Badge label="Informatif" color={C.gray.text} bg={C.gray.bg} border={C.gray.border} />
      </div>
      {risques.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {risques.map((r, i) => {
            const pc = pillColor(r.level);
            return <Pill key={i} label={r.label} color={pc.color} bg={pc.bg} />;
          })}
        </div>
      )}
      {d.alerte && <div style={{ fontSize: 13, color: C.orange.dot, marginTop: 8, fontWeight: 500 }}>⚠ {d.alerte}</div>}
      {d.detail && <Accordion><DetailTexte text={d.detail} /></Accordion>}
    </CardShell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagCarrez({ d }: { d: any }) {
  return (
    <CardShell presence="informatif">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</span>
        <Badge label="Informatif" color={C.gray.text} bg={C.gray.bg} border={C.gray.border} />
      </div>
      {d.resultat && <div style={{ fontSize: 13, color: C.textSec }}>{d.resultat}</div>}
      {d.detail && <Accordion><DetailTexte text={d.detail} /></Accordion>}
    </CardShell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagDPE({ d }: { d: any }) {
  // Le DPE est déjà affiché via les jauges — on affiche juste les infos complémentaires
  return (
    <CardShell presence="informatif">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</span>
        <Badge label="Informatif" color={C.gray.text} bg={C.gray.bg} border={C.gray.border} />
      </div>
      {d.resultat && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 6 }}>{d.resultat}</div>}
      {d.alerte && <div style={{ fontSize: 13, color: C.orange.dot, marginTop: 4, fontWeight: 500 }}>⚠ {d.alerte}</div>}
      {d.detail && <Accordion>{ d.detail}</Accordion>}
    </CardShell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagGenerique({ d }: { d: any }) {
  const s = d.presence === 'anomalie' ? { badge: '⚠ Anomalie', color: C.red.text, bg: C.red.bg, border: C.red.border }
    : d.presence === 'conforme' ? { badge: '✓ Conforme', color: C.green.text, bg: C.green.bg, border: C.green.border }
    : d.presence === 'non_detecte' || d.presence === 'absence' ? { badge: '✓ Non détecté', color: C.green.text, bg: C.green.bg, border: C.green.border }
    : d.presence === 'non_applicable' ? { badge: 'Non applicable', color: C.gray.text, bg: C.gray.bg, border: C.gray.border }
    : { badge: 'Informatif', color: C.gray.text, bg: C.gray.bg, border: C.gray.border };
  return (
    <CardShell presence={d.presence}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{d.label}</span>
        <Badge label={s.badge} color={s.color} bg={s.bg} border={s.border} />
      </div>
      {d.resultat && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 4 }}>{d.resultat}</div>}
      {d.alerte && <div style={{ fontSize: 13, color: C.red.dot, marginTop: 6, fontWeight: 500 }}>⚠ {d.alerte}</div>}
      {d.detail && <Accordion><DetailTexte text={d.detail} /></Accordion>}
    </CardShell>
  );
}

// ── Export principal ──────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DiagnosticCard({ d }: { d: any }) {
  const type = (d.type || '').toUpperCase();
  if (type === 'AMIANTE') return <DiagAmiante d={d} />;
  if (type === 'TERMITES') return <DiagTermites d={d} />;
  if (type === 'ELECTRICITE') return <DiagElectricite d={d} />;
  if (type === 'GAZ') return <DiagGaz d={d} />;
  if (type === 'PLOMB') return <DiagPlomb d={d} />;
  if (type === 'ERP') return <DiagERP d={d} />;
  if (type === 'CARREZ' || type === 'MESURAGE') return <DiagCarrez d={d} />;
  if (type === 'DPE') return <DiagDPE d={d} />;
  return <DiagGenerique d={d} />;
}
