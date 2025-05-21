'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Category = Database['public']['Tables']['categories']['Row']

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching categories:', error)
      return
    }

    setCategories(data)
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategory.trim()) return

    const { error } = await supabase
      .from('categories')
      .insert([{ name: newCategory.trim() }])

    if (error) {
      console.error('Error adding category:', error)
      return
    }

    setNewCategory('')
    fetchCategories()
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">分类管理</h1>
      
      <form onSubmit={addCategory} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="输入分类名称"
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            添加分类
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-4 border rounded shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold">{category.name}</h3>
            <p className="text-sm text-gray-500">
              创建时间: {new Date(category.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
} 