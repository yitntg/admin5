'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Navigation = () => {
  const pathname = usePathname()

  const links = [
    { href: '/', label: '首页', icon: '🏠' },
    { href: '/categories', label: '分类管理', icon: '📂' },
    { href: '/products', label: '商品管理', icon: '📦' },
  ]

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
        
        <div className="p-4 border-t text-center text-xs text-gray-500">
          © {new Date().getFullYear()} 电商管理系统
        </div>
      </div>
    </aside>
  )
}

export default Navigation 