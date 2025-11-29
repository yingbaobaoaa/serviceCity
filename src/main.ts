import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 自定义Element Plus主题色
const elStyle = document.createElement('style')
elStyle.innerHTML = `
  :root {
    --el-color-primary: #0057ff;
    --el-color-primary-light-3: #3377ff;
    --el-color-primary-light-5: #6699ff;
    --el-color-primary-light-7: #99bbff;
    --el-color-primary-light-8: #b3ccff;
    --el-color-primary-light-9: #cce0ff;
    --el-color-primary-dark-2: #0047dd;
  }
`
document.head.appendChild(elStyle)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')