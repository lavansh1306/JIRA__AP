import React, { useMemo } from 'react'

function formatDate(d) {
  return d.toLocaleDateString()
}

export default function ManagerGantt({ tasks }) {
  const { lanes, minDate, maxDate, totalDays } = useMemo(() => {
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

    // For each assignee, compute stacking rows to avoid overlap
    const lanes = Object.keys(byAssignee).sort().map(name => {
      const items = byAssignee[name]
        .slice()
        .sort((a, b) => a._start - b._start)

      const rows = [] // each row is array of tasks that don't overlap

      items.forEach(item => {
        // find a row where this item doesn't overlap the last task
        let placed = false
        for (let r = 0; r < rows.length; r++) {
          const last = rows[r][rows[r].length - 1]
          if (item._start > last._end) {
            rows[r].push(item)
            placed = true
            break
          }
        }
        if (!placed) rows.push([item])
      })

      // flatten rows into items with row index
      const tasksWithRow = []
      rows.forEach((rowArr, rowIdx) => {
        rowArr.forEach(it => tasksWithRow.push({ ...it, _row: rowIdx }))
      })

      const laneHeight = Math.max(1, rows.length)

      return { name, tasks: tasksWithRow, laneHeight }
    })

    return { lanes, minDate: min, maxDate: max, totalDays }
  }, [tasks])

  if (!lanes.length) return <div className="p-6 bg-white rounded shadow">No tasks to show</div>

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Manager Gantt — All Assignees</h2>

      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div>Timeline: <strong>{formatDate(minDate)}</strong> — <strong>{formatDate(maxDate)}</strong></div>
        <div className="ml-4">Span: <strong>{totalDays} days</strong></div>
      </div>

      <div className="overflow-x-auto border rounded">
        <div className="min-w-[900px]">
          {lanes.map((lane, idx) => {
            const barHeight = 28
            const gap = 8
            const minHeight = Math.max(64, lane.laneHeight * (barHeight + gap) + 16)
            return (
              <div key={lane.name} className="flex items-start border-b last:border-b-0">
                <div className="w-48 p-3 font-medium bg-gray-50">{lane.name}</div>
                <div className="relative flex-1 p-3" style={{ minHeight }}>
                  {/* tasks stacked by row, placed vertically based on _row */}
                  {lane.tasks.map((task, tIdx) => {
                    const startOffset = Math.ceil((task._start - minDate) / (1000 * 60 * 60 * 24))
                    const duration = Math.max(1, Math.ceil((task._end - task._start) / (1000 * 60 * 60 * 24)))
                    const leftPercent = (startOffset / totalDays) * 100
                    const widthPercent = (duration / totalDays) * 100
                    const top = 8 + task._row * (barHeight + gap)

                    return (
                      <div
                        key={tIdx}
                        className="absolute"
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, top: `${top}px` }}
                        title={`${task.key} — ${task.summary}\n${new Date(task._start).toLocaleDateString()} → ${new Date(task._end).toLocaleDateString()}`}
                      >
                        <div className="px-3 py-2 rounded shadow-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium opacity-95 hover:opacity-100 truncate">
                          <div className="truncate max-w-full">{task.key} — {task.summary}</div>
                          <div className="text-[10px] opacity-80">{new Date(task._start).toLocaleDateString()} → {new Date(task._end).toLocaleDateString()}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
