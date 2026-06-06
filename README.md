# Agent Control Plane — Attestation

[![status](https://img.shields.io/badge/status-draft-orange?style=flat-square)](specs/aar-agent-attestation-record.md)
[![spec](https://img.shields.io/badge/spec-AAR%20v0.02-333?style=flat-square)](specs/aar-agent-attestation-record.md)
[![conformance](https://img.shields.io/badge/conformance-L0--L3-0e7c2e?style=flat-square)](CONFORMANCE.md)
[![signing](https://img.shields.io/badge/signing-Ed25519-blue?style=flat-square)](specs/aar-agent-attestation-record.md#5-signing--verification)
[![identity](https://img.shields.io/badge/identity-A2A%20%2F%20did%3Aweb-purple?style=flat-square)](specs/aar-agent-attestation-record.md#6-identity-adopted-not-defined)
[![license](https://img.shields.io/badge/license-MIT-0e7c2e?style=flat-square)](LICENSE)

> **A signed record that makes an agent's verdicts inspectable and fabrication-evident — not magically true.**
>
> Every agent control plane on the market governs **access** — *can this agent call the
> CRM?* None of them produce **portable proof of outcome** — *did it actually do what it
> claimed, checked against reality, with the basis of that check committed so a third party
> can inspect it?* That's the gap AAR fills.

The **Agent Attestation Record (AAR)** binds, for one unit of agent work:

1. what the agent **claimed** (`task.claim`),
2. what an independent verifier **found** (`verdict`) and whether it matched **real system
   state** (`ground_truth`),
3. the **evidence** that verdict rests on (`checks` — a hash commitment to the query + the
   state that was checked, so an *authorized* party can re-run it without trusting the verifier),
4. **who vouched**, signed — so the record verifies with a public key, no central server.

AAR is the **proof** sibling of **[AVL — Agent View Layer](https://github.com/frontier-infra/avl)**:
AVL makes a *site* agent-readable; AAR makes an agent's *actions* accountable. One layer over.

---

## The record

```json
{
  "aar": "0.02",
  "subject":   "did:web:agents.titaniumcomputing.com:conductor",
  "principal": "did:web:titaniumcomputing.com",
  "task":      { "id": "ack-56083", "claim": "drafted acknowledgement for ticket #56083" },
  "verdict":   "verified",
  "quality":   "substantive",            // advisory — does NOT gate conformance
  "ground_truth": "confirmed",
  "reason":    "draft quotes the customer's words; matches the live ticket body",
  "checks":    [{ "source": "https://app.atera.com/api/v3/tickets/56083",
                  "query": "GET /api/v3/tickets/56083",
                  "observed_at": "2026-06-05T20:13:58Z",
                  "response_sha256": "…", "excerpt": "…(redacted)" }],
  "verifier":  { "id": "did:web:titaniumcomputing.com:angel", "model": "qwen3:1.7b",
                 "independence": "same_principal" },
  "issued":    "2026-06-05T20:14:03Z",
  "sig":       { "alg": "Ed25519", "by": "did:web:titaniumcomputing.com", "value": "base64url…" }
}
```

## What it does — honestly

| Property | How |
|---|---|
| **Provenance** | Ed25519 over the record. Proves *who vouched*, untampered. |
| **Inspectable truth** | `ground_truth` `confirmed`/`contradicted` **must** carry `checks` — a hash of the checked state + the query. An authorized party re-runs it and gets the same verdict *without trusting the verifier*. |
| **Fabrication-evident** | `ground_truth: contradicted` = a signed statement the claim failed against real state. High-trust even without a re-run. |
| **No self-grading** | L2 requires `verifier.id ≠ subject`. The agent can't sign off on itself. |
| **Honest about its limits** | `verifier.independence` (`same_principal` \| `separate_principal` \| `third_party`) is **disclosed**, not asserted-true. A same-owner key *can* assert a verdict — AAR makes that case disclosed, inspectable, and (at L3) non-rewritable. See the [threat model](specs/aar-agent-attestation-record.md#4-threat-model). |

It does **not** claim a signature makes a verdict true. `same_principal` is *organizational
attestation*; `separate_principal`/`third_party` + `checks` + L3 is *audit-grade*. State your
consumer policy.

## Verify a record

```text
1. Remove `sig`, canonicalize (JCS / RFC 8785).
2. Resolve `sig.by` → public key (did:web → https://<domain>/.well-known/did.json).
3. Ed25519-verify `sig.value`.  ✓ untampered + who signed.
4. (optional) Obtain the check preimage from the issuer, recompute `checks[].response_sha256`,
   re-run the query → confirm the verdict yourself.
```

**Run it** (zero-dependency reference tool, Node ≥ 20):

```bash
node tools/aar.mjs verify specs/fixtures/valid/helpdesk-ack.json \
  --did-json specs/fixtures/.well-known/did.json
#  [✓] L0  Ed25519 signature valid
#  [✓] L1  ground_truth=confirmed · evidence committed (1 check)
#  [✓] L2  independent verifier (id != subject)
#  [ℹ]     independence: same_principal (organizational attestation — disclose; not audit-grade)
#  [ℹ]     quality: substantive (advisory, non-gating)
#  → conformance: L2
```

## Conformance

| Level | Adds | For |
|---|---|---|
| **L0** | a signed record that verifies | the point-to-point floor |
| **L1** | `ground_truth` + `checks` evidence (for confirmed/contradicted) | claims checked vs real state, *inspectably* |
| **L2** | independent verifier (`id ≠ subject`) + evidence-backed ground_truth | no self-grading; `quality` advisory |
| **L3** | transparency-log commitment | protects L0–L2 from retroactive rewrite (key/domain compromise) |

Full detail: [CONFORMANCE.md](CONFORMANCE.md) · spec: [specs/aar-agent-attestation-record.md](specs/aar-agent-attestation-record.md).

## Reference implementation

AAR is the standardization of a record that already runs in production: the **"Angel on the
Shoulder"** verifier in **ArgentOS** (`heartbeat-verifier.ts`), whose `TaskVerdict` checked
against collected ground truth is the seed. It generalizes ArgentOS's **Accountability
Score** verdicts into a portable, signed, evidence-committed record.

## Status

**v0.02 — draft**, intentionally slow/incremental (`0.0x`). See [CHANGELOG.md](CHANGELOG.md).
Identity/discovery adopted from [A2A](https://a2a-protocol.org) + [`did:web`](https://w3c-ccg.github.io/did-method-web/).
Next increment: an optional `grant_ref` (scope binding) so off-goal becomes measurable.

MIT
