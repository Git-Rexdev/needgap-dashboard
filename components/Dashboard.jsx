'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import {
  Search, Filter, Sparkles, AlertTriangle, CheckCircle2, TrendingUp,
  Award, Layers, ArrowUpDown, ChevronRight, X, ThumbsUp, ShieldAlert,
  HelpCircle, Lightbulb, ExternalLink
} from 'lucide-react';

export default function Dashboard({ initialScoredData, initialInsightsData }) {
  const [selectedTag, setSelectedTag] = useState(initialScoredData.scored_needs[0]?.tag || '');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('opportunity_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  // Extract list of all unique brands across needs
  const allBrands = useMemo(() => {
    const brandsSet = new Set();
    initialScoredData.scored_needs.forEach(n => {
      n.top_affected_brands.forEach(b => brandsSet.add(b.brand));
    });
    return Array.from(brandsSet).sort();
  }, [initialScoredData]);

  // Filter and sort needs
  const filteredNeeds = useMemo(() => {
    return initialScoredData.scored_needs.filter(need => {
      // Search filter
      const matchesSearch = need.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        need.representative_reviews.some(r => r.review_text.toLowerCase().includes(searchQuery.toLowerCase()));

      // Brand filter
      const matchesBrand = selectedBrand === 'ALL' ||
        need.top_affected_brands.some(b => b.brand === selectedBrand);

      return matchesSearch && matchesBrand;
    }).sort((a, b) => {
      let valA, valB;
      if (sortField === 'opportunity_score') {
        valA = a.opportunity_score;
        valB = b.opportunity_score;
      } else if (sortField === 'frequency_pct') {
        valA = a.metrics.frequency_pct;
        valB = b.metrics.frequency_pct;
      } else if (sortField === 'avg_rating') {
        valA = a.metrics.avg_rating;
        valB = b.metrics.avg_rating;
      } else if (sortField === 'avg_helpful') {
        valA = a.metrics.avg_helpful_votes;
        valB = b.metrics.avg_helpful_votes;
      } else {
        valA = a.tag;
        valB = b.tag;
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [initialScoredData, searchQuery, selectedBrand, sortField, sortOrder]);

  const activeNeedDetail = useMemo(() => {
    return initialScoredData.scored_needs.find(n => n.tag === selectedTag) || initialScoredData.scored_needs[0];
  }, [initialScoredData, selectedTag]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 70) return '#10b981'; // High Opportunity Green
    if (score >= 55) return '#6366f1'; // Medium Indigo
    if (score >= 40) return '#f59e0b'; // Warning Amber
    return '#ef4444'; // Low Red
  };

  const topRec = initialInsightsData.r_and_d_recommendation?.primary_recommendation;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Bar */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'linear-gradient(135deg, #ffffff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Consumer Need-Gap Finder
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
            Competitive Intelligence Dashboard &bull; Analyzing <strong>5,794</strong> verified reviews across <strong>15 Indian D2C Brands</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analyzed Reviews</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#6366f1' }}>5,794</span>
          </div>
          <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Identified Needs</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#10b981' }}>15 Tags</span>
          </div>
        </div>
      </header>

      {/* R&D Top Recommendation Panel */}
      {topRec && (
        <section className="glass-card" style={{ padding: '1.75rem', borderLeft: '6px solid #10b981', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, pointerEvents: 'none' }}>
            <Award size={180} color="#10b981" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Award size={14} /> #1 R&D PRODUCT OPPORTUNITY RECOMMENDATION
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Opportunity Score: <strong style={{ color: '#10b981' }}>{topRec.opportunity_score} / 100</strong>
            </span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fff' }}>
            {topRec.product_concept}
          </h2>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', maxWidth: '1100px' }}>
            {topRec.rationale}
          </p>

          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#10b981" /> <strong>Core Need:</strong> {topRec.tag} (85.98 Score)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="#6366f1" /> <strong>Supporting Need:</strong> ingredient_transparency (74.89 Score)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <AlertTriangle size={16} color="#f59e0b" /> <strong>Target Severity:</strong> 2.07 / 5.0 Avg Customer Rating
            </div>
          </div>
        </section>
      )}

      {/* Control Bar: Filters & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search unmet needs or review text..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              style={{
                padding: '0.65rem 1rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Competitor Brands (15)</option>
              {allBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredNeeds.length}</strong> of {initialScoredData.scored_needs.length} needs
        </span>
      </div>

      {/* Main Grid: Table & Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        
        {/* Left Column: Ranked Needs Table */}
        <div style={{ gridColumn: 'span 7' }} className="glass-card">
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#6366f1" /> Ranked Unmet Needs
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click row to view drill-down</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Rank & Need Tag</th>
                  <th style={{ padding: '0.85rem 1rem', cursor: 'pointer' }} onClick={() => handleSort('opportunity_score')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Opp Score <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem', cursor: 'pointer' }} onClick={() => handleSort('frequency_pct')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Freq % <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem', cursor: 'pointer' }} onClick={() => handleSort('avg_rating')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Avg Rating <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th style={{ padding: '0.85rem 1rem', cursor: 'pointer' }} onClick={() => handleSort('avg_helpful')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Helpful Votes <ArrowUpDown size={12} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredNeeds.map((need, index) => {
                  const isSelected = selectedTag === need.tag;
                  const badgeColor = getScoreBadgeColor(need.opportunity_score);

                  return (
                    <tr
                      key={need.tag}
                      onClick={() => {
                        setSelectedTag(need.tag);
                        setIsDrillDownOpen(true);
                      }}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', minWidth: '20px' }}>
                            #{index + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: isSelected ? '#6366f1' : 'var(--text-primary)' }}>
                              {need.tag}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {need.mention_count} mentions
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '6px', overflow: 'hidden', minWidth: '50px' }}>
                            <div style={{ width: `${need.opportunity_score}%`, background: badgeColor, height: '100%', borderRadius: '4px' }} />
                          </div>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: badgeColor }}>
                            {need.opportunity_score}
                          </span>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>
                        {need.metrics.frequency_pct}%
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: need.metrics.avg_rating <= 2.1 ? '#ef4444' : 'var(--text-primary)' }}>
                        {need.metrics.avg_rating} ⭐
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {need.metrics.avg_helpful_votes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Visual Charts & Insights */}
        <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Brand Impact Chart */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#10b981" /> Top Affected Brands: <span style={{ color: '#6366f1' }}>{activeNeedDetail.tag}</span>
            </h3>

            <div style={{ width: '100%', height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeNeedDetail.top_affected_brands} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis type="category" dataKey="brand" stroke="var(--text-secondary)" fontSize={12} width={110} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {activeNeedDetail.top_affected_brands.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mining Insight Cards */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="#f59e0b" /> Key Pattern Mining Findings
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {initialInsightsData.rare_but_severe_needs.map(item => (
                <div key={item.tag} style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.85rem' }}>RARE-BUT-SEVERE: {item.tag}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score: {item.opportunity_score}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {item.plain_english_note}
                  </p>
                </div>
              ))}

              <div style={{ background: 'rgba(107, 114, 128, 0.1)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  DEPRIORITIZED LOW-SIGNAL NEEDS
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {initialInsightsData.low_signal_deprioritized_needs.map(n => n.tag).join(', ')} feature lower community validation. R&D should focus resources elsewhere.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Need Drill-Down Section / Drawer */}
      <section className="glass-card" style={{ padding: '1.75rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: getScoreBadgeColor(activeNeedDetail.opportunity_score), color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                Score: {activeNeedDetail.opportunity_score}
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                Drill-Down Analysis: <span style={{ color: '#6366f1' }}>{activeNeedDetail.tag}</span>
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
              Representative customer reviews and product breakdown for <strong>{activeNeedDetail.tag}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mentions</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeNeedDetail.mention_count}</span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Rating</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>{activeNeedDetail.metrics.avg_rating} ⭐</span>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Helpful Votes</span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{activeNeedDetail.metrics.avg_helpful_votes}</span>
            </div>
          </div>
        </div>

        {/* Excerpt Quotes Grid */}
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Representative Customer Review Excerpts (Top Helpful Votes)
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {activeNeedDetail.representative_reviews.map(review => (
            <div key={review.review_id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#6366f1' }}>{review.brand}</span>
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem' }}>
                  Product: {review.product}
                </span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{review.review_text}"
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', pt: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{review.review_id}</span>
                <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ThumbsUp size={14} /> {review.helpful_votes} helpful votes
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
