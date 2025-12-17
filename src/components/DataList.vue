<template>
  <div class="data-list">
    <el-card>
      <template #header>
        <div class="header">
          <div class="title-section">
            <el-icon class="header-icon data-icon"><DataBoard /></el-icon>
            <h4>数据列表</h4>
          </div>
          <div class="view-info">
            当前视图: {{ viewModeText }} | 总计: {{ total }} 条
          </div>
        </div>
      </template>

      <el-table :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="150" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.dataType === 'event' ? 'primary' : 'warning'">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="位置" width="180">
          <template #default="{ row }">
            {{ row.location.district }} - {{ row.location.street }}
          </template>
        </el-table-column>
        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.displayTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="hasSensorValue" label="数值" width="100">
          <template #default="{ row }">
            <span v-if="row.dataType === 'sensor'">
              {{ row.value }}{{ row.unit }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @update:current-page="handlePageChange"
          @update:page-size="handleSizeChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CityEvent, SensorData } from '@/types'
import { DataBoard } from '@element-plus/icons-vue'

const props = defineProps<{
  data: Array<CityEvent | SensorData & { dataType: string; displayTime: string }>
  currentPage: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
  pageSizeChange: [pageSize: number]
}>()

const viewModeText = computed(() => {
  const firstItem = props.data[0]
  if (!firstItem) return '无数据'

  if ('dataType' in firstItem) {
    if (firstItem.dataType === 'event') return '事件视图'
    if (firstItem.dataType === 'sensor') return '传感器视图'
  }
  return '合并视图'
})

const hasSensorValue = computed(() => {
  return props.data.some(item => 'dataType' in item && item.dataType === 'sensor')
})

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getStatusType(status: string): string {
  switch (status) {
    case '未处理':
    case '异常':
      return 'danger'
    case '处理中':
      return 'warning'
    case '已处理':
    case '正常':
      return 'success'
    default:
      return 'info'
  }
}

function handlePageChange(page: number) {
  emit('pageChange', page)
}

function handleSizeChange(size: number) {
  // 页面大小变更时通知父组件
  emit('pageSizeChange', size)
}
</script>

<style scoped>
.data-list {
  margin-bottom: 30px;
}

.data-list :deep(.el-card) {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  overflow: hidden;
}

.data-list :deep(.el-card:hover) {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 22px;
  color: #13c2c2;
}



.data-list :deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  margin: 0;
}

.pagination {
  margin-top: 24px;
  text-align: right;
  padding: 20px;
  border-radius: 12px;
}

/* 添加表格行的图标美化 */
.data-list :deep(.el-table .el-tag) {
  border-radius: 12px;
  font-weight: 500;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.data-list :deep(.el-table .el-tag--primary) {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  color: white;
}

.data-list :deep(.el-table .el-tag--warning) {
  background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
  color: white;
}

.data-list :deep(.el-table .el-tag--success) {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: white;
}

.data-list :deep(.el-table .el-tag--danger) {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: white;
}
</style>