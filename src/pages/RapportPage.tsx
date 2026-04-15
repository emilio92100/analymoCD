import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchAnalyseById, fetchAnalyseByShareToken, getOrCreateShareToken } from '../lib/analyses';
import { supabase } from '../lib/supabase';
import DocumentRenderer from './dashboard/DocumentRenderer';
import {
  ChevronLeft, Download, Building2, AlertTriangle, CheckCircle,
  Shield, FileText, Gavel, Info, Star, Paperclip,
  RefreshCw, Lock, ChevronDown, ChevronUp, Copy, Check,
  Home, TrendingDown,
} from 'lucide-react';

/* ══════════════════════════════════
   UTILITAIRES
══════════════════════════════════ */
function getScoreColor(score: number) {
  if (score >= 17) return '#15803d';
  if (score >= 14) return '#16a34a';
  if (score >= 10) return '#d97706';
  if (score >= 7) return '#ea580c';
  return '#dc2626';
}
function getScoreLabel(score: number) {
  if (score >= 17) return 'Bien irréprochable';
  if (score >= 14) return 'Bien sain';
  if (score >= 10) return 'Bien correct avec réserves';
  if (score >= 7) return 'Bien risqué';
  return 'Bien à éviter';
}
function getTypeBienLabel(type: string) {
  if (type === 'maison') return 'Maison individuelle';
  if (type === 'maison_copro') return 'Maison en copropriété';
  return 'Appartement en copropriété';
}
function getProfilLabel(profil: string) {
  return profil === 'invest' ? 'Investissement locatif' : 'Résidence principale';
}
function isCoproType(type: string) {
  return type === 'appartement' || type === 'maison_copro';
}
function safeStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

/* ══════════════════════════════════
   SAFE TAB BOUNDARY — protection bug React #31
══════════════════════════════════ */
class SafeTabBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Erreur d'affichage</p>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>Un problème est survenu sur cet onglet. Vos données sont intactes.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ══════════════════════════════════
   ACCORDÉON
══════════════════════════════════ */
type AccordionStatus = 'ok' | 'warning' | 'alert' | 'neutral';
function AccordionSection({
  title, sub, icon, status, badge, defaultOpen, tooltip, children,
}: {
  title: string; sub?: string; icon: string; status: AccordionStatus;
  badge?: string; defaultOpen?: boolean; tooltip?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const [showTooltip, setShowTooltip] = useState(false);
  const dotColor = status === 'alert' ? '#ef4444' : status === 'warning' ? '#f97316' : status === 'ok' ? '#22c55e' : '#94a3b8';
  const iconBg = status === 'alert' ? '#fef2f2' : status === 'warning' ? '#fff7ed' : status === 'ok' ? '#f0fdf4' : '#f8fafc';
  const badgeStyle = status === 'alert'
    ? { background: '#fef2f2', color: '#991b1b' }
    : status === 'warning'
      ? { background: '#fff7ed', color: '#9a3412' }
      : status === 'ok'
        ? { background: '#f0fdf4', color: '#166534' }
        : { background: '#f8fafc', color: '#64748b', border: '0.5px solid #e2e8f0' };

  return (
    <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 14, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
        onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{title}</span>
            {tooltip && (
              <div style={{ position: 'relative', display: 'inline-flex' }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={e => e.stopPropagation()}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>i</div>
                {showTooltip && (
                  <div style={{ position: 'absolute', left: 22, top: -4, width: 300, background: '#0f172a', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#fff', lineHeight: 1.7, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                    {tooltip.split('|').map((part, i) => (
                      <div key={i} style={{ marginBottom: i < tooltip.split('|').length - 1 ? 8 : 0, paddingBottom: i < tooltip.split('|').length - 1 ? 8 : 0, borderBottom: i < tooltip.split('|').length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>{part.trim()}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {badge && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, ...badgeStyle }}>{badge}</span>}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
          {open ? <ChevronUp size={14} color="#94a3b8" /> : <ChevronDown size={14} color="#94a3b8" />}
        </div>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   TRAVAUX ROW
══════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TravauxRow({ t, variant }: { t: any; variant: 'realise' | 'vote' | 'evoque' }) {
  const colors = {
    realise: { bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e', text: '#166534', amount: '#16a34a' },
    vote: { bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6', text: '#1e40af', amount: '#1d4ed8' },
    evoque: { bg: '#fff7ed', border: '#fed7aa', dot: '#f97316', text: '#92400e', amount: '#f97316' },
  };
  const c = colors[variant];
  const montant = typeof t.montant_estime === 'number' ? t.montant_estime : null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 10, background: c.bg, border: `1px solid ${c.border}` }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{t.label}</div>
        <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
          {variant === 'realise' && t.annee && `Réalisé en ${t.annee}`}
          {variant === 'vote' && t.annee && `Prévu ${t.annee}`}
          {variant === 'evoque' && t.annee && `Horizon ${t.annee}`}
          {t.justificatif && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 7px', borderRadius: 100 }}>Justificatif</span>}
          {t.charge_vendeur && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 7px', borderRadius: 100 }}>Charge vendeur</span>}
          {variant === 'evoque' && t.precision && <span style={{ display: 'block', marginTop: 3 }}>{t.precision}</span>}
        </div>
      </div>
      {montant ? (
        <span style={{ fontSize: 13, fontWeight: 700, color: c.amount, flexShrink: 0 }}>{variant === 'realise' ? '' : '~'}{montant.toLocaleString('fr-FR')}€</span>
      ) : variant === 'evoque' ? (
        <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>Non chiffré</span>
      ) : null}
    </div>
  );
}

/* ══════════════════════════════════
   DPE GAUGE
══════════════════════════════════ */
function DpeGauge({ classe }: { classe: string }) {
  const classes = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const colors: Record<string, string> = { A: '#16a34a', B: '#22c55e', C: '#84cc16', D: '#eab308', E: '#f97316', F: '#ef4444', G: '#991b1b' };
  return (
    <div style={{ margin: '4px 0' }}>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 48 }}>
        {classes.map((c, i) => {
          const isActive = c === classe;
          const h = 24 + i * 3;
          return (
            <div key={c} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: isActive ? 44 : h, borderRadius: 6, background: isActive ? colors[c] : `${colors[c]}28`, border: isActive ? `2px solid ${colors[c]}` : `1px solid ${colors[c]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: isActive ? `0 4px 12px ${colors[c]}40` : 'none' }}>
                <span style={{ fontSize: isActive ? 13 : 11, fontWeight: isActive ? 900 : 600, color: isActive ? '#fff' : colors[c] }}>{c}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 5, fontSize: 11, color: '#94a3b8', textAlign: 'center' as const }}>
        Classe <strong style={{ color: colors[classe] || '#64748b' }}>{classe}</strong>
      </div>
    </div>
  );
}

/* ══════════════════════════════════
   DIAGNOSTIC ROW
══════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DiagRow({ d }: { d: any }) {
  const typeIcons: Record<string, string> = {
    DPE: '⚡', AMIANTE: '🏗', PLOMB: '🔩', ELECTRICITE: '🔌', GAZ: '🔥',
    TERMITES: '🐛', ERP: '📋', RADON: '☢️', CARREZ: '📐', AUTRE: '📄'
  };
  const typeColors: Record<string, string> = {
    DPE: '#0891b2', AMIANTE: '#dc2626', PLOMB: '#7c3aed', ELECTRICITE: '#d97706',
    GAZ: '#ea580c', TERMITES: '#92400e', ERP: '#475569', RADON: '#6d28d9', CARREZ: '#0891b2', AUTRE: '#64748b'
  };
  const icon = typeIcons[d.type] || '📄';
  const color = typeColors[d.type] || '#64748b';

  const isERP = d.type === 'ERP';
  const isCarrez = d.type === 'CARREZ' || (d.label as string)?.toLowerCase().includes('carrez') || (d.label as string)?.toLowerCase().includes('mesurage') || (d.label as string)?.toLowerCase().includes('superficie');
  const hasAlert = !!d.alerte && !isERP;
  const isAbsence = d.presence === 'absence';
  const isNonRealise = d.presence === 'non_realise';

  const presenceStyle = isAbsence
    ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' }
    : isNonRealise ? { bg: '#f8fafc', border: '#e2e8f0', text: '#94a3b8' }
    : isERP ? { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' }
    : hasAlert ? { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' }
    : { bg: '#fff7ed', border: '#fed7aa', text: '#d97706' };
  const presenceLabel = isAbsence ? '✓ Non détecté' : isNonRealise ? 'Non réalisé' : isERP ? 'Informatif' : hasAlert ? 'Anomalies' : 'Détecté';

  const dpeClasse = d.type === 'DPE' ? (d.resultat as string)?.match(/Classe\s+([A-G])\b/i)?.[1]?.toUpperCase() : null;
  const gesClasse = d.type === 'DPE' ? (d.resultat as string)?.match(/GES[:\s]+Classe\s+([A-G])\b/i)?.[1]?.toUpperCase() : null;
  const resultatBrut = String(d.resultat || '');

  const parseAnomalies = (text: string): string[] => {
    if (!text) return [];
    const numbered = text.match(/\(\d+\)[^(]+/g);
    if (numbered && numbered.length > 1) return numbered.map(s => s.replace(/^\(\d+\)\s*/, '').trim()).filter((s: string) => s.length > 3);
    const bySemicolon = text.split(/[;]/).map(s => s.trim()).filter((s: string) => s.length > 10);
    if (bySemicolon.length > 1) return bySemicolon;
    return [text];
  };

  const parseCarrez = (text: string): Array<{ piece: string; surface: string }> => {
    if (d.pieces_detail && Array.isArray(d.pieces_detail) && d.pieces_detail.length > 0) {
      return d.pieces_detail.map((p: { piece: string; surface: number }) => ({ piece: p.piece, surface: `${p.surface} m²` }));
    }
    const pieces: Array<{ piece: string; surface: string }> = [];
    const matches = [...text.matchAll(/([a-zA-Zéèêàùôûîï][a-zA-Zéèêàùôûîï\s]+?)\s+(\d+[,.]\d+)\s*m²/gi)];
    for (const m of matches) {
      const piece = m[1].trim();
      if (piece.length > 1 && !['surface', 'total', 'sol', 'carrez', 'balcon'].some(w => piece.toLowerCase().includes(w))) {
        pieces.push({ piece: piece.charAt(0).toUpperCase() + piece.slice(1), surface: `${m[2].replace(',', '.')} m²` });
      }
    }
    return pieces;
  };

  const parseERP = (text: string): string[] =>
    text.split(/\.\s+/).map(s => s.trim().replace(/\.$/, '')).filter(s => s.length > 5);

  const anomalies = !isERP && !isCarrez && !dpeClasse ? parseAnomalies(resultatBrut) : [];
  const carrezPieces = isCarrez ? parseCarrez(resultatBrut) : [];
  const erpPoints = isERP ? parseERP(resultatBrut) : [];
  const carrezTotal = resultatBrut.match(/(?:loi\s+carrez|carrez)\s*(?:totale?)?\s*:?\s*([\d,\.]+)\s*m²/i);
  const carrezSolTotal = resultatBrut.match(/(?:surface\s+au\s+sol|sol)\s*(?:totale?)?\s*:?\s*([\d,\.]+)\s*m²/i);

  return (
    <div style={{ borderRadius: 12, border: `1.5px solid ${hasAlert ? '#fecaca' : isAbsence ? '#bbf7d0' : isERP ? '#e2e8f0' : '#edf2f7'}`, overflow: 'hidden', background: '#fff' }}>
      <div style={{ padding: '12px 16px', background: hasAlert ? '#fef2f2' : isAbsence ? '#f0fdf4' : isERP ? '#f8fafc' : `${color}08`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{d.label || d.type}</div>
            {d.localisation && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>📍 {d.localisation}</div>}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: presenceStyle.bg, border: `1px solid ${presenceStyle.border}`, color: presenceStyle.text, flexShrink: 0, whiteSpace: 'nowrap' }}>{presenceLabel}</span>
      </div>
      {!isAbsence && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dpeClasse && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>⚡ Énergie primaire (DPE)</div>
                <DpeGauge classe={dpeClasse} />
              </div>
              {gesClasse && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>🌿 Émissions GES</div>
                  <DpeGauge classe={gesClasse} />
                </div>
              )}
            </div>
          )}
          {isERP && (
            <div style={{ background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7', overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7' }}>ℹ️ Informations réglementaires de la commune</div>
              {erpPoints.length > 1 ? erpPoints.map((point, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderBottom: i < erpPoints.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  <span style={{ color: '#94a3b8', flexShrink: 0 }}>•</span><span>{point}</span>
                </div>
              )) : <div style={{ padding: '10px 12px', fontSize: 12, color: '#475569', lineHeight: 1.65 }}>{resultatBrut}</div>}
            </div>
          )}
          {isCarrez && !isAbsence && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(carrezTotal || carrezSolTotal) && (
                <div style={{ display: 'grid', gridTemplateColumns: carrezTotal && carrezSolTotal ? '1fr 1fr' : '1fr', gap: 8 }}>
                  {carrezTotal && (
                    <div style={{ padding: '12px 14px', background: '#f0f9ff', borderRadius: 9, border: '1px solid #bae6fd', textAlign: 'center' as const }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0284c7' }}>{carrezTotal[1].replace(',', '.')} m²</div>
                      <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>Surface loi Carrez</div>
                    </div>
                  )}
                  {carrezSolTotal && (
                    <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7', textAlign: 'center' as const }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{carrezSolTotal[1].replace(',', '.')} m²</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Surface au sol</div>
                    </div>
                  )}
                </div>
              )}
              {carrezPieces.length > 0 && (
                <div style={{ background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7', overflow: 'hidden' }}>
                  <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7' }}>Détail par pièce</div>
                  {carrezPieces.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', borderBottom: i < carrezPieces.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: 14 }}>
                      <span style={{ color: '#374151' }}>{p.piece}</span>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.surface}</span>
                    </div>
                  ))}
                </div>
              )}
              {carrezPieces.length === 0 && !carrezTotal && (
                <div style={{ background: '#f8fafc', borderRadius: 9, padding: '10px 14px', border: '1px solid #edf2f7', fontSize: 12, color: '#374151', lineHeight: 1.65 }}>{resultatBrut}</div>
              )}
            </div>
          )}
          {!isERP && !isCarrez && !dpeClasse && resultatBrut && (
            anomalies.length > 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {anomalies.map((anomalie, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '9px 12px', background: hasAlert ? '#fef2f2' : '#f8fafc', borderRadius: 9, border: `1px solid ${hasAlert ? '#fecaca' : '#edf2f7'}`, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{hasAlert ? '⚠️' : 'ℹ️'}</span>
                    <span style={{ fontSize: 12, color: hasAlert ? '#991b1b' : '#374151', lineHeight: 1.65 }}>{anomalie}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: hasAlert ? '#fef2f2' : '#f8fafc', borderRadius: 9, padding: '10px 14px', border: `1px solid ${hasAlert ? '#fecaca' : '#edf2f7'}` }}>
                <div style={{ fontSize: 12, color: hasAlert ? '#991b1b' : '#374151', lineHeight: 1.65 }}>{resultatBrut}</div>
              </div>
            )
          )}
          {d.alerte && !isERP && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 9, border: '1px solid #fecaca', fontSize: 12, color: '#991b1b', lineHeight: 1.65, fontWeight: 500 }}>⚠️ {d.alerte}</div>
          )}
          {(d.date_diagnostic || d.date_validite) && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {d.date_diagnostic && <span style={{ fontSize: 11, color: '#94a3b8' }}>📅 Réalisé le {d.date_diagnostic}</span>}
              {d.date_validite && <span style={{ fontSize: 11, color: '#94a3b8' }}>✅ Valide jusqu'au {d.date_validite}</span>}
            </div>
          )}
          {d.travaux_preconises?.length > 0 && d.perimetre === 'lot_privatif' && (
            <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 9, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>🔧 Travaux recommandés</div>
              {d.travaux_preconises.map((t: string, i: number) => (
                <div key={i} style={{ fontSize: 12, color: '#92400e', marginBottom: 4, lineHeight: 1.5 }}>• {t}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   BOUTON PARTAGER
══════════════════════════════════ */
function ShareButton({ analyseId }: { analyseId: string }) {
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

  const getShareUrl = async (): Promise<string | null> => {
    setLoading(true);
    const token = await getOrCreateShareToken(analyseId);
    setLoading(false);
    if (!token) return null;
    return `${window.location.origin}/rapport/partage/${token}`;
  };

  const handleCopy = async () => {
    const url = await getShareUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setShowMenu(false);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmail = async () => {
    const url = await getShareUrl();
    if (!url) return;
    setShowMenu(false);
    const subject = encodeURIComponent('Rapport Verimo partagé avec vous');
    const body = encodeURIComponent(`Bonjour,\n\nJe vous partage un rapport d'analyse immobilière généré par Verimo.\n\nVous pouvez le consulter ici :\n${url}\n\nBonne lecture,`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button onClick={() => setShowMenu(!showMenu)} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: copied ? '#4ade80' : 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Lien copié !' : loading ? 'Chargement…' : 'Partager'}
      </button>
      {showMenu && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 100, overflow: 'hidden', minWidth: 200 }}>
          <button onClick={handleCopy}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0f172a', textAlign: 'left' as const }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <Copy size={14} style={{ color: '#64748b', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600 }}>Copier le lien</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Lien partageable sans compte</div>
            </div>
          </button>
          <div style={{ height: 1, background: '#f1f5f9' }} />
          <button onClick={handleEmail}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0f172a', textAlign: 'left' as const }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            <div>
              <div style={{ fontWeight: 600 }}>Envoyer par e-mail</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Ouvre votre client mail</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   HEADER RAPPORT
══════════════════════════════════ */
type RapportData = ReturnType<typeof buildRapport>;

function RapportHeader({ rapport, isShared }: { rapport: RapportData; isShared: boolean }) {
  const scoreColor = getScoreColor(rapport.score);
  const isComplete = rapport.type === 'complete';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Hero header — full dark */}
      <div style={{ background: 'linear-gradient(135deg, #0f2d3d 0%, #1a4a5e 100%)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Topbar nav */}
        <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {!isShared ? (
            <Link to="/dashboard/analyses" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '9px 18px', borderRadius: 9, background: '#2a7d9c', flexShrink: 0 }}>
              <ChevronLeft size={15} /> Mes analyses
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              <Shield size={13} /> Rapport partagé — Verimo
            </div>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {!isShared && <ShareButton analyseId={rapport.id} />}
            <button onClick={() => { const params = new URLSearchParams(window.location.search); window.open(`/rapport/print?id=${params.get('id') || ''}`, '_blank'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', background: '#fff', color: '#0f2d3d', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Download size={14} /> Télécharger PDF
            </button>
          </div>
        </div>

        {/* Hero content */}
        {isComplete && (
          <div style={{ padding: '22px 24px 24px', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            {/* Score cercle */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative', width: 88, height: 88 }}>
                <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
                  <circle cx="44" cy="44" r="36" fill="none" stroke={scoreColor} strokeWidth="7"
                    strokeDasharray={`${(rapport.score / 20) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{rapport.score.toFixed(1)}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>/20</span>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 100, background: `${scoreColor}30`, border: `1px solid ${scoreColor}60`, color: '#fff' }}>
                {getScoreLabel(rapport.score)}
              </span>
            </div>

            {/* Adresse + infos */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', marginBottom: 6 }}>
                {rapport.type_bien === 'maison' ? 'MAISON INDIVIDUELLE' : 'APPARTEMENT EN COPROPRIÉTÉ'} · {rapport.profil === 'invest' ? 'INVESTISSEMENT LOCATIF' : 'RÉSIDENCE PRINCIPALE'}
              </div>
              <h1 style={{ fontSize: 'clamp(15px,2.2vw,20px)', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 4 }}>{rapport.adresse}</h1>
              {rapport.adresseSub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 10 }}>{rapport.adresseSub}</div>}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }}>{getTypeBienLabel(rapport.type_bien)}</span>
                <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }}>{getProfilLabel(rapport.profil)}</span>
                {rapport.annee_construction && <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }}>Construit en {rapport.annee_construction}</span>}
                <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.65)' }}>Analysé le {rapport.date}</span>
              </div>
            </div>
          </div>
        )}

        {!isComplete && (
          <div style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', marginBottom: 4 }}>ANALYSE DOCUMENT</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{rapport.adresse}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Analysé le {rapport.date}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
/* ══════════════════════════════════
   ONGLET SYNTHÈSE
══════════════════════════════════ */
function TabSynthese({ rapport }: { rapport: RapportData }) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const docsIgnores = (rapport as Record<string, unknown>).documents_ignores as string[] | undefined;
  const avertissement = (rapport as Record<string, unknown>).avertissement_docs as string | undefined;
  const isComplete = rapport.type === 'complete';
  const finances = rapport.finances as Record<string, unknown> | null;
  const chargesLot = finances?.charges_annuelles_lot;
  const chargesLotNum = typeof chargesLot === 'number' ? chargesLot : typeof chargesLot === 'string' ? parseFloat(String(chargesLot).replace(/[^0-9.]/g, '')) || 0 : 0;
  // Taxe foncière — chercher dans plusieurs champs possibles
  const taxeFonciere = (finances?.taxe_fonciere || finances?.taxe_fonciere_annuelle || (rapport as Record<string, unknown>).taxe_fonciere) as string | number | null;
  const taxeFonciereStr = taxeFonciere ? (typeof taxeFonciere === 'number' ? `${taxeFonciere.toLocaleString('fr-FR')} €` : safeStr(taxeFonciere)) : null;
  const dpe = rapport.diagnostics.find((d: Record<string, unknown>) => d.type === 'DPE' && d.perimetre === 'lot_privatif') as Record<string, unknown> | undefined;
  const dpeClasse = dpe ? safeStr(dpe.resultat)?.match(/Classe\s+([A-G])\b/i)?.[1]?.toUpperCase() : null;
  const dpeColors: Record<string, string> = { A: '#16a34a', B: '#22c55e', C: '#84cc16', D: '#eab308', E: '#f97316', F: '#ef4444', G: '#991b1b' };
  const totalTravauxVotes = rapport.travaux_votes.reduce((acc: number, t: Record<string, unknown>) => acc + (typeof t.montant_estime === 'number' ? t.montant_estime : 0), 0);
  const nbTravauxEvoques = rapport.travaux_a_prevoir.length;
  const nbProcedures = rapport.procedures.length;
  const nbLots = (finances?.nombre_lots as number | null) || ((rapport as Record<string, unknown>).nombre_lots as number | null);
  const categories = rapport.categories as Record<string, { note: number; note_max: number }>;
  const catLabels: Record<string, string> = { travaux: 'État des travaux', procedures: 'Risques juridiques', finances: 'Santé financière', diags_privatifs: 'Diagnostics privatifs', diags_communs: 'Diagnostics communs' };
  const catIcons: Record<string, string> = { travaux: '🏗', procedures: '⚖️', finances: '💰', diags_privatifs: '🔍', diags_communs: '🏢' };
  const getCatColor = (pct: number) => pct >= 80 ? '#1D9E75' : pct >= 60 ? '#BA7517' : '#E24B4A';
  const getCatBg = (pct: number) => pct >= 80 ? '#EAF3DE' : pct >= 60 ? '#FAEEDA' : '#FCEBEB';

  // KPIs avec disposition intelligente
  const buildKpis = () => {
    const kpis: { icon: string; label: string; value: string; color?: string }[] = [];
    if (nbLots) kpis.push({ icon: '🏢', label: 'Nombre de lots', value: String(nbLots) });
    if (rapport.annee_construction) kpis.push({ icon: '📅', label: 'Année de construction', value: safeStr(rapport.annee_construction) });
    if (chargesLotNum > 0) kpis.push({ icon: '💰', label: 'Charges annuelles', value: `${chargesLotNum.toLocaleString('fr-FR')} €/an` });
    if (totalTravauxVotes > 0) kpis.push({ icon: '🏗', label: 'Travaux votés', value: `~${totalTravauxVotes.toLocaleString('fr-FR')} €` });
    if (nbTravauxEvoques > 0) kpis.push({ icon: '⚠️', label: 'Travaux évoqués', value: `${nbTravauxEvoques} mentionné${nbTravauxEvoques > 1 ? 's' : ''}` });
    if (dpeClasse) kpis.push({ icon: '⚡', label: 'Classe DPE', value: `Classe ${dpeClasse}`, color: dpeColors[dpeClasse] });
    kpis.push({ icon: '⚖️', label: 'Procédures', value: nbProcedures === 0 ? 'Aucune détectée' : `${nbProcedures} détectée${nbProcedures > 1 ? 's' : ''}`, color: nbProcedures > 0 ? '#dc2626' : '#16a34a' });
    if (taxeFonciereStr) kpis.push({ icon: '🏛', label: 'Taxe foncière', value: taxeFonciereStr });
    return kpis;
  };

  const kpis = buildKpis();
  const kpiCols = Math.min(kpis.length, 4);
  const kpiGridStyle = { display: 'grid', gridTemplateColumns: `repeat(${kpiCols}, 1fr)`, gap: '12px' } as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Avertissement docs ignorés */}
      {docsIgnores && docsIgnores.length > 0 && (
        <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: 12, border: '1px solid #fde68a', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertTriangle size={15} style={{ color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 3 }}>
              {docsIgnores.length} document{docsIgnores.length > 1 ? 's' : ''} non lisible{docsIgnores.length > 1 ? 's' : ''} — ignoré{docsIgnores.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
              {avertissement || `Vérifiez que ces fichiers sont en format PDF non protégé : ${docsIgnores.join(', ')}`}
            </div>
          </div>
        </div>
      )}

      {/* 1. RÉSUMÉ + DÉTAIL NOTE fusionnés */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', overflow: 'hidden' }}>
        {/* Résumé */}
        <div style={{ padding: '20px 22px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 10 }}>RÉSUMÉ</div>
          <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.9, margin: 0 }}>{rapport.resume}</p>
        </div>

        {/* Séparateur */}
        {isComplete && Object.keys(categories).length > 0 && (
          <div style={{ height: 1, background: '#f1f5f9', margin: '0 22px' }} />
        )}

        {/* Détail de la note */}
        {isComplete && Object.keys(categories).length > 0 && (
          <div style={{ padding: '16px 22px 0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 10 }}>DÉTAIL DE LA NOTE</div>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: '0 0 14px 0', padding: '10px 14px', background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7' }}>
              Votre score de <strong style={{ color: '#0f172a' }}>{rapport.score.toFixed(1)}/20</strong> se compose de 5 catégories. Plus vous récupérez de points dans chaque catégorie, moins il y a de risques détectés dans vos documents.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {Object.entries(categories).map(([key, cat]) => {
                const c = cat as { note: number; note_max: number };
                const isZero = c.note === 0;
                const pct = Math.round((c.note / c.note_max) * 100);
                const color = isZero ? '#94a3b8' : getCatColor(pct);
                const bg = isZero ? '#f8fafc' : getCatBg(pct);
                const tooltipKey = `${key}`;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{catIcons[key] || '📊'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, color: '#0f172a' }}>{catLabels[key] || key}</span>
                          {isZero && (
                            <div style={{ position: 'relative', display: 'inline-flex' }}
                              onMouseEnter={() => setTooltip(tooltipKey)}
                              onMouseLeave={() => setTooltip(null)}>
                              <div style={{ width: 15, height: 15, borderRadius: '50%', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>?</div>
                              {tooltip === tooltipKey && (
                                <div style={{ position: 'absolute', left: 22, top: -8, width: 260, background: '#0f172a', borderRadius: 10, padding: '10px 13px', fontSize: 11.5, color: '#fff', lineHeight: 1.7, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', animation: 'fadeUp 0.15s ease' }}>
                                  Cette note est nulle car aucun document pertinent n'a été détecté. Complétez votre dossier dans les 7 jours pour améliorer votre score.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color }}>{c.note} pt sur {c.note_max}</span>
                      </div>
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer score coloré */}
        {isComplete && (
          <div style={{ marginTop: 16, background: getScoreColor(rapport.score), padding: '14px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>Score total</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{getScoreLabel(rapport.score)}</span>
              <span style={{ fontSize: 22, fontWeight: 500, color: '#fff' }}>{rapport.score.toFixed(1)}<span style={{ fontSize: 13, fontWeight: 400, opacity: 0.7 }}> / 20</span></span>
            </div>
          </div>
        )}
      </div>

      {/* 2. KPIs — disposition intelligente */}
      {isComplete && kpis.length > 0 && (
        <div style={kpiGridStyle}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', background: '#2a7d9c', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{kpi.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '0.04em' }}>{kpi.label}</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: kpi.color || '#0f172a' }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. POINTS POSITIFS / VIGILANCE */}
      <div>
        <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Synthèse de l'analyse</span>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #2a7d9c, transparent)', marginTop: 8, borderRadius: 99 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 14, padding: '22px 24px' }}>
            <div style={{ display: 'inline-block', background: '#2d6a2d', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', padding: '6px 16px', borderRadius: 99, marginBottom: 20 }}>POINTS POSITIFS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {rapport.points_forts.length > 0 ? rapport.points_forts.map((p: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 22, height: 22, flexShrink: 0, marginTop: 2 }}>
                    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="10" stroke="#2d6a2d" strokeWidth="1.5"/>
                      <path d="M7 11.5l3 3 5-5" stroke="#2d6a2d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.7 }}>{safeStr(p)}</span>
                </div>
              )) : <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun point positif identifié.</p>}
            </div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 14, padding: '22px 24px' }}>
            <div style={{ display: 'inline-block', background: '#92400e', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', padding: '6px 16px', borderRadius: 99, marginBottom: 20 }}>POINTS DE VIGILANCE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {rapport.points_vigilance.length > 0 ? rapport.points_vigilance.map((p: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 22, height: 22, flexShrink: 0, marginTop: 2 }}>
                    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 2.5L2 19.5h18L11 2.5z" stroke="#92400e" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M11 9.5v4.5" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="11" cy="16.5" r="0.8" fill="#92400e"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.7 }}>{safeStr(p)}</span>
                </div>
              )) : <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun point de vigilance identifié.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* 4. PISTES DE NÉGOCIATION */}
      {rapport.negociation?.applicable && rapport.negociation.elements.length > 0 && rapport.score < 14 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingDown size={16} style={{ color: '#d97706' }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: '#92400e' }}>Pistes de négociation</span>
          </div>
          <p style={{ fontSize: 14, color: '#92400e', margin: '0 0 14px 0', lineHeight: 1.6, opacity: 0.85 }}>
            Voici les arguments concrets sur lesquels vous appuyer pour défendre votre négociation auprès du vendeur.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {rapport.negociation.elements.map((el: any, i: number) => {
              const texte = typeof el === 'string'
                ? el
                : safeStr(el?.motif || el?.argument || el?.description || el?.levier || el?.texte || Object.values(el || {}).find((v: unknown) => typeof v === 'string' && (v as string).length > 10));
              if (!texte) return null;
              const levier = typeof el !== 'string' ? safeStr(el?.levier) : '';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: '#fff', borderRadius: 10, border: '1px solid #fde68a' }}>
                  <div style={{ width: 22, height: 22, flexShrink: 0, marginTop: 2 }}>
                    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 2.5L2 19.5h18L11 2.5z" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M11 9.5v4.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="11" cy="16.5" r="0.8" fill="#d97706"/>
                    </svg>
                  </div>
                  <div>
                    <span style={{ fontSize: 14, color: '#92400e', lineHeight: 1.65 }}>{texte}</span>
                    {levier && levier !== texte && (
                      <span style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 600, color: '#d97706', background: '#fef3c7', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 100 }}>
                        Levier : {levier}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. AVIS VERIMO */}
      <div style={{ background: '#0f2d3d', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>⭐</span>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span style={{ fontSize: 22, fontWeight: 500, color: '#fff', position: 'relative', zIndex: 1 }}>Avis Verimo</span>
            <div style={{ position: 'absolute', bottom: 1, left: 0, right: 0, height: 8, background: 'rgba(91,184,212,0.45)', zIndex: 0, borderRadius: 2 }} />
          </div>
        </div>
        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {(rapport.avis_verimo || '')
            .split(/\.\s+/)
            .filter(s => s.trim().length > 20)
            .reduce<string[][]>((acc, sentence, i, arr) => {
              const groupIdx = Math.floor(i / Math.ceil(arr.length / 3));
              if (!acc[groupIdx]) acc[groupIdx] = [];
              acc[groupIdx].push(sentence.trim());
              return acc;
            }, [])
            .map((group, i) => (
              <p key={i} style={{ fontSize: 15, color: i === 0 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)', lineHeight: 1.85, margin: 0, marginTop: i > 0 ? 16 : 0, paddingTop: i > 0 ? 16 : 0, borderTop: i > 0 ? '0.5px solid rgba(255,255,255,0.1)' : 'none' }}>
                {group.join('. ').replace(/\.+$/, '')}.
              </p>
            ))}
        </div>
        {rapport.type !== 'complete' && (
          <div style={{ margin: '0 28px 24px', padding: '12px 14px', background: 'rgba(255,255,255,0.07)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
            💡 Cette analyse porte sur un seul document. Pour un score /20 et un rapport complet du bien, lancez une <span style={{ color: '#5bb8d4', fontWeight: 600 }}>Analyse Complète</span>.
          </div>
        )}
      </div>

    </div>
  );
}

/* ══════════════════════════════════
   ONGLET COPROPRIÉTÉ
══════════════════════════════════ */
function TabCopropriete({ rapport }: { rapport: RapportData }) {
  const [allOpen, setAllOpen] = useState(false);
  type SyndicT = { nom?: string; fin_mandat?: string; tensions_detectees?: boolean; tensions_detail?: string };
  type LotT = { quote_part_tantiemes?: string; fonds_travaux_alur?: string; parties_privatives?: string[]; restrictions_usage?: string[]; travaux_votes_charge_vendeur?: string[]; impayes_detectes?: string };
  type ParticT = { annee?: string; copropietaires_presents_representes?: string; taux_tantiemes_pct?: string; quorum_note?: string; resolutions_refusees?: string[] };
  type VieT = { syndic?: SyndicT; participation_ag?: ParticT[]; tendance_participation?: string; analyse_participation?: string; travaux_votes_non_realises?: unknown[]; appels_fonds_exceptionnels?: unknown[]; questions_diverses_notables?: string[]; honoraires_syndic_evolution?: string };
  const vie = rapport.vie_copropriete as VieT | null;
  void (rapport.lot_achete as LotT | null); // lot utilisé uniquement dans TabLogement

  const travaux_realises = rapport.travaux_realises;
  const travaux_votes = rapport.travaux_votes;
  const travaux_evoques_raw = rapport.travaux_a_prevoir;
  // Filtrer les travaux issus des diags privatifs (DPE, isolation, électricité perso...)
  // Ces travaux appartiennent à l'onglet "Votre logement", pas à la copropriété
  const MOTS_DIAGS_PRIVATIFS = ['dpe', 'diagnostic', 'isolation mur', 'isolation plafond', 'double vitrage', 'fenêtre', 'electricit', 'gaz intérieur', 'amiante lot', 'plomb lot', 'pack 1', 'pack 2', 'rénovation énergétique'];
  const travaux_evoques = travaux_evoques_raw.filter(t => {
    const label = ((t.label as string) || '').toLowerCase();
    const precision = ((t.precision as string) || '').toLowerCase();
    return !MOTS_DIAGS_PRIVATIFS.some(m => label.includes(m) || precision.includes(m));
  });
  const hasTravauxAlert = travaux_evoques.length > 0;
  const hasTravauxWarning = travaux_votes.length > 0;

  const diagsCommuns = rapport.diagnostics.filter((d: Record<string, unknown>) => d.perimetre === 'parties_communes' || d.perimetre === 'immeuble');
  const hasDiagAlert = diagsCommuns.some((d: Record<string, unknown>) => d.alerte);

  const anneeConstruction = (rapport as Record<string, unknown>).annee_construction as string | null;
  const anneeNum = anneeConstruction ? parseInt(anneeConstruction) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const participation = (vie?.participation_ag as ParticT[]) || [];
  const syndic = vie?.syndic as SyndicT | null;

  const toggleAll = () => {
    setAllOpen(!allOpen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={toggleAll} style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          {allOpen ? 'Tout replier' : 'Tout déplier'}
        </button>
      </div>

      {/* VIE DE LA COPRO - en premier */}
      <AccordionSection
        title="Vie de la copropriété" sub="Syndic · participation AG · résolutions" icon="🏢"
        status={syndic?.tensions_detectees ? 'warning' : 'neutral'}
        badge={participation.length > 0 ? `${participation.length} AG analysée${participation.length > 1 ? 's' : ''}` : 'Non disponible'}>

        {syndic?.nom && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}>
            <Building2 size={14} style={{ color: '#7c3aed', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{safeStr(syndic.nom)}</div>
              {syndic.fin_mandat && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Mandat jusqu'en {safeStr(syndic.fin_mandat)}</div>}
            </div>
          </div>
        )}

        {syndic?.tensions_detectees && syndic.tensions_detail && (
          <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>⚠ Tensions détectées au sein de la copropriété</div>
            <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>{safeStr(syndic.tensions_detail)}</div>
          </div>
        )}

        {participation.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Année', 'Participation', 'Taux', 'Note'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {participation.map((p: ParticT, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0f172a' }}>{safeStr(p.annee) ?? ''}</td>
                    <td style={{ padding: '9px 12px', color: '#374151' }}>{safeStr(p.copropietaires_presents_representes) ?? '—'}</td>
                    <td style={{ padding: '9px 12px', color: '#374151' }}>{safeStr(p.taux_tantiemes_pct) ?? '—'}</td>
                    <td style={{ padding: '9px 12px' }}>
                      {p.quorum_note && <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 100 }}>{safeStr(p.quorum_note)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(vie?.questions_diverses_notables ?? []).length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Questions diverses notables :</div>
            {(vie?.questions_diverses_notables ?? []).map((q, i) => (
              <div key={i} style={{ fontSize: 14, color: '#374151', padding: '8px 12px', background: '#f8fafc', borderRadius: 7, marginBottom: 4, border: '1px solid #edf2f7' }}>• {safeStr(q)}</div>
            ))}
          </div>
        )}

        {!syndic?.nom && participation.length === 0 && (
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Uploadez des PV d'AG pour obtenir ces informations.</p>
        )}
      </AccordionSection>

      {/* TRAVAUX */}
      <AccordionSection
        title="Travaux" sub="Réalisés · votés · évoqués" icon="🏗"
        status={hasTravauxAlert ? 'warning' : hasTravauxWarning ? 'ok' : 'ok'}
        badge={hasTravauxAlert ? `${travaux_evoques.length} vigilance${travaux_evoques.length > 1 ? 's' : ''}` : `${travaux_realises.length + travaux_votes.length} détectés`}
        tooltip="✅ Réalisés — déjà effectués, intégrés à l'immeuble.|🗳 Votés — décidés en AG. S'ils l'ont été avant le compromis, c'est la charge du vendeur.|⚠️ Évoqués non votés — mentionnés mais pas décidés. Si le vote a lieu après votre achat, vous en paierez une part.">

        {travaux_realises.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} /> Réalisés
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {travaux_realises.map((t, i) => <TravauxRow key={i} t={t} variant="realise" />)}
            </div>
          </div>
        )}

        {travaux_votes.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6' }} /> Votés en AG
            </div>
            <div style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', marginBottom: 8, fontSize: 12, color: '#1e40af' }}>
              ℹ️ Les travaux votés avant la signature du compromis sont à la charge du vendeur. Vérifiez ce point avec votre notaire.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {travaux_votes.map((t, i) => <TravauxRow key={i} t={t} variant="vote" />)}
            </div>
          </div>
        )}

        {travaux_evoques.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f97316', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f97316' }} /> Évoqués — non encore votés
            </div>
            <div style={{ padding: '8px 12px', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa', marginBottom: 8, fontSize: 12, color: '#92400e' }}>
              ⚠️ Ces travaux ont été mentionnés en réunion sans vote. Si le vote intervient après votre acquisition, vous en supporterez une part. Renseignez-vous auprès du vendeur.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {travaux_evoques.map((t, i) => <TravauxRow key={i} t={t} variant="evoque" />)}
            </div>
          </div>
        )}

        {travaux_realises.length === 0 && travaux_votes.length === 0 && travaux_evoques.length === 0 && (
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun travaux détecté dans les documents.</p>
        )}
      </AccordionSection>

      {/* FINANCES */}
      <AccordionSection
        title="Finances" sub="Budget copro · fonds travaux · charges" icon="💰"
        status={rapport.fonds_travaux_statut === 'insuffisant' || rapport.fonds_travaux_statut === 'absent' ? 'warning' : 'ok'}
        badge={rapport.fonds_travaux_statut === 'conforme' ? 'Sain' : rapport.fonds_travaux_statut === 'insuffisant' ? 'Vigilance' : rapport.fonds_travaux_statut === 'absent' ? 'Absent' : 'Détecté'}>

        {/* Grille chiffres clés — uniquement données COPRO globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
          {(() => {
            const fin = rapport.finances as Record<string, unknown> | null;
            const budgetTotal = fin?.budget_total_copro;
            const budgetNum = typeof budgetTotal === 'number' ? budgetTotal : typeof budgetTotal === 'string' ? parseFloat(String(budgetTotal).replace(/[^0-9.]/g, '')) || 0 : 0;
            const hist = fin?.budgets_historique as Array<{ annee: string; budget_total: number; fonds_travaux?: number }> | null;
            const lastYear = hist && hist.length > 0 ? [...hist].sort((a, b) => String(b.annee).localeCompare(String(a.annee)))[0].annee : null;
            const fondsNum = rapport.fonds_travaux > 0 ? rapport.fonds_travaux : 0;
            const fondsPct = budgetNum > 0 && fondsNum > 0 ? ((fondsNum / budgetNum) * 100).toFixed(1) : null;
            return (<>
              {budgetNum > 0 && (
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{budgetNum.toLocaleString('fr-FR')}€</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Budget annuel copropriété{lastYear ? ` (${lastYear})` : ''}</div>
                </div>
              )}
              {fondsNum > 0 && (
                <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed', marginBottom: 3 }}>{fondsNum.toLocaleString('fr-FR')}€</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Fonds travaux copro{lastYear ? ` (${lastYear})` : ''}</div>
                  {fondsPct && <div style={{ fontSize: 10, color: '#7c3aed', marginTop: 3 }}>≈ {fondsPct}% du budget voté</div>}
                </div>
              )}
            </>);
          })()}
        </div>

        {/* Tableau évolution budgets par année */}
        {(() => {
          const fin = rapport.finances as Record<string, unknown> | null;
          const hist = fin?.budgets_historique as Array<{ annee: string; budget_total: number; fonds_travaux?: number; charges_lot?: number }> | null;
          if (!hist || hist.length < 2) return null;
          const sorted = [...hist].sort((a, b) => String(a.annee).localeCompare(String(b.annee)));
          return (
            <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7', letterSpacing: '0.06em' }}>
                📊 ÉVOLUTION DES BUDGETS (source : PV d'AG)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      {['Année', 'Budget copro', 'Fonds travaux', 'Évolution'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7', fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((row, i) => {
                      const prev = i > 0 ? sorted[i - 1] : null;
                      const evol = prev && prev.budget_total > 0 ? ((row.budget_total - prev.budget_total) / prev.budget_total * 100) : null;
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0f172a' }}>{row.annee}</td>
                          <td style={{ padding: '9px 12px', color: '#374151' }}>{row.budget_total?.toLocaleString('fr-FR')}€</td>
                          <td style={{ padding: '9px 12px', color: '#7c3aed' }}>{row.fonds_travaux ? `${row.fonds_travaux.toLocaleString('fr-FR')}€` : '—'}</td>
                          <td style={{ padding: '9px 12px' }}>
                            {evol !== null ? (
                              <span style={{ fontSize: 11, fontWeight: 700, color: evol > 5 ? '#dc2626' : evol > 0 ? '#d97706' : '#16a34a' }}>
                                {evol > 0 ? '+' : ''}{evol.toFixed(1)}%
                              </span>
                            ) : <span style={{ color: '#94a3b8' }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* Statut fonds travaux */}
        {rapport.fonds_travaux_statut && rapport.fonds_travaux_statut !== 'non_mentionne' && (
          <div style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid', background: rapport.fonds_travaux_statut === 'conforme' ? '#f0fdf4' : '#fef2f2', borderColor: rapport.fonds_travaux_statut === 'conforme' ? '#bbf7d0' : '#fecaca' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: rapport.fonds_travaux_statut === 'conforme' ? '#166534' : '#991b1b' }}>
              Fonds travaux : {rapport.fonds_travaux_statut === 'conforme' ? '✓ conforme au minimum légal (5%)' : rapport.fonds_travaux_statut === 'insuffisant' ? '⚠️ insuffisant (< 5% du budget)' : '⚠️ absent ou non mentionné'}
            </span>
            {rapport.fonds_travaux_statut === 'insuffisant' && (
              <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 4 }}>La loi ALUR impose un fonds travaux d'au minimum 5% du budget prévisionnel annuel. Un fonds insuffisant peut entraîner des appels de fonds exceptionnels imprévus.</div>
            )}
          </div>
        )}

        {/* Appels de fonds exceptionnels */}
        {(vie?.appels_fonds_exceptionnels?.length ?? 0) > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>⚠ Appels de fonds exceptionnels votés en AG :</div>
            <div style={{ fontSize: 11, color: '#b45309', marginBottom: 8, fontStyle: 'italic' }}>Informations issues des PV d'assemblée générale fournis</div>
            {vie!.appels_fonds_exceptionnels!.map((a, i) => {
              const obj = typeof a === 'string' ? { motif: a } : a as Record<string, unknown>;
              const montant: number | null = typeof obj.montant_total === 'number' ? obj.montant_total : typeof obj.montant === 'number' ? obj.montant : null;
              return (
                <div key={i} style={{ fontSize: 12, color: '#92400e', padding: '9px 12px', background: '#fffbeb', borderRadius: 8, marginBottom: 6, border: '1px solid #fde68a', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>• {String(obj.motif ?? obj.description ?? obj.libelle ?? 'Appel de fonds exceptionnel')}</div>
                  {montant !== null && <div style={{ fontSize: 11, color: '#d97706' }}>Montant total copro : {montant.toLocaleString('fr-FR')}€</div>}
                  {obj.date != null && <div style={{ fontSize: 11, color: '#b45309' }}>Date : {String(obj.date)}</div>}
                </div>
              );
            })}
          </div>
        )}
      </AccordionSection>

      {/* DIAGNOSTICS PARTIES COMMUNES */}
      <AccordionSection
        title="Diagnostics parties communes" sub="Amiante · plomb · termites · ERP" icon="📋"
        status={hasDiagAlert ? 'alert' : diagsCommuns.length > 0 ? 'ok' : 'neutral'}
        badge={hasDiagAlert ? 'Alerte' : diagsCommuns.length > 0 ? `${diagsCommuns.length} détecté${diagsCommuns.length > 1 ? 's' : ''}` : 'Non détectés'}>

        {diagsCommuns.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {diagsCommuns.map((d: Record<string, unknown>, i: number) => <DiagRow key={i} d={d} />)}
          </div>
        )}

        <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={13} style={{ color: '#64748b', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            {diagsCommuns.length === 0
              ? "Aucun diagnostic parties communes dans les documents fournis. Vérifiez auprès du vendeur ou de l'agent immobilier si l'immeuble dispose de :"
              : "D'autres diagnostics parties communes peuvent exister. Vérifiez auprès du vendeur si l'immeuble dispose également de :"}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {(!anneeNum || anneeNum < 1997) && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 100, background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>DTA (avant 1997)</span>}
              {(!anneeNum || anneeNum < 1949) && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 100, background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>Plomb parties communes (avant 1949)</span>}
              <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 100, background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>Termites immeuble</span>
              <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 100, background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>ERP</span>
            </div>
          </div>
        </div>
      </AccordionSection>
    </div>
  );
}

/* ══════════════════════════════════
   ONGLET VOTRE LOGEMENT
══════════════════════════════════ */
function TabLogement({ rapport }: { rapport: RapportData }) {
  const [allOpen, setAllOpen] = useState(true);
  type LotT2 = { quote_part_tantiemes?: string; fonds_travaux_alur?: string; parties_privatives?: string[]; restrictions_usage?: string[]; travaux_votes_charge_vendeur?: string[]; impayes_detectes?: string; points_specifiques?: string[] };
  type FinancesT = { taxe_fonciere?: string; type_chauffage?: string; charges_annuelles?: number | string; fonds_travaux?: number | string; fonds_travaux_statut?: string };
  const lot = rapport.lot_achete as LotT2 | null;
  const finances = rapport.finances as FinancesT | null;

  const diagsPriv = rapport.diagnostics.filter((d: Record<string, unknown>) => d.perimetre === 'lot_privatif');
  const dpe = diagsPriv.find((d: Record<string, unknown>) => d.type === 'DPE');
  // Tri : absence (vert) en premier, alertes (rouge) en dernier
  const autresDiags = diagsPriv
    .filter((d: Record<string, unknown>) => d.type !== 'DPE')
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const scoreA = a.presence === 'absence' ? 0 : a.alerte ? 2 : 1;
      const scoreB = b.presence === 'absence' ? 0 : b.alerte ? 2 : 1;
      return scoreA - scoreB;
    });

  const dpeClasse = dpe ? (dpe.resultat as string)?.match(/Classe ([A-G])/i)?.[1]?.toUpperCase() || (dpe.resultat as string) : null;
  const dpeBad = dpeClasse && ['F', 'G'].includes(dpeClasse);
  const hasDiagAlert = diagsPriv.some((d: Record<string, unknown>) => d.alerte);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => setAllOpen(!allOpen)} style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          {allOpen ? 'Tout replier' : 'Tout déplier'}
        </button>
      </div>

      {/* INFOS LOT EN PREMIER */}
      {lot && (lot.quote_part_tantiemes || lot.fonds_travaux_alur || (lot.restrictions_usage as string[])?.length > 0) && (
        <AccordionSection
          title="Informations sur votre lot" sub="Tantièmes · fonds ALUR · restrictions" icon="🏠"
          status="neutral" badge="Informatif" defaultOpen={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', overflow: 'hidden' }}>
              {lot.quote_part_tantiemes && (
                <div style={{ display: 'flex', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 12, color: '#64748b', width: 160, flexShrink: 0 }}>Quote-part tantièmes</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{safeStr(lot.quote_part_tantiemes)}</span>
                    {(lot.parties_privatives as string[])?.length > 0 && (
                      <div style={{ marginTop: 4 }}>
                        {(lot.parties_privatives as string[]).map((p, i) => (
                          <div key={i} style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>• {safeStr(p)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {lot.fonds_travaux_alur && (
                <div style={{ display: 'flex', padding: '10px 14px', borderBottom: (lot.travaux_votes_charge_vendeur as string[])?.length > 0 || (lot.restrictions_usage as string[])?.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ fontSize: 12, color: '#64748b', width: 160, flexShrink: 0 }}>Fonds travaux ALUR</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', flex: 1 }}>
                    {isNaN(Number(String(lot.fonds_travaux_alur).replace(/[^0-9.]/g, ''))) ? safeStr(lot.fonds_travaux_alur) : `${Number(String(lot.fonds_travaux_alur).replace(/[^0-9.]/g, '')).toLocaleString('fr-FR')}€`} — récupérable à la signature
                  </span>
                </div>
              )}
              {(lot.travaux_votes_charge_vendeur as string[])?.length > 0 && (
                <div style={{ display: 'flex', padding: '10px 14px', borderBottom: (lot.restrictions_usage as string[])?.length > 0 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={{ fontSize: 12, color: '#64748b', width: 160, flexShrink: 0 }}>Charge vendeur</span>
                  <div style={{ flex: 1 }}>
                    {(lot.travaux_votes_charge_vendeur as string[]).map((t, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#1d4ed8', marginBottom: 2 }}>• {safeStr(t)}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {(lot.restrictions_usage as string[])?.length > 0 &&
              !(lot.restrictions_usage as string[]).some(r => safeStr(r).toLowerCase().includes('aucune restriction') || safeStr(r).toLowerCase().includes('règlement copropriété complet non fourni')) && (
              <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>Restrictions d'usage</div>
                <div style={{ fontSize: 11, color: '#b45309', marginBottom: 8, fontStyle: 'italic' }}>Issues du règlement de copropriété fourni</div>
                {(lot.restrictions_usage as string[]).map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: '#92400e', marginBottom: 3 }}>• {safeStr(r)}</div>
                ))}
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      {/* FINANCES DU LOT */}
      <AccordionSection
        title="Finances de votre lot" sub="Charges annuelles · impayés" icon="💶"
        status={(lot?.impayes_detectes) ? 'alert' : 'neutral'}
        badge={(lot?.impayes_detectes) ? 'Impayés détectés' : 'Informatif'}
        defaultOpen={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(() => {
            const fin = rapport.finances as Record<string, unknown> | null;
            const chargesLot = fin?.charges_annuelles_lot;
            const chargesLotNum = typeof chargesLot === 'number' ? chargesLot : typeof chargesLot === 'string' ? parseFloat(String(chargesLot).replace(/[^0-9.]/g, '')) || 0 : 0;
            if (chargesLotNum > 0) return (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7', fontSize: 15 }}>
                <span style={{ color: '#64748b' }}>Charges annuelles votre lot</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{chargesLotNum.toLocaleString('fr-FR')}€/an</span>
              </div>
            );
            if (rapport.charges_mensuelles > 0) return (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Charges mensuelles estimées</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{rapport.charges_mensuelles}€/mois</span>
              </div>
            );
            return null;
          })()}
          {finances?.taxe_fonciere && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', background: '#f8fafc', borderRadius: 9, border: '1px solid #edf2f7', fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>Taxe foncière</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{safeStr(finances.taxe_fonciere)}</span>
            </div>
          )}
          {lot?.impayes_detectes && (
            <div style={{ padding: '9px 12px', background: '#fef2f2', borderRadius: 9, border: '1px solid #fecaca', fontSize: 12, color: '#991b1b' }}>
              ⚠️ Impayés détectés sur ce lot : {safeStr(lot.impayes_detectes)}
            </div>
          )}
          {!rapport.charges_mensuelles && !finances?.taxe_fonciere && !lot?.impayes_detectes && (() => {
            const fin = rapport.finances as Record<string, unknown> | null;
            const c = fin?.charges_annuelles_lot;
            const n = typeof c === 'number' ? c : 0;
            return n === 0 ? <p style={{ fontSize: 13, color: '#94a3b8' }}>Uploadez un appel de charges pour obtenir ces informations.</p> : null;
          })()}
        </div>
      </AccordionSection>

      {/* DPE */}
      {dpe && (
        <AccordionSection
          title="DPE — Performance énergétique" sub={dpeClasse ? `Classe ${dpeClasse}` : ''} icon="⚡"
          status={dpeBad ? 'alert' : dpeClasse && ['A', 'B', 'C'].includes(dpeClasse) ? 'ok' : 'warning'}
          badge={dpeClasse ? `Classe ${dpeClasse}` : 'Détecté'}
          defaultOpen={true}>
          <DiagRow d={dpe} />
          {dpeBad && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', fontSize: 12, color: '#991b1b', lineHeight: 1.6 }}>
              ⚠️ Un DPE classé {dpeClasse} peut impacter la valeur du bien et sa revente. Pour une résidence principale, ce bien ne pourra plus être mis en location à partir de 2025 (G) ou 2028 (F).
            </div>
          )}
        </AccordionSection>
      )}

      {/* Autres diagnostics privatifs */}
      {(autresDiags.length > 0 || hasDiagAlert) && (
        <AccordionSection
          title="Diagnostics privatifs" sub="Électricité · gaz · amiante · plomb · termites · Carrez" icon="🔍"
          status={hasDiagAlert ? 'alert' : 'ok'}
          badge={hasDiagAlert ? "Points d'attention" : `${autresDiags.length} diagnostic${autresDiags.length > 1 ? 's' : ''}`}
          defaultOpen={true}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {autresDiags.map((d: Record<string, unknown>, i: number) => <DiagRow key={i} d={d} />)}
          </div>
        </AccordionSection>
      )}

      {diagsPriv.length === 0 && (
        <div style={{ padding: '20px', background: '#fff', borderRadius: 13, border: '1px solid #edf2f7', textAlign: 'center' }}>
          <Shield size={24} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Aucun diagnostic détecté</p>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Uploadez le Dossier de Diagnostic Technique (DDT) pour obtenir l'analyse DPE, électricité, gaz, amiante et plomb de votre logement.</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════
   ONGLET PROCÉDURES
══════════════════════════════════ */
function TabProcedures({ rapport }: { rapport: RapportData }) {
  if (!rapport.procedures_en_cours || rapport.procedures.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <CheckCircle size={26} style={{ color: '#16a34a' }} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Aucune procédure identifiée</h3>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
          Aucune procédure judiciaire ou litige n'a été détecté dans les documents analysés. Cela ne garantit pas l'absence totale de procédure — vérifiez avec votre notaire.
        </p>
      </div>
    );
  }

  const graviteStyle = (g: string) => {
    if (g === 'elevee') return { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', label: 'Élevée' };
    if (g === 'moderee') return { bg: '#fffbeb', border: '#fde68a', color: '#d97706', label: 'Modérée' };
    return { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', label: 'Faible' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '14px 20px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', display: 'flex', gap: 12, alignItems: 'center' }}>
        <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#991b1b' }}>
          {rapport.procedures.length} procédure{rapport.procedures.length > 1 ? 's' : ''} détectée{rapport.procedures.length > 1 ? 's' : ''} dans les documents.
        </span>
      </div>
      {rapport.procedures.map((proc, i) => {
        const g = graviteStyle(safeStr(proc.gravite));
        return (
          <div key={i} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${g.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', background: g.bg, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Gavel size={18} style={{ color: g.color, flexShrink: 0 }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: g.color, flex: 1 }}>{safeStr(proc.label) || safeStr(proc.type) || 'Procédure détectée'}</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.6)', border: `1px solid ${g.border}`, color: g.color, flexShrink: 0 }}>Gravité : {g.label}</span>
            </div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {proc.message && <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8, margin: 0 }}>{safeStr(proc.message)}</p>}
              <div style={{ padding: '12px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>
                ⚠️ Demandez des précisions au vendeur ou à votre notaire sur cette procédure avant de vous engager.
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════
   ONGLET DOCUMENTS
══════════════════════════════════ */
function TabDocuments({ rapport }: { rapport: RapportData }) {
  const [tooltipDoc, setTooltipDoc] = useState<string | null>(null);
  const docTypeLabel: Record<string, string> = {
    PV_AG: "PV d'Assemblée Générale", REGLEMENT_COPRO: 'Règlement de copropriété',
    APPEL_CHARGES: 'Appel de charges', DPE: 'DPE', DIAGNOSTIC: 'Diagnostic',
    DDT: 'Dossier Diagnostic Technique', COMPROMIS: 'Compromis de vente',
    ETAT_DATE: 'État daté', TAXE_FONCIERE: 'Taxe foncière',
    CARNET_ENTRETIEN: "Carnet d'entretien", AUTRE: 'Autre document',
    MODIFICATIF_RCP: 'Modificatif RCP', PRE_ETAT_DATE: 'Pré-état daté',
    DIAGNOSTIC_PARTIES_COMMUNES: 'Diagnostics parties communes',
  };
  const docTypeIcon: Record<string, string> = {
    PV_AG: '📋', REGLEMENT_COPRO: '📜', APPEL_CHARGES: '💶', DPE: '⚡',
    DIAGNOSTIC: '🔍', DDT: '🗂', COMPROMIS: '✍️', ETAT_DATE: '📊',
    TAXE_FONCIERE: '🏛', AUTRE: '📄', CARNET_ENTRETIEN: '📓',
    MODIFICATIF_RCP: '📜', PRE_ETAT_DATE: '📋', DIAGNOSTIC_PARTIES_COMMUNES: '🏗',
  };

  const docsAnalyses = (rapport as Record<string, unknown>).documents_analyses as Array<Record<string, unknown>> || [];
  const docsAnalysesTypes = docsAnalyses.map(d => safeStr(d.type));
  const hasDoc = (types: string[]) => types.some(t => docsAnalysesTypes.includes(t));
  const isCopro = rapport.type_bien === 'appartement' || rapport.type_bien === 'maison_copro';
  const anneeNum = rapport.annee_construction ? parseInt(rapport.annee_construction) : null;

  // Docs essentiels
  const docsEssentiels = isCopro ? [
    { label: '3 derniers PV d\'Assemblée Générale', present: hasDoc(['PV_AG']), tooltip: null },
    { label: 'Règlement de copropriété + modificatifs', present: hasDoc(['REGLEMENT_COPRO', 'MODIFICATIF_RCP']), tooltip: null },
    { label: 'Carnet d\'entretien de l\'immeuble', present: hasDoc(['CARNET_ENTRETIEN']), tooltip: 'Document tenu par le syndic qui retrace l\'historique des travaux réalisés, les contrats d\'entretien en cours et les diagnostics effectués sur l\'immeuble.' },
    { label: 'Diagnostics privatifs (DDT)', present: hasDoc(['DDT', 'DPE', 'DIAGNOSTIC']), tooltip: `Selon l'année de construction de l'immeuble${anneeNum ? ` (${anneeNum})` : ''}, certains diagnostics peuvent ne pas être obligatoires.` },
    { label: 'Appel de charges / Appel de fonds', present: hasDoc(['APPEL_CHARGES']), tooltip: null },
  ] : [
    { label: 'DDT complet (Dossier Diagnostic Technique)', present: hasDoc(['DDT', 'DPE', 'DIAGNOSTIC']), tooltip: 'DPE, électricité, gaz, amiante, plomb, termites…' },
    { label: 'Taxe foncière', present: hasDoc(['TAXE_FONCIERE']), tooltip: null },
  ];

  // Docs secondaires
  const docsSecondaires = isCopro ? [
    { label: 'Diagnostics parties communes', present: hasDoc(['DIAGNOSTIC_PARTIES_COMMUNES']), tooltip: 'Amiante, plomb et risques environnementaux sur les parties communes de l\'immeuble.' },
    { label: 'DTG — Diagnostic Technique Global', present: false, tooltip: 'Bilan complet de l\'état de l\'immeuble réalisé par un expert. Obligatoire pour les copropriétés de plus de 200 lots ou de plus de 15 ans. Permet d\'anticiper les grands travaux.' },
    { label: 'PPT — Plan Pluriannuel de Travaux', present: false, tooltip: 'Planning des travaux prévus sur 10 ans établi à partir du DTG. Permet d\'anticiper les charges futures liées aux travaux obligatoires.' },
    { label: 'Pré-état daté', present: hasDoc(['PRE_ETAT_DATE']), tooltip: 'Document fourni par le syndic avant la vente qui récapitule les sommes dues par le vendeur à la copropriété, les procédures en cours et les charges à venir.' },
    { label: 'Tout autre document lié à votre futur logement', present: false, tooltip: null },
  ] : [];

  const docsEssentielManquants = docsEssentiels.filter(d => !d.present);
  const docsSecondairesManquants = docsSecondaires.filter(d => !d.present);
  const hasDocs = rapport.documents_detectes.length > 0 || docsAnalyses.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Section docs manquants EN HAUT */}
      {(docsEssentielManquants.length > 0 || docsSecondairesManquants.length > 0) && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Pour améliorer votre score et mieux comprendre votre achat</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>Ajoutez ces documents dans les 7 jours suivant la date de ce rapport</div>
            </div>
            <button
              onClick={() => window.location.href = `/dashboard/rapport?id=${rapport.id}&action=complement`}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, border: 'none', background: '#2a7d9c', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
              <RefreshCw size={13} /> Compléter mon dossier
            </button>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {docsEssentielManquants.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12 }}>ESSENTIELS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {docsEssentielManquants.map((doc, i) => (
                    <div key={i} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 13, color: '#1e40af', fontWeight: 500, cursor: doc.tooltip ? 'help' : 'default' }}
                      onMouseEnter={() => doc.tooltip && setTooltipDoc(`e${i}`)}
                      onMouseLeave={() => setTooltipDoc(null)}>
                      {doc.label}
                      {doc.tooltip && <span style={{ width: 15, height: 15, borderRadius: '50%', background: '#bfdbfe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#1e40af', fontWeight: 700, flexShrink: 0 }}>?</span>}
                      {tooltipDoc === `e${i}` && doc.tooltip && (
                        <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: 280, background: '#0f172a', borderRadius: 10, padding: '10px 13px', fontSize: 12, color: '#fff', lineHeight: 1.7, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{doc.tooltip}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {docsSecondairesManquants.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12 }}>SECONDAIRES</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {docsSecondairesManquants.map((doc, i) => (
                    <div key={i} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', fontWeight: 500, cursor: doc.tooltip ? 'help' : 'default' }}
                      onMouseEnter={() => doc.tooltip && setTooltipDoc(`s${i}`)}
                      onMouseLeave={() => setTooltipDoc(null)}>
                      {doc.label}
                      {doc.tooltip && <span style={{ width: 15, height: 15, borderRadius: '50%', background: '#e2e8f0', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#475569', fontWeight: 700, flexShrink: 0 }}>?</span>}
                      {tooltipDoc === `s${i}` && doc.tooltip && (
                        <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: 280, background: '#0f172a', borderRadius: 10, padding: '10px 13px', fontSize: 12, color: '#fff', lineHeight: 1.7, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{doc.tooltip}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents analysés EN BAS */}
      {hasDocs && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Paperclip size={15} style={{ color: '#94a3b8' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>DOCUMENTS ANALYSÉS</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {(docsAnalyses.length > 0 ? docsAnalyses : rapport.documents_detectes).map((doc, i) => {
              const type = safeStr((doc as Record<string, unknown>).type);
              const annee = safeStr((doc as Record<string, unknown>).annee);
              const nom = safeStr((doc as Record<string, unknown>).nom || (doc as Record<string, unknown>).name);
              const arr = docsAnalyses.length > 0 ? docsAnalyses : rapport.documents_detectes;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#f8fafc', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {docTypeIcon[type] || '📄'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{nom || docTypeLabel[type] || type}</div>
                    {annee && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{annee}</div>}
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
          <div style={{ padding: '12px 20px', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #f1f5f9' }}>
            <Shield size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>Documents supprimés de nos serveurs après traitement — conformément au RGPD.</span>
          </div>
        </div>
      )}

    </div>
  );
}

/* ══════════════════════════════════
   BUILDER RAPPORT (mapping données)
══════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toTravaux(arr: unknown[]): any[] {
  return (arr || []).map(t => {
    if (typeof t === 'string') return { label: t, annee: '', montant_estime: null, statut: '', justificatif: false };
    if (typeof t !== 'object' || t === null) return null;
    const obj = t as Record<string, unknown>;
    const montant = obj.montant ?? obj.montant_estime ?? obj.montant_total;
    const label = (obj.label as string) || (obj.description as string) || (obj.libelle as string) || '';
    if (!label) return null;
    return {
      label, annee: (obj.annee as string) || (obj.annee_vote as string) || (obj.echeance as string) || '',
      montant_estime: typeof montant === 'number' ? montant : (typeof montant === 'string' ? parseFloat(montant) || null : null),
      statut: (obj.statut as string) || '', justificatif: (obj.justificatif as boolean) ?? false,
      charge_vendeur: (obj.charge_vendeur as boolean) ?? false,
      precision: (obj.precision as string) || '',
    };
  }).filter(Boolean);
}

function buildRapport(data: Record<string, unknown>, dbData: { id: string; type: string; profil: string | null; created_at: string; document_names: string[] | null; regeneration_deadline: string | null; is_preview: boolean }) {
  const r = data;
  const travauxObj = (r.travaux as Record<string, unknown>) || {};
  const financesObj = (r.finances as Record<string, unknown>) || {};
  const chargesAnnuelles = financesObj.charges_annuelles;
  const chargesMensuelles = typeof chargesAnnuelles === 'number'
    ? Math.round(chargesAnnuelles / 12)
    : typeof chargesAnnuelles === 'string'
      ? Math.round(parseFloat(chargesAnnuelles.replace(/[^0-9.]/g, '')) / 12) || 0 : 0;

  const fondsTravaux = financesObj.fonds_travaux;
  const fondsTrvauxNum = typeof fondsTravaux === 'number' ? fondsTravaux
    : typeof fondsTravaux === 'string' ? parseFloat(fondsTravaux.replace(/[^0-9.]/g, '')) || 0 : 0;

  const rawProcedures = (r.procedures as unknown[]) || [];
  const procedures = rawProcedures.map(p =>
    typeof p === 'string'
      ? { label: p, type: 'autre', gravite: 'moderee' as const, message: p }
      : p as { label: string; type: string; gravite: 'faible' | 'moderee' | 'elevee'; message?: string }
  );

  // Extraire adresse principale et sous-titre
  const titreComplet = (r.titre as string) || '';
  const adresseMatch = titreComplet.match(/^([^–\-]+(?:[-–][^(]+)?)\s*[-–]?\s*(Lot.*|lot.*)?$/);
  const adresse = adresseMatch?.[1]?.trim() || titreComplet;
  const adresseSub = adresseMatch?.[2]?.trim() || '';

  const mappedType = (dbData.type === 'pack2' || dbData.type === 'pack3' ? 'complete' : dbData.type) as 'document' | 'complete';

  return {
    id: dbData.id,
    type: mappedType,
    adresse,
    adresseSub,
    date: new Date(dbData.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    score: typeof r.score === 'number' ? r.score : 0,
    score_niveau: (r.score_niveau as string) || '',
    type_bien: (r.type_bien as string) || 'appartement',
    annee_construction: (r.annee_construction as string) || null,
    profil: (dbData.profil as string) || 'rp',
    resume: (r.resume as string) || '',
    points_forts: (r.points_forts as string[]) || (r.synthese_points_positifs as string[]) || [],
    points_vigilance: (r.points_vigilance as string[]) || (r.synthese_points_vigilance as string[]) || [],
    avis_verimo: (r.avis_verimo as string) || (r.conclusion as string) || '',
    categories: (r.categories as Record<string, { note: number; note_max: number; details: unknown[] }>) || {},
    charges_mensuelles: chargesMensuelles,
    fonds_travaux: fondsTrvauxNum,
    fonds_travaux_statut: (() => {
      const raw = (financesObj.fonds_travaux_statut as string) || (r.fonds_travaux_statut as string) || 'non_mentionne';
      if (raw.includes('conforme') || raw === 'au_dessus') return 'conforme';
      if (raw === 'insuffisant') return 'insuffisant';
      if (raw === 'absent') return 'absent';
      return raw;
    })(),
    travaux_realises: toTravaux((travauxObj.realises as unknown[]) || (r.travaux_realises as unknown[]) || []),
    travaux_votes: toTravaux((travauxObj.votes as unknown[]) || (r.travaux_votes as unknown[]) || []),
    travaux_a_prevoir: toTravaux((travauxObj.evoques as unknown[]) || (r.travaux_a_prevoir as unknown[]) || []),
    procedures_en_cours: procedures.length > 0,
    procedures,
    documents_detectes: (r.documents_detectes as Array<Record<string, unknown>>) || [],
    documents_manquants: (r.documents_manquants as string[]) || [],
    negociation: (r.negociation as { applicable: boolean; elements: unknown[] }) || { applicable: false, elements: [] },
    document_names: (dbData.document_names as string[]) || [],
    regeneration_deadline: dbData.regeneration_deadline || null,
    is_preview: dbData.is_preview ?? false,
    vie_copropriete: (() => {
      const vie = r.vie_copropriete as Record<string, unknown> | null;
      if (!vie) return null;
      const rawParticipation = (vie.participation_ag as Record<string, unknown>[]) || [];
      const normalizedParticipation = rawParticipation.map(p => ({
        annee: (p.annee as string) || (p.date as string)?.slice(0, 4) || '',
        copropietaires_presents_representes: (p.copropietaires_presents_representes as string) || (p.presents_representes as string) || '—',
        taux_tantiemes_pct: (p.taux_tantiemes_pct as string) || (p.taux as string) || '',
        quorum_note: (p.quorum_note as string) || null,
        resolutions_refusees: (p.resolutions_refusees as string[]) || [],
      }));
      return { ...vie, participation_ag: normalizedParticipation };
    })(),
    lot_achete: (r.lot_achete as Record<string, unknown>) ?? null,
    finances: financesObj ?? null,
    diagnostics: (r.diagnostics as Array<Record<string, unknown>>) || [],
    documents_analyses: (r.documents_analyses as Array<Record<string, unknown>>) || [],
  };
}

/* ══════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════ */
type TabId = 'synthese' | 'copropriete' | 'logement' | 'procedures' | 'documents';

export default function RapportPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const shareToken = searchParams.get('token') || '';
  const action = searchParams.get('action') || '';
  const isShared = !!shareToken;

  const [showReupload, setShowReupload] = useState(action === 'reupload');
  const [activeTab, setActiveTab] = useState<TabId>('synthese');
  const [loading, setLoading] = useState(true);
  const [rapport, setRapport] = useState<RapportData | null>(null);
  const [apercuData, setApercuData] = useState<{ apercu: Record<string, unknown>; type: string; id: string } | null>(null);
  const [documentResult, setDocumentResult] = useState<Record<string, unknown> | null>(null);

  const loadRapport = useCallback(async () => {
    setLoading(true);

    // Mode partage via token
    if (shareToken) {
      const data = await fetchAnalyseByShareToken(shareToken);
      if (data?.result) {
        setRapport(buildRapport(data.result as Record<string, unknown>, {
          id: data.id, type: data.type, profil: data.profil,
          created_at: data.created_at, document_names: data.document_names,
          regeneration_deadline: data.regeneration_deadline, is_preview: false,
        }));
      }
      setLoading(false);
      return;
    }

    if (!id) { setLoading(false); return; }

    const MAX_ATTEMPTS = 36;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const data = await fetchAnalyseById(id);
      if (data?.status === 'failed') { setLoading(false); return; }
      if (data?.is_preview && data?.apercu && !data?.result) {
        setApercuData({ apercu: data.apercu as Record<string, unknown>, type: data.type, id: data.id });
        setLoading(false); return;
      }
      if (data?.result) {
        const result = data.result as Record<string, unknown>;
        // Analyse simple document → DocumentRenderer
        if (data.type === 'document' && result.document_type) {
          setDocumentResult({ ...result, _profil: data.profil || 'rp' });
          setLoading(false); return;
        }
        setRapport(buildRapport(result, {
          id: data.id, type: data.type, profil: data.profil,
          created_at: data.created_at, document_names: data.document_names,
          regeneration_deadline: data.regeneration_deadline, is_preview: data.is_preview ?? false,
        }));
        setLoading(false); return;
      }
      if (attempt < MAX_ATTEMPTS - 1) await new Promise(r => setTimeout(r, 5000));
    }
    setLoading(false);
  }, [id, shareToken]);

  useEffect(() => { loadRapport(); }, [loadRapport]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 320, padding: '0 24px' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid #edf2f7', borderTopColor: '#2a7d9c', animation: 'spin 0.9s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Génération du rapport…</p>
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>Cette page se met à jour automatiquement, ne la quittez pas.</p>
      </div>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  // Aperçu gratuit
  if (apercuData) {
    const ap = apercuData.apercu;
    const isComplete = apercuData.type === 'complete' || apercuData.type === 'apercu_complete';
    const lancerPaiement = async () => {
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
    };
    return (
      <div style={{ minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #edf2f7', position: 'sticky', top: 0, zIndex: 40, padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/dashboard/analyses" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#64748b', textDecoration: 'none' }}><ChevronLeft size={15} /> Mes analyses</Link>
          <div style={{ width: 1, height: 18, background: '#edf2f7' }} />
          <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: 100 }}>APERÇU GRATUIT</span>
        </header>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }} className="apercu-grid">
          <style>{`@media (max-width: 760px) { .apercu-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h1 style={{ fontSize: 'clamp(17px,2.5vw,24px)', fontWeight: 800, color: '#0f172a' }}>{ap.titre as string}</h1>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '18px 20px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginBottom: 8 }}>RÉSUMÉ</div>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{ap.recommandation_courte as string}</p>
            </div>
            {(ap.points_vigilance as string[])?.length > 0 && (
              <div style={{ background: '#fffbeb', borderRadius: 14, border: '1px solid #fde68a', padding: '18px 20px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', letterSpacing: '0.1em', marginBottom: 10 }}>⚠ POINTS DE VIGILANCE</div>
                {(ap.points_vigilance as string[]).map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                    <AlertTriangle size={13} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', padding: '20px', position: 'relative', overflow: 'hidden', minHeight: 120 }}>
              <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
                {['Score /20 global', 'Analyse travaux détaillée', 'Finances copropriété', 'Diagnostics complets', 'Avis Verimo'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0, marginTop: 4 }} />
                    <span style={{ fontSize: 13, color: '#cbd5e1' }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6 }}>
                <Lock size={20} style={{ color: '#64748b' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Contenu réservé après paiement</span>
              </div>
            </div>
          </div>
          <div style={{ position: 'sticky', top: 76 }}>
            <div style={{ background: '#0f2d3d', borderRadius: 16, padding: '22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>DÉBLOQUER</div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{isComplete ? 'Rapport complet' : 'Analyse du document'}</h2>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{isComplete ? 'Score /20, travaux, copropriété, diagnostics, avis Verimo.' : 'Analyse approfondie et recommandations.'} PDF inclus.</p>
              <button onClick={lancerPaiement} style={{ padding: '13px', borderRadius: 12, background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                Débloquer — {isComplete ? '19,90€' : '4,90€'}
              </button>
              <Link to="/dashboard/analyses" style={{ display: 'block', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>← Mes analyses</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── ANALYSE SIMPLE DOCUMENT ──
  if (documentResult) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 1250, margin: '0 auto', padding: '20px 28px' }}>
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/dashboard/analyses" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '9px 18px', borderRadius: 9, background: '#2a7d9c', flexShrink: 0 }}>
              <ChevronLeft size={15} /> Mes analyses
            </Link>
          </div>
          <DocumentRenderer result={documentResult} />
        </div>
      </div>
    );
  }

  if (!rapport) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f9fb' }}>
      <p style={{ fontSize: 14, color: '#94a3b8' }}>Rapport introuvable.</p>
    </div>
  );

  const isComplete = rapport.type === 'complete';
  const hasCopro = isCoproType(rapport.type_bien);
  const logementLabel = rapport.type_bien === 'maison' ? 'Votre maison' : 'Votre futur logement';
  const logementIcon = rapport.type_bien === 'maison' ? <Home size={14} /> : <Building2 size={14} />;

  // Onglets selon type de bien
  const tabs: { id: TabId; label: string; icon: React.ReactNode; dotColor: string }[] = [
    { id: 'synthese', label: 'Synthèse', icon: <Star size={14} />, dotColor: '#22c55e' },
    ...(hasCopro ? [{ id: 'copropriete' as TabId, label: 'Copropriété', icon: <Building2 size={14} />, dotColor: rapport.travaux_a_prevoir.length > 0 ? '#f97316' : '#22c55e' }] : []),
    { id: 'logement', label: logementLabel, icon: logementIcon, dotColor: rapport.diagnostics.some((d: Record<string, unknown>) => d.alerte && d.perimetre === 'lot_privatif') ? '#ef4444' : '#22c55e' },
    { id: 'procedures', label: 'Procédures', icon: <Gavel size={14} />, dotColor: rapport.procedures_en_cours ? '#ef4444' : '#22c55e' },
    { id: 'documents', label: 'Documents', icon: <FileText size={14} />, dotColor: '#94a3b8' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1250, margin: '0 auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        <RapportHeader rapport={rapport} isShared={isShared} />

        {/* Bandeau re-upload */}
        {showReupload && (
          <div style={{ background: '#0f2d3d', borderRadius: 16, padding: '22px 26px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Paiement confirmé !</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 16 }}>
                Conformément au RGPD, vos documents ont été supprimés 🔒<br />
                Re-uploadez vos documents pour générer votre rapport complet.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link to="/dashboard/nouvelle-analyse" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>
                  Re-uploader mes documents →
                </Link>
                <button onClick={() => setShowReupload(false)} style={{ padding: '12px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Voir l'aperçu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglets */}
        {isComplete && (
          <div style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, padding: '5px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 10px', borderRadius: 8, border: 'none', background: active ? '#f8fafc' : 'transparent', color: active ? '#0f172a' : '#64748b', fontSize: 12.5, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s', borderBottom: active ? `2px solid ${tab.dotColor}` : '2px solid transparent', whiteSpace: 'nowrap' }}>
                  {tab.icon}
                  {tab.label}
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: tab.dotColor, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}

        {/* Contenu onglets */}
        {(activeTab === 'synthese' || !isComplete) && <SafeTabBoundary><TabSynthese rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'copropriete' && isComplete && hasCopro && <SafeTabBoundary><TabCopropriete rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'logement' && isComplete && <SafeTabBoundary><TabLogement rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'procedures' && isComplete && <SafeTabBoundary><TabProcedures rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'documents' && isComplete && <SafeTabBoundary><TabDocuments rapport={rapport} /></SafeTabBoundary>}

        {/* Bannière 7 jours */}
        {isComplete && !rapport.is_preview && rapport.regeneration_deadline && (() => {
          const deadline = new Date(rapport.regeneration_deadline);
          const diffDays = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const expired = diffDays <= 0;
          const urgent = diffDays <= 2 && !expired;
          return (
            <div style={{ marginTop: 6, padding: '14px 18px', borderRadius: 12, background: expired ? '#f8fafc' : urgent ? '#fffbeb' : '#f0fdf4', border: `1px solid ${expired ? '#e2e8f0' : urgent ? '#fde68a' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <RefreshCw size={15} style={{ color: expired ? '#94a3b8' : urgent ? '#d97706' : '#16a34a', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: expired ? '#94a3b8' : urgent ? '#92400e' : '#166534', marginBottom: 2 }}>
                  {expired ? 'Délai de complétion expiré' : `Vous pouvez compléter ce dossier — encore ${diffDays} jour${diffDays > 1 ? 's' : ''}`}
                </div>
                <div style={{ fontSize: 12, color: expired ? '#cbd5e1' : '#64748b' }}>
                  {expired ? 'Le délai de 7 jours pour ajouter des documents est dépassé.' : 'Ajoutez des documents oubliés et obtenez un rapport mis à jour gratuitement.'}
                </div>
              </div>
              {!expired && (
                <button onClick={() => window.location.href = `/dashboard/rapport?id=${id}&action=complement`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, border: 'none', background: urgent ? '#d97706' : '#16a34a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  <RefreshCw size={12} /> Compléter
                </button>
              )}
            </div>
          );
        })()}

        {/* Footer */}
        <div style={{ padding: '14px 18px', background: '#fff', borderRadius: 12, border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Shield size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5, flex: 1 }}>
            Ce rapport est fourni à titre informatif par Verimo. Il ne constitue pas un conseil juridique ou financier et ne remplace pas l'avis d'un notaire ou d'un expert immobilier.
          </span>
          {id && <span style={{ fontSize: 11, color: '#cbd5e1', flexShrink: 0 }}>#{id.slice(0, 8)}</span>}
        </div>

      </div>
      <style>{`
        @media (max-width: 640px) {
          .rapport-tabs button { font-size: 11px !important; padding: 8px 6px !important; }
        }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; font-size: 11px !important; }
          .no-print, header, .topbar-print-hide { display: none !important; }
          .print-show-all > div { display: flex !important; }
          .rapport-tabs { display: none !important; }
          .print-section { break-inside: avoid; margin-bottom: 16px; }
          @page { margin: 1.5cm; size: A4; }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
