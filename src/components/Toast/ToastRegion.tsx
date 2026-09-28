import { CircleCheck, X } from 'lucide-react';
import './Toast.css';

export interface ToastMessage {
  id: number;
  message: string;
}

interface ToastRegionProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastRegion({ toasts, onDismiss }: ToastRegionProps) {
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          <CircleCheck size={18} aria-hidden="true" />
          <p>{toast.message}</p>
          <button type="button" onClick={() => onDismiss(toast.id)} aria-label="Fechar notificação">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
