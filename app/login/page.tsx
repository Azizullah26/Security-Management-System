"use client"

import { StaffLogin } from "@/components/staff-login"
import { useRouter } from "next/navigation"
import type { StaffMember } from "@/lib/types"

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = (staff: StaffMember) => {
    // Redirect to main dashboard after successful login
    router.push("/")
  }

  return <StaffLogin onLogin={handleLogin} />
}
