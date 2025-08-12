'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface Column {
  key: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'date' | 'text' | 'daterange';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface DataGridProps {
  data: any[];
  columns: Column[];
  filters?: FilterOption[];
  searchPlaceholder?: string;
  title?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (row: any) => void;
  expandableRows?: boolean;
  renderExpandedRow?: (row: any) => React.ReactNode;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
}

export default function DataGrid({
  data,
  columns,
  filters = [],
  searchPlaceholder = "Search...",
  title,
  actions,
  loading = false,
  onRowClick,
  expandableRows = false,
  renderExpandedRow,
  pagination
}: DataGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter and search data
  const filteredAndSearchedData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      const searchableColumns = columns.filter(col => col.searchable);
      result = result.filter(row => 
        searchableColumns.some(col => {
          const value = row[col.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply filters
    Object.entries(filterValues).forEach(([filterKey, filterValue]) => {
      if (filterValue) {
        const filter = filters.find(f => f.key === filterKey);
        if (filter?.type === 'daterange') {
          // Handle date range filtering
          const dates = filterValue.split(',');
          if (dates.length === 2) {
            const startDate = new Date(dates[0]);
            const endDate = new Date(dates[1]);
            result = result.filter(row => {
              const rowDate = new Date(row[filterKey]);
              return rowDate >= startDate && rowDate <= endDate;
            });
          }
        } else {
          result = result.filter(row => {
            const value = row[filterKey];
            if (filter?.type === 'text') {
              return value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
            }
            // Handle array fields (like platforms, countries, etc.)
            if (Array.isArray(value)) {
              return value.includes(filterValue);
            }
            // Handle numeric comparisons (like avgQualityScore)
            if (typeof value === 'number' && !isNaN(parseFloat(filterValue))) {
              return value >= parseFloat(filterValue);
            }
            return value === filterValue;
          });
        }
      }
    });

    return result;
  }, [data, searchTerm, filterValues, columns, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredAndSearchedData;

    return [...filteredAndSearchedData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'desc' ? comparison * -1 : comparison;
    });
  }, [filteredAndSearchedData, sortConfig]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = () => {
    setFilterValues({});
    setSearchTerm('');
  };

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowId)) {
        newSet.delete(rowId);
      } else {
        newSet.add(rowId);
      }
      return newSet;
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="flex items-center gap-4">
            {actions}
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            {(Object.keys(filterValues).length > 0 || searchTerm) && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          {filters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filters.map((filter) => (
                <div key={filter.key} className="space-y-1">
                  <Label className="text-sm font-medium">{filter.label}</Label>
                  {filter.type === 'select' && (
                    <Select
                      value={filterValues[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                      placeholder={filter.placeholder}
                    >
                      <option value="">All</option>
                      {filter.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  )}
                  {(filter.type === 'text' || filter.type === 'date') && (
                    <Input
                      type={filter.type === 'date' ? 'date' : 'text'}
                      placeholder={filter.placeholder}
                      value={filterValues[filter.key] || ''}
                      onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    />
                  )}
                  {filter.type === 'daterange' && (
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        placeholder="Start date"
                        value={filterValues[filter.key]?.split(',')[0] || ''}
                        onChange={(e) => {
                          const endDate = filterValues[filter.key]?.split(',')[1] || '';
                          handleFilterChange(filter.key, `${e.target.value},${endDate}`);
                        }}
                      />
                      <Input
                        type="date"
                        placeholder="End date"
                        value={filterValues[filter.key]?.split(',')[1] || ''}
                        onChange={(e) => {
                          const startDate = filterValues[filter.key]?.split(',')[0] || '';
                          handleFilterChange(filter.key, `${startDate},${e.target.value}`);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {sortedData.length} of {data.length} entries
              {searchTerm && ` matching "${searchTerm}"`}
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {expandableRows && <th className="w-8"></th>}
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`text-left py-3 px-4 font-medium text-gray-900 dark:text-white ${
                          column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
                        }`}
                        style={{ width: column.width }}
                        onClick={column.sortable ? () => handleSort(column.key) : undefined}
                      >
                        <div className="flex items-center gap-2">
                          {column.header}
                          {column.sortable && (
                            <span className="text-gray-400">{getSortIcon(column.key)}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.length === 0 ? (
                    <tr>
                      <td 
                        colSpan={columns.length + (expandableRows ? 1 : 0)} 
                        className="text-center py-8 text-gray-500"
                      >
                        No data found
                      </td>
                    </tr>
                  ) : (
                    sortedData.map((row, index) => {
                      const rowId = row.id || index.toString();
                      const isExpanded = expandedRows.has(rowId);
                      
                      return (
                        <React.Fragment key={rowId}>
                          <tr
                            className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                              onRowClick ? 'cursor-pointer' : ''
                            }`}
                            onClick={() => onRowClick?.(row)}
                          >
                            {expandableRows && (
                              <td className="py-3 px-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpansion(rowId);
                                  }}
                                >
                                  {isExpanded ? '−' : '+'}
                                </Button>
                              </td>
                            )}
                            {columns.map((column) => (
                              <td key={column.key} className="py-3 px-4">
                                {column.render 
                                  ? column.render(row[column.key], row)
                                  : row[column.key]
                                }
                              </td>
                            ))}
                          </tr>
                          {expandableRows && isExpanded && renderExpandedRow && (
                            <tr>
                              <td colSpan={columns.length + 1} className="py-0 px-0">
                                <div className="bg-gray-50 dark:bg-gray-800 p-4">
                                  {renderExpandedRow(row)}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Show:</Label>
                  <Select
                    value={pagination.limit.toString()}
                    onChange={(e) => pagination.onLimitChange(parseInt(e.target.value))}
                  >
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </Select>
                  <span className="text-sm text-gray-600">
                    entries per page
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => pagination.onPageChange(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                    onClick={() => pagination.onPageChange(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}