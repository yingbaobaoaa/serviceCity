<template>
  <div class="analysis-view">
    <!-- 第一行：问题热点分析，占满整行 -->
    <el-row :gutter="20" class="first-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3>问题高发区域 TOP 10</h3>
          </template>

          <HotspotsPanel :hotspots="dataStore.hotspots" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行：选择分析数据（60%）和辅助决策（40%） -->
    <el-row :gutter="20" class="second-row">
      <el-col :span="14" class="data-selection-col">
        <el-card>
          <template #header>
            <h3>分析数据</h3>
          </template>
          <DataSelectionPanel
            :events="dataStore.events"
            :sensors="dataStore.sensors"
            @selection-change="handleSelectionChange"
          />
        </el-card>
      </el-col>

      <el-col :span="10" class="ai-decision-col">
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
:deep(.is-always-shadow){
  .el-card__body{
    max-height: 500px;
    overflow-y: auto;
  }
}
.analysis-view {
  padding: 20px;
}

/* 第一行布局 - 问题热点分析占满整行 */
.first-row {
  margin-bottom: 20px;
}

/* 第二行布局 - 数据选择和AI决策并排 */
.second-row {
  margin-bottom: 20px;
}

/* 确保卡片高度一致 */
.data-selection-col .el-card,
.ai-decision-col .el-card {
  height: 100%;
  min-height: 600px; /* 设置最小高度以保证视觉一致性 */
}
:deep(.el-card){
  border-radius: 16px;
  .el-card__header {
    padding: 16px 20px;
    h3{
      margin: 0;
    }
  }
}
/* 响应式调整 */
@media (max-width: 1200px) {
  .second-row .data-selection-col {
    width: 100%;
    flex: 0 0 100%;
    max-width: 100%;
  }

  .second-row .ai-decision-col {
    width: 100%;
    flex: 0 0 100%;
    max-width: 100%;
    margin-top: 20px;
  }
}
</style>