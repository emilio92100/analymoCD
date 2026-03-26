import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

const tabs = ["Vue d'ensemble", "Financier", "Travaux", "Juridique", "Documents"];

export default function ExemplePage() {
  const [activeTab, setActiveTab] = useState(0);
  const scores = [{ label:'Financier', score:68 }, { label:'Travaux', score:62 }, { label:'Juridique', score:88 }, { label:'Charges', score:80 }];

  return (
    <main style={{ paddingTop: 80 }}>
      <section style={{ padding: '60px 24px 40px', background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 13, fontWeight: 700, color: 'var(--brand-teal)', marginBottom: 20 }}>Exemple de rapport</div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 16 }}>Voici ce qu'Analymo vous produit.</h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>Rapport généré à partir d'un dossier réel (données anonymisées).</p>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 32px rgba(42,125,156,0.3)' }}>
            Analyser mes documents <ChevronRight size={18} />
          </Link>
        </div>
      </section>
      <section style={{ padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ padding: '28px 32px', borderRadius: 20, background: 'linear-gradient(135deg, var(--brand-navy), var(--brand-teal-dark))', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 6 }}>RAPPORT ANALYMO</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>24 rue des Lilas, Appartement 4B — Lyon 6e</h2>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Analyse Complète · Exemple</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 52, fontWeight: 900, color: '#f0a500', lineHeight: 1 }}>74</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Score global /100</div>
              </div>
              <div style={{ padding: '8px 20px', borderRadius: 10, background: 'rgba(240,165,0,0.2)', border: '1px solid rgba(240,165,0,0.4)' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f0a500' }}>Négocier</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {scores.map(s => (
              <div key={s.label} style={{ padding: '16px', borderRadius: 14, background: '#fff', border: '1px solid rgba(42,125,156,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.score >= 75 ? '#22c55e' : s.score >= 55 ? '#f0a500' : '#ef4444', marginBottom: 4 }}>{s.score}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(42,125,156,0.1)', marginTop: 8 }}>
                  <div style={{ width: `${s.score}%`, height: '100%', borderRadius: 2, background: s.score >= 75 ? '#22c55e' : s.score >= 55 ? '#f0a500' : '#ef4444' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
            {tabs.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: activeTab === i ? 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))' : 'rgba(42,125,156,0.06)', color: activeTab === i ? '#fff' : 'var(--text-secondary)', fontSize: 14, fontWeight: activeTab === i ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>{tab}</button>
            ))}
          </div>
          <div style={{ padding: '28px', borderRadius: 20, background: '#fff', border: '1px solid rgba(42,125,156,0.08)', minHeight: 300 }}>
            {activeTab === 0 && (
              <div>
                <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)', marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>CONCLUSION ANALYMO</div>
                  <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7 }}>Ce bien présente un profil intéressant mais nécessite une vigilance sur l'état financier de la copropriété et les travaux à venir. Nous recommandons de négocier le prix à la baisse pour intégrer les coûts prévisibles.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="exemple-grid">
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle size={16} /> Points positifs</h4>
                    {["DPE classe C — performance énergétique correcte", "Diagnostic amiante négatif (rapport 2021)", "Diagnostic électrique conforme", "Règlement de copropriété à jour"].map(p => <div key={p} style={{ fontSize: 14, color: '#374151', marginBottom: 10 }}>✓ {p}</div>)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#92400e', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} /> Points de vigilance</h4>
                    {["Ravalement de façade voté — part ~2 400€ (2026)", "Fonds de travaux sous-provisionné : 18 000€", "3 copropriétaires en impayé (~4 200€)"].map(p => <div key={p} style={{ fontSize: 13, color: '#374151', marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(240,165,0,0.06)', border: '1px solid rgba(240,165,0,0.2)' }}>⚠️ {p}</div>)}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 1 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 20 }}>État financier de la copropriété</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  {[{ label: 'Trésorerie', value: '23 400€', bad: true }, { label: 'Fonds travaux', value: '18 000€', bad: true }, { label: 'Charges/mois', value: '245€', bad: false }, { label: 'Impayés', value: '4 200€', bad: true }].map(item => (
                    <div key={item.label} style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-secondary)', border: '1px solid rgba(42,125,156,0.1)' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: item.bad ? '#ef4444' : 'var(--brand-navy)', marginBottom: 4 }}>{item.value}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 2 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 20 }}>Travaux votés et prévus</h3>
                {[{ annee: '2024', desc: 'Ravalement de façade côté rue', cout: '~2 400€', statut: 'Voté — planification en cours' }, { annee: '2025', desc: "Mise aux normes ascenseur", cout: '~850€', statut: 'Voté — devis en cours' }].map((t, i) => (
                  <div key={i} style={{ padding: '20px', borderRadius: 14, background: 'rgba(240,165,0,0.04)', border: '1px solid rgba(240,165,0,0.2)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div><div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 4 }}>{t.desc}</div><div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.annee} · {t.statut}</div></div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f0a500' }}>{t.cout}</div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 3 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 16 }}>Analyse juridique</h3>
                <div style={{ padding: '8px 14px', display: 'inline-block', borderRadius: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', marginBottom: 24 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#15803d' }}>✓ Score juridique : 88/100 — Bonne situation</span>
                </div>
                {["Règlement de copropriété conforme à la loi ALUR", "Pas de procédure judiciaire en cours", "Syndic professionnel en exercice depuis 2018", "Assemblées générales tenues régulièrement"].map(p => (
                  <div key={p} style={{ display: 'flex', gap: 10, marginBottom: 12 }}><CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ fontSize: 14, color: '#374151' }}>{p}</span></div>
                ))}
              </div>
            )}
            {activeTab === 4 && (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 8 }}>Documents analysés</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>98 pages analysées en 1min 42s</p>
                {[{ nom: "PV AG 2023", pages: 24 }, { nom: "PV AG 2022", pages: 18 }, { nom: "Appel de charges T1 2024", pages: 6 }, { nom: "Règlement de copropriété", pages: 42 }, { nom: "Diagnostic DPE", pages: 8 }].map(doc => (
                  <div key={doc.nom} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid rgba(42,125,156,0.08)', marginBottom: 8 }}>
                    <FileText size={18} color="var(--brand-teal)" />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-navy)' }}>{doc.nom}</div><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{doc.pages} pages</div></div>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', color: '#15803d', fontWeight: 600 }}>Analysé</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginTop: 40, padding: '36px', borderRadius: 20, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', textAlign: 'center' }}>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Prêt à analyser votre bien ?</h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 28 }}>Obtenez un rapport comme celui-ci. Dès 4,99€.</p>
            <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', borderRadius: 12, background: '#fff', color: 'var(--brand-teal)', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>Voir les tarifs <ChevronRight size={18} /></Link>
          </div>
        </div>
      </section>
      <style>{`@media (max-width: 767px) { .exemple-grid { grid-template-columns: 1fr !important; } }`}</style>
    </main>
  );
}
