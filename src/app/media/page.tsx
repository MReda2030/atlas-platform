'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataGrid from '@/components/ui/data-grid';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDays, Building2, User, DollarSign, BarChart3, Plus, Eye } from 'lucide-react';
import { BRANCHES, ADVERTISING_PLATFORMS, TARGET_COUNTRIES, DESTINATION_COUNTRIES } from '@/lib/constants';

interface MediaReport {
  id: string;
  date: string;
  branchId: string;
  branch: {
    name: string;
    code: string;
  };
  mediaBuyer: {
    name: string;
    email: string;
  };
  mediaCountryData: Array<{
    targetCountry: {
      name: string;
      code: string;
    };
    mediaAgentData: Array<{
      salesAgent: {
        agentNumber: string;
        name?: string;
      };
      campaignCount: number;
      campaignDetails: Array<{
        destinationCountry: {
          name: string;
          code: string;
        };
        amount: number | string | any;
        platform: {
          name: string;
          code: string;
        };
        campaignNumber: number;
      }>;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface FlattenedReport {
  id: string;
  date: string;
  formattedDate: string;
  branchName: string;
  branchCode: string;
  mediaBuyerName: string;
  mediaBuyerEmail: string;
  totalSpend: number;
  totalCampaigns: number;
  avgPerCampaign: number;
  countries: string[];
  agents: string[];
  platforms: string[];
  destinations: string[];
  campaignDetails: Array<{
    targetCountry: string;
    agent: string;
    destination: string;
    platform: string;
    amount: number;
    campaignNumber: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function MediaReportsPage() {
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState<MediaReport[]>([]);
  const [flattenedReports, setFlattenedReports] = useState<FlattenedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0
  });
  const searchParams = useSearchParams();

  const parseAmount = (amount: any): number => {
    if (amount === null || amount === undefined) return 0;
    if (typeof amount === 'string') return parseFloat(amount) || 0;
    if (typeof amount === 'number') return amount;
    if (amount && typeof amount === 'object' && 'toNumber' in amount) {
      return (amount as any).toNumber() || 0;
    }
    if (amount && typeof amount.toString === 'function') {
      return parseFloat(amount.toString()) || 0;
    }
    return 0;
  };

  const flattenReports = (reports: MediaReport[]): FlattenedReport[] => {
    return reports.map(report => {
      let totalSpend = 0;
      let totalCampaigns = 0;
      const countries = new Set<string>();
      const agents = new Set<string>();
      const platforms = new Set<string>();
      const destinations = new Set<string>();
      const campaignDetails: Array<{
        targetCountry: string;
        agent: string;
        destination: string;
        platform: string;
        amount: number;
        campaignNumber: number;
      }> = [];

      (report.mediaCountryData || []).forEach(countryData => {
        countries.add(countryData.targetCountry?.name || 'Unknown Country');
        
        (countryData.mediaAgentData || []).forEach(agentData => {
          agents.add(`Agent ${agentData.salesAgent?.agentNumber || 'Unknown'}`);
          totalCampaigns += agentData.campaignCount || 0;
          
          (agentData.campaignDetails || []).forEach(campaign => {
            const amount = parseAmount(campaign.amount);
            totalSpend += amount;
            platforms.add(campaign.platform?.name || 'Unknown Platform');
            destinations.add(campaign.destinationCountry?.name || 'Unknown Destination');
            
            campaignDetails.push({
              targetCountry: countryData.targetCountry?.name || 'Unknown Country',
              agent: `Agent ${agentData.salesAgent?.agentNumber || 'Unknown'}`,
              destination: campaign.destinationCountry?.name || 'Unknown Destination',
              platform: campaign.platform?.name || 'Unknown Platform',
              amount: amount,
              campaignNumber: campaign.campaignNumber
            });
          });
        });
      });

      const avgPerCampaign = totalCampaigns > 0 ? totalSpend / totalCampaigns : 0;

      return {
        id: report.id,
        date: report.date,
        formattedDate: new Date(report.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        branchName: report.branch?.name || 'Unknown Branch',
        branchCode: report.branch?.code || '',
        mediaBuyerName: report.mediaBuyer?.name || 'Unknown Media Buyer',
        mediaBuyerEmail: report.mediaBuyer?.email || '',
        totalSpend,
        totalCampaigns,
        avgPerCampaign,
        countries: Array.from(countries),
        agents: Array.from(agents),
        platforms: Array.from(platforms),
        destinations: Array.from(destinations),
        campaignDetails,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      };
    });
  };

  const fetchReports = useCallback(async (page = 1, limit = 25) => {
    try {
      setLoading(true);
      
      // All users use the same endpoint - filtering is handled server-side based on role
      const apiEndpoint = `/api/media-reports?page=${page}&limit=${limit}`;
      
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch media reports');
      }
      const data = await response.json();
      const fetchedReports = data.data?.reports || [];
      
      // Console log all data to verify it belongs to current user
      console.log('============ MEDIA REPORTS DATA ============');
      console.log('Current User:', user);
      console.log('Is Admin:', isAdmin());
      console.log('API Endpoint Used:', apiEndpoint);
      console.log('Total Reports Returned:', data.data?.pagination?.total || 0);
      console.log('Debug Info from API:', data.data?.debug);
      console.log('Full Reports Data:');
      fetchedReports.forEach((report: any, index: number) => {
        console.log(`\n--- Report ${index + 1} ---`);
        console.log('Report ID:', report.id);
        console.log('Date:', report.date);
        console.log('Branch:', report.branch?.name, '(ID:', report.branchId, ')');
        console.log('Media Buyer:', report.mediaBuyer?.name, '(ID:', report.mediaBuyerId, ')');
        console.log('Media Buyer Email:', report.mediaBuyer?.email);
        console.log('Created At:', report.createdAt);
        console.log('Countries & Campaigns:', report.mediaCountryData?.length || 0, 'countries');
      });
      console.log('============================================\n');
      
      setReports(fetchedReports);
      setFlattenedReports(flattenReports(fetchedReports));
      setPagination(prev => ({
        ...prev,
        total: data.data?.pagination?.total || 0,
        page,
        limit
      }));
    } catch (error) {
      console.error('Error fetching media reports:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Remove success parameter from URL if present
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'created') {
      const url = new URL(window.location.href);
      url.searchParams.delete('success');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    fetchReports(newPage, pagination.limit);
  }, [fetchReports, pagination.limit]);

  const handleLimitChange = useCallback((newLimit: number) => {
    fetchReports(1, newLimit);
  }, [fetchReports]);

  // Define columns for the data grid
  const baseColumns = [
    {
      key: 'formattedDate',
      header: 'Date',
      sortable: true,
      searchable: true,
      width: '120px',
      render: (value: string, row: FlattenedReport) => (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'branchName',
      header: 'Branch',
      sortable: true,
      searchable: true,
      width: '140px',
      render: (value: string, row: FlattenedReport) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-blue-600 dark:text-blue-400">{value}</span>
        </div>
      )
    },
    {
      key: 'countries',
      header: 'Target Countries',
      searchable: true,
      width: '180px',
      render: (value: string[]) => (
        <div className="text-sm">
          {value.slice(0, 2).map((country, index) => (
            <span key={index} className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs mr-1 mb-1">
              {country}
            </span>
          ))}
          {value.length > 2 && (
            <span className="text-xs text-gray-500">+{value.length - 2} more</span>
          )}
        </div>
      )
    },
    {
      key: 'agents',
      header: 'Agents',
      searchable: true,
      width: '160px',
      render: (value: string[]) => (
        <div className="text-sm">
          {value.slice(0, 3).join(', ')}
          {value.length > 3 && (
            <span className="text-xs text-gray-500 block">+{value.length - 3} more</span>
          )}
        </div>
      )
    },
    {
      key: 'totalCampaigns',
      header: 'Campaigns',
      sortable: true,
      width: '100px',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-400" />
          <span className="font-semibold">{value}</span>
        </div>
      )
    },
    {
      key: 'totalSpend',
      header: 'Total Spend',
      sortable: true,
      width: '130px',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-600 dark:text-green-400">
            ${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      )
    },
    {
      key: 'avgPerCampaign',
      header: 'Avg/Campaign',
      sortable: true,
      width: '120px',
      render: (value: number) => (
        <span className="font-medium">
          ${Math.round(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: '140px',
      render: (value: string) => (
        <div className="text-xs text-gray-500">
          <div>{new Date(value).toLocaleDateString()}</div>
          <div>{new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      )
    }
  ];

  // Media Buyer column (only for admins)
  const mediaBuyerColumn = {
    key: 'mediaBuyerName',
    header: 'Media Buyer',
    sortable: true,
    searchable: true,
    width: '160px',
    render: (value: string, row: FlattenedReport) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-gray-400" />
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">{row.mediaBuyerEmail}</div>
        </div>
      </div>
    )
  };

  // Combine columns based on user role
  const columns = isAdmin() 
    ? [
        baseColumns[0], // Date
        baseColumns[1], // Branch
        mediaBuyerColumn, // Media Buyer (admin only)
        ...baseColumns.slice(2) // Rest of columns
      ]
    : baseColumns; // Media buyers see all columns except Media Buyer

  // Define filters for the data grid
  const baseFilters = [
    {
      key: 'date',
      label: 'Date Range',
      type: 'daterange' as const,
      placeholder: 'Select date range'
    },
    {
      key: 'branchName',
      label: 'Branch',
      type: 'select' as const,
      options: BRANCHES.map(branch => ({ value: branch.name, label: branch.name })),
      placeholder: 'All branches'
    },
    {
      key: 'platforms',
      label: 'Platform',
      type: 'select' as const,
      options: ADVERTISING_PLATFORMS.map(platform => ({ value: platform.name, label: platform.name })),
      placeholder: 'All platforms'
    }
  ];

  // Media Buyer filter (only for admins)
  const mediaBuyerFilter = {
    key: 'mediaBuyerName',
    label: 'Media Buyer',
    type: 'text' as const,
    placeholder: 'Search by media buyer'
  };

  // Combine filters based on user role
  const filters = isAdmin()
    ? [
        baseFilters[0], // Date Range
        baseFilters[1], // Branch
        mediaBuyerFilter, // Media Buyer (admin only)
        baseFilters[2] // Platform
      ]
    : baseFilters; // Media buyers see filters without Media Buyer filter

  // Render expanded row details
  const renderExpandedRow = (row: FlattenedReport) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Target Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {row.countries.map((country, index) => (
                <div key={index} className="text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  {country}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Platforms Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {row.platforms.map((platform, index) => (
                <div key={index} className="text-sm bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                  {platform}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {row.destinations.map((destination, index) => (
                <div key={index} className="text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  {destination}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Campaign #</th>
                  <th className="text-left py-2 px-3">Target Country</th>
                  <th className="text-left py-2 px-3">Agent</th>
                  <th className="text-left py-2 px-3">Destination</th>
                  <th className="text-left py-2 px-3">Platform</th>
                  <th className="text-right py-2 px-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {row.campaignDetails
                  .sort((a, b) => a.campaignNumber - b.campaignNumber)
                  .map((campaign, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3 font-medium">#{campaign.campaignNumber}</td>
                      <td className="py-2 px-3">{campaign.targetCountry}</td>
                      <td className="py-2 px-3">{campaign.agent}</td>
                      <td className="py-2 px-3">{campaign.destination}</td>
                      <td className="py-2 px-3">
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                          {campaign.platform}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        ${campaign.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading && flattenedReports.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              Media Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track advertising campaigns and media spend across all platforms and countries
            </p>
          </div>
          <Button asChild>
            <Link href="/media/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Media Report
            </Link>
          </Button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Summary Stats */}
        {flattenedReports.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.total}</div>
                <p className="text-xs text-muted-foreground">Media reports submitted</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${flattenedReports.reduce((sum, report) => sum + report.totalSpend, 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">Total advertising spend</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {flattenedReports.reduce((sum, report) => sum + report.totalCampaigns, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Active campaigns</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg per Campaign</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(() => {
                    const totalSpend = flattenedReports.reduce((sum, report) => sum + report.totalSpend, 0);
                    const totalCampaigns = flattenedReports.reduce((sum, report) => sum + report.totalCampaigns, 0);
                    const avg = totalCampaigns > 0 ? totalSpend / totalCampaigns : 0;
                    return Math.round(avg).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                  })()}
                </div>
                <p className="text-xs text-muted-foreground">Average spend per campaign</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Grid */}
        <DataGrid
          data={flattenedReports}
          columns={columns}
          filters={filters}
          searchPlaceholder={isAdmin() 
            ? "Search reports by date, branch, buyer, country, agent..." 
            : "Search reports by date, branch, country, agent..."}          
          title="Media Reports Data"
          loading={loading}
          expandableRows={true}
          renderExpandedRow={renderExpandedRow}
          pagination={{
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            onPageChange: handlePageChange,
            onLimitChange: handleLimitChange
          }}
        />
      </div>
    </DashboardLayout>
  );
}