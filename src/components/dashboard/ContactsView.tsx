import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { Search, UserPlus, Filter, Mail, Phone, Tag, Edit2, Trash2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlanLimits } from '../../hooks/usePlanLimits';

interface Contact {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  tags: string[];
}

const ContactsView = () => {
  const { currentOrg } = useOrg();
  const { checkActionAllowed, refreshUsage } = usePlanLimits();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [contactModal, setContactModal] = useState<{ open: boolean; contact: Partial<Contact> | null }>({ open: false, contact: null });
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', status: 'lead', tags: ''
  });

  useEffect(() => {
    if (currentOrg) fetchContacts();
  }, [currentOrg]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contacts').select('*')
      .eq('org_id', currentOrg?.id)
      .order('created_at', { ascending: false });

    if (data) setContacts(data);
    setLoading(false);
  };

  const openModal = (contact: Contact | null = null) => {
    if (contact) {
      setForm({
        full_name: contact.full_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        status: contact.status || 'lead',
        tags: (contact.tags || []).join(', ')
      });
      setContactModal({ open: true, contact });
    } else {
      setForm({ full_name: '', email: '', phone: '', status: 'lead', tags: '' });
      setContactModal({ open: true, contact: null });
    }
  };

  const saveContact = async () => {
    if (!currentOrg || !form.full_name) return;
    const isEdit = !!contactModal.contact?.id;

    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      status: form.status,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean)
    };

    if (isEdit) {
      await supabase.from('contacts').update(payload).eq('id', contactModal.contact!.id);
    } else {
      const { allowed, message } = checkActionAllowed('contacts');
      if (!allowed) {
        alert(message);
        return;
      }
      await supabase.from('contacts').insert({ ...payload, org_id: currentOrg.id });
    }

    setContactModal({ open: false, contact: null });
    await fetchContacts();
    await refreshUsage();
  };

  const deleteContact = async (id: string) => {
    if (confirm('Diesen Kontakt wirklich löschen?')) {
      await supabase.from('contacts').delete().eq('id', id);
      setContacts(c => c.filter(x => x.id !== id));
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-orbitron">Kontakte</h2>
          <p className="text-sm text-gray-500">Kunden, Leads und Partner effektiv verwalten.</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/20">
          <UserPlus size={20} /> Neuer Kontakt
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-lg">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Suchen nach Name oder E-Mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm font-bold placeholder:font-normal"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-gray-300 font-bold transition-all">
          <Filter size={18} /> Felder
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-widest font-bold">
            <tr>
              <th className="px-6 py-5 border-b border-white/10">Name</th>
              <th className="px-6 py-5 border-b border-white/10">Kontakt-Infos</th>
              <th className="px-6 py-5 border-b border-white/10">Status</th>
              <th className="px-6 py-5 border-b border-white/10">Tags</th>
              <th className="px-6 py-5 border-b border-white/10 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse bg-white/[0.02]">
                  <td colSpan={5} className="px-6 py-8 h-16"></td>
                </tr>
              ))
            ) : filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <UserPlus className="text-gray-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Noch keine Kontakte</h3>
                  <p className="text-gray-500 max-w-sm mx-auto text-sm">Fügen Sie Ihren ersten Lead oder Kunden hinzu, um die CRM-Funktionen zu nutzen.</p>
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20 shrink-0">
                        {contact.full_name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-sm block">{contact.full_name}</span>
                        <span className="text-[10px] text-gray-500">ID: {contact.id.split('-')[0]}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5 text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-gray-500" /> {contact.email || <span className="italic text-gray-600">Keine E-Mail</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-gray-500" /> {contact.phone || <span className="italic text-gray-600">Keine Telefonnr.</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                      contact.status === 'customer' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      contact.status === 'archived' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {contact.tags?.length > 0 ? contact.tags.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] bg-white/10 px-2 py-1 rounded-lg text-gray-300 font-bold border border-white/5">
                          <Tag size={10} /> {tag}
                        </span>
                      )) : <span className="text-gray-600 text-xs italic">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(contact)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => deleteContact(contact.id)} className="p-2 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-red-500/70 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {contactModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setContactModal({ open: false, contact: null })}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-orbitron">{contactModal.contact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}</h3>
                <button onClick={() => setContactModal({ open: false, contact: null })} className="p-2 hover:bg-white/10 rounded-xl text-gray-400 transition-all"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Vollständiger Name *</label>
                  <input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Max Mustermann" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">E-Mail</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="max@beispiel.de" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Telefon</label>
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+49..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold">
                    <option value="lead">Lead (Interessent)</option>
                    <option value="customer">Kunde</option>
                    <option value="archived">Archiviert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Tags (kommagetrennt)</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="newsletter, vip, webseite" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setContactModal({ open: false, contact: null })} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all">Abbrechen</button>
                <button onClick={saveContact} disabled={!form.full_name} className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 disabled:opacity-50">
                  <Save size={16} /> Speichern
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactsView;
