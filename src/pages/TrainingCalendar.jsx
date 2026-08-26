import { useState, useEffect } from 'react';
import { getAllPelatihan } from '../services/supabase/client';
import {
  GraduationCap, Users, MapPin, Building2, BookOpen, Layers,
  Search, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Reguler - Staf', title: 'Training Reguler - Staf', icon: GraduationCap },
  { id: 'Reguler - Mandor', title: 'Training Reguler - Mandor', icon: Users },
  { id: 'Riau', title: 'Training Riau', icon: MapPin },
  { id: 'Kalbar', title: 'Training Kalbar', icon: MapPin },
  { id: 'Kaltim', title: 'Training Kaltim', icon: MapPin },
  { id: 'Corporate', title: 'Training Corporate', icon: Building2 },
];

const TrainingCalendar = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Reguler - Staf');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('Semua Lokasi');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllPelatihan();
      if (result.data) {
        setData(result.data);
      } else if (result.error) {
        console.error("Error fetching data in TrainingCalendar:", result.error);
        // Map data to include category
        const enhancedData = result.data.map(item => {
          let category = 'Corporate';
          if (item.type === 'Reguler') {
            category = item.title.toLowerCase().includes('mandor') ? 'Reguler - Mandor' : 'Reguler - Staf';
          } else {
            const region = (item.originalData?.region || '').toLowerCase();
            if (region.includes('riau')) category = 'Riau';
            else if (region.includes('kalbar')) category = 'Kalbar';
            else if (region.includes('kaltim')) category = 'Kaltim';
            else category = 'Corporate';
          }
          return { ...item, category };
        });
        setData(enhancedData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredData = data.filter(item => {
    const matchCategory = item.category === activeCategory;
    const matchSearch = (item.title || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchLocation = filterLokasi === 'Semua Lokasi' || 
                         (item.location || '').toLowerCase().includes(filterLokasi.toLowerCase().replace('tc ', ''));
    return matchCategory && matchSearch && matchLocation;
  });

  const totalProgram = filteredData.length;
  const totalBatch = filteredData.reduce((sum, item) => sum + item.batchCount, 0);
  const totalPeserta = filteredData.reduce((sum, item) => sum + (item.participants || item.originalData?.target_total || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-[500px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div className="flex justify-between items-center bg-transparent mt-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kalender Training FR Academy</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola master data program pelatihan.</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="font-semibold text-slate-700 text-xs">Tahun Aktif: {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pb-2">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-left p-4 rounded-xl border transition-all relative ${isActive
                ? 'border-green-600 bg-white shadow-md shadow-green-600/5'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon size={20} />
                </div>
                {isActive && <div className="w-2 h-2 rounded-full bg-green-600"></div>}
              </div>
              <h3 className={`font-bold text-sm ${isActive ? 'text-slate-800' : 'text-slate-700'}`}>{cat.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Kategori Program</p>
            </button>
          );
        })}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Total Program</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">{totalProgram}</p>
            <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
              <span className="w-3 h-3 flex items-center justify-center bg-emerald-100 rounded-full"><span className="text-[8px]">✓</span></span> Kalender aktif ({new Date().getFullYear()})
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Target Batch / Tahun</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">{totalBatch}</p>
            <p className="text-xs text-blue-600 mt-1.5 font-medium flex items-center gap-1">
              <span>↻</span> Total rencana realisasi
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Target Peserta / Tahun</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">{totalPeserta} <span className="text-sm font-semibold text-slate-400">org</span></p>
            <p className="text-xs text-purple-600 mt-1.5 font-medium flex items-center gap-1">
              <span>↗</span> Jumlah kuota peserta
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar & Data Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
          <div className="flex w-full sm:w-auto gap-4">
            <select 
              value={filterLokasi}
              onChange={(e) => setFilterLokasi(e.target.value)}
              className="border border-slate-300 rounded-lg px-4 py-2 text-slate-700 text-sm font-medium outline-none focus:border-green-500 w-full sm:w-48 bg-white appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
              <option value="Semua Lokasi">Semua Lokasi</option>
              <option value="Jakarta">Jakarta</option>
              <option value="FRLC">FRLC</option>
              <option value="Kalbar">TC Kalbar</option>
              <option value="Kaltim">TC Kaltim</option>
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari program..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:border-green-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Nama Program</th>
                <th className="px-4 py-4 text-center">Sub Kategori</th>
                <th className="px-4 py-4 text-center">Jenis Program</th>
                <th className="px-4 py-4 text-center">Region</th>
                <th className="px-4 py-4 text-center">Target Batch</th>
                <th className="px-4 py-4 text-center">Target Peserta</th>
                <th className="px-4 py-4 text-center">Lokasi</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500 text-sm">Tidak ada program yang sesuai dengan filter.</td>
                </tr>
              ) : (
                filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-slate-600 font-medium">
                      {item.subCategory !== '-' && item.subCategory ? item.subCategory : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${item.type === 'Reguler' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                        }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-slate-600">
                      {item.region || 'Nasional'}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-800">
                      {item.originalData?.total_batch || 1}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-slate-800">
                      {item.participants} <span className="text-xs text-slate-400 font-normal">org</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 bg-white shadow-sm">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.location ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                        {item.location || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => { setSelectedProgram(item); setIsModalOpen(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-50 text-green-700 hover:bg-green-100 text-xs font-bold transition-colors border border-green-100"
                      >
                        <CalendarIcon size={14} /> Lihat Jadwal
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium bg-white gap-4">
          <span className="uppercase tracking-wider">Menampilkan {filteredData.length} dari {filteredData.length} Program Training</span>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600">
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded-md bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-600">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Modal Detail Program */}
      {isModalOpen && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-[#fcfcf9]">
              <div>
                <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold ${selectedProgram.type === 'Reguler' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {selectedProgram.type}
                </span>
                <h2 className="text-xl font-extrabold text-slate-800 mt-4 leading-tight">{selectedProgram.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedProgram.title}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2"><X size={20} /></button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informasi Umum */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm border-b border-slate-100 pb-3">
                    <span className="text-green-600 font-bold border border-green-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px]">i</span> Informasi Umum
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center"><span className="text-slate-500 w-32">Region:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.region || 'Nasional'}</span></div>
                    <div className="flex items-center"><span className="text-slate-500 w-32">Trainer:</span><span className="font-bold text-slate-800">{selectedProgram.trainer || 'Internal'}</span></div>
                    <div className="flex items-center"><span className="text-slate-500 w-32">Tipe Training:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.tipe_training || '-'}</span></div>
                    <div className="flex items-center"><span className="text-slate-500 w-32">Total Jam / Hari:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.total_jam ? `${selectedProgram.originalData?.total_jam} Jam / ${selectedProgram.originalData?.total_hari || 0} Hari` : '-'}</span></div>
                    <div className="flex items-center"><span className="text-slate-500 w-32">Rencana Batch:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.total_batch || 1} Batch</span></div>
                    <div className="flex items-center"><span className="text-slate-500 w-32">Lokasi Training:</span><span className="font-bold text-slate-800">{selectedProgram.location || '-'}</span></div>
                  </div>
                </div>

                {/* Target & Breakdown Peserta */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm border-b border-slate-100 pb-3">
                    <Users size={16} className="text-green-600" /> Target & Breakdown Peserta
                  </h3>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-slate-500 mb-1">Non Staff</p><p className="font-bold text-slate-800">{selectedProgram.originalData?.peserta_non_staf || 0}</p></div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-slate-500 mb-1">Assistant</p><p className="font-bold text-slate-800">{selectedProgram.originalData?.peserta_ast || 0}</p></div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-slate-500 mb-1">Askep</p><p className="font-bold text-slate-800">{selectedProgram.originalData?.peserta_askep || 0}</p></div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-slate-500 mb-1">Manager</p><p className="font-bold text-slate-800">{selectedProgram.originalData?.peserta_mgr || 0}</p></div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-slate-500 mb-1">GM</p><p className="font-bold text-slate-800">{selectedProgram.originalData?.peserta_gm || 0}</p></div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-slate-500 mb-1">Head</p><p className="font-bold text-slate-800">{selectedProgram.originalData?.peserta_head || 0}</p></div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-slate-500 mb-1">Staff</p><p className="font-bold text-slate-800">{selectedProgram.originalData?.target_staf || 0}</p></div>
                    <div className="bg-green-50/50 border-2 border-green-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-green-700 font-extrabold mb-1">Total Target</p><p className="font-bold text-green-700 text-base">{selectedProgram.participants}</p></div>
                  </div>
                </div>
              </div>

              {/* Kalender Rencana Pelaksanaan */}
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm mt-2">
                  <CalendarIcon size={16} className="text-green-600" /> Kalender Rencana Pelaksanaan (Jan - Des 2026)
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGS', 'SEPT', 'OKT', 'NOV', 'DES'].map((month, idx) => {
                    // Spread batch dates roughly
                    const isStartMonth = selectedProgram.start && !isNaN(selectedProgram.start) && idx === selectedProgram.start.getMonth();
                    const isEndMonth = selectedProgram.end && !isNaN(selectedProgram.end) && idx === selectedProgram.end.getMonth();
                    const isActive = isStartMonth || isEndMonth;
                    const startMonth = selectedProgram.start && !isNaN(selectedProgram.start) ? selectedProgram.start.getMonth() : -1;
                    const endMonth = selectedProgram.end && !isNaN(selectedProgram.end) ? selectedProgram.end.getMonth() : -1;
                    
                    return (
                      <div key={month} className={`border rounded-xl p-4 text-center flex flex-col items-center justify-center min-h-[90px] shadow-sm transition-all ${isActive ? 'border-green-300 bg-green-50/50 scale-[1.02]' : 'border-slate-100 bg-white'}`}>
                        <span className={`text-xs font-bold tracking-wider mb-2 ${isActive ? 'text-green-800' : 'text-slate-400'}`}>{month}</span>
                        {isActive ? (
                          <span className="text-sm font-extrabold text-green-700">{Math.ceil((selectedProgram.participants || 0) / (startMonth !== -1 && startMonth !== endMonth ? 2 : 1))} org</span>
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-white flex justify-end">
              <button onClick={() => setIsModalOpen(false)} className="bg-[#4a7238] hover:bg-[#3d632c] text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm">
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TrainingCalendar;
