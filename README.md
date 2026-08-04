# Consumer Need-Gap Finder — D2C R&D Analytics Dashboard

A competitive intelligence dashboard analyzing **6,000 competitor product reviews** across **15 Indian D2C Brands** (Mamaearth, WOW Skin Science, Minimalist, HealthKart, etc.) to identify high-value unmet consumer needs and recommend R&D product opportunities.

## 🚀 Live App & Repository
- **GitHub Repository**: [Git-Rexdev/needgap-dashboard](https://github.com/Git-Rexdev/needgap-dashboard)
- **Deployment**: Next.js App Router deployed on Vercel (Publicly accessible, no authentication required).

---

## 💡 Methodology Summary
The platform ingests paginated review datasets via Node.js scripts, normalizes unmet-need tags, and dedupes review entries down to 5,794 unique records. It computes a composite **Opportunity Score (0–100)** per need by combining normalized **Frequency** (% of reviews mentioning the need), **Severity** (5.0 - Average Star Rating), and **Validation** (Average helpful votes per review).

---

## 🛠️ Data Pipeline & Scripts

Run the entire end-to-end data pipeline with a single command:
```bash
npm run data-pipeline
```

Individual pipeline phases:
- `npm run fetch-data`: Pages through Mosaic API and saves raw dataset to `data/raw_reviews.json`.
- `npm run clean-data`: Deduplicates records and normalizes brand names & tag arrays to `data/cleaned_reviews.json`.
- `npm run score-data`: Calculates Opportunity Scores and outputs to `data/scored_needs.json`.
- `npm run mine-insights`: Surfaces rare-but-severe and cross-brand patterns to `data/insights.json`.

---

## 💻 Local Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Git-Rexdev/needgap-dashboard.git
   cd needgap-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 📊 Core Features & UI Components
- **Ranked Unmet-Needs Table**: Interactive sorting by Opportunity Score, Frequency %, Avg Rating, and Helpful Votes.
- **Top R&D Recommendation Panel**: Highlights the #1 market opportunity based on combined opportunity scoring.
- **Brand Impact Breakdown**: Dynamic Recharts visual bar charts showing top affected competitor brands for selected needs.
- **Review Drill-Down View**: Inspect representative customer review excerpts sorted by community helpful votes.
- **Brand & Category Filters**: Multi-brand filtering across 15 Indian D2C competitors.

---

## 📄 Documentation
- Detailed analytical methodology, top findings, and product opportunity: [`WRITEUP.md`](./WRITEUP.md)
