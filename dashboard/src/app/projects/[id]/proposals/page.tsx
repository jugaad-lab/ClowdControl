'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getProject,
  getProjectProposals,
  getAgents,
  Project,
  Proposal,
  Agent,
} from '@/lib/supabase';
import { ProposalList } from '@/components/proposals/ProposalList';
import { CreateProposalModal } from '@/components/proposals/CreateProposalModal';
import { useTheme } from '@/lib/hooks';
import { Plus, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProjectProposalsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectData, proposalsData, agentsData] = await Promise.all([
          getProject(projectId),
          getProjectProposals(projectId),
          getAgents(),
        ]);
        setProject(projectData);
        setProposals(proposalsData);
        setAgents(agentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [projectId]);

  const handleProposalCreated = async () => {
    // Refresh proposals list after creation
    try {
      const proposalsData = await getProjectProposals(projectId);
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error refreshing proposals:', error);
    }
  };

  const handleProposalClick = (proposal: Proposal) => {
    router.push(`/proposals/${proposal.id}`);
  };

  // Filter proposals by status
  const openProposals = proposals.filter((p) =>
    ['open', 'debating'].includes(p.status)
  );
  const resolvedProposals = proposals.filter((p) =>
    ['consensus', 'escalated', 'approved', 'rejected'].includes(p.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-xl text-zinc-600 dark:text-zinc-400">
          Loading proposals...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-xl text-red-600">Project not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/projects/${projectId}`}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Project
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-blue-500" />
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                  Proposals
                </h1>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                {project.name} — PM consensus review
              </p>
            </div>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4" />
              New Proposal
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Active Proposals */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Active Proposals
            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-2">
              ({openProposals.length})
            </span>
          </h2>
          <ProposalList
            proposals={openProposals}
            agents={agents}
            onProposalClick={handleProposalClick}
          />
        </section>

        {/* Resolved Proposals */}
        {resolvedProposals.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              Resolved
              <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400 ml-2">
                ({resolvedProposals.length})
              </span>
            </h2>
            <ProposalList
              proposals={resolvedProposals}
              agents={agents}
              onProposalClick={handleProposalClick}
            />
          </section>
        )}
      </main>

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        proposerId={project.current_pm_id}
        onCreated={handleProposalCreated}
      />
    </div>
  );
}
