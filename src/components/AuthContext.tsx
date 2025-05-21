'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// 定义认证上下文类型
type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{
    error: any | null
    success: boolean
  }>
  signUp: (email: string, password: string) => Promise<{
    error: any | null
    success: boolean
  }>
  signOut: () => Promise<void>
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 认证提供者组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 初始加载时获取session
    async function loadUserSession() {
      const { data: { session } } = await supabase.auth.getSession()
      
      // 设置session和user
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      
      // 监听认证状态变化
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      )
      
      return () => {
        authListener.subscription.unsubscribe()
      }
    }
    
    loadUserSession()
  }, [])

  // 登录
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error, success: !error }
    } catch (error) {
      return { error, success: false }
    }
  }

  // 注册
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error, success: !error }
    } catch (error) {
      return { error, success: false }
    }
  }

  // 登出
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // 提供的上下文值
  const value: AuthContextType = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 自定义钩子以便在组件中使用认证上下文
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 