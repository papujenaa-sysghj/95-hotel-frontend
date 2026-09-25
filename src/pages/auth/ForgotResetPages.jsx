import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/auth.api';
import { errMsg } from '../../services/api';
import { toast } from '../../store/toast';
import { Field, Spinner } from '../../components/common/ui';
import { AuthShell } from './LoginPage';

export function ForgotPage() {
  const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const go = async (e) => { e.preventDefault(); setBusy(true); try { await authApi.forgot(email); setSent(true); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); } };
  return <AuthShell title="Reset your password" subtitle="We'll email you a link that works for 30 minutes.">{sent ? <p className="rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-800">If that email belongs to an account, a reset link is on its way.</p> :
    <form onSubmit={go} className="space-y-4"><Field label="Email"><input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></Field><button className="btn-primary w-full py-2.5" disabled={busy}>{busy && <Spinner />}Send reset link</button></form>}<p className="mt-5 text-center text-sm"><Link className="font-semibold text-brand-600" to="/login">Back to sign in</Link></p></AuthShell>;
}
export function ResetPage() {
  const [sp] = useSearchParams(); const nav = useNavigate(); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const go = async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { await authApi.reset({ token: sp.get('token') || '', newPassword: pw }); toast.success('Password reset. You can sign in now.'); nav('/login'); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); } };
  return <AuthShell title="Choose a new password" subtitle="At least 8 characters, with a letter and a number.">
    <form onSubmit={go} className="space-y-4">{err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{err}</p>}<Field label="New password"><input type="password" required minLength={8} className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus /></Field><button className="btn-primary w-full py-2.5" disabled={busy}>{busy && <Spinner />}Reset password</button></form></AuthShell>;
}
