'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface AnalyticsOverview {
  totalSpend: number;
  totalRevenue: number;
  totalDeals: number;
  roi: number;
  costPerConversion: number;
  conversionRate: number;
  profitMargin: number;
}

interface TopPerformer {
  agentId?: string;
  agentNumber?: string;
  countryName?: string;
  platformName?: string;
  roi: number;
  totalDeals?: number;
  efficiency?: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  topPerformers: {
    agents: TopPerformer[];
    countries: TopPerformer[];
    platforms: TopPerformer[];
  };
  trends: {
    dates: string[];
    spendData: number[];
    dealsData: number[];
    revenueData: number[];
    roiData: number[];
  };
}

function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    branchId: '',
    agentId: '',
    countryId: '',
    platformId: '',
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/analytics/overview?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const result = await response.json();
      setAnalyticsData(result.data);

    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <Button onClick={fetchAnalytics}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center text-gray-500">
          No analytics data available
        </div>
      </div>
    );
  }

  const { overview, topPerformers } = analyticsData;

  // Memoize expensive calculations
  const performanceInsights = useMemo(() => {
    if (!overview) return [];
    return [
      overview.roi > 100 ? 'Excellent ROI performance' : overview.roi > 50 ? 'Good ROI performance' : 'ROI needs improvement',
      overview.conversionRate > 10 ? 'High conversion rate' : overview.conversionRate > 5 ? 'Moderate conversion rate' : 'Low conversion rate - optimize targeting',
      overview.costPerConversion < 200 ? 'Efficient cost per conversion' : 'Consider optimizing for lower acquisition costs',
      topPerformers.agents.length > 0 ? `Top agent: Agent ${topPerformers.agents[0]?.agentNumber} with ${topPerformers.agents[0]?.roi?.toFixed(1)}% ROI` : 'No agent performance data available'
    ];
  }, [overview, topPerformers]);

  const netProfit = useMemo(() => {
    return overview ? overview.totalRevenue - overview.totalSpend : 0;
  }, [overview]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              Analytics Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              ROI analysis and performance insights
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Customize your analytics view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select
                  id="branch"
                  value={filters.branchId}
                  onChange={(e) => handleFilterChange('branchId', e.target.value)}
                  placeholder="All branches"
                >
                  <option value="">All Branches</option>
                  <option value="4seasons">4 Seasons</option>
                  <option value="amazonn">Amazonn</option>
                  <option value="fantastic">Fantastic</option>
                  <option value="skyline">Skyline</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agent">Agent</Label>
                <Input
                  id="agent"
                  placeholder="Agent ID"
                  value={filters.agentId}
                  onChange={(e) => handleFilterChange('agentId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  id="country"
                  value={filters.countryId}
                  onChange={(e) => handleFilterChange('countryId', e.target.value)}
                  placeholder="All countries"
                >
                  <option value="">All Countries</option>
                  <option value="UAE">UAE</option>
                  <option value="KSA">Saudi Arabia</option>
                  <option value="KWT">Kuwait</option>
                  <option value="QAT">Qatar</option>
                  <option value="BHR">Bahrain</option>
                  <option value="OMN">Oman</option>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                <Button onClick={applyFilters} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
              <span className="text-2xl">💹</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${overview.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {overview.roi.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Return on investment
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${overview.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                From {overview.totalDeals} deals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost per Conversion</CardTitle>
              <span className="text-2xl">🎯</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${overview.costPerConversion.toFixed(0)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Average cost per deal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <span className="text-2xl">📈</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {overview.conversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Messages to deals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Agents</CardTitle>
              <CardDescription>Best performing sales agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.agents.slice(0, 5).map((agent, index) => (
                  <div key={`agent-${agent.agentId || agent.agentNumber || index}`} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Agent {agent.agentNumber}</div>
                      <div className="text-sm text-gray-500">
                        {agent.totalDeals} deals • {agent.roi.toFixed(1)}% ROI
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      index === 2 ? 'text-amber-600' :
                      'text-gray-500'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Countries</CardTitle>
              <CardDescription>Best performing markets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.countries.slice(0, 5).map((country, index) => (
                  <div key={`country-${country.countryName || index}`} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{country.countryName}</div>
                      <div className="text-sm text-gray-500">
                        {country.totalDeals} deals • {country.roi.toFixed(1)}% ROI
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      index === 2 ? 'text-amber-600' :
                      'text-gray-500'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Platforms</CardTitle>
              <CardDescription>Best performing ad platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.platforms.slice(0, 5).map((platform, index) => (
                  <div key={`platform-${platform.platformName || index}`} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{platform.platformName}</div>
                      <div className="text-sm text-gray-500">
                        {platform.efficiency?.toFixed(1)}% efficiency
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      index === 2 ? 'text-amber-600' :
                      'text-gray-500'
                    }`}>
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Key insights from your marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  ${overview.totalSpend.toLocaleString()}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-200">Total Ad Spend</div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  {overview.totalDeals}
                </div>
                <div className="text-sm text-green-700 dark:text-green-200">Total Conversions</div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {overview.profitMargin.toFixed(1)}%
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-200">Profit Margin</div>
              </div>

              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  ${netProfit.toLocaleString()}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-200">Net Profit</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Key Insights</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {performanceInsights.map((insight, index) => (
                  <li key={`insight-${index}`}>• {insight}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Ready for Deeper Analysis?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Explore detailed agent comparisons, country breakdowns, and platform performance
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  View Agent Details
                </Button>
                <Button>
                  Explore Markets
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default memo(AnalyticsPage);