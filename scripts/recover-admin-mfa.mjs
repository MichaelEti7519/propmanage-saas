// Operator recovery: remove a lost authenticator only after two operators verify the admin offline.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const targetEmail = (process.argv[2] ?? '').trim().toLowerCase();
const operator = (process.env.ADMIN_RECOVERY_OPERATOR ?? '').trim().toLowerCase();
const approver = (process.env.ADMIN_RECOVERY_APPROVER ?? '').trim().toLowerCase();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) throw new Error('Usage: node scripts/recover-admin-mfa.mjs admin@example.com');
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
if (!validEmail(operator) || !validEmail(approver) || operator === approver || targetEmail === operator || targetEmail === approver) {
  throw new Error('Set valid, distinct operator and approver identities that are different from the target admin.');
}
if (process.env.NODE_ENV === 'production' && !process.argv.includes('--confirm-production-recovery')) {
  throw new Error('Production recovery requires --confirm-production-recovery.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const rl = createInterface({ input, output });
try {
  console.log(`Target: ${targetEmail}`);
  console.log(`Operator: ${operator}; approver: ${approver}`);
  console.log('Verify the administrator’s identity through the approved offline process before continuing.');
  const confirmation = await rl.question(`Type RECOVER ${targetEmail} to revoke sessions and reset MFA: `);
  if (confirmation !== `RECOVER ${targetEmail}`) throw new Error('Recovery cancelled: confirmation did not match.');

  await prisma.$transaction(async (tx) => {
    const account = await tx.user.findUnique({ where: { email: targetEmail }, select: { id: true, role: true } });
    if (!account || account.role !== 'admin') throw new Error('Recovery stopped: target is not an administrator.');
    await tx.user.update({ where: { id: account.id }, data: { totpSecret: null, totpEnabledAt: null, recoveryCodes: [] } });
    await tx.refreshToken.updateMany({
      where: { userId: account.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'admin_mfa_recovery' },
    });
    await tx.auditLog.create({
      data: {
        actorEmail: `${operator}; approved by ${approver}`,
        actorRole: 'admin',
        action: 'mfa.operator_recovery',
        targetType: 'account',
        targetId: account.id,
        summary: 'Administrator MFA reset by verified operator recovery',
      },
    });
  }, { isolationLevel: 'Serializable' });
  console.log('MFA reset and sessions revoked. The administrator can sign in to enroll a new authenticator; privileged APIs stay locked until enrollment completes.');
} finally {
  rl.close();
  await prisma.$disconnect();
}
