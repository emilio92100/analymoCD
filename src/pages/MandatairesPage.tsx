import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  Sparkles, ArrowRight, Check, ShieldCheck, Clock, Award,
  FileText, Eye, Star, Zap,
  Upload, Send, FileSearch, MailCheck,
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;
const isLowPerf = () => isIOS() || isMobile();
const _lp = isLowPerf();

/**
 * Palette confettis Verimo : référence aux couleurs du score
 * - Vert : score haut / "bien sain" (≥15/20)
 * - Orange : vigilance (10-14/20)
 * - Rouge : alerte (< 10/20)
 * - Bleu Verimo : signature de marque
 * À réutiliser sur HomePage et autres pages pour cohérence visuelle.
 */
const VERIMO_CONFETTI_COLORS = {
  green: '#10b981',   // score haut
  orange: '#f97316',  // vigilance
  red: '#ef4444',     // alerte
  blue: '#2a7d9c',    // bleu Verimo
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: _lp ? 6 : 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: _lp ? 0.2 : 0.6, delay: _lp ? Math.min(i * 0.02, 0.06) : i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

function Reveal({ children, delay = 0, className = '', style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} className={className} style={style} variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'} custom={delay}>
      {children}
    </motion.div>
  );
}

function Confetti({ items }: { items: Array<{ top?: string; bottom?: string; left?: string; right?: string; size: number; color: string; shape: 'circle' | 'square'; delay?: number }> }) {
  return (
    <>
      {items.map((c, i) => (
        <motion.div
          key={i}
          animate={_lp ? {} : { y: [0, -8, 0], rotate: c.shape === 'square' ? [45, 90, 45] : [0, 360, 0] }}
          transition={_lp ? {} : { duration: 4 + i * 0.3, repeat: Infinity, delay: c.delay || 0, ease: 'easeInOut' }}
          style={{
            position: 'absolute' as const,
            top: c.top, bottom: c.bottom, left: c.left, right: c.right,
            width: c.size, height: c.size,
            background: c.color,
            borderRadius: c.shape === 'circle' ? '50%' : '2px',
            transform: c.shape === 'square' ? 'rotate(45deg)' : undefined,
            opacity: 0.7,
            pointerEvents: 'none' as const,
          }}
        />
      ))}
    </>
  );
}

function PhoneFrame({ children, rotate = 0, scale = 1 }: { children: React.ReactNode; rotate?: number; scale?: number }) {
  return (
    <div style={{
      width: 260, height: 540,
      background: 'linear-gradient(160deg, #1a1a1c 0%, #2c2c2e 100%)',
      borderRadius: 44, padding: 7,
      boxShadow: '0 30px 80px rgba(15,45,61,0.35), 0 12px 30px rgba(0,0,0,0.2), inset 0 0 0 2px rgba(255,255,255,0.06)',
      position: 'relative' as const,
      transform: `rotate(${rotate}deg) scale(${scale})`,
      transformStyle: 'preserve-3d' as const,
    }}>
      <div style={{
        position: 'absolute' as const, top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 95, height: 24, background: '#000', borderRadius: 100, zIndex: 10,
      }} />
      <div style={{
        width: '100%', height: '100%',
        background: '#fff',
        borderRadius: 38, overflow: 'hidden', position: 'relative' as const,
      }}>
        {children}
      </div>
    </div>
  );
}

function PhoneContentRapport() {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px 8px', fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
        <span>9:41</span>
        <span style={{ fontSize: 10 }}>●●●●● 100%</span>
      </div>
      <div style={{ padding: '14px 18px 14px', background: 'linear-gradient(135deg, #0f2d3d, #2a7d9c)', color: '#fff' }}>
        <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.8, letterSpacing: '0.08em' }}>RAPPORT VERIMO</div>
        <div style={{ fontSize: 13, fontWeight: 800, marginTop: 4 }}>24 rue des Lilas</div>
        <div style={{ fontSize: 10, opacity: 0.75, marginTop: 2 }}>Appartement T3 · Lyon 6e</div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#16a34a', color: '#fff', fontSize: 13, fontWeight: 800, padding: '4px 10px', borderRadius: 8 }}>14.8/20</div>
          <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 600 }}>Bien sain</div>
        </div>
      </div>
      <div style={{ padding: '12px 18px 10px' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 6 }}>NOTATION</div>
        <div style={{ height: 8, borderRadius: 4, background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 33%, #fbbf24 50%, #84cc16 75%, #16a34a 100%)', position: 'relative' as const }}>
          <div style={{ position: 'absolute' as const, top: -3, left: '74%', width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '2px solid #16a34a' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 7, color: '#94a3b8' }}>
          <span>Éviter</span><span>Sain</span><span>Irréproch.</span>
        </div>
      </div>
      <div style={{ padding: '4px 18px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {[
          { label: 'Charges', val: '180€', col: '#16a34a' },
          { label: 'Fonds trav.', val: '42 k€', col: '#2a7d9c' },
          { label: 'Litiges', val: '0', col: '#16a34a' },
        ].map((k, i) => (
          <div key={i} style={{ padding: '6px 8px', background: '#f8fafc', borderRadius: 8, border: '1px solid #edf2f7' }}>
            <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600 }}>{k.label}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: k.col, marginTop: 1 }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '6px 18px' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 6 }}>POINTS POSITIFS</div>
        {['Syndic reconduit avec quitus', 'Budget maîtrisé (+7%)', 'Quorum confortable 67%'].map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 0', fontSize: 9, color: '#0f172a' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#16a34a' }} />
            {p}
          </div>
        ))}
      </div>
      <div style={{ margin: '8px 14px', padding: '8px 10px', background: 'linear-gradient(135deg, #0f2d3d, #1a4a5e)', borderRadius: 10, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <Star size={10} fill="#fbbf24" stroke="#fbbf24" />
          <div style={{ fontSize: 9, fontWeight: 800 }}>Avis Verimo</div>
        </div>
        <div style={{ fontSize: 8, lineHeight: 1.4, opacity: 0.9 }}>
          Copropriété saine, peu de travaux à anticiper. Investissement serein.
        </div>
      </div>
    </>
  );
}

function PhoneContentDashboard() {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px 8px', fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
        <span>9:41</span>
        <span style={{ fontSize: 10 }}>●●●●● 100%</span>
      </div>
      <div style={{ padding: '6px 18px 14px' }}>
        <div style={{ fontSize: 10, color: '#64748b' }}>Bonjour Alexandre 👋</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f2d3d', marginTop: 2 }}>Mes analyses</div>
      </div>
      <div style={{ margin: '0 14px', padding: '12px 14px', background: 'linear-gradient(135deg, #2a7d9c, #1a4a5e)', borderRadius: 12, color: '#fff' }}>
        <div style={{ fontSize: 9, opacity: 0.85, fontWeight: 600 }}>VERIMO PRO</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>12 analyses</div>
            <div style={{ fontSize: 9, opacity: 0.8 }}>restantes ce mois</div>
          </div>
          <Zap size={22} />
        </div>
      </div>
      <div style={{ padding: '14px 14px 0' }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 8 }}>RÉCENTES</div>
        {[
          { addr: '14 rue Mozart, Paris 16e', score: 15.2, col: '#16a34a' },
          { addr: '8 av. République, Lyon 3e', score: 11.8, col: '#f59e0b' },
          { addr: '22 rue Cler, Paris 7e', score: 17.4, col: '#16a34a' },
        ].map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${a.col}15`, color: a.col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>
              {a.score.toFixed(1)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }}>{a.addr}</div>
              <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 1 }}>Analyse complète</div>
            </div>
            <div style={{ fontSize: 11, color: '#cbd5e1' }}>›</div>
          </div>
        ))}
      </div>
      <div style={{ margin: '10px 14px 0', padding: '10px 12px', background: '#f0f7fb', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#2a7d9c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={14} />
        </div>
        <div style={{ flex: 1, fontSize: 9, color: '#0f2d3d' }}>
          <div style={{ fontWeight: 700 }}>Partager le rapport</div>
          <div style={{ color: '#64748b', marginTop: 1 }}>Lien co-brandé client</div>
        </div>
      </div>
    </>
  );
}

function PhoneContentSMS() {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px 8px', fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
        <span>14:32</span>
        <span style={{ fontSize: 10 }}>●●●●● 100%</span>
      </div>
      <div style={{ padding: '8px 14px 12px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' as const }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #ec4899, #f97316)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, marginBottom: 4 }}>S</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Sophie · Acheteuse</div>
        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>iMessage</div>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <div style={{ alignSelf: 'flex-start' as const, maxWidth: '80%' }}>
          <div style={{ background: '#e8e8ec', color: '#0f172a', padding: '8px 11px', borderRadius: '16px 16px 16px 4px', fontSize: 10, lineHeight: 1.4 }}>
            Bonjour, suite à notre visite, est-ce que je pourrais avoir le PV d'AG et les diagnostics ?
          </div>
          <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 2, paddingLeft: 4 }}>14:32</div>
        </div>
        <div style={{ alignSelf: 'flex-end' as const, maxWidth: '80%' }}>
          <div style={{ background: '#007aff', color: '#fff', padding: '8px 11px', borderRadius: '16px 16px 4px 16px', fontSize: 10, lineHeight: 1.4 }}>
            Bien sûr Sophie ! Je vous envoie le rapport complet du bien dans 5 minutes 🙂
          </div>
        </div>
        <div style={{ alignSelf: 'flex-end' as const, maxWidth: '85%' }}>
          <div style={{ background: '#fff', border: '1px solid #007aff', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #2a7d9c)', color: '#fff', padding: '7px 10px' }}>
              <div style={{ fontSize: 8, opacity: 0.85, fontWeight: 700 }}>RAPPORT VERIMO</div>
              <div style={{ fontSize: 10, fontWeight: 800, marginTop: 2 }}>24 rue des Lilas</div>
              <div style={{ display: 'inline-block', marginTop: 4, background: '#16a34a', color: '#fff', padding: '2px 7px', borderRadius: 5, fontSize: 9, fontWeight: 800 }}>14.8/20</div>
            </div>
            <div style={{ padding: '6px 10px', fontSize: 9, color: '#007aff', textAlign: 'center' as const, fontWeight: 600 }}>
              Voir le rapport →
            </div>
          </div>
          <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 2, textAlign: 'right' as const, paddingRight: 4 }}>14:37 · Vu</div>
        </div>
        <div style={{ alignSelf: 'flex-start' as const, maxWidth: '80%' }}>
          <div style={{ background: '#e8e8ec', color: '#0f172a', padding: '8px 11px', borderRadius: '16px 16px 16px 4px', fontSize: 10, lineHeight: 1.4 }}>
            Merci ! C'est super pro 🤩 On confirme l'offre !
          </div>
          <div style={{ fontSize: 7, color: '#94a3b8', marginTop: 2, paddingLeft: 4 }}>14:42</div>
        </div>
      </div>
    </>
  );
}

function FloatingReport() {
  return (
    <div style={{ position: 'relative' as const, width: '100%', height: 400 }}>
      <motion.div
        animate={_lp ? {} : { y: [0, -6, 0] }}
        transition={_lp ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute' as const, top: '8%', left: '8%', width: '70%',
          background: '#fff', borderRadius: 16, padding: 18,
          boxShadow: '0 24px 60px rgba(15,45,61,0.18), 0 8px 20px rgba(15,45,61,0.08)',
          transform: 'rotate(-3deg)',
          zIndex: 2,
        }}>
        <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #2a7d9c)', color: '#fff', padding: '10px 14px', borderRadius: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 700, letterSpacing: '0.06em' }}>SYNTHÈSE</div>
          <div style={{ fontSize: 14, fontWeight: 800, marginTop: 3 }}>PV AG — Résidence Les Lilas</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
          {[
            { val: '45k€', lbl: 'Budget' },
            { val: '67%', lbl: 'Quorum' },
            { val: '8', lbl: 'Résolutions' },
          ].map((k, i) => (
            <div key={i} style={{ background: '#f0f9ff', padding: '8px', borderRadius: 8, textAlign: 'center' as const }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#2a7d9c' }}>{k.val}</div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>{k.lbl}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fef3c7', padding: '8px 10px', borderRadius: 8, fontSize: 10, color: '#92400e', fontWeight: 600 }}>
          ⚠ Travaux votés à venir : 4 500€
        </div>
      </motion.div>
      <motion.div
        animate={_lp ? {} : { y: [0, 5, 0] }}
        transition={_lp ? {} : { duration: 6, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
        style={{
          position: 'absolute' as const, bottom: '8%', right: '6%', width: '62%',
          background: '#fff', borderRadius: 14, padding: 14,
          boxShadow: '0 24px 60px rgba(15,45,61,0.2), 0 8px 20px rgba(15,45,61,0.08)',
          transform: 'rotate(4deg)',
          zIndex: 3,
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #16a34a, #15803d)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={13} fill="#fff" stroke="#fff" />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f2d3d' }}>Avis Verimo</div>
        </div>
        <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.5 }}>
          Copropriété saine mais procédure d'impayés en cours sur le lot 12. <strong>Marge de négociation possible</strong> sur le prix de vente.
        </div>
      </motion.div>
    </div>
  );
}

function StackedTabs() {
  return (
    <div style={{ position: 'relative' as const, width: '100%', height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute' as const, top: 70, left: '10%', right: '10%', height: 220, background: '#fff', borderRadius: 14, boxShadow: '0 12px 30px rgba(15,45,61,0.1)', opacity: 0.45, transform: 'scale(0.92) translateY(30px)' }} />
      <div style={{ position: 'absolute' as const, top: 50, left: '7%', right: '7%', height: 220, background: '#fff', borderRadius: 14, boxShadow: '0 14px 35px rgba(15,45,61,0.13)', opacity: 0.7, transform: 'scale(0.96) translateY(15px)' }} />
      <motion.div
        animate={_lp ? {} : { y: [0, -4, 0] }}
        transition={_lp ? {} : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute' as const, top: 30, left: '4%', right: '4%', background: '#fff', borderRadius: 14, padding: 16, boxShadow: '0 20px 50px rgba(15,45,61,0.22)' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
          <div style={{ padding: '4px 10px', background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 6 }}>Synthèse</div>
          <div style={{ padding: '4px 10px', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>Copro</div>
          <div style={{ padding: '4px 10px', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>Logement</div>
          <div style={{ padding: '4px 10px', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>Procédures</div>
          <div style={{ padding: '4px 10px', color: '#94a3b8', fontSize: 10, fontWeight: 600 }}>Docs</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'conic-gradient(#16a34a 0% 74%, #f1f5f9 74% 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#0f172a' }}>14.8</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>24 rue des Lilas, Lyon 6e</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Appartement T3 — 62 m²</div>
            <div style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', background: '#ecfdf5', color: '#047857', fontSize: 9, fontWeight: 800, borderRadius: 5 }}>Bien sain</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
          {[
            { lbl: 'État travaux', pts: '2.5/5', val: 50, col: '#ef4444' },
            { lbl: 'Risques juridiques', pts: '2.5/4', val: 62, col: '#f59e0b' },
            { lbl: 'Santé financière', pts: '3/4', val: 75, col: '#f59e0b' },
            { lbl: 'Diagnostics privatifs', pts: '3/4', val: 75, col: '#f59e0b' },
            { lbl: 'Diagnostics communs', pts: '2/3', val: 66, col: '#f59e0b' },
          ].map((c, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 2 }}>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{c.lbl}</span>
                <span style={{ color: c.col, fontWeight: 700 }}>{c.pts}</span>
              </div>
              <div style={{ height: 3, background: '#f1f5f9', borderRadius: 2 }}>
                <div style={{ width: `${c.val}%`, height: '100%', background: c.col, borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ──────────────────────────────────────────
   MockupSendPopup — Popup "Envoyer une analyse" étape 3/3
   Reproduction fidèle du composant réel de l'app pour montrer
   exactement ce que le pro voit au moment d'envoyer le rapport.
   ────────────────────────────────────────── */
function MockupSendPopup() {
  return (
    <div style={{
      width: '100%', maxWidth: 380,
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 24px 60px rgba(15,45,61,0.18), 0 8px 20px rgba(15,45,61,0.08)',
      border: '1px solid #f1f5f9',
      overflow: 'hidden',
      fontSize: 11,
    }}>
      {/* Header avec icône et titre */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MailCheck size={14} style={{ color: '#7c3aed' }} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Envoyer une analyse</div>
          </div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>×</div>
        </div>
        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>✓</div>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Destinataires</span>
          </div>
          <div style={{ flex: 1, height: 1.5, background: '#10b981', borderRadius: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>✓</div>
            <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Analyses</span>
          </div>
          <div style={{ flex: 1, height: 1.5, background: '#2a7d9c', borderRadius: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#2a7d9c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800 }}>3</div>
            <span style={{ fontSize: 10, color: '#0f172a', fontWeight: 700 }}>Message</span>
          </div>
        </div>
      </div>

      {/* Sous-titre */}
      <div style={{ padding: '10px 16px 6px' }}>
        <div style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>✉️ Personnalisez votre message :</div>
        <div style={{ fontSize: 9.5, color: '#94a3b8', marginTop: 2 }}>→ 1 destinataire · 1 analyse</div>
      </div>

      {/* Zone message */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 10.5, color: '#0f172a', lineHeight: 1.5 }}>
          <div style={{ marginBottom: 6 }}>Bonjour,</div>
          <div style={{ marginBottom: 6 }}>Dans le cadre de votre projet immobilier, je vous transmets le rapport d'analyse du bien situé 24 rue des Lilas, 69006 Lyon.</div>
          <div>Ce rapport vous permettra d'avoir une vision claire des points clés du dossier...</div>
        </div>
      </div>

      {/* Info logo */}
      <div style={{ margin: '0 16px 12px', padding: '8px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, fontSize: 9.5, color: '#92400e', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, lineHeight: 1 }}>💡</span>
        <span>Pour afficher votre logo dans les rapports, ajoutez-le dans <strong>Mon compte</strong>.</span>
      </div>

      {/* Boutons */}
      <div style={{ padding: '10px 16px 14px', display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ flex: '0 0 auto', padding: '8px 14px', borderRadius: 8, background: '#fff', border: '1.5px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: '#64748b' }}>← Retour</div>
        <div style={{ flex: 1, padding: '9px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: 11.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 6px 14px rgba(16,185,129,0.3)' }}>
          <Send size={12} /> Envoyer
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   MockupClientEmail — Email reçu côté client
   Reproduction fidèle du template mail envoyé au client.
   ────────────────────────────────────────── */
function MockupClientEmail() {
  return (
    <div style={{
      width: '100%', maxWidth: 380,
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 24px 60px rgba(15,45,61,0.18), 0 8px 20px rgba(15,45,61,0.08)',
      border: '1px solid #f1f5f9',
      overflow: 'hidden',
      fontSize: 11,
    }}>
      {/* Header email — bleu Verimo */}
      <div style={{ padding: '18px 18px 16px', background: 'linear-gradient(165deg, #0f2d3d, #1d5e7a)', color: '#fff', textAlign: 'center' as const }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Rapport d'analyse immobilière</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.85)' }}>24 rue des Lilas, 69006 Lyon</div>
      </div>

      {/* Logo Laforêt — stylisé en texte sur fond blanc, entre header et "présenté par" */}
      <div style={{ padding: '14px 18px 4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: '#003478', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,52,120,0.25)' }}>
          {/* Petit arbre stylisé en SVG, blanc sur fond bleu Laforêt */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2 L7 8 L9 8 L5 14 L8 14 L4 20 L11 20 L11 22 L13 22 L13 20 L20 20 L16 14 L19 14 L15 8 L17 8 Z" fill="#fff" />
          </svg>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#003478', letterSpacing: '-0.02em', fontFamily: 'Georgia, serif' }}>laforêt</div>
      </div>

      {/* Pro signature */}
      <div style={{ padding: '10px 18px 10px' }}>
        <div style={{ fontSize: 11.5, color: '#0f172a', fontWeight: 600, paddingBottom: 10, borderBottom: '1px solid #f1f5f9', textAlign: 'center' as const }}>
          Ce rapport vous est présenté par <strong style={{ color: '#0f2d3d' }}>Pierre Martin</strong>
        </div>
      </div>

      {/* Corps du message */}
      <div style={{ padding: '6px 18px 14px', fontSize: 11, color: '#0f172a', lineHeight: 1.55 }}>
        <div style={{ marginBottom: 8 }}>Bonjour Sophie,</div>
        <div style={{ marginBottom: 8 }}>Dans le cadre de votre projet immobilier, je vous transmets le rapport d'analyse concernant le bien situé 24 rue des Lilas, 69006 Lyon.</div>
        <div style={{ marginBottom: 8 }}>N'hésitez pas à me contacter pour en discuter ensemble.</div>
        <div style={{ marginBottom: 4 }}>Cordialement,</div>
        <div style={{ fontWeight: 700 }}>Pierre Martin</div>
        <div style={{ color: '#003478', fontSize: 10.5, fontWeight: 700 }}>Laforêt — Lyon</div>
      </div>

      {/* Carte rapport */}
      <div style={{ margin: '0 18px 14px', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <FileText size={13} style={{ color: '#2a7d9c', flexShrink: 0 }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Rapport Verimo — 24 rue des Lilas</div>
        </div>
        <div style={{ fontSize: 11, color: '#2a7d9c', fontWeight: 700, marginLeft: 21, marginTop: 4 }}>
          Consulter le rapport →
        </div>
      </div>

      {/* Footer sécurité */}
      <div style={{ padding: '10px 18px 14px', textAlign: 'center' as const, fontSize: 9.5, color: '#94a3b8' }}>
        🔒 Lien personnel et sécurisé. Aucun compte n'est nécessaire.
      </div>
    </div>
  );
}

export default function MandatairesPage() {
  useSEO({
    title: 'Verimo Pro pour agents & mandataires immobiliers — Analysez vos documents en 3 minutes',
    description: 'Agents immobiliers et mandataires : analysez les PV d\'AG, diagnostics et règlements de vos biens en quelques minutes. Envoyez à vos clients un rapport pro en 1 clic.',
  });

  return (
    <div style={{ background: '#fff', color: '#0f172a', overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        /* ── Tablette & mobile (< 900px) ── */
        @media (max-width: 900px) {
          .hero-split { grid-template-columns: 1fr !important; gap: 16px !important; text-align: center; }
          .hero-text { text-align: center; }
          .hero-text p, .hero-text h1 { margin-left: auto !important; margin-right: auto !important; }
          .hero-text > div:nth-of-type(2),
          .hero-text > div:nth-of-type(3) {
            justify-content: center !important;
          }
          /* Téléphones Hero : très réduits sur mobile */
          .hero-phones { height: 300px !important; transform: scale(0.65); transform-origin: center top; }

          /* Scénarios : texte d'abord, téléphone en bas */
          .scenario-grid { grid-template-columns: 1fr !important; gap: 18px !important; }
          .scenario-grid > div:has(.scenario-visual) { order: 2; }
          .scenario-grid > div:not(:has(.scenario-visual)) { order: 1; }
          .scenario-visual { height: auto !important; min-height: 320px; max-height: 480px; padding: 16px !important; }
          .scenario-visual.scenario-2 { min-height: 300px; }
          .scenario-visual.scenario-3 { min-height: 300px; }

          /* SCÉNARIO ENVOI : on casse l'absolute pour stack vertical mobile */
          .scenario-envoi {
            min-height: 0 !important;
            max-height: none !important;
            height: auto !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
            padding: 20px 14px !important;
          }
          .scenario-envoi > .scenario-mockup {
            position: static !important;
            width: 100% !important;
            max-width: 320px !important;
            margin: 0 auto !important;
            transform: none !important;
          }
          .scenario-envoi > .scenario-mockup .scenario-mockup-label {
            position: static !important;
            text-align: center !important;
            margin-bottom: 8px !important;
            display: block !important;
          }

          .cta-final h2 { font-size: clamp(26px, 7vw, 36px) !important; }
          .steps-row { grid-template-columns: 1fr !important; gap: 14px !important; }
          .step-arrow { display: none !important; }

          /* Stats : grille 2×2 sur mobile au lieu de 1×4 */
          .stats-row { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .stats-card { padding: 16px 12px !important; }
          .stats-card .stats-val { font-size: 22px !important; }
          .stats-card .stats-lbl { font-size: 11px !important; }
        }
        /* ── Mobile pur (< 640px) — réglages plus serrés ── */
        @media (max-width: 640px) {
          .hero-phones { height: 240px !important; transform: scale(0.55); transform-origin: center top; }
          .scenario-visual { padding: 12px !important; min-height: 280px !important; max-height: 440px !important; }
          .scenario-visual > div[style*="transform: rotate"] { transform: scale(0.78) !important; }
          .scenario-envoi > .scenario-mockup { max-width: 280px !important; }
        }
        /* ── Desktop (≥ 901px) — titres et descriptions de CTA sur une seule ligne ── */
        @media (min-width: 901px) {
          .cta-final h2, .cta-final p { white-space: nowrap; }
        }
      `}</style>
      <section style={{ position: 'relative' as const, background: 'linear-gradient(165deg, #ffffff 0%, #f5f9fc 40%, #e8f3f8 70%, #fafbfd 100%)', padding: '120px 24px 80px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute' as const, top: '15%', left: '15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(125,211,252,0.22), transparent 65%)', pointerEvents: 'none' as const }} />
        <div style={{ position: 'absolute' as const, top: '25%', right: '12%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(186,230,253,0.28), transparent 65%)', pointerEvents: 'none' as const }} />

        <Confetti items={[
          { top: '14%', left: '6%', size: 12, color: VERIMO_CONFETTI_COLORS.blue, shape: 'circle' },
          { top: '20%', left: '88%', size: 14, color: VERIMO_CONFETTI_COLORS.orange, shape: 'square', delay: 0.5 },
          { top: '42%', left: '4%', size: 8, color: VERIMO_CONFETTI_COLORS.red, shape: 'circle', delay: 1 },
          { top: '58%', left: '92%', size: 10, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 1.5 },
          { top: '75%', left: '8%', size: 14, color: VERIMO_CONFETTI_COLORS.blue, shape: 'square', delay: 0.8 },
          { top: '82%', left: '86%', size: 10, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1.2 },
          { top: '32%', left: '50%', size: 9, color: VERIMO_CONFETTI_COLORS.green, shape: 'circle', delay: 0.3 },
          { top: '65%', left: '46%', size: 11, color: VERIMO_CONFETTI_COLORS.red, shape: 'square', delay: 1.8 },
        ]} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' as const, zIndex: 2 }}>
          <div className="hero-split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>

            {/* ── COLONNE GAUCHE : texte + CTA ── */}
            <div className="hero-text">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.1)', border: '1px solid rgba(42,125,156,0.22)', fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.04em', marginBottom: 24 }}>
                <Sparkles size={13} /> POUR AGENTS & MANDATAIRES IMMOBILIERS
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{ fontSize: 'clamp(32px, 4vw, 54px)', fontWeight: 800, lineHeight: 1.08, color: '#0f2d3d', margin: '0 0 18px', letterSpacing: '-0.025em' }}>
                Soyez l'agent qui{' '}
                <span style={{ position: 'relative' as const, display: 'inline-block', whiteSpace: 'nowrap' as const }}>
                  <span style={{ color: '#2a7d9c' }}>répond à tout</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 2.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    style={{ position: 'absolute' as const, bottom: -2, left: 0, right: 0, height: 5, background: 'rgba(42,125,156,0.3)', borderRadius: 99, transformOrigin: 'left', display: 'block' }}
                  />
                </span>.
                <br />
                <span style={{ color: '#475569', fontWeight: 600, fontSize: '0.72em' }}>
                  Pas celui qui dit <em style={{ color: '#94a3b8' }}>« je vais me renseigner »</em>.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                style={{ fontSize: 'clamp(15px, 1.2vw, 17px)', lineHeight: 1.6, color: '#475569', margin: '0 0 28px', maxWidth: 540 }}>
                Analysez les documents de vos biens en quelques minutes. Envoyez à vos clients un rapport pro en un seul clic.
                <br />
                <strong style={{ color: '#0f2d3d' }}>Plus de signatures. Moins de doutes.</strong>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const, marginBottom: 22 }}>
                <motion.a
                  href="/pro/rejoindre"
                  whileHover={{ y: -2, boxShadow: '0 14px 32px rgba(42,125,156,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '13px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #1d5e7a)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700, boxShadow: '0 10px 26px rgba(42,125,156,0.3)' }}>
                  Démarrer maintenant <ArrowRight size={15} />
                </motion.a>
                <motion.a
                  href="/exemple"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '13px 22px', borderRadius: 12, background: '#fff', color: '#2a7d9c', border: '1.5px solid #d0e8f0', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
                  Voir un rapport exemple
                </motion.a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                  <ShieldCheck size={12} /> Sans engagement
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'rgba(42,125,156,0.1)', border: '1px solid rgba(42,125,156,0.25)', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#1d5e7a' }}>
                  <Clock size={12} /> Démo en 15 min
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 100, fontSize: 12, fontWeight: 700, color: '#6d28d9' }}>
                  <Award size={12} /> 100% immobilier
                </span>
              </motion.div>
            </div>

            {/* ── COLONNE DROITE : téléphones ── */}
            <motion.div
              className="hero-phones"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative' as const, height: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div
                animate={_lp ? {} : { y: [0, -8, 0] }}
                transition={_lp ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'absolute' as const, left: '0%', top: '5%', zIndex: 2 }}>
                <PhoneFrame rotate={-8} scale={0.92}>
                  <PhoneContentRapport />
                </PhoneFrame>
              </motion.div>
              <motion.div
                animate={_lp ? {} : { y: [0, 8, 0] }}
                transition={_lp ? {} : { duration: 6, repeat: Infinity, delay: 0.5, ease: 'easeInOut' }}
                style={{ position: 'absolute' as const, right: '0%', top: '18%', zIndex: 3 }}>
                <PhoneFrame rotate={8} scale={0.92}>
                  <PhoneContentDashboard />
                </PhoneFrame>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      <section style={{ padding: '60px 24px', background: '#fafbfd' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            {[
              { val: '~3 min', lbl: 'par dossier', grad: 'linear-gradient(135deg, #2a7d9c, #7dd3fc)' },
              { val: '24h/24', lbl: 'analyse à tout moment', grad: 'linear-gradient(135deg, #ec4899, #fbbf24)' },
              { val: '/20', lbl: 'score objectif', grad: 'linear-gradient(135deg, #10b981, #34d399)' },
              { val: '100%', lbl: 'à votre image', grad: 'linear-gradient(135deg, #7c3aed, #a78bfa)' },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div className="stats-card" style={{ background: '#fff', padding: '24px 18px', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center' as const, boxShadow: '0 4px 12px rgba(15,45,61,0.04)' }}>
                  <div className="stats-val" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, background: s.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{s.val}</div>
                  <div className="stats-lbl" style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 8, letterSpacing: '0.02em' }}>{s.lbl}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: '#fafbfd' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="scenario-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50, alignItems: 'center' }}>
            <Reveal>
              <div className="scenario-visual" style={{ position: 'relative' as const, height: 580, background: 'linear-gradient(135deg, #fef3c7, #fce7f3)', borderRadius: 24, padding: 20, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Confetti items={[
                  { top: '10%', left: '10%', size: 12, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle' },
                  { top: '20%', right: '12%', size: 14, color: VERIMO_CONFETTI_COLORS.red, shape: 'square', delay: 0.5 },
                  { bottom: '15%', left: '12%', size: 10, color: VERIMO_CONFETTI_COLORS.green, shape: 'circle', delay: 1 },
                  { bottom: '25%', right: '15%', size: 12, color: VERIMO_CONFETTI_COLORS.blue, shape: 'square', delay: 1.5 },
                ]} />
                <PhoneFrame rotate={-3}>
                  <PhoneContentSMS />
                </PhoneFrame>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div style={{ padding: '0 8px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#be185d', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 10 }}>SCÉNARIO 1</div>
                <h2 style={{ fontSize: 'clamp(34px, 4.2vw, 52px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 12px', color: '#0f2d3d', letterSpacing: '-0.03em' }}>
                  Post-visite acheteur
                </h2>
                <div style={{ fontSize: 'clamp(20px, 2vw, 26px)', fontWeight: 700, lineHeight: 1.25, color: '#475569', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
                  L'acheteur a aimé. Il veut creuser.
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: '#475569', margin: '0 0 20px' }}>
                  Plus besoin de promettre <em>« je vous envoie ça quand j'aurai le temps »</em>. Vous lancez Verimo en sortant de la visite, et <strong style={{ color: '#0f2d3d' }}>5 minutes plus tard</strong> votre client reçoit un rapport complet qui répond à toutes ses questions.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {['Décision d\'achat accélérée', 'Image de pro qui maîtrise son dossier', 'Moins de doutes = moins de rétractations'].map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 15, color: '#0f2d3d' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(236,72,153,0.15)', color: '#be185d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={13} strokeWidth={3} />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: '#fafbfd' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="scenario-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50, alignItems: 'center' }}>
            <Reveal>
              <div style={{ padding: '0 8px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e40af', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 10 }}>SCÉNARIO 2</div>
                <h2 style={{ fontSize: 'clamp(34px, 4.2vw, 52px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 12px', color: '#0f2d3d', letterSpacing: '-0.03em' }}>
                  Prise de mandat
                </h2>
                <div style={{ fontSize: 'clamp(20px, 2vw, 26px)', fontWeight: 700, lineHeight: 1.25, color: '#475569', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
                  Devant le vendeur, vous inspirez confiance.
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: '#475569', margin: '0 0 20px' }}>
                  Vous arrivez en RDV mandat avec son dossier déjà analysé. Vous citez les points forts et les points sensibles du bien — travaux à venir, état de la copropriété, diagnostics. Le vendeur voit que <strong style={{ color: '#0f2d3d' }}>vous ne survendrez pas son bien : vous le vendrez au juste prix, plus vite</strong>.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {['Différenciation forte vs les agents concurrents', 'Prix appuyé sur les vrais chiffres du bien', 'Vendeur rassuré : il sait à quoi s\'attendre'].map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 15, color: '#0f2d3d' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(42,125,156,0.15)', color: '#1d5e7a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={13} strokeWidth={3} />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="scenario-visual scenario-2" style={{ position: 'relative' as const, height: 460, background: 'linear-gradient(135deg, #dbeafe, #e0e7ff)', borderRadius: 24, padding: 24, overflow: 'hidden' }}>
                <Confetti items={[
                  { top: '12%', right: '10%', size: 10, color: VERIMO_CONFETTI_COLORS.blue, shape: 'circle' },
                  { top: '32%', left: '8%', size: 12, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 0.5 },
                  { bottom: '18%', right: '14%', size: 8, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1 },
                  { bottom: '30%', left: '15%', size: 14, color: VERIMO_CONFETTI_COLORS.red, shape: 'square', delay: 1.2 },
                ]} />
                <FloatingReport />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: '#fafbfd' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="scenario-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50, alignItems: 'center' }}>
            <Reveal>
              <div className="scenario-visual scenario-3" style={{ position: 'relative' as const, height: 460, background: 'linear-gradient(135deg, #ecfdf5, #ccfbf1)', borderRadius: 24, padding: 20, overflow: 'hidden' }}>
                <Confetti items={[
                  { top: '10%', left: '12%', size: 10, color: VERIMO_CONFETTI_COLORS.green, shape: 'circle' },
                  { top: '25%', right: '8%', size: 12, color: VERIMO_CONFETTI_COLORS.blue, shape: 'square', delay: 0.5 },
                  { bottom: '15%', left: '10%', size: 8, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1 },
                  { bottom: '25%', right: '12%', size: 14, color: VERIMO_CONFETTI_COLORS.red, shape: 'square', delay: 1.3 },
                ]} />
                <StackedTabs />
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div style={{ padding: '0 8px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#047857', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 10 }}>SCÉNARIO 3</div>
                <h2 style={{ fontSize: 'clamp(34px, 4.2vw, 52px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 12px', color: '#0f2d3d', letterSpacing: '-0.03em' }}>
                  Pendant la visite
                </h2>
                <div style={{ fontSize: 'clamp(20px, 2vw, 26px)', fontWeight: 700, lineHeight: 1.25, color: '#475569', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
                  Vous répondez à tout, sans hésiter.
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: '#475569', margin: '0 0 20px' }}>
                  <em>« Combien le ravalement ? »</em>, <em>« Le DPE est de quelle année ? »</em>, <em>« Y a-t-il des impayés ? »</em>. Vous avez tout lu en amont grâce à Verimo. Vous répondez avec aisance — <strong style={{ color: '#0f2d3d' }}>l'acheteur sent que vous maîtrisez votre dossier</strong>.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {['Confiance instantanée de l\'acheteur', 'Vous vous démarquez des concurrents', 'Aucun « je vais me renseigner »'].map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 15, color: '#0f2d3d' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={13} strokeWidth={3} />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SCÉNARIO BONUS — Envoi de rapport
          Structure cohérente avec les 3 autres scénarios : texte / visuel.
          Les 2 mockups (popup envoi côté pro + email reçu côté client) sont
          empilés verticalement dans la colonne visuelle pour montrer la séquence.
          ════════════════════════════════════════════ */}
      <section style={{ padding: '80px 24px 40px', background: '#fafbfd' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="scenario-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 50, alignItems: 'center' }}>
            <Reveal>
              <div style={{ padding: '0 8px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 10 }}>SCÉNARIO BONUS</div>
                <h2 style={{ fontSize: 'clamp(34px, 4.2vw, 52px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 12px', color: '#0f2d3d', letterSpacing: '-0.03em' }}>
                  L'envoi en 1 clic
                </h2>
                <div style={{ fontSize: 'clamp(20px, 2vw, 26px)', fontWeight: 700, lineHeight: 1.25, color: '#475569', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
                  Vous envoyez. Il reçoit. À votre image.
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.65, color: '#475569', margin: '0 0 20px' }}>
                  En 30 secondes, votre client reçoit un email <strong style={{ color: '#0f2d3d' }}>à votre image</strong> avec le rapport complet. Modèle pré-rempli, modifiable à volonté. <strong style={{ color: '#0f2d3d' }}>Aucun compte à créer côté client.</strong>
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {['Mail personnalisable selon votre style', 'Aucun compte requis côté client', 'Votre signature, à votre image'].map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 15, color: '#0f2d3d' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={13} strokeWidth={3} />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="scenario-visual scenario-envoi" style={{ position: 'relative' as const, height: 620, background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', borderRadius: 24, padding: 24, overflow: 'hidden' }}>
                <Confetti items={[
                  { top: '10%', left: '8%', size: 8, color: VERIMO_CONFETTI_COLORS.blue, shape: 'circle' },
                  { top: '40%', right: '8%', size: 10, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 0.5 },
                  { bottom: '12%', left: '10%', size: 9, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1 },
                  { bottom: '30%', right: '10%', size: 11, color: VERIMO_CONFETTI_COLORS.red, shape: 'square', delay: 1.3 },
                ]} />

                {/* Mockup 1 — Popup envoi (en haut, légèrement décalé à gauche) */}
                <motion.div
                  className="scenario-mockup scenario-mockup-1"
                  animate={_lp ? {} : { y: [0, -4, 0] }}
                  transition={_lp ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ position: 'absolute' as const, top: '4%', left: '4%', width: '64%', zIndex: 2, transform: 'rotate(-3deg)' }}>
                  <div style={{ position: 'relative' as const }}>
                    <div className="scenario-mockup-label" style={{ position: 'absolute' as const, top: -22, left: 0, fontSize: 10, fontWeight: 800, color: '#7c3aed', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>① Vous envoyez</div>
                    <MockupSendPopup />
                  </div>
                </motion.div>

                {/* Mockup 2 — Email reçu (en bas à droite, légèrement décalé) */}
                <motion.div
                  className="scenario-mockup scenario-mockup-2"
                  animate={_lp ? {} : { y: [0, 4, 0] }}
                  transition={_lp ? {} : { duration: 6, repeat: Infinity, delay: 0.7, ease: 'easeInOut' }}
                  style={{ position: 'absolute' as const, bottom: '4%', right: '4%', width: '64%', zIndex: 3, transform: 'rotate(3deg)' }}>
                  <div style={{ position: 'relative' as const }}>
                    <div className="scenario-mockup-label" style={{ position: 'absolute' as const, top: -22, right: 0, fontSize: 10, fontWeight: 800, color: '#0e7490', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>② Il reçoit</div>
                    <MockupClientEmail />
                  </div>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 24px 100px', background: 'linear-gradient(180deg, #fafbfd 0%, #fafbfd 60%, #eef3f6 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center' as const, marginBottom: 36 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: 'rgba(42,125,156,0.1)', border: '1px solid rgba(42,125,156,0.22)', color: '#2a7d9c', fontSize: 12, fontWeight: 800, borderRadius: 100, marginBottom: 18, letterSpacing: '0.08em' }}>
                <Zap size={13} /> 3 ÉTAPES · ~5 MIN
              </div>
              <h2 style={{ fontSize: 'clamp(30px, 3.6vw, 44px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 12px', color: '#0f2d3d', letterSpacing: '-0.025em' }}>
                C'est tout simple.
              </h2>
              <p style={{ fontSize: 'clamp(15px, 1.2vw, 17px)', color: '#64748b', margin: 0, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55 }}>
                De vos PDF au rapport envoyé à votre client, en moins de temps qu'un café.
              </p>
            </div>
          </Reveal>

          <div className="steps-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 16, alignItems: 'stretch' }}>
            {[
              {
                n: '1',
                icon: Upload,
                accent: '#be185d',
                accentBg: 'rgba(190,24,93,0.1)',
                title: 'Glissez vos PDF',
                subtitle: 'dans votre espace',
                desc: 'Drag & drop direct. PV d\'AG, diagnostics, règlement... jusqu\'à 15 documents en même temps.',
                gradFrom: '#fce7f3',
              },
              {
                n: '2',
                icon: FileSearch,
                accent: '#1e40af',
                accentBg: 'rgba(30,64,175,0.1)',
                title: 'Rapport en ~3 min',
                subtitle: 'lecture immédiate',
                desc: 'Score /20, risques chiffrés, synthèse claire. Tout est analysé et hiérarchisé pour vous.',
                gradFrom: '#dbeafe',
              },
              {
                n: '3',
                icon: Send,
                accent: '#047857',
                accentBg: 'rgba(4,120,87,0.1)',
                title: 'Partagez en 1 clic',
                subtitle: 'directement par mail',
                desc: 'Lien sécurisé envoyé depuis votre espace. Votre client le reçoit directement dans son mail.',
                gradFrom: '#d1fae5',
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <React.Fragment key={i}>
                  <Reveal delay={i * 0.1}>
                    <motion.div
                      whileHover={_lp ? {} : { y: -4, boxShadow: '0 18px 40px rgba(15,45,61,0.12)' }}
                      transition={{ duration: 0.25 }}
                      style={{ background: '#fff', padding: '28px 24px', borderRadius: 20, border: '1px solid #e2e8f0', height: '100%', boxShadow: '0 6px 18px rgba(15,45,61,0.06)', position: 'relative' as const, overflow: 'hidden' }}>
                      {/* Halo en haut */}
                      <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(180deg, ${s.gradFrom}, transparent)`, opacity: 0.6, pointerEvents: 'none' as const }} />
                      <div style={{ position: 'relative' as const }}>
                        {/* Mini-badge "ÉTAPE X" (style identique aux scénarios) */}
                        <div style={{ fontSize: 12, fontWeight: 800, color: s.accent, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 10 }}>ÉTAPE {s.n}</div>

                        {/* Titre principal — gros, style scénarios */}
                        <h3 style={{ fontSize: 'clamp(24px, 2.6vw, 30px)', fontWeight: 900, lineHeight: 1.05, margin: '0 0 8px', color: '#0f2d3d', letterSpacing: '-0.025em' }}>
                          {s.title}
                        </h3>

                        {/* Sous-titre — style scénarios */}
                        <div style={{ fontSize: 'clamp(15px, 1.4vw, 17px)', fontWeight: 700, lineHeight: 1.25, color: s.accent, margin: '0 0 14px', letterSpacing: '-0.01em' }}>
                          {s.subtitle}
                        </div>

                        {/* Icône + description */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 11, background: s.accentBg, color: s.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={20} strokeWidth={2.2} />
                          </div>
                          <div style={{ flex: 1, fontSize: 14, color: '#475569', lineHeight: 1.55, paddingTop: 4 }}>{s.desc}</div>
                        </div>
                      </div>
                    </motion.div>
                  </Reveal>
                  {i < 2 && (
                    <div className="step-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                      <ArrowRight size={24} style={{ color: '#cbd5e1' }} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ position: 'relative' as const, padding: '100px 24px', background: 'linear-gradient(165deg, #1d5e7a 0%, #2a7d9c 50%, #1d5e7a 100%)', overflow: 'hidden' }}>
        {/* Léger fondu en haut pour adoucir l'entrée depuis le clair */}
        <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(180deg, rgba(238,243,246,0.18) 0%, transparent 100%)', pointerEvents: 'none' as const }} />
        {/* Halo intérieur pour la richesse visuelle */}
        <div style={{ position: 'absolute' as const, inset: 0, background: 'radial-gradient(ellipse at center, rgba(125,211,252,0.18) 0%, transparent 60%)', pointerEvents: 'none' as const }} />
        <Confetti items={[
          { top: '15%', left: '8%', size: 8, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle' },
          { top: '28%', right: '10%', size: 10, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 0.5 },
          { bottom: '20%', left: '12%', size: 6, color: VERIMO_CONFETTI_COLORS.red, shape: 'circle', delay: 1 },
          { bottom: '30%', right: '14%', size: 12, color: VERIMO_CONFETTI_COLORS.blue, shape: 'square', delay: 1.5 },
          { top: '60%', left: '20%', size: 9, color: VERIMO_CONFETTI_COLORS.green, shape: 'circle', delay: 0.8 },
          { top: '45%', right: '22%', size: 8, color: VERIMO_CONFETTI_COLORS.orange, shape: 'square', delay: 1.8 },
        ]} />
        <div style={{ position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(125,211,252,0.12), transparent 65%)', pointerEvents: 'none' as const }} />

        <div className="cta-final" style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' as const, position: 'relative' as const }}>
          <Reveal>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.06em', marginBottom: 20 }}>
              <Eye size={12} /> PRÊT À PASSER À L'ACTION ?
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, lineHeight: 1.1, color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>
              Devenez l'agent qu'on recommande.
            </h2>
            <p style={{ fontSize: 'clamp(15px, 1.3vw, 17px)', color: 'rgba(255,255,255,0.85)', margin: '0 auto 28px', lineHeight: 1.6 }}>
              Démo personnalisée. Offre sur mesure. Réponse garantie sous 24 heures.
            </p>
            <motion.a
              href="/pro/rejoindre"
              whileHover={{ y: -2, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
              whileTap={{ scale: 0.98 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', borderRadius: 14, background: '#fff', color: '#0f2d3d', textDecoration: 'none', fontSize: 15, fontWeight: 800, boxShadow: '0 12px 30px rgba(0,0,0,0.25)' }}>
              Rejoindre Verimo Pro <ArrowRight size={16} />
            </motion.a>
            <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              Sans engagement · Annulable à tout moment
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
