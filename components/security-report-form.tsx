"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, Loader2, FileImage, FileVideo } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SecurityReportFormProps {
  isOpen: boolean
  onClose: () => void
  staffName?: string
  onSubmitSuccess?: () => void
}

export function SecurityReportForm({ isOpen, onClose, staffName = "", onSubmitSuccess }: SecurityReportFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [formData, setFormData] = useState({
    staff_name: staffName,
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    description: "",
  })
  const [attachments, setAttachments] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    const uploadedUrls: string[] = []

    for (const file of selectedFiles) {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/security-reports/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        uploadedUrls.push(data.url)
      } else {
        throw new Error(`Failed to upload ${file.name}`)
      }
    }

    return uploadedUrls
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      let uploadedUrls: string[] = []

      // Upload files if any
      if (selectedFiles.length > 0) {
        setUploadingFiles(true)
        toast({
          title: "Uploading files...",
          description: `Uploading ${selectedFiles.length} file(s)`,
        })
        uploadedUrls = await uploadFiles()
        setUploadingFiles(false)
      }

      // Combine date and time
      const dateTime = `${formData.date}T${formData.time}:00`

      // Submit the report
      const response = await fetch("/api/security-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staff_name: formData.staff_name,
          date: dateTime,
          description: formData.description,
          attachment: uploadedUrls,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Security report submitted successfully",
        })
        // Reset form
        setFormData({
          staff_name: staffName,
          date: new Date().toISOString().split("T")[0],
          time: new Date().toTimeString().slice(0, 5),
          description: "",
        })
        setSelectedFiles([])
        setAttachments([])
        onSubmitSuccess?.()
        onClose()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit report")
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit security report",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setUploadingFiles(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">Add Security Report</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="staff_name">Security Staff Name *</Label>
            <Input
              id="staff_name"
              value={formData.staff_name}
              onChange={(e) => setFormData({ ...formData, staff_name: e.target.value })}
              placeholder="Enter staff name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter detailed description of the incident or observation"
              rows={6}
              required
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments (Photos/Videos)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload photos or videos</p>
                <p className="text-xs text-gray-500 mt-1">Multiple files supported</p>
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      {file.type.startsWith("image/") ? (
                        <FileImage className="h-5 w-5 text-blue-600" />
                      ) : (
                        <FileVideo className="h-5 w-5 text-purple-600" />
                      )}
                      <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
              {uploadingFiles ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
