"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AdminSidebar } from "@/components/admin-sidebar"
import { ProjectAssignmentDialog } from "@/components/project-assignment-dialog"
import { AllRecordsView } from "@/components/all-records-view"
import { AdminLogin } from "@/components/admin-login"
import { StaffAssignmentManagement } from "@/components/staff-assignment-management"
import { StaffManagement } from "@/components/staff-management"
import { SecurityReportsView } from "@/components/security-reports-view"
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
  const [chartReady, setChartReady] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const token = urlParams.get("token")

        if (token) {
          console.log("[v0] Token found in URL, verifying with API...")
          try {
            const verifyResponse = await fetch("/api/auth/external/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            })

            if (verifyResponse.ok) {
              const data = await verifyResponse.json()
              console.log("[v0] Token verified successfully:", data.user)

              if (data.user.role === "admin") {
                // Create admin session using the token
                const sessionResponse = await fetch("/api/admin/create-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ token }),
                  credentials: "include",
                })

                if (sessionResponse.ok) {
                  console.log("[v0] Admin session created from external token")
                  // Clean URL to remove token parameter
                  window.history.replaceState({}, document.title, window.location.pathname)
                  setIsAuthenticated(true)
                  setIsCheckingAuth(false)
                  return
                }
              } else {
                console.error("[v0] Token is for staff user, not admin")
              }
            }
          } catch (error) {
            console.error("[v0] Error verifying token:", error)
          }
        }

        const adminResponse = await fetch("/api/admin/verify", {
          credentials: "include",
        })

        if (adminResponse.ok) {
          setIsAuthenticated(true)
          setIsCheckingAuth(false)
          return
        }

        // If no admin session, check if user has a staff session with fileId="Admin"
        const staffToken = localStorage.getItem("staff-session-token")
        if (staffToken) {
          // Try to auto-authenticate using the new endpoint
          const autoAuthResponse = await fetch("/api/admin/auto-auth", {
            method: "POST",
            credentials: "include",
          })

          if (autoAuthResponse.ok) {
            console.log("[v0] Admin session created automatically")
            setIsAuthenticated(true)
            setIsCheckingAuth(false)
            return
          }
        }

        // No valid authentication found
        setIsAuthenticated(false)
      } catch (error) {
        console.error("Auth check failed:", error)
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
    // Wait for DOM to be ready before rendering charts
    const timer = setTimeout(() => {
      setChartReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Only fetch data if authenticated
    if (isAuthenticated) {
      Promise.all([
        fetch("/api/projects", {
          credentials: "include", // Include authentication cookies
        })
          .then((res) => {
            if (!res.ok) {
              console.error("Failed to fetch projects:", res.status)
              return []
            }
            return res.json()
          })
          .catch((error) => {
            console.error("Error fetching projects:", error)
            return []
          }),
        fetch("/api/security-staff", {
          credentials: "include", // Include authentication cookies
        })
          .then((res) => {
            if (!res.ok) {
              console.error("Failed to fetch security staff:", res.status)
              return []
            }
            return res.json()
          })
          .catch((error) => {
            console.error("Error fetching security staff:", error)
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
      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
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
        credentials: "include",
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
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      project.name.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower) ||
      project.woNumber?.toLowerCase().includes(searchLower) ||
      project.client?.toLowerCase().includes(searchLower) ||
      project.agreement?.toLowerCase().includes(searchLower)
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
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
            <p className="text-xs text-blue-100">All projects in system</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Active Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeProjects}</div>
            <p className="text-xs text-green-100">Currently running</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Unassigned</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.unassignedProjects}</div>
            <p className="text-xs text-orange-100">Need assignment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
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
            {/* Conditional rendering to prevent chart dimension errors */}
            {chartReady && chartData.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">Loading chart...</div>
            )}
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
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl">
      <div className="flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Project Management
          </h1>
          <p className="text-gray-600 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-medium">
            Manage security projects and assignments (Active Projects Only)
          </p>
        </div>
      </div>

      <div className="flex-shrink-0 flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-md">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 h-4 w-4 pointer-events-none" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
                  <TableHead className="text-blue-700 font-semibold">Project Name</TableHead>
                  <TableHead className="text-green-700 font-semibold">W.O NO</TableHead>
                  <TableHead className="text-orange-700 font-semibold">Client</TableHead>
                  <TableHead className="text-teal-700 font-semibold">Agreement</TableHead>
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
                        {project.woNumber ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">{project.woNumber}</Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.client ? (
                          <div className="font-medium text-gray-900">{project.client}</div>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {project.agreement ? (
                          <div className="font-medium text-gray-900">{project.agreement}</div>
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="default"
                          className="transition-all duration-300 hover:scale-110 bg-green-500 hover:bg-green-600"
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
                      <TableCell className="text-gray-700">
                        {new Date(project.startDate).toLocaleDateString()}
                      </TableCell>
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
    </div>
  )

  const renderStaff = () => <StaffManagement securityStaff={securityStaff} projects={projects} />

  const renderAssignments = () => <StaffAssignmentManagement />

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} onLogout={handleLogout} />
      <main className="flex-1 p-6 overflow-auto">
        {activeSection === "overview" && renderOverview()}
        {activeSection === "security-reports" && <SecurityReportsView />}
        {activeSection === "all-records" && <AllRecordsView />}
        {activeSection === "projects" && renderProjects()}
        {activeSection === "staff" && renderStaff()}
        {activeSection === "assignments" && renderAssignments()}
      </main>

      {assignmentDialog.isOpen && (
        <ProjectAssignmentDialog
          isOpen={assignmentDialog.isOpen}
          project={assignmentDialog.project}
          securityStaff={securityStaff}
          onAssign={handleAssignProject}
          onClose={() => setAssignmentDialog({ isOpen: false, project: null })}
        />
      )}
    </div>
  )
}
