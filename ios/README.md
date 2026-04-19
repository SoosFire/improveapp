# Improve — iOS reference implementation

SwiftUI reference code that implements the Template C card design, the
Tinder-style swipe feed, and the full lesson/quiz flow in native iOS.

This is a **starting point** — a working skeleton you can drop into a fresh
Xcode project and build on. It intentionally avoids dependencies and
third-party packages.

## Target

- **iOS 17+** (uses `@Observable`, Swift macros, `ContentView.task { }`)
- **Swift 5.9+**
- Xcode 15+

If you need iOS 16 support, swap `@Observable` classes for `ObservableObject`
with `@Published` properties.

## File overview

```
ios/Improve/
├── ImproveApp.swift              — @main + TabView wiring the 4 tabs
├── Models/
│   ├── Models.swift              — Codable types matching the JSON schema
│   ├── ContentStore.swift        — loads manifest.json, caches full courses
│   └── LikedCoursesStore.swift   — @Observable wrapper around UserDefaults
├── Support/
│   └── Color+Hex.swift           — Color(hex:) + darkened() used by gradients
└── Features/
    ├── Feed/
    │   ├── CardView.swift        — Template C (gradient stage + info panel)
    │   └── SwipeFeedView.swift   — Tinder-style card stack w/ drag gesture
    └── Library/
        ├── LibraryView.swift     — list of liked courses, opens the flow
        └── LessonFlowView.swift  — intro → lessons → quiz → completion
```

Categories and Profile are placeholder tabs. Port the Categories tab from
`courses/preview/categories.html` when you need it.

## Setup in Xcode

1. Create a new project: **iOS › App**. Product Name: `Improve`. Interface:
   SwiftUI. Language: Swift. Storage: None.
2. Delete the default `ContentView.swift` and the default `App.swift`.
3. Drag the `Improve/` folder (all contents) into the Xcode project. Make
   sure **Copy items if needed** is checked and the target is selected.
4. Add the courses data as a bundled resource:
   - In Finder, drag **courses/manifest.json** into your Xcode project,
     checking *Copy items if needed* and adding to the target.
   - Drag **courses/content/** as a **folder reference** (the blue folder
     icon in the dialog — *not* the yellow "Create groups"). This preserves
     the `content/` subdirectory so `Bundle.main.url(...subdirectory:"content")`
     works at runtime.
5. Build & run. The first tab should show a card you can swipe.

## How the data gets into the app

The content repo already has the final shape:
- `courses/manifest.json` — one big file with all card data for the feed
- `courses/content/{id}.json` — one file per course with lessons + quiz

At build time they're copied into the app bundle. At runtime:
- **On launch**, `ContentStore.loadManifest()` parses `manifest.json` once
  (cheap — just card metadata).
- **On first open of a course**, `ContentStore.fullCourse(id:)` lazy-loads
  `content/{id}.json` and caches it in memory for the session.

## How the swipe feed works

`SwipeFeedView` renders up to 3 cards stacked. The top card binds a
`DragGesture` that applies `offset` and a small `rotationEffect` (scaled by
`translation.width / 20`) to the top card.

When released:
- If horizontal drag exceeds `dragThreshold` (100pt by default), the card
  flies off-screen in that direction. A right-swipe calls `liked.like(id)`.
- Otherwise, it snaps back to center with an interactive spring.

## How the lesson flow works

`LessonFlowView` is a state machine:

```
.intro  →  .lesson(0)  →  .lesson(1)  →  …  →  .lesson(N-1)  →  .quiz(0)  →  …  →  .quiz(M-1)  →  .complete
```

Each screen is a private struct at the bottom of `LessonFlowView.swift`
(`IntroScreen`, `LessonScreen`, `QuizScreen`, `CompletionScreen`). Shared
components like `Stage`, `TypePill`, `CTAButton`, `KeyTermCard`, and
`FunFactCallout` live above the screens.

## Regenerating the data

If you add or edit courses, re-run these scripts from the repo root:

```bash
node scripts/build-manifest.mjs        # regenerates manifest.json + categories.json
node scripts/build-preview.mjs         # regenerates catalog.html preview
node scripts/build-lesson-preview.mjs viking-sunstone
node scripts/build-categories-preview.mjs
```

Then re-drag `manifest.json` and `content/` into Xcode if file paths changed
(usually they don't; Xcode picks up updated contents automatically).

## Known gaps / next steps

- **CategoriesView.swift** is just a placeholder. Port from
  `courses/preview/categories.html`.
- **Swipe gesture polish**: could add haptics (UISelectionFeedbackGenerator
  on threshold crossing, UINotificationFeedbackGenerator.success on like).
- **LessonFlowView transitions**: uses default `.easeInOut`; experiment with
  `.push` / matched geometry effects for more drama.
- **Offline thinking**: currently the bundle contains all courses. If the
  catalog grows past ~1000 courses, move to remote fetching with `URLSession`
  and an on-disk cache keyed by course ID.
- **Analytics**: tap into `SwipeFeedView.commitSwipe` and `LibraryView`
  taps to see what resonates.
- **A11y**: add `.accessibilityLabel` on cards, increase symbol contrast for
  users with reduced-transparency preferences.
