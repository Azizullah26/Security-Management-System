"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, LogOut, Eye, Clock } from "lucide-react"
import type { EntryData } from "./entry-form"

interface RecordsTableProps {
  isOpen: boolean
  onClose: () => void
  category: string
  entries: EntryData[]
  onCheckOut: (entryId: string) => void
}

export function RecordsTable({ isOpen, onClose, category, entries, onCheckOut }: RecordsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEntry, setSelectedEntry] = useState<EntryData | null>(null)

  // Filter entries by category and search term
  const filteredEntries = entries
    .filter((entry) => entry.category.toLowerCase() === category.toLowerCase())
    .filter(
      (entry) =>
        entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.contactNumber.includes(searchTerm),
    )

  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return "N/A"

    try {
      const date = new Date(isoString)
      // Check if date is valid
      if (isNaN(date.getTime())) return "Invalid Date"

      return date.toLocaleString("en-US", {
        timeZone: "Asia/Dubai",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("[v0] Error formatting date:", error)
      return "Invalid Date"
    }
  }

  const calculateDuration = (entryTime: string, exitTime?: string): string => {
    const entry = new Date(entryTime)
    const exit = exitTime ? new Date(exitTime) : new Date()
    const diffMs = exit.getTime() - entry.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours === 0) {
      return `${diffMinutes}m`
    }
    return `${diffHours}h ${diffMinutes}m`
  }

  const getStatusBadge = (status: string, entryTime: string) => {
    if (status === "inside") {
      const duration = calculateDuration(entryTime)
      const hours = Number.parseInt(duration.split("h")[0]) || 0
      const isOvertime = hours >= 8

      return (
        <div className="flex flex-col items-center gap-1">
          <Badge
            className={
              isOvertime ? "bg-red-100 text-red-800 hover:bg-red-100" : "bg-green-100 text-green-800 hover:bg-green-100"
            }
          >
            Inside
          </Badge>
          <span className={`text-xs ${isOvertime ? "text-red-600" : "text-gray-500"}`}>{duration}</span>
        </div>
      )
    } else {
      return <Badge variant="secondary">Exited</Badge>
    }
  }

  const handleCheckOut = (entry: EntryData) => {
    if (entry.status === "inside") {
      onCheckOut(entry.id)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[99vw] max-w-[100rem] max-h-[98vh] overflow-hidden flex flex-col mx-1 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 border-2 border-blue-100">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl text-slate-800">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                {category} Records
              </span>
              <Badge
                variant="outline"
                className="w-fit bg-gradient-to-r from-blue-100 to-purple-100 border-blue-200 text-blue-700"
              >
                {filteredEntries.length} entries
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-slate-600">
              View and manage all {category.toLowerCase()} entries. You can search, view details, and check out people
              who are currently inside.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 py-3 sm:py-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input
                placeholder="Search by name, company, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base bg-white/80 border-blue-200 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white/60 rounded-lg border border-blue-100">
            <div className="min-w-[1200px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-100">
                    <TableHead className="w-16 text-slate-700 font-semibold">Photo</TableHead>
                    <TableHead className="min-w-[150px] text-slate-700 font-semibold">Name</TableHead>
                    <TableHead className="min-w-[150px] text-slate-700 font-semibold">Company</TableHead>
                    <TableHead className="min-w-[120px] text-slate-700 font-semibold">Purpose</TableHead>
                    <TableHead className="min-w-[140px] text-slate-700 font-semibold">Contact</TableHead>
                    <TableHead className="min-w-[140px] text-slate-700 font-semibold">Entry Time</TableHead>
                    <TableHead className="min-w-[140px] text-slate-700 font-semibold">Exit Time</TableHead>
                    <TableHead className="min-w-[140px] text-slate-700 font-semibold">Status/Duration</TableHead>
                    <TableHead className="w-24 text-slate-700 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                        No entries found for {category.toLowerCase()}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry, index) => (
                      <TableRow key={entry.id} className={index % 2 === 0 ? "bg-white/40" : "bg-slate-50/40"}>
                        <TableCell>
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-blue-200">
                            <AvatarImage
                              src={entry.photo || "/placeholder.svg?height=40&width=40"}
                              alt={entry.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700">
                              {entry.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium text-sm sm:text-base text-slate-800">{entry.name}</TableCell>
                        <TableCell className="text-sm sm:text-base text-slate-700">{entry.company || "N/A"}</TableCell>
                        <TableCell className="text-sm sm:text-base text-slate-700">{entry.purpose || "N/A"}</TableCell>
                        <TableCell className="text-sm sm:text-base text-slate-700">
                          {entry.contactNumber || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm sm:text-base text-slate-700">
                          {formatTime(entry.entryTime)}
                        </TableCell>
                        <TableCell className="text-sm sm:text-base">
                          {entry.exitTime ? (
                            <span className="text-slate-600">{formatTime(entry.exitTime)}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(entry.status, entry.entryTime)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSelectedEntry(entry)}
                              className="h-9 w-9 sm:h-10 sm:w-10 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            {entry.status === "inside" && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCheckOut(entry)}
                                className="h-9 w-9 sm:h-10 sm:w-10 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                              >
                                <LogOut className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-blue-100 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-b-lg -mx-6 px-6 -mb-6 pb-6">
            <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
              Showing {filteredEntries.length} of{" "}
              {entries.filter((e) => e.category.toLowerCase() === category.toLowerCase()).length} entries
            </div>
            <Button
              onClick={onClose}
              className="h-10 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Details Modal */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="w-[95vw] max-w-md mx-2 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 border-2 border-blue-100">
            <DialogHeader>
              <DialogTitle className="text-lg text-slate-800">Entry Details</DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                Detailed information for {selectedEntry.name}'s entry record.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedEntry.photo && (
                <div className="flex justify-center">
                  <img
                    src={selectedEntry.photo || "/placeholder.svg"}
                    alt={selectedEntry.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-blue-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm bg-white/60 p-4 rounded-lg border border-blue-100">
                <div>
                  <span className="font-medium text-blue-700">Name:</span>
                  <p className="break-words text-slate-700">{selectedEntry.name}</p>
                </div>
                <div>
                  <span className="font-medium text-purple-700">Company:</span>
                  <p className="break-words text-slate-700">{selectedEntry.company || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Purpose:</span>
                  <p className="break-words text-slate-700">{selectedEntry.purpose || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-orange-700">Contact:</span>
                  <p className="break-words text-slate-700">{selectedEntry.contactNumber || "N/A"}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-medium text-pink-700">Email:</span>
                  <p className="break-words text-slate-700">{selectedEntry.email || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-indigo-700">Vehicle:</span>
                  <p className="break-words text-slate-700">{selectedEntry.vehicleNumber || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-teal-700">Entry Time:</span>
                  <p className="text-slate-700">{formatTime(selectedEntry.entryTime)}</p>
                </div>
                <div>
                  <span className="font-medium text-cyan-700">Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedEntry.status, selectedEntry.entryTime)}</div>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="font-medium text-violet-700">Duration:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-violet-500" />
                    <span className="text-slate-700">
                      {calculateDuration(selectedEntry.entryTime, selectedEntry.exitTime)}
                    </span>
                  </div>
                </div>
                {selectedEntry.exitTime && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="font-medium text-red-700">Exit Time:</span>
                    <p className="text-slate-700">{formatTime(selectedEntry.exitTime)}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEntry(null)}
                  className="flex-1 h-11 border-slate-200 hover:bg-slate-50"
                >
                  Close
                </Button>
                {selectedEntry.status === "inside" && (
                  <Button
                    onClick={() => {
                      handleCheckOut(selectedEntry)
                      setSelectedEntry(null)
                    }}
                    className="flex-1 h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Check Out
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
