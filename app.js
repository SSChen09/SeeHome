const { applyNavColor } = require('./utils/theme')
App({
  onLaunch() {
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    applyNavColor()
  }
})
