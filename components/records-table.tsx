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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {category} Records
              <Badge variant="outline">{filteredEntries.length} entries</Badge>
            </DialogTitle>
            <DialogDescription>
              View and manage all {category.toLowerCase()} entries. You can search, view details, and check out people
              who are currently inside.
            </DialogDescription>
          </DialogHeader>

          {/* Search Bar */}
          <div className="flex items-center gap-2 py-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, company, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Exit Time</TableHead>
                  <TableHead>Status/Duration</TableHead>
                  <TableHead>Actions</TableHead>
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
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={entry.photo || "/placeholder.svg?height=40&width=40"}
                            alt={entry.name}
                            className="object-cover"
                          />
                          <AvatarFallback>{entry.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>{entry.company || "N/A"}</TableCell>
                      <TableCell>{entry.purpose || "N/A"}</TableCell>
                      <TableCell>{entry.contactNumber || "N/A"}</TableCell>
                      <TableCell>{formatTime(entry.entryTime)}</TableCell>
                      <TableCell>
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
                            size="sm"
                            onClick={() => setSelectedEntry(entry)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {entry.status === "inside" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckOut(entry)}
                              className="h-8 w-8 p-0"
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

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {filteredEntries.length} of{" "}
              {entries.filter((e) => e.category.toLowerCase() === category.toLowerCase()).length} entries
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entry Details Modal */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Entry Details</DialogTitle>
              <DialogDescription>Detailed information for {selectedEntry.name}'s entry record.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Photo */}
              {selectedEntry.photo && (
                <div className="flex justify-center">
                  <img
                    src={selectedEntry.photo || "/placeholder.svg"}
                    alt={selectedEntry.name}
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Name:</span>
                  <p>{selectedEntry.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Company:</span>
                  <p>{selectedEntry.company || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Purpose:</span>
                  <p>{selectedEntry.purpose || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Contact:</span>
                  <p>{selectedEntry.contactNumber || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p>{selectedEntry.email || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Vehicle:</span>
                  <p>{selectedEntry.vehicleNumber || "N/A"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Entry Time:</span>
                  <p>{formatTime(selectedEntry.entryTime)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Status:</span>
                  <p>{getStatusBadge(selectedEntry.status, selectedEntry.entryTime)}</p>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Duration:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{calculateDuration(selectedEntry.entryTime, selectedEntry.exitTime)}</span>
                  </div>
                </div>
                {selectedEntry.exitTime && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Exit Time:</span>
                    <p>{formatTime(selectedEntry.exitTime)}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedEntry(null)} className="flex-1">
                  Close
                </Button>
                {selectedEntry.status === "inside" && (
                  <Button
                    onClick={() => {
                      handleCheckOut(selectedEntry)
                      setSelectedEntry(null)
                    }}
                    className="flex-1"
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
