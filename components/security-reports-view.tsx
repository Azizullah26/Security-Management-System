"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, FileText, Video, Trash2 } from "lucide-react"
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
  const [deletingId, setDeletingId] = useState<number | null>(null)

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

  const handleDeleteReport = async (reportId: number) => {
    if (!confirm(`Are you sure you want to delete report #${reportId}? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(reportId)
      const response = await fetch(`/api/security-reports/delete?id=${reportId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete report")
      }

      // Remove the deleted report from state
      setReports((prev) => prev.filter((r) => r.id !== reportId))
    } catch (error) {
      console.error("[v0] Error deleting report:", error)
      alert("Failed to delete report. Please try again.")
    } finally {
      setDeletingId(null)
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
      const iframe = document.createElement("iframe")
      iframe.style.position = "absolute"
      iframe.style.left = "-9999px"
      iframe.style.width = "800px"
      iframe.style.height = "1px"
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) throw new Error("Failed to create iframe document")

      // Write a complete HTML document with only standard colors
      iframeDoc.open()
      const attachments = parseAttachments(report.attachment)
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background-color: #ffffff;
              color: #000000;
              padding: 40px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #4f46e5;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #4f46e5;
              margin-bottom: 10px;
            }
            .info-section {
              margin-bottom: 20px;
            }
            .info-row {
              margin-bottom: 12px;
              line-height: 1.6;
            }
            .label {
              font-weight: 600;
              color: #374151;
              display: inline-block;
              min-width: 120px;
            }
            .value {
              color: #000000;
            }
            .description {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #e5e7eb;
            }
            .attachments {
              margin-top: 20px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Security Report</div>
          </div>
          
          <div class="info-section">
            <div class="info-row">
              <span class="label">Report #:</span>
              <span class="value">${report.id}</span>
            </div>
            <div class="info-row">
              <span class="label">Staff Name:</span>
              <span class="value">${report.staff_name}</span>
            </div>
            <div class="info-row">
              <span class="label">Project:</span>
              <span class="value">${report.project_name || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="label">Created:</span>
              <span class="value">${formatDate(report.created_at)}</span>
            </div>
          </div>
          
          <div class="description">
            <div style="font-weight: 600; margin-bottom: 10px; color: #374151;">Description:</div>
            <div>${report.description}</div>
          </div>
          
          ${
            attachments.length > 0
              ? `
          <div class="attachments">
            <div style="font-weight: 600; margin-bottom: 10px; color: #374151;">Attachments (${attachments.length}):</div>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
              ${attachments
                .map((url, index) => {
                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                  if (isImage) {
                    return `
                      <div style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                        <img src="${url}" alt="Attachment ${index + 1}" style="width: 100%; height: 200px; object-fit: cover;" />
                      </div>
                    `
                  }
                  return `
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center;">
                      <div style="color: #6b7280;">Video Attachment ${index + 1}</div>
                      <a href="${url}" style="color: #4f46e5; text-decoration: none; font-size: 12px;">View Video</a>
                    </div>
                  `
                })
                .join("")}
            </div>
          </div>
          `
              : ""
          }
          
          <div class="footer">
            <div>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            <div style="margin-top: 5px;">Security Management System</div>
          </div>
        </body>
        </html>
      `)
      iframeDoc.close()

      // Wait for iframe to be ready
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Load and add images to iframe
      const attachmentsContainer = iframeDoc.getElementById("attachments-container")

      for (const url of attachments) {
        if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
          const img = iframeDoc.createElement("img")
          img.src = url
          attachmentsContainer?.appendChild(img)

          // Wait for image to load
          await new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
            setTimeout(resolve, 3000) // timeout after 3s
          })
        }
      }

      // Wait a bit more for rendering
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Capture the iframe body with html2canvas
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      })

      // Remove iframe
      document.body.removeChild(iframe)

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

  // These functions were not modified in the provided updates, so they are kept as is.
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
                    <TableHead className="font-semibold text-indigo-900">Attachments</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Created</TableHead>
                    <TableHead className="font-semibold text-indigo-900 text-center">Actions</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Staff Name</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Project</TableHead>
                    <TableHead className="font-semibold text-indigo-900">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const attachments = parseAttachments(report.attachment)

                    return (
                      <TableRow key={report.id} className="hover:bg-indigo-50/50 transition-colors">
                        <TableCell className="font-medium text-indigo-700">#{report.id}</TableCell>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteReport(report.id)}
                              disabled={deletingId === report.id}
                              className="hover:bg-red-100 hover:text-red-700"
                              title="Delete Report"
                            >
                              <Trash2 className={`h-4 w-4 ${deletingId === report.id ? "animate-spin" : ""}`} />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{report.staff_name}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-gray-700 font-medium">{report.project_name || "N/A"}</p>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-gray-600">{report.description}</p>
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
                  <p className="text-sm text-gray-500 font-medium">Created</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(selectedReport.created_at)}</p>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 font-medium mb-2">Description</p>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedReport.description}</p>
              </div>

              {/* Attachments */}
              {parseAttachments(selectedReport.attachment).length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500 font-medium mb-3">
                    Attachments ({parseAttachments(selectedReport.attachment).length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {parseAttachments(selectedReport.attachment).map((url, index) => {
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
                      const isVideo = /\.(mp4|webm|mov)$/i.test(url)

                      if (isImage) {
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-400 transition-colors"
                          >
                            <img
                              src={url || "/placeholder.svg"}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          </a>
                        )
                      }

                      if (isVideo) {
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center h-32 rounded-lg border border-gray-200 bg-gray-100 hover:border-indigo-400 transition-colors"
                          >
                            <Video className="h-8 w-8 text-gray-500" />
                          </a>
                        )
                      }

                      return (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center h-32 rounded-lg border border-gray-200 bg-gray-100 hover:border-indigo-400 transition-colors"
                        >
                          <FileText className="h-8 w-8 text-gray-500" />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => downloadPDF(selectedReport)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)} className="border-gray-300">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
