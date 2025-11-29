<template>
  <div class="analysis-view">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <h3>问题热点分析</h3>
          </template>

          <HotspotsPanel :hotspots="dataStore.hotspots" />

          <DataSelectionPanel
            :events="dataStore.events"
            :sensors="dataStore.sensors"
            @selection-change="handleSelectionChange"
          />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <h3>AI 辅助决策</h3>
          </template>

          <AIAnalysisPanel
            :selected-items="selectedItems"
            @analysis-complete="handleAnalysisComplete"
          />

          <el-divider />

          <h4>历史分析记录</h4>
          <AIRecordsList :records="dataStore.aiRecords" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import HotspotsPanel from '@/components/HotspotsPanel.vue'
import DataSelectionPanel from '@/components/DataSelectionPanel.vue'
import AIAnalysisPanel from '@/components/AIAnalysisPanel.vue'
import AIRecordsList from '@/components/AIRecordsList.vue'
import type { CityEvent, SensorData } from '@/types'

const dataStore = useDataStore()
const selectedItems = ref<(CityEvent | SensorData)[]>([])

onMounted(() => {
  dataStore.loadFromStorage()
  dataStore.loadAIRecords()
})

function handleSelectionChange(items: (CityEvent | SensorData)[]) {
  selectedItems.value = items
}

function handleAnalysisComplete(record: any) {
  dataStore.addAIRecord(record)
}
</script>

<style scoped>
.analysis-view {
  padding: 20px;
}
</style>