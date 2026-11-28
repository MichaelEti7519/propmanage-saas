import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Home,
  Info,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import { useAuth } from '../../hooks/useAuth';
import authPanel from '../../assets/auth-panel.jpg';

type RegisterRole = 'landlord' | 'tenant';

const fieldClassName =
  'w-full rounded-xl border border-[#E8DDCC] bg-white px-3.5 py-2.5 text-sm text-[#332D29] placeholder:text-[#A79B8D] transition-colors duration-150 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/25';

const labelClassName = 'mb-1.5 block text-[13px] font-medium text-[#5E554D]';

const switchLinkClassName =
  'font-semibold text-[#332D29] underline decoration-[#B9A58B] underline-offset-4 transition-colors hover:text-[#397451] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B] focus-visible:ring-offset-2';

const registerRoles: {
  value: RegisterRole;
  label: string;
  hint: string;
  icon: typeof Building2;
}[] = [
  { value: 'landlord', label: 'Landlord', hint: 'Properties and tenants', icon: Building2 },
  { value: 'tenant', label: 'Tenant', hint: 'Rent and requests', icon: Home },
];

const trustPoints = [
  'Separate workspaces for landlords and tenants.',
  'Verification stays pending until it is actually checked.',
  'Records, payments and maintenance in one thread.',
];

export function LoginRegister() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = React.useState(true);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState<string>('');
  const [role, setRole] = React.useState<RegisterRole>('landlord');
  const [showPassword, setShowPassword] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mfaToken, setMfaToken] = React.useState<string | null>(null);
  const [mfaCode, setMfaCode] = React.useState('');
  const [forgotOpen, setForgotOpen] = React.useState(false);

  React.useEffect(() => {
    setMessage(null);
  }, [isLogin]);

  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const verifying = Boolean(mfaToken);
    const endpoint = verifying ? '/api/auth/mfa/verify' : isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = verifying
      ? { mfaToken, code: mfaCode.replace(/\s+/g, '') }
      : isLogin
        ? { email, password }
        : {
            firstName,
            lastName,
            email,
            password,
            role,
            phone,
          };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!data || typeof data !== 'object') {
        const contentType = response.headers.get('content-type') || 'unknown content type';
        setMessage({
          type: 'error',
          text: `The server returned an unexpected response (HTTP ${response.status}, ${contentType}). Restart the PropManage server and make sure this page is using the same port.`,
        });
        return;
      }

      if (!response.ok || !data.success) {
        setMessage({ type: 'error', text: data?.error || 'Unable to complete authentication.' });
        return;
      }

      // Once a second factor is on, the password only earns a five-minute ticket. Nothing is stored
      // until the code checks out, so a stolen password alone still does not open the account.
      if (data.mfaRequired && data.mfaToken) {
        setMfaToken(data.mfaToken);
        setMfaCode('');
        setMessage({ type: 'success', text: 'Enter the 6-digit code from your authenticator app. A recovery code works too.' });
        return;
      }

      login(data.user);
      const redirectPath = data.user.role === 'tenant'
        ? '/tenant'
        : data.user.role === 'landlord'
          ? '/landlord'
          : data.mfaEnrollmentRequired
            ? '/admin/settings'
            : '/admin';
      navigate(redirectPath);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Network error while authenticating.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setMessage({ type: 'error', text: data?.error || 'The reset request could not be sent.' });
        return;
      }

      setMessage({ type: 'success', text: data.message });
    } catch {
      setMessage({ type: 'error', text: 'Network error while requesting a reset link.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageBlock = message && (
    <div
      role={message.type === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={[
        'flex gap-2.5 rounded-xl px-3.5 py-3 text-[13px] leading-5',
        message.type === 'error'
          ? 'bg-[rgba(180,64,54,0.08)] text-[#8C332B]'
          : 'bg-[rgba(57,116,81,0.1)] text-[#2C5B40]',
      ].join(' ')}
    >
      {message.type === 'error' && <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      {message.text}
    </div>
  );

  // The tabs are irrelevant once the user is mid-way through either secondary flow.
  const showTabs = !mfaToken && !forgotOpen;
  const formClassName = showTabs ? 'space-y-4' : 'mt-6 space-y-4';

  return (
    <div className="flex flex-1 flex-col bg-[#FAF8F3]">
      <div className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16 lg:px-12 lg:py-16">
        {/* Editorial column: an interior photo carries the product story, hidden on small screens where the form is the job. */}
        <aside className="relative hidden overflow-hidden rounded-[24px] bg-[#332D29] lg:block lg:self-stretch">
          <img src={authPanel} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />

          {/* Espresso gradient keeps the type legible over the lower two thirds of the photograph. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(36,31,28,0.15)_0%,rgba(36,31,28,0.55)_48%,rgba(36,31,28,0.93)_100%)]"
          />

          <div className="relative flex h-full min-h-[560px] flex-col justify-end p-8 xl:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E8DDCC]/80">Property operations</p>

            <h1 className="mt-3 max-w-md font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-[#FAF8F3] xl:text-[40px]">
              A calmer way to run the work behind every home.
            </h1>

            <p className="mt-4 max-w-sm text-sm leading-6 text-[#E8DDCC]/80">
              Records, tenants, rent and maintenance in one workspace — with verification that never pretends to be complete.
            </p>

            <ul className="mt-6 max-w-sm space-y-2.5 border-t border-white/15 pt-6">
              {trustPoints.map((point) => (
                <li key={point} className="flex gap-3 text-[13px] leading-6 text-[#E8DDCC]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B9A58B]" strokeWidth={2.4} />
                  {point}
                </li>
              ))}
            </ul>

            <p className="mt-6 flex max-w-sm gap-2.5 text-[11px] leading-5 text-[#E8DDCC]/60">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#B9A58B]" />
              Never send identity documents, deeds, or bank statements by email. Verification is requested only through an approved provider flow.
            </p>
          </div>
        </aside>

        <section className="w-full">
          <div className="mx-auto w-full max-w-[440px] rounded-[20px] border border-[#E8DDCC] bg-white p-6 shadow-[0_20px_50px_-34px_rgba(51,45,41,0.45)] sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#397451]">
              {mfaToken ? 'Two-factor check' : forgotOpen ? 'Account recovery' : isLogin ? 'Account access' : 'New workspace'}
            </p>

            <h2 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#332D29] sm:text-[28px]">
              {mfaToken ? 'One more step' : forgotOpen ? 'Reset your password' : isLogin ? 'Welcome back' : 'Create your account'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#756B61]">
              {mfaToken
                ? 'Enter a code from your authenticator app to finish signing in.'
                : forgotOpen
                  ? 'We email a one-time link to the address on the account. Nothing changes until you use it.'
                  : isLogin
                    ? 'Sign in to pick up where you left off.'
                    : 'Takes a minute. Identity checks come later, only if you need them.'}
            </p>

            {showTabs && (
              <div className="relative mt-6 mb-6 grid grid-cols-2 rounded-2xl bg-[#F2EEE6] p-1">
              <span
                aria-hidden="true"
                className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-[0_2px_8px_rgba(51,45,41,0.08)] ring-1 ring-[#E8DDCC]/70 transition-transform duration-300 ease-out motion-reduce:transition-none ${isLogin ? 'translate-x-0' : 'translate-x-full'}`}
              />
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                aria-pressed={isLogin}
                className={`relative z-10 flex min-h-10 items-center justify-center rounded-xl px-3 text-[13px] font-semibold transition-colors ${isLogin ? 'text-[#332D29]' : 'text-[#8A7E72] hover:text-[#332D29]'}`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                aria-pressed={!isLogin}
                className={`relative z-10 flex min-h-10 items-center justify-center rounded-xl px-3 text-[13px] font-semibold transition-colors ${!isLogin ? 'text-[#332D29]' : 'text-[#8A7E72] hover:text-[#332D29]'}`}
              >
                Register
              </button>
              </div>
            )}

            {mfaToken ? (
              <form className={formClassName} onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="auth-mfa-code" className={labelClassName}>
                    Authenticator code
                  </label>
                  <input
                    id="auth-mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    value={mfaCode}
                    onChange={(event) => setMfaCode(event.target.value)}
                    placeholder="123456 or a recovery code"
                    className={fieldClassName}
                  />
                  <p className="mt-1.5 text-xs leading-5 text-[#8A7E72]">
                    Lost the app? Use one of the single-use recovery codes you saved when two-factor was switched on.
                  </p>
                </div>

                {messageBlock}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#332D29] px-5 text-sm font-semibold text-[#FAF8F3] transition-colors duration-200 hover:bg-[#397451] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#332D29] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  {isSubmitting ? 'Checking…' : 'Verify and sign in'}
                </button>

                <div className="pt-1 text-center text-[13px] text-[#756B61]">
                  <button
                    type="button"
                    onClick={() => {
                      setMfaToken(null);
                      setMfaCode('');
                      setMessage(null);
                    }}
                    className={switchLinkClassName}
                  >
                    Use a different account
                  </button>
                </div>
              </form>
            ) : forgotOpen ? (
              <form className={formClassName} onSubmit={handleResetRequest}>
                <div>
                  <label htmlFor="reset-email" className={labelClassName}>
                    Email
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className={fieldClassName}
                  />
                  <p className="mt-1.5 text-xs leading-5 text-[#8A7E72]">
                    The link expires in 60 minutes, works once, and the new password ends every other signed-in session.
                  </p>
                </div>

                {messageBlock}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#332D29] px-5 text-sm font-semibold text-[#FAF8F3] transition-colors duration-200 hover:bg-[#397451] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#332D29] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </button>

                <div className="pt-1 text-center text-[13px] text-[#756B61]">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOpen(false);
                      setMessage(null);
                    }}
                    className={`inline-flex items-center gap-1.5 ${switchLinkClassName}`}
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to sign in
                  </button>
                </div>
              </form>
            ) : (
            <form className={formClassName} onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="auth-first-name" className={labelClassName}>
                      First name
                    </label>
                    <input
                      id="auth-first-name"
                      type="text"
                      autoComplete="given-name"
                      required={!isLogin}
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="John"
                      className={fieldClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-last-name" className={labelClassName}>
                      Last name
                    </label>
                    <input
                      id="auth-last-name"
                      type="text"
                      autoComplete="family-name"
                      required={!isLogin}
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Doe"
                      className={fieldClassName}
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className={labelClassName}>
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className={fieldClassName}
                />
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="register-phone" className={labelClassName}>
                    Phone number
                  </label>
                  <div className="rounded-xl border border-[#E8DDCC] bg-white px-3.5 py-2.5 transition-colors focus-within:border-[#B9A58B] focus-within:ring-2 focus-within:ring-[#B9A58B]/25">
                    <PhoneInput
                      id="register-phone"
                      value={phone}
                      onChange={(value) => setPhone(value ?? '')}
                      defaultCountry="NG"
                      flags={flags}
                      international
                      countryCallingCodeEditable={false}
                      placeholder="Enter phone number"
                      className="w-full text-sm"
                    />
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-[#8A7E72]">
                    Phone verification stays pending until an OTP provider is connected.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="auth-password" className={labelClassName}>
                    Password
                  </label>
                  {isLogin ? (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotOpen(true);
                        setMessage(null);
                      }}
                      className="mb-1.5 text-[11px] font-semibold text-[#5E554D] underline decoration-[#B9A58B] underline-offset-2 transition-colors hover:text-[#397451]"
                    >
                      Forgot password?
                    </button>
                  ) : (
                    <span className="mb-1.5 text-[11px] text-[#8A7E72]">12+ characters</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    minLength={isLogin ? 8 : 12}
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

              {!isLogin && (
                <fieldset>
                  <legend className={labelClassName}>I am a…</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {registerRoles.map(({ value, label, hint, icon: Icon }) => {
                      const selected = role === value;

                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRole(value)}
                          aria-pressed={selected}
                          className={[
                            'flex flex-col items-start gap-1 rounded-xl border px-3.5 py-3 text-left transition-colors duration-150',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B]',
                            selected
                              ? 'border-[#B9A58B] bg-[#FAF8F3]'
                              : 'border-[#E8DDCC] bg-white hover:border-[#B9A58B]/60',
                          ].join(' ')}
                        >
                          <span className="flex items-center gap-2 text-[13px] font-semibold text-[#332D29]">
                            <Icon className={`h-4 w-4 ${selected ? 'text-[#397451]' : 'text-[#B9A58B]'}`} />
                            {label}
                          </span>
                          <span className="text-[11px] leading-4 text-[#8A7E72]">{hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {!isLogin && (
                <div className="flex gap-2.5 rounded-xl border border-[#E8DDCC] bg-[#FAF8F3] p-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#B9A58B]" />
                  <p className="text-[12px] leading-5 text-[#756B61]">
                    Signing up does not verify identity. Do not send ID images, deeds, bank statements or payslips — checks happen
                    only through an approved provider flow.
                  </p>
                </div>
              )}

              {messageBlock}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#332D29] px-5 text-sm font-semibold text-[#FAF8F3] transition-colors duration-200 hover:bg-[#397451] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#332D29] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="pt-1 text-center text-[13px] text-[#756B61]">
                {isLogin ? 'New to PropManage?' : 'Already have an account?'}{' '}
                <button type="button" onClick={() => setIsLogin(!isLogin)} className={switchLinkClassName}>
                  {isLogin ? 'Create an account' : 'Sign in instead'}
                </button>
              </div>

              <p className="text-center text-[11px] leading-5 text-[#A79B8D]">
                By continuing you agree to our{' '}
                <Link
                  to="/privacy"
                  className="underline decoration-[#E8DDCC] underline-offset-2 transition-colors hover:text-[#332D29]"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
