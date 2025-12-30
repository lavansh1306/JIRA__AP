import React, { useMemo } from 'react'
import { getWeekStart } from '../utils/helpers'

function StatsCard({ title, value, subtitle }) {
  return (
    <div className="bg-white p-4 rounded shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}

export default function ManagerSummary({ tasks }) {
  const { byAssignee, weeks, tasksPerWeekPerAssignee, totals } = useMemo(() => {
    const byAssignee = {}
    const weeksSet = new Set()

    tasks.forEach(t => {
      const assignee = t.assignee || 'Unassigned'
      if (!byAssignee[assignee]) byAssignee[assignee] = []

      byAssignee[assignee].push(t)

      if (t.due) {
        const wk = getWeekStart(new Date(t.due)).toISOString().split('T')[0]
        weeksSet.add(wk)
      } else if (t.created) {
        const wk = getWeekStart(new Date(t.created)).toISOString().split('T')[0]
        weeksSet.add(wk)
      }
    })

    const weeks = Array.from(weeksSet).sort()

    // tasks per week per assignee (count)
    const tasksPerWeekPerAssignee = {}
    Object.keys(byAssignee).forEach(assignee => {
      tasksPerWeekPerAssignee[assignee] = {}
      byAssignee[assignee].forEach(t => {
        const wk = (t.due ? getWeekStart(new Date(t.due)) : getWeekStart(new Date(t.created))).toISOString().split('T')[0]
        tasksPerWeekPerAssignee[assignee][wk] = (tasksPerWeekPerAssignee[assignee][wk] || 0) + 1
      })
    })

    // totals
    const totals = Object.keys(byAssignee).map(name => {
      const items = byAssignee[name]
      const avgDuration = Math.round(items.reduce((s, it) => s + (Number(it.duration) || 0), 0) / Math.max(1, items.length))
      const overdue = items.filter(it => it.due && new Date(it.due) < new Date()).length
      return { name, count: items.length, avgDuration, overdue }
    }).sort((a,b)=>b.count-a.count)

    return { byAssignee, weeks, tasksPerWeekPerAssignee, totals }
  }, [tasks])

  const topAssignees = totals.slice(0, 8)

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Manager Summary</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total Assignees" value={Object.keys(byAssignee).length} />
        <StatsCard title="Total Tasks" value={tasks.length} />
        <StatsCard title="Avg Duration (days)" value={Math.round(tasks.reduce((s,t)=>s+(Number(t.duration)||0),0)/Math.max(1,tasks.length))} />
      </div>

      <div className="md:flex gap-6">
        <div className="flex-1">
          <h4 className="text-sm font-semibold mb-2">Top Assignees (by task count)</h4>
          <div className="space-y-2">
            {topAssignees.map(a => (
              <div key={a.name} className="flex items-center justify-between">
                <div className="text-sm font-medium">{a.name}</div>
                <div className="text-sm text-gray-600">{a.count} tasks • {a.avgDuration}d avg • {a.overdue} overdue</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-[420px]">
          <h4 className="text-sm font-semibold mb-2">Tasks per Assignee (bar)</h4>
          <div className="space-y-2">
            {totals.map(t => (
              <div key={t.name} className="flex items-center gap-3">
                <div className="w-32 text-sm">{t.name}</div>
                <div className="flex-1 bg-gray-100 h-4 rounded overflow-hidden">
                  <div className="bg-blue-600 h-4 rounded" style={{ width: `${Math.min(100, (t.count / (totals[0]?.count || 1)) * 100)}%` }} />
                </div>
                <div className="w-10 text-sm text-right">{t.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-2">Weekly workload heatmap (tasks/week)</h4>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-max">
            <div className="grid" style={{ gridTemplateColumns: `200px repeat(${Math.max(1, weeks.length)}, 80px)` }}>
              <div className="p-2 font-semibold">Assignee</div>
              {weeks.map(w => <div key={w} className="p-2 font-semibold text-xs text-center">{w}</div>)}

              {Object.keys(byAssignee).sort().map(name => (
                <React.Fragment key={name}>
                  <div className="p-2 text-sm">{name}</div>
                  {weeks.map(wk => {
                    const v = (tasksPerWeekPerAssignee[name] && tasksPerWeekPerAssignee[name][wk]) || 0
                    const intensity = Math.min(1, v / 5)
                    const bg = `rgba(59,130,246,${0.15 + intensity*0.7})`
                    return <div key={wk} className="p-2 text-center text-sm" style={{ background: bg }}>{v || '-'}</div>
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
