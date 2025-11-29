<template>
  <div class="file-upload">
    <el-upload
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        :show-file-list="false"
        accept=".json"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将JSON文件拖拽到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            请上传 city_events.json 或 sensor_data.json 文件
          </div>
        </template>
      </el-upload>

      <div v-if="errorMessage" class="error-message">
        <el-alert
          :title="errorMessage"
          type="error"
          :closable="true"
          @close="errorMessage = ''"
        />
      </div>

      <div v-if="successMessage" class="success-message">
        <el-alert
          :title="successMessage"
          type="success"
          :closable="true"
          @close="successMessage = ''"
        />
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import type { CityEvent, SensorData } from '@/types'

const emit = defineEmits<{
  dataLoaded: [data: { events: CityEvent[], sensors: SensorData[] }]
}>()

const errorMessage = ref('')
const successMessage = ref('')
const uploadedData = ref<{ events: CityEvent[], sensors: SensorData[] }>({
  events: [],
  sensors: []
})

function handleFileChange(file: any) {
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      const data = JSON.parse(content)

      if (validateData(data)) {
        processData(data, file.name)
        successMessage.value = `${file.name} 文件解析成功`
        errorMessage.value = ''

        if (uploadedData.value.events.length > 0 || uploadedData.value.sensors.length > 0) {
          emit('dataLoaded', uploadedData.value)
        }
      }
    } catch (error) {
      errorMessage.value = '文件解析失败，请检查JSON格式是否正确'
      console.error('File parse error:', error)
    }
  }

  reader.readAsText(file.raw)
}

function validateData(data: any): boolean {
  if (!Array.isArray(data) || data.length === 0) {
    errorMessage.value = '数据格式错误：需要非空数组'
    return false
  }

  const firstItem = data[0]

  if (firstItem.id && firstItem.type && firstItem.location) {
    return true
  } else {
    errorMessage.value = '数据格式错误：缺少必要字段（id, type, location）'
    return false
  }
}

function processData(data: any[], fileName: string) {
  if (fileName.includes('events')) {
    uploadedData.value.events = data as CityEvent[]
  } else if (fileName.includes('sensor')) {
    uploadedData.value.sensors = data as SensorData[]
  } else {
    if (data[0].reporterType) {
      uploadedData.value.events = data as CityEvent[]
    } else if (data[0].sensorId) {
      uploadedData.value.sensors = data as SensorData[]
    } else {
      errorMessage.value = '无法识别数据类型，请检查文件名或数据结构'
      return
    }
  }
}
</script>

<style scoped>
.file-upload {
  margin-bottom: 20px;
}

.upload-demo {
  width: 100%;
}

.error-message,
.success-message {
  margin-top: 20px;
}
</style>