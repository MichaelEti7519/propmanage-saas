// Temporary end-to-end check for step 3 (sessions, reset, email verification, second factor).
// Run with: node scripts/verify-security.mjs   (server must be running on BASE)
import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const BASE = process.env.VERIFY_BASE || 'http://127.0.0.1:3000';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const stamp = Date.now();
const adminEmail = `qa-sec-admin-${stamp}@example.test`;
const tenantEmail = `qa-sec-tenant-${stamp}@example.test`;
const tenantPassword = 'Qa-Sec-Tenant-Pass!2026';
const oldPassword = 'Qa-Sec-Admin-Pass!2026';
const newPassword = 'Qa-Sec-Admin-New!2026';

let pass = 0;
const failures = [];
function check(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    failures.push(name);
    console.log(`FAIL  ${name}${detail === undefined ? '' : ` :: ${JSON.stringify(detail)}`}`);
  }
}

async function call(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32Decode(input) {
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of input.toUpperCase().replace(/[^A-Z2-7]/g, '')) {
    value = (value << 5) | BASE32.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
function totp(secret, offsetSteps = 0) {
  const counter = Math.floor(Date.now() / 30000) + offsetSteps;
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) | (digest[offset + 1] << 16) | (digest[offset + 2] << 8) | digest[offset + 3];
  return String(binary % 1_000_000).padStart(6, '0');
}

async function login(email, password) {
  return call('/api/auth/login', { method: 'POST', body: { email, password } });
}

async function main() {
  const passwordHash = await bcrypt.hash(oldPassword, 12);
  const admin = await prisma.user.create({
    data: { firstName: 'Qa', lastName: 'Security', email: adminEmail, passwordHash, role: 'admin' },
  });
  const tenant = await prisma.user.create({
    data: {
      firstName: 'Qa',
      lastName: 'Tenant',
      email: tenantEmail,
      passwordHash: await bcrypt.hash(tenantPassword, 12),
      role: 'tenant',
    },
  });
  console.log(`temp accounts: ${admin.id} / ${tenant.id}\n`);

  // --- Session issuance and rotation -----------------------------------------------------------
  const first = await login(adminEmail, oldPassword);
  check('login returns an access token and a refresh token', first.status === 200 && Boolean(first.json?.token) && Boolean(first.json?.refreshToken), first.json);
  check('login returns a refresh expiry about 30 days out', (() => {
    const ms = new Date(first.json?.refreshTokenExpiresAt || 0).getTime() - Date.now();
    return ms > 29 * 864e5 && ms < 31 * 864e5;
  })(), first.json?.refreshTokenExpiresAt);

  const rotated = await call('/api/auth/refresh', { method: 'POST', body: { refreshToken: first.json.refreshToken } });
  check('refresh rotates the token and mints a new access token', rotated.status === 200 && rotated.json.refreshToken !== first.json.refreshToken && Boolean(rotated.json.token), rotated.json);

  const reuse = await call('/api/auth/refresh', { method: 'POST', body: { refreshToken: first.json.refreshToken } });
  check('replaying a rotated refresh token is rejected', reuse.status === 401, reuse);

  const familyAfterReuse = await call('/api/auth/refresh', { method: 'POST', body: { refreshToken: rotated.json.refreshToken } });
  check('replay revokes the whole token family', familyAfterReuse.status === 401, familyAfterReuse);

  const second = await login(adminEmail, oldPassword);
  const liveSessions = await call('/api/auth/sessions', { token: second.json.token });
  check('sessions endpoint lists the live session', liveSessions.status === 200 && liveSessions.json.data.length === 1, liveSessions.json);

  const loggedOut = await call('/api/auth/logout', { method: 'POST', body: { refreshToken: second.json.refreshToken } });
  const afterLogout = await call('/api/auth/refresh', { method: 'POST', body: { refreshToken: second.json.refreshToken } });
  check('logout revokes the refresh token', loggedOut.status === 200 && afterLogout.status === 401, { loggedOut, afterLogout });

  const third = await login(adminEmail, oldPassword);
  await call('/api/auth/logout-all', { method: 'POST', token: third.json.token });
  const sessionsAfterAll = await call('/api/auth/sessions', { method: 'GET', token: third.json.token });
  const refreshAfterAll = await call('/api/auth/refresh', { method: 'POST', body: { refreshToken: third.json.refreshToken } });
  check('logout-all revokes every session', refreshAfterAll.status === 401, { refreshAfterAll });

  const wrongPassword = await login(adminEmail, 'Definitely-Not-The-Password1');
  check('a wrong password is rejected', wrongPassword.status === 401, wrongPassword);

  // --- Password reset --------------------------------------------------------------------------
  const unknown = await call('/api/auth/password-reset/request', { method: 'POST', body: { email: `nobody-${stamp}@example.test` } });
  const known = await call('/api/auth/password-reset/request', { method: 'POST', body: { email: adminEmail } });
  check('reset request answers identically for unknown and known addresses', unknown.status === 200 && known.status === 200 && unknown.json.message === known.json.message, { unknown, known });

  const storedReset = await prisma.passwordResetToken.count({ where: { userId: admin.id } });
  check('reset request stores exactly one token row', storedReset === 1, storedReset);

  const badReset = await call('/api/auth/password-reset/confirm', { method: 'POST', body: { token: 'not-a-real-token', newPassword } });
  check('reset confirm rejects an unknown token', badReset.status === 400, badReset);

  const rawReset = crypto.randomBytes(32).toString('base64url');
  await prisma.passwordResetToken.create({
    data: { userId: admin.id, tokenHash: sha256(rawReset), expiresAt: new Date(Date.now() + 30 * 60_000) },
  });
  const resetDone = await call('/api/auth/password-reset/confirm', { method: 'POST', body: { token: rawReset, newPassword } });
  check('reset confirm accepts a valid token', resetDone.status === 200, resetDone);

  const replayReset = await call('/api/auth/password-reset/confirm', { method: 'POST', body: { token: rawReset, newPassword: 'Another-Qa-Pass!2026' } });
  check('a reset token is single use', replayReset.status === 400, replayReset);

  const oldLogin = await login(adminEmail, oldPassword);
  const newLogin = await login(adminEmail, newPassword);
  check('the old password stops working after a reset', oldLogin.status === 401, oldLogin);
  check('the new password works after a reset', newLogin.status === 200 && Boolean(newLogin.json.token), newLogin);

  const resetSessions = await prisma.refreshToken.count({ where: { userId: admin.id, revokedAt: null } });
  check('a password reset leaves exactly one live session (the new login)', resetSessions === 1, resetSessions);

  // weak password guard
  const weakReset = await call('/api/auth/password-reset/confirm', { method: 'POST', body: { token: rawReset, newPassword: 'short' } });
  check('reset confirm rejects a password that breaks the length rule', weakReset.status === 400, weakReset);

  // --- Email verification ----------------------------------------------------------------------
  const tenantLogin = await login(tenantEmail, tenantPassword);
  const verifyRequest = await call('/api/auth/email-verification/request', { method: 'POST', token: tenantLogin.json.token });
  check('email verification request succeeds for an unverified account', verifyRequest.status === 200, verifyRequest);

  const rawVerify = crypto.randomBytes(32).toString('base64url');
  await prisma.emailVerificationToken.create({
    data: { userId: tenant.id, tokenHash: sha256(rawVerify), expiresAt: new Date(Date.now() + 60 * 60_000) },
  });
  const badVerify = await call('/api/auth/email-verification/confirm', { method: 'POST', body: { token: 'nope' } });
  check('email confirmation rejects an unknown token', badVerify.status === 400, badVerify);

  const verifyDone = await call('/api/auth/email-verification/confirm', { method: 'POST', body: { token: rawVerify } });
  const tenantAfter = await prisma.user.findUnique({ where: { id: tenant.id } });
  check('email confirmation marks the address verified', verifyDone.status === 200 && tenantAfter.emailVerificationStatus === 'verified', { verifyDone, status: tenantAfter.emailVerificationStatus });

  const review = await prisma.verificationReview.findFirst({ where: { userId: tenant.id, field: 'email' } });
  check('email confirmation writes an accountable review row', Boolean(review) && review.reviewerId === tenant.id && review.toStatus === 'verified', review);

  const verifyAgain = await call('/api/auth/email-verification/request', { method: 'POST', token: tenantLogin.json.token });
  check('a verified address is not asked to verify twice', verifyAgain.status === 400, verifyAgain);

  const anonVerifyRequest = await call('/api/auth/email-verification/request', { method: 'POST' });
  check('email verification request requires a session', anonVerifyRequest.status === 401, anonVerifyRequest);

  // --- Second factor ----------------------------------------------------------------------------
  const tenantMfa = await call('/api/auth/mfa', { token: tenantLogin.json.token });
  check('second factor is not offered to tenants', tenantMfa.status === 200 && tenantMfa.json.data.available === false, tenantMfa.json);

  const tenantSetup = await call('/api/auth/mfa/setup', { method: 'POST', token: tenantLogin.json.token });
  check('tenants cannot start second factor setup', tenantSetup.status === 403, tenantSetup);

  const adminLogin = await login(adminEmail, newPassword);
  const adminMfaBefore = await call('/api/auth/mfa', { token: adminLogin.json.token });
  check('admin starts with no second factor', adminMfaBefore.status === 200 && adminMfaBefore.json.data.enabled === false, adminMfaBefore.json);

  const setup = await call('/api/auth/mfa/setup', { method: 'POST', token: adminLogin.json.token });
  const secret = setup.json?.data?.secret;
  const recoveryCodes = setup.json?.data?.recoveryCodes ?? [];
  check('setup returns a base32 secret, an otpauth URI, and 8 recovery codes', setup.status === 200 && /^[A-Z2-7]{16,}$/.test(secret || '') && setup.json.data.otpauthUrl.startsWith('otpauth://totp/') && recoveryCodes.length === 8, { secret, count: recoveryCodes.length });

  const pendingState = await call('/api/auth/mfa', { token: adminLogin.json.token });
  check('an unfinished setup is reported as pending, not enabled', pendingState.json.data.pendingSetup === true && pendingState.json.data.enabled === false, pendingState.json);

  const wrongEnable = await call('/api/auth/mfa/enable', { method: 'POST', token: adminLogin.json.token, body: { code: '000000' } });
  check('a wrong code cannot switch the second factor on', wrongEnable.status === 400, wrongEnable);

  const enable = await call('/api/auth/mfa/enable', { method: 'POST', token: adminLogin.json.token, body: { code: totp(secret) } });
  check('a valid code switches the second factor on', enable.status === 200, enable);

  const enabledState = await call('/api/auth/mfa', { token: adminLogin.json.token });
  check('second factor state reports enabled with 8 recovery codes', enabledState.json.data.enabled === true && enabledState.json.data.recoveryCodesRemaining === 8, enabledState.json);

  const challengedLogin = await login(adminEmail, newPassword);
  check('password login now stops at the second factor', challengedLogin.status === 200 && challengedLogin.json.mfaRequired === true && Boolean(challengedLogin.json.mfaToken) && !challengedLogin.json.token, challengedLogin.json);

  const wrongCode = await call('/api/auth/mfa/verify', { method: 'POST', body: { mfaToken: challengedLogin.json.mfaToken, code: '111111' } });
  check('a wrong second factor code is rejected', wrongCode.status === 401, wrongCode);

  const wrongPurpose = await call('/api/auth/mfa/verify', { method: 'POST', body: { mfaToken: adminLogin.json.token, code: totp(secret) } });
  check('an ordinary access token cannot be used as a sign-in ticket', wrongPurpose.status === 401, wrongPurpose);

  const verified = await call('/api/auth/mfa/verify', { method: 'POST', body: { mfaToken: challengedLogin.json.mfaToken, code: totp(secret) } });
  check('a valid code completes sign-in with a session', verified.status === 200 && Boolean(verified.json.token) && Boolean(verified.json.refreshToken), verified.json);

  const recoveryLogin = await login(adminEmail, newPassword);
  const recoveryUse = await call('/api/auth/mfa/verify', { method: 'POST', body: { mfaToken: recoveryLogin.json.mfaToken, code: recoveryCodes[0] } });
  check('a recovery code completes sign-in', recoveryUse.status === 200 && recoveryUse.json.usedRecoveryCode === true, recoveryUse.json);
  check('one recovery code is burned per use', recoveryUse.json.recoveryCodesRemaining === 7, recoveryUse.json.recoveryCodesRemaining);

  const recoveryReplay = await login(adminEmail, newPassword);
  const recoveryReuse = await call('/api/auth/mfa/verify', { method: 'POST', body: { mfaToken: recoveryReplay.json.mfaToken, code: recoveryCodes[0] } });
  check('a used recovery code cannot be replayed', recoveryReuse.status === 401, recoveryReuse);

  const wrongDisable = await call('/api/auth/mfa/disable', { method: 'POST', token: verified.json.token, body: { password: 'Nope-Not-The-Password1', code: totp(secret) } });
  check('disabling the second factor needs the correct password', wrongDisable.status === 403, wrongDisable);

  const disable = await call('/api/auth/mfa/disable', { method: 'POST', token: verified.json.token, body: { password: newPassword, code: totp(secret) } });
  check('the correct password and a code switch it off', disable.status === 200, disable);

  const afterDisable = await login(adminEmail, newPassword);
  check('login no longer challenges once it is off', afterDisable.status === 200 && !afterDisable.json.mfaRequired && Boolean(afterDisable.json.token), afterDisable.json);

  const cleared = await prisma.user.findUnique({ where: { id: admin.id }, select: { totpSecret: true, totpEnabledAt: true, recoveryCodes: true } });
  check('disabling clears the secret and the recovery codes', cleared.totpSecret === null && cleared.totpEnabledAt === null && cleared.recoveryCodes.length === 0, cleared);

  const audits = await prisma.auditLog.findMany({ where: { actorId: admin.id, action: { in: ['mfa.enable', 'mfa.disable'] } }, select: { action: true } });
  check('enabling and disabling are both audited', audits.length === 2, audits);

  // --- Cleanup ---------------------------------------------------------------------------------
  const userIds = [admin.id, tenant.id];
  await prisma.auditLog.deleteMany({ where: { OR: [{ actorId: { in: userIds } }, { targetId: { in: userIds } }] } });
  await prisma.verificationReview.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  const leftovers = await prisma.user.count({ where: { email: { in: [adminEmail, tenantEmail] } } });
  check('temp accounts are cleaned up', leftovers === 0, leftovers);

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('failed checks:');
    for (const name of failures) console.log(`  - ${name}`);
  }
}

main()
  .catch((error) => {
    console.error('HARNESS ERROR', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
