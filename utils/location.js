export async function getCityAuto() {
  const pref = wx.getStorageSync('city_pref') || { auto: true, city: '' }
  if (!pref.auto && pref.city) return pref.city
  try {
    const loc = await new Promise((resolve, reject) => {
      wx.getLocation({
        type: 'wgs84',
        success: resolve,
        fail: reject
      })
    })
    const city = mockGeocode(loc.latitude, loc.longitude)
    wx.setStorageSync('city_pref', { auto: true, city })
    return city
  } catch (e) {
    const city = mockIPToCity()
    wx.setStorageSync('city_pref', { auto: true, city })
    return city
  }
}

export function setCityPreference({ auto, city }) {
  wx.setStorageSync('city_pref', { auto, city: city || '' })
}

export function getCityPreference() {
  const pref = wx.getStorageSync('city_pref') || { auto: true, city: '' }
  return pref
}

function mockGeocode(lat, lon) {
  if (lat > 35 && lon > 110) return '北京'
  if (lat > 30 && lon > 120) return '上海'
  if (lat > 22 && lat < 24 && lon > 112 && lon < 114) return '广州'
  if (lat > 22 && lat < 23 && lon > 113 && lon < 115) return '深圳'
  if (lat > 29 && lat < 31 && lon > 119 && lon < 121) return '杭州'
  return ['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random() * 5)]
}

function mockIPToCity() {
  return ['北京', '上海', '广州', '深圳', '杭州'][Math.floor(Math.random() * 5)]
}
