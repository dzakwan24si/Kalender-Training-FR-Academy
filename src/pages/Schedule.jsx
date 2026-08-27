import { useState, useEffect } from 'react';
import { getAllPelatihan } from '../services/supabase/client';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Users, MapPin, Search
} from 'lucide-react';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const Schedule = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('Semua Lokasi');
  const [filterSubKategori, setFilterSubKategori] = useState('Semua Sub Kategori');
  
  // Modal
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllPelatihan();
      if (result.data) {
        setData(result.data);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredData = data.filter(item => {
    const matchSearch = (item.title || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchLocation = filterLokasi === 'Semua Lokasi' ||
                         (item.location || '').toLowerCase().includes(filterLokasi.toLowerCase().replace('tc ', ''));
    const matchSubKategori = filterSubKategori === 'Semua Sub Kategori' || item.subCategory === filterSubKategori;
    return matchSearch && matchLocation && matchSubKategori;
  });

  const uniqueSubKategori = [...new Set(data.map(item => item.subCategory).filter(sub => sub && sub !== '-'))];

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
    // Always return 42 cells (6 rows) for a consistent grid
    while (cells.length < 42) {
      cells.push({ day: nextDay, inMonth: false, date: new Date(year, month + 1, nextDay) });
      nextDay++;
    }
    return cells;
  };

  const getProgramsForDate = (date) => {
    if (date.getDay() === 0) return []; // Minggu tidak pernah ditandai training

    const targetTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    
    return filteredData.filter(program => {
      const dates = program.tanggal_pelaksanaan;
      if (!dates || !Array.isArray(dates) || dates.length === 0) return false;
      return dates.some(d => {
        const pDate = new Date(d);
        return new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate()).getTime() === targetTime;
      });
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6 md:mt-2 pr-12 md:pr-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">Schedule Bulanan</h1>
          <p className="text-slate-500 text-sm mt-1">Lihat keseluruhan jadwal program pelatihan per bulan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-white px-4 py-2 border border-slate-200 rounded-lg shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Keterangan:</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded text-[11px] font-semibold text-blue-700">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            Reguler
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded text-[11px] font-semibold text-orange-700">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            Non-Reguler
          </div>
        </div>
      </div>

      {/* Toolbar & Calendar Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4 bg-white">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button onClick={handlePrevMonth} className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-base font-bold text-slate-800 w-40 text-center">
              {MONTH_NAMES_ID[calendarDate.getMonth()]} {calendarDate.getFullYear()}
            </span>
            <button onClick={handleNextMonth} className="w-9 h-9 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
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

        {/* Full Calendar Grid */}
        <div className="bg-white overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
              {DAY_NAMES_ID.map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Cells */}
            <div className="grid grid-cols-7">
              {getCalendarDays(calendarDate).map((cell, idx) => {
                const dayPrograms = getProgramsForDate(cell.date);
                return (
                  <div
                    key={idx}
                    className={`min-h-[140px] p-2 border-b border-r border-slate-200 ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''} ${!cell.inMonth ? 'bg-slate-50/50' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                        cell.date.toDateString() === new Date().toDateString() 
                          ? 'bg-green-600 text-white shadow-md' 
                          : cell.inMonth ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {cell.day}
                      </span>
                      {dayPrograms.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 bg-slate-100 rounded-md">
                          {dayPrograms.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1.5 mt-2">
                      {dayPrograms.map((program, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => { setSelectedProgram(program); setIsModalOpen(true); }}
                          className={`w-full text-left px-2 py-1.5 rounded text-[11px] font-semibold truncate transition-colors border ${
                            program.type === 'Reguler' 
                              ? 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 hover:border-blue-200' 
                              : 'bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100 hover:border-orange-200'
                          }`}
                          title={program.title}
                        >
                          {program.title}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Program (Reused from TrainingCalendar) */}
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
                        <div className="flex items-center"><span className="text-slate-500 w-32">Rencana Batch:</span><span className="font-bold text-slate-800">{selectedProgram.originalData?.total_batch ?? 0} Batch</span></div>
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

export default Schedule;
