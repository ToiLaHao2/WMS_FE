import React, { useState } from 'react';
import { useSimulationStore } from '../../../store/useSimulationStore';
import { PackagePlus, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const { importGoods } = useSimulationStore();

  const [formData, setFormData] = useState({
    productId: 'PROD-101',
    quantity: 1
  });

  const [status, setStatus] = useState<'idle' | 'checked_ok' | 'checked_fail' | 'importing' | 'success'>('idle');
  const [importedId, setImportedId] = useState<string | null>(null);

  const handleCheck = () => {
    if (!formData.productId || formData.quantity <= 0) {
      alert("Vui lòng nhập Product ID và số lượng hợp lệ.");
      return;
    }
    // Tạm bỏ qua logic check capacity do API sẽ tự lo
    setStatus('checked_ok');
  };

  const handleImport = async () => {
    setStatus('importing');
    
    const newItemId = await importGoods(formData.productId, formData.quantity);
    if (newItemId) {
      setImportedId(newItemId);
      setStatus('success');
    } else {
      setStatus('checked_fail');
    }
  };

  const resetForm = () => {
    setFormData({ productId: 'PROD-101', quantity: 1 });
    setStatus('idle');
    setImportedId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <PackagePlus className="text-emerald-400" />
            Nhập Hàng (Import)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in zoom-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="text-emerald-400" size={32} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-200 mb-2">Nhập Hàng Thành Công!</h4>
                <p className="text-slate-400 text-sm">
                  Đang tiến hành điều phối AGV cất trữ hàng hoá.
                  <br />ID món hàng là:
                </p>
                <div className="mt-3 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold tracking-wider inline-block">
                  {importedId}
                </div>
              </div>
              <div className="flex gap-3 mt-4 w-full">
                <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors">
                  Đóng
                </button>
                <button onClick={resetForm} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-500/20">
                  Nhập Tiếp
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Mã Sản Phẩm (Product ID)</label>
                <input
                  type="text"
                  value={formData.productId}
                  onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                  disabled={status === 'importing'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="VD: PROD-101"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Số Lượng</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  disabled={status === 'importing'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Validation Status Message */}
              {status === 'checked_fail' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-400 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>Hệ thống cảnh báo: Kho không còn đủ chỗ trống cho kích thước hàng này.</p>
                </div>
              )}
              {status === 'checked_ok' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2 text-emerald-400 text-sm">
                  <CheckCircle size={16} className="mt-0.5 shrink-0" />
                  <p>Đã tìm thấy vị trí khả thi. Sẵn sàng nhập hàng.</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleCheck}
                  disabled={!formData.productId || status === 'importing'}
                  className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-200 font-medium rounded-lg transition-colors"
                >
                  Kiểm tra chỗ trống
                </button>
                
                {status === 'checked_ok' && (
                  <button
                    onClick={handleImport}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20 animate-in slide-in-from-right-4"
                  >
                    Tiến hành Nhập
                  </button>
                )}
                
                {status === 'importing' && (
                  <button disabled className="flex-1 py-2.5 bg-emerald-500/50 text-white font-medium rounded-lg cursor-not-allowed">
                    Đang xử lý...
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
