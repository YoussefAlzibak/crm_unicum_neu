import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { Toaster } from 'sonner';
import './i18n';

const Home = lazy(() => import('./pages/Home'));
const LoginForm = lazy(() => import('./components/auth/LoginForm'));
const RegisterForm = lazy(() => import('./components/auth/RegisterForm'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PublicBooking = lazy(() => import('./pages/PublicBooking'));
const VerifyBooking = lazy(() => import('./pages/VerifyBooking'));

function App() {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n.language, i18n]);

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white transition-colors duration-300">
      <Toaster position="top-right" richColors theme="dark" />
      {!isDashboard && <Navbar />}
      <main>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/o/:slug/book" element={<PublicBooking />} />
            <Route path="/verify-booking/:token" element={<VerifyBooking />} />
          </Routes>
        </Suspense>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default App;
