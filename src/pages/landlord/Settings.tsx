import React, { useState } from 'react';
import { User, Lock, Bell, Shield, Save, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDarkMode } from '../../hooks/useDarkMode';

export const LandlordSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Account Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your personal information, security, and preferences.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <button 
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-colors",
                  activeTab === 'profile' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <User className="w-5 h-5" /> Profile Information
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-colors",
                  activeTab === 'security' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Lock className="w-5 h-5" /> Security & Password
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-colors",
                  activeTab === 'notifications' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Bell className="w-5 h-5" /> Notifications
              </button>
              <button 
                onClick={() => setActiveTab('appearance')}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-colors",
                  activeTab === 'appearance' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <Monitor className="w-5 h-5" /> Appearance
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 transition-colors duration-200">
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4">Personal Information</h3>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-2xl">
                    JD
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      Change Avatar
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">First Name</label>
                    <input type="text" defaultValue="Jane" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Last Name</label>
                    <input type="text" defaultValue="Doe" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <input type="email" defaultValue="jane.doe@example.com" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input type="tel" defaultValue="(555) 123-4567" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4">Security & Password</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                    <input type="password" placeholder="••••••••" className="w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                    <input type="password" placeholder="Leave blank to keep current" className="w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                    <input type="password" placeholder="" className="w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100" />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
                    </div>
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      Enable 2FA
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                    <Save className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4">Notification Preferences</h3>
                
                <div className="space-y-6">
                  {/* Rent Reminders */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Rent Reminders</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Receive reminders 3 days before rent is due.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800" />
                        Email
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-800" />
                        SMS
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-end border-t border-slate-100 dark:border-slate-800">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                    <Save className="w-4 h-4" /> Save Preferences
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4">Appearance Settings</h3>
                
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Dark Mode</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Toggle between light and dark theme.</p>
                  </div>
                  <button 
                    onClick={toggleDarkMode}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    {isDarkMode ? 'Dark' : 'Light'} Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
