import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, Loader2, Calendar, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const VerifyBooking = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    if (token) verify();
  }, [token]);

  const verify = async () => {
    try {
      // 1. Fetch verification record
      const { data: verif, error: verifError } = await supabase
        .from('booking_verifications')
        .select('*')
        .eq('token', token)
        .single();

      if (verifError || !verif) {
        throw new Error('Ungültiger oder abgelaufener Bestätigungslink.');
      }

      // Check expiry
      if (new Date(verif.expires_at) < new Date()) {
        throw new Error('Dieser Link ist bereits abgelaufen. Bitte stellen Sie eine neue Buchunganfrage.');
      }

      // 2. Upsert Contact
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('org_id', verif.org_id)
        .eq('email', verif.contact_data.email)
        .maybeSingle();
      
      let contactId = contact?.id;

      if (!contactId) {
        const { data: newContact, error: newContactError } = await supabase
          .from('contacts')
          .insert({
            org_id: verif.org_id,
            full_name: verif.contact_data.full_name,
            email: verif.contact_data.email,
            phone: verif.contact_data.phone,
            status: 'lead'
          })
          .select()
          .single();
        
        if (newContactError) throw newContactError;
        contactId = newContact.id;
      }

      // 3. Create Appointment
      const { data: appt, error: apptError } = await supabase
        .from('appointments')
        .insert({
          org_id: verif.org_id,
          contact_id: contactId,
          title: verif.appointment_data.title,
          description: verif.appointment_data.description,
          start_time: verif.appointment_data.start_time,
          end_time: verif.appointment_data.end_time,
          status: 'confirmed',
          is_verified: true
        })
        .select('*, organizations(name)')
        .single();

      if (apptError) throw apptError;
      setAppointment(appt);

      // 4. Cleanup verification
      await supabase.from('booking_verifications').delete().eq('id', verif.id);

      setStatus('success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-indigo-500/10 -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="glass max-w-md w-full p-8 md:p-12 rounded-[2.5rem] border border-white/10 text-center space-y-8"
      >
        {status === 'verifying' && (
          <div className="space-y-6">
            <Loader2 className="animate-spin text-primary mx-auto" size={64} />
            <h1 className="text-2xl font-bold font-orbitron">Termin wird bestätigt...</h1>
            <p className="text-gray-500">Einen Moment bitte, wir prüfen Ihre Daten.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                <CheckCircle size={40} className="text-green-400" />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold font-orbitron text-green-400">Bestätigt!</h1>
                <p className="text-gray-400">Ihr Termin bei <strong>{appointment?.organizations?.name}</strong> ist nun fest gebucht.</p>
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-left space-y-4">
                <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-primary" />
                    <span className="font-bold">{format(new Date(appointment.start_time), 'EEEE, dd. MMMM yyyy', { locale: de })}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <Clock size={16} className="text-primary" />
                    <span className="font-bold">{format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')} Uhr</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-primary" />
                    <span className="text-gray-400">{appointment.location || 'Online-Meeting (Link folgt per Mail)'}</span>
                </div>
            </div>

            <div className="pt-4">
                <p className="text-xs text-gray-500 mb-6">Wir haben Ihnen die Details auch noch einmal per E-Mail zugeschickt.</p>
                <Link to="/" className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all">Zurück zur Startseite</Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-8">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
                <AlertCircle size={40} className="text-red-500" />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-bold font-orbitron text-red-500">Hoppla!</h1>
                <p className="text-gray-400 leading-relaxed">{errorMsg}</p>
            </div>
            <div className="pt-4">
                <Link to="/" className="text-primary font-bold hover:underline">Zurück zur Startseite</Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyBooking;
