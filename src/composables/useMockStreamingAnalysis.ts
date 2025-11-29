import { ref, nextTick } from 'vue'
import type { CityEvent, SensorData } from '@/types'
import { mockStreamingAnalysis, mockStaticAnalysis, analyzeDataForMock, type MockAnalysisResponse } from '@/services/mockAnalysis'

export interface MockStreamingState {
  isStreaming: boolean
  currentContent: string
  fullContent: string
  result: MockAnalysisResponse | null
  error: string | null
}

export function useMockStreamingAnalysis() {
  const state = ref<MockStreamingState>({
    isStreaming: false,
    currentContent: '',
    fullContent: '',
    result: null,
    error: null
  })

  const streamingContent = ref<string[]>([])
  const isComplete = ref(false)

  // 流式分析函数
  const startStreamingAnalysis = async (items: (CityEvent | SensorData)[]) => {
    // 重置状态
    state.value = {
      isStreaming: true,
      currentContent: '',
      fullContent: '',
      result: null,
      error: null
    }
    streamingContent.value = []
    isComplete.value = false

    try {
      const stream = mockStreamingAnalysis(items)
      let lastContent = ''

      for await (const chunk of stream) {
        state.value.currentContent = chunk
        state.value.fullContent = chunk

        // 计算新增的内容块
        const newContent = chunk.slice(lastContent.length)
        if (newContent) {
          streamingContent.value.push(newContent)
        }
        lastContent = chunk

        // 确保UI更新
        await nextTick()
      }

      // 流式输出完成后，解析结构化结果
      const parsedResult = parseAnalysisResult(state.value.fullContent, items)
      state.value.result = parsedResult
      isComplete.value = true

    } catch (error) {
      console.error('模拟流式分析失败:', error)
      state.value.error = error instanceof Error ? error.message : '分析过程中发生未知错误'
    } finally {
      state.value.isStreaming = false
    }
  }

  // 解析分析结果
  const parseAnalysisResult = (content: string, items: (CityEvent | SensorData)[]): MockAnalysisResponse => {
    // 直接使用模拟分析服务的结果
    return analyzeDataForMock(items)
  }

  // 非流式分析函数
  const performStaticAnalysis = async (items: (CityEvent | SensorData)[]): Promise<MockAnalysisResponse> => {
    state.value.isStreaming = true
    state.value.error = null

    try {
      const result = await mockStaticAnalysis(items)
      state.value.result = result

      // 生成完整的文本内容
      const locations = [...new Set(items.map(item => item.location.district))]
      const fullContent = `📍 **涉及区域**：${locations.join('、')}

🔍 **分析结果**

**问题归因**
${result.problemAttribution}

**处置建议**
${result.disposalSuggestion}

**优先级评估**
根据分析结果，本次事件的优先级为：${result.priority === 'high' ? '🔴 高优先级' : result.priority === 'medium' ? '🟡 中优先级' : '🟢 低优先级'}

---
*本分析由智慧城市AI助手提供*`

      state.value.fullContent = fullContent
      return result
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '分析过程中发生未知错误'
      throw error
    } finally {
      state.value.isStreaming = false
    }
  }

  // 重置状态
  const resetState = () => {
    state.value = {
      isStreaming: false,
      currentContent: '',
      fullContent: '',
      result: null,
      error: null
    }
    streamingContent.value = []
    isComplete.value = false
  }

  // 获取打字机效果的文本
  const getTypewriterText = () => {
    return state.value.currentContent
  }

  // 获取格式化的分析结果
  const getFormattedResult = () => {
    if (!state.value.result) return null

    return {
      problemAttribution: state.value.result.problemAttribution,
      disposalSuggestion: state.value.result.disposalSuggestion,
      priority: state.value.result.priority
    }
  }

  return {
    // 状态
    state,
    streamingContent,
    isComplete,

    // 计算属性
    isStreaming: () => state.value.isStreaming,
    hasError: () => !!state.value.error,
    errorMessage: () => state.value.error,

    // 方法
    startStreamingAnalysis,
    performStaticAnalysis,
    resetState,
    getTypewriterText,
    getFormattedResult,
    parseAnalysisResult
  }
}

