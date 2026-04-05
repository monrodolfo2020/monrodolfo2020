"use client"
import { useToast } from '@/hooks/useToast'
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from './toast'

export function Toaster() {
  const { toasts, dismiss } = useToast()
  return (
    <ToastProvider>
      {toasts.map(t => (
        <Toast key={t.id} open={t.open} onOpenChange={() => dismiss(t.id)} variant={t.variant}>
          <div className="grid gap-1">
            <ToastTitle>{t.title}</ToastTitle>
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
