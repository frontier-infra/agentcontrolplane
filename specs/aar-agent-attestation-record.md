# Agent Attestation Record (AAR) — v0.02

Status: **Draft** · slow, incremental (`0.0x`) versioning on purpose.
Content type: `application/aar+json` (a single JSON object) · spec field `aar: "0.02"`

## 0. What AAR does and does NOT claim (read first)

AAR makes an agent's verdicts **inspectable and fabrication-evident** — not magically true.

- It **proves provenance**: who signed this verdict, untampered (Ed25519). ✔
- It makes the **basis** of a ground-truth verdict **inspectable**: the record commits to the
  evidence (hash of the checked state + the query), so an *authorized* party can re-run or
  inspect the check instead of trusting the verifier's word. ✔
- It makes **fabrication evident**: `ground_truth: contradicted` is a signed statement that the
  claim failed against real state — high-value even without perfect reproducibility. ✔
- It does **not**, by itself, prove a verdict is true when the *signer is the adversary*. A
  same-owner key can assert a verdict. AAR defends against an **agent grading itself**,
  **tampering**, and (at L3) **retroactive rewrite** — and discloses the verifier's independence
  so a consumer can apply its own trust policy. See **§4 Threat model**.

## 1. Purpose

An **Agent Attestation Record** is a signed statement that, for one unit of agent work:

- the agent **claimed** to do something (`task.claim`),
- a verifier found that it was/wasn't actually done (`verdict`), of what **quality**
  (`quality`, advisory), and whether it matches **real system state** (`ground_truth`),
- the **basis** of any ground-truth verdict is **committed** as evidence (`checks`),
- and the record is **signed** so any third party can confirm it is untampered and who vouched.

AAR does **not** define agent identity, discovery, transport, or capability description — those
are adopted unchanged (§6). AAR defines the proof record (and, later, the grant record).

## 2. The record

```json
{
  "aar": "0.02",
  "subject":   "did:web:agents.example.com:worker-7",
  "principal": "did:web:example.com",
  "task": { "id": "task-2026-06-05-0042", "claim": "ran the nightly backup and verified the archive" },
  "verdict":      "verified",
  "quality":      "substantive",
  "ground_truth": "confirmed",
  "reason":       "backup API reports a 4.2GB archive at 02:11Z; checksum matches",
  "checks": [
    {
      "source": "https://backup.example.com/api/archives/latest",
      "query": "GET /api/archives/latest",
      "observed_at": "2026-06-05T02:11:30Z",
      "response_sha256": "k7m…base64url",
      "excerpt": "{ size_bytes: 4200000000, checksum_ok: true }"
    }
  ],
  "verifier": { "id": "did:web:example.com:angel", "model": "qwen3:1.7b", "independence": "same_principal" },
  "issued": "2026-06-05T02:12:40Z",
  "sig": { "alg": "Ed25519", "by": "did:web:example.com", "value": "base64url…" }
}
```

## 3. Fields

| Field | Req | Type | Meaning |
|---|---|---|---|
| `aar` | ✓ | string | Spec version. `"0.02"`. |
| `subject` | ✓ | DID | The agent the record is about. |
| `principal` | ✓ | DID | Who authorized the agent / answers for it. |
| `task.id` | ✓ | string | Stable id for the unit of work. |
| `task.claim` | ✓ | string | What the agent claimed it did. |
| `verdict` | ✓ | enum | `verified` \| `not_verified` \| `unclear`. |
| `quality` | – | enum | `substantive` \| `shallow` \| `none`. **Advisory only — never gates conformance.** |
| `ground_truth` | L1 | enum | `confirmed` \| `contradicted` \| `unchecked`. |
| `reason` | ✓ | string | Brief human explanation. |
| `checks` | L1* | array | Evidence commitments. **Required when `ground_truth` is `confirmed` or `contradicted`** (§3.2). |
| `verifier.id` | L2 | DID | Who verified. **MUST differ from `subject`** at L2+. |
| `verifier.model` | – | string | Model/tool that verified (provenance). |
| `verifier.independence` | L2 | enum | `same_principal` \| `separate_principal` \| `third_party`. Disclosed, not asserted-true (§4). |
| `issued` | ✓ | RFC 3339 | When the record was signed (UTC). |
| `sig` | ✓ | object | `{ alg, by, value }` — §5. |
| `prior` | L3 | string | Optional hash of the previous record from `subject`. |
| `log` | L3 | object | Optional transparency-log receipt — §7. |

### 3.1 `ground_truth` semantics

- `confirmed` — claim checked against authoritative state and holds. **Requires `checks`.**
- `contradicted` — claim checked and **does not hold** (fabrication). **Requires `checks`.** The
  strongest signal in AAR.
- `unchecked` — no ground-truth source was available. Honest absence, not a pass.

A verifier MUST mark `contradicted` when ground truth overrides the claim.

### 3.2 `checks[]` — evidence commitment (the provenance→truth move)

When `ground_truth` is `confirmed` or `contradicted`, the record MUST carry ≥1 `checks` entry so
the verdict is **inspectable**, not merely asserted:

| Key | Req | Meaning |
|---|---|---|
| `source` | ✓ | What was checked (URI / resource id). |
| `query` | ✓ | The exact query/method run against it. |
| `observed_at` | ✓ | RFC 3339 — when the state was observed (distinct from `issued`; stale observations are false-positive risk). |
| `response_sha256` | ✓ | base64url SHA-256 over a canonical preimage `{ query, response, observed_at }`. |
| `excerpt` | – | Short, redacted, human-readable snippet of the response. |

**Normative custody rule:** the issuer **MUST retain the preimage** (the full query+response that
hashes to `response_sha256`) and provide it on request to an authorized party. The record commits
to evidence; it does not conceal it. The preimage travels **point-to-point** (it may contain
secrets/PII) — only the hash is in the portable record.

**Reproducibility is graded, not universal.** An authorized party (one with equivalent access)
re-runs `query` against `source`, recomputes the hash, and confirms the same verdict — *without
trusting the verifier*. Public re-run is not required (many checks hit private/ephemeral state).

## 4. Threat model

| Threat | Defended by | Tier |
|---|---|---|
| Agent grades its own work | `verifier.id ≠ subject` | L2 |
| "We promise we checked" (unverifiable verdict) | `checks` evidence commitment + custody rule | L1 |
| Record tampered in transit | Ed25519 signature | L0 |
| Verdict is a graded opinion, not a fact | `quality` is advisory; only structural facts gate conformance | L2 |
| Verifier secretly controlled by the agent's owner | **Disclosed** via `verifier.independence`; consumer applies policy | L2 (disclosure) |
| Domain/key compromise forges history retroactively | transparency-log commitment pins records in time | L3 |

**Explicit limitation:** a *fully compromised or malicious principal* (same owner holds the
agent's, verifier's, and signer's keys) can still sign a false record. AAR makes that case
**disclosed** (`independence: same_principal`) and **inspectable** (`checks`), and at L3
**non-rewritable** — but it does not make a same-owner attestation equal to a third-party one.

- `same_principal` = **organizational attestation** (the org vouches for itself). Valid, useful,
  honest — not audit-grade independence.
- `separate_principal` / `third_party` + `checks` + L3 = **audit-grade**. This is what an external
  auditor (e.g. Keelpin IR) should require.

State your consumer policy: what `independence` you accept, and whether you require L3.

## 5. Signing & verification

- **Ed25519** (`sig.alg = "Ed25519"`). The signed payload is the record **with `sig` removed and
  any `_`-prefixed annotation removed**, serialized via minimal **JCS (RFC 8785)**, UTF-8. `checks`
  are covered by the signature. `sig.value` is base64url.
- `sig.by` is the DID whose key signs (the `principal`, or the `verifier.id` for a third-party
  attestation). The signer attests to the **record** (the verdict it reached), not to the truth of
  the agent's underlying claim.
- **Symmetric MACs (HMAC) are non-conformant** for portable records — verifying must never confer
  forging. (Closed single-authority deployments may use HMAC internally but cannot emit L0+ AARs.)

To verify: remove `sig`, canonicalize, resolve `sig.by` → public key (`did:web` →
`/.well-known/did.json`), Ed25519-verify. Then (optionally, with the preimage) recompute
`checks[].response_sha256`.

## 6. Identity (adopted, not defined)

A2A Agent Cards + **`did:web`** for v0.02. `subject`/`principal`/`verifier.id` are the DIDs those
cards resolve to. AAR adds no identifier format, transport, or capability schema. (Key rotation /
revocation conventions are a near-term spec item.)

## 7. Conformance tiers (summary)

See [CONFORMANCE.md](../CONFORMANCE.md) for the checklist.

- **L0** — signed record (`aar`, `subject`, `principal`, `task`, `verdict`, `reason`, `issued`,
  `sig`) that verifies. Point-to-point floor.
- **L1** — `ground_truth` present, **and** `checks` present + well-formed when it is
  `confirmed`/`contradicted` (evidence-committed, not asserted).
- **L2** — independent verifier (`verifier.id` present, `≠ subject`) **and** evidence-backed
  ground_truth (L1). `verifier.independence` is **disclosed**. `quality` is advisory and does NOT
  gate L2.
- **L3** — tamper-evident history (`prior` chain and/or transparency-log `log` commitment). This is
  what protects L0–L2 records from retroactive rewrite after a key/domain compromise.

## 8. Relationship to other work

- **A2A / NANDA / IETF SD-JWT Agent Cards** — identity & discovery. AAR sits on top.
- **AVL** — the *view* layer for sites. AAR is the *proof* layer for actions. Sibling specs.
- **MCP / control planes** — the *access* layer. AAR is the *proof* layer. Composable.

## 9. Open questions (v0.02 → next)

- **Grant record** (the inverse of attestation): a signed, short-TTL capability grant —
  "`subject` may do scope Y under policy Z until time T" — and a `grant_ref` on the AAR, so
  off-goal becomes "actual diverged from granted scope." (Optional `grant_ref` is the next increment.)
- Canonical, machine-bindable `task.claim` (vs free text) so a check reproduces *this* claim.
- `verifier` model/prompt version + policy hash, so verdict drift is visible.
- Key rotation / revocation for `did:web`.
- Negative claims ("did NOT access prod") — absence-of-evidence handling.
- Full RFC 8785 number handling; transparency-log binding details for L3.
