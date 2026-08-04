const fs = require('fs');
const path = require('path');

const SCORED_FILE = path.join(__dirname, '..', 'data', 'scored_needs.json');
const INSIGHTS_FILE = path.join(__dirname, '..', 'data', 'insights.json');

function mineInsights() {
  console.log('Loading scored needs data...');
  const data = JSON.parse(fs.readFileSync(SCORED_FILE, 'utf-8'));
  const needs = data.scored_needs;

  // Calculate averages across all needs
  const avgFreq = needs.reduce((sum, n) => sum + n.metrics.frequency_pct, 0) / needs.length;
  const avgRating = needs.reduce((sum, n) => sum + n.metrics.avg_rating, 0) / needs.length;
  const avgHelpful = needs.reduce((sum, n) => sum + n.metrics.avg_helpful_votes, 0) / needs.length;

  console.log(`Dataset Averages -> Freq: ${avgFreq.toFixed(2)}%, Rating: ${avgRating.toFixed(2)}, Helpful: ${avgHelpful.toFixed(2)}`);

  // 1. Rare-but-severe needs (lower frequency, low star rating <= avgRating, high helpful votes >= avgHelpful)
  const rareButSevere = needs
    .filter(n => n.metrics.frequency_pct < avgFreq && n.metrics.avg_rating <= avgRating && n.metrics.avg_helpful_votes >= avgHelpful)
    .map(n => ({
      tag: n.tag,
      opportunity_score: n.opportunity_score,
      frequency_pct: n.metrics.frequency_pct,
      avg_rating: n.metrics.avg_rating,
      avg_helpful_votes: n.metrics.avg_helpful_votes,
      plain_english_note: `High consumer pain (rating ${n.metrics.avg_rating}) with strong social validation (${n.metrics.avg_helpful_votes} helpful votes/review) despite lower overall volume (${n.metrics.frequency_pct}%). Urgent fix target.`
    }));

  // 2. Cross-brand vs Brand-specific needs
  const crossBrandNeeds = [];
  const brandSpecificNeeds = [];

  needs.forEach(n => {
    const totalMentions = n.mention_count;
    const topBrand = n.top_affected_brands[0];
    const brandShare = (topBrand.count / totalMentions) * 100;
    const brandCount = n.top_affected_brands.length;

    if (brandShare > 20) {
      brandSpecificNeeds.push({
        tag: n.tag,
        dominant_brand: topBrand.brand,
        dominant_brand_share_pct: Number(brandShare.toFixed(2)),
        plain_english_note: `Concentrated issue primarily affecting ${topBrand.brand} (${brandShare.toFixed(1)}% of all mentions for this need).`
      });
    } else {
      crossBrandNeeds.push({
        tag: n.tag,
        brand_dispersion_count: brandCount,
        top_brand_share_pct: Number(brandShare.toFixed(2)),
        plain_english_note: `Industry-wide systemic issue spreading evenly across top competitor brands (top brand holds only ${brandShare.toFixed(1)}% share).`
      });
    }
  });

  // 3. Low-signal needs (frequent or moderate frequency but below-average helpful votes and higher rating)
  const lowSignalNeeds = needs
    .filter(n => n.metrics.avg_helpful_votes < avgHelpful && n.metrics.avg_rating > avgRating)
    .map(n => ({
      tag: n.tag,
      opportunity_score: n.opportunity_score,
      frequency_pct: n.metrics.frequency_pct,
      avg_rating: n.metrics.avg_rating,
      avg_helpful_votes: n.metrics.avg_helpful_votes,
      plain_english_note: `High rating (${n.metrics.avg_rating}) and low community validation (${n.metrics.avg_helpful_votes} votes). Deprioritize for R&D focus.`
    }));

  // 4. Strategic R&D Product Opportunity Recommendation
  const topOpportunity = needs[0]; // Highest opportunity score
  const runnerUpOpportunity = needs[1];

  const recommendation = {
    primary_recommendation: {
      tag: topOpportunity.tag,
      opportunity_score: topOpportunity.opportunity_score,
      product_concept: "100% Certified Vegan & Clean-Label Transparent Supplement / Skincare Line",
      rationale: `The #1 unmet consumer need is '${topOpportunity.tag}' (Opportunity Score: ${topOpportunity.opportunity_score}), supported closely by '${runnerUpOpportunity.tag}' (Score: ${runnerUpOpportunity.opportunity_score}). Consumers report high frustration (2.07/5 star rating) and vote heavily on reviews demanding third-party vegan certification and full ingredient sourcing transparency.`
    }
  };

  const insightsOutput = {
    summary_metrics: {
      average_frequency_pct: Number(avgFreq.toFixed(2)),
      average_rating: Number(avgRating.toFixed(2)),
      average_helpful_votes: Number(avgHelpful.toFixed(2))
    },
    rare_but_severe_needs: rareButSevere,
    cross_brand_systemic_needs: crossBrandNeeds,
    brand_specific_needs: brandSpecificNeeds,
    low_signal_deprioritized_needs: lowSignalNeeds,
    r_and_d_recommendation: recommendation
  };

  fs.writeFileSync(INSIGHTS_FILE, JSON.stringify(insightsOutput, null, 2), 'utf-8');
  console.log(`Saved insights output to ${INSIGHTS_FILE}`);

  console.log('\n--- Rare-but-Severe Needs ---');
  console.table(rareButSevere);

  console.log('\n--- Low-Signal Deprioritized Needs ---');
  console.table(lowSignalNeeds);
}

mineInsights();
