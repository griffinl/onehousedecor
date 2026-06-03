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
