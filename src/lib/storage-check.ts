import { supabase } from './supabase';

// 定义存储桶名称为常量，方便维护
const BUCKET_NAME = 'products';

export async function checkStorageSetup() {
  try {
    // 直接尝试上传测试文件而不检查存储桶是否存在
    const testData = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    const testFilePath = `test/${testFileName}`;
    
    console.log(`尝试直接上传测试文件到存储桶 ${BUCKET_NAME}, 路径: ${testFilePath}`);
    
    // 上传文件到Supabase Storage
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
    console.error('检查Storage配置时出错:', error);
    return {
      success: false,
      message: '检查Storage配置时出错: ' + (error instanceof Error ? error.message : String(error)),
      error
    };
  }
} 