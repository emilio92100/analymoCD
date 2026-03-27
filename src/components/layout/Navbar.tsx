import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { to: '/', label: 'Accueil' },
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
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  if (isDashboard) return null;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
        <div className={`max-w-5xl mx-auto px-4 transition-all duration-300 ${scrolled ? 'px-3' : 'px-4'}`}>
          <nav className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
            scrolled
              ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-slate-900/8 border border-slate-200/60'
              : 'bg-white/70 backdrop-blur-md border border-slate-200/40 shadow-sm'
          }`}>

            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              <img src="/logo.png" alt="Analymo" className="h-14 object-contain" />
            </Link>

            {/* Desktop nav links — pill style */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(l => {
                const active = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'text-[#2a7d9c] bg-[#2a7d9c]/10 font-semibold'
                        : 'text-slate-500 hover:text-[#0f172a] hover:bg-slate-100/80'
                    }`}
                  >
                    {l.label}
                    {active && (
                      <span className="absolute -bottom-0.5 left-3 right-3 h-[2px] rounded-full bg-[#2a7d9c]" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right: auth buttons */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-px h-5 bg-slate-200 mx-1" />
              <Link to="/connexion"
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  location.pathname === '/connexion'
                    ? 'text-[#2a7d9c] bg-[#2a7d9c]/8'
                    : 'text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/80'
                }`}>
                Connexion
              </Link>
              <Link to="/inscription"
                className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[#0f2d3d] hover:bg-[#0f2d3d]/90 hover:-translate-y-px shadow-sm hover:shadow-md transition-all duration-200">
                S'inscrire
              </Link>
            </div>

            {/* Mobile burger */}
            <button onClick={() => setOpen(!open)} className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-[99] md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="absolute top-[72px] left-4 right-4 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-3">
              {navLinks.map(l => {
                const active = location.pathname === l.to;
                return (
                  <Link key={l.to} to={l.to}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active ? 'text-[#2a7d9c] bg-[#2a7d9c]/8 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}>
                    {l.label}
                    {active && <span className="ml-auto w-2 h-2 rounded-full bg-[#2a7d9c]" />}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-slate-100 p-3 flex flex-col gap-2">
              <Link to="/connexion" className="text-center py-3 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors">Connexion</Link>
              <Link to="/inscription" className="text-center py-3 rounded-xl text-sm font-bold text-white bg-[#0f2d3d] hover:bg-[#0f2d3d]/90 transition-colors">S'inscrire</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
