<template>
  <div class="view-mode-selector">
    <el-radio-group v-model="selectedMode" @change="handleChange">
      <el-radio-button value="events">仅事件</el-radio-button>
      <el-radio-button value="sensors">仅传感器</el-radio-button>
      <el-radio-button value="merged">合并视图</el-radio-button>
    </el-radio-group>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ViewMode } from '@/types'

const props = defineProps<{
  modelValue: ViewMode
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ViewMode]
}>()

const selectedMode = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function handleChange() {
  // 值变更已通过 v-model 自动处理
}
</script>

<style scoped>
.view-mode-selector {
  margin-bottom: 20px;
  text-align: center;
}
</style>