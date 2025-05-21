import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// 配置Supabase连接
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvazpmprgxuukgdgrjgt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2YXpwbXByZ3h1dWtnZGdyamd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM1MTUwMTcsImV4cCI6MjAyOTA5MTAxN30.dGV5mXFa9QD7gUcFYQ3RjhGsnzZAOp0_vfRcKg1uM6Q'

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
) 