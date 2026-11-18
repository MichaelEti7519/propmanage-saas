// Temporary helper: creates one admin account for a browser check, then removes it.
// Usage: node scripts/temp-ui-security.mjs create | clean
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const email = 'qa-ui-security@example.test';
const password = 'Qa-UI-Security-Pass!2026';

const mode = process.argv[2] ?? 'create';

if (mode === 'create') {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) await prisma.user.delete({ where: { id: existing.id } });
  const user = await prisma.user.create({
    data: {
      firstName: 'Qa',
      lastName: 'Security',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
    },
  });
  console.log(JSON.stringify({ id: user.id, email, password }));
} else {
  const users = await prisma.user.findMany({ where: { email }, select: { id: true } });
  const ids = users.map((user) => user.id);
  if (ids.length) {
    await prisma.auditLog.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { targetId: { in: ids } }] } });
    await prisma.verificationReview.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  console.log(JSON.stringify({ deleted: ids.length }));
}

await prisma.$disconnect();
