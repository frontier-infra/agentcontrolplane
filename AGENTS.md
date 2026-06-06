# AGENTS.md — for AI agents & contributors

You're working on **AAR (Agent Attestation Record)** — an open standard for **portable,
signed, ground-truthed proof of what an AI agent actually did**. It's the *proof* sibling of
[AVL](https://github.com/frontier-infra/avl) (the agent *view* layer). This file gets you
productive fast.

## Read in this order
1. `README.md` — the pitch, the record, how to verify.
2. `specs/aar-agent-attestation-record.md` — **the spec** (record, fields, §3.2 evidence,
   §4 threat model, §5 signing, conformance).
3. `CONFORMANCE.md` — the L0–L3 required checks.
4. `tools/aar.mjs` — the zero-dependency reference signer/verifier (Node ≥ 20).
5. `specs/fixtures/` — conformance test vectors (real signatures); invalid ones carry an
   `_invalid_reason`.

## Verify it works (30 seconds)
```bash
node tools/aar.mjs verify specs/fixtures/valid/helpdesk-ack.json \
  --did-json specs/fixtures/.well-known/did.json     # → conformance: L2
node tools/aar.mjs verify specs/fixtures/invalid/self-verified.json \
  --did-json specs/fixtures/.well-known/did.json     # → L1 (sig valid, fails L2: id == subject)
```

## How to contribute
- **Keep the spec narrow.** AAR defines the proof record (and, next, the grant record).
  Identity/discovery are *adopted* from A2A Agent Cards + `did:web` — don't reinvent them.
- **Every normative change ships a fixture** under `specs/fixtures/valid|invalid/`, and
  `node tools/aar.mjs verify` must pass on all valid vectors before you commit.
- **Be honest about limits.** AAR makes verdicts *inspectable and fabrication-evident*, not
  magically true (see the threat model, spec §4). Don't oversell in docs.
- **Asymmetric signatures only** (Ed25519). A symmetric MAC is non-conformant.
- **Slow, incremental versioning** (`0.0x`). Small, defensible steps.
- Propose changes via the process in `GOVERNANCE.md`.

## What this is NOT
Not an identity scheme (adopt A2A + `did:web`). Not an access-control plane (composes with
MCP and the control-plane vendors). It's the proof layer.

MIT.
