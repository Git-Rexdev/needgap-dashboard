'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Search, SlidersHorizontal, Target, AlertTriangle, CircleCheck,
  TrendingUp, BarChart3, ChevronsUpDown, ThumbsUp, TriangleAlert,
  Star, MessageSquareQuote, Crosshair, Zap, ArrowRight
} from 'lucide-react';

function StarRating({ rating, max = 5 }) {
  return (
    <span className="star-rating">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={13}
          className={i < rating ? 'star-filled' : 'star-empty'}
          fill={i < rating ? 'currentColor' : 'none'}
          strokeWidth={i < rating ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

function formatTagLabel(tag) {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function Dashboard({ initialScoredData, initialInsightsData }) {
  const [selectedTag, setSelectedTag] = useState(initialScoredData.scored_needs[0]?.tag || '');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('opportunity_score');
  const [sortOrder, setSortOrder] = useState('desc');

  const allBrands = useMemo(() => {
    const brandsSet = new Set();
    initialScoredData.scored_needs.forEach(n => {
      n.top_affected_brands.forEach(b => brandsSet.add(b.brand));
    });
    return Array.from(brandsSet).sort();
  }, [initialScoredData]);

  const filteredNeeds = useMemo(() => {
    return initialScoredData.scored_needs.filter(need => {
      const matchesSearch = need.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        need.representative_reviews.some(r => r.review_text.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesBrand = selectedBrand === 'ALL' ||
        need.top_affected_brands.some(b => b.brand === selectedBrand);
      return matchesSearch && matchesBrand;
    }).sort((a, b) => {
      let valA, valB;
      if (sortField === 'opportunity_score') { valA = a.opportunity_score; valB = b.opportunity_score; }
      else if (sortField === 'frequency_pct') { valA = a.metrics.frequency_pct; valB = b.metrics.frequency_pct; }
      else if (sortField === 'avg_rating') { valA = a.metrics.avg_rating; valB = b.metrics.avg_rating; }
      else if (sortField === 'avg_helpful') { valA = a.metrics.avg_helpful_votes; valB = b.metrics.avg_helpful_votes; }
      else { valA = a.tag; valB = b.tag; }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
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

  const getScoreColor = (score) => {
    if (score >= 70) return 'var(--color-emerald)';
    if (score >= 55) return 'var(--color-indigo)';
    if (score >= 40) return 'var(--color-amber)';
    return 'var(--color-rose)';
  };

  const topRec = initialInsightsData.r_and_d_recommendation?.primary_recommendation;

  const BAR_COLORS = ['#7c83f7', '#5d64d4', '#4a50b0', '#3a3f8d', '#2d3170'];

  return (
    <div className="dashboard">

      {/* Header */}
      <header className="header">
        <div>
          <h1 className="header-title">Consumer Need-Gap Finder</h1>
          <p className="header-sub">
            Competitive intelligence across {initialScoredData.total_reviews_analyzed.toLocaleString()} verified product reviews from 15 Indian D2C brands
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-chip">
            <span className="stat-chip-label">Reviews Analyzed</span>
            <span className="stat-chip-value" style={{ color: 'var(--color-indigo)' }}>
              {initialScoredData.total_reviews_analyzed.toLocaleString()}
            </span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-label">Needs Identified</span>
            <span className="stat-chip-value" style={{ color: 'var(--color-emerald)' }}>
              {initialScoredData.scored_needs.length}
            </span>
          </div>
        </div>
      </header>

      {/* Recommendation Panel */}
      {topRec && (
        <section className="card rec-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="rec-badge">
              <Target size={12} /> Top R&D Opportunity
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Score: <strong style={{ color: 'var(--color-emerald)' }}>{topRec.opportunity_score}/100</strong>
            </span>
          </div>
          <h2 className="rec-title">{topRec.product_concept}</h2>
          <p className="rec-body">{topRec.rationale}</p>
          <div className="rec-details">
            <span className="rec-detail-item">
              <CircleCheck size={14} color="var(--color-emerald)" />
              <strong>Primary:</strong> {formatTagLabel(topRec.tag)}
            </span>
            <span className="rec-detail-item">
              <CircleCheck size={14} color="var(--color-indigo)" />
              <strong>Supporting:</strong> Ingredient Transparency
            </span>
            <span className="rec-detail-item">
              <AlertTriangle size={14} color="var(--color-amber)" />
              <strong>Severity:</strong> 2.07 / 5.0 avg rating
            </span>
          </div>
        </section>
      )}

      {/* Controls */}
      <div className="controls">
        <div className="controls-left">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search needs or review text..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" />
            <select
              className="filter-select"
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
            >
              <option value="ALL">All Brands ({allBrands.length})</option>
              {allBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
        <span className="results-count">
          {filteredNeeds.length} of {initialScoredData.scored_needs.length} needs
        </span>
      </div>

      {/* Main Grid */}
      <div className="main-grid">

        {/* Table */}
        <div className="card">
          <div className="table-header">
            <h3 className="table-title">
              <TrendingUp size={16} color="var(--color-indigo)" /> Ranked Unmet Needs
            </h3>
            <span className="table-hint">Select a row to inspect</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="needs-table">
              <thead>
                <tr>
                  <th>Need</th>
                  <th onClick={() => handleSort('opportunity_score')}>
                    <span className="th-inner">Score <ChevronsUpDown size={11} /></span>
                  </th>
                  <th onClick={() => handleSort('frequency_pct')}>
                    <span className="th-inner">Frequency <ChevronsUpDown size={11} /></span>
                  </th>
                  <th onClick={() => handleSort('avg_rating')}>
                    <span className="th-inner">Rating <ChevronsUpDown size={11} /></span>
                  </th>
                  <th onClick={() => handleSort('avg_helpful')}>
                    <span className="th-inner">Validation <ChevronsUpDown size={11} /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredNeeds.map((need, index) => {
                  const isSelected = selectedTag === need.tag;
                  const scoreColor = getScoreColor(need.opportunity_score);
                  return (
                    <tr
                      key={need.tag}
                      className={isSelected ? 'row-selected' : ''}
                      onClick={() => setSelectedTag(need.tag)}
                    >
                      <td>
                        <div className="tag-cell">
                          <span className="tag-rank">{index + 1}</span>
                          <div>
                            <div className="tag-name">{formatTagLabel(need.tag)}</div>
                            <div className="tag-mentions">{need.mention_count} mentions</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="score-bar-wrap">
                          <div className="score-bar-track">
                            <div className="score-bar-fill" style={{ width: `${need.opportunity_score}%`, background: scoreColor }} />
                          </div>
                          <span className="score-value" style={{ color: scoreColor }}>
                            {need.opportunity_score}
                          </span>
                        </div>
                      </td>
                      <td className="mono">{need.metrics.frequency_pct}%</td>
                      <td>
                        <StarRating rating={Math.round(need.metrics.avg_rating)} />
                        <span className="mono" style={{ marginLeft: '0.35rem', fontSize: '0.8rem', color: need.metrics.avg_rating <= 2.1 ? 'var(--color-rose)' : 'var(--text-secondary)' }}>
                          {need.metrics.avg_rating}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                          <ThumbsUp size={12} />
                          <span className="mono">{need.metrics.avg_helpful_votes}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="right-col">

          {/* Brand Impact Chart */}
          <div className="card chart-section">
            <h3 className="section-title">
              <BarChart3 size={16} color="var(--color-indigo)" />
              Brand Impact:
              <span className="section-title-accent">{formatTagLabel(activeNeedDetail.tag)}</span>
            </h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeNeedDetail.top_affected_brands} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="brand" stroke="var(--text-secondary)" fontSize={11} width={100} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem' }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={18}>
                    {activeNeedDetail.top_affected_brands.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index] || BAR_COLORS[BAR_COLORS.length - 1]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Insights */}
          <div className="card chart-section">
            <h3 className="section-title">
              <Crosshair size={16} color="var(--color-amber)" /> Pattern Insights
            </h3>

            {initialInsightsData.rare_but_severe_needs.map(item => (
              <div key={item.tag} className="insight-card insight-severe">
                <div className="insight-label">
                  <span style={{ color: 'var(--color-rose)' }}>
                    <TriangleAlert size={11} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                    Rare-but-Severe: {formatTagLabel(item.tag)}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.opportunity_score}</span>
                </div>
                <p className="insight-text">{item.plain_english_note}</p>
              </div>
            ))}

            <div className="insight-card insight-low">
              <div className="insight-label" style={{ color: 'var(--text-secondary)' }}>Deprioritized Needs</div>
              <p className="insight-text">
                {initialInsightsData.low_signal_deprioritized_needs.map(n => formatTagLabel(n.tag)).join(', ')} -- lower community validation suggests limited R&D impact.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Drill-Down Section */}
      <section className="card drilldown">
        <div className="drilldown-header">
          <div>
            <div className="drilldown-title">
              <span className="score-badge" style={{ background: getScoreColor(activeNeedDetail.opportunity_score) }}>
                {activeNeedDetail.opportunity_score}
              </span>
              {formatTagLabel(activeNeedDetail.tag)}
              <ArrowRight size={16} color="var(--text-muted)" />
              <span style={{ fontWeight: 400, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Detail View</span>
            </div>
            <p className="drilldown-sub">
              Top customer review excerpts and affected product breakdown
            </p>
          </div>

          <div className="metric-chips">
            <div className="metric-chip">
              <span className="metric-chip-label">Mentions</span>
              <span className="metric-chip-value" style={{ color: 'var(--text-primary)' }}>{activeNeedDetail.mention_count}</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Avg Rating</span>
              <span className="metric-chip-value" style={{ color: 'var(--color-rose)' }}>{activeNeedDetail.metrics.avg_rating}</span>
            </div>
            <div className="metric-chip">
              <span className="metric-chip-label">Helpful Votes</span>
              <span className="metric-chip-value" style={{ color: 'var(--color-emerald)' }}>{activeNeedDetail.metrics.avg_helpful_votes}</span>
            </div>
          </div>
        </div>

        <h4 className="excerpts-title">
          <MessageSquareQuote size={16} color="var(--text-secondary)" /> Representative Reviews
        </h4>

        <div className="review-grid">
          {activeNeedDetail.representative_reviews.map(review => (
            <div key={review.review_id} className="review-card">
              <div>
                <div className="review-card-head">
                  <span className="review-brand">{review.brand}</span>
                  <StarRating rating={review.rating} />
                </div>
                <span className="review-product">Product: {review.product}</span>
                <p className="review-text">&ldquo;{review.review_text}&rdquo;</p>
              </div>
              <div className="review-card-foot">
                <span className="review-id">{review.review_id}</span>
                <span className="review-votes">
                  <ThumbsUp size={12} /> {review.helpful_votes}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
