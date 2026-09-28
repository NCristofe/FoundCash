import { LogoMark } from '../../components/common/Logo';
import { Link } from '../../router/Link';

export function NotFound() {
  return (
    <main className="auth-page" style={{ textAlign: 'center' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LogoMark size={48} />
        </div>
        <h1 style={{ margin: '24px 0 8px', fontSize: '2rem' }}>Página não encontrada</h1>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          Esse endereço não existe — mas o dinheiro parado nas suas propostas existe.
        </p>
        <Link to="/" className="btn btn-primary">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
