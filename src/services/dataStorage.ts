// 数据存储服务
import type { CityEvent, SensorData } from '@/types'
import axios from 'axios'

const STORAGE_KEYS = {
  CITY_EVENTS: 'smartcity_city_events',
  SENSOR_DATA: 'smartcity_sensor_data',
  LAST_UPDATE: 'smartcity_last_update'
}

export interface DataStatus {
  loaded: boolean
  lastUpdate: string | null
  error: string | null
}

export class DataStorageService {
  private static instance: DataStorageService

  static getInstance(): DataStorageService {
    if (!DataStorageService.instance) {
      DataStorageService.instance = new DataStorageService()
    }
    return DataStorageService.instance
  }

  // 获取城市事件数据
  getCityEvents(): CityEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CITY_EVENTS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('获取城市事件数据失败:', error)
      return []
    }
  }

  // 获取传感器数据
  getSensorData(): SensorData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SENSOR_DATA)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('获取传感器数据失败:', error)
      return []
    }
  }

  // 保存城市事件数据
  saveCityEvents(events: CityEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CITY_EVENTS, JSON.stringify(events))
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString())
    } catch (error) {
      console.error('保存城市事件数据失败:', error)
    }
  }

  // 保存传感器数据
  saveSensorData(data: SensorData[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SENSOR_DATA, JSON.stringify(data))
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATE, new Date().toISOString())
    } catch (error) {
      console.error('保存传感器数据失败:', error)
    }
  }

  // 获取数据状态
  getDataStatus(): DataStatus {
    try {
      const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)
      const cityEvents = this.getCityEvents()
      const sensorData = this.getSensorData()

      return {
        loaded: cityEvents.length > 0 || sensorData.length > 0,
        lastUpdate,
        error: null
      }
    } catch (error) {
      return {
        loaded: false,
        lastUpdate: null,
        error: error instanceof Error ? error.message : '获取数据状态失败'
      }
    }
  }

  // 清空所有数据
  clearAllData(): void {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('清空数据失败:', error)
    }
  }

  // 从远程API加载数据
  async loadFromRemote(): Promise<void> {
    try {
      // 并行加载城市事件和传感器数据
      const [eventsResponse, sensorsResponse] = await Promise.all([
        axios.get('/mock-data/city-events.json'),
        axios.get('/mock-data/sensor-data.json')
      ])

      // 转换数据格式，添加时间戳
      const events: CityEvent[] = eventsResponse.data.map((item: any) => ({
        ...item,
        reportTime: item.reportTime || new Date().toISOString()
      }))

      const sensors: SensorData[] = sensorsResponse.data.map((item: any) => ({
        ...item,
        timestamp: item.timestamp || new Date().toISOString()
      }))

      // 保存到本地存储
      this.saveCityEvents(events)
      this.saveSensorData(sensors)

      console.log(`成功加载 ${events.length} 条城市事件和 ${sensors.length} 条传感器数据`)
    } catch (error) {
      console.error('从远程加载数据失败:', error)
      throw new Error('加载数据失败，请检查网络连接')
    }
  }

  // 检查数据是否需要更新（可选：设置缓存时效）
  needsUpdate(maxAgeHours: number = 24): boolean {
    try {
      const lastUpdate = localStorage.getItem(STORAGE_KEYS.LAST_UPDATE)
      if (!lastUpdate) return true

      const now = new Date()
      const last = new Date(lastUpdate)
      const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60)

      return diffHours > maxAgeHours
    } catch {
      return true
    }
  }

  // 获取数据统计信息
  getDataStats() {
    const events = this.getCityEvents()
    const sensors = this.getSensorData()

    // 事件类型统计
    const eventTypes = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 传感器类型统计
    const sensorTypes = sensors.reduce((acc, sensor) => {
      acc[sensor.type] = (acc[sensor.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 区域统计
    const districts = [
      ...events.map(e => e.location.district),
      ...sensors.map(s => s.location.district)
    ].reduce((acc, district) => {
      acc[district] = (acc[district] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // 状态统计
    const eventStatuses = events.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sensorStatuses = sensors.reduce((acc, sensor) => {
      acc[sensor.status] = (acc[sensor.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalEvents: events.length,
      totalSensors: sensors.length,
      eventTypes,
      sensorTypes,
      districts,
      eventStatuses,
      sensorStatuses,
      lastUpdate: this.getDataStatus().lastUpdate
    }
  }
}

// 导出单例实例
export const dataStorage = DataStorageService.getInstance()