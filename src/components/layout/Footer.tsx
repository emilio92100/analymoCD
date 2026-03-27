import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--brand-navy)', color: 'rgba(255,255,255,0.7)', padding: '64px 24px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 48 }}>
          <div>
            <img src="/logo.png" alt="Analymo" style={{ height: 200, objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: 16 }} />
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', maxWidth: 280 }}>
              Analymo analyse vos documents immobiliers grâce à l'IA pour vous aider à acheter en toute sérénité.
            </p>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 20 }}>Produit</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ to: '/#pourquoi', l: 'Pourquoi Analymo' }, { to: '/exemple', l: 'Voir un exemple' }, { to: '/tarifs', l: 'Tarifs' }].map(item => (
                <Link key={item.to} to={item.to} style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14 }}>{item.l}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 20 }}>Légal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Mentions légales', 'Confidentialité', 'CGV'].map(l => (
                <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14 }}>{l}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 20 }}>Contact</h4>
            <a href="mailto:contact@analymo.fr" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Mail size={14} /> contact@analymo.fr
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
              <MapPin size={14} /> France
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>© {new Date().getFullYear()} Analymo. Tous droits réservés.</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Analymo est un outil d'aide à la décision, pas un cabinet de conseil.</p>
        </div>
      </div>
    </footer>
  );
}
