import React, { useMemo } from 'react'

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
  const { assignees, minDate, maxDate, totalDays, colorMap } = useMemo(() => {
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

    // expand a few days padding
    const pad = 3
    min = new Date(new Date(min).getTime() - pad * 24 * 60 * 60 * 1000)
    max = new Date(new Date(max).getTime() + pad * 24 * 60 * 60 * 1000)

    const totalDays = Math.ceil((max - min) / (1000 * 60 * 60 * 24)) + 1

    const assigneeNames = Object.keys(byAssignee).sort()
    const colorMap = {}
    assigneeNames.forEach((name, idx) => {
      colorMap[name] = assigneeColors[idx % assigneeColors.length]
    })

    const assignees = assigneeNames.map(name => ({
      name,
      tasks: byAssignee[name]
    }))

    return { assignees, minDate: min, maxDate: max, totalDays, colorMap }
  }, [tasks])

  if (!assignees.length) return <div className="p-6 bg-white rounded shadow">No tasks to show</div>

  // Generate date markers for header
  const dateMarkers = []
  for (let i = 0; i < totalDays; i += 7) {
    dateMarkers.push(new Date(minDate.getTime() + i * 24 * 60 * 60 * 1000))
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Manager Gantt — All Assignees</h2>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div>Timeline: <strong>{formatDate(minDate)}</strong> — <strong>{formatDate(maxDate)}</strong></div>
        <div className="ml-4">Span: <strong>{totalDays} days</strong></div>
      </div>

      <div className="overflow-x-auto border rounded">
        <div className="min-w-max">
          {/* Header with date markers */}
          <div className="flex border-b bg-gray-100 sticky top-0">
            <div className="w-48 p-3 font-medium bg-gray-50 border-r flex-shrink-0"></div>
            <div className="relative flex-1" style={{ width: `${totalDays * 40}px` }}>
              <div className="absolute top-0 left-0 right-0 h-full flex">
                {dateMarkers.map((date, idx) => (
                  <div
                    key={idx}
                    className="border-r text-xs text-gray-600 p-1 text-center"
                    style={{ width: '280px' }}
                  >
                    {formatDate(date)}
                  </div>
                ))}
              </div>
              <div className="h-12"></div>
            </div>
          </div>

          {/* Grid lines and bars */}
          {assignees.map((assignee) => {
            const colors = colorMap[assignee.name]
            return (
              <div key={assignee.name} className="flex border-b last:border-b-0">
                <div className="w-48 p-3 font-medium bg-gray-50 border-r flex-shrink-0">{assignee.name}</div>
                <div className="relative flex-1 p-2" style={{ width: `${totalDays * 40}px`, minHeight: '80px' }}>
                  {/* Grid background */}
                  <div className="absolute top-0 left-0 right-0 bottom-0 flex opacity-20">
                    {Array.from({ length: dateMarkers.length }).map((_, idx) => (
                      <div key={idx} className="border-r border-gray-300" style={{ width: '280px' }}></div>
                    ))}
                  </div>

                  {/* Task bars */}
                  <div className="relative h-full">
                    {assignee.tasks.map((task, tIdx) => {
                      const startOffset = Math.max(0, (task._start - minDate) / (1000 * 60 * 60 * 24))
                      const duration = Math.max(1, (task._end - task._start) / (1000 * 60 * 60 * 24))
                      const leftPx = startOffset * 40
                      const widthPx = Math.max(30, duration * 40)

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
