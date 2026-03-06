import { getDevices, addDevice, getHistoryLogs, getNotifyPreference, setNotifyPreference } from '../../utils/api'
import { getCityPreference, setCityPreference } from '../../utils/location'

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
    cityPref: { auto: true, city: '' }
  },
  onLoad() {
    this.refresh()
  },
  async refresh() {
    const devices = await getDevices()
    const history = await getHistoryLogs()
    const notify = await getNotifyPreference()
    const methodIndex = this.data.methods.indexOf(notify.method)
    const levelIndex = this.data.levels.indexOf(notify.level)
    const cityPref = getCityPreference()
    this.setData({ devices, history, notify, methodIndex, levelIndex, cityPref })
  },
  onDeviceNameInput(e) {
    this.setData({ newDeviceName: e.detail.value })
  },
  async addDevice() {
    if (!this.data.newDeviceName) {
      wx.showToast({ title: '请输入名称', icon: 'none' })
      return
    }
    await addDevice({ name: this.data.newDeviceName })
    this.setData({ newDeviceName: '' })
    wx.showToast({ title: '已添加', icon: 'success' })
    this.refresh()
  },
  onMethodChange(e) {
    const idx = Number(e.detail.value)
    const next = { ...this.data.notify, method: this.data.methods[idx] }
    this.setData({ notify: next, methodIndex: idx })
    setNotifyPreference(next)
  },
  onLevelChange(e) {
    const idx = Number(e.detail.value)
    const next = { ...this.data.notify, level: this.data.levels[idx] }
    this.setData({ notify: next, levelIndex: idx })
    setNotifyPreference(next)
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
