# AAR Conformance

Conformance is layered so an agent runtime can become accountable in small, useful steps —
the same staging AVL uses. Each level is a strict superset of the one below.

## Levels

| Level | Required | Purpose |
|---|---|---|
| **L0** | a signed record that verifies | Anyone can confirm *who vouched for this outcome*, untampered. The floor. |
| **L1** | L0 + `ground_truth` | The claim was checked against **real system state**, not just self-report. |
| **L2** | L1 + `quality` + independent verifier | Un-gameable, real-value proof: a checker the agent doesn't control, grading substance. |
| **L3** | L2 + tamper-evident history | Audit-grade: a record's past can't be silently rewritten or dropped. |

## Required checks

### L0 — Signed record
- `aar == "0.1"`.
- `subject`, `principal` present and are DIDs.
- `task.id` and `task.claim` present.
- `verdict ∈ {verified, not_verified, unclear}`.
- `reason` present.
- `issued` is RFC 3339 UTC.
- `sig.alg == "Ed25519"`, `sig.by` is a DID, `sig.value` is base64url.
- The signature verifies over the JCS-canonicalized record (minus `sig`) against the
  public key resolved from `sig.by` (§4 of the spec). **A symmetric MAC fails L0.**

### L1 — Ground truth
- `ground_truth ∈ {confirmed, contradicted, unchecked}` present.
- When a ground-truth source was available, the verifier MUST let it override the agent's
  own assertion (claim says success, state says otherwise ⇒ `contradicted`).

### L2 — Independent, quality-graded
- `quality ∈ {substantive, shallow, none}` present.
- `verifier.id` present and **`verifier.id != subject`**.
- `verifier.independent == true` (the verifier is not controlled by the agent being judged).

### L3 — Tamper-evident
- At least one of:
  - `prior` — hash of the previous record from this `subject` (a verifiable chain), or
  - `log` — a transparency-log receipt: a signed `{ hash, timestamp }` commitment to an
    append-only log. Only the **commitment** is logged; record contents stay point-to-point.

## Security

- A record may carry only information the signer is authorized to disclose. Prefer
  redaction/selective disclosure of `reason` over leaking sensitive evidence.
- Verifying a record MUST NOT require any capability to issue one (no symmetric secrets in
  portable records).
- `unchecked` is not a pass. Consumers SHOULD treat `ground_truth: unchecked` and
  `verdict: unclear` as weaker than a confirmed verdict, not equivalent to success.
- L3 logs prove ordering and existence; they are not a place to store payloads.

## Validator

A first-party validator CLI is planned (sibling to `@frontier-infra/avl`). Until then,
conformance is checked against the fixtures:

```text
specs/fixtures/valid/      # records that MUST pass at the stated level
specs/fixtures/invalid/    # records that MUST fail, with the reason in a top comment
```

Check groups (planned): `record.*`, `signature.*`, `ground_truth.*`, `independence.*`,
`log.*`.
