'use client';

import { useState, useEffect } from 'react';
import { Agent } from '@/lib/supabase';

interface AgentProfileEditorProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  agentId: string;
  filename: string;
  content: string;
  lastModified: string;
}

export function AgentProfileEditor({ agent, isOpen, onClose }: AgentProfileEditorProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isOpen && agent) {
      loadProfile();
    }
  }, [isOpen, agent]);

  useEffect(() => {
    if (profile) {
      setHasChanges(editedContent !== profile.content);
    }
  }, [editedContent, profile]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/profile`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load profile');
      }
      const data: ProfileData = await res.json();
      setProfile(data);
      setEditedContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editedContent }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }
      const data = await res.json();
      setProfile(prev => prev ? { ...prev, content: editedContent, lastModified: data.lastModified } : null);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) {
        return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Edit Agent Profile: {agent.display_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {agent.display_name} • {agent.role}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading profile...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-red-500 mb-4">⚠️ {error}</div>
              <button
                onClick={loadProfile}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : profile ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  📄 {profile.filename}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last modified: {new Date(profile.lastModified).toLocaleString()}
                </span>
              </div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 w-full p-6 font-mono text-base leading-relaxed border rounded-lg 
                         dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         resize-none"
                placeholder="Agent profile content..."
                spellCheck={false}
              />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {hasChanges && (
              <span className="text-amber-500">● Unsaved changes</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                       dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                       flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  💾 Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
