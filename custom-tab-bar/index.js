const { getThemeClasses } = require('../utils/theme')

Component({
  data: {
    selected: 0,
    themeClass: '',
    accentClass: '',
    list: [
      { pagePath: '/pages/home/home', text: '首页', icon: '🏠' },
      { pagePath: '/pages/monitor/monitor', text: '监控', icon: '📹' },
      { pagePath: '/pages/warning/warning', text: '预警', icon: '⚠️' },
      { pagePath: '/pages/user/user', text: '我的', icon: '👤' }
    ]
  },
  lifetimes: {
    attached() {
      const cls = getThemeClasses()
      this.setData({ themeClass: cls.themeClass, accentClass: cls.accentClass })
      this.updateSelected()
    }
  },
  methods: {
    updateSelected() {
      const pages = getCurrentPages()
      if (!pages || pages.length === 0) return
      const last = pages[pages.length - 1]
      const route = last && last.route ? last.route : ''
      const idx = this.data.list.findIndex(i => i.pagePath.slice(1) === route)
      this.setData({ selected: idx < 0 ? 0 : idx })
    },
    switchTab(e) {
      const idx = Number(e.currentTarget.dataset.index)
      const item = this.data.list[idx]
      wx.switchTab({ url: item.pagePath })
    }
  }
})
