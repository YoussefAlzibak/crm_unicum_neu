import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const features = [
  {
    titleKey: 'features.reputation.title',
    descriptionKey: 'features.reputation.description',
    pointsKeys: [
      'features.reputation.point1',
      'features.reputation.point2',
      'features.reputation.point3'
    ],
    image: '/img/Zentrale-Berichte.webp',
    reverse: true
  },
  {
    titleKey: 'features.crm.title',
    descriptionKey: 'features.crm.description',
    pointsKeys: [
      'features.crm.point1',
      'features.crm.point2',
      'features.crm.point3'
    ],
    video: '/img/SaaS Demo Video (1).mp4',
    reverse: false
  }
];

const FeatureCard = ({ titleKey, descriptionKey, pointsKeys, image, video, reverse }: any) => {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 py-20`}>
      <motion.div
        initial={{ opacity: 0, x: reverse ? 50 : -50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex-1"
      >
        <h2 className="text-3xl font-bold mb-6 font-orbitron">{t(titleKey)}</h2>
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          {t(descriptionKey)}
        </p>
        <ul className="space-y-4">
          {pointsKeys.map((key: string, idx: number) => (
            <li key={idx} className="flex items-center gap-3 text-gray-300">
              <CheckCircle2 className="text-primary w-5 h-5 flex-shrink-0" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="flex-1 relative"
      >
        <div className="glass rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-white/5 relative aspect-video">
          {video ? (
            <video 
              src={video}
              autoPlay 
              muted 
              loop 
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <img 
              src={image} 
              alt={t(titleKey)} 
              width="800" 
              height="500" 
              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-24 bg-black overflow-hidden">
      <div className="container mx-auto px-4">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </section>
  );
};

export default Features;
