import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
}

/** Campo de formulário com label, dica e mensagem de erro acessíveis. */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { id, label, error, hint, className = '', ...inputProps },
  ref,
) {
  const hintId = hint ? `${id}-dica` : undefined;
  const errorId = error ? `${id}-erro` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <input ref={ref} id={id} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...inputProps} />
      {hint && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
});
