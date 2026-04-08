import { useState } from 'react';
import { Search, Bell, User, LogOut, HelpCircle, ShieldAlert } from 'lucide-react';
import { useOrg } from '../../contexts/OrgContext';
import { motion, AnimatePresence } from 'framer-motion';

const TopBar = () => {
  const { profile, user, signOut } = useOrg();
  const [showProfile, setShowProfile] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 h-20 bg-zinc-950/50 backdrop-blur-xl border-b border-white/5 z-40 flex items-center px-8 transition-all">
      <div className="flex-1 flex items-center gap-8">
        {/* Search Bar */}
        <div className={`relative max-w-md w-full transition-all duration-300 ${searchFocused ? 'scale-105' : ''}`}>
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-primary' : 'text-gray-500'}`} size={18} />
          <input 
            type="text" 
            placeholder="Globale Suche (Kontakte, Deals, Kampagnen)..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-2.5 pl-12 pr-4 text-xs font-bold outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:font-normal placeholder:text-gray-600" 
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
            <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md text-gray-500">⌘</span>
            <span className="text-[10px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md text-gray-500">K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-white/5 rounded-xl transition-all group">
          <Bell size={20} className="text-gray-400 group-hover:text-white" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-zinc-950" />
        </button>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 p-1.5 pr-4 hover:bg-white/5 rounded-2xl border border-transparent hover:border-white/10 transition-all group"
          >
            <div className="w-9 h-9 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 text-primary font-bold overflow-hidden ring-2 ring-primary/10 group-active:scale-95 transition-transform">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.[0].toUpperCase() || '?'
              )}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-black tracking-tight">{profile?.full_name || 'Benutzer'}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest leading-none">
                {profile?.is_super_admin ? 'Super Admin' : 'Benutzer'}
              </p>
            </div>
          </button>

          <AnimatePresence>
            {showProfile && (
              <>
                <div className="fixed inset-0 z-[-1]" onClick={() => setShowProfile(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-4 w-64 glass border border-white/10 rounded-3xl p-3 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-1 overflow-hidden"
                >
                  <div className="p-4 mb-2 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xs font-bold truncate">{user?.email}</p>
                    <p className="text-[9px] text-gray-500 mt-1 uppercase font-black tracking-widest leading-none">Eingeloggt seit Feb 2024</p>
                  </div>

                  <button className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-xs font-bold transition-all text-gray-400 hover:text-white group">
                    <User size={16} className="group-hover:text-primary transition-colors" /> Profil-Info
                  </button>
                  <button className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl text-xs font-bold transition-all text-gray-400 hover:text-white group">
                    <HelpCircle size={16} className="group-hover:text-primary transition-colors" /> Hilfe & Support
                  </button>
                  
                  {profile?.is_super_admin && (
                    <div className="pt-2">
                        <div className="h-px bg-white/5 mx-2 mb-2" />
                        <div className="px-4 py-2 flex items-center gap-2 text-[10px] text-yellow-500/60 font-black uppercase tracking-widest">
                            <ShieldAlert size={12}/> Admin Bereich
                        </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="h-px bg-white/5 mx-2 mb-2" />
                    <button 
                      onClick={signOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-bold text-xs"
                    >
                      <LogOut size={16} /> Abmelden
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
