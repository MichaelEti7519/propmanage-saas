import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock3, CreditCard, Info, KeyRound, Mail, MapPin, MessageSquareQuote, Phone, Shield, ShieldCheck, UserRoundPlus, Users, Wrench } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../../hooks/useAuth';

type RegisterRole = 'landlord' | 'tenant';

export function Landing() {
  return (
    <div className="flex-1 pb-20 md:pb-0">
      <section className="relative isolate flex min-h-[min(690px,calc(100svh-160px))] items-center overflow-hidden bg-slate-950 px-6 py-16 text-white sm:px-10 lg:px-16">
        <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=2200&q=85" alt="Modern apartment homes with landscaped grounds" className="absolute inset-0 -z-20 h-full w-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 -z-10 bg-slate-950/65" />
        <div className="mx-auto w-full max-w-7xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-200">Property operations, made clearer</p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-6xl">Property management in one clear view.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg">Keep properties, units, tenant communication, maintenance, and payment records together in one workspace.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-200">Create your account <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/#workflows" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/60 px-6 py-3 font-semibold text-white transition hover:bg-white/10">Explore workflows</Link>
          </div>
          <p className="mt-5 text-sm text-slate-200">Questions before getting started? <Link to="/contact" className="font-semibold text-white underline underline-offset-4">Talk with us</Link></p>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 border-b border-slate-200 bg-white px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 max-w-2xl"><p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">One workspace</p><h2 className="mt-2 text-3xl font-bold text-slate-900">The everyday work, connected.</h2></div>
          <div className="grid gap-8 md:grid-cols-3">
            <article><Users className="h-7 w-7 text-emerald-800" /><h3 className="mt-4 text-lg font-bold text-slate-900">Tenant coordination</h3><p className="mt-2 text-sm leading-6 text-slate-600">Keep tenant profiles, lease details, and conversations close to the property records they relate to.</p></article>
            <article><CreditCard className="h-7 w-7 text-amber-700" /><h3 className="mt-4 text-lg font-bold text-slate-900">Payment visibility</h3><p className="mt-2 text-sm leading-6 text-slate-600">Review payment status and due dates from a shared operational view. Payment processing availability depends on configured providers.</p></article>
            <article><Wrench className="h-7 w-7 text-emerald-800" /><h3 className="mt-4 text-lg font-bold text-slate-900">Maintenance follow-through</h3><p className="mt-2 text-sm leading-6 text-slate-600">Track requests from submission through resolution, with updates visible to the people involved.</p></article>
          </div>
        </div>
      </section>

      <section id="workflows" className="scroll-mt-24 bg-slate-50 px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold uppercase tracking-wider text-emerald-800">Illustrative workflows</p><h2 className="mt-2 text-3xl font-bold text-slate-900">A clearer path through the busywork.</h2></div><p className="max-w-md text-sm text-slate-600">These are example scenarios, not customer results or measured case studies.</p></div>
          <div className="grid gap-6 md:grid-cols-3">
            <article className="border-t-4 border-emerald-700 bg-white p-5"><p className="text-xs font-semibold uppercase text-emerald-800">Example 01 · Leasing</p><h3 className="mt-3 text-lg font-bold text-slate-900">From vacancy to move-in</h3><p className="mt-2 text-sm leading-6 text-slate-600">Create a unit, invite a tenant, and keep lease and occupancy information in the same property workspace.</p></article>
            <article className="border-t-4 border-amber-500 bg-white p-5"><p className="text-xs font-semibold uppercase text-amber-700">Example 02 · Maintenance</p><h3 className="mt-3 text-lg font-bold text-slate-900">From request to resolution</h3><p className="mt-2 text-sm leading-6 text-slate-600">Capture a repair request, assign its status, and keep the conversation attached to the issue.</p></article>
            <article className="border-t-4 border-emerald-600 bg-white p-5"><p className="text-xs font-semibold uppercase text-emerald-700">Example 03 · Portfolio review</p><h3 className="mt-3 text-lg font-bold text-slate-900">From scattered records to a review</h3><p className="mt-2 text-sm leading-6 text-slate-600">Bring property, unit, tenant, and payment records together for a more consistent operating routine.</p></article>
          </div>
        </div>
      </section>

      <section id="reviews" className="scroll-mt-24 border-y border-slate-200 bg-white px-6 py-14 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4"><MessageSquareQuote className="mt-1 h-7 w-7 shrink-0 text-emerald-800" /><div><h2 className="text-2xl font-bold text-slate-900">Verified customer reviews</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">We are not publishing customer quotes until we can verify them and get permission. We will add first-hand feedback here as customers approve it.</p></div></div>
          <Link to="/contact" className="inline-flex shrink-0 items-center gap-2 font-semibold text-emerald-800 hover:text-emerald-950">Share feedback <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-12 text-white sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><Clock3 className="mt-1 h-6 w-6 shrink-0 text-cyan-300" /><div><h2 className="text-xl font-bold">A clear response-time commitment</h2><p className="mt-1 text-sm text-slate-300">We aim to respond to contact requests within one business day, Monday through Friday.</p></div></div><Link to="/contact" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 py-2.5 font-semibold text-slate-900 hover:bg-slate-100">Contact support</Link></div>
      </section>

      <section id="faq" className="scroll-mt-24 bg-white px-6 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl"><p className="text-sm font-semibold uppercase tracking-wider text-emerald-800">FAQ</p><h2 className="mt-2 text-3xl font-bold text-slate-900">Useful answers, upfront.</h2>
          <div className="mt-7 divide-y divide-slate-200 border-y border-slate-200">
            <details className="py-5"><summary className="cursor-pointer font-semibold text-slate-900">Who is PropManage for?</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Landlords and property managers can organize properties, units, tenants, payments, maintenance, and communication. Tenants have a separate portal for their rental tasks.</p></details>
            <details className="py-5"><summary className="cursor-pointer font-semibold text-slate-900">Can tenants join without creating an account first?</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">A landlord can create an invitation for a tenant. The tenant follows the private invitation link to complete onboarding.</p></details>
            <details className="py-5"><summary className="cursor-pointer font-semibold text-slate-900">Does PropManage process rent payments?</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">The platform records payment information. Online payment processing depends on an active payment-provider integration and account configuration.</p></details>
            <details className="py-5"><summary className="cursor-pointer font-semibold text-slate-900">How is personal information handled?</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">We collect information needed to operate accounts and rental workflows. See the <Link to="/privacy" className="font-semibold text-emerald-800 underline">Privacy Policy</Link> for details and contact us with privacy questions.</p></details>
            <details className="py-5"><summary className="cursor-pointer font-semibold text-slate-900">How quickly will support reply?</summary><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">We aim to respond within one business day, Monday through Friday. Urgent safety or emergency issues should be directed to local emergency services.</p></details>
          </div>
          <p className="mt-6 text-sm text-slate-600">Still have a question? <Link to="/contact" className="font-semibold text-emerald-800 underline">Contact us</Link> or see <Link to="/pricing" className="font-semibold text-emerald-800 underline">pricing</Link>.</p>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-cyan-50 px-6 py-12 text-center sm:px-10">
        <div className="mx-auto max-w-3xl"><h2 className="text-2xl font-bold text-slate-900">Bring your property work into one place.</h2><p className="mt-2 text-sm text-slate-600">Set up an account and see how the workflows fit your portfolio.</p><Link to="/login" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-800">Get started <ArrowRight className="h-4 w-4" /></Link></div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <Link to="/login" className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white">Get started <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}

export function Pricing() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
      <div className="max-w-3xl"><p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Pricing</p><h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Pilot access and pricing</h1><p className="mt-4 text-lg leading-7 text-slate-600">Plans and payment-provider availability are being finalized. Tell us about your portfolio and we will confirm current access, included workflows, and pricing before you commit.</p><Link to="/contact" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-indigo-700 px-6 py-3 font-semibold text-white hover:bg-indigo-800">Ask about pricing <ArrowRight className="h-4 w-4" /></Link><p className="mt-4 text-sm text-slate-500">We aim to respond within one business day, Monday through Friday.</p></div>
      <div className="mt-12 grid gap-6 border-t border-slate-200 pt-8 md:grid-cols-3">
        <article><h2 className="font-bold text-slate-900">Property owners</h2><p className="mt-2 text-sm leading-6 text-slate-600">Discuss property and unit records, tenant invitations, and maintenance coordination.</p></article>
        <article><h2 className="font-bold text-slate-900">Growing teams</h2><p className="mt-2 text-sm leading-6 text-slate-600">Review role access, portfolio workflows, and reporting needs with us.</p></article>
        <article><h2 className="font-bold text-slate-900">Platform setup</h2><p className="mt-2 text-sm leading-6 text-slate-600">Payment, screening, and verification integrations depend on provider onboarding and availability.</p></article>
      </div>
    </div>
  );
}

export function About() {
  return (
    <div className="py-16 sm:py-24 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Built by property managers, for property managers</h2>
        <p className="text-lg text-slate-600">PropManage brings property operations into one shared workspace, with clear roles for landlords, tenants, and platform administrators.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12 mt-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Trust & Security</h3>
          <p className="text-slate-600 leading-relaxed">Access is organized by account role. Identity and property verification are not yet active; do not upload sensitive documents until a secure provider flow is available.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Clock3 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Efficiency First</h3>
          <p className="text-slate-600 leading-relaxed">Property, unit, tenant, maintenance, and payment records are organized together to support a more consistent operating routine.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Better Tenant Experience</h3>
          <p className="text-slate-600 leading-relaxed">Tenants can use a dedicated workspace for rental records, maintenance requests, and communication with their property manager.</p>
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState<string>('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('Sales & Pricing');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, reason, message }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data?.error || 'Unable to send your message.');
      navigate('/thank-you', { state: { source: 'contact' } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to send your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-16 sm:py-24 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Get in Touch</h2>
          <p className="text-lg text-slate-600">Have questions about our platform or pricing? We're here to help.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Contact Info */}
            <div className="bg-slate-50 p-8 sm:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Contact Information</h3>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-2.5 rounded-lg border border-slate-200 text-indigo-600 shadow-sm shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Email Us</h4>
                    <p className="text-slate-600 mt-1 mb-2 text-sm">For support and general queries.</p>
                    <a href="mailto:michealeti2006@gmail.com" className="text-indigo-600 font-medium hover:text-indigo-700">michealeti2006@gmail.com</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-2.5 rounded-lg border border-slate-200 text-indigo-600 shadow-sm shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Call Us</h4>
                    <p className="text-slate-600 mt-1 mb-2 text-sm">Mon-Fri from 8am to 5pm.</p>
                    <a href="tel:+2348117964140" className="text-indigo-600 font-medium hover:text-indigo-700">+234 (811) 796 4140</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-2.5 rounded-lg border border-slate-200 text-indigo-600 shadow-sm shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Office</h4>
                    <p className="text-slate-600 mt-1 text-sm leading-relaxed">
                      100 Property Lane<br/>
                      Suite 300<br/>
                      Calabar, CRS Nigeria
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="p-8 sm:p-12 lg:p-16">
              <form className="space-y-6" onSubmit={submitContact}>
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input id="contact-name" required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} type="text" placeholder="Jane Doe" className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm" />
                </div>
                
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <input id="contact-email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="jane@example.com" className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="contact-phone">Phone Number</label>
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                    <PhoneInput
                      id="contact-phone"
                      name="phone"
                      defaultCountry="NG"
                      international
                      countryCallingCodeEditable={false}
                      value={phone}
                      onChange={(value) => setPhone(value ?? '')}
                      placeholder="Enter phone number"
                      className="w-full text-sm"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">Choose your country to use the correct dialing code.</p>
                </div>

                <div>
                  <label htmlFor="contact-reason" className="block text-sm font-medium text-slate-700 mb-2">Reason for Inquiry</label>
                  <select id="contact-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm text-slate-600">
                    <option>Sales & Pricing</option>
                    <option>Technical Support</option>
                    <option>Partnership inquiry</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <textarea id="contact-message" required maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="How can we help you?" className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm resize-none"></textarea>
                </div>

                <p className="text-sm text-slate-500">We aim to reply within one business day, Monday through Friday.</p>
                {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 transition-colors shadow-sm">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center bg-slate-50 px-6 py-16">
      <div className="mx-auto w-full max-w-6xl border-l-4 border-indigo-600 bg-white px-6 py-10 sm:px-12 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Page not found</p>
        <h1 className="mt-3 text-6xl font-bold text-slate-900">404</h1>
        <p className="mt-4 max-w-xl text-lg leading-7 text-slate-600">This address doesn&apos;t point to a page. Head back to the homepage or choose a useful place to continue.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-700 px-5 py-2.5 font-semibold text-white hover:bg-indigo-800">Homepage <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/pricing" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">Pricing</Link>
          <Link to="/contact" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">Contact</Link>
        </div>
      </div>
    </div>
  );
}

export function ThankYou() {
  const location = useLocation();
  if (location.state?.source !== 'contact') return <Navigate to="/contact" replace />;

  return (
    <section className="flex min-h-[65vh] items-center bg-emerald-50 px-6 py-16">
      <div className="mx-auto w-full max-w-3xl border-t-4 border-emerald-600 bg-white p-7 shadow-sm sm:p-10">
        <CheckCircle2 className="h-10 w-10 text-emerald-700" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-emerald-800">Message received</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Thank you for getting in touch.</h1>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">Your inquiry has been recorded. We aim to respond within one business day, Monday through Friday.</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link to="/" className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">Back to homepage</Link><Link to="/pricing" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Review pricing</Link></div>
      </div>
    </section>
  );
}

export function PrivacyPolicy() {
  return (
    <article className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Privacy</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: October 8, 2026</p>
      <p className="mt-6 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-900">This notice describes the information PropManage processes in the current service. Contact us with privacy requests or questions using the details on our <Link to="/contact" className="font-semibold underline">contact page</Link>.</p>
      <div className="mt-9 space-y-8 text-sm leading-7 text-slate-700">
        <section><h2 className="text-xl font-bold text-slate-900">Information we process</h2><p className="mt-2">Depending on how you use the service, this may include account and contact details, role and sign-in information, property and unit records, tenant and lease details, payment records, maintenance requests, messages, documents, invitations, and reports submitted for review. Do not submit full identity-document numbers or sensitive personal information unless the service specifically requests it.</p></section>
        <section><h2 className="text-xl font-bold text-slate-900">Identity and property verification</h2><p className="mt-2">Verification statuses may be recorded separately from supporting documents. PropManage does not currently provide an upload flow for government IDs, deeds, bank statements, payslips, or other verification documents. Do not email or upload these materials. If a verified provider flow is introduced, we will explain what is collected, who verifies it, retention, and access before requesting consent.</p></section>
        <section><h2 className="text-xl font-bold text-slate-900">How information is used</h2><p className="mt-2">We use information to create and secure accounts, provide property-management workflows, route tenant invitations, display records to the appropriate account roles, respond to support requests, investigate reports, prevent misuse, and comply with applicable obligations.</p></section>
        <section><h2 className="text-xl font-bold text-slate-900">Who may receive information</h2><p className="mt-2">Information is available to the account holder and authorized people involved in the related rental workflow. We may use infrastructure and service providers needed to operate the product. We do not claim that payment processing, tenant screening, or third-party integrations are active unless they are configured and disclosed for your account.</p></section>
        <section><h2 className="text-xl font-bold text-slate-900">Security and retention</h2><p className="mt-2">We use access controls and technical safeguards intended to protect account information. No internet service can guarantee absolute security. Information is retained while needed to provide the service, address disputes, meet legal requirements, or protect the platform, then deleted or de-identified where practical.</p></section>
        <section><h2 className="text-xl font-bold text-slate-900">Your choices and requests</h2><p className="mt-2">You can request access, correction, or deletion of personal information, subject to legal and operational requirements. Some information may need to remain available for active leases, disputes, security, or compliance. Contact us through the <Link to="/contact" className="font-semibold text-indigo-700 underline">contact form</Link> to make a request.</p></section>
        <section><h2 className="text-xl font-bold text-slate-900">Legal requests and disputes</h2><p className="mt-2">We do not disclose a person&apos;s hidden identity or private verification data directly to another user. Where disclosure is legally required or authorized, requests are reviewed and information is provided to the appropriate law-enforcement authority or court through lawful process, with access limited to what is required.</p></section>
        <section><h2 className="text-xl font-bold text-slate-900">Changes and questions</h2><p className="mt-2">We may update this notice as the service changes. The updated date above indicates the latest revision. Privacy rules differ by location; this page does not replace jurisdiction-specific legal advice.</p></section>
      </div>
    </article>
  );
}

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
    <div className="min-h-[calc(100svh-152px)] bg-[#f2f3ed]">
      <div className="mx-auto grid min-h-[calc(100svh-152px)] max-w-360 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.92fr)]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#193b2f] px-10 py-12 text-white lg:flex xl:px-16 xl:py-16">
          <div className="absolute inset-0 opacity-20" aria-hidden="true" style={{ backgroundImage: 'linear-gradient(135deg, transparent 0 49.7%, rgba(255,255,255,.18) 50%, transparent 50.3%), linear-gradient(45deg, transparent 0 49.7%, rgba(255,255,255,.12) 50%, transparent 50.3%)', backgroundSize: '52px 52px' }} />
          <div className="relative">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90"><Building2 className="h-5 w-5 text-[#d7b36a]" /> PropManage</Link>
            <p className="mt-20 text-xs font-semibold uppercase tracking-[0.14em] text-[#d7b36a]">Property operations</p>
            <h2 className="mt-4 max-w-lg text-4xl font-bold leading-tight xl:text-5xl">A steadier way to manage the work behind every home.</h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#e2e9e1]">Bring property records, tenants, payments, and maintenance into one clear workspace.</p>
            <div className="mt-10 space-y-4 text-sm text-[#e2e9e1]">
              <div className="flex items-center gap-3"><Users className="h-4 w-4 text-[#d7b36a]" /> Separate workspaces for landlords and tenants</div>
              <div className="flex items-center gap-3"><Wrench className="h-4 w-4 text-[#d7b36a]" /> Maintenance and property records together</div>
              <div className="flex items-center gap-3"><Shield className="h-4 w-4 text-[#d7b36a]" /> Verification stays pending until actually checked</div>
            </div>
          </div>
          <p className="relative max-w-md text-xs leading-5 text-[#c6d2c7]">Never send identity documents, deeds, or bank statements by email. Secure verification will be requested only through an approved provider flow.</p>
        </aside>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md rounded-xl border border-[#dce2d8] bg-white p-6 shadow-[0_14px_38px_rgba(24,49,37,0.08)] sm:p-8">
        <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#294e3a] lg:hidden"><Building2 className="h-5 w-5 text-[#b18437]" /> PropManage</Link>
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#52745b]">{isLogin ? 'Account access' : 'Join your workspace'}</p>
        <h2 className="mb-6 text-center text-2xl font-bold text-[#1f2c23]">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        <div className="relative mb-6 grid grid-cols-2 rounded-lg bg-[#edf0e9] p-1">
          <span
            aria-hidden="true"
            className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-md bg-white shadow-[0_1px_4px_rgba(25,59,47,0.13)] transition-transform duration-300 ease-out motion-reduce:transition-none ${isLogin ? 'translate-x-0' : 'translate-x-full'}`}
          />
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            aria-pressed={isLogin}
            className={`relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${isLogin ? 'text-[#193b2f]' : 'text-slate-600 hover:text-[#193b2f]'}`}
          >
            <KeyRound className="h-4 w-4" /> Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            aria-pressed={!isLogin}
            className={`relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${!isLogin ? 'text-[#193b2f]' : 'text-slate-600 hover:text-[#193b2f]'}`}
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#54765b] focus:outline-none focus:ring-2 focus:ring-[#54765b]/15"
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#54765b] focus:outline-none focus:ring-2 focus:ring-[#54765b]/15"
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#54765b] focus:outline-none focus:ring-2 focus:ring-[#54765b]/15"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="register-phone">Phone Number</label>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors focus-within:border-[#54765b] focus-within:ring-2 focus-within:ring-[#54765b]/15">
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
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 focus:border-[#54765b] focus:outline-none focus:ring-2 focus:ring-[#54765b]/15"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">I am a...</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as RegisterRole)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#54765b] focus:outline-none focus:ring-2 focus:ring-[#54765b]/15"
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
            className="w-full rounded-lg bg-[#24513d] px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-[#193b2f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (isLogin ? 'Logging in…' : 'Creating account…') : isLogin ? 'Log In' : 'Create Account'}
          </button>

          <div className="text-sm text-slate-500 text-center">
            {isLogin ? (
              <button type="button" onClick={() => setIsLogin(false)} className="font-semibold text-[#315b42] underline decoration-[#9bb39a] underline-offset-4 hover:text-[#193b2f]">
                Create a new account
              </button>
            ) : (
              <button type="button" onClick={() => setIsLogin(true)} className="font-semibold text-[#315b42] underline decoration-[#9bb39a] underline-offset-4 hover:text-[#193b2f]">
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
