import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const stamp = Date.now();
const email = `qa-ui-${stamp}@example.test`;
const password = `Qa-Ui-${stamp}!`;

await prisma.user.create({
  data: { firstName: 'QA', lastName: 'Reviewer', email, role: 'admin', passwordHash: await bcrypt.hash(password, 12) },
});

console.log(JSON.stringify({ email, password }));
await prisma.$disconnect();
