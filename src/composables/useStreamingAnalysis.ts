import { ref, nextTick } from 'vue'
import type { CityEvent, SensorData } from '@/types'
import { createWenxinService, type WenxinConfig, type AnalysisResponse } from '@/services/wenxin'

export interface StreamingState {
  isStreaming: boolean
  currentContent: string
  fullContent: string
  result: AnalysisResponse | null
  error: string | null
}

export function useStreamingAnalysis(config: WenxinConfig) {
  const wenxinService = createWenxinService(config)

  const state = ref<StreamingState>({
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
      const stream = wenxinService.analyzeDataStream(items)

      for await (const chunk of stream) {
        state.value.currentContent += chunk
        state.value.fullContent += chunk

        // 将新的内容块添加到流内容数组
        streamingContent.value.push(chunk)

        // 确保UI更新
        await nextTick()
      }

      // 流式输出完成后，尝试解析结果
      const parsedResult = parseAnalysisResult(state.value.fullContent)
      state.value.result = parsedResult
      isComplete.value = true

    } catch (error) {
      console.error('流式分析失败:', error)
      state.value.error = error instanceof Error ? error.message : '分析过程中发生未知错误'
    } finally {
      state.value.isStreaming = false
    }
  }

  // 解析分析结果
  const parseAnalysisResult = (content: string): AnalysisResponse => {
    try {
      // 尝试找到JSON格式的结果
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          problemAttribution: parsed.problemAttribution || content,
          disposalSuggestion: parsed.disposalSuggestion || '建议联系专业人员进行详细分析',
          priority: parsed.priority || 'medium'
        }
      }
    } catch (e) {
      console.warn('JSON解析失败，使用原文内容:', e)
    }

    // 如果无法解析JSON，将全文作为归因分析
    return {
      problemAttribution: content,
      disposalSuggestion: '建议联系专业人员进行详细分析',
      priority: 'medium'
    }
  }

  // 非流式分析函数（兼容接口）
  const performStaticAnalysis = async (items: (CityEvent | SensorData)[]): Promise<AnalysisResponse> => {
    state.value.isStreaming = true
    state.value.error = null

    try {
      const result = await wenxinService.analyzeData(items)
      state.value.result = result
      state.value.fullContent = `问题归因：${result.problemAttribution}\n\n处置建议：${result.disposalSuggestion}\n\n优先级：${result.priority}`
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