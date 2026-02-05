'use client';

import { useEffect, useState } from 'react';
import { Task, Agent, supabase, getAgents } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PredictionData {
  task_id: string;
  task_title: string;
  estimated_tokens: number;
  actual_tokens: number;
  accuracy: number;
  agent_name: string;
  completed_at: string;
}

interface AgentAccuracy {
  agent_name: string;
  tasks_count: number;
  avg_accuracy: number;
  total_estimated: number;
  total_actual: number;
}

export function PredictionDashboard() {
  const [predictionData, setPredictionData] = useState<PredictionData[]>([]);
  const [agentAccuracies, setAgentAccuracies] = useState<AgentAccuracy[]>([]);
  const [overallAccuracy, setOverallAccuracy] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch agents first
        const agentsData = await getAgents();
        setAgents(agentsData);

        // Fetch tasks with both estimated and actual tokens
        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .not('estimated_tokens', 'is', null)
          .gt('tokens_consumed', 0)
          .eq('status', 'done')
          .order('completed_at', { ascending: false });

        if (error) throw error;

        // Process prediction data
        const predictions: PredictionData[] = tasks.map((task: Task) => {
          const estimated = task.estimated_tokens || 0;
          const actual = task.tokens_consumed;
          const accuracy = estimated > 0 ? Math.max(0, 100 - Math.abs((estimated - actual) / estimated) * 100) : 0;
          const agent = agentsData.find(a => a.id === task.assigned_to);

          return {
            task_id: task.id,
            task_title: task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title,
            estimated_tokens: estimated,
            actual_tokens: actual,
            accuracy: Math.round(accuracy),
            agent_name: agent ? agent.display_name : 'Unknown',
            completed_at: task.completed_at || ''
          };
        });

        setPredictionData(predictions);

        // Calculate agent accuracies
        const agentStats = new Map<string, {
          count: number;
          totalAccuracy: number;
          totalEstimated: number;
          totalActual: number;
        }>();

        predictions.forEach(pred => {
          const existing = agentStats.get(pred.agent_name) || {
            count: 0,
            totalAccuracy: 0,
            totalEstimated: 0,
            totalActual: 0
          };

          existing.count += 1;
          existing.totalAccuracy += pred.accuracy;
          existing.totalEstimated += pred.estimated_tokens;
          existing.totalActual += pred.actual_tokens;

          agentStats.set(pred.agent_name, existing);
        });

        const agentAccuracyData: AgentAccuracy[] = Array.from(agentStats.entries()).map(([name, stats]) => ({
          agent_name: name,
          tasks_count: stats.count,
          avg_accuracy: Math.round(stats.totalAccuracy / stats.count),
          total_estimated: stats.totalEstimated,
          total_actual: stats.totalActual
        })).sort((a, b) => b.avg_accuracy - a.avg_accuracy);

        setAgentAccuracies(agentAccuracyData);

        // Calculate overall accuracy
        if (predictions.length > 0) {
          const totalAccuracy = predictions.reduce((sum, pred) => sum + pred.accuracy, 0);
          setOverallAccuracy(Math.round(totalAccuracy / predictions.length));
        }

      } catch (error) {
        console.error('Error fetching prediction data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-xl text-zinc-600 dark:text-zinc-400">Loading prediction data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                📊 Prediction Accuracy Dashboard
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                Track token usage prediction accuracy vs actual consumption
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-500">
                {predictionData.length} completed tasks with predictions
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl font-bold text-blue-600">
              {overallAccuracy}%
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Overall Accuracy</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl font-bold text-green-600">
              {predictionData.length}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Tasks Analyzed</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl font-bold text-purple-600">
              {agentAccuracies.length}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Agents with Data</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <div className="text-2xl font-bold text-amber-600">
              {predictionData.reduce((sum, p) => sum + p.actual_tokens, 0).toLocaleString()}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">Total Tokens Used</div>
          </div>
        </div>

        {predictionData.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500 dark:text-zinc-400">No prediction data available yet.</div>
            <div className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Complete some tasks with estimated token usage to see accuracy metrics.
            </div>
          </div>
        ) : (
          <>
            {/* Predictions vs Actuals Chart */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                Token Usage: Predicted vs Actual (Last 20 Tasks)
              </h2>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={predictionData.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="task_title" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="estimated_tokens" fill="#3b82f6" name="Estimated Tokens" />
                    <Bar dataKey="actual_tokens" fill="#10b981" name="Actual Tokens" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Accuracy Trend */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-8">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                Prediction Accuracy Trend
              </h2>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={predictionData.slice(0, 20)}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="task_title" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#f59e0b" 
                      strokeWidth={3}
                      dot={{ fill: '#f59e0b', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Agent Breakdown */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                Agent Prediction Accuracy
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentAccuracies.map((agent) => (
                  <div
                    key={agent.agent_name}
                    className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {agent.agent_name}
                      </h3>
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          agent.avg_accuracy >= 80 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                            : agent.avg_accuracy >= 60
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                        }`}
                      >
                        {agent.avg_accuracy}%
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                      <div>Tasks: {agent.tasks_count}</div>
                      <div>Est: {agent.total_estimated.toLocaleString()}</div>
                      <div>Actual: {agent.total_actual.toLocaleString()}</div>
                      <div>
                        Diff: {agent.total_estimated > agent.total_actual ? '+' : ''}{(agent.total_estimated - agent.total_actual).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}