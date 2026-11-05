import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from "express";
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes, randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import { prisma } from './src/lib/prisma';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'landlord' | 'tenant' | 'admin';
  phone?: string;
  emailVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  phoneVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  identityVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  propertyAuthorizationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  businessRegistrationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  incomeVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  payoutVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  passwordHash: string;
}
interface Report {
  id: string;
  reporterId: string;
  reporterRole: 'landlord' | 'tenant' | 'admin';
  targetType: 'landlord' | 'tenant' | 'property';
  targetId: string;
  targetName?: string;
  propertyId?: string;
  listingId?: string;
  transactionId?: string;
  tenantRef?: string;
  reason: string;
  message: string;
  riskBand: 'low' | 'medium' | 'high';
  escalateForReview: boolean;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolutionNote?: string;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
}
interface AuthRequest extends express.Request {
  user?: {
    sub: string;
    email: string;
    role: User['role'];
    firstName: string;
    lastName: string;
    iat?: number;
    exp?: number;
    jti?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'propmanage_dev_secret';
const JWT_EXPIRY = '2h';
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000'];

const ALLOWED_REGISTRATION_ROLES: Array<User['role']> = ['landlord', 'tenant'];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string) {
  return typeof password === 'string' && password.length >= 8;
}

function isVeryStrongPassword(password: string) {
  // At least 12 chars, one upper, one lower, one digit, one special
  return typeof password === 'string' && /(?=.{12,})(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(password);
}

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function readDatabaseOrFallback<T>(fallback: T, operation: () => Promise<T>): Promise<T> {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not configured; serving fallback data.');
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    console.warn('Database operation failed; serving fallback data:', error instanceof Error ? error.message : error);
    return fallback;
  }
}

function mapDbProperty(property: any): Property {
  return {
    id: property.id,
    landlordId: property.landlordId,
    name: property.name,
    address: property.address,
    city: property.city,
    state: property.state,
    units: property.units ?? 0,
    occupancy: property.occupancy ?? 0,
    status: property.status ?? 'Active',
    manager: property.manager ?? 'Acme Property Management',
  };
}

function mapDbUnit(unit: any): Unit {
  return {
    id: unit.id,
    propertyId: unit.propertyId,
    number: unit.number,
    floor: unit.floor ?? 1,
    bedrooms: unit.bedrooms ?? 1,
    bathrooms: unit.bathrooms ?? 1,
    rent: unit.rent ?? 0,
    status: unit.status ?? 'vacant',
    tenantId: unit.tenantId ?? undefined,
  };
}

function mapDbTenant(tenant: any): Tenant {
  return {
    id: tenant.id,
    landlordId: tenant.landlordId ?? undefined,
    userId: tenant.userId ?? undefined,
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    email: tenant.email,
    phone: tenant.phone ?? undefined,
    unitId: tenant.unitId ?? undefined,
    status: tenant.status ?? 'Applicant',
    leaseStart: tenant.leaseStart ? new Date(tenant.leaseStart).toISOString().split('T')[0] : undefined,
    leaseEnd: tenant.leaseEnd ? new Date(tenant.leaseEnd).toISOString().split('T')[0] : undefined,
    rent: tenant.rent ?? 0,
  };
}

const users: User[] = [
  {
    id: 'u-admin',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@propmanage.saas',
    role: 'admin',
    passwordHash: bcrypt.hashSync('password', 10),
  },
  {
    id: 'u-landlord',
    firstName: 'Landlord',
    lastName: 'Manager',
    email: 'landlord@propmanage.saas',
    role: 'landlord',
    passwordHash: bcrypt.hashSync('password', 10),
  },
  {
    id: 'u-tenant',
    firstName: 'Tenant',
    lastName: 'User',
    email: 'tenant@propmanage.saas',
    role: 'tenant',
    passwordHash: bcrypt.hashSync('password', 10),
  },
];

// Token revocation and login protections (in-memory)
const tokenBlacklist = new Set<string>();
const revokedBefore: Record<string, number> = {};
const loginAttempts: Record<string, { count: number; firstFailedAt: number }> = {};
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes


function createAuthToken(user: User) {
  const jti = randomUUID();
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY, jwtid: jti }
  );
}

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.header('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token is required.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    // reject if token jti is blacklisted
    if (payload?.jti && tokenBlacklist.has(payload.jti)) {
      return res.status(401).json({ success: false, error: 'Token has been revoked.' });
    }
    // reject if token issued before a user-wide revocation time
    if (payload?.sub && payload?.iat && revokedBefore[payload.sub] && payload.iat * 1000 < revokedBefore[payload.sub]) {
      return res.status(401).json({ success: false, error: 'Token has been revoked (user logout).' });
    }
    const authReq = req as AuthRequest;
    authReq.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      iat: payload.iat,
      exp: payload.exp,
      jti: payload.jti,
    };
    return next();
  } catch (error: any) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
}

function requireRole(...allowedRoles: User['role'][]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authReq = req as AuthRequest;
    if (!authReq.user || !allowedRoles.includes(authReq.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient role permissions.' });
    }
    next();
  };
}

function canAccessProperty(user: AuthRequest['user'], property: Property) {
  return user?.role === 'admin' || (user?.role === 'landlord' && property.landlordId === user.sub);
}

interface Property {
  id: string;
  landlordId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  units: number;
  occupancy: number;
  status: string;
  manager: string;
}

interface Unit {
  id: string;
  propertyId: string;
  number: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  status: string;
  tenantId?: string;
}

interface Tenant {
  id: string;
  landlordId?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  unitId?: string;
  status: string;
  leaseStart?: string;
  leaseEnd?: string;
  rent: number;
}

function canAccessTenant(user: AuthRequest['user'], tenant: Tenant) {
  if (user?.role === 'admin') return true;
  if (user?.role === 'tenant') return tenant.userId === user.sub;
  const unit = units.find((item) => item.id === tenant.unitId);
  const property = unit && properties.find((item) => item.id === unit.propertyId);
  return user?.role === 'landlord' && (tenant.landlordId === user.sub || property?.landlordId === user.sub);
}

interface TenantInvitation {
  tokenHash: string;
  landlordId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  unitId: string;
  leaseStart?: string;
  leaseEnd?: string;
  expiresAt: number;
  accepted: boolean;
}

interface Payment {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  method: string;
}

interface MaintenanceRequest {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
}

interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  tags: string[];
  ownerId?: string;
  url?: string;
}

const now = new Date();
const today = now.toISOString().split('T')[0];

const properties: Property[] = [
  {
    id: 'p1',
    landlordId: 'u-landlord',
    name: 'Sunset Villas',
    address: '123 Harbor Dr',
    city: 'Springfield',
    state: 'IL',
    units: 24,
    occupancy: 22,
    status: 'Active',
    manager: 'Acme Property Management',
  },
  {
    id: 'p2',
    landlordId: 'u-landlord',
    name: 'The Grand Apartments',
    address: '450 Main St',
    city: 'Springfield',
    state: 'IL',
    units: 16,
    occupancy: 16,
    status: 'Active',
    manager: 'Acme Property Management',
  },
];

const units: Unit[] = [
  { id: 'u1', propertyId: 'p1', number: '1A', floor: 1, bedrooms: 2, bathrooms: 1, rent: 1800, status: 'occupied', tenantId: 't3' },
  { id: 'u2', propertyId: 'p1', number: '2B', floor: 2, bedrooms: 1, bathrooms: 1, rent: 1500, status: 'vacant' },
  { id: 'u3', propertyId: 'p2', number: '4B', floor: 4, bedrooms: 2, bathrooms: 2, rent: 2400, status: 'occupied', tenantId: 't1' },
];

const tenants: Tenant[] = [
  { id: 't1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', phone: '(555) 123-4567', unitId: 'u3', status: 'Active', leaseStart: '2025-01-01', leaseEnd: '2026-12-31', rent: 2400 },
  { id: 't2', firstName: 'Sarah', lastName: 'Smith', email: 'sarah.s@example.com', phone: '(555) 987-6543', status: 'Applicant', rent: 0 },
  { id: 't3', firstName: 'Michael', lastName: 'Johnson', email: 'mjohnson@example.com', phone: '(555) 555-5555', unitId: 'u1', status: 'Active', leaseStart: '2024-07-01', leaseEnd: '2025-06-30', rent: 1800 },
];

const tenantInvitations: TenantInvitation[] = [];

const payments: Payment[] = [
  { id: 'pay1', tenantId: 't1', unitId: 'u3', amount: 2400, dueDate: '2026-06-01', paidDate: '2026-06-01', status: 'paid', method: 'Credit Card' },
  { id: 'pay2', tenantId: 't3', unitId: 'u1', amount: 1800, dueDate: '2026-06-15', status: 'pending', method: 'Bank Transfer' },
];

const maintenanceRequests: MaintenanceRequest[] = [
  { id: 'm1', propertyId: 'p1', unitId: 'u1', tenantId: 't3', title: 'HVAC not cooling', description: 'The air conditioning is blowing warm air all day.', status: 'open', priority: 'High', createdAt: '2026-06-10', updatedAt: '2026-06-10' },
  { id: 'm2', propertyId: 'p2', unitId: 'u3', tenantId: 't1', title: 'Leaky kitchen faucet', description: 'Faucet drips continuously after being turned off.', status: 'in_progress', priority: 'Medium', createdAt: '2026-06-05', updatedAt: '2026-06-12' },
];

const messages: Message[] = [
  { id: 'msg1', sender: 'tenant:michael', recipient: 'landlord', subject: 'Maintenance request follow-up', body: 'Any update on the HVAC issue in Apt 1A?', createdAt: '2026-06-11T08:30:00Z', read: false },
  { id: 'msg2', sender: 'landlord', recipient: 'tenant:john', subject: 'Upcoming inspection', body: 'Your unit will be inspected on June 20th.', createdAt: '2026-06-09T14:20:00Z', read: true },
];

const documents: Document[] = [
  { id: 'd1', name: 'Lease_Agreement_2026-2027.pdf', type: 'Lease', date: '2026-01-15', size: '2.4 MB', tags: ['2026-02-01', '2027-01-31'], ownerId: undefined },
  { id: 'd2', name: 'Rent_Receipt_June_2026.pdf', type: 'Receipt', date: '2026-06-01', size: '120 KB', tags: [], ownerId: undefined },
];

function createId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com', 'https://purecatamphetamine.github.io'],
        connectSrc: [
          "'self'",
          'https://api.github.com',
          ...(process.env.NODE_ENV === 'production' ? [] : ['ws://localhost:*', 'ws://127.0.0.1:*']),
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : DEFAULT_ALLOWED_ORIGINS;

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy does not allow access from this origin.'));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many login attempts, please try again later.' },
  });

  const inviteCreateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many invitations created. Please try again later.' },
  });

  const inviteAcceptLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many attempts. Please try again later.' },
  });

  app.use('/api', apiLimiter);
  app.use('/api/auth', authLimiter);

  const publicApiPaths = ['/api/health', '/api/auth/login', '/api/auth/register', '/api/contact'];
  const publicInvitationPath = /^\/api\/tenant-invitations\/[a-f0-9]{64}(?:\/accept)?$/;
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') && !publicApiPaths.includes(req.path) && !publicInvitationPath.test(req.path)) {
      return authMiddleware(req, res, next);
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  app.post('/api/contact', async (req, res) => {
    const name = sanitizeString(req.body?.name);
    const email = sanitizeString(req.body?.email).toLowerCase();
    const phone = sanitizeString(req.body?.phone);
    const reason = sanitizeString(req.body?.reason);
    const message = sanitizeString(req.body?.message);
    const allowedReasons = ['Sales & Pricing', 'Technical Support', 'Partnership inquiry', 'Other'];

    if (!name || name.length > 120 || !isValidEmail(email) || email.length > 254 || !allowedReasons.includes(reason) || !message || message.length > 4000) {
      return res.status(400).json({ success: false, error: 'Please provide a valid name, email, inquiry type, and message.' });
    }

    try {
      const inquiry = await prisma.contactInquiry.create({
        data: { name, email, phone: phone || undefined, reason, message },
        select: { id: true, createdAt: true },
      });
      return res.status(201).json({ success: true, inquiry });
    } catch (error) {
      console.error('Unable to save contact inquiry:', error);
      return res.status(503).json({ success: false, error: 'We could not receive your message just now. Please try again shortly or email us directly.' });
    }
  });

  app.post('/api/reports', authMiddleware, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const {
      targetType,
      targetId,
      targetName,
      propertyId,
      listingId,
      transactionId,
      tenantRef,
      reason,
      message: submittedMessage,
      details,
      riskBand,
      escalateForReview,
    } = req.body;
    const message = submittedMessage ?? details;

    if (!targetType || !targetId || !reason || !message) {
      return res.status(400).json({
        success: false,
        error: 'targetType, targetId, reason, and message are required.',
      });
    }

    if (!['landlord', 'tenant', 'property'].includes(targetType)) {
      return res.status(400).json({ success: false, error: 'Invalid report target type.' });
    }

    const normalizedRiskBand = ['low', 'medium', 'high'].includes(riskBand) ? riskBand : 'medium';

    if (user.role === 'tenant' && targetType !== 'landlord') {
      return res.status(403).json({
        success: false,
        error: 'Tenants can only report landlords.',
      });
    }

    if (user.role === 'landlord' && targetType !== 'tenant') {
      return res.status(403).json({
        success: false,
        error: 'Landlords can only report tenants.',
      });
    }

    try {
      if (user.role === 'tenant') {
        const tenant = await prisma.tenant.findFirst({
          where: { userId: user.sub },
          select: { landlordId: true },
        });
        if (!tenant?.landlordId || tenant.landlordId !== targetId) {
          return res.status(403).json({ success: false, error: 'You can only report the landlord linked to your rental account.' });
        }
      }
      if (user.role === 'landlord') {
        const tenant = await prisma.tenant.findFirst({
          where: { id: targetId, landlordId: user.sub },
          select: { id: true },
        });
        if (!tenant) {
          return res.status(403).json({ success: false, error: 'You can only report a tenant linked to your properties.' });
        }
      }

      const report = await prisma.report.create({
        data: {
          reporterId: user.sub,
          reporterRole: user.role,
          targetType,
          targetId: sanitizeString(targetId),
          targetName: sanitizeString(targetName) || undefined,
          propertyId: sanitizeString(propertyId) || undefined,
          listingId: sanitizeString(listingId) || undefined,
          transactionId: sanitizeString(transactionId) || undefined,
          tenantRef: sanitizeString(tenantRef) || undefined,
          reason: sanitizeString(reason),
          message: sanitizeString(message),
          riskBand: normalizedRiskBand,
          escalateForReview: typeof escalateForReview === 'boolean' ? escalateForReview : true,
        },
      });

      return res.status(201).json({ success: true, report, message: 'Report submitted successfully.' });
    } catch (error) {
      console.error('Unable to save report:', error);
      return res.status(500).json({ success: false, error: 'Unable to save report.' });
    }
  });

  app.get('/api/reports', authMiddleware, async (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    try {
      const reports = await prisma.report.findMany({
        where: user.role === 'admin' ? undefined : { reporterId: user.sub },
        include: {
          reporter: { select: { firstName: true, lastName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      const reportsWithTarget = await Promise.all(reports.map(async (report) => {
        let targetUser = report.targetType === 'landlord'
          ? await prisma.user.findUnique({
            where: { id: report.targetId },
            select: { id: true, firstName: true, lastName: true, trustScore: true, blacklisted: true },
          })
          : null;

        if (report.targetType === 'tenant') {
          const tenant = await prisma.tenant.findUnique({
            where: { id: report.targetId },
            select: { user: { select: { id: true, firstName: true, lastName: true, trustScore: true, blacklisted: true } } },
          });
          targetUser = tenant?.user ?? await prisma.user.findUnique({
            where: { id: report.targetId },
            select: { id: true, firstName: true, lastName: true, trustScore: true, blacklisted: true },
          });
        }

        return {
          ...report,
          targetProfile: targetUser,
        };
      }));

      return res.json({ success: true, reports: reportsWithTarget });
    } catch (error) {
      console.error('Unable to load reports:', error);
      return res.status(500).json({ success: false, error: 'Unable to load reports.' });
    }
  });

  app.patch('/api/reports/:id', authMiddleware, requireRole('admin'), async (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });

    const { status, trustAdjustment, blacklisted, resolutionNote } = req.body;
    const validStatuses = ['open', 'reviewing', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'A valid report status is required.' });
    }
    if (trustAdjustment !== undefined && (!Number.isInteger(trustAdjustment) || trustAdjustment < -100 || trustAdjustment > 100)) {
      return res.status(400).json({ success: false, error: 'Trust adjustment must be a whole number from -100 to 100.' });
    }
    if (blacklisted !== undefined && typeof blacklisted !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Blacklist status must be true or false.' });
    }

    try {
      const result = await prisma.$transaction(async (transaction) => {
        const existingReport = await transaction.report.findUnique({ where: { id: req.params.id } });
        if (!existingReport) return null;

        let targetUser = existingReport.targetType === 'landlord'
          ? await transaction.user.findUnique({ where: { id: existingReport.targetId } })
          : null;
        if (existingReport.targetType === 'tenant') {
          const tenant = await transaction.tenant.findUnique({
            where: { id: existingReport.targetId },
            include: { user: true },
          });
          targetUser = tenant?.user ?? await transaction.user.findUnique({ where: { id: existingReport.targetId } });
        }

        if ((trustAdjustment !== undefined || blacklisted !== undefined) && !targetUser) {
          throw new Error('This report target does not have a linked platform account for trust review.');
        }

        const updatedReport = await transaction.report.update({
          where: { id: existingReport.id },
          data: {
            status,
            resolutionNote: sanitizeString(resolutionNote) || null,
            reviewedById: status === 'open' ? null : user.sub,
            reviewedAt: status === 'open' ? null : new Date(),
          },
        });

        let updatedTarget = targetUser;
        if (targetUser && (trustAdjustment !== undefined || blacklisted !== undefined)) {
          const trustScore = trustAdjustment === undefined
            ? targetUser.trustScore
            : Math.max(0, Math.min(100, targetUser.trustScore + trustAdjustment));
          updatedTarget = await transaction.user.update({
            where: { id: targetUser.id },
            data: {
              trustScore,
              ...(blacklisted === undefined ? {} : { blacklisted }),
            },
          });
        }

        return {
          report: updatedReport,
          targetProfile: updatedTarget && {
            id: updatedTarget.id,
            firstName: updatedTarget.firstName,
            lastName: updatedTarget.lastName,
            trustScore: updatedTarget.trustScore,
            blacklisted: updatedTarget.blacklisted,
          },
        };
      });

      if (!result) return res.status(404).json({ success: false, error: 'Report not found.' });
      return res.json({ success: true, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update report.';
      if (message.includes('does not have a linked platform account')) {
        return res.status(400).json({ success: false, error: message });
      }
      console.error('Unable to update report:', error);
      return res.status(500).json({ success: false, error: 'Unable to update report.' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    const firstName = sanitizeString(req.body.firstName);
    const lastName = sanitizeString(req.body.lastName);
    const email = sanitizeString(req.body.email).toLowerCase();
    const password = sanitizeString(req.body.password);
    const phone = sanitizeString(req.body.phone) || undefined;
    const role = sanitizeString(req.body.role) as User['role'];

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'First name, last name, email, password, and role are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }
    if (!ALLOWED_REGISTRATION_ROLES.includes(role)) {
      return res.status(403).json({ success: false, error: 'Registration is not allowed for this role.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const dbUser = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          passwordHash,
          role,
          phone,
          emailVerificationStatus: 'pending',
          phoneVerificationStatus: phone ? 'pending' : 'not_started',
          identityVerificationStatus: 'not_started',
          ...(role === 'landlord' ? {
            propertyAuthorizationStatus: 'not_started',
            businessRegistrationStatus: 'not_started',
            payoutVerificationStatus: 'not_started',
          } : {
            incomeVerificationStatus: 'not_started',
          }),
        },
      });
      const newUser: User = { ...dbUser, phone: dbUser.phone ?? undefined };
      users.push(newUser);
      const token = createAuthToken(newUser);
      return res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          emailVerificationStatus: newUser.emailVerificationStatus,
          phoneVerificationStatus: newUser.phoneVerificationStatus,
          identityVerificationStatus: newUser.identityVerificationStatus,
          propertyAuthorizationStatus: newUser.propertyAuthorizationStatus,
          businessRegistrationStatus: newUser.businessRegistrationStatus,
          incomeVerificationStatus: newUser.incomeVerificationStatus,
          payoutVerificationStatus: newUser.payoutVerificationStatus,
        },
        token,
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ success: false, error: 'Email is already registered.' });
      }
      console.error('Unable to register account:', error);
      return res.status(503).json({ success: false, error: 'Account service is temporarily unavailable. Please try again shortly.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const email = sanitizeString(req.body.email).toLowerCase();
    const password = sanitizeString(req.body.password);

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    // Lockout check
    const attempt = loginAttempts[email];
    if (attempt && attempt.count >= MAX_LOGIN_ATTEMPTS && Date.now() - attempt.firstFailedAt < LOCK_WINDOW_MS) {
      return res.status(429).json({ success: false, error: 'Too many failed login attempts. Please try again later.' });
    }

    let user: User | null;
    try {
      const dbUser = await prisma.user.findUnique({ where: { email } });
      user = dbUser ? { ...dbUser, phone: dbUser.phone ?? undefined } : null;
    } catch (error) {
      console.error('Unable to load account for login:', error);
      return res.status(503).json({ success: false, error: 'Account service is temporarily unavailable. Please try again shortly.' });
    }
    if (!user) {
      // increment failed attempts
      if (!loginAttempts[email]) loginAttempts[email] = { count: 1, firstFailedAt: Date.now() };
      else loginAttempts[email].count += 1;
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      if (!loginAttempts[email]) loginAttempts[email] = { count: 1, firstFailedAt: Date.now() };
      else loginAttempts[email].count += 1;
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // successful login - reset attempts
    if (loginAttempts[email]) delete loginAttempts[email];

    const token = createAuthToken(user);
    res.json({ success: true, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role }, token });
  });

  app.post('/api/auth/logout', (req, res) => {
    const authReq = req as AuthRequest;
    const jti = authReq.user?.jti;
    if (jti) tokenBlacklist.add(jti);
    return res.json({ success: true, message: 'Logged out successfully.' });
  });

  // Invalidate all tokens for the current user
  app.post('/api/auth/logout-all', (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ success: false, error: 'Not authenticated.' });
    revokedBefore[authReq.user.sub] = Date.now();
    return res.json({ success: true, message: 'All sessions for this user have been invalidated.' });
  });

  // Admin emergency password rotation (requires ADMIN_ROTATE_SECRET header)
  app.post('/api/auth/rotate-admin-password', async (req, res) => {
    const adminSecret = req.header('x-admin-secret');
    if (!process.env.ADMIN_ROTATE_SECRET || adminSecret !== process.env.ADMIN_ROTATE_SECRET) {
      return res.status(403).json({ success: false, error: 'Forbidden. ADMIN_ROTATE_SECRET is required.' });
    }
    const { newPassword } = req.body;
    if (!newPassword || !isVeryStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, error: 'New password must be at least 12 chars and include upper/lower/number/special.' });
    }
    const adminUser = users.find((u) => u.role === 'admin');
    if (!adminUser) return res.status(404).json({ success: false, error: 'Admin user not found.' });
    adminUser.passwordHash = await bcrypt.hash(newPassword, 12);
    // revoke all admin tokens
    revokedBefore[adminUser.id] = Date.now();
    return res.json({ success: true, message: 'Admin password rotated and active sessions revoked. Please sign in with the new password.' });
  });

  app.get('/api/auth/me', (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }
    res.json({ success: true, user: authReq.user });
  });

  app.post('/api/tenant-invitations', inviteCreateLimiter, requireRole('landlord'), async (req, res) => {
    const authReq = req as AuthRequest;
    const firstName = sanitizeString(req.body.firstName);
    const lastName = sanitizeString(req.body.lastName);
    const email = sanitizeString(req.body.email).toLowerCase();
    const phone = sanitizeString(req.body.phone) || undefined;
    const unitId = sanitizeString(req.body.unitId);
    const leaseStart = sanitizeString(req.body.leaseStart) || undefined;
    const leaseEnd = sanitizeString(req.body.leaseEnd) || undefined;

    if (!firstName || !lastName || !email || !unitId) {
      return res.status(400).json({ success: false, error: 'First name, last name, email, and unit are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    const dbInvite = await readDatabaseOrFallback(undefined, async () => {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return { type: 'error', status: 409, message: 'An account already exists for this email address.' };
      }

      const activeInvite = await prisma.tenantInvitation.findFirst({
        where: {
          email,
          accepted: false,
          expiresAt: { gt: new Date() },
        },
      });
      if (activeInvite) {
        return { type: 'error', status: 409, message: 'An active invitation already exists for this email address.' };
      }

      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
        include: { property: true },
      });
      if (!unit || !unit.property || unit.property.landlordId !== authReq.user!.sub) {
        return { type: 'error', status: 404, message: 'Unit not found in your properties.' };
      }
      if (unit.status !== 'vacant' || unit.tenantId) {
        return { type: 'error', status: 409, message: 'Choose a vacant unit with no tenant assigned.' };
      }

      const unitInvite = await prisma.tenantInvitation.findFirst({
        where: {
          unitId,
          accepted: false,
          expiresAt: { gt: new Date() },
        },
      });
      if (unitInvite) {
        return { type: 'error', status: 409, message: 'This unit already has an active invitation.' };
      }

      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.tenantInvitation.create({
        data: {
          landlordId: authReq.user!.sub,
          email,
          firstName,
          lastName,
          phone: phone || null,
          unitId,
          leaseStart: leaseStart ? new Date(leaseStart) : null,
          leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
          tokenHash,
          expiresAt,
          accepted: false,
        },
      });

      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const inviteUrl = `${appUrl}/invite/${token}`;
      let emailSent = false;
      if (process.env.RESEND_API_KEY) {
        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'PropManage <onboarding@resend.dev>',
              to: [email],
              subject: 'You are invited to your tenant portal',
              html: `<p>You have been invited to join your tenant portal.</p><p><a href="${inviteUrl}">Review invitation</a></p><p>This link expires in 7 days.</p>`,
            }),
          });
          emailSent = emailResponse.ok;
        } catch {
          emailSent = false;
        }
      }

      return {
        type: 'success',
        status: 201,
        data: { email, emailSent, inviteUrl, expiresAt: expiresAt.getTime() },
      };
    });

    if (dbInvite && dbInvite.type === 'error') {
      return res.status(dbInvite.status).json({ success: false, error: dbInvite.message });
    }
    if (dbInvite && dbInvite.type === 'success') {
      return res.status(dbInvite.status).json({ success: true, data: dbInvite.data });
    }

    if (users.some((user) => user.email === email)) {
      return res.status(409).json({ success: false, error: 'An account already exists for this email address.' });
    }
    if (tenantInvitations.some((invite) => invite.email === email && !invite.accepted && invite.expiresAt > Date.now())) {
      return res.status(409).json({ success: false, error: 'An active invitation already exists for this email address.' });
    }

    const unit = units.find((item) => item.id === unitId);
    const property = unit && properties.find((item) => item.id === unit.propertyId);
    if (!unit || !property || property.landlordId !== authReq.user?.sub) {
      return res.status(404).json({ success: false, error: 'Unit not found in your properties.' });
    }
    if (unit.status.toLowerCase() !== 'vacant' || unit.tenantId) {
      return res.status(409).json({ success: false, error: 'Choose a vacant unit with no tenant assigned.' });
    }
    if (tenantInvitations.some((invite) => invite.unitId === unitId && !invite.accepted && invite.expiresAt > Date.now())) {
      return res.status(409).json({ success: false, error: 'This unit already has an active invitation.' });
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    tenantInvitations.push({
      tokenHash,
      landlordId: authReq.user!.sub,
      email,
      firstName,
      lastName,
      phone,
      unitId,
      leaseStart,
      leaseEnd,
      expiresAt,
      accepted: false,
    });

    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const inviteUrl = `${appUrl}/invite/${token}`;
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'PropManage <onboarding@resend.dev>',
            to: [email],
            subject: 'You are invited to your tenant portal',
            html: `<p>You have been invited to join your tenant portal.</p><p><a href="${inviteUrl}">Review invitation</a></p><p>This link expires in 7 days.</p>`,
          }),
        });
        emailSent = emailResponse.ok;
      } catch {
        emailSent = false;
      }
    }

    res.status(201).json({
      success: true,
      data: { email, emailSent, inviteUrl, expiresAt },
    });
  });

  app.get('/api/tenant-invitations/:token', async (req, res) => {
    const tokenHash = createHash('sha256').update(req.params.token).digest('hex');

    const dbInvite = await readDatabaseOrFallback(undefined, async () => {
      const invite = await prisma.tenantInvitation.findFirst({
        where: {
          tokenHash,
          accepted: false,
          expiresAt: { gt: new Date() },
        },
      });
      if (!invite) return null;
      const unit = await prisma.unit.findUnique({ where: { id: invite.unitId } });
      const property = unit ? await prisma.property.findUnique({ where: { id: unit.propertyId } }) : null;
      if (!unit || !property || property.landlordId !== invite.landlordId) {
        return null;
      }
      return {
        success: true,
        data: {
          email: invite.email,
          firstName: invite.firstName,
          lastName: invite.lastName,
          propertyName: property.name,
          unitNumber: unit.number,
          rent: unit.rent,
          expiresAt: invite.expiresAt.getTime(),
        },
      };
    });

    if (dbInvite !== undefined) {
      if (!dbInvite) {
        return res.status(404).json({ success: false, error: 'This invitation is invalid or has expired.' });
      }
      return res.json(dbInvite);
    }

    const invite = tenantInvitations.find((item) => item.tokenHash === tokenHash);
    if (!invite || invite.accepted || invite.expiresAt <= Date.now()) {
      return res.status(404).json({ success: false, error: 'This invitation is invalid or has expired.' });
    }

    const unit = units.find((item) => item.id === invite.unitId);
    const property = unit && properties.find((item) => item.id === unit.propertyId);
    if (!unit || !property || property.landlordId !== invite.landlordId) {
      return res.status(404).json({ success: false, error: 'This invitation is no longer available.' });
    }
    res.json({
      success: true,
      data: {
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
        propertyName: property.name,
        unitNumber: unit.number,
        rent: unit.rent,
        expiresAt: invite.expiresAt,
      },
    });
  });

  app.post('/api/tenant-invitations/:token/accept', inviteAcceptLimiter, async (req, res) => {
    const tokenHash = createHash('sha256').update(req.params.token).digest('hex');

    const dbResult = await readDatabaseOrFallback(undefined, async () => {
      const invite = await prisma.tenantInvitation.findFirst({
        where: {
          tokenHash,
          accepted: false,
          expiresAt: { gt: new Date() },
        },
      });
      if (!invite) return { type: 'error', status: 404, message: 'This invitation is invalid or has expired.' };

      const password = sanitizeString(req.body.password);
      if (!isStrongPassword(password)) {
        return { type: 'error', status: 400, message: 'Password must be at least 8 characters long.' };
      }
      if (await prisma.user.findUnique({ where: { email: invite.email } })) {
        return { type: 'error', status: 409, message: 'An account already exists for this invitation email.' };
      }

      const unit = await prisma.unit.findUnique({
        where: { id: invite.unitId },
        include: { property: true },
      });
      if (!unit || !unit.property || unit.property.landlordId !== invite.landlordId || unit.status !== 'vacant' || unit.tenantId) {
        return { type: 'error', status: 409, message: 'The unit is no longer available. Contact your landlord.' };
      }

      const newUser = await prisma.user.create({
        data: {
          firstName: invite.firstName,
          lastName: invite.lastName,
          email: invite.email,
          role: 'tenant',
          passwordHash: await bcrypt.hash(password, 10),
        },
      });

      const tenant = await prisma.tenant.create({
        data: {
          landlordId: invite.landlordId,
          userId: newUser.id,
          firstName: invite.firstName,
          lastName: invite.lastName,
          email: invite.email,
          phone: invite.phone,
          unitId: unit.id,
          status: 'Active',
          leaseStart: invite.leaseStart,
          leaseEnd: invite.leaseEnd,
          rent: unit.rent,
        },
      });

      await prisma.unit.update({
        where: { id: unit.id },
        data: {
          tenantId: tenant.id,
          status: 'occupied',
        },
      });

      await prisma.property.update({
        where: { id: unit.propertyId },
        data: {
          occupancy: { increment: 1 },
        },
      });

      await prisma.tenantInvitation.update({
        where: { id: invite.id },
        data: { accepted: true },
      });

      return {
        type: 'success',
        status: 201,
        data: {
          user: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role,
          },
          token: createAuthToken({
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role,
            passwordHash: newUser.passwordHash,
          }),
        },
      };
    });

    if (dbResult && dbResult.type === 'error') {
      return res.status(dbResult.status).json({ success: false, error: dbResult.message });
    }
    if (dbResult && dbResult.type === 'success') {
      return res.status(dbResult.status).json({ success: true, ...dbResult.data });
    }

    const invite = tenantInvitations.find((item) => item.tokenHash === tokenHash);
    if (!invite || invite.accepted || invite.expiresAt <= Date.now()) {
      return res.status(404).json({ success: false, error: 'This invitation is invalid or has expired.' });
    }
    const password = sanitizeString(req.body.password);
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }
    if (users.some((user) => user.email === invite.email)) {
      return res.status(409).json({ success: false, error: 'An account already exists for this invitation email.' });
    }

    const unit = units.find((item) => item.id === invite.unitId);
    const property = unit && properties.find((item) => item.id === unit.propertyId);
    if (!unit || !property || property.landlordId !== invite.landlordId || unit.status.toLowerCase() !== 'vacant' || unit.tenantId) {
      return res.status(409).json({ success: false, error: 'The unit is no longer available. Contact your landlord.' });
    }

    const newUser: User = {
      id: createId('user'),
      firstName: invite.firstName,
      lastName: invite.lastName,
      email: invite.email,
      role: 'tenant',
      passwordHash: bcrypt.hashSync(password, 10),
    };
    const tenant: Tenant = {
      id: createId('tenant'),
      landlordId: invite.landlordId,
      userId: newUser.id,
      firstName: invite.firstName,
      lastName: invite.lastName,
      email: invite.email,
      phone: invite.phone,
      unitId: unit.id,
      status: 'Active',
      leaseStart: invite.leaseStart,
      leaseEnd: invite.leaseEnd,
      rent: unit.rent,
    };

    users.push(newUser);
    tenants.push(tenant);
    unit.tenantId = tenant.id;
    unit.status = 'occupied';
    property.occupancy = Math.min(property.occupancy + 1, property.units);
    invite.accepted = true;

    res.status(201).json({
      success: true,
      user: { id: newUser.id, firstName: newUser.firstName, lastName: newUser.lastName, email: newUser.email, role: newUser.role },
      token: createAuthToken(newUser),
    });
  });

  app.get('/api/dashboard-stats', async (_req, res) => {
    const dbStats = await readDatabaseOrFallback(undefined, async () => {
      const [propertyCount, unitCount, tenantCount, openMaintenance, pendingPayments] = await Promise.all([
        prisma.property.count(),
        prisma.unit.count(),
        prisma.tenant.count({ where: { status: 'Active' } }),
        prisma.maintenanceRequest.count({ where: { status: { not: 'closed' } } }),
        prisma.payment.count({ where: { status: 'pending' } }),
      ]);

      return {
        propertyCount,
        unitCount,
        tenantCount,
        openMaintenance,
        pendingPayments,
      };
    });

    if (dbStats !== undefined) {
      return res.json({ success: true, data: dbStats });
    }

    return res.json({
      success: true,
      data: {
        propertyCount: properties.length,
        unitCount: units.length,
        tenantCount: tenants.filter((t) => t.status === 'Active').length,
        openMaintenance: maintenanceRequests.filter((m) => m.status !== 'closed').length,
        pendingPayments: payments.filter((p) => p.status === 'pending').length,
      },
    });
  });

  app.get('/api/properties', async (req, res) => {
    const user = (req as AuthRequest).user;

    const dbProperties = await readDatabaseOrFallback(undefined, async () => {
      const where = user?.role === 'admin' ? {} : { landlordId: user?.sub ?? '' };
      const records = await prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return records.map(mapDbProperty);
    });

    if (dbProperties !== undefined) {
      return res.json({ success: true, data: dbProperties });
    }

    const visibleProperties = user?.role === 'admin'
      ? properties
      : properties.filter((property) => property.landlordId === user?.sub);
    res.json({ success: true, data: visibleProperties });
  });

  app.get('/api/properties/:id', async (req, res) => {
    const dbProperty = await readDatabaseOrFallback(undefined, async () => {
      const record = await prisma.property.findUnique({
        where: { id: req.params.id },
      });

      if (!record) return null;
      const user = (req as AuthRequest).user;
      if (user?.role !== 'admin' && record.landlordId !== user?.sub) return null;
      return mapDbProperty(record);
    });

    if (dbProperty !== undefined) {
      if (dbProperty === null) {
        return res.status(404).json({ success: false, error: 'Property not found.' });
      }
      return res.json({ success: true, data: dbProperty });
    }

    const property = properties.find((item) => item.id === req.params.id);
    if (!property || !canAccessProperty((req as AuthRequest).user, property)) {
      return res.status(404).json({ success: false, error: 'Property not found.' });
    }
    res.json({ success: true, data: property });
  });

  app.post('/api/properties', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user;
    const { name, address, city, state, units: unitCount, manager } = req.body;
    if (!name || !address || !city || !state) {
      return res.status(400).json({ success: false, error: 'Name, address, city, and state are required.' });
    }

    const dbProperty = await readDatabaseOrFallback(undefined, async () => {
      const record = await prisma.property.create({
        data: {
          landlordId: user!.sub,
          name,
          address,
          city,
          state,
          units: Number(unitCount ?? 0),
          occupancy: 0,
          status: 'Active',
          manager: manager || 'Acme Property Management',
        },
      });
      return mapDbProperty(record);
    });

    if (dbProperty !== undefined) {
      return res.status(201).json({ success: true, data: dbProperty });
    }

    const property: Property = {
      id: createId('prop'),
      landlordId: user!.sub,
      name,
      address,
      city,
      state,
      units: unitCount ?? 0,
      occupancy: 0,
      status: 'Active',
      manager: manager || 'Acme Property Management',
    };
    properties.push(property);
    res.status(201).json({ success: true, data: property });
  });

  app.put('/api/properties/:id', (req, res) => {
    const property = properties.find((item) => item.id === req.params.id);
    if (!property || !canAccessProperty((req as AuthRequest).user, property)) {
      return res.status(404).json({ success: false, error: 'Property not found.' });
    }
    const { name, address, city, state, units: unitCount, occupancy, status, manager } = req.body;
    Object.assign(property, {
      name: name ?? property.name,
      address: address ?? property.address,
      city: city ?? property.city,
      state: state ?? property.state,
      units: unitCount ?? property.units,
      occupancy: occupancy ?? property.occupancy,
      status: status ?? property.status,
      manager: manager ?? property.manager,
    });
    res.json({ success: true, data: property });
  });

  app.delete('/api/properties/:id', (req, res) => {
    const index = properties.findIndex((item) => item.id === req.params.id);
    if (index === -1 || !canAccessProperty((req as AuthRequest).user, properties[index])) {
      return res.status(404).json({ success: false, error: 'Property not found.' });
    }
    if (units.some((unit) => unit.propertyId === req.params.id)) {
      return res.status(409).json({ success: false, error: 'Remove this property’s units before deleting the property.' });
    }
    properties.splice(index, 1);
    res.json({ success: true, message: 'Property deleted.' });
  });

  app.get('/api/units', async (req, res) => {
    const { propertyId, status } = req.query;
    const user = (req as AuthRequest).user;

    const dbUnits = await readDatabaseOrFallback(undefined, async () => {
      const where: any = {};
      if (propertyId) where.propertyId = String(propertyId);
      if (status) where.status = String(status);

      if (user?.role === 'landlord') {
        const ownedProperties = await prisma.property.findMany({ where: { landlordId: user.sub }, select: { id: true } });
        const propertyIds = ownedProperties.map((item) => item.id);
        where.propertyId = propertyId ? String(propertyId) : { in: propertyIds };
      }

      if (user?.role === 'tenant') {
        const tenant = await prisma.tenant.findFirst({ where: { userId: user.sub } });
        where.id = tenant?.unitId ?? 'no-match';
      }

      const records = await prisma.unit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return records.map(mapDbUnit);
    });

    if (dbUnits !== undefined) {
      return res.json({ success: true, data: dbUnits });
    }

    let results = user?.role === 'admin'
      ? [...units]
      : user?.role === 'tenant'
        ? units.filter((unit) => tenants.some((tenant) => tenant.userId === user.sub && tenant.unitId === unit.id))
        : units.filter((unit) => properties.some((property) => property.id === unit.propertyId && property.landlordId === user?.sub));
    if (propertyId) {
      results = results.filter((unit) => unit.propertyId === propertyId);
    }
    if (status) {
      results = results.filter((unit) => unit.status === status);
    }
    res.json({ success: true, data: results });
  });

  app.post('/api/units', requireRole('landlord', 'admin'), (req, res) => {
    const { propertyId, number, floor, bedrooms, bathrooms, rent, status, tenantId } = req.body;
    if (!propertyId || !number) {
      return res.status(400).json({ success: false, error: 'Property ID and unit number are required.' });
    }
    const property = properties.find((item) => item.id === propertyId);
    if (!property || !canAccessProperty((req as AuthRequest).user, property)) {
      return res.status(404).json({ success: false, error: 'Property not found.' });
    }
    const unit: Unit = {
      id: createId('unit'),
      propertyId,
      number,
      floor: Number(floor || 1),
      bedrooms: Number(bedrooms || 1),
      bathrooms: Number(bathrooms || 1),
      rent: Number(rent || 0),
      status: status || 'vacant',
      tenantId,
    };
    units.push(unit);
    res.status(201).json({ success: true, data: unit });
  });

  app.put('/api/units/:id', (req, res) => {
    const unit = units.find((item) => item.id === req.params.id);
    const currentProperty = properties.find((property) => property.id === unit?.propertyId);
    if (!unit || !currentProperty || !canAccessProperty((req as AuthRequest).user, currentProperty)) {
      return res.status(404).json({ success: false, error: 'Unit not found.' });
    }
    const { propertyId, number, floor, bedrooms, bathrooms, rent, status, tenantId } = req.body;
    const nextProperty = properties.find((property) => property.id === (propertyId ?? unit.propertyId));
    if (!nextProperty || !canAccessProperty((req as AuthRequest).user, nextProperty)) {
      return res.status(404).json({ success: false, error: 'Property not found.' });
    }
    Object.assign(unit, {
      propertyId: propertyId ?? unit.propertyId,
      number: number ?? unit.number,
      floor: floor !== undefined ? Number(floor) : unit.floor,
      bedrooms: bedrooms !== undefined ? Number(bedrooms) : unit.bedrooms,
      bathrooms: bathrooms !== undefined ? Number(bathrooms) : unit.bathrooms,
      rent: rent !== undefined ? Number(rent) : unit.rent,
      status: status ?? unit.status,
      tenantId: tenantId ?? unit.tenantId,
    });
    res.json({ success: true, data: unit });
  });

  app.delete('/api/units/:id', (req, res) => {
    const index = units.findIndex((item) => item.id === req.params.id);
    const property = index === -1 ? undefined : properties.find((item) => item.id === units[index].propertyId);
    if (index === -1 || !property || !canAccessProperty((req as AuthRequest).user, property)) {
      return res.status(404).json({ success: false, error: 'Unit not found.' });
    }
    units.splice(index, 1);
    res.json({ success: true, message: 'Unit deleted.' });
  });

  app.get('/api/tenants', async (req, res) => {
    const { status } = req.query;
    const user = (req as AuthRequest).user;

    const dbTenants = await readDatabaseOrFallback(undefined, async () => {
      const where: any = {};
      if (status) where.status = String(status);
      if (user?.role === 'tenant') {
        where.userId = user.sub;
      }
      if (user?.role === 'landlord') {
        const ownedProperties = await prisma.property.findMany({ where: { landlordId: user.sub }, select: { id: true } });
        const propertyIds = ownedProperties.map((item) => item.id);
        const unitIds = await prisma.unit.findMany({
          where: { propertyId: { in: propertyIds } },
          select: { id: true },
        });
        where.unitId = { in: unitIds.map((item) => item.id) };
      }

      const records = await prisma.tenant.findMany({
        where,
        include: { landlord: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return records.map((record) => ({ ...mapDbTenant(record), landlord: record.landlord }));
    });

    if (dbTenants !== undefined) {
      return res.json({ success: true, data: dbTenants });
    }

    let results = user?.role === 'admin'
      ? [...tenants]
      : user?.role === 'tenant'
        ? tenants.filter((tenant) => tenant.userId === user.sub)
        : tenants.filter((tenant) => canAccessTenant(user, tenant));
    if (status) {
      results = results.filter((tenant) => tenant.status === status);
    }
    res.json({ success: true, data: results });
  });

  app.post('/api/tenants', requireRole('landlord', 'admin'), (req, res) => {
    const { firstName, lastName, email, phone, unitId, status, leaseStart, leaseEnd, rent } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, error: 'First name, last name, and email are required.' });
    }
    const user = (req as AuthRequest).user!;
    const unit = unitId ? units.find((item) => item.id === unitId) : undefined;
    const property = unit && properties.find((item) => item.id === unit.propertyId);
    if (unitId && (!unit || !property || !canAccessProperty(user, property))) {
      return res.status(404).json({ success: false, error: 'Unit not found in your properties.' });
    }
    if (unit && (unit.tenantId || unit.status.toLowerCase() !== 'vacant')) {
      return res.status(409).json({ success: false, error: 'Choose a vacant unit with no tenant assigned.' });
    }
    const tenant: Tenant = {
      id: createId('tenant'),
      landlordId: user.sub,
      firstName,
      lastName,
      email,
      phone,
      unitId,
      status: status || 'Applicant',
      leaseStart,
      leaseEnd,
      rent: Number(rent || 0),
    };
    tenants.push(tenant);
    if (unit && property) {
      unit.tenantId = tenant.id;
      unit.status = 'occupied';
      property.occupancy = Math.min(property.occupancy + 1, property.units);
    }
    res.status(201).json({ success: true, data: tenant });
  });

  app.put('/api/tenants/:id', requireRole('landlord', 'admin'), (req, res) => {
    const tenant = tenants.find((item) => item.id === req.params.id);
    if (!tenant || !canAccessTenant((req as AuthRequest).user, tenant)) {
      return res.status(404).json({ success: false, error: 'Tenant not found.' });
    }
    const { firstName, lastName, email, phone, unitId, status, leaseStart, leaseEnd, rent } = req.body;
    if (unitId && unitId !== tenant.unitId) {
      const newUnit = units.find((item) => item.id === unitId);
      const newProperty = newUnit && properties.find((item) => item.id === newUnit.propertyId);
      if (!newUnit || !newProperty || !canAccessProperty((req as AuthRequest).user, newProperty)) {
        return res.status(404).json({ success: false, error: 'Unit not found in your properties.' });
      }
      if (newUnit.tenantId || newUnit.status.toLowerCase() !== 'vacant') {
        return res.status(409).json({ success: false, error: 'Choose a vacant unit with no tenant assigned.' });
      }
      const oldUnit = units.find((item) => item.id === tenant.unitId);
      const oldProperty = oldUnit && properties.find((item) => item.id === oldUnit.propertyId);
      if (oldUnit) {
        oldUnit.tenantId = undefined;
        oldUnit.status = 'vacant';
        if (oldProperty) oldProperty.occupancy = Math.max(0, oldProperty.occupancy - 1);
      }
      newUnit.tenantId = tenant.id;
      newUnit.status = 'occupied';
      newProperty.occupancy = Math.min(newProperty.occupancy + 1, newProperty.units);
    }
    Object.assign(tenant, {
      firstName: firstName ?? tenant.firstName,
      lastName: lastName ?? tenant.lastName,
      email: email ?? tenant.email,
      phone: phone ?? tenant.phone,
      unitId: unitId ?? tenant.unitId,
      status: status ?? tenant.status,
      leaseStart: leaseStart ?? tenant.leaseStart,
      leaseEnd: leaseEnd ?? tenant.leaseEnd,
      rent: rent !== undefined ? Number(rent) : tenant.rent,
    });
    res.json({ success: true, data: tenant });
  });

  app.delete('/api/tenants/:id', requireRole('landlord', 'admin'), (req, res) => {
    const index = tenants.findIndex((item) => item.id === req.params.id);
    const tenant = index === -1 ? undefined : tenants[index];
    if (!tenant || !canAccessTenant((req as AuthRequest).user, tenant)) {
      return res.status(404).json({ success: false, error: 'Tenant not found.' });
    }
    const unit = units.find((item) => item.id === tenant.unitId);
    const property = unit && properties.find((item) => item.id === unit.propertyId);
    if (unit) {
      unit.tenantId = undefined;
      unit.status = 'vacant';
      if (property) property.occupancy = Math.max(0, property.occupancy - 1);
    }
    tenants.splice(index, 1);
    res.json({ success: true, message: 'Tenant deleted.' });
  });

  app.get('/api/payments', async (req, res) => {
    const { tenantId, status } = req.query;
    const user = (req as AuthRequest).user;

    const dbPayments = await readDatabaseOrFallback(undefined, async () => {
      const where: any = {};
      if (tenantId) {
        where.tenantId = String(tenantId);
      }
      if (status) {
        where.status = String(status);
      }

      if (user?.role === 'tenant') {
        const tenant = await prisma.tenant.findFirst({ where: { userId: user.sub }, select: { id: true } });
        if (!tenant) return [];
        where.tenantId = tenant.id;
      }

      if (user?.role === 'landlord') {
        const ownedProperties = await prisma.property.findMany({ where: { landlordId: user.sub }, select: { id: true } });
        const propertyIds = ownedProperties.map((item) => item.id);
        const units = await prisma.unit.findMany({
          where: { propertyId: { in: propertyIds } },
          select: { id: true },
        });
        const unitIds = units.map((item) => item.id);
        const tenantIds = await prisma.tenant.findMany({
          where: { unitId: { in: unitIds } },
          select: { id: true },
        });
        where.tenantId = { in: tenantIds.map((item) => item.id) };
      }

      const records = await prisma.payment.findMany({
        where,
        orderBy: { dueDate: 'asc' },
      });

      return records.map((record) => ({
        id: record.id,
        tenantId: record.tenantId,
        unitId: record.unitId,
        amount: record.amount,
        dueDate: record.dueDate.toISOString().split('T')[0],
        paidDate: record.paidDate ? record.paidDate.toISOString().split('T')[0] : undefined,
        status: record.status,
        method: record.method,
      }));
    });

    if (dbPayments !== undefined) {
      return res.json({ success: true, data: dbPayments });
    }

    let results = [...payments];
    if (tenantId) {
      results = results.filter((payment) => payment.tenantId === tenantId);
    }
    if (status) {
      results = results.filter((payment) => payment.status === status);
    }
    res.json({ success: true, data: results });
  });

  app.post('/api/payments', async (req, res) => {
    const { tenantId, unitId, amount, dueDate, paidDate, status, method } = req.body;
    if (!tenantId || !unitId || !amount || !dueDate) {
      return res.status(400).json({ success: false, error: 'Tenant ID, unit ID, amount, and due date are required.' });
    }

    const dbPayment = await readDatabaseOrFallback(undefined, async () => {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { landlord: true },
      });
      if (!tenant) {
        return { type: 'error', status: 404, message: 'Tenant not found.' };
      }
      const unit = await prisma.unit.findUnique({ where: { id: unitId } });
      if (!unit) {
        return { type: 'error', status: 404, message: 'Unit not found.' };
      }

      if ((req as AuthRequest).user?.role === 'landlord' && tenant.landlordId !== (req as AuthRequest).user?.sub) {
        return { type: 'error', status: 403, message: 'You do not have access to this tenant.' };
      }

      const record = await prisma.payment.create({
        data: {
          tenantId,
          unitId,
          amount: Number(amount),
          dueDate: new Date(dueDate),
          paidDate: paidDate ? new Date(paidDate) : null,
          status: (status || (paidDate ? 'paid' : 'pending')) as 'paid' | 'pending' | 'overdue',
          method: method || 'Manual',
        },
      });

      return {
        type: 'success',
        status: 201,
        data: {
          id: record.id,
          tenantId: record.tenantId,
          unitId: record.unitId,
          amount: record.amount,
          dueDate: record.dueDate.toISOString().split('T')[0],
          paidDate: record.paidDate ? record.paidDate.toISOString().split('T')[0] : undefined,
          status: record.status,
          method: record.method,
        },
      };
    });

    if (dbPayment && dbPayment.type === 'error') {
      return res.status(dbPayment.status).json({ success: false, error: dbPayment.message });
    }
    if (dbPayment && dbPayment.type === 'success') {
      return res.status(dbPayment.status).json({ success: true, data: dbPayment.data });
    }

    const payment: Payment = {
      id: createId('payment'),
      tenantId,
      unitId,
      amount: Number(amount),
      dueDate,
      paidDate,
      status: (status || (paidDate ? 'paid' : 'pending')) as Payment['status'],
      method: method || 'Manual',
    };
    payments.push(payment);
    res.status(201).json({ success: true, data: payment });
  });

  app.get('/api/maintenance', async (req, res) => {
    const { status, tenantId, propertyId } = req.query;
    const user = (req as AuthRequest).user;
    if (status && !['open', 'in_progress', 'closed'].includes(String(status))) {
      return res.status(400).json({ success: false, error: 'Invalid maintenance status.' });
    }

    const dbRequests = await readDatabaseOrFallback<MaintenanceRequest[] | undefined>(undefined, async () => {
      const where: any = {};
      if (status) where.status = String(status);
      if (propertyId) where.propertyId = String(propertyId);

      if (user?.role === 'tenant') {
        const tenant = await prisma.tenant.findFirst({ where: { userId: user.sub }, select: { id: true } });
        if (!tenant) return [];
        where.tenantId = tenant.id;
      } else if (tenantId) {
        where.tenantId = String(tenantId);
      }

      if (user?.role === 'landlord') {
        where.property = { landlordId: user.sub };
      }

      const records = await prisma.maintenanceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { name: true } },
          unit: { select: { number: true } },
          tenant: { select: { firstName: true, lastName: true } },
        },
      });
      return records.map((record) => ({
        id: record.id,
        propertyId: record.propertyId,
        unitId: record.unitId,
        tenantId: record.tenantId,
        title: record.title,
        description: record.description,
        status: record.status,
        priority: record.priority,
        propertyName: record.property.name,
        unitNumber: record.unit.number,
        tenantName: `${record.tenant.firstName} ${record.tenant.lastName}`,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
      }));
    });

    if (dbRequests !== undefined) {
      return res.json({ success: true, data: dbRequests });
    }

    let results = [...maintenanceRequests];
    if (user?.role === 'tenant') {
      const tenant = tenants.find((item) => item.userId === user.sub);
      results = tenant ? results.filter((request) => request.tenantId === tenant.id) : [];
    } else if (tenantId) {
      results = results.filter((request) => request.tenantId === tenantId);
    }
    if (propertyId) results = results.filter((request) => request.propertyId === propertyId);
    if (status) results = results.filter((request) => request.status === status);
    if (user?.role === 'landlord') {
      results = results.filter((request) => properties.some((property) => property.id === request.propertyId && property.landlordId === user.sub));
    }
    return res.json({
      success: true,
      data: results.map((request) => {
        const tenant = tenants.find((item) => item.id === request.tenantId);
        const unit = units.find((item) => item.id === request.unitId);
        const property = properties.find((item) => item.id === request.propertyId);
        return {
          ...request,
          propertyName: property?.name ?? 'Unknown property',
          unitNumber: unit?.number ?? 'Unknown unit',
          tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown tenant',
        };
      }),
    });
  });

  app.post('/api/maintenance', async (req, res) => {
    const user = (req as AuthRequest).user;
    let propertyId = sanitizeString(req.body.propertyId);
    let unitId = sanitizeString(req.body.unitId);
    const requestedTenantId = sanitizeString(req.body.tenantId);
    const title = sanitizeString(req.body.title);
    const description = sanitizeString(req.body.description);
    const priority = sanitizeString(req.body.priority) || 'Medium';
    if (!title || !description || (user?.role !== 'tenant' && (!propertyId || !unitId || !requestedTenantId))) {
      return res.status(400).json({ success: false, error: 'Property ID, unit ID, title, and description are required.' });
    }
    if (!['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ success: false, error: 'Invalid maintenance priority.' });
    }

    const dbResult = await readDatabaseOrFallback<{ type: 'error'; status: number; message: string } | { type: 'success'; data: MaintenanceRequest } | undefined>(undefined, async () => {
      const tenant = user?.role === 'tenant'
        ? await prisma.tenant.findFirst({ where: { userId: user.sub } })
        : await prisma.tenant.findUnique({ where: { id: requestedTenantId } });
      if (!tenant || !tenant.unitId) {
        return { type: 'error', status: 400, message: 'A tenant assigned to this unit is required.' };
      }
      const tenantUnitId = tenant.unitId;
      if (user?.role !== 'tenant' && tenantUnitId !== unitId) {
        return { type: 'error', status: 400, message: 'The tenant is not assigned to this unit.' };
      }
      unitId = tenantUnitId;
      const unit = await prisma.unit.findUnique({ where: { id: unitId }, include: { property: true } });
      if (!unit || (user?.role !== 'tenant' && unit.propertyId !== propertyId)) {
        return { type: 'error', status: 404, message: 'Unit or property not found.' };
      }
      propertyId = unit.propertyId;
      if (user?.role === 'landlord' && unit.property.landlordId !== user.sub) {
        return { type: 'error', status: 403, message: 'You do not have access to this property.' };
      }

      const record = await prisma.maintenanceRequest.create({
        data: { propertyId, unitId, tenantId: tenant.id, title, description, priority: priority as 'Low' | 'Medium' | 'High' },
      });
      return {
        type: 'success',
        data: {
          id: record.id,
          propertyId: record.propertyId,
          unitId: record.unitId,
          tenantId: record.tenantId,
          title: record.title,
          description: record.description,
          status: record.status,
          priority: record.priority,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
        },
      };
    });

    if (dbResult?.type === 'error') {
      return res.status(dbResult.status).json({ success: false, error: dbResult.message });
    }
    if (dbResult?.type === 'success') {
      return res.status(201).json({ success: true, data: dbResult.data });
    }

    const tenant = user?.role === 'tenant'
      ? tenants.find((item) => item.userId === user.sub)
      : tenants.find((item) => item.id === requestedTenantId);
    if (!tenant?.unitId || (user?.role !== 'tenant' && tenant.unitId !== unitId)) {
      return res.status(400).json({ success: false, error: 'A tenant assigned to this unit is required.' });
    }
    unitId = tenant.unitId;
    const unit = units.find((item) => item.id === unitId);
    const property = unit && properties.find((item) => item.id === unit.propertyId);
    if (!unit || !property || (user?.role !== 'tenant' && property.id !== propertyId)) {
      return res.status(404).json({ success: false, error: 'Unit or property not found.' });
    }
    propertyId = property.id;
    if (user?.role === 'landlord' && property.landlordId !== user.sub) {
      return res.status(403).json({ success: false, error: 'You do not have access to this property.' });
    }

    const request: MaintenanceRequest = {
      id: createId('maintenance'), propertyId, unitId, tenantId: tenant.id, title, description,
      status: 'open', priority: priority as MaintenanceRequest['priority'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    maintenanceRequests.push(request);
    return res.status(201).json({ success: true, data: request });
  });

  app.patch('/api/maintenance/:id', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user;
    const { status, priority, title, description } = req.body;
    if (status !== undefined && !['open', 'in_progress', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid maintenance status.' });
    }
    if (priority !== undefined && !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ success: false, error: 'Invalid maintenance priority.' });
    }

    const dbResult = await readDatabaseOrFallback<{ type: 'error'; status: number; message: string } | { type: 'success'; data: MaintenanceRequest } | undefined>(undefined, async () => {
      const existing = await prisma.maintenanceRequest.findUnique({
        where: { id: req.params.id },
        include: { property: true, tenant: true },
      });
      if (!existing) return { type: 'error', status: 404, message: 'Maintenance request not found.' };
      if (user?.role === 'landlord' && existing.property.landlordId !== user.sub) {
        return { type: 'error', status: 404, message: 'Maintenance request not found.' };
      }
      const record = await prisma.maintenanceRequest.update({
        where: { id: existing.id },
        data: {
          ...(status !== undefined ? { status } : {}),
          ...(priority !== undefined ? { priority } : {}),
          ...(title !== undefined ? { title: sanitizeString(title) } : {}),
          ...(description !== undefined ? { description: sanitizeString(description) } : {}),
        },
      });
      return {
        type: 'success',
        data: {
          id: record.id, propertyId: record.propertyId, unitId: record.unitId, tenantId: record.tenantId,
          title: record.title, description: record.description, status: record.status, priority: record.priority,
          createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString(),
        },
      };
    });

    if (dbResult?.type === 'error') {
      return res.status(dbResult.status).json({ success: false, error: dbResult.message });
    }
    if (dbResult?.type === 'success') {
      return res.json({ success: true, data: dbResult.data });
    }

    const request = maintenanceRequests.find((item) => item.id === req.params.id);
    const tenant = request && tenants.find((item) => item.id === request.tenantId);
    const property = request && properties.find((item) => item.id === request.propertyId);
    if (!request || !tenant || !property || (user?.role === 'landlord' && property.landlordId !== user.sub)) {
      return res.status(404).json({ success: false, error: 'Maintenance request not found.' });
    }
    Object.assign(request, {
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(title !== undefined ? { title: sanitizeString(title) } : {}),
      ...(description !== undefined ? { description: sanitizeString(description) } : {}),
      updatedAt: new Date().toISOString(),
    });
    return res.json({ success: true, data: request });
  });

  app.get('/api/messages', (req, res) => {
    const { recipient, sender } = req.query;
    let results = [...messages];
    if (recipient) {
      results = results.filter((message) => message.recipient === recipient);
    }
    if (sender) {
      results = results.filter((message) => message.sender === sender);
    }
    res.json({ success: true, data: results });
  });

  app.post('/api/messages', (req, res) => {
    const { sender, recipient, subject, body } = req.body;
    if (!sender || !recipient || !subject || !body) {
      return res.status(400).json({ success: false, error: 'Sender, recipient, subject, and body are required.' });
    }
    const message: Message = {
      id: createId('msg'),
      sender,
      recipient,
      subject,
      body,
      createdAt: new Date().toISOString(),
      read: false,
    };
    messages.unshift(message);
    res.status(201).json({ success: true, data: message });
  });

  app.get('/api/documents', (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    let data = [...documents];
    if (user.role === 'tenant') {
      data = data.filter((document) => !document.ownerId || document.ownerId === user.sub);
    }

    return res.json({ success: true, data });
  });

  app.post('/api/documents', (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }

    const { name, type, date, size, tags, url } = req.body ?? {};
    if (!name || !type) {
      return res.status(400).json({ success: false, error: 'Document name and type are required.' });
    }

    const document: Document = {
      id: createId('doc'),
      name: sanitizeString(name),
      type: sanitizeString(type),
      date: sanitizeString(date) || new Date().toISOString().split('T')[0],
      size: sanitizeString(size) || '0 KB',
      tags: Array.isArray(tags) ? tags.map((tag: unknown) => sanitizeString(String(tag))).filter(Boolean) : [],
      ownerId: user.role === 'tenant' ? user.sub : undefined,
      url: sanitizeString(url),
    };

    documents.unshift(document);
    return res.status(201).json({ success: true, data: document });
  });

  app.post('/api/scan-document', async (req, res) => {
    try {
      const { fileName, mimeType, base64Data } = req.body;
      if (!base64Data) {
        return res.status(400).json({ success: false, error: 'Missing document data' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured on the server.' });
      }
      
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });

      const inlineDataContent = {
        inlineData: {
          data: base64Data.split(',')[1] || base64Data,
          mimeType: mimeType || 'application/pdf',
        },
      };

      const prompt = `You are an AI document analysis system for a property management platform.\nExamine the attached document.\nIdentify the document type (strictly one of: 'Lease', 'Receipt', 'Notice', or 'Other').\nExtract the most significant primary date associated with this document (in YYYY-MM-DD format).\nAdditionally, extract any other relevant dates to help with metadata tagging.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [inlineDataContent, { text: prompt }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['Lease', 'Receipt', 'Notice', 'Other'] },
              primaryDate: { type: Type.STRING },
              extractedDates: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary: { type: Type.STRING },
            },
            required: ['type', 'primaryDate', 'extractedDates', 'summary'],
          },
        },
      });

      if (!response.text) {
        throw new Error('No text generated by Gemini.');
      }
      const resultObj = JSON.parse(response.text);
      res.json({ success: true, data: resultObj });
    } catch (error: any) {
      console.error('Document scan error:', error);
      res.status(500).json({ success: false, error: error.message || 'Failed to process document using AI.' });
    }
  });

  app.post('/api/screen-tenant', async (req, res) => {
    const { tenantId, firstName, lastName, email } = req.body;
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (!tenantId || !firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'Missing required tenant information (ID, First Name, or Last Name).' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Invalid or missing tenant email address. Email is required for screening.' });
    }

    if (Math.random() > 0.85) {
      return res.status(503).json({ success: false, error: 'The screening service provider (TransUnion) is currently unavailable. Please try again later.' });
    }

    const score = 500 + Math.floor(Math.random() * 300);
    const mockReport = {
      id: `scr_${Date.now()}`,
      tenantId,
      status: 'completed',
      creditScore: score,
      recommendation: score > 680 ? 'Approve' : score > 620 ? 'Review' : 'Decline',
      criminalRecords: Math.random() > 0.9 ? 1 : 0,
      evictionHistory: Math.random() > 0.85 ? 1 : 0,
      dateCompleted: new Date().toISOString(),
      provider: 'TransUnionMock',
    };

    res.json({ success: true, report: mockReport });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
