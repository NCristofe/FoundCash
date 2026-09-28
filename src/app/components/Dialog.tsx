import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** Seletor do elemento que recebe foco ao abrir (padrão: primeiro campo). */
  initialFocus?: string;
  size?: 'md' | 'lg';
}

/** Modal acessível baseado em <dialog> nativo (foco preso, Esc fecha, foco devolvido ao fechar). */
export function Dialog({ open, onClose, title, children, initialFocus, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      const target = initialFocus
        ? dialog.querySelector<HTMLElement>(initialFocus)
        : dialog.querySelector<HTMLElement>('input:not([type="hidden"]), textarea, select');
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocus]);

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <dialog
      ref={ref}
      className={`app-dialog app-dialog--${size}`}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleClick}
    >
      <div className="app-dialog-panel">
        <header className="app-dialog-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        {open && children}
      </div>
    </dialog>
  );
}
