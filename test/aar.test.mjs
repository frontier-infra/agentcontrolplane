import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tool = path.join(root, 'tools/aar.mjs');
const record = path.join(root, 'specs/fixtures/valid/helpdesk-ack.json');
const didFixture = path.join(root, 'specs/fixtures/dids/titaniumcomputing.com.json');

test('offline verification binds the supplied DID document to sig.by', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'aar-did-binding-'));
  const did = JSON.parse(fs.readFileSync(didFixture, 'utf8'));
  did.id = 'did:web:wrong.example.test';
  const mismatchedDid = path.join(temp, 'did.json');
  fs.writeFileSync(mismatchedDid, `${JSON.stringify(did, null, 2)}\n`);

  const result = spawnSync(process.execPath, [tool, 'verify', record, '--did-json', mismatchedDid], {
    cwd: root,
    encoding: 'utf8',
  });

  assert.equal(result.status, 2);
  assert.match(result.stdout, /does not match sig\.by/);
  assert.match(result.stdout, /conformance: FAIL/);
});
