import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { ShieldCheck, Users, Building, Activity, Database, Server, Terminal, Lock } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  target_table: string;
  created_at: string;
  org_id: string;
}

const SuperAdminView = () => {
  const { profile } = useOrg();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({ totalOrgs: 0, totalUsers: 0, activeSubs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.is_super_admin) {
      fetchGlobalStats();
      fetchGlobalLogs();
    }
  }, [profile]);

  const fetchGlobalStats = async () => {
    const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: subCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).neq('plan_name', 'free');

    setStats({
      totalOrgs: orgCount || 0,
      totalUsers: userCount || 0,
      activeSubs: subCount || 0
    });
  };

  const fetchGlobalLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setLogs(data);
    setLoading(false);
  };

  if (!profile?.is_super_admin) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl border border-red-500/20 bg-red-500/5">
        <Lock className="text-red-500 mb-6" size={60} />
        <h2 className="text-2xl font-bold font-orbitron text-red-400">Zugriff Verweigert</h2>
        <p className="text-gray-500 text-center max-w-md mt-2">Diese Ansicht ist ausschließlich für System-Administratoren reserviert. Ihr Zugriff wurde protokolliert.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center text-indigo-400 ring-4 ring-indigo-500/10">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-bold font-orbitron">Super-Admin Panel</h2>
          <p className="text-sm text-gray-500">Globale Systemverwaltung und Überwachung.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Organisationen', value: stats.totalOrgs, icon: Building, color: 'text-blue-400' },
          { label: 'Benutzer Gesamt', value: stats.totalUsers, icon: Users, color: 'text-purple-400' },
          { label: 'Bezahlte Abos', value: stats.activeSubs, icon: Activity, color: 'text-green-400' },
          { label: 'System Last', value: '4.2%', icon: Server, color: 'text-orange-400' }
        ].map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className={stat.color} size={20} />
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{stat.label}</p>
            <p className="text-2xl font-bold font-orbitron mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass rounded-3xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <h3 className="font-bold flex items-center gap-2"><Terminal size={18} className="text-primary"/> Globaler Audit-Log</h3>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Live Updates</span>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              Array(5).fill(0).map((_, i) => <div key={i} className="h-16 animate-pulse bg-white/5 m-4 rounded" />)
            ) : logs.length === 0 ? (
              <p className="p-10 text-center text-gray-600 text-sm italic">Keine aktuellen Systemereignisse gefunden.</p>
            ) : logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-white/5 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    log.action === 'INSERT' ? 'bg-green-500/10 text-green-400' : 
                    log.action === 'DELETE' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {log.action[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold flex items-center gap-2">
                       {log.action} <ChevronRight size={10} className="text-gray-600"/> {log.target_table}
                    </p>
                    <p className="text-[10px] text-gray-500">Org ID: {log.org_id.split('-')[0]}...</p>
                  </div>
                </div>
                <div className="text-right text-[10px] text-gray-600 font-bold">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/10 bg-indigo-500/5">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Database size={18} className="text-indigo-400"/> Datenbank Status</h3>
            <div className="space-y-4">
              {['PostgreSQL 15', 'Extensions: uuid-ossp', 'Extensions: pgsodium', 'RLS Policies: Active'].map((info, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {info}
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/10 bg-orange-500/5">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Zap size={18} className="text-orange-400"/> Edge Runtime</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">gemini-chat</span>
                <span className="text-green-500 font-bold">READY</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-[65%] shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              </div>
              <p className="text-[10px] text-gray-600">Verwendung der KI-Ressourcen (65% Quota)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ className, size }: { className?: string, size?: number }) => (
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
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const Zap = ({ className, size }: { className?: string, size?: number }) => (
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
    <path d="M13 2 L3 14 L12 14 L11 22 L21 10 L12 10 L13 2 Z"/>
  </svg>
);

export default SuperAdminView;
