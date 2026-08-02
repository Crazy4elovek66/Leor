import { createClient } from '@supabase/supabase-js';
import type { Database } from '../shared/types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper for type-safe table access
export function fromTable<T extends keyof Database['public']['Tables']>(table: T) {
  return supabase.from(table) as any;
}
