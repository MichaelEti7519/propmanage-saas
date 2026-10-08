import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('password', 10);
  const landlordPassword = await bcrypt.hash('password', 10);
  const tenantPassword = await bcrypt.hash('password', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@propmanage.saas' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@propmanage.saas',
      role: 'admin',
      passwordHash: adminPassword,
    },
  });

  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@propmanage.saas' },
    update: {},
    create: {
      firstName: 'Landlord',
      lastName: 'Manager',
      email: 'landlord@propmanage.saas',
      role: 'landlord',
      passwordHash: landlordPassword,
    },
  });

  const tenantUser = await prisma.user.upsert({
    where: { email: 'tenant@propmanage.saas' },
    update: {},
    create: {
      firstName: 'Tenant',
      lastName: 'User',
      email: 'tenant@propmanage.saas',
      role: 'tenant',
      passwordHash: tenantPassword,
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
