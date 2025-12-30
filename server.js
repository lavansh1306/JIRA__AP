import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const DOMAIN = "testsite98763.atlassian.net";
const EMAIL = "ak5004@srmist.edu.in";
const API_TOKEN = process.env.JIRA_API_TOKEN || "";
const PROJECT_KEY = "TEST";

const auth = Buffer.from(`${EMAIL}:${API_TOKEN}`).toString("base64");

app.get("/api/issues", async (req, res) => {
  try {
    const response = await fetch(
      `https://${DOMAIN}/rest/api/3/search/jql`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          jql: `project = ${PROJECT_KEY} AND created >= -365d ORDER BY created ASC`,
          fields: ["key", "issuetype", "summary", "description", "priority", "status", "assignee", "created", "duedate"],
          maxResults: 100
        })
      }
    );

    const data = await response.json();

    const issues = data.issues.map(issue => {
      const created = issue.fields.created;
      const due = issue.fields.duedate;

      let duration = "";
      if (due) {
        duration = Math.ceil(
          (new Date(due) - new Date(created)) / (1000 * 60 * 60 * 24)
        );
      }

      return {
        key: issue.key,
        issueType: issue.fields.issuetype?.name || "-",
        summary: issue.fields.summary,
        description: issue.fields.description || "-",
        priority: issue.fields.priority?.name || "-",
        status: issue.fields.status?.name || "-",
        assignee: issue.fields.assignee?.displayName || "Unassigned",
        created,
        due,
        duration
      };
    });

    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Jira issues" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
