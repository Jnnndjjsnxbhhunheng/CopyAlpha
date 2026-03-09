# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CopyAlpha (抄作业大师) is an AI-native system that transforms Twitter KOL insights into reusable AI Skills. It extracts structured knowledge from KOL tweets, packages them as callable Skills, and enables AI Agents to make trading decisions by combining KOL expertise with on-chain data from OKX OnchainOS.

**This is NOT a trading bot** — it's a Skill factory. KOL Skills are persistent, reusable knowledge assets, not one-off signals.

## Architecture: 4-Layer Pipeline

```
Twitter KOL Tweets → [HARVEST] → [DISTILL] → [FORGE] → [CONSULT] → Analysis Report
```

### Layer Responsibilities

| Layer | Path | Purpose |
|-------|------|---------|
| **Harvest** | `src/harvest/` | Twitter data collection (API → Nitter → browser fallback) |
| **Distill** | `src/distill/` | LLM-powered signal extraction, profile building, pattern mining, backtesting |
| **Forge** | `src/forge/` | Package knowledge into KOL Skills (SKILL.md + JSON files) |
| **Consult** | `src/consult/` | Load KOL Skills + call OnchainOS APIs → synthesize trading analysis |
| **Storage** | `src/storage/` | SQLite persistence (better-sqlite3) |

### Generated Output

Each KOL Skill lives in `generated-skills/kol-{username}/` with:
- `SKILL.md` — AI-readable skill description
- `profile.json` — KOL metadata (win rate, style, credibility)
- `knowledge.json` — Knowledge graph (token opinions, macro views)
- `signals-history.json` — Historical signals + backtest results
- `style-guide.json` — Analysis style summary

## Tech Stack

- **Runtime**: Node.js + TypeScript (strict mode)
- **Framework**: OKX OnchainOS Skills standard
- **LLM**: Anthropic Claude Sonnet (signal extraction & synthesis)
- **Storage**: SQLite (better-sqlite3)
- **Twitter**: twitter-api-v2 (primary), cheerio/Nitter (fallback)
- **Templating**: Handlebars (SKILL.md generation)
- **Scheduling**: node-cron (incremental monitoring)

## OnchainOS Integration

The Consult layer bridges to these OnchainOS Skills for on-chain validation:
- `okx-wallet-portfolio` — Portfolio data
- `okx-dex-market` — Prices, volume, smart money flows
- `okx-dex-token` — Token metadata, holder analysis
- `okx-dex-swap` — Trade execution (later phase)

## Key Data Types (types.ts)

- **KOLProfile** — Trading style, risk appetite, sectors, performance metrics, credibility scores
- **TradingSignal** — Token, sentiment, price target, confidence, timeframe
- **KOLKnowledge** — Trading thesis, token opinions, macro views, KOL network
- **BacktestResult** — Signal validation against historical price data
- **AnalysisReport** — Final output: recommendation + KOL consensus + on-chain validation

## CLI Commands

```bash
# Harvest
copyalpha harvest add @username       # Track a KOL + scrape history
copyalpha harvest remove @username    # Stop tracking
copyalpha harvest status              # Show all tracked KOLs
copyalpha harvest monitor             # Start incremental polling

# Forge
copyalpha forge build @username       # Generate/update single KOL Skill
copyalpha forge all                   # Rebuild all KOL Skills

# Consult
copyalpha consult analyze $TOKEN [question]  # Full analysis report
copyalpha consult ask @username "question"   # Ask specific KOL
copyalpha consult consensus $TOKEN           # Multi-KOL agreement
copyalpha consult critique "trade idea"      # KOL feedback on idea
copyalpha consult recommend                  # Top opportunities
copyalpha consult leaderboard                # KOL performance ranking
```

## Project Structure

```
src/                  # Production code
tests/                # Mirrored test files (e.g., parser.test.ts)
assets/               # Static assets
scripts/              # Utility scripts
docs/                 # Extended documentation
generated-skills/     # Output: generated KOL Skills
```

- Maintain three-level doc map: root global map → module README/MODULE.md → file-level header declarations.
- Each module's README.md must list: responsibilities, public interfaces, core files, upstream/downstream dependencies.
- Important source files must declare: purpose, direct dependencies, inputs/outputs, and which docs to update when changed.

## Hard Coding Constraints

- File size: **≤ 800 lines**
- Function size: **≤ 30 lines**
- Nesting depth: **≤ 3 levels**
- Major branches per function: **≤ 3**
- Small, single-purpose modules with explicit boundaries.

## Naming Conventions

- Files (TS): kebab-case (e.g., `signal-extractor.ts`)
- Files (Python): snake_case (e.g., `signal_extractor.py`)
- Classes/Types: PascalCase
- Functions (JS/TS): camelCase
- Functions (Python): snake_case
- Constants: UPPER_SNAKE_CASE

## Build & Dev Commands

```bash
make install          # npm install
make build            # npx tsc
make test             # npx jest
make lint             # npx eslint src/ --ext .ts
make dev              # npx ts-node src/cli.ts

# Or via npm scripts
npm run build         # tsc
npm test              # jest
npm run lint          # eslint

# Run a single test file
npx jest tests/parser.test.ts

# CLI usage
npx ts-node src/cli.ts harvest add @username
npx ts-node src/cli.ts forge build username
npx ts-node src/cli.ts consult analyze TOKEN
```

## Workflow Rules

- **Filesystem is the single source of truth** — never rely on chat memory for ongoing work.
- Store active work in `plan.md` or `plans/` so new sessions can resume from disk.
- After every code change, verify related docs/interfaces still match implementation. Update both in the same change.
- Context loading: bug fixes → read target module + direct deps only; architecture changes → read global map first.

## Commits & PRs

- Conventional Commits: `feat: add config loader`, `fix: handle null token`
- PRs: short summary, verification steps, linked issues, screenshots for UI changes.
- Tests required for each new feature; regression tests for each bug fix.

## Security

- Never commit secrets, tokens, or machine-specific settings.
- Add new env vars to `.env.example` and document in README.md.

## PRD Reference

Full product requirements are in `PRD-CopyAlpha-v2.md`. Consult it for detailed type definitions, prompt templates, data schemas, and implementation phases.
