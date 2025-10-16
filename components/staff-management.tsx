"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Mail, Phone, UserPlus, Edit } from "lucide-react"
import { AddStaffDialog } from "./add-staff-dialog"
import type { SecurityPerson, Project } from "@/lib/types"

interface StaffManagementProps {
  securityStaff: SecurityPerson[]
  projects: Project[]
}

export function StaffManagement({ securityStaff, projects }: StaffManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [staffList, setStaffList] = useState(securityStaff)

  const filteredStaff = staffList.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getProjectNames = (projectIds: string[]) => {
    return projectIds.map((id) => {
      const project = projects.find((p) => p.id === id)
      return project ? project.name : "Unknown Project"
    })
  }

  const handleAddStaff = async (newStaff: Omit<SecurityPerson, "id">) => {
    try {
      const response = await fetch("/api/security-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStaff),
      })

      if (response.ok) {
        const addedStaff = await response.json()
        setStaffList((prev) => [...prev, addedStaff])
        console.log("[v0] Staff member added successfully:", addedStaff)
      } else {
        console.error("[v0] Failed to add staff member")
        // For now, add locally with generated ID
        const staffWithId = {
          ...newStaff,
          id: `staff_${Date.now()}`,
        }
        setStaffList((prev) => [...prev, staffWithId])
      }
    } catch (error) {
      console.error("[v0] Error adding staff member:", error)
      // Fallback: add locally with generated ID
      const staffWithId = {
        ...newStaff,
        id: `staff_${Date.now()}`,
      }
      setStaffList((prev) => [...prev, staffWithId])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Staff Management</h1>
          <p className="text-muted-foreground">Manage security personnel and their assignments</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((staff) => {
          const projectNames = getProjectNames(staff.assignedProjects)
          return (
            <Card
              key={staff.id}
              className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-200/50 transition-all duration-300 hover:scale-105"
            >
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {staff.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent font-bold">
                      {staff.name}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Badge
                        variant="secondary"
                        className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200"
                      >
                        {staff.assignedProjects.length} projects
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:text-blue-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="truncate text-gray-700">{staff.email}</span>
                </div>
                {staff.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="text-gray-700">{staff.phone}</span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Assigned Projects:
                  </p>
                  {projectNames.length > 0 ? (
                    <div className="space-y-1">
                      {projectNames.slice(0, 2).map((name, index) => (
                        <div
                          key={index}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            index % 3 === 0
                              ? "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200"
                              : index % 3 === 1
                                ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200"
                                : "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {name}
                        </div>
                      ))}
                      {projectNames.length > 2 && (
                        <div className="text-xs text-indigo-600 font-medium">+{projectNames.length - 2} more</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No projects assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Overview Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Projects Assigned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {staff.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{staff.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{staff.email}</TableCell>
                  <TableCell>{staff.phone || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{staff.assignedProjects.length}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={staff.assignedProjects.length > 0 ? "default" : "secondary"}>
                      {staff.assignedProjects.length > 0 ? "Active" : "Available"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddStaffDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddStaff={handleAddStaff}
        projects={projects}
      />
    </div>
  )
}
