import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      onClose();
      const from = (location.state as any)?.from?.pathname || '/odysseia/admin';
      navigate(from);
    } else {
      setError('Credenciais inválidas.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" aria-modal="true">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#1a1611]/90 backdrop-blur-md border border-[#ef9f27]/30 rounded-xl shadow-xl max-w-md w-full mx-4 p-8">
        <h2 className="text-2xl font-headline text-primary mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="E‑mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-[#0d0a06]/40 border border-outline-variant rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 bg-[#0d0a06]/40 border border-outline-variant rounded-lg text-white placeholder:text-white/60 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {error && <p className="text-sm text-error text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-primary text-on-primary font-label font-bold py-2 rounded-lg hover:shadow-[0_0_20px_rgba(239,159,39,0.4)] transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
};
