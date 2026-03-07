export async function getCityAuto() {
  const pref = wx.getStorageSync('city_pref') || { auto: true, city: '' }
  if (!pref.auto && pref.city) return pref.city
  try {
    const cityByIp = await getCityByIP()
    const city = cityByIp && cityByIp !== '未知城市' ? cityByIp : (pref.city || '示例城市')
    wx.setStorageSync('city_pref', { auto: true, city })
    return city
  } catch (e) {
    return pref.city || '示例城市'
  }
}

export function setCityPreference({ auto, city }) {
  wx.setStorageSync('city_pref', { auto, city: city || '' })
}

export function getCityPreference() {
  const pref = wx.getStorageSync('city_pref') || { auto: true, city: '' }
  return pref
}

export function getFavoriteCities() {
  const list = wx.getStorageSync('fav_cities') || []
  return Array.isArray(list) ? list : []
}

export function addFavoriteCity(city) {
  const trimmed = String(city || '').trim()
  if (!trimmed) return false
  const list = wx.getStorageSync('fav_cities') || []
  if (!list.includes(trimmed)) {
    list.push(trimmed)
    wx.setStorageSync('fav_cities', list)
  }
  return true
}

export function removeFavoriteCity(city) {
  const trimmed = String(city || '').trim()
  const list = (wx.getStorageSync('fav_cities') || []).filter(c => c !== trimmed)
  wx.setStorageSync('fav_cities', list)
  return true
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

export async function getPublicIP() {
  const cache = wx.getStorageSync('net_info') || {}
  const now = Date.now()
  if (cache.ip && cache.ts && now - cache.ts < 5 * 60 * 1000) return cache.ip
  const providers = [
    { url: 'https://api64.ipify.org?format=json', parse: d => d && d.ip },
    { url: 'https://ipv4.icanhazip.com', parse: d => (typeof d === 'string' ? d.trim() : '') },
    { url: 'https://api.myip.com', parse: d => d && d.ip }
  ]
  const ip = await tryProviders(providers)
  if (ip) {
    wx.setStorageSync('net_info', { ip, city: cache.city || '', ts: now })
  }
  return ip || ''
}

export async function getCityByIP() {
  const cache = wx.getStorageSync('net_info') || {}
  const now = Date.now()
  if (cache.city && cache.ts && now - cache.ts < 5 * 60 * 1000) return cache.city
  const providers = [
    { url: 'https://ipapi.co/json', parse: d => d && (d.city || d.region) },
    { url: 'https://ipwho.is/', parse: d => d && d.city },
    { url: 'https://ip-api.com/json', parse: d => d && d.city }
  ]
  const city = await tryProviders(providers)
  const ipCache = wx.getStorageSync('net_info') || {}
  if (city) {
    wx.setStorageSync('net_info', { ip: ipCache.ip || '', city, ts: now })
  }
  return city || '未知城市'
}

function tryProviders(items) {
  return new Promise(async resolve => {
    for (let i = 0; i < items.length; i++) {
      const { url, parse } = items[i]
      try {
        const data = await requestRaw(url)
        const val = parse(data)
        if (val) {
          resolve(val)
          return
        }
      } catch (e) {}
    }
    resolve('')
  })
}

function requestRaw(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'GET',
      timeout: 5000,
      success: res => {
        resolve(res.data)
      },
      fail: err => {
        reject(err)
      }
    })
  })
}
