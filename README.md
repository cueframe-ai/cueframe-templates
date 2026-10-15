# CueFrame templates

Real, editable video templates that show what CueFrame is best at. Each
template is ONE document, `<slug>/template.cueframe`: a frozen composition with
`{{name}}` references, typed parameters, its components by value, a brand kit,
presets, a review rubric, provenance and gallery metadata. The desktop app, the
CLI, MCP and `/v1/templates` all read this same file; nothing here is
reconstructed from prose.

The machine-readable catalog is [`templates.json`](./templates.json)
(`schemaVersion: 2`), generated from the published documents by
`node tools/catalog.mjs`. Each row pins the document SHA-256 and points to a
content-addressed copy in [`artifacts/`](./artifacts); old copies stay so a
catalog read during publication still resolves the exact document it named.
Do not edit an artifact. Drafts (no hosted render and poster yet) are in the
repository but not in the catalog.

## Templates

| Slug | What it is | Status |
| --- | --- | --- |
| [`yosemite-warp-text`](./yosemite-warp-text) | An oversized title card over waterfall footage; presets `carved` and `granite` | published |
| [`yosemite-peregrines`](./yosemite-peregrines) | A ranger's talking-head beat with a behind-subject title and word-timed captions | published |
| [`device-ui-motion`](./device-ui-motion) | A glass-UI showcase on a baked phone mesh | withdrawn until a native port (see CHANGELOG) |

Samples and prepared mattes live on `cdn.cueframe.ai`, pinned by sha256 in
each document; nothing binary is committed here.

## Use a template

- **Desktop app:** Projects → From template, choose a catalog document or open
  a local `template.cueframe`, fill its parameters (or use the sample), then
  Create. Preparation finishes on Projects before Open becomes available.
  A template is only ever read.
- **API:** `POST /v1/templates/<slug>/apply { projectId, values, media, preset? }`
  binds it into a project; `POST /v1/templates/<slug>/renders` renders one row
  with a share link. The public catalog is served at
  `https://api.cueframe.ai/catalog/templates.json`.
- **Agents:** `get_template` reads a template by reference, `apply_template`
  applies it; the server installs the components, so no source passes through
  the model.
- **CLI:** `cueframe template run <slug> --media source=sample` (ships with the
  next CLI release).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Validate every document, bind every
preset with its samples, and check the catalog with:

```bash
npm install
npm run setup     # installs the pre-push hook
npm run catalog   # updates catalog and writes new immutable document copies
npm run validate  # includes npm run check: what the HyperFrames-only kernel refuses
```

## Recipe-era files

The recipe format that preceded template documents is gone: the builders,
`composition.template.json`, `draft-recipes.json`, the recipe validator,
`recipes.json` and the per-template `recipe.cueframe` projects were deleted
after the 2026-10-14 cutover, once `cueframe.ai` read `templates.json`. The
frozen projects remain in history. The withdrawn `device-ui-motion` draft keeps
its own `recipe.cueframe` beside its source until a native port exists.

Templates are licensed under [AGPL-3.0-only](./LICENSE).
