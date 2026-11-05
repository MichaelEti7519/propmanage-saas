import React, { useEffect, useState } from 'react';
import { Home, Phone, Mail, FileText, AlertCircle, Clock, ShieldCheck, CreditCard, ChevronRight, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ReportModal } from '../../components/ReportModal';
import { useAuth } from '../../hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock Landlord Data for the context
const MOCK_LANDLORD = {
  name: "Acme Property Management",
  agentName: "Sarah Jenkins",
  phone: "(555) 123-4567",
  email: "support@acmeproperties.com",
};

// Mock Lease Data
const MOCK_LEASE = {
  unit: "Apt 4B - The Grand",
  address: "123 Main St, Springfield, IL 62701",
  rentAmount: 2400,
  nextPaymentDate: "2026-06-20", // Mocked to be within 5 days of today (June 16, 2026)
  leaseEnd: "2026-10-31",
  status: "Active"
};

const INITIAL_CHECKLIST = [
  { id: '1', title: 'Provide Proof of Renter\'s Insurance', completed: false, description: 'Upload your insurance policy document.' },
  { id: '2', title: 'Transfer Utilities', completed: true, description: 'Set up electricity and water in your name.' },
  { id: '3', title: 'Digital Move-in Inspection', completed: false, description: 'Complete the move-in condition form.' },
];

const MOCK_PAYMENT_TRENDS = [
  { month: 'Jan', balance: 0, paid: 2400 },
  { month: 'Feb', balance: 500, paid: 1900 },
  { month: 'Mar', balance: 0, paid: 2900 },
  { month: 'Apr', balance: 0, paid: 2400 },
  { month: 'May', balance: 0, paid: 2400 },
  { month: 'Jun', balance: 0, paid: 2400 },
];


export const TenantDashboard = () => {
  const { fetchWithAuth } = useAuth();
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST);
  const [reportTarget, setReportTarget] = useState<{ targetType: 'tenant' | 'landlord'; targetId: string; targetName: string } | null>(null);
  const [linkedLandlord, setLinkedLandlord] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    async function loadLinkedLandlord() {
      try {
        const response = await fetchWithAuth('/api/tenants');
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.data)) return;
        const landlord = data.data[0]?.landlord;
        if (landlord?.id) {
          setLinkedLandlord({ id: landlord.id, name: `${landlord.firstName} ${landlord.lastName}` });
        }
      } catch {
        setLinkedLandlord(null);
      }
    }
    loadLinkedLandlord();
  }, [fetchWithAuth]);

  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };
  
  const completedCount = checklist.filter(item => item.completed).length;
  const progress = Math.round((completedCount / checklist.length) * 100);

  // Payment Reminder Logic
  const nextPaymentDate = new Date(MOCK_LEASE.nextPaymentDate);
  const today = new Date('2026-06-16T00:00:00'); // using the known 'current' localized time or use new Date()
  const timeDiff = nextPaymentDate.getTime() - today.getTime();
  const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const showPaymentReminder = daysUntilDue <= 5 && daysUntilDue >= 0;

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {reportTarget && (
          <ReportModal
            open={true}
            onClose={() => setReportTarget(null)}
            targetType={reportTarget.targetType}
            targetId={reportTarget.targetId}
            targetName={reportTarget.targetName}
          />
        )}
        
        {/* Payment Reminder Alert */}
        {showPaymentReminder && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">Rent Payment Due Soon</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Your upcoming rent payment of <span className="font-bold">${MOCK_LEASE.rentAmount.toLocaleString()}</span> is due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} (on {nextPaymentDate.toLocaleDateString()}).
                </p>
              </div>
            </div>
            <Link to="/tenant/payments" className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors text-center whitespace-nowrap">
              Pay Now
            </Link>
          </div>
        )}

        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Welcome home, Michael</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
               <Home className="w-4 h-4" /> {MOCK_LEASE.unit} 
            </p>
          </div>
          
          {/* Landlord Identification Badge */}
          <div className="bg-white p-3 sm:px-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 w-fit">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              AP
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Managed By</p>
              <p className="text-sm font-bold text-slate-900">{MOCK_LANDLORD.name}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!linkedLandlord}
            onClick={() => linkedLandlord && setReportTarget({
              targetType: 'landlord',
              targetId: linkedLandlord.id,
              targetName: linkedLandlord.name,
            })}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            title={linkedLandlord ? 'Report the landlord linked to this rental account' : 'A landlord must be linked to this account before submitting a report'}
          >
            <AlertCircle className="h-4 w-4" />
            Report Landlord
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Content Area - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Payment Due Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                <div className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Upcoming Payment</h2>
                    <div className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                      ${MOCK_LEASE.rentAmount.toLocaleString()}
                    </div>
                    <p className="text-slate-600 font-medium">Due on {new Date(MOCK_LEASE.nextPaymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <button className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-colors text-center whitespace-nowrap">
                  Pay Now
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left flex flex-col items-start gap-4">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                   <AlertCircle className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-900">Request Maintenance</h3>
                   <p className="text-sm text-slate-500 mt-1 line-clamp-1">Submit a new repair request</p>
                 </div>
              </button>
              <button className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left flex flex-col items-start gap-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                   <FileText className="w-5 h-5" />
                 </div>
                 <div>
                   <h3 className="font-bold text-slate-900">View Lease</h3>
                   <p className="text-sm text-slate-500 mt-1 line-clamp-1">Review your current lease</p>
                 </div>
              </button>
            </div>

            {/* Payment Trends Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
               <h3 className="font-bold text-slate-900 text-lg mb-6 flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-indigo-500" />
                 Payment Trends (Last 6 Months)
               </h3>
               <div className="h-72 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart
                     data={MOCK_PAYMENT_TRENDS}
                     margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
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
                       tickFormatter={(value) => `$${value}`}
                       dx={-10}
                     />
                     <Tooltip 
                       contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       formatter={(value) => [`$${value}`, '']}
                     />
                     <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
                     <Line 
                       name="Amount Paid"
                       type="monotone" 
                       dataKey="paid" 
                       stroke="#B9A58B"
                       strokeWidth={3}
                       dot={{ r: 4, strokeWidth: 2 }}
                       activeDot={{ r: 6, strokeWidth: 0 }}
                     />
                     <Line 
                       name="Outstanding Balance"
                       type="monotone" 
                       dataKey="balance" 
                       stroke="#ef4444" 
                       strokeWidth={3}
                       dot={{ r: 4, strokeWidth: 2 }}
                       activeDot={{ r: 6, strokeWidth: 0 }}
                     />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Move-In Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    Move-In Checklist
                  </h3>
                  <span className="text-sm font-semibold text-slate-500">{completedCount} of {checklist.length} completed</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="divide-y divide-slate-100">
                {checklist.map(item => (
                  <label key={item.id} className={cn(
                    "flex items-start gap-4 p-5 sm:p-6 cursor-pointer hover:bg-slate-50 transition-colors",
                    item.completed && "bg-slate-50/50"
                  )}>
                    <div className="relative flex items-center justify-center pt-0.5">
                      <input 
                        type="checkbox" 
                        checked={item.completed}
                        onChange={() => toggleChecklist(item.id)}
                        className="peer sr-only"
                      />
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        item.completed 
                          ? "bg-indigo-500 border-indigo-500 text-white" 
                          : "border-slate-300 text-transparent hover:border-indigo-400 group-hover:border-indigo-400"
                      )}>
                        <CheckCircle2 className={cn("w-4 h-4", item.completed ? "opacity-100" : "opacity-0")} />
                      </div>
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-semibold transition-colors",
                        item.completed ? "text-slate-500 line-through" : "text-slate-900"
                      )}>
                        {item.title}
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Recent Activity / Announcements */}
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
               <h3 className="font-bold text-slate-900 mb-6 flex items-center justify-between">
                 Recent Announcements
               </h3>
               
               <div className="space-y-4">
                 <div className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                     AP
                   </div>
                   <div>
                     <h4 className="font-semibold text-slate-900 text-sm">{MOCK_LANDLORD.name}</h4>
                     <p className="text-slate-600 text-sm mt-1">Water will be shut off for maintenance on Friday between 10am and 12pm. We apologize for any inconvenience.</p>
                     <span className="text-xs text-slate-400 mt-2 block">2 days ago</span>
                   </div>
                 </div>
               </div>
             </div>

          </div>

          {/* Right Column - Landlord Contact & Info */}
          <div className="space-y-6">
            
            {/* Landlord Contact Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400"></div>
              
              <h3 className="font-bold text-slate-900 mb-4 text-lg">Property Management</h3>
              
              <div className="space-y-5">
                <div>
                  <p className="font-semibold text-slate-900">{MOCK_LANDLORD.name}</p>
                  <p className="text-sm text-slate-500">Agent: {MOCK_LANDLORD.agentName}</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <a href={`tel:${MOCK_LANDLORD.phone}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-slate-50 -mx-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-slate-600" />
                    </div>
                    {MOCK_LANDLORD.phone}
                  </a>
                  <a href={`mailto:${MOCK_LANDLORD.email}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-slate-50 -mx-2 break-all">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-slate-600" />
                    </div>
                    {MOCK_LANDLORD.email}
                  </a>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-xl transition-colors">
                    Send Message
                  </button>
                </div>
              </div>
            </div>

            {/* Lease Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" /> Lease Details
              </h3>
              
              <div className="space-y-3 mt-4">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-500">Status</span>
                   <span className="font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">Active</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-500">Lease End</span>
                   <span className="font-semibold text-slate-900">{new Date(MOCK_LEASE.leaseEnd).toLocaleDateString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-500">Rent amount</span>
                   <span className="font-semibold text-slate-900">${MOCK_LEASE.rentAmount}/mo</span>
                 </div>
              </div>
            </div>

          </div>

        </div>
      </div>
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

export { TenantPayments } from './Payments';
export { TenantMaintenance } from './Maintenance';
export { TenantMessages } from './Messages';
export { TenantDocuments } from './Documents';
export { TenantSettings } from './Settings';
