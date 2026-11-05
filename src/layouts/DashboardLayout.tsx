import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Building, Bell, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  userRole: string;
  userName: string;
  userEmail: string;
}

export function DashboardLayout({ children, navItems, userRole, userName, userEmail }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navigate = useNavigate();
  const { logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  type Notification = {
    id: string;
    title: string;
    body?: string;
    time?: string;
    read?: boolean;
  };

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 'n1', title: 'Maintenance request updated', body: 'HVAC issue in Apt 1A moved to in_progress.', time: '2h', read: false },
    { id: 'n2', title: 'New tenant application', body: 'Sarah S. submitted an application for Apt 2B.', time: '1d', read: false },
    { id: 'n3', title: 'Payment received', body: 'Payment from John Doe for $2,400 was processed.', time: '3d', read: true },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function toggleNotifications() {
    setNotificationsOpen((s) => !s);
  }

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-200">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 dark:bg-slate-950 flex-shrink-0 flex flex-col text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link to="/" className="flex items-center">
            <Building className="w-6 h-6 text-indigo-500 mr-2" />
            <h1 className="font-bold text-white text-lg tracking-tight">PropManage</h1>
          </Link>
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-4 relative">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (location.pathname.startsWith(item.path) && item.path !== `/${userRole}` && item.path !== '/admin' && item.path !== '/tenant' && item.path !== '/landlord');
            // Strict exact match for root dashboard path, startsWith for subpages
            const isActive = item.path === `/${userRole}` ? location.pathname === item.path : location.pathname.startsWith(item.path);
            
            return (
              <Link 
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors z-10",
                  isActive 
                    ? "text-[#E8DDCC]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 -z-10 rounded-lg bg-[#E8DDCC]/10"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[#332D29] font-medium text-sm flex-shrink-0">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 hidden sm:block capitalize">{userRole} Portal</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64 transition-all dark:text-slate-200"
              />
            </div>
            <button className="md:hidden relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="relative">
              <button onClick={toggleNotifications} className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full border border-white dark:border-slate-950">{unreadCount}</span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-semibold">Notifications</span>
                    <button onClick={markAllRead} className="text-xs text-slate-500 hover:text-slate-700">Mark all read</button>
                  </div>
                  <ul className="max-h-64 overflow-auto">
                    {notifications.map((n) => (
                      <li key={n.id} className={`p-3 border-b border-slate-100 dark:border-slate-800 flex items-start gap-3 ${n.read ? '' : 'bg-indigo-50/40'}`}>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</p>
                            <span className="text-xs text-slate-400">{n.time}</span>
                          </div>
                          {n.body && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{n.body}</p>}
                          {!n.read && (
                            <button onClick={() => markAsRead(n.id)} className="mt-2 text-xs text-indigo-600 hover:underline">Mark as read</button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button type="button" onClick={handleLogout} className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 ml-2">
              Logout
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
