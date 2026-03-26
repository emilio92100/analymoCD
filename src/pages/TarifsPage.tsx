import { Link } from 'react-router-dom';
import { CheckCircle2, Crown, Mail } from 'lucide-react';
import { PRICING_PLANS } from '../types';

export default function TarifsPage() {
  return (
    <main style={{ paddingTop: 80 }}>
      <section style={{ padding: '60px 24px', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 13, fontWeight: 700, color: 'var(--brand-teal)', marginBottom: 20 }}>🏷️ Tarification transparente</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 16, letterSpacing: '-0.02em' }}>Investissez en toute sérénité</h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Des tarifs simples pour sécuriser votre futur chez-vous.</p>
        </div>
      </section>
      <section style={{ padding: '64px 24px 100px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {PRICING_PLANS.map(plan => (
              <div key={plan.id} style={{ padding: '32px 28px', borderRadius: 20, background: '#fff', border: plan.highlighted ? '2px solid var(--brand-teal)' : '1px solid rgba(42,125,156,0.12)', position: 'relative', boxShadow: plan.highlighted ? '0 12px 48px rgba(42,125,156,0.15)' : '0 2px 16px rgba(0,0,0,0.04)' }}>
                {plan.badge && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', padding: '5px 16px', borderRadius: 100, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: plan.badgeColor === 'teal' ? 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))' : '#f0a500', color: '#fff' }}>{plan.badge}</div>}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: plan.highlighted ? 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))' : 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{plan.icon}</div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', textAlign: 'center', marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: 'var(--brand-navy)' }}>{plan.price.toFixed(2).replace('.', ',')}</span>
                  <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>€</span>
                </div>
                <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(42,125,156,0.04)', border: '1px solid rgba(42,125,156,0.1)', marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand-teal)', letterSpacing: '0.08em', marginBottom: 4 }}>+ IDÉAL POUR</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>{plan.idealFor}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {plan.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <CheckCircle2 size={16} color="var(--brand-teal)" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link to={`/inscription?plan=${plan.id}`} style={{ display: 'block', padding: '13px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, color: plan.highlighted ? '#fff' : 'var(--brand-navy)', background: plan.highlighted ? 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)' : 'transparent', border: plan.highlighted ? 'none' : '2px solid var(--brand-navy)', textDecoration: 'none', textAlign: 'center' }}>{plan.cta}</Link>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, padding: '32px 40px', borderRadius: 20, background: 'linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-teal-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(240,165,0,0.2)', border: '1px solid rgba(240,165,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0a500' }}><Crown size={22} /></div>
              <div>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Offre Professionnelle</h3>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>Notaires, agents, syndics — volumes illimités, API, rapports sur-mesure, support dédié.</p>
              </div>
            </div>
            <Link to="/contact" style={{ padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', background: '#f0a500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
              <Mail size={16} /> Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
