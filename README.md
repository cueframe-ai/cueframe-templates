# CueFrame templates

Real, editable video templates that show what CueFrame is best at. Each
template is ONE document, `<slug>/template.cueframe`: a frozen composition with
`{{name}}` references, typed parameters, its components by value, a brand kit,
presets, a review rubric, provenance and gallery metadata. The desktop app, the
CLI, MCP and `/v1/templates` all read this same file; nothing here is
reconstructed from prose.

The machine-readable catalog is [`templates.json`](./templates.json)
(`schemaVersion: 2`), generated from the published documents by
`node tools/catalog.mjs`. Drafts (no hosted render and poster yet) are in the
repository but not in the catalog.

## Templates

| Slug | What it is | Status |
| --- | --- | --- |
| [`yosemite-warp-text`](./yosemite-warp-text) | Oversized WebGL typography over waterfall footage; presets `carved` and `granite` | published |
| [`yosemite-peregrines`](./yosemite-peregrines) | A ranger's talking-head beat with a behind-subject title and word-timed captions | published |
| [`device-ui-motion`](./device-ui-motion) | A glass-UI showcase on a baked phone mesh | draft |

Samples and prepared mattes live on `cdn.cueframe.ai`, pinned by sha256 in
each document; nothing binary is committed here.

## Use a template

- **Desktop app:** Home, "From template", pick the `template.cueframe`, fill
  its parameters (or use the sample), Create. A template is only ever read.
- **API:** `POST /v1/templates/<slug>/apply { projectId, values, media, preset? }`
  binds it into a project; `POST /v1/templates/<slug>/renders` renders one row
  with a share link. The public catalog is served at
  `https://api.cueframe.ai/catalog/templates.json`.
- **Agents:** `get_template` reads a template by reference, `apply_template`
  applies it; the server installs the components, so no source passes through
  the model.
- **CLI:** `cueframe template run <slug> --media source=sample` (ships with the
  next CLI release; until then the `recipe` commands read the older files).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Validate every document, bind every
preset with its samples, and check the catalog with:

```bash
npm install
npm run setup     # installs the pre-push hook
npm run validate
```

## Until the cutover

The older `recipe.cueframe`, `composition.template.json`, `recipes.json` and
per-recipe builders stay beside the documents until every released reader has
moved to templates; they are then deleted.

Templates are licensed under [AGPL-3.0-only](./LICENSE).
