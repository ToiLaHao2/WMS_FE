import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../../store/useSimulationStore';
import { API_MASTER_DATA } from '../../../store/api';
import { PackagePlus, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ImportModalProps {
  onClose: () => void;
}

interface ProductOption {
  id: string;
  code: string;
  name: string;
  width: number;
  height: number;
  weight: number;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose }) => {
  const { importGoods, warehouseConfig } = useSimulationStore();

  const [products, setProducts] = useState<ProductOption[]>([]);
  const [formData, setFormData] = useState({
    productCode: '',
    quantity: 1
  });

  const [status, setStatus] = useState<'idle' | 'checking' | 'checked_ok' | 'checked_fail' | 'importing' | 'success'>('idle');
  const [importedId, setImportedId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<number | null>(null);
  const [checkMessage, setCheckMessage] = useState('');

  // Fetch danh sách sản phẩm khi mở modal
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_MASTER_DATA}/products`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, productCode: data[0].code }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch products', err);
      }
    };
    fetchProducts();
  }, []);

  // Kiểm tra chỗ trống thật sự bằng cách gọi API Backend
  const handleCheck = async () => {
    if (!formData.productCode || formData.quantity <= 0) {
      alert("Vui lòng chọn sản phẩm và nhập số lượng hợp lệ.");
      return;
    }

    if (!warehouseConfig?.id) {
      setCheckMessage('Chưa chọn warehouse. Vui lòng quay lại chọn kho.');
      setStatus('checked_fail');
      return;
    }

    setStatus('checking');
    try {
      // Gọi API lấy danh sách slot còn trống trong warehouse hiện tại
      const res = await fetch(`${API_MASTER_DATA}/warehouses/${warehouseConfig.id}/slots`);
      if (!res.ok) throw new Error('Không thể kiểm tra slot.');

      const slots = await res.json();
      const available = slots.filter((s: any) => s.slot_type === 'STORAGE' && s.status === 'AVAILABLE').length;
      setAvailableSlots(available);

      if (available >= formData.quantity) {
        setCheckMessage(`Còn ${available} slot trống. Đủ chỗ cho ${formData.quantity} sản phẩm.`);
        setStatus('checked_ok');
      } else {
        setCheckMessage(`Chỉ còn ${available} slot trống, không đủ cho ${formData.quantity} sản phẩm.`);
        setStatus('checked_fail');
      }
    } catch (err: any) {
      setCheckMessage(`Lỗi kiểm tra: ${err.message}`);
      setStatus('checked_fail');
    }
  };

  const handleImport = async () => {
    setStatus('importing');
    
    const newItemId = await importGoods(formData.productCode, formData.quantity);
    if (newItemId) {
      setImportedId(newItemId);
      setStatus('success');
    } else {
      setCheckMessage('Nhập hàng thất bại. Xem log để biết chi tiết.');
      setStatus('checked_fail');
    }
  };

  const resetForm = () => {
    setFormData({ productCode: products.length > 0 ? products[0].code : '', quantity: 1 });
    setStatus('idle');
    setImportedId(null);
    setAvailableSlots(null);
    setCheckMessage('');
  };

  const selectedProduct = products.find(p => p.code === formData.productCode);

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
                  <br />Mã sản phẩm:
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
              {/* Chọn sản phẩm từ danh sách */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Sản Phẩm</label>
                {products.length === 0 ? (
                  <div className="text-sm text-slate-500 italic">Đang tải danh sách sản phẩm...</div>
                ) : (
                  <select
                    value={formData.productCode}
                    onChange={(e) => {
                      setFormData({ ...formData, productCode: e.target.value });
                      setStatus('idle'); // Reset status khi đổi sản phẩm
                      setCheckMessage('');
                    }}
                    disabled={status === 'importing' || status === 'checking'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.code}>
                        {p.code} — {p.name} ({p.width}x{p.height}, {p.weight}kg)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Thông tin sản phẩm đã chọn */}
              {selectedProduct && (
                <div className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg text-xs text-slate-400">
                  <span className="text-slate-300 font-medium">{selectedProduct.name}</span> — 
                  Kích thước: {selectedProduct.width}x{selectedProduct.height} | 
                  Trọng lượng: {selectedProduct.weight}kg
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Số Lượng</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 });
                    setStatus('idle');
                    setCheckMessage('');
                  }}
                  disabled={status === 'importing' || status === 'checking'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Validation Status Message */}
              {status === 'checking' && (
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center gap-2 text-sky-400 text-sm">
                  <Loader2 size={16} className="animate-spin shrink-0" />
                  <p>Đang kiểm tra chỗ trống trong kho...</p>
                </div>
              )}
              {status === 'checked_fail' && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-2 text-rose-400 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{checkMessage}</p>
                </div>
              )}
              {status === 'checked_ok' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-2 text-emerald-400 text-sm">
                  <CheckCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{checkMessage}</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  onClick={handleCheck}
                  disabled={!formData.productCode || status === 'importing' || status === 'checking'}
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
                  <button disabled className="flex-1 py-2.5 bg-emerald-500/50 text-white font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
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
