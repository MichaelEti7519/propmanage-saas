import React from 'react';
import { MessageSquare, ShieldAlert } from 'lucide-react';

export const AdminMessages = () => {
  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-indigo-600" />
          System Broadcasts & Support
        </h1>
        <p className="text-slate-500 mt-1">Send platform-wide announcements or handle support escalations.</p>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
           <ShieldAlert className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-slate-900 mb-2">Support Messages</h3>
           <p className="text-slate-500 max-w-md mx-auto">Manage tickets and communication from landlords needing technical assistance.</p>
        </div>
      </div>
    </div>
  );
};
