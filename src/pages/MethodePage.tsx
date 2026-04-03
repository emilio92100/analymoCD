import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, CheckCircle, TrendingDown, TrendingUp, Star, ChevronRight } from 'lucide-react';

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const tabs = [
  { id: 'principe', label: 'Le principe', emoji: '🎯' },
  { id: 'categories', label: 'Les 5 catégories', emoji: '📊' },
  { id: 'echelle', label: "L'échelle", emoji: '🏆' },
  { id: 'docs', label: 'Documents', emoji: '📄' },
];

const categories = [
  {
    id: 'travaux', emoji: '🏗️', label: 'Travaux', pts: 5,
    color: '#f0a500', gradient: 'linear-gradient(135deg, #f0a500, #fb923c)',
    bg: '#fffbeb', border: '#fde68a',
    desc: "Les travaux sont le premier risque financier d'un achat. On détecte tout : votés, évoqués, urgents.",
    bad: [{ l: 'Gros travaux évoqués non votés', v: '-2 à -3' }, { l: 'Travaux urgents non anticipés', v: '-3 à -4' }],
    good: [{ l: 'Travaux votés (charge du vendeur)', v: '+0,5 à +1' }, { l: 'Garantie décennale récente', v: '+0,5 à +1' }],
  },
  {
    id: 'procedures', emoji: '⚖️', label: 'Procédures', pts: 4,
    color: '#dc2626', gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    bg: '#fef2f2', border: '#fecaca',
    desc: "Un litige en cours peut bloquer la vente ou engager des frais imprévus. Signal d'alarme majeur.",
    bad: [{ l: 'Copropriété vs syndic', v: '-2 à -4' }, { l: 'Copropriété vs copropriétaire', v: '-0,5 à -1' }, { l: 'Copropriété en difficulté', v: '-3 à -4' }],
    good: [{ l: 'Aucune procédure détectée', v: '0 point déduit ✓' }],
  },
  {
    id: 'finances', emoji: '💰', label: 'Finances', pts: 4,
    color: '#2a7d9c', gradient: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)',
    bg: '#f0f7fb', border: '#bae3f5',
    desc: "La santé financière de la copropriété conditionne vos charges futures. Un fonds vide = danger.",
    bad: [{ l: 'Écart budget réalisé > 30%', v: '-3' }, { l: 'Fonds travaux nul', v: '-2' }, { l: 'Impayés de charges', v: '-1 à -2' }],
    good: [{ l: 'Fonds travaux conforme au légal', v: '+0,5' }, { l: 'Fonds travaux au-dessus du légal', v: '+1' }],
  },
  {
    id: 'diags-prives', emoji: '🏠', label: 'Diagnostics privatifs', pts: 4,
    color: '#7c3aed', gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    bg: '#f5f3ff', border: '#ddd6fe',
    desc: "DPE, électricité, amiante, termites — ils impactent valeur, revente et charges énergétiques.",
    bad: [{ l: 'DPE F (résidence principale)', v: '-2' }, { l: 'DPE G (résidence principale)', v: '-3' }, { l: 'DPE F ou G (investissement)', v: '-4 à -6' }, { l: 'Électricité : anomalies majeures', v: '-2' }, { l: 'Amiante dégradé / Termites', v: '-2' }],
    good: [{ l: 'DPE A', v: '+1' }, { l: 'DPE B ou C', v: '+0,5' }],
  },
  {
    id: 'diags-communs', emoji: '🏢', label: 'Diagnostics communs', pts: 3,
    color: '#16a34a', gradient: 'linear-gradient(135deg, #16a34a, #22c55e)',
    bg: '#f0fdf4', border: '#bbf7d0',
    desc: "L'état des parties communes conditionne la santé globale de la copropriété et vos futures charges.",
    bad: [{ l: 'Amiante parties communes dégradé', v: '-2' }, { l: 'Termites parties communes', v: '-2' }],
    good: [{ l: 'Immeuble bien entretenu', v: '+0,5' }, { l: 'Entretien chaudière certifié', v: '+0,5' }],
  },
];

const levels = [
  { r: '17 – 20', l: 'Excellent', emoji: '🏆', c: '#15803d', barColor: '#16a34a', pct: 100, desc: 'Bien en excellent état. Achetez sereinement.' },
  { r: '14 – 16', l: 'Bon profil', emoji: '✅', c: '#16a34a', barColor: '#22c55e', pct: 80, desc: 'Quelques vigilances, rien de bloquant. Bon achat.' },
  { r: '10 – 13', l: 'Correct avec réserves', emoji: '⚠️', c: '#d97706', barColor: '#f59e0b', pct: 60, desc: 'Des vigilances identifiées. Négociez le prix.' },
  { r: '7 – 9', l: 'Vigilance requise', emoji: '🚨', c: '#ea580c', barColor: '#f97316', pct: 42, desc: 'Risques significatifs. Analyse approfondie recommandée.' },
  { r: '0 – 6', l: 'Risqué', emoji: '🔴', c: '#dc2626', barColor: '#ef4444', pct: 24, desc: 'Risques majeurs. Négociation forte ou abandon.' },
];

const docs = [
  { emoji: '📋', label: "PV d'Assemblée Générale", note: 'Travaux, budget, procédures, votes', priority: 'Indispensable', pColor: '#16a34a', pBg: '#f0fdf4' },
  { emoji: '📑', label: 'Règlement de copropriété', note: 'Charges, droits, obligations légales', priority: 'Indispensable', pColor: '#16a34a', pBg: '#f0fdf4' },
  { emoji: '🔋', label: 'Diagnostic DPE', note: 'Performance énergétique A→G', priority: 'Recommandé', pColor: '#d97706', pBg: '#fffbeb' },
  { emoji: '💸', label: 'Appels de charges', note: 'Charges réelles mensuelles exactes', priority: 'Recommandé', pColor: '#d97706', pBg: '#fffbeb' },
  { emoji: '⚡', label: 'Diagnostic électricité', note: "Conformité de l'installation", priority: 'Utile', pColor: '#2a7d9c', pBg: '#f0f7fb' },
  { emoji: '🧱', label: 'Diagnostic amiante', note: 'État des matériaux à risque', priority: 'Utile', pColor: '#2a7d9c', pBg: '#f0f7fb' },
];

/* ══════════════════════════════════════════
   SOUS-COMPOSANTS
══════════════════════════════════════════ */
function ScoreBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginTop: 8 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLET 1 — PRINCIPE
══════════════════════════════════════════ */
function TabPrincipe() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Blague accroche */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
        style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a4a60)', borderRadius: 24, padding: 'clamp(24px,4vw,44px)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(42,125,156,0.2)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -20, width: 140, height: 140, borderRadius: '50%', background: 'rgba(240,165,0,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 'clamp(40px,6vw,64px)', marginBottom: 16, lineHeight: 1 }}>🏆</div>
          <h3 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 900, color: '#fff', marginBottom: 14, letterSpacing: '-0.02em' }}>
            Bonne nouvelle : vous partez de 20/20 !
          </h3>
          <p style={{ fontSize: 'clamp(13px,1.8vw,15px)', color: 'rgba(255,255,255,0.72)', lineHeight: 1.8, margin: 0, maxWidth: 500 }}>
            Contrairement à votre prof de maths qui commençait à zéro,{' '}
            <strong style={{ color: '#f0a500' }}>on part du principe que votre bien est parfait.</strong>{' '}
            Puis on lit vos documents... et on retire des points pour chaque risque détecté. 😅
            <br /><br />
            Les bons points ? On en ajoute aussi. C'est ça, être fair-play.
          </p>
        </div>
      </motion.div>

      {/* Schéma étapes */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.15 }}
        style={{ background: '#fff', borderRadius: 20, border: '1px solid #edf2f7', padding: 'clamp(20px,3vw,36px)', boxShadow: '0 2px 16px rgba(15,45,61,0.05)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24, textAlign: 'center' }}>Comment ça marche</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { icon: '20', iconStyle: { background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 18, fontWeight: 900 }, title: 'Départ : 20/20', sub: 'Votre bien commence parfait. C\'est votre droit.', lineColor: 'linear-gradient(to bottom, #e2e8f0, #fecaca)' },
            { icon: '↓', iconStyle: { background: '#fef2f2', border: '2px solid #fecaca', color: '#dc2626', fontSize: 20 }, title: 'On retire les points négatifs', sub: 'Travaux, procédures, DPE dégradé, finances...', lineColor: 'linear-gradient(to bottom, #fecaca, #d1fae5)' },
            { icon: '↑', iconStyle: { background: '#f0fdf4', border: '2px solid #d1fae5', color: '#16a34a', fontSize: 20 }, title: 'On ajoute les points positifs', sub: 'Travaux votés, bon DPE, fonds travaux solide...', lineColor: null },
          ].map((step, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...step.iconStyle as React.CSSProperties }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{step.title}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8' }}>{step.sub}</div>
                </div>
              </div>
              {step.lineColor && (
                <div style={{ marginLeft: 23, width: 2, height: 28, background: step.lineColor, borderRadius: 1 }} />
              )}
            </div>
          ))}
        </div>

        {/* Résultat */}
        <div style={{ marginTop: 20, background: 'linear-gradient(135deg, #fffbeb, #fff)', border: '2px solid #fde68a', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 32 }}>🎯</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Votre score /20</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>Objectif, reproductible, et surtout — compréhensible.</div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#f0a500', letterSpacing: '-0.02em' }}>X/20</div>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {[{ n: '5', l: 'catégories analysées', e: '📊' }, { n: '20', l: 'points maximum', e: '🏆' }, { n: '< 2min', l: 'pour votre score', e: '⚡' }, { n: '100%', l: 'transparent', e: '🔍' }].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.07 }}
            style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '18px 14px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.e}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0f2d3d', marginBottom: 3 }}>{s.n}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.l}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLET 2 — CATÉGORIES
══════════════════════════════════════════ */
function TabCategories() {
  const [active, setActive] = useState(0);
  const cat = categories[active];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Tabs catégories */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {categories.map((c, i) => (
          <button key={c.id} onClick={() => setActive(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 11,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s',
              background: active === i ? c.gradient : '#f8fafc',
              color: active === i ? '#fff' : '#64748b',
              fontSize: 12, fontWeight: active === i ? 700 : 500,
              boxShadow: active === i ? `0 4px 12px ${c.color}35` : 'none',
            }}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={cat.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Header */}
          <div style={{ background: cat.gradient, borderRadius: 20, padding: 'clamp(22px,3.5vw,36px)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{cat.emoji}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 900 }}>{cat.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.65 }}>sur {cat.pts} points</span>
              </div>
              <p style={{ fontSize: 13, opacity: 0.82, lineHeight: 1.65, margin: '0 0 16px', maxWidth: 460 }}>{cat.desc}</p>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 99 }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.pts / 20) * 100}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{ height: '100%', background: 'rgba(255,255,255,0.85)', borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 11, opacity: 0.5, marginTop: 5 }}>{cat.pts} points sur 20 au total</div>
            </div>
          </div>

          {/* Pénalités + Bonus */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #fecaca', padding: '16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <TrendingDown size={13} color="#dc2626" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pénalités</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {cat.bad.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                    <span style={{ fontSize: 11, color: '#374151' }}>{item.l}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', flexShrink: 0, background: '#fee2e2', padding: '2px 7px', borderRadius: 5 }}>{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #d1fae5', padding: '16px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <TrendingUp size={13} color="#16a34a" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bonus</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {cat.good.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                    <span style={{ fontSize: 11, color: '#374151' }}>{item.l}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#16a34a', flexShrink: 0, background: '#dcfce7', padding: '2px 7px', borderRadius: 5 }}>{item.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
            <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0}
              style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid #edf2f7', background: '#fff', fontSize: 13, fontWeight: 600, color: active === 0 ? '#cbd5e1' : '#0f172a', cursor: active === 0 ? 'default' : 'pointer' }}>
              ← Précédent
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              {categories.map((_, i) => (
                <div key={i} onClick={() => setActive(i)} style={{ width: i === active ? 20 : 7, height: 7, borderRadius: 99, background: i === active ? cat.color : '#e2e8f0', transition: 'all 0.2s', cursor: 'pointer' }} />
              ))}
            </div>
            <button onClick={() => setActive(Math.min(categories.length - 1, active + 1))} disabled={active === categories.length - 1}
              style={{ padding: '9px 18px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: active === categories.length - 1 ? 'default' : 'pointer', background: active === categories.length - 1 ? '#f8fafc' : 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: active === categories.length - 1 ? '#cbd5e1' : '#fff' }}>
              Suivant →
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLET 3 — ÉCHELLE
══════════════════════════════════════════ */
function TabEchelle() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #edf2f7', padding: 'clamp(20px,3vw,32px)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 24 }}>Les 5 niveaux de note</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {levels.map((level, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{level.emoji}</span>
                <div style={{ minWidth: 76 }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: level.c }}>{level.r}</span>
                  <span style={{ fontSize: 11, color: level.c, opacity: 0.6 }}>/20</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: level.c }}>{level.l}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{level.desc}</div>
                </div>
              </div>
              <ScoreBar pct={level.pct} color={level.barColor} delay={i * 0.1 + 0.2} />
            </motion.div>
          ))}
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fff)', border: '1.5px solid #fde68a', borderRadius: 16, padding: '18px 20px', display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>💡</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 5 }}>Bon à savoir</div>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
            Si votre note est entre 0 et 13, Verimo génère automatiquement des <strong style={{ color: '#0f172a' }}>pistes de négociation</strong> pour vous aider à revoir le prix à la baisse. Au-dessus de 14, c'est déjà un bon signal.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ONGLET 4 — DOCUMENTS
══════════════════════════════════════════ */
function TabDocs() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a4a60)', borderRadius: 18, padding: 'clamp(20px,3vw,30px)', color: '#fff' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>📁</div>
        <h3 style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 800, marginBottom: 8 }}>Plus vous en donnez, plus c'est précis</h3>
        <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.7, margin: 0 }}>Verimo analyse tout ce que vous uploadez. PDF, Word, JPG — tous les formats sont acceptés. Idéalement : PV d'AG + DPE + règlement de copropriété + appels de charges.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {docs.map((doc, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 13, border: '1px solid #edf2f7', padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f8fafc', border: '1px solid #edf2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{doc.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{doc.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{doc.note}</div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: doc.pColor, background: doc.pBg, padding: '3px 9px', borderRadius: 7, flexShrink: 0, whiteSpace: 'nowrap' }}>{doc.priority}</span>
          </motion.div>
        ))}
      </div>

      <div style={{ background: '#f0f7fb', borderRadius: 12, border: '1px solid #bae3f5', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <CheckCircle size={15} color="#2a7d9c" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: '#2a7d9c', fontWeight: 600, margin: 0 }}>
          Vos documents sont supprimés immédiatement après traitement. Aucun stockage permanent — RGPD complet.
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════ */
export default function MethodePage() {
  const [activeTab, setActiveTab] = useState('principe');

  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f4f7f9', paddingTop: 80, minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(135deg, #0f2d3d 0%, #1a4a60 55%, #0f2d3d 100%)', padding: 'clamp(52px,8vw,100px) 20px clamp(72px,11vw,128px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 30%, rgba(42,125,156,0.28) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(240,165,0,0.12) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '44px 44px', pointerEvents: 'none' }} />

        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 100, background: 'rgba(240,165,0,0.14)', border: '1px solid rgba(240,165,0,0.28)', fontSize: 12, fontWeight: 700, color: '#f0a500', marginBottom: 26 }}>
            <Star size={12} /> Méthode de notation Verimo
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ fontSize: 'clamp(32px,5.5vw,60px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.06, marginBottom: 18 }}>
            Comment on transforme<br />vos docs en{' '}
            <span style={{ color: '#f0a500' }}>score /20</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: 'clamp(14px,2vw,16px)', color: 'rgba(255,255,255,0.62)', lineHeight: 1.8, maxWidth: 500, margin: '0 auto 36px' }}>
            Transparent, objectif, reproductible. Voici exactement comment Verimo analyse vos documents — sans formule magique.
          </motion.p>

          {/* Score visuel hero */}
          <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring', stiffness: 180 }}
            style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 22, padding: 'clamp(12px,2vw,18px) clamp(20px,4vw,40px)', backdropFilter: 'blur(16px)', boxShadow: '0 24px 64px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.09)' }}>
            <span style={{ fontSize: 'clamp(48px,8vw,80px)', fontWeight: 900, color: '#f0a500', letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 4px 28px rgba(240,165,0,0.45)' }}>15</span>
            <span style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>/20</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(34,197,94,0.25)', padding: '4px 12px', borderRadius: 9, marginLeft: 6 }}>Bon profil ✓</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── ONGLETS (flottants sur le hero) ── */}
      <div style={{ maxWidth: 860, margin: '-32px auto 0', padding: '0 16px' }}>
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #edf2f7', boxShadow: '0 8px 36px rgba(15,45,61,0.13)', padding: 6, display: 'flex', gap: 4, marginBottom: 28, overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: 'clamp(10px,1.5vw,13px) clamp(10px,2vw,18px)', borderRadius: 14, border: 'none', cursor: 'pointer',
                fontSize: 'clamp(11px,1.5vw,13px)', fontWeight: activeTab === tab.id ? 700 : 500,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#64748b',
                boxShadow: activeTab === tab.id ? '0 4px 16px rgba(42,125,156,0.38)' : 'none',
              }}>
              <span style={{ fontSize: 'clamp(14px,2vw,17px)' }}>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Contenu */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}
            style={{ paddingBottom: 64 }}>
            {activeTab === 'principe' && <TabPrincipe />}
            {activeTab === 'categories' && <TabCategories />}
            {activeTab === 'echelle' && <TabEchelle />}
            {activeTab === 'docs' && <TabDocs />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a4a60)', padding: 'clamp(48px,6vw,80px) 20px', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ maxWidth: 540, margin: '0 auto' }}>
          <div style={{ fontSize: 44, marginBottom: 18 }}>🚀</div>
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>Prêt à noter votre bien ?</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.58)', marginBottom: 32, lineHeight: 1.75 }}>Uploadez vos documents et obtenez votre score /20 avec rapport complet en moins de 2 minutes.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 34px', borderRadius: 14, background: 'linear-gradient(135deg, #2a7d9c, #f0a500)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(42,125,156,0.42)' }}>
              Analyser mon bien <ArrowRight size={16} />
            </Link>
            <Link to="/exemple" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 26px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Voir un exemple <ChevronRight size={15} />
            </Link>
          </div>
        </motion.div>
      </section>

    </main>
  );
}
