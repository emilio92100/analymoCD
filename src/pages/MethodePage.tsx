import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { ArrowRight, ChevronDown, TrendingDown, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

/* ─── DATA ─────────────────────────────── */
const categories = [
  {
    id: 'travaux', emoji: '🏗️', label: 'Travaux', pts: 5,
    color: '#f0a500', bg: '#fffbeb', border: '#fde68a',
    desc: "Premier risque financier d'un achat. On détecte travaux votés, évoqués ou urgents.",
    bad: [{ l: 'Gros travaux évoqués non votés', v: '-2 à -3' }, { l: 'Travaux urgents non anticipés', v: '-3 à -4' }],
    good: [{ l: 'Travaux votés (charge du vendeur)', v: '+0,5 à +1' }, { l: 'Garantie décennale récente', v: '+0,5 à +1' }],
  },
  {
    id: 'procedures', emoji: '⚖️', label: 'Procédures juridiques', pts: 4,
    color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
    desc: "Un litige peut bloquer la vente ou engager des frais imprévus.",
    bad: [{ l: 'Copropriété vs syndic', v: '-2 à -4' }, { l: 'Copropriété vs copropriétaire', v: '-0,5 à -1' }, { l: 'Copropriété en difficulté', v: '-3 à -4' }],
    good: [{ l: 'Aucune procédure détectée', v: '0 point déduit ✓' }],
  },
  {
    id: 'finances', emoji: '💰', label: 'Finances copropriété', pts: 4,
    color: '#2a7d9c', bg: '#f0f7fb', border: '#bae3f5',
    desc: "La santé financière conditionne vos charges futures. Un fonds vide = danger.",
    bad: [{ l: 'Écart budget réalisé > 30%', v: '-3' }, { l: 'Fonds travaux nul', v: '-2' }, { l: 'Impayés de charges', v: '-1 à -2' }],
    good: [{ l: 'Fonds travaux conforme au légal', v: '+0,5' }, { l: 'Fonds travaux au-dessus du légal', v: '+1' }],
  },
  {
    id: 'diags-prives', emoji: '🏠', label: 'Diagnostics privatifs', pts: 4,
    color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    desc: "DPE, électricité, amiante — ils impactent la valeur, la revente et l'énergie.",
    bad: [{ l: 'DPE F (résidence principale)', v: '-2' }, { l: 'DPE G (résidence principale)', v: '-3' }, { l: 'DPE F ou G (investissement)', v: '-4 à -6' }, { l: 'Électricité anomalies majeures', v: '-2' }, { l: 'Amiante dégradé / Termites', v: '-2' }],
    good: [{ l: 'DPE A', v: '+1' }, { l: 'DPE B ou C', v: '+0,5' }],
  },
  {
    id: 'diags-communs', emoji: '🏢', label: 'Diagnostics communs', pts: 3,
    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0',
    desc: "L'état des parties communes conditionne vos charges collectives futures.",
    bad: [{ l: 'Amiante parties communes dégradé', v: '-2' }, { l: 'Termites parties communes', v: '-2' }],
    good: [{ l: 'Immeuble bien entretenu', v: '+0,5' }, { l: 'Entretien chaudière certifié', v: '+0,5' }],
  },
];

const levels = [
  { r: '17 – 20', l: 'Excellent', emoji: '🏆', c: '#15803d', bar: '#16a34a', pct: 100, desc: 'Achetez sereinement. Bien en excellent état, copropriété saine.' },
  { r: '14 – 16', l: 'Bon profil', emoji: '✅', c: '#16a34a', bar: '#22c55e', pct: 80, desc: 'Quelques points à surveiller mais rien de bloquant. Bon achat.' },
  { r: '10 – 13', l: 'Correct avec réserves', emoji: '⚠️', c: '#d97706', bar: '#f59e0b', pct: 58, desc: 'Vigilances identifiées. Négociez le prix avant de signer.' },
  { r: '7 – 9', l: 'Vigilance requise', emoji: '🚨', c: '#ea580c', bar: '#f97316', pct: 40, desc: 'Risques significatifs. Analyse approfondie recommandée.' },
  { r: '0 – 6', l: 'Risqué', emoji: '🔴', c: '#dc2626', bar: '#ef4444', pct: 22, desc: 'Risques majeurs. Négociation forte ou abandon recommandé.' },
];

const faqs = [
  { q: "Pourquoi partir de 20 et non de 0 ?", a: "Parce qu'on part du principe que votre bien est parfait — jusqu'à preuve du contraire. C'est plus intuitif : un 18/20 signifie que le bien est quasi irréprochable, un 8/20 que des risques sérieux ont été détectés. Si on partait de 0, personne ne saurait si 12 est bon ou mauvais." },
  { q: "Peut-on dépasser 20/20 ?", a: "Non. Les bonus s'ajoutent mais la note est plafonnée à 20. Si les points positifs compensent largement les négatifs, vous arrivez au maximum — c'est déjà excellent." },
  { q: "La note change-t-elle si j'ajoute des documents ?", a: "Oui, et c'est voulu. Plus vous fournissez de documents, plus la note est précise. Un DPE manquant ne pénalise pas — mais le révéler peut faire varier la note dans les deux sens. C'est pourquoi l'option de compléter son dossier dans les 7 jours existe." },
  { q: "Quelle est la différence entre analyse simple et complète ?", a: "L'analyse simple (4,90€) porte sur un seul document et ne génère pas de note /20. L'analyse complète (19,90€) accepte plusieurs documents, calcule le score /20 et produit le rapport complet avec recommandation." },
  { q: "La note Verimo remplace-t-elle un expert immobilier ?", a: "Non. Verimo est un outil d'aide à la lecture et à la décision. Il détecte les signaux présents dans vos documents — mais ne se substitue pas à une visite physique ou à l'avis d'un professionnel qualifié." },
];

/* ─── COMPOSANTS ────────────────────────── */
function ScoreBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ height: 7, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: '100%', background: color, borderRadius: 99 }}
      />
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 18 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─── PAGE ──────────────────────────────── */
export default function MethodePage() {
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f4f7f9', paddingTop: 72 }}>

      {/* ══ HERO COMPACT ══════════════════════════════════════ */}
      <section style={{ background: '#fff', borderBottom: '1px solid #edf2f7', padding: '32px 20px 28px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 100, background: '#f0f7fb', border: '1px solid #bae3f5', fontSize: 12, fontWeight: 700, color: '#2a7d9c', marginBottom: 14, letterSpacing: '0.06em' }}>
            MÉTHODE DE NOTATION
          </div>
          <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 10 }}>
            Comment on calcule votre score <span style={{ color: '#2a7d9c' }}>/20</span>
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.65, margin: 0 }}>
            Transparent, objectif, reproductible. Voici exactement notre méthode — sans formule magique.
          </p>
        </div>
      </section>

      {/* ══ PRINCIPE (blanc) ══════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(40px,6vw,72px) 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
              <div style={{ width: 3, height: 22, background: '#2a7d9c', borderRadius: 2 }} />
              <h2 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#0f172a', margin: 0 }}>Le principe</h2>
            </div>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

            {/* Blague */}
            <Reveal>
              <div style={{ background: 'linear-gradient(135deg, #0f2d3d, #1a4a60)', borderRadius: 18, padding: 28, height: '100%', boxSizing: 'border-box' as const }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>🏆</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.3 }}>
                  Vous partez de 20/20 !
                </h3>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.68)', lineHeight: 1.75, margin: 0 }}>
                  Contrairement à votre prof de maths,{' '}
                  <strong style={{ color: '#f0a500' }}>on part du principe que votre bien est parfait.</strong>
                  {' '}Puis on lit vos documents et on retire des points pour chaque risque détecté. 😅
                  <br /><br />
                  Les bons points ? On en ajoute aussi. Fair-play.
                </p>
              </div>
            </Reveal>

            {/* Étapes */}
            <Reveal delay={0.1}>
              <div style={{ background: '#f8fafc', borderRadius: 18, padding: 28, border: '1px solid #edf2f7', height: '100%', boxSizing: 'border-box' as const }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 0 }}>
                  {[
                    { dot: '20', dotBg: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', dotColor: '#fff', title: 'Départ : 20 pts', sub: 'Bien parfait par défaut', line: true },
                    { dot: '−', dotBg: '#fef2f2', dotColor: '#dc2626', dotBorder: '2px solid #fecaca', title: 'Points négatifs retirés', sub: 'Travaux, procédures, DPE...', line: true },
                    { dot: '+', dotBg: '#f0fdf4', dotColor: '#16a34a', dotBorder: '2px solid #d1fae5', title: 'Points positifs ajoutés', sub: 'Travaux votés, bon DPE...', line: false },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: s.dotBg, border: (s as any).dotBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: s.dotColor, flexShrink: 0 }}>
                          {s.dot}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{s.title}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.sub}</div>
                        </div>
                      </div>
                      {s.line && <div style={{ marginLeft: 19, width: 2, height: 22, background: '#e2e8f0', borderRadius: 1, marginTop: 2, marginBottom: 2 }} />}
                    </div>
                  ))}
                  <div style={{ marginTop: 16, background: '#fff', border: '1.5px solid #fde68a', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>🎯 Votre score final</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: '#f0a500' }}>X/20</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ CATÉGORIES (gris) ═════════════════════════════════ */}
      <section style={{ background: '#f4f7f9', padding: 'clamp(40px,6vw,72px) 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 3, height: 22, background: '#2a7d9c', borderRadius: 2 }} />
              <h2 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#0f172a', margin: 0 }}>Les 5 catégories analysées</h2>
            </div>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 28, marginLeft: 11 }}>Cliquez sur une catégorie pour voir le détail des points.</p>
          </Reveal>

          {/* Totaux visuels */}
          <Reveal delay={0.05}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                  style={{ padding: '12px 8px', borderRadius: 12, border: `1.5px solid ${openCat === cat.id ? cat.color : '#edf2f7'}`, background: openCat === cat.id ? cat.bg : '#fff', cursor: 'pointer', textAlign: 'center' as const, transition: 'all 0.18s' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{cat.emoji}</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: cat.color }}>{cat.pts}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>pts</div>
                </button>
              ))}
            </div>
          </Reveal>

          {/* Accordéon catégories */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {categories.map((cat) => (
              <Reveal key={cat.id}>
                <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${openCat === cat.id ? cat.color : '#edf2f7'}`, overflow: 'hidden', transition: 'border-color 0.18s', boxShadow: openCat === cat.id ? `0 4px 20px ${cat.color}18` : '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <button onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{cat.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{cat.label}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Sur {cat.pts} points — {cat.desc.slice(0, 50)}…</div>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: cat.color, marginRight: 8 }}>{cat.pts} pts</span>
                    <ChevronDown size={16} color="#94a3b8" style={{ flexShrink: 0, transform: openCat === cat.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  <AnimatePresence>
                    {openCat === cat.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${cat.border}` }}>
                          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, margin: '14px 0 16px' }}>{cat.desc}</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <TrendingDown size={11} /> Pénalités
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                                {cat.bad.map((item, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
                                    <span style={{ fontSize: 11, color: '#374151' }}>{item.l}</span>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', flexShrink: 0, background: '#fee2e2', padding: '2px 7px', borderRadius: 5 }}>{item.v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <TrendingUp size={11} /> Bonus
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                                {cat.good.map((item, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #d1fae5' }}>
                                    <span style={{ fontSize: 11, color: '#374151' }}>{item.l}</span>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', flexShrink: 0, background: '#dcfce7', padding: '2px 7px', borderRadius: 5 }}>{item.v}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EXEMPLE CONCRET (sombre) ══════════════════════════ */}
      <section style={{ background: '#0f2d3d', padding: 'clamp(40px,6vw,72px) 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
              <div style={{ width: 3, height: 22, background: '#f0a500', borderRadius: 2 }} />
              <h2 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: 0 }}>Exemple concret de calcul</h2>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>🏠</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Appartement — 12 rue des Lilas, Lyon 6e</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Résidence principale · PV d'AG 2024 + DPE + Règlement copro analysés</div>
              </div>
            </div>
          </Reveal>

          {/* Calcul étapes */}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {[
              { label: 'Départ', pts: 20, note: 'Note maximale de base', color: '#fff', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.12)', prefix: '' },
              { label: 'Ravalement de façade évoqué non voté', pts: -2.5, note: 'Travaux · risque financier pour l\'acheteur', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', prefix: '' },
              { label: 'Fonds travaux sous-provisionné', pts: -2, note: 'Finances · budget inférieur au légal', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', prefix: '' },
              { label: 'DPE classé C', pts: 0.5, note: 'Diagnostics privatifs · bonne performance', color: '#4ade80', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)', prefix: '+' },
              { label: 'Aucune procédure judiciaire', pts: 0, note: 'Procédures · situation saine', color: '#4ade80', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.15)', prefix: '' },
            ].map((row, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 18px', borderRadius: 12, background: row.bg, border: `1px solid ${row.border}`, flexWrap: 'wrap' as const }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{row.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{row.note}</div>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: row.color, flexShrink: 0 }}>
                    {row.pts > 0 ? `+${row.pts}` : row.pts === 0 ? '±0' : row.pts}
                  </span>
                </div>
              </Reveal>
            ))}

            {/* Résultat */}
            <Reveal delay={0.35}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '18px 20px', borderRadius: 14, background: 'linear-gradient(135deg, rgba(240,165,0,0.18), rgba(240,165,0,0.08))', border: '2px solid rgba(240,165,0,0.35)', marginTop: 4, flexWrap: 'wrap' as const }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Score final</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Arrondi au 0,5 près</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 900, color: '#f0a500', letterSpacing: '-0.03em' }}>16</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>/20</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '3px 10px', borderRadius: 8, marginLeft: 8 }}>Bon profil ✓</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══ ÉCHELLE (blanc) ═══════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(40px,6vw,72px) 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
              <div style={{ width: 3, height: 22, background: '#2a7d9c', borderRadius: 2 }} />
              <h2 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#0f172a', margin: 0 }}>L'échelle des notes</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
            {levels.map((level, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{level.emoji}</span>
                  <div style={{ minWidth: 80, flexShrink: 0 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: level.c }}>{level.r}</span>
                    <span style={{ fontSize: 11, color: level.c, opacity: 0.6 }}>/20</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: level.c, marginBottom: 2 }}>{level.l}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{level.desc}</div>
                    <ScoreBar pct={level.pct} color={level.bar} delay={i * 0.1 + 0.2} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.5}>
            <div style={{ marginTop: 28, background: '#f0f7fb', borderRadius: 14, border: '1px solid #bae3f5', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <AlertTriangle size={16} color="#2a7d9c" style={{ flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 13, color: '#2a7d9c', fontWeight: 600, margin: 0, lineHeight: 1.65 }}>
                Si votre score est entre 0 et 13, Verimo génère automatiquement des <strong>pistes de négociation</strong> pour vous aider à revoir le prix à la baisse.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ FAQ (gris) ════════════════════════════════════════ */}
      <section style={{ background: '#f4f7f9', padding: 'clamp(40px,6vw,72px) 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <div style={{ width: 3, height: 22, background: '#2a7d9c', borderRadius: 2 }} />
              <h2 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#0f172a', margin: 0 }}>Questions sur la méthode</h2>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div style={{ background: '#fff', borderRadius: 14, border: `1.5px solid ${openFaq === i ? '#2a7d9c' : '#edf2f7'}`, overflow: 'hidden', transition: 'border-color 0.18s' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{faq.q}</span>
                    <ChevronDown size={16} color={openFaq === i ? '#2a7d9c' : '#94a3b8'} style={{ flexShrink: 0, transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.75, margin: 0, padding: '0 20px 18px', borderTop: '1px solid #f0f5f9' }}>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DOCUMENTS (sombre) ════════════════════════════════ */}
      <section style={{ background: '#0f2d3d', padding: 'clamp(40px,6vw,72px) 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Reveal>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 3, height: 22, background: '#f0a500', borderRadius: 2 }} />
              <h2 style={{ fontSize: 'clamp(18px,2.5vw,24px)', fontWeight: 800, color: '#fff', margin: 0 }}>Documents acceptés</h2>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, marginLeft: 11 }}>Plus vous fournissez de documents, plus le score est précis.</p>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {[
              { emoji: '📋', label: "PV d'Assemblée Générale", note: 'Travaux, budget, procédures', priority: 'Indispensable', pc: '#4ade80', pb: 'rgba(34,197,94,0.12)' },
              { emoji: '📑', label: 'Règlement de copropriété', note: 'Charges, droits, obligations', priority: 'Indispensable', pc: '#4ade80', pb: 'rgba(34,197,94,0.12)' },
              { emoji: '🔋', label: 'Diagnostic DPE', note: 'Performance énergétique A→G', priority: 'Recommandé', pc: '#fbbf24', pb: 'rgba(251,191,36,0.1)' },
              { emoji: '💸', label: 'Appels de charges', note: 'Charges réelles mensuelles', priority: 'Recommandé', pc: '#fbbf24', pb: 'rgba(251,191,36,0.1)' },
              { emoji: '⚡', label: 'Diagnostic électricité', note: "Conformité de l'installation", priority: 'Utile', pc: '#93c5fd', pb: 'rgba(147,197,253,0.08)' },
              { emoji: '🧱', label: 'Diagnostic amiante', note: 'État des matériaux à risque', priority: 'Utile', pc: '#93c5fd', pb: 'rgba(147,197,253,0.08)' },
            ].map((doc, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 13, padding: '14px 16px' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{doc.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{doc.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{doc.note}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: doc.pc, background: doc.pb, padding: '3px 8px', borderRadius: 6, flexShrink: 0, whiteSpace: 'nowrap' as const }}>{doc.priority}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={15} color="#4ade80" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, margin: 0 }}>
                Vos documents sont supprimés immédiatement après traitement. Aucun stockage permanent — RGPD complet.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══ CTA (blanc) ═══════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(40px,6vw,64px) 20px', textAlign: 'center', borderTop: '1px solid #edf2f7' }}>
        <Reveal>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 10 }}>
              Prêt à noter votre bien ?
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 28, lineHeight: 1.65 }}>
              Uploadez vos documents et obtenez votre score /20 en moins de 2 minutes.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <Link to="/start" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', borderRadius: 13, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 20px rgba(42,125,156,0.3)' }}>
                Analyser mon bien <ArrowRight size={15} />
              </Link>
              <Link to="/exemple" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 13, background: '#f8fafc', border: '1.5px solid #edf2f7', color: '#0f172a', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Voir un exemple
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

    </main>
  );
}
