'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Users, FileText, AlertCircle } from 'lucide-react'

interface Project {
  id: string
  name: string
  staff_count: number
  entry_count: number
  assigned_at: string
}

interface PMProjectsViewProps {
  pmId: string
  token: string
}

export default function PMProjectsView({ pmId, token }: PMProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log('[v0] Fetching PM projects for PM ID:', pmId)
        
        const response = await fetch(`/api/pm/projects?pm_id=${pmId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log('[v0] PM projects response status:', response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('[v0] Failed to fetch projects:', response.status, errorData)
          throw new Error(`Failed to fetch projects: ${response.status}`)
        }

        const data = await response.json()
        console.log('[v0] PM projects fetched:', data.projects?.length)
        setProjects(data.projects || [])
      } catch (err) {
        console.error('[v0] Failed to fetch PM projects:', err)
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    }

    if (pmId && token) {
      fetchProjects()
    }
  }, [pmId, token])

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
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </CardContent>
      </Card>
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
