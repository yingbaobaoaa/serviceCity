// 预警检测逻辑
import type { CityEvent, SensorData, Alert } from '@/types'
import { alertService } from './alertService'

export class AlertDetector {
  private static instance: AlertDetector

  static getInstance(): AlertDetector {
    if (!AlertDetector.instance) {
      AlertDetector.instance = new AlertDetector()
    }
    return AlertDetector.instance
  }

  // 执行预警检测
  async detectAlerts(events: CityEvent[], sensors: SensorData[]): Promise<Alert[]> {
    const newAlerts: Alert[] = []

    try {
      // 检测聚集性问题预警
      const clusterAlerts = alertService.detectClusterAlerts(events)

      // 检测设施异常预警
      const abnormalAlerts = alertService.detectAbnormalAlerts(sensors)

      // 过滤掉已存在的预警
      const existingAlerts = alertService.getAlerts()
      const allNewAlerts = [...clusterAlerts, ...abnormalAlerts]

      for (const alert of allNewAlerts) {
        const exists = existingAlerts.some(existing =>
          existing.type === alert.type &&
          existing.location.district === alert.location.district &&
          existing.location.street === alert.location.street &&
          this.isRecentAlert(existing.triggerTime, alert.triggerTime, 1) // 5分钟内的相似预警不重复
        )

        if (!exists) {
          newAlerts.push(alert)
          alertService.addAlert(alert)
        }
      }

      console.log(`预警检测完成：发现 ${newAlerts.length} 个新预警`)
      return newAlerts

    } catch (error) {
      console.error('预警检测失败:', error)
      return []
    }
  }

  // 检查是否为最近的相似预警
  private isRecentAlert(existingTime: string, newTime: string, minutes: number): boolean {
    const existingDate = new Date(existingTime)
    const newDate = new Date(newTime)
    const diffMinutes = Math.abs(newDate.getTime() - existingDate.getTime()) / (1000 * 60)
    return diffMinutes < minutes
  }

  // 模拟预警数据生成（用于演示）
  generateMockAlerts(events: CityEvent[], sensors: SensorData[]): Alert[] {
    const mockAlerts: Alert[] = []

    // 模拟聚集性问题预警
    if (events.length >= 0) {
      const event = events[0]
      const clusterAlert: Alert = {
        id: `mock_cluster_${Date.now()}`,
        type: 'cluster',
        title: `${event.location.district} - 聚集性问题预警`,
        description: `${event.location.district} 在1小时内发现${Math.min(events.length, 8)}次同类事件上报，建议重点关注该区域的系统性问题。`,
        level: 'medium',
        location: event.location,
        triggerTime: new Date().toISOString(),
        relatedEvents: events.slice(0, 3),
        aiSuggestion: `建议成立专项工作组，对${event.location.district}进行全面排查，制定系统性解决方案。协调相关部门加强日常监管，建立预防性维护机制。`,
        status: 'pending',
        priority: 'medium'
      }
      mockAlerts.push(clusterAlert)
    }

    // 模拟设施异常预警
    if (sensors.length >= 2) {
      const abnormalSensors = sensors.filter(s => s.status === '异常' || s.status === '超标')
      if (abnormalSensors.length > 0) {
        const sensor = abnormalSensors[0]
        const abnormalAlert: Alert = {
          id: `mock_abnormal_${Date.now()}`,
          type: 'abnormal',
          title: `${sensor.location.district} - 设施异常预警`,
          description: `${sensor.location.district} 的${sensor.type}传感器连续监测到异常数值（${sensor.value}${sensor.unit}），设施可能存在故障或异常情况。`,
          level: 'high',
          location: sensor.location,
          triggerTime: new Date().toISOString(),
          relatedSensors: abnormalSensors.slice(0, 2),
          aiSuggestion: `建议立即派遣专业技术人员到现场检查设备，数值异常可能预示设备故障或环境异常。如确认设备故障，应立即维修或更换，避免影响正常运营。`,
          status: 'pending',
          priority: 'high'
        }
        mockAlerts.push(abnormalAlert)
      }
    }

    return mockAlerts
  }
}

// 导出单例实例
export const alertDetector = AlertDetector.getInstance()