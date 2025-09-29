"use client"

import type React from "react"
import type { ReactElement } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { EntryData } from "../entry-form"

interface ClientEntryFormProps {
  onSubmit: (data: EntryData) => void
  onCancel: () => void
}

export function ClientEntryForm({ onSubmit, onCancel }: ClientEntryFormProps): ReactElement {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    purpose: "",
    numberOfPersons: 1,
    vehicleNumber: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const entryData: EntryData = {
      id: Date.now().toString(),
      category: "clients",
      ...formData,
      contactNumber: "", // Client forms don't include contact number
      email: "", // Client forms don't include email
      entryTime: new Date().toISOString(),
      status: "inside",
    }

    onSubmit(entryData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 p-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name" className="text-sm sm:text-base font-semibold text-green-700">
            Full Name *
          </Label>
          <Input
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter full name"
            className="h-11 text-base bg-white/80 border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-200 rounded-lg"
          />
        </div>
        <div>
          <Label htmlFor="company" className="text-sm sm:text-base font-semibold text-green-700">
            Company/Organization
          </Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Enter company"
            className="h-11 text-base bg-white/80 border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-200 rounded-lg"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="numberOfPersons" className="text-sm sm:text-base font-semibold text-green-700">
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
          className="h-11 text-base bg-white/80 border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-200 rounded-lg"
        />
      </div>

      <div>
        <Label htmlFor="purpose" className="text-sm sm:text-base font-semibold text-green-700">
          Purpose/Department
        </Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          placeholder="Enter purpose or department"
          rows={3}
          className="text-base bg-white/80 border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-200 rounded-lg"
        />
      </div>

      <div>
        <Label htmlFor="vehicle" className="text-sm sm:text-base font-semibold text-green-700">
          Vehicle Number (Optional)
        </Label>
        <Input
          id="vehicle"
          value={formData.vehicleNumber}
          onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
          placeholder="Enter vehicle number"
          className="h-11 text-base bg-white/80 border-2 border-green-200 focus:border-green-400 focus:ring-2 focus:ring-green-200 rounded-lg"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-11 text-base bg-white border-2 border-green-600 hover:bg-green-600 hover:text-white text-green-600 transition-colors duration-200"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 h-11 text-base bg-green-600 hover:bg-green-700 active:bg-green-800 text-white border-0 shadow-lg transition-colors duration-200"
        >
          Add Client Entry
        </Button>
      </div>
    </form>
  )
}
