import type { ReactNode } from 'react';
import { Reveal } from './Reveal';
import './SectionHeader.css';

interface SectionHeaderProps {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'center' | 'left';
}

export function SectionHeader({ id, eyebrow, title, lead, align = 'center' }: SectionHeaderProps) {
  return (
    <Reveal className={`section-header section-header--${align}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="section-title">
        {title}
      </h2>
      {lead && <p className="section-lead">{lead}</p>}
    </Reveal>
  );
}
