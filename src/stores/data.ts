import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CityEvent, SensorData, AIAnalysisRecord, ViewMode } from '@/types'
import { dataStorage } from '@/services/dataStorage'

export const useDataStore = defineStore('data', () => {
  const events = ref<CityEvent[]>([])
  const sensors = ref<SensorData[]>([])
  const aiRecords = ref<AIAnalysisRecord[]>([])
  const viewMode = ref<ViewMode>('merged')
  const currentPage = ref(1)
  const pageSize = ref(10)

  const mergedData = computed(() => {
    const result = []

    if (viewMode.value === 'events' || viewMode.value === 'merged') {
      result.push(...events.value.map(event => ({
        ...event,
        dataType: 'event' as const,
        displayTime: event.reportTime
      })))
    }

    if (viewMode.value === 'sensors' || viewMode.value === 'merged') {
      result.push(...sensors.value.map(sensor => ({
        ...sensor,
        dataType: 'sensor' as const,
        displayTime: sensor.timestamp
      })))
    }

    return result.sort((a, b) => new Date(b.displayTime).getTime() - new Date(a.displayTime).getTime())
  })

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return mergedData.value.slice(start, end)
  })

  const statistics = computed(() => {
    const eventTypes = new Map<string, number>()
    const districts = new Map<string, number>()
    const abnormalSensors = sensors.value.filter(s => s.status === '异常').length
    const onlineSensors = sensors.value.filter(s => s.status !== '离线').length

    events.value.forEach(event => {
      eventTypes.set(event.type, (eventTypes.get(event.type) || 0) + 1)
      districts.set(event.location.district, (districts.get(event.location.district) || 0) + 1)
    })

    return {
      totalEvents: events.value.length,
      totalSensors: sensors.value.length,
      abnormalSensors,
      onlineSensorRate: sensors.value.length > 0 ? (onlineSensors / sensors.value.length * 100).toFixed(1) : '0',
      eventTypes: Array.from(eventTypes.entries()).map(([name, value]) => ({ name, value })),
      districtDistribution: Array.from(districts.entries()).map(([name, value]) => ({ name, value }))
    }
  })

  const hotspots = computed(() => {
    const districtEvents = new Map<string, number>()
    const districtSensors = new Map<string, number>()

    events.value.forEach(event => {
      const key = `${event.location.district}-${event.location.street}`
      districtEvents.set(key, (districtEvents.get(key) || 0) + 1)
    })

    sensors.value.filter(s => s.status === '异常').forEach(sensor => {
      const key = `${sensor.location.district}-${sensor.location.street}`
      districtSensors.set(key, (districtSensors.get(key) || 0) + 1)
    })

    const hotspots = []
    for (const [location, eventCount] of districtEvents.entries()) {
      const sensorCount = districtSensors.get(location) || 0
      hotspots.push({
        location,
        eventCount,
        abnormalSensorCount: sensorCount,
        totalScore: eventCount * 2 + sensorCount * 3
      })
    }

    return hotspots.sort((a, b) => b.totalScore - a.totalScore).slice(0, 10)
  })

  function loadData(newEvents: CityEvent[], newSensors: SensorData[]) {
    events.value = newEvents
    sensors.value = newSensors
    currentPage.value = 1

    // 使用统一的数据存储服务
    dataStorage.saveCityEvents(newEvents)
    dataStorage.saveSensorData(newSensors)
  }

  function loadFromStorage() {
    // 使用统一的数据存储服务
    events.value = dataStorage.getCityEvents()
    sensors.value = dataStorage.getSensorData()
  }

  // 添加刷新数据功能
  async function refreshData() {
    try {
      await dataStorage.loadFromRemote()
      loadFromStorage() // 重新加载到store中
      return true
    } catch (error) {
      console.error('刷新数据失败:', error)
      return false
    }
  }

  // 获取数据状态
  function getDataStatus() {
    return dataStorage.getDataStatus()
  }

  // 获取数据统计信息
  function getDetailedStats() {
    return dataStorage.getDataStats()
  }

  function addAIRecord(record: AIAnalysisRecord) {
    aiRecords.value.unshift(record)
    localStorage.setItem('aiRecords', JSON.stringify(aiRecords.value))
  }

  function loadAIRecords() {
    const stored = localStorage.getItem('aiRecords')
    if (stored) {
      aiRecords.value = JSON.parse(stored)
    }
  }

  return {
    events,
    sensors,
    aiRecords,
    viewMode,
    currentPage,
    pageSize,
    mergedData,
    paginatedData,
    statistics,
    hotspots,
    loadData,
    loadFromStorage,
    refreshData,
    getDataStatus,
    getDetailedStats,
    addAIRecord,
    loadAIRecords
  }
})