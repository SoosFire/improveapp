// Renders all courses into a static HTML catalog preview using Template C.
// Usage: node scripts/build-preview.mjs
// Output: courses/preview/catalog.html
//
// Notes: darker accent color for the gradient is derived by mixing the
// card accentColor toward near-black. No external assets or API calls.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const manifest = JSON.parse(
  await fs.readFile(path.join(root, "courses", "manifest.json"), "utf8")
);
const categoriesData = JSON.parse(
  await fs.readFile(path.join(root, "courses", "categories.json"), "utf8")
);

// Convert #RRGGBB → darker variant by mixing with near-black.
function darken(hex, amount = 0.62) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - amount) + 12 * amount)));
  return (
    "#" +
    [mix(r), mix(g), mix(b)]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
  );
}

function escape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cardHtml(course) {
  const c1 = course.accentColor || "#5B6B89";
  const c2 = darken(c1);
  const emoji = course.coverSymbol?.fallbackEmoji || course.emoji || "✨";
  const category = course.category || "";
  const subcat = course.subcategories?.[0];
  const breadcrumb = subcat ? `${category} · ${subcat}` : category;
  return `
    <article class="card tpl-c" style="--c1:${c1}; --c2:${c2};" data-category="${escape(category)}">
      <div class="stage"><div class="symbol">${emoji}</div></div>
      <div class="info">
        <div class="cat">${escape(breadcrumb)}</div>
        <div class="title">${escape(course.title)}</div>
        <div class="teaser">${escape(course.teaser)}</div>
        <div class="meta">
          <span>${escape(course.difficulty || "beginner")}</span>
          <span class="dot"></span>
          <span>${course.estimatedMinutes || 4} min</span>
          ${course.hasQuiz ? '<span class="dot"></span><span>Quiz</span>' : ""}
        </div>
      </div>
    </article>
  `;
}

// Group courses by category.
const byCategory = new Map();
for (const c of manifest.courses) {
  if (!byCategory.has(c.category)) byCategory.set(c.category, []);
  byCategory.get(c.category).push(c);
}

const categoryNames = Array.from(byCategory.keys()).sort();

const sections = categoryNames
  .map((cat) => {
    const courses = byCategory.get(cat);
    return `
      <section class="cat-section" data-category="${escape(cat)}" id="${escape(cat.replace(/\s+/g, "-").toLowerCase())}">
        <h2>${escape(cat)} <span class="count">${courses.length}</span></h2>
        <div class="row">
          ${courses.map(cardHtml).join("\n")}
        </div>
      </section>
    `;
  })
  .join("\n");

const chips = categoryNames
  .map(
    (cat) =>
      `<a class="chip" href="#${escape(cat.replace(/\s+/g, "-").toLowerCase())}">${escape(
        cat
      )} <span>${byCategory.get(cat).length}</span></a>`
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Improve — Full Catalog Preview (${manifest.courses.length} courses)</title>
<style>
  :root {
    --bg: #0a0a0b;
    --panel: #12121a;
    --text: #f5f5f7;
    --muted: #9d9da3;
    --card-w: 320px;
    --card-h: 460px;
    --radius: 26px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; -webkit-font-smoothing: antialiased; }
  .page { max-width: 1400px; margin: 0 auto; padding: 56px 32px 120px; }
  header { margin-bottom: 40px; }
  h1 { font-size: 36px; font-weight: 800; letter-spacing: -0.025em; margin: 0 0 10px; }
  .sub { color: var(--muted); font-size: 15px; margin-bottom: 28px; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; padding: 16px 0 4px; border-top: 1px solid rgba(255,255,255,0.06); }
  .chip { text-decoration: none; color: var(--text); font-size: 12px; padding: 6px 12px; background: rgba(255,255,255,0.05); border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); transition: all 0.15s; }
  .chip:hover { background: rgba(255,255,255,0.1); }
  .chip span { opacity: 0.5; margin-left: 4px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.14em; color: var(--muted); margin: 60px 0 24px; font-weight: 700; display: flex; align-items: baseline; gap: 10px; }
  h2 .count { font-size: 12px; opacity: 0.6; font-weight: 500; letter-spacing: 0.08em; }
  .row { display: flex; gap: 22px; flex-wrap: wrap; align-items: flex-start; }

  /* ===== Template C ===== */
  .card {
    width: var(--card-w); height: var(--card-h); border-radius: var(--radius);
    overflow: hidden; position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06);
    transition: transform 0.25s ease;
    cursor: pointer;
  }
  .card:hover { transform: translateY(-4px); }
  .tpl-c { display: grid; grid-template-rows: 1fr auto; background: var(--panel); }
  .tpl-c .stage {
    position: relative; display: grid; place-items: center;
    background: radial-gradient(65% 50% at 50% 55%, var(--c1) 0%, var(--c2) 100%);
    overflow: hidden;
  }
  .tpl-c .stage::before {
    content: ""; position: absolute; inset: 0;
    background-image:
      repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 40px),
      repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 40px);
    mask-image: radial-gradient(circle at center, black 0%, transparent 70%);
  }
  .tpl-c .stage .symbol {
    font-size: 108px;
    filter: drop-shadow(0 16px 40px rgba(0,0,0,0.4));
    position: relative; z-index: 1;
  }
  .tpl-c .info {
    padding: 22px 24px 24px;
    background: var(--panel);
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .tpl-c .cat { font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--c1); margin-bottom: 6px; }
  .tpl-c .title { font-size: 20px; font-weight: 700; line-height: 1.15; letter-spacing: -0.01em; margin-bottom: 8px; text-wrap: balance; }
  .tpl-c .teaser { font-size: 13px; opacity: 0.72; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .tpl-c .meta { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: 11px; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.08em; }
  .tpl-c .dot { width: 3px; height: 3px; border-radius: 50%; background: currentColor; opacity: 0.6; }

  @media (max-width: 720px) {
    .page { padding: 32px 20px 80px; }
    :root { --card-w: 100%; --card-h: auto; }
    .row .card { width: 100%; height: auto; }
    .tpl-c { grid-template-rows: 200px auto; }
    .tpl-c .stage .symbol { font-size: 88px; }
  }
</style>
</head>
<body>
<div class="page">
  <header>
    <h1>Improve — Full Catalog</h1>
    <div class="sub">${manifest.courses.length} courses · ${categoryNames.length} categories · ${categoriesData.subcategories.length} subcategories · Template C layout · No photos, no network</div>
    <div class="chips">
      ${chips}
    </div>
  </header>
  ${sections}
</div>
</body>
</html>
`;

const outPath = path.join(root, "courses", "preview", "catalog.html");
await fs.writeFile(outPath, html);
console.log(`Wrote ${outPath} (${manifest.courses.length} cards, ${categoryNames.length} categories)`);
