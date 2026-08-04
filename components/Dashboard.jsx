'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, ScatterChart, Scatter, ZAxis
} from 'recharts';
import {
  Search, SlidersHorizontal, Target, AlertTriangle, CircleCheck,
  TrendingUp, BarChart3, ChevronsUpDown, ThumbsUp, TriangleAlert,
  Star, MessageSquareQuote, Crosshair, ArrowRight, Package,
  ShieldCheck, ShieldX, Layers, Link2, FileText, Users, Globe,
  ChevronDown, ChevronUp, Hash, Percent, Activity, Lightbulb, Info,
  ArrowDownRight, ArrowUpRight
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Utility helpers                                                    */
/* ------------------------------------------------------------------ */

function StarRating({ rating, max = 5, size = 13 }) {
  return (
    <span className="star-rating">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? 'star-filled' : 'star-empty'}
          fill={i < rating ? 'currentColor' : 'none'}
          strokeWidth={i < rating ? 0 : 1.5}
        />
      ))}
    </span>
  );
}

function formatTag(tag) {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getScoreColor(score) {
  if (score >= 70) return 'var(--color-emerald)';
  if (score >= 55) return 'var(--color-indigo)';
  if (score >= 40) return 'var(--color-amber)';
  return 'var(--color-rose)';
}

const DISCOVERY_ICONS = {
  pattern: Layers,
  correlation: Link2,
  anomaly: TriangleAlert,
  gap: ArrowDownRight
};

const BAR_PALETTE = ['#7c83f7', '#6366f1', '#5558d4', '#484bb8', '#3b3e9c'];

/* ------------------------------------------------------------------ */
/*  Section wrapper component                                          */
/* ------------------------------------------------------------------ */

function Section({ id, icon: Icon, iconColor, title, subtitle, children, className = '' }) {
  return (
    <section id={id} className={`card section ${className}`}>
      <div className="section-head">
        <div>
          <h2 className="section-title">
            {Icon && <Icon size={18} color={iconColor || 'var(--color-indigo)'} />}
            {title}
          </h2>
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible panel                                                  */
/* ------------------------------------------------------------------ */

function Collapsible({ title, icon: Icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="collapsible">
      <button className="collapsible-trigger" onClick={() => setOpen(!open)}>
        <span className="collapsible-trigger-left">
          {Icon && <Icon size={15} color="var(--text-secondary)" />}
          {title}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                     */
/* ------------------------------------------------------------------ */

export default function Dashboard({ initialScoredData, initialInsightsData }) {
  const [selectedTag, setSelectedTag] = useState(initialScoredData.scored_needs[0]?.tag || '');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('opportunity_score');
  const [sortOrder, setSortOrder] = useState('desc');

  const drilldownRef = useRef(null);

  const insights = initialInsightsData;
  const sm = insights.summary_metrics;

  // Derived lists
  const allBrands = useMemo(() => {
    const s = new Set();
    initialScoredData.scored_needs.forEach(n => n.top_affected_brands.forEach(b => s.add(b.brand)));
    return Array.from(s).sort();
  }, [initialScoredData]);

  const allCategories = useMemo(() => {
    return (insights.category_analysis || []).map(c => c.category).sort();
  }, [insights]);

  // Filter & sort
  const filteredNeeds = useMemo(() => {
    return initialScoredData.scored_needs.filter(need => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || need.tag.toLowerCase().includes(q) ||
        need.representative_reviews.some(r => r.review_text.toLowerCase().includes(q));
      const matchesBrand = selectedBrand === 'ALL' ||
        need.top_affected_brands.some(b => b.brand === selectedBrand);
      return matchesSearch && matchesBrand;
    }).sort((a, b) => {
      const fields = {
        opportunity_score: n => n.opportunity_score,
        frequency_pct: n => n.metrics.frequency_pct,
        avg_rating: n => n.metrics.avg_rating,
        avg_helpful: n => n.metrics.avg_helpful_votes
      };
      const fn = fields[sortField] || (n => n.opportunity_score);
      return sortOrder === 'asc' ? fn(a) - fn(b) : fn(b) - fn(a);
    });
  }, [initialScoredData, searchQuery, selectedBrand, sortField, sortOrder]);

  const activeNeed = useMemo(() => {
    return initialScoredData.scored_needs.find(n => n.tag === selectedTag) || initialScoredData.scored_needs[0];
  }, [initialScoredData, selectedTag]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  const selectNeed = (tag) => {
    setSelectedTag(tag);
    setTimeout(() => drilldownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const topRec = insights.r_and_d_recommendation?.primary_recommendation;

  // Co-occurrence for active need
  const activeCoOccur = useMemo(() => {
    return (insights.co_occurrence_matrix || [])
      .filter(c => c.tag_a === activeNeed.tag || c.tag_b === activeNeed.tag)
      .map(c => ({
        tag: c.tag_a === activeNeed.tag ? c.tag_b : c.tag_a,
        count: c.co_occurrence_count,
        pct: c.co_occurrence_pct
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [insights, activeNeed]);

  // Rating distribution for active need
  const activeRatingDist = useMemo(() => {
    const rd = (insights.rating_distribution || []).find(r => r.tag === activeNeed.tag);
    if (!rd) return [];
    return Object.entries(rd.distribution).map(([star, count]) => ({ star: `${star}`, count }));
  }, [insights, activeNeed]);

  return (
    <div className="dashboard">

      {/* ============================================================ */}
      {/*  HEADER                                                       */}
      {/* ============================================================ */}
      <header className="header">
        <div>
          <h1 className="header-title">Consumer Need-Gap Finder</h1>
          <p className="header-sub">
            Competitive intelligence from {sm.total_brands} Indian D2C brands, {sm.total_categories} categories, {sm.total_platforms} platforms
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-chip">
            <span className="stat-chip-label">Reviews</span>
            <span className="stat-chip-value" style={{ color: 'var(--color-indigo)' }}>{initialScoredData.total_reviews_analyzed.toLocaleString()}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-label">Needs Found</span>
            <span className="stat-chip-value" style={{ color: 'var(--color-emerald)' }}>{initialScoredData.scored_needs.length}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-label">Products</span>
            <span className="stat-chip-value" style={{ color: 'var(--color-sky)' }}>{sm.total_products}</span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-label">Verified</span>
            <span className="stat-chip-value" style={{ color: 'var(--color-amber)' }}>{sm.verified_purchase_pct}%</span>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/*  KEY DISCOVERIES                                              */}
      {/* ============================================================ */}
      {insights.key_discoveries && insights.key_discoveries.length > 0 && (
        <Section id="discoveries" icon={Lightbulb} iconColor="var(--color-amber)" title="Key Discoveries" subtitle="Non-obvious patterns surfaced from cross-dimensional analysis">
          <div className="discovery-grid">
            {insights.key_discoveries.map(d => {
              const DIcon = DISCOVERY_ICONS[d.discovery_type] || Info;
              return (
                <div key={d.id} className="discovery-card">
                  <div className="discovery-card-head">
                    <span className="discovery-type-badge" data-type={d.discovery_type}>
                      <DIcon size={11} /> {d.discovery_type}
                    </span>
                  </div>
                  <h4 className="discovery-card-title">{d.title}</h4>
                  <p className="discovery-card-finding">{d.finding}</p>
                  <p className="discovery-card-evidence">{d.evidence}</p>
                  <p className="discovery-card-implication">{d.implication}</p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ============================================================ */}
      {/*  R&D RECOMMENDATION                                          */}
      {/* ============================================================ */}
      {topRec && (
        <section className="card rec-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="rec-badge"><Target size={12} /> Top R&D Opportunity</span>
            <span className="rec-score-label">Score: <strong style={{ color: 'var(--color-emerald)' }}>{topRec.opportunity_score}/100</strong></span>
          </div>
          <h2 className="rec-title">{topRec.product_concept}</h2>
          <p className="rec-body">{topRec.rationale}</p>
          <div className="rec-details">
            <span className="rec-detail-item"><CircleCheck size={14} color="var(--color-emerald)" /> <strong>Primary:</strong> {formatTag(topRec.tag)}</span>
            <span className="rec-detail-item"><CircleCheck size={14} color="var(--color-indigo)" /> <strong>Supporting:</strong> Ingredient Transparency</span>
            <span className="rec-detail-item"><AlertTriangle size={14} color="var(--color-amber)" /> <strong>Severity:</strong> 2.07 / 5.0 avg rating</span>
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/*  METHODOLOGY                                                  */}
      {/* ============================================================ */}
      <Collapsible title="Scoring Methodology" icon={Info} defaultOpen={false}>
        <div className="methodology-content">
          <div className="methodology-formula">
            <span className="formula-label">Opportunity Score</span>
            <code className="formula-code">
              = w1 * Freq_norm + w2 * Severity_norm + w3 * Validation_norm
            </code>
          </div>
          <div className="methodology-grid">
            <div className="methodology-item">
              <div className="methodology-item-head">
                <Percent size={14} color="var(--color-indigo)" /> Frequency (w = {initialScoredData.weights.frequency})
              </div>
              <p>Percentage of total reviews mentioning this need. Min-max normalized across all tags.</p>
            </div>
            <div className="methodology-item">
              <div className="methodology-item-head">
                <Activity size={14} color="var(--color-rose)" /> Severity (w = {initialScoredData.weights.severity})
              </div>
              <p>5.0 minus avg star rating for reviews mentioning this need. Higher = more painful.</p>
            </div>
            <div className="methodology-item">
              <div className="methodology-item-head">
                <ThumbsUp size={14} color="var(--color-emerald)" /> Validation (w = {initialScoredData.weights.validation})
              </div>
              <p>Avg helpful votes on reviews mentioning this need. Higher = community agrees it matters.</p>
            </div>
          </div>
          <p className="methodology-note">
            All three components are min-max normalized to [0, 1] across the 15 need tags, then combined with configurable weights. Final score scaled to 0-100.
            Dataset: {initialScoredData.total_reviews_analyzed.toLocaleString()} reviews, {sm.verified_purchase_pct}% verified purchases, across {sm.total_platforms} platforms.
          </p>
        </div>
      </Collapsible>

      {/* ============================================================ */}
      {/*  CONTROLS                                                     */}
      {/* ============================================================ */}
      <div className="controls">
        <div className="controls-left">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input type="text" className="search-input" placeholder="Search needs or review text..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <SlidersHorizontal size={14} color="var(--text-muted)" />
            <select className="filter-select" value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)}>
              <option value="ALL">All Brands ({allBrands.length})</option>
              {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Package size={14} color="var(--text-muted)" />
            <select className="filter-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="ALL">All Categories ({allCategories.length})</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <span className="results-count">{filteredNeeds.length} of {initialScoredData.scored_needs.length} needs</span>
      </div>

      {/* ============================================================ */}
      {/*  MAIN GRID: TABLE + SIDE PANELS                               */}
      {/* ============================================================ */}
      <div className="main-grid">

        {/* ---- Ranked needs table ---- */}
        <div className="card">
          <div className="table-header">
            <h3 className="table-title"><TrendingUp size={16} color="var(--color-indigo)" /> Ranked Unmet Needs</h3>
            <span className="table-hint">Select a row to inspect</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="needs-table">
              <thead>
                <tr>
                  <th>Need</th>
                  <th onClick={() => handleSort('opportunity_score')}><span className="th-inner">Score <ChevronsUpDown size={11} /></span></th>
                  <th onClick={() => handleSort('frequency_pct')}><span className="th-inner">Frequency <ChevronsUpDown size={11} /></span></th>
                  <th onClick={() => handleSort('avg_rating')}><span className="th-inner">Rating <ChevronsUpDown size={11} /></span></th>
                  <th onClick={() => handleSort('avg_helpful')}><span className="th-inner">Validation <ChevronsUpDown size={11} /></span></th>
                </tr>
              </thead>
              <tbody>
                {filteredNeeds.map((need, index) => {
                  const isSelected = selectedTag === need.tag;
                  const sc = getScoreColor(need.opportunity_score);
                  return (
                    <tr key={need.tag} className={isSelected ? 'row-selected' : ''} onClick={() => selectNeed(need.tag)}>
                      <td>
                        <div className="tag-cell">
                          <span className="tag-rank">{index + 1}</span>
                          <div>
                            <div className="tag-name">{formatTag(need.tag)}</div>
                            <div className="tag-mentions">{need.mention_count} mentions</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="score-bar-wrap">
                          <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${need.opportunity_score}%`, background: sc }} /></div>
                          <span className="score-value" style={{ color: sc }}>{need.opportunity_score}</span>
                        </div>
                      </td>
                      <td className="mono">{need.metrics.frequency_pct}%</td>
                      <td>
                        <StarRating rating={Math.round(need.metrics.avg_rating)} />
                        <span className="mono" style={{ marginLeft: '0.3rem', fontSize: '0.78rem', color: need.metrics.avg_rating <= 2.1 ? 'var(--color-rose)' : 'var(--text-secondary)' }}>{need.metrics.avg_rating}</span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                          <ThumbsUp size={12} /><span className="mono">{need.metrics.avg_helpful_votes}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---- Right column ---- */}
        <div className="right-col">

          {/* Brand impact chart */}
          <div className="card chart-section">
            <h3 className="section-title"><BarChart3 size={16} color="var(--color-indigo)" /> Brand Impact: <span className="section-title-accent">{formatTag(activeNeed.tag)}</span></h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeNeed.top_affected_brands} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 5 }}>
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="brand" stroke="var(--text-secondary)" fontSize={11} width={100} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]} barSize={18}>
                    {activeNeed.top_affected_brands.map((_, i) => <Cell key={i} fill={BAR_PALETTE[i] || BAR_PALETTE[4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pattern insights */}
          <div className="card chart-section">
            <h3 className="section-title"><Crosshair size={16} color="var(--color-amber)" /> Pattern Insights</h3>
            {insights.rare_but_severe_needs.map(item => (
              <div key={item.tag} className="insight-card insight-severe">
                <div className="insight-label">
                  <span style={{ color: 'var(--color-rose)' }}><TriangleAlert size={11} style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} />Rare-but-Severe: {formatTag(item.tag)}</span>
                  <span className="insight-score">{item.opportunity_score}</span>
                </div>
                <p className="insight-text">{item.plain_english_note}</p>
              </div>
            ))}
            <div className="insight-card insight-low">
              <div className="insight-label" style={{ color: 'var(--text-secondary)' }}>Deprioritized Needs</div>
              <p className="insight-text">{insights.low_signal_deprioritized_needs.map(n => formatTag(n.tag)).join(', ')} -- lower community validation suggests limited R&D impact.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  CATEGORY & PLATFORM ANALYSIS                                 */}
      {/* ============================================================ */}
      <div className="analysis-grid-2col">
        {/* Category breakdown */}
        <Section id="categories" icon={Package} iconColor="var(--color-sky)" title="Category Breakdown" subtitle="Unmet need distribution by product category">
          <div className="mini-table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Reviews</th>
                  <th>Avg Rating</th>
                  <th>Top Need</th>
                </tr>
              </thead>
              <tbody>
                {(insights.category_analysis || []).sort((a, b) => b.total_reviews - a.total_reviews).map(cat => (
                  <tr key={cat.category}>
                    <td style={{ fontWeight: 600 }}>{cat.category}</td>
                    <td className="mono">{cat.total_reviews}</td>
                    <td>
                      <StarRating rating={Math.round(cat.avg_rating)} size={11} />
                      <span className="mono" style={{ marginLeft: '0.25rem', fontSize: '0.75rem' }}>{cat.avg_rating.toFixed(2)}</span>
                    </td>
                    <td><span className="mini-tag">{cat.top_3_needs[0]?.tag ? formatTag(cat.top_3_needs[0].tag) : '-'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Platform analysis */}
        <Section id="platforms" icon={Globe} iconColor="var(--color-emerald)" title="Platform Analysis" subtitle="Review patterns by source platform">
          <div className="mini-table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Reviews</th>
                  <th>Avg Rating</th>
                  <th>Avg Helpful</th>
                </tr>
              </thead>
              <tbody>
                {(insights.platform_analysis || []).sort((a, b) => b.total_reviews - a.total_reviews).map(p => (
                  <tr key={p.platform}>
                    <td style={{ fontWeight: 600 }}>{p.platform}</td>
                    <td className="mono">{p.total_reviews}</td>
                    <td>
                      <StarRating rating={Math.round(p.avg_rating)} size={11} />
                      <span className="mono" style={{ marginLeft: '0.25rem', fontSize: '0.75rem' }}>{p.avg_rating.toFixed(2)}</span>
                    </td>
                    <td className="mono">{p.avg_helpful_votes.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {/* ============================================================ */}
      {/*  CO-OCCURRENCE + VERIFIED PURCHASE                            */}
      {/* ============================================================ */}
      <div className="analysis-grid-2col">
        {/* Top co-occurring needs */}
        <Section id="cooccurrence" icon={Link2} iconColor="var(--color-indigo)" title="Need Co-occurrence" subtitle="Tags that appear together in the same reviews">
          <div className="mini-table-wrap">
            <table className="mini-table">
              <thead>
                <tr>
                  <th>Need A</th>
                  <th>Need B</th>
                  <th>Co-occurs</th>
                  <th>% of Reviews</th>
                </tr>
              </thead>
              <tbody>
                {(insights.co_occurrence_matrix || []).slice(0, 10).map((c, i) => (
                  <tr key={i}>
                    <td><span className="mini-tag">{formatTag(c.tag_a)}</span></td>
                    <td><span className="mini-tag">{formatTag(c.tag_b)}</span></td>
                    <td className="mono">{c.co_occurrence_count}</td>
                    <td className="mono">{c.co_occurrence_pct.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Verified purchase insights */}
        <Section id="verified" icon={ShieldCheck} iconColor="var(--color-emerald)" title="Verified Purchase Analysis" subtitle="Do actual buyers report different pain points?">
          {insights.verified_purchase_analysis && (
            <div className="verified-grid">
              <div className="verified-block">
                <div className="verified-block-head">
                  <ShieldCheck size={16} color="var(--color-emerald)" /> Verified Buyers
                </div>
                <div className="verified-stats">
                  <div><span className="verified-stat-label">Count</span><span className="verified-stat-val mono">{insights.verified_purchase_analysis.verified.count.toLocaleString()}</span></div>
                  <div><span className="verified-stat-label">Avg Rating</span><span className="verified-stat-val mono">{insights.verified_purchase_analysis.verified.avg_rating.toFixed(2)}</span></div>
                  <div><span className="verified-stat-label">Avg Helpful</span><span className="verified-stat-val mono">{insights.verified_purchase_analysis.verified.avg_helpful_votes.toFixed(1)}</span></div>
                </div>
                <div className="verified-needs">
                  {insights.verified_purchase_analysis.verified.top_needs.map(t => <span key={t} className="mini-tag">{formatTag(t)}</span>)}
                </div>
              </div>
              <div className="verified-block">
                <div className="verified-block-head">
                  <ShieldX size={16} color="var(--text-muted)" /> Unverified
                </div>
                <div className="verified-stats">
                  <div><span className="verified-stat-label">Count</span><span className="verified-stat-val mono">{insights.verified_purchase_analysis.unverified.count.toLocaleString()}</span></div>
                  <div><span className="verified-stat-label">Avg Rating</span><span className="verified-stat-val mono">{insights.verified_purchase_analysis.unverified.avg_rating.toFixed(2)}</span></div>
                  <div><span className="verified-stat-label">Avg Helpful</span><span className="verified-stat-val mono">{insights.verified_purchase_analysis.unverified.avg_helpful_votes.toFixed(1)}</span></div>
                </div>
                <div className="verified-needs">
                  {insights.verified_purchase_analysis.unverified.top_needs.map(t => <span key={t} className="mini-tag">{formatTag(t)}</span>)}
                </div>
              </div>
              <p className="verified-insight">{insights.verified_purchase_analysis.insight_note}</p>
            </div>
          )}
        </Section>
      </div>

      {/* ============================================================ */}
      {/*  DRILL-DOWN SECTION                                           */}
      {/* ============================================================ */}
      <section ref={drilldownRef} className="card drilldown">
        <div className="drilldown-header">
          <div>
            <div className="drilldown-title">
              <span className="score-badge" style={{ background: getScoreColor(activeNeed.opportunity_score) }}>{activeNeed.opportunity_score}</span>
              {formatTag(activeNeed.tag)}
              <ArrowRight size={16} color="var(--text-muted)" />
              <span style={{ fontWeight: 400, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Detail View</span>
            </div>
            <p className="drilldown-sub">Review excerpts, rating breakdown, and co-occurring needs</p>
          </div>
          <div className="metric-chips">
            <div className="metric-chip"><span className="metric-chip-label">Mentions</span><span className="metric-chip-value" style={{ color: 'var(--text-primary)' }}>{activeNeed.mention_count}</span></div>
            <div className="metric-chip"><span className="metric-chip-label">Avg Rating</span><span className="metric-chip-value" style={{ color: 'var(--color-rose)' }}>{activeNeed.metrics.avg_rating}</span></div>
            <div className="metric-chip"><span className="metric-chip-label">Helpful Votes</span><span className="metric-chip-value" style={{ color: 'var(--color-emerald)' }}>{activeNeed.metrics.avg_helpful_votes}</span></div>
            <div className="metric-chip"><span className="metric-chip-label">Frequency</span><span className="metric-chip-value" style={{ color: 'var(--color-indigo)' }}>{activeNeed.metrics.frequency_pct}%</span></div>
          </div>
        </div>

        {/* Rating distribution + co-occurrence mini-charts */}
        <div className="drilldown-charts">
          <div className="drilldown-chart-box">
            <h4 className="drilldown-chart-title"><Hash size={14} /> Rating Distribution</h4>
            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeRatingDist} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                  <XAxis dataKey="star" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]} barSize={28}>
                    {activeRatingDist.map((entry, i) => <Cell key={i} fill={parseInt(entry.star) <= 2 ? 'var(--color-rose)' : parseInt(entry.star) <= 3 ? 'var(--color-amber)' : 'var(--color-emerald)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="drilldown-chart-box">
            <h4 className="drilldown-chart-title"><Link2 size={14} /> Co-occurring Needs</h4>
            {activeCoOccur.length > 0 ? (
              <div className="cooccur-list">
                {activeCoOccur.map(c => (
                  <div key={c.tag} className="cooccur-item">
                    <span className="cooccur-tag">{formatTag(c.tag)}</span>
                    <div className="cooccur-bar-wrap">
                      <div className="cooccur-bar" style={{ width: `${(c.count / activeCoOccur[0].count) * 100}%` }} />
                    </div>
                    <span className="cooccur-count mono">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>No significant co-occurrences found.</p>
            )}
          </div>
        </div>

        {/* Review excerpts */}
        <h4 className="excerpts-title"><MessageSquareQuote size={16} color="var(--text-secondary)" /> Representative Reviews</h4>
        <div className="review-grid">
          {activeNeed.representative_reviews.map(review => (
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
                <span className="review-votes"><ThumbsUp size={12} /> {review.helpful_votes}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
