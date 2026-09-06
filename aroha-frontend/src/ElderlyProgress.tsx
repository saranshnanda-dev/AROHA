import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Bell, Settings as SettingsIcon, User, Brain, Activity, Sparkles, Shield, LayoutDashboard, Menu, X, LogOut, CheckCircle, Clock, Users, HelpCircle, MessageSquare, ChevronRight, Target, Trophy, Calendar, TrendingUp, Gamepad2, HeartPulse, Info, Camera, Save, Lock, Monitor, Type, UserCheck, UserX, ArrowLeft, Search, Download, XCircle, Plus, Trash2, RefreshCw, LayoutGrid, Play, ArrowDownUp, FileText, ShieldAlert, UserPlus, Check, Copy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

interface ElderlyProgressProps {
  token: string;
  onBack: () => void;
  t: (key: string) => string;
  hc: boolean;
}

export default function ElderlyProgress({ token, onBack, t, hc }: ElderlyProgressProps) {
  const [stats, setStats] = useState({ gamesCompleted: 0, bestScore: '0%', activeDays: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const [statRes, histRes] = await Promise.all([
          fetch(`${API_URL}/api/elderly/progress`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/api/elderly/history`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (statRes.ok) setStats(await statRes.json());
        if (histRes.ok) setHistory(await histRes.json());
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    };
    fetchProgress();
  }, [token]);

  if (status === 'loading') return <div className="p-12 text-center font-bold opacity-60">{t('msg.loading')}</div>;

  const chartData = [...history].reverse().map((h, i) => ({
    session: i + 1,
    accuracy: Math.round((h.score / h.total) * 100),
    name: h.game_id
  }));

  return (
    <div className={`p-6 md:p-10 rounded-2xl shadow-sm border max-w-5xl mx-auto space-y-8 ${hc ? 'bg-[#0B1120] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black tracking-tight">{t('prog.title')}</h2>
          <p className="text-sm font-semibold opacity-60 mt-1">Review your recent cognitive activity</p>
        </div>
        <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl border transition-colors ${hc ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 shadow-sm'}`}>
          <ArrowLeft size={16}/> {t('btn.back')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${hc ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <Target className="text-[#FF6B00] mb-2" size={24}/>
          <div className="text-3xl font-black">{stats.gamesCompleted}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">Sessions Played</div>
        </div>
        <div className={`p-5 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${hc ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <Trophy className="text-emerald-500 mb-2" size={24}/>
          <div className="text-3xl font-black">{stats.bestScore}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">Highest Accuracy</div>
        </div>
        <div className={`p-5 rounded-xl border flex flex-col items-center justify-center text-center shadow-sm ${hc ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <Calendar className="text-purple-500 mb-2" size={24}/>
          <div className="text-3xl font-black">{stats.activeDays}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">Active Days</div>
        </div>
      </div>

      {history.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl border shadow-sm ${hc ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 opacity-80 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500"/> Accuracy Trend</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={hc ? "#334155" : "#f1f5f9"} />
                  <XAxis dataKey="session" stroke={hc ? "#64748b" : "#94a3b8"} fontSize={12} tickLine={false} />
                  <YAxis stroke={hc ? "#64748b" : "#94a3b8"} domain={[0, 100]} fontSize={12} tickLine={false} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', fontWeight: 'bold', fontSize: '12px', backgroundColor: hc ? '#0f172a' : '#fff', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#FF6B00" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} name="Accuracy %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={`p-6 rounded-xl border shadow-sm flex flex-col ${hc ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 opacity-80 flex items-center gap-2"><Target size={16} className="text-[#FF6B00]"/> {t('prog.recent')}</h3>
            <div className={`overflow-auto border rounded-xl max-h-[224px] custom-scrollbar ${hc ? 'border-slate-700' : 'border-slate-200'}`}>
              <table className="w-full text-left border-collapse text-xs">
                <thead className={`sticky top-0 font-bold uppercase tracking-wider ${hc ? 'bg-[#0B1120] text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <tr>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700">Date</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700">Game</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                  {history.map((h, i) => {
                    const acc = Math.round((h.score / h.total) * 100);
                    return (
                      <tr key={i} className={`transition-colors ${hc ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                        <td className="p-3 opacity-80">{new Date(h.created_at).toLocaleDateString()}</td>
                        <td className="p-3 font-bold">{h.game_id.replace('_', ' ')}</td>
                        <td className={`p-3 font-bold ${acc >= 80 ? 'text-emerald-600' : acc >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{acc}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className={`p-12 text-center rounded-xl border border-dashed font-semibold opacity-60 ${hc ? 'border-slate-700 bg-slate-800/50' : 'border-slate-300 bg-slate-50'}`}>
          {t('prog.empty')}
        </div>
      )}
    </div>
  );
}
