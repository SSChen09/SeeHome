const api = require('../../utils/api')
const { computeFireRisk, detectAnomalies } = require('../../utils/risk')
const { getThemeClasses } = require('../../utils/theme')

let timer = null

Page({
  data: {
    sensor: { temperature: 0, humidity: 0, smoke: 0, gas: 0 },
    fireRisk: '低',
    riskBadgeClass: 'success badge',
    themeClass: '',
    accentClass: '',
    anomalies: [],
    autoRefresh: false
  },
  onLoad() {
    this.refresh()
  },
  onShow() {
    const cls = getThemeClasses()
    this.setData({ themeClass: cls.themeClass, accentClass: cls.accentClass })
    if (this.getTabBar) {
      const tab = this.getTabBar()
      if (tab && typeof tab.updateSelected === 'function') {
        tab.updateSelected()
        tab.setData({ themeClass: cls.themeClass, accentClass: cls.accentClass })
      }
    }
  },
  onUnload() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  },
  async refresh() {
    const sensor = await api.getSensorLatest()
    const fireRisk = computeFireRisk(sensor)
    const anomalies = detectAnomalies(sensor)
    const charts = {
      temp: Array.from({ length: 12 }, () => Math.round(40 + Math.random() * 60)),
      smoke: Array.from({ length: 12 }, () => Math.round(20 + Math.random() * 50)),
      gas: Array.from({ length: 12 }, () => Math.round(20 + Math.random() * 60))
    }
    this.setData({
      sensor,
      fireRisk,
      riskBadgeClass: this.badgeClass(fireRisk),
      anomalies,
      charts
    })
    if (anomalies.length > 0) {
      await api.addHistoryLog({ type: '异常提醒', detail: anomalies.join('、') })
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
