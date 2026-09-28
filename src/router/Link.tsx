import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { navigate, useLocation } from './router';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  /** Classe extra aplicada quando a rota atual é exatamente `to`. */
  activeClassName?: string;
}

export function Link({ to, activeClassName, className = '', onClick, children, ...rest }: LinkProps) {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(to);
  };

  return (
    <a
      href={to}
      className={`${className} ${isActive && activeClassName ? activeClassName : ''}`.trim()}
      aria-current={isActive ? 'page' : undefined}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
