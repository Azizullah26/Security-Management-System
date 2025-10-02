import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_URL!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function parseProjectsFromFile() {
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
    const startDate = detailsParts[3] || null
    
    projects.push({
      name,
      description,
      status,
      priority: priority.toLowerCase(),
      start_date: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
      assigned_to: null
    })
    
    i += 3
  }
  
  return projects
}

async function loadProjects() {
  try {
    console.log('Parsing projects from file...')
    const projects = await parseProjectsFromFile()
    console.log(`Found ${projects.length} projects`)
    
    console.log('Loading projects into Supabase...')
    
    const batchSize = 50
    for (let i = 0; i < projects.length; i += batchSize) {
      const batch = projects.slice(i, i + batchSize)
      const { data, error } = await supabase
        .from('projects')
        .insert(batch)
      
      if (error) {
        console.error(`Error loading batch ${i / batchSize + 1}:`, error)
      } else {
        console.log(`Loaded batch ${i / batchSize + 1} (${batch.length} projects)`)
      }
    }
    
    console.log('All projects loaded successfully!')
    
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
    
    console.log(`Total projects in database: ${count}`)
  } catch (error) {
    console.error('Error loading projects:', error)
    process.exit(1)
  }
}

loadProjects()
