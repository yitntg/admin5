'use client'

import { RequireAuth } from '@/components/RequireAuth'

export default function ProductsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAuth>
      {children}
    </RequireAuth>
  )
} 