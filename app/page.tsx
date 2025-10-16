"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, HardHat, Wrench, Briefcase, Truck, UserCheck, LogOut } from "lucide-react"
import { EntryForm, type EntryData } from "@/components/entry-form"
import { RecordsTable } from "@/components/records-table"
import { TimeTracker } from "@/components/time-tracker"
import type { StaffMember } from "@/lib/types"

interface CategoryData {
  id: string
  name: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function SecurityDashboard() {
  const router = useRouter()
  const [isInitializing, setIsInitializing] = useState(true)
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null)
  const [categories, setCategories] = useState<CategoryData[]>([
    {
      id: "staff",
      name: "Staff",
      count: 0,
      icon: Users,
      color: "bg-blue-100",
    },
    {
      id: "clients",
      name: "Client",
      count: 0,
      icon: Briefcase,
      color: "bg-green-100",
    },
    {
      id: "contractors",
      name: "Consultant",
      count: 0,
      icon: HardHat,
      color: "bg-orange-100",
    },
    {
      id: "subcontractors",
      name: "Subcontractor",
      count: 0,
      icon: Wrench,
      color: "bg-purple-100",
    },
    {
      id: "suppliers",
      name: "Supplier",
      count: 0,
      icon: Truck,
      color: "bg-yellow-100",
    },
    {
      id: "visitors",
      name: "Visitor",
      count: 0,
      icon: UserCheck,
      color: "bg-red-100",
    },
  ])

  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false)
  const [isRecordsTableOpen, setIsRecordsTableOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [entries, setEntries] = useState<EntryData[]>([])
  const [viewingMyRecords, setViewingMyRecords] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const staffToken = localStorage.getItem("staff-session-token")

      if (!staffToken) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch("/api/staff/verify", {
          headers: {
            "x-staff-session-token": staffToken,
          },
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setCurrentStaff(data.staff)
        } else {
          localStorage.removeItem("staff-session-token")
          router.push("/login")
        }
      } catch (error) {
        console.error("Session verification failed:", error)
        router.push("/login")
      } finally {
        setIsInitializing(false)
      }
    }

    checkSession()
  }, [router])

  useEffect(() => {
    if (!currentStaff) return

    const loadEntries = async () => {
      try {
        const staffToken = localStorage.getItem("staff-session-token")
        const headers: HeadersInit = {}
        if (staffToken) {
          headers["x-staff-session-token"] = staffToken
        }

        const response = await fetch("/api/records", {
          headers,
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          const records = data.records || []

          setEntries(records)

          const categoryCounts: Record<string, number> = {}
          records.forEach((entry: EntryData) => {
            const categoryKey = entry.category.toLowerCase()
            categoryCounts[categoryKey] = (categoryCounts[categoryKey] || 0) + 1
          })

          setCategories((prev) =>
            prev.map((cat) => ({
              ...cat,
              count: categoryCounts[cat.id] || 0,
            })),
          )
        }
      } catch (error) {
        console.error("Failed to load entries from database:", error)
      }
    }

    loadEntries()
  }, [currentStaff])

  const handleLogin = (staff: StaffMember) => {
    setCurrentStaff(staff)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/staff/logout", { method: "POST" })
      setCurrentStaff(null)
      setEntries([])
      setCategories((prev) => prev.map((cat) => ({ ...cat, count: 0 })))
      localStorage.removeItem("staff-session-token")
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleAddEntry = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setIsEntryFormOpen(true)
  }

  const handleViewRecords = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setIsRecordsTableOpen(true)
  }

  const handleEntrySubmit = async (entryData: EntryData) => {
    const updatedEntries = [...entries, entryData]
    setEntries(updatedEntries)

    setCategories((prev) =>
      prev.map((cat) => (cat.id === entryData.category.toLowerCase() ? { ...cat, count: cat.count + 1 } : cat)),
    )

    try {
      const staffToken = localStorage.getItem("staff-session-token")
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (staffToken) {
        headers["x-staff-session-token"] = staffToken
      }

      const response = await fetch("/api/records", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(entryData),
      })

      if (!response.ok) {
        console.error("Failed to save entry to database")
      }
    } catch (error) {
      console.error("Error saving entry:", error)
    }
  }

  const handleCheckOut = async (entryId: string) => {
    const exitTime = new Date().toISOString()

    const updatedEntries = entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            status: "exited" as const,
            exitTime: exitTime,
          }
        : entry,
    )
    setEntries(updatedEntries)

    try {
      const staffToken = localStorage.getItem("staff-session-token")
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (staffToken) {
        headers["x-staff-session-token"] = staffToken
      }

      const response = await fetch("/api/records", {
        method: "PUT",
        headers,
        credentials: "include",
        body: JSON.stringify({ id: entryId, exitTime, status: "exited" }),
      })

      if (!response.ok) {
        console.error("Failed to update exit time in database")
      }
    } catch (error) {
      console.error("Error updating checkout:", error)
    }
  }

  const handleViewMyRecords = async () => {
    try {
      const staffToken = localStorage.getItem("staff-session-token")
      const headers: HeadersInit = {}
      if (staffToken) {
        headers["x-staff-session-token"] = staffToken
      }

      const response = await fetch("/api/records?filter=my-records&date=today", {
        headers,
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setEntries(data.records || [])
        setViewingMyRecords(true)
        setIsRecordsTableOpen(true)
        setSelectedCategory("my-records")
      }
    } catch (error) {
      console.error("Failed to load my records:", error)
    }
  }

  const handleViewAllRecords = async () => {
    try {
      const staffToken = localStorage.getItem("staff-session-token")
      const headers: HeadersInit = {}
      if (staffToken) {
        headers["x-staff-session-token"] = staffToken
      }

      const response = await fetch("/api/records", {
        headers,
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setEntries(data.records || [])
        setViewingMyRecords(false)
      }
    } catch (error) {
      console.error("Failed to load all records:", error)
    }
  }

  const currentlyInside = entries.filter((entry) => entry.status === "inside").length
  const checkedOut = entries.filter((entry) => entry.status === "exited").length
  const totalEntries = entries.length

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!currentStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-3 md:p-4 lg:p-6">
      <div className="max-w-[1620px] mx-auto">
        <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5 lg:gap-6 mb-3 sm:mb-4">
            <div className="flex-shrink-0">
              <img
                src="/images/design-mode/2025%20LOGO(1).jpeg"
                alt="RCC - El Race Contracting Logo"
                className="h-14 sm:h-16 md:h-18 lg:h-20 xl:h-24 w-auto object-contain"
              />
            </div>
            <div className="text-center md:text-left flex-1 w-full md:w-auto">
              <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-1 md:mb-2">
                Security Management System
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-gray-600">Visitor and Personnel Tracking Dashboard</p>

              <div className="mt-2 md:mt-3 flex flex-col sm:flex-row gap-2 md:gap-4 text-xs sm:text-sm md:text-base">
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="font-medium text-blue-600">Staff:</span>
                  <span className="text-gray-700">
                    {currentStaff.name} (ID: {currentStaff.fileId})
                  </span>
                </div>
                {currentStaff.assignedProject && (
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="font-medium text-green-600">Project:</span>
                    <span className="text-gray-700">{currentStaff.assignedProject}</span>
                  </div>
                )}
                {!currentStaff.assignedProject && (
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="font-medium text-orange-600">Project:</span>
                    <span className="text-gray-500">No project assigned</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-full md:w-auto flex-shrink-0 flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 md:gap-2.5">
              <Button
                onClick={handleViewMyRecords}
                variant="default"
                className="w-full md:w-auto gap-2 bg-green-600 hover:bg-green-700 text-sm md:text-base px-4 md:px-5 h-10 md:h-11"
              >
                <Users className="h-4 w-4 md:h-5 md:w-5" />
                <span className="whitespace-nowrap">My Records Today</span>
              </Button>
              <Button
                onClick={() => (window.location.href = "/admin")}
                variant="outline"
                className="w-full md:w-auto gap-2 text-sm md:text-base px-4 md:px-5 h-10 md:h-11"
              >
                <Users className="h-4 w-4 md:h-5 md:w-5" />
                <span className="whitespace-nowrap">Admin Dashboard</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full md:w-auto gap-2 text-red-600 hover:text-red-700 bg-transparent text-sm md:text-base px-4 md:px-5 h-10 md:h-11"
              >
                <LogOut className="h-4 w-4 md:h-5 md:w-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <div className="xl:col-span-3 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {categories.map((category) => {
                const IconComponent = category.icon
                return (
                  <Card
                    key={category.id}
                    className="hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50 border-gray-200"
                  >
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">
                          {category.name}
                        </CardTitle>
                        <div className={`p-2 sm:p-2.5 rounded-lg ${category.color}`}>
                          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Current Count:</span>
                        <Badge variant="secondary" className="text-sm sm:text-base md:text-lg px-2 sm:px-3 py-1">
                          {category.count}
                        </Badge>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => handleAddEntry(category.id)}
                          className="w-full text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11"
                          size="default"
                        >
                          Add Entry
                        </Button>
                        <Button
                          onClick={() => handleViewRecords(category.id)}
                          variant="outline"
                          className="w-full text-xs sm:text-sm md:text-base h-9 sm:h-10 md:h-11"
                          size="default"
                        >
                          View Records
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-5 lg:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                Today's Summary
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{totalEntries}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">Total Entries</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{currentlyInside}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">Currently Inside</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">{checkedOut}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">Checked Out</div>
                </div>
                <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">0</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">Pending Exit</div>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1 order-first xl:order-last">
            <TimeTracker entries={entries} />
          </div>
        </div>
      </div>

      <EntryForm
        isOpen={isEntryFormOpen}
        onClose={() => setIsEntryFormOpen(false)}
        category={selectedCategory}
        onSubmit={handleEntrySubmit}
      />

      <RecordsTable
        isOpen={isRecordsTableOpen}
        onClose={() => setIsRecordsTableOpen(false)}
        category={selectedCategory}
        entries={entries}
        onCheckOut={handleCheckOut}
      />
    </div>
  )
}
