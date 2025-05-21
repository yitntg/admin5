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
    category_id: ''
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return
    }

    setProducts(data)
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

    setCategories(data)
  }

  async function addProduct(e: React.FormEvent) {
    e.preventDefault()
    
    const { error } = await supabase
      .from('products')
      .insert([{
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id)
      }])

    if (error) {
      console.error('Error adding product:', error)
      return
    }

    setFormData({
      name: '',
      description: '',
      price: '',
      category_id: ''
    })
    fetchProducts()
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
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
          className="w-full px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          添加商品
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="p-4 border rounded shadow hover:shadow-md"
          >
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
            <p className="text-lg font-bold text-blue-600">¥{product.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500">
              创建时间: {new Date(product.created_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
} 