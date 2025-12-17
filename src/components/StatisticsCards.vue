<template>
  <div class="statistics-cards">
    <div style="display: flex;gap:20px">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.totalEvents }}</div>
            <div class="stat-label">事件总数</div>
          </div>
          <el-icon class="stat-icon events"><Document /></el-icon>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.totalSensors }}</div>
            <div class="stat-label">传感器总数</div>
          </div>
          <el-icon class="stat-icon sensors"><Monitor /></el-icon>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.abnormalSensors }}</div>
            <div class="stat-label">异常传感器</div>
          </div>
          <el-icon class="stat-icon abnormal"><Warning /></el-icon>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.onlineSensorRate }}%</div>
            <div class="stat-label">设备在线率</div>
          </div>
          <el-icon class="stat-icon online"><Connection /></el-icon>
        </el-card>
    </div>
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
  flex: 1;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 为每个卡片添加不同颜色的微妙背景渐变 */
.stat-card:nth-child(1) {
  background: linear-gradient(135deg, #ffffff 0%, #f0f5ff 100%);
}

.stat-card:nth-child(2) {
  background: linear-gradient(135deg, #ffffff 0%, #f6ffed 100%);
}

.stat-card:nth-child(3) {
  background: linear-gradient(135deg, #ffffff 0%, #fff2f0 100%);
}

.stat-card:nth-child(4) {
  background: linear-gradient(135deg, #ffffff 0%, #fffbe6 100%);
}

.stat-content {
  padding-right: 50px;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.stat-card:nth-child(1) .stat-number {
  color: #5b8ff9; /* 清新蓝色 - 事件总数 */
}

.stat-card:nth-child(2) .stat-number {
  color: #52c41a; /* 清新绿色 - 传感器总数 */
}

.stat-card:nth-child(3) .stat-number {
  color: #ff6b6b; /* 清新红色 - 异常传感器 */
}

.stat-card:nth-child(4) .stat-number {
  color: #faad14; /* 清新橙色 - 设备在线率 */
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
  opacity: 0.15;
}

/* 为每个卡片添加不同的边框颜色和图标颜色 */
.stat-card:nth-child(1) {
  border-left: 4px solid #5b8ff9;
}

.stat-card:nth-child(1) .stat-icon {
  color: #5b8ff9;
}

.stat-card:nth-child(2) {
  border-left: 4px solid #52c41a;
}

.stat-card:nth-child(2) .stat-icon {
  color: #52c41a;
}

.stat-card:nth-child(3) {
  border-left: 4px solid #ff6b6b;
}

.stat-card:nth-child(3) .stat-icon {
  color: #ff6b6b;
}

.stat-card:nth-child(4) {
  border-left: 4px solid #faad14;
}

.stat-card:nth-child(4) .stat-icon {
  color: #faad14;
}
</style>