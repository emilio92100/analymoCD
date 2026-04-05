import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from './lib/supabase';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TarifsPage from './pages/TarifsPage';
import ContactPage from './pages/ContactPage';
import ExemplePage from './pages/ExemplePage';
import DashboardPage from './pages/DashboardPage';
import RapportPage from './pages/RapportPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import StartPage from './pages/StartPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import MethodePage from './pages/MethodePage';
import AdminPage from './pages/AdminPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (<><Navbar />{children}<Footer /></>);
}

function SessionManager() {
  useEffect(() => {

    // Synchroniser le profil dans localStorage depuis Supabase
    const syncProfile = async (userId: string, name?: string, email?: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('suspended, free_preview_used, credits_document, credits_complete')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) return;
      if (profile.suspended) {
        await supabase.auth.signOut();
        window.location.href = '/connexion?suspended=true';
        return;
      }

      // Sync free_preview_used dans les deux sens
      if (profile.free_preview_used) {
        localStorage.setItem('verimo_free_preview_used', 'true');
      } else {
        localStorage.removeItem('verimo_free_preview_used');
      }

      // Si crédits > 0 → marquer offre gratuite comme utilisée
      if ((profile.credits_document > 0 || profile.credits_complete > 0) && !profile.free_preview_used) {
        await supabase.from('profiles').update({ free_preview_used: true }).eq('id', userId);
        localStorage.setItem('verimo_free_preview_used', 'true');
      }

      if (name) localStorage.setItem('verimo_user_name', name);
      if (email) localStorage.setItem('verimo_user_email', email);
    };

    // Vérification périodique toutes les 60s (suspension/expiration uniquement)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const loginTime = localStorage.getItem('verimo_login_time');
      if (loginTime && Date.now() - parseInt(loginTime) > 3600000) {
        await supabase.auth.signOut();
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('suspended')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile) { await supabase.auth.signOut(); return; }
      if (profile.suspended) {
        await supabase.auth.signOut();
        window.location.href = '/connexion?suspended=true';
      }
    };

    // Écouter les changements d'auth — UNIQUEMENT pour sync, pas pour rediriger
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        localStorage.setItem('verimo_login_time', Date.now().toString());
        const n = session.user.user_metadata?.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || 'Utilisateur';
        await syncProfile(session.user.id, n, session.user.email || '');
      }
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('verimo_login_time');
        localStorage.removeItem('verimo_user_name');
        localStorage.removeItem('verimo_user_email');
        localStorage.removeItem('verimo_free_preview_used');
      }
    });

    checkSession();
    const interval = setInterval(checkSession, 60000);
    return () => { subscription.unsubscribe(); clearInterval(interval); };
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionManager />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/tarifs" element={<PublicLayout><TarifsPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
        <Route path="/exemple" element={<PublicLayout><ExemplePage /></PublicLayout>} />
        <Route path="/methode" element={<PublicLayout><MethodePage /></PublicLayout>} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/start" element={<StartPage />} />
        <Route path="/inscription" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/nouvelle-analyse" element={<DashboardPage />} />
        <Route path="/dashboard/analyses" element={<DashboardPage />} />
        <Route path="/dashboard/compare" element={<DashboardPage />} />
        <Route path="/dashboard/compte" element={<DashboardPage />} />
        <Route path="/dashboard/support" element={<DashboardPage />} />
        <Route path="/dashboard/tarifs" element={<DashboardPage />} />
        <Route path="/dashboard/rapport" element={<RapportPage />} />
        <Route path="*" element={
          <PublicLayout>
            <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingTop:80 }}>
              <div style={{ fontSize:80, marginBottom:24 }}>🏠</div>
              <h1 style={{ fontSize:32, fontWeight:800, color:'var(--brand-navy)', marginBottom:12 }}>Page introuvable</h1>
              <p style={{ fontSize:16, color:'var(--text-secondary)', marginBottom:32 }}>Cette page n'existe pas.</p>
              <a href="/" style={{ padding:'13px 28px', borderRadius:12, background:'linear-gradient(135deg, var(--brand-teal), var(--brand-navy))', color:'#fff', textDecoration:'none', fontWeight:700, fontSize:15 }}>Retour à l'accueil</a>
            </div>
          </PublicLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}
