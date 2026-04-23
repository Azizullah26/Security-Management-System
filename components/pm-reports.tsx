'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Download } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProjectStats {
  project_name: string
  total_entries: number
  total_staff: number
  average_duration: string
  last_updated: string
}

interface PMReportsProps {
  pmId: string
}

export default function PMReports({ pmId }: PMReportsProps) {
  const [stats, setStats] = useState<ProjectStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('pm_token')
        if (!token) return

        const response = await fetch(`/api/pm/reports?pm_id=${pmId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch reports')
        }

        const data = await response.json()
        setStats(data.stats || [])
      } catch (err) {
        console.error('[v0] Failed to fetch PM reports:', err)
        setError('Failed to load reports')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [pmId])

  const handleDownloadReport = async () => {
    try {
      const token = localStorage.getItem('pm_token')
      if (!token) return

      const response = await fetch(`/api/pm/reports/export?pm_id=${pmId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pm-report-${new Date().getTime()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('[v0] Failed to download report:', err)
      setError('Failed to download report')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading reports...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleDownloadReport}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report (CSV)
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-slate-600">
              No data available for reports yet.
            </CardContent>
          </Card>
        ) : (
          stats.map((stat) => (
            <Card key={stat.project_name} className="bg-white/50 border-blue-100">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg">{stat.project_name}</CardTitle>
                    <CardDescription>
                      Updated {new Date(stat.last_updated).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-slate-600 mb-1">Total Entries</p>
                    <p className="text-2xl font-bold text-blue-600">{stat.total_entries}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-xs text-slate-600 mb-1">Staff Count</p>
                    <p className="text-2xl font-bold text-purple-600">{stat.total_staff}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-slate-600 mb-1">Avg Duration</p>
                    <p className="text-sm font-bold text-green-600">{stat.average_duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
