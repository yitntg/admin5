import { supabase } from './supabase'

// 简单的登录函数，使用自定义admin_users表
export async function localSignIn(email: string, password: string) {
  try {
    // 从自定义表查询用户（简化版，生产环境中密码应该加密存储）
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();
      
    if (error) {
      return { user: null, error: error.message };
    }
    
    if (!data) {
      return { user: null, error: '用户名或密码不正确' };
    }
    
    // 返回用户信息
    return { 
      user: {
        id: data.id,
        email: data.email,
        created_at: data.created_at
      }, 
      error: null 
    };
  } catch (err: any) {
    return { user: null, error: err.message };
  }
}

// 获取用户会话（从localStorage）
export function getLocalSession() {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userJson = localStorage.getItem('admin_user');
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

// 保存用户会话到localStorage
export function setLocalSession(user: any) {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.setItem('admin_user', JSON.stringify(user));
}

// 清除用户会话
export function clearLocalSession() {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem('admin_user');
} 