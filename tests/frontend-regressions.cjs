// Run from any directory: node tests/frontend-regressions.cjs
const { buildSync } = require('../src/node_modules/esbuild');
const path = require('node:path');
const result = buildSync({
  stdin: {
    resolveDir: path.resolve(__dirname, '..'),
    contents: `
import assert from 'node:assert/strict';
import { SaveQueue } from './src/lib/save-queue';
import { createProjectBackup, parseProjectBackup } from './src/lib/project-backup';
import { importManuscriptFile } from './src/lib/manuscript-import';
import { buildRestUrl } from './src/lib/rest-url';
import { readDictionary, writeDictionary, dictionaryKey } from './src/lib/personal-dictionary';

async function run() {
  for (const base of ['https://example.com/wp-json/lipishilpo/v1', 'https://example.com/?rest_route=/lipishilpo/v1', 'https://example.com/subsite/index.php?rest_route=%2Flipishilpo%2Fv1']) {
    const url = new URL(buildRestUrl(base, 'projects?page=2&per_page=40', 'https://example.com/'));
    assert.equal(url.searchParams.get('page'), '2');
    assert.equal(url.searchParams.get('per_page'), '40');
    if (base.includes('rest_route')) assert.equal(url.searchParams.get('rest_route'), '/lipishilpo/v1/projects');
    else assert.equal(url.pathname, '/wp-json/lipishilpo/v1/projects');
    const single = new URL(buildRestUrl(base, 'projects/123', 'https://example.com/'));
    assert.equal(single.searchParams.has('page'), false);
    assert.ok((single.searchParams.get('rest_route') ?? single.pathname).endsWith('/projects/123'));
  }
  console.log('PASS: pretty and plain permalink URLs preserve routes and pagination');
  const storage = new Map();
  globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  storage.set('lipishilpo_personal_dict', JSON.stringify(['unknown legacy owner']));
  writeDictionary(10, ['account A']);
  assert.deepEqual(readDictionary(11), []);
  writeDictionary(11, ['account B']);
  assert.deepEqual(readDictionary(10), ['account A']);
  writeDictionary(10, []);
  assert.deepEqual(readDictionary(10), []);
  storage.set(dictionaryKey(12), '{invalid');
  assert.deepEqual(readDictionary(12), []);
  console.log('PASS: dictionaries are account-scoped, empty server state clears cache, legacy data is ignored');

  const writes = [];
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const queue = new SaveQueue(async (id, data) => {
    writes.push([id, data]);
    if (writes.length === 1) await gate;
  });
  queue.set('A', { text: 'old' });
  const first = queue.flush();
  queue.set('A', { text: 'latest' });
  queue.set('B', { text: 'other project' });
  assert.equal(queue.flush(), first);
  assert.equal(queue.dirty, true);
  release();
  await first;
  assert.deepEqual(writes.map(([id, data]) => [id, data.text]), [['A', 'old'], ['A', 'latest'], ['B', 'other project']]);
  assert.equal(queue.dirty, false);
  console.log('PASS: in-flight edits and project switches are serialized');

  let failed = true;
  const retry = new SaveQueue(async () => { if (failed) throw new Error('offline'); });
  retry.set('A', { text: 'recover me' });
  await assert.rejects(retry.flush(), /offline/);
  assert.equal(retry.dirty, true);
  failed = false;
  await retry.flush();
  assert.equal(retry.dirty, false);
  console.log('PASS: failed writes remain available for retry');

  const independentWrites = [];
  const conflicts = new SaveQueue(async (id, data) => {
    if (id === 'conflict') { conflicts.block(id); throw new Error('conflict'); }
    independentWrites.push(id);
  });
  conflicts.set('conflict', { text: 'Keep my local edits' });
  conflicts.set('other', { text: 'Save independently' });
  await assert.rejects(conflicts.flush(), /conflict/);
  assert.deepEqual(independentWrites, ['other']);
  assert.equal(conflicts.dirty, true);
  await conflicts.flush();
  assert.equal(conflicts.dirty, true);
  conflicts.discard('conflict');
  assert.equal(conflicts.dirty, false);
  console.log('PASS: conflicted edits stay pending without blocking other manuscripts');

  const project = {
    id: '42', title: 'বাংলা বই', genre: 'Novel', language: 'বাংলা',
    chapters: [{ id: 'chapter-1', title: 'অধ্যায়', text: 'বাংলা লেখা', notes: 'note', status: 'final', partTitle: 'Part I' }],
    codex: { characters: [{ id: 'char-1', name: 'নাম', role: 'supporting' }], lore: [{ id: 'lore-1', title: 'Town', category: 'location', summary: 'Home' }] },
    snapshots: { 'chapter-1': [{ id: 's1', text: 'old text', name: 'Before', date: '2026-10-01', wordCount: 2 }] },
    comments: { 'chapter-1': [{ id: 'c1', quote: 'বাংলা', comment: 'Review', date: '', resolved: false }] },
    edits: { 'chapter-1': [{ id: 'e1', kind: 'custom', from: 'a', to: 'b', why: '', count: 1, date: '', customized: true }] },
  };
  const backup = createProjectBackup(project);
  const restored = await parseProjectBackup(new File([JSON.stringify(backup)], 'book.json'));
  assert.deepEqual(restored, backup.project);
  const imported = await importManuscriptFile(new File([JSON.stringify(backup)], 'book.json'));
  assert.deepEqual(imported.codex, project.codex);
  assert.deepEqual(imported.snapshots, project.snapshots);
  const legacy = await parseProjectBackup(new File([JSON.stringify([{ title: 'Legacy', text: 'Kept' }])], 'old.json'));
  assert.equal(legacy.chapters[0].text, 'Kept');
  await assert.rejects(parseProjectBackup(new File(['null'], 'bad.json')));
  await assert.rejects(parseProjectBackup(new File([JSON.stringify({ project: { chapters: [{ text: 12 }] } })], 'bad.json')));
  console.log('PASS: full backup round-trip, legacy import and malformed data validation');

  for (const extension of ['txt', 'md']) {
    const manuscript = Array.from({ length: 201 }, (_, i) => (extension === 'md' ? '## ' : '') + 'Chapter ' + (i + 1) + '\\nPreserve this text').join('\\n');
    await assert.rejects(importManuscriptFile(new File([manuscript], 'long.' + extension)), error => error.code === 'too_many_chapters');
    const allowed = manuscript.split('\\n').slice(0, 400).join('\\n');
    const parsed = await importManuscriptFile(new File([allowed], 'allowed.' + extension));
    assert.equal(parsed.chapters.length, 200);
  }
  const tooMany = { ...backup, project: { ...backup.project, chapters: Array.from({ length: 201 }, (_, i) => ({ id: String(i), title: 'Ch', text: 'Text' })) } };
  await assert.rejects(importManuscriptFile(new File([JSON.stringify(tooMany)], 'long.json')), error => error.code === 'too_many_chapters');
  console.log('PASS: imports reject chapter overflow without truncation');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
`,
  },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
});
new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, exports);
