import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gjyhjhbsvvssxiffrtxe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqeWhqaGJzdnZzc3hpZmZydHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODkyODYsImV4cCI6MjEwMzI2NTI4Nn0.BpyC9Wa51SF6c2lCX4hK9_Al61cvTqoOKmY1r2Evx_s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
