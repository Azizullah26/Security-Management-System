'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, Eye } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface StaffRecord {
  id: string
  name: string
  category: string
  company: string
  project_name: string
  entry_count: number
  last_entry: string | null
}

interface PMStaffManagementProps {
  pmId: string
}

export default function PMStaffManagement({ pmId }: PMStaffManagementProps) {
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')
  const [projects, setProjects] = useState<string[]>([])

  useEffect(() => {
    const fetchStaffAndProjects = async () => {
      try {
        const token = localStorage.getItem('pm_token')
        if (!token) return

        // Fetch projects first
        const projectsResponse = await fetch(`/api/pm/projects?pm_id=${pmId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const projectsData = await projectsResponse.json()
        const projectNames = projectsData.projects?.map((p: any) => p.name) || []
        setProjects(projectNames)

        // Fetch staff records
        const staffResponse = await fetch(
          `/api/pm/staff?pm_id=${pmId}&project=${selectedProject !== 'all' ? selectedProject : ''}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        if (!staffResponse.ok) {
          throw new Error('Failed to fetch staff records')
        }

        const staffData = await staffResponse.json()
        setStaff(staffData.staff || [])
      } catch (err) {
        console.error('[v0] Failed to fetch staff data:', err)
        setError('Failed to load staff records')
      } finally {
        setLoading(false)
      }
    }

    fetchStaffAndProjects()
  }, [pmId, selectedProject])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      visitor: 'bg-blue-50 text-blue-700 border-blue-200',
      contractor: 'bg-orange-50 text-orange-700 border-orange-200',
      employee: 'bg-green-50 text-green-700 border-green-200',
      other: 'bg-slate-50 text-slate-700 border-slate-200',
    }
    return colors[category.toLowerCase()] || colors.other
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading staff records...</p>
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
      {/* Filter Bar */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Button
          variant={selectedProject === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedProject('all')}
          className="whitespace-nowrap"
        >
          All Projects
        </Button>
        {projects.map((project) => (
          <Button
            key={project}
            variant={selectedProject === project ? 'default' : 'outline'}
            onClick={() => setSelectedProject(project)}
            className="whitespace-nowrap"
          >
            {project}
          </Button>
        ))}
      </div>

      {/* Staff Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-slate-600">
              No staff records found for the selected project.
            </CardContent>
          </Card>
        ) : (
          staff.map((person) => (
            <Card key={person.id} className="bg-white/50 border-blue-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">{person.name}</CardTitle>
                    <CardDescription className="text-xs">{person.company}</CardDescription>
                  </div>
                  <Badge variant="outline" className={getCategoryColor(person.category)}>
                    {person.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="text-sm">
                    <span className="text-slate-600">Project:</span>
                    <p className="font-medium text-slate-900">{person.project_name}</p>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-600">Total Entries:</span>
                    <p className="font-medium text-slate-900">{person.entry_count}</p>
                  </div>
                  {person.last_entry && (
                    <div className="text-sm">
                      <span className="text-slate-600">Last Entry:</span>
                      <p className="font-medium text-slate-900">
                        {new Date(person.last_entry).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
