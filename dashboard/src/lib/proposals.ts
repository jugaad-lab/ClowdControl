import {
  supabase,
  Proposal,
  IndependentOpinion,
  DebateRound,
  SycophancyFlag,
  Critique,
  ProposalStatus,
  ProposalType,
  VoteType,
} from './supabase';

// ============ Proposals ============

export async function getProposals(projectId?: string) {
  let query = supabase
    .from('proposals')
    .select('*')
    .order('proposed_at', { ascending: false });
  
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as Proposal[];
}

export async function getProposal(id: string) {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Proposal;
}

export async function createProposal(proposal: {
  project_id: string;
  proposal_type: ProposalType;
  title: string;
  content: Record<string, unknown>;
  proposed_by?: string;
}) {
  const { data, error } = await supabase
    .from('proposals')
    .insert({
      ...proposal,
      status: 'open' as ProposalStatus,
      proposed_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Proposal;
}

export async function updateProposalStatus(
  id: string,
  status: ProposalStatus,
  resolutionNotes?: string,
  finalDecision?: Record<string, unknown>
) {
  const updates: Partial<Proposal> = { status };
  
  if (status === 'approved' || status === 'rejected' || status === 'escalated') {
    updates.resolved_at = new Date().toISOString();
    if (resolutionNotes) updates.resolution_notes = resolutionNotes;
    if (finalDecision) updates.final_decision = finalDecision;
  }
  
  const { data, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Proposal;
}

// ============ Independent Opinions ============

export async function getOpinions(proposalId: string) {
  const { data, error } = await supabase
    .from('independent_opinions')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('generated_at', { ascending: true });
  
  if (error) throw error;
  return data as IndependentOpinion[];
}

export async function getOpinion(proposalId: string, agentId: string) {
  const { data, error } = await supabase
    .from('independent_opinions')
    .select('*')
    .eq('proposal_id', proposalId)
    .eq('agent_id', agentId)
    .maybeSingle();
  
  if (error) throw error;
  return data as IndependentOpinion | null;
}

export async function hasAgentSubmittedOpinion(proposalId: string, agentId: string) {
  const opinion = await getOpinion(proposalId, agentId);
  return opinion !== null;
}

export async function submitOpinion(opinion: {
  proposal_id: string;
  agent_id: string;
  opinion: {
    vote: VoteType;
    reasoning: string;
    concerns: string[];
  };
  confidence: number;
}) {
  // Validate 2+ concerns
  if (opinion.opinion.concerns.length < 2) {
    throw new Error('At least 2 concerns are required');
  }
  
  const { data, error } = await supabase
    .from('independent_opinions')
    .insert({
      ...opinion,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as IndependentOpinion;
}

export async function markOpinionRevealed(id: string) {
  const { data, error } = await supabase
    .from('independent_opinions')
    .update({ saw_other_opinions_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as IndependentOpinion;
}

export async function allOpinionsSubmitted(proposalId: string, requiredAgentIds: string[]) {
  const opinions = await getOpinions(proposalId);
  const submittedAgentIds = opinions.map(o => o.agent_id);
  return requiredAgentIds.every(id => submittedAgentIds.includes(id));
}

// ============ Critiques ============

export async function getCritiques(proposalId: string) {
  const { data, error } = await supabase
    .from('critiques')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as Critique[];
}

export async function submitCritique(critique: {
  proposal_id: string;
  critic_agent_id: string;
  target_agent_id: string;
  concerns: string[];
  suggestions?: string[];
}) {
  const { data, error } = await supabase
    .from('critiques')
    .insert({
      ...critique,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as Critique;
}

export async function respondToCritique(
  id: string,
  agreesAfterConcerns: boolean,
  reasoning: string
) {
  const { data, error } = await supabase
    .from('critiques')
    .update({
      agrees_after_concerns: agreesAfterConcerns,
      agreement_reasoning: reasoning,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Critique;
}

// ============ Debate Rounds ============

export async function getDebateRounds(proposalId: string) {
  const { data, error } = await supabase
    .from('debate_rounds')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('round_number', { ascending: true })
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as DebateRound[];
}

export async function getLatestRoundNumber(proposalId: string) {
  const { data, error } = await supabase
    .from('debate_rounds')
    .select('round_number')
    .eq('proposal_id', proposalId)
    .order('round_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data?.round_number ?? 0;
}

export async function submitDebatePosition(position: {
  proposal_id: string;
  round_number: number;
  agent_id: string;
  position: string;
  reasoning: string;
  confidence: number;
}) {
  const { data, error } = await supabase
    .from('debate_rounds')
    .insert({
      ...position,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as DebateRound;
}

export async function startNewDebateRound(proposalId: string): Promise<number> {
  const currentRound = await getLatestRoundNumber(proposalId);
  const newRound = currentRound + 1;
  
  // Max 3 rounds
  if (newRound > 3) {
    await updateProposalStatus(proposalId, 'escalated', 'Auto-escalated after 3 debate rounds without consensus');
    throw new Error('Maximum debate rounds (3) reached. Proposal escalated to human review.');
  }
  
  // Update proposal status to debating if not already
  await updateProposalStatus(proposalId, 'debating');
  
  return newRound;
}

// ============ Sycophancy Flags ============

export async function getSycophancyFlags(proposalId: string) {
  const { data, error } = await supabase
    .from('sycophancy_flags')
    .select('*')
    .eq('proposal_id', proposalId)
    .order('detected_at', { ascending: false });
  
  if (error) throw error;
  return data as SycophancyFlag[];
}

export async function createSycophancyFlag(flag: {
  proposal_id: string;
  indicator_type: SycophancyFlag['indicator_type'];
  details?: Record<string, unknown>;
}) {
  const { data, error } = await supabase
    .from('sycophancy_flags')
    .insert({
      ...flag,
      detected_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as SycophancyFlag;
}

export async function reviewSycophancyFlag(
  id: string,
  reviewedBy: string,
  wasFalsePositive: boolean,
  resolutionNotes?: string
) {
  const { data, error } = await supabase
    .from('sycophancy_flags')
    .update({
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      was_false_positive: wasFalsePositive,
      resolution_notes: resolutionNotes,
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as SycophancyFlag;
}

export async function hasUnreviewedFlags(proposalId: string) {
  const { data, error } = await supabase
    .from('sycophancy_flags')
    .select('id')
    .eq('proposal_id', proposalId)
    .is('reviewed_at', null)
    .limit(1);
  
  if (error) throw error;
  return data.length > 0;
}

// ============ Aggregate Helpers ============

export async function getProposalWithDetails(id: string) {
  const [proposal, opinions, critiques, debateRounds, flags] = await Promise.all([
    getProposal(id),
    getOpinions(id),
    getCritiques(id),
    getDebateRounds(id),
    getSycophancyFlags(id),
  ]);
  
  return {
    proposal,
    opinions,
    critiques,
    debateRounds,
    flags,
    hasUnreviewedFlags: flags.some(f => !f.reviewed_at),
  };
}

export async function getEscalatedProposals() {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('status', 'escalated')
    .order('resolved_at', { ascending: false });
  
  if (error) throw error;
  return data as Proposal[];
}

export async function getFlaggedProposals() {
  // Get proposals with unreviewed sycophancy flags
  const { data, error } = await supabase
    .from('sycophancy_flags')
    .select('proposal_id')
    .is('reviewed_at', null);
  
  if (error) throw error;
  
  const proposalIds = [...new Set(data.map(f => f.proposal_id))];
  
  if (proposalIds.length === 0) return [];
  
  const { data: proposals, error: propError } = await supabase
    .from('proposals')
    .select('*')
    .in('id', proposalIds);
  
  if (propError) throw propError;
  return proposals as Proposal[];
}

// ============ Consensus Detection ============

export function checkConsensus(opinions: IndependentOpinion[]): {
  hasConsensus: boolean;
  result?: 'approved' | 'rejected';
  approveCount: number;
  rejectCount: number;
  abstainCount: number;
} {
  const approveCount = opinions.filter(o => o.opinion.vote === 'approve').length;
  const rejectCount = opinions.filter(o => o.opinion.vote === 'reject').length;
  const abstainCount = opinions.filter(o => o.opinion.vote === 'abstain').length;
  
  // All non-abstaining votes agree
  const votingCount = approveCount + rejectCount;
  if (votingCount === 0) {
    return { hasConsensus: false, approveCount, rejectCount, abstainCount };
  }
  
  if (approveCount === votingCount) {
    return { hasConsensus: true, result: 'approved', approveCount, rejectCount, abstainCount };
  }
  
  if (rejectCount === votingCount) {
    return { hasConsensus: true, result: 'rejected', approveCount, rejectCount, abstainCount };
  }
  
  return { hasConsensus: false, approveCount, rejectCount, abstainCount };
}
