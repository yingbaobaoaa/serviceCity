<template>
  <div class="ai-analysis-panel">
    <div class="control-section">
      <el-button
        type="primary"
        size="large"
        :disabled="selectedItems.length === 0 || isStreaming"
        :loading="isStreaming"
        @click="startStreamingAnalysis"
      >
        <el-icon><Operation /></el-icon>
        {{ isStreaming ? '分析中...' : 'AI 分析' }}
      </el-button>
    </div>

    <div v-if="selectedItems.length === 0" class="hint">
      请先选择要分析的事件或传感器数据
    </div>

    <!-- 配置警告 -->
    <div v-if="!useMock && !configValid" class="warning-card">
      <el-alert
        title="配置缺失"
        type="warning"
        description="请配置百度文心一言API密钥（.env 文件中设置 VITE_WENXIN_API_KEY 和 VITE_WENXIN_SECRET_KEY），或开启模拟模式进行测试"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 流式输出显示 -->
    <div v-if="isStreaming || fullContent" class="streaming-result">
        <div class="result-header">
          <h4 style="margin-bottom: 10px;">
            <span v-if="isStreaming">AI 实时分析</span>
            <span v-else>AI 分析结果</span>
          </h4>
          <div v-if="isStreaming" class="typing-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
        <!-- 流式内容显示 -->
        <div v-if="isStreaming || (!formattedResult && fullContent)" class="streaming-content">
          <div class="content-wrapper" v-html="formattedStreamingContent"></div>
        </div>

        <!-- 结构化结果显示 -->
        <div v-else-if="formattedResult" class="structured-result">
          <div class="result-item">
            <h5>问题归因</h5>
            <p>{{ formattedResult.problemAttribution }}</p>
          </div>

          <div class="result-item">
            <h5>处置建议</h5>
            <p>{{ formattedResult.disposalSuggestion }}</p>
          </div>

          <div class="result-item">
            <h5>优先级评估</h5>
            <el-tag :type="getPriorityType(formattedResult.priority)" size="large">
              {{ getPriorityText(formattedResult.priority) }}
            </el-tag>
          </div>
        </div>

        <!-- 错误显示 -->
        <div v-if="currentError" class="error-content">
          <el-alert
            title="分析失败"
            :description="currentError"
            type="error"
            show-icon
          />
        </div>

        <!-- 操作按钮 -->
        <div v-if="!isStreaming" class="action-buttons">
          <el-button size="small" @click="copyToClipboard">
            <el-icon><DocumentCopy /></el-icon>
            复制结果
          </el-button>
          <el-button size="small" @click="resetAnalysis">
            <el-icon><Refresh /></el-icon>
            重新分析
          </el-button>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Operation, DocumentCopy, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { CityEvent, SensorData } from '@/types'
import { WENXIN_CONFIG, validateWenxinConfig } from '@/config/wenxin'
import { useStreamingAnalysis } from '@/composables/useStreamingAnalysis'
import { useMockStreamingAnalysis } from '@/composables/useMockStreamingAnalysis'

const props = defineProps<{
  selectedItems: (CityEvent | SensorData)[]
}>()

const emit = defineEmits<{
  analysisComplete: [record: any]
}>()

// 配置状态
const configValid = ref(validateWenxinConfig())

// 本地状态
const useStreaming = ref(true)
const useMock = ref(true) // 默认使用模拟模式

// 使用流式分析的composable
const {
  state: analysisState,
  isStreaming: streamingState,
  hasError,
  errorMessage,
  startStreamingAnalysis: startStreamAnalysis,
  performStaticAnalysis,
  resetState,
  getTypewriterText,
  getFormattedResult
} = useStreamingAnalysis(WENXIN_CONFIG)

// 使用模拟分析的composable
const {
  state: mockAnalysisState,
  isStreaming: mockStreamingState,
  hasError: mockHasError,
  errorMessage: mockErrorMessage,
  startStreamingAnalysis: startMockStreamAnalysis,
  performStaticAnalysis: performMockStaticAnalysis,
  resetState: resetMockState,
  getTypewriterText: getMockTypewriterText,
  getFormattedResult: getMockFormattedResult
} = useMockStreamingAnalysis()

// 计算属性
const currentState = computed(() => useMock.value ? mockAnalysisState.value : analysisState.value)
const isStreaming = computed(() => currentState.value.isStreaming)
const fullContent = computed(() => currentState.value.fullContent)
const formattedResult = computed(() => useMock.value ? getMockFormattedResult() : getFormattedResult())
const currentError = computed(() => useMock.value ? mockErrorMessage() : errorMessage())

// 格式化流式内容，支持Markdown
const formattedStreamingContent = computed(() => {
  const content = useMock.value ? getMockTypewriterText() : getTypewriterText()
  if (!content) return ''

  // 简单的Markdown格式化
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.)/, '<p>$1')
    .replace(/(.)$/, '$1</p>')
})

// 监听流式输出完成
watch(currentState, (newState) => {
  if (!newState.isStreaming && newState.result && !newState.error) {
    // 分析完成，发送事件
    const record = {
      id: `AI${Date.now()}`,
      timestamp: new Date().toISOString(),
      selectedItems: props.selectedItems,
      result: newState.result,
      mode: useMock.value ? 'mock' : 'real'
    }
    emit('analysisComplete', record)
    ElMessage.success(`${useMock.value ? '模拟' : 'AI'}分析完成`)
  }
}, { deep: true })

// 开始分析
async function startStreamingAnalysis() {
  if (props.selectedItems.length === 0) {
    ElMessage.warning('请先选择要分析的数据')
    return
  }

  if (!useMock.value && !configValid.value) {
    ElMessage.error('请先配置百度文心一言API密钥，或开启模拟模式')
    return
  }

  try {
    if (useMock.value) {
      // 使用模拟分析
      if (useStreaming.value) {
        await startMockStreamAnalysis(props.selectedItems)
      } else {
        const result = await performMockStaticAnalysis(props.selectedItems)
        // 事件由watch监听器处理
      }
    } else {
      // 使用真实API分析
      if (useStreaming.value) {
        await startStreamAnalysis(props.selectedItems)
      } else {
        const result = await performStaticAnalysis(props.selectedItems)
        // 事件由watch监听器处理
      }
    }
  } catch (error) {
    console.error('分析失败:', error)
    ElMessage.error(`${useMock.value ? '模拟' : 'AI'}分析失败，请重试`)
  }
}

// 重置分析
function resetAnalysis() {
  if (useMock.value) {
    resetMockState()
  } else {
    resetState()
  }
}

// 复制到剪贴板
async function copyToClipboard() {
  try {
    let content = ''

    if (formattedResult.value) {
      content = `问题归因：${formattedResult.value.problemAttribution}\n\n处置建议：${formattedResult.value.disposalSuggestion}\n\n优先级：${getPriorityText(formattedResult.value.priority)}`
    } else if (fullContent.value) {
      content = fullContent.value
    }

    if (!content) {
      ElMessage.warning('没有可复制的内容')
      return
    }

    await navigator.clipboard.writeText(content)
    ElMessage.success('内容已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败，请手动复制')
  }
}

function getPriorityType(priority: string): string {
  switch (priority) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'info'
  }
}

function getPriorityText(priority: string): string {
  switch (priority) {
    case 'high': return '高优先级'
    case 'medium': return '中优先级'
    case 'low': return '低优先级'
    default: return '未知'
  }
}
</script>

<style scoped>
.ai-analysis-panel {
  margin-bottom: 30px;
}

.control-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hint {
  margin-top: 20px;
  padding: 20px;
  text-align: center;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.warning-card {
  margin-top: 20px;
}

.info-card {
  margin-top: 20px;
}

.streaming-result {
  margin-top: 30px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-header h4 {
  margin: 0;
  color: #303133;
}

/* 打字机指示器 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #409eff;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator .dot:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator .dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 流式内容样式 */
.streaming-content {
  min-height: 100px;
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 16px;
}

.content-wrapper {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 结构化结果样式 */
.structured-result {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-item {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.result-item h5 {
  margin-bottom: 10px;
  color: #303133;
  font-weight: bold;
  font-size: 16px;
}

.result-item p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
  font-size: 14px;
}

/* 错误内容样式 */
.error-content {
  margin-top: 16px;
}

/* 操作按钮样式 */
.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .streaming-content {
    max-height: 300px;
  }
}

/* 滚动条样式 */
.streaming-content::-webkit-scrollbar {
  width: 6px;
}

.streaming-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.streaming-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.streaming-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>