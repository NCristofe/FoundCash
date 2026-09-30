import { createContext } from 'react';
import type { MessageTemplate, NewOpportunity, Opportunity, ProposalLink } from '../../lib/types';
import type { OpportunityChanges } from '../services/api';

export interface AppDataContextValue {
  opportunities: Opportunity[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  createOpportunity: (input: NewOpportunity) => Promise<Opportunity>;
  updateOpportunity: (id: string, changes: OpportunityChanges) => Promise<Opportunity>;
  removeOpportunity: (id: string) => Promise<void>;

  /** Scripts personalizados (Pro). Os scripts padrão ficam em config/niche.ts. */
  customTemplates: MessageTemplate[];
  setCustomTemplates: (templates: MessageTemplate[]) => void;

  /** Links rastreáveis das propostas (visitas e respostas do cliente alimentam o radar). */
  proposalLinks: ProposalLink[];
  saveProposalLink: (link: ProposalLink) => void;

  openQuickEntry: () => void;
  openOpportunity: (id: string) => void;
}

export const AppDataContext = createContext<AppDataContextValue | null>(null);
