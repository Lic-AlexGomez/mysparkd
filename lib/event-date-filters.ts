export type DateRangePreset = "all" | "week" | "month" | "twoMonths"

export function dateRangeFromPreset(preset: DateRangePreset): { dateFrom?: string; dateTo?: string } {
  if (preset === "all") return {}
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (preset === "week") {
    end.setDate(end.getDate() + 7)
  } else if (preset === "month") {
    end.setMonth(end.getMonth() + 1)
  } else if (preset === "twoMonths") {
    end.setMonth(end.getMonth() + 2)
  }

  return {
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
  }
}

export const DISTANCE_RADIUS_OPTIONS = [10, 25, 50, 100] as const
export type DistanceRadiusKm = (typeof DISTANCE_RADIUS_OPTIONS)[number]

export const DISCOVER_RADIUS_OPTIONS = [
  { label: "Mi país", km: 1500 },
  { label: "100 km", km: 100 },
  { label: "50 km", km: 50 },
  { label: "20 km", km: 20 },
] as const
