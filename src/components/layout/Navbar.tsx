import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, LayoutDashboard, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useOrg();

  const toggleMenu = () => setIsOpen(!isOpen);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <nav className="navbar glass fixed top-0 w-full z-50 transition-all duration-300 h-20 flex items-center shadow-lg bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src="/img/logo.png" 
            alt="Unicum Tech Logo" 
            width="40" 
            height="40" 
            className="w-10 h-10 object-contain ring-1 ring-white/20 rounded-lg p-1 group-hover:ring-primary/50 transition-all" 
          />
          <span className="logo font-orbitron text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Unicum Tech
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8">
          <ul className="flex items-center gap-6 font-medium">
            <li><Link to="/" className="hover:text-primary transition-colors">{t('nav.home')}</Link></li>
            <li><a href="/#services" className="hover:text-primary transition-colors">{t('nav.services')}</a></li>
            <li><a href="/#features" className="hover:text-primary transition-colors">{t('nav.features')}</a></li>
            <li><a href="/#contact" className="hover:text-primary transition-colors">{t('nav.contact')}</a></li>
          </ul>

          {/* Controls */}
          <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/20">
            <div className="flex gap-3 bg-white/5 p-1 rounded-lg border border-white/10" role="group" aria-label="Language Selector">
              <button 
                onClick={() => changeLanguage('en')} 
                aria-label="Switch to English"
                className={`px-2 py-1 rounded-md text-sm font-bold transition-all ${i18n.language === 'en' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/10'}`}
              >
                EN
              </button>
              <button 
                onClick={() => changeLanguage('de')} 
                aria-label="Switch to German"
                className={`px-2 py-1 rounded-md text-sm font-bold transition-all ${i18n.language === 'de' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/10'}`}
              >
                DE
              </button>
              <button 
                onClick={() => changeLanguage('ar')} 
                aria-label="Switch to Arabic"
                className={`px-2 py-1 rounded-md text-sm font-bold transition-all ${i18n.language === 'ar' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-white/10'}`}
              >
                AR
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-all" title="Dashboard">
                  <LayoutDashboard size={20} />
                </Link>
                <button 
                  onClick={signOut} 
                  className="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-2 rounded-lg transition-all" 
                  title="Abmelden"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-primary hover:bg-primary/80 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all transform hover:scale-105">
                {t('nav.getStarted')}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Burger */}
        <button 
          className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors" 
          onClick={toggleMenu}
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full glass bg-black/95 p-8 flex flex-col gap-8 clean-fade-in border-b border-white/10 shadow-2xl">
          <ul className="flex flex-col gap-6 text-xl font-bold">
            <li><Link to="/" onClick={toggleMenu} className="hover:text-primary transition-colors flex items-center gap-4">{t('nav.home')}</Link></li>
            {user ? (
              <li><Link to="/dashboard" onClick={toggleMenu} className="hover:text-primary transition-colors flex items-center gap-4">{t('nav.services')}</Link></li>
            ) : (
              <li><Link to="/login" onClick={toggleMenu} className="hover:text-primary transition-colors flex items-center gap-4">{t('nav.getStarted')}</Link></li>
            )}
          </ul>
          <div className="flex justify-between items-center pt-8 border-t border-white/10">
            <div className="flex gap-4">
              <button onClick={() => changeLanguage('en')} className={`text-lg font-bold ${i18n.language === 'en' ? 'text-primary' : ''}`}>EN</button>
              <button onClick={() => changeLanguage('de')} className={`text-lg font-bold ${i18n.language === 'de' ? 'text-primary' : ''}`}>DE</button>
              <button onClick={() => changeLanguage('ar')} className={`text-lg font-bold ${i18n.language === 'ar' ? 'text-primary' : ''}`}>AR</button>
            </div>
            {user && (
              <button onClick={() => { signOut(); toggleMenu(); }} className="text-red-400 font-bold flex items-center gap-2">
                <LogOut size={20} /> {t('nav.signOut') || 'Abmelden'}
              </button>
            )}
            {!user && <Globe className="text-primary w-6 h-6 animate-pulse" />}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
