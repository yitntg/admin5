import { supabase } from './supabase';

// 定义存储桶名称为常量，方便维护
const BUCKET_NAME = 'products';

export async function checkStorageSetup() {
  try {
    // 检查存储桶是否存在
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('无法获取存储桶列表:', bucketsError);
      return {
        success: false,
        message: '无法获取存储桶列表',
        error: bucketsError
      };
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.error(`未找到${BUCKET_NAME}存储桶`);
      return {
        success: false,
        message: `未找到${BUCKET_NAME}存储桶，请确认Supabase中已创建此存储桶`,
        error: null
      };
    }
    
    console.log(`${BUCKET_NAME}存储桶已存在`);
    
    // 测试上传小文件
    try {
      const testData = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `test-${Date.now()}.txt`;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`test/${testFileName}`, testData, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('测试上传失败:', uploadError);
        return {
          success: false,
          message: '测试上传失败，请检查存储桶权限设置',
          error: uploadError
        };
      }
      
      // 删除测试文件
      await supabase.storage.from(BUCKET_NAME).remove([`test/${testFileName}`]);
      
      return {
        success: true,
        message: 'Storage配置正确，可以正常使用'
      };
    } catch (error) {
      console.error('测试存储桶操作失败:', error);
      return {
        success: false,
        message: '测试存储桶操作失败，请检查权限设置',
        error
      };
    }
  } catch (error) {
    console.error('检查Storage配置时出错:', error);
    return {
      success: false,
      message: '检查Storage配置时出错',
      error
    };
  }
} 