import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { ProposalLink, ProposalResponse } from '../../lib/types';
import { useAppData } from '../state/useAppData';

export interface ProposalAlert {
  id: string;
  type: 'viewed' | 'responded';
  clientName: string;
  whatsapp: string | null;
  response?: ProposalResponse;
}

const RESPONSE_LABELS: Record<ProposalResponse, string> = {
  quero_fechar: 'Quer fechar negócio!',
  duvida: 'Tem uma dúvida',
  caro: 'Achou caro',
  pensar: 'Vai pensar',
};

export function useProposalAlerts(userId: string | undefined) {
  const { opportunities, proposalLinks, saveProposalLink } = useAppData();
  const [alerts, setAlerts] = useState<ProposalAlert[]>([]);
  const linksRef = useRef<ProposalLink[]>([]);
  const oppsRef = useRef(opportunities);

  useEffect(() => { linksRef.current = proposalLinks; }, [proposalLinks]);
  useEffect(() => { oppsRef.current = opportunities; }, [opportunities]);

  useEffect(() => {
    if (!supabase || !userId) return;

    // Pede permissão para notificações do navegador (só aparece uma vez).
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission();
    }

    const channel = supabase
      .channel(`proposal-alerts-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'proposal_links', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newLink = payload.new as ProposalLink;
          const prevLink = linksRef.current.find((l) => l.id === newLink.id);

          // Atualiza o estado local imediatamente (sem precisar recarregar).
          saveProposalLink(newLink);

          const opp = oppsRef.current.find((o) => o.id === newLink.opportunity_id);
          const clientName = opp?.client_name ?? 'Cliente';
          const whatsapp = opp?.whatsapp ?? null;

          let type: 'viewed' | 'responded' | null = null;
          if (newLink.response && (!prevLink || !prevLink.response)) {
            type = 'responded';
          } else if (!newLink.response && newLink.view_count > (prevLink?.view_count ?? 0)) {
            type = 'viewed';
          }
          if (!type) return;

          const alert: ProposalAlert = {
            id: `${newLink.id}-${Date.now()}`,
            type,
            clientName,
            whatsapp,
            response: type === 'responded' ? (newLink.response as ProposalResponse) : undefined,
          };

          setAlerts((prev) => [...prev.slice(-2), alert]); // máx 3 na tela

          // Notificação do SO (funciona mesmo com a aba minimizada).
          if ('Notification' in window && Notification.permission === 'granted') {
            const title =
              type === 'viewed'
                ? `🔥 ${clientName} abriu sua proposta!`
                : `💬 ${clientName} respondeu sua proposta`;
            const body =
              type === 'responded'
                ? RESPONSE_LABELS[newLink.response as ProposalResponse]
                : 'Ligue agora — a proposta está fresca!';
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [userId, saveProposalLink]);

  const dismissAlert = (id: string) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  return { alerts, dismissAlert };
}
