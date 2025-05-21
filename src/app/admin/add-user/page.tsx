'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AddAdminPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // 向自定义admin_users表添加用户
      const { error } = await supabase
        .from('admin_users')
        .insert([
          { email, password }
        ])
      
      if (error) throw error
      
      setSuccess('管理员用户添加成功！')
      setEmail('')
      setPassword('')
    } catch (err: any) {
      setError('添加用户失败: ' + (err.message || err))
      console.error('Error adding admin user:', err)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">添加管理员用户</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">电子邮件</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          {error && (
            <div className="py-2 px-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="py-2 px-3 bg-green-50 text-green-700 rounded-md text-sm">
              {success}
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? '添加中...' : '添加管理员'}
            </button>
            
            <button
              type="button"
              onClick={() => router.push('/auth/simple-login')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              返回登录
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 