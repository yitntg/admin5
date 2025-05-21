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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  // 当分类加载完成后，自动选择第一个分类
  useEffect(() => {
    if (categories.length > 0 && !editingProduct) {
      setFormData(prev => ({
        ...prev,
        category: categories[0].id.toString()
      }))
    }
  }, [categories, editingProduct])

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

  async function addOrUpdateProduct(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.category) {
      alert('请选择一个分类')
      return
    }
    
    setIsLoading(true)
    
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: parseInt(formData.category)
      }
      
      let error;
      
      if (editingProduct) {
        // 更新商品
        const result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
        
        error = result.error
      } else {
        // 添加新商品
        const result = await supabase
          .from('products')
          .insert([productData])
          
        error = result.error
      }
  
      if (error) {
        console.error('Error saving product:', error)
        alert(`${editingProduct ? '更新' : '添加'}商品失败: ${error.message}`)
        return
      }
  
      resetForm()
      await fetchProducts()
    } catch (err) {
      console.error('Error:', err)
      alert(`${editingProduct ? '更新' : '添加'}商品时发生错误`)
    } finally {
      setIsLoading(false)
    }
  }
  
  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories.length > 0 ? categories[0].id.toString() : ''
    })
    setEditingProduct(null)
  }
  
  function startEditing(product: Product) {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category.toString()
    })
    
    // 滚动到表单
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      
      <form onSubmit={addOrUpdateProduct} className="mb-8 space-y-4 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold border-b pb-2 mb-4">
          {editingProduct ? '编辑商品' : '添加新商品'}
        </h2>
        
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
        
        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            className="flex-1 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? (editingProduct ? '更新中...' : '添加中...') : (editingProduct ? '更新商品' : '添加商品')}
          </button>
          
          {editingProduct && (
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
        {products.map((product) => {
          // 查找分类名称
          const categoryName = categories.find(c => c.id === product.category)?.name || '未知分类';
          
          return (
            <div
              key={product.id}
              className="p-4 border rounded shadow hover:shadow-md relative bg-white"
            >
              <div className="absolute top-2 right-2 flex gap-2">
                <button 
                  onClick={() => startEditing(product)}
                  className="p-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  编辑
                </button>
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