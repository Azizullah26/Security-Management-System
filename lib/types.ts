export interface SecurityPerson {
  id: string
  name: string
  assignedProjects: string[]
  email: string
  phone?: string
  employeeId?: string
  position?: string
}

export interface Project {
  id: string
  name: string
  status: "active" | "completed" | "pending" | "on-hold" | "planning"
  assignedTo?: string // security person id
  startDate: string
  endDate?: string
  description?: string
  priority: "low" | "medium" | "high"
}

export interface ProjectAssignment {
  projectId: string
  securityPersonId: string
  assignedDate: string
}

export interface StaffMember {
  fileId: string
  name: string
  assignedProject: string | null
}
