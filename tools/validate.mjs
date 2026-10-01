#!/usr/bin/env node
// Every template document in the repo: parsed by the kernel, its references
// declared and placed, every preset bound with `{ sample: true }` media, its
// prepared mattes at the kernel's bake version, and the catalog up to date.
// Exits non-zero naming each failing directory. `node tools/validate.mjs [root]`.
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  bindTemplate,
  checkReferences,
  parseTemplateDocument,
  CURRENT_MATTE_BAKE_VERSION,
} from '@cueframe/kernel/component-runtime/template';
import { render as renderCatalog, CATALOG_FILE } from './catalog.mjs';

export const SKIPPED_DIRS = new Set(['tools', 'assets', 'artifacts', 'node_modules']);
export const DOCUMENT_FILE = 'template.cueframe';
/** A template document stays well under the 1 MiB wire cap so a clone stays small. */
export const MAX_DOCUMENT_BYTES = 150 * 1024;

/** The problems with one directory's document; an empty list is a pass. */
export async function validateTemplateDir(root, dir) {
  const problems = [];
  let raw;
  try {
    raw = await readFile(join(root, dir, DOCUMENT_FILE), 'utf8');
  } catch {
    return null;
  }
  if (Buffer.byteLength(raw) > MAX_DOCUMENT_BYTES) {
    problems.push(`${DOCUMENT_FILE} is ${Buffer.byteLength(raw)} bytes; the limit is ${MAX_DOCUMENT_BYTES}`);
  }
  let doc;
  try {
    doc = parseTemplateDocument(JSON.parse(raw));
  } catch (error) {
    return [`does not parse: ${error instanceof Error ? error.message : String(error)}`];
  }
  if (doc.slug !== dir) problems.push(`slug ${doc.slug} does not match directory ${dir}`);
  const refs = checkReferences(doc);
  if (refs.undeclared.length) problems.push(`undeclared parameters: ${refs.undeclared.join(', ')}`);
  if (refs.misplaced.length) problems.push(`references outside a string leaf: ${refs.misplaced.join(', ')}`);
  if (refs.mediaSiteErrors.length) problems.push(...refs.mediaSiteErrors);
  const published = doc.gallery?.status === 'published';
  const media = {};
  for (const p of doc.parameters) {
    if (p.type !== 'media') continue;
    for (const [key, m] of Object.entries(p.prepared?.mattes ?? {})) {
      if (m.bakeVersion !== CURRENT_MATTE_BAKE_VERSION) {
        problems.push(`${p.name}: matte ${key} is ${m.bakeVersion}, the kernel bakes ${CURRENT_MATTE_BAKE_VERSION}`);
      }
      if (p.sample === undefined) problems.push(`${p.name}: a prepared matte needs the sample it was baked from`);
      if (published && !m.geometry) problems.push(`${p.name}: prepared matte ${key} needs a pinned geometry sidecar`);
      if (m.geometry) {
        const local = join(root, dir, `${key}.geometry.json`);
        try {
          const bytes = await readFile(local);
          const { createHash } = await import('node:crypto');
          if (createHash('sha256').update(bytes).digest('hex') !== m.geometry.sha256) problems.push(`${p.name}: geometry ${key} digest differs from ${local}`);
          const geometry = JSON.parse(bytes.toString('utf8'));
          if (geometry.matte_hash !== key || geometry.bake_version !== m.bakeVersion || !Array.isArray(geometry.frames) || geometry.frames.length === 0) {
            problems.push(`${p.name}: geometry ${key} does not describe its matte`);
          }
        } catch { problems.push(`${p.name}: geometry ${key} is missing or invalid`); }
      }
    }
    if (!p.sample) {
      if (published && p.required) problems.push(`media parameter ${p.name} has no sample; a published template binds every preset with { sample: true }`);
      continue;
    }
    media[p.name] = { mediaId: `sample:${p.name}`, kind: p.kind, ...(p.sample.durationSec !== undefined ? { durationSec: p.sample.durationSec } : {}) };
  }
  // A missing sample is reported once; binding would only restate it per preset.
  const bindable = !problems.some((problem) => /has no sample/.test(problem));
  for (const preset of bindable ? [undefined, ...Object.keys(doc.presets ?? {})] : []) {
    try {
      bindTemplate(doc, {}, media, preset === undefined ? {} : { preset });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // A draft may still lack a sample or a default for a required parameter; nothing else is excused.
      if (!published && /required/.test(message)) continue;
      problems.push(`preset ${preset ?? '(none)'}: ${message}`);
    }
  }
  return problems;
}

export async function validateRepo(root) {
  const results = [];
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || SKIPPED_DIRS.has(entry.name)) continue;
    const problems = await validateTemplateDir(root, entry.name);
    if (problems === null) continue;
    results.push({ dir: entry.name, problems });
  }
  const expected = await renderCatalog(root);
  let catalog = null;
  try {
    catalog = await readFile(join(root, CATALOG_FILE), 'utf8');
  } catch {
    catalog = null;
  }
  const catalogFresh = catalog === expected;
  const missingArtifacts = [];
  for (const row of JSON.parse(expected).templates) {
    try {
      const bytes = await readFile(join(root, 'artifacts', `${row.documentSha256}.cueframe`), 'utf8');
      if (bytes !== await readFile(join(root, row.slug, DOCUMENT_FILE), 'utf8')) missingArtifacts.push(row.slug);
    } catch {
      missingArtifacts.push(row.slug);
    }
  }
  return { results, catalogFresh, missingArtifacts };
}

async function main() {
  const root = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
  const { results, catalogFresh, missingArtifacts } = await validateRepo(root);
  let failed = 0;
  for (const { dir, problems } of results) {
    if (problems.length === 0) {
      console.log(`ok ${dir}`);
      continue;
    }
    failed++;
    console.error(`FAIL ${dir}`);
    for (const problem of problems) console.error(`  ${problem}`);
  }
  if (!catalogFresh) {
    failed++;
    console.error(`FAIL ${CATALOG_FILE} is stale; run node tools/catalog.mjs`);
  }
  for (const slug of missingArtifacts) {
    failed++;
    console.error(`FAIL immutable artifact for ${slug} is missing or changed; run node tools/catalog.mjs`);
  }
  if (results.length === 0) {
    failed++;
    console.error(`FAIL no ${DOCUMENT_FILE} found under ${root}`);
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
