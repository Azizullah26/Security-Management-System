"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

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

  const handleCheckFileId = async () => {
    if (!formData.fileId.trim()) {
      setFileIdError("Please enter a File ID")
      return
    }

    setIsChecking(true)
    setFileIdError("")

    // Simulate API call delay
    setTimeout(() => {
      const person = demoPersonData[formData.fileId]
      if (person) {
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
        setFileIdError("File ID not found. Please check and try again.")
        setPersonDetails(null)
      }
      setIsChecking(false)
    }, 1000)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New {category} Entry</DialogTitle>
          <DialogDescription>
            Fill out the form below to register a new {category.toLowerCase()} entry into the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {category.toLowerCase() === "staff" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fileId">File ID *</Label>
                <div className="flex gap-2">
                  <Input
                    id="fileId"
                    required
                    value={formData.fileId}
                    onChange={(e) => {
                      setFormData({ ...formData, fileId: e.target.value })
                      setFileIdError("")
                      setPersonDetails(null)
                    }}
                    placeholder="Enter file ID (e.g., 2897)"
                    className={fileIdError ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    onClick={handleCheckFileId}
                    disabled={isChecking || !formData.fileId.trim()}
                    className="px-4"
                  >
                    {isChecking ? "Checking..." : "Check"}
                  </Button>
                </div>
                {fileIdError && <p className="text-sm text-red-500">{fileIdError}</p>}
              </div>

              {personDetails && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Person Found</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <img
                          src={personDetails.image || "/placeholder.svg"}
                          alt={personDetails.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1 text-sm">
                        <div>
                          <strong>Name:</strong> {personDetails.name}
                        </div>
                        <div>
                          <strong>Email:</strong> {personDetails.email}
                        </div>
                        <div>
                          <strong>Phone:</strong> {personDetails.phone}
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

          {(category.toLowerCase() !== "staff" || personDetails || fileIdError) && (
            <>
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Enter company"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input
                    id="contact"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
              </div>

              {/* Category-specific fields */}
              {getCategorySpecificFields()}

              {/* Vehicle Number (optional for all categories) */}
              <div>
                <Label htmlFor="vehicle">Vehicle Number (Optional)</Label>
                <Input
                  id="vehicle"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                  placeholder="Enter vehicle number"
                />
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={category.toLowerCase() === "staff" ? !personDetails && !fileIdError : false}
            >
              Add Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
