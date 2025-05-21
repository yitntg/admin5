'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { v4 as uuidv4 } from 'uuid'
import Image from 'next/image'
import { checkStorageSetup } from '@/lib/storage-check'

type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']

// 多图片类型定义
interface ProductImage {
  id: string;
  file: File | null;
  previewUrl: string;
  uploaded: boolean;
  uploading: boolean;
  error: string | null;
  publicUrl: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [storageStatus, setStorageStatus] = useState<{
    checked: boolean;
    ready: boolean;
    message: string;
  }>({
    checked: false,
    ready: false,
    message: '正在检查存储配置...'
  })
  
  // 多图片上传
  const [productImages, setProductImages] = useState<ProductImage[]>([])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    verifyStorageSetup()
  }, [])

  // 验证存储设置
  async function verifyStorageSetup() {
    try {
      const result = await checkStorageSetup();
      setStorageStatus({
        checked: true,
        ready: result.success,
        message: result.message
      });
    } catch (error) {
      console.error('验证存储设置时出错:', error);
      setStorageStatus({
        checked: true,
        ready: false,
        message: '验证存储设置时出错'
      });
    }
  }

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

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    // 限制文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB')
      return
    }

    setImageFile(file)
    
    // 创建预览URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }
  
  // 处理多图片上传
  function handleMultipleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    // 检查文件数量限制
    if (productImages.length + files.length > 5) {
      alert('最多只能上传5张图片')
      return
    }
    
    Array.from(files).forEach(file => {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件')
        return
      }
      
      // 限制文件大小（2MB）
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小不能超过2MB')
        return
      }
      
      // 创建预览URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setProductImages(prev => [...prev, {
          id: uuidv4(),
          file,
          previewUrl: reader.result as string,
          uploaded: false,
          uploading: false,
          error: null,
          publicUrl: null
        }])
      }
      reader.readAsDataURL(file)
    })
  }
  
  // 删除多图片中的一张
  function removeImage(id: string) {
    setProductImages(prev => prev.filter(img => img.id !== id))
  }
  
  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
  }
  
  // 清除所有多图片
  function clearAllImages() {
    setProductImages([])
  }

  async function uploadImage() {
    if (!imageFile) return null
    
    try {
      setUploadProgress(10) // 开始上传
      
      // 生成唯一文件名
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `products/${fileName}`
      
      setUploadProgress(30) // 准备上传
      
      // 上传文件到Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        })
      
      setUploadProgress(70) // 上传完成
      
      if (uploadError) {
        throw uploadError
      }
      
      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)
      
      setUploadProgress(100) // 获取URL完成
      
      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('图片上传失败')
      setUploadProgress(0)
      return null
    }
  }
  
  // 上传多张图片并获取URL
  async function uploadMultipleImages() {
    if (productImages.length === 0) return []
    
    const uploadedUrls: string[] = []
    const updatedImages = [...productImages]
    
    // 逐个上传图片
    for (let i = 0; i < updatedImages.length; i++) {
      const image = updatedImages[i]
      
      if (!image.file || image.uploaded) {
        if (image.publicUrl) {
          uploadedUrls.push(image.publicUrl)
        }
        continue
      }
      
      try {
        // 更新上传状态
        updatedImages[i] = { ...image, uploading: true, error: null }
        setProductImages(updatedImages)
        
        // 生成唯一文件名
        const fileExt = image.file.name.split('.').pop()
        const fileName = `${uuidv4()}.${fileExt}`
        const filePath = `products/${fileName}`
        
        // 上传文件到Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, image.file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          throw uploadError
        }
        
        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath)
        
        uploadedUrls.push(publicUrl)
        
        // 更新上传状态
        updatedImages[i] = {
          ...image,
          uploaded: true,
          uploading: false,
          publicUrl
        }
      } catch (error) {
        console.error('上传图片失败:', error)
        
        // 更新错误状态
        updatedImages[i] = {
          ...image,
          uploading: false,
          error: '上传失败'
        }
      }
      
      // 更新状态
      setProductImages(updatedImages)
    }
    
    return uploadedUrls
  }

  async function addOrUpdateProduct(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.category) {
      alert('请选择一个分类')
      return
    }
    
    if (!storageStatus.ready) {
      alert('存储服务尚未准备好，无法上传图片')
      return
    }
    
    setIsLoading(true)
    
    try {
      // 上传多张图片
      const multipleImageUrls = await uploadMultipleImages()
      
      // 如果有单张主图，先上传
      let mainImageUrl = formData.image_url
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          mainImageUrl = uploadedUrl
        }
      }
      
      // 组合所有图片URL（逗号分隔）
      let allImageUrls = mainImageUrl
      
      if (multipleImageUrls.length > 0) {
        if (allImageUrls) {
          allImageUrls += ',' + multipleImageUrls.join(',')
        } else {
          allImageUrls = multipleImageUrls.join(',')
        }
      }
      
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: parseInt(formData.category),
        image_url: allImageUrls
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
      setUploadProgress(0)
    }
  }
  
  function resetForm() {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: categories.length > 0 ? categories[0].id.toString() : '',
      image_url: ''
    })
    setEditingProduct(null)
    setImageFile(null)
    setImagePreview(null)
    setProductImages([])
  }
  
  function startEditing(product: Product) {
    setEditingProduct(product)
    
    // 处理多图片
    if (product.image_url) {
      const imageUrls = product.image_url.split(',')
      
      // 第一张作为主图
      if (imageUrls.length > 0 && imageUrls[0]) {
        setImagePreview(imageUrls[0])
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category.toString(),
          image_url: imageUrls[0]
        })
      } else {
        setImagePreview(null)
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category.toString(),
          image_url: ''
        })
      }
      
      // 剩余图片作为多图
      const additionalImages: ProductImage[] = []
      
      if (imageUrls.length > 1) {
        imageUrls.slice(1).forEach(url => {
          if (url) {
            additionalImages.push({
              id: uuidv4(),
              file: null,
              previewUrl: url,
              uploaded: true,
              uploading: false,
              error: null,
              publicUrl: url
            })
          }
        })
      }
      
      setProductImages(additionalImages)
    } else {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        category: product.category.toString(),
        image_url: ''
      })
      setImagePreview(null)
      setProductImages([])
    }
    
    setImageFile(null)
    
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

  // 格式化图片URL显示
  function formatImageUrl(url: string | null | undefined): string[] {
    if (!url) return []
    return url.split(',').filter(Boolean)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-3">商品管理</h1>
      
      {!storageStatus.ready && storageStatus.checked && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="font-medium">存储服务未准备好</p>
          <p className="text-sm mt-1">{storageStatus.message}</p>
          <button 
            onClick={verifyStorageSetup}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
          >
            重试
          </button>
        </div>
      )}
      
      <form onSubmit={addOrUpdateProduct} className="mb-8 space-y-5 bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-xl font-semibold border-b pb-3 mb-4 text-gray-700">
          {editingProduct ? '编辑商品' : '添加新商品'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">商品名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">价格</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">¥</span>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">商品描述</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">分类</label>
          <select
            value={formData.category} 
            onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
            className="w-full px-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
        
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">主商品图片</label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer transition-colors"
            >
              选择主图片
            </label>
            {(imagePreview || formData.image_url) && (
              <button
                type="button"
                onClick={clearImage}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                删除主图片
              </button>
            )}
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">上传中 {uploadProgress}%</p>
            </div>
          )}
          
          {imagePreview && (
            <div className="mt-4">
              <div className="relative w-40 h-40 rounded-md overflow-hidden border border-gray-200">
                <img 
                  src={imagePreview} 
                  alt="商品预览" 
                  className="object-cover w-full h-full"
                />
              </div>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">额外商品图片（最多5张）</label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleMultipleImagesChange}
              className="hidden"
              id="multiple-images-upload"
              multiple
              disabled={productImages.length >= 5}
            />
            <label
              htmlFor="multiple-images-upload"
              className={`px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer transition-colors ${
                productImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              选择额外图片
            </label>
            {productImages.length > 0 && (
              <button
                type="button"
                onClick={clearAllImages}
                className="ml-4 text-red-500 hover:text-red-700"
              >
                删除所有额外图片
              </button>
            )}
          </div>
          
          {productImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {productImages.map(image => (
                <div key={image.id} className="relative">
                  <div className="relative w-full h-32 rounded-md overflow-hidden border border-gray-200">
                    <img 
                      src={image.previewUrl} 
                      alt="商品预览" 
                      className="object-cover w-full h-full"
                    />
                    {image.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <span className="text-white text-sm">上传中...</span>
                      </div>
                    )}
                    {image.error && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center">
                        <span className="text-white text-sm">上传失败</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                  {image.uploaded && (
                    <span className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                      已上传
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-4 pt-3">
          <button
            type="submit"
            className="flex-1 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-sm"
            disabled={isLoading || !storageStatus.ready}
          >
            {isLoading ? (editingProduct ? '更新中...' : '添加中...') : (editingProduct ? '更新商品' : '添加商品')}
          </button>
          
          {editingProduct && (
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          // 查找分类名称
          const categoryName = categories.find(c => c.id === product.category)?.name || '未知分类';
          // 处理多图片URL
          const imageUrls = formatImageUrl(product.image_url);
          
          return (
            <div
              key={product.id}
              className="p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow relative bg-white overflow-hidden"
            >
              <div className="absolute top-3 right-3 flex gap-2">
                <button 
                  onClick={() => startEditing(product)}
                  className="p-1.5 px-3 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  编辑
                </button>
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="p-1.5 px-3 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-300 transition-colors shadow-sm"
                  disabled={deleteLoading === product.id}
                >
                  {deleteLoading === product.id ? '删除中...' : '删除'}
                </button>
              </div>
              
              {imageUrls.length > 0 && (
                <div className="mb-4">
                  {/* 主图 */}
                  <div className="h-40 rounded-md overflow-hidden bg-gray-100 mb-2">
                    <img 
                      src={imageUrls[0]} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* 缩略图 */}
                  {imageUrls.length > 1 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {imageUrls.slice(1, 5).map((url, idx) => (
                        <div key={idx} className="h-16 rounded-md overflow-hidden bg-gray-100">
                          <img 
                            src={url} 
                            alt={`${product.name}-${idx}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <h3 className="text-lg font-semibold pr-20 text-gray-800 mb-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {categoryName}
                </span>
                <p className="text-lg font-bold text-blue-600">¥{product.price.toFixed(2)}</p>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                创建时间: {new Date(product.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  )
} 