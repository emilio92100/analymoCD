import { useState } from 'react';
import { ChevronDown, Send } from 'lucide-react';

export default function Support() {
  const faqs = [
    { q: "Quels documents puis-je analyser ?", a: "PV d'AG, règlements de copropriété, appels de charges, diagnostics immobiliers. Formats : PDF, Word, JPG/PNG." },
    { q: "Combien de temps prend une analyse ?", a: "Moins de 2 minutes. Une notification vous est envoyée dès que le rapport est disponible." },
    { q: "Mes documents sont-ils sécurisés ?", a: "Oui. Chiffrement SSL/TLS, aucun partage de données. Les fichiers sont supprimés immédiatement après l'analyse." },
    { q: "Comment fonctionnent les crédits ?", a: "Chaque achat vous attribue des crédits : 4,90€ = 1 crédit analyse document, 19,90€ = 1 crédit analyse complète, 29,90€ = 2 crédits complets, 39,90€ = 3 crédits complets. Les crédits ne expirent pas." },
  ];
  const [open, setOpen] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');

  return (
    <div>
      <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', marginBottom: 24 }}>Support / Aide</h1>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Questions fréquentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((f, i) => (
            <div key={i} style={{ borderRadius: 12, border: '1px solid #edf2f7', overflow: 'hidden', background: '#fff' }}>
              <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{f.q}</span>
                <ChevronDown size={15} color="#2a7d9c" style={{ flexShrink: 0, transform: open === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {open === i && <div style={{ padding: '0 18px 14px' }}><p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>{f.a}</p></div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #edf2f7', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 18 }}>Nous contacter</h2>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 5 }}>Message envoyé !</h3>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>Réponse sous 24h à hello@verimo.fr</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder="Décrivez votre problème…"
              style={{ width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #edf2f7', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, fontFamily: 'inherit', color: '#0f172a' }} />
            <button onClick={() => { if (msg) setSent(true); }} disabled={!msg}
              style={{ alignSelf: 'flex-start', padding: '10px 22px', borderRadius: 9, background: msg ? 'linear-gradient(135deg, #2a7d9c, #0f2d3d)' : '#edf2f7', border: 'none', color: msg ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 700, cursor: msg ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Send size={14} /> Envoyer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
