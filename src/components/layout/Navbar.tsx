import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';

const navLinks = [
  { to: '/#pourquoi', label: 'Pourquoi Analymo' },
  { to: '/#comment', label: 'Comment ça marche' },
  { to: '/exemple', label: 'Exemple' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isDashboard) return null;

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(245,249,251,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(42,125,156,0.12)' : 'none',
    }}>
      <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Analymo" style={{ height: 40, objectFit: 'contain' }} />
        </Link>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="nav-desktop">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="nav-desktop">
          <Link to="/connexion" style={{ padding: '9px 20px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: 'var(--brand-teal)', border: '1.5px solid rgba(42,125,156,0.3)', textDecoration: 'none' }}>
            Connexion
          </Link>
          <Link to="/inscription" style={{ padding: '9px 22px', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 20px rgba(42,125,156,0.3)' }}>
            Commencer <ChevronRight size={16} />
          </Link>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="nav-mobile" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: 'var(--brand-navy)' }}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="nav-mobile" style={{ background: 'rgba(245,249,251,0.98)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(42,125,156,0.1)', padding: '16px 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setOpen(false)} style={{ padding: '12px 16px', borderRadius: 10, fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
            <div style={{ height: 1, background: 'rgba(42,125,156,0.1)', margin: '8px 0' }} />
            <Link to="/connexion" onClick={() => setOpen(false)} style={{ padding: '12px 16px', borderRadius: 10, fontSize: 16, fontWeight: 500, color: 'var(--brand-teal)', textDecoration: 'none', border: '1.5px solid rgba(42,125,156,0.25)', textAlign: 'center' }}>
              Connexion
            </Link>
            <Link to="/inscription" onClick={() => setOpen(false)} style={{ padding: '14px 16px', borderRadius: 10, fontSize: 16, fontWeight: 600, color: '#fff', background: 'linear-gradient(135deg, var(--brand-teal) 0%, var(--brand-navy) 100%)', textDecoration: 'none', textAlign: 'center', marginTop: 4 }}>
              Commencer
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .nav-desktop { display: flex !important; } .nav-mobile { display: none !important; } }
        @media (max-width: 767px) { .nav-desktop { display: none !important; } .nav-mobile { display: flex !important; } }
      `}</style>
    </header>
  );
}
