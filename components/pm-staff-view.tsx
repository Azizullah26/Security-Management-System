'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Loader2, Search, Users, AlertCircle } from 'lucide-react'

interface StaffRecord {
  id: string
  staff_id: string
  staff_name: string
  project_name: string
  created_at: string
}

interface Props {
  pmId: string
  token: string
  assignedProjects: string[]
}

export default function PMStaffView({ pmId, token, assignedProjects }: Props) {
  const [staff, setStaff] = useState<StaffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState('all')

  useEffect(() => {
    fetchStaff()
  }, [token, selectedProject])

  const fetchStaff = async () => {
    setLoading(true)
    setError('')
    try {
      const url = selectedProject === 'all'
        ? '/api/pm/staff'
        : `/api/pm/staff?project=${encodeURIComponent(selectedProject)}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch')
      setStaff(data.staff || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff')
    } finally {
      setLoading(false)
    }
  }

  const filtered = staff.filter(s =>
    s.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.staff_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.project_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Staff Records</h2>
          <p className="text-sm text-slate-500">Staff assigned to your projects</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStaff} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        {assignedProjects.length > 1 && (
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {assignedProjects.map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {loading ? 'Loading...' : `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`}
            </CardTitle>
            <Badge variant="outline" className="text-xs text-slate-500">
              <Users className="h-3 w-3 mr-1" />
              {staff.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading staff...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Staff Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Staff ID</TableHead>
                    <TableHead className="font-semibold text-slate-700">Project</TableHead>
                    <TableHead className="font-semibold text-slate-700">Assigned Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-400">
                        {staff.length === 0
                          ? 'No staff assigned to your projects yet.'
                          : 'No results match your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map(record => (
                      <TableRow key={record.id} className="border-slate-100 hover:bg-slate-50/60">
                        <TableCell className="font-medium text-slate-900">{record.staff_name}</TableCell>
                        <TableCell className="text-slate-500 font-mono text-sm">{record.staff_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs max-w-[180px] truncate">
                            {record.project_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}
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
