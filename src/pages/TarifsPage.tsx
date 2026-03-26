import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, Mail, Zap, Shield, FileText } from 'lucide-react';
import { PRICING_PLANS } from '../types';

export default function TarifsPage() {
  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 70 }}>
      {/* Hero */}
      <section style={{ padding: '64px 28px 56px', background: 'linear-gradient(150deg,#eef7fb 0%,#e4f2f8 50%,#f8fafc 100%)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 13, fontWeight: 700, color: '#1a5e78', marginBottom: 20 }}>
          🏷️ Tarification transparente
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ fontSize: 'clamp(30px,5vw,56px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 16, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Investissez en toute <span style={{ color: '#2a7d9c' }}>sérénité.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ fontSize: 18, color: '#6b8a96', maxWidth: 520, margin: '0 auto 16px', lineHeight: 1.7 }}>
          Des tarifs simples, sans abonnement, sans surprise. Payez uniquement pour ce dont vous avez besoin.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[{ I: Shield, l: 'Paiement sécurisé Stripe' }, { I: Zap, l: 'Résultats en 2 min' }, { I: FileText, l: 'Rapport PDF inclus' }].map(({ I, l }) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#7a9aaa', fontWeight: 500 }}>
              <I size={14} style={{ color: '#2a7d9c' }} />{l}
            </div>
          ))}
        </motion.div>
      </section>

      {/* Cards */}
      <section style={{ padding: '56px 28px 80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 22 }}>
            {PRICING_PLANS.map((plan, i) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
                whileHover={{ y: -6, boxShadow: plan.highlighted ? '0 20px 56px rgba(42,125,156,0.2)' : '0 14px 40px rgba(15,45,61,0.1)' }}
                style={{ padding: '34px 28px', borderRadius: 24, background: '#fff', border: plan.highlighted ? '2px solid #2a7d9c' : '1px solid #edf2f4', position: 'relative', boxShadow: plan.highlighted ? '0 12px 40px rgba(42,125,156,0.14)' : '0 2px 10px rgba(15,45,61,0.05)', cursor: 'default' }}>
                {plan.badge && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', padding: '5px 18px', borderRadius: 100, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: plan.badgeColor === 'teal' ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : '#f59e0b', color: plan.badgeColor === 'teal' ? '#fff' : '#0f2d3d' }}>{plan.badge}</div>}

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{ width: 58, height: 58, borderRadius: 16, background: plan.highlighted ? 'rgba(42,125,156,0.1)' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: `1px solid ${plan.highlighted ? 'rgba(42,125,156,0.2)' : '#edf2f4'}` }}>{plan.icon}</div>
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f2d3d', textAlign: 'center', marginBottom: 6 }}>{plan.name}</h3>

                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 46, fontWeight: 900, color: '#0f2d3d' }}>{plan.price.toFixed(2).replace('.', ',')}</span>
                  <span style={{ fontSize: 18, color: '#7a9aaa' }}>€</span>
                  <div style={{ fontSize: 12, color: '#7a9aaa', marginTop: 2 }}>paiement unique · sans abonnement</div>
                </div>

                <div style={{ padding: '11px 14px', borderRadius: 11, background: plan.highlighted ? 'rgba(42,125,156,0.06)' : '#f8fafc', border: `1px solid ${plan.highlighted ? 'rgba(42,125,156,0.14)' : '#edf2f4'}`, marginBottom: 20 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#2a7d9c', letterSpacing: '0.08em', marginBottom: 4 }}>+ IDÉAL POUR</div>
                  <div style={{ fontSize: 12, color: '#4a6b7c', lineHeight: 1.5 }}>{plan.idealFor}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 26 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <CheckCircle2 size={15} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 13, color: '#4a6b7c', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <Link to={`/inscription?plan=${plan.id}`} style={{ display: 'block', padding: '14px 0', borderRadius: 13, fontSize: 15, fontWeight: 700, color: plan.highlighted ? '#fff' : '#0f2d3d', background: plan.highlighted ? 'linear-gradient(135deg,#2a7d9c,#0f2d3d)' : 'transparent', border: plan.highlighted ? 'none' : '2px solid #0f2d3d', textDecoration: 'none', textAlign: 'center', boxShadow: plan.highlighted ? '0 7px 22px rgba(42,125,156,0.28)' : 'none' }}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Pro banner */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ marginTop: 28, padding: '28px 36px', borderRadius: 22, background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(240,165,0,0.15)', border: '1px solid rgba(240,165,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={22} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 700, marginBottom: 3 }}>Offre Professionnelle</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Notaires, agents, syndics — volumes illimités, API, support dédié, rapports sur-mesure.</p>
              </div>
            </div>
            <Link to="/contact" style={{ padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, color: '#0f2d3d', background: '#f59e0b', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(240,165,0,0.35)' }}>
              <Mail size={15} /> Nous contacter
            </Link>
          </motion.div>

          {/* FAQ rapide */}
          <div style={{ marginTop: 64, textAlign: 'center', maxWidth: 720, margin: '64px auto 0' }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f2d3d', marginBottom: 32 }}>Questions fréquentes</h2>
            {[
              { q: 'Comment fonctionne le paiement ?', a: 'Paiement sécurisé via Stripe. Rapport disponible immédiatement.' },
              { q: 'Mes documents sont-ils sécurisés ?', a: 'Vos fichiers sont chiffrés et supprimés automatiquement. Aucune donnée conservée.' },
              { q: 'Puis-je me faire rembourser ?', a: 'En cas de problème technique, contactez-nous sous 48h. Nous étudions chaque demande.' },
            ].map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.09 }}
                style={{ padding: '22px 26px', borderRadius: 16, background: '#fff', border: '1px solid #edf2f4', marginBottom: 12, textAlign: 'left', boxShadow: '0 2px 8px rgba(15,45,61,0.04)' }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0f2d3d', marginBottom: 8 }}>{faq.q}</h4>
                <p style={{ fontSize: 14, color: '#7a9aaa', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
