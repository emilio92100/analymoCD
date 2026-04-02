import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Clock, MapPin, Send, CheckCircle, Crown } from 'lucide-react';


export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 70 }}>
      {/* Hero */}
      <section style={{ padding: '56px 28px 48px', background: 'linear-gradient(150deg,#eef7fb 0%,#e4f2f8 50%,#f8fafc 100%)', textAlign: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 13, fontWeight: 700, color: '#1a5e78', marginBottom: 20 }}>
          Contact
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 14, letterSpacing: '-0.025em' }}>
          On est là <span style={{ color: '#2a7d9c' }}>pour vous.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ fontSize: 17, color: '#6b8a96', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Une question, une demande pro, ou simplement envie d'en savoir plus — écrivez-nous.
        </motion.p>
      </section>

      {/* Content */}
      <section style={{ padding: '52px 28px 88px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 40, alignItems: 'start' }} className="contact-g">

          {/* Left */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2d3d', marginBottom: 28 }}>Nos coordonnées</h2>
            {[{ I: Mail, l: 'Email', v: 'hello@verimo.fr' }, { I: Clock, l: 'Horaires', v: 'Lun–Ven, 9h–18h' }, { I: MapPin, l: 'Localisation', v: 'France (100% en ligne)' }].map(info => (
              <motion.div key={info.l} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a7d9c', flexShrink: 0 }}>
                  <info.I size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#7a9aaa', marginBottom: 2 }}>{info.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f2d3d' }}>{info.v}</div>
                </div>
              </motion.div>
            ))}

            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ marginTop: 28, padding: '22px', borderRadius: 18, background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Crown size={18} style={{ color: '#f59e0b' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Offre Professionnelle</div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14 }}>
                Notaire, agent, syndic ? Découvrez notre offre pro avec accès dédié et volumes illimités.
              </p>
              <a href="mailto:pro@verimo.fr" style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textDecoration: 'none' }}>
                pro@verimo.fr →
              </a>
            </motion.div>
          </div>

          {/* Right form */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ padding: '36px', borderRadius: 22, background: '#fff', border: '1px solid #edf2f4', boxShadow: '0 4px 24px rgba(15,45,61,0.06)' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '44px 0' }}>
                <CheckCircle size={52} style={{ color: '#22c55e', margin: '0 auto 18px' }} />
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f2d3d', marginBottom: 8 }}>Message envoyé !</h3>
                <p style={{ fontSize: 15, color: '#7a9aaa' }}>Nous vous répondrons sous 24h ouvrées.</p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2d3d', marginBottom: 26 }}>Envoyez-nous un message</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2d3d', marginBottom: 7 }}>Nom</label>
                      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jean Dupont" style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f4', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f2d3d', background: '#f8fafc' }} onFocus={e => (e.target as HTMLElement).style.borderColor = '#2a7d9c'} onBlur={e => (e.target as HTMLElement).style.borderColor = '#edf2f4'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2d3d', marginBottom: 7 }}>Email</label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com" style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f4', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f2d3d', background: '#f8fafc' }} onFocus={e => (e.target as HTMLElement).style.borderColor = '#2a7d9c'} onBlur={e => (e.target as HTMLElement).style.borderColor = '#edf2f4'} />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2d3d', marginBottom: 7 }}>Sujet</label>
                    <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f4', fontSize: 14, color: form.subject ? '#0f2d3d' : '#7a9aaa', background: '#f8fafc', outline: 'none' }}>
                      <option value="">Sélectionner un sujet</option>
                      <option>Question sur mes analyses</option>
                      <option>Offre professionnelle</option>
                      <option>Problème technique</option>
                      <option>Presse / Partenariat</option>
                      <option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2d3d', marginBottom: 7 }}>Message</label>
                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Décrivez votre demande..." style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f4', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0f2d3d', background: '#f8fafc' }} onFocus={e => (e.target as HTMLElement).style.borderColor = '#2a7d9c'} onBlur={e => (e.target as HTMLElement).style.borderColor = '#edf2f4'} />
                  </div>
                  <button onClick={() => { if (form.name && form.email && form.message) setSent(true); }} disabled={!form.name || !form.email || !form.message}
                    style={{ padding: '14px 28px', borderRadius: 13, background: !form.name || !form.email || !form.message ? 'rgba(42,125,156,0.3)' : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: !form.name || !form.email || !form.message ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Send size={16} /> Envoyer le message
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>
      <style>{`@media(max-width:767px){.contact-g{grid-template-columns:1fr!important}}`}</style>
    </main>
  );
}
