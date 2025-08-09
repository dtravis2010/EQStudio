# ESQ Studio – MVP+ (with Banks + Vision Extractor)

Local-first tool to design and validate scheduling questionnaires. Epic-inspired UI (no EMR integration).

## Run it

```bash
pnpm i
pnpm dev
```

Open the URL shown (usually [http://localhost:5173](http://localhost:5173)).

## One-time: set your vision API key (OpenAI)

In the app (or browser devtools console), run:

```js
localStorage.setItem('OPENAI_KEY','YOUR_OPENAI_API_KEY')
```

Now the **AI → Extract from Image** button will work with screenshots (PNG/JPG).

> You can rotate providers later—this build wires OpenAI gpt-4o-mini. (Claude/Gemini wiring points live in `src/core/aiProvider.ts`).

## QuickStart

- Toolbar → **New** workspace → **N** to add nodes → drag to connect edges.
- Select a node/edge → edit in **Inspector** tabs.
- **Validate** to check orphans/missing edges/slug style.
- **Export** → `.esqproj` / **Spec (HTML)** / **CSVs**.

## Visit Type & Pool Banks

Left panel shows **Visit Type Bank** and **Pool Bank** (from `workspace.library`). Click **➕** to clone into workspace. Categories are plain text fields (e.g., `MRI`, `CT`).

## Vision Extractor

- Inspector → **AI** tab → upload PNG/JPG of an Epic questionnaire.
- The AI returns **only supported types** (YesNo, SingleSelect, MultiSelect, FreeText, Number, Date, Time, DateTime).
- You get a **Preview** to approve → adds questions to workspace.

## MRI Sample

Import `samples/mri-brain-wwo.esqproj` via Toolbar → Import.
Then **Validate** and try a test traversal once you add edges.

## Exports

- **Spec HTML** (Print → Save as PDF) – with Texas Health blue/green header
- **Questions CSV** and **Rules CSV**

## Notes

- Everything is **local**. No server. `.esqproj` is a single JSON file.
- Draw.io Importer is a basic stub (parses XML text only) – real mapping coming next.
- Test Run UI can be added next to show live path & explain-why (engine ready at `src/core/engine.ts`).

© 2025-08-08
