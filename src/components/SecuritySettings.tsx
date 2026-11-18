import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface MfaState {
  available: boolean;
  enabled: boolean;
  enabledAt: string | null;
  pendingSetup: boolean;
  recoveryCodesRemaining: number;
}

interface SessionRecord {
  id: string;
  createdAt: string;
  expiresAt: string;
  userAgent: string | null;
}

interface SetupPayload {
  secret: string;
  otpauthUrl: string;
  recoveryCodes: string[];
}

const cardClassName =
  'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 sm:p-6 shadow-sm';
const headingClassName = 'flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100';
const bodyClassName = 'mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400';
const fieldClassName =
  'w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100';
const primaryButtonClassName =
  'inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-70';
const secondaryButtonClassName =
  'inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-70';

function formatTimestamp(value: string | null) {
  if (!value) return 'unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function shortUserAgent(value: string | null) {
  if (!value) return 'Unknown device';
  const browser = /edg/i.test(value)
    ? 'Edge'
    : /chrome/i.test(value)
      ? 'Chrome'
      : /firefox/i.test(value)
        ? 'Firefox'
        : /safari/i.test(value)
          ? 'Safari'
          : 'Browser';
  const platform = /windows/i.test(value)
    ? 'Windows'
    : /mac os|macintosh/i.test(value)
      ? 'macOS'
      : /android/i.test(value)
        ? 'Android'
        : /iphone|ipad|ios/i.test(value)
          ? 'iOS'
          : /linux/i.test(value)
            ? 'Linux'
            : 'Unknown OS';
  return `${browser} on ${platform}`;
}

/**
 * Account security shared by all three workspaces: email confirmation, the admin second factor, and
 * the list of live sessions. Everything here talks to the real endpoints — nothing is a mock switch.
 */
export function SecuritySettings() {
  const { user, fetchWithAuth, logout } = useAuth();

  const [emailNotice, setEmailNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const [mfa, setMfa] = useState<MfaState | null>(null);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaNotice, setMfaNotice] = useState<string | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [enableCode, setEnableCode] = useState('');
  const [disableForm, setDisableForm] = useState({ password: '', code: '' });
  const [disableOpen, setDisableOpen] = useState(false);
  const [copied, setCopied] = useState<'secret' | 'codes' | null>(null);

  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);

  const loadMfa = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/auth/mfa');
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to read security settings.');
      setMfa(data.data as MfaState);
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : 'Unable to read security settings.');
    }
  }, [fetchWithAuth]);

  const loadSessions = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/auth/sessions');
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to list sessions.');
      setSessions(data.data as SessionRecord[]);
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : 'Unable to list sessions.');
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadMfa();
    loadSessions();
  }, [loadMfa, loadSessions]);

  const emailVerified = user?.emailVerificationStatus === 'verified';

  const requestEmailLink = async () => {
    setSendingEmail(true);
    setEmailNotice(null);
    try {
      const response = await fetchWithAuth('/api/auth/email-verification/request', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'The confirmation link could not be sent.');
      setEmailNotice({ type: 'ok', text: data.message });
    } catch (error) {
      setEmailNotice({ type: 'error', text: error instanceof Error ? error.message : 'The confirmation link could not be sent.' });
    } finally {
      setSendingEmail(false);
    }
  };

  const startSetup = async () => {
    setMfaBusy(true);
    setMfaError(null);
    setMfaNotice(null);
    try {
      const response = await fetchWithAuth('/api/auth/mfa/setup', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Setup could not be started.');
      setSetup(data.data as SetupPayload);
      setEnableCode('');
      await loadMfa();
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : 'Setup could not be started.');
    } finally {
      setMfaBusy(false);
    }
  };

  const enableMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    setMfaBusy(true);
    setMfaError(null);
    setMfaNotice(null);
    try {
      const response = await fetchWithAuth('/api/auth/mfa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: enableCode.replace(/\s+/g, '') }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'That code was not accepted.');
      setMfaNotice('Two-factor authentication is on. Keep the recovery codes somewhere safe.');
      // The codes are shown once, at setup time; the panel keeps them visible until the page reloads.
      setEnableCode('');
      await loadMfa();
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : 'That code was not accepted.');
    } finally {
      setMfaBusy(false);
    }
  };

  const disableMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    setMfaBusy(true);
    setMfaError(null);
    setMfaNotice(null);
    try {
      const response = await fetchWithAuth('/api/auth/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disableForm.password, code: disableForm.code.replace(/\s+/g, '') }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Two-factor authentication could not be switched off.');
      setDisableForm({ password: '', code: '' });
      setDisableOpen(false);
      setSetup(null);
      setMfaNotice('Two-factor authentication is off.');
      await loadMfa();
    } catch (error) {
      setMfaError(error instanceof Error ? error.message : 'Two-factor authentication could not be switched off.');
    } finally {
      setMfaBusy(false);
    }
  };

  const copyToClipboard = async (label: 'secret' | 'codes', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setMfaError('Copying failed. Select the text and copy it by hand.');
    }
  };

  const signOutEverywhere = async () => {
    setRevokingAll(true);
    setSessionsError(null);
    try {
      const response = await fetchWithAuth('/api/auth/logout-all', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Sessions could not be revoked.');
      logout();
    } catch (error) {
      setSessionsError(error instanceof Error ? error.message : 'Sessions could not be revoked.');
    } finally {
      setRevokingAll(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Email confirmation */}
      <section className={cardClassName}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className={headingClassName}>
              <Mail className="h-4 w-4 text-slate-400" />
              Email confirmation
            </h4>
            <p className={bodyClassName}>
              {emailVerified
                ? `${user?.email} is confirmed. A one-time link that only that inbox could open was used to prove it.`
                : `Send a one-time link to ${user?.email ?? 'your address'}. Until it is opened, the status stays pending and no badge is shown.`}
            </p>
          </div>
          <span
            className={[
              'flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold',
              emailVerified
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700',
            ].join(' ')}
          >
            {emailVerified ? 'Confirmed' : 'Pending'}
          </span>
        </div>

        {!emailVerified && (
          <div className="mt-4">
            <button type="button" onClick={requestEmailLink} disabled={sendingEmail} className={secondaryButtonClassName}>
              {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {sendingEmail ? 'Sending…' : 'Send confirmation link'}
            </button>
          </div>
        )}

        {emailNotice && (
          <div
            role={emailNotice.type === 'error' ? 'alert' : 'status'}
            className={[
              'mt-3 flex gap-2 rounded-xl px-3 py-2 text-sm',
              emailNotice.type === 'error'
                ? 'border border-red-200 bg-red-50 text-red-700'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-700',
            ].join(' ')}
          >
            {emailNotice.type === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            {emailNotice.text}
          </div>
        )}
      </section>

      {/* Second factor */}
      <section className={cardClassName}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className={headingClassName}>
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              Two-factor authentication
            </h4>
            <p className={bodyClassName}>
              {mfa?.available
                ? 'An authenticator app generates a six-digit code. With it on, a password alone cannot open your account.'
                : 'Offered to platform staff only, because those accounts can reach every workspace on the platform.'}
            </p>
          </div>
          <span
            className={[
              'flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold',
              mfa?.enabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
            ].join(' ')}
          >
            {mfa?.enabled ? 'On' : mfa?.pendingSetup ? 'Setup started' : 'Off'}
          </span>
        </div>

        {mfaError && (
          <div role="alert" className="mt-3 flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {mfaError}
          </div>
        )}
        {mfaNotice && (
          <div role="status" className="mt-3 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {mfaNotice}
          </div>
        )}

        {mfa?.available && !mfa.enabled && (
          <div className="mt-4 space-y-4">
            {!setup ? (
              <button type="button" onClick={startSetup} disabled={mfaBusy} className={primaryButtonClassName}>
                {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {mfaBusy ? 'Starting…' : mfa.pendingSetup ? 'Start a new setup' : 'Set up two-factor'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Step 1 — add this secret to your authenticator
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <code className="break-all rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100">
                      {setup.secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('secret', setup.secret)}
                      className={secondaryButtonClassName}
                    >
                      <Copy className="h-4 w-4" />
                      {copied === 'secret' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="mt-2 break-all text-xs text-slate-500 dark:text-slate-400">{setup.otpauthUrl}</p>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Recovery codes — shown once
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    If the phone is lost, each code signs you in once. They are stored hashed, so this is the only time they are visible.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                    {setup.recoveryCodes.map((code) => (
                      <code key={code} className="rounded-md bg-white/70 px-2 py-1 text-center font-mono text-xs text-amber-900">
                        {code}
                      </code>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('codes', setup.recoveryCodes.join('\n'))}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === 'codes' ? 'Copied' : 'Copy all codes'}
                  </button>
                </div>

                <form onSubmit={enableMfa} className="space-y-3">
                  <label htmlFor="mfa-enable-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Step 2 — enter the current code to switch it on
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id="mfa-enable-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      value={enableCode}
                      onChange={(event) => setEnableCode(event.target.value)}
                      placeholder="123456"
                      className={`${fieldClassName} max-w-[180px] text-center font-mono tracking-[0.2em]`}
                    />
                    <button type="submit" disabled={mfaBusy} className={primaryButtonClassName}>
                      {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      {mfaBusy ? 'Checking…' : 'Turn on'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {mfa?.available && mfa.enabled && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              On since {formatTimestamp(mfa.enabledAt)} · {mfa.recoveryCodesRemaining} recovery code
              {mfa.recoveryCodesRemaining === 1 ? '' : 's'} left
            </p>

            {!disableOpen ? (
              <button type="button" onClick={() => setDisableOpen(true)} className={secondaryButtonClassName}>
                Turn off
              </button>
            ) : (
              <form onSubmit={disableMfa} className="space-y-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This needs the account password and a current code, so a borrowed session cannot switch it off.
                </p>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={disableForm.password}
                  onChange={(event) => setDisableForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Current password"
                  aria-label="Current password"
                  className={fieldClassName}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    autoComplete="one-time-code"
                    required
                    value={disableForm.code}
                    onChange={(event) => setDisableForm((current) => ({ ...current, code: event.target.value }))}
                    placeholder="Code or recovery code"
                    aria-label="Authenticator code or recovery code"
                    className={`${fieldClassName} max-w-[280px]`}
                  />
                  <button type="submit" disabled={mfaBusy} className={primaryButtonClassName}>
                    {mfaBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {mfaBusy ? 'Turning off…' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisableOpen(false);
                      setDisableForm({ password: '', code: '' });
                    }}
                    className={secondaryButtonClassName}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>

      {/* Sessions */}
      <section className={cardClassName}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className={headingClassName}>
              <MonitorSmartphone className="h-4 w-4 text-slate-400" />
              Signed-in devices
            </h4>
            <p className={bodyClassName}>
              Each row is a refresh token that can still mint a session. Revoking one device here ends that session only.
            </p>
          </div>
          <button type="button" onClick={signOutEverywhere} disabled={revokingAll} className={secondaryButtonClassName}>
            {revokingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {revokingAll ? 'Signing out…' : 'Sign out everywhere'}
          </button>
        </div>

        {sessionsError && (
          <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {sessionsError}
          </div>
        )}

        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {sessions === null ? (
            <li className="py-3 text-sm text-slate-500 dark:text-slate-400">Loading sessions…</li>
          ) : sessions.length === 0 ? (
            <li className="py-3 text-sm text-slate-500 dark:text-slate-400">No live sessions recorded.</li>
          ) : (
            sessions.map((session) => (
              <li key={session.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{shortUserAgent(session.userAgent)}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  started {formatTimestamp(session.createdAt)} · expires {formatTimestamp(session.expiresAt)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

/**
 * Password change shared by all three workspaces. A successful change ends every session, so the
 * panel replaces the form with one honest "sign in again" step rather than leaving a dead tab open.
 */
export function PasswordSettings() {
  const { fetchWithAuth, logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError('Complete all three password fields.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('The new password and its confirmation do not match.');
      return;
    }
    if (form.newPassword.length < 12) {
      setError('The new password must be at least 12 characters.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetchWithAuth('/api/users/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to update the password.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setDone(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to update the password.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <section className={cardClassName}>
        <h4 className={headingClassName}>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Password updated
        </h4>
        <p className={bodyClassName}>
          Every session was signed out, including this one — a new password should not leave an old tab signed in.
        </p>
        <button type="button" onClick={logout} className={`${primaryButtonClassName} mt-4`}>
          <Lock className="h-4 w-4" />
          Sign in again
        </button>
      </section>
    );
  }

  return (
    <section className={cardClassName}>
      <h4 className={headingClassName}>
        <Lock className="h-4 w-4 text-slate-400" />
        Password
      </h4>
      <p className={bodyClassName}>
        Changing it needs the current password, and it signs every device out afterwards.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="settings-current-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Current password
          </label>
          <input
            id="settings-current-password"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
            placeholder="Enter your current password"
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="settings-new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            New password
          </label>
          <input
            id="settings-new-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            value={form.newPassword}
            onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
            placeholder="At least 12 characters"
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="settings-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Confirm new password
          </label>
          <input
            id="settings-confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            value={form.confirmPassword}
            onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
            placeholder="Repeat the new password"
            className={fieldClassName}
          />
        </div>

        {error && (
          <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={busy} className={primaryButtonClassName}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </section>
  );
}
