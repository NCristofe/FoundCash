import { useContext } from 'react';
import { AppDataContext, type AppDataContextValue } from './appDataContext';

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData deve ser usado dentro de <AppDataProvider>.');
  return context;
}
