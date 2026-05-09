import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  FileText, Sparkles, Eye, ShieldCheck, Clock, Award, TrendingUp, Check,
  Calendar, ChevronRight, Zap, Target, Star,
  AlertTriangle, BarChart3, Send, Building2, Bell,
  CheckCircle2, MousePointerClick,
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
const isLowPerf = () => isIOS() || isMobile();
const _lp = isLowPerf();

// 🔗 PLACEHOLDER — à remplacer par le vrai lien Calendly
const CALENDLY_URL = '#calendly';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: _lp ? 6 : 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: _lp ? 0.2 : 0.6, delay: _lp ? Math.min(i * 0.02, 0.06) : i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} className={className} variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'} custom={delay}>
      {children}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MOCKUP : Rapport Verimo (utilisé dans aperçu rapport)
// ════════════════════════════════════════════════════════════════════
function MockupRapport() {
  return (
    <div style={{
      borderRadius: 16, background: '#fff',
      boxShadow: '0 24px 70px rgba(15,45,61,0.2), 0 6px 16px rgba(15,45,61,0.06)',
      overflow: 'hidden', maxWidth: '100%', position: 'relative' as const,
      border: '1px solid rgba(15,45,61,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fda4a4' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fcd45d' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#86efac' }} />
        <div style={{ flex: 1, marginLeft: 10, fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>verimo.fr/rapport</div>
      </div>
      <div style={{ padding: '20px 22px', background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', borderBottom: '1px solid #d0e8f0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 4 }}>RAPPORT D'ANALYSE</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>14 rue de la Paix, Paris 8ᵉ</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>Appartement T3 • Copropriété 1925</div>
      </div>
      <div style={{ padding: '22px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'conic-gradient(#16a34a 0% 75%, #e2e8f0 75% 100%)', position: 'relative' as const, flexShrink: 0 }}>
          <div style={{ position: 'absolute' as const, inset: 8, background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>15</span>
            <span style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>/20</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Bien sain</div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>Copropriété saine, finances équilibrées, peu de travaux à anticiper.</div>
        </div>
      </div>
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

// ════════════════════════════════════════════════════════════════════
// SCÈNE CINÉMATIQUE HERO : Dashboard envoi 1-clic → iPhone réception
// L'animation se déclenche en boucle (loop) pour montrer le workflow
// ════════════════════════════════════════════════════════════════════
function CinematicScene() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });
  const [phase, setPhase] = useState<'idle' | 'click' | 'sending' | 'received'>('idle');

  // Boucle l'animation : idle → click → sending → received → idle...
  useEffect(() => {
    if (!inView) return;
    const sequence = async () => {
      setPhase('idle');
      await new Promise(r => setTimeout(r, 800));
      setPhase('click');
      await new Promise(r => setTimeout(r, 600));
      setPhase('sending');
      await new Promise(r => setTimeout(r, 1400));
      setPhase('received');
      await new Promise(r => setTimeout(r, 2400));
    };
    sequence();
    const interval = setInterval(sequence, 5400);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <div ref={ref} style={{ position: 'relative' as const, width: '100%', maxWidth: 920, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) auto minmax(0, 0.85fr)', gap: 24, alignItems: 'center' }} className="cinematic-grid">

        {/* ═══ DASHBOARD PRO (gauche) ═══ */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative' as const }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 14,
            boxShadow: '0 30px 80px rgba(15,45,61,0.18), 0 6px 20px rgba(15,45,61,0.06)',
            border: '1px solid rgba(15,45,61,0.06)',
            overflow: 'hidden',
          }}>
            {/* Browser bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fda4a4' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fcd45d' }} />
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#86efac' }} />
              <div style={{ flex: 1, marginLeft: 8, fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' }}>verimo.fr/dashboard</div>
            </div>

            {/* Header dashboard */}
            <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff' }}>
              <div style={{ fontSize: 9.5, opacity: 0.85, letterSpacing: '0.06em' }}>VERIMO PRO</div>
              <div style={{ fontSize: 13.5, fontWeight: 800, marginTop: 1 }}>Dossier · 14 rue de la Paix</div>
            </div>

            {/* Carte rapport prêt */}
            <div style={{ padding: 14 }}>
              <div style={{ padding: '12px 13px', borderRadius: 10, border: '1.5px solid #d0e8f0', background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'conic-gradient(#16a34a 0% 75%, #e2e8f0 75% 100%)', position: 'relative' as const, flexShrink: 0 }}>
                    <div style={{ position: 'absolute' as const, inset: 4, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>15</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>Rapport prêt</div>
                    <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 1 }}>Score 15/20 · Bien sain</div>
                  </div>
                </div>

                {/* Mini KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 12 }}>
                  {[
                    { l: 'Charges', v: '180€' },
                    { l: 'Travaux', v: '42k€' },
                    { l: 'Alertes', v: '2' },
                  ].map((k, i) => (
                    <div key={i} style={{ padding: '5px 7px', background: '#fff', borderRadius: 6, border: '1px solid #e8f4f8' }}>
                      <div style={{ fontSize: 8, color: '#94a3b8', marginBottom: 1 }}>{k.l}</div>
                      <div style={{ fontSize: 10.5, fontWeight: 800, color: '#2a7d9c' }}>{k.v}</div>
                    </div>
                  ))}
                </div>

                {/* Bouton envoi avec animation click */}
                <motion.div
                  animate={{
                    scale: phase === 'click' ? 0.94 : 1,
                    boxShadow: phase === 'click'
                      ? '0 2px 8px rgba(42,125,156,0.4)'
                      : '0 8px 22px rgba(42,125,156,0.3)',
                  }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)',
                    color: '#fff',
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    cursor: 'pointer',
                    position: 'relative' as const,
                  }}>
                  {phase === 'sending' ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}
                      />
                      Envoi en cours...
                    </>
                  ) : phase === 'received' ? (
                    <>
                      <CheckCircle2 size={14} style={{ color: '#86efac' }} /> Rapport envoyé !
                    </>
                  ) : (
                    <>
                      <Send size={13} /> Envoyer le rapport au client
                    </>
                  )}

                  {/* Curseur animé qui clique */}
                  {(phase === 'idle' || phase === 'click') && (
                    <motion.div
                      initial={{ x: 60, y: 30, opacity: 0 }}
                      animate={{
                        x: phase === 'click' ? 0 : 60,
                        y: phase === 'click' ? 0 : 30,
                        opacity: 1,
                        scale: phase === 'click' ? 0.85 : 1,
                      }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        position: 'absolute' as const,
                        right: 30, bottom: -8,
                        pointerEvents: 'none' as const,
                        zIndex: 5,
                      }}>
                      <MousePointerClick size={18} style={{ color: '#0f172a', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ FLÈCHE CENTRALE ANIMÉE ═══ */}
        <div style={{ position: 'relative' as const, width: 90, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="cinematic-arrow">
          {/* Particules de l'envoi */}
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ x: -45, opacity: 0, scale: 0.5 }}
              animate={phase === 'sending'
                ? { x: 45, opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }
                : { x: -45, opacity: 0, scale: 0.5 }
              }
              transition={{
                duration: 1.4, delay: i * 0.18,
                repeat: phase === 'sending' ? Infinity : 0,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                position: 'absolute' as const,
                width: 8, height: 8, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2a7d9c, #16a34a)',
                boxShadow: '0 0 12px rgba(42,125,156,0.6)',
              }}
            />
          ))}

          {/* Flèche dashed qui pulse */}
          <svg width="90" height="40" viewBox="0 0 90 40" style={{ position: 'absolute' as const }}>
            <motion.path
              d="M 5 20 L 80 20"
              fill="none"
              stroke="#2a7d9c"
              strokeWidth="2"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0.3 }}
              animate={{
                pathLength: 1,
                opacity: phase === 'sending' ? [0.3, 1, 0.3] : 0.4,
              }}
              transition={{
                pathLength: { duration: 1, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 1.4, repeat: phase === 'sending' ? Infinity : 0, ease: 'easeInOut' },
              }}
            />
            <motion.path
              d="M 75 12 L 85 20 L 75 28"
              fill="none"
              stroke="#2a7d9c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: phase === 'sending' ? [0.4, 1, 0.4] : 0.5 }}
              transition={{ duration: 1.4, repeat: phase === 'sending' ? Infinity : 0 }}
            />
          </svg>
        </div>

        {/* ═══ IPHONE CLIENT (droite) ═══ */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative' as const, display: 'flex', justifyContent: 'center' }}
        >
          {/* iPhone frame */}
          <div style={{
            width: 220, height: 460,
            background: 'linear-gradient(160deg, #1a1a1a 0%, #2c2c2c 100%)',
            borderRadius: 36, padding: 7,
            boxShadow: '0 30px 80px rgba(15,45,61,0.32), 0 10px 30px rgba(0,0,0,0.18), inset 0 0 0 2px rgba(255,255,255,0.08)',
            position: 'relative' as const,
          }}>
            {/* Notch */}
            <div style={{ position: 'absolute' as const, top: 7, left: '50%', transform: 'translateX(-50%)', width: 86, height: 20, background: '#000', borderBottomLeftRadius: 14, borderBottomRightRadius: 14, zIndex: 10 }} />

            {/* Screen */}
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(180deg, #f0f7fb 0%, #e6f3f7 100%)',
              borderRadius: 30, overflow: 'hidden', position: 'relative' as const,
            }}>
              {/* Status bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px 4px', fontSize: 10, fontWeight: 700, color: '#0f172a' }}>
                <span>14:32</span>
                <span style={{ fontSize: 8 }}>📶 🔋</span>
              </div>

              {/* Notification push qui apparaît */}
              <motion.div
                initial={{ y: -100, opacity: 0, scale: 0.85 }}
                animate={phase === 'received'
                  ? { y: 0, opacity: 1, scale: 1 }
                  : { y: -100, opacity: 0, scale: 0.85 }
                }
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  margin: '12px 10px',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 12,
                  padding: '9px 11px',
                  display: 'flex', alignItems: 'flex-start', gap: 9,
                  boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
                }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, color: '#fff', fontWeight: 800 }}>V</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9.5, fontWeight: 800, color: '#0f172a' }}>VERIMO PRO</span>
                    <span style={{ fontSize: 8, color: '#94a3b8' }}>maintenant</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#0f172a', fontWeight: 700, marginTop: 1 }}>Pierre vous a partagé un rapport</div>
                  <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>🔍 Score 15/20 · Bien sain</div>
                </div>
              </motion.div>

              {/* Card rapport qui apparaît après notif */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={phase === 'received' ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                style={{
                  margin: '6px 12px 12px',
                  background: '#fff',
                  borderRadius: 10,
                  padding: 11,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>14 rue de la Paix, Paris 8ᵉ</div>
                <div style={{ fontSize: 8.5, color: '#64748b', marginBottom: 9 }}>Appartement T3 · 1925</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={phase === 'received' ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                    transition={{ duration: 0.6, delay: 0.6, type: 'spring', stiffness: 150 }}
                    style={{ width: 42, height: 42, borderRadius: '50%', background: 'conic-gradient(#16a34a 0% 75%, #e2e8f0 75% 100%)', position: 'relative' as const, flexShrink: 0 }}>
                    <div style={{ position: 'absolute' as const, inset: 4, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>15</span>
                    </div>
                  </motion.div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: '#0f172a' }}>Bien sain</div>
                    <div style={{ fontSize: 8.5, color: '#64748b', lineHeight: 1.3 }}>Copropriété saine</div>
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff',
                  padding: '6px 9px', borderRadius: 6, fontSize: 9, fontWeight: 700,
                  textAlign: 'center' as const,
                }}>
                  Consulter le rapport →
                </div>
              </motion.div>
            </div>

            {/* Side button */}
            <div style={{ position: 'absolute' as const, right: -2, top: 90, width: 3, height: 50, background: '#1a1a1a', borderRadius: '0 2px 2px 0' }} />
          </div>

          {/* Badge "✓ Reçu" qui apparaît */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={phase === 'received'
              ? { scale: 1, opacity: 1, rotate: -3 }
              : { scale: 0, opacity: 0, rotate: -10 }
            }
            transition={{ duration: 0.5, delay: 0.4, type: 'spring', stiffness: 200 }}
            style={{
              position: 'absolute' as const, top: -10, right: -16,
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 100,
              fontSize: 10,
              fontWeight: 800,
              boxShadow: '0 8px 22px rgba(22,163,74,0.4)',
              display: 'flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap' as const,
            }}>
            <Bell size={11} /> Reçu !
          </motion.div>
        </motion.div>
      </div>

      {/* Petite indication sous la scène */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2 }}
        style={{
          marginTop: 24, textAlign: 'center' as const,
          fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.04em',
        }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <Sparkles size={13} style={{ color: '#2a7d9c' }} />
          1 clic · Rapport reçu · Client conquis
        </span>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MOCKUP : Conversation SMS (lente et réaliste, pour Moment 2)
// ════════════════════════════════════════════════════════════════════
function MockupSMS() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  // 8 messages, rythme lent et réaliste (sur ~12 secondes)
  const messages = [
    { from: 'client', text: 'Bonjour, merci beaucoup pour la visite de cet après-midi !', delay: 0.5 },
    { from: 'client', text: 'Le bien me plaît beaucoup, je voudrais avancer.', delay: 2.0 },
    { from: 'client', text: 'Vous pouvez m\'envoyer les 3 derniers PV d\'AG, le règlement de copropriété et les diagnostics ?', delay: 3.5 },
    { from: 'agent', text: 'Bonjour ! Avec plaisir 👍', delay: 5.5 },
    { from: 'agent', text: 'Je vous envoie le rapport complet du bien tout de suite', delay: 6.8 },
    { from: 'agent', text: '', delay: 8.2, isRapport: true },
    { from: 'client', text: 'Whoa, c\'est super clair et bien fait ! 🙌', delay: 10.0 },
    { from: 'client', text: 'On peut se voir demain pour faire une offre ?', delay: 11.5 },
  ];

  return (
    <div ref={ref} style={{ width: 340, maxWidth: '100%', margin: '0 auto' }}>
      <div style={{
        background: '#fff',
        borderRadius: 28,
        boxShadow: '0 30px 80px rgba(15,45,61,0.25), 0 10px 30px rgba(0,0,0,0.12)',
        border: '1px solid rgba(15,45,61,0.06)',
        overflow: 'hidden',
        height: 600,
        display: 'flex', flexDirection: 'column' as const,
      }}>
        <div style={{ background: '#f6f6f6', padding: '14px 16px 12px', borderBottom: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>14:32</div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #94a3b8, #64748b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>M</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>Marc Dubois</div>
        </div>

        <div style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column' as const, gap: 6, overflow: 'hidden' }}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14, scale: 0.92 }}
              animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 14, scale: 0.92 }}
              transition={{ duration: 0.5, delay: msg.delay, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', justifyContent: msg.from === 'client' ? 'flex-start' : 'flex-end' }}
            >
              {msg.isRapport ? (
                <div style={{
                  background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)',
                  color: '#fff',
                  borderRadius: '18px 18px 6px 18px',
                  padding: '10px 12px',
                  maxWidth: '78%',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 12px rgba(42,125,156,0.28)',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={14} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800 }}>📊 Rapport Verimo</div>
                    <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1 }}>Score 15/20 · Bien sain</div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: msg.from === 'client' ? '#e9e9eb' : '#0084ff',
                  color: msg.from === 'client' ? '#000' : '#fff',
                  borderRadius: msg.from === 'client' ? '18px 18px 18px 6px' : '18px 18px 6px 18px',
                  padding: '8px 13px',
                  maxWidth: '78%',
                  fontSize: 12.5,
                  lineHeight: 1.4,
                }}>
                  {msg.text}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MOCKUP : Dashboard pro (Moment 1)
// ════════════════════════════════════════════════════════════════════
function MockupDashboardSimple() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const bars = [40, 65, 50, 78, 90, 85, 95];

  return (
    <div ref={ref} style={{ width: 460, maxWidth: '100%', margin: '0 auto', position: 'relative' as const }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 30px 80px rgba(15,45,61,0.18), 0 6px 20px rgba(15,45,61,0.06)',
          border: '1px solid rgba(15,45,61,0.06)',
          overflow: 'hidden',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #edf2f7' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fda4a4' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fcd45d' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#86efac' }} />
          <div style={{ flex: 1, marginLeft: 10, fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>verimo.fr/dashboard</div>
        </div>

        <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff' }}>
          <div style={{ fontSize: 11, opacity: 0.85, letterSpacing: '0.06em', marginBottom: 2 }}>VERIMO PRO</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Mes dossiers</div>
        </div>

        {/* Mini graphique */}
        <div style={{ padding: '20px 22px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 12 }}>RAPPORTS PARTAGÉS / SEMAINE</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 70 }}>
            {bars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={inView ? { height: `${h}%` } : { height: 0 }}
                transition={{ duration: 0.7, delay: 0.4 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  flex: 1,
                  background: i === bars.length - 1 ? 'linear-gradient(180deg, #16a34a, #15803d)' : 'linear-gradient(180deg, #2a7d9c, #1d5e7a)',
                  borderRadius: '6px 6px 0 0',
                }}
              />
            ))}
          </div>
        </div>

        {/* Liste de dossiers */}
        <div style={{ padding: '8px 22px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>DOSSIERS RÉCENTS</div>
          {[
            { name: 'M. Dupont — Paris 11ᵉ', status: 'Rapport prêt', score: 16, color: '#16a34a' },
            { name: 'Mme Martin — Lyon 6ᵉ', status: 'En analyse', score: 12, color: '#f59e0b' },
            { name: 'M. Bernard — Neuilly', status: 'Rapport partagé', score: 18, color: '#16a34a' },
          ].map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.4, delay: 1.0 + i * 0.12 }}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={14} style={{ color: '#2a7d9c' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>{d.name}</div>
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1 }}>{d.status}</div>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${d.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: d.color }}>{d.score}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MOCKUP : iPhone simple (Moment 3 - exclu)
// ════════════════════════════════════════════════════════════════════
function MockupIPhoneSimple() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} style={{ position: 'relative' as const, width: 280, margin: '0 auto', perspective: 1200 }}>
      <motion.div
        initial={{ opacity: 0, rotateY: -15, y: 30 }}
        animate={inView ? { opacity: 1, rotateY: -6, y: 0 } : { opacity: 0, rotateY: -15, y: 30 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 280, height: 568,
          background: 'linear-gradient(160deg, #1a1a1a 0%, #2c2c2c 100%)',
          borderRadius: 42, padding: 8,
          boxShadow: '0 30px 80px rgba(15,45,61,0.35), 0 10px 30px rgba(0,0,0,0.18), inset 0 0 0 2px rgba(255,255,255,0.08)',
          position: 'relative' as const,
          transformStyle: 'preserve-3d' as const,
        }}>
        <div style={{ position: 'absolute' as const, top: 8, left: '50%', transform: 'translateX(-50%)', width: 105, height: 24, background: '#000', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, zIndex: 10 }} />

        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(180deg, #f0f7fb 0%, #e6f3f7 100%)',
          borderRadius: 36, overflow: 'hidden', position: 'relative' as const,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px 6px', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
            <span>14:32</span>
            <span style={{ fontSize: 10 }}>📶 🔋</span>
          </div>

          {/* Header */}
          <div style={{ padding: '14px 18px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 4 }}>RAPPORT D'ANALYSE</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Bien chez M. Dupont</div>
          </div>

          {/* Score */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={inView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ duration: 0.7, delay: 0.5, type: 'spring', stiffness: 130 }}
            style={{ margin: '6px auto 14px', width: 100, height: 100, borderRadius: '50%', background: 'conic-gradient(#16a34a 0% 80%, #e2e8f0 80% 100%)', position: 'relative' as const }}>
            <div style={{ position: 'absolute' as const, inset: 9, background: '#fff', borderRadius: '50%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#16a34a', lineHeight: 1 }}>16</span>
              <span style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>/20</span>
            </div>
          </motion.div>

          {/* Mini KPIs */}
          <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 14 }}>
            {[
              { l: 'Charges', v: '180€' },
              { l: 'Travaux', v: '12k€' },
              { l: 'Alertes', v: '0' },
            ].map((k, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.9 + i * 0.1 }}
                style={{ padding: '8px 6px', background: '#fff', borderRadius: 8, border: '1px solid #e8f4f8', textAlign: 'center' as const }}>
                <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2 }}>{k.l}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#2a7d9c' }}>{k.v}</div>
              </motion.div>
            ))}
          </div>

          {/* Verdict */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            style={{ padding: '10px 14px', margin: '0 14px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#15803d', marginBottom: 3, letterSpacing: '0.04em' }}>✓ VERDICT</div>
            <div style={{ fontSize: 11, color: '#14532d', fontWeight: 600, lineHeight: 1.4 }}>Bien sain, prêt à l'achat.</div>
          </motion.div>
        </div>

        <div style={{ position: 'absolute' as const, right: -2, top: 110, width: 4, height: 60, background: '#1a1a1a', borderRadius: '0 2px 2px 0' }} />
      </motion.div>

      {/* Badge "Mandat exclu signé" */}
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -10 }}
        animate={inView ? { opacity: 1, scale: 1, rotate: -3 } : { opacity: 0, scale: 0, rotate: -10 }}
        transition={{ duration: 0.5, delay: 1.7, type: 'spring', stiffness: 200 }}
        style={{
          position: 'absolute' as const, top: -16, right: -20,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
          padding: '10px 14px', borderRadius: 12,
          boxShadow: '0 14px 32px rgba(245,158,11,0.4)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
        <Award size={16} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.9 }}>EXCLUSIVITÉ</div>
          <div style={{ fontSize: 11.5, fontWeight: 800 }}>Mandat signé 🎉</div>
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION : Un moment décisif (storytelling pur, pas de stats)
// ════════════════════════════════════════════════════════════════════
function MomentSection({ num, tag, title, story, icon, mockup, reverse, accent }: {
  num: string; tag: string; title: string; story: string;
  icon: React.ReactNode;
  mockup: React.ReactNode;
  reverse?: boolean;
  accent: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} style={{
      display: 'grid',
      gridTemplateColumns: reverse ? 'minmax(0, 0.95fr) minmax(0, 1.05fr)' : 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
      gap: 80, alignItems: 'center', marginBottom: 130,
    }} className={`moment-section ${reverse ? 'reverse' : ''}`}>
      <motion.div
        initial={{ opacity: 0, x: reverse ? 30 : -30 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? 30 : -30 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ order: reverse ? 1 : 0 }}
      >
        {/* Numéro géant en watermark */}
        <div style={{ position: 'relative' as const, marginBottom: 18 }}>
          <div style={{ position: 'absolute' as const, top: -28, left: -14, fontSize: 140, fontWeight: 900, color: `${accent}10`, lineHeight: 1, letterSpacing: '-0.05em', pointerEvents: 'none' as const, fontFamily: 'system-ui' }}>
            {num}
          </div>
          <div style={{ position: 'relative' as const, display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 14px', borderRadius: 100, background: `${accent}12`, border: `1px solid ${accent}30`, fontSize: 11.5, fontWeight: 800, color: accent, letterSpacing: '0.06em' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{icon} MOMENT {num}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{tag}</span>
          </div>
        </div>

        <h3 style={{ fontSize: 'clamp(28px, 3.4vw, 42px)', fontWeight: 800, color: '#0f2d3d', margin: '14px 0 24px 0', lineHeight: 1.12, letterSpacing: '-0.025em' }}>
          {title}
        </h3>

        <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.7, margin: 0 }}>
          {story}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ order: reverse ? 0 : 1, display: 'flex', justifyContent: 'center', position: 'relative' as const }}
      >
        {mockup}
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════════
export default function MandatairesPage() {
  useSEO({
    title: 'Verimo Pro pour mandataires immobiliers — Analysez vos documents en 3 minutes',
    description: 'Mandataires indépendants : analysez les documents de vos biens en quelques minutes. Envoyez à vos clients en 1 clic. Gagnez plus de mandats.',
  });

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, _lp ? 0 : 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  // Curseur custom suiveur
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const cursorXSpring = useSpring(cursorX, { damping: 25, stiffness: 150 });
  const cursorYSpring = useSpring(cursorY, { damping: 25, stiffness: 150 });
  const [cursorVisible, setCursorVisible] = useState(false);

  useEffect(() => {
    if (_lp) return;
    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
      setCursorVisible(true);
    };
    const leave = () => setCursorVisible(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseleave', leave);
    };
  }, [cursorX, cursorY]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ background: '#fff', color: '#0f172a', overflow: 'hidden' }}>
      {/* Curseur custom */}
      {!_lp && (
        <motion.div
          style={{
            position: 'fixed' as const,
            left: cursorXSpring, top: cursorYSpring,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(42,125,156,0.15)',
            border: '1.5px solid rgba(42,125,156,0.4)',
            pointerEvents: 'none' as const,
            zIndex: 9999,
            mixBlendMode: 'multiply' as const,
            opacity: cursorVisible ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          HERO XXL avec scène cinématique en split-screen
          Padding top 160px (très aéré)
      ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} style={{
        position: 'relative' as const,
        background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)',
        padding: '160px 24px 120px',
        overflow: 'hidden',
      }}>
        {/* Blobs animés */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' as const, top: '-15%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.14), transparent 70%)', pointerEvents: 'none' as const }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' as const, bottom: '-15%', left: '-10%', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.1), transparent 70%)', pointerEvents: 'none' as const }}
        />
        {!_lp && [
          { top: '15%', left: '8%', size: 12, color: 'rgba(42,125,156,0.3)', delay: 0 },
          { top: '70%', left: '5%', size: 8, color: 'rgba(125,211,252,0.4)', delay: 1 },
          { top: '20%', right: '8%', size: 6, color: 'rgba(42,125,156,0.4)', delay: 2 },
          { top: '55%', right: '6%', size: 10, color: 'rgba(125,211,252,0.3)', delay: 1.5 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -14, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
            style={{
              position: 'absolute' as const,
              top: dot.top, left: dot.left, right: dot.right,
              width: dot.size, height: dot.size, borderRadius: '50%',
              background: dot.color, pointerEvents: 'none' as const,
            }}
          />
        ))}

        <motion.div
          style={{ y: heroY, opacity: heroOpacity, maxWidth: 1180, margin: '0 auto', position: 'relative' as const }}
        >
          {/* Texte hero centré au-dessus de la scène cinématique */}
          <div style={{ textAlign: 'center' as const, marginBottom: 70, maxWidth: 880, marginLeft: 'auto', marginRight: 'auto' }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', borderRadius: 100,
                background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.22)',
                fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.04em', marginBottom: 28,
              }}>
              <Sparkles size={13} /> POUR MANDATAIRES INDÉPENDANTS
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: 'clamp(38px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.05,
                color: '#0f2d3d', margin: '0 0 22px 0', letterSpacing: '-0.025em',
              }}>
              Vos rapports immobiliers,{' '}
              <span style={{ position: 'relative' as const, display: 'inline-block' }}>
                <span style={{ color: '#2a7d9c' }}>en 1 clic.</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: 'absolute' as const, bottom: -4, left: 0, right: 0,
                    height: 6, background: 'rgba(42,125,156,0.28)',
                    borderRadius: 99, transformOrigin: 'left', display: 'block',
                  }}
                />
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              style={{
                fontSize: 'clamp(16px, 1.5vw, 19px)', lineHeight: 1.6, color: '#475569',
                maxWidth: 640, margin: '0 auto 36px',
              }}>
              Analysez les documents de vos biens en quelques minutes. Envoyez à vos clients un rapport pro en un seul clic, depuis votre dashboard. Gagnez du temps. Gagnez des mandats.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, justifyContent: 'center', marginBottom: 22 }}
            >
              <motion.a
                href={CALENDLY_URL}
                whileHover={{ y: -2, boxShadow: '0 14px 32px rgba(42,125,156,0.45)' }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '15px 28px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff',
                  textDecoration: 'none', fontSize: 14.5, fontWeight: 700,
                  boxShadow: '0 10px 26px rgba(42,125,156,0.32)',
                }}>
                <Calendar size={16} /> Réserver une démo
              </motion.a>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollToSection('rapport-apercu')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '15px 24px', borderRadius: 12,
                  background: '#fff', color: '#2a7d9c',
                  border: '1.5px solid #d0e8f0', cursor: 'pointer',
                  fontSize: 14, fontWeight: 700,
                }}>
                Voir un rapport exemple ↓
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              style={{ display: 'flex', gap: 22, flexWrap: 'wrap' as const, justifyContent: 'center', fontSize: 12.5, color: '#64748b' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={14} style={{ color: '#16a34a' }} /> Sans engagement
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} style={{ color: '#2a7d9c' }} /> Démo en 15 min
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={14} style={{ color: '#7c3aed' }} /> 100% spécialisé immo
              </div>
            </motion.div>
          </div>

          {/* SCÈNE CINÉMATIQUE — Dashboard ↔ iPhone */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <CinematicScene />
          </motion.div>
        </motion.div>

        {/* Indicateur scroll */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 6, 0] }}
          transition={{ opacity: { delay: 1.5, duration: 0.8 }, y: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } }}
          style={{
            position: 'absolute' as const, bottom: 30, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6,
            fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em',
          }}>
          DÉCOUVRIR
          <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SOLUTION 3 ÉTAPES — refonte avec belle UX cards
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '120px 24px', background: '#fff', position: 'relative' as const, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 80, maxWidth: 720, margin: '0 auto 80px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.22)', fontSize: 11.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 20 }}>
                <Zap size={13} /> COMMENT ÇA MARCHE
              </div>
              <h2 style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 18px 0', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                Trois étapes.{' '}
                <span style={{ position: 'relative' as const, display: 'inline-block', color: '#2a7d9c' }}>
                  Trois minutes.
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute' as const, bottom: -3, left: 0, right: 0, height: 5, background: 'rgba(42,125,156,0.25)', borderRadius: 99, transformOrigin: 'left', display: 'block' }}
                  />
                </span>
              </h2>
              <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.6 }}>
                Un workflow ultra simple, pensé pour les pros qui n'ont pas de temps à perdre.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                num: '01',
                icon: <FileText size={28} style={{ color: '#fff' }} />,
                title: 'Vous déposez',
                text: 'PV d\'AG, règlement de copro, diagnostics, charges... Glissez vos documents dans Verimo.',
                visual: (
                  <div style={{ width: '100%', height: 110, background: 'linear-gradient(180deg, #f0f7fb, #e8f4f8)', borderRadius: 12, border: '2px dashed #d0e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' as const, gap: 8 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(42,125,156,0.12)' }}>
                      <FileText size={18} style={{ color: '#2a7d9c' }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Glissez jusqu'à 15 documents</div>
                  </div>
                ),
              },
              {
                num: '02',
                icon: <Eye size={28} style={{ color: '#fff' }} />,
                title: 'On analyse',
                text: 'Chiffres clés extraits, alertes détectées, score sur 20. Tout est prêt en quelques minutes.',
                visual: (
                  <div style={{ width: '100%', height: 110, background: '#fff', borderRadius: 12, border: '1px solid #edf2f7', padding: 14, position: 'relative' as const, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 12, alignItems: 'center' }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ width: 14, height: 14, border: '2px solid #e2e8f0', borderTopColor: '#2a7d9c', borderRadius: '50%' }}
                      />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#2a7d9c' }}>Analyse en cours...</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 5 }}>
                      {['Charges', 'Travaux', 'Procédures'].map((label, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <motion.div
                            initial={{ width: '0%' }}
                            whileInView={{ width: ['33%', '66%', '100%'][i] }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.2 + i * 0.2 }}
                            style={{ height: 6, background: 'linear-gradient(90deg, #2a7d9c, #16a34a)', borderRadius: 3 }}
                          />
                          <span style={{ fontSize: 9, color: '#64748b', flexShrink: 0 }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                num: '03',
                icon: <Send size={28} style={{ color: '#fff' }} />,
                title: 'Vous envoyez',
                text: 'Un rapport pro, partageable en 1 clic à votre vendeur ou acheteur. Avec votre nom.',
                visual: (
                  <div style={{ width: '100%', height: 110, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', borderRadius: 12, padding: 14, position: 'relative' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div
                      whileInView={{ scale: [1, 1.05, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 }}
                      style={{ background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff', padding: '11px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(42,125,156,0.32)' }}
                    >
                      <Send size={14} /> Envoyer le rapport
                    </motion.div>
                  </div>
                ),
              },
            ].map((step, i) => (
              <Reveal key={i} delay={i}>
                <motion.div
                  whileHover={{ y: -8, boxShadow: '0 24px 60px rgba(42,125,156,0.16)' }}
                  transition={{ duration: 0.3 }}
                  style={{
                    padding: 28,
                    background: '#fff',
                    borderRadius: 22,
                    border: '1px solid #edf2f7',
                    boxShadow: '0 4px 14px rgba(15,45,61,0.04)',
                    height: '100%',
                    boxSizing: 'border-box' as const,
                    display: 'flex', flexDirection: 'column' as const, gap: 18,
                    position: 'relative' as const,
                    overflow: 'hidden',
                  }}>
                  {/* Top icon + num */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.05 }}
                      style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(42,125,156,0.32)' }}
                    >
                      {step.icon}
                    </motion.div>
                    <div style={{ fontSize: 50, fontWeight: 900, color: 'rgba(42,125,156,0.1)', lineHeight: 1, letterSpacing: '-0.04em' }}>{step.num}</div>
                  </div>

                  {/* Visual */}
                  {step.visual}

                  {/* Texte */}
                  <div>
                    <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f2d3d', margin: '0 0 10px 0', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{step.text}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3 MOMENTS DÉCISIFS — Storytelling pur, pas de stats
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '120px 24px 60px', background: 'linear-gradient(180deg, #fafcfd 0%, #f0f7fb 100%)', position: 'relative' as const, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 100, maxWidth: 760, margin: '0 auto 100px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.22)', fontSize: 11.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 20 }}>
                ⭐ 3 MOMENTS DÉCISIFS
              </div>
              <h2 style={{ fontSize: 'clamp(32px, 4.4vw, 54px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 20px 0', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
                Là où Verimo{' '}
                <span style={{ position: 'relative' as const, display: 'inline-block', color: '#2a7d9c' }}>
                  change tout.
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute' as const, bottom: -4, left: 0, right: 0, height: 5, background: 'rgba(42,125,156,0.25)', borderRadius: 99, transformOrigin: 'left', display: 'block' }}
                  />
                </span>
              </h2>
              <p style={{ fontSize: 17, color: '#64748b', lineHeight: 1.6 }}>
                Trois instants clés du quotidien d'un mandataire. Trois moyens concrets de vous démarquer.
              </p>
            </div>
          </Reveal>

          {/* Moment 1 — Avant la visite */}
          <MomentSection
            num="01"
            tag="AVANT LA VISITE"
            title="Vous arrivez chez l'acheteur en mode expert."
            story="Plus besoin de lire les PV en diagonale dans la voiture. Vous avez déjà tout : les charges, les travaux votés, l'état du fonds travaux, les procédures en cours. Vous présentez le bien comme si vous y habitiez. L'acheteur vous écoute, vous fait confiance, et signe."
            icon={<Eye size={14} />}
            mockup={<MockupDashboardSimple />}
            accent="#2a7d9c"
          />

          {/* Moment 2 — Après la visite */}
          <MomentSection
            num="02"
            tag="APRÈS LA VISITE"
            title="Le client demande les documents ? Vous faites la différence."
            story="Vos concurrents envoient un ZIP de PDFs incompréhensibles. Vous, vous envoyez un rapport synthétique avec score, alertes et recommandations — directement par SMS, mail ou WhatsApp. Le client ouvre, comprend, et se souvient de vous."
            icon={<Send size={14} />}
            mockup={<MockupSMS />}
            reverse
            accent="#16a34a"
          />

          {/* Moment 3 — Mandat exclusif */}
          <MomentSection
            num="03"
            tag="POUR GAGNER L'EXCLUSIVITÉ"
            title="Différenciez-vous dès la première rencontre vendeur."
            story="Pendant que les autres parlent prix et photos pro, vous arrivez avec un rapport déjà fait sur leur bien. Le vendeur comprend votre niveau de service en 30 secondes. Et il signe avec vous, en exclusivité."
            icon={<Award size={14} />}
            mockup={<MockupIPhoneSimple />}
            accent="#f59e0b"
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          APERÇU RAPPORT
      ═══════════════════════════════════════════════════════════ */}
      <section id="rapport-apercu" style={{
        padding: '120px 24px',
        background: '#fff',
        position: 'relative' as const, overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' as const }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 70 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.22)', fontSize: 11.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 20 }}>
                📄 APERÇU DU RAPPORT
              </div>
              <h2 style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 18px 0', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                Ce que reçoivent vos clients.
              </h2>
              <p style={{ fontSize: 17, color: '#475569', maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
                Un rapport clair, structuré, avec les éléments essentiels que tout acheteur (et tout vendeur) veut comprendre.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: 60, alignItems: 'center' }} className="apercu-grid">
            <Reveal>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                style={{ position: 'relative' as const }}
              >
                <MockupRapport />
              </motion.div>
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
                  <motion.div
                    key={i}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 0', borderBottom: i < 4 ? '1px solid rgba(15,45,61,0.08)' : 'none', cursor: 'default' }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(42,125,156,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#2a7d9c' }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 15.5, fontWeight: 700, color: '#0f2d3d', marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.55 }}>{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TARIFS + ROI
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '120px 24px', background: 'linear-gradient(165deg, #f0f7fb 0%, #e6f3f7 100%)', position: 'relative' as const, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' as const }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 70 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: '#fff', border: '1px solid rgba(42,125,156,0.22)', fontSize: 11.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 20 }}>
                <TrendingUp size={13} /> TARIFS PRO
              </div>
              <h2 style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 18px 0', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                Combien Verimo vous{' '}
                <span style={{ color: '#2a7d9c' }}>rapporte vraiment.</span>
              </h2>
              <p style={{ fontSize: 17, color: '#64748b', maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
                Un seul mandat signé grâce à Verimo, et l'investissement annuel est rentabilisé.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginBottom: 50 }}>
            {[
              { name: 'Découverte', price: '19,90', completes: 1, simples: 3, tag: 'Pour démarrer', popular: false },
              { name: 'Starter', price: '49,90', completes: 5, simples: 15, tag: 'Le plus choisi', popular: true },
              { name: 'Power', price: '89,90', completes: 10, simples: 30, tag: 'Volume', popular: false },
            ].map((plan, i) => (
              <Reveal key={i} delay={i}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    padding: 32, borderRadius: 20,
                    background: plan.popular ? 'linear-gradient(165deg, #2a7d9c 0%, #1d5e7a 100%)' : '#fff',
                    border: plan.popular ? '2px solid #2a7d9c' : '1px solid #edf2f7',
                    position: 'relative' as const,
                    height: '100%', boxSizing: 'border-box' as const,
                    boxShadow: plan.popular ? '0 18px 44px rgba(42,125,156,0.3)' : '0 2px 8px rgba(15,45,61,0.04)',
                    cursor: 'default',
                    color: plan.popular ? '#fff' : '#0f172a',
                  }}>
                  {plan.popular && (
                    <div style={{
                      position: 'absolute' as const, top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: '#fff', color: '#2a7d9c',
                      padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                    }}>
                      ⭐ POPULAIRE
                    </div>
                  )}
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: plan.popular ? '#7dd3fc' : '#94a3b8', letterSpacing: '0.06em', marginBottom: 10 }}>{plan.tag.toUpperCase()}</div>
                  <h3 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 18px 0', letterSpacing: '-0.02em' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 24 }}>
                    <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>{plan.price}€</span>
                    <span style={{ fontSize: 14, opacity: 0.7 }}>HT/mois</span>
                  </div>
                  <div style={{ borderTop: plan.popular ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(15,45,61,0.08)', paddingTop: 20 }}>
                    {[
                      `${plan.completes} analyse${plan.completes > 1 ? 's' : ''} complète${plan.completes > 1 ? 's' : ''} / mois`,
                      `${plan.simples} analyses simples / mois`,
                      'Rapports partageables en 1 clic',
                      'Marque Verimo Pro',
                      'Achat à l\'unité possible',
                    ].map((feat, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 14, opacity: plan.popular ? 0.95 : 1 }}>
                        <CheckCircle2 size={16} style={{ color: plan.popular ? '#86efac' : '#16a34a', flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
              style={{
                background: 'linear-gradient(135deg, #0f2d3d, #1d5e7a)', color: '#fff',
                padding: '34px 38px', borderRadius: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 30, flexWrap: 'wrap' as const,
                position: 'relative' as const, overflow: 'hidden',
              }}>
              <motion.div
                animate={{ x: [0, 30, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute' as const, top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(125,211,252,0.12)' }}
              />
              <div style={{ flex: 1, minWidth: 280, position: 'relative' as const }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#7dd3fc', letterSpacing: '0.06em', marginBottom: 10 }}>RETOUR SUR INVESTISSEMENT</div>
                <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                  Une commission moyenne = 4 000 à 8 000€.
                </h3>
                <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55, margin: 0 }}>
                  Verimo Starter = 49,90€/mois (598€/an). <strong style={{ color: '#7dd3fc' }}>Vous calculez.</strong>
                </p>
              </div>
              <motion.a
                href={CALENDLY_URL}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '15px 26px', borderRadius: 12,
                  background: '#fff', color: '#0f2d3d',
                  textDecoration: 'none', fontSize: 14.5, fontWeight: 700,
                  boxShadow: '0 10px 26px rgba(0,0,0,0.22)',
                  whiteSpace: 'nowrap' as const, position: 'relative' as const,
                }}>
                <Calendar size={16} /> Réserver une démo
              </motion.a>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CTA FINAL
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ padding: '120px 24px', background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)', position: 'relative' as const, overflow: 'hidden' }}>
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' as const, top: -100, left: -100, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.14), transparent 70%)' }}
        />
        <motion.div
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' as const, bottom: -100, right: -100, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.1), transparent 70%)' }}
        />

        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' as const, position: 'relative' as const }}>
          <Reveal>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', borderRadius: 100,
              background: 'rgba(42,125,156,0.1)', border: '1px solid rgba(42,125,156,0.25)',
              fontSize: 12, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 24,
            }}>
              <TrendingUp size={13} /> PRÊT À PASSER À LA VITESSE SUPÉRIEURE ?
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4.4vw, 54px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 22px 0', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              Devenez le mandataire de référence.
            </h2>
            <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.6, margin: '0 auto 36px', maxWidth: 560 }}>
              Réservez une démo gratuite de 15 minutes. Vous repartez avec une analyse offerte sur l'un de vos biens en cours.
            </p>
            <motion.a
              href={CALENDLY_URL}
              whileHover={{ y: -3, boxShadow: '0 18px 44px rgba(42,125,156,0.5)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '18px 38px', borderRadius: 14,
                background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff',
                textDecoration: 'none', fontSize: 16, fontWeight: 700,
                boxShadow: '0 12px 32px rgba(42,125,156,0.4)',
              }}>
              <Calendar size={18} /> Réserver ma démo gratuite (15 min)
              <ChevronRight size={18} />
            </motion.a>
            <div style={{ marginTop: 24, fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' as const }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={13} style={{ color: '#16a34a' }} /> Sans engagement</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={13} style={{ color: '#16a34a' }} /> 1 analyse offerte</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Check size={13} style={{ color: '#16a34a' }} /> 100% confidentiel</span>
            </div>
          </Reveal>
        </div>
      </section>

      <style>{`
        @media (max-width: 920px) {
          .cinematic-grid { grid-template-columns: 1fr !important; gap: 40px !important; justify-items: center; }
          .cinematic-arrow { transform: rotate(90deg); height: 60px !important; }
          .moment-section { grid-template-columns: 1fr !important; gap: 40px !important; }
          .moment-section.reverse > div:first-child { order: 1 !important; }
          .moment-section > div:nth-child(2) { order: 0 !important; }
          .apercu-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 640px) {
          section { padding-left: 18px !important; padding-right: 18px !important; }
        }
      `}</style>
    </div>
  );
}
