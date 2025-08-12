// Enhanced performance monitoring with Core Web Vitals
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  delta?: number;
  id: string;
  navigationType?: string;
  timestamp: number;
  url: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = typeof window !== 'undefined';
    this.init();
  }

  private init() {
    if (!this.isEnabled) return;

    // Monitor Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // Monitor custom metrics
    this.monitorNavigationTiming();
    this.monitorResourceTiming();
    this.monitorLongTasks();
    
    // Send metrics periodically
    setInterval(() => this.sendMetrics(), 30000); // Every 30 seconds
    
    // Send metrics before page unload
    window.addEventListener('beforeunload', () => this.sendMetrics(true));
  }

  private handleMetric(metric: any) {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
      url: window.location.href,
    };

    this.metrics.push(performanceMetric);


    // Alert on poor performance
    this.checkPerformanceThresholds(performanceMetric);
  }

  private monitorNavigationTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const navEntries = window.performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    
    navEntries.forEach(entry => {
      // DNS lookup time
      if (entry.domainLookupEnd && entry.domainLookupStart) {
        this.metrics.push({
          name: 'DNS_LOOKUP',
          value: entry.domainLookupEnd - entry.domainLookupStart,
          id: 'dns-' + Date.now(),
          timestamp: Date.now(),
          url: window.location.href,
        });
      }

      // Server response time
      if (entry.responseEnd && entry.requestStart) {
        this.metrics.push({
          name: 'SERVER_RESPONSE',
          value: entry.responseEnd - entry.requestStart,
          id: 'server-' + Date.now(),
          timestamp: Date.now(),
          url: window.location.href,
        });
      }

      // DOM processing time
      if (entry.domContentLoadedEventEnd && entry.responseEnd) {
        this.metrics.push({
          name: 'DOM_PROCESSING',
          value: entry.domContentLoadedEventEnd - entry.responseEnd,
          id: 'dom-' + Date.now(),
          timestamp: Date.now(),
          url: window.location.href,
        });
      }
    });
  }

  private monitorResourceTiming() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Monitor slow resources (>1s)
          if (resourceEntry.duration > 1000) {
            this.metrics.push({
              name: 'SLOW_RESOURCE',
              value: resourceEntry.duration,
              id: 'resource-' + Date.now(),
              timestamp: Date.now(),
              url: resourceEntry.name,
            });
          }
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }

  private monitorLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'longtask') {
          this.metrics.push({
            name: 'LONG_TASK',
            value: entry.duration,
            id: 'longtask-' + Date.now(),
            timestamp: Date.now(),
            url: window.location.href,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
  }

  private checkPerformanceThresholds(metric: PerformanceMetric) {
    const thresholds = {
      CLS: 0.1, // Good: < 0.1
      FCP: 1800, // Good: < 1.8s
      INP: 200, // Good: < 200ms (replacing FID)
      LCP: 2500, // Good: < 2.5s
      TTFB: 800, // Good: < 800ms
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    
    if (threshold && metric.value > threshold) {
      console.warn(`[Performance Alert] ${metric.name} (${metric.value.toFixed(2)}) exceeds threshold (${threshold})`);
      
      // Could send alert to monitoring service
      this.sendAlert(metric, threshold);
    }
  }

  private sendAlert(metric: PerformanceMetric, threshold: number) {
    // In production, this would send to a monitoring service
    console.warn(`Performance Alert: ${metric.name} = ${metric.value.toFixed(2)}, threshold = ${threshold}`);
  }

  private async sendMetrics(force = false) {
    if (this.metrics.length === 0) return;
    
    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      // Send to analytics service

      // Example: Send to analytics endpoint
      // await fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ metrics: metricsToSend }),
      // });

    } catch (error) {
      console.error('[Performance] Failed to send metrics:', error);
      // Re-add metrics to queue on failure
      this.metrics.unshift(...metricsToSend);
    }
  }

  // Public methods
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  public trackCustomMetric(name: string, value: number, metadata?: any): void {
    this.metrics.push({
      name: `CUSTOM_${name.toUpperCase()}`,
      value,
      id: 'custom-' + Date.now(),
      timestamp: Date.now(),
      url: window.location.href,
      ...metadata,
    });
  }
}

// Create singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitoring(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

// Utility functions for manual performance tracking
export function measureApiCall<T>(
  apiCall: () => Promise<T>,
  apiName: string
): Promise<T> {
  const start = performance.now();
  
  return apiCall()
    .then(result => {
      const duration = performance.now() - start;
      performanceMonitor?.trackCustomMetric(`API_${apiName}`, duration);
      return result;
    })
    .catch(error => {
      const duration = performance.now() - start;
      performanceMonitor?.trackCustomMetric(`API_${apiName}_ERROR`, duration);
      throw error;
    });
}

export function measureComponentRender(
  componentName: string,
  renderFn: () => void
): void {
  const start = performance.now();
  renderFn();
  const duration = performance.now() - start;
  performanceMonitor?.trackCustomMetric(`RENDER_${componentName}`, duration);
}