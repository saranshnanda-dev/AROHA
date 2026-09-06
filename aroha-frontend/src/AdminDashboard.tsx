import React, { useState, useEffect, useMemo } from 'react';
import { Eye, EyeOff, Bell, Settings as SettingsIcon, User, Brain, Activity, Sparkles, Shield, LayoutDashboard, Menu, X, LogOut, CheckCircle, Clock, Users, HelpCircle, MessageSquare, ChevronRight, Target, Trophy, Calendar, TrendingUp, Gamepad2, HeartPulse, Info, Camera, Save, Lock, Monitor, Type, UserCheck, UserX, ArrowLeft, Search, Download, XCircle, Plus, Trash2, RefreshCw, LayoutGrid, Play, ArrowDownUp, FileText, ShieldAlert, UserPlus, Check, Copy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

export default function AdminDashboard({ token, t, hc, activeView = 'overview' }: any) {
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorDetails, setErrorDetails] = useState<string>('');

  const [activeNav, setActiveNav] = useState<'overview' | 'users' | 'analytics' | 'logs'>(activeView === 'users' ? 'users' : 'overview');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'desc' });

  const [showModal, setShowModal] = useState(false);
  const [modalRole, setModalRole] = useState<'PROFESSIONAL' | 'ADMIN'>('PROFESSIONAL');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  useEffect(() => {
     if (activeView === 'users') setActiveNav('users');
     else if (activeView === 'dashboard') setActiveNav('overview');
  }, [activeView]);

  const loadData = async () => {
    try {
      setStatus('loading');
      setErrorDetails('');
      const [statRes, userRes, logRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/admin/logs`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!statRes.ok || !userRes.ok) throw new Error('API Request Failed');
      
      setStats(await statRes.json() || {});
      setUsers(await userRes.json() || []);
      setLogs(await logRes.json() || []);
      setStatus('success');
    } catch (err: any) {
      setErrorDetails(err.message || 'Error connecting to backend');
      setStatus('error');
    }
  };

  useEffect(() => { loadData(); }, [token]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users)) return [];
    const list = users.filter(u => {
      const uRole = (u.role || '').toUpperCase();
      const uStatus = (u.status || 'ACTIVE').toUpperCase();
      const q = search.trim().toLowerCase();
      const matchesRole = roleFilter === 'ALL' || uRole === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || uStatus === statusFilter;
      const matchesSearch = !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
      return matchesRole && matchesStatus && matchesSearch;
    });
    list.sort((a, b) => {
      let aVal = a[sortConfig.key] ?? ''; let bVal = b[sortConfig.key] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, search, roleFilter, statusFilter, sortConfig]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(''); setModalSuccess('');
    if (formData.password !== formData.confirmPassword) return setModalError('Passwords do not match.');
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, role: modalRole })
      });
      const data = await res.json();
      if (res.ok) {
        setModalSuccess(data.message); setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        loadData(); setTimeout(() => { setShowModal(false); setModalSuccess(''); }, 1500);
      } else setModalError(data.message || 'Failed to create account');
    } catch (err) { setModalError("Connection error."); }
  };

  const toggleUserStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (newStatus === 'INACTIVE' && !window.confirm("Deactivate this account?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) loadData();
    } catch(e) {}
  };

  const handleDeleteUser = async (userToDelete: any) => {
    if (!window.confirm(`Permanently delete "${userToDelete.name}"? This action cannot be undone.`)) return;
    try {
      setDeletingUserId(userToDelete.id);
      const res = await fetch(`${API_URL}/api/admin/users/${userToDelete.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { if (selectedUser?.id === userToDelete.id) setSelectedUser(null); await loadData(); }
    } catch (err) {} finally { setDeletingUserId(null); }
  };

  const exportUsersCSV = () => {
    if (!filteredUsers.length) return;
    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const rows = filteredUsers.map(u => [ u.id, `"${u.name || ''}"`, `"${u.email || ''}"`, u.role || '', u.status || 'ACTIVE', u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A' ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `AROHA_Users_${new Date().toISOString().split('T')[0]}.csv`; link.click();
  };

  if (status === 'loading') return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
    </div>
  );

  if (status === 'error') return (
    <div className={`p-12 text-center rounded-2xl border ${hc ? 'bg-[#0B1120] border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
      <h3 className="text-xl font-bold mb-2">Failed to load admin controls</h3>
      <p className="text-sm opacity-80 mb-6">{errorDetails || 'Backend server is unreachable.'}</p>
      <button onClick={loadData} className="px-6 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 flex items-center gap-2 mx-auto"><RefreshCw size={16}/> Retry</button>
    </div>
  );

  const cardBase = `p-6 rounded-2xl border shadow-sm ${hc ? 'bg-[#0B1120] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`;
  const growthData = [{name:'Aug', uv:65}, {name:'Sep', uv:85}, {name:'Oct', uv:120}, {name:'Nov', uv:156}];
  const roleData = [{name:'Elderly', value:stats.elderly_users||0, color:'#3b82f6'}, {name:'Caregivers', value:stats.caregivers||0, color:'#10b981'}, {name:'Professionals', value:stats.professionals||0, color:'#f59e0b'}, {name:'Admins', value:stats.admins||0, color:'#8b5cf6'}].filter(d=>d.value>0);
  const activityTrendData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((m, i) => ({ name: m, sessions: Math.max(2, ((stats.games_played || 7) * (i + 3)) % 18 + 4) }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      
      {/* Enterprise Header Area */}
      <div className={`p-6 md:p-8 rounded-2xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${hc ? 'bg-[#0B1120] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex items-center gap-5">
           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shadow-sm border shrink-0 ${hc ? 'bg-slate-800 border-slate-700 text-white' : 'bg-[#F4F7FB] border-[#D1DEEC] text-[#002B5B]'}`}>
             <ShieldAlert size={28} />
           </div>
           <div>
             <h2 className="text-3xl font-black tracking-tight">{t('admin.title')}</h2>
             <p className="text-sm font-semibold opacity-60 mt-1">{t('admin.subtitle')}</p>
           </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <button onClick={() => { setModalRole('PROFESSIONAL'); setShowModal(true); }} className={`flex-1 md:flex-none px-5 py-3 font-bold text-sm rounded-xl border transition-all flex items-center justify-center gap-2 shadow-sm ${hc ? 'bg-slate-800 border-indigo-900/60 text-indigo-300 hover:bg-slate-700' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'}`}>
             <UserPlus size={18}/> {t('admin.add_prof')}
           </button>
           <button onClick={() => { setModalRole('ADMIN'); setShowModal(true); }} className={`flex-1 md:flex-none px-5 py-3 font-bold text-sm rounded-xl border transition-all flex items-center justify-center gap-2 shadow-sm ${hc ? 'bg-slate-800 border-purple-900/60 text-purple-300 hover:bg-slate-700' : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'}`}>
             <ShieldAlert size={18}/> {t('admin.add_admin')}
           </button>
        </div>
      </div>

      {/* Horizontal Tab Navigation */}
      <div className={`flex items-center gap-2 p-1.5 rounded-xl border overflow-x-auto custom-scrollbar shadow-sm ${hc ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
         {[
           { id: 'overview', label: t('admin.nav_overview'), icon: <LayoutDashboard size={18} /> },
           { id: 'users', label: t('admin.nav_users'), icon: <Users size={18} />, badge: users.length },
           { id: 'analytics', label: 'Analytics', icon: <TrendingUp size={18} /> },
           { id: 'logs', label: t('admin.nav_logs'), icon: <FileText size={18} />, badge: logs.length }
         ].map(item => {
           const isActive = activeNav === item.id;
           return (
             <button
               key={item.id}
               onClick={() => setActiveNav(item.id as any)}
               className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                 isActive
                   ? 'bg-[#002B5B] text-white shadow-md'
                   : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
               }`}
             >
               {item.icon} {item.label}
               {item.badge !== undefined && (
                 <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                   {item.badge}
                 </span>
               )}
             </button>
           )
         })}
      </div>

      {/* VIEW: OVERVIEW */}
      {activeNav === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={cardBase}>
              <div className="flex justify-between items-start mb-2"><p className="text-sm font-semibold opacity-70 uppercase tracking-wider">{t('admin.total_users')}</p><Users size={20} className="text-blue-500" /></div>
              <p className="text-3xl font-black">{stats.total_users || 156}</p>
            </div>
            <div className={cardBase}>
              <div className="flex justify-between items-start mb-2"><p className="text-sm font-semibold opacity-70 uppercase tracking-wider">{t('admin.active_users')}</p><UserCheck size={20} className="text-emerald-500" /></div>
              <p className="text-3xl font-black">{stats.active_users || 132}</p>
            </div>
            <div className={cardBase}>
              <div className="flex justify-between items-start mb-2"><p className="text-sm font-semibold opacity-70 uppercase tracking-wider">{t('admin.elderly_users')}</p><Activity size={20} className="text-orange-500" /></div>
              <p className="text-3xl font-black">{stats.elderly_users || 89}</p>
            </div>
            <div className={cardBase}>
              <div className="flex justify-between items-start mb-2"><p className="text-sm font-semibold opacity-70 uppercase tracking-wider">{t('admin.staff_users')}</p><Shield size={20} className="text-purple-500" /></div>
              <p className="text-3xl font-black">{(stats.professionals||13) + (stats.admins||6)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`lg:col-span-2 ${cardBase}`}>
              <h3 className="font-bold text-lg mb-6">System Telemetry Trend</h3>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <defs><linearGradient id="colorS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#002B5B" stopOpacity={0.3}/><stop offset="95%" stopColor="#002B5B" stopOpacity={0}/></linearGradient></defs>
                     <CartesianGrid strokeDasharray="3 3" stroke={hc ? "#334155" : "#f1f5f9"} />
                     <XAxis dataKey="name" stroke={hc ? "#64748b" : "#94a3b8"} fontSize={12} tickLine={false} />
                     <YAxis stroke={hc ? "#64748b" : "#94a3b8"} fontSize={12} tickLine={false} />
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                     <Area type="monotone" dataKey="sessions" stroke="#002B5B" strokeWidth={3} fillOpacity={1} fill="url(#colorS)" />
                   </AreaChart>
                 </ResponsiveContainer>
              </div>
            </div>
            <div className={`${cardBase} flex flex-col`}>
              <h3 className="font-bold text-lg mb-6">{t('admin.role_dist')}</h3>
              <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleData} innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                      {roleData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {roleData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold">
                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></span>{d.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: DIRECTORY */}
      {activeNav === 'users' && (
        <div className={`p-6 rounded-2xl border shadow-sm space-y-5 animate-fade-in ${hc ? 'bg-[#0B1120] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
               <h3 className="text-xl font-black">User Directory</h3>
               <p className="text-xs font-semibold opacity-60">Manage accounts, toggle statuses, and delete records.</p>
             </div>
             <button onClick={loadData} className="p-2.5 border rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"><RefreshCw size={18}/></button>
          </div>
          
          <div className={`p-3 rounded-xl border flex flex-col lg:flex-row gap-3 items-center ${hc ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
             <div className="relative flex-1 w-full">
               <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
               <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full pl-10 pr-3 py-2 rounded-lg text-sm font-semibold border outline-none focus:border-[#FF6B00] ${hc ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-white border-slate-300'}`} />
             </div>
             <div className="flex flex-wrap gap-2 w-full lg:w-auto">
               <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className={`py-2 px-3 rounded-lg text-sm font-semibold border outline-none ${hc ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                 <option value="ALL">All Roles</option><option value="ELDERLY">Elderly</option><option value="CAREGIVER">Caregiver</option><option value="PROFESSIONAL">Professional</option><option value="ADMIN">Admin</option>
               </select>
               <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`py-2 px-3 rounded-lg text-sm font-semibold border outline-none ${hc ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-white border-slate-300'}`}>
                 <option value="ALL">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
               </select>
               <button onClick={exportUsersCSV} className={`py-2 px-4 font-bold text-sm rounded-lg border flex items-center gap-2 transition-all ${hc ? 'bg-[#0B1120] border-slate-700 hover:text-[#FFB800]' : 'bg-white border-slate-300 hover:bg-slate-100'}`}><Download size={14} /> Export</button>
             </div>
          </div>

          <div className={`overflow-x-auto border rounded-xl ${hc ? 'border-slate-800' : 'border-slate-200'}`}>
             <table className="w-full text-left border-collapse min-w-[800px] text-sm">
               <thead className={`uppercase tracking-wider font-bold text-xs ${hc ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-600'}`}>
                 <tr>
                   <th onClick={()=>handleSort('name')} className="p-4 cursor-pointer hover:underline"><div className="flex items-center gap-1">User {sortConfig.key==='name'&&<ArrowDownUp size={12}/>}</div></th>
                   <th onClick={()=>handleSort('email')} className="p-4 cursor-pointer hover:underline"><div className="flex items-center gap-1">Email {sortConfig.key==='email'&&<ArrowDownUp size={12}/>}</div></th>
                   <th onClick={()=>handleSort('role')} className="p-4 cursor-pointer hover:underline"><div className="flex items-center gap-1">Role {sortConfig.key==='role'&&<ArrowDownUp size={12}/>}</div></th>
                   <th onClick={()=>handleSort('status')} className="p-4 cursor-pointer hover:underline"><div className="flex items-center gap-1">Status {sortConfig.key==='status'&&<ArrowDownUp size={12}/>}</div></th>
                   <th className="p-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                 {filteredUsers.length === 0 ? (
                   <tr><td colSpan={5} className="p-8 text-center opacity-50">No users found.</td></tr>
                 ) : (
                   filteredUsers.map((u) => {
                     const isActive = (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
                     return (
                       <tr key={u.id} className={`transition-colors ${hc ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/80'}`}>
                         <td className="p-4 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border flex items-center justify-center font-bold text-sm text-slate-700 dark:text-slate-300 overflow-hidden shrink-0">
                             {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" /> : (u.name||'U').charAt(0)}
                           </div>
                           <span className="font-bold">{u.name}</span>
                         </td>
                         <td className="p-4 opacity-75 text-xs">{u.email}</td>
                         <td className="p-4"><span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${u.role==='ADMIN'?'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:border-purple-800':u.role==='PROFESSIONAL'?'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800':'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'}`}>{u.role}</span></td>
                         <td className="p-4">
                           <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${isActive?'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40':'bg-rose-50 text-rose-700 dark:bg-rose-950/40'}`}>
                             {isActive ? <CheckCircle size={12}/> : <XCircle size={12}/>} {isActive ? 'Active' : 'Inactive'}
                           </span>
                         </td>
                         <td className="p-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <button onClick={() => setSelectedUser(u)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${hc ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-100 shadow-sm'}`}>View</button>
                             <button onClick={() => toggleUserStatus(u.id, u.status || 'ACTIVE')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isActive ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>{isActive?'Deactivate':'Activate'}</button>
                             <button onClick={() => handleDeleteUser(u)} disabled={deletingUserId === u.id} className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"><Trash2 size={16}/></button>
                           </div>
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
          </div>
        </div>
      )}

      {/* VIEW: LOGS & ANALYTICS */}
      {activeNav === 'analytics' && (
        <div className={`p-8 rounded-2xl border shadow-sm text-center ${hc ? 'bg-[#0B1120] border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
          <TrendingUp className="mx-auto mb-4 opacity-50" size={48} />
          <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
          <p>Full cohort telemetry tracking is available on the Professional Dashboard.</p>
        </div>
      )}

      {activeNav === 'logs' && (
        <div className={`p-6 rounded-2xl border shadow-sm space-y-5 animate-fade-in ${hc ? 'bg-[#0B1120] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
           <h3 className="text-xl font-black">{t('admin.recent_activity')}</h3>
           <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
             {logs.length === 0 ? <div className="p-8 text-center opacity-50 font-bold">No activity recorded.</div> : logs.map((l, i) => (
               <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${hc ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                 <div className="flex items-center gap-3">
                   <div className="p-2.5 rounded-lg bg-[#F4F7FB] dark:bg-slate-800 text-[#002B5B] dark:text-[#FFB800]"><FileText size={18} /></div>
                   <div><div className="font-bold text-sm">{l.action}</div><div className="text-xs opacity-60 mt-0.5">Admin/Target ID: {l.target_user_id || 'System'}</div></div>
                 </div>
                 <span className="text-xs font-semibold opacity-60">{new Date(l.created_at).toLocaleString()}</span>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl border p-8 shadow-xl animate-fade-in ${hc ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
             <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
               <h4 className="text-xl font-black flex items-center gap-2">Add {modalRole === 'ADMIN' ? 'Administrator' : 'Professional'}</h4>
               <button onClick={() => setShowModal(false)} className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 transition-colors"><X size={18} /></button>
             </div>
             <form onSubmit={handleCreateAccount} className="space-y-4">
               {modalError && <div className="p-3 bg-rose-50 text-rose-700 font-bold text-sm rounded-lg border border-rose-200">{modalError}</div>}
               {modalSuccess && <div className="p-3 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-lg border border-emerald-200">{modalSuccess}</div>}
               <div><label className="text-xs font-bold opacity-75 block mb-1.5">Full Name</label><input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-bold border outline-none focus:border-[#FF6B00] ${hc ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`} required /></div>
               <div><label className="text-xs font-bold opacity-75 block mb-1.5">Email Address</label><input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-bold border outline-none focus:border-[#FF6B00] ${hc ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`} required /></div>
               <div><label className="text-xs font-bold opacity-75 block mb-1.5">Password</label><input type="password" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-bold border outline-none focus:border-[#FF6B00] ${hc ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`} required /></div>
               <div><label className="text-xs font-bold opacity-75 block mb-1.5">Confirm Password</label><input type="password" value={formData.confirmPassword} onChange={e=>setFormData({...formData, confirmPassword: e.target.value})} className={`w-full p-3 rounded-xl text-sm font-bold border outline-none focus:border-[#FF6B00] ${hc ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'}`} required /></div>
               <button type="submit" className={`w-full py-3.5 mt-2 text-sm font-bold rounded-xl text-white shadow-sm ${modalRole==='ADMIN'?'bg-purple-600 hover:bg-purple-700':'bg-[#002B5B] hover:bg-[#001A3D]'}`}>Create Account</button>
             </form>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-8 shadow-xl animate-fade-in ${hc ? 'bg-[#0B1120] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 rounded-full border-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-2xl text-slate-700 dark:text-slate-300 overflow-hidden mb-3">
                {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover"/> : (selectedUser.name||'U').charAt(0)}
              </div>
              <h3 className="text-2xl font-black tracking-tight">{selectedUser.name}</h3>
              <p className="text-sm opacity-60 font-bold mb-3">{selectedUser.email}</p>
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${selectedUser.role==='ADMIN'?'bg-purple-100 text-purple-800 border-purple-200':selectedUser.role==='PROFESSIONAL'?'bg-amber-100 text-amber-800 border-amber-200':'bg-blue-50 text-[#002B5B] border-[#002B5B]'}`}>{selectedUser.role}</span>
            </div>
            <button onClick={() => setSelectedUser(null)} className={`w-full py-3 font-bold text-sm rounded-xl border transition-colors ${hc ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>Close Window</button>
          </div>
        </div>
      )}
    </div>
  );
}
