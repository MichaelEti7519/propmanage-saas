import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Landing, About, Contact, LoginRegister, NotFound, Pricing, PrivacyPolicy, ThankYou } from './pages/public';
import { TenantInvite } from './pages/public/TenantInvite';
import { useAuth } from './hooks/useAuth';
import { LandlordDashboard, LandlordProperties, LandlordUnits, LandlordPayments, LandlordReports, LandlordMessages, LandlordMaintenance, LandlordAnalytics,
  LandlordSettings} from './pages/landlord';
import { LandlordTenants } from './pages/landlord/Tenants';
import { LandlordPropertyDetails } from './pages/landlord/PropertyDetails';
import { LandlordViewings } from './pages/landlord/Viewings';
import { TenantHomes } from './pages/tenant/Homes';
import { 
  TenantDashboard, TenantPayments, TenantMaintenance, 
  TenantMessages, TenantDocuments, TenantSettings 
} from './pages/tenant';
import { AdminDashboard, AdminProperties, AdminUnits, AdminTenants, 
  AdminPayments, AdminMessages, AdminMaintenance, AdminAnalytics, AdminReports,
  AdminSettings
} from './pages/admin';
import { 
  Building, Users, FileText, Settings, Activity, 
  CreditCard, MessageSquare, Wrench, BarChart3, 
  FileDigit, Box, Home, CalendarDays, Shield, Globe, DollarSign,
  Headset, Server, FileCheck
} from 'lucide-react';

export default function App() {
  const landlordNav = [
    { icon: <Activity className="w-4 h-4" />, label: "Dashboard", path: "/landlord" },
    { icon: <Building className="w-4 h-4" />, label: "Properties", path: "/landlord/properties" },
    { icon: <Box className="w-4 h-4" />, label: "Units", path: "/landlord/units" },
    { icon: <CalendarDays className="w-4 h-4" />, label: "Viewing Requests", path: "/landlord/viewings" },
    { icon: <Users className="w-4 h-4" />, label: "Tenants", path: "/landlord/tenants" },
    { icon: <CreditCard className="w-4 h-4" />, label: "Payments", path: "/landlord/payments" },
    { icon: <MessageSquare className="w-4 h-4" />, label: "Messages", path: "/landlord/messages" },
    { icon: <Wrench className="w-4 h-4" />, label: "Maintenance", path: "/landlord/maintenance" },
    { icon: <BarChart3 className="w-4 h-4" />, label: "Analytics", path: "/landlord/analytics" },
    { icon: <FileText className="w-4 h-4" />, label: "Reports", path: "/landlord/reports" },
    { icon: <Settings className="w-4 h-4" />, label: "Settings", path: "/landlord/settings" },
  ];

  const tenantNav = [
    { icon: <Activity className="w-4 h-4" />, label: "Dashboard", path: "/tenant" },
    { icon: <Home className="w-4 h-4" />, label: "Homes", path: "/tenant/homes" },
    { icon: <CreditCard className="w-4 h-4" />, label: "Payments", path: "/tenant/payments" },
    { icon: <Wrench className="w-4 h-4" />, label: "Maintenance", path: "/tenant/maintenance" },
    { icon: <MessageSquare className="w-4 h-4" />, label: "Messages", path: "/tenant/messages" },
    { icon: <FileDigit className="w-4 h-4" />, label: "Documents", path: "/tenant/documents" },
    { icon: <Settings className="w-4 h-4" />, label: "Settings", path: "/tenant/settings" },
  ];

  const adminNav = [
    { icon: <Shield className="w-4 h-4" />, label: "System Overview", path: "/admin" },
    { icon: <Globe className="w-4 h-4" />, label: "Global Directory", path: "/admin/properties" },
    { icon: <Box className="w-4 h-4" />, label: "All Units", path: "/admin/units" },
    { icon: <Users className="w-4 h-4" />, label: "User Accounts", path: "/admin/tenants" },
    { icon: <DollarSign className="w-4 h-4" />, label: "Platform Revenue", path: "/admin/payments" },
    { icon: <Headset className="w-4 h-4" />, label: "Support Desk", path: "/admin/messages" },
    { icon: <Server className="w-4 h-4" />, label: "System Health", path: "/admin/maintenance" },
    { icon: <Activity className="w-4 h-4" />, label: "Global Metrics", path: "/admin/analytics" },
    { icon: <FileCheck className="w-4 h-4" />, label: "Compliance Logs", path: "/admin/reports" },
    { icon: <Settings className="w-4 h-4" />, label: "Settings", path: "/admin/settings" },
  ];

  const { user, initializing } = useAuth();

  function RequireAuth({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
    if (initializing) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
    return <>{children}</>;
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/invite/:token" element={<TenantInvite />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Tenant Routes */}
        <Route path="/tenant" element={
          <RequireAuth allowedRoles={['tenant']}>
            <DashboardLayout navItems={tenantNav} userRole="tenant" userName={user?.firstName ?? 'Tenant'} userEmail={user?.email ?? ''}>
              <OutletWrapper />
            </DashboardLayout>
          </RequireAuth>
        }>
          <Route index element={<TenantDashboard />} />
          <Route path="homes" element={<TenantHomes />} />
          <Route path="payments" element={<TenantPayments />} />
          <Route path="maintenance" element={<TenantMaintenance />} />
          <Route path="messages" element={<TenantMessages />} />
          <Route path="documents" element={<TenantDocuments />} />
          <Route path="settings" element={<TenantSettings />} />
        </Route>

        {/* Landlord Routes */}
        <Route path="/landlord" element={
          <RequireAuth allowedRoles={['landlord']}>
            <DashboardLayout navItems={landlordNav} userRole="landlord" userName={user?.firstName ?? 'Landlord'} userEmail={user?.email ?? ''}>
              <OutletWrapper />
            </DashboardLayout>
          </RequireAuth>
        }>
          <Route index element={<LandlordDashboard />} />
          <Route path="properties" element={<LandlordProperties />} />
          <Route path="properties/:id" element={<LandlordPropertyDetails />} />
          <Route path="units" element={<LandlordUnits />} />
          <Route path="viewings" element={<LandlordViewings />} />
          <Route path="tenants" element={<LandlordTenants />} />
          <Route path="payments" element={<LandlordPayments />} />
          <Route path="reports" element={<LandlordReports />} />
          <Route path="messages" element={<LandlordMessages />} />
          <Route path="maintenance" element={<LandlordMaintenance />} />
          <Route path="analytics" element={<LandlordAnalytics />} />
          <Route path="settings" element={<LandlordSettings />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <RequireAuth allowedRoles={['admin']}>
            <DashboardLayout navItems={adminNav} userRole="admin" userName={user?.firstName ?? 'Admin'} userEmail={user?.email ?? ''}>
              <OutletWrapper />
            </DashboardLayout>
          </RequireAuth>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="units" element={<AdminUnits />} />
          <Route path="tenants" element={<AdminTenants />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="maintenance" element={<AdminMaintenance />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

      </Routes>
    </Router>
  );
}

function OutletWrapper() {
  return <Outlet />;
}
