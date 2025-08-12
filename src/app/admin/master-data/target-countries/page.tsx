'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable from '../_components/DataTable'
import { Globe, X, Check, AlertCircle, Flag } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { NotificationModal, ConfirmModal } from '@/components/ui/modal'

interface TargetCountry {
  id: string
  name: string
  code: string
  created_at: string
  updated_at: string
  _count?: {
    mediaCountryData: number
    salesCountryData: number
  }
}

export default function TargetCountriesPage() {
  const [countries, setCountries] = useState<TargetCountry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCountry, setEditingCountry] = useState<TargetCountry | null>(null)
  const [formData, setFormData] = useState({ name: '', code: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { 
    notification, 
    hideNotification, 
    showSuccess, 
    showError,
    confirm,
    hideConfirm,
    showConfirm
  } = useNotification()

  // Fetch countries
  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/master-data/countries?type=target')
      const data = await response.json()
      if (data.success) {
        setCountries(data.data)
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCountries()
  }, [fetchCountries])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const url = '/api/master-data/countries'
      const method = editingCountry ? 'PUT' : 'POST'
      const body = editingCountry 
        ? { ...formData, id: editingCountry.id, type: 'target' }
        : { ...formData, type: 'target' }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingCountry ? 'Country updated successfully' : 'Country created successfully')
        fetchCountries()
        handleCloseModal()
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (error) {
      setError('Failed to save country')
    }
  }

  // Handle delete
  const handleDelete = async (country: TargetCountry) => {
    showConfirm(
      'Delete Target Country',
      `Are you sure you want to delete ${country.name}? This action cannot be undone.`,
      () => deleteCountryConfirmed(country),
      { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
    )
  }

  const deleteCountryConfirmed = async (country: TargetCountry) => {

    try {
      const response = await fetch(`/api/master-data/countries?id=${country.id}&type=target`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Country deleted successfully')
        fetchCountries()
      } else {
        setError(data.error || 'Failed to delete country')
      }
    } catch (error) {
      setError('Failed to delete country')
    }
  }

  // Handle modal
  const handleAdd = useCallback(() => {
    setEditingCountry(null)
    setFormData({ name: '', code: '' })
    setShowModal(true)
  }, [])

  const handleEdit = useCallback((country: TargetCountry) => {
    setEditingCountry(country)
    setFormData({ name: country.name, code: country.code })
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditingCountry(null)
    setFormData({ name: '', code: '' })
    setError('')
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Country Name',
      sortable: true,
      render: (value: string, row: TargetCountry) => (
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded text-sm font-mono font-medium">
          {value}
        </span>
      )
    },
    {
      key: 'mediaReports',
      label: 'Media Reports',
      render: (value: any, row: TargetCountry) => row._count?.mediaCountryData || 0
    },
    {
      key: 'salesReports',
      label: 'Sales Reports',
      render: (value: any, row: TargetCountry) => row._count?.salesCountryData || 0
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Target Countries Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage Gulf countries where marketing campaigns are targeted
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-green-700 dark:text-green-300">{success}</span>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        title="Target Countries"
        columns={columns}
        data={countries}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search countries..."
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingCountry ? 'Edit Target Country' : 'Add New Target Country'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., United Arab Emirates"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Country Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  placeholder="e.g., UAE"
                  maxLength={3}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  2-3 letter country code
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCountry ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    {/* Notification Modal */}
    <NotificationModal
      isOpen={notification.isOpen}
      onClose={hideNotification}
      type={notification.type}
      title={notification.title}
      message={notification.message}
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
  </>
  )
}