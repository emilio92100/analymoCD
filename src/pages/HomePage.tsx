import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Zap, FileSearch, Upload, Search, FileText, CheckCircle, Star, Users, Building2, BadgeCheck, UserCheck, CheckCircle2, Crown, Mail } from 'lucide-react';
import { PRICING_PLANS } from '../types';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <WhySection />
      <ForWhoSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
    </main>
  );
}

/* ── HERO ───────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: 80, background: 'linear-gradient(160deg, #f5f9fb 0%, #eaf4f8 50%, #e0f0f7 100%)' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.08) 0%, transparent 70%)' }} />
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2a7d9c" strokeWidth="1" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }} className="hero-grid">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', marginBottom: 28 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-teal)', display: 'inline-block' }} className="animate-pulse" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-teal)', letterSpacing: '0.02em' }}>IA spécialisée en immobilier</span>
            </div>
            <h1 style={{ fontSize: 'clamp(38px, 5vw, 62px)', fontWeight: 800, lineHeight: 1.1, color: 'var(--brand-navy)', marginBottom: 24, letterSpacing: '-0.02em' }}>
              Vos documents<br />immobiliers{' '}
              <span style={{ background: 'linear-gradient(135deg, var(--brand-teal-light), var(--brand-teal-dark))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>analysés</span>
              <br />en 2 minutes.
            </h1>
            <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
              Analymo lit vos PV d'AG, règlements de copropriété, diagnostics et appels de charges — et vous dit <strong style={{ color: 'var(--brand-navy)' }}>exactement ce qui compte</strong> avant d'acheter.
            </p>
            <div style={{ display: 'flex', gap: 20, marginBottom: 40, flexWrap: 'wrap' }}>
              {[{ icon: <Zap size={14} />, text: 'Résultats en 2 min' }, { icon: <Shield size={14} />, text: 'Données sécurisées' }, { icon: <FileSearch size={14} />, text: 'IA entraînée sur l\'immo' }].map(item => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <span style={{ color: 'var(--brand-teal)' }}>{item.icon}</span>{item.text}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/tarifs" style={{ padding: '15px 32px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 32px rgba(42,125,156,0.35)' }}>
                Lancer une analyse <ChevronRight size={18} />
              </Link>
              <Link to="/exemple" style={{ padding: '15px 28px', borderRadius: 12, fontSize: 16, fontWeight: 600, color: 'var(--brand-teal)', border: '1.5px solid rgba(42,125,156,0.25)', textDecoration: 'none', background: 'rgba(255,255,255,0.7)' }}>
                Voir un exemple
              </Link>
            </div>
            <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex' }}>
                {['E','M','T','L','A'].map((l, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: `hsl(${190+i*20}, 55%, ${40+i*5}%)`, border: '2px solid white', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{l}</div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}><strong style={{ color: 'var(--brand-navy)' }}>+200 acheteurs</strong> font confiance à Analymo</p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PhoneMockup />
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 767px) { .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }`}</style>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div style={{ position: 'relative' }} className="animate-float">
      <div style={{ position: 'absolute', inset: -40, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(42,125,156,0.15) 0%, transparent 70%)', filter: 'blur(20px)' }} />
      <div style={{ width: 280, height: 560, borderRadius: 40, background: 'var(--brand-navy)', boxShadow: '0 40px 100px rgba(15,45,61,0.4)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', width: 100, height: 28, borderRadius: 14, background: '#0a1f2b', zIndex: 10 }} />
        <div style={{ position: 'absolute', inset: 4, borderRadius: 36, background: '#f5f9fb', overflow: 'hidden' }}>
          <div style={{ padding: '48px 16px 12px', background: 'linear-gradient(160deg, var(--brand-teal) 0%, var(--brand-navy) 100%)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Analymo</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>Analyse en cours...</div>
            <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }}>
              <div style={{ width: '70%', height: '100%', borderRadius: 2, background: '#fff' }} />
            </div>
          </div>
          <div style={{ position: 'relative', padding: '12px' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(42,125,156,0.8), transparent)', zIndex: 5 }} className="animate-scan" />
            {[{ w: '90%', l: "PV d'Assemblée Générale 2024" }, { w: '75%', l: 'Charges prévisionnelles' }, { w: '85%', l: 'Travaux votés : ravalement' }, { w: '60%', l: 'État du fonds de travaux' }].map((line, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, color: 'var(--text-muted)', marginBottom: 3 }}>{line.l}</div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(42,125,156,0.12)', width: line.w }} />
              </div>
            ))}
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ label: 'Financier', score: 82, color: '#22c55e' }, { label: 'Travaux', score: 65, color: '#f0a500' }, { label: 'Juridique', score: 90, color: '#22c55e' }, { label: 'Global', score: 78, color: '#3a9cbf' }].map(s => (
                <div key={s.label} style={{ padding: '8px 10px', borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 8, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.score}</div>
                  <div style={{ height: 3, borderRadius: 2, background: '#f0f0f0', marginTop: 4 }}>
                    <div style={{ width: `${s.score}%`, height: '100%', borderRadius: 2, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg, rgba(42,125,156,0.08), rgba(15,45,61,0.04))', border: '1px solid rgba(42,125,156,0.15)' }}>
              <div style={{ fontSize: 8, color: 'var(--brand-teal)', fontWeight: 700, marginBottom: 4 }}>RECOMMANDATION</div>
              <div style={{ fontSize: 9, color: 'var(--brand-navy)', fontWeight: 600 }}>✓ Bien intéressant — négocier le prix</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: -50, top: '20%', padding: '10px 16px', borderRadius: 12, background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: 12, fontWeight: 600, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} /> Analyse complète
      </div>
      <div style={{ position: 'absolute', left: -60, bottom: '25%', padding: '10px 16px', borderRadius: 12, background: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', fontSize: 12, fontWeight: 600, color: 'var(--brand-teal)', whiteSpace: 'nowrap' }}>
        ⚡ 2 min chrono
      </div>
    </div>
  );
}

/* ── SECTION HEADER ─────────────────────────────────────── */
function SectionHeader({ badge, title, subtitle }: { badge: string; title: string; subtitle: string }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 13, fontWeight: 700, color: 'var(--brand-teal)', marginBottom: 20 }}>{badge}</div>
      <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 16, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{title}</h2>
      <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{subtitle}</p>
    </div>
  );
}

/* ── WHY ─────────────────────────────────────────────────── */
function WhySection() {
  const reasons = [
    { icon: <FileText size={24} />, title: 'Des documents que personne ne lit vraiment', text: "Un PV d'AG peut faire 40 pages. Un règlement de copropriété, 80. Analymo extrait l'essentiel en quelques secondes : travaux votés, finances de l'immeuble, points de vigilance." },
    { icon: <Shield size={24} />, title: 'Achetez sans mauvaise surprise', text: "Les vraies surprises arrivent après la signature : ravalement à 15 000€, fuite en toiture, conflits de copropriété. Analymo les détecte avant que vous signiez." },
    { icon: <Zap size={24} />, title: 'Une IA entraînée sur l\'immobilier', text: "Pas un simple résumé PDF. Analymo comprend le jargon juridique immobilier, les normes de charges, les obligations légales de diagnostic." },
    { icon: <FileSearch size={24} />, title: 'Une clarté que votre notaire n\'a pas le temps de donner', text: "Votre notaire est excellent — mais il ne peut pas vous expliquer chaque ligne. Analymo si. En 2 minutes, pour 4,99€." },
  ];
  return (
    <section id="pourquoi" style={{ padding: '100px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader badge="Pourquoi Analymo ?" title="L'immo, c'est le plus grand achat de votre vie." subtitle="Ne le faites pas les yeux fermés." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, marginTop: 64 }}>
          {reasons.map((r, i) => (
            <div key={i} className="card-hover" style={{ padding: 32, borderRadius: 20, background: i % 2 === 0 ? '#f5f9fb' : 'linear-gradient(135deg, rgba(42,125,156,0.04), rgba(15,45,61,0.02))', border: '1px solid rgba(42,125,156,0.1)' }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 20 }}>{r.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 12, lineHeight: 1.3 }}>{r.title}</h3>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── FOR WHO ─────────────────────────────────────────────── */
function ForWhoSection() {
  const audiences = [
    { icon: <UserCheck size={32} />, title: 'Primo-accédants', subtitle: 'Ceux qui achètent pour la première fois', text: "Vous ne savez pas encore lire un PV d'AG ? C'est normal. Analymo vous dit ce qui compte vraiment, sans jargon.", highlight: true, tag: 'Audience principale' },
    { icon: <Building2 size={32} />, title: 'Investisseurs immobiliers', subtitle: 'Pour analyser vite et bien', text: "Vous étudiez plusieurs biens en parallèle. Analymo vous fait gagner 3h par dossier.", highlight: false, tag: 'Investisseurs' },
    { icon: <BadgeCheck size={32} />, title: 'Notaires & Agents', subtitle: 'Une IA en renfort', text: "Offrez à vos clients un rapport Analymo intégré à votre service. Différenciez-vous.", highlight: false, tag: 'Professionnels' },
    { icon: <Users size={32} />, title: 'Syndics & Gestionnaires', subtitle: 'Volumes importants', text: "Des dizaines de documents à traiter chaque semaine. Notre offre Pro avec API vous permet d'intégrer Analymo.", highlight: false, tag: 'Syndics' },
  ];
  return (
    <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #f5f9fb 0%, #eaf4f8 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader badge="Pour qui ?" title="Analymo, c'est fait pour vous." subtitle="Que vous achetiez votre premier appartement ou que vous gériez un portefeuille immobilier." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, marginTop: 64 }}>
          {audiences.map((a, i) => (
            <div key={i} className="card-hover" style={{ padding: 32, borderRadius: 20, background: '#fff', border: a.highlight ? '2px solid var(--brand-teal)' : '1px solid rgba(42,125,156,0.1)', position: 'relative', boxShadow: a.highlight ? '0 8px 40px rgba(42,125,156,0.12)' : 'none' }}>
              {a.highlight && <div style={{ position: 'absolute', top: -12, left: 24, padding: '4px 14px', borderRadius: 100, background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', color: '#fff', fontSize: 11, fontWeight: 700 }}>★ PRINCIPAL</div>}
              <div style={{ marginBottom: 8, display: 'inline-block', padding: '4px 12px', borderRadius: 6, background: 'rgba(42,125,156,0.08)', fontSize: 11, fontWeight: 600, color: 'var(--brand-teal)' }}>{a.tag}</div>
              <div style={{ color: 'var(--brand-teal)', marginBottom: 16, marginTop: 12 }}>{a.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 6 }}>{a.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--brand-teal)', fontWeight: 600, marginBottom: 14 }}>{a.subtitle}</p>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{a.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── HOW IT WORKS ────────────────────────────────────────── */
function HowItWorksSection() {
  const steps = [
    { number: '01', icon: <Upload size={22} />, title: 'Importez vos documents', text: "Déposez vos PV d'AG, règlements de copropriété, appels de charges, diagnostics DPE, amiante… Formats PDF, Word ou image acceptés." },
    { number: '02', icon: <Search size={22} />, title: 'Analymo traite le dossier', text: "Notre IA lit chaque page, croise les informations, identifie les zones d'attention, les travaux votés et les risques juridiques." },
    { number: '03', icon: <FileText size={22} />, title: 'Recevez votre rapport', text: "Un rapport clair avec scores par catégorie, points de vigilance en rouge, et une recommandation finale." },
    { number: '04', icon: <CheckCircle size={22} />, title: 'Décidez en confiance', text: "Vous avez toutes les cartes en main. Faites votre offre ou évitez une mauvaise affaire à temps." },
  ];
  return (
    <section id="comment" style={{ padding: '100px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader badge="Comment ça marche ?" title="Simple comme 1, 2, 3, 4." subtitle="Pas de formation, pas de jargon. Déposez vos documents, on fait le reste." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 0, marginTop: 64 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ padding: '0 20px', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(42,125,156,0.3)', color: '#fff', position: 'relative' }}>
                {step.icon}
                <span style={{ position: 'absolute', top: -10, right: -8, width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>{step.number}</span>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', marginBottom: 12 }}>{step.title}</h3>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 220, margin: '0 auto' }}>{step.text}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 60 }}>
          <Link to="/tarifs" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 36px', borderRadius: 12, fontSize: 16, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', textDecoration: 'none', boxShadow: '0 8px 32px rgba(42,125,156,0.3)' }}>
            Essayer maintenant — dès 4,99€
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── TESTIMONIALS ────────────────────────────────────────── */
function TestimonialsSection() {
  const testimonials = [
    { name: 'Marie L.', role: 'Primo-accédante, Lyon', initials: 'ML', color: '#2a7d9c', stars: 5, text: "J'avais peur de passer à côté de quelque chose dans le PV d'AG. Analymo m'a dit en 2 minutes qu'il y avait un ravalement prévu à 12 000€ non provisionné. J'ai renégocié le prix à la baisse. Inestimable." },
    { name: 'Thomas R.', role: 'Investisseur, Paris', initials: 'TR', color: '#1a5e78', stars: 5, text: "Je regarde 5 à 10 biens par mois. Avant Analymo, je passais 3h par dossier. Maintenant 15 minutes. Le ROI est évident." },
    { name: 'Sophie D.', role: 'Acheteuse, Bordeaux', initials: 'SD', color: '#0f6e56', stars: 5, text: "Le rapport est clair, bien structuré, avec des scores par catégorie. Mon agent a été impressionné par la qualité de l'analyse." },
    { name: 'Pierre M.', role: 'Gestionnaire, Marseille', initials: 'PM', color: '#5e4a0f', stars: 5, text: "On utilise Analymo pour tous les dossiers de nos clients. Ça nous permet de leur expliquer le bien en 20 minutes au lieu de 2 heures." },
    { name: 'Céline B.', role: 'Première acquisition, Nantes', initials: 'CB', color: '#3b1a5e', stars: 5, text: "Mon notaire m'avait dit de lire le règlement de copropriété moi-même. 80 pages. Analymo l'a digéré en 90 secondes." },
    { name: 'Antoine G.', role: 'Investisseur locatif, Toulouse', initials: 'AG', color: '#5e1a2a', stars: 5, text: "La fonction de comparaison entre 2 biens est bluffante. Analymo a identifié que l'un avait des charges 40% plus élevées." },
  ];
  return (
    <section style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #eaf4f8 0%, #f5f9fb 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <SectionHeader badge="Ils nous font confiance" title="Des acheteurs qui ont vu juste." subtitle="Analymo a déjà aidé des centaines d'acheteurs à prendre de meilleures décisions." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 64 }}>
          {testimonials.map((t, i) => (
            <div key={i} className="card-hover" style={{ padding: 28, borderRadius: 20, background: '#fff', border: '1px solid rgba(42,125,156,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={14} fill="#f0a500" color="#f0a500" />)}
              </div>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>{t.initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-navy)' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 64, padding: '40px 48px', borderRadius: 24, background: 'linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-teal-dark) 100%)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, textAlign: 'center' }}>
          {[{ value: '+200', label: 'analyses réalisées' }, { value: '2 min', label: "temps moyen d'analyse" }, { value: '4,8/5', label: 'satisfaction client' }, { value: '€€€', label: 'économisés en négociation' }].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{stat.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── PRICING ─────────────────────────────────────────────── */
function PricingSection() {
  return (
    <section id="tarifs" style={{ padding: '100px 24px', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
          <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 100, background: 'rgba(42,125,156,0.08)', border: '1px solid rgba(42,125,156,0.2)', fontSize: 13, fontWeight: 700, color: 'var(--brand-teal)', marginBottom: 20 }}>🏷️ Tarification transparente</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: 16, letterSpacing: '-0.02em' }}>Investissez en toute sérénité</h2>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)' }}>Des tarifs simples pour sécuriser votre futur chez-vous.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {PRICING_PLANS.map(plan => (
            <div key={plan.id} className="card-hover" style={{ padding: '32px 28px', borderRadius: 20, background: '#fff', border: plan.highlighted ? '2px solid var(--brand-teal)' : '1px solid rgba(42,125,156,0.12)', position: 'relative', boxShadow: plan.highlighted ? '0 12px 48px rgba(42,125,156,0.15)' : '0 2px 16px rgba(0,0,0,0.04)' }}>
              {plan.badge && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', padding: '5px 16px', borderRadius: 100, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', background: plan.badgeColor === 'teal' ? 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))' : '#f0a500', color: '#fff' }}>{plan.badge}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: plan.highlighted ? 'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))' : 'rgba(42,125,156,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{plan.icon}</div>
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-navy)', textAlign: 'center', marginBottom: 8 }}>{plan.name}</h3>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: 'var(--brand-navy)' }}>{plan.price.toFixed(2).replace('.', ',')}</span>
                <span style={{ fontSize: 18, color: 'var(--text-muted)' }}>€</span>
              </div>
              <div style={{ padding: '12px 16px', borderRadius: 10, background: plan.highlighted ? 'rgba(42,125,156,0.06)' : 'rgba(42,125,156,0.04)', border: `1px solid ${plan.highlighted ? 'rgba(42,125,156,0.2)' : 'rgba(42,125,156,0.1)'}`, marginBottom: 20 }}>
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
              <Link to={`/inscription?plan=${plan.id}`} style={{ display: 'block', width: '100%', padding: '13px 0', borderRadius: 12, fontSize: 15, fontWeight: 700, color: plan.highlighted ? '#fff' : 'var(--brand-navy)', background: plan.highlighted ? 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)' : 'transparent', border: plan.highlighted ? 'none' : '2px solid var(--brand-navy)', textDecoration: 'none', textAlign: 'center', boxShadow: plan.highlighted ? '0 6px 24px rgba(42,125,156,0.3)' : 'none' }}>{plan.cta}</Link>
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
          <Link to="/contact" style={{ padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'var(--brand-navy)', background: '#f0a500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Mail size={16} /> Nous contacter
          </Link>
        </div>
      </div>
    </section>
  );
}
