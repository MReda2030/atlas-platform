import { PrismaClient } from '@prisma/client';
import { 
  BRANCHES, 
  DESTINATION_COUNTRIES, 
  TARGET_COUNTRIES, 
  ADVERTISING_PLATFORMS,
  SALES_AGENTS_BY_BRANCH 
} from '../src/lib/constants';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Branches
  console.log('📍 Seeding branches...');
  for (const branch of BRANCHES) {
    await prisma.branch.upsert({
      where: { code: branch.code },
      update: {},
      create: {
        name: branch.name,
        code: branch.code,
      },
    });
  }

  // Create Destination Countries
  console.log('🌍 Seeding destination countries...');
  for (const country of DESTINATION_COUNTRIES) {
    await prisma.destinationCountry.upsert({
      where: { code: country.code },
      update: {},
      create: {
        name: country.name,
        code: country.code,
      },
    });
  }

  // Create Target Countries
  console.log('🎯 Seeding target countries...');
  for (const country of TARGET_COUNTRIES) {
    await prisma.targetCountry.upsert({
      where: { code: country.code },
      update: {},
      create: {
        name: country.name,
        code: country.code,
      },
    });
  }

  // Create Advertising Platforms
  console.log('📢 Seeding advertising platforms...');
  for (const platform of ADVERTISING_PLATFORMS) {
    await prisma.advertisingPlatform.upsert({
      where: { name: platform.name },
      update: {},
      create: {
        name: platform.name,
      },
    });
  }

  // Create Sales Agents
  console.log('👥 Seeding sales agents...');
  for (const [branchName, agentNumbers] of Object.entries(SALES_AGENTS_BY_BRANCH)) {
    const branch = await prisma.branch.findFirst({
      where: { name: branchName },
    });

    if (branch) {
      for (const agentNumber of agentNumbers) {
        await prisma.salesAgent.upsert({
          where: { agentNumber },
          update: {},
          create: {
            agentNumber,
            name: `Agent ${agentNumber}`,
            branchId: branch.id,
            isActive: true,
          },
        });
      }
    }
  }

  // Create System User (for createdBy references)
  console.log('⚙️ Creating system user...');
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@atlas.com' },
    update: {},
    create: {
      email: 'system@atlas.com',
      passwordHash: '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm', // 'password123'
      role: 'SUPER_ADMIN',
      name: 'System User',
    },
  });

  // Create Admin User
  console.log('👤 Creating admin user...');
  const adminBranch = await prisma.branch.findFirst({
    where: { name: '4 Seasons' },
  });

  if (adminBranch) {
    await prisma.user.upsert({
      where: { email: 'admin@atlas.com' },
      update: {},
      create: {
        email: 'admin@atlas.com',
        passwordHash: '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm', // 'password123'
        role: 'ADMIN',
        name: 'Atlas Administrator',
        branchId: adminBranch.id,
      },
    });
  }

  // Create Media Buyer Users
  console.log('💼 Creating media buyer users...');
  for (const branch of BRANCHES) {
    const branchRecord = await prisma.branch.findFirst({
      where: { name: branch.name },
    });

    if (branchRecord) {
      await prisma.user.upsert({
        where: { email: `media.buyer@${branch.code.toLowerCase()}.com` },
        update: {},
        create: {
          email: `media.buyer@${branch.code.toLowerCase()}.com`,
          passwordHash: '$2a$12$JoxeVBbG6m4eavRhWj9xDuBwNdOi50PNGkfmicE0C03ge/KHck.Lm', // 'password123'
          role: 'MEDIA_BUYER',
          name: `Media Buyer - ${branch.name}`,
          branchId: branchRecord.id,
        },
      });
    }
  }

  console.log('✅ Database seeding completed successfully!');
  
  // Display summary
  const counts = await Promise.all([
    prisma.branch.count(),
    prisma.destinationCountry.count(),
    prisma.targetCountry.count(),
    prisma.advertisingPlatform.count(),
    prisma.salesAgent.count(),
    prisma.user.count(),
  ]);

  console.log('\n📊 Seeding Summary:');
  console.log(`- Branches: ${counts[0]}`);
  console.log(`- Destination Countries: ${counts[1]}`);
  console.log(`- Target Countries: ${counts[2]}`);
  console.log(`- Advertising Platforms: ${counts[3]}`);
  console.log(`- Sales Agents: ${counts[4]}`);
  console.log(`- Users: ${counts[5]}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });