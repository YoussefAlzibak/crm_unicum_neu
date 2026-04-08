import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Globe } from 'lucide-react';

const Hero = () => {
  const { t } = useTranslation();

  return (
    <header id="home" className="relative h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Video Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10 backdrop-blur-[2px]"></div>
      
      {/* Background Image */}
      <img
        src="/img/hero_bg.png"
        alt="Futuristic Tech Background"
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />

      <div className="container mx-auto px-4 relative z-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary/20 border border-primary/30 backdrop-blur-md">
            <span className="text-sm font-bold text-primary-foreground tracking-wider uppercase">
              {t('hero.badge')}
            </span>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold font-orbitron mb-6 leading-tight">
            {t('hero.title')}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-10 font-changa max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <ShieldCheck className="text-primary w-5 h-5" />
              <span className="text-sm font-medium">{t('hero.gdpr_status')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <Lock className="text-primary w-5 h-5" />
              <span className="text-sm font-medium">End-to-End Secure</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
              <Globe className="text-primary w-5 h-5" />
              <span className="text-sm font-medium">Global Reach</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#contact" className="bg-primary hover:bg-primary/80 text-white px-10 py-4 rounded-xl font-bold transition-all transform hover:scale-105 shadow-xl shadow-primary/40 flex items-center justify-center">
              {t('hero.cta_primary')}
            </a>
            <a href="#services" className="bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-xl font-bold border border-white/10 transition-all backdrop-blur-xl flex items-center justify-center">
              {t('hero.cta_secondary')}
            </a>
          </div>
        </motion.div>
      </div>

      {/* Decorative Overlap Shape */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-zinc-950 to-transparent z-20"></div>
    </header>
  );
};

export default Hero;
