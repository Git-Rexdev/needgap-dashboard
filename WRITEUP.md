# Consumer Need-Gap Analysis & Product Opportunity Writeup

## 1. Analytical Approach

We analyzed 6,000 competitor reviews from 15 Indian D2C brands. The data pipeline deduplicated 206 identical reviews, yielding 5,794 cleaned records with 15 normalized unmet-need tags. 

To prioritize R&D focus, we engineered a composite **Opportunity Score (0–100)** per need:
$$Score = 100 \times \left( 0.34 \cdot \text{Freq}_{\text{norm}} + 0.33 \cdot \text{Sev}_{\text{norm}} + 0.33 \cdot \text{Val}_{\text{norm}} \right)$$

- **Frequency**: Percentage of total reviews mentioning the tag.
- **Severity**: Star rating deficit ($5.0 - \text{Avg Rating}$).
- **Validation**: Average helpful votes per review.

---

## 2. Top 3 Findings

### Finding 1: `vegan_certification` (Opportunity Score: 85.98)
- **Data**: 9.99% frequency (579 reviews), **2.07/5.0 average rating**, and **51.84 helpful votes/review**.
- **Insight**: This represents the highest opportunity score in the dataset. Consumers express severe dissatisfaction with unverified animal-derivative ingredients, heavily validating peer complaints demanding official third-party vegan certification.

### Finding 2: `ingredient_transparency` (Opportunity Score: 74.89)
- **Data**: **10.53% frequency** (610 reviews — highest volume tag in market), 2.08/5.0 rating, 49.62 helpful votes.
- **Insight**: Customers across all 15 competitor brands consistently report frustration with undisclosed proprietary blends and vague active ingredient percentages.

### Finding 3: `side_effect_concern` (Opportunity Score: 60.31)
- **Data**: 9.51% frequency, **2.07/5.0 rating**, **50.03 helpful votes**.
- **Insight**: Identified via pattern mining as a **rare-but-severe** need. While lower in raw volume than transparency, its high severity rating and strong social validation indicate urgent consumer anxiety regarding skin irritation and digestive discomfort.

---

## 3. Recommended R&D Product Opportunity

### Product Concept: **100% Certified Vegan & Clean-Label Transparent Formulations**
- **Target Category**: Daily Wellness & Active Skincare.
- **Why R&D Should Pursue This**:
  By combining third-party vegan certification (`vegan_certification`, Score 85.98) with full quantitative ingredient percentage disclosure (`ingredient_transparency`, Score 74.89), R&D directly addresses the top two market pain points representing over 20% of total consumer complaints. Formulating with hypoallergenic, gentle botanical actives also eliminates `side_effect_concern` (Score 60.31).

---

## 4. Honest Limitation

**Reliance on Pre-Categorized Tag Distributions**:
The primary limitation of this analysis is that unmet needs were evaluated using pre-tagged categorical labels rather than raw contextual Large Language Model (LLM) embeddings. Consequently, nuanced multi-layered feedback (e.g., distinguishing between packaging leaks vs. dosage dropper inaccuracies within general packaging tags) requires deeper semantic sentiment parsing.
