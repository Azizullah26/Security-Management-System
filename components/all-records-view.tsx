"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Clock, Download } from "lucide-react"
import type { EntryData } from "./entry-form"

interface AllRecordsViewProps {
  entries?: EntryData[]
}

export function AllRecordsView({ entries }: AllRecordsViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [selectedEntry, setSelectedEntry] = useState<EntryData | null>(null)
  const [localEntries, setLocalEntries] = useState<EntryData[]>([])
  const [projects, setProjects] = useState<any[]>([])

  // Load entries from database and projects from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("admin-token")
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }

        // Load entries from database
        const entriesResponse = await fetch("/api/records", {
          credentials: "include", // Include authentication cookies as fallback
          headers,
        })
        if (entriesResponse.ok) {
          const data = await entriesResponse.json()
          setLocalEntries(data.records || [])
        } else {
          console.error("Failed to fetch entries:", entriesResponse.status)
        }

        // Load projects for project filter
        const projectsResponse = await fetch("/api/projects", {
          credentials: "include", // Include authentication cookies as fallback
          headers,
        })
        if (projectsResponse.ok) {
          const data = await projectsResponse.json()
          setProjects(data.projects || data || [])
        } else {
          console.error("Failed to fetch projects:", projectsResponse.status)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }
    loadData()
  }, []) // Run only once on mount

  // Use provided entries or local entries (only fall back when entries is undefined)
  const allEntries = entries ?? localEntries

  // Filter entries based on search term, category, status, and project
  const filteredEntries = allEntries.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.contactNumber.includes(searchTerm) ||
      entry.purpose.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || entry.category.toLowerCase() === categoryFilter.toLowerCase()
    const matchesStatus = statusFilter === "all" || entry.status === statusFilter
    const matchesProject = projectFilter === "all" || entry.projectName === projectFilter

    return matchesSearch && matchesCategory && matchesStatus && matchesProject
  })

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return "N/A"

    try {
      const date = new Date(isoString)
      // Check if date is valid
      if (isNaN(date.getTime())) return "Invalid Date"

      return date.toLocaleString("en-US", {
        timeZone: "Asia/Dubai",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("[v0] Error formatting date:", error)
      return "Invalid Date"
    }
  }

  const calculateDuration = (entryTime: string, exitTime?: string): string => {
    const entry = new Date(entryTime)
    const exit = exitTime ? new Date(exitTime) : new Date()
    const diffMs = exit.getTime() - entry.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours === 0) {
      return `${diffMinutes}m`
    }
    return `${diffHours}h ${diffMinutes}m`
  }

  const getStatusBadge = (status: string, entryTime: string) => {
    if (status === "inside") {
      const duration = calculateDuration(entryTime)
      const hours = Number.parseInt(duration.split("h")[0]) || 0
      const isOvertime = hours >= 8

      return (
        <div className="flex flex-col items-center gap-1">
          <Badge
            className={
              isOvertime ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-green-100 text-green-800 hover:bg-green-100"
            }
          >
            Inside
          </Badge>
          <span className={`text-xs ${isOvertime ? "text-red-600" : "text-gray-500"}`}>{duration}</span>
        </div>
      )
    } else {
      return <Badge variant="secondary">Exited</Badge>
    }
  }

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      staff: "bg-blue-100 text-blue-800",
      clients: "bg-green-100 text-green-800",
      client: "bg-green-100 text-green-800",
      subcontractors: "bg-orange-100 text-orange-800",
      suppliers: "bg-red-100 text-red-800",
      visitors: "bg-purple-100 text-purple-800",
      contractors: "bg-yellow-100 text-yellow-800",
    }

    const colorClass =
      categoryColors[category.toLowerCase() as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"

    return <Badge className={colorClass}>{category.charAt(0).toUpperCase() + category.slice(1)}</Badge>
  }

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Category",
      "Company",
      "Purpose",
      "Contact",
      "Entry Time",
      "Exit Time",
      "Status",
      "Duration",
    ]
    const csvData = filteredEntries.map((entry) => [
      entry.name,
      entry.category,
      entry.company || "N/A",
      entry.purpose || "N/A",
      entry.contactNumber || "N/A",
      formatTime(entry.entryTime),
      entry.exitTime ? formatTime(entry.exitTime) : "N/A",
      entry.status,
      calculateDuration(entry.entryTime, entry.exitTime),
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `all-records-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Get summary statistics
  const stats = {
    total: allEntries.length,
    inside: allEntries.filter((e) => e.status === "inside").length,
    exited: allEntries.filter((e) => e.status === "exited").length,
    categories: {
      staff: allEntries.filter((e) => e.category.toLowerCase() === "staff").length,
      clients: allEntries.filter((e) => e.category.toLowerCase().includes("client")).length,
      subcontractors: allEntries.filter((e) => e.category.toLowerCase().includes("subcontractor")).length,
      suppliers: allEntries.filter((e) => e.category.toLowerCase().includes("supplier")).length,
      visitors: allEntries.filter((e) => e.category.toLowerCase() === "visitors").length,
    },
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl border border-white/30 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            All Records
          </h1>
          <p className="text-gray-600 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-medium">
            Complete overview of all entry records across all categories
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-blue-100">All time entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Currently Inside</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.inside}</div>
            <p className="text-xs text-green-100">Active entries</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Checked Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.exited}</div>
            <p className="text-xs text-orange-100">Completed visits</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{Object.keys(stats.categories).length}</div>
            <p className="text-xs text-purple-100">Entry types</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-4 w-4" />
          <Input
            placeholder="Search by name, company, contact, or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 border-blue-200 focus:border-blue-500">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="clients">Clients</SelectItem>
            <SelectItem value="subcontractors">Sub Contractors</SelectItem>
            <SelectItem value="suppliers">Suppliers</SelectItem>
            <SelectItem value="visitors">Visitors</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 border-green-200 focus:border-green-500">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="inside">Inside</SelectItem>
            <SelectItem value="exited">Exited</SelectItem>
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48 border-orange-200 focus:border-orange-500">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects
              .filter((project) => project.status === "active")
              .slice(0, 10) // Limit to first 10 for UI performance
              .map((project) => (
                <SelectItem key={project.id} value={project.name}>
                  {project.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-gradient-to-r from-blue-50 to-purple-50 z-10">
                <TableRow className="border-blue-100">
                  <TableHead className="w-16 text-slate-700 font-semibold">Photo</TableHead>
                  <TableHead className="min-w-[150px] text-slate-700 font-semibold">Name</TableHead>
                  <TableHead className="min-w-[120px] text-slate-700 font-semibold">Category</TableHead>
                  <TableHead className="min-w-[150px] text-slate-700 font-semibold">Company</TableHead>
                  <TableHead className="min-w-[120px] text-slate-700 font-semibold">Purpose</TableHead>
                  <TableHead className="min-w-[140px] text-slate-700 font-semibold">Contact</TableHead>
                  <TableHead className="min-w-[150px] text-slate-700 font-semibold">Project</TableHead>
                  <TableHead className="min-w-[140px] text-slate-700 font-semibold">Entry Time</TableHead>
                  <TableHead className="min-w-[140px] text-slate-700 font-semibold">Exit Time</TableHead>
                  <TableHead className="min-w-[140px] text-slate-700 font-semibold">Status/Duration</TableHead>
                  <TableHead className="w-24 text-slate-700 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                      {allEntries.length === 0 ? "No records found" : "No entries match your filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry, index) => (
                    <TableRow key={entry.id} className={index % 2 === 0 ? "bg-white/40" : "bg-slate-50/40"}>
                      <TableCell>
                        <Avatar className="h-10 w-10 border-2 border-blue-200">
                          <AvatarImage
                            src={entry.photo || "/placeholder.svg?height=40&width=40"}
                            alt={entry.name}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                            {entry.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{entry.name}</TableCell>
                      <TableCell>{getCategoryBadge(entry.category)}</TableCell>
                      <TableCell className="text-slate-700">{entry.company || "N/A"}</TableCell>
                      <TableCell className="text-slate-700">{entry.purpose || "N/A"}</TableCell>
                      <TableCell className="text-slate-700">{entry.contactNumber || "N/A"}</TableCell>
                      <TableCell className="text-slate-700">
                        {entry.projectName ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {entry.projectName}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">No project</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-700">{formatTime(entry.entryTime)}</TableCell>
                      <TableCell>
                        {entry.exitTime ? (
                          <span className="text-slate-600">{formatTime(entry.exitTime)}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(entry.status, entry.entryTime)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedEntry(entry)}
                          className="h-9 w-9 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
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

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-slate-600 bg-white/50 p-4 rounded-lg">
        <span>
          Showing {filteredEntries.length} of {allEntries.length} records
        </span>
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>

      {/* Entry Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Entry Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                {selectedEntry.photo && (
                  <div className="flex justify-center">
                    <img
                      src={selectedEntry.photo || "/placeholder.svg"}
                      alt={selectedEntry.name}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-blue-200"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 text-sm bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="font-medium text-blue-700">Name:</span>
                    <p className="text-gray-700">{selectedEntry.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-purple-700">Category:</span>
                    <div className="mt-1">{getCategoryBadge(selectedEntry.category)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Company:</span>
                    <p className="text-gray-700">{selectedEntry.company || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-orange-700">Purpose:</span>
                    <p className="text-gray-700">{selectedEntry.purpose || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-pink-700">Contact:</span>
                    <p className="text-gray-700">{selectedEntry.contactNumber || "N/A"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-indigo-700">Entry Time:</span>
                    <p className="text-gray-700">{formatTime(selectedEntry.entryTime)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-teal-700">Status:</span>
                    <div className="mt-1">{getStatusBadge(selectedEntry.status, selectedEntry.entryTime)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-violet-700">Duration:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-4 w-4 text-violet-500" />
                      <span className="text-gray-700">
                        {calculateDuration(selectedEntry.entryTime, selectedEntry.exitTime)}
                      </span>
                    </div>
                  </div>
                  {selectedEntry.exitTime && (
                    <div>
                      <span className="font-medium text-red-700">Exit Time:</span>
                      <p className="text-gray-700">{formatTime(selectedEntry.exitTime)}</p>
                    </div>
                  )}
                </div>

                <Button onClick={() => setSelectedEntry(null)} className="w-full">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
