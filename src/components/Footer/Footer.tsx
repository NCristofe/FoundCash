import { footerLinks } from '../../data/content';
import { signupPath } from '../../data/pricing';
import { useUI } from '../../context/useUI';
import { Link } from '../../router/Link';
import { Logo } from '../common/Logo';
import './Footer.css';

const legalLinks = ['Termos de Uso', 'Política de Privacidade'];

export function Footer() {
  const { showToast } = useUI();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p>Existe dinheiro parado nas suas propostas. O FoundCash ajuda você a encontrar.</p>
          </div>

          <nav aria-label="Rodapé">
            <ul className="footer-links">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
              <li>
                <Link to="/entrar">Entrar</Link>
              </li>
              <li>
                <Link to={signupPath()}>Criar conta</Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="footer-bottom">
          <p>© 2026 FoundCash. Todos os direitos reservados.</p>
          <ul className="footer-legal">
            {legalLinks.map((label) => (
              <li key={label}>
                <button type="button" onClick={() => showToast(`${label}: documento disponível em breve.`)}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
