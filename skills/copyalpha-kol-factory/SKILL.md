---
name: copyalpha-kol-factory
description: Install and use CopyAlpha through npx to harvest tweets from a specific Twitter/X user, distill their trading views, and forge a brand new KOL Skill. Use when the user wants to turn @username into a reusable skill, refresh that skill from fresh tweets, or bootstrap a local KOL-harvesting workspace without cloning the repo manually.
---

# CopyAlpha KOL Factory

Use this skill when the user wants to:
- install a Codex skill through `npx copyalpha install-skill`
- harvest tweets from a specific Twitter/X account
- distill that account into a new skill under `generated-skills/kol-<username>`
- refresh or rebuild an existing KOL skill from newer tweets

## Required inputs

- Twitter/X username
- `TWITTER_BEARER_TOKEN`
- `ANTHROPIC_API_KEY`

`NITTER_INSTANCES` and OKX keys are optional.

## Workflow

1. Reuse an existing CopyAlpha workspace if one already exists.
2. Otherwise run `scripts/bootstrap_copyalpha.sh <workspace_dir>`.
3. Make sure `<workspace_dir>/.env` contains the required keys before harvesting.
4. Run `scripts/materialize_kol.sh <workspace_dir> @username [history_depth]`.
5. Report the generated files in `generated-skills/kol-<username>/`.

## Bundled scripts

- `scripts/bootstrap_copyalpha.sh`: creates a CopyAlpha workspace through `npx copyalpha@latest init`, prepares `.env`, and creates the `generated-skills` directory.
- `scripts/materialize_kol.sh`: runs `npx copyalpha@latest forge materialize` for one username.

## Behavior notes

- Prefer the existing workspace over creating a fresh one.
- `forge materialize` both tracks the account and scrapes tweets before forging the new skill.
- If the user names multiple KOLs, process them one by one.
- Set `COPYALPHA_NPX_SPEC` if you need to override the package source, for example to test a GitHub branch before npm publish.
- These scripts use network and package installation, so request approval when needed.
