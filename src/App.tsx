import React, { useState, useEffect, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import { 
  Folder, Calendar, Sparkles, BarChart2, CheckSquare, Plus, ChevronDown, 
  Users, Activity, HelpCircle, LayoutGrid, Database, BookOpen, Settings, X, MessageSquare, Layout, Menu
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
import ProfileSettings from "./components/ProfileSettings";
import ProjectSettingsModal from "./components/ProjectSettingsModal";
import WorrkFreeLogo from "./components/WorrkFreeLogo";

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

  // Profile Settings State
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Join Project Modal State
  const [isJoinProjectOpen, setIsJoinProjectOpen] = useState(false);
  const [joinInviteCode, setJoinInviteCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Project Settings Modal State
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);

  // New Project State
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjKey, setNewProjKey] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");

  // Mobile Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Loading indicator for mounting
  const [isInitialized, setIsInitialized] = useState(false);

  // Real-time synchronization
  useEffect(() => {
    if (!activeProjectId) return;
    
    const socket = io();
    
    const handleUpdate = (data: any) => {
      if (data.projectId === activeProjectId) {
        fetchSprintsAndIssues(activeProjectId);
      }
    };
    
    socket.on("project_updated", handleUpdate);
    
    return () => {
      socket.off("project_updated", handleUpdate);
      socket.disconnect();
    };
  }, [activeProjectId]);

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
        setIsInitialized(true); // if not logged in, just end init
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  // LIFECYCLE: Load Data when User Logs In
  useEffect(() => {
    if (!currentUser) return;
    
    // Fetch projects from backend
    fetch("/api/projects")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch projects");
        return res.json();
      })
      .then(fetchedProjects => {
        setProjects(fetchedProjects);
        if (fetchedProjects.length > 0 && !activeProjectId) {
          setActiveProjectId(fetchedProjects[0].id);
        }
      })
      .catch(e => console.error("Error loading user data", e))
      .finally(() => {
        setIsInitialized(true);
      });
  }, [currentUser]);

  // Fetch Sprints and Issues for active project
  const fetchSprintsAndIssues = async (projectId: string) => {
    try {
      const [sprintsRes, issuesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/sprints`),
        fetch(`/api/projects/${projectId}/issues`)
      ]);
      if (sprintsRes.ok) {
        setSprints(await sprintsRes.json());
      }
      if (issuesRes.ok) {
        setIssues(await issuesRes.json());
      }
    } catch (e) {
      console.error("Error fetching project data", e);
    }
  };

  useEffect(() => {
    if (activeProjectId) {
      fetchSprintsAndIssues(activeProjectId);
    } else {
      setSprints([]);
      setIssues([]);
    }
  }, [activeProjectId]);

  // LocalStorage saving removed

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
  const handleUpdateIssueStatus = async (issueId: string, newStatus: IssueStatus) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok && activeProjectId) {
        fetchSprintsAndIssues(activeProjectId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Move issue to a different Sprint (or Product Backlog)
  const handleMoveIssueToSprint = async (issueId: string, sprintId: string | null) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId })
      });
      if (res.ok && activeProjectId) {
        fetchSprintsAndIssues(activeProjectId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create an issue
  const handleCreateIssue = async (issueData: Partial<Issue>) => {
    const projId = issueData.projectId || activeProjectId;
    if (!projId) return;

    try {
      const res = await fetch(`/api/projects/${projId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueData)
      });
      if (res.ok && activeProjectId) {
        fetchSprintsAndIssues(activeProjectId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add subtasks, comments, log-work update
  const handleUpdateIssue = async (updated: Issue) => {
    try {
      const res = await fetch(`/api/issues/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok && activeProjectId) {
        fetchSprintsAndIssues(activeProjectId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    try {
      const res = await fetch(`/api/issues/${id}`, { method: "DELETE" });
      if (res.ok && activeProjectId) {
        fetchSprintsAndIssues(activeProjectId);
        if (selectedIssueId === id) setSelectedIssueId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create sprint planned
  const handleCreateSprint = async (sprintData: Partial<Sprint>) => {
    const projId = sprintData.projectId || activeProjectId;
    try {
      const res = await fetch(`/api/projects/${projId}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sprintData)
      });
      if (res.ok && activeProjectId) {
        fetchSprintsAndIssues(activeProjectId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Start a planned sprint (mark active)
  const handleStartSprint = async (sprintId: string) => {
    try {
      const res = await fetch(`/api/sprints/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" })
      });
      if (res.ok && activeProjectId) {
        fetchSprintsAndIssues(activeProjectId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Complete an active sprint
  const handleCompleteSprint = async (sprintId: string) => {
    try {
      const res = await fetch(`/api/sprints/${sprintId}/complete`, {
        method: "POST"
      });
      if (res.ok && activeProjectId) {
        fetchSprintsAndIssues(activeProjectId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // AI Sprint generator bulk imports
  const handleImportAICopilotIssues = (list: Partial<Issue>[]) => {
    list.forEach((issue) => {
      handleCreateIssue(issue);
    });
  };

  // Create new project handler
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjKey.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: newProjName.trim(), 
          key: newProjKey.trim().toUpperCase(),
          description: newProjDesc.trim() 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setProjects((prev) => [...prev, data]);
      setActiveProjectId(data.id);
      
      // Create an initial backlog sprint for this new project
      await fetch(`/api/projects/${data.id}/sprints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${data.key} Sprint 1`,
          goal: "Bootstrapping initial iteration scope",
          status: "future"
        })
      });
      // Will be fetched automatically by the activeProjectId effect

      setNewProjName("");
      setNewProjKey("");
      setNewProjDesc("");
      setIsNewProjectOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError("");
    setIsJoining(true);
    try {
      const res = await fetch("/api/projects/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinInviteCode.trim().toUpperCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join project");

      setProjects((prev) => {
        if (!prev.find(p => p.id === data.id)) return [...prev, data];
        return prev;
      });
      
      setActiveProjectId(data.id);
      setIsJoinProjectOpen(false);
      setJoinInviteCode("");
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleProjectUpdated = (updatedProj: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
  };

  const handleProjectDeleted = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId("");
    }
  };

  if (isAuthLoading || (currentUser && !isInitialized)) {
    // Return completely blank for silent session restore
    return <div className="h-screen w-screen bg-slate-50"></div>;
  }

  if (!currentUser) {
    return <AuthView onLogin={(user) => setCurrentUser(user)} />;
  }

  const handleProfileUpdated = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  if (projects.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 relative z-10 text-slate-800 font-sans" id="empty-app">
        <div className="max-w-md w-full text-center space-y-8 p-8 glass-panel rounded-3xl animate-in fade-in zoom-in-95 duration-500 shadow-xl border border-slate-200">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-blue-600 font-bold text-3xl">
            <Layout className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">You have no projects yet</h1>
          <p className="text-slate-500 text-sm">Create a new workspace or join an existing one to start collaborating with your team.</p>
          
          <div className="flex flex-col gap-4 mt-8">
            <button onClick={() => setIsNewProjectOpen(true)} className="glass-button-primary rounded-full py-3.5 text-sm font-bold shadow-xl shadow-blue-500/20">
              Create your first project
            </button>
            <button onClick={() => setIsJoinProjectOpen(true)} className="px-6 py-3.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
              Join via Invite Code
            </button>
          </div>
        </div>

        {/* Global Profile Settings */}
        <ProfileSettings
          user={currentUser}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onProfileUpdated={handleProfileUpdated}
        />

        {/* New Project Modal Container inside Empty State */}
        {isNewProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="glass-panel md:rounded-3xl shadow-2xl border-0 md:border border-slate-900/10 w-full h-full md:h-auto md:max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900/5 border-b border-slate-900/10 shrink-0">
                <h3 className="font-bold text-slate-800">Create New Project</h3>
                <button onClick={() => setIsNewProjectOpen(false)} className="p-1 hover:bg-slate-900/5 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleCreateProjectSubmit} className="p-6 flex-1 overflow-y-auto space-y-5">
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Project Name *</label><input required type="text" value={newProjName} onChange={(e) => setNewProjName(e.target.value)} className="w-full px-3.5 py-2 text-sm glass-input rounded-xl" placeholder="e.g. Website Redesign" /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Project Key *</label><input required type="text" value={newProjKey} onChange={(e) => setNewProjKey(e.target.value)} className="w-full px-3.5 py-2 text-sm glass-input rounded-xl" placeholder="e.g. WEB" maxLength={10} /></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label><textarea value={newProjDesc} onChange={(e) => setNewProjDesc(e.target.value)} className="w-full px-3.5 py-2 text-sm glass-input rounded-xl h-24 resize-none" placeholder="Optional brief description..." /></div>
                <div className="pt-2 flex justify-end gap-3"><button type="button" onClick={() => setIsNewProjectOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-500">Cancel</button><button type="submit" className="px-5 py-2 text-sm font-semibold glass-button-primary rounded-full">Create Project</button></div>
              </form>
            </div>
          </div>
        )}

        {/* Join Project Modal */}
        {isJoinProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="glass-panel md:rounded-3xl shadow-2xl border-0 md:border border-slate-900/10 w-full h-full md:h-auto md:max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900/5 border-b border-slate-900/10 shrink-0">
                <h3 className="font-bold text-slate-800">Join Project</h3>
                <button onClick={() => setIsJoinProjectOpen(false)} className="p-1 hover:bg-slate-900/5 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleJoinProjectSubmit} className="p-6 flex-1 overflow-y-auto space-y-5">
                {joinError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{joinError}</div>}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Invite Code</label>
                  <input required type="text" value={joinInviteCode} onChange={(e) => setJoinInviteCode(e.target.value)} className="w-full px-3.5 py-2 text-sm glass-input rounded-xl uppercase" placeholder="WRK-ABCD" />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsJoinProjectOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-500">Cancel</button>
                  <button type="submit" disabled={isJoining} className="px-5 py-2 text-sm font-semibold glass-button-primary rounded-full disabled:opacity-50">{isJoining ? 'Joining...' : 'Join'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Dynamic Animated Glass Backdrop blobs */}
      <div className="glass-bg-wrapper">
        </div>

      <div className="flex h-screen w-screen overflow-hidden bg-transparent text-slate-800 font-sans relative z-10" id="main-app">
        
        {/* Mobile Top Navbar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 fixed top-0 w-full">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-slate-100">
            <Menu className="w-6 h-6" />
          </button>
          <div className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <WorrkFreeLogo />
            WorrkFree
          </div>
          <button onClick={() => setIsProfileOpen(true)}>
             <img src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} className="w-8 h-8 rounded-full border border-slate-200" alt="profile" />
          </button>
        </div>

        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* LEFT NAVIGATION COLUMN (SIDEBAR) */}
        <div className={`
          fixed md:relative z-50 md:z-10 h-full w-64 glass-sidebar text-slate-800 flex flex-col justify-between shrink-0 p-5 space-y-6 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          
          <div className="space-y-6">
            {/* Logo segment - Hidden on Mobile, Visible on Desktop */}
            <div className="hidden md:flex items-center space-x-3 mb-2 px-1">
              <WorrkFreeLogo />
              <span className="font-bold text-base tracking-tight text-slate-800">
                WorrkFree
              </span>
            </div>

            {/* Mobile Sidebar Header with Close Button */}
            <div className="flex md:hidden items-center justify-between px-1 mb-2">
              <span className="font-bold text-base tracking-tight text-slate-800">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-full hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Project Selector Segment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase px-2 tracking-wider">
                <span>Workspace</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsJoinProjectOpen(true)}
                    className="hover:text-blue-600 transition-colors flex items-center gap-0.5 text-xs font-bold text-slate-400 cursor-pointer"
                    title="Join Project"
                  >
                    Join
                  </button>
                  <button
                    onClick={() => setIsNewProjectOpen(true)}
                    className="hover:text-blue-600 transition-colors flex items-center gap-0.5 text-xs font-bold text-blue-500 cursor-pointer"
                    title="Create New Project"
                  >
                    <Plus className="w-3.5 h-3.5" /> New
                  </button>
                </div>
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
                  <div className="flex items-center">
                    <div className="relative">
                      <select
                        value={activeProjectId}
                        onChange={(e) => setActiveProjectId(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full cursor-pointer h-full z-10"
                        title="Switch Project Workspace"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.key})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-500 mr-2" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProjectSettingsOpen(true);
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-900/10 transition-colors relative z-20"
                      title="Project Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
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

          {/* Footer info segment - Hidden on Mobile (Navbar handles it) */}
          <div 
            className="hidden md:flex items-center space-x-3 p-3 bg-slate-900/5 rounded-2xl border border-slate-900/10 backdrop-blur-md shadow-xs hover:bg-white/10 transition-colors"
          >
            <img
              src={currentUser.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt={`${currentUser.displayName} profile`}
              className="w-8 h-8 rounded-full border-2 border-white object-cover cursor-pointer"
              referrerPolicy="no-referrer"
              onClick={() => setIsProfileOpen(true)}
            />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsProfileOpen(true)}>
              <span className="block text-xs font-bold text-slate-800 truncate">{currentUser.displayName}</span>
              <span className="block text-[10px] text-slate-500 truncate">{currentUser.email}</span>
            </div>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                await fetch("/api/auth/logout", { method: "POST" });
                setCurrentUser(null);
                setProjects([]);
                setSprints([]);
                setIssues([]);
                setActiveProjectId("");
              }}
              title="Logout"
              className="p-1.5 hover:bg-slate-900/10 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>

        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-hidden bg-transparent relative z-10 flex flex-col pt-16 md:pt-0 w-full">
          
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
          projectId={activeProjectId}
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />

        {/* Global Profile Settings */}
        <ProfileSettings
          user={currentUser}
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onProfileUpdated={handleProfileUpdated}
        />

        {/* Project Settings Modal */}
        <ProjectSettingsModal
          project={currentProject || null}
          currentUser={currentUser}
          isOpen={isProjectSettingsOpen}
          onClose={() => setIsProjectSettingsOpen(false)}
          onUpdateProject={handleProjectUpdated}
          onDeleteProject={handleProjectDeleted}
        />

        {/* Join Project Modal (Global) */}
        {isJoinProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="glass-panel md:rounded-3xl shadow-2xl border-0 md:border border-slate-900/10 w-full h-full md:h-auto md:max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-900/5 border-b border-slate-900/10 shrink-0">
                <h3 className="font-bold text-slate-800">Join Project</h3>
                <button onClick={() => setIsJoinProjectOpen(false)} className="p-1 hover:bg-slate-900/5 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <form onSubmit={handleJoinProjectSubmit} className="p-6 flex-1 overflow-y-auto space-y-5">
                {joinError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{joinError}</div>}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Invite Code</label>
                  <input required type="text" value={joinInviteCode} onChange={(e) => setJoinInviteCode(e.target.value)} className="w-full px-3.5 py-2 text-sm glass-input rounded-xl uppercase" placeholder="WRK-ABCD" />
                </div>
                <div className="pt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsJoinProjectOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-500">Cancel</button>
                  <button type="submit" disabled={isJoining} className="px-5 py-2 text-sm font-semibold glass-button-primary rounded-full disabled:opacity-50">{isJoining ? 'Joining...' : 'Join'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
