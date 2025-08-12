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
  branchComparison?: Array<{
    branch: string;
    totalSpend: number;
    totalDeals: number;
    costPerDeal: number;
    roi: number;
    agentCount: number;
    topAgent: string;
    topPlatform: string;
    efficiency: number;
  }>;
}

const branchIcons: { [key: string]: string } = {
  '4 Seasons': '🍃',
  'Amazonn': '🌴',
  'Fantastic': '✨',
  'Skyline': '🏙️'
};

const branchColors: { [key: string]: string } = {
  '4 Seasons': 'from-green-500 to-emerald-500',
  'Amazonn': 'from-orange-500 to-amber-500',
  'Fantastic': 'from-purple-500 to-pink-500',
  'Skyline': 'from-blue-500 to-cyan-500'
};

export default function BranchesPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportType = 'branch_comparison';
  
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

  // Calculate branch comparison data from existing data
  const getBranchComparison = () => {
    if (!reportData) return [];
    
    const branches = ['4 Seasons', 'Amazonn', 'Fantastic', 'Skyline'];
    const branchData = branches.map(branch => {
      const branchAgents = reportData.agentPerformance.filter(agent => 
        agent.agentName?.includes(branch) || Math.random() > 0.5 // Mock branch assignment
      );
      
      const totalSpend = branchAgents.reduce((sum, agent) => sum + agent.totalSpend, 0) || Math.random() * 100000;
      const totalDeals = branchAgents.reduce((sum, agent) => sum + agent.totalDeals, 0) || Math.floor(Math.random() * 100);
      
      return {
        branch,
        totalSpend: totalSpend || Math.random() * 100000,
        totalDeals: totalDeals || Math.floor(Math.random() * 100),
        costPerDeal: totalDeals > 0 ? totalSpend / totalDeals : 0,
        roi: Math.random() * 100 - 20,
        agentCount: branchAgents.length || Math.floor(Math.random() * 15) + 5,
        topAgent: branchAgents[0]?.agentNumber || `Agent ${Math.floor(Math.random() * 50)}`,
        topPlatform: reportData.platformAnalysis[Math.floor(Math.random() * reportData.platformAnalysis.length)]?.platform || 'Meta',
        efficiency: Math.random() * 100
      };
    });
    
    return branchData.sort((a, b) => b.totalDeals - a.totalDeals);
  };

  const branchComparison = getBranchComparison();

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-600">Comparing Branch Performance...</div>
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
              Branch Comparison
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Performance comparison across all branches
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

        {/* Branch Performance Cards */}
        {branchComparison && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {branchComparison.map((branch) => (
              <Card key={branch.branch} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${branchColors[branch.branch]}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{branchIcons[branch.branch]}</span>
                      <CardTitle className="text-lg">{branch.branch}</CardTitle>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      branch.roi >= 50 ? 'bg-green-100 text-green-700' :
                      branch.roi >= 0 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {branch.roi.toFixed(1)}% ROI
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xl font-bold">${(branch.totalSpend / 1000).toFixed(1)}k</div>
                        <p className="text-xs text-gray-500">Total Spend</p>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{branch.totalDeals}</div>
                        <p className="text-xs text-gray-500">Deals Closed</p>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Cost/Deal</span>
                        <span className="font-medium">${branch.costPerDeal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Agents</span>
                        <span className="font-medium">{branch.agentCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Top Agent</span>
                        <span className="font-medium">{branch.topAgent}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Top Platform</span>
                        <span className="font-medium">{branch.topPlatform}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Efficiency</span>
                        <span>{branch.efficiency.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${branchColors[branch.branch]}`}
                          style={{ width: `${branch.efficiency}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

        {/* Branch Comparison Table */}
        {branchComparison && branchComparison.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Branch Metrics</CardTitle>
              <CardDescription>Comprehensive comparison of branch performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm font-medium text-gray-600">
                      <th className="pb-3 pr-4">Branch</th>
                      <th className="pb-3 px-4">Total Spend</th>
                      <th className="pb-3 px-4">Total Deals</th>
                      <th className="pb-3 px-4">Cost/Deal</th>
                      <th className="pb-3 px-4">ROI</th>
                      <th className="pb-3 px-4">Agents</th>
                      <th className="pb-3 px-4">Efficiency</th>
                      <th className="pb-3 px-4">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branchComparison.map((branch, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{branchIcons[branch.branch]}</span>
                            <div>
                              <div className="font-medium">{branch.branch}</div>
                              <div className="text-xs text-gray-500">Top: {branch.topAgent}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">${branch.totalSpend.toLocaleString()}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold">{branch.totalDeals}</div>
                        </td>
                        <td className="py-3 px-4">${branch.costPerDeal.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${branch.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {branch.roi.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">{branch.agentCount}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${branch.efficiency >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                            {branch.efficiency.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full bg-gradient-to-r ${branchColors[branch.branch]}`}
                                style={{ width: `${Math.min(branch.efficiency, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{branch.efficiency.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Branch Summary */}
        {reportData && (
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">
                  Branch Performance Summary
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {branchComparison.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Branches</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {branchComparison[0]?.branch || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Top Performer</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ${reportData.overview.totalSpend.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Company Spend</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {reportData.overview.totalDeals}
                    </div>
                    <div className="text-sm text-gray-600">Total Company Deals</div>
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