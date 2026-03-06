import { getSensorLatest, getWeatherToday, getDisasterRisk, getHourlyForecast, getLocalInnovationIndices } from '../../utils/api'
import { computeFireRisk } from '../../utils/risk'
import { getCityAuto } from '../../utils/location'

Page({
  data: {
    currentTime: '',
    sensor: { temperature: 0, humidity: 0, smoke: 0, gas: 0 },
    fireRisk: '低',
    riskBadgeClass: 'success badge',
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
  async refresh() {
    const city = await getCityAuto()
    const sensor = await getSensorLatest()
    const fireRisk = computeFireRisk(sensor)
    const weather = await getWeatherToday(city)
    const risk = await getDisasterRisk()
    const hourly = await getHourlyForecast(city)
    const innovation = await getLocalInnovationIndices(city)
    this.setData({
      currentTime: this.nowStr(),
      sensor,
      fireRisk,
      riskBadgeClass: this.badgeClass(fireRisk),
      weather,
      risk,
      hourly,
      innovation,
      aqiBadge: this.meterClass(weather.aqi),
      uvBadge: this.meterClass(weather.uv),
      suggestions: this.buildSuggestions(weather, risk, fireRisk, innovation)
    })
    this.playHeroAnim()
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
