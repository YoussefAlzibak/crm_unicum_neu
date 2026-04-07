import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import {
  Calculator, Plus, Settings, Trash2, Eye, BarChart3,
  Save, X, CheckCircle, ArrowLeft, ArrowRight, Type,
  List, Hash, ChevronDown, Edit2, Euro, Percent
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CalculatorWidget from './CalculatorWidget';
import type { CalcDef, CalcField, CalcOption } from './CalculatorWidget';


// ─── Types ───────────────────────────────────────────────────────────────────
interface CalcResult {
  id: string;
  calculator_id: string;
  total_price: number;
  selections: Record<string, any>;
  created_at: string;
  calculator?: { name: string };
}

// ─── Field Icon helper ────────────────────────────────────────────────────────
const FieldTypeIcon = ({ type }: { type: string }) => {
  if (type === 'select') return <List size={14} />;
  if (type === 'checkbox') return <CheckCircle size={14} />;
  return <Hash size={14} />;
};

// ─── Default empty calculator ─────────────────────────────────────────────────
const emptyCalc = (): Omit<CalcDef, 'id' | 'org_id'> => ({
  name: '',
  description: '',
  base_price: 0,
  currency: 'EUR',
  configuration: [],
});

// ─── Main Component ───────────────────────────────────────────────────────────
const CalculatorView = () => {
  const { currentOrg } = useOrg();

  const [view, setView] = useState<'list' | 'editor' | 'preview' | 'leads'>('list');
  const [calculators, setCalculators] = useState<CalcDef[]>([]);
  const [results, setResults] = useState<CalcResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editingCalc, setEditingCalc] = useState<CalcDef | null>(null);
  const [draft, setDraft] = useState(emptyCalc());
  const [editorStep, setEditorStep] = useState(0);

  // Field being added
  const [newField, setNewField] = useState<Partial<CalcField>>({ type: 'select', label: '' });
  const [newOption, setNewOption] = useState<Partial<CalcOption>>({ label: '', price_impact: 0, impact_type: 'fixed' });
  const [fieldOptions, setFieldOptions] = useState<CalcOption[]>([]);

  useEffect(() => {
    if (currentOrg) { fetchCalculators(); fetchResults(); }
  }, [currentOrg]);

  const fetchCalculators = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('calculators').select('*')
      .eq('org_id', currentOrg?.id).order('created_at', { ascending: false });
    if (data) setCalculators(data as CalcDef[]);
    setLoading(false);
  };

  const fetchResults = async () => {
    const { data } = await supabase
      .from('calculator_results')
      .select('*, calculator:calculators(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setResults(data as CalcResult[]);
  };

  // ── Editor helpers ──────────────────────────────────────────────────────────
  const openNewEditor = () => {
    setEditingCalc(null);
    setDraft(emptyCalc());
    setEditorStep(0);
    setNewField({ type: 'select', label: '' });
    setFieldOptions([]);
    setView('editor');
  };

  const openEditEditor = (calc: CalcDef) => {
    setEditingCalc(calc);
    setDraft({ name: calc.name, description: calc.description, base_price: calc.base_price, currency: calc.currency, configuration: [...calc.configuration] });
    setEditorStep(0);
    setView('editor');
  };

  const addFieldOption = () => {
    if (!newOption.label) return;
    setFieldOptions(prev => [...prev, { label: newOption.label!, price_impact: newOption.price_impact || 0, impact_type: newOption.impact_type || 'fixed' }]);
    setNewOption({ label: '', price_impact: 0, impact_type: 'fixed' });
  };

  const addField = () => {
    if (!newField.label) return;
    const field: CalcField = {
      id: crypto.randomUUID(),
      label: newField.label!,
      type: newField.type as 'select' | 'checkbox' | 'number',
      options: newField.type === 'select' ? [...fieldOptions] : undefined,
      price_impact: newField.type !== 'select' ? (newField.price_impact || 0) : undefined,
      impact_type: newField.type !== 'select' ? (newField.impact_type || 'fixed') : undefined,
      min: newField.type === 'number' ? (newField.min || 0) : undefined,
      max: newField.type === 'number' ? newField.max : undefined,
      required: newField.required,
    };
    setDraft(d => ({ ...d, configuration: [...d.configuration, field] }));
    setNewField({ type: 'select', label: '' });
    setFieldOptions([]);
  };

  const removeField = (id: string) => {
    setDraft(d => ({ ...d, configuration: d.configuration.filter(f => f.id !== id) }));
  };

  const saveCalculator = async () => {
    if (!draft.name || !currentOrg) return;
    setSaving(true);
    if (editingCalc) {
      await supabase.from('calculators').update({ ...draft }).eq('id', editingCalc.id);
    } else {
      await supabase.from('calculators').insert({ ...draft, org_id: currentOrg.id });
    }
    setSaving(false);
    await fetchCalculators();
    setView('list');
  };

  const deleteCalculator = async (id: string) => {
    await supabase.from('calculators').delete().eq('id', id);
    setCalculators(prev => prev.filter(c => c.id !== id));
  };

  // ── Preview helper ──────────────────────────────────────────────────────────
  const previewCalc: CalcDef = { ...draft, id: 'preview', org_id: currentOrg?.id };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-orbitron">
            {view === 'editor' ? (editingCalc ? 'Rechner bearbeiten' : 'Neuer Preisrechner') : view === 'preview' ? 'Vorschau' : 'Preisrechner-Module'}
          </h2>
          <p className="text-sm text-gray-500">
            {view === 'list' ? 'Erstellen Sie interaktive Kostenkalkulatoren für Ihre Kunden.' : view === 'editor' ? `Schritt ${editorStep + 1} von 3` : 'So sieht der Rechner für Ihre Kunden aus.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'list' && (
            <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition-all">
              <ArrowLeft size={16} /> Zurück
            </button>
          )}
          {view === 'list' && (
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={() => setView('list')} className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white shadow-lg">Meine Rechner</button>
              <button onClick={() => setView('leads')} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all">Leads</button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════ LIST VIEW ══════════════════ */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* New Calculator Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={openNewEditor}
                className="min-h-[220px] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-white/10">
                  <Plus size={32} className="text-primary" />
                </div>
                <span className="font-bold text-lg">Neuer Rechner</span>
                <p className="text-xs text-gray-500 text-center mt-2">Konfigurator starten.</p>
              </motion.button>

              {loading
                ? Array(2).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse border border-white/10" />)
                : calculators.map(calc => (
                  <motion.div
                    key={calc.id}
                    whileHover={{ y: -5 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:shadow-2xl transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
                        <Calculator size={24} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditEditor(calc)} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5"><Edit2 size={16} /></button>
                        <button onClick={() => { setDraft({ name: calc.name, description: calc.description, base_price: calc.base_price, currency: calc.currency, configuration: calc.configuration }); setView('preview'); }} className="p-2 text-gray-500 hover:text-primary rounded-lg hover:bg-primary/5"><Eye size={16} /></button>
                        <button onClick={() => deleteCalculator(calc.id)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/5"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{calc.name}</h3>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2">{calc.description}</p>
                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className="text-[10px] px-2 py-1 bg-white/5 rounded-full border border-white/10">{calc.configuration.length} Felder</span>
                    </div>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-600 uppercase font-bold">Basispreis</p>
                        <p className="font-orbitron font-bold">€{(calc.base_price || 0).toLocaleString('de-DE')}</p>
                      </div>
                      <button onClick={() => { setDraft({ ...calc }); setView('preview'); }} className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl border border-primary/20 transition-all flex items-center gap-1">
                        <Eye size={13} /> Vorschau
                      </button>
                    </div>
                  </motion.div>
                ))
              }
            </div>
          </motion.div>
        )}

        {/* ══════════════════ LEADS VIEW ══════════════════ */}
        {view === 'leads' && (
          <motion.div key="leads" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                <button onClick={() => setView('list')} className="px-4 py-2 rounded-lg text-xs font-bold text-gray-400 hover:text-white transition-all">Meine Rechner</button>
                <button onClick={() => setView('leads')} className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white shadow-lg">Leads</button>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20 text-xs font-bold">
                <BarChart3 size={14} /> {results.length} Anfragen gesamt
              </div>
            </div>

            <div className="glass rounded-3xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-white/[0.02]">
                <h3 className="font-bold font-orbitron">Kalkulations-Leads</h3>
                <p className="text-xs text-gray-500">Alle Anfragen, die über Ihre Preisrechner generiert wurden.</p>
              </div>
              {results.length === 0 ? (
                <div className="p-20 text-center">
                  <BarChart3 className="mx-auto text-gray-600 mb-4" size={40} />
                  <p className="text-gray-500 text-sm">Noch keine Anfragen vorhanden.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {results.map(r => (
                    <div key={r.id} className="p-4 hover:bg-white/5 transition-all flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{r.selections._contact?.name || 'Anonym'}</p>
                        <p className="text-xs text-gray-500">{r.selections._contact?.email || '—'} · {r.calculator?.name || 'Unbekannt'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-orbitron font-bold text-primary">€{r.total_price.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-gray-600">{new Date(r.created_at).toLocaleString('de-DE')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════ PREVIEW VIEW ══════════════════ */}
        {view === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto">
            <CalculatorWidget calculator={previewCalc} previewMode={true} />
          </motion.div>
        )}

        {/* ══════════════════ EDITOR VIEW ══════════════════ */}
        {view === 'editor' && (
          <motion.div key="editor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Step indicator */}
            <div className="flex items-center gap-2">
              {['Grunddaten', 'Felder', 'Vorschau & Speichern'].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setEditorStep(i)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${editorStep === i ? 'bg-primary text-white' : editorStep > i ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center border border-current text-[10px]">{i + 1}</span>
                    <span className="hidden sm:block">{s}</span>
                  </button>
                  {i < 2 && <div className={`h-px flex-1 min-w-[20px] ${editorStep > i ? 'bg-primary/40' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>

            {/* ── Step 0: Grunddaten ── */}
            {editorStep === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-3xl border border-white/10 space-y-6">
                  <h3 className="text-lg font-bold font-orbitron flex items-center gap-2"><Type size={20} className="text-primary" /> Grunddaten</h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Name des Rechners *</label>
                    <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="z.B. Webseiten-Kalkulator" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Beschreibung</label>
                    <textarea value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} rows={3} placeholder="Kurze Erklärung für Ihre Kunden..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Basispreis (€)</label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input type="number" value={draft.base_price} onChange={e => setDraft(d => ({ ...d, base_price: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" min={0} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Währung</label>
                      <select value={draft.currency} onChange={e => setDraft(d => ({ ...d, currency: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold">
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                        <option value="CHF">CHF</option>
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setEditorStep(1)} disabled={!draft.name} className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary/80 transition-all">
                    Weiter zu Feldern <ArrowRight size={18} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="glass p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5">
                    <h4 className="font-bold mb-3 text-indigo-300">💡 Tipps</h4>
                    <ul className="text-xs text-gray-400 space-y-2">
                      <li>• Der <b>Basispreis</b> ist der Startpreis vor allen Optionen.</li>
                      <li>• Im nächsten Schritt fügen Sie <b>Felder</b> hinzu (Auswahl, Checkbox, Zahl).</li>
                      <li>• Jedes Feld kann den Preis <b>fest</b> (z.B. +200€) oder <b>prozentual</b> (z.B. +15%) verändern.</li>
                    </ul>
                  </div>
                  <div className="glass p-6 rounded-3xl border border-white/10 bg-white/[0.02]">
                    <h4 className="font-bold mb-1">Vorschau</h4>
                    <p className="text-xs text-gray-500 mb-3">So beginnt Ihr Rechner:</p>
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-white/10 text-center">
                      <p className="text-lg font-bold font-orbitron text-primary">{draft.name || 'Rechner-Name'}</p>
                      <p className="text-xs text-gray-500 mt-1">{draft.description || 'Beschreibung...'}</p>
                      <p className="text-2xl font-black font-orbitron mt-3">€{draft.base_price.toLocaleString('de-DE')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Felder ── */}
            {editorStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Add Field Form */}
                <div className="glass p-8 rounded-3xl border border-white/10 space-y-5">
                  <h3 className="text-lg font-bold font-orbitron flex items-center gap-2"><List size={20} className="text-primary" /> Feld hinzufügen</h3>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Bezeichnung</label>
                    <input value={newField.label || ''} onChange={e => setNewField(f => ({ ...f, label: e.target.value }))} placeholder="z.B. Projektgröße" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Feldtyp</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: 'select', label: 'Auswahl', icon: ChevronDown },
                        { v: 'checkbox', label: 'Checkbox', icon: CheckCircle },
                        { v: 'number', label: 'Zahl', icon: Hash },
                      ].map(({ v, label, icon: Icon }) => (
                        <button key={v} onClick={() => setNewField(f => ({ ...f, type: v as any }))}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-bold transition-all ${newField.type === v ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'}`}>
                          <Icon size={18} />{label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select: options */}
                  {newField.type === 'select' && (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase">Optionen</label>
                      {fieldOptions.map((o, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/10 text-xs">
                          <span className="font-bold">{o.label}</span>
                          <span className="text-green-400">{o.impact_type === 'percentage' ? `+${o.price_impact}%` : `+€${o.price_impact}`}</span>
                        </div>
                      ))}
                      <div className="grid grid-cols-2 gap-2">
                        <input value={newOption.label || ''} onChange={e => setNewOption(o => ({ ...o, label: e.target.value }))} placeholder="Option Name" className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50 col-span-2" />
                        <div className="flex gap-1">
                          <input type="number" value={newOption.price_impact || ''} onChange={e => setNewOption(o => ({ ...o, price_impact: Number(e.target.value) }))} placeholder="Preis" className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary/50" />
                          <button onClick={() => setNewOption(o => ({ ...o, impact_type: o.impact_type === 'fixed' ? 'percentage' : 'fixed' }))}
                            className="w-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary transition-all">
                            {newOption.impact_type === 'fixed' ? <Euro size={14} /> : <Percent size={14} />}
                          </button>
                        </div>
                        <button onClick={addFieldOption} className="py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"><Plus size={12} /> Option</button>
                      </div>
                    </div>
                  )}

                  {/* Checkbox / Number: price impact */}
                  {(newField.type === 'checkbox' || newField.type === 'number') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Preisauswirkung</label>
                        <input type="number" value={newField.price_impact || ''} onChange={e => setNewField(f => ({ ...f, price_impact: Number(e.target.value) }))} placeholder="0" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Typ</label>
                        <div className="flex gap-1">
                          <button onClick={() => setNewField(f => ({ ...f, impact_type: 'fixed' }))} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${newField.impact_type !== 'percentage' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-500'}`}><Euro size={14} className="mx-auto" /></button>
                          <button onClick={() => setNewField(f => ({ ...f, impact_type: 'percentage' }))} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${newField.impact_type === 'percentage' ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-gray-500'}`}><Percent size={14} className="mx-auto" /></button>
                        </div>
                      </div>
                      {newField.type === 'number' && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Min</label>
                            <input type="number" value={newField.min || ''} onChange={e => setNewField(f => ({ ...f, min: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Max</label>
                            <input type="number" value={newField.max || ''} onChange={e => setNewField(f => ({ ...f, max: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/50 text-sm" />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <button onClick={addField} disabled={!newField.label} className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 transition-all text-sm">
                    <Plus size={16} /> Feld hinzufügen
                  </button>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setEditorStep(0)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">Zurück</button>
                    <button onClick={() => setEditorStep(2)} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/80 transition-all">
                      Vorschau <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Right: Current fields */}
                <div className="space-y-4">
                  <div className="glass p-6 rounded-3xl border border-white/10">
                    <h4 className="font-bold mb-4 flex items-center gap-2"><Settings size={16} className="text-primary" /> Konfigurierte Felder ({draft.configuration.length})</h4>
                    {draft.configuration.length === 0 ? (
                      <p className="text-gray-600 text-sm text-center py-8 italic">Noch keine Felder hinzugefügt.</p>
                    ) : (
                      <div className="space-y-2">
                        {draft.configuration.map((field) => (
                          <div key={field.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-2xl border border-white/10 group">
                            <div className="w-8 h-8 shrink-0 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                              <FieldTypeIcon type={field.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm truncate">{field.label}</p>
                              <p className="text-[10px] text-gray-500">
                                {field.type === 'select' ? `${field.options?.length || 0} Optionen` : field.type === 'checkbox' ? `+${field.price_impact}${field.impact_type === 'percentage' ? '%' : '€'}` : `×${field.price_impact}${field.impact_type === 'percentage' ? '%' : '€'} pro Einheit`}
                              </p>
                            </div>
                            <button onClick={() => removeField(field.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 transition-all"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Preview & Save ── */}
            {editorStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="glass p-8 rounded-3xl border border-white/10 space-y-4">
                    <h3 className="text-lg font-bold font-orbitron flex items-center gap-2"><CheckCircle size={20} className="text-green-400" /> Zusammenfassung</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-xs text-gray-500 uppercase font-bold">Name</span>
                        <span className="font-bold text-sm">{draft.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-xs text-gray-500 uppercase font-bold">Basispreis</span>
                        <span className="font-orbitron font-bold">€{draft.base_price.toLocaleString('de-DE')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-xs text-gray-500 uppercase font-bold">Felder</span>
                        <span className="font-bold text-sm">{draft.configuration.length}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-xs text-gray-500 uppercase font-bold">Währung</span>
                        <span className="font-bold text-sm">{draft.currency}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button onClick={() => setEditorStep(1)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all">Zurück</button>
                      <button onClick={saveCalculator} disabled={saving || !draft.name} className="flex-1 py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xl shadow-primary/20">
                        {saving ? '...' : <><Save size={16} /> {editingCalc ? 'Aktualisieren' : 'Erstellen'}</>}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-3 tracking-widest">Live-Vorschau</p>
                  <CalculatorWidget calculator={previewCalc} previewMode={true} />
                </div>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default CalculatorView;
