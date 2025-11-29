// 预警服务
import type { CityEvent, SensorData, Alert, AlertStatistics } from '@/types'

const STORAGE_KEYS = {
  ALERTS: 'smartcity_alerts',
  ALERT_LAST_CHECK: 'smartcity_alert_last_check'
}

export class AlertService {
  private static instance: AlertService

  static getInstance(): AlertService {
    if (!AlertService.instance) {
      AlertService.instance = new AlertService()
    }
    return AlertService.instance
  }

  // 获取所有预警
  getAlerts(): Alert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('获取预警数据失败:', error)
      return []
    }
  }

  // 保存预警
  saveAlerts(alerts: Alert[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts))
      localStorage.setItem(STORAGE_KEYS.ALERT_LAST_CHECK, new Date().toISOString())
    } catch (error) {
      console.error('保存预警数据失败:', error)
    }
  }

  // 添加新预警
  addAlert(alert: Alert): void {
    const alerts = this.getAlerts()
    alerts.unshift(alert)
    this.saveAlerts(alerts)
  }

  // 更新预警状态
  updateAlertStatus(alertId: string, status: Alert['status']): boolean {
    try {
      const alerts = this.getAlerts()
      const alertIndex = alerts.findIndex(alert => alert.id === alertId)
      if (alertIndex !== -1) {
        alerts[alertIndex].status = status
        this.saveAlerts(alerts)
        return true
      }
      return false
    } catch (error) {
      console.error('更新预警状态失败:', error)
      return false
    }
  }

  // 删除预警
  removeAlert(alertId: string): boolean {
    try {
      const alerts = this.getAlerts()
      const filteredAlerts = alerts.filter(alert => alert.id !== alertId)
      if (filteredAlerts.length < alerts.length) {
        this.saveAlerts(filteredAlerts)
        return true
      }
      return false
    } catch (error) {
      console.error('删除预警失败:', error)
      return false
    }
  }

  // 获取预警统计
  getAlertStatistics(): AlertStatistics {
    const alerts = this.getAlerts()

    return {
      total: alerts.length,
      pending: alerts.filter(a => a.status === 'pending').length,
      processing: alerts.filter(a => a.status === 'processing').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      clusterCount: alerts.filter(a => a.type === 'cluster').length,
      abnormalCount: alerts.filter(a => a.type === 'abnormal').length,
      highLevelCount: alerts.filter(a => a.level === 'high').length
    }
  }

  // 检测聚集性问题预警
  detectClusterAlerts(events: CityEvent[]): Alert[] {
    const alerts: Alert[] = []

    // 按区域和类型分组
    const groupedEvents = this.groupEventsByLocationAndType(events)

    for (const [locationKey, locationEvents] of groupedEvents) {
      if (locationEvents.length >= 5) {
        // 检查是否在1小时内
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recentEvents = locationEvents.filter(event =>
          new Date(event.reportTime) >= oneHourAgo
        )

        if (recentEvents.length >= 5) {
          const alert: Alert = {
            id: `alert_cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'cluster',
            title: `${locationEvents[0].location.district} - 聚集性问题预警`,
            description: `${locationEvents[0].location.district} ${locationEvents[0].location.street} 在1小时内上报了${recentEvents.length}次${locationEvents[0].type}事件，可能存在系统性问题`,
            level: this.determineClusterLevel(recentEvents.length),
            location: locationEvents[0].location,
            triggerTime: new Date().toISOString(),
            relatedEvents: recentEvents,
            aiSuggestion: this.generateClusterSuggestion(recentEvents),
            status: 'pending',
            priority: this.determineClusterPriority(recentEvents.length)
          }
          alerts.push(alert)
        }
      }
    }

    return alerts
  }

  // 检测设施异常预警
  detectAbnormalAlerts(sensors: SensorData[]): Alert[] {
    const alerts: Alert[] = []

    // 按传感器分组，按时间排序
    const groupedSensors = this.groupSensorsById(sensors)

    for (const [sensorId, sensorReadings] of groupedSensors) {
      // 按时间排序
      sensorReadings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      // 检查最近3次读数是否都超标
      const recentReadings = sensorReadings.slice(0, 3)
      if (recentReadings.length >= 3 && recentReadings.every(r => r.status === '异常' || r.status === '超标')) {
        const alert: Alert = {
          id: `alert_abnormal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'abnormal',
          title: `${recentReadings[0].location.district} - 设施异常预警`,
          description: `${recentReadings[0].location.district} ${recentReadings[0].location.street} 的${recentReadings[0].type}传感器连续3次检测到异常数值（${recentReadings.map(r => r.value).join(', ')}${recentReadings[0].unit}），设施可能存在故障`,
          level: this.determineAbnormalLevel(recentReadings),
          location: recentReadings[0].location,
          triggerTime: new Date().toISOString(),
          relatedSensors: recentReadings,
          aiSuggestion: this.generateAbnormalSuggestion(recentReadings),
          status: 'pending',
          priority: this.determineAbnormalPriority(recentReadings)
        }
        alerts.push(alert)
      }
    }

    return alerts
  }

  // 按位置和类型分组事件
  private groupEventsByLocationAndType(events: CityEvent[]): Map<string, CityEvent[]> {
    const grouped = new Map<string, CityEvent[]>()

    for (const event of events) {
      const key = `${event.location.district}_${event.location.street}_${event.type}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(event)
    }

    return grouped
  }

  // 按传感器ID分组
  private groupSensorsById(sensors: SensorData[]): Map<string, SensorData[]> {
    const grouped = new Map<string, SensorData[]>()

    for (const sensor of sensors) {
      if (!grouped.has(sensor.sensorId)) {
        grouped.set(sensor.sensorId, [])
      }
      grouped.get(sensor.sensorId)!.push(sensor)
    }

    return grouped
  }

  // 确定聚集性问题的级别
  private determineClusterLevel(count: number): Alert['level'] {
    if (count >= 10) return 'high'
    if (count >= 7) return 'medium'
    return 'low'
  }

  // 确定设施异常的级别
  private determineAbnormalLevel(readings: SensorData[]): Alert['level'] {
    const avgValue = readings.reduce((sum, r) => sum + r.value, 0) / readings.length
    const avgThreshold = readings.reduce((sum, r) => sum + r.threshold, 0) / readings.length
    const ratio = avgValue / avgThreshold

    if (ratio >= 3) return 'high'
    if (ratio >= 2) return 'medium'
    return 'low'
  }

  // 确定聚集性问题的优先级
  private determineClusterPriority(count: number): Alert['priority'] {
    if (count >= 10) return 'high'
    if (count >= 7) return 'medium'
    return 'low'
  }

  // 确定设施异常的优先级
  private determineAbnormalPriority(readings: SensorData[]): Alert['priority'] {
    const avgValue = readings.reduce((sum, r) => sum + r.value, 0) / readings.length
    const avgThreshold = readings.reduce((sum, r) => sum + r.threshold, 0) / readings.length
    const ratio = avgValue / avgThreshold

    if (ratio >= 3) return 'high'
    if (ratio >= 2) return 'medium'
    return 'low'
  }

  // 生成聚集性问题的AI建议
  private generateClusterSuggestion(events: CityEvent[]): string {
    const eventType = events[0].type
    const location = events[0].location.district

    const suggestions = {
      '道路积水': `建议立即派遣排水车到${location}进行紧急排水，同时检查该区域排水系统容量。需要协调交通管理部门实施交通管制，确保市民安全。`,
      '路灯故障': `建议安排电力维护人员立即到${location}进行抢修，重点检查供电线路和灯具设备。可设置临时照明设施保障夜间安全。`,
      '垃圾溢出': `建议增派清运车辆到${location}进行紧急清运，同时评估该区域垃圾桶配置是否合理。加强日常巡检频率。`,
      '噪音污染': `建议环保部门到${location}进行现场监测，必要时采取噪音控制措施。协调相关部门加强监管执法。`,
      '空气质量': `建议启动空气污染应急预案，加强对${location}污染源的排查和管控。提醒市民减少户外活动。`
    }

    return suggestions[eventType] || `建议相关部门立即到${location}现场调查，采取必要的处置措施，确保问题得到及时解决。`
  }

  // 生成设施异常的AI建议
  private generateAbnormalSuggestion(readings: SensorData[]): string {
    const sensorType = readings[0].type
    const location = readings[0].location.district
    const maxValue = Math.max(...readings.map(r => r.value))

    const suggestions = {
      '积水监测': `建议立即启动排水应急预案，派遣排水车辆到${location}进行作业。设置警示标志，引导车辆绕行。检查排水设施是否正常运行。`,
      'PM2.5': `建议启动重污染天气应急预案，加强对${location}周边污染源的管控。必要时实施交通管制，减少机动车排放。`,
      '噪音监测': `建议环境监察部门到${location}现场执法，查处噪音污染源。必要时采取降噪措施，保障周边居民生活安宁。`,
      '路灯电流': `建议立即派遣电力维护人员到${location}检修电路系统，检查是否存在短路或设备故障，避免安全事故。`
    }

    return suggestions[sensorType] || `建议立即派遣专业技术人员到${location}现场检查${sensorType}设备，数值达到${maxValue}可能预示设备故障或异常情况，需要及时处理。`
  }

  // 清空所有预警
  clearAllAlerts(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ALERTS)
      localStorage.removeItem(STORAGE_KEYS.ALERT_LAST_CHECK)
    } catch (error) {
      console.error('清空预警数据失败:', error)
    }
  }
}

// 导出单例实例
export const alertService = AlertService.getInstance()