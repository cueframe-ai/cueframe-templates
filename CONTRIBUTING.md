# Contributing

A template is one document per directory, `<slug>/template.cueframe`, laid out:

```text
my-template/
├── template.cueframe          the document (kernel TemplateDocument, v: 1)
├── README.md                  use case, reproduction, attribution
└── components/<id>/src/       optional modular authoring source
```

## 1. Author it in the app

Make the project in the CueFrame desktop app, then save it as a template with
`save_as_template` (the desktop's MCP tool) and check it with `check_template`,
which applies the document to a scratch project with solid-colour probe media,
renders sampled stills and reports whether every media parameter appears. A
document written by hand must still pass `npm run validate`.

## 2. Components by value

A component travels inside the document under `components[id]` with its
`source` (`tsxSource` and manifest), `name`, `description`, `category` and
`propSchema`. Modular source goes under `components/<id>/src/`; bundle it into
the document with `node tools/bundle.mjs <slug> <id> [entry]`.

## 3. Media samples

A media parameter that a published template binds needs a `sample`: a public
https file on `cdn.cueframe.ai`, pinned by `sha256`. Name the source and its
license in the pull request; a maintainer re-hosts it. Never commit media.

## 4. Presets and the kit

`presets` carry values for the non-media parameters and, optionally, a brand
kit; media never rides a preset. The catalog writes the document kit as
`template:<slug>` and each preset kit as `template:<slug>:<preset>`.

## 5. Validate and submit

```bash
npm install && npm run setup
npm run validate
npm run catalog   # regenerates templates.json
```

The pre-push hook runs the validator. Open a pull request; merges land as
`gallery.status: "draft"` until a render and poster exist.
