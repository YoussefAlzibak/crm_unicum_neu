import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { Calendar, Clock, User, Plus, Settings, CheckCircle, XCircle, AlertCircle, MapPin, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Appointment {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  location: string | null;
  contact_id: string | null;
  contacts?: { full_name: string };
}

interface BookingSettings {
  default_duration: number;
  available_days: number[];
  working_hours_start: string;
  working_hours_end: string;
}

const BookingView = () => {
  const { currentOrg } = useOrg();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings'>('calendar');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg) {
      fetchAppointments();
      fetchSettings();
    }
  }, [currentOrg]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*, contacts(full_name)')
      .eq('org_id', currentOrg?.id)
      .order('start_time', { ascending: true });
    
    if (data) setAppointments(data);
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('org_id', currentOrg?.id)
      .single();
    
    if (data) setSettings(data);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);
    
    if (!error) fetchAppointments();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-orbitron">Buchungssystem</h2>
          <p className="text-sm text-gray-500">Termine und Verfügbarkeit Ihrer Organisation.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'calendar' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Termine
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Einstellungen
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'calendar' ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Minimal Calendar Header Placeholder */}
            <div className="glass p-6 rounded-3xl border border-white/10 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/5"><ChevronLeft size={20}/></button>
                <div className="text-center min-w-[150px]">
                  <p className="text-lg font-bold font-orbitron capitalize">{new Date().toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}</p>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/5"><ChevronRight size={20}/></button>
              </div>
              <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all text-sm">
                <Plus size={18} /> Termin eintragen
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Today's Schedule or Next Appointments */}
              <div className="lg:col-span-12 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 px-2">
                  <Calendar className="text-primary" size={20} /> Anstehende Termine
                </h3>
                
                {loading ? (
                  Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse border border-white/10" />)
                ) : appointments.length === 0 ? (
                  <div className="py-20 text-center glass rounded-3xl border border-white/10 border-dashed">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-gray-500">
                      <Clock size={32} />
                    </div>
                    <p className="text-gray-500">Keine Termine für diesen Zeitraum gefunden.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {appointments.map((appt) => (
                      <motion.div
                        key={appt.id}
                        whileHover={{ y: -5 }}
                        className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:shadow-2xl transition-all group relative overflow-hidden"
                      >
                        <div className={`absolute top-0 right-0 w-1 h-full ${
                          appt.status === 'confirmed' ? 'bg-green-500' : 
                          appt.status === 'cancelled' ? 'bg-red-500' : 'bg-primary'
                        }`} />
                        
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            <Clock size={12} className="text-primary"/>
                            {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                            {' - '}
                            {new Date(appt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            appt.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 
                            appt.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'
                          }`}>
                            {appt.status}
                          </span>
                        </div>

                        <h4 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{appt.title}</h4>
                        
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <User size={14} /> {appt.contacts?.full_name || 'Unbekannt'}
                          </div>
                          {appt.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin size={14} /> {appt.location}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateStatus(appt.id, 'confirmed')}
                            className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-bold rounded-xl border border-green-500/20 transition-all"
                          >
                            Bestätigen
                          </button>
                          <button 
                            onClick={() => updateStatus(appt.id, 'cancelled')}
                            className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-xl border border-red-500/20 transition-all"
                          >
                            Stornieren
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className="glass p-8 rounded-3xl border border-white/10 space-y-6">
              <h3 className="text-xl font-bold font-orbitron flex items-center gap-2">
                <Settings className="text-primary" size={24} /> Buchungskonfiguration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Standard Dauer (Minuten)</label>
                  <input 
                    type="number" 
                    defaultValue={settings?.default_duration || 30}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Start (Uhrzeit)</label>
                    <input 
                      type="time" 
                      defaultValue={settings?.working_hours_start || "09:00"}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Ende (Uhrzeit)</label>
                    <input 
                      type="time" 
                      defaultValue={settings?.working_hours_end || "17:00"}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Verfügbare Tage</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, i) => (
                      <button 
                        key={day}
                        className={`w-10 h-10 rounded-lg text-xs font-bold transition-all border ${
                          (settings?.available_days || [1,2,3,4,5]).includes(i + 1)
                          ? 'bg-primary border-primary text-white shadow-lg' 
                          : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold mt-4 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  Änderungen speichern
                </button>
              </div>
            </div>

            <div className="glass p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/5 to-transparent flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold font-orbitron mb-4">Öffentlicher Link</h3>
                <p className="text-gray-400 text-sm mb-6">Teilen Sie diesen Link mit Ihren Kunden, um Terminanfragen direkt in Ihr CRM zu erhalten.</p>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/10 flex items-center justify-between mb-8 group">
                  <span className="text-xs font-bold text-primary truncate">unicum.tech/o/{currentOrg?.slug}/book</span>
                  <button className="text-gray-500 hover:text-white group-hover:scale-110 transition-all"><ExternalLink size={18}/></button>
                </div>
              </div>

              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <h4 className="text-sm font-bold mb-2 flex items-center gap-2"><AlertCircle size={14} className="text-yellow-500"/> Integration</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Sie können das Buchungsformular auch als Widget in Ihre eigene Webseite einbetten. Der Code ist für React und Vanilla HTML optimiert.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingView;
