import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Bell, Settings as SettingsIcon, User, Brain, Activity, Sparkles, Shield, LayoutDashboard, Menu, X, LogOut, CheckCircle, Clock, Users, HelpCircle, MessageSquare, ChevronRight, Target, Trophy, Calendar, TrendingUp, Gamepad2, HeartPulse, Info, Camera, Save, Lock, Monitor, Type, UserCheck, UserX, ArrowLeft, Search, Download, XCircle, Plus, Trash2, RefreshCw, LayoutGrid, Play, ArrowDownUp, FileText, ShieldAlert, UserPlus, Check, Copy } from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

interface NotificationsProps {
  token: string;
  t: (key: string) => string;
  hc: boolean;
}

export default function Notifications({ token, t, hc }: NotificationsProps) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [status, setStatus] = useState('loading');

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setNotifications(await res.json());
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  useEffect(() => { fetchNotifications(); }, [token]);

  const markAsRead = async (id: number) => {
    await fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  const markAllAsRead = async () => {
    await fetch(`${API_URL}/api/notifications/read-all`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
    setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'GAME': return <Gamepad2 className="text-[#FF6B00]" size={20} />;
      case 'REMINDER': return <Bell className="text-emerald-500" size={20} />;
      case 'RECOMMENDATION': return <Sparkles className="text-amber-500" size={20} />;
      case 'ACCOUNT': return <HeartPulse className="text-purple-500" size={20} />;
      default: return <Info className="text-slate-500" size={20} />;
    }
  };

  if (status === 'loading') return <div className="p-12 text-center font-bold opacity-60">Loading...</div>;

  return (
    <div className={`p-6 md:p-8 rounded-2xl shadow-sm border max-w-3xl mx-auto space-y-6 ${hc ? 'bg-[#0B1120] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t('notif.title')}</h2>
          <p className="text-sm font-semibold opacity-60 mt-0.5">Stay updated on your cognitive journey</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllAsRead} className="px-4 py-2 bg-[#F4F7FB] text-[#002B5B] border border-[#D1DEEC] dark:bg-[#002B5B]/40 dark:text-[#FFB800] dark:border-[#002B5B] text-xs font-bold rounded-lg hover:bg-[#E3EDF7] transition-colors">
            {t('notif.mark_all')}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={`p-12 text-center rounded-xl border border-dashed font-semibold opacity-60 ${hc ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-slate-50'}`}>
          {t('notif.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${n.is_read ? (hc ? 'bg-[#0B1120] border-slate-800 opacity-60' : 'bg-slate-50 border-slate-200 opacity-70') : (hc ? 'bg-slate-800 border-slate-600 shadow-sm cursor-pointer' : 'bg-white border-[#D1DEEC] shadow-sm cursor-pointer')}`}>
              <div className={`p-2 rounded-lg shrink-0 ${hc ? 'bg-slate-950' : 'bg-slate-100'}`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-sm">{n.title}</h4>
                  <span className="text-[10px] font-semibold opacity-50 whitespace-nowrap">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium opacity-80 leading-relaxed">{n.message}</p>
              </div>
              {!n.is_read && <div className="w-2.5 h-2.5 rounded-full bg-[#F4F7FB]0 shrink-0 mt-1.5 shadow-sm shadow-blue-200"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
