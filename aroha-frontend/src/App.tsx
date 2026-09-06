import React, { useState, useEffect } from 'react';
import ElderlyDashboard from './ElderlyDashboard';
import CaregiverDashboard from './CaregiverDashboard';
import ProfessionalDashboard from './ProfessionalDashboard';
import AdminDashboard from './AdminDashboard';
import Games from './Games';
import ElderlyProgress from './ElderlyProgress';
import Notifications from './Notifications';
import Profile from './Profile';
import Settings from './Settings';
import { Eye, EyeOff, Bell, Settings as SettingsIcon, User, Brain, Activity, Sparkles, Shield, LayoutDashboard, Menu, X, LogOut, CheckCircle, Clock, Users, HelpCircle, MessageSquare, ChevronRight, Target, Trophy, Calendar, TrendingUp, Gamepad2, HeartPulse, Info, Camera, Save, Lock, Monitor, Type, UserCheck, UserX, ArrowLeft, Search, Download, XCircle, Plus, Trash2, RefreshCw, LayoutGrid, Play, ArrowDownUp, FileText, ShieldAlert, UserPlus, Check, Copy } from 'lucide-react';
import { translations } from './translations';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('aroha_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('aroha_user') || 'null'));
  const [view, setView] = useState('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [signupRole, setSignupRole] = useState('ELDERLY');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [lang, setLang] = useState(user?.language || localStorage.getItem('aroha_lang') || 'en');
  const [fontSize, setFontSize] = useState(user?.font_size || 'text-normal');
  const [highContrast, setHighContrast] = useState(user?.high_contrast === 1 || false);
  const [simpleMode, setSimpleMode] = useState(user?.simple_mode === 1 || false);
  
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedDiff, setSelectedDiff] = useState('Easy');

  const role = user?.role ? user.role.toUpperCase() : null;
  const t = (key: any) => (translations as any)[lang]?.[key] || (translations as any)['en'][key] || key;

  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setUnreadNotifications(data.filter((n: any) => !n.is_read).length);
        }
      } catch (e) {}
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, view]);

  useEffect(() => { 
    if (token && role && (view === 'landing' || view === 'login' || view === 'signup')) setView('dashboard'); 
  }, [token, role, view]);

  const handleUpdateUser = (updatedFields: any) => {
    const newUser = { ...user, ...updatedFields };
    setUser(newUser); localStorage.setItem('aroha_user', JSON.stringify(newUser));
    if(updatedFields.language) { setLang(updatedFields.language); localStorage.setItem('aroha_lang', updatedFields.language); }
    if(updatedFields.font_size) setFontSize(updatedFields.font_size);
    if(updatedFields.high_contrast !== undefined) setHighContrast(updatedFields.high_contrast === 1);
    if(updatedFields.simple_mode !== undefined) setSimpleMode(updatedFields.simple_mode === 1);
  };

  const handleLangChange = async (newLang: string) => {
    setLang(newLang); localStorage.setItem('aroha_lang', newLang);
    if (token) {
      try {
        await fetch(`${API_URL}/api/users/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ language: newLang, font_size: fontSize, high_contrast: highContrast, simple_mode: simpleMode }) });
        const newUser = { ...user, language: newLang };
        setUser(newUser); localStorage.setItem('aroha_user', JSON.stringify(newUser));
      } catch (e) {}
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('aroha_token', data.token); handleUpdateUser(data.user);
        setToken(data.token); setView('dashboard'); setEmail(''); setPassword('');
      } else setErrorMsg(data.message);
    } catch (err) { setErrorMsg(t('msg.error')); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setErrorMsg(''); setSuccessMsg('');
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, role: signupRole }) });
      const data = await res.json();
      if (res.ok) { setSuccessMsg(data.message + '. You can now log in.'); setView('login'); setPassword(''); setConfirmPassword(''); } 
      else setErrorMsg(data.message);
    } catch (err) { setErrorMsg(t('msg.error')); }
  };

  const handleLogout = () => { localStorage.clear(); setToken(null); setUser(null); setView('landing'); };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, roles: ['ELDERLY', 'CAREGIVER', 'PROFESSIONAL', 'ADMIN'] },
    { id: 'game', label: 'Cognitive Games', icon: <Brain size={18} />, roles: ['ELDERLY'] },
    { id: 'reminders', label: 'My Reminders', icon: <Bell size={18} />, roles: ['ELDERLY', 'CAREGIVER'] },
    { id: 'caregiver', label: 'My Caregiver', icon: <Users size={18} />, roles: ['ELDERLY'] },
    { id: 'progress', label: 'My Progress', icon: <Activity size={18} />, roles: ['ELDERLY'] },
    { id: 'users', label: 'Users', icon: <Users size={18} />, roles: ['PROFESSIONAL', 'ADMIN'] },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} />, badge: unreadNotifications, roles: ['ELDERLY', 'CAREGIVER', 'PROFESSIONAL', 'ADMIN'] },
    { id: 'chat', label: 'Talk to AROHA', icon: <MessageSquare size={18} />, roles: ['ELDERLY'] },
    { id: 'profile', label: 'Profile', icon: <User size={18} />, roles: ['ELDERLY', 'CAREGIVER', 'PROFESSIONAL', 'ADMIN'] },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={18} />, roles: ['ELDERLY', 'CAREGIVER', 'PROFESSIONAL', 'ADMIN'] },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role || ''));

  // ----------------------------------------------------
  // ENTERPRISE PUBLIC / AUTH VIEWS
  // ----------------------------------------------------
  if (!token || view === 'landing' || view === 'login' || view === 'signup') {
    return (
      <div className={`${fontSize} ${highContrast ? 'dark bg-[#0f172a] text-white' : 'bg-slate-50 text-slate-900'} min-h-screen font-sans selection:bg-blue-200 selection:text-blue-900 flex flex-col`}>
        <style>{`
          input[type="password"]::-ms-reveal,
          input[type="password"]::-ms-clear,
          input[type="password"]::-webkit-contacts-auto-fill-button {
            display: none !important;
          }
        `}</style>
        
        {/* Enterprise Header */}
        <header className={`px-6 py-4 flex justify-between items-center border-b ${highContrast ? 'border-slate-800 bg-[#0B1120]' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <img src="/logo_compact.png" alt="AROHA" className="h-8 object-contain" />
          </div>
          <div className="flex items-center gap-4">
            <select value={lang} onChange={(e) => handleLangChange(e.target.value)} className={`text-sm px-3 py-1.5 rounded-md border outline-none font-medium ${highContrast ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
              <option value="en">English</option><option value="hi">हिन्दी</option><option value="pa">ਪੰਜਾਬੀ</option>
            </select>
            {view !== 'login' && <button onClick={() => setView('login')} className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">Sign In</button>}
            {view !== 'signup' && <button onClick={() => setView('signup')} className="text-sm font-semibold bg-[#002B5B] text-white px-4 py-2 rounded-lg hover:bg-[#001A3D] transition-colors shadow-sm">Create Account</button>}
          </div>
        </header>

        {/* ENTERPRISE LANDING */}
        {view === 'landing' && (
          <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 animate-fade-in relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border mb-8 ${highContrast ? 'bg-slate-800 text-blue-400 border-slate-700' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              <Sparkles size={14} /> Cognitive wellness platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl leading-tight">
              Maintain Independence with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#002B5B] to-[#FF6B00]">Actionable Intelligence.</span>
            </h1>
            <p className={`text-lg md:text-xl max-w-2xl mb-10 ${highContrast ? 'text-slate-400' : 'text-slate-500'}`}>
              A secure, enterprise-grade companion tracking cognitive health, managing routines, and providing real-time telemetry to your care network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <button onClick={() => setView('signup')} className="px-8 py-3.5 bg-[#002B5B] text-white font-medium rounded-lg shadow-sm hover:bg-[#001A3D] transition-all flex items-center justify-center gap-2">
                Start Building Profile <ChevronRight size={18} />
              </button>
              <button onClick={() => setView('login')} className={`px-8 py-3.5 font-medium rounded-lg border transition-all ${highContrast ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'}`}>
                Sign In to Console
              </button>
            </div>
            
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl text-left w-full">
               <div className={`p-6 border rounded-xl shadow-sm ${highContrast ? 'bg-[#0B1120] border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 dark:bg-blue-900/30 dark:text-blue-400"><Brain size={20}/></div>
                 <h3 className="font-semibold text-base mb-2">Cognitive Tracking</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">Scientifically-backed modules designed to map and support memory retention and recall.</p>
               </div>
               <div className={`p-6 border rounded-xl shadow-sm ${highContrast ? 'bg-[#0B1120] border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 dark:bg-emerald-900/30 dark:text-emerald-400"><Clock size={20}/></div>
                 <h3 className="font-semibold text-base mb-2">Routine Orchestration</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">Ensure medication compliance and schedule adherence with highly accessible active reminders.</p>
               </div>
               <div className={`p-6 border rounded-xl shadow-sm ${highContrast ? 'bg-[#0B1120] border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4 dark:bg-purple-900/30 dark:text-purple-400"><Activity size={20}/></div>
                 <h3 className="font-semibold text-base mb-2">Telemetry Sharing</h3>
                 <p className="text-sm text-slate-500 leading-relaxed">Securely authorize caregivers or medical professionals to view progress and wellness alerts.</p>
               </div>
            </div>
          </main>
        )}

        {/* ENTERPRISE LOGIN / SIGNUP */}
        {(view === 'login' || view === 'signup') && (
          <main className="flex-1 flex items-center justify-center p-4">
            <div className={`w-full max-w-md p-8 md:p-10 rounded-2xl border shadow-xl animate-fade-in ${highContrast ? 'bg-[#0B1120] border-slate-800' : 'bg-white border-slate-200'}`}>
              
              <div className="mb-8 text-center">
                <img src="/logo_icon.png" alt="AROHA" className="w-12 h-12 mx-auto mb-4 object-contain" />
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {view === 'login' ? 'Welcome back' : 'Create an account'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {view === 'login' ? 'Enter your credentials to access your console.' : 'Set up your profile to start tracking telemetry.'}
                </p>
              </div>

              {errorMsg && <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-lg dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">{errorMsg}</div>}
              {successMsg && <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">{successMsg}</div>}

              {view === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Email address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={`w-full p-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#002B5B] transition-all ${highContrast ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Password</label>
                      <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">Forgot?</button>
                    </div>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`w-full p-2.5 pr-10 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#002B5B] transition-all ${highContrast ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 mt-2 bg-[#002B5B] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#001A3D] active:scale-[0.98] transition-all">
                    Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className={`w-full p-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#002B5B] transition-all ${highContrast ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Email Address</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className={`w-full p-2.5 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#002B5B] transition-all ${highContrast ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Account Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setSignupRole('ELDERLY')} className={`py-2 px-3 border rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 ${signupRole === 'ELDERLY' ? 'border-[#002B5B] bg-blue-50 text-[#002B5B] dark:bg-blue-900/30 dark:text-blue-300 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                        <User size={14} /> Elderly User
                      </button>
                      <button type="button" onClick={() => setSignupRole('CAREGIVER')} className={`py-2 px-3 border rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-2 ${signupRole === 'CAREGIVER' ? 'border-[#002B5B] bg-blue-50 text-[#002B5B] dark:bg-blue-900/30 dark:text-blue-300 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                        <Users size={14} /> Caregiver
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Password</label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`w-full p-2.5 pr-8 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#002B5B] transition-all ${highContrast ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Confirm</label>
                      <div className="relative">
                        <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className={`w-full p-2.5 pr-8 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#002B5B] transition-all ${highContrast ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="submit" className="w-full py-2.5 mt-4 bg-[#002B5B] text-white text-sm font-medium rounded-lg shadow-sm hover:bg-[#001A3D] active:scale-[0.98] transition-all">
                    Create Account
                  </button>
                </form>
              )}
              
              <div className="mt-8 text-center text-sm">
                <span className="text-slate-500">
                  {view === 'login' ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button onClick={() => { setErrorMsg(''); setView(view === 'login' ? 'signup' : 'login'); }} className="text-[#002B5B] dark:text-blue-400 font-semibold hover:underline">
                  {view === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </div>
            </div>
          </main>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // LOGGED IN VIEW (DASHBOARD SHELL)
  // ----------------------------------------------------
  const wrapperClass = `flex h-screen overflow-hidden ${fontSize} ${highContrast ? 'dark bg-[#0B1120] text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans`;

  return (
    <div className={wrapperClass}>
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear,
        input[type="password"]::-webkit-contacts-auto-fill-button {
          display: none !important;
        }
      `}</style>
      
      {/* SaaS Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 shrink-0 transition-colors border-r ${highContrast ? 'bg-[#0B1120] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="h-20 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <img src={highContrast ? "/logo_compact.png" : "/logo_compact.png"} alt="AROHA" className={`h-10 object-contain ${highContrast ? 'brightness-0 invert' : ''}`} />
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNav.map(item => {
            const isActive = view === item.id || (view === 'game' && item.id === 'game') || (view === 'progress' && item.id === 'progress');
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'game') setSelectedGame('select' as any);
                  setView(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-slate-100 text-[#002B5B] dark:bg-slate-800 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${isActive ? 'text-[#002B5B] dark:text-white' : 'text-slate-400'}`}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
               {user?.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-[10px] font-medium text-slate-500 capitalize truncate">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className={`w-64 h-full flex flex-col z-50 shadow-2xl relative ${highContrast ? 'bg-[#0B1120] border-r border-slate-800' : 'bg-white'}`}>
            <div className="h-20 flex justify-between items-center px-6 border-b border-slate-100 dark:border-slate-800">
              <img src="/logo_compact.png" alt="AROHA" className={`h-8 object-contain ${highContrast ? 'brightness-0 invert' : ''}`} />
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={20}/></button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {filteredNav.map(item => {
                const isActive = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { if(item.id==='game') setSelectedGame('select' as any); setView(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm ${isActive ? 'bg-slate-100 text-[#002B5B] dark:bg-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className="flex items-center gap-3">{item.icon} <span>{item.label}</span></div>
                    {item.badge !== undefined && item.badge > 0 && <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{item.badge}</span>}
                  </button>
                )
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className={`h-20 shrink-0 px-6 md:px-8 flex items-center justify-between z-10 transition-colors border-b ${highContrast ? 'bg-[#0f172a]/80 backdrop-blur-md border-slate-800' : 'bg-white/80 backdrop-blur-md border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Menu size={20}/></button>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block capitalize">
              {view.replace('_', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <select value={lang} onChange={(e) => handleLangChange(e.target.value)} className={`hidden sm:block text-xs font-medium px-2.5 py-1.5 rounded-md border outline-none cursor-pointer ${highContrast ? 'bg-slate-800 border-slate-700 text-slate-300 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-blue-500'}`}>
              <option value="en">EN</option><option value="hi">HI</option><option value="pa">PA</option>
            </select>

            <button onClick={() => setView('notifications')} className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
              <Bell size={18} />
              {unreadNotifications > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-[#0f172a]"></span>}
            </button>
          </div>
        </header>

        {/* Dynamic Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            
            {/* Role-Specific Dashboards */}
            {(view === 'dashboard' || view === 'users') && role === 'ELDERLY' && <ElderlyDashboard token={token} user={user} t={t} hc={highContrast} simpleMode={simpleMode} onStartGame={(gameId: any, diff='Easy') => { setSelectedGame(gameId as any); setSelectedDiff(diff); setView('game'); }} onShowProgress={() => setView('progress')} />}
            {(view === 'dashboard' || view === 'users') && role === 'CAREGIVER' && <CaregiverDashboard token={token} user={user} t={t} hc={highContrast} />}
            {(view === 'dashboard' || view === 'users') && role === 'PROFESSIONAL' && <ProfessionalDashboard token={token} t={t} hc={highContrast} />}
            {(view === 'dashboard' || view === 'users') && role === 'ADMIN' && <AdminDashboard token={token} t={t} hc={highContrast} />}
            {/* Common Views */}
            {view === 'game' && role === 'ELDERLY' && <Games token={token} gameId={selectedGame} initialDiff={selectedDiff} onBack={() => setView('dashboard')} t={t} hc={highContrast} />}
            {view === 'progress' && role === 'ELDERLY' && <ElderlyProgress token={token} onBack={() => setView('dashboard')} t={t} hc={highContrast} />}
            {view === 'notifications' && <Notifications token={token} t={t} hc={highContrast} />}
            {view === 'profile' && <Profile token={token} user={user} onUpdateUser={handleUpdateUser} t={t} hc={highContrast} />}
            {view === 'settings' && <Settings token={token} user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} t={t} hc={highContrast} />}
            
            {/* Placeholders for views missing dedicated components but present in nav */}
            {view === 'reminders' && (
              <div className={`p-12 text-center rounded-xl border border-dashed ${highContrast ? 'border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-500'}`}>
                <Bell className="mx-auto mb-4 opacity-50" size={32} />
                <h3 className="text-lg font-semibold mb-2">Reminders Center</h3>
                <p className="text-sm">Advanced reminder management coming soon.</p>
                <button onClick={() => setView('dashboard')} className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm">Return to Dashboard</button>
              </div>
            )}
            {view === 'chat' && (
              <div className={`p-12 text-center rounded-xl border border-dashed ${highContrast ? 'border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-500'}`}>
                <MessageSquare className="mx-auto mb-4 opacity-50" size={32} />
                <h3 className="text-lg font-semibold mb-2">Talk to AROHA</h3>
                <p className="text-sm">Conversational AI integration coming soon.</p>
                <button onClick={() => setView('dashboard')} className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm">Return to Dashboard</button>
              </div>
            )}
            {view === 'caregiver' && role === 'ELDERLY' && (
              <div className={`p-12 text-center rounded-xl border border-dashed ${highContrast ? 'border-slate-700 text-slate-400' : 'bg-white border-slate-300 text-slate-500'}`}>
                <Users className="mx-auto mb-4 opacity-50" size={32} />
                <h3 className="text-lg font-semibold mb-2">Caregiver Management</h3>
                <p className="text-sm">Manage your caregiver connection here.</p>
                <button onClick={() => setView('dashboard')} className="mt-6 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm">Return to Dashboard</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
