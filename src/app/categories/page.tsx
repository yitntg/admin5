'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Category = Database['public']['Tables']['categories']['Row']

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

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
      setErrorMessage('加载分类失败，请刷新页面重试')
      return
    }

    setCategories(data || [])
    setErrorMessage(null)
  }

  async function addOrUpdateCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategory.trim()) return
    
    setIsLoading(true)
    
    try {
      let error;
      
      if (editingCategory) {
        // 更新分类
        const result = await supabase
          .from('categories')
          .update({ name: newCategory.trim() })
          .eq('id', editingCategory.id)
          
        error = result.error
      } else {
        // 添加新分类
        const result = await supabase
          .from('categories')
          .insert([{ name: newCategory.trim() }])
          
        error = result.error
      }
  
      if (error) {
        console.error('Error saving category:', error)
        setErrorMessage(`${editingCategory ? '更新' : '添加'}分类失败: ${error.message}`)
        return
      }
  
      resetForm()
      setErrorMessage(null)
      await fetchCategories()
    } catch (err) {
      console.error('Error:', err)
      setErrorMessage(`${editingCategory ? '更新' : '添加'}分类时发生错误`)
    } finally {
      setIsLoading(false)
    }
  }
  
  function resetForm() {
    setNewCategory('')
    setEditingCategory(null)
  }
  
  function startEditing(category: Category) {
    setEditingCategory(category)
    setNewCategory(category.name)
  }
  
  async function deleteCategory(id: number) {
    if (!confirm('确定要删除此分类吗？如果该分类下有商品，删除操作可能会失败。')) {
      return
    }
    
    setDeleteLoading(id)
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        
      if (error) {
        console.error('Error deleting category:', error)
        setErrorMessage(`删除分类失败: ${error.message}`)
        return
      }
      
      setErrorMessage(null)
      await fetchCategories()
    } catch (err) {
      console.error('Error:', err)
      setErrorMessage('删除分类时发生错误')
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">分类管理</h1>
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={addOrUpdateCategory} className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">
          {editingCategory ? '编辑分类' : '添加新分类'}
        </h2>
        
        <div className="flex gap-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="输入分类名称"
            className="flex-1 px-4 py-2 border rounded"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading || !newCategory.trim()}
          >
            {isLoading 
              ? (editingCategory ? '更新中...' : '添加中...') 
              : (editingCategory ? '更新分类' : '添加分类')}
          </button>
          
          {editingCategory && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              取消
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-4 border rounded shadow hover:shadow-md relative bg-white"
          >
            <div className="absolute top-2 right-2 flex gap-2">
              <button 
                onClick={() => startEditing(category)}
                className="p-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                编辑
              </button>
              <button 
                onClick={() => deleteCategory(category.id)}
                className="p-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
                disabled={deleteLoading === category.id}
              >
                {deleteLoading === category.id ? '删除中...' : '删除'}
              </button>
            </div>
            
            <h3 className="text-lg font-semibold pr-16">{category.name}</h3>
            <p className="text-sm text-gray-500">
              创建时间: {new Date(category.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
} 