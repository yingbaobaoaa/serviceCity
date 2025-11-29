<template>
  <transition-group
    name="toast"
    tag="div"
    class="alert-toast-container"
  >
    <div
      v-for="alert in visibleAlerts"
      :key="alert.id"
      :class="['alert-toast', `alert-${alert.level}`, `alert-${alert.type}`]"
      @click="handleAlertClick(alert)"
    >
      <div class="alert-icon">
        <el-icon>
          <component :is="getAlertIcon(alert)" />
        </el-icon>
      </div>

      <div class="alert-content">
        <div class="alert-header">
          <h4 class="alert-title">{{ alert.title }}</h4>
          <span class="alert-time">{{ formatTime(alert.triggerTime) }}</span>
        </div>

        <p class="alert-description">{{ truncateDescription(alert.description) }}</p>

        <div class="alert-actions">
          <el-button
            size="small"
            type="primary"
            @click.stop="handleAlertClick(alert)"
          >
            查看详情
          </el-button>
          <el-button
            size="small"
            @click.stop="dismissAlert(alert.id)"
          >
            稍后处理
          </el-button>
        </div>
      </div>

      <div class="alert-close" @click.stop="dismissAlert(alert.id)">
        <el-icon><Close /></el-icon>
      </div>
    </div>
  </transition-group>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Close,
  WarningFilled,
  InfoFilled,
  CircleCloseFilled,
  Warning
} from '@element-plus/icons-vue'
import type { Alert } from '@/types'

interface Props {
  alerts: Alert[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  dismiss: [alertId: string]
}>()

const router = useRouter()
const dismissedAlerts = ref<Set<string>>(new Set())

// 可见的预警（未被关闭的）
const visibleAlerts = computed(() => {
  return props.alerts.filter(alert => !dismissedAlerts.value.has(alert.id))
})

// 获取预警图标
function getAlertIcon(alert: Alert) {
  if (alert.type === 'cluster') {
    return alert.level === 'high' ? WarningFilled : InfoFilled
  } else {
    return alert.level === 'high' ? CircleCloseFilled : Warning
  }
}

// 格式化时间
function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 1) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (minutes < 1440) {
    return `${Math.floor(minutes / 60)}小时前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 截断描述文本
function truncateDescription(description: string, maxLength: number = 80): string {
  return description.length > maxLength
    ? description.substring(0, maxLength) + '...'
    : description
}

// 处理预警点击
function handleAlertClick(alert: Alert) {
  router.push({
    path: '/alerts',
    query: {
      alertId: alert.id
    }
  })
}

// 关闭预警
function dismissAlert(alertId: string) {
  dismissedAlerts.value.add(alertId)
  emit('dismiss', alertId)
}

// 自动关闭定时器
let closeTimers: Map<string, NodeJS.Timeout> = new Map()

// 启动自动关闭
function startAutoClose(alert: Alert) {
  // 高级别预警10秒后自动关闭，中级别15秒，低级别20秒
  const delay = alert.level === 'high' ? 10000 : alert.level === 'medium' ? 15000 : 20000

  const timer = setTimeout(() => {
    dismissAlert(alert.id)
    closeTimers.delete(alert.id)
  }, delay)

  closeTimers.set(alert.id, timer)
}

// 监听预警变化，启动自动关闭
onMounted(() => {
  visibleAlerts.value.forEach(alert => {
    if (!closeTimers.has(alert.id)) {
      startAutoClose(alert)
    }
  })
})
</script>

<style scoped>
.alert-toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
  pointer-events: none;
}

.alert-toast {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  cursor: pointer;
  pointer-events: all;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.alert-toast:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

/* 预警级别样式 */
.alert-high {
  border-left: 4px solid #ef4444;
}

.alert-medium {
  border-left: 4px solid #f59e0b;
}

.alert-low {
  border-left: 4px solid #10b981;
}

/* 预警类型装饰 */
.alert-cluster::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.alert-abnormal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.alert-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 18px;
}

.alert-high .alert-icon {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #ef4444;
}

.alert-medium .alert-icon {
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  color: #f59e0b;
}

.alert-low .alert-icon {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #10b981;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}

.alert-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.alert-time {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
}

.alert-description {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.4;
  word-break: break-word;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.alert-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
}

.alert-close:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
}

/* 动画效果 */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .alert-toast-container {
    right: 16px;
    left: 16px;
    max-width: none;
  }

  .alert-toast {
    padding: 14px;
  }

  .alert-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
    margin-right: 10px;
  }

  .alert-title {
    font-size: 13px;
  }

  .alert-description {
    font-size: 12px;
  }

  .alert-actions {
    flex-direction: column;
    gap: 6px;
  }

  .alert-actions :deep(.el-button) {
    width: 100%;
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>