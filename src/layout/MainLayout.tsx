import { useSimulationStore } from '../store/useSimulationStore';
import { LogOut } from 'lucide-react';
import StatsSidebar from '../features/dashboard/StatsSidebar';
import DashboardPanel from '../features/dashboard/DashboardPanel';
import SimulationCanvas from '../simulation/SimulationCanvas';

const MainLayout: React.FC = () => {
  const { resetSimulation, warehouseConfig } = useSimulationStore();

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-slate-900 text-slate-100">
      {/* 1/5 Left: Control Panel */}
      <aside className="w-[20%] h-full z-10 border-r border-slate-800 shadow-xl bg-slate-900/50 backdrop-blur-sm">
        <DashboardPanel />
      </aside>

      {/* 3/5 Middle: Simulation area */}
      <main className="w-[60%] h-full relative border-r border-slate-800 flex flex-col">
        <header className="h-14 flex items-center justify-between px-6 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <h1 className="text-sm font-bold tracking-widest text-slate-300 uppercase">
              Warehouse <span className="text-emerald-400">#LIVE</span>
            </h1>
          </div>

          <button 
            onClick={resetSimulation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 text-xs font-medium transition-all group"
          >
            <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Switch Warehouse
          </button>
        </header>

        <div className="flex-1 relative overflow-hidden bg-slate-950">
          <SimulationCanvas />
        </div>
      </main>

      {/* 1/5 Right: Stats Sidebar */}
      <aside className="w-[20%] h-full z-10 bg-slate-900/50 backdrop-blur-sm">
        <StatsSidebar />
      </aside>
    </div>
  );
};

export default MainLayout;
