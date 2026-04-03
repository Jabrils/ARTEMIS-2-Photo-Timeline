import { useMissionStore } from './store/mission-store';
import { useOEM } from './hooks/useOEM';
import { useDSN } from './hooks/useDSN';
import Scene from './components/Scene';
import HUD from './hud/HUD';
import ChatPanel from './chat/ChatPanel';

function LoadingScreen() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-space-dark gap-6">
      <h1 className="text-4xl font-bold tracking-[0.3em] text-white">
        ARTEMIS <span className="text-hud-blue">II</span>
      </h1>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-hud-blue animate-pulse" />
        <span className="text-sm text-gray-400 font-mono tracking-wider">
          Loading trajectory data...
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const isLoading = useMissionStore((s) => s.isLoading);

  // Initialize data hooks
  useOEM();
  useDSN();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-full h-full relative">
      <Scene />
      <HUD />
      <ChatPanel />
    </div>
  );
}
