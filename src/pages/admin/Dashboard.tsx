import React, { useState } from 'react';
import { Users, Building, Activity, DollarSign, Shield, Server, ArrowUpRight, Globe, UserCheck, Search, X, Wrench, ChevronRight, History } from 'lucide-react';

export const AdminDashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for global search
  const searchResults = {
    users: [
      { id: 'u1', name: 'Sarah Jenkins', type: 'Tenant', email: 'sarah.j@example.com' },
      { id: 'u2', name: 'Smith Property Mgmt', type: 'Landlord', email: 'admin@smithmgmt.com' }
    ],
    properties: [
      { id: 'p1', name: 'Sunset Villas', location: 'Los Angeles, CA' },
      { id: 'p2', name: 'The Grand', location: 'New York, NY' }
    ],
    tickets: [
      { id: 't1', title: 'HVAC Failure in Unit 4B', status: 'Open', priority: 'High' },
      { id: 't2', title: 'Leaking Pipe in Lobby', status: 'In Progress', priority: 'Medium' }
    ]
  };

  const hasSearchQuery = searchQuery.trim().length > 0;

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-600" />
              Super Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-1">Platform-wide overview, SaaS subscription metrics, and system health.</p>
          </div>
          
          <div className="w-full sm:w-72 md:w-96 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search across the platform..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm" 
              />
              {hasSearchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Global Search Results Dropdown */}
            {hasSearchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">
                <div className="p-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Results for "{searchQuery}"</p>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {/* Users Section */}
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Users
                    </div>
                    {searchResults.users.map(user => (
                      <button key={user.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.type} • {user.email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>

                  {/* Properties Section */}
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Building className="w-3.5 h-3.5" /> Properties
                    </div>
                    {searchResults.properties.map(property => (
                      <button key={property.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{property.name}</p>
                          <p className="text-xs text-slate-500">{property.location}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>

                  {/* Tickets Section */}
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5" /> Maintenance Tickets
                    </div>
                    {searchResults.tickets.map(ticket => (
                      <button key={ticket.id} className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm truncate max-w-[200px]">{ticket.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                              {ticket.status}
                            </span>
                            <span className="text-xs text-slate-500">Priority: {ticket.priority}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 border-t border-slate-100 bg-slate-50">
                  <button className="w-full py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors">
                    View all results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global SaaS Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <ArrowUpRight className="w-3 h-3" /> 14.5%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Platform MRR</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">$124,500</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <ArrowUpRight className="w-3 h-3" /> 8.2%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Active Landlords</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">1,482</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">Total Tenants</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">45,291</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">Global Properties</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">8,943</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Landlord Signups */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Recent Platform Signups (Landlords)
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Equity Residential Group', plan: 'Enterprise', users: 45, date: 'Today, 10:42 AM' },
                { name: 'Smith Property Mgmt', plan: 'Pro', users: 12, date: 'Today, 09:15 AM' },
                { name: 'Oasis Apartments LLC', plan: 'Starter', users: 3, date: 'Yesterday' },
                { name: 'Highland Real Estate', plan: 'Pro', users: 8, date: 'Yesterday' },
              ].map((signup, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-semibold text-slate-900">{signup.name}</p>
                    <p className="text-sm text-slate-500 mt-0.5">Subscribed to {signup.plan} Plan • {signup.users} team members</p>
                  </div>
                  <span className="text-sm font-medium text-slate-400">{signup.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-500" />
              System Health
            </h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">API Uptime (30d)</span>
                  <span className="text-sm font-bold text-emerald-600">99.99%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Database Load</span>
                  <span className="text-sm font-bold text-amber-600">64%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '64%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Storage Capacity</span>
                  <span className="text-sm font-bold text-indigo-600">42%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
              </div>
              
              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700">All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-500" />
              System Audit Trail
            </h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              View Full Log
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { action: 'Role Assigned', details: 'Granted "Property Manager" access to emma.w@example.com', user: 'Super Admin', time: '10 mins ago', icon: <Shield className="w-4 h-4 text-emerald-500" />, bg: 'bg-emerald-50' },
              { action: 'Property Status Update', details: 'Verified "Oasis Apartments LLC" and activated listing', user: 'System Auto-Verify', time: '1 hour ago', icon: <Building className="w-4 h-4 text-blue-500" />, bg: 'bg-blue-50' },
              { action: 'SaaS Plan Upgraded', details: 'Equity Residential Group upgraded to Enterprise Plan', user: 'Billing Webhook', time: '3 hours ago', icon: <DollarSign className="w-4 h-4 text-indigo-500" />, bg: 'bg-indigo-50' },
              { action: 'User Suspended', details: 'Account "spam.test12@example.com" flagged and suspended', user: 'Super Admin', time: '1 day ago', icon: <UserCheck className="w-4 h-4 text-amber-500" />, bg: 'bg-amber-50' },
              { action: 'System Config Changed', details: 'Updated global maintenance resolution SLA from 48h to 24h', user: 'Super Admin', time: '2 days ago', icon: <Wrench className="w-4 h-4 text-slate-500" />, bg: 'bg-slate-100' },
            ].map((log, i) => (
              <div key={i} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${log.bg}`}>
                  {log.icon}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1 sm:gap-4">
                    <p className="font-semibold text-slate-900 text-sm">{log.action}</p>
                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap">{log.time}</span>
                  </div>
                  <p className="text-sm text-slate-600">{log.details}</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">Performed by: {log.user}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
