import { PredictionDashboard } from '@/components/PredictionDashboard';

export default function PredictionsPage() {
  return <PredictionDashboard />;
}

export const metadata = {
  title: 'Prediction Accuracy Dashboard | Clowd-Control',
  description: 'Track token usage prediction accuracy vs actual consumption',
};