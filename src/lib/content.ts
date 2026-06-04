import type { Article } from './types';

const articleFiles = import.meta.glob<Article>('../content/articles/*.json', {
  eager: true,
  import: 'default',
});

export function getAllArticles(): Article[] {
  return Object.values(articleFiles).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function getArticlesByCategory(category: string): Article[] {
  return getAllArticles().filter((a) => a.category === category);
}

export function getArticle(category: string, slug: string): Article | undefined {
  return getAllArticles().find((a) => a.category === category && a.slug === slug);
}

export function getAllCategories(): string[] {
  return [...new Set(getAllArticles().map((a) => a.category))];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Display headline with an accurate count prefix derived from the real number of
 * products, e.g. "Best Magazine Racks of 2026" → "13 Best Magazine Racks of 2026".
 * AI titles are stored number-free; the count always matches what's actually listed.
 * Leaves already-numbered titles untouched.
 */
export function articleHeadline(article: Article): string {
  const title = article.title.trim();
  const n = article.products.length;
  if (n < 2 || /^\d/.test(title)) return title;
  return `${n} ${title}`;
}

// Words that carry no topical signal for relatedness scoring.
const STOP_WORDS = new Set([
  'best', 'the', 'of', 'for', 'and', 'to', 'a', 'an', 'your', 'with', 'in',
  'on', 'top', 'review', 'reviews', 'guide', 'buying',
  '2024', '2025', '2026', '2027',
]);

function titleTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Build-time "related posts" (like YARPP, but no DB/runtime cost). Scores every
 * other article: same category is the strongest signal, then shared title
 * keywords, with recency as the tie-breaker. Always returns up to `limit`
 * articles for solid internal linking, falling back to recent ones if nothing
 * is strongly related.
 */
export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const baseTokens = new Set(titleTokens(article.title));
  return getAllArticles()
    .filter((a) => a.slug !== article.slug)
    .map((a) => {
      let score = a.category === article.category ? 10 : 0;
      for (const w of titleTokens(a.title)) if (baseTokens.has(w)) score += 2;
      return { a, score, updated: new Date(a.updatedAt).getTime() };
    })
    .sort((x, y) => y.score - x.score || y.updated - x.updated)
    .slice(0, limit)
    .map((s) => s.a);
}
