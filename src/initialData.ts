import { Project, Sprint, Issue } from "./types";

export const SEED_USERS = [
  { name: "Emily PM", email: "emily@worrkfree.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  { name: "Alex Lead", email: "alex@worrkfree.com", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150" },
  { name: "Jane Dev", email: "jane@worrkfree.com", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150" },
  { name: "Nithish Reddy", email: "reddynithish@gmail.com", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-quantum",
    name: "Quantum Engine",
    key: "QTUM",
    description: "Core processing engine and orchestration portal for ultra-fast queries."
  },
  {
    id: "proj-apollo",
    name: "Apollo Frontend UI",
    key: "APLO",
    description: "Polishing the customer dashboard interfaces and interaction layout."
  }
];

export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: "sprint-1",
    projectId: "proj-quantum",
    name: "QTUM Sprint 1: Foundation",
    goal: "Setup the main backend services and database models",
    startDate: "2026-06-25",
    endDate: "2026-07-09",
    status: "active"
  },
  {
    id: "sprint-2",
    projectId: "proj-quantum",
    name: "QTUM Sprint 2: Core Processing",
    goal: "Integrate processing layers and core APIs",
    startDate: "2026-07-10",
    endDate: "2026-07-24",
    status: "future"
  },
  {
    id: "sprint-apollo-1",
    projectId: "proj-apollo",
    name: "APLO Sprint 1: Layout Core",
    goal: "Complete typography scales and shell grid",
    startDate: "2026-06-20",
    endDate: "2026-07-04",
    status: "active"
  }
];

export const INITIAL_ISSUES: Issue[] = [
  // Quantum Engine Issues
  {
    id: "issue-qtum-1",
    key: "QTUM-1",
    projectId: "proj-quantum",
    sprintId: "sprint-1",
    summary: "Setup API routes for real-time engine health telemetry",
    description: `### Goal / Context
We need to monitor the operational status of the core processing engine. This task sets up the standard HTTP and WebSockets telemetry endpoints.

### Acceptance Criteria
- [x] Create \`/api/health/engine\` endpoint
- [x] Stream engine latency, thread usage, and memory foot-print
- [ ] Connect WebSocket listener on port 3000
- [ ] Render data dynamically with standard D3 trends

### Technical Scope
- Run the WebSocket connection within the main fullstack process safely.
- Throttle logs to 1 FPS maximum.`,
    type: "Task",
    status: "In Progress",
    priority: "High",
    storyPoints: 5,
    assignee: SEED_USERS[1],
    createdAt: "2026-06-25T10:00:00Z",
    updatedAt: "2026-06-26T14:30:00Z",
    comments: [
      {
        id: "c1",
        author: "Emily PM",
        avatar: SEED_USERS[0].avatar,
        text: "Make sure to lock down this telemetry route behind auth roles so that engine internals are safe.",
        createdAt: "2026-06-25T11:20:00Z"
      },
      {
        id: "c2",
        author: "Alex Lead",
        avatar: SEED_USERS[1].avatar,
        text: "Agreed, we will use standard session middleware gates for this.",
        createdAt: "2026-06-25T12:05:00Z"
      }
    ],
    subtasks: [
      { id: "s1-1", title: "Implement basic express middleware", completed: true, createdAt: "2026-06-25T10:15:00Z" },
      { id: "s1-2", title: "Add system diagnostics instrumentation", completed: true, createdAt: "2026-06-25T11:00:00Z" },
      { id: "s1-3", title: "Configure websocket streams and test concurrency limit", completed: false, createdAt: "2026-06-25T11:30:00Z" }
    ],
    workLogs: [
      { id: "wl-1", author: "Alex Lead", hoursLogged: 3.5, description: "Bootstrapped middleware and memory probes", createdAt: "2026-06-25T14:00:00Z" },
      { id: "wl-2", author: "Alex Lead", hoursLogged: 2, description: "Refined telemetry packet sizes to minimize latency", createdAt: "2026-06-26T11:00:00Z" }
    ]
  },
  {
    id: "issue-qtum-2",
    key: "QTUM-2",
    projectId: "proj-quantum",
    sprintId: "sprint-1",
    summary: "Fix memory leak in multi-threaded database connector",
    description: `### Issue
Engine profiling shows a slow but steady heap size expansion during high concurrency pooling. It is traced back to open DB connections that are not closed on socket timeout exceptions.

### Acceptance Criteria
- [ ] Hook error callbacks to release pool resources instantly.
- [ ] Add Jest leak test cases validating garbage collection.
- [ ] Memory remains stable beneath 150MB after 100K simulated requests.`,
    type: "Bug",
    status: "To Do",
    priority: "Highest",
    storyPoints: 8,
    assignee: SEED_USERS[2],
    createdAt: "2026-06-25T11:15:00Z",
    updatedAt: "2026-06-25T11:15:00Z",
    comments: [],
    subtasks: [
      { id: "s2-1", title: "Isolate DB connector pool parameters", completed: false, createdAt: "2026-06-25T11:15:00Z" },
      { id: "s2-2", title: "Draft automated stress tests with artillery", completed: false, createdAt: "2026-06-25T11:15:00Z" }
    ],
    workLogs: []
  },
  {
    id: "issue-qtum-3",
    key: "QTUM-3",
    projectId: "proj-quantum",
    sprintId: "sprint-1",
    summary: "As a user, I want to filter execution logs by event type",
    description: `### Goal
Our portal shows hundreds of logs. Users need rapid filtering toggles for Info, Warning, Error, and Critical alerts.

### Acceptance Criteria
- [x] Add high-contrast pills in sidebar
- [x] Support multiple selection (e.g. Warning + Error)
- [ ] Export filtered reports directly to standard PDF
- [ ] Persistence of filter states inside localStorage`,
    type: "Story",
    status: "In Review",
    priority: "Medium",
    storyPoints: 3,
    assignee: SEED_USERS[3],
    createdAt: "2026-06-24T09:00:00Z",
    updatedAt: "2026-06-26T15:00:00Z",
    comments: [
      {
        id: "c3",
        author: "Emily PM",
        avatar: SEED_USERS[0].avatar,
        text: "The styling is fantastic on the filtering pills, very responsive!",
        createdAt: "2026-06-26T15:10:00Z"
      }
    ],
    subtasks: [
      { id: "s3-1", title: "UI components for high-contrast pills", completed: true, createdAt: "2026-06-24T10:00:00Z" },
      { id: "s3-2", title: "Log filtering algorithm implementation", completed: true, createdAt: "2026-06-24T14:00:00Z" },
      { id: "s3-3", title: "PDF generator library setup", completed: false, createdAt: "2026-06-25T09:00:00Z" }
    ],
    workLogs: [
      { id: "wl-3", author: "Nithish Reddy", hoursLogged: 6, description: "Coded state flow and visual design for filter controls", createdAt: "2026-06-25T17:00:00Z" }
    ]
  },
  {
    id: "issue-qtum-4",
    key: "QTUM-4",
    projectId: "proj-quantum",
    sprintId: "sprint-1",
    summary: "Design global Epic for analytical aggregation interface",
    description: `This Epic tracks progress towards building the complete business intelligence charts and telemetry aggregator.`,
    type: "Epic",
    status: "Done",
    priority: "Low",
    storyPoints: 13,
    assignee: SEED_USERS[0],
    createdAt: "2026-06-20T08:00:00Z",
    updatedAt: "2026-06-26T16:00:00Z",
    comments: [],
    subtasks: [],
    workLogs: []
  },
  {
    id: "issue-qtum-5",
    key: "QTUM-5",
    projectId: "proj-quantum",
    sprintId: null, // Product Backlog
    summary: "Integrate standard OAuth provider flow for developers",
    description: `We need to support login with third-party providers. Highly prioritized in the roadmap.`,
    type: "Story",
    status: "Backlog",
    priority: "High",
    storyPoints: 8,
    assignee: SEED_USERS[3],
    createdAt: "2026-06-26T12:00:00Z",
    updatedAt: "2026-06-26T12:00:00Z",
    comments: [],
    subtasks: [],
    workLogs: []
  },

  // Apollo Frontend UI Issues
  {
    id: "issue-aplo-1",
    key: "APLO-1",
    projectId: "proj-apollo",
    sprintId: "sprint-apollo-1",
    summary: "Verify typography line heights and accessibility contrast",
    description: `Ensure all text components meet standard WCAG AAA requirements. Highly critical for enterprise dashboards.`,
    type: "Task",
    status: "In Progress",
    priority: "High",
    storyPoints: 2,
    assignee: SEED_USERS[0],
    createdAt: "2026-06-22T09:00:00Z",
    updatedAt: "2026-06-22T10:30:00Z",
    comments: [],
    subtasks: [],
    workLogs: []
  }
];
