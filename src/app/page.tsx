'use client'

import { useSimpleAuth } from '@/components/SimpleAuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, isLoading, isAuthenticated } = useSimpleAuth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-blue-600">电商管理系统</h1>
        <p className="text-xl text-gray-600 mt-6">高效的商品管理解决方案</p>
        
        <div className="mt-12 p-8 bg-white rounded-lg shadow-md">
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">正在加载...</p>
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800">欢迎回来，{user?.email}</h2>
              <p className="text-gray-600">您已成功登录系统，可以使用所有功能。</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link
                  href="/products"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  管理商品
                </Link>
                <Link
                  href="/categories"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  管理分类
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800">访问受限功能</h2>
              <p className="text-gray-600">
                请登录账户，以使用商品管理和图片上传等功能。
                <br />
                只有已登录用户才能上传图片和管理商品。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link
                  href="/auth/simple-login"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  管理员登录
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-8 text-gray-500 text-sm">
          <p>本系统使用 Next.js 14、TypeScript、Tailwind CSS 和 Supabase 构建</p>
        </div>
      </div>
    </main>
  );
} 