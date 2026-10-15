# Carved by water

[`template.cueframe`](./template.cueframe) is the one document every CueFrame
surface reads: an 8-second landscape film in which an oversized title fades up
over Yosemite Upper Falls with the footage's own ambient sound.

[Watch the published render](https://cueframe.ai/demo/yosemite-warp-text-native.mp4).

- Parameters: `source` (video; the sample is pinned on `cdn.cueframe.ai`),
  `text` (the title, up to 40 characters, line breaks kept) and `color` (the
  title colour).
- Presets: `carved` (amber, the published film) and `granite` (pale stone
  greys with its own brand kit).
- The title is a native `card` clip: its typography, detail lines and logo are
  editable HTML, and the title and footage stay independent tracks.

## Reproduce it

- **Desktop app:** Projects → From template → `yosemite-warp-text`, keep the
  sample or choose your own footage, pick a preset, Create.
- **API:** `POST /v1/templates/yosemite-warp-text/apply { projectId, media: { source: { sample: true } }, preset: "carved" }`,
  then `POST /v1/projects/<id>/renders`.
- **Agents:** `start_template` with `media: { source: { sample: true } }` and
  `preset: "carved"`, `wait_job(kind: "template")`, then `create_render`.

Use footage you have permission to edit. The published render uses CueFrame's
archived Yosemite Upper Falls clip (the pinned sample).

## History

Until 2026-10-13 the title was a WebGL2 WarpText shader component (ported from
React Bits, MIT) and the footage carried a colour grade. Neither executes on
the HyperFrames-only kernel; the document now carries the native card and no
grade (see the [CHANGELOG](../CHANGELOG.md)).
