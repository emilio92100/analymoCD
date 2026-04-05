import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const navLinks = [
  { to: '/', label: 'Accueil' },
  { to: '/methode', label: 'Notre méthode' },
  { to: '/exemple', label: 'Exemple' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { setOpen(false); setUserMenuOpen(false); }, [location]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  if (isDashboard) return null;

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}>
        <div className="max-w-5xl mx-auto px-4">
          <nav className={`flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 ${
            scrolled
              ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-slate-900/8 border border-slate-200/60'
              : 'bg-white/70 backdrop-blur-md border border-slate-200/40 shadow-sm'
          }`}>

            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              <img src="/logo.png" alt="Verimo" className="h-14 object-contain" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1 relative">
              {navLinks.map(l => {
                const active = location.pathname === l.to;
                return (
                  <Link key={l.to} to={l.to}
                    className="relative px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 z-10"
                    style={{ color: active ? '#fff' : '#64748b' }}>
                    {active && (
                      <motion.span layoutId="nav-pill"
                        className="absolute inset-0 rounded-xl bg-[#0f2d3d]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                    )}
                    <span className="relative z-10">{l.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth desktop */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-px h-5 bg-slate-200 mx-1" />
              {user ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#0f2d3d] hover:bg-[#0f2d3d]/90 transition-all duration-200 shadow-sm">
                    <User size={15} />
                    Mon espace
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(15,45,61,0.12)', border: '1px solid rgba(42,125,156,0.1)', minWidth: 180, overflow: 'hidden', zIndex: 200 }}>
                        <Link to="/dashboard"
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#0f2d3d', textDecoration: 'none' }}
                          className="hover:bg-slate-50 transition-colors">
                          <User size={15} /> Mon dashboard
                        </Link>
                        <div style={{ height: 1, background: '#e2e8f0', margin: '0 12px' }} />
                        <button onClick={handleLogout}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                          className="hover:bg-red-50 transition-colors">
                          <LogOut size={15} /> Se déconnecter
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/connexion"
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      location.pathname === '/connexion'
                        ? 'text-[#2a7d9c] bg-[#2a7d9c]/8'
                        : 'text-slate-500 hover:text-[#0f172a] hover:bg-slate-100/80'
                    }`}>
                    Connexion
                  </Link>
                  <Link to="/inscription"
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[#0f2d3d] hover:bg-[#0f2d3d]/90 hover:-translate-y-px shadow-sm hover:shadow-md transition-all duration-200">
                    S'inscrire
                  </Link>
                </>
              )}
            </div>

            {/* Burger mobile */}
            <button onClick={() => setOpen(!open)} className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile menu — compact blanc épuré */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99] md:hidden"
            onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-4 right-4 bg-white rounded-b-2xl rounded-t-none shadow-xl border border-slate-100 border-t-0 overflow-hidden"
              style={{ top: '68px' }}
              onClick={e => e.stopPropagation()}>

              {/* Petite ligne de raccordement visuel */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent)' }} />

              {/* Liens nav */}
              <div className="px-2.5 pt-3 pb-1">
                {navLinks.map((l) => {
                  const active = location.pathname === l.to;
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5"
                      style={{
                        background: active ? '#f0f7fb' : 'transparent',
                        color: active ? '#2a7d9c' : '#64748b',
                        fontWeight: active ? 700 : 500,
                      }}>
                      {l.label}
                      {active && (
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2a7d9c', display: 'inline-block', flexShrink: 0 }} />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="px-2.5 pb-3 pt-2 border-t border-slate-100 flex gap-2">
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: '#2a7d9c' }}>
                      Mon espace
                    </Link>
                    <button onClick={() => { handleLogout(); setOpen(false); }}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-100 transition-all">
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/connexion" onClick={() => setOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 transition-all">
                      Connexion
                    </Link>
                    <Link to="/inscription" onClick={() => setOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: '#2a7d9c' }}>
                      S'inscrire
                    </Link>
                  </>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
