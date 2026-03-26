"use client";
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight } from 'lucide-react';

const navLinks = [
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
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  if (isDashboard) return null;

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(248,250,252,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(42,125,156,0.1)' : 'none',
    }}>
      <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/">
          <img src="/logo.png" alt="Analymo" style={{ height: 38, objectFit: 'contain' }} />
        </Link>

        <div className="nav-d" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: '#4a6b7c', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="nav-d" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/connexion" style={{ padding: '9px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#2a7d9c', border: '1.5px solid rgba(42,125,156,0.25)', textDecoration: 'none', background: 'rgba(42,125,156,0.04)' }}>
            Connexion
          </Link>
          <Link to="/inscription" style={{ padding: '9px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(42,125,156,0.28)' }}>
            Commencer <ChevronRight size={15} />
          </Link>
        </div>

        <button className="nav-m" onClick={() => setOpen(!open)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f2d3d', padding: 6, display: 'none' }}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="nav-m" style={{ background: 'rgba(248,250,252,0.98)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(42,125,156,0.08)', padding: '12px 28px 20px' }}>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} style={{ display: 'block', padding: '11px 0', fontSize: 16, fontWeight: 500, color: '#0f2d3d', textDecoration: 'none', borderBottom: '1px solid rgba(42,125,156,0.07)' }}>
              {l.label}
            </Link>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
            <Link to="/connexion" onClick={() => setOpen(false)} style={{ padding: '12px 0', textAlign: 'center', borderRadius: 10, fontSize: 15, fontWeight: 600, color: '#2a7d9c', border: '1.5px solid rgba(42,125,156,0.25)', textDecoration: 'none' }}>Connexion</Link>
            <Link to="/inscription" onClick={() => setOpen(false)} style={{ padding: '13px 0', textAlign: 'center', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#2a7d9c,#0f2d3d)', textDecoration: 'none' }}>Commencer</Link>
          </div>
        </div>
      )}
      <style>{`@media(min-width:768px){.nav-d{display:flex!important}.nav-m{display:none!important}}@media(max-width:767px){.nav-d{display:none!important}.nav-m{display:flex!important}}`}</style>
    </header>
  );
}
