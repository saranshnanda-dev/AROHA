import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Bell, Settings as SettingsIcon, User, Brain, Activity, Sparkles, Shield, LayoutDashboard, Menu, X, LogOut, CheckCircle, Clock, Users, HelpCircle, MessageSquare, ChevronRight, Target, Trophy, Calendar, TrendingUp, Gamepad2, HeartPulse, Info, Camera, Save, Lock, Monitor, Type, UserCheck, UserX, ArrowLeft, Search, Download, XCircle, Plus, Trash2, RefreshCw, LayoutGrid, Play, ArrowDownUp, FileText, ShieldAlert, UserPlus, Check, Copy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000';

export default function ProfessionalDashboard({ token, t, hc }: any) {
  const [data, setData] = useState<any>({ stats: {}, patients: [] });
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const res = await fetch(`${API_URL}/api/professional/overview`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed');
        setData(await res.json());
        setStatus('success');
      } catch (e) { setStatus('error'); }
    };
    loadOverview();
  }, [token]);

  if (status === 'loading') return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
    </div>
  );

  const cardBase = `p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm`;

  // Standard SaaS trend mock data
  const trendData = [{name:'Mon', val:120}, {name:'Tue', val:180}, {name:'Wed', val:150}, {name:'Thu', val:200}, {name:'Fri', val:240}, {name:'Sat', val:190}, {name:'Sun', val:220}];
  const pieData = [{name:'Easy', value:42, color:'#3b82f6'}, {name:'Medium', value:38, color:'#f59e0b'}, {name:'Hard', value:20, color:'#ef4444'}];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Professional Console</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Aggregate cognitive metrics & client telemetry.</p>
        </div>
        <button className="px-4 py-2 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm">
          <Download size={16} /> Export Report
        </button>
      </div>

      {/* KPI Row - SaaS Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={cardBase}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Active Clients</p>
            <Users size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data.stats.total_patients || 28}</p>
        </div>
        <div className={cardBase}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Daily Sessions</p>
            <Activity size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{19}</p>
        </div>
        <div className={cardBase}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Total Telemetry</p>
            <Brain size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data.stats.total_sessions || 342}</p>
        </div>
        <div className={cardBase}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Avg. Performance</p>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data.stats.global_accuracy || 81}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className={`lg:col-span-2 ${cardBase}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white">Activity Volume</h3>
            <select className="text-xs border border-slate-200 dark:border-slate-700 bg-transparent rounded-md px-2 py-1 outline-none text-slate-600 dark:text-slate-400">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={hc ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12, fill:'#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:12, fill:'#94a3b8'}} />
                <RechartsTooltip contentStyle={{borderRadius:'8px', border:'1px solid #e2e8f0', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize:'12px'}} />
                <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} dot={{r:3, strokeWidth:1}} activeDot={{r:5}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className={`${cardBase} flex flex-col`}>
          <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Session Difficulty</h3>
          <div className="flex-1 min-h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={75} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-semibold text-slate-900 dark:text-white">342</span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            {pieData.map((d, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: d.color}}></div>{d.name}
                </div>
                <span className="font-medium text-slate-900 dark:text-white">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className={`${cardBase} p-0 overflow-hidden`}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-[#0f172a]/50">
          <h3 className="font-semibold text-slate-900 dark:text-white">Client Activity Stream</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
            <input type="text" placeholder="Search clients..." className="pl-9 pr-4 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] text-sm outline-none focus:border-blue-500 w-48 transition-colors" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Client</th>
                <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Activity</th>
                <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Score</th>
                <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider">Duration</th>
                <th className="px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wider text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-medium text-[10px]">RK</div>
                  <span className="font-medium text-slate-900 dark:text-white">Rajesh Kumar</span>
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">Memory Match</td>
                <td className="px-5 py-3"><span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400">85%</span></td>
                <td className="px-5 py-3 text-slate-500">5 min</td>
                <td className="px-5 py-3 text-slate-500 text-right">Today, 10:24 AM</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-medium text-[10px]">SD</div>
                  <span className="font-medium text-slate-900 dark:text-white">Savita Devi</span>
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">Number Recall</td>
                <td className="px-5 py-3"><span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400">78%</span></td>
                <td className="px-5 py-3 text-slate-500">6 min</td>
                <td className="px-5 py-3 text-slate-500 text-right">Today, 09:12 AM</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-3 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-medium text-[10px]">AM</div>
                  <span className="font-medium text-slate-900 dark:text-white">Anil Mehta</span>
                </td>
                <td className="px-5 py-3 text-slate-600 dark:text-slate-300">Pattern Recognition</td>
                <td className="px-5 py-3"><span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400">92%</span></td>
                <td className="px-5 py-3 text-slate-500">4 min</td>
                <td className="px-5 py-3 text-slate-500 text-right">Today, 08:45 AM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
