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
  QUALITY_RATINGS,
  BRANCHES,
  SALES_AGENTS_BY_BRANCH 
} from '@/lib/constants';

interface SalesReportFormProps {
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
  showError?: (title: string, message: string) => void;
}

type FormStep = 'agent_selection' | 'country_data' | 'deal_allocation' | 'review';

export default function SalesReportForm({ onSubmit, onCancel, showError }: SalesReportFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('agent_selection');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    branchId: '',
    salesAgentId: '',
    countryData: {} as Record<string, {
      dealsClosed: number;
      whatsappMessages: number;
      qualityRating: string;
    }>,
    dealAllocations: {} as Record<string, Array<{destinationId: string, dealNumber: number}>>,
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [savedDataAvailable, setSavedDataAvailable] = useState<any>(null);

  // Auto-save hook
  const { clearAutoSave, loadSavedData } = useAutoSave({
    key: 'sales-report-draft',
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
  }, []);

  const handleDiscardSaved = useCallback(() => {
    clearAutoSave();
    setSavedDataAvailable(null);
  }, []);

  const handleStepSubmit = useCallback((stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
    
    switch (currentStep) {
      case 'agent_selection':
        setCurrentStep('country_data');
        break;
      case 'country_data':
        setCurrentStep('deal_allocation');
        break;
      case 'deal_allocation':
        setCurrentStep('review');
        break;
      case 'review':
        clearAutoSave(); // Clear auto-save on successful submission
        onSubmit?.(formData);
        break;
    }
  }, []);

  const renderStepContent = () => {
    switch (currentStep) {
      case 'agent_selection':
        return <AgentSelectionStep onSubmit={handleStepSubmit} initialData={formData} showError={showError} />;
      case 'country_data':
        return <CountryDataStep onSubmit={handleStepSubmit} initialData={formData} setCurrentStep={setCurrentStep} showError={showError} />;
      case 'deal_allocation':
        return <DealAllocationStep onSubmit={handleStepSubmit} initialData={formData} setCurrentStep={setCurrentStep} showError={showError} />;
      case 'review':
        return <ReviewStep onSubmit={handleStepSubmit} data={formData} setCurrentStep={setCurrentStep} onCancel={onCancel} />;
      default:
        return null;
    }
  };

  const getStepNumber = () => {
    const steps: FormStep[] = ['agent_selection', 'country_data', 'deal_allocation', 'review'];
    return steps.indexOf(currentStep) + 1;
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'agent_selection': return 'Agent & Date Selection';
      case 'country_data': return 'Country Sales Data';
      case 'deal_allocation': return 'Deal Allocation';
      case 'review': return 'Review & Submit';
      default: return 'Sales Report';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header with Navigation */}
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              New Sales Report
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Step {currentStep === 'agent_selection' ? '1' : currentStep === 'country_data' ? '2' : currentStep === 'deal_allocation' ? '3' : '4'} of 4: {
                currentStep === 'agent_selection' ? 'Agent Selection' :
                currentStep === 'country_data' ? 'Country Data' :
                currentStep === 'deal_allocation' ? 'Deal Allocation' :
                'Review & Submit'
              }
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <span>←</span>
            Back to Dashboard
          </Button>
        </div>
      </div>
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
            Sales Report Entry
            <span className="text-sm font-normal text-gray-500">
              Step {getStepNumber()} of 4
            </span>
          </CardTitle>
          <CardDescription>
            {getStepTitle()} - Create a daily sales performance report
          </CardDescription>
          
          {/* Progress Bar */}
          <div className="flex space-x-2 mt-4">
            {['agent_selection', 'country_data', 'deal_allocation', 'review'].map((step, index) => (
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
function AgentSelectionStep({ onSubmit, initialData, showError }: any) {
  const [date, setDate] = useState(initialData.date);
  const [branchId, setBranchId] = useState(initialData.branchId);
  const [salesAgentId, setSalesAgentId] = useState(initialData.salesAgentId);

  // Get agents for selected branch
  const selectedBranch = BRANCHES.find(b => b.code === branchId);
  const availableAgents = selectedBranch ? SALES_AGENTS_BY_BRANCH[selectedBranch.name] || [] : [];

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !branchId || !salesAgentId) {
      showError?.('Missing Required Fields', 'Please fill in all required fields: date, branch, and sales agent.');
      return;
    }
    onSubmit({ date, branchId, salesAgentId });
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-base font-medium">Sales Report Details</Label>
        <p className="text-sm text-gray-600 mb-4">
          Select the date, branch, and sales agent for this report
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">Report Date *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="branch">Branch *</Label>
          <Select
            id="branch"
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setSalesAgentId(''); // Reset agent when branch changes
            }}
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

        <div className="space-y-2">
          <Label htmlFor="agent">Sales Agent *</Label>
          <Select
            id="agent"
            value={salesAgentId}
            onChange={(e) => setSalesAgentId(e.target.value)}
            placeholder="Select agent"
            disabled={!branchId}
            required
          >
            {availableAgents.map((agentNumber) => (
              <option key={agentNumber} value={agentNumber}>
                Agent {agentNumber}
              </option>
            ))}
          </Select>
        </div>
      </div>


      <div className="flex justify-end">
        <Button type="submit">Next: Country Sales Data</Button>
      </div>
    </form>
  );
}

function CountryDataStep({ onSubmit, initialData, setCurrentStep, showError }: any) {
  const [countryData, setCountryData] = useState<Record<string, any>>(
    initialData.countryData || {}
  );
  const [activeCountries, setActiveCountries] = useState<string[]>(
    Object.keys(initialData.countryData || {})
  );
  const [showAddCountryDropdown, setShowAddCountryDropdown] = useState(false);
  const [selectedCountryToAdd, setSelectedCountryToAdd] = useState('');

  const addCountry = () => {
    setShowAddCountryDropdown(true);
    setSelectedCountryToAdd('');
  };

  const handleAddSelectedCountry = useCallback(() => {
    if (!selectedCountryToAdd) {
      showError?.('No Country Selected', 'Please select a country from the dropdown.');
      return;
    }

    if (activeCountries.includes(selectedCountryToAdd)) {
      showError?.('Country Already Added', 'This country has already been added to this report.');
      return;
    }

    setActiveCountries(prev => [...prev, selectedCountryToAdd]);
    setCountryData(prev => ({
      ...prev,
      [selectedCountryToAdd]: {
        dealsClosed: 0,
        whatsappMessages: 0,
        qualityRating: 'standard'
      }
    }));
    
    setShowAddCountryDropdown(false);
    setSelectedCountryToAdd('');
  }, []);

  const cancelAddCountry = () => {
    setShowAddCountryDropdown(false);
    setSelectedCountryToAdd('');
  };

  const removeCountry = (countryCode: string) => {
    setActiveCountries(prev => prev.filter(c => c !== countryCode));
    setCountryData(prev => {
      const newData = { ...prev };
      delete newData[countryCode];
      return newData;
    });
  };

  const updateCountryData = (countryCode: string, field: string, value: any) => {
    setCountryData(prev => ({
      ...prev,
      [countryCode]: {
        ...prev[countryCode],
        [field]: field === 'dealsClosed' || field === 'whatsappMessages' ? parseInt(value) : value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeCountries.length === 0) {
      showError?.('No Countries Added', 'Please add at least one country with sales activity before proceeding.');
      return;
    }

    // Validate all country data
    for (const countryCode of activeCountries) {
      const data = countryData[countryCode];
      if (!data || data.dealsClosed < 0 || data.whatsappMessages < 0 || !data.qualityRating) {
        const countryName = TARGET_COUNTRIES.find(c => c.code === countryCode)?.name || countryCode;
        showError?.('Incomplete Country Data', `Please complete all fields for ${countryName}: deals closed, WhatsApp messages, and quality rating.`);
        return;
      }
    }
    
    onSubmit({ countryData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Country Sales Performance</Label>
          <p className="text-sm text-gray-600 mt-1">
            Add countries where Agent {initialData.salesAgentId} had sales activity on {initialData.date}
          </p>
        </div>
        {!showAddCountryDropdown ? (
          <Button 
            type="button"
            variant="outline" 
            onClick={addCountry}
            disabled={activeCountries.length >= TARGET_COUNTRIES.length}
          >
            + Add Country
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Select
              value={selectedCountryToAdd}
              onChange={(e) => setSelectedCountryToAdd(e.target.value)}
              className="min-w-48"
            >
              {TARGET_COUNTRIES.filter(country => !activeCountries.includes(country.code)).map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
            <Button 
              type="button"
              onClick={handleAddSelectedCountry}
              disabled={!selectedCountryToAdd}
              size="sm"
            >
              Add
            </Button>
            <Button 
              type="button"
              variant="outline"
              onClick={cancelAddCountry}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>


      <div className="space-y-4">
        {activeCountries.map((countryCode) => {
          const country = TARGET_COUNTRIES.find(c => c.code === countryCode);
          const data = countryData[countryCode] || {};
          
          return (
            <Card key={countryCode} className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{country?.name}</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCountry(countryCode)}
                  >
                    Remove
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm">Deals Closed *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.dealsClosed || 0}
                      onChange={(e) => updateCountryData(countryCode, 'dealsClosed', e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">Number of successful sales</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">WhatsApp Messages *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.whatsappMessages || 0}
                      onChange={(e) => updateCountryData(countryCode, 'whatsappMessages', e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">Messages sent to prospects</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Quality Rating *</Label>
                    <Select
                      value={data.qualityRating || 'standard'}
                      onChange={(e) => updateCountryData(countryCode, 'qualityRating', e.target.value)}
                    >
                      {QUALITY_RATINGS.map((rating) => (
                        <option key={rating.value} value={rating.value}>
                          {rating.label}
                        </option>
                      ))}
                    </Select>
                    <p className="text-xs text-gray-500">Performance quality assessment</p>
                  </div>
                </div>

                {/* Quick Stats Display */}
                {data.dealsClosed > 0 && data.whatsappMessages > 0 && (
                  <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                    <strong>Conversion Rate:</strong> {((data.dealsClosed / data.whatsappMessages) * 100).toFixed(1)}%
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {activeCountries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No countries added yet. Click "Add Country" to start entering sales data.</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('agent_selection')}
        >
          ← Previous: Agent Selection
        </Button>
        <Button type="submit" disabled={activeCountries.length === 0}>
          Next: Deal Allocation →
        </Button>
      </div>
    </form>
  );
}

function DealAllocationStep({ onSubmit, initialData, setCurrentStep, showError }: any) {
  const [dealAllocations, setDealAllocations] = useState<Record<string, any>>(
    initialData.dealAllocations || {}
  );

  // Generate deal structure based on country data
  const dealStructure = Object.entries(initialData.countryData || {}).map(([countryCode, data]: [string, any]) => ({
    countryCode,
    country: TARGET_COUNTRIES.find(c => c.code === countryCode),
    dealsClosed: data.dealsClosed,
    deals: Array.from({ length: data.dealsClosed }, (_, index) => ({
      dealNumber: index + 1,
      key: `${countryCode}-deal-${index + 1}`
    }))
  }));

  const updateDealDestination = (dealKey: string, destinationId: string) => {
    setDealAllocations(prev => ({
      ...prev,
      [dealKey]: destinationId
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all deals have destinations
    const totalDeals = dealStructure.reduce((sum, country) => sum + country.dealsClosed, 0);
    const allocatedDeals = Object.keys(dealAllocations).length;
    
    if (allocatedDeals < totalDeals) {
      showError?.('Incomplete Deal Allocation', `Please allocate all ${totalDeals} deals to destination countries. Currently ${allocatedDeals} deals allocated.`);
      return;
    }
    
    onSubmit({ dealAllocations });
  };

  const totalDeals = dealStructure.reduce((sum, country) => sum + country.dealsClosed, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-base font-medium">Deal Destination Allocation</Label>
        <p className="text-sm text-gray-600 mt-1">
          Assign each closed deal to its destination country. Total deals to allocate: <strong>{totalDeals}</strong>
        </p>
      </div>

      {totalDeals === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No deals to allocate. Go back to add deals closed in previous step.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {dealStructure.map((countryInfo) => (
            <Card key={countryInfo.countryCode} className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {countryInfo.country?.name} - {countryInfo.dealsClosed} Deals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {countryInfo.deals.map((deal) => (
                    <div key={deal.key} className="p-3 border rounded-lg">
                      <Label className="text-sm font-medium">
                        Deal #{deal.dealNumber}
                      </Label>
                      <Select
                        value={dealAllocations[deal.key] || ''}
                        onChange={(e) => updateDealDestination(deal.key, e.target.value)}
                        placeholder="Select destination"
                        className="mt-2"
                      >
                        {DESTINATION_COUNTRIES.map((dest) => (
                          <option key={dest.code} value={dest.code}>
                            {dest.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('country_data')}
        >
          ← Previous: Country Data
        </Button>
        <Button type="submit" disabled={totalDeals === 0}>
          Next: Review →
        </Button>
      </div>
    </form>
  );
}

function ReviewStep({ onSubmit, data, setCurrentStep, onCancel }: any) {
  const totalDeals = Object.values(data.countryData || {}).reduce((sum: number, country: any) => 
    sum + (country.dealsClosed || 0), 0
  );
  
  const totalMessages = Object.values(data.countryData || {}).reduce((sum: number, country: any) => 
    sum + (country.whatsappMessages || 0), 0
  );

  const overallConversionRate = totalMessages > 0 ? (totalDeals / totalMessages) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Review Sales Report</Label>
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
              <span>Sales Agent:</span>
              <span className="font-medium">Agent {data.salesAgentId}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Deals:</span>
              <span className="font-medium text-green-600">{totalDeals}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Messages:</span>
              <span className="font-medium">{totalMessages}</span>
            </div>
            <div className="flex justify-between">
              <span>Conversion Rate:</span>
              <span className="font-medium text-blue-600">{overallConversionRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Country Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.countryData || {}).map(([countryCode, countryInfo]: [string, any]) => {
              const country = TARGET_COUNTRIES.find(c => c.code === countryCode);
              const rating = QUALITY_RATINGS.find(r => r.value === countryInfo.qualityRating);
              
              return (
                <div key={countryCode} className="border-b pb-2 last:border-b-0">
                  <div className="font-medium">{country?.name}</div>
                  <div className="text-sm text-gray-600">
                    {countryInfo.dealsClosed} deals • {countryInfo.whatsappMessages} messages • {rating?.label}
                  </div>
                  {countryInfo.whatsappMessages > 0 && (
                    <div className="text-sm text-blue-600">
                      {((countryInfo.dealsClosed / countryInfo.whatsappMessages) * 100).toFixed(1)}% conversion
                    </div>
                  )}
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
          onClick={() => setCurrentStep('deal_allocation')}
        >
          ← Previous: Deal Allocation
        </Button>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(data)}>
            Submit Sales Report →
          </Button>
        </div>
      </div>
    </div>
  );
}