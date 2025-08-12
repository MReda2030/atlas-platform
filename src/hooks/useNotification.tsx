import { useState, useCallback } from 'react'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationState {
  isOpen: boolean
  type: NotificationType
  title: string
  message: string
}

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  type: 'danger' | 'warning' | 'info'
  confirmText: string
  cancelText: string
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })

  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  })

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string
  ) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message
    })
  }, [])

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }, [])

  const showSuccess = useCallback((title: string, message: string) => {
    showNotification('success', title, message)
  }, [showNotification])

  const showError = useCallback((title: string, message: string) => {
    showNotification('error', title, message)
  }, [showNotification])

  const showWarning = useCallback((title: string, message: string) => {
    showNotification('warning', title, message)
  }, [showNotification])

  const showInfo = useCallback((title: string, message: string) => {
    showNotification('info', title, message)
  }, [showNotification])

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      type?: 'danger' | 'warning' | 'info'
      confirmText?: string
      cancelText?: string
    }
  ) => {
    setConfirm({
      isOpen: true,
      title,
      message,
      onConfirm,
      type: options?.type || 'warning',
      confirmText: options?.confirmText || 'Confirm',
      cancelText: options?.cancelText || 'Cancel'
    })
  }, [])

  const hideConfirm = useCallback(() => {
    setConfirm(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    // Notification state
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Confirm state  
    confirm,
    showConfirm,
    hideConfirm
  }
}