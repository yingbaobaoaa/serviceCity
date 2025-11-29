<template>
  <div class="dashboard-view">
    <div class="dashboard-header">
      <h1 class="dashboard-title">智慧城市运行态势大屏</h1>
      <div class="header-right">
        <div class="current-time">{{ currentTime }}</div>
        <el-button
          type="primary"
          size="small"
          circle
          @click="goBack"
          class="back-btn-icon"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- 顶部指标卡片 -->
      <div class="top-metrics">
        <div class="metric-card">
          <div class="metric-title">今日事件数</div>
          <div class="metric-value">{{ todayEvents }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">异常设备数</div>
          <div class="metric-value">{{ abnormalDevices }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">高优先级问题</div>
          <div class="metric-value">{{ highPriorityIssues }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">平均响应时长</div>
          <div class="metric-value">{{ avgResponseTime }}</div>
        </div>
      </div>

      <!-- 主体内容区域 -->
      <div class="main-content">
        <!-- 左侧地图/热力图 -->
        <div class="left-panel">
          <div class="panel-title">问题热力图</div>
          <div ref="heatmapChart" class="heatmap-chart"></div>
        </div>

        <!-- 右侧图表 -->
        <div class="right-panel">
          <div class="chart-container">
            <div class="panel-title">问题类型分布</div>
            <div ref="pieChart" class="chart"></div>
          </div>
          <div class="chart-container">
            <div class="panel-title">7天趋势</div>
            <div ref="lineChart" class="chart"></div>
          </div>
        </div>
      </div>

      <!-- 底部实时事件流 -->
      <div class="bottom-panel">
        <div class="panel-title">实时事件流</div>
        <div class="event-stream">
          <div
            v-for="event in realTimeEvents"
            :key="event.id"
            class="event-item"
            :class="{ 'new-event': event.isNew }"
          >
            <span class="event-time">{{ formatTime(event.displayTime) }}</span>
            <span class="event-type">{{ event.type }}</span>
            <span class="event-location">{{ event.location.district }}</span>
            <span v-if="event.isNew" class="new-badge">NEW</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { ArrowLeft } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'
import type { CityEvent, SensorData } from '@/types'

const router = useRouter()
const dataStore = useDataStore()

const currentTime = ref('')
const todayEvents = ref(0)
const abnormalDevices = ref(0)
const highPriorityIssues = ref(0)
const avgResponseTime = ref('2.5小时')

const heatmapChart = ref<HTMLElement>()
const pieChart = ref<HTMLElement>()
const lineChart = ref<HTMLElement>()

let heatmapInstance: EChartsType | null = null
let pieInstance: EChartsType | null = null
let lineInstance: EChartsType | null = null

const realTimeEvents = ref<Array<(CityEvent | SensorData) & { dataType: string; displayTime: string; isNew: boolean }>>([])

let timeInterval: any = null
let dataUpdateInterval: any = null
let scrollInterval: any = null
let heatmapUpdateInterval: any = null
let pieUpdateInterval: any = null
let lineUpdateInterval: any = null

onMounted(async () => {
  dataStore.loadFromStorage()
  updateMetrics()
  startClock()
  startDataSimulation()

  await nextTick()
  initCharts()
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  if (dataUpdateInterval) clearInterval(dataUpdateInterval)
  if (scrollInterval) clearInterval(scrollInterval)
  if (heatmapUpdateInterval) clearInterval(heatmapUpdateInterval)
  if (pieUpdateInterval) clearInterval(pieUpdateInterval)
  if (lineUpdateInterval) clearInterval(lineUpdateInterval)

  heatmapInstance?.dispose()
  pieInstance?.dispose()
  lineInstance?.dispose()
})

function startClock() {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
}

function updateTime() {
  currentTime.value = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function updateMetrics() {
  todayEvents.value = dataStore.events.length
  abnormalDevices.value = dataStore.sensors.filter(s => s.status === '异常').length
  highPriorityIssues.value = Math.floor(dataStore.events.length * 0.3)
}

function startDataSimulation() {
  // 初始化事件流
  realTimeEvents.value = dataStore.mergedData.slice(0, 10).map(item => ({
    ...item,
    isNew: false
  }))

  // 每10秒模拟新增事件
  dataUpdateInterval = setInterval(() => {
    simulateNewEvent()
  }, 10000)

  // 启动自动滚动
  startAutoScroll()
}

function simulateNewEvent() {
  const types = ['道路积水', '路灯故障', '噪音扰民', '占道经营', '井盖缺失']
  const districts = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区']

  const newEvent = {
    id: `SIM${Date.now()}`,
    type: types[Math.floor(Math.random() * types.length)],
    location: {
      district: districts[Math.floor(Math.random() * districts.length)],
      street: '模拟街道',
      lat: 39.9 + Math.random() * 0.1,
      lng: 116.4 + Math.random() * 0.1
    },
    description: '模拟生成的实时事件',
    displayTime: new Date().toISOString(),
    dataType: 'event' as const,
    isNew: true
  }

  realTimeEvents.value.unshift(newEvent)
  if (realTimeEvents.value.length > 20) {
    realTimeEvents.value.pop()
  }

  // 3秒后移除NEW标记
  setTimeout(() => {
    const event = realTimeEvents.value.find(e => e.id === newEvent.id)
    if (event) event.isNew = false
  }, 3000)

  // 更新指标
  todayEvents.value++
}

function initCharts() {
  if (heatmapChart.value && pieChart.value && lineChart.value) {
    initHeatmap()
    initPieChart()
    initLineChart()
    startChartUpdates()
  }
}

function initHeatmap() {
  if (!heatmapChart.value) return

  heatmapInstance = echarts.init(heatmapChart.value)

  const option = {
    tooltip: {
      position: 'top'
    },
    grid: {
      height: '70%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      data: ['朝阳区', '海淀区', '东城区', '西城区', '丰台区'],
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#fff'
      }
    },
    yAxis: {
      type: 'category',
      data: ['道路积水', '路灯故障', '噪音扰民', '占道经营'],
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#fff'
      }
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '5%',
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      },
      textStyle: {
        color: '#fff'
      }
    },
    series: [{
      name: '问题数量',
      type: 'heatmap',
      data: generateHeatmapData(),
      label: {
        show: true,
        color: '#fff'
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }

  heatmapInstance.setOption(option)
}

function initPieChart() {
  if (!pieChart.value) return

  pieInstance = echarts.init(pieChart.value)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      textStyle: {
        color: '#fff'
      }
    },
    series: [
      {
        name: '问题类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['80%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold',
            color: '#fff'
          }
        },
        labelLine: {
          show: false
        },
        data: dataStore.statistics.eventTypes.length > 0
          ? dataStore.statistics.eventTypes
          : [
              { value: 5, name: '道路积水' },
              { value: 3, name: '路灯故障' },
              { value: 8, name: '噪音扰民' },
              { value: 2, name: '占道经营' }
            ]
      }
    ]
  }

  pieInstance.setOption(option)
}

function initLineChart() {
  if (!lineChart.value) return

  lineInstance = echarts.init(lineChart.value)

  const dates = []
  const values = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }))
    values.push(Math.floor(Math.random() * 20) + 10)
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '10%',
      top: '10%'
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        color: '#fff'
      },
      axisLine: {
        lineStyle: {
          color: '#fff'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#fff'
      },
      axisLine: {
        lineStyle: {
          color: '#fff'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
    series: [
      {
        name: '事件数量',
        type: 'line',
        smooth: true,
        data: values,
        itemStyle: {
          color: '#409eff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: 'rgba(64, 158, 255, 0.3)'
            }, {
              offset: 1, color: 'rgba(64, 158, 255, 0.1)'
            }]
          }
        }
      }
    ]
  }

  lineInstance.setOption(option)
}

function generateHeatmapData() {
  const data = []
  const districts = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区']
  const types = ['道路积水', '路灯故障', '噪音扰民', '占道经营']

  for (let i = 0; i < districts.length; i++) {
    for (let j = 0; j < types.length; j++) {
      data.push([i, j, Math.floor(Math.random() * 10)])
    }
  }

  return data
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function goBack() {
  router.push('/')
}

function startAutoScroll() {
  // 每2秒向下滚动一个事件项的高度
  scrollInterval = setInterval(() => {
    const eventStream = document.querySelector('.event-stream') as HTMLElement
    if (eventStream && realTimeEvents.value.length > 6) {
      const firstEvent = eventStream.querySelector('.event-item') as HTMLElement
      const eventHeight = firstEvent ? firstEvent.offsetHeight : 30

      // 如果已经滚动到底部，重置到顶部
      if (eventStream.scrollTop + eventStream.clientHeight >= eventStream.scrollHeight - eventHeight) {
        eventStream.scrollTop = 0
      } else {
        eventStream.scrollTop += eventHeight
      }
    }
  }, 2000) // 每2秒滚动一次
}

function startChartUpdates() {
  // 热力图每15秒更新一次
  heatmapUpdateInterval = setInterval(() => {
    updateHeatmapData()
  }, 15000)

  // 饼图每20秒更新一次
  pieUpdateInterval = setInterval(() => {
    updatePieChartData()
  }, 20000)

  // 7天趋势图每30秒更新一次
  lineUpdateInterval = setInterval(() => {
    updateLineChartData()
  }, 30000)
}

function updateHeatmapData() {
  if (!heatmapInstance) return

  // 模拟热力图数据变化
  const newData = generateHeatmapData()
  heatmapInstance.setOption({
    series: [{
      data: newData
    }]
  })
}

function updatePieChartData() {
  if (!pieInstance) return

  // 模拟问题类型分布数据变化
  const problemTypes = ['道路积水', '路灯故障', '噪音扰民', '占道经营', '井盖缺失', '垃圾处理']
  const newData = problemTypes.map(type => ({
    value: Math.floor(Math.random() * 15) + 1,
    name: type
  }))

  pieInstance.setOption({
    series: [{
      data: newData
    }]
  })
}

function updateLineChartData() {
  if (!lineInstance) return

  // 获取最近7天的日期
  const dates = []
  const values = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }))
    // 模拟趋势数据，带有一定的增长趋势
    const baseValue = 15
    const trendValue = Math.floor(Math.random() * 10) + baseValue + (6 - i) * 2
    values.push(trendValue)
  }

  lineInstance.setOption({
    xAxis: {
      data: dates
    },
    series: [{
      data: values
    }]
  })
}
</script>

<style scoped>
.dashboard-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 15% 25%, rgba(0, 180, 255, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 85% 75%, rgba(0, 120, 255, 0.2) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(0, 80, 200, 0.15) 0%, transparent 60%),
    linear-gradient(135deg, #001233 0%, #001845 20%, #002855 40%, #003566 60%, #004080 80%, #0052cc 100%);
  color: white;
  overflow: hidden;
  position: relative;
}

.dashboard-view::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  animation: grid-move 20s linear infinite;
  pointer-events: none;
}

.dashboard-view::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 50% 0%, rgba(0, 180, 255, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 0% 100%, rgba(0, 220, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 100% 0%, rgba(0, 150, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

@keyframes grid-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 50px 50px;
  }
}

.back-button {
  position: fixed;
  top: 20px;
  right: 40px;
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 100;
}

.back-btn {
  background: linear-gradient(135deg, rgba(0, 120, 255, 0.8) 0%, rgba(0, 180, 255, 0.6) 100%);
  border: 1px solid rgba(0, 180, 255, 0.5);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 120, 255, 0.3);
}

.back-btn:hover {
  background: linear-gradient(135deg, rgba(0, 150, 255, 0.9) 0%, rgba(0, 200, 255, 0.7) 100%);
  box-shadow: 0 6px 25px rgba(0, 150, 255, 0.5);
  transform: translateY(-2px);
}

.back-btn:active {
  transform: translateY(0);
}

.current-time {
  font-size: 16px;
  font-weight: 300;
  color: #00b4d8;
  text-shadow: 0 0 15px rgba(0, 180, 216, 0.6), 0 0 30px rgba(0, 180, 216, 0.3);
  font-family: 'Monaco', 'Courier New', monospace;
  letter-spacing: 1px;
  background: rgba(0, 20, 40, 0.6);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(0, 180, 216, 0.3);
  backdrop-filter: blur(10px);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: linear-gradient(90deg, rgba(0, 20, 40, 0.8) 0%, rgba(0, 40, 80, 0.6) 50%, rgba(0, 20, 40, 0.8) 100%);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(0, 180, 255, 0.3);
}

.dashboard-title {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  background: linear-gradient(45deg, #00f5ff, #00b4d8, #0077b6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(0, 180, 216, 0.5);
  letter-spacing: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn-icon {
  background: linear-gradient(135deg, rgba(0, 120, 255, 0.8) 0%, rgba(0, 180, 255, 0.6) 100%);
  border: 1px solid rgba(0, 180, 255, 0.5);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 120, 255, 0.3);
  width: 40px;
  height: 40px;
}

.back-btn-icon:hover {
  background: linear-gradient(135deg, rgba(0, 150, 255, 0.9) 0%, rgba(0, 200, 255, 0.7) 100%);
  box-shadow: 0 6px 25px rgba(0, 150, 255, 0.5);
  transform: translateY(-2px);
}

.back-btn-icon:active {
  transform: translateY(0);
}

.dashboard-content {
  padding: 20px 40px;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow: hidden;
}

.top-metrics {
  display: flex;
  gap: 15px;
  justify-content: space-between;
  margin-bottom: 15px;
}

.metric-card {
  flex: 1;
  background: linear-gradient(135deg, rgba(0, 120, 255, 0.15) 0%, rgba(0, 80, 200, 0.08) 100%);
  border: 1px solid rgba(0, 180, 255, 0.4);
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  backdrop-filter: blur(15px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 150, 255, 0.4);
  border-color: rgba(0, 200, 255, 0.6);
}

.metric-card:hover::before {
  left: 100%;
}

.metric-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 30px;
  font-weight: bold;
  background: linear-gradient(45deg, #00b4d8, #0077b6, #03045e);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(0, 180, 216, 0.6);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    text-shadow: 0 0 20px rgba(0, 180, 216, 0.6);
    transform: scale(1);
  }
  50% {
    text-shadow: 0 0 30px rgba(0, 180, 216, 0.8), 0 0 60px rgba(0, 180, 216, 0.4);
    transform: scale(1.02);
  }
}

.main-content {
  flex: 1;
  display: flex;
  gap: 15px;
  min-height: 0;
}

.left-panel {
  flex: 2;
  background: linear-gradient(135deg, rgba(0, 40, 80, 0.6) 0%, rgba(0, 60, 120, 0.4) 100%);
  border: 1px solid rgba(0, 180, 255, 0.3);
  border-radius: 12px;
  padding: 15px;
  backdrop-filter: blur(15px);
  position: relative;
  overflow: hidden;
}

.left-panel::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #00b4d8, transparent, #0077b6, transparent);
  border-radius: 12px;
  opacity: 0.4;
  animation: border-rotate 10s linear infinite;
  z-index: -1;
}

@keyframes border-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chart-container {
  flex: 1;
  background: linear-gradient(135deg, rgba(0, 60, 120, 0.6) 0%, rgba(0, 40, 80, 0.4) 100%);
  border: 1px solid rgba(0, 180, 255, 0.4);
  border-radius: 12px;
  padding: 15px;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chart-container:hover {
  box-shadow: 0 0 30px rgba(0, 180, 255, 0.3);
  border-color: rgba(0, 200, 255, 0.6);
}

.bottom-panel {
  height: 160px;
  background: linear-gradient(135deg, rgba(0, 30, 60, 0.7) 0%, rgba(0, 50, 100, 0.5) 100%);
  border: 1px solid rgba(0, 180, 255, 0.3);
  border-radius: 12px;
  padding: 15px;
  backdrop-filter: blur(15px);
  position: relative;
  overflow: hidden;
}

.bottom-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.6), rgba(0, 180, 255, 0.8), rgba(0, 255, 255, 0.6));
  animation: data-flow 2s linear infinite;
}

@keyframes data-flow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.panel-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #00f5ff, #00b4d8, #0077b6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(0, 180, 216, 0.5);
  position: relative;
}

.panel-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 50px;
  height: 2px;
  background: linear-gradient(90deg, #00f5ff, transparent);
  animation: title-underline 2s ease-in-out infinite;
}

@keyframes title-underline {
  0%, 100% { width: 30px; opacity: 0.6; }
  50% { width: 60px; opacity: 1; }
}

.heatmap-chart {
  width: 100%;
  height: calc(100% - 30px);
}

.chart {
  width: 100%;
  height: calc(100% - 30px);
}

.event-stream {
  height: calc(100% - 30px);
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  scroll-behavior: smooth;
 
}
::-webkit-scrollbar {
  display: none;
}
.event-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 14px;
  gap: 15px;
}

.event-item.new-event {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.3) 0%, rgba(255, 158, 64, 0.2) 100%);
  animation: new-event-pulse 2s ease-in-out;
  position: relative;
}

.event-item.new-event::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #00ff88;
  border-radius: 50%;
  box-shadow: 0 0 15px #00ff88;
  animation: blink-indicator 1s ease-in-out infinite;
}

@keyframes new-event-pulse {
  0% {
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.5) 0%, rgba(255, 158, 64, 0.4) 100%);
    transform: translateX(10px);
  }
  50% {
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.3) 0%, rgba(255, 158, 64, 0.2) 100%);
    transform: translateX(0);
  }
  100% {
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.5) 0%, rgba(255, 158, 64, 0.4) 100%);
    transform: translateX(0);
  }
}

@keyframes blink-indicator {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.event-time {
  color: #409eff;
  min-width: 60px;
}

.event-type {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
}

.event-location {
  color: #67c23a;
  min-width: 80px;
}

.new-badge {
  background: linear-gradient(45deg, #f56c6c, #ff9e44);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  animation: new-badge-glow 1s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.new-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: badge-sweep 2s linear infinite;
}

@keyframes new-badge-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(245, 108, 108, 0.6);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 20px rgba(245, 108, 108, 0.8), 0 0 30px rgba(245, 108, 108, 0.4);
    transform: scale(1.05);
  }
}

@keyframes badge-sweep {
  0% { left: -100%; }
  100% { left: 100%; }
}
</style>