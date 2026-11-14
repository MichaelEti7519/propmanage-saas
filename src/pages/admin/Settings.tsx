import React, { useState } from 'react';
import { User, Lock, Bell, Shield, Save, Moon, Sun, Monitor, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useAuth } from '../../hooks/useAuth';
import { ProfileSettings } from '../../components/ProfileSettings';

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { fetchWithAuth } = useAuth();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);

    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Complete all three password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new password and its confirmation do not match.');
      return;
    }
    if (newPassword.length < 12) {
      setPasswordError('The new password must be at least 12 characters.');
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetchWithAuth('/api/users/me/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to update the password.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordNotice('Password updated. Use the new password the next time you sign in.');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Unable to update the password.');
    } finally {
      setSavingPassword(false);
    }
  };

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
            {activeTab === 'profile' && <ProfileSettings />}

            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-6 animate-in fade-in duration-200">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-4">Security & Password</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                    <input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                      placeholder="Enter your current password"
                      className="w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                      placeholder="At least 12 characters"
                      className="w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                      placeholder="Repeat the new password"
                      className="w-full max-w-md px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div role="alert" className="max-w-md rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {passwordError}
                  </div>
                )}
                {passwordNotice && (
                  <div className="max-w-md rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {passwordNotice}
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-slate-400" />
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Not available in this build. Turning it on needs an authenticator or SMS provider, so no switch is shown.
                      </p>
                    </div>
                    <span className="flex-shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      Not available
                    </span>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Save className="w-4 h-4" /> {savingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
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
                      <label className="flex items-center gap-2 text-sm text-slate-400 cursor-not-allowed">
                        <input type="checkbox" disabled className="rounded border-slate-300 text-indigo-600" />
                        Email
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-400 cursor-not-allowed">
                        <input type="checkbox" disabled className="rounded border-slate-300 text-indigo-600" />
                        SMS
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                  <p>
                    No email or SMS delivery is connected yet, so these preferences cannot be saved. Nothing on this tab
                    changes what the platform sends.
                  </p>
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
