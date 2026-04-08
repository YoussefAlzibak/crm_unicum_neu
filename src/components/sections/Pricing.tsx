import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const { t } = useTranslation();

  const plans = [
    {
      id: 'free',
      name: t('pricing.plans.free.name'),
      price: '0',
      icon: Zap,
      features: [
        t('pricing.plans.free.feat1'),
        t('pricing.plans.free.feat2'),
        t('pricing.plans.free.feat3'),
        'Basic Dashboard'
      ],
      cta: t('pricing.plans.free.cta'),
      highlight: false
    },
    {
      id: 'pro',
      name: t('pricing.plans.pro.name'),
      price: '49',
      icon: Crown,
      features: [
        t('pricing.plans.pro.feat1'),
        t('pricing.plans.pro.feat2'),
        t('pricing.plans.pro.feat3'),
        'KI-Support & Automatisierung',
        'Zentrale Inbox'
      ],
      cta: t('pricing.plans.pro.cta'),
      highlight: true
    },
    {
      id: 'enterprise',
      name: t('pricing.plans.enterprise.name'),
      price: '199',
      icon: ShieldCheck,
      features: [
        t('pricing.plans.enterprise.feat1'),
        t('pricing.plans.enterprise.feat2'),
        t('pricing.plans.enterprise.feat3'),
        'Dedicated Manager',
        'Custom API Integration'
      ],
      cta: t('pricing.plans.enterprise.cta'),
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold font-orbitron mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent"
          >
            {t('pricing.title')}
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            {t('pricing.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative glass p-8 rounded-[2.5rem] border ${plan.highlight ? 'border-primary shadow-2xl shadow-primary/20 bg-primary/5' : 'border-white/10 hover:border-white/20'} transition-all group overflow-hidden`}
            >
              {plan.highlight && (
                <div className="absolute top-0 right-0 py-1.5 px-4 bg-primary text-[10px] font-black uppercase tracking-widest text-white rounded-bl-2xl">
                    Empfohlen
                </div>
              )}

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${plan.highlight ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                <plan.icon size={28} />
              </div>

              <h3 className="text-xl font-bold font-orbitron mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold font-orbitron">€{plan.price}</span>
                <span className="text-gray-500 text-sm">/Monat</span>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check size={16} className={plan.highlight ? 'text-primary' : 'text-green-500'} />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link 
                to="/register"
                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center transition-all ${plan.highlight ? 'bg-primary hover:bg-primary/80 text-white shadow-lg shadow-primary/30' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
