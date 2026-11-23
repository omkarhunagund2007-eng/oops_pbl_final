import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, User, BookOpen, GraduationCap, Calendar, CalendarCheck,
  Clock, Megaphone, Settings, LogOut, Sun, Moon, Download, Menu, ArrowRight, CheckCircle2, AlertCircle,
  MessageSquareWarning, Camera, Heart, Send, Plus, X, ShieldAlert
} from 'lucide-react';

interface Props {
  token: string;
  user: { fullName: string; username: string };
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

type StudentSection = 'dashboard' | 'profile' | 'courses' | 'faculty' | 'events' | 'book' | 'bookings' | 'complaints' | 'captures' | 'announcements' | 'settings';

const CREST_IMG = '/src/assets/images/gmu_crest_emblem_1795328704978.jpg';
const EVENT_IMG = '/src/assets/images/campus_auditorium_event_1795328704354.jpg';
const HERO_IMG = '/src/assets/images/campus_arrival_backdrop_1795328704340.jpg';

function CountUpNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 500;
    const target = Number(value) || 0;
    function tick(now: number) {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}</>;
}

export default function StudentDashboard({ token, darkMode, onToggleDarkMode, onLogout }: Props) {
  const [section, setSection] = useState<StudentSection>('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [data, setData] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Live resource booking form & conflict checker state
  const [resType, setResType] = useState<'CLASSROOM' | 'LABORATORY' | 'EQUIPMENT'>('CLASSROOM');
  const [resId, setResId] = useState<number>(1);
  const [bookDate, setBookDate] = useState<string>('2026-11-24');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [slotCheck, setSlotCheck] = useState<{ available: boolean; reason: string } | null>(null);

  // Complaint box state
  const [cmpCategory, setCmpCategory] = useState<'GENERAL' | 'ACADEMICS' | 'MAINTENANCE' | 'HOSTEL_MESS' | 'IT_NETWORK' | 'DISCIPLINE_ANTI_RAGGING'>('GENERAL');
  const [cmpPriority, setCmpPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [cmpSubject, setCmpSubject] = useState('');
  const [cmpDesc, setCmpDesc] = useState('');
  const [cmpAnonymous, setCmpAnonymous] = useState(false);
  const [cmpSubmitting, setCmpSubmitting] = useState(false);

  // Campus capturings state
  const [captureFilter, setCaptureFilter] = useState<'ALL' | 'ARCHITECTURE' | 'LABS_TECH' | 'EVENTS' | 'CAMPUS_LIFE'>('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<any | null>(null);
  const [capTitle, setCapTitle] = useState('');
  const [capCategory, setCapCategory] = useState<'ARCHITECTURE' | 'LABS_TECH' | 'EVENTS' | 'CAMPUS_LIFE'>('CAMPUS_LIFE');
  const [capLocation, setCapLocation] = useState('');
  const [capImg, setCapImg] = useState('/src/assets/images/campus_arrival_backdrop_1795328704340.jpg');
  const [capDesc, setCapDesc] = useState('');
  const [capSubmitting, setCapSubmitting] = useState(false);

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
    if (!res.ok || !json.success) throw new Error(json.message || 'Action failed');
    return json.data;
  }

  async function loadOverview() {
    try {
      const d = await api('/api/student/overview');
      setData(d);
    } catch (e: any) {
      notify(e.message);
    }
  }

  useEffect(() => { loadOverview(); }, []);

  // Live slot availability feedback whenever booking fields change
  useEffect(() => {
    if (section !== 'book') return;
    let active = true;
    api(`/api/student/bookings/availability?resourceType=${resType}&resourceId=${resId}&date=${bookDate}&startTime=${startTime}&endTime=${endTime}`)
      .then((res) => { if (active) setSlotCheck(res); })
      .catch(() => {});
    return () => { active = false; };
  }, [section, resType, resId, bookDate, startTime, endTime]);

  const navItems: Array<{ id: StudentSection; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'faculty', label: 'Faculty Directory', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'events', label: 'Campus Events', icon: <Calendar className="w-4 h-4" /> },
    { id: 'book', label: 'Resource Booking', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'bookings', label: 'My Bookings', icon: <Clock className="w-4 h-4" /> },
    { id: 'complaints', label: 'Complaint Box', icon: <MessageSquareWarning className="w-4 h-4" /> },
    { id: 'captures', label: 'Campus Capturings', icon: <Camera className="w-4 h-4" /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  async function handleBookingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw: any = Object.fromEntries(new FormData(e.currentTarget).entries());
    raw.resourceId = Number(raw.resourceId);
    try {
      await api('/api/student/bookings', 'POST', raw);
      notify('Booking request submitted successfully.');
      e.currentTarget.reset();
      await loadOverview();
      setSection('bookings');
    } catch (err: any) {
      notify(err.message);
    }
  }

  async function handleComplaintSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cmpSubject.trim() || !cmpDesc.trim()) {
      notify('Subject and detailed description are required.');
      return;
    }
    setCmpSubmitting(true);
    try {
      await api('/api/student/complaints', 'POST', {
        category: cmpCategory,
        priority: cmpPriority,
        subject: cmpSubject.trim(),
        description: cmpDesc.trim(),
        isAnonymous: cmpAnonymous,
      });
      notify('Grievance / Complaint submitted successfully.');
      setCmpSubject('');
      setCmpDesc('');
      setCmpAnonymous(false);
      await loadOverview();
    } catch (err: any) {
      notify(err.message);
    } finally {
      setCmpSubmitting(false);
    }
  }

  async function handleCaptureSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!capTitle.trim() || !capLocation.trim()) {
      notify('Photo title and location are required.');
      return;
    }
    setCapSubmitting(true);
    try {
      await api('/api/student/captures', 'POST', {
        title: capTitle.trim(),
        category: capCategory,
        location: capLocation.trim(),
        imageUrl: capImg.trim(),
        description: capDesc.trim(),
      });
      notify('Campus moment shared to Capturings!');
      setCapTitle('');
      setCapLocation('');
      setCapDesc('');
      setShowUploadModal(false);
      await loadOverview();
    } catch (err: any) {
      notify(err.message);
    } finally {
      setCapSubmitting(false);
    }
  }

  async function handleLikeCapture(captureId: number) {
    try {
      await api(`/api/student/captures/${captureId}/like`, 'POST', {});
      setData((prev: any) => {
        if (!prev || !prev.captures) return prev;
        return {
          ...prev,
          captures: prev.captures.map((c: any) => c.id === captureId ? { ...c, likes: c.likes + 1 } : c)
        };
      });
      notify('Liked campus moment!');
    } catch (err: any) {
      notify(err.message);
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center campus-canvas-light text-sm font-medium text-slate-700 dark:text-slate-200">
        Loading GM University Student Portal...
      </div>
    );
  }

  const enrolledIds = new Set((data.enrolledCourses || []).map((c: any) => c.id));
  const registeredEventIds = new Set((data.registrations || []).filter((r: any) => r.status === 'REGISTERED').map((r: any) => r.eventId));

  const resourceChoices =
    resType === 'CLASSROOM' ? data.resources.classrooms
    : resType === 'LABORATORY' ? data.resources.laboratories
    : data.resources.equipment;

  return (
    <div className="flex min-h-screen campus-canvas-light text-slate-900 dark:text-slate-100 transition-colors">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-[#0B1D3A] text-slate-200 border-r border-[#C89B3C]/25 transition-transform lg:static lg:translate-x-0 ${
        mobileMenu ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <img src={CREST_IMG} alt="GMU" referrerPolicy="no-referrer" className="h-10 w-10 rounded-lg border border-[#E5B954]/50 object-cover" />
          <div>
            <div className="text-sm font-bold text-white">GM UNIVERSITY</div>
            <div className="text-[11px] text-[#E5B954]">Student Portal</div>
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
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                section === item.id
                  ? 'bg-gradient-to-r from-[#C89B3C]/30 to-[#C89B3C]/10 text-[#FDE68A] ring-1 ring-[#E5B954]/50 shadow-sm'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}{item.label}
            </motion.button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button type="button" onClick={onLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-300 hover:bg-red-500/15">
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-[#0E1A2F]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1E3254] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setMobileMenu(m => !m)} className="lg:hidden p-1.5 rounded-lg border border-slate-300 dark:border-slate-700"><Menu className="w-4 h-4" /></button>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">GM University / Student</div>
              <h1 className="text-sm font-bold">{navItems.find(n => n.id === section)?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/api/download-spring-zip" className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-[#C89B3C]/50 bg-[#0B1D3A] px-3 py-1.5 text-xs font-semibold text-[#FDE68A] hover:bg-[#142B52]">
              <Download className="w-3.5 h-3.5" />Java Spring ZIP
            </a>
            <button type="button" onClick={onToggleDarkMode} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#1E3254] bg-white dark:bg-[#0B1D3A] px-3 py-1.5 text-xs font-medium hover:border-[#C89B3C]">
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#0B1D3A]" />}
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <span className="text-xs font-semibold hidden md:inline">{data.student.name} · {data.student.studentId}</span>
          </div>
        </header>

        <main className="p-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {section === 'dashboard' && (
                <>
                  {/* Navy/Gold Student Hero Banner */}
                  <div className="relative overflow-hidden rounded-2xl border border-[#C89B3C]/35 bg-[#0B1D3A] text-white shadow-lg">
                    <img
                      src={HERO_IMG}
                      alt="GM University Campus"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover opacity-25"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#061224]/95 via-[#0B1D3A]/85 to-[#0B1D3A]/55" />
                    <div className="relative z-10 p-6 sm:p-7 flex flex-wrap justify-between items-center gap-5">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.2em] text-[#E5B954] font-semibold">
                          GM University · Approved Student Scholar
                        </div>
                        <h2 className="font-display text-3xl sm:text-4xl font-bold mt-1">Welcome back, {data.student.name}</h2>
                        <p className="text-xs text-slate-300 mt-1.5">
                          <span className="tabular-nums font-semibold text-amber-200">{data.student.studentId}</span> · {data.student.departmentName} · Semester {data.student.semester} · Section {data.student.section}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => setSection('book')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#E5B954] px-4 py-2.5 text-xs font-bold text-[#061021] shadow-md"
                      >
                        <CalendarCheck className="w-4 h-4" />
                        Request Resource Booking
                      </motion.button>
                    </div>
                  </div>

                  {/* Animated KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'Enrolled Courses', value: data.enrolledCourses.length, jump: 'courses' as StudentSection },
                      { label: 'Registered Events', value: registeredEventIds.size, jump: 'events' as StudentSection },
                      { label: 'My Resource Bookings', value: data.bookings.length, jump: 'bookings' as StudentSection },
                    ].map((kpi, idx) => (
                      <motion.button
                        key={kpi.label}
                        type="button"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        onClick={() => setSection(kpi.jump)}
                        className="campus-interactive-card text-left rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5 group"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{kpi.label}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#C89B3C]" />
                        </div>
                        <div className="text-3xl font-bold tabular-nums mt-1.5 text-[#0B1D3A] dark:text-[#FDE68A]">
                          <CountUpNumber value={kpi.value} />
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold">Latest Announcements</h3>
                        <button type="button" onClick={() => setSection('announcements')} className="text-xs font-semibold text-[#C89B3C] hover:underline">All Notices</button>
                      </div>
                      <div className="space-y-3 text-xs">
                        {data.announcements.map((a: any) => (
                          <div key={a.id} className="border-b border-slate-100 dark:border-[#1E3254] pb-2.5">
                            <div className="font-semibold flex justify-between gap-2">
                              <span>{a.title}</span>
                              <span className="text-[11px] text-[#C89B3C]">{a.priority}</span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 mt-0.5">{a.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5 overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold">Featured Campus Event</h3>
                        <button type="button" onClick={() => setSection('events')} className="text-xs font-semibold text-[#C89B3C] hover:underline">Explore All</button>
                      </div>
                      <div className="overflow-hidden rounded-lg mb-3">
                        <img src={EVENT_IMG} alt="GM University Auditorium" referrerPolicy="no-referrer" className="h-36 w-full object-cover hover:scale-105 transition-transform duration-500" />
                      </div>
                      {data.events[0] && (
                        <div className="text-xs">
                          <div className="font-bold text-sm">{data.events[0].title}</div>
                          <div className="text-slate-500 dark:text-slate-400 mt-0.5">{data.events[0].eventDate} · {data.events[0].location}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {section === 'profile' && (
                <div className="campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-6 max-w-2xl">
                  <h2 className="text-base font-bold mb-4">Verified Student Profile</h2>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div><span className="text-slate-500 block">Full Name</span><span className="font-semibold">{data.student.name}</span></div>
                    <div><span className="text-slate-500 block">Student ID</span><span className="font-semibold tabular-nums">{data.student.studentId}</span></div>
                    <div><span className="text-slate-500 block">Department</span><span className="font-semibold">{data.student.departmentName}</span></div>
                    <div><span className="text-slate-500 block">Branch</span><span className="font-semibold">{data.student.branch}</span></div>
                    <div><span className="text-slate-500 block">Semester / Section</span><span className="font-semibold">Sem {data.student.semester} · Sec {data.student.section}</span></div>
                    <div><span className="text-slate-500 block">Status</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{data.student.accountStatus}</span></div>
                  </div>
                </div>
              )}

              {section === 'courses' && (
                <div className="rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5 shadow-sm">
                  <h2 className="text-sm font-bold mb-4">University Courses &amp; My Enrollment</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.allCourses.map((c: any, idx: number) => {
                      const isEnrolled = enrolledIds.has(c.id);
                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          className="campus-interactive-card rounded-xl border border-slate-200 dark:border-[#1E3254] bg-slate-50/70 dark:bg-[#070E1B]/50 p-4 flex flex-col justify-between text-xs"
                        >
                          <div>
                            <div className="flex justify-between items-center text-[11px] text-[#C89B3C] font-semibold">
                              <span className="tabular-nums">{c.courseCode}</span>
                              <span>{c.departmentCode} · {c.credits} Credits</span>
                            </div>
                            <div className="font-bold text-sm mt-1">{c.courseName}</div>
                            <div className="text-slate-500 dark:text-slate-400 mt-1">Instructor: {c.assignedFacultyName}</div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-[#1E3254] flex items-center justify-between">
                            <span className={isEnrolled ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}>
                              {isEnrolled ? 'Enrolled this semester' : 'Open for registration'}
                            </span>
                            {isEnrolled ? (
                              <button type="button" onClick={async () => { await api(`/api/student/courses/${c.id}/enroll`, 'DELETE'); notify('Course dropped.'); loadOverview(); }} className="rounded-lg border border-red-400 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold">Drop</button>
                            ) : (
                              <button type="button" onClick={async () => { await api(`/api/student/courses/${c.id}/enroll`, 'POST', {}); notify('Enrolled in course.'); loadOverview(); }} className="rounded-lg bg-[#0B1D3A] dark:bg-[#C89B3C] px-3 py-1.5 text-white dark:text-[#061021] font-semibold">Enroll</button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {section === 'faculty' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.faculty.map((f: any, idx: number) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5 text-xs"
                    >
                      <div className="font-bold text-sm">{f.name}</div>
                      <div className="text-[#C89B3C] font-semibold mt-0.5">{f.designation} · {f.departmentCode}</div>
                      <div className="mt-2 text-slate-600 dark:text-slate-300">{f.specialization}</div>
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#1E3254] text-slate-500 dark:text-slate-400">{f.email} · {f.phone}</div>
                    </motion.div>
                  ))}
                </div>
              )}

              {section === 'events' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {data.events.map((ev: any, idx: number) => {
                    const fillPct = Math.min(100, Math.round((ev.registeredCount / Math.max(1, ev.capacity)) * 100));
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="campus-interactive-card overflow-hidden rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 flex flex-col justify-between text-xs"
                      >
                        <div>
                          <div className="h-32 overflow-hidden relative">
                            <img src={EVENT_IMG} alt={ev.title} referrerPolicy="no-referrer" className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1D3A]/85 via-transparent to-transparent" />
                            <div className="absolute bottom-2.5 left-4 right-4 text-[11px] font-semibold text-amber-200">
                              {ev.category} · {ev.eventDate} · {ev.location}
                            </div>
                          </div>
                          <div className="p-5 pb-3">
                            <div className="font-bold text-sm">{ev.title}</div>
                            <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">{ev.description}</p>
                          </div>
                        </div>
                        <div className="px-5 pb-5 pt-2">
                          <div className="flex justify-between text-[11px] mb-1.5 text-slate-500 dark:text-slate-400">
                            <span>Seat Capacity</span>
                            <span className="tabular-nums font-semibold">{ev.registeredCount} / {ev.capacity} registered</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-[#152440] overflow-hidden mb-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(4, fillPct)}%` }}
                              transition={{ duration: 0.6 }}
                              className="h-full rounded-full bg-[#C89B3C]"
                            />
                          </div>
                          <div className="flex justify-end">
                            {registeredEventIds.has(ev.id) ? (
                              <button type="button" onClick={async () => { await api(`/api/student/events/${ev.id}/cancel`, 'POST', {}); notify('Event registration cancelled.'); loadOverview(); }} className="rounded-lg border border-red-400 px-3.5 py-1.5 text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-950/30">Cancel Registration</button>
                            ) : (
                              <button type="button" onClick={async () => { await api(`/api/student/events/${ev.id}/register`, 'POST', {}); notify('Registered for event.'); loadOverview(); }} className="rounded-lg bg-[#0B1D3A] dark:bg-[#C89B3C] px-4 py-1.5 text-white dark:text-[#061021] font-semibold">Register Now</button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {section === 'book' && (
                <div className="campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-6 max-w-2xl">
                  <h2 className="text-base font-bold mb-1">Request Resource Booking</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Real-time conflict checking verifies slot availability as you adjust date and time.</p>
                  <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Resource Type</label>
                      <select
                        name="resourceType"
                        value={resType}
                        onChange={(e) => {
                          const next = e.target.value as any;
                          setResType(next);
                          setResId(1);
                        }}
                        className="w-full rounded-lg border border-slate-300 dark:border-[#1E3254] bg-white dark:bg-[#070E1B] px-3 py-2"
                      >
                        <option value="CLASSROOM">Classroom</option>
                        <option value="LABORATORY">Laboratory</option>
                        <option value="EQUIPMENT">Equipment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Select Resource</label>
                      <select
                        name="resourceId"
                        value={resId}
                        onChange={(e) => setResId(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 dark:border-[#1E3254] bg-white dark:bg-[#070E1B] px-3 py-2"
                      >
                        {resourceChoices.map((r: any) => <option key={r.id} value={r.id}>{r.roomId || r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Date</label>
                      <input name="bookingDate" type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-[#1E3254] bg-white dark:bg-[#070E1B] px-3 py-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block font-semibold mb-1">Start</label><input name="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-[#1E3254] bg-white dark:bg-[#070E1B] px-3 py-2" /></div>
                      <div><label className="block font-semibold mb-1">End</label><input name="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full rounded-lg border border-slate-300 dark:border-[#1E3254] bg-white dark:bg-[#070E1B] px-3 py-2" /></div>
                    </div>

                    {slotCheck && (
                      <motion.div
                        key={String(slotCheck.available) + slotCheck.reason}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`sm:col-span-2 flex items-center gap-2 rounded-lg border px-3 py-2 font-medium ${
                          slotCheck.available
                            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                            : 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {slotCheck.available ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        <span>{slotCheck.reason}</span>
                      </motion.div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1">Purpose</label>
                      <input name="purpose" required placeholder="e.g. OOPS PBL Team Practice" className="w-full rounded-lg border border-slate-300 dark:border-[#1E3254] bg-white dark:bg-[#070E1B] px-3 py-2" />
                    </div>
                    <div className="sm:col-span-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="rounded-lg bg-[#0B1D3A] dark:bg-[#C89B3C] px-5 py-2 text-xs font-semibold text-white dark:text-[#061021]"
                      >
                        Submit Booking Request
                      </motion.button>
                    </div>
                  </form>
                </div>
              )}

              {section === 'bookings' && (
                <div className="rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5 shadow-sm">
                  <h2 className="text-sm font-bold mb-4">My Resource Bookings</h2>
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 dark:border-[#1E3254] text-slate-500">
                      <tr><th className="py-2">Code</th><th className="py-2">Resource</th><th className="py-2">Date &amp; Slot</th><th className="py-2">Status</th><th className="py-2 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#1E3254]">
                      {data.bookings.map((b: any) => (
                        <tr key={b.id} className="hover:bg-amber-50/40 dark:hover:bg-[#152440]/50">
                          <td className="py-2.5 font-semibold tabular-nums">{b.bookingCode}</td>
                          <td className="py-2.5">{b.resourceType} · {b.resourceName}</td>
                          <td className="py-2.5 tabular-nums">{b.bookingDate} ({b.startTime}-{b.endTime})</td>
                          <td className="py-2.5 font-semibold">
                            <span className={b.status === 'APPROVED' ? 'text-emerald-700 dark:text-emerald-400' : b.status === 'PENDING' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                              <button type="button" onClick={async () => { await api(`/api/student/bookings/${b.id}/cancel`, 'POST', {}); notify('Booking cancelled.'); loadOverview(); }} className="rounded border border-red-400 px-2.5 py-1 text-red-600">Cancel</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section === 'complaints' && (
                <div className="space-y-6">
                  {/* Top Banner */}
                  <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-[#0B1D3A] via-[#122A54] to-[#0B1D3A] p-5 text-white shadow-md">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E5B954]">
                          <ShieldAlert className="w-4 h-4" />
                          Student Grievance Redressal Cell
                        </div>
                        <h2 className="text-lg font-bold text-white mt-1">Campus Complaint &amp; Feedback Box</h2>
                        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                          Voice concerns directly to GM University administration regarding academics, maintenance, IT connectivity, hostel, or campus discipline. All grievances are tracked with transparent progress updates.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white/10 px-3 py-2 text-center border border-white/15">
                          <div className="text-lg font-bold text-[#FDE68A]">{(data.complaints || []).length}</div>
                          <div className="text-[10px] text-slate-300">My Complaints</div>
                        </div>
                        <div className="rounded-lg bg-white/10 px-3 py-2 text-center border border-white/15">
                          <div className="text-lg font-bold text-emerald-400">
                            {(data.complaints || []).filter((c: any) => c.status === 'RESOLVED').length}
                          </div>
                          <div className="text-[10px] text-slate-300">Resolved</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Submit Grievance Form */}
                    <div className="lg:col-span-5 rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1E3254] pb-3">
                        <MessageSquareWarning className="w-4 h-4 text-[#C89B3C]" />
                        <h3 className="text-sm font-bold">Register New Grievance</h3>
                      </div>

                      <form onSubmit={handleComplaintSubmit} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-semibold mb-1">Grievance Category</label>
                          <select
                            value={cmpCategory}
                            onChange={(e: any) => setCmpCategory(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071326] px-3 py-2"
                          >
                            <option value="GENERAL">General Campus Services</option>
                            <option value="ACADEMICS">Academics &amp; Curriculum</option>
                            <option value="MAINTENANCE">Classroom / Lab Maintenance</option>
                            <option value="IT_NETWORK">Wi-Fi &amp; IT Computing Facilities</option>
                            <option value="HOSTEL_MESS">Hostel, Transport &amp; Canteen</option>
                            <option value="DISCIPLINE_ANTI_RAGGING">Discipline &amp; Anti-Ragging</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Urgency / Priority Level</label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map(p => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setCmpPriority(p)}
                                className={`rounded-lg py-1.5 text-[11px] font-bold border transition-colors ${
                                  cmpPriority === p
                                    ? p === 'URGENT'
                                      ? 'bg-red-600 text-white border-red-700'
                                      : p === 'HIGH'
                                      ? 'bg-amber-600 text-white border-amber-700'
                                      : 'bg-[#0B1D3A] text-white dark:bg-[#C89B3C] dark:text-[#061021] border-transparent'
                                    : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                                }`}
                              >
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Grievance Subject</label>
                          <input
                            type="text"
                            placeholder="e.g. Broken display projector in CR-TB-302"
                            value={cmpSubject}
                            onChange={(e) => setCmpSubject(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071326] px-3 py-2"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Detailed Description</label>
                          <textarea
                            rows={4}
                            placeholder="Describe the issue, specific location, and what assistance is required..."
                            value={cmpDesc}
                            onChange={(e) => setCmpDesc(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071326] px-3 py-2 leading-relaxed"
                          />
                        </div>

                        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-[#1E3254] p-2.5 bg-slate-50 dark:bg-[#071326]">
                          <input
                            type="checkbox"
                            id="anonCheckbox"
                            checked={cmpAnonymous}
                            onChange={(e) => setCmpAnonymous(e.target.checked)}
                            className="rounded text-[#C89B3C] focus:ring-0"
                          />
                          <label htmlFor="anonCheckbox" className="text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                            <span className="font-semibold">Submit Anonymously</span>
                            <span className="block text-[10px] text-slate-500">Your student name and roll number will be concealed from public logs.</span>
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={cmpSubmitting}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#0B1D3A] dark:bg-[#C89B3C] px-4 py-2.5 font-bold text-white dark:text-[#061021] hover:opacity-95 transition-opacity disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {cmpSubmitting ? 'Filing Grievance...' : 'Submit to Administration'}
                        </button>
                      </form>
                    </div>

                    {/* Right: Grievance History & Status Tracker */}
                    <div className="lg:col-span-7 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold">Tracked Grievances &amp; Resolutions</h3>
                        <span className="text-xs text-slate-500">{(data.complaints || []).length} registered items</span>
                      </div>

                      {(!data.complaints || data.complaints.length === 0) ? (
                        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500 text-xs">
                          <MessageSquareWarning className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#C89B3C]" />
                          No grievances registered yet. Submit any facility or academic concern using the form on the left.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {data.complaints.map((c: any) => (
                            <div
                              key={c.id}
                              className="rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-4 shadow-sm text-xs space-y-2.5 transition-all hover:border-[#C89B3C]/40"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E3254] pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">{c.complaintCode}</span>
                                  <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                                    {c.category}
                                  </span>
                                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    c.priority === 'URGENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                    : c.priority === 'HIGH' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  }`}>
                                    {c.priority}
                                  </span>
                                </div>
                                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                  c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  : c.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                  : c.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                }`}>
                                  {c.status}
                                </span>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-xs">{c.subject}</h4>
                                <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">{c.description}</p>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                                <span>Filed {c.createdAt} · {c.isAnonymous ? 'Protected Identity' : `${c.studentName} (${c.studentRollNo})`}</span>
                              </div>

                              {c.adminRemarks && (
                                <div className="mt-2 rounded-lg bg-emerald-50/70 dark:bg-[#071F18]/60 border border-emerald-300/40 dark:border-emerald-600/30 p-2.5 text-[11px] text-emerald-900 dark:text-emerald-200">
                                  <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-700 dark:text-emerald-300 text-[10px] uppercase tracking-wider">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Admin Resolution Remarks {c.resolvedAt ? `· ${c.resolvedAt}` : ''}
                                  </div>
                                  <p className="leading-relaxed">{c.adminRemarks}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {section === 'captures' && (
                <div className="space-y-6">
                  {/* Top Banner */}
                  <div className="rounded-xl border border-[#C89B3C]/30 bg-gradient-to-r from-[#0B1D3A] via-[#122A54] to-[#0B1D3A] p-5 text-white shadow-md">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E5B954]">
                          <Camera className="w-4 h-4" />
                          GMU Campus Capturings &amp; Moments
                        </div>
                        <h2 className="text-lg font-bold text-white mt-1">Campus Life &amp; Photography Showcase</h2>
                        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                          Visual diary of university landmarks, advanced labs, academic conventions, cultural celebrations, and campus memories captured by students and faculty.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowUploadModal(true)}
                        className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#C89B3C] to-[#E5B954] px-4 py-2 text-xs font-bold text-[#061021] shadow hover:brightness-105"
                      >
                        <Plus className="w-4 h-4" /> Share Campus Moment
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-[#1E3254] pb-3 text-xs">
                    {(['ALL', 'ARCHITECTURE', 'LABS_TECH', 'EVENTS', 'CAMPUS_LIFE'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setCaptureFilter(tab)}
                        className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
                          captureFilter === tab
                            ? 'bg-[#0B1D3A] text-white dark:bg-[#C89B3C] dark:text-[#061021]'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {tab === 'ALL' ? 'All Captures' : tab.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Captures Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {((data.captures || []).filter((c: any) => captureFilter === 'ALL' || c.category === captureFilter)).map((c: any) => (
                      <div
                        key={c.id}
                        className="campus-interactive-card group rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 overflow-hidden shadow-sm flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer" onClick={() => setActivePhotoModal(c)}>
                            <img
                              src={c.imageUrl}
                              alt={c.title}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute top-2.5 left-2.5">
                              <span className="rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                {c.category.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="absolute bottom-2.5 right-2.5">
                              <span className="rounded-md bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-semibold text-white">
                                {c.location}
                              </span>
                            </div>
                          </div>

                          <div className="p-4 space-y-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{c.title}</h3>
                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed line-clamp-2">{c.description}</p>
                            <div className="text-[10px] text-slate-500 pt-1">
                              By <span className="font-semibold text-slate-700 dark:text-slate-300">{c.capturedBy}</span> · {c.date}
                            </div>
                          </div>
                        </div>

                        <div className="px-4 py-3 border-t border-slate-100 dark:border-[#1E3254] flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => handleLikeCapture(c.id)}
                            className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-semibold active:scale-95 transition-transform"
                          >
                            <Heart className="w-4 h-4 fill-rose-500/30 text-rose-500" />
                            <span>{c.likes} Likes</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePhotoModal(c)}
                            className="text-[#C89B3C] font-semibold hover:underline"
                          >
                            View Fullscreen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Share Capture Modal */}
                  {showUploadModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                      <div className="relative w-full max-w-lg rounded-2xl border border-[#C89B3C]/40 bg-white dark:bg-[#0B1D3A] p-6 shadow-2xl text-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-[#C89B3C]" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Share a Campus Moment</h3>
                          </div>
                          <button type="button" onClick={() => setShowUploadModal(false)} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleCaptureSubmit} className="space-y-3.5">
                          <div>
                            <label className="block font-semibold mb-1">Moment Title</label>
                            <input
                              type="text"
                              placeholder="e.g. Morning Mist at Visvesvaraya Block"
                              value={capTitle}
                              onChange={(e) => setCapTitle(e.target.value)}
                              required
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071326] px-3 py-2"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold mb-1">Category</label>
                              <select
                                value={capCategory}
                                onChange={(e: any) => setCapCategory(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071326] px-3 py-2"
                              >
                                <option value="CAMPUS_LIFE">Campus Life</option>
                                <option value="ARCHITECTURE">Architecture</option>
                                <option value="LABS_TECH">Labs &amp; Tech</option>
                                <option value="EVENTS">Events &amp; Fests</option>
                              </select>
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">Location on Campus</label>
                              <input
                                type="text"
                                placeholder="e.g. Turing Block 3rd Floor"
                                value={capLocation}
                                onChange={(e) => setCapLocation(e.target.value)}
                                required
                                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071326] px-3 py-2"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">Campus Image Choice</label>
                            <select
                              value={capImg}
                              onChange={(e) => setCapImg(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071326] px-3 py-2"
                            >
                              <option value="/src/assets/images/campus_arrival_backdrop_1795328704340.jpg">Campus Entrance &amp; Archway</option>
                              <option value="/src/assets/images/campus_auditorium_event_1795328704354.jpg">Central Auditorium Event</option>
                              <option value="/src/assets/images/gmu_crest_emblem_1795328704978.jpg">Official GM University Crest &amp; Emblem</option>
                              <option value="/src/assets/images/campus_backdrop.jpg">Academic Quadrangle &amp; Lawns</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">Caption / Description</label>
                            <textarea
                              rows={3}
                              placeholder="Share a story or detail about this campus capture..."
                              value={capDesc}
                              onChange={(e) => setCapDesc(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071326] px-3 py-2"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-white/10">
                            <button
                              type="button"
                              onClick={() => setShowUploadModal(false)}
                              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={capSubmitting}
                              className="rounded-lg bg-[#0B1D3A] dark:bg-[#C89B3C] px-5 py-2 font-bold text-white dark:text-[#061021]"
                            >
                              {capSubmitting ? 'Publishing...' : 'Publish Capture'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Fullscreen Photo Modal */}
                  {activePhotoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setActivePhotoModal(null)}>
                      <div className="relative max-w-3xl w-full rounded-2xl overflow-hidden bg-[#0B1D3A] text-white border border-[#C89B3C]/50 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="relative aspect-video w-full bg-black">
                          <img src={activePhotoModal.imageUrl} alt={activePhotoModal.title} className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setActivePhotoModal(null)}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="rounded bg-[#C89B3C] text-[#061021] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              {activePhotoModal.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400">{activePhotoModal.location} · {activePhotoModal.date}</span>
                          </div>
                          <h3 className="text-base font-bold text-white">{activePhotoModal.title}</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">{activePhotoModal.description}</p>
                          <div className="pt-2 flex items-center justify-between border-t border-white/10 text-xs">
                            <span className="text-slate-400">Captured by <strong className="text-white">{activePhotoModal.capturedBy}</strong></span>
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <Heart className="w-4 h-4 fill-rose-500" /> {activePhotoModal.likes} Likes
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {section === 'announcements' && (
                <div className="space-y-3">
                  {data.announcements.map((a: any, idx: number) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-5 text-xs"
                    >
                      <div className="flex justify-between font-bold text-sm"><span>{a.title}</span><span className="text-[#C89B3C]">{a.priority}</span></div>
                      <p className="mt-1.5 leading-relaxed">{a.content}</p>
                      <div className="mt-2 text-slate-500">Posted by {a.postedByName} · {a.createdAt}</div>
                    </motion.div>
                  ))}
                </div>
              )}

              {section === 'settings' && (
                <div className="campus-interactive-card rounded-xl border border-slate-200/90 dark:border-[#1E3254] bg-white/95 dark:bg-[#0E1A2F]/95 p-6 max-w-md text-xs space-y-4">
                  <h2 className="text-sm font-bold">Portal Preferences</h2>
                  <div className="flex items-center justify-between">
                    <span>Theme Appearance</span>
                    <button type="button" onClick={onToggleDarkMode} className="rounded border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-semibold hover:border-[#C89B3C]">Toggle Light / Dark</button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

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
