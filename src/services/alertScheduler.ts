// 预警定时检测服务
import { ref } from 'vue'
import { alertDetector } from './alertDetector'
import { alertService } from './alertService'
import { useDataStore } from '@/stores/data'

export class AlertScheduler {
  private static instance: AlertScheduler
  private intervalId: NodeJS.Timeout | null = null
  private isRunning = ref(false)
  private lastCheckTime = ref<string | null>(null)

  static getInstance(): AlertScheduler {
    if (!AlertScheduler.instance) {
      AlertScheduler.instance = new AlertScheduler()
    }
    return AlertScheduler.instance
  }

  // 启动定时检测
  start(): void {
    if (this.isRunning.value) {
      console.log('预警检测任务已在运行中')
      return
    }

    console.log('启动预警定时检测任务')
    this.isRunning.value = true

    // 立即执行一次检测
    // this.checkAlerts()

    // 设置定时器，每分钟检测一次
    this.intervalId = setInterval(() => {
      this.checkAlerts()
    }, 60000) // 1分钟 = 60000ms
  }

  // 停止定时检测
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning.value = false
    console.log('预警定时检测任务已停止')
  }

  // 获取运行状态
  get isRunning(): boolean {
    return this.isRunning.value
  }

  // 获取最后检查时间
  get lastCheck(): string | null {
    return this.lastCheckTime.value
  }

  // 执行预警检测
  private async checkAlerts(): Promise<void> {
    try {
      const dataStore = useDataStore()
      const events = dataStore.events
      const sensors = dataStore.sensors

      console.log(`开始预警检测 - 事件: ${events.length}, 传感器: ${sensors.length}`)
      this.lastCheckTime.value = new Date().toISOString()

      // 每分钟都生成模拟预警用于演示
      console.log('每分钟生成预警弹窗')
      const mockAlerts = alertDetector.generateMockAlerts(events, sensors)

      // 为了确保有预警弹出，如果生成的预警为空，创建一个默认预警
      if (mockAlerts.length === 0) {
        const defaultAlert = {
          id: Date.now().toString(),
          type: 'cluster' as const,
          title: '城市管理提醒',
          description: '系统正在监控城市管理状态，一切运行正常。',
          level: 'low' as const,
          location: {
            district: '系统监控',
            street: '正常运行',
            lat: 39.9042,
            lng: 116.4074
          },
          triggerTime: new Date().toISOString(),
          aiSuggestion: '系统运行正常，无需特别处理。',
          status: 'pending' as const,
          priority: 'low' as const
        }
        alertService.addAlert(defaultAlert)
        this.triggerAlertNotifications([defaultAlert])
      } else {
        for (const mockAlert of mockAlerts) {
          // 检查是否已存在类似的模拟预警
          const existingAlerts = alertService.getAlerts()
          const exists = existingAlerts.some(existing =>
            existing.type === mockAlert.type &&
            existing.location.district === mockAlert.location.district &&
            existing.location.street === mockAlert.location.street &&
            this.isRecentAlert(existing.triggerTime, mockAlert.triggerTime, 1) // 缩短为1分钟
          )

          if (!exists) {
            alertService.addAlert(mockAlert)
          }
        }
        this.triggerAlertNotifications(mockAlerts)
      }

    } catch (error) {
      console.error('预警检测失败:', error)
    }
  }

  // 触发预警通知
  private triggerAlertNotifications(alerts: any[]): void {
    // 这里可以添加其他通知方式，如系统通知、邮件等
    alerts.forEach(alert => {
      console.log(`预警通知: ${alert.title}`)
    })
  }

  // 判断是否应该生成模拟预警
  private shouldGenerateMockAlert(): boolean {
    const lastCheck = this.lastCheckTime.value
    if (!lastCheck) return true

    const minutesSinceLastCheck = (Date.now() - new Date(lastCheck).getTime()) / (10 * 60)

    // 每5分钟最多生成一次模拟预警
    return minutesSinceLastCheck >= 5
  }

  // 检查是否为最近的预警
  private isRecentAlert(existingTime: string, newTime: string, minutes: number): boolean {
    const existingDate = new Date(existingTime)
    const newDate = new Date(newTime)
    const diffMinutes = Math.abs(newDate.getTime() - existingDate.getTime()) / (1000 * 60)
    return diffMinutes < minutes
  }

  // 手动触发一次检测
  async triggerManualCheck(): Promise<void> {
    console.log('手动触发预警检测')
    await this.checkAlerts()
  }

  // 清理资源
  destroy(): void {
    this.stop()
  }
}

// 导出单例实例
export const alertScheduler = AlertScheduler.getInstance()

// 导出响应式状态
export const isAlertSchedulerRunning = () => alertScheduler.isRunning
export const getLastAlertCheck = () => alertScheduler.lastCheck