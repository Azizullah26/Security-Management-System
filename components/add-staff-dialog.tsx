"use client"

import type React from "react"
import type { SecurityPerson, Project } from "@/lib/types"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UserPlus, X } from "lucide-react"

interface AddStaffDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddStaff: (staff: Omit<SecurityPerson, "id">) => void
  projects: Project[]
}

export function AddStaffDialog({ isOpen, onClose, onAddStaff, projects }: AddStaffDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    employeeId: "",
    position: "Security Guard",
    department: "Security",
    assignedProjects: [] as string[],
    notes: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const newStaff: Omit<SecurityPerson, "id"> = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      employeeId: formData.employeeId.trim(),
      position: formData.position,
      department: formData.department,
      assignedProjects: formData.assignedProjects,
      status: "Active",
      hireDate: new Date().toISOString().split("T")[0],
    }

    onAddStaff(newStaff)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      employeeId: "",
      position: "Security Guard",
      department: "Security",
      assignedProjects: [],
      notes: "",
    })
    setErrors({})
    onClose()
  }

  const handleProjectToggle = (projectId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedProjects: prev.assignedProjects.includes(projectId)
        ? prev.assignedProjects.filter((id) => id !== projectId)
        : [...prev.assignedProjects, projectId],
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 border-2 border-blue-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-slate-800">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
              Add New Staff Member
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 font-medium">
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter full name"
                className={`bg-white/80 border-2 ${errors.name ? "border-red-300" : "border-blue-200"} focus:border-blue-400 text-black`}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId" className="text-slate-700 font-medium">
                Employee ID *
              </Label>
              <Input
                id="employeeId"
                value={formData.employeeId}
                onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
                placeholder="Enter employee ID"
                className={`bg-white/80 border-2 ${errors.employeeId ? "border-red-300" : "border-blue-200"} focus:border-blue-400 text-black`}
              />
              {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                className={`bg-white/80 border-2 ${errors.email ? "border-red-300" : "border-blue-200"} focus:border-blue-400 text-black`}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-700 font-medium">
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
                className={`bg-white/80 border-2 ${errors.phone ? "border-red-300" : "border-blue-200"} focus:border-blue-400 text-black`}
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-slate-700 font-medium">
                Position
              </Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, position: value }))}
              >
                <SelectTrigger className="bg-white/80 border-2 border-blue-200 focus:border-blue-400 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Security Guard">Security Guard</SelectItem>
                  <SelectItem value="Senior Security Guard">Senior Security Guard</SelectItem>
                  <SelectItem value="Security Supervisor">Security Supervisor</SelectItem>
                  <SelectItem value="Security Manager">Security Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-slate-700 font-medium">
                Department
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
              >
                <SelectTrigger className="bg-white/80 border-2 border-blue-200 focus:border-blue-400 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {projects.length > 0 && (
            <div className="space-y-2">
              <Label className="text-slate-700 font-medium">Assign to Projects (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-white/50 p-3 rounded-lg border border-blue-200">
                {projects.slice(0, 10).map((project) => (
                  <label key={project.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedProjects.includes(project.id)}
                      onChange={() => handleProjectToggle(project.id)}
                      className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700 truncate">{project.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-700 font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter any additional notes or comments"
              className="bg-white/80 border-2 border-blue-200 focus:border-blue-400 text-black"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
