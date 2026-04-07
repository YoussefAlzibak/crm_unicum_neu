import { useEffect, useState } from 'react';
import { supabase, queueEmail } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import {
  Mail, Send, Calendar, Plus, Eye, Trash2, Edit3, BarChart3,
  ArrowLeft, ArrowRight, Save, Users, Clock, CheckCircle,
  TrendingUp, MousePointer, AlertTriangle, X, Bold, Italic,
  AlignLeft, Image as ImageIcon, Type, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduled_for: string | null;
  template_id: string | null;
  audience_filter: Record<string, any>;
  created_at: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  html_body: string;
}

interface EmailEvent {
  event_type: string;
  count?: number;
}

interface CampaignStats {
  sent: number;
  opened: number;
  clicked: number;
  bounced: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  sent:      'text-green-400 bg-green-400/10 border-green-500/20',
  sending:   'text-blue-400 bg-blue-400/10 border-blue-500/20',
  scheduled: 'text-purple-400 bg-purple-400/10 border-purple-500/20',
  failed:    'text-red-400 bg-red-400/10 border-red-500/20',
  draft:     'text-gray-400 bg-gray-400/10 border-gray-500/10',
};

const STATUS_LABELS: Record<string, string> = {
  sent: 'Gesendet', sending: 'Wird gesendet', scheduled: 'Geplant', failed: 'Fehlgeschlagen', draft: 'Entwurf'
};

const pct = (n: number, total: number) => total ? Math.round((n / total) * 100) : 0;

// ─── Starter Templates ─────────────────────────────────────────────────────────
const STARTER_TEMPLATES = [
  {
    name: 'Willkommens-E-Mail',
    subject: 'Willkommen bei {{company_name}}! 👋',
    html_body: `<div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden">
<div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:48px 32px;text-align:center">
  <h1 style="margin:0;font-size:28px;font-weight:900">Willkommen! 🎉</h1>
  <p style="margin:12px 0 0;opacity:.8">Schön, dass Sie dabei sind.</p>
</div>
<div style="padding:40px 32px">
  <p>Hallo {{first_name}},</p>
  <p>vielen Dank, dass Sie sich für uns entschieden haben. Wir freuen uns, Sie an Bord zu haben!</p>
  <div style="text-align:center;margin:32px 0">
    <a href="{{cta_url}}" style="background:#6366f1;color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block">Jetzt starten →</a>
  </div>
  <p style="color:#666;font-size:14px">Bei Fragen stehen wir Ihnen jederzeit unter {{support_email}} zur Verfügung.</p>
</div>
<div style="text-align:center;padding:24px;border-top:1px solid #222;color:#444;font-size:12px">© 2024 {{company_name}}</div>
</div>`,
  },
  {
    name: 'Newsletter',
    subject: '📰 Neuigkeiten von {{company_name}} – {{month}} Update',
    html_body: `<div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden">
<div style="padding:32px;border-bottom:1px solid #222;display:flex;align-items:center;gap:16px">
  <div style="width:40px;height:40px;background:#6366f1;border-radius:10px"></div>
  <strong style="font-size:20px">{{company_name}}</strong>
</div>
<div style="padding:40px 32px">
  <h2 style="margin:0 0 8px">Monatliches Update</h2>
  <p style="color:#888;margin:0 0 32px">Was gibt es Neues?</p>
  <div style="background:#111;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #222">
    <h3 style="margin:0 0 8px;color:#a5b4fc">📌 Highlight des Monats</h3>
    <p style="margin:0;color:#bbb">Beschreiben Sie hier Ihr wichtigstes Thema dieses Monats.</p>
  </div>
  <div style="text-align:center;margin:32px 0">
    <a href="{{cta_url}}" style="background:#6366f1;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block">Mehr erfahren →</a>
  </div>
</div>
<div style="text-align:center;padding:24px;border-top:1px solid #222;color:#444;font-size:12px">
  <a href="{{unsubscribe_url}}" style="color:#444">Newsletter abbestellen</a>
</div>
</div>`,
  },
  {
    name: 'Angebots-E-Mail',
    subject: '🔥 Exklusives Angebot nur für Sie – Heute endet es!',
    html_body: `<div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0a0a0a;color:#fff;border-radius:16px;overflow:hidden">
<div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:48px 32px;text-align:center">
  <p style="margin:0;font-size:12px;opacity:.8;letter-spacing:3px;text-transform:uppercase">Exklusives Angebot</p>
  <h1 style="margin:12px 0;font-size:48px;font-weight:900">-30%</h1>
  <p style="margin:0;opacity:.9">Nur für Sie – heute, {{offer_end_date}}</p>
</div>
<div style="padding:40px 32px">
  <h2>Hallo {{first_name}},</h2>
  <p>als besonderer Kunde erhalten Sie heute einen exklusiven Rabatt von 30% auf unser gesamtes Sortiment.</p>
  <div style="background:#111;border-radius:12px;padding:20px;text-align:center;margin:24px 0;border:2px dashed #f59e0b">
    <p style="margin:0;color:#f59e0b;font-weight:700;font-size:24px;letter-spacing:4px">{{promo_code}}</p>
    <p style="margin:8px 0 0;color:#888;font-size:13px">Ihr Rabattcode</p>
  </div>
  <div style="text-align:center;margin:32px 0">
    <a href="{{cta_url}}" style="background:#f59e0b;color:#000;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:900;display:inline-block;font-size:18px">Jetzt einlösen 🎁</a>
  </div>
</div>
<div style="text-align:center;padding:24px;border-top:1px solid #222;color:#444;font-size:12px">© 2024 {{company_name}}</div>
</div>`,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const CampaignsView = () => {
  const { currentOrg } = useOrg();
  const [view, setView] = useState<'list' | 'editor' | 'stats' | 'templates'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({ sent: 0, opened: 0, clicked: 0, bounced: 0 });

  // Editor state
  const [editorStep, setEditorStep] = useState(0);
  const [draft, setDraft] = useState({
    name: '',
    subject: '',
    html_body: '',
    scheduled_for: '',
    template_id: '',
    audience_filter: {} as Record<string, any>,
  });
  const [previewMode, setPreviewMode] = useState(false);

  // Global stats
  const [globalStats, setGlobalStats] = useState({ totalSent: 0, avgOpen: 0, avgClick: 0, bounces: 0 });

  useEffect(() => {
    if (currentOrg) { fetchCampaigns(); fetchTemplates(); fetchGlobalStats(); }
  }, [currentOrg]);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('email_campaigns').select('*')
      .eq('org_id', currentOrg?.id)
      .order('created_at', { ascending: false });
    if (data) setCampaigns(data as Campaign[]);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('email_templates').select('*')
      .eq('org_id', currentOrg?.id)
      .order('created_at', { ascending: false });
    if (data) setTemplates(data as Template[]);
  };

  const fetchGlobalStats = async () => {
    const { data } = await supabase.from('email_events').select('event_type');
    if (!data || data.length === 0) return;
    const counts: Record<string, number> = {};
    data.forEach(e => { counts[e.event_type] = (counts[e.event_type] || 0) + 1; });
    const sent = counts['sent'] || 0;
    setGlobalStats({
      totalSent: sent,
      avgOpen: pct(counts['opened'] || 0, sent),
      avgClick: pct(counts['clicked'] || 0, sent),
      bounces: counts['bounced'] || 0,
    });
  };

  const fetchCampaignStats = async (campaignId: string) => {
    const { data } = await supabase.from('email_events').select('event_type').eq('campaign_id', campaignId);
    if (!data) return;
    const counts: Record<string, number> = {};
    data.forEach(e => { counts[e.event_type] = (counts[e.event_type] || 0) + 1; });
    setCampaignStats({ sent: counts['sent'] || 0, opened: counts['opened'] || 0, clicked: counts['clicked'] || 0, bounced: counts['bounced'] || 0 });
  };

  const openEditor = (campaign?: Campaign) => {
    if (campaign) {
      setDraft({ name: campaign.name, subject: '', html_body: '', scheduled_for: campaign.scheduled_for || '', template_id: campaign.template_id || '', audience_filter: campaign.audience_filter || {} });
      setSelectedCampaign(campaign);
    } else {
      setDraft({ name: '', subject: '', html_body: '', scheduled_for: '', template_id: '', audience_filter: {} });
      setSelectedCampaign(null);
    }
    setEditorStep(0);
    setPreviewMode(false);
    setView('editor');
  };

  const openStats = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    await fetchCampaignStats(campaign.id);
    setView('stats');
  };

  const saveCampaign = async (status: 'draft' | 'scheduled' = 'draft') => {
    if (!draft.name || !currentOrg) return;
    setSaving(true);

    // Save/upsert template
    let templateId = draft.template_id;
    if (draft.html_body) {
      if (templateId) {
        await supabase.from('email_templates').update({ name: draft.name, subject: draft.subject, html_body: draft.html_body }).eq('id', templateId);
      } else {
        const { data: tpl } = await supabase.from('email_templates').insert({ org_id: currentOrg.id, name: draft.name, subject: draft.subject, html_body: draft.html_body }).select().single();
        if (tpl) templateId = tpl.id;
      }
    }

    const payload = {
      name: draft.name,
      status,
      scheduled_for: draft.scheduled_for || null,
      template_id: templateId || null,
      audience_filter: draft.audience_filter,
    };

    let campaignId = selectedCampaign?.id;

    if (selectedCampaign) {
      await supabase.from('email_campaigns').update(payload).eq('id', selectedCampaign.id);
    } else {
      const { data: newCampaign } = await supabase.from('email_campaigns').insert({ ...payload, org_id: currentOrg.id }).select().single();
      if (newCampaign) {
        campaignId = newCampaign.id;
      }
    }

    if (status === 'scheduled' && !draft.scheduled_for) {
       // if they click Send immediately without scheduling, we trigger the workflow logic now.
       const { data: contacts } = await supabase.from('contacts').select('*').eq('org_id', currentOrg.id);
       if (contacts) {
         let filtered = contacts;
         const tags = draft.audience_filter?.tags || [];
         if (tags.length > 0) {
            filtered = contacts.filter(c => c.tags?.some((t: string) => tags.includes(t)));
         }

         await Promise.all(filtered.map(contact => {
           if (contact.email) {
             return queueEmail(
               currentOrg.id,
               contact.email,
               draft.subject,
               draft.html_body,
               '',
               campaignId,
               contact.id
             );
           }
         }));

         await supabase.from('email_campaigns').update({ status: 'sent' }).eq('id', campaignId);
       }
    }

    setSaving(false);
    await fetchCampaigns();
    await fetchTemplates();
    setView('list');
  };

  const deleteCampaign = async (id: string) => {
    await supabase.from('email_campaigns').delete().eq('id', id);
    setCampaigns(c => c.filter(x => x.id !== id));
  };

  const loadStarterTemplate = async (tpl: typeof STARTER_TEMPLATES[0]) => {
    if (!currentOrg) return;
    const { data } = await supabase.from('email_templates').insert({ org_id: currentOrg.id, name: tpl.name, subject: tpl.subject, html_body: tpl.html_body }).select().single();
    if (data) { await fetchTemplates(); }
    setView('list');
  };

  const applyTemplate = (tpl: Template) => {
    setDraft(d => ({ ...d, subject: tpl.subject, html_body: tpl.html_body, template_id: tpl.id }));
    setEditorStep(1);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-orbitron">
            {view === 'list' ? 'Marketing Kampagnen' : view === 'editor' ? (selectedCampaign ? 'Kampagne bearbeiten' : 'Neue Kampagne') : view === 'stats' ? `Statistiken: ${selectedCampaign?.name}` : 'E-Mail Vorlagen'}
          </h2>
          <p className="text-sm text-gray-500">
            {view === 'list' ? 'Erstellen und analysieren Sie Ihre E-Mail-Kampagnen.' : view === 'editor' ? `Schritt ${editorStep + 1} von 3` : view === 'stats' ? 'Detaillierte Auswertung dieser Kampagne.' : 'Wählen oder erstellen Sie eine E-Mail-Vorlage.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'list' && (
            <button onClick={() => setView('list')} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition-all">
              <ArrowLeft size={16} /> Zurück
            </button>
          )}
          {view === 'list' && (
            <>
              <button onClick={() => setView('templates')} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-bold rounded-xl flex items-center gap-2 transition-all">
                <Layers size={16} /> Vorlagen
              </button>
              <button onClick={() => openEditor()} className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-primary/20 hover:scale-105">
                <Plus size={18} /> Neue Kampagne
              </button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════ LIST ══════════════════ */}
        {view === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            {/* Global Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Gesamt Gesendet', value: globalStats.totalSent.toString(), icon: Send, color: 'text-blue-400', bar: 'bg-blue-400' },
                { label: 'Ø Öffnungsrate', value: `${globalStats.avgOpen}%`, icon: Eye, color: 'text-green-400', bar: 'bg-green-400' },
                { label: 'Ø Klickrate', value: `${globalStats.avgClick}%`, icon: MousePointer, color: 'text-purple-400', bar: 'bg-purple-400' },
                { label: 'Bounces', value: globalStats.bounces.toString(), icon: AlertTriangle, color: 'text-red-400', bar: 'bg-red-400' },
              ].map((s, i) => (
                <div key={i} className="glass p-5 rounded-2xl border border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500"><s.icon size={14} className={s.color} />{s.label}</div>
                  <p className="text-2xl font-bold font-orbitron">{s.value}</p>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className={`h-full ${s.bar}`} style={{ width: s.value.includes('%') ? s.value : '100%' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Campaigns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-3xl border border-white/10 animate-pulse" />)
              ) : campaigns.length === 0 ? (
                <div className="col-span-full py-20 text-center glass rounded-3xl border border-white/10 border-dashed">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Mail className="text-gray-600" size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Noch keine Kampagnen</h3>
                  <p className="text-gray-500 max-w-xs mx-auto text-sm mb-6">Erstellen Sie Ihre erste E-Mail-Marketing Kampagne.</p>
                  <button onClick={() => openEditor()} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-primary/80 transition-all">
                    <Plus size={16} className="inline mr-2" />Erste Kampagne erstellen
                  </button>
                </div>
              ) : (
                campaigns.map(campaign => (
                  <motion.div key={campaign.id} whileHover={{ y: -4 }} className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-5 hover:shadow-2xl transition-all group">
                    <div className="flex justify-between items-start">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${STATUS_STYLES[campaign.status]}`}>
                        {STATUS_LABELS[campaign.status]}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditor(campaign)} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5"><Edit3 size={15} /></button>
                        <button onClick={() => deleteCampaign(campaign.id)} className="p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/5"><Trash2 size={15} /></button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate mb-1">{campaign.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Calendar size={11} />
                        {campaign.scheduled_for ? new Date(campaign.scheduled_for).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nicht geplant'}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
                      {[
                        { label: 'Gesendet', val: '—' },
                        { label: 'Geöffnet', val: '—' },
                        { label: 'Geklickt', val: '—' },
                      ].map((m, i) => (
                        <div key={i} className="text-center">
                          <p className="text-[10px] text-gray-600 uppercase font-bold mb-1">{m.label}</p>
                          <p className="font-orbitron font-bold text-sm">{m.val}</p>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => openStats(campaign)} className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                      <BarChart3 size={13} /> Statistiken ansehen
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════ TEMPLATES ══════════════════ */}
        {view === 'templates' && (
          <motion.div key="templates" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
            {/* Meine Templates */}
            {templates.length > 0 && (
              <div>
                <h3 className="text-lg font-bold font-orbitron mb-4">Meine Vorlagen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {templates.map(t => (
                    <div key={t.id} className="glass p-5 rounded-3xl border border-white/10 hover:border-primary/40 transition-all group">
                      <div className="w-full h-24 bg-black/40 rounded-xl mb-4 overflow-hidden border border-white/5 flex items-center justify-center text-gray-600">
                        <Mail size={32} />
                      </div>
                      <h4 className="font-bold group-hover:text-primary transition-colors">{t.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 truncate">{t.subject}</p>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => { setDraft(d => ({ ...d, ...t, template_id: t.id })); setView('editor'); setEditorStep(1); }} className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-xl border border-primary/20 transition-all">Verwenden</button>
                        <button onClick={async () => { await supabase.from('email_templates').delete().eq('id', t.id); fetchTemplates(); }} className="p-2 text-red-500/50 hover:text-red-400 border border-white/10 rounded-xl hover:border-red-500/20 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Starter Templates */}
            <div>
              <h3 className="text-lg font-bold font-orbitron mb-4">Starter-Vorlagen</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {STARTER_TEMPLATES.map((tpl, i) => (
                  <motion.div key={i} whileHover={{ y: -4 }} className="glass p-6 rounded-3xl border border-white/10 hover:border-indigo-500/30 transition-all group space-y-4">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{tpl.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{tpl.subject}</p>
                    </div>
                    <button onClick={() => loadStarterTemplate(tpl)} className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-bold rounded-2xl border border-indigo-500/20 transition-all">
                      Als Vorlage speichern
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════ STATS ══════════════════ */}
        {view === 'stats' && selectedCampaign && (
          <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Gesendet', value: campaignStats.sent, icon: Send, color: 'text-blue-400', bg: 'from-blue-500/10' },
                { label: 'Geöffnet', value: `${pct(campaignStats.opened, campaignStats.sent)}%`, sub: `${campaignStats.opened} E-Mails`, icon: Eye, color: 'text-green-400', bg: 'from-green-500/10' },
                { label: 'Geklickt', value: `${pct(campaignStats.clicked, campaignStats.sent)}%`, sub: `${campaignStats.clicked} Klicks`, icon: MousePointer, color: 'text-purple-400', bg: 'from-purple-500/10' },
                { label: 'Bounces', value: campaignStats.bounced, icon: AlertTriangle, color: 'text-red-400', bg: 'from-red-500/10' },
              ].map((s, i) => (
                <div key={i} className={`glass p-6 rounded-3xl border border-white/10 bg-gradient-to-br ${s.bg} to-transparent space-y-3`}>
                  <s.icon className={s.color} size={22} />
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{s.label}</p>
                    <p className="text-3xl font-bold font-orbitron mt-1">{s.value}</p>
                    {'sub' in s && <p className="text-xs text-gray-600 mt-0.5">{s.sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Funnel Visualization */}
            <div className="glass p-8 rounded-3xl border border-white/10">
              <h3 className="text-lg font-bold font-orbitron mb-8 flex items-center gap-2"><TrendingUp className="text-primary" size={20} /> Kampagnen-Funnel</h3>
              {[
                { label: 'Versendet', value: campaignStats.sent, total: campaignStats.sent, color: 'bg-blue-500' },
                { label: 'Geöffnet', value: campaignStats.opened, total: campaignStats.sent, color: 'bg-green-500' },
                { label: 'Geklickt', value: campaignStats.clicked, total: campaignStats.sent, color: 'bg-purple-500' },
              ].map((bar, i) => (
                <div key={i} className="mb-5">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-400">{bar.label}</span>
                    <span className="text-white">{bar.value} ({pct(bar.value, bar.total)}%)</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct(bar.value, bar.total)}%` }}
                      transition={{ duration: 1, delay: i * 0.2 }}
                      className={`h-full ${bar.color} shadow-lg`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Campaign Info */}
            <div className="glass p-6 rounded-3xl border border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[selectedCampaign.status]}`}>{STATUS_LABELS[selectedCampaign.status]}</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Erstellt</p>
                <p className="text-sm font-bold">{new Date(selectedCampaign.created_at).toLocaleDateString('de-DE')}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Geplant für</p>
                <p className="text-sm font-bold">{selectedCampaign.scheduled_for ? new Date(selectedCampaign.scheduled_for).toLocaleString('de-DE') : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Bounce-Rate</p>
                <p className="text-sm font-bold">{pct(campaignStats.bounced, campaignStats.sent)}%</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════ EDITOR ══════════════════ */}
        {view === 'editor' && (
          <motion.div key="editor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Steps */}
            <div className="flex items-center gap-2">
              {['Grunddaten', 'E-Mail Inhalt', 'Zielgruppe & Zeitplan'].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => setEditorStep(i)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${editorStep === i ? 'bg-primary text-white' : editorStep > i ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}>
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">{i + 1}</span>
                    <span className="hidden sm:block">{s}</span>
                  </button>
                  {i < 2 && <div className={`h-px flex-1 min-w-[16px] ${editorStep > i ? 'bg-primary/40' : 'bg-white/10'}`} />}
                </div>
              ))}
            </div>

            {/* Step 0: Grunddaten */}
            {editorStep === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass p-8 rounded-3xl border border-white/10 space-y-5">
                  <h3 className="text-lg font-bold font-orbitron flex items-center gap-2"><Type size={18} className="text-primary" /> Kampagnen-Details</h3>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Kampagnen-Name *</label>
                    <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="z.B. Herbst Newsletter 2024" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">E-Mail Betreff *</label>
                    <input value={draft.subject} onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))} placeholder="z.B. 🍂 Unsere Herbst-Angebote sind da!" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50" />
                    <p className="text-[10px] text-gray-600 mt-1">Emojis erhöhen die Öffnungsrate! Optimal: 40–60 Zeichen. ({draft.subject.length})</p>
                  </div>

                  {/* Template Selector */}
                  {templates.length > 0 && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Vorlage verwenden</label>
                      <select value={draft.template_id} onChange={e => { const t = templates.find(x => x.id === e.target.value); if (t) applyTemplate(t); else setDraft(d => ({ ...d, template_id: e.target.value })); }} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold">
                        <option value="">— Keine Vorlage —</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}

                  <button onClick={() => setEditorStep(1)} disabled={!draft.name || !draft.subject} className="w-full py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary/80 transition-all">
                    Weiter zum Inhalt <ArrowRight size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="glass p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5">
                    <h4 className="font-bold mb-3 text-indigo-300">💡 Tipps für bessere Öffnungsraten</h4>
                    <ul className="text-xs text-gray-400 space-y-2 leading-relaxed">
                      <li>• Personalisieren Sie die Betreffzeile mit <code className="text-indigo-400">{'{{first_name}}'}</code></li>
                      <li>• Emojis am Anfang steigern die Öffnungsrate um bis zu 25%</li>
                      <li>• Halten Sie den Betreff unter 50 Zeichen für mobiles Anzeigen</li>
                      <li>• Stellen Sie eine Frage, um Neugier zu wecken</li>
                    </ul>
                  </div>
                  <div className="glass p-6 rounded-3xl border border-white/10">
                    <h4 className="font-bold mb-2">Verfügbare Variablen</h4>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['{{first_name}}', '{{company_name}}', '{{unsubscribe_url}}', '{{cta_url}}'].map(v => (
                        <code key={v} className="text-[11px] bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-primary font-mono">{v}</code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Email Content */}
            {editorStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button onClick={() => setPreviewMode(false)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!previewMode ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}>Editor</button>
                    <button onClick={() => setPreviewMode(true)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${previewMode ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}><Eye size={12} className="inline mr-1" />Vorschau</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditorStep(0)} className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition-all">Zurück</button>
                    <button onClick={() => setEditorStep(2)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/80 transition-all">Weiter <ArrowRight size={15} /></button>
                  </div>
                </div>

                {previewMode ? (
                  <div className="glass rounded-3xl border border-white/10 overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/[0.02] text-xs text-gray-500">
                      <strong>Betreff:</strong> {draft.subject || '(kein Betreff)'}
                    </div>
                    <div className="p-6 max-h-[600px] overflow-y-auto">
                      {draft.html_body ? (
                        <div className="bg-white rounded-xl p-4" dangerouslySetInnerHTML={{ __html: draft.html_body }} />
                      ) : (
                        <div className="text-center py-20 text-gray-500">
                          <Mail className="mx-auto mb-4 text-gray-600" size={40} />
                          <p>Noch kein E-Mail-Inhalt. Wechseln Sie in den Editor-Modus.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Template Buttons */}
                    <div className="lg:col-span-3 space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Schnell-Vorlagen</p>
                      {STARTER_TEMPLATES.map((tpl, i) => (
                        <button key={i} onClick={() => setDraft(d => ({ ...d, html_body: tpl.html_body, subject: d.subject || tpl.subject }))}
                          className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 rounded-2xl transition-all group">
                          <p className="text-xs font-bold group-hover:text-primary transition-colors">{tpl.name}</p>
                        </button>
                      ))}
                      <div className="pt-2">
                        <p className="text-[10px] text-gray-600 uppercase font-bold mb-2">Formatierung</p>
                        <div className="flex gap-1 flex-wrap">
                          {[Bold, Italic, AlignLeft, ImageIcon].map((Icon, i) => (
                            <button key={i} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-all"><Icon size={14} /></button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* HTML Editor */}
                    <div className="lg:col-span-9">
                      <textarea
                        value={draft.html_body}
                        onChange={e => setDraft(d => ({ ...d, html_body: e.target.value }))}
                        placeholder={`<div style="font-family:sans-serif;max-width:600px;margin:auto">
  <h1>Betreff Ihrer E-Mail</h1>
  <p>Hauptinhalt hier eintragen...</p>
  <a href="{{cta_url}}">Zum Angebot</a>
</div>`}
                        className="w-full min-h-[500px] bg-black/60 border border-white/10 rounded-2xl px-5 py-4 font-mono text-xs text-green-300 outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
                      />
                      <p className="text-[10px] text-gray-600 mt-2">HTML-Editor: Verwenden Sie Variablen wie <code>{'{{first_name}}'}</code> für Personalisierung.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Audience & Scheduling */}
            {editorStep === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Audience */}
                  <div className="glass p-8 rounded-3xl border border-white/10 space-y-5">
                    <h3 className="text-lg font-bold font-orbitron flex items-center gap-2"><Users size={18} className="text-primary" /> Zielgruppe</h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Tags (kommagetrennt)</label>
                      <input
                        value={(draft.audience_filter?.tags || []).join(', ')}
                        onChange={e => setDraft(d => ({ ...d, audience_filter: { ...d.audience_filter, tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                        placeholder="newsletter, kunden, aktiv"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <p className="text-[10px] text-gray-600 mt-1">Nur Kontakte mit diesen Tags erhalten die Kampagne.</p>
                    </div>
                    <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/20">
                      <p className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-2"><Users size={12} /> Zielgruppen-Größe</p>
                      <p className="text-2xl font-orbitron font-bold">Alle Kontakte</p>
                      <p className="text-[10px] text-gray-500 mt-1">Filter wird beim Versenden angewendet.</p>
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div className="glass p-8 rounded-3xl border border-white/10 space-y-5">
                    <h3 className="text-lg font-bold font-orbitron flex items-center gap-2"><Clock size={18} className="text-primary" /> Zeitplanung</h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Sende-Zeitpunkt</label>
                      <input type="datetime-local" value={draft.scheduled_for} onChange={e => setDraft(d => ({ ...d, scheduled_for: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 font-bold" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => saveCampaign('draft')} disabled={saving} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <Save size={16} /> {saving ? '...' : 'Als Entwurf'}
                      </button>
                      <button onClick={() => saveCampaign('scheduled')} disabled={saving || !draft.scheduled_for} className="flex-1 py-3 bg-primary text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-primary/80 transition-all shadow-lg shadow-primary/20">
                        <Send size={16} /> {saving ? '...' : 'Planen & Senden'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Summary Preview */}
                <div className="glass p-8 rounded-3xl border border-white/10 space-y-6">
                  <h3 className="text-lg font-bold font-orbitron flex items-center gap-2"><CheckCircle size={18} className="text-green-400" /> Zusammenfassung</h3>
                  <div className="divide-y divide-white/5 space-y-0">
                    {[
                      { label: 'Name', value: draft.name || '—' },
                      { label: 'Betreff', value: draft.subject || '—' },
                      { label: 'HTML-Inhalt', value: draft.html_body ? `${draft.html_body.length} Zeichen` : 'Kein Inhalt' },
                      { label: 'Tags', value: (draft.audience_filter?.tags || []).join(', ') || 'Alle Kontakte' },
                      { label: 'Geplant für', value: draft.scheduled_for ? new Date(draft.scheduled_for).toLocaleString('de-DE') : 'Sofort / Nicht festgelegt' },
                    ].map((row, i) => (
                      <div key={i} className="py-3 flex justify-between items-start gap-4">
                        <span className="text-xs text-gray-500 uppercase font-bold shrink-0">{row.label}</span>
                        <span className="text-xs font-bold text-right text-gray-200 truncate max-w-[200px]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-green-500/5 rounded-2xl border border-green-500/20">
                    <p className="text-xs text-green-400 font-bold">✓ Bereit zum Speichern oder Planen</p>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default CampaignsView;
