import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuth = create(persist((set, get) => ({
  user: null, accessToken: null, refreshToken: null,
  setSession: ({ user, accessToken, refreshToken }) => set((s) => ({ user: user || s.user, accessToken, refreshToken: refreshToken || s.refreshToken })),
  logoutLocal: () => set({ user: null, accessToken: null, refreshToken: null }),
  can: (key) => { const p = get().user?.permissions || []; return p.includes('*') || p.includes(key); },
}), { name: 'hms-auth' }));

export const useCan = () => { const user = useAuth((s) => s.user); const p = user?.permissions || []; return (k) => p.includes('*') || p.includes(k); };
export const homeFor = (user) => {
  if (!user) return '/login'; const p = user.permissions || []; const has = (k) => p.includes('*') || p.includes(k);
  if (['Admin', 'Manager'].includes(user.role) && has('dashboard.view')) return '/dashboard';
  if (user.role === 'Receptionist' || (has('calendar.view') && has('checkin.perform'))) return '/reception';
  if (has('dashboard.view')) return '/dashboard'; if (has('payments.view')) return '/payments'; if (has('housekeeping.view')) return '/housekeeping'; return '/profile';
};
