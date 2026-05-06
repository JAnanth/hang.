import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function generateInviteCode(): string {
  return randomBytes(6).toString('hex').toUpperCase();
}

const officialGroups = [
  { name: 'Floor 3 — Unit 1', orgSlug: 'unit-1-floor-3', description: 'Unit 1, Floor 3 residents' },
  { name: 'Floor 4 — Unit 1', orgSlug: 'unit-1-floor-4', description: 'Unit 1, Floor 4 residents' },
  { name: 'PKS', orgSlug: 'pks', description: 'Pi Kappa Sigma fraternity' },
  { name: 'Delta Gamma', orgSlug: 'dg', description: 'Delta Gamma sorority, UC Berkeley' },
  { name: 'CS 189 Study Group', orgSlug: 'cs189-spring2026', description: 'CS 189 Machine Learning — Spring 2026' },
  { name: 'Intramural Soccer', orgSlug: 'intramural-soccer-spring2026', description: 'Spring 2026 intramural soccer league' },
  { name: 'Cal Cycling', orgSlug: 'cal-cycling', description: 'UC Berkeley Cycling Club' },
  { name: 'Sigma Nu', orgSlug: 'sigma-nu', description: 'Sigma Nu fraternity, UC Berkeley' },
  { name: 'Kappa Alpha Theta', orgSlug: 'kat', description: 'Kappa Alpha Theta sorority, UC Berkeley' },
  { name: 'Berkeley Hiking Club', orgSlug: 'cal-hiking', description: 'UC Berkeley Hiking and Outdoors Club' },
];

async function main() {
  console.log('Seeding official Berkeley groups...');

  for (const group of officialGroups) {
    await prisma.group.upsert({
      where: { orgSlug: group.orgSlug },
      update: {},
      create: {
        name: group.name,
        description: group.description,
        type: 'official',
        orgSlug: group.orgSlug,
        inviteCode: generateInviteCode(),
      },
    });
  }

  console.log(`Seeded ${officialGroups.length} official groups.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
