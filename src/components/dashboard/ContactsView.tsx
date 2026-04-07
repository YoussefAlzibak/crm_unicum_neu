import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { Search, UserPlus, Filter, MoreHorizontal, Mail, Phone, Tag } from 'lucide-react';

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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (currentOrg) {
      fetchContacts();
    }
  }, [currentOrg]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('org_id', currentOrg?.id)
      .order('created_at', { ascending: false });

    if (data) setContacts(data);
    setLoading(false);
  };

  const filteredContacts = contacts.filter(c => 
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold font-orbitron">Kontakte</h2>
        <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all transform hover:scale-105">
          <UserPlus size={20} /> Kontakt hinzufügen
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Suchen nach Name oder E-Mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 transition-all font-medium">
          <Filter size={18} /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Kontakt</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Tags</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-16 bg-white/5"></td>
                  </tr>
                ))
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-500">
                    Keine Kontakte gefunden.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {contact.full_name[0]}
                        </div>
                        <span className="font-bold">{contact.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1 text-sm text-gray-400">
                        <div className="flex items-center gap-2"><Mail size={14} /> {contact.email || 'N/A'}</div>
                        <div className="flex items-center gap-2"><Phone size={14} /> {contact.phone || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        contact.status === 'customer' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {contact.tags?.map((tag, i) => (
                          <span key={i} className="flex items-center gap-1 text-[10px] bg-white/10 px-2 py-0.5 rounded-md text-gray-300">
                            <Tag size={10} /> {tag}
                          </span>
                        )) || <span className="text-gray-600 text-xs">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-500 hover:text-white transition-colors">
                        <MoreHorizontal size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ContactsView;
