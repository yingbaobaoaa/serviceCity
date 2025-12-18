<template>
  <div id="app">
    <!-- 大屏页面独立布局，无头部导航 -->
    <div v-if="$route.path === '/dashboard'" class="dashboard-layout">
      <RouterView />
    </div>

    <!-- 其他页面使用标准布局 -->
    <el-container v-else>
      <el-aside width="200px">
        <div class="sidebar-header">
          <h1>智慧城市管理系统</h1>
        </div>
        <el-menu
          :default-active="$route.path"
          class="sidebar-menu"
          router
        >
          <el-menu-item index="/">
            <el-icon><DataLine /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="/analysis">
            <el-icon><TrendCharts /></el-icon>
            <span>问题聚类分析</span>
          </el-menu-item>
          <el-menu-item index="/dashboard">
            <el-icon><Monitor /></el-icon>
            <span>运行态势大屏</span>
          </el-menu-item>
          <el-menu-item index="/alerts">
            <el-icon><Bell /></el-icon>
            <span>预警中心</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <RouterView />
      </el-main>
       <!-- 预警Toast -->
      <AlertToast
        v-if="showAlerts"
        :alerts="alerts"
        @dismiss="handleAlertDismiss"
      />
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElLoading } from 'element-plus'
import { dataStorage } from '@/services/dataStorage'
import { alertService } from '@/services/alertService'
import { alertScheduler } from '@/services/alertScheduler'
import AlertToast from '@/components/AlertToast.vue'

// 数据加载状态
const dataLoading = ref(false)
const dataLoaded = ref(false)

// 预警状态
const alerts = ref<any[]>([])
const showAlerts = ref(true) // 控制是否显示预警Toast

// 在应用启动时加载数据
const initializeData = async () => {
  try {
    // 检查是否已有数据且未过期
    const dataStatus = dataStorage.getDataStatus()

    if (dataStatus.loaded && !dataStorage.needsUpdate()) {
      console.log('使用本地缓存数据，最后更新:', dataStatus.lastUpdate)
      dataLoaded.value = true
      return
    }

    console.log('开始从远程加载最新数据...')
    dataLoading.value = true

    // 显示加载提示
    const loading = ElLoading.service({
      lock: true,
      text: '正在加载城市数据...',
      background: 'rgba(0, 0, 0, 0.7)'
    })

    // 从远程API加载数据
    await dataStorage.loadFromRemote()

    // 更新状态
    dataLoaded.value = true
    loading.close()

    ElMessage.success('数据加载成功！')
    window.location.reload()
    console.log('数据初始化完成')

  } catch (error) {
    console.error('数据初始化失败:', error)

    // 检查是否有缓存数据可用
    const cachedStatus = dataStorage.getDataStatus()
    if (cachedStatus.loaded) {
      ElMessage.warning('数据加载失败，使用缓存数据。数据可能不是最新的。')
      console.log('使用缓存数据，最后更新:', cachedStatus.lastUpdate)
    } else {
      ElMessage.error('数据加载失败，请检查网络连接')
    }
  } finally {
    dataLoading.value = false
  }
}

// 初始化预警系统
const initializeAlerts = () => {
  try {
    // 加载已有预警
    alerts.value = alertService.getAlerts()
    console.log(`加载了 ${alerts.value.length} 个预警`)

    // 启动定时检测
    alertScheduler.start()
    console.log('预警定时检测已启动')

  } catch (error) {
    console.error('初始化预警系统失败:', error)
  }
}

// 预警处理函数
const handleAlertDismiss = (alertId: string) => {
  console.log('用户关闭预警:', alertId)
}

// 定时检查新预警
let alertCheckInterval: number | null = null
const checkForNewAlerts = () => {
  const currentAlerts = alertService.getAlerts()
  const currentAlertIds = new Set(alerts.value.map(a => a.id))
  const newAlerts = currentAlerts.filter(alert => !currentAlertIds.has(alert.id))

  if (newAlerts.length > 0) {
    console.log(`检测到 ${newAlerts.length} 个新预警`)
    alerts.value = currentAlerts
  }
}

// Vue 生命周期钩子
onMounted(() => {
  // 延迟加载数据，确保页面先渲染
  initializeData()

  // 初始化预警系统
  setTimeout(() => {
    initializeAlerts()

    // 启动定时检查新预警
    alertCheckInterval = setInterval(() => {
      checkForNewAlerts()
    }, 1000) // 每秒检查一次新预警
  }, 3000) // 3秒后启动预警系统，确保数据已加载
})

onUnmounted(() => {
  // 停止预警定时检测
  alertScheduler.stop()

  // 停止预警检查定时器
  if (alertCheckInterval) {
    clearInterval(alertCheckInterval)
    alertCheckInterval = null
  }

  console.log('预警定时检测已停止')
})

// 暴露给模板的状态
</script>

<style scoped>
#app {
  min-height: 100vh;
}

/* 大屏独立布局 */
.dashboard-layout {
  width: 100%;
  height: 100vh;
  position: relative;
}

/* 侧边栏样式 */
.el-aside {
  background-color: #001529;
  color: white;
  height: 100vh;
  border-right: 1px solid #1f1f1f;
}

.sidebar-header {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #1f1f1f;
  background: linear-gradient(135deg, #0057ff 0%, #003d99 100%);
}

.sidebar-header h1 {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.sidebar-menu {
  border: none;
  background-color: transparent;
}

.sidebar-menu .el-menu-item {
  color: rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s ease;
}

.sidebar-menu .el-menu-item:hover {
  background-color: rgba(0, 87, 255, 0.2);
  color: white;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #0057ff;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 87, 255, 0.4);
}

.sidebar-menu .el-menu-item .el-icon {
  margin-right: 8px;
}

/* 主内容区域 */
.el-main {
    background-color: #f0f2f5;
    padding: 20px;
    max-height: 100vh;
    overflow-y: auto;
}
</style>