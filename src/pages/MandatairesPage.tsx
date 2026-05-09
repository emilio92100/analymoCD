import { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  ArrowRight, FileText, Sparkles, Eye, Handshake,
  ShieldCheck, Clock, Award, TrendingUp, Check,
  Calendar, ChevronRight, Zap, Target, Star,
  AlertTriangle, BarChart3, Send, Download, Building2,
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
const isLowPerf = () => isIOS() || isMobile();
const _lowPerf = isLowPerf();

// 🔗 PLACEHOLDER — à remplacer par le vrai lien Calendly
const CALENDLY_URL = '#calendly';

const up: Variants = {
  hidden: { opacity: 0, y: _lowPerf ? 6 : 20 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: _lowPerf ? 0.18 : 0.5, delay: _lowPerf ? Math.min(i * 0.02, 0.06) : i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, delay = 0, className = '', as = 'div' }: { children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'section' }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const Component: any = as === 'section' ? motion.section : motion.div;
  return (
    <Component
      ref={ref}
      className={className}
      variants={up}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      custom={delay}
    >
      {children}
    </Component>
  );
}

// ────────────────────────────────────────────────────────────────────
// MOCKUP : Capture rapport Verimo (SVG stylisé)
// ────────────────────────────────────────────────────────────────────
function MockupRapport() {
  return (
    <div style={{
      borderRadius: 16, background: '#fff',
      boxShadow: '0 20px 60px rgba(15,45,61,0.18), 0 4px 12px rgba(15,45,61,0.06)',
      overflow: 'hidden', maxWidth: '100%', position: 'relative' as const,
      border: '1px solid rgba(15,45,61,0.06)',
    }}>
      {/* Browser bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fda4a4' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fcd45d' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#86efac' }} />
        <div style={{ flex: 1, marginLeft: 10, fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>verimo.fr/rapport</div>
      </div>
      {/* Header rapport */}
      <div style={{ padding: '20px 22px', background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', borderBottom: '1px solid #d0e8f0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 4 }}>RAPPORT D'ANALYSE</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>14 rue de la Paix, Paris 8ᵉ</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>Appartement T3 • Copropriété 1925</div>
      </div>
      {/* Score circle */}
      <div style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'conic-gradient(#16a34a 0% 75%, #e2e8f0 75% 100%)', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 8, background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>15</span>
            <span style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>/20</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Bien sain</div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>Copropriété saine, finances équilibrées, peu de travaux à anticiper.</div>
        </div>
      </div>
      {/* KPI cards */}
      <div style={{ padding: '0 22px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Charges/mois', value: '180€', color: '#16a34a' },
          { label: 'Fonds travaux', value: '42 k€', color: '#2a7d9c' },
          { label: 'Procédures', value: '0', color: '#16a34a' },
        ].map((kpi, i) => (
          <div key={i} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 8, border: '1px solid #edf2f7' }}>
            <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2 }}>{kpi.label}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>
      {/* Rows alertes */}
      <div style={{ padding: '0 22px 18px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 8 }}>POINTS DE VIGILANCE</div>
        {[
          { label: 'Ravalement façade voté 2024', value: '12 000€' },
          { label: 'DPE classe E — exigible 2028', value: 'Alerte' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i === 0 ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#0f172a', flex: 1 }}>{r.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9a3412', background: '#fef3c7', padding: '2px 6px', borderRadius: 4 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// MOCKUP : Liste de dossiers (vue mandataire)
// ────────────────────────────────────────────────────────────────────
function MockupDossiers() {
  return (
    <div style={{
      borderRadius: 14, background: '#fff',
      boxShadow: '0 16px 48px rgba(15,45,61,0.14)',
      overflow: 'hidden', position: 'relative' as const,
      border: '1px solid rgba(15,45,61,0.06)',
    }}>
      <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff' }}>
        <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: '0.06em' }}>VERIMO PRO</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 1 }}>Mes dossiers · 8 actifs</div>
      </div>
      {[
        { name: 'Dossier Dupont', addr: 'Bd Voltaire, Paris 11ᵉ', score: 16, color: '#16a34a' },
        { name: 'Dossier Martin', addr: 'Rue Pasteur, Lyon 6ᵉ', score: 12, color: '#f59e0b' },
        { name: 'Dossier Bernard', addr: 'Av. Foch, Neuilly', score: 18, color: '#16a34a' },
      ].map((d, i) => (
        <div key={i} style={{ padding: '12px 16px', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={14} style={{ color: '#2a7d9c' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{d.addr}</div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${d.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: d.color }}>{d.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// MOCKUP : Email reçu par le client (rapport partagé)
// ────────────────────────────────────────────────────────────────────
function MockupEmail() {
  return (
    <div style={{
      borderRadius: 14, background: '#fff',
      boxShadow: '0 16px 48px rgba(15,45,61,0.14)',
      overflow: 'hidden', position: 'relative' as const,
      border: '1px solid rgba(15,45,61,0.06)',
      maxWidth: 360,
    }}>
      <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #edf2f7', fontSize: 11, color: '#64748b' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>Pierre vous a partagé un rapport</span>
        </div>
        <span style={{ fontSize: 10 }}>De : pro@verimo.fr</span>
      </div>
      <div style={{ padding: '20px 18px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>🔍 Votre analyse immobilière est prête</div>
        <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.55, marginBottom: 14 }}>
          Bonjour, voici le rapport d'analyse complet du bien que vous avez visité :
        </div>
        <div style={{ padding: '12px', borderRadius: 10, background: '#f0f7fb', border: '1px solid #d0e8f0', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', marginBottom: 4 }}>📍 14 rue de la Paix, Paris 8ᵉ</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'conic-gradient(#16a34a 0% 75%, #e2e8f0 75% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#16a34a' }}>15</div>
            </div>
            <span style={{ fontSize: 11, color: '#64748b' }}>Score 15/20 — Bien sain</span>
          </div>
        </div>
        <div style={{ background: '#2a7d9c', color: '#fff', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center' as const }}>
          Consulter mon rapport →
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// MOCKUP : ZIP brut (concurrence)
// ────────────────────────────────────────────────────────────────────
function MockupZip() {
  return (
    <div style={{
      borderRadius: 14, background: '#fafafa',
      border: '1.5px dashed #cbd5e1',
      padding: '24px 20px',
      maxWidth: 360,
      position: 'relative' as const,
      opacity: 0.85,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 16 }}>📦</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>documents_appart_paris.zip</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>14,2 Mo · 12 fichiers</div>
        </div>
      </div>
      {[
        'PV_AG_2023.pdf', 'PV_AG_2022.pdf', 'PV_AG_2021.pdf',
        'Reglement_copropriete.pdf', 'DDT_Diagnostic.pdf', 'Charges_2023.pdf',
        '+ 6 autres fichiers...'
      ].map((f, i) => (
        <div key={i} style={{ fontSize: 10.5, color: '#64748b', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#94a3b8' }}>•</span>
          <span>{f}</span>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ────────────────────────────────────────────────────────────────────
export default function MandatairesPage() {
  useSEO({
    title: 'Verimo Pro pour mandataires immobiliers — Analysez vos documents en 3 minutes',
    description: 'Mandataires indépendants : analysez les documents de vos biens en quelques minutes. Arrivez en RDV avec une longueur d\'avance, gagnez plus de mandats exclusifs.',
  });

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: '#fff', color: '#0f172a', overflow: 'hidden' }}>
      {/* ═══════════════════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative' as const,
        background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)',
        padding: '90px 24px 100px',
        overflow: 'hidden',
      }}>
        {/* Cercles décoratifs */}
        <div style={{ position: 'absolute' as const, top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.12), transparent 70%)' }} />
        <div style={{ position: 'absolute' as const, bottom: -120, left: -120, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.08), transparent 70%)' }} />

        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: 60, alignItems: 'center', position: 'relative' as const }}
          className="hero-grid"
        >
          <Reveal>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', borderRadius: 100,
              background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)',
              fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.04em', marginBottom: 22,
            }}>
              <Sparkles size={13} /> POUR MANDATAIRES INDÉPENDANTS
            </div>
            <h1 style={{
              fontSize: 'clamp(32px, 4.4vw, 54px)', fontWeight: 800, lineHeight: 1.08,
              color: '#0f2d3d', margin: '0 0 18px 0', letterSpacing: '-0.02em',
            }}>
              Le mandataire qui maîtrise ses dossiers <span style={{ color: '#2a7d9c' }}>signe plus de mandats.</span>
            </h1>
            <p style={{
              fontSize: 'clamp(15px, 1.4vw, 18px)', lineHeight: 1.6, color: '#475569',
              maxWidth: 540, margin: '0 0 32px 0',
            }}>
              Verimo analyse en quelques minutes les documents de vos biens. Vous arrivez en RDV avec une longueur d'avance — et vous repartez avec le mandat.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 28 }}>
              <a href={CALENDLY_URL}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '14px 26px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff',
                  textDecoration: 'none', fontSize: 14.5, fontWeight: 700,
                  boxShadow: '0 8px 22px rgba(42,125,156,0.32)',
                  transition: 'transform 0.15s',
                }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
              >
                <Calendar size={16} /> Réserver une démo
              </a>
              <button onClick={() => scrollToSection('rapport-apercu')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '14px 22px', borderRadius: 12,
                  background: '#fff', color: '#2a7d9c',
                  border: '1.5px solid #d0e8f0', cursor: 'pointer',
                  fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
                }}
                onMouseOver={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#f0f7fb'; el.style.borderColor = '#2a7d9c'; }}
                onMouseOut={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fff'; el.style.borderColor = '#d0e8f0'; }}
              >
                Voir un rapport exemple ↓
              </button>
            </div>
            {/* Trust signals */}
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' as const, fontSize: 12.5, color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={14} style={{ color: '#16a34a' }} /> Sans engagement
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} style={{ color: '#2a7d9c' }} /> Démo en 15 min
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} style={{ color: '#7c3aed' }} /> 100% spécialisé immo
              </div>
            </div>
          </Reveal>

          {/* Mockup principal */}
          <Reveal delay={0.2}>
            <div style={{ position: 'relative' as const }} className="hero-mockup">
              <div style={{ transform: 'rotate(-1.5deg)' }}>
                <MockupRapport />
              </div>
              {/* Badge flottant */}
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 220 }}
                style={{
                  position: 'absolute' as const, top: -22, right: -10,
                  background: '#fff', borderRadius: 12, padding: '10px 14px',
                  boxShadow: '0 10px 30px rgba(15,45,61,0.18)',
                  border: '1px solid rgba(42,125,156,0.18)',
                  display: 'flex', alignItems: 'center', gap: 9,
                }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={15} style={{ color: '#fff' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>Analyse</div>
                  <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700 }}>3 minutes</div>
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. LE CONSTAT
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 50 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 10 }}>LE CONSTAT</div>
              <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 14px 0', lineHeight: 1.15 }}>
                Mandataire indépendant : votre image fait toute la différence.
              </h2>
              <p style={{ fontSize: 16, color: '#64748b', maxWidth: 620, margin: '0 auto', lineHeight: 1.55 }}>
                Sans manager derrière vous, chaque détail compte pour gagner la confiance des vendeurs et des acheteurs.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 22 }}>
            {[
              {
                icon: '🏠',
                title: 'Le client demande des documents',
                text: '...et reçoit un ZIP de PDFs bruts à éplucher seul. Comme tous vos concurrents.',
              },
              {
                icon: '⏱️',
                title: 'Vous découvrez les pièges en compromis',
                text: 'Travaux votés non réalisés, charges anormales, procédure copro... Trop tard pour ajuster le prix.',
              },
              {
                icon: '🎯',
                title: 'Le vendeur compare vos prestations',
                text: '« Pourquoi vous, et pas l\'agence du coin ? » — sans argument différenciant, on perd l\'exclu.',
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i}>
                <div style={{
                  padding: 26, background: '#fff', borderRadius: 16,
                  border: '1px solid #edf2f7',
                  boxShadow: '0 2px 8px rgba(15,45,61,0.04)',
                  height: '100%', boxSizing: 'border-box' as const,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{item.icon}</div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2d3d', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.55, margin: 0 }}>
                    {item.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. LA SOLUTION (3 étapes)
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, #fafcfd 0%, #f0f7fb 100%)' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 10 }}>LA SOLUTION</div>
              <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 14px 0', lineHeight: 1.15 }}>
                Verimo : votre expert documents, en 3 minutes.
              </h2>
              <p style={{ fontSize: 16, color: '#64748b', maxWidth: 620, margin: '0 auto', lineHeight: 1.55 }}>
                Notre moteur analyse les documents de copropriété et les diagnostics, et vous livre un rapport pro prêt à partager.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 30, position: 'relative' as const }}>
            {[
              {
                num: '01',
                icon: <FileText size={26} style={{ color: '#fff' }} />,
                title: 'Vous déposez les documents',
                text: 'PV d\'AG, règlement de copropriété, diagnostics, appels de charges, carnet d\'entretien, DTG... jusqu\'à 15 documents par bien.',
              },
              {
                num: '02',
                icon: <Eye size={26} style={{ color: '#fff' }} />,
                title: 'Le moteur Verimo analyse',
                text: 'Chiffres clés extraits, alertes détectées, points de vigilance identifiés. Un score sur 20 résume la santé du bien.',
              },
              {
                num: '03',
                icon: <Send size={26} style={{ color: '#fff' }} />,
                title: 'Vous recevez un rapport pro',
                text: 'Clair, structuré, partageable en 1 clic à vos vendeurs et acheteurs. Avec votre nom et votre branding.',
              },
            ].map((step, i) => (
              <Reveal key={i} delay={i}>
                <div style={{ position: 'relative' as const, padding: 28, background: '#fff', borderRadius: 18, boxShadow: '0 4px 16px rgba(15,45,61,0.06)', border: '1px solid #e8f4f8', height: '100%', boxSizing: 'border-box' as const }}>
                  <div style={{ position: 'absolute' as const, top: -22, left: 28, width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 18px rgba(42,125,156,0.32)' }}>
                    {step.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', marginTop: 18, marginBottom: 6 }}>ÉTAPE {step.num}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f2d3d', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                    {step.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. LES 3 MOMENTS (cœur de la brochure)
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '90px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 10 }}>LES 3 MOMENTS DÉCISIFS</div>
              <h2 style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 14px 0', lineHeight: 1.15 }}>
                Là où Verimo change tout.
              </h2>
              <p style={{ fontSize: 16, color: '#64748b', maxWidth: 620, margin: '0 auto', lineHeight: 1.55 }}>
                Trois instants clés du parcours mandataire. Trois moyens concrets de vous démarquer.
              </p>
            </div>
          </Reveal>

          {/* Moment 1 — Avant la visite */}
          <Reveal>
            <MomentCard
              num="01"
              tag="AVANT LA VISITE"
              title="Arrivez chez l'acheteur en mode expert."
              avant="Vous lisez vite les PV dans la voiture, vous découvrez la salle de bain commune avec votre client."
              apres="Vous connaissez les charges, les travaux votés, l'état du fonds travaux, les procédures en cours. Vous présentez le bien comme si vous y habitiez."
              benefit="Effet d'expertise immédiat. Le client se sent en confiance — et vous écoute."
              icon={<Eye size={20} style={{ color: '#fff' }} />}
              mockup={<MockupDossiers />}
              reverse={false}
            />
          </Reveal>

          {/* Moment 2 — Après la visite */}
          <Reveal>
            <MomentCard
              num="02"
              tag="APRÈS LA VISITE"
              title="Quand le client demande les documents, vous envoyez plus qu'un ZIP."
              avant="Vous compressez les PDFs et envoyez un ZIP brut. Le client galère à lire 200 pages de jargon copro."
              apres="Vous envoyez en 1 clic un rapport synthétique avec score /20, alertes et recommandations. Vos concurrents ? Ils envoient toujours leur ZIP."
              benefit="Différenciation immédiate. Le client ne vous oublie pas — et il revient vers vous."
              icon={<Send size={20} style={{ color: '#fff' }} />}
              mockup={
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' as const }}>
                  <div style={{ position: 'relative' as const }}>
                    <div style={{ position: 'absolute' as const, top: -10, left: 8, fontSize: 9, fontWeight: 800, color: '#dc2626', background: '#fef2f2', padding: '3px 9px', borderRadius: 100, border: '1px solid #fecaca', letterSpacing: '0.04em', zIndex: 2 }}>
                      VOS CONCURRENTS
                    </div>
                    <MockupZip />
                  </div>
                  <ArrowRight size={24} style={{ color: '#2a7d9c', flexShrink: 0 }} className="moment-arrow" />
                  <div style={{ position: 'relative' as const }}>
                    <div style={{ position: 'absolute' as const, top: -10, left: 8, fontSize: 9, fontWeight: 800, color: '#15803d', background: '#f0fdf4', padding: '3px 9px', borderRadius: 100, border: '1px solid #bbf7d0', letterSpacing: '0.04em', zIndex: 2 }}>
                      AVEC VERIMO
                    </div>
                    <MockupEmail />
                  </div>
                </div>
              }
              reverse={true}
              fullMockup
            />
          </Reveal>

          {/* Moment 3 — Mandat exclusif */}
          <Reveal>
            <MomentCard
              num="03"
              tag="POUR GAGNER LE MANDAT EXCLUSIF"
              title="Différenciez-vous dès la première rencontre vendeur."
              avant="Vous parlez prix, communication, photos pro, diffusion. Comme tout le monde."
              apres="Vous arrivez avec un rapport d'analyse pro déjà fait sur leur bien. Le vendeur comprend immédiatement votre niveau de service."
              benefit="Vous gagnez l'exclu. Un seul mandat exclusif rentabilise Verimo Starter pour 6 mois."
              icon={<Handshake size={20} style={{ color: '#fff' }} />}
              mockup={<MockupRapport />}
              reverse={false}
            />
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. APERÇU RAPPORT
      ═══════════════════════════════════════════════════════════ */}
      <section id="rapport-apercu" style={{
        padding: '90px 24px',
        background: 'linear-gradient(165deg, #f0f7fb 0%, #e6f3f7 100%)',
        position: 'relative' as const,
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 50 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 10 }}>APERÇU DU RAPPORT</div>
              <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 14px 0', lineHeight: 1.15 }}>
                Ce que reçoivent vos clients.
              </h2>
              <p style={{ fontSize: 16, color: '#64748b', maxWidth: 620, margin: '0 auto', lineHeight: 1.55 }}>
                Un rapport clair, structuré, avec les éléments essentiels que tout acheteur (et tout vendeur) veut comprendre.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: 50, alignItems: 'center' }} className="apercu-grid">
            <Reveal>
              <div style={{ position: 'relative' as const }}>
                <MockupRapport />
              </div>
            </Reveal>
            <Reveal delay={1}>
              <div>
                {[
                  { icon: <Target size={18} />, label: 'Score /20', desc: 'Synthèse en 2 secondes : sain, vigilant, ou risqué.' },
                  { icon: <AlertTriangle size={18} />, label: 'Travaux votés', desc: 'Ce que le vendeur ne vous dit pas (toujours).' },
                  { icon: <ShieldCheck size={18} />, label: 'Procédures copro', desc: 'Pièges juridiques détectés automatiquement.' },
                  { icon: <BarChart3 size={18} />, label: 'Charges & Finances', desc: 'État du fonds travaux, charges anormales, dette copro.' },
                  { icon: <Star size={18} />, label: 'Verdict & recommandations', desc: 'Une analyse claire pour orienter votre client.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: i < 4 ? '1px solid rgba(15,45,61,0.08)' : 'none' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(42,125,156,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#2a7d9c' }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2d3d', marginBottom: 2 }}>{item.label}</div>
                      <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.55 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. TARIFS + ROI
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '90px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 50 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 10 }}>TARIFS PRO</div>
              <h2 style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 14px 0', lineHeight: 1.15 }}>
                Combien Verimo vous rapporte vraiment.
              </h2>
              <p style={{ fontSize: 16, color: '#64748b', maxWidth: 620, margin: '0 auto', lineHeight: 1.55 }}>
                Un seul mandat signé grâce à Verimo, et l'investissement annuel est rentabilisé.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 22, marginBottom: 40 }}>
            {[
              { name: 'Découverte', price: '19,90', completes: 1, simples: 3, tag: 'Pour démarrer', popular: false },
              { name: 'Starter', price: '49,90', completes: 5, simples: 15, tag: 'Le plus choisi', popular: true },
              { name: 'Power', price: '89,90', completes: 10, simples: 30, tag: 'Volume', popular: false },
            ].map((plan, i) => (
              <Reveal key={i} delay={i}>
                <div style={{
                  padding: 30, borderRadius: 18,
                  background: plan.popular ? 'linear-gradient(165deg, #f0f7fb 0%, #e6f3f7 100%)' : '#fff',
                  border: plan.popular ? '2px solid #2a7d9c' : '1px solid #edf2f7',
                  position: 'relative' as const,
                  height: '100%', boxSizing: 'border-box' as const,
                  boxShadow: plan.popular ? '0 14px 38px rgba(42,125,156,0.18)' : '0 2px 8px rgba(15,45,61,0.04)',
                }}>
                  {plan.popular && (
                    <div style={{
                      position: 'absolute' as const, top: -12, left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff',
                      padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                      boxShadow: '0 4px 12px rgba(42,125,156,0.32)',
                    }}>
                      ⭐ POPULAIRE
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 8 }}>{plan.tag.toUpperCase()}</div>
                  <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f2d3d', margin: '0 0 16px 0' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 22 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#0f2d3d' }}>{plan.price}€</span>
                    <span style={{ fontSize: 14, color: '#64748b' }}>HT/mois</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(15,45,61,0.08)', paddingTop: 18, marginBottom: 18 }}>
                    {[
                      `${plan.completes} analyse${plan.completes > 1 ? 's' : ''} complète${plan.completes > 1 ? 's' : ''} / mois`,
                      `${plan.simples} analyses simples / mois`,
                      'Rapports partageables en 1 clic',
                      'Marque Verimo Pro',
                      'Achat à l\'unité possible',
                    ].map((feat, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', fontSize: 13.5, color: '#475569' }}>
                        <Check size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* ROI banner */}
          <Reveal>
            <div style={{
              background: 'linear-gradient(135deg, #0f2d3d, #1d5e7a)', color: '#fff',
              padding: '32px 36px', borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 30, flexWrap: 'wrap' as const,
              position: 'relative' as const, overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute' as const, top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(125,211,252,0.1)' }} />
              <div style={{ flex: 1, minWidth: 280, position: 'relative' as const }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#7dd3fc', letterSpacing: '0.06em', marginBottom: 8 }}>RETOUR SUR INVESTISSEMENT</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  Une commission moyenne = 4 000 à 8 000€.
                </h3>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, margin: 0 }}>
                  Verimo Starter = 49,90€/mois (598€/an). <strong style={{ color: '#7dd3fc' }}>Vous calculez.</strong>
                </p>
              </div>
              <div style={{ position: 'relative' as const }}>
                <a href={CALENDLY_URL}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '14px 24px', borderRadius: 12,
                    background: '#fff', color: '#0f2d3d',
                    textDecoration: 'none', fontSize: 14.5, fontWeight: 700,
                    boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
                    whiteSpace: 'nowrap' as const,
                  }}>
                  <Calendar size={16} /> Réserver une démo
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          7. CTA FINAL
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '90px 24px', background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)', position: 'relative' as const, overflow: 'hidden' }}>
        <div style={{ position: 'absolute' as const, top: -100, left: -100, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.12), transparent 70%)' }} />
        <div style={{ position: 'absolute' as const, bottom: -100, right: -100, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.08), transparent 70%)' }} />

        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' as const, position: 'relative' as const }}>
          <Reveal>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', borderRadius: 100,
              background: 'rgba(42,125,156,0.1)', border: '1px solid rgba(42,125,156,0.22)',
              fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.04em', marginBottom: 22,
            }}>
              <TrendingUp size={13} /> PRÊT À PASSER À LA VITESSE SUPÉRIEURE ?
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 18px 0', lineHeight: 1.15 }}>
              Devenez le mandataire de référence dans votre secteur.
            </h2>
            <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.6, margin: '0 auto 32px', maxWidth: 580 }}>
              Réservez une démo gratuite de 15 minutes. Vous repartez avec une analyse offerte sur l'un de vos biens en cours.
            </p>
            <a href={CALENDLY_URL}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '17px 34px', borderRadius: 14,
                background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff',
                textDecoration: 'none', fontSize: 16, fontWeight: 700,
                boxShadow: '0 10px 28px rgba(42,125,156,0.35)',
                transition: 'transform 0.15s',
              }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
            >
              <Calendar size={18} /> Réserver ma démo gratuite (15 min)
              <ChevronRight size={18} />
            </a>
            <div style={{ marginTop: 22, fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'center', gap: 22, flexWrap: 'wrap' as const }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={13} style={{ color: '#16a34a' }} /> Sans engagement</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={13} style={{ color: '#16a34a' }} /> 1 analyse offerte</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={13} style={{ color: '#16a34a' }} /> 100% confidentiel</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          STYLES MOBILE
      ═══════════════════════════════════════════════════════════ */}
      <style>{`
        @media (max-width: 920px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .apercu-grid { grid-template-columns: 1fr !important; gap: 30px !important; }
          .moment-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .moment-grid.reverse { grid-template-columns: 1fr !important; }
          .moment-grid.reverse > div:first-child { order: 1 !important; }
          .moment-arrow { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// COMPOSANT : Carte d'un "moment" (avant/avec)
// ────────────────────────────────────────────────────────────────────
function MomentCard({ num, tag, title, avant, apres, benefit, icon, mockup, reverse, fullMockup }: {
  num: string;
  tag: string;
  title: string;
  avant: string;
  apres: string;
  benefit: string;
  icon: React.ReactNode;
  mockup: React.ReactNode;
  reverse: boolean;
  fullMockup?: boolean;
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: reverse ? 'minmax(0, 1.05fr) minmax(0, 0.95fr)' : 'minmax(0, 0.95fr) minmax(0, 1.05fr)',
      gap: 50, alignItems: 'center',
      marginBottom: 80,
    }}
      className={`moment-grid ${reverse ? 'reverse' : ''}`}
    >
      {/* Mockup */}
      <div style={{ order: reverse ? 1 : 0, display: 'flex', justifyContent: 'center' }}>
        {mockup}
      </div>

      {/* Texte */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 16px rgba(42,125,156,0.28)' }}>
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>MOMENT {num}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.05em' }}>{tag}</div>
          </div>
        </div>
        <h3 style={{ fontSize: 'clamp(22px, 2.6vw, 28px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 22px 0', lineHeight: 1.2 }}>
          {title}
        </h3>

        {/* Avant */}
        <div style={{ padding: '14px 16px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', letterSpacing: '0.06em', marginBottom: 6 }}>SANS VERIMO</div>
          <div style={{ fontSize: 14, color: '#7f1d1d', lineHeight: 1.55 }}>{avant}</div>
        </div>

        {/* Avec */}
        <div style={{ padding: '14px 16px', borderRadius: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#15803d', letterSpacing: '0.06em', marginBottom: 6 }}>AVEC VERIMO</div>
          <div style={{ fontSize: 14, color: '#14532d', lineHeight: 1.55 }}>{apres}</div>
        </div>

        {/* Benefit */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(42,125,156,0.06)', border: '1px solid rgba(42,125,156,0.18)' }}>
          <Sparkles size={16} style={{ color: '#2a7d9c', flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13.5, color: '#0f2d3d', fontWeight: 600, lineHeight: 1.5 }}>{benefit}</div>
        </div>
      </div>
    </div>
  );
}
