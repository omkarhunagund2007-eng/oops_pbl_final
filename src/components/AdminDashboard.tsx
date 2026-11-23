import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Building2, FlaskConical,
  Wrench, Calendar, CalendarCheck, UserCheck, FileSpreadsheet, Settings, LogOut,
  Sun, Moon, Download, Search, Plus, Trash2, Check, X, Menu, Cpu, ArrowRight, Eye, Sparkles, MessageSquareWarning
} from 'lucide-react';

interface Props {
  token: string;
  user: { fullName: string; username: string };
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

type Section =
  | 'overview' | 'students' | 'faculty' | 'courses' | 'classrooms'
  | 'laboratories' | 'equipment' | 'activities' | 'bookings' | 'approvals' | 'reports' | 'settings' | 'complaints';

const CREST_IMG = '/src/assets/images/gmu_crest_emblem_1795328704978.jpg';
const DEAN_IMG = '/src/assets/images/avatar_admin_dean_1795328704517.jpg';
const HERO_IMG = '/src/assets/images/campus_arrival_backdrop_1795328704340.jpg';

function CountUpNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 550;
    const target = Number(value) || 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}</>;
}

const BOOKING_COLORS: Record<string, string> = {
  APPROVED: '#15803D',
  PENDING: '#C89B3C',
  REJECTED: '#B91C1C',
  CANCELLED: '#64748B',
};

export default function AdminDashboard({ token, user, darkMode, onToggleDarkMode, onLogout }: Props) {
  const [section, setSection] = useState<Section>('overview');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [inspectRow, setInspectRow] = useState<any | null>(null);

  // Interactive chart hover states
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  // Interactive 5-thread concurrency simulator
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any | null>(null);

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  async function api(path: string, method = 'GET', body?: unknown) {
    const res = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || 'Operation failed');
    return json.data;
  }

  async function refresh() {
    try {
      const s = await api('/api/admin/stats');
      setStats(s);
      if (section === 'students' || section === 'approvals') {
        const all = await api('/api/admin/students');
        setRows(section === 'approvals' ? all.filter((x: any) => x.accountStatus === 'PENDING') : all);
      } else if (['faculty', 'courses', 'classrooms', 'laboratories', 'equipment', 'events', 'bookings'].includes(section === 'activities' ? 'events' : section)) {
        const ep = section === 'activities' ? 'events' : section;
        setRows(await api(`/api/admin/${ep}`));
      }
    } catch (err: any) {
      notify(err.message);
    }
  }

  useEffect(() => {
    setSearch('');
    setShowAdd(false);
    setInspectRow(null);
    refresh();
  }, [section]);

  async function handleApproveStudent(id: number) {
    await api(`/api/admin/approvals/students/${id}/approve`, 'POST', {});
    notify('Student registration approved.');
    refresh();
  }

  async function handleRejectStudent(id: number) {
    await api(`/api/admin/approvals/students/${id}/reject`, 'POST', { reason: 'Incomplete documentation.' });
    notify('Student registration rejected.');
    refresh();
  }

  async function handleBookingDecision(id: number, approve: boolean) {
    await api(`/api/admin/bookings/${id}/${approve ? 'approve' : 'reject'}`, 'POST', {});
    notify(`Booking ${approve ? 'approved' : 'rejected'}.`);
    refresh();
  }

  async function handleRunRaceSimulation() {
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await api('/api/admin/bookings/simulate-race', 'POST', {
        resourceType: 'LABORATORY',
        resourceId: 1,
        startTime: '15:00',
        endTime: '17:00',
      });
      setSimResult(res);
      notify(`Concurrency test complete: ${res.bookedCount} winner, ${res.conflictCount} conflicts blocked.`);
      refresh();
    } catch (err: any) {
      notify(err.message);
    } finally {
      setSimLoading(false);
    }
  }

  async function handleDelete(ep: string, id: number) {
    await api(`/api/admin/${ep}/${id}`, 'DELETE');
    notify('Record deleted.');
    refresh();
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw: any = Object.fromEntries(new FormData(e.currentTarget).entries());
    ['departmentId', 'semester', 'credits', 'capacity', 'quantity', 'availableQuantity'].forEach(k => {
      if (raw[k] !== undefined) raw[k] = Number(raw[k]);
    });
    const ep = section === 'activities' ? 'events' : section;
    await api(`/api/admin/${ep}`, 'POST', raw);
    setShowAdd(false);
    notify('Record added successfully.');
    refresh();
  }

  function downloadCsv(filename: string, data: any[]) {
    if (!data.length) return notify('No rows to export.');
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  const navItems: Array<{ id: Section; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Student Management', icon: <Users className="w-4 h-4" /> },
    { id: 'faculty', label: 'Faculty Management', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'courses', label: 'Course Management', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'classrooms', label: 'Classroom Management', icon: <Building2 className="w-4 h-4" /> },
    { id: 'laboratories', label: 'Laboratory Management', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'equipment', label: 'Equipment Management', icon: <Wrench className="w-4 h-4" /> },
    { id: 'activities', label: 'Campus Activities', icon: <Calendar className="w-4 h-4" /> },
    { id: 'bookings', label: 'Resource Booking', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'approvals', label: 'Pending Approvals', icon: <UserCheck className="w-4 h-4" />, count: stats?.pendingRequests },
    { id: 'reports', label: 'Reports', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const filteredRows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  // Build SVG Donut arcs from bookingsByStatus
  const statusEntries = Object.entries(stats?.bookingsByStatus || {}) as Array<[string, number]>;
  const totalBookingsCount = Math.max(1, statusEntries.reduce((sum, [, c]) => sum + c, 0));
  let cumulativeAngle = 0;
  const donutSegments = statusEntries.map(([st, count]) => {
    const pct = count / totalBookingsCount;
    const dashArray = `${(pct * 251.2).toFixed(2)} 251.2`;
    const dashOffset = `${(-cumulativeAngle * 251.2).toFixed(2)}`;
    cumulativeAngle += pct;
    return { status: st, count, pct: Math.round(pct * 100), dashArray, dashOffset, color: BOOKING_COLORS[st] || '#64748B' };
  });

  return (
    <div className="flex min-h-screen campus-canvas-light text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-[#0B1D3A] text-slate-200 border-r border-[#C89B3C]/25 transition-transform lg:static lg:translate-x-0 ${
        mobileMenu ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <img src={CREST_IMG} alt="GM University" referrerPolicy="no-referrer" className="h-10 w-10 rounded-lg border border-[#E5B954]/50 object-cover" />
          <div>
            <div className="text-sm font-bold text-white tracking-wide">GM UNIVERSITY</div>
            <div className="text-[11px] text-[#E5B954]">Administrator Console</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => (
            <motion.button
              key={item.id}
              type="button"
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSection(item.id); setMobileMenu(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                section === item.id
                  ? 'bg-gradient-to-r from-[#C89B3C]/30 to-[#C89B3C]/10 text-[#FDE68A] ring-1 ring-[#E5B954]/50 shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="tabular-nums text-[11px] font-bold text-amber-300">{item.count}</span>
              )}
            </motion.button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-300 hover:bg-red-500/15 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-[#0E1A2F]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1E3254] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileMenu(m => !m)} className="lg:hidden p-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">GM University / Administration</div>
              <h1 className="text-sm font-bold">{navItems.find(n => n.id === section)?.label}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/download-spring-zip"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#C89B3C]/50 bg-[#0B1D3A] px-3 py-1.5 text-xs font-semibold text-[#FDE68A] hover:bg-[#142B52] transition-all hover:scale-[1.02] whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Java Spring ZIP
            </a>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#1E3254] bg-white dark:bg-[#0B1D3A] px-3 py-1.5 text-xs font-medium hover:border-[#C89B3C] transition-colors"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#0B1D3A]" />}
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <div className="flex items-center gap-2">
              <img src={DEAN_IMG} alt={user.fullName} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover border border-[#C89B3C]/60" />
              <span className="hidden md:inline text-xs font-semibold">{user.fullName}</span>
            </div>
          </div>
        </header>

        <main className="p-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {section === 'overview' && stats && (
                <>
                  {/* Architectural Navy & Gold Hero Banner */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#C89B3C]/35 bg-[#0B1D3A] text-white shadow-lg">
                    <img
                      src={HERO_IMG}
                      alt="GM University Campus"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover opacity-25"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#061224]/95 via-[#0B1D3A]/85 to-[#0B1D3A]/55" />
                    <div className="relative z-10 p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="max-w-xl">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#E5B954] font-semibold">
                          GM University · UE25CS2303 Command Center
                        </div>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold mt-1 text-white">
                          Welcome, {user.fullName}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                          Real-time academic telemetry across departments, student onboarding approvals, and concurrency-locked campus resource bookings.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => setSection('approvals')}
                          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#E5B954] px-4 py-2.5 text-xs font-bold text-[#061021] shadow-md"
                        >
                          <UserCheck className="w-4 h-4" />
                          Review Approvals ({stats.pendingRequests})
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => setSection('bookings')}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 backdrop-blur-sm px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20"
                        >
                          <Cpu className="w-4 h-4 text-[#E5B954]" />
                          Concurrency Lab Queue
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* 10 Staggered Interactive KPI Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {[
                      { label: 'Total Students', val: stats.totalStudents, jump: 'students' as Section, accent: 'text-[#0B1D3A] dark:text-white' },
                      { label: 'Approved Students', val: stats.approvedStudents, jump: 'students' as Section, accent: 'text-emerald-700 dark:text-emerald-400' },
                      { label: 'Pending Requests', val: stats.pendingRequests, jump: 'approvals' as Section, accent: 'text-amber-700 dark:text-amber-400' },
                      { label: 'Faculty', val: stats.totalFaculty, jump: 'faculty' as Section, accent: 'text-[#0B1D3A] dark:text-white' },
                      { label: 'Courses', val: stats.totalCourses, jump: 'courses' as Section, accent: 'text-[#0B1D3A] dark:text-white' },
                      { label: 'Classrooms', val: stats.totalClassrooms, jump: 'classrooms' as Section, accent: 'text-[#0B1D3A] dark:text-white' },
                      { label: 'Laboratories', val: stats.totalLaboratories, jump: 'laboratories' as Section, accent: 'text-[#0B1D3A] dark:text-white' },
                      { label: 'Equipment Units', val: stats.totalEquipmentItems, jump: 'equipment' as Section, accent: 'text-[#0B1D3A] dark:text-white' },
                      { label: 'Upcoming Activities', val: stats.upcomingActivities, jump: 'activities' as Section, accent: 'text-[#0B1D3A] dark:text-white' },
                      { label: 'Active Bookings', val: stats.activeBookings, jump: 'bookings' as Section, accent: 'text-[#0B1D3A] dark:text-white' },
                    ].map((kpi, idx) => (
                      <motion.button
                        key={kpi.label}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => setSection(kpi.jump)}
                        className="campus-interactive-card text-left rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-4 group"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{kpi.label}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#C89B3C]" />
                        </div>
                        <div className={`mt-1.5 text-2xl font-bold tabular-nums ${kpi.accent}`}>
                          <CountUpNumber value={kpi.val} />
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Interactive Analytics Visualizations */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Interactive Department Bar Distribution */}
                    <div className="lg:col-span-7 campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold">Department Student Distribution</h2>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {hoveredDept ? `Inspecting: ${hoveredDept}` : 'Hover bars to inspect'}
                        </span>
                      </div>
                      <div className="space-y-3.5">
                        {Object.entries(stats.studentsByDepartment || {}).map(([dept, count]: any, i) => {
                          const pct = Math.round((count / Math.max(1, stats.totalStudents)) * 100);
                          const active = hoveredDept === dept;
                          return (
                            <div
                              key={dept}
                              onMouseEnter={() => setHoveredDept(dept)}
                              onMouseLeave={() => setHoveredDept(null)}
                              className={`rounded-lg p-2 -mx-2 transition-colors ${active ? 'bg-amber-50/70 dark:bg-[#152440]' : ''}`}
                            >
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-semibold">{dept} Department</span>
                                <span className="tabular-nums text-slate-600 dark:text-slate-300 font-medium">
                                  {count} students ({pct}%)
                                </span>
                              </div>
                              <div className="h-2.5 rounded-full bg-slate-100 dark:bg-[#152440] overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.65, delay: i * 0.08, ease: 'easeOut' }}
                                  className="h-full rounded-full bg-gradient-to-r from-[#0B1D3A] to-[#C89B3C] dark:from-[#C89B3C] dark:to-[#FDE68A]"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Booking Status SVG Donut Ring */}
                    <div className="lg:col-span-5 campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-bold">Resource Bookings by Status</h2>
                        <button type="button" onClick={() => setSection('bookings')} className="text-xs font-semibold text-[#C89B3C] hover:underline">
                          Open Queue
                        </button>
                      </div>
                      <div className="flex items-center gap-5 my-auto py-2">
                        <div className="relative w-36 h-36 flex-shrink-0">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-slate-100 dark:text-[#152440]" strokeWidth="14" />
                            {donutSegments.map((seg) => (
                              <motion.circle
                                key={seg.status}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={hoveredStatus === seg.status ? '17' : '14'}
                                strokeDasharray={seg.dashArray}
                                strokeDashoffset={seg.dashOffset}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="cursor-pointer transition-all"
                                onMouseEnter={() => setHoveredStatus(seg.status)}
                                onMouseLeave={() => setHoveredStatus(null)}
                              />
                            ))}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                            <div className="text-xl font-bold tabular-nums">
                              {hoveredStatus ? (stats.bookingsByStatus?.[hoveredStatus] ?? 0) : totalBookingsCount}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {hoveredStatus || 'TOTAL'}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 space-y-2 text-xs">
                          {donutSegments.map(seg => (
                            <div
                              key={seg.status}
                              onMouseEnter={() => setHoveredStatus(seg.status)}
                              onMouseLeave={() => setHoveredStatus(null)}
                              className={`flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                                hoveredStatus === seg.status ? 'bg-slate-100 dark:bg-[#152440]' : ''
                              }`}
                            >
                              <span className="flex items-center gap-2 font-medium">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                                {seg.status}
                              </span>
                              <span className="tabular-nums text-slate-500 dark:text-slate-400">{seg.count} ({seg.pct}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions & Session Approvals */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold">Quick Module Launchpad</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button type="button" onClick={() => setSection('approvals')} className="rounded-lg bg-[#0B1D3A] dark:bg-[#C89B3C] px-3.5 py-2.5 text-xs font-semibold text-white dark:text-[#061021] hover:opacity-95 transition-opacity">
                          Pending Approvals ({stats.pendingRequests})
                        </button>
                        <button type="button" onClick={() => setSection('activities')} className="rounded-lg border border-slate-200 dark:border-[#1E3254] px-3.5 py-2.5 text-xs font-semibold hover:border-[#C89B3C] transition-colors">
                          Publish Campus Event
                        </button>
                        <button type="button" onClick={() => setSection('bookings')} className="rounded-lg border border-slate-200 dark:border-[#1E3254] px-3.5 py-2.5 text-xs font-semibold hover:border-[#C89B3C] transition-colors">
                          Concurrency Race Simulator
                        </button>
                        <button type="button" onClick={() => setSection('reports')} className="rounded-lg border border-slate-200 dark:border-[#1E3254] px-3.5 py-2.5 text-xs font-semibold hover:border-[#C89B3C] transition-colors">
                          CSV Reports Center
                        </button>
                      </div>
                    </div>

                    <div className="campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold">Recent Approval Decisions</h2>
                        <button type="button" onClick={() => setSection('approvals')} className="text-xs font-semibold text-[#C89B3C] hover:underline">
                          View Queue
                        </button>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
                        {(stats.approvalHistory || []).slice(0, 4).map((h: any) => (
                          <div key={h.id} className="flex justify-between items-center border-t border-slate-100 dark:border-[#1E3254] pt-2">
                            <span>{h.targetType} #{h.targetId} · <strong className={h.action === 'APPROVED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{h.action}</strong></span>
                            <span className="tabular-nums text-slate-400">{h.decisionDate.slice(0, 10)}</span>
                          </div>
                        ))}
                        {(!stats.approvalHistory || stats.approvalHistory.length === 0) && (
                          <p className="text-slate-500 dark:text-slate-400 py-2">No approval decisions recorded in this session yet. Try approving Pending student Meera Nair!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Interactive Concurrency Simulator Banner on Bookings Tab */}
              {section === 'bookings' && (
                <div className="rounded-2xl border border-[#C89B3C]/40 bg-gradient-to-br from-[#0B1D3A] to-[#132A4F] text-white p-5 shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#E5B954] font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Live Multithreading &amp; ReentrantLock Visualizer
                      </div>
                      <h2 className="text-base font-bold mt-0.5">Test Simultaneous Booking Overlap Protection</h2>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                        Fires 5 concurrent booking threads at the exact same slot on <strong>OOPS &amp; Enterprise Java Lab</strong>. Exactly 1 thread acquires the critical-section lock; the other 4 fail cleanly with <code>409 Conflict</code>.
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      disabled={simLoading}
                      onClick={handleRunRaceSimulation}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#E5B954] px-4 py-2.5 text-xs font-bold text-[#061021] shadow"
                    >
                      <Cpu className="w-4 h-4" />
                      {simLoading ? 'Dispatching 5 Threads...' : 'Run 5-Thread Race Test'}
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {simResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/15 space-y-2"
                      >
                        <div className="text-xs text-amber-200 font-medium mb-2">
                          Target: {simResult.resourceName} · {simResult.bookingDate} ({simResult.startTime}–{simResult.endTime}) · Result: <strong>{simResult.bookedCount} Booked, {simResult.conflictCount} Blocked</strong>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                          {simResult.traces.map((t: any, i: number) => (
                            <motion.div
                              key={t.thread}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.08 }}
                              className={`rounded-xl p-2.5 border text-[11px] ${
                                t.outcome === 'BOOKED'
                                  ? 'border-emerald-400/60 bg-emerald-950/60 text-emerald-100'
                                  : 'border-red-400/40 bg-red-950/40 text-red-200'
                              }`}
                            >
                              <div className="flex items-center justify-between font-bold tabular-nums">
                                <span>{t.thread}</span>
                                <span>{t.durationMs}ms</span>
                              </div>
                              <div className="mt-1 font-semibold">
                                {t.outcome === 'BOOKED' ? `WON (${t.bookingCode})` : 'BLOCKED (409)'}
                              </div>
                              <div className="mt-0.5 text-[10px] opacity-85 line-clamp-2">{t.detail}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* CRUD & Approval Table Views */}
              {['students', 'approvals', 'faculty', 'courses', 'classrooms', 'laboratories', 'equipment', 'activities', 'bookings'].includes(section) && (
                <div className="rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter records..."
                        className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#1E3254] bg-slate-50 dark:bg-[#070E1B] focus:outline-none focus:border-[#C89B3C]"
                      />
                    </div>
                    {['faculty', 'courses', 'classrooms', 'laboratories', 'equipment', 'activities'].includes(section) && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => setShowAdd(s => !s)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B1D3A] dark:bg-[#C89B3C] px-3.5 py-2 text-xs font-semibold text-white dark:text-[#061021]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {showAdd ? 'Close Form' : 'Add New'}
                      </motion.button>
                    )}
                  </div>

                  <AnimatePresence>
                    {showAdd && (
                      <motion.form
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        onSubmit={handleCreateSubmit}
                        className="mb-5 p-4 rounded-xl border border-[#C89B3C]/40 bg-slate-50 dark:bg-[#070E1B] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs"
                      >
                        {section === 'faculty' && <>
                          <input name="facultyId" placeholder="Faculty ID (GMU-FAC-006)" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="name" placeholder="Full Name" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="designation" placeholder="Designation" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="email" type="email" placeholder="Email" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="phone" placeholder="Phone" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="specialization" placeholder="Specialization" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input type="hidden" name="departmentId" value="1" />
                        </>}
                        {section === 'courses' && <>
                          <input name="courseCode" placeholder="Course Code (UE25CS2305)" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="courseName" placeholder="Course Name" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="credits" type="number" defaultValue={4} required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input type="hidden" name="departmentId" value="1" />
                          <input type="hidden" name="semester" value="3" />
                        </>}
                        {section === 'classrooms' && <>
                          <input name="roomId" placeholder="Room ID (CR-TB-305)" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="building" placeholder="Building" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="roomNumber" placeholder="Room #" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="capacity" type="number" defaultValue={60} required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="equipmentSummary" placeholder="AV / Projector details" required className="sm:col-span-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input type="hidden" name="availabilityStatus" value="AVAILABLE" />
                        </>}
                        {section === 'laboratories' && <>
                          <input name="labId" placeholder="Lab ID (LAB-CYB-04)" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="name" placeholder="Lab Name" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="location" placeholder="Location" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="labType" placeholder="Type" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="capacity" type="number" defaultValue={36} required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input type="hidden" name="availabilityStatus" value="AVAILABLE" />
                        </>}
                        {section === 'equipment' && <>
                          <input name="equipmentId" placeholder="Equip ID" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="name" placeholder="Equipment Name" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="category" placeholder="Category" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="quantity" type="number" defaultValue={5} required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="availableQuantity" type="number" defaultValue={5} required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="location" placeholder="Location" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input type="hidden" name="itemCondition" value="GOOD" />
                        </>}
                        {section === 'activities' && <>
                          <input name="title" placeholder="Event Title" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="category" placeholder="Category" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="eventDate" type="date" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="location" placeholder="Venue" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="capacity" type="number" defaultValue={100} required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input name="description" placeholder="Short description" required className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0E1A2F] px-2.5 py-2" />
                          <input type="hidden" name="status" value="PUBLISHED" />
                        </>}
                        <div className="sm:col-span-3 flex justify-end gap-2">
                          <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700">Cancel</button>
                          <button type="submit" className="px-4 py-1.5 rounded bg-[#C89B3C] font-semibold text-[#061021]">Save Record</button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 dark:border-[#1E3254] text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="py-2.5 pr-4">Identifier</th>
                          <th className="py-2.5 pr-4">Details</th>
                          <th className="py-2.5 pr-4">Metadata</th>
                          <th className="py-2.5 pr-4">Status</th>
                          <th className="py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#1E3254]">
                        {filteredRows.map((r: any, idx: number) => (
                          <motion.tr
                            key={r.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.025 }}
                            className="hover:bg-amber-50/50 dark:hover:bg-[#152440]/60 transition-colors"
                          >
                            <td className="py-2.5 pr-4 font-semibold tabular-nums">
                              {r.studentId || r.facultyId || r.courseCode || r.roomId || r.labId || r.equipmentId || r.bookingCode || `EVT-${r.id}`}
                            </td>
                            <td className="py-2.5 pr-4">
                              <div className="font-semibold">{r.name || r.courseName || r.title || r.resourceName || r.building}</div>
                              <div className="text-slate-500 dark:text-slate-400">
                                {r.branch || r.designation || r.assignedFacultyName || r.location || r.purpose || r.equipmentSummary || ''}
                              </div>
                            </td>
                            <td className="py-2.5 pr-4 tabular-nums text-slate-500 dark:text-slate-400">
                              {r.semester ? `Sem ${r.semester}` : r.bookingDate ? `${r.bookingDate} ${r.startTime}-${r.endTime}` : r.capacity ? `Cap ${r.capacity}` : r.category || r.email || ''}
                            </td>
                            <td className="py-2.5 pr-4 font-semibold">
                              <span className={
                                ['APPROVED', 'AVAILABLE', 'PUBLISHED', 'EXCELLENT'].includes(r.accountStatus || r.availabilityStatus || r.status || r.itemCondition)
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : ['PENDING', 'GOOD'].includes(r.accountStatus || r.availabilityStatus || r.status || r.itemCondition)
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-red-700 dark:text-red-400'
                              }>
                                {r.accountStatus || r.availabilityStatus || r.status || r.itemCondition || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setInspectRow(r)}
                                className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-slate-600 dark:text-slate-300 hover:border-[#C89B3C]"
                                title="Inspect details"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              {section === 'approvals' && (
                                <>
                                  <button type="button" onClick={() => handleApproveStudent(r.id)} className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-white hover:bg-emerald-600"><Check className="w-3 h-3" />Approve</button>
                                  <button type="button" onClick={() => handleRejectStudent(r.id)} className="inline-flex items-center gap-1 rounded bg-red-700 px-2.5 py-1 text-white hover:bg-red-600"><X className="w-3 h-3" />Reject</button>
                                </>
                              )}
                              {section === 'bookings' && r.status === 'PENDING' && (
                                <>
                                  <button type="button" onClick={() => handleBookingDecision(r.id, true)} className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-white hover:bg-emerald-600">Approve</button>
                                  <button type="button" onClick={() => handleBookingDecision(r.id, false)} className="inline-flex items-center gap-1 rounded bg-red-700 px-2.5 py-1 text-white hover:bg-red-600">Reject</button>
                                </>
                              )}
                              {['students', 'faculty', 'courses', 'classrooms', 'laboratories', 'equipment', 'activities'].includes(section) && (
                                <button type="button" onClick={() => handleDelete(section === 'activities' ? 'events' : section, r.id)} className="inline-flex items-center gap-1 rounded border border-red-300 dark:border-red-800 px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                        {filteredRows.length === 0 && (
                          <tr><td colSpan={5} className="py-8 text-center text-slate-400">No records match the current filter.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {section === 'reports' && (
                <div className="rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-6 shadow-sm">
                  <h2 className="text-base font-bold mb-1">CSV Analytics &amp; Spring Boot Export Center</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                    Export live campus tables as CSV or download the complete Java 21 Spring Boot + MySQL 8 Maven ZIP package.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {['students', 'faculty', 'courses', 'bookings', 'events', 'equipment'].map((mod, idx) => (
                      <motion.button
                        key={mod}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={async () => downloadCsv(`gmu_${mod}.csv`, await api(`/api/admin/${mod}`))}
                        className="campus-interactive-card flex items-center justify-between rounded-xl border border-slate-200 dark:border-[#1E3254] bg-white dark:bg-[#070E1B]/50 p-4 text-xs font-semibold"
                      >
                        <span className="capitalize">{mod} CSV Report</span>
                        <Download className="w-4 h-4 text-[#C89B3C]" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {section === 'settings' && (
                <div className="rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-6 max-w-xl space-y-4 shadow-sm">
                  <h2 className="text-base font-bold">Portal Settings &amp; Deliverable Package</h2>
                  <div className="flex items-center justify-between text-xs">
                    <span>Theme Appearance</span>
                    <button type="button" onClick={onToggleDarkMode} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-semibold hover:border-[#C89B3C]">
                      Switch to {darkMode ? 'Light' : 'Dark'} Mode
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-[#1E3254]">
                    <span>Complete Java 21 Spring Boot + MySQL 8 Project</span>
                    <a href="/api/download-spring-zip" className="rounded-lg bg-[#C89B3C] px-3.5 py-1.5 font-bold text-[#061021] hover:bg-[#E5B954]">
                      Download ZIP
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Record Inspector Modal */}
      <AnimatePresence>
        {inspectRow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
            onClick={() => setInspectRow(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-[#C89B3C]/40 bg-white dark:bg-[#0E1A2F] p-5 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1E3254] pb-3 mb-3">
                <h3 className="text-sm font-bold">Record Details</h3>
                <button type="button" onClick={() => setInspectRow(null)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-[#152440]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(inspectRow)
                  .filter(([k]) => k !== 'passwordHash' && k !== 'userId')
                  .map(([k, v]) => (
                    <div key={k} className="col-span-1">
                      <div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div>
                      <div className="font-semibold break-words mt-0.5">{String(v ?? '—')}</div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="fixed bottom-5 right-5 z-50 rounded-xl border border-[#C89B3C]/50 bg-[#0B1D3A] px-4 py-3 text-xs font-medium text-white shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
