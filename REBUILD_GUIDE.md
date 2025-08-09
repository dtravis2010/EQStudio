# ESQ Studio Rebuild Guide (From Blank Folder to Working App)

<!-- Simplified: Mermaid export & DynamicQuestionnaire excluded in slim build -->

This guide walks through rebuilding the streamlined ESQ Studio application from scratch. It distills only the core pieces: project setup, data models, state, core components (Toolbar, LeftNav, Canvas, Inspector), minimal questionnaire logic, and export utilities.

---
## 1. Prerequisites
- Node.js (LTS)
- pnpm (preferred) or npm / yarn
- A modern browser
- Code editor (VS Code)

Check versions:
```
node -v
pnpm -v
```

---
## 2. Initialize Project
```
pnpm create vite esq-studio --template react-ts
cd esq-studio
pnpm install
```

Install required libraries:
```
pnpm add zustand nanoid file-saver reactflow
```

Optional dev helpers:
```
pnpm add -D @types/file-saver
```

---
## 3. Project Structure (Slim Version)
```
index.html
package.json
tsconfig.json
vite.config.ts
src/
  main.tsx
  app.css
  routes/App.tsx
  state/store.ts
  core/schemas.ts
  core/validators.ts
  core/io/exportEsqproj.ts
  core/io/exportCsv.ts
  core/io/exportHtmlSpec.ts
  components/
    Toolbar.tsx
    LeftNav.tsx
    EditorCanvas.tsx
    Inspector.tsx
  ui/nodes.tsx
```

---
## 4. Data Modeling (`core/schemas.ts`)
Define minimal entities:
- Workspace { id, name, createdAt, updatedAt, nodes[], edges[], questions[], visitTypes[], pools[] }
- Node { id, kind, questionId?, visitTypeId?, poolId?, position {x,y}, meta? }
- Edge { id, from, to, label?, conditions?[] }
- Question { id, name, prompt, type, options?, validation? }

Keep enums narrow (QuestionType, NodeKind).

---
## 5. State Management (`state/store.ts`)
Use Zustand:
- `ws` (current workspace) + mutators: addNode, updateNode, deleteNode
- Edge CRUD
- Question / VisitType / Pool CRUD
- Persistence: `save()` serializes to localStorage
- `loadLastWorkspace()` restores last saved workspace
- Selection slice: selectedNodeId, selectedEdgeId

Pattern:
```ts
const useEditor = create<EditorState>()((set,get)=>({...}))
const useSelection = create<SelectionState>()(...)
```

---
## 6. Core Components
### Toolbar
- New workspace
- Save (local)
- Import / Export `.esqproj`
- Export Spec (HTML)
- Export CSV (Questions, Rules)
- Validate (using validators)

### LeftNav
- Lists Nodes, Questions, Visit Types, Pools
- Quick create via `prompt()` (can later replace with modals)
- Drag source for creating nodes on canvas (uses HTML5 DnD with custom MIME type `application/esq`).

### EditorCanvas
- Uses `reactflow`
- Derives `nodes` + `edges` from workspace
- Implements `onConnect`, `onNodesChange`, `onEdgesChange`, `onEdgeUpdate`
- Custom node types implemented in `ui/nodes.tsx`
- Keyboard shortcut: `N` to add a question node placeholder
- Drop handler maps dragged entity to a new graph node

### Inspector
Tabs: Manage | Node | Edge | AI (stub)
- Manage: Quick create Question / Visit Type / Pool
- Node: shape + color meta editing
- Edge: label editing
- AI: placeholder
- Feedback + simple progress bar (local state only)

---
## 7. Styling (`app.css`)
- Define CSS variables for theme: panel background, lines, accent colors
- Flex layout: `.app` column; header (toolbar) + body grid (left nav / canvas / inspector / questionnaire)
- Panels styled with subtle borders + radius
- Node pills with variant classes (`is-start`, `is-question`, etc.)

---
## 8. Export Utilities (`core/io/`)
1. `exportEsqproj.ts` → JSON blob `{workspace}`
2. `exportCsv.ts` → two functions: questions + rules (edges conditions)
3. `exportHtmlSpec.ts` → Basic printable HTML with tables

All return `{ blob, name }` and are consumed by Toolbar using `file-saver`.

---
## 9. Validation (`core/validators.ts`)
Return array of issues:
- Unlinked nodes
- Edges referencing missing nodes
- Questions not referenced by any node (warning)
- Cycles (optional / TODO)

Shape:
```ts
interface Issue { kind: 'error'|'warn'; code: string; message: string }
```

---
## 10. Questionnaire Logic Example
For the 3-level conditional example:
- Root Q1 (Yes/No)
- Show Q2 if Q1 = Yes
- Show Q3 if Q2 = Yes
- Visit Type auto-switch examples can be represented as edge conditions or a future `rules` engine collection.

Data structure (future):
```ts
interface Rule { id; type:'condition'|'visitType'; when: ConditionExpr[]; action: Action }
```
Simplify initially by embedding conditions on edges or local questionnaire component.

---
## 11. Minimal Implementation Order
1. Scaffolding + dependencies
2. Schemas + store
3. Basic layout + Toolbar
4. LeftNav listing + create primitives
5. React Flow integration (EditorCanvas + node types)
6. Inspector tabs
7. Export utilities
8. Validation
9. Questionnaire sample component
10. Polish styling + persistence

---
## 12. Running & Building
Dev:
```
pnpm dev
```
Preview (after build):
```
pnpm build
pnpm preview
```
Add helpful scripts to `package.json` if missing.

---
## 13. Future Enhancements
- Dedicated modal/forms instead of `prompt()`
- Rule builder UI (tree or DSL chips)
- Undo/redo stack
- Autosave debounce
- Tagging / categorization
- Theming / dark mode
- Import from Draw.IO (`importDrawioXml`) expansion
- AI tab integration (suggest follow-up questions, detect unreachable nodes)

---
## 14. Deployment Notes
- Static hosting (Netlify / Vercel / Azure Static Web Apps) – just publish `dist/`.
- Ensure no PHI or sensitive data in exported artifacts.
- Add version stamping (build time) to spec export.

---
## 15. Cleanup Strategy (Slim Mode)
To reduce to essentials keep only:
- `index.html`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `REBUILD_GUIDE.md`
- `src/app.css`
- `src/main.tsx`
- `src/routes/App.tsx`
- `src/state/store.ts`
- `src/core/{schemas.ts,validators.ts}`
- `src/core/io/{exportEsqproj.ts,exportCsv.ts,exportHtmlSpec.ts}`
- `src/components/{Toolbar.tsx,LeftNav.tsx,EditorCanvas.tsx,Inspector.tsx}`
- `src/ui/nodes.tsx`

(Previously optional files like Mermaid export & DynamicQuestionnaire are removed in this slim set.)

---
## 16. Wipe & Rebuild Checklist
[ ] Confirm backup not needed
[ ] Archive current folder (zip) OR commit git branch
[ ] Delete non-essential files (as listed above)
[ ] Verify app still builds
[ ] Incrementally reintroduce advanced features

---
## 17. Quick Start Script (Optional)
Bash snippet to recreate minimal src skeleton after wipe:
```bash
rm -rf src
mkdir -p src/{core,state,routes,components,ui}
# then recreate files per sections above
```

---
## 18. Support
This guide is self-contained. Use it to fully reproduce the working minimal ESQ Studio. Extend deliberately—add one feature at a time and re-run validation & exports.

---
Happy rebuilding!
