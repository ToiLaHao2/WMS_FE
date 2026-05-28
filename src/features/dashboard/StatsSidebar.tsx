import React from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { BarChart3, Battery, Package, Truck, Zap } from 'lucide-react';

const StatsSidebar: React.FC = () => {
  const { agvs, slots } = useSimulationStore();

  const activeAgvs = agvs.filter(a => a.status === 'moving').length;
  const avgBattery = agvs.length > 0 
    ? Math.round(agvs.reduce((acc, curr) => acc + curr.battery, 0) / agvs.length) 
    : 0;

  const storageSlots = slots.filter(s => s.slot_type === 'STORAGE').length;
  const occupiedSlots = slots.filter(s => s.status === 'RESERVED' || s.status === 'OCCUPIED').length;
  const occupancyRate = storageSlots > 0 ? Math.round((occupiedSlots / storageSlots) * 100) : 0;

  return (
    <div className="flex flex-col h-full p-6 gap-8 overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={14} /> Analytics & Stats
        </h2>
        <p className="text-[10px] text-slate-600">Real-time warehouse performance</p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 gap-4">
        {/* AGV Fleet */}
        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Fleet Efficiency</span>
            <Truck size={14} className="text-emerald-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold font-mono text-slate-200">{activeAgvs}/{agvs.length}</span>
            <span className="text-[10px] text-slate-500 mb-1">Active AGVs</span>
          </div>
          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-1000" 
              style={{ width: `${agvs.length > 0 ? (activeAgvs / agvs.length) * 100 : 0}%` }} 
            />
          </div>
        </div>

        {/* Battery Health */}
        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Energy Status</span>
            <Battery size={14} className={avgBattery < 20 ? 'text-red-400' : 'text-cyan-400'} />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold font-mono text-slate-200">{avgBattery}%</span>
            <span className="text-[10px] text-slate-500 mb-1">Avg. Battery</span>
          </div>
          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${avgBattery < 20 ? 'bg-red-500' : 'bg-cyan-500'}`}
              style={{ width: `${avgBattery}%` }} 
            />
          </div>
        </div>

        {/* Storage Occupancy */}
        <div className="bg-slate-800/30 border border-slate-700/50 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">Space Utilization</span>
            <Package size={14} className="text-amber-400" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold font-mono text-slate-200">{occupancyRate}%</span>
            <span className="text-[10px] text-slate-500 mb-1">Occupied</span>
          </div>
          <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full transition-all duration-1000" 
              style={{ width: `${occupancyRate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* System Health / Operations */}
      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">System Health</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500 uppercase">Redis Connection</span>
            <span className="text-emerald-400 font-bold uppercase">Online</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500 uppercase">Pathfinder Engine</span>
            <span className="text-emerald-400 font-bold uppercase">Ready</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500 uppercase">Simulation Tick</span>
            <span className="text-slate-400 font-mono">16.6ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsSidebar;
