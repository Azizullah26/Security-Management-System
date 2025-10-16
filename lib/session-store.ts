// Session storage for staff (in production, use Redis or database)
export const staffSessionStore = new Map<
  string,
  {
    staffId: string
    name: string
    assignedProject: string | null
    createdAt: number
    expiresAt: number
  }
>()
