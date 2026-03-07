Page({
  data: {
    themeClass: '',
    accentClass: '',
    guides: {
      fire: [
        '保持低姿态沿墙快速撤离',
        '湿毛巾捂住口鼻',
        '切勿乘坐电梯',
        '优先选择安全出口'
      ],
      gas: [
        '迅速关闭气源并打开门窗通风',
        '切勿使用明火或开启电器',
        '撤离至安全区域并联系物业或燃气公司',
        '必要时拨打报警电话'
      ],
      rain: [
        '避免地下通道与低洼地带',
        '注意道路积水与井盖',
        '减少不必要外出',
        '准备应急物资与充电设备'
      ],
      typhoon: [
        '加固门窗与户外悬挂物',
        '储备饮用水与食物',
        '远离海边与江河堤岸',
        '关注官方预警信息'
      ]
    },
    contacts: [
      '火警 119',
      '急救 120',
      '公安 110',
      '燃气抢修 95598（地区不同请以当地为准）'
    ]
  },
  onShow() {
    const { getThemeClasses } = require('../../utils/theme')
    const cls = getThemeClasses()
    this.setData({ themeClass: cls.themeClass, accentClass: cls.accentClass })
    if (this.getTabBar) {
      const tab = this.getTabBar()
      if (tab && typeof tab.updateSelected === 'function') {
        tab.updateSelected()
        tab.setData({ themeClass: cls.themeClass, accentClass: cls.accentClass })
      }
    }
  }
})
