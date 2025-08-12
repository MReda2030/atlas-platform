'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilterPanel } from '../../admin/analytics/components/FilterPanel';
import { ReportVisualization } from '../../admin/analytics/components/ReportVisualization';
import { InsightsPanel } from '../../admin/analytics/components/InsightsPanel';
import { ExportOptions } from '../../admin/analytics/components/ExportOptions';

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

export default function ROIMatrixPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'agent' | 'country' | 'platform'>('agent');
  const reportType = 'roi_matrix';
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
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
  });

  const fetchReportData = useCallback(async () => {
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
          reportType: reportType,
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
  }, [filters, reportType]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleFilterChange = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const applyFilters = () => {
    fetchReportData();
  };
  
  const autoApplyFilters = () => {
    fetchReportData();
  };

  const getROIColor = (roi: number) => {
    if (roi >= 50) return 'bg-green-500';
    if (roi >= 20) return 'bg-green-400';
    if (roi >= 0) return 'bg-yellow-400';
    if (roi >= -20) return 'bg-orange-400';
    return 'bg-red-500';
  };

  const getROITextColor = (roi: number) => {
    if (roi >= 50) return 'text-green-700';
    if (roi >= 20) return 'text-green-600';
    if (roi >= 0) return 'text-yellow-600';
    if (roi >= -20) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-600">Building ROI Matrix...</div>
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
              ROI Matrix Analysis
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Complete breakdown of ROI across all dimensions
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <ExportOptions 
              reportData={reportData}
              filters={filters}
              reportType={reportType}
            />
          </div>
        </div>

        {/* View Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Matrix View</CardTitle>
            <CardDescription>Select how to group the ROI matrix</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={selectedView === 'agent' ? 'default' : 'outline'}
                onClick={() => setSelectedView('agent')}
                className="flex-1"
              >
                By Agent
              </Button>
              <Button
                variant={selectedView === 'country' ? 'default' : 'outline'}
                onClick={() => setSelectedView('country')}
                className="flex-1"
              >
                By Country
              </Button>
              <Button
                variant={selectedView === 'platform' ? 'default' : 'outline'}
                onClick={() => setSelectedView('platform')}
                className="flex-1"
              >
                By Platform
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ROI Overview Stats */}
        {reportData && (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Highest ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...(reportData.roiMatrix?.map(m => m.roi) || [0])).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Best performing combo</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Average ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${reportData.overview.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {reportData.overview.roi.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Overall average</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Positive ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.roiMatrix?.filter(m => m.roi > 0).length || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Profitable combinations</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Combinations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.roiMatrix?.length || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">Unique segments</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {((reportData.roiMatrix?.filter(m => m.roi > 0).length || 0) / 
                    (reportData.roiMatrix?.length || 1) * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">Profitable ratio</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Dashboard Layout */}
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Left Panel - Filters */}
          <div className="lg:col-span-1 space-y-6">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onApplyFilters={applyFilters}
              onAutoApplyFilters={autoApplyFilters}
              loading={loading}
            />
          </div>

          {/* Main Panel - Reports */}
          <div className="lg:col-span-3 space-y-6">
            <ReportVisualization
              reportData={reportData}
              reportType={reportType}
              filters={filters}
            />
          </div>
        </div>

        {/* Insights Panel */}
        <div className="space-y-6">
          <InsightsPanel
            reportData={reportData}
            reportType={reportType}
          />
        </div>

        {/* ROI Matrix Table */}
        {reportData && reportData.roiMatrix && reportData.roiMatrix.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed ROI Matrix</CardTitle>
              <CardDescription>Complete breakdown of ROI by {selectedView}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm font-medium text-gray-600">
                      <th className="pb-3 pr-4">
                        {selectedView === 'agent' ? 'Agent' : 
                         selectedView === 'country' ? 'Country' : 
                         'Platform'}
                      </th>
                      <th className="pb-3 px-4">Secondary</th>
                      <th className="pb-3 px-4">Tertiary</th>
                      <th className="pb-3 px-4">Spend</th>
                      <th className="pb-3 px-4">Deals</th>
                      <th className="pb-3 px-4">Cost/Deal</th>
                      <th className="pb-3 px-4">ROI</th>
                      <th className="pb-3 px-4">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.roiMatrix
                      .sort((a, b) => b.roi - a.roi)
                      .slice(0, 20)
                      .map((item, idx) => {
                        const primary = selectedView === 'agent' ? item.agent : 
                                       selectedView === 'country' ? item.country : 
                                       item.platform;
                        const secondary = selectedView === 'agent' ? item.country : 
                                         selectedView === 'country' ? item.platform : 
                                         item.agent;
                        const tertiary = selectedView === 'agent' ? item.platform : 
                                        selectedView === 'country' ? item.agent : 
                                        item.country;
                        
                        return (
                          <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3 pr-4">
                              <div className="font-medium">{primary}</div>
                              <div className="text-xs text-gray-500">{item.date}</div>
                            </td>
                            <td className="py-3 px-4">{secondary}</td>
                            <td className="py-3 px-4">{tertiary}</td>
                            <td className="py-3 px-4">${item.spend.toLocaleString()}</td>
                            <td className="py-3 px-4">{item.deals}</td>
                            <td className="py-3 px-4">
                              ${item.deals > 0 ? (item.spend / item.deals).toFixed(2) : '0.00'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`font-bold ${getROITextColor(item.roi)}`}>
                                {item.roi.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${getROIColor(item.roi)}`}
                                    style={{ width: `${Math.min(Math.abs(item.roi), 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {item.roi >= 0 ? '+' : ''}{item.roi.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ROI Heatmap */}
        {reportData && reportData.roiMatrix && (
          <Card>
            <CardHeader>
              <CardTitle>ROI Heatmap</CardTitle>
              <CardDescription>Visual representation of ROI distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 grid-cols-10">
                {reportData.roiMatrix
                  .sort((a, b) => b.roi - a.roi)
                  .slice(0, 50)
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className={`h-10 rounded flex items-center justify-center text-xs font-medium text-white ${getROIColor(item.roi)}`}
                      title={`${item.agent} - ${item.country} - ${item.platform}: ${item.roi.toFixed(1)}%`}
                    >
                      {item.roi.toFixed(0)}%
                    </div>
                  ))}
              </div>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Very Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span>Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-400 rounded"></div>
                  <span>High</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Very High</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ROI Matrix Summary */}
        {reportData && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">
                  ROI Matrix Summary
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.roiMatrix?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Segments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.roiMatrix?.filter(m => m.roi > 20).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">High ROI (&gt;20%)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {reportData.roiMatrix?.filter(m => m.roi < 0).length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Negative ROI</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      ${reportData.overview.totalSpend.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Investment</div>
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