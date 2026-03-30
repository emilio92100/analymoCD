import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, AlertTriangle, CheckCircle, FileText, ArrowRight } from 'lucide-react';

const tabs = ['Vue d\'ensemble', 'Financier', 'Travaux', 'Juridique', 'Documents'];

export default function ExemplePage() {
  const [active, setActive] = useState(0);
  const scores = [{ l: 'Financier', v: 68, c: '#f0a500' }, { l: 'Travaux', v: 62, c: '#fb923c' }, { l: 'Juridique', v: 88, c: '#22c55e' }, { l: 'Charges', v: 80, c: '#2a7d9c' }];

  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 70 }}>
      {/* Hero */}
      <section style={{ padding: '56px 28px 44px', background: 'linear-gradient(150deg,#eef7fb 0%,#e4f2f8 50%,#f8fafc 100%)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 13, fontWeight: 700, color: '#1a5e78', marginBottom: 20 }}>
          Rapport exemple
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 14, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          Voici ce qu'Analymo <span style={{ color: '#2a7d9c' }}>vous produit.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ fontSize: 17, color: '#6b8a96', maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.7 }}>
          Rapport généré à partir d'un dossier réel (données anonymisées). PV d'AG, règlement de copropriété, diagnostics et appels de charges.
        </motion.p>
        <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 13, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 7px 24px rgba(42,125,156,0.28)' }}>
          Analyser mes documents <ChevronRight size={17} />
        </Link>
      </section>

      {/* Report */}
      <section style={{ padding: '44px 28px 80px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          {/* Report header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ padding: '28px 32px', borderRadius: 22, background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 5 }}>RAPPORT ANALYMO · EXEMPLE</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 3 }}>24 rue des Lilas, Appartement 4B — Lyon 6e</h2>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Analyse Complète · 104 pages analysées · 1 min 42s</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 54, fontWeight: 900, color: '#f0a500', lineHeight: 1 }}>74</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Score global /100</div>
              </div>
              <div style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.3)' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f0a500' }}>Négocier</div>
              </div>
            </div>
          </motion.div>

          {/* Score mini cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 22 }}>
            {scores.map((s, i) => (
              <motion.div key={s.l} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                style={{ padding: '16px', borderRadius: 14, background: '#fff', border: '1px solid #edf2f4', textAlign: 'center', boxShadow: '0 2px 8px rgba(15,45,61,0.05)' }}>
                <div style={{ fontSize: 30, fontWeight: 900, color: s.c, marginBottom: 4 }}>{s.v}</div>
                <div style={{ fontSize: 12, color: '#7a9aaa' }}>{s.l}</div>
                <div style={{ height: 4, borderRadius: 2, background: '#f0f4f6', marginTop: 8 }}>
                  <div style={{ width: `${s.v}%`, height: '100%', borderRadius: 2, background: s.c }} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 2 }}>
            {tabs.map((tab, i) => (
              <button key={tab} onClick={() => setActive(i)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: active === i ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : 'rgba(42,125,156,0.07)', color: active === i ? '#fff' : '#4a6b7c', fontSize: 13, fontWeight: active === i ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .2s' }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              style={{ padding: '28px', borderRadius: 20, background: '#fff', border: '1px solid #edf2f4', minHeight: 280, boxShadow: '0 2px 10px rgba(15,45,61,0.05)' }}>
              {active === 0 && (
                <div>
                  <div style={{ padding: '14px 18px', borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 7, letterSpacing: '0.05em' }}>CONCLUSION ANALYMO</div>
                    <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>Ce bien présente un profil intéressant mais nécessite une vigilance particulière sur l'état financier de la copropriété et les travaux à venir. Nous recommandons de négocier le prix à la baisse pour intégrer les coûts prévisibles.</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={15} /> Points positifs
                      </h4>
                      {["DPE classe C", "Diagnostic amiante négatif", "Électricité conforme", "Règlement de copro à jour"].map(p => (
                        <div key={p} style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>✓ {p}</div>
                      ))}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={15} /> Points de vigilance
                      </h4>
                      {[
                        { t: 'Ravalement façade voté — part ~2 400€ (2026)', a: true },
                        { t: 'Fonds de travaux sous-provisionné : 18 000€', a: true },
                        { t: '3 copropriétaires en impayé (~4 200€)', a: false },
                      ].map((p, i) => (
                        <div key={i} style={{ fontSize: 12, color: '#374151', marginBottom: 9, padding: '9px 12px', borderRadius: 8, background: p.a ? 'rgba(240,165,0,0.06)' : 'rgba(42,125,156,0.04)', border: `1px solid ${p.a ? 'rgba(240,165,0,0.18)' : 'rgba(42,125,156,0.12)'}` }}>
                          {p.a ? '⚠️' : 'ℹ️'} {p.t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {active === 1 && (
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f2d3d', marginBottom: 18 }}>État financier de la copropriété</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
                    {[{ l: 'Trésorerie', v: '23 400€', bad: true }, { l: 'Fonds travaux', v: '18 000€', bad: true }, { l: 'Charges/mois', v: '245€', bad: false }, { l: 'Impayés', v: '4 200€', bad: true }].map(it => (
                      <div key={it.l} style={{ padding: '18px', borderRadius: 14, background: '#f8fafc', border: '1px solid #edf2f4' }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: it.bad ? '#ef4444' : '#0f2d3d', marginBottom: 4 }}>{it.v}</div>
                        <div style={{ fontSize: 12, color: '#7a9aaa' }}>{it.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {active === 2 && (
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f2d3d', marginBottom: 18 }}>Travaux votés et prévus</h3>
                  {[{ a: '2024', d: 'Ravalement de façade côté rue', c: '~2 400€', s: 'Voté — planification en cours' }, { a: '2025', d: 'Mise aux normes ascenseur', c: '~850€', s: 'Voté — devis en cours' }].map((t, i) => (
                    <div key={i} style={{ padding: '18px', borderRadius: 14, background: 'rgba(240,165,0,0.04)', border: '1px solid rgba(240,165,0,0.18)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', marginBottom: 3 }}>{t.d}</div><div style={{ fontSize: 12, color: '#7a9aaa' }}>{t.a} · {t.s}</div></div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#f0a500' }}>{t.c}</div>
                    </div>
                  ))}
                </div>
              )}
              {active === 3 && (
                <div>
                  <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 20 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>✓ Score juridique : 88/100 — Bonne situation</span>
                  </div>
                  {["Règlement de copropriété conforme à la loi ALUR", "Pas de procédure judiciaire en cours", "Syndic professionnel en exercice", "Assemblées générales tenues régulièrement"].map(p => (
                    <div key={p} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <CheckCircle size={15} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 14, color: '#374151' }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
              {active === 4 && (
                <div>
                  <p style={{ fontSize: 14, color: '#7a9aaa', marginBottom: 18 }}>104 pages analysées en 1 min 42s</p>
                  {[{ n: "PV AG 2023", p: 24 }, { n: "PV AG 2022", p: 18 }, { n: "Appel de charges T1 2024", p: 6 }, { n: "Règlement de copropriété", p: 42 }, { n: "Diagnostic DPE", p: 8 }].map(doc => (
                    <div key={doc.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #edf2f4', marginBottom: 8 }}>
                      <FileText size={16} style={{ color: '#2a7d9c' }} />
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, color: '#0f2d3d' }}>{doc.n}</div><div style={{ fontSize: 11, color: '#7a9aaa' }}>{doc.p} pages</div></div>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.08)', color: '#15803d', fontWeight: 600 }}>Analysé</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ marginTop: 36, padding: '36px', borderRadius: 22, background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', textAlign: 'center' }}>
            <h3 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 10 }}>Prêt à analyser votre bien ?</h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 26 }}>Obtenez un rapport comme celui-ci. Dès 4,90€, en moins de 2 minutes.</p>
            <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 32px', borderRadius: 13, background: '#fff', color: '#0f2d3d', fontSize: 15, fontWeight: 700, textDecoration: 'none' }}>
              Voir les tarifs <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
      <style>{`@media(max-width:600px){.score-g{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </main>
  );
}
