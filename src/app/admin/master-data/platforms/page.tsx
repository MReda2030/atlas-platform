'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable from '../_components/DataTable'
import { Megaphone, X, Check, AlertCircle, Share2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { NotificationModal, ConfirmModal } from '@/components/ui/modal'

interface Platform {
  id: string
  name: string
  code: string
  is_active: boolean | null
  created_at: string
  updated_at: string
  _count?: {
    campaignDetails: number
  }
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '',
    isActive: true 
  })
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

  // Fetch platforms
  const fetchPlatforms = async () => {
    try {
      const response = await fetch('/api/master-data/platforms')
      const data = await response.json()
      if (data.success) {
        setPlatforms(data.data)
      }
    } catch (error) {
      console.error('Error fetching platforms:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlatforms()
  }, [fetchPlatforms])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const url = '/api/master-data/platforms'
      const method = editingPlatform ? 'PUT' : 'POST'
      const body = editingPlatform 
        ? { ...formData, id: editingPlatform.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingPlatform ? 'Platform updated successfully' : 'Platform created successfully')
        fetchPlatforms()
        handleCloseModal()
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (error) {
      setError('Failed to save platform')
    }
  }

  // Handle delete
  const handleDelete = async (platform: Platform) => {
    showConfirm(
      'Delete Advertising Platform',
      `Are you sure you want to delete ${platform.name}? This action cannot be undone.`,
      () => deletePlatformConfirmed(platform),
      { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
    )
  }

  const deletePlatformConfirmed = async (platform: Platform) => {
    try {
      const response = await fetch(`/api/master-data/platforms?id=${platform.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        fetchPlatforms()
      } else {
        setError(data.error || 'Failed to delete platform')
      }
    } catch (error) {
      setError('Failed to delete platform')
    }
  }

  // Handle modal
  const handleAdd = useCallback(() => {
    setEditingPlatform(null)
    setFormData({ name: '', code: '', isActive: true })
    setShowModal(true)
  }, [])

  const handleEdit = useCallback((platform: Platform) => {
    setEditingPlatform(platform)
    setFormData({ 
      name: platform.name, 
      code: platform.code,
      isActive: platform.is_active ?? true
    })
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditingPlatform(null)
    setFormData({ name: '', code: '', isActive: true })
    setError('')
  }, [])

  const platformIcons: { [key: string]: string } = {
    META: 'ⓕ',
    GOOGLE: 'Ⓖ',
    TIKTOK: '৳',
    SNAPCHAT: '◙',
    TWITTER: '𝕏'
  }

  const columns = [
    {
      key: 'name',
      label: 'Platform',
      sortable: true,
      render: (value: string, row: Platform) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">{platformIcons[row.code] || 'Ⓟ'}</span>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded text-sm font-mono font-medium">
          {value}
        </span>
      )
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (value: boolean | null) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
               : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'campaigns',
      label: 'Campaigns',
      render: (value: any, row: Platform) => (
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-gray-400" />
          <span>{row._count?.campaignDetails || 0}</span>
        </div>
      )
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
            Advertising Platforms Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage advertising platforms for campaigns
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
        title="Advertising Platforms"
        columns={columns}
        data={platforms}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search platforms..."
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingPlatform ? 'Edit Platform' : 'Add New Platform'}
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
                  Platform Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Meta"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platform Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  placeholder="e.g., META"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unique identifier for the platform
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active
                  </span>
                </label>
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
                  {editingPlatform ? 'Update' : 'Create'}
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