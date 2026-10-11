import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useStore from '../store/useStore';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/apiClient';
import { Calendar, ArrowLeft, Eye, EyeOff, X, UserCircle } from 'lucide-react';

const SAVED_ACCOUNTS_KEY = 'mazeout_saved_accounts';

function getSavedAccounts() {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccount(email) {
  const accounts = getSavedAccounts();
  // Add to front, remove duplicates, keep max 5
  const updated = [email, ...accounts.filter(a => a !== email)].slice(0, 5);
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
}

function removeAccount(email) {
  const accounts = getSavedAccounts().filter(a => a !== email);
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, user, role: currentRole } = useStore();
  
  useEffect(() => {
    if (user) {
      navigate(currentRole === 'OWNER' ? '/owner/dashboard' : '/dashboard');
    }
  }, [user, currentRole, navigate]);

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState('USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [savedAccounts, setSavedAccounts] = useState([]);

  // Load saved accounts on mount
  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, []);

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setError('');
  };

  const handlePickSavedAccount = (savedEmail) => {
    setEmail(savedEmail);
    setError('');
  };

  const handleRemoveSavedAccount = (e, savedEmail) => {
    e.stopPropagation();
    removeAccount(savedEmail);
    setSavedAccounts(getSavedAccounts());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (mode === 'signup' && !name) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        const data = await api.login({ email, password });
        // Save or remove account based on "Remember me" checkbox
        if (rememberMe) {
          saveAccount(email);
        }
        login(data.user, data.token);
        localStorage.setItem('token', data.token); // Store token for apiClient
        navigate(data.user.role === 'OWNER' ? '/owner/dashboard' : '/dashboard');
      } else {
        // Signup
        const data = await api.register({ name, email, password, role });
        if (rememberMe) {
          saveAccount(email);
        }
        login(data.user, data.token);
        if (data.token) localStorage.setItem('token', data.token);
        navigate(data.user.role === 'OWNER' ? '/owner/dashboard' : '/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] bg-gradient-to-br from-rose-900 via-fuchsia-900 to-zinc-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
            <Calendar className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">MazeOut</span>
        </div>

        {/* Decorative text */}
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2, type: "spring", stiffness: 80, damping: 20 }}
          >
            <p className="text-3xl font-bold text-white leading-snug mb-4">
              The smartest way to<br />book meeting rooms.
            </p>
            <p className="text-rose-300/80 text-base leading-relaxed">
              AI-powered conflict resolution. Real-time availability. 
              Zero double-bookings.
            </p>
          </motion.div>
        </div>

        {/* Feature highlights */}
        <motion.div 
          animate={{ y: [-6, 6, -6] }} 
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="relative z-10 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-3"
        >
          <p className="text-white/90 text-sm font-semibold">✦ Real-time conflict detection</p>
          <p className="text-white/90 text-sm font-semibold">✦ Smart alternative suggestions</p>
          <p className="text-white/90 text-sm font-semibold">✦ One-click room booking</p>
        </motion.div>

        {/* Glowing orb */}
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-fuchsia-600/20 blur-[100px] rounded-full pointer-events-none"></div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with back + mode switch */}
        <div className="flex justify-between items-center px-8 py-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'}</span>
            <button 
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-rose-400 hover:text-rose-300 font-semibold transition-colors"
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 pb-12">
          <motion.div 
            key={mode}
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-full max-w-md"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-zinc-500 mb-8">
              {mode === 'login' ? 'Enter your credentials to access your workspace.' : 'Get started with MazeOut in seconds.'}
            </p>

            {/* Saved accounts section (login mode only) */}
            <AnimatePresence>
              {mode === 'login' && savedAccounts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <label className="block text-sm font-medium text-zinc-400 mb-2.5">
                    Sign in as a previous user
                  </label>
                  <div className="space-y-2">
                    {savedAccounts.map((savedEmail) => (
                      <motion.div
                        key={savedEmail}
                        role="button"
                        tabIndex={0}
                        onClick={() => handlePickSavedAccount(savedEmail)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 group cursor-pointer ${
                          email === savedEmail
                            ? 'border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500/30'
                            : 'border-zinc-700/50 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          email === savedEmail
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-zinc-700/50 text-zinc-400 group-hover:text-zinc-300'
                        }`}>
                          <UserCircle size={20} />
                        </div>
                        <span className={`text-sm font-medium truncate flex-1 text-left ${
                          email === savedEmail ? 'text-rose-300' : 'text-zinc-300'
                        }`}>
                          {savedEmail}
                        </span>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleRemoveSavedAccount(e, savedEmail)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-zinc-600/50 text-zinc-500 hover:text-zinc-300 flex-shrink-0 cursor-pointer"
                          title="Remove saved account"
                        >
                          <X size={14} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-zinc-700/50"></div>
                    <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">or enter manually</span>
                    <div className="flex-1 h-px bg-zinc-700/50"></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role toggle */}
            <div className="bg-zinc-800 p-1 rounded-xl flex mb-6 border border-zinc-700/50">
              <button 
                onClick={() => handleRoleSwitch('USER')} 
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${role === 'USER' ? 'bg-zinc-700 shadow-sm text-rose-400' : 'text-zinc-500 hover:text-zinc-400'}`}
              >
                User Portal
              </button>
              <button 
                onClick={() => handleRoleSwitch('OWNER')} 
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${role === 'OWNER' ? 'bg-zinc-700 shadow-sm text-amber-400' : 'text-zinc-500 hover:text-zinc-400'}`}
              >
                Owner Portal
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium border border-red-500/20"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name field (signup only) */}
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Full Name</label>
                    <input 
                      type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Asha Patel"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email address</label>
                <input 
                  type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                    className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/50 transition-all pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    rememberMe
                      ? 'bg-rose-500 border-rose-500 text-white'
                      : 'border-zinc-600 bg-transparent hover:border-zinc-500'
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <label
                  onClick={() => setRememberMe(!rememberMe)}
                  className="text-sm text-zinc-400 cursor-pointer select-none hover:text-zinc-300 transition-colors"
                >
                  Remember this email for next time
                </label>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl ${
                  role === 'USER' 
                    ? 'bg-gradient-to-r from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700 shadow-rose-500/20' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-500/20'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </motion.button>

              {/* Hint text */}
              <p className="text-xs text-zinc-600 text-center mt-4">
                Demo credentials: <span className="text-zinc-400">client@test.com</span> (pwd: client) or <span className="text-zinc-400">owner@test.com</span> (pwd: owner)
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
