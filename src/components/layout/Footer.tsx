import { useTranslation } from 'react-i18next';
import { Instagram, Github, Facebook, Linkedin } from 'lucide-react';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-black border-t border-white/10 pt-20 pb-10 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img 
                src="/img/logo.png" 
                alt="Unicum Tech Logo" 
                width="40" 
                height="40" 
                className="w-10 h-10 object-contain ring-1 ring-white/10 rounded-lg p-1" 
              />
              <span className="font-orbitron text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                Unicum Tech
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Follow us on Instagram" className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 transition-colors"><Instagram size={20} className="text-gray-300" /></a>
              <a href="#" aria-label="Follow us on Facebook" className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 transition-colors"><Facebook size={20} className="text-gray-300" /></a>
              <a href="#" aria-label="Follow us on Linkedin" className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 transition-colors"><Linkedin size={20} className="text-gray-300" /></a>
              <a href="#" aria-label="View our Github" className="p-2 bg-white/5 rounded-lg hover:bg-primary/20 transition-colors"><Github size={20} className="text-gray-300" /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-orbitron font-bold text-lg mb-6">{t('nav.services')}</h3>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#home" className="hover:text-primary transition-colors">{t('nav.home')}</a></li>
              <li><a href="#services" className="hover:text-primary transition-colors">{t('nav.services')}</a></li>
              <li><a href="#features" className="hover:text-primary transition-colors">{t('nav.features')}</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">{t('nav.contact')}</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-orbitron font-bold text-lg mb-6">{t('footer.legal.title')}</h3>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.legal.imprint')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.legal.privacy')}</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">{t('footer.legal.terms')}</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-orbitron font-bold text-lg mb-6">{t('footer.newsletter.title')}</h3>
            <p className="text-gray-400 text-sm mb-4">{t('footer.newsletter.description')}</p>
            <form className="flex gap-2" aria-label="Subscribe to newsletter">
              <input
                type="email"
                placeholder={t('contact.form.email')}
                aria-label="Email Address"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 w-full focus:border-primary focus:outline-none"
              />
              <button 
                type="submit"
                aria-label="Subscribe"
                className="bg-primary hover:bg-primary/80 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                {t('footer.newsletter.submit')}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-gray-500 text-sm">
          <p>{t('footer.rights', { year: 2025 })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
