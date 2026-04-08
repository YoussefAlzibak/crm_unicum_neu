import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Globe, Users, Inbox, Calendar, Layout, Award, Share2 } from 'lucide-react';

const services = [
  {
    icon: Globe,
    image: '/img/service_web.png',
    titleKey: 'services.web.title',
    descKey: 'services.web.description',
    delay: 0.1
  },
  {
    icon: Users,
    image: '/img/service_crm.png',
    titleKey: 'services.crm.title',
    descKey: 'services.crm.description',
    delay: 0.2
  },
  {
    icon: Inbox,
    image: '/img/service_marketing.png',
    titleKey: 'services.inbox.title',
    descKey: 'services.inbox.description',
    delay: 0.3
  },
  {
    icon: Calendar,
    image: '/img/service_web.png',
    titleKey: 'services.booking.title',
    descKey: 'services.booking.description',
    delay: 0.4
  },
  {
    icon: Award,
    image: '/img/service_crm.png',
    titleKey: 'services.print.title',
    descKey: 'services.print.description',
    delay: 0.5
  },
  {
    icon: Layout,
    image: '/img/service_marketing.png',
    titleKey: 'services.memberships.title',
    descKey: 'services.memberships.description',
    delay: 0.6
  },
  {
    icon: Share2,
    image: '/img/service_web.png',
    titleKey: 'services.social.title',
    descKey: 'services.social.description',
    delay: 0.7
  }
];

const ServiceCard = ({ icon: Icon, image, titleKey, descKey, delay }: any) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="service-card glass px-8 pt-8 pb-10 rounded-2xl group hover:border-primary/50 transition-all duration-500 relative overflow-hidden flex flex-col"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {image && (
          <div className="mb-6 h-40 overflow-hidden rounded-xl border border-white/5 relative bg-black/40">
              <img src={image} alt="Service Illustration" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
          </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="service-icon mb-6 relative">
        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <Icon className="text-primary w-8 h-8" />
        </div>
      </div>

      <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
        {t(titleKey)}
      </h3>
      <p className="text-gray-300 leading-relaxed mb-6">
        {t(descKey)}
      </p>

      <button className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-primary transition-colors">
        {t('services.learnMore')}
        <span className="text-lg">→</span>
      </button>
    </motion.div>
  );
};

const Services = () => {
  const { t } = useTranslation();

  return (
    <section id="services" className="py-24 bg-zinc-950 -mt-20 relative z-30 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
      <div className="container mx-auto px-4">
        <header className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold font-orbitron mb-6"
          >
            {t('services.title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 text-lg"
          >
            {t('services.subtitle')}
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard key={index} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
