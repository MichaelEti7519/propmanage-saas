import React from 'react';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500">This module is under construction.</p>
      </div>
    </div>
  </div>
);

export { AdminDashboard } from './Dashboard';
export { AdminProperties } from './Properties';
export { AdminUnits } from './Units';
export { AdminTenants } from './Tenants';
export { AdminPayments } from './Payments';
export { AdminMessages } from './Messages';
export { AdminMaintenance } from './Maintenance';
export { AdminAnalytics } from './Analytics';
export { AdminReports } from './Reports';
export { AdminSettings } from './Settings';
