"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, QrCode, X } from "lucide-react"

interface EntryFormProps {
  isOpen: boolean
  onClose: () => void
  category: string
  onSubmit: (data: EntryData) => void
}

export interface EntryData {
  id: string
  category: string
  name: string
  company: string
  purpose: string
  contactNumber: string
  email: string
  vehicleNumber?: string
  fileId?: string
  photo?: string // Added photo property to interface
  entryTime: string
  exitTime?: string
  status: "inside" | "exited"
}

interface PersonDetails {
  name: string
  email: string
  phone: string
  department: string
  company: string
  image: string
}

const demoPersonData: Record<string, PersonDetails> = {
  "2897": {
    name: "Aziz",
    email: "aziz@elrace.com",
    phone: "0509363002",
    department: "IT",
    company: "El Race Contracting",
    image: "/images/aziz-profile.png",
  },
}

export function EntryForm({ isOpen, onClose, category, onSubmit }: EntryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    purpose: "",
    contactNumber: "",
    email: "",
    vehicleNumber: "",
    fileId: "",
  })

  const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [fileIdError, setFileIdError] = useState("")

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false)
  const [qrStream, setQrStream] = useState<MediaStream | null>(null)
  const qrVideoRef = useRef<HTMLVideoElement>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const handleCheckFileId = async () => {
    if (!formData.fileId.trim()) {
      setFileIdError("Please enter a File ID")
      return
    }

    setIsChecking(true)
    setFileIdError("")

    try {
      const response = await fetch("/api/odoo/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: formData.fileId }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        const person = result.data
        setPersonDetails(person)
        // Pre-populate form fields with fetched data
        setFormData((prev) => ({
          ...prev,
          name: person.name,
          email: person.email,
          contactNumber: person.phone,
          company: person.company,
          purpose: person.department,
        }))
      } else {
        setFileIdError(result.error || "File ID not found. Please check and try again.")
        setPersonDetails(null)
      }
    } catch (error) {
      console.error("Error fetching staff data:", error)
      setFileIdError("Error connecting to server. Please try again.")
      setPersonDetails(null)
    } finally {
      setIsChecking(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const entryData: EntryData = {
      id: Date.now().toString(),
      category,
      ...formData,
      photo: personDetails?.image || undefined,
      entryTime: new Date().toISOString(),
      status: "inside",
    }

    onSubmit(entryData)

    setFormData({
      name: "",
      company: "",
      purpose: "",
      contactNumber: "",
      email: "",
      vehicleNumber: "",
      fileId: "",
    })
    setPersonDetails(null)
    setFileIdError("")
    onClose()
  }

  const getCategorySpecificFields = () => {
    switch (category.toLowerCase()) {
      case "visitors":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="purpose">Purpose of Visit</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, purpose: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      case "staff":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Enter department"
              />
            </div>
          </div>
        )
      default:
        return (
          <div>
            <Label htmlFor="purpose">Purpose/Department</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="Enter purpose or department"
              rows={3}
            />
          </div>
        )
    }
  }

  const startQrScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      setQrStream(stream)
      setIsQrScannerOpen(true)

      if (qrVideoRef.current) {
        qrVideoRef.current.srcObject = stream
        qrVideoRef.current.play()
      }

      // Start scanning for QR codes
      scanForQrCode()
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }

  const stopQrScanner = () => {
    if (qrStream) {
      qrStream.getTracks().forEach((track) => track.stop())
      setQrStream(null)
    }
    setIsQrScannerOpen(false)
  }

  const scanForQrCode = () => {
    if (!qrVideoRef.current || !qrCanvasRef.current) return

    const video = qrVideoRef.current
    const canvas = qrCanvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Simple QR code detection simulation
        // In a real implementation, you'd use a QR code detection library
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

        // For demo purposes, simulate QR code detection after 3 seconds
        setTimeout(() => {
          if (isQrScannerOpen) {
            // Simulate finding QR code with File ID
            const simulatedQrData = "2897" // This would be extracted from actual QR code
            setFormData((prev) => ({ ...prev, fileId: simulatedQrData }))
            stopQrScanner()
            // Automatically check the File ID
            setTimeout(() => {
              handleCheckFileId()
            }, 100)
          }
        }, 3000)
      }

      if (isQrScannerOpen) {
        requestAnimationFrame(scan)
      }
    }

    scan()
  }

  useEffect(() => {
    return () => {
      if (qrStream) {
        qrStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [qrStream])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[95vh] overflow-y-auto mx-2">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add New {category} Entry</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Fill out the form below to register a new {category.toLowerCase()} entry into the system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {category.toLowerCase() === "staff" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fileId" className="text-sm sm:text-base">
                    File ID *
                  </Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="fileId"
                      required
                      value={formData.fileId}
                      onChange={(e) => {
                        setFormData({ ...formData, fileId: e.target.value })
                        setFileIdError("")
                        setPersonDetails(null)
                      }}
                      placeholder="Enter file ID"
                      className={`flex-1 h-11 text-base ${fileIdError ? "border-red-500" : ""}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={startQrScanner}
                        variant="outline"
                        size="default"
                        className="h-11 px-4 bg-transparent"
                      >
                        <QrCode className="h-5 w-5" />
                        <span className="hidden sm:inline ml-2">QR</span>
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCheckFileId}
                        disabled={isChecking || !formData.fileId.trim()}
                        size="default"
                        className="h-11 px-4 sm:px-6"
                      >
                        {isChecking ? "Checking..." : "Check"}
                      </Button>
                    </div>
                  </div>
                  {fileIdError && <p className="text-sm text-red-500">{fileIdError}</p>}
                </div>

                {personDetails && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800 text-sm sm:text-base">Person Found</span>
                      </div>
                      <div className="flex flex-col items-center gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={personDetails.image || "/placeholder.svg"}
                            alt={personDetails.name}
                            className="w-[100px] h-[100px] sm:w-[122px] sm:h-[122px] rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        </div>
                        <div className="text-center space-y-2 text-sm sm:text-base">
                          <div>
                            <strong>Full Name:</strong> {personDetails.name}
                          </div>
                          <div>
                            <strong>Company/Organization:</strong> {personDetails.company}
                          </div>
                          <div>
                            <strong>Contact Number:</strong> {personDetails.phone}
                          </div>
                          <div>
                            <strong>Email:</strong> {personDetails.email}
                          </div>
                          <div>
                            <strong>Department:</strong> {personDetails.department}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {(category.toLowerCase() !== "staff" || (fileIdError && !personDetails)) && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm sm:text-base">
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company" className="text-sm sm:text-base">
                      Company/Organization
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Enter company"
                      className="h-11 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact" className="text-sm sm:text-base">
                      Contact Number
                    </Label>
                    <Input
                      id="contact"
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      placeholder="Enter phone number"
                      className="h-11 text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm sm:text-base">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email"
                      className="h-11 text-base"
                    />
                  </div>
                </div>

                {getCategorySpecificFields()}
              </>
            )}

            {category.toLowerCase() === "staff" && (
              <>
                {personDetails && (
                  <div>
                    <Label htmlFor="vehicle" className="text-sm sm:text-base">
                      Vehicle Number (Optional)
                    </Label>
                    <Input
                      id="vehicle"
                      value={formData.vehicleNumber}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      placeholder="Enter vehicle number"
                      className="h-11 text-base"
                    />
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-11 text-base bg-transparent"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 text-base"
                disabled={category.toLowerCase() === "staff" ? !personDetails && !fileIdError : false}
              >
                Add Entry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isQrScannerOpen} onOpenChange={stopQrScanner}>
        <DialogContent className="w-[95vw] max-w-md mx-2">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-lg">
              Scan QR Code
              <Button variant="ghost" size="icon" onClick={stopQrScanner} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-sm">
              Position the QR code within the camera view to scan the File ID.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video ref={qrVideoRef} className="w-full h-48 sm:h-64 object-cover" playsInline muted />
              <div className="absolute inset-0 border-2 border-white border-dashed m-6 sm:m-8 rounded-lg pointer-events-none" />
            </div>
            <p className="text-sm text-gray-600 text-center">Point your camera at a QR code containing the File ID</p>
            <canvas ref={qrCanvasRef} className="hidden" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
