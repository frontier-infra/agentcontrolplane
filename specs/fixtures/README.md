# AAR fixtures

Conformance test vectors for the validator.

- `valid/` — records that MUST pass at the level noted in the record/use case.
- `invalid/` — records that MUST fail. Each carries a `_invalid_reason` key explaining
  why (the `_`-prefixed key is an out-of-band annotation, not part of the AAR record).

## These are real signatures

The `valid/` records and `invalid/self-verified.json` carry **real Ed25519 signatures**
produced by `tools/aar.mjs`, verifiable offline against the bundled public key at
[`.well-known/did.json`](.well-known/did.json):

```bash
node tools/aar.mjs verify specs/fixtures/valid/helpdesk-ack.json \
  --did-json specs/fixtures/.well-known/did.json
# → L0 sig valid, L1 ground_truth, L2 quality + independent  ⇒ conformance: L2
```

Notes:

- All test vectors are signed with **one shared test key** so they verify offline; the
  vectors keep realistic `sig.by` DIDs (e.g. `did:web:titaniumcomputing.com`), and
  `--did-json` overrides resolution for offline checking. In production, `verify` resolves
  `sig.by` over `did:web` (`https://<domain>/.well-known/did.json`) instead.
- The **private** signing key is gitignored (`secrets/`) and never published — anyone can
  *verify* these vectors, no one can *forge* new ones. That asymmetry is the whole point.
- `invalid/symmetric-mac.json` intentionally keeps a non-Ed25519 `sig.alg` to exercise the
  L0 rejection; it is not signed.
