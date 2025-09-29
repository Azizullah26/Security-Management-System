import { NextResponse } from "next/server"
import type { SecurityPerson } from "@/lib/types"

const mockSecurityStaff: SecurityPerson[] = [
  {
    id: "3252",
    name: "Mohus",
    assignedProjects: ["2"],
    email: "mohus@security.com",
    phone: "+971-50-234-5678",
    employeeId: "3252",
    position: "Security Guard",
    department: "Security",
    status: "Active",
    hireDate: "2024-01-15",
  },
  {
    id: "3242",
    name: "Umair",
    assignedProjects: ["5"],
    email: "umair@security.com",
    phone: "+971-50-567-8901",
    employeeId: "3242",
    position: "Security Guard",
    department: "Security",
    status: "Active",
    hireDate: "2024-02-15",
  },
  {
    id: "3253",
    name: "Salman",
    assignedProjects: ["1"],
    email: "salman@security.com",
    phone: "+971-50-123-4567",
    employeeId: "3253",
    position: "Security Guard",
    department: "Security",
    status: "Active",
    hireDate: "2024-01-15",
  },
  {
    id: "2234",
    name: "Tanweer",
    assignedProjects: ["6"],
    email: "tanweer@security.com",
    phone: "+971-50-678-9012",
    employeeId: "2234",
    position: "Security Guard",
    department: "Security",
    status: "Active",
    hireDate: "2024-03-01",
  },
  {
    id: "3245",
    name: "Tilak",
    assignedProjects: ["4"],
    email: "tilak@security.com",
    phone: "+971-50-456-7890",
    employeeId: "3245",
    position: "Security Guard",
    department: "Security",
    status: "Active",
    hireDate: "2024-02-10",
  },
  {
    id: "3248",
    name: "Ramesh",
    assignedProjects: ["3"],
    email: "ramesh@security.com",
    phone: "+971-50-345-6789",
    employeeId: "3248",
    position: "Security Guard",
    department: "Security",
    status: "Active",
    hireDate: "2024-02-01",
  },
]

export async function GET() {
  return NextResponse.json(mockSecurityStaff)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.email || !body.employeeId) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, and employeeId are required" },
        { status: 400 },
      )
    }

    // Check if employee ID already exists
    const existingStaff = mockSecurityStaff.find((staff) => staff.employeeId === body.employeeId)
    if (existingStaff) {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 409 })
    }

    // Check if email already exists
    const existingEmail = mockSecurityStaff.find((staff) => staff.email === body.email)
    if (existingEmail) {
      return NextResponse.json({ error: "Email address already exists" }, { status: 409 })
    }

    // Create new staff member with generated ID
    const newStaff: SecurityPerson = {
      id: `staff_${Date.now()}`,
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      employeeId: body.employeeId,
      position: body.position || "Security Guard",
      department: body.department || "Security",
      assignedProjects: body.assignedProjects || [],
      status: body.status || "Active",
      hireDate: body.hireDate || new Date().toISOString().split("T")[0],
    }

    // Add to the mock data
    mockSecurityStaff.push(newStaff)

    return NextResponse.json(newStaff, { status: 201 })
  } catch (error) {
    console.error("Error adding staff member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
