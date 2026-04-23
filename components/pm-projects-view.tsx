'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, FolderOpen, Users, FileText, AlertCircle, Clock } from 'lucide-react'

interface Project {
  id: string
  name: string
  staff_count: number
  entry_count: number
  assigned_at: string
}

interface Props {
  pmId: string
  token: string
}

export default function PMProjectsView({ pmId, token }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [token])

  const fetchProjects = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pm/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading projects...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">My Projects</h2>
          <p className="text-sm text-slate-500">Projects currently assigned to you</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProjects} disabled={loading}>
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

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FolderOpen className="h-10 w-10 mb-3 opacity-40" />
            <p className="font-medium text-slate-500">No projects assigned</p>
            <p className="text-sm mt-1">Ask your administrator to assign projects to your account.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <Card key={project.id} className="border-slate-200 hover:border-blue-200 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-semibold text-slate-900 leading-snug">
                    {project.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500 text-xs mb-1">
                      <Users className="h-3 w-3" />
                      Staff
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{project.staff_count}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-slate-500 text-xs mb-1">
                      <FileText className="h-3 w-3" />
                      Records
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{project.entry_count}</p>
                  </div>
                </div>
                {project.assigned_at && (
                  <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    Assigned {new Date(project.assigned_at).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {projects.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-2">
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 gap-1.5">
            <FolderOpen className="h-3 w-3" />
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 gap-1.5">
            <Users className="h-3 w-3" />
            {projects.reduce((s, p) => s + p.staff_count, 0)} total staff
          </Badge>
          <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 gap-1.5">
            <FileText className="h-3 w-3" />
            {projects.reduce((s, p) => s + p.entry_count, 0)} total records
          </Badge>
        </div>
      )}
    </div>
  )
}
