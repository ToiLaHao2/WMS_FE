import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './layout/MainLayout';
import OnboardingPage from './features/onboarding/OnboardingPage';
import { useSimulationStore } from './store/useSimulationStore';
import { Loader2 } from 'lucide-react';
import './App.css';

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center gap-4 text-emerald-400">
    <Loader2 className="animate-spin" size={48} />
    <p className="text-slate-300 font-medium tracking-widest animate-pulse uppercase">Initializing Environment...</p>
  </div>
);

function App() {
  const { appStatus } = useSimulationStore();

  const renderContent = () => {
    switch (appStatus) {
      case 'setup':
        return <OnboardingPage />;
      case 'loading':
        return <LoadingScreen />;
      case 'running':
        return <MainLayout />;
      default:
        return <OnboardingPage />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      {renderContent()}
    </QueryClientProvider>
  );
}

export default App;
