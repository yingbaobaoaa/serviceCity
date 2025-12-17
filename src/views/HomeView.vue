<template>
  <div class="home-view">
    <!-- 页面头部操作区 -->
    <div class="page-header">
      <div class="header-left">
        <h2>数据概览</h2>
        <p class="data-count">
          共 {{ dataStore.events.length }} 条事件，{{ dataStore.sensors.length }} 条传感器数据
          <span v-if="dataStatus.lastUpdate" class="update-time">
            · 最后更新: {{ formatTime(dataStatus.lastUpdate) }}
          </span>
        </p>
      </div>

      <div class="header-right">
        <el-select
            v-model="dataStore.viewMode"
            placeholder="选择视图"
            class="view-mode-selector"
            v-if="dataStore.events.length > 0 || dataStore.sensors.length > 0"
          >
            <el-option label="仅事件" value="events" />
            <el-option label="仅传感器" value="sensors" />
            <el-option label="合并视图" value="merged" />
          </el-select>

        <!-- 刷新按钮 -->
        <el-button
          type="info"
          :loading="refreshing"
          @click="handleRefresh"
          class="refresh-btn"
          v-if="dataStore.events.length > 0 || dataStore.sensors.length > 0"
        >
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>

        <!-- 导入按钮 -->
        <el-button
          type="primary"
          @click="showUploadDialog = true"
          class="import-btn"
        >
          <el-icon><Upload /></el-icon>
          导入数据
        </el-button>
      </div>
    </div>

    <!-- 数据内容区域 -->
    <div class="content">
      <StatisticsCards :statistics="dataStore.statistics" />

      <ChartsPanel
        :statistics="dataStore.statistics"
        :view-mode="dataStore.viewMode"
      />

      <DataList
        :data="dataStore.paginatedData"
        :current-page="dataStore.currentPage"
        :page-size="dataStore.pageSize"
        :total="dataStore.mergedData.length"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>

    <!-- 空状态 -->
    <!-- <div v-else class="empty-state">
      <el-empty description="暂无数据">
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          立即导入数据
        </el-button>
      </el-empty>
    </div> -->

    <!-- 数据上传弹窗 -->
    <el-dialog
      v-model="showUploadDialog"
      title="数据上传"
      width="600px"
      :before-close="handleCloseDialog"
    >
      <FileUpload @data-loaded="handleDataLoaded" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { Upload, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import FileUpload from '@/components/FileUpload.vue'
import StatisticsCards from '@/components/StatisticsCards.vue'
import ChartsPanel from '@/components/ChartsPanel.vue'
import DataList from '@/components/DataList.vue'
import type { CityEvent, SensorData } from '@/types'

const dataStore = useDataStore()
const showUploadDialog = ref(false)
const refreshing = ref(false)

// 获取数据状态
const dataStatus = computed(() => dataStore.getDataStatus())

onMounted(() => {
  dataStore.loadFromStorage()
})

function handleDataLoaded(data: { events: CityEvent[], sensors: SensorData[] }) {
  dataStore.loadData(data.events, data.sensors)
  showUploadDialog.value = false
}

function handleCloseDialog() {
  showUploadDialog.value = false
}

function handlePageChange(page: number) {
  dataStore.currentPage = page
}

function handlePageSizeChange(pageSize: number) {
  dataStore.pageSize = pageSize
  dataStore.currentPage = 1 // 页面大小变更时回到第一页
}

// 刷新数据
async function handleRefresh() {
  refreshing.value = true
  try {
    const success = await dataStore.refreshData()
    if (success) {
      ElMessage.success('数据刷新成功')
    } else {
      ElMessage.error('数据刷新失败，请检查网络连接')
    }
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('数据刷新失败，请稍后重试')
  } finally {
    refreshing.value = false
  }
}

// 格式化时间显示
function formatTime(timeStr: string): string {
  try {
    const date = new Date(timeStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) {
      return '刚刚'
    } else if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  } catch {
    return '未知时间'
  }
}
</script>

<style scoped>
.home-view {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
  font-weight: 600;
}

.data-count {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.update-time {
  color: #409eff;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-mode-selector {
  width: 160px;
}

.view-mode-selector :deep(.el-input__wrapper) {
  border-radius: 6px;
}

.view-mode-selector :deep(.el-input__inner) {
  font-size: 14px;
}

.import-btn {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  padding: 10px 16px;
}

.import-btn:hover {
  background: var(--el-color-primary-dark-2);
  border-color: var(--el-color-primary-dark-2);
}

.refresh-btn {
  background: #f0f0f0;
  border-color: #dcdfe6;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  padding: 10px 16px;
}

.refresh-btn:hover {
  background: #e6e8eb;
  border-color: #c0c4cc;
  color: #409eff;
}

/* 内容区域 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 400px;
}

.empty-state :deep(.el-empty__description) {
  color: #909399;
  margin-bottom: 20px;
}

/* 弹窗样式优化 */
:deep(.el-dialog) {
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  padding: 20px 20px 10px;
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
</style>