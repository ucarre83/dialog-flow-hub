
import { createClient } from '@supabase/supabase-js';

// Supabase URL y anon key (reemplazar con valores reales en producción)
const supabaseUrl = 'https://your-supabase-project-url.supabase.co';
const supabaseAnonKey = 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos
export type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
  status: 'active' | 'pending' | 'blocked';
  is_admin: boolean;
};

export type Chat = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  last_updated: string;
};

export type Message = {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};
