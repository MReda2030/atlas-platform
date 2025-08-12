/**
 * Comprehensive Performance Testing Script for Atlas Platform
 * Tests all pages, measures load times, API response times, and component performance
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class PerformanceAnalyzer {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.results = {
      timestamp: new Date().toISOString(),
      pages: {},
      apis: {},
      components: {},
      summary: {}
    };
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for headless testing
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Enable performance monitoring
    await this.page.setCacheEnabled(false);
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor network requests
    this.page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        const url = new URL(response.url());
        const apiPath = url.pathname;
        
        if (!this.results.apis[apiPath]) {
          this.results.apis[apiPath] = {
            calls: [],
            averageTime: 0,
            status: response.status()
          };
        }
        
        // Calculate response time (approximate)
        const timing = response.timing();
        const responseTime = timing ? 
          timing.responseEnd - timing.requestStart : 
          'N/A';
        
        this.results.apis[apiPath].calls.push({
          timestamp: new Date().toISOString(),
          responseTime,
          status: response.status(),
          size: response.headers()['content-length'] || 'N/A'
        });
      }
    });
  }

  async measurePagePerformance(pageName, url, iterations = 3) {
    console.log(`\n📊 Testing ${pageName} performance...`);
    
    const pageResults = {
      url,
      iterations: [],
      averageLoadTime: 0,
      firstContentfulPaint: 0,
      domContentLoaded: 0,
      networkRequests: 0,
      jsHeapSize: 0
    };

    for (let i = 0; i < iterations; i++) {
      console.log(`  Iteration ${i + 1}/${iterations}`);
      
      // Clear cache for first load simulation
      if (i === 0) {
        await this.page.setCacheEnabled(false);
      } else {
        await this.page.setCacheEnabled(true);
      }
      
      const startTime = Date.now();
      
      // Navigate and measure
      const response = await this.page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });
      
      const endTime = Date.now();
      const totalLoadTime = endTime - startTime;
      
      // Get performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          loadComplete: navigation.loadEventEnd - navigation.navigationStart,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          jsHeapSize: performance.memory ? performance.memory.usedJSHeapSize : 0
        };
      });
      
      // Count network requests
      const networkRequests = await this.page.evaluate(() => {
        return performance.getEntriesByType('resource').length;
      });
      
      const iteration = {
        iteration: i + 1,
        totalLoadTime,
        domContentLoaded: performanceMetrics.domContentLoaded,
        loadComplete: performanceMetrics.loadComplete,
        firstContentfulPaint: performanceMetrics.firstContentfulPaint,
        networkRequests,
        jsHeapSize: performanceMetrics.jsHeapSize,
        cacheEnabled: i > 0
      };
      
      pageResults.iterations.push(iteration);
      
      console.log(`    Load Time: ${totalLoadTime}ms`);
      console.log(`    DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
      console.log(`    First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
      
      // Wait between iterations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Calculate averages
    pageResults.averageLoadTime = pageResults.iterations.reduce((sum, it) => sum + it.totalLoadTime, 0) / iterations;
    pageResults.firstContentfulPaint = pageResults.iterations.reduce((sum, it) => sum + it.firstContentfulPaint, 0) / iterations;
    pageResults.domContentLoaded = pageResults.iterations.reduce((sum, it) => sum + it.domContentLoaded, 0) / iterations;
    pageResults.networkRequests = pageResults.iterations[0].networkRequests;
    pageResults.jsHeapSize = pageResults.iterations.reduce((sum, it) => sum + it.jsHeapSize, 0) / iterations;
    
    this.results.pages[pageName] = pageResults;
    return pageResults;
  }

  async measureComponentPerformance(pageName) {
    console.log(`\n🔍 Analyzing ${pageName} component performance...`);
    
    const componentMetrics = await this.page.evaluate(() => {
      const components = [];
      
      // Measure React component render times (if React DevTools is available)
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        // This would require React DevTools integration
        components.push({ name: 'React Components', renderTime: 'DevTools Required' });
      }
      
      // Measure DOM elements with data attributes
      const elementsWithData = document.querySelectorAll('[data-component]');
      elementsWithData.forEach(el => {
        const componentName = el.getAttribute('data-component');
        const rect = el.getBoundingClientRect();
        components.push({
          name: componentName,
          domSize: el.children.length,
          dimensions: `${rect.width}x${rect.height}`,
          visible: rect.top < window.innerHeight && rect.bottom > 0
        });
      });
      
      // Check for specific slow components
      const smartFilters = document.querySelector('[data-testid="smart-filters"]') || 
                          document.querySelector('.smart-filters') ||
                          document.getElementById('smart-filters');
      
      if (smartFilters) {
        components.push({
          name: 'Smart Filters',
          present: true,
          childCount: smartFilters.children.length,
          className: smartFilters.className
        });
      }
      
      const autoSave = document.querySelector('[data-testid="auto-save"]') ||
                      document.querySelector('.auto-save') ||
                      document.getElementById('auto-save');
      
      if (autoSave) {
        components.push({
          name: 'Auto Save',
          present: true,
          childCount: autoSave.children.length,
          className: autoSave.className
        });
      }
      
      return components;
    });
    
    this.results.components[pageName] = componentMetrics;
    return componentMetrics;
  }

  async testAllPages() {
    const pages = [
      { name: 'Dashboard', url: `${this.baseUrl}/dashboard` },
      { name: 'Homepage', url: `${this.baseUrl}/` },
      { name: 'Media Reports', url: `${this.baseUrl}/media` },
      { name: 'Media New Report', url: `${this.baseUrl}/media/new` },
      { name: 'Sales Reports', url: `${this.baseUrl}/sales` },
      { name: 'Sales New Report', url: `${this.baseUrl}/sales/new` },
      { name: 'Analytics Overview', url: `${this.baseUrl}/analytics` },
      { name: 'Analytics Agents', url: `${this.baseUrl}/analytics/agents` },
      { name: 'Analytics Countries', url: `${this.baseUrl}/analytics/countries` },
      { name: 'Analytics Platforms', url: `${this.baseUrl}/analytics/platforms` },
      { name: 'Admin Dashboard', url: `${this.baseUrl}/admin` },
      { name: 'Admin Analytics', url: `${this.baseUrl}/admin/analytics` },
      { name: 'Admin Master Data Agents', url: `${this.baseUrl}/admin/master-data/agents` },
      { name: 'Admin Master Data Countries', url: `${this.baseUrl}/admin/master-data/countries` },
      { name: 'Admin Master Data Platforms', url: `${this.baseUrl}/admin/master-data/platforms` }
    ];

    console.log('🚀 Starting comprehensive performance testing...\n');

    for (const page of pages) {
      try {
        const pageResult = await this.measurePagePerformance(page.name, page.url);
        await this.measureComponentPerformance(page.name);
        
        // Log immediate results
        console.log(`✅ ${page.name}: ${pageResult.averageLoadTime.toFixed(2)}ms average`);
        
      } catch (error) {
        console.error(`❌ Error testing ${page.name}:`, error.message);
        this.results.pages[page.name] = {
          error: error.message,
          url: page.url
        };
      }
    }
  }

  async generateReport() {
    console.log('\n📈 Generating performance report...');
    
    // Calculate API averages
    Object.keys(this.results.apis).forEach(apiPath => {
      const api = this.results.apis[apiPath];
      const validCalls = api.calls.filter(call => typeof call.responseTime === 'number');
      if (validCalls.length > 0) {
        api.averageTime = validCalls.reduce((sum, call) => sum + call.responseTime, 0) / validCalls.length;
      }
    });
    
    // Generate summary
    const pageResults = Object.values(this.results.pages).filter(page => !page.error);
    if (pageResults.length > 0) {
      this.results.summary = {
        totalPagesTestedsuccessfully: pageResults.length,
        totalPagesWithErrors: Object.values(this.results.pages).filter(page => page.error).length,
        averagePageLoadTime: pageResults.reduce((sum, page) => sum + page.averageLoadTime, 0) / pageResults.length,
        slowestPage: pageResults.reduce((prev, current) => 
          (prev.averageLoadTime > current.averageLoadTime) ? prev : current
        ),
        fastestPage: pageResults.reduce((prev, current) => 
          (prev.averageLoadTime < current.averageLoadTime) ? prev : current
        ),
        totalAPIs: Object.keys(this.results.apis).length,
        slowestAPI: Object.entries(this.results.apis).reduce((prev, [path, api]) => 
          (!prev || api.averageTime > prev.averageTime) ? { path, ...api } : prev
        , null)
      };
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate markdown report
    await this.generateMarkdownReport();
    
    console.log(`📊 Detailed report saved to: ${reportPath}`);
    return this.results;
  }

  async generateMarkdownReport() {
    const markdown = this.generateMarkdownContent();
    const reportPath = path.join(__dirname, '..', 'PERFORMANCE-ANALYSIS.md');
    fs.writeFileSync(reportPath, markdown);
    console.log(`📝 Markdown report saved to: ${reportPath}`);
  }

  generateMarkdownContent() {
    const { summary, pages, apis, components } = this.results;
    
    let markdown = `# Atlas Platform Performance Analysis Report
Generated: ${this.results.timestamp}

## Executive Summary
- **Total Pages Tested**: ${summary.totalPagesTestedsuccessfully || 0}
- **Pages with Errors**: ${summary.totalPagesWithErrors || 0}
- **Average Page Load Time**: ${(summary.averagePageLoadTime || 0).toFixed(2)}ms
- **Slowest Page**: ${summary.slowestPage?.averageLoadTime?.toFixed(2) || 'N/A'}ms
- **Fastest Page**: ${summary.fastestPage?.averageLoadTime?.toFixed(2) || 'N/A'}ms
- **Total APIs Monitored**: ${summary.totalAPIs || 0}

## Performance Issues Identified
`;

    // Add performance warnings
    if (summary.averagePageLoadTime > 3000) {
      markdown += `⚠️ **CRITICAL**: Average page load time (${summary.averagePageLoadTime.toFixed(2)}ms) exceeds 3 seconds\n`;
    }
    if (summary.slowestPage?.averageLoadTime > 5000) {
      markdown += `🚨 **URGENT**: Slowest page exceeds 5 seconds load time\n`;
    }

    markdown += `\n## Page Performance Details\n\n`;
    
    // Sort pages by performance
    const sortedPages = Object.entries(pages)
      .filter(([_, page]) => !page.error)
      .sort(([_, a], [__, b]) => b.averageLoadTime - a.averageLoadTime);

    sortedPages.forEach(([pageName, page]) => {
      const status = page.averageLoadTime > 3000 ? '🔴' : page.averageLoadTime > 1000 ? '🟡' : '🟢';
      markdown += `### ${status} ${pageName}
- **Average Load Time**: ${page.averageLoadTime.toFixed(2)}ms
- **First Contentful Paint**: ${page.firstContentfulPaint.toFixed(2)}ms
- **DOM Content Loaded**: ${page.domContentLoaded.toFixed(2)}ms
- **Network Requests**: ${page.networkRequests}
- **JS Heap Size**: ${(page.jsHeapSize / 1024 / 1024).toFixed(2)}MB

#### Load Time Progression:
`;
      page.iterations.forEach((iteration, index) => {
        const cacheStatus = iteration.cacheEnabled ? '(cached)' : '(cold)';
        markdown += `- **Iteration ${iteration.iteration}**: ${iteration.totalLoadTime}ms ${cacheStatus}\n`;
      });
      markdown += '\n';
    });

    // API Performance
    if (Object.keys(apis).length > 0) {
      markdown += `## API Performance Analysis\n\n`;
      
      Object.entries(apis).forEach(([apiPath, api]) => {
        const status = api.averageTime > 1000 ? '🔴' : api.averageTime > 500 ? '🟡' : '🟢';
        markdown += `### ${status} ${apiPath}
- **Average Response Time**: ${api.averageTime.toFixed(2)}ms
- **Total Calls**: ${api.calls.length}
- **Status**: ${api.status}

`;
      });
    }

    // Component Analysis
    markdown += `## Component Performance Analysis\n\n`;
    Object.entries(components).forEach(([pageName, pageComponents]) => {
      markdown += `### ${pageName}\n`;
      pageComponents.forEach(component => {
        markdown += `- **${component.name}**: ${JSON.stringify(component, null, 2)}\n`;
      });
      markdown += '\n';
    });

    // Recommendations
    markdown += `## Performance Optimization Recommendations\n\n`;
    
    if (summary.averagePageLoadTime > 2000) {
      markdown += `### Immediate Actions Required:
1. 🔥 **Enable Caching**: Implement proper browser caching for static assets
2. 🔥 **Code Splitting**: Implement dynamic imports for heavy components  
3. 🔥 **Image Optimization**: Compress and lazy-load images
4. 🔥 **Bundle Analysis**: Analyze and reduce JavaScript bundle size

`;
    }

    markdown += `### API Optimizations:
1. Implement response caching for master data APIs
2. Add database query optimization and indexing
3. Implement pagination for large datasets
4. Add compression for API responses

### Component Optimizations:
1. **Smart Filters**: Implement debouncing for filter inputs
2. **Auto Save**: Reduce auto-save frequency and add debouncing
3. **Dashboard Widgets**: Lazy load non-critical widgets
4. **Data Tables**: Implement virtualization for large tables

### Next Steps:
1. Review and implement critical recommendations
2. Set up continuous performance monitoring
3. Add performance budgets to CI/CD pipeline
4. Implement performance regression testing
`;

    return markdown;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run the performance analysis
async function runPerformanceTest() {
  const analyzer = new PerformanceAnalyzer();
  
  try {
    await analyzer.initialize();
    await analyzer.testAllPages();
    const results = await analyzer.generateReport();
    
    console.log('\n🎉 Performance testing completed!');
    console.log(`📊 Summary: ${results.summary.totalPagesTestedsuccessfully} pages tested`);
    console.log(`⏱️  Average load time: ${results.summary.averagePageLoadTime.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Performance testing failed:', error);
  } finally {
    await analyzer.cleanup();
  }
}

// Export for use as module or run directly
if (require.main === module) {
  runPerformanceTest();
}

module.exports = { PerformanceAnalyzer, runPerformanceTest };