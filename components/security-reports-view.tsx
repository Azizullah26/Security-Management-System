"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, FileText, Calendar, User, Paperclip, Download, Eye, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

interface SecurityReport {
  id: number
  staff_name: string
  Date: string
  description: string
  attachment: string | null
  created_at: string
}

export function SecurityReportsView() {
  const [reports, setReports] = useState<SecurityReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReport, setSelectedReport] = useState<SecurityReport | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; report: SecurityReport | null }>({
    isOpen: false,
    report: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      console.log("[v0] Security Reports View: Starting fetch")
      setLoading(true)

      const response = await fetch("/api/security-reports/list", {
        credentials: "include",
      })

      console.log("[v0] Security Reports View: Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Security Reports View: API error:", errorData)
        throw new Error("Failed to fetch reports")
      }

      const data = await response.json()
      console.log("[v0] Security Reports View: Received", data?.length || 0, "reports")
      console.log("[v0] Security Reports View: First report:", data?.[0])

      setReports(data)
    } catch (error) {
      console.error("[v0] Security Reports View: Caught error:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter((report) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (report.staff_name || "").toLowerCase().includes(searchLower) ||
      (report.description || "").toLowerCase().includes(searchLower) ||
      (report.Date || "").toLowerCase().includes(searchLower)
    )
  })

  const parseAttachments = (attachment: string | null): string[] => {
    if (!attachment) return []
    try {
      const parsed = JSON.parse(attachment)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const handleViewDetails = (report: SecurityReport) => {
    setSelectedReport(report)
    setIsDetailsOpen(true)
  }

  const handleDeleteReport = async (report: SecurityReport) => {
    setDeleteDialog({ isOpen: true, report })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.report) return

    try {
      setIsDeleting(true)
      console.log("[v0] Security Reports View: Deleting report ID:", deleteDialog.report.id)

      const response = await fetch(`/api/security-reports/delete?id=${deleteDialog.report.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Security Reports View: Delete error:", errorData)
        throw new Error(errorData.error || "Failed to delete report")
      }

      console.log("[v0] Security Reports View: Report deleted successfully")

      toast({
        title: "Success",
        description: "Security report deleted successfully",
      })

      // Refresh the reports list
      await fetchReports()

      // Close the delete dialog
      setDeleteDialog({ isOpen: false, report: null })
    } catch (error) {
      console.error("[v0] Security Reports View: Delete caught error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete report",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl border border-white/30 shadow-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Security Reports
          </h1>
          <p className="text-gray-600 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent font-medium">
            View all submitted security reports with details and attachments
          </p>
        </div>
        <Button
          onClick={fetchReports}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
        >
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 shadow-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 h-4 w-4 pointer-events-none" />
          <Input
            placeholder="Search by staff name, description, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-purple-200 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
        <Badge className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1">
          {filteredReports.length} {filteredReports.length === 1 ? "Report" : "Reports"}
        </Badge>
      </div>

      {/* Reports Table */}
      {filteredReports.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">
              {searchTerm ? "No reports match your search" : "No security reports submitted yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-gradient-to-r from-indigo-100 to-purple-100">
                  <TableRow>
                    <TableHead className="font-semibold text-indigo-900">Report #</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Staff Name</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Date & Time</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Description</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Attachments</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Created</TableHead>
                    <TableHead className="font-semibold text-indigo-900 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const attachments = parseAttachments(report.attachment)

                    return (
                      <TableRow key={report.id} className="hover:bg-indigo-50/50 transition-colors">
                        <TableCell className="font-medium text-indigo-700">#{report.id}</TableCell>
                        <TableCell className="font-medium">{report.staff_name}</TableCell>
                        <TableCell>
                          {report.Date ? format(new Date(report.Date), "MMM dd, yyyy HH:mm") : "N/A"}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-gray-600">{report.description}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {attachments.length} {attachments.length === 1 ? "file" : "files"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {format(new Date(report.created_at), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(report)}
                              className="hover:bg-indigo-100 hover:text-indigo-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteReport(report)}
                              className="hover:bg-red-100 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Security Report Details #{selectedReport?.id}
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6 mt-4">
              {/* Staff Name */}
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Staff Member</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedReport.staff_name}</p>
                </div>
              </div>

              {/* Report Date */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Report Date & Time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedReport.Date ? format(new Date(selectedReport.Date), "PPpp") : "N/A"}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500 font-medium mb-2">Description</p>
                <p className="text-gray-800 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              {/* Attachments */}
              {parseAttachments(selectedReport.attachment).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-500 font-medium">
                      Attachments ({parseAttachments(selectedReport.attachment).length})
                    </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {parseAttachments(selectedReport.attachment).map((url, index) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                      const isVideo = /\.(mp4|webm|mov)$/i.test(url)

                      return (
                        <div
                          key={index}
                          className="group relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 transition-all"
                        >
                          {isImage && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square">
                              <img
                                src={url || "/placeholder.svg"}
                                alt={`Attachment ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            </a>
                          )}
                          {isVideo && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square">
                              <video src={url} className="w-full h-full object-cover" controls={false} />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="bg-white/90 rounded-full p-3">
                                  <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                            </a>
                          )}
                          <a
                            href={url}
                            download
                            className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="h-3 w-3 text-indigo-600" />
                          </a>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Created At */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-t border-gray-200">
                <span className="text-sm text-gray-500">Report Submitted:</span>
                <span className="text-sm font-medium text-gray-900">
                  {format(new Date(selectedReport.created_at), "PPpp")}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog({ isOpen: open, report: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Security Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this security report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteDialog.report && (
            <div className="space-y-2 py-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Report #:</span> {deleteDialog.report.id}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Staff:</span> {deleteDialog.report.staff_name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span>{" "}
                {deleteDialog.report.Date ? format(new Date(deleteDialog.report.Date), "PPP") : "N/A"}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ isOpen: false, report: null })}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
