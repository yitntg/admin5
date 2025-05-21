'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'

const Navigation = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, isLoading } = useAuth()

  const links = [
    { href: '/', label: '首页', icon: '🏠' },
    { href: '/categories', label: '分类管理', icon: '📂' },
    { href: '/products', label: '商品管理', icon: '📦' },
  ]
  
  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-md z-10">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <span className="text-xl font-bold block py-4">电商管理系统</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2">
            {links.map((link) => {
              const isActive = pathname === link.href
              
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center px-4 py-3 mb-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3 text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t">
          {isLoading ? (
            <div className="text-center text-sm text-gray-500">加载中...</div>
          ) : user ? (
            <div className="space-y-2">
              <div className="bg-gray-100 p-3 rounded-md">
                <div className="font-medium text-sm">{user.email}</div>
                <div className="text-xs text-gray-500">已登录</div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full py-2 px-4 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                退出登录
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                href="/auth/login"
                className="block w-full py-2 px-4 text-sm text-center text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                登录
              </Link>
              <Link
                href="/auth/register"
                className="block w-full py-2 px-4 text-sm text-center text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                注册
              </Link>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t text-center text-xs text-gray-500">
          © {new Date().getFullYear()} 电商管理系统
        </div>
      </div>
    </aside>
  )
}

export default Navigation 