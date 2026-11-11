import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Info, KeyRound, Shield, UserRoundPlus, Users, Wrench } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../../hooks/useAuth';

type RegisterRole = 'landlord' | 'tenant';

export function LoginRegister() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = React.useState(true);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState<string>('');
  const [role, setRole] = React.useState<RegisterRole>('landlord');
  const [message, setMessage] = React.useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    setMessage(null);
  }, [isLogin]);

  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage({ type: 'error', text: data?.error || 'Unable to complete authentication.' });
        return;
      }

      login(data.user, data.token);
      const redirectPath = data.user.role === 'tenant' ? '/tenant' : data.user.role === 'landlord' ? '/landlord' : '/admin';
      navigate(redirectPath);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Network error while authenticating.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100svh-152px)] bg-[#FAF8F3]">
      <div className="mx-auto grid min-h-[calc(100svh-152px)] max-w-360 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.92fr)]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#332D29] px-10 py-12 text-white lg:flex xl:px-16 xl:py-16">
          <div className="absolute inset-0 opacity-20" aria-hidden="true" style={{ backgroundImage: 'linear-gradient(135deg, transparent 0 49.7%, rgba(255,255,255,.18) 50%, transparent 50.3%), linear-gradient(45deg, transparent 0 49.7%, rgba(255,255,255,.12) 50%, transparent 50.3%)', backgroundSize: '52px 52px' }} />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90"><Building2 className="h-5 w-5 text-[#B9A58B]" /> PropManage</Link>
            <p className="mt-20 text-xs font-semibold uppercase tracking-[0.14em] text-[#B9A58B]">Property operations</p>
            <h2 className="mt-4 max-w-lg text-4xl font-bold leading-tight xl:text-5xl">A steadier way to manage the work behind every home.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#e2e9e1]">Bring property records, tenants, payments, and maintenance into one clear workspace.</p>
            <div className="mt-10 space-y-4 text-sm text-[#e2e9e1]">
              <div className="flex items-center gap-3"><Users className="h-4 w-4 text-[#B9A58B]" /> Separate workspaces for landlords and tenants</div>
              <div className="flex items-center gap-3"><Wrench className="h-4 w-4 text-[#B9A58B]" /> Maintenance and property records together</div>
              <div className="flex items-center gap-3"><Shield className="h-4 w-4 text-[#B9A58B]" /> Verification stays pending until actually checked</div>
            </div>
          </div>
          <p className="relative max-w-md text-xs leading-5 text-[#E8DDCC]">Never send identity documents, deeds, or bank statements by email. Secure verification will be requested only through an approved provider flow.</p>
        </aside>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md rounded-xl border border-[#E8DDCC] bg-white p-6 shadow-[0_4px_20px_rgba(51,45,41,0.04)] sm:p-8">
            <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#332D29] lg:hidden"><Building2 className="h-5 w-5 text-[#B9A58B]" /> PropManage</Link>
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#756B61]">{isLogin ? 'Account access' : 'Join your workspace'}</p>
            <h2 className="mb-6 text-center text-2xl font-bold text-[#332D29]">
              {isLogin ? 'Welcome Back' : 'Create an Account'}
            </h2>

            <div className="relative mb-6 grid grid-cols-2 rounded-lg bg-[#E8DDCC] p-1">
              <span
                aria-hidden="true"
                className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-white shadow-[0_1px_4px_rgba(51,45,41,0.12)] transition-transform duration-300 ease-out motion-reduce:transition-none ${isLogin ? 'translate-x-0' : 'translate-x-full'}`}
              />
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                aria-pressed={isLogin}
                className={`relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isLogin ? 'text-[#332D29]' : 'text-slate-600 hover:text-[#332D29]'}`}
              >
                <KeyRound className="h-4 w-4" /> Login
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                aria-pressed={!isLogin}
                className={`relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${!isLogin ? 'text-[#332D29]' : 'text-slate-600 hover:text-[#332D29]'}`}
              >
                <UserRoundPlus className="h-4 w-4" /> Register
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">First Name</label>
                    <input
                      type="text"
                      autoComplete="given-name"
                      required={!isLogin}
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="John"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Last Name</label>
                    <input
                      type="text"
                      autoComplete="family-name"
                      required={!isLogin}
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Doe"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="register-phone">Phone Number</label>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors focus-within:border-[#B9A58B] focus-within:ring-2 focus-within:ring-[#B9A58B]/20">
                    <PhoneInput
                      id="register-phone"
                      value={phone}
                      onChange={(value) => setPhone(value ?? '')}
                      defaultCountry="NG"
                      international
                      countryCallingCodeEditable={false}
                      placeholder="Enter phone number"
                      className="w-full text-sm"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">Phone verification remains pending until an OTP provider is connected.</p>
                </div>
              )}

              {!isLogin && (
                <div className="flex items-start gap-2 border-l-4 border-[#c79a4b] bg-[#fbf8ef] px-3 py-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#8d692b]" />
                  <p className="text-xs leading-5 text-[#574a32]">Signup does not verify identity. Do not send ID images, deeds, bank statements, or payslips; secure checks will be requested only through an approved provider flow.</p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">I am a...</label>
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value as RegisterRole)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#B9A58B] focus:outline-none focus:ring-2 focus:ring-[#B9A58B]/20"
                  >
                    <option value="landlord">Landlord / Property Manager</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </div>
              )}

              {message && (
                <div role={message.type === 'error' ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-[#332D29] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#4A4039] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (isLogin ? 'Logging in…' : 'Creating account…') : isLogin ? 'Log In' : 'Create Account'}
              </button>

              <div className="text-sm text-slate-500 text-center">
                {isLogin ? (
                  <button type="button" onClick={() => setIsLogin(false)} className="font-semibold text-[#332D29] underline decoration-[#B9A58B] underline-offset-4 hover:text-[#4A4039]">
                    Create a new account
                  </button>
                ) : (
                  <button type="button" onClick={() => setIsLogin(true)} className="font-semibold text-[#332D29] underline decoration-[#B9A58B] underline-offset-4 hover:text-[#4A4039]">
                    Already have an account? Log in
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
