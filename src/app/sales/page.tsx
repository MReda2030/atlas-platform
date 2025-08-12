'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DataGrid from '@/components/ui/data-grid';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useAuth } from '@/contexts/AuthContext';
import { CalendarDays, Building2, User, TrendingUp, Target, Plus, Users, MessageSquare, Trophy } from 'lucide-react';
import { BRANCHES, TARGET_COUNTRIES, QUALITY_RATINGS, DESTINATION_COUNTRIES } from '@/lib/constants';

interface SalesReport {
  id: string;
  date: string;
  branchId: string;
  branch: {
    name: string;
    code: string;
  };
  salesAgent: {
    agentNumber: string;
    name?: string;
  };
  mediaBuyer: {
    name: string;
    email: string;
  };
  salesCountryData: Array<{
    targetCountry: {
      name: string;
      code: string;
    };
    dealsClosed: number;
    whatsappMessages: number;
    qualityRating: string;
    dealDestinations: Array<{
      destinationCountry: {
        name: string;
        code: string;
      };
      dealNumber: number;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface FlattenedSalesReport {
  id: string;
  date: string;
  formattedDate: string;
  branchName: string;
  branchCode: string;
  salesAgentNumber: string;
  salesAgentName?: string;
  mediaBuyerName: string;
  mediaBuyerEmail: string;
  totalDeals: number;
  totalMessages: number;
  conversionRate: number;
  countries: string[];
  destinations: string[];
  qualityRatings: string[];
  avgQualityScore: number;
  countryDetails: Array<{
    targetCountry: string;
    dealsClosed: number;
    whatsappMessages: number;
    conversionRate: number;
    qualityRating: string;
    qualityLabel: string;
    destinations: Array<{
      destination: string;
      dealNumber: number;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function SalesReportsPage() {
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState<SalesReport[]>([]);
  const [flattenedReports, setFlattenedReports] = useState<FlattenedSalesReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0
  });
  const searchParams = useSearchParams();

  const getQualityRatingLabel = (rating: string) => {
    const qualityRating = QUALITY_RATINGS.find(r => r.value === rating);
    return qualityRating?.label || rating;
  };

  const getQualityScore = (rating: string): number => {
    const scores: Record<string, number> = {
      'below_standard': 1,
      'standard': 2,
      'good': 3,
      'excellent': 4,
      'best_quality': 5
    };
    return scores[rating] || 2;
  };

  const flattenReports = (reports: SalesReport[]): FlattenedSalesReport[] => {
    return reports.map(report => {
      let totalDeals = 0;
      let totalMessages = 0;
      const countries = new Set<string>();
      const destinations = new Set<string>();
      const qualityRatings = new Set<string>();
      const countryDetails: Array<{
        targetCountry: string;
        dealsClosed: number;
        whatsappMessages: number;
        conversionRate: number;
        qualityRating: string;
        qualityLabel: string;
        destinations: Array<{
          destination: string;
          dealNumber: number;
        }>;
      }> = [];

      let totalQualityScore = 0;

      (report.salesCountryData || []).forEach(countryData => {
        totalDeals += countryData.dealsClosed;
        totalMessages += countryData.whatsappMessages;
        countries.add(countryData.targetCountry?.name || 'Unknown Country');
        qualityRatings.add(getQualityRatingLabel(countryData.qualityRating || 'standard'));
        totalQualityScore += getQualityScore(countryData.qualityRating || 'standard');

        const countryConversionRate = countryData.whatsappMessages > 0 
          ? (countryData.dealsClosed / countryData.whatsappMessages) * 100 
          : 0;

        const countryDestinations = (countryData.dealDestinations || []).map(deal => ({
          destination: deal.destinationCountry?.name || 'Unknown Destination',
          dealNumber: deal.dealNumber || 0
        }));

        countryDestinations.forEach(dest => destinations.add(dest.destination));

        countryDetails.push({
          targetCountry: countryData.targetCountry?.name || 'Unknown Country',
          dealsClosed: countryData.dealsClosed || 0,
          whatsappMessages: countryData.whatsappMessages || 0,
          conversionRate: countryConversionRate,
          qualityRating: countryData.qualityRating || 'standard',
          qualityLabel: getQualityRatingLabel(countryData.qualityRating || 'standard'),
          destinations: countryDestinations
        });
      });

      const conversionRate = totalMessages > 0 ? (totalDeals / totalMessages) * 100 : 0;
      const countryDataLength = report.salesCountryData?.length || 0;
      const avgQualityScore = countryDataLength > 0 
        ? totalQualityScore / countryDataLength 
        : 0;

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
        salesAgentNumber: report.salesAgent?.agentNumber || 'Unknown',
        salesAgentName: report.salesAgent?.name,
        mediaBuyerName: report.mediaBuyer?.name || 'Unknown Media Buyer',
        mediaBuyerEmail: report.mediaBuyer?.email || '',
        totalDeals,
        totalMessages,
        conversionRate,
        countries: Array.from(countries),
        destinations: Array.from(destinations),
        qualityRatings: Array.from(qualityRatings),
        avgQualityScore,
        countryDetails,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      };
    });
  };

  const fetchReports = useCallback(async (page = 1, limit = 25) => {
    try {
      setLoading(true);
      
      // Use different API endpoint based on user role
      const apiEndpoint = isAdmin() 
        ? `/api/sales-reports?page=${page}&limit=${limit}` // Admin sees all data
        : `/api/sales-reports/media-buyer?page=${page}&limit=${limit}`; // Media buyer sees only own data
      
      const response = await fetch(apiEndpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch sales reports');
      }
      const data = await response.json();
      const fetchedReports = data.reports || [];
      
      // Console log all data to verify it belongs to current user
      console.log('============ SALES REPORTS DATA ============');
      console.log('Current User:', user);
      console.log('Is Admin:', isAdmin());
      console.log('API Endpoint Used:', apiEndpoint);
      console.log('Total Reports Returned:', data.pagination?.total || 0);
      console.log('Debug Info from API:', data.debug);
      console.log('Full Reports Data:');
      fetchedReports.forEach((report: any, index: number) => {
        console.log(`\n--- Report ${index + 1} ---`);
        console.log('Report ID:', report.id);
        console.log('Date:', report.date);
        console.log('Branch:', report.branch?.name, '(ID:', report.branchId, ')');
        console.log('Sales Agent:', report.salesAgent?.name, '(Agent #', report.salesAgent?.agentNumber, ', ID:', report.salesAgentId, ')');
        console.log('Media Buyer:', report.mediaBuyer?.name, '(ID:', report.mediaBuyerId, ')');
        console.log('Media Buyer Email:', report.mediaBuyer?.email);
        console.log('Created At:', report.createdAt);
        console.log('Countries & Deals:', report.salesCountryData?.length || 0, 'countries');
      });
      console.log('============================================\n');
      
      setReports(fetchedReports);
      setFlattenedReports(flattenReports(fetchedReports));
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        page,
        limit
      }));
    } catch (error) {
      console.error('Error fetching sales reports:', error);
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
      render: (value: string, row: FlattenedSalesReport) => (
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
      render: (value: string, row: FlattenedSalesReport) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-blue-600 dark:text-blue-400">{value}</span>
        </div>
      )
    },
    {
      key: 'salesAgentNumber',
      header: 'Sales Agent',
      sortable: true,
      searchable: true,
      width: '140px',
      render: (value: string, row: FlattenedSalesReport) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <div>
            <div className="font-medium">Agent {value}</div>
            {row.salesAgentName && (
              <div className="text-xs text-gray-500">{row.salesAgentName}</div>
            )}
          </div>
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
            <span key={index} className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs mr-1 mb-1">
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
      key: 'totalDeals',
      header: 'Deals',
      sortable: true,
      width: '80px',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-green-600 dark:text-green-400">{value}</span>
        </div>
      )
    },
    {
      key: 'totalMessages',
      header: 'Messages',
      sortable: true,
      width: '100px',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          <span className="font-semibold">{value}</span>
        </div>
      )
    },
    {
      key: 'conversionRate',
      header: 'Conversion',
      sortable: true,
      width: '110px',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-600" />
          <span className={`font-semibold ${value >= 20 ? 'text-green-600' : value >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
            {value.toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      key: 'avgQualityScore',
      header: 'Quality',
      sortable: true,
      width: '100px',
      render: (value: number, row: FlattenedSalesReport) => {
        const getQualityColor = (score: number) => {
          if (score >= 4.5) return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
          if (score >= 3.5) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
          if (score >= 2.5) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
          if (score >= 1.5) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
          return 'text-red-600 bg-red-100 dark:bg-red-900/30';
        };
        
        return (
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gray-400" />
            <span className={`px-2 py-1 rounded text-xs font-semibold ${getQualityColor(value)}`}>
              {value.toFixed(1)}
            </span>
          </div>
        );
      }
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
    render: (value: string, row: FlattenedSalesReport) => (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-gray-400" />
        <div>
          <div className="font-medium text-sm">{value}</div>
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
        baseColumns[2], // Sales Agent
        mediaBuyerColumn, // Media Buyer (admin only)
        ...baseColumns.slice(3) // Rest of columns
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
      key: 'salesAgentNumber',
      label: 'Sales Agent',
      type: 'text' as const,
      placeholder: 'Search by agent number'
    },
    {
      key: 'avgQualityScore',
      label: 'Min Quality Score',
      type: 'select' as const,
      options: [
        { value: '4', label: '4+ (Excellent)' },
        { value: '3', label: '3+ (Good)' },
        { value: '2', label: '2+ (Standard)' },
        { value: '1', label: '1+ (Any)' }
      ],
      placeholder: 'Any quality'
    }
  ];

  // Use baseFilters as filters (no Media Buyer filter needed since it's not in baseFilters)
  const filters = baseFilters;

  // Render expanded row details
  const renderExpandedRow = (row: FlattenedSalesReport) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Target Countries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {row.countries.map((country, index) => (
                <div key={index} className="text-sm bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  {country}
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
                <div key={index} className="text-sm bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  {destination}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quality Ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {row.qualityRatings.map((rating, index) => (
                <div key={index} className="text-sm bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded">
                  {rating}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Country Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Country</th>
                  <th className="text-center py-2 px-3">Deals</th>
                  <th className="text-center py-2 px-3">Messages</th>
                  <th className="text-center py-2 px-3">Conversion</th>
                  <th className="text-center py-2 px-3">Quality</th>
                  <th className="text-left py-2 px-3">Destinations</th>
                </tr>
              </thead>
              <tbody>
                {row.countryDetails.map((country, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 px-3 font-medium">{country.targetCountry}</td>
                    <td className="py-2 px-3 text-center">
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs font-semibold">
                        {country.dealsClosed}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">{country.whatsappMessages}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-semibold ${country.conversionRate >= 20 ? 'text-green-600' : country.conversionRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {country.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs">
                        {country.qualityLabel}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="space-y-1">
                        {country.destinations.map((dest, destIndex) => (
                          <div key={destIndex} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            Deal #{dest.dealNumber}: {dest.destination}
                          </div>
                        ))}
                      </div>
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
              Sales Reports
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track sales performance, deals closed, and agent quality ratings across all markets
            </p>
          </div>
          <Button asChild>
            <Link href="/sales/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Sales Report
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
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.total}</div>
                <p className="text-xs text-muted-foreground">Sales reports submitted</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {flattenedReports.reduce((sum, report) => sum + report.totalDeals, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Deals closed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {flattenedReports.reduce((sum, report) => sum + report.totalMessages, 0)}
                </div>
                <p className="text-xs text-muted-foreground">WhatsApp messages sent</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(() => {
                    const totalDeals = flattenedReports.reduce((sum, report) => sum + report.totalDeals, 0);
                    const totalMessages = flattenedReports.reduce((sum, report) => sum + report.totalMessages, 0);
                    const avgConversion = totalMessages > 0 ? (totalDeals / totalMessages) * 100 : 0;
                    return avgConversion.toFixed(1);
                  })()}%
                </div>
                <p className="text-xs text-muted-foreground">Average conversion rate</p>
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
            ? "Search reports by date, branch, buyer, agent, country..." 
            : "Search reports by date, branch, agent, country..."}
          title="Sales Reports Data"
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