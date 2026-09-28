import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { friendlyError } from '../../lib/supabase';
import type { MessageTemplate, NewOpportunity, Opportunity } from '../../lib/types';
import { OpportunityDialog } from '../components/OpportunityDialog';
import { QuickEntryDialog } from '../components/QuickEntryDialog';
import * as api from '../services/api';
import { AppDataContext } from './appDataContext';

function sortByFollowUp(items: Opportunity[]): Opportunity[] {
  return [...items].sort((a, b) => a.follow_up_on.localeCompare(b.follow_up_on));
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<MessageTemplate[]>([]);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [items, templates] = await Promise.all([api.fetchOpportunities(), api.fetchTemplates()]);
      setOpportunities(items);
      setCustomTemplates(templates);
    } catch (loadError) {
      setError(friendlyError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createOpportunity = useCallback(async (input: NewOpportunity) => {
    const created = await api.insertOpportunity(input);
    setOpportunities((current) => sortByFollowUp([...current, created]));
    return created;
  }, []);

  const updateOpportunity = useCallback(async (id: string, changes: api.OpportunityChanges) => {
    const updated = await api.updateOpportunity(id, changes);
    setOpportunities((current) => sortByFollowUp(current.map((item) => (item.id === id ? updated : item))));
    return updated;
  }, []);

  const removeOpportunity = useCallback(async (id: string) => {
    await api.deleteOpportunity(id);
    setOpportunities((current) => current.filter((item) => item.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const openQuickEntry = useCallback(() => setQuickEntryOpen(true), []);
  const openOpportunity = useCallback((id: string) => setSelectedId(id), []);

  const value = useMemo(
    () => ({
      opportunities,
      loading,
      error,
      reload,
      createOpportunity,
      updateOpportunity,
      removeOpportunity,
      customTemplates,
      setCustomTemplates,
      openQuickEntry,
      openOpportunity,
    }),
    [
      opportunities,
      loading,
      error,
      reload,
      createOpportunity,
      updateOpportunity,
      removeOpportunity,
      customTemplates,
      openQuickEntry,
      openOpportunity,
    ],
  );

  const selected = selectedId ? opportunities.find((item) => item.id === selectedId) ?? null : null;

  return (
    <AppDataContext.Provider value={value}>
      {children}
      <QuickEntryDialog open={quickEntryOpen} onClose={() => setQuickEntryOpen(false)} />
      <OpportunityDialog opportunity={selected} onClose={() => setSelectedId(null)} />
    </AppDataContext.Provider>
  );
}
