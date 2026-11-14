import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const BASE = process.env.VERIFY_BASE ?? 'http://localhost:3000';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const stamp = Date.now();
const adminEmail = `qa-admin-${stamp}@example.test`;
const landlordEmail = `qa-landlord-${stamp}@example.test`;
const password = `Qa-${stamp}-Pass!`;

let failures = 0;
function check(name, ok, detail = '') {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
}

const hash = await bcrypt.hash(password, 12);
const admin = await prisma.user.create({
  data: { firstName: 'QA', lastName: 'Admin', email: adminEmail, role: 'admin', passwordHash: hash },
});
const landlord = await prisma.user.create({
  data: { firstName: 'QA', lastName: 'Landlord', email: landlordEmail, role: 'landlord', passwordHash: hash },
});

async function login(email) {
  const response = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

try {
  const adminLogin = await login(adminEmail);
  check('admin can log in', adminLogin.status === 200 && adminLogin.body?.success && typeof adminLogin.body?.token === 'string', `status ${adminLogin.status}`);
  const adminAuth = { Authorization: `Bearer ${adminLogin.body?.token ?? ''}` };

  for (const path of ['/api/admin/overview', '/api/admin/users', '/api/properties', '/api/units', '/api/tenants', '/api/payments', '/api/maintenance', '/api/messages']) {
    const response = await fetch(`${BASE}${path}`, { headers: adminAuth });
    const body = await response.json().catch(() => ({}));
    check(`GET ${path}`, response.status === 200 && body?.success === true, `status ${response.status}`);
  }

  const overview = await (await fetch(`${BASE}/api/admin/overview`, { headers: adminAuth })).json();
  const data = overview?.data ?? {};
  const requiredKeys = ['propertyCount', 'unitCount', 'occupiedUnits', 'vacantUnits', 'occupancyRate', 'landlordCount', 'accountCount', 'tenantCount', 'activeTenantCount', 'openMaintenance', 'pendingPayments', 'overduePayments', 'openReports', 'rentByStatus', 'recentProperties', 'recentReports', 'recentMaintenance'];
  check('overview returns every dashboard field', requiredKeys.every((key) => key in data), requiredKeys.filter((key) => !(key in data)).join(',') || 'all present');
  check('overview counts are integers', ['propertyCount', 'unitCount', 'occupiedUnits', 'vacantUnits', 'landlordCount', 'accountCount', 'tenantCount', 'openMaintenance'].every((key) => Number.isInteger(data[key])), '');
  check('overview lists are arrays', Array.isArray(data.recentProperties) && Array.isArray(data.recentReports) && Array.isArray(data.recentMaintenance), '');
  check('overview rent totals are numbers', ['paid', 'pending', 'overdue'].every((key) => Number.isFinite(data.rentByStatus?.[key])), JSON.stringify(data.rentByStatus));

  const usersResponse = await fetch(`${BASE}/api/admin/users`, { headers: adminAuth });
  const users = await usersResponse.json();
  const rows = Array.isArray(users?.data) ? users.data : [];
  check('account directory includes the new admin', rows.some((row) => row.id === admin.id), `${rows.length} accounts`);
  check('account directory hides password hashes', rows.every((row) => !('passwordHash' in row)), '');
  check('account rows carry association fields', rows.every((row) => 'propertyName' in row && 'landlordName' in row && 'propertyCount' in row), '');

  const properties = await (await fetch(`${BASE}/api/properties`, { headers: adminAuth })).json();
  const propertyRows = Array.isArray(properties?.data) ? properties.data : [];
  check('admin properties carry landlord name and created date', propertyRows.every((row) => typeof row.landlordName === 'string' && typeof row.createdAt === 'string'), `${propertyRows.length} properties`);

  const anon = await fetch(`${BASE}/api/admin/overview`);
  check('anonymous request is rejected', anon.status === 401, `status ${anon.status}`);

  const landlordLogin = await login(landlordEmail);
  const landlordAuth = { Authorization: `Bearer ${landlordLogin.body?.token ?? ''}` };
  for (const path of ['/api/admin/overview', '/api/admin/users']) {
    const response = await fetch(`${BASE}${path}`, { headers: landlordAuth });
    check(`landlord blocked from ${path}`, [401, 403].includes(response.status), `status ${response.status}`);
  }

  const wrongCurrent = await fetch(`${BASE}/api/users/me/password`, {
    method: 'POST',
    headers: { ...adminAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: 'not-the-password', newPassword: `${password}-next` }),
  });
  check('wrong current password is rejected', wrongCurrent.status === 401, `status ${wrongCurrent.status}`);

  const tooShort = await fetch(`${BASE}/api/users/me/password`, {
    method: 'POST',
    headers: { ...adminAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: password, newPassword: 'short' }),
  });
  check('short new password is rejected', tooShort.status === 400, `status ${tooShort.status}`);

  const nextPassword = `${password}-next`;
  const change = await fetch(`${BASE}/api/users/me/password`, {
    method: 'POST',
    headers: { ...adminAuth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword: password, newPassword: nextPassword }),
  });
  check('password change succeeds', change.status === 200, `status ${change.status}`);

  const relogin = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: nextPassword }),
  });
  check('new password works at login', relogin.status === 200, `status ${relogin.status}`);
} finally {
  await prisma.user.deleteMany({ where: { email: { in: [adminEmail, landlordEmail] } } }).catch(() => {});
  await prisma.$disconnect();
}

console.log(failures === 0 ? '\nALL ADMIN CHECKS PASSED' : `\n${failures} ADMIN CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
