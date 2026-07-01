import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { X, Copy, CheckCircle2, Users } from 'lucide-react';

interface ProjectSettingsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectSettingsModal({ project, isOpen, onClose }: ProjectSettingsModalProps) {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      loadProjectData();
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

        <div className="p-6 overflow-y-auto space-y-8">
          
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
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <img 
                      src={member.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
                      alt={member.name}
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-800 leading-tight">
                        {member.name}
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
