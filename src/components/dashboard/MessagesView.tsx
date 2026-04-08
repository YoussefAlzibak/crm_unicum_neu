import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useOrg } from '../../contexts/OrgContext';
import { MessageSquare, Send, Bot, User, Clock, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  contact_id: string | null;
}

interface Message {
  id: string;
  content: string;
  sender_type: 'user' | 'contact' | 'ai' | 'system';
  created_at: string;
}

const MessagesView = () => {
  const { currentOrg } = useOrg();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrg) fetchTickets();
  }, [currentOrg]);

  useEffect(() => {
    if (selectedTicket) fetchMessages(selectedTicket.id);
  }, [selectedTicket]);

  const fetchTickets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('org_id', currentOrg?.id)
      .order('updated_at', { ascending: false });
    
    if (data) setTickets(data);
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const sendMessage = async (content: string, type: 'user' | 'ai' = 'user') => {
    if (!selectedTicket || !content.trim()) return;

    const { data } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: selectedTicket.id,
        content,
        sender_type: type,
        sender_id: type === 'user' ? (await supabase.auth.getUser()).data.user?.id : null
      })
      .select()
      .single();

    if (data) {
      setMessages([...messages, data]);
      if (type === 'user') setNewMessage('');
    }
  };

  const generateAiReply = async () => {
    if (!selectedTicket || messages.length === 0) return;
    setAiGenerating(true);

    try {
      const history = messages.map(m => ({
        role: m.sender_type === 'contact' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const { data } = await supabase.functions.invoke('gemini-chat', {
        body: { 
          prompt: `Basierend auf dem Chat-Verlauf, schlagen Sie eine professionelle Antwort vor. Kontext: Support-Ticket zum Thema "${selectedTicket.subject}".`,
          history 
        }
      });

      if (data?.response) {
        setAiSuggestion(data.response);
      }
    } catch (err) {
      console.error("AI Error:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="flex bg-white/5 rounded-3xl border border-white/10 overflow-hidden h-[calc(100vh-200px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Tickets List */}
      <div className="w-full md:w-80 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold font-orbitron">Posteingang</h2>
          <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full font-bold">{tickets.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)
          ) : tickets.length === 0 ? (
            <div className="text-center py-10 text-gray-600 text-sm">Keine Nachrichten vorhanden.</div>
          ) : (
            tickets.map(ticket => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedTicket?.id === ticket.id 
                    ? 'bg-primary/10 border-primary/40 shadow-lg' 
                    : 'bg-white/5 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm truncate pr-2">{ticket.subject}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                    ticket.status === 'open' ? 'text-blue-400 bg-blue-400/10' : 'text-gray-500 bg-gray-500/10'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <Clock size={10} /> {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="font-bold text-lg">{selectedTicket.subject}</h3>
                <p className="text-xs text-gray-500">ID: {selectedTicket.id.split('-')[0]}</p>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                  <CheckCircle size={14} /> Als gelöst markieren
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender_type === 'contact' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-[80%] p-4 rounded-2xl relative ${
                      msg.sender_type === 'contact' 
                        ? 'bg-white/10 text-gray-200 rounded-tl-none' 
                        : msg.sender_type === 'ai' 
                          ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 rounded-tr-none'
                          : 'bg-primary text-white rounded-tr-none'
                    }`}>
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-bold opacity-60">
                        {msg.sender_type === 'contact' ? <User size={10}/> : msg.sender_type === 'ai' ? <Bot size={10}/> : <User size={10}/>}
                        {msg.sender_type.toUpperCase()}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-[10px] opacity-40 mt-2 block text-right">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input & AI Suggestions */}
            <div className="p-6 bg-white/[0.02] border-t border-white/10 space-y-4">
              <AnimatePresence>
                {aiSuggestion && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 space-y-3 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                        <Bot size={40} className="text-indigo-400 -mr-4 -mt-4 rotate-12" />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        <Sparkles size={12} /> KI-Antwortvorschlag
                      </div>
                      <p className="text-sm text-indigo-100/80 leading-relaxed italic">"{aiSuggestion}"</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setNewMessage(aiSuggestion); setAiSuggestion(null); }}
                          className="px-3 py-1.5 bg-indigo-500 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-600 transition-all"
                        >
                          Übernehmen
                        </button>
                        <button 
                          onClick={() => setAiSuggestion(null)}
                          className="px-3 py-1.5 bg-white/5 text-gray-400 text-[10px] font-bold rounded-lg hover:bg-white/10 transition-all"
                        >
                          Ignorieren
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-4">
                <button 
                  onClick={generateAiReply}
                  disabled={aiGenerating || messages.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl text-xs font-bold border border-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {aiGenerating ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                  Antwort vorschlagen
                </button>
              </div>
              <div className="relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ihre Nachricht schreiben..."
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-16 min-h-[100px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm resize-none"
                />
                <button 
                  onClick={() => sendMessage(newMessage)}
                  disabled={!newMessage.trim()}
                  className="absolute bottom-4 right-4 bg-primary text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/20"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 animate-pulse">
              <MessageSquare className="text-gray-600" size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">Wählen Sie eine Unterhaltung</h3>
            <p className="text-gray-500 max-w-xs text-sm">Wählen Sie ein Ticket aus der Liste links aus, um den Chatverlauf zu sehen oder die KI-Assistenz zu nutzen.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesView;
