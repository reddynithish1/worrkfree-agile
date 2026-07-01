import React, { useState, useEffect } from "react";
import { 
  Folder, Calendar, Sparkles, BarChart2, CheckSquare, Plus, ChevronDown, 
  Users, Activity, HelpCircle, LayoutGrid, Database, BookOpen, Settings, X, MessageSquare 
} from "lucide-react";

// Modular imports
import { Project, Sprint, Issue, IssueStatus, ActiveTab, User } from "./types";
import { INITIAL_PROJECTS, INITIAL_SPRINTS, INITIAL_ISSUES, SEED_USERS } from "./initialData";
import KanbanBoard from "./components/KanbanBoard";
import BacklogView from "./components/BacklogView";
import AICopilot from "./components/AICopilot";
import InsightsView from "./components/InsightsView";
import IssueDetailDrawer from "./components/IssueDetailDrawer";
import AuthView from "./components/AuthView";
import ChatPanel from "./components/ChatPanel";

export default function App() {
  // Global Workspace States
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("board");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  // Chat Panel State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // New Project Modal State
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjKey, setNewProjKey] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Loading indicator for mounting
  const [isInitialized, setIsInitialized] = useState(false);

  // Check auth status on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then(data => {
        setCurrentUser(data.user);
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  // 1. LIFECYCLE: Sync & Load LocalStorage Workspace
  useEffect(() => {
    try {
      const cachedProjects = localStorage.getItem("jira_projects");
      const cachedSprints = localStorage.getItem("jira_sprints");
      const cachedIssues = localStorage.getItem("jira_issues");

      if (cachedProjects && cachedSprints && cachedIssues) {
        setProjects(JSON.parse(cachedProjects));
        setSprints(JSON.parse(cachedSprints));
        setIssues(JSON.parse(cachedIssues));
        
        const decodedProjects = JSON.parse(cachedProjects);
        if (decodedProjects.length > 0) {
          setActiveProjectId(decodedProjects[0].id);
        }
      } else {
        // First run: Seed data
        setProjects(INITIAL_PROJECTS);
        setSprints(INITIAL_SPRINTS);
        setIssues(INITIAL_ISSUES);
        setActiveProjectId(INITIAL_PROJECTS[0].id);

        localStorage.setItem("jira_projects", JSON.stringify(INITIAL_PROJECTS));
        localStorage.setItem("jira_sprints", JSON.stringify(INITIAL_SPRINTS));
        localStorage.setItem("jira_issues", JSON.stringify(INITIAL_ISSUES));
      }
    } catch (e) {
      console.error("Failed loading cached state", e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("jira_projects", JSON.stringify(projects));
      localStorage.setItem("jira_sprints", JSON.stringify(sprints));
      localStorage.setItem("jira_issues", JSON.stringify(issues));
    }
  }, [projects, sprints, issues, isInitialized]);

  // Current selected project details
  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  // Active Sprint for the current project
  const activeSprint = sprints.find(
    (s) => s.projectId === activeProjectId && s.status === "active"
  ) || null;

  // Selected Issue for detail drawing
  const selectedIssue = issues.find((i) => i.id === selectedIssueId) || null;

  // 2. STATE RE-ASSIGNMENT HANDLERS
  
  // Update direct status (Kanban Board Drag & Drop)
  const handleUpdateIssueStatus = (issueId: string, newStatus: IssueStatus) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, status: newStatus, updatedAt: new Date().toISOString() }
          : i
      )
    );
  };

  // Move issue to a different Sprint (or Product Backlog)
  const handleMoveIssueToSprint = (issueId: string, sprintId: string | null) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === issueId
          ? { ...i, sprintId, updatedAt: new Date().toISOString() }
          : i
      )
    );
  };

  // Create an issue (calculates incremental project key key, e.g. QTUM-6)
  const handleCreateIssue = (issueData: Partial<Issue>) => {
    const projId = issueData.projectId || activeProjectId;
    const proj = projects.find((p) => p.id === projId);
    if (!proj) return;

    // Filter project issues to calculate next sequential ID count
    const projIssues = issues.filter((i) => i.projectId === projId);
    const keys = projIssues.map((i) => {
      const parts = i.key.split("-");
      return parts.length > 1 ? parseInt(parts[1], 10) : 0;
    });
    const nextNum = keys.length > 0 ? Math.max(...keys) + 1 : 1;
    const computedKey = `${proj.key}-${nextNum}`;

    const newIssue: Issue = {
      id: "issue-" + Date.now(),
      key: computedKey,
      projectId: projId,
      sprintId: issueData.sprintId ?? null,
      summary: issueData.summary || "New Issue Title",
      description: issueData.description || "",
      type: issueData.type || "Story",
      status: issueData.status || "To Do",
      priority: issueData.priority || "Medium",
      storyPoints: issueData.storyPoints || 0,
      assignee: issueData.assignee || SEED_USERS[3], // Default Nithish Dev
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: issueData.comments || [],
      subtasks: issueData.subtasks || [],
      workLogs: issueData.workLogs || [],
    };

    setIssues((prev) => [...prev, newIssue]);
  };

  // Add subtasks, comments, log-work update
  const handleUpdateIssue = (updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleDeleteIssue = (id: string) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
    if (selectedIssueId === id) setSelectedIssueId(null);
  };

  // Create sprint planned
  const handleCreateSprint = (sprintData: Partial<Sprint>) => {
    const newSprint: Sprint = {
      id: "sprint-" + Date.now(),
      projectId: sprintData.projectId || activeProjectId,
      name: sprintData.name || "Planned Sprint",
      goal: sprintData.goal || "",
      startDate: sprintData.startDate,
      endDate: sprintData.endDate,
      status: "future",
    };

    setSprints((prev) => [...prev, newSprint]);
  };

  // Start a planned sprint (mark active)
  const handleStartSprint = (sprintId: string) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === sprintId ? { ...s, status: "active" } : s))
    );
  };

  // Complete an active sprint:
  // Moves ALL un-resolved issues (To Do, In Progress, In Review) back to the Product Backlog (sprintId = null)
  // Keeps resolved (Done) issues locked inside the sprint. Marks sprint as "completed"
  const handleCompleteSprint = (sprintId: string) => {
    setIssues((prev) =>
      prev.map((i) => {
        if (i.sprintId === sprintId && i.status !== "Done") {
          return { ...i, sprintId: null, updatedAt: new Date().toISOString() };
        }
        return i;
      })
    );

    setSprints((prev) =>
      prev.map((s) => (s.id === sprintId ? { ...s, status: "completed" } : s))
    );
  };

  // AI Sprint generator bulk imports
  const handleImportAICopilotIssues = (list: Partial<Issue>[]) => {
    list.forEach((issue) => {
      handleCreateIssue(issue);
    });
  };

  // Create new project handler
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjKey.trim()) return;

    const keyUpper = newProjKey.trim().toUpperCase();
    const id = "proj-" + newProjName.trim().toLowerCase().replace(/\s+/g, "-");

    const newProject: Project = {
      id,
      name: newProjName.trim(),
      key: keyUpper,
      description: newProjDesc.trim(),
    };

    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(id);
    
    // Create an initial backlog sprint for this new project
    const defaultSprint: Sprint = {
      id: "sprint-auto-" + Date.now(),
      projectId: id,
      name: `${keyUpper} Sprint 1`,
      goal: "Bootstrapping initial iteration scope",
      status: "future"
    };
    setSprints((prev) => [...prev, defaultSprint]);

    setNewProjName("");
    setNewProjKey("");
    setNewProjDesc("");
    setIsNewProjectOpen(false);
  };

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-600/90 rounded-xl mb-4 flex items-center justify-center font-bold text-xl">W</div>
          <div className="text-xl font-bold">Loading WorrkFree...</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <>
      {/* Dynamic Animated Glass Backdrop blobs */}
      <div className="glass-bg-wrapper">
        </div>

      <div className="flex h-screen w-screen overflow-hidden bg-transparent text-slate-800 font-sans relative z-10" id="main-app">
        
        {/* LEFT NAVIGATION COLUMN (SIDEBAR) */}
        <div className="w-64 glass-sidebar text-slate-800 flex flex-col justify-between shrink-0 p-5 space-y-6 relative z-10">
          
          <div className="space-y-6">
            {/* Logo segment */}
            <div className="flex items-center space-x-3 mb-2 px-1">
              <div className="w-8 h-8 bg-blue-600/90 rounded-lg flex items-center justify-center text-slate-900 font-bold shadow-md shadow-blue-500/25">
                {currentProject ? currentProject.key.substring(0, 1) : "W"}
              </div>
              <span className="font-bold text-base tracking-tight text-slate-800">
                WorrkFree
              </span>
            </div>

            {/* Project Selector Segment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase px-2 tracking-wider">
                <span>Workspace</span>
                <button
                  onClick={() => setIsNewProjectOpen(true)}
                  className="hover:text-blue-600 transition-colors flex items-center gap-0.5 text-xs font-bold text-blue-500 cursor-pointer"
                  title="Create New Project"
                >
                  <Plus className="w-3.5 h-3.5" /> Project
                </button>
              </div>

              {currentProject ? (
                <div className="relative group px-3 py-2.5 bg-slate-900/5 hover:bg-white/15 rounded-xl shadow-xs border border-slate-900/10 flex items-center justify-between transition-all backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-600/90 rounded font-bold text-xs text-slate-900 flex items-center justify-center shadow-xs">
                      {currentProject.key}
                    </div>
                    <div className="min-w-0">
                      <span className="block font-bold text-xs text-slate-800 truncate">{currentProject.name}</span>
                      <span className="block text-[9px] text-slate-500 tracking-wider font-semibold">Key: {currentProject.key}</span>
                    </div>
                  </div>

                  {/* Switcher selector */}
                  <select
                    value={activeProjectId}
                    onChange={(e) => setActiveProjectId(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full cursor-pointer h-full"
                    title="Switch Project Workspace"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.key})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>
              ) : (
                <p className="text-xs text-slate-500 px-2">No projects configured</p>
              )}
            </div>

            {/* Tab Navigation items */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 px-2">Workspace Navigation</div>
              <nav className="space-y-1.5">
                <button
                  onClick={() => setActiveTab("board")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === "board"
                      ? "bg-white/15 text-slate-900 shadow-sm border border-slate-900/10 backdrop-blur-md"
                      : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-900"
                  }`}
                >
                  <LayoutGrid className={`w-4 h-4 ${activeTab === "board" ? "text-blue-600" : "text-slate-500"}`} />
                  <span>Active Sprint Board</span>
                </button>

                <button
                  onClick={() => setActiveTab("backlog")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === "backlog"
                      ? "bg-white/15 text-slate-900 shadow-sm border border-slate-900/10 backdrop-blur-md"
                      : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-900"
                  }`}
                >
                  <Database className={`w-4 h-4 ${activeTab === "backlog" ? "text-blue-600" : "text-slate-500"}`} />
                  <span>Backlog Planner</span>
                </button>

                <button
                  onClick={() => setActiveTab("copilot")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === "copilot"
                      ? "bg-white/15 text-slate-900 shadow-sm border border-slate-900/10 backdrop-blur-md"
                      : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${activeTab === "copilot" ? "text-amber-500 fill-amber-100" : "text-slate-500"}`} />
                  <span>Agile AI Copilot</span>
                </button>

                <button
                  onClick={() => setActiveTab("insights")}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === "insights"
                      ? "bg-white/15 text-slate-900 shadow-sm border border-slate-900/10 backdrop-blur-md"
                      : "text-slate-500 hover:bg-slate-900/5 hover:text-slate-900"
                  }`}
                >
                  <BarChart2 className={`w-4 h-4 ${activeTab === "insights" ? "text-blue-600" : "text-slate-500"}`} />
                  <span>Reports & Insights</span>
                </button>

                <div className="pt-4 mt-2 border-t border-slate-900/10">
                  <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-slate-500 hover:bg-slate-900/5 hover:text-slate-900"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <span>Workspace Chat</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Footer info segment */}
          <div className="flex items-center space-x-3 p-3 bg-slate-900/5 rounded-2xl border border-slate-900/10 backdrop-blur-md shadow-xs">
            <img
              src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt={`${currentUser.name} profile`}
              className="w-8 h-8 rounded-full border-2 border-white object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">{currentUser.email}</div>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                setCurrentUser(null);
              }}
              title="Logout"
              className="p-1.5 hover:bg-slate-900/5 rounded-lg text-slate-500 hover:text-rose-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>

        </div>

        {/* RIGHT SIDE MAIN WORKSPACE WRAPPER */}
        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
          
          {/* Render Active Tab Component */}
          {currentProject ? (
            <>
              {activeTab === "board" && (
                <KanbanBoard
                  project={currentProject}
                  activeSprint={activeSprint}
                  issues={issues}
                  onUpdateIssueStatus={handleUpdateIssueStatus}
                  onOpenIssueDetail={(issue) => setSelectedIssueId(issue.id)}
                  onCreateIssue={handleCreateIssue}
                />
              )}

              {activeTab === "backlog" && (
                <BacklogView
                  project={currentProject}
                  sprints={sprints}
                  issues={issues}
                  onMoveIssueToSprint={handleMoveIssueToSprint}
                  onUpdateIssueStatus={handleUpdateIssueStatus}
                  onOpenIssueDetail={(issue) => setSelectedIssueId(issue.id)}
                  onCreateIssue={handleCreateIssue}
                  onCreateSprint={handleCreateSprint}
                  onStartSprint={handleStartSprint}
                  onCompleteSprint={handleCompleteSprint}
                />
              )}

              {activeTab === "copilot" && (
                <AICopilot
                  project={currentProject}
                  activeSprint={activeSprint}
                  issues={issues}
                  onImportIssues={handleImportAICopilotIssues}
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab);
                  }}
                />
              )}

              {activeTab === "insights" && (
                <InsightsView
                  project={currentProject}
                  sprints={sprints}
                  issues={issues}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-slate-900/5 backdrop-blur-xl border border-slate-900/10 rounded-2xl m-6 text-slate-500">
              Create an agile project on the sidebar selector to get started.
            </div>
          )}

          {/* Slide-over issue detail drawer overlay */}
          {selectedIssue && (
            <>
              {/* Backdrop clickable */}
              <div
                onClick={() => setSelectedIssueId(null)}
                className="absolute inset-0 z-30 bg-slate-50/40 backdrop-blur-xs"
              />
              <IssueDetailDrawer
                issue={selectedIssue}
                sprints={sprints}
                isOpen={true}
                onClose={() => setSelectedIssueId(null)}
                onUpdateIssue={handleUpdateIssue}
                onDeleteIssue={handleDeleteIssue}
              />
            </>
          )}

        </div>

        {/* NEW PROJECT INLINE MODAL DIALOG */}
        {isNewProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/40 backdrop-blur-sm">
            <div className="glass-panel rounded-3xl shadow-2xl border border-slate-900/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900/5 text-slate-800 border-b border-slate-900/10">
                <h3 className="font-bold flex items-center gap-2">
                  <Folder className="w-5 h-5 text-blue-600" /> Create New Agile Project
                </h3>
                <button 
                  onClick={() => setIsNewProjectOpen(false)}
                  className="p-1 hover:bg-slate-900/5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5.5 h-5.5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleCreateProjectSubmit} className="p-6 space-y-4 bg-transparent">
                {/* Project name */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Project Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Billing Gateway Service"
                    value={newProjName}
                    onChange={(e) => {
                      setNewProjName(e.target.value);
                      // Autofill Key if empty
                      if (e.target.value.length >= 2 && !newProjKey) {
                        const words = e.target.value.split(" ");
                        const keySuggestion = words.length > 1
                          ? (words[0][0] + words[1][0]).toUpperCase()
                          : e.target.value.substring(0, 3).toUpperCase();
                        setNewProjKey(keySuggestion);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl"
                  />
                </div>

                {/* Project key prefix */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Project Key Prefix <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="e.g. BILL"
                    value={newProjKey}
                    onChange={(e) => setNewProjKey(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl font-bold"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    Uppercase shortcode prefix used for issue keys (e.g. BILL-1, BILL-2)
                  </p>
                </div>

                {/* Project description */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Summarize the core milestone objectives..."
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2 text-sm glass-input rounded-xl"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-900/10">
                  <button
                    type="button"
                    onClick={() => setIsNewProjectOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-sm font-semibold glass-button-primary rounded-full"
                  >
                    Create Project
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Global Chat Panel */}
        <ChatPanel 
          user={currentUser} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />

      </div>
    </>
  );
}
