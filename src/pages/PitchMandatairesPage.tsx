import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useSEO } from '../hooks/useSEO';

// ════════════════════════════════════════════════════════════════════
// PITCH MANDATAIRES — Page premium type Stripe/Vercel
// Plein écran, sans navbar publique, design dark + écrans incurvés
// ════════════════════════════════════════════════════════════════════

// ─── Aurora arrière-plan animée ─────────────────────────────────
function AuroraBackground({ variant = 'default' }: { variant?: 'default' | 'red' | 'green' | 'purple' }) {
  const palettes = {
    default: ['#1e40af', '#0891b2', '#7c3aed'],
    red: ['#dc2626', '#f97316', '#7c3aed'],
    green: ['#16a34a', '#0891b2', '#38bdf8'],
    purple: ['#7c3aed', '#a855f7', '#38bdf8'],
  };
  const colors = palettes[variant];

  return (
    <>
      <motion.div
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{ duration: 22, ease: 'easeInOut', repeat: Infinity }}
        style={{
          position: 'absolute', top: '-15%', left: '5%',
          width: 700, height: 700, borderRadius: '50%',
          background: `radial-gradient(circle, ${colors[0]} 0%, transparent 55%)`,
          filter: 'blur(80px)', opacity: 0.5, pointerEvents: 'none' as const,
        }}
      />
      <motion.div
        animate={{
          x: [0, -60, 50, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 28, ease: 'easeInOut', repeat: Infinity }}
        style={{
          position: 'absolute', top: '20%', right: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${colors[1]} 0%, transparent 55%)`,
          filter: 'blur(80px)', opacity: 0.4, pointerEvents: 'none' as const,
        }}
      />
      <motion.div
        animate={{
          x: [0, 40, -50, 0],
          y: [0, -40, 60, 0],
        }}
        transition={{ duration: 25, ease: 'easeInOut', repeat: Infinity }}
        style={{
          position: 'absolute', bottom: '-20%', left: '30%',
          width: 700, height: 500, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${colors[2]} 0%, transparent 55%)`,
          filter: 'blur(90px)', opacity: 0.35, pointerEvents: 'none' as const,
        }}
      />
    </>
  );
}

// ─── Grille subtile en overlay ──────────────────────────────────
function GridOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      backgroundSize: '50px 50px',
      maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
      pointerEvents: 'none' as const,
    }} />
  );
}

// ─── Eyebrow réutilisable ───────────────────────────────────────
function Eyebrow({ children, color = '#7dd3fc' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 9,
      padding: '7px 16px',
      background: `${color}15`, border: `1px solid ${color}40`,
      color, fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
      textTransform: 'uppercase' as const, borderRadius: 100,
    }}>
      <motion.span
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {children}
    </div>
  );
}

// ─── Brand mark (en haut à gauche de chaque section)  ───────────
function BrandMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: 'linear-gradient(135deg, #38bdf8, #0c447c)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, fontWeight: 800,
        boxShadow: '0 6px 18px rgba(56,189,248,0.45)',
      }}>V</div>
      <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em', color: '#fff' }}>Verimo</div>
      <div style={{
        display: 'inline-flex', padding: '4px 11px',
        background: 'rgba(125,211,252,0.15)', border: '1px solid rgba(125,211,252,0.3)',
        color: '#7dd3fc', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
        borderRadius: 100,
      }}>PRO</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 1 — HERO avec dashboard incurvé en perspective
// ════════════════════════════════════════════════════════════════════
function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const dashboardRotate = useTransform(scrollYProgress, [0, 1], [-22, -10]);
  const dashboardY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section ref={ref} style={{
      position: 'relative' as const,
      minHeight: '100vh',
      background: '#050912',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '80px 0',
    }}>
      <AuroraBackground variant="default" />
      <GridOverlay />

      {/* Brand en haut à gauche */}
      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}>
        <BrandMark />
      </div>

      {/* Page indicator droite */}
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        01 / 10
      </div>

      <div style={{
        position: 'relative' as const, zIndex: 5,
        maxWidth: 1400, margin: '0 auto', width: '100%',
        padding: '0 64px',
        display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 60, alignItems: 'center',
      }} className="pitch-hero-grid">
        {/* Colonne gauche : texte */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ marginBottom: 28 }}>
            <Eyebrow>Pour mandataires immobiliers</Eyebrow>
          </div>
          <h1 style={{
            fontSize: 'clamp(48px, 6vw, 78px)', fontWeight: 800, lineHeight: 0.98,
            letterSpacing: '-0.04em', color: '#fff', margin: '0 0 28px',
          }}>
            Décryptez<br />
            les documents.<br />
            <span style={{
              background: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 50%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>Closez les ventes.</span>
          </h1>
          <p style={{
            fontSize: 'clamp(15px, 1.4vw, 19px)', color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.55, margin: '0 0 40px', maxWidth: 540,
          }}>
            L'outil qui transforme vos heures de lecture juridique en rapports clients prêts à envoyer. En 5 minutes. À votre image.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' as const }}>
            {[
              { label: 'Documents analysés', value: '14 types' },
              { label: 'Temps moyen', value: '~5 min' },
              { label: 'À votre image', value: '100%' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                <span style={{ fontSize: 10.5, color: 'rgba(125,211,252,0.6)',
                  letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontWeight: 700 }}>{s.label}</span>
                <span style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Colonne droite : dashboard incurvé en perspective */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative' as const,
            perspective: '1800px',
          }}
        >
          <motion.div
            style={{
              transformStyle: 'preserve-3d' as const,
              rotateY: dashboardRotate,
              rotateX: 8,
              rotateZ: -2,
              y: dashboardY,
            }}
          >
            <DashboardMockup />
          </motion.div>

          {/* Glow autour du dashboard */}
          <div style={{
            position: 'absolute' as const, inset: -60,
            background: 'radial-gradient(circle, rgba(56,189,248,0.25), transparent 60%)',
            filter: 'blur(50px)', zIndex: -1, pointerEvents: 'none' as const,
          }} />
        </motion.div>
      </div>

      {/* Scroll indicator en bas */}
      <motion.div
        animate={{ y: [0, 12, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute' as const, bottom: 30, left: '50%', transform: 'translateX(-50%)',
          fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.15em', textTransform: 'uppercase' as const,
          display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8,
        }}>
        <span>Scroll</span>
        <div style={{ width: 1, height: 32, background: 'linear-gradient(180deg, rgba(255,255,255,0.5), transparent)' }} />
      </motion.div>
    </section>
  );
}

// ─── Mockup dashboard Verimo réutilisable ───────────────────────
function DashboardMockup() {
  return (
    <div style={{
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 60px 120px rgba(0,0,0,0.5), 0 25px 50px rgba(56,189,248,0.15), 0 0 0 1px rgba(255,255,255,0.05) inset',
    }}>
      {/* Browser bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fda4a4' }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fde68a' }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#86efac' }} />
        <div style={{ marginLeft: 14, padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
          borderRadius: 7, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
          app.verimo.fr/rapport/42-lecourbe
        </div>
      </div>

      {/* Browser content */}
      <div style={{ padding: 22, background: 'linear-gradient(180deg, #fafcfd, #f0f7fb)' }}>
        {/* Header dashboard */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f2d3d', marginBottom: 3 }}>42 rue Lecourbe, 75015</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Appartement T3 · 68 m² Carrez</div>
          </div>
          <div style={{ padding: '5px 11px', background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 100, letterSpacing: '0.06em' }}>
            ✓ ANALYSÉ
          </div>
        </div>

        {/* Score */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1px solid #bbf7d0', borderRadius: 13,
          padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 14,
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#15803d', fontWeight: 800,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 3 }}>Score Verimo</div>
            <div style={{ fontSize: 11, color: '#16a34a' }}>Bien sans alerte majeure</div>
          </div>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#15803d',
            letterSpacing: '-0.03em', lineHeight: 1 }}>16<span style={{ fontSize: 20, color: '#22c55e' }}>/20</span></div>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
          {[
            { icon: '📄', name: 'Diagnostics · DPE D', status: 'OK', color: '#dcfce7', textColor: '#15803d' },
            { icon: '📋', name: 'PV d\'AG · 3 dernières années', status: '!', color: '#fef3c7', textColor: '#92400e' },
            { icon: '📑', name: 'Règlement de copropriété', status: 'OK', color: '#dcfce7', textColor: '#15803d' },
            { icon: '💰', name: 'Pré-état daté · 2 840 €/an', status: 'OK', color: '#dcfce7', textColor: '#15803d' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px',
              background: '#fff', border: '1px solid #edf2f7', borderRadius: 10,
            }}>
              <div style={{ width: 28, height: 28, borderRadius: 7,
                background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, flexShrink: 0 }}>{row.icon}</div>
              <div style={{ flex: 1, fontSize: 12, color: '#0f2d3d', fontWeight: 600 }}>{row.name}</div>
              <div style={{ fontSize: 10, fontWeight: 800, padding: '3px 9px',
                borderRadius: 100, background: row.color, color: row.textColor }}>{row.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 2 — LE PROBLÈME avec iPhone notification animée
// ════════════════════════════════════════════════════════════════════
function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });

  return (
    <section ref={ref} style={{
      position: 'relative' as const,
      minHeight: '100vh',
      background: '#050912',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '120px 0',
    }}>
      <AuroraBackground variant="red" />
      <GridOverlay />

      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}>
        <BrandMark />
      </div>
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        02 / 10
      </div>

      <div style={{
        position: 'relative' as const, zIndex: 5,
        maxWidth: 1400, margin: '0 auto', width: '100%',
        padding: '0 64px',
        display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 60, alignItems: 'center',
      }} className="pitch-grid-2col">

        {/* Gauche : texte */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ marginBottom: 28 }}>
            <Eyebrow color="#f87171">Le problème · Ce moment, vous le connaissez</Eyebrow>
          </div>
          <h2 style={{
            fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 800, lineHeight: 1.02,
            letterSpacing: '-0.035em', color: '#fff', margin: '0 0 26px',
          }}>
            Une visite.<br />
            Une question.<br />
            <span style={{
              background: 'linear-gradient(135deg, #fca5a5, #f87171)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>4 heures perdues.</span>
          </h2>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 0 30px',
          }}>
            Le client veut les documents. Vous compilez, vérifiez, mettez en page, envoyez. Pendant ce temps, le mandat vous échappe.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {[
              { icon: '📁', text: 'Retrouver et compiler les PDF du syndic', time: '~45 min' },
              { icon: '🔍', text: 'Vérifier que tout est lisible et à jour', time: '~30 min' },
              { icon: '📤', text: 'Préparer un envoi pro et lisible', time: '~1h' },
              { icon: '💬', text: 'Répondre aux questions du client', time: '~1h30' },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 13,
                  padding: '14px 18px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 9,
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(220,38,38,0.05))',
                  border: '1px solid rgba(220,38,38,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, flexShrink: 0 }}>{p.icon}</div>
                <div style={{ flex: 1, fontSize: 13.5, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{p.text}</div>
                <div style={{ fontSize: 13, color: '#fca5a5', fontWeight: 800, fontFamily: 'monospace' }}>{p.time}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Droite : iPhone avec notification */}
        <motion.div
          initial={{ opacity: 0, x: 40, rotateY: -25 }}
          animate={inView ? { opacity: 1, x: 0, rotateY: -12 } : {}}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            position: 'relative' as const,
            perspective: '1500px',
          }}
        >
          <PhoneMockupNotification />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Mockup iPhone avec notification ────────────────────────────
function PhoneMockupNotification() {
  return (
    <div style={{
      position: 'relative' as const,
      transformStyle: 'preserve-3d' as const,
      transform: 'rotateY(-12deg) rotateX(5deg) rotateZ(-3deg)',
      width: 300,
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute' as const, inset: -40,
        background: 'radial-gradient(circle, rgba(248,113,113,0.3), transparent 60%)',
        filter: 'blur(50px)', zIndex: -1, pointerEvents: 'none' as const,
      }} />

      {/* Phone frame */}
      <div style={{
        background: 'linear-gradient(180deg, #1a1a1f, #0a0a0f)',
        borderRadius: 38,
        padding: 12,
        boxShadow: '0 60px 120px rgba(0,0,0,0.6), 0 25px 50px rgba(248,113,113,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
          borderRadius: 28, overflow: 'hidden', position: 'relative' as const,
          height: 580, padding: '44px 18px 20px',
        }}>
          {/* Notch */}
          <div style={{
            position: 'absolute' as const, top: 12, left: '50%', transform: 'translateX(-50%)',
            width: 105, height: 24, background: '#0a0a0f', borderRadius: 14, zIndex: 10,
          }} />

          {/* Time */}
          <div style={{ textAlign: 'center' as const, fontSize: 12, color: '#0f2d3d',
            fontWeight: 700, letterSpacing: '0.05em', marginBottom: 110 }}>
            19:34 · Mardi 14 mai
          </div>

          {/* Notification with pulse */}
          <motion.div
            animate={{ scale: [1, 1.02, 1], boxShadow: [
              '0 10px 30px rgba(15,45,61,0.15)',
              '0 15px 40px rgba(248,113,113,0.3)',
              '0 10px 30px rgba(15,45,61,0.15)',
            ] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: 18, padding: '15px 17px',
              border: '0.5px solid rgba(0,0,0,0.05)',
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6,
                background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800 }}>M</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0f2d3d', flex: 1 }}>Messages — Client</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>à l'instant</div>
            </div>
            <div style={{ fontSize: 12.5, color: '#0f2d3d', lineHeight: 1.45, fontWeight: 600 }}>
              Bonjour ! J'ai beaucoup aimé l'appartement 👍
              <div style={{ fontStyle: 'italic' as const, fontWeight: 500, color: '#475569',
                marginTop: 5, fontSize: 12 }}>
                "Pourriez-vous m'envoyer les 3 derniers PV d'AG, le DTG et les diagnostics ? Merci !"
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 3 — VERIMO C'EST QUOI avec dashboard analyse temps réel
// ════════════════════════════════════════════════════════════════════
function WhatIsVerimoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });

  return (
    <section ref={ref} style={{
      position: 'relative' as const,
      minHeight: '100vh',
      background: '#050912',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      padding: '120px 0',
    }}>
      <AuroraBackground variant="default" />
      <GridOverlay />

      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}>
        <BrandMark />
      </div>
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        03 / 10
      </div>

      <div style={{
        position: 'relative' as const, zIndex: 5,
        maxWidth: 1400, margin: '0 auto', width: '100%',
        padding: '0 64px',
        display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 60, alignItems: 'center',
      }} className="pitch-grid-2col">

        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div style={{ marginBottom: 26 }}>
            <Eyebrow>Verimo, en une phrase</Eyebrow>
          </div>
          <h2 style={{
            fontSize: 'clamp(38px, 4.8vw, 58px)', fontWeight: 800, lineHeight: 1.02,
            letterSpacing: '-0.035em', color: '#fff', margin: '0 0 26px',
          }}>
            Vous chargez.<br />
            Verimo{' '}
            <span style={{
              background: 'linear-gradient(135deg, #7dd3fc, #38bdf8)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>décrypte tout.</span>
          </h2>
          <p style={{
            fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: '0 0 30px', maxWidth: 470,
          }}>
            Notre moteur d'analyse extrait, synthétise et structure tous les documents juridiques et techniques d'un bien — en quelques minutes seulement.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 13 }}>
            {[
              { num: '1', text: '14 types de documents reconnus automatiquement' },
              { num: '2', text: 'Synthèse claire avec points de vigilance détectés' },
              { num: '3', text: 'Rapport partageable en un clic, à votre marque' },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.12 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  background: 'rgba(125,211,252,0.06)',
                  border: '1px solid rgba(125,211,252,0.18)',
                  borderRadius: 12,
                }}>
                <div style={{ width: 34, height: 34, borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(125,211,252,0.25), rgba(56,189,248,0.1))',
                  border: '1px solid rgba(125,211,252,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: '#7dd3fc', flexShrink: 0 }}>{p.num}</div>
                <div style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600, lineHeight: 1.4 }}>{p.text}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: -25 }}
          animate={inView ? { opacity: 1, x: 0, rotateY: -15 } : {}}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'relative' as const,
            perspective: '1600px',
            transformStyle: 'preserve-3d' as const,
          }}
        >
          <div style={{
            transformStyle: 'preserve-3d' as const,
            transform: 'rotateY(-15deg) rotateX(4deg)',
          }}>
            <AnalysisDashboard />
          </div>
          <div style={{
            position: 'absolute' as const, inset: -40,
            background: 'radial-gradient(circle, rgba(125,211,252,0.3), transparent 60%)',
            filter: 'blur(50px)', zIndex: -1, pointerEvents: 'none' as const,
          }} />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Dashboard analyse temps réel ───────────────────────────────
function AnalysisDashboard() {
  return (
    <div style={{
      background: 'rgba(15,23,42,0.7)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 60px 120px rgba(0,0,0,0.5), 0 25px 50px rgba(56,189,248,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fda4a4' }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fde68a' }} />
        <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#86efac' }} />
        <div style={{ marginLeft: 14, padding: '6px 14px', background: 'rgba(255,255,255,0.05)',
          borderRadius: 7, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
          app.verimo.fr/analyse · en cours
        </div>
      </div>

      <div style={{ padding: 20, background: 'linear-gradient(165deg, #fafcfd, #f0f7fb)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #edf2f7' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f2d3d', marginBottom: 3 }}>Analyse en cours</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>12 documents · Moteur Verimo v3.2</div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontSize: 10, color: '#2a7d9c', fontWeight: 800,
              letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 5 }}>70%</div>
            <div style={{ width: 110, height: 6, background: '#e2e8f0', borderRadius: 100,
              overflow: 'hidden', position: 'relative' as const }}>
              <motion.div
                animate={{ width: ['0%', '70%', '70%'] }}
                transition={{ duration: 3, ease: 'easeOut' }}
                style={{
                  position: 'absolute' as const, left: 0, top: 0, bottom: 0,
                  background: 'linear-gradient(90deg, #2a7d9c, #7dd3fc)', borderRadius: 100,
                }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 9 }}>
          {[
            { icon: '📄', name: 'DDT · Dossier diagnostic', sub: '12 diagnostics · DPE D', status: 'OK', bg: 'linear-gradient(90deg, #f0fdf4, #fff 60%)', borderColor: '#bbf7d0', statusColor: '#16a34a' },
            { icon: '📋', name: "PV d'AG (3 dernières)", sub: '2 travaux votés · 8 400 €', status: 'VIGILANCE', bg: 'linear-gradient(90deg, #fffbeb, #fff 60%)', borderColor: '#fde68a', statusColor: '#d97706' },
            { icon: '📑', name: 'Règlement copro', sub: 'Usage libre, sans clause', status: 'OK', bg: 'linear-gradient(90deg, #f0fdf4, #fff 60%)', borderColor: '#bbf7d0', statusColor: '#16a34a' },
            { icon: '📚', name: "Carnet d'entretien", sub: 'Extraction en cours...', status: 'EN COURS', bg: 'linear-gradient(90deg, #f0f7fb, #fff 60%)', borderColor: '#7dd3fc', statusColor: '#0284c7' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              background: row.bg, border: `1px solid ${row.borderColor}`, borderRadius: 11,
              boxShadow: row.status === 'EN COURS' ? '0 0 0 3px rgba(125,211,252,0.15)' : 'none',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 8,
                background: '#f0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0 }}>{row.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f2d3d', marginBottom: 2 }}>{row.name}</div>
                <div style={{ fontSize: 10.5, color: '#64748b' }}>{row.sub}</div>
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 800, padding: '4px 9px',
                borderRadius: 100, background: row.statusColor, color: '#fff', letterSpacing: '0.05em' }}>{row.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 4 — 3 ÉTAPES (cartes glassmorphism)
// ════════════════════════════════════════════════════════════════════
function ThreeStepsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });

  const steps = [
    { num: '01', icon: '📥', title: 'Vous chargez les documents', desc: "Glissez-déposez les PDF du bien : DDT, PV d'AG, règlement, diagnostics. Tous formats acceptés.", time: '⏱ 30 secondes' },
    { num: '02', icon: '⚙', title: 'Verimo analyse tout', desc: "Notre moteur extrait les infos clés et identifie les points de vigilance. Suivi en temps réel.", time: '⏱ 2 à 3 minutes' },
    { num: '03', icon: '📤', title: 'Vous envoyez au client', desc: "Un lien partagé en un clic. Le client lit, comprend, décide. Vous êtes déjà ailleurs.", time: '⏱ 1 clic' },
  ];

  return (
    <section ref={ref} style={{
      position: 'relative' as const, minHeight: '100vh', background: '#050912',
      overflow: 'hidden', padding: '120px 0',
    }}>
      <AuroraBackground variant="purple" />
      <GridOverlay />

      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}><BrandMark /></div>
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        04 / 10
      </div>

      <div style={{ position: 'relative' as const, zIndex: 5, maxWidth: 1400, margin: '0 auto',
        padding: '0 64px', textAlign: 'center' as const, marginTop: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}>
          <div style={{ display: 'inline-block', marginBottom: 18 }}>
            <Eyebrow>Comment ça marche</Eyebrow>
          </div>
          <h2 style={{
            fontSize: 'clamp(38px, 4.8vw, 56px)', fontWeight: 800, lineHeight: 1,
            letterSpacing: '-0.035em', color: '#fff', margin: '0 0 16px',
          }}>
            Trois étapes.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #7dd3fc, #38bdf8)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>Trois minutes.</span>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', maxWidth: 600, margin: '0 auto 60px' }}>
            Si vous savez glisser un fichier dans un dossier, vous savez utiliser Verimo.
          </p>
        </motion.div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
          position: 'relative' as const,
        }} className="pitch-grid-3col">
          {/* Ligne de connexion entre étapes */}
          <div style={{
            position: 'absolute' as const, top: '50%', left: '15%', right: '15%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(125,211,252,0.4) 20%, rgba(125,211,252,0.4) 80%, transparent)',
            zIndex: 0,
          }} />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20, padding: '32px 28px',
                position: 'relative' as const, overflow: 'hidden',
                textAlign: 'left' as const, zIndex: 1,
              }}>
              <div style={{
                position: 'absolute' as const, top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, transparent, #7dd3fc, transparent)',
              }} />
              <div style={{
                position: 'absolute' as const, top: 22, right: 26,
                fontSize: 56, fontWeight: 800, color: 'rgba(125,211,252,0.12)',
                letterSpacing: '-0.05em', lineHeight: 1,
              }}>{step.num}</div>

              <div style={{
                width: 58, height: 58, borderRadius: 14, marginBottom: 20,
                background: 'linear-gradient(135deg, rgba(125,211,252,0.2), rgba(56,189,248,0.05))',
                border: '1px solid rgba(125,211,252,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26,
              }}>{step.icon}</div>

              <h3 style={{
                fontSize: 21, fontWeight: 800, color: '#fff',
                letterSpacing: '-0.015em', margin: '0 0 12px', lineHeight: 1.2,
              }}>{step.title}</h3>
              <p style={{
                fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 18px',
              }}>{step.desc}</p>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 12px',
                background: 'rgba(125,211,252,0.1)', border: '1px solid rgba(125,211,252,0.25)',
                borderRadius: 100, fontSize: 11, fontWeight: 700, color: '#7dd3fc',
              }}>{step.time}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 5 — 6 SITUATIONS (grille glassmorphism)
// ════════════════════════════════════════════════════════════════════
function SituationsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });

  const situations = [
    { icon: '📞', title: 'Le client demande les docs', desc: 'Rapport pro envoyé en 5 min. Le client a la réponse avant votre concurrent.', benefit: 'Réactivité maximale', color: '#38bdf8' },
    { icon: '🏠', title: 'Vous allez en visite', desc: 'Vous arrivez en connaissant le bien parfaitement : DPE, charges, travaux, copro.', benefit: 'Maîtrise du dossier', color: '#a855f7' },
    { icon: '⚠', title: 'Vous repérez un blocage', desc: 'Procédure judiciaire, fonds travaux faibles, DPE F : repérés avant que ça plante.', benefit: 'Anticipation', color: '#f59e0b' },
    { icon: '💬', title: 'Vous répondez en RDV', desc: 'Question pointue sur les charges ou travaux ? Synthèse à portée de main.', benefit: 'Crédibilité', color: '#10b981' },
    { icon: '🤝', title: 'Vous rassurez un client', desc: 'Pas un commercial qui parle : des faits chiffrés, sourcés, opposables.', benefit: 'Confiance', color: '#06b6d4' },
    { icon: '📊', title: 'Vous négociez le prix', desc: 'Arguments chiffrés issus du DTG, PV d\'AG : pour défendre ou justifier.', benefit: 'Arguments solides', color: '#ef4444' },
  ];

  return (
    <section ref={ref} style={{
      position: 'relative' as const, minHeight: '100vh', background: '#050912',
      overflow: 'hidden', padding: '120px 0',
    }}>
      <AuroraBackground variant="default" />
      <GridOverlay />

      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}><BrandMark /></div>
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        05 / 10
      </div>

      <div style={{ position: 'relative' as const, zIndex: 5, maxWidth: 1400, margin: '0 auto',
        padding: '80px 64px 0' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }} style={{ marginBottom: 50 }}>
          <div style={{ marginBottom: 16 }}>
            <Eyebrow>Tous vos moments clés</Eyebrow>
          </div>
          <h2 style={{
            fontSize: 'clamp(34px, 4.2vw, 50px)', fontWeight: 800, letterSpacing: '-0.035em',
            color: '#fff', lineHeight: 1.05, margin: 0,
          }}>
            6 situations où Verimo<br />
            <span style={{
              background: 'linear-gradient(135deg, #7dd3fc, #38bdf8)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>fait la différence.</span>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }} className="pitch-grid-3col">
          {situations.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16, padding: '24px 24px',
                position: 'relative' as const, overflow: 'hidden',
              }}>
              <div style={{
                position: 'absolute' as const, top: -50, left: -50, width: 150, height: 150,
                borderRadius: '50%', filter: 'blur(40px)', opacity: 0.4,
                background: `radial-gradient(circle, ${s.color}, transparent)`,
              }} />
              <div style={{
                width: 46, height: 46, borderRadius: 12, marginBottom: 16,
                background: `${s.color}25`, border: `1px solid ${s.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, position: 'relative' as const, zIndex: 1,
              }}>{s.icon}</div>
              <h3 style={{
                fontSize: 16, fontWeight: 800, color: '#fff',
                letterSpacing: '-0.01em', lineHeight: 1.25, margin: '0 0 10px',
              }}>{s.title}</h3>
              <p style={{
                fontSize: 12.5, color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.55, margin: '0 0 16px',
              }}>{s.desc}</p>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 11px', borderRadius: 100,
                background: `${s.color}25`, color: s.color,
                fontSize: 10.5, fontWeight: 700,
              }}>→ {s.benefit}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 6 — EXPÉRIENCE CLIENT avec gros iPhone
// ════════════════════════════════════════════════════════════════════
function ClientExperienceSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });

  return (
    <section ref={ref} style={{
      position: 'relative' as const, minHeight: '100vh', background: '#050912',
      overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '120px 0',
    }}>
      <AuroraBackground variant="green" />
      <GridOverlay />

      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}><BrandMark /></div>
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        06 / 10
      </div>

      <div style={{
        position: 'relative' as const, zIndex: 5, maxWidth: 1400, margin: '0 auto',
        width: '100%', padding: '0 64px',
        display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 60, alignItems: 'center',
      }} className="pitch-grid-2col">

        <motion.div
          initial={{ opacity: 0, x: -40 }} animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
          <div style={{ marginBottom: 24 }}>
            <Eyebrow color="#86efac">Côté client</Eyebrow>
          </div>
          <h2 style={{
            fontSize: 'clamp(36px, 4.5vw, 54px)', fontWeight: 800, lineHeight: 1.02,
            letterSpacing: '-0.035em', color: '#fff', margin: '0 0 24px',
          }}>
            Le client reçoit<br />
            un rapport pro,<br />
            <span style={{
              background: 'linear-gradient(135deg, #86efac, #4ade80)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>à votre nom.</span>
          </h2>
          <p style={{
            fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: '0 0 30px',
          }}>
            Pas un mail générique avec 12 pièces jointes. Un rapport propre, structuré, mobile-friendly. À votre image. Le client comprend tout, et il vous fait confiance.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 13 }}>
            {[
              { icon: '📱', title: 'Lisible sur tous les écrans', desc: 'Le client lit dans le métro, au bureau, depuis son canapé.' },
              { icon: '🎯', title: 'Score et alertes en un coup d\'œil', desc: 'Plus de pages à éplucher. L\'essentiel ressort. Le client décide vite.' },
              { icon: '🏆', title: "L'image qui fait gagner le mandat", desc: 'Le pro qui envoie un rapport Verimo gagne en crédibilité immédiate.' },
            ].map((b, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                style={{
                  display: 'flex', gap: 14, padding: '14px 18px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 9,
                  background: 'linear-gradient(135deg, rgba(125,211,252,0.2), rgba(56,189,248,0.05))',
                  border: '1px solid rgba(125,211,252,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17, flexShrink: 0 }}>{b.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60, scale: 0.9 }}
          animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            position: 'relative' as const, perspective: '1600px',
          }}>
          <ClientRapportPhone />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Phone mockup montrant le rapport client ────────────────────
function ClientRapportPhone() {
  return (
    <div style={{
      position: 'relative' as const,
      transformStyle: 'preserve-3d' as const,
      transform: 'rotateY(-14deg) rotateX(6deg) rotateZ(-2deg)',
      width: 300,
    }}>
      <div style={{
        position: 'absolute' as const, inset: -50,
        background: 'radial-gradient(circle, rgba(125,211,252,0.35), transparent 60%)',
        filter: 'blur(60px)', zIndex: -1, pointerEvents: 'none' as const,
      }} />
      <div style={{
        background: 'linear-gradient(180deg, #1a1a1f, #0a0a0f)',
        borderRadius: 38, padding: 12,
        boxShadow: '0 60px 120px rgba(0,0,0,0.6), 0 25px 50px rgba(125,211,252,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #fafcfd 0%, #f0f7fb 100%)',
          borderRadius: 28, overflow: 'hidden', position: 'relative' as const,
          height: 580, padding: '44px 18px 20px',
        }}>
          <div style={{
            position: 'absolute' as const, top: 12, left: '50%', transform: 'translateX(-50%)',
            width: 105, height: 24, background: '#0a0a0f', borderRadius: 14, zIndex: 10,
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22,
            fontSize: 11, fontWeight: 700, color: '#0f2d3d' }}>
            <span>19:34</span>
            <span>📶 100%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10,
            paddingBottom: 14, borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #2a7d9c, #0c447c)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800 }}>V</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f2d3d' }}>Rapport Verimo</div>
              <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 2 }}>42 rue Lecourbe, 75015 Paris</div>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: '1px solid #bbf7d0', borderRadius: 13, padding: '14px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13,
          }}>
            <div>
              <div style={{ fontSize: 10, color: '#15803d', fontWeight: 800,
                letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>Score Verimo</div>
              <div style={{ fontSize: 10, color: '#16a34a', marginTop: 2 }}>Sans alerte majeure</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#15803d',
              letterSpacing: '-0.025em', lineHeight: 1 }}>16<span style={{ fontSize: 14, color: '#22c55e' }}>/20</span></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {[
              { lbl: 'Surface Carrez', val: '68 m²', warn: false },
              { lbl: 'Charges annuelles', val: '2 840 €', warn: false },
              { lbl: 'Classe DPE', val: 'D', warn: false },
              { lbl: 'Travaux à prévoir', val: '1 voté', warn: true },
              { lbl: 'Procédures', val: 'Aucune', warn: false },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 13px', background: '#fff', borderRadius: 8, border: '0.5px solid #edf2f7',
              }}>
                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{r.lbl}</span>
                <span style={{ fontSize: 10.5, color: r.warn ? '#d97706' : '#0f2d3d', fontWeight: 800 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 7 — 14 DOCUMENTS (grille premium)
// ════════════════════════════════════════════════════════════════════
function DocumentsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });

  const docs = [
    { icon: '📄', title: 'DDT', sub: 'Diagnostics' },
    { icon: '📋', title: "PV d'AG", sub: 'Assemblée' },
    { icon: '📑', title: 'RCP', sub: 'Règlement' },
    { icon: '📚', title: 'Carnet', sub: 'Entretien' },
    { icon: '📊', title: 'Pré-état', sub: 'Daté' },
    { icon: '💰', title: 'Charges', sub: 'Appels' },
    { icon: '✍', title: 'Compromis', sub: 'Promesse' },
    { icon: '🔧', title: 'DTG', sub: 'PPT' },
    { icon: '📜', title: 'Modif RCP', sub: 'Mises à jour' },
    { icon: '🏗', title: 'Diag PC', sub: 'DTA, plomb' },
    { icon: '🏛', title: 'Statuts', sub: 'Copropriété' },
    { icon: '⚖', title: 'Notaires', sub: 'Actes' },
  ];

  return (
    <section ref={ref} style={{
      position: 'relative' as const, minHeight: '100vh', background: '#050912',
      overflow: 'hidden', padding: '120px 0',
    }}>
      <AuroraBackground variant="default" />
      <GridOverlay />

      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}><BrandMark /></div>
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        07 / 10
      </div>

      <div style={{ position: 'relative' as const, zIndex: 5, maxWidth: 1400, margin: '0 auto',
        padding: '80px 64px 0', textAlign: 'center' as const }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}>
          <div style={{ display: 'inline-block', marginBottom: 16 }}>
            <Eyebrow>Tout ce que Verimo analyse</Eyebrow>
          </div>
          <h2 style={{
            fontSize: 'clamp(34px, 4.2vw, 50px)', fontWeight: 800,
            lineHeight: 1.05, letterSpacing: '-0.035em', color: '#fff', margin: '0 0 14px',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #7dd3fc, #38bdf8)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>14 types</span>{' '}
            de documents reconnus.
          </h2>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 620,
            margin: '0 auto 50px', lineHeight: 1.6,
          }}>
            Toute la matière juridique et technique d'un dossier immobilier est couverte. Pas besoin de trier en amont : vous chargez, Verimo identifie.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 28 }} className="pitch-docs-grid">
          {docs.map((d, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.04 }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 13, padding: '18px 12px',
                textAlign: 'center' as const,
              }}>
              <div style={{
                width: 38, height: 38, borderRadius: 9,
                background: 'linear-gradient(135deg, rgba(125,211,252,0.15), rgba(56,189,248,0.05))',
                border: '1px solid rgba(125,211,252,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, margin: '0 auto 11px',
              }}>{d.icon}</div>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: '#fff',
                letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 3 }}>{d.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(125,211,252,0.5)',
                fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>{d.sub}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          style={{
            padding: '18px 30px',
            background: 'linear-gradient(135deg, rgba(125,211,252,0.1), rgba(56,189,248,0.05))',
            border: '1px solid rgba(125,211,252,0.3)',
            borderRadius: 14, display: 'flex', alignItems: 'center', gap: 16,
            backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
            textAlign: 'left' as const,
          }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'linear-gradient(135deg, #38bdf8, #0c447c)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>🎯</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 3 }}>Pas besoin de trier en amont</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)' }}>
              Vous chargez tout ce que le syndic vous a envoyé. Verimo identifie automatiquement chaque document.
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 8 — POURQUOI MAINTENANT (2x2 cards)
// ════════════════════════════════════════════════════════════════════
function WhyNowSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });

  const reasons = [
    { year: '2025', tag: '⚡ Loi Climat', title: 'DPE F et G interdits à la location', desc: 'Depuis le 1er janvier 2025, les logements G sont interdits. Les F en 2028, les E en 2034.', impact: 'Verimo détecte la classe DPE et alerte sur les conséquences locatives.' },
    { year: '2025', tag: '📜 Loi 2025-541', title: 'Nouveau cadre pour les compromis', desc: 'Depuis juin 2025, le compromis doit mentionner l\'usage déclaré et inclure plus d\'annexes obligatoires.', impact: 'Verimo vérifie la conformité et la présence des annexes obligatoires.' },
    { year: '2026', tag: '📊 Clients exigeants', title: 'Le client veut comprendre avant de signer', desc: 'Fini les présentations orales : le client veut des documents, des analyses, des chiffres. Vite.', impact: 'Verimo répond à l\'exigence moderne en 5 min au lieu de 4 heures.' },
    { year: '2026', tag: '🏆 Différenciation', title: 'Vos concurrents s\'équipent', desc: 'Les mandataires qui adoptent les outils pros maintenant prennent une avance durable.', impact: 'Soyez parmi les premiers de votre zone à équiper votre activité.' },
  ];

  return (
    <section ref={ref} style={{
      position: 'relative' as const, minHeight: '100vh', background: '#050912',
      overflow: 'hidden', padding: '120px 0',
    }}>
      <AuroraBackground variant="red" />
      <GridOverlay />

      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}><BrandMark /></div>
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        08 / 10
      </div>

      <div style={{ position: 'relative' as const, zIndex: 5, maxWidth: 1400, margin: '0 auto',
        padding: '80px 64px 0', textAlign: 'center' as const }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}>
          <div style={{ display: 'inline-block', marginBottom: 16 }}>
            <Eyebrow color="#f87171">Le timing</Eyebrow>
          </div>
          <h2 style={{
            fontSize: 'clamp(38px, 4.8vw, 56px)', fontWeight: 800,
            lineHeight: 1.05, letterSpacing: '-0.035em', color: '#fff', margin: '0 0 50px',
          }}>
            Pourquoi{' '}
            <span style={{
              background: 'linear-gradient(135deg, #fda4a4, #fb7185)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>maintenant ?</span>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, textAlign: 'left' as const }} className="pitch-grid-2col">
          {reasons.map((r, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.25 + i * 0.12 }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 17, padding: '26px 28px',
                position: 'relative' as const, overflow: 'hidden',
              }}>
              <div style={{
                position: 'absolute' as const, top: 18, right: 26,
                fontSize: 52, fontWeight: 800, color: 'rgba(248,113,113,0.13)',
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>{r.year}</div>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px',
                background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: 100, fontSize: 10.5, fontWeight: 800, color: '#fda4a4',
                marginBottom: 14, letterSpacing: '0.05em', textTransform: 'uppercase' as const,
              }}>{r.tag}</div>

              <h3 style={{
                fontSize: 18, fontWeight: 800, color: '#fff',
                letterSpacing: '-0.015em', lineHeight: 1.25, margin: '0 0 10px',
              }}>{r.title}</h3>
              <p style={{
                fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: '0 0 14px',
              }}>{r.desc}</p>

              <div style={{
                display: 'flex', gap: 10, padding: '11px 15px',
                background: 'rgba(125,211,252,0.06)',
                border: '1px solid rgba(125,211,252,0.18)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 14, color: '#7dd3fc', flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)',
                  fontWeight: 600, lineHeight: 1.5 }}>{r.impact}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 9 — TARIFS
// ════════════════════════════════════════════════════════════════════
function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-15%' });

  return (
    <section ref={ref} style={{
      position: 'relative' as const, minHeight: '100vh', background: '#050912',
      overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '120px 0',
    }}>
      <AuroraBackground variant="green" />
      <GridOverlay />

      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}><BrandMark /></div>
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        09 / 10
      </div>

      <div style={{ position: 'relative' as const, zIndex: 5, maxWidth: 900, margin: '0 auto',
        padding: '0 64px', width: '100%', textAlign: 'center' as const }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}>
          <div style={{ display: 'inline-block', marginBottom: 16 }}>
            <Eyebrow color="#86efac">L'offre Verimo Pro</Eyebrow>
          </div>
          <h2 style={{
            fontSize: 'clamp(34px, 4.2vw, 50px)', fontWeight: 800,
            letterSpacing: '-0.035em', color: '#fff', lineHeight: 1.05, margin: '0 0 14px',
          }}>
            Un tarif simple,<br />
            <span style={{
              background: 'linear-gradient(135deg, #86efac, #4ade80)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent', color: 'transparent',
            }}>sans engagement.</span>
          </h2>
          <p style={{
            fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 540, margin: '0 auto 40px',
          }}>
            Le tarif est ajusté à votre volume d'activité et présenté lors de votre démo personnalisée.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.3 }}
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(125,211,252,0.3)',
            borderRadius: 24, padding: '44px 48px',
            position: 'relative' as const, overflow: 'hidden',
            boxShadow: '0 30px 80px rgba(56,189,248,0.15)',
            textAlign: 'center' as const,
          }}>
          <div style={{
            position: 'absolute' as const, top: -2, left: '20%', right: '20%', height: 2,
            background: 'linear-gradient(90deg, transparent, #7dd3fc, transparent)',
          }} />
          <div style={{
            position: 'absolute' as const, top: -16, left: '50%', transform: 'translateX(-50%)',
            padding: '7px 20px',
            background: 'linear-gradient(135deg, #7dd3fc, #38bdf8)',
            color: '#0a1f2d', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
            borderRadius: 100, textTransform: 'uppercase' as const,
          }}>✦ Offre découverte</div>

          <div style={{ fontSize: 12, fontWeight: 800, color: '#7dd3fc',
            letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 18 }}>
            Verimo Pro · Solo
          </div>
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 60, fontWeight: 800, color: '#fff',
              letterSpacing: '-0.04em', lineHeight: 1 }}>Sur devis</span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(125,211,252,0.75)', marginBottom: 32 }}>
            Tarif établi selon votre volume mensuel
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
            paddingTop: 28, borderTop: '1px solid rgba(125,211,252,0.15)',
            textAlign: 'left' as const,
          }}>
            {[
              'Analyses illimitées',
              'Dashboard pro dédié',
              'Rapports à votre marque',
              '14 types de documents',
              'Lien partageable client',
              'Mises à jour incluses',
              'Support dédié pros',
              'Sans engagement',
            ].map((feat, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13.5, color: 'rgba(255,255,255,0.85)',
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, flexShrink: 0 }}>✓</div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION 10 — CTA FINAL
// ════════════════════════════════════════════════════════════════════
function CTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });

  return (
    <section ref={ref} style={{
      position: 'relative' as const, minHeight: '100vh', background: '#050912',
      overflow: 'hidden', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '120px 0',
    }}>
      <AuroraBackground variant="default" />
      <GridOverlay />

      <div style={{ position: 'absolute' as const, top: 36, left: 64, zIndex: 10 }}><BrandMark /></div>
      <div style={{ position: 'absolute' as const, top: 42, right: 64, zIndex: 10,
        fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
        10 / 10
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative' as const, zIndex: 5,
          textAlign: 'center' as const, maxWidth: 900, margin: '0 auto',
          padding: '0 64px',
        }}>
        <div style={{ display: 'inline-block', marginBottom: 24 }}>
          <Eyebrow>Prochaine étape</Eyebrow>
        </div>
        <h1 style={{
          fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 800,
          lineHeight: 1, letterSpacing: '-0.04em', color: '#fff', margin: '0 0 24px',
        }}>
          Rejoignez les pros<br />
          qui{' '}
          <span style={{
            background: 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 50%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent', color: 'transparent',
          }}>font confiance.</span>
        </h1>
        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.5, maxWidth: 640, margin: '0 auto 50px',
        }}>
          Démo personnalisée de 15 minutes, sans engagement.<br />
          Notre équipe vous présente Verimo Pro, comprend votre activité, et adapte l'offre à vos besoins.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 50, flexWrap: 'wrap' as const }}>
          <Link to="/rejoindre" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '17px 32px', borderRadius: 14,
            background: 'linear-gradient(135deg, #fff, #f0f7fb)',
            color: '#0a1f2d', fontSize: 16, fontWeight: 800,
            boxShadow: '0 10px 30px rgba(255,255,255,0.2)',
            textDecoration: 'none',
            transition: 'transform 0.2s',
          }}>→ Rejoindre Verimo Pro</Link>
          <a href="https://verimo.fr/rejoindre" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '17px 30px', borderRadius: 14,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(125,211,252,0.3)',
            color: '#7dd3fc', fontSize: 16, fontWeight: 800,
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            textDecoration: 'none',
          }}>verimo.fr/rejoindre</a>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
          maxWidth: 700, margin: '0 auto',
        }}>
          {[
            { icon: '📞', title: 'Démo perso', desc: '15 min en visio\navec un humain' },
            { icon: '✓', title: 'Sans engagement', desc: 'Aucune carte\nrequise' },
            { icon: '🛡', title: 'Données protégées', desc: 'Hébergement\nen France' },
          ].map((c, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
              border: '1px solid rgba(125,211,252,0.15)',
              borderRadius: 14, padding: '18px 16px', textAlign: 'center' as const,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 9,
                background: 'linear-gradient(135deg, rgba(125,211,252,0.2), rgba(56,189,248,0.05))',
                border: '1px solid rgba(125,211,252,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 17, margin: '0 auto 10px' }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)',
                fontWeight: 500, lineHeight: 1.4, whiteSpace: 'pre-line' as const }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════
export default function PitchMandatairesPage() {
  useSEO({
    title: 'Verimo Pro — Présentation pour mandataires',
    description: 'Découvrez Verimo Pro : analysez les documents de vos biens en quelques minutes. Envoyez à vos clients un rapport pro complet en un clic, à votre image.',
  });

  return (
    <div style={{ background: '#050912', color: '#fff', overflow: 'hidden' }}>
      <style>{`
        body { background: #050912; }
        @media (max-width: 900px) {
          .pitch-hero-grid,
          .pitch-grid-2col {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .pitch-grid-3col {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .pitch-docs-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
      <HeroSection />
      <ProblemSection />
      <WhatIsVerimoSection />
      <ThreeStepsSection />
      <SituationsSection />
      <ClientExperienceSection />
      <DocumentsSection />
      <WhyNowSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}
