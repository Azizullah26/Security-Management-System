export interface SecurityPerson {
  id: string
  name: string
  assignedProjects: string[]
  email: string
  phone?: string
  employeeId?: string
  position?: string
  department?: string
  status?: string
  hireDate?: string
  password?: string // Added password field for admin viewing
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
  woNumber?: string // Added woNumber field to store Work Order Number
  client?: string // Added client field to store partner/client name from Odoo
  agreement?: string // Added agreement field to store agreement name from Odoo
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
