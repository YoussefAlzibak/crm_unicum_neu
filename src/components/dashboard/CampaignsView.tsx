import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { Mail, Send, Calendar, PieChart, Plus, Layout, Eye, Trash2, Edit3, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_for: string | null;
  created_at: string;
}

const CampaignsView = () => {
  const { currentOrg } = useOrg();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg) fetchCampaigns();
  }, [currentOrg]);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('org_id', currentOrg?.id)
      .order('created_at', { ascending: false });

    if (data) setCampaigns(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-400 bg-green-400/10 border-green-500/20';
      case 'sending': return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      case 'scheduled': return 'text-purple-400 bg-purple-400/10 border-purple-500/20';
      case 'failed': return 'text-red-400 bg-red-400/10 border-red-500/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-500/10';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-orbitron">Marketing Kampagnen</h2>
          <p className="text-sm text-gray-500">Erstellen und analysieren Sie Ihre E-Mail-Kampagnen.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-300 font-bold flex items-center gap-2 transition-all">
            <Layout size={18} /> Vorlagen
          </button>
          <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all transform hover:scale-105 shadow-lg shadow-primary/20">
            <Plus size={20} /> Neue Kampagne
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-white/5 rounded-3xl border border-white/10 animate-pulse" />
          ))
        ) : campaigns.length === 0 ? (
          <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Mail className="text-gray-600" size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Noch keine Kampagnen</h3>
            <p className="text-gray-500 max-w-xs mx-auto text-sm mb-6">Starten Sie mit Ihrer ersten E-Mail-Marketing Kampagne, um Ihre Kunden zu binden.</p>
            <button className="text-primary font-bold hover:underline flex items-center gap-2 mx-auto">
              Jetzt Vorlage wählen <Eye size={16}/>
            </button>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <motion.div
              key={campaign.id}
              whileHover={{ y: -5 }}
              className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex justify-between items-start">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </div>
                <div className="flex gap-1">
                  <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5"><Edit3 size={16}/></button>
                  <button className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/5"><Trash2 size={16}/></button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors mb-1 truncate">{campaign.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={12}/> {campaign.scheduled_for ? new Date(campaign.scheduled_for).toLocaleDateString() : 'Nicht geplant'}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">Öffnungen</p>
                  <p className="font-orbitron font-bold">0%</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">Klicks</p>
                  <p className="font-orbitron font-bold">0%</p>
                </div>
              </div>

              <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                <BarChart3 size={14}/> Statistiken ansehen
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Analytics Overview Section */}
      <div className="glass p-8 rounded-3xl border border-white/10">
        <h3 className="text-xl font-bold font-orbitron mb-6 flex items-center gap-2">
          <PieChart size={24} className="text-primary"/> Performance-Übersicht
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Gesamt Gesendet', value: '0', icon: Send, color: 'text-blue-400' },
            { label: 'Ø Öffnungsrate', value: '0%', icon: Eye, color: 'text-green-400' },
            { label: 'Ø Klickrate', value: '0%', icon: PieChart, color: 'text-purple-400' },
            { label: 'Bounces', value: '0', icon: AlertCircle, color: 'text-red-400' }
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <stat.icon size={14} className={stat.color} />
                {stat.label}
              </div>
              <p className="text-2xl font-bold font-orbitron">{stat.value}</p>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className={`h-full ${stat.color.replace('text', 'bg')} w-0 transition-all duration-1000`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Help for the missing AlertCircle icon
const AlertCircle = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export default CampaignsView;
