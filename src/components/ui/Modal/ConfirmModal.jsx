import { Modal } from './Modal'
import { Button } from '@/components/ui/Button'

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant="primary" size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  )
}
