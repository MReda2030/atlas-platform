'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportData } from '../page';

interface InsightsPanelProps {
  reportData: ReportData | null;
  reportType: string;
}

export function InsightsPanel({ 
  reportData, 
  reportType
}: InsightsPanelProps) {
  if (!reportData) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Insights</CardTitle>
            <CardDescription>Generate a report to see insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">💡</span>
              <p className="text-sm">Insights will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, agentPerformance } = reportData;

  return (
    <div className="space-y-6">
      {/* Main Insights Row - Horizontal Layout for Full Width */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Top Performers - COMMENTED OUT AS REQUESTED
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🏆 Top Performers</CardTitle>
            <CardDescription>Best performing agents this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agentPerformance.slice(0, 5).map((agent, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' :
                      'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">Agent {agent.agentNumber}</div>
                      <div className="text-xs text-gray-500">{agent.totalDeals} deals</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-sm ${agent.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {agent.roi.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        */}

        {/* Key Insights - COMMENTED OUT AS REQUESTED
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Key Insights</CardTitle>
            <CardDescription>AI-generated insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generateKeyInsights(reportData, reportType).slice(0, 4).map((insight, index) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start space-x-2">
                    <span className="text-lg">{insight.icon}</span>
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1 text-sm">
                        {insight.title}
                      </h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        */}

        {/* Period Summary - COMMENTED OUT AS REQUESTED
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <CardHeader>
            <CardTitle className="text-lg">📈 Period Summary</CardTitle>
            <CardDescription>Key performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold">${overview.totalSpend.toLocaleString()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Total Investment</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{overview.totalDeals}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Deals Closed</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${overview.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {overview.roi >= 0 ? '+' : ''}{overview.roi.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Net ROI</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{agentPerformance.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Agents Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
        */}
      </div>

      {/* Secondary Insights Row - Horizontal Layout */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Alerts & Trends - COMMENTED OUT AS REQUESTED
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⚠️ Alerts & Trends</CardTitle>
            <CardDescription>Performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overview.roi < 0 && (
                <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 text-sm">🚨</span>
                    <div>
                      <div className="font-semibold text-red-800 dark:text-red-200 text-sm">Negative ROI</div>
                      <div className="text-xs text-red-600 dark:text-red-300">
                        {overview.roi.toFixed(1)}% needs attention
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {overview.conversionRate < 2 && (
                <div className="p-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-orange-600 text-sm">⚡</span>
                    <div>
                      <div className="font-semibold text-orange-800 dark:text-orange-200 text-sm">Low Conversion</div>
                      <div className="text-xs text-orange-600 dark:text-orange-300">
                        {overview.conversionRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {overview.costPerDeal > 300 && (
                <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600 text-sm">💰</span>
                    <div>
                      <div className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">High Cost</div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-300">
                        ${overview.costPerDeal.toFixed(0)} per deal
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {overview.roi > 50 && (
                <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 text-sm">🎉</span>
                    <div>
                      <div className="font-semibold text-green-800 dark:text-green-200 text-sm">Excellent</div>
                      <div className="text-xs text-green-600 dark:text-green-300">
                        {overview.roi.toFixed(1)}% ROI
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        */}

        {/* Quick Actions - COMMENTED OUT AS REQUESTED
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⚡ Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                📊 Export Report
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                📧 Schedule Report
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                🔄 Compare Period
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                📈 Create Alert
              </Button>
            </div>
          </CardContent>
        </Card>
        */}

        {/* Recent Activity - COMMENTED OUT AS REQUESTED
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🕐 Recent Activity</CardTitle>
            <CardDescription>System updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">Report generated</span>
                <span className="text-gray-400 ml-auto">now</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  {agentPerformance.length} agents analyzed
                </span>
                <span className="text-gray-400 ml-auto">now</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  {overview.totalDeals} deals calculated
                </span>
                <span className="text-gray-400 ml-auto">now</span>
              </div>
            </div>
          </CardContent>
        </Card>
        */}

        {/* Performance Trends - COMMENTED OUT AS REQUESTED
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📈 Trends</CardTitle>
            <CardDescription>Performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">Cost/Deal</span>
                <span className="font-bold text-sm">${overview.costPerDeal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">Conversion</span>
                <span className="font-bold text-sm">{overview.conversionRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">Efficiency</span>
                <span className="font-bold text-sm">{overview.spendEfficiency.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        */}
      </div>
    </div>
  );
}

function generateKeyInsights(data: ReportData, reportType: string) {
  const { overview, agentPerformance } = data;
  const insights = [];

  // Performance insights
  if (overview.roi > 20) {
    insights.push({
      icon: '🚀',
      title: 'Excellent ROI Performance',
      description: `Your campaigns are generating ${overview.roi.toFixed(1)}% ROI, well above industry averages.`
    });
  } else if (overview.roi > 0) {
    insights.push({
      icon: '📈',
      title: 'Positive ROI Trend',
      description: `Campaigns are profitable with ${overview.roi.toFixed(1)}% ROI. Consider scaling successful strategies.`
    });
  } else {
    insights.push({
      icon: '⚠️',
      title: 'ROI Optimization Needed',
      description: `Current ROI is ${overview.roi.toFixed(1)}%. Focus on high-performing agents and platforms.`
    });
  }

  // Agent performance insights
  const topAgent = agentPerformance[0];
  if (topAgent && topAgent.roi > 50) {
    insights.push({
      icon: '🏆',
      title: 'Star Performer Identified',
      description: `Agent ${topAgent.agentNumber} is achieving ${topAgent.roi.toFixed(1)}% ROI. Study their approach for scaling.`
    });
  }

  // Cost efficiency insights
  if (overview.costPerDeal < 100) {
    insights.push({
      icon: '💰',
      title: 'Cost Efficient Operations',
      description: `Average cost per deal of $${overview.costPerDeal.toFixed(0)} indicates efficient spending.`
    });
  } else if (overview.costPerDeal > 300) {
    insights.push({
      icon: '💸',
      title: 'High Acquisition Costs',
      description: `Cost per deal is $${overview.costPerDeal.toFixed(0)}. Consider optimizing targeting and messaging.`
    });
  }

  // Platform insights
  if (overview.platformBreakdown && overview.platformBreakdown.length > 0) {
    const bestPlatform = overview.platformBreakdown.reduce((best, current) => 
      (current.costPerDeal || Infinity) < (best.costPerDeal || Infinity) ? current : best
    );
    insights.push({
      icon: 'Ⓟ',
      title: 'Best Performing Platform',
      description: `${bestPlatform.platform} shows the most cost-effective performance. Consider increasing allocation.`
    });
  }

  // Conversion rate insights
  if (overview.conversionRate > 10) {
    insights.push({
      icon: '🎯',
      title: 'Strong Conversion Rate',
      description: `${overview.conversionRate.toFixed(1)}% conversion rate indicates excellent audience targeting.`
    });
  } else if (overview.conversionRate < 5) {
    insights.push({
      icon: '📈',
      title: 'Conversion Optimization',
      description: `${overview.conversionRate.toFixed(1)}% conversion rate suggests room for messaging improvements.`
    });
  }

  return insights.slice(0, 6); // Limit to 6 insights max
}

