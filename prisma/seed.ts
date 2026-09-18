import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const owners = ['iemengly1112@gmail.com', 'iemengly1111@gmail.com'];

async function main() {
  for (const email of owners) {
    await prisma.user.upsert({
      where: { email },
      update: { role: UserRole.ADMIN, emailVerifiedAt: new Date() },
      create: { email, name: 'Owner', passwordHash: await bcrypt.hash('change-this-password', 12), role: UserRole.ADMIN, emailVerifiedAt: new Date() }
    });
  }
}

main().finally(() => prisma.$disconnect());
