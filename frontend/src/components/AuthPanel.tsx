import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthPanel() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Request failed');
      }

      if (mode === 'register') {
        // After successful registration, automatically log in
        setMode('login');
        setError('Registration successful! Please log in.');
        setPassword('');
      } else {
        // Login successful
        setAuth(json.user || { id: 'user', email }, json.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="w-full max-w-md p-8 bg-[#11131a] rounded-lg shadow-2xl border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">Flowrex</h1>
          <p className="text-sm text-gray-400">Institutional-grade AI Trading Platform</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex mb-6 bg-black/40 rounded p-1">
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={
              'flex-1 py-2 rounded text-sm font-medium transition ' +
              (mode === 'login'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-gray-200')
            }
          >
            Login
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={
              'flex-1 py-2 rounded text-sm font-medium transition ' +
              (mode === 'register'
                ? 'bg-emerald-600 text-white'
                : 'text-gray-400 hover:text-gray-200')
            }
          >
            Register
          </button>
        </div>

        {error && (
          <div
            className={
              'mb-4 p-3 rounded text-sm ' +
              (error.includes('successful')
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                : 'bg-red-600/20 text-red-400 border border-red-600/30')
            }
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-emerald-500"
              placeholder="trader@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-black border border-gray-700 rounded text-gray-200 focus:outline-none focus:border-emerald-500"
              placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded font-medium text-white transition"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
          <p>Multi-playbook systematic trading with NBB, Tori, Fabio & JadeCap</p>
        </div>
      </div>
    </div>
  );
}
