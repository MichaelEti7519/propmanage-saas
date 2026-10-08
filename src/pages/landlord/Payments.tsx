import React, { useState } from 'react';
import { 
  DollarSign, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Download,
  Building
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Payment {
  id: string;
  tenant: string;
  property: string;
  unit: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  method: string;
}

const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'PAY-8901',
    tenant: 'Sarah Jenkins',
    property: 'Sunset Villas',
    unit: '12B',
    amount: 1850,
    date: '2026-07-01',
    status: 'Paid',
    method: 'ACH Transfer'
  },
  {
    id: 'PAY-8902',
    tenant: 'Michael Rodriguez',
    property: 'Sunset Villas',
    unit: '14A',
    amount: 1900,
    date: '2026-07-02',
    status: 'Paid',
    method: 'Credit Card'
  },
  {
    id: 'PAY-8903',
    tenant: 'Emily Chen',
    property: 'The Grand Apartments',
    unit: '401',
    amount: 2450,
    date: '2026-07-05',
    status: 'Pending',
    method: 'Bank Transfer'
  },
  {
    id: 'PAY-8904',
    tenant: 'David Kim',
    property: 'Pinecrest Townhomes',
    unit: 'Unit 3',
    amount: 2100,
    date: '2026-07-01',
    status: 'Paid',
    method: 'ACH Transfer'
  },
  {
    id: 'PAY-8905',
    tenant: 'Lisa Washington',
    property: 'Oceanview Duplex',
    unit: 'Unit A',
    amount: 3200,
    date: '2026-06-01',
    status: 'Overdue',
    method: 'Manual Entry'
  },
  {
    id: 'PAY-8906',
    tenant: 'James Wilson',
    property: 'The Grand Apartments',
    unit: '205',
    amount: 2350,
    date: '2026-07-10',
    status: 'Paid',
    method: 'Debit Card'
  },
  {
    id: 'PAY-8907',
    tenant: 'Robert Garcia',
    property: 'Sunset Villas',
    unit: '3C',
    amount: 1750,
    date: '2026-07-01',
    status: 'Overdue',
    method: 'Pending'
  }
];

export const LandlordPayments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredPayments = MOCK_PAYMENTS.filter(payment => {
    const matchesSearch = 
      payment.tenant.toLowerCase().includes(searchTerm.toLowerCase()) || 
      payment.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || payment.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Paid':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'Pending':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'Overdue':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      default:
        return { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
  };

  const totalCollected = MOCK_PAYMENTS.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = MOCK_PAYMENTS.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = MOCK_PAYMENTS.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              Rent & Payments
            </h1>
            <p className="text-slate-500 mt-1">Track rental income, pending payments, and overdues.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" />
              Record Payment
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">Collected (This Month)</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">${totalCollected.toLocaleString()}</h3>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">Pending</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">${totalPending.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500">Overdue</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">${totalOverdue.toLocaleString()}</h3>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by tenant, property, or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-shadow"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none font-medium text-slate-700 text-sm cursor-pointer transition-shadow"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant / Property</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice / Date</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => {
                  const StatusIcon = getStatusConfig(payment.status).icon;
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 mb-0.5">{payment.tenant}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {payment.property} - {payment.unit}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-700 mb-0.5">{payment.id}</div>
                        <div className="text-sm text-slate-500">{new Date(payment.date).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">${payment.amount.toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                          getStatusConfig(payment.status).bg,
                          getStatusConfig(payment.status).color,
                          getStatusConfig(payment.status).border
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {payment.status}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">
                        {payment.method}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-lg font-medium text-slate-900">No payments found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
