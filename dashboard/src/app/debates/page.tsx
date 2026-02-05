'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import {
  Proposal,
  Agent,
  Project,
  getAgents,
  getProjects,
  getDebateHistory,
} from '@/lib/supabase';
import { useTheme } from '@/lib/hooks';
import { DebateHistoryList } from '@/components/DebateHistoryList';
import { DebateDetail } from '@/components/DebateDetail';

export default function DebatesPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      try {
        const [agentsData, projectsData, proposalsData] = await Promise.all([
          getAgents(),
          getProjects(),
          getDebateHistory(),
        ]);

        setAgents(agentsData);
        setProjects(projectsData);
        setProposals(proposalsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleProposalClick = (proposal: Proposal) => {
    setSelectedProposal(proposal);
  };

  const handleProposalUpdate = (updatedProposal: Proposal) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === updatedProposal.id ? updatedProposal : p))
    );
    if (selectedProposal?.id === updatedProposal.id) {
      setSelectedProposal(updatedProposal);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-xl text-zinc-600 dark:text-zinc-400">Loading debate history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href="/"
              className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Clowd-Control
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Debate History
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                View past PM debates and track decision outcomes
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {selectedProposal ? (
          <DebateDetail
            proposal={selectedProposal}
            agents={agents}
            onBack={() => setSelectedProposal(null)}
            onProposalUpdate={handleProposalUpdate}
          />
        ) : (
          <DebateHistoryList
            proposals={proposals}
            agents={agents}
            projects={projects}
            onProposalClick={handleProposalClick}
          />
        )}
      </main>
    </div>
  );
}
