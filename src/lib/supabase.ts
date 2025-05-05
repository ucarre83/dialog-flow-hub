
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Supabase URL y anon key from our project
const supabaseUrl = 'https://ofxyumqneangphbdvzim.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9meHl1bXFuZWFuZ3BoYmR2emltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NjcxMzcsImV4cCI6MjA2MDU0MzEzN30.hhGWYtzMtr5MjjaG0vgcs2vDL3ZBWYV9R4RrNPt-Nio';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Types for the database are now imported from @/integrations/supabase/types
// These are just additional type definitions for convenience
export type User = Database['public']['Tables']['users']['Row'];
export type Chat = Database['public']['Tables']['chats']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
