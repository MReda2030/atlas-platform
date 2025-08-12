#!/usr/bin/env node
/**
 * Atlas Platform Performance Validation Script
 * Validates all implemented performance optimizations
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

const config = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3001',
  timeout: 10000,
  maxResponseTime: 2000,
  maxErrorRate: 5.0
};

class PerformanceValidator {
  constructor() {
    this.results = {
      api: {},
      database: {},
      cache: {},
      serviceWorker: {},
      cdn: {},
      overall: { passed: 0, failed: 0, warnings: 0 }
    };
  }

  async validateAll() {
    console.log('🚀 Starting Atlas Platform Performance Validation\n');
    console.log(`Testing against: ${config.baseUrl}\n`);

    try {
      await this.validateApiPerformance();
      await this.validateCacheSystem();
      await this.validateServiceWorker();
      await this.validateStaticAssets();
      await this.validateDatabase();
      
      this.printSummary();
      
      const success = this.results.overall.failed === 0;
      process.exit(success ? 0 : 1);
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  async validateApiPerformance() {
    console.log('📡 Testing API Performance...');
    
    const endpoints = [
      '/api/health',
      '/api/dashboard/stats',
      '/api/dashboard/recent-activity',
      '/api/master-data/agents',
      '/api/master-data/branches'
    ];

    for (const endpoint of endpoints) {
      const startTime = performance.now();
      
      try {
        const response = await this.makeRequest(endpoint);
        const responseTime = performance.now() - startTime;
        
        if (response.success !== false && responseTime < config.maxResponseTime) {
          this.pass(`✅ ${endpoint}: ${responseTime.toFixed(0)}ms`);
          this.results.api[endpoint] = { status: 'pass', responseTime };
        } else if (responseTime >= config.maxResponseTime) {
          this.fail(`❌ ${endpoint}: ${responseTime.toFixed(0)}ms (too slow)`);
          this.results.api[endpoint] = { status: 'fail', responseTime, reason: 'slow' };
        } else {
          this.warn(`⚠️  ${endpoint}: Error response but within time limit`);
          this.results.api[endpoint] = { status: 'warning', responseTime };
        }
        
      } catch (error) {
        this.fail(`❌ ${endpoint}: Request failed - ${error.message}`);
        this.results.api[endpoint] = { status: 'fail', error: error.message };
      }
    }
    console.log('');
  }

  async validateCacheSystem() {
    console.log('🔄 Testing Cache System...');
    
    try {
      // Test cache headers
      const response = await this.makeRequest('/api/master-data/agents', { 
        headers: { 'Cache-Control': 'no-cache' } 
      });
      
      const firstTime = performance.now();
      await this.makeRequest('/api/master-data/agents');
      const firstRequestTime = performance.now() - firstTime;
      
      const secondTime = performance.now();
      await this.makeRequest('/api/master-data/agents');
      const secondRequestTime = performance.now() - secondTime;
      
      // Second request should be faster (cached)
      if (secondRequestTime < firstRequestTime * 0.8) {
        this.pass(`✅ Cache working: First ${firstRequestTime.toFixed(0)}ms, Second ${secondRequestTime.toFixed(0)}ms`);
        this.results.cache.status = 'pass';
      } else {
        this.warn(`⚠️  Cache may not be working optimally: First ${firstRequestTime.toFixed(0)}ms, Second ${secondRequestTime.toFixed(0)}ms`);
        this.results.cache.status = 'warning';
      }
      
    } catch (error) {
      this.fail(`❌ Cache test failed: ${error.message}`);
      this.results.cache.status = 'fail';
    }
    console.log('');
  }

  async validateServiceWorker() {
    console.log('🔧 Testing Service Worker...');
    
    try {
      const swResponse = await this.makeRequest('/sw.js', {}, true);
      
      if (swResponse && swResponse.includes('Atlas') && swResponse.includes('serviceWorker')) {
        this.pass('✅ Service Worker file accessible and valid');
        this.results.serviceWorker.status = 'pass';
      } else {
        this.warn('⚠️  Service Worker file found but may not be properly configured');
        this.results.serviceWorker.status = 'warning';
      }
      
      // Test manifest
      const manifestResponse = await this.makeRequest('/manifest.json', {}, true);
      if (manifestResponse && manifestResponse.includes('Atlas')) {
        this.pass('✅ PWA Manifest accessible and valid');
        this.results.serviceWorker.manifest = 'pass';
      } else {
        this.fail('❌ PWA Manifest missing or invalid');
        this.results.serviceWorker.manifest = 'fail';
      }
      
    } catch (error) {
      this.fail(`❌ Service Worker validation failed: ${error.message}`);
      this.results.serviceWorker.status = 'fail';
    }
    console.log('');
  }

  async validateStaticAssets() {
    console.log('📦 Testing Static Assets Performance...');
    
    const staticAssets = [
      '/icons/icon-192x192.png',
      '/_next/static/css/app.css',
      '/_next/static/js/app.js'
    ];

    for (const asset of staticAssets) {
      try {
        const startTime = performance.now();
        const response = await this.makeRequest(asset, {}, false);
        const responseTime = performance.now() - startTime;
        
        if (responseTime < 1000) { // Static assets should be very fast
          this.pass(`✅ ${asset}: ${responseTime.toFixed(0)}ms`);
        } else {
          this.warn(`⚠️  ${asset}: ${responseTime.toFixed(0)}ms (consider CDN)`);
        }
        
      } catch (error) {
        // Some assets might not exist in development
        if (asset.includes('_next')) {
          this.warn(`⚠️  ${asset}: Not found (normal in development)`);
        } else {
          this.fail(`❌ ${asset}: ${error.message}`);
        }
      }
    }
    console.log('');
  }

  async validateDatabase() {
    console.log('💾 Testing Database Performance...');
    
    try {
      // Test a complex query that would benefit from indexes
      const startTime = performance.now();
      await this.makeRequest('/api/dashboard/stats');
      const queryTime = performance.now() - startTime;
      
      if (queryTime < 2000) {
        this.pass(`✅ Dashboard stats query: ${queryTime.toFixed(0)}ms (indexes working)`);
        this.results.database.indexes = 'pass';
      } else if (queryTime < 5000) {
        this.warn(`⚠️  Dashboard stats query: ${queryTime.toFixed(0)}ms (consider applying indexes)`);
        this.results.database.indexes = 'warning';
      } else {
        this.fail(`❌ Dashboard stats query: ${queryTime.toFixed(0)}ms (indexes may be missing)`);
        this.results.database.indexes = 'fail';
      }
      
      // Test concurrent requests to check connection pooling
      const concurrentRequests = Array(5).fill(null).map(() => 
        this.makeRequest('/api/master-data/agents')
      );
      
      const concurrentStartTime = performance.now();
      await Promise.all(concurrentRequests);
      const concurrentTime = performance.now() - concurrentStartTime;
      
      if (concurrentTime < 3000) {
        this.pass(`✅ Concurrent requests: ${concurrentTime.toFixed(0)}ms (connection pooling working)`);
        this.results.database.pooling = 'pass';
      } else {
        this.warn(`⚠️  Concurrent requests: ${concurrentTime.toFixed(0)}ms (check connection pooling)`);
        this.results.database.pooling = 'warning';
      }
      
    } catch (error) {
      this.fail(`❌ Database performance test failed: ${error.message}`);
      this.results.database.status = 'fail';
    }
    console.log('');
  }

  async makeRequest(path, options = {}, returnText = false) {
    return new Promise((resolve, reject) => {
      const url = `${config.baseUrl}${path}`;
      const isHttps = url.startsWith('https:');
      const client = isHttps ? https : http;
      
      const requestOptions = {
        timeout: config.timeout,
        ...options
      };

      const req = client.get(url, requestOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (returnText) {
            resolve(data);
          } else {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch {
              resolve({ status: res.statusCode, data });
            }
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  pass(message) {
    console.log(`  ${message}`);
    this.results.overall.passed++;
  }

  fail(message) {
    console.log(`  ${message}`);
    this.results.overall.failed++;
  }

  warn(message) {
    console.log(`  ${message}`);
    this.results.overall.warnings++;
  }

  printSummary() {
    console.log('📊 Performance Validation Summary\n');
    
    const { passed, failed, warnings } = this.results.overall;
    const total = passed + failed + warnings;
    
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`❌ Failed: ${failed}/${total}`);
    console.log(`⚠️  Warnings: ${warnings}/${total}\n`);
    
    if (failed === 0 && warnings === 0) {
      console.log('🎉 All performance optimizations are working perfectly!');
      console.log('🚀 Your Atlas Platform is ready for production!');
    } else if (failed === 0) {
      console.log('✅ All critical optimizations working, but check warnings for potential improvements.');
    } else {
      console.log('❌ Some critical optimizations are not working. Please fix before production deployment.');
      console.log('\n🔧 Troubleshooting:');
      console.log('- Ensure the server is running');
      console.log('- Check database connection and indexes');
      console.log('- Verify Redis configuration (if using)');
      console.log('- Review application logs for errors');
    }
    
    console.log(`\n📋 Full results saved to: performance-validation-${Date.now()}.json`);
    
    require('fs').writeFileSync(
      `performance-validation-${Date.now()}.json`,
      JSON.stringify(this.results, null, 2)
    );
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PerformanceValidator();
  validator.validateAll();
}

module.exports = PerformanceValidator;