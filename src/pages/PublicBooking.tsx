import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Mail, Phone, ChevronRight, CheckCircle, AlertCircle, Loader2, Zap, Target } from 'lucide-react';
import { format, addDays, startOfDay, addMinutes, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  branding: any;
}

interface BookingSettings {
  default_duration: number;
  buffer_before: number;
  buffer_after: number;
  available_days: number[];
  working_hours_start: string;
  working_hours_end: string;
}

const PublicBooking = () => {
  const { slug } = useParams<{ slug: string }>();
  const [org, setOrg] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Service, 2: Date, 3: Time, 4: Details, 5: Success
  
  const [selectedService, setSelectedService] = useState<{ name: string; duration: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(addDays(new Date(), 1)));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  const services = [
    { name: 'Strategiegespräch', duration: 45, desc: 'Individuelle Beratung zu Ihrer digitalen Strategie.', icon: Zap, color: 'text-purple-400' },
    { name: 'Quick Tech-Audit', duration: 15, desc: 'Schneller Check Ihrer bestehenden Systeme.', icon: Clock, color: 'text-blue-400' },
    { name: 'Full Roadmap Planning', duration: 90, desc: 'Detaillierte Planung Ihres nächsten Großprojekts.', icon: Target, color: 'text-green-400' },
  ];

  useEffect(() => {
    if (slug) fetchOrgData();
  }, [slug]);

  const fetchOrgData = async () => {
    try {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, branding')
        .eq('slug', slug)
        .single();
      
      if (orgError || !orgData) throw new Error('Organisation nicht gefunden');
      setOrg(orgData);

      const { data: settsData } = await supabase
        .from('booking_settings')
        .select('*')
        .eq('org_id', orgData.id)
        .single();
      
      setSettings(settsData || {
        default_duration: 30,
        buffer_before: 0,
        buffer_after: 0,
        available_days: [1,2,3,4,5],
        working_hours_start: '09:00',
        working_hours_end: '17:00'
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSlots = () => {
    if (!settings || !selectedDate) return [];
    
    const slots: string[] = [];
    const [startH, startM] = settings.working_hours_start.split(':').map(Number);
    const [endH, endM] = settings.working_hours_end.split(':').map(Number);
    
    let current = new Date(selectedDate);
    current.setHours(startH, startM, 0, 0);
    
    const endTime = new Date(selectedDate);
    endTime.setHours(endH, endM, 0, 0);

    const dayOfWeek = selectedDate.getDay() === 0 ? 7 : selectedDate.getDay();
    if (!settings.available_days.includes(dayOfWeek)) return [];

    const duration = selectedService?.duration || settings.default_duration;
    while (current < endTime) {
      slots.push(format(current, 'HH:mm'));
      current = addMinutes(current, duration + settings.buffer_after);
    }

    return slots;
  };

  const handleBooking = async () => {
    if (!org || !selectedSlot) return;
    setSubmitting(true);
    
    try {
      const startTime = new Date(selectedDate);
      const [h, m] = selectedSlot.split(':').map(Number);
      startTime.setHours(h, m, 0, 0);
      
      const duration = selectedService?.duration || settings?.default_duration || 30;
      const endTime = addMinutes(startTime, duration);

      const { error } = await supabase
        .from('booking_verifications')
        .insert({
          org_id: org.id,
          contact_data: {
            full_name: formData.name,
            email: formData.email,
            phone: formData.phone
          },
          appointment_data: {
            title: `${selectedService?.name || 'Termin'}: ${formData.name}`,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            description: formData.note
          }
        });

      if (error) throw error;
      setStep(5);
    } catch (err: any) {
      toast.error('Buchung gescheitert: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 text-center">
        <AlertCircle size={64} className="text-red-500 mb-6" />
        <h1 className="text-2xl font-bold font-orbitron">Organisation nicht gefunden</h1>
        <p className="text-gray-500 mt-2">Der angeforderte Buchungslink ist ungültig.</p>
      </div>
    );
  }

  const slots = generateSlots();

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30 selection:text-white">
      <div className="fixed top-0 left-0 w-full h-[30vh] bg-gradient-to-b from-primary/20 to-transparent -z-10" />
      
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-24">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary uppercase tracking-widest mb-4">
            Termin buchen
          </motion.div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl md:text-6xl font-bold font-orbitron mb-4">
            {org.name}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400 max-w-lg mx-auto">
            Wählen Sie ein passendes Zeitfenster für Ihr Gespräch mit uns.
          </motion.p>
        </div>

        <div className="glass rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative bg-zinc-900/40 backdrop-blur-xl">
          <div className="h-1 bg-white/5 w-full">
            <motion.div 
              initial={{ width: '0%' }} 
              animate={{ width: `${(step / 5) * 100}%` }} 
              className="h-full bg-primary"
            />
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Consultant Sidebar */}
            <div className="w-full md:w-80 bg-black/20 border-r border-white/5 p-8 flex flex-col items-center text-center">
                <div className="relative mb-6">
                    <img src="/img/consultant.png" alt="Berater" className="w-32 h-32 rounded-3xl object-cover border-2 border-primary/30 shadow-2xl shadow-primary/20" />
                    <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-zinc-900" title="Online" />
                </div>
                <h3 className="font-bold text-lg mb-1">Youssef Alzibak</h3>
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-6">Senior Tech Consultant</p>
                
                <div className="space-y-4 w-full text-left">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Expertise</p>
                        <p className="text-xs font-medium">CRM, Automation & Scaling</p>
                    </div>
                    {selectedService && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                            <p className="text-[10px] text-primary font-bold uppercase mb-1">Gewählte Leistung</p>
                            <p className="text-xs font-bold">{selectedService.name}</p>
                            <p className="text-[10px] text-gray-500">{selectedService.duration} Minuten</p>
                        </motion.div>
                    )}
                </div>

                <div className="mt-auto pt-8 flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                    <CheckCircle size={12} className="text-primary" />
                    Trusted Professional
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-8 md:p-12">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Leistung wählen</h2>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Schritt 1 von 4</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {services.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => { setSelectedService(s); setStep(2); }}
                          className={`w-full p-5 rounded-2xl border text-left transition-all group flex items-center gap-4 ${
                            selectedService?.name === s.name ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <s.icon size={22} className={s.color} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold">{s.name}</h3>
                            <p className="text-xs text-gray-500">{s.desc}</p>
                          </div>
                          <div className="text-right shrink-0">
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.duration} min</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                      <button onClick={() => setStep(1)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronRight size={20} className="rotate-180"/></button>
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                        <CalendarIcon size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Datum wählen</h2>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Schritt 2 von 4</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                        {Array.from({ length: 14 }).map((_, i) => {
                          const date = addDays(new Date(), i + 1);
                          const isAvaialble = settings?.available_days.includes(date.getDay() === 0 ? 7 : date.getDay());
                          const isSelected = isSameDay(date, selectedDate);
                          return (
                            <button key={i} disabled={!isAvaialble} onClick={() => setSelectedDate(date)}
                              className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                                isSelected ? 'bg-primary border-primary text-white scale-105' : isAvaialble ? 'bg-white/5 border-white/5 hover:border-white/20' : 'opacity-20 grayscale cursor-not-allowed'
                              }`}
                            >
                              <span className="text-[9px] font-bold uppercase opacity-60 mb-0.5">{format(date, 'eee', { locale: de })}</span>
                              <span className="text-base font-bold">{format(date, 'dd')}</span>
                            </button>
                          );
                        })}
                    </div>
                    <div className="flex justify-end pt-4">
                        <button onClick={() => setStep(3)} className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all">
                          Weiter zur Uhrzeit <ChevronRight size={18} />
                        </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                      <button onClick={() => setStep(2)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronRight size={20} className="rotate-180"/></button>
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                        <Clock size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Uhrzeit wählen</h2>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{format(selectedDate, 'dd. MMMM', { locale: de })} · Schritt 3 von 4</p>
                      </div>
                    </div>

                    {slots.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {slots.map(time => (
                          <button key={time} onClick={() => setSelectedSlot(time)}
                            className={`p-3 rounded-xl border font-bold text-sm transition-all ${
                              selectedSlot === time ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/5">
                        <AlertCircle className="mx-auto text-gray-600 mb-2" size={28} />
                        <p className="text-xs text-gray-500 font-bold">Keine freien Termine verfügbar.</p>
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button disabled={!selectedSlot} onClick={() => setStep(4)} className="bg-primary text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50">
                          Ihre Daten <ChevronRight size={18} />
                        </button>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                      <button onClick={() => setStep(3)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronRight size={20} className="rotate-180"/></button>
                      <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                        <User size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Kontaktdaten</h2>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Letzter Schritt</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Vollständiger Name</label>
                          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Max Mustermann" className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 outline-none focus:ring-1 focus:ring-primary/50 font-medium" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">E-Mail Adresse</label>
                          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="max@beispiel.de" className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 outline-none focus:ring-1 focus:ring-primary/50 font-medium" />
                      </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Anmerkung (Optional)</label>
                        <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Beschreiben Sie kurz Ihr Anliegen..." className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 outline-none focus:ring-1 focus:ring-primary/50 font-medium min-h-[80px]" />
                    </div>

                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                        <CheckCircle className="text-primary mt-0.5 shrink-0" size={16} />
                        <p className="text-[10px] text-gray-400 leading-normal">
                            Sie erhalten eine Bestätigungs-E-Mail. Der Termin ist erst nach Ihrer Bestätigung fest reserviert.
                        </p>
                    </div>

                    <div className="pt-4">
                      <button disabled={!formData.name || !formData.email || submitting} onClick={handleBooking} className="w-full bg-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/80 transition-all disabled:opacity-50 shadow-lg shadow-primary/20">
                        {submitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                        {submitting ? 'Wird gesendet...' : 'Termin jetzt anfragen'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                      <CheckCircle size={40} className="text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold font-orbitron text-green-400">Anfrage gesendet!</h2>
                    <div className="max-w-xs mx-auto space-y-4">
                      <p className="text-sm text-gray-400">Prüfen Sie Ihr Postfach bei **{formData.email}** zur Bestätigung.</p>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-left">
                          <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">{selectedService?.name}</p>
                          <p className="font-bold">{format(selectedDate, 'EEEE, dd.MM', { locale: de })}</p>
                          <p className="text-xl font-orbitron font-bold text-primary">{selectedSlot} Uhr</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
            <p className="text-[10px] text-gray-700 uppercase tracking-widest font-bold">Secure Booking via Unicum Tech</p>
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
