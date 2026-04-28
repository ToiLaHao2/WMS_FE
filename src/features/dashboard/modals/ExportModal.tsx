import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/useSimulationStore';
import { PackageMinus, X, Search, CheckCircle, AlertCircle } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { exportGoods, inventory } = useSimulationStore();
  const [searchId, setSearchId] = useState('');
  const [status, setStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setStatus('exporting');
    
    // Simulate API delay
    setTimeout(() => {
      const success = exportGoods(searchId.trim().toUpperCase());
      if (success) {
        setStatus('success');
      } else {
        setErrorMessage(`Hệ thống không tìm thấy món hàng với ID: ${searchId}`);
        setStatus('error');
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <PackageMinus className="text-amber-400" />
            Xuất Hàng (Export)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in zoom-in">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <CheckCircle className="text-amber-400" size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-200 mb-2">Xuất Hàng Thành Công!</h4>
                <p className="text-slate-400 text-sm">
                  AGV đang được điều phối để lấy hàng {searchId.toUpperCase()} ra khỏi kho.
                </p>
              </div>
              <button onClick={onClose} className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">
                Hoàn tất
              </button>
            </div>
          ) : (
            <form onSubmit={handleExport} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Tìm kiếm theo ID hàng hoá</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-slate-500" />
                  </div>
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => {
                      setSearchId(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    disabled={status === 'exporting'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="VD: ITEM-A1B2C3"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {status === 'error' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-400 text-sm animate-in shake">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* Suggestions (Optional nice touch for testing) */}
              {inventory.length > 0 && status !== 'error' && (
                <div className="pt-2">
                  <p className="text-xs text-slate-500 mb-2">Gợi ý ID đang có trong kho:</p>
                  <div className="flex flex-wrap gap-2">
                    {inventory.slice(0, 3).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSearchId(item.id)}
                        className="text-xs bg-slate-700/50 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded"
                      >
                        {item.id}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={!searchId || status === 'exporting'}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-amber-500/20"
                >
                  {status === 'exporting' ? 'Đang kiểm tra...' : 'Tiến hành Xuất'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
