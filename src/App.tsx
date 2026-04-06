import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import React, { useEffect, lazy, Suspense, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
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
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// ─── Écran de chargement premium ─────────────────────────────
function LoadingScreen() {
  const [seconds, setSeconds] = React.useState(0);
  const [autoRetried, setAutoRetried] = React.useState(false);
  const [showButton, setShowButton] = React.useState(false);
  const [showHome, setShowHome] = React.useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => {
        const next = s + 1;
        // Après 8s : rechargement automatique silencieux (1 fois)
        if (next === 8 && !autoRetried) {
          setAutoRetried(true);
          window.location.reload();
        }
        // Après 12s : afficher bouton rafraîchir
        if (next >= 12) setShowButton(true);
        // Après 20s : afficher bouton retour accueil
        if (next >= 20) setShowHome(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRetried]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Logo */}
      <div style={{ marginBottom: 32 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect width="44" height="44" rx="12" fill="#2a7d9c"/>
          <path d="M22 10L34 18V26L22 34L10 26V18L22 10Z" fill="white" fillOpacity="0.9"/>
          <path d="M22 16L29 20.5V29.5L22 34L15 29.5V20.5L22 16Z" fill="#2a7d9c"/>
          <text x="22" y="27" textAnchor="middle" fontSize="10" fontWeight="800" fill="white">V</text>
        </svg>
      </div>

      {/* Spinner */}
      <div style={{ position: 'relative', width: 56, height: 56, marginBottom: 28 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #e2e8f0' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#2a7d9c', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Chargement en cours…</h2>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 32, textAlign: 'center', maxWidth: 280, lineHeight: 1.6 }}>
        {seconds < 8 ? 'Préparation de votre espace Verimo…' : 'Cela prend un peu plus de temps que prévu…'}
      </p>

      {/* Bouton rafraîchir */}
      {showButton && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, animation: 'fadeIn 0.3s ease' }}>
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <button onClick={() => window.location.reload()}
            style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(42,125,156,0.25)' }}>
            Rafraîchir la page
          </button>
          {showHome && (
            <a href="/"
              style={{ padding: '10px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', textAlign: 'center' }}>
              Revenir à l'accueil
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Error Boundary — capture les erreurs silencieuses ────────
interface EBState { hasError: boolean; retried: boolean; }
class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, retried: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Verimo Error Boundary:', error, info);
  }
  handleRetry = () => {
    if (!this.state.retried) {
      this.setState({ hasError: false, retried: true });
      window.location.reload();
    } else {
      this.setState({ hasError: false });
    }
  };
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          <div style={{ fontSize: 52, marginBottom: 20 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' }}>Une erreur est survenue</h2>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, textAlign: 'center', maxWidth: 320, lineHeight: 1.6 }}>
            {this.state.retried
              ? "Le problème persiste. Revenez à l'accueil pour repartir de zéro."
              : "Ne vous inquiétez pas, vos données sont intactes. Essayez de rafraîchir la page."}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <button onClick={this.handleRetry}
              style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #2a7d9c, #0f2d3d)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(42,125,156,0.25)' }}>
              {this.state.retried ? 'Réessayer' : 'Rafraîchir la page'}
            </button>
            <a href="/"
              style={{ padding: '10px 24px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Revenir à l'accueil
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
      <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/tarifs" element={<PublicLayout><TarifsPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
          <Route path="/exemple" element={<PublicLayout><ExemplePage /></PublicLayout>} />
          <Route path="/methode" element={<PublicLayout><MethodePage /></PublicLayout>} />
          <Route path="/confidentialite" element={<PublicLayout><ConfidentialitePage /></PublicLayout>} />
          <Route path="/cgu" element={<PublicLayout><CGUPage /></PublicLayout>} />
          <Route path="/mentions-legales" element={<PublicLayout><MentionsLegalesPage /></PublicLayout>} />
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
      </ErrorBoundary>
    </BrowserRouter>
  );
}
