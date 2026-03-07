const api = require('../../utils/api')
const { getCityAuto } = require('../../utils/location')
const { getThemeClasses } = require('../../utils/theme')

Page({
  data: {
    themeClass: '',
    accentClass: '',
    favorites: [],
    selectedCity: '',
    risk: { rain: '低', typhoon: '低', flood: '低' },
    hourly: { items: [] },
    history: [],
    rainBadgeClass: 'success badge',
    typhoonBadgeClass: 'success badge',
    floodBadgeClass: 'success badge'
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
    this.loadHistory()
    const { getFavoriteCities } = require('../../utils/location')
    const favorites = getFavoriteCities()
    this.setData({ favorites })
  },
  async refresh() {
    const risk = await api.getDisasterRisk()
    const prefCity = await getCityAuto()
    const city = this.data.selectedCity || prefCity
    const hourly = await api.getHourlyForecast(city)
    const hourlyWithClass = { items: (hourly.items || []).map(it => ({ ...it, riskClass: this.badgeClass(it.risk) })) }
    const trendBars = (hourly.items || []).map(it => ({
      height: Math.round((it.rainProb || 0) * 1.0 + 10),
      cls: this.trendClass(it.risk)
    }))
    this.setData({
      risk,
      hourly: hourlyWithClass,
      trendBars,
      rainBadgeClass: this.badgeClass(risk.rain),
      typhoonBadgeClass: this.badgeClass(risk.typhoon),
      floodBadgeClass: this.badgeClass(risk.flood)
    })
  },
  selectCity(e) {
    const city = e.currentTarget.dataset.city
    this.setData({ selectedCity: city })
    this.refresh()
  },
  async loadHistory() {
    const list = await api.getHistoryLogs()
    this.setData({ history: list })
  },
  async onClearHistory() {
    await api.clearHistoryLogs()
    this.setData({ history: [] })
    wx.showToast({ title: '已清空', icon: 'success' })
  },
  badgeClass(level) {
    if (level === '高') return 'danger badge'
    if (level === '中') return 'warning badge'
    return 'success badge'
  },
  trendClass(level) {
    if (level === '高') return 'danger'
    if (level === '中') return 'warning'
    return 'success'
  },
  formatTime(ts) {
    const d = new Date(ts)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${hh}:${mm}`
  }
})
