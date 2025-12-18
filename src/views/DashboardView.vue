<template>
  <div class="dashboard-view">
    <!-- 动态粒子背景 -->
    <div class="particles-container">
      <div v-for="n in 50" :key="n" class="particle" :style="getParticleStyle(n)"></div>
    </div>

    <!-- 网格背景 -->
    <div class="grid-background"></div>

    <!-- 动态光效 -->
    <div class="light-effects">
      <div class="light-beam light-beam-1"></div>
      <div class="light-beam light-beam-2"></div>
      <div class="light-beam light-beam-3"></div>
    </div>

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

  // 添加进入动画
  addEntranceAnimations()

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

  // 播放提示音（如果浏览器支持）
  playNotificationSound()
}

// 进入动画
function addEntranceAnimations() {
  const elements = document.querySelectorAll('.metric-card, .left-panel, .chart-container, .bottom-panel')
  elements.forEach((el, index) => {
    el.classList.add('entrance-animation')
    ;(el as HTMLElement).style.animationDelay = `${index * 0.1}s`
  })
}

// 播放提示音
function playNotificationSound() {
  try {
    // 创建一个简单的提示音
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (error) {
    console.log('音频API不支持')
  }
}

// 鼠标悬停音效
function playHoverSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.value = 600
    oscillator.type = 'triangle'

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.05)
  } catch (error) {
    console.log('音频API不支持')
  }
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

// 生成粒子样式
function getParticleStyle(index: number) {
  const size = Math.random() * 3 + 1
  const opacity = Math.random() * 0.8 + 0.2
  const delay = Math.random() * 20
  const duration = Math.random() * 30 + 20
  const x = Math.random() * 100
  const y = Math.random() * 100

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${x}%`,
    top: `${y}%`,
    opacity,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`
  }
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
    radial-gradient(circle at 15% 25%, rgba(0, 180, 255, 0.3) 0%, transparent 40%),
    radial-gradient(circle at 85% 75%, rgba(0, 120, 255, 0.3) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(0, 80, 200, 0.2) 0%, transparent 60%),
    radial-gradient(ellipse at 20% 80%, rgba(0, 220, 255, 0.2) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(0, 150, 255, 0.2) 0%, transparent 50%),
    linear-gradient(135deg, #001233 0%, #001845 15%, #002855 30%, #003566 50%, #004080 70%, #0052cc 100%);
  color: white;
  overflow: hidden;
  position: relative;
}

/* 粒子容器 */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.particle {
  position: absolute;
  background: radial-gradient(circle, rgba(0, 255, 255, 0.8) 0%, rgba(0, 180, 255, 0.4) 50%, transparent 70%);
  border-radius: 50%;
  animation: particle-float linear infinite;
  box-shadow: 0 0 6px rgba(0, 255, 255, 0.6);
}

@keyframes particle-float {
  0% {
    transform: translateY(100vh) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translateY(80vh) translateX(-10px) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translateY(50vh) translateX(10px) scale(1.2);
  }
  90% {
    opacity: 0.3;
    transform: translateY(10vh) translateX(-5px) scale(0.8);
  }
  100% {
    transform: translateY(-10vh) translateX(0) scale(0);
    opacity: 0;
  }
}

/* 网格背景 */
.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 30px 30px;
  animation: grid-move 15s linear infinite;
  pointer-events: none;
}

/* 动态光效 */
.light-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.light-beam {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
  transform-origin: top center;
  animation: light-sweep linear infinite;
}

.light-beam-1 {
  width: 2px;
  height: 100%;
  left: 20%;
  animation-duration: 8s;
  animation-delay: 0s;
}

.light-beam-2 {
  width: 3px;
  height: 80%;
  left: 50%;
  animation-duration: 10s;
  animation-delay: 2s;
}

.light-beam-3 {
  width: 2px;
  height: 120%;
  left: 80%;
  animation-duration: 12s;
  animation-delay: 4s;
}

@keyframes light-sweep {
  0% {
    transform: rotate(-45deg) translateY(-100%);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: rotate(-45deg) translateY(100vh);
    opacity: 0;
  }
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
  background:
    linear-gradient(135deg, rgba(0, 120, 255, 0.2) 0%, rgba(0, 80, 200, 0.1) 100%),
    radial-gradient(circle at center, rgba(0, 200, 255, 0.1) 0%, transparent 70%);
  border: 1px solid rgba(0, 180, 255, 0.5);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transition: left 0.6s;
}

.metric-card::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(0, 255, 255, 0.2), transparent, rgba(0, 180, 255, 0.2), transparent);
  animation: metric-rotate 8s linear infinite;
  opacity: 0;
  transition: opacity 0.3s;
}

.metric-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow:
    0 15px 40px rgba(0, 150, 255, 0.5),
    0 0 60px rgba(0, 180, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(0, 200, 255, 0.8);
  background:
    linear-gradient(135deg, rgba(0, 120, 255, 0.3) 0%, rgba(0, 80, 200, 0.2) 100%),
    radial-gradient(circle at center, rgba(0, 200, 255, 0.2) 0%, transparent 70%);
}

.metric-card:hover::before {
  left: 100%;
}

.metric-card:hover::after {
  opacity: 1;
}

.metric-card:nth-child(1) {
  animation: metric-float-1 4s ease-in-out infinite;
}

.metric-card:nth-child(2) {
  animation: metric-float-2 4s ease-in-out infinite 0.5s;
}

.metric-card:nth-child(3) {
  animation: metric-float-3 4s ease-in-out infinite 1s;
}

.metric-card:nth-child(4) {
  animation: metric-float-4 4s ease-in-out infinite 1.5s;
}

@keyframes metric-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes metric-float-1 {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
}

@keyframes metric-float-2 {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-2px); }
}

@keyframes metric-float-3 {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}

@keyframes metric-float-4 {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-1px); }
}

.metric-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.metric-value {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(45deg, #00f5ff, #00b4d8, #0077b6, #03045e);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 30px rgba(0, 180, 216, 0.8);
  animation:
    pulse-glow 3s ease-in-out infinite,
    gradient-shift 4s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes pulse-glow {
  0%, 100% {
    filter: brightness(1) drop-shadow(0 0 20px rgba(0, 180, 216, 0.6));
    transform: scale(1);
  }
  50% {
    filter: brightness(1.2) drop-shadow(0 0 40px rgba(0, 180, 216, 0.8));
    transform: scale(1.05);
  }
}

.main-content {
  flex: 1;
  display: flex;
  gap: 15px;
  min-height: 0;
  max-height: calc(100vh - 490px);
}

.left-panel {
  flex: 2;
  background:
    linear-gradient(135deg, rgba(0, 40, 80, 0.7) 0%, rgba(0, 60, 120, 0.5) 100%),
    radial-gradient(circle at center, rgba(0, 200, 255, 0.1) 0%, transparent 70%);
  border: 1px solid rgba(0, 180, 255, 0.4);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
}

.left-panel::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(45deg, #00f5ff, transparent, #0077b6, transparent, #00f5ff);
  border-radius: 16px;
  opacity: 0.3;
  animation: border-rotate 12s linear infinite;
  z-index: -1;
}

.left-panel::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(0, 150, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.left-panel:hover {
  transform: translateY(-2px);
  box-shadow:
    0 20px 50px rgba(0, 150, 255, 0.4),
    0 0 80px rgba(0, 180, 255, 0.2);
  border-color: rgba(0, 200, 255, 0.7);
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
  background:
    linear-gradient(135deg, rgba(0, 60, 120, 0.7) 0%, rgba(0, 40, 80, 0.5) 100%),
    radial-gradient(circle at center, rgba(0, 200, 255, 0.1) 0%, transparent 70%);
  border: 1px solid rgba(0, 180, 255, 0.4);
  border-radius: 16px;
  padding: 18px;
  backdrop-filter: blur(15px);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(0, 255, 255, 0.1), transparent, rgba(0, 180, 255, 0.1), transparent);
  animation: chart-rotate 15s linear infinite;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: -1;
}

.chart-container:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow:
    0 15px 40px rgba(0, 150, 255, 0.4),
    0 0 60px rgba(0, 180, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(0, 200, 255, 0.8);
}

.chart-container:hover::before {
  opacity: 1;
}

@keyframes chart-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 加载动画 */
.chart-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 180, 255, 0.2);
  border-top: 3px solid #00f5ff;
  border-radius: 50%;
  animation: loading-spin 1s linear infinite;
}

@keyframes loading-spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.bottom-panel {
  height: 180px;
  background:
    linear-gradient(135deg, rgba(0, 30, 60, 0.8) 0%, rgba(0, 50, 100, 0.6) 100%),
    radial-gradient(circle at center, rgba(0, 200, 255, 0.1) 0%, transparent 70%);
  border: 1px solid rgba(0, 180, 255, 0.4);
  border-radius: 16px;
  padding: 18px;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
}

.bottom-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.8), transparent);
  animation: data-flow 3s linear infinite;
}

.bottom-panel::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
  animation: data-flow-reverse 2.5s linear infinite reverse;
}

.bottom-panel:hover {
  transform: translateY(-2px);
  box-shadow:
    0 10px 30px rgba(0, 150, 255, 0.3),
    0 0 50px rgba(0, 180, 255, 0.2);
  border-color: rgba(0, 200, 255, 0.7);
}

@keyframes data-flow {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes data-flow-reverse {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
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
  position: relative;
}

.event-stream::-webkit-scrollbar {
  width: 4px;
  height: 0;
}

.event-stream::-webkit-scrollbar-track {
  background: rgba(0, 180, 255, 0.1);
  border-radius: 2px;
}

.event-stream::-webkit-scrollbar-thumb {
  background: linear-gradient(45deg, #00f5ff, #0077b6);
  border-radius: 2px;
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.5);
}

.event-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 14px;
  gap: 15px;
  transition: all 0.3s ease;
  position: relative;
  backdrop-filter: blur(5px);
  border-radius: 8px;
  margin-bottom: 2px;
}

.event-item:hover {
  background: linear-gradient(90deg, rgba(0, 180, 255, 0.15) 0%, rgba(0, 120, 255, 0.1) 100%);
  transform: translateX(5px);
  box-shadow: 0 2px 10px rgba(0, 180, 255, 0.2);
  border-color: rgba(0, 200, 255, 0.3);
}

.event-item.new-event {
  background: linear-gradient(90deg,
    rgba(0, 255, 255, 0.25) 0%,
    rgba(0, 180, 255, 0.2) 25%,
    rgba(255, 158, 64, 0.15) 75%,
    rgba(255, 200, 0, 0.1) 100%);
  animation: new-event-pulse 3s ease-in-out;
  border-left: 3px solid #00ff88;
  position: relative;
}

.event-item.new-event::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #00ff88 0%, #00cc6a 50%, transparent 70%);
  border-radius: 50%;
  box-shadow:
    0 0 20px #00ff88,
    0 0 40px #00ff88,
    inset 0 0 10px #00ff88;
  animation: blink-indicator 1.5s ease-in-out infinite;
}

.event-item.new-event::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
  animation: event-sweep 2s linear infinite;
}

@keyframes new-event-pulse {
  0% {
    background: linear-gradient(90deg,
      rgba(0, 255, 255, 0.4) 0%,
      rgba(0, 180, 255, 0.3) 25%,
      rgba(255, 158, 64, 0.25) 75%,
      rgba(255, 200, 0, 0.2) 100%);
    transform: translateX(15px) scale(1.02);
  }
  25% {
    background: linear-gradient(90deg,
      rgba(0, 255, 255, 0.3) 0%,
      rgba(0, 180, 255, 0.25) 25%,
      rgba(255, 158, 64, 0.2) 75%,
      rgba(255, 200, 0, 0.15) 100%);
    transform: translateX(0) scale(1);
  }
  50% {
    background: linear-gradient(90deg,
      rgba(0, 255, 255, 0.35) 0%,
      rgba(0, 180, 255, 0.28) 25%,
      rgba(255, 158, 64, 0.22) 75%,
      rgba(255, 200, 0, 0.18) 100%);
    transform: translateX(0) scale(1.01);
  }
  75% {
    background: linear-gradient(90deg,
      rgba(0, 255, 255, 0.25) 0%,
      rgba(0, 180, 255, 0.2) 25%,
      rgba(255, 158, 64, 0.15) 75%,
      rgba(255, 200, 0, 0.1) 100%);
    transform: translateX(0) scale(1);
  }
  100% {
    background: linear-gradient(90deg,
      rgba(0, 255, 255, 0.2) 0%,
      rgba(0, 180, 255, 0.15) 25%,
      rgba(255, 158, 64, 0.1) 75%,
      rgba(255, 200, 0, 0.05) 100%);
    transform: translateX(0) scale(1);
  }
}

@keyframes blink-indicator {
  0%, 100% {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
  25% {
    opacity: 0.7;
    transform: translateY(-50%) scale(1.2);
  }
  50% {
    opacity: 1;
    transform: translateY(-50%) scale(0.8);
  }
  75% {
    opacity: 0.9;
    transform: translateY(-50%) scale(1.1);
  }
}

@keyframes event-sweep {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.event-time {
  color: #00f5ff;
  min-width: 65px;
  font-weight: 500;
  text-shadow: 0 0 8px rgba(0, 245, 255, 0.5);
  animation: time-pulse 2s ease-in-out infinite;
}

.event-type {
  flex: 1;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
  position: relative;
  transition: color 0.3s ease;
}

.event-location {
  color: #67c23a;
  min-width: 85px;
  font-weight: 500;
  text-shadow: 0 0 6px rgba(103, 194, 58, 0.4);
}

.new-badge {
  background: linear-gradient(45deg, #f56c6c, #ff9e44, #ff6b6b);
  color: white;
  padding: 3px 10px;
  border-radius: 15px;
  font-size: 11px;
  font-weight: bold;
  animation: new-badge-glow 1.5s ease-in-out infinite;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(245, 108, 108, 0.4);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.new-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: badge-sweep 2.5s linear infinite;
}

.new-badge::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: badge-rotate 3s linear infinite;
}

@keyframes time-pulse {
  0%, 100% {
    opacity: 1;
    text-shadow: 0 0 8px rgba(0, 245, 255, 0.5);
  }
  50% {
    opacity: 0.8;
    text-shadow: 0 0 15px rgba(0, 245, 255, 0.8);
  }
}

@keyframes new-badge-glow {
  0%, 100% {
    box-shadow: 0 2px 10px rgba(245, 108, 108, 0.4), 0 0 20px rgba(245, 108, 108, 0.3);
    transform: scale(1);
  }
  25% {
    box-shadow: 0 3px 15px rgba(245, 108, 108, 0.6), 0 0 25px rgba(245, 108, 108, 0.4);
    transform: scale(1.05);
  }
  50% {
    box-shadow: 0 4px 20px rgba(245, 108, 108, 0.8), 0 0 35px rgba(245, 108, 108, 0.5);
    transform: scale(1.08);
  }
  75% {
    box-shadow: 0 3px 15px rgba(245, 108, 108, 0.6), 0 0 25px rgba(245, 108, 108, 0.4);
    transform: scale(1.05);
  }
}

@keyframes badge-sweep {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes badge-rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 进入动画 */
.entrance-animation {
  opacity: 1;
  transform: translateY(30px) scale(0.9);
  animation: entrance-fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes entrance-fade-in {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
    filter: blur(10px);
  }
  50% {
    opacity: 0.5;
    transform: translateY(15px) scale(0.95);
    filter: blur(5px);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* 特殊进入效果 */
.metric-card.entrance-animation {
  /* animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); */
}

.left-panel.entrance-animation {
  animation-duration: 0.8s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.chart-container.entrance-animation {
  animation-duration: 0.7s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.bottom-panel.entrance-animation {
  animation-duration: 0.9s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* 闪烁效果 */
@keyframes data-pulse {
  0%, 100% {
    background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.05), transparent);
  }
  50% {
    background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
  }
}

/* 为标题添加动态光效 */
.dashboard-title::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -100%;
  width: 100%;
  height: calc(100% + 4px);
  background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
  animation: title-sweep 4s ease-in-out infinite;
}

@keyframes title-sweep {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}
</style>