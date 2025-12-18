<template>
  <div class="hotspots-panel">
    <el-table :data="hotspots" stripe>
      <el-table-column label="排名" width="60">
        <template #default="{ $index }">
          <el-tag :type="getRankType($index)">{{ $index + 1 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="区域位置" min-width="200" />
      <el-table-column prop="eventCount" label="事件数量" width="100" />
      <el-table-column prop="abnormalSensorCount" label="异常传感器" width="120" />
      <el-table-column prop="totalScore" label="综合评分" width="100">
        <template #default="{ row }">
          <el-progress
            :percentage="Math.min((row.totalScore / 20) * 100, 100)"
            :color="getScoreColor(row.totalScore)"
            :stroke-width="6"
          />
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="hotspots.length === 0" description="暂无热点数据" />
  </div>
</template>

<script setup lang="ts">
import type { CityEvent, SensorData } from '@/types'

defineProps<{
  hotspots: Array<{
    location: string
    eventCount: number
    abnormalSensorCount: number
    totalScore: number
  }>
}>()

function getRankType(index: number): string {
  if (index === 0) return 'danger'
  if (index === 1) return 'warning'
  if (index === 2) return 'success'
  return 'info'
}

function getScoreColor(score: number): string {
  if (score >= 15) return '#f56c6c'
  if (score >= 10) return '#e6a23c'
  if (score >= 5) return '#409eff'
  return '#67c23a'
}
</script>

<style scoped>
.hotspots-panel {
  margin-bottom: 30px;
}

.hotspots-panel h4 {
  margin-bottom: 20px;
  color: #303133;
}
</style>