import React from 'react';
import { Users, Search, Filter, Shield, Building, MoreVertical } from 'lucide-react';

export const AdminTenants = () => {
  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-8 h-8 text-indigo-600" />
              Global Tenant Directory
            </h1>
            <p className="text-slate-500 mt-1">Platform-wide overview of all tenant users.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search users by email..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Landlord</th>
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Sarah Jenkins', email: 'sarah.j@example.com', landlord: 'Equity Residential', property: 'Sunset Villas' },
                { name: 'Michael Rodriguez', email: 'm.rodriguez@example.com', landlord: 'Smith Property Mgmt', property: 'The Grand' },
                { name: 'Emma Wilson', email: 'emma.w@example.com', landlord: 'Equity Residential', property: 'Sunset Villas' },
              ].map((user, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group text-sm">
                  <td className="px-6 py-4 font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{user.name.charAt(0)}</div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-indigo-600 font-medium"><div className="flex items-center gap-1"><Shield className="w-4 h-4" /> {user.landlord}</div></td>
                  <td className="px-6 py-4 text-slate-600"><div className="flex items-center gap-1"><Building className="w-4 h-4 text-slate-400" /> {user.property}</div></td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
