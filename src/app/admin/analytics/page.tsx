'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilterPanel } from './components/OptimizedFilterPanel';
import { ReportVisualization } from './components/ReportVisualization';
import { InsightsPanel } from './components/InsightsPanel';
import { ExportOptions } from './components/ExportOptions';

export interface ReportFilters {
  dateRange: { start: string; end: string };
  compareWith?: { start: string; end: string };
  targetCountries: string[];
  destinationCountries: string[];
  branches: string[];
  mediaBuyers: string[];
  salesAgents: string[];
  platforms: string[];
  qualityRatings: string[];
  spendRange: { min: number; max: number };
  dealRange: { min: number; max: number };
  minROI?: number;
  minConversionRate?: number;
}

export interface PerformanceMetrics {
  totalSpend: number;
  totalDeals: number;
  costPerDeal: number;
  roi: number;
  conversionRate: number;
  spendEfficiency: number;
  averageQualityScore: number;
  qualityTrend: 'improving' | 'declining' | 'stable';
  platformBreakdown: Array<{
    platform: string;
    spend: number;
    deals: number;
    costPerDeal: number;
  }>;
  destinationSuccess: Array<{
    destination: string;
    campaignSpend: number;
    actualDeals: number;
    successRate: number;
  }>;
}

export interface ReportData {
  overview: PerformanceMetrics;
  agentPerformance: Array<{
    agentNumber: string;
    agentName: string;
    totalSpend: number;
    totalDeals: number;
    costPerDeal: number;
    roi: number;
    conversionRate: number;
    qualityScore: number;
    countryBreakdown: Array<{
      country: string;
      spend: number;
      deals: number;
      roi: number;
    }>;
  }>;
  platformAnalysis: Array<{
    platform: string;
    totalSpend: number;
    totalDeals: number;
    costPerDeal: number;
    roi: number;
    countryBreakdown: Array<{
      country: string;
      spend: number;
      deals: number;
      efficiency: number;
    }>;
  }>;
  countryInsights: Array<{
    targetCountry: string;
    totalSpend: number;
    totalDeals: number;
    topAgent: string;
    topPlatform: string;
    destinationPreferences: Array<{
      destination: string;
      deals: number;
      percentage: number;
    }>;
  }>;
  roiMatrix: Array<{
    agent: string;
    country: string;
    platform: string;
    spend: number;
    deals: number;
    roi: number;
    date: string;
  }>;
}

type ReportType = 'agent_roi' | 'platform_effectiveness' | 'destination_analysis' | 'branch_comparison' | 'roi_matrix';
type QuickTemplate = 'last_7_days' | 'last_30_days' | 'high_performers' | 'all_data';

export default function AdminAnalyticsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReportType, setActiveReportType] = useState<ReportType>('agent_roi');
  const [activeTemplate, setActiveTemplate] = useState<QuickTemplate>('all_data');
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
      end: new Date().toISOString().split('T')[0] // Today
    },
    targetCountries: [],
    destinationCountries: [],
    branches: [],
    mediaBuyers: [],
    salesAgents: [],
    platforms: [],
    qualityRatings: [],
    spendRange: { min: 0, max: 100000 }, // Higher max to include all data
    dealRange: { min: 0, max: 1000 } // Higher max to include all data
  });

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate filters before making the request
      if (!filters.dateRange || !filters.dateRange.start || !filters.dateRange.end) {
        console.error('Invalid filters - missing dateRange:', filters);
        setError('Invalid date range');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/analytics/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: activeReportType,
          filters,
          aggregation: 'daily',
          visualization: 'both'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const result = await response.json();
      setReportData(result.data);

    } catch (err) {
      console.error('Report generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeReportType]);

  const handleFilterChange = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Note: Auto-apply is handled in FilterPanel component via its own callback
  }, []);

  const applyFilters = () => {
    console.log('Manual filter application triggered');
    fetchReportData();
  };
  
  // Auto-apply callback for FilterPanel
  const autoApplyFilters = () => {
    console.log('Auto-apply filter triggered');
    fetchReportData();
  };

  const handleQuickTemplate = async (templateType: string) => {
    console.log('Applying quick template:', templateType);
    setActiveTemplate(templateType as QuickTemplate);
    
    let newFilters: ReportFilters;
    let reportType: ReportType = 'agent_roi'; // Default report type
    
    const today = new Date();
    
    switch (templateType) {
      case 'last_7_days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        newFilters = {
          dateRange: {
            start: sevenDaysAgo.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
          },
          targetCountries: [],
          destinationCountries: [],
          branches: [],
          mediaBuyers: [],
          salesAgents: [],
          platforms: [],
          qualityRatings: [],
          spendRange: { min: 0, max: 100000 },
          dealRange: { min: 0, max: 1000 }
        };
        reportType = 'agent_roi';
        break;
        
      case 'last_30_days':
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        newFilters = {
          dateRange: {
            start: thirtyDaysAgo.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
          },
          targetCountries: [],
          destinationCountries: [],
          branches: [],
          mediaBuyers: [],
          salesAgents: [],
          platforms: [],
          qualityRatings: [],
          spendRange: { min: 0, max: 100000 },
          dealRange: { min: 0, max: 1000 }
        };
        reportType = 'agent_roi';
        break;
        
      case 'high_performers':
        newFilters = {
          dateRange: {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
          },
          targetCountries: [],
          destinationCountries: [],
          branches: [],
          mediaBuyers: [],
          salesAgents: [],
          platforms: [],
          qualityRatings: ['excellent', 'best_quality'],
          spendRange: { min: 0, max: 100000 },
          dealRange: { min: 5, max: 1000 },
          minROI: 20
        };
        reportType = 'agent_roi';
        break;
        
      case 'all_data':
      default:
        newFilters = {
          dateRange: {
            start: '2025-01-01', // Show all available data
            end: today.toISOString().split('T')[0]
          },
          targetCountries: [],
          destinationCountries: [],
          branches: [],
          mediaBuyers: [],
          salesAgents: [],
          platforms: [],
          qualityRatings: [],
          spendRange: { min: 0, max: 100000 },
          dealRange: { min: 0, max: 1000 }
        };
        reportType = 'agent_roi';
        break;
    }
    
    setFilters(newFilters);
    setActiveReportType(reportType);
    
    // Fetch data with new template settings
    try {
      setLoading(true);
      setError(null);

      // Validate filters before making the request
      if (!newFilters.dateRange || !newFilters.dateRange.start || !newFilters.dateRange.end) {
        console.error('Invalid filters - missing dateRange:', newFilters);
        setError('Invalid date range');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/analytics/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: reportType,
          filters: newFilters,
          aggregation: 'daily',
          visualization: 'both'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const result = await response.json();
      setReportData(result.data);

    } catch (err) {
      console.error('Report generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleReportTypeChange = async (reportType: ReportType) => {
    console.log('Switching to report type:', reportType);
    
    // Reset filters to show all available data for current month when switching tabs
    const allDataFilters: ReportFilters = {
      dateRange: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
        end: new Date().toISOString().split('T')[0] // Today
      },
      targetCountries: [],
      destinationCountries: [],
      branches: [],
      mediaBuyers: [],
      salesAgents: [],
      platforms: [],
      qualityRatings: [],
      spendRange: { min: 0, max: 100000 },
      dealRange: { min: 0, max: 1000 },
      minROI: undefined,
      minConversionRate: undefined,
      compareWith: undefined
    };
    
    // Update both state and fetch in sequence
    setFilters(allDataFilters);
    setActiveReportType(reportType);
    
    // Fetch data immediately with correct filters
    try {
      setLoading(true);
      setError(null);

      // Validate filters before making the request
      if (!allDataFilters.dateRange || !allDataFilters.dateRange.start || !allDataFilters.dateRange.end) {
        console.error('Invalid filters - missing dateRange:', allDataFilters);
        setError('Invalid date range');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/analytics/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: reportType,
          filters: allDataFilters,
          aggregation: 'daily',
          visualization: 'both'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      const result = await response.json();
      setReportData(result.data);

    } catch (err) {
      console.error('Report generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-600">Generating advanced analytics...</div>
            <div className="text-sm text-gray-500 mt-1">This may take a few moments</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <h3 className="text-lg font-semibold">Error Loading Analytics</h3>
                <p className="mt-2">{error}</p>
              </div>
              <Button onClick={fetchReportData} variant="outline">
                Retry Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              Advanced Analytics Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Comprehensive ROI analysis and performance insights for admin oversight
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <ExportOptions 
              reportData={reportData}
              filters={filters}
              reportType={activeReportType}
            />
          </div>
        </div>

        {/* Report Type Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Report Type</CardTitle>
            <CardDescription>Select the type of analysis you want to generate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              <Button
                variant={activeReportType === 'agent_roi' ? 'default' : 'outline'}
                onClick={() => handleReportTypeChange('agent_roi')}
                className="h-auto p-4 flex flex-col items-center"
              >
                <span className="text-2xl mb-1">👤</span>
                <span className="font-semibold">Agent ROI</span>
                <span className="text-xs opacity-70">Performance by agent</span>
              </Button>
              
              <Button
                variant={activeReportType === 'platform_effectiveness' ? 'default' : 'outline'}
                onClick={() => handleReportTypeChange('platform_effectiveness')}
                className="h-auto p-4 flex flex-col items-center"
              >
                <span className="text-2xl mb-1">Ⓟ</span>
                <span className="font-semibold">Platforms</span>
                <span className="text-xs opacity-70">Ad platform analysis</span>
              </Button>
              
              <Button
                variant={activeReportType === 'destination_analysis' ? 'default' : 'outline'}
                onClick={() => handleReportTypeChange('destination_analysis')}
                className="h-auto p-4 flex flex-col items-center"
              >
                <span className="text-2xl mb-1">🌍</span>
                <span className="font-semibold">Destinations</span>
                <span className="text-xs opacity-70">Travel destination trends</span>
              </Button>
              
              <Button
                variant={activeReportType === 'branch_comparison' ? 'default' : 'outline'}
                onClick={() => handleReportTypeChange('branch_comparison')}
                className="h-auto p-4 flex flex-col items-center"
              >
                <span className="text-2xl mb-1">🏢</span>
                <span className="font-semibold">Branches</span>
                <span className="text-xs opacity-70">Office comparison</span>
              </Button>
              
              <Button
                variant={activeReportType === 'roi_matrix' ? 'default' : 'outline'}
                onClick={() => handleReportTypeChange('roi_matrix')}
                className="h-auto p-4 flex flex-col items-center"
              >
                <span className="text-2xl mb-1">📊</span>
                <span className="font-semibold">ROI Matrix</span>
                <span className="text-xs opacity-70">Complete breakdown</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Layout - Report-Centric Design */}
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Left Panel - Filters (25%) */}
          <div className="lg:col-span-1 space-y-6">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={applyFilters}
              onAutoApplyFilters={autoApplyFilters}
              loading={loading}
            />
          </div>

          {/* Main Panel - Reports (75% - EXPANDED!) */}
          <div className="lg:col-span-3 space-y-6">
            <ReportVisualization
              reportData={reportData}
              reportType={activeReportType}
              filters={filters}
            />
          </div>
        </div>

        {/* Insights Panel - Full Width Below Main Content */}
        <div className="space-y-6">
          <InsightsPanel
            reportData={reportData}
            reportType={activeReportType}
          />
        </div>

        {/* Footer Analytics Summary */}
        {reportData && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  📊 Analysis Complete
                </h3>
                <div className="grid gap-4 md:grid-cols-4 text-sm">
                  <div>
                    <div className="font-bold text-lg text-blue-600">
                      ${reportData.overview.totalSpend.toLocaleString()}
                    </div>
                    <div className="text-gray-600">Total Spend Analyzed</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-green-600">
                      {reportData.overview.totalDeals}
                    </div>
                    <div className="text-gray-600">Deals Tracked</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-purple-600">
                      {reportData.agentPerformance.length}
                    </div>
                    <div className="text-gray-600">Agents Analyzed</div>
                  </div>
                  <div>
                    <div className={`font-bold text-lg ${reportData.overview.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {reportData.overview.roi.toFixed(1)}%
                    </div>
                    <div className="text-gray-600">Overall ROI</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}