"use client"

import type React from "react"
import type { ReactElement } from "react"
import { useState, useRef, useEffect } from "react"
import { ErrorBoundary } from "react-error-boundary"
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
  numberOfPersons?: number
  vehicleNumber?: string
  fileId?: string
  photo?: string
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

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }): ReactElement {
  console.error("[v0] React Error Boundary caught error:", error)
  console.error("[v0] Error stack:", error.stack)

  return (
    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
      <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
      <p className="text-red-600 mb-4">Error: {error.message}</p>
      <Button onClick={resetErrorBoundary} variant="outline">
        Try again
      </Button>
    </div>
  )
}

export function EntryForm({ isOpen, onClose, category, onSubmit }: EntryFormProps): ReactElement {
  const [isMounted, setIsMounted] = useState(false)
  const [reactError, setReactError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    purpose: "",
    contactNumber: "",
    email: "",
    numberOfPersons: 1,
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

  useEffect(() => {
    setIsMounted(true)
    console.log("[v0] Component mounted on client side")
  }, [])

  const handleCheckFileId = async () => {
    try {
      if (!isMounted) {
        console.log("[v0] Component not yet mounted, skipping File ID check")
        return
      }

      console.log("[v0] ===== REACT ERROR CHECK =====")
      console.log(
        "[v0] React version:",
        typeof window !== "undefined" ? (window as any).React?.version || "unknown" : "unknown",
      )
      console.log("[v0] Component mounted:", isMounted)
      console.log("[v0] Window object:", typeof window)
      console.log("[v0] Document ready state:", typeof document !== "undefined" ? document.readyState : "unknown")

      if (!formData.fileId.trim()) {
        setFileIdError("Please enter a File ID")
        return
      }

      console.log("[v0] ===== FILE ID CHECK START =====")
     
if (typeof window !== "undefined") {
  console.log("[v0] Environment:", {
    url: "https://rccsecurity.vercel.app/",
    origin: "https://rccsecurity.vercel.app",
    hostname: "rccsecurity.vercel.app",
    protocol: "https:",
    userAgent: navigator.userAgent,
  })
}

      console.log("[v0] Starting File ID check for:", formData.fileId)
      console.log("[v0] Current timestamp:", new Date().toISOString())

      setIsChecking(true)
      setFileIdError("")
      setReactError(null)

      console.log("[v0] Making API request to /api/odoo/staff")
      console.log("[v0] Request payload:", { fileId: formData.fileId })

      const response = await fetch("/api/odoo/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: formData.fileId }),
      })

      console.log("[v0] API response received:")
      console.log("[v0] - Status:", response.status)
      console.log("[v0] - Status Text:", response.statusText)
      console.log("[v0] - Headers:", Object.fromEntries(response.headers.entries()))

      const result = await response.json()
      console.log("[v0] API response data:", result)
      console.log("[v0] Response success flag:", result.success)

      if (response.ok && result.success) {
        const person = result.data
        console.log("[v0] ✅ SUCCESS: Person data received:", person)
        console.log("[v0] Person fields:", {
          name: person.name,
          email: person.email,
          phone: person.phone,
          department: person.department,
          company: person.company,
          hasImage: !!person.image,
        })

        try {
          setPersonDetails(person)
          setFormData((prev) => ({
            ...prev,
            name: person.name,
            email: person.email,
            contactNumber: person.phone,
            company: person.company,
            purpose: person.department,
          }))
          console.log("[v0] ✅ Form data updated successfully")
        } catch (stateError) {
          console.error("[v0] ❌ React state update error:", stateError)
          setReactError(`State update failed: ${stateError.message}`)
        }
      } else {
        console.log("[v0] ❌ API request failed:")
        console.log("[v0] - Response OK:", response.ok)
        console.log("[v0] - Result success:", result.success)
        console.log("[v0] - Error message:", result.error)

        const errorMessage = result.error || "File ID not found. Please check and try again."
        console.log("[v0] Setting error message:", errorMessage)
        setFileIdError(errorMessage)
        setPersonDetails(null)
      }
    } catch (error) {
      console.error("[v0] ❌ CATCH ERROR: Error fetching staff data:", error)
      console.error("[v0] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })

      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setFileIdError("Network error. Please check your internet connection.")
      } else if (error.name === "SyntaxError") {
        setFileIdError("Server response error. Please try again.")
      } else {
        setFileIdError("Error connecting to server. Please try again.")
      }

      setPersonDetails(null)
      setReactError(`Fetch error: ${error.message}`)
    } finally {
      setIsChecking(false)
      console.log("[v0] ===== FILE ID CHECK END =====")
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
      numberOfPersons: 1,
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
      if (!isMounted || typeof navigator === "undefined") {
        console.log("[v0] Cannot start QR scanner - not mounted or no navigator")
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      setQrStream(stream)
      setIsQrScannerOpen(true)

      if (qrVideoRef.current) {
        qrVideoRef.current.srcObject = stream
        qrVideoRef.current.play()
      }

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

        setTimeout(() => {
          if (isQrScannerOpen) {
            const simulatedQrData = "2897"
            setFormData((prev) => ({ ...prev, fileId: simulatedQrData }))
            stopQrScanner()
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

  if (!isMounted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-lg max-h-[95vh] overflow-y-auto mx-2">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("[v0] Error Boundary triggered:", error)
        console.error("[v0] Error Info:", errorInfo)
        setReactError(`React Error: ${error.message}`)
      }}
      onReset={() => {
        setReactError(null)
        setFileIdError("")
        setPersonDetails(null)
      }}
    >
      {reactError && (
        <div className="fixed top-4 right-4 z-50 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-md">
          <strong>React Error:</strong> {reactError}
          <Button onClick={() => setReactError(null)} variant="ghost" size="sm" className="ml-2">
            ×
          </Button>
        </div>
      )}

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

                <div>
                  <Label htmlFor="numberOfPersons" className="text-sm sm:text-base">
                    Number of Persons
                  </Label>
                  <Input
                    id="numberOfPersons"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numberOfPersons}
                    onChange={(e) =>
                      setFormData({ ...formData, numberOfPersons: Number.parseInt(e.target.value) || 1 })
                    }
                    placeholder="Enter number of persons"
                    className="h-11 text-base"
                  />
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
    </ErrorBoundary>
  )
}
