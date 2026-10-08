import React, { useEffect, useState } from 'react';
import { Building, CheckCircle2, KeyRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface InviteDetails {
  email: string;
  firstName: string;
  lastName: string;
  propertyName: string;
  unitNumber: string;
  rent: number;
  expiresAt: number;
}

export function TenantInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setError('This invitation link is incomplete.');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/tenant-invitations/${encodeURIComponent(token)}`);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'This invitation is invalid or expired.');
        setInvite(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load this invitation.');
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  const handleAccept = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/tenant-invitations/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to accept this invitation.');
      login(data.user, data.token);
      navigate('/tenant', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to accept this invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-lg">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading invitation...</div>
        ) : error && !invite ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Invitation unavailable</h1>
            <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        ) : invite ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-8">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Building className="h-5 w-5" /></div>
              <p className="text-sm font-semibold uppercase text-indigo-600">Tenant invitation</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">Welcome, {invite.firstName}</h1>
              <p className="mt-2 text-slate-600">Your landlord invited you to join the tenant portal.</p>
            </div>

            <div className="space-y-3 border-b border-slate-100 bg-slate-50 p-6 sm:px-8">
              <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500">Email</span><span className="font-medium text-slate-900">{invite.email}</span></div>
              <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500">Property</span><span className="text-right font-medium text-slate-900">{invite.propertyName}, Unit {invite.unitNumber}</span></div>
              <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500">Monthly rent</span><span className="font-medium text-slate-900">${invite.rent.toLocaleString()}</span></div>
              <div className="flex justify-between gap-4 text-sm"><span className="text-slate-500">Link expires</span><span className="text-right font-medium text-slate-900">{new Date(invite.expiresAt).toLocaleDateString()}</span></div>
            </div>

            <form onSubmit={handleAccept} className="space-y-4 p-6 sm:p-8">
              <label className="block text-sm font-medium text-slate-700">Create password
                <span className="relative mt-1 block"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" /></span>
              </label>
              <label className="block text-sm font-medium text-slate-700">Confirm password
                <input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              </label>
              {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">
                <CheckCircle2 className="h-4 w-4" />{submitting ? 'Creating account...' : 'Accept invitation'}
              </button>
              <p className="text-center text-xs text-slate-500">This invitation is for {invite.email} and can only be used once.</p>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}