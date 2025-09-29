"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { Project, SecurityPerson } from "@/lib/types"

interface ProjectAssignmentDialogProps {
  isOpen: boolean
  onClose: () => void
  project: Project | null
  securityStaff: SecurityPerson[]
  onAssign: (projectId: string, securityPersonId: string) => void
}

export function ProjectAssignmentDialog({
  isOpen,
  onClose,
  project,
  securityStaff,
  onAssign,
}: ProjectAssignmentDialogProps) {
  const [selectedStaff, setSelectedStaff] = useState<string>("")

  const handleAssign = () => {
    if (project && selectedStaff) {
      onAssign(project.id, selectedStaff)
      setSelectedStaff("")
      onClose()
    }
  }

  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Project</Label>
            <div className="mt-1 p-3 bg-muted rounded-md">
              <p className="font-medium">{project.name}</p>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="staff-select" className="text-sm font-medium">
              Assign to Security Personnel
            </Label>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select security personnel" />
              </SelectTrigger>
              <SelectContent>
                {securityStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    <div className="flex flex-col">
                      <span>{staff.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {staff.assignedProjects.length} projects assigned
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={!selectedStaff}>
              Assign Project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
