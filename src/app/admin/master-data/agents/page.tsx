'use client'

import { useState, useEffect, useCallback } from 'react'
import DataTable from '../_components/DataTable'
import { Users, X, Check, AlertCircle, User, Building2 } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { NotificationModal, ConfirmModal } from '@/components/ui/modal'

interface Agent {
  id: string
  agentNumber: string
  name: string | null
  branchId: string | null
  isActive: boolean | null
  createdAt: string
  updated_at: string
  branch?: {
    id: string
    name: string
    code: string
  }
  _count?: {
    mediaAgentData: number
    salesReports: number
  }
}

interface Branch {
  id: string
  name: string
  code: string
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [formData, setFormData] = useState({
    agentNumber: '',
    name: '',
    branchId: '',
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

  // Fetch agents and branches
  const fetchData = async () => {
    try {
      const [agentsRes, branchesRes] = await Promise.all([
        fetch('/api/master-data/agents'),
        fetch('/api/master-data/branches')
      ])

      const agentsData = await agentsRes.json()
      const branchesData = await branchesRes.json()

      if (agentsData.success) {
        setAgents(agentsData.data)
      }
      if (branchesData.success) {
        setBranches(branchesData.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const url = '/api/master-data/agents'
      const method = editingAgent ? 'PUT' : 'POST'
      const body = editingAgent 
        ? { ...formData, id: editingAgent.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingAgent ? 'Agent updated successfully' : 'Agent created successfully')
        fetchData()
        handleCloseModal()
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch (error) {
      setError('Failed to save agent')
    }
  }

  // Handle delete
  const handleDelete = async (agent: Agent) => {
    showConfirm(
      'Delete Sales Agent',
      `Are you sure you want to delete Agent ${agent.agentNumber}? This action cannot be undone.`,
      () => deleteAgentConfirmed(agent),
      { type: 'danger', confirmText: 'Delete', cancelText: 'Cancel' }
    )
  }

  const deleteAgentConfirmed = async (agent: Agent) => {
    try {
      const response = await fetch(`/api/master-data/agents?id=${agent.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)
        fetchData()
      } else {
        setError(data.error || 'Failed to delete agent')
      }
    } catch (error) {
      setError('Failed to delete agent')
    }
  }

  // Handle modal
  const handleAdd = useCallback(() => {
    setEditingAgent(null)
    setFormData({
      agentNumber: '',
      name: '',
      branchId: branches[0]?.id || '',
      isActive: true
    })
    setShowModal(true)
  }, [])

  const handleEdit = useCallback((agent: Agent) => {
    setEditingAgent(agent)
    setFormData({
      agentNumber: agent.agentNumber,
      name: agent.name || '',
      branchId: agent.branchId || '',
      isActive: agent.isActive ?? true
    })
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditingAgent(null)
    setFormData({
      agentNumber: '',
      name: '',
      branchId: '',
      isActive: true
    })
    setError('')
  }, [])

  const columns = [
    {
      key: 'agentNumber',
      label: 'Agent #',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-400" />
          <span className="font-mono font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string | null) => value || <span className="text-gray-400">-</span>
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (value: any) => value ? (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <span>{value.name}</span>
        </div>
      ) : <span className="text-gray-400">-</span>
    },
    {
      key: 'isActive',
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
      key: 'reports',
      label: 'Reports',
      render: (value: any, row: Agent) => (
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {row._count?.salesReports || 0} sales, {row._count?.mediaAgentData || 0} media
          </span>
        </div>
      )
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
            Sales Agent Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage sales agents and their branch assignments
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
        title="Sales Agents"
        columns={columns}
        data={agents}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search agents..."
      />

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingAgent ? 'Edit Agent' : 'Add New Agent'}
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
                  Agent Number
                </label>
                <input
                  type="text"
                  value={formData.agentNumber}
                  onChange={(e) => setFormData({ ...formData, agentNumber: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  placeholder="e.g., 21"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Agent Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} ({branch.code})
                    </option>
                  ))}
                </select>
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
                  {editingAgent ? 'Update' : 'Create'}
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