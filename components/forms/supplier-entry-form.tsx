"use client"

import type React from "react"
import type { ReactElement } from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Camera, X } from "lucide-react"
import type { EntryData } from "../entry-form"

interface SupplierEntryFormProps {
  onSubmit: (data: EntryData) => void
  onCancel: () => void
}

export function SupplierEntryForm({ onSubmit, onCancel }: SupplierEntryFormProps): ReactElement {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    purpose: "",
    contactNumber: "",
    numberOfPersons: 1,
    vehicleNumber: "",
  })

  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const entryData: EntryData = {
      id: Date.now().toString(),
      category: "suppliers",
      ...formData,
      email: "",
      photo: capturedPhoto || undefined,
      entryTime: new Date().toISOString(),
      status: "inside",
    }

    onSubmit(entryData)
  }

  const capturePhotoDirectly = async () => {
    if (isCapturing) {
      console.log("[v0] Capture already in progress, ignoring request")
      return
    }

    try {
      setIsCapturing(true)
      console.log("[v0] Starting direct photo capture for supplier")

      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        alert("Camera not supported in this browser")
        return
      }

      console.log("[v0] Requesting camera access for photo capture...")

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      console.log("[v0] Camera access granted, setting up for photo capture")

      const video = videoRef.current!
      const canvas = canvasRef.current!
      const context = canvas.getContext("2d")!

      video.style.display = "block"
      video.style.position = "absolute"
      video.style.left = "-9999px"
      video.style.width = "1px"
      video.style.height = "1px"

      video.srcObject = stream
      video.muted = true
      video.playsInline = true

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video loading timeout"))
        }, 10000)

        const onLoadedMetadata = () => {
          clearTimeout(timeout)
          video.removeEventListener("loadedmetadata", onLoadedMetadata)
          resolve()
        }

        video.addEventListener("loadedmetadata", onLoadedMetadata)
        video.play().catch(reject)
      })

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Video dimensions not available")
      }

      console.log("[v0] Capturing photo directly with dimensions:", video.videoWidth, "x", video.videoHeight)

      // Capture the photo
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const photoDataUrl = canvas.toDataURL("image/jpeg", 0.8)
      setCapturedPhoto(photoDataUrl)

      video.style.display = "none"
      video.srcObject = null

      // Stop the camera stream
      stream.getTracks().forEach((track) => track.stop())

      console.log("[v0] Photo captured successfully and camera stopped")
    } catch (error) {
      console.error("[v0] Error capturing photo:", error)

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          alert("Camera access denied. Please allow camera permissions in your browser settings and try again.")
        } else if (error.name === "NotFoundError") {
          alert("No camera found on this device.")
        } else if (error.name === "NotReadableError") {
          alert("Camera is already in use by another application.")
        } else if (error.message === "Video loading timeout") {
          alert("Camera took too long to load. Please try again.")
        } else if (error.message === "Video dimensions not available") {
          alert("Camera failed to initialize properly. Please try again.")
        } else {
          alert(`Camera error: ${error.message}`)
        }
      } else {
        alert("Unable to access camera. Please check permissions and try again.")
      }
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-sm sm:text-base font-semibold text-red-700">
              Full Name *
            </Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className="h-11 text-base bg-white/80 border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="company" className="text-sm sm:text-base font-semibold text-red-700">
              Company/Organization
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Enter company"
              className="h-11 text-base bg-white/80 border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 rounded-lg"
            />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact" className="text-sm sm:text-base font-semibold text-red-700">
              Contact Number
            </Label>
            <Input
              id="contact"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              placeholder="Enter phone number"
              className="h-11 text-base bg-white/80 border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 rounded-lg"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="numberOfPersons" className="text-sm sm:text-base font-semibold text-red-700">
            Number of Persons
          </Label>
          <Input
            id="numberOfPersons"
            type="number"
            min="1"
            max="50"
            value={formData.numberOfPersons}
            onChange={(e) => setFormData({ ...formData, numberOfPersons: Number.parseInt(e.target.value) || 1 })}
            placeholder="Enter number of persons"
            className="h-11 text-base bg-white/80 border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 rounded-lg"
          />
        </div>

        <div>
          <Label htmlFor="purpose" className="text-sm sm:text-base font-semibold text-red-700">
            Purpose/Department
          </Label>
          <Textarea
            id="purpose"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            placeholder="Enter purpose or department"
            rows={3}
            className="text-base bg-white/80 border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 rounded-lg"
          />
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm sm:text-base font-semibold text-red-700">Supplier Photo</Label>
            <div className="flex flex-col gap-3">
              {capturedPhoto ? (
                <div className="relative">
                  <img
                    src={capturedPhoto || "/placeholder.svg"}
                    alt="Captured supplier photo"
                    className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-red-200 shadow-lg"
                  />
                  <Button
                    type="button"
                    onClick={() => setCapturedPhoto(null)}
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 border-red-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-red-200 rounded-lg p-8 text-center bg-red-50/50">
                  <Camera className="h-12 w-12 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-red-600 mb-3">No photo captured yet</p>
                </div>
              )}
              <Button
                type="button"
                onClick={capturePhotoDirectly}
                disabled={isCapturing}
                variant="outline"
                className="w-full h-11 bg-white border-2 border-red-200 hover:bg-red-50 text-red-700 transition-colors duration-200 disabled:opacity-50"
              >
                <Camera className="h-5 w-5 mr-2" />
                {isCapturing ? "Capturing..." : capturedPhoto ? "Retake Photo" : "Take Photo"}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="vehicle" className="text-sm sm:text-base font-semibold text-red-700">
            Vehicle Number (Optional)
          </Label>
          <Input
            id="vehicle"
            value={formData.vehicleNumber}
            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
            placeholder="Enter vehicle number"
            className="h-11 text-base bg-white/80 border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-200 rounded-lg"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11 text-base bg-white border-2 border-red-600 hover:bg-red-600 hover:text-white text-red-600 transition-colors duration-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 h-11 text-base bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border-0 shadow-lg transition-colors duration-200"
          >
            Add Supplier Entry
          </Button>
        </div>
      </form>

      <video ref={videoRef} className="hidden" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}
