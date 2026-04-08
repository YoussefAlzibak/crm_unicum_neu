import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { CreditCard, Check, Zap, Crown, Shield, FileText, ArrowRight, Loader2, Users, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlanLimits } from '../../hooks/usePlanLimits';

interface Subscription {
  id?: string;
  plan_name: 'free' | 'pro' | 'enterprise';
  status: string;
  current_period_end: string | null;
}

const PLANS = [
  {
    name: 'free',
    label: 'Starter',
    price: '€0',
    description: 'Perfekt für den Einstieg.',
    features: ['Bis zu 50 Kontakte', 'Standard CRM', 'Community Support'],
    icon: Zap,
    color: 'text-gray-400',
    border: 'border-white/10'
  },
  {
    name: 'pro',
    label: 'Professional',
    price: '€49',
    description: 'Für wachsende Unternehmen.',
    features: ['Unbegrenzte Kontakte', 'KI-Assistenz (Gemini)', 'Auto-Marketing', 'Prio Support'],
    icon: Crown,
    color: 'text-primary',
    border: 'border-primary/50',
    popular: true
  },
  {
    name: 'enterprise',
    label: 'Enterprise',
    price: 'Individuell',
    description: 'Für höchste Ansprüche.',
    features: ['Eigener Server', 'Account Manager', 'SLA Garantien', 'Audit-Logs'],
    icon: Shield,
    color: 'text-indigo-400',
    border: 'border-indigo-500/30'
  }
];

const BillingView = () => {
  const { currentOrg } = useOrg();
  const { usage, limits, refreshUsage } = usePlanLimits();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  
  
  // Checkout Modal State
  const [checkoutPlan, setCheckoutPlan] = useState<typeof PLANS[0] | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(0); // 0: init, 1: processing, 2: success

  useEffect(() => {
    if (currentOrg) fetchSubscription();
  }, [currentOrg]);

  const fetchSubscription = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', currentOrg?.id)
      .single();
    
    if (data) setSubscription(data);
    else setSubscription({ plan_name: 'free', status: 'active', current_period_end: null });
  };

  const handleUpgrade = async (plan: typeof PLANS[0]) => {
    if (!currentOrg) return;
    setCheckoutPlan(plan);
    setCheckoutStep(0);
    
    // Simulate checkout flow
    setTimeout(() => setCheckoutStep(1), 1500); 
    setTimeout(async () => {
      // Create/Update in DB
      if (subscription?.id) {
        await supabase.from('subscriptions').update({ 
          plan_name: plan.name,
          updated_at: new Date().toISOString()
        }).eq('id', subscription.id);
      } else {
        await supabase.from('subscriptions').insert({ 
          org_id: currentOrg.id, 
          plan_name: plan.name 
        });
      }
      
      await fetchSubscription();
      await refreshUsage();
      
      setCheckoutStep(2); 
      setTimeout(() => setCheckoutPlan(null), 2500);
    }, 4000);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold font-orbitron">Abonnement & Abrechnung</h2>
          <p className="text-sm text-gray-500">Verwalten Sie Ihre Pläne und Zahlungsmethoden.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass p-4 rounded-2xl border border-white/10 flex items-center gap-4 shadow-lg">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Kontakte</p>
              <p className="font-orbitron font-bold">
                {usage?.contact_count || 0} / {limits.contacts >= 100000 ? '∞' : limits.contacts}
              </p>
            </div>
          </div>
          <div className="glass p-4 rounded-2xl border border-white/10 flex items-center gap-4 shadow-lg">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Mails (30tg)</p>
              <p className="font-orbitron font-bold">
                {usage?.emails_sent_30d || 0} / {limits.emails_per_month >= 100000 ? '∞' : limits.emails_per_month}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <motion.div
            key={plan.name}
            whileHover={{ y: subscription?.plan_name === plan.name ? 0 : -8 }}
            className={`relative glass p-8 rounded-[2.5rem] border ${plan.border} flex flex-col h-full bg-gradient-to-b from-white/[0.02] to-transparent overflow-hidden ${subscription?.plan_name === plan.name ? 'opacity-80 scale-95 origin-bottom' : ''}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 py-1.5 px-6 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-2xl shadow-lg shadow-primary/20">
                Am Beliebtesten
              </div>
            )}
            {subscription?.plan_name === plan.name && (
              <div className="absolute top-0 right-0 py-1.5 px-6 bg-green-500/20 text-green-400 border-b border-l border-green-500/20 text-[10px] font-bold uppercase tracking-widest rounded-bl-2xl backdrop-blur-md">
                Ihr aktueller Plan
              </div>
            )}

            <div className="mb-8 mt-2">
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 ${plan.color}`}>
                <plan.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold font-orbitron capitalize mb-2">{plan.label}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold font-orbitron">{plan.price}</span>
                {plan.name !== 'enterprise' && <span className="text-gray-600 text-sm">/ monat</span>}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{plan.description}</p>
            </div>

            <div className="space-y-4 mb-12 flex-1">
              <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Inbegriffen:</p>
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 p-0.5 bg-green-500/20 rounded-full text-green-400">
                    <Check size={12} />
                  </div>
                  <span className="text-xs text-gray-300 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleUpgrade(plan)}
              disabled={subscription?.plan_name === plan.name}
              className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                subscription?.plan_name === plan.name 
                ? 'bg-white/5 text-gray-400 border border-white/10 cursor-default' 
                : 'bg-primary hover:bg-primary/80 text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95'
              }`}
            >
              {subscription?.plan_name === plan.name ? 'Aktiviert' : 'Jetzt auswählen'}
              {subscription?.plan_name !== plan.name && <ArrowRight size={16}/>}
            </button>
          </motion.div>
        ))}
      </div>

      {/* History & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-3xl border border-white/10 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold font-orbitron flex items-center gap-2">
              <FileText className="text-primary" size={24} /> Rechnungsverlauf
            </h3>
            <button className="text-xs font-bold text-primary hover:underline">Alle ansehen</button>
          </div>
          <div className="divide-y divide-white/5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-4 flex justify-between items-center group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <FileText size={18} className="text-gray-500 group-hover:text-primary"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold">Rechnung #UT-2024-{i}</p>
                    <p className="text-[10px] text-gray-500">1. {i}. 2024</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">€49.00</p>
                  <p className="text-[10px] text-green-400 font-bold uppercase">Bezahlt</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/5 to-transparent space-y-6">
          <h3 className="text-xl font-bold font-orbitron flex items-center gap-2">
            <CreditCard className="text-primary" size={24} /> Zahlungsmethode
          </h3>
          
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-10 bg-black/40 rounded border border-white/10 flex items-center justify-center text-xs font-bold font-mono">VISA</div>
                <div>
                  <p className="text-sm font-bold">Visa •••• 4242</p>
                  <p className="text-[10px] text-gray-500">Läuft ab 12/26</p>
                </div>
              </div>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded font-bold uppercase">Standard</span>
            </div>
            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold border border-white/10 transition-all">
              Zahlungsdaten verwalten
            </button>
          </div>

          <div className="p-6 border border-white/10 rounded-2xl border-dashed">
            <p className="text-xs text-gray-500 leading-relaxed mb-4">Sicherheit an erster Stelle: Alle Zahlungen werden sicher über <b>Stripe</b> abgewickelt. Wir speichern keine Kreditkartendaten auf unseren Servern.</p>
            <div className="flex gap-4 grayscale opacity-30 group hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
              <span className="text-xs font-black italic">Stripe</span>
              <span className="text-xs font-black italic">MasterCard</span>
              <span className="text-xs font-black italic">GPAY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Checkout Simulation Modal */}
      <AnimatePresence>
        {checkoutPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              {checkoutStep === 0 && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                    <checkoutPlan.icon size={32} className={checkoutPlan.color.replace('text-', 'text-')} />
                  </div>
                  <h3 className="text-xl font-bold font-orbitron">Wechsel zu {checkoutPlan.label}</h3>
                  <p className="text-gray-500 text-sm">Bereite Stripe Checkout vor...</p>
                  <Loader2 className="animate-spin text-primary mx-auto mt-4" size={24} />
                </div>
              )}
              
              {checkoutStep === 1 && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                    <CreditCard size={32} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold font-orbitron">Zahlung wird verarbeitet</h3>
                  <p className="text-gray-500 text-sm">Bitte schließen Sie dieses Fenster nicht.</p>
                  <div className="w-48 h-1 bg-white/10 rounded-full mx-auto mt-4 overflow-hidden relative">
                    <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="absolute inset-0 bg-primary/80" />
                  </div>
                </div>
              )}

              {checkoutStep === 2 && (
                <div className="text-center py-6 space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                    <Check size={40} className="text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-bold font-orbitron text-green-400">Erfolgreich!</h3>
                  <p className="text-gray-400 text-sm">Ihr Abonnement wurde auf {checkoutPlan.label} aktualisiert. Willkommen in der Zukunft!</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillingView;
