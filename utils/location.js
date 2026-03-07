export async function getCityAuto() {
  const pref = wx.getStorageSync('city_pref') || { auto: true, city: '' }
  if (!pref.auto && pref.city) return pref.city
  
  // 完全使用GPS定位，不依赖IP定位
  try {
    // 使用微信GPS定位API获取精确位置
    const wxLocation = await getCityByWXLocation()
    if (wxLocation && wxLocation !== '未知城市') {
      wx.setStorageSync('city_pref', { auto: true, city: wxLocation })
      return wxLocation
    }
  } catch (e) {
    console.log('GPS定位失败:', e)
    // GPS定位失败时，给用户友好的提示
    wx.showToast({
      title: '定位失败，使用默认城市',
      icon: 'none',
      duration: 2000
    })
  }
  
  // 使用缓存或默认值
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
          highAccuracyExpireTime: 3000, // 高精度定位超时时间
          success: async (locationRes) => {
            wx.hideLoading()
            
            // 验证GPS数据有效性
            if (!isValidGPSLocation(locationRes)) {
              reject(new Error('GPS定位数据无效'))
              return
            }
            
            try {
              // 使用逆地理编码获取城市信息
              const city = await reverseGeocode(locationRes.latitude, locationRes.longitude)
              
              // 记录定位成功
              console.log('GPS定位成功:', {
                latitude: locationRes.latitude,
                longitude: locationRes.longitude,
                accuracy: locationRes.accuracy,
                city: city
              })
              
              resolve(city)
            } catch (e) {
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
  
  const { latitude, longitude, accuracy } = location
  
  // 检查经纬度是否在合理范围内
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false
  if (latitude < -90 || latitude > 90) return false
  if (longitude < -180 || longitude > 180) return false
  
  // 检查精度（accuracy）是否合理
  if (accuracy && typeof accuracy === 'number') {
    // 如果精度大于1000米（1公里），认为精度较差
    if (accuracy > 1000) {
      console.warn('GPS定位精度较差:', accuracy, '米')
      // 精度差但仍然返回true，让用户决定是否使用
    }
  }
  
  // 检查是否为默认值或异常值
  if (latitude === 0 && longitude === 0) return false
  
  return true
}

async function reverseGeocode(latitude, longitude) {
  return new Promise((resolve, reject) => {
    // 使用腾讯地图逆地理编码API
    const url = `https://apis.map.qq.com/ws/geocoder/v1/?location=${latitude},${longitude}&key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-WPB77&get_poi=0`
    
    wx.request({
      url,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.status === 0 && res.data.result) {
          const address = res.data.result.address_component
          // 优先返回城市，如果没有则返回省份
          const city = address.city || address.province || '未知城市'
          resolve(city.replace('市', '')) // 去掉"市"字
        } else {
          reject(new Error('逆地理编码失败'))
        }
      },
      fail: reject
    })
  })
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


