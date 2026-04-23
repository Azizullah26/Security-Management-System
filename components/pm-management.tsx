'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, Trash2, Plus, Loader2, CheckSquare, Square, RefreshCw, ChevronDown } from 'lucide-react'

interface ProjectManager {
  id: string
  name: string
  username: string
  email: string
  is_active: boolean
  created_at: string
  assigned_projects: string[]
}

export function PMManagement() {
  const [pms, setPMs] = useState<ProjectManager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Projects list
  const [projects, setProjects] = useState<string[]>([])
  const [projectsLoading, setProjectsLoading] = useState(false)
  const [projectSearch, setProjectSearch] = useState('')

  useEffect(() => {
    fetchPMs()
    fetchProjects()
  }, [])

  const fetchPMs = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/project-managers', {
        credentials: 'include',
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${response.status}`)
      }
      const data = await response.json()
      setPMs(data.projectManagers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Project Managers')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    setProjectsLoading(true)
    try {
      // No auth needed — service role fetches from assignments table
      const response = await fetch('/api/admin/available-projects')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleOpenDialog = () => {
    setFullName('')
    setUsername('')
    setPassword('')
    setSelectedProjects([])
    setFormError('')
    setProjectSearch('')
    setDialogOpen(true)
  }

  const toggleProject = (name: string) => {
    setSelectedProjects(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    )
  }

  const handleCreatePM = async () => {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setFormError('Full name, username, and password are required.')
      return
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    setFormError('')
    try {
      const response = await fetch('/api/admin/project-managers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          username: username.trim(),
          password,
          projects: selectedProjects,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Project Manager')
      }

      setDialogOpen(false)
      setSuccessMsg(`Project Manager "${fullName}" created successfully.`)
      setTimeout(() => setSuccessMsg(''), 5000)
      await fetchPMs()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create Project Manager')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (pmId: string, pmName: string) => {
    if (!confirm(`Are you sure you want to delete "${pmName}"? This cannot be undone.`)) return
    try {
      const response = await fetch(`/api/admin/project-managers/${pmId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) throw new Error('Failed to delete')
      setSuccessMsg(`Project Manager "${pmName}" deleted.`)
      setTimeout(() => setSuccessMsg(''), 4000)
      await fetchPMs()
    } catch {
      setError('Failed to delete Project Manager')
    }
  }

  const filteredPMs = pms.filter(
    pm =>
      pm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pm.username?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredProjects = projects.filter(p =>
    p.toLowerCase().includes(projectSearch.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckSquare className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by name or username..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button variant="outline" size="sm" onClick={fetchPMs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <div className="ml-auto">
          <Button onClick={handleOpenDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Project Manager
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Project Managers</CardTitle>
          <CardDescription>Manage Project Manager accounts and their assigned projects.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600 mr-3" />
              <span className="text-slate-500">Loading...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Full Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Username</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Assigned Projects</TableHead>
                    <TableHead className="font-semibold text-slate-700">Created</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPMs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                        {pms.length === 0
                          ? 'No Project Managers yet. Click "Add Project Manager" to create one.'
                          : 'No results match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPMs.map(pm => (
                      <TableRow key={pm.id} className="hover:bg-slate-50/60 border-slate-100">
                        <TableCell className="font-medium text-slate-900">{pm.name}</TableCell>
                        <TableCell className="text-slate-600 font-mono text-sm">{pm.username}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={pm.is_active
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'}
                          >
                            {pm.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {pm.assigned_projects && pm.assigned_projects.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {pm.assigned_projects.slice(0, 2).map(p => (
                                <Badge key={p} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs max-w-[180px] truncate">
                                  {p}
                                </Badge>
                              ))}
                              {pm.assigned_projects.length > 2 && (
                                <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200 text-xs">
                                  +{pm.assigned_projects.length - 2} more
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">No projects assigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {new Date(pm.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pm.id, pm.name)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
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

      {/* Create PM Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Project Manager</DialogTitle>
            <DialogDescription>Create a new PM account and assign projects.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {formError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                {formError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. John Smith"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <Input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. john.smith"
                disabled={isSubmitting}
                autoCapitalize="none"
              />
              <p className="text-xs text-slate-400 mt-1">PM will log in with this username.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                disabled={isSubmitting}
              />
            </div>

            {/* Project assignment */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">
                  Assign Projects
                  {selectedProjects.length > 0 && (
                    <span className="ml-2 text-blue-600 font-normal">({selectedProjects.length} selected)</span>
                  )}
                </label>
                <button
                  type="button"
                  onClick={fetchProjects}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  disabled={projectsLoading}
                >
                  <RefreshCw className={`h-3 w-3 ${projectsLoading ? 'animate-spin' : ''}`} />
                  Reload
                </button>
              </div>

              <Input
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                placeholder="Search projects..."
                className="mb-2 h-8 text-sm"
              />

              <div className="border rounded-lg overflow-hidden">
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading projects...
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-sm">
                    {projects.length === 0 ? 'No projects found in assignments table.' : 'No matches for your search.'}
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {filteredProjects.map(projectName => {
                      const checked = selectedProjects.includes(projectName)
                      return (
                        <button
                          key={projectName}
                          type="button"
                          onClick={() => toggleProject(projectName)}
                          disabled={isSubmitting}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors
                            ${checked
                              ? 'bg-blue-50 text-blue-900'
                              : 'bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                          {checked
                            ? <CheckSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            : <Square className="h-4 w-4 text-slate-300 flex-shrink-0" />
                          }
                          <span className="leading-snug">{projectName}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePM}
                disabled={isSubmitting || !fullName.trim() || !username.trim() || !password.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
