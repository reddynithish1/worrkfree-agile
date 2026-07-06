const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

// We will add a small utility at the top of agile endpoints
const util = `
// Helper to emit project updates
function emitProjectUpdate(projectId) {
  if (projectId) {
    io.emit("project_updated", { projectId });
  }
}
`;

serverCode = serverCode.replace('// ---------- AGILE ENDPOINTS ---------- //', '// ---------- AGILE ENDPOINTS ---------- //' + util);

// POST /api/projects/:id/sprints
serverCode = serverCode.replace(
  'res.json(sprint);',
  'emitProjectUpdate(req.params.id);\n    res.json(sprint);'
);

// PATCH /api/sprints/:id
serverCode = serverCode.replace(
  '    res.json(sprint);\n  } catch (error: any) {\n    res.status(400).json({ error: error.message });\n  }\n});\n\n// Complete Sprint',
  '    if (sprint) emitProjectUpdate(sprint.projectId);\n    res.json(sprint);\n  } catch (error: any) {\n    res.status(400).json({ error: error.message });\n  }\n});\n\n// Complete Sprint'
);

// POST /api/sprints/:id/complete
serverCode = serverCode.replace(
  'res.json({ success: true, message: "Sprint completed" });',
  'emitProjectUpdate(sprint.projectId);\n    res.json({ success: true, message: "Sprint completed" });'
);

// POST /api/projects/:id/issues
serverCode = serverCode.replace(
  /const newIssue = await IssueModel\.create\({[\s\S]*?res\.json\(newIssue\);/g,
  match => match.replace('res.json(newIssue);', 'emitProjectUpdate(projectId);\n    res.json(newIssue);')
);

// PATCH /api/projects/:id/issues/:issueId
serverCode = serverCode.replace(
  /const issue = await IssueModel\.findOneAndUpdate\([\s\S]*?res\.json\(issue\);/g,
  match => match.replace('res.json(issue);', 'emitProjectUpdate(req.params.id);\n    res.json(issue);')
);

// DELETE /api/projects/:id/issues/:issueId
serverCode = serverCode.replace(
  /await IssueModel\.findOneAndDelete\([\s\S]*?res\.json\({ success: true }\);/g,
  match => match.replace('res.json({ success: true });', 'emitProjectUpdate(req.params.id);\n    res.json({ success: true });')
);

// POST /api/issues/:id/worklogs
serverCode = serverCode.replace(
  /const issue = await IssueModel\.findOne\({ id: issueId }\);[\s\S]*?res\.json\(worklog\);/g,
  match => match.replace('res.json(worklog);', 'emitProjectUpdate(issue?.projectId);\n    res.json(worklog);')
);

fs.writeFileSync('server.ts', serverCode);
console.log('Patched server.ts with io.emit calls!');
