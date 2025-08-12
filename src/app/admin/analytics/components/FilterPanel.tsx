'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Collapsible } from '@/components/ui/collapsible';
import { MultiSelect } from '@/components/ui/multi-select';
import { ReportFilters } from '../page';
import { useMasterData } from '@/hooks/useMasterData';
import { MapPin, Users, Zap, Filter, RotateCcw, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface FilterPanelProps {
  filters: ReportFilters;
  onFilterChange: (filters: Partial<ReportFilters>) => void;
  onApplyFilters: () => void;
  onAutoApplyFilters?: () => void;
  loading: boolean;
}

interface FilterValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function FilterPanel({ filters, onFilterChange, onApplyFilters, onAutoApplyFilters, loading }: FilterPanelProps) {
  const {
    branches,
    salesAgents,
    targetCountries,
    destinationCountries,
    platforms,
    mediaBuyers,
    isLoading: loadingMasterData,
    isError: masterDataError
  } = useMasterData();
  const [autoApply, setAutoApply] = useState(false);
  const [validation, setValidation] = useState<FilterValidation>({ isValid: true, errors: [], warnings: [] });
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);


  const handleDateRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    const newDateRange = {
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    };
    handleFilterChange(newDateRange);
  }, []);

  const handleComparisonToggle = useCallback(() => {
    if (filters.compareWith) {
      handleFilterChange({ compareWith: undefined });
    } else {
      const thirtyDaysAgo = new Date(new Date(filters.dateRange.start).getTime() - 30 * 24 * 60 * 60 * 1000);
      const comparisonEnd = new Date(new Date(filters.dateRange.end).getTime() - 30 * 24 * 60 * 60 * 1000);
      
      handleFilterChange({
        compareWith: {
          start: thirtyDaysAgo.toISOString().split('T')[0],
          end: comparisonEnd.toISOString().split('T')[0]
        }
      });
    }
  }, []);

  const handleMultiSelectChange = useCallback((field: keyof ReportFilters, value: string) => {
    const currentValues = filters[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange({ [field]: newValues });
  }, []);

  const handleRangeChange = useCallback((field: 'spendRange' | 'dealRange', type: 'min' | 'max', value: number) => {
    handleFilterChange({
      [field]: {
        ...filters[field],
        [type]: value
      }
    });
  }, []);

  const clearAllFilters = () => {
    const clearedFilters = {
      targetCountries: [],
      destinationCountries: [],
      branches: [],
      mediaBuyers: [],
      salesAgents: [],
      platforms: [],
      qualityRatings: [],
      spendRange: { min: 0, max: 100000 },
      dealRange: { min: 0, max: 1000 },
      minROI: undefined,
      minConversionRate: undefined,
      compareWith: undefined
    };
    handleFilterChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.targetCountries.length > 0) count++;
    if (filters.destinationCountries.length > 0) count++;
    if (filters.branches.length > 0) count++;
    if (filters.mediaBuyers.length > 0) count++;
    if (filters.salesAgents.length > 0) count++;
    if (filters.platforms.length > 0) count++;
    if (filters.qualityRatings.length > 0) count++;
    if (filters.minROI !== undefined) count++;
    if (filters.minConversionRate !== undefined) count++;
    if (filters.compareWith) count++;
    return count;
  };

  const validateFilters = useCallback((currentFilters: ReportFilters): FilterValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Date validation
    const startDate = new Date(currentFilters.dateRange.start);
    const endDate = new Date(currentFilters.dateRange.end);
    
    if (startDate > endDate) {
      errors.push('Start date must be before end date');
    }
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    if (daysDiff > 365) {
      warnings.push('Date range spans more than a year, which may affect performance');
    }
    
    if (daysDiff > 90) {
      warnings.push('Large date ranges may take longer to process');
    }
    
    // Spend range validation
    if (currentFilters.spendRange.min < 0) {
      errors.push('Minimum spend cannot be negative');
    }
    
    if (currentFilters.spendRange.max < currentFilters.spendRange.min) {
      errors.push('Maximum spend must be greater than minimum spend');
    }
    
    if (currentFilters.spendRange.max > 100000) {
      warnings.push('Very high spend range selected - consider narrowing for better performance');
    }
    
    // Deal range validation
    if (currentFilters.dealRange.min < 0) {
      errors.push('Minimum deals cannot be negative');
    }
    
    if (currentFilters.dealRange.max < currentFilters.dealRange.min) {
      errors.push('Maximum deals must be greater than minimum deals');
    }
    
    // Performance thresholds validation
    if (currentFilters.minROI !== undefined && currentFilters.minROI < -100) {
      warnings.push('Very low ROI threshold may exclude most results');
    }
    
    if (currentFilters.minConversionRate !== undefined && currentFilters.minConversionRate > 50) {
      warnings.push('Very high conversion rate threshold may exclude most results');
    }
    
    // Filter combination warnings
    const totalFilters = (
      currentFilters.targetCountries.length +
      currentFilters.destinationCountries.length +
      currentFilters.branches.length +
      currentFilters.salesAgents.length +
      currentFilters.platforms.length +
      currentFilters.qualityRatings.length
    );
    
    if (totalFilters > 20) {
      warnings.push('Many filters selected - consider using fewer filters for cleaner results');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, []);
  
  const debouncedAutoApply = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const newTimer = setTimeout(() => {
      if (autoApply && validation.isValid) {
        console.log('Auto-apply executing...');
        if (onAutoApplyFilters) {
          onAutoApplyFilters();
        } else {
          onApplyFilters();
        }
      }
    }, 1500); // 1.5 second delay
    
    setDebounceTimer(newTimer);
  }, [autoApply, validation.isValid, onApplyFilters, onAutoApplyFilters, debounceTimer]);
  
  const handleMultiSelectChangeArray = useCallback((field: keyof ReportFilters, values: string[]) => {
    const newFilters = { [field]: values };
    onFilterChange(newFilters);
    
    // Validate and potentially auto-apply
    const updatedFilters = { ...filters, ...newFilters };
    const newValidation = validateFilters(updatedFilters);
    setValidation(newValidation);
    
    if (autoApply && newValidation.isValid) {
      debouncedAutoApply();
    }
  }, []);
  
  const handleFilterChange = useCallback((newFilters: Partial<ReportFilters>) => {
    onFilterChange(newFilters);
    
    // Validate and potentially auto-apply
    const updatedFilters = { ...filters, ...newFilters };
    const newValidation = validateFilters(updatedFilters);
    setValidation(newValidation);
    
    if (autoApply && newValidation.isValid) {
      debouncedAutoApply();
    }
  }, []);
  
  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);
  
  // Initial validation
  useEffect(() => {
    const initialValidation = validateFilters(filters);
    setValidation(initialValidation);
  }, [filters, validateFilters]);

  const presetFilters = [
    {
      name: 'Last 7 Days',
      action: () => {
        const end = new Date();
        const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        handleFilterChange({
          dateRange: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          },
          // Reset other filters to show all data in this range
          targetCountries: [],
          destinationCountries: [],
          branches: [],
          mediaBuyers: [],
          salesAgents: [],
          platforms: [],
          qualityRatings: [],
          minROI: undefined,
          minConversionRate: undefined
        });
      }
    },
    {
      name: 'Last 30 Days',
      action: () => {
        const end = new Date();
        const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        handleFilterChange({
          dateRange: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          },
          // Reset other filters to show all data in this range
          targetCountries: [],
          destinationCountries: [],
          branches: [],
          mediaBuyers: [],
          salesAgents: [],
          platforms: [],
          qualityRatings: [],
          minROI: undefined,
          minConversionRate: undefined
        });
      }
    },
    {
      name: 'High Performers',
      action: () => {
        // Set high performance thresholds without changing date range
        handleFilterChange({
          minROI: 40,
          minConversionRate: 10,
          qualityRatings: ['excellent', 'best_quality'],
          // Keep current date range and other filters
          dateRange: filters.dateRange
        });
      }
    },
    {
      name: 'All Data',
      action: () => {
        // Show maximum date range with no filters
        const end = new Date();
        const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000); // Last year
        handleFilterChange({
          dateRange: {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
          },
          targetCountries: [],
          destinationCountries: [],
          branches: [],
          mediaBuyers: [],
          salesAgents: [],
          platforms: [],
          qualityRatings: [],
          spendRange: { min: 0, max: 100000 },
          dealRange: { min: 0, max: 1000 },
          minROI: undefined,
          minConversionRate: undefined,
          compareWith: undefined
        });
      }
    }
  ];

  if (loadingMasterData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <div className="mt-2 text-sm text-gray-500">
              Loading filters...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (masterDataError) {
    return (
      <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-sm text-red-800 dark:text-red-200 mb-3">
              Failed to load filter data
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="border-red-300 text-red-800 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Filter Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Smart Filters</h2>
          </div>
          <div className="flex items-center space-x-2">
            {masterDataError && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="h-6 px-2 text-red-600 hover:text-red-800"
                title="Refresh filter data"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
            {getActiveFilterCount() > 0 && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                validation.isValid 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {validation.isValid ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-1" />
                )}
                {getActiveFilterCount()} active
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Validation Messages */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Card className={`border-2 ${
          validation.errors.length > 0 
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
            : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'
        }`}>
          <CardContent className="pt-4">
            {validation.errors.length > 0 && (
              <div className="mb-2">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <Label className="text-sm font-medium text-red-900 dark:text-red-100">
                    Validation Errors
                  </Label>
                </div>
                <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <Label className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Recommendations
                  </Label>
                </div>
                <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Templates Dropdown */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <Zap className="h-4 w-4 text-green-600" />
            <Label className="text-sm font-medium text-green-900 dark:text-green-100">Quick Filter</Label>
          </div>
          <Select
            value=""
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                const preset = presetFilters.find(p => p.name === value);
                if (preset) {
                  preset.action();
                }
                // Reset select to placeholder after action
                e.target.value = "";
              }
            }}
            placeholder="Select filter..."
          >
            {presetFilters.map((preset, index) => (
              <option key={index} value={preset.name}>
                {preset.name}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Date Range Filters */}
      <Collapsible
        title="Time Period"
        description="Select date ranges for analysis"
        defaultOpen={true}
        badge={filters.compareWith ? "Comparison" : undefined}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="comparison"
              checked={!!filters.compareWith}
              onChange={handleComparisonToggle}
              className="rounded"
            />
            <Label htmlFor="comparison" className="text-sm">
              Compare with previous period
            </Label>
          </div>

          {filters.compareWith && (
            <div className="space-y-2 pl-4 border-l-2 border-blue-200">
              <div className="space-y-2">
                <Label htmlFor="compareStart">Compare Start</Label>
                <Input
                  id="compareStart"
                  type="date"
                  value={filters.compareWith.start}
                  onChange={(e) => handleFilterChange({
                    compareWith: { ...filters.compareWith!, start: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compareEnd">Compare End</Label>
                <Input
                  id="compareEnd"
                  type="date"
                  value={filters.compareWith.end}
                  onChange={(e) => handleFilterChange({
                    compareWith: { ...filters.compareWith!, end: e.target.value }
                  })}
                />
              </div>
            </div>
          )}

        </div>
      </Collapsible>

      {/* Geographic Filters */}
      <Collapsible
        title="Geographic Scope"
        description="Filter by target and destination countries"
        badge={filters.targetCountries.length + filters.destinationCountries.length > 0 
          ? (filters.targetCountries.length + filters.destinationCountries.length) 
          : undefined}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <Label className="font-medium">Target Countries (Gulf)</Label>
            </div>
            <MultiSelect
              options={[
                { id: 'all', label: 'All Countries', description: 'Select all target countries' },
                ...targetCountries.map(country => ({
                  id: country.id,
                  label: `${country.name} (${country.code})`,
                  description: `Target market: ${country.name}`
                }))
              ]}
              selectedValues={filters.targetCountries}
              onChange={(values) => {
                if (values.includes('all')) {
                  const allCountryIds = targetCountries.map(c => c.id);
                  handleMultiSelectChangeArray('targetCountries', allCountryIds);
                } else {
                  handleMultiSelectChangeArray('targetCountries', values);
                }
              }}
              placeholder="Select target countries..."
              searchPlaceholder="Search countries..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <Label className="font-medium">Destination Countries</Label>
            </div>
            <MultiSelect
              options={[
                { id: 'all', label: 'All Destinations', description: 'Select all destination countries' },
                ...destinationCountries.map(country => ({
                  id: country.id,
                  label: country.name,
                  description: `Travel destination: ${country.name}`
                }))
              ]}
              selectedValues={filters.destinationCountries}
              onChange={(values) => {
                if (values.includes('all')) {
                  const allDestinationIds = destinationCountries.map(c => c.id);
                  handleMultiSelectChangeArray('destinationCountries', allDestinationIds);
                } else {
                  handleMultiSelectChangeArray('destinationCountries', values);
                }
              }}
              placeholder="Select destinations..."
              searchPlaceholder="Search destinations..."
            />
          </div>
        </div>
      </Collapsible>

      {/* Team Filters */}
      <Collapsible
        title="Team & Organization"
        description="Filter by branches, agents, and media buyers"
        badge={filters.branches.length + filters.salesAgents.length + filters.mediaBuyers.length > 0 
          ? (filters.branches.length + filters.salesAgents.length + filters.mediaBuyers.length) 
          : undefined}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-600" />
              <Label className="font-medium">Branches</Label>
            </div>
            <MultiSelect
              options={[
                { id: 'all', label: 'All Branches', description: 'Select all branches' },
                ...branches.map(branch => ({
                  id: branch.id,
                  label: branch.name,
                  description: `Branch code: ${branch.code}`
                }))
              ]}
              selectedValues={filters.branches}
              onChange={(values) => {
                if (values.includes('all')) {
                  const allBranchIds = branches.map(b => b.id);
                  handleMultiSelectChangeArray('branches', allBranchIds);
                } else {
                  handleMultiSelectChangeArray('branches', values);
                }
              }}
              placeholder="Select branches..."
              searchPlaceholder="Search branches..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <Label className="font-medium">Sales Agents</Label>
            </div>
            <MultiSelect
              options={[
                { id: 'all', label: 'All Agents', description: 'Select all sales agents' },
                ...salesAgents.map(agent => ({
                  id: agent.id,
                  label: `Agent ${agent.agent_number}`,
                  description: `${agent.name || 'Unnamed'} - Branch: ${agent.branch_id}`
                }))
              ]}
              selectedValues={filters.salesAgents}
              onChange={(values) => {
                if (values.includes('all')) {
                  const allAgentIds = salesAgents.map(a => a.id);
                  handleMultiSelectChangeArray('salesAgents', allAgentIds);
                } else {
                  handleMultiSelectChangeArray('salesAgents', values);
                }
              }}
              placeholder="Select agents..."
              searchPlaceholder="Search agents..."
              maxHeight="max-h-64"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-600" />
              <Label className="font-medium">Media Buyers</Label>
            </div>
            <MultiSelect
              options={[
                { id: 'all', label: 'All Media Buyers', description: 'Select all media buyers' },
                ...mediaBuyers.map(buyer => ({
                  id: buyer.id,
                  label: buyer.name,
                  description: buyer.email
                }))
              ]}
              selectedValues={filters.mediaBuyers}
              onChange={(values) => {
                if (values.includes('all')) {
                  const allBuyerIds = mediaBuyers.map(b => b.id);
                  handleMultiSelectChangeArray('mediaBuyers', allBuyerIds);
                } else {
                  handleMultiSelectChangeArray('mediaBuyers', values);
                }
              }}
              placeholder="Select media buyers..."
              searchPlaceholder="Search by name or email..."
            />
          </div>
        </div>
      </Collapsible>

      {/* Platform & Performance Filters */}
      <Collapsible
        title="Platforms & Performance"
        description="Filter by advertising platforms and performance metrics"
        badge={filters.platforms.length + filters.qualityRatings.length > 0 
          ? (filters.platforms.length + filters.qualityRatings.length) 
          : undefined}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <Label className="font-medium">Advertising Platforms</Label>
            </div>
            <MultiSelect
              options={[
                { id: 'all', label: 'All Platforms', description: 'Select all advertising platforms' },
                ...platforms.map(platform => ({
                  id: platform.id,
                  label: platform.name,
                  description: `Advertising platform: ${platform.name}`
                }))
              ]}
              selectedValues={filters.platforms}
              onChange={(values) => {
                if (values.includes('all')) {
                  const allPlatformIds = platforms.map(p => p.id);
                  handleMultiSelectChangeArray('platforms', allPlatformIds);
                } else {
                  handleMultiSelectChangeArray('platforms', values);
                }
              }}
              placeholder="Select platforms..."
              searchPlaceholder="Search platforms..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-yellow-600" />
              <Label className="font-medium">Quality Ratings</Label>
            </div>
            <MultiSelect
              options={[
                { id: 'all', label: 'All Quality Levels', description: 'Select all quality ratings' },
                { id: 'best_quality', label: 'Best Quality', description: '⭐⭐⭐⭐⭐ Exceptional performance' },
                { id: 'excellent', label: 'Excellent', description: '⭐⭐⭐⭐ Above average performance' },
                { id: 'good', label: 'Good', description: '⭐⭐⭐ Average performance' },
                { id: 'standard', label: 'Standard', description: '⭐⭐ Below average performance' },
                { id: 'below_standard', label: 'Below Standard', description: '⭐ Poor performance' }
              ]}
              selectedValues={filters.qualityRatings}
              onChange={(values) => {
                if (values.includes('all')) {
                  const allQualityRatings = ['best_quality', 'excellent', 'good', 'standard', 'below_standard'];
                  handleMultiSelectChangeArray('qualityRatings', allQualityRatings);
                } else {
                  handleMultiSelectChangeArray('qualityRatings', values);
                }
              }}
              placeholder="Select quality levels..."
              searchPlaceholder="Search quality ratings..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Spend Range ($)</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.spendRange.min}
                  onChange={(e) => handleRangeChange('spendRange', 'min', Number(e.target.value))}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.spendRange.max}
                  onChange={(e) => handleRangeChange('spendRange', 'max', Number(e.target.value))}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Deal Count Range</Label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.dealRange.min}
                  onChange={(e) => handleRangeChange('dealRange', 'min', Number(e.target.value))}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.dealRange.max}
                  onChange={(e) => handleRangeChange('dealRange', 'max', Number(e.target.value))}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Minimum ROI (%)</Label>
              <Input
                type="number"
                placeholder="e.g., 50"
                value={filters.minROI || ''}
                onChange={(e) => handleFilterChange({ 
                  minROI: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Min Conversion (%)</Label>
              <Input
                type="number"
                placeholder="e.g., 5"
                value={filters.minConversionRate || ''}
                onChange={(e) => handleFilterChange({ 
                  minConversionRate: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </Collapsible>

      {/* Enhanced Action Buttons */}
      <div className="space-y-3 pt-2">
        <Button 
          onClick={onApplyFilters} 
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium" 
          disabled={loading || !validation.isValid}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Generating Report...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Apply Filters & Generate Report</span>
            </div>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={clearAllFilters}
          className="w-full h-10 border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All Filters
        </Button>
      </div>

      {/* Enhanced Active Filters Summary */}
      {getActiveFilterCount() > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <Label className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Active Filters ({getActiveFilterCount()})
                </Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs h-6 px-2 text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
              >
                Clear all
              </Button>
            </div>
            <div className="text-xs space-y-1 text-blue-800 dark:text-blue-200">
              {filters.targetCountries.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Target Countries:</span>
                  <span>{filters.targetCountries.length} selected</span>
                </div>
              )}
              {filters.destinationCountries.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Destinations:</span>
                  <span>{filters.destinationCountries.length} selected</span>
                </div>
              )}
              {filters.branches.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Branches:</span>
                  <span>{filters.branches.length} selected</span>
                </div>
              )}
              {filters.platforms.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Platforms:</span>
                  <span>{filters.platforms.length} selected</span>
                </div>
              )}
              {filters.salesAgents.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Agents:</span>
                  <span>{filters.salesAgents.length} selected</span>
                </div>
              )}
              {filters.mediaBuyers.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Media Buyers:</span>
                  <span>{filters.mediaBuyers.length} selected</span>
                </div>
              )}
              {filters.qualityRatings.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Quality Ratings:</span>
                  <span>{filters.qualityRatings.length} selected</span>
                </div>
              )}
              {filters.minROI !== undefined && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Min ROI:</span>
                  <span>{filters.minROI}%</span>
                </div>
              )}
              {filters.minConversionRate !== undefined && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Min Conversion:</span>
                  <span>{filters.minConversionRate}%</span>
                </div>
              )}
              {filters.compareWith && (
                <div className="flex items-center space-x-1">
                  <span className="font-medium">Period Comparison:</span>
                  <span>Active</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}