import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Building2, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';

export function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  React.useEffect(() => {
    const sectionId = location.hash.slice(1);
    if (!sectionId) return;
    window.requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' }));
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'Workflows', path: '/#workflows' },
    { name: 'FAQ', path: '/#faq' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col relative">
      <header className="h-20 border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 bg-white sticky top-0 z-50">
          <Link to="/" className="flex items-center z-50">
          <Building2 className="mr-2 h-8 w-8 text-[#315b42]" />
          <h1 className="font-extrabold text-xl tracking-tight text-slate-900">PropManage</h1>
        </Link>
        <div className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className="relative px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {location.pathname === link.path && (
                <motion.div
                  layoutId="publicNavIndicator"
                  className="absolute inset-0 -z-10 rounded-lg bg-[#edf0e9]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link.name}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4 z-50">
          <Link to="/login" className="hidden text-sm font-semibold text-[#315b42] hover:text-[#193b2f] xl:inline-flex">Log in</Link>
          <Link to="/login" className="hidden items-center justify-center rounded-lg bg-[#24513d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193b2f] sm:inline-flex">
            Get Started
          </Link>
          <button 
            className="xl:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-20 bg-white z-40 xl:hidden flex flex-col items-center justify-start pt-8 pb-6 px-6 gap-5 border-b border-slate-100 shadow-xl overflow-y-auto">
          {navLinks.map((link) => <Link key={link.name} to={link.path} className="text-lg font-medium text-slate-900">{link.name}</Link>)}
          <div className="w-full h-px bg-slate-100 my-2"></div>
          <Link to="/login" className="text-lg font-semibold text-[#315b42]">Log in</Link>
          <Link to="/login" className="mt-2 flex w-full justify-center rounded-lg bg-[#24513d] py-3 text-lg font-semibold text-white">
            Get Started
          </Link>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-300 px-6 py-9 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center"><Building2 className="mr-2 h-6 w-6 text-[#d7b36a]" /><span className="text-lg font-bold text-white">PropManage</span></Link>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
            <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
          </nav>
          <p className="text-sm text-slate-400">© 2026 PropManage. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
