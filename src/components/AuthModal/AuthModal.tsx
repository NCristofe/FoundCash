import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { CircleCheck, Loader2, X } from 'lucide-react';
import type { AuthMode, AuthState } from '../../context/uiContext';
import { audiences } from '../../data/content';
import { getPlanById, pricingPlans, type PlanId } from '../../data/pricing';
import { LogoMark } from '../common/Logo';
import './AuthModal.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SIMULATED_DELAY = 900;

type FieldName = 'name' | 'email' | 'business' | 'password';
type FormValues = Record<FieldName, string>;
type FormErrors = Partial<Record<FieldName, string>>;
type Status = 'idle' | 'submitting' | 'success';

interface FieldProps {
  name: FieldName;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

function Field({ name, label, type = 'text', autoComplete, placeholder, value, error, onChange }: FieldProps) {
  const id = `auth-${name}`;
  const errorId = `${id}-erro`;

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="auth-error">
          {error}
        </p>
      )}
    </div>
  );
}

interface AuthFormProps {
  initialMode: AuthMode;
  initialPlan: PlanId;
  onClose: () => void;
}

function AuthForm({ initialMode, initialPlan, onClose }: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [planId, setPlanId] = useState<PlanId>(initialPlan);
  const [values, setValues] = useState<FormValues>({ name: '', email: '', business: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const isSignup = mode === 'signup';

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (isSignup && values.name.trim().length < 2) next.name = 'Informe seu nome.';
    if (!EMAIL_PATTERN.test(values.email.trim())) next.email = 'Informe um e-mail válido.';
    if (!isSignup && values.password.length < 6) next.password = 'A senha deve ter pelo menos 6 caracteres.';
    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    const firstInvalid = (Object.keys(nextErrors) as FieldName[])[0];
    if (firstInvalid) {
      document.getElementById(`auth-${firstInvalid}`)?.focus();
      return;
    }

    setStatus('submitting');
    timer.current = window.setTimeout(() => setStatus('success'), SIMULATED_DELAY);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrors({});
  };

  if (status === 'success') {
    const firstName = values.name.trim().split(' ')[0];
    return (
      <div className="auth-success" role="status">
        <CircleCheck size={48} aria-hidden="true" />
        <h2 id="auth-titulo" className="auth-title">
          {isSignup ? `Tudo certo${firstName ? `, ${firstName}` : ''}!` : 'Login realizado!'}
        </h2>
        <p className="auth-subtitle">
          {isSignup
            ? `Seu cadastro no plano ${getPlanById(planId).name} foi recebido. Nesta versão de demonstração, a criação de conta é simulada.`
            : 'Nesta versão de demonstração, o acesso ao painel é simulado.'}
        </p>
        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-head">
        <LogoMark size={36} />
        <h2 id="auth-titulo" className="auth-title">
          {isSignup ? 'Encontre suas oportunidades' : 'Entrar no FoundCash'}
        </h2>
        <p className="auth-subtitle">
          {isSignup ? 'Crie sua conta em poucos minutos. Sem cartão de crédito.' : 'Bom te ver de novo.'}
        </p>
      </div>

      {isSignup && (
        <fieldset className="auth-plans">
          <legend>Plano</legend>
          {pricingPlans.map((plan) => (
            <label key={plan.id} className={`auth-plan ${planId === plan.id ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name="plan"
                value={plan.id}
                checked={planId === plan.id}
                onChange={() => setPlanId(plan.id)}
              />
              <span className="auth-plan-name">{plan.name}</span>
              <span className="auth-plan-price">
                {plan.monthlyPrice === 0 ? 'R$ 0' : `R$ ${plan.monthlyPrice}/mês`}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {isSignup && (
        <Field
          name="name"
          label="Nome"
          autoComplete="name"
          placeholder="Como podemos te chamar?"
          value={values.name}
          error={errors.name}
          onChange={handleChange}
        />
      )}

      <Field
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@empresa.com.br"
        value={values.email}
        error={errors.email}
        onChange={handleChange}
      />

      {isSignup ? (
        <div className="auth-field">
          <label htmlFor="auth-business">
            Tipo de negócio <span className="auth-optional">(opcional)</span>
          </label>
          <select id="auth-business" name="business" value={values.business} onChange={handleChange}>
            <option value="">Selecione</option>
            {audiences.map((audience) => (
              <option key={audience.title} value={audience.title}>
                {audience.title}
              </option>
            ))}
            <option value="Outro">Outro</option>
          </select>
        </div>
      ) : (
        <Field
          name="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          value={values.password}
          error={errors.password}
          onChange={handleChange}
        />
      )}

      <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={status === 'submitting'}>
        {status === 'submitting' && <Loader2 className="auth-spinner" size={18} aria-hidden="true" />}
        {status === 'submitting' ? 'Enviando…' : isSignup ? 'Criar minha conta' : 'Entrar'}
      </button>

      <p className="auth-switch">
        {isSignup ? 'Já tem uma conta?' : 'Ainda não tem conta?'}{' '}
        <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
          {isSignup ? 'Entrar' : 'Criar conta grátis'}
        </button>
      </p>
    </form>
  );
}

interface AuthModalProps {
  state: AuthState | null;
  onClose: () => void;
}

export function AuthModal({ state, onClose }: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isOpen = state !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('input:not([type="radio"])')?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="auth-modal"
      aria-labelledby="auth-titulo"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="auth-panel">
        <button type="button" className="auth-close" onClick={onClose} aria-label="Fechar">
          <X size={20} aria-hidden="true" />
        </button>
        {state && <AuthForm initialMode={state.mode} initialPlan={state.planId} onClose={onClose} />}
      </div>
    </dialog>
  );
}
