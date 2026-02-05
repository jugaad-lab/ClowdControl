'use client';

import { IndependentOpinion, Agent } from '@/lib/supabase';
import { AlertTriangle, Users } from 'lucide-react';

interface ConcernsMatrixProps {
  opinions: IndependentOpinion[];
  agents: Agent[];
}

interface ConcernCluster {
  theme: string;
  concerns: Array<{
    text: string;
    agentId: string;
  }>;
}

// Simple similarity check for clustering (in production, use NLP)
function areSimilar(a: string, b: string): boolean {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.length / union.size > 0.3;
}

function clusterConcerns(opinions: IndependentOpinion[]): ConcernCluster[] {
  const allConcerns: Array<{ text: string; agentId: string }> = [];
  
  opinions.forEach((opinion) => {
    opinion.opinion.concerns.forEach((concern) => {
      allConcerns.push({ text: concern, agentId: opinion.agent_id });
    });
  });

  const clusters: ConcernCluster[] = [];
  const used = new Set<number>();

  allConcerns.forEach((concern, i) => {
    if (used.has(i)) return;

    const cluster: ConcernCluster = {
      theme: concern.text.slice(0, 50) + (concern.text.length > 50 ? '...' : ''),
      concerns: [concern],
    };
    used.add(i);

    allConcerns.forEach((other, j) => {
      if (i !== j && !used.has(j) && areSimilar(concern.text, other.text)) {
        cluster.concerns.push(other);
        used.add(j);
      }
    });

    clusters.push(cluster);
  });

  // Sort by number of agents sharing the concern
  return clusters.sort((a, b) => {
    const uniqueAgentsA = new Set(a.concerns.map(c => c.agentId)).size;
    const uniqueAgentsB = new Set(b.concerns.map(c => c.agentId)).size;
    return uniqueAgentsB - uniqueAgentsA;
  });
}

export function ConcernsMatrix({ opinions, agents }: ConcernsMatrixProps) {
  const agentMap = agents.reduce((acc, agent) => {
    acc[agent.id] = agent;
    return acc;
  }, {} as Record<string, Agent>);

  const clusters = clusterConcerns(opinions);
  const sharedConcerns = clusters.filter(c => new Set(c.concerns.map(x => x.agentId)).size > 1);
  const uniqueConcerns = clusters.filter(c => new Set(c.concerns.map(x => x.agentId)).size === 1);

  if (opinions.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 text-center">
        <p className="text-zinc-400">No concerns to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shared Concerns - High Priority */}
      {sharedConcerns.length > 0 && (
        <div className="bg-zinc-900 border border-amber-800/50 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-800/50 bg-amber-950/30 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-amber-400">Shared Concerns</h3>
            <span className="ml-auto text-xs text-amber-500 bg-amber-950 px-2 py-0.5 rounded-full">
              Multiple PMs
            </span>
          </div>
          <div className="p-5 space-y-4">
            {sharedConcerns.map((cluster, idx) => {
              const uniqueAgents = [...new Set(cluster.concerns.map(c => c.agentId))];
              return (
                <div key={idx} className="bg-zinc-800/50 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{cluster.theme}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Raised by {uniqueAgents.length} PM{uniqueAgents.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-7">
                    {uniqueAgents.map((agentId) => {
                      const agent = agentMap[agentId];
                      return (
                        <span
                          key={agentId}
                          className="text-xs px-2 py-1 bg-zinc-700 rounded-md text-zinc-300"
                        >
                          {agent?.display_name || 'Unknown'}
                        </span>
                      );
                    })}
                  </div>
                  {cluster.concerns.length > 1 && (
                    <details className="mt-3 ml-7">
                      <summary className="text-xs text-zinc-500 cursor-pointer hover:text-zinc-400">
                        Show all variations ({cluster.concerns.length})
                      </summary>
                      <ul className="mt-2 space-y-2">
                        {cluster.concerns.map((concern, cidx) => (
                          <li key={cidx} className="text-sm text-zinc-400 flex items-start gap-2">
                            <span className="text-zinc-600">—</span>
                            <span>
                              <span className="text-zinc-500">
                                [{agentMap[concern.agentId]?.display_name}]
                              </span>{' '}
                              {concern.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Unique Concerns */}
      {uniqueConcerns.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Individual Concerns</h3>
            <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
              Single PM
            </span>
          </div>
          <div className="p-5">
            <div className="grid gap-3 md:grid-cols-2">
              {uniqueConcerns.map((cluster, idx) => {
                const agentId = cluster.concerns[0].agentId;
                const agent = agentMap[agentId];
                return (
                  <div
                    key={idx}
                    className="bg-zinc-800/50 rounded-lg p-3 flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-zinc-400 font-medium">
                        {agent?.display_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-500 mb-1">
                        {agent?.display_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-zinc-300">
                        {cluster.concerns[0].text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {clusters.reduce((acc, c) => acc + c.concerns.length, 0)}
          </p>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total Concerns</p>
        </div>
        <div className="bg-zinc-900 border border-amber-800/50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{sharedConcerns.length}</p>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Shared Themes</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{uniqueConcerns.length}</p>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Unique</p>
        </div>
      </div>
    </div>
  );
}
