import { useEffect, useState } from 'react';
import CinematicLogin from './components/CinematicLogin';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';

interface AuthSession {
  token: string;
  user: {
    userId: number;
    username: string;
    fullName: string;
    role: 'ADMIN' | 'STUDENT';
  };
}

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('gmu-theme') === 'dark');
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    () =>
      localStorage.getItem('gmu-reduced-motion') === 'true' ||
      (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('gmu-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
    localStorage.setItem('gmu-reduced-motion', String(reducedMotion));
  }, [reducedMotion]);

  async function handleLogout() {
    if (session) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      }).catch(() => {});
    }
    setSession(null);
  }

  if (!session) {
    return (
      <CinematicLogin
        onLoginSuccess={(next) => setSession(next)}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion((r) => !r)}
      />
    );
  }

  if (session.user.role === 'ADMIN') {
    return (
      <AdminDashboard
        token={session.token}
        user={session.user}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <StudentDashboard
      token={session.token}
      user={session.user}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((d) => !d)}
      onLogout={handleLogout}
    />
  );
}
