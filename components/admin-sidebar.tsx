"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  Settings,
  Shield,
  UserCheck,
  ClipboardList,
  LogOut,
  FileText,
} from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  onLogout?: () => void
}

const sidebarItems = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    category: "MAIN",
  },
  {
    id: "all-records",
    label: "All Records",
    icon: FileText,
    category: "MAIN",
  },
  {
    id: "projects",
    label: "Project Management",
    icon: FolderOpen,
    category: "MANAGEMENT",
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: ClipboardList,
    category: "MANAGEMENT",
  },
  {
    id: "staff",
    label: "Security Staff",
    icon: Shield,
    category: "MANAGEMENT",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    category: "INSIGHTS",
  },
  {
    id: "visitors",
    label: "Visitor System",
    icon: UserCheck,
    category: "OPERATIONS",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    category: "SYSTEM",
  },
]

export function AdminSidebar({ activeSection, onSectionChange, onLogout }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()

  const groupedItems = sidebarItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    },
    {} as Record<string, typeof sidebarItems>,
  )

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      router.push("/")
    }
  }

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-4 flex-1">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="font-semibold text-gray-900">Security Admin</h2>
              <p className="text-xs text-gray-500">Management Portal</p>
            </div>
          )}
        </div>

        <nav className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              {!collapsed && (
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{category}</h3>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.id}
                      variant={activeSection === item.id ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-10",
                        activeSection === item.id
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        collapsed && "px-2",
                      )}
                      onClick={() => onSectionChange(item.id)}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 text-red-600 hover:bg-red-50 hover:text-red-700",
            collapsed && "px-2",
          )}
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="truncate">Logout</span>}
        </Button>
      </div>
    </div>
  )
}
