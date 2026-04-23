'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, FileText, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Project {
  id: string
  name: string
  staff_count: number
  entry_count: number
  assigned_at: string
}

interface PMProjectsViewProps {
  pmId: string
}

export default function PMProjectsView({ pmId }: PMProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('pm_token')
        if (!token) return

        const response = await fetch(`/api/pm/projects?pm_id=${pmId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }

        const data = await response.json()
        setProjects(data.projects || [])
      } catch (err) {
        console.error('[v0] Failed to fetch PM projects:', err)
        setError('Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [pmId])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading projects...</p>
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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-slate-600">
              No projects assigned to you yet.
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white/50 border-blue-100"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>
                      Assigned {new Date(project.assigned_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-blue-50/50 rounded">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-slate-600">Staff Members</p>
                      <p className="text-lg font-semibold text-slate-900">{project.staff_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 bg-purple-50/50 rounded">
                    <FileText className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-xs text-slate-600">Total Entries</p>
                      <p className="text-lg font-semibold text-slate-900">{project.entry_count}</p>
                    </div>
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
