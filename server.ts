import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from "express";
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { promises as fsp } from 'fs';
import rateLimit, { type Store } from 'express-rate-limit';
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from 'url';
import type { Prisma } from '@prisma/client';
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
  avatarUrl?: string;
  emailVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  phoneVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  identityVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  propertyAuthorizationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  businessRegistrationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  incomeVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  payoutVerificationStatus?: 'not_started' | 'pending' | 'verified' | 'rejected' | 'needs_review';
  passwordHash: string;
  /** Second factor state, carried on the local interface because issueSession() reads it. */
  totpSecret?: string | null;
  totpEnabledAt?: Date | null;
  recoveryCodes?: string[];
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

const JWT_SECRET = process.env.JWT_SECRET ?? '';
if (!JWT_SECRET || Buffer.byteLength(JWT_SECRET, 'utf8') < 32) {
  throw new Error('JWT_SECRET must be set to at least 32 characters before the server can start.');
}
const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '2h';
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000'];

const ALLOWED_REGISTRATION_ROLES: Array<User['role']> = ['landlord', 'tenant'];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string) {
  return typeof password === 'string' && password.length >= 12 && Buffer.byteLength(password, 'utf8') <= 72;
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
    isListed: unit.isListed ?? false,
    listingDescription: unit.listingDescription ?? undefined,
  };
}

/**
 * `Property.occupancy` is a cached count that dashboards read. Recompute it after any
 * unit or tenant change instead of nudging the number up and down by hand.
 */
async function syncPropertyOccupancy(propertyId: string) {
  const occupied = await prisma.unit.count({ where: { propertyId, status: 'occupied' } });
  await prisma.property.update({ where: { id: propertyId }, data: { occupancy: occupied } });
}

/**
 * Admin decisions that change another account's standing are recorded so the call can be
 * reconstructed later. The write is best-effort: the action itself has already committed, so a
 * failed log line is reported on the server rather than rolling back a completed decision.
 */
async function recordAudit(entry: {
  actorId?: string;
  actorEmail: string;
  actorRole: User['role'];
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  detail?: Prisma.InputJsonValue;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail,
        actorRole: entry.actorRole,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        summary: entry.summary,
        detail: entry.detail,
      },
    });
  } catch (error) {
    console.error('Unable to write audit entry:', error instanceof Error ? error.message : error);
  }
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

class PostgresRateLimitStore implements Store {
  localKeys = false;
  private windowMs = 60_000;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private readonly namespace: string) {}

  init(options: { windowMs: number }) {
    this.windowMs = options.windowMs;
    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => {
        prisma.$executeRaw`DELETE FROM "RateLimitCounter" WHERE "resetAt" < NOW() - INTERVAL '1 day'`
          .catch((error) => console.error('Unable to prune old rate-limit counters:', error instanceof Error ? error.message : error));
      }, 60 * 60 * 1000);
      this.cleanupTimer.unref();
    }
  }

  private storageKey(key: string) {
    return `${this.namespace}:${key}`;
  }

  async get(key: string) {
    const record = await prisma.rateLimitCounter.findUnique({ where: { key: this.storageKey(key) } });
    if (!record || record.resetAt.getTime() <= Date.now()) return undefined;
    return { totalHits: record.totalHits, resetTime: record.resetAt };
  }

  async increment(key: string) {
    const storageKey = this.storageKey(key);
    const rows = await prisma.$queryRaw<Array<{ totalHits: number; resetAt: Date }>>`
      INSERT INTO "RateLimitCounter" ("key", "totalHits", "resetAt")
      VALUES (${storageKey}, 1, NOW() + (${this.windowMs} * INTERVAL '1 millisecond'))
      ON CONFLICT ("key") DO UPDATE SET
        "totalHits" = CASE WHEN "RateLimitCounter"."resetAt" <= NOW() THEN 1 ELSE "RateLimitCounter"."totalHits" + 1 END,
        "resetAt" = CASE WHEN "RateLimitCounter"."resetAt" <= NOW()
          THEN NOW() + (${this.windowMs} * INTERVAL '1 millisecond')
          ELSE "RateLimitCounter"."resetAt" END
      RETURNING "totalHits", "resetAt"
    `;
    return { totalHits: rows[0].totalHits, resetTime: rows[0].resetAt };
  }

  async decrement(key: string) {
    await prisma.$executeRaw`
      UPDATE "RateLimitCounter"
      SET "totalHits" = GREATEST("totalHits" - 1, 0)
      WHERE "key" = ${this.storageKey(key)}
    `;
  }

  async resetKey(key: string) {
    await prisma.rateLimitCounter.deleteMany({ where: { key: this.storageKey(key) } });
  }

  async resetAll() {
    const prefix = `${this.namespace}:`;
    await prisma.$executeRaw`DELETE FROM "RateLimitCounter" WHERE left("key", ${prefix.length}) = ${prefix}`;
  }

  shutdown() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }
}

// Avatars are stored outside the bundle. The extension comes from the file signature
// rather than the client's Content-Type, so a mislabelled upload cannot land as HTML.
const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
const MAX_AVATAR_BYTES = 800 * 1024;

function detectAvatarExtension(buffer: Buffer): 'png' | 'jpg' | 'gif' | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.subarray(0, 4).toString('ascii') === 'GIF8') return 'gif';
  return null;
}

function serializeAccount(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    adminMfaEnabled: user.role === 'admin' ? Boolean(user.totpEnabledAt) : undefined,
    // Surfaced so the settings panel can say "pending" instead of guessing, and never claims a badge
    // that no reviewer recorded.
    emailVerificationStatus: user.emailVerificationStatus ?? 'not_started',
  };
}
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

// ---- Sessions, password reset, and second factor ----------------------------------------------

const REFRESH_TOKEN_TTL_DAYS = 30;
const PASSWORD_RESET_TTL_MINUTES = 60;
const EMAIL_VERIFICATION_TTL_HOURS = 24;
const MFA_TOKEN_TTL = '5m';
const TOTP_STEP_SECONDS = 30;
let emailDeliveryState: 'unknown' | 'healthy' | 'degraded' = 'unknown';
let emailLastEventAt: string | null = null;
let emailLastEventType: string | null = null;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function newOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

function appBaseUrl() {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

async function sendAccountEmail(to: string, subject: string, text: string, html?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    emailDeliveryState = 'degraded';
    return false;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'PropManage <onboarding@resend.dev>',
        to,
        subject,
        text,
        ...(html ? { html } : {}),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      emailDeliveryState = 'degraded';
      console.error('Account email provider rejected a message:', JSON.stringify({ status: response.status, subject, providerCode: result?.name ?? 'unknown error' }));
      return false;
    }
    emailDeliveryState = 'healthy';
    emailLastEventAt = new Date().toISOString();
    emailLastEventType = 'email.sent';
    console.info('Account email accepted by provider:', JSON.stringify({ subject, providerId: result?.id ?? null }));
    return true;
  } catch (error) {
    emailDeliveryState = 'degraded';
    console.error('Account email delivery request failed:', error instanceof Error ? error.message : 'network error');
    return false;
  }
}

function isValidResendWebhook(req: express.Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET?.replace(/^whsec_/, '');
  const messageId = req.header('svix-id') ?? '';
  const timestamp = req.header('svix-timestamp') ?? '';
  const signatureHeader = req.header('svix-signature') ?? '';
  if (!secret || !messageId || !/^\d+$/.test(timestamp) || !signatureHeader) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  if (!Buffer.isBuffer(req.body)) return false;

  const signedContent = `${messageId}.${timestamp}.${req.body.toString('utf8')}`;
  const expected = createHmac('sha256', Buffer.from(secret, 'base64')).update(signedContent).digest();
  return signatureHeader.split(' ').some((entry) => {
    const [version, encoded] = entry.split(',', 2);
    if (version !== 'v1' || !encoded) return false;
    const supplied = Buffer.from(encoded, 'base64');
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
}

// The link is only logged outside production. Production startup requires Resend credentials.
// Provider rejections are logged without exposing recipient addresses or reset tokens.
async function deliverAccountLink(email: string, label: string, link: string, subject: string, text: string) {
  const sent = await sendAccountEmail(email, subject, text);
  if (!sent && process.env.NODE_ENV !== 'production') {
    console.log(`[${label}] ${email} -> ${link}`);
  }
  return sent;
}

async function issueSession(user: User, userAgent?: string | null) {
  const refreshToken = newOpaqueToken(48);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: userAgent ? userAgent.slice(0, 200) : null,
    },
  });
  return {
    token: createAuthToken(user),
    refreshToken,
    refreshTokenExpiresAt: expiresAt.toISOString(),
  };
}

async function revokeAllSessions(userId: string, reason: string) {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

// TOTP (RFC 6238) is implemented directly so the second factor adds no dependency and no build step.
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

function base32Decode(input: string) {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function totpCode(secret: string, counter: number) {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', base32Decode(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24)
    | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8)
    | digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
}

// One step of drift either way: phone clocks are rarely exact to the second.
function verifyTotp(secret: string, code: string, window = 1) {
  const normalized = String(code ?? '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;
  const counter = Math.floor(Date.now() / (TOTP_STEP_SECONDS * 1000));
  for (let drift = -window; drift <= window; drift += 1) {
    if (totpCode(secret, counter + drift) === normalized) return true;
  }
  return false;
}

function generateRecoveryCodes(count = 8) {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(5).toString('hex');
    return `${raw.slice(0, 5)}-${raw.slice(5)}`;
  });
}

async function consumeRecoveryCode(userId: string, code: string) {
  const normalized = String(code ?? '').trim().toLowerCase().replace(/\s+/g, '');
  if (!normalized) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { recoveryCodes: true } });
  if (!user) return false;
  const match = user.recoveryCodes.find((entry) => entry === hashToken(normalized));
  if (!match) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { recoveryCodes: user.recoveryCodes.filter((entry) => entry !== match) },
  });
  return true;
}

async function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
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

    // Admins without MFA can only reach the enrollment and basic account endpoints. This lets
    // bootstrap admins enroll their authenticator while every privileged API stays locked.
    if (payload.role === 'admin') {
      const account = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { role: true, totpEnabledAt: true },
      });
      if (!account || account.role !== 'admin') {
        return res.status(401).json({ success: false, error: 'Administrator account is unavailable.' });
      }
      const mfaEnrollmentPaths = new Set([
        '/api/auth/me',
        '/api/auth/sessions',
        '/api/auth/logout-all',
        '/api/auth/email-verification/request',
        '/api/auth/mfa',
        '/api/auth/mfa/setup',
        '/api/auth/mfa/enable',
        '/api/auth/mfa/disable',
      ]);
      if (!account.totpEnabledAt && !mfaEnrollmentPaths.has(req.path)) {
        return res.status(403).json({
          success: false,
          code: 'ADMIN_MFA_REQUIRED',
          error: 'Set up authenticator-based two-factor authentication before using administrator features.',
        });
      }
    }
    return next();
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
    }
    console.error('Unable to enforce administrator MFA:', error);
    return res.status(503).json({ success: false, error: 'Account security is temporarily unavailable.' });
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
  isListed?: boolean;
  listingDescription?: string;
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


const payments: Payment[] = [
  { id: 'pay1', tenantId: 't1', unitId: 'u3', amount: 2400, dueDate: '2026-06-01', paidDate: '2026-06-01', status: 'paid', method: 'Credit Card' },
  { id: 'pay2', tenantId: 't3', unitId: 'u1', amount: 1800, dueDate: '2026-06-15', status: 'pending', method: 'Bank Transfer' },
];

const maintenanceRequests: MaintenanceRequest[] = [
  { id: 'm1', propertyId: 'p1', unitId: 'u1', tenantId: 't3', title: 'HVAC not cooling', description: 'The air conditioning is blowing warm air all day.', status: 'open', priority: 'High', createdAt: '2026-06-10', updatedAt: '2026-06-10' },
  { id: 'm2', propertyId: 'p2', unitId: 'u3', tenantId: 't1', title: 'Leaky kitchen faucet', description: 'Faucet drips continuously after being turned off.', status: 'in_progress', priority: 'Medium', createdAt: '2026-06-05', updatedAt: '2026-06-12' },
];

function createId(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`;
}

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const sender = process.env.EMAIL_FROM?.trim() ?? '';
    if (!process.env.RESEND_API_KEY || !sender || /onboarding@resend\.dev/i.test(sender) || !process.env.RESEND_WEBHOOK_SECRET) {
      throw new Error('Production email requires RESEND_API_KEY, a verified EMAIL_FROM sender, and RESEND_WEBHOOK_SECRET.');
    }
  }
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
        imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
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

  // Keep the provider webhook's exact bytes available for signature verification.
  app.use('/api/webhooks/resend', express.raw({ type: 'application/json', limit: '256kb' }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '32kb', extended: true }));

  // Uploaded avatars are served from disk. Filenames carry a timestamp, so they can be
  // cached aggressively while a replacement takes effect immediately.
  app.use('/uploads', express.static(UPLOAD_ROOT, {
    index: false,
    dotfiles: 'ignore',
    maxAge: '7d',
  }));

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  });

  // Failed-authentication budget per 15 minutes. Overridable so a scripted run against a local
  // instance does not exhaust it, and so the limit can be tuned without a code change.
  const authLimitMax = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 5);
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number.isFinite(authLimitMax) && authLimitMax > 0 ? authLimitMax : 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { success: false, error: 'Too many login attempts, please try again later.' },
  });

  const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many registration attempts. Please try again later.' },
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

  const publicApiPaths = ['/api/health', '/api/webhooks/resend', '/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/refresh', '/api/auth/password-reset/request', '/api/auth/password-reset/confirm', '/api/auth/email-verification/confirm', '/api/auth/mfa/verify', '/api/contact', '/api/listings'];
  const publicInvitationPath = /^\/api\/tenant-invitations\/[a-f0-9]{64}(?:\/accept)?$/;
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') && !publicApiPaths.includes(req.path) && !publicInvitationPath.test(req.path)) {
      return authMiddleware(req, res, next);
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    const emailConfigured = Boolean(
      process.env.RESEND_API_KEY
      && (process.env.EMAIL_FROM || process.env.NODE_ENV !== 'production')
      && process.env.RESEND_WEBHOOK_SECRET
    );
    res.json({
      status: emailDeliveryState === 'degraded' ? 'degraded' : 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      email: { configured: emailConfigured, delivery: emailDeliveryState, lastEvent: emailLastEventType, lastEventAt: emailLastEventAt },
    });
  });

  app.post('/api/webhooks/resend', (req, res) => {
    if (!isValidResendWebhook(req)) {
      return res.status(401).json({ success: false, error: 'Invalid email provider signature.' });
    }
    let event: any;
    try {
      event = JSON.parse((req.body as Buffer).toString('utf8'));
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid email provider event.' });
    }
    const eventType = sanitizeString(event?.type);
    const trackedTypes = new Set(['email.sent', 'email.delivered', 'email.delivery_delayed', 'email.bounced', 'email.failed', 'email.suppressed', 'email.complained']);
    if (!trackedTypes.has(eventType)) return res.json({ success: true, ignored: true });

    emailLastEventAt = new Date().toISOString();
    emailLastEventType = eventType;
    emailDeliveryState = ['email.delivery_delayed', 'email.bounced', 'email.failed', 'email.suppressed', 'email.complained'].includes(eventType)
      ? 'degraded'
      : 'healthy';
    console.info('Resend delivery event:', JSON.stringify({ type: eventType, emailId: event?.data?.email_id ?? null }));
    return res.json({ success: true });
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

      await recordAudit({
        actorId: user.sub,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'report.review',
        targetType: 'report',
        targetId: result.report.id,
        summary: `Report set to ${status} (target ${result.report.targetType} ${result.report.targetId})`,
        detail: {
          status,
          trustAdjustment: trustAdjustment ?? null,
          blacklisted: blacklisted ?? null,
          resolutionNoteProvided: Boolean(sanitizeString(resolutionNote)),
        },
      });

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

  app.post('/api/auth/register', registerLimiter, async (req, res) => {
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
      return res.status(400).json({ success: false, error: 'Password must be 12-72 UTF-8 bytes long.' });
    }
    if (!ALLOWED_REGISTRATION_ROLES.includes(role)) {
      return res.status(403).json({ success: false, error: 'Registration is not allowed for this role.' });
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
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
      const session = await issueSession(newUser, req.get('user-agent'));
      return res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          phone: newUser.phone ?? null,
          avatarUrl: null,
          emailVerificationStatus: newUser.emailVerificationStatus,
          phoneVerificationStatus: newUser.phoneVerificationStatus,
          identityVerificationStatus: newUser.identityVerificationStatus,
          propertyAuthorizationStatus: newUser.propertyAuthorizationStatus,
          businessRegistrationStatus: newUser.businessRegistrationStatus,
          incomeVerificationStatus: newUser.incomeVerificationStatus,
          payoutVerificationStatus: newUser.payoutVerificationStatus,
        },
        ...session,
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

    let user: User | null;
    try {
      const dbUser = await prisma.user.findUnique({ where: { email } });
      user = dbUser ? { ...dbUser, phone: dbUser.phone ?? undefined } : null;
    } catch (error) {
      console.error('Unable to load account for login:', error);
      return res.status(503).json({ success: false, error: 'Account service is temporarily unavailable. Please try again shortly.' });
    }
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // A second factor is challenged before any token is issued, so a stolen password alone stops here.
    if (user.totpEnabledAt) {
      const mfaToken = jwt.sign(
        { sub: user.id, purpose: 'mfa' },
        JWT_SECRET,
        { expiresIn: MFA_TOKEN_TTL, jwtid: randomUUID() }
      );
      return res.json({ success: true, mfaRequired: true, mfaToken });
    }

    try {
      const session = await issueSession(user, req.get('user-agent'));
      return res.json({
        success: true,
        user: serializeAccount(user),
        ...session,
        mfaEnrollmentRequired: user.role === 'admin',
      });
    } catch (error) {
      console.error('Unable to start session:', error);
      return res.status(503).json({ success: false, error: 'Account service is temporarily unavailable. Please try again shortly.' });
    }
  });

  // Signing out is deliberately public: an expired access token must still be able to revoke its
  // refresh token, otherwise a dead tab leaves a live session behind.
  app.post('/api/auth/logout', async (req, res) => {
    const authHeader = req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authHeader.replace('Bearer ', '').trim(), JWT_SECRET) as any;
        if (payload?.jti) tokenBlacklist.add(payload.jti);
      } catch {
        // Expired or malformed token: nothing to blacklist, the refresh token still gets revoked.
      }
    }

    const refreshToken = sanitizeString(req.body?.refreshToken);
    if (refreshToken) {
      try {
        await prisma.refreshToken.updateMany({
          where: { tokenHash: hashToken(refreshToken), revokedAt: null },
          data: { revokedAt: new Date(), revokedReason: 'logout' },
        });
      } catch (error) {
        console.error('Unable to revoke session on logout:', error);
        return res.status(503).json({ success: false, error: 'Sign-out could not be completed. Close the tab and try again.' });
      }
    }

    return res.json({ success: true, message: 'Logged out successfully.' });
  });

  // Invalidate every session for the current user, in memory and in the database.
  app.post('/api/auth/logout-all', async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ success: false, error: 'Not authenticated.' });
    try {
      await revokeAllSessions(authReq.user.sub, 'logout_all');
    } catch (error) {
      console.error('Unable to revoke all sessions:', error);
      return res.status(503).json({ success: false, error: 'Sessions could not be revoked right now.' });
    }
    revokedBefore[authReq.user.sub] = Date.now();
    return res.json({ success: true, message: 'All sessions for this user have been invalidated.' });
  });

  app.post('/api/auth/rotate-admin-password', requireRole('admin'), async (req, res) => {
    const authUser = (req as AuthRequest).user!;
    const currentPassword = sanitizeString(req.body?.currentPassword);
    const newPassword = sanitizeString(req.body?.newPassword);
    if (!currentPassword || !isStrongPassword(newPassword) || currentPassword === newPassword) {
      return res.status(400).json({ success: false, error: 'Enter your current password and a different 12-72 byte new password.' });
    }

    try {
      const adminUser = await prisma.user.findUnique({ where: { id: authUser.sub } });
      if (!adminUser || adminUser.role !== 'admin' || !(await bcrypt.compare(currentPassword, adminUser.passwordHash))) {
        return res.status(403).json({ success: false, error: 'Current password is incorrect.' });
      }

      await prisma.user.update({
        where: { id: adminUser.id },
        data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
      });
      revokedBefore[adminUser.id] = Date.now();
      await revokeAllSessions(adminUser.id, 'password_rotated');
      return res.json({ success: true, message: 'Password updated. Sign in again with the new password.' });
    } catch (error) {
      console.error('Unable to rotate admin password:', error);
      return res.status(503).json({ success: false, error: 'Password service is temporarily unavailable.' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    // Read through to the database so renames and avatars survive a page reload. The JWT
    // only carries the identity, so the raw claims are the fallback, not the source of truth.
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: authReq.user.sub } });
      if (dbUser) {
        return res.json({ success: true, user: serializeAccount({ ...dbUser, phone: dbUser.phone ?? undefined }) });
      }
    } catch (error) {
      console.error('Unable to load account for session refresh:', error);
    }

    const { sub, email, role, firstName, lastName } = authReq.user;
    return res.json({
      success: true,
      user: { id: sub, email, role, firstName, lastName, phone: null, avatarUrl: null },
    });
  });

  // Exchanging a refresh token rotates it: the presented token dies, a new one takes its place.
  // Presenting an already-rotated token is treated as theft and drops every session for that user.
  app.post('/api/auth/refresh', async (req, res) => {
    const refreshToken = sanitizeString(req.body?.refreshToken);
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'A refresh token is required.' });
    }

    try {
      const record = await prisma.refreshToken.findUnique({
        where: { tokenHash: hashToken(refreshToken) },
        include: { user: true },
      });
      if (!record) {
        return res.status(401).json({ success: false, error: 'Session expired. Sign in again.' });
      }
      if (record.revokedAt) {
        await revokeAllSessions(record.userId, 'token_reuse');
        return res.status(401).json({ success: false, error: 'Session expired. Sign in again.' });
      }
      if (record.expiresAt.getTime() <= Date.now()) {
        return res.status(401).json({ success: false, error: 'Session expired. Sign in again.' });
      }

      const nextToken = newOpaqueToken(48);
      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
      await prisma.$transaction([
        prisma.refreshToken.update({
          where: { id: record.id },
          data: { revokedAt: new Date(), revokedReason: 'rotated' },
        }),
        prisma.refreshToken.create({
          data: {
            userId: record.userId,
            tokenHash: hashToken(nextToken),
            expiresAt,
            userAgent: record.userAgent,
          },
        }),
      ]);

      const refreshed: User = { ...record.user, phone: record.user.phone ?? undefined };
      return res.json({
        success: true,
        user: serializeAccount(refreshed),
        token: createAuthToken(refreshed),
        refreshToken: nextToken,
        refreshTokenExpiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error('Unable to refresh session:', error);
      return res.status(503).json({ success: false, error: 'Session service is temporarily unavailable.' });
    }
  });

  app.get('/api/auth/sessions', async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ success: false, error: 'Not authenticated.' });
    try {
      const sessions = await prisma.refreshToken.findMany({
        where: { userId: authReq.user.sub, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, createdAt: true, expiresAt: true, userAgent: true, revokedReason: true },
      });
      return res.json({
        success: true,
        data: sessions.map((session) => ({
          id: session.id,
          createdAt: session.createdAt.toISOString(),
          expiresAt: session.expiresAt.toISOString(),
          userAgent: session.userAgent,
        })),
      });
    } catch (error) {
      console.error('Unable to list sessions:', error);
      return res.status(503).json({ success: false, error: 'Session list is temporarily unavailable.' });
    }
  });

  // The response is identical whether or not the address exists, so this endpoint cannot be used to
  // discover accounts. Without an email provider the link is written to the server log in development.
  app.post('/api/auth/password-reset/request', async (req, res) => {
    const email = sanitizeString(req.body?.email).toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        const token = newOpaqueToken(32);
        await prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(token),
            expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
          },
        });
        const link = `${appBaseUrl()}/reset-password?token=${token}`;
        await deliverAccountLink(
          email,
          'password-reset',
          link,
          'Reset your PropManage password',
          `Open this link within ${PASSWORD_RESET_TTL_MINUTES} minutes to choose a new password:\n\n${link}\n\nIf you did not ask for this, ignore this message. Nothing has changed.`
        );
      }
      return res.json({
        success: true,
        message: 'If that email has an account, a reset email will be sent when delivery is available. If it does not arrive, contact support through the Contact page.',
      });
    } catch (error) {
      console.error('Unable to start password reset:', error);
      return res.status(503).json({ success: false, error: 'Password reset is temporarily unavailable.' });
    }
  });

  app.post('/api/auth/password-reset/confirm', async (req, res) => {
    const token = sanitizeString(req.body?.token);
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'A reset token and a new password are required.' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, error: 'Password must be 12-72 UTF-8 bytes long.' });
    }

    try {
      const record = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { user: true },
      });
      if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
        return res.status(400).json({ success: false, error: 'This reset link is invalid or has expired. Request a new one.' });
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await prisma.$transaction([
        prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
        prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        prisma.refreshToken.updateMany({
          where: { userId: record.userId, revokedAt: null },
          data: { revokedAt: new Date(), revokedReason: 'password_reset' },
        }),
      ]);

      revokedBefore[record.userId] = Date.now();
      return res.json({ success: true, message: 'Password updated. Sign in with the new password.' });
    } catch (error) {
      console.error('Unable to complete password reset:', error);
      return res.status(503).json({ success: false, error: 'Password reset is temporarily unavailable.' });
    }
  });

  app.post('/api/auth/email-verification/request', async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ success: false, error: 'Not authenticated.' });

    try {
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.sub },
        select: { id: true, email: true, emailVerificationStatus: true },
      });
      if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });
      if (user.emailVerificationStatus === 'verified') {
        return res.status(400).json({ success: false, error: 'This email is already verified.' });
      }

      const token = newOpaqueToken(32);
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000),
        },
      });

      const link = `${appBaseUrl()}/verify-email?token=${token}`;
      const delivered = await deliverAccountLink(
        user.email,
        'email-verification',
        link,
        'Confirm your PropManage email',
        `Confirm this address within ${EMAIL_VERIFICATION_TTL_HOURS} hours:\n\n${link}`
      );
      if (!delivered && process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, error: 'Account email is not configured, so the confirmation link could not be sent.' });
      }
      return res.json({
        success: true,
        message: delivered
          ? `Confirmation link sent to ${user.email}.`
          : 'Development mode: the confirmation link was written to the server log.',
      });
    } catch (error) {
      console.error('Unable to start email verification:', error);
      return res.status(503).json({ success: false, error: 'Email verification is temporarily unavailable.' });
    }
  });

  app.post('/api/auth/email-verification/confirm', async (req, res) => {
    const token = sanitizeString(req.body?.token);
    if (!token) return res.status(400).json({ success: false, error: 'A confirmation token is required.' });

    try {
      const record = await prisma.emailVerificationToken.findUnique({
        where: { tokenHash: hashToken(token) },
        include: { user: { select: { id: true, email: true, emailVerificationStatus: true } } },
      });
      if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
        return res.status(400).json({ success: false, error: 'This confirmation link is invalid or has expired.' });
      }
      if (record.user.emailVerificationStatus === 'verified') {
        await prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
        return res.json({ success: true, alreadyVerified: true, email: record.user.email, message: 'This email is already verified.' });
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { emailVerificationStatus: 'verified' },
        }),
        prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        prisma.verificationReview.create({
          data: {
            userId: record.userId,
            field: 'email',
            fromStatus: record.user.emailVerificationStatus,
            toStatus: 'verified',
            basis: 'Ownership confirmed by an emailed one-time link.',
            reviewerId: record.userId,
          },
        }),
      ]);

      return res.json({ success: true, email: record.user.email, message: 'Email confirmed.' });
    } catch (error) {
      console.error('Unable to confirm email:', error);
      return res.status(503).json({ success: false, error: 'Email confirmation is temporarily unavailable.' });
    }
  });

  // Second factor is offered to platform staff only: they can reach every account on the platform.
  app.get('/api/auth/mfa', async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ success: false, error: 'Not authenticated.' });
    try {
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.sub },
        select: { role: true, totpSecret: true, totpEnabledAt: true, recoveryCodes: true },
      });
      if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });
      return res.json({
        success: true,
        data: {
          available: user.role === 'admin',
          enabled: Boolean(user.totpEnabledAt),
          enabledAt: user.totpEnabledAt ? user.totpEnabledAt.toISOString() : null,
          pendingSetup: Boolean(user.totpSecret) && !user.totpEnabledAt,
          recoveryCodesRemaining: user.recoveryCodes.length,
        },
      });
    } catch (error) {
      console.error('Unable to load second factor state:', error);
      return res.status(503).json({ success: false, error: 'Security settings are temporarily unavailable.' });
    }
  });

  app.post('/api/auth/mfa/setup', requireRole('admin'), async (req, res) => {
    const authReq = req as AuthRequest;
    const actor = authReq.user!;

    try {
      const secret = base32Encode(randomBytes(20));
      const recoveryCodes = generateRecoveryCodes();
      await prisma.user.update({
        where: { id: actor.sub },
        data: {
          totpSecret: secret,
          totpEnabledAt: null,
          recoveryCodes: recoveryCodes.map((code) => hashToken(code)),
        },
      });

      const otpauthUrl = `otpauth://totp/${encodeURIComponent(`PropManage:${actor.email}`)}?secret=${secret}&issuer=PropManage&algorithm=SHA1&digits=6&period=${TOTP_STEP_SECONDS}`;
      return res.json({
        success: true,
        data: {
          secret,
          otpauthUrl,
          recoveryCodes,
          message: 'Add the secret to an authenticator app, then confirm a code to switch it on.',
        },
      });
    } catch (error) {
      console.error('Unable to start second factor setup:', error);
      return res.status(503).json({ success: false, error: 'Second factor setup is temporarily unavailable.' });
    }
  });

  app.post('/api/auth/mfa/enable', requireRole('admin'), async (req, res) => {
    const actor = (req as AuthRequest).user!;
    const code = sanitizeString(req.body?.code);

    try {
      const user = await prisma.user.findUnique({
        where: { id: actor.sub },
        select: { totpSecret: true, totpEnabledAt: true },
      });
      if (!user?.totpSecret) {
        return res.status(400).json({ success: false, error: 'Start setup before confirming a code.' });
      }
      if (user.totpEnabledAt) {
        return res.status(400).json({ success: false, error: 'Two-factor authentication is already on.' });
      }
      if (!verifyTotp(user.totpSecret, code)) {
        return res.status(400).json({ success: false, error: 'That code is not valid. Check the authenticator app and try again.' });
      }

      await prisma.user.update({ where: { id: actor.sub }, data: { totpEnabledAt: new Date() } });
      await recordAudit({
        actorId: actor.sub,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'mfa.enable',
        targetType: 'account',
        targetId: actor.sub,
        summary: 'Two-factor authentication enabled',
      });
      return res.json({ success: true, message: 'Two-factor authentication is on.' });
    } catch (error) {
      console.error('Unable to enable second factor:', error);
      return res.status(503).json({ success: false, error: 'Security settings are temporarily unavailable.' });
    }
  });

  app.post('/api/auth/mfa/disable', requireRole('admin'), async (req, res) => {
    const actor = (req as AuthRequest).user!;
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const code = sanitizeString(req.body?.code);

    try {
      const user = await prisma.user.findUnique({ where: { id: actor.sub } });
      if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });
      if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(403).json({ success: false, error: 'Password is incorrect.' });
      }

      const codeValid = user.totpSecret ? verifyTotp(user.totpSecret, code) : false;
      const recoveryValid = codeValid ? false : await consumeRecoveryCode(user.id, code);
      if (!codeValid && !recoveryValid) {
        return res.status(400).json({ success: false, error: 'Enter a current authenticator code or one of your recovery codes.' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { totpSecret: null, totpEnabledAt: null, recoveryCodes: [] },
      });
      await recordAudit({
        actorId: actor.sub,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'mfa.disable',
        targetType: 'account',
        targetId: actor.sub,
        summary: 'Two-factor authentication disabled',
        detail: { usedRecoveryCode: recoveryValid },
      });
      return res.json({ success: true, message: 'Two-factor authentication is off.' });
    } catch (error) {
      console.error('Unable to disable second factor:', error);
      return res.status(503).json({ success: false, error: 'Security settings are temporarily unavailable.' });
    }
  });

  app.post('/api/auth/mfa/verify', async (req, res) => {
    const mfaToken = sanitizeString(req.body?.mfaToken);
    const code = sanitizeString(req.body?.code);
    if (!mfaToken || !code) {
      return res.status(400).json({ success: false, error: 'A sign-in ticket and a code are required.' });
    }

    let payload: any;
    try {
      payload = jwt.verify(mfaToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'This sign-in attempt expired. Start again.' });
    }
    if (payload?.purpose !== 'mfa' || !payload?.sub) {
      return res.status(401).json({ success: false, error: 'This sign-in ticket is not valid for two-factor verification.' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.totpEnabledAt || !user.totpSecret) {
        return res.status(401).json({ success: false, error: 'Sign in again.' });
      }

      const codeValid = verifyTotp(user.totpSecret, code);
      const recoveryValid = codeValid ? false : await consumeRecoveryCode(user.id, code);
      if (!codeValid && !recoveryValid) {
        return res.status(401).json({ success: false, error: 'That code is not valid.' });
      }

      const account: User = { ...user, phone: user.phone ?? undefined };
      const session = await issueSession(account, req.get('user-agent'));
      // A recovery code is deleted as it is used, so the count is re-read rather than taken from the
      // snapshot loaded before verification.
      const recoveryCodesRemaining = recoveryValid
        ? (await prisma.user.findUnique({ where: { id: user.id }, select: { recoveryCodes: true } }))?.recoveryCodes.length ?? 0
        : user.recoveryCodes.length;
      return res.json({
        success: true,
        user: serializeAccount(account),
        ...session,
        usedRecoveryCode: recoveryValid,
        recoveryCodesRemaining,
      });
    } catch (error) {
      console.error('Unable to verify second factor:', error);
      return res.status(503).json({ success: false, error: 'Sign-in is temporarily unavailable.' });
    }
  });

  app.patch('/api/users/me', async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ success: false, error: 'Not authenticated.' });

    const firstName = sanitizeString(req.body?.firstName);
    const lastName = sanitizeString(req.body?.lastName);
    const phone = sanitizeString(req.body?.phone);

    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'First name and last name are required.' });
    }
    if (firstName.length > 60 || lastName.length > 60) {
      return res.status(400).json({ success: false, error: 'Names must be 60 characters or fewer.' });
    }
    if (phone.length > 32) {
      return res.status(400).json({ success: false, error: 'Phone number must be 32 characters or fewer.' });
    }

    try {
      const updated = await prisma.user.update({
        where: { id: authReq.user.sub },
        data: { firstName, lastName, phone: phone || null },
      });
      return res.json({ success: true, user: serializeAccount({ ...updated, phone: updated.phone ?? undefined }) });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
        return res.status(404).json({ success: false, error: 'Account not found.' });
      }
      console.error('Unable to update profile:', error);
      return res.status(503).json({ success: false, error: 'Profile service is temporarily unavailable.' });
    }
  });

  // Changing a password always re-checks the current one, so a stolen session token
  // alone cannot lock the real owner out of the account.
  app.post('/api/users/me/password', async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ success: false, error: 'Not authenticated.' });

    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Enter your current password and a new password.' });
    }
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({ success: false, error: 'New password must be at least 12 characters.' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, error: 'Choose a new password that is different from the current one.' });
    }

    try {
      const account = await prisma.user.findUnique({
        where: { id: authReq.user.sub },
        select: { passwordHash: true },
      });
      if (!account) return res.status(404).json({ success: false, error: 'Account not found.' });

      const matches = await bcrypt.compare(currentPassword, account.passwordHash);
      if (!matches) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
      }

      await prisma.user.update({
        where: { id: authReq.user.sub },
        data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
      });
      // A password change ends every session: if the old password had leaked, the session it bought
      // must not outlive the change.
      await revokeAllSessions(authReq.user.sub, 'password_changed');
      revokedBefore[authReq.user.sub] = Date.now();
      return res.json({ success: true, message: 'Password updated. Sign in again with the new password.' });
    } catch (error) {
      console.error('Unable to change password:', error);
      return res.status(503).json({ success: false, error: 'Password service is temporarily unavailable.' });
    }
  });

  // Raw body, not multipart: it avoids a multer dependency and the 33% base64 overhead.
  const avatarBodyParser = express.raw({ type: ['image/png', 'image/jpeg', 'image/gif'], limit: '1mb' });

  app.post('/api/users/me/avatar', avatarBodyParser, async (req, res) => {
    const authReq = req as AuthRequest;
    if (!authReq.user) return res.status(401).json({ success: false, error: 'Not authenticated.' });

    const body: unknown = req.body;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Send the image as the request body with an image/png, image/jpeg, or image/gif content type.',
      });
    }
    if (body.length > MAX_AVATAR_BYTES) {
      return res.status(413).json({ success: false, error: 'Images must be 800KB or smaller.' });
    }

    const extension = detectAvatarExtension(body);
    if (!extension) {
      return res.status(400).json({ success: false, error: 'Only PNG, JPEG, or GIF images are supported.' });
    }

    try {
      await fsp.mkdir(AVATAR_DIR, { recursive: true });
      const fileName = `${authReq.user.sub}-${Date.now()}.${extension}`;
      await fsp.writeFile(path.join(AVATAR_DIR, fileName), body);

      const previous = await prisma.user.findUnique({
        where: { id: authReq.user.sub },
        select: { avatarUrl: true },
      });
      const updated = await prisma.user.update({
        where: { id: authReq.user.sub },
        data: { avatarUrl: `/uploads/avatars/${fileName}` },
      });

      // Remove the replaced file so repeated uploads do not pile up on disk.
      if (previous?.avatarUrl) {
        const previousFileName = path.basename(previous.avatarUrl);
        if (previousFileName !== fileName) {
          await fsp.unlink(path.join(AVATAR_DIR, previousFileName)).catch(() => undefined);
        }
      }

      return res.json({ success: true, user: serializeAccount({ ...updated, phone: updated.phone ?? undefined }) });
    } catch (error) {
      console.error('Unable to store avatar:', error);
      return res.status(503).json({ success: false, error: 'Avatar upload is temporarily unavailable.' });
    }
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
      const emailSent = await sendAccountEmail(
        email,
        'You are invited to your tenant portal',
        `You have been invited to join your tenant portal. Review the invitation within 7 days: ${inviteUrl}`,
        `<p>You have been invited to join your tenant portal.</p><p><a href="${inviteUrl}">Review invitation</a></p><p>This link expires in 7 days.</p>`,
      );

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
    return res.status(503).json({ success: false, error: 'Invitation service is temporarily unavailable.' });
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
    return res.status(503).json({ success: false, error: 'Invitation service is temporarily unavailable.' });
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
    return res.status(503).json({ success: false, error: 'Invitation service is temporarily unavailable.' });
  });

  // Every number here is scoped to the caller. A landlord never sees another
  // landlord's totals, and a tenant only sees their own tenancy.
  // Admin-only platform overview. Every figure is counted from a real table. The app has
  // no subscription or billing model, so this reports rent totals and never invents SaaS
  // revenue, uptime, or storage numbers.
  app.get('/api/admin/overview', requireRole('admin'), async (_req, res) => {
    try {
      const [
        propertyCount,
        unitCount,
        occupiedUnits,
        landlordCount,
        accountCount,
        tenantCount,
        activeTenantCount,
        openMaintenance,
        pendingPayments,
        overduePayments,
        openReports,
        rentTotals,
        recentProperties,
        recentReports,
        recentMaintenance,
      ] = await Promise.all([
        prisma.property.count(),
        prisma.unit.count(),
        prisma.unit.count({ where: { status: 'occupied' } }),
        prisma.user.count({ where: { role: 'landlord' } }),
        prisma.user.count(),
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: 'Active' } }),
        prisma.maintenanceRequest.count({ where: { status: { not: 'closed' } } }),
        prisma.payment.count({ where: { status: 'pending' } }),
        prisma.payment.count({ where: { status: 'overdue' } }),
        prisma.report.count({ where: { status: 'open' } }),
        prisma.payment.groupBy({ by: ['status'], _sum: { amount: true } }),
        prisma.property.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { landlord: { select: { firstName: true, lastName: true } } },
        }),
        prisma.report.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, targetType: true, targetName: true, reason: true, status: true, riskBand: true, createdAt: true },
        }),
        prisma.maintenanceRequest.findMany({
          where: { status: { not: 'closed' } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            property: { select: { name: true } },
            unit: { select: { number: true } },
          },
        }),
      ]);

      const rentByStatus = rentTotals.reduce<Record<string, number>>((totals, row) => {
        totals[row.status] = row._sum.amount ?? 0;
        return totals;
      }, {});

      return res.json({
        success: true,
        data: {
          propertyCount,
          unitCount,
          occupiedUnits,
          vacantUnits: unitCount - occupiedUnits,
          occupancyRate: unitCount > 0 ? Math.round((occupiedUnits / unitCount) * 100) : 0,
          landlordCount,
          accountCount,
          tenantCount,
          activeTenantCount,
          openMaintenance,
          pendingPayments,
          overduePayments,
          openReports,
          rentByStatus: {
            paid: rentByStatus.paid ?? 0,
            pending: rentByStatus.pending ?? 0,
            overdue: rentByStatus.overdue ?? 0,
          },
          recentProperties: recentProperties.map((property) => ({
            id: property.id,
            name: property.name,
            city: property.city,
            state: property.state,
            status: property.status,
            landlordName: `${property.landlord.firstName} ${property.landlord.lastName}`.trim(),
            createdAt: property.createdAt.toISOString(),
          })),
          recentReports: recentReports.map((report) => ({
            ...report,
            createdAt: report.createdAt.toISOString(),
          })),
          recentMaintenance: recentMaintenance.map((request) => ({
            id: request.id,
            title: request.title,
            status: request.status,
            priority: request.priority,
            propertyName: request.property.name,
            unitNumber: request.unit.number,
            createdAt: request.createdAt.toISOString(),
          })),
        },
      });
    } catch (error) {
      console.error('Unable to load admin overview:', error);
      return res.status(503).json({ success: false, error: 'Platform overview is temporarily unavailable.' });
    }
  });

  // Admin-only account directory. Only identity and verification metadata is selected;
  // password hashes and document contents are never sent to the client.
  app.get('/api/admin/users', requireRole('admin'), async (_req, res) => {
    try {
      const [users, tenants, units, properties] = await Promise.all([
        prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 1000,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            phone: true,
            trustScore: true,
            blacklisted: true,
            emailVerificationStatus: true,
            identityVerificationStatus: true,
            createdAt: true,
          },
        }),
        prisma.tenant.findMany({ select: { userId: true, unitId: true, status: true, landlordId: true } }),
        prisma.unit.findMany({ select: { id: true, number: true, propertyId: true } }),
        prisma.property.findMany({ select: { id: true, name: true, landlordId: true } }),
      ]);

      const unitsById = new Map(units.map((unit) => [unit.id, unit]));
      const propertiesById = new Map(properties.map((property) => [property.id, property]));
      const usersById = new Map(users.map((user) => [user.id, user]));
      const tenantByUserId = new Map<string, (typeof tenants)[number]>();
      for (const tenant of tenants) {
        if (tenant.userId && !tenantByUserId.has(tenant.userId)) tenantByUserId.set(tenant.userId, tenant);
      }
      const propertyCountByLandlord = properties.reduce<Record<string, number>>((counts, property) => {
        counts[property.landlordId] = (counts[property.landlordId] ?? 0) + 1;
        return counts;
      }, {});

      return res.json({
        success: true,
        data: users.map((user) => {
          const tenant = tenantByUserId.get(user.id);
          const unit = tenant?.unitId ? unitsById.get(tenant.unitId) : undefined;
          const property = unit ? propertiesById.get(unit.propertyId) : undefined;
          const landlord = tenant?.landlordId ? usersById.get(tenant.landlordId) : undefined;
          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            phone: user.phone,
            trustScore: user.trustScore,
            blacklisted: user.blacklisted,
            emailVerificationStatus: user.emailVerificationStatus,
            identityVerificationStatus: user.identityVerificationStatus,
            createdAt: user.createdAt.toISOString(),
            tenantStatus: tenant?.status ?? null,
            unitNumber: unit?.number ?? null,
            propertyName: property?.name ?? null,
            landlordName: landlord ? `${landlord.firstName} ${landlord.lastName}`.trim() : null,
            propertyCount: user.role === 'landlord' ? propertyCountByLandlord[user.id] ?? 0 : null,
          };
        }),
      });
    } catch (error) {
      console.error('Unable to load admin accounts:', error);
      return res.status(503).json({ success: false, error: 'The account directory is temporarily unavailable.' });
    }
  });

  // Contact form submissions were written but nothing ever read them, so a message sent
  // through the public contact form reached no one. This is the triage path for that queue.
  const CONTACT_INQUIRY_STATUSES = ['new', 'handled', 'archived'];
  const serializeInquiry = (inquiry: {
    id: string; name: string; email: string; phone: string | null; reason: string; message: string;
    status: string; createdAt: Date; updatedAt: Date;
  }) => ({
    id: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    reason: inquiry.reason,
    message: inquiry.message,
    status: inquiry.status,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
  });

  app.get('/api/admin/contact-inquiries', requireRole('admin'), async (req, res) => {
    const requestedStatus = typeof req.query.status === 'string' ? req.query.status : '';
    const status = CONTACT_INQUIRY_STATUSES.includes(requestedStatus) ? requestedStatus : undefined;

    try {
      const [inquiries, grouped] = await Promise.all([
        prisma.contactInquiry.findMany({
          where: status ? { status } : undefined,
          orderBy: { createdAt: 'desc' },
          take: 200,
        }),
        prisma.contactInquiry.groupBy({ by: ['status'], _count: { _all: true } }),
      ]);

      const counts: Record<string, number> = { new: 0, handled: 0, archived: 0 };
      for (const row of grouped) counts[row.status] = row._count._all;

      return res.json({ success: true, data: inquiries.map(serializeInquiry), counts });
    } catch (error) {
      console.error('Unable to load contact enquiries:', error);
      return res.status(503).json({ success: false, error: 'The contact enquiry inbox is temporarily unavailable.' });
    }
  });

  app.patch('/api/admin/contact-inquiries/:id', requireRole('admin'), async (req, res) => {
    const user = (req as AuthRequest).user;
    if (!user) return res.status(401).json({ success: false, error: 'Authentication required.' });

    const status = sanitizeString(req.body?.status);
    if (!CONTACT_INQUIRY_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be new, handled, or archived.' });
    }

    try {
      const existing = await prisma.contactInquiry.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Enquiry not found.' });
      }

      const inquiry = await prisma.contactInquiry.update({
        where: { id: existing.id },
        data: { status },
      });

      await recordAudit({
        actorId: user.sub,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'contact_enquiry.status',
        targetType: 'contact_enquiry',
        targetId: inquiry.id,
        summary: `Contact enquiry moved to ${status}`,
        detail: { status, reason: inquiry.reason },
      });

      return res.json({ success: true, inquiry: serializeInquiry(inquiry) });
    } catch (error) {
      console.error('Unable to update contact enquiry:', error);
      return res.status(503).json({ success: false, error: 'The enquiry status could not be saved.' });
    }
  });

  app.get('/api/admin/audit', requireRole('admin'), async (req, res) => {
    const action = typeof req.query.action === 'string' ? req.query.action : '';

    try {
      const entries = await prisma.auditLog.findMany({
        where: action ? { action } : undefined,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return res.json({
        success: true,
        data: entries.map((entry) => ({ ...entry, createdAt: entry.createdAt.toISOString() })),
      });
    } catch (error) {
      console.error('Unable to load the audit log:', error);
      return res.status(503).json({ success: false, error: 'The audit log is temporarily unavailable.' });
    }
  });

  // Verification is recorded, never inferred. Every change names the admin who made it and the
  // basis they relied on, because a "verified" badge with no reviewer behind it is a false claim.
  const VERIFICATION_FIELDS: Record<string, keyof Pick<Prisma.UserSelect, 'identityVerificationStatus' | 'emailVerificationStatus' | 'phoneVerificationStatus' | 'propertyAuthorizationStatus' | 'businessRegistrationStatus' | 'incomeVerificationStatus' | 'payoutVerificationStatus'>> = {
    identity: 'identityVerificationStatus',
    email: 'emailVerificationStatus',
    phone: 'phoneVerificationStatus',
    property_authorization: 'propertyAuthorizationStatus',
    business_registration: 'businessRegistrationStatus',
    income: 'incomeVerificationStatus',
    payout: 'payoutVerificationStatus',
  };
  const VERIFICATION_STATUSES = ['not_started', 'pending', 'needs_review', 'verified', 'rejected'];
  const VERIFICATION_ACCOUNT_SELECT = {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
    role: true,
    identityVerificationStatus: true,
    emailVerificationStatus: true,
    phoneVerificationStatus: true,
    propertyAuthorizationStatus: true,
    businessRegistrationStatus: true,
    incomeVerificationStatus: true,
    payoutVerificationStatus: true,
  };

  app.get('/api/admin/users/:id/verification', requireRole('admin'), async (req, res) => {
    try {
      const account = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: VERIFICATION_ACCOUNT_SELECT,
      });
      if (!account) {
        return res.status(404).json({ success: false, error: 'Account not found.' });
      }

      const reviews = await prisma.verificationReview.findMany({
        where: { userId: account.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { reviewer: { select: { firstName: true, lastName: true, email: true } } },
      });

      return res.json({
        success: true,
        account,
        reviews: reviews.map((review) => ({
          id: review.id,
          field: review.field,
          fromStatus: review.fromStatus,
          toStatus: review.toStatus,
          basis: review.basis,
          createdAt: review.createdAt.toISOString(),
          reviewerName: `${review.reviewer.firstName} ${review.reviewer.lastName}`.trim(),
          reviewerEmail: review.reviewer.email,
        })),
      });
    } catch (error) {
      console.error('Unable to load verification history:', error);
      return res.status(503).json({ success: false, error: 'Verification history is temporarily unavailable.' });
    }
  });

  app.post('/api/admin/users/:id/verification', requireRole('admin'), async (req, res) => {
    const actor = (req as AuthRequest).user;
    if (!actor) return res.status(401).json({ success: false, error: 'Authentication required.' });

    const field = sanitizeString(req.body?.field);
    const status = sanitizeString(req.body?.status);
    const basis = sanitizeString(req.body?.basis);

    const column = VERIFICATION_FIELDS[field];
    if (!column) {
      return res.status(400).json({ success: false, error: 'Unknown verification field.' });
    }
    if (!VERIFICATION_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be not_started, pending, needs_review, verified, or rejected.' });
    }

    const minimumBasis = status === 'verified' ? 25 : 10;
    if (basis.length < minimumBasis || basis.length > 500) {
      return res.status(400).json({
        success: false,
        error: status === 'verified'
          ? 'Record what was actually checked before marking this verified (at least 25 characters).'
          : 'Describe how this decision was reached (at least 10 characters).',
      });
    }

    try {
      const existing = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: VERIFICATION_ACCOUNT_SELECT,
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Account not found.' });
      }

      const fromStatus = existing[column];
      if (fromStatus === status) {
        return res.status(400).json({ success: false, error: 'That field already has this status.' });
      }

      const [updated, review] = await prisma.$transaction([
        prisma.user.update({
          where: { id: existing.id },
          data: { [column]: status } as Prisma.UserUpdateInput,
          select: VERIFICATION_ACCOUNT_SELECT,
        }),
        prisma.verificationReview.create({
          data: {
            userId: existing.id,
            field,
            fromStatus,
            toStatus: status as Prisma.EnumVerificationStatusFieldUpdateOperationsInput['set'],
            basis,
            reviewerId: actor.sub,
          },
        }),
      ]);

      await recordAudit({
        actorId: actor.sub,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'verification.record',
        targetType: 'account',
        targetId: existing.id,
        summary: `${field} verification ${fromStatus} to ${status}`,
        detail: { field, fromStatus, toStatus: status, reviewId: review.id },
      });

      return res.json({
        success: true,
        account: updated,
        review: {
          id: review.id,
          field: review.field,
          fromStatus: review.fromStatus,
          toStatus: review.toStatus,
          basis: review.basis,
          createdAt: review.createdAt.toISOString(),
          reviewerName: `${actor.firstName} ${actor.lastName}`.trim(),
          reviewerEmail: actor.email,
        },
      });
    } catch (error) {
      console.error('Unable to record verification decision:', error);
      return res.status(503).json({ success: false, error: 'The verification decision could not be saved.' });
    }
  });

  app.get('/api/dashboard-stats', async (req, res) => {
    const user = (req as AuthRequest).user!;

    try {
      if (user.role === 'admin') {
        const [propertyCount, unitCount, tenantCount, openMaintenance, pendingPayments] = await Promise.all([
          prisma.property.count(),
          prisma.unit.count(),
          prisma.tenant.count({ where: { status: 'Active' } }),
          prisma.maintenanceRequest.count({ where: { status: { not: 'closed' } } }),
          prisma.payment.count({ where: { status: 'pending' } }),
        ]);

        return res.json({
          success: true,
          data: { propertyCount, unitCount, tenantCount, openMaintenance, pendingPayments },
        });
      }

      if (user.role === 'landlord') {
        const ownedProperties = await prisma.property.findMany({
          where: { landlordId: user.sub },
          select: { id: true },
        });
        const propertyIds = ownedProperties.map((item) => item.id);
        const ownedUnits = await prisma.unit.findMany({
          where: { propertyId: { in: propertyIds } },
          select: { id: true },
        });
        const unitIds = ownedUnits.map((item) => item.id);
        const ownedTenants = await prisma.tenant.findMany({
          where: { unitId: { in: unitIds } },
          select: { id: true, status: true },
        });
        const tenantIds = ownedTenants.map((item) => item.id);
        const [openMaintenance, pendingPayments] = await Promise.all([
          prisma.maintenanceRequest.count({ where: { propertyId: { in: propertyIds }, status: { not: 'closed' } } }),
          prisma.payment.count({ where: { tenantId: { in: tenantIds }, status: 'pending' } }),
        ]);

        return res.json({
          success: true,
          data: {
            propertyCount: ownedProperties.length,
            unitCount: ownedUnits.length,
            tenantCount: ownedTenants.filter((item) => item.status === 'Active').length,
            openMaintenance,
            pendingPayments,
          },
        });
      }

      const tenant = await prisma.tenant.findFirst({
        where: { userId: user.sub },
        select: { id: true, unitId: true },
      });
      const [openMaintenance, pendingPayments] = tenant
        ? await Promise.all([
          prisma.maintenanceRequest.count({ where: { tenantId: tenant.id, status: { not: 'closed' } } }),
          prisma.payment.count({ where: { tenantId: tenant.id, status: 'pending' } }),
        ])
        : [0, 0];

      return res.json({
        success: true,
        data: {
          propertyCount: tenant?.unitId ? 1 : 0,
          unitCount: tenant?.unitId ? 1 : 0,
          tenantCount: tenant ? 1 : 0,
          openMaintenance,
          pendingPayments,
        },
      });
    } catch (error) {
      console.error('Unable to load dashboard statistics:', error);
      return res.status(503).json({ success: false, error: 'Dashboard statistics are temporarily unavailable.' });
    }
  });

  app.get('/api/properties', async (req, res) => {
    const user = (req as AuthRequest).user;

    const dbProperties = await readDatabaseOrFallback(undefined, async () => {
      const where = user?.role === 'admin' ? {} : { landlordId: user?.sub ?? '' };

      // Admins see every landlord's portfolio, so the landlord name travels with the row
      // instead of forcing the client to resolve an opaque landlordId.
      if (user?.role === 'admin') {
        const records = await prisma.property.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: { landlord: { select: { firstName: true, lastName: true, email: true } } },
        });
        return records.map((record) => ({
          ...mapDbProperty(record),
          createdAt: record.createdAt.toISOString(),
          landlordName: `${record.landlord.firstName} ${record.landlord.lastName}`.trim(),
          landlordEmail: record.landlord.email,
        }));
      }

      const records = await prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
      return records.map((record) => ({
        ...mapDbProperty(record),
        createdAt: record.createdAt.toISOString(),
      }));
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

  app.put('/api/properties/:id', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const { name, address, city, state, units: unitCount, manager } = req.body;

    try {
      const existing = await prisma.property.findUnique({
        where: { id: req.params.id },
        select: { id: true, landlordId: true },
      });
      if (!existing || (user.role !== 'admin' && existing.landlordId !== user.sub)) {
        return res.status(404).json({ success: false, error: 'Property not found.' });
      }

      const updated = await prisma.property.update({
        where: { id: existing.id },
        data: {
          ...(sanitizeString(name) ? { name: sanitizeString(name) } : {}),
          ...(sanitizeString(address) ? { address: sanitizeString(address) } : {}),
          ...(sanitizeString(city) ? { city: sanitizeString(city) } : {}),
          ...(sanitizeString(state) ? { state: sanitizeString(state) } : {}),
          ...(unitCount === undefined ? {} : { units: Math.max(0, Math.trunc(Number(unitCount)) || 0) }),
          ...(sanitizeString(manager) ? { manager: sanitizeString(manager) } : {}),
        },
      });

      return res.json({ success: true, data: mapDbProperty(updated) });
    } catch (error) {
      console.error('Unable to update property:', error);
      return res.status(503).json({ success: false, error: 'Unable to update this property right now.' });
    }
  });

  app.delete('/api/properties/:id', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.property.findUnique({
        where: { id: req.params.id },
        select: { id: true, landlordId: true },
      });
      if (!existing || (user.role !== 'admin' && existing.landlordId !== user.sub)) {
        return res.status(404).json({ success: false, error: 'Property not found.' });
      }

      const unitCount = await prisma.unit.count({ where: { propertyId: existing.id } });
      if (unitCount > 0) {
        return res.status(409).json({ success: false, error: 'Remove this property’s units before deleting the property.' });
      }

      await prisma.property.delete({ where: { id: existing.id } });
      return res.json({ success: true, message: 'Property deleted.' });
    } catch (error) {
      console.error('Unable to delete property:', error);
      return res.status(503).json({ success: false, error: 'Unable to delete this property right now.' });
    }
  });

  app.get('/api/listings', async (_req, res) => {
    try {
      const records = await prisma.unit.findMany({
        where: {
          isListed: true,
          status: 'vacant',
          property: { status: 'Active' },
        },
        include: {
          property: { select: { id: true, name: true, city: true, state: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
      return res.json({
        success: true,
        data: records.map((unit) => ({
          id: unit.id,
          number: unit.number,
          floor: unit.floor,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          rent: unit.rent,
          description: unit.listingDescription,
          property: unit.property,
        })),
      });
    } catch (error) {
      console.error('Unable to load public listings:', error);
      return res.status(503).json({ success: false, error: 'Homes are temporarily unavailable. Please try again shortly.' });
    }
  });

  app.post('/api/viewing-requests', requireRole('tenant'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const unitId = sanitizeString(req.body?.unitId);
    const message = sanitizeString(req.body?.message);
    if (!unitId || message.length > 1000) {
      return res.status(400).json({ success: false, error: 'Choose a home and keep your message under 1,000 characters.' });
    }

    try {
      const unit = await prisma.unit.findFirst({
        where: { id: unitId, isListed: true, status: 'vacant', property: { status: 'Active' } },
        select: { id: true },
      });
      if (!unit) return res.status(404).json({ success: false, error: 'This home is no longer available.' });

      const existingRequest = await prisma.viewingRequest.findFirst({
        where: { unitId, tenantId: user.sub, status: 'pending' },
        select: { id: true },
      });
      if (existingRequest) {
        return res.status(409).json({ success: false, error: 'You already have a pending viewing request for this home.' });
      }

      const viewingRequest = await prisma.viewingRequest.create({
        data: { unitId, tenantId: user.sub, message: message || null },
        select: { id: true, status: true, createdAt: true },
      });
      return res.status(201).json({ success: true, data: viewingRequest });
    } catch (error) {
      console.error('Unable to create viewing request:', error);
      return res.status(503).json({ success: false, error: 'Viewing requests are temporarily unavailable. Please try again shortly.' });
    }
  });

  app.get('/api/viewing-requests', requireRole('tenant', 'landlord'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const where = user.role === 'landlord'
      ? { unit: { property: { landlordId: user.sub } } }
      : { tenantId: user.sub };

    try {
      const records = await prisma.viewingRequest.findMany({
        where,
        include: {
          tenant: { select: { email: true } },
          unit: {
            select: {
              id: true,
              number: true,
              rent: true,
              property: { select: { name: true, city: true, state: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({
        success: true,
        data: records.map((record) => ({
          id: record.id,
          status: record.status,
          message: record.message,
          createdAt: record.createdAt,
          tenantEmail: user.role === 'landlord' ? record.tenant.email : undefined,
          unit: record.unit,
        })),
      });
    } catch (error) {
      console.error('Unable to load viewing requests:', error);
      return res.status(503).json({ success: false, error: 'Viewing requests are temporarily unavailable. Please try again shortly.' });
    }
  });

  app.patch('/api/viewing-requests/:id', requireRole('landlord'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const status = req.body?.status;
    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Choose confirm or decline for this request.' });
    }

    try {
      const request = await prisma.viewingRequest.findUnique({
        where: { id: req.params.id },
        include: { unit: { select: { property: { select: { landlordId: true } } } } },
      });
      if (!request || request.unit.property.landlordId !== user.sub) {
        return res.status(404).json({ success: false, error: 'Viewing request not found.' });
      }
      if (request.status !== 'pending') {
        return res.status(409).json({ success: false, error: 'This viewing request has already been reviewed.' });
      }

      const updated = await prisma.viewingRequest.update({
        where: { id: request.id },
        data: { status },
        select: { id: true, status: true, updatedAt: true },
      });
      return res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Unable to review viewing request:', error);
      return res.status(503).json({ success: false, error: 'Viewing requests are temporarily unavailable. Please try again shortly.' });
    }
  });

  app.put('/api/units/:id/listing', requireRole('landlord'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const isListed = req.body?.isListed;
    const listingDescription = sanitizeString(req.body?.listingDescription);
    if (typeof isListed !== 'boolean' || listingDescription.length > 1000) {
      return res.status(400).json({ success: false, error: 'Provide a listing status and a description under 1,000 characters.' });
    }

    try {
      const unit = await prisma.unit.findUnique({
        where: { id: req.params.id },
        include: { property: { select: { landlordId: true } } },
      });
      if (!unit || unit.property.landlordId !== user.sub) {
        return res.status(404).json({ success: false, error: 'Unit not found.' });
      }
      if (isListed && unit.status !== 'vacant') {
        return res.status(409).json({ success: false, error: 'Only vacant units can be listed.' });
      }

      const updated = await prisma.unit.update({
        where: { id: unit.id },
        data: { isListed, listingDescription: listingDescription || null },
      });
      return res.json({ success: true, data: mapDbUnit(updated) });
    } catch (error) {
      console.error('Unable to update listing:', error);
      return res.status(503).json({ success: false, error: 'Listing updates are temporarily unavailable. Please try again shortly.' });
    }
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

  app.post('/api/units', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const { propertyId, number, floor, bedrooms, bathrooms, rent, status } = req.body;
    const unitNumber = sanitizeString(number);
    const listingDescription = sanitizeString(req.body?.listingDescription);
    if (!propertyId || !unitNumber) {
      return res.status(400).json({ success: false, error: 'Property ID and unit number are required.' });
    }
    if (listingDescription.length > 1000) {
      return res.status(400).json({ success: false, error: 'Listing descriptions must be 1,000 characters or fewer.' });
    }
    if (!['vacant', 'maintenance'].includes(status ?? 'vacant')) {
      return res.status(400).json({ success: false, error: 'New units must be vacant or under maintenance.' });
    }

    try {
      const property = await prisma.property.findUnique({
        where: { id: String(propertyId) },
        select: { id: true, landlordId: true },
      });
      if (!property || (user.role !== 'admin' && property.landlordId !== user.sub)) {
        return res.status(404).json({ success: false, error: 'Property not found.' });
      }

      const record = await prisma.unit.create({
        data: {
          propertyId: property.id,
          number: unitNumber,
          floor: Number(floor || 1),
          bedrooms: Number(bedrooms || 1),
          bathrooms: Number(bathrooms || 1),
          rent: Number(rent || 0),
          status: status || 'vacant',
          listingDescription: listingDescription || null,
        },
      });
      return res.status(201).json({ success: true, data: mapDbUnit(record) });
    } catch (error) {
      console.error('Unable to create unit:', error);
      return res.status(503).json({ success: false, error: 'Units are temporarily unavailable. Please try again shortly.' });
    }
  });

  app.put('/api/units/:id', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const { propertyId, number, floor, bedrooms, bathrooms, rent, status, listingDescription } = req.body;
    const nextStatus = status === undefined ? undefined : String(status);
    if (nextStatus !== undefined && !['vacant', 'occupied', 'maintenance'].includes(nextStatus)) {
      return res.status(400).json({ success: false, error: 'Choose a valid unit status.' });
    }

    try {
      const existing = await prisma.unit.findUnique({
        where: { id: req.params.id },
        select: { id: true, propertyId: true, status: true, tenantId: true },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Unit not found.' });
      }

      const currentProperty = await prisma.property.findUnique({
        where: { id: existing.propertyId },
        select: { landlordId: true },
      });
      if (!currentProperty || (user.role !== 'admin' && currentProperty.landlordId !== user.sub)) {
        return res.status(404).json({ success: false, error: 'Unit not found.' });
      }

      let nextPropertyId = existing.propertyId;
      if (propertyId && propertyId !== existing.propertyId) {
        const nextProperty = await prisma.property.findUnique({
          where: { id: String(propertyId) },
          select: { id: true, landlordId: true },
        });
        if (!nextProperty || (user.role !== 'admin' && nextProperty.landlordId !== user.sub)) {
          return res.status(404).json({ success: false, error: 'Property not found.' });
        }
        nextPropertyId = nextProperty.id;
      }

      if (nextStatus === 'occupied' && !existing.tenantId) {
        return res.status(409).json({ success: false, error: 'Assign a tenant to this unit instead of marking it occupied.' });
      }

      const updated = await prisma.unit.update({
        where: { id: existing.id },
        data: {
          propertyId: nextPropertyId,
          ...(sanitizeString(number) ? { number: sanitizeString(number) } : {}),
          ...(floor === undefined ? {} : { floor: Math.trunc(Number(floor)) || 1 }),
          ...(bedrooms === undefined ? {} : { bedrooms: Math.trunc(Number(bedrooms)) || 0 }),
          ...(bathrooms === undefined ? {} : { bathrooms: Math.trunc(Number(bathrooms)) || 0 }),
          ...(rent === undefined ? {} : { rent: Math.max(0, Math.trunc(Number(rent)) || 0) }),
          ...(nextStatus === undefined ? {} : { status: nextStatus as 'vacant' | 'occupied' | 'maintenance' }),
          ...(listingDescription === undefined ? {} : { listingDescription: sanitizeString(listingDescription) || null }),
        },
      });

      await syncPropertyOccupancy(existing.propertyId);
      if (nextPropertyId !== existing.propertyId) {
        await syncPropertyOccupancy(nextPropertyId);
      }

      return res.json({ success: true, data: mapDbUnit(updated) });
    } catch (error) {
      console.error('Unable to update unit:', error);
      return res.status(503).json({ success: false, error: 'Unable to update this unit right now.' });
    }
  });

  app.delete('/api/units/:id', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.unit.findUnique({
        where: { id: req.params.id },
        select: { id: true, propertyId: true, tenantId: true },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Unit not found.' });
      }

      const property = await prisma.property.findUnique({
        where: { id: existing.propertyId },
        select: { landlordId: true },
      });
      if (!property || (user.role !== 'admin' && property.landlordId !== user.sub)) {
        return res.status(404).json({ success: false, error: 'Unit not found.' });
      }

      if (existing.tenantId) {
        return res.status(409).json({ success: false, error: 'Remove the tenant from this unit before deleting it.' });
      }

      await prisma.unit.delete({ where: { id: existing.id } });
      await syncPropertyOccupancy(existing.propertyId);
      return res.json({ success: true, message: 'Unit deleted.' });
    } catch (error) {
      console.error('Unable to delete unit:', error);
      return res.status(503).json({ success: false, error: 'Unable to delete this unit right now.' });
    }
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

  app.post('/api/tenants', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const firstName = sanitizeString(req.body?.firstName);
    const lastName = sanitizeString(req.body?.lastName);
    const email = sanitizeString(req.body?.email).toLowerCase();
    const phone = sanitizeString(req.body?.phone) || null;
    const unitId = sanitizeString(req.body?.unitId);
    const status = sanitizeString(req.body?.status) || 'Applicant';
    const leaseStart = sanitizeString(req.body?.leaseStart);
    const leaseEnd = sanitizeString(req.body?.leaseEnd);
    const rent = Math.max(0, Math.trunc(Number(req.body?.rent)) || 0);

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ success: false, error: 'First name, last name, and email are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }

    try {
      let unit: { id: string; propertyId: string; tenantId: string | null; status: string } | null = null;
      if (unitId) {
        const record = await prisma.unit.findUnique({
          where: { id: unitId },
          include: { property: { select: { landlordId: true } } },
        });
        if (!record || (user.role !== 'admin' && record.property.landlordId !== user.sub)) {
          return res.status(404).json({ success: false, error: 'Unit not found in your properties.' });
        }
        if (record.tenantId || record.status !== 'vacant') {
          return res.status(409).json({ success: false, error: 'Choose a vacant unit with no tenant assigned.' });
        }
        unit = { id: record.id, propertyId: record.propertyId, tenantId: record.tenantId, status: record.status };
      }

      const created = await prisma.tenant.create({
        data: {
          landlordId: user.role === 'admin' ? null : user.sub,
          firstName,
          lastName,
          email,
          phone,
          unitId: unit?.id ?? null,
          status,
          leaseStart: leaseStart ? new Date(leaseStart) : null,
          leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
          rent,
        },
      });

      if (unit) {
        await prisma.unit.update({ where: { id: unit.id }, data: { tenantId: created.id, status: 'occupied' } });
        await syncPropertyOccupancy(unit.propertyId);
      }

      return res.status(201).json({ success: true, data: mapDbTenant(created) });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ success: false, error: 'A tenant record already uses that email address.' });
      }
      console.error('Unable to create tenant:', error);
      return res.status(503).json({ success: false, error: 'Unable to add this tenant right now.' });
    }
  });

  app.put('/api/tenants/:id', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const firstName = sanitizeString(req.body?.firstName);
    const lastName = sanitizeString(req.body?.lastName);
    const email = sanitizeString(req.body?.email).toLowerCase();
    const phone = sanitizeString(req.body?.phone);
    const nextUnitId = sanitizeString(req.body?.unitId);
    const status = sanitizeString(req.body?.status);
    const leaseStart = sanitizeString(req.body?.leaseStart);
    const leaseEnd = sanitizeString(req.body?.leaseEnd);
    const rent = req.body?.rent;

    try {
      const existing = await prisma.tenant.findUnique({
        where: { id: req.params.id },
        select: { id: true, landlordId: true, unitId: true },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Tenant not found.' });
      }

      let accessGranted = user.role === 'admin' || existing.landlordId === user.sub;
      if (!accessGranted && existing.unitId) {
        const currentUnit = await prisma.unit.findUnique({
          where: { id: existing.unitId },
          include: { property: { select: { landlordId: true } } },
        });
        accessGranted = currentUnit?.property.landlordId === user.sub;
      }
      if (!accessGranted) {
        return res.status(404).json({ success: false, error: 'Tenant not found.' });
      }

      if (email && !isValidEmail(email)) {
        return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
      }

      let nextUnit: { id: string; propertyId: string; tenantId: string | null; status: string } | null = null;
      if (nextUnitId && nextUnitId !== existing.unitId) {
        const record = await prisma.unit.findUnique({
          where: { id: nextUnitId },
          include: { property: { select: { landlordId: true } } },
        });
        if (!record || (user.role !== 'admin' && record.property.landlordId !== user.sub)) {
          return res.status(404).json({ success: false, error: 'Unit not found in your properties.' });
        }
        if (record.tenantId || record.status !== 'vacant') {
          return res.status(409).json({ success: false, error: 'Choose a vacant unit with no tenant assigned.' });
        }
        nextUnit = { id: record.id, propertyId: record.propertyId, tenantId: record.tenantId, status: record.status };
      }

      const updated = await prisma.tenant.update({
        where: { id: existing.id },
        data: {
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
          ...(email ? { email } : {}),
          ...(req.body?.phone === undefined ? {} : { phone: phone || null }),
          ...(status ? { status } : {}),
          ...(leaseStart ? { leaseStart: new Date(leaseStart) } : {}),
          ...(leaseEnd ? { leaseEnd: new Date(leaseEnd) } : {}),
          ...(rent === undefined ? {} : { rent: Math.max(0, Math.trunc(Number(rent)) || 0) }),
          ...(nextUnit ? { unitId: nextUnit.id } : {}),
        },
      });

      if (nextUnit && existing.unitId) {
        const previousUnit = await prisma.unit.findUnique({
          where: { id: existing.unitId },
          select: { id: true, propertyId: true, tenantId: true },
        });
        if (previousUnit && previousUnit.tenantId === existing.id) {
          await prisma.unit.update({ where: { id: previousUnit.id }, data: { tenantId: null, status: 'vacant' } });
          await syncPropertyOccupancy(previousUnit.propertyId);
        }
      }
      if (nextUnit) {
        await prisma.unit.update({ where: { id: nextUnit.id }, data: { tenantId: existing.id, status: 'occupied' } });
        await syncPropertyOccupancy(nextUnit.propertyId);
      }

      return res.json({ success: true, data: mapDbTenant(updated) });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        return res.status(409).json({ success: false, error: 'A tenant record already uses that email address.' });
      }
      console.error('Unable to update tenant:', error);
      return res.status(503).json({ success: false, error: 'Unable to update this tenant right now.' });
    }
  });

  app.delete('/api/tenants/:id', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user!;

    try {
      const existing = await prisma.tenant.findUnique({
        where: { id: req.params.id },
        select: { id: true, landlordId: true, unitId: true },
      });
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Tenant not found.' });
      }

      let accessGranted = user.role === 'admin' || existing.landlordId === user.sub;
      if (!accessGranted && existing.unitId) {
        const unit = await prisma.unit.findUnique({
          where: { id: existing.unitId },
          include: { property: { select: { landlordId: true } } },
        });
        accessGranted = unit?.property.landlordId === user.sub;
      }
      if (!accessGranted) {
        return res.status(404).json({ success: false, error: 'Tenant not found.' });
      }

      if (existing.unitId) {
        const unit = await prisma.unit.findUnique({
          where: { id: existing.unitId },
          select: { id: true, propertyId: true, tenantId: true },
        });
        if (unit && unit.tenantId === existing.id) {
          await prisma.unit.update({ where: { id: unit.id }, data: { tenantId: null, status: 'vacant' } });
          await syncPropertyOccupancy(unit.propertyId);
        }
      }

      await prisma.tenant.delete({ where: { id: existing.id } });
      return res.json({ success: true, message: 'Tenant deleted.' });
    } catch (error) {
      console.error('Unable to delete tenant:', error);
      return res.status(503).json({ success: false, error: 'Unable to delete this tenant right now.' });
    }
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

    // Degraded development fallback only. It stays scoped to the caller so a failed
    // database read never turns into a cross-account data leak.
    let results = user?.role === 'admin'
      ? [...payments]
      : user?.role === 'tenant'
        ? payments.filter((payment) => tenants.some((tenant) => tenant.userId === user.sub && tenant.id === payment.tenantId))
        : payments.filter((payment) => {
          const tenant = tenants.find((item) => item.id === payment.tenantId);
          const unit = tenant?.unitId ? units.find((item) => item.id === tenant.unitId) : undefined;
          return Boolean(unit && properties.some((property) => property.id === unit.propertyId && property.landlordId === user?.sub));
        });
    if (tenantId) {
      results = results.filter((payment) => payment.tenantId === tenantId);
    }
    if (status) {
      results = results.filter((payment) => payment.status === status);
    }
    res.json({ success: true, data: results });
  });

  app.post('/api/payments', requireRole('landlord', 'admin'), async (req, res) => {
    const user = (req as AuthRequest).user!;
    const { tenantId, unitId, dueDate, paidDate, status, method } = req.body;
    const amount = Number(req.body?.amount);

    if (!tenantId || !unitId || !dueDate) {
      return res.status(400).json({ success: false, error: 'Tenant ID, unit ID, amount, and due date are required.' });
    }
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0 || amount > 100_000_000) {
      return res.status(400).json({ success: false, error: 'Enter a payment amount as a whole number greater than zero.' });
    }
    if (Number.isNaN(Date.parse(String(dueDate)))) {
      return res.status(400).json({ success: false, error: 'Enter a valid due date.' });
    }
    if (paidDate && Number.isNaN(Date.parse(String(paidDate)))) {
      return res.status(400).json({ success: false, error: 'Enter a valid paid date.' });
    }
    if (status !== undefined && !['paid', 'pending', 'overdue'].includes(String(status))) {
      return res.status(400).json({ success: false, error: 'Choose a valid payment status.' });
    }

    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: String(tenantId) },
        select: { id: true, landlordId: true },
      });
      if (!tenant) {
        return res.status(404).json({ success: false, error: 'Tenant not found.' });
      }

      // The unit is only accepted if it belongs to the same landlord as the tenant record,
      // so a payment can never be attached to someone else's property.
      const unit = await prisma.unit.findUnique({
        where: { id: String(unitId) },
        select: { id: true, property: { select: { landlordId: true } } },
      });
      if (!unit) {
        return res.status(404).json({ success: false, error: 'Unit not found.' });
      }
      if (user.role !== 'admin') {
        if (tenant.landlordId !== user.sub || unit.property.landlordId !== user.sub) {
          return res.status(404).json({ success: false, error: 'Tenant not found.' });
        }
      }

      const record = await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          unitId: unit.id,
          amount,
          dueDate: new Date(String(dueDate)),
          paidDate: paidDate ? new Date(String(paidDate)) : null,
          status: (status || (paidDate ? 'paid' : 'pending')) as 'paid' | 'pending' | 'overdue',
          method: sanitizeString(method) || 'Manual',
        },
      });

      return res.status(201).json({
        success: true,
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
      });
    } catch (error) {
      console.error('Unable to record payment:', error);
      return res.status(503).json({ success: false, error: 'Payments are temporarily unavailable. Please try again shortly.' });
    }
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

  app.get('/api/messages', async (req, res) => {
    const user = (req as AuthRequest).user!;

    try {
      const records = await prisma.message.findMany({
        where: { OR: [{ senderId: user.sub }, { recipientId: user.sub }] },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return res.json({ success: true, data: records });
    } catch (error) {
      console.error('Unable to load messages:', error);
      return res.status(503).json({ success: false, error: 'Messages are temporarily unavailable.' });
    }
  });

  // The sender is always the authenticated account, never a value taken from the request.
  app.post('/api/messages', async (req, res) => {
    const user = (req as AuthRequest).user!;
    const recipientId = sanitizeString(req.body?.recipientId);
    const subject = sanitizeString(req.body?.subject);
    const body = sanitizeString(req.body?.body);

    if (!recipientId || !subject || !body) {
      return res.status(400).json({ success: false, error: 'Recipient, subject and message body are required.' });
    }
    if (subject.length > 160 || body.length > 4000) {
      return res.status(400).json({ success: false, error: 'Keep the subject under 160 and the message under 4,000 characters.' });
    }

    try {
      const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
      if (!recipient) {
        return res.status(404).json({ success: false, error: 'Recipient not found.' });
      }

      const record = await prisma.message.create({
        data: { senderId: user.sub, recipientId: recipient.id, subject, body },
      });
      return res.status(201).json({ success: true, data: record });
    } catch (error) {
      console.error('Unable to send message:', error);
      return res.status(503).json({ success: false, error: 'Unable to send this message right now.' });
    }
  });

  app.get('/api/documents', async (req, res) => {
    const user = (req as AuthRequest).user!;

    try {
      const records = await prisma.document.findMany({
        where: { ownerId: user.sub },
        orderBy: { date: 'desc' },
      });
      return res.json({
        success: true,
        data: records.map((record) => ({
          id: record.id,
          name: record.name,
          type: record.type,
          date: record.date.toISOString().split('T')[0],
          size: record.size,
          tags: record.tags,
        })),
      });
    } catch (error) {
      console.error('Unable to load documents:', error);
      return res.status(503).json({ success: false, error: 'Documents are temporarily unavailable.' });
    }
  });

  // Only document metadata is stored. No file bytes and no external URL are accepted,
  // so this endpoint can never become a back door for identity or financial files.
  app.post('/api/documents', async (req, res) => {
    const user = (req as AuthRequest).user!;
    const name = sanitizeString(req.body?.name);
    const requestedType = sanitizeString(req.body?.type);
    const dateInput = sanitizeString(req.body?.date);
    const size = sanitizeString(req.body?.size) || '0 KB';
    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags.slice(0, 10).map((tag: unknown) => sanitizeString(String(tag)).slice(0, 40)).filter(Boolean)
      : [];

    if (!name) {
      return res.status(400).json({ success: false, error: 'A document name is required.' });
    }

    const type = ['Lease', 'Receipt', 'Notice', 'Other'].includes(requestedType) ? requestedType : 'Other';
    const date = dateInput ? new Date(dateInput) : new Date();
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ success: false, error: 'Provide a valid document date.' });
    }

    try {
      const record = await prisma.document.create({
        data: { ownerId: user.sub, name: name.slice(0, 160), type, date, size, tags },
      });
      return res.status(201).json({
        success: true,
        data: {
          id: record.id,
          name: record.name,
          type: record.type,
          date: record.date.toISOString().split('T')[0],
          size: record.size,
          tags: record.tags,
        },
      });
    } catch (error) {
      console.error('Unable to save document record:', error);
      return res.status(503).json({ success: false, error: 'Unable to save this document record right now.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    // The dist folder also contains the Node server bundle. Never serve executable
    // server artifacts or source maps as public static files.
    app.use((req, res, next) => {
      if (/\.(?:cjs|map)$/i.test(req.path)) {
        return res.status(404).end();
      }
      next();
    });
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
