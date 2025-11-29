<template>
  <div class="ai-records-list">
    <div v-if="records.length === 0" class="empty-records">
      <el-empty description="暂无分析记录" :image-size="100" />
    </div>

    <div v-else class="records-content">
      <div
        v-for="record in records"
        :key="record.id"
        class="record-item"
      >
        <div class="record-header">
          <span class="record-time">{{ formatTime(record.timestamp) }}</span>
          <el-tag :type="getPriorityType(record.result.priority)" size="small">
            {{ getPriorityText(record.result.priority) }}
          </el-tag>
        </div>

        <div class="record-summary">
          分析了 {{ record.selectedItems.length }} 项数据
        </div>

        <div class="record-result">
          <p><strong>归因：</strong>{{ record.result.problemAttribution }}</p>
          <p><strong>建议：</strong>{{ record.result.disposalSuggestion }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AIAnalysisRecord } from '@/types'

defineProps<{
  records: AIAnalysisRecord[]
}>()

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
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
    case 'high': return '高'
    case 'medium': return '中'
    case 'low': return '低'
    default: return '未知'
  }
}
</script>

<style scoped>
.ai-records-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-records {
  padding: 20px 0;
}

.records-content {
  padding-right: 10px;
}

.record-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  background-color: #fafafa;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-time {
  font-size: 12px;
  color: #909399;
}

.record-summary {
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
}

.record-result {
  font-size: 12px;
  line-height: 1.4;
}

.record-result p {
  margin: 5px 0;
  color: #303133;
}

.record-result strong {
  color: #409eff;
}
</style>