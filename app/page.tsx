"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, HardHat, Wrench, Briefcase, Truck, UserCheck } from "lucide-react"
import { EntryForm, type EntryData } from "@/components/entry-form"
import { RecordsTable } from "@/components/records-table"
import { TimeTracker } from "@/components/time-tracker"

interface CategoryData {
  id: string
  name: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function SecurityDashboard() {
  const [categories, setCategories] = useState<CategoryData[]>([
    {
      id: "staff",
      name: "Staff",
      count: 0,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      id: "contractors",
      name: "Contractors",
      count: 0,
      icon: HardHat,
      color: "bg-orange-500",
    },
    {
      id: "subcontractors",
      name: "Subcontractors",
      count: 0,
      icon: Wrench,
      color: "bg-purple-500",
    },
    {
      id: "clients",
      name: "Clients",
      count: 0,
      icon: Briefcase,
      color: "bg-green-500",
    },
    {
      id: "suppliers",
      name: "Suppliers",
      count: 0,
      icon: Truck,
      color: "bg-yellow-500",
    },
    {
      id: "visitors",
      name: "Visitors",
      count: 0,
      icon: UserCheck,
      color: "bg-red-500",
    },
  ])

  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false)
  const [isRecordsTableOpen, setIsRecordsTableOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [entries, setEntries] = useState<EntryData[]>([])

  const handleAddEntry = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setIsEntryFormOpen(true)
  }

  const handleViewRecords = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setIsRecordsTableOpen(true)
  }

  const handleEntrySubmit = (entryData: EntryData) => {
    setEntries((prev) => [...prev, entryData])

    // Update category count
    setCategories((prev) =>
      prev.map((cat) => (cat.id === entryData.category.toLowerCase() ? { ...cat, count: cat.count + 1 } : cat)),
    )
  }

  const handleCheckOut = (entryId: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              status: "exited" as const,
              exitTime: new Date().toISOString(),
            }
          : entry,
      ),
    )
  }

  const currentlyInside = entries.filter((entry) => entry.status === "inside").length
  const checkedOut = entries.filter((entry) => entry.status === "exited").length
  const totalEntries = entries.length

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div className="flex-shrink-0">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/2025%20LOGO-VKDxv7CBrndhNC53B0BNL6c6W1gbHS.jpeg"
                alt="RCC - El Race Contracting Logo"
                className="h-16 sm:h-20 lg:h-24 w-auto object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">
                Security Management System
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Visitor and Personnel Tracking Dashboard</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {categories.map((category) => {
                const IconComponent = category.icon
                return (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base sm:text-lg font-semibold text-gray-800">
                          {category.name}
                        </CardTitle>
                        <div className={`p-1.5 sm:p-2 rounded-lg ${category.color}`}>
                          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Current Count:</span>
                        <Badge variant="secondary" className="text-sm sm:text-lg px-2 sm:px-3 py-1">
                          {category.count}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => handleAddEntry(category.id)}
                          className="flex-1 text-xs sm:text-sm"
                          size="sm"
                        >
                          Add Entry
                        </Button>
                        <Button
                          onClick={() => handleViewRecords(category.id)}
                          variant="outline"
                          className="flex-1 text-xs sm:text-sm"
                          size="sm"
                        >
                          View Records
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Today's Summary</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-0">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{totalEntries}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Entries</div>
                </div>
                <div className="text-center p-2 sm:p-0">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{currentlyInside}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Currently Inside</div>
                </div>
                <div className="text-center p-2 sm:p-0">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{checkedOut}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Checked Out</div>
                </div>
                <div className="text-center p-2 sm:p-0">
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">0</div>
                  <div className="text-xs sm:text-sm text-gray-600">Pending Exit</div>
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
