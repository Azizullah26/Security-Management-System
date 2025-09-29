"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminSidebar } from "@/components/admin-sidebar"
import { ProjectAssignmentDialog } from "@/components/project-assignment-dialog"
import { AllRecordsView } from "@/components/all-records-view"
import { AdminLogin } from "@/components/admin-login"
import { StaffAssignmentManagement } from "@/components/staff-assignment-management"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Search, Users, FolderOpen, CheckCircle, AlertTriangle, UserPlus } from "lucide-react"
import type { Project, SecurityPerson } from "@/lib/types"
import { StaffManagement } from "@/components/staff-management"

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("overview")
  const [projects, setProjects] = useState<Project[]>([])
  const [securityStaff, setSecurityStaff] = useState<SecurityPerson[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [assignmentDialog, setAssignmentDialog] = useState<{
    isOpen: boolean
    project: Project | null
  }>({ isOpen: false, project: null })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated by checking server
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include' // Include cookies
        })
        setIsAuthenticated(response.ok)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()

    const handleResizeObserverError = (e: ErrorEvent) => {
      if (
        e.message === "ResizeObserver loop limit exceeded" ||
        e.message === "ResizeObserver loop completed with undelivered notifications."
      ) {
        e.stopImmediatePropagation()
      }
    }

    window.addEventListener("error", handleResizeObserverError)

    return () => {
      window.removeEventListener("error", handleResizeObserverError)
    }
  }, [])

  useEffect(() => {
    // Only fetch data if authenticated
    if (isAuthenticated) {
      Promise.all([
        fetch("/api/projects", {
          credentials: 'include' // Include authentication cookies
        }).then((res) => {
          if (!res.ok) {
            console.error('Failed to fetch projects:', res.status)
            return []
          }
          return res.json()
        }).catch((error) => {
          console.error('Error fetching projects:', error)
          return []
        }),
        fetch("/api/security-staff", {
          credentials: 'include' // Include authentication cookies
        }).then((res) => {
          if (!res.ok) {
            console.error('Failed to fetch security staff:', res.status)
            return []
          }
          return res.json()
        }).catch((error) => {
          console.error('Error fetching security staff:', error)
          return []
        }),
      ]).then(([projectsData, staffData]) => {
        setProjects(Array.isArray(projectsData) ? projectsData : [])
        setSecurityStaff(Array.isArray(staffData) ? staffData : [])
      })
    }
  }, [isAuthenticated])


  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsAuthenticated(false)
      setActiveSection("overview")
    }
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />
  }

  const handleAssignProject = async (projectId: string, securityPersonId: string) => {
    try {
      await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", projectId, securityPersonId }),
      })

      setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, assignedTo: securityPersonId } : p)))
      setSecurityStaff((prev) =>
        prev.map((s) =>
          s.id === securityPersonId
            ? { ...s, assignedProjects: [...s.assignedProjects, projectId] }
            : s.assignedProjects.includes(projectId)
              ? { ...s, assignedProjects: s.assignedProjects.filter((id) => id !== projectId) }
              : s,
        ),
      )
    } catch (error) {
      console.error("Failed to assign project:", error)
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === "active").length,
    completedProjects: projects.filter((p) => p.status === "completed").length,
    unassignedProjects: projects.filter((p) => !p.assignedTo).length,
    totalStaff: securityStaff.length,
  }

  const chartData = securityStaff.map((staff) => ({
    name: staff.name.split(" ")[0],
    projects: staff.assignedProjects.length,
  }))

  const pieData = [
    { name: "Active", value: stats.activeProjects, color: "#22c55e" }, // Changed Active color to a brighter green
    { name: "Completed", value: stats.completedProjects, color: "#3b82f6" },
    { name: "Pending", value: projects.filter((p) => p.status === "pending").length, color: "#f59e0b" },
    { name: "On Hold", value: projects.filter((p) => p.status === "on-hold").length, color: "#ef4444" },
    { name: "Planning", value: projects.filter((p) => p.status === "planning").length, color: "#8b5cf6" },
  ]

  const renderOverview = () => (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl border border-white/30 shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Security Management Overview
          </h1>
          <p className="text-gray-600 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-medium">
            Monitor and manage security projects and personnel
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
            <p className="text-xs text-blue-100">All projects in system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Active Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeProjects}</div>
            <p className="text-xs text-green-100">Currently running</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Unassigned</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.unassignedProjects}</div>
            <p className="text-xs text-orange-100">Need assignment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Security Staff</CardTitle>
            <Users className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalStaff}</div>
            <p className="text-xs text-purple-100">Total personnel</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-indigo-100 to-blue-100 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="text-white">Project Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div style={{ width: "100%", height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="name" stroke="#4f46e5" />
                  <YAxis stroke="#4f46e5" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "2px solid #4f46e5",
                      borderRadius: "12px",
                      color: "#1e1b4b",
                      boxShadow: "0 10px 25px rgba(79, 70, 229, 0.2)",
                    }}
                  />
                  <Bar dataKey="projects" fill="url(#colorGradient)" />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
            <CardTitle className="text-white">Project Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div style={{ width: "100%", height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "2px solid #8b5cf6",
                      borderRadius: "12px",
                      color: "#581c87",
                      boxShadow: "0 10px 25px rgba(139, 92, 246, 0.2)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontWeight: "bold" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderProjects = () => (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Project Management
          </h1>
          <p className="text-gray-600 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-medium">
            Manage security projects and assignments
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-white/50 shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500 transition-colors duration-300"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-blue-200 focus:border-blue-500 hover:border-blue-400 transition-colors duration-300">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
                <TableHead className="text-blue-700 font-semibold">Project Name</TableHead>
                <TableHead className="text-purple-700 font-semibold">Status</TableHead>
                <TableHead className="text-pink-700 font-semibold">Assigned To</TableHead>
                <TableHead className="text-indigo-700 font-semibold">Priority</TableHead>
                <TableHead className="text-cyan-700 font-semibold">Start Date</TableHead>
                <TableHead className="text-emerald-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project, index) => {
                const assignedStaff = securityStaff.find((s) => s.id === project.assignedTo)
                const rowBg =
                  index % 2 === 0
                    ? "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50"

                return (
                  <TableRow
                    key={project.id}
                    className={`transition-all duration-300 ${rowBg} hover:shadow-md cursor-pointer active:bg-gradient-to-r active:from-blue-100 active:to-purple-100`}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-sm text-gray-600">{project.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          project.status === "active"
                            ? "default"
                            : project.status === "completed"
                              ? "secondary"
                              : project.status === "pending"
                                ? "destructive"
                                : project.status === "on-hold"
                                  ? "outline"
                                  : "default"
                        }
                        className={`transition-all duration-300 hover:scale-110 ${
                          project.status === "active"
                            ? "bg-green-500 hover:bg-green-600"
                            : project.status === "completed"
                              ? "bg-blue-500 hover:bg-blue-600"
                              : project.status === "pending"
                                ? "bg-orange-500 hover:bg-orange-600"
                                : project.status === "on-hold"
                                  ? "bg-red-500 hover:bg-red-600 text-white"
                                  : "bg-purple-500 hover:bg-purple-600"
                        }`}
                      >
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignedStaff ? (
                        <div>
                          <div className="font-medium text-gray-900">{assignedStaff.name}</div>
                          <div className="text-sm text-gray-600">{assignedStaff.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          project.priority === "high"
                            ? "destructive"
                            : project.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className={`transition-all duration-300 hover:scale-110 ${
                          project.priority === "high"
                            ? "bg-red-500 hover:bg-red-600"
                            : project.priority === "medium"
                              ? "bg-yellow-500 hover:bg-yellow-600"
                              : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {project.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{new Date(project.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignmentDialog({ isOpen: true, project })}
                        className="transition-all duration-300 hover:scale-105 hover:shadow-lg border-blue-300 text-blue-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent active:scale-95 active:bg-gradient-to-r active:from-purple-600 active:to-pink-600"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        {project.assignedTo ? "Reassign" : "Assign"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderStaff = () => <StaffManagement securityStaff={securityStaff} projects={projects} />

  const renderAssignments = () => <StaffAssignmentManagement />

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return renderOverview()
      case "projects":
        return renderProjects()
      case "assignments":
        return renderAssignments()
      case "staff":
        return renderStaff()
      case "analytics":
        return renderOverview()
      case "all-records":
        return <AllRecordsView />
      case "visitors":
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Visitor System</h2>
              <p className="text-muted-foreground">This will redirect to the main visitor management system</p>
              <Button className="mt-4" onClick={() => (window.location.href = "/")}>
                Go to Visitor System
              </Button>
            </div>
          </div>
        )
      default:
        return renderOverview()
    }
  }

  return (
    <div className={`flex h-screen bg-gray-50`}>
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={handleLogout} />

      <main className="flex-1 overflow-auto">
        <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-purple-100/20 to-pink-100/20 animate-pulse"></div>
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-2xl animate-bounce"></div>
          <div className="absolute top-1/4 right-20 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-gradient-to-br from-green-200/30 to-emerald-200/30 rounded-full blur-3xl animate-bounce"></div>
          <div className="absolute bottom-10 right-10 w-28 h-28 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-2xl animate-pulse"></div>

          <div className="relative z-10 backdrop-blur-sm bg-white/40 rounded-3xl p-8 shadow-xl border border-white/50 transition-all duration-500 hover:shadow-2xl hover:bg-white/50 hover:scale-[1.01]">
            {renderContent()}
          </div>
        </div>
      </main>

      <ProjectAssignmentDialog
        isOpen={assignmentDialog.isOpen}
        onClose={() => setAssignmentDialog({ isOpen: false, project: null })}
        project={assignmentDialog.project}
        securityStaff={securityStaff}
        onAssign={handleAssignProject}
      />
    </div>
  )
}
