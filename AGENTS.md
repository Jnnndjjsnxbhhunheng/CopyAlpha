# CopyAlpha — Agent Instructions

This repository is both:

- a **skill repository** exposing installable skills under `skills/`
- a **CLI/tooling repository** for harvesting tweets and forging KOL skills

## Available Skills

| Skill | Purpose | When to Use |
|---|---|---|
| `copyalpha-kol-factory` | Turn a Twitter/X KOL into a reusable local skill | User wants to harvest a KOL, distill trading style, forge a new `kol-*` skill, and install it into Codex / Claude Code / OpenClaw / bundle directories |

## Architecture

- `skills/` — installable agent skills discovered by tools like `npx skills add`
- `src/` — TypeScript CLI and library code
- `generated-skills/` — locally generated `kol-*` skill bundles
- `.codex/INSTALL.md` — Codex-native installation instructions

## Installation Model

- `npx skills add Jnnndjjsnxbhhunheng/CopyAlpha` installs the skill repository form of CopyAlpha
- `npx copyalpha@latest ...` installs or runs the CLI package after npm publication
- generated `kol-*` skills are local outputs and are **not** published individually
