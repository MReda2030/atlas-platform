'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ReportFilters } from '../page';
import { useMasterData } from '@/hooks/useMasterData';
import { Calendar, MapPin, Users, Zap, Filter, RotateCcw, RefreshCw } from 'lucide-react';

interface FilterPanelProps {
  filters: ReportFilters;
  onFilterChange: (filters: Partial<ReportFilters>) => void;
  onApplyFilters: () => void;
  onAutoApplyFilters?: () => void;
  loading: boolean;
}

// Memoized multi-select component
const MemoizedMultiSelect = memo(function MemoizedMultiSelect({ 
  options, 
  selectedValues, 
  onChange, 
  placeholder,
  disabled 
}: {
  options: Array<{ value: string; label: string }>;
  selectedValues: string[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                isSelected 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {selectedValues.length > 0 && (
        <div className="text-xs text-gray-500">
          {selectedValues.length} selected
        </div>
      )}
    </div>
  );
});

export const FilterPanel = memo(function FilterPanel({ 
  filters, 
  onFilterChange, 
  onApplyFilters, 
  onAutoApplyFilters, 
  loading 
}: FilterPanelProps) {
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

  // Memoized options to prevent unnecessary re-renders
  const branchOptions = useMemo(() => 
    branches.map(branch => ({ value: branch.id, label: branch.name })),
    [branches]
  );

  const agentOptions = useMemo(() =>
    salesAgents.map(agent => ({ 
      value: agent.id, 
      label: `Agent ${agent.agent_number}${agent.name ? ` - ${agent.name}` : ''}` 
    })),
    [salesAgents]
  );

  const targetCountryOptions = useMemo(() =>
    targetCountries.map(country => ({ value: country.id, label: country.name })),
    [targetCountries]
  );

  const destinationCountryOptions = useMemo(() =>
    destinationCountries.map(country => ({ value: country.id, label: country.name })),
    [destinationCountries]
  );

  const platformOptions = useMemo(() =>
    platforms.map(platform => ({ value: platform.id, label: platform.name })),
    [platforms]
  );

  const mediaBuyerOptions = useMemo(() =>
    mediaBuyers.map(buyer => ({ value: buyer.id, label: buyer.name })),
    [mediaBuyers]
  );

  const qualityOptions = useMemo(() => [
    { value: 'below_standard', label: 'Below Standard' },
    { value: 'standard', label: 'Standard' },
    { value: 'good', label: 'Good' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'best_quality', label: 'Best Quality' }
  ], []);

  // Optimized filter change handler with debouncing
  const handleFilterChange = useCallback((newFilters: Partial<ReportFilters>) => {
    onFilterChange(newFilters);
    
    if (autoApply && onAutoApplyFilters) {
      // Debounce auto-apply to prevent excessive API calls
      const timer = setTimeout(() => {
        onAutoApplyFilters();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [onFilterChange, autoApply, onAutoApplyFilters]);

  const handleDateRangeChange = useCallback((field: 'start' | 'end', value: string) => {
    handleFilterChange({
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  }, [filters.dateRange, handleFilterChange]);

  const handleMultiSelectChange = useCallback((field: keyof ReportFilters, value: string) => {
    const currentValues = filters[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    handleFilterChange({ [field]: newValues });
  }, [filters, handleFilterChange]);

  const handleRangeChange = useCallback((field: 'spendRange' | 'dealRange', type: 'min' | 'max', value: number) => {
    handleFilterChange({
      [field]: {
        ...filters[field],
        [type]: value
      }
    });
  }, [filters, handleFilterChange]);

  const clearAllFilters = useCallback(() => {
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
  }, [handleFilterChange]);

  // Memoized active filter count
  const activeFilterCount = useMemo(() => {
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
  }, [filters]);

  if (masterDataError) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Failed to load filter options</p>
            <Button variant="outline" size="sm" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Smart Filters
          {activeFilterCount > 0 && (
            <span className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {loadingMasterData ? 'Loading filter options...' : 'Refine your analysis parameters'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Label className="font-medium">Date Range</Label>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor="start-date" className="text-xs text-gray-600">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-gray-600">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Target Countries */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <Label className="font-medium">Target Countries</Label>
          </div>
          <MemoizedMultiSelect
            options={targetCountryOptions}
            selectedValues={filters.targetCountries}
            onChange={(value) => handleMultiSelectChange('targetCountries', value)}
            placeholder="Select target countries"
            disabled={loadingMasterData}
          />
        </div>

        {/* Destination Countries */}
        <div className="space-y-3">
          <Label className="font-medium">Destination Countries</Label>
          <MemoizedMultiSelect
            options={destinationCountryOptions}
            selectedValues={filters.destinationCountries}
            onChange={(value) => handleMultiSelectChange('destinationCountries', value)}
            placeholder="Select destinations"
            disabled={loadingMasterData}
          />
        </div>

        {/* Branches */}
        <div className="space-y-3">
          <Label className="font-medium">Branches</Label>
          <MemoizedMultiSelect
            options={branchOptions}
            selectedValues={filters.branches}
            onChange={(value) => handleMultiSelectChange('branches', value)}
            placeholder="Select branches"
            disabled={loadingMasterData}
          />
        </div>

        {/* Sales Agents */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <Label className="font-medium">Sales Agents</Label>
          </div>
          <MemoizedMultiSelect
            options={agentOptions}
            selectedValues={filters.salesAgents}
            onChange={(value) => handleMultiSelectChange('salesAgents', value)}
            placeholder="Select agents"
            disabled={loadingMasterData}
          />
        </div>

        {/* Platforms */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <Label className="font-medium">Platforms</Label>
          </div>
          <MemoizedMultiSelect
            options={platformOptions}
            selectedValues={filters.platforms}
            onChange={(value) => handleMultiSelectChange('platforms', value)}
            placeholder="Select platforms"
            disabled={loadingMasterData}
          />
        </div>

        {/* Quality Ratings */}
        <div className="space-y-3">
          <Label className="font-medium">Quality Ratings</Label>
          <MemoizedMultiSelect
            options={qualityOptions}
            selectedValues={filters.qualityRatings}
            onChange={(value) => handleMultiSelectChange('qualityRatings', value)}
            placeholder="Select quality levels"
            disabled={false}
          />
        </div>

        {/* Spend Range */}
        <div className="space-y-3">
          <Label className="font-medium">Spend Range ($)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="min-spend" className="text-xs text-gray-600">Min</Label>
              <Input
                id="min-spend"
                type="number"
                min="0"
                value={filters.spendRange.min}
                onChange={(e) => handleRangeChange('spendRange', 'min', parseInt(e.target.value) || 0)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="max-spend" className="text-xs text-gray-600">Max</Label>
              <Input
                id="max-spend"
                type="number"
                min="0"
                value={filters.spendRange.max}
                onChange={(e) => handleRangeChange('spendRange', 'max', parseInt(e.target.value) || 100000)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Deal Range */}
        <div className="space-y-3">
          <Label className="font-medium">Deal Count Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="min-deals" className="text-xs text-gray-600">Min</Label>
              <Input
                id="min-deals"
                type="number"
                min="0"
                value={filters.dealRange.min}
                onChange={(e) => handleRangeChange('dealRange', 'min', parseInt(e.target.value) || 0)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="max-deals" className="text-xs text-gray-600">Max</Label>
              <Input
                id="max-deals"
                type="number"
                min="0"
                value={filters.dealRange.max}
                onChange={(e) => handleRangeChange('dealRange', 'max', parseInt(e.target.value) || 1000)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Performance Thresholds */}
        <div className="space-y-3">
          <Label className="font-medium">Performance Thresholds</Label>
          <div className="space-y-2">
            <div>
              <Label htmlFor="min-roi" className="text-xs text-gray-600">Min ROI (%)</Label>
              <Input
                id="min-roi"
                type="number"
                step="0.1"
                value={filters.minROI || ''}
                onChange={(e) => handleFilterChange({ minROI: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="text-sm"
                placeholder="e.g., 20"
              />
            </div>
            <div>
              <Label htmlFor="min-conversion" className="text-xs text-gray-600">Min Conversion Rate (%)</Label>
              <Input
                id="min-conversion"
                type="number"
                step="0.1"
                value={filters.minConversionRate || ''}
                onChange={(e) => handleFilterChange({ minConversionRate: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="text-sm"
                placeholder="e.g., 5"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-apply"
              checked={autoApply}
              onChange={(e) => setAutoApply(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="auto-apply" className="text-sm">Auto-apply filters</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={onApplyFilters}
              disabled={loading}
              className="flex items-center gap-1"
            >
              {loading ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Filter className="h-3 w-3" />
              )}
              Apply
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FilterPanel.displayName = 'FilterPanel';

// Export with both names for backward compatibility
export const OptimizedFilterPanel = FilterPanel;