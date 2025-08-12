'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable from '../_components/DataTable'
import { Building2, X, Check, AlertCircle } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { NotificationModal, ConfirmModal } from '@/components/ui/modal'

interface Branch {
  id: string
  name: string
  code: string
  createdAt: string
  updated_at: string
  _count?: {
    users: number
    salesAgents: number
    mediaReports: number
    salesReports: number
  }
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
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

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/master-data/branches')
      const data = await response.json()
      if (data.success) {
        setBranches(data.data)
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [fetchBranches])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const url = '/api/master-data/branches'
      const method = editingBranch ? 'PUT' : 'POST'
      const body = editingBranch 
        ? { ...formData, id: editingBranch.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingBranch ? 'Branch updated successfully' : 'Branch created successfully')
        fetchBranches()
        handleCloseModal()
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (error) {
      setError('Failed to save branch')
    }
  }

  // Handle delete
  const handleDelete = async (branch: Branch) => {
    showConfirm(
      'Delete Branch',
      `Are you sure you want to delete ${branch.name}? This action cannot be undone.`,
      () => deleteBranchConfirmed(branch),
      { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
    )
  }

  const deleteBranchConfirmed = async (branch: Branch) => {
    try {
      const response = await fetch(`/api/master-data/branches?id=${branch.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Branch deleted successfully')
        fetchBranches()
      } else {
        setError(data.error || 'Failed to delete branch')
      }
    } catch (error) {
      setError('Failed to delete branch')
    }
  }

  // Handle modal
  const handleAdd = useCallback(() => {
    setEditingBranch(null)
    setFormData({ name: '', code: '' })
    setShowModal(true)
  }, [])

  const handleEdit = useCallback((branch: Branch) => {
    setEditingBranch(branch)
    setFormData({ name: branch.name, code: branch.code })
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditingBranch(null)
    setFormData({ name: '', code: '' })
    setError('')
  }, [])

  const columns = [
    {
      key: 'name',
      label: 'Branch Name',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'code',
      label: 'Code',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
          {value}
        </span>
      )
    },
    {
      key: 'salesAgents',
      label: 'Sales Agents',
      render: (value: any, row: Branch) => row._count?.salesAgents || 0
    },
    {
      key: 'users',
      label: 'Users',
      render: (value: any, row: Branch) => row._count?.users || 0
    },
    {
      key: 'createdAt',
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
            Branch Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage business branches and locations
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
        title="Branches"
        columns={columns}
        data={branches}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search branches..."
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
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
                  Branch Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Main Office"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  placeholder="e.g., MAIN"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Unique identifier for the branch
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
                  {editingBranch ? 'Update' : 'Create'}
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