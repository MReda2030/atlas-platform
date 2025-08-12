// Master Data Constants based on Atlas Reference Data

export const DESTINATION_COUNTRIES = [
  { code: 'AM', name: 'Armenia' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BA', name: 'Bosnia' },
  { code: 'GE', name: 'Georgia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'RU', name: 'Russia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TR', name: 'Turkey' },
] as const;

export const TARGET_COUNTRIES = [
  { code: 'UAE', name: 'UAE' },
  { code: 'KSA', name: 'Saudi Arabia' },
  { code: 'KWT', name: 'Kuwait' },
  { code: 'QAT', name: 'Qatar' },
  { code: 'BHR', name: 'Bahrain' },
  { code: 'OMN', name: 'Oman' },
] as const;

export const BRANCHES = [
  { code: '4S', name: '4 Seasons' },
  { code: 'AMZ', name: 'Amazonn' },
  { code: 'FAN', name: 'Fantastic' },
  { code: 'SKY', name: 'Skyline' },
] as const;

export const ADVERTISING_PLATFORMS = [
  { code: 'META', name: 'Meta' },
  { code: 'GOOGLE', name: 'Google' },
  { code: 'TIKTOK', name: 'TikTok' },
  { code: 'SNAPCHAT', name: 'Snapchat' },
  { code: 'TWITTER', name: 'Twitter' },
] as const;

export const QUALITY_RATINGS = [
  { value: 'below_standard', label: 'Below Standard', color: 'red' },
  { value: 'standard', label: 'Standard', color: 'yellow' },
  { value: 'good', label: 'Good', color: 'blue' },
  { value: 'excellent', label: 'Excellent', color: 'green' },
  { value: 'best_quality', label: 'Best Quality', color: 'purple' },
] as const;

// Sales Agents by Branch (from reference data)
export const SALES_AGENTS_BY_BRANCH = {
  '4 Seasons': ['21', '22', '38', '62', '64', '66', '73', '76', '77', '79', '83', '902', '94'],
  'Amazonn': ['15', '22', '27', '34', '62', '67', '901', '93', '95', '97'],
  'Fantastic': ['01', '031', '06', '19', '308', '32', '448', '45', '48', '60', '65', '67', '79'],
  'Skyline': ['06', '222', '304', '37', '47', '506', '57', '59', '71', '72', '75', '97'],
} as const;

export const USER_ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'media_buyer', label: 'Media Buyer' },
] as const;

// UI Constants
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_CAMPAIGNS_PER_AGENT = 10;
export const MAX_DEALS_PER_COUNTRY = 100;