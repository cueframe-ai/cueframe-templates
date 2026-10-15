# Yosemite Peregrines

[`template.cueframe`](./template.cueframe) is the one document every CueFrame
surface reads. It turns one continuous Yosemite ranger clip into a cinematic
talking-head beat: `PHENOMENAL` spans most of the frame as the ranger says the
word, while CueFrame's prepared subject matte keeps his face and shoulders
cleanly in front. The original spoken audio remains intact and word-timed
captions sit above the bottom safe area.

[Watch the published render](https://cueframe.ai/demo/yosemite-peregrines-native.mp4).

- Parameter: `source` (video). The sample is the full NPS master, sha-pinned on
  `cdn.cueframe.ai`; the document carries the prepared matte by URL together
  with its geometry sidecar (`4aa54bdd6d0d.geometry.json`), and the matte
  attaches only to that exact file.
- The title is a `heroText` overlay on the `behind-subject` depth plane. One
  video clip carries the complete `83.616-93.359` source window; the renderer
  binds the `84.816-87.566` matte window to that clip without cutting the take.
- The document's brand kit supplies the CueFrame mark and caption profile; the
  title binds its ink and Instrument Serif face through `$brand:` tokens.
- The document's `rubric` records the sampled beats and kill criteria; preview
  the named frames before publishing a render.

## Reproduce it

- **Desktop app:** Projects → From template → `yosemite-peregrines`, keep the
  sample, Create. Preparation finishes on Projects before Open is available.
- **API:** `POST /v1/templates/yosemite-peregrines/apply { projectId, media: { source: { sample: true } } }`,
  then `POST /v1/projects/<id>/renders`.
- **Agents:** `start_template` with `media: { source: { sample: true } }`,
  `wait_job(kind: "template")`, then `create_render`.

## Source and reuse

Source: National Park Service, Yosemite National Park,
[“Peregrine Falcons in Yosemite”][source]. Preserve the source credit and verify
the publisher's current reuse guidance for your intended distribution. This
repository distributes the template and links to the finished render; it does
not distribute the source master.

The older `recipe.cueframe` beside this file is the frozen v4 recipe project
that `cueframe.ai` still links; no CueFrame surface reads it. The colour grade
and vignette of the earlier film were retired with the HyperFrames-only kernel
(see the [CHANGELOG](../CHANGELOG.md)).

[source]: https://www.nps.gov/media/video/view.htm?id=53135a56-4998-4d6e-b26d-24fe0acca1c3
