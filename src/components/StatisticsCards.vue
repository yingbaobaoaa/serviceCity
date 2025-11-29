<template>
  <div class="statistics-cards">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.totalEvents }}</div>
            <div class="stat-label">事件总数</div>
          </div>
          <el-icon class="stat-icon events"><Document /></el-icon>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.totalSensors }}</div>
            <div class="stat-label">传感器总数</div>
          </div>
          <el-icon class="stat-icon sensors"><Monitor /></el-icon>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.abnormalSensors }}</div>
            <div class="stat-label">异常传感器</div>
          </div>
          <el-icon class="stat-icon abnormal"><Warning /></el-icon>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.onlineSensorRate }}%</div>
            <div class="stat-label">设备在线率</div>
          </div>
          <el-icon class="stat-icon online"><Connection /></el-icon>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Document, Monitor, Warning, Connection } from '@element-plus/icons-vue'

defineProps<{
  statistics: {
    totalEvents: number
    totalSensors: number
    abnormalSensors: number
    onlineSensorRate: string
  }
}>()
</script>

<style scoped>
.statistics-cards {
  margin-bottom: 30px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  padding-right: 50px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 40px;
  opacity: 0.3;
}

.stat-icon.events {
  color: #409eff;
}

.stat-icon.sensors {
  color: #67c23a;
}

.stat-icon.abnormal {
  color: #f56c6c;
}

.stat-icon.online {
  color: #e6a23c;
}
</style>