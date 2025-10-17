"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, UserPlus, Edit, Key, Eye, EyeOff } from "lucide-react"
import { AddStaffDialog } from "./add-staff-dialog"
import type { SecurityPerson, Project } from "@/lib/types"

interface StaffManagementProps {
  securityStaff: SecurityPerson[]
  projects: Project[]
}

interface StaffWithPassword extends SecurityPerson {
  password?: string
  passwordHash?: string
}

export function StaffManagement({ securityStaff: initialStaff, projects }: StaffManagementProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [staffList, setStaffList] = useState<StaffWithPassword[]>([])
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [editingStaff, setEditingStaff] = useState<StaffWithPassword | null>(null)
  const [changingPassword, setChangingPassword] = useState<StaffWithPassword | null>(null)
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    fetchStaffData()
  }, [])

  const fetchStaffData = async () => {
    try {
      const response = await fetch("/api/security-staff", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setStaffList(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching staff data:", error)
    }
  }

  const filteredStaff = staffList.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddStaff = async (newStaff: Omit<SecurityPerson, "id">) => {
    try {
      const response = await fetch("/api/security-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newStaff),
      })

      if (response.ok) {
        await fetchStaffData()
        console.log("[v0] Staff member added successfully")
      } else {
        console.error("[v0] Failed to add staff member")
      }
    } catch (error) {
      console.error("[v0] Error adding staff member:", error)
    }
  }

  const handleUpdateStaff = async () => {
    if (!editingStaff) return

    try {
      const response = await fetch("/api/security-staff", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: editingStaff.id,
          name: editingStaff.name,
          employeeId: editingStaff.employeeId,
          position: editingStaff.position,
          department: editingStaff.department,
        }),
      })

      if (response.ok) {
        await fetchStaffData()
        setEditingStaff(null)
        console.log("[v0] Staff member updated successfully")
      } else {
        console.error("[v0] Failed to update staff member")
      }
    } catch (error) {
      console.error("[v0] Error updating staff member:", error)
    }
  }

  const handleChangePassword = async () => {
    if (!changingPassword || !newPassword) return

    try {
      const response = await fetch("/api/security-staff", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: changingPassword.id,
          newPassword: newPassword,
        }),
      })

      if (response.ok) {
        await fetchStaffData()
        setChangingPassword(null)
        setNewPassword("")
        console.log("[v0] Password changed successfully")
      } else {
        console.error("[v0] Failed to change password")
      }
    } catch (error) {
      console.error("[v0] Error changing password:", error)
    }
  }

  const togglePasswordVisibility = (staffId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [staffId]: !prev[staffId],
    }))
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Security Staff Management
          </h1>
          <p className="text-gray-600 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-medium">
            Manage security personnel, passwords, and assignments
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      <div className="flex gap-4 items-center bg-white backdrop-blur-sm p-4 rounded-lg border border-white/50 shadow-md">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-4 w-4" />
          <Input
            placeholder="Search staff by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-200 focus:border-purple-500"
          />
        </div>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            All Security Staff
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
                <TableHead className="text-blue-700 font-semibold">Employee ID</TableHead>
                <TableHead className="text-purple-700 font-semibold">Full Name</TableHead>
                <TableHead className="text-pink-700 font-semibold">Position</TableHead>
                <TableHead className="text-indigo-700 font-semibold">Department</TableHead>
                <TableHead className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent font-bold">
                  Password
                </TableHead>
                <TableHead className="text-emerald-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((staff, index) => {
                const rowBg =
                  index % 2 === 0
                    ? "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
                    : "hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50"

                return (
                  <TableRow key={staff.id} className={`transition-all duration-300 ${rowBg}`}>
                    <TableCell className="font-medium text-gray-900">{staff.employeeId}</TableCell>
                    <TableCell className="font-medium text-gray-900">{staff.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-500">{staff.position}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-500">{staff.department}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-blue-100 text-red-900 px-2 py-1 rounded font-semibold border border-blue-300">
                          {showPasswords[staff.id] ? staff.password || staff.employeeId : "••••••••"}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePasswordVisibility(staff.id)}
                          className="h-8 w-8 p-0 hover:bg-blue-100"
                        >
                          {showPasswords[staff.id] ? (
                            <EyeOff className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-blue-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingStaff(staff)}
                          className="border-gray-800 bg-white text-gray-900 hover:bg-gray-900 hover:text-white transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setChangingPassword(staff)}
                          className="border-blue-500 bg-gradient-to-r from-blue-500 to-green-500 text-white hover:from-blue-600 hover:to-green-600"
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Change Password
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editingStaff} onOpenChange={() => setEditingStaff(null)}>
        <DialogContent className="bg-gradient-to-br from-blue-500 to-green-500 border-blue-600">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Employee ID</Label>
              <Input
                value={editingStaff?.employeeId || ""}
                onChange={(e) => setEditingStaff(editingStaff ? { ...editingStaff, employeeId: e.target.value } : null)}
                className="text-black bg-white"
              />
            </div>
            <div>
              <Label className="text-white">Full Name</Label>
              <Input
                value={editingStaff?.name || ""}
                onChange={(e) => setEditingStaff(editingStaff ? { ...editingStaff, name: e.target.value } : null)}
                className="text-black bg-white"
              />
            </div>
            <div>
              <Label className="text-white">Position</Label>
              <Input
                value={editingStaff?.position || ""}
                onChange={(e) => setEditingStaff(editingStaff ? { ...editingStaff, position: e.target.value } : null)}
                className="text-black bg-white"
              />
            </div>
            <div>
              <Label className="text-white">Department</Label>
              <Input
                value={editingStaff?.department || ""}
                onChange={(e) => setEditingStaff(editingStaff ? { ...editingStaff, department: e.target.value } : null)}
                className="text-black bg-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingStaff(null)}
              className="bg-white text-black hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff} className="bg-white text-blue-600 hover:bg-gray-100">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!changingPassword} onOpenChange={() => setChangingPassword(null)}>
        <DialogContent className="bg-gradient-to-br from-blue-500 to-green-500 border-blue-600">
          <DialogHeader>
            <DialogTitle className="text-white">Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Staff Member</Label>
              <Input value={changingPassword?.name || ""} disabled className="text-black bg-white" />
            </div>
            <div>
              <Label className="text-white">Employee ID (File ID)</Label>
              <Input value={changingPassword?.employeeId || ""} disabled className="text-black bg-white" />
            </div>
            <div>
              <Label className="text-white">Current Password</Label>
              <Input
                value={changingPassword?.password || changingPassword?.employeeId || ""}
                disabled
                className="text-black bg-white"
              />
            </div>
            <div>
              <Label className="text-white">New Password</Label>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="text-black bg-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangingPassword(null)}
              className="bg-white text-black hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassword} className="bg-white text-green-600 hover:bg-gray-100">
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddStaffDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddStaff={handleAddStaff}
        projects={projects}
      />
    </div>
  )
}
