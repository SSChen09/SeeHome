import { getSensorLatest, addHistoryLog } from '../../utils/api'
import { computeFireRisk, detectAnomalies } from '../../utils/risk'

let timer = null

Page({
  data: {
    sensor: { temperature: 0, humidity: 0, smoke: 0, gas: 0 },
    fireRisk: '低',
    riskBadgeClass: 'success badge',
    anomalies: [],
    autoRefresh: false
  },
  onLoad() {
    this.refresh()
  },
  onUnload() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  },
  async refresh() {
    const sensor = await getSensorLatest()
    const fireRisk = computeFireRisk(sensor)
    const anomalies = detectAnomalies(sensor)
    this.setData({
      sensor,
      fireRisk,
      riskBadgeClass: this.badgeClass(fireRisk),
      anomalies
    })
    if (anomalies.length > 0) {
      await addHistoryLog({ type: '异常提醒', detail: anomalies.join('、') })
      wx.showToast({ title: '发现异常', icon: 'error' })
    }
  },
  badgeClass(level) {
    if (level === '高') return 'danger badge'
    if (level === '中') return 'warning badge'
    return 'success badge'
  },
  toggleAuto() {
    const next = !this.data.autoRefresh
    this.setData({ autoRefresh: next })
    if (next) {
      timer = setInterval(() => this.refresh(), 2000)
    } else {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
  }
})
