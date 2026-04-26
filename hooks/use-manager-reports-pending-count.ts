"use client"

import { useState, useEffect, useCallback } from "react"
import { reportService } from "@/lib/services/report"

/** Pending (PENDING) admin/moderator reports for manager sidebar badge. */
export function useManagerReportsPendingCount() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const reports = await reportService.listAdminReports()
      setCount(reports.filter((r) => r.status === "PENDING").length)
    } catch {
      setCount(0)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const interval = setInterval(() => {
      void refresh()
    }, 60000)
    return () => clearInterval(interval)
  }, [refresh])

  return { count, refresh }
}
