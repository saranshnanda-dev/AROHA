import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Bell, Settings as SettingsIcon, User, Brain, Activity, Sparkles, Shield, LayoutDashboard, Menu, X, LogOut, CheckCircle, Clock, Users, HelpCircle, MessageSquare, ChevronRight, Target, Trophy, Calendar, TrendingUp, Gamepad2, HeartPulse, Info, Camera, Save, Lock, Monitor, Type, UserCheck, UserX, ArrowLeft, Search, Download, XCircle, Plus, Trash2, RefreshCw, LayoutGrid, Play, ArrowDownUp, FileText, ShieldAlert, UserPlus, Check, Copy } from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

export default function ElderlyDashboard({ token, user, t, hc, simpleMode, onStartGame, onShowProgress }: any) {
  const [reminders, setReminders] = useState<any[]>([]);
  const [rec, setRec] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [cgConn, setCgConn] = useState<any>(null);
  const [showCgModal, setShowCgModal] = useState(false);
  const [cgCode, setCgCode] = useState('');
  const [cgMsg, setCgMsg] = useState({ text: '', type: '' });
  const [status, setStatus] = useState('loading');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : (hour < 18 ? 'Good Afternoon' : 'Good Evening');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [remRes, recRes, progRes, cgRes] = await Promise.all([
          fetch(`${API_URL}/api/reminders`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/recommendations/latest`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/elderly/progress`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/elderly/caregiver`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (!remRes.ok) throw new Error("Error");
        setReminders(await remRes.json());
        setRec(await recRes.json());
        setProgress(await progRes.json());
        setCgConn(await cgRes.json());
        setStatus('success');
      } catch (error) { setStatus('error'); }
    };
    fetchData();
  }, [token]);

  const connectCaregiver = async (e: any) => {
    e.preventDefault();
    setCgMsg({text: '', type: ''});
    try {
      const res = await fetch(`${API_URL}/api/elderly/connect`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ code: cgCode })
      });
      const data = await res.json();
      if(res.ok) {
        setCgMsg({text: data.message, type: 'success'});
        setTimeout(() => { setShowCgModal(false); window.location.reload(); }, 1500);
      } else {
        setCgMsg({text: data.message, type: 'error'});
      }
    } catch(err) { setCgMsg({text: 'Connection error.', type: 'error'}); }
  };

  const removeCaregiver = async (id: number) => {
    if(!window.confirm("Remove caregiver access?")) return;
    try {
      await fetch(`${API_URL}/api/connections/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      setCgConn(null);
    } catch(err) {}
  };

  const markDone = async (id: number) => {
    await fetch(`${API_URL}/api/reminders/${id}/complete`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    setReminders(reminders.map(r => r.id === id ? {...r, completed: 1} : r));
  };

  if (status === 'loading') return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
    </div>
  );

  const pendingReminders = reminders.filter(r => !r.completed);
  const nextReminder = pendingReminders.length > 0 ? pendingReminders[0].time : '--:--';

  // Enterprise card styling: refined borders, tighter padding, smaller radius
  const cardBase = `p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm`;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* Sleek Enterprise Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {greeting}, {user.name.split(' ')[0]}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('elderly.welcome')}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onStartGame('select')} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <Brain size={16} /> {t('elderly.action_game')}
          </button>
        </div>
      </div>

      {/* Tighter KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardBase}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">{t('elderly.kpi_activity')}</p>
            <Activity size={16} className="text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{progress?.gamesCompleted || 0}</p>
            <span className="text-xs text-slate-500">{t('elderly.kpi_completed')}</span>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">{t('elderly.kpi_streak')}</p>
            <Sparkles size={16} className="text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{progress?.activeDays || 0}</p>
            <span className="text-xs text-slate-500">{t('elderly.kpi_days')}</span>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">{t('elderly.kpi_score')}</p>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{progress?.bestScore || '0%'}</p>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">{t('elderly.kpi_reminder')}</p>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">{nextReminder}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recommendation Card - Sleeker */}
        <div className={`lg:col-span-2 ${cardBase} flex flex-col justify-center relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Brain size={120} />
          </div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t('elderly.rec_title')}</h3>
            <span className="text-[10px] font-medium px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md border border-blue-100 dark:border-blue-800">{t('elderly.rec_tag')}</span>
          </div>
          
          {rec ? (
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
              <div className="flex-1">
                <h4 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">{rec.activity.replace('_', ' ')}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md">{rec.reason || "{t('elderly.rec_default_desc')}"}</p>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">{t('elderly.rec_level')}: {rec.difficulty}</span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"><Clock size={12}/> {t('elderly.rec_duration')}</span>
                </div>
              </div>
              <button 
                onClick={() => onStartGame(rec.activity, rec.difficulty)} 
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {t('elderly.start_activity')} <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <div className="py-6 text-slate-500 text-sm">
              {t('elderly.no_rec')}
            </div>
          )}
        </div>

        {/* Your Caregiver - Professional Widget */}
        <div className={`${cardBase} flex flex-col`}>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('connect.title')}</h3>
          
          {cgConn ? (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-5 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {cgConn.avatar ? <img src={cgConn.avatar} className="w-full h-full object-cover"/> : <span className="font-medium text-slate-500 text-sm">{cgConn.caregiver_name.charAt(0)}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">{cgConn.caregiver_name}</h4>
                  <div className="flex items-center gap-1 mt-0.5 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${cgConn.status === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span className="text-slate-500 capitalize">{cgConn.status.toLowerCase()}</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto space-y-2">
                <button className="w-full py-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-medium rounded-lg text-sm transition-colors shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700">Message</button>
                <button onClick={() => removeCaregiver(cgConn.id)} className="w-full py-2 text-rose-600 hover:bg-rose-50 font-medium rounded-lg text-sm transition-colors dark:hover:bg-rose-900/20">{t('connect.remove')}</button>
              </div>
            </div>
          ) : (
             <div className="flex-1 flex flex-col justify-center">
                <p className="text-xs text-slate-500 mb-4">{t('connect.none')}</p>
                <button onClick={() => setShowCgModal(true)} className="w-full py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm">{t('connect.add')}</button>
             </div>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reminders List - SaaS Style */}
        <div className={cardBase}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t('elderly.reminders_title')}</h3>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">{pendingReminders.length} pending</span>
          </div>
          
          <div className="space-y-2">
            {pendingReminders.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-sm border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                {t('elderly.reminders_empty')}
              </div>
            ) : (
              pendingReminders.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 hover:border-blue-200 dark:hover:border-blue-900 transition-colors group">
                  <div className="flex items-center gap-3">
                    <button onClick={() => markDone(r.id)} className="w-5 h-5 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center group-hover:border-blue-500 transition-colors text-transparent hover:text-blue-500">
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <div>
                      <h4 className="font-medium text-sm text-slate-900 dark:text-slate-200">{r.title}</h4>
                      <p className="text-xs text-slate-500">{r.time}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links / Navigation */}
        <div className={cardBase}>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('elderly.quick_actions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onStartGame('select')} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-md dark:bg-blue-900/30"><Brain size={16} /></div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{t('elderly.action_game')}</div>
                <div className="text-xs text-slate-500">Cognitive modules</div>
              </div>
            </button>
            <button onClick={onShowProgress} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md dark:bg-emerald-900/30"><TrendingUp size={16} /></div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{t('elderly.action_progress')}</div>
                <div className="text-xs text-slate-500">View progress</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-md dark:bg-amber-900/30"><Bell size={16} /></div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{t('elderly.action_reminders')}</div>
                <div className="text-xs text-slate-500">Manage routines</div>
              </div>
            </button>
            <button className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-md dark:bg-purple-900/30"><User size={16} /></div>
              <div>
                <div className="text-sm font-medium text-slate-900 dark:text-white">{t('nav.profile')}</div>
                <div className="text-xs text-slate-500">Profile settings</div>
              </div>
            </button>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
             <div className="flex items-start gap-3">
                <div className="mt-0.5"><Sparkles size={16} className="text-orange-500"/></div>
                <div>
                   <p className="text-sm font-medium text-slate-900 dark:text-white">{t('elderly.motivation_title')}</p>
                   <p className="text-xs text-slate-500 mt-1 leading-relaxed">Consistent daily engagement improves neuroplasticity. You are on a {progress?.activeDays || 0} day streak.</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* CONNECT CAREGIVER MODAL */}
      {showCgModal && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`w-full max-w-sm rounded-xl shadow-xl p-6 animate-fade-in ${hc ? 'bg-[#0f172a] border border-slate-800' : 'bg-white'}`}>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">{t('connect.title')}</h3>
                  <button onClick={() => setShowCgModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
               </div>
               <p className="text-xs text-slate-500 mb-6">{t('connect.code_prompt')}</p>
               
               {cgMsg.text && <div className={`p-3 rounded-lg text-xs font-medium mb-4 ${cgMsg.type==='error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{cgMsg.text}</div>}
               
               <form onSubmit={connectCaregiver}>
                  <input type="text" placeholder="AROHA-XXXXXX" value={cgCode} onChange={e=>setCgCode(e.target.value)} className={`w-full p-3 text-center tracking-widest font-mono text-sm rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-6 ${hc ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
                  <div className="flex gap-2">
                     <button type="button" onClick={() => setShowCgModal(false)} className={`flex-1 py-2.5 text-sm font-medium rounded-lg border transition-all ${hc ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'}`}>{t('btn.cancel')}</button>
                     <button type="submit" className="flex-1 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium shadow-sm transition-all">{t('connect.send')}</button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}
