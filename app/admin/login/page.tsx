"use client"

import { AdminLogin } from "@/components/admin-login"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()

  const handleLogin = () => {
    // Redirect to admin dashboard after successful login
    router.push("/admin")
  }

  return <AdminLogin onLogin={handleLogin} />
}
