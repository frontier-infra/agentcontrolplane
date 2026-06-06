# AAR fixtures

Conformance test vectors for the validator.

- `valid/` — records that MUST pass at the level noted in the record/use case.
- `invalid/` — records that MUST fail. Each carries a `_invalid_reason` key explaining
  why (the `_`-prefixed key is an out-of-band annotation, not part of the AAR record).

## v0.1 caveat — signatures are placeholders

`sig.value` in these fixtures is a literal placeholder (`PLACEHOLDER-…`), not a real
Ed25519 signature, because real signing requires a keypair + a strict JCS (RFC 8785)
canonicalizer. These fixtures therefore exercise **structure and rules** (`record.*`,
`ground_truth.*`, `independence.*`, signing-algorithm policy) but **not** live signature
verification.

The next artifact is a tiny signing/verifying tool (sibling to `@frontier-infra/avl`) that
will (a) emit real signed vectors here, and (b) publish a matching
`/.well-known/did.json` public key so the whole chain in §4 of the spec is end-to-end
checkable.
