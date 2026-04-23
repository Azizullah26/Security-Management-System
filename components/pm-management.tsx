'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Trash2, Plus, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProjectManager {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  created_at: string
  assigned_projects?: string[]
}

interface PMManagementProps {
  adminToken?: string
}

export function PMManagement({ adminToken }: PMManagementProps) {
  const [pms, setPMs] = useState<ProjectManager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPM, setEditingPM] = useState<ProjectManager | null>(null)
  const [newPMData, setNewPMData] = useState({
    email: '',
    name: '',
    password: '',
  })
  const [projects, setProjects] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    console.log('[v0] PMManagement component mounted')
    fetchPMs()
    fetchProjects()
  }, [])

  const fetchPMs = async () => {
    try {
      console.log('[v0] Fetching Project Managers...')
      const response = await fetch('/api/admin/project-managers', {
        credentials: 'include',
      })

      console.log('[v0] PM API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('[v0] Fetched PMs:', data)
      setPMs(data.projectManagers || [])
      setError('')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('[v0] Failed to fetch PMs:', errorMsg)
      setError(`Failed to load Project Managers: ${errorMsg}`)
      setPMs([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      console.log('[v0] Fetching available projects...')
      const response = await fetch('/api/admin/available-projects', {
        credentials: 'include',
      })

      if (!response.ok) {
        console.warn('[v0] Failed to fetch projects:', response.status)
        return
      }

      const data = await response.json()
      console.log('[v0] Fetched available projects:', data.projects)
      // Projects come back as objects with id and name
      setProjects(data.projects || [])
    } catch (err) {
      console.error('[v0] Error fetching projects:', err)
    }
  }

  const handleAddPM = async () => {
    if (!newPMData.email || !newPMData.name || !newPMData.password) {
      setError('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/project-managers', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPMData,
          projects: selectedProjects,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create Project Manager')
      }

      setNewPMData({ email: '', name: '', password: '' })
      setSelectedProjects([])
      setDialogOpen(false)
      await fetchPMs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PM')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePM = async (pmId: string) => {
    if (!confirm('Are you sure you want to delete this Project Manager?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/project-managers/${pmId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to delete Project Manager')
      }

      await fetchPMs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete PM')
    }
  }

  const filteredPMs = pms.filter(
    (pm) =>
      pm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pm.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && !error.includes('Unauthorized') && (
        <Card className="border-red-200 bg-red-50 mb-4">
          <CardContent className="p-4 flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Header Section */}
      <div className="flex justify-between items-center gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-slate-200"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Project Manager
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Project Manager</DialogTitle>
              <DialogDescription>Create a new Project Manager account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <Input
                  value={newPMData.name}
                  onChange={(e) => setNewPMData({ ...newPMData, name: e.target.value })}
                  placeholder="John Doe"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <Input
                  type="email"
                  value={newPMData.email}
                  onChange={(e) => setNewPMData({ ...newPMData, email: e.target.value })}
                  placeholder="john@company.com"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password *</label>
                <Input
                  type="password"
                  value={newPMData.password}
                  onChange={(e) => setNewPMData({ ...newPMData, password: e.target.value })}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Assign Projects</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                  {projects.length === 0 ? (
                    <p className="text-sm text-slate-500">No projects available</p>
                  ) : (
                    projects.map((projectName: string) => (
                      <label key={projectName} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedProjects.includes(projectName)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects([...selectedProjects, projectName])
                            } else {
                              setSelectedProjects(selectedProjects.filter((p) => p !== projectName))
                            }
                          }}
                          disabled={isSubmitting}
                          className="rounded"
                        />
                        <span className="text-sm">{projectName}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <Button
                onClick={handleAddPM}
                disabled={isSubmitting || !newPMData.email || !newPMData.name || !newPMData.password}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Project Manager'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content Card */}
      <Card className="bg-white/50 border-slate-200">
        <CardHeader>
          <CardTitle>Project Managers</CardTitle>
          <CardDescription>Manage Project Manager accounts and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-slate-600">Loading Project Managers...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPMs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        {pms.length === 0 ? 'No Project Managers yet. Create one to get started.' : 'No matches found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPMs.map((pm) => (
                      <TableRow key={pm.id} className="border-slate-100 hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900">{pm.name}</TableCell>
                        <TableCell className="text-slate-600">{pm.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {pm.role || 'Project Manager'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pm.is_active ? 'default' : 'secondary'} className={pm.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-800'}>
                            {pm.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {new Date(pm.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePM(pm.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
