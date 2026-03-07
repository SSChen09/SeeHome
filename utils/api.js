const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function randomRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

export async function getSensorLatest() {
  await delay(200)
  const data = {
    temperature: randomRange(18, 36),
    humidity: randomRange(30, 85),
    smoke: randomRange(0, 50),
    gas: randomRange(0, 100)
  }
  return data
}

export async function getWeatherToday(city = '示例城市') {
  const cacheKey = `weather_today_${city}`
  const cache = wx.getStorageSync(cacheKey) || {}
  const now = Date.now()
  if (cache.data && cache.ts && now - cache.ts < 5 * 60 * 1000) return cache.data
  const real = await tryGetWeatherToday(city).catch(() => null)
  if (real) {
    wx.setStorageSync(cacheKey, { data: real, ts: now })
    return real
  }
  await delay(200)
  const fallback = {
    city,
    condition: ['晴', '多云', '小雨', '暴雨'][Math.floor(Math.random() * 4)],
    tempMin: randomRange(10, 20),
    tempMax: randomRange(21, 35),
    wind: ['微风', '中等', '强风'][Math.floor(Math.random() * 3)],
    aqi: randomRange(20, 150),
    uv: randomRange(1, 10),
    feelLike: randomRange(12, 38),
    windSpeed: randomRange(1, 15),
    alerts: Math.random() > 0.6 ? ['强对流', '暴雨蓝色预警'] : []
  }
  wx.setStorageSync(cacheKey, { data: fallback, ts: now })
  return fallback
}

export async function getDisasterRisk() {
  await delay(250)
  const riskLevel = () => ['低', '中', '高'][Math.floor(Math.random() * 3)]
  return {
    rain: riskLevel(),
    typhoon: riskLevel(),
    flood: riskLevel()
  }
}

export async function getHourlyForecast(city = '示例城市') {
  const cacheKey = `hourly_${city}`
  const cache = wx.getStorageSync(cacheKey) || {}
  const now = Date.now()
  if (cache.data && cache.ts && now - cache.ts < 5 * 60 * 1000) return cache.data
  const real = await tryGetHourlyForecast(city).catch(() => null)
  if (real) {
    wx.setStorageSync(cacheKey, { data: real, ts: now })
    return real
  }
  await delay(200)
  const nowDate = new Date()
  const items = []
  for (let i = 1; i <= 8; i++) {
    const t = new Date(nowDate.getTime() + i * 60 * 60 * 1000)
    items.push({
      hour: `${String(t.getHours()).padStart(2, '0')}:00`,
      temp: randomRange(12, 36),
      rainProb: randomRange(0, 100),
      wind: ['微风', '中等', '强风'][Math.floor(Math.random() * 3)],
      risk: ['低', '中', '高'][Math.floor(Math.random() * 3)]
    })
  }
  const result = { city, items }
  wx.setStorageSync(cacheKey, { data: result, ts: Date.now() })
  return result
}

export async function getLocalInnovationIndices(city = '示例城市') {
  const cacheKey = `innov_${city}`
  const cache = wx.getStorageSync(cacheKey) || {}
  const now = Date.now()
  if (cache.data && cache.ts && now - cache.ts < 5 * 60 * 1000) return cache.data
  const real = await tryGetInnovationIndices(city).catch(() => null)
  if (real) {
    wx.setStorageSync(cacheKey, { data: real, ts: now })
    return real
  }
  await delay(180)
  const result = {
    extremeRainIndex: randomRange(0, 100),
    heatRiskIndex: randomRange(0, 100),
    urbanDrainageRisk: randomRange(0, 100),
    lightningRisk: randomRange(0, 100)
  }
  wx.setStorageSync(cacheKey, { data: result, ts: now })
  return result
}

export async function getHistoryLogs() {
  await delay(150)
  const stored = wx.getStorageSync('history_logs') || []
  return stored
}

export async function addHistoryLog(item) {
  const list = wx.getStorageSync('history_logs') || []
  list.unshift({ time: Date.now(), ...item })
  wx.setStorageSync('history_logs', list.slice(0, 50))
  return true
}

export async function clearHistoryLogs() {
  wx.setStorageSync('history_logs', [])
  return true
}

export async function getDevices() {
  await delay(100)
  const devices = wx.getStorageSync('devices') || []
  return devices
}

export async function addDevice(device) {
  const devices = wx.getStorageSync('devices') || []
  devices.push({ id: Date.now(), name: device.name || '未命名设备', type: device.type || '环境传感器' })
  wx.setStorageSync('devices', devices)
  return true
}

export async function getNotifyPreference() {
  await delay(80)
  const pref = wx.getStorageSync('notify_pref') || { method: '微信提醒', level: '中' }
  return pref
}

export async function setNotifyPreference(pref) {
  wx.setStorageSync('notify_pref', pref)
  return true
}

function req(url) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method: 'GET',
      timeout: 6000,
      success: res => resolve(res.data),
      fail: err => reject(err)
    })
  })
}

async function resolveCityCoord(city) {
  const data = await req(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`)
  const r = (data && data.results && data.results[0]) ? data.results[0] : null
  if (!r) throw new Error('no-city')
  return { lat: r.latitude, lon: r.longitude, country: r.country }
}

async function tryGetWeatherToday(city) {
  const c = await resolveCityCoord(city)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&current=temperature_2m,apparent_temperature,wind_speed_10m&hourly=temperature_2m,uv_index,wind_speed_10m,precipitation_probability&timezone=auto`
  const data = await req(url)
  const current = data.current || {}
  const hourly = data.hourly || {}
  const temps = hourly.temperature_2m || []
  const uv = hourly.uv_index || []
  const wind = hourly.wind_speed_10m || []
  const condition = (temps.length && uv.length) ? '多云' : '晴'
  const tempMin = temps.slice(0, 24).reduce((a, b) => Math.min(a, b), 99)
  const tempMax = temps.slice(0, 24).reduce((a, b) => Math.max(a, b), -99)
  const windSpeed = current.wind_speed_10m || (wind[0] || 0)
  const feelLike = current.apparent_temperature || (temps[0] || 0)
  return {
    city,
    condition,
    tempMin: Math.round(tempMin),
    tempMax: Math.round(tempMax),
    wind: windSpeed < 3 ? '微风' : windSpeed < 8 ? '中等' : '强风',
    aqi: randomRange(20, 150),
    uv: Math.round((uv[0] || 0)),
    feelLike: Math.round(feelLike),
    windSpeed: Math.round(windSpeed),
    alerts: []
  }
}

async function tryGetHourlyForecast(city) {
  const c = await resolveCityCoord(city)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=temperature_2m,precipitation_probability,wind_speed_10m,uv_index&timezone=auto`
  const data = await req(url)
  const h = data.hourly || {}
  const times = h.time || []
  const temps = h.temperature_2m || []
  const rains = h.precipitation_probability || []
  const winds = h.wind_speed_10m || []
  const items = []
  for (let i = 1; i <= 8; i++) {
    const idx = i
    const tstr = times[idx] || ''
    const hour = tstr.split('T')[1] ? tstr.split('T')[1].slice(0, 5) : `${String(i).padStart(2, '0')}:00`
    const temp = Math.round(temps[idx] || 0)
    const rainProb = Math.round(rains[idx] || 0)
    const wind = winds[idx] || 0
    const risk = computeRiskFromWeather(rainProb, wind)
    items.push({ hour, temp, rainProb, wind: wind < 3 ? '微风' : wind < 8 ? '中等' : '强风', risk })
  }
  return { city, items }
}

function computeRiskFromWeather(rainProb, windSpeed) {
  if (rainProb >= 70 || windSpeed >= 10) return '高'
  if (rainProb >= 40 || windSpeed >= 6) return '中'
  return '低'
}

async function tryGetInnovationIndices(city) {
  const c = await resolveCityCoord(city)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&hourly=precipitation_probability,uv_index,wind_speed_10m&timezone=auto`
  const data = await req(url)
  const h = data.hourly || {}
  const rains = h.precipitation_probability || []
  const uv = h.uv_index || []
  const wind = h.wind_speed_10m || []
  const rainMax = Math.max(...rains.slice(0, 24), 0)
  const uvMax = Math.max(...(uv.slice(0, 24).map(v => Math.round(v))), 0)
  const windMax = Math.max(...wind.slice(0, 24), 0)
  return {
    extremeRainIndex: Math.round(rainMax),
    heatRiskIndex: Math.round((uvMax / 11) * 100),
    urbanDrainageRisk: Math.round(rainMax * 0.8 + Math.min(windMax * 2, 20)),
    lightningRisk: Math.round(Math.min(uvMax * 8, 100))
  }
}
