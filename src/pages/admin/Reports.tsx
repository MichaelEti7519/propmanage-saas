import React from 'react';
import { FileText } from 'lucide-react';

export const AdminReports = () => {
  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FileText className="w-8 h-8 text-indigo-600" />
          Platform Reports
        </h1>
        <p className="text-slate-500 mt-1">Generate compliance, revenue, and usage reports for the entire SaaS platform.</p>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
           <h3 className="text-xl font-bold text-slate-900 mb-2">SaaS Reporting</h3>
           <p className="text-slate-500 max-w-md mx-auto">Export SOC2 compliance logs, global revenue numbers, and user adoption metrics.</p>
        </div>
      </div>
    </div>
  );
};
