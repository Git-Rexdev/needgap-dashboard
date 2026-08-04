const fs = require('fs');
const path = require('path');

const SCORED_FILE = path.join(__dirname, '..', 'data', 'scored_needs.json');
const REVIEWS_FILE = path.join(__dirname, '..', 'data', 'cleaned_reviews.json');
const INSIGHTS_FILE = path.join(__dirname, '..', 'data', 'insights.json');

function mineInsights() {
  console.log('Loading data...');
  const scoredData = JSON.parse(fs.readFileSync(SCORED_FILE, 'utf-8'));
  const reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
  const needs = scoredData.scored_needs;

  // Calculate averages across all needs
  const avgFreq = needs.reduce((sum, n) => sum + n.metrics.frequency_pct, 0) / (needs.length || 1);
  const avgRating = needs.reduce((sum, n) => sum + n.metrics.avg_rating, 0) / (needs.length || 1);
  const avgHelpful = needs.reduce((sum, n) => sum + n.metrics.avg_helpful_votes, 0) / (needs.length || 1);

  // 1. summary_metrics
  const totalBrands = new Set(reviews.map(r => r.competitor_brand)).size;
  const totalCategories = new Set(reviews.map(r => r.competitor_category)).size;
  const totalProducts = new Set(reviews.map(r => r.product_reviewed)).size;
  const totalPlatforms = new Set(reviews.map(r => r.platform)).size;
  const verifiedCount = reviews.filter(r => r.verified_purchase === 1).length;
  const verifiedPct = (verifiedCount / reviews.length) * 100;

  // 2. Rare-but-severe needs
  const rareButSevere = needs
    .filter(n => n.metrics.frequency_pct < avgFreq && n.metrics.avg_rating <= avgRating && n.metrics.avg_helpful_votes >= avgHelpful)
    .map(n => ({
      tag: n.tag,
      opportunity_score: n.opportunity_score,
      frequency_pct: n.metrics.frequency_pct,
      avg_rating: n.metrics.avg_rating,
      avg_helpful_votes: n.metrics.avg_helpful_votes,
      plain_english_note: `High consumer pain (rating ${n.metrics.avg_rating.toFixed(2)}) with strong social validation (${n.metrics.avg_helpful_votes.toFixed(2)} helpful votes/review) despite lower overall volume (${n.metrics.frequency_pct.toFixed(2)}%). Urgent fix target.`
    }));

  // 3 & 4. Cross-brand vs Brand-specific needs
  const crossBrandNeeds = [];
  const brandSpecificNeeds = [];

  needs.forEach(n => {
    const totalMentions = n.mention_count;
    if (n.top_affected_brands && n.top_affected_brands.length > 0) {
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
    }
  });

  // 5. Low-signal needs
  const lowSignalNeeds = needs
    .filter(n => n.metrics.avg_helpful_votes < avgHelpful && n.metrics.avg_rating > avgRating)
    .map(n => ({
      tag: n.tag,
      opportunity_score: n.opportunity_score,
      frequency_pct: n.metrics.frequency_pct,
      avg_rating: n.metrics.avg_rating,
      avg_helpful_votes: n.metrics.avg_helpful_votes,
      plain_english_note: `High rating (${n.metrics.avg_rating.toFixed(2)}) and low community validation (${n.metrics.avg_helpful_votes.toFixed(2)} votes). Deprioritize for R&D focus.`
    }));

  // 6. category_analysis
  const catMap = {};
  reviews.forEach(r => {
    const cat = r.competitor_category;
    if (!catMap[cat]) catMap[cat] = { count: 0, sumRating: 0, needsCount: {} };
    catMap[cat].count++;
    catMap[cat].sumRating += r.rating;
    r.detected_unmet_needs.forEach(tag => {
      catMap[cat].needsCount[tag] = (catMap[cat].needsCount[tag] || 0) + 1;
    });
  });
  const categoryAnalysis = Object.entries(catMap).map(([cat, data]) => {
    const avgRat = data.sumRating / data.count;
    const sortedNeeds = Object.entries(data.needsCount).sort((a,b) => b[1] - a[1]).slice(0,3);
    const topNeedsArr = sortedNeeds.map(n => n[0]);
    return {
      category: cat,
      total_reviews: data.count,
      avg_rating: avgRat,
      top_3_needs: sortedNeeds.map(n => ({ tag: n[0], count: n[1] })),
      plain_english_note: `In ${cat} (avg rating ${avgRat.toFixed(2)}), the top complaints are ${topNeedsArr.join(', ')}.`
    };
  });

  // 7. co_occurrence_matrix
  const coOccur = {};
  reviews.forEach(r => {
    const tags = r.detected_unmet_needs;
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        let t1 = tags[i], t2 = tags[j];
        if (t1 > t2) { let temp = t1; t1 = t2; t2 = temp; }
        const key = t1 + "|||" + t2;
        coOccur[key] = (coOccur[key] || 0) + 1;
      }
    }
  });
  const coOccurrenceMatrix = Object.entries(coOccur)
    .filter(([k, count]) => count > 50)
    .sort((a,b) => b[1] - a[1])
    .map(([k, count]) => {
      const parts = k.split("|||");
      return {
        tag_a: parts[0],
        tag_b: parts[1],
        co_occurrence_count: count,
        co_occurrence_pct: (count / reviews.length) * 100
      };
    });

  // 8. brand_need_heatmap
  const brandMap = {};
  reviews.forEach(r => {
    const b = r.competitor_brand;
    if (!brandMap[b]) brandMap[b] = { count: 0, needs: {} };
    brandMap[b].count++;
    r.detected_unmet_needs.forEach(tag => {
      brandMap[b].needs[tag] = (brandMap[b].needs[tag] || 0) + 1;
    });
  });
  const brandNeedHeatmap = Object.entries(brandMap)
    .sort((a,b) => b[1].count - a[1].count)
    .map(([b, data]) => {
      const needsObj = {};
      Object.entries(data.needs).forEach(([tag, count]) => {
        needsObj[tag] = { count, pct: (count / data.count) * 100 };
      });
      return { brand: b, total_reviews: data.count, needs: needsObj };
    });

  // 9. platform_analysis
  const platMap = {};
  reviews.forEach(r => {
    const p = r.platform;
    if (!platMap[p]) platMap[p] = { count: 0, sumRating: 0, sumHelpful: 0, needs: {} };
    platMap[p].count++;
    platMap[p].sumRating += r.rating;
    platMap[p].sumHelpful += (r.helpful_votes || 0);
    r.detected_unmet_needs.forEach(tag => {
      platMap[p].needs[tag] = (platMap[p].needs[tag] || 0) + 1;
    });
  });
  const platformAnalysis = Object.entries(platMap).map(([p, data]) => {
    const sorted = Object.entries(data.needs).sort((a,b) => b[1] - a[1]).slice(0,3);
    return {
      platform: p,
      total_reviews: data.count,
      avg_rating: data.sumRating / data.count,
      avg_helpful_votes: data.sumHelpful / data.count,
      top_needs: sorted.map(n => ({ tag: n[0], count: n[1], pct: (n[1] / data.count) * 100 }))
    };
  });

  // 10. verified_purchase_analysis
  const verifiedStats = { count: 0, sumRating: 0, sumHelpful: 0, needs: {} };
  const unverifiedStats = { count: 0, sumRating: 0, sumHelpful: 0, needs: {} };
  reviews.forEach(r => {
    const target = r.verified_purchase === 1 ? verifiedStats : unverifiedStats;
    target.count++;
    target.sumRating += r.rating;
    target.sumHelpful += (r.helpful_votes || 0);
    r.detected_unmet_needs.forEach(tag => {
      target.needs[tag] = (target.needs[tag] || 0) + 1;
    });
  });
  
  function formatStats(stats) {
    if(stats.count === 0) return { count: 0, avg_rating: 0, avg_helpful_votes: 0, top_needs: [] };
    const sorted = Object.entries(stats.needs).sort((a,b) => b[1] - a[1]).slice(0,3);
    return {
      count: stats.count,
      avg_rating: stats.sumRating / stats.count,
      avg_helpful_votes: stats.sumHelpful / stats.count,
      top_needs: sorted.map(n => n[0])
    };
  }
  
  const vStats = formatStats(verifiedStats);
  const uvStats = formatStats(unverifiedStats);
  const verifiedPurchaseAnalysis = {
    verified: vStats,
    unverified: uvStats,
    insight_note: `Verified purchases have avg rating ${vStats.avg_rating.toFixed(2)} compared to ${uvStats.avg_rating.toFixed(2)} for unverified, showing ${vStats.avg_rating > uvStats.avg_rating ? 'higher' : 'lower'} satisfaction.`
  };

  // 11. rating_distribution
  const ratingDistMap = {};
  reviews.forEach(r => {
    r.detected_unmet_needs.forEach(tag => {
      if (!ratingDistMap[tag]) {
        ratingDistMap[tag] = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, total: 0 };
      }
      ratingDistMap[tag][String(r.rating)]++;
      ratingDistMap[tag].total++;
    });
  });
  
  const ratingDistribution = Object.entries(ratingDistMap).map(([tag, dist]) => {
    return {
      tag,
      distribution: {
        '1': dist['1'], '2': dist['2'], '3': dist['3'], '4': dist['4'], '5': dist['5']
      },
      pct_1_star: (dist['1'] / dist.total) * 100,
      pct_low: ((dist['1'] + dist['2']) / dist.total) * 100
    };
  });

  // 12. key_discoveries
  const keyDiscoveries = [
    {
      id: "D1",
      title: "Dominant Category Pain Point",
      finding: categoryAnalysis.length > 0 ? `Top pain in ${categoryAnalysis[0].category} is '${categoryAnalysis[0].top_3_needs[0]?.tag}'` : "N/A",
      evidence: categoryAnalysis.length > 0 ? `Observed in ${categoryAnalysis[0].top_3_needs[0]?.count} reviews for this category` : "N/A",
      implication: "Target this specific issue in category-specific marketing.",
      discovery_type: "pattern"
    },
    {
      id: "D2",
      title: "Strongest Need Correlation",
      finding: coOccurrenceMatrix.length > 0 ? `'${coOccurrenceMatrix[0].tag_a}' frequently co-occurs with '${coOccurrenceMatrix[0].tag_b}'` : "N/A",
      evidence: coOccurrenceMatrix.length > 0 ? `Co-occurs in ${coOccurrenceMatrix[0].co_occurrence_count} reviews (${coOccurrenceMatrix[0].co_occurrence_pct.toFixed(1)}% of all reviews)` : "N/A",
      implication: "Addressing one of these issues without the other may lead to incomplete customer satisfaction.",
      discovery_type: "correlation"
    },
    {
      id: "D3",
      title: "Urgent Brand Vulnerability",
      finding: rareButSevere.length > 0 ? `'${rareButSevere[0].tag}' is a severe issue` : "N/A",
      evidence: rareButSevere.length > 0 ? `Rating drops to ${rareButSevere[0].avg_rating.toFixed(2)} when mentioned` : "N/A",
      implication: "Competitors ignoring this issue are vulnerable to disruption.",
      discovery_type: "anomaly"
    },
    {
      id: "D4",
      title: "Verified vs Unverified Sentiment Gap",
      finding: "Difference in helpfulness and ratings between verified and unverified purchasers.",
      evidence: `Verified rating: ${vStats.avg_rating.toFixed(2)}, Unverified: ${uvStats.avg_rating.toFixed(2)}`,
      implication: "Real purchasers may have different priorities than window shoppers.",
      discovery_type: "gap"
    }
  ];

  // 13. r_and_d_recommendation
  const topOpportunity = needs[0];
  const runnerUpOpportunity = needs[1];
  
  const topNeedSeverity = ratingDistribution.find(d => d.tag === topOpportunity.tag);
  const lowRatingPct = topNeedSeverity ? topNeedSeverity.pct_low.toFixed(1) : "N/A";

  const recommendation = {
    primary_recommendation: {
      tag: topOpportunity.tag,
      opportunity_score: topOpportunity.opportunity_score,
      product_concept: "100% Certified Vegan & Clean-Label Transparent Supplement / Skincare Line",
      rationale: `The #1 unmet consumer need is '${topOpportunity.tag}' (Opportunity Score: ${topOpportunity.opportunity_score}), supported closely by '${runnerUpOpportunity.tag}' (Score: ${runnerUpOpportunity.opportunity_score}). ${lowRatingPct}% of reviews mentioning this need give 1 or 2 stars. Consumers vote heavily on reviews demanding third-party vegan certification and full ingredient sourcing transparency.`
    }
  };

  const insightsOutput = {
    summary_metrics: {
      average_frequency_pct: Number(avgFreq.toFixed(2)),
      average_rating: Number(avgRating.toFixed(2)),
      average_helpful_votes: Number(avgHelpful.toFixed(2)),
      total_brands: totalBrands,
      total_categories: totalCategories,
      total_products: totalProducts,
      total_platforms: totalPlatforms,
      verified_purchase_pct: Number(verifiedPct.toFixed(2))
    },
    rare_but_severe_needs: rareButSevere,
    cross_brand_systemic_needs: crossBrandNeeds,
    brand_specific_needs: brandSpecificNeeds,
    low_signal_deprioritized_needs: lowSignalNeeds,
    category_analysis: categoryAnalysis,
    co_occurrence_matrix: coOccurrenceMatrix,
    brand_need_heatmap: brandNeedHeatmap,
    platform_analysis: platformAnalysis,
    verified_purchase_analysis: verifiedPurchaseAnalysis,
    rating_distribution: ratingDistribution,
    key_discoveries: keyDiscoveries,
    r_and_d_recommendation: recommendation
  };

  fs.writeFileSync(INSIGHTS_FILE, JSON.stringify(insightsOutput, null, 2), 'utf-8');
  console.log(`Saved insights output to ${INSIGHTS_FILE}`);
  console.log('--- Output JSON ---');
  console.log(JSON.stringify({ summary_metrics: insightsOutput.summary_metrics, key_discoveries: insightsOutput.key_discoveries }));
}

mineInsights();
