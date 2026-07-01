const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// 1. Add mongoose import
content = content.replace(
  'import { getMessages, saveMessage } from "./src/db/chatDb";',
  'import { getMessages, saveMessage } from "./src/db/chatDb";\nimport { connectDB } from "./src/db/mongoose";'
);

// 2. Add async to socket connection
content = content.replace(
  'io.on("connection", (socket) => {',
  'io.on("connection", async (socket) => {'
);
content = content.replace(
  'socket.emit("chat_history", getMessages());',
  'socket.emit("chat_history", await getMessages());'
);
content = content.replace(
  'socket.on("send_message", (data) => {',
  'socket.on("send_message", async (data) => {'
);
content = content.replace(
  'saveMessage(message);',
  'await saveMessage(message);'
);

// 3. User related updates
content = content.replace(
  'const user = await createUser(email, password, displayName);',
  'const user = await createUser(email, password, displayName);' // already async
);
content = content.replace(
  'const user = await verifyUser(email, password);',
  'const user = await verifyUser(email, password);' // already async
);
content = content.replace(
  'const users = getUsers();',
  'const users = await getUsers();'
);
content = content.replace(
  'const updatedUser = await updateUser(req.user.id, { displayName, avatar: avatarUrl }, passwords);',
  'const updatedUser = await updateUser(req.user.id, { displayName, avatar: avatarUrl }, passwords);' // already async
);

// 4. Project related updates
content = content.replace(
  'const allProjects = getProjects();',
  'const allProjects = await getProjects();'
);
content = content.replace(
  'const project = createProject(projectId, name, key, description, userId);',
  'const project = await createProject(projectId, name, key, description, userId);'
);
content = content.replace(
  'joinUserToProject(userId, project.id);',
  'await joinUserToProject(userId, project.id);'
);
content = content.replace(
  'const project = joinProject(inviteCode, userId);',
  'const project = await joinProject(inviteCode, userId);'
);
content = content.replace(
  'joinUserToProject(userId, project.id);',
  'await joinUserToProject(userId, project.id);'
);
content = content.replace(
  'const members = getProjectMembers(req.params.id);',
  'const members = await getProjectMembers(req.params.id);'
);
content = content.replace(
  'const users = getUsers();',
  'const users = await getUsers();'
);
content = content.replace(
  'const code = getInviteCode(req.params.id, userId);',
  'const code = await getInviteCode(req.params.id, userId);'
);
content = content.replace(
  'const project = updateProject(req.params.id, userId, { name, key, description });',
  'const project = await updateProject(req.params.id, userId, { name, key, description });'
);
content = content.replace(
  'deleteProject(projectId, userId);',
  'await deleteProject(projectId, userId);'
);
content = content.replace(
  'removeProjectFromAllUsers(projectId);',
  'await removeProjectFromAllUsers(projectId);'
);

// 5. Connect to MongoDB before starting Express server
content = content.replace(
  'async function startServer() {',
  'async function startServer() {\n  await connectDB();'
);

fs.writeFileSync('server.ts', content);
console.log('Replaced successfully');
