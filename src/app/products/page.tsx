'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // 当分类加载完成后，自动选择第一个分类
  useEffect(() => {
    if (categories.length > 0) {
      setFormData(prev => ({
        ...prev,
        category: categories[0].id.toString()
      }))
    }
  }, [categories])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return
    }

    setProducts(data || [])
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return
    }

    setCategories(data || [])
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.category) {
      alert('请选择一个分类')
      return
    }
    
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          category: parseInt(formData.category)
        }])
  
      if (error) {
        console.error('Error adding product:', error)
        alert(`添加商品失败: ${error.message}`)
        return
      }
  
      setFormData({
        name: '',
        description: '',
        price: '',
        category: categories.length > 0 ? categories[0].id.toString() : ''
      })
      await fetchProducts()
    } catch (err) {
      console.error('Error:', err)
      alert('添加商品时发生错误')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function deleteProduct(id: number) {
    if (!confirm('确定要删除此商品吗？此操作不可恢复。')) {
      return
    }
    
    setDeleteLoading(id)
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        
      if (error) {
        console.error('Error deleting product:', error)
        alert(`删除商品失败: ${error.message}`)
        return
      }
      
      await fetchProducts()
    } catch (err) {
      console.error('Error:', err)
      alert('删除商品时发生错误')
    } finally {
      setDeleteLoading(null)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">商品管理</h1>
      
      <form onSubmit={addProduct} className="mb-8 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">商品名称</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">商品描述</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">价格</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full px-4 py-2 border rounded"
            step="0.01"
            min="0"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">分类</label>
          <select
            value={formData.category} 
            onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
            className="w-full px-4 py-2 border rounded"
            required
          >
            <option value="">选择分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          className="w-full px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          disabled={isLoading}
        >
          {isLoading ? '添加中...' : '添加商品'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          // 查找分类名称
          const categoryName = categories.find(c => c.id === product.category)?.name || '未知分类';
          
          return (
            <div
              key={product.id}
              className="p-4 border rounded shadow hover:shadow-md relative"
            >
              <div className="absolute top-2 right-2 flex gap-2">
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="p-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-red-300"
                  disabled={deleteLoading === product.id}
                >
                  {deleteLoading === product.id ? '删除中...' : '删除'}
                </button>
              </div>
              
              <h3 className="text-lg font-semibold pr-16">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-1">{product.description}</p>
              <p className="text-sm text-gray-500 mb-2">分类: {categoryName}</p>
              <p className="text-lg font-bold text-blue-600">¥{product.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500">
                创建时间: {new Date(product.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  )
} 