import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Download, Sparkles, CheckCircle2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface Department {
  id: number;
  code: string;
  name: string;
}

interface AuthSession {
  token: string;
  user: {
    userId: number;
    username: string;
    fullName: string;
    role: 'ADMIN' | 'STUDENT';
  };
}

interface Props {
  onLoginSuccess: (session: AuthSession) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

const BACKDROP_IMG = '/src/assets/images/campus_arrival_backdrop_1795328704340.jpg';
const CREST_IMG = '/src/assets/images/gmu_crest_emblem_1795328704978.jpg';

const DUST_PARTICLES = [
  { top: '18%', left: '28%', delay: '0s', size: 5 },
  { top: '34%', left: '66%', delay: '0.9s', size: 4 },
  { top: '52%', left: '38%', delay: '1.8s', size: 6 },
  { top: '26%', left: '54%', delay: '2.4s', size: 4 },
  { top: '62%', left: '61%', delay: '0.5s', size: 5 },
  { top: '44%', left: '24%', delay: '1.4s', size: 4 },
  { top: '70%', left: '48%', delay: '2.9s', size: 5 },
];

const STARS = [
  { top: '10%', left: '14%', delay: '0.2s' },
  { top: '16%', left: '29%', delay: '1.1s' },
  { top: '8%', left: '47%', delay: '0.6s' },
  { top: '14%', left: '68%', delay: '1.9s' },
  { top: '9%', left: '84%', delay: '0.4s' },
  { top: '22%', left: '78%', delay: '2.3s' },
  { top: '24%', left: '18%', delay: '1.5s' },
];

export default function CinematicLogin({ onLoginSuccess, reducedMotion, onToggleReducedMotion }: Props) {
  const [scene, setScene] = useState<1 | 2 | 3>(1);
  const [lampLit, setLampLit] = useState(false);
  const [swinging, setSwinging] = useState(false);
  const [chainStretch, setChainStretch] = useState(0);
  const [chainTilt, setChainTilt] = useState(0);
  const [rippleKey, setRippleKey] = useState(0);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const [roleTab, setRoleTab] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, code: 'CSE', name: 'Computer Science and Engineering' },
    { id: 2, code: 'AIML', name: 'Artificial Intelligence and Machine Learning' },
    { id: 3, code: 'ECE', name: 'Electronics and Communication Engineering' },
    { id: 4, code: 'ME', name: 'Mechanical Engineering' },
    { id: 5, code: 'CIV', name: 'Civil Engineering' },
  ]);
  const [regMsg, setRegMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/public/departments')
      .then(r => r.json())
      .then(j => { if (j.success && Array.isArray(j.data) && j.data.length > 0) setDepartments(j.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scene !== 1) return;
    const timer = setTimeout(() => setScene(2), reducedMotion ? 1400 : 4800);
    return () => clearTimeout(timer);
  }, [scene, reducedMotion]);

  function triggerLamp() {
    setRippleKey(k => k + 1);
    if (!lampLit) {
      setLampLit(true);
      setSwinging(true);
      setTimeout(() => setScene(3), reducedMotion ? 250 : 1200);
    } else {
      setScene(3);
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragStart.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const dy = Math.max(0, Math.min(64, e.clientY - dragStart.current.y));
    const dx = Math.max(-18, Math.min(18, (e.clientX - dragStart.current.x) * 0.25));
    setChainStretch(dy);
    setChainTilt(dx);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;
    setChainStretch(0);
    setChainTilt(0);
    if (dy >= 20 || Math.abs(dy) < 6) {
      triggerLamp();
    }
  }

  function replayIntro() {
    setLampLit(false);
    setSwinging(false);
    setScene(1);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || 'Sign in failed.');
        return;
      }
      if (roleTab === 'ADMIN' && json.data.user.role !== 'ADMIN') {
        setErrorMsg('This account is a Student account. Switch to Student Login.');
        return;
      }
      onLoginSuccess(json.data);
    } catch {
      setErrorMsg('Unable to connect to GM University authentication service.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name'),
      studentId: fd.get('studentId'),
      username: fd.get('username'),
      password: fd.get('password'),
      departmentId: Number(fd.get('departmentId')) || 1,
      branch: fd.get('branch'),
      semester: Number(fd.get('semester')),
      section: fd.get('section'),
      phone: fd.get('phone'),
      admissionYear: Number(fd.get('admissionYear')),
    };
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      if (!res.ok || !json?.success) {
        setRegMsg({ type: 'err', text: json?.message || `Registration failed (HTTP ${res.status}).` });
        return;
      }
      setRegMsg({ type: 'ok', text: json.message });
      e.currentTarget.reset();
    } catch (err: any) {
      setRegMsg({
        type: 'err',
        text: `Unable to reach the registration server (${err?.message || 'connection failed'}). Make sure the app server is running.`,
      });
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061021] text-slate-100">
      {/* Persistent Top Controls */}
      <div className="fixed top-4 right-4 z-40 flex flex-wrap items-center gap-2">
        <a
          href="/api/download-spring-zip"
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/45 bg-[#0B1D3A]/90 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-[#142B52] hover:scale-[1.02] transition-all whitespace-nowrap shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Download Java Spring Boot ZIP
        </a>
        {scene === 3 && (
          <button
            type="button"
            onClick={replayIntro}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-600/70 bg-[#0B1D3A]/85 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Replay Intro
          </button>
        )}
        <button
          type="button"
          onClick={onToggleReducedMotion}
          className="rounded-lg border border-slate-600/70 bg-[#0B1D3A]/85 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          {reducedMotion ? 'Motion: Reduced' : 'Reduce Motion'}
        </button>
        {scene < 3 && (
          <button
            type="button"
            onClick={() => { setLampLit(true); setScene(3); }}
            className="rounded-lg bg-[#C89B3C] px-3 py-1.5 text-xs font-semibold text-[#061021] hover:bg-[#E5B954] transition-colors whitespace-nowrap shrink-0"
          >
            Skip Intro
          </button>
        )}
      </div>

      {/* Scene Progress Indicator */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-lg border border-white/10 bg-[#0B1D3A]/80 px-3.5 py-1.5 text-[11px] text-slate-300">
        {[
          { id: 1, label: '01. Campus Arrival' },
          { id: 2, label: '02. Study Lamp' },
          { id: 3, label: '03. Portal Login' },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { if (item.id === 3) setLampLit(true); setScene(item.id as 1 | 2 | 3); }}
            className={`px-2 py-0.5 rounded transition-colors ${
              scene === item.id ? 'bg-[#C89B3C] text-[#061021] font-semibold' : 'hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* SCENE 1: Campus Arrival */}
        {scene === 1 && (
          <motion.section
            key="scene-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.7 }}
            aria-label="Campus Arrival"
            className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16"
          >
            <motion.img
              src={BACKDROP_IMG}
              alt="GM University Campus Boulevard"
              referrerPolicy="no-referrer"
              initial={{ scale: 1.14, x: -16 }}
              animate={{ scale: 1.03, x: 0 }}
              transition={{ duration: reducedMotion ? 0.1 : 6, ease: 'easeOut' }}
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#061021]/75 via-[#061021]/40 to-[#061021]/95" />

            {/* Twinkling Dusk Stars */}
            {!reducedMotion && STARS.map((s, i) => (
              <span
                key={i}
                className="animate-gmu-twinkle absolute h-1 w-1 rounded-full bg-amber-100"
                style={{ top: s.top, left: s.left, animationDelay: s.delay }}
              />
            ))}

            <div className="relative z-10 max-w-3xl w-full text-center">
              <motion.img
                src={CREST_IMG}
                alt="GM University Crest"
                referrerPolicy="no-referrer"
                initial={{ y: -16, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="mx-auto mb-4 h-20 w-20 rounded-2xl border-2 border-[#E5B954] object-cover shadow-2xl"
              />
              <motion.h1
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="font-display text-5xl sm:text-6xl font-bold tracking-wide text-[#FDE68A] text-balance"
              >
                GM UNIVERSITY
              </motion.h1>
              <motion.p
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mt-2 text-xl sm:text-2xl font-medium text-slate-100"
              >
                Every Great Journey Begins Here.
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.45, duration: 0.5 }}
                className="mt-1 text-xs text-slate-300"
              >
                Smart Campus Integrated Management System · UE25CS2303
              </motion.p>

              {/* Animated Campus Boulevard + Walking Student + Swaying Trees + Glowing Lamps */}
              <div className="relative mx-auto mt-6 h-48 w-full max-w-2xl overflow-hidden rounded-2xl border border-amber-300/20 bg-[#071327]/60 backdrop-blur-sm px-4">
                {/* Campus Gate Archway on right */}
                <div className="absolute right-6 bottom-4 flex flex-col items-center opacity-90">
                  <div className="w-24 h-20 rounded-t-full border-2 border-[#E5B954]/60 bg-[#0B1D3A]/80 flex items-center justify-center">
                    <span className="font-display text-xs font-bold text-[#FDE68A] tracking-widest">GMU GATE</span>
                  </div>
                </div>

                {/* Swaying Avenue Trees & Pathway Streetlamps */}
                <svg className="absolute left-10 bottom-4 animate-gmu-tree" width="46" height="92" viewBox="0 0 46 92" aria-hidden="true">
                  <rect x="20" y="54" width="6" height="36" fill="#5C4033" />
                  <circle cx="23" cy="36" r="18" fill="#1E4D3B" />
                  <circle cx="15" cy="44" r="12" fill="#255E47" />
                  <circle cx="31" cy="44" r="12" fill="#183F30" />
                </svg>

                <svg className="absolute left-52 bottom-4 animate-gmu-tree" style={{ animationDelay: '0.8s' }} width="40" height="82" viewBox="0 0 46 92" aria-hidden="true">
                  <rect x="20" y="54" width="6" height="36" fill="#5C4033" />
                  <circle cx="23" cy="38" r="16" fill="#1E4D3B" />
                </svg>

                {/* Glowing Pathway Streetlamp */}
                <div className="absolute left-36 bottom-4 flex flex-col items-center">
                  <div className="h-3.5 w-3.5 rounded-full bg-amber-200 shadow-[0_0_24px_8px_rgba(253,224,71,0.65)] animate-gmu-glow" />
                  <div className="h-16 w-1 bg-slate-500" />
                </div>

                {/* Walkway Line */}
                <div className="absolute bottom-4 inset-x-4 h-0.5 bg-gradient-to-r from-amber-500/20 via-[#E5B954]/70 to-amber-300/80" />

                {/* Walking Student with Backpack */}
                <svg
                  width="104"
                  height="136"
                  viewBox="0 0 110 140"
                  aria-hidden="true"
                  className={`absolute bottom-3 left-4 ${reducedMotion ? '' : 'animate-gmu-walk'}`}
                >
                  <rect x="25" y="48" width="19" height="34" rx="5" fill="#1E3A5F" stroke="#E5B954" strokeWidth="1.5" />
                  <line className={reducedMotion ? '' : 'animate-gmu-leg-a'} x1="48" y1="92" x2="36" y2="128" stroke="#CBD5E1" strokeWidth="7" strokeLinecap="round" />
                  <line className={reducedMotion ? '' : 'animate-gmu-leg-b'} x1="56" y1="92" x2="70" y2="128" stroke="#94A3B8" strokeWidth="7" strokeLinecap="round" />
                  <rect x="40" y="48" width="24" height="46" rx="8" fill="#0F294E" stroke="#F8FAFC" strokeWidth="1.2" />
                  <circle cx="52" cy="30" r="13" fill="#F1C29B" />
                  <path d="M39 27 C41 15, 63 15, 65 27 Z" fill="#1E293B" />
                  <line className={reducedMotion ? '' : 'animate-gmu-arm'} x1="52" y1="56" x2="66" y2="82" stroke="#F1C29B" strokeWidth="5.5" strokeLinecap="round" />
                </svg>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setScene(2)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#C89B3C] px-6 py-2.5 text-sm font-semibold text-[#061021] hover:bg-[#E5B954] transition-colors shadow-lg"
              >
                Enter Study Atrium
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* SCENE 2: Interactive Pull-Chain Hanging Lamp */}
        {scene === 2 && (
          <motion.section
            key="scene-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.65 }}
            aria-label="Interactive Hanging Lamp"
            className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 transition-colors duration-700"
            style={{
              background: lampLit
                ? 'radial-gradient(circle at 50% 28%, rgba(253,224,132,0.38) 0%, rgba(200,155,60,0.16) 38%, #09162C 78%)'
                : 'radial-gradient(circle at 50% 24%, rgba(25,48,88,0.48), #050C18 75%)',
            }}
          >
            {!reducedMotion && (
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                {DUST_PARTICLES.map((p, idx) => (
                  <span
                    key={idx}
                    className="animate-gmu-float absolute rounded-full bg-amber-200/70"
                    style={{ top: p.top, left: p.left, width: p.size, height: p.size, animationDelay: p.delay }}
                  />
                ))}
              </div>
            )}

            <div className={`relative flex flex-col items-center ${swinging && !reducedMotion ? 'animate-gmu-swing' : ''}`}>
              <div className="h-16 w-1 bg-gradient-to-b from-slate-600 to-[#C89B3C]" />
              <div className="h-20 w-48 rounded-t-[96px] rounded-b-xl border-2 border-[#C89B3C] bg-gradient-to-b from-[#1E3A5F] to-[#0D1E38] shadow-2xl relative">
                <div className="absolute inset-x-6 top-2 h-1 rounded-full bg-amber-200/25" />
              </div>
              <div
                className={`-mt-3 h-10 w-10 rounded-full transition-all duration-500 ${
                  lampLit ? 'bg-[#FEF08A] shadow-[0_0_54px_24px_rgba(253,224,71,0.78)]' : 'bg-slate-700'
                }`}
              />

              {/* Click light ripple */}
              {rippleKey > 0 && lampLit && !reducedMotion && (
                <motion.div
                  key={rippleKey}
                  initial={{ scale: 0.4, opacity: 0.8 }}
                  animate={{ scale: 2.8, opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="pointer-events-none absolute top-32 h-24 w-24 rounded-full border-2 border-amber-300/60"
                />
              )}

              {lampLit && (
                <div
                  className="pointer-events-none absolute top-36 h-80 w-[440px] bg-gradient-to-b from-amber-200/35 to-transparent"
                  style={{ clipPath: 'polygon(34% 0%, 66% 0%, 100% 100%, 0% 100%)' }}
                />
              )}

              {/* Pull Chain with pointer stretch + tilt */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Drag or tap pull chain to switch on lamp"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerLamp(); } }}
                className="flex flex-col items-center px-10 py-2 cursor-grab active:cursor-grabbing select-none touch-none"
                style={{ transform: `rotate(${chainTilt}deg)`, transformOrigin: 'top center' }}
              >
                <div
                  className="w-1.5 rounded-sm transition-all duration-100"
                  style={{
                    height: `${76 + chainStretch}px`,
                    background: 'repeating-linear-gradient(180deg, #E5B954 0 5px, #855E17 5px 8px)',
                  }}
                />
                <div className="h-7 w-5 rounded-full border border-amber-100 bg-gradient-to-br from-amber-200 to-amber-700 shadow-lg" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative z-10 mt-5 max-w-md text-center"
            >
              <h2 className="font-display text-3xl font-bold text-[#FDE68A]">GM University Academic Study</h2>
              <p className="mt-2 text-sm text-slate-300">
                {lampLit
                  ? 'Warm illumination activated. Entering Smart Campus Portal...'
                  : 'Pull the brass chain downward (drag or tap) to ignite the lamp and reveal login.'}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                {lampLit && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setScene(3)}
                    className="rounded-lg bg-[#C89B3C] px-6 py-2 text-sm font-bold text-[#061021] hover:bg-[#E5B954] transition-colors"
                  >
                    ENTER
                  </motion.button>
                )}
                <button
                  type="button"
                  onClick={() => { setLampLit(true); setScene(3); }}
                  className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/70 transition-colors"
                >
                  Open Login Form
                </button>
              </div>
            </motion.div>
          </motion.section>
        )}

        {/* SCENE 3: Login & Registration */}
        {scene === 3 && (
          <motion.section
            key="scene-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Campus Sign In"
            className="relative z-20 flex min-h-screen items-center justify-center px-4 py-16"
          >
            <img
              src={BACKDROP_IMG}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#061021]/80 via-[#061021]/65 to-[#061021]/95" />

            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0.1 : 0.45 }}
              className="relative z-10 w-full max-w-md rounded-2xl border border-[#C89B3C]/45 bg-[#0A162B]/95 p-7 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-md"
            >
              <div className="flex items-center gap-3.5 mb-5">
                <img
                  src={CREST_IMG}
                  alt="GM University Crest"
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-xl border border-[#C89B3C] object-cover"
                />
                <div>
                  <h2 className="font-display text-2xl font-bold text-[#FDE68A] leading-tight">GM University</h2>
                  <p className="text-xs text-slate-300">Smart Campus Integrated Portal</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#061021] p-1 mb-4 border border-slate-700/70">
                <button
                  type="button"
                  onClick={() => { setRoleTab('STUDENT'); setErrorMsg(null); }}
                  className={`rounded-md py-2 text-xs font-semibold transition-all ${
                    roleTab === 'STUDENT' ? 'bg-[#C89B3C] text-[#061021] shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Student Login
                </button>
                <button
                  type="button"
                  onClick={() => { setRoleTab('ADMIN'); setErrorMsg(null); }}
                  className={`rounded-md py-2 text-xs font-semibold transition-all ${
                    roleTab === 'ADMIN' ? 'bg-[#C89B3C] text-[#061021] shadow-sm' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Administrator Login
                </button>
              </div>

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-950/50 p-3 text-xs text-red-200"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    {roleTab === 'ADMIN' ? 'Administrator Username' : 'Username or Student ID'}
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={roleTab === 'ADMIN' ? 'admin' : 'aarav.patel or GMU25CS001'}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#C89B3C] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3.5 py-2.5 pr-11 text-sm text-white placeholder-slate-500 focus:border-[#C89B3C] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      aria-label="Toggle password visibility"
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="inline-flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-600 bg-slate-900"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowRegister(true); setRegMsg(null); }}
                    className="font-semibold text-[#E5B954] hover:underline"
                  >
                    New Student? Register
                  </button>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className="w-full rounded-lg bg-[#C89B3C] py-2.5 text-sm font-bold text-[#061021] hover:bg-[#E5B954] transition-colors disabled:opacity-60"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Smart Campus'}
                </motion.button>
              </form>

              <div className="mt-5 border-t border-slate-800 pt-3.5 text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Admin: <code className="text-slate-200">admin</code> / <code className="text-slate-200">Admin@GMU2026</code></span>
                  <button
                    type="button"
                    onClick={() => { setRoleTab('ADMIN'); setUsername('admin'); setPassword('Admin@GMU2026'); }}
                    className="text-[#E5B954] hover:underline font-medium"
                  >
                    Fill Admin
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Student: <code className="text-slate-200">aarav.patel</code> / <code className="text-slate-200">Student@2026</code></span>
                  <button
                    type="button"
                    onClick={() => { setRoleTab('STUDENT'); setUsername('aarav.patel'); setPassword('Student@2026'); }}
                    className="text-[#E5B954] hover:underline font-medium"
                  >
                    Fill Student
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegister && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0D1A30] p-6 text-slate-100 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-2xl font-bold text-[#FDE68A]">Student Account Registration</h3>
                  <p className="text-xs text-slate-400">New registrations enter PENDING state until approved by the GM University Administrator.</p>
                </div>
                <button type="button" onClick={() => setShowRegister(false)} className="text-sm text-slate-400 hover:text-white">Close</button>
              </div>

              {regMsg && (
                <div className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-xs ${
                  regMsg.type === 'ok' ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-200' : 'border-red-500/50 bg-red-950/50 text-red-200'
                }`}>
                  {regMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{regMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Full Name</label>
                  <input name="name" required className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Student ID</label>
                  <input name="studentId" required placeholder="GMU25CS045" className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Username</label>
                  <input name="username" required className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Password (min 6 chars)</label>
                  <input name="password" type="password" minLength={6} required className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <select name="departmentId" className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white">
                    {departments.map(d => <option key={d.id} value={d.id}>{d.code} · {d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Branch</label>
                  <input name="branch" required placeholder="Computer Science & Engg" className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white" />
                </div>
                <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                  <div>
                    <label className="block font-semibold mb-1">Semester</label>
                    <input name="semester" type="number" min={1} max={8} defaultValue={3} required className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Section</label>
                    <input name="section" defaultValue="A" required className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Admission Year</label>
                    <input name="admissionYear" type="number" defaultValue={2025} required className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1">Phone Number</label>
                  <input name="phone" required placeholder="9880112233" className="w-full rounded-lg border border-slate-700 bg-[#061021] px-3 py-2 text-white" />
                </div>
                <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowRegister(false)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-800">Cancel</button>
                  <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#C89B3C] px-5 py-2 font-bold text-[#061021] hover:bg-[#E5B954]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Submit Registration
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
