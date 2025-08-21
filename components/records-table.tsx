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

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
        <DialogContent className="w-[98vw] max-w-7xl max-h-[95vh] overflow-hidden flex flex-col mx-1">
          <DialogHeader>
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
              <span>{category} Records</span>
              <Badge variant="outline" className="w-fit">
                {filteredEntries.length} entries
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              View and manage all {category.toLowerCase()} entries. You can search, view details, and check out people
              who are currently inside.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 py-3 sm:py-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, company, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Photo</TableHead>
                    <TableHead className="min-w-[120px]">Name</TableHead>
                    <TableHead className="min-w-[120px]">Company</TableHead>
                    <TableHead className="min-w-[100px]">Purpose</TableHead>
                    <TableHead className="min-w-[120px]">Contact</TableHead>
                    <TableHead className="min-w-[120px]">Entry Time</TableHead>
                    <TableHead className="min-w-[120px]">Exit Time</TableHead>
                    <TableHead className="min-w-[120px]">Status/Duration</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No entries found for {category.toLowerCase()}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                            <AvatarImage
                              src={entry.photo || "/placeholder.svg?height=40&width=40"}
                              alt={entry.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-xs sm:text-sm">
                              {entry.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium text-sm sm:text-base">{entry.name}</TableCell>
                        <TableCell className="text-sm sm:text-base">{entry.company || "N/A"}</TableCell>
                        <TableCell className="text-sm sm:text-base">{entry.purpose || "N/A"}</TableCell>
                        <TableCell className="text-sm sm:text-base">{entry.contactNumber || "N/A"}</TableCell>
                        <TableCell className="text-sm sm:text-base">{formatTime(entry.entryTime)}</TableCell>
                        <TableCell className="text-sm sm:text-base">
                          {entry.exitTime ? (
                            <span className="text-gray-600">{formatTime(entry.exitTime)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(entry.status, entry.entryTime)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSelectedEntry(entry)}
                              className="h-9 w-9 sm:h-10 sm:w-10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {entry.status === "inside" && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleCheckOut(entry)}
                                className="h-9 w-9 sm:h-10 sm:w-10"
                              >
                                <LogOut className="h-4 w-4" />
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

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Showing {filteredEntries.length} of{" "}
              {entries.filter((e) => e.category.toLowerCase() === category.toLowerCase()).length} entries
            </div>
            <Button onClick={onClose} className="h-10 px-6">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Details Modal */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="w-[95vw] max-w-md mx-2">
            <DialogHeader>
              <DialogTitle className="text-lg">Entry Details</DialogTitle>
              <DialogDescription className="text-sm">
                Detailed information for {selectedEntry.name}'s entry record.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedEntry.photo && (
                <div className="flex justify-center">
                  <img
                    src={selectedEntry.photo || "/placeholder.svg"}
                    alt={selectedEntry.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <p className="break-words">{selectedEntry.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Company:</span>
                  <p className="break-words">{selectedEntry.company || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Purpose:</span>
                  <p className="break-words">{selectedEntry.purpose || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Contact:</span>
                  <p className="break-words">{selectedEntry.contactNumber || "N/A"}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="break-words">{selectedEntry.email || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Vehicle:</span>
                  <p className="break-words">{selectedEntry.vehicleNumber || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Entry Time:</span>
                  <p>{formatTime(selectedEntry.entryTime)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedEntry.status, selectedEntry.entryTime)}</div>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="font-medium text-gray-600">Duration:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{calculateDuration(selectedEntry.entryTime, selectedEntry.exitTime)}</span>
                  </div>
                </div>
                {selectedEntry.exitTime && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="font-medium text-gray-600">Exit Time:</span>
                    <p>{formatTime(selectedEntry.exitTime)}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedEntry(null)} className="flex-1 h-11">
                  Close
                </Button>
                {selectedEntry.status === "inside" && (
                  <Button
                    onClick={() => {
                      handleCheckOut(selectedEntry)
                      setSelectedEntry(null)
                    }}
                    className="flex-1 h-11"
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
