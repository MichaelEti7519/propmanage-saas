import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowRight, CheckCircle2, Shield, Users, Zap, Mail, Phone, MapPin } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../../hooks/useAuth';

type RegisterRole = 'landlord' | 'tenant';

export function Landing() {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8 py-20 sm:py-32 flex flex-col items-center text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-50 via-white to-white"></div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 max-w-4xl">
          Manage Properties <br className="hidden sm:block"/>
          <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-cyan-500">
            Without the Hassle
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mb-10 leading-relaxed">
          The modern Landlord Management System designed for scale. Handle tenants, units, maintenance, and payments in one unified platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 sm:px-0">
          <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition-all flex justify-center items-center text-lg">
            Start Free Trial
          </Link>
          <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition-all shadow-sm flex justify-center items-center text-lg">
            View Live Demo
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Everything you need to run your portfolio</h2>
            <p className="text-lg text-slate-600">Ditch the spreadsheets and legacy software. PropManage gives you modern tools to save time and increase your NOI.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Tenant Screening</h3>
              <p className="text-slate-600 leading-relaxed">Run comprehensive background, credit, and eviction checks in seconds. Integrated directly with TransUnion.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Automated Rent</h3>
              <p className="text-slate-600 leading-relaxed">Stop chasing checks. Tenants can pay via ACH or credit card. Late fees and reminders are handled automatically.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Maintenance Tracking</h3>
              <p className="text-slate-600 leading-relaxed">Tenants submit requests with photos. You assign vendors, track progress, and pay invoices all in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto bg-indigo-600 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative p-12 sm:p-20 text-center">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">Ready to streamline your property management?</h2>
            <p className="text-indigo-100 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
              Join thousands of landlords who have ditched the spreadsheets and modernized their portfolios.
            </p>
            <Link to="/login" className="inline-block px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg">
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function Pricing() {
  return (
    <div className="py-16 sm:py-24 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Pricing that scales with you</h2>
        <p className="text-lg text-slate-600">Simple, transparent pricing for portfolios of all sizes. No hidden fees.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Starter Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col relative">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Starter</h3>
          <p className="text-slate-500 text-sm h-10 mb-6">Perfect for small landlords just getting started.</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-slate-900">$29</span>
            <span className="text-slate-500">/mo</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-slate-700 text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Up to 10 units</li>
            <li className="flex gap-3 text-slate-700 text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Basic tenant screening</li>
            <li className="flex gap-3 text-slate-700 text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Online rent collection</li>
            <li className="flex gap-3 text-slate-700 text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Standard support</li>
          </ul>
          <Link to="/login" className="w-full py-2.5 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold text-center transition-colors">Start Free Trial</Link>
        </div>

        {/* Pro Plan */}
        <div className="bg-indigo-600 rounded-2xl border border-indigo-600 shadow-xl p-8 flex flex-col relative transform md:-translate-y-4">
          <div className="absolute top-0 right-6 transform -translate-y-1/2">
            <span className="bg-linear-to-r from-indigo-400 to-cyan-400 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-full self-start">Most Popular</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Professional</h3>
          <p className="text-indigo-100 text-sm h-10 mb-6">Everything you need for a growing portfolio.</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-white">$79</span>
            <span className="text-indigo-100">/mo</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-white text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" /> Up to 50 units</li>
            <li className="flex gap-3 text-white text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" /> Advanced tenant screening</li>
            <li className="flex gap-3 text-white text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" /> Maintenance tracking</li>
            <li className="flex gap-3 text-white text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" /> Financial reporting</li>
            <li className="flex gap-3 text-white text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-300 shrink-0" /> Priority 24/7 support</li>
          </ul>
          <Link to="/login" className="w-full py-2.5 px-4 bg-white text-indigo-600 hover:bg-slate-50 rounded-lg text-sm font-semibold text-center transition-colors shadow-sm">Get Started</Link>
        </div>

        {/* Enterprise Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col relative">
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Enterprise</h3>
          <p className="text-slate-500 text-sm h-10 mb-6">Advanced features for large property management companies.</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-slate-900">$199</span>
            <span className="text-slate-500">/mo</span>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex gap-3 text-slate-700 text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Unlimited units</li>
            <li className="flex gap-3 text-slate-700 text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Multi-user access & roles</li>
            <li className="flex gap-3 text-slate-700 text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Document management</li>
            <li className="flex gap-3 text-slate-700 text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Custom integrations</li>
            <li className="flex gap-3 text-slate-700 text-sm"><CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" /> Dedicated account manager</li>
          </ul>
          <Link to="/contact" className="w-full py-2.5 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold text-center transition-colors">Contact Sales</Link>
        </div>
      </div>
    </div>
  );
}

export function About() {
  return (
    <div className="py-16 sm:py-24 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Built by property managers, for property managers</h2>
        <p className="text-lg text-slate-600">We experienced the pain of disjointed systems, unreturned calls, and lost documents. So we built the solution we wished we had.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12 mt-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Trust & Security</h3>
          <p className="text-slate-600 leading-relaxed">Your data is bank-grade encrypted. We handle sensitive tenant information and financial transactions with the highest industry standards.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Zap className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Efficiency First</h3>
          <p className="text-slate-600 leading-relaxed">We automate the repetitive tasks—rent reminders, maintenance routing, and background checks—so you can focus on growing your portfolio.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-600">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Better Tenant Experience</h3>
          <p className="text-slate-600 leading-relaxed">Happy tenants stay longer. We provide a seamless portal for them to pay rent, submit requests, and communicate with you effortlessly.</p>
        </div>
      </div>
    </div>
  );
}

export function Contact() {
  const [phone, setPhone] = useState<string>('');

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
                    <a href="mailto:support@propmanage.saas" className="text-indigo-600 font-medium hover:text-indigo-700">michealeti2006@gmail.com</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="mt-1 bg-white p-2.5 rounded-lg border border-slate-200 text-indigo-600 shadow-sm shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Call Us</h4>
                    <p className="text-slate-600 mt-1 mb-2 text-sm">Mon-Fri from 8am to 5pm.</p>
                    <a href="tel:+15551234567" className="text-indigo-600 font-medium hover:text-indigo-700">+234 (811) 796 4140</a>
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
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                  <input type="text" placeholder="Jane Doe" className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                  <input type="email" placeholder="jane@example.com" className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm" />
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
                      onChange={setPhone}
                      placeholder="Enter phone number"
                      className="w-full text-sm"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">Choose your country to use the correct dialing code.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Inquiry</label>
                  <select className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm text-slate-600">
                    <option>Sales & Pricing</option>
                    <option>Technical Support</option>
                    <option>Partnership inquiry</option>
                    <option>Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                  <textarea rows={4} placeholder="How can we help you?" className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors shadow-sm resize-none"></textarea>
                </div>
                
                <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-sm">
                  Send Message
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6 py-24">
      <div className="max-w-3xl w-full bg-white border border-slate-200 rounded-3xl shadow-xl p-10 text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4">404</h1>
        <p className="text-lg text-slate-600 mb-6">We couldn&apos;t find the page you were looking for. It may have moved, or the URL may be incorrect.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Return Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LoginRegister() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = React.useState(true);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('admin@propmanage.saas');
  const [password, setPassword] = React.useState('password');
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
      : { firstName, lastName, email, password, role, phone };

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
    <div className="min-h-[calc(100vh-80px)] py-12 flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        <div className="flex mb-6 p-1 bg-slate-100 rounded-lg relative">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`relative flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {isLogin && (
              <motion.div
                layoutId="auth-tab-bg"
                className="absolute inset-0 bg-white rounded-md shadow-sm"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">Login</span>
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`relative flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {!isLogin && (
              <motion.div
                layoutId="auth-tab-bg"
                className="absolute inset-0 bg-white rounded-md shadow-sm"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10">Register</span>
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="John"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="register-phone">Phone Number</label>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm transition-colors focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <PhoneInput
                  id="register-phone"
                  value={phone}
                  onChange={setPhone}
                  defaultCountry="NG"
                  international
                  countryCallingCodeEditable={false}
                  placeholder="Enter phone number"
                  className="w-full text-sm"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">Choose your country to use the correct dialing code.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as RegisterRole)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              >
                <option value="landlord">Landlord / Property Manager</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>
          )}

          {message && (
            <div className={`rounded-lg px-4 py-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-indigo-600 text-white text-center rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
          >
            {isSubmitting ? (isLogin ? 'Logging in…' : 'Creating account…') : isLogin ? 'Log In' : 'Create Account'}
          </button>

          <div className="text-sm text-slate-500 text-center">
            {isLogin ? (
              <button type="button" onClick={() => setIsLogin(false)} className="font-medium text-indigo-600 hover:text-indigo-700">
                Create a new account
              </button>
            ) : (
              <button type="button" onClick={() => setIsLogin(true)} className="font-medium text-indigo-600 hover:text-indigo-700">
                Already have an account? Log in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
