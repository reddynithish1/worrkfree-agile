import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { X, Copy, CheckCircle2, Users, Settings2, Trash2, AlertTriangle } from 'lucide-react';

interface ProjectSettingsModalProps {
  project: Project | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject: (updated: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function ProjectSettingsModal({ 
  project, currentUser, isOpen, onClose, onUpdateProject, onDeleteProject 
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'edit' | 'danger'>('members');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Edit State
  const [editName, setEditName] = useState("");
  const [editKey, setEditKey] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = Boolean(project && currentUser && project.ownerId === currentUser.id);

  useEffect(() => {
    if (isOpen && project) {
      loadProjectData();
      setEditName(project.name);
      setEditKey(project.key);
      setEditDesc(project.description || "");
      setActiveTab('members');
      setDeleteConfirm("");
    }
  }, [isOpen, project]);

  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      const [membersRes, codeRes] = await Promise.all([
        fetch(`/api/projects/${project?.id}/members`),
        fetch(`/api/projects/${project?.id}/invite-code`)
      ]);
      
      if (membersRes.ok) {
        setMembers(await membersRes.json());
      }
      
      if (codeRes.ok) {
        const data = await codeRes.json();
        setInviteCode(data.inviteCode);
      } else {
        setInviteCode(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, key: editKey, description: editDesc })
      });
      if (!res.ok) throw new Error("Failed to update project");
      const updated = await res.json();
      onUpdateProject(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!project || deleteConfirm !== project.name) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      onDeleteProject(project.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="glass-panel rounded-3xl shadow-2xl border border-slate-900/10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/5 border-b border-slate-900/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600/90 rounded-lg flex items-center justify-center text-slate-900 font-bold shadow-md">
              {project.key.substring(0, 1)}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 leading-tight">Project Settings</h3>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{project.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-900/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex items-center gap-6 px-6 border-b border-slate-900/10">
          <button 
            onClick={() => setActiveTab('members')}
            className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'members' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Members
          </button>
          {isOwner && (
            <>
              <button 
                onClick={() => setActiveTab('edit')}
                className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'edit' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Edit Details
              </button>
              <button 
                onClick={() => setActiveTab('danger')}
                className={`py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'danger' ? 'border-rose-600 text-rose-600' : 'border-transparent text-rose-400 hover:text-rose-600'}`}
              >
                Danger Zone
              </button>
            </>
          )}
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          
          {activeTab === 'members' && (
            <>
              {/* Invite Code Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Invite Team Members
            </h4>
            <p className="text-xs text-slate-500">
              Share this secure code with your team to grant them instant access to this project workspace.
            </p>
            
            <div className="flex items-center gap-3 mt-2">
              <div className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-center">
                {isLoading ? (
                  <span className="text-slate-400 font-mono text-lg animate-pulse">Loading...</span>
                ) : inviteCode ? (
                  <span className="text-slate-800 font-mono font-bold tracking-[0.2em] text-xl">{inviteCode}</span>
                ) : (
                  <span className="text-rose-500 text-sm font-semibold">Not authorized to view invite code</span>
                )}
              </div>
              
              {inviteCode && (
                <button
                  onClick={handleCopyCode}
                  className="h-12 px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer border border-slate-900/10 bg-white hover:bg-slate-50 text-slate-700 shadow-sm"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-900/10" />

          {/* Members List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Project Members</h4>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {members.length} Total
              </span>
            </div>
            
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-sm text-slate-500 py-4 text-center">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="text-sm text-slate-500 py-4 text-center">No members found.</div>
              ) : (
                members.map((member, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <img 
                      src={member.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                      alt={member.displayName || "Unknown User"} 
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-800">
                        {member.displayName || "Unknown User"}
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </>
          )}

          {isOwner && activeTab === 'edit' && (
            <form onSubmit={handleUpdate} className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Project Name</label>
                <input required type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3.5 py-2 text-sm glass-input rounded-xl" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Project Key</label>
                <input required type="text" value={editKey} onChange={(e) => setEditKey(e.target.value.toUpperCase())} className="w-full px-3.5 py-2 text-sm glass-input rounded-xl" maxLength={10} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-3.5 py-2 text-sm glass-input rounded-xl h-24 resize-none" />
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={isSaving} className="px-5 py-2 text-sm font-semibold glass-button-primary rounded-full disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {isOwner && activeTab === 'danger' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3 text-rose-800">
                <h4 className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Delete Project
                </h4>
                <p className="text-sm">
                  Are you sure? This will permanently delete the project and all its tasks. This action cannot be undone.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600">Please type <strong>{project.name}</strong> to confirm.</label>
                <input 
                  type="text" 
                  value={deleteConfirm} 
                  onChange={(e) => setDeleteConfirm(e.target.value)} 
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl"
                  placeholder={project.name}
                />
              </div>

              <button 
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirm !== project.name}
                className="w-full py-3 rounded-xl font-bold text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete Project'}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
