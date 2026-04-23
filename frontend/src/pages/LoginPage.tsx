import { useState } from 'react';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import API from '../api/api';

type Mode = 'login' | 'register';

type LoginPageProps = {
  onLoginSuccess: (user: any) => void;
};

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'admin' | 'field_agent'>('field_agent');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // ================= LOGIN =================
      if (mode === 'login') {
        const res = await API.post('login/', { email, password });
        const { tokens, user } = res.data;

        localStorage.setItem('access', tokens.access);
        localStorage.setItem('refresh', tokens.refresh);
        localStorage.setItem('user', JSON.stringify(user));
        console.log("SAVED USER:", localStorage.getItem('user'));

        onLoginSuccess(user); 
      }

      // ================= REGISTER =================
      else {
        if (!fullName.trim()) {
          setError('Full name is required.');
          setLoading(false);
          return;
        }

        await API.post('register/', {
          email,
          password,
          full_name: fullName,
          role,
        });

        setSuccess('Account created successfully. Please sign in.');
        setMode('login');
        setFullName('');
        setRole('field_agent');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setSuccess('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-green-700 rounded-2xl p-3 mb-4 shadow-lg">
            <Leaf className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Smart<span className="text-green-700">Season</span>
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-4 font-semibold transition-colors ${
                mode === 'login'
                  ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-4 font-semibold transition-colors ${
                mode === 'register'
                  ? 'text-green-700 border-b-2 border-green-700 bg-green-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Full Name (register only) */}
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            )}

            {/* Role (register only) */}
            {mode === 'register' && (
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'admin' | 'field_agent')}
                className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="field_agent">Field Agent</option>
                <option value="admin">Admin</option>
              </select>
            )}

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-slate-300 p-2.5 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Feedback */}
            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {success && (
              <p className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {success}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-semibold p-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <LoadingSpinner size="sm" />
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}