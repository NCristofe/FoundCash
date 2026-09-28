import { Lock } from 'lucide-react';
import { Link } from '../../router/Link';

/** Aviso exibido quando um recurso é exclusivo do plano Pro. */
export function ProLock({ feature }: { feature: string }) {
  return (
    <div className="panel pro-lock">
      <Lock size={22} aria-hidden="true" />
      <div>
        <h2 className="panel-title">{feature} é um recurso do plano Pro</h2>
        <p className="text-muted">Mude de plano nas configurações para liberar.</p>
      </div>
      <Link to="/app/configuracoes" className="btn btn-primary btn-sm">
        Ver planos
      </Link>
    </div>
  );
}
