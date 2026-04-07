import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, Loader2, ArrowRight, Github } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { Link } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the magic link!' });
    }
    setLoading(false);
  };

  return (
    <AuthLayout 
      title="Willkommen zurück" 
      subtitle="Melden Sie sich an, um Ihr Dashboard zu verwalten."
    >
      <form onSubmit={handleMagicLink} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
            E-Mail Adresse
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              id="email"
              type="email"
              placeholder="name@firma.de"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Anmelden mit Magic Link <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {message && (
          <div className={`p-4 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {message.text}
          </div>
        )}

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-gray-500">Oder weiter mit</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
          className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-3 transition-all"
        >
          <Github className="w-5 h-5" /> GitHub
        </button>

        <p className="text-center text-gray-500 text-sm mt-8">
          Noch kein Konto? <Link to="/register" className="text-primary hover:underline">Jetzt registrieren</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default LoginForm;
