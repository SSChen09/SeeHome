export async function getCityAuto() {
  const pref = wx.getStorageSync('city_pref') || { auto: true, city: '' }
  if (!pref.auto && pref.city) return pref.city
  
  try {
    const wxLocation = await getCityByWXLocation()
    if (wxLocation && wxLocation !== '未知城市') {
      wx.setStorageSync('city_pref', { auto: true, city: wxLocation })
      return wxLocation
    }
  } catch (e) {
    console.log('GPS定位失败:', e)
    wx.showToast({
      title: '定位失败，使用默认城市',
      icon: 'none',
      duration: 2000
    })
  }
  
  const finalCity = pref.city || '北京'
  wx.setStorageSync('city_pref', { auto: true, city: finalCity })
  return finalCity
}

async function getCityByWXLocation() {
  return new Promise((resolve, reject) => {
    // 显示加载提示
    wx.showLoading({ title: '定位中...', mask: true })
    
    // 检查位置权限
    wx.getSetting({
      success: (res) => {
        const locationAuth = res.authSetting['scope.userLocation']
        
        if (locationAuth === false) {
          // 用户已拒绝授权，引导用户打开设置
          wx.hideLoading()
          wx.showModal({
            title: '位置权限被拒绝',
            content: '需要位置权限来获取当地天气和灾害预警。是否打开设置重新授权？',
            confirmText: '打开设置',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.userLocation']) {
                      // 用户重新授权，递归调用获取位置
                      getCityByWXLocation().then(resolve).catch(reject)
                    } else {
                      reject(new Error('用户未授权位置权限'))
                    }
                  }
                })
              } else {
                reject(new Error('用户取消位置授权'))
              }
            }
          })
          return
        }
        
        // 获取GPS位置，使用高精度模式
        wx.getLocation({
          type: 'wgs84',
          altitude: true, // 获取海拔高度
          isHighAccuracy: true, // 高精度模式
          highAccuracyExpireTime: 5000, // 增加高精度定位超时时间到5秒
          success: async (locationRes) => {
            wx.hideLoading()
            
            // 验证GPS数据有效性
            if (!isValidGPSLocation(locationRes)) {
              wx.showToast({
                title: '定位数据无效，请重试',
                icon: 'none',
                duration: 2000
              })
              reject(new Error('GPS定位数据无效'))
              return
            }
            
            // 显示定位精度信息
            const accuracy = locationRes.horizontalAccuracy || locationRes.accuracy
            if (accuracy && accuracy > 500) {
              wx.showToast({
                title: `定位精度${Math.round(accuracy)}米，可能不准确`,
                icon: 'none',
                duration: 2500
              })
            }
            
            try {
              // 显示逆地理编码提示
              wx.showLoading({ title: '解析位置中...', mask: true })
              
              // 使用逆地理编码获取城市信息
              const city = await reverseGeocode(locationRes.latitude, locationRes.longitude)
              
              wx.hideLoading()
              
              if (city === '未知城市') {
                wx.showToast({
                  title: '无法识别当前位置',
                  icon: 'none',
                  duration: 2000
                })
                reject(new Error('无法识别当前位置'))
                return
              }
              
              // 记录定位成功
              console.log('GPS定位成功:', {
                latitude: locationRes.latitude.toFixed(6),
                longitude: locationRes.longitude.toFixed(6),
                accuracy: accuracy ? Math.round(accuracy) + '米' : '未知',
                city: city
              })
              
              // 显示定位成功提示
              wx.showToast({
                title: `已定位到${city}`,
                icon: 'success',
                duration: 1500
              })
              
              resolve(city)
            } catch (e) {
              wx.hideLoading()
              wx.showToast({
                title: '位置解析失败',
                icon: 'none',
                duration: 2000
              })
              reject(e)
            }
          },
          fail: (err) => {
            wx.hideLoading()
            
            if (err.errMsg.includes('auth deny') || err.errMsg.includes('permission')) {
              // 用户未授权，尝试请求授权
              wx.authorize({
                scope: 'scope.userLocation',
                success: () => {
                  // 授权成功，递归调用获取位置
                  getCityByWXLocation().then(resolve).catch(reject)
                },
                fail: () => {
                  wx.showToast({
                    title: '位置权限被拒绝',
                    icon: 'none',
                    duration: 2000
                  })
                  reject(new Error('用户拒绝位置授权'))
                }
              })
            } else if (err.errMsg.includes('timeout')) {
              wx.showToast({
                title: '定位超时，请检查GPS信号',
                icon: 'none',
                duration: 2000
              })
              reject(new Error('GPS定位超时'))
            } else if (err.errMsg.includes('network')) {
              wx.showToast({
                title: '网络错误，请检查网络连接',
                icon: 'none',
                duration: 2000
              })
              reject(new Error('网络错误'))
            } else {
              wx.showToast({
                title: '定位失败，请重试',
                icon: 'none',
                duration: 2000
              })
              reject(err)
            }
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        reject(err)
      }
    })
  })
}

function isValidGPSLocation(location) {
  // 验证GPS数据是否有效
  if (!location || typeof location !== 'object') return false
  
  const { latitude, longitude, accuracy, verticalAccuracy, horizontalAccuracy } = location
  
  // 检查经纬度是否在合理范围内
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false
  if (latitude < -90 || latitude > 90) return false
  if (longitude < -180 || longitude > 180) return false
  
  // 检查是否为0,0坐标（常见错误值）
  if (Math.abs(latitude) < 0.0001 && Math.abs(longitude) < 0.0001) {
    console.warn('GPS定位为0,0坐标，可能无效')
    return false
  }
  
  // 检查精度（accuracy）是否合理
  let finalAccuracy = accuracy
  if (horizontalAccuracy && typeof horizontalAccuracy === 'number') {
    finalAccuracy = horizontalAccuracy // 优先使用水平精度
  }
  
  if (finalAccuracy && typeof finalAccuracy === 'number') {
    // 如果精度大于500米，认为精度较差
    if (finalAccuracy > 500) {
      console.warn('GPS定位精度较差:', finalAccuracy, '米')
      // 精度差但仍然返回true，但会记录警告
    }
    
    // 如果精度大于5000米（5公里），认为不可用
    if (finalAccuracy > 5000) {
      console.warn('GPS定位精度太差，不可用:', finalAccuracy, '米')
      return false
    }
  }
  
  // 检查垂直精度（如果有）
  if (verticalAccuracy && typeof verticalAccuracy === 'number') {
    if (verticalAccuracy > 100) {
      console.warn('垂直定位精度较差:', verticalAccuracy, '米')
    }
  }
  
  // 检查是否为默认值或异常值
  // 中国的经纬度范围大致为：纬度 18°N ~ 54°N，经度 73°E ~ 135°E
  const isInChina = latitude >= 18 && latitude <= 54 && longitude >= 73 && longitude <= 135
  
  if (!isInChina) {
    console.warn('GPS定位不在中国范围内:', latitude, longitude)
    // 不在中国范围内，可能定位错误，但如果是边境地区可能正常
    // 这里仍然返回true，让逆地理编码处理
  }
  
  // 检查海拔高度是否合理（如果有）
  if (location.altitude !== undefined && typeof location.altitude === 'number') {
    // 中国海拔范围大致为-154米（吐鲁番）到8848米（珠穆朗玛峰）
    if (location.altitude < -200 || location.altitude > 9000) {
      console.warn('海拔高度异常:', location.altitude, '米')
    }
  }
  
  // 检查速度是否合理（如果有）
  if (location.speed !== undefined && typeof location.speed === 'number') {
    // 正常移动速度不超过200米/秒（720公里/小时）
    if (location.speed > 200) {
      console.warn('移动速度异常:', location.speed, '米/秒')
    }
  }
  
  return true
}

async function reverseGeocode(latitude, longitude) {
  return new Promise((resolve, reject) => {
    // 方案1：使用腾讯地图逆地理编码API（主要方案）
    const qqMapUrl = `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77&get_poi=0`
    
    wx.request({
      url: qqMapUrl,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.status === 0 && res.data.result) {
          const address = res.data.result.address_component
          // 优先返回城市，如果没有则返回省份
          const city = address.city || address.province || '未知城市'
          console.log('腾讯地图逆地理编码成功:', city)
          resolve(city.replace('市', '')) // 去掉"市"字
        } else {
          // 腾讯地图失败，尝试备用方案
          tryBackupGeocode(latitude, longitude).then(resolve).catch(reject)
        }
      },
      fail: (err) => {
        console.warn('腾讯地图逆地理编码失败:', err)
        // 腾讯地图失败，尝试备用方案
        tryBackupGeocode(latitude, longitude).then(resolve).catch(reject)
      }
    })
  })
}

async function tryBackupGeocode(latitude, longitude) {
  return new Promise((resolve, reject) => {
    // 方案2：使用高德地图逆地理编码API（备用方案）
    // 注意：需要在小程序后台配置合法域名：https://restapi.amap.com
    const amapUrl = `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=YOUR_AMAP_KEY&radius=1000&extensions=base`
    
    wx.request({
      url: amapUrl,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.status === '1' && res.data.regeocode) {
          const address = res.data.regeocode.addressComponent
          const city = address.city || address.province || '未知城市'
          console.log('高德地图逆地理编码成功:', city)
          resolve(city.replace('市', ''))
        } else {
          // 方案3：使用本地坐标匹配（最后备选）
          const city = getCityByCoordinates(latitude, longitude)
          if (city) {
            console.log('本地坐标匹配成功:', city)
            resolve(city)
          } else {
            reject(new Error('所有逆地理编码方案都失败'))
          }
        }
      },
      fail: () => {
        // 方案3：使用本地坐标匹配（最后备选）
        const city = getCityByCoordinates(latitude, longitude)
        if (city) {
          console.log('本地坐标匹配成功:', city)
          resolve(city)
        } else {
          reject(new Error('所有逆地理编码方案都失败'))
        }
      }
    })
  })
}

function getCityByCoordinates(latitude, longitude) {
  // 中国主要城市坐标范围匹配
  const cityCoordinates = [
    { city: '北京', latMin: 39.4, latMax: 40.5, lonMin: 115.7, lonMax: 117.4 },
    { city: '上海', latMin: 30.5, latMax: 31.8, lonMin: 120.8, lonMax: 122.2 },
    { city: '广州', latMin: 22.5, latMax: 23.9, lonMin: 112.9, lonMax: 114.1 },
    { city: '深圳', latMin: 22.4, latMax: 22.9, lonMin: 113.7, lonMax: 114.6 },
    { city: '杭州', latMin: 29.9, latMax: 30.7, lonMin: 119.5, lonMax: 120.9 },
    { city: '南京', latMin: 31.2, latMax: 32.7, lonMin: 118.3, lonMax: 119.2 },
    { city: '成都', latMin: 30.0, latMax: 31.5, lonMin: 103.5, lonMax: 104.5 },
    { city: '武汉', latMin: 30.3, latMax: 30.9, lonMin: 113.8, lonMax: 114.6 },
    { city: '西安', latMin: 33.9, latMax: 34.5, lonMin: 108.7, lonMax: 109.2 },
    { city: '重庆', latMin: 29.0, latMax: 30.2, lonMin: 106.0, lonMax: 107.5 }
  ]
  
  for (const city of cityCoordinates) {
    if (latitude >= city.latMin && latitude <= city.latMax &&
        longitude >= city.lonMin && longitude <= city.lonMax) {
      return city.city
    }
  }
  
  return null
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


