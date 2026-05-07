const prisma = require('../../shared/src/database/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', password: adminHash, role: 'admin' },
  });

  await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: { username: 'staff', password: staffHash, role: 'staff' },
  });

  console.log('Seeded: admin / admin123, staff / staff123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
