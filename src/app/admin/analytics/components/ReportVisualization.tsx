'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportData, ReportFilters } from '../page';

interface ReportVisualizationProps {
  reportData: ReportData | null;
  reportType: string;
  filters: ReportFilters;
}

export function ReportVisualization({ reportData, reportType, filters }: ReportVisualizationProps) {
  if (!reportData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="text-gray-500">
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p>Apply filters and generate a report to see visualizations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  switch (reportType) {
    case 'agent_roi':
      return <AgentROIVisualization data={reportData} />;
    case 'platform_effectiveness':
      return <PlatformEffectivenessVisualization data={reportData} />;
    case 'destination_analysis':
      return <DestinationAnalysisVisualization data={reportData} />;
    case 'branch_comparison':
      return <BranchComparisonVisualization data={reportData} />;
    case 'roi_matrix':
      return <ROIMatrixVisualization data={reportData} />;
    default:
      return <AgentROIVisualization data={reportData} />;
  }
}

function AgentROIVisualization({ data }: { data: ReportData }) {
  const { overview, agentPerformance } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
            <span className="text-2xl">💹</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(overview.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(overview.roi || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Return on investment</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${overview.totalSpend.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Deal</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(overview.costPerDeal || 0).toFixed(0)}
            </div>
            <p className="text-xs text-gray-500">Average acquisition cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(overview.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Messages to deals</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Analysis</CardTitle>
          <CardDescription>
            ROI analysis by agent with Date + Agent + Country matching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Agent</th>
                  <th className="text-right p-3 font-medium">Total Spend</th>
                  <th className="text-right p-3 font-medium">Deals</th>
                  <th className="text-right p-3 font-medium">Cost/Deal</th>
                  <th className="text-right p-3 font-medium">ROI</th>
                  <th className="text-right p-3 font-medium">Conversion</th>
                  <th className="text-right p-3 font-medium">Quality</th>
                  <th className="text-center p-3 font-medium">Countries</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance.map((agent, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div className="font-medium">Agent {agent.agentNumber}</div>
                      <div className="text-xs text-gray-500">{agent.agentName}</div>
                    </td>
                    <td className="text-right p-3">
                      ${agent.totalSpend.toLocaleString()}
                    </td>
                    <td className="text-right p-3">
                      <span className="font-medium">{agent.totalDeals}</span>
                    </td>
                    <td className="text-right p-3">
                      ${(agent.costPerDeal || 0).toFixed(0)}
                    </td>
                    <td className={`text-right p-3 font-medium ${agent.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(agent.roi || 0).toFixed(1)}%
                    </td>
                    <td className="text-right p-3">
                      {(agent.conversionRate || 0).toFixed(1)}%
                    </td>
                    <td className="text-right p-3">
                      <div className="flex items-center justify-end">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          agent.qualityScore >= 4 ? 'bg-green-400' :
                          agent.qualityScore >= 3 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        {(agent.qualityScore || 0).toFixed(1)}
                      </div>
                    </td>
                    <td className="text-center p-3">
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {agent.countryBreakdown.length} countries
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Country Breakdown - COMMENTED OUT AS REQUESTED
      {agentPerformance.length > 0 && agentPerformance[0].countryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Agent Country Performance</CardTitle>
            <CardDescription>
              Best performing agent's performance by target country
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agentPerformance[0].countryBreakdown.map((country, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-semibold">{country.country}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Spend: ${country.spend.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Deals: {country.deals}
                  </div>
                  <div className={`text-sm font-medium ${country.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ROI: {(country.roi || 0).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      */}

      {/* Performance Insights - COMMENTED OUT AS REQUESTED
      <Card className="bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-lg">💡 Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Top Performers</h4>
              <ul className="space-y-1 text-sm">
                {agentPerformance.slice(0, 3).map((agent, index) => (
                  <li key={index} className="flex justify-between">
                    <span>Agent {agent.agentNumber}</span>
                    <span className="font-medium text-green-600">{(agent.roi || 0).toFixed(1)}% ROI</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Opportunities</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>• {overview.roi > 50 ? 'Excellent overall ROI performance' : 'Consider optimizing low-performing campaigns'}</li>
                <li>• {overview.conversionRate > 5 ? 'Strong conversion rates' : 'Focus on improving lead quality'}</li>
                <li>• {overview.costPerDeal < 200 ? 'Efficient cost per deal' : 'Optimize for lower acquisition costs'}</li>
                <li>• Quality scores trending {overview.qualityTrend}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      */}
    </div>
  );
}

function PlatformEffectivenessVisualization({ data }: { data: ReportData }) {
  const { overview } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
            <span className="text-2xl">💹</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(overview.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(overview.roi || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Cross-platform performance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${overview.totalSpend.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500">All platforms combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Platform</CardTitle>
            <span className="text-2xl">🏆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.platformBreakdown.length > 0 ? overview.platformBreakdown[0].platform : 'N/A'}
            </div>
            <p className="text-xs text-gray-500">Highest performing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Deal</CardTitle>
            <span className="text-2xl">🎯</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${(overview.costPerDeal || 0).toFixed(0)}
            </div>
            <p className="text-xs text-gray-500">Platform average</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance Breakdown</CardTitle>
          <CardDescription>
            Advertising effectiveness by platform with spend and conversion metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Platform</th>
                  <th className="text-right p-3 font-medium">Total Spend</th>
                  <th className="text-right p-3 font-medium">Deals</th>
                  <th className="text-right p-3 font-medium">Cost/Deal</th>
                  <th className="text-center p-3 font-medium">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {overview.platformBreakdown.map((platform, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3">
                      <div className="font-medium">{platform.platform}</div>
                    </td>
                    <td className="text-right p-3">
                      ${platform.spend.toLocaleString()}
                    </td>
                    <td className="text-right p-3">
                      <span className="font-medium">{platform.deals}</span>
                    </td>
                    <td className="text-right p-3">
                      ${(platform.costPerDeal || 0).toFixed(0)}
                    </td>
                    <td className="text-center p-3">
                      {platform.spend === 0 && platform.deals === 0 ? (
                        <span className="text-gray-400">-</span>
                      ) : (
                        <div className="flex items-center justify-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            (platform.costPerDeal || 0) < 300 ? 'bg-green-400' :
                            (platform.costPerDeal || 0) < 500 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          {(platform.costPerDeal || 0) < 300 ? 'High' : (platform.costPerDeal || 0) < 500 ? 'Medium' : 'Low'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Destination Success Analysis */}
      {overview.destinationSuccess.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Destination Success Rates</CardTitle>
            <CardDescription>
              Travel destination performance across platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {overview.destinationSuccess.map((destination, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-semibold">{destination.destination}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Spend: ${destination.campaignSpend.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Deals: {destination.actualDeals}
                  </div>
                  <div className={`text-sm font-medium ${
                    destination.successRate >= 90 ? 'text-green-600' :
                    destination.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    Success: {destination.successRate}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Insights - COMMENTED OUT AS REQUESTED
      <Card className="bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="text-lg">Ⓟ Platform Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Top Performers</h4>
              <ul className="space-y-1 text-sm">
                {overview.platformBreakdown.slice(0, 3).map((platform, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{platform.platform}</span>
                    <span className="font-medium text-green-600">${(platform.costPerDeal || 0).toFixed(0)}/deal</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Optimization Tips</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>• {overview.costPerDeal < 300 ? 'Excellent cost efficiency across platforms' : 'Consider optimizing high-cost platforms'}</li>
                <li>• {overview.platformBreakdown.length > 3 ? 'Good platform diversification' : 'Consider expanding to more platforms'}</li>
                <li>• Focus budget on {overview.platformBreakdown[0]?.platform || 'top performer'}</li>
                <li>• Monitor destination success rates regularly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      */}
    </div>
  );
}

function DestinationAnalysisVisualization({ data }: { data: ReportData }) {
  const { overview, agentPerformance } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <span className="text-2xl">🎆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overview.destinationSuccess.length > 0 
                ? Math.round(overview.destinationSuccess.reduce((acc, dest) => acc + dest.successRate, 0) / overview.destinationSuccess.length)
                : 0}%
            </div>
            <p className="text-xs text-gray-500">Average across destinations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Destination</CardTitle>
            <span className="text-2xl">🌍</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.destinationSuccess.length > 0 
                ? overview.destinationSuccess.sort((a, b) => b.successRate - a.successRate)[0].destination
                : 'N/A'}
            </div>
            <p className="text-xs text-gray-500">Best performing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <span className="text-2xl">🏆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {overview.destinationSuccess.reduce((acc, dest) => acc + dest.actualDeals, 0)}
            </div>
            <p className="text-xs text-gray-500">All destinations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Destinations</CardTitle>
            <span className="text-2xl">🗺️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {overview.destinationSuccess.length}
            </div>
            <p className="text-xs text-gray-500">Countries tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Destination Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Destination Performance Analysis</CardTitle>
          <CardDescription>
            Travel destination success rates and campaign effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Destination</th>
                  <th className="text-right p-3 font-medium">Campaign Spend</th>
                  <th className="text-right p-3 font-medium">Actual Deals</th>
                  <th className="text-right p-3 font-medium">Cost per Deal</th>
                  <th className="text-right p-3 font-medium">Success Rate</th>
                  <th className="text-center p-3 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {overview.destinationSuccess
                  .sort((a, b) => b.successRate - a.successRate)
                  .map((destination, index) => {
                    const costPerDeal = destination.actualDeals > 0 ? destination.campaignSpend / destination.actualDeals : 0;
                    return (
                      <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-3">
                          <div className="font-medium">{destination.destination}</div>
                        </td>
                        <td className="text-right p-3">
                          ${destination.campaignSpend.toLocaleString()}
                        </td>
                        <td className="text-right p-3">
                          <span className="font-medium">{destination.actualDeals}</span>
                        </td>
                        <td className="text-right p-3">
                          ${(costPerDeal || 0).toFixed(0)}
                        </td>
                        <td className={`text-right p-3 font-medium ${
                          destination.successRate >= 90 ? 'text-green-600' :
                          destination.successRate >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {destination.successRate}%
                        </td>
                        <td className="text-center p-3">
                          <div className="flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              destination.successRate >= 90 ? 'bg-green-400' :
                              destination.successRate >= 80 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}></div>
                            {destination.successRate >= 90 ? 'Excellent' :
                             destination.successRate >= 80 ? 'Good' : 'Needs Attention'}
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

      {/* Top Agent Performance by Destination */}
      {agentPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance by Country</CardTitle>
            <CardDescription>
              Top agent performance breakdown by target countries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agentPerformance.slice(0, 6).map((agent, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-semibold">Agent {agent.agentNumber}</div>
                  <div className="text-xs text-gray-500 mb-2">{agent.agentName}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total Spend: ${agent.totalSpend.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Deals: {agent.totalDeals}
                  </div>
                  <div className={`text-sm font-medium ${agent.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ROI: {(agent.roi || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {agent.countryBreakdown.length} countries
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Destination Insights */}
      <Card className="bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-lg">🌍 Destination Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Top Destinations</h4>
              <ul className="space-y-1 text-sm">
                {overview.destinationSuccess
                  .sort((a, b) => b.successRate - a.successRate)
                  .slice(0, 3)
                  .map((destination, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{destination.destination}</span>
                      <span className="font-medium text-green-600">{destination.successRate}% success</span>
                    </li>
                  ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Optimization Opportunities</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>• {overview.destinationSuccess.some(d => d.successRate < 80) 
                  ? 'Review low-performing destinations' 
                  : 'All destinations performing well'}
                </li>
                <li>• {overview.destinationSuccess.length > 5 
                  ? 'Good destination diversity' 
                  : 'Consider expanding destination portfolio'}
                </li>
                <li>• Focus marketing on proven destinations</li>
                <li>• Analyze seasonal destination trends</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BranchComparisonVisualization({ data }: { data: ReportData }) {
  const { overview, agentPerformance } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
            <span className="text-2xl">💹</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(overview.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(overview.roi || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">All branches combined</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Branch</CardTitle>
            <span className="text-2xl">🏆</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agentPerformance.length > 0 
                ? agentPerformance.sort((a, b) => b.roi - a.roi)[0].agentName.replace(' Branch', '')
                : 'N/A'}
            </div>
            <p className="text-xs text-gray-500">Highest ROI performer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
            <span className="text-2xl">🏢</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {agentPerformance.length}
            </div>
            <p className="text-xs text-gray-500">Branches tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
            <span className="text-2xl">⭐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(overview.averageQualityScore || 0).toFixed(1)}
            </div>
            <p className="text-xs text-gray-500">Branch quality score</p>
          </CardContent>
        </Card>
      </div>

      {/* Branch Performance Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Performance Comparison</CardTitle>
          <CardDescription>
            Comprehensive office-by-office performance analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Branch</th>
                  <th className="text-right p-3 font-medium">Total Spend</th>
                  <th className="text-right p-3 font-medium">Deals</th>
                  <th className="text-right p-3 font-medium">Cost/Deal</th>
                  <th className="text-right p-3 font-medium">ROI</th>
                  <th className="text-right p-3 font-medium">Conversion</th>
                  <th className="text-right p-3 font-medium">Quality</th>
                  <th className="text-center p-3 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {agentPerformance
                  .sort((a, b) => b.roi - a.roi)
                  .map((branch, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="p-3">
                        <div className="font-medium">{branch.agentName}</div>
                        <div className="text-xs text-gray-500">Code: {branch.agentNumber}</div>
                      </td>
                      <td className="text-right p-3">
                        ${branch.totalSpend.toLocaleString()}
                      </td>
                      <td className="text-right p-3">
                        <span className="font-medium">{branch.totalDeals}</span>
                      </td>
                      <td className="text-right p-3">
                        ${(branch.costPerDeal || 0).toFixed(0)}
                      </td>
                      <td className={`text-right p-3 font-medium ${(branch.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(branch.roi || 0).toFixed(1)}%
                      </td>
                      <td className="text-right p-3">
                        {(branch.conversionRate || 0).toFixed(1)}%
                      </td>
                      <td className="text-right p-3">
                        <div className="flex items-center justify-end">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            (branch.qualityScore || 0) >= 4 ? 'bg-green-400' :
                            (branch.qualityScore || 0) >= 3 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          {(branch.qualityScore || 0).toFixed(1)}
                        </div>
                      </td>
                      <td className="text-center p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          index === 0 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          index === 1 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                          index === 2 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {index === 0 ? 'Top' : index === 1 ? '2nd' : index === 2 ? '3rd' : `${index + 1}th`}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Branch Country Breakdown */}
      {agentPerformance.length > 0 && agentPerformance[0].countryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Branch Country Performance</CardTitle>
            <CardDescription>
              {agentPerformance.sort((a, b) => b.roi - a.roi)[0].agentName} performance by target country
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agentPerformance.sort((a, b) => b.roi - a.roi)[0].countryBreakdown.map((country, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-semibold">{country.country}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Spend: ${country.spend.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Deals: {country.deals}
                  </div>
                  <div className={`text-sm font-medium ${country.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ROI: {(country.roi || 0).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Performance Overview - COMMENTED OUT AS REQUESTED
      {overview.platformBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance Overview</CardTitle>
            <CardDescription>
              Cross-branch platform effectiveness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {overview.platformBreakdown.map((platform, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="font-semibold">{platform.platform}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total Spend: ${platform.spend.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Deals: {platform.deals}
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    Cost/Deal: ${(platform.costPerDeal || 0).toFixed(0)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      */}

      {/* Branch Insights */}
      <Card className="bg-indigo-50 dark:bg-indigo-950/20">
        <CardHeader>
          <CardTitle className="text-lg">🏢 Branch Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Top Performing Branches</h4>
              <ul className="space-y-1 text-sm">
                {agentPerformance
                  .sort((a, b) => b.roi - a.roi)
                  .slice(0, 3)
                  .map((branch, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{branch.agentName.replace(' Branch', '')}</span>
                      <span className="font-medium text-green-600">{(branch.roi || 0).toFixed(1)}% ROI</span>
                    </li>
                  ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Optimization Opportunities</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                <li>• {agentPerformance.some(b => b.roi < 25) 
                  ? 'Support underperforming branches' 
                  : 'All branches meeting ROI targets'}
                </li>
                <li>• {overview.averageQualityScore > 4 
                  ? 'Excellent quality across branches' 
                  : 'Focus on quality improvement training'}
                </li>
                <li>• Share best practices from top branch</li>
                <li>• Consider budget reallocation between branches</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ROIMatrixVisualization({ data }: { data: ReportData }) {
  const { roiMatrix } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete ROI Matrix</CardTitle>
        <CardDescription>
          Comprehensive view of Date + Agent + Country + Platform performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {roiMatrix.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Agent</th>
                  <th className="text-left p-3 font-medium">Country</th>
                  <th className="text-left p-3 font-medium">Platform</th>
                  <th className="text-right p-3 font-medium">Spend</th>
                  <th className="text-right p-3 font-medium">Deals</th>
                  <th className="text-right p-3 font-medium">ROI</th>
                </tr>
              </thead>
              <tbody>
                {roiMatrix.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-3 font-medium">Agent {row.agent}</td>
                    <td className="p-3">{row.country}</td>
                    <td className="p-3">{row.platform}</td>
                    <td className="text-right p-3">${row.spend.toLocaleString()}</td>
                    <td className="text-right p-3">{row.deals}</td>
                    <td className={`text-right p-3 font-medium ${(row.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(row.roi || 0).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <span className="text-6xl mb-4 block">📊</span>
            <h3 className="text-lg font-semibold mb-2">ROI Matrix</h3>
            <p>Complete performance breakdown will be displayed here</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}