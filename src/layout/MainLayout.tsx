import React from 'react';
import SimulationCanvas from '../simulation/SimulationCanvas';
import DashboardPanel from '../features/dashboard/DashboardPanel';

const MainLayout: React.FC = () => {
  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-900 text-slate-100">
      {/* Left side: Simulation area (4/5 width) */}
      <main className="w-4/5 h-full relative">
        <SimulationCanvas />
        
        {/* Overlay UI for Simulation if needed */}
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="px-3 py-1 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-full text-xs font-mono text-emerald-400 shadow-lg">
            SIMULATION LIVE
          </div>
        </div>
      </main>

      {/* Right side: Control Panel (1/5 width) */}
      <aside className="w-1/5 h-full z-10 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.5)]">
        <DashboardPanel />
      </aside>
    </div>
  );
};

export default MainLayout;
