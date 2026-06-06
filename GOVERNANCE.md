# AAR Governance

AAR is an open specification and reference-implementation project. Governance keeps the
spec narrow, neutral, and friendly to independent implementations — so it can be adopted,
not owned.

## Principles

- **Narrow on purpose.** AAR specifies the attestation (proof) record and the grant
  boundary — nothing more. Identity, discovery, transport, and capability description are
  *adopted* from A2A / DID / IETF work, never re-invented.
- **Verifiable, not trusted.** A record's value comes from a signature anyone can check,
  not from any central authority's say-so.
- **Neutral between authorities.** No conformant deployment is required to trust a
  particular registry, vendor, or root. Cross-authority verification is the whole point.
- **Conformance must be testable.** Every normative rule ships with a fixture.
- **Backward compatibility over novelty.** New fields are additive; tiers only get added
  above, never re-defined below.
- **Complement, don't compete.** AAR sits beside MCP, A2A, AVL, OpenAPI, and the
  access-control planes — it is the proof layer, not a replacement for any of them.

## Proposal process

1. Open a proposal under `specs/` (or `proposals/`).
2. Include motivation, an example record, compatibility notes, and security/privacy
   considerations.
3. Add validator fixtures (`specs/fixtures/valid|invalid/`) for any normative change.
4. Discuss in issues / pull requests.
5. Promote into the main spec only after maintainer approval.

## Versioning

- The spec version is the `aar` field (`"0.1"` today).
- Conformance levels (L0–L3) are stable identifiers; their *required checks* may tighten
  only in a new spec version, with fixtures updated in lockstep.

## Stewardship

v0.x is maintainer-led to keep the surface small while the reference implementation
proves it out. A neutral home (working group / foundation) is appropriate **after** there
is a narrow, frozen spec with more than one interoperating implementation — running code
first, wrapper second.
