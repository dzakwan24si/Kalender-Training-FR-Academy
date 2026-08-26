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

const getCategory = (type, title, location) => {
  const region = normalizeRegion(location);
  if (type === 'Reguler') {
    if (region === 'Riau') return 'Reguler - Staf';
    if (region === 'Kaltim' || region === 'Kalbar') return 'Reguler - Mandor';
    return title.toLowerCase().includes('mandor') ? 'Reguler - Mandor' : 'Reguler - Staf';
  }

  if (region !== 'Corporate') return region;
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
    type: 'Non-Reguler',
    location: item.lokasi_training,
    region: item.region || normalizeRegion(item.lokasi_training),
    category: getCategory('Non-Reguler', item.jenis_pelatihan, item.lokasi_training),
    batchCount: Number(item.total_batch) || 1,
    participants: item.target_total || 0,
    trainer: item.trainer,
    originalData: item
  }));

  const normalizedReguler = (reguler.data || []).map(item => ({
    id: `reg-${item.Program_reguler_id}`,
    title: item.Nama_Program_reguler,
    start: item.Mulai_program ? new Date(item.Mulai_program) : null,
    end: item.Selesai_program ? new Date(item.Selesai_program) : null,
    type: 'Reguler',
    location: item.Lokasi_training,
    region: normalizeRegion(item.Lokasi_training),
    category: getCategory('Reguler', item.Nama_Program_reguler, item.Lokasi_training),
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
