import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';

const fieldClassName =
  'w-full rounded-xl border border-[#E8DDCC] bg-white px-3.5 py-2.5 text-sm text-[#332D29] placeholder:text-[#A79B8D] transition-colors duration-150 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/25';

const labelClassName = 'mb-1.5 block text-[13px] font-medium text-[#5E554D]';

const primaryButtonClassName =
  'mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#332D29] px-5 text-sm font-semibold text-[#FAF8F3] transition-colors duration-200 hover:bg-[#397451] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#332D29] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = React.useState('');
  const [confirmation, setConfirmation] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError('The two passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.error || 'This reset link could not be used.');
        return;
      }

      setDone(true);
    } catch {
      setError('Network error while saving the new password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-[#FAF8F3]">
      <div className="mx-auto w-full max-w-[440px] px-5 py-12 sm:py-16">
        <div className="rounded-[20px] border border-[#E8DDCC] bg-white p-6 shadow-[0_20px_50px_-34px_rgba(51,45,41,0.45)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#397451]">Account recovery</p>

          {!token ? (
            <>
              <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#332D29]">
                This link is incomplete
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#756B61]">
                A reset link carries a one-time code. Open the newest email we sent, or ask for a fresh link from the sign-in page.
              </p>
              <div className="mt-6 flex gap-2.5 rounded-xl bg-[rgba(180,64,54,0.08)] px-3.5 py-3 text-[13px] leading-5 text-[#8C332B]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                No reset code was found in this address.
              </div>
              <Link to="/login" className={primaryButtonClassName}>
                Back to sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : done ? (
            <>
              <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#332D29]">
                Password updated
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#756B61]">
                Every other session has been signed out, because a change of password should not leave an old tab logged in.
              </p>
              <div className="mt-6 flex gap-2.5 rounded-xl bg-[rgba(57,116,81,0.1)] px-3.5 py-3 text-[13px] leading-5 text-[#2C5B40]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                Sign in with the new password to continue.
              </div>
              <Link to="/login" className={primaryButtonClassName}>
                Go to sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#332D29]">
                Choose a new password
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#756B61]">
                This link works once and expires 60 minutes after it was requested.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="reset-password" className={labelClassName}>
                      New password
                    </label>
                    <span className="mb-1.5 text-[11px] text-[#8A7E72]">12+ characters</span>
                  </div>
                  <div className="relative">
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      minLength={12}
                      maxLength={72}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className={`${fieldClassName} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-[#8A7E72] transition-colors hover:text-[#332D29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-password-confirm" className={labelClassName}>
                    Confirm new password
                  </label>
                  <input
                    id="reset-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={72}
                    required
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    placeholder="••••••••"
                    className={fieldClassName}
                  />
                </div>

                {error && (
                  <div role="alert" aria-live="polite" className="flex gap-2.5 rounded-xl bg-[rgba(180,64,54,0.08)] px-3.5 py-3 text-[13px] leading-5 text-[#8C332B]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className={primaryButtonClassName}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Saving…' : 'Save new password'}
                  {!isSubmitting && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>

              <p className="mt-4 flex gap-2 text-[11px] leading-5 text-[#8A7E72]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Nobody at PropManage will ask you for this password or for a code by email.
              </p>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-[13px] text-[#756B61]">
          <Link to="/login" className="underline decoration-[#E8DDCC] underline-offset-2 transition-colors hover:text-[#332D29]">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
