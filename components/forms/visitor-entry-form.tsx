"use client"

import type React from "react"
import type { ReactElement } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { EntryData } from "../entry-form"

interface VisitorEntryFormProps {
  onSubmit: (data: EntryData) => void
  onCancel: () => void
}

export function VisitorEntryForm({ onSubmit, onCancel }: VisitorEntryFormProps): ReactElement {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    purpose: "",
    contactNumber: "",
    email: "",
    numberOfPersons: 1,
    vehicleNumber: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const entryData: EntryData = {
      id: Date.now().toString(),
      category: "visitors",
      ...formData,
      entryTime: new Date().toISOString(),
      status: "inside",
    }

    onSubmit(entryData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-sm sm:text-base font-semibold text-indigo-700">
            Full Name *
          </Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            className="h-11 text-base bg-white/80 border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 rounded-lg"
          />
        </div>
        <div>
          <Label htmlFor="company" className="text-sm sm:text-base font-semibold text-indigo-700">
            Company/Organization
          </Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Enter company"
            className="h-11 text-base bg-white/80 border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 rounded-lg"
          />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact" className="text-sm sm:text-base font-semibold text-indigo-700">
            Contact Number
          </Label>
          <Input
            id="contact"
            type="tel"
            value={formData.contactNumber}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
            placeholder="Enter phone number"
            className="h-11 text-base bg-white/80 border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 rounded-lg"
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-indigo-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email"
            className="h-11 text-base bg-white/80 border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 rounded-lg"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="numberOfPersons" className="text-sm sm:text-base font-semibold text-indigo-700">
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
          className="h-11 text-base bg-white/80 border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 rounded-lg"
        />
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="purpose" className="text-sm sm:text-base font-semibold text-indigo-700">
            Purpose of Visit
          </Label>
          <Select onValueChange={(value) => setFormData({ ...formData, purpose: value })}>
            <SelectTrigger className="h-11 text-base bg-white/80 border-2 border-indigo-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 rounded-lg">
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

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11 text-base bg-white border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white text-indigo-600 transition-colors duration-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 text-base bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white border-0 shadow-lg transition-colors duration-200"
        >
          Add Visitor Entry
        </Button>
      </div>
    </form>
  )
}
