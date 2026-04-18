import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coursesDir = path.resolve(__dirname, "..", "courses");
const contentDir = path.join(coursesDir, "content");

const files = fs
  .readdirSync(contentDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const cards = [];
const categoryMap = new Map();
const subcategoryMap = new Map();

for (const file of files) {
  const raw = fs.readFileSync(path.join(contentDir, file), "utf8");
  let course;
  try {
    course = JSON.parse(raw);
  } catch (err) {
    console.error(`Invalid JSON in ${file}: ${err.message}`);
    process.exit(1);
  }

  const { id, language, card, meta } = course;
  cards.push({
    id,
    language,
    title: card.title,
    teaser: card.teaser,
    category: card.category,
    subcategories: card.subcategories ?? [],
    tags: card.tags ?? [],
    emoji: card.emoji,
    accentColor: card.accentColor,
    coverSymbol: card.coverSymbol,
    difficulty: meta.difficulty,
    estimatedMinutes: meta.estimatedMinutes,
    lessonCount: meta.lessonCount,
    hasQuiz: meta.hasQuiz,
  });

  const cat = card.category;
  if (!categoryMap.has(cat)) categoryMap.set(cat, []);
  categoryMap.get(cat).push(id);

  for (const sub of card.subcategories ?? []) {
    if (!subcategoryMap.has(sub)) subcategoryMap.set(sub, []);
    subcategoryMap.get(sub).push(id);
  }
}

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  courseCount: cards.length,
  courses: cards,
};

const categories = {
  version: 1,
  generatedAt: new Date().toISOString().slice(0, 10),
  categories: Array.from(categoryMap.keys())
    .sort()
    .map((name) => ({
      name,
      count: categoryMap.get(name).length,
      courseIds: categoryMap.get(name).sort(),
    })),
  subcategories: Array.from(subcategoryMap.keys())
    .sort()
    .map((name) => ({
      name,
      count: subcategoryMap.get(name).length,
      courseIds: subcategoryMap.get(name).sort(),
    })),
};

fs.writeFileSync(
  path.join(coursesDir, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);
fs.writeFileSync(
  path.join(coursesDir, "categories.json"),
  JSON.stringify(categories, null, 2) + "\n"
);

console.log(`Wrote manifest.json (${cards.length} courses)`);
console.log(
  `Wrote categories.json (${categories.categories.length} categories, ${categories.subcategories.length} subcategories)`
);
