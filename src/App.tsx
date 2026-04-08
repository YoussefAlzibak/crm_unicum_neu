import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import PublicBooking from './pages/PublicBooking';
import VerifyBooking from './pages/VerifyBooking';
import { Toaster } from 'sonner';
import './i18n';

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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/o/:slug/book" element={<PublicBooking />} />
          <Route path="/verify-booking/:token" element={<VerifyBooking />} />
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default App;
