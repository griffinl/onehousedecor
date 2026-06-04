#!/usr/bin/env tsx
/**
 * gen-og.ts — Generate a branded default Open Graph image (1200x630)
 * from site.config.ts (name, tagline, theme colors). Fully automatic.
 *
 * Output: public/og-default.png  (used as social-share fallback in SEOHead)
 *
 * Usage:  npm run gen-og
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import * as path from "node:path";
import { siteConfig } from "../site.config";

const { name, tagline, theme } = siteConfig;

const initials = name
  .split(/\s+/)
  .slice(0, 2)
  .map((w) => w[0]?.toUpperCase() ?? "")
  .join("");

const bg     = theme.colorBgDark ?? "#1A2D24";
const accent = theme.colorAccent ?? "#B8732E";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${bg}"/>
  <rect x="500" y="120" width="200" height="200" rx="40" fill="${accent}"/>
  <text x="600" y="255" font-family="Georgia, serif" font-size="110" font-weight="700" text-anchor="middle" fill="#ffffff">${esc(initials)}</text>
  <text x="600" y="430" font-family="Georgia, serif" font-size="64" font-weight="700" text-anchor="middle" fill="#ffffff">${esc(name)}</text>
  <text x="600" y="495" font-family="Arial, sans-serif" font-size="30" text-anchor="middle" fill="#C9D4CD">${esc(tagline)}</text>
</svg>`;

const out = path.resolve(import.meta.dirname, "..", "public", "og-default.png");
const buf = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync(out, buf);
console.log(`✓ og-default.png generated (${(buf.length / 1024).toFixed(0)} KB)`);
