import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Shield, Star } from 'lucide-react';

/* ══════════════════════════════════════════
   DATA
══════════════════════════════════════════ */
const categories = [
  {
    id: 'travaux',
    emoji: '🏗️',
    label: 'Travaux',
    pts: 5,
    color: '#f0a500',
    bg: '#fffbeb',
    border: '#fde68a',
    desc: "Les travaux sont le premier risque financier d'un achat immobilier. Notre outil détecte les travaux votés, évoqués ou à prévoir.",
    items: [
      { l: 'Gros travaux évoqués non votés', v: '-2 à -3', type: 'bad' },
      { l: 'Travaux urgents non anticipés', v: '-3 à -4', type: 'bad' },
      { l: 'Travaux votés (à la charge du vendeur)', v: '+0,5 à +1', type: 'good' },
      { l: 'Garantie décennale sur travaux récents', v: '+0,5 à +1', type: 'good' },
    ],
  },
  {
    id: 'procedures',
    emoji: '⚖️',
    label: 'Procédures',
    pts: 4,
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    desc: "Les procédures judiciaires sont un signal d'alarme majeur. Elles peuvent bloquer une vente ou engager des frais imprévus.",
    items: [
      { l: 'Copropriété vs syndic', v: '-2 à -4', type: 'bad' },
      { l: 'Copropriété vs copropriétaire', v: '-0,5 à -1', type: 'bad' },
      { l: 'Copropriété en difficulté', v: '-3 à -4', type: 'bad' },
      { l: 'Aucune procédure en cours', v: '0 point déduit', type: 'neutral' },
    ],
  },
  {
    id: 'finances',
    emoji: '💰',
    label: 'Finances',
    pts: 4,
    color: '#2a7d9c',
    bg: '#f0f7fb',
    border: '#bae3f5',
    desc: "La santé financière de la copropriété conditionne vos charges futures. Un fonds travaux insuffisant peut vous coûter cher.",
    items: [
      { l: 'Écart budget réalisé > 30%', v: '-3', type: 'bad' },
      { l: 'Écart budget réalisé 15–30%', v: '-2', type: 'bad' },
      { l: 'Fonds travaux nul', v: '-2', type: 'bad' },
      { l: 'Impayés de charges', v: '-1 à -2', type: 'bad' },
      { l: 'Fonds travaux conforme au légal', v: '+0,5', type: 'good' },
      { l: 'Fonds travaux au-dessus du légal', v: '+1', type: 'good' },
    ],
  },
  {
    id: 'diags-prives',
    emoji: '🏠',
    label: 'Diagnostics privatifs',
    pts: 4,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    desc: "Le DPE et les diagnostics de votre logement impactent directement sa valeur, sa revente et vos charges énergétiques.",
    items: [
      { l: 'DPE F (résidence principale)', v: '-2', type: 'bad' },
      { l: 'DPE G (résidence principale)', v: '-3', type: 'bad' },
      { l: 'DPE F (investissement locatif)', v: '-4', type: 'bad' },
      { l: 'DPE G (investissement locatif)', v: '-6', type: 'bad' },
      { l: 'Électricité : anomalies majeures', v: '-2', type: 'bad' },
      { l: 'Amiante accessible dégradé', v: '-2', type: 'bad' },
      { l: 'Termites non traités', v: '-2', type: 'bad' },
      { l: 'DPE A', v: '+1', type: 'good' },
      { l: 'DPE B ou C', v: '+0,5', type: 'good' },
    ],
  },
  {
    id: 'diags-communs',
    emoji: '🏢',
    label: 'Diagnostics communs',
    pts: 3,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    desc: "L'état des parties communes de l'immeuble conditionne la santé globale de la copropriété et vos futures charges.",
    items: [
      { l: 'Amiante parties communes dégradé', v: '-2', type: 'bad' },
      { l: 'Termites parties communes non traités', v: '-2', type: 'bad' },
      { l: 'Immeuble bien entretenu', v: '+0,5', type: 'good' },
      { l: 'Certificat entretien chaudière/ramonage', v: '+0,5', type: 'good' },
    ],
  },
];

const levels = [
  { r: '17 – 20', l: 'Excellent', emoji: '💚', c: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Bien en excellent état, copropriété saine. Achetez sereinement.' },
  { r: '14 – 16', l: 'Bon profil', emoji: '🟢', c: '#16a34a', bg: '#f0fdf4', border: '#d1fae5', desc: 'Quelques points à surveiller mais rien de bloquant. Bon achat.' },
  { r: '10 – 13', l: 'Correct avec réserves', emoji: '🟡', c: '#d97706', bg: '#fffbeb', border: '#fde68a', desc: 'Des points de vigilance identifiés. Négociez avant de signer.' },
  { r: '7 – 9', l: 'Vigilance requise', emoji: '🟠', c: '#ea580c', bg: '#fff7ed', border: '#fed7aa', desc: 'Risques significatifs détectés. Analyse approfondie recommandée.' },
  { r: '0 – 6', l: 'Risqué', emoji: '🔴', c: '#dc2626', bg: '#fef2f2', border: '#fecaca', desc: 'Risques majeurs. Négociation forte ou abandon recommandé.' },
];

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function MethodePage() {
  const [openCat, setOpenCat] = useState<string | null>('travaux');

  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f4f7f9', paddingTop: 80 }}>

      {/* ── HERO ── */}
      <section style={{ background: 'linear-gradient(135deg, #0f2d3d 0%, #1a4a60 100%)', padding: 'clamp(48px,8vw,96px) 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(42,125,156,0.25) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 18px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 24 }}>
            <Star size={13} /> Notre méthode de notation
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,58px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.08, marginBottom: 20 }}>
            Comment on calcule<br />
            <span style={{ color: '#f0a500' }}>votre score /20</span>
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 36px' }}>
            Transparence totale. Voici exactement comment notre outil analyse vos documents et attribue une note objective à chaque bien immobilier.
          </p>
          <Link to="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #2a7d9c, #f0a500)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 28px rgba(42,125,156,0.4)' }}>
            Analyser mon bien <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* ── PRINCIPE ── */}
      <section style={{ padding: 'clamp(48px,6vw,80px) 20px', maxWidth: 860, margin: '0 auto' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ background: '#fff', borderRadius: 20, border: '1px solid #edf2f7', padding: 'clamp(24px,4vw,48px)', boxShadow: '0 4px 24px rgba(15,45,61,0.06)', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, color: '#fff', flexShrink: 0 }}>20</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>On part toujours de 20 points</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
              Chaque bien commence avec la note maximale. Notre outil <strong style={{ color: '#0f172a' }}>retire des points</strong> pour chaque risque détecté dans vos documents, et <strong style={{ color: '#16a34a' }}>en ajoute</strong> pour les éléments positifs. Le résultat est une note objective et reproductible.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── 5 CATÉGORIES ── */}
      <section style={{ padding: '0 20px clamp(48px,6vw,80px)', maxWidth: 860, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>5 catégories analysées</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Ce qu'on examine<br />dans vos documents</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {categories.map((cat) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ background: '#fff', borderRadius: 16, border: `1px solid ${openCat === cat.id ? cat.border : '#edf2f7'}`, overflow: 'hidden', boxShadow: openCat === cat.id ? `0 4px 20px ${cat.color}18` : '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}>

              {/* Header */}
              <button onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.bg, border: `1px solid ${cat.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{cat.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{cat.label}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Sur {cat.pts} points</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: cat.color }}>{cat.pts}<span style={{ fontSize: 13, fontWeight: 600, opacity: 0.6 }}>pts</span></span>
                  {openCat === cat.id ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                </div>
              </button>

              {/* Content */}
              {openCat === cat.id && (
                <div style={{ padding: '0 24px 24px' }}>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 20, paddingTop: 4, borderTop: `1px solid ${cat.border}`, paddingTop: 16 }}>{cat.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cat.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 10, background: item.type === 'good' ? '#f0fdf4' : item.type === 'bad' ? '#fef2f2' : '#f8fafc', border: `1px solid ${item.type === 'good' ? '#d1fae5' : item.type === 'bad' ? '#fecaca' : '#edf2f7'}`, gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {item.type === 'good' ? <CheckCircle size={14} color="#16a34a" style={{ flexShrink: 0 }} /> : item.type === 'bad' ? <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0 }} /> : <Shield size={14} color="#94a3b8" style={{ flexShrink: 0 }} />}
                          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.l}</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: item.type === 'good' ? '#16a34a' : item.type === 'bad' ? '#dc2626' : '#94a3b8', flexShrink: 0, background: item.type === 'good' ? '#dcfce7' : item.type === 'bad' ? '#fee2e2' : '#f1f5f9', padding: '3px 10px', borderRadius: 6 }}>{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ÉCHELLE ── */}
      <section style={{ padding: 'clamp(48px,6vw,80px) 20px', background: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Ce que ça signifie</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>L'échelle des notes</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {levels.map((level, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderRadius: 14, background: level.bg, border: `1px solid ${level.border}`, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 22, flexShrink: 0 }}>{level.emoji}</div>
                <div style={{ minWidth: 90, flexShrink: 0 }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: level.c }}>{level.r}</span>
                  <span style={{ fontSize: 12, color: level.c, opacity: 0.7 }}> /20</span>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: level.c, marginBottom: 2 }}>{level.l}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{level.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCUMENTS ANALYSÉS ── */}
      <section style={{ padding: 'clamp(48px,6vw,80px) 20px', background: '#f4f7f9' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Ce qu'on lit</div>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Documents acceptés</h2>
            <p style={{ fontSize: 15, color: '#64748b', marginTop: 12, maxWidth: 500, margin: '12px auto 0' }}>Plus vous fournissez de documents, plus la note est précise. Idéalement : PV d'AG + DPE + règlement de copropriété + appels de charges.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { emoji: '📋', label: "PV d'Assemblée Générale", note: 'Travaux, budget, procédures' },
              { emoji: '📑', label: 'Règlement de copropriété', note: 'Charges, droits, obligations' },
              { emoji: '🔋', label: 'Diagnostic DPE', note: 'Performance énergétique' },
              { emoji: '💸', label: 'Appels de charges', note: 'Charges réelles mensuelles' },
              { emoji: '⚡', label: 'Diagnostic électricité', note: 'Conformité installation' },
              { emoji: '🧱', label: 'Diagnostic amiante', note: 'État des matériaux' },
            ].map((doc, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                style={{ background: '#fff', borderRadius: 14, border: '1px solid #edf2f7', padding: '18px 16px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{doc.emoji}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{doc.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{doc.note}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: 'clamp(48px,6vw,80px) 20px', background: 'linear-gradient(135deg, #0f2d3d, #1a4a60)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>🎯</div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 14 }}>Prêt à noter votre bien ?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32, lineHeight: 1.7 }}>Uploadez vos documents et obtenez votre score /20 avec rapport complet en moins de 2 minutes.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 14, background: 'linear-gradient(135deg, #2a7d9c, #f0a500)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 28px rgba(42,125,156,0.4)' }}>
              Analyser mon bien <ArrowRight size={16} />
            </Link>
            <Link to="/exemple" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Voir un exemple
            </Link>
          </div>
        </motion.div>
      </section>

    </main>
  );
}
