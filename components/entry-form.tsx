"use client"
import type { ReactElement } from "react"
import { useState, useEffect } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { ClientEntryForm } from "./forms/client-entry-form"
import { SubContractorEntryForm } from "./forms/sub-contractor-entry-form"
import { SupplierEntryForm } from "./forms/supplier-entry-form"
import { VisitorEntryForm } from "./forms/visitor-entry-form"
import { StaffEntryForm } from "./forms/staff-entry-form"

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

  useEffect(() => {
    setIsMounted(true)
    console.log("[v0] Main EntryForm component mounted on client side")
  }, [])

  const getCategoryDialogStyles = () => {
    switch (category.toLowerCase()) {
      case "client":
      case "clients":
        return {
          content:
            "w-[95vw] max-w-md sm:max-w-lg max-h-[95vh] overflow-y-auto mx-2 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200/50 shadow-2xl",
          header:
            "bg-gradient-to-r from-green-100 to-emerald-100 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-green-200/30",
          title:
            "text-lg sm:text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-bold",
        }
      case "sub contractor":
      case "subcontractors":
        return {
          content:
            "w-[95vw] max-w-md sm:max-w-lg max-h-[95vh] overflow-y-auto mx-2 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-200/50 shadow-2xl",
          header:
            "bg-gradient-to-r from-orange-100 to-amber-100 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-orange-200/30",
          title:
            "text-lg sm:text-xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent font-bold",
        }
      case "supplier":
      case "suppliers":
        return {
          content:
            "w-[95vw] max-w-md sm:max-w-lg max-h-[95vh] overflow-y-auto mx-2 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-2 border-red-200/50 shadow-2xl",
          header:
            "bg-gradient-to-r from-red-100 to-rose-100 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-red-200/30",
          title: "text-lg sm:text-xl bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent font-bold",
        }
      case "visitors":
        return {
          content:
            "w-[95vw] max-w-md sm:max-w-lg max-h-[95vh] overflow-y-auto mx-2 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 border-2 border-indigo-200/50 shadow-2xl",
          header:
            "bg-gradient-to-r from-indigo-100 to-violet-100 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-indigo-200/30",
          title:
            "text-lg sm:text-xl bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent font-bold",
        }
      case "contractors":
        return {
          content:
            "w-[95vw] max-w-md sm:max-w-lg max-h-[95vh] overflow-y-auto mx-2 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 border-2 border-purple-200/50 shadow-2xl",
          header:
            "bg-gradient-to-r from-purple-100 to-violet-100 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-purple-200/30",
          title:
            "text-lg sm:text-xl bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent font-bold",
        }
      case "staff":
      default:
        return {
          content:
            "w-[95vw] max-w-md sm:max-w-lg max-h-[95vh] overflow-y-auto mx-2 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200/50 shadow-2xl",
          header:
            "bg-gradient-to-r from-blue-100 to-purple-100 -mx-6 -mt-6 px-6 pt-6 pb-4 rounded-t-lg border-b border-blue-200/30",
          title:
            "text-lg sm:text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold",
        }
    }
  }

  const renderCategoryForm = () => {
    const handleFormSubmit = (data: EntryData) => {
      onSubmit(data)
      onClose()
    }

    switch (category.toLowerCase()) {
      case "client":
      case "clients":
        return <ClientEntryForm onSubmit={handleFormSubmit} onCancel={onClose} />
      case "sub contractor":
      case "subcontractors":
        return <SubContractorEntryForm onSubmit={handleFormSubmit} onCancel={onClose} />
      case "supplier":
      case "suppliers":
        return <SupplierEntryForm onSubmit={handleFormSubmit} onCancel={onClose} />
      case "visitors":
        return <VisitorEntryForm onSubmit={handleFormSubmit} onCancel={onClose} />
      case "contractors":
        return <SubContractorEntryForm onSubmit={handleFormSubmit} onCancel={onClose} />
      case "staff":
        return <StaffEntryForm onSubmit={handleFormSubmit} onCancel={onClose} />
      default:
        return <div className="p-4 text-center text-red-600">Unknown category: {category}</div>
    }
  }

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
        <DialogContent className={getCategoryDialogStyles().content}>
          <DialogHeader className={getCategoryDialogStyles().header}>
            <DialogTitle className={getCategoryDialogStyles().title}>Add New {category} Entry</DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-gray-600">
              Fill out the form below to register a new {category.toLowerCase()} entry into the system.
            </DialogDescription>
          </DialogHeader>

          {renderCategoryForm()}
        </DialogContent>
      </Dialog>
    </ErrorBoundary>
  )
}
