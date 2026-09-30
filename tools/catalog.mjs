#!/usr/bin/env node
// templates.json, generated from the published documents: one row per
// template with its presets, and one brand kit row per document kit and per
// preset kit under the namespaced ids apply and render write
// (`template:<slug>` and `template:<slug>:<preset>`), so two templates never
// merge a kit. `node tools/catalog.mjs [root]` writes the file.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseTemplateDocument } from '@cueframe/kernel/component-runtime/template';

export const CATALOG_FILE = 'templates.json';
export const REPOSITORY = 'cueframe-ai/cueframe-templates';
const TREE = `https://github.com/${REPOSITORY}/tree/main`;
const RAW = `https://raw.githubusercontent.com/${REPOSITORY}/main`;
const SKIPPED = new Set(['tools', 'assets', 'node_modules']);

/** The catalog rows and kits for one parsed document; null for a draft. */
export function catalogEntry(doc) {
  const gallery = doc.gallery;
  if (gallery?.status !== 'published') return null;
  const presets = Object.entries(doc.presets ?? {}).map(([name, preset]) => ({
    name,
    label: preset.label,
    ...(preset.gallery?.poster ? { poster: preset.gallery.poster } : {}),
    ...(preset.gallery?.render ? { render: preset.gallery.render } : {}),
    ...(preset.gallery?.description ? { description: preset.gallery.description } : {}),
    ...(preset.brandKit ? { brandKit: `template:${doc.slug}:${name}` } : {}),
  }));
  const template = {
    slug: doc.slug,
    title: doc.name,
    ...(gallery.category ? { category: gallery.category } : {}),
    ...(gallery.format ? { format: gallery.format } : {}),
    ...(gallery.duration ? { duration: gallery.duration } : {}),
    ...(gallery.render ? { render: gallery.render } : {}),
    ...(gallery.poster ? { poster: gallery.poster } : {}),
    ...(doc.description ? { description: doc.description } : {}),
    transcriptExcerpt: gallery.transcriptExcerpt ?? null,
    ...(gallery.details ? { details: gallery.details } : {}),
    ...(gallery.prompt ? { prompt: gallery.prompt } : {}),
    template: `${TREE}/${doc.slug}`,
    projectTemplate: `${RAW}/${doc.slug}/template.cueframe`,
    ...(doc.provenance ? { original: { label: doc.provenance.label, ...(doc.provenance.href ? { href: doc.provenance.href } : {}) } } : {}),
    parameters: doc.parameters.map((p) => ({ name: p.name, type: p.type, required: p.required, ...(p.type === 'media' ? { kind: p.kind } : {}), ...(p.label ? { label: p.label } : {}) })),
    presets,
  };
  const brandKits = [];
  if (doc.brandKit) brandKits.push({ kitId: `template:${doc.slug}`, name: doc.brandKit.name, fromTemplate: doc.slug, colors: doc.brandKit.colors, headingFont: doc.brandKit.headingFont, bodyFont: doc.brandKit.bodyFont });
  for (const [name, preset] of Object.entries(doc.presets ?? {})) {
    if (!preset.brandKit) continue;
    brandKits.push({ kitId: `template:${doc.slug}:${name}`, name: preset.brandKit.name, fromTemplate: doc.slug, fromPreset: name, colors: preset.brandKit.colors, headingFont: preset.brandKit.headingFont, bodyFont: preset.brandKit.bodyFont });
  }
  return { template, brandKits };
}

/** The catalog JSON text for the repo at `root`. */
export async function render(root) {
  const templates = [];
  const brandKits = [];
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || SKIPPED.has(entry.name)) continue;
    let raw;
    try {
      raw = await readFile(join(root, entry.name, 'template.cueframe'), 'utf8');
    } catch {
      continue;
    }
    let doc;
    try {
      doc = parseTemplateDocument(JSON.parse(raw));
    } catch {
      // The validator names it; the catalog carries only documents the kernel accepts.
      continue;
    }
    const catalog = catalogEntry(doc);
    if (!catalog) continue;
    templates.push(catalog.template);
    brandKits.push(...catalog.brandKits);
  }
  return `${JSON.stringify({ schemaVersion: 2, templates, brandKits }, null, 2)}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
  await writeFile(join(root, CATALOG_FILE), await render(root));
  console.log(`wrote ${join(root, CATALOG_FILE)}`);
}
