Component({
  properties: {
    title: { type: String, value: '' },
    showRefresh: { type: Boolean, value: true },
    showBell: { type: Boolean, value: true },
    showSettings: { type: Boolean, value: true },
    themeClass: { type: String, value: '' },
    accentClass: { type: String, value: '' }
  },
  data: {
    statusBarHeight: 20,
    navHeight: 44,
    navTotalHeight: 64
  },
  lifetimes: {
    attached() {
      try {
        const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
        const statusBarHeight = win.statusBarHeight || 20
        const rect = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
        let navHeight = 44
        if (rect && statusBarHeight) {
          const gap = rect.top - statusBarHeight
          navHeight = rect.height + gap * 2
        }
        const navTotalHeight = statusBarHeight + navHeight
        this.setData({ statusBarHeight, navHeight, navTotalHeight })
      } catch (e) {}
    }
  },
  methods: {
    onRefresh() {
      this.triggerEvent('refresh')
    },
    onBell() {
      this.triggerEvent('bell')
    },
    onSettings() {
      this.triggerEvent('settings')
    }
  }
})
