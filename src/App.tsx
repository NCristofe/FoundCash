import { UIProvider } from './context/UIProvider';
import { LandingPage } from './pages/LandingPage/LandingPage';

export default function App() {
  return (
    <UIProvider>
      <LandingPage />
    </UIProvider>
  );
}
