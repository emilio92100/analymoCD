import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Clock, MapPin, Send, CheckCircle, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSEO } from '../hooks/useSEO';
import { VerimoConfetti, VERIMO_CONFETTI_COLORS } from '../components/VerimoConfetti';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isLowPerf = () => isIOS() || (typeof window !== 'undefined' && window.innerWidth <= 768);


export default function ContactPage() {
  useSEO({
    title: 'Contact Verimo — Analyse de documents immobiliers',
    description: "Une question sur l'analyse de vos documents immobiliers ? Contactez Verimo. Réponse sous 48h pour tous vos besoins avant achat.",
    canonical: '/contact',
  });

  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ lastname: '', firstname: '', email: '', phone: '', subject: '', message: '' });

  const canSubmit = form.lastname.trim() && form.firstname.trim() && form.email.trim() && form.message.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSending(true);
    await supabase.from('contact_messages').insert({
      name: `${form.firstname.trim()} ${form.lastname.trim()}`,
      email: form.email.trim(),
      subject: form.subject || null,
      message: `${form.message.trim()}${form.phone.trim() ? `\n\n📞 Téléphone : ${form.phone.trim()}` : ''}`,
    });
    setSending(false);
    setSent(true);
  };

  return (
    <main style={{ background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif", paddingTop: 70 }}>
      {/* Hero */}
      <section style={{ padding: '56px 28px 48px', background: 'linear-gradient(150deg,#eef7fb 0%,#e4f2f8 50%,#f8fafc 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Confettis — desktop (5) + mobile allégé (3) */}
        <div className="confetti-desktop" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <VerimoConfetti items={[
            { top: '20%', left: '7%', size: 10, color: VERIMO_CONFETTI_COLORS.blue, shape: 'circle' },
            { top: '30%', right: '8%', size: 12, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 0.5 },
            { top: '60%', left: '5%', size: 8, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1 },
            { bottom: '20%', right: '10%', size: 10, color: VERIMO_CONFETTI_COLORS.red, shape: 'circle', delay: 0.8 },
            { bottom: '30%', left: '12%', size: 12, color: VERIMO_CONFETTI_COLORS.green, shape: 'circle', delay: 1.3 },
          ]} />
        </div>
        <div className="confetti-mobile" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <VerimoConfetti items={[
            { top: '15%', left: '4%', size: 6, color: VERIMO_CONFETTI_COLORS.blue, shape: 'circle' },
            { top: '50%', right: '4%', size: 7, color: VERIMO_CONFETTI_COLORS.green, shape: 'square', delay: 0.6 },
            { bottom: '15%', left: '5%', size: 6, color: VERIMO_CONFETTI_COLORS.orange, shape: 'circle', delay: 1.1 },
          ]} />
        </div>

        <div style={{ position: 'relative', zIndex: 2 }}>
        <motion.h1 initial={{ opacity: 0, y: isLowPerf() ? 6 : 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: isLowPerf() ? 0.18 : 0.4 }} style={{ fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 900, color: '#0f2d3d', marginBottom: 14, letterSpacing: '-0.025em' }}>
          On est là{' '}
          <span style={{ position: 'relative', display: 'inline-block', color: '#2a7d9c' }}>
            pour vous.
            <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.6, duration: 1.2 }}
              style={{ position: 'absolute', bottom: -3, left: 0, right: 0, height: 4, background: 'rgba(42,125,156,0.25)', borderRadius: 4, transformOrigin: 'left', display: 'block' }} />
          </span>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: isLowPerf() ? 0.06 : 0.2 }} style={{ fontSize: 'clamp(15px, 2.2vw, 17px)', color: '#6b8a96', maxWidth: 700, margin: '0 auto', lineHeight: 1.6, padding: '0 8px' }}>
          Une question, une demande pro, ou simplement envie d'en savoir plus — écrivez-nous.
        </motion.p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: '52px 28px 88px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 40, alignItems: 'start' }} className="contact-g">

          {/* Left */}
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2d3d', marginBottom: 28 }}>Nos coordonnées</h2>
            {[{ I: Mail, l: 'Email', v: 'hello@verimo.fr' }, { I: Clock, l: 'Horaires', v: 'Lun–Ven, 9h–18h' }, { I: MapPin, l: 'Localisation', v: 'France (100% en ligne)' }].map(info => (
              <motion.div key={info.l} initial={{ opacity: 0, x: isLowPerf() ? 0 : -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: isLowPerf() ? 0.18 : 0.35 }}
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

            <motion.div initial={{ opacity: 0, y: isLowPerf() ? 6 : 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: isLowPerf() ? 0.18 : 0.35 }}
              style={{ marginTop: 28, padding: '22px', borderRadius: 18, background: 'linear-gradient(135deg,#0f2d3d,#1a4a60)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Crown size={18} style={{ color: '#f59e0b' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Offre Professionnelle</div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 14 }}>
                Agent immobilier, investisseur, marchand de bien, notaire ? Découvrez notre offre pro avec accès dédié.
              </p>
              <a href="mailto:pro@verimo.fr" style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textDecoration: 'none' }}>
                pro@verimo.fr →
              </a>
            </motion.div>
          </div>

          {/* Right form */}
          <motion.div initial={{ opacity: 0, y: isLowPerf() ? 8 : 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: isLowPerf() ? 0.2 : 0.4 }}
            style={{ padding: '36px', borderRadius: 22, background: '#fff', border: '1px solid #edf2f4', boxShadow: '0 4px 24px rgba(15,45,61,0.06)' }}>
              <>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2d3d', marginBottom: 26 }}>Envoyez-nous un message</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2d3d', marginBottom: 7 }}>Nom <span style={{ color: '#dc2626' }}>*</span></label>
                      <input value={form.lastname} onChange={e => setForm({ ...form, lastname: e.target.value })} placeholder="Dupont" style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f4', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f2d3d', background: '#f8fafc' }} onFocus={e => (e.target as HTMLElement).style.borderColor = '#2a7d9c'} onBlur={e => (e.target as HTMLElement).style.borderColor = '#edf2f4'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2d3d', marginBottom: 7 }}>Prénom <span style={{ color: '#dc2626' }}>*</span></label>
                      <input value={form.firstname} onChange={e => setForm({ ...form, firstname: e.target.value })} placeholder="Jean" style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f4', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f2d3d', background: '#f8fafc' }} onFocus={e => (e.target as HTMLElement).style.borderColor = '#2a7d9c'} onBlur={e => (e.target as HTMLElement).style.borderColor = '#edf2f4'} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2d3d', marginBottom: 7 }}>Email <span style={{ color: '#dc2626' }}>*</span></label>
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="vous@exemple.com" style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f4', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f2d3d', background: '#f8fafc' }} onFocus={e => (e.target as HTMLElement).style.borderColor = '#2a7d9c'} onBlur={e => (e.target as HTMLElement).style.borderColor = '#edf2f4'} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2d3d', marginBottom: 7 }}>Téléphone <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: 11 }}>(optionnel)</span></label>
                      <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="06 12 34 56 78" style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f4', fontSize: 14, outline: 'none', boxSizing: 'border-box', color: '#0f2d3d', background: '#f8fafc' }} onFocus={e => (e.target as HTMLElement).style.borderColor = '#2a7d9c'} onBlur={e => (e.target as HTMLElement).style.borderColor = '#edf2f4'} />
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
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f2d3d', marginBottom: 7 }}>Message <span style={{ color: '#dc2626' }}>*</span></label>
                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} placeholder="Décrivez votre demande..." style={{ width: '100%', padding: '12px 14px', borderRadius: 11, border: '1.5px solid #edf2f4', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', color: '#0f2d3d', background: '#f8fafc' }} onFocus={e => (e.target as HTMLElement).style.borderColor = '#2a7d9c'} onBlur={e => (e.target as HTMLElement).style.borderColor = '#edf2f4'} />
                  </div>
                  <button onClick={handleSubmit} disabled={!canSubmit || sending}
                    style={{ padding: '14px 28px', borderRadius: 13, background: !canSubmit ? 'rgba(42,125,156,0.3)' : 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: !canSubmit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }}>
                    <Send size={16} /> {sending ? 'Envoi...' : 'Envoyer le message'}
                  </button>
                </div>
              </>
          </motion.div>

          {/* Popup confirmation */}
          <AnimatePresence>
            {sent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,45,61,0.5)', padding: 20, backdropFilter: 'blur(3px)' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 420, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircle size={32} style={{ color: '#16a34a' }} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Message envoyé !</h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 8 }}>
                    Merci {form.firstname} ! Votre message a bien été transmis à notre équipe.
                  </p>
                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>
                    Nous reviendrons vers vous dans les plus brefs délais.
                  </p>
                  <button onClick={() => { setSent(false); setForm({ lastname: '', firstname: '', email: '', phone: '', subject: '', message: '' }); }}
                    style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
                    Fermer
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      <style>{`@media(max-width:767px){.contact-g{grid-template-columns:1fr!important}} @media (max-width: 1023px) { .confetti-desktop { display: none !important; } } @media (min-width: 1024px) { .confetti-mobile { display: none !important; } }`}</style>
    </main>
  );
}
