'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useAutoSave } from '@/hooks/useAutoSave';
import { 
  TARGET_COUNTRIES, 
  DESTINATION_COUNTRIES, 
  ADVERTISING_PLATFORMS, 
  BRANCHES,
  SALES_AGENTS_BY_BRANCH 
} from '@/lib/constants';

interface MediaReportFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  showError?: (title: string, message: string) => void;
}

type FormStep = 'metadata' | 'countries' | 'agents' | 'campaigns' | 'review';

export default function MediaReportForm({ onSubmit, onCancel, showError }: MediaReportFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('metadata');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    branchId: '',
    selectedCountries: [] as string[],
    countryAgents: {} as Record<string, Array<{agentId: string, campaignCount: number}>>,
    campaigns: {} as Record<string, Array<{destinationId: string, amount: string, platformId: string}>>,
  });
  
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedDataAvailable, setSavedDataAvailable] = useState<any>(null);

  // Auto-save hook
  const { clearAutoSave, loadSavedData } = useAutoSave({
    key: 'media-report-draft',
    data: { formData, currentStep },
    enabled: true,
    onSave: () => setAutoSaveStatus('saved'),
    onError: () => setAutoSaveStatus('error'),
  });

  // Load saved data on component mount
  useEffect(() => {
    const saved = loadSavedData();
    if (saved) {
      setSavedDataAvailable(saved);
    }
  }, [loadSavedData]);

  // Auto-save status timeout
  useEffect(() => {
    if (autoSaveStatus === 'saved') {
      const timeout = setTimeout(() => setAutoSaveStatus('idle'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [autoSaveStatus]);

  const handleRestoreData = useCallback(() => {
    if (savedDataAvailable) {
      setFormData(savedDataAvailable.data.formData);
      setCurrentStep(savedDataAvailable.data.currentStep);
      setSavedDataAvailable(null);
    }
  }, [savedDataAvailable]);

  const handleDiscardSaved = useCallback(() => {
    clearAutoSave();
    setSavedDataAvailable(null);
  }, [clearAutoSave]);

  const handleStepSubmit = useCallback((stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    
    switch (currentStep) {
      case 'metadata':
        setCurrentStep('countries');
        break;
      case 'countries':
        setCurrentStep('agents');
        break;
      case 'agents':
        setCurrentStep('campaigns');
        break;
      case 'campaigns':
        setCurrentStep('review');
        break;
      case 'review':
        clearAutoSave(); // Clear auto-save on successful submission
        onSubmit?.(formData);
        break;
    }
  }, [currentStep, formData, clearAutoSave, onSubmit]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'metadata':
        return <MetadataStep onSubmit={handleStepSubmit} initialData={formData} />;
      case 'countries':
        return <CountriesStep onSubmit={handleStepSubmit} initialData={formData} showError={showError} setCurrentStep={setCurrentStep} />;
      case 'agents':
        return <AgentsStep onSubmit={handleStepSubmit} initialData={formData} showError={showError} setCurrentStep={setCurrentStep} />;
      case 'campaigns':
        return <CampaignsStep onSubmit={handleStepSubmit} initialData={formData} showError={showError} setCurrentStep={setCurrentStep} />;
      case 'review':
        return <ReviewStep onSubmit={handleStepSubmit} data={formData} setCurrentStep={setCurrentStep} />;
      default:
        return null;
    }
  };

  const getStepNumber = () => {
    const steps: FormStep[] = ['metadata', 'countries', 'agents', 'campaigns', 'review'];
    return steps.indexOf(currentStep) + 1;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Auto-save status */}
      {autoSaveStatus === 'saved' && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center text-sm text-green-700 dark:text-green-200">
            <span className="mr-2">✓</span>
            Progress automatically saved
          </div>
        </div>
      )}

      {/* Restore saved data banner */}
      {savedDataAvailable && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Resume Previous Session
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                Found unsaved progress from {savedDataAvailable.hoursAgo} hours ago. Would you like to continue where you left off?
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={handleDiscardSaved}>
                Start Fresh
              </Button>
              <Button size="sm" onClick={handleRestoreData}>
                Restore
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Media Report Entry
            <span className="text-sm font-normal text-gray-500">
              Step {getStepNumber()} of 5
            </span>
          </CardTitle>
          <CardDescription>
            Create a new daily media report with campaign details
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="flex space-x-2 mt-4">
            {['metadata', 'countries', 'agents', 'campaigns', 'review'].map((step, index) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full ${
                  index < getStepNumber() - 1 
                    ? 'bg-green-500' 
                    : index === getStepNumber() - 1 
                    ? 'bg-blue-500' 
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
}

// Step Components
function MetadataStep({ onSubmit, initialData }: any) {
  const [date, setDate] = useState(initialData.date);
  const [branchId, setBranchId] = useState(initialData.branchId);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ date, branchId });
  }, [date, branchId, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Report Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="branch">Branch</Label>
          <Select
            id="branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            placeholder="Select branch"
            required
          >
            {BRANCHES.map((branch) => (
              <option key={branch.code} value={branch.code}>
                {branch.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Next: Select Countries</Button>
      </div>
    </form>
  );
}

function CountriesStep({ onSubmit, initialData, showError, setCurrentStep }: any) {
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    initialData.selectedCountries || []
  );

  const toggleCountry = (countryCode: string) => {
    setSelectedCountries(prev => 
      prev.includes(countryCode) 
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCountries.length === 0) {
      showError?.('No Countries Selected', 'Please select at least one target country where ads were run.');
      return;
    }
    onSubmit({ selectedCountries });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-base font-medium">
          Select Target Countries (where ads were run)
        </Label>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {TARGET_COUNTRIES.map((country) => (
            <div
              key={country.code}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedCountries.includes(country.code)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => toggleCountry(country.code)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded border-2 ${
                  selectedCountries.includes(country.code)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedCountries.includes(country.code) && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <span className="font-medium">{country.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('metadata')}
        >
          ← Previous: Report Details
        </Button>
        <Button type="submit">Next: Assign Agents</Button>
      </div>
    </form>
  );
}

function AgentsStep({ onSubmit, initialData, showError, setCurrentStep }: any) {
  const [countryAgents, setCountryAgents] = useState<Record<string, Array<{agentId: string, campaignCount: number}>>>(
    initialData.countryAgents || {}
  );

  const selectedCountries = initialData.selectedCountries || [];
  const selectedBranch = BRANCHES.find(b => b.code === initialData.branchId);
  const availableAgents = selectedBranch ? SALES_AGENTS_BY_BRANCH[selectedBranch.name] || [] : [];

  const addAgent = (countryCode: string) => {
    setCountryAgents(prev => ({
      ...prev,
      [countryCode]: [
        ...(prev[countryCode] || []),
        { agentId: '', campaignCount: 1 }
      ]
    }));
  };

  const removeAgent = (countryCode: string, index: number) => {
    setCountryAgents(prev => ({
      ...prev,
      [countryCode]: prev[countryCode].filter((_, i) => i !== index)
    }));
  };

  const updateAgent = (countryCode: string, index: number, field: 'agentId' | 'campaignCount', value: any) => {
    setCountryAgents(prev => ({
      ...prev,
      [countryCode]: prev[countryCode].map((agent, i) => 
        i === index ? { ...agent, [field]: value } : agent
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that each country has at least one agent
    for (const country of selectedCountries) {
      const agents = countryAgents[country] || [];
      if (agents.length === 0) {
        const countryName = TARGET_COUNTRIES.find(c => c.code === country)?.name || country;
        showError?.('Missing Agents', `Please add at least one agent for ${countryName}.`);
        return;
      }
      
      // Validate agent selection and campaign count
      for (const agent of agents) {
        if (!agent.agentId || agent.campaignCount < 1) {
          showError?.('Invalid Agent Data', 'Please select an agent and specify campaign count (at least 1) for all entries.');
          return;
        }
      }
    }
    
    onSubmit({ countryAgents });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-base font-medium">
          Assign Agents and Campaign Counts
        </Label>
        <p className="text-sm text-gray-600 mt-1">
          For each country, specify which agents ran campaigns and how many campaigns each agent had.
        </p>
      </div>

      {selectedCountries.map((countryCode: string) => {
        const country = TARGET_COUNTRIES.find(c => c.code === countryCode);
        const agents = countryAgents[countryCode] || [];

        return (
          <Card key={countryCode} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{country?.name}</CardTitle>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={() => addAgent(countryCode)}
              >
                + Add Agent
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {agents.map((agent, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="flex-1">
                    <Label className="text-sm">Sales Agent</Label>
                    <Select
                      value={agent.agentId}
                      onChange={(e) => updateAgent(countryCode, index, 'agentId', e.target.value)}
                      placeholder="Select agent"
                    >
                      {availableAgents.map((agentNumber) => (
                        <option key={agentNumber} value={agentNumber}>
                          Agent {agentNumber}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="w-32">
                    <Label className="text-sm">Campaigns</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={agent.campaignCount}
                      onChange={(e) => updateAgent(countryCode, index, 'campaignCount', parseInt(e.target.value))}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAgent(countryCode, index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('countries')}
        >
          ← Previous: Target Countries
        </Button>
        <Button type="submit">Next: Campaign Details</Button>
      </div>
    </form>
  );
}

function CampaignsStep({ onSubmit, initialData, showError, setCurrentStep }: any) {
  const [campaigns, setCampaigns] = useState<Record<string, {destinationId: string, amount: string, platformId: string}>>(
    initialData.campaigns || {}
  );

  // Generate campaign structure based on agents and their counts
  const campaignStructure = Object.entries(initialData.countryAgents || {}).flatMap(([countryCode, agents]: [string, any]) => 
    agents.flatMap((agent: any) => 
      Array.from({ length: agent.campaignCount }, (_, campaignIndex) => ({
        countryCode,
        agentId: agent.agentId,
        campaignIndex,
        key: `${countryCode}-${agent.agentId}-${campaignIndex}`
      }))
    )
  );

  const updateCampaign = (key: string, field: string, value: string) => {
    setCampaigns(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all campaigns have required data
    for (const campaign of campaignStructure) {
      const data = campaigns[campaign.key] || {};
      if (!data.destinationId || !data.amount || !data.platformId) {
        showError?.('Incomplete Campaign Details', 'Please complete all campaign details: destination country, ad spend amount, and advertising platform.');
        return;
      }
    }
    
    onSubmit({ campaigns });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-base font-medium">
          Campaign Details
        </Label>
        <p className="text-sm text-gray-600 mt-1">
          Enter details for each campaign run by each agent.
        </p>
      </div>

      <div className="space-y-4">
        {campaignStructure.map((campaign) => {
          const country = TARGET_COUNTRIES.find(c => c.code === campaign.countryCode);
          const campaignData = campaigns[campaign.key] || {};
          
          return (
            <Card key={campaign.key} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-medium">
                    {country?.name} - Agent {campaign.agentId}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Campaign #{campaign.campaignIndex + 1}
                  </p>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="text-sm">Destination Country</Label>
                  <Select
                    value={campaignData.destinationId || ''}
                    onChange={(e) => updateCampaign(campaign.key, 'destinationId', e.target.value)}
                    placeholder="Select destination"
                  >
                    {DESTINATION_COUNTRIES.map((dest) => (
                      <option key={dest.code} value={dest.code}>
                        {dest.name}
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Ad Spend ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={campaignData.amount || ''}
                    onChange={(e) => updateCampaign(campaign.key, 'amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Platform</Label>
                  <Select
                    value={campaignData.platformId || ''}
                    onChange={(e) => updateCampaign(campaign.key, 'platformId', e.target.value)}
                    placeholder="Select platform"
                  >
                    {ADVERTISING_PLATFORMS.map((platform) => (
                      <option key={platform.code} value={platform.code}>
                        {platform.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('agents')}
        >
          ← Previous: Agent Assignment
        </Button>
        <Button type="submit">Next: Review</Button>
      </div>
    </form>
  );
}

function ReviewStep({ onSubmit, data, setCurrentStep }: any) {
  const totalSpend = Object.values(data.campaigns || {}).reduce((sum: number, campaign: any) => 
    sum + (parseFloat(campaign.amount) || 0), 0
  );
  
  const totalCampaigns = Object.keys(data.campaigns || {}).length;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Review Media Report</Label>
        <p className="text-sm text-gray-600 mt-1">
          Please review all details before submitting.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Date:</span>
              <span className="font-medium">{data.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Branch:</span>
              <span className="font-medium">
                {BRANCHES.find(b => b.code === data.branchId)?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total Campaigns:</span>
              <span className="font-medium">{totalCampaigns}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Spend:</span>
              <span className="font-medium text-green-600">${totalSpend.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Countries & Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.selectedCountries.map((countryCode: string) => {
              const country = TARGET_COUNTRIES.find(c => c.code === countryCode);
              const agents = data.countryAgents[countryCode] || [];
              
              return (
                <div key={countryCode}>
                  <div className="font-medium">{country?.name}</div>
                  <div className="text-sm text-gray-600 ml-4">
                    {agents.map((agent: any, index: number) => (
                      <div key={index}>
                        Agent {agent.agentId}: {agent.campaignCount} campaigns
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('campaigns')}
        >
          ← Previous: Campaign Details
        </Button>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(data)}>
            Submit Report
          </Button>
        </div>
      </div>
    </div>
  );
}