import { supabase } from './supabase';

// 定义存储桶名称为常量，方便维护
const BUCKET_NAME = 'products';

export async function checkStorageSetup() {
  try {
    // 打印Supabase URL确认连接信息
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('当前使用的存储桶名称:', BUCKET_NAME);
    
    // 检查存储桶是否存在
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('无法获取存储桶列表:', bucketsError);
      return {
        success: false,
        message: '无法获取存储桶列表: ' + bucketsError.message,
        error: bucketsError
      };
    }
    
    // 打印所有存储桶名称以便调试
    console.log('找到的存储桶:', buckets.map(b => b.name).join(', '));
    
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
      const testFilePath = `test/${testFileName}`;
      console.log(`尝试上传测试文件到路径: ${testFilePath}`);
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(testFilePath, testData, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('测试上传失败:', uploadError);
        return {
          success: false,
          message: '测试上传失败，请检查存储桶权限设置: ' + uploadError.message,
          error: uploadError
        };
      }
      
      console.log('测试文件上传成功，尝试获取公共URL');
      
      // 获取上传文件的URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(testFilePath);
      
      console.log('文件公共URL:', urlData.publicUrl);
      
      // 删除测试文件
      console.log('尝试删除测试文件');
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([testFilePath]);
      
      if (removeError) {
        console.warn('删除测试文件失败:', removeError);
      } else {
        console.log('测试文件删除成功');
      }
      
      return {
        success: true,
        message: 'Storage配置正确，可以正常使用'
      };
    } catch (error) {
      console.error('测试存储桶操作失败:', error);
      return {
        success: false,
        message: '测试存储桶操作失败，请检查权限设置: ' + (error instanceof Error ? error.message : String(error)),
        error
      };
    }
  } catch (error) {
    console.error('检查Storage配置时出错:', error);
    return {
      success: false,
      message: '检查Storage配置时出错: ' + (error instanceof Error ? error.message : String(error)),
      error
    };
  }
} 