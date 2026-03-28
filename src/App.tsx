import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

function SessionManager() {
  useEffect(() => {
    const checkSession = async () => {
      const loginTime = localStorage.getItem('analymo_login_time');
      if (loginTime) {
        const elapsed = Date.now() - parseInt(loginTime);
        if (elapsed > 3600000) {
          localStorage.removeItem('analymo_login_time');
          await supabase.auth.signOut();
        }
      }
    };
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') localStorage.setItem('analymo_login_time', Date.now().toString());
      if (event === 'SIGNED_OUT') localStorage.removeItem('analymo_login_time');
    });
    checkSession();
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionManager />
      <Routes>
        {/* Pages publiques */}
        <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
        <Route path="/tarifs" element={<PublicLayout><TarifsPage /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
        <Route path="/exemple" element={<PublicLayout><ExemplePage /></PublicLayout>} />

        {/* Auth */}
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/inscription" element={<SignupPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/nouvelle-analyse" element={<DashboardPage />} />
        <Route path="/dashboard/analyses" element={<DashboardPage />} />
        <Route path="/dashboard/compare" element={<DashboardPage />} />
        <Route path="/dashboard/compte" element={<DashboardPage />} />
        <Route path="/dashboard/support" element={<DashboardPage />} />
        <Route path="/dashboard/tarifs" element={<DashboardPage />} />

        {/* Rapport — page dédiée */}
        <Route path="/dashboard/rapport" element={<RapportPage />} />

        {/* 404 */}
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
