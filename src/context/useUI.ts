import { useContext } from 'react';
import { UIContext, type UIContextValue } from './uiContext';

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI deve ser usado dentro de <UIProvider>.');
  }
  return context;
}
