'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, BarChart3, Users, FileText } from 'lucide-react'
import PMProjectsView from '@/components/pm-projects-view'
import PMStaffManagement from '@/components/pm-staff-management'
import PMReports from '@/components/pm-reports'

interface PMData {
  id: string
  email: string
  name: string
  role: string
  assignedProjects?: string[]
}

export default function PMDashboard() {
  const [pmData, setPMData] = useState<PMData | null>(null)
  const [token, setToken] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('projects')

  useEffect(() => {
    const verifyPMSession = async () => {
      try {
        const storedToken = localStorage.getItem('pm_token')
        const email = localStorage.getItem('pm_email')

        if (!storedToken || !email) {
          window.location.href = '/pm-login'
          return
        }

        console.log('[v0] Verifying PM session with token')

        // Verify token and get PM data
        const response = await fetch('/api/pm/verify', {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })

        console.log('[v0] PM verify response status:', response.status)

        if (!response.ok) {
          console.error('[v0] Session verification failed:', response.status)
          localStorage.removeItem('pm_token')
          localStorage.removeItem('pm_email')
          window.location.href = '/pm-login'
          return
        }

        const data = await response.json()
        console.log('[v0] PM data received:', data.pm)
        setPMData(data.pm)
        setToken(storedToken)
      } catch (error) {
        console.error('[v0] Session verification failed:', error)
        window.location.href = '/pm-login'
      } finally {
        setLoading(false)
      }
    }

    verifyPMSession()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('pm_token')
    localStorage.removeItem('pm_email')
    window.location.href = '/pm-login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!pmData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Project Manager Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome, {pmData.name}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/50">
            <TabsTrigger value="projects" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              My Projects
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2">
              <Users className="h-4 w-4" />
              Staff Records
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <PMProjectsView pmId={pmData.id} token={token} />
          </TabsContent>

          <TabsContent value="staff">
            <PMStaffManagement pmId={pmData.id} />
          </TabsContent>

          <TabsContent value="reports">
            <PMReports pmId={pmData.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
