const api = require('../../utils/api')
const { computeFireRisk } = require('../../utils/risk')
const { getCityAuto } = require('../../utils/location')
const { getThemeClasses } = require('../../utils/theme')

Page({
  data: {
    currentTime: '',
    sensor: { temperature: 0, humidity: 0, smoke: 0, gas: 0 },
    fireRisk: '低',
    riskBadgeClass: 'success badge',
    themeClass: '',
    accentClass: '',
    favorites: [],
    selectedCity: '',
    weather: { city: '', condition: '', tempMin: 0, tempMax: 0, wind: '' },
    risk: { rain: '低', typhoon: '低', flood: '低' },
    hourly: { items: [] },
    innovation: { extremeRainIndex: 0, heatRiskIndex: 0, urbanDrainageRisk: 0, lightningRisk: 0 },
    aqiBadge: 'success badge',
    uvBadge: 'success badge',
    suggestions: [],
    heroAnim: {}
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
    const { getFavoriteCities } = require('../../utils/location')
    const favorites = getFavoriteCities()
    this.setData({ favorites })
  },
  async refresh() {
    const prefCity = await getCityAuto()
    const city = this.data.selectedCity || prefCity
    const sensor = await api.getSensorLatest()
    const fireRisk = computeFireRisk(sensor)
    const weather = await api.getWeatherToday(city)
    const risk = await api.getDisasterRisk()
    const hourly = await api.getHourlyForecast(city)
    const innovation = await api.getLocalInnovationIndices(city)
    const rainBadgeClass = this.badgeClass(risk.rain)
    const typhoonBadgeClass = this.badgeClass(risk.typhoon)
    const floodBadgeClass = this.badgeClass(risk.flood)
    const hourlyWithClass = { items: (hourly.items || []).map(it => ({ ...it, riskClass: this.badgeClass(it.risk) })) }
    const trendBars = (hourly.items || []).map(it => ({
      height: Math.round((it.rainProb || 0) * 1.0 + 10),
      cls: this.trendClass(it.risk)
    }))
    this.setData({
      currentTime: this.nowStr(),
      sensor,
      fireRisk,
      riskBadgeClass: this.badgeClass(fireRisk),
      weather,
      risk,
      hourly: hourlyWithClass,
      trendBars,
      innovation,
      aqiBadge: this.meterClass(weather.aqi),
      uvBadge: this.meterClass(weather.uv),
      suggestions: this.buildSuggestions(weather, risk, fireRisk, innovation),
      rainBadgeClass,
      typhoonBadgeClass,
      floodBadgeClass,
      extremeRainClass: this.meterClass(innovation.extremeRainIndex),
      heatRiskClass: this.meterClass(innovation.heatRiskIndex),
      urbanDrainageClass: this.meterClass(innovation.urbanDrainageRisk),
      lightningClass: this.meterClass(innovation.lightningRisk)
    })
    this.playHeroAnim()
  },
  selectCity(e) {
    const city = e.currentTarget.dataset.city
    this.setData({ selectedCity: city })
    this.refresh()
  },
  trendClass(level) {
    if (level === '高') return 'danger'
    if (level === '中') return 'warning'
    return 'success'
  },
  badgeClass(level) {
    if (level === '高') return 'danger badge'
    if (level === '中') return 'warning badge'
    return 'success badge'
  },
  meterClass(val) {
    if (val >= 80) return 'danger badge'
    if (val >= 50) return 'warning badge'
    return 'success badge'
  },
  goMonitor() {
    wx.switchTab({ url: '/pages/monitor/monitor' })
  },
  goWarning() {
    wx.switchTab({ url: '/pages/warning/warning' })
  },
  goUser() {
    wx.switchTab({ url: '/pages/user/user' })
  },
  goGuide() {
    wx.navigateTo({ url: '/pages/guide/guide' })
  },
  nowStr() {
    const d = new Date()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  },
  buildSuggestions(weather, risk, fireRisk, innovation) {
    const list = []
    if (fireRisk === '高') list.push('立即检查燃气与电器设备，准备灭火器与逃生路线')
    if (risk.rain === '高') list.push('避免前往低洼与地下空间，规划高地通行路径')
    if (weather.uv >= 7) list.push('紫外线较强，外出配备防晒与遮阳装备')
    if (innovation.urbanDrainageRisk >= 70) list.push('城市排水压力偏高，关注积水与内涝通告')
    if (weather.aqi >= 100) list.push('空气质量较差，减少户外运动并佩戴口罩')
    if (list.length === 0) list.push('风险较低，保持关注与常备应急物资')
    return list
  },
  playHeroAnim() {
    const animation = wx.createAnimation({
      duration: 600,
      timingFunction: 'ease-out'
    })
    animation.opacity(1).translateY(0).step()
    this.setData({ heroAnim: animation.export() })
  }
})
