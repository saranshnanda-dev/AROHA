import React, { useState } from 'react';
import { Eye, EyeOff, Bell, Settings as SettingsIcon, User, Brain, Activity, Sparkles, Shield, LayoutDashboard, Menu, X, LogOut, CheckCircle, Clock, Users, HelpCircle, MessageSquare, ChevronRight, Target, Trophy, Calendar, TrendingUp, Gamepad2, HeartPulse, Info, Camera, Save, Lock, Monitor, Type, UserCheck, UserX, ArrowLeft, Search, Download, XCircle, Plus, Trash2, RefreshCw, LayoutGrid, Play, ArrowDownUp, FileText, ShieldAlert, UserPlus, Check, Copy } from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

interface SettingsProps {
  token: string;
  user: any;
  onUpdateUser: (data: any) => void;
  onLogout: () => void;
  t: (key: string) => string;
  hc: boolean;
}

export default function Settings({ token, user, onUpdateUser, onLogout, t, hc }: SettingsProps) {
  const [settings, setSettings] = useState({
    language: user.language || 'en',
    font_size: user.font_size || 'text-normal',
    high_contrast: user.high_contrast === 1,
    simple_mode: user.simple_mode === 1,
    voice_enabled: user.voice_enabled === 1,
    notify_games: user.notify_games === 1,
    notify_reminders: user.notify_reminders === 1,
    notify_recs: user.notify_recs === 1
  });
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/users/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        onUpdateUser({ 
          language: settings.language, font_size: settings.font_size, 
          high_contrast: settings.high_contrast ? 1 : 0, simple_mode: settings.simple_mode ? 1 : 0,
          voice_enabled: settings.voice_enabled ? 1 : 0, notify_games: settings.notify_games ? 1 : 0,
          notify_reminders: settings.notify_reminders ? 1 : 0, notify_recs: settings.notify_recs ? 1 : 0
        });
        setMsg('Settings saved securely.');
        setTimeout(() => setMsg(''), 3000);
      }
    } catch(err) { setMsg('Error saving settings.'); }
  };

  const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between cursor-pointer py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm font-semibold">{label}</span>
      <div className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-[#F4F7FB]0' : 'bg-slate-300 dark:bg-slate-700'}`}>
        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}></div>
      </div>
      <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );

  return (
    <div className={`p-6 md:p-10 rounded-2xl shadow-sm border max-w-3xl mx-auto space-y-8 ${hc ? 'bg-[#0B1120] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
      
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t('settings.title')}</h2>
          <p className="text-sm font-semibold opacity-60 mt-0.5">Customize your platform experience</p>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs rounded-lg hover:bg-rose-600 hover:text-white transition-colors shadow-sm dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400">
          <LogOut size={16} /> {t('btn.logout')}
        </button>
      </div>

      {msg && <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold rounded-lg dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400">{msg}</div>}

      <form onSubmit={handleSave} className="space-y-8">
        
        <div className={`p-6 rounded-xl border ${hc ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-80 flex items-center gap-2"><Monitor size={16} className="text-[#FF6B00]"/> {t('settings.app')}</h3>
          
          <div className="mb-4">
            <label className="text-xs font-bold opacity-70 block mb-2 uppercase tracking-wider"><Type size={14} className="inline mr-1"/> {t('settings.text')}</label>
            <select value={settings.font_size} onChange={e=>setSettings({...settings, font_size: e.target.value})} className={`w-full p-2.5 text-sm font-semibold rounded-lg border outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#FF6B00] ${hc ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-slate-300'}`}>
              <option value="text-normal">Standard / Normal</option>
              <option value="text-large">Large (Enhanced Readability)</option>
              <option value="text-xlarge">Extra Large (Maximum Visibility)</option>
            </select>
          </div>

          <Toggle label={t('settings.contrast')} checked={settings.high_contrast} onChange={v => setSettings({...settings, high_contrast: v})} />
          {user.role.toUpperCase() === 'ELDERLY' && (
            <>
              <Toggle label={t('settings.simple')} checked={settings.simple_mode} onChange={v => setSettings({...settings, simple_mode: v})} />
              <Toggle label={t('settings.voice')} checked={settings.voice_enabled} onChange={v => setSettings({...settings, voice_enabled: v})} />
            </>
          )}
        </div>

        <div className={`p-6 rounded-xl border ${hc ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-80 flex items-center gap-2"><Bell size={16} className="text-emerald-500"/> {t('settings.notif')}</h3>
          <Toggle label="Game Activity & Session Reports" checked={settings.notify_games} onChange={v => setSettings({...settings, notify_games: v})} />
          <Toggle label="Daily Health Reminders" checked={settings.notify_reminders} onChange={v => setSettings({...settings, notify_reminders: v})} />
          <Toggle label="AI Recommendations & Goals" checked={settings.notify_recs} onChange={v => setSettings({...settings, notify_recs: v})} />
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-[#002B5B] text-white text-sm font-bold rounded-xl shadow-sm hover:bg-[#001A3D] active:scale-[0.98] transition-all">
            <Save size={18}/> {t('btn.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
