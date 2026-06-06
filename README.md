# Agent Control Plane — Attestation

[![status](https://img.shields.io/badge/status-draft-orange?style=flat-square)](specs/aar-agent-attestation-record.md)
[![spec](https://img.shields.io/badge/spec-AAR%20v0.1-333?style=flat-square)](specs/aar-agent-attestation-record.md)
[![conformance](https://img.shields.io/badge/conformance-L0--L3-0e7c2e?style=flat-square)](CONFORMANCE.md)
[![signing](https://img.shields.io/badge/signing-Ed25519-blue?style=flat-square)](specs/aar-agent-attestation-record.md#5-signing--verification)
[![identity](https://img.shields.io/badge/identity-A2A%20%2F%20did%3Aweb-purple?style=flat-square)](specs/aar-agent-attestation-record.md#6-identity)
[![license](https://img.shields.io/badge/license-MIT-0e7c2e?style=flat-square)](LICENSE)

> **Proof of what an agent actually did — signed, portable, and checkable by anyone.**
>
> Every agent control plane on the market governs **access** — *can this agent call
> the CRM?* None of them produce **proof** — *did it actually do what it claimed, was
> it checked against reality, and was it real work or going through the motions?*
> This is that missing layer.

The **Agent Attestation Record (AAR)** is a signed record of three things:

1. what an agent **claimed** it did,
2. what it **actually did** — checked against real system state, by a verifier the
   agent does **not** control,
3. **who verified it** — so the record verifies with a public key, no central server.

AAR is the **proof** sibling of **[AVL — Agent View Layer](https://github.com/frontier-infra/avl)**.
AVL makes a *site* agent-readable (the **view** layer). AAR makes an agent's *actions*
accountable (the **proof** layer). Same `.well-known` instinct, one layer over.

---

## The record

```json
{
  "aar": "0.1",
  "subject":   "did:web:agents.titaniumcomputing.com:conductor",
  "principal": "did:web:titaniumcomputing.com",
  "task":      { "id": "ack-56083", "claim": "drafted acknowledgement for ticket #56083" },
  "verdict":   "verified",
  "quality":   "substantive",
  "ground_truth": "confirmed",
  "reason":    "draft quotes the customer's words; matches the live ticket body",
  "verifier":  { "id": "did:web:titaniumcomputing.com:angel", "model": "qwen3:1.7b", "independent": true },
  "issued":    "2026-06-05T20:14:03Z",
  "sig":       { "alg": "Ed25519", "by": "did:web:titaniumcomputing.com", "value": "base64url…" }
}
```

## Why this is the un-absorbable layer

Every funded player (Okta for AI Agents, Microsoft Agent 365, Galileo, Kore.ai) governs
**access**, and they all centralize on a trust root they already own. None of them ship
**portable, signed, cross-authority proof of outcome**, because the value is in being the
center, and a neutral proof record that survives leaving the boundary is the one thing
they can't build without surrendering that. AAR plants the flag there:

- **Ground-truthed.** `ground_truth` compares the claim to **real system state**. A
  `contradicted` value is fabrication, caught — the agent said "0 unread" but the API
  showed messages.
- **Independently verified.** `verifier.independent: true` and `verifier.id ≠ subject` —
  the thing being checked can't sign off on itself. The harness owns completion.
- **Quality-graded.** `quality` separates real value (`substantive`) from
  going-through-the-motions (`shallow`) — an axis nobody else even names.
- **Portable + signed.** Verify with the signer's public key. Trust the math, not a server.

## Verify a record

```text
1. Take the record, remove `sig`, canonicalize (JCS / RFC 8785).
2. Resolve `sig.by` → public key   (did:web → https://<domain>/.well-known/did.json).
3. Ed25519-verify `sig.value` over the canonical bytes.  ✓ untampered + who signed.
4. Read `ground_truth` + `verifier.independent` → what was actually checked, and by whom.
```

No call to any issuer. The guarantee travels with the record.

**Run it** (zero-dependency reference tool, Node ≥ 20):

```bash
node tools/aar.mjs keygen --did did:web:example.com         # Ed25519 key + did.json
node tools/aar.mjs sign   record.json --priv secrets/k.json # real signature
node tools/aar.mjs verify record.json                       # resolve did:web, check sig + level

# verify the bundled vectors offline:
node tools/aar.mjs verify specs/fixtures/valid/helpdesk-ack.json \
  --did-json specs/fixtures/.well-known/did.json
#  [✓] L0  Ed25519 signature valid
#  [✓] L1  ground_truth=confirmed
#  [✓] L2  quality=substantive · independent verifier
#  → conformance: L2
```

## Conformance

| Level | Adds | For |
|---|---|---|
| **L0** | a signed record (`subject`, `task.claim`, `verdict`, `sig`) | anyone — point-to-point floor |
| **L1** | `ground_truth` binding | claims checked vs real state |
| **L2** | `quality` + independent verifier (`verifier.id ≠ subject`) | un-gameable, real-value proof |
| **L3** | transparency-log commitment (signed hash + timestamp) | audit-grade — IR, compliance |

Full detail: [CONFORMANCE.md](CONFORMANCE.md).

## Reference implementation

AAR is the extraction and standardization of a record that already runs in production:
the **"Angel on the Shoulder"** verifier in **ArgentOS** (`heartbeat-verifier.ts`), whose
`TaskVerdict` — `{ status, quality, reason }` checked against collected ground truth — is
the seed of this spec. It generalizes ArgentOS's **Accountability Score** verdicts into a
portable, signed, cross-authority record.

## Status

**v0.1 — draft.** Identity and discovery are *adopted* from [A2A Agent Cards](https://a2a-protocol.org)
and [`did:web`](https://w3c-ccg.github.io/did-method-web/), not reinvented. This spec
defines only the three things no one has standardized: the **grant** boundary, and
especially the **attestation** (proof) record. Comments and fixtures welcome.

— Spec: [`specs/aar-agent-attestation-record.md`](specs/aar-agent-attestation-record.md) ·
Conformance: [`CONFORMANCE.md`](CONFORMANCE.md) ·
Governance: [`GOVERNANCE.md`](GOVERNANCE.md)

MIT
