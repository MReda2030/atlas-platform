'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReportData, ReportFilters } from '../page';

interface ExportOptionsProps {
  reportData: ReportData | null;
  filters: ReportFilters;
  reportType: string;
}

export function ExportOptions({ reportData, filters, reportType }: ExportOptionsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');

  const handleExport = async (format: 'pdf' | 'excel' | 'csv', exportAll: boolean = false) => {
    if (!reportData && !exportAll) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    setIsExporting(true);
    setExportFormat(format);

    try {
      const exportFilters = exportAll ? {
        ...filters,
        // Remove all filters to export everything
        targetCountries: [],
        destinationCountries: [],
        branches: [],
        mediaBuyers: [],
        salesAgents: [],
        platforms: [],
        qualityRatings: [],
        minROI: undefined,
        minConversionRate: undefined,
        // Extend date range to include all data
        dateRange: {
          start: new Date(new Date().getTime() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 years ago
          end: new Date().toISOString().split('T')[0]
        }
      } : filters;
      
      const response = await fetch('/api/admin/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportData: exportAll ? null : reportData, // Let backend generate fresh data for "export all"
          filters: exportFilters,
          reportType,
          format,
          exportAll
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const fileName = exportAll 
        ? `atlas-analytics-${reportType}-ALL-DATA-${new Date().toISOString().split('T')[0]}.${format}`
        : `atlas-analytics-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Export error:', error);
      const exportType = exportAll ? 'export all data' : 'export report';
      alert(`Failed to ${exportType}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleExportAll = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!confirm(`Export ALL data (no filters) for ${reportType} as ${format.toUpperCase()}? This may take longer and generate a large file.`)) {
      return;
    }
    await handleExport(format, true);
  };

  const handleScheduleReport = async () => {
    try {
      const response = await fetch('/api/admin/analytics/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          filters,
          frequency: 'weekly', // Could be made configurable
          recipients: ['admin@atlas.com'] // Could be made configurable
        })
      });

      if (response.ok) {
        alert('Report scheduled successfully! You will receive weekly updates.');
      } else {
        throw new Error('Failed to schedule report');
      }
    } catch (error) {
      console.error('Scheduling error:', error);
      alert('Failed to schedule report. Please try again.');
    }
  };

  const getExportSummary = () => {
    if (!reportData) return 'No data available';
    
    const { overview, agentPerformance } = reportData;
    return `${agentPerformance.length} agents • $${overview.totalSpend.toLocaleString()} spend • ${overview.totalDeals} deals • ${overview.roi.toFixed(1)}% ROI`;
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Export Filtered Data Buttons */}
      <div className="flex space-x-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
          className="flex items-center space-x-1"
          title="Export current filtered data"
        >
          {isExporting && exportFormat === 'pdf' ? (
            <div className="animate-spin h-3 w-3 border border-gray-300 rounded-full border-t-blue-600"></div>
          ) : (
            <span>📄</span>
          )}
          <span className="hidden sm:inline">PDF</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('excel')}
          disabled={isExporting}
          className="flex items-center space-x-1"
          title="Export current filtered data"
        >
          {isExporting && exportFormat === 'excel' ? (
            <div className="animate-spin h-3 w-3 border border-gray-300 rounded-full border-t-blue-600"></div>
          ) : (
            <span>📊</span>
          )}
          <span className="hidden sm:inline">Excel</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="flex items-center space-x-1"
          title="Export current filtered data"
        >
          {isExporting && exportFormat === 'csv' ? (
            <div className="animate-spin h-3 w-3 border border-gray-300 rounded-full border-t-blue-600"></div>
          ) : (
            <span>📋</span>
          )}
          <span className="hidden sm:inline">CSV</span>
        </Button>
      </div>
      
      {/* Export All Data Dropdown */}
      <div className="relative">
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleExportAll(e.target.value as 'pdf' | 'excel' | 'csv');
              e.target.value = ''; // Reset selection
            }
          }}
          disabled={isExporting}
          className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Export ALL data (no filters)"
        >
          <option value="">🌐 Export All</option>
          <option value="pdf">All → PDF</option>
          <option value="excel">All → Excel</option>
          <option value="csv">All → CSV</option>
        </select>
      </div>

      {/* Schedule Report Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleScheduleReport}
        disabled={!reportData}
        className="flex items-center space-x-1"
      >
        <span>📧</span>
        <span className="hidden sm:inline">Schedule</span>
      </Button>

      {/* Export Summary */}
      <div className="hidden lg:block">
        <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">
          {reportData ? getExportSummary() : 'Generate report to export filtered data'}
        </div>
      </div>
    </div>
  );
}

// Export API placeholder component for future implementation
export function ExportPreview({ reportData, format }: { reportData: ReportData; format: 'pdf' | 'excel' | 'csv' }) {
  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Export Preview - {format.toUpperCase()}</h3>
          <p className="text-gray-600">
            This report will include:
          </p>
          <ul className="text-sm text-left mt-4 space-y-1">
            <li>• Executive summary with key metrics</li>
            <li>• Agent performance analysis table</li>
            <li>• ROI calculations and trends</li>
            <li>• Platform and country breakdowns</li>
            <li>• Recommendations and insights</li>
            <li>• Filters and methodology notes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}