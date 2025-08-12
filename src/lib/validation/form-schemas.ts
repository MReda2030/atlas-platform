// Form validation schemas using Zod
// This file provides comprehensive validation for all form data

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}

// Media Report Validation
export class MediaReportValidator {
  static validateMetadata(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Date validation
    if (!data.date) {
      errors.push({
        field: 'date',
        message: 'Report date is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      const reportDate = new Date(data.date);
      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      if (reportDate > today) {
        errors.push({
          field: 'date',
          message: 'Report date cannot be in the future',
          code: 'INVALID_DATE'
        });
      }
      
      if (reportDate < oneWeekAgo) {
        errors.push({
          field: 'date',
          message: 'Report date cannot be more than 7 days old. Contact admin for historical entries.',
          code: 'DATE_TOO_OLD'
        });
      }
    }

    // Branch validation
    if (!data.branchId) {
      errors.push({
        field: 'branchId',
        message: 'Branch selection is required',
        code: 'REQUIRED_FIELD'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined
    };
  }

  static validateCountries(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.selectedCountries || data.selectedCountries.length === 0) {
      errors.push({
        field: 'selectedCountries',
        message: 'At least one target country must be selected',
        code: 'REQUIRED_FIELD'
      });
    }

    if (data.selectedCountries && data.selectedCountries.length > 6) {
      errors.push({
        field: 'selectedCountries',
        message: 'Maximum 6 countries can be selected per report',
        code: 'EXCEEDED_LIMIT'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined
    };
  }

  static validateAgents(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.countryAgents || Object.keys(data.countryAgents).length === 0) {
      errors.push({
        field: 'countryAgents',
        message: 'At least one agent must be assigned per selected country',
        code: 'REQUIRED_FIELD'
      });
    }

    // Validate each country has at least one agent
    Object.entries(data.countryAgents || {}).forEach(([countryCode, agents]: [string, any]) => {
      if (!agents || agents.length === 0) {
        errors.push({
          field: `countryAgents.${countryCode}`,
          message: `At least one agent must be assigned to ${countryCode}`,
          code: 'REQUIRED_FIELD'
        });
      }

      // Validate campaign counts
      agents.forEach((agent: any, index: number) => {
        if (!agent.campaignCount || agent.campaignCount < 1) {
          errors.push({
            field: `countryAgents.${countryCode}.${index}.campaignCount`,
            message: `Campaign count must be at least 1 for Agent ${agent.agentId}`,
            code: 'INVALID_VALUE'
          });
        }

        if (agent.campaignCount > 20) {
          errors.push({
            field: `countryAgents.${countryCode}.${index}.campaignCount`,
            message: `Maximum 20 campaigns per agent. Agent ${agent.agentId} has ${agent.campaignCount}`,
            code: 'EXCEEDED_LIMIT'
          });
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined
    };
  }

  static validateCampaigns(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.campaigns || Object.keys(data.campaigns).length === 0) {
      errors.push({
        field: 'campaigns',
        message: 'Campaign details are required for all assigned agents',
        code: 'REQUIRED_FIELD'
      });
    }

    let totalSpend = 0;

    // Validate each agent's campaigns
    Object.entries(data.campaigns || {}).forEach(([agentKey, campaigns]: [string, any]) => {
      if (!campaigns || campaigns.length === 0) {
        errors.push({
          field: `campaigns.${agentKey}`,
          message: `Campaign details missing for ${agentKey}`,
          code: 'REQUIRED_FIELD'
        });
        return;
      }

      campaigns.forEach((campaign: any, index: number) => {
        const fieldPrefix = `campaigns.${agentKey}.${index}`;

        // Destination validation
        if (!campaign.destinationId) {
          errors.push({
            field: `${fieldPrefix}.destinationId`,
            message: `Destination is required for campaign ${index + 1}`,
            code: 'REQUIRED_FIELD'
          });
        }

        // Amount validation
        if (!campaign.amount) {
          errors.push({
            field: `${fieldPrefix}.amount`,
            message: `Amount is required for campaign ${index + 1}`,
            code: 'REQUIRED_FIELD'
          });
        } else {
          const amount = parseFloat(campaign.amount);
          if (isNaN(amount) || amount <= 0) {
            errors.push({
              field: `${fieldPrefix}.amount`,
              message: `Amount must be a positive number for campaign ${index + 1}`,
              code: 'INVALID_VALUE'
            });
          } else if (amount > 10000) {
            errors.push({
              field: `${fieldPrefix}.amount`,
              message: `Amount seems unusually high ($${amount}). Please verify or contact admin.`,
              code: 'VERIFICATION_NEEDED'
            });
          } else {
            totalSpend += amount;
          }
        }

        // Platform validation
        if (!campaign.platformId) {
          errors.push({
            field: `${fieldPrefix}.platformId`,
            message: `Platform is required for campaign ${index + 1}`,
            code: 'REQUIRED_FIELD'
          });
        }
      });
    });

    // Overall spend validation
    if (totalSpend > 50000) {
      errors.push({
        field: 'campaigns.totalSpend',
        message: `Total daily spend of $${totalSpend.toLocaleString()} exceeds recommended limit. Please verify with management.`,
        code: 'VERIFICATION_NEEDED'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? { ...data, totalSpend } : undefined
    };
  }
}

// Sales Report Validation
export class SalesReportValidator {
  static validateAgent(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    // Date validation (same as media report)
    if (!data.date) {
      errors.push({
        field: 'date',
        message: 'Report date is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      const reportDate = new Date(data.date);
      const today = new Date();
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      if (reportDate > today) {
        errors.push({
          field: 'date',
          message: 'Report date cannot be in the future',
          code: 'INVALID_DATE'
        });
      }
      
      if (reportDate < oneWeekAgo) {
        errors.push({
          field: 'date',
          message: 'Report date cannot be more than 7 days old. Contact admin for historical entries.',
          code: 'DATE_TOO_OLD'
        });
      }
    }

    // Branch validation
    if (!data.branchId) {
      errors.push({
        field: 'branchId',
        message: 'Branch selection is required',
        code: 'REQUIRED_FIELD'
      });
    }

    // Sales agent validation
    if (!data.salesAgentId) {
      errors.push({
        field: 'salesAgentId',
        message: 'Sales agent selection is required',
        code: 'REQUIRED_FIELD'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined
    };
  }

  static validateCountryData(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.countryData || Object.keys(data.countryData).length === 0) {
      errors.push({
        field: 'countryData',
        message: 'At least one country with sales activity is required',
        code: 'REQUIRED_FIELD'
      });
    }

    let totalDeals = 0;
    let totalMessages = 0;

    // Validate each country's data
    Object.entries(data.countryData || {}).forEach(([countryCode, countryInfo]: [string, any]) => {
      const fieldPrefix = `countryData.${countryCode}`;

      // Deals closed validation
      if (typeof countryInfo.dealsClosed !== 'number' || countryInfo.dealsClosed < 0) {
        errors.push({
          field: `${fieldPrefix}.dealsClosed`,
          message: `Deals closed must be a non-negative number for ${countryCode}`,
          code: 'INVALID_VALUE'
        });
      } else if (countryInfo.dealsClosed > 50) {
        errors.push({
          field: `${fieldPrefix}.dealsClosed`,
          message: `${countryInfo.dealsClosed} deals seems unusually high for ${countryCode}. Please verify.`,
          code: 'VERIFICATION_NEEDED'
        });
      } else {
        totalDeals += countryInfo.dealsClosed;
      }

      // WhatsApp messages validation
      if (typeof countryInfo.whatsappMessages !== 'number' || countryInfo.whatsappMessages < 0) {
        errors.push({
          field: `${fieldPrefix}.whatsappMessages`,
          message: `WhatsApp messages must be a non-negative number for ${countryCode}`,
          code: 'INVALID_VALUE'
        });
      } else if (countryInfo.whatsappMessages > 500) {
        errors.push({
          field: `${fieldPrefix}.whatsappMessages`,
          message: `${countryInfo.whatsappMessages} messages seems unusually high for ${countryCode}. Please verify.`,
          code: 'VERIFICATION_NEEDED'
        });
      } else {
        totalMessages += countryInfo.whatsappMessages;
      }

      // Quality rating validation
      if (!countryInfo.qualityRating) {
        errors.push({
          field: `${fieldPrefix}.qualityRating`,
          message: `Quality rating is required for ${countryCode}`,
          code: 'REQUIRED_FIELD'
        });
      }

      // Conversion rate validation
      if (countryInfo.dealsClosed > 0 && countryInfo.whatsappMessages > 0) {
        const conversionRate = (countryInfo.dealsClosed / countryInfo.whatsappMessages) * 100;
        if (conversionRate > 50) {
          errors.push({
            field: `${fieldPrefix}.conversionRate`,
            message: `Conversion rate of ${conversionRate.toFixed(1)}% for ${countryCode} seems unusually high. Please verify data.`,
            code: 'VERIFICATION_NEEDED'
          });
        }
      }

      // Logical consistency
      if (countryInfo.dealsClosed > countryInfo.whatsappMessages && countryInfo.whatsappMessages > 0) {
        errors.push({
          field: `${fieldPrefix}.consistency`,
          message: `Deals closed (${countryInfo.dealsClosed}) cannot exceed WhatsApp messages (${countryInfo.whatsappMessages}) for ${countryCode}`,
          code: 'LOGICAL_ERROR'
        });
      }
    });

    // Overall performance validation
    if (totalDeals === 0 && totalMessages > 0) {
      errors.push({
        field: 'countryData.overall',
        message: 'No deals closed despite sending messages. Please verify or add explanation.',
        code: 'PERFORMANCE_CONCERN'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? { ...data, totalDeals, totalMessages } : undefined
    };
  }

  static validateDealAllocations(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    const totalDeals = Object.values(data.countryData || {}).reduce(
      (sum: number, country: any) => sum + (country.dealsClosed || 0), 0
    );

    if (totalDeals === 0) {
      return { isValid: true, errors: [], data };
    }

    if (!data.dealAllocations) {
      errors.push({
        field: 'dealAllocations',
        message: 'Deal allocations are required when deals are closed',
        code: 'REQUIRED_FIELD'
      });
      return { isValid: false, errors };
    }

    const allocatedDeals = Object.keys(data.dealAllocations).length;
    
    if (allocatedDeals !== totalDeals) {
      errors.push({
        field: 'dealAllocations',
        message: `All ${totalDeals} deals must be allocated to destinations. Currently allocated: ${allocatedDeals}`,
        code: 'INCOMPLETE_ALLOCATION'
      });
    }

    // Validate each allocation has a valid destination
    Object.entries(data.dealAllocations).forEach(([dealKey, destinationId]) => {
      if (!destinationId) {
        errors.push({
          field: `dealAllocations.${dealKey}`,
          message: `Destination must be selected for ${dealKey}`,
          code: 'REQUIRED_FIELD'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined
    };
  }
}

// Data Consistency Validation
export class DataConsistencyValidator {
  static async validateMediaSalesAlignment(mediaData: any, salesData: any, date: string, agentId?: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // This would typically fetch data from the database
    // For now, we'll validate the current form data structure

    // Check if there's corresponding media spend for sales results
    if (salesData && salesData.countryData) {
      Object.keys(salesData.countryData).forEach(countryCode => {
        const countryDeals = salesData.countryData[countryCode].dealsClosed;
        
        if (countryDeals > 0) {
          // In a real implementation, we'd check if there was media spend for this agent/country/date
          // For now, just flag potential issues
          
          const messages = salesData.countryData[countryCode].whatsappMessages;
          if (messages === 0 && countryDeals > 0) {
            errors.push({
              field: 'consistency',
              message: `Agent closed ${countryDeals} deals in ${countryCode} without any WhatsApp activity. Please verify.`,
              code: 'DATA_INCONSISTENCY'
            });
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? { mediaData, salesData } : undefined
    };
  }
}

export type { ValidationError, ValidationResult };