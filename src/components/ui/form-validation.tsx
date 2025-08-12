import React from 'react';
import { ValidationError } from '@/lib/validation/form-schemas';

interface ValidationDisplayProps {
  errors: ValidationError[];
  className?: string;
}

export function ValidationDisplay({ errors, className = '' }: ValidationDisplayProps) {
  if (errors.length === 0) return null;

  // Group errors by severity
  const criticalErrors = errors.filter(e => e.code === 'REQUIRED_FIELD' || e.code === 'LOGICAL_ERROR');
  const warningErrors = errors.filter(e => e.code === 'VERIFICATION_NEEDED' || e.code === 'PERFORMANCE_CONCERN');
  const infoErrors = errors.filter(e => !criticalErrors.includes(e) && !warningErrors.includes(e));

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Critical Errors */}
      {criticalErrors.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="text-red-600 dark:text-red-400 mr-2">🚨</span>
            <h4 className="font-semibold text-red-900 dark:text-red-100">
              Required Fields Missing
            </h4>
          </div>
          <ul className="space-y-1">
            {criticalErrors.map((error, index) => (
              <li key={index} className="text-sm text-red-700 dark:text-red-200">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning Errors */}
      {warningErrors.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</span>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
              Please Verify
            </h4>
          </div>
          <ul className="space-y-1">
            {warningErrors.map((error, index) => (
              <li key={index} className="text-sm text-yellow-700 dark:text-yellow-200">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Info Errors */}
      {infoErrors.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center mb-2">
            <span className="text-blue-600 dark:text-blue-400 mr-2">ℹ️</span>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">
              Additional Information
            </h4>
          </div>
          <ul className="space-y-1">
            {infoErrors.map((error, index) => (
              <li key={index} className="text-sm text-blue-700 dark:text-blue-200">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface FieldErrorProps {
  error?: ValidationError;
  className?: string;
}

export function FieldError({ error, className = '' }: FieldErrorProps) {
  if (!error) return null;

  const getErrorStyle = (code: string) => {
    switch (code) {
      case 'REQUIRED_FIELD':
      case 'LOGICAL_ERROR':
        return 'text-red-600 dark:text-red-400';
      case 'VERIFICATION_NEEDED':
      case 'PERFORMANCE_CONCERN':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <p className={`text-sm mt-1 ${getErrorStyle(error.code)} ${className}`}>
      {error.message}
    </p>
  );
}

interface ValidationSummaryProps {
  errors: ValidationError[];
  onFixError?: (error: ValidationError) => void;
}

export function ValidationSummary({ errors, onFixError }: ValidationSummaryProps) {
  if (errors.length === 0) {
    return (
      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div className="flex items-center">
          <span className="text-green-600 dark:text-green-400 mr-2">✅</span>
          <span className="font-medium text-green-900 dark:text-green-100">
            All validation checks passed
          </span>
        </div>
      </div>
    );
  }

  const criticalCount = errors.filter(e => e.code === 'REQUIRED_FIELD' || e.code === 'LOGICAL_ERROR').length;
  const warningCount = errors.filter(e => e.code === 'VERIFICATION_NEEDED' || e.code === 'PERFORMANCE_CONCERN').length;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
          Validation Summary
        </h4>
        <div className="flex items-center gap-4 text-sm">
          {criticalCount > 0 && (
            <span className="text-red-600 dark:text-red-400">
              {criticalCount} critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-yellow-600 dark:text-yellow-400">
              {warningCount} warnings
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {errors.map((error, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-2 rounded border-l-4 ${
              error.code === 'REQUIRED_FIELD' || error.code === 'LOGICAL_ERROR'
                ? 'bg-red-50 dark:bg-red-950/20 border-l-red-500'
                : error.code === 'VERIFICATION_NEEDED' || error.code === 'PERFORMANCE_CONCERN'
                ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-yellow-500'
                : 'bg-blue-50 dark:bg-blue-950/20 border-l-blue-500'
            }`}
          >
            <span className="text-sm flex-1">{error.message}</span>
            {onFixError && (
              <button
                onClick={() => onFixError(error)}
                className="text-xs px-2 py-1 bg-white dark:bg-gray-800 border rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Fix
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ValidationDisplay;