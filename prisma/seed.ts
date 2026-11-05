import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be configured before seeding.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo accounts cannot be seeded in production.');
  }

  const seedPassword = process.env.DEV_SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('Set DEV_SEED_PASSWORD to a local test password of at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(seedPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@propmanage.saas' },
    update: { passwordHash },
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@propmanage.saas',
      role: 'admin',
      passwordHash,
    },
  });

  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@propmanage.saas' },
    update: { passwordHash },
    create: {
      firstName: 'Landlord',
      lastName: 'Manager',
      email: 'landlord@propmanage.saas',
      role: 'landlord',
      passwordHash,
    },
  });

  const tenantUser = await prisma.user.upsert({
    where: { email: 'tenant@propmanage.saas' },
    update: { passwordHash },
    create: {
      firstName: 'Tenant',
      lastName: 'User',
      email: 'tenant@propmanage.saas',
      role: 'tenant',
      passwordHash,
    },
  });

  const property = await prisma.property.upsert({
    where: { id: 'p1' },
    update: {},
    create: {
      id: 'p1',
      landlordId: landlord.id,
      name: 'Sunset Villas',
      address: '123 Harbor Dr',
      city: 'Springfield',
      state: 'IL',
      units: 24,
      occupancy: 22,
      status: 'Active',
      manager: 'Acme Property Management',
    },
  });

  const unit = await prisma.unit.upsert({
    where: { propertyId_number: { propertyId: property.id, number: '1A' } },
    update: {},
    create: {
      id: 'u1',
      propertyId: property.id,
      number: '1A',
      floor: 1,
      bedrooms: 2,
      bathrooms: 1,
      rent: 1800,
      status: 'occupied',
      tenantId: 't1',
    },
  });

  await prisma.tenant.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      id: 't1',
      landlordId: landlord.id,
      userId: tenantUser.id,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      unitId: unit.id,
      status: 'Active',
      leaseStart: new Date('2025-01-01'),
      leaseEnd: new Date('2026-12-31'),
      rent: 2400,
    },
  });

  console.log('Seed complete:', { admin: admin.email, landlord: landlord.email, tenant: tenantUser.email, property: property.name });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
