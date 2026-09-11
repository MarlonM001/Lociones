import { useToast } from '@/hooks/useToast'

const TYPE_CLASSES = {
  success: 'border-emerald-500/40 text-emerald-300',
  error: 'border-red-500/40 text-red-300',
  info: 'border-gold/40 text-gold-light',
}

export function ToastContainer() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[200] flex w-full max-w-xs flex-col gap-2 sm:bottom-28 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          // Fondo fijo (no depende del tema) para que el texto claro del
          // toast siempre tenga buen contraste, incluso en modo día.
          className={`pointer-events-auto animate-fade-up rounded-xl border bg-[#171513]/95 px-4 py-3 text-sm shadow-xl backdrop-blur ${TYPE_CLASSES[toast.type] ?? TYPE_CLASSES.info}`}
          onClick={() => dismissToast(toast.id)}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
