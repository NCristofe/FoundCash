import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { navLinks } from '../../data/content';
import { useAuth } from '../../auth/useAuth';
import { navigate } from '../../router/router';
import { Logo } from '../common/Logo';
import { StartButton } from '../common/StartButton';
import './Navbar.css';

const DESKTOP_QUERY = '(min-width: 960px)';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { session } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const handleResize = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    desktop.addEventListener('change', handleResize);
    document.body.classList.add('no-scroll');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      desktop.removeEventListener('change', handleResize);
      document.body.classList.remove('no-scroll');
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogin = () => {
    closeMenu();
    navigate(session ? '/app' : '/entrar');
  };

  return (
    <header className={`navbar ${scrolled || menuOpen ? 'is-solid' : ''}`}>
      <div className="container navbar-inner">
        <Logo />

        <nav className="navbar-links" aria-label="Navegação principal">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="navbar-actions">
          {!session && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogin}>
              Entrar
            </button>
          )}
          <StartButton size="sm" withArrow={false} label="Testar grátis" />
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="navbar-toggle"
          aria-expanded={menuOpen}
          aria-controls="menu-mobile"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <div id="menu-mobile" className="navbar-mobile">
          <nav aria-label="Navegação principal (mobile)">
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={closeMenu}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="navbar-mobile-actions">
            {!session && (
              <button type="button" className="btn btn-secondary btn-block" onClick={handleLogin}>
                Entrar
              </button>
            )}
            <StartButton block onClick={closeMenu} />
          </div>
        </div>
      )}
    </header>
  );
}
