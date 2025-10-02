'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function DatabaseSetupPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/projects/migrate', {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || 'Migration failed')
      }
    } catch (err) {
      setError('Failed to run migration: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Setup</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step 1: Create Database Tables</CardTitle>
            <CardDescription>
              Run this SQL in your Supabase SQL Editor to create the required tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">{`-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  priority VARCHAR(50) DEFAULT 'medium',
  start_date DATE,
  assigned_to VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON projects FOR DELETE USING (true);`}</pre>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                1. Go to your <a href="https://vqyapqsjhdjvwofzkdsh.supabase.co" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase Dashboard</a>
              </p>
              <p className="text-sm text-gray-600">
                2. Click on "SQL Editor" in the left sidebar
              </p>
              <p className="text-sm text-gray-600">
                3. Click "New Query"
              </p>
              <p className="text-sm text-gray-600">
                4. Copy and paste the SQL above
              </p>
              <p className="text-sm text-gray-600">
                5. Click "Run" to create the tables
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Load Projects into Database</CardTitle>
            <CardDescription>
              This will load all 245 projects from your file into Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runMigration} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating Projects...
                </>
              ) : (
                'Load All Projects to Database'
              )}
            </Button>

            {result && (
              <div className="mt-4 p-4 border border-green-500 bg-green-50 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-green-800">
                  {result.message}
                  {result.totalProjects && (
                    <div className="mt-2">
                      Total projects in database: <strong>{result.totalProjects}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 border border-red-500 bg-red-50 rounded-lg flex items-start gap-2">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-red-800">
                  {error}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/admin'}
          >
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
