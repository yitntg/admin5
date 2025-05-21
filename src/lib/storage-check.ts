import { supabase } from './supabase';

export async function checkStorageSetup() {
  try {
    // 检查images bucket是否存在
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('无法获取存储桶列表:', bucketsError);
      return {
        success: false,
        message: '无法获取存储桶列表',
        error: bucketsError
      };
    }
    
    const imagesBucketExists = buckets.some(bucket => bucket.name === 'images');
    
    if (!imagesBucketExists) {
      console.warn('未找到images存储桶，尝试创建...');
      
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (createError) {
        console.error('创建images存储桶失败:', createError);
        return {
          success: false,
          message: '创建images存储桶失败',
          error: createError
        };
      }
      
      console.log('成功创建images存储桶');
    } else {
      console.log('images存储桶已存在');
      
      // 更新存储桶为公共访问
      const { error: updateError } = await supabase.storage.updateBucket('images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (updateError) {
        console.error('更新images存储桶失败:', updateError);
      }
    }
    
    // 测试上传小文件
    const testData = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(`test/${testFileName}`, testData, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('测试上传失败:', uploadError);
      return {
        success: false,
        message: '测试上传失败',
        error: uploadError
      };
    }
    
    // 删除测试文件
    await supabase.storage.from('images').remove([`test/${testFileName}`]);
    
    return {
      success: true,
      message: 'Storage配置正确，可以正常使用'
    };
  } catch (error) {
    console.error('检查Storage配置时出错:', error);
    return {
      success: false,
      message: '检查Storage配置时出错',
      error
    };
  }
} 