'use client'

import { RequireAuth } from '@/components/RequireAuth'

export default function CategoriesLayout({
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