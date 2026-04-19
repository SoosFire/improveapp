// Fetches Unsplash cover images for courses.
// Usage: node scripts/fetch-unsplash-images.mjs [--all | course-id ...]
//
// Reads UNSPLASH_ACCESS_KEY from ~/.claude/.env (not committed).
// Saves images to courses/images/{id}.jpg and attribution info to
// courses/attributions.json. Paces requests to stay under the 50/hour
// demo rate limit.

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

// ---------- env ----------
const envPath = path.join(os.homedir(), ".claude", ".env");
const envContent = await fs.readFile(envPath, "utf8");
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
}
const ACCESS_KEY = env.UNSPLASH_ACCESS_KEY;
if (!ACCESS_KEY) {
  console.error("UNSPLASH_ACCESS_KEY missing from " + envPath);
  process.exit(1);
}

// ---------- args ----------
const args = process.argv.slice(2);
const runAll = args.includes("--all");
const explicitIds = args.filter((a) => !a.startsWith("--"));

// ---------- helpers ----------
const UNSPLASH = "https://api.unsplash.com";
const HEADERS = {
  Authorization: `Client-ID ${ACCESS_KEY}`,
  "Accept-Version": "v1",
};

async function searchPhoto(query) {
  const url = `${UNSPLASH}/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=5&orientation=squarish&content_filter=high`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    throw new Error(`Unsplash search failed ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.results?.[0] ?? null;
}

async function downloadTo(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

async function trackDownload(downloadLocationUrl) {
  // Unsplash Guideline: ping download_location when a user actually
  // downloads/uses the image. https://unsplash.com/documentation#triggering-a-download
  await fetch(downloadLocationUrl, { headers: HEADERS });
}

function buildQueries(course) {
  // Try progressively broader queries until we get a hit.
  const tags = course.card.tags ?? [];
  const queries = [];
  if (tags.length >= 2) queries.push(tags.slice(0, 3).join(" "));
  if (tags.length >= 1) queries.push(tags[0]);
  if (course.card.subcategories?.[0]) queries.push(course.card.subcategories[0]);
  // Strip leading "The "/"Why "/"How " etc from title for a cleaner keyword search.
  const titleKeywords = course.card.title
    .replace(/^(The|A|An|Why|How|What|When|Where|Who) /i, "")
    .replace(/[:?'!,.]+/g, "")
    .split(" ")
    .slice(0, 3)
    .join(" ");
  queries.push(titleKeywords);
  return [...new Set(queries)]; // dedupe
}

// ---------- main ----------
const manifestPath = path.join(root, "courses", "manifest.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

let targetIds;
if (runAll) {
  targetIds = manifest.courses.map((c) => c.id);
} else if (explicitIds.length > 0) {
  targetIds = explicitIds;
} else {
  console.error("Usage: node fetch-unsplash-images.mjs [--all | course-id ...]");
  process.exit(1);
}

const imagesDir = path.join(root, "courses", "images");
await fs.mkdir(imagesDir, { recursive: true });

const attributionPath = path.join(root, "courses", "attributions.json");
let attributions = {};
try {
  attributions = JSON.parse(await fs.readFile(attributionPath, "utf8"));
} catch {
  attributions = {};
}

const PAUSE_MS = 1500; // ~2400/hour theoretical max, but API returns 429 early; stay gentle
let ok = 0;
let skipped = 0;
let failed = 0;

for (const id of targetIds) {
  const destPath = path.join(imagesDir, `${id}.jpg`);
  try {
    await fs.access(destPath);
    if (!runAll) {
      console.log(`[${id}] already exists, overwriting`);
    } else {
      skipped++;
      continue;
    }
  } catch {
    // not yet downloaded
  }

  const coursePath = path.join(root, "courses", "content", `${id}.json`);
  let course;
  try {
    course = JSON.parse(await fs.readFile(coursePath, "utf8"));
  } catch (err) {
    console.error(`[${id}] course file not found`);
    failed++;
    continue;
  }

  const queries = buildQueries(course);
  let photo = null;
  let usedQuery = null;
  process.stdout.write(`[${id}] `);

  try {
    for (const q of queries) {
      photo = await searchPhoto(q);
      if (photo) {
        usedQuery = q;
        break;
      }
      await new Promise((r) => setTimeout(r, 400)); // small pause between fallbacks
    }
    if (!photo) {
      console.log(`no results for any of: ${queries.join(" | ")}`);
      failed++;
      continue;
    }
    await downloadTo(photo.urls.regular, destPath);
    await trackDownload(photo.links.download_location);
    attributions[id] = {
      photoId: photo.id,
      photographer: photo.user.name,
      photographerUrl: `${photo.user.links.html}?utm_source=improve_app&utm_medium=referral`,
      unsplashUrl: `${photo.links.html}?utm_source=improve_app&utm_medium=referral`,
      description: photo.description || photo.alt_description || null,
      query: usedQuery,
    };
    console.log(`✓ "${usedQuery}" → ${photo.user.name}`);
    ok++;
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
    failed++;
  }

  await new Promise((r) => setTimeout(r, PAUSE_MS));
}

await fs.writeFile(attributionPath, JSON.stringify(attributions, null, 2) + "\n");

console.log(
  `\nDone. ${ok} downloaded, ${skipped} skipped (already existed), ${failed} failed.`
);
