import { getScoredNeeds, getInsights } from '@/lib/getData';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const scoredData = getScoredNeeds();
  const insightsData = getInsights();

  return <Dashboard initialScoredData={scoredData} initialInsightsData={insightsData} />;
}
