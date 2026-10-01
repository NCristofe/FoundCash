import { useEffect, useState, type FormEvent } from 'react';
import { CircleCheck, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { FormField } from '../../components/common/FormField';
import { LogoMark } from '../../components/common/Logo';
import {
  billingCycleLabels,
  priceFor,
  pricingPlans,
  TRIAL_DAYS,
  type BillingCycle,
  type PlanId,
} from '../../data/pricing';
import { checkEmail } from '../../utils/emailCheck';
import { friendlyError, isBackendConfigured, supabase } from '../../lib/supabase';
import { Link } from '../../router/Link';
import { navigate, useLocation } from '../../router/router';
import './AuthPage.css';

export type AuthPageMode = 'login' | 'signup' | 'forgot' | 'reset';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

type Errors = Partial<Record<'name' | 'email' | 'password', string>>;

const titles: Record<AuthPageMode, { title: string; subtitle: string }> = {
  signup: {
    title: 'Encontre o dinheiro parado nas suas propostas',
    subtitle: `${TRIAL_DAYS} dias grátis. Sem cartão de crédito.`,
  },
  login: { title: 'Entrar no FoundCash', subtitle: 'Bom te ver de novo.' },
  forgot: { title: 'Recuperar senha', subtitle: 'Enviaremos um link para você criar uma nova senha.' },
  reset: { title: 'Criar nova senha', subtitle: `Use pelo menos ${MIN_PASSWORD} caracteres.` },
};

function isPlanId(value: string | null): value is PlanId {
  return value === 'essencial' || value === 'pro';
}

function isCycle(value: string | null): value is BillingCycle {
  return value === 'monthly' || value === 'annual';
}

export function AuthPage({ mode }: { mode: AuthPageMode }) {
  const { session } = useAuth();
  const { searchParams } = useLocation();
  const planParam = searchParams.get('plano');
  const cycleParam = searchParams.get('ciclo');

  const [planId, setPlanId] = useState<PlanId>(isPlanId(planParam) ? planParam : 'essencial');
  const [cycle, setCycle] = useState<BillingCycle>(isCycle(cycleParam) ? cycleParam : 'monthly');
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const [confirmedTypoFor, setConfirmedTypoFor] = useState<string | null>(null);

  // Quem já está logado não precisa ver login/cadastro.
  useEffect(() => {
    if (session && (mode === 'login' || mode === 'signup')) navigate('/app', { replace: true });
  }, [session, mode]);

  const validate = (): Errors => {
    const next: Errors = {};
    if (mode === 'signup' && name.trim().length < 2) next.name = 'Informe seu nome.';
    if (mode !== 'reset' && !EMAIL_PATTERN.test(email.trim())) next.email = 'Informe um e-mail válido.';
    if ((mode === 'signup' || mode === 'reset') && password.length < MIN_PASSWORD) {
      next.password = `A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`;
    }
    if (mode === 'login' && !password) next.password = 'Informe sua senha.';
    return next;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    setFormError(null);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      document.getElementById(`auth-${firstInvalid}`)?.focus();
      return;
    }

    setSubmitting(true);
    const origin = window.location.origin;

    try {
      if (mode === 'signup') {
        const check = await checkEmail(email);
        if (check.status === 'invalid') {
          setErrors({ email: check.message });
          document.getElementById('auth-email')?.focus();
          return;
        }
        if (check.status === 'typo' && confirmedTypoFor !== email.trim()) {
          setEmailSuggestion(check.suggestion);
          setErrors({ email: check.message });
          document.getElementById('auth-email')?.focus();
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${origin}/app/boas-vindas`,
            data: { full_name: name.trim(), business_name: business.trim(), plan: planId, billing_cycle: cycle },
          },
        });
        if (error) throw error;
        // Com confirmação por e-mail, o Supabase não dá erro para e-mail repetido: devolve `identities` vazio.
        if (data.user && data.user.identities?.length === 0) {
          setErrors({ email: 'Já existe uma conta com este e-mail. Tente entrar.' });
          return;
        }
        if (data.session) navigate('/app/boas-vindas', { replace: true });
        else setSentTo(email.trim());
      }

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        navigate('/app', { replace: true });
      }

      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${origin}/redefinir-senha`,
        });
        if (error) throw error;
        setSentTo(email.trim());
      }

      if (mode === 'reset') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        navigate('/app', { replace: true });
      }
    } catch (error) {
      setFormError(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const { title, subtitle } = titles[mode];

  return (
    <main className="auth-page">
      <div className="auth-glow" aria-hidden="true" />
      <div className="auth-card">
        <Link to="/" className="auth-logo" aria-label="FoundCash — página inicial">
          <LogoMark size={40} />
        </Link>

        {!isBackendConfigured ? (
          <div className="auth-notice">
            <h1 className="auth-title">Backend não configurado</h1>
            <p className="auth-subtitle">
              Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> no arquivo{' '}
              <code>.env.local</code> e reinicie o servidor. Veja o README.
            </p>
          </div>
        ) : sentTo ? (
          <div className="auth-notice" role="status">
            {mode === 'signup' ? <MailCheck size={44} aria-hidden="true" /> : <CircleCheck size={44} aria-hidden="true" />}
            <h1 className="auth-title">Confira seu e-mail</h1>
            <p className="auth-subtitle">
              {mode === 'signup'
                ? `Enviamos um link de confirmação para ${sentTo}. Depois de confirmar, você cai direto no seu painel.`
                : `Se existir uma conta com ${sentTo}, você vai receber o link para criar uma nova senha.`}
            </p>
            <Link to="/entrar" className="btn btn-secondary btn-block">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-head">
              <h1 className="auth-title">{title}</h1>
              <p className="auth-subtitle">{subtitle}</p>
            </div>

            {mode === 'signup' && (
              <fieldset className="auth-plans">
                <legend>Plano após o teste</legend>
                <div className="auth-cycle" role="radiogroup" aria-label="Ciclo de cobrança">
                  {(['monthly', 'annual'] as BillingCycle[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      role="radio"
                      aria-checked={cycle === option}
                      className={cycle === option ? 'is-active' : ''}
                      onClick={() => setCycle(option)}
                    >
                      {billingCycleLabels[option]}
                    </button>
                  ))}
                </div>
                <div className="auth-plan-options">
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
                      <span className="auth-plan-price">R$ {priceFor(plan, cycle)}/mês</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {mode === 'signup' && (
              <>
                <FormField
                  id="auth-name"
                  label="Seu nome"
                  autoComplete="name"
                  value={name}
                  error={errors.name}
                  onChange={(event) => setName(event.target.value)}
                />
                <FormField
                  id="auth-business"
                  label={
                    <>
                      Empresa <span className="field-optional">(opcional)</span>
                    </>
                  }
                  autoComplete="organization"
                  placeholder="Ex.: Sol Forte Energia"
                  value={business}
                  onChange={(event) => setBusiness(event.target.value)}
                />
              </>
            )}

            {mode !== 'reset' && (
              <FormField
                id="auth-email"
                label="E-mail"
                type="email"
                autoComplete="email"
                value={email}
                error={errors.email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailSuggestion(null);
                }}
              />
            )}

            {mode === 'signup' && emailSuggestion && (
              <p className="field-hint">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setEmail(emailSuggestion);
                    setEmailSuggestion(null);
                    setErrors({});
                  }}
                >
                  Usar {emailSuggestion}
                </button>
                {' · '}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setConfirmedTypoFor(email.trim());
                    setEmailSuggestion(null);
                    setErrors({});
                  }}
                >
                  Manter como está
                </button>
              </p>
            )}

            {mode !== 'forgot' && (
              <FormField
                id="auth-password"
                label={mode === 'reset' ? 'Nova senha' : 'Senha'}
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                error={errors.password}
                onChange={(event) => setPassword(event.target.value)}
              />
            )}

            {mode === 'login' && (
              <Link to="/recuperar-senha" className="auth-inline-link">
                Esqueci minha senha
              </Link>
            )}

            {formError && (
              <p className="auth-form-error" role="alert">
                {formError}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting && <Loader2 className="spin" size={18} aria-hidden="true" />}
              {mode === 'signup' && 'Começar meu teste grátis'}
              {mode === 'login' && 'Entrar'}
              {mode === 'forgot' && 'Enviar link'}
              {mode === 'reset' && 'Salvar nova senha'}
            </button>

            <p className="auth-switch">
              {mode === 'signup' ? (
                <>
                  Já tem uma conta? <Link to="/entrar">Entrar</Link>
                </>
              ) : mode === 'login' ? (
                <>
                  Ainda não tem conta? <Link to="/cadastro">Testar grátis</Link>
                </>
              ) : (
                <Link to="/entrar">Voltar para o login</Link>
              )}
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
