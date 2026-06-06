# Changelog

Deliberately **slow, incremental** versioning (`0.0x`). Small, defensible steps — a spec
people have to trust earns its version numbers.

## 0.02 — 2026-06-05
First real iteration, in response to an adversarial review ("the signature proves *who*, not
*what*"). The theme: **provenance → inspectable truth**, without ballooning the format.

- **Evidence commitment (`checks[]`).** `ground_truth: confirmed | contradicted` now MUST carry
  a `checks` entry — `source`, `query`, `observed_at`, `response_sha256` (+ optional redacted
  `excerpt`). The verdict's basis is committed and inspectable; an authorized party can re-run
  it without trusting the verifier. Normative custody rule: the issuer retains the preimage and
  provides it on request (commit, don't conceal).
- **`quality` demoted to advisory.** A small model's `substantive/shallow/none` grade no longer
  gates L2. Only structural facts (independence + evidence-backed ground truth) gate conformance.
- **Graded independence.** `verifier.independent: true` (an unverifiable boolean) → disclosed
  `verifier.independence: same_principal | separate_principal | third_party`. `same_principal` is
  honest organizational attestation; audit-grade wants `separate_principal`/`third_party`.
- **Threat model (spec §4)** added. Honest about the limit: a fully-compromised principal can
  still sign a false record — AAR makes that disclosed, inspectable, and (at L3) non-rewritable.
- **Honest positioning.** Dropped "un-gameable." AAR makes verdicts *inspectable and
  fabrication-evident*, not magically true. L3 reframed as load-bearing (it protects L0–L2 from
  retroactive forgery after a domain/key compromise), not a compliance ornament.
- Reference tool (`tools/aar.mjs`) enforces the above; all fixtures re-signed under v0.02.

## 0.01 — 2026-06-05
Initial seed (originally labeled `0.1`). Extracted the record from ArgentOS's "Angel on the
Shoulder" verifier (`TaskVerdict`) + Accountability Score: the AAR record, L0–L3 conformance,
Ed25519 + minimal-JCS signing, `did:web` identity, and a zero-dependency reference
signer/verifier. Established the repo as a sibling of `frontier-infra/avl`.
