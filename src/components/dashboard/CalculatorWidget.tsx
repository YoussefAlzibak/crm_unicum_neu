import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calculator, ChevronRight, Loader2, CheckCircle, User, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CalcOption {
  label: string;
  price_impact: number;
  impact_type: 'fixed' | 'percentage';
}

export interface CalcField {
  id: string;
  label: string;
  type: 'select' | 'checkbox' | 'number';
  options?: CalcOption[];
  price_impact?: number;
  impact_type?: 'fixed' | 'percentage';
  min?: number;
  max?: number;
  required?: boolean;
}

export interface CalcDef {
  id: string;
  name: string;
  description: string;
  base_price: number;
  currency: string;
  configuration: CalcField[];
  org_id?: string;
}

interface Props {
  calculator: CalcDef;
  previewMode?: boolean;
  onSubmitSuccess?: () => void;
}

const CalculatorWidget = ({ calculator, previewMode = false, onSubmitSuccess }: Props) => {
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [totalPrice, setTotalPrice] = useState(calculator.base_price);
  const [step, setStep] = useState<'form' | 'contact' | 'success'>('form');
  const [contact, setContact] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    calculatePrice();
  }, [selections]);

  const calculatePrice = () => {
    let price = calculator.base_price;
    calculator.configuration.forEach((field) => {
      const val = selections[field.id];
      if (val === undefined || val === null || val === '') return;
      if (field.type === 'checkbox' && val === true) {
        if (field.impact_type === 'percentage') price *= (1 + (field.price_impact || 0) / 100);
        else price += (field.price_impact || 0);
      } else if (field.type === 'select' && field.options) {
        const opt = field.options.find(o => o.label === val);
        if (opt) {
          if (opt.impact_type === 'percentage') price *= (1 + opt.price_impact / 100);
          else price += opt.price_impact;
        }
      } else if (field.type === 'number' && typeof val === 'number') {
        if (field.impact_type === 'percentage') price *= (1 + (field.price_impact || 0) * val / 100);
        else price += (field.price_impact || 0) * val;
      }
    });
    setTotalPrice(Math.max(0, price));
  };

  const handleSubmit = async () => {
    if (previewMode) { setStep('success'); return; }
    setSubmitting(true);
    await supabase.from('calculator_results').insert({
      calculator_id: calculator.id,
      selections: { ...selections, _contact: contact },
      total_price: totalPrice,
    });
    setSubmitting(false);
    setStep('success');
    onSubmitSuccess?.();
  };

  const currency = calculator.currency || 'EUR';
  const fmt = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency }).format(n);

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-indigo-500/10 p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/20 rounded-xl border border-primary/30 flex items-center justify-center text-primary">
            <Calculator size={20} />
          </div>
          <h3 className="text-xl font-bold font-orbitron">{calculator.name}</h3>
        </div>
        {calculator.description && (
          <p className="text-xs text-gray-400">{calculator.description}</p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-5">
            {calculator.configuration.length === 0 ? (
              <p className="text-center text-gray-500 py-10 text-sm italic">Noch keine Felder konfiguriert.</p>
            ) : (
              calculator.configuration.map((field) => (
                <div key={field.id}>
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">
                    {field.label}{field.required && <span className="text-primary ml-1">*</span>}
                  </label>

                  {field.type === 'select' && field.options && (
                    <div className="grid grid-cols-1 gap-2">
                      {field.options.map((opt) => (
                        <button
                          key={opt.label}
                          onClick={() => setSelections(s => ({ ...s, [field.id]: opt.label }))}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                            selections[field.id] === opt.label
                              ? 'bg-primary/20 border-primary text-primary'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                          }`}
                        >
                          <span>{opt.label}</span>
                          <span className={`text-xs ${opt.price_impact > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {opt.impact_type === 'percentage'
                              ? `+${opt.price_impact}%`
                              : `+${fmt(opt.price_impact)}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {field.type === 'checkbox' && (
                    <button
                      onClick={() => setSelections(s => ({ ...s, [field.id]: !s[field.id] }))}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                        selections[field.id]
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${selections[field.id] ? 'bg-primary border-primary' : 'border-gray-600'}`}>
                        {selections[field.id] && <CheckCircle size={12} className="text-white" />}
                      </div>
                      <span className="text-sm font-bold flex-1 text-left">{field.label}</span>
                      {field.price_impact !== undefined && (
                        <span className="text-xs text-green-400">
                          {field.impact_type === 'percentage' ? `+${field.price_impact}%` : `+${fmt(field.price_impact)}`}
                        </span>
                      )}
                    </button>
                  )}

                  {field.type === 'number' && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelections(s => ({ ...s, [field.id]: Math.max(field.min ?? 0, (s[field.id] || 0) - 1) }))}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-lg font-bold hover:bg-white/10 transition-all"
                      >-</button>
                      <input
                        type="number"
                        value={selections[field.id] || ''}
                        onChange={e => setSelections(s => ({ ...s, [field.id]: Number(e.target.value) }))}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-center font-bold outline-none focus:ring-2 focus:ring-primary/50"
                        min={field.min ?? 0}
                        max={field.max}
                        placeholder="0"
                      />
                      <button
                        onClick={() => setSelections(s => ({ ...s, [field.id]: Math.min(field.max ?? 9999, (s[field.id] || 0) + 1) }))}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-lg font-bold hover:bg-white/10 transition-all"
                      >+</button>
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Price Display */}
            <div className="mt-6 p-5 bg-gradient-to-r from-primary/10 to-indigo-500/10 rounded-2xl border border-primary/20">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-widest">Geschätzter Gesamtpreis</p>
              <motion.p key={totalPrice} initial={{ scale: 0.9, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-black font-orbitron text-primary">
                {fmt(totalPrice)}
              </motion.p>
              <p className="text-[10px] text-gray-600 mt-1">Basierend auf Ihren Auswahlen. Basispreis: {fmt(calculator.base_price)}</p>
            </div>

            {!previewMode && calculator.configuration.length > 0 && (
              <button
                onClick={() => setStep('contact')}
                className="w-full py-4 bg-primary hover:bg-primary/80 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Jetzt anfragen <ChevronRight size={18} />
              </button>
            )}
          </motion.div>
        )}

        {step === 'contact' && (
          <motion.div key="contact" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="p-6 space-y-5">
            <h4 className="text-lg font-bold font-orbitron">Ihre Kontaktdaten</h4>
            <p className="text-xs text-gray-500">Wir melden uns mit einem konkreten Angebot bei Ihnen.</p>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} placeholder="Max Mustermann" className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} placeholder="max@firma.de" type="email" className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
              </div>
            </div>
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex justify-between items-center">
              <span className="text-xs text-gray-400">Ihr Angebotspreis:</span>
              <span className="font-orbitron font-bold text-primary text-lg">{fmt(totalPrice)}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('form')} className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-sm transition-all">Zurück</button>
              <button
                onClick={handleSubmit}
                disabled={!contact.name || !contact.email || submitting}
                className="flex-1 py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Anfrage senden'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/40">
              <CheckCircle className="text-green-400" size={40} />
            </div>
            <h4 className="text-xl font-bold font-orbitron">Anfrage gesendet!</h4>
            <p className="text-sm text-gray-400">Vielen Dank. Wir melden uns in Kürze bei Ihnen.</p>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="text-xs text-gray-500">Geschätzter Preis</p>
              <p className="font-orbitron font-bold text-primary text-xl">{fmt(totalPrice)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalculatorWidget;
