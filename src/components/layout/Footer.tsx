import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--brand-navy)', color: 'rgba(255,255,255,0.7)', padding: '56px 24px 28px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40, alignItems: 'start' }}>

          {/* Col 1 — Logo + description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <img
              src="/logo.png"
              alt="Analymo"
              style={{ height: 48, width: 'auto', objectFit: 'contain', objectPosition: 'left', filter: 'brightness(0) invert(1)' }}
            />
            <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.45)', maxWidth: 260, margin: 0 }}>
              Analymo analyse vos documents immobiliers pour vous aider à acheter en toute sérénité.
            </p>
          </div>

          {/* Col 2 — Produit */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>Produit</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ to: '/exemple', l: 'Voir un exemple' }, { to: '/tarifs', l: 'Tarifs' }, { to: '/contact', l: 'Contact' }].map(item => (
                <Link key={item.to} to={item.to} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}>
                  {item.l}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 3 — Légal */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>Légal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Mentions légales', 'Confidentialité', 'CGV'].map(l => (
                <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}>
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="mailto:contact@analymo.fr" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'}>
                <Mail size={13} /> contact@analymo.fr
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                <MapPin size={13} /> France
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>© {new Date().getFullYear()} Analymo. Tous droits réservés.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Analymo est un outil d'aide à la décision, pas un cabinet de conseil.</p>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
