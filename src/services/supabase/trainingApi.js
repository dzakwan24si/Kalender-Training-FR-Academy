import { supabase } from './client';

// Helper to check if using placeholder credentials
const isMockMode = false;

// --- Mock Data for Demo Purposes ---
const mockNonReguler = [
  {
    id_nonreguler: 1, kategori_pelatihan: 'Teknis', jenis_pelatihan: 'Agronomi Dasar (Estate)', region: 'Riau', trainer: 'Budi Santoso', type_training: 'Offline', lokasi_training: 'TC Riau', start_date: '2026-08-10T09:00:00Z', end_date: '2026-08-12T17:00:00Z', total_batch: 45, target_total: 1500
  },
  {
    id_nonreguler: 2, kategori_pelatihan: 'Teknis', jenis_pelatihan: 'Operasional Mill', region: 'Kalbar', trainer: 'Andi', type_training: 'Offline', lokasi_training: 'Kalbar', start_date: '2026-08-15T09:00:00Z', end_date: '2026-08-18T17:00:00Z', total_batch: 34, target_total: 700
  },
  {
    id_nonreguler: 3, kategori_pelatihan: 'Soft Skill', jenis_pelatihan: 'Leadership', region: 'Kaltim', trainer: 'Citra', type_training: 'Online', lokasi_training: 'Kaltim', start_date: '2026-08-25T09:00:00Z', end_date: '2026-08-26T17:00:00Z', total_batch: 29, target_total: 400
  },
  {
    id_nonreguler: 4, kategori_pelatihan: 'Corporate', jenis_pelatihan: 'Budaya Perusahaan', region: 'Corporate', trainer: 'HR', type_training: 'Online', lokasi_training: 'HQ', start_date: '2026-09-02T09:00:00Z', end_date: '2026-09-02T17:00:00Z', total_batch: 2, target_total: 50
  },
  {
    id_nonreguler: 5, kategori_pelatihan: 'Administrasi', jenis_pelatihan: 'Finance 101', region: 'Riau', trainer: 'Tim Finance', type_training: 'Online', lokasi_training: 'Zoom', start_date: '2026-09-10T09:00:00Z', end_date: '2026-09-11T17:00:00Z', total_batch: 10, target_total: 150
  },
  {
    id_nonreguler: 6, kategori_pelatihan: 'Traksi', jenis_pelatihan: 'Maintenance Traksi', region: 'Kalbar', trainer: 'Eng', type_training: 'Offline', lokasi_training: 'TC Kalbar', start_date: '2026-09-20T09:00:00Z', end_date: '2026-09-24T17:00:00Z', total_batch: 15, target_total: 200
  }
];

const mockReguler = [
  {
    program_reguler_id: 1, nama_program_reguler: 'Management Trainee Staf', batch: 'Batch 12', lokasi_training: 'TC Riau', total_orang: 120, mulai_program: '2026-08-01T09:00:00Z', selesai_program: '2026-08-30T17:00:00Z'
  },
  {
    program_reguler_id: 2, nama_program_reguler: 'Pelatihan Mandor', batch: 'Batch 5', lokasi_training: 'TC Kalbar', total_orang: 50, mulai_program: '2026-09-05T09:00:00Z', selesai_program: '2026-09-25T17:00:00Z'
  }
];

// --- API Functions ---

export const getPelatihanNonReguler = async () => {
  if (isMockMode) return { data: mockNonReguler, error: null };
  const { data, error } = await supabase.from('Program_non_reguler').select('*').order('start_date', { ascending: false });
  if (error) console.error('Supabase Error (Non-Reguler):', error);
  return { data: data || [], error };
};

export const getPelatihanReguler = async () => {
  if (isMockMode) return { data: mockReguler, error: null };
  const { data, error } = await supabase.from('pelatihan_reguler').select('*').order('mulai_program', { ascending: false });
  if (error) console.error('Supabase Error (Reguler):', error);
  return { data: data || [], error };
};

export const getAllPelatihan = async () => {
  const [nonReguler, reguler] = await Promise.all([
    getPelatihanNonReguler(),
    getPelatihanReguler()
  ]);

  if (nonReguler.error) console.error('Failed to fetch Non-Reguler:', nonReguler.error);
  if (reguler.error) console.error('Failed to fetch Reguler:', reguler.error);

  // Normalize data for calendar and dashboard
  const normalizedNonReguler = (nonReguler.data || []).map(item => ({
    id: `non-reg-${item.id_nonreguler || item.id}`,
    title: item.jenis_pelatihan,
    start: new Date(item.start_date),
    end: new Date(item.end_date),
    type: 'Non-Reguler',
    location: item.lokasi_training,
    participants: item.target_total || 0,
    trainer: item.trainer,
    originalData: item
  }));

  const normalizedReguler = (reguler.data || []).map(item => ({
    id: `reg-${item.program_reguler_id}`,
    title: item.nama_program_reguler,
    start: new Date(item.mulai_program),
    end: new Date(item.selesai_program),
    type: 'Reguler',
    location: item.lokasi_training,
    participants: item.total_orang || 0,
    trainer: 'Internal',
    originalData: item
  }));

  return { data: [...normalizedNonReguler, ...normalizedReguler], error: null };
};

export const addPelatihanNonReguler = async (data) => {
  if (isMockMode) {
    console.log('Mock Insert Non-Reguler', data);
    return { data: [{...data, id_nonreguler: Math.floor(Math.random() * 1000)}], error: null };
  }
  return supabase.from('Program_non_reguler').insert([data]).select();
};

export const addPelatihanReguler = async (data) => {
  if (isMockMode) {
    console.log('Mock Insert Reguler', data);
    return { data: [{...data, program_reguler_id: Math.floor(Math.random() * 1000)}], error: null };
  }
  return supabase.from('pelatihan_reguler').insert([data]).select();
};

export const updatePelatihanNonReguler = async (id, data) => {
  if (isMockMode) return { data, error: null };
  return supabase.from('Program_non_reguler').update(data).eq('id_nonreguler', id).select();
};

export const deletePelatihanNonReguler = async (id) => {
  if (isMockMode) return { data: null, error: null };
  return supabase.from('Program_non_reguler').delete().eq('id_nonreguler', id);
};

export const updatePelatihanReguler = async (id, data) => {
  if (isMockMode) return { data, error: null };
  return supabase.from('pelatihan_reguler').update(data).eq('program_reguler_id', id).select();
};

export const deletePelatihanReguler = async (id) => {
  if (isMockMode) return { data: null, error: null };
  return supabase.from('pelatihan_reguler').delete().eq('program_reguler_id', id);
};
