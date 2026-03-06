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
  await delay(200)
  const weather = {
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
  return weather
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
  await delay(200)
  const now = new Date()
  const items = []
  for (let i = 1; i <= 8; i++) {
    const t = new Date(now.getTime() + i * 60 * 60 * 1000)
    items.push({
      hour: `${String(t.getHours()).padStart(2, '0')}:00`,
      temp: randomRange(12, 36),
      rainProb: randomRange(0, 100),
      wind: ['微风', '中等', '强风'][Math.floor(Math.random() * 3)],
      risk: ['低', '中', '高'][Math.floor(Math.random() * 3)]
    })
  }
  return { city, items }
}

export async function getLocalInnovationIndices(city = '示例城市') {
  await delay(180)
  return {
    extremeRainIndex: randomRange(0, 100),
    heatRiskIndex: randomRange(0, 100),
    urbanDrainageRisk: randomRange(0, 100),
    lightningRisk: randomRange(0, 100)
  }
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
