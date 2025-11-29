<template>
  <div class="alerts-view">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>预警中心</h2>
        <p class="alert-count">
          共 {{ statistics.total }} 条预警
          <span class="alert-stats">
            待处理: {{ statistics.pending }} | 处理中: {{ statistics.processing }} | 已解决: {{ statistics.resolved }}
          </span>
        </p>
      </div>

      <div class="header-right">
        <el-select
          v-model="filterType"
          placeholder="筛选类型"
          class="filter-select"
          clearable
        >
          <el-option label="全部类型" value="" />
          <el-option label="聚集性问题" value="cluster" />
          <el-option label="设施异常" value="abnormal" />
        </el-select>

        <el-select
          v-model="filterStatus"
          placeholder="筛选状态"
          class="filter-select"
          clearable
        >
          <el-option label="全部状态" value="" />
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已解决" value="resolved" />
        </el-select>

        <el-button @click="refreshAlerts" :loading="refreshing">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card high-priority">
        <div class="stat-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.highLevelCount }}</div>
          <div class="stat-label">高级预警</div>
        </div>
      </div>

      <div class="stat-card cluster-type">
        <div class="stat-icon">
          <el-icon><LocationInformation /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.clusterCount }}</div>
          <div class="stat-label">聚集性问题</div>
        </div>
      </div>

      <div class="stat-card abnormal-type">
        <div class="stat-icon">
          <el-icon><CircleCloseFilled /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.abnormalCount }}</div>
          <div class="stat-label">设施异常</div>
        </div>
      </div>

      <div class="stat-card pending">
        <div class="stat-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ statistics.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
    </div>

    <!-- 预警列表 -->
    <div class="alerts-list">
      <div v-if="filteredAlerts.length === 0" class="empty-state">
        <el-empty description="暂无预警信息">
          <el-button type="primary" @click="refreshAlerts">
            <el-icon><Refresh /></el-icon>
            刷新预警
          </el-button>
        </el-empty>
      </div>

      <div v-else>
        <TransitionGroup name="list" tag="div">
          <div
            v-for="alert in paginatedAlerts"
            :key="alert.id"
            :class="['alert-item', `alert-${alert.level}`, `alert-${alert.type}`]"
          >
            <div class="alert-header">
              <div class="alert-title-section">
                <h3 class="alert-title">{{ alert.title }}</h3>
                <div class="alert-meta">
                  <el-tag :type="getLevelType(alert.level)" size="small">
                    {{ getLevelText(alert.level) }}
                  </el-tag>
                  <el-tag :type="getStatusType(alert.status)" size="small">
                    {{ getStatusText(alert.status) }}
                  </el-tag>
                  <el-tag :type="getTypeType(alert.type)" size="small">
                    {{ getTypeText(alert.type) }}
                  </el-tag>
                </div>
              </div>

              <div class="alert-time">
                {{ formatTime(alert.triggerTime) }}
              </div>
            </div>

            <div class="alert-description">
              {{ alert.description }}
            </div>

            <div class="alert-location">
              <el-icon><Location /></el-icon>
              {{ alert.location.district }} - {{ alert.location.street }}
            </div>

            <div class="alert-suggestion">
              <h4>AI 处置建议：</h4>
              <p>{{ alert.aiSuggestion }}</p>
            </div>

            <div class="alert-actions">
              <el-button
                v-if="alert.status === 'pending'"
                size="small"
                type="warning"
                @click="updateAlertStatus(alert.id, 'processing')"
              >
                开始处理
              </el-button>

              <el-button
                v-if="alert.status === 'processing'"
                size="small"
                type="success"
                @click="updateAlertStatus(alert.id, 'resolved')"
              >
                标记解决
              </el-button>

              <el-button
                v-if="alert.status === 'pending'"
                size="small"
                @click="updateAlertStatus(alert.id, 'processing')"
              >
                待跟进
              </el-button>

              <el-button
                size="small"
                type="danger"
                @click="deleteAlert(alert.id)"
              >
                删除
              </el-button>

              <el-button
                size="small"
                @click="viewOnMap(alert)"
              >
                查看地图
              </el-button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="filteredAlerts.length > 0" class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="filteredAlerts.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Refresh,
  WarningFilled,
  LocationInformation,
  CircleCloseFilled,
  Clock,
  Location
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { alertService } from '@/services/alertService'
import type { Alert } from '@/types'

// 响应式数据
const alerts = ref<Alert[]>([])
const refreshing = ref(false)
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 统计信息
const statistics = computed(() => alertService.getAlertStatistics())

// 过滤后的预警
const filteredAlerts = computed(() => {
  return alerts.value.filter(alert => {
    if (filterType.value && alert.type !== filterType.value) return false
    if (filterStatus.value && alert.status !== filterStatus.value) return false
    return true
  })
})

// 分页后的预警
const paginatedAlerts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAlerts.value.slice(start, end)
})

// 刷新预警
async function refreshAlerts() {
  refreshing.value = true
  try {
    alerts.value = alertService.getAlerts()
    ElMessage.success('预警列表已刷新')
  } catch (error) {
    console.error('刷新预警失败:', error)
    ElMessage.error('刷新预警失败')
  } finally {
    refreshing.value = false
  }
}

// 更新预警状态
async function updateAlertStatus(alertId: string, status: Alert['status']) {
  try {
    const success = alertService.updateAlertStatus(alertId, status)
    if (success) {
      const alert = alerts.value.find(a => a.id === alertId)
      if (alert) {
        alert.status = status
      }
      ElMessage.success(`预警状态已更新为${getStatusText(status)}`)
    } else {
      ElMessage.error('更新状态失败')
    }
  } catch (error) {
    console.error('更新预警状态失败:', error)
    ElMessage.error('更新状态失败')
  }
}

// 删除预警
async function deleteAlert(alertId: string) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条预警吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const success = alertService.removeAlert(alertId)
    if (success) {
      alerts.value = alerts.value.filter(a => a.id !== alertId)
      ElMessage.success('预警已删除')
    } else {
      ElMessage.error('删除预警失败')
    }
  } catch {
    // 用户取消删除
  }
}

// 在地图上查看
function viewOnMap(alert: Alert) {
  // 这里可以跳转到地图页面并定位到预警位置
  console.log('在地图上查看预警:', alert)
  ElMessage.info('地图查看功能开发中...')
}

// 分页处理
function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
}

function handleCurrentChange(page: number) {
  currentPage.value = page
}

// 辅助函数
function getLevelType(level: string): string {
  switch (level) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'info'
  }
}

function getLevelText(level: string): string {
  switch (level) {
    case 'high': return '高级'
    case 'medium': return '中级'
    case 'low': return '低级'
    default: return '未知'
  }
}

function getStatusType(status: string): string {
  switch (status) {
    case 'pending': return 'warning'
    case 'processing': return 'info'
    case 'resolved': return 'success'
    default: return 'info'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'pending': return '待处理'
    case 'processing': return '处理中'
    case 'resolved': return '已解决'
    default: return '未知'
  }
}

function getTypeType(type: string): string {
  return type === 'cluster' ? 'primary' : 'warning'
}

function getTypeText(type: string): string {
  return type === 'cluster' ? '聚集性问题' : '设施异常'
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN')
}

// 组件挂载
onMounted(() => {
  refreshAlerts()
})
</script>

<style scoped>
.alerts-view {
  padding: 24px;
  min-height: calc(100vh - 80px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.alert-count {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.alert-stats {
  color: #10b981;
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 12px;
}

.filter-select {
  width: 140px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.high-priority .stat-icon {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #ef4444;
}

.cluster-type .stat-icon {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #10b981;
}

.abnormal-type .stat-icon {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  color: #f59e0b;
}

.pending .stat-icon {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #3b82f6;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-top: 4px;
}

/* 预警列表 */
.alerts-list {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  min-height: 400px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.alert-item {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.alert-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.alert-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.alert-high::before {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.alert-medium::before {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.alert-low::before {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.alert-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.alert-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.alert-time {
  color: #6b7280;
  font-size: 14px;
  white-space: nowrap;
}

.alert-description {
  color: #4b5563;
  line-height: 1.5;
  margin-bottom: 12px;
}

.alert-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 12px;
}

.alert-suggestion {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.alert-suggestion h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.alert-suggestion p {
  margin: 0;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
}

.alert-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

/* 动画效果 */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.list-move {
  transition: transform 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .alerts-view {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  }

  .header-right {
    width: 100%;
    flex-wrap: wrap;
  }

  .filter-select {
    flex: 1;
    min-width: 120px;
  }

  .stats-cards {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .alert-item {
    padding: 16px;
  }

  .alert-header {
    flex-direction: column;
    gap: 8px;
  }

  .alert-actions {
    justify-content: stretch;
  }

  .alert-actions :deep(.el-button) {
    flex: 1;
    min-width: 0;
  }
}
</style>