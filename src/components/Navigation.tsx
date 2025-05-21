'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSimpleAuth } from './SimpleAuthContext'

const Navigation = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut, isLoading, isAuthenticated } = useSimpleAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 检测屏幕尺寸
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // 初始检查
    checkIfMobile()
    
    // 监听窗口尺寸变化
    window.addEventListener('resize', checkIfMobile)
    
    // 清理函数
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const links = [
    { href: '/', label: '首页', icon: '🏠' },
    { href: '/categories', label: '分类管理', icon: '📂' },
    { href: '/products', label: '商品管理', icon: '📦' },
  ]
  
  const handleSignOut = () => {
    signOut()
    router.push('/auth/simple-login')
    setIsMobileMenuOpen(false)
  }
  
  // 关闭菜单的函数
  const closeMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // 移动端抽屉菜单
  const MobileDrawer = () => (
    <>
      {/* 半透明背景 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={closeMenu}
        ></div>
      )}
      
      {/* 抽屉菜单 */}
      <aside 
        className={`fixed left-0 top-0 bottom-0 w-64 bg-white shadow-md z-30 transform transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex justify-between items-center">
            <span className="text-xl font-bold py-2">电商管理系统</span>
            <button 
              onClick={closeMenu} 
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2">
              {links.map((link) => {
                const isActive = pathname === link.href
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
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
            ) : isAuthenticated ? (
              <div className="space-y-2">
                <div className="bg-gray-100 p-3 rounded-md">
                  <div className="font-medium text-sm">{user?.email}</div>
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
                  href="/auth/simple-login"
                  className="block w-full py-2 px-4 text-sm text-center text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  onClick={closeMenu}
                >
                  管理员登录
                </Link>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t text-center text-xs text-gray-500">
            © {new Date().getFullYear()} 电商管理系统
          </div>
        </div>
      </aside>
    </>
  )
  
  // 移动端顶部导航条
  const MobileNavbar = () => (
    <div className="fixed top-0 left-0 right-0 h-14 bg-white shadow-md z-10 flex items-center px-4 md:hidden">
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
      >
        ☰
      </button>
      <h1 className="text-lg font-bold ml-4">电商管理系统</h1>
      {isAuthenticated && (
        <div className="ml-auto mr-1 text-sm text-gray-500 truncate max-w-[150px]">
          {user?.email}
        </div>
      )}
    </div>
  )

  // 桌面端侧边栏
  const DesktopSidebar = () => (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-md z-10 hidden md:block">
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
          ) : isAuthenticated ? (
            <div className="space-y-2">
              <div className="bg-gray-100 p-3 rounded-md">
                <div className="font-medium text-sm">{user?.email}</div>
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
                href="/auth/simple-login"
                className="block w-full py-2 px-4 text-sm text-center text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                管理员登录
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

  return (
    <>
      {isMobile ? <MobileNavbar /> : <DesktopSidebar />}
      {isMobile && <MobileDrawer />}
    </>
  )
}

export default Navigation 