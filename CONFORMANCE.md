# AAR Conformance

Conformance is layered so an agent runtime can become accountable in small, useful steps.
Each level is a strict superset of the one below. (Spec version `0.02`.)

> **Not a Machine deployment.** This is the **AAR** record-conformance ladder (signed attestation
> records), *not* [The Machine](https://github.com/frontier-infra/the-machine)'s six-box *deployment*
> conformance — different ladder, same L0–L3 naming. The Machine's `kit` does not meaningfully score
> this repo: agentcontrolplane is the attestation **library** that Machine deployments use to emit
> signed AARs, not a deployment itself.

## Levels

| Level | Required | Purpose |
|---|---|---|
| **L0** | a signed record that verifies | who vouched, untampered. The point-to-point floor. |
| **L1** | L0 + `ground_truth` + **`checks` evidence** | the verdict's basis is *committed and inspectable*, not just asserted. |
| **L2** | L1 + independent verifier (`id ≠ subject`) | no self-grading. `quality` is advisory and does NOT gate. |
| **L3** | L2 + tamper-evident history | a record's past can't be silently rewritten after a key/domain compromise. |

## Required checks

### L0 — Signed record
- `aar == "0.02"`; `subject`, `principal` are DIDs; `task.id` + `task.claim` present.
- `verdict ∈ {verified, not_verified, unclear}`; `reason` present; `issued` is RFC 3339 UTC.
- `sig.alg == "Ed25519"`, `sig.by` is a DID, `sig.value` is base64url, and the signature
  verifies over the JCS-canonicalized record (minus `sig` and `_`-keys). **A symmetric MAC fails L0.**

### L1 — Ground truth, evidence-committed
- `ground_truth ∈ {confirmed, contradicted, unchecked}`.
- **When `confirmed` or `contradicted`, ≥1 `checks` entry is required**, each with `source`,
  `query`, `observed_at` (RFC 3339), and `response_sha256` (base64url SHA-256 over the canonical
  preimage `{query, response, observed_at}`).
- **Custody:** the issuer MUST retain the preimage and provide it to an authorized party on
  request. The record commits to evidence; it does not conceal it. The preimage travels
  point-to-point (may hold secrets/PII); only the hash is in the portable record.
- `unchecked` is not a pass — it is honest absence of a ground-truth source.

### L2 — Independent verifier
- `verifier.id` present and **`verifier.id != subject`** (the verifier is not the agent).
- L1 satisfied (evidence-backed ground truth).
- `verifier.independence ∈ {same_principal, separate_principal, third_party}` is **disclosed**.
  It does not gate L2, but a consumer policy MAY require `separate_principal`/`third_party` for
  "audit-grade." `same_principal` = honest organizational attestation.
- `quality` is **advisory metadata only** — it never gates conformance.

### L3 — Tamper-evident
- At least one of:
  - `prior` — hash of the previous record from this `subject` (a verifiable chain), or
  - `log` — a transparency-log receipt: a signed `{ hash, timestamp }` commitment to an
    append-only log. Only the **commitment** is logged; record contents stay point-to-point.
- L3 is what protects L0–L2 records from retroactive forgery if the signer's `did:web`
  domain/key is later compromised — it pins records in time.

## Security / honesty notes
- AAR proves provenance and makes verdicts inspectable + fabrication-evident; it does **not**
  make a verdict true when the *signer is the adversary*. A fully-compromised principal can sign
  a false record — disclosed via `independence`, inspectable via `checks`, non-rewritable at L3.
- Verifying a record MUST NOT require any capability to issue one (no symmetric secrets).
- Prefer redacted `excerpt` + hash commitment over dumping sensitive evidence into a record.

## Validator

A zero-dependency reference signer/verifier ships in [`tools/aar.mjs`](tools/aar.mjs) (Node ≥ 20):

```bash
node tools/aar.mjs verify specs/fixtures/valid/helpdesk-ack.json \
  --did-json specs/fixtures/.well-known/did.json        # → L2 (same_principal disclosed)
node tools/aar.mjs verify specs/fixtures/valid/fabrication-caught.json \
  --did-json specs/fixtures/.well-known/did.json        # → L2 (third_party; contradicted)
node tools/aar.mjs verify specs/fixtures/invalid/self-verified.json \
  --did-json specs/fixtures/.well-known/did.json        # → L1 (sig valid, fails L2: id == subject)
```

Fixtures pin conformance:

```text
specs/fixtures/valid/      # MUST verify at the stated level (real signatures)
specs/fixtures/invalid/    # MUST fail; `_invalid_reason` says why
specs/fixtures/.well-known/did.json   # the test public key the vectors verify against
```

Planned: optional `--preimage` hash re-check, transparency-log (L3) checks, full RFC 8785 numbers.
