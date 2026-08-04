const fs = require('fs');
const path = require('path');

const RAW_FILE = path.join(__dirname, '..', 'data', 'raw_reviews.json');
const CLEAN_FILE = path.join(__dirname, '..', 'data', 'cleaned_reviews.json');

function cleanData() {
  console.log('Reading raw dataset from:', RAW_FILE);
  if (!fs.existsSync(RAW_FILE)) {
    console.error('Error: raw_reviews.json does not exist. Run scripts/fetch-data.js first.');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(RAW_FILE, 'utf-8'));
  const totalBefore = rawData.length;
  console.log(`Loaded ${totalBefore} raw reviews.`);

  const seenIds = new Set();
  const seenContentHash = new Set();
  
  const cleanedData = [];
  const droppedReasons = {
    missing_critical_field: 0,
    duplicate_review_id: 0,
    duplicate_content: 0
  };

  rawData.forEach((item, index) => {
    // 1. Critical Null/Undefined Checks
    if (!item || !item.review_id || item.rating === undefined || item.rating === null || !item.review_text) {
      droppedReasons.missing_critical_field++;
      return;
    }

    // 2. Duplicate Review ID Check
    const reviewId = String(item.review_id).trim();
    if (seenIds.has(reviewId)) {
      droppedReasons.duplicate_review_id++;
      return;
    }

    // 3. Duplicate Content Check (brand + product + review_text + rating)
    const brandRaw = (item.competitor_brand || '').trim();
    const productRaw = (item.product_reviewed || '').trim();
    const textRaw = (item.review_text || '').trim();
    const contentHash = `${brandRaw.toLowerCase()}|${productRaw.toLowerCase()}|${textRaw.toLowerCase()}|${item.rating}`;
    
    if (seenContentHash.has(contentHash)) {
      droppedReasons.duplicate_content++;
      return;
    }

    seenIds.add(reviewId);
    seenContentHash.add(contentHash);

    // 4. Brand Name Casing & Whitespace Normalization
    const brand = brandRaw.replace(/\s+/g, ' ');

    // 5. Category & Product Normalization
    const category = (item.competitor_category || 'Uncategorized').trim().replace(/\s+/g, ' ');
    const product = productRaw.replace(/\s+/g, ' ');

    // 6. Normalize detected_unmet_needs tag field into a clean array
    let tags = [];
    if (Array.isArray(item.detected_unmet_needs)) {
      tags = item.detected_unmet_needs;
    } else if (typeof item.detected_unmet_needs === 'string') {
      try {
        const parsed = JSON.parse(item.detected_unmet_needs);
        if (Array.isArray(parsed)) {
          tags = parsed;
        } else if (typeof parsed === 'string') {
          tags = [parsed];
        }
      } catch (e) {
        // Fallback: split by comma if string is not valid JSON
        tags = item.detected_unmet_needs.split(',').map(s => s.trim().replace(/^\[|\]$/g, '').replace(/^"|"$/g, ''));
      }
    }

    // Clean individual tags
    const normalizedTags = tags
      .map(t => typeof t === 'string' ? t.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_') : '')
      .filter(t => t.length > 0);

    // 7. Assemble Cleaned Item
    cleanedData.push({
      review_id: reviewId,
      competitor_brand: brand,
      competitor_category: category,
      product_reviewed: product,
      platform: (item.platform || 'Unknown').trim(),
      rating: Number(item.rating),
      review_date: item.review_date ? String(item.review_date).trim() : null,
      review_text: textRaw,
      detected_unmet_needs: Array.from(new Set(normalizedTags)), // dedupe tags per review
      helpful_votes: Number(item.helpful_votes) || 0,
      verified_purchase: item.verified_purchase === 1 || item.verified_purchase === true ? 1 : 0
    });
  });

  const totalAfter = cleanedData.length;
  const totalDropped = totalBefore - totalAfter;

  fs.writeFileSync(CLEAN_FILE, JSON.stringify(cleanedData, null, 2), 'utf-8');

  console.log('\n--- Cleaning Report ---');
  console.log(`Total reviews before: ${totalBefore}`);
  console.log(`Total reviews after:  ${totalAfter}`);
  console.log(`Total dropped:        ${totalDropped}`);
  console.log('Dropped Breakdown:', droppedReasons);

  // Tag statistics
  const tagFrequency = {};
  cleanedData.forEach(r => {
    r.detected_unmet_needs.forEach(tag => {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
    });
  });

  console.log(`\nTotal unique unmet need tags found: ${Object.keys(tagFrequency).length}`);
  console.table(tagFrequency);
}

cleanData();
