import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--brand-navy)', color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Logo — complètement séparé, ne fait pas partie de la grille */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 0' }}>
        <img
          src="/logo.png"
          alt="Analymo"
          style={{
            height: 80,
            width: 'auto',
            objectFit: 'contain',
            objectPosition: 'left',
            filter: 'brightness(0) invert(1)',
            display: 'block',
            marginBottom: 32,
          }}
        />
      </div>

      {/* Grille liens — indépendante du logo */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 32, alignItems: 'start' }}>

          {/* Description */}
          <div>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Analymo analyse vos documents immobiliers pour vous aider à acheter en toute sérénité.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 12, marginBottom: 14, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>Produit</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[{ to: '/exemple', l: 'Voir un exemple' }, { to: '/tarifs', l: 'Tarifs' }, { to: '/contact', l: 'Contact' }].map(item => (
                <Link key={item.to} to={item.to} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14 }}>{item.l}</Link>
              ))}
            </div>
          </div>

          {/* Légal */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 12, marginBottom: 14, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>Légal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {['Mentions légales', 'Confidentialité', 'CGV'].map(l => (
                <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14 }}>{l}</a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 12, marginBottom: 14, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="mailto:contact@analymo.fr" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={13} /> contact@analymo.fr
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                <MapPin size={13} /> France
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>© {new Date().getFullYear()} Analymo. Tous droits réservés.</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Outil d'aide à la décision, pas un cabinet de conseil.</p>
        </div>
      </div>

    </footer>
  );
}
