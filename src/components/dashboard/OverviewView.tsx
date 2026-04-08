import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { 
  Users, 
  TrendingUp, 
  Mail, 
  Calendar, 
  MessageSquare, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Zap,
  Target,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface OverviewStats {
  contacts: number;
  deals: number;
  value: number;
  campaigns: number;
  appointments: number;
  recentLogs: any[];
}

const OverviewView = () => {
  const { currentOrg, profile } = useOrg();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg) fetchDashboardData();
  }, [currentOrg]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // 1. Fetch Counts
    const [
      { count: contactCount },
      { data: deals },
      { count: campaignCount },
      { count: appointmentCount },
      { data: logs }
    ] = await Promise.all([
      supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('org_id', currentOrg?.id),
      supabase.from('deals').select('value, created_at').eq('org_id', currentOrg?.id),
      supabase.from('email_campaigns').select('*', { count: 'exact', head: true }).eq('org_id', currentOrg?.id),
      supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('org_id', currentOrg?.id),
      supabase.from('audit_logs').select('*').eq('org_id', currentOrg?.id).order('created_at', { ascending: false }).limit(5)
    ]);

    const totalValue = deals?.reduce((sum, d) => sum + Number(d.value), 0) || 0;

    setStats({
      contacts: contactCount || 0,
      deals: deals?.length || 0,
      value: totalValue,
      campaigns: campaignCount || 0,
      appointments: appointmentCount || 0,
      recentLogs: logs || []
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  // Sample Data for Charts (In a real app, this would come from the DB)
  const chartData = [
    { name: 'Mo', value: 400 },
    { name: 'Di', value: 300 },
    { name: 'Mi', value: 600 },
    { name: 'Do', value: 800 },
    { name: 'Fr', value: 500 },
    { name: 'Sa', value: 900 },
    { name: 'So', value: 1100 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold font-orbitron bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            Mission Control
          </h1>
          <p className="text-gray-500 mt-2">Willkommen zurück, {profile?.full_name?.split(' ')[0]}. Alles läuft nach Plan.</p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
          <div className="px-4 py-2 bg-primary/20 rounded-xl border border-primary/30 text-primary text-xs font-bold">LIVE</div>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mr-2">System Status: Optimal</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Umsatz (Pipeline)', value: `€${stats?.value.toLocaleString()}`, icon: TrendingUp, delta: '+12%', color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Neue Leads', value: stats?.contacts, icon: Users, delta: '+5%', color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Kampagnen', value: stats?.campaigns, icon: Mail, delta: 'Aktiv', color: 'text-purple-400', bg: 'bg-purple-500/10' },
          { label: 'Termine', value: stats?.appointments, icon: Calendar, delta: '-2%', color: 'text-yellow-400', bg: 'bg-yellow-500/10' }
        ].map((kpi, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="glass p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${kpi.bg} blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity`} />
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${kpi.color}`}>
                <kpi.icon size={20} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${kpi.delta.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-500'}`}>
                {kpi.delta} {kpi.delta.includes('%') && (kpi.delta.startsWith('+') ? <ArrowUpRight size={10} className="inline ml-0.5"/> : <ArrowDownRight size={10} className="inline ml-0.5"/>)}
              </span>
            </div>
            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{kpi.label}</p>
            <h3 className="text-2xl font-bold font-orbitron mt-2">{kpi.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-8 glass rounded-[2.5rem] border border-white/5 p-8 bg-gradient-to-br from-white/[0.02] to-transparent">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-bold font-orbitron flex items-center gap-2">
                <Activity size={20} className="text-primary" /> Performance Index
              </h3>
              <p className="text-xs text-gray-500">Wöchentliches Wachstum & Interaktion</p>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer">
              <option>Letzte 7 Tage</option>
              <option>Letzte 30 Tage</option>
            </select>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8a2be2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8a2be2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#666', fontSize: 10, fontWeight: 'bold' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }} 
                  itemStyle={{ color: '#8a2be2', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8a2be2" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Actions / AI */}
          <div className="p-8 rounded-[2.5rem] bg-primary relative overflow-hidden group shadow-2xl shadow-primary/20">
            <div className="absolute top-[-20%] right-[-20%] w-40 h-40 bg-white/20 rounded-full blur-[40px] group-hover:scale-125 transition-transform duration-700" />
            <Zap className="text-white mb-6 animate-pulse" size={32} />
            <h3 className="text-xl font-bold text-white font-orbitron mb-2">KI-Power Up</h3>
            <p className="text-white/70 text-xs leading-relaxed mb-6">Analysieren Sie Ihre Kampagnen mit Gemini Pro und steigern Sie die Conversion um bis zu 40%.</p>
            <button className="w-full py-3 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/80 transition-all text-xs">
              Jetzt analysieren <ChevronRight size={14}/>
            </button>
          </div>

          {/* Recent Activity */}
          <div className="glass rounded-[2.5rem] border border-white/5 p-8 flex flex-col h-full min-h-[400px]">
            <h3 className="text-xl font-bold font-orbitron mb-6 flex items-center gap-2">
              <Activity size={20} className="text-indigo-400" /> Aktivitäten
            </h3>
            <div className="space-y-6 flex-1">
              {stats?.recentLogs.length === 0 ? (
                <p className="text-xs text-gray-600 italic">Noch keine Aktivitäten.</p>
              ) : stats?.recentLogs.map((log, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                    log.action === 'INSERT' ? 'bg-green-500' :
                    log.action === 'DELETE' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">
                      {log.action} on {log.target_table}
                    </p>
                    <p className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-8 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:gap-2 transition-all">
              Alle Logs ansehen <ChevronRight size={12}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
