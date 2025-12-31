import { useState, useEffect } from 'react'
import IssuesTable from './components/IssuesTable'
import GanttChart from './components/GanttChart'
import ManagerGantt from './components/ManagerGantt'
import ManagerSummary from './components/ManagerSummary'
import { parseCSV } from './utils/csvParser'

export default function App() {
  const [allIssues, setAllIssues] = useState([])
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('All')
  const [assignees, setAssignees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCSVData()
  }, [])

  const loadCSVData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/jira_events (1).csv')
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      const csvText = await response.text()
      const parsedData = parseCSV(csvText)
      
      const issues = parsedData.map(row => {
        const createdStr = row.Created || row['Created'] || ''
        const dueDateStr = row['Due date'] || row['DueDate'] || ''
        
        const created = createdStr ? new Date(createdStr) : new Date()
        const due = dueDateStr ? new Date(dueDateStr) : null

        let duration = ''
        if (due && !isNaN(due.getTime()) && !isNaN(created.getTime())) {
          duration = Math.ceil((due - created) / (1000 * 60 * 60 * 24))
        }

        return {
          key: row['Project key'] || '-',
          issueType: row['Issue Type'] || '-',
          summary: row['Summary'] || '-',
          description: row['Description'] || '-',
          priority: row['Priority'] || '-',
          status: row['Status'] || '-',
          assignee: row['Assignee'] || 'Unassigned',
          team: row['Team'] || row['team'] || 'Team 1',
          created: created.toISOString(),
          due: due ? due.toISOString() : null,
          duration,
        }
      })

      setAllIssues(issues)
      const uniqueTeams = [...new Set(issues.map(i => i.team || 'Team 1'))].sort()
      setTeams(uniqueTeams)
      const uniqueAssignees = [...new Set(issues.map(i => i.assignee))].sort()
      setAssignees(uniqueAssignees)
      setError(null)
    } catch (err) {
      console.error('Error loading CSV:', err)
      setError('Failed to load CSV file')
    } finally {
      setLoading(false)
    }
  }

  // Filter tasks by selected assignee and selected team
  const selectedTasks = selectedAssignee
    ? allIssues.filter(i => i.assignee === selectedAssignee && i.due && (selectedTeam === 'All' || i.team === selectedTeam))
    : []

  // Compute filtered issues for manager view based on selected team
  const managerIssues = selectedTeam === 'All' ? allIssues : allIssues.filter(i => i.team === selectedTeam)

  // Clear selected assignee if it's not part of the selected team
  useEffect(() => {
    if (!selectedAssignee) return
    const exists = managerIssues.some(i => i.assignee === selectedAssignee)
    if (!exists) setSelectedAssignee('')
  }, [selectedTeam, allIssues])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-gray-700">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl font-semibold text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-2 md:px-4">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Jira Issues Dashboard
          </h1>
          <p className="text-gray-600">Created vs Due Date Analysis</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Team:</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition mb-4"
          >
            <option value="All">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          <label className="block text-sm font-semibold text-gray-700 mb-3">Select Assignee for Gantt Chart:</label>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value="">-- Choose Assignee --</option>
            {assignees
              .filter(a => selectedTeam === 'All' ? true : allIssues.some(i => i.assignee === a && i.team === selectedTeam))
              .map((assignee) => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
          </select>

          <div className="mt-4 flex items-center gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="rounded" checked={false} onChange={(e)=>{ /* placeholder for keyboard users */ }} disabled/>
              <span className="text-sm text-gray-600">(Tip) Toggle Manager view below to see aggregated lanes</span>
            </label>
          </div>
        </div>

        {/* Issues Table (filtered by team) */}
        <div className="mb-8">
          <IssuesTable issues={managerIssues} />
        </div>

        {/* Gantt Chart */}
        <div className="mb-8">
          {selectedAssignee ? (
            <GanttChart tasks={selectedTasks} assignee={selectedAssignee} />
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4">Manager View</h3>
              <ManagerSummary tasks={managerIssues} />
              <ManagerGantt tasks={managerIssues} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
