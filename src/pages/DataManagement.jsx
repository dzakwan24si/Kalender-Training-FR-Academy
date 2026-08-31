import { useState, useEffect } from 'react';
import DatePickerModule from "react-multi-date-picker";
import XLSX from 'xlsx-js-style';
import { Plus, Search, Edit2, Trash2, X, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  getAllPelatihan, addPelatihanNonReguler, addPelatihanReguler,
  updatePelatihanNonReguler, deletePelatihanNonReguler,
  updatePelatihanReguler, deletePelatihanReguler 
} from '../services/supabase/client';

const DatePicker = DatePickerModule.default || DatePickerModule;

const groupDatesIntoRanges = (dates) => {
  if (!dates || dates.length === 0) return [];
  const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);
  const ranges = [];
  let currentRange = [sortedDates[0]];

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];
    
    const diffTime = Math.abs(currDate - prevDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    if (diffDays === 1) {
      if (currentRange.length === 1) {
        currentRange.push(currDate);
      } else {
        currentRange[1] = currDate;
      }
    } else {
      ranges.push(currentRange.map(d => d.toISOString().split('T')[0]));
      currentRange = [currDate];
    }
  }
  ranges.push(currentRange.map(d => d.toISOString().split('T')[0]));
  return ranges;
};

const DataManagement = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState('non_reguler'); // 'non_reguler' or 'reguler'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Filters
  const [filterType, setFilterType] = useState('Semua');
  const [filterRegion, setFilterRegion] = useState('Semua Region');
  const [filterSubKategori, setFilterSubKategori] = useState('Semua Sub Kategori');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  const fetchData = async () => {
    setLoading(true);
    const result = await getAllPelatihan();
    if (result.data) {
      setData(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      const result = await getAllPelatihan();
      if (result.data) {
        setData(result.data);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDateChange = (dateObjects) => {
    if (!dateObjects || dateObjects.length === 0) {
      const updates = { tanggal_pelaksanaan: [] };
      if (formType === 'reguler') {
        updates.Mulai_program = null;
        updates.Selesai_program = null;
      } else {
        updates.start_date = null;
        updates.end_date = null;
      }
      setFormData(prev => ({ ...prev, ...updates }));
      return;
    }
    
    let allDates = [];
    dateObjects.forEach(item => {
      if (Array.isArray(item)) {
        if (item.length === 1) {
          allDates.push(item[0].format("YYYY-MM-DD"));
        } else if (item.length === 2) {
          const start = new Date(item[0].format("YYYY-MM-DD"));
          const end = new Date(item[1].format("YYYY-MM-DD"));
          let current = new Date(start);
          while (current <= end) {
            allDates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
        }
      } else {
        allDates.push(item.format ? item.format("YYYY-MM-DD") : item);
      }
    });

    // Remove duplicates and sort
    const dates = [...new Set(allDates)].sort();
    
    const updates = { tanggal_pelaksanaan: dates };
    if (formType === 'reguler') {
      updates.Mulai_program = dates[0];
      updates.Selesai_program = dates[dates.length - 1];
    } else {
      updates.start_date = dates[0];
      updates.end_date = dates[dates.length - 1];
    }
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    let parsedValue = type === 'number' ? parseInt(value) || 0 : value;
    
    let updatedData = { ...formData, [name]: parsedValue };

    // Auto-calculation logic based on PRD requirement
    if (formType === 'reguler') {
      if (['Total_orang', 'Promosi_mandor'].includes(name)) {
        const total = updatedData.Total_orang || 0;
        const promosi = updatedData.Promosi_mandor || 0;
        const freshGraduate = Math.max(0, total - promosi);
        updatedData.Fresh_Graduate = freshGraduate;
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
    let result;
    if (formType === 'reguler') {
      if (isEditMode) result = await updatePelatihanReguler(editId, formData);
      else result = await addPelatihanReguler(formData);
    } else {
      if (isEditMode) result = await updatePelatihanNonReguler(editId, formData);
      else result = await addPelatihanNonReguler(formData);
    }

    if (result && result.error) {
      alert("Error saving data: " + result.error.message);
      return;
    }

    setIsModalOpen(false);
    setFormData({});
    setIsEditMode(false);
    setEditId(null);
    fetchData(); // Refresh data
  };

  const handleEdit = (item) => {
    const isReguler = item.type === 'Reguler';
    setFormType(isReguler ? 'reguler' : 'non_reguler');
    
    const editData = { ...item.originalData };
    if (!isReguler) {
      if (editData.start_date) editData.start_date = editData.start_date.split('T')[0];
      if (editData.end_date) editData.end_date = editData.end_date.split('T')[0];
    } else {
      if (editData.Mulai_program) editData.Mulai_program = editData.Mulai_program.split('T')[0];
      if (editData.Selesai_program) editData.Selesai_program = editData.Selesai_program.split('T')[0];
    }
    
    if (!editData.tanggal_pelaksanaan || editData.tanggal_pelaksanaan.length === 0) {
      const s = isReguler ? editData.Mulai_program : editData.start_date;
      const e = isReguler ? editData.Selesai_program : editData.end_date;
      editData.tanggal_pelaksanaan = [s, e].filter(Boolean);
    }

    setFormData(editData);
    setIsEditMode(true);
    setEditId(isReguler ? item.originalData.Program_reguler_id : item.originalData.id_nonreguler);
    setIsModalOpen(true);
  };

  const handleDelete = async (item) => {
    const isReguler = item.type === 'Reguler';
    if (window.confirm(`Yakin ingin menghapus data ${item.title}?`)) {
      if (isReguler) {
        await deletePelatihanReguler(item.originalData.Program_reguler_id);
      } else {
        await deletePelatihanNonReguler(item.originalData.id_nonreguler);
      }
      fetchData();
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'Semua' || item.type === filterType;
    const matchesRegion = filterRegion === 'Semua Region' || item.region === filterRegion;
    const matchesSub = filterSubKategori === 'Semua Sub Kategori' || item.subCategory === filterSubKategori;
    return matchesSearch && matchesType && matchesRegion && matchesSub;
  }).sort((a, b) => {
    if (a.type === 'Reguler' && b.type === 'Reguler') {
      const order = ['FAT', 'MAT', 'TAT', 'DMT', 'AAT', 'PMT', 'PKT'];
      const getPrefixIdx = (title) => {
        const prefix = (title || '').split(' ')[0].toUpperCase();
        const idx = order.indexOf(prefix);
        return idx !== -1 ? idx : 999;
      };
      const idxA = getPrefixIdx(a.title);
      const idxB = getPrefixIdx(b.title);
      if (idxA !== idxB) return idxA - idxB;
      return (a.title || '').localeCompare(b.title || '');
    } else if (a.type !== 'Reguler' && b.type !== 'Reguler') {
      const orderNonReg = ['SOFTSKILL', 'ESTATE', 'MILL', 'TRAKSI', 'DOWNSTREAM', 'ADMINISTRASI'];
      const getSubIdx = (subCat) => {
        const sub = (subCat || '').toUpperCase();
        const idx = orderNonReg.findIndex(o => sub.includes(o));
        return idx !== -1 ? idx : 999;
      };
      const idxA = getSubIdx(a.subCategory);
      const idxB = getSubIdx(b.subCategory);
      if (idxA !== idxB) return idxA - idxB;
      return (b.id || '').localeCompare(a.id || '');
    }
    return (b.id || '').localeCompare(a.id || ''); // Default sort by latest id
  });

  const uniqueRegions = [...new Set(data.map(item => item.region).filter(Boolean))];
  const uniqueSubKategories = [...new Set(data.filter(item => filterType === 'Semua' || item.type === filterType).map(item => item.subCategory).filter(sub => sub && sub !== '-'))];

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const exportAllToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const prepareRows = records => records.map(item => Object.fromEntries(
      Object.entries(item.originalData || {}).map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map(entry => {
            const date = new Date(entry);
            return Number.isNaN(date.getTime()) ? String(entry) : date.toISOString().split('T')[0];
          }).join(', ')
          : value
      ])
    ));
    const createSheet = rows => {
      const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
      const sheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
      const border = {
        top: { style: 'thin', color: { rgb: 'B7C9B2' } },
        bottom: { style: 'thin', color: { rgb: 'B7C9B2' } },
        left: { style: 'thin', color: { rgb: 'B7C9B2' } },
        right: { style: 'thin', color: { rgb: 'B7C9B2' } }
      };

      for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
        for (let columnIndex = range.s.c; columnIndex <= range.e.c; columnIndex += 1) {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: columnIndex });
          if (!sheet[cellAddress]) sheet[cellAddress] = { t: 's', v: '' };
          sheet[cellAddress].s = {
            border,
            alignment: { vertical: 'center', wrapText: true, horizontal: rowIndex === 0 ? 'center' : 'left' },
            ...(rowIndex === 0 ? {
              fill: { fgColor: { rgb: '92D050' } },
              font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 }
            } : {})
          };
        }
      }

      sheet['!cols'] = headers.map(header => ({
        wch: Math.min(Math.max(header.length + 3, 14), 28)
      }));
      sheet['!rows'] = [{ hpt: 24 }];
      return sheet;
    };

    const regulerRows = prepareRows(data.filter(item => item.type === 'Reguler'));
    const nonRegulerRows = prepareRows(data.filter(item => item.type === 'Non-Reguler'));

    XLSX.utils.book_append_sheet(workbook, createSheet(regulerRows), 'Program Reguler');
    XLSX.utils.book_append_sheet(workbook, createSheet(nonRegulerRows), 'Program Non-Reguler');
    XLSX.writeFile(workbook, 'semua-data-program-training.xlsx');
  };

  const exportAllToCsv = () => {
    const records = data.map(item => ({
      Jenis: item.type || '-',
      ...(item.originalData || {}),
    }));
    const headers = [...new Set(records.flatMap(record => Object.keys(record)))];
    const serializeValue = value => {
      if (Array.isArray(value)) {
        return value.map(entry => {
          const date = new Date(entry);
          return Number.isNaN(date.getTime()) ? String(entry) : date.toISOString().split('T')[0];
        }).join(', ');
      }
      return value;
    };
    const escapeCsvValue = value => `"${String(serializeValue(value) ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(escapeCsvValue), ...records.map(record => headers.map(header => escapeCsvValue(record[header])))]
      .map(row => row.join(','))
      .join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'semua-data-program-training.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Data</h1>
          <p className="text-slate-500">Kelola data pelatihan reguler dan non-reguler.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportAllToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet size={18} /> Export Excel
          </button>
          <button
            onClick={exportAllToCsv}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <FileText size={18} /> Export CSV
          </button>
          <button
            onClick={() => { setFormType('non_reguler'); setFormData({}); setIsEditMode(false); setEditId(null); setIsModalOpen(true); }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Tambah Data
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex w-full sm:w-auto gap-4">
            <select 
              value={filterType} 
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }} 
              className="border border-slate-300 rounded-lg px-4 py-2 text-slate-700 text-sm font-medium outline-none focus:border-green-500 w-full sm:w-48 bg-white appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
              <option value="Semua">Semua Tipe</option>
              <option value="Reguler">Reguler</option>
              <option value="Non-Reguler">Non-Reguler</option>
            </select>
            <select 
              value={filterRegion} 
              onChange={(e) => { setFilterRegion(e.target.value); setCurrentPage(1); }} 
              className="border border-slate-300 rounded-lg px-4 py-2 text-slate-700 text-sm font-medium outline-none focus:border-green-500 w-full sm:w-48 bg-white appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
              <option value="Semua Region">Semua Region</option>
              {uniqueRegions.map((reg, idx) => (
                <option key={idx} value={reg}>{reg}</option>
              ))}
            </select>
            <select 
              value={filterSubKategori} 
              onChange={(e) => { setFilterSubKategori(e.target.value); setCurrentPage(1); }} 
              className="border border-slate-300 rounded-lg px-4 py-2 text-slate-700 text-sm font-medium outline-none focus:border-green-500 w-full sm:w-48 bg-white appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
              <option value="Semua Sub Kategori">Semua Sub Kategori</option>
              {uniqueSubKategories.map((sub, idx) => (
                <option key={idx} value={sub}>{sub}</option>
              ))}
            </select>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari pelatihan..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-sm border-b border-slate-200">
                <th className="px-4 py-3 font-medium">Program Pelatihan</th>
                <th className="px-4 py-3 font-medium">Sub Kategori</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Trainer</th>
                <th className="px-4 py-3 font-medium">Total Jam/Hari</th>
                <th className="px-4 py-3 font-medium text-center">TD</th>
                <th className="px-4 py-3 font-medium text-center">Peserta</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="px-4 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-4 py-8 text-center text-slate-500">Tidak ada data ditemukan.</td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-4 font-medium text-slate-800">{item.title}</td>
                    <td className="px-4 py-4 text-slate-600 text-sm">
                      {item.subCategory !== '-' && item.subCategory ? item.subCategory : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                      {item.originalData?.start_date || item.originalData?.mulai_program || item.originalData?.Mulai_program
                        ? `${item.start && !isNaN(item.start) ? item.start.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : 'TBD'} - ${item.end && !isNaN(item.end) ? item.end.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }) : 'TBD'}`
                        : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'Reguler' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.region || '-'}</td>
                    <td className="px-4 py-4 text-slate-600">{item.location}</td>
                    <td className="px-4 py-4 text-slate-600">{item.trainer || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                      {item.type === 'Reguler' 
                        ? `${item.originalData?.jumlah_hari || 0} Hari` 
                        : `${item.originalData?.total_jam || 0} Jam / ${item.originalData?.total_hari || 0} Hari`}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-center font-medium">{item.originalData?.td_total || item.originalData?.Total_training_days || '-'}</td>
                    <td className="px-4 py-4 text-slate-600 text-center font-medium">{item.participants}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus"><Trash2 size={16} /></button>
                      </div>
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
            <span>Showing {filteredData.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} records</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
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
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0 || loading}
              className="w-8 h-8 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">{isEditMode ? 'Edit Data Pelatihan' : 'Tambah Data Pelatihan'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
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
                        <input required type="text" name="jenis_pelatihan" value={formData.jenis_pelatihan || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Training</label>
                        <select required name="type_training" value={formData.type_training || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
                          <option value="">Pilih Tipe</option>
                          <option value="Workshop">Workshop</option>
                          <option value="W & M">W & M</option>
                          <option value="Onsite">Onsite</option>
                          <option value="Online">Online</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                        <select required name="region" value={formData.region || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
                          <option value="">Pilih Region</option>
                          <option value="Riau">Riau</option>
                          <option value="Kalbar">Kalbar</option>
                          <option value="Kaltim FR">Kaltim FR</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Trainer</label>
                        <input 
                          type="text" 
                          list="trainer-options" 
                          name="trainer" 
                          value={formData.trainer || ''} 
                          onChange={handleInputChange} 
                          placeholder="Pilih atau ketik nama trainer"
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" 
                        />
                        <datalist id="trainer-options">
                          <option value="Eksternal" />
                          <option value="Internal" />
                          <option value="Eksternal & Internal" />
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Training</label>
                        <input type="text" name="lokasi_training" value={formData.lokasi_training || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Pelatihan</label>
                        <select required name="sub_kategori" value={formData.sub_kategori || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
                          <option value="">Pilih Kategori</option>
                          <option value="Estate">Estate</option>
                          <option value="Mill">Mill</option>
                          <option value="Traksi">Traksi</option>
                          <option value="Administrasi">Administrasi</option>
                          <option value="Downstream">Downstream</option>
                          <option value="Softskill">Softskill</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Batch</label>
                        <input type="number" name="total_batch" value={formData.total_batch || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Hari</label>
                        <input type="number" name="total_hari" value={formData.total_hari || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Total Jam / Hari</label>
                        <input type="number" name="total_jam" value={formData.total_jam || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Pelaksanaan (Multi)</label>
                        <DatePicker 
                          multiple 
                          range
                          value={groupDatesIntoRanges(formData.tanggal_pelaksanaan)} 
                          onChange={handleDateChange}
                          format="YYYY-MM-DD"
                          placeholder="Pilih rentang/beberapa tanggal..."
                          inputClass="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                          containerClassName="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4 mt-4">
                      <h4 className="font-medium text-slate-800 mb-3">Peserta</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Non-Staf</label>
                          <input type="number" name="peserta_non_staf" value={formData.peserta_non_staf || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">AST</label>
                          <input type="number" name="peserta_ast" value={formData.peserta_ast || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Askep</label>
                          <input type="number" name="peserta_askep" value={formData.peserta_askep || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Manager</label>
                          <input type="number" name="peserta_mgr" value={formData.peserta_mgr || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Grup Manager</label>
                          <input type="number" name="peserta_gm" value={formData.peserta_gm || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Head</label>
                          <input type="number" name="peserta_head" value={formData.peserta_head || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
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
                        <input required type="text" name="Nama_Program_reguler" value={formData.Nama_Program_reguler || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Batch</label>
                        <input type="text" name="Batch" value={formData.Batch || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Lokasi Training</label>
                        <input type="text" name="Lokasi_training" value={formData.Lokasi_training || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sub Kategori</label>
                        <select name="jenis_program_reguler" value={formData.jenis_program_reguler || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
                          <option value="">Pilih Sub Kategori...</option>
                          <option value="Training Reguler - Staf">Training Reguler - Staf</option>
                          <option value="Training Reguler - Mandor">Training Reguler - Mandor</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
                        <select name="Region" value={formData.Region || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white">
                          <option value="">Pilih Region</option>
                          <option value="Riau">Riau</option>
                          <option value="Kalbar">Kalbar</option>
                          <option value="Kaltim FR">Kaltim FR</option>
                          <option value="Corporate">Corporate</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Pelaksanaan (Multi)</label>
                        <DatePicker 
                          multiple 
                          range
                          value={groupDatesIntoRanges(formData.tanggal_pelaksanaan)} 
                          onChange={handleDateChange}
                          format="YYYY-MM-DD"
                          placeholder="Pilih rentang/beberapa tanggal..."
                          inputClass="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                          containerClassName="w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4 mt-4 bg-blue-50/50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-3 text-sm">Kalkulasi Otomatis (Total - Promosi Mandor = Fresh Graduate)</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Total Orang</label>
                          <input type="number" name="Total_orang" value={formData.Total_orang || ''} onChange={handleInputChange} className="w-full p-2 border border-blue-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Promosi Mandor</label>
                          <input type="number" name="Promosi_mandor" value={formData.Promosi_mandor || ''} onChange={handleInputChange} className="w-full p-2 border border-blue-200 rounded-lg" />
                        </div>
                        <div>
                          <label className="block text-xs text-blue-600 font-bold mb-1">Fresh Graduate (Auto)</label>
                          <input type="number" readOnly value={formData.Fresh_Graduate || ''} className="w-full p-2 border border-blue-200 bg-blue-100 text-blue-800 rounded-lg font-bold" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Total Hari</label>
                          <input type="number" name="jumlah_hari" value={formData.jumlah_hari || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Durasi (Bulan)</label>
                          <input type="number" name="jumlah_bulan_training" value={formData.jumlah_bulan_training || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Total Training Days</label>
                          <input type="number" name="Total_training_days" value={formData.Total_training_days || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs text-slate-600 mb-1">Uang Saku</label>
                          <input type="number" name="Uang_saku" value={formData.Uang_saku || ''} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
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
              <button type="submit" form="trainingForm" className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm transition-colors">
                {isEditMode ? 'Simpan Perubahan' : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DataManagement;
