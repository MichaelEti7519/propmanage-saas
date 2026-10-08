import React, { useState } from 'react';
import { 
  Building, 
  Users, 
  DollarSign, 
  Wrench, 
  AlertTriangle, 
  TrendingUp,
  ArrowRight,
  Plus,
  Home,
  CheckCircle2,
  Clock,
  X,
  FileText,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '../../lib/utils';

const MOCK_REVENUE_DATA = [
  { month: 'Jan', revenue: 42000, expenses: 12000 },
  { month: 'Feb', revenue: 42500, expenses: 11500 },
  { month: 'Mar', revenue: 43000, expenses: 14000 },
  { month: 'Apr', revenue: 44500, expenses: 12500 },
  { month: 'May', revenue: 45000, expenses: 13000 },
  { month: 'Jun', revenue: 46500, expenses: 11000 },
  { month: 'Jul', revenue: 47000, expenses: 11500 },
  { month: 'Aug', revenue: 47200, expenses: 12000 },
  { month: 'Sep', revenue: 48000, expenses: 11800 },
  { month: 'Oct', revenue: 48500, expenses: 13500 },
  { month: 'Nov', revenue: 49000, expenses: 12200 },
  { month: 'Dec', revenue: 50500, expenses: 14000 },
];

const MOCK_TASKS = [
  { id: 1, title: 'Approve lease renewal for Apt 4B', type: 'Lease', due: 'Today', priority: 'High' },
  { id: 2, title: 'HVAC Maintenance at Sunset Villas', type: 'Maintenance', due: 'Tomorrow', priority: 'Medium' },
  { id: 3, title: 'Review new tenant screening', type: 'Application', due: 'In 2 days', priority: 'Low' },
];

export const LandlordDashboard = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
            <p className="text-slate-500 mt-1">Welcome back! Here's what's happening with your properties.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search across properties..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
            <button 
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
            <button 
              onClick={() => setShowPropertyModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Property
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <TrendingUp className="w-3 h-3" /> +4.2%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Monthly Revenue</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">$46,500</h3>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                98% Occupied
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Total Units</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">45</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">Active Tenants</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">62</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                3 Urgent
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Open Requests</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">12</h3>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Financial Overview</h3>
              <select defaultValue="This Year" className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500">
                <option>Last 6 Months</option>
                <option>Last 12 Months</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="h-72 w-full flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MOCK_REVENUE_DATA}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `$${value / 1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [`$${value}`, '']}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-sm font-medium text-slate-600">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                <span className="text-sm font-medium text-slate-600">Expenses</span>
              </div>
            </div>
          </div>

          {/* Side Panel: Action Items & Alerts */}
          <div className="space-y-6">
            
            {/* Needs Attention */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Action Items
                </h3>
                <Link to="/landlord/messages" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
                {MOCK_TASKS.map(task => (
                  <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-slate-600 border border-slate-200",
                        task.type === 'Lease' && "bg-blue-50 border-blue-200 text-blue-700",
                        task.type === 'Maintenance' && "bg-amber-50 border-amber-200 text-amber-700",
                        task.type === 'Application' && "bg-purple-50 border-purple-200 text-purple-700",
                      )}>
                        {task.type}
                      </span>
                      <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {task.due}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 text-sm mt-2">{task.title}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                 <button 
                   onClick={() => setShowTaskModal(true)}
                   className="w-full py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-medium shadow-sm hover:bg-slate-100 transition-colors text-sm"
                 >
                   Add New Task
                 </button>
              </div>
            </div>

          </div>
        </div>
        
        {/* Quick Links */}
        <div>
          <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/landlord/properties" className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
               <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                 <Building className="w-6 h-6" />
               </div>
               <span className="font-medium text-slate-900">Properties</span>
            </Link>
            <Link to="/landlord/tenants" className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
               <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                 <Users className="w-6 h-6" />
               </div>
               <span className="font-medium text-slate-900">Tenants</span>
            </Link>
            <Link to="/landlord/payments" className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
               <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                 <DollarSign className="w-6 h-6" />
               </div>
               <span className="font-medium text-slate-900">Payments</span>
            </Link>
            <Link to="/landlord/maintenance" className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col items-center text-center gap-3">
               <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                 <Wrench className="w-6 h-6" />
               </div>
               <span className="font-medium text-slate-900">Maintenance</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowReportModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Generate Report
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Report Type</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option>Financial Summary</option>
                  <option>Rent Roll</option>
                  <option>Maintenance History</option>
                  <option>Occupancy Rates</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Year to Date</option>
                  <option>Last Year</option>
                  <option>Custom Range...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="format" defaultChecked className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700">PDF Document</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="format" className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700">CSV Spreadsheet</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showPropertyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowPropertyModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-500" />
                Add New Property
              </h3>
              <button 
                onClick={() => setShowPropertyModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Sunset Villas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input 
                  type="text" 
                  placeholder="123 Main St, City, State ZIP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Property Type</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <option>Multi-family (Apartment)</option>
                    <option>Single-family</option>
                    <option>Townhouse</option>
                    <option>Commercial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Units</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 12"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowPropertyModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowPropertyModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors"
              >
                Save Property
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowTaskModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                Add New Task
              </h3>
              <button 
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input 
                  type="text" 
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Task Type</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <option>Lease</option>
                    <option>Maintenance</option>
                    <option>Application</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="priority" className="text-amber-500 focus:ring-amber-500" />
                    <span className="text-sm text-slate-700">High</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="priority" defaultChecked className="text-blue-500 focus:ring-blue-500" />
                    <span className="text-sm text-slate-700">Medium</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="priority" className="text-slate-500 focus:ring-slate-500" />
                    <span className="text-sm text-slate-700">Low</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

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

export { LandlordProperties } from './Properties';
export { LandlordUnits } from './Units';
export { LandlordPayments } from './Payments';
export { LandlordReports } from './Reports';
export { LandlordMessages } from './Messages';
export { LandlordMaintenance } from './Maintenance';
export { LandlordAnalytics } from './Analytics';
export { LandlordSettings } from './Settings';
// Tenants is separate in Tenants.tsx
