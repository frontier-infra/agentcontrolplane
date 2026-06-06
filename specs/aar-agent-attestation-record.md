# Agent Attestation Record (AAR) — v0.1

Status: **Draft**
Content type: `application/aar+json` (a single JSON object) · spec field `aar: "0.1"`

## 1. Purpose

An **Agent Attestation Record** is a signed statement that, for one unit of agent work:

- the agent **claimed** to do something (`task.claim`),
- a verifier the agent does **not** control found that it was/wasn't actually done
  (`verdict`), of what **quality** (`quality`), and whether it matches **real system
  state** (`ground_truth`),
- and the record is **signed** so any third party can confirm it is untampered and who
  vouched for it — without contacting the issuer.

AAR does **not** define agent identity, discovery, transport, or capability description.
Those are adopted unchanged from existing work (§6). AAR defines only the proof record.

## 2. The record

```json
{
  "aar": "0.1",
  "subject":   "did:web:agents.example.com:worker-7",
  "principal": "did:web:example.com",
  "task": {
    "id": "task-2026-06-05-0042",
    "claim": "ran the nightly backup and verified the archive"
  },
  "verdict":      "verified",
  "quality":      "substantive",
  "ground_truth": "confirmed",
  "reason":       "backup API reports a 4.2GB archive at 02:11Z; checksum matches",
  "verifier": {
    "id": "did:web:example.com:angel",
    "model": "qwen3:1.7b",
    "independent": true
  },
  "issued": "2026-06-05T02:12:40Z",
  "sig": { "alg": "Ed25519", "by": "did:web:example.com", "value": "base64url…" }
}
```

## 3. Fields

| Field | Req | Type | Meaning |
|---|---|---|---|
| `aar` | ✓ | string | Spec version. `"0.1"`. |
| `subject` | ✓ | DID | The agent the record is about. |
| `principal` | ✓ | DID | Who authorized the agent / answers for it (the manager). |
| `task.id` | ✓ | string | Stable id for the unit of work. |
| `task.claim` | ✓ | string | What the agent claimed it did, in plain language. |
| `verdict` | ✓ | enum | `verified` \| `not_verified` \| `unclear`. Was it actually done. |
| `quality` | L2 | enum | `substantive` \| `shallow` \| `none`. Real value vs. going through the motions. |
| `ground_truth` | L1 | enum | `confirmed` \| `contradicted` \| `unchecked`. Claim vs. real system state. |
| `reason` | ✓ | string | Brief evidence/explanation behind the verdict. |
| `verifier.id` | L2 | DID | Who verified. **MUST differ from `subject`** at L2+. |
| `verifier.model` | – | string | Model/tool that performed verification (provenance). |
| `verifier.independent` | L2 | bool | `true` ⇒ the verifier is not controlled by the agent. |
| `issued` | ✓ | RFC 3339 | When the record was signed (UTC, `Z`). |
| `sig` | ✓ | object | `{ alg, by, value }` — see §5. |
| `prior` | L3 | string | Optional hash of the previous record from `subject` (tamper-evident chain). |
| `log` | L3 | object | Optional transparency-log receipt — see §7. |

### 3.1 `ground_truth` semantics (the load-bearing field)

`ground_truth` is the difference between a self-report and proof:

- `confirmed` — the claim was checked against authoritative external/system state and holds.
- `contradicted` — the claim was checked and **does not hold**. This is fabrication
  (the agent said it did X; reality says otherwise). It is the most serious value.
- `unchecked` — no ground-truth source was available for this task. Honest absence, not a pass.

A verifier MUST mark `contradicted` when ground truth overrides the claim, even if the
agent's own text asserts success.

## 4. Verification (no issuer contact)

```text
1. Remove `sig`. Canonicalize the remaining object with JCS (RFC 8785).
2. Resolve `sig.by` to a public key:
     did:web:DOMAIN[:PATH]  →  https://DOMAIN/[PATH/].well-known/did.json
3. Ed25519-verify `sig.value` (base64url) over the canonical UTF-8 bytes.
4. On success: the record is untampered and was signed by `sig.by`.
5. Interpret: `verdict` (done?), `ground_truth` (real?), `quality` (good?),
   `verifier.independent` + (`verifier.id != subject`) (checked by someone other than the agent?).
```

A consumer never has to trust the party that produced the work, nor any central registry —
only the public key behind `sig.by`, resolved over DNS/TLS.

## 5. Signing & verification

- Signature algorithm for v0.1 is **Ed25519** (EdDSA, RFC 8032). `sig.alg = "Ed25519"`.
- The signed payload is the record **with `sig` removed**, serialized via **JSON
  Canonicalization Scheme (JCS, RFC 8785)**, UTF-8 encoded.
- `sig.value` is the base64url (unpadded) signature.
- `sig.by` is the DID whose key signs. Typically the `principal` or the `verifier.id`.
  The signer attests to the *record*, not to the *claim* — i.e. "I, the verifier/principal,
  vouch that this is the verdict I reached."
- Symmetric MACs (e.g. HMAC) are **not** conformant for portable records: verifying must
  never confer the ability to forge. (Closed single-authority deployments MAY use HMAC
  internally but cannot emit L0+ portable AARs with it.)

## 6. Identity (adopted, not defined)

- **Agent identity:** an [A2A Agent Card](https://a2a-protocol.org). The AAR `subject`/
  `principal`/`verifier.id` are the DIDs those cards resolve to.
- **DID method:** **`did:web`** for v0.1 — anchors trust to a domain the operator already
  controls, via DNS + TLS + `/.well-known/did.json`. (Other DID methods MAY be used; the
  signature/verification rules are identical.)
- AAR adds **no** new identifier format, transport, or capability schema.

## 7. Conformance tiers (summary)

See [CONFORMANCE.md](../CONFORMANCE.md) for the full checklist.

- **L0** — signed record (`aar`, `subject`, `principal`, `task`, `verdict`, `reason`,
  `issued`, `sig`) that verifies per §4. Point-to-point. The floor.
- **L1** — `ground_truth` present and meaningfully derived (claim checked vs real state).
- **L2** — `quality` present **and** independent verification (`verifier.id` present,
  `verifier.independent: true`, `verifier.id != subject`).
- **L3** — tamper-evident history: `prior` chaining and/or a transparency-log `log`
  receipt (a signed `{hash, timestamp}` commitment to an append-only log; contents stay
  point-to-point, only the commitment is logged — Certificate-Transparency style).

## 8. Relationship to other work

- **A2A / NANDA / IETF SD-JWT Agent Cards** — identity & discovery. AAR sits on top.
- **AVL (Agent View Layer)** — the *view* layer for sites. AAR is the *proof* layer for
  actions. Sibling specs.
- **MCP / Managed Agents / control planes** — the *access* layer. AAR is the *proof*
  layer. Composable; not a competitor.

## 9. Open questions (v0.1 → v0.2)

- Authority **grant** record (the inverse of attestation): a signed, short-TTL capability
  grant — "`subject` may do scope Y under policy Z until time T" — so drift becomes
  "actual diverged from granted scope," measurable. Sketched, not yet specified here.
- Canonical task-`claim` vocabulary vs. free text.
- Selective disclosure of `reason`/evidence (SD-JWT direction).
- Transparency-log binding details for L3.
