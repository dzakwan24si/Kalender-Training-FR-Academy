import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gjyhjhbsvvssxiffrtxe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeWhqaGJzdnZzc3hpZmZydHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODkyODYsImV4cCI6MjEwMzI2NTI4Nn0.BpyC9Wa51SF6c2lCX4hK9_Al61cvTqoOKmY1r2Evx_s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- API Functions ---

const normalizeRegion = (location) => {
  const normalizedLocation = (location || '').toLowerCase();
  if (normalizedLocation.includes('frlc kubang') || normalizedLocation.includes('riau')) return 'Riau';
  if (normalizedLocation.includes('frls kalbar') || normalizedLocation.includes('kalbar')) return 'Kalbar';
  if (normalizedLocation.includes('kubar') || normalizedLocation.includes('kaltim')) return 'Kaltim';
  return 'Corporate';
};

const getCategory = (type, title, region, subCategory) => {
  if (type === 'Reguler') {
    if (subCategory && subCategory.toLowerCase().includes('mandor')) return 'Reguler - Mandor';
    if (subCategory && subCategory.toLowerCase().includes('staf')) return 'Reguler - Staf';
    if (title && title.toLowerCase().includes('mandor')) return 'Reguler - Mandor';

    const normRegion = normalizeRegion(region);
    if (normRegion === 'Riau') return 'Reguler - Staf';
    if (normRegion === 'Kaltim' || normRegion === 'Kalbar') return 'Reguler - Mandor';
    return 'Reguler - Staf';
  }

  const normalizedRegion = (region || '').toLowerCase();
  if (normalizedRegion.includes('riau')) return 'Riau';
  if (normalizedRegion.includes('kalbar')) return 'Kalbar';
  if (normalizedRegion.includes('kaltim')) return 'Kaltim';
  return 'Corporate';
};

export const getPelatihanNonReguler = async () => {
  const { data, error } = await supabase.from('Program_non_reguler').select('*').order('start_date', { ascending: false });
  return { data: data || [], error };
};

export const getPelatihanReguler = async () => {
  const { data, error } = await supabase.from('Program_reguler').select('*').order('Mulai_program', { ascending: false });
  return { data: data || [], error };
};

export const getAllPelatihan = async () => {
  const [nonReguler, reguler] = await Promise.all([
    getPelatihanNonReguler(),
    getPelatihanReguler()
  ]);

  if (nonReguler.error || reguler.error) {
    return { data: null, error: nonReguler.error || reguler.error };
  }

  // Normalize data for calendar and dashboard
  const normalizedNonReguler = (nonReguler.data || []).map(item => ({
    id: `non-reg-${item.id_nonreguler}`,
    title: item.jenis_pelatihan,
    start: item.start_date ? new Date(item.start_date) : null,
    end: item.end_date ? new Date(item.end_date) : null,
    tanggal_pelaksanaan: Array.isArray(item.tanggal_pelaksanaan) ? item.tanggal_pelaksanaan.map(d => new Date(d)) : (item.start_date && item.end_date ? [new Date(item.start_date), new Date(item.end_date)] : []),
    type: 'Non-Reguler',
    location: item.lokasi_training,
    region: item.region || normalizeRegion(item.lokasi_training),
    category: getCategory('Non-Reguler', item.jenis_pelatihan, item.region, item.sub_kategori),
    subCategory: (item.sub_kategori || '-').replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').trim(),
    batchCount: item.total_batch !== null && item.total_batch !== undefined ? Number(item.total_batch) : 1,
    participants: item.target_total || 0,
    trainer: item.trainer,
    originalData: item
  }));

  const normalizedReguler = (reguler.data || []).map(item => ({
    id: `reg-${item.Program_reguler_id}`,
    title: item.Nama_Program_reguler,
    start: item.Mulai_program ? new Date(item.Mulai_program) : null,
    end: item.Selesai_program ? new Date(item.Selesai_program) : null,
    tanggal_pelaksanaan: Array.isArray(item.tanggal_pelaksanaan) ? item.tanggal_pelaksanaan.map(d => new Date(d)) : (item.Mulai_program && item.Selesai_program ? [new Date(item.Mulai_program), new Date(item.Selesai_program)] : []),
    type: 'Reguler',
    location: item.Lokasi_training,
    region: item.Region || normalizeRegion(item.Lokasi_training),
    category: getCategory('Reguler', item.Nama_Program_reguler, item.Region || item.Lokasi_training, item.jenis_program_reguler),
    subCategory: (item.jenis_program_reguler || '-').replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').trim(),
    batch: item.Batch,
    batchCount: 1,
    participants: item.Total_orang || 0,
    trainer: 'Internal',
    originalData: item
  }));

  return { data: [...normalizedNonReguler, ...normalizedReguler], error: null };
};

export const addPelatihanNonReguler = async (data) => {
  const dbData = { ...data };
  if (dbData.tipe_training) {
    dbData.type_training = dbData.tipe_training;
    delete dbData.tipe_training;
  }
  return supabase.from('Program_non_reguler').insert([dbData]).select();
};

export const addPelatihanReguler = async (data) => {
  const dbData = { ...data };
  if (dbData.jumlah_bulan_traning !== undefined) {
    dbData.jumlah_bulan_training = dbData.jumlah_bulan_traning;
    delete dbData.jumlah_bulan_traning;
  }
  return supabase.from('Program_reguler').insert([dbData]).select();
};

export const updatePelatihanNonReguler = async (id, data) => {
  const dbData = { ...data };
  if (dbData.tipe_training) {
    dbData.type_training = dbData.tipe_training;
    delete dbData.tipe_training;
  }
  delete dbData.id_nonreguler;
  return supabase.from('Program_non_reguler').update(dbData).eq('id_nonreguler', id).select();
};

export const deletePelatihanNonReguler = async (id) => {
  return supabase.from('Program_non_reguler').delete().eq('id_nonreguler', id);
};

export const updatePelatihanReguler = async (id, data) => {
  const dbData = { ...data };
  if (dbData.jumlah_bulan_traning !== undefined) {
    dbData.jumlah_bulan_training = dbData.jumlah_bulan_traning;
    delete dbData.jumlah_bulan_traning;
  }
  delete dbData.Program_reguler_id;
  return supabase.from('Program_reguler').update(dbData).eq('Program_reguler_id', id).select();
};

export const deletePelatihanReguler = async (id) => {
  return supabase.from('Program_reguler').delete().eq('Program_reguler_id', id);
};
