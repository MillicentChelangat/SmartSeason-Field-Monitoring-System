import { useState } from 'react';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import API from '../api/api';

type Mode = 'login' | 'register';

type LoginPageProps = {
  onLoginSuccess: (user: any) => void;
};

const BG_IMAGE =
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&q=85&fit=crop';

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await API.post('login/', { email, password });
        const { tokens, user } = res.data;
        localStorage.setItem('access', tokens.access);
        localStorage.setItem('refresh', tokens.refresh);
        localStorage.setItem('user', JSON.stringify(user));
        onLoginSuccess(user);
      } else {
        if (!fullName.trim()) {
          setError('Full name is required.');
          setLoading(false);
          return;
        }
        await API.post('register/', {
          email,
          password,
          confirmPassword,
          full_name: fullName,
          role: 'field_agent',
        });
        setSuccess('Account created successfully.');
        setTimeout(() => setSuccess(''), 3000);
        setMode('login');
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
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
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        aria-hidden="true"
      >
        {/* Background image */}
        <img
          src={BG_IMAGE}
          alt="Farm fields"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark green overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(20,58,10,0.78) 0%, rgba(30,80,20,0.60) 55%, rgba(10,40,5,0.80) 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10">

          {/* Top: logo */}
          <div className="flex items-center gap-3">
            <div className="bg-green-700 rounded-xl p-2 shadow-lg">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xl font-bold tracking-tight">
              Smart<span className="text-green-300">Season</span>
            </span>
          </div>

          {/* Middle: headline */}
          <div>
            {/* Live indicator */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-white text-xs font-medium">Live field monitoring</span>
            </div>
           <div className="text-center">
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Grow smarter with<br />
              <span className="text-green-300">SmartSeason</span>
            </h2>

            <p className="text-white/70 text-lg font-normal leading-relaxed mb-4">
              Monitor your fields, track crop stages, and coordinate agents
              all from one intelligent dashboard.
            </p>
           </div>
            </div>
           {/* Bottom: footer note */}
           <p className="text-white/30 text-xs text-center">
            © {new Date().getFullYear()} SmartSeason. All rights reserved.
           </p>

        </div>
      </div>
      {/* ── END LEFT PANEL ── */}

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-[420px] bg-white flex flex-col justify-center px-8 py-10 overflow-y-auto">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="bg-green-700 rounded-xl p-2">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">
            Smart<span className="text-green-700">Season</span>
          </span>
        </div>

        {/* Heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {mode === 'login'
              ? 'Sign in to your account to continue'
              : 'Register to get started with SmartSeason'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white text-green-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name – register only */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Agent Kamau"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent focus:bg-white transition"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@smartseason.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent focus:bg-white transition"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password – register only */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-green-700 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-800 hover:bg-green-900 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading
              ? <LoadingSpinner size="sm" />
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-green-700 font-medium hover:underline">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="text-green-700 font-medium hover:underline">Privacy Policy</a>.
        </p>

      </div>
      {/* ── END RIGHT PANEL ── */}

    </div>

  );
}