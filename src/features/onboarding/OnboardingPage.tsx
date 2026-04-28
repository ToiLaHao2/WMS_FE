import React, { useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { Box, Factory, LogIn, Plus } from 'lucide-react';

const OnboardingPage: React.FC = () => {
  const { loadWarehouse, createWarehouse } = useSimulationStore();
  const [tab, setTab] = useState<'load' | 'create'>('load');
  
  const [warehouseId, setWarehouseId] = useState('');
  const [config, setConfig] = useState({
    width: 1000,
    height: 800,
    layoutType: 'standard',
  });
  const [initialAgvCount, setInitialAgvCount] = useState(0);

  const handleLoad = (e: React.FormEvent) => {
    e.preventDefault();
    if (warehouseId.trim()) {
      loadWarehouse(warehouseId.trim());
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (config.width > 0 && config.height > 0 && initialAgvCount >= 0) {
      createWarehouse(config, initialAgvCount);
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Branding / Info */}
        <div className="hidden md:flex flex-col gap-6 text-slate-300">
          <div className="flex items-center gap-3 text-emerald-400">
            <Box size={40} />
            <h1 className="text-4xl font-bold tracking-tight text-white">WMSS</h1>
          </div>
          <h2 className="text-2xl font-light">Warehouse Management Simulation System</h2>
          <p className="text-slate-400">
            Real-time visualization and control of your automated guided vehicle (AGV) fleet and inventory flow.
          </p>
          <div className="pt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <Factory className="text-cyan-400 mb-2" />
              <p>2D Phaser Engine Visualization</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <LogIn className="text-amber-400 mb-2" />
              <p>Live AGV Control Interface</p>
            </div>
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            <button
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                tab === 'load' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-700/50'
              }`}
              onClick={() => setTab('load')}
            >
              Load Existing
            </button>
            <button
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                tab === 'create' ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-400 hover:bg-slate-700/50'
              }`}
              onClick={() => setTab('create')}
            >
              Create New
            </button>
          </div>

          <div className="p-8">
            {tab === 'load' ? (
              <form onSubmit={handleLoad} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Warehouse ID</label>
                  <input
                    type="text"
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    placeholder="e.g. WH-XYZ123"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <LogIn size={20} /> Connect to Warehouse
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreate} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Width (m)</label>
                    <input
                      type="number"
                      value={config.width}
                      onChange={(e) => setConfig({ ...config, width: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Height (m)</label>
                    <input
                      type="number"
                      value={config.height}
                      onChange={(e) => setConfig({ ...config, height: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Layout Pattern</label>
                  <select
                    value={config.layoutType}
                    onChange={(e) => setConfig({ ...config, layoutType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="standard">Standard Aisles</option>
                    <option value="dense">High-Density Storage</option>
                    <option value="crossdock">Cross-docking</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Initial AGVs Count</label>
                  <input
                    type="number"
                    min="0"
                    value={initialAgvCount}
                    onChange={(e) => setInitialAgvCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                  <p className="text-xs text-slate-500">Number of AGVs to initialize the simulation with (can be 0).</p>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <Plus size={20} /> Initialize Environment
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OnboardingPage;
