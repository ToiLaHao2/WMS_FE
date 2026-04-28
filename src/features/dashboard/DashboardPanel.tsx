import React, { useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { PackagePlus, PackageMinus, Activity, Battery, BatteryCharging, History } from 'lucide-react';
import ImportModal from './modals/ImportModal';
import ExportModal from './modals/ExportModal';

const DashboardPanel: React.FC = () => {
  const { stats, agvs, logs, inventory } = useSimulationStore();
  
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleImport = () => {
    setIsImportOpen(true);
  };

  const handleExport = () => {
    setIsExportOpen(true);
  };

  return (
    <div className="h-full bg-slate-800 border-l border-slate-700 flex flex-col shadow-2xl text-slate-200">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Control Center
        </h2>
        <p className="text-sm text-slate-400">Warehouse Simulation</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-600">
        {/* Actions */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} /> Operations
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleImport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20"
            >
              <PackagePlus size={18} />
              Import
            </button>
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/20"
            >
              <PackageMinus size={18} />
              Export
            </button>
          </div>
        </section>

        {/* Stats */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Storage</h3>
          <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm text-slate-400">Capacity Used</span>
              <span className="text-lg font-bold text-slate-200">
                {stats.usedCapacity} / {stats.totalCapacity}
              </span>
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-400 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${(stats.usedCapacity / stats.totalCapacity) * 100}%` }}
              />
            </div>
          </div>
        </section>

        {/* AGV Status */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            AGV Fleet
          </h3>
          <div className="space-y-2">
            {agvs.map((agv) => (
              <div key={agv.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-300">{agv.id}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      agv.status === 'moving' ? 'bg-cyan-500/20 text-cyan-400' :
                      agv.status === 'charging' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}
                  >
                    {agv.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    {agv.status === 'charging' ? <BatteryCharging size={14} className="text-amber-400" /> : <Battery size={14} className="text-emerald-400" />}
                    {agv.battery}%
                  </span>
                  <span>Pos: ({agv.x}, {agv.y})</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Inventory List */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <PackagePlus size={16} /> Inventory ({inventory.length})
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {inventory.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No items in warehouse.</p>
            ) : (
              inventory.map((item) => (
                <div key={item.id} className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50 flex flex-col gap-1 hover:border-slate-600 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-emerald-400 font-mono">{item.id}</span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-600 text-slate-400">
                      Slot: {item.slotId}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 font-medium">{item.name}</p>
                  <div className="flex gap-3 text-[10px] text-slate-500">
                    <span>Size: {item.size}</span>
                    <span>Weight: {item.weight}kg</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Logs */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <History size={16} /> Activity Logs
          </h3>
          <div className="space-y-2 text-sm">
            {logs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex flex-col gap-1 py-2 border-b border-slate-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{log.time}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      log.type === 'info' ? 'bg-blue-400' :
                      log.type === 'success' ? 'bg-emerald-400' :
                      log.type === 'error' ? 'bg-rose-400' :
                      'bg-amber-400'
                    }`}
                  />
                </div>
                <p className="text-slate-300 pl-3 leading-tight">{log.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {isImportOpen && <ImportModal onClose={() => setIsImportOpen(false)} />}
      {isExportOpen && <ExportModal onClose={() => setIsExportOpen(false)} />}
    </div>
  );
};

export default DashboardPanel;
