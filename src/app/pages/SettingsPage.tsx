import { useState, type FormEvent } from 'react';
import { useAuth } from '../../auth/useAuth';
import { FormField } from '../../components/common/FormField';
import { useUI } from '../../context/useUI';
import { billingCycleLabels, priceFor, pricingPlans, type BillingCycle, type PlanId } from '../../data/pricing';
import { friendlyError } from '../../lib/supabase';
import { navigate } from '../../router/router';
import { PLAN_PRICING } from '../../../supabase/functions/_shared/plans.ts';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

export function SettingsPage() {
  const { profile, session, updateProfile, signOut } = useAuth();
  const { showToast } = useUI();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [business, setBusiness] = useState(profile?.business_name ?? '');
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const save = async (changes: Parameters<typeof updateProfile>[0], message: string) => {
    setSaving(true);
    try {
      await updateProfile(changes);
      showToast(message);
    } catch (error) {
      showToast(friendlyError(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void save({ full_name: fullName.trim(), business_name: business.trim() || null }, 'Dados salvos.');
  };

  const choosePlan = (plan: PlanId, cycle: BillingCycle) => {
    if (plan === profile.desired_plan && cycle === profile.desired_cycle) return;
    void save({ desired_plan: plan, desired_cycle: cycle }, 'Preferência de plano salva.');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="settings">
      <header className="page-head">
        <div>
          <p className="page-kicker">Configurações</p>
          <h1 className="page-title">Sua conta</h1>
        </div>
      </header>

      <form className="panel settings-form" onSubmit={handleProfileSubmit}>
        <h2 className="panel-title">Dados</h2>
        <FormField id="settings-name" label="Nome" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <FormField
          id="settings-business"
          label="Empresa"
          value={business}
          onChange={(event) => setBusiness(event.target.value)}
        />
        <p className="field-hint">E-mail: {session?.user.email}</p>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          Salvar
        </button>
      </form>

      <section className="panel" aria-labelledby="plano-titulo">
        <h2 id="plano-titulo" className="panel-title">
          Plano
        </h2>
        <p className="text-muted">
          Teste grátis até {dateFormatter.format(new Date(profile.trial_ends_at))}. Plano em uso:{' '}
          <strong>{PLAN_PRICING[profile.plan].name}</strong>. Abaixo você escolhe o plano que pretende contratar; a
          ativação do Pro é feita pela nossa equipe até a cobrança automática ficar pronta.
        </p>

        <div className="settings-cycle segmented" role="radiogroup" aria-label="Ciclo de cobrança">
          {(['monthly', 'annual'] as BillingCycle[]).map((cycle) => (
            <button
              key={cycle}
              type="button"
              role="radio"
              aria-checked={profile.desired_cycle === cycle}
              disabled={saving}
              onClick={() => choosePlan(profile.desired_plan, cycle)}
            >
              {billingCycleLabels[cycle]}
            </button>
          ))}
        </div>

        <div className="settings-plans">
          {pricingPlans.map((plan) => {
            const selected = profile.desired_plan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                className={`settings-plan ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                disabled={saving}
                onClick={() => choosePlan(plan.id, profile.desired_cycle)}
              >
                <span className="settings-plan-name">{plan.name}</span>
                <span className="settings-plan-price">R$ {priceFor(plan, profile.desired_cycle)}/mês</span>
                <span className="settings-plan-desc">{plan.features.slice(0, 3).join(' · ')}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel" aria-labelledby="sessao-titulo">
        <h2 id="sessao-titulo" className="panel-title">
          Sessão
        </h2>
        <button type="button" className="btn btn-secondary" onClick={handleSignOut}>
          Sair da conta
        </button>
      </section>
    </div>
  );
}
