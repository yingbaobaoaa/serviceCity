<template>
  <div class="data-selection-panel">
    <h4>选择分析数据</h4>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="事件数据" name="events">
        <el-table
          :data="events"
          @selection-change="handleEventSelection"
          max-height="400"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="140" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="location.district" label="区域" width="100" />
          <el-table-column prop="reportTime" label="上报时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.reportTime) }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="传感器数据" name="sensors">
        <el-table
          :data="sensors"
          @selection-change="handleSensorSelection"
          max-height="400"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="sensorId" label="传感器ID" width="140" />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="location.district" label="区域" width="100" />
          <el-table-column label="数值" width="100">
            <template #default="{ row }">
              {{ row.value }}{{ row.unit }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === '异常' ? 'danger' : 'success'">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <div class="selection-summary">
      <el-alert
        :title="`已选择 ${selectedEvents.length} 个事件和 ${selectedSensors.length} 个传感器`"
        type="info"
        :closable="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CityEvent, SensorData } from '@/types'

const props = defineProps<{
  events: CityEvent[]
  sensors: SensorData[]
}>()

const emit = defineEmits<{
  selectionChange: [items: (CityEvent | SensorData)[]]
}>()

const activeTab = ref('events')
const selectedEvents = ref<CityEvent[]>([])
const selectedSensors = ref<SensorData[]>([])

function handleEventSelection(selection: CityEvent[]) {
  selectedEvents.value = selection
  emitSelectionChange()
}

function handleSensorSelection(selection: SensorData[]) {
  selectedSensors.value = selection
  emitSelectionChange()
}

function emitSelectionChange() {
  const allSelected = [...selectedEvents.value, ...selectedSensors.value]
  emit('selectionChange', allSelected)
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch(() => props.events, () => {
  selectedEvents.value = []
})

watch(() => props.sensors, () => {
  selectedSensors.value = []
})
</script>

<style scoped>
.data-selection-panel {
  margin-top: 30px;
}

.data-selection-panel h4 {
  margin-bottom: 20px;
  color: #303133;
}

.selection-summary {
  margin-top: 20px;
}
</style>