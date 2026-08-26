import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { getAllPelatihan, addPelatihanNonReguler, addPelatihanReguler } from '../services/supabase/trainingApi';

const DataManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState('non_reguler'); // 'non_reguler' or 'reguler'
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({});

  const fetchData = async () => {
    setLoading(true);
    const result = await getAllPelatihan();
    if (result.data) {
      setData(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = type === 'number' ? parseInt(value) || 0 : value;
    
    let updatedData = { ...formData, [name]: parsedValue };

    // Auto-calculation logic based on PRD requirement
    if (formType === 'reguler') {
      if (name === 'total_orang' || name === 'promosi_mandor') {
        const total = name === 'total_orang' ? parsedValue : (formData.total_orang || 0);
        const promosi = name === 'promosi_mandor' ? parsedValue : (formData.promosi_mandor || 0);
        updatedData.fresh_graduate = Math.max(0, total - promosi);
      }
    } else {
      if (['peserta_non_staf', 'peserta_ast', 'peserta_askep', 'peserta_mgr', 'peserta_gm', 'peserta_head'].includes(name)) {
        const stafSum = (updatedData.peserta_ast||0) + (updatedData.peserta_askep||0) + (updatedData.peserta_mgr||0) + (updatedData.peserta_gm||0) + (updatedData.peserta_head||0);
        const nonStaf = updatedData.peserta_non_staf || 0;
        updatedData.target_staf = stafSum;
        updatedData.target_non_staf = nonStaf;
        updatedData.target_total = stafSum + nonStaf;
      }
    }

    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formType === 'reguler') {
      await addPelatihanReguler(formData);
    } else {
      await addPelatihanNonReguler(formData);
    }
    setIsModalOpen(false);
    setFormData({});
    fetchData(); // Refresh data
  };

  const filteredData = data.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Data</h1>
          <p className="text-slate-500">Kelola data pelatihan reguler dan non-reguler.</p>
        </div>
        <button 
          onClick={() => { setFormType('non_reguler'); setFormData({}); setIsModalOpen(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Tambah Data
        </button>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari pelatihan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-sm border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Program Pelatihan</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Trainer</th>
                <th className="px-4 py-3 font-medium">Total Jam/Hari</th>
                <th className="px-4 py-3 font-medium text-center">TD</th>
                <th className="px-4 py-3 font-medium text-center">Peserta</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-4 font-medium text-slate-800">{item.title}</td>
                    <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                      {item.start.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} - {item.end.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'Reguler' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.location}</td>
                    <td className="px-4 py-4 text-slate-600">{item.trainer || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                      {item.type === 'Reguler' 
                        ? `${item.originalData?.jumlah_hari || 0} Hari` 
                        : `${item.originalData?.total_jam || 0} Jam / ${item.originalData?.total_hari || 0} Hari`}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-center font-medium">{item.originalData?.td_total || item.originalData?.total_training_days || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-center font-medium">{item.participants}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={16} /></button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500 bg-slate-50">
          <span>Menampilkan 1 hingga {filteredData.length} dari {filteredData.length} data</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50">Sebelumnya</button>
            <button className="px-3 py-1 border border-slate-300 rounded bg-green-600 text-white disabled:opacity-50">1</button>
            <button className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50">Selanjutnya</button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-xl font-bold text-slate-800">Tambah Data Pelatihan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form id="trainingForm" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-max">
                  <button 
                    type="button" 
                    onClick={() => { setFormType('non_reguler'); setFormData({}); }}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${formType === 'non_reguler' ? 'bg-white shadow-sm text-green-700' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Non-Reguler
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setFormType('reguler'); setFormData({}); }}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${formType === 'reguler' ? 'bg-white shadow-sm text-green-700' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Reguler
                  </button>
                </div>

                {formType === 'non_reguler' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Pelatihan</label>
                        <input required type="text" name="jenis_pelatihan" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Training</label>
                        <select required name="tipe_training" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
                          <option value="">Pilih Tipe</option>
                          <option value="Workshop">Workshop</option>
                          <option value="W & M">W & M</option>
                          <option value="Onsite">Onsite</option>
                          <option value="Online">Online</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                        <select required name="region" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
                          <option value="">Pilih Region</option>
                          <option value="Riau">Riau</option>
                          <option value="Kalbar">Kalbar</option>
                          <option value="Kaltim FR">Kaltim FR</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trainer</label>
                        <select required name="trainer" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
                          <option value="">Pilih Trainer</option>
                          <option value="Eksternal">Eksternal</option>
                          <option value="Internal">Internal</option>
                          <option value="Eksternal & Internal">Eksternal & Internal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Training</label>
                        <input type="text" name="lokasi_training" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Pelatihan</label>
                        <input required type="text" name="kategori_pelatihan" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                        <input required type="date" name="start_date" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
                        <input required type="date" name="end_date" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <h4 className="font-medium text-slate-800 mb-3">Peserta</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Non-Staf</label>
                          <input type="number" name="peserta_non_staf" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">AST</label>
                          <input type="number" name="peserta_ast" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Askep</label>
                          <input type="number" name="peserta_askep" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Manager</label>
                          <input type="number" name="peserta_mgr" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Grup Manager</label>
                          <input type="number" name="peserta_gm" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Head</label>
                          <input type="number" name="peserta_head" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs text-slate-500 mb-1 font-bold">Target Total (Auto)</label>
                          <input type="number" readOnly value={formData.target_total || ''} className="w-full p-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg font-bold" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Program Reguler</label>
                        <input required type="text" name="nama_program_reguler" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                        <input type="text" name="batch" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Training</label>
                        <input type="text" name="lokasi_training" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mulai Program</label>
                        <input required type="date" name="mulai_program" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Selesai Program</label>
                        <input required type="date" name="selesai_program" onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4 mt-4 bg-blue-50/50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-3 text-sm">Kalkulasi Otomatis (Total - Promosi Mandor = Fresh Graduate)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Total Orang</label>
                          <input type="number" name="total_orang" onChange={handleInputChange} className="w-full p-2 border border-blue-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Promosi Mandor</label>
                          <input type="number" name="promosi_mandor" onChange={handleInputChange} className="w-full p-2 border border-blue-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-xs text-blue-600 font-bold mb-1">Fresh Graduate (Auto)</label>
                          <input type="number" readOnly value={formData.fresh_graduate || ''} className="w-full p-2 border border-blue-200 bg-blue-100 text-blue-800 rounded-lg font-bold" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="trainingForm"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm"
              >
                Simpan Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DataManagement;
