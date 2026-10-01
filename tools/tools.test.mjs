import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRENT_MATTE_BAKE_VERSION } from '@cueframe/kernel/component-runtime/template';
import { validateRepo, validateTemplateDir } from './validate.mjs';
import { render, catalogEntry, materializeArtifacts } from './catalog.mjs';
import { bundleComponent } from './bundle.mjs';

const tools = dirname(fileURLToPath(import.meta.url));
const SHA = 'a'.repeat(64);
const kit = (name) => ({
  kitId: 'ignored', name,
  colors: { primary: '#111111', secondary: '#222222', accent: '#f7c948', background: '#000000', text: '#ffffff' },
  headingFont: { fontFamily: 'Inter', fontWeight: 700 }, bodyFont: { fontFamily: 'Inter', fontWeight: 400 },
});

function document(slug, over = {}) {
  return {
    v: 1, slug, name: `Doc ${slug}`, description: 'A test template.',
    composition: {
      v: 1, format: { aspectRatio: '16:9', fps: 30, resolution: 'fhd' },
      tracks: [
        { id: 'title', kind: 'overlay', name: 'Title', contents: [{ id: 't', kind: 'overlay', startTime: 0, duration: 2, source: { kind: 'card', html: '<h1>{{title}}</h1>', tokens: {} } }] },
        { id: 'video', kind: 'video', name: 'Source', contents: [{ id: 'main', kind: 'video', startTime: 0, duration: 4, source: { kind: 'media', mediaId: '{{source}}', trim: { start: 0, end: 4 }, muted: true } }] },
      ],
    },
    parameters: [
      { name: 'source', type: 'media', kind: 'video', required: true, sample: { url: 'https://cdn.cueframe.ai/t/source.mp4', sha256: SHA, mimeType: 'video/mp4', durationSec: 10 } },
      { name: 'title', type: 'string', required: true, default: 'Hello' },
    ],
    components: {},
    brandKit: kit('Document kit'),
    presets: { granite: { label: 'Granite', values: { title: 'Granite' }, brandKit: kit('Granite kit') } },
    gallery: { status: 'published', category: 'Test', format: '16:9', duration: '4 seconds', render: 'https://cueframe.ai/demo/x.mp4', poster: 'https://cueframe.ai/showcase/x.jpg', details: ['One'], prompt: 'Make it.' },
    ...over,
  };
}

function repo(docs) {
  const root = mkdtempSync(join(tmpdir(), 'templates-'));
  for (const doc of docs) {
    mkdirSync(join(root, doc.slug));
    writeFileSync(join(root, doc.slug, 'template.cueframe'), `${JSON.stringify(doc, null, 2)}\n`);
  }
  return root;
}

test('validate passes a good repo and names the bad slug on a broken one', async () => {
  const good = repo([document('good-one'), document('good-two')]);
  const generated = await render(good);
  await materializeArtifacts(good, generated);
  writeFileSync(join(good, 'templates.json'), generated);
  try {
    const ok = await validateRepo(good);
    assert.deepEqual(ok.results.map((r) => [r.dir, r.problems]), [['good-one', []], ['good-two', []]]);
    assert.equal(ok.catalogFresh, true);
    const run = spawnSync(process.execPath, [join(tools, 'validate.mjs'), good], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
  } finally {
    rmSync(good, { recursive: true, force: true });
  }

  const misplaced = document('bad-one');
  misplaced.parameters.push({ name: 'start', type: 'number', required: true });
  misplaced.composition.tracks[1].contents[0].startTime = '{{start}}';
  const bad = repo([document('good-one'), misplaced]);
  try {
    const run = spawnSync(process.execPath, [join(tools, 'validate.mjs'), bad], { encoding: 'utf8' });
    assert.equal(run.status, 1);
    assert.match(run.stderr, /FAIL bad-one/);
    assert.doesNotMatch(run.stderr, /FAIL good-one/);
    assert.match(run.stderr, /templates\.json is stale/);
  } finally {
    rmSync(bad, { recursive: true, force: true });
  }
});

test('validate binds every preset with the sample media, and refuses what a preset cannot bind', async () => {
  const root = repo([document('a-slug')]);
  try {
    assert.deepEqual(await validateTemplateDir(root, 'a-slug'), []);
    // Without a default, the title binds only under the preset that sets it.
    const doc = document('a-slug');
    doc.parameters[1] = { name: 'title', type: 'string', required: true };
    writeFileSync(join(root, 'a-slug', 'template.cueframe'), JSON.stringify(doc));
    const problems = await validateTemplateDir(root, 'a-slug');
    assert.equal(problems.length, 1, JSON.stringify(problems));
    assert.match(problems[0], /preset \(none\): .*title.*required/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a published document whose media parameter has no sample fails; a draft passes', async () => {
  const noSample = document('no-sample');
  delete noSample.parameters[0].sample;
  const draft = document('a-draft', { gallery: { status: 'draft' } });
  delete draft.parameters[0].sample;
  const root = repo([noSample, draft]);
  try {
    const failing = await validateTemplateDir(root, 'no-sample');
    assert.equal(failing.length, 1);
    assert.match(failing[0], /media parameter source has no sample/);
    assert.deepEqual(await validateTemplateDir(root, 'a-draft'), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('a prepared matte at another bake version fails, naming both', async () => {
  const stale = document('stale-matte');
  stale.parameters[0].prepared = { mattes: { '4aa54bdd6d0d': { url: 'https://cdn.cueframe.ai/t/m.mp4', sha256: SHA, mimeType: 'video/mp4', bakeVersion: `old-${CURRENT_MATTE_BAKE_VERSION}` } } };
  const root = repo([stale]);
  try {
    const problems = await validateTemplateDir(root, 'stale-matte');
    assert.ok(problems.some((problem) => new RegExp(`old-${CURRENT_MATTE_BAKE_VERSION}.*${CURRENT_MATTE_BAKE_VERSION}`).test(problem)));
    assert.ok(problems.some((problem) => /needs a pinned geometry sidecar/.test(problem)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the catalog is schemaVersion 2 with published rows only, presets per row, and namespaced kits never merged', async () => {
  const root = repo([document('pub-one'), document('a-draft', { gallery: { status: 'draft' } })]);
  try {
    const catalog = JSON.parse(await render(root));
    assert.equal(catalog.schemaVersion, 2);
    assert.deepEqual(catalog.templates.map((t) => t.slug), ['pub-one']);
    const row = catalog.templates[0];
    assert.equal(row.title, 'Doc pub-one');
    assert.equal(row.documentSha256, createHash('sha256').update(readFileSync(join(root, 'pub-one', 'template.cueframe'))).digest('hex'));
    assert.equal(row.template, 'https://github.com/cueframe-ai/cueframe-templates/tree/main/pub-one');
    assert.equal(row.projectTemplate, `https://raw.githubusercontent.com/cueframe-ai/cueframe-templates/main/artifacts/${row.documentSha256}.cueframe`);
    assert.deepEqual(row.presets, [{ name: 'granite', label: 'Granite', brandKit: 'template:pub-one:granite' }]);
    assert.deepEqual(catalog.brandKits.map((k) => [k.kitId, k.name, k.fromTemplate, k.fromPreset]), [
      ['template:pub-one', 'Document kit', 'pub-one', undefined],
      ['template:pub-one:granite', 'Granite kit', 'pub-one', 'granite'],
    ]);
    assert.equal(catalogEntry(document('x', { gallery: { status: 'draft' } })), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('content-addressed document copies stay immutable', async () => {
  const root = repo([document('pub-one')]);
  try {
    const generated = await render(root);
    await materializeArtifacts(root, generated);
    const digest = JSON.parse(generated).templates[0].documentSha256;
    const artifact = join(root, 'artifacts', `${digest}.cueframe`);
    assert.equal(readFileSync(artifact, 'utf8'), readFileSync(join(root, 'pub-one', 'template.cueframe'), 'utf8'));
    writeFileSync(artifact, 'changed');
    await assert.rejects(materializeArtifacts(root, generated), /Immutable artifact/);
    assert.deepEqual((await validateRepo(root)).missingArtifacts, ['pub-one']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('bundle writes the component source into the document and nothing else', async () => {
  const doc = document('with-comp');
  doc.components.card = {
    name: 'Card', description: 'A card', category: 'text', propSchema: { type: 'object' },
    source: { version: 2, componentId: 'card', tsxSource: 'export default () => null;', manifest: { version: 2, assets: {}, graphics: { api: 'canvas2d', required: true, accelerationPreference: 'software-allowed' }, alphaPolicy: 'allows-opaque' } },
  };
  const root = repo([doc]);
  try {
    const src = join(root, 'with-comp', 'components', 'card', 'src');
    mkdirSync(src, { recursive: true });
    writeFileSync(join(src, 'index.jsx'), "import { greet } from './greet.js';\nexport default function Card() { return greet(); }\n");
    writeFileSync(join(src, 'greet.js'), "export const greet = () => 'hi';\n");
    await bundleComponent(root, 'with-comp', 'card');
    const written = JSON.parse(readFileSync(join(root, 'with-comp', 'template.cueframe'), 'utf8'));
    assert.match(written.components.card.source.tsxSource, /greet/);
    assert.match(written.components.card.source.tsxSource, /export \{[\s\S]*default/);
    assert.equal(written.components.card.source.componentId, 'card');
    assert.equal(written.name, 'Doc with-comp');
    assert.deepEqual(written.parameters, doc.parameters);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('the pre-push hook exits non-zero when validate fails', () => {
  const hook = join(dirname(tools), '.githooks', 'pre-push');
  const bad = repo([document('bad-hook', { slug: 'bad-hook', parameters: [] })]);
  try {
    const run = spawnSync('sh', [hook, bad], { encoding: 'utf8', cwd: dirname(tools) });
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /FAIL bad-hook/);
  } finally {
    rmSync(bad, { recursive: true, force: true });
  }
  assert.equal(execFileSync('sh', ['-c', `head -1 ${hook}`], { encoding: 'utf8' }).trim(), '#!/bin/sh');
});
