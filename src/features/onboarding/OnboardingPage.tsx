import React, { useState } from 'react';
import { useSimulationStore } from '../../store/useSimulationStore';
import { API_MASTER_DATA } from '../../store/api';
import { Box, Factory, LogIn, Plus } from 'lucide-react';

const OnboardingPage: React.FC = () => {
  const {
    loadWarehouse,
    createWarehouse,
    lastError,
    clearError,
    availableWarehouses,
    fetchAvailableWarehouses
  } = useSimulationStore();
  const [tab, setTab] = useState<'load' | 'create'>('load');

  // Structured Form States
  const [loadForm, setLoadForm] = useState({ targetCode: '' });
  const [createForm, setCreateForm] = useState({
    code: '', // Manual code if desired, or auto-gen
    width: 30,
    height: 20,
    layoutType: 'standard',
    agvCount: 0
  });

  const [searchStatus, setSearchStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');

  // 1. Instant Local Filter (Derived State)
  const filteredWarehouses = React.useMemo(() => {
    return availableWarehouses.filter(wh =>
      wh.code.toLowerCase().includes(loadForm.targetCode.toLowerCase())
    );
  }, [availableWarehouses, loadForm.targetCode]);

  // 2. Debounced Remote Check (Redis-style)
  React.useEffect(() => {
    const code = loadForm.targetCode;
    if (!code || code.length < 3) {
      setSearchStatus('idle');
      return;
    }

    // Check locally first
    const existsLocally = availableWarehouses.some(wh => wh.code === code);
    if (existsLocally) {
      setSearchStatus('taken');
      return;
    }

    const timer = setTimeout(async () => {
      setSearchStatus('checking');
      try {
        const res = await fetch(`${API_MASTER_DATA}/warehouses/check/${code}`);
        const { exists } = await res.json();
        setSearchStatus(exists ? 'taken' : 'available');
      } catch (err) {
        setSearchStatus('idle');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [loadForm.targetCode, availableWarehouses]);

  // Fetch warehouses on mount
  React.useEffect(() => {
    fetchAvailableWarehouses();
  }, [fetchAvailableWarehouses]);

  // Clear error ONLY when switching between tabs
  const prevTab = React.useRef(tab);
  React.useEffect(() => {
    if (prevTab.current !== tab) {
      clearError();
      prevTab.current = tab;
    }
  }, [tab, clearError]);

  const handleLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loadForm.targetCode.trim()) {
      try {
        await loadWarehouse(loadForm.targetCode.trim());
      } catch (err: any) {
        // Error is now handled via store's lastError
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { width, height, agvCount } = createForm;
    if (width > 0 && height > 0 && agvCount >= 0) {
      try {
        await createWarehouse(createForm, createForm.agvCount);
      } catch (err: any) {
        // Error is now handled via store's lastError
      }
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
              className={`flex-1 py-4 text-sm font-medium transition-colors ${tab === 'load' ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-700/50'
                }`}
              onClick={() => setTab('load')}
            >
              Load Existing
            </button>
            <button
              className={`flex-1 py-4 text-sm font-medium transition-colors ${tab === 'create' ? 'bg-cyan-500/10 text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-400 hover:bg-slate-700/50'
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
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Warehouse ID</label>
                    {searchStatus !== 'idle' && (
                      <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${searchStatus === 'checking' ? 'text-slate-500' :
                          searchStatus === 'taken' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                        {searchStatus === 'checking' && <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />}
                        {searchStatus === 'taken' && <Box size={10} />}
                        {searchStatus === 'available' && <Plus size={10} />}
                        {searchStatus}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={loadForm.targetCode}
                    onChange={(e) => setLoadForm({ ...loadForm, targetCode: e.target.value })}
                    placeholder="e.g. WH-XYZ123"
                    className={`w-full bg-slate-900 border rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 transition-all ${searchStatus === 'taken' ? 'border-amber-500/50 focus:ring-amber-500' :
                        searchStatus === 'available' ? 'border-emerald-500/50 focus:ring-emerald-500' :
                          'border-slate-700 focus:ring-emerald-500'
                      }`}
                    required
                  />
                </div>
                {lastError && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg animate-in shake duration-300">
                    {lastError}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <LogIn size={20} /> Connect to Warehouse
                </button>

                {availableWarehouses.length > 0 && (
                  <div className="pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                        {loadForm.targetCode ? `Search Results (${filteredWarehouses.length})` : 'Existing Warehouses'}
                      </label>
                      {loadForm.targetCode && filteredWarehouses.length === 0 && (
                        <span className="text-[10px] text-slate-600 italic">No local matches</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredWarehouses.map((wh) => (
                        <button
                          key={wh.id}
                          type="button"
                          onClick={() => setLoadForm({ targetCode: wh.code })}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left group ${loadForm.targetCode === wh.code
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                              : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 text-slate-400'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md ${loadForm.targetCode === wh.code ? 'bg-emerald-500 text-white' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                              <Box size={16} />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{wh.code}</div>
                              <div className="text-[10px] text-slate-500 uppercase tracking-tight">{wh.width}x{wh.height} Grid</div>
                            </div>
                          </div>
                          {loadForm.targetCode === wh.code && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleCreate} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Columns (Grid Width)</label>
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={createForm.width}
                      onChange={(e) => setCreateForm({ ...createForm, width: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Rows (Grid Height)</label>
                    <input
                      type="number"
                      min="10"
                      max="200"
                      value={createForm.height}
                      onChange={(e) => setCreateForm({ ...createForm, height: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Layout Pattern</label>
                  <select
                    value={createForm.layoutType}
                    onChange={(e) => setCreateForm({ ...createForm, layoutType: e.target.value })}
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
                    value={createForm.agvCount}
                    onChange={(e) => setCreateForm({ ...createForm, agvCount: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                  <p className="text-xs text-slate-500">Number of AGVs to initialize the simulation with (can be 0).</p>
                </div>

                {lastError && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg animate-in shake duration-300">
                    {lastError}
                  </div>
                )}
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
