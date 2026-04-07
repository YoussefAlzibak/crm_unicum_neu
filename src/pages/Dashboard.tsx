import { useState, useEffect } from 'react';
import { useOrg } from '../contexts/OrgContext';
import { Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, LogOut, TrendingUp, Mail, Calendar, Calculator, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ContactsView from '../components/dashboard/ContactsView';
import PipelineView from '../components/dashboard/PipelineView';
import MessagesView from '../components/dashboard/MessagesView';
import CampaignsView from '../components/dashboard/CampaignsView';
import BookingView from '../components/dashboard/BookingView';
import CalculatorView from '../components/dashboard/CalculatorView';
import BillingView from '../components/dashboard/BillingView';
import SuperAdminView from '../components/dashboard/SuperAdminView';

type View = 'overview' | 'contacts' | 'pipeline' | 'messages' | 'campaigns' | 'booking' | 'calculators' | 'billing' | 'super-admin' | 'settings';


const Dashboard = () => {
  const { user, profile, currentOrg, isLoading, signOut } = useOrg();
  const [activeView, setActiveView] = useState<View>('overview');
  const [stats, setStats] = useState({ contacts: 0, deals: 0, value: 0, tickets: 0, campaigns: 0, appointments: 0 });

  useEffect(() => {
    if (currentOrg) {
      fetchStats();
    }
  }, [currentOrg]);

  const fetchStats = async () => {
    // 1. Fetch Contact Count
    const { count: contactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', currentOrg?.id);

    // 2. Fetch Deal Stats
    const { data: dealData } = await supabase
      .from('deals')
      .select('value')
      .eq('org_id', currentOrg?.id);

    // 3. Fetch Ticket Count
    const { count: ticketCount } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', currentOrg?.id);

    // 4. Fetch Campaign Count
    const { count: campaignCount } = await supabase
      .from('email_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', currentOrg?.id);

    // 5. Fetch Appointment Count
    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', currentOrg?.id);

    const totalValue = dealData?.reduce((sum, d) => sum + Number(d.value), 0) || 0;

    setStats({
      contacts: contactCount || 0,
      deals: dealData?.length || 0,
      value: totalValue,
      tickets: ticketCount || 0,
      campaigns: campaignCount || 0,
      appointments: appointmentCount || 0
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'contacts': return <ContactsView />;
      case 'pipeline': return <PipelineView />;
      case 'messages': return <MessagesView />;
      case 'campaigns': return <CampaignsView />;
      case 'booking': return <BookingView />;
      case 'calculators': return <CalculatorView />;
      case 'billing': return <BillingView />;
      case 'super-admin': return <SuperAdminView />;
      case 'overview':
      default:
        return (
          <div className="space-y-8">
            <div className="glass p-8 rounded-3xl border border-white/10">
              <h1 className="text-3xl font-bold mb-2">Willkommen, {profile?.full_name || user.email}!</h1>
              <p className="text-gray-400 mb-8">Hier ist eine Übersicht Ihrer digitalen Transformation.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-primary/40 transition-all group">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Kontakte</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold font-orbitron">{stats.contacts}</p>
                    <Users className="text-gray-600 group-hover:text-primary transition-colors" size={20} />
                  </div>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-green-500/40 transition-all group">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Pipeline Wert</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold font-orbitron">€{stats.value.toLocaleString()}</p>
                    <TrendingUp className="text-gray-600 group-hover:text-green-500 transition-colors" size={20} />
                  </div>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-blue-500/40 transition-all group">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Tickets</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold font-orbitron">{stats.tickets}</p>
                    <MessageSquare className="text-gray-600 group-hover:text-blue-500 transition-colors" size={20} />
                  </div>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-purple-500/40 transition-all group">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Kampagnen</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold font-orbitron">{stats.campaigns}</p>
                    <Mail className="text-gray-600 group-hover:text-purple-500 transition-colors" size={20} />
                  </div>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-yellow-500/40 transition-all group">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Termine</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold font-orbitron">{stats.appointments}</p>
                    <Calendar className="text-gray-600 group-hover:text-yellow-500 transition-colors" size={20} />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Assistant Quick Entry */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-primary/10 p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden group">
                <span className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-[120px] select-none">✦</span>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold font-orbitron mb-2">KI-Assistent</h3>
                  <p className="text-gray-400 text-sm max-w-lg mb-6">Optimieren Sie Ihre Kundenkommunikation mit intelligenter Unterstützung. Gemini Pro hilft Ihnen beim Schreiben von E-Mails und Beantworten von Support-Anfragen.</p>
                  <button 
                    onClick={() => setActiveView('messages')}
                    className="bg-indigo-500/40 hover:bg-indigo-500/60 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all border border-indigo-500/30"
                  >
                    <MessageSquare size={20}/> Support Center öffnen
                  </button>
                </div>
                <div className="w-full md:w-80 bg-black/40 p-4 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-500">
                    <span className="text-xs">✉</span> Schnellversand Kampagne
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 w-3/4 bg-white/10 rounded"></div>
                    <div className="h-2 w-1/2 bg-white/10 rounded"></div>
                    <button 
                      onClick={() => setActiveView('campaigns')}
                      className="w-full py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/80 transition-all mt-2"
                    >
                      Jetzt erstellen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 space-y-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-6 font-orbitron transform hover:border-primary/50 transition-all group">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1 font-bold">Organisation</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/30">
                  {currentOrg?.name?.[0].toUpperCase()}
                </div>
                <p className="font-bold text-primary truncate flex-1" title={currentOrg?.name}>{currentOrg?.name || 'Lade...'}</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              {[
                { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
                { id: 'contacts', label: 'Kontakte', icon: Users },
                { id: 'pipeline', label: 'Pipelines', icon: TrendingUp },
                { id: 'messages', label: 'Support & KI', icon: MessageSquare },
                { id: 'booking', label: 'Terminkalender', icon: Calendar },
                { id: 'calculators', label: 'Preisrechner', icon: Calculator },
                { id: 'campaigns', label: 'Marketing', icon: Mail },
                { id: 'billing', label: 'Abrechnung', icon: CreditCard },
                { id: 'settings', label: 'Einstellungen', icon: Settings },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveView(item.id as View)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                    activeView === item.id 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={18} /> {item.label}
                </button>
              ))}
            </nav>

            <div className="pt-10">
              <div className="px-4 mb-4">
                <div className="h-px bg-white/10 w-full" />
              </div>
              <button 
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-bold"
              >
                <LogOut size={18} /> Abmelden
              </button>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
