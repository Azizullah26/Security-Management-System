import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession } from '@/lib/auth-utils'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

function parseProjectsFromFile() {
  const filePath = path.join(process.cwd(), 'attached_assets', 'Pasted-Internal-Internal-security-operations-active-Unassigned-high-1-15-2024-Reassign-Meteiya-Building--1759149547472_1759149547474.txt')
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  
  const projects = []
  let i = 0
  
  while (i < lines.length) {
    const name = lines[i]?.trim()
    const description = lines[i + 1]?.trim()
    const details = lines[i + 2]?.trim()
    
    if (!name || !description || !details) {
      i += 3
      continue
    }
    
    const detailsParts = details.split(/\s+/)
    const status = detailsParts[0] || 'active'
    const priority = detailsParts[2] || 'medium'
    const startDateStr = detailsParts[3] || null
    
    let startDate = null
    if (startDateStr) {
      try {
        const date = new Date(startDateStr)
        if (!isNaN(date.getTime())) {
          startDate = date.toISOString().split('T')[0]
        }
      } catch (e) {
        console.error('Invalid date:', startDateStr)
      }
    }
    
    projects.push({
      name,
      description,
      status,
      priority: priority.toLowerCase(),
      start_date: startDate,
      assigned_to: null
    })
    
    i += 3
  }
  
  return projects
}

export async function POST(request: NextRequest) {
  try {
    const isValidSession = verifyAdminSession(request)
    
    if (!isValidSession) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    console.log('Checking existing projects...')
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })

    if (count && count > 0) {
      return NextResponse.json({
        message: `Database already has ${count} projects. Migration skipped.`,
        count
      })
    }

    console.log('Parsing projects from file...')
    const projects = parseProjectsFromFile()
    console.log(`Found ${projects.length} projects to migrate`)
    
    console.log('Loading projects into Supabase...')
    
    const batchSize = 50
    let totalLoaded = 0
    
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('projects')
        .insert(batch)
      
      if (error) {
        console.error(`Error loading batch ${i / batchSize + 1}:`, error)
        return NextResponse.json(
          { error: `Failed to load batch ${i / batchSize + 1}`, details: error },
          { status: 500 }
        )
      } else {
        totalLoaded += batch.length
        console.log(`Loaded batch ${i / batchSize + 1} (${batch.length} projects)`)
      }
    }
    
    const { count: finalCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${totalLoaded} projects to Supabase`,
      totalProjects: finalCount
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to migrate projects', details: error },
      { status: 500 }
    )
  }
}
