"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Users, UserPlus, Search, Trash2, MapPin } from "lucide-react"
import { toast } from "sonner"

interface StaffMember {
  fileId: string
  name: string
}

interface Project {
  id: string
  name: string
  status: string
  priority: string
  description?: string
}

interface Assignment {
  staffId: string
  staffName: string
  projectName: string
}

const staffMembers: StaffMember[] = [
  { fileId: '3252', name: 'Mohus' },
  { fileId: '3242', name: 'Umair' },
  { fileId: '3253', name: 'Salman' },
  { fileId: '2234', name: 'Tanweer' },
  { fileId: '3245', name: 'Tilak' },
  { fileId: '3248', name: 'Ramesh' },
]

export function StaffAssignmentManagement() {
  const [projects, setProjects] = useState<Project[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [selectedStaff, setSelectedStaff] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch projects and assignments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projectsRes, assignmentsRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/assignments")
        ])

        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData.projects || projectsData || [])
        }

        if (assignmentsRes.ok) {
          const assignmentsData = await assignmentsRes.json()
          setAssignments(assignmentsData.assignments || [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load data")
      }
    }

    fetchData()
  }, [])

  const handleAssignProject = async () => {
    if (!selectedProject || !selectedStaff) {
      toast.error("Please select both project and staff member")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId: selectedStaff,
          projectName: selectedProject,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAssignments(prev => [...prev, data.assignment])
        setSelectedProject("")
        setSelectedStaff("")
        setIsDialogOpen(false)
        toast.success("Project assigned successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to assign project")
      }
    } catch (error) {
      console.error("Assignment error:", error)
      toast.error("Failed to assign project")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAssignment = async (staffId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/assignments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ staffId }),
      })

      if (response.ok) {
        setAssignments(prev => prev.filter(a => a.staffId !== staffId))
        toast.success("Assignment removed successfully")
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to remove assignment")
      }
    } catch (error) {
      console.error("Remove assignment error:", error)
      toast.error("Failed to remove assignment")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAssignments = assignments.filter(assignment =>
    assignment.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.staffId.includes(searchTerm)
  )

  const getUnassignedStaff = () => {
    const assignedStaffIds = assignments.map(a => a.staffId)
    return staffMembers.filter(staff => !assignedStaffIds.includes(staff.fileId))
  }

  const getAllProjects = () => {
    return projects.map(p => p.name)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Staff Project Assignments</h2>
          <p className="text-gray-600">Assign projects to staff members using File ID and Username</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Project to Staff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="staff-select">Staff Member</Label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUnassignedStaff().map((staff) => (
                      <SelectItem key={staff.fileId} value={staff.fileId}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{staff.name}</span>
                          <span className="text-sm text-gray-500">(ID: {staff.fileId})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project-select">Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllProjects().map((projectName) => (
                      <SelectItem key={projectName} value={projectName}>
                        {projectName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAssignProject} 
                  disabled={!selectedProject || !selectedStaff || isLoading}
                >
                  {isLoading ? "Assigning..." : "Assign Project"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <Users className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Staff</p>
                <p className="text-xl font-bold text-blue-900">{staffMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <UserPlus className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Assigned</p>
                <p className="text-xl font-bold text-green-900">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-200 rounded-lg">
                <Users className="h-5 w-5 text-orange-700" />
              </div>
              <div>
                <p className="text-sm text-orange-700 font-medium">Unassigned</p>
                <p className="text-xl font-bold text-orange-900">{staffMembers.length - assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-200 rounded-lg">
                <MapPin className="h-5 w-5 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Projects</p>
                <p className="text-xl font-bold text-purple-900">{getAllProjects().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-slate-100 border-b border-blue-200">
          <CardTitle className="text-slate-800">Current Assignments</CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by staff name, File ID, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Assignments Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Assigned Project</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No assignments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => (
                    <TableRow key={assignment.staffId}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {assignment.staffId}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {assignment.staffName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {assignment.projectName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment.staffId)}
                          disabled={isLoading}
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

      {/* Unassigned Staff */}
      {getUnassignedStaff().length > 0 && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-amber-100 border-b border-orange-200">
            <CardTitle className="text-amber-800">Unassigned Staff</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {getUnassignedStaff().map((staff) => (
                <div key={staff.fileId} className="p-3 border border-orange-200 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-amber-900">{staff.name}</p>
                      <p className="text-sm text-amber-700">ID: {staff.fileId}</p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-200 text-orange-800 border-orange-300">Unassigned</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}