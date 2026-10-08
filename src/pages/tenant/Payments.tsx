import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, Clock, CheckCircle2, Building, Wallet, Landmark, ChevronRight, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../../hooks/useAuth';

interface PaymentRecord {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  method: string;
}

const MOCK_PAYMENT_TRENDS = [
  { month: 'Jan', balance: 0, paid: 2400 },
  { month: 'Feb', balance: 500, paid: 1900 },
  { month: 'Mar', balance: 0, paid: 2900 },
  { month: 'Apr', balance: 0, paid: 2400 },
  { month: 'May', balance: 0, paid: 2400 },
  { month: 'Jun', balance: 0, paid: 2400 },
];

export const TenantPayments = () => {
  const { fetchWithAuth } = useAuth();
  const [autoPayEnabled, setAutoPayEnabled] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const response = await fetchWithAuth('/api/payments');
        const result = await response.json() as { success?: boolean; data?: PaymentRecord[]; error?: string };
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Could not load payments.');
        }
        setPayments(result.data ?? []);
      } catch (error) {
        console.error('Failed to load tenant payments:', error);
      }
    };

    void loadPayments();
  }, [fetchWithAuth]);

  const upcomingPayment = useMemo(() => {
    const relevant = [...payments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return relevant.find((payment) => payment.status !== 'paid') ?? relevant[0] ?? null;
  }, [payments]);

  const transactions = useMemo(() =>
    [...payments].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .map((payment) => ({
        id: payment.id,
        date: payment.paidDate ?? payment.dueDate,
        amount: Number(payment.amount),
        type: 'Rent',
        method: payment.method,
        status: payment.status === 'paid' ? 'Completed' : payment.status === 'pending' ? 'Pending' : 'Overdue',
      })),
    [payments]);

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Payments</h1>
            <p className="text-slate-500 mt-1">Manage your rent payments and view transaction history.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Upcoming Payment</h2>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-black text-slate-900 tracking-tight">
                          ${upcomingPayment ? Number(upcomingPayment.amount).toLocaleString() : '0'}
                        </span>
                        <span className="text-slate-500 font-medium tracking-tight">.00</span>
                      </div>
                      <p className="text-slate-600 font-medium flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {upcomingPayment ? `Due on ${new Date(upcomingPayment.dueDate).toLocaleDateString()}` : 'No upcoming payments'}
                      </p>
                    </div>
                  </div>

                  <button className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-colors text-center whitespace-nowrap">
                    Make a Payment
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {autoPayEnabled && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span className={cn(
                      'relative inline-flex rounded-full h-3 w-3',
                      autoPayEnabled ? 'bg-emerald-500' : 'bg-slate-300',
                    )}></span>
                  </span>
                  <span className="text-sm font-medium text-slate-700">Autopay is {autoPayEnabled ? 'On' : 'Off'}</span>
                </div>
                <button
                  onClick={() => setAutoPayEnabled((value) => !value)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Manage Autopay
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Payment Trends (Last 6 Months)
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_PAYMENT_TRENDS} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `$${value}`} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`$${value}`, '']} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                    <Line name="Amount Paid" type="monotone" dataKey="paid" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line name="Outstanding Balance" type="monotone" dataKey="balance" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg">Transaction History</h3>
                <button className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1">
                  Download All <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 p-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{tx.type} Payment</h4>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {new Date(tx.date).toLocaleDateString()} • {tx.method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-right">
                        <span className="block font-bold text-slate-900">${tx.amount.toLocaleString()}.00</span>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-center inline-block mt-1 uppercase tracking-wider">
                          {tx.status}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors hidden sm:block" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
              <h3 className="font-bold text-slate-900 mb-6 text-lg flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-500" />
                Payment Methods
              </h3>

              <div className="space-y-3">
                <div className="border border-indigo-200 bg-indigo-50/50 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shadow-sm">
                      <Landmark className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm">Bank Account</h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Checking •••• 1234</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md uppercase tracking-wide">Default</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-500" />
                Property Summary
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Current balance</span>
                  <span className="font-semibold text-slate-900">$0.00</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Payments this year</span>
                  <span className="font-semibold text-slate-900">{payments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Next due date</span>
                  <span className="font-semibold text-slate-900">
                    {upcomingPayment ? new Date(upcomingPayment.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
