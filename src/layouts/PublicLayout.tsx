import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Building, Menu, X } from 'lucide-react';
import { motion } from 'motion/react';

export function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col relative">
      <header className="h-20 border-b border-slate-100 flex items-center justify-between px-6 lg:px-12 bg-white sticky top-0 z-50">
        <Link to="/" className="flex items-center z-50">
          <Building className="w-8 h-8 text-indigo-600 mr-2" />
          <h1 className="font-extrabold text-xl tracking-tight text-slate-900">PropManage</h1>
        </Link>
        <div className="hidden md:flex items-center gap-2">
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path} 
              className="relative px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {location.pathname === link.path && (
                <motion.div
                  layoutId="publicNavIndicator"
                  className="absolute inset-0 bg-slate-100 rounded-lg -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10">{link.name}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4 z-50">
          <Link to="/login" className="hidden md:inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-700">Log in</Link>
          <Link to="/login" className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm">
            Get Started
          </Link>
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-20 bg-white z-40 md:hidden flex flex-col items-center justify-start pt-8 pb-6 px-6 gap-6 border-b border-slate-100 shadow-xl overflow-y-auto">
          <Link to="/" className="text-lg font-medium text-slate-900">Home</Link>
          <Link to="/about" className="text-lg font-medium text-slate-900">About</Link>
          <Link to="/contact" className="text-lg font-medium text-slate-900">Contact</Link>
          <div className="w-full h-px bg-slate-100 my-2"></div>
          <Link to="/login" className="text-lg font-medium text-indigo-600">Log in</Link>
          <Link to="/login" className="w-full py-3 bg-indigo-600 flex justify-center text-white rounded-lg text-lg font-medium mt-2">
            Get Started
          </Link>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <footer className="bg-slate-900 text-slate-300 py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Building className="w-6 h-6 text-indigo-500 mr-2" />
            <span className="font-bold text-white text-lg">PropManage</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 PropManage SaaS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
