import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3000/api';
let cookieHeader = '';

async function runTests() {
  console.log("Starting E2E Tests...");
  
  // 1. AUTHENTICATION TEST
  let res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Test User', email: 'test@example.com', password: 'password123' })
  });
  
  if (res.status === 400) {
    // maybe user exists, try login
    res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });
  }
  
  if (!res.ok) throw new Error("Auth failed: " + await res.text());
  cookieHeader = res.headers.raw()['set-cookie']?.[0] || '';
  console.log("Auth passed.");

  // Test Duplicate Email
  let dupRes = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Test User 2', email: 'test@example.com', password: 'password123' })
  });
  if (dupRes.status !== 400) throw new Error("Duplicate email signup did not return 400");
  console.log("Duplicate email check passed.");

  // 2. PROJECT CREATION
  res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookieHeader },
    body: JSON.stringify({ name: 'TeamTest', key: 'TEST', description: 'Test project' })
  });
  if (!res.ok) throw new Error("Project creation failed: " + await res.text());
  const project = await res.json();
  console.log("Project created:", project.key, "Invite Code:", project.inviteCode);

  // 3. TEAMMATE COLLABORATION
  let user2Res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'Teammate', email: 'teammate@example.com', password: 'password123' })
  });
  if (user2Res.status === 400) {
    user2Res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'teammate@example.com', password: 'password123' })
    });
  }
  let user2Cookie = user2Res.headers.raw()['set-cookie']?.[0] || '';

  // Join Project
  let joinRes = await fetch(`${API_BASE}/projects/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': user2Cookie },
    body: JSON.stringify({ inviteCode: project.inviteCode })
  });
  if (!joinRes.ok) throw new Error("Teammate join failed: " + await joinRes.text());
  console.log("Teammate joined successfully.");
  
  // Verify Teammate can GET the project
  let u2ProjectsRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Cookie': user2Cookie }
  });
  const u2Data = await u2ProjectsRes.json();
  if (!u2Data.user.projects.includes(project.id)) {
    throw new Error("Project not found in user2 projects list!");
  }
  console.log("Collaboration test passed.");

  console.log("All API programmatic tests passed.");
}

runTests().catch(console.error);
