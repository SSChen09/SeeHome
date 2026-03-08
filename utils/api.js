const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

function randomRange(min, max) {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10
}

export async function getSensorLatest() {
  try {
    // 这里应该调用实际的设备API获取传感器数据
    // 例如：通过蓝牙、WiFi或HTTP请求获取真实数据
    
    // 模拟真实设备连接检查
    const isDeviceConnected = await checkDeviceConnection()
    
    if (!isDeviceConnected) {
      // 设备未连接，返回全0数据表示未连接状态
      return {
        temperature: 0,
        humidity: 0,
        smoke: 0,
        gas: 0
      }
    }
    
    // 设备已连接，获取真实数据
    // 这里应该替换为实际的设备数据获取逻辑
    const realData = await fetchRealSensorData()
    
    return realData || {
      temperature: 0,
      humidity: 0,
      smoke: 0,
      gas: 0
    }
  } catch (error) {
    console.error('获取传感器数据失败:', error)
    // 发生错误时返回全0数据
    return {
      temperature: 0,
      humidity: 0,
      smoke: 0,
      gas: 0
    }
  }
}

// 检查设备连接状态（模拟函数，需要根据实际设备实现）
async function checkDeviceConnection() {
  // 这里应该实现实际的设备连接检查逻辑
  // 例如：检查蓝牙连接状态、WiFi连接状态等
  
  // 模拟：检查本地存储中是否有设备连接记录
  const deviceInfo = wx.getStorageSync('monitor_device_info')
  return !!deviceInfo && deviceInfo.connected === true
}

// 获取真实传感器数据（模拟函数，需要根据实际设备实现）
async function fetchRealSensorData() {
  // 这里应该实现实际的设备数据获取逻辑
  // 例如：通过蓝牙特征值读取、HTTP API调用等
  
  // 模拟：从本地存储获取模拟的真实数据
  const mockData = wx.getStorageSync('sensor_mock_data')
  if (mockData) {
    return mockData
  }
  
  // 如果没有模拟数据，返回null表示需要真实设备连接
  return null
}

// 模拟设备连接（用于测试）
export async function mockConnectDevice() {
  await delay(500)
  
  // 设置设备连接状态
  wx.setStorageSync('monitor_device_info', {
    connected: true,
    deviceId: 'mock-device-001',
    deviceName: '模拟监控设备',
    connectedAt: new Date().toISOString()
  })
  
  // 设置模拟传感器数据
  const mockData = {
    temperature: randomRange(20, 30),
    humidity: randomRange(40, 70),
    smoke: randomRange(0, 20),
    gas: randomRange(0, 30)
  }
  wx.setStorageSync('sensor_mock_data', mockData)
  
  return {
    success: true,
    deviceInfo: {
      deviceId: 'mock-device-001',
      deviceName: '模拟监控设备'
    }
  }
}

// 断开设备连接
export async function disconnectDevice() {
  await delay(300)
  
  // 清除设备连接状态
  wx.removeStorageSync('monitor_device_info')
  wx.removeStorageSync('sensor_mock_data')
  
  return { success: true }
}

export async function getWeatherToday(city = '北京') {
  const cacheKey = `weather_today_${city}`
  const cache = wx.getStorageSync(cacheKey) || {}
  const now = Date.now()
  
  // 检查缓存（2分钟有效期）
  if (cache.data && cache.ts && now - cache.ts < 2 * 60 * 1000) {
    return cache.data
  }
  
  try {
    // 优先尝试获取真实天气数据
    const real = await tryGetWeatherToday(city)
    if (real) {
      wx.setStorageSync(cacheKey, { data: real, ts: now })
      return real
    }
  } catch (error) {
    console.warn(`获取真实天气数据失败 "${city}"，错误:`, error.message)
    // 不立即回退到模拟数据，让用户知道需要配置域名
    throw new Error(`获取真实天气失败，请检查域名配置: ${error.message}`)
  }
  
  // 如果tryGetWeatherToday返回null（域名未配置），也抛出错误
  throw new Error('无法获取真实天气数据，请在小程序后台配置api.open-meteo.com域名')
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

function generateMockWeather(city, season) {
  // 根据季节和城市生成更合理的模拟天气数据
  const seasonConfig = {
    spring: { 
      tempMin: 8, 
      tempMax: 22, 
      conditions: ['晴', '多云', '小雨', '阴'],
      windRange: [1, 5],
      uvRange: [3, 7]
    },
    summer: { 
      tempMin: 22, 
      tempMax: 35, 
      conditions: ['晴', '多云', '雷阵雨', '暴雨', '阴'],
      windRange: [2, 8],
      uvRange: [6, 11]
    },
    autumn: { 
      tempMin: 12, 
      tempMax: 26, 
      conditions: ['晴', '多云', '小雨', '阴'],
      windRange: [2, 6],
      uvRange: [3, 8]
    },
    winter: { 
      tempMin: -8, 
      tempMax: 8, 
      conditions: ['晴', '多云', '小雪', '阴'],
      windRange: [3, 10],
      uvRange: [1, 4]
    }
  }
  
  // 根据城市调整温度范围（北方城市温度较低，南方城市温度较高）
  const cityAdjustments = {
    '北京': { tempAdjust: -2, windAdjust: 1 },
    '上海': { tempAdjust: 1, windAdjust: 0 },
    '广州': { tempAdjust: 4, windAdjust: -1 },
    '深圳': { tempAdjust: 5, windAdjust: -1 },
    '杭州': { tempAdjust: 0, windAdjust: 0 },
    '南京': { tempAdjust: -1, windAdjust: 0 },
    '成都': { tempAdjust: 1, windAdjust: -1 },
    '武汉': { tempAdjust: 0, windAdjust: 0 },
    '西安': { tempAdjust: -2, windAdjust: 1 },
    '重庆': { tempAdjust: 2, windAdjust: -1 }
  }
  
  const config = seasonConfig[season] || seasonConfig.spring
  const adjustment = cityAdjustments[city] || { tempAdjust: 0, windAdjust: 0 }
  
  // 根据当前时间调整温度（白天高，夜晚低）
  const hour = new Date().getHours()
  const isDaytime = hour >= 6 && hour <= 18
  const tempAdjust = isDaytime ? 3 : -2
  
  const adjustedTempMin = config.tempMin + adjustment.tempAdjust + (isDaytime ? 0 : -3)
  const adjustedTempMax = config.tempMax + adjustment.tempAdjust + (isDaytime ? 3 : 0)
  
  // 选择天气状况（根据概率分布）
  const conditionWeights = {
    '晴': 0.4,
    '多云': 0.3,
    '小雨': 0.15,
    '阴': 0.1,
    '雷阵雨': season === 'summer' ? 0.05 : 0,
    '暴雨': season === 'summer' ? 0.02 : 0,
    '小雪': season === 'winter' ? 0.05 : 0
  }
  
  let condition = '晴'
  const rand = Math.random()
  let cumulative = 0
  for (const [cond, weight] of Object.entries(conditionWeights)) {
    cumulative += weight
    if (rand <= cumulative) {
      condition = cond
      break
    }
  }
  
  // 根据天气状况调整温度
  let finalTempMin = adjustedTempMin
  let finalTempMax = adjustedTempMax
  if (condition.includes('雨') || condition === '阴') {
    finalTempMax -= 2
  }
  if (condition.includes('雪')) {
    finalTempMin -= 3
    finalTempMax -= 3
  }
  
  // 根据天气状况调整风速
  let windSpeed = Math.round(randomRange(config.windRange[0], config.windRange[1]) + adjustment.windAdjust)
  if (condition.includes('雨') || condition.includes('雪')) {
    windSpeed += 2
  }
  
  const wind = windSpeed < 3 ? '微风' : windSpeed < 8 ? '中等' : '强风'
  const uv = Math.round(randomRange(config.uvRange[0], config.uvRange[1]))
  
  // 体感温度（考虑风速和湿度）
  const humidity = condition.includes('雨') ? randomRange(70, 95) : randomRange(40, 80)
  let feelLike = randomRange(finalTempMin, finalTempMax)
  if (windSpeed > 5) {
    feelLike -= 1 // 风大感觉更冷
  }
  if (humidity > 80) {
    feelLike += 1 // 湿度高感觉更闷热
  }
  
  // AQI（空气质量指数）
  let aqi = Math.round(randomRange(20, 120))
  if (condition === '晴' && windSpeed < 2) {
    aqi += 20 // 无风晴天污染物容易积累
  }
  if (condition.includes('雨')) {
    aqi -= 20 // 雨水净化空气
  }
  
  return {
    city,
    condition,
    tempMin: Math.round(finalTempMin),
    tempMax: Math.round(finalTempMax),
    wind,
    aqi: Math.min(500, Math.max(0, aqi)), // 限制在0-500范围内
    uv,
    feelLike: Math.round(feelLike),
    windSpeed,
    alerts: condition.includes('暴雨') || condition.includes('雷阵雨') ? ['强对流预警'] : []
  }
}

export async function getDisasterRisk(city = '北京') {
  try {
    // 获取小时预报数据
    const hourly = await getHourlyForecast(city)
    const items = hourly.items || []
    
    if (items.length === 0) {
      // 如果没有数据，返回默认值
      return { rain: '低', typhoon: '低', flood: '低' }
    }
    
    // 分析未来8小时的数据
    let totalRainRisk = 0
    let maxRainProb = 0
    let maxWindSpeed = 0
    
    for (const item of items.slice(0, 8)) {
      const rainProb = item.rainProb || 0
      const windSpeed = item.wind === '强风' ? 10 : item.wind === '中等' ? 6 : 3
      
      totalRainRisk += rainProb
      maxRainProb = Math.max(maxRainProb, rainProb)
      maxWindSpeed = Math.max(maxWindSpeed, windSpeed)
    }
    
    // 计算平均降雨概率
    const avgRainProb = totalRainRisk / Math.min(items.length, 8)
    
    // 根据数据计算风险等级
    const computeRisk = (rainProb, windSpeed) => {
      if (rainProb >= 70 || windSpeed >= 10) return '高'
      if (rainProb >= 40 || windSpeed >= 6) return '中'
      return '低'
    }
    
    // 降雨风险（基于降雨概率）
    const rainRisk = computeRisk(avgRainProb, 0)
    
    // 台风风险（基于风速）
    const typhoonRisk = computeRisk(0, maxWindSpeed)
    
    // 洪水风险（基于降雨概率和持续时间）
    let floodRisk = '低'
    if (avgRainProb >= 60 && items.length >= 4) {
      // 如果高降雨概率持续多个小时，洪水风险增加
      let highRainHours = 0
      for (const item of items.slice(0, 4)) {
        if (item.rainProb >= 60) highRainHours++
      }
      if (highRainHours >= 3) floodRisk = '高'
      else if (highRainHours >= 2) floodRisk = '中'
    }
    
    return {
      rain: rainRisk,
      typhoon: typhoonRisk,
      flood: floodRisk
    }
  } catch (error) {
    console.warn('获取灾害风险数据失败:', error.message)
    // 如果获取数据失败，返回保守的估计
    return { rain: '低', typhoon: '低', flood: '低' }
  }
}

export async function getHourlyForecast(city = '北京') {
  const cacheKey = `hourly_${city}`
  const cache = wx.getStorageSync(cacheKey) || {}
  const now = Date.now()
  
  // 检查缓存（2分钟有效期）
  if (cache.data && cache.ts && now - cache.ts < 2 * 60 * 1000) {
    return cache.data
  }
  
  try {
    // 优先尝试获取真实小时预报数据
    const real = await tryGetHourlyForecast(city)
    if (real) {
      wx.setStorageSync(cacheKey, { data: real, ts: now })
      return real
    }
  } catch (error) {
    console.warn(`获取小时预报数据失败 "${city}"，错误:`, error.message)
    // 不立即回退到模拟数据，让用户知道需要配置域名
    throw new Error(`获取小时预报失败，请检查域名配置: ${error.message}`)
  }
}

export async function getLocalInnovationIndices(city = '北京') {
  const cacheKey = `innov_${city}`
  const cache = wx.getStorageSync(cacheKey) || {}
  const now = Date.now()
  
  // 检查缓存（2分钟有效期）
  if (cache.data && cache.ts && now - cache.ts < 2 * 60 * 1000) {
    return cache.data
  }
  
  try {
    // 尝试获取真实创新指数数据
    const real = await tryGetInnovationIndices(city)
    if (real) {
      wx.setStorageSync(cacheKey, { data: real, ts: now })
      return real
    }
  } catch (error) {
    console.warn(`获取创新指数数据失败 "${city}"，使用模拟数据:`, error)
  }
  
  // 使用模拟数据作为回退
  await delay(180)
  
  // 根据季节生成合理的模拟数据
  const season = getCurrentSeason()
  const seasonFactors = {
    spring: { rainFactor: 0.6, heatFactor: 0.4, drainageFactor: 0.5, lightningFactor: 0.3 },
    summer: { rainFactor: 0.9, heatFactor: 0.8, drainageFactor: 0.7, lightningFactor: 0.6 },
    autumn: { rainFactor: 0.5, heatFactor: 0.3, drainageFactor: 0.4, lightningFactor: 0.2 },
    winter: { rainFactor: 0.2, heatFactor: 0.1, drainageFactor: 0.3, lightningFactor: 0.1 }
  }
  
  const factors = seasonFactors[season] || seasonFactors.spring
  
  const result = {
    extremeRainIndex: Math.round(randomRange(0, 100) * factors.rainFactor),
    heatRiskIndex: Math.round(randomRange(0, 100) * factors.heatFactor),
    urbanDrainageRisk: Math.round(randomRange(0, 100) * factors.drainageFactor),
    lightningRisk: Math.round(randomRange(0, 100) * factors.lightningFactor)
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

async function req(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await new Promise((resolve, reject) => {
        wx.request({
          url,
          method: 'GET',
          timeout: 15000, // 增加超时时间到15秒
          success: (res) => {
            if (res.statusCode === 200) {
              resolve(res.data)
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.errMsg || '请求失败'}`))
            }
          },
          fail: (err) => {
            console.error(`网络请求失败 (尝试 ${attempt + 1}/${retries + 1}):`, url, err)
            
            // 提供更详细的错误信息
            let errorMsg = '网络请求失败'
            if (err.errMsg) {
              if (err.errMsg.includes('timeout')) {
                errorMsg = '请求超时，请检查网络连接'
              } else if (err.errMsg.includes('fail')) {
                errorMsg = '网络连接失败'
              } else if (err.errMsg.includes('abort')) {
                errorMsg = '请求被取消'
              }
            }
            
            reject(new Error(`${errorMsg}: ${err.errMsg || '未知错误'}`))
          }
        })
      })
      
      return result
    } catch (error) {
      if (attempt === retries) {
        // 最后一次尝试也失败了
        console.error(`所有重试都失败: ${url}`, error)
        throw error
      }
      
      // 等待一段时间后重试
      console.log(`请求失败，等待 ${(attempt + 1) * 1000}ms 后重试...`)
      await delay((attempt + 1) * 1000)
    }
  }
}

async function resolveCityCoord(city) {
  // 扩展城市坐标映射表（更多中国城市）
  const cityCoords = {
    '北京': { lat: 39.9042, lon: 116.4074 },
    '上海': { lat: 31.2304, lon: 121.4737 },
    '广州': { lat: 23.1291, lon: 113.2644 },
    '深圳': { lat: 22.5431, lon: 114.0579 },
    '杭州': { lat: 30.2741, lon: 120.1551 },
    '南京': { lat: 32.0603, lon: 118.7969 },
    '成都': { lat: 30.5728, lon: 104.0668 },
    '武汉': { lat: 30.5928, lon: 114.3055 },
    '西安': { lat: 34.3416, lon: 108.9398 },
    '重庆': { lat: 29.5630, lon: 106.5516 },
    '天津': { lat: 39.3434, lon: 117.3616 },
    '苏州': { lat: 31.2989, lon: 120.5853 },
    '郑州': { lat: 34.7466, lon: 113.6253 },
    '长沙': { lat: 28.2282, lon: 112.9388 },
    '沈阳': { lat: 41.8057, lon: 123.4315 },
    '青岛': { lat: 36.0671, lon: 120.3826 },
    '大连': { lat: 38.9140, lon: 121.6147 },
    '厦门': { lat: 24.4798, lon: 118.0894 },
    '哈尔滨': { lat: 45.8038, lon: 126.5340 },
    '长春': { lat: 43.8171, lon: 125.3235 },
    '佛山': { lat: 23.0215, lon: 113.1214 },
    '东莞': { lat: 23.0207, lon: 113.7518 },
    '宁波': { lat: 29.8683, lon: 121.5440 },
    '无锡': { lat: 31.4907, lon: 120.3123 },
    '合肥': { lat: 31.8206, lon: 117.2272 },
    '福州': { lat: 26.0745, lon: 119.2965 },
    '济南': { lat: 36.6512, lon: 117.1201 },
    '石家庄': { lat: 38.0428, lon: 114.5149 },
    '太原': { lat: 37.8706, lon: 112.5489 },
    '昆明': { lat: 24.8801, lon: 102.8329 },
    '南宁': { lat: 22.8170, lon: 108.3665 },
    '贵阳': { lat: 26.6477, lon: 106.6302 },
    '兰州': { lat: 36.0611, lon: 103.8343 },
    '西宁': { lat: 36.6171, lon: 101.7782 },
    '银川': { lat: 38.4872, lon: 106.2309 },
    '乌鲁木齐': { lat: 43.8256, lon: 87.6168 },
    '拉萨': { lat: 29.6469, lon: 91.1175 },
    '海口': { lat: 20.0440, lon: 110.1983 },
    '三亚': { lat: 18.2528, lon: 109.5119 },
    '珠海': { lat: 22.2707, lon: 113.5767 },
    '中山': { lat: 22.5176, lon: 113.3928 },
    '江门': { lat: 22.5833, lon: 113.0833 },  // 添加江门坐标
    '惠州': { lat: 23.1118, lon: 114.4156 },
    '汕头': { lat: 23.3541, lon: 116.6820 },
    '湛江': { lat: 21.2713, lon: 110.3589 },
    '肇庆': { lat: 23.0472, lon: 112.4650 },
    '清远': { lat: 23.6820, lon: 113.0560 },
    '韶关': { lat: 24.8104, lon: 113.5972 },
    '阳江': { lat: 21.8579, lon: 111.9822 },
    '茂名': { lat: 21.6629, lon: 110.9192 },
    '潮州': { lat: 23.6569, lon: 116.6226 },
    '揭阳': { lat: 23.5497, lon: 116.3728 },
    '云浮': { lat: 22.9153, lon: 112.0445 },
    '梅州': { lat: 24.2886, lon: 116.1226 },
    '汕尾': { lat: 22.7862, lon: 115.3751 },
    '河源': { lat: 23.7439, lon: 114.7008 },
    '东莞': { lat: 23.0207, lon: 113.7518 }
  }
  
  // 首先检查本地映射表
  const normalizedCity = city.replace('市', '').replace('省', '') // 去掉"市"和"省"字
  if (cityCoords[normalizedCity]) {
    console.log(`使用本地坐标映射: ${city} -> ${normalizedCity}`)
    return { lat: cityCoords[normalizedCity].lat, lon: cityCoords[normalizedCity].lon, country: 'China' }
  }
  
  // 尝试模糊匹配（部分匹配）
  for (const [cityName, coords] of Object.entries(cityCoords)) {
    if (normalizedCity.includes(cityName) || cityName.includes(normalizedCity)) {
      console.log(`模糊匹配成功: ${city} -> ${cityName}`)
      return { lat: coords.lat, lon: coords.lon, country: 'China' }
    }
  }
  
  try {
    console.log(`尝试API获取坐标: ${city}`)
    // 尝试使用API获取坐标（增加超时时间）
    const data = await req(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`)
    const r = (data && data.results && data.results[0]) ? data.results[0] : null
    if (!r) throw new Error('no-city')
    console.log(`API获取坐标成功: ${city} -> ${r.latitude},${r.longitude}`)
    return { lat: r.latitude, lon: r.longitude, country: r.country }
  } catch (error) {
    console.warn(`无法获取城市坐标 "${city}"，使用备用方案:`, error.message)
    
    // 备用方案1：使用省份的平均坐标
    const provinceCoords = {
      '广东': { lat: 23.3790, lon: 113.7633 },  // 广东省平均坐标
      '江苏': { lat: 32.0603, lon: 118.7969 },
      '浙江': { lat: 30.2741, lon: 120.1551 },
      '山东': { lat: 36.6512, lon: 117.1201 },
      '四川': { lat: 30.5728, lon: 104.0668 },
      '湖北': { lat: 30.5928, lon: 114.3055 },
      '湖南': { lat: 28.2282, lon: 112.9388 },
      '河南': { lat: 34.7466, lon: 113.6253 },
      '河北': { lat: 38.0428, lon: 114.5149 },
      '陕西': { lat: 34.3416, lon: 108.9398 }
    }
    
    // 检查是否为广东省的城市
    if (city.includes('广东') || city.includes('广州') || city.includes('深圳') || 
        city.includes('佛山') || city.includes('东莞') || city.includes('江门')) {
      console.log(`使用广东省平均坐标: ${city}`)
      return { lat: provinceCoords['广东'].lat, lon: provinceCoords['广东'].lon, country: 'China' }
    }
    
    // 备用方案2：使用最近的大城市坐标
    console.log(`使用默认坐标（北京）: ${city}`)
    return { lat: 39.9042, lon: 116.4074, country: 'China' }
  }
}

async function tryGetWeatherToday(city) {
  try {
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
  } catch (error) {
    // 当遇到域名校验错误或其他网络错误时，抛出错误
    console.warn('获取真实天气数据失败:', error.message)
    throw new Error(`获取天气数据失败: ${error.message}`)
  }
}

async function tryGetHourlyForecast(city) {
  try {
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
  } catch (error) {
    // 当遇到域名校验错误或其他网络错误时，抛出错误
    console.warn('获取小时预报数据失败:', error.message)
    throw new Error(`获取小时预报数据失败: ${error.message}`)
  }
}

function computeRiskFromWeather(rainProb, windSpeed) {
  if (rainProb >= 70 || windSpeed >= 10) return '高'
  if (rainProb >= 40 || windSpeed >= 6) return '中'
  return '低'
}

async function tryGetInnovationIndices(city) {
  try {
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
  } catch (error) {
    // 当遇到域名校验错误或其他网络错误时，抛出错误
    console.warn('获取创新指数数据失败:', error.message)
    throw new Error(`获取创新指数数据失败: ${error.message}`)
  }
}
