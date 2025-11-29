# 百度文心一言AI分析集成说明

本项目的AI分析功能集成了百度文心一言API，支持流式输出和非流式输出两种模式。

## 功能特性

- ✅ **流式输出**: 实时显示AI分析过程，类似ChatGPT的打字机效果
- ✅ **非流式输出**: 一次性返回完整分析结果
- ✅ **智能分析**: 基于城市事件和传感器数据提供专业的问题归因和处置建议
- ✅ **优先级评估**: 自动评估问题的优先级（高/中/低）
- ✅ **结果复制**: 支持一键复制分析结果
- ✅ **错误处理**: 完善的错误提示和异常处理
- ✅ **配置验证**: 自动检测API配置是否完整

## 快速开始

### 1. 获取百度文心一言API密钥

1. 访问 [百度智能云平台](https://cloud.baidu.com/)
2. 注册/登录账号
3. 开通文心一言API服务
4. 获取 API Key 和 Secret Key

### 2. 配置环境变量

1. 复制环境变量示例文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，填入你的API密钥：
   ```env
   VITE_WENXIN_API_KEY=your_actual_api_key
   VITE_WENXIN_SECRET_KEY=your_actual_secret_key
   ```

### 3. 重启开发服务器

确保重启开发服务器以加载新的环境变量：
```bash
npm run dev
```

## 使用方法

### 在AIAnalysisPanel组件中使用

```vue
<template>
  <AIAnalysisPanel
    :selected-items="selectedItems"
    @analysis-complete="handleAnalysisComplete"
  />
</template>

<script setup>
import { ref } from 'vue'
import AIAnalysisPanel from '@/components/AIAnalysisPanel.vue'
import type { CityEvent, SensorData } from '@/types'

const selectedItems = ref<(CityEvent | SensorData)[]>([])

const handleAnalysisComplete = (record) => {
  console.log('分析完成:', record)
  // 保存分析结果或进行其他处理
}
</script>
```

### 独立使用服务

```typescript
import { createWenxinService } from '@/services/wenxin'

const wenxinService = createWenxinService({
  apiKey: 'your_api_key',
  secretKey: 'your_secret_key'
})

// 流式分析
const stream = wenxinService.analyzeDataStream(items)
for await (const chunk of stream) {
  console.log('流式输出:', chunk)
}

// 非流式分析
const result = await wenxinService.analyzeData(items)
console.log('分析结果:', result)
```

### 使用Composable

```typescript
import { useStreamingAnalysis } from '@/composables/useStreamingAnalysis'

const {
  isStreaming,
  hasError,
  errorMessage,
  startStreamingAnalysis,
  resetState
} = useStreamingAnalysis({
  apiKey: 'your_api_key',
  secretKey: 'your_secret_key'
})

// 开始流式分析
await startStreamingAnalysis(items)
```

## 输出格式

AI分析返回以下结构化数据：

```typescript
interface AnalysisResponse {
  problemAttribution: string    // 问题归因分析
  disposalSuggestion: string    // 处置建议
  priority: 'high' | 'medium' | 'low'  // 优先级评估
}
```

## 配置选项

### API配置

```typescript
interface WenxinConfig {
  apiKey: string        // API密钥
  secretKey: string     // 密钥
  baseUrl?: string      // API基础URL，默认为百度云地址
}
```

### 流式输出配置

- **温度参数**: `temperature: 0.7` - 控制输出的随机性
- **最大输出**: `max_output_tokens: 2000` - 最大输出字符数
- **流式模式**: 支持实时流式输出

## 错误处理

常见错误及解决方案：

1. **配置缺失**
   - 错误: `请先配置百度文心一言API密钥`
   - 解决: 检查 `.env` 文件中的 `VITE_WENXIN_API_KEY` 和 `VITE_WENXIN_SECRET_KEY`

2. **API调用失败**
   - 错误: `文心一言API调用失败`
   - 解决: 检查API密钥是否正确，网络连接是否正常

3. **JSON解析失败**
   - 系统会自动降级使用原始文本内容
   - 不影响基本功能的使用

## 注意事项

1. **API限制**: 请注意百度文心一言API的调用频率和配额限制
2. **数据安全**: 确保不要将API密钥提交到版本控制系统
3. **网络依赖**: 功能需要网络连接，请确保网络通畅
4. **浏览器兼容**: 流式输出需要支持Fetch API和ReadableStream的浏览器

## 开发说明

### 项目结构

```
src/
├── services/
│   └── wenxin.ts              # 文心一言API服务
├── composables/
│   └── useStreamingAnalysis.ts # 流式分析Composable
├── config/
│   └── wenxin.ts              # 配置文件
└── components/
    └── AIAnalysisPanel.vue    # AI分析面板组件
```

### 扩展功能

1. **自定义提示词**: 可以修改 `buildAnalysisPrompt` 方法来自定义分析提示
2. **多种AI服务**: 可以扩展支持其他AI服务（如GPT、Claude等）
3. **结果缓存**: 可以添加分析结果缓存功能
4. **批量分析**: 可以扩展支持批量分析多个数据集

## 许可证

本项目遵循MIT许可证。