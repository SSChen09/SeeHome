import { getDisasterRisk, getHourlyForecast } from '../../utils/api'
import { getCityAuto } from '../../utils/location'

Page({
  data: {
    risk: { rain: '低', typhoon: '低', flood: '低' },
    hourly: { items: [] }
  },
  onLoad() {
    this.refresh()
  },
  async refresh() {
    const risk = await getDisasterRisk()
    const city = await getCityAuto()
    const hourly = await getHourlyForecast(city)
    this.setData({ risk, hourly })
  },
  badgeClass(level) {
    if (level === '高') return 'danger badge'
    if (level === '中') return 'warning badge'
    return 'success badge'
  }
})
