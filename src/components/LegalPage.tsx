/**
 * SYSTÈME DE COMPOSANTS DES PAGES LÉGALES — 29 juillet 2026
 * ─────────────────────────────────────────────────────────────────────────
 * Pourquoi ce fichier : CGU, Confidentialité et Mentions légales étaient trois
 * empilements de <h2> + paragraphes en `whiteSpace: pre-line`. Le rendu par
 * défaut de toutes les pages légales du web — et donc indistinguable.
 *
 * La grammaire visuelle vient de CGVProPage (icône en carré dégradé, sommaire
 * collant avec suivi de lecture, encadrés colorés) : c'est la page la plus
 * aboutie du lot, elle sert de référence.
 *
 * ⚠️ CGVProPage garde pour l'instant ses propres copies de Section/Table/
 * Callout, car elle est protégée par authentification (pros connectés
 * uniquement) et donc pénible à tester. À faire migrer vers ce fichier lors
 * d'une prochaine passe, sinon les deux styles vont diverger.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Mail, ArrowLeft } from 'lucide-react';

const ENCRE = '#0f2d3d';
const ACCENT = '#2a7d9c';
const TRAIT = '#e2e8f0';
const ACCENT_PALE = '#f0f7fb';
const CIEL = '#7dd3fc';   // liseré et accents sur fond sombre

export type SectionRef = { id: string; label: string };

/* ══════════════════════════════════════════════════════════════════════
   COQUILLE — en-tête, sommaire collant, suivi de lecture
   ══════════════════════════════════════════════════════════════════════ */
export function LegalLayout({
  titre, chapeau, maj, badge, sections, children,
}: {
  titre: string;
  chapeau: string;
  maj: string;
  /** Pastille du bandeau : qualifie la nature du document, jamais décorative. */
  badge: { icon: LucideIcon; label: string };
  sections: SectionRef[];
  children: React.ReactNode;
}) {
  const BadgeIcon = badge.icon;
  const [active, setActive] = useState(sections[0]?.id ?? '');

  // Suivi de lecture : la section active est la dernière dont le haut est
  // passé sous la barre de navigation. On parcourt à l'envers pour prendre
  // la plus basse qui remplit la condition.
  useEffect(() => {
    const onScroll = () => {
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.getBoundingClientRect().top <= 140) {
          setActive(sections[i].id);
          return;
        }
      }
      setActive(sections[0]?.id ?? '');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sections]);

  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 80 }}>
      <style>{`
        .legal-grille { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 48px; align-items: start; }
        .legal-somm-mobile { display: none; }
        @media (max-width: 1023px) {
          .legal-grille { grid-template-columns: minmax(0, 1fr); gap: 0; }
          .legal-somm-bureau { display: none; }
          .legal-somm-mobile { display: block; }
        }
        .legal-corps a { color: ${ACCENT}; font-weight: 600; }
        .legal-somm-lien:hover { background: ${ACCENT_PALE} !important; color: ${ENCRE} !important; }
        .legal-retour { transition: background .18s, border-color .18s, transform .18s; }
        .legal-retour:hover { background: rgba(255,255,255,0.2) !important; border-color: rgba(255,255,255,0.45) !important; transform: translateX(-2px); }
        .legal-retour:focus-visible { outline: 2px solid ${CIEL}; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
      `}</style>

      {/* ═══ BANDEAU — même grammaire que CGVProPage : dégradé encre→accent,
           liseré ciel de 4px en pied. C'est le seul moment appuyé de la page :
           tout le reste reste sobre. ═══ */}
      <section style={{ background: `linear-gradient(135deg, ${ENCRE} 0%, ${ACCENT} 100%)`, padding: '52px 24px 68px', borderBottom: `4px solid ${CIEL}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>

          {/* Bouton retour encadré — lisible sur le dégradé, cible tactile large */}
          <Link to="/" className="legal-retour"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 28,
              padding: '8px 16px 8px 9px', borderRadius: 100, textDecoration: 'none',
              background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.24)',
              color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.01em',
            }}>
            <span aria-hidden style={{ width: 25, height: 25, borderRadius: 100, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowLeft size={14} />
            </span>
            Retour à l&apos;accueil
          </Link>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(125,211,250,0.18)', border: '1.5px solid rgba(125,211,250,0.4)', marginBottom: 18 }}>
            <BadgeIcon size={14} style={{ color: CIEL }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: CIEL, letterSpacing: '0.12em' }}>{badge.label}</span>
          </div>

          <h1 style={{ fontSize: 'clamp(30px,5vw,50px)', fontWeight: 900, color: '#fff', marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            {titre}
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.85)', maxWidth: 760, lineHeight: 1.6, margin: 0 }}>{chapeau}</p>
          <p style={{ marginTop: 22, fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>Dernière mise à jour : {maj}</p>
        </div>
      </section>

      <section style={{ maxWidth: 1120, margin: '0 auto', padding: '52px 24px 88px' }}>
        <div className="legal-grille">

          {/* Sommaire — colonne collante sur grand écran */}
          <nav className="legal-somm-bureau" aria-label="Sommaire" style={{ position: 'sticky', top: 100 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 10 }}>Sommaire</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', overscrollBehavior: 'contain' }}>
              {sections.map(s => {
                const on = active === s.id;
                return (
                  <a key={s.id} href={`#${s.id}`} className="legal-somm-lien"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', borderRadius: 7,
                      fontSize: 12.5, fontWeight: on ? 700 : 500, textDecoration: 'none',
                      color: on ? ENCRE : '#64748b',
                      background: on ? ACCENT_PALE : 'transparent',
                      borderLeft: on ? `2.5px solid ${ACCENT}` : '2.5px solid transparent',
                      transition: 'color .15s, background .15s',
                    }}>
                    {s.label}
                  </a>
                );
              })}
            </div>
          </nav>

          {/* Sommaire — accordéon natif sur mobile, zéro JS */}
          <details className="legal-somm-mobile" style={{ marginBottom: 28, background: '#fff', border: `1.5px solid ${TRAIT}`, borderRadius: 12, padding: '14px 16px' }}>
            <summary style={{ fontSize: 13, fontWeight: 800, color: ENCRE, cursor: 'pointer', letterSpacing: '0.02em' }}>
              Sommaire — {sections.length} sections
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12 }}>
              {sections.map(s => (
                <a key={s.id} href={`#${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 4px', fontSize: 13, color: '#475569', textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>
                  <ChevronRight size={13} style={{ color: ACCENT, flexShrink: 0 }} /> {s.label}
                </a>
              ))}
            </div>
          </details>

          <div className="legal-corps" style={{ minWidth: 0 }}>{children}</div>
        </div>
      </section>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   « EN CLAIR » — le résumé en français courant, avant le texte juridique
   ──────────────────────────────────────────────────────────────────────
   C'est l'élément qui distingue ces pages : Verimo vend la traduction de
   documents opaques en langage clair. Ses propres pages légales doivent
   appliquer cette promesse plutôt que la contredire.
   Ce bloc RÉSUME, il ne remplace pas : chaque point renvoie à sa section.
   ══════════════════════════════════════════════════════════════════════ */
export function EnClair({ points }: { points: { texte: string; ancre: string; ancreLabel: string }[] }) {
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${TRAIT}`, borderLeft: `4px solid ${ACCENT}`, borderRadius: 14, padding: '24px 26px', marginBottom: 48 }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: ACCENT, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
        En clair
      </p>
      <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20, lineHeight: 1.5 }}>
        L&apos;essentiel en quelques lignes. Ce résumé n&apos;a pas de valeur contractuelle : le texte complet fait foi.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, background: ACCENT_PALE, border: `1px solid rgba(42,125,156,0.25)`, color: ACCENT, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              {i + 1}
            </span>
            <p style={{ fontSize: 14.5, color: '#374151', lineHeight: 1.6, margin: 0 }}>
              {p.texte}{' '}
              <a href={`#${p.ancre}`} style={{ color: ACCENT, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {p.ancreLabel} →
              </a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SECTION — reprise de la grammaire CGVProPage
   ══════════════════════════════════════════════════════════════════════ */
export function Section({ id, icon: Icon, title, children }: { id: string; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 52, scrollMarginTop: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, paddingBottom: 13, borderBottom: `2px solid ${TRAIT}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${ENCRE}, ${ACCENT})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={17} style={{ color: '#fff' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: ENCRE, letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 13 }}>
        {children}
      </div>
    </section>
  );
}

export function SubTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 15.5, fontWeight: 700, color: ENCRE, marginTop: 10, marginBottom: 0 }}>{children}</h3>;
}

/* Liste à puces — remplace les « • » saisis à la main dans du pre-line. */
export function Liste({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, paddingLeft: 0, listStyle: 'none' }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span aria-hidden style={{ flexShrink: 0, width: 5, height: 5, borderRadius: 100, background: ACCENT, marginTop: 10 }} />
          <span style={{ flex: 1 }}>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, border: `1.5px solid ${TRAIT}`, margin: '4px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: ACCENT_PALE }}>
            {headers.map((h, i) => (
              <th key={i} scope="col" style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: ENCRE, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1.5px solid #d0e8f0', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '11px 14px', color: j === 0 ? ENCRE : '#475569', borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none', fontWeight: j === 0 ? 600 : 400, lineHeight: 1.55, verticalAlign: 'top' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TONS = {
  info:    { bord: '#7dd3fc', fond: '#f0f9ff', titre: '#075985' },
  warning: { bord: '#fcd34d', fond: '#fffbeb', titre: '#92400e' },
  success: { bord: '#86efac', fond: '#f0fdf4', titre: '#166534' },
} as const;

export function Callout({ type, title, children }: { type: keyof typeof TONS; title: string; children: React.ReactNode }) {
  const t = TONS[type];
  return (
    <div style={{ background: t.fond, border: `1.5px solid ${t.bord}`, borderRadius: 12, padding: '15px 18px', margin: '4px 0' }}>
      <p style={{ fontSize: 13.5, fontWeight: 800, color: t.titre, marginBottom: 5 }}>{title}</p>
      <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>{children}</div>
    </div>
  );
}

/* Fiche d'identité — paires libellé/valeur, pour l'éditeur et les hébergeurs. */
export function Fiche({ lignes }: { lignes: { cle: string; valeur: React.ReactNode }[] }) {
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${TRAIT}`, borderRadius: 12, overflow: 'hidden' }}>
      {lignes.map((l, i) => (
        <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '11px 16px', borderBottom: i < lignes.length - 1 ? '1px solid #f1f5f9' : 'none', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
          <span style={{ flex: '0 0 200px', fontSize: 12.5, fontWeight: 700, color: '#64748b', letterSpacing: '0.02em' }}>{l.cle}</span>
          <span style={{ flex: '1 1 220px', fontSize: 14, color: ENCRE, minWidth: 0 }}>{l.valeur}</span>
        </div>
      ))}
    </div>
  );
}

export function BlocContact({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div style={{ marginTop: 12, padding: '22px 24px', background: ACCENT_PALE, borderRadius: 16, border: '1px solid rgba(42,125,156,0.15)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, background: '#fff', border: '1px solid rgba(42,125,156,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Mail size={16} style={{ color: ACCENT }} />
      </div>
      <div>
        <p style={{ fontSize: 14.5, color: ENCRE, fontWeight: 700, marginBottom: 3 }}>{titre}</p>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          {texte} <a href="mailto:hello@verimo.fr" style={{ color: ACCENT, fontWeight: 700 }}>hello@verimo.fr</a> — réponse sous 48 h.
        </p>
      </div>
    </div>
  );
}
