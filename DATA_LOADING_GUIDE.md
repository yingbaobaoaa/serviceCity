# 数据加载与缓存系统使用指南

## 🎯 系统概述

本项目实现了完整的数据加载、存储和缓存系统，支持从Mock API获取城市事件和传感器数据，并自动存储到浏览器本地存储中，提供离线访问能力。

## 🚀 核心功能

### 1. 自动数据加载
- **应用启动时自动加载**：App.vue 在组件挂载时自动检查并加载数据
- **智能缓存策略**：24小时内的数据使用缓存，超过24小时自动刷新
- **加载状态提示**：提供美观的加载动画和成功/失败提示

### 2. 数据存储服务 (`src/services/dataStorage.ts`)
- **统一数据管理**：单一服务管理所有数据存储和读取
- **错误处理**：完善的错误处理和降级策略
- **数据统计**：提供详细的数据统计信息
- **缓存控制**：支持手动刷新和自动过期检查

### 3. 数据概览页面增强
- **实时数据统计**：显示事件数量、传感器数量和最后更新时间
- **一键刷新**：支持手动刷新最新数据
- **友好时间显示**：智能的相对时间显示（如"5分钟前"）

## 📁 文件结构

```
smartCity/
├── public/mock-data/              # Mock数据文件
│   ├── city-events.json          # 城市事件数据
│   └── sensor-data.json           # 传感器数据
├── src/
│   ├── services/
│   │   └── dataStorage.ts         # 数据存储服务
│   ├── stores/
│   │   └── data.ts               # 数据状态管理
│   ├── views/
│   │   └── HomeView.vue          # 数据概览页面
│   └── App.vue                   # 主应用组件
└── package.json                  # 依赖配置
```

## 🛠️ 技术实现

### 数据流程
1. **应用启动** → App.vue 检查数据状态
2. **检查缓存** → 调用 `dataStorage.getDataStatus()`
3. **加载决策** → 缓存有效则使用，否则远程加载
4. **远程加载** → 并行请求两个JSON文件
5. **数据处理** → 标准化时间戳格式
6. **本地存储** → 保存到localStorage
7. **状态更新** → 更新Pinia store状态
8. **界面展示** → 数据概览页面显示数据

### 关键技术栈
- **HTTP客户端**: Axios - 并行加载数据
- **状态管理**: Pinia - 统一状态管理
- **本地存储**: localStorage - 离线数据缓存
- **UI组件**: Element Plus - 加载提示和按钮
- **响应式**: Vue 3 Composition API

## 📊 数据结构

### 城市事件数据 (city-events.json)
```json
[
  {
    "id": "evt_001",
    "type": "道路积水",
    "description": "朝阳区建国路由于强降雨导致严重积水",
    "location": {
      "district": "朝阳区",
      "street": "建国路",
      "lat": 39.9042,
      "lng": 116.4074
    },
    "reportTime": "2024-11-28T08:30:00Z",
    "reporterType": "市民上报",
    "status": "待处理"
  }
]
```

### 传感器数据 (sensor-data.json)
```json
[
  {
    "sensorId": "snr_001",
    "type": "积水监测",
    "location": {
      "district": "朝阳区",
      "street": "建国路下凹桥",
      "lat": 39.9042,
      "lng": 116.4074
    },
    "value": 0.65,
    "unit": "m",
    "threshold": 0.3,
    "timestamp": "2024-11-28T09:00:00Z",
    "status": "超标"
  }
]
```

## 🎨 用户界面

### 数据概览页面新增功能

#### 页面头部信息显示
- **数据统计**: 显示事件总数和传感器总数
- **更新时间**: 智能显示最后更新时间
- **刷新按钮**: 一键手动刷新数据
- **导入按钮**: 保留原有文件导入功能

#### 加载状态反馈
- **初始加载**: App启动时的全屏加载动画
- **刷新加载**: 刷新按钮的loading状态
- **成功提示**: ElMessage成功提示
- **错误处理**: 降级使用缓存数据的警告提示

## 🔧 API接口

### DataStorageService 主要方法

```typescript
class DataStorageService {
  // 数据获取
  getCityEvents(): CityEvent[]
  getSensorData(): SensorData[]
  getDataStatus(): DataStatus
  getDataStats(): DataStats

  // 数据操作
  saveCityEvents(events: CityEvent[]): void
  saveSensorData(data: SensorData[]): void
  clearAllData(): void

  // 远程加载
  async loadFromRemote(): Promise<void>
  needsUpdate(maxAgeHours?: number): boolean
}
```

### DataStore 新增方法

```typescript
export const useDataStore = defineStore('data', () => {
  // 新增方法
  async refreshData(): Promise<boolean>
  getDataStatus(): DataStatus
  getDetailedStats(): DataStats
})
```

## 📱 使用体验

### 首次访问
1. 打开应用
2. 看到"正在加载城市数据..."的全屏加载动画
3. 加载成功后显示"数据加载成功！"提示
4. 数据概览页面显示完整的数据统计和图表

### 后续访问
1. 应用启动时自动检查缓存
2. 24小时内直接使用缓存，秒速加载
3. 超过24小时自动刷新获取最新数据
4. 可随时点击"刷新数据"按钮手动更新

### 网络异常情况
1. 如果网络请求失败，自动降级使用缓存数据
2. 显示"数据加载失败，使用缓存数据"的友好提示
3. 保证应用在离线状态下仍可正常使用

## 🔄 缓存策略

### 缓存时效控制
- **默认缓存时间**: 24小时
- **自动检查**: 每次启动时检查缓存时效
- **手动刷新**: 用户可随时强制刷新
- **智能降级**: 网络异常时使用缓存

### 存储键值设计
```typescript
const STORAGE_KEYS = {
  CITY_EVENTS: 'smartcity_city_events',      // 城市事件
  SENSOR_DATA: 'smartcity_sensor_data',       // 传感器数据
  LAST_UPDATE: 'smartcity_last_update'        // 最后更新时间
}
```

## 🚀 性能优化

### 并行加载
- 使用 `Promise.all()` 并行请求多个数据文件
- 减少网络请求总时间
- 提升加载效率

### 错误恢复
- 完善的错误处理机制
- 自动降级到缓存数据
- 保证应用可用性

### 内存优化
- 统一的数据存储服务
- 避免重复的localStorage操作
- 按需加载数据统计

## 🔍 故障排除

### 常见问题

1. **数据加载失败**
   - 检查网络连接
   - 确认mock-data文件是否存在于public目录
   - 查看浏览器控制台错误信息

2. **缓存数据问题**
   - 清除浏览器localStorage
   - 刷新页面重新加载数据
   - 检查数据格式是否正确

3. **界面显示异常**
   - 确认Pinia store状态是否正确
   - 检查组件响应式数据绑定
   - 验证数据类型匹配

### 调试技巧
- 打开浏览器开发者工具查看Console日志
- 检查Application → Local Storage中的数据
- 使用Network面板查看API请求状态

---

**注意**: 本系统专为演示和开发环境设计，生产环境建议使用真实的后端API和数据库系统。