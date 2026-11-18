import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, MailCheck } from 'lucide-react';

type ConfirmState =
  | { phase: 'no-token' }
  | { phase: 'checking' }
  | { phase: 'confirmed'; email: string | null; alreadyVerified: boolean }
  | { phase: 'failed'; message: string };

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [state, setState] = React.useState<ConfirmState>(() =>
    token ? { phase: 'checking' } : { phase: 'no-token' }
  );
  // A one-time link is confirmed once per page load, even if React re-runs the effect in development.
  const submitted = React.useRef(false);

  React.useEffect(() => {
    if (!token || submitted.current) return;
    submitted.current = true;

    let cancelled = false;

    async function confirm() {
      try {
        const response = await fetch('/api/auth/email-verification/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await response.json().catch(() => null);

        if (cancelled) return;

        if (!response.ok || !data?.success) {
          setState({
            phase: 'failed',
            message: data?.error || 'This confirmation link could not be used.',
          });
          return;
        }

        setState({
          phase: 'confirmed',
          email: data.email ?? null,
          alreadyVerified: Boolean(data.alreadyVerified),
        });
      } catch {
        if (!cancelled) {
          setState({ phase: 'failed', message: 'Network error while confirming the address.' });
        }
      }
    }

    confirm();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex flex-1 flex-col bg-[#FAF8F3]">
      <div className="mx-auto w-full max-w-[440px] px-5 py-12 sm:py-16">
        <div className="rounded-[20px] border border-[#E8DDCC] bg-white p-6 shadow-[0_20px_50px_-34px_rgba(51,45,41,0.45)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#397451]">Email confirmation</p>

          {state.phase === 'checking' && (
            <>
              <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#332D29]">
                Confirming your address
              </h1>
              <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-[#FAF8F3] px-3.5 py-3 text-[13px] leading-5 text-[#756B61]">
                <Loader2 className="h-4 w-4 animate-spin text-[#B9A58B]" />
                One moment while the one-time link is checked.
              </div>
            </>
          )}

          {state.phase === 'confirmed' && (
            <>
              <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#332D29]">
                {state.alreadyVerified ? 'Already confirmed' : 'Address confirmed'}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#756B61]">
                {state.email ? (
                  <>
                    <span className="font-medium text-[#332D29]">{state.email}</span> is recorded as verified, because you opened a link
                    that only that inbox could receive.
                  </>
                ) : (
                  'Your address is recorded as verified, because you opened a link that only that inbox could receive.'
                )}
              </p>
              <div className="mt-6 flex gap-2.5 rounded-xl bg-[rgba(57,116,81,0.1)] px-3.5 py-3 text-[13px] leading-5 text-[#2C5B40]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                A reviewer and a basis are stored with this decision, so it can be checked later.
              </div>
              <Link
                to="/login"
                className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#332D29] px-5 text-sm font-semibold text-[#FAF8F3] transition-colors duration-200 hover:bg-[#397451] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#332D29] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          {(state.phase === 'failed' || state.phase === 'no-token') && (
            <>
              <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#332D29]">
                This link did not work
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#756B61]">
                Confirmation links work once and expire after 24 hours. Sign in and request a fresh one from your security settings.
              </p>
              <div role="alert" className="mt-6 flex gap-2.5 rounded-xl bg-[rgba(180,64,54,0.08)] px-3.5 py-3 text-[13px] leading-5 text-[#8C332B]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {state.phase === 'failed' ? state.message : 'No confirmation code was found in this address.'}
              </div>
              <Link
                to="/login"
                className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#332D29] px-5 text-sm font-semibold text-[#FAF8F3] transition-colors duration-200 hover:bg-[#397451] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#332D29] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Go to sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          <p className="mt-4 flex gap-2 text-[11px] leading-5 text-[#8A7E72]">
            <MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Confirming an address proves you can read its mail. It is not an identity or property check.
          </p>
        </div>
      </div>
    </div>
  );
}
