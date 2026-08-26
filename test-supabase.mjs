import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gjyhjhbsvvssxiffrtxe.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeWhqaGJzdnZzc3hpZmZydHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODkyODYsImV4cCI6MjEwMzI2NTI4Nn0.BpyC9Wa51SF6c2lCX4hK9_Al61cvTqoOKmY1r2Evx_s';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing Non-Reguler...');
  const { data, error } = await supabase.from('Program_non_reguler').select('*');
  console.log('Data:', data?.length);
  console.log('Error:', error);
}

test();
