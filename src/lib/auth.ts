import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// 创建一个supabase客户端（服务器端）
export const createServerSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// 获取当前登录用户（服务器端）
export async function getUser() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return null
  }
  
  return session.user
} 