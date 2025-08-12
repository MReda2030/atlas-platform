/**
 * Test Data Fixtures for E2E Tests
 */

export const testUsers = {
  admin: {
    email: 'admin@atlas.com',
    password: 'admin123',
    name: 'System Admin',
    role: 'admin'
  },
  mediaBuyer: {
    email: 'buyer@atlas.com',
    password: 'buyer123',
    name: 'Media Buyer - 4 Seasons',
    role: 'media_buyer',
    branch: '4 Seasons'
  },
  invalidUser: {
    email: 'invalid@test.com',
    password: 'wrongpassword'
  }
};

export const testBranches = [
  { name: '4 Seasons', code: 'FS' },
  { name: 'Amazonn', code: 'AM' },
  { name: 'Fantastic', code: 'FT' },
  { name: 'Skyline', code: 'SL' }
];

export const testCountries = {
  target: [
    { name: 'UAE', code: 'UAE' },
    { name: 'Saudi Arabia', code: 'KSA' },
    { name: 'Kuwait', code: 'KWT' },
    { name: 'Qatar', code: 'QAT' },
    { name: 'Bahrain', code: 'BHR' },
    { name: 'Oman', code: 'OMN' }
  ],
  destination: [
    { name: 'Armenia', code: 'AM' },
    { name: 'Azerbaijan', code: 'AZ' },
    { name: 'Georgia', code: 'GE' },
    { name: 'Turkey', code: 'TR' },
    { name: 'Uzbekistan', code: 'UZ' },
    { name: 'Kazakhstan', code: 'KZ' },
    { name: 'Thailand', code: 'TH' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Maldives', code: 'MV' },
    { name: 'Sri Lanka', code: 'LK' }
  ]
};

export const testPlatforms = [
  { name: 'Meta', code: 'META' },
  { name: 'Google', code: 'GOOGLE' },
  { name: 'TikTok', code: 'TIKTOK' },
  { name: 'Snapchat', code: 'SNAP' },
  { name: 'Twitter', code: 'X' }
];

export const testMediaReport = {
  date: new Date().toISOString().split('T')[0],
  branch: '4 Seasons',
  countries: ['UAE', 'Saudi Arabia'],
  campaigns: [
    {
      country: 'UAE',
      agent: 'Agent 21',
      campaignCount: 2,
      details: [
        {
          destination: 'Armenia',
          amount: 1500.00,
          platform: 'Meta'
        },
        {
          destination: 'Turkey',
          amount: 2000.00,
          platform: 'Google'
        }
      ]
    },
    {
      country: 'Saudi Arabia',
      agent: 'Agent 22',
      campaignCount: 1,
      details: [
        {
          destination: 'Georgia',
          amount: 3000.00,
          platform: 'TikTok'
        }
      ]
    }
  ]
};

export const testSalesReport = {
  date: new Date().toISOString().split('T')[0],
  agent: 'Agent 21',
  branch: '4 Seasons',
  countries: [
    {
      country: 'UAE',
      dealsCount: 5,
      whatsappMessages: 50,
      quality: 'excellent',
      destinations: ['Armenia', 'Turkey', 'Georgia', 'Thailand', 'Malaysia']
    },
    {
      country: 'Saudi Arabia',
      dealsCount: 3,
      whatsappMessages: 30,
      quality: 'good',
      destinations: ['Georgia', 'Turkey', 'Azerbaijan']
    }
  ]
};

export const testAgents = [
  { number: '21', name: 'Agent 21', branch: '4 Seasons' },
  { number: '22', name: 'Agent 22', branch: '4 Seasons' },
  { number: '23', name: 'Agent 23', branch: 'Amazonn' },
  { number: '24', name: 'Agent 24', branch: 'Amazonn' },
  { number: '25', name: 'Agent 25', branch: 'Fantastic' },
  { number: '26', name: 'Agent 26', branch: 'Fantastic' },
  { number: '27', name: 'Agent 27', branch: 'Skyline' },
  { number: '28', name: 'Agent 28', branch: 'Skyline' }
];