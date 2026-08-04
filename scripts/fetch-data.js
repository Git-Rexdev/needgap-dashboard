const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://mosaicfellowship.in/api/data/npd/reviews';
const LIMIT = 100;
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'raw_reviews.json');

async function fetchAllReviews() {
  console.log('Starting data fetch from Mosaic Fellowship API...');
  let allReviews = [];
  let page = 1;
  let hasMore = true;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  while (hasMore) {
    const url = `${BASE_URL}?page=${page}&limit=${LIMIT}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error status: ${response.status}`);
      }
      const data = await response.json();
      
      let reviews = [];
      if (Array.isArray(data)) {
        reviews = data;
      } else if (data && Array.isArray(data.reviews)) {
        reviews = data.reviews;
      } else if (data && Array.isArray(data.data)) {
        reviews = data.data;
      } else {
        console.warn(`Unexpected data structure at page ${page}:`, Object.keys(data));
        break;
      }

      console.log(`Page ${page}: fetched ${reviews.length} reviews`);

      if (reviews.length === 0) {
        hasMore = false;
      } else {
        allReviews.push(...reviews);
        if (reviews.length < LIMIT) {
          hasMore = false;
        } else {
          page++;
        }
      }
    } catch (err) {
      console.error(`Error fetching page ${page}:`, err.message);
      break;
    }
  }

  console.log(`\nFetch complete! Total reviews fetched: ${allReviews.length}`);

  // Write to data/raw_reviews.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allReviews, null, 2), 'utf-8');
  console.log(`Saved raw dataset to ${OUTPUT_FILE}`);

  // Log statistics
  const brandCounts = {};
  const productCounts = {};

  allReviews.forEach(r => {
    const brand = r.competitor_brand || 'Unknown';
    const product = r.product_reviewed || 'Unknown';
    brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    productCounts[product] = (productCounts[product] || 0) + 1;
  });

  console.log('\n--- Brand Breakdown ---');
  console.table(brandCounts);
  console.log(`Total unique brands: ${Object.keys(brandCounts).length}`);
  console.log(`Total unique products: ${Object.keys(productCounts).length}`);

  if (allReviews.length > 0) {
    console.log('\n--- Sample Record ---');
    console.log(JSON.stringify(allReviews[0], null, 2));

    console.log('\n--- Schema Field Names ---');
    console.log(Object.keys(allReviews[0]));
  }
}

fetchAllReviews();
