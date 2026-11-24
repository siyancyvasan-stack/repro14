import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { publicApiRequest } from '../services/apiClient';

export const DeleteAccountPage = () => {
  const [params] = useSearchParams();
  const [email, setEmail] = React.useState(params.get('email') ?? '');
  const [password, setPassword] = React.useState('');
  const [token, setToken] = React.useState(params.get('token') ?? '');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const confirmMode = Boolean(token);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const result = await publicApiRequest<{ message: string }>('/api/v1/auth/account-deletion/' + (confirmMode ? 'confirm' : 'request'), {
        method: 'POST', body: JSON.stringify(confirmMode ? { email, token, tenant: 'reproutes' } : { email, password, tenant: 'reproutes' }),
      });
      setMessage(result.message);
      if (!confirmMode) setPassword('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to process the request.'); }
    finally { setBusy(false); }
  };

  return <main className="min-h-[100dvh] bg-slate-950 px-4 py-8 text-slate-200 sm:px-6 lg:px-8"><article className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl sm:p-10">
    <Link to="/sales/login" className="text-sm font-bold text-cyan-400 hover:text-cyan-300">← Back to Reproutes Sales</Link>
    <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-cyan-400">Reproutes</p>
    <h1 className="mt-2 text-3xl font-black text-white">Delete Account</h1>
    <p className="mt-4 text-sm leading-7 text-slate-300">Submit a verified request to delete your Reproutes account. We verify ownership using your current password and a one-time email link before processing the request.</p>
    <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100"><strong>What happens:</strong> your profile identifiers, active sessions, passkeys, and raw GPS points are removed or revoked. De-identified attendance, transaction, safety, and audit records may be retained for up to 7 years when required for legal, accounting, employment, or security purposes.</div>
    <form onSubmit={submit} className="mt-8 space-y-4"><label className="block text-sm font-bold">Account email<input className="glass-input mt-2 w-full rounded-xl px-4 py-3" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      {!confirmMode && <label className="block text-sm font-bold">Current password<input className="glass-input mt-2 w-full rounded-xl px-4 py-3" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
      {confirmMode && <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">Your email verification link is ready. Confirming will deactivate the account and revoke access.</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-rose-600 px-4 py-3 font-extrabold text-white hover:bg-rose-500 disabled:opacity-50">{busy ? 'Processing…' : confirmMode ? 'Confirm account deletion' : 'Email me a verification link'}</button>
    </form>
    <footer className="mt-8 flex flex-wrap gap-4 border-t border-slate-800 pt-6 text-sm font-semibold"><Link to="/privacy-policy" className="text-cyan-400 hover:underline">Privacy Policy</Link><Link to="/terms-of-service" className="text-cyan-400 hover:underline">Terms of Service</Link></footer>
  </article></main>;
};
