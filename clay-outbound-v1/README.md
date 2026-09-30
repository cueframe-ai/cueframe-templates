# Outbound in thirty seconds

A 30-second, 16:9 film for one prospect, built from a table row: four card
beats (hook, pain, proof, ask), their logo in the corner, one accent color.
No footage, so every render is the values you send and nothing else.

The document is [`template.cueframe`](./template.cueframe). Its parameters:

| Parameter | Type | Notes |
| --- | --- | --- |
| `firstName`, `company` | string | the prospect |
| `pain` | string | one sentence, at most 120 characters |
| `outcome` | string | what you sell, at most 80 characters |
| `metricValue`, `metricLabel` | number, string | the proof beat |
| `logo` | image | PNG on transparent; the sample is the CueFrame wordmark |
| `cta` | string | defaults to "Book 15 minutes" |
| `senderName` | string | defaults to "The CueFrame team" |
| `accent` | color | defaults to `#f7c948`; presets `amber` and `mint` set it |

## Render one row

```http
POST https://api.cueframe.ai/v1/templates/clay-outbound-v1/renders
Idempotency-Key: <row key>
Authorization: Bearer <api key>

{ "preset": "amber",
  "values": { "firstName": "Ada", "company": "Lovelace Ltd", "pain": "Every deal waits a week for a deck.",
              "outcome": "a personal video per prospect", "metricValue": 41, "metricLabel": "percent more replies" },
  "media": { "logo": { "url": "https://example.com/lovelace.png" } } }
```

The answer carries `shareUrl` (a page that redirects to the MP4 once the render
is complete) and `posterUrl`; poll `GET .../renders/<id>` for `status`. Change
the row key to re-run a fixed row. Twenty renders a minute per key.

## Review

`rubric.md` is inline in the document: poster at 3 seconds; preview 3, 10, 18
and 26 seconds; the logo stays top-right on every beat.

Draft until its render and poster exist.
