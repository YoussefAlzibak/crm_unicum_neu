import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { 
  User, 
  Building, 
  Mail, 
  Terminal, 
  Save, 
  Loader2, 
  Palette, 
  Globe, 
  Shield, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Code
} from 'lucide-react';
import ChatWidget from '../external/ChatWidget';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'profile' | 'organization' | 'smtp' | 'chat' | 'audit' | 'system';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user_name: string;
  password_encrypted: string;
  from_email: string;
  from_name: string;
}

const SettingsView = () => {
  const { profile, currentOrg, user } = useOrg();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Form States
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || ''
  });

  const [orgForm, setOrgForm] = useState({
    name: currentOrg?.name || '',
    primaryColor: currentOrg?.branding?.primaryColor || '#8a2be2',
    logoUrl: currentOrg?.branding?.logoUrl || '/img/logo.png'
  });

  const [smtpForm, setSmtpForm] = useState<SMTPConfig>({
    host: '',
    port: 587,
    secure: true,
    user_name: '',
    password_encrypted: '',
    from_email: '',
    from_name: ''
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    if (currentOrg) {
      setOrgForm({
        name: currentOrg.name || '',
        primaryColor: currentOrg.branding?.primaryColor || '#8a2be2',
        logoUrl: currentOrg.branding?.logoUrl || '/img/logo.png'
      });
      fetchSMTP();
      fetchLogs();
    }
  }, [currentOrg]);

  const fetchLogs = async () => {
    if (!currentOrg) return;
    setLogsLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('org_id', currentOrg.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) setLogs(data);
    setLogsLoading(false);
  };

  const fetchSMTP = async () => {
    if (!currentOrg) return;
    const { data } = await supabase
      .from('smtp_settings')
      .select('*')
      .eq('org_id', currentOrg.id)
      .single();

    if (data) {
      setSmtpForm(data);
    }
  };

  const showStatus = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') setSuccess(msg);
    else setError(msg);
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 3000);
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileForm.full_name,
        avatar_url: profileForm.avatar_url
      })
      .eq('id', user.id);

    if (error) showStatus('error', 'Fehler beim Speichern des Profils');
    else showStatus('success', 'Profil erfolgreich aktualisiert');
    setLoading(false);
  };

  const handleUpdateOrg = async () => {
    if (!currentOrg) return;
    setLoading(true);
    const { error } = await supabase
      .from('organizations')
      .update({
        name: orgForm.name,
        branding: {
          primaryColor: orgForm.primaryColor,
          logoUrl: orgForm.logoUrl
        }
      })
      .eq('id', currentOrg.id);

    if (error) showStatus('error', 'Fehler beim Speichern der Organisation');
    else showStatus('success', 'Organisation erfolgreich aktualisiert');
    setLoading(false);
  };

  const handleUpdateSMTP = async () => {
    if (!currentOrg) return;
    setLoading(true);
    
    // Check if exists first for upsert
    const { data: existing } = await supabase
      .from('smtp_settings')
      .select('id')
      .eq('org_id', currentOrg.id)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from('smtp_settings')
        .update(smtpForm)
        .eq('org_id', currentOrg.id);
    } else {
      result = await supabase
        .from('smtp_settings')
        .insert({ ...smtpForm, org_id: currentOrg.id });
    }

    if (result.error) showStatus('error', 'Fehler beim Speichern der SMTP-Daten');
    else showStatus('success', 'SMTP-Einstellungen gespeichert');
    setLoading(false);
  };

  const widgetCode = `<script src="https://unicum.tech/widget.js" data-org-id="${currentOrg?.id}" async></script>`;

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'organization', label: 'Organisation', icon: Building },
    { id: 'smtp', label: 'E-Mail (SMTP)', icon: Mail },
    { id: 'chat', label: 'Live Chat', icon: MessageCircle },
    { id: 'audit', label: 'Compliance & Logs', icon: Shield },
    { id: 'system', label: 'System', icon: Terminal },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-orbitron">Einstellungen</h2>
          <p className="text-sm text-gray-500">Verwalten Sie Ihr Profil und die Systemeinstellungen.</p>
        </div>
        
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-sm font-bold">
              <CheckCircle2 size={16} /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold">
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <tab.icon size={18} /> {tab.label}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 glass p-8 rounded-3xl border border-white/10 shadow-2xl">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary overflow-hidden">
                    {profileForm.avatar_url ? (
                      <img src={profileForm.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Persönliches Profil</h3>
                    <p className="text-sm text-gray-500">Ihre Identität im System.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Vollständiger Name</label>
                    <input 
                      type="text" 
                      value={profileForm.full_name} 
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Avatar-URL</label>
                    <input 
                      type="text" 
                      value={profileForm.avatar_url} 
                      onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleUpdateProfile} 
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Profil speichern
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'organization' && (
              <motion.div key="org" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                  <div className="w-20 h-20 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 overflow-hidden">
                    {orgForm.logoUrl ? (
                      <img src={orgForm.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <Building size={40} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Unternehmensdaten</h3>
                    <p className="text-sm text-gray-500">Passen Sie Ihr Branding an.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Name der Organisation</label>
                    <input 
                      type="text" 
                      value={orgForm.name} 
                      onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Primärfarbe</label>
                    <div className="flex gap-4">
                      <input 
                        type="color" 
                        value={orgForm.primaryColor} 
                        onChange={(e) => setOrgForm({ ...orgForm, primaryColor: e.target.value })}
                        className="w-12 h-12 bg-black/40 border border-white/10 rounded-xl p-1 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={orgForm.primaryColor} 
                        onChange={(e) => setOrgForm({ ...orgForm, primaryColor: e.target.value })}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Logo-URL</label>
                    <input 
                      type="text" 
                      value={orgForm.logoUrl} 
                      onChange={(e) => setOrgForm({ ...orgForm, logoUrl: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleUpdateOrg} 
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Branding speichern
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'smtp' && (
              <motion.div key="smtp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                  <div className="w-20 h-20 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 text-orange-400">
                    <Mail size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Mail-Server (SMTP)</h3>
                    <p className="text-sm text-gray-500">Konfigurieren Sie den Versand Ihrer System-E-Mails.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">SMTP Host</label>
                    <input 
                      type="text" 
                      placeholder="smtp.beispiel.de"
                      value={smtpForm.host} 
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Port</label>
                    <input 
                      type="number" 
                      value={smtpForm.port} 
                      onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Benutzername</label>
                    <input 
                      type="text" 
                      value={smtpForm.user_name} 
                      onChange={(e) => setSmtpForm({ ...smtpForm, user_name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Passwort</label>
                    <input 
                      type="password" 
                      value={smtpForm.password_encrypted} 
                      onChange={(e) => setSmtpForm({ ...smtpForm, password_encrypted: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Absender E-Mail</label>
                    <input 
                      type="email" 
                      value={smtpForm.from_email} 
                      onChange={(e) => setSmtpForm({ ...smtpForm, from_email: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Absender Name</label>
                    <input 
                      type="text" 
                      value={smtpForm.from_name} 
                      onChange={(e) => setSmtpForm({ ...smtpForm, from_name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleUpdateSMTP} 
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} SMTP speichern
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className="flex items-center gap-4 mb-4 pb-6 border-b border-white/5">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
                    <MessageCircle size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Live Chat Widget</h3>
                    <p className="text-sm text-gray-500">Konfigurieren Sie Ihr Website-Widget.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Widget Name</label>
                        <input 
                            type="text" 
                            value={orgForm.name} 
                            placeholder="z.B. Support"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold"
                            disabled
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Branding Farbe</label>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl border border-white/10" style={{ backgroundColor: orgForm.primaryColor }} />
                            <p className="text-sm self-center text-gray-400">Wird aus den Organisations-Einstellungen übernommen.</p>
                        </div>
                    </div>

                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl space-y-4">
                        <h4 className="font-bold flex items-center gap-2"><Code size={18} className="text-primary"/> Einbettungscode</h4>
                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-widest">Kopieren Sie diesen Code in Ihren &lt;head&gt;:</p>
                        <div className="relative group">
                            <pre className="bg-black/60 p-4 rounded-xl text-[10px] font-mono text-gray-300 overflow-x-auto border border-white/10">
                              {widgetCode}
                            </pre>
                            <button className="absolute top-2 right-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition-all">Kopieren</button>
                        </div>
                    </div>
                  </div>

                  <div className="relative h-[400px] bg-black/40 border border-white/10 rounded-3xl overflow-hidden group">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                         <Globe size={100} className="text-white" />
                    </div>
                    <div className="absolute top-4 left-4">
                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Vorschau auf Ihrer Website</p>
                    </div>
                    
                    {/* Live Preview of the widget */}
                    {currentOrg && (
                        <ChatWidget 
                            orgId={currentOrg.id} 
                            themeColor={orgForm.primaryColor} 
                            displayName={orgForm.name + " Support"} 
                        />
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'audit' && (
              <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
                    <Shield size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Audit & Compliance</h3>
                    <p className="text-sm text-gray-500">Protokoll aller kritischen Aktivitäten Ihrer Organisation.</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                  {logsLoading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                  ) : logs.length === 0 ? (
                    <p className="p-12 text-center text-gray-500 italic">Noch keine Aktivitäten protokolliert.</p>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {logs.map(log => (
                        <div key={log.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-all">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                              log.action === 'INSERT' ? 'bg-green-500/10 text-green-400' :
                              log.action === 'DELETE' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                            }`}>
                              {log.action === 'INSERT' ? 'ADD' : log.action === 'DELETE' ? 'DEL' : 'UPD'}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{log.action} on {log.target_table}</p>
                              <p className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleString('de-DE')}</p>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-600 font-mono">
                            ID: {log.target_id.split('-')[0]}...
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex gap-4">
                    <AlertCircle className="text-primary shrink-0" size={20} />
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Diese Logs sind unveränderlich und dienen der Sicherheit Ihrer Daten. Super-Admins haben Zugriff auf den globalen Audit-Log des gesamten Systems.
                    </p>
                </div>
              </motion.div>
            )}
            {activeTab === 'system' && (
              <motion.div key="system" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                  <div className="w-20 h-20 rounded-2xl bg-zinc-500/20 flex items-center justify-center border border-zinc-500/30 text-zinc-400">
                    <Terminal size={40} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Systeminformationen</h3>
                    <p className="text-sm text-gray-500">Technische Details zur Plattform.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Plattform Version', value: 'v1.4.2-stable', icon: Globe },
                    { label: 'Datenbank', value: 'PostgreSQL 15 (Supabase)', icon: Smartphone },
                    { label: 'KI-Modell', value: 'Gemini 1.5 Pro', icon: Palette },
                    { label: 'Verschlüsselung', value: 'AES-256-GCM', icon: Shield },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <item.icon size={16} className="text-gray-500" />
                        <span className="text-xs font-bold text-gray-500 uppercase">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 mt-8">
                  <h4 className="font-bold flex items-center gap-2 mb-2"><CheckCircle2 size={18} className="text-primary"/> Systemstatus</h4>
                  <p className="text-xs text-gray-400">Alle Dienste laufen normal. Letzte Wartung vor 4 Tagen.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
