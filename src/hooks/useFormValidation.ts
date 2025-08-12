import { useState, useCallback, useEffect } from 'react';
import { ValidationError, ValidationResult } from '@/lib/validation/form-schemas';

interface UseFormValidationOptions {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface ValidationState {
  errors: ValidationError[];
  isValid: boolean;
  isValidating: boolean;
  hasBeenValidated: boolean;
}

export function useFormValidation(
  validator: (data: any) => ValidationResult | Promise<ValidationResult>,
  options: UseFormValidationOptions = {}
) {
  const {
    validateOnChange = false,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const [validationState, setValidationState] = useState<ValidationState>({
    errors: [],
    isValid: true,
    isValidating: false,
    hasBeenValidated: false,
  });

  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  const runValidation = useCallback(async (data: any, immediate = false) => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = await validator(data);
      
      setValidationState({
        errors: result.errors,
        isValid: result.isValid,
        isValidating: false,
        hasBeenValidated: true,
      });

      return result;
    } catch (error) {
      console.error('Validation error:', error);
      
      setValidationState({
        errors: [{
          field: 'validation',
          message: 'Validation failed due to an internal error',
          code: 'VALIDATION_ERROR'
        }],
        isValid: false,
        isValidating: false,
        hasBeenValidated: true,
      });

      return {
        isValid: false,
        errors: [{
          field: 'validation',
          message: 'Validation failed due to an internal error',
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }, [validator]);

  const validateNow = useCallback((data: any) => {
    return runValidation(data, true);
  }, [runValidation]);

  const validateWithDebounce = useCallback((data: any) => {
    // Clear existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      runValidation(data);
    }, debounceMs);

    setDebounceTimeout(timeout);
  }, [debounceTimeout, debounceMs, runValidation]);

  const validateOnChangeHandler = useCallback((data: any) => {
    if (validateOnChange) {
      validateWithDebounce(data);
    }
  }, [validateOnChange, validateWithDebounce]);

  const validateOnBlurHandler = useCallback((data: any) => {
    if (validateOnBlur) {
      validateNow(data);
    }
  }, [validateOnBlur, validateNow]);

  const clearErrors = useCallback(() => {
    setValidationState({
      errors: [],
      isValid: true,
      isValidating: false,
      hasBeenValidated: false,
    });
  }, []);

  const getFieldError = useCallback((fieldName: string): ValidationError | undefined => {
    return validationState.errors.find(error => 
      error.field === fieldName || error.field.startsWith(`${fieldName}.`)
    );
  }, [validationState.errors]);

  const hasFieldError = useCallback((fieldName: string): boolean => {
    return getFieldError(fieldName) !== undefined;
  }, [getFieldError]);

  const getFieldErrors = useCallback((fieldName: string): ValidationError[] => {
    return validationState.errors.filter(error => 
      error.field === fieldName || error.field.startsWith(`${fieldName}.`)
    );
  }, [validationState.errors]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [debounceTimeout]);

  return {
    // Validation state
    errors: validationState.errors,
    isValid: validationState.isValid,
    isValidating: validationState.isValidating,
    hasBeenValidated: validationState.hasBeenValidated,

    // Validation methods
    validate: validateNow,
    validateOnChange: validateOnChangeHandler,
    validateOnBlur: validateOnBlurHandler,
    clearErrors,

    // Field-specific helpers
    getFieldError,
    hasFieldError,
    getFieldErrors,

    // Convenience methods
    canSubmit: validationState.isValid && validationState.hasBeenValidated && !validationState.isValidating,
    shouldShowErrors: validationState.hasBeenValidated,
  };
}

// Higher-order component for form validation
export function withFormValidation<T extends object>(
  validator: (data: any) => ValidationResult | Promise<ValidationResult>,
  options?: UseFormValidationOptions
) {
  return function useValidatedForm(initialData: T) {
    const [formData, setFormData] = useState<T>(initialData);
    
    const validation = useFormValidation(validator, options);

    const updateField = useCallback((field: keyof T, value: any) => {
      const newData = { ...formData, [field]: value };
      setFormData(newData);
      validation.validateOnChange(newData);
    }, [formData, validation]);

    const updateData = useCallback((data: Partial<T>) => {
      const newData = { ...formData, ...data };
      setFormData(newData);
      validation.validateOnChange(newData);
    }, [formData, validation]);

    const handleBlur = useCallback((field?: keyof T) => {
      validation.validateOnBlur(formData);
    }, [formData, validation]);

    const handleSubmit = useCallback(async (onSubmit: (data: T) => void) => {
      const result = await validation.validate(formData);
      if (result.isValid) {
        onSubmit(formData);
      }
      return result;
    }, [formData, validation]);

    const reset = useCallback((data?: T) => {
      const resetData = data || initialData;
      setFormData(resetData);
      validation.clearErrors();
    }, [initialData, validation]);

    return {
      // Form data
      formData,
      setFormData,

      // Form handlers
      updateField,
      updateData,
      handleBlur,
      handleSubmit,
      reset,

      // Validation state
      ...validation,
    };
  };
}

export default useFormValidation;