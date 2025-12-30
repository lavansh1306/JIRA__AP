import React, { useMemo, useState } from 'react'

function formatDate(d) {
  return d.toLocaleDateString()
}

const assigneeColors = [
  { from: 'from-blue-500', to: 'to-blue-600' },
  { from: 'from-red-500', to: 'to-red-600' },
  { from: 'from-green-500', to: 'to-green-600' },
  { from: 'from-purple-500', to: 'to-purple-600' },
  { from: 'from-yellow-500', to: 'to-yellow-600' },
  { from: 'from-pink-500', to: 'to-pink-600' },
  { from: 'from-indigo-500', to: 'to-indigo-600' },
  { from: 'from-cyan-500', to: 'to-cyan-600' },
]

export default function ManagerGantt({ tasks }) {
  const [viewType, setViewType] = useState('day') // 'day', 'week', 'month'
  const [zoom, setZoom] = useState(1) // zoom multiplier

  const { assignees, minDate, maxDate, totalUnits, dateMarkers, colorMap } = useMemo(() => {
    const byAssignee = {}
    let min = null
    let max = null

    tasks.forEach(t => {
      const assignee = t.assignee || 'Unassigned'
      if (!byAssignee[assignee]) byAssignee[assignee] = []

      const start = new Date(t.created)
      const end = t.due ? new Date(t.due) : new Date(t.created)

      byAssignee[assignee].push({ ...t, _start: start, _end: end })

      if (!isNaN(start.getTime())) min = min ? (start < min ? start : min) : start
      if (!isNaN(end.getTime())) max = max ? (end > max ? end : max) : end
    })

    if (!min) min = new Date()
    if (!max) max = new Date()

    // expand padding
    const pad = 3
    min = new Date(new Date(min).getTime() - pad * 24 * 60 * 60 * 1000)
    max = new Date(new Date(max).getTime() + pad * 24 * 60 * 60 * 1000)

    let totalUnits = 0
    let markers = []

    if (viewType === 'day') {
      totalUnits = Math.ceil((max - min) / (1000 * 60 * 60 * 24)) + 1
      for (let i = 0; i < totalUnits; i++) {
        markers.push(new Date(min.getTime() + i * 24 * 60 * 60 * 1000))
      }
    } else if (viewType === 'week') {
      totalUnits = Math.ceil((max - min) / (1000 * 60 * 60 * 24 * 7)) + 1
      for (let i = 0; i < totalUnits; i++) {
        markers.push(new Date(min.getTime() + i * 7 * 24 * 60 * 60 * 1000))
      }
    } else if (viewType === 'month') {
      let current = new Date(min)
      current.setDate(1)
      while (current <= max) {
        markers.push(new Date(current))
        current.setMonth(current.getMonth() + 1)
      }
      totalUnits = markers.length
    }

    const assigneeNames = Object.keys(byAssignee).sort()
    const colorMap = {}
    assigneeNames.forEach((name, idx) => {
      colorMap[name] = assigneeColors[idx % assigneeColors.length]
    })

    const assignees = assigneeNames.map(name => ({
      name,
      tasks: byAssignee[name]
    }))

    return { assignees, minDate: min, maxDate: max, totalUnits, dateMarkers: markers, colorMap }
  }, [tasks, viewType])

  const getCellWidth = () => {
    const baseWidths = { day: 50, week: 280, month: 200 }
    return baseWidths[viewType] * zoom
  }

  const cellWidth = getCellWidth()

  if (!assignees.length) return <div className="p-6 bg-white rounded shadow">No tasks to show</div>

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Manager Gantt — All Assignees</h2>
        <div className="flex items-center gap-4">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="day">Day View</option>
            <option value="week">Week View</option>
            <option value="month">Month View</option>
          </select>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Zoom:</span>
            <input
              type="range"
              min="0.3"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-600 w-10">{Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div>Timeline: <strong>{formatDate(minDate)}</strong> — <strong>{formatDate(maxDate)}</strong></div>
        <div className="ml-4">Span: <strong>{totalUnits} {viewType === 'day' ? 'days' : viewType === 'week' ? 'weeks' : 'months'}</strong></div>
      </div>

      <div className="overflow-x-auto border rounded">
        <div className="min-w-max">
          {/* Header with date markers */}
          <div className="flex border-b bg-gray-100 sticky top-0">
            <div className="w-48 p-3 font-medium bg-gray-50 border-r flex-shrink-0"></div>
            <div className="relative flex-1" style={{ width: `${totalUnits * cellWidth}px` }}>
              <div className="absolute top-0 left-0 right-0 h-full flex">
                {dateMarkers.map((date, idx) => {
                  let displayText = ''
                  if (viewType === 'day') {
                    displayText = formatDate(date)
                  } else if (viewType === 'week') {
                    const weekEnd = new Date(date)
                    weekEnd.setDate(weekEnd.getDate() + 6)
                    displayText = `${formatDate(date)} - ${formatDate(weekEnd)}`
                  } else if (viewType === 'month') {
                    displayText = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                  }
                  return (
                    <div
                      key={idx}
                      className="border-r text-xs text-gray-600 p-1 text-center font-medium"
                      style={{ width: `${cellWidth}px` }}
                    >
                      {displayText}
                    </div>
                  )
                })}
              </div>
              <div className="h-12"></div>
            </div>
          </div>

          {/* Grid lines and bars */}
          {assignees.map((assignee) => {
            const colors = colorMap[assignee.name]
            const sortedTasks = [...assignee.tasks].sort((a, b) => a._start - b._start)
            
            return (
              <div key={assignee.name} className="flex border-b last:border-b-0">
                <div className="w-48 p-3 font-medium bg-gray-50 border-r flex-shrink-0">{assignee.name}</div>
                <div className="relative flex-1 p-2" style={{ width: `${totalUnits * cellWidth}px`, minHeight: '80px' }}>
                  {/* Grid background */}
                  <div className="absolute top-0 left-0 right-0 bottom-0 flex opacity-20">
                    {Array.from({ length: totalUnits }).map((_, idx) => (
                      <div key={idx} className="border-r border-gray-300" style={{ width: `${cellWidth}px` }}></div>
                    ))}
                  </div>

                  {/* Free time blocks (between tasks) */}
                  

                  {/* Task bars */}
                  <div className="relative h-full">
                    {assignee.tasks.map((task, tIdx) => {
                      let startOffset = 0
                      let duration = 1

                      if (viewType === 'day') {
                        startOffset = Math.max(0, (task._start - minDate) / (1000 * 60 * 60 * 24))
                        duration = Math.max(1, (task._end - task._start) / (1000 * 60 * 60 * 24))
                      } else if (viewType === 'week') {
                        startOffset = Math.max(0, (task._start - minDate) / (1000 * 60 * 60 * 24 * 7))
                        duration = Math.max(1, (task._end - task._start) / (1000 * 60 * 60 * 24 * 7))
                        duration = Math.max(0.2, duration)
                      } else if (viewType === 'month') {
                        // For month view, calculate position based on month start dates
                        const minDateMonthStart = new Date(minDate)
                        minDateMonthStart.setDate(1)
                        
                        const taskStartMonth = new Date(task._start)
                        taskStartMonth.setDate(1)
                        
                        const taskEndMonth = new Date(task._end)
                        taskEndMonth.setDate(1)
                        
                        // Calculate months from start
                        const monthDiff = (taskStartMonth.getFullYear() - minDateMonthStart.getFullYear()) * 12 + 
                                         (taskStartMonth.getMonth() - minDateMonthStart.getMonth())
                        
                        startOffset = Math.max(0, monthDiff)
                        
                        // Calculate duration in months
                        const endMonthDiff = (taskEndMonth.getFullYear() - taskStartMonth.getFullYear()) * 12 + 
                                            (taskEndMonth.getMonth() - taskStartMonth.getMonth())
                        
                        duration = Math.max(0.5, endMonthDiff + 1)
                      }

                      const leftPx = startOffset * cellWidth
                      const widthPx = Math.max(30, duration * cellWidth)

                      return (
                        <div
                          key={tIdx}
                          className={`absolute top-2 rounded shadow-sm bg-gradient-to-r ${colors.from} ${colors.to} text-white text-xs font-medium opacity-90 hover:opacity-100 overflow-hidden`}
                          style={{ left: `${leftPx}px`, width: `${widthPx}px`, height: '32px' }}
                          title={`${task.key} — ${task.summary}\n${formatDate(task._start)} → ${formatDate(task._end)}`}
                        >
                          <div className="px-2 py-1 truncate h-full flex items-center">
                            <span className="truncate">{task.key}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
