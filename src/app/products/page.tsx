'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Database } from '@/types/supabase'
import { v4 as uuidv4 } from 'uuid'
import Image from 'next/image'
import { checkStorageSetup } from '@/lib/storage-check'

// 定义存储桶名称为常量，与storage-check.ts保持一致
const BUCKET_NAME = 'products';

type Product = Database['public']['Tables']['products']['Row'] & {
  product_images?: Array<{
    id: number;
    product_id: number;
    image_url: string;
    is_main: boolean;
    display_order: number;
  }>
}
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
  isMain: boolean; // 标记是否为主图
  fileType: string; // 标记文件类型
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
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
    // 单独查询产品，不使用联接查询
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return
    }

    // 如果有产品数据，再获取每个产品的图片
    if (productsData && productsData.length > 0) {
      // 获取所有产品ID
      const productIds = productsData.map(product => product.id)
      
      // 查询这些产品的图片
      const { data: imagesData, error: imagesError } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds)
        .order('display_order', { ascending: true })
        
      if (imagesError) {
        console.error('Error fetching product images:', imagesError)
      }
      
      // 将图片数据与产品关联
      if (imagesData && imagesData.length > 0) {
        const productsWithImages = productsData.map(product => {
          // 找出属于这个产品的所有图片
          const productImages = imagesData.filter(img => img.product_id === product.id)
          return {
            ...product,
            product_images: productImages
          }
        })
        
        setProducts(productsWithImages)
      } else {
        // 没有图片数据，直接设置产品
        setProducts(productsData.map(product => ({
          ...product,
          product_images: []
        })))
      }
    } else {
      setProducts([])
    }
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

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    // 检查文件数量限制
    if (productImages.length + files.length > 5) {
      alert('最多只能上传5个媒体文件')
      return
    }
    
    Array.from(files).forEach((file, index) => {
      // 检查文件类型是图片或视频
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        alert('请上传图片或视频文件')
        return
      }
      
      // 限制文件大小（图片5MB，视频20MB）
      const sizeLimit = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > sizeLimit) {
        alert(`${isVideo ? '视频' : '图片'}大小不能超过${isVideo ? '20MB' : '5MB'}`)
        return
      }
      
      // 创建预览URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setProductImages(prev => {
          // 如果没有图片或者添加第一张图片，则设为主图
          const isMain = prev.length === 0 || (index === 0 && prev.every(img => !img.isMain));
          
          return [...prev, {
            id: uuidv4(),
            file,
            previewUrl: reader.result as string,
            uploaded: false,
            uploading: false,
            error: null,
            publicUrl: null,
            isMain,
            fileType: isVideo ? 'video' : 'image'
          }]
        })
      }
      reader.readAsDataURL(file)
    })
  }
  
  // 设置主图
  function setAsMainImage(id: string) {
    setProductImages(prev => 
      prev.map(img => ({
        ...img,
        isMain: img.id === id
      }))
    )
  }
  
  // 删除一张图片
  function removeImage(id: string) {
    setProductImages(prev => {
      const filteredImages = prev.filter(img => img.id !== id);
      
      // 如果删除的是主图且还有其他图片，则将第一张设为主图
      if (prev.find(img => img.id === id)?.isMain && filteredImages.length > 0) {
        filteredImages[0].isMain = true;
      }
      
      return filteredImages;
    })
  }
  
  function clearAllImages() {
    setProductImages([])
  }

  async function uploadImages() {
    if (productImages.length === 0) return []
    
    const uploadedUrls: {url: string, isMain: boolean}[] = []
    const updatedImages = [...productImages]
    const totalFiles = updatedImages.filter(img => img.file && !img.uploaded).length
    let completedFiles = 0
    
    // 逐个上传图片
    for (let i = 0; i < updatedImages.length; i++) {
      const image = updatedImages[i]
      
      if (!image.file || image.uploaded) {
        if (image.publicUrl) {
          uploadedUrls.push({
            url: image.publicUrl,
            isMain: image.isMain
          })
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
        const filePath = fileName
        
        // 上传文件到Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, image.file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (uploadError) {
          throw uploadError
        }
        
        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath)
        
        uploadedUrls.push({
          url: publicUrl,
          isMain: image.isMain
        })
        
        // 更新上传状态
        updatedImages[i] = {
          ...image,
          uploaded: true,
          uploading: false,
          publicUrl
        }
        
        // 更新进度
        completedFiles++
        if (totalFiles > 0) {
          setUploadProgress(Math.round((completedFiles / totalFiles) * 100))
        }
      } catch (error) {
        console.error('上传图片失败:', error)
        
        // 更新错误状态
        updatedImages[i] = {
          ...image,
          uploading: false,
          error: '上传失败'
        }
        
        // 即使失败也更新进度
        completedFiles++
        if (totalFiles > 0) {
          setUploadProgress(Math.round((completedFiles / totalFiles) * 100))
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
    
    if (productImages.length === 0) {
      alert('请至少上传一个商品媒体')
      return
    }
    
    setIsLoading(true)
    
    try {
      // 上传图片
      const imageUrls = await uploadImages()
      
      // 商品数据（不包含image_url字段）
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: parseInt(formData.category)
      }
      
      let productId: number;
      let error;
      
      if (editingProduct) {
        // 更新商品
        const result = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
        
        error = result.error
        productId = editingProduct.id
      } else {
        // 添加新商品
        const result = await supabase
          .from('products')
          .insert([productData])
          .select()
          
        error = result.error
        productId = result.data?.[0]?.id
      }
  
      if (error) {
        console.error('Error saving product:', error)
        alert(`${editingProduct ? '更新' : '添加'}商品失败: ${error.message}`)
        return
      }
      
      // 如果是编辑模式，先删除旧的图片关联
      if (editingProduct) {
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('product_id', productId)
          
        if (deleteError) {
          console.error('删除旧图片关联失败:', deleteError)
        }
      }
      
      // 添加图片到product_images表
      const imageData = imageUrls.map((img, index) => ({
        product_id: productId,
        image_url: img.url,
        is_main: img.isMain,
        display_order: index
      }))
      
      if (imageData.length > 0) {
        const { error: imgError } = await supabase
          .from('product_images')
          .insert(imageData)
          
        if (imgError) {
          console.error('保存商品图片失败:', imgError)
          alert('商品已保存，但图片保存失败')
        }
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
    })
    setEditingProduct(null)
    setProductImages([])
  }
  
  function startEditing(product: Product) {
    setEditingProduct(product)
    
    // 处理图片
    if (product.product_images && product.product_images.length > 0) {
      const productImgs: ProductImage[] = [];
      
      // 将product_images转换成ProductImage类型
      product.product_images.forEach((img) => {
        productImgs.push({
          id: uuidv4(),
          file: null,
          previewUrl: img.image_url,
          uploaded: true,
          uploading: false,
          error: null,
          publicUrl: img.image_url,
          isMain: img.is_main,
          fileType: img.image_url.endsWith('.mp4') ? 'video' : 'image'
        });
      });
      
      setProductImages(productImgs);
    } else {
      setProductImages([]);
    }
    
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category.toString(),
    });
    
    // 滚动到表单
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  async function deleteProduct(id: number) {
    if (!confirm('确定要删除此商品吗？此操作不可恢复。')) {
      return
    }
    
    setDeleteLoading(id)
    
    try {
      // 首先删除product_images记录
      const { error: imgError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id)
        
      if (imgError) {
        console.error('删除商品图片失败:', imgError)
      }
      
      // 然后删除商品
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
    <div className="container mx-auto p-3 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 border-b pb-3">商品管理</h1>
      
      {!storageStatus.ready && storageStatus.checked && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <p className="font-medium">存储服务未准备好</p>
          <p className="text-xs md:text-sm mt-1">{storageStatus.message}</p>
          <button 
            onClick={verifyStorageSetup}
            className="mt-2 px-2 py-1 md:px-3 md:py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs"
          >
            重试
          </button>
        </div>
      )}
      
      <form onSubmit={addOrUpdateProduct} className="mb-6 md:mb-8 space-y-4 md:space-y-5 bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-100">
        <h2 className="text-lg md:text-xl font-semibold border-b pb-3 mb-3 md:mb-4 text-gray-700">
          {editingProduct ? '编辑商品' : '添加新商品'}
        </h2>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <div>
            <label className="block text-sm font-medium mb-1 md:mb-2 text-gray-700">商品名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 md:mb-2 text-gray-700">价格</label>
            <div className="relative">
              <span className="absolute left-3 top-2 md:top-2.5 text-gray-500">¥</span>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 md:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2 text-gray-700">商品描述</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1 md:mb-2 text-gray-700">分类</label>
          <select
            value={formData.category} 
            onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
            className="w-full px-3 py-2 md:px-4 md:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
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
          <label className="block text-sm font-medium mb-1 md:mb-2 text-gray-700">商品媒体（最多5个）</label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleImagesChange}
              className="hidden"
              id="product-images-upload"
              multiple
              disabled={productImages.length >= 5}
            />
            <label
              htmlFor="product-images-upload"
              className={`px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer transition-colors text-sm ${
                productImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              选择媒体文件
            </label>
            {productImages.length > 0 && (
              <button
                type="button"
                onClick={clearAllImages}
                className="px-3 py-1.5 md:px-4 md:py-2 text-red-500 hover:text-red-700 text-sm"
              >
                清除所有媒体
              </button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-2 mb-2">
            第一个媒体文件将作为商品主图显示，您可以点击"设为主图"按钮更换主图。
          </p>
          
          {productImages.length > 0 && (
            <div className="mt-3 md:mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
              {productImages.map(image => (
                <div key={image.id} className="relative">
                  <div className={`relative w-full h-24 md:h-32 rounded-md overflow-hidden border ${image.isMain ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200'}`}>
                    {image.fileType === 'video' ? (
                      <video 
                        src={image.previewUrl} 
                        className="object-cover w-full h-full"
                        muted
                      />
                    ) : (
                      <img 
                        src={image.previewUrl} 
                        alt="商品预览" 
                        className="object-cover w-full h-full"
                      />
                    )}
                    {image.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                        <span className="text-white text-xs md:text-sm">上传中...</span>
                      </div>
                    )}
                    {image.error && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center">
                        <span className="text-white text-xs md:text-sm">上传失败</span>
                      </div>
                    )}
                    {image.isMain && (
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                        主图
                      </div>
                    )}
                  </div>
                  <div className="absolute top-1 right-1 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      className="w-5 h-5 md:w-6 md:h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs md:text-sm"
                    >
                      ×
                    </button>
                  </div>
                  {!image.isMain && (
                    <button
                      type="button"
                      onClick={() => setAsMainImage(image.id)}
                      className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded hover:bg-blue-600"
                    >
                      设为主图
                    </button>
                  )}
                  {image.uploaded && (
                    <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                      已上传
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-1">媒体上传进度: {uploadProgress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 md:gap-4 pt-3">
          <button
            type="submit"
            className="flex-1 px-4 py-2 md:px-6 md:py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-sm text-sm"
            disabled={isLoading || !storageStatus.ready}
          >
            {isLoading ? (editingProduct ? '更新中...' : '添加中...') : (editingProduct ? '更新商品' : '添加商品')}
          </button>
          
          {editingProduct && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 md:px-6 md:py-2.5 bg-gray-200 text-gray-700 font-medium rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              取消
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {products.map((product) => {
          // 查找分类名称
          const categoryName = categories.find(c => c.id === product.category)?.name || '未知分类';
          // 获取产品图片
          const productImages = product.product_images || [];
          // 获取主图和附加图片
          const mainImage = productImages.find(img => img.is_main)?.image_url;
          const additionalImages = productImages.filter(img => !img.is_main).map(img => img.image_url);
          
          return (
            <div
              key={product.id}
              className="p-3 md:p-5 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow relative bg-white overflow-hidden"
            >
              <div className="absolute top-2 md:top-3 right-2 md:right-3 flex gap-1 md:gap-2">
                <button 
                  onClick={() => startEditing(product)}
                  className="p-1 md:p-1.5 px-2 md:px-3 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                >
                  编辑
                </button>
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="p-1 md:p-1.5 px-2 md:px-3 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-red-300 transition-colors shadow-sm"
                  disabled={deleteLoading === product.id}
                >
                  {deleteLoading === product.id ? '删除中...' : '删除'}
                </button>
              </div>
              
              <div className="mb-3 md:mb-4">
                {/* 主图 */}
                <div className="h-32 md:h-40 rounded-md overflow-hidden bg-gray-100 mb-2">
                  {mainImage ? (
                    mainImage.endsWith('.mp4') ? (
                      <video 
                        src={mainImage} 
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img 
                        src={mainImage} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-400 text-sm">无图片</span>
                    </div>
                  )}
                </div>
                
                {/* 缩略图 */}
                {additionalImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-1 md:gap-2 mt-1 md:mt-2">
                    {additionalImages.slice(0, 4).map((url, idx) => (
                      <div key={idx} className="h-12 md:h-16 rounded-md overflow-hidden bg-gray-100">
                        {url.endsWith('.mp4') ? (
                          <video 
                            src={url} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img 
                            src={url} 
                            alt={`${product.name}-${idx}`} 
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <h3 className="text-base md:text-lg font-semibold pr-16 md:pr-20 text-gray-800 mb-1 md:mb-2 line-clamp-2">{product.name}</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex justify-between items-center mt-2 md:mt-4 pt-2 md:pt-3 border-t border-gray-100">
                <span className="inline-block px-1.5 md:px-2 py-0.5 md:py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {categoryName}
                </span>
                <p className="text-base md:text-lg font-bold text-blue-600">¥{product.price.toFixed(2)}</p>
              </div>
              
              <p className="text-xs text-gray-500 mt-2 md:mt-3">
                创建时间: {new Date(product.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  )
} 