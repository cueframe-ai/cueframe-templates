#!/usr/bin/env node
// What the HyperFrames-only kernel refuses in a template document, beyond parsing: retired built-in
// effects (`effect_retired`), the retired `animate` keyframe record, retired component placements, overlay primitives outside the kept
// primitive catalog, component placements that do not execute natively (version 4) or pin a retired
// source, by-value components that are not admitted V4 sources, and each binding (no preset and every
// preset, sample media) through the kernel's full composition validation. `validate.mjs` runs it for
// every document; `node tools/kernel-check.mjs [root]` prints it per template, the CI-style gate.
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bindTemplate, parseTemplateDocument } from '@cueframe/kernel/component-runtime/template';
import { assertNoRetiredEffects, findRetiredComponentClips } from '@cueframe/kernel/composition/validators/retired-effects';
import { getPrimitiveCatalogMeta, isPrimitiveDisabled } from '@cueframe/kernel/composition/primitive-catalog';
import { RETIRED_SOURCE_REPLACEMENTS, retiredComponentSourceKind } from '@cueframe/kernel/component-runtime/retired';
import { admitComponentSourceV4 } from '@cueframe/kernel/component-runtime/v4';
import { validateComposition } from '@cueframe/kernel/core/render';
import { hasLegacyKeyframes } from '@cueframe/kernel/composition/timeline';

const message = (error) => (error instanceof Error ? `${error.code ? `${error.code}: ` : ''}${error.message}` : String(error));

/** The sample media a published document binds with `{ sample: true }`. */
export function sampleMedia(doc) {
  const media = {};
  for (const p of doc.parameters) {
    if (p.type !== 'media' || !p.sample) continue;
    media[p.name] = { mediaId: `sample:${p.name}`, kind: p.kind, ...(p.sample.durationSec !== undefined ? { durationSec: p.sample.durationSec } : {}) };
  }
  return media;
}

/**
 * The kernel's refusals of one raw document (parsed JSON); an empty list is a pass. `bindErrors: false`
 * leaves a binding that fails to its caller (validate.mjs reports those itself) and checks only the
 * compositions that bind.
 */
export async function kernelProblems(raw, { bindErrors = true } = {}) {
  const problems = [];
  const composition = raw?.composition;
  try { assertNoRetiredEffects(composition); } catch (error) { problems.push(message(error)); }
  if (hasLegacyKeyframes(composition)) problems.push('a clip carries the retired `animate` keyframe record; store HF-shaped `tweens` (clip.setKeyframes)');
  for (const { clipId, componentId } of findRetiredComponentClips(composition)) {
    problems.push(`clip ${clipId}: component ${componentId} pins no version (retired placement)`);
  }
  for (const track of composition?.tracks ?? []) {
    for (const clip of track.contents ?? []) {
      const source = clip.source ?? {};
      if (source.primitiveId && (source.kind === 'overlay' || source.kind === 'effect')) {
        if (!getPrimitiveCatalogMeta(source.primitiveId) || isPrimitiveDisabled(source.primitiveId)) {
          problems.push(`clip ${clip.id}: primitive ${source.primitiveId} is not in the kernel's primitive catalog`);
        }
      }
      if (source.kind !== 'component') continue;
      const pin = source.execution;
      if (pin?.version !== 4) {
        problems.push(`clip ${clip.id}: component ${source.componentId} executes as version ${pin?.version ?? 'none'}, not natively (4)`);
        continue;
      }
      const successor = RETIRED_SOURCE_REPLACEMENTS[pin.sourceVersionId];
      if (successor) problems.push(`clip ${clip.id}: pins retired V3 source ${pin.sourceVersionId}; repin to ${successor.componentId}@${successor.sourceVersionId}`);
      else if (retiredComponentSourceKind(pin.sourceVersionId, raw.components?.[source.componentId]?.source)) problems.push(`clip ${clip.id}: pins retired source ${pin.sourceVersionId}`);
    }
  }
  for (const [id, component] of Object.entries(raw?.components ?? {})) {
    if (typeof component?.source?.tsxSource === 'string') {
      problems.push(`component ${id}: a retired TSX (Remotion) source; a template carries V4 (HyperFrames) sources only`);
      continue;
    }
    try { await admitComponentSourceV4(component.source); } catch (error) { problems.push(`component ${id}: ${message(error)}`); }
  }
  let doc;
  try {
    doc = parseTemplateDocument(raw);
  } catch (error) {
    return [...problems, `does not parse: ${message(error)}`];
  }
  const media = sampleMedia(doc);
  const published = doc.gallery?.status === 'published';
  for (const preset of [undefined, ...Object.keys(doc.presets ?? {})]) {
    let bound;
    try {
      bound = bindTemplate(doc, {}, media, preset === undefined ? {} : { preset });
    } catch (error) {
      // A draft may lack a sample or a default for a required parameter; validate.mjs owns that rule.
      if (!bindErrors || (!published && /required/.test(message(error)))) continue;
      problems.push(`preset ${preset ?? '(none)'}: ${message(error)}`);
      continue;
    }
    try { validateComposition(bound); } catch (error) { problems.push(`preset ${preset ?? '(none)'}: ${message(error)}`); }
  }
  return problems;
}

async function main() {
  const root = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
  let failed = 0;
  let checked = 0;
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || ['tools', 'assets', 'artifacts', 'node_modules'].includes(entry.name)) continue;
    let text;
    try { text = await readFile(join(root, entry.name, 'template.cueframe'), 'utf8'); } catch { continue; }
    checked++;
    const problems = await kernelProblems(JSON.parse(text));
    if (problems.length === 0) { console.log(`ok ${entry.name}`); continue; }
    failed++;
    console.error(`FAIL ${entry.name}`);
    for (const problem of problems) console.error(`  ${problem}`);
  }
  if (checked === 0) { console.error(`FAIL no template.cueframe under ${root}`); failed++; }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
