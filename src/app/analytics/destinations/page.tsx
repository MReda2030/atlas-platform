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

const destinationFlags: { [key: string]: string } = {
  'Armenia': '🇦🇲',
  'Azerbaijan': '🇦🇿',
  'Georgia': '🇬🇪',
  'Kazakhstan': '🇰🇿',
  'Kyrgyzstan': '🇰🇬',
  'Thailand': '🇹🇭',
  'Malaysia': '🇲🇾',
  'Indonesia': '🇮🇩',
  'Turkey': '🇹🇷',
  'Egypt': '🇪🇬'
};

export default function DestinationsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reportType = 'destination_analysis';
  
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
            <div className="text-lg font-medium text-gray-600">Analyzing Destination Trends...</div>
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
              Destination Analysis
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Travel destination trends and customer preferences
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

        {/* Insights Panel */}
        <div className="space-y-6">
          <InsightsPanel
            reportData={reportData}
            reportType={reportType}
          />
        </div>

        {/* Country Preferences Table */}
        {reportData && reportData.countryInsights && reportData.countryInsights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Destination Preferences by Target Country</CardTitle>
              <CardDescription>Customer preferences from different target markets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm font-medium text-gray-600">
                      <th className="pb-3 pr-4">Target Country</th>
                      <th className="pb-3 px-4">Total Deals</th>
                      <th className="pb-3 px-4">Top Destination</th>
                      <th className="pb-3 px-4">2nd Choice</th>
                      <th className="pb-3 px-4">3rd Choice</th>
                      <th className="pb-3 px-4">Top Platform</th>
                      <th className="pb-3 px-4">Top Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.countryInsights.map((country, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{country.targetCountry}</div>
                          <div className="text-sm text-gray-500">${(country.totalSpend / 1000).toFixed(1)}k spend</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold">{country.totalDeals}</div>
                        </td>
                        <td className="py-3 px-4">
                          {country.destinationPreferences[0] && (
                            <div className="flex items-center gap-1">
                              <span>{destinationFlags[country.destinationPreferences[0].destination] || '🌍'}</span>
                              <span className="text-sm">{country.destinationPreferences[0].destination}</span>
                              <span className="text-xs text-gray-500">({country.destinationPreferences[0].percentage.toFixed(0)}%)</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {country.destinationPreferences[1] && (
                            <div className="flex items-center gap-1">
                              <span>{destinationFlags[country.destinationPreferences[1].destination] || '🌍'}</span>
                              <span className="text-sm">{country.destinationPreferences[1].destination}</span>
                              <span className="text-xs text-gray-500">({country.destinationPreferences[1].percentage.toFixed(0)}%)</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {country.destinationPreferences[2] && (
                            <div className="flex items-center gap-1">
                              <span>{destinationFlags[country.destinationPreferences[2].destination] || '🌍'}</span>
                              <span className="text-sm">{country.destinationPreferences[2].destination}</span>
                              <span className="text-xs text-gray-500">({country.destinationPreferences[2].percentage.toFixed(0)}%)</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{country.topPlatform}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm font-medium">{country.topAgent}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Destination Summary */}
        {reportData && (
          <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">
                  Destination Performance Summary
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <div className="text-2xl font-bold text-teal-600">
                      {reportData.overview.destinationSuccess.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Destinations</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-600">
                      {reportData.overview.destinationSuccess[0]?.destination || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Top Destination</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.overview.totalDeals}
                    </div>
                    <div className="text-sm text-gray-600">Total Bookings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {(reportData.overview.destinationSuccess.reduce((acc, d) => acc + d.successRate, 0) / 
                        reportData.overview.destinationSuccess.length).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Avg Success Rate</div>
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