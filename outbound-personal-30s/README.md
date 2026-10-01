# A thirty-second film for one prospect

**Draft. Not listed and not published.** It is waiting for the founder to watch it, and it fails part of the film quality bar (see Review).

A personal outbound film built from one table row. It has six overlapping beats:

1. the prospect's name, their company and their logo;
2. the idea;
3. their pain;
4. one proof number;
5. the ask;
6. the call to action, with their logo.

The type is kinetic and comes in word by word under a slow camera push. It sits over a drifting dither ground with an amber light and parallax chapter numerals. A music bed runs throughout, with hits on every beat change.

The document is [`template.cueframe`](./template.cueframe).

## Parameters

| Parameter | Type | Notes |
| --- | --- | --- |
| `firstName` | string | at most 12 characters (the name is set at 320 px on one line) |
| `company` | string | at most 40 characters |
| `pain` | string | one sentence, at most 70 characters |
| `outcome` | string | what you sell, at most 40 characters |
| `metricValue`, `metricLabel` | number (0 to 9999), string | the proof beat |
| `logo` | image | PNG on transparent, light ink |
| `cta` | string | defaults to "Book 15 minutes" |
| `senderName` | string | defaults to "The CueFrame team" |
| `accent` | color | defaults to `#f7c948` |
| `music`, `sfxWhoosh`, `sfxRiser`, `sfxImpact`, `sfxResolve`, `sfxTick` | audio | the sound design; pass `{ "sample": true }` for the house sounds (CC0 packs) |

The six sound parameters are required. A document cannot yet carry fixed pack audio, and an optional media parameter does not fall back to its sample (CUE-645). Callers therefore pass `{ "sample": true }` for each one.

```http
POST https://api.cueframe.ai/v1/templates/outbound-personal-30s/renders
Idempotency-Key: <row key>

{ "preset": "amber",
  "values": { "firstName": "Ada", "company": "Lovelace Ltd", "pain": "Every deal waits a week for a deck.",
              "outcome": "a personal video per prospect", "metricValue": 41, "metricLabel": "percent more replies" },
  "media": { "logo": { "url": "https://example.com/lovelace.png" },
             "music": { "sample": true }, "sfxWhoosh": { "sample": true }, "sfxRiser": { "sample": true },
             "sfxImpact": { "sample": true }, "sfxResolve": { "sample": true }, "sfxTick": { "sample": true } } }
```

## How it was made

It was composed on staging through the MCP (`apply_composition`, `preview_frame`, `create_render`) from product parts only:

- the `dither-gradient-bg` primitive;
- card clips driven by the card motion runtime (`--cf-t`, `--cf-progress`);
- clip keyframes for the camera and the fades;
- the CC0 music and SFX packs.

It took six rendered iterations, each watched and checked on a 1 fps contact sheet against the bar.

## Review against the film quality bar (2026-09-30)

| Section | Result |
| --- | --- |
| 1. Motion never stops | Pass. Every second changes, and beats overlap with a blur-out and blur-in. |
| 2. Camera and kinetic type | Pass. There is a push on every beat, a background dolly and drift, and word-staggered entrances. |
| 3. Layered depth | Partial. It has three planes (dither, light, type) and parallax numerals, but no footage. |
| 4. Full frame and safe areas | Pass at sample and longest values (stress-tested). The ask and CTA beats leave the lower third quiet. |
| 5. DESIGN.md typography | **Fail.** The hosted lane cannot draw Zodiak, DM Sans or JetBrains Mono (CUE-644). It uses Instrument Serif, Inter and Space Mono instead. The colours pass. |
| 6. Pacing | Pass. Beats run 4.8 to 6.4 s, and each holds its copy for at least 0.25 s per word. |
| 7. Sound | **Fail on the container.** The bed and hits pass and it measures -17 LUFS, but the MP4 carries PCM audio, not AAC (CUE-639). |

Before publishing:

- CUE-644 and CUE-639 are fixed and it is re-rendered;
- the founder has watched it;
- the sample logo is re-hosted on `cdn.cueframe.ai` (the staging render used a fictional "Lovelace" wordmark, and the document's sample is still the CueFrame wordmark).
