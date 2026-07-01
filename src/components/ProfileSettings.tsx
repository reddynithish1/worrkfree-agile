import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { X, Save, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

interface ProfileSettingsProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updatedUser: User) => void;
}

const AVATAR_COLORS = [
  "2563eb", // blue
  "16a34a", // green
  "ea580c", // orange
  "dc2626", // red
  "9333ea", // purple
  "0f172a", // slate
];

export default function ProfileSettings({ user, isOpen, onClose, onProfileUpdated }: ProfileSettingsProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDisplayName(user.displayName);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
      
      // If user has a ui-avatars URL, try to extract the background color
      if (user.avatar && user.avatar.includes("ui-avatars.com")) {
        const match = user.avatar.match(/background=([a-fA-F0-9]+)/);
        if (match && match[1]) {
          setAvatarColor(match[1]);
        }
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        return setError('Current password is required to set a new password');
      }
      if (newPassword.length < 8) {
        return setError('New password must be at least 8 characters long');
      }
      if (newPassword !== confirmPassword) {
        return setError('New passwords do not match');
      }
    }

    setIsLoading(true);

    try {
      const payload: any = { displayName, avatarColor };
      if (currentPassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      onProfileUpdated(data);

      // Clear password fields on success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Profile Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh] space-y-6">
          
          {/* Status Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-emerald-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm glass-input rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Avatar Theme
              </label>
              <div className="flex gap-3">
                {AVATAR_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${avatarColor === color ? 'border-slate-900 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: `#${color}` }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-900/10" />

          {/* Password Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Change Password (Optional)</h4>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm glass-input rounded-xl border border-slate-200"
                placeholder="Enter current password to authorize"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl border border-slate-200"
                  placeholder="Min 8 chars"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Confirm New</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm glass-input rounded-xl border border-slate-200"
                  placeholder="Match password"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-900/10 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold glass-button-primary rounded-full flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
