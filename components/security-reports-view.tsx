"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, FileText, ImageIcon, Video } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

interface SecurityReport {
  id: number
  staff_name: string
  project_name: string
  Date: string
  description: string
  attachment: string | null
  created_at: string
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

export function SecurityReportsView() {
  const [reports, setReports] = useState<SecurityReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedReport, setSelectedReport] = useState<SecurityReport | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("[v0] Fetching security reports...")
      const response = await fetch("/api/security-reports/list?admin=true", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      console.log("[v0] Security reports response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Security reports fetch error:", errorText)
        throw new Error(`Failed to fetch reports: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Security reports fetched:", data.length)
      setReports(data)
    } catch (error) {
      console.error("[v0] Error fetching security reports:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch reports")
    } finally {
      setLoading(false)
    }
  }

  const filteredReports = reports.filter((report) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      (report.staff_name || "").toLowerCase().includes(searchLower) ||
      (report.project_name || "").toLowerCase().includes(searchLower) ||
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

  const downloadPDF = async (report: SecurityReport) => {
    try {
      // Create a temporary container for rendering
      const tempDiv = document.createElement("div")
      tempDiv.style.position = "absolute"
      tempDiv.style.left = "-9999px"
      tempDiv.style.width = "800px"
      tempDiv.style.padding = "40px"
      tempDiv.style.backgroundColor = "white"
      tempDiv.style.fontFamily = "Arial, sans-serif"

      // Build HTML content with proper Arabic text support
      tempDiv.innerHTML = `
        <div style="color: black;">
          <h1 style="text-align: center; margin-bottom: 30px; font-size: 24px;">Security Report</h1>
          
          <div style="margin-bottom: 15px;">
            <strong>Report #:</strong> ${report.id}
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Staff Name:</strong> ${report.staff_name}
          </div>
          
          <div style="margin-bottom: 15px; word-wrap: break-word;">
            <strong>Project:</strong> ${report.project_name || "N/A"}
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Date:</strong> ${formatDate(report.Date)}
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Description:</strong>
          </div>
          
          <div style="margin-bottom: 20px; padding: 10px; background: #f5f5f5; border-radius: 5px; word-wrap: break-word;">
            ${report.description}
          </div>
          
          <div style="margin-bottom: 10px;">
            <strong>Attachments (${JSON.parse(report.attachment || "[]").length}):</strong>
          </div>
          
          <div id="attachments-container" style="margin-bottom: 20px;">
            <!-- Images will be added here -->
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
            Generated on: ${new Date().toLocaleString()}
          </div>
        </div>
      `

      document.body.appendChild(tempDiv)

      // Load and add images
      const attachments = JSON.parse(report.attachment || "[]")
      const attachmentsContainer = tempDiv.querySelector("#attachments-container")

      for (const url of attachments) {
        if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
          const img = document.createElement("img")
          img.src = url
          img.style.maxWidth = "100%"
          img.style.marginBottom = "10px"
          img.style.border = "1px solid #ddd"
          img.style.borderRadius = "5px"
          attachmentsContainer?.appendChild(img)

          // Wait for image to load
          await new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
          })
        }
      }

      // Use html2canvas to convert HTML to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      })

      // Remove temp div
      document.body.removeChild(tempDiv)

      // Create PDF from canvas
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pageHeight = 297 // A4 height in mm

      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Save the PDF
      pdf.save(`security-report-${report.id}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  const loadImageAsDataURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL("image/jpeg", 0.8))
        } else {
          reject(new Error("Failed to get canvas context"))
        }
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = url
    })
  }

  const loadImage = async (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = url
    })
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchReports} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Retry
          </Button>
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
          <Eye className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 h-4 w-4 pointer-events-none" />
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
                    <TableHead className="font-semibold text-indigo-900">Project</TableHead>
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
                        <TableCell className="max-w-xs">
                          <p className="truncate text-gray-700 font-medium">{report.project_name || "N/A"}</p>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm">{formatDate(report.Date)}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-gray-600">{report.description}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {attachments.length} {attachments.length === 1 ? "file" : "files"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(report.created_at)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(report)}
                              className="hover:bg-indigo-100 hover:text-indigo-700"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => downloadPDF(report)}
                              className="hover:bg-green-100 hover:text-green-700"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
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
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Staff Member</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedReport.staff_name}</p>
                </div>
              </div>

              {/* Project Name */}
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 font-medium">Project</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedReport.project_name || "N/A"}</p>
                </div>
              </div>

              {/* Report Date */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Report Date & Time</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedReport.Date)}</p>
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
                    <ImageIcon className="h-4 w-4 text-gray-500" />
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
                                  <Video className="w-6 h-6 text-indigo-600" />
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
                <div>
                  <span className="text-sm text-gray-500">Report Submitted:</span>
                  <span className="text-sm font-medium text-gray-900 ml-2">
                    {formatDate(selectedReport.created_at)}
                  </span>
                </div>
                <Button
                  onClick={() => downloadPDF(selectedReport)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
