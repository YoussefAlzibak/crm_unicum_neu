import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Settings, AlertCircle, ExternalLink, Save, Loader2, X, CheckCircle, Zap, Clock, Target, User, Mail, Globe, Shield, Award, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const BookingView = () => {
  const { currentOrg } = useOrg();
  const [activeTab, setActiveTab] = useState<'calendar' | 'services' | 'settings'>('calendar');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointments, setAppointments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [settings, setSettings] = useState<any>({
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    available_days: [1, 2, 3, 4, 5],
    default_duration: 30,
    buffer_before: 0,
    buffer_after: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [apptForm, setApptForm] = useState({
    title: '',
    contact_email: '',
    start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    description: ''
  });

  const [services, setServices] = useState<any[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration: 30,
    icon: 'Zap',
    color: 'text-purple-400',
    is_active: true
  });

  useEffect(() => {
    if (currentOrg) {
      fetchAppointments();
      fetchSettings();
      fetchServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg]);

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*, contacts(full_name, email)')
      .eq('org_id', currentOrg?.id)
      .order('start_time', { ascending: true });
    
    if (data) setAppointments(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('booking_settings')
      .select('*')
      .eq('org_id', currentOrg?.id)
      .maybeSingle();
    
    if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const fetchServices = async () => {
    if (!currentOrg) return;
    const { data } = await supabase
      .from('booking_services')
      .select('*')
      .eq('org_id', currentOrg.id)
      .order('created_at', { ascending: true });
    
    if (data) setServices(data);
  };

  const saveSettings = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('booking_settings')
        .upsert({
          org_id: currentOrg.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Einstellungen erfolgreich gespeichert!');
    } catch (err: any) {
      toast.error('Fehler beim Speichern: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      if (editingService) {
        const { error } = await supabase
          .from('booking_services')
          .update(serviceForm)
          .eq('id', editingService.id);
        if (error) throw error;
        toast.success('Leistung aktualisiert');
      } else {
        const { error } = await supabase
          .from('booking_services')
          .insert({ ...serviceForm, org_id: currentOrg.id });
        if (error) throw error;
        toast.success('Leistung erstellt');
      }
      setIsServiceModalOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      toast.error('Fehler: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Diese Leistung wirklich löschen?')) return;
    try {
      const { error } = await supabase
        .from('booking_services')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Leistung gelöscht');
      fetchServices();
    } catch (err: any) {
      toast.error('Fehler: ' + err.message);
    }
  };

  const openServiceModal = (service?: any) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description || '',
        duration: service.duration,
        icon: service.icon || 'Zap',
        color: service.color || 'text-purple-400',
        is_active: service.is_active ?? true
      });
    } else {
      setEditingService(null);
      setServiceForm({
        name: '',
        description: '',
        duration: 30,
        icon: 'Zap',
        color: 'text-purple-400',
        is_active: true
      });
    }
    setIsServiceModalOpen(true);
  };

  const IconMap: any = { Zap, Clock, Target, User, Mail, Globe, Shield, Award, Calendar: CalendarIcon };

  const toggleDay = (dayIndex: number) => {
    const current = settings.available_days || [];
    const updated = current.includes(dayIndex)
      ? current.filter((d: number) => d !== dayIndex)
      : [...current, dayIndex];
    setSettings({ ...settings, available_days: updated });
  };

  const openApptModal = (appt?: any) => {
    if (appt) {
      setEditingAppointment(appt);
      setApptForm({
        title: appt.title || '',
        contact_email: appt.contacts?.email || '',
        start_time: format(new Date(appt.start_time), "yyyy-MM-dd'T'HH:mm"),
        description: appt.description || ''
      });
    } else {
      setEditingAppointment(null);
      setApptForm({
        title: '',
        contact_email: '',
        start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      // 1. Find or create contact
      let { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('org_id', currentOrg.id)
        .eq('email', apptForm.contact_email)
        .maybeSingle();
      
      if (!contact) {
        const { data: newContact } = await supabase
          .from('contacts')
          .insert({
            org_id: currentOrg.id,
            full_name: apptForm.contact_email.split('@')[0],
            email: apptForm.contact_email,
            status: 'lead'
          })
          .select()
          .single();
        contact = newContact;
      }

      // 2. Create or Update Appointment
      const startTime = new Date(apptForm.start_time).toISOString();
      const endTime = addMinutes(new Date(apptForm.start_time), settings?.default_duration || 30).toISOString();

      const apptData = {
        org_id: currentOrg.id,
        contact_id: contact?.id,
        title: apptForm.title,
        description: apptForm.description,
        start_time: startTime,
        end_time: endTime,
        status: 'confirmed'
      };

      if (editingAppointment) {
        const { error } = await supabase
          .from('appointments')
          .update(apptData)
          .eq('id', editingAppointment.id);
        if (error) throw error;
        toast.success('Termin aktualisiert');
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert(apptData);
        if (error) throw error;
        toast.success('Termin erstellt');
      }
      
      setIsModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      toast.error('Fehler: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!editingAppointment || !confirm('Diesen Termin wirklich löschen?')) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', editingAppointment.id);
      
      if (error) throw error;
      toast.success('Termin gelöscht');
      setIsModalOpen(false);
      fetchAppointments();
    } catch (err: any) {
      toast.error('Fehler: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-orbitron tracking-wider">Buchungen</h2>
          <p className="text-gray-400 mt-1">Terminverwaltung & Kalenderintegration</p>
        </div>

        <div className="flex gap-4">
          <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'calendar' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              Kalender
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'services' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              Leistungen
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              Einstellungen
            </button>
          </div>
          <button 
            onClick={() => openApptModal()}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
          >
            <Plus size={20} /> Termin eintragen
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
            <div className="glass p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CalendarIcon className="text-primary" size={20} /> Kalender
                </h3>
                <button 
                  onClick={() => openApptModal()}
                  className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all text-sm"
                >
                  <Plus size={18} /> Termin eintragen
                </button>
              </div>

              {loading ? (
                <div className="h-[600px] bg-white/5 rounded-3xl animate-pulse border border-white/10" />
              ) : (
                <div className="h-[600px] bg-white/5 rounded-2xl p-4 border border-white/10 overflow-hidden text-sm [&_.rbc-calendar]:text-gray-200 [&_.rbc-header]:border-white/10 [&_.rbc-header]:py-2 [&_.rbc-month-view]:border-white/10 [&_.rbc-day-bg]:border-white/10 [&_.rbc-month-row]:border-white/10 [&_.rbc-event]:bg-primary [&_.rbc-event]:rounded-md [&_.rbc-event]:border-none [&_.rbc-today]:bg-white/5 [&_.rbc-off-range-bg]:bg-transparent [&_.rbc-btn-group_button]:!text-gray-300 [&_.rbc-btn-group_button]:!border-white/10 hover:[&_.rbc-btn-group_button]:!bg-white/10 [&_.rbc-active]:!bg-primary [&_.rbc-active]:!text-white [&_.rbc-toolbar_button]:!rounded-lg [&_.rbc-toolbar-label]:font-bold [&_.rbc-toolbar-label]:text-lg [&_.rbc-time-view]:border-white/10 [&_.rbc-time-header.rbc-overflowing]:border-white/10 [&_.rbc-time-header-content]:border-white/10 [&_.rbc-time-content]:border-white/10 [&_.rbc-timeslot-group]:border-white/10 [&_.rbc-day-slot_.rbc-time-slot]:border-white/5 [&_.rbc-time-column]:border-white/10">
                  <Calendar
                    localizer={localizer}
                    events={appointments.map(appt => ({
                      id: appt.id,
                      title: appt.title,
                      start: new Date(appt.start_time),
                      end: new Date(appt.end_time),
                      resource: appt,
                    }))}
                    startAccessor="start"
                    endAccessor="end"
                    culture="de"
                    messages={{
                      next: "Vor",
                      previous: "Zurück",
                      today: "Heute",
                      month: "Monat",
                      week: "Woche",
                      day: "Tag",
                      agenda: "Agenda",
                      date: "Datum",
                      time: "Zeit",
                      event: "Termin",
                      noEventsInRange: "Keine Termine in diesem Zeitraum.",
                    }}
                    onSelectEvent={(event: any) => openApptModal(event.resource)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'services' ? (
          <motion.div
            key="services"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10">
                <div>
                    <h3 className="text-xl font-bold font-orbitron">Angebote & Leistungen</h3>
                    <p className="text-sm text-gray-400">Verwalten Sie hier die buchbaren Termintypen Ihrer Organisation.</p>
                </div>
                <button 
                  onClick={() => openServiceModal()}
                  className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                >
                  <Plus size={20} /> Neue Leistung
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => {
                    const Icon = IconMap[service.icon] || Zap;
                    return (
                        <div key={service.id} className={`glass p-6 rounded-3xl border border-white/10 transition-all hover:border-primary/50 relative group ${!service.is_active ? 'opacity-50 grayscale' : ''}`}>
                            {!service.is_active && (
                                <div className="absolute top-4 right-4 bg-red-500/20 text-red-400 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">Deaktiviert</div>
                            )}
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 ${service.color}`}>
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-lg">{service.name}</h4>
                                    <p className="text-xs text-primary font-bold">{service.duration} Minuten</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-6 h-10">{service.description}</p>
                            
                            <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                                <button onClick={() => openServiceModal(service)} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all"><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteService(service.id)} className="p-2 hover:bg-white/5 rounded-xl text-red-500/50 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    );
                })}
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
                    value={settings?.default_duration || 30}
                    onChange={e => setSettings({ ...settings, default_duration: parseInt(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Puffer Vorher (Min)</label>
                    <input
                      type="number"
                      value={settings?.buffer_before || 0}
                      onChange={e => setSettings({ ...settings, buffer_before: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Puffer Nachher (Min)</label>
                    <input
                      type="number"
                      value={settings?.buffer_after || 0}
                      onChange={e => setSettings({ ...settings, buffer_after: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Start (Uhrzeit)</label>
                    <input 
                      type="time" 
                      value={settings?.working_hours_start || "09:00"}
                      onChange={e => setSettings({ ...settings, working_hours_start: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Ende (Uhrzeit)</label>
                    <input 
                      type="time" 
                      value={settings?.working_hours_end || "17:00"}
                      onChange={e => setSettings({ ...settings, working_hours_end: e.target.value })}
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
                        onClick={() => toggleDay(i + 1)}
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

                <button 
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold mt-4 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {saving ? 'Wird gespeichert...' : 'Änderungen speichern'}
                </button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="glass p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-primary/5 to-transparent">
                <h3 className="text-xl font-bold font-orbitron mb-4 flex items-center gap-2">
                  <CalendarIcon className="text-primary" size={24} /> Google Calendar
                </h3>
                <p className="text-gray-400 text-sm mb-6">Synchronisieren Sie Ihre Termine in beide Richtungen, um Doppelbuchungen zu vermeiden.</p>
                <button className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                  <ExternalLink size={18} /> Mit Google verbinden
                </button>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Appointment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-[#121212] border border-white/10 rounded-[2.5rem] p-8 md:p-12 w-full max-w-xl shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                        {editingAppointment ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    <h3 className="text-xl font-bold">{editingAppointment ? 'Termin bearbeiten' : 'Manueller Termin'}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Titel / Anlass</label>
                  <input 
                    type="text" 
                    placeholder="Erstgespräch"
                    value={apptForm.title}
                    onChange={e => setApptForm({...apptForm, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Kontakt E-Mail</label>
                  <input 
                    type="email" 
                    placeholder="kunde@beispiel.de"
                    value={apptForm.contact_email}
                    onChange={e => setApptForm({...apptForm, contact_email: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Datum & Uhrzeit</label>
                  <input 
                    type="datetime-local" 
                    value={apptForm.start_time}
                    onChange={e => setApptForm({...apptForm, start_time: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Anmerkung</label>
                  <textarea 
                    value={apptForm.description}
                    onChange={e => setApptForm({...apptForm, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 outline-none focus:ring-2 focus:ring-primary/50 font-medium h-24 resize-none"
                  />
                </div>

                <div className="pt-4 space-y-3">
                    <button 
                        onClick={handleSaveAppointment}
                        disabled={saving || !apptForm.title || !apptForm.contact_email}
                        className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                        {saving ? 'Wird gespeichert...' : (editingAppointment ? 'Änderungen speichern' : 'Termin fest eintragen')}
                    </button>
                    {editingAppointment && (
                        <button 
                            onClick={handleDeleteAppointment}
                            disabled={saving}
                            className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={20} /> Termin löschen
                        </button>
                    )}
                    <p className="text-[10px] text-gray-500 text-center mt-4">
                        Manuell bearbeitete Termine benötigen keine erneute Bestätigung durch den Kunden.
                    </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Service Management Modal */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsServiceModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-[#121212] border border-white/10 rounded-[2.5rem] p-8 md:p-12 w-full max-w-xl shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold font-orbitron">{editingService ? 'Leistung bearbeiten' : 'Neue Leistung'}</h3>
                    <button onClick={() => setIsServiceModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Name der Leistung</label>
                            <input type="text" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Dauer (Minuten)</label>
                            <input type="number" value={serviceForm.duration} onChange={e => setServiceForm({...serviceForm, duration: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Beschreibung</label>
                        <textarea value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-medium h-24 resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Icon</label>
                            <select value={serviceForm.icon} onChange={e => setServiceForm({...serviceForm, icon: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold appearance-none">
                                {Object.keys(IconMap).map(icon => <option key={icon} value={icon}>{icon}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Zustand</label>
                            <div className="flex gap-2 h-[52px]">
                                <button onClick={() => setServiceForm({...serviceForm, is_active: true})} className={`flex-1 rounded-2xl font-bold text-xs transition-all ${serviceForm.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>Aktiv</button>
                                <button onClick={() => setServiceForm({...serviceForm, is_active: false})} className={`flex-1 rounded-2xl font-bold text-xs transition-all ${!serviceForm.is_active ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-gray-500 border border-white/10'}`}>Inaktiv</button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button onClick={handleSaveService} disabled={saving || !serviceForm.name} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                            {editingService ? 'Leistung aktualisieren' : 'Leistung erstellen'}
                        </button>
                    </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingView;
