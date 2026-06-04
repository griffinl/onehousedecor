export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  rank: number;
  asin: string;
  title: string;        // full Amazon title
  label: string;        // short product name
  badge?: string;       // quick_picks label e.g. "Best Multi-Pocket Organizer"
  oneLiner?: string;    // quick_picks one_liner — one-sentence pitch
  tier?: string;        // top_pick | runner_up | also_consider
  bestFor?: string;     // comparison_table best_for
  usageNote?: string;   // usage tip / note
  image: string;
  rating: number;       // 1–5
  reviewCount: number;
  price: string;        // e.g. "$24.99"
  affiliateUrl: string;
  specs: ProductSpec[];
  pros: string[];
  cons: string[];
  verdict: string;      // one-sentence bottom line
  review: string;       // HTML prose for the review body
}

export interface BuyingGuideSection {
  heading: string;
  body: string;         // HTML
}

export interface FaqItem {
  question: string;
  answer: string;       // HTML
}

export interface Article {
  slug: string;
  title: string;
  category: string;         // slug, e.g. "living-room"
  categoryLabel: string;    // display name, e.g. "Living Room"
  publishedAt: string;      // ISO date YYYY-MM-DD
  updatedAt: string;
  excerpt: string;
  featuredImage?: string;
  author: string;
  metaDescription?: string;
  intro: string;            // HTML
  products: Product[];
  buyingGuide?: BuyingGuideSection[];
  faq?: FaqItem[];
}
