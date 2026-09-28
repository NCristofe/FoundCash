import type { ReactNode } from 'react';
import { priorityMeta, type Priority, type Tone } from '../../data/content';
import './Badge.css';

interface BadgeProps {
  tone: Tone;
  children: ReactNode;
  withDot?: boolean;
}

export function Badge({ tone, children, withDot = true }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}`}>
      {withDot && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, tone } = priorityMeta[priority];
  return <Badge tone={tone}>{label}</Badge>;
}
