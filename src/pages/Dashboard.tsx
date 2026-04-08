import { useState } from 'react';
import { useOrg } from '../contexts/OrgContext';
import { Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, TrendingUp, Mail, Calendar, Calculator, CreditCard, ShieldAlert } from 'lucide-react';
import ContactsView from '../components/dashboard/ContactsView';
import PipelineView from '../components/dashboard/PipelineView';
import MessagesView from '../components/dashboard/MessagesView';
import CampaignsView from '../components/dashboard/CampaignsView';
import BookingView from '../components/dashboard/BookingView';
import CalculatorView from '../components/dashboard/CalculatorView';
import BillingView from '../components/dashboard/BillingView';
import SuperAdminView from '../components/dashboard/SuperAdminView';
import SettingsView from '../components/dashboard/SettingsView';
import OverviewView from '../components/dashboard/OverviewView';
import TopBar from '../components/dashboard/TopBar';
import { AnimatePresence, motion } from 'framer-motion';

type View = 'overview' | 'contacts' | 'pipeline' | 'messages' | 'campaigns' | 'booking' | 'calculators' | 'billing' | 'super-admin' | 'settings';


const Dashboard = () => {
  const { user, profile, currentOrg, isLoading, signOut } = useOrg();
  const [activeView, setActiveView] = useState<View>('overview');
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
      case 'settings': return <SettingsView />;
      case 'overview':
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <TopBar />
      
      <div className="pt-20 lg:pl-64 transition-all">
        <aside className="fixed left-0 top-20 bottom-0 w-64 bg-zinc-950 border-r border-white/5 p-4 z-30 hidden lg:flex flex-col">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-6 font-orbitron group">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-black">Organisation</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                {currentOrg?.name?.[0].toUpperCase()}
              </div>
              <p className="font-bold text-sm truncate flex-1" title={currentOrg?.name}>{currentOrg?.name || '...'}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {[
              { id: 'overview', label: 'Übersicht', icon: LayoutDashboard },
              { id: 'contacts', label: 'Kontakte', icon: Users },
              { id: 'pipeline', label: 'Pipelines', icon: TrendingUp },
              { id: 'messages', label: 'Support & KI', icon: MessageSquare },
              { id: 'booking', label: 'Kalender', icon: Calendar },
              { id: 'calculators', label: 'Preise', icon: Calculator },
              { id: 'campaigns', label: 'Marketing', icon: Mail },
              { id: 'billing', label: 'Billing', icon: CreditCard },
              ...(profile?.is_super_admin ? [{ id: 'super-admin', label: 'Super Admin', icon: ShieldAlert }] : []),
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-xs ${
                  activeView === item.id 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                  : 'text-gray-500 hover:bg-white/5 hover:text-white'
                }`}
              >
                {/* @ts-ignore */}
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="p-8 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
