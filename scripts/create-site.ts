#!/usr/bin/env tsx
/**
 * create-site.ts — One-command niche site factory
 *
 * 1. AI generates site.config.ts  (requires ANTHROPIC_API_KEY)
 * 2. Copies template to output dir
 * 3. Creates GitHub repo           (requires GITHUB_TOKEN)
 * 4. Pushes code
 * 5. Creates Vercel project + env  (requires VERCEL_TOKEN)
 * 6. Creates Deploy Hook
 * 7. Prints AmazonScrapling config values
 *
 * Usage:
 *   npm run create-site -- --domain onehousedecor.com --niche "home decor"
 *   npm run create-site -- --domain onehousedecor.com --niche "home decor" --style wirecutter --output ~/sites/onehousedecor
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "node:fs";
import * as path from "node:path";
import * as cp from "node:child_process";
import * as readline from "node:readline";

// ─── CLI ──────────────────────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const map: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--") && args[i + 1] && !args[i + 1].startsWith("--")) {
      map[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }
  return map;
}

async function ask(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(q, (a) => { rl.close(); resolve(a.trim()); });
  });
}

// ─── Logging ──────────────────────────────────────────────────────────────────

const step = (msg: string) => console.log(`\n→ ${msg}`);
const ok   = (msg: string) => console.log(`  ✓ ${msg}`);
const warn = (msg: string) => console.log(`  ⚠ ${msg}`);

// ─── Shell ────────────────────────────────────────────────────────────────────

function run(cmd: string, cwd: string): string {
  return cp.execSync(cmd, { cwd, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
}

// ─── File copy ────────────────────────────────────────────────────────────────

const COPY_EXCLUDE = new Set(["node_modules", "dist", ".git", ".astro", "package-lock.json"]);

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (COPY_EXCLUDE.has(entry)) continue;
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    if (fs.statSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// ─── GitHub API ───────────────────────────────────────────────────────────────

async function ghRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`https://api.github.com${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const data = (await res.json()) as T & { message?: string };
  if (!res.ok) {
    throw new Error(`GitHub ${endpoint} → ${res.status}: ${data.message ?? JSON.stringify(data)}`);
  }
  return data;
}

async function getGithubLogin(token: string): Promise<string> {
  const user = await ghRequest<{ login: string }>("/user", token);
  return user.login;
}

async function createGithubRepo(
  repoName: string,
  description: string,
  token: string
): Promise<{ full_name: string; html_url: string }> {
  return ghRequest("/user/repos", token, {
    method: "POST",
    body: JSON.stringify({
      name: repoName,
      description,
      private: false,
      auto_init: false,
    }),
  });
}

// ─── Vercel API ───────────────────────────────────────────────────────────────

async function vercelRequest<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {},
  teamId?: string
): Promise<T> {
  const url = new URL(`https://api.vercel.com${endpoint}`);
  if (teamId) url.searchParams.set("teamId", teamId);

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new Error(
      `Vercel ${endpoint} → ${res.status}: ${data.error?.message ?? JSON.stringify(data)}`
    );
  }
  return data;
}

async function createVercelProject(
  name: string,
  githubRepo: string,
  siteUrl: string,
  token: string,
  teamId?: string
): Promise<{ id: string; name: string }> {
  return vercelRequest(
    "/v10/projects",
    token,
    {
      method: "POST",
      body: JSON.stringify({
        name,
        framework: "astro",
        gitRepository: { type: "github", repo: githubRepo },
        buildCommand: "npm run build",
        outputDirectory: "dist",
        installCommand: "npm install",
        environmentVariables: [
          { key: "SITE_URL", value: siteUrl, type: "plain", target: ["production"] },
        ],
      }),
    },
    teamId
  );
}

async function createDeployHook(
  projectId: string,
  token: string,
  teamId?: string
): Promise<string> {
  const result = await vercelRequest<{ hook: { url: string } }>(
    `/v1/projects/${projectId}/deploy-hooks`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ name: "AmazonScrapling", ref: "main" }),
    },
    teamId
  );
  return result.hook.url;
}

// ─── AI config generation ─────────────────────────────────────────────────────

async function generateConfig(
  domain: string,
  niche: string,
  description: string,
  style: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const client = new Anthropic({ apiKey });

  process.stdout.write("  Calling Claude...");

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 2048,
    system: `You are a web design expert who creates product review blog configurations.
Return ONLY valid JSON — no markdown code fences, no explanation.`,
    messages: [
      {
        role: "user",
        content: `Generate a site configuration JSON for an Amazon affiliate product review blog.

Niche: ${niche}
Domain: ${domain}
Description: ${description}
Visual style: ${style}

Design rules:
- Colors must suit the niche emotionally
- layout.home: "grid" for lifestyle/decor, "hero" for editorial-heavy niches
- layout.article: "wirecutter" for tech/appliances/tools, "default" for lifestyle/decor/baby
- fontHeading + fontBody = valid Google Fonts CSS names
- Generate 5 nav/category items
- amazonTag = first word of domain (no TLD) + "-20"
- 2-paragraph about page body

Return this exact JSON shape (no extra keys):
{
  "name": "...",
  "tagline": "...",
  "description": "...",
  "domain": "${domain}",
  "niche": "slug",
  "amazonTag": "...",
  "theme": {
    "colorPrimary":"#hex","colorPrimaryLight":"#hex","colorAccent":"#hex",
    "colorBg":"#hex","colorBgSubtle":"#hex","colorBgDark":"#hex",
    "colorText":"#hex","colorTextMuted":"#hex","colorBorder":"#hex",
    "colorPro":"#hex","colorCon":"#hex","colorStar":"#hex",
    "fontHeading":"'...',...","fontBody":"'...',..."
  },
  "layout": { "home": "grid", "article": "default" },
  "nav": [{ "label": "...", "href": "/slug/" }],
  "categories": [{ "slug": "...", "label": "..." }],
  "social": {},
  "pages": {
    "about": { "headline": "...", "body": "para1.\\n\\npara2." },
    "contact": { "email": "hello@${domain}", "body": "..." },
    "privacy": { "lastUpdated": "${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}" },
    "disclaimer": { "lastUpdated": "${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}" }
  }
}`,
      },
    ],
  });

  console.log(" done.");

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function writeConfigFile(config: Record<string, unknown>, outputDir: string): void {
  const date = new Date().toISOString().split("T")[0];
  const ts = `// Generated by create-site on ${date}
export const siteConfig = ${JSON.stringify(config, null, 2)} as const;

export type SiteConfig = typeof siteConfig;
export type Category = typeof siteConfig.categories[number];
`;
  fs.writeFileSync(path.join(outputDir, "site.config.ts"), ts, "utf-8");

  // Update robots.txt domain
  const robotsPath = path.join(outputDir, "public", "robots.txt");
  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, "utf-8");
    fs.writeFileSync(
      robotsPath,
      robots.replace(
        /Sitemap: https?:\/\/[^\n]+/,
        `Sitemap: https://${config.domain as string}/sitemap-index.xml`
      ),
      "utf-8"
    );
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();

  const GITHUB_TOKEN   = process.env.GITHUB_TOKEN;
  const VERCEL_TOKEN   = process.env.VERCEL_TOKEN;
  const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;

  if (!GITHUB_TOKEN)  throw new Error("GITHUB_TOKEN env var required");
  if (!VERCEL_TOKEN)  throw new Error("VERCEL_TOKEN env var required");

  const domain      = args.domain      ?? await ask("Domain (e.g. onehousedecor.com): ");
  const niche       = args.niche       ?? await ask("Niche (e.g. 'home decor'): ");
  const description = args.description ?? await ask("Brief description: ");
  const style       = args.style       ?? await ask("Style (default / wirecutter / magazine): ");
  const vercelTeam  = args["vercel-team"];

  const repoSlug   = domain.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-]/gi, "-");
  const templateDir = path.resolve(import.meta.dirname, "..");
  const outputDir   = args.output ?? path.resolve(templateDir, "..", repoSlug);

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Creating: ${domain}
  Output:   ${outputDir}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  // ── 1. GitHub user ────────────────────────────────────────────────────────
  step("Verifying GitHub token...");
  const githubUser = await getGithubLogin(GITHUB_TOKEN);
  ok(`Logged in as ${githubUser}`);

  // ── 2. Copy template ──────────────────────────────────────────────────────
  step("Copying template...");
  if (fs.existsSync(outputDir)) {
    warn(`${outputDir} already exists — skipping copy`);
  } else {
    copyDir(templateDir, outputDir);
    // Install dependencies in the new dir
    run("npm install --silent", outputDir);
    ok(`Template copied to ${outputDir}`);
  }

  // ── 3. Generate site.config.ts ────────────────────────────────────────────
  step("Generating site config...");
  if (ANTHROPIC_KEY) {
    const config = await generateConfig(domain, niche, description, style, ANTHROPIC_KEY);
    writeConfigFile(config, outputDir);
    ok(`site.config.ts generated (layout.article: ${(config.layout as Record<string,string>)?.article})`);
  } else {
    warn("ANTHROPIC_API_KEY not set — skipping AI config, using template defaults");
    warn("Run 'npm run gen-site' in the output dir to generate a custom config later");
  }

  // ── 4. Create GitHub repo ─────────────────────────────────────────────────
  step(`Creating GitHub repo ${githubUser}/${repoSlug}...`);
  let repo: { full_name: string; html_url: string };
  try {
    repo = await createGithubRepo(repoSlug, `${niche} product review blog`, GITHUB_TOKEN);
    ok(`Created: ${repo.html_url}`);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("422") || msg.includes("already exists")) {
      repo = { full_name: `${githubUser}/${repoSlug}`, html_url: `https://github.com/${githubUser}/${repoSlug}` };
      warn(`Repo already exists, using: ${repo.html_url}`);
    } else {
      throw err;
    }
  }

  // ── 5. Push to GitHub ─────────────────────────────────────────────────────
  step("Pushing code to GitHub...");
  const gitDir = path.join(outputDir, ".git");
  if (!fs.existsSync(gitDir)) {
    run("git init -b main", outputDir);
  }
  run("git add .", outputDir);
  try {
    run(`git commit -m "Initial commit"`, outputDir);
  } catch {
    warn("Nothing to commit (already committed)");
  }
  const remoteUrl = `https://${GITHUB_TOKEN}@github.com/${repo.full_name}.git`;
  try {
    run(`git remote add origin ${remoteUrl}`, outputDir);
  } catch {
    run(`git remote set-url origin ${remoteUrl}`, outputDir);
  }
  run("git push -u origin main --force", outputDir);
  ok("Pushed to GitHub");

  // ── 6. Create Vercel project ──────────────────────────────────────────────
  step("Creating Vercel project...");
  let projectId: string;
  let projectName: string;
  try {
    const project = await createVercelProject(
      repoSlug,
      repo.full_name,
      `https://${domain}`,
      VERCEL_TOKEN,
      vercelTeam
    );
    projectId   = project.id;
    projectName = project.name;
    ok(`Project created: ${projectName} (${projectId})`);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("409") || msg.toLowerCase().includes("already exists")) {
      warn("Vercel project already exists — fetching existing project");
      // Fetch existing project
      const existing = await vercelRequest<{ id: string; name: string }>(
        `/v10/projects/${repoSlug}`,
        VERCEL_TOKEN,
        {},
        vercelTeam
      );
      projectId   = existing.id;
      projectName = existing.name;
      ok(`Using existing project: ${projectName}`);
    } else {
      throw err;
    }
  }

  // ── 7. Create deploy hook ─────────────────────────────────────────────────
  step("Creating Vercel Deploy Hook...");
  const hookUrl = await createDeployHook(projectId, VERCEL_TOKEN, vercelTeam);
  ok("Deploy hook created");

  // ── 8. Summary ────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅  Site ready!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  GitHub:          https://github.com/${repo.full_name}
  Vercel preview:  https://${repoSlug}.vercel.app

  → Paste these into AmazonScrapling Blog settings:

    url:               https://${domain}
    staticSiteRepo:    ${repo.full_name}
    staticSiteBranch:  main
    vercelDeployHook:  ${hookUrl}

  → Then add your custom domain in Vercel:
    vercel.com/${repoSlug} → Settings → Domains → Add ${domain}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("\n✗", err.message);
  process.exit(1);
});
