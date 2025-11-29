// 百度文心一言配置
export const WENXIN_CONFIG = {
  // 请在这里配置您的百度文心一言API密钥
  apiKey: import.meta.env.VITE_WENXIN_API_KEY || 'YOUR_API_KEY_HERE',
  secretKey: import.meta.env.VITE_WENXIN_SECRET_KEY || 'YOUR_SECRET_KEY_HERE',
  baseUrl: 'https://aip.baidubce.com'
}

// 检查配置是否完整
export function validateWenxinConfig(): boolean {
  return !!(WENXIN_CONFIG.apiKey &&
           WENXIN_CONFIG.secretKey &&
           WENXIN_CONFIG.apiKey !== 'YOUR_API_KEY_HERE' &&
           WENXIN_CONFIG.secretKey !== 'YOUR_SECRET_KEY_HERE')
}