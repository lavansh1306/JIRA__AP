import { useMemo } from 'react'
import { getWeekNumber, getWeekStart } from '../utils/helpers'

export default function GanttChart({ tasks, assignee }) {
  const { stats, tasksByWeek, sortedWeeks, minDate, maxDate } = useMemo(() => {
    // Group tasks by week
    const tasksByWeek = {}
    tasks.forEach(task => {
      if (task.due) {
        const dueDate = new Date(task.due)
        const weekStart = getWeekStart(dueDate)
        const weekKey = weekStart.toISOString().split('T')[0]
        if (!tasksByWeek[weekKey]) {
          tasksByWeek[weekKey] = []
        }
        tasksByWeek[weekKey].push(task)
      }
    })

    const sortedWeeks = Object.keys(tasksByWeek).sort()
    const dueDates = tasks.filter(t => t.due).map(t => new Date(t.due))

    const minDate = sortedWeeks.length > 0 ? new Date(sortedWeeks[0]) : new Date()
    const maxDate = sortedWeeks.length > 0
      ? new Date(new Date(sortedWeeks[sortedWeeks.length - 1]).getTime() + 6 * 24 * 60 * 60 * 1000)
      : new Date()

    // Calculate stats
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Closed').length
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length
    const totalHours = tasks.reduce((sum, t) => sum + (t.duration || 0), 0) * 8
    const avgDuration = Math.round(tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / totalTasks)

    const stats = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      totalHours,
      avgDuration,
      minDate: minDate.toLocaleDateString(),
      maxDate: maxDate.toLocaleDateString(),
    }

    return { stats, tasksByWeek, sortedWeeks, minDate, maxDate }
  }, [tasks])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        📅 Gantt Chart - {assignee}
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">📊 Total Tasks</h4>
          <p className="text-3xl font-bold text-blue-600">{stats.totalTasks}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">✅ Completed</h4>
          <p className="text-3xl font-bold text-green-600">{stats.completedTasks}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">⏳ In Progress</h4>
          <p className="text-3xl font-bold text-purple-600">{stats.inProgressTasks}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">⏱️ Total Hours</h4>
          <p className="text-3xl font-bold text-orange-600">{stats.totalHours}h</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">📈 Avg Duration</h4>
          <p className="text-3xl font-bold text-red-600">{stats.avgDuration}d</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">📅 Timeline</h4>
          <p className="text-sm font-semibold text-indigo-600">{stats.minDate}</p>
          <p className="text-sm font-semibold text-indigo-600">{stats.maxDate}</p>
        </div>
      </div>

      {/* Tasks by Week */}
      <div className="space-y-6">
        {sortedWeeks.map((weekKey, weekIdx) => {
          const weekStart = new Date(weekKey)
          const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
          const weekNumber = getWeekNumber(weekStart)
          const weekTasks = tasksByWeek[weekKey]

          return (
            <div key={weekKey}>
              {/* Week Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  Week {weekNumber} ({weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()})
                </h3>
                <span className="bg-white/20 px-4 py-2 rounded-full text-sm font-semibold">
                  {weekTasks.length} task(s)
                </span>
              </div>

              {/* Tasks in Week */}
              <div className="space-y-3">
                {weekTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{task.key}</h4>
                        <p className="text-sm text-gray-700 mt-1">{task.summary}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {task.status}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>Created: {new Date(task.created).toLocaleDateString()}</span>
                      <span>Due: {new Date(task.due).toLocaleDateString()}</span>
                      <span className="font-semibold text-blue-600">Duration: {task.duration}d</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Week Separator */}
              {weekIdx < sortedWeeks.length - 1 && (
                <div className="h-1 bg-gradient-to-r from-gray-300 to-transparent my-6"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
