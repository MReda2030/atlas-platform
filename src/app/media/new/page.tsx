'use client';

import { useState } from 'react';
import MediaReportForm from '@/components/forms/media-report-form';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useNotification } from '@/hooks/useNotification';
import { ConfirmModal } from '@/components/ui/modal';

export default function NewMediaReportPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { 
    confirm,
    hideConfirm,
    showConfirm,
    showError
  } = useNotification();
  const handleSubmit = async (data: any) => {
    console.log('Media Report Data:', data);
    setIsSubmitting(true);
    
    try {
      // Transform form data to match API schema
      const apiData = {
        date: data.date,
        branchId: data.branchId,
        countries: data.selectedCountries.map((countryCode: string) => ({
          targetCountryId: countryCode,
          agents: (data.countryAgents[countryCode] || []).map((agent: any) => ({
            salesAgentId: agent.agentId,
            campaignCount: agent.campaignCount,
            campaigns: Array.from({ length: agent.campaignCount }, (_, campaignIndex) => {
              const campaignKey = `${countryCode}-${agent.agentId}-${campaignIndex}`;
              const campaignData = data.campaigns[campaignKey] || {};
              return {
                destinationCountryId: campaignData.destinationId,
                amount: parseFloat(campaignData.amount || '0'),
                platformId: campaignData.platformId,
              };
            }),
          })),
        })),
      };

      const response = await fetch('/api/media-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }

      const result = await response.json();
      // Redirect immediately to media reports page with success parameter
      window.location.href = '/media?success=created';
    } catch (error) {
      console.error('Error submitting report:', error);
      showError(
        'Error Submitting Report',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = useCallback(() => {
    showConfirm(
      'Cancel Media Report',
      'Are you sure you want to cancel? All entered data will be lost.',
      () => window.location.href = '/media',
      {
        type: 'warning',
        confirmText: 'Yes, Cancel',
        cancelText: 'Continue Editing'
      }
    );
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
              New Media Report
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Create a daily media campaign report with agent assignments and spend details
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/media">
              ← Back to Media Reports
            </Link>
          </Button>
        </div>

        {isSubmitting && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="text-sm font-medium">Submitting media report...</span>
              </div>
            </div>
          </div>
        )}

        <MediaReportForm 
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          showError={showError}
        />

        {/* Confirm Modal */}
        <ConfirmModal
          isOpen={confirm.isOpen}
          onClose={hideConfirm}
          onConfirm={confirm.onConfirm}
          title={confirm.title}
          message={confirm.message}
          type={confirm.type}
          confirmText={confirm.confirmText}
          cancelText={confirm.cancelText}
        />
      </div>
    </DashboardLayout>
  );
}