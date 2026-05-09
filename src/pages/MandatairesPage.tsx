import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  FileText, Sparkles, Eye, ShieldCheck, Clock, Award, TrendingUp, Check,
  Calendar, ChevronRight, Zap, Target, Star,
  AlertTriangle, BarChart3, Send, Building2,
  CheckCircle2, X, Bell,
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
// HOOK : Compteur animé
// ════════════════════════════════════════════════════════════════════
function useCountUp(target: number, duration = 1.4, trigger: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration, trigger]);
  return value;
}

// ════════════════════════════════════════════════════════════════════
// MOCKUP : Rapport Verimo (hero)
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
// MOCKUP 1 : iPhone (Moment 3)
// ════════════════════════════════════════════════════════════════════
function MockupIPhone() {
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
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10 }}>●●●</span>
              <span style={{ fontSize: 10 }}>📶</span>
              <span style={{ fontSize: 10 }}>🔋</span>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -100, scale: 0.9 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              margin: '14px 12px',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(20px)',
              borderRadius: 14,
              padding: '10px 12px',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
            }}>
            <div style={{ width: 32, height: 32, borderRadius: 7, background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16, color: '#fff', fontWeight: 800 }}>V</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>VERIMO PRO</span>
                <span style={{ fontSize: 9, color: '#94a3b8' }}>maintenant</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#0f172a', fontWeight: 700, marginBottom: 1 }}>Pierre vous a partagé un rapport</div>
              <div style={{ fontSize: 10.5, color: '#475569', lineHeight: 1.4 }}>🔍 Votre analyse est prête • Score 15/20</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              margin: '8px 14px 14px',
              background: '#fff',
              borderRadius: 12,
              padding: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>14 rue de la Paix, Paris 8ᵉ</div>
            <div style={{ fontSize: 10, color: '#64748b', marginBottom: 12 }}>Appartement T3 • 1925</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 }}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={inView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                transition={{ duration: 0.6, delay: 1.5, type: 'spring', stiffness: 150 }}
                style={{ width: 50, height: 50, borderRadius: '50%', background: 'conic-gradient(#16a34a 0% 75%, #e2e8f0 75% 100%)', position: 'relative' as const, flexShrink: 0 }}>
                <div style={{ position: 'absolute' as const, inset: 5, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#16a34a' }}>15</span>
                </div>
              </motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Bien sain</div>
                <div style={{ fontSize: 9.5, color: '#64748b', lineHeight: 1.3 }}>Copropriété saine, finances OK</div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: 1.9 }}
              style={{
                background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff',
                padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                textAlign: 'center' as const,
              }}>
              Consulter le rapport →
            </motion.div>
          </motion.div>
        </div>

        <div style={{ position: 'absolute' as const, right: -2, top: 110, width: 4, height: 60, background: '#1a1a1a', borderRadius: '0 2px 2px 0' }} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0, x: 20 }}
        animate={inView ? { opacity: 1, scale: 1, x: 0 } : { opacity: 0, scale: 0, x: 20 }}
        transition={{ duration: 0.5, delay: 1.4, type: 'spring', stiffness: 200 }}
        style={{
          position: 'absolute' as const, top: 90, right: -50,
          background: '#fff', borderRadius: 12, padding: '10px 14px',
          boxShadow: '0 14px 36px rgba(15,45,61,0.18)',
          display: 'flex', alignItems: 'center', gap: 9,
          border: '1px solid rgba(42,125,156,0.18)',
        }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={14} style={{ color: '#fff' }} />
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#0f172a' }}>1 rapport reçu</div>
          <div style={{ fontSize: 9, color: '#16a34a', fontWeight: 700 }}>via Verimo Pro</div>
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MOCKUP 2 : Conversation SMS (Moment 2)
// ════════════════════════════════════════════════════════════════════
function MockupSMS() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const messages = [
    { from: 'client', text: 'Merci pour la visite ! Le bien me plaît bien.', delay: 0.3 },
    { from: 'client', text: 'Vous pouvez m\'envoyer les 3 derniers PV d\'AG et le règlement de copro ?', delay: 0.9 },
    { from: 'agent', text: 'Avec plaisir 👍', delay: 1.6 },
    { from: 'agent', text: 'Je vous envoie tout ça dans la minute', delay: 2.0 },
    { from: 'agent', text: 'rapport', delay: 2.6, isRapport: true },
    { from: 'client', text: 'Whoa, c\'est super clair ! Merci 🙌', delay: 3.4 },
  ];

  return (
    <div ref={ref} style={{ width: 320, maxWidth: '100%', margin: '0 auto' }}>
      <div style={{
        background: '#fff',
        borderRadius: 28,
        boxShadow: '0 30px 80px rgba(15,45,61,0.25), 0 10px 30px rgba(0,0,0,0.12)',
        border: '1px solid rgba(15,45,61,0.06)',
        overflow: 'hidden',
        height: 540,
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
              transition={{ duration: 0.4, delay: msg.delay, ease: [0.22, 1, 0.36, 1] }}
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
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={13} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800 }}>📊 Rapport Verimo</div>
                    <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1 }}>Score 15/20 — Bien sain</div>
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3, delay: 3.0 }}
            style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}
          >
            <div style={{ background: '#e9e9eb', borderRadius: 18, padding: '8px 12px', display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MOCKUP 3 : Dashboard pro animé (Moment 1)
// ════════════════════════════════════════════════════════════════════
function MockupDashboard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const mandats = useCountUp(8, 1.6, inView);
  const exclus = useCountUp(5, 1.4, inView);
  const conversion = useCountUp(72, 1.8, inView);

  const bars = [40, 65, 50, 78, 90, 85, 95];

  return (
    <div ref={ref} style={{ width: 460, maxWidth: '100%', margin: '0 auto', position: 'relative' as const }}>
      <motion.div
        initial={{ opacity: 0, y: 30, rotateY: 6 }}
        animate={inView ? { opacity: 1, y: 0, rotateY: 0 } : { opacity: 0, y: 30, rotateY: 6 }}
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
          <div style={{ fontSize: 16, fontWeight: 800 }}>Mes performances</div>
        </div>

        <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'Mandats actifs', value: Math.round(mandats), color: '#2a7d9c' },
            { label: 'Exclusivités', value: Math.round(exclus), color: '#16a34a' },
            { label: 'Taux conv.', value: `${Math.round(conversion)}%`, color: '#7c3aed' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #edf2f7' }}
            >
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3, fontWeight: 600 }}>{kpi.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ padding: '0 22px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 12 }}>RAPPORTS PARTAGÉS / SEMAINE</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
            {bars.map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={inView ? { height: `${h}%` } : { height: 0 }}
                transition={{ duration: 0.7, delay: 0.7 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  flex: 1,
                  background: i === bars.length - 1 ? 'linear-gradient(180deg, #16a34a, #15803d)' : 'linear-gradient(180deg, #2a7d9c, #1d5e7a)',
                  borderRadius: '6px 6px 0 0',
                  position: 'relative' as const,
                }}
              >
                {i === bars.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                    transition={{ delay: 1.3 }}
                    style={{ position: 'absolute' as const, top: -22, left: '50%', transform: 'translateX(-50%)', fontSize: 9, fontWeight: 800, color: '#16a34a', background: '#f0fdf4', padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' as const }}
                  >+38%</motion.div>
                )}
              </motion.div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: '#cbd5e1' }}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i}>{d}</span>)}
          </div>
        </div>

        <div style={{ padding: '0 22px 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: 10 }}>DOSSIERS RÉCENTS</div>
          {[
            { name: 'M. Dupont — Paris 11ᵉ', score: 16, color: '#16a34a' },
            { name: 'Mme Martin — Lyon 6ᵉ', score: 12, color: '#f59e0b' },
            { name: 'M. Bernard — Neuilly', score: 18, color: '#16a34a' },
          ].map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.4, delay: 1.4 + i * 0.1 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg, #f0f7fb, #e8f4f8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={12} style={{ color: '#2a7d9c' }} />
              </div>
              <span style={{ flex: 1, fontSize: 11.5, fontWeight: 600, color: '#0f172a' }}>{d.name}</span>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${d.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: d.color }}>{d.score}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: -10 }}
        animate={inView ? { opacity: 1, scale: 1, rotate: -3 } : { opacity: 0, scale: 0, rotate: -10 }}
        transition={{ duration: 0.6, delay: 1.7, type: 'spring', stiffness: 200 }}
        style={{
          position: 'absolute' as const, top: -16, right: -10,
          background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff',
          padding: '10px 14px', borderRadius: 12,
          boxShadow: '0 14px 32px rgba(22,163,74,0.32)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
        <Award size={16} />
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.9 }}>NOUVEAU MANDAT</div>
          <div style={{ fontSize: 11.5, fontWeight: 800 }}>Exclusivité signée 🎉</div>
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// SECTION CONSTAT — Scénario + stats animées
// ════════════════════════════════════════════════════════════════════
function ConstatSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const stats = [
    { number: 73, suffix: '%', label: 'des acheteurs ne lisent pas les documents reçus en ZIP' },
    { number: 4, suffix: '/10', label: 'mandats sont remportés grâce à la qualité du dossier' },
    { number: 2, suffix: 'h', label: 'gagnées par dossier pour analyser les documents' },
  ];

  return (
    <section ref={ref} style={{ padding: '100px 24px', background: '#fff', position: 'relative' as const, overflow: 'hidden' }}>
      <motion.div
        animate={inView ? { x: [0, 30, 0], y: [0, -20, 0] } : {}}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute' as const, top: '20%', right: '-10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.06), transparent 70%)' }}
      />
      <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' as const }}>
        <Reveal>
          <div style={{ textAlign: 'center' as const, marginBottom: 70, maxWidth: 720, margin: '0 auto 70px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.18)', fontSize: 11.5, fontWeight: 800, color: '#dc2626', letterSpacing: '0.06em', marginBottom: 18 }}>
              <AlertTriangle size={13} /> LE CONSTAT
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 18px 0', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
              Aujourd'hui, vous perdez du temps
              <br />
              <span style={{ color: '#dc2626' }}>et vos clients aussi.</span>
            </h2>
            <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.6 }}>
              Sans manager derrière vous, chaque détail fait la différence — et chaque dossier mal présenté coûte un mandat.
            </p>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <div style={{
            background: 'linear-gradient(135deg, #fef2f2 0%, #fef5f5 100%)',
            borderRadius: 24,
            padding: 40,
            border: '1px solid #fecaca',
            marginBottom: 60,
            position: 'relative' as const,
            overflow: 'hidden',
          }}
            className="scenario-card"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.2, delay: 0.4 }}
              style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #dc2626, #f87171)', transformOrigin: 'left' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 32, alignItems: 'center' }} className="scenario-grid">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 100, background: '#fff', border: '1px solid #fecaca', fontSize: 10.5, fontWeight: 800, color: '#dc2626', letterSpacing: '0.04em', marginBottom: 14 }}>
                  <X size={11} /> SANS VERIMO
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#7f1d1d', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                  « Je télécharge 12 PDFs… »
                </h3>
                <p style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.6, margin: 0 }}>
                  Vous lisez en diagonale 200 pages de jargon copro dans la voiture. Vous découvrez les pièges en compromis. Trop tard.
                </p>
              </div>

              <motion.div
                animate={inView ? { x: [0, 6, 0] } : {}}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 32, color: '#dc2626' }}
                className="scenario-arrow"
              >
                →
              </motion.div>

              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 100, background: '#fff', border: '1px solid #fecaca', fontSize: 10.5, fontWeight: 800, color: '#dc2626', letterSpacing: '0.04em', marginBottom: 14 }}>
                  ⚠️ CONSÉQUENCE
                </div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: '#7f1d1d', margin: '0 0 10px 0', lineHeight: 1.3 }}>
                  Mandats perdus.
                </h3>
                <p style={{ fontSize: 14, color: '#991b1b', lineHeight: 1.6, margin: 0 }}>
                  Le vendeur signe avec un concurrent plus pro. L'acheteur change d'avis. Et vous reprenez à zéro.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} index={i} inView={inView} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) {
          .scenario-card { padding: 26px !important; }
          .scenario-grid { grid-template-columns: 1fr !important; gap: 22px !important; }
          .scenario-arrow { transform: rotate(90deg); }
        }
      `}</style>
    </section>
  );
}

function StatCard({ stat, index, inView }: { stat: { number: number; suffix: string; label: string }; index: number; inView: boolean }) {
  const value = useCountUp(stat.number, 1.6, inView);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: 0.6 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{
        padding: 26,
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #edf2f7',
        boxShadow: '0 4px 14px rgba(15,45,61,0.04)',
        cursor: 'default',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 36px rgba(42,125,156,0.12)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(15,45,61,0.04)'; }}
    >
      <div style={{ fontSize: 'clamp(36px, 4vw, 48px)', fontWeight: 800, color: '#2a7d9c', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 10 }}>
        {stat.suffix === '/10' ? `${Math.round(value)}/10` : `${Math.round(value)}${stat.suffix}`}
      </div>
      <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>{stat.label}</div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPOSANT MOMENT (utilisé pour les 3 moments décisifs)
// ════════════════════════════════════════════════════════════════════
function MomentSection({ num, tag, title, scenario, benefit, stats, mockup, reverse, accent }: {
  num: string; tag: string; title: string;
  scenario: string; benefit: string;
  stats: { value: string; label: string }[];
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
      gap: 70, alignItems: 'center', marginBottom: 110,
    }} className={`moment-section ${reverse ? 'reverse' : ''}`}>
      <motion.div
        initial={{ opacity: 0, x: reverse ? 30 : -30 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: reverse ? 30 : -30 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ order: reverse ? 1 : 0 }}
      >
        <div style={{ position: 'relative' as const, marginBottom: 14 }}>
          <div style={{ position: 'absolute' as const, top: -22, left: -10, fontSize: 120, fontWeight: 900, color: 'rgba(42,125,156,0.06)', lineHeight: 1, letterSpacing: '-0.05em', pointerEvents: 'none' as const, fontFamily: 'system-ui' }}>
            {num}
          </div>
          <div style={{ position: 'relative' as const, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: `${accent}15`, border: `1px solid ${accent}30`, fontSize: 11.5, fontWeight: 800, color: accent, letterSpacing: '0.06em' }}>
            MOMENT {num} · {tag}
          </div>
        </div>

        <h3 style={{ fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 800, color: '#0f2d3d', margin: '12px 0 22px 0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
          {title}
        </h3>

        <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.65, margin: '0 0 24px 0' }}>
          {scenario}
        </p>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' as const, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              style={{ minWidth: 110 }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: accent, lineHeight: 1, marginBottom: 5 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.3 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '14px 18px', borderRadius: 12,
            background: `linear-gradient(135deg, ${accent}10, ${accent}05)`,
            border: `1px solid ${accent}25`,
          }}
        >
          <Sparkles size={18} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 14, color: '#0f2d3d', fontWeight: 600, lineHeight: 1.55 }}>{benefit}</div>
        </motion.div>
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
    description: 'Mandataires indépendants : analysez les documents de vos biens en quelques minutes. Arrivez en RDV avec une longueur d\'avance, gagnez plus de mandats exclusifs.',
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

      {/* HERO */}
      <section ref={heroRef} style={{
        position: 'relative' as const,
        background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)',
        padding: '110px 24px 110px',
        overflow: 'hidden',
        minHeight: 'calc(100vh - 80px)',
        display: 'flex', alignItems: 'center',
      }}>
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
          { top: '25%', right: '40%', size: 6, color: 'rgba(42,125,156,0.4)', delay: 2 },
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
          style={{ y: heroY, opacity: heroOpacity, maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)', gap: 60, alignItems: 'center', position: 'relative' as const, width: '100%' }}
          className="hero-grid"
        >
          <div>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', borderRadius: 100,
                background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.22)',
                fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.04em', marginBottom: 26,
              }}>
              <Sparkles size={13} /> POUR MANDATAIRES INDÉPENDANTS
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: 'clamp(34px, 4.6vw, 58px)', fontWeight: 800, lineHeight: 1.05,
                color: '#0f2d3d', margin: '0 0 20px 0', letterSpacing: '-0.025em',
              }}>
              Le mandataire qui maîtrise ses dossiers{' '}
              <span style={{ position: 'relative' as const, display: 'inline-block' }}>
                <span style={{ color: '#2a7d9c' }}>signe plus de mandats.</span>
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
                fontSize: 'clamp(15px, 1.4vw, 18px)', lineHeight: 1.6, color: '#475569',
                maxWidth: 540, margin: '0 0 36px 0',
              }}>
              Verimo analyse en quelques minutes les documents de vos biens. Vous arrivez en RDV avec une longueur d'avance — et vous repartez avec le mandat.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const, marginBottom: 30 }}
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
              style={{ display: 'flex', gap: 22, flexWrap: 'wrap' as const, fontSize: 12.5, color: '#64748b' }}
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

          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotateY: 8 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative' as const, transformStyle: 'preserve-3d' as const }}
            className="hero-mockup"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transform: 'rotate(-1deg)' }}
            >
              <MockupRapport />
            </motion.div>
            <motion.div
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1, type: 'spring', stiffness: 220 }}
              whileHover={{ scale: 1.05, rotate: 3 }}
              style={{
                position: 'absolute' as const, top: -22, right: -10,
                background: '#fff', borderRadius: 12, padding: '10px 14px',
                boxShadow: '0 14px 36px rgba(15,45,61,0.22)',
                border: '1px solid rgba(42,125,156,0.18)',
                display: 'flex', alignItems: 'center', gap: 9,
                cursor: 'default',
              }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} style={{ color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>Analyse</div>
                <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700 }}>3 minutes</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

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

      {/* CONSTAT */}
      <ConstatSection />

      {/* SOLUTION 3 ÉTAPES */}
      <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #fafcfd 0%, #f0f7fb 100%)', position: 'relative' as const, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 70 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.22)', fontSize: 11.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 18 }}>
                <Zap size={13} /> LA SOLUTION
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 16px 0', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
                Verimo : votre expert documents,{' '}
                <span style={{ color: '#2a7d9c' }}>en 3 minutes.</span>
              </h2>
              <p style={{ fontSize: 17, color: '#64748b', maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
                Notre moteur analyse les documents de copropriété et les diagnostics. Vous recevez un rapport pro, prêt à partager.
              </p>
            </div>
          </Reveal>

          <div>
            {[
              { num: '01', icon: <FileText size={26} style={{ color: '#fff' }} />, title: 'Vous déposez les documents', text: 'PV d\'AG, règlement de copropriété, diagnostics, appels de charges, carnet d\'entretien… jusqu\'à 15 documents par bien.' },
              { num: '02', icon: <Eye size={26} style={{ color: '#fff' }} />, title: 'Le moteur Verimo analyse', text: 'Chiffres clés extraits, alertes détectées, points de vigilance identifiés. Un score sur 20 résume la santé du bien.' },
              { num: '03', icon: <Send size={26} style={{ color: '#fff' }} />, title: 'Vous recevez un rapport pro', text: 'Clair, structuré, partageable en 1 clic à vos vendeurs et acheteurs. Avec votre nom.' },
            ].map((step, i) => (
              <Reveal key={i} delay={i}>
                <motion.div
                  whileHover={{ y: -6, boxShadow: '0 20px 50px rgba(42,125,156,0.14)' }}
                  transition={{ duration: 0.25 }}
                  style={{ position: 'relative' as const, padding: 32, background: '#fff', borderRadius: 20, boxShadow: '0 4px 16px rgba(15,45,61,0.06)', border: '1px solid #e8f4f8', marginBottom: 22, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center' }}
                  className="solution-step"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexShrink: 0 }}>
                    <motion.div
                      whileHover={{ rotate: 8, scale: 1.05 }}
                      style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 10px 24px rgba(42,125,156,0.32)' }}
                    >
                      {step.icon}
                    </motion.div>
                    <div style={{ fontSize: 56, fontWeight: 900, color: 'rgba(42,125,156,0.12)', lineHeight: 1, letterSpacing: '-0.04em' }} className="step-num">{step.num}</div>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f2d3d', margin: '0 0 8px 0', lineHeight: 1.3 }}>{step.title}</h3>
                    <p style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{step.text}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3 MOMENTS DÉCISIFS */}
      <section style={{ padding: '110px 24px 60px', background: '#fff', position: 'relative' as const, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 80 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.22)', fontSize: 11.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 18 }}>
                ⭐ 3 MOMENTS DÉCISIFS
              </div>
              <h2 style={{ fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 18px 0', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
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
              <p style={{ fontSize: 17, color: '#64748b', maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
                Trois instants clés du parcours mandataire. Trois moyens concrets de vous démarquer.
              </p>
            </div>
          </Reveal>

          <MomentSection
            num="01"
            tag="AVANT LA VISITE"
            title="Arrivez chez l'acheteur en mode expert."
            scenario="Au lieu de lire les PV en diagonale dans la voiture, vous connaissez déjà le bien sur le bout des doigts : charges, travaux votés, fonds travaux, procédures. Vous présentez le bien comme si vous y habitiez."
            benefit="Effet d'expertise immédiat. Le client se sent en confiance — et vous écoute."
            stats={[
              { value: '+38%', label: 'd\'efficacité en visite' },
              { value: '2h', label: 'gagnées par dossier' },
            ]}
            mockup={<MockupDashboard />}
            accent="#2a7d9c"
          />

          <MomentSection
            num="02"
            tag="APRÈS LA VISITE"
            title="Le client vous demande les documents ? Envoyez bien plus qu'un ZIP."
            scenario="Vos concurrents envoient un ZIP de 12 PDFs incompréhensibles. Vous, vous envoyez un rapport synthétique avec score /20, alertes et recommandations — directement par SMS, mail ou WhatsApp."
            benefit="Différenciation immédiate. Le client ne vous oublie pas — et il revient vers vous."
            stats={[
              { value: '×3', label: 'mémorisation par le client' },
              { value: '+24%', label: 'de re-contacts' },
            ]}
            mockup={<MockupSMS />}
            reverse
            accent="#16a34a"
          />

          <MomentSection
            num="03"
            tag="POUR GAGNER L'EXCLUSIVITÉ"
            title="Différenciez-vous dès la première rencontre vendeur."
            scenario="Pendant que les autres parlent prix et photos pro, vous arrivez avec un rapport d'analyse pro déjà fait sur leur bien. Le vendeur comprend immédiatement votre niveau de service."
            benefit="Vous gagnez l'exclu. Un seul mandat exclusif rentabilise Verimo Starter pour 6 mois."
            stats={[
              { value: '×1', label: 'mandat exclu = ROI' },
              { value: '4-8K€', label: 'commission moyenne' },
            ]}
            mockup={<MockupIPhone />}
            accent="#7c3aed"
          />
        </div>
      </section>

      {/* APERÇU RAPPORT */}
      <section id="rapport-apercu" style={{
        padding: '100px 24px',
        background: 'linear-gradient(165deg, #f0f7fb 0%, #e6f3f7 100%)',
        position: 'relative' as const, overflow: 'hidden',
      }}>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute' as const, top: '10%', left: '-8%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.1), transparent 70%)' }}
        />
        <div style={{ maxWidth: 1180, margin: '0 auto', position: 'relative' as const }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: '#fff', border: '1px solid rgba(42,125,156,0.22)', fontSize: 11.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 18 }}>
                📄 APERÇU DU RAPPORT
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 16px 0', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
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

      {/* TARIFS + ROI */}
      <section style={{ padding: '100px 24px', background: '#fff', position: 'relative' as const, overflow: 'hidden' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 60 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.22)', fontSize: 11.5, fontWeight: 800, color: '#2a7d9c', letterSpacing: '0.06em', marginBottom: 18 }}>
                <TrendingUp size={13} /> TARIFS PRO
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 3.6vw, 44px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 16px 0', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
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
                    background: plan.popular ? 'linear-gradient(165deg, #f0f7fb 0%, #e6f3f7 100%)' : '#fff',
                    border: plan.popular ? '2px solid #2a7d9c' : '1px solid #edf2f7',
                    position: 'relative' as const,
                    height: '100%', boxSizing: 'border-box' as const,
                    boxShadow: plan.popular ? '0 18px 44px rgba(42,125,156,0.2)' : '0 2px 8px rgba(15,45,61,0.04)',
                    cursor: 'default',
                  }}>
                  {plan.popular && (
                    <div style={{
                      position: 'absolute' as const, top: -13, left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff',
                      padding: '6px 14px', borderRadius: 100, fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                      boxShadow: '0 6px 16px rgba(42,125,156,0.4)',
                    }}>
                      ⭐ POPULAIRE
                    </div>
                  )}
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 10 }}>{plan.tag.toUpperCase()}</div>
                  <h3 style={{ fontSize: 26, fontWeight: 800, color: '#0f2d3d', margin: '0 0 18px 0', letterSpacing: '-0.02em' }}>{plan.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 24 }}>
                    <span style={{ fontSize: 40, fontWeight: 800, color: '#0f2d3d', letterSpacing: '-0.02em' }}>{plan.price}€</span>
                    <span style={{ fontSize: 14, color: '#64748b' }}>HT/mois</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(15,45,61,0.08)', paddingTop: 20 }}>
                    {[
                      `${plan.completes} analyse${plan.completes > 1 ? 's' : ''} complète${plan.completes > 1 ? 's' : ''} / mois`,
                      `${plan.simples} analyses simples / mois`,
                      'Rapports partageables en 1 clic',
                      'Marque Verimo Pro',
                      'Achat à l\'unité possible',
                    ].map((feat, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', fontSize: 14, color: '#475569' }}>
                        <CheckCircle2 size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
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

      {/* CTA FINAL */}
      <section style={{ padding: '100px 24px', background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)', position: 'relative' as const, overflow: 'hidden' }}>
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
            <h2 style={{ fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 800, color: '#0f2d3d', margin: '0 0 20px 0', lineHeight: 1.08, letterSpacing: '-0.025em' }}>
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
          .hero-grid { grid-template-columns: 1fr !important; gap: 50px !important; }
          .moment-section { grid-template-columns: 1fr !important; gap: 40px !important; }
          .moment-section.reverse > div:first-child { order: 1 !important; }
          .moment-section > div:nth-child(2) { order: 0 !important; }
          .apercu-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .solution-step { grid-template-columns: 1fr !important; gap: 16px !important; }
          .step-num { display: none !important; }
        }
      `}</style>
    </div>
  );
}
