#!/usr/bin/env node
// Bundle a template component's modular source into its document:
// `node tools/bundle.mjs <slug> <componentId> [entry]` bundles
// `<slug>/components/<componentId>/src/<entry>` (default index.jsx) with esbuild,
// packages external, and writes it to `components[componentId].source.tsxSource`
// of `<slug>/template.cueframe`. Nothing else in the document changes.
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

export async function bundleComponent(root, slug, componentId, entry = 'index.jsx') {
  const dir = join(root, slug, 'components', componentId, 'src');
  const bundled = await build({
    absWorkingDir: dir,
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'chrome144',
    jsx: 'preserve',
    // Only the component's own modules are bundled; React, Remotion, three and
    // the CueFrame runtime are admitted by the import policy at install.
    packages: 'external',
    logLevel: 'silent',
  });
  const tsxSource = bundled.outputFiles[0].text;
  const file = join(root, slug, 'template.cueframe');
  const doc = JSON.parse(await readFile(file, 'utf8'));
  const component = doc.components?.[componentId];
  if (!component) throw new Error(`${slug}/template.cueframe has no component ${componentId}`);
  component.source = { ...component.source, componentId, tsxSource };
  await writeFile(file, `${JSON.stringify(doc, null, 2)}\n`);
  return { file, bytes: Buffer.byteLength(tsxSource) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [slug, componentId, entry] = process.argv.slice(2);
  if (!slug || !componentId) {
    console.error('usage: node tools/bundle.mjs <slug> <componentId> [entry]');
    process.exit(2);
  }
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const { file, bytes } = await bundleComponent(root, slug, componentId, entry);
  console.log(`bundled ${componentId} into ${file} (${bytes} bytes)`);
}
