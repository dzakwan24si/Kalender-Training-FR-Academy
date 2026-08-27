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

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DAY_NAMES_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const TrainingCalendar = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Reguler - Staf');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('Semua Lokasi');
  const [filterSubKategori, setFilterSubKategori] = useState('Semua Sub Kategori');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchTerm, filterLokasi, filterSubKategori, itemsPerPage]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllPelatihan();
      if (result.data) {
        setData(result.data);
      } else if (result.error) {
        console.error("Error fetching data in TrainingCalendar:", result.error);
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

  // Reset kalender ke bulan mulai program setiap kali modal dibuka / program berganti
  useEffect(() => {
    if (selectedProgram?.start && !isNaN(selectedProgram.start)) {
      setCalendarDate(new Date(selectedProgram.start.getFullYear(), selectedProgram.start.getMonth(), 1));
    } else {
      setCalendarDate(new Date());
    }
  }, [selectedProgram]);

  const filteredData = data.filter(item => {
    const matchCategory = item.category === activeCategory;
    const matchSearch = (item.title || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchLocation = filterLokasi === 'Semua Lokasi' ||
                         (item.location || '').toLowerCase().includes(filterLokasi.toLowerCase().replace('tc ', ''));
    const matchSubKategori = filterSubKategori === 'Semua Sub Kategori' || item.subCategory === filterSubKategori;
    return matchCategory && matchSearch && matchLocation && matchSubKategori;
  }).sort((a, b) => a.title.localeCompare(b.title));

  const uniqueSubKategori = [...new Set(data.filter(item => item.category === activeCategory).map(item => item.subCategory).filter(sub => sub && sub !== '-'))];

  const totalProgram = filteredData.length;
  const totalBatch = filteredData.reduce((sum, item) => sum + item.batchCount, 0);
  const totalPeserta = filteredData.reduce((sum, item) => sum + (item.participants || item.originalData?.target_total || 0), 0);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedData = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // --- Helper kalender ---
  const getCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startWeekday = firstDayOfMonth.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = startWeekday - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, inMonth: false, date: new Date(year, month - 1, daysInPrevMonth - i) });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, inMonth: true, date: new Date(year, month, d) });
    }
    let nextDay = 1;
    while (cells.length < 42) {
      cells.push({ day: nextDay, inMonth: false, date: new Date(year, month + 1, nextDay) });
      nextDay++;
    }
    return cells;
  };

  const isDateInRange = (date) => {
    if (date.getDay() === 0) return false; // Minggu tidak pernah ditandai training

    const dates = selectedProgram?.tanggal_pelaksanaan;
    if (!dates || !Array.isArray(dates) || dates.length === 0) return false;
    
    const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    
    return dates.some(d => {
      const pDate = new Date(d);
      return new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate()).getTime() === targetTime;
    });
  };

  const handlePrevMonth = () => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  if (loading) {
    return <div className="flex items-center justify-center h-[500px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-transparent mt-6 md:mt-2 pr-12 md:pr-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">Kalender Training FR Academy</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola master data program pelatihan.</p>
        </div>
        <div className="bg-white border border-slate-200 px-3 py-1.5 md:px-4 rounded-full flex items-center gap-2 shadow-sm whitespace-nowrap self-start md:self-auto">
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
            <select
              value={filterSubKategori}
              onChange={(e) => setFilterSubKategori(e.target.value)}
              className="border border-slate-300 rounded-lg px-4 py-2 text-slate-700 text-sm font-medium outline-none focus:border-green-500 w-full sm:w-48 bg-white appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
              <option value="Semua Sub Kategori">Semua Sub Kategori</option>
              {uniqueSubKategori.map((sub, idx) => (
                <option key={idx} value={sub}>{sub}</option>
              ))}
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
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500 text-sm">Tidak ada program yang sesuai dengan filter.</td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
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
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-sm text-slate-500 bg-white gap-4">
          <div className="flex items-center gap-3">
            <span>Showing {filteredData.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} records</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-slate-300 rounded px-2 py-1 text-slate-700 text-sm font-medium outline-none focus:border-blue-500 bg-slate-50 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors">
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                if (totalPages > 7) {
                  if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage)) {
                    return (
                      <button 
                        key={i} 
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-[#0095ff] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        {i + 1}
                      </button>
                    );
                  }
                  if (i === 1 && currentPage > 3) return <span key={i} className="px-1 text-slate-400">...</span>;
                  if (i === totalPages - 2 && currentPage < totalPages - 2) return <span key={i} className="px-1 text-slate-400">...</span>;
                  return null;
                }
                
                return (
                  <button 
                    key={i} 
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-[#0095ff] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors">
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
                    <div className="flex items-center"><span className="text-slate-500 w-32">Region:</span><span className="font-bold text-slate-800">{selectedProgram.region || 'Nasional'}</span></div>
                    <div className="flex items-center"><span className="text-slate-500 w-32">Trainer:</span><span className="font-bold text-slate-800">{selectedProgram.trainer || 'Internal'}</span></div>
                    <div className="flex items-center"><span className="text-slate-500 w-32">Sub Kategori:</span><span className="font-bold text-slate-800">{selectedProgram.subCategory || '-'}</span></div>
                    <div className="flex items-center"><span className="text-slate-500 w-32">Lokasi Training:</span><span className="font-bold text-slate-800">{selectedProgram.location || '-'}</span></div>
                    {selectedProgram.type === 'Reguler' ? (
                      <>
                        <div className="flex items-center"><span className="text-slate-500 w-32">Total Hari:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.jumlah_hari || 0} Hari</span></div>
                        <div className="flex items-center"><span className="text-slate-500 w-32">Durasi Program:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.jumlah_bulan_training || 0} Bulan</span></div>
                        <div className="flex items-center"><span className="text-slate-500 w-32">Total Training Days:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.Total_training_days || 0}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center"><span className="text-slate-500 w-32">Tipe Training:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.tipe_training || '-'}</span></div>
                        <div className="flex items-center"><span className="text-slate-500 w-32">Total Jam / Hari:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.total_jam || 0} Jam / {selectedProgram.originalData?.total_hari || 0} Hari</span></div>
                        <div className="flex items-center"><span className="text-slate-500 w-32">Total Training Days:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.td_total || 0}</span></div>
                        <div className="flex items-center"><span className="text-slate-500 w-32">Rencana Batch:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.total_batch || 1} Batch</span></div>
                      </>
                    )}
                  </div>
                </div>

                {/* Target & Breakdown Peserta */}
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm border-b border-slate-100 pb-3">
                    <Users size={16} className="text-green-600" /> Target & Breakdown Peserta
                  </h3>
                  {selectedProgram.type === 'Reguler' ? (
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-slate-500 mb-1">Promosi Mandor</p><p className="font-bold text-slate-800">{selectedProgram.originalData?.Promosi_mandor || 0}</p></div>
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm"><p className="text-[10px] text-slate-500 mb-1">Fresh Graduate</p><p className="font-bold text-slate-800">{selectedProgram.originalData?.Fresh_Graduate || 0}</p></div>
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm col-span-2 text-left px-4 flex justify-between items-center"><span className="text-[11px] text-slate-500 font-medium">Estimasi Uang Saku</span><span className="font-bold text-slate-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedProgram.originalData?.Uang_saku || 0)}</span></div>
                      <div className="bg-green-50/50 border-2 border-green-200 rounded-xl p-3 shadow-sm col-span-2"><p className="text-[10px] text-green-700 font-extrabold mb-1">Total Peserta Target</p><p className="font-bold text-green-700 text-base">{selectedProgram.participants}</p></div>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>

              {/* Kalender Rencana Pelaksanaan - versi kalender biasa */}
              <div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <CalendarIcon size={16} className="text-green-600" /> Kalender Rencana Pelaksanaan
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrevMonth}
                      className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-sm font-bold text-slate-700 w-32 text-center">
                      {MONTH_NAMES_ID[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                    </span>
                    <button
                      onClick={handleNextMonth}
                      className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-md bg-white hover:bg-slate-50 text-slate-600"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {DAY_NAMES_ID.map(day => (
                      <div key={day} className="py-2 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {getCalendarDays(calendarDate).map((cell, idx) => {
                      const active = cell.inMonth && isDateInRange(cell.date);
                      return (
                        <div
                          key={idx}
                          className={`min-h-[64px] p-2 border-b border-r border-slate-100 flex flex-col items-center justify-start ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''} ${!cell.inMonth ? 'bg-slate-50/40' : 'bg-white'}`}
                        >
                          <span
                            className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                              active
                                ? 'bg-green-600 text-white'
                                : cell.inMonth ? 'text-slate-700' : 'text-slate-300'
                            }`}
                          >
                            {cell.day}
                          </span>
                          {active && (
                            <span className="mt-1 text-[9px] font-semibold text-green-700 text-center leading-tight">
                              Training
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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