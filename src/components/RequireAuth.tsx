'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSimpleAuth } from './SimpleAuthContext'

interface RequireAuthProps {
  children: React.ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useSimpleAuth()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 未登录用户重定向到登录页面
      router.push('/auth/simple-login')
    }
  }, [isLoading, isAuthenticated, router])
  
  // 如果正在加载用户信息，显示加载状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">正在加载...</div>
          <div className="text-sm text-gray-500">请稍候</div>
        </div>
      </div>
    )
  }
  
  // 如果用户未登录，不渲染子组件
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md w-full bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">需要登录</h2>
          <p className="text-gray-600">请登录后访问此页面</p>
          <button
            onClick={() => router.push('/auth/simple-login')}
            className="mt-4 inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-sm rounded shadow-md hover:bg-blue-700 transition-colors"
          >
            前往登录
          </button>
        </div>
      </div>
    )
  }
  
  // 用户已登录，渲染子组件
  return <>{children}</>
} 