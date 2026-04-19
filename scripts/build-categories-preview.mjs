// Generates an interactive HTML mockup of the Categories tab.
// Usage: node scripts/build-categories-preview.mjs
// Output: courses/preview/categories.html
//
// Shows all 69 categories grouped into 10 meta-groups, with a prominent
// "Random" hero card. User taps categories to select, then taps Start.
// Data is pulled live from courses/manifest.json so counts stay in sync.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const manifest = JSON.parse(
  await fs.readFile(path.join(root, "courses", "manifest.json"), "utf8")
);

// Count courses per category from the manifest.
const counts = {};
for (const c of manifest.courses) {
  counts[c.category] = (counts[c.category] || 0) + 1;
}

// A curated emoji for each category (more distinctive than the per-course one).
const CATEGORY_EMOJI = {
  "Anthropology": "👥",
  "Archaeology": "🏺",
  "Architecture": "🏛️",
  "Art": "🎨",
  "Artificial Intelligence": "🤖",
  "Astronomy": "🌌",
  "Biology": "🧬",
  "Botany": "🌱",
  "Business": "📊",
  "Chemistry": "🧪",
  "Chess": "♟️",
  "Climate Science": "🌍",
  "Computer Science": "💻",
  "Cooking": "🍳",
  "Criminology": "🕵️",
  "Critical Thinking": "💡",
  "Cybersecurity": "🔒",
  "Design": "✏️",
  "Economics": "📈",
  "Engineering": "🔧",
  "Ethics": "⚖️",
  "Evolutionary Biology": "🦍",
  "Fashion": "👗",
  "Film & Cinema": "🎬",
  "Finance": "💰",
  "Fitness": "💪",
  "Games & Strategy": "🎲",
  "Gardening": "🌷",
  "Genetics": "🧬",
  "Geography": "🗺️",
  "Health": "❤️",
  "History": "⚔️",
  "Home & DIY": "🔨",
  "Language": "💬",
  "Law": "⚖️",
  "Leadership": "👑",
  "Linguistics": "🔤",
  "Literature": "📖",
  "Logic": "🧩",
  "Marine Life": "🐙",
  "Marketing": "📣",
  "Mathematics": "📐",
  "Medicine": "⚕️",
  "Mental Health": "💭",
  "Microbiology": "🦠",
  "Mindfulness & Meditation": "🧘",
  "Music": "🎵",
  "Nature": "🌳",
  "Neuroscience": "🧠",
  "Nutrition": "🥗",
  "Paleontology": "🦖",
  "Parenting": "👶",
  "Philosophy": "🤔",
  "Photography": "📷",
  "Physics": "⚛️",
  "Political Science": "🏛️",
  "Productivity": "⏱️",
  "Psychology": "🎭",
  "Relationships": "💞",
  "Religion & Mythology": "✨",
  "Self-improvement": "🌱",
  "Sociology": "👫",
  "Sports": "⚽",
  "Survival Skills": "🏕️",
  "Technology": "📱",
  "Theater & Drama": "🎭",
  "Travel": "✈️",
  "Weather": "⛈️",
  "Wildlife": "🦁",
};

// Group the 69 categories into 10 meta-groups for browsability.
const META_GROUPS = [
  { name: "Science & Nature", emoji: "🌿",
    cats: ["Physics", "Chemistry", "Biology", "Astronomy", "Genetics",
           "Evolutionary Biology", "Microbiology", "Botany", "Paleontology",
           "Marine Life", "Wildlife", "Climate Science", "Weather", "Nature"] },
  { name: "History & Culture", emoji: "🏺",
    cats: ["History", "Archaeology", "Anthropology", "Religion & Mythology"] },
  { name: "Mind & Ideas", emoji: "💭",
    cats: ["Psychology", "Neuroscience", "Philosophy", "Ethics",
           "Critical Thinking", "Logic", "Mindfulness & Meditation", "Mental Health"] },
  { name: "Words & Stories", emoji: "📖",
    cats: ["Literature", "Language", "Linguistics"] },
  { name: "Arts & Design", emoji: "🎨",
    cats: ["Art", "Music", "Film & Cinema", "Photography", "Theater & Drama",
           "Architecture", "Design", "Fashion"] },
  { name: "Tech & Math", emoji: "💻",
    cats: ["Mathematics", "Technology", "Computer Science",
           "Artificial Intelligence", "Engineering", "Cybersecurity"] },
  { name: "Body & Food", emoji: "💪",
    cats: ["Medicine", "Health", "Nutrition", "Fitness", "Cooking"] },
  { name: "Life & Practical", emoji: "🏡",
    cats: ["Productivity", "Self-improvement", "Relationships", "Parenting",
           "Travel", "Survival Skills", "Home & DIY", "Gardening"] },
  { name: "Business & Society", emoji: "💼",
    cats: ["Business", "Marketing", "Leadership", "Finance", "Economics", "Law",
           "Criminology", "Political Science", "Sociology", "Geography"] },
  { name: "Play", emoji: "🎮",
    cats: ["Sports", "Games & Strategy", "Chess"] },
];

// Sanity-check: every category is in exactly one group.
const allCats = META_GROUPS.flatMap((g) => g.cats);
const unknown = Object.keys(counts).filter((c) => !allCats.includes(c));
if (unknown.length) console.warn("Categories missing from META_GROUPS:", unknown);

function escape(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function tile(cat) {
  const emoji = CATEGORY_EMOJI[cat] || "✨";
  return `<button class="tile" data-cat="${escape(cat)}">
    <div class="tile-emoji">${emoji}</div>
    <div class="tile-name">${escape(cat)}</div>
    <div class="tile-check">✓</div>
  </button>`;
}

const groupsHtml = META_GROUPS.map((g) => {
  const tiles = g.cats
    .filter((c) => counts[c])
    .map(tile)
    .join("");
  return `
    <section class="group">
      <div class="group-head">
        <span class="group-emoji">${g.emoji}</span>
        <span class="group-name">${escape(g.name)}</span>
      </div>
      <div class="tiles">${tiles}</div>
    </section>
  `;
}).join("");

const totalCourses = manifest.courses.length;
const totalCats = Object.keys(counts).length;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>Improve — Categories</title>
<style>
  :root {
    --accent: #6B8DE3;
    --bg: #0a0a0b;
    --panel: #12121a;
    --panel-2: #1a1a24;
    --text: #f5f5f7;
    --muted: #9d9da3;
    --faint: #6a6a72;
    --phone-w: 420px;
    --phone-h: 860px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #000; color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; -webkit-font-smoothing: antialiased; }
  body { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at 30% 20%, #181820 0%, #050507 70%); }

  .phone {
    width: var(--phone-w); height: var(--phone-h);
    border-radius: 48px; background: var(--bg); overflow: hidden; position: relative;
    box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06);
    display: flex; flex-direction: column;
  }
  .bar-top { height: 44px; padding: 14px 24px 0; display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 600; color: var(--text); flex-shrink: 0; }

  /* tab bar at bottom */
  .tabs {
    display: flex; justify-content: space-around; padding: 10px 16px 24px;
    background: var(--panel); border-top: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .tab { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 10px; color: var(--faint); cursor: pointer; padding: 4px 8px; }
  .tab-icon { font-size: 22px; opacity: 0.5; }
  .tab.active { color: var(--accent); }
  .tab.active .tab-icon { opacity: 1; }

  /* scrollable content */
  .content { flex: 1; overflow-y: auto; padding: 16px 20px 120px; }
  .content::-webkit-scrollbar { display: none; }

  .head { padding: 4px 4px 20px; }
  .head h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 6px; }
  .head p { font-size: 14px; color: var(--muted); margin: 0; line-height: 1.4; }

  /* random hero card */
  .random {
    position: relative; display: block; width: 100%;
    padding: 22px 22px 20px; border-radius: 24px; border: none; text-align: left;
    background: linear-gradient(135deg, #6B8DE3 0%, #9E6BE3 60%, #D84F97 100%);
    color: #fff; cursor: pointer; margin-bottom: 28px; overflow: hidden;
    box-shadow: 0 16px 40px rgba(107,141,227,0.35);
  }
  .random::before {
    content: ""; position: absolute; inset: 0;
    background-image:
      radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25) 0 1px, transparent 2px),
      radial-gradient(circle at 80% 70%, rgba(255,255,255,0.2) 0 1px, transparent 2px),
      radial-gradient(circle at 60% 20%, rgba(255,255,255,0.15) 0 1px, transparent 2px);
    background-size: 80px 80px, 120px 120px, 60px 60px;
  }
  .random .top { display: flex; align-items: center; gap: 12px; position: relative; z-index: 1; }
  .random-emoji { font-size: 34px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); }
  .random-label { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.85; }
  .random-title { font-size: 28px; font-weight: 800; margin: 8px 0 4px; letter-spacing: -0.02em; position: relative; z-index: 1; }
  .random-sub { font-size: 13px; opacity: 0.9; position: relative; z-index: 1; }

  /* meta group */
  .group { margin-bottom: 24px; }
  .group-head { display: flex; align-items: center; gap: 8px; margin: 0 4px 12px; }
  .group-emoji { font-size: 18px; }
  .group-name { font-size: 14px; font-weight: 700; letter-spacing: -0.01em; color: var(--text); flex: 1; }

  /* tiles grid */
  .tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tile {
    position: relative; padding: 14px 10px 12px; border-radius: 16px;
    background: var(--panel); border: 1.5px solid rgba(255,255,255,0.06);
    color: var(--text); cursor: pointer; transition: all 0.15s ease;
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px;
    min-height: 104px;
  }
  .tile:hover { background: var(--panel-2); border-color: rgba(255,255,255,0.14); transform: translateY(-1px); }
  .tile.selected { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--panel)); }
  .tile-emoji { font-size: 28px; line-height: 1; margin-top: 2px; }
  .tile-name { font-size: 12px; font-weight: 600; line-height: 1.2; letter-spacing: -0.005em; color: var(--text); }
  .tile-check {
    position: absolute; top: 8px; right: 8px;
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--accent); color: #fff;
    font-size: 10px; font-weight: 700; display: grid; place-items: center;
    opacity: 0; transform: scale(0.5); transition: all 0.15s;
  }
  .tile.selected .tile-check { opacity: 1; transform: scale(1); }

  /* sticky CTA */
  .cta-bar {
    position: absolute; left: 0; right: 0; bottom: 80px;
    padding: 14px 20px 16px;
    background: linear-gradient(to top, var(--bg) 50%, rgba(10,10,11,0.85) 80%, transparent);
    transform: translateY(140%); transition: transform 0.25s ease;
  }
  .cta-bar.visible { transform: translateY(0); }
  .cta {
    width: 100%; padding: 16px 24px; border-radius: 16px;
    background: var(--accent); color: #fff; font-weight: 700; font-size: 15px;
    border: none; cursor: pointer; letter-spacing: 0.01em;
    box-shadow: 0 10px 30px color-mix(in srgb, var(--accent) 35%, transparent);
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .cta:hover { transform: translateY(-1px); }
  .cta .badge { background: rgba(255,255,255,0.2); padding: 3px 9px; border-radius: 999px; font-size: 12px; font-weight: 700; }

  /* overlay shown after Start */
  .overlay {
    position: absolute; inset: 0; background: rgba(10,10,11,0.92); backdrop-filter: blur(20px);
    display: grid; place-items: center; padding: 32px;
    opacity: 0; pointer-events: none; transition: opacity 0.3s;
    text-align: center; z-index: 10;
  }
  .overlay.visible { opacity: 1; pointer-events: auto; }
  .overlay h2 { font-size: 22px; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 10px; }
  .overlay p { font-size: 14px; color: var(--muted); margin: 0 0 24px; line-height: 1.5; }
  .overlay ul { text-align: left; max-height: 160px; overflow: auto; padding: 0 16px; margin: 0 0 24px; }
  .overlay li { font-size: 13px; color: var(--text); padding: 4px 0; list-style: none; }
  .overlay li::before { content: "• "; color: var(--accent); margin-right: 6px; }
  .overlay .close { font-size: 13px; color: var(--muted); background: transparent; border: 1px solid rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 12px; cursor: pointer; }
  .overlay .burst { font-size: 56px; margin-bottom: 10px; animation: pop 0.4s ease; }
  @keyframes pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

  .hint { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); font-size: 11px; color: var(--faint); letter-spacing: 0.06em; }
</style>
</head>
<body>
<div class="phone">
  <div class="bar-top"><span>9:41</span><span style="font-weight:400;opacity:0.6;">Categories</span><span>●●●●●</span></div>

  <div class="content">
    <div class="head">
      <h1>What are you in the mood for?</h1>
      <p>Pick a few topics to tune your feed — or shuffle the whole library.</p>
    </div>

    <button class="random" id="randomBtn">
      <div class="top">
        <div class="random-emoji">🎲</div>
        <div class="random-label">Feeling lucky</div>
      </div>
      <div class="random-title">Surprise me</div>
      <div class="random-sub">A fresh mix across every topic we've got.</div>
    </button>

    ${groupsHtml}
  </div>

  <div class="cta-bar" id="ctaBar">
    <button class="cta" id="startBtn">
      Start swiping
      <span class="badge" id="ctaBadge">0</span>
    </button>
  </div>

  <div class="tabs">
    <div class="tab"><span class="tab-icon">🏠</span>Feed</div>
    <div class="tab active"><span class="tab-icon">📚</span>Categories</div>
    <div class="tab"><span class="tab-icon">❤️</span>Library</div>
    <div class="tab"><span class="tab-icon">👤</span>Profile</div>
  </div>

  <div class="overlay" id="overlay">
    <div>
      <div class="burst">🎯</div>
      <h2 id="overlayTitle">Ready to swipe</h2>
      <p id="overlaySub">Your feed is now tuned to these topics.</p>
      <ul id="overlayList"></ul>
      <button class="close" id="overlayClose">Back to categories</button>
    </div>
  </div>
</div>

<div class="hint">Tap tiles to select · click Surprise me to shuffle all</div>

<script>
const CATEGORY_COUNTS = ${JSON.stringify(counts)};
const selected = new Set();
const ctaBar = document.getElementById("ctaBar");
const ctaBadge = document.getElementById("ctaBadge");
const startBtn = document.getElementById("startBtn");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlaySub = document.getElementById("overlaySub");
const overlayList = document.getElementById("overlayList");

function updateCta() {
  ctaBadge.textContent = selected.size;
  if (selected.size > 0) ctaBar.classList.add("visible");
  else ctaBar.classList.remove("visible");
}

document.querySelectorAll(".tile").forEach((tile) => {
  tile.addEventListener("click", () => {
    const cat = tile.dataset.cat;
    if (selected.has(cat)) { selected.delete(cat); tile.classList.remove("selected"); }
    else { selected.add(cat); tile.classList.add("selected"); }
    updateCta();
  });
});

function startFeed(mode, categories) {
  if (mode === "random") {
    overlayTitle.textContent = "Shuffling everything";
    overlaySub.textContent = "A random mix across every topic we've got.";
  } else {
    overlayTitle.textContent = "Your feed is ready";
    overlaySub.textContent = \`Tuned to \${categories.length} \${categories.length === 1 ? "category" : "categories"}.\`;
  }
  overlayList.innerHTML = categories
    .sort()
    .map((c) => \`<li>\${c}</li>\`)
    .join("");
  overlay.classList.add("visible");
}

document.getElementById("randomBtn").addEventListener("click", () => {
  startFeed("random", Object.keys(CATEGORY_COUNTS));
});
startBtn.addEventListener("click", () => {
  if (selected.size === 0) return;
  startFeed("selected", Array.from(selected));
});
document.getElementById("overlayClose").addEventListener("click", () => {
  overlay.classList.remove("visible");
});
</script>
</body>
</html>
`;

const outPath = path.join(root, "courses", "preview", "categories.html");
await fs.writeFile(outPath, html);
console.log(
  `Wrote ${outPath} (${totalCats} categories, ${totalCourses} courses, ${META_GROUPS.length} meta-groups)`
);
