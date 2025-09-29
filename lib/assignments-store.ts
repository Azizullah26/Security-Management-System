// Shared assignments store to avoid circular imports
// In production, this would be a database

export const projectAssignments = new Map<string, string>()

export const getAssignment = (staffId: string): string | null => {
  return projectAssignments.get(staffId) || null
}

export const setAssignment = (staffId: string, projectName: string): void => {
  projectAssignments.set(staffId, projectName)
}

export const removeAssignment = (staffId: string): void => {
  projectAssignments.delete(staffId)
}

export const getAllAssignments = (): Array<{ staffId: string; projectName: string }> => {
  return Array.from(projectAssignments.entries()).map(([staffId, projectName]) => ({
    staffId,
    projectName
  }))
}