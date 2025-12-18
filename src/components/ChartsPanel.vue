<template>
  <div class="charts-panel">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-card event-chart">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon pie-icon"><PieChart /></el-icon>
              <h4>事件类型分布</h4>
            </div>
          </template>
          <div ref="eventTypeChart" class="chart"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="chart-card district-chart">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon bar-icon"><Histogram /></el-icon>
              <h4>区域分布</h4>
            </div>
          </template>
          <div ref="districtChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { EChartsType } from 'echarts'
import { PieChart, Histogram } from '@element-plus/icons-vue'

const props = defineProps<{
  statistics: {
    eventTypes: Array<{ name: string; value: number }>,
    sensorTypes: Array<{ name: string; value: number }>
    districtDistribution: Array<{ name: string; value: number }>
    sensorDistricts: Array<{ name: string; value: number }>
  }
  viewMode: string
}>()

const eventTypeChart = ref<HTMLElement>()
const districtChart = ref<HTMLElement>()
let eventTypeChartInstance: EChartsType | null = null
let districtChartInstance: EChartsType | null = null

function initCharts() {
  if (eventTypeChart.value && districtChart.value) {
    eventTypeChartInstance = echarts.init(eventTypeChart.value)
    districtChartInstance = echarts.init(districtChart.value)
    updateCharts()
  }
}

function updateCharts() {
  if (eventTypeChartInstance && props.statistics.eventTypes.length > 0) {
    const eventOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        top: 20
      },
      color: [
        '#FF5252', // 鲜红色
        '#FF6E40', // 橙红色
        '#FFD740', // 金黄色
        '#69F0AE', // 荧光绿
        '#40C4FF', // 亮蓝色
        '#7C4DFF', // 紫罗兰
        '#F50057', // 深粉色
        '#00E676', // 鲜绿色
        '#2979FF', // 蔚蓝色
        '#FF6ACC', // 玫红色
        '#FFAB40', // 琥珀色
        '#E040FB'  // 洋红色
      ],
      series: [
        {
          name: '事件类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: props.viewMode == 'merged' ? [...props.statistics.eventTypes, ...props.statistics.sensorTypes] : props.viewMode == 'events' ?  props.statistics.eventTypes : props.statistics.sensorTypes
        }
      ]
    }

    eventTypeChartInstance.setOption(eventOption)
  }

  if (districtChartInstance && props.statistics.districtDistribution.length > 0) {
    const districtOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: props.statistics.districtDistribution.map(item => item.name)
      },
      series: [
        {
          name: '事件数量',
          type: 'bar',
          data: props.viewMode == 'events' ? props.statistics.districtDistribution.map(item => item.value) : props.statistics.sensorDistricts.map(item => item.value),
          itemStyle: {
            color: function(params: any) {
              const colorList = [
                '#FF6B35', // 橙红色
                '#F7931E', // 橙色
                '#FFC107', // 琥珀色
                '#8BC34A', // 浅绿色
                '#4CAF50', // 绿色
                '#00BCD4', // 青色
                '#2196F3', // 蓝色
                '#3F51B5', // 靛蓝色
                '#9C27B0', // 紫色
                '#E91E63', // 粉红色
                '#F44336', // 红色
                '#795548'  // 棕色
              ]
              return colorList[params.dataIndex % colorList.length]
            }
          }
        }
      ]
    }

    districtChartInstance.setOption(districtOption)
  }
}

watch(() => props.statistics, () => {
  nextTick(() => {
    updateCharts()
  })
}, { deep: true })
watch(() => props.viewMode, () => {
  nextTick(() => {
    console.log('val--', props.viewMode)
    updateCharts()
  })
}, { deep: true })
onMounted(() => {
  nextTick(() => {
    console.log("props.statistics.districtDistribution--", props.statistics.districtDistribution)
    initCharts()
  })

  window.addEventListener('resize', () => {
    eventTypeChartInstance?.resize()
    districtChartInstance?.resize()
  })
})
</script>

<style scoped>
.charts-panel {
  margin-bottom: 30px;
}

.chart-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  overflow: hidden;
}

.chart-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.chart-card :deep(.el-card__header) {
  padding: 16px 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-header h4 {
  margin: 0;
  font-weight: 600;
  font-size: 16px;
}

.header-icon {
  font-size: 20px;
}

.pie-icon {
  color: #722ed1;
}

.bar-icon {
  color: #1890ff;
}

.chart {
  width: 100%;
  height: 300px;
  padding: 10px;
}
</style>