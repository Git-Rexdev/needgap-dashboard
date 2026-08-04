import { getScoredNeeds, getInsights } from '@/lib/getData';

export default function Home() {
  const scoredData = getScoredNeeds();
  const insightsData = getInsights();

  return (
    <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Consumer Need-Gap Finder
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Analyzing {scoredData.total_reviews_analyzed} competitor reviews across Indian D2C market
        </p>
      </header>

      <section className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Precomputed Data Verification</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Loaded <strong>{scoredData.scored_needs.length}</strong> scored unmet needs and <strong>{insightsData.rare_but_severe_needs.length}</strong> rare-but-severe insights statically at build time.
        </p>
      </section>
    </main>
  );
}
