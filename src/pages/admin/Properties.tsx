import React, { useState } from 'react';
import { Building, Search, Filter, MoreVertical, Shield, MapPin, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminProperties = () => {
  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building className="w-8 h-8 text-indigo-600" />
              Global Properties
            </h1>
            <p className="text-slate-500 mt-1">Platform-wide directory of all registered properties across all landlords.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search properties or landlords..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <button className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="px-6 py-4">Property</th>
                <th className="px-6 py-4">Landlord / Account</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Units</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Sunset Villas', landlord: 'Equity Residential Group', location: 'Los Angeles, CA', units: 24, status: 'Active' },
                { name: 'The Grand', landlord: 'Smith Property Mgmt', location: 'New York, NY', units: 120, status: 'Active' },
                { name: 'Oasis Apartments', landlord: 'Oasis LLC', location: 'Miami, FL', units: 12, status: 'Pending Verification' },
              ].map((prop, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors group text-sm">
                  <td className="px-6 py-4 font-semibold text-slate-900">{prop.name}</td>
                  <td className="px-6 py-4 text-indigo-600 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {prop.landlord}
                  </td>
                  <td className="px-6 py-4 text-slate-600"><div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-slate-400" />{prop.location}</div></td>
                  <td className="px-6 py-4 text-slate-600"><div className="flex items-center gap-1"><Users className="w-4 h-4 text-slate-400" />{prop.units}</div></td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-semibold",
                      prop.status === 'Active' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"
                    )}>
                      {prop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
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
