# RiftTheory

RiftTheory is a League of Legends draft analysis desktop app. It combines
statistical pick and matchup estimates with a Strategy workspace for draft
order, team plans, champion capabilities and alternative picks.

The statistical ratings are estimates, not calibrated win probabilities. The
Strategy workspace screens a bounded set of legal lines; it does not solve the
complete draft game tree.

## Develop

```sh
bun install
bun run dev
bun run typecheck
```

The Windows desktop app uses Tauri. Releases are published at
[RiftTheory releases](https://github.com/Hazejy/RiftTheory/releases).

See the repository's `THIRD_PARTY_NOTICES.md` for upstream code and data
attribution.
