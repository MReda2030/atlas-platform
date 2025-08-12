'use client';

import { useState } from 'react';
import SalesReportForm from '@/components/forms/sales-report-form';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useNotification } from '@/hooks/useNotification';
import { ConfirmModal } from '@/components/ui/modal';

export default function NewSalesReportPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { 
    confirm,
    hideConfirm,
    showConfirm
  } = useNotification();

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/sales-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit sales report');
      }

      const result = await response.json();
      
      // Redirect immediately to sales reports page with success parameter
      router.push('/sales?success=created');
      
    } catch (error) {
      console.error('Error submitting sales report:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit sales report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = useCallback(() => {
    showConfirm(
      'Cancel Sales Report',
      'Are you sure you want to cancel? All unsaved changes will be lost.',
      () => router.push('/sales'),
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
        {submitError && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-4">
            <strong className="font-bold">Error: </strong>
            <span>{submitError}</span>
          </div>
        )}
        
        {isSubmitting && (
          <div className="fixed top-4 right-4 z-50">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                <span className="text-sm font-medium">Submitting sales report...</span>
              </div>
            </div>
          </div>
        )}

        <SalesReportForm 
          onSubmit={handleSubmit} 
          onCancel={handleCancel}
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