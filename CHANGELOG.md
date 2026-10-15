# Changelog

## 2026-10-14: gallery renders from the HyperFrames-only engine

Both published templates were re-rendered on production (cutover build
`fcaed5d75`, kernel 0.7.1) from `start_template` with `{ sample: true }` media,
and the gallery `render` and `poster` now point at those films:

| Template | Project / render | Hosted at |
| --- | --- | --- |
| `yosemite-peregrines` | `prj_c1e165601491444cbe481da832d1db19` / `q578j4e57c2z8eqa261hg2skz58gbxzw` | `cueframe.ai/demo/yosemite-peregrines-native.mp4`, `cueframe.ai/showcase/yosemite-peregrines-native-poster.jpg` |
| `yosemite-warp-text` (`carved`) | `prj_779f78973d0845498580208751439670` / `q570mn6zkejvpqg2e05sntqx898gacxc` | `cueframe.ai/demo/yosemite-warp-text-native.mp4`, `cueframe.ai/showcase/yosemite-warp-text-native-poster.jpg` |

The earlier films (with the grade and the warp) stay at their old URLs.
`yosemite-warp-text`'s description, details, prompt, rubric and provenance no
longer promise a grade or a shader warp; `yosemite-peregrines`'s rubric no
longer names a grade. New document digests: `yosemite-peregrines`
`48de8831bf5f8bb2ff9ef167c389b1124fc40a08eac135704bb6579c624c566c`, `yosemite-warp-text` `77dcae96145c2c319a4db2b410e28daf69fd07ba8effc02dcabc7c8041226420`.

The recipe-era files that nothing reads any more are deleted: the recipe
validator (`validate-recipes.mjs`, `tools/validate-recipes.mjs`),
`draft-recipes.json`, and the per-template builders and their inputs
(`build-project-template.mjs`, `composition.template.json`, `brand-kit.json`,
`packed-matte.mp4.base64`, `rubric.md`, `cueframe.json` and the TSX WarpText
source under `yosemite-warp-text/cueframe/`). `recipes.json` and both
`recipe.cueframe` projects stay, frozen, because `cueframe.ai` fetches the
manifest at build time and links the projects; `recipes.json` carries the new
render and poster URLs so the landing site shows the same films.

## 2026-10-14: tools pinned to the published kernel 0.7.1

`package.json` pins `@cueframe/kernel` 0.7.1 from npm (it was 0.2.64). The
kernel's optional peers that the check imports are pinned beside it:
`@babel/parser`, `linkedom`, `@hyperframes/parsers` and `@hyperframes/lint`.
Every document passes `npm run validate` against 0.7.1 and 0.7.0; no document
changed, so the catalog digests are unchanged.

## 2026-10-13: HyperFrames-native catalog (kernel 0.6.0)

Every document now passes the HyperFrames-only kernel: `npm run check`
(`tools/kernel-check.mjs`, also run by `npm run validate` and the pre-push
hook) refuses retired effects, the retired `animate` keyframe record,
primitives outside the kernel's primitive catalog, component placements that
do not execute natively and TSX component sources. The tools need
`@cueframe/kernel` 0.6.0: move the `package.json` pin and `package-lock.json`
to it (`npm install @cueframe/kernel@0.6.0 --save-exact`) once it is published.

| Template | Before | Substitution |
| --- | --- | --- |
| `yosemite-peregrines` | `peregrines-source` carried the built-in `color-grade` and `vignette` effects (`effect_retired`) | Both effects removed; there is no native successor yet. The behind-subject title stays the kept `heroText` primitive, unchanged. |
| `yosemite-warp-text` | `upper-falls-main` carried `color-grade`; the title was a by-value TSX (Remotion) WebGL2 component with no native successor | Grade removed. The title is a native `card` clip with the same id, timing, layout, type, `{{text}}`/`{{color}}` parameters, fades, detail lines and logo. The WarpText shader distortion is gone: the native scene runtime has no custom-shader component yet. |
| `outbound-personal-30s` (draft) | Four clips stored the retired `animate` record; the bed used the removed `dither-gradient-bg` primitive | Keyframes moved to HyperFrames-shaped `tweens` by the kernel's stored-data migration (`upgradeLegacyCompositionKeyframes`). The bed is a `card` gradient in the same palette, direction and drift, with the same tweens; the ordered-dither texture is not reproduced. |
| `device-ui-motion` (draft) | A by-value TSX WebGL phone-mesh component with an `assets` placement; no native successor | Document withdrawn (its source stays under `device-ui-motion/`) until a native port exists. |

New document digests: `yosemite-peregrines` `bd7b95be3166875aafc69f742e8f030818ef5ce21b9da74da3aa79df3a2f8815`,
`yosemite-warp-text` `e5737626a01badb4e75b9172950ab89d611e2a45f4f64706608e3e9ed516542d`.
The earlier artifacts stay in `artifacts/` (immutable).

The gallery renders and posters of both published templates showed the earlier
films (the grade and the warp) until the 2026-10-14 re-render above.
