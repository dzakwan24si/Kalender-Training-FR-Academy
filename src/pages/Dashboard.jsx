import { useState, useEffect } from 'react';
import { BookOpen, Layers, Users, Filter, PieChart as PieChartIcon, BarChart2, LayoutDashboard as LayoutIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getAllPelatihan } from '../services/supabase/client';

const COLORS = ['#3b82f6', '#a855f7', '#4d7c38', '#84cc46', '#eab308', '#f97316'];

const SUB_SEKTOR_COLORS = {
  'ESTATE': '#10b981',
  'MILL': '#f59e0b',
  'TRAKSI': '#8b5cf6',
  'DOWNSTREAM': '#06b6d4',
  'ADMINISTRASI': '#ec4899',
  'SOFT SKILLS': '#3b82f6'
};

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterKategori, setFilterKategori] = useState('Semua Kategori Program');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const result = await getAllPelatihan();
      if (result.data) {
        const enhancedData = result.data.map(item => {
          let subSektor = 'SOFT SKILLS';
          if (item.type !== 'Reguler') {
             const kat = item.originalData?.kategori_pelatihan?.toUpperCase() || '';
             const jenis = item.originalData?.jenis_pelatihan?.toUpperCase() || '';
             if (kat.includes('ESTATE') || jenis.includes('ESTATE')) subSektor = 'ESTATE';
             else if (kat.includes('MILL') || jenis.includes('MILL')) subSektor = 'MILL';
             else if (kat.includes('TRAKSI') || jenis.includes('TRAKSI')) subSektor = 'TRAKSI';
             else if (kat.includes('DOWNSTREAM') || jenis.includes('DOWNSTREAM')) subSektor = 'DOWNSTREAM';
             else if (kat.includes('ADMINISTRASI') || jenis.includes('FINANCE')) subSektor = 'ADMINISTRASI';
          }

          return { ...item, subSektor };
        });
        setData(enhancedData);
      } else if (result.error) {
        console.error("Error fetching data in Dashboard:", result.error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredData = filterKategori === 'Semua Kategori Program' 
    ? data 
    : data.filter(item => item.category === filterKategori);

  // Metrics
  const totalProgram = filteredData.length;
  const totalBatch = filteredData.reduce((sum, item) => sum + item.batchCount, 0);
  const totalPeserta = filteredData.reduce((sum, item) => sum + (item.participants || item.originalData?.target_total || 0), 0);

  // Chart Data: Distribusi & Batch per Kategori
  const kategoriList = ['Reguler - Staf', 'Reguler - Mandor', 'Riau', 'Kalbar', 'Kaltim', 'Corporate'];
  const chartSourceData = data;

  const kategoriData = kategoriList.map(kat => {
    const items = chartSourceData.filter(d => d.category === kat);
    return {
      name: kat,
      value: items.length,
      batch: items.reduce((sum, item) => sum + item.batchCount, 0),
      peserta: items.reduce((sum, item) => sum + (item.participants || item.originalData?.target_total || 0), 0)
    };
  });

  // Chart: Sub-Sektor (Horizontal Bar)
  const subSektorList = ['ESTATE', 'MILL', 'TRAKSI', 'DOWNSTREAM', 'ADMINISTRASI', 'SOFT SKILLS'];
  const subSektorData = subSektorList.map(sub => {
    const items = filteredData.filter(d => d.type !== 'Reguler' && d.subSektor === sub);
    return {
      name: sub,
      value: items.reduce((sum, item) => sum + item.batchCount, 0),
      fill: SUB_SEKTOR_COLORS[sub]
    };
  });


  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex flex-col justify-center gap-3 text-xs text-slate-600 pl-4">
        {payload.map((entry, index) => (
          <li key={`item-${index}`} className="flex items-center gap-2">
            <span className="w-6 h-2 rounded-sm" style={{ backgroundColor: entry.color }}></span>
            {entry.value}
          </li>
        ))}
      </ul>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-transparent mb-6 mt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dashboard Ringkasan</h1>
          <p className="text-slate-500 mt-1">Laporan grafis dan visualisasi program pelatihan.</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
           <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
           <span className="font-bold text-slate-700 text-sm">Tahun Aktif: {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-slate-700 font-bold">
            <Filter size={18} className="text-green-600" />
            <span>Filter Dashboard:</span>
          </div>
          <select 
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 text-slate-700 font-medium outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 w-full sm:w-64 transition-all"
          >
            <option>Semua Kategori Program</option>
            {kategoriList.map(kat => (
              <option key={kat} value={kat}>{kat}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => setFilterKategori('Semua Kategori Program')}
          className="text-red-500 font-bold text-sm hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          Reset Filter
        </button>
      </div>
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-green-300 transition-colors">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner flex-shrink-0">
            <BookOpen size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Total Program</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-tight">{totalProgram}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-colors">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-inner flex-shrink-0">
            <Layers size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Total Rencana Batch</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-tight">{totalBatch}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-purple-300 transition-colors">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shadow-inner flex-shrink-0">
            <Users size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">Total Target Peserta</p>
            <p className="text-2xl font-extrabold text-slate-800 leading-tight">{totalPeserta.toLocaleString('id-ID')} <span className="text-sm font-semibold text-slate-400">org</span></p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Distribusi Kategori */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3 text-sm">
            <PieChartIcon size={18} className="text-green-600" />
            Distribusi Program
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={kategoriData} dataKey="value" nameKey="name" cx="40%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="none">
                  {kategoriData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend content={renderLegend} layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Batch */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3 text-sm">
            <BarChart2 size={18} className="text-green-600" />
            Rencana Jumlah Batch
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kategoriData} margin={{ top: 10, right: 10, left: -25, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} angle={-15} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="batch" fill="#4d7c38" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Peserta */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3 text-sm">
            <BarChart2 size={18} className="text-green-600" />
            Total Target Peserta
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kategoriData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} angle={-15} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="peserta" fill="#84cc46" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Horizontal Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-100 pb-3 text-sm">
            <LayoutIcon size={18} className="text-green-600" />
            Distribusi Program Non-Reguler (Sub-Sektor)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={subSektorData} margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {subSektorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
  