"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle } from "lucide-react"
import type { EntryData } from "./entry-form"

interface TimeTrackerProps {
  entries: EntryData[]
}

export function TimeTracker({ entries }: TimeTrackerProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // Update every second instead of every minute for live seconds

    return () => clearInterval(timer)
  }, [])

  const calculateDuration = (entryTime: string): { hours: number; minutes: number; isOvertime: boolean } => {
    const entry = new Date(entryTime)
    const now = currentTime
    const diffMs = now.getTime() - entry.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return {
      hours: diffHours,
      minutes: diffMinutes,
      isOvertime: diffHours >= 8, // Flag if someone has been inside for 8+ hours
    }
  }

  const formatDuration = (hours: number, minutes: number): string => {
    if (hours === 0) {
      return `${minutes}m`
    }
    return `${hours}h ${minutes}m`
  }

  const insideEntries = entries.filter((entry) => entry.status === "inside")
  const overtimeEntries = insideEntries.filter((entry) => calculateDuration(entry.entryTime).isOvertime)

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Current Time Display */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Live Time Tracking</span>
            <span className="sm:hidden">Live Time</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 sm:pb-4">
          <div className="text-lg sm:text-2xl font-mono font-bold text-center">
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="text-center text-xs sm:text-sm text-gray-600 mt-1">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "short", // Shortened weekday for mobile
              year: "numeric",
              month: "short", // Shortened month for mobile
              day: "numeric",
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overtime Alerts */}
      {overtimeEntries.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-orange-800">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Overtime Alert</span>
              <span className="sm:hidden">Overtime</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 sm:pb-4">
            <p className="text-xs sm:text-sm text-orange-700 mb-2 sm:mb-3">
              {overtimeEntries.length} {overtimeEntries.length === 1 ? "person has" : "people have"} been inside for 8+
              hours
            </p>
            <div className="space-y-1.5 sm:space-y-2">
              {overtimeEntries.slice(0, 3).map((entry) => {
                const duration = calculateDuration(entry.entryTime)
                return (
                  <div key={entry.id} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium truncate pr-2">{entry.name}</span>
                    <Badge variant="destructive" className="text-xs flex-shrink-0">
                      {formatDuration(duration.hours, duration.minutes)}
                    </Badge>
                  </div>
                )
              })}
              {overtimeEntries.length > 3 && (
                <p className="text-xs text-orange-600">+{overtimeEntries.length - 3} more</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Currently Inside Summary */}
      <Card>
        <CardHeader className="pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">
            <span className="hidden sm:inline">Currently Inside ({insideEntries.length})</span>
            <span className="sm:hidden">Inside ({insideEntries.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 sm:pb-4">
          {insideEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-3 sm:py-4 text-sm">No one currently inside</p>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
              {insideEntries.map((entry) => {
                const duration = calculateDuration(entry.entryTime)
                return (
                  <div key={entry.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-medium text-xs sm:text-sm truncate">{entry.name}</div>
                      <div className="text-xs text-gray-600 truncate">{entry.company || entry.category}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant={duration.isOvertime ? "destructive" : "secondary"} className="text-xs mb-1">
                        {formatDuration(duration.hours, duration.minutes)}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.entryTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
