let allIssues = [];

// CSV Parser function
function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i]
      .split(',')
      .map(v => v.trim().replace(/^"|"$/g, ''));
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
}

// Fetch and parse CSV
fetch("./jira_events (1).csv")
  .then(res => res.text())
  .then(csvText => {
    const parsedData = parseCSV(csvText);
    
    allIssues = parsedData.map(row => {
      const created = new Date(row.Created || row["Created"]);
      const dueDate = row["Due date"] || row["DueDate"];
      const due = dueDate ? new Date(dueDate) : null;

      let duration = "";
      if (due && !isNaN(due.getTime()) && !isNaN(created.getTime())) {
        duration = Math.ceil((due - created) / (1000 * 60 * 60 * 24));
      }

      return {
        key: row["Project key"] || "-",
        issueType: row["Issue Type"] || "-",
        summary: row["Summary"] || "-",
        description: row["Description"] || "-",
        priority: row["Priority"] || "-",
        status: row["Status"] || "-",
        assignee: row["Assignee"] || "Unassigned",
        created: created.toISOString(),
        due: due ? due.toISOString() : null,
        duration
      };
    });
    
    displayTable(allIssues);
    populateAssigneeDropdown(allIssues);
  })
  .catch(err => {
    console.error("Error loading CSV:", err);
    alert("Failed to load CSV file");
  });

function displayTable(data) {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = '';
  
  data.forEach(issue => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${issue.key}</td>
      <td>${issue.issueType}</td>
      <td>${issue.summary}</td>
      <td>${issue.description}</td>
      <td>${issue.priority}</td>
      <td>${issue.status}</td>
      <td>${issue.assignee}</td>
      <td>${new Date(issue.created).toLocaleDateString()}</td>
      <td>${issue.due ? new Date(issue.due).toLocaleDateString() : "-"}</td>
      <td>${issue.duration !== "" ? issue.duration : "-"}</td>
    `;
    tbody.appendChild(row);
  });
}

function populateAssigneeDropdown(issues) {
  const assignees = [...new Set(issues.map(i => i.assignee))].sort();
  const select = document.getElementById("assignee-select");
  
  assignees.forEach(assignee => {
    const option = document.createElement("option");
    option.value = assignee;
    option.textContent = assignee;
    select.appendChild(option);
  });
}

document.getElementById("assignee-select").addEventListener("change", function(e) {
  const assignee = e.target.value;
  
  if (!assignee) {
    document.getElementById("gantt-section").style.display = "none";
    return;
  }
  
  const assigneeTasks = allIssues.filter(i => i.assignee === assignee && i.due);
  
  if (assigneeTasks.length === 0) {
    alert("No tasks with due dates found for this assignee.");
    return;
  }
  
  document.getElementById("selected-assignee").textContent = assignee;
  document.getElementById("gantt-section").style.display = "block";
  
  createWeeklyReport(assigneeTasks, assignee);
});

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function createWeeklyReport(tasks, assignee) {
  const ganttChart = document.getElementById("gantt-chart");
  const dateLabels = document.getElementById("date-labels");
  const stats = document.getElementById("stats");
  
  ganttChart.innerHTML = '';
  dateLabels.innerHTML = '';
  
  // Group tasks by week
  const tasksByWeek = {};
  const dueDates = tasks.filter(t => t.due).map(t => new Date(t.due));
  
  dueDates.forEach(date => {
    const weekStart = getWeekStart(date);
    const weekKey = weekStart.toISOString().split('T')[0];
    if (!tasksByWeek[weekKey]) {
      tasksByWeek[weekKey] = [];
    }
  });
  
  tasks.forEach(task => {
    if (task.due) {
      const dueDate = new Date(task.due);
      const weekStart = getWeekStart(dueDate);
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!tasksByWeek[weekKey]) {
        tasksByWeek[weekKey] = [];
      }
      tasksByWeek[weekKey].push(task);
    }
  });
  
  const sortedWeeks = Object.keys(tasksByWeek).sort();
  
  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done' || t.status === 'Closed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const totalHours = tasks.reduce((sum, t) => sum + (t.duration || 0), 0) * 8;
  const avgDuration = Math.round(tasks.reduce((sum, t) => sum + (t.duration || 0), 0) / totalTasks);
  
  const minDate = new Date(sortedWeeks[0]);
  const maxDate = new Date(sortedWeeks[sortedWeeks.length - 1]);
  const weekEnd = new Date(maxDate.getTime() + 6 * 24 * 60 * 60 * 1000);
  
  stats.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h4>📊 Total Tasks</h4>
        <p class="stat-value">${totalTasks}</p>
      </div>
      <div class="stat-card">
        <h4>✅ Completed</h4>
        <p class="stat-value completed">${completedTasks}</p>
      </div>
      <div class="stat-card">
        <h4>⏳ In Progress</h4>
        <p class="stat-value in-progress">${inProgressTasks}</p>
      </div>
      <div class="stat-card">
        <h4>⏱️ Total Hours</h4>
        <p class="stat-value">${totalHours}h</p>
      </div>
      <div class="stat-card">
        <h4>📈 Avg Duration</h4>
        <p class="stat-value">${avgDuration}d</p>
      </div>
      <div class="stat-card">
        <h4>📅 Timeline</h4>
        <p class="stat-value">${minDate.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}</p>
      </div>
    </div>
  `;
  
  // Create weekly reports
  sortedWeeks.forEach((weekKey, index) => {
    const weekStart = new Date(weekKey);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    const weekNumber = getWeekNumber(weekStart);
    const weekTasks = tasksByWeek[weekKey];
    
    // Week header
    const weekHeader = document.createElement("div");
    weekHeader.className = "week-header";
    weekHeader.innerHTML = `
      <h4>Week ${weekNumber} (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})</h4>
      <span class="week-task-count">${weekTasks.length} task(s)</span>
    `;
    ganttChart.appendChild(weekHeader);
    
    // Tasks in week
    weekTasks.forEach(task => {
      const row = document.createElement("div");
      row.className = "gantt-row";
      
      const taskInfo = document.createElement("div");
      taskInfo.className = "task-info";
      
      const taskKey = document.createElement("div");
      taskKey.className = "task-key";
      taskKey.textContent = task.key;
      
      const taskDetails = document.createElement("div");
      taskDetails.className = "task-details";
      
      const summary = document.createElement("div");
      summary.className = "task-summary";
      summary.textContent = task.summary.substring(0, 50) + (task.summary.length > 50 ? "..." : "");
      summary.title = task.summary;
      
      const metadata = document.createElement("div");
      metadata.className = "task-metadata";
      
      const dueDate = new Date(task.due);
      const duration = task.duration || 0;
      const statusClass = task.status === 'Done' || task.status === 'Closed' ? 'completed' : 
                         task.status === 'In Progress' ? 'in-progress' : 'pending';
      
      metadata.innerHTML = `
        <span class="badge status-${statusClass}">${task.status}</span>
        <span class="badge priority-${(task.priority || '').toLowerCase()}">${task.priority || 'Normal'}</span>
        <span class="duration">Duration: ${duration}d</span>
      `;
      
      taskDetails.appendChild(summary);
      taskDetails.appendChild(metadata);
      taskInfo.appendChild(taskKey);
      taskInfo.appendChild(taskDetails);
      
      row.appendChild(taskInfo);
      ganttChart.appendChild(row);
    });
    
    // Add separator between weeks
    if (index < sortedWeeks.length - 1) {
      const separator = document.createElement("div");
      separator.className = "week-separator";
      ganttChart.appendChild(separator);
    }
  });
}
