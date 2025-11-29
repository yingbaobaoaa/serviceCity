// 百度文心一言API服务
import { ElMessage } from 'element-plus'
import type { CityEvent, SensorData } from '@/types'

export interface WenxinConfig {
  apiKey: string
  secretKey: string
  baseUrl?: string
}

export interface AnalysisResponse {
  problemAttribution: string
  disposalSuggestion: string
  priority: 'high' | 'medium' | 'low'
}

export class WenxinService {
  private config: WenxinConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: WenxinConfig) {
    this.config = {
      baseUrl: 'https://aip.baidubce.com',
      ...config
    }
  }

  // 获取访问令牌
  private async getAccessToken(): Promise<string> {
    // 检查是否已有有效的令牌
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const url = `${this.config.baseUrl}/oauth/2.0/token?grant_type=client_credentials&client_id=${this.config.apiKey}&client_secret=${this.config.secretKey}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`获取访问令牌失败: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(`获取访问令牌失败: ${data.error_description}`)
      }

      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000 // 提前60秒过期

      return this.accessToken
    } catch (error) {
      console.error('获取访问令牌失败:', error)
      throw error
    }
  }

  // 构建分析提示词
  private buildAnalysisPrompt(items: (CityEvent | SensorData)[]): string {
    const eventItems = items.filter(item => 'type' in item && !('sensorId' in item)) as CityEvent[]
    const sensorItems = items.filter(item => 'sensorId' in item) as SensorData[]

    let prompt = `请作为智慧城市管理专家，分析以下城市事件和传感器数据，提供专业的问题归因和处置建议。\n\n`

    if (eventItems.length > 0) {
      prompt += `城市事件：\n`
      eventItems.forEach((event, index) => {
        prompt += `${index + 1}. ${event.type} - ${event.location.district} - ${event.description}\n`
      })
    }

    if (sensorItems.length > 0) {
      prompt += `\n传感器数据：\n`
      sensorItems.forEach((sensor, index) => {
        prompt += `${index + 1}. ${sensor.type}传感器 - ${sensor.location.district} - 数值: ${sensor.value}\n`
      })
    }

    prompt += `\n请以JSON格式返回分析结果，包含以下字段：
{
  "problemAttribution": "详细的问题归因分析",
  "disposalSuggestion": "具体的处置建议",
  "priority": "优先级评估（high/medium/low）"
}

请确保分析结果准确、专业，并提供实用的建议。`

    return prompt
  }

  // 流式分析
  async *analyzeDataStream(items: (CityEvent | SensorData)[]): AsyncGenerator<string, void, unknown> {
    try {
      const accessToken = await this.getAccessToken()
      const prompt = this.buildAnalysisPrompt(items)

      const url = `${this.config.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${accessToken}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: true,
          temperature: 0.7,
          max_output_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`文心一言API调用失败: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch (e) {
              console.warn('解析流数据失败:', e, data)
            }
          }
        }
      }
    } catch (error) {
      console.error('文心一言分析失败:', error)
      throw error
    }
  }

  // 非流式分析（兼容接口）
  async analyzeData(items: (CityEvent | SensorData)[]): Promise<AnalysisResponse> {
    try {
      const accessToken = await this.getAccessToken()
      const prompt = this.buildAnalysisPrompt(items)

      const url = `${this.config.baseUrl}/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions_pro?access_token=${accessToken}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_output_tokens: 2000
        })
      })

      if (!response.ok) {
        throw new Error(`文心一言API调用失败: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        throw new Error('API返回内容为空')
      }

      // 尝试解析JSON响应
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            problemAttribution: parsed.problemAttribution || '分析结果解析失败',
            disposalSuggestion: parsed.disposalSuggestion || '建议解析失败',
            priority: parsed.priority || 'medium'
          }
        }
      } catch (e) {
        console.warn('JSON解析失败，使用原文内容:', e)
      }

      // 如果JSON解析失败，返回原始内容
      return {
        problemAttribution: content,
        disposalSuggestion: '建议联系专业人员进行详细分析',
        priority: 'medium'
      }
    } catch (error) {
      console.error('文心一言分析失败:', error)
      ElMessage.error('AI分析服务调用失败，请检查配置或重试')
      throw error
    }
  }
}

// 创建单例服务
let wenxinService: WenxinService | null = null

export function createWenxinService(config: WenxinConfig): WenxinService {
  if (!wenxinService) {
    wenxinService = new WenxinService(config)
  }
  return wenxinService
}

export function getWenxinService(): WenxinService | null {
  return wenxinService
}