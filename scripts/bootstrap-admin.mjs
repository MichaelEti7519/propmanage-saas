// One-time production admin bootstrap. The account can access only MFA enrollment until MFA is on.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { createInterface } from 'node:readline';

if (process.env.NODE_ENV !== 'production' || !process.argv.includes('--confirm-bootstrap')) {
  throw new Error('Run only for production bootstrap: NODE_ENV=production node scripts/bootstrap-admin.mjs --confirm-bootstrap');
}
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

function ask(prompt) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(prompt, (answer) => { rl.close(); resolve(answer.trim()); }));
}

function askHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    throw new Error('Bootstrap must run in an interactive terminal so the password can be hidden.');
  }
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    let value = '';
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    const restore = () => { input.setRawMode(false); input.pause(); input.removeListener('data', onData); };
    const onData = (chunk) => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') { restore(); process.stdout.write('\n'); reject(new Error('Bootstrap cancelled.')); return; }
        if (char === '\r' || char === '\n') { restore(); process.stdout.write('\n'); resolve(value); return; }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else if (char >= ' ') value += char;
      }
    };
    input.on('data', onData);
  });
}

try {
  const firstName = await ask('Admin first name: ');
  const lastName = await ask('Admin last name: ');
  const email = (await ask('Admin email: ')).toLowerCase();
  const password = (await askHidden('Initial password (12-72 UTF-8 bytes): ')).trim();
  if (!firstName || firstName.length > 60 || !lastName || lastName.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Valid first name, last name, and email are required. Names must be 60 characters or fewer.');
  }
  if (Buffer.byteLength(password, 'utf8') < 12 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Password must be 12-72 UTF-8 bytes.');

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await prisma.$transaction(async (tx) => {
    const existingAdmins = await tx.user.count({ where: { role: 'admin' } });
    if (existingAdmins !== 0) throw new Error('Bootstrap stopped: an administrator already exists.');
    return tx.user.create({ data: { firstName, lastName, email, passwordHash, role: 'admin' } });
  }, { isolationLevel: 'Serializable' });

  console.log(`Created the initial admin account ${created.email}. Sign in once and complete authenticator setup; all admin APIs remain locked until then.`);
} finally {
  await prisma.$disconnect();
}
