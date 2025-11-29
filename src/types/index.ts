export interface CityEvent {
  id: string
  type: string
  description: string
  location: {
    district: string
    street: string
    lat: number
    lng: number
  }
  reportTime: string
  reporterType: string
  status: string
}

export interface SensorData {
  sensorId: string
  type: string
  location: {
    district: string
    street: string
    lat: number
    lng: number
  }
  value: number
  unit: string
  threshold: number
  timestamp: string
  status: string
}

export interface AIAnalysisRecord {
  id: string
  timestamp: string
  selectedItems: (CityEvent | SensorData)[]
  result: {
    problemAttribution: string
    disposalSuggestion: string
    priority: 'high' | 'medium' | 'low'
  }
}

export type ViewMode = 'events' | 'sensors' | 'merged'

// 预警相关类型
export interface Alert {
  id: string
  type: 'cluster' | 'abnormal'  // cluster: 聚集性问题, abnormal: 设施异常
  title: string
  description: string
  level: 'low' | 'medium' | 'high'
  location: {
    district: string
    street: string
    lat: number
    lng: number
  }
  triggerTime: string
  relatedEvents?: CityEvent[]
  relatedSensors?: SensorData[]
  aiSuggestion: string
  status: 'pending' | 'processing' | 'resolved'
  priority: 'high' | 'medium' | 'low'
}

export interface AlertStatistics {
  total: number
  pending: number
  processing: number
  resolved: number
  clusterCount: number
  abnormalCount: number
  highLevelCount: number
}