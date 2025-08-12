#!/usr/bin/env node

/**
 * Atlas Travel Platform - Deployment Script
 * 
 * This script helps automate the deployment process for different hosting platforms.
 * It performs pre-deployment checks and guides through platform-specific setup.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Atlas Travel Platform - Deployment Helper\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the atlas-platform directory');
  process.exit(1);
}

// Load package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log(`📦 Project: ${packageJson.name} v${packageJson.version}\n`);

// Pre-deployment checks
console.log('🔍 Running pre-deployment checks...\n');

const checks = [
  {
    name: 'Environment file exists',
    check: () => fs.existsSync('.env.example'),
    fix: 'Create .env.example file with required environment variables'
  },
  {
    name: 'Prisma schema exists',
    check: () => fs.existsSync('prisma/schema.prisma'),
    fix: 'Ensure prisma/schema.prisma exists'
  },
  {
    name: 'Build script exists',
    check: () => packageJson.scripts && packageJson.scripts.build,
    fix: 'Add "build": "next build" to package.json scripts'
  },
  {
    name: 'Start script exists',
    check: () => packageJson.scripts && packageJson.scripts.start,
    fix: 'Add "start": "next start" to package.json scripts'
  },
  {
    name: 'Prisma generate in postbuild',
    check: () => packageJson.scripts && packageJson.scripts.postbuild,
    fix: 'Add "postbuild": "prisma generate" to package.json scripts'
  }
];

let allChecksPassed = true;

checks.forEach(check => {
  if (check.check()) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name}`);
    console.log(`   Fix: ${check.fix}`);
    allChecksPassed = false;
  }
});

if (!allChecksPassed) {
  console.log('\n❌ Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
}

console.log('\n✅ All pre-deployment checks passed!\n');

// Platform selection
console.log('🌐 Choose your deployment platform:\n');
console.log('1. Vercel + Supabase (Recommended)');
console.log('2. Railway (All-in-one)');
console.log('3. Render');
console.log('4. Netlify + Neon');
console.log('5. Show deployment URLs\n');

// For now, just show instructions
console.log('📋 Next Steps:\n');

console.log('For Vercel + Supabase:');
console.log('1. Create Supabase project at https://supabase.com');
console.log('2. Get your database URL from project settings');
console.log('3. Push code to GitHub');
console.log('4. Connect GitHub repo to Vercel at https://vercel.com');
console.log('5. Add environment variables in Vercel dashboard');
console.log('6. Deploy automatically!\n');

console.log('For Railway:');
console.log('1. Install Railway CLI: npm install -g @railway/cli');
console.log('2. Login: railway login');
console.log('3. Initialize: railway init');
console.log('4. Add PostgreSQL: railway add postgresql');
console.log('5. Deploy: railway up\n');

console.log('For detailed instructions, see DEPLOYMENT_GUIDE.md');

console.log('\n🎉 Your Atlas Travel Platform is ready for deployment!');
console.log('\n📖 Read DEPLOYMENT_GUIDE.md for detailed step-by-step instructions');
console.log('🔧 Configure your environment variables according to .env.example');
console.log('🗄️ Set up your PostgreSQL database and run migrations');
console.log('🚀 Deploy and test your application');

console.log('\n💡 Need help? Check the troubleshooting section in DEPLOYMENT_GUIDE.md');