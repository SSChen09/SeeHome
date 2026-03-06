export function computeFireRisk(sensor) {
  const t = sensor.temperature || 0
  const s = sensor.smoke || 0
  const g = sensor.gas || 0
  let score = 0
  if (t >= 35) score += 2
  else if (t >= 30) score += 1
  if (s >= 40) score += 2
  else if (s >= 20) score += 1
  if (g >= 80) score += 2
  else if (g >= 50) score += 1
  if (score >= 5) return '高'
  if (score >= 3) return '中'
  return '低'
}

export function detectAnomalies(sensor) {
  const anomalies = []
  if (sensor.gas >= 50) anomalies.push('燃气浓度异常')
  if (sensor.smoke >= 20) anomalies.push('烟雾浓度异常')
  if (sensor.temperature >= 35) anomalies.push('温度过高')
  return anomalies
}
