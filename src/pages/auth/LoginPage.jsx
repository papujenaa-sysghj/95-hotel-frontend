import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Hotel, Eye, EyeOff, Calendar, Users, TrendingUp, 
  ShieldCheck, Mail, Lock, ArrowRight, Quote 
} from 'lucide-react';
import { authApi } from '../../services/auth.api';
import { errMsg } from '../../services/api';
import { useAuth, homeFor } from '../../store/auth';
import { Spinner } from '../../components/common/ui';
import { config } from '../../config';

const schema = z.object({ 
  identifier: z.string().min(1, 'Enter your email or username'), 
  password: z.string().min(1, 'Enter your password') 
});

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] bg-[#0A1128] font-sans antialiased overflow-hidden">
      {/* LEFT SIDE - DARK BLUE BRAND SHOWCASE & HERO */}
      <aside className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 text-white overflow-hidden select-none">
        {/* Decorative ambient background waves */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Hotel className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">Hotel PMS</h1>
              <p className="text-[11px] font-medium text-slate-400">Property Management System</p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400 tracking-wide">
            — For Hotel Staff Only
          </span>
        </div>

        {/* Hero Section + Image Grid */}
        <div className="relative z-10 my-auto py-6 grid grid-cols-1 xl:grid-cols-2 gap-8 items-center">
          {/* Hero Left Text & Feature List */}
          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-bold tracking-widest text-blue-400 uppercase mb-2">
                Simple. Smart. Seamless.
              </p>
              <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white">
                Every room, every night, on <span className="text-blue-500">one</span> calendar.
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Manage bookings, check-ins, payments and housekeeping for your front desk team.
              </p>
            </div>

            {/* 4 Feature Badges */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Manage Bookings</h3>
                  <p className="text-xs text-slate-400">Real-time room availability</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Guest Management</h3>
                  <p className="text-xs text-slate-400">Quick check-in & check-out</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Stay Organized</h3>
                  <p className="text-xs text-slate-400">Rooms, payments & reports</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Secure Access</h3>
                  <p className="text-xs text-slate-400">For authorized hotel staff only</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image Container & Floating Cards */}
          <div className="relative flex justify-center">
            <div className="relative w-full aspect-[4/5] max-w-sm rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src={config.images.loginHero} 
                alt="Luxury Hotel Suite"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128]/80 via-transparent to-black/20" />

              {/* Top Floating Glass Badge */}
              <div className="absolute top-4 left-4 right-4 bg-slate-900/60 backdrop-blur-md border border-white/15 rounded-2xl p-3 flex items-center justify-between text-white shadow-xl">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-teal-300" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-300 font-medium">Today</p>
                    <p className="text-xs font-bold text-white">12 <span className="text-[10px] font-normal text-slate-300">Check-ins</span></p>
                  </div>
                </div>
                <div className="h-6 w-px bg-white/15" />
                <div>
                  <p className="text-xs font-bold text-white">8 <span className="text-[10px] font-normal text-slate-300">Check-outs</span></p>
                </div>
              </div>

              {/* Bottom Quote Floating Glass Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/60 backdrop-blur-md border border-white/15 rounded-2xl p-3 flex items-center gap-3 shadow-xl">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                  <Quote className="h-4 w-4 text-blue-300 fill-current" />
                </div>
                <p className="text-xs text-slate-200 italic font-medium leading-tight">
                  "A smoother check-in means happier guests."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div>
            <span className="text-slate-500">——</span>
            <p className="text-slate-300 font-semibold mt-0.5">Better hospitality.</p>
            <p className="text-slate-400 text-[11px]">Brighter stays.</p>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE - LIGHT LOGIN FORM CARD CONTAINER */}
      <main className="relative flex flex-col justify-between items-center bg-[#F8FAFC] p-6 sm:p-10 overflow-y-auto">
        {/* Subtle top/bottom gradient blur blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full flex justify-center py-4">
          {/* Small top logo for mobile screens */}
          <div className="flex lg:hidden items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Hotel className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">Hotel PMS</span>
          </div>
        </div>

        {/* Centered White Card */}
        <div className="w-full max-w-md my-auto bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-xl shadow-slate-200/60 relative z-10">
          {/* Card Top Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 mb-2.5">
              <Hotel className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Hotel PMS</h2>
            <p className="text-xs text-slate-400 font-medium">Property Management System</p>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">{subtitle}</p>
          </div>

          {children}
        </div>

        {/* Bottom Staff Note */}
        <div className="w-full text-center py-4 text-xs text-slate-400 font-medium relative z-10">
          For hotel staff only. Guests cannot book online in this version.
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  const user = useAuth((s) => s.user);
  const setSession = useAuth((s) => s.setSession);
  const nav = useNavigate();
  const loc = useLocation();
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const f = useForm({ 
    resolver: zodResolver(schema), 
    defaultValues: { identifier: '', password: '' } 
  });
  const e = f.formState.errors;

  if (user) return <Navigate to={loc.state?.from || homeFor(user)} replace />;

  const submit = f.handleSubmit(async (v) => {
    setError('');
    try {
      const d = await authApi.login(v);
      setSession(d);
      nav(loc.state?.from || homeFor(d.user), { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Could not sign in. Please try again.'));
    }
  });

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your account">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <div className="rounded-xl bg-red-50 p-3 border border-red-100 text-xs font-semibold text-red-600" role="alert">
            {error}
          </div>
        )}

        {/* Demo Credentials Quick Fill Pills */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-[11px] tracking-wide uppercase">
              Quick Auto-Fill Role
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Password: <code className="bg-slate-200/70 px-1 py-0.5 rounded text-slate-700">Hotel@12345</code>
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              { label: 'Admin', email: 'admin@hotel.com', bg: 'hover:bg-blue-600 hover:text-white border-blue-200 text-blue-700 bg-blue-50/60' },
              { label: 'Manager', email: 'manager@hotel.com', bg: 'hover:bg-indigo-600 hover:text-white border-indigo-200 text-indigo-700 bg-indigo-50/60' },
              { label: 'Reception', email: 'reception@hotel.com', bg: 'hover:bg-teal-600 hover:text-white border-teal-200 text-teal-700 bg-teal-50/60' },
              { label: 'Cashier', email: 'cashier@hotel.com', bg: 'hover:bg-purple-600 hover:text-white border-purple-200 text-purple-700 bg-purple-50/60' },
              { label: 'Housekeeping', email: 'housekeeping@hotel.com', bg: 'hover:bg-amber-600 hover:text-white border-amber-200 text-amber-700 bg-amber-50/60' },
            ].map((role) => (
              <button
                key={role.label}
                type="button"
                onClick={() => {
                  f.setValue('identifier', role.email);
                  f.setValue('password', 'Hotel@12345');
                  setError('');
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold border rounded-lg transition-all shadow-2xs active:scale-95 ${role.bg}`}
              >
                + {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Email / Username Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Email or username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input 
              className={`w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border ${e.identifier ? 'border-red-400' : 'border-slate-200'} rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium`}
              placeholder="Enter your email or username"
              autoComplete="username" 
              autoFocus 
              {...f.register('identifier')} 
            />
          </div>
          {e.identifier && <p className="mt-1 text-[11px] font-medium text-red-500">{e.identifier.message}</p>}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input 
              className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border ${e.password ? 'border-red-400' : 'border-slate-200'} rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium`}
              type={show ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password" 
              {...f.register('password')} 
            />
            <button 
              type="button" 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition" 
              onClick={() => setShow(!show)} 
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {e.password && <p className="mt-1 text-[11px] font-medium text-red-500">{e.password.message}</p>}
        </div>

        {/* Options Row */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
            <input 
              type="checkbox" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
            Remember me
          </label>
          <Link className="font-semibold text-blue-600 hover:text-blue-700 transition" to="/forgot-password">
            Forgot your password?
          </Link>
        </div>

        {/* Primary Sign In Button */}
        <button 
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60" 
          disabled={f.formState.isSubmitting}
        >
          {f.formState.isSubmitting ? (
            <Spinner className="h-4 w-4 text-white" />
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

