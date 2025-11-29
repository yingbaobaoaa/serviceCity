<template>
  <div class="charts-panel">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>事件类型分布</h4>
          </template>
          <div ref="eventTypeChart" class="chart"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <h4>区域分布</h4>
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

const props = defineProps<{
  statistics: {
    eventTypes: Array<{ name: string; value: number }>
    districtDistribution: Array<{ name: string; value: number }>
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
          data: props.statistics.eventTypes
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
          data: props.statistics.districtDistribution.map(item => item.value),
          itemStyle: {
            color: '#409eff'
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

onMounted(() => {
  nextTick(() => {
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

.chart {
  width: 100%;
  height: 300px;
}
</style>