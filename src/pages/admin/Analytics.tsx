import React from 'react';
import { BarChart3, Activity } from 'lucide-react';

export const AdminAnalytics = () => {
  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Platform Analytics
        </h1>
        <p className="text-slate-500 mt-1">Global usage statistics and growth metrics.</p>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
           <Activity className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-slate-900 mb-2">Global Analytics Engine</h3>
           <p className="text-slate-500 max-w-md mx-auto">This module is aggregating cross-platform metrics across all landlords and tenants.</p>
        </div>
      </div>
    </div>
  );
};
