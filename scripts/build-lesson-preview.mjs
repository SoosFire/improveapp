// Generates an interactive HTML mockup of the lesson + quiz flow for one course.
// Usage: node scripts/build-lesson-preview.mjs [course-id]   (default: viking-sunstone)
// Output: courses/preview/lesson-flow.html
//
// The page simulates the post-swipe experience: intro → lessons → quiz → completion.
// Navigate with Next/Prev buttons or ←/→ arrow keys.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const courseId = process.argv[2] || "viking-sunstone";
const coursePath = path.join(root, "courses", "content", `${courseId}.json`);
const course = JSON.parse(await fs.readFile(coursePath, "utf8"));

function darken(hex, amount = 0.65) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c) => Math.max(0, Math.min(255, Math.round(c * (1 - amount) + 12 * amount)));
  return "#" + [mix(r), mix(g), mix(b)].map((n) => n.toString(16).padStart(2, "0")).join("");
}

const accent = course.card.accentColor || "#5B6B89";
const accentDark = darken(accent);
const coverEmoji = course.card.coverSymbol?.fallbackEmoji || course.card.emoji || "✨";

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<title>${course.card.title} — lesson preview</title>
<style>
  :root {
    --accent: ${accent};
    --accent-dark: ${accentDark};
    --bg: #0a0a0b;
    --panel: #12121a;
    --text: #f5f5f7;
    --muted: #9d9da3;
    --faint: #6a6a72;
    --correct: #3ab77a;
    --wrong: #e36a6a;
    --phone-w: 420px;
    --phone-h: 860px;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #000; color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif; -webkit-font-smoothing: antialiased; }
  body { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: radial-gradient(circle at 30% 20%, #181820 0%, #050507 70%); }

  /* phone frame */
  .phone {
    width: var(--phone-w); height: var(--phone-h);
    border-radius: 48px;
    background: var(--bg);
    box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 8px 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06);
    overflow: hidden;
    position: relative;
    display: flex; flex-direction: column;
  }

  /* top status bar */
  .bar-top {
    height: 44px; padding: 14px 24px 0;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 15px; font-weight: 600; color: var(--text);
    flex-shrink: 0;
  }
  .bar-top .dots { display: flex; gap: 4px; align-items: center; }
  .bar-top .dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); }
  .bar-top .dot.on { background: var(--accent); }

  .nav {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 20px; color: var(--muted); font-size: 13px;
    flex-shrink: 0;
  }
  .nav button { background: none; border: none; color: var(--muted); font-size: 20px; cursor: pointer; padding: 8px; }
  .nav .quit { font-size: 14px; color: var(--muted); }

  /* progress bar */
  .progress { height: 3px; background: rgba(255,255,255,0.06); margin: 0 20px; border-radius: 999px; overflow: hidden; flex-shrink: 0; }
  .progress-fill { height: 100%; background: var(--accent); transition: width 0.3s ease; }

  /* screen stack */
  .stack { flex: 1; overflow: hidden; position: relative; }
  .screen { position: absolute; inset: 0; overflow-y: auto; opacity: 0; pointer-events: none; transition: opacity 0.25s ease; padding: 0 24px 100px; }
  .screen.active { opacity: 1; pointer-events: auto; }
  .screen::-webkit-scrollbar { display: none; }

  /* stage component */
  .stage {
    height: 260px; margin: 16px 0 24px;
    border-radius: 24px;
    background: radial-gradient(65% 55% at 50% 50%, var(--c1, var(--accent)) 0%, var(--c2, var(--accent-dark)) 100%);
    display: grid; place-items: center;
    position: relative; overflow: hidden;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08);
  }
  .stage::before {
    content: ""; position: absolute; inset: 0;
    background-image:
      repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 32px),
      repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 32px);
    mask-image: radial-gradient(circle at center, black 0%, transparent 70%);
  }
  .stage .sym { font-size: 108px; filter: drop-shadow(0 14px 32px rgba(0,0,0,0.35)); position: relative; z-index: 1; }
  .stage.tall { height: 320px; }
  .stage.short { height: 200px; }
  .stage.short .sym { font-size: 84px; }

  /* intro */
  .cat { font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
  .title-xl { font-size: 32px; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 12px; text-wrap: balance; }
  .teaser-lg { font-size: 16px; line-height: 1.5; color: rgba(245,245,247,0.82); margin: 0 0 24px; }

  .stats { display: flex; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
  .stat { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 14px; font-size: 12px; color: var(--muted); }
  .stat b { display: block; font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 2px; }

  /* lesson */
  .type-pill { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, transparent); padding: 6px 12px; border-radius: 999px; margin-bottom: 10px; }
  .title-lg { font-size: 24px; font-weight: 700; line-height: 1.2; letter-spacing: -0.01em; margin: 0 0 16px; text-wrap: balance; }
  .body { font-size: 15.5px; line-height: 1.55; color: rgba(245,245,247,0.88); }
  .body em { background: linear-gradient(transparent 65%, color-mix(in srgb, var(--accent) 45%, transparent) 65%); font-style: normal; }

  .terms { display: grid; gap: 10px; margin: 20px 0 0; }
  .term { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); padding: 14px 16px; border-radius: 14px; }
  .term-name { font-size: 13px; font-weight: 700; color: var(--accent); margin-bottom: 4px; }
  .term-def { font-size: 13.5px; color: rgba(245,245,247,0.78); line-height: 1.5; }

  .funfact { margin-top: 18px; padding: 14px 16px; border-radius: 14px; background: rgba(245,200,90,0.08); border: 1px solid rgba(245,200,90,0.15); color: rgba(245,220,140,0.95); font-size: 13.5px; line-height: 1.5; }
  .funfact::before { content: "✨ Fun fact · "; font-weight: 700; }

  /* quiz */
  .q-header { font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
  .q-text { font-size: 22px; font-weight: 700; line-height: 1.25; letter-spacing: -0.01em; margin: 0 0 20px; text-wrap: balance; }
  .options { display: grid; gap: 10px; }
  .opt {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    padding: 16px 18px; border-radius: 14px; font-size: 15px; color: var(--text);
    text-align: left; cursor: pointer; width: 100%; transition: all 0.15s;
    display: flex; justify-content: space-between; align-items: center; gap: 12px;
  }
  .opt:hover:not(.disabled) { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
  .opt.correct { background: color-mix(in srgb, var(--correct) 22%, var(--bg)); border-color: var(--correct); color: #e6fff2; }
  .opt.wrong { background: color-mix(in srgb, var(--wrong) 22%, var(--bg)); border-color: var(--wrong); color: #ffe8e8; }
  .opt.disabled { cursor: default; opacity: 0.55; }
  .opt .icon { font-size: 14px; opacity: 0; transition: opacity 0.2s; }
  .opt.correct .icon, .opt.wrong .icon { opacity: 1; }
  .explanation { margin-top: 18px; padding: 14px 16px; border-radius: 14px; background: rgba(255,255,255,0.04); font-size: 14px; line-height: 1.5; color: rgba(245,245,247,0.85); display: none; }
  .explanation.show { display: block; animation: fadeIn 0.25s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

  /* completion */
  .celebrate { height: 220px; margin: 32px 0 24px; display: grid; place-items: center; font-size: 96px; filter: drop-shadow(0 16px 40px color-mix(in srgb, var(--accent) 40%, transparent)); }
  .sources { margin-top: 28px; }
  .sources h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin: 0 0 10px; }
  .src { font-size: 13.5px; color: rgba(245,245,247,0.82); padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.06); line-height: 1.45; }
  .src:last-child { border-bottom: 1px solid rgba(255,255,255,0.06); }
  .src .src-pub { color: var(--muted); font-size: 12px; margin-top: 3px; }
  .related h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin: 28px 0 10px; }
  .rel-list { display: flex; flex-direction: column; gap: 8px; }
  .rel { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); padding: 12px 14px; border-radius: 12px; font-size: 13.5px; color: rgba(245,245,247,0.85); }

  /* sticky cta */
  .cta-bar { position: absolute; left: 0; right: 0; bottom: 0; padding: 16px 24px 28px; background: linear-gradient(to top, var(--bg) 60%, transparent); display: flex; gap: 10px; }
  .cta { flex: 1; padding: 16px 24px; border-radius: 16px; background: var(--accent); color: #0a0a0b; font-weight: 700; font-size: 15px; border: none; cursor: pointer; letter-spacing: 0.01em; transition: transform 0.12s; box-shadow: 0 10px 30px color-mix(in srgb, var(--accent) 35%, transparent); }
  .cta:hover { transform: translateY(-1px); }
  .cta:active { transform: translateY(1px); }
  .cta.secondary { background: rgba(255,255,255,0.06); color: var(--text); box-shadow: none; }

  .hint { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); font-size: 11px; color: var(--faint); letter-spacing: 0.06em; }
</style>
</head>
<body>
<div class="phone">
  <div class="bar-top">
    <span>9:41</span>
    <span style="font-weight:400;opacity:0.6;">Improve</span>
    <span>●●●●●</span>
  </div>
  <div class="nav">
    <button class="quit" id="quit">← Library</button>
    <span id="stepLabel">—</span>
    <span></span>
  </div>
  <div class="progress"><div class="progress-fill" id="progress"></div></div>

  <div class="stack" id="stack"></div>
</div>

<div class="hint">← → to navigate · click Next · built from ${courseId}.json</div>

<script>
const COURSE = ${JSON.stringify(course)};
const LESSONS = COURSE.lessons || [];
const QUIZ = COURSE.quiz || [];

const stack = document.getElementById("stack");
const progress = document.getElementById("progress");
const stepLabel = document.getElementById("stepLabel");

// Build screen list: intro -> each lesson -> each quiz -> completion
const screens = [];
screens.push({ kind: "intro" });
LESSONS.forEach((l, i) => screens.push({ kind: "lesson", lesson: l, index: i }));
QUIZ.forEach((q, i) => screens.push({ kind: "quiz", quiz: q, index: i }));
screens.push({ kind: "complete" });

function el(tag, props = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== undefined && v !== null) e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    e.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return e;
}

function renderIntro() {
  const s = el("div", { class: "screen" });
  const stage = el("div", { class: "stage tall" }, el("div", { class: "sym" }, ${JSON.stringify(coverEmoji)}));
  const cat = el("div", { class: "cat" }, (COURSE.card.subcategories?.[0] ? COURSE.card.category + " · " + COURSE.card.subcategories[0] : COURSE.card.category));
  const title = el("h1", { class: "title-xl" }, COURSE.card.title);
  const teaser = el("p", { class: "teaser-lg" }, COURSE.card.teaser);
  const stats = el("div", { class: "stats" },
    el("div", { class: "stat" }, el("b", {}, String(LESSONS.length)), "Lessons"),
    el("div", { class: "stat" }, el("b", {}, String(QUIZ.length)), "Quiz Qs"),
    el("div", { class: "stat" }, el("b", {}, String(COURSE.meta.estimatedMinutes || 4)), "Min"),
    el("div", { class: "stat" }, el("b", {}, COURSE.meta.difficulty || "beginner"), "Level"),
  );
  s.append(stage, cat, title, teaser, stats);
  s.append(ctaBar([{ label: "Start learning", primary: true, action: next }]));
  return s;
}

function renderLesson({ lesson, index }) {
  const s = el("div", { class: "screen" });
  const emoji = lesson.visual?.emoji || fallbackEmojiForSymbol(lesson.visual?.sfSymbol) || "📖";
  const stage = el("div", { class: "stage" }, el("div", { class: "sym" }, emoji));
  s.append(stage);
  s.append(el("div", { class: "type-pill" }, (lesson.type || "lesson").toUpperCase()));
  s.append(el("h2", { class: "title-lg" }, lesson.title));
  s.append(el("p", { class: "body", html: lesson.body.replace(/\\*([^*]+)\\*/g, "<em>$1</em>") }));

  if (lesson.keyTerms?.length) {
    const terms = el("div", { class: "terms" });
    for (const t of lesson.keyTerms) {
      terms.append(el("div", { class: "term" },
        el("div", { class: "term-name" }, t.term),
        el("div", { class: "term-def" }, t.definition),
      ));
    }
    s.append(terms);
  }
  if (lesson.funFact) s.append(el("div", { class: "funfact" }, lesson.funFact));

  const isLast = index === LESSONS.length - 1;
  s.append(ctaBar([
    { label: "Back", action: prev },
    { label: isLast ? "Start quiz" : "Next", primary: true, action: next },
  ]));
  return s;
}

function renderQuiz({ quiz, index }) {
  const s = el("div", { class: "screen" });
  s.append(el("div", { class: "stage short" }, el("div", { class: "sym" }, "❓")));
  s.append(el("div", { class: "q-header" }, \`Question \${index + 1} of \${QUIZ.length}\`));
  s.append(el("h2", { class: "q-text" }, quiz.question));

  const opts = el("div", { class: "options" });
  let answered = false;
  quiz.options.forEach((text, i) => {
    const btn = el("button", { class: "opt" },
      el("span", {}, text),
      el("span", { class: "icon" }, i === quiz.correctIndex ? "✓" : "✗"),
    );
    btn.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      opts.querySelectorAll(".opt").forEach((b) => b.classList.add("disabled"));
      btn.classList.add(i === quiz.correctIndex ? "correct" : "wrong");
      if (i !== quiz.correctIndex) opts.children[quiz.correctIndex].classList.add("correct");
      expl.classList.add("show");
      cta.style.opacity = "1";
      cta.disabled = false;
    });
    opts.append(btn);
  });
  s.append(opts);

  const expl = el("div", { class: "explanation" }, quiz.explanation);
  s.append(expl);

  const cta = el("button", { class: "cta" }, index === QUIZ.length - 1 ? "Finish" : "Next question");
  cta.style.opacity = "0.35";
  cta.disabled = true;
  cta.addEventListener("click", next);
  const bar = el("div", { class: "cta-bar" }, cta);
  s.append(bar);
  return s;
}

function renderComplete() {
  const s = el("div", { class: "screen" });
  s.append(el("div", { class: "celebrate" }, "🎉"));
  s.append(el("div", { class: "cat" }, "Course complete"));
  s.append(el("h1", { class: "title-xl" }, "You learned: " + COURSE.card.title));
  s.append(el("p", { class: "teaser-lg" }, \`\${LESSONS.length} lessons · \${QUIZ.length} questions · Added to your library.\`));

  if (COURSE.sources?.length) {
    const box = el("div", { class: "sources" }, el("h4", {}, "Sources"));
    for (const src of COURSE.sources) {
      box.append(el("div", { class: "src" },
        el("div", {}, src.title),
        el("div", { class: "src-pub" }, \`\${src.publisher} · \${src.year}\`),
      ));
    }
    s.append(box);
  }
  if (COURSE.related?.length) {
    const rel = el("div", { class: "related" }, el("h4", {}, "Related"));
    const list = el("div", { class: "rel-list" });
    for (const r of COURSE.related) list.append(el("div", { class: "rel" }, r.replace(/-/g, " ")));
    rel.append(list);
    s.append(rel);
  }
  s.append(ctaBar([{ label: "Back to library", primary: true, action: restart }]));
  return s;
}

function ctaBar(buttons) {
  const bar = el("div", { class: "cta-bar" });
  for (const b of buttons) {
    const btn = el("button", { class: "cta" + (b.primary ? "" : " secondary") }, b.label);
    btn.addEventListener("click", b.action);
    bar.append(btn);
  }
  return bar;
}

function fallbackEmojiForSymbol(sym) {
  if (!sym) return null;
  const map = {
    "cloud.fog.fill": "🌫️", "diamond.fill": "💎", "sun.max.fill": "☀️",
    "magnifyingglass": "🔍", "lightbulb.fill": "💡", "sun.haze.fill": "🌥️",
  };
  return map[sym] || null;
}

let current = 0;
function render() {
  stack.innerHTML = "";
  const screen = screens[current];
  let node;
  if (screen.kind === "intro") node = renderIntro();
  else if (screen.kind === "lesson") node = renderLesson(screen);
  else if (screen.kind === "quiz") node = renderQuiz(screen);
  else node = renderComplete();
  node.classList.add("active");
  stack.append(node);
  stack.scrollTop = 0;

  const total = screens.length;
  progress.style.width = ((current + 1) / total * 100) + "%";
  if (screen.kind === "intro") stepLabel.textContent = "Intro";
  else if (screen.kind === "lesson") stepLabel.textContent = \`Lesson \${screen.index + 1} of \${LESSONS.length}\`;
  else if (screen.kind === "quiz") stepLabel.textContent = \`Quiz \${screen.index + 1} of \${QUIZ.length}\`;
  else stepLabel.textContent = "Complete";
}

function next() { if (current < screens.length - 1) { current++; render(); } }
function prev() { if (current > 0) { current--; render(); } }
function restart() { current = 0; render(); }

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
});
document.getElementById("quit").addEventListener("click", restart);

render();
</script>
</body>
</html>
`;

const outPath = path.join(root, "courses", "preview", "lesson-flow.html");
await fs.writeFile(outPath, html);
console.log(`Wrote ${outPath} for course "${courseId}" (${course.lessons.length} lessons + ${course.quiz.length} quiz questions)`);
