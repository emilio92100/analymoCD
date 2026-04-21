import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchAnalyseById, fetchAnalyseByShareToken, getOrCreateShareToken } from '../lib/analyses';
import { lancerAnalyseEdge } from '../lib/analyse-client';
import type { AnalyseProgress } from '../lib/analyse-client';
import { supabase } from '../lib/supabase';
import DocumentRenderer from './dashboard/DocumentRenderer';
import {
  ChevronLeft, Download, Building2, AlertTriangle, CheckCircle,
  Shield, FileText, Gavel, Info, Star, Paperclip,
  RefreshCw, Lock, ChevronDown, Copy, Check,
  Home, TrendingDown, Upload, X, Clock,
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

/* ── Compte à rebours live pour le dernier jour ── */
function CountdownTimer({ deadline }: { deadline: Date }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const diff = Math.max(0, deadline.getTime() - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  if (diff <= 0) return <span>Délai expiré</span>;
  // Calcul de la couleur d'urgence : J-1 = rouge, J-2 = orange, sinon neutre
  const totalHoursRemaining = diff / (1000 * 60 * 60);
  const color =
    totalHoursRemaining <= 24 ? '#dc2626' :      // Rouge : J-1 (moins de 24h)
    totalHoursRemaining <= 48 ? '#ea580c' :      // Orange : J-2 (entre 24h et 48h)
    '#64748b';                                   // Neutre : J-3 ou plus
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color, fontWeight: totalHoursRemaining <= 48 ? 600 : 500, fontVariantNumeric: 'tabular-nums' }}>
      <Clock size={13} />
      {days}j {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}min {String(seconds).padStart(2, '0')}s
    </span>
  );
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
  React.useEffect(() => { if (defaultOpen !== undefined) setOpen(defaultOpen); }, [defaultOpen]);
  // Synchroniser avec defaultOpen quand il change (ex: bouton Tout déplier/replier)
  React.useEffect(() => { if (defaultOpen !== undefined) setOpen(defaultOpen); }, [defaultOpen]);
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
      <button onClick={e => { e.preventDefault(); setOpen(v => !v); }} className="rapport-accordion-header" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
        onMouseOver={e => (e.currentTarget as HTMLElement).style.background = '#f0f7fb'}
        onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
        <div className="accord-icon" style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#0f172a' }}>{title}</span>
            {tooltip && (
              <div style={{ display: 'inline-flex' }}
                onClick={e => e.stopPropagation()}>
                <TooltipBtn text={tooltip} />
              </div>
            )}
          </div>
          {sub && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {badge && <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 10px', borderRadius: 100, ...badgeStyle }}>{badge}</span>}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
          <ChevronDown size={14} color="#94a3b8" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
      </button>
      {/* Corps accordéon — animation douce CSS (ouverture/fermeture) */}
      <div
        className="rapport-accordion-body-wrap"
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ overflow: 'hidden', minHeight: 0 }}>
          <div
            className="rapport-accordion-body"
            style={{
              borderTop: '1px solid #f1f5f9',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(-4px)',
              transition: 'opacity 0.3s ease 0.05s, transform 0.3s ease 0.05s',
            }}
          >
            {children}
          </div>
        </div>
      </div>
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

  // "Détecté" sans alerte = installation présente et conforme → badge vert
  const isConforme = d.presence === 'detecte' && !hasAlert && !isERP && !isCarrez;
  const presenceStyle = isAbsence
    ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' }
    : isNonRealise ? { bg: '#f8fafc', border: '#e2e8f0', text: '#94a3b8' }
    : isERP ? { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b' }
    : hasAlert ? { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' }
    : isConforme ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' }
    : { bg: '#fff7ed', border: '#fed7aa', text: '#d97706' };
  const presenceLabel = isAbsence ? '✓ Non détecté' : isNonRealise ? 'Non réalisé' : isERP ? 'Informatif' : hasAlert ? 'Anomalies' : isConforme ? '✓ Conforme' : 'Détecté';

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
                      <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>Surface au sol</div>
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
                <div key={i} style={{ fontSize: 13, color: '#92400e', marginBottom: 4, lineHeight: 1.5 }}>• {t}</div>
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
      <button onClick={() => setShowMenu(!showMenu)} disabled={loading} className="topnav-share-btn"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: copied ? '#4ade80' : 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span className="topnav-share-label">{copied ? 'Copié' : loading ? '…' : 'Partager'}</span>
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
   BOUTON PDF — popup "fonctionnalité en cours"
══════════════════════════════════ */
function PdfButton({ rapportId: _rapportId }: { rapportId: string }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button onClick={() => setShowModal(true)} className="topnav-dl-btn"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, border: 'none', background: '#fff', color: '#0f2d3d', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
        <Download size={14} /> <span className="topnav-dl-label">PDF</span>
      </button>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.55)', backdropFilter: 'blur(4px)' }} />
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', background: '#fff', borderRadius: 22, padding: '36px 32px 28px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(15,45,61,0.25)', animation: 'fadeUp 0.25s ease both' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: 14, right: 14, width: 30, height: 30, borderRadius: 8, background: '#f8fafc', border: '1px solid #edf2f7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 16, fontWeight: 700 }}>×</button>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #e0f2fe, #f0f9ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Download size={28} style={{ color: '#2a7d9c' }} />
            </div>
            <h3 style={{ fontSize: 19, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.02em' }}>Export PDF bientôt disponible</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>
              Nous travaillons activement sur cette fonctionnalité pour vous permettre de télécharger vos rapports au format PDF.
            </p>
            <div style={{ padding: '12px 16px', borderRadius: 12, background: '#f0f9ff', border: '1px solid #e0f2fe', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a7d9c', animation: 'vr-pulse 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2a7d9c' }}>En cours de développement</span>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,45,61,0.18)' }}>
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════
   HEADER RAPPORT
══════════════════════════════════ */
export type RapportData = ReturnType<typeof buildRapport>;

function RapportHeader({ rapport, isShared }: { rapport: RapportData; isShared: boolean }) {
  const scoreColor = getScoreColor(rapport.score);
  const isComplete = rapport.type === 'complete';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Hero header — full dark */}
      <div className="rapport-header" style={{ background: 'linear-gradient(135deg, #0f2d3d 0%, #1a4a5e 100%)', borderRadius: 16, overflow: 'hidden' }}>
        {/* Topbar nav */}
        <div className="rapport-topnav" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {!isShared ? (
            <Link to="/dashboard/analyses" className="topnav-back-btn" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '8px 14px', borderRadius: 9, background: '#2a7d9c', flexShrink: 0, whiteSpace: 'nowrap' }}>
              <ChevronLeft size={14} /> <span className="topnav-back-label">Mes analyses</span>
            </Link>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <Shield size={12} /> <span className="topnav-back-label">Rapport partagé</span>
            </div>
          )}
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
            {!isShared && <ShareButton analyseId={rapport.id} />}
            <PdfButton rapportId={rapport.id} />
          </div>
        </div>

        {/* Hero content */}
        {isComplete && (
          <div className="rapport-hero" style={{ padding: '18px 18px 20px' }}>
            {/* Ligne score + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              {/* Cercle score — taille fixe, coordonnées cohérentes */}
              <div className="rapport-score-circle" style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
                <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="38" cy="38" r="30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
                  <circle cx="38" cy="38" r="30" fill="none" stroke={scoreColor} strokeWidth="6"
                    strokeDasharray={`${(rapport.score / 20) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
                    strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{rapport.score.toFixed(1)}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>/20</span>
                </div>
              </div>
              {/* Adresse + label niveau */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', marginBottom: 4, textTransform: 'uppercase' as const }}>
                  {rapport.type_bien === 'maison' ? 'Maison' : 'Appart. copro'} · {rapport.profil === 'invest' ? 'Investissement' : 'Rés. principale'}
                </div>
                <div style={{ fontSize: 'clamp(13px,3.8vw,18px)', fontWeight: 800, color: '#fff', lineHeight: 1.2, wordBreak: 'break-word' as const, marginBottom: 6 }}>{rapport.adresse}</div>
                <span className="score-label-badge" style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: `${scoreColor}35`, border: `1px solid ${scoreColor}70`, color: '#fff' }}>
                  {getScoreLabel(rapport.score)}
                </span>
              </div>
            </div>
            {/* Tags */}
            <div className="hero-tags" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>{getTypeBienLabel(rapport.type_bien)}</span>
              <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>{getProfilLabel(rapport.profil)}</span>
              {rapport.annee_construction && <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }}>Construit en {rapport.annee_construction}</span>}
              <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>Analysé le {rapport.date}</span>
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
   RÉSUMÉ BLOCK — avec line-clamp mobile
══════════════════════════════════ */
function ResumeBlock({ resume }: { resume: string }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div style={{ padding: '20px 22px 16px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f2d3d', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99, letterSpacing: '0.06em', marginBottom: 14 }}>📋 RÉSUMÉ</div>
      <p className={!expanded ? 'resume-clamped' : ''} style={{ fontSize: 15, color: '#374151', lineHeight: 1.9, margin: 0 }}>{resume}</p>
      <button className="resume-toggle" onClick={() => setExpanded(v => !v)}
        style={{ display: 'none', marginTop: 8, fontSize: 13, fontWeight: 600, color: '#2a7d9c', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
        {expanded ? 'Réduire ↑' : 'Lire la suite ↓'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════
   ONGLET SYNTHÈSE
══════════════════════════════════ */
function TabSynthese({ rapport }: { rapport: RapportData }) {
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
  // severity pilote la couleur de la carte : 'neutral' (blanc) par défaut, teinté uniquement pour les alertes sémantiques
  type KpiSeverity = 'neutral' | 'info' | 'ok' | 'warn' | 'danger';
  const buildKpis = () => {
    const kpis: { icon: string; label: string; value: string; color?: string; severity: KpiSeverity }[] = [];
    if (nbLots) kpis.push({ icon: '🏢', label: 'Nombre de lots', value: String(nbLots), severity: 'neutral' });
    if (rapport.annee_construction) kpis.push({ icon: '📅', label: 'Année de construction', value: safeStr(rapport.annee_construction), severity: 'neutral' });
    if (chargesLotNum > 0) kpis.push({ icon: '💰', label: 'Charges annuelles', value: `${chargesLotNum.toLocaleString('fr-FR')} €/an`, severity: 'neutral' });
    if (totalTravauxVotes > 0) kpis.push({ icon: '🏗', label: 'Travaux votés', value: `~${totalTravauxVotes.toLocaleString('fr-FR')} €`, severity: 'warn' });
    if (nbTravauxEvoques > 0) kpis.push({ icon: '⚠️', label: 'Travaux évoqués', value: `${nbTravauxEvoques} mentionné${nbTravauxEvoques > 1 ? 's' : ''}`, severity: 'warn' });
    if (dpeClasse) {
      const dpeSeverity: KpiSeverity = ['A', 'B', 'C'].includes(dpeClasse) ? 'ok' : ['D', 'E'].includes(dpeClasse) ? 'warn' : 'danger';
      kpis.push({ icon: '⚡', label: 'Classe DPE', value: `Classe ${dpeClasse}`, color: dpeColors[dpeClasse], severity: dpeSeverity });
    }
    kpis.push({ icon: '⚖️', label: 'Procédures', value: nbProcedures === 0 ? 'Aucune détectée' : `${nbProcedures} détectée${nbProcedures > 1 ? 's' : ''}`, color: nbProcedures > 0 ? '#dc2626' : '#16a34a', severity: nbProcedures > 0 ? 'danger' : 'ok' });
    if (taxeFonciereStr) kpis.push({ icon: '🏛', label: 'Taxe foncière', value: taxeFonciereStr, severity: 'neutral' });
    return kpis;
  };

  // Style de carte selon severity — hybride A+B (blanc par défaut, teinté si alerte)
  const getKpiCardStyle = (severity: KpiSeverity) => {
    switch (severity) {
      case 'ok':      return { background: '#f0fdf4', border: '1px solid #bbf7d0', iconBg: '#dcfce7', iconColor: '#15803d', labelColor: '#166534', valueColor: '#14532d' };
      case 'warn':    return { background: '#fff7ed', border: '1px solid #fed7aa', iconBg: '#ffedd5', iconColor: '#9a3412', labelColor: '#9a3412', valueColor: '#7c2d12' };
      case 'danger':  return { background: '#fef2f2', border: '1px solid #fecaca', iconBg: '#fee2e2', iconColor: '#991b1b', labelColor: '#991b1b', valueColor: '#7f1d1d' };
      case 'info':    return { background: '#eff6ff', border: '1px solid #bfdbfe', iconBg: '#dbeafe', iconColor: '#1e40af', labelColor: '#1e40af', valueColor: '#1e3a8a' };
      case 'neutral':
      default:        return { background: '#fff',     border: '1px solid #e2edf3', iconBg: '#f1f5f9', iconColor: '#475569', labelColor: '#6b8a96', valueColor: '#0f2d3d' };
    }
  };

  const kpis = buildKpis();
  const kpiCols = Math.min(kpis.length, 4);
  const kpiGridStyle = { display: 'grid', gridTemplateColumns: `repeat(${kpiCols}, 1fr)`, gap: '10px' } as const;

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
            <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
              {avertissement || `Vérifiez que ces fichiers sont en format PDF non protégé : ${docsIgnores.join(', ')}`}
            </div>
          </div>
        </div>
      )}

      {/* 1. RÉSUMÉ + DÉTAIL NOTE fusionnés */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', overflow: 'hidden' }}>
        {/* Résumé */}
        <ResumeBlock resume={rapport.resume} />

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
                // Garde-fou : detecter les "faux 0" ou le scoring est visiblement en contradiction avec les donnees extraites
                const diagsPrivatifsPresent = rapport.diagnostics && rapport.diagnostics.some(
                  (d: Record<string, unknown>) => d.perimetre === 'lot_privatif'
                );
                const diagsCommunsPresent = rapport.diagnostics && rapport.diagnostics.some(
                  (d: Record<string, unknown>) => d.perimetre === 'parties_communes'
                );
                const isFauxZero =
                  (key === 'diags_privatifs' && isZero && diagsPrivatifsPresent) ||
                  (key === 'diags_communs' && isZero && diagsCommunsPresent);
                const pct = Math.round((c.note / c.note_max) * 100);
                const color = isFauxZero ? '#64748b' : (isZero ? '#94a3b8' : getCatColor(pct));
                const bg = isFauxZero ? '#f1f5f9' : (isZero ? '#f8fafc' : getCatBg(pct));
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{catIcons[key] || '📊'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, color: '#0f172a' }}>{catLabels[key] || key}</span>
                          {isFauxZero && (
                            <TooltipBtn text="Les diagnostics ont bien été détectés dans vos documents. La note n'a pas été calculée automatiquement — consultez le détail dans l'onglet Logement." />
                          )}
                          {isZero && !isFauxZero && (
                            <TooltipBtn text="Cette note est nulle car aucun document pertinent n'a été détecté. Complétez votre dossier dans les 7 jours pour améliorer votre score." />
                          )}
                        </div>
                        {isFauxZero ? (
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b', fontStyle: 'italic' }}>Non évalué</span>
                        ) : (
                          <span style={{ fontSize: 14, fontWeight: 600, color }}>{c.note} pt sur {c.note_max}</span>
                        )}
                      </div>
                      <div style={{ height: 5, background: '#f1f5f9', borderRadius: 99 }}>
                        <div style={{ height: '100%', width: `${isFauxZero ? 0 : pct}%`, background: color, borderRadius: 99 }} />
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

      {/* 2. KPIs — style hybride : blanc par défaut, teinté uniquement pour les alertes */}
      {isComplete && kpis.length > 0 && (
        <>
          {/* Desktop — grille blocs */}
          <div style={kpiGridStyle} className="kpi-band-grid kpi-synth-desktop">
            {kpis.map((kpi, i) => {
              const s = getKpiCardStyle(kpi.severity);
              return (
                <div key={i} style={{ background: s.background, border: s.border, borderRadius: 12, padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 11, transition: 'transform 0.15s ease' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.iconBg, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{kpi.icon}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 10.5, color: s.labelColor, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.label}</span>
                    <span style={{ fontSize: 17, color: s.valueColor, fontWeight: 700, lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kpi.value}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Mobile — liste compacte (même logique de coloration) */}
          <div className="kpi-synth-mobile" style={{ display: 'none', flexDirection: 'column', gap: 0, background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, overflow: 'hidden', marginBottom: 4 }}>
            {kpis.map((kpi, i) => {
              const s = getKpiCardStyle(kpi.severity);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < kpis.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: s.iconBg, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {kpi.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{kpi.label}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.valueColor, flexShrink: 0 }}>{kpi.value}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 3. POINTS POSITIFS / VIGILANCE */}
      <div>
        <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Synthèse de l'analyse</span>
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, #2a7d9c, transparent)', marginTop: 8, borderRadius: 99 }} />
        </div>
        <div className="points-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div className="points-card" style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#2d6a2d', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', padding: '5px 12px', borderRadius: 99, marginBottom: 16 }}>✓ POINTS POSITIFS</div>
            <div className="rapport-main" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rapport.points_forts.length > 0 ? rapport.points_forts.map((p: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }}>
                    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="10" stroke="#2d6a2d" strokeWidth="1.5"/>
                      <path d="M7 11.5l3 3 5-5" stroke="#2d6a2d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="points-text" style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.65 }}>{safeStr(p)}</span>
                </div>
              )) : <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun point positif identifié.</p>}
            </div>
          </div>
          <div className="points-card" style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#92400e', color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', padding: '5px 12px', borderRadius: 99, marginBottom: 16 }}>⚠ POINTS DE VIGILANCE</div>
            <div className="rapport-main" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rapport.points_vigilance.length > 0 ? rapport.points_vigilance.map((p: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }}>
                    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 2.5L2 19.5h18L11 2.5z" stroke="#92400e" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M11 9.5v4.5" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="11" cy="16.5" r="0.8" fill="#92400e"/>
                    </svg>
                  </div>
                  <span className="points-text" style={{ fontSize: 14, color: '#0f172a', lineHeight: 1.65 }}>{safeStr(p)}</span>
                </div>
              )) : <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucun point de vigilance identifié.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* 4. PISTES DE NÉGOCIATION */}
      {rapport.negociation?.applicable && rapport.negociation.elements.length > 0 && rapport.score < 14 && (
        <div className="nego-block" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingDown size={15} style={{ color: '#d97706' }} />
            <span className="nego-title" style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>Pistes de négociation</span>
          </div>
          <p className="nego-intro" style={{ fontSize: 13, color: '#92400e', margin: '0 0 12px 0', lineHeight: 1.55, opacity: 0.85 }}>
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
                <div key={i} className="nego-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: '#fff', borderRadius: 10, border: '1px solid #fde68a' }}>
                  <div style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }}>
                    <svg viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11 2.5L2 19.5h18L11 2.5z" stroke="#d97706" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M11 9.5v4.5" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="11" cy="16.5" r="0.8" fill="#d97706"/>
                    </svg>
                  </div>
                  <div>
                    <span className="nego-text" style={{ fontSize: 13, color: '#92400e', lineHeight: 1.55 }}>{texte}</span>
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
      <div className="avis-verimo-block" style={{ background: '#0f2d3d', borderRadius: 16, overflow: 'hidden' }}>
        <div className="avis-header" style={{ padding: '16px 20px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⭐</span>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span className="avis-title" style={{ fontSize: 16, fontWeight: 600, color: '#fff', position: 'relative', zIndex: 1 }}>Avis Verimo</span>
            <div style={{ position: 'absolute', bottom: 1, left: 0, right: 0, height: 6, background: 'rgba(91,184,212,0.45)', zIndex: 0, borderRadius: 2 }} />
          </div>
        </div>
        <div className="avis-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
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
              <p key={i} className="avis-para" style={{ fontSize: 14, color: i === 0 ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.75)', lineHeight: 1.75, margin: 0, marginTop: i > 0 ? 12 : 0, paddingTop: i > 0 ? 12 : 0, borderTop: i > 0 ? '0.5px solid rgba(255,255,255,0.1)' : 'none' }}>
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
// Composant ? universel — fond sombre, position fixed, jamais rogné
function TooltipBtn({ text, white = false }: { text: string; white?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  const computePos = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const tooltipWidth = 270;
    const margin = 8;
    // Positionnement horizontal : aligné à gauche du ?, mais jamais hors écran
    let left = r.left;
    if (left + tooltipWidth + margin > window.innerWidth) {
      left = window.innerWidth - tooltipWidth - margin;
    }
    if (left < margin) left = margin;
    // Positionnement vertical : sous le ? si assez de place, sinon au-dessus
    const estimatedHeight = 120;
    let top = r.bottom + 6;
    if (top + estimatedHeight > window.innerHeight && r.top > estimatedHeight) {
      top = r.top - estimatedHeight - 6;
    }
    setPos({ top, left });
  };

  const show = () => {
    const isMob = window.innerWidth <= 640;
    setMobile(isMob);
    if (!isMob) computePos();
    setVisible(true);
  };

  const hide = () => setVisible(false);

  // Recalcule la position si scroll/resize pendant l'affichage (desktop)
  useEffect(() => {
    if (!visible || mobile) return;
    const handler = () => computePos();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [visible, mobile]);

  // Rendu du tooltip via portal pour échapper à tout clipping parent (overflow:hidden, z-index, etc.)
  const tooltipNode = visible && !mobile ? (
    <span
      className="tooltip-bubble"
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: 270,
        background: '#0f172a',
        borderRadius: 10,
        padding: '10px 13px',
        fontSize: 12,
        color: '#fff',
        lineHeight: 1.6,
        zIndex: 2147483647, // Niveau max pour passer par-dessus tout
        pointerEvents: 'none',
        whiteSpace: 'normal',
        fontWeight: 400,
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
      }}
    >
      {text}
    </span>
  ) : null;

  const mobileNode = visible && mobile ? (
    <div
      onClick={hide}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f172a',
          borderRadius: 14,
          padding: '16px 18px',
          fontSize: 14,
          color: '#fff',
          lineHeight: 1.7,
          maxWidth: 340,
          width: '100%',
          fontWeight: 400,
        }}
      >
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>INFORMATION</span>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', lineHeight: 1 }} onClick={hide}>✕</span>
        </div>
        {text}
      </div>
    </div>
  ) : null;

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={e => { e.stopPropagation(); visible ? hide() : show(); }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: white ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
          border: white ? 'none' : '1px solid #e2e8f0',
          fontSize: 10,
          color: white ? '#fff' : '#94a3b8',
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        ?
      </span>
      {typeof document !== 'undefined' && tooltipNode && createPortal(tooltipNode, document.body)}
      {typeof document !== 'undefined' && mobileNode && createPortal(mobileNode, document.body)}
    </>
  );
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {children}
      <TooltipBtn text={text} />
    </span>
  );
}

function KpiBand({ items }: { items: { label: string; value: string; sub?: string; color?: string; bg?: string; border?: string; tooltip?: string; emoji?: string }[] }) {
  const bleus = ['#2a7d9c', '#236b87', '#1e5f77', '#185166', '#133d50'];
  return (
    <>
      {/* Desktop — grille de blocs (inchangé) */}
      <div className="kpi-band-grid kpi-desktop" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0,1fr))`, gap: 10, marginBottom: 20 }}>
        {items.map((item, i) => {
          const bg = bleus[Math.min(i, bleus.length - 1)];
          return (
            <div key={i} style={{ background: bg, borderRadius: 14, padding: '18px 20px' }}>
              {item.emoji && <div style={{ fontSize: 24, marginBottom: 8 }}>{item.emoji}</div>}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 5, lineHeight: 1.3 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span>{item.label}</span>
                  {item.tooltip && <TooltipBtn text={item.tooltip} white={true} />}
                </span>
              </div>
              <div className="kpi-value" style={{ fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1.1 }}>{item.value}</div>
              {item.sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{item.sub}</div>}
            </div>
          );
        })}
      </div>
      {/* Mobile — liste compacte */}
      <div className="kpi-mobile" style={{ display: 'none', flexDirection: 'column', gap: 0, marginBottom: 14, background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, overflow: 'hidden' }}>
        {items.map((item, i) => {
          const bg = bleus[Math.min(i, bleus.length - 1)];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {item.emoji ?? '•'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 1 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {item.label}
                    {item.tooltip && <TooltipBtn text={item.tooltip} white={false} />}
                  </span>
                </div>
                {item.sub && <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.sub}</div>}
              </div>
              <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{item.value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SyndicBand({ syndic }: { syndic: Record<string, unknown> | null }) {
  if (!syndic?.nom) return null;
  const gestionnaire = safeStr(syndic.gestionnaire);
  const gestionnaireFonction = safeStr(syndic.gestionnaire_fonction);
  const type = safeStr(syndic.type);

  // ⭐ Session 4 — Nouveaux champs statut syndic multi-PV
  const statut = safeStr(syndic.statut);
  const sortant = safeStr(syndic.sortant);
  const anneeChangement = safeStr(syndic.annee_changement);
  const nbAgs = typeof syndic.nb_ags_analysees === 'number' ? (syndic.nb_ags_analysees as number) : null;
  const historique = Array.isArray(syndic.historique_changements) ? (syndic.historique_changements as Array<{ annee?: string; syndic?: string }>) : [];

  // Détermine l'affichage du statut
  type StatutDisplay = { icon: string; color: string; bg: string; border: string; label: string; sub?: string } | null;
  const statutDisplay: StatutDisplay = (() => {
    if (statut === 'stable' && nbAgs && nbAgs >= 2) {
      return {
        icon: '✅', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0',
        label: 'Syndic stable',
        sub: `Reconduit sur les ${nbAgs} dernières AGs analysées.`,
      };
    }
    if (statut === 'reconduit') {
      return {
        icon: '✅', color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0',
        label: 'Syndic reconduit',
        sub: 'Le syndic en place a été renouvelé à cette AG.',
      };
    }
    if (statut === 'nouveau_elu') {
      return {
        icon: '🔄', color: '#2a7d9c', bg: '#eff6ff', border: '#bfdbfe',
        label: `Nouveau syndic élu${anneeChangement ? ` en ${anneeChangement}` : ''}`,
        sub: sortant ? `A remplacé ${sortant}.` : 'Nouvelle gouvernance en place.',
      };
    }
    if (statut === 'rotation_frequente') {
      const changesCount = historique.length || nbAgs || 0;
      return {
        icon: '⚠️', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa',
        label: 'Rotation fréquente des syndics',
        sub: `${changesCount} syndics différents identifiés — signal d'instabilité dans la gouvernance.`,
      };
    }
    if (statut === 'recherche') {
      return {
        icon: '🔄', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa',
        label: "Recherche d'un nouveau syndic en cours",
        sub: sortant ? `${sortant} sortant — aucune désignation adoptée à ce jour.` : 'Aucune désignation adoptée à ce jour.',
      };
    }
    if (statut === 'carence') {
      return {
        icon: '⚠️', color: '#991b1b', bg: '#fef2f2', border: '#fecaca',
        label: 'Carence de syndic détectée',
        sub: 'Situation à clarifier avec votre notaire avant toute offre.',
      };
    }
    return null;
  })();

  // Libellé gestionnaire : "Fonction : Nom" ou "Gestionnaire : Nom" par défaut
  const gestionnaireLabel = gestionnaire
    ? (gestionnaireFonction ? `${gestionnaireFonction} : ${gestionnaire}` : `Gestionnaire : ${gestionnaire}`)
    : null;

  return (
    <div className="syndic-band" style={{ background: '#fff', border: '0.5px solid #edf2f7', borderRadius: 14, padding: '16px 20px' }}>
      {/* Identité syndic */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: statutDisplay ? 14 : 0 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: '#1e40af', flexShrink: 0 }}>
          {safeStr(syndic.nom)?.substring(0, 2).toUpperCase() ?? 'SY'}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{safeStr(syndic.nom)}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {type && <span>🏢 {type === 'professionnel' ? 'Cabinet professionnel' : 'Syndic bénévole'}</span>}
            {gestionnaireLabel && <span>👤 {gestionnaireLabel}</span>}
          </div>
        </div>
      </div>

      {/* ⭐ Session 4 — Bloc statut syndic intelligent (affiché uniquement si info pertinente) */}
      {statutDisplay && (
        <div style={{ padding: '12px 14px', borderRadius: 10, background: statutDisplay.bg, border: `1px solid ${statutDisplay.border}` }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{statutDisplay.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: statutDisplay.color, lineHeight: 1.4 }}>{statutDisplay.label}</div>
              {statutDisplay.sub && <div style={{ fontSize: 13, color: statutDisplay.color, opacity: 0.85, marginTop: 3, lineHeight: 1.55 }}>{statutDisplay.sub}</div>}
              {/* Historique affiché uniquement si rotation_frequente */}
              {statut === 'rotation_frequente' && historique.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${statutDisplay.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: statutDisplay.color, marginBottom: 6, letterSpacing: '0.04em' }}>HISTORIQUE</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {historique.map((h, i) => (
                      <div key={i} style={{ fontSize: 13, color: statutDisplay.color, display: 'flex', gap: 8 }}>
                        <span style={{ fontWeight: 600, minWidth: 50 }}>{safeStr(h.annee)}</span>
                        <span>•</span>
                        <span>{safeStr(h.syndic)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabCopropriete({ rapport }: { rapport: RapportData }) {
  const [allOpen, setAllOpen] = useState(false);
  type SyndicT = { nom?: string; type?: string; gestionnaire?: string; fin_mandat?: string; tensions_detectees?: boolean; tensions_detail?: string };
  type QuitusT = { soumis?: boolean; approuve?: boolean; detail?: string };
  type ParticT = { annee?: string; copropietaires_presents_representes?: string; taux_tantiemes_pct?: string; quorum_note?: string; quitus?: QuitusT };
  type NbLotsT = { logements?: number | null; parkings?: number | null; caves?: number | null; commerces?: number | null };
  type DtgT = { present?: boolean; etat_general?: string | null; budget_urgent_3ans?: number | null; budget_total_10ans?: number | null; travaux_prioritaires?: string[] };
  type RegleT = { label?: string; statut?: string; impact_rp?: boolean; impact_invest?: boolean };
  type ContratEntretienT = { equipement?: string; prestataire?: string | null; date_reconduction?: string | null; periodicite?: string | null };
  type TravauxCarnetT = { annee?: string | number | null; label?: string; montant?: number | null; entreprise?: string | null };
  type TravauxEnCoursCarnetT = { label?: string; date_vote?: string | null; montant?: number | null };
  type DiagCommunCarnetT = { type?: string; date?: string | null; entreprise?: string | null; resultat?: string | null };
  type CarnetEntretienT = {
    present?: boolean; date_maj?: string | null; immatriculation_registre?: string | null;
    equipements_copro?: { chauffage_collectif?: boolean | null; type_chauffage?: string | null; eau_chaude_collective?: boolean | null; eau_froide_collective?: boolean | null; fibre_optique?: boolean | null; ascenseur?: boolean | null };
    contrats_entretien?: ContratEntretienT[];
    travaux_realises_carnet?: TravauxCarnetT[];
    travaux_en_cours_votes_carnet?: TravauxEnCoursCarnetT[];
    diagnostics_parties_communes_carnet?: DiagCommunCarnetT[];
    conseil_syndical_carnet?: { date_nomination?: string | null; membres_nb?: number | null };
    rcp_info_carnet?: { date_origine?: string | null; notaire?: string | null; nb_modificatifs?: number | null };
  };
  type FicheSyntheticT = {
    present?: boolean; date?: string | null; recente?: boolean | null;
    immatriculation_registre?: string | null; nb_lots_principaux?: number | null; nb_lots_total?: number | null;
    equipements_collectifs?: string | string[] | null; dtg_mentionne?: boolean | null;
    budget_n_1?: number | null; impayes_total?: number | null; fonds_travaux_alur_global?: number | null;
    syndic_identite?: string | null; commentaire_verimo?: string | null;
  };
  type ModificatifRcpT = {
    date_acte?: string | null; notaire?: string | null; type_modification?: string | null;
    sur_quoi_porte?: Array<{ aspect?: string; detail?: string }>;
    impact_acheteur?: string | null;
    points_attention?: Array<{ label?: string; detail?: string }>;
  };
  type VieT = {
    syndic?: SyndicT; nb_lots_total?: number | null; nb_lots_detail?: NbLotsT; nb_batiments?: number | null;
    participation_ag?: ParticT[]; tendance_participation?: string; analyse_participation?: string;
    travaux_votes_non_realises?: unknown[]; appels_fonds_exceptionnels?: unknown[];
    questions_diverses_notables?: unknown[]; dtg?: DtgT; regles_copro?: RegleT[];
    carnet_entretien?: CarnetEntretienT;
    fiche_synthetique?: FicheSyntheticT;
    modificatifs_rcp?: ModificatifRcpT[];
  };

  const vie = rapport.vie_copropriete as VieT | null;
  const syndic = (vie?.syndic ?? null) as SyndicT | null;
  const participation = (vie?.participation_ag ?? []) as ParticT[];
  const nbLotsTotal = vie?.nb_lots_total ?? null;
  const nbLotsDetail = vie?.nb_lots_detail ?? null;
  const nbBatiments = vie?.nb_batiments ?? null;
  const dtg = vie?.dtg ?? null;
  const reglesCopro = (vie?.regles_copro ?? []) as RegleT[];

  const travaux_realises = rapport.travaux_realises;
  const travaux_votes = rapport.travaux_votes;
  const travaux_evoques_raw = rapport.travaux_a_prevoir;
  const MOTS_DIAGS_PRIVATIFS = ['dpe', 'diagnostic', 'isolation mur', 'isolation plafond', 'double vitrage', 'fenêtre', 'electricit', 'gaz intérieur', 'amiante lot', 'plomb lot', 'pack 1', 'pack 2', 'rénovation énergétique'];
  const travaux_evoques = travaux_evoques_raw.filter(t => {
    const label = ((t.label as string) || '').toLowerCase();
    const precision = ((t.precision as string) || '').toLowerCase();
    return !MOTS_DIAGS_PRIVATIFS.some(m => label.includes(m) || precision.includes(m));
  });

  const diagsCommuns = rapport.diagnostics.filter((d: Record<string, unknown>) => d.perimetre === 'parties_communes' || d.perimetre === 'immeuble');
  const hasDiagAlert = diagsCommuns.some((d: Record<string, unknown>) => d.alerte);
  const amiante_ac1 = diagsCommuns.some((d: Record<string, unknown>) => d.type === 'AMIANTE' && d.presence === 'detectee' && d.alerte);

  const anneeConstruction = (rapport as Record<string, unknown>).annee_construction as string | null;
  const anneeNum = anneeConstruction ? parseInt(anneeConstruction) : null;
  const fin = rapport.finances as Record<string, unknown> | null;
  const budgetTotal = fin?.budget_total_copro;
  const budgetNum = typeof budgetTotal === 'number' ? budgetTotal : typeof budgetTotal === 'string' ? parseFloat(String(budgetTotal).replace(/[^0-9.]/g, '')) || 0 : 0;
  const budgetAnnee = fin?.budget_total_copro_annee as string | number | null | undefined;
  const fondsNum = rapport.fonds_travaux > 0 ? rapport.fonds_travaux : 0;
  const fondsAnnee = fin?.fonds_travaux_annee as string | number | null | undefined;
  const fondsPct = budgetNum > 0 && fondsNum > 0 ? ((fondsNum / budgetNum) * 100) : null;
  const fondsInsuffisant = rapport.fonds_travaux_statut === 'insuffisant' || rapport.fonds_travaux_statut === 'absent';
  const quitusRefuse = participation.some(p => p.quitus?.soumis === true && p.quitus?.approuve === false);

  // KPIs bandeau — infos spécifiques à la copropriété (pas au lot perso)
  const kpiItems = [];
  if (budgetNum > 0) kpiItems.push({ emoji: '💰', label: 'Budget annuel copro', value: `${budgetNum.toLocaleString('fr-FR')} €`, sub: budgetAnnee ? `Budget ${budgetAnnee}` : 'Charges totales copropriété', color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', tooltip: "Budget prévisionnel voté en AG pour faire fonctionner l'ensemble de la copropriété (entretien, assurance, syndic, fluides communs). Ne correspond pas aux charges de votre lot." });
  if (nbLotsTotal) kpiItems.push({ emoji: '🏢', label: 'Lots dans la copropriété', value: String(nbLotsTotal), sub: nbBatiments ? `${nbBatiments} bâtiment${nbBatiments > 1 ? 's' : ''}` : undefined, tooltip: "Nombre total de lots (appartements, parkings, caves...) composant la copropriété." });
  if (fondsPct !== null) kpiItems.push({ emoji: '🔧', label: 'Fonds travaux', value: `${fondsPct.toFixed(1)}%`, sub: fondsPct < 5 ? 'Insuffisant — seuil 5%' : 'Conforme loi ALUR', color: fondsPct < 5 ? '#a16207' : '#16a34a', bg: fondsPct < 5 ? '#fff7ed' : '#f0fdf4', border: fondsPct < 5 ? '#fed7aa' : '#bbf7d0', tooltip: "Réserve obligatoire pour financer les futurs travaux. La loi ALUR impose minimum 5% du budget annuel de la copropriété." });
  if (travaux_votes.length > 0) kpiItems.push({ emoji: '⚖️', label: 'Travaux charge vendeur', value: String(travaux_votes.filter((t: Record<string, unknown>) => t.charge_vendeur !== false).length || travaux_votes.length), sub: 'À vérifier notaire', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' });
  if (amiante_ac1) kpiItems.push({ emoji: '⚠️', label: 'Amiante AC1', value: 'Détecté', sub: 'Action corrective requise', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', tooltip: "Des matériaux amiantés nécessitant une action corrective ont été détectés dans les parties communes. Des travaux obligatoires sont à prévoir." });
  else if (participation.length > 0) kpiItems.push({ emoji: '📋', label: 'AG analysées', value: String(participation.length), sub: `sur ${participation.length} PV fourni${participation.length > 1 ? 's' : ''}` });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* BANDEAU VUE D'ENSEMBLE */}
      <div style={{ marginBottom: 16, marginTop: 6 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f2d3d', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99, letterSpacing: '0.06em' }}>🏢 VUE D'ENSEMBLE</span>
      </div>

      {/* KPIs — directement après le bandeau (SyndicBand retiré, déplacé dans accordéon Vie de la copro) */}
      {kpiItems.length > 0 && <KpiBand items={kpiItems} />}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button onClick={() => setAllOpen(v => !v)} style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          {allOpen ? 'Tout replier' : 'Tout déplier'}
        </button>
      </div>

      {/* ── VIE DE LA COPRO ── */}
      <AccordionSection
        title="Vie de la copropriété" sub="Syndic · lots · participation AG · résolutions" icon="🏢"
        defaultOpen={allOpen}
        status={syndic?.tensions_detectees ? 'warning' : 'neutral'}
        badge={participation.length > 0 ? `${participation.length} AG analysée${participation.length > 1 ? 's' : ''}` : 'Non disponible'}>

        {/* Carte Syndic (déplacée ici — tout ce qui concerne le syndic au même endroit) */}
        <SyndicBand syndic={syndic as Record<string, unknown> | null} />

        {/* Alerte tensions */}
        {syndic?.tensions_detectees && syndic.tensions_detail && (
          <div style={{ padding: '10px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>⚠ Tensions détectées au sein de la copropriété</div>
            <div style={{ fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>{safeStr(syndic.tensions_detail)}</div>
          </div>
        )}

        {/* Composition lots */}
        {nbLotsDetail && (nbLotsDetail.logements || nbLotsDetail.parkings || nbLotsDetail.caves) && (() => {
          const total = nbLotsTotal || ((nbLotsDetail.logements ?? 0) + (nbLotsDetail.parkings ?? 0) + (nbLotsDetail.caves ?? 0) + (nbLotsDetail.commerces ?? 0));
          const rows = [
            { icon: '🏠', label: 'Appartements', count: nbLotsDetail.logements, color: '#2a7d9c' },
            { icon: '🚗', label: 'Parkings', count: nbLotsDetail.parkings, color: '#64748b' },
            { icon: '📦', label: 'Caves', count: nbLotsDetail.caves, color: '#64748b' },
            { icon: '🏪', label: 'Commerces', count: nbLotsDetail.commerces, color: '#64748b' },
          ].filter(r => r.count);
          return (
            <div>
              <div style={{ background: '#2a7d9c', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 16 }}>🏠</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Composition de la copropriété</span>
                <TooltipBtn text="Répartition officielle des lots par type au sein de la copropriété." white={true} />
              </div>
              <div style={{ border: '1px solid #edf2f7', borderRadius: 10, overflow: 'hidden' }}>
                {rows.map((row, i) => {
                  const pct = total > 0 ? Math.round((row.count! / total) * 100) : 0;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>{row.icon}</span>
                      <span style={{ fontSize: 13, color: '#0f172a', width: 110, flexShrink: 0 }}>{row.label}</span>
                      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: row.color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: row.color, width: 26, textAlign: 'right', flexShrink: 0 }}>{row.count}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', width: 36, textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', background: '#f8fafc', fontSize: 12, fontWeight: 700 }}>
                  <span style={{ color: '#64748b' }}>Total</span>
                  <span style={{ color: '#0f172a' }}>{total} lots{nbBatiments ? ` · ${nbBatiments} bâtiment${nbBatiments > 1 ? 's' : ''}` : ''}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Participation AG */}
        {participation.length > 0 && (
          <div>
            <div style={{ background: '#2a7d9c', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
              <span style={{ fontSize: 16 }}>📊</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Participation aux assemblées générales</span>
            </div>
            {/* Tableau desktop */}
            <div className="ag-table-desktop" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Année', 'Présents / Représentés', 'Taux tantièmes', 'Quitus syndic', 'Note'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#64748b', borderBottom: '1px solid #edf2f7', fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {participation.map((p: ParticT, i: number) => {
                    const q = p.quitus;
                    const qLabel = !q || q.soumis === false ? null : q.approuve ? '✓ Approuvé' : '✗ Refusé';
                    const qColor = q?.approuve ? '#16a34a' : '#dc2626';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0f172a' }}>{safeStr(p.annee) ?? ''}</td>
                        <td style={{ padding: '9px 12px', color: '#374151' }}>{safeStr(p.copropietaires_presents_representes) ?? '—'}</td>
                        <td style={{ padding: '9px 12px', color: '#374151' }}>{safeStr(p.taux_tantiemes_pct) ?? '—'}</td>
                        <td style={{ padding: '9px 12px' }}>
                          {qLabel ? (
                            <div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: qColor, background: q?.approuve ? '#f0fdf4' : '#fef2f2', border: `1px solid ${q?.approuve ? '#bbf7d0' : '#fecaca'}`, padding: '2px 8px', borderRadius: 100 }}>{qLabel}</span>
                              {q?.detail && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{q.detail}</div>}
                            </div>
                          ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          {p.quorum_note && <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 100 }}>{safeStr(p.quorum_note)}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Cards mobiles AG */}
            <div className="ag-cards-mobile" style={{ display: 'none', flexDirection: 'column', gap: 8 }}>
              {participation.map((p: ParticT, i: number) => {
                const q = p.quitus;
                const qLabel = !q || q.soumis === false ? null : q.approuve ? '✓ Approuvé' : '✗ Refusé';
                const qColor = q?.approuve ? '#16a34a' : '#dc2626';
                const qBg = q?.approuve ? '#f0fdf4' : '#fef2f2';
                const qBorder = q?.approuve ? '#bbf7d0' : '#fecaca';
                return (
                  <div key={i} style={{ background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>AG {safeStr(p.annee)}</span>
                      {qLabel && <span style={{ fontSize: 11, fontWeight: 700, color: qColor, background: qBg, border: `1px solid ${qBorder}`, padding: '3px 10px', borderRadius: 100 }}>{qLabel}</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Présents / Représentés</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{safeStr(p.copropietaires_presents_representes) || '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Taux tantièmes</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{safeStr(p.taux_tantiemes_pct) || '—'}</div>
                      </div>
                    </div>
                    {p.quorum_note && (
                      <div style={{ padding: '8px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                        💬 {safeStr(p.quorum_note)}
                      </div>
                    )}
                    {q?.detail && <div style={{ marginTop: 6, fontSize: 11, color: '#dc2626', lineHeight: 1.5 }}>{q.detail}</div>}
                  </div>
                );
              })}
            </div>
            {quitusRefuse && (
              <div style={{ marginTop: 8, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 12, color: '#991b1b', lineHeight: 1.6 }}>
                <strong>Quitus refusé détecté.</strong> Le quitus est le vote par lequel les copropriétaires approuvent la gestion financière du syndic. Un refus traduit une méfiance ou un désaccord sur sa gestion — à surveiller.
              </div>
            )}
          </div>
        )}

        {/* Questions diverses */}
        {(vie?.questions_diverses_notables ?? []).length > 0 && (
          <div>
            <div style={{ background: '#2a7d9c', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: 8 }}>
              <span style={{ fontSize: 16 }}>💬</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Questions diverses notables</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(vie?.questions_diverses_notables ?? []).map((q, i, arr) => {
                const obj = typeof q === 'object' && q !== null ? q as Record<string, unknown> : null;
                const label = obj ? safeStr(obj.label || obj.detail || q) : safeStr(q);
                const detail = obj?.detail && obj.label ? safeStr(obj.detail) : null;
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2a7d9c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', lineHeight: 1.55 }}>{label}</div>
                      {detail && <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>{detail}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!syndic?.nom && participation.length === 0 && (
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Uploadez des PV d'AG pour obtenir ces informations.</p>
        )}
      </AccordionSection>

      {/* ── RÈGLES DE LA COPROPRIÉTÉ (RCP) ── */}
      {reglesCopro.length > 0 && (
        <AccordionSection
          title="Règles de la copropriété" sub="Règlement de copropriété · usages · restrictions" icon="📜"
        defaultOpen={allOpen}
          status="neutral" badge={`${reglesCopro.length} règle${reglesCopro.length > 1 ? 's' : ''}`}
          tooltip="Règles issues du Règlement de Copropriété (RCP) — le document fondateur qui définit ce qui est autorisé ou interdit dans la résidence.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(() => {
              const getRcpEmoji = (label: string): string => {
                const l = (label || '').toLowerCase();
                if (l.includes('animal') || l.includes('chien') || l.includes('chat') || l.includes('nac')) return '🐾';
                if (l.includes('location') || l.includes('louer') || l.includes('locataire') || l.includes('airbnb') || l.includes('meublé')) return '🔑';
                if (l.includes('travaux') || l.includes('modification') || l.includes('percer') || l.includes('aménag')) return '🔨';
                if (l.includes('façade') || l.includes('extérieur') || l.includes('fenêtre') || l.includes('volet') || l.includes('balcon') || l.includes('store')) return '🪟';
                if (l.includes('parking') || l.includes('stationnement') || l.includes('garage') || l.includes('véhicule') || l.includes('voiture')) return '🚗';
                if (l.includes('occupation') || l.includes('bourgeois') || l.includes('commercial') || l.includes('profession') || l.includes('activité')) return '🏠';
                if (l.includes('ordure') || l.includes('poubelle') || l.includes('déchet') || l.includes('tri')) return '🗑️';
                if (l.includes('bruit') || l.includes('nuisance') || l.includes('sonore') || l.includes('tapage')) return '🔇';
                if (l.includes('cave') || l.includes('grenier') || l.includes('stockage')) return '📦';
                if (l.includes('ascenseur')) return '🛗';
                if (l.includes('jardin') || l.includes('cour') || l.includes('terrasse') || l.includes('espace vert')) return '🌿';
                if (l.includes('antenne') || l.includes('satellite') || l.includes('fibre')) return '📡';
                if (l.includes('enseigne') || l.includes('affiche') || l.includes('publicité')) return '📢';
                return '📜';
              };
              return reglesCopro.map((r: RegleT, i: number) => {
                const color = r.statut === 'interdit' ? '#dc2626' : r.statut === 'autorise' ? '#16a34a' : '#d97706';
                const bg = r.statut === 'interdit' ? '#fef2f2' : r.statut === 'autorise' ? '#f0fdf4' : '#fff7ed';
                const border = r.statut === 'interdit' ? '#fecaca' : r.statut === 'autorise' ? '#bbf7d0' : '#fed7aa';
                const badgeLabel = r.statut === 'interdit' ? '✗ Interdit' : r.statut === 'autorise' ? '✓ Autorisé' : '~ Sous conditions';
                const iconBg = r.statut === 'interdit' ? '#fef2f2' : r.statut === 'autorise' ? '#f0fdf4' : '#fff7ed';
                const iconBorder = r.statut === 'interdit' ? '#fecaca' : r.statut === 'autorise' ? '#bbf7d0' : '#fed7aa';
                const emoji = getRcpEmoji(safeStr(r.label));
                return (
                  <div key={i} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.5, marginBottom: 6 }}>{safeStr(r.label)}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, alignItems: 'center' }}>
                        {r.impact_rp && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>Vie quotidienne</span>}
                        {r.impact_invest && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: '#fdf4ff', color: '#7e22ce', border: '1px solid #e9d5ff' }}>Location</span>}
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: bg, color, border: `1px solid ${border}` }}>{badgeLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </AccordionSection>
      )}

      {/* ── DTG / PPT ── */}
      {dtg?.present && (
        <AccordionSection
          title="Plan pluriannuel de travaux" sub="DTG · PPT · état général de l'immeuble" icon="🏗"
        defaultOpen={allOpen}
          status={dtg.etat_general === 'degrade' ? 'alert' : dtg.etat_general === 'moyen' ? 'warning' : 'ok'}
          badge={dtg.etat_general === 'degrade' ? 'Dégradé' : dtg.etat_general === 'moyen' ? 'Moyen' : dtg.etat_general === 'bon' ? 'Bon état' : 'Présent'}
          tooltip="Le DTG (Diagnostic Technique Global) ou PPT (Plan Pluriannuel de Travaux) liste les travaux à prévoir sur 10 ans avec leur coût estimé. Document obligatoire pour les copropriétés de plus de 10 ans.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 10, marginBottom: 12 }}>
            {dtg.budget_urgent_3ans && (
              <div style={{ padding: 14, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>{dtg.budget_urgent_3ans.toLocaleString('fr-FR')} €</div>
                <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 4 }}>Travaux urgents (3 ans)</div>
              </div>
            )}
            {dtg.budget_total_10ans && (
              <div style={{ padding: 14, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#d97706' }}>{dtg.budget_total_10ans.toLocaleString('fr-FR')} €</div>
                <div style={{ fontSize: 11, color: '#a16207', marginTop: 4 }}>Budget total (10 ans)</div>
              </div>
            )}
            {dtg.etat_general && (
              <div style={{ padding: 14, background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: dtg.etat_general === 'bon' ? '#16a34a' : dtg.etat_general === 'moyen' ? '#d97706' : '#dc2626' }}>
                  {dtg.etat_general === 'bon' ? '✓ Bon' : dtg.etat_general === 'moyen' ? '~ Moyen' : '⚠ Dégradé'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>État général immeuble</div>
              </div>
            )}
          </div>
          {(dtg.travaux_prioritaires ?? []).length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Travaux prioritaires identifiés</div>
              {dtg.travaux_prioritaires!.map((t, i) => (
                <div key={i} style={{ fontSize: 13, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, marginBottom: 4, border: '1px solid #fecaca', color: '#991b1b' }}>• {safeStr(t)}</div>
              ))}
            </div>
          )}
        </AccordionSection>
      )}

      {/* ── TRAVAUX ── */}
      <AccordionSection
        title="Travaux" sub="Réalisés · votés · évoqués" icon="🔨"
        defaultOpen={allOpen}
        status={travaux_evoques.length > 0 ? 'warning' : travaux_votes.length > 0 ? 'ok' : 'ok'}
        badge={travaux_evoques.length > 0 ? `${travaux_evoques.length} vigilance${travaux_evoques.length > 1 ? 's' : ''}` : `${travaux_realises.length + travaux_votes.length} détectés`}
        tooltip="✅ Réalisés — déjà effectués, intégrés à l'immeuble.|🗳 Votés — décidés en AG. S'ils l'ont été avant le compromis, c'est la charge du vendeur.|⚠️ Évoqués — mentionnés sans vote. Si le vote a lieu après votre achat, vous en paierez une part.">

        {travaux_votes.length > 0 && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', fontSize: 14, color: '#991b1b', lineHeight: 1.6 }}>
            <strong>⚖️ Travaux votés avant le compromis = charge du vendeur.</strong> Tout travail voté en AG avant la signature de votre compromis de vente est légalement à la charge du vendeur, même si les appels interviennent après. Vérifiez avec votre notaire.
          </div>
        )}

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
            <div style={{ padding: '8px 12px', background: '#fff7ed', borderRadius: 8, border: '1px solid #fed7aa', marginBottom: 8, fontSize: 13, color: '#92400e' }}>
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

      {/* ── FINANCES ── */}
      <AccordionSection
        title="Finances" sub="Budget copro · fonds travaux · historique" icon="💰"
        defaultOpen={allOpen}
        status={fondsInsuffisant ? 'warning' : 'ok'}
        badge={rapport.fonds_travaux_statut === 'conforme' ? 'Sain' : rapport.fonds_travaux_statut === 'insuffisant' ? 'Vigilance' : rapport.fonds_travaux_statut === 'absent' ? 'Absent' : 'Détecté'}>



        {/* Titre coloré budget copro */}
        <div style={{ background: '#2a7d9c', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>📊</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Budget de la copropriété</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
          {budgetNum > 0 && (
            <div style={{ padding: 14, background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', textAlign: 'center' }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{budgetNum.toLocaleString('fr-FR')} €</div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                Budget annuel copropriété{budgetAnnee ? ` — ${budgetAnnee}` : ''}
              </div>
            </div>
          )}
          {fondsNum > 0 && (
            <div style={{ padding: 14, background: fondsInsuffisant ? '#fff7ed' : '#f0fdf4', borderRadius: 10, border: `1px solid ${fondsInsuffisant ? '#fed7aa' : '#bbf7d0'}`, textAlign: 'center' }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: fondsInsuffisant ? '#a16207' : '#16a34a', marginBottom: 3 }}>{fondsNum.toLocaleString('fr-FR')} €</div>
              <div style={{ fontSize: 11, color: fondsInsuffisant ? '#a16207' : '#16a34a', fontWeight: 600 }}>
                <Tooltip text="Réserve obligatoire de la copropriété pour financer les futurs travaux. La loi ALUR impose minimum 5% du budget annuel.">Fonds travaux copro</Tooltip>
                {fondsPct && ` — ${fondsPct.toFixed(1)}%`}
                {fondsAnnee && ` (${fondsAnnee})`}
              </div>
            </div>
          )}
        </div>

        {/* Barre fonds travaux */}
        {fondsPct !== null && budgetNum > 0 && (
          <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
              <span>Fonds travaux actuel — {fondsPct.toFixed(1)}%</span>
              <span style={{ color: '#16a34a' }}>Seuil légal ALUR — 5%</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: '#edf2f7', overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${Math.min((fondsPct / 10) * 100, 100)}%`, height: '100%', background: fondsInsuffisant ? '#d97706' : '#16a34a', borderRadius: 5 }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: '#16a34a', opacity: 0.6 }} />
            </div>
            {fondsInsuffisant && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#a16207' }}>
                La loi ALUR impose minimum 5% ({Math.round(budgetNum * 0.05).toLocaleString('fr-FR')} € requis). Un fonds insuffisant peut entraîner des <strong>appels de fonds exceptionnels imprévus</strong>.
              </div>
            )}
          </div>
        )}

        {/* Historique budgets */}
        {(() => {
          const hist = fin?.budgets_historique as Array<{ annee: string; budget_total: number; fonds_travaux?: number }> | null;
          if (!hist || hist.length < 2) return null;
          const sorted = [...hist].sort((a, b) => String(a.annee).localeCompare(String(b.annee)));
          const max = Math.max(...sorted.map(r => r.budget_total));
          return (
            <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', overflow: 'hidden' }}>
              <div style={{ background: '#2a7d9c', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>📈</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>Historique budgets votés en AG</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', marginLeft: 4 }}>source : PV d'AG</span>
              </div>
              {sorted.map((row, i) => {
                const prev = i > 0 ? sorted[i - 1] : null;
                const evol = prev && prev.budget_total > 0 ? ((row.budget_total - prev.budget_total) / prev.budget_total * 100) : null;
                const pct = max > 0 ? (row.budget_total / max) * 100 : 0;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < sorted.length - 1 ? '1px solid #f1f5f9' : 'none', background: i === sorted.length - 1 ? '#f0f7ff' : 'transparent' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === sorted.length - 1 ? '#2a7d9c' : '#0f172a', width: 42, flexShrink: 0 }}>{row.annee}</span>
                    <div style={{ flex: 1, height: 8, background: '#edf2f7', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: i === sorted.length - 1 ? '#2a7d9c' : '#94a3b8', borderRadius: 4, opacity: 0.7 + i * 0.15 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === sorted.length - 1 ? '#2a7d9c' : '#0f172a', width: 100, textAlign: 'right', flexShrink: 0 }}>{row.budget_total.toLocaleString('fr-FR')} €</span>
                    <span style={{ fontSize: 11, width: 36, textAlign: 'right', flexShrink: 0, color: evol !== null ? (evol > 5 ? '#dc2626' : evol > 0 ? '#d97706' : '#16a34a') : '#94a3b8', fontWeight: evol !== null ? 700 : 400 }}>
                      {evol !== null ? `${evol > 0 ? '+' : ''}${evol.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Appels de fonds exceptionnels */}
        {(vie?.appels_fonds_exceptionnels?.length ?? 0) > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 6 }}>
              <Tooltip text="Somme demandée aux copropriétaires en dehors des charges habituelles, souvent pour financer des travaux imprévus.">⚠ Appels de fonds exceptionnels votés en AG</Tooltip>
            </div>
            {vie!.appels_fonds_exceptionnels!.map((a, i) => {
              const obj = typeof a === 'string' ? { motif: a } : a as Record<string, unknown>;
              const montant: number | null = typeof obj.montant_total === 'number' ? obj.montant_total : typeof obj.montant === 'number' ? obj.montant : null;
              return (
                <div key={i} style={{ fontSize: 14, color: '#92400e', padding: '9px 12px', background: '#fffbeb', borderRadius: 8, marginBottom: 6, border: '1px solid #fde68a', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>• {String(obj.motif ?? obj.description ?? obj.libelle ?? 'Appel de fonds exceptionnel')}</div>
                  {montant !== null && <div style={{ fontSize: 11, color: '#d97706' }}>Montant total copro : {montant.toLocaleString('fr-FR')} €</div>}
                  {obj.date != null && <div style={{ fontSize: 11, color: '#b45309' }}>Date : {String(obj.date)}</div>}
                </div>
              );
            })}
          </div>
        )}
      </AccordionSection>

      {/* ── CARNET D'ENTRETIEN ── */}
      {(() => {
        type EquipT = { chauffage_collectif?: boolean | null; type_chauffage?: string | null; eau_chaude_collective?: boolean | null; eau_froide_collective?: boolean | null; fibre_optique?: boolean | null; ascenseur?: boolean | null };
        type ContratT = { equipement?: string | null; prestataire?: string | null; periodicite?: string | null; date_reconduction?: string | null };
        type TravRealT = { annee?: string | number | null; label?: string | null; entreprise?: string | null; montant?: number | null };
        type TravEnCoursT = { label?: string | null; date_ag?: string | null; montant?: number | null };
        type DiagPCT = { type?: string | null; date?: string | null; entreprise?: string | null; resultat?: string | null; commentaire?: string | null };
        type CSCarnT = { date_nomination?: string | null; nb_membres?: number | null };
        type CarnetT = {
          present?: boolean; date_maj?: string | null; immatriculation_registre?: string | null;
          equipements_copro?: EquipT;
          contrats_entretien?: ContratT[];
          travaux_realises_carnet?: TravRealT[];
          travaux_en_cours_votes_carnet?: TravEnCoursT[];
          diagnostics_parties_communes_carnet?: DiagPCT[];
          conseil_syndical_carnet?: CSCarnT;
        };
        const vieCopro = rapport.vie_copropriete as Record<string, unknown> | null;
        const carnet = vieCopro?.carnet_entretien as CarnetT | null;
        if (!carnet?.present) return null;

        const equip = carnet.equipements_copro || {};
        const contrats = carnet.contrats_entretien || [];
        const travauxReal = carnet.travaux_realises_carnet || [];
        const travauxEnCours = carnet.travaux_en_cours_votes_carnet || [];
        const diagsPC = carnet.diagnostics_parties_communes_carnet || [];

        return (
          <AccordionSection
            title="Carnet d'entretien" sub="Équipements · contrats · travaux · diagnostics communs" icon="📓"
            defaultOpen={allOpen}
            status="neutral"
            badge={carnet.date_maj ? `MAJ ${carnet.date_maj}` : 'Détecté'}>

            {/* Immatriculation registre */}
            {carnet.immatriculation_registre && (
              <div style={{ padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, fontSize: 13, color: '#075985' }}>
                <strong>N° registre national :</strong> {carnet.immatriculation_registre}
              </div>
            )}

            {/* Équipements copro */}
            {(equip.chauffage_collectif !== null || equip.ascenseur !== null || equip.fibre_optique !== null) && (
              <>
                <SectionTitle emoji="⚙️" text="Équipements de l'immeuble" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {equip.chauffage_collectif === true && (
                    <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 100, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
                      🔥 Chauffage collectif{equip.type_chauffage ? ` (${equip.type_chauffage})` : ''}
                    </span>
                  )}
                  {equip.eau_chaude_collective === true && (
                    <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 100, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>💧 Eau chaude collective</span>
                  )}
                  {equip.eau_froide_collective === true && (
                    <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 100, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>💦 Eau froide collective</span>
                  )}
                  {equip.ascenseur === true && (
                    <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 100, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>🛗 Ascenseur</span>
                  )}
                  {equip.fibre_optique === true && (
                    <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 100, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>🌐 Fibre optique</span>
                  )}
                </div>
              </>
            )}

            {/* Contrats d'entretien */}
            {contrats.length > 0 && (
              <>
                <SectionTitle emoji="📑" text={`Contrats d'entretien (${contrats.length})`} />
                <div style={{ background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', overflow: 'hidden' }}>
                  {contrats.map((c, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderBottom: i < contrats.length - 1 ? '1px solid #f1f5f9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{c.equipement}</div>
                        {c.prestataire && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{c.prestataire}</div>}
                      </div>
                      {(c.date_reconduction || c.periodicite) && (
                        <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'right', flexShrink: 0 }}>
                          {c.date_reconduction && <div>Reconduit le {c.date_reconduction}</div>}
                          {c.periodicite && <div>{c.periodicite}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Travaux votés en cours (depuis carnet) */}
            {travauxEnCours.length > 0 && (
              <>
                <SectionTitle emoji="🔨" text="Travaux votés en AG (mentionnés dans le carnet)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {travauxEnCours.map((t, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, fontSize: 13, color: '#92400e' }}>
                      <div style={{ fontWeight: 500 }}>{t.label}</div>
                      {(t.date_ag || t.montant) && (
                        <div style={{ fontSize: 12, marginTop: 3, color: '#b45309' }}>
                          {t.date_ag && `Voté le ${t.date_ag}`}
                          {t.date_ag && t.montant && ' — '}
                          {t.montant && `Budget ${t.montant.toLocaleString('fr-FR')} €`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Travaux réalisés (historique) */}
            {travauxReal.length > 0 && (
              <>
                <SectionTitle emoji="✅" text={`Travaux réalisés (${travauxReal.length})`} />
                <div style={{ background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0', overflow: 'hidden' }}>
                  {travauxReal.map((t, i) => (
                    <div key={i} style={{ padding: '9px 14px', borderBottom: i < travauxReal.length - 1 ? '1px solid #dcfce7' : 'none', display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#166534' }}>
                      {t.annee && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', background: '#dcfce7', borderRadius: 99, flexShrink: 0 }}>{t.annee}</span>}
                      <div style={{ flex: 1 }}>
                        <div>{t.label}</div>
                        {(t.entreprise || t.montant) && (
                          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>
                            {t.entreprise}
                            {t.entreprise && t.montant && ' — '}
                            {t.montant && `${t.montant.toLocaleString('fr-FR')} €`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Diagnostics parties communes (depuis carnet) */}
            {diagsPC.length > 0 && (
              <>
                <SectionTitle emoji="🔍" text="Diagnostics parties communes (mentionnés dans le carnet)" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {diagsPC.map((d, i) => {
                    const bg = d.resultat === 'positif' ? '#fef2f2' : d.resultat === 'negatif' ? '#f0fdf4' : '#f8fafc';
                    const border = d.resultat === 'positif' ? '#fecaca' : d.resultat === 'negatif' ? '#bbf7d0' : '#edf2f7';
                    const emoji = d.type === 'amiante' ? '☣' : d.type === 'plomb' ? '🧱' : d.type === 'termites' ? '🐛' : d.type === 'ascenseur' ? '🛗' : '📋';
                    return (
                      <div key={i} style={{ padding: '9px 14px', background: bg, border: `1px solid ${border}`, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13 }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{d.type}</div>
                          {(d.date || d.entreprise) && (
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                              {d.date && `Rapport du ${d.date}`}
                              {d.date && d.entreprise && ' — '}
                              {d.entreprise}
                            </div>
                          )}
                          {d.commentaire && <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{d.commentaire}</div>}
                        </div>
                        {d.resultat && (
                          <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, background: '#fff', border: `1px solid ${border}`, color: '#475569', flexShrink: 0 }}>
                            {d.resultat === 'negatif' ? 'Négatif' : d.resultat === 'positif' ? 'Positif' : 'Non effectué'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

          </AccordionSection>
        );
      })()}

      {/* ── MODIFICATIFS RCP ── */}
      {(() => {
        type ModifT = {
          date_acte?: string | null; notaire?: string | null; type_modification?: string | null;
          sur_quoi_porte?: { aspect?: string; detail?: string }[];
          impact_acheteur?: string | null;
          points_attention?: { label?: string; detail?: string }[];
        };
        const vieCopro = rapport.vie_copropriete as Record<string, unknown> | null;
        const modifs = (vieCopro?.modificatifs_rcp as ModifT[] | null) || [];
        if (modifs.length === 0) return null;

        const labelsType: Record<string, string> = {
          creation_lot: 'Création de lot',
          suppression_lot: 'Suppression de lot',
          changement_usage: "Changement d'usage",
          mise_a_jour_tantiemes: 'Mise à jour des tantièmes',
          servitude: 'Servitude',
          fusion_lots: 'Fusion de lots',
          autre: 'Modification',
        };

        return (
          <AccordionSection
            title="Modificatifs du règlement" sub={`${modifs.length} modificatif${modifs.length > 1 ? 's' : ''} détecté${modifs.length > 1 ? 's' : ''}`} icon="📜"
            defaultOpen={allOpen}
            status="neutral"
            badge={`${modifs.length} acte${modifs.length > 1 ? 's' : ''}`}>

            <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 10, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
              Le règlement de copropriété peut être modifié au fil du temps par des actes notariés (changement d'usage, fusion de lots, servitudes…). Voici ce qui a été détecté.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {modifs.map((m, i) => (
                <div key={i} style={{ padding: '14px 16px', background: '#fff', border: '1px solid #edf2f7', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        {m.type_modification ? (labelsType[m.type_modification] || labelsType.autre) : labelsType.autre}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                        {m.date_acte && `Acte du ${m.date_acte}`}
                        {m.date_acte && m.notaire && ' — '}
                        {m.notaire}
                      </div>
                    </div>
                  </div>

                  {m.sur_quoi_porte && m.sur_quoi_porte.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 6 }}>CE QUI CHANGE</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {m.sur_quoi_porte.map((s, j) => (
                          <div key={j} style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                            {s.aspect && <strong>{s.aspect}{s.detail ? ' : ' : ''}</strong>}
                            {s.detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.impact_acheteur && (
                    <div style={{ padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 9, fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
                      <strong>Impact pour vous : </strong>{m.impact_acheteur}
                    </div>
                  )}

                  {m.points_attention && m.points_attention.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {m.points_attention.map((p, j) => (
                        <div key={j} style={{ padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 9, fontSize: 12, color: '#9a3412' }}>
                          <strong>⚠ {p.label}{p.detail ? ' : ' : ''}</strong>{p.detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionSection>
        );
      })()}

      {/* ── FICHE SYNTHÉTIQUE ── */}
      {(() => {
        type FicheT = {
          present?: boolean; date?: string | null; fiche_recente?: boolean | null;
          immatriculation_registre?: string | null;
          dtg_realise?: boolean | null; dtg_date?: string | null;
          equipements_collectifs_detail?: string[];
        };
        const vieCopro = rapport.vie_copropriete as Record<string, unknown> | null;
        const fiche = vieCopro?.fiche_synthetique as FicheT | null;
        if (!fiche?.present) return null;

        return (
          <AccordionSection
            title="Fiche synthétique de copropriété" sub="Document standardisé loi ALUR" icon="📋"
            defaultOpen={false}
            status={fiche.fiche_recente === false ? 'warning' : 'neutral'}
            badge={fiche.date ? (fiche.fiche_recente === false ? `Ancienne (${fiche.date})` : fiche.date) : 'Détectée'}>

            {fiche.fiche_recente === false && (
              <div style={{ padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, fontSize: 13, color: '#9a3412', lineHeight: 1.6 }}>
                ⚠ Cette fiche synthétique date de {fiche.date}. Certaines informations peuvent être obsolètes — les données financières et syndic sont prioritaires depuis les PV d'AG plus récents.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fiche.immatriculation_registre && (
                <div style={{ padding: '10px 14px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, fontSize: 13, color: '#075985' }}>
                  <strong>N° registre national :</strong> {fiche.immatriculation_registre}
                </div>
              )}

              {fiche.dtg_realise !== null && fiche.dtg_realise !== undefined && (
                <div style={{ padding: '10px 14px', background: fiche.dtg_realise ? '#f0fdf4' : '#f8fafc', border: `1px solid ${fiche.dtg_realise ? '#bbf7d0' : '#edf2f7'}`, borderRadius: 10, fontSize: 13, color: fiche.dtg_realise ? '#166534' : '#475569' }}>
                  <strong>DTG (Diagnostic Technique Global) : </strong>
                  {fiche.dtg_realise ? `Réalisé${fiche.dtg_date ? ` le ${fiche.dtg_date}` : ''}` : 'Non réalisé'}
                </div>
              )}

              {fiche.equipements_collectifs_detail && fiche.equipements_collectifs_detail.length > 0 && (
                <>
                  <SectionTitle emoji="⚙️" text="Équipements collectifs" />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {fiche.equipements_collectifs_detail.map((e, i) => (
                      <span key={i} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 99, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>{e}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </AccordionSection>
        );
      })()}

      {/* ── DIAGNOSTICS PARTIES COMMUNES ── */}
      <AccordionSection
        title="Diagnostics parties communes" sub="Amiante · plomb · termites · ERP" icon="📋"
        defaultOpen={allOpen}
        status={hasDiagAlert ? 'alert' : diagsCommuns.length > 0 ? 'ok' : 'neutral'}
        badge={amiante_ac1 ? 'Amiante AC1 !' : hasDiagAlert ? 'Alerte' : diagsCommuns.length > 0 ? `${diagsCommuns.length} détecté${diagsCommuns.length > 1 ? 's' : ''}` : 'Non détectés'}>

        {amiante_ac1 && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 14, color: '#991b1b', lineHeight: 1.6 }}>
            <strong>⚠ Amiante AC1 détecté dans les parties communes.</strong> Des matériaux amiantés nécessitent une action corrective (AC1). Des travaux de désamiantage ou de confinement sont à prévoir dans les parties communes. Renseignez-vous sur le calendrier et le budget prévu.
          </div>
        )}

        {diagsCommuns.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {diagsCommuns.map((d: Record<string, unknown>, i: number) => <DiagRow key={i} d={d} />)}
          </div>
        )}

        <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <Info size={13} style={{ color: '#64748b', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            {diagsCommuns.length === 0
              ? "Aucun diagnostic parties communes dans les documents fournis. Vérifiez auprès du vendeur si l'immeuble dispose de :"
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
function SectionTitle({ emoji, text, tooltip }: { emoji: string; text: string; tooltip?: string }) {
  return (
    <div className="section-title-bar" style={{ background: '#2a7d9c', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{text}</span>
      {tooltip && <TooltipBtn text={tooltip} white={true} />}
    </div>
  );
}

function TabLogement({ rapport, onSwitchTab }: { rapport: RapportData; onSwitchTab?: (tab: TabId) => void }) {
  const [allOpen, setAllOpen] = useState(false);
  type LotT2 = {
    quote_part_tantiemes?: string; fonds_travaux_alur?: string;
    parties_privatives?: unknown[]; restrictions_usage?: string[];
    travaux_votes_charge_vendeur?: unknown[]; impayes_detectes?: string;
    points_specifiques?: string[];
  };
  type TaxeT = { montant_total?: number; montant_mensuel?: number; evolution_pct?: number; montant_precedent?: number; annee?: number };
  type CompromisT = {
    vendeur?: string; acheteur?: string; notaire_acheteur?: string; notaire_vendeur?: string; agence?: string;
    prix_net_vendeur?: number; honoraires_agence?: number; honoraires_charge?: string; prix_total?: number;
    depot_garantie?: number; depot_sequestre?: number;
    date_signature?: string; date_acte?: string; bien_libre_a?: string;
    conditions_suspensives?: Array<{ label?: string; detail?: string; date_limite?: string; statut?: string }>;
    clauses_particulieres?: string[];
    financement?: { apport?: number; montant_pret?: number; etablissement?: string };
    bien?: { surface_carrez?: number; type?: string; annexes?: string[] };
  };

  const lot = rapport.lot_achete as LotT2 | null;
  const fin = rapport.finances as Record<string, unknown> | null;
  const chargesLot = fin?.charges_annuelles_lot;
  const chargesLotNum = typeof chargesLot === 'number' ? chargesLot : typeof chargesLot === 'string' ? parseFloat(String(chargesLot).replace(/[^0-9.]/g, '')) || 0 : 0;
  const chargesMensuellesLot = chargesLotNum > 0 ? Math.round(chargesLotNum / 12) : 0;

  // Taxe foncière depuis rapport.finances ou documents_analyses
  const taxeFonciereRaw = (rapport as Record<string, unknown>).taxe_fonciere as TaxeT | number | string | null;
  const taxeAnnuelle = typeof taxeFonciereRaw === 'number' ? taxeFonciereRaw
    : typeof taxeFonciereRaw === 'object' && taxeFonciereRaw !== null ? (taxeFonciereRaw as TaxeT).montant_total ?? null
    : typeof taxeFonciereRaw === 'string' ? parseFloat(taxeFonciereRaw.replace(/[^0-9.]/g, '')) || null : null;
  const taxeMensuelle = taxeAnnuelle ? Math.round(taxeAnnuelle / 12) : null;
  const taxeEvol = typeof taxeFonciereRaw === 'object' && taxeFonciereRaw !== null ? (taxeFonciereRaw as TaxeT).evolution_pct ?? null : null;
  const taxePrecedent = typeof taxeFonciereRaw === 'object' && taxeFonciereRaw !== null ? (taxeFonciereRaw as TaxeT).montant_precedent ?? null : null;

  // Compromis
  const docsAnalyses = (rapport as Record<string, unknown>).documents_analyses as Array<Record<string, unknown>> || [];
  const compromisDoc = docsAnalyses.find(d => safeStr(d.type) === 'COMPROMIS');
  const compromis = (rapport as Record<string, unknown>).compromis as CompromisT | null;

  // DPE
  const diagsPriv = rapport.diagnostics.filter((d: Record<string, unknown>) => d.perimetre === 'lot_privatif');
  const dpe = diagsPriv.find((d: Record<string, unknown>) => d.type === 'DPE') as Record<string, unknown> | undefined;
  const autresDiags = diagsPriv
    .filter((d: Record<string, unknown>) => d.type !== 'DPE' && d.type !== 'CARREZ')
    .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const score = (d: Record<string, unknown>) =>
        d.alerte ? 3 : d.presence === 'detecte' && !d.alerte ? 1 : d.type === 'ERP' ? 0 : -1;
      return score(b) - score(a);
    });

  const resultatStr = dpe ? safeStr(dpe.resultat) : '';
  const dpeClasse = resultatStr?.match(/Classe\s*([A-G])/i)?.[1]?.toUpperCase() ?? null;
  const dpeGesClasse = resultatStr?.match(/GES[^A-G]*Classe\s*([A-G])/i)?.[1]?.toUpperCase() ?? null;
  const dpeKwh = resultatStr?.match(/([\d,.]+)\s*kWh/i)?.[1] ?? null;
  const dpeGes = resultatStr?.match(/([\d,.]+)\s*kg/i)?.[1] ?? null;
  const dpeBad = dpeClasse && ['F', 'G'].includes(dpeClasse);
  const dpeGood = dpeClasse && ['A', 'B', 'C'].includes(dpeClasse);
  const hasDiagAlert = autresDiags.some((d: Record<string, unknown>) => d.alerte);

  const DPE_COLORS: Record<string, string> = { A: '#16a34a', B: '#22c55e', C: '#84cc16', D: '#eab308', E: '#f97316', F: '#ef4444', G: '#991b1b' };
  const DPE_CLASSES = ['A','B','C','D','E','F','G'];

  // Fonds travaux ALUR
  const fondsAlurRaw = lot?.fonds_travaux_alur;
  const fondsAlurNum = fondsAlurRaw ? (isNaN(Number(String(fondsAlurRaw).replace(/[^0-9.]/g, ''))) ? null : Number(String(fondsAlurRaw).replace(/[^0-9.]/g, ''))) : null;

  // Travaux évoqués (pour rappel)
  const travauxEvoques = rapport.travaux_a_prevoir ?? [];

  // Restrictions usage
  const restrictions = ((lot?.restrictions_usage as string[]) ?? []).filter(
    r => !safeStr(r).toLowerCase().includes('aucune restriction') && !safeStr(r).toLowerCase().includes('règlement copropriété complet non fourni')
  );

  // KPIs bandeau
  const kpiItems: { emoji: string; label: string; value: string; sub?: string; color?: string; bg?: string; border?: string; tooltip?: string }[] = [];
  if (dpeClasse) kpiItems.push({ emoji: '⚡', label: 'Performance énergétique', value: `Classe ${dpeClasse}`, sub: dpeKwh ? `${dpeKwh} kWh/m²/an` : undefined, color: DPE_COLORS[dpeClasse], bg: `${DPE_COLORS[dpeClasse]}12`, border: `${DPE_COLORS[dpeClasse]}44`, tooltip: "Classe énergétique du logement. A = très performant, G = passoire thermique. F et G seront progressivement interdits à la location." });
  if (chargesMensuellesLot > 0) kpiItems.push({ emoji: '💶', label: 'Charges mensuelles lot', value: `${chargesMensuellesLot.toLocaleString('fr-FR')} €`, sub: `${chargesLotNum.toLocaleString('fr-FR')} €/an`, color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', tooltip: "Charges de copropriété annuelles de votre lot divisées par 12." });
  if (taxeMensuelle) kpiItems.push({ emoji: '🏛', label: 'Taxe foncière', value: `${taxeMensuelle.toLocaleString('fr-FR')} €/mois`, sub: taxeAnnuelle ? `${taxeAnnuelle.toLocaleString('fr-FR')} €/an` : undefined, tooltip: "Impôt local annuel dû par le propriétaire, calculé sur la valeur locative cadastrale." });
  // Tantièmes : affiché dans "Votre lot", pas dans KPI (trop long)
  // Surface Carrez depuis diagnostics
  const carrezDiag = diagsPriv.find((d: Record<string, unknown>) => d.type === 'CARREZ') as Record<string, unknown> | undefined;
  const carrezSurface = carrezDiag ? safeStr(carrezDiag.resultat)?.match(/([\d,\.]+)\s*m²/i)?.[1] : null;
  if (carrezSurface) kpiItems.push({ emoji: '🏠', label: 'Surface Carrez', value: `${carrezSurface} m²`, sub: 'surface privative officielle', tooltip: "Surface mesurée selon la loi Carrez. Si la surface réelle est inférieure de plus de 5% à celle du compromis, vous pouvez demander une réduction du prix." });
  if (fondsAlurNum) kpiItems.push({ emoji: '💰', label: 'Fonds travaux ALUR', value: `${fondsAlurNum.toLocaleString('fr-FR')} €`, sub: 'À rembourser au vendeur', color: '#d97706', bg: '#fff7ed', border: '#fed7aa', tooltip: "Ce montant est attaché au lot. Il vous sera transféré mais vous devrez le rembourser au vendeur en sus du prix de vente." });

  // Purge conditions suspensives
  const today = new Date();
  const joursRestants = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const TOOLTIPS_CS: Record<string, string> = {
    pret: "Vous devez obtenir votre accord de prêt bancaire avant la date limite. Sans accord obtenu dans les délais, vous pouvez vous rétracter et récupérer votre dépôt de garantie intégralement.",
    preemption: "La mairie dispose d'un droit de préemption urbain (DPU) : elle peut se substituer à l'acheteur pour acquérir le bien au même prix. Ce droit expire généralement 2 mois après la DIA déposée en mairie.",
    vente: "L'achat est conditionné à la vente préalable d'un bien appartenant à l'acheteur. Si la vente ne se réalise pas dans les délais, l'acheteur peut se rétracter sans pénalité.",
    permis: "Un permis de construire ou d'aménager doit être obtenu avant la date limite pour que la vente soit définitive.",
    default: "Condition dont la réalisation est nécessaire pour que la vente soit définitive. Si elle n'est pas remplie dans les délais, l'acheteur peut se rétracter sans pénalité.",
  };

  const getCSTooltip = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('prêt') || l.includes('pret') || l.includes('financement')) return TOOLTIPS_CS.pret;
    if (l.includes('préemption') || l.includes('preemption')) return TOOLTIPS_CS.preemption;
    if (l.includes('vente') || l.includes('cession')) return TOOLTIPS_CS.vente;
    if (l.includes('permis')) return TOOLTIPS_CS.permis;
    return TOOLTIPS_CS.default;
  };

  const getCSEmoji = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('prêt') || l.includes('pret') || l.includes('financement')) return '🏦';
    if (l.includes('préemption') || l.includes('preemption')) return '🏛';
    if (l.includes('vente') || l.includes('cession')) return '🏠';
    if (l.includes('permis')) return '📋';
    if (l.includes('diagnostic')) return '✅';
    return '⏳';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* BANDEAU KPIs */}
      {kpiItems.length > 0 && (
        <>
          <div style={{ marginBottom: 16, marginTop: 6 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f2d3d', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 99, letterSpacing: '0.06em' }}>🏢 VUE D'ENSEMBLE</span>
          </div>
          <KpiBand items={kpiItems} />
        </>
      )}

      {/* Bouton Tout déplier/replier */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
        <button onClick={() => setAllOpen(v => !v)} style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', border: '1px solid #edf2f7', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
          {allOpen ? 'Tout replier' : 'Tout déplier'}
        </button>
      </div>

      {/* ── VOTRE LOT ── */}
      {(() => {
        type PedLot = { present?: boolean; impayes_vendeur?: number; fonds_travaux_alur?: number | null; fonds_roulement_acheteur?: number | null; fonds_roulement_modalite?: string | null; honoraires_syndic?: number | null; charges_futures?: { montant_trimestriel?: number | null; fonds_travaux_trimestriel?: number | null; montant_annuel?: number | null }; travaux_charge_vendeur?: Array<{ label?: string; montant?: number | null }>; procedures_contre_vendeur?: string[]; procedures_copro?: string; impayes_copro_global?: number | null; dette_fournisseurs?: number | null; fonds_travaux_copro_global?: number | null; historique_charges?: Array<{ exercice?: string; annee?: number | null; budget_appele?: number | null; charges_reelles?: number | null }> };
        const ped = (rapport as Record<string, unknown>).pre_etat_date as PedLot | null;
        const hasPed = ped?.present === true;
        const hasLotInfo = lot?.quote_part_tantiemes || fondsAlurNum || restrictions.length > 0 || (lot?.parties_privatives as unknown[] ?? []).length > 0;
        if (!hasLotInfo && !hasPed && travauxEvoques.length === 0) return null;
        return (
          <AccordionSection
            title="Votre lot" sub="Tantièmes · situation vendeur · historique charges · restrictions" icon="🏠"
            status="neutral" badge='Informatif'
            defaultOpen={allOpen}>

            {/* Identité du lot */}
            {(lot?.quote_part_tantiemes || (lot?.parties_privatives as unknown[] ?? []).length > 0) && (
              <>
                <SectionTitle emoji="🏠" text="Identité du lot" tooltip="Données issues du règlement de copropriété, du pré-état daté ou de l'état daté." />
                <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
                  {(lot?.parties_privatives as unknown[] ?? []).length > 0 && (
                    <div className="lot-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', borderBottom: lot?.quote_part_tantiemes ? '0.5px solid var(--color-border-tertiary)' : 'none', gap: 16 }}>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', flexShrink: 0 }}>Lots concernés</span>
                      <div className="lot-row-value" style={{ textAlign: 'right' }}>
                        {((lot as typeof lot | null)?.parties_privatives as unknown[] ?? []).map((p, i) => {
                          let label = safeStr(p);
                          if (label && label.startsWith('{')) { try { const obj = JSON.parse(label); label = obj.numero && obj.description ? `Lot ${obj.numero} — ${obj.description}` : obj.description ?? obj.label ?? label; } catch { /* keep */ } }
                          return <div key={i} style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 2 }}>{label}</div>;
                        })}
                      </div>
                    </div>
                  )}
                  {lot?.quote_part_tantiemes && (
                    <div className="lot-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', background: 'var(--color-background-secondary)', gap: 16 }}>
                      <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', flexShrink: 0 }}>
                        <Tooltip text="Votre quote-part dans la copropriété. Détermine votre participation aux charges et votre poids lors des votes en AG.">Tantièmes</Tooltip>
                      </span>
                      <div className="lot-row-value" style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{safeStr(lot?.quote_part_tantiemes)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Situation vendeur (pré-état daté) */}
            {hasPed && (
              <>
                <SectionTitle emoji="👤" text="Situation du vendeur" tooltip="Informations issues du pré-état daté établi par le syndic avant la vente." />
                <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Impayés de charges</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: Number(ped!.impayes_vendeur) === 0 ? '#16a34a' : '#dc2626' }}>{Number(ped!.impayes_vendeur) === 0 ? '✓ Vendeur à jour' : `${Number(ped!.impayes_vendeur).toLocaleString('fr-FR')} € impayés`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: ped!.honoraires_syndic ? '0.5px solid var(--color-border-tertiary)' : 'none', background: 'var(--color-background-secondary)' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Procédures contre le vendeur</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: (ped!.procedures_contre_vendeur ?? []).length === 0 ? '#16a34a' : '#dc2626' }}>{(ped!.procedures_contre_vendeur ?? []).length === 0 ? '✓ Aucune' : 'En cours'}</span>
                  </div>
                  {ped!.honoraires_syndic && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Frais d'établissement du document</div>
                        <div style={{ fontSize: 13, color: '#16a34a', marginTop: 3 }}>✓ À la charge du vendeur uniquement — rien à payer pour vous</div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{Number(ped!.honoraires_syndic).toLocaleString('fr-FR')} €</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Sommes à verser au vendeur */}
            {(fondsAlurNum || ped?.fonds_roulement_acheteur) && (
              <>
                <div style={{ border: '0.5px solid #fed7aa', borderRadius: 10, overflow: 'hidden', background: '#fffbeb' }}>
                  {fondsAlurNum && (
                    <div style={{ padding: '12px 16px', borderBottom: ped?.fonds_roulement_acheteur ? '0.5px solid #fde68a' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#92400e' }}><Tooltip text="Part des fonds de travaux constituée par le vendeur pendant sa détention du lot. Elle vous est transférée mais vous devez la rembourser au vendeur à la signature.">Fonds travaux ALUR</Tooltip></div>
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#d97706', flexShrink: 0 }}>{fondsAlurNum.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '7px 10px', background: 'rgba(217,119,6,0.08)', borderRadius: 8, border: '1px solid #fde68a' }}>
                        <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                        <span style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>Ce montant est à rembourser au vendeur en sus du prix de vente, à la signature de l'acte authentique.</span>
                      </div>
                    </div>
                  )}
                  {ped?.fonds_roulement_acheteur && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#92400e' }}>Fonds de roulement</div>
                        <div style={{ fontSize: 13, color: '#a16207', marginTop: 3 }}>{ped.fonds_roulement_modalite === 'remboursement_vendeur' ? 'Remboursement au vendeur' : 'Reconstitution au syndicat'}</div>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 500, color: '#d97706', flexShrink: 0 }}>{Number(ped.fonds_roulement_acheteur).toLocaleString('fr-FR')} €</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Historique charges N-1/N-2 */}
            {hasPed && (ped!.historique_charges ?? []).filter(h => h.budget_appele || h.charges_reelles).length > 0 && (
              <>
                <SectionTitle emoji="📊" text="Historique des charges du lot" tooltip="Le budget appelé est ce que la copropriété a prévu de dépenser. Les charges réelles sont ce qui a été effectivement dépensé. Un écart est normal — seul un écart important et répété mérite attention." />
                <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-background-secondary)' }}>
                        {['Exercice', 'Budget appelé', 'Charges réelles', 'Écart'].map((h, i) => (
                          <th key={i} style={{ padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right' as const, fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ped!.historique_charges!.filter(h => h.budget_appele || h.charges_reelles).map((h, i, arr) => {
                        const ecart = h.charges_reelles && h.budget_appele ? Number(h.charges_reelles) - Number(h.budget_appele) : null;
                        return (
                          <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', background: i % 2 === 0 ? 'var(--color-background-primary)' : 'var(--color-background-secondary)' }}>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{safeStr(h.exercice)}{h.annee ? ` (${h.annee})` : ''}</td>
                            <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'right' as const }}>{h.budget_appele ? `${Number(h.budget_appele).toLocaleString('fr-FR')} €` : '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right' as const }}>{h.charges_reelles ? `${Number(h.charges_reelles).toLocaleString('fr-FR')} €` : '—'}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' as const }}>
                              {ecart !== null && (
                                <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: ecart > 0 ? '#fef2f2' : '#f0fdf4', color: ecart > 0 ? '#dc2626' : '#16a34a' }}>
                                  {ecart > 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} €
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ padding: '14px 16px', background: 'var(--color-background-secondary)', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 6 }}>💡 Comment lire ce tableau ?</div>
                    <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>Le <strong>budget appelé</strong> est ce que la copropriété a prévu de dépenser sur l'exercice. Les <strong>charges réelles</strong> sont ce qui a été effectivement dépensé après clôture. Un petit écart est tout à fait normal. C'est seulement un écart important et répété sur plusieurs exercices qui mérite attention.</div>
                  </div>
                </div>
              </>
            )}
            {hasPed && (ped!.historique_charges ?? []).filter(h => h.budget_appele || h.charges_reelles).length === 0 && (
              <div style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
                <strong>Historique N-1 / N-2 non extrait.</strong> Le pré-état daté contient généralement les charges des deux derniers exercices clos — si elles n'apparaissent pas ici, relancez l'analyse ou vérifiez que le document complet a bien été uploadé.
              </div>
            )}

            {/* Restrictions RCP */}
            {restrictions.length > 0 && (
              <>
                <SectionTitle emoji="📜" text="Règles d'usage (RCP)" tooltip="Issues du Règlement de Copropriété — ce qui est autorisé ou interdit dans votre lot et la résidence." />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {restrictions.map((r, i) => {
                    const low = r.toLowerCase();
                    const interdit = low.includes('interdit') || low.includes('prohib') || low.includes('non autoris');
                    const color = interdit ? '#dc2626' : '#16a34a';
                    const bg = interdit ? '#fef2f2' : '#f0fdf4';
                    const border = interdit ? '#fecaca' : '#bbf7d0';
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'var(--color-background-secondary)', borderRadius: 9, gap: 10 }}>
                        <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{safeStr(r).replace(/^[✓✗×•-]\s*/, '')}</span>
                        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: bg, color, border: `0.5px solid ${border}`, flexShrink: 0, fontWeight: 500 }}>{interdit ? '✗ Interdit' : '✓ Autorisé'}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Rappel travaux évoqués */}
            {travauxEvoques.length > 0 && (
              <div style={{ background: '#fff7ed', border: '0.5px solid #fed7aa', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#92400e', marginBottom: 4 }}>{travauxEvoques.length} travaux évoqués sans vote dans la copropriété</div>
                  <div style={{ fontSize: 13, color: '#a16207', lineHeight: 1.6 }}>Si ces travaux sont votés en AG après votre acquisition, vous en supporterez une part proportionnelle à vos tantièmes — potentiellement plusieurs milliers d'euros.</div>
                  <button onClick={() => onSwitchTab?.('copropriete' as TabId)} style={{ marginTop: 8, fontSize: 13, color: '#2a7d9c', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, background: 'none', border: 'none', padding: 0, textAlign: 'left', fontFamily: 'inherit' }}>→ Voir les travaux évoqués dans l'onglet Copropriété</button>
                </div>
              </div>
            )}
          </AccordionSection>
        );
      })()}

      {/* ── DPE ── */}
      {dpe && (
        <AccordionSection
          title="Performance énergétique" sub={dpeClasse ? `DPE Classe ${dpeClasse}${dpeGesClasse ? ` · GES Classe ${dpeGesClasse}` : ''}` : 'DPE fourni'} icon="⚡"
          status={dpeBad ? 'alert' : dpeGood ? 'ok' : 'warning'}
          badge={dpeClasse ? `Classe ${dpeClasse}` : 'Détecté'}
          defaultOpen={allOpen}
          tooltip="Le DPE mesure la consommation d'énergie du logement de A (très performant) à G (passoire thermique). Les logements F sont interdits à la location dès 2028, G dès 2025.">

          {dpeBad && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 10, fontSize: 14, color: '#991b1b', lineHeight: 1.6 }}>
              ⚠️ <strong>DPE classe {dpeClasse} — passoire thermique.</strong> Ce logement ne pourra plus être mis en location à partir de {dpeClasse === 'G' ? '2025' : '2028'}. Des travaux de rénovation énergétique importants sont à prévoir.
            </div>
          )}

          <SectionTitle emoji="📊" text="Classement énergétique" tooltip="Comparaison du logement sur l'échelle de performance énergétique A à G." />

          {/* Jauges DPE + GES */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Énergie */}
            <div style={{ flex: 1, minWidth: 180, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 14, fontWeight: 500 }}>Énergie primaire</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 56, marginBottom: 12 }}>
                {DPE_CLASSES.map((c, i) => {
                  const active = c === dpeClasse;
                  const h = 28 + i * 4;
                  return (
                    <div key={c} style={{ flex: 1, height: active ? 56 : h, borderRadius: 5, background: active ? DPE_COLORS[c] : `${DPE_COLORS[c]}20`, border: active ? `2px solid ${DPE_COLORS[c]}` : `1px solid ${DPE_COLORS[c]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: active ? 14 : 11, fontWeight: 600, color: active ? '#fff' : DPE_COLORS[c] }}>{c}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{dpeKwh ? `${dpeKwh} kWh/m²/an` : '—'}</span>
                {dpeClasse && <span style={{ fontSize: 13, fontWeight: 600, color: DPE_COLORS[dpeClasse], background: `${DPE_COLORS[dpeClasse]}18`, padding: '3px 12px', borderRadius: 20, border: `1px solid ${DPE_COLORS[dpeClasse]}44` }}>Classe {dpeClasse}</span>}
              </div>
            </div>
            {/* GES */}
            {dpeGesClasse && (
              <div style={{ flex: 1, minWidth: 180, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 14, fontWeight: 500 }}>Émissions GES</div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 56, marginBottom: 12 }}>
                  {DPE_CLASSES.map((c, i) => {
                    const active = c === dpeGesClasse;
                    const h = 28 + i * 4;
                    return (
                      <div key={c} style={{ flex: 1, height: active ? 56 : h, borderRadius: 5, background: active ? DPE_COLORS[c] : `${DPE_COLORS[c]}20`, border: active ? `2px solid ${DPE_COLORS[c]}` : `1px solid ${DPE_COLORS[c]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: active ? 14 : 11, fontWeight: 600, color: active ? '#fff' : DPE_COLORS[c] }}>{c}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>{dpeGes ? `${dpeGes} kg CO₂/m²/an` : '—'}</span>
                  {dpeGesClasse && <span style={{ fontSize: 13, fontWeight: 600, color: DPE_COLORS[dpeGesClasse], background: `${DPE_COLORS[dpeGesClasse]}18`, padding: '3px 12px', borderRadius: 20, border: `1px solid ${DPE_COLORS[dpeGesClasse]}44` }}>Classe {dpeGesClasse}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Coût énergétique */}
          {(() => {
            const dpeObj = dpe as Record<string, unknown>;
            const min = dpeObj?.cout_annuel_min as number | null;
            const max = dpeObj?.cout_annuel_max as number | null;
            if (!min && !max) return null;
            return (
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Coût énergétique annuel estimé</div>
                  <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {min && max ? `${min.toLocaleString('fr-FR')} – ${max.toLocaleString('fr-FR')} €` : min ? `${min.toLocaleString('fr-FR')} €` : `${max!.toLocaleString('fr-FR')} €`}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic', textAlign: 'right' }}>Estimation indicative selon conditions climatiques<br/>et habitudes de consommation</div>
              </div>
            );
          })()}

          {/* Travaux préconisés DPE */}
          {(() => {
            const dpeObj = dpe as Record<string, unknown>;
            const travaux = dpeObj?.travaux_preconises as Array<Record<string, unknown>> | null;
            if (!travaux || travaux.length === 0) return null;
            return (
              <>
                <SectionTitle emoji="🔨" text="Travaux préconisés pour améliorer le DPE" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {travaux.map((t, i) => {
                    const tr = t as Record<string, unknown>;
                    const tLabel = String(tr.label ?? '');
                    const tPriorite = String(tr.priorite ?? '');
                    const tMin = tr.cout_min != null ? Number(tr.cout_min) : null;
                    const tMax = tr.cout_max != null ? Number(tr.cout_max) : null;
                    return (
                      <div key={i} style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{tLabel}</div>
                          {tPriorite && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>{tPriorite === 'prioritaire' ? '🔴 Prioritaire' : '🟡 Recommandé'}</div>}
                        </div>
                        {(tMin || tMax) && (
                          <span style={{ fontSize: 13, fontWeight: 500, color: '#d97706', flexShrink: 0 }}>
                            {tMin && tMax ? `${tMin.toLocaleString('fr-FR')} – ${tMax.toLocaleString('fr-FR')} €` : `${(tMin ?? tMax)!.toLocaleString('fr-FR')} €`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </AccordionSection>
      )}

      {/* ── DIAGNOSTICS PRIVATIFS ── */}
      {(autresDiags.length > 0 || hasDiagAlert) && (
        <AccordionSection
          title="Diagnostics privatifs" sub="Électricité · gaz · amiante · plomb · termites · Carrez" icon="🔍"
          status={hasDiagAlert ? 'alert' : 'ok'}
          badge={hasDiagAlert ? "Points d'attention" : `${autresDiags.length} diagnostic${autresDiags.length > 1 ? 's' : ''}`}
          defaultOpen={allOpen}>

          <SectionTitle emoji="✅" text="Résultats des diagnostics" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {autresDiags.map((d: Record<string, unknown>, i: number) => <DiagRow key={i} d={d} />)}
          </div>

          {/* Surface Carrez */}
          {(() => {
            const carrez = autresDiags.find((d: Record<string, unknown>) => d.type === 'CARREZ') as Record<string, unknown> | undefined;
            if (!carrez) return null;
            const pieces = carrez.pieces_detail as Array<{ piece: string; surface: number }> | null;
            const surface = safeStr(carrez.resultat)?.match(/([\d,.]+)\s*m²/i)?.[1];
            return (
              <>
                <SectionTitle emoji="📐" text="Surface Carrez" tooltip="La loi Carrez impose la mesure officielle de la surface privative. Si la surface réelle est inférieure de plus de 5% à celle du compromis, vous pouvez demander une réduction du prix proportionnelle." />
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, overflow: 'hidden' }}>
                  {surface && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: pieces ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                      <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Surface totale Carrez</span>
                      <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)' }}>{surface} m²</span>
                    </div>
                  )}
                  {pieces && pieces.length > 0 && (
                    <div style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {pieces.map((p, i) => (
                        <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)' }}>
                          {p.piece} — {p.surface} m²
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </AccordionSection>
      )}

      {/* ── FINANCES DU LOT ── */}
      <AccordionSection
        title="Finances de votre lot" sub="Charges · impayés · historique" icon="💶"
        status={lot?.impayes_detectes ? 'alert' : 'neutral'}
        badge={lot?.impayes_detectes ? 'Impayés détectés' : 'Informatif'}
        defaultOpen={allOpen}>

        {/* Charges — affichées uniquement si pas déjà dans KPI */}
        {chargesLotNum > 0 && !taxeAnnuelle && (
          <>
            <SectionTitle emoji="💶" text="Charges de copropriété" />
            <div style={{ background: '#eff6ff', border: '0.5px solid #bfdbfe', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 13, color: '#2563eb', marginBottom: 8 }}>Charges annuelles lot</div>
                <div style={{ fontSize: 36, fontWeight: 500, color: '#1e3a5f', lineHeight: 1 }}>{chargesLotNum.toLocaleString('fr-FR')} €</div>
              </div>
              <div style={{ width: 0.5, height: 52, background: '#bfdbfe', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, color: '#3b82f6', marginBottom: 8 }}>Soit par mois</div>
                <div style={{ fontSize: 36, fontWeight: 500, color: '#1e40af', lineHeight: 1 }}>{chargesMensuellesLot.toLocaleString('fr-FR')} €</div>
              </div>
              <div style={{ fontSize: 12, color: '#3b82f6', marginLeft: 'auto', fontStyle: 'italic', alignSelf: 'flex-end' }}>Charges courantes · hors appels exceptionnels</div>
            </div>
          </>
        )}

        {/* Taxe foncière */}
        {taxeAnnuelle && (
          <>
            <SectionTitle emoji="🏛" text="Taxe foncière" tooltip="Impôt local annuel dû par le propriétaire du bien, calculé sur la valeur locative cadastrale. Elle est due même si le bien est loué et peut évoluer chaque année." />
            <div style={{ display: 'grid', gridTemplateColumns: taxeEvol !== null ? 'repeat(3,minmax(0,1fr))' : 'repeat(2,minmax(0,1fr))', gap: 10 }}>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 5 }}>{taxeAnnuelle.toLocaleString('fr-FR')} €</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Montant annuel</div>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 5 }}>{taxeMensuelle!.toLocaleString('fr-FR')} €</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Par mois</div>
              </div>
              {taxeEvol !== null && (
                <div style={{ background: taxeEvol > 5 ? '#fff7ed' : '#f8fafc', border: taxeEvol > 5 ? '0.5px solid #fed7aa' : '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 500, color: taxeEvol > 5 ? '#a16207' : 'var(--color-text-primary)', marginBottom: 5 }}>{taxeEvol > 0 ? '+' : ''}{taxeEvol.toFixed(1)}%</div>
                  <div style={{ fontSize: 12, color: taxeEvol > 5 ? '#a16207' : 'var(--color-text-secondary)' }}>vs {taxePrecedent ? `${taxePrecedent.toLocaleString('fr-FR')} €` : 'année précédente'}</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Impayés */}
        {lot?.impayes_detectes && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: 10, border: '0.5px solid #fecaca', fontSize: 14, color: '#991b1b', lineHeight: 1.6 }}>
            ⚠️ <strong>Impayés détectés sur ce lot :</strong> {safeStr(lot.impayes_detectes)}. Le vendeur doit apurer cette dette avant la signature de l'acte authentique.
          </div>
        )}

        {chargesLotNum === 0 && !taxeAnnuelle && !lot?.impayes_detectes && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Uploadez un appel de charges ou un pré-état daté pour obtenir ces informations.</p>
          </div>
        )}
      </AccordionSection>

      {/* ── PRÉ-ÉTAT DATÉ ── */}
      {(() => {
        type HistoT = { exercice?: string; annee?: number | null; budget_appele?: number | null; charges_reelles?: number | null };
        type TravauxVT = { label?: string; montant?: number | null };
        type PreEtatT = {
          present?: boolean; date?: string | null; syndic?: string | null;
          impayes_vendeur?: number; fonds_travaux_alur?: number | null;
          fonds_roulement_acheteur?: number | null; fonds_roulement_modalite?: string | null;
          honoraires_syndic?: number | null;
          charges_futures?: { montant_trimestriel?: number | null; fonds_travaux_trimestriel?: number | null; montant_annuel?: number | null };
          travaux_charge_vendeur?: TravauxVT[];
          procedures_contre_vendeur?: string[];
          procedures_copro?: string;
          impayes_copro_global?: number | null;
          dette_fournisseurs?: number | null;
          fonds_travaux_copro_global?: number | null;
          historique_charges?: HistoT[];
        };
        const ped = (rapport as Record<string, unknown>).pre_etat_date as PreEtatT | null;
        if (!ped?.present) return null;
        const totalAnnuel = ped.charges_futures?.montant_annuel
          || ((Number(ped.charges_futures?.montant_trimestriel || 0) + Number(ped.charges_futures?.fonds_travaux_trimestriel || 0)) * 4);
        return (
          <AccordionSection
            title="Pré-état daté" sub="Situation vendeur · charges futures · historique N-1/N-2" icon="📋"
            status={Number(ped.impayes_vendeur) > 0 ? 'alert' : 'neutral'}
            badge={ped.date ? `Établi le ${safeStr(ped.date)}` : 'Détecté'}
            defaultOpen={allOpen}
            tooltip="Le pré-état daté est établi par le syndic avant la vente. Il récapitule la situation financière du vendeur vis-à-vis de la copropriété et les charges que l'acheteur devra régler.">

            {/* Situation vendeur */}
            <SectionTitle emoji="👤" text="Situation du vendeur" />
            <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Impayés de charges du vendeur</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: Number(ped.impayes_vendeur) === 0 ? '#16a34a' : '#dc2626' }}>
                  {Number(ped.impayes_vendeur) === 0 ? '✓ Vendeur à jour' : `${Number(ped.impayes_vendeur).toLocaleString('fr-FR')} € impayés`}
                </span>
              </div>
              {(ped.procedures_contre_vendeur ?? []).length === 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: ped.honoraires_syndic ? '0.5px solid var(--color-border-tertiary)' : 'none', background: 'var(--color-background-secondary)' }}>
                  <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Procédures contre le vendeur</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#16a34a' }}>✓ Aucune</span>
                </div>
              )}
              {ped.honoraires_syndic && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Frais d'établissement du document</div>
                    <div style={{ fontSize: 13, color: '#16a34a', marginTop: 3 }}>✓ À la charge du vendeur — rien à payer pour vous</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{Number(ped.honoraires_syndic).toLocaleString('fr-FR')} €</span>
                </div>
              )}
            </div>

            {/* Fonds à verser au vendeur */}
            {(ped.fonds_travaux_alur || ped.fonds_roulement_acheteur) && (
              <>
                <SectionTitle emoji="💰" text="Sommes à verser au vendeur à la signature" tooltip="Ces montants sont attachés au lot. Ils vous seront transférés mais vous devrez les rembourser au vendeur en sus du prix de vente, lors de la signature de l'acte authentique." />
                <div style={{ border: '0.5px solid #fed7aa', borderRadius: 10, overflow: 'hidden', background: '#fffbeb' }}>
                  {ped.fonds_travaux_alur && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', borderBottom: ped.fonds_roulement_acheteur ? '0.5px solid #fde68a' : 'none', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#92400e' }}>Fonds travaux ALUR</div>
                        <div style={{ fontSize: 13, color: '#a16207', marginTop: 3 }}>Part des fonds travaux constituée par le vendeur, attachée au lot</div>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 500, color: '#d97706', flexShrink: 0 }}>{Number(ped.fonds_travaux_alur).toLocaleString('fr-FR')} €</span>
                    </div>
                  )}
                  {ped.fonds_roulement_acheteur && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#92400e' }}>Fonds de roulement</div>
                        <div style={{ fontSize: 13, color: '#a16207', marginTop: 3 }}>{ped.fonds_roulement_modalite === 'remboursement_vendeur' ? 'Remboursement au vendeur' : 'Reconstitution au syndicat'}</div>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 500, color: '#d97706', flexShrink: 0 }}>{Number(ped.fonds_roulement_acheteur).toLocaleString('fr-FR')} €</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Charges futures */}
            {(ped.charges_futures?.montant_trimestriel || ped.charges_futures?.fonds_travaux_trimestriel) && (
              <>
                <SectionTitle emoji="💸" text="Charges futures à prévoir" />
                <div style={{ border: '0.5px solid #bfdbfe', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', background: '#eff6ff', borderBottom: '0.5px solid #bfdbfe', fontSize: 14, color: '#1e40af' }}>
                    Ces montants seront à régler dès votre entrée dans la copropriété, chaque trimestre.
                  </div>
                  {ped.charges_futures.montant_trimestriel && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: ped.charges_futures.fonds_travaux_trimestriel ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                      <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Charges courantes (budget prévisionnel)</span>
                      <span style={{ fontSize: 15, fontWeight: 500, color: '#1e40af' }}>{Number(ped.charges_futures.montant_trimestriel).toLocaleString('fr-FR')} € / trimestre</span>
                    </div>
                  )}
                  {ped.charges_futures.fonds_travaux_trimestriel && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: totalAnnuel > 0 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                      <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Cotisation fonds de travaux ALUR</span>
                      <span style={{ fontSize: 15, fontWeight: 500, color: '#1e40af' }}>{Number(ped.charges_futures.fonds_travaux_trimestriel).toLocaleString('fr-FR')} € / trimestre</span>
                    </div>
                  )}
                  {totalAnnuel > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--color-background-secondary)' }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>Total annuel estimé</span>
                      <span style={{ fontSize: 17, fontWeight: 500, color: '#1e40af' }}>{Number(totalAnnuel).toLocaleString('fr-FR')} € / an</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Travaux charge vendeur */}
            {(ped.travaux_charge_vendeur ?? []).length > 0 && (
              <>
                <SectionTitle emoji="⚖️" text="Travaux votés à la charge du vendeur" />
                <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', background: '#eff6ff', borderBottom: '0.5px solid #bfdbfe', fontSize: 14, color: '#1e40af' }}>
                    Ces travaux ont été votés avant le compromis — ils restent à la charge du vendeur, sans impact pour vous.
                  </div>
                  {ped.travaux_charge_vendeur!.map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < ped.travaux_charge_vendeur!.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', background: i % 2 === 0 ? 'var(--color-background-primary)' : 'var(--color-background-secondary)' }}>
                      <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>{safeStr(t.label)}</span>
                      {t.montant && <span style={{ fontSize: 14, fontWeight: 500, color: '#d97706', flexShrink: 0, marginLeft: 16 }}>{Number(t.montant).toLocaleString('fr-FR')} €</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Santé financière copro */}
            {(ped.impayes_copro_global != null || ped.dette_fournisseurs != null) && (
              <>
                <SectionTitle emoji="🏢" text="Santé financière de la copropriété" />
                <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
                  {ped.impayes_copro_global != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 16px', borderBottom: ped.dette_fournisseurs != null ? '0.5px solid var(--color-border-tertiary)' : 'none', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Impayés globaux copropriété</div>
                        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 3 }}>Charges en attente de régularisation à la date d'édition</div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#d97706', flexShrink: 0 }}>{Number(ped.impayes_copro_global).toLocaleString('fr-FR')} €</span>
                    </div>
                  )}
                  {ped.dette_fournisseurs != null && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', gap: 12 }}>
                      <span style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>Dette fournisseurs</span>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#d97706', flexShrink: 0 }}>{Number(ped.dette_fournisseurs).toLocaleString('fr-FR')} €</span>
                    </div>
                  )}
                  <div style={{ padding: '12px 16px', background: '#fff7ed', borderTop: '0.5px solid #fed7aa', fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>
                    Les impayés globaux sont <strong>normaux dans toute copropriété</strong> — ils deviennent préoccupants uniquement s'ils dépassent significativement un trimestre de budget collectif.
                  </div>
                </div>
              </>
            )}

            {/* Historique charges N-1 / N-2 */}
            {(ped.historique_charges ?? []).filter(h => h.budget_appele || h.charges_reelles).length > 0 && (
              <>
                <SectionTitle emoji="📊" text="Historique des charges du lot" tooltip="Le budget appelé correspond à ce qui était prévu. Les charges réelles sont ce qui a été effectivement dépensé. Un écart positif (réel > prévu) indique des dépenses imprévues." />
                <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', background: 'var(--color-background-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                    <strong>Comment lire ce tableau ?</strong> Le budget appelé = ce qui était prévu par la copropriété. Les charges réelles = ce qui a effectivement été dépensé. Un écart positif signifie des dépenses imprévues (appels exceptionnels).
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-background-secondary)' }}>
                        {['Exercice', 'Budget appelé', 'Charges réelles', 'Écart'].map((h, i) => (
                          <th key={i} style={{ padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right' as const, fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ped.historique_charges!.filter(h => h.budget_appele || h.charges_reelles).map((h, i, arr) => {
                        const ecart = h.charges_reelles && h.budget_appele ? Number(h.charges_reelles) - Number(h.budget_appele) : null;
                        return (
                          <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none', background: i % 2 === 0 ? 'var(--color-background-primary)' : 'var(--color-background-secondary)' }}>
                            <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-primary)', fontWeight: 500 }}>{safeStr(h.exercice)}{h.annee ? ` (${h.annee})` : ''}</td>
                            <td style={{ padding: '12px 16px', fontSize: 14, color: 'var(--color-text-secondary)', textAlign: 'right' as const }}>{h.budget_appele ? `${Number(h.budget_appele).toLocaleString('fr-FR')} €` : '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', textAlign: 'right' as const }}>{h.charges_reelles ? `${Number(h.charges_reelles).toLocaleString('fr-FR')} €` : '—'}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' as const }}>
                              {ecart !== null && (
                                <span style={{ fontSize: 12, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: ecart > 0 ? '#fef2f2' : '#f0fdf4', color: ecart > 0 ? '#dc2626' : '#16a34a' }}>
                                  {ecart > 0 ? '+' : ''}{ecart.toLocaleString('fr-FR')} €
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </AccordionSection>
        );
      })()}

      {/* ── COMPROMIS ── */}
      {(compromisDoc || compromis) && (
        <AccordionSection
          title="Compromis de vente" sub="Intervenants · prix · dates · conditions suspensives" icon="✍️"
          status="neutral" badge={compromis?.date_signature ? `Signé le ${safeStr(compromis.date_signature)}` : 'Détecté'}
          defaultOpen={allOpen}
          tooltip="Le compromis de vente est l'acte par lequel vendeur et acheteur s'engagent mutuellement. Il fixe le prix, les conditions et les délais de la transaction.">

          {/* Intervenants */}
          <SectionTitle emoji="👥" text="Intervenants" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Vendeur', value: compromis?.vendeur },
              { label: 'Acheteur', value: compromis?.acheteur },
              { label: 'Notaire vendeur', value: compromis?.notaire_vendeur },
              { label: 'Notaire acheteur', value: compromis?.notaire_acheteur },
              { label: 'Agence immobilière', value: compromis?.agence, full: true },
            ].filter(r => r.value).map((row, i) => (
              <div key={i} style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '13px 16px', gridColumn: row.full ? 'span 2' : undefined }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{safeStr(row.value)}</div>
              </div>
            ))}
          </div>

          {/* Prix */}
          {(compromis?.prix_net_vendeur || compromis?.prix_total) && (
            <>
              <SectionTitle emoji="💰" text="Prix et financement" />
              <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
                {compromis.prix_net_vendeur && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Prix net vendeur</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{Number(compromis.prix_net_vendeur).toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {compromis.honoraires_agence && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Honoraires agence {compromis.honoraires_charge ? `(charge ${compromis.honoraires_charge})` : ''}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{Number(compromis.honoraires_agence).toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {compromis.prix_total && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: compromis.depot_garantie ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Prix total acheteur</span>
                    <span style={{ fontSize: 18, fontWeight: 500, color: '#1e40af' }}>{Number(compromis.prix_total).toLocaleString('fr-FR')} €</span>
                  </div>
                )}
                {compromis.depot_garantie && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--color-background-secondary)' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Dépôt de garantie <span style={{ fontSize: 11, fontStyle: 'italic' }}>(séquestre notaire)</span></span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{Number(compromis.depot_garantie).toLocaleString('fr-FR')} €</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Dates clés */}
          {(compromis?.date_signature || compromis?.date_acte) && (
            <>
              <SectionTitle emoji="📅" text="Dates clés" />
              <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, overflow: 'hidden' }}>
                {compromis.date_signature && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Signature compromis</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{safeStr(compromis.date_signature)}</span>
                  </div>
                )}
                {compromis.date_acte && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: compromis.bien_libre_a ? '0.5px solid var(--color-border-tertiary)' : 'none', background: 'var(--color-background-secondary)' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Acte définitif prévu</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1e40af' }}>{safeStr(compromis.date_acte)}</span>
                  </div>
                )}
                {compromis.bien_libre_a && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}>
                    <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Disponibilité du bien</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{safeStr(compromis.bien_libre_a)}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Conditions suspensives */}
          {(compromis?.conditions_suspensives ?? []).length > 0 && (
            <>
              <SectionTitle emoji="⏳" text="Conditions suspensives" tooltip="Une condition suspensive est une clause qui permet à l'acheteur de se rétracter sans pénalité et de récupérer son dépôt de garantie si la condition n'est pas remplie avant la date limite." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {compromis!.conditions_suspensives!.map((cs, i) => {
                  const label = safeStr(cs.label) ?? '';
                  const jours = cs.date_limite ? joursRestants(cs.date_limite) : null;
                  const purge = cs.statut === 'purge' || cs.statut === 'levee';
                  const borderColor = purge ? '#bbf7d0' : jours !== null && jours < 15 ? '#fecaca' : '#fed7aa';
                  const badgeBg = purge ? '#f0fdf4' : jours !== null && jours < 15 ? '#fef2f2' : '#fff7ed';
                  const badgeColor = purge ? '#166534' : jours !== null && jours < 15 ? '#dc2626' : '#a16207';
                  const badgeText = purge ? '✓ Purgée' : jours !== null ? `⏳ Purge dans ${jours} jours` : cs.date_limite ? `Date : ${safeStr(cs.date_limite)}` : 'En cours';

                  return (
                    <div key={i} style={{ border: `0.5px solid ${borderColor}`, borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 18, flexShrink: 0 }}>{getCSEmoji(label)}</span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', flex: 1 }}>{label}</span>
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: badgeBg, color: badgeColor, border: `0.5px solid ${borderColor}`, fontWeight: 500, flexShrink: 0 }}>{badgeText}</span>
                        <TooltipBtn text={getCSTooltip(label)} />
                      </div>
                      {cs.detail && <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginLeft: 28 }}>{safeStr(cs.detail)}</div>}
                      {cs.date_limite && !purge && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginLeft: 28, marginTop: 4 }}>Date limite : <strong>{safeStr(cs.date_limite)}</strong></div>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Clauses particulières */}
          {(compromis?.clauses_particulieres ?? []).length > 0 && (
            <>
              <SectionTitle emoji="📋" text="Clauses particulières importantes" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {compromis!.clauses_particulieres!.map((c, i) => (
                  <div key={i} style={{ fontSize: 14, color: 'var(--color-text-primary)', padding: '10px 14px', background: 'var(--color-background-secondary)', borderRadius: 9, lineHeight: 1.6 }}>• {safeStr(c)}</div>
                ))}
              </div>
            </>
          )}
        </AccordionSection>
      )}

      {diagsPriv.length === 0 && !chargesLotNum && !taxeAnnuelle && (
        <div style={{ padding: '32px 20px', background: 'var(--color-background-primary)', borderRadius: 16, border: '0.5px solid var(--color-border-tertiary)', textAlign: 'center' }}>
          <Shield size={28} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 6 }}>Aucun document privatif détecté</p>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Uploadez le DDT, un appel de charges, la taxe foncière ou le compromis pour enrichir cet onglet.</p>
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
    if (g === 'elevee') return { headerBg: '#7f1d1d', border: '#fecaca', label: 'Gravité élevée', icon: '⚖️' };
    if (g === 'moderee') return { headerBg: '#78350f', border: '#fed7aa', label: 'Gravité modérée', icon: '📋' };
    return { headerBg: '#14532d', border: '#bbf7d0', label: 'Gravité faible', icon: '📄' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ padding: '14px 20px', background: '#fef2f2', borderRadius: 12, border: '0.5px solid #fecaca', display: 'flex', gap: 12, alignItems: 'center' }}>
        <AlertTriangle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 500, color: '#991b1b' }}>
          {rapport.procedures.length} procédure{rapport.procedures.length > 1 ? 's' : ''} détectée{rapport.procedures.length > 1 ? 's' : ''} dans les documents.
        </span>
      </div>
      {rapport.procedures.map((proc, i) => {
        const g = graviteStyle(safeStr(proc.gravite));
        return (
          <div key={i} style={{ borderRadius: 14, border: `0.5px solid ${g.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', background: g.headerBg, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{g.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: '#fff', flex: 1 }}>{safeStr(proc.label) || safeStr(proc.type) || 'Procédure détectée'}</span>
              <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', flexShrink: 0 }}>{g.label}</span>
            </div>
            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-background-primary)' }}>
              {proc.message && <p style={{ fontSize: 14, color: 'var(--color-text-primary)', lineHeight: 1.8, margin: 0 }}>{safeStr(proc.message)}</p>}
              <div style={{ padding: '12px 16px', background: '#fff7ed', borderRadius: 10, border: '0.5px solid #fed7aa', fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>
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
function TabDocuments({ rapport, onComplement }: { rapport: RapportData; onComplement?: () => void }) {

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

  // Deadline 7 jours
  const deadlineStr = rapport.regeneration_deadline;
  const deadline = deadlineStr ? new Date(deadlineStr) : null;
  const diffMs = deadline ? deadline.getTime() - Date.now() : 0;
  const expired = deadline ? diffMs <= 0 : false;

  // Complement info
  const complementDate = rapport.complement_date;
  const complementDocNames = rapport.complement_doc_names;

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

      {/* Badge mis à jour si complément effectué */}
      {complementDate && (
        <div style={{ padding: '12px 18px', borderRadius: 12, background: '#f0f7fb', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#0c4a6e' }}>
          <Paperclip size={14} />
          <span>
            <strong>Dossier mis à jour le {new Date(complementDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            {complementDocNames && complementDocNames.length > 0 && (
              <span style={{ color: '#64748b' }}> — {complementDocNames.length} document{complementDocNames.length > 1 ? 's' : ''} ajouté{complementDocNames.length > 1 ? 's' : ''}</span>
            )}
          </span>
        </div>
      )}

      {/* Section docs manquants EN HAUT */}
      {(docsEssentielManquants.length > 0 || docsSecondairesManquants.length > 0) && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Pour améliorer votre score et mieux comprendre votre achat</div>
              <div style={{ fontSize: 13, color: expired ? '#94a3b8' : '#64748b' }}>
                {expired
                  ? 'Le délai de 7 jours pour ajouter des documents est dépassé.'
                  : deadline
                    ? 'Ajoutez des documents oubliés — le rapport sera recalculé gratuitement.'
                    : 'Ajoutez ces documents pour compléter votre analyse'
                }
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
              <button
                onClick={expired ? undefined : () => onComplement?.()}
                disabled={expired}
                title={expired ? 'Le délai de 7 jours pour ajouter des documents est dépassé' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, border: 'none',
                  background: expired ? '#e2e8f0' : '#2a7d9c',
                  color: expired ? '#94a3b8' : '#fff',
                  fontSize: 13, fontWeight: 600,
                  cursor: expired ? 'not-allowed' : 'pointer',
                  opacity: expired ? 0.7 : 1,
                }}>
                <RefreshCw size={13} /> Compléter mon dossier
              </button>
              {!expired && deadline && (
                <div style={{ fontSize: 12 }}>
                  <CountdownTimer deadline={deadline} />
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {docsEssentielManquants.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', marginBottom: 12 }}>ESSENTIELS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {docsEssentielManquants.map((doc, i) => (
                    <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 14, color: '#1e40af', fontWeight: 500 }}>
                      {doc.label}
                      {doc.tooltip && <TooltipBtn text={doc.tooltip} />}
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
                    <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                      {doc.label}
                      {doc.tooltip && <TooltipBtn text={doc.tooltip} />}
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
              const complementDocNames = (rapport as Record<string, unknown>).complement_doc_names as string[] | null;
              const complementDate = (rapport as Record<string, unknown>).complement_date as string | null;
              const isComplement = complementDocNames && nom && complementDocNames.some(cn => nom.toLowerCase().includes(cn.replace(/\.pdf$/i, '').toLowerCase()) || cn.replace(/\.pdf$/i, '').toLowerCase().includes(nom.toLowerCase()));
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < arr.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: isComplement ? '#f0f7fb' : '#f8fafc', border: `1px solid ${isComplement ? '#bae6fd' : '#edf2f7'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {docTypeIcon[type] || '📄'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' as const, overflowWrap: 'break-word' as const, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {nom || docTypeLabel[type] || type}
                      {isComplement && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#0c4a6e', background: '#e0f2fe', padding: '2px 8px', borderRadius: 99 }}>
                          📎 Ajouté{complementDate ? ` le ${new Date(complementDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
                        </span>
                      )}
                    </div>
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

/* ══════════════════════════════════
   POPUP COMPLÉTER LE DOSSIER
══════════════════════════════════ */
function ComplementModal({ analyseId, profil, rapport, onClose, onSuccess }: {
  analyseId: string;
  profil: 'rp' | 'invest';
  rapport: Record<string, unknown>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<AnalyseProgress | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_FILES = 5;

  const docTypeLabel: Record<string, string> = {
    PV_AG: "PV d'AG", REGLEMENT_COPRO: 'Règlement copro', APPEL_CHARGES: 'Appel de charges',
    DPE: 'DPE', DIAGNOSTIC: 'Diagnostic', DDT: 'DDT', COMPROMIS: 'Compromis',
    ETAT_DATE: 'État daté', TAXE_FONCIERE: 'Taxe foncière', CARNET_ENTRETIEN: "Carnet d'entretien",
    AUTRE: 'Autre', MODIFICATIF_RCP: 'Modificatif RCP', PRE_ETAT_DATE: 'Pré-état daté',
    DIAGNOSTIC_PARTIES_COMMUNES: 'Diag. parties communes',
  };
  const docTypeIcon: Record<string, string> = {
    PV_AG: '📋', REGLEMENT_COPRO: '📜', APPEL_CHARGES: '💶', DPE: '⚡',
    DIAGNOSTIC: '🔍', DDT: '🗂', COMPROMIS: '✍️', ETAT_DATE: '📊',
    TAXE_FONCIERE: '🏛', AUTRE: '📄', CARNET_ENTRETIEN: '📓',
    MODIFICATIF_RCP: '📜', PRE_ETAT_DATE: '📋', DIAGNOSTIC_PARTIES_COMMUNES: '🏗',
  };

  const docsAnalyses = (rapport.documents_analyses as Array<Record<string, unknown>>) || [];
  const docsAnalysesTypes = docsAnalyses.map(d => safeStr(d.type));
  const hasDoc = (types: string[]) => types.some(t => docsAnalysesTypes.includes(t));

  const typeBien = safeStr(rapport.type_bien);
  const isCopro = typeBien === 'appartement' || typeBien === 'maison_copro';
  const anneeNum = rapport.annee_construction ? parseInt(safeStr(rapport.annee_construction)) : null;

  // Identiques à TabDocuments
  const docsEssentielsManquants = isCopro ? [
    !hasDoc(['PV_AG']) ? { emoji: '📋', label: '3 derniers PV d\'Assemblée Générale', tooltip: null } : null,
    !hasDoc(['REGLEMENT_COPRO', 'MODIFICATIF_RCP']) ? { emoji: '📜', label: 'Règlement de copropriété + modificatifs', tooltip: null } : null,
    !hasDoc(['CARNET_ENTRETIEN']) ? { emoji: '📓', label: 'Carnet d\'entretien de l\'immeuble', tooltip: 'Document tenu par le syndic qui retrace l\'historique des travaux réalisés, les contrats d\'entretien en cours et les diagnostics effectués sur l\'immeuble.' } : null,
    !hasDoc(['DDT', 'DPE', 'DIAGNOSTIC']) ? { emoji: '🗂', label: `Diagnostics privatifs (DDT)`, tooltip: `Selon l'année de construction${anneeNum ? ` (${anneeNum})` : ''}, certains diagnostics peuvent ne pas être obligatoires.` } : null,
    !hasDoc(['APPEL_CHARGES']) ? { emoji: '💶', label: 'Appel de charges / Appel de fonds', tooltip: null } : null,
  ].filter(Boolean) as { emoji: string; label: string; tooltip: string | null }[] : [
    !hasDoc(['DDT', 'DPE', 'DIAGNOSTIC']) ? { emoji: '🗂', label: 'DDT complet (Dossier Diagnostic Technique)', tooltip: 'DPE, électricité, gaz, amiante, plomb, termites…' } : null,
    !hasDoc(['TAXE_FONCIERE']) ? { emoji: '🏛', label: 'Taxe foncière', tooltip: null } : null,
  ].filter(Boolean) as { emoji: string; label: string; tooltip: string | null }[];

  const docsSecondairesManquants = isCopro ? [
    !hasDoc(['DIAGNOSTIC_PARTIES_COMMUNES']) ? { emoji: '🏗', label: 'Diagnostics parties communes', tooltip: 'Amiante, plomb et risques environnementaux sur les parties communes de l\'immeuble.' } : null,
    { emoji: '📊', label: 'DTG — Diagnostic Technique Global', tooltip: 'Bilan complet de l\'état de l\'immeuble. Permet d\'anticiper les grands travaux.' },
    { emoji: '📋', label: 'PPT — Plan Pluriannuel de Travaux', tooltip: 'Planning des travaux prévus sur 10 ans.' },
    !hasDoc(['PRE_ETAT_DATE']) ? { emoji: '📋', label: 'Pré-état daté', tooltip: 'Récapitule les sommes dues, les procédures en cours et les charges à venir.' } : null,
  ].filter(Boolean) as { emoji: string; label: string; tooltip: string | null }[] : [];

  const hasManquants = docsEssentielsManquants.length > 0 || docsSecondairesManquants.length > 0;

  const addFiles = (newFiles: FileList | File[]) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfs.length === 0) { setError('Seuls les fichiers PDF sont acceptés.'); return; }
    const total = files.length + pdfs.length;
    if (total > MAX_FILES) { setError(`Maximum ${MAX_FILES} documents. Vous en avez déjà ${files.length}.`); return; }
    setError(null);
    setFiles(prev => [...prev, ...pdfs]);
  };

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setError(null);
    setProgress({ step: 'extracting', current: 0, total: files.length, percent: 5, message: 'Préparation...' });

    const result = await lancerAnalyseEdge({
      files, mode: 'complement', analyseId, profil,
      onProgress: (p) => setProgress(p),
    });

    if (result.success) {
      setDone(true);
      autoCloseRef.current = setTimeout(() => onSuccess(), 10_000);
    } else {
      setError(result.errorMessage || 'Une erreur est survenue. Réessayez.');
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => { if (autoCloseRef.current) clearTimeout(autoCloseRef.current); };
  }, []);

  const progressPercent = progress?.percent || 0;

  // Utilise le TooltipBtn global — pas besoin d'id ni d'état local
  const TooltipBubble = ({ text }: { id?: string; text: string }) => (
    <TooltipBtn text={text} />
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={!uploading ? onClose : undefined} style={{ position: 'absolute', inset: 0, background: 'rgba(15,45,61,0.6)', backdropFilter: 'blur(4px)' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 680, background: '#fff', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Compléter le dossier</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Ajoutez jusqu'à 5 documents oubliés</div>
          </div>
          {!uploading && (
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={16} color="#64748b" />
            </button>
          )}
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* ══ État : Terminé ══ */}
          {done && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <CheckCircle size={26} color="#16a34a" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Rapport mis à jour</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
                Votre rapport a été enrichi avec {files.length} nouveau{files.length > 1 ? 'x' : ''} document{files.length > 1 ? 's' : ''}. Le score a été recalculé.
              </div>
              <button onClick={() => { if (autoCloseRef.current) clearTimeout(autoCloseRef.current); onSuccess(); }}
                style={{ padding: '13px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(42,125,156,0.25)' }}>
                Voir le rapport mis à jour
              </button>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>Fermeture automatique dans quelques secondes…</div>
            </div>
          )}

          {/* ══ État : Upload en cours ══ */}
          {uploading && !done && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ position: 'relative', width: 76, height: 76, margin: '0 auto 18px' }}>
                <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#edf2f7" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#2a7d9c" strokeWidth="6"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPercent / 100)}`}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{progressPercent}%</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{progress?.message || 'Mise à jour en cours…'}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Ne fermez pas cette fenêtre</div>
              <div style={{ height: 6, borderRadius: 3, background: '#edf2f7', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #2a7d9c, #5bb8d4)', width: `${progressPercent}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )}

          {/* ══ État : Sélection ══ */}
          {!uploading && !done && (
            <>
              {/* ── HAUT : Upload + bouton ── */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) addFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? '#2a7d9c' : '#d1d5db'}`, borderRadius: 14,
                  padding: '22px 20px', textAlign: 'center', cursor: 'pointer',
                  background: dragging ? '#f0f7fb' : '#fafbfc', transition: 'all 0.2s ease', marginBottom: 12,
                }}>
                <Upload size={24} color={dragging ? '#2a7d9c' : '#94a3b8'} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 3 }}>Glissez vos PDF ici ou cliquez pour parcourir</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Maximum {MAX_FILES} documents · PDF uniquement</div>
                <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" multiple
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
                  style={{ display: 'none' }} />
              </div>

              {/* Fichiers sélectionnés */}
              {files.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                      <FileText size={15} color="#16a34a" />
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(1)} Mo</span>
                      <button onClick={() => removeFile(i)} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={13} color="#94a3b8" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>{error}</div>
              )}

              {/* Bouton */}
              <button onClick={handleSubmit} disabled={files.length === 0}
                style={{
                  width: '100%', padding: '13px 24px', borderRadius: 12, border: 'none',
                  background: files.length > 0 ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#e2e8f0',
                  color: files.length > 0 ? '#fff' : '#94a3b8', fontSize: 15, fontWeight: 700,
                  cursor: files.length > 0 ? 'pointer' : 'not-allowed',
                  boxShadow: files.length > 0 ? '0 4px 16px rgba(42,125,156,0.25)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20,
                }}>
                <RefreshCw size={16} /> Mettre à jour l'analyse
              </button>

              {/* ── Séparateur ── */}
              <div style={{ height: 1, background: '#edf2f7', marginBottom: 18 }} />

              {/* ── BAS : 2 colonnes — Docs suggérés + Docs déjà analysés ── */}
              <div style={{ display: 'grid', gridTemplateColumns: hasManquants ? '1fr 1fr' : '1fr', gap: 16 }}>

                {/* Col 1 : Documents suggérés */}
                {hasManquants && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', letterSpacing: '0.08em', marginBottom: 10 }}>📌 DOCUMENTS SUGGÉRÉS</div>

                    {docsEssentielsManquants.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#1e40af', letterSpacing: '0.06em', marginBottom: 6 }}>ESSENTIELS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {docsEssentielsManquants.map((doc, i) => (
                            <div key={`e${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 12, color: '#1e40af' }}>
                              <span>{doc.emoji}</span> <span style={{ flex: 1 }}>{doc.label}</span>
                              {doc.tooltip && <TooltipBubble id={`e${i}`} text={doc.tooltip} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {docsSecondairesManquants.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#64748b', letterSpacing: '0.06em', marginBottom: 6 }}>SECONDAIRES</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {docsSecondairesManquants.map((doc, i) => (
                            <div key={`s${i}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>
                              <span>{doc.emoji}</span> <span style={{ flex: 1 }}>{doc.label}</span>
                              {doc.tooltip && <TooltipBubble id={`s${i}`} text={doc.tooltip} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Col 2 : Documents déjà analysés */}
                {docsAnalyses.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.08em', marginBottom: 10 }}>✓ DOCUMENTS DÉJÀ ANALYSÉS</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {docsAnalyses.map((doc, i) => {
                        const type = safeStr(doc.type);
                        const nom = safeStr(doc.nom || doc.name);
                        const annee = safeStr(doc.annee);
                        const icon = docTypeIcon[type] || '📄';
                        const label = nom || docTypeLabel[type] || type;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #d1fae5', fontSize: 12, color: '#166534' }}>
                            <span>{icon}</span> {label}{annee ? ` (${annee})` : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildRapport(data: Record<string, unknown>, dbData: { id: string; type: string; profil: string | null; created_at: string; document_names: string[] | null; regeneration_deadline: string | null; complement_date: string | null; complement_doc_names: string[] | null; is_preview: boolean }) {
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
    complement_date: dbData.complement_date || null,
    complement_doc_names: dbData.complement_doc_names || null,
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
export type TabId = 'synthese' | 'copropriete' | 'logement' | 'procedures' | 'documents';

/* ══════════════════════════════════
   COMPOSANT RÉUTILISABLE — pour ExemplePage
   (rendu identique au vrai rapport, sans auth/polling/paiement)
══════════════════════════════════ */
export function buildRapportExemple(
  data: Record<string, unknown>,
  dbData: { id: string; type: string; profil: string | null; created_at: string; document_names: string[] | null; regeneration_deadline: string | null; complement_date: string | null; complement_doc_names: string[] | null; is_preview: boolean }
): RapportData {
  return buildRapport(data, dbData);
}

export function RapportViewExemple({ rapport, defaultTab = 'synthese', onComplement }: { rapport: RapportData; defaultTab?: TabId; onComplement?: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const isComplete = rapport.type === 'complete';
  const hasCopro = isCoproType(rapport.type_bien);
  const logementLabel = rapport.type_bien === 'maison' ? 'Ma maison' : 'Logement';
  const logementIcon = rapport.type_bien === 'maison' ? <Home size={14} /> : <Building2 size={14} />;

  const tabs: { id: TabId; label: string; icon: React.ReactNode; dotColor: string }[] = [
    { id: 'synthese', label: 'Synthèse', icon: <Star size={14} />, dotColor: '#22c55e' },
    ...(hasCopro ? [{ id: 'copropriete' as TabId, label: 'Copropriété', icon: <Building2 size={14} />, dotColor: rapport.travaux_a_prevoir.length > 0 ? '#f97316' : '#22c55e' }] : []),
    { id: 'logement', label: logementLabel, icon: logementIcon, dotColor: rapport.diagnostics.some((d: Record<string, unknown>) => d.alerte && d.perimetre === 'lot_privatif') ? '#ef4444' : '#22c55e' },
    { id: 'procedures', label: 'Procédures', icon: <Gavel size={14} />, dotColor: rapport.procedures_en_cours ? '#ef4444' : '#22c55e' },
    { id: 'documents', label: 'Documents', icon: <FileText size={14} />, dotColor: '#94a3b8' },
  ];

  return (
    <div className="rapport-wrapper" style={{ background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif", borderRadius: 12 }}>
      <div className="rapport-inner" style={{ maxWidth: 1250, margin: '0 auto', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <RapportHeader rapport={rapport} isShared={true} />

        {isComplete && (
          <div className="rapport-tabs" style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, padding: '5px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rapport-tab-btn${active ? ' rapport-tab-btn-active' : ''}`}
                  data-color={tab.dotColor}
                  style={{
                    flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 8, border: 'none',
                    background: active ? tab.dotColor : 'transparent',
                    color: active ? '#fff' : '#64748b',
                    fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                    boxShadow: active ? `0 2px 8px ${tab.dotColor}40` : 'none',
                  }}>
                  {tab.icon}
                  {tab.label}
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.85)' : tab.dotColor, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}

        {(activeTab === 'synthese' || !isComplete) && <SafeTabBoundary><TabSynthese rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'copropriete' && isComplete && hasCopro && <SafeTabBoundary><TabCopropriete rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'logement' && isComplete && <SafeTabBoundary><TabLogement rapport={rapport} onSwitchTab={setActiveTab} /></SafeTabBoundary>}
        {activeTab === 'procedures' && isComplete && <SafeTabBoundary><TabProcedures rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'documents' && isComplete && <SafeTabBoundary><TabDocuments rapport={rapport} onComplement={onComplement} /></SafeTabBoundary>}
      </div>
    </div>
  );
}

export default function RapportPage() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') || '';
  const shareToken = searchParams.get('token') || '';
  const action = searchParams.get('action') || '';
  const isShared = !!shareToken;

  const [showReupload, setShowReupload] = useState(action === 'reupload');
  const [showComplement, setShowComplement] = useState(action === 'complement');
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
          regeneration_deadline: data.regeneration_deadline, complement_date: data.complement_date || null, complement_doc_names: data.complement_doc_names || null, is_preview: false,
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
          regeneration_deadline: data.regeneration_deadline, complement_date: data.complement_date || null, complement_doc_names: data.complement_doc_names || null, is_preview: data.is_preview ?? false,
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
                    <span style={{ fontSize: 14, color: '#92400e', lineHeight: 1.5 }}>{p}</span>
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
        <style>{`
          @media (max-width: 640px) {
            .doc-simple-wrapper { padding: 0 !important; }
            .doc-back-desktop { display: none !important; }
            .doc-back-sticky { display: block !important; }
          }
        `}</style>
        {/* Bouton sticky mobile */}
        <div className="doc-back-sticky" style={{ display: 'none', position: 'sticky', top: 0, zIndex: 100, background: '#f5f9fb', padding: '8px 12px', borderBottom: '1px solid #edf2f7' }}>
          <Link to="/dashboard/analyses" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#fff', textDecoration: 'none', padding: '8px 14px', borderRadius: 9, background: '#2a7d9c' }}>
            <ChevronLeft size={13} /> Mes analyses
          </Link>
        </div>
        <div className="doc-simple-wrapper" style={{ maxWidth: 1250, margin: '0 auto', padding: '20px 28px' }}>
          <div className="doc-back-desktop" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
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
  const logementLabel = rapport.type_bien === 'maison' ? 'Ma maison' : 'Logement';
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
    <div className="rapport-wrapper" style={{ minHeight: '100vh', background: '#f5f9fb', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="rapport-inner" style={{ maxWidth: 1250, margin: '0 auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>

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

        {/* Onglets desktop (cachés sur mobile) */}
        {isComplete && (
          <div className="rapport-tabs" style={{ background: '#fff', border: '1px solid #edf2f7', borderRadius: 12, padding: '5px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rapport-tab-btn${active ? ' rapport-tab-btn-active' : ''}`}
                  data-color={tab.dotColor}
                  style={{
                    flex: 1, minWidth: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 12px', borderRadius: 8, border: 'none',
                    background: active ? tab.dotColor : 'transparent',
                    color: active ? '#fff' : '#64748b',
                    fontSize: 12.5, fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                    boxShadow: active ? `0 2px 8px ${tab.dotColor}40` : 'none',
                  }}>
                  {tab.icon}
                  {tab.label}
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.85)' : tab.dotColor, flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        )}

        {/* Contenu onglets */}
        {(activeTab === 'synthese' || !isComplete) && <SafeTabBoundary><TabSynthese rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'copropriete' && isComplete && hasCopro && <SafeTabBoundary><TabCopropriete rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'logement' && isComplete && <SafeTabBoundary><TabLogement rapport={rapport} onSwitchTab={setActiveTab} /></SafeTabBoundary>}
        {activeTab === 'procedures' && isComplete && <SafeTabBoundary><TabProcedures rapport={rapport} /></SafeTabBoundary>}
        {activeTab === 'documents' && isComplete && <SafeTabBoundary><TabDocuments rapport={rapport} onComplement={() => setShowComplement(true)} /></SafeTabBoundary>}

        {/* ══ BOTTOM TAB BAR — mobile uniquement — Option C pill ══ */}
        {isComplete && (
          <div className="bottom-tab-bar" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200, background: '#fff', borderTop: '1px solid #edf2f7', boxShadow: '0 -2px 16px rgba(0,0,0,0.07)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div style={{ display: 'flex', alignItems: 'stretch', padding: '8px 6px 12px', gap: 4 }}>
              {tabs.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    style={{ flex: active ? 1.7 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: active ? '10px 8px' : '10px 4px', border: 'none', background: active ? `${tab.dotColor}18` : 'transparent', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: active ? 'none' : 'grayscale(1)', opacity: active ? 1 : 0.45 }}>
                      {tab.icon}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? tab.dotColor : '#94a3b8', whiteSpace: 'nowrap' as const, lineHeight: 1 }}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Popup Compléter le dossier */}
        {showComplement && rapport && (
          <ComplementModal
            analyseId={rapport.id}
            profil={(rapport.profil as 'rp' | 'invest') || 'rp'}
            rapport={rapport as unknown as Record<string, unknown>}
            onClose={() => setShowComplement(false)}
            onSuccess={() => { setShowComplement(false); loadRapport(); }}
          />
        )}

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
        /* ══════════════════════════════════
           MOBILE — 640px et moins
        ══════════════════════════════════ */
        @media (max-width: 640px) {
          html, body { overflow-x: hidden; }

          /* ── Layout général ── */
          .rapport-wrapper { padding: 0 !important; }
          .rapport-inner { padding: 6px 4px 90px 4px !important; gap: 6px !important; max-width: 100vw !important; }
          .rapport-main { padding: 6px 4px !important; gap: 8px !important; }

          /* ── Header ── */
          .rapport-header { border-radius: 0 !important; margin: 0 !important; }
          .rapport-hero { padding: 14px 14px 16px !important; }
          .rapport-score-circle { width: 70px !important; height: 70px !important; }
          .score-label-badge { font-size: 9px !important; padding: 2px 8px !important; }
          /* Badges hero — masqués sur mobile (redondants avec les infos du header) */
          .hero-tags { display: none !important; }

          /* ── Topnav — labels courts ── */
          .topnav-back-label { font-size: 11px !important; }
          .topnav-share-label { font-size: 11px !important; }
          .topnav-dl-label { font-size: 11px !important; }
          .topnav-back-btn { padding: 7px 10px !important; }
          .topnav-share-btn { padding: 7px 10px !important; }
          .topnav-dl-btn { padding: 7px 10px !important; }

          /* ── Onglets desktop — cachés sur mobile ── */
          .rapport-tabs { display: none !important; }

          /* ── Bottom tab bar — visible sur mobile ── */
          .bottom-tab-bar { display: block !important; }

          /* ── Résumé — line-clamp 5 lignes ── */
          .resume-clamped { display: -webkit-box !important; -webkit-line-clamp: 5 !important; -webkit-box-orient: vertical !important; overflow: hidden !important; }
          .resume-toggle { display: block !important; }

          /* ── KPI desktop → cacher, mobile liste → montrer ── */
          .kpi-desktop { display: none !important; }
          .kpi-mobile { display: flex !important; }
          .kpi-synth-desktop { display: none !important; }
          .kpi-synth-mobile { display: flex !important; }

          /* ── Accordéon ── */
          .rapport-accordion-header { padding: 10px 12px !important; }
          .rapport-accordion-header .accord-icon { width: 28px !important; height: 28px !important; font-size: 13px !important; }
          .rapport-accordion-body { padding: 10px 10px !important; }

          /* ── SectionTitle ── */
          .section-title-bar { padding: 8px 10px !important; border-radius: 6px !important; }
          .section-title-bar span { font-size: 12px !important; }

          /* ── Tables ── */
          table { font-size: 11px !important; }
          th, td { padding: 6px 8px !important; }

          /* ── AG : cacher table, montrer cards ── */
          .ag-table-desktop { display: none !important; }
          .ag-cards-mobile { display: flex !important; }

          /* ── Règles copro mobile ── */
          .rcp-badge-desktop { display: none !important; }
          .rcp-badge-mobile { display: inline-block !important; }

          /* ── SyndicBand mobile 2x2 ── */
          .syndic-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .syndic-stats > div { border-left: none !important; border-top: 1px solid #f1f5f9; padding: 8px 6px !important; }
          .syndic-stats > div > div:first-child { font-size: 11px !important; }
          .syndic-stats > div > div:last-child { font-size: 15px !important; }
          .syndic-stats > div:nth-child(even) { border-left: 1px solid #f1f5f9 !important; }

          /* ── Points positifs/vigilance ── */
          .points-grid { grid-template-columns: 1fr !important; }
          .points-card { padding: 14px 14px !important; }
          .points-text { font-size: 13px !important; line-height: 1.55 !important; }

          /* ── Pistes négo + Avis Verimo ── */
          .nego-block { padding: 14px 14px !important; }
          .nego-title { font-size: 13px !important; }
          .nego-intro { font-size: 12px !important; }
          .nego-item { padding: 8px 10px !important; }
          .nego-text { font-size: 12px !important; }
          .avis-header { padding: 12px 14px 10px !important; }
          .avis-title { font-size: 14px !important; }
          .avis-body { padding: 12px 14px !important; }
          .avis-para { font-size: 13px !important; line-height: 1.65 !important; }

          /* ── Votre lot — colonne sur mobile ── */
          .lot-row { flex-direction: column !important; gap: 4px !important; }
          .lot-row-value { text-align: left !important; }
          .lot-row-value div { font-size: 13px !important; text-align: left !important; }

          /* ── Grids généraux ── */
          .grid-2col { grid-template-columns: 1fr !important; }
          .grid-3col { grid-template-columns: 1fr !important; }

          /* ── Texte résumé ── */
          .rapport-main p { font-size: 13px !important; line-height: 1.65 !important; }

          /* ── Tooltip ── */
          .tooltip-bubble { max-width: calc(100vw - 24px) !important; left: 12px !important; right: 12px !important; width: auto !important; }
        }

        /* ══════════════════════════════════
           TRÈS PETIT (≤ 390px — iPhone SE)
        ══════════════════════════════════ */
        @media (max-width: 390px) {
          .rapport-score-circle { width: 62px !important; height: 62px !important; }
          .rapport-hero { padding: 12px 12px 14px !important; }
        }

        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; font-size: 11px !important; }
          .no-print, header, .topbar-print-hide { display: none !important; }
          .print-show-all > div { display: flex !important; }
          .rapport-tabs { display: none !important; }
          .bottom-tab-bar { display: none !important; }
          .kpi-desktop { display: grid !important; }
          .kpi-mobile { display: none !important; }
          .kpi-synth-desktop { display: grid !important; }
          .kpi-synth-mobile { display: none !important; }
          .print-section { break-inside: avoid; margin-bottom: 16px; }
          @page { margin: 1.5cm; size: A4; }
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes vr-pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.9); } }
      `}</style>
    </div>
  );
}
