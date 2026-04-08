import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatWidgetProps {
  orgId: string;
  themeColor?: string;
  displayName?: string;
}

const ChatWidget = ({ orgId, themeColor = '#8a2be2', displayName = 'Support' }: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Welcome/Auth, 2: Chat
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [contactId, setContactId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticketId) {
      fetchMessages();
      const subscription = supabase
        .channel(`ticket-${ticketId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        })
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [ticketId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const startChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Upsert Contact
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('org_id', orgId)
        .eq('email', email)
        .maybeSingle();
      
      let cId = contact?.id;
      if (!cId) {
        const { data: newC } = await supabase.from('contacts').insert({ org_id: orgId, full_name: name, email }).select().single();
        cId = newC.id;
      }
      setContactId(cId);

      // 2. Create Ticket
      const { data: ticket } = await supabase
        .from('tickets')
        .insert({
          org_id: orgId,
          contact_id: cId,
          subject: 'Live Chat Anfrage',
          status: 'open',
          priority: 'medium'
        })
        .select()
        .single();
      
      setTicketId(ticket.id);
      setStep(2);

      // 3. Welcome Message
      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        content: `Hallo ${name}! Wie können wir Ihnen heute helfen?`,
        sender_type: 'ai'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticketId) return;
    const content = newMessage;
    setNewMessage('');
    
    await supabase.from('ticket_messages').insert({
      ticket_id: ticketId,
      content,
      sender_type: 'contact',
      sender_id: contactId
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] h-[500px] bg-[#121212] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-white/5" style={{ backgroundColor: themeColor + '20' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: themeColor }}>
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{displayName}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 h-full flex flex-col justify-center gap-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-2">Hallo! 👋</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">Bitte geben Sie Ihre Daten an, um den Chat zu starten.</p>
                    </div>
                    <form onSubmit={startChat} className="space-y-4">
                      <input 
                        required type="text" placeholder="Ihre Name" 
                        value={name} onChange={e => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                      <input 
                        required type="email" placeholder="E-Mail Adresse" 
                        value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                      />
                      <button 
                        disabled={loading}
                        className="w-full py-4 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: themeColor }}
                      >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Chat starten'}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                      {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender_type === 'contact' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.sender_type === 'contact' 
                              ? 'bg-primary text-white rounded-tr-none' 
                              : 'bg-white/10 text-gray-200 rounded-tl-none border border-white/5'
                          }`}>
                            <div className="flex items-center gap-1.5 mb-1.5 opacity-50 font-bold uppercase text-[9px]">
                              {msg.sender_type === 'contact' ? <User size={10}/> : <Bot size={10}/>}
                              {msg.sender_type}
                            </div>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Input */}
                    <div className="p-4 border-t border-white/5 bg-black/20">
                      <div className="relative">
                        <input 
                          type="text" placeholder="Nachricht schreiben..."
                          value={newMessage} onChange={e => setNewMessage(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && sendMessage()}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 outline-none focus:ring-2 focus:ring-primary/50 text-xs"
                        />
                        <button onClick={sendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:scale-110 active:scale-95 transition-all text-primary">
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-all relative group"
        style={{ backgroundColor: themeColor }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <MessageSquare size={28} />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pulse effect */}
        {!isOpen && <span className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping opacity-20" />}
      </button>
    </div>
  );
};

export default ChatWidget;
