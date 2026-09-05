import React, { useState } from 'react';
import { Eye, EyeOff, Bell, Settings as SettingsIcon, User, Brain, Activity, Sparkles, Shield, LayoutDashboard, Menu, X, LogOut, CheckCircle, Clock, Users, HelpCircle, MessageSquare, ChevronRight, Target, Trophy, Calendar, TrendingUp, Gamepad2, HeartPulse, Info, Camera, Save, Lock, Monitor, Type, UserCheck, UserX, ArrowLeft, Search, Download, XCircle, Plus, Trash2, RefreshCw, LayoutGrid, Play, ArrowDownUp, FileText, ShieldAlert, UserPlus, Check, Copy } from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

interface ProfileProps {
  token: string;
  user: any;
  onUpdateUser: (data: any) => void;
  t: (key: string) => string;
  hc: boolean;
}

export default function Profile({ token, user, onUpdateUser, t, hc }: ProfileProps) {
  const [name, setName] = useState(user.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name })
      });
      if (res.ok) { onUpdateUser({ name }); setMsg({ text: 'Profile updated successfully.', type: 'success' }); }
    } catch(err) { setMsg({ text: 'Error updating profile.', type: 'error' }); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if(newPassword.length < 8) return setMsg({text:'Password must be at least 8 characters.', type:'error'});
    try {
      const res = await fetch(`${API_URL}/api/profile/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if(res.ok) { setMsg({ text: data.message, type: 'success' }); setCurrentPassword(''); setNewPassword(''); }
      else setMsg({ text: data.message, type: 'error' });
    } catch(err) { setMsg({ text: 'Error changing password.', type: 'error' }); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        const res = await fetch(`${API_URL}/api/profile/avatar`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ avatar: base64String })
        });
        if(res.ok) { onUpdateUser({ avatar: base64String }); setMsg({text: 'Photo updated.', type:'success'}); }
      } catch(err) {}
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`max-w-4xl mx-auto rounded-2xl shadow-sm border overflow-hidden flex flex-col md:flex-row ${hc ? 'bg-[#0B1120] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
      
      <div className={`p-8 md:p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r ${hc ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} md:w-1/3`}>
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-md flex items-center justify-center overflow-hidden bg-[#E3EDF7] text-[#002B5B] dark:bg-[#002B5B] dark:text-[#FFB800]">
            {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" /> : <User size={48} />}
          </div>
          <label className="absolute bottom-0 right-0 p-2.5 bg-[#002B5B] text-white rounded-full cursor-pointer hover:bg-[#001A3D] shadow-md transition-colors border-2 border-white dark:border-slate-800">
            <Camera size={16} />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <h2 className="text-2xl font-black text-center">{user.name}</h2>
        <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${hc ? 'bg-slate-800 text-slate-300 border-slate-600' : 'bg-white text-slate-500 border-slate-200 shadow-sm'}`}>
          {user.role}
        </span>
      </div>

      <div className="flex-1 p-8 md:p-10">
        <h3 className="text-xl font-bold mb-6 tracking-tight">{t('profile.title')}</h3>
        
        {msg.text && (
          <div className={`p-3 mb-6 font-bold text-sm rounded-lg border ${msg.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="mb-10 space-y-4">
          <div>
            <label className="text-sm font-semibold opacity-70 block mb-1.5">{t('auth.name')}</label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} className={`w-full p-3 rounded-lg text-sm font-semibold border outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#FF6B00] transition-all ${hc ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
          </div>
          <div>
            <label className="text-sm font-semibold opacity-70 block mb-1.5">{t('auth.email')} (Read Only)</label>
            <input type="email" value={user.email} disabled className={`w-full p-3 rounded-lg text-sm font-semibold border opacity-60 cursor-not-allowed ${hc ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-500'}`} />
          </div>
          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-[#002B5B] text-white font-bold text-sm rounded-lg hover:bg-[#001A3D] active:scale-[0.98] transition-all shadow-sm">
            <Save size={16}/> {t('btn.save')}
          </button>
        </form>

        <h3 className="text-xl font-bold mb-6 tracking-tight pt-6 border-t border-slate-100 dark:border-slate-800">{t('profile.security')}</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm font-semibold opacity-70 block mb-1.5">{t('profile.cur_pass')}</label>
            <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className={`w-full p-3 rounded-lg text-sm font-semibold border outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#FF6B00] transition-all ${hc ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
          </div>
          <div>
            <label className="text-sm font-semibold opacity-70 block mb-1.5">{t('profile.new_pass')}</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className={`w-full p-3 rounded-lg text-sm font-semibold border outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#FF6B00] transition-all ${hc ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'}`} required />
          </div>
          <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-white font-bold text-sm rounded-lg hover:bg-slate-700 active:scale-[0.98] transition-all shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600 border border-transparent dark:border-slate-600">
            <Lock size={16}/> Change Password
          </button>
        </form>
      </div>

    </div>
  );
}
