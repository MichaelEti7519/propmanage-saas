import React from 'react';
import { CreditCard, DollarSign, ArrowUpRight } from 'lucide-react';

export const AdminPayments = () => {
  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-8 h-8 text-indigo-600" />
          Platform Transactions & Revenue
        </h1>
        <p className="text-slate-500 mt-1">Overview of SaaS subscriptions and payment processing fees.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">SaaS Subscription MRR</p>
            <h3 className="text-3xl font-black text-slate-900">$124,500</h3>
            <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 mt-2">
              <ArrowUpRight className="w-4 h-4" /> +14.5% this month
            </span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Payment Processing Volume</p>
            <h3 className="text-3xl font-black text-slate-900">$4.2M</h3>
            <span className="text-sm text-slate-500 mt-2 block">Total rent processed via platform</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Platform Fees Collected</p>
            <h3 className="text-3xl font-black text-slate-900">$42,000</h3>
            <span className="text-sm text-slate-500 mt-2 block">1% processing fee revenue</span>
          </div>
        </div>
      </div>
    </div>
  );
};
