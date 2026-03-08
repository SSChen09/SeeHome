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
    autoRefresh: false,
    isConnected: false,  // 监控设备连接状态
    connectionError: '', // 连接错误信息
    charts: {
      temp: [],
      smoke: [],
      gas: []
    }
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
    try {
      // 尝试获取传感器数据
      const sensor = await api.getSensorLatest()
      
      // 检查是否为模拟数据（所有值都是0）
      const isMockData = sensor.temperature === 0 && sensor.humidity === 0 && 
                         sensor.smoke === 0 && sensor.gas === 0
      
      if (isMockData) {
        // 没有真实数据，显示连接提示
        this.setData({
          isConnected: false,
          connectionError: '未检测到监控设备连接',
          sensor: { temperature: 0, humidity: 0, smoke: 0, gas: 0 },
          fireRisk: '低',
          riskBadgeClass: 'success badge',
          anomalies: [],
          charts: {
            temp: [],
            smoke: [],
            gas: []
          }
        })
        return
      }
      
      // 有真实数据，正常处理
      const fireRisk = computeFireRisk(sensor)
      const anomalies = detectAnomalies(sensor)
      
      // 更新图表数据（使用真实数据）
      const charts = this.updateCharts(sensor)
      
      this.setData({
        isConnected: true,
        connectionError: '',
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
    } catch (error) {
      console.error('刷新监控数据失败:', error)
      this.setData({
        isConnected: false,
        connectionError: `连接失败: ${error.message || '未知错误'}`,
        sensor: { temperature: 0, humidity: 0, smoke: 0, gas: 0 },
        fireRisk: '低',
        riskBadgeClass: 'success badge',
        anomalies: [],
        charts: {
          temp: [],
          smoke: [],
          gas: []
        }
      })
    }
  },
  badgeClass(level) {
    if (level === '高') return 'danger badge'
    if (level === '中') return 'warning badge'
    return 'success badge'
  },
  
  updateCharts(sensor) {
    // 获取当前图表数据
    const currentCharts = this.data.charts || { temp: [], smoke: [], gas: [] }
    
    // 添加新数据点
    const newTemp = [...currentCharts.temp, sensor.temperature]
    const newSmoke = [...currentCharts.smoke, sensor.smoke]
    const newGas = [...currentCharts.gas, sensor.gas]
    
    // 限制数据点数量（最多12个）
    const limit = 12
    return {
      temp: newTemp.slice(-limit),
      smoke: newSmoke.slice(-limit),
      gas: newGas.slice(-limit)
    }
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
  },
  
  // 手动连接设备
  async connectDevice() {
    wx.showLoading({ title: '连接中...' })
    try {
      // 使用模拟设备连接（实际项目中应替换为真实设备连接逻辑）
      const result = await api.mockConnectDevice()
      
      if (result.success) {
        // 连接成功后刷新数据
        await this.refresh()
        wx.showToast({ 
          title: `已连接到${result.deviceInfo.deviceName}`, 
          icon: 'success' 
        })
      } else {
        wx.showToast({ title: '连接失败', icon: 'error' })
      }
    } catch (error) {
      console.error('连接设备失败:', error)
      wx.showToast({ title: '连接失败', icon: 'error' })
    } finally {
      wx.hideLoading()
    }
  },
  
  // 断开设备连接
  async disconnectDevice() {
    wx.showLoading({ title: '断开中...' })
    try {
      await api.disconnectDevice()
      await this.refresh()
      wx.showToast({ title: '已断开连接', icon: 'success' })
    } catch (error) {
      console.error('断开设备失败:', error)
      wx.showToast({ title: '断开失败', icon: 'error' })
    } finally {
      wx.hideLoading()
    }
  }
})
