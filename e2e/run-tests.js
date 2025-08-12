#!/usr/bin/env node

/**
 * E2E Test Runner for Atlas Travel Platform
 * 
 * This script helps run Playwright tests with proper configuration
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎭 Atlas Travel Platform - E2E Test Runner\n');

// Check if tests directory exists
const testsDir = path.join(__dirname, 'tests');
if (!fs.existsSync(testsDir)) {
  console.error('❌ Tests directory not found at:', testsDir);
  process.exit(1);
}

// List available test files
const testFiles = fs.readdirSync(testsDir)
  .filter(file => file.endsWith('.spec.ts'))
  .map(file => file.replace('.spec.ts', ''));

console.log('📋 Available test suites:');
testFiles.forEach((file, index) => {
  console.log(`  ${index + 1}. ${file}`);
});
console.log(`  ${testFiles.length + 1}. all (run all tests)`);
console.log('');

// Get command line argument or show instructions
const args = process.argv.slice(2);
const testSuite = args[0];

if (!testSuite) {
  console.log('Usage: node e2e/run-tests.js [test-suite]');
  console.log('Example: node e2e/run-tests.js auth');
  console.log('Example: node e2e/run-tests.js all');
  process.exit(0);
}

// Determine which tests to run
let command;
if (testSuite === 'all') {
  command = 'npx playwright test --reporter=list';
} else if (testFiles.includes(testSuite)) {
  command = `npx playwright test --reporter=list tests/${testSuite}.spec.ts`;
} else {
  console.error(`❌ Unknown test suite: ${testSuite}`);
  console.log(`Available options: ${testFiles.join(', ')}, all`);
  process.exit(1);
}

// Check if the app is running
console.log('🔍 Checking if application is running...');
try {
  const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', { encoding: 'utf8' });
  if (response.trim() !== '200') {
    console.log('⚠️  Application not running. Please start it with: npm run dev');
    console.log('   Tests will try to start the dev server automatically...\n');
  } else {
    console.log('✅ Application is running on http://localhost:3000\n');
  }
} catch (error) {
  console.log('⚠️  Could not check application status. Tests will try to start dev server if needed.\n');
}

// Run the tests
console.log(`🚀 Running: ${command}\n`);
console.log('═'.repeat(60));

try {
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Tests completed successfully!');
} catch (error) {
  console.log('\n' + '═'.repeat(60));
  console.log('❌ Some tests failed. Check the output above for details.');
  process.exit(1);
}

console.log('\n💡 Tips:');
console.log('  - Run with UI: npm run test:e2e:ui');
console.log('  - Debug mode: npm run test:e2e:debug');
console.log('  - Headed mode: npm run test:e2e:headed');
console.log('  - View report: npm run test:e2e:report');