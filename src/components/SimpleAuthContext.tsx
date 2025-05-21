'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { localSignIn, getLocalSession, setLocalSession, clearLocalSession } from '@/lib/simple-auth'

// 定义简化认证上下文类型
type SimpleAuthContextType = {
  user: any | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{
    error: any | null
    success: boolean
  }>
  signOut: () => void
  isAuthenticated: boolean
}

// 创建认证上下文
const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined)

// 认证提供者组件
export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // 初始加载时从localStorage获取session
    const session = getLocalSession()
    setUser(session)
    setIsAuthenticated(!!session)
    setIsLoading(false)
  }, [])

  // 登录
  const signIn = async (email: string, password: string) => {
    try {
      const { user, error } = await localSignIn(email, password)
      
      if (user) {
        setUser(user)
        setIsAuthenticated(true)
        setLocalSession(user)
        return { error: null, success: true }
      } else {
        return { error, success: false }
      }
    } catch (error) {
      return { error, success: false }
    }
  }

  // 登出
  const signOut = () => {
    setUser(null)
    setIsAuthenticated(false)
    clearLocalSession()
  }

  // 提供的上下文值
  const value: SimpleAuthContextType = {
    user,
    isLoading,
    signIn,
    signOut,
    isAuthenticated,
  }

  return <SimpleAuthContext.Provider value={value}>{children}</SimpleAuthContext.Provider>
}

// 自定义钩子以便在组件中使用认证上下文
export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext)
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider')
  }
  return context
} 