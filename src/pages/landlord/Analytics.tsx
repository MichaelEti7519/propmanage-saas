import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  PieChart as PieChartIcon, 
  BarChart2, 
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const REVENUE_DATA = [
  { month: 'Jan', revenue: 42000, net: 30000 },
  { month: 'Feb', revenue: 42500, net: 31000 },
  { month: 'Mar', revenue: 43000, net: 29000 },
  { month: 'Apr', revenue: 44500, net: 32000 },
  { month: 'May', revenue: 45000, net: 32000 },
  { month: 'Jun', revenue: 46500, net: 35500 },
  { month: 'Jul', revenue: 47000, net: 35500 },
  { month: 'Aug', revenue: 47200, net: 35200 },
  { month: 'Sep', revenue: 48000, net: 36200 },
  { month: 'Oct', revenue: 48500, net: 35000 },
  { month: 'Nov', revenue: 49000, net: 36800 },
  { month: 'Dec', revenue: 50500, net: 36500 },
];

const EXPENSE_DATA = [
  { name: 'Maintenance', value: 35000, color: '#95651D' },
  { name: 'Property Tax', value: 45000, color: '#B9A58B' },
  { name: 'Insurance', value: 15000, color: '#397451' },
  { name: 'Utilities', value: 25000, color: '#756B61' },
  { name: 'Management', value: 20000, color: '#332D29' },
];

const PROPERTY_PERFORMANCE = [
  { name: 'Sunset Villas', occupancy: 95, roi: 8.5 },
  { name: 'The Grand', occupancy: 100, roi: 12.2 },
  { name: 'Pinecrest', occupancy: 85, roi: 6.4 },
  { name: 'Oceanview', occupancy: 100, roi: 9.8 },
];

export const LandlordAnalytics = () => {
  const [timeframe, setTimeframe] = useState('This Year');

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart2 className="w-8 h-8 text-indigo-600" />
              Analytics & Metrics
            </h1>
            <p className="text-slate-500 mt-1">Detailed financial and operational performance reports.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none font-medium text-slate-700 text-sm cursor-pointer shadow-sm"
              >
                <option>This Year</option>
                <option>Last Year</option>
                <option>Last 6 Months</option>
                <option>All Time</option>
              </select>
            </div>
            <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <ArrowUpRight className="w-3 h-3" /> 12.5%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Total Gross Income</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">$553,700</h3>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <ArrowUpRight className="w-3 h-3" /> 8.4%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Net Operating Income</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">$413,700</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                <ArrowDownRight className="w-3 h-3" /> 2.1%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Total Operating Expenses</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">$140,000</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <BarChart2 className="w-5 h-5" />
              </div>
              <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <ArrowUpRight className="w-3 h-3" /> 1.2%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Average Portfolio ROI</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">9.2%</h3>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue vs Net Income</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={REVENUE_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDCC" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#756B61', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#756B61', fontSize: 12 }} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E8DDCC', boxShadow: '0 4px 20px rgba(51, 45, 41, 0.04)' }}
                    formatter={(value) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" name="Gross Revenue" dataKey="revenue" stroke="#332D29" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Net Income" dataKey="net" stroke="#397451" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Expense Breakdown</h3>
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={EXPENSE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {EXPENSE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `$${value.toLocaleString()}`}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
              {EXPENSE_DATA.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-slate-600 truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Property Performance Matrix</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PROPERTY_PERFORMANCE} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8DDCC" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#756B61', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#49413A', fontSize: 13, fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#FAF8F3' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E8DDCC', boxShadow: '0 4px 20px rgba(51, 45, 41, 0.04)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar name="Occupancy Rate (%)" dataKey="occupancy" fill="#B9A58B" radius={[0, 4, 4, 0]} barSize={24} />
                <Bar name="ROI (%)" dataKey="roi" fill="#332D29" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
