import { footerLinks } from '../../data/content';
import { useUI } from '../../context/useUI';
import { Logo } from '../common/Logo';
import './Footer.css';

const legalLinks = ['Termos de Uso', 'Política de Privacidade'];

export function Footer() {
  const { openAuth, showToast } = useUI();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo />
            <p>Existe dinheiro parado nos seus orçamentos. O FoundCash ajuda você a encontrar.</p>
          </div>

          <nav aria-label="Rodapé">
            <ul className="footer-links">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => openAuth('login')}>
                  Entrar
                </button>
              </li>
              <li>
                <button type="button" onClick={() => openAuth('signup')}>
                  Criar conta
                </button>
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
