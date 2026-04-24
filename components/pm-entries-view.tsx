'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Loader2, AlertCircle, Search, Calendar, FileText } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Entry {
  id: string
  duration: string
  project_name: string
  created_at: string
  email: string
  number_of_persons: string
  contact_number: string
  status: string
  category: string
  name: string
  company: string
  phone: string
}

interface Props {
  pmId: string
  token: string
  assignedProjects: string[]
}

export default function PMEntriesView({ pmId, token, assignedProjects }: Props) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('all')

  useEffect(() => {
    fetchEntries()
  }, [token])

  useEffect(() => {
    filterEntries()
  }, [entries, searchQuery, selectedProject])

  const fetchEntries = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/pm/entries', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch entries')
      console.log('[v0] Fetched entries:', data.entries?.length)
      setEntries(data.entries || [])
    } catch (err) {
      console.error('[v0] Entries fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load entries')
    } finally {
      setLoading(false)
    }
  }

  const filterEntries = () => {
    let filtered = entries

    // Filter by selected project
    if (selectedProject !== 'all') {
      filtered = filtered.filter(e => e.project_name === selectedProject)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        e =>
          e.name?.toLowerCase().includes(query) ||
          e.email?.toLowerCase().includes(query) ||
          e.company?.toLowerCase().includes(query) ||
          e.category?.toLowerCase().includes(query) ||
          e.project_name?.toLowerCase().includes(query),
      )
    }

    setFilteredEntries(filtered)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading entries...
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 flex items-start gap-3 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Failed to load entries</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Project Entries</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Viewing {filteredEntries.length} of {entries.length} entries
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchEntries}
          className="gap-2"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, company, or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 hover:border-slate-400"
        >
          <option value="all">All Projects ({assignedProjects.length})</option>
          {assignedProjects.map(project => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filteredEntries.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No entries found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery ? 'Try adjusting your search filters' : 'No entries recorded yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="text-xs font-semibold text-slate-600">Project</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Name</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Company</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map(entry => (
                <TableRow key={entry.id} className="border-slate-100 hover:bg-slate-50">
                  <TableCell className="text-sm text-slate-900">
                    <Badge variant="outline" className="text-xs">
                      {entry.project_name}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-900">{entry.name || '-'}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {entry.category || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{entry.company || '-'}</TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <Badge
                      variant={entry.status === 'exited' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {entry.status || 'unknown'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
