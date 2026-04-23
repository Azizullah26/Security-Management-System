'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Loader2, AlertCircle, Users, FileText, BarChart2, Clock, Activity } from 'lucide-react'

interface ProjectStat {
  project_name: string
  total_staff: number
  total_entries: number
  total_reports: number
  last_activity: string | null
}

interface Props {
  pmId: string
  token: string
}

export default function PMReportsView({ pmId, token }: Props) {
  const [stats, setStats] = useState<ProjectStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [token])

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pm/reports', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setStats(data.stats || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const totals = stats.reduce(
    (acc, s) => ({
      staff: acc.staff + s.total_staff,
      entries: acc.entries + s.total_entries,
      reports: acc.reports + s.total_reports,
    }),
    { staff: 0, entries: 0, reports: 0 },
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading reports...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
          <p className="text-sm text-slate-500">Activity summary across your assigned projects</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-slate-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totals.staff}</p>
                  <p className="text-xs text-slate-500">Total Staff</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totals.entries}</p>
                  <p className="text-xs text-slate-500">Total Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totals.reports}</p>
                  <p className="text-xs text-slate-500">Security Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-project breakdown */}
      {stats.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BarChart2 className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium text-slate-500">No data available</p>
            <p className="text-sm mt-1">No projects assigned or no records yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Per-Project Breakdown</h3>
          {stats.map(stat => (
            <Card key={stat.project_name} className="border-slate-200">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold text-slate-900">{stat.project_name}</CardTitle>
                  {stat.last_activity && (
                    <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      Last: {new Date(stat.last_activity).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center bg-slate-50 rounded-lg p-2.5">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                      <Users className="h-3 w-3" />
                      Staff
                    </div>
                    <p className="text-xl font-bold text-slate-900">{stat.total_staff}</p>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg p-2.5">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                      <FileText className="h-3 w-3" />
                      Entries
                    </div>
                    <p className="text-xl font-bold text-slate-900">{stat.total_entries}</p>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg p-2.5">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                      <Activity className="h-3 w-3" />
                      Reports
                    </div>
                    <p className="text-xl font-bold text-slate-900">{stat.total_reports}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
