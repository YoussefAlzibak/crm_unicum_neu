import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { motion } from 'framer-motion';
import { LayoutDashboard, Plus, MoreVertical, DollarSign, User } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  order_index: number;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage_id: string;
  contact_id: string;
}

const PipelineView = () => {
  const { currentOrg } = useOrg();
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrg) {
      fetchPipelineData();
    }
  }, [currentOrg]);

  const fetchPipelineData = async () => {
    setLoading(true);
    // 1. Fetch Stages
    const { data: stageData } = await supabase
      .from('pipeline_stages')
      .select('id, name, order_index')
      .order('order_index', { ascending: true });

    if (stageData) setStages(stageData);

    // 2. Fetch Deals
    const { data: dealData } = await supabase
      .from('deals')
      .select('*')
      .eq('org_id', currentOrg?.id);

    if (dealData) setDeals(dealData);
    setLoading(false);
  };

  const getDealsForStage = (stageId: string) => {
    return deals.filter(d => d.stage_id === stageId);
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-2xl font-bold font-orbitron">Sales Pipeline</h2>
          <p className="text-sm text-gray-500">Verwalten Sie Ihre Verkaufschancen visuell.</p>
        </div>
        <button className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all transform hover:scale-105">
          <Plus size={20} /> Neuer Deal
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="min-w-[300px] w-80 bg-white/5 rounded-3xl border border-white/10 p-6 animate-pulse">
              <div className="h-6 w-1/2 bg-white/10 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-24 w-full bg-white/10 rounded-2xl"></div>
                <div className="h-24 w-full bg-white/10 rounded-2xl"></div>
              </div>
            </div>
          ))
        ) : stages.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center p-20 text-center glass rounded-3xl border border-white/10">
            <LayoutDashboard size={48} className="text-gray-600 mb-4" />
            <p className="text-gray-400 max-w-sm">Noch keine Pipeline-Stufen eingerichtet. Erstellen Sie Stufen wie 'Lead', 'Angebot' oder 'Abschluss'.</p>
            <button className="mt-4 text-primary font-bold hover:underline">Stufen jetzt einrichten</button>
          </div>
        ) : (
          stages.map((stage) => {
            const stageDeals = getDealsForStage(stage.id);
            const totalValue = stageDeals.reduce((sum, d) => sum + Number(d.value), 0);

            return (
              <div key={stage.id} className="min-w-[300px] w-80 flex flex-col gap-4">
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-orbitron text-gray-300">{stage.name}</span>
                    <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded-full text-gray-400">{stageDeals.length}</span>
                  </div>
                  <div className="text-xs text-primary font-bold">€{totalValue.toLocaleString()}</div>
                </div>

                <div className="flex-1 bg-white/[0.03] rounded-3xl p-4 border border-white/[0.05] space-y-4 min-h-[500px]">
                  {stageDeals.map((deal) => (
                    <motion.div
                      key={deal.id}
                      layoutId={deal.id}
                      className="bg-zinc-900 border border-white/10 p-4 rounded-2xl shadow-lg hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-sm">{deal.title}</h4>
                        <button className="text-gray-600 hover:text-white"><MoreVertical size={14} /></button>
                      </div>
                      
                      <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1 text-gray-400">
                          <DollarSign size={10} className="text-green-500" />
                          <span className="font-bold text-gray-300">{deal.value} {deal.currency}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <User size={10} /> {deal.id.slice(0, 4)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <button className="w-full py-3 border-2 border-dashed border-white/5 rounded-2xl text-gray-600 hover:border-white/10 hover:text-gray-400 transition-all text-sm flex items-center justify-center gap-2">
                    <Plus size={16} /> Deal hinzufügen
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PipelineView;
