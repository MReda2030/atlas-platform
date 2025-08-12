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

export default function AgentROIPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportType = 'agent_roi';
  
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

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-lg font-medium text-gray-600">Generating Agent ROI Analysis...</div>
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
              Agent ROI Analysis
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Performance analysis and ROI metrics for all sales agents
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

        {/* Insights Panel - COMMENTED OUT AS REQUESTED */}
        {/* <div className="space-y-6">
          <InsightsPanel
            reportData={reportData}
            reportType={reportType}
          />
        </div> */}

        {/* Agent Performance Details Table - COMMENTED OUT AS REQUESTED */}
        {/* {reportData && reportData.agentPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance Details</CardTitle>
              <CardDescription>Detailed metrics for each agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm font-medium text-gray-600">
                      <th className="pb-3 pr-4">Agent</th>
                      <th className="pb-3 px-4">Total Spend</th>
                      <th className="pb-3 px-4">Deals</th>
                      <th className="pb-3 px-4">Cost/Deal</th>
                      <th className="pb-3 px-4">ROI</th>
                      <th className="pb-3 px-4">Quality Score</th>
                      <th className="pb-3 px-4">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.agentPerformance.slice(0, 10).map((agent, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 pr-4">
                          <div>
                            <div className="font-medium">{agent.agentNumber}</div>
                            <div className="text-sm text-gray-500">{agent.agentName}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">${agent.totalSpend.toLocaleString()}</td>
                        <td className="py-3 px-4">{agent.totalDeals}</td>
                        <td className="py-3 px-4">${agent.costPerDeal.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${agent.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {agent.roi.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${agent.qualityScore}%` }}
                              />
                            </div>
                            <span className="text-sm">{agent.qualityScore.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{agent.conversionRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )} */}
      </div>
    </div>
  );
}