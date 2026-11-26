# @davy121/opencode-monitor

Monitor tool for OpenCode v2: watch a background command and wake the agent with a notification on each matching line.

Status: in development. The plan is in [docs/especificacao.md](docs/especificacao.md); the architecture is in [docs/architecture.md](docs/architecture.md) and the rules in [AGENTS.md](AGENTS.md).

## Install

```sh
opencode plugin add @davy121/opencode-monitor
```

## Releases

Every push to `main` runs the checks, then the release workflow computes the next version from the
[Conventional Commits](https://www.conventionalcommits.org/) since the last tag with
[git-cliff](https://git-cliff.org), updates `package.json` and `CHANGELOG.md`, publishes to npm, pushes the tag and
creates the GitHub release. `feat` bumps the minor and `fix`/`perf` bump the patch; other types do not release.
