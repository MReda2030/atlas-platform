import { z } from "zod";

// Media Report Validation Schemas
export const mediaReportSchema = z.object({
  date: z.string().min(1, "Date is required"),
  branchId: z.string().min(1, "Branch is required"),
  countries: z.array(z.object({
    targetCountryId: z.string().min(1, "Country is required"),
    agents: z.array(z.object({
      salesAgentId: z.string().min(1, "Agent is required"),
      campaignCount: z.number().min(1, "At least 1 campaign required").max(10, "Maximum 10 campaigns per agent"),
      campaigns: z.array(z.object({
        destinationCountryId: z.string().min(1, "Destination is required"),
        amount: z.number().min(0.01, "Amount must be greater than 0"),
        platformId: z.string().min(1, "Platform is required"),
      }))
    }))
  })).min(1, "At least one country is required")
});

// Sales Report Validation Schemas
export const salesReportSchema = z.object({
  date: z.string().min(1, "Date is required"),
  branchId: z.string().min(1, "Branch is required"),
  salesAgentId: z.string().min(1, "Sales agent is required"),
  countries: z.array(z.object({
    targetCountryId: z.string().min(1, "Country is required"),
    dealsClosed: z.number().min(0, "Deals closed cannot be negative"),
    whatsappMessages: z.number().min(0, "WhatsApp messages cannot be negative"),
    qualityRating: z.enum(["below_standard", "standard", "good", "excellent", "best_quality"]),
    dealDestinations: z.array(z.object({
      destinationCountryId: z.string().min(1, "Destination is required"),
      dealNumber: z.number().min(1, "Deal number is required"),
    }))
  }))
});

// Helper validation for individual steps
export const mediaReportStep1Schema = z.object({
  date: z.string().min(1, "Date is required"),
  branchId: z.string().min(1, "Branch is required"),
});

export const mediaReportStep2Schema = z.object({
  selectedCountries: z.array(z.string()).min(1, "Select at least one country"),
});

export const mediaReportStep3Schema = z.object({
  countryAgents: z.record(z.array(z.object({
    salesAgentId: z.string().min(1, "Agent is required"),
    campaignCount: z.number().min(1, "At least 1 campaign required").max(10, "Maximum 10 campaigns per agent"),
  }))),
});

// Type definitions
export type MediaReportFormData = z.infer<typeof mediaReportSchema>;
export type SalesReportFormData = z.infer<typeof salesReportSchema>;
export type MediaReportStep1Data = z.infer<typeof mediaReportStep1Schema>;
export type MediaReportStep2Data = z.infer<typeof mediaReportStep2Schema>;
export type MediaReportStep3Data = z.infer<typeof mediaReportStep3Schema>;