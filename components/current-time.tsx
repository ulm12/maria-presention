"use client"

import { useState, useEffect } from "react"
import { Clock, Calendar } from "lucide-react"

export function CurrentTime() {
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    setTime(new Date())
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!time) {
    return (
      <div className="text-right">
        <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded mt-1" />
      </div>
    )
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-2 text-2xl font-bold text-foreground font-mono">
        <Clock className="w-5 h-5 text-primary" />
        {formatTime(time)}
      </div>
      <div className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
        <Calendar className="w-3 h-3" />
        {formatDate(time)}
      </div>
    </div>
  )
}
