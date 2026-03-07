const api = require('../../utils/api')
const { getCityPreference, setCityPreference, getPublicIP, getCityByIP, getFavoriteCities, addFavoriteCity, removeFavoriteCity } = require('../../utils/location')
const { getThemePreference, setThemePreference, getThemeClasses, applyNavColor } = require('../../utils/theme')

Page({
  data: {
    devices: [],
    history: [],
    newDeviceName: '',
    notify: { method: '微信提醒', level: '中' },
    methods: ['微信提醒', '短信', '电话'],
    levels: ['低', '中', '高'],
    methodIndex: 0,
    levelIndex: 1,
    cityPref: { auto: true, city: '' },
    currentIP: '',
    cityByIP: '',
    themes: ['亮色', '暗色'],
    accents: ['蓝色', '琥珀', '绿色'],
    themeIndex: 0,
    accentIndex: 0,
    themeLabel: '亮色',
    accentLabel: '蓝色',
    themeClass: '',
    accentClass: '',
    favorites: [],
    newFavCity: '',
    profile: { nickname: '' },
    version: '1.0.0',
    quietStart: '22:00',
    quietEnd: '07:00',
    thresholdIndices: { rain: 1, typhoon: 1, flood: 1 }
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
  async refresh() {
    const devices = await api.getDevices()
    const history = await api.getHistoryLogs()
    const notify = await api.getNotifyPreference()
    const methodIndex = this.data.methods.indexOf(notify.method)
    const levelIndex = this.data.levels.indexOf(notify.level)
    const cityPref = getCityPreference()
    const currentIP = await getPublicIP().catch(() => '')
    const cityByIP = await getCityByIP().catch(() => '')
    const themePref = getThemePreference()
    const themeIndex = themePref.theme === 'dark' ? 1 : 0
    const accentIndex = themePref.accent === 'amber' ? 1 : themePref.accent === 'green' ? 2 : 0
    const themeLabel = this.data.themes[themeIndex]
    const accentLabel = this.data.accents[accentIndex]
    const cls = getThemeClasses()
    const favorites = getFavoriteCities()
    const profile = wx.getStorageSync('user_profile') || { nickname: '' }
    const quietStart = (notify.quietStart || this.data.quietStart)
    const quietEnd = (notify.quietEnd || this.data.quietEnd)
    const thresholds = notify.thresholds || { rain: '中', typhoon: '中', flood: '中' }
    const thresholdIndices = {
      rain: this.data.levels.indexOf(thresholds.rain),
      typhoon: this.data.levels.indexOf(thresholds.typhoon),
      flood: this.data.levels.indexOf(thresholds.flood)
    }
    this.setData({ devices, history, notify, methodIndex, levelIndex, cityPref, currentIP, cityByIP, themeIndex, accentIndex, themeLabel, accentLabel, themeClass: cls.themeClass, accentClass: cls.accentClass, favorites, profile, quietStart, quietEnd, thresholdIndices })
  },
  onDeviceNameInput(e) {
    this.setData({ newDeviceName: e.detail.value })
  },
  async addDevice() {
    if (!this.data.newDeviceName) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    await api.addDevice({ name: this.data.newDeviceName })
    this.setData({ newDeviceName: '' })
    wx.showToast({ title: '已添加', icon: 'success' })
    this.refresh()
  },
  onMethodChange(e) {
    const idx = Number(e.detail.value)
    const next = { ...this.data.notify, method: this.data.methods[idx] }
    this.setData({ notify: next, methodIndex: idx })
    api.setNotifyPreference(next)
  },
  onLevelChange(e) {
    const idx = Number(e.detail.value)
    const next = { ...this.data.notify, level: this.data.levels[idx] }
    this.setData({ notify: next, levelIndex: idx })
    api.setNotifyPreference(next)
  },
  onAutoLocateChange(e) {
    const checked = e.detail.value
    const next = { auto: checked, city: checked ? this.data.cityPref.city : this.data.cityPref.city }
    this.setData({ cityPref: next })
    setCityPreference(next)
    wx.showToast({ title: '定位偏好已更新', icon: 'success' })
  },
  onCityInput(e) {
    const next = { ...this.data.cityPref, city: e.detail.value }
    this.setData({ cityPref: next })
  },
  saveCityPref() {
    setCityPreference(this.data.cityPref)
    wx.showToast({ title: '城市已保存', icon: 'success' })
  },
  onNicknameInput(e) {
    const profile = { ...this.data.profile, nickname: e.detail.value }
    this.setData({ profile })
  },
  saveProfile() {
    wx.setStorageSync('user_profile', this.data.profile)
    wx.showToast({ title: '已保存', icon: 'success' })
  },
  onFavCityInput(e) {
    this.setData({ newFavCity: e.detail.value })
  },
  addFavCity() {
    if (!this.data.newFavCity) {
      wx.showToast({ title: '请输入城市', icon: 'none' })
      return
    }
    addFavoriteCity(this.data.newFavCity)
    this.setData({ newFavCity: '' })
    const favorites = getFavoriteCities()
    this.setData({ favorites })
    wx.showToast({ title: '已收藏', icon: 'success' })
  },
  removeFavCity(e) {
    const city = e.currentTarget.dataset.city
    removeFavoriteCity(city)
    const favorites = getFavoriteCities()
    this.setData({ favorites })
    wx.showToast({ title: '已删除', icon: 'success' })
  },
  onQuietStartChange(e) {
    const next = { ...this.data.notify, quietStart: e.detail.value }
    this.setData({ notify: next, quietStart: e.detail.value })
    api.setNotifyPreference(next)
  },
  onQuietEndChange(e) {
    const next = { ...this.data.notify, quietEnd: e.detail.value }
    this.setData({ notify: next, quietEnd: e.detail.value })
    api.setNotifyPreference(next)
  },
  onRainThresholdChange(e) {
    const idx = Number(e.detail.value)
    const t = { ...(this.data.notify.thresholds || {}), rain: this.data.levels[idx] }
    const next = { ...this.data.notify, thresholds: t }
    this.setData({ notify: next, thresholdIndices: { ...this.data.thresholdIndices, rain: idx } })
    api.setNotifyPreference(next)
  },
  onTyphoonThresholdChange(e) {
    const idx = Number(e.detail.value)
    const t = { ...(this.data.notify.thresholds || {}), typhoon: this.data.levels[idx] }
    const next = { ...this.data.notify, thresholds: t }
    this.setData({ notify: next, thresholdIndices: { ...this.data.thresholdIndices, typhoon: idx } })
    api.setNotifyPreference(next)
  },
  onFloodThresholdChange(e) {
    const idx = Number(e.detail.value)
    const t = { ...(this.data.notify.thresholds || {}), flood: this.data.levels[idx] }
    const next = { ...this.data.notify, thresholds: t }
    this.setData({ notify: next, thresholdIndices: { ...this.data.thresholdIndices, flood: idx } })
    api.setNotifyPreference(next)
  },
  async refreshIP() {
    const currentIP = await getPublicIP().catch(() => '')
    const cityByIP = await getCityByIP().catch(() => '')
    this.setData({ currentIP, cityByIP })
    wx.showToast({ title: '已更新', icon: 'success' })
  },
  onThemeChange(e) {
    const idx = Number(e.detail.value)
    const theme = idx === 1 ? 'dark' : 'light'
    const pref = getThemePreference()
    const next = { theme, accent: pref.accent }
    setThemePreference(next)
    const cls = getThemeClasses()
    this.setData({ themeIndex: idx, themeLabel: this.data.themes[idx], themeClass: cls.themeClass, accentClass: cls.accentClass })
    applyNavColor()
  },
  onAccentChange(e) {
    const idx = Number(e.detail.value)
    const accent = idx === 1 ? 'amber' : idx === 2 ? 'green' : 'blue'
    const pref = getThemePreference()
    const next = { theme: pref.theme, accent }
    setThemePreference(next)
    const cls = getThemeClasses()
    this.setData({ accentIndex: idx, accentLabel: this.data.accents[idx], themeClass: cls.themeClass, accentClass: cls.accentClass })
    applyNavColor()
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
