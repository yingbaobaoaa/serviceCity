<template>
  <div class="data-list">
    <el-card>
      <template #header>
        <div class="header">
          <h4>数据列表</h4>
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
import type { CityEvent, SensorData, ViewMode } from '@/types'

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

  if (firstItem.dataType === 'event') return '事件视图'
  if (firstItem.dataType === 'sensor') return '传感器视图'
  return '合并视图'
})

const hasSensorValue = computed(() => {
  return props.data.some(item => item.dataType === 'sensor')
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h4 {
  margin: 0;
}

.view-info {
  color: #909399;
  font-size: 14px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>