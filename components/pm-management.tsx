'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Trash2, Edit2, Plus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
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

export default function PMManagement({ adminToken }: PMManagementProps) {
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

  useEffect(() => {
    fetchPMs()
    fetchProjects()
  }, [])

  const fetchPMs = async () => {
    try {
      const response = await fetch('/api/admin/project-managers', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch PMs')
      }

      const data = await response.json()
      setPMs(data.projectManagers || [])
    } catch (err) {
      console.error('[v0] Failed to fetch PMs:', err)
      setError('Failed to load Project Managers')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects', {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data.projects?.map((p: any) => p.name) || [])
    } catch (err) {
      console.error('[v0] Failed to fetch projects:', err)
    }
  }

  const handleAddPM = async () => {
    if (!newPMData.email || !newPMData.name || !newPMData.password) {
      setError('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/admin/project-managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPMData,
          projects: selectedProjects,
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to create PM')
      }

      setNewPMData({ email: '', name: '', password: '' })
      setSelectedProjects([])
      setDialogOpen(false)
      fetchPMs()
    } catch (err) {
      console.error('[v0] Failed to create PM:', err)
      setError('Failed to create Project Manager')
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
        throw new Error('Failed to delete PM')
      }

      fetchPMs()
    } catch (err) {
      console.error('[v0] Failed to delete PM:', err)
      setError('Failed to delete Project Manager')
    }
  }

  const filteredPMs = pms.filter(
    (pm) =>
      pm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pm.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return <div className="text-center py-8">Loading Project Managers...</div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header with Add Button */}
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
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Project Manager
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Project Manager</DialogTitle>
              <DialogDescription>Create a new Project Manager account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={newPMData.name}
                  onChange={(e) => setNewPMData({ ...newPMData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={newPMData.email}
                  onChange={(e) => setNewPMData({ ...newPMData, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={newPMData.password}
                  onChange={(e) => setNewPMData({ ...newPMData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assign Projects</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {projects.map((project) => (
                    <label key={project} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjects([...selectedProjects, project])
                          } else {
                            setSelectedProjects(selectedProjects.filter((p) => p !== project))
                          }
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm">{project}</span>
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={handleAddPM} className="w-full bg-blue-600 hover:bg-blue-700">
                Create Project Manager
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* PMs Table */}
      <Card className="bg-white/50">
        <CardHeader>
          <CardTitle>Project Managers</CardTitle>
          <CardDescription>Manage Project Manager accounts and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPMs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-600">
                      No Project Managers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPMs.map((pm) => (
                    <TableRow key={pm.id}>
                      <TableCell className="font-medium">{pm.name}</TableCell>
                      <TableCell>{pm.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {pm.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pm.is_active ? 'default' : 'secondary'}>
                          {pm.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(pm.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}
