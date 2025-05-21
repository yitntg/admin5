'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Navigation = () => {
  const pathname = usePathname()

  const links = [
    { href: '/', label: '首页' },
    { href: '/categories', label: '分类管理' },
    { href: '/products', label: '商品管理' },
  ]

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <span className="text-xl font-bold">电商管理系统</span>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {links.map((link) => {
                const isActive = pathname === link.href
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation 