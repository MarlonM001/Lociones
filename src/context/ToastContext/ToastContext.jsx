import { createContext, useCallback, useState } from 'react'

export const ToastContext = createContext(null)

let toastIdCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    toastIdCounter += 1
    const id = toastIdCounter
    setToasts((current) => [...current, { id, message, type }])
    setTimeout(() => dismissToast(id), 3000)
  }, [dismissToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}
