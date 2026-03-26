import { useState } from 'react';
import { Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  return (
    <main style={{ paddingTop: 80 }}>
      <section style={{ padding: '60px 24px', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 13, fontWeight: 700, color: 'var(--brand-teal)', marginBottom: 20 }}>Contact</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 16 }}>On est là pour vous.</h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Une question, une demande pro, ou simplement envie d'en savoir plus — écrivez-nous.</p>
        </div>
      </section>
      <section style={{ padding: '64px 24px 100px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 60 }} className="contact-grid">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 32 }}>Nos coordonnées</h2>
            {[{ icon: <Mail size={20} />, label: 'Email', value: 'contact@analymo.fr' }, { icon: <Clock size={20} />, label: 'Horaires', value: 'Lun–Ven, 9h–18h' }, { icon: <MapPin size={20} />, label: 'Localisation', value: 'France (100% en ligne)' }].map(info => (
              <div key={info.label} style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-teal)', flexShrink: 0 }}>{info.icon}</div>
                <div><div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{info.label}</div><div style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-navy)' }}>{info.value}</div></div>
              </div>
            ))}
            <div style={{ marginTop: 40, padding: '24px', borderRadius: 16, background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-teal-dark))' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>OFFRE PROFESSIONNELLE</div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 16 }}>Notaire, agent, syndic ou investisseur ? Découvrez notre offre pro avec API et rapports illimités.</p>
              <a href="mailto:pro@analymo.fr" style={{ fontSize: 14, fontWeight: 600, color: '#f0a500', textDecoration: 'none' }}>pro@analymo.fr →</a>
            </div>
          </div>
          <div style={{ padding: '36px', borderRadius: 20, background: '#fff', border: '1px solid rgba(42,125,156,0.08)', boxShadow: '0 4px 32px rgba(0,0,0,0.04)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <CheckCircle size={56} color="#22c55e" style={{ margin: '0 auto 20px' }} />
                <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 10 }}>Message envoyé !</h3>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Nous vous répondrons sous 24h ouvrées.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 28 }}>Envoyez-nous un message</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Nom</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jean Dupont" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} /></div>
                    <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="vous@exemple.com" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} /></div>
                  </div>
                  <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Sujet</label>
                    <select value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 14, background: '#fff', outline: 'none' }}>
                      <option value="">Sélectionner un sujet</option>
                      <option>Question sur mes analyses</option><option>Offre professionnelle</option><option>Problème technique</option><option>Autre</option>
                    </select>
                  </div>
                  <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)', marginBottom: 8 }}>Message</label><textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={5} placeholder="Décrivez votre demande..." style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid rgba(42,125,156,0.2)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} /></div>
                  <button onClick={() => { if (form.name && form.email && form.message) setSent(true); }} disabled={!form.name || !form.email || !form.message} style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Send size={18} /> Envoyer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
      <style>{`@media (max-width: 767px) { .contact-grid { grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
    </main>
  );
}
