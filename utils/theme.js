export function getThemePreference() {
  const pref = wx.getStorageSync('theme_pref') || { theme: 'light', accent: 'blue' }
  return pref
}

export function setThemePreference(pref) {
  wx.setStorageSync('theme_pref', pref)
}

export function getThemeClasses() {
  const pref = getThemePreference()
  const themeClass = pref.theme === 'dark' ? 'theme-dark' : 'theme-light'
  const accentClass = pref.accent === 'amber' ? 'accent-amber' : pref.accent === 'green' ? 'accent-green' : 'accent-blue'
  return { themeClass, accentClass }
}

export function applyNavColor() {
  const pref = getThemePreference()
  const bg = pref.theme === 'dark' ? '#121212' : pref.accent === 'amber' ? '#fb8c00' : pref.accent === 'green' ? '#43a047' : '#1e88e5'
  const front = pref.theme === 'dark' ? '#ffffff' : '#ffffff'
  wx.setNavigationBarColor({ frontColor: front, backgroundColor: bg })
}
