"use client"

import type React from "react"
import type { ReactElement } from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CheckCircle, QrCode, X } from "lucide-react"
import type { EntryData } from "../entry-form"

interface PersonDetails {
  name: string
  email: string
  phone: string
  department: string
  company: string
  image: string
  jobPosition: string
}

interface StaffEntryFormProps {
  onSubmit: (data: EntryData) => void
  onCancel: () => void
}

const demoPersonData: Record<string, PersonDetails> = {
  "2897": {
    name: "Aziz",
    email: "aziz@elrace.com",
    phone: "0509363002",
    department: "IT",
    company: "El Race Contracting",
    image: "/images/aziz-profile.png",
    jobPosition: "Developer",
  },
}

export function StaffEntryForm({ onSubmit, onCancel }: StaffEntryFormProps): ReactElement {
  const [isMounted, setIsMounted] = useState(false)
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
    console.log("[v0] Staff form component mounted on client side")
  }, [])

  const handleCheckFileId = async () => {
    try {
      if (!isMounted) {
        console.log("[v0] Component not yet mounted, skipping File ID check")
        return
      }

      if (!formData.fileId.trim()) {
        setFileIdError("Please enter a File ID")
        return
      }

      console.log("[v0] Starting File ID check for:", formData.fileId)
      setIsChecking(true)
      setFileIdError("")

      const response = await fetch("/api/odoo/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId: formData.fileId }),
      })

      const result = await response.json()
      console.log("[v0] API response data:", result)

      if (response.ok && result.success) {
        const person = result.data
        console.log("[v0] ✅ SUCCESS: Person data received:", person)

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
      } else {
        console.log("[v0] ❌ API request failed:", result.error)
        const errorMessage = result.error || "File ID not found. Please check and try again."
        setFileIdError(errorMessage)
        setPersonDetails(null)
      }
    } catch (error) {
      console.error("[v0] ❌ Error fetching staff data:", error)
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
      category: "staff",
      ...formData,
      photo: personDetails?.image || undefined,
      entryTime: new Date().toISOString(),
      status: "inside",
    }

    onSubmit(entryData)
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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 p-1">
        <div className="space-y-2">
          <Label htmlFor="fileId" className="text-sm sm:text-base font-semibold text-blue-700">
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (formData.fileId.trim() && !isChecking) {
                    handleCheckFileId()
                  }
                }
              }}
              placeholder="Enter file ID"
              className={`flex-1 h-11 text-base text-black bg-white/80 border-2 border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 rounded-lg ${fileIdError ? "border-red-300 focus:border-red-400" : ""}`}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={startQrScanner}
                variant="outline"
                size="default"
                className="h-11 px-4 bg-white border-2 border-black hover:bg-black hover:text-white text-black transition-colors duration-200"
              >
                <QrCode className="h-5 w-5" />
                <span className="hidden sm:inline ml-2">QR</span>
              </Button>
              <Button
                type="button"
                onClick={handleCheckFileId}
                disabled={isChecking || !formData.fileId.trim()}
                size="default"
                className="h-11 px-4 sm:px-6 bg-black hover:bg-gray-800 active:bg-gray-900 text-white border-0 disabled:bg-gray-400 disabled:text-gray-200 transition-colors duration-200"
              >
                {isChecking ? "Checking..." : "Check"}
              </Button>
            </div>
          </div>
          {fileIdError && (
            <p className="text-sm text-red-500 bg-red-50 p-2 rounded-lg border border-red-200">{fileIdError}</p>
          )}
        </div>

        {personDetails && (
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
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
                    className="w-[100px] h-[100px] sm:w-[122px] sm:h-[122px] rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-green-200"
                  />
                </div>
                <div className="text-center space-y-2 text-sm sm:text-base bg-white/60 p-4 rounded-lg border border-green-200/50">
                  <div className="text-green-800">
                    <strong>Full Name:</strong> {personDetails.name}
                  </div>
                  <div className="text-green-800">
                    <strong>Company/Organization:</strong> {personDetails.company}
                  </div>
                  <div className="text-green-800">
                    <strong>Contact Number:</strong> {personDetails.phone}
                  </div>
                  <div className="text-green-800">
                    <strong>Email:</strong> {personDetails.email}
                  </div>
                  <div className="text-green-800">
                    <strong>Job Position:</strong> {personDetails.jobPosition}
                  </div>
                  <div className="text-green-800">
                    <strong>Department:</strong> {personDetails.department}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {personDetails && (
          <div>
            <Label htmlFor="vehicle" className="text-sm sm:text-base font-semibold text-indigo-700">
              Vehicle Number (Optional)
            </Label>
            <Input
              id="vehicle"
              value={formData.vehicleNumber}
              onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
              placeholder="Enter vehicle number"
              className="h-11 text-base bg-white/80 border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 rounded-lg"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11 text-base bg-white border-2 border-blue-600 hover:bg-blue-600 hover:text-white text-blue-600 transition-colors duration-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 h-11 text-base bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border-0 shadow-lg disabled:bg-gray-400 disabled:text-gray-200 transition-colors duration-200"
            disabled={!personDetails && !fileIdError}
          >
            Add Staff Entry
          </Button>
        </div>
      </form>

      <Dialog open={isQrScannerOpen} onOpenChange={stopQrScanner}>
        <DialogContent className="w-[95vw] max-w-md mx-2 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border-2 border-green-200/50 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-green-100 to-blue-100 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-green-200/30">
            <DialogTitle className="flex items-center justify-between text-lg bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent font-bold">
              Scan QR Code
              <Button
                variant="ghost"
                size="icon"
                onClick={stopQrScanner}
                className="h-8 w-8 hover:bg-red-100 text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Position the QR code within the camera view to scan the File ID.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-1">
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden border-2 border-green-200 shadow-lg">
              <video ref={qrVideoRef} className="w-full h-48 sm:h-64 object-cover" playsInline muted />
              <div className="absolute inset-0 border-2 border-green-400 border-dashed m-6 sm:m-8 rounded-lg pointer-events-none shadow-lg" />
            </div>
            <p className="text-sm text-gray-600 text-center bg-blue-50 p-3 rounded-lg border border-blue-200">
              Point your camera at a QR code containing the File ID
            </p>
            <canvas ref={qrCanvasRef} className="hidden" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
