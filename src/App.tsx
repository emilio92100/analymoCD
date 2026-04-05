import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { supabase } from './lib/supabase';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Lazy loading — chaque page est chargée uniquement quand elle est visitée
// Réduit drastiquement le bundle initial → chargement beaucoup plus rapide sur mobile
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const TarifsPage = lazy(() => import('./pages/TarifsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ExemplePage = lazy(() => import('./pages/ExemplePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RapportPage = lazy(() => import('./pages/RapportPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const StartPage = lazy(() => import('./pages/StartPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const MethodePage = lazy(() => import('./pages/MethodePage'));
const ConfidentialitePage = lazy(() => import('./pages/ConfidentialitePage'));
const CGUPage = lazy(() => import('./pages/CGUPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

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
    // Rafraîchir le token automatiquement
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('verimo_login_time');
        localStorage.removeItem('verimo_user_name');
        localStorage.removeItem('verimo_user_email');
        localStorage.removeItem('verimo_free_preview_used');
      }
    });

    // Vérification toutes les 60s — suspension uniquement
    const checkSuspension = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('suspended')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!profile || profile.suspended) {
        localStorage.clear();
        await supabase.auth.signOut();
        window.location.href = '/connexion?suspended=true';
      }
    };

    checkSuspension();
    const interval = setInterval(checkSuspension, 60000);
    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionManager />
      <ScrollToTop />
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f8fafc' }} />}>
        <Routes>
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/tarifs" element={<PublicLayout><TarifsPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
          <Route path="/exemple" element={<PublicLayout><ExemplePage /></PublicLayout>} />
          <Route path="/methode" element={<PublicLayout><MethodePage /></PublicLayout>} />
          <Route path="/confidentialite" element={<PublicLayout><ConfidentialitePage /></PublicLayout>} />
          <Route path="/cgu" element={<PublicLayout><CGUPage /></PublicLayout>} />
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
      </Suspense>
    </BrowserRouter>
  );
}
