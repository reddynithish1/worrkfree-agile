const API_BASE = 'https://worrkfree-app.onrender.com/api';

async function runTests() {
  console.log("=== STARTING QA TESTS ===");

  const u1Creds = { email: 'reddynithishkanji1@gmail.com', password: 'nother@092123' };
  const u2Creds = { email: 'worrkfree.test.teammate@gmail.com', password: 'Teammate@123' };

  let u1Cookie = '';
  let u2Cookie = '';

  // STEP 1: AUTHENTICATION
  console.log("\\n-- STEP 1: AUTH --");
  
  // Login User 1
  let res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(u1Creds)
  });
  
  if (res.status === 400) {
    // If doesn't exist, try signup
    console.log("User 1 login failed, trying signup...");
    res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'User 1', ...u1Creds })
    });
  }
  
  if (!res.ok) throw new Error("User 1 Auth failed: " + await res.text());
  u1Cookie = res.headers.get('set-cookie') || '';
  console.log("User 1 Auth ✅", res.status);

  // Signup/Login User 2
  res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'User 2', ...u2Creds })
  });
  if (res.status === 400) { // exists
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u2Creds)
    });
  }
  if (!res.ok) throw new Error("User 2 Auth failed: " + await res.text());
  u2Cookie = res.headers.get('set-cookie') || '';
  console.log("User 2 Auth ✅", res.status);

  // Verify Me
  res = await fetch(`${API_BASE}/auth/me`, { headers: { 'Cookie': u1Cookie } });
  if (!res.ok) throw new Error("GET /auth/me failed: " + await res.text());
  const u1Profile = await res.json();
  console.log("GET /auth/me ✅", u1Profile.user.email);

  // STEP 2: PROJECT CREATION
  console.log("\\n-- STEP 2: PROJECT CREATION --");
  res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie },
    body: JSON.stringify({ name: "QA Test Project", description: "Testing", key: "QTP" })
  });
  if (!res.ok) throw new Error("Project Creation failed: " + await res.text());
  const project = await res.json();
  console.log("Project created ✅", project.key, "Invite:", project.inviteCode);

  res = await fetch(`${API_BASE}/auth/me`, { headers: { 'Cookie': u1Cookie } });
  let u1Data = await res.json();
  if (!u1Data.user.projects.includes(project.id)) throw new Error("Project missing from User 1 list!");
  console.log("Project in User 1 list ✅");

  // STEP 3: COLLABORATION
  console.log("\\n-- STEP 3: COLLABORATION --");
  res = await fetch(`${API_BASE}/projects/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': u2Cookie },
    body: JSON.stringify({ inviteCode: project.inviteCode })
  });
  if (!res.ok) throw new Error("Join Project failed: " + await res.text());
  console.log("User 2 joined project ✅");

  res = await fetch(`${API_BASE}/auth/me`, { headers: { 'Cookie': u2Cookie } });
  let u2Data = await res.json();
  if (!u2Data.user.projects.includes(project.id)) throw new Error("Project missing from User 2 list! BUG!");
  console.log("Project in User 2 list ✅");

  // STEP 4: TASK MANAGEMENT
  console.log("\\n-- STEP 4: TASK MANAGEMENT --");
  const issues = [
    { summary: "Fix login bug", type: "Task", status: "TO DO", priority: "High", storyPoints: 2, key: "QTP-1" },
    { summary: "Update UI design", type: "Task", status: "TO DO", priority: "Medium", storyPoints: 3, key: "QTP-2" },
    { summary: "Write test cases", type: "Task", status: "TO DO", priority: "Low", storyPoints: 1, key: "QTP-3" }
  ];
  let createdIssues = [];
  for (let issue of issues) {
    res = await fetch(`${API_BASE}/projects/${project.id}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie },
      body: JSON.stringify(issue)
    });
    if (!res.ok) throw new Error("Issue creation failed: " + await res.text());
    createdIssues.push(await res.json());
  }
  console.log("3 Issues Created ✅");

  res = await fetch(`${API_BASE}/projects/${project.id}/issues`, { headers: { 'Cookie': u2Cookie } });
  let u2Issues = await res.json();
  if (u2Issues.length < 3) throw new Error("User 2 cannot see all issues! Found: " + u2Issues.length);
  console.log("User 2 sees issues ✅");

  res = await fetch(`${API_BASE}/projects/${project.id}/issues/${createdIssues[0].id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': u2Cookie },
    body: JSON.stringify({ status: "IN PROGRESS" })
  });
  if (!res.ok) throw new Error("Status update failed: " + await res.text());
  console.log("User 2 updated status ✅");

  res = await fetch(`${API_BASE}/projects/${project.id}/issues`, { headers: { 'Cookie': u1Cookie } });
  let u1Issues = await res.json();
  const updatedIssue = u1Issues.find(i => i.id === createdIssues[0].id);
  if (updatedIssue.status !== "IN PROGRESS") throw new Error("Status did not reflect for User 1!");
  console.log("User 1 sees status update ✅");

  // STEP 5: SPRINT MANAGEMENT
  console.log("\\n-- STEP 5: SPRINT MANAGEMENT --");
  res = await fetch(`${API_BASE}/projects/${project.id}/sprints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie },
    body: JSON.stringify({ name: "Sprint 1", status: "future", startDate: new Date().toISOString(), endDate: new Date().toISOString() })
  });
  if (!res.ok) throw new Error("Sprint 1 creation failed: " + await res.text());
  let sprint1 = await res.json();
  console.log("Sprint 1 created ✅");

  for (let issue of createdIssues) {
    await fetch(`${API_BASE}/projects/${project.id}/issues/${issue.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie },
      body: JSON.stringify({ sprintId: sprint1.id })
    });
  }
  console.log("Issues added to sprint ✅");

  res = await fetch(`${API_BASE}/sprints/${sprint1.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie },
    body: JSON.stringify({ status: "active" })
  });
  if (!res.ok) throw new Error("Sprint 1 start failed: " + await res.text());
  console.log("Sprint 1 started ✅");

  res = await fetch(`${API_BASE}/sprints/${sprint1.id}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie }
  });
  if (!res.ok) throw new Error("Sprint 1 complete failed: " + await res.text());
  console.log("Sprint 1 completed ✅");

  // STEP 6: CHAT
  console.log("\\n-- STEP 6: CHAT --");
  res = await fetch(`${API_BASE}/projects/${project.id}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie },
    body: JSON.stringify({ message: "Hello from User1!", userName: "User 1", userAvatar: "" })
  });
  if (!res.ok) throw new Error("Chat send failed: " + await res.text());
  console.log("Chat 1 sent ✅");

  res = await fetch(`${API_BASE}/projects/${project.id}/chat`, { headers: { 'Cookie': u2Cookie } });
  let chatHist = await res.json();
  if (!chatHist.find(m => m.message === "Hello from User1!")) throw new Error("User 2 cannot see chat!");
  console.log("User 2 sees chat ✅");

  // STEP 7: WORKLOGS
  console.log("\\n-- STEP 7: WORKLOGS --");
  res = await fetch(`${API_BASE}/issues/${createdIssues[0].id}/worklogs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie },
    body: JSON.stringify({ hoursLogged: 2, description: "Initial work", author: "User 1" })
  });
  if (!res.ok) throw new Error("Worklog 1 failed: " + await res.text());
  
  res = await fetch(`${API_BASE}/issues/${createdIssues[0].id}/worklogs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie },
    body: JSON.stringify({ hoursLogged: 1.5, description: "Code review", author: "User 1" })
  });
  if (!res.ok) throw new Error("Worklog 2 failed: " + await res.text());
  console.log("Worklogs created ✅");

  res = await fetch(`${API_BASE}/projects/${project.id}/worklogs`, { headers: { 'Cookie': u2Cookie } });
  let wls = await res.json();
  const issueWls = wls.filter(w => w.issueId === createdIssues[0].id);
  if (issueWls.length < 2) throw new Error("Worklogs missing for User 2!");
  console.log("User 2 sees worklogs ✅");

  // STEP 8: PROFILE EDIT
  console.log("\\n-- STEP 8: PROFILE --");
  res = await fetch(`${API_BASE}/user/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': u1Cookie },
    body: JSON.stringify({ displayName: "Nithish Updated" })
  });
  if (!res.ok) throw new Error("Profile edit failed: " + await res.text());
  console.log("Profile edited ✅");

  res = await fetch(`${API_BASE}/auth/me`, { headers: { 'Cookie': u1Cookie } });
  u1Data = await res.json();
  if (u1Data.user.displayName !== "Nithish Updated") throw new Error("Profile edit did not persist!");
  console.log("Profile changes verified ✅");

  console.log("\\n=== ALL API TESTS PASSED ===");
}

runTests().catch(console.error);
