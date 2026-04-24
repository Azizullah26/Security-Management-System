'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogOut, BarChart3, Users, FileText, Shield, Loader2, BookOpen } from 'lucide-react'
import PMProjectsView from '@/components/pm-projects-view'
import PMStaffView from '@/components/pm-staff-view'
import PMReportsView from '@/components/pm-reports-view'
import PMEntriesView from '@/components/pm-entries-view'

interface PMData {
  id: string
  name: string
  username: string
  email: string
  role: string
  assignedProjects: string[]
}

type TabKey = 'projects' | 'staff' | 'entries' | 'reports'

export default function PMDashboard() {
  const [pmData, setPMData] = useState<PMData | null>(null)
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('projects')

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('pm_token')
      if (!storedToken) {
        window.location.href = '/pm-login'
        return
      }

      try {
        const res = await fetch('/api/pm/verify', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })

        if (!res.ok) {
          localStorage.removeItem('pm_token')
          localStorage.removeItem('pm_username')
          window.location.href = '/pm-login'
          return
        }

        const data = await res.json()
        setPMData(data.pm)
        setToken(storedToken)
      } catch {
        window.location.href = '/pm-login'
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('pm_token')
    localStorage.removeItem('pm_username')
    window.location.href = '/pm-login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!pmData) return null

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'projects', label: 'My Projects', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'entries', label: 'Entries', icon: <BookOpen className="h-4 w-4" /> },
    { key: 'staff', label: 'Staff Records', icon: <Users className="h-4 w-4" /> },
    { key: 'reports', label: 'Reports', icon: <FileText className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-none">
                {pmData.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Project Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs hidden sm:flex">
              {pmData.assignedProjects.length} project{pmData.assignedProjects.length !== 1 ? 's' : ''} assigned
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'projects' && (
          <PMProjectsView pmId={pmData.id} token={token} />
        )}
        {activeTab === 'entries' && (
          <PMEntriesView pmId={pmData.id} token={token} assignedProjects={pmData.assignedProjects} />
        )}
        {activeTab === 'staff' && (
          <PMStaffView pmId={pmData.id} token={token} assignedProjects={pmData.assignedProjects} />
        )}
        {activeTab === 'reports' && (
          <PMReportsView pmId={pmData.id} token={token} />
        )}
      </main>
    </div>
  )
}
