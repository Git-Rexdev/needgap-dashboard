const fs = require('fs');
const path = require('path');

// Configurable weights at top of file
const WEIGHTS = {
  frequency: 0.34,
  severity: 0.33,
  validation: 0.33
};

const CLEAN_FILE = path.join(__dirname, '..', 'data', 'cleaned_reviews.json');
const SCORED_FILE = path.join(__dirname, '..', 'data', 'scored_needs.json');

function computeOpportunityScores() {
  console.log('Loading cleaned reviews dataset...');
  const reviews = JSON.parse(fs.readFileSync(CLEAN_FILE, 'utf-8'));
  const totalReviews = reviews.length;

  console.log(`Loaded ${totalReviews} cleaned reviews.`);

  // Group data by unmet-need tag
  const tagData = {};

  reviews.forEach(r => {
    const tags = r.detected_unmet_needs || [];
    tags.forEach(tag => {
      if (!tagData[tag]) {
        tagData[tag] = {
          tag: tag,
          count: 0,
          ratings: [],
          helpfulVotes: [],
          reviews: [],
          brandCounts: {},
          productCounts: {}
        };
      }

      tagData[tag].count += 1;
      tagData[tag].ratings.push(r.rating);
      tagData[tag].helpfulVotes.push(r.helpful_votes);
      tagData[tag].reviews.push(r);

      const brand = r.competitor_brand;
      const product = r.product_reviewed;
      tagData[tag].brandCounts[brand] = (tagData[tag].brandCounts[brand] || 0) + 1;
      tagData[tag].productCounts[product] = (tagData[tag].productCounts[product] || 0) + 1;
    });
  });

  const tagList = Object.keys(tagData);
  console.log(`Found ${tagList.length} distinct unmet-need tags to score.`);

  // Calculate raw metrics per tag
  const rawMetrics = tagList.map(tag => {
    const data = tagData[tag];
    const rawFreq = data.count / totalReviews; // percentage of total reviews
    const avgRating = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length;
    const rawSeverity = 5.0 - avgRating; // lower rating = higher severity
    const rawValidation = data.helpfulVotes.reduce((a, b) => a + b, 0) / data.helpfulVotes.length; // avg helpful votes

    return {
      tag,
      count: data.count,
      rawFreq,
      avgRating,
      rawSeverity,
      rawValidation,
      data
    };
  });

  // Calculate min and max for normalization
  const minFreq = Math.min(...rawMetrics.map(m => m.rawFreq));
  const maxFreq = Math.max(...rawMetrics.map(m => m.rawFreq));

  const minSev = Math.min(...rawMetrics.map(m => m.rawSeverity));
  const maxSev = Math.max(...rawMetrics.map(m => m.rawSeverity));

  const minVal = Math.min(...rawMetrics.map(m => m.rawValidation));
  const maxVal = Math.max(...rawMetrics.map(m => m.rawValidation));

  // Compute normalized scores and combined Opportunity Score
  const scoredNeeds = rawMetrics.map(m => {
    const normFreq = maxFreq === minFreq ? 1.0 : (m.rawFreq - minFreq) / (maxFreq - minFreq);
    const normSev = maxSev === minSev ? 1.0 : (m.rawSeverity - minSev) / (maxSev - minSev);
    const normVal = maxVal === minVal ? 1.0 : (m.rawValidation - minVal) / (maxVal - minVal);

    const oppScoreRaw = (
      WEIGHTS.frequency * normFreq +
      WEIGHTS.severity * normSev +
      WEIGHTS.validation * normVal
    );

    // Scale to 0-100 for intuitive presentation
    const opportunityScore = Number((oppScoreRaw * 100).toFixed(2));

    // Sort top affected brands
    const topBrands = Object.entries(m.data.brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Sort top affected products
    const topProducts = Object.entries(m.data.productCounts)
      .map(([product, count]) => ({ product, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Extract top 3 representative review excerpts (highest helpful votes)
    const representativeReviews = [...m.data.reviews]
      .sort((a, b) => b.helpful_votes - a.helpful_votes)
      .slice(0, 3)
      .map(r => ({
        review_id: r.review_id,
        brand: r.competitor_brand,
        product: r.product_reviewed,
        rating: r.rating,
        helpful_votes: r.helpful_votes,
        review_text: r.review_text
      }));

    return {
      tag: m.tag,
      opportunity_score: opportunityScore,
      metrics: {
        frequency_pct: Number((m.rawFreq * 100).toFixed(2)),
        normalized_frequency: Number(normFreq.toFixed(4)),
        avg_rating: Number(m.avgRating.toFixed(2)),
        raw_severity: Number(m.rawSeverity.toFixed(2)),
        normalized_severity: Number(normSev.toFixed(4)),
        avg_helpful_votes: Number(m.rawValidation.toFixed(2)),
        normalized_validation: Number(normVal.toFixed(4))
      },
      mention_count: m.count,
      top_affected_brands: topBrands,
      top_affected_products: topProducts,
      representative_reviews: representativeReviews
    };
  });

  // Sort by opportunity_score descending
  scoredNeeds.sort((a, b) => b.opportunity_score - a.opportunity_score);

  const outputData = {
    weights: WEIGHTS,
    total_reviews_analyzed: totalReviews,
    scored_needs: scoredNeeds
  };

  fs.writeFileSync(SCORED_FILE, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`Saved scored needs dataset to ${SCORED_FILE}`);

  console.log('\n--- Top 10 Scored Needs ---');
  console.table(scoredNeeds.slice(0, 10).map((n, idx) => ({
    Rank: idx + 1,
    Tag: n.tag,
    'Opp Score': n.opportunity_score,
    'Freq %': `${n.metrics.frequency_pct}%`,
    'Avg Rating': n.metrics.avg_rating,
    'Avg Helpful': n.metrics.avg_helpful_votes
  })));
}

computeOpportunityScores();
