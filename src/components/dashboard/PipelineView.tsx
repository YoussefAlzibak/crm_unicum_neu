import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MoreVertical, DollarSign, User, X, Save, Trash2,
  TrendingUp, Target, BarChart3, ArrowRight, Settings,
  ChevronRight, Phone, Mail, Edit2, GripVertical
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pipeline {
  id: string;
  name: string;
}
interface Stage {
  id: string;
  name: string;
  order_index: number;
  pipeline_id: string;
}
interface Contact {
  id: string;
  full_name: string;
  email: string | null;
}
interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage_id: string;
  contact_id: string | null;
  created_at: string;
  contacts?: Contact;
}

// Stage colors cycling
const STAGE_COLORS = [
  'border-t-blue-500', 'border-t-purple-500', 'border-t-orange-500',
  'border-t-green-500', 'border-t-pink-500', 'border-t-cyan-500',
];
const STAGE_DOT = [
  'bg-blue-500', 'bg-purple-500', 'bg-orange-500',
  'bg-green-500', 'bg-pink-500', 'bg-cyan-500',
];

const fmt = (n: number, currency = 'EUR') =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

// ─── Deal Card ────────────────────────────────────────────────────────────────
interface DealCardProps {
  deal: Deal;
  colorClass: string;
  onEdit: (d: Deal) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: any, dealId: string) => void;
}
const DealCard = ({ deal, colorClass, onEdit, onDelete, onDragStart }: DealCardProps) => {
  const [menu, setMenu] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      draggable
      onDragStart={e => onDragStart(e, deal.id)}
      className="bg-zinc-900 border border-white/10 p-4 rounded-2xl shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing active:opacity-70 group relative select-none"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-gray-700 group-hover:text-gray-500 transition-colors shrink-0" />
          <h4 className="font-bold text-sm leading-tight">{deal.title}</h4>
        </div>
        <div className="relative">
          <button onClick={() => setMenu(m => !m)} className="text-gray-600 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all">
            <MoreVertical size={14} />
          </button>
          <AnimatePresence>
            {menu && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 top-7 z-50 bg-zinc-800 border border-white/10 rounded-2xl shadow-2xl p-1 min-w-[140px]">
                <button onClick={() => { onEdit(deal); setMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 rounded-xl font-bold transition-all">
                  <Edit2 size={12} /> Bearbeiten
                </button>
                <button onClick={() => { onDelete(deal.id); setMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-500/10 text-red-400 rounded-xl font-bold transition-all">
                  <Trash2 size={12} /> Löschen
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {deal.contacts && (
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-3">
          <User size={10} className="shrink-0" />
          <span className="truncate">{deal.contacts.full_name}</span>
        </div>
      )}

      <div className={`flex items-center gap-1.5 text-sm font-black font-orbitron mt-2 ${colorClass.includes('blue') ? 'text-blue-400' : colorClass.includes('purple') ? 'text-purple-400' : colorClass.includes('green') ? 'text-green-400' : 'text-primary'}`}>
        <DollarSign size={13} />
        {fmt(deal.value, deal.currency)}
      </div>
    </motion.div>
  );
};

// ─── Deal Modal ───────────────────────────────────────────────────────────────
interface DealModalProps {
  deal: Partial<Deal> | null;
  stages: Stage[];
  contacts: Contact[];
  onSave: (data: Partial<Deal>) => void;
  onClose: () => void;
}
const DealModal = ({ deal, stages, contacts, onSave, onClose }: DealModalProps) => {
  const [form, setForm] = useState({
    title: deal?.title || '',
    value: deal?.value || 0,
    currency: deal?.currency || 'EUR',
    stage_id: deal?.stage_id || stages[0]?.id || '',
    contact_id: deal?.contact_id || '',
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-orbitron">{deal?.id ? 'Deal bearbeiten' : 'Neuer Deal'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Titel *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="z.B. Website Redesign für Kunde X" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Wert</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" min={0} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Währung</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold">
                <option>EUR</option><option>USD</option><option>CHF</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Pipeline-Stufe</label>
            <select value={form.stage_id} onChange={e => setForm(f => ({ ...f, stage_id: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold">
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Kontakt</label>
            <select value={form.contact_id} onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50">
              <option value="">— Kein Kontakt —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name}{c.email ? ` (${c.email})` : ''}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all">Abbrechen</button>
          <button onClick={() => onSave(form)} disabled={!form.title} className="flex-1 py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-lg shadow-primary/20">
            <Save size={16} /> Speichern
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Setup Modal (Pipeline + Stages) ─────────────────────────────────────────
interface SetupModalProps {
  pipeline: Pipeline | null;
  stages: Stage[];
  onSave: (pipelineName: string, stageNames: string[]) => void;
  onClose: () => void;
}
const SetupModal = ({ pipeline, stages, onSave, onClose }: SetupModalProps) => {
  const [name, setName] = useState(pipeline?.name || 'Verkaufs-Pipeline');
  const [stageNames, setStageNames] = useState<string[]>(
    stages.length > 0 ? stages.map(s => s.name) : ['Lead', 'Kontakt aufgenommen', 'Angebot gesendet', 'Verhandlung', 'Abschluss']
  );
  const addStage = () => setStageNames(s => [...s, '']);
  const removeStage = (i: number) => setStageNames(s => s.filter((_, idx) => idx !== i));
  const updateStage = (i: number, v: string) => setStageNames(s => s.map((x, idx) => idx === i ? v : x));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold font-orbitron">Pipeline konfigurieren</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-gray-400"><X size={18} /></button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Pipeline-Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-3 uppercase">Stufen</label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {stageNames.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${STAGE_DOT[i % STAGE_DOT.length]}`} />
                  <input value={s} onChange={e => updateStage(i, e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                  <button onClick={() => removeStage(i)} className="text-gray-600 hover:text-red-400 p-1 transition-colors"><X size={14} /></button>
                </div>
              ))}
            </div>
            <button onClick={addStage} className="mt-3 flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors">
              <Plus size={14} /> Stufe hinzufügen
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all">Abbrechen</button>
          <button onClick={() => onSave(name, stageNames.filter(Boolean))} disabled={!name || stageNames.filter(Boolean).length === 0}
            className="flex-1 py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-lg shadow-primary/20">
            <Save size={16} /> Speichern
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PipelineView = () => {
  const { currentOrg } = useOrg();

  const [view, setView] = useState<'kanban' | 'analytics'>('kanban');
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [dealModal, setDealModal] = useState<{ deal: Partial<Deal> | null; open: boolean }>({ deal: null, open: false });
  const [setupModal, setSetupModal] = useState(false);

  // Drag-and-Drop state
  const draggingDealId = useRef<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrg) loadAll();
  }, [currentOrg]);

  const loadAll = async () => {
    setLoading(true);
    // Pipeline
    const { data: pip } = await supabase.from('pipelines').select('*').eq('org_id', currentOrg?.id).single();
    if (pip) setPipeline(pip);

    // Stages
    if (pip) {
      const { data: st } = await supabase.from('pipeline_stages').select('*').eq('pipeline_id', pip.id).order('order_index');
      if (st) setStages(st);
    }

    // Deals with contact info
    const { data: dl } = await supabase.from('deals').select('*, contacts(id, full_name, email)').eq('org_id', currentOrg?.id);
    if (dl) setDeals(dl as Deal[]);

    // Contacts for selector
    const { data: ct } = await supabase.from('contacts').select('id, full_name, email').eq('org_id', currentOrg?.id).order('full_name');
    if (ct) setContacts(ct);

    setLoading(false);
  };

  // ── Pipeline Setup ──────────────────────────────────────────────────────────
  const handleSetup = async (pipelineName: string, stageNames: string[]) => {
    if (!currentOrg) return;
    let pipId = pipeline?.id;

    if (!pipId) {
      const { data: p } = await supabase.from('pipelines').insert({ org_id: currentOrg.id, name: pipelineName }).select().single();
      if (p) pipId = p.id;
    } else {
      await supabase.from('pipelines').update({ name: pipelineName }).eq('id', pipId);
      await supabase.from('pipeline_stages').delete().eq('pipeline_id', pipId);
    }

    if (!pipId) return;
    await supabase.from('pipeline_stages').insert(
      stageNames.map((name, i) => ({ pipeline_id: pipId, name, order_index: i }))
    );

    setSetupModal(false);
    await loadAll();
  };

  // ── Deal CRUD ───────────────────────────────────────────────────────────────
  const saveDeal = async (data: Partial<Deal>) => {
    if (!currentOrg) return;
    const payload = { title: data.title!, value: data.value || 0, currency: data.currency || 'EUR', stage_id: data.stage_id!, contact_id: data.contact_id || null };

    if (dealModal.deal?.id) {
      await supabase.from('deals').update(payload).eq('id', dealModal.deal.id);
    } else {
      await supabase.from('deals').insert({ ...payload, org_id: currentOrg.id });
    }
    setDealModal({ deal: null, open: false });
    await loadAll();
  };

  const deleteDeal = async (id: string) => {
    await supabase.from('deals').delete().eq('id', id);
    setDeals(d => d.filter(x => x.id !== id));
  };

  // ── Drag and Drop ───────────────────────────────────────────────────────────
  const handleDragStart = (e: any, dealId: string) => {
    draggingDealId.current = dealId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: any, stageId: string) => {
    e.preventDefault();
    const id = draggingDealId.current;
    if (!id || id === stageId) { setDragOverStage(null); return; }
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage_id: stageId } : d));
    await supabase.from('deals').update({ stage_id: stageId }).eq('id', id);
    draggingDealId.current = null;
    setDragOverStage(null);
  };

  // ── Analytics ───────────────────────────────────────────────────────────────
  const totalValue = deals.reduce((s, d) => s + Number(d.value), 0);
  const wonStage = stages[stages.length - 1];
  const wonDeals = wonStage ? deals.filter(d => d.stage_id === wonStage.id) : [];
  const wonValue = wonDeals.reduce((s, d) => s + Number(d.value), 0);
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-1">
        <div>
          <h2 className="text-2xl font-bold font-orbitron">Sales Pipeline</h2>
          <p className="text-sm text-gray-500">{pipeline ? pipeline.name : 'Noch keine Pipeline eingerichtet'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button onClick={() => setView('kanban')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'kanban' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>Kanban</button>
            <button onClick={() => setView('analytics')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'analytics' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>Analytics</button>
          </div>
          <button onClick={() => setSetupModal(true)} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all" title="Pipeline konfigurieren">
            <Settings size={18} />
          </button>
          <button onClick={() => setDealModal({ deal: { stage_id: stages[0]?.id }, open: true })} disabled={stages.length === 0}
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105 disabled:opacity-40">
            <Plus size={18} /> Neuer Deal
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════ KANBAN ══════════════════ */}
        {view === 'kanban' && (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 overflow-hidden"
          >
            {loading ? (
              <div className="flex gap-5 overflow-x-auto pb-4">
                {Array(4).fill(0).map((_, i) => (
                  <div key={i} className="min-w-[280px] w-72 bg-white/5 rounded-3xl border border-white/10 p-5 animate-pulse space-y-3">
                    <div className="h-4 w-1/2 bg-white/10 rounded" /><div className="h-24 bg-white/10 rounded-2xl" /><div className="h-24 bg-white/10 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : stages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl border border-dashed border-white/10 text-center">
                <Target size={48} className="text-gray-600 mb-4" />
                <h3 className="text-xl font-bold mb-2">Pipeline noch nicht eingerichtet</h3>
                <p className="text-gray-500 text-sm max-w-sm mb-6">Erstellen Sie Ihre Pipeline-Stufen (z.B. Lead → Angebot → Abschluss) um Deals zu verwalten.</p>
                <button onClick={() => setSetupModal(true)} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary/80 transition-all shadow-lg shadow-primary/20">
                  <Plus size={16} className="inline mr-2" />Pipeline jetzt einrichten
                </button>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-6 h-full" style={{ minHeight: '600px' }}>
                {stages.map((stage, idx) => {
                  const stageDeals = deals.filter(d => d.stage_id === stage.id);
                  const stageValue = stageDeals.reduce((s, d) => s + Number(d.value), 0);
                  const colorClass = STAGE_COLORS[idx % STAGE_COLORS.length];
                  const dotClass = STAGE_DOT[idx % STAGE_DOT.length];
                  const isOver = dragOverStage === stage.id;

                  return (
                    <div key={stage.id}
                      className="min-w-[270px] w-72 flex flex-col gap-3 shrink-0"
                      onDragOver={e => { e.preventDefault(); setDragOverStage(stage.id); }}
                      onDragLeave={() => setDragOverStage(null)}
                      onDrop={e => handleDrop(e, stage.id)}
                    >
                      {/* Column header */}
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
                          <span className="font-bold text-sm text-gray-200">{stage.name}</span>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-400 font-bold">{stageDeals.length}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-500">{fmt(stageValue)}</span>
                      </div>

                      {/* Drop zone */}
                      <div className={`flex-1 rounded-3xl p-3 border transition-all space-y-3 ${isOver ? 'bg-primary/5 border-primary/30' : 'bg-white/[0.03] border-white/[0.05]'} border-t-2 ${colorClass}`}
                        style={{ minHeight: '400px' }}
                      >
                        {stageDeals.length === 0 && !isOver && (
                          <div className="flex items-center justify-center h-20 text-gray-700 text-xs italic">Leer</div>
                        )}
                        {stageDeals.map(deal => (
                          <DealCard
                            key={deal.id}
                            deal={deal}
                            colorClass={colorClass}
                            onEdit={d => setDealModal({ deal: d, open: true })}
                            onDelete={deleteDeal}
                            onDragStart={handleDragStart}
                          />
                        ))}
                        <button
                          onClick={() => setDealModal({ deal: { stage_id: stage.id }, open: true })}
                          className="w-full py-2.5 border-2 border-dashed border-white/5 hover:border-white/20 rounded-2xl text-gray-600 hover:text-gray-400 transition-all text-xs flex items-center justify-center gap-2"
                        >
                          <Plus size={14} /> Hinzufügen
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════ ANALYTICS ══════════════════ */}
        {view === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Pipeline-Wert', value: fmt(totalValue), icon: DollarSign, color: 'text-primary', bg: 'from-primary/10' },
                { label: 'Gewonnene Deals', value: fmt(wonValue), icon: TrendingUp, color: 'text-green-400', bg: 'from-green-500/10' },
                { label: 'Win Rate', value: `${winRate}%`, icon: Target, color: 'text-purple-400', bg: 'from-purple-500/10' },
                { label: 'Deals gesamt', value: deals.length.toString(), icon: BarChart3, color: 'text-blue-400', bg: 'from-blue-500/10' },
              ].map((s, i) => (
                <div key={i} className={`glass p-6 rounded-3xl border border-white/10 bg-gradient-to-br ${s.bg} to-transparent`}>
                  <s.icon className={`${s.color} mb-4`} size={24} />
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{s.label}</p>
                  <p className="text-2xl font-bold font-orbitron mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Stage Funnel */}
            <div className="glass p-8 rounded-3xl border border-white/10">
              <h3 className="text-lg font-bold font-orbitron mb-8 flex items-center gap-2"><TrendingUp className="text-primary" size={20} /> Pipeline-Funnel</h3>
              <div className="space-y-4">
                {stages.map((stage, idx) => {
                  const count = deals.filter(d => d.stage_id === stage.id).length;
                  const value = deals.filter(d => d.stage_id === stage.id).reduce((s, d) => s + Number(d.value), 0);
                  const pct = deals.length > 0 ? (count / deals.length) * 100 : 0;
                  return (
                    <div key={stage.id} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${STAGE_DOT[idx % STAGE_DOT.length]}`} />
                          <span className="text-gray-300">{stage.name}</span>
                          <span className="text-gray-600">({count})</span>
                        </div>
                        <span className="text-gray-400">{fmt(value)}</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className={`h-full ${STAGE_DOT[idx % STAGE_DOT.length].replace('bg-', 'bg-')} opacity-80 shadow-lg`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deals List */}
            <div className="glass rounded-3xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
                <h3 className="font-bold font-orbitron flex items-center gap-2"><BarChart3 className="text-primary" size={18} /> Alle Deals</h3>
                <span className="text-xs text-gray-500 font-bold">{deals.length} Deals · {fmt(totalValue)}</span>
              </div>
              {deals.length === 0 ? (
                <div className="p-16 text-center text-gray-500 text-sm">Noch keine Deals vorhanden.</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {[...deals].sort((a, b) => Number(b.value) - Number(a.value)).map(deal => {
                    const stage = stages.find(s => s.id === deal.stage_id);
                    const idx = stages.findIndex(s => s.id === deal.stage_id);
                    return (
                      <div key={deal.id} className="p-4 hover:bg-white/5 transition-all flex items-center gap-4 group">
                        <div className={`w-2 h-8 rounded-full shrink-0 ${STAGE_DOT[idx % STAGE_DOT.length]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{deal.title}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <ChevronRight size={10} />
                            {stage?.name || '—'}
                            {deal.contacts && <><span>·</span><User size={10} />{deal.contacts.full_name}</>}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-orbitron font-bold text-sm">{fmt(deal.value, deal.currency)}</p>
                          <p className="text-[10px] text-gray-600">{new Date(deal.created_at).toLocaleDateString('de-DE')}</p>
                        </div>
                        <button onClick={() => setDealModal({ deal, open: true })} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {dealModal.open && (
          <DealModal deal={dealModal.deal} stages={stages} contacts={contacts} onSave={saveDeal} onClose={() => setDealModal({ deal: null, open: false })} />
        )}
        {setupModal && (
          <SetupModal pipeline={pipeline} stages={stages} onSave={handleSetup} onClose={() => setSetupModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PipelineView;
